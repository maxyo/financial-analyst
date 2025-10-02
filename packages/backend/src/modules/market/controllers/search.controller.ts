import { Controller, Get, Query, Res } from '@nestjs/common';

import { errorMessage, getQ } from '../../../lib/utils/http';
import { InstrumentNestService } from '../services/instrument.service';

import type { Response } from 'express';

@Controller()
export class SearchController {
  constructor(private readonly instruments: InstrumentNestService) {}

  @Get('api/search')
  async search(@Query() query: any, @Res() res: Response) {
    try {
      const fakeReq: any = { query };
      const q = (getQ(fakeReq, 'query') || '').trim();
      if (!q) return res.status(400).json({ error: 'query required' });
      const inst = await this.instruments.findInstrument(q);
      if (!inst) return res.json({ instruments: [] });
      res.json({ instruments: [inst] });
    } catch (e: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
