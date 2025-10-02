import { Controller, Get, Query, Res } from '@nestjs/common';

import { errorMessage } from '../../../lib/utils/http';
import { CandlesNestService } from '../services/candles.service';

import type { Response } from 'express';

interface CandlesQueryDto {
  ticker?: string;
  interval?: string;
}

@Controller()
export class CandlesController {
  constructor(private readonly candles: CandlesNestService) {}

  @Get('api/candles')
  async getCandles(@Query() query: CandlesQueryDto, @Res() res: Response) {
    try {
      const ticker = (query.ticker ?? '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });
      const interval = query.interval?.trim() || undefined;
      const { points, clearings } = await this.candles.getTodayCandlesAndClearingsByTicker(ticker, interval);
      res.json({ points, clearings });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
