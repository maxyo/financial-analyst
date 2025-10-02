import { Controller, Get, Query, Res } from '@nestjs/common';

import { getQ, errorMessage } from '../../../lib/utils/http';
import { SummaryNestService } from '../services/summary.service';

import type { Response } from 'express';

@Controller()
export class UnderlyingController {
  constructor(private readonly summary: SummaryNestService) {}

  @Get('api/underlying-summary')
  async getUnderlying(@Query() query: any, @Res() res: Response) {
    try {
      const fakeReq: any = { query };
      const ticker = (getQ(fakeReq, 'ticker') || '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });
      const data = await this.summary.getUnderlyingSummaryByTicker(ticker);
      res.json(data);
    } catch (e: unknown) {
      const msg = errorMessage(e, 'failed to resolve underlying');
      res.status(404).json({ error: msg });
    }
  }
}
