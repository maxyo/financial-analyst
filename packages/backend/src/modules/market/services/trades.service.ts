import { Injectable } from '@nestjs/common';

import { TradePoint } from '../../../types/trade';
import { TradesRepository } from '../repositories/trades.repository';

@Injectable()
export class TradesNestService {
  constructor(private readonly tradesRepo: TradesRepository) {}

  async getPublicTrades(ticker: string, sinceMs?: number): Promise<TradePoint[]> {
    const t = String(ticker || '').trim();
    if (!t) return [];
    return this.tradesRepo.getRecentPublicByTicker(t, sinceMs);
  }

  async getUserTrades(ticker: string, accountId?: string, hours = 24): Promise<TradePoint[]> {
    const t = String(ticker || '').trim();
    if (!t) return [];
    const hN = Number(hours);
    const h = Number.isFinite(hN) && hN > 0 ? Math.floor(hN) : 24;
    const since = new Date(Date.now() - Math.max(1, h) * 3600 * 1000);
    return await this.tradesRepo.getUserTradesByTicker(t, accountId, since);
  }
}
