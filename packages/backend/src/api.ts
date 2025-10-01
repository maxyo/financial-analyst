// Facade module: abstract provider-based API and re-export helpers

import { getProvider } from './api/factory';

// Provider-backed functions (broker-agnostic)
export async function findInstrument(query: string) {
  return getProvider().findInstrument(query);
}

export async function getUnderlyingSummaryByTicker(ticker: string) {
  return getProvider().getUnderlyingSummaryByTicker(ticker);
}

export async function getSummaryByTicker(
  ticker: string,
  windowStart?: string,
  windowEnd?: string,
) {
  return getProvider().getSummaryByTicker(ticker, windowStart, windowEnd);
}

export async function getOpenPositions(ticker: string, accountId?: string) {
  return getProvider().getOpenPositions(ticker, accountId);
}

export async function getTodayCandlesByTicker(
  ticker: string,
  intervalOrOptions?: any,
) {
  return getProvider().getTodayCandlesByTicker(ticker, intervalOrOptions);
}

export async function getRecentTradesByTicker(ticker: string) {
  return getProvider().getRecentTradesByTicker(ticker);
}

export async function getUserTradesByTicker(
  ticker: string,
  accountId?: string,
  hours?: number,
) {
  return getProvider().getUserTradesByTicker(ticker, accountId, hours);
}

// Pure functions independent of provider
export { computeFunding, computeL1L2, vwapInWindow } from './lib/calculations';

// Public types
export type {
  FundingOptions,
  Summary,
  CandlePoint,
  TradePoint,
  OpenPosition,
} from './api/tinkoff/types';
