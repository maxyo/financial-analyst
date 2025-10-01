import type { Express } from 'express';
import { registerHealthController } from './health';
import { registerJobsController } from './jobs';
import { registerSearchController } from './search';
import { registerSummaryController } from './summary';
import { registerAiController } from './ai';
import { registerUnderlyingController } from './underlying';
import { registerCandlesController } from './candles';
import { registerPositionsController } from './positions';
import { registerTradesController } from './trades';

export function registerControllers(app: Express) {
  registerHealthController(app);
  registerJobsController(app);
  registerSearchController(app);
  registerSummaryController(app);
  registerAiController(app);
  registerUnderlyingController(app);
  registerCandlesController(app);
  registerPositionsController(app);
  registerTradesController(app);
}
