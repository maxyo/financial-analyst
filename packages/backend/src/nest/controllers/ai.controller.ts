import { Controller, Get, Post, Body, Param, Res, Query } from '@nestjs/common';

import { JobsBullService } from '../jobs/jobs-bull.service';
import { errorMessage, getQ } from '../lib/utils/http';
import { AnalysisProfilesRepository } from '../repositories/analysis-profiles.repository';
import { ReportsRepository } from '../repositories/reports.repository';

import type { Response } from 'express';

@Controller()
export class AiController {
  constructor(
    private readonly jobs: JobsBullService,
    private readonly profiles: AnalysisProfilesRepository,
    private readonly reports: ReportsRepository,
  ) {}

  @Post('api/ai/profiles')
  async upsertProfile(@Body() body: any, @Res() res: Response) {
    try {
      const id = body.id ? Number(body.id) : undefined;
      if (id) {
        const updated = await this.profiles.updateOne(id, {
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
          await this.profiles.upsertSources(updated.id, sources);
        }
        const withSources = {
          ...updated,
          sources: await this.profiles.listSources(updated.id),
        } as any;
        return res.json(withSources);
      } else {
        if (!body.name || typeof body.name !== 'string') {
          return res.status(400).json({ error: 'name required' });
        }
        const created = await this.profiles.createOne({
          name: body.name,
          description: body.description,
          instrument_ticker: body.instrument_ticker || body.instrumentTicker,
        });
        if (Array.isArray(body.sources)) {
          const sources = body.sources.map((s: any) => ({
            source_id: Number(s.source_id ?? s.sourceId),
            filters_json: s.filters_json ?? s.filters,
          }));
          await this.profiles.upsertSources(created.id, sources);
        }
        const withSources = {
          ...created,
          sources: await this.profiles.listSources(created.id),
        } as any;
        return res.status(201).json(withSources);
      }
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get('api/ai/profiles')
  async listProfiles(@Query() _query: any, @Res() res: Response) {
    try {
      const fakeReq: any = { query: _query };
      const limit = Number(getQ(fakeReq, 'limit') || 100);
      const offset = Number(getQ(fakeReq, 'offset') || 0);
      const items = await this.profiles.list(limit, offset);
      res.json({ items });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get('api/ai/profiles/:id')
  async getProfile(@Param('id') idParam: string, @Res() res: Response) {
    try {
      const id = Number(idParam);
      const p = await this.profiles.getById(id);
      if (!p) return res.status(404).json({ error: 'not found' });
      const sources = await this.profiles.listSources(p.id);
      res.json({ ...p, sources });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Post('api/ai/analyze')
  analyze(@Body() body: any, @Res() res: Response) {
    try {
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
        window: windowStart || windowEnd ? { start: windowStart ?? null, end: windowEnd ?? null } : undefined,
        maxDocs,
      } as any;
      this.jobs
        .enqueueJob('ai.aggregate-analysis', payload, {
          maxAttempts: 1,
          priority: 50,
        })
        .then((job) => res.status(202).json({ job }))
        .catch((e) => res.status(500).json({ error: errorMessage(e) }));
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get('api/ai/report/:id')
  async getReport(@Param('id') idParam: string, @Res() res: Response) {
    try {
      const id = Number(idParam);
      const r = await this.reports.getById(id);
      if (!r) return res.status(404).json({ error: 'not found' });
      res.json(r);
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get('api/ai/runs')
  getRuns(_req: any, @Res() res: Response) {
    try {
      const limit = 50;
      this.jobs
        .getJobs(limit, 0, 'ai.aggregate-analysis')
        .then((jobs) => res.json({ jobs }))
        .catch((e) => res.status(500).json({ error: errorMessage(e) }));
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
