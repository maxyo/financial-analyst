import type { Express, Request, Response } from 'express';
import { getOpenPositions } from '../api';
import { getQ, errorMessage } from '../utils/http';

export function registerPositionsController(app: Express) {
  app.get('/api/positions', async (req: Request, res: Response) => {
    try {
      const accountId = (getQ(req, 'accountId') || '').trim() || undefined;
      const ticker = (getQ(req, 'ticker') || '').trim();
      if (!ticker) {
        throw new Error('ticker required');
      }
      const positions = await getOpenPositions(ticker, accountId);
      res.json({ positions });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });
}
