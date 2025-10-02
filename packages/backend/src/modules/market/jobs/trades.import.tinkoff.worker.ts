import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import { TradesRepository } from '../repositories/trades.repository';
import { TradesNestService } from '../services/trades.service';

import type { Job } from 'bullmq';


@Injectable()
@Processor('trades.import.tinkoff')
export class TradesImportTinkoffWorker extends WorkerHost {
  constructor(private readonly tradesSvc: TradesNestService, private readonly tradesRepository: TradesRepository) {
    super();
  }

  async process(job: Job) {
    const payload: any = job.data || {};
    let tickers: string[] = [];
    if (Array.isArray(payload.tickers)) {
      tickers = payload.tickers
        .map((s: any) => String(s).trim())
        .filter(Boolean);
    } else if (typeof payload.tickers === 'string') {
      tickers = payload.tickers
        .split(/[\s,]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    const singleTicker = (payload.ticker || payload.symbol || '').trim?.() || '';
    if (singleTicker) tickers.push(singleTicker);
    tickers = Array.from(new Set(tickers.map((t) => t.toUpperCase())));
    if (tickers.length === 0) {
      throw new Error('ticker(s) required');
    }
    const accountId: string | undefined =
      (payload.accountId || payload.account_id || '').trim?.() || undefined;
    const hoursN = Number(payload.hours);
    const hours = Number.isFinite(hoursN) && hoursN > 0 ? Math.floor(hoursN) : 24;

    let totalFetched = 0;
    let totalSavedApprox = 0;
    const perTicker: Array<{
      ticker: string;
      fetched: number;
      savedApprox: number;
    }> = [];
    const errors: Array<{ ticker: string; error: string }> = [];

    for (const ticker of tickers) {
      try {
        const trades = await this.tradesSvc.getUserTrades(
          ticker,
          accountId,
          hours,
        );
        totalFetched += trades.length;
        void this.tradesRepository.upsertUser(ticker, accountId, trades);
        totalSavedApprox += trades.length;
        perTicker.push({
          ticker,
          fetched: trades.length,
          savedApprox: trades.length,
        });
      } catch (e: any) {
        errors.push({ ticker, error: e?.message || String(e) });
      }
    }

    return {
      tickers,
      accountId: accountId ?? null,
      hours,
      totals: { fetched: totalFetched, savedApprox: totalSavedApprox },
      perTicker,
      errors,
    };
  }
}
