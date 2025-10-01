import type { Express, Request, Response } from 'express';
import { enqueueJob, getJobStatus, getJobs as listJobsApi, cancelJob } from '../modules/jobs/service';
import { getQ, errorMessage } from '../utils/http';

export function registerJobsController(app: Express) {
  app.post('/api/jobs', async (req: Request, res: Response) => {
    try {
      const { type, payload, runAt, maxAttempts, priority } = req.body || {};
      if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'type required' });
      }
      const job = enqueueJob(type, payload, {
        runAt: runAt ? new Date(runAt) : undefined,
        maxAttempts: Number.isFinite(Number(maxAttempts))
          ? Number(maxAttempts)
          : undefined,
        priority: Number.isFinite(Number(priority))
          ? Number(priority)
          : undefined,
      });
      res.json({ job });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/jobs', (req: Request, res: Response) => {
    try {
      const limit = Number(getQ(req, 'limit') || 100);
      const offset = Number(getQ(req, 'offset') || 0);
      const type = (getQ(req, 'type') || '').trim() || undefined;
      const jobs = listJobsApi(limit, offset, type);
      res.json({ jobs });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/jobs/:id', (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const job = getJobStatus(id);
      if (!job) return res.status(404).json({ error: 'not found' });
      res.json({ job });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.post('/api/jobs/:id/cancel', (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const job = getJobStatus(id);
      if (!job) return res.status(404).json({ error: 'not found' });
      if (job.status === 'running') {
        return res.status(400).json({ error: 'cannot cancel running job' });
      }
      const updated = cancelJob(id);
      res.json({ job: updated });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });
}
