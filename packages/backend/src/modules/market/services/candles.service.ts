import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CandlePoint } from '../../../types/market';
import { CandlesRepository } from '../repositories/candles.repository';
import { intervalToMs, normalizeInterval } from '../utils/aggregate';
import { computeMoexClearingInstants } from '../utils/calculations';
import { mapToCacheInterval, normalizeTicker, toMs } from '../utils/format';

interface ClearingPoint {
  t: string;
  fundingRateEst?: number | null;
}

// Options accepted by the service for flexibility; controller/WS currently pass a string or nothing
export type GetCandlesOptions = {
  interval?: string;
  from?: Date | number | string;
  to?: Date | number | string;
};

@Injectable()
export class CandlesNestService {
  constructor(
    private readonly repository: CandlesRepository,
    @InjectQueue('candles.import.tinkoff') private readonly queue: Queue,
  ) {}

  async getCandlesByTicker(
    ticker: string,
    interval: string,
    from: Date | number | string,
    to: Date | number | string,
  ): Promise<CandlePoint[]> {
    const upper = normalizeTicker(ticker);
    if (!upper) return [];
    const fromMs = toMs(from) ?? Date.now() - 24 * 60 * 60 * 1000;
    const toMsVal = toMs(to) ?? Date.now();
    const cacheInterval = mapToCacheInterval(interval);
    return this.repository.getCandles(upper, cacheInterval, fromMs, toMsVal);
  }

  async getCandlesByTickerWithAutoImport(
    ticker: string,
    interval: string,
    from: Date | number | string,
    to: Date | number | string,
  ): Promise<CandlePoint[]> {
    const upper = normalizeTicker(ticker);
    if (!upper) return [];
    const fromMs = toMs(from) ?? Date.now() - 24 * 60 * 60 * 1000;
    const toMsVal = toMs(to) ?? Date.now();

    const cacheInterval = mapToCacheInterval(interval);
    const points = this.repository.getCandles(
      upper,
      cacheInterval,
      fromMs,
      toMsVal,
    );

    try {
      const normCache = normalizeInterval(cacheInterval);
      const stepMs = intervalToMs(normCache);
      const expected =
        Math.max(1, Math.floor((toMsVal - fromMs) / stepMs) + 1) - 1;
      const actual = Array.isArray(points) ? points.length : 0;
      if (actual < expected) {
        await this.queue.add('candles.import.tinkoff', {
          ticker: upper,
          windowStart: fromMs,
          windowEnd: toMsVal,
          interval: cacheInterval,
        });
      }
    } catch {
      // ignore scheduling errors
    }

    return points;
  }

  async getTodayCandlesByTicker(
    ticker: string,
    intervalOrOptions?: string | GetCandlesOptions,
  ): Promise<CandlePoint[]> {
    const now = Date.now();
    let to = now;
    let from = now - 24 * 60 * 60 * 1000;
    let interval = '1m';

    if (typeof intervalOrOptions === 'object' && intervalOrOptions) {
      const maybeFrom = toMs(intervalOrOptions.from);
      const maybeTo = toMs(intervalOrOptions.to);
      if (maybeTo != null) to = maybeTo;
      if (maybeFrom != null) from = maybeFrom;
      if (intervalOrOptions.interval) {
        interval = String(intervalOrOptions.interval);
      }
    } else if (
      typeof intervalOrOptions === 'string' &&
      intervalOrOptions.trim()
    ) {
      interval = intervalOrOptions;
    }

    return this.getCandlesByTickerWithAutoImport(ticker, interval, from, to);
  }

  async getTodayCandlesAndClearingsByTicker(
    ticker: string,
    intervalOrOptions?: string | GetCandlesOptions,
  ): Promise<{ points: CandlePoint[]; clearings: ClearingPoint[] }> {
    const points = await this.getTodayCandlesByTicker(
      ticker,
      intervalOrOptions,
    );
    let clearings: ClearingPoint[] = [];
    try {
      const instants = computeMoexClearingInstants();
      clearings = instants.map((t) => ({
        t,
        fundingRateEst: null,
      }));
    } catch {
      // ignore
    }
    return { points, clearings };
  }
}
