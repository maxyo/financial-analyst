import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { setupWebSocket } from './setup-ws';
import { JobsBullService } from '../jobs/jobs-bull.service';
import { CandlesNestService } from '../services/candles.service';
import { SummaryNestService } from '../services/summary.service';
import { TradesNestService } from '../services/trades.service';

@Injectable()
export class WsBridgeService implements OnApplicationBootstrap {
  private initialized = false;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly jobs: JobsBullService,
    private readonly candles: CandlesNestService,
    private readonly summary: SummaryNestService,
    private readonly trades: TradesNestService,
  ) {}

  onApplicationBootstrap() {
    if (this.initialized) return;
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    // Attach legacy ws implementation to Nest's HTTP server, with services from Nest DI
    setupWebSocket(httpServer, this.jobs as any, {
      candles: this.candles,
      summary: this.summary,
      trades: this.trades,
    });

    this.initialized = true;
    // eslint-disable-next-line no-console
    console.log('[WS] WebSocket server initialized on /ws via Nest');
  }
}
