// Facade module: re-export split API modules and helpers

export { getApi } from './api/client';

export {
  findInstrument,
  getUnderlyingSummaryByTicker,
  getSummaryByTicker,
} from './api/summary';

export { getOpenPositions } from './api/positions';

export { getTodayCandlesByTicker } from './api/marketdata';

export { getRecentTradesByTicker, getUserTradesByTicker } from './api/trades';

export { computeFunding, computeL1L2, vwapInWindow } from './lib/calculations';

export type {
  FundingOptions,
  Summary,
  CandlePoint,
  TradePoint,
  OpenPosition,
} from './api/types';
