import { Injectable } from '@nestjs/common';

import { CandlesNestService } from './candles.service';
import { FundingNestService } from './funding.service';
import { Summary } from '../../../types/summary';
import { InstrumentsRepository } from '../repositories/instruments.repository';


@Injectable()
export class SummaryNestService {
  constructor(
    private readonly funding: FundingNestService,
    private readonly instrumentsRepo: InstrumentsRepository,
    private readonly candlesService: CandlesNestService,
  ) {}

  async getUnderlyingSummaryByTicker(ticker: string): Promise<Summary> {
    const s = await this.getSummaryByTicker(ticker);
    if (s) return s;
    throw new Error('Не удалось определить базовый актив в режиме БД');
  }

  private async getInstrumentByTicker(ticker: string) {
    const inst = await this.instrumentsRepo.findByQuery(ticker);
    if (!inst) {
      throw new Error(`Инструмент не найден по запросу: ${ticker}`);
    }
    return inst;
  }

  private async getTodayIntradayStatsFromDb(symbol: string) {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const fromMs = from.getTime();
    const toMs = now.getTime();
    const candles = await this.candlesService.getCandlesByTicker(
      symbol.toUpperCase(),
      '1m',
      Math.trunc(fromMs),
      Math.trunc(toMs),
    );

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

  private async getLastPriceFromDb(symbol: string) {
    const nowMs = Date.now();
    const fromToday = new Date();
    fromToday.setHours(0, 0, 0, 0);
    let candles = await this.candlesService.getCandlesByTicker(
      symbol.toUpperCase(),
      '1m',
      Math.trunc(fromToday.getTime()),
      Math.trunc(nowMs),
    );
    if (candles.length === 0) {
      candles = await this.candlesService.getCandlesByTicker(
        symbol.toUpperCase(),
        '1m',
        Math.trunc(nowMs - 24 * 3600 * 1000),
        Math.trunc(nowMs),
      );
    }
    const last = candles.length > 0 ? candles[candles.length - 1] : undefined;
    return last?.c;
  }

  private getNextFundingWindow() {
    const utcNow = new Date();
    const year = utcNow.getUTCFullYear();
    const month = utcNow.getUTCMonth();
    const date = utcNow.getUTCDate();
    let next = new Date(Date.UTC(year, month, date, 16, 0, 0, 0));
    if (utcNow.getTime() >= next.getTime()) {
      next = new Date(Date.UTC(year, month, date + 1, 16, 0, 0, 0));
    }
    const nextFundingTime = next.toISOString();
    const diffMs = next.getTime() - utcNow.getTime();
    const minutesToFunding = Math.max(0, Math.round(diffMs / 60000));
    return { nextFundingTime, minutesToFunding } as const;
  }

  async getSummaryByTicker(
    ticker: string,
    _windowStart?: string,
    _windowEnd?: string,
  ): Promise<Summary> {
    const instrument = await this.getInstrumentByTicker(ticker);
    const figi = instrument.figi;
    const lot = instrument.lot;
    const name = instrument.name;

    const lastPrice = await this.getLastPriceFromDb(instrument.ticker);
    const bestBid = undefined;
    const bestAsk = undefined;
    const spread = undefined;

    const { dayHigh, dayLow, dayOpen, volumeSum, vwap } =
      await this.getTodayIntradayStatsFromDb(instrument.ticker);

    const changeAbs =
      lastPrice != null && dayOpen != null ? lastPrice - dayOpen : undefined;
    const changePct =
      changeAbs != null && dayOpen ? changeAbs / dayOpen : undefined;

    const { nextFundingTime, minutesToFunding } = this.getNextFundingWindow();

    void _windowStart;
    void _windowEnd;

    const funding = await this.funding.getFunding(instrument, new Date());
    const fundingRateEst =
      funding && funding.fundingPerUnit != null ? funding.fundingPerUnit : undefined;

    return {
      name: name ?? 'Unknown',
      ticker: String(instrument.ticker).toUpperCase(),
      figi: figi ?? 'Unknown',
      lot: lot ?? 1,
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
      fundingRateEst,
      nextFundingTime,
      minutesToFunding,
    };
  }
}
