import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CandlePoint } from '../../../types/market';
import { CandleEntity } from '../entities/candle.entity';
import { normalizeInterval } from '../utils/aggregate';


function toPoint(r: CandleEntity): CandlePoint {
  return {
    t: new Date(r.ts).toISOString(),
    o: r.o ?? 0,
    h: r.h ?? 0,
    l: r.l ?? 0,
    c: r.c ?? 0,
    v: r.v ?? 0,
  };
}

@Injectable()
export class CandlesRepository extends Repository<CandleEntity> {
  constructor(dataSource: DataSource) {
    super(CandleEntity, dataSource.createEntityManager());
  }

  async getCandles(symbol: string, interval: string, fromTs: number, toTs: number): Promise<CandlePoint[]> {
    const upper = String(symbol || '').toUpperCase();
    if (!upper) return [];
    const intv = normalizeInterval(interval);
    const rows = await this.find({
      where: {
        symbol: upper,
        interval: intv,
        ts: (this.manager.connection.driver as any).options.type === 'better-sqlite3'
          ? (undefined as any)
          : (undefined as any),
      } as any,
      order: { ts: 'ASC' },
    });
    // Filter by range in JS to avoid type issues with Between helper generics for better-sqlite3
    const from = Math.trunc(fromTs);
    const to = Math.trunc(toTs);
    const filtered = rows.filter((r) => r.ts >= from && r.ts <= to);
    return filtered.map(toPoint);
  }

  async upsertCandles(symbol: string, interval: string, candles: readonly CandlePoint[]): Promise<void> {
    if (!Array.isArray(candles) || candles.length === 0) return;
    const upper = String(symbol || '').toUpperCase();
    const intv = normalizeInterval(interval);
    const entities: CandleEntity[] = candles.map((p) => {
      const ts = new Date(p.t).getTime();
      const e = new CandleEntity();
      e.symbol = upper;
      e.interval = intv;
      e.ts = Math.trunc(ts);
      e.o = p.o ?? null as any;
      e.h = p.h ?? null as any;
      e.l = p.l ?? null as any;
      e.c = p.c ?? null as any;
      e.v = Number(p.v || 0);
      return e;
    });
    await this.save(entities);
  }
}
