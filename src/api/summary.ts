import { Helpers } from 'tinkoff-invest-api';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

import { getApi } from './client';
import { computeFunding, computeL1L2, vwapInWindow } from '../lib/calculations';
import { instrumentService } from '../lib/instrument';

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
  if (!instrument)
    {throw new Error(`Инструмент не найден по запросу: ${ticker}`);}

  try {
    const { InstrumentIdType } = await import(
      'tinkoff-invest-api/dist/generated/instruments.js'
    );
    const futureResp = await api.instruments.futureBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
      classCode: (instrument as any).classCode || '',
      id: instrument.ticker,
    } as any);
    const fut =
      (futureResp as any)?.instrument ||
      (futureResp as any)?.future ||
      (futureResp as any);
    const posUid = fut?.basicAssetPositionUid;
    if (!posUid) throw new Error('basicAssetPositionUid not found');

    const instrResp = await api.instruments.getInstrumentBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_POSITION_UID,
      id: posUid,
    } as any);
    const under = (instrResp as any)?.instrument;
    if (!under || !under.ticker)
      {throw new Error('Underlying instrument not found');}

    return await getSummaryByTicker(under.ticker);
  } catch (e) {
    throw new Error(
      `Не удалось определить базовый актив: ${(e as any)?.message || e}`,
    );
  }
}

export async function getSummaryByTicker(
  ticker: string,
  fundingOpts?: FundingOptions,
): Promise<Summary> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    ) || found.instruments[0];
  if (!instrument)
    {throw new Error(`Инструмент не найден по запросу: ${ticker}`);}

  const { figi, lot, name } = instrument;

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

  const changeAbs =
    lastPrice != null && dayOpen != null ? lastPrice - dayOpen : undefined;
  const changePct =
    changeAbs != null && dayOpen ? changeAbs / dayOpen : undefined;

  let premium: number | undefined;
  let fundingRateEst: number | undefined;
  if (vwap != null && lastPrice != null && vwap > 0) {
    premium = (lastPrice - vwap) / vwap;
    const raw = premium;
    const clamped = Math.max(-0.003, Math.min(0.003, raw));
    fundingRateEst = clamped;
  }

  // Accurate MoEx funding (per 1 unit)
  let fundingPerUnit: number | undefined;
  let fundingD: number | undefined;
  let fundingL1: number | undefined;
  let fundingL2: number | undefined;
  let fundingMode: string | undefined;
  try {
    if (
      fundingOpts &&
      fundingOpts.k1 != null &&
      fundingOpts.k2 != null &&
      fundingOpts.prevBasePrice != null
    ) {
      const { L1, L2 } = computeL1L2(
        Number(fundingOpts.prevBasePrice),
        Number(fundingOpts.k1),
        Number(fundingOpts.k2),
      );
      fundingL1 = L1;
      fundingL2 = L2;
      const mode = (fundingOpts.mode || 'manual');
      fundingMode = mode;
      if (mode === 'manual' && fundingOpts.d != null) {
        fundingD = Number(fundingOpts.d);
      } else if (mode === 'currency') {
        const now2 = new Date();
        const from2 = new Date(now2);
        from2.setHours(0, 0, 0, 0);
        const candles2 = await api.marketdata.getCandles({
          instrumentId: figi,
          from: from2,
          to: now2,
          interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
        });
        const v = vwapInWindow(
          candles2?.candles || [],
          fundingOpts.windowStart,
          fundingOpts.windowEnd,
        );
        if (v != null && fundingOpts.cbr != null)
          {fundingD = v - Number(fundingOpts.cbr);}
      } else if (mode === 'generic') {
        try {
          const underlying = await instrumentService.getBaseInstrument(
            (instrument as any).uid || (instrument as any).instrumentId || figi,
          );
          let vwapF: number | undefined = undefined;
          let vwapS: number | undefined = undefined;

          try {
            const now2 = new Date();
            const from2 = new Date(now2);
            from2.setHours(0, 0, 0, 0);
            const candlesF = await api.marketdata.getCandles({
              instrumentId: figi,
              from: from2,
              to: now2,
              interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
            });
            vwapF = vwapInWindow(
              candlesF?.candles || [],
              fundingOpts.windowStart,
              fundingOpts.windowEnd,
            );
          } catch {}

          if (underlying) {
            try {
              const underId: string =
                (underlying as any).figi ||
                (underlying as any).uid ||
                (underlying as any).instrumentId;
              if (underId) {
                const now3 = new Date();
                const from3 = new Date(now3);
                from3.setHours(0, 0, 0, 0);
                const candlesS = await api.marketdata.getCandles({
                  instrumentId: underId,
                  from: from3,
                  to: now3,
                  interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
                });
                vwapS = vwapInWindow(
                  candlesS?.candles || [],
                  fundingOpts.windowStart,
                  fundingOpts.windowEnd,
                );
              }
            } catch {}
          }

          if (vwapF != null && vwapS != null) {
            fundingD = vwapF - vwapS;
          }

          if (
            fundingD == null &&
            vwapF != null &&
            fundingOpts.underlyingPrice != null
          ) {
            fundingD = vwapF - Number(fundingOpts.underlyingPrice);
          }
          if (fundingD == null) {
            try {
              const ids: string[] = [];
              if (underlying) {
                const underId2: string =
                  (underlying as any).instrumentId ||
                  (underlying as any).uid ||
                  (underlying as any).figi;
                if (underId2) ids.push(underId2);
              }
              let lastSpot: number | undefined;
              if (ids.length) {
                const lastResp = await api.marketdata.getLastPrices({
                  figi: [],
                  instrumentId: ids,
                  lastPriceType: 0,
                } as any);
                const lp = (lastResp as any)?.lastPrices?.[0]?.price;
                if (lp) lastSpot = Helpers.toNumber(lp);
              }
              if (lastSpot != null && lastPrice != null) {
                fundingD = lastPrice - lastSpot;
              }
            } catch {}
          }
        } catch {}
        if (
          fundingD == null &&
          fundingOpts.underlyingPrice != null &&
          vwap != null
        ) {
          fundingD = vwap - Number(fundingOpts.underlyingPrice);
        }
      }
      if (fundingD != null) {
        fundingPerUnit = computeFunding(
          Number(fundingD),
          Number(fundingL1),
          Number(fundingL2),
        );
      }
    }
  } catch {}

  // Next funding cut at 00:00, 08:00, 16:00 UTC
  const utcNow = new Date();
  const hour = utcNow.getUTCHours();
  const targets = [0, 8, 16];
  let nextHour = targets.find((h) => h > hour);
  if (nextHour == null) nextHour = 24; // next day 00:00
  const next = new Date(
    Date.UTC(
      utcNow.getUTCFullYear(),
      utcNow.getUTCMonth(),
      utcNow.getUTCDate(),
      nextHour === 24 ? 0 : nextHour,
      0,
      0,
      0,
    ),
  );
  if (nextHour === 24) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  const nextFundingTime = next.toISOString();
  const diffMs = next.getTime() - utcNow.getTime();
  const minutesToFunding = Math.max(0, Math.round(diffMs / 60000));

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
