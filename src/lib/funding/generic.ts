import { Helpers } from 'tinkoff-invest-api';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

import { getApi } from '../../api/client';
import { computeFunding, computeL1L2, vwapInWindow } from '../calculations';
import { instrumentService } from '../instrument';

import type { FundingContext, FundingResult } from './types';

export async function computeGeneric(
  ctx: FundingContext,
): Promise<FundingResult> {
  const { instrument, figi, lastPrice, vwap, options } = ctx;
  const api = getApi();
  let fundingPerUnit: number | undefined;
  let fundingD: number | undefined;
  let fundingL1: number | undefined;
  let fundingL2: number | undefined;
  const fundingMode = 'generic';

  if (options.k1 == null || options.k2 == null) return { fundingMode };

  // Identify underlying instrument id (uid/figi)
  let underId: string | undefined;
  try {
    const underlying = await instrumentService.getBaseInstrument(
      instrument?.uid || instrument?.instrumentId || figi,
    );
    if (underlying) {
      underId =
        (underlying as any).figi ||
        (underlying as any).uid ||
        (underlying as any).instrumentId;
    }
  } catch {}

  // Futures VWAP over window
  let vwapF: number | undefined;
  try {
    const now2 = new Date();
    const from2 = new Date(now2);
    from2.setDate(from2.getDate() - 1);
    const candlesF = await api.marketdata.getCandles({
      instrumentId: figi,
      from: from2,
      to: now2,
      interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
    });
    vwapF = vwapInWindow(
      candlesF?.candles || [],
      options.windowStart,
      options.windowEnd,
    );
  } catch (e) {
    console.error(e);
  }

  // Underlying VWAP over window and last spot
  let vwapS: number | undefined;
  let lastSpot: number | undefined;
  if (underId) {
    try {
      const now3 = new Date();
      const from3 = new Date(now3);
      from3.setDate(from3.getDate() - 1);
      const candlesS = await api.marketdata.getCandles({
        instrumentId: underId,
        from: from3,
        to: now3,
        interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
      });
      vwapS = vwapInWindow(
        candlesS?.candles || [],
        options.windowStart,
        options.windowEnd,
      );
    } catch {}
    try {
      const lastResp = await api.marketdata.getLastPrices({
        figi: [],
        instrumentId: [underId],
        lastPriceType: 0,
      } as any);
      const lp = (lastResp as any)?.lastPrices?.[0]?.price;
      if (lp) lastSpot = Helpers.toNumber(lp);
    } catch {}
  }

  // Compute D candidates
  if (vwapF != null && vwapS != null) {
    fundingD = vwapF - vwapS;
  }
  if (fundingD == null && vwapF != null && options.underlyingPrice != null) {
    fundingD = vwapF - Number(options.underlyingPrice);
  }
  if (fundingD == null && lastSpot != null && lastPrice != null) {
    fundingD = lastPrice - lastSpot;
  }
  if (fundingD == null && options.underlyingPrice != null && vwap != null) {
    fundingD = vwap - Number(options.underlyingPrice);
  }

  // Base price candidates for L1/L2
  const candidates: Array<number | undefined> = [];
  candidates.push(vwapS);
  candidates.push(lastSpot);
  if (options.underlyingPrice != null) {
    candidates.push(Number(options.underlyingPrice));
  }
  candidates.push(vwapF);
  candidates.push(lastPrice);
  candidates.push(vwap);
  const basePrice = candidates.find(
    (x) => typeof x === 'number' && Number.isFinite(x),
  );
  if (basePrice != null) {
    const { L1, L2 } = computeL1L2(
      Number(basePrice),
      Number(options.k1),
      Number(options.k2),
    );
    fundingL1 = L1;
    fundingL2 = L2;
  }

  if (fundingD != null && fundingL1 != null && fundingL2 != null) {
    fundingPerUnit = computeFunding(
      Number(fundingD),
      Number(fundingL1),
      Number(fundingL2),
    );
  }

  return { fundingPerUnit, fundingD, fundingL1, fundingL2, fundingMode };
}
