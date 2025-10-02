import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { TradePoint } from '../../../types/trade';
import { TradePublicEntity } from '../entities/trade-public.entity';
import { TradeUserEntity } from '../entities/trade-user.entity';

@Injectable()
export class TradesRepository extends Repository<TradePublicEntity> {
  constructor(private readonly ds: DataSource) {
    super(TradePublicEntity, ds.createEntityManager());
  }

  async upsertPublic(ticker: string, trades: readonly TradePoint[]): Promise<void> {
    if (!Array.isArray(trades) || trades.length === 0) return;
    const upper = String(ticker || '').toUpperCase();
    const rows = trades.map((t) => {
      const e = new TradePublicEntity();
      e.ticker = upper;
      e.ts = Math.trunc(new Date(t.t).getTime());
      e.price = Number(t.p);
      e.qty = t.q != null ? Number(t.q) : null;
      e.side = t.side ?? null;
      return e;
    });
    await this.ds.getRepository(TradePublicEntity).save(rows, { chunk: 1000 });
  }

  async upsertUser(ticker: string, accountId: string | undefined, trades: readonly TradePoint[]): Promise<void> {
    if (!Array.isArray(trades) || trades.length === 0) return;
    const upper = String(ticker || '').toUpperCase();
    const acc = accountId ?? '';
    const rows = trades.map((t) => {
      const e = new TradeUserEntity();
      e.ticker = upper;
      e.accountId = acc;
      e.ts = Math.trunc(new Date(t.t).getTime());
      e.price = Number(t.p);
      e.qty = t.q != null ? Number(t.q) : null;
      e.side = t.side ?? null;
      return e;
    });
    await this.ds.getRepository(TradeUserEntity).save(rows, { chunk: 1000 });
  }

  async getRecentPublicByTicker(ticker: string, sinceMs?: number): Promise<TradePoint[]> {
    const upper = String(ticker || '').toUpperCase();
    const since = Math.trunc(sinceMs ?? Date.now() - 24 * 3600 * 1000);
    const repo = this.ds.getRepository(TradePublicEntity);
    const rows = await repo.find({ where: { ticker: upper } as any, order: { ts: 'ASC' }, take: 2000 });
    return rows
      .filter((r) => r.ts >= since)
      .map((r) => {
        const side = r.side === 'buy' || r.side === 'sell' ? r.side : undefined;
        return {
          t: new Date(r.ts).toISOString(),
          p: Number(r.price),
          q: r.qty != null ? Number(r.qty) : undefined,
          side,
        };
      });
  }

  async getUserTradesByTicker(ticker: string, accountId?: string, since?: Date): Promise<TradePoint[]> {
    const upper = String(ticker || '').toUpperCase();
    const acc = accountId ?? '';
    const sinceMs = Math.trunc(since?.getTime() ?? Date.now() - 24 * 3600 * 1000);
    const repo = this.ds.getRepository(TradeUserEntity);
    const rows = await repo.find({ where: { ticker: upper, accountId: acc } as any, order: { ts: 'ASC' }, take: 2000 });
    return rows
      .filter((r) => r.ts >= sinceMs)
      .map((r) => {
        const side = r.side === 'buy' || r.side === 'sell' ? r.side : undefined;
        return {
          t: new Date(r.ts).toISOString(),
          p: Number(r.price),
          q: r.qty != null ? Number(r.qty) : undefined,
          side,
        } as TradePoint;
      });
  }
}
