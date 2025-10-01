import type { Express, Request, Response } from 'express';
import { getSummaryByTicker } from '../api';
import { getQ, errorMessage } from '../utils/http';

export function registerSummaryController(app: Express) {
  app.get('/api/summary', async (req: Request, res: Response) => {
    try {
      const ticker = (getQ(req, 'ticker') || '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });

      const q = (k: string) => getQ(req, k);
      const ws = q('windowStart');
      const we = q('windowEnd');

      const data = await getSummaryByTicker(ticker, ws, we);
      res.json(data);
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });
}
