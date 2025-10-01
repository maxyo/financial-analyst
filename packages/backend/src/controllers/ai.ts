import type { Express, Request, Response } from 'express';
import { getRepositories } from '../repositories';
import { enqueueJob, getJobs as listJobsApi } from '../modules/jobs/service';
import { getQ, errorMessage } from '../utils/http';

export function registerAiController(app: Express) {
  app.post('/api/ai/profiles', (req: Request, res: Response) => {
    try {
      const repos = getRepositories();
      const body = req.body || {};
      const id = body.id ? Number(body.id) : undefined;
      if (id) {
        const updated = repos.analysisProfiles.update(id, {
          name: body.name,
          description: body.description,
          instrument_ticker: body.instrument_ticker || body.instrumentTicker,
        });
        if (!updated) return res.status(404).json({ error: 'not found' });
        if (Array.isArray(body.sources)) {
          const sources = body.sources.map((s: any) => ({
            source_id: Number(s.source_id ?? s.sourceId),
            filters_json: s.filters_json ?? s.filters,
          }));
          repos.analysisProfiles.upsertSources(updated.id, sources);
        }
        const withSources = {
          ...updated,
          sources: repos.analysisProfiles.listSources(updated.id),
        };
        return res.json(withSources);
      } else {
        if (!body.name || typeof body.name !== 'string') {
          return res.status(400).json({ error: 'name required' });
        }
        const created = repos.analysisProfiles.create({
          name: body.name,
          description: body.description,
          instrument_ticker: body.instrument_ticker || body.instrumentTicker,
        });
        if (Array.isArray(body.sources)) {
          const sources = body.sources.map((s: any) => ({
            source_id: Number(s.source_id ?? s.sourceId),
            filters_json: s.filters_json ?? s.filters,
          }));
          repos.analysisProfiles.upsertSources(created.id, sources);
        }
        const withSources = {
          ...created,
          sources: repos.analysisProfiles.listSources(created.id),
        };
        return res.status(201).json(withSources);
      }
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/ai/profiles', (req: Request, res: Response) => {
    try {
      const repos = getRepositories();
      const limit = Number(getQ(req, 'limit') || 100);
      const offset = Number(getQ(req, 'offset') || 0);
      const items = repos.analysisProfiles.list(limit, offset);
      res.json({ items });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/ai/profiles/:id', (req: Request, res: Response) => {
    try {
      const repos = getRepositories();
      const id = Number(req.params.id);
      const p = repos.analysisProfiles.getById(id);
      if (!p) return res.status(404).json({ error: 'not found' });
      const sources = repos.analysisProfiles.listSources(p.id);
      res.json({ ...p, sources });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.post('/api/ai/analyze', (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const profileId = Number(body.profileId ?? body.profile_id);
      if (!Number.isFinite(profileId)) {
        return res.status(400).json({ error: 'profileId required' });
      }
      const instrumentKey = body.instrumentKey ?? body.instrument_key;
      const windowStart = body.windowStart ?? body.window?.start;
      const windowEnd = body.windowEnd ?? body.window?.end;
      const maxDocs = body.maxDocs;
      const payload = {
        profileId,
        instrumentKey,
        window: windowStart || windowEnd
          ? { start: windowStart ?? null, end: windowEnd ?? null }
          : undefined,
        maxDocs,
      };
      const job = enqueueJob('ai.aggregate-analysis', payload, {
        maxAttempts: 1,
        priority: 50,
      });
      res.status(202).json({ job });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/ai/report/:id', (req: Request, res: Response) => {
    try {
      const repos = getRepositories();
      const id = Number(req.params.id);
      const r = repos.reports.getById(id);
      if (!r) return res.status(404).json({ error: 'not found' });
      res.json(r);
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });

  app.get('/api/ai/runs', (_req: Request, res: Response) => {
    try {
      const limit = 50;
      const jobs = listJobsApi(limit, 0, 'ai.aggregate-analysis');
      res.json({ jobs });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  });
}
