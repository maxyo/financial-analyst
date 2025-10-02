import { Injectable } from '@nestjs/common';

import { TradesNestService } from './trades.service';
import { OpenPosition } from '../../../types/market';
import { TradePoint } from '../../../types/trade';
import { CandlesRepository } from '../repositories/candles.repository';
import { InstrumentsRepository } from '../repositories/instruments.repository';
import { normalizeTicker } from '../utils/format';

@Injectable()
export class PositionsNestService {
  constructor(
    private readonly tradesService: TradesNestService,
    private readonly instrumentsRepo: InstrumentsRepository,
    private readonly candlesRepo: CandlesRepository,
  ) {}

  async getOpenPositions(
    ticker: string,
    accountId?: string,
  ): Promise<OpenPosition[]> {
    const upper = normalizeTicker(ticker);
    if (!upper) return [];

    const trades = await this.tradesService.getUserTrades(
      upper,
      accountId,
      24 * 365,
    );
    if (!Array.isArray(trades) || trades.length === 0) return [];

    const { qty, avg } = await this.aggregatePosition(trades);
    if (!qty || !Number.isFinite(qty)) return [];

    const inst = await this.instrumentsRepo.getByTicker(upper);
    const lastPrice = await this.getLastPriceFromDb(upper);

    const pos: OpenPosition = {
      ticker: upper,
      name: inst?.name ?? 'Unknown',
      figi: inst?.figi ?? undefined,
      lot: inst?.lot ?? 1,
      quantity: qty,
      averagePrice: avg,
      lastPrice,
      instrumentType: 'Todo'
    };

    if (lastPrice != null && avg != null && Number.isFinite(avg)) {
      pos.pnl = (Number(lastPrice) - Number(avg)) * Number(qty);
      pos.notional = Number(lastPrice) * Number(qty);
    }

    return [pos];
  }

  async getLastPriceFromDb(symbol: string): Promise<number | undefined> {
    const nowMs = Date.now();
    const fromToday = new Date();
    fromToday.setHours(0, 0, 0, 0);
    let candles = await this.candlesRepo.getCandles(
      symbol.toUpperCase(),
      '1m',
      Math.trunc(fromToday.getTime()),
      Math.trunc(nowMs),
    );
    if (candles.length === 0) {
      candles = await this.candlesRepo.getCandles(
        symbol.toUpperCase(),
        '1m',
        Math.trunc(nowMs - 24 * 3600 * 1000),
        Math.trunc(nowMs),
      );
    }
    const last = candles.length > 0 ? candles[candles.length - 1] : undefined;
    return last?.c;
  }

  async aggregatePosition(trades: readonly TradePoint[]): Promise<{
    qty: number;
    avg: number | undefined;
  }> {
    let qty = 0; // positive = long, negative = short
    let avg: number | undefined;

    for (const t of trades) {
      const price = Number(t.p);
      if (!Number.isFinite(price)) continue;

      const q = t.q != null ? Math.abs(Number(t.q)) : undefined;
      let side: 'buy' | 'sell' | undefined =
        t.side === 'buy' || t.side === 'sell' ? t.side : undefined;
      if (!side && t.q != null) {
        side = Number(t.q) >= 0 ? 'buy' : 'sell';
      }
      if (!side || !q || q <= 0) continue;

      if (side === 'buy') {
        if (qty >= 0) {
          const newQty = qty + q;
          if (newQty > 0) {
            avg =
              avg != null && qty > 0
                ? (avg * Math.abs(qty) + price * q) / (Math.abs(qty) + q)
                : price;
          } else {
            avg = undefined;
          }
          qty = newQty;
        } else {
          const cover = Math.min(q, Math.abs(qty));
          qty += q;
          if (qty === 0) {
            avg = undefined;
          } else if (qty > 0) {
            const opened = q - cover;
            avg = opened > 0 ? price : undefined;
          }
        }
      } else if (side === 'sell') {
        if (qty <= 0) {
          const newQty = qty - q;
          if (newQty < 0) {
            avg =
              avg != null && qty < 0
                ? (avg * Math.abs(qty) + price * q) / (Math.abs(qty) + q)
                : price;
          } else {
            avg = undefined;
          }
          qty = newQty;
        } else {
          const close = Math.min(q, Math.abs(qty));
          qty -= q;
          if (qty === 0) {
            avg = undefined;
          } else if (qty < 0) {
            const opened = q - close;
            avg = opened > 0 ? price : undefined;
          }
        }
      }
    }

    return { qty, avg };
  }
}
