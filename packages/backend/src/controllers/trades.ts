import type { Express, Request, Response } from 'express';
import { getRecentTradesByTicker, getUserTradesByTicker } from '../api';
import { getQ, getN, errorMessage } from '../utils/http';

export function registerTradesController(app: Express) {
  app.get('/api/trades', async (req: Request, res: Response) => {
    try {
      const ticker = (getQ(req, 'ticker') || '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });
      const accountId = (getQ(req, 'accountId') || '').trim() || undefined;
      const hoursN = getN(getQ(req, 'hours'));
      const lookback = hoursN && hoursN > 0 ? hoursN : 24;

      const mode = (getQ(req, 'mode') || '').toLowerCase();
      if (mode === 'public') {
        const trades = await getRecentTradesByTicker(ticker);
        return res.json({ trades });
      }

      const trades = await getUserTradesByTicker(ticker, accountId, lookback);
      res.json({ trades });
    } catch (e: unknown) {
      try {
        const ticker = (getQ(req, 'ticker') || '').trim();
        const trades = await getRecentTradesByTicker(ticker);
        return res.json({ trades, fallback: true });
      } catch (_e: unknown) {
        res.status(500).json({ error: errorMessage(e) });
      }
    }
  });
}
