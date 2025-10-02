import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class WsBridgeService implements OnApplicationBootstrap {
  private initialized = false;

  constructor() // private readonly httpAdapterHost: HttpAdapterHost,
  // private readonly candles: CandlesNestService,
  // private readonly summary: SummaryNestService,
  // private readonly trades: TradesNestService,
  {}

  onApplicationBootstrap() {
    if (this.initialized) return;
    // const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();

    // Attach legacy ws implementation to Nest's HTTP server, with services from Nest DI
    // setupWebSocket(httpServer, this.jobs as any, {
    //   candles: this.candles,
    //   summary: this.summary,
    //   trades: this.trades,
    // });

    this.initialized = true;
    // eslint-disable-next-line no-console
    console.log('[WS] WebSocket server initialized on /ws via Nest');
  }
}
