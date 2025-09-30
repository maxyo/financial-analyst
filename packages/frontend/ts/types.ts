export interface CandlePoint {
  t: string; // ISO timestamp
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

export interface Trade {
  t: string; // ISO timestamp
  p: number; // price
  q?: number; // quantity
  side?: string; // 'buy' | 'sell' | other
}

export interface Clearing {
  t: string; // ISO timestamp
  fundingRateEst?: number;
}

export interface SummaryLite {
  ticker?: string;
  name?: string;
  lastPrice?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  vwap?: number;
  premium?: number;
  fundingRateEst?: number;
  fundingPerUnit?: number;
}

export interface Summary extends SummaryLite {
  underlying?: SummaryLite | null;
  clearings?: Clearing[];
}

export interface PositionsResponse {
  positions: Position[];
}

export interface Position {
  ticker?: string;
  figi?: string;
  instrumentId?: string;
  name?: string;
  quantity?: number;
  averagePrice?: number;
  lastPrice?: number;
  pnl?: number;
  effectiveLot?: number;
  lot?: number;
  underlyingLot?: number;
  futuresLot?: number;
  instrumentType?: string;
  positionUnits?: number;
  notional?: number;
}
