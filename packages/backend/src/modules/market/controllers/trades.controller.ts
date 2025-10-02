import { Controller, Get, Query, Res } from '@nestjs/common';

import { errorMessage } from '../../../lib/utils/http';
import { TradesNestService } from '../services/trades.service';

import type { Response } from 'express';

interface TradesQueryDto {
  ticker?: string;
  accountId?: string;
  hours?: string | number;
  mode?: string;
}

@Controller()
export class TradesController {
  constructor(private readonly tradesSrv: TradesNestService) {}

  @Get('api/trades')
  async getTrades(@Query() query: TradesQueryDto, @Res() res: Response) {
    try {
      const ticker = (query.ticker ?? '').trim();
      if (!ticker) return res.status(400).json({ error: 'ticker required' });
      const accountId = query.accountId?.trim() || undefined;
      const hoursN = Number(query.hours);
      const lookback = Number.isFinite(hoursN) && hoursN > 0 ? Math.floor(hoursN) : 24;

      const mode = (query.mode || '').toLowerCase();
      if (mode === 'public') {
        const trades = await this.tradesSrv.getPublicTrades(ticker);
        return res.json({ trades });
      }

      const trades = await this.tradesSrv.getUserTrades(ticker, accountId, lookback);
      res.json({ trades });
    } catch (e: unknown) {
      try {
        const ticker = (query.ticker ?? '').trim();
        const trades = await this.tradesSrv.getPublicTrades(ticker);
        return res.json({ trades, fallback: true });
      } catch (_e: unknown) {
        res.status(500).json({ error: errorMessage(e) });
      }
    }
  }
}
