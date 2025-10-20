import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns service health status and current timestamp.' })
  getHealth(@Res() res: Response) {
    res.json({ ok: true, ts: new Date().toISOString() });
  }
}
