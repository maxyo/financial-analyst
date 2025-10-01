import { computeAccurateFunding } from '../lib/funding';
import { getRepositories } from '../repositories';

import type { FundingOptions, Summary } from '../api/tinkoff/types';

// NOTE: This service encapsulates the logic of generating instrument summaries.
// It replaces the logic that previously lived in api/tinkoff/summary.ts.

class SummaryService {
  /**
   * Get underlying summary by ticker from DB in DB-only mode.
   * Throws if the underlying cannot be determined.
   */
  async getUnderlyingSummaryByTicker(ticker: string): Promise<Summary> {
    const repos = getRepositories();
    const s = (repos as any).summaries?.getByTicker?.(ticker) as Summary | undefined;
    if (s) return s;
    throw new Error('Не удалось определить базовый актив в режиме БД');
  }

  private async getInstrumentByTicker(ticker: string) {
    const repos = getRepositories();
    const inst = repos.instruments.findByQuery(ticker);
    if (!inst) {
      throw new Error(`Инструмент не найден по запросу: ${ticker}`);
    }
    return inst;
  }

  private getTodayIntradayStatsFromDb(symbol: string) {
    const repos = getRepositories();
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const fromMs = from.getTime();
    const toMs = now.getTime();
    const candles = repos.candles.getCandles(symbol.toUpperCase(), '1m', Math.trunc(fromMs), Math.trunc(toMs));

    let dayHigh: number | undefined;
    let dayLow: number | undefined;
    let dayOpen: number | undefined;
    let volumeSum = 0;
    let vwap: number | undefined;
    if (candles.length > 0) {
      const hs: number[] = [];
      const ls: number[] = [];
      let vSum = 0;
      let pvSum = 0;
      for (const c of candles) {
        const h = c.h;
        const l = c.l;
        const close = c.c;
        const vol = Number(c.v || 0);
        if (h != null) hs.push(h);
        if (l != null) ls.push(l);
        volumeSum += vol;
        if (close != null && Number.isFinite(close) && vol > 0) {
          vSum += vol;
          pvSum += close * vol;
        }
      }
      if (hs.length) dayHigh = Math.max(...hs);
      if (ls.length) dayLow = Math.min(...ls);
      const first = candles[0];
      dayOpen = first ? first.o : undefined;
      if (vSum > 0) vwap = pvSum / vSum;
    }
    return { dayHigh, dayLow, dayOpen, volumeSum, vwap } as const;
  }

  private getLastPriceFromDb(symbol: string): number | undefined {
    const repos = getRepositories();
    const nowMs = Date.now();
    // Try today first
    const fromToday = new Date();
    fromToday.setHours(0, 0, 0, 0);
    let candles = repos.candles.getCandles(symbol.toUpperCase(), '1m', Math.trunc(fromToday.getTime()), Math.trunc(nowMs));
    if (candles.length === 0) {
      // Fallback to last 24h
      candles = repos.candles.getCandles(symbol.toUpperCase(), '1m', Math.trunc(nowMs - 24 * 3600 * 1000), Math.trunc(nowMs));
    }
    const last = candles.length > 0 ? candles[candles.length - 1] : undefined;
    return last?.c;
  }

  private computePremiumAndEstimate(vwap?: number, lastPrice?: number) {
    let premium: number | undefined;
    let fundingRateEst: number | undefined;
    if (vwap != null && lastPrice != null && vwap > 0) {
      premium = (lastPrice - vwap) / vwap;
      const raw = premium;
      const clamped = Math.max(-0.003, Math.min(0.003, raw));
      fundingRateEst = clamped;
    }
    return { premium, fundingRateEst } as const;
  }

  private getNextFundingWindow() {
    // Next funding accrual once per day at 19:00 MSK (UTC+3), i.e., 16:00 UTC
    const utcNow = new Date();
    const year = utcNow.getUTCFullYear();
    const month = utcNow.getUTCMonth();
    const date = utcNow.getUTCDate();
    // Target today at 16:00:00 UTC
    let next = new Date(Date.UTC(year, month, date, 16, 0, 0, 0));
    if (utcNow.getTime() >= next.getTime()) {
      // If already past today's cut, use tomorrow 16:00 UTC
      next = new Date(Date.UTC(year, month, date + 1, 16, 0, 0, 0));
    }
    const nextFundingTime = next.toISOString();
    const diffMs = next.getTime() - utcNow.getTime();
    const minutesToFunding = Math.max(0, Math.round(diffMs / 60000));
    return { nextFundingTime, minutesToFunding } as const;
  }

  /**
   * Build a summary for a ticker using DB sources only (prices, candles, funding rates).
   * Optionally accepts funding window bounds (MSK time) used by the generic funding model.
   */
  async getSummaryByTicker(
    ticker: string,
    windowStart?: string,
    windowEnd?: string,
  ): Promise<Summary> {
    const instrument = await this.getInstrumentByTicker(ticker);
    const figi = instrument.figi;
    const lot = instrument.lot;
    const name = instrument.name;

    const lastPrice = this.getLastPriceFromDb(instrument.ticker);
    const bestBid = undefined;
    const bestAsk = undefined;
    const spread = undefined;

    const { dayHigh, dayLow, dayOpen, volumeSum, vwap } = this.getTodayIntradayStatsFromDb(instrument.ticker);

    const changeAbs = lastPrice != null && dayOpen != null ? lastPrice - dayOpen : undefined;
    const changePct = changeAbs != null && dayOpen ? changeAbs / dayOpen : undefined;

    const { premium, fundingRateEst } = this.computePremiumAndEstimate(vwap, lastPrice);

    // Funding window configuration (MoEx daily window)
    // Default funding window per requirement: 10:00–18:50 MSK
    const ws = windowStart || '10:00';
    const we = windowEnd || '18:50';

    // DB-only: avoid external MoEx dependency; use generic funding only
    const internalFundingOpts: FundingOptions = {
      mode: 'generic',
      windowStart: ws,
      windowEnd: we,
    };

    // Infer instrumentType for futures if possible based on classCode
    const instrumentType = /FUT/i.test(String(instrument.classCode || '')) ? 'futures' : undefined;
    const instrumentForFunding: any = { ...instrument, instrumentType };

    const { fundingPerUnit, fundingD, fundingL1, fundingL2, fundingMode } = await computeAccurateFunding(
      instrumentForFunding,
      figi || instrument.ticker,
      lastPrice,
      vwap,
      internalFundingOpts,
    );

    const { nextFundingTime, minutesToFunding } = this.getNextFundingWindow();

    return {
      name,
      ticker: String(instrument.ticker).toUpperCase(),
      figi,
      lot,
      lastPrice,
      bestBid,
      bestAsk,
      spread,
      dayHigh,
      dayLow,
      dayOpen,
      changeAbs,
      changePct,
      volumeSum,
      vwap,
      premium,
      fundingRateEst,
      nextFundingTime,
      minutesToFunding,
      fundingPerUnit,
      fundingD,
      fundingL1,
      fundingL2,
      fundingMode,
    };
  }
}

export const summaryService = new SummaryService();

// Backward-compatible function exports
export async function getUnderlyingSummaryByTicker(ticker: string): Promise<Summary> {
  return summaryService.getUnderlyingSummaryByTicker(ticker);
}

export async function getSummaryByTicker(
  ticker: string,
  windowStart?: string,
  windowEnd?: string,
): Promise<Summary> {
  return summaryService.getSummaryByTicker(ticker, windowStart, windowEnd);
}
