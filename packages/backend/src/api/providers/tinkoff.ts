
import { getTodayCandlesByTicker as tkGetTodayCandlesByTicker } from '../tinkoff/marketdata';
import { getOpenPositions as tkGetOpenPositions } from '../tinkoff/positions';
import {
  findInstrument as tkFindInstrument,
  getUnderlyingSummaryByTicker as tkGetUnderlyingSummaryByTicker,
  getSummaryByTicker as tkGetSummaryByTicker,
} from '../tinkoff/summary';
import {
  getRecentTradesByTicker as tkGetRecentTradesByTicker,
  getUserTradesByTicker as tkGetUserTradesByTicker,
} from '../tinkoff/trades';

import type { MarketProvider } from '../provider';
import type { AppCandleInterval, GetCandlesOptions } from '../tinkoff/marketdata';
import type {
  CandlePoint,
  OpenPosition,
  TradePoint,
  Summary,
} from '../tinkoff/types';

export class TinkoffProvider implements MarketProvider {
  async findInstrument(query: string): Promise<any> {
    return tkFindInstrument(query);
  }

  async getUnderlyingSummaryByTicker(ticker: string): Promise<Summary> {
    return tkGetUnderlyingSummaryByTicker(ticker);
  }

  async getSummaryByTicker(
    ticker: string,
    windowStart?: string,
    windowEnd?: string,
  ): Promise<Summary> {
    return tkGetSummaryByTicker(ticker, windowStart, windowEnd);
  }

  async getOpenPositions(
    ticker: string,
    accountId?: string,
  ): Promise<OpenPosition[]> {
    return tkGetOpenPositions(ticker, accountId);
  }

  async getTodayCandlesByTicker(
    ticker: string,
    intervalOrOptions?: string | AppCandleInterval | GetCandlesOptions,
  ): Promise<CandlePoint[]> {
    return tkGetTodayCandlesByTicker(ticker, intervalOrOptions as any);
  }

  async getRecentTradesByTicker(ticker: string): Promise<TradePoint[]> {
    return tkGetRecentTradesByTicker(ticker);
  }

  async getUserTradesByTicker(
    ticker: string,
    accountId?: string,
    hours?: number,
  ): Promise<TradePoint[]> {
    return tkGetUserTradesByTicker(ticker, accountId, hours);
  }
}
