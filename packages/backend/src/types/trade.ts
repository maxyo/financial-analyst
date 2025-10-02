export type TradePoint = {
  t: string;
  p: number;
  q: number | undefined;
  side: 'buy' | 'sell' | undefined;
};
