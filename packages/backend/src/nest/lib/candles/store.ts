import { getRepositories } from '../../repositories';

import type { Interval } from './aggregate';
import type { CandlePoint } from '../../modules/market-prodivers/tinkoff/types';

export function getCandles(
  symbol: string,
  interval: string,
  fromTs: number,
  toTs: number,
): CandlePoint[] {
  return getRepositories().candles.getCandles(symbol, interval, fromTs, toTs);
}

export function upsertCandles(
  symbol: string,
  interval: string,
  candles: readonly CandlePoint[],
): void {
  return getRepositories().candles.upsertCandles(symbol, interval, candles);
}

export async function ensureAndGet(
  symbol: string,
  interval: string,
  fromTs: number,
  toTs: number,
  fetchRange: (fromTs: number, toTs: number) => Promise<CandlePoint[]>,
  baseInterval: Interval = '1m',
): Promise<CandlePoint[]> {
  return getRepositories().candles.ensureAndGet(
    symbol,
    interval,
    fromTs,
    toTs,
    fetchRange,
    baseInterval,
  );
}
