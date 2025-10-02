import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('api/health')
export class HealthController {
  @Get()
  getHealth(@Res() res: Response) {
    res.json({ ok: true, ts: new Date().toISOString() });
  }
}
