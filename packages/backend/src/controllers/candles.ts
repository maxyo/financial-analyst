import type { Express, Request, Response } from 'express';
import { getTodayCandlesByTicker, getSummaryByTicker } from '../api';
import { computeMoexClearingInstants } from '../lib/calculations';
import { getQ, errorMessage } from '../utils/http';

interface ClearingPoint { t: string; fundingRateEst?: number }

export function registerCandlesController(app: Express) {
  app.get('/api/candles', async (req: Request, res: Response) => {
    try {
      const ticker = (getQ(req, 'ticker') || '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });
      const interval = (getQ(req, 'interval') || '').trim() || undefined;
      const points = await getTodayCandlesByTicker(ticker, interval);
      let clearings: ClearingPoint[] = [];
      try {
        const instants = computeMoexClearingInstants();
        const s = await getSummaryByTicker(ticker);
        const envK2 = process.env.FUNDING_K2;
        const k2 = envK2 != null ? Number(envK2) : undefined;
        let basePrice: number | undefined;
        if (s.fundingL2 != null && k2) basePrice = Number(s.fundingL2) / Number(k2);
        if (basePrice == null || !Number.isFinite(basePrice) || basePrice <= 0) {
          basePrice = s.vwap != null ? Number(s.vwap) : s.lastPrice != null ? Number(s.lastPrice) : undefined;
        }
        const fundingFraction = s.fundingPerUnit != null && basePrice != null && Number(basePrice) > 0
          ? Number(s.fundingPerUnit) / Number(basePrice)
          : s.fundingRateEst;
        clearings = instants.map((t) => ({ t, fundingRateEst: fundingFraction }));
      } catch {
        // ignore
      }
      res.json({ points, clearings });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });
}
