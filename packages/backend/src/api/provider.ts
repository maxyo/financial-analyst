import type { AppCandleInterval, GetCandlesOptions } from './tinkoff/marketdata';
import type { CandlePoint, OpenPosition, TradePoint, Summary, FundingOptions } from './tinkoff/types';

// Generic provider interface to abstract underlying market/broker API.
// NOTE: DTOs reference current SDK-agnostic types defined under tinkoff/types.ts.
// These can be moved to a neutral location later without changing call sites.
export interface MarketProvider {
  // Search for an instrument by free-form query; return provider-native instrument object or a simplified shape.
  // For now, we return "any" to avoid leaking SDK types; facade consumers typically pass this through.
  findInstrument(query: string): Promise<any>;

  // Resolve and return Summary for the underlying of the given ticker.
  getUnderlyingSummaryByTicker(ticker: string): Promise<Summary>;

  // Main instrument summary; windowStart/windowEnd control funding window hints.
  getSummaryByTicker(
    ticker: string,
    windowStart?: string,
    windowEnd?: string,
  ): Promise<Summary>;

  // Portfolio positions filtered by ticker and optionally by account.
  getOpenPositions(ticker: string, accountId?: string): Promise<OpenPosition[]>;

  // Intraday candles for ticker, with optional interval/time range.
  getTodayCandlesByTicker(
    ticker: string,
    intervalOrOptions?: string | AppCandleInterval | GetCandlesOptions,
  ): Promise<CandlePoint[]>;

  // Recent public trades for a ticker (anonymized market trades).
  getRecentTradesByTicker(ticker: string): Promise<TradePoint[]>;

  // User's executed trades for given ticker.
  getUserTradesByTicker(
    ticker: string,
    accountId?: string,
    hours?: number,
  ): Promise<TradePoint[]>;
}

export type { CandlePoint, OpenPosition, TradePoint, Summary, FundingOptions };
export type { AppCandleInterval, GetCandlesOptions };
