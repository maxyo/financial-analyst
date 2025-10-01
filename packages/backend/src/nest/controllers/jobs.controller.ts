import { Controller, Get, Post, Param, Body, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { errorMessage, getQ } from '../../lib/utils/http';
import { JobsBullService } from '../jobs/jobs-bull.service';

@Controller()
export class JobsController {
  constructor(private readonly jobs: JobsBullService) {}

  @Post('api/jobs')
  async createJob(@Body() body: any, @Res() res: Response) {
    try {
      const { type, payload, runAt, maxAttempts, priority } = body || {};
      if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'type required' });
      }
      const job = await this.jobs.enqueueJob(type, payload, {
        runAt: runAt ? new Date(runAt) : undefined,
        maxAttempts: Number.isFinite(Number(maxAttempts)) ? Number(maxAttempts) : undefined,
        priority: Number.isFinite(Number(priority)) ? Number(priority) : undefined,
      });
      res.json({ job });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get('api/jobs')
  async listJobs(@Query() _query: any, @Res() res: Response) {
    try {
      // keep parity with legacy helper getQ
      const fakeReq: any = { query: _query };
      const limit = Number(getQ(fakeReq, 'limit') || 100);
      const offset = Number(getQ(fakeReq, 'offset') || 0);
      const type = (getQ(fakeReq, 'type') || '').trim() || undefined;
      const jobs = await this.jobs.getJobs(limit, offset, type);
      res.json({ jobs });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get('api/jobs/:id')
  async getJob(@Param('id') idParam: string, @Res() res: Response) {
    try {
      const id = String(idParam);
      const job = await this.jobs.getJobStatus(id);
      if (!job) return res.status(404).json({ error: 'not found' });
      res.json({ job });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Post('api/jobs/:id/cancel')
  async cancel(@Param('id') idParam: string, @Res() res: Response) {
    try {
      const id = String(idParam);
      const job = await this.jobs.getJobStatus(id);
      if (!job) return res.status(404).json({ error: 'not found' });
      if (job.status === 'running') {
        return res.status(400).json({ error: 'cannot cancel running job' });
      }
      const updated = await this.jobs.cancelJob(id);
      res.json({ job: updated });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
