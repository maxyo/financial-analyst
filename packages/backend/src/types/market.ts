export type CandlePoint = {
  l: number;
  h: number;
  o: number;
  c: number;
  v: number;
  t: string;
};

export type OpenPosition = {
  figi?: string;
  ticker: string;
  name: string;
  lot: number;
  quantity: number;
  averagePrice?: number;
  lastPrice?: number;
  pnl?: number;
  instrumentType: string;
  notional?: number;
}