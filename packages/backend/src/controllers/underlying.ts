import type { Express, Request, Response } from 'express';
import { getUnderlyingSummaryByTicker } from '../api';
import { getQ, errorMessage } from '../utils/http';

export function registerUnderlyingController(app: Express) {
  app.get('/api/underlying-summary', async (req: Request, res: Response) => {
    try {
      const ticker = (getQ(req, 'ticker') || '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });
      const data = await getUnderlyingSummaryByTicker(ticker);
      res.json(data);
    } catch (e: unknown) {
      const msg = errorMessage(e, 'failed to resolve underlying');
      res.status(404).json({ error: msg });
    }
  });
}
