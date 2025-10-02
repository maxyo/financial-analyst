import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Helpers } from 'tinkoff-invest-api';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

import { CandlePoint } from '../../../types/market';
import { TinkoffApiService } from '../modules/tinkoff/tinkoff.service';
import { CandlesRepository } from '../repositories/candles.repository';
import {
  floorToBucket,
  intervalToMs,
  normalizeInterval,
} from '../utils/aggregate';
import { normalizeTicker, toMs } from '../utils/format';

import type { Job } from 'bullmq';

@Injectable()
@Processor('candles.import.tinkoff')
export class CandlesImportTinkoffWorker extends WorkerHost {
  constructor(
    private readonly tinkoff: TinkoffApiService,
    private readonly candlesRepository: CandlesRepository,
  ) {
    super();
  }

  async process(job: Job) {
    const payload: any = job.data || {};

    let symbol = normalizeTicker(payload.ticker || payload.symbol);
    const intervalIn = String(payload.interval || '1m');
    const cacheInterval = normalizeInterval(intervalIn);
    const sdkInterval = (function cacheIntervalToTinkoff(
      i?: string | null,
    ): CandleInterval {
      switch (normalizeInterval(i || '1m')) {
        case '1m':
          return CandleInterval.CANDLE_INTERVAL_1_MIN;
        case '5m':
          return CandleInterval.CANDLE_INTERVAL_5_MIN;
        case '15m':
          return CandleInterval.CANDLE_INTERVAL_15_MIN;
        case '1h':
          return CandleInterval.CANDLE_INTERVAL_HOUR;
      }
    })(cacheInterval);

    const now = Date.now();
    const fromMsRaw =
      toMs(payload.windowStart ?? payload.from) ?? now - 24 * 60 * 60 * 1000;
    const toMsRaw = toMs(payload.windowEnd ?? payload.to) ?? now;
    const ivMs = intervalToMs(cacheInterval);
    const fromAligned = floorToBucket(Math.trunc(fromMsRaw), ivMs);
    const lastBucket = floorToBucket(Math.trunc((toMsRaw ?? now) - 1), ivMs);

    let instrumentId: string | undefined =
      payload.instrumentId || payload.instrument_id;
    if (!instrumentId && symbol) {
      const found = await this.tinkoff.findInstrument(symbol);
      const instrument =
        found.instruments.find((i) => i.ticker?.toUpperCase() === symbol) ||
        found.instruments[0];
      if (!instrument) {
        throw new Error(`Инструмент не найден по запросу: ${symbol}`);
      }
      instrumentId = instrument.figi || instrument.uid || instrument.ticker;
      if (!symbol) symbol = instrument.ticker?.toUpperCase?.() || symbol;
    }
    if (!instrumentId) {
      throw new Error('instrumentId or ticker is required');
    }
    if (!symbol) {
      symbol = String(
        payload.ticker || payload.symbol || instrumentId,
      ).toUpperCase();
    }

    const apiResp = await this.tinkoff.marketdataGetCandles({
      instrumentId,
      from: new Date(fromAligned),
      to: new Date(lastBucket + ivMs),
      interval: sdkInterval,
    });

    const byBucket = new Map<number, CandlePoint>();
    const list = apiResp.candles || [];
    for (const c of list) {
      const time = new Date(c.time || new Date()).getTime();
      if (!Number.isFinite(time)) continue;
      const b = floorToBucket(time, ivMs);
      const p: CandlePoint = {
        t: new Date(b).toISOString(),
        o: c.open ? Helpers.toNumber(c.open) : 0,
        h: c.high ? Helpers.toNumber(c.high) : 0,
        l: c.low ? Helpers.toNumber(c.low) : 0,
        c: c.close ? Helpers.toNumber(c.close) : 0,
        v: Number(c.volume ?? 0),
      };
      byBucket.set(b, p);
    }

    const complete: CandlePoint[] = [];
    let filledZeros = 0;
    for (let ts = fromAligned; ts <= lastBucket; ts += ivMs) {
      const have = byBucket.get(ts);
      if (have) {
        complete.push({ ...have, t: new Date(ts).toISOString() });
      } else {
        complete.push({
          t: new Date(ts).toISOString(),
          o: 0,
          h: 0,
          l: 0,
          c: 0,
          v: 0,
        });
        filledZeros += 1;
      }
    }

    await this.candlesRepository.upsertCandles(symbol, cacheInterval, complete);

    return {
      ticker: symbol,
      interval: cacheInterval,
      from: new Date(fromAligned).toISOString(),
      to: new Date(lastBucket + ivMs).toISOString(),
      fetched: list.length,
      saved: complete.length,
      filledZeros,
    };
  }
}
