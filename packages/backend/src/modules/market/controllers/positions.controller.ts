import { Controller, Get, Query, Res } from '@nestjs/common';

import { errorMessage, getQ } from '../../../lib/utils/http';
import { PositionsNestService } from '../services/positions.service';

import type { Response } from 'express';

@Controller()
export class PositionsController {
  constructor(private readonly positionsSrv: PositionsNestService) {}

  @Get('api/positions')
  async getPositions(@Query() query: any, @Res() res: Response) {
    try {
      const fakeReq: any = { query };
      const accountId = (getQ(fakeReq, 'accountId') || '').trim() || undefined;
      const ticker = (getQ(fakeReq, 'ticker') || '').trim();
      if (!ticker) {
        throw new Error('ticker required');
      }
      const positions = await this.positionsSrv.getOpenPositions(ticker, accountId);
      res.json({ positions });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
