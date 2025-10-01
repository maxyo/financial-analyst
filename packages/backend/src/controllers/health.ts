import type { Express, Request, Response } from 'express';

export function registerHealthController(app: Express) {
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });
}
