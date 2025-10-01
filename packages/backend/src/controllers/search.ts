import type { Express, Request, Response } from 'express';
import { findInstrument } from '../api';
import { getQ, errorMessage } from '../utils/http';

export function registerSearchController(app: Express) {
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const query = (getQ(req, 'query') || '').trim();
      if (!query) return res.status(400).json({ error: 'query required' });
      const inst = await findInstrument(query);
      if (!inst) return res.json({ instruments: [] });
      res.json({ instruments: [inst] });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });
}
