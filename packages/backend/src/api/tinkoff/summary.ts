import { getApi } from './client';
import { Helpers, CandleInterval, InstrumentIdType } from './index';
import { computeAccurateFunding } from '../../lib/funding';

import type { FundingOptions, Summary } from './types';

export async function findInstrument(query: string) {
  const api = getApi();
  const res = await api.instruments.findInstrument({ query });
  return res.instruments[0];
}

export async function getUnderlyingSummaryByTicker(
  ticker: string,
): Promise<Summary> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    ) || found.instruments[0];
  if (!instrument) {
    throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  }

  try {
    const futureResp = await api.instruments.futureBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
      classCode: (instrument).classCode || '',
      id: instrument.ticker,
    });
    const fut = futureResp?.instrument;
    const posUid = fut?.basicAssetPositionUid;
    if (!posUid) throw new Error('basicAssetPositionUid not found');

    const instrResp = await api.instruments.getInstrumentBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_POSITION_UID,
      id: posUid,
    });
    const under = (instrResp)?.instrument;
    if (!under || !under.ticker) {
      throw new Error('Underlying instrument not found');
    }

    return await getSummaryByTicker(under.ticker);
  } catch (e) {
    throw new Error(
      `Не удалось определить базовый актив: ${(e as any)?.message || e}`,
    );
  }
}

export async function getInstrumentByTicker(ticker: string) {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    ) || found.instruments[0];
  if (!instrument) {
    throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  }
  return instrument;
}

export async function getLastPriceAndOrderBook(figi: string) {
  const api = getApi();
  const [lastPriceResp, orderBook] = await Promise.all([
    api.marketdata.getLastPrices({
      figi: [],
      instrumentId: [figi],
      lastPriceType: 0,
    }),
    api.marketdata.getOrderBook({ instrumentId: figi, depth: 10 }),
  ]);

  const lastPrice = lastPriceResp.lastPrices?.[0]?.price
    ? Helpers.toNumber(lastPriceResp.lastPrices[0].price)
    : undefined;

  let bestBid: number | undefined;
  let bestAsk: number | undefined;
  if (orderBook) {
    bestBid = orderBook.bids?.[0]?.price
      ? Helpers.toNumber(orderBook.bids[0].price)
      : undefined;
    bestAsk = orderBook.asks?.[0]?.price
      ? Helpers.toNumber(orderBook.asks[0].price)
      : undefined;
  }

  const spread =
    bestBid != null && bestAsk != null ? bestAsk - bestBid : undefined;

  return { lastPrice, bestBid, bestAsk, spread } as const;
}

export async function getTodayIntradayStats(figi: string) {
  const api = getApi();
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  let dayHigh: number | undefined;
  let dayLow: number | undefined;
  let dayOpen: number | undefined;
  let volumeSum = 0;
  let vwap: number | undefined;
  try {
    const candles = await api.marketdata.getCandles({
      instrumentId: figi,
      from,
      to: now,
      interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
    });
    if (candles?.candles?.length) {
      const hs: number[] = [];
      const ls: number[] = [];
      let vSum = 0;
      let pvSum = 0;
      for (const c of candles.candles) {
        const h = Helpers.toNumber(c.high as any);
        const l = Helpers.toNumber(c.low as any);
        const close = Helpers.toNumber(c.close as any);
        const vol = Number(c.volume || 0);
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
      const first = candles.candles[0];
      dayOpen = first ? Helpers.toNumber(first.open as any) : undefined;
      if (vSum > 0) vwap = pvSum / vSum;
    }
  } catch {}
  return { dayHigh, dayLow, dayOpen, volumeSum, vwap } as const;
}

export function computePremiumAndEstimate(vwap?: number, lastPrice?: number) {
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


export function getNextFundingWindow() {
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

export async function getSummaryByTicker(
  ticker: string,
  windowStart?: string,
  windowEnd?: string,
): Promise<Summary> {
  const instrument = await getInstrumentByTicker(ticker);
  const { figi, lot, name } = instrument as any;

  const { lastPrice, bestBid, bestAsk, spread } =
    await getLastPriceAndOrderBook(figi);

  const { dayHigh, dayLow, dayOpen, volumeSum, vwap } =
    await getTodayIntradayStats(figi);

  const changeAbs =
    lastPrice != null && dayOpen != null ? lastPrice - dayOpen : undefined;
  const changePct = changeAbs != null && dayOpen ? changeAbs / dayOpen : undefined;

  const { premium, fundingRateEst } = computePremiumAndEstimate(vwap, lastPrice);

  // Funding window configuration (MoEx daily window)
  // Default funding window per requirement: 10:00–18:50 MSK
  const ws = windowStart || '10:00';
  const we = windowEnd || '18:50';

  // Always try to fetch MoEx funding per unit; k1/k2 are optional and used only by generic mode
  const internalFundingOpts: FundingOptions = {
    mode: 'moex',
    windowStart: ws,
    windowEnd: we,
  };

  const { fundingPerUnit, fundingD, fundingL1, fundingL2, fundingMode } =
    await computeAccurateFunding(
      instrument,
      figi,
      lastPrice,
      vwap,
      internalFundingOpts,
    );

  const { nextFundingTime, minutesToFunding } = getNextFundingWindow();

  return {
    name,
    ticker: (instrument as any).ticker,
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
