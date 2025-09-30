// Shared API-level types

export interface FundingOptions {
  k1?: number; // fraction, e.g., 0.001 for 0.1%
  k2?: number; // fraction, e.g., 0.0015 for 0.15%
  prevBasePrice?: number; // previous evening clearing base price
  d?: number; // deviation D (manual)
  mode?: 'generic' | 'moex';
  cbr?: number; // Central Bank rate (for currency mode)
  windowStart?: string; // e.g., '10:00' (local time)
  windowEnd?: string; // e.g., '15:30' (local time)
  underlyingPrice?: number; // for generic: use D = vwap - underlyingPrice if d not provided
}

export interface Summary {
  name: string;
  ticker: string;
  figi: string;
  lot: number;
  lastPrice?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  dayHigh?: number;
  dayLow?: number;
  dayOpen?: number;
  changeAbs?: number;
  changePct?: number;
  volumeSum?: number;
  // Funding-related fields (heuristic estimation)
  vwap?: number; // intraday VWAP based on today's 1m candles
  premium?: number; // (lastPrice - vwap) / vwap
  fundingRateEst?: number; // estimated daily funding (fraction), heuristic
  nextFundingTime?: string; // ISO of next daily funding at 19:00 MSK (16:00 UTC)
  minutesToFunding?: number; // minutes until next daily funding cut from now
  // MoEx funding per documentation (per 1 unit of underlying)
  fundingPerUnit?: number;
  fundingD?: number;
  fundingL1?: number;
  fundingL2?: number;
  fundingMode?: string; // generic | currency | manual
}

export interface CandlePoint {
  t: string;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v: number;
}

export interface TradePoint {
  t: string;
  p: number;
  q?: number;
  side?: 'buy' | 'sell' | 'unspecified';
}

export interface OpenPosition {
  instrumentId?: string;
  figi?: string;
  ticker?: string;
  name?: string;
  lot?: number; // lot size reported by instrument (per contract or share)
  futuresLot?: number; // futures lot if available
  underlyingLot?: number; // underlying lot if available
  effectiveLot?: number; // underlyingLot * futuresLot if applicable
  quantity?: number; // number of contracts (for futures) or units
  averagePrice?: number; // average price per contract/unit (as reported by API)
  lastPrice?: number; // last market price per contract/unit
  pnl?: number; // (last - avg) * quantity (approximate)
  positionUnits?: number; // quantity * effectiveLot (for futures), else quantity
  notional?: number; // lastPrice * quantity (per contract). For futures underlying notional can be lastPrice*quantity*effectiveLot
  instrumentType?: string; // e.g., share, bond, futures, currency
}
