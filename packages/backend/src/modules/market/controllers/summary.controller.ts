import { Controller, Get, Query, Res } from '@nestjs/common';

import { errorMessage, getQ } from '../../../lib/utils/http';
import { SummaryNestService } from '../services/summary.service';

import type { Response } from 'express';

@Controller()
export class SummaryController {
  constructor(private readonly summary: SummaryNestService) {}

  @Get('api/summary')
  async getSummary(@Query() query: any, @Res() res: Response) {
    try {
      const fakeReq: any = { query };
      const ticker = (getQ(fakeReq, 'ticker') || '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });

      const ws = getQ(fakeReq, 'windowStart');
      const we = getQ(fakeReq, 'windowEnd');

      const data = await this.summary.getSummaryByTicker(ticker, ws, we);
      res.json(data);
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
