import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CandlesController } from './controllers/candles.controller';
import { PositionsController } from './controllers/positions.controller';
import { SearchController } from './controllers/search.controller';
import { SummaryController } from './controllers/summary.controller';
import { TradesController } from './controllers/trades.controller';
import { UnderlyingController } from './controllers/underlying.controller';
import { CandlesImportTinkoffWorker } from './jobs/candles.import.tinkoff.worker';
import { InstrumentsImportTinkoffWorker } from './jobs/instruments.import.tinkoff.worker';
import { TradesImportTinkoffWorker } from './jobs/trades.import.tinkoff.worker';
import { MoexModule } from './modules/moex/moex.module';
import { TinkoffApiModule } from './modules/tinkoff/tinkoff.module';
import { CandlesRepository } from './repositories/candles.repository';
import { FundingRatesRepository } from './repositories/funding-rates.repository';
import { InstrumentsRepository } from './repositories/instruments.repository';
import { TradesRepository } from './repositories/trades.repository';
import { CandlesNestService } from './services/candles.service';
import { FundingNestService } from './services/funding.service';
import { InstrumentNestService } from './services/instrument.service';
import { PositionsNestService } from './services/positions.service';
import { SummaryNestService } from './services/summary.service';
import { TradesNestService } from './services/trades.service';

@Module({
  providers: [
    CandlesNestService,
    SummaryNestService,
    TradesNestService,
    PositionsNestService,
    InstrumentNestService,
    FundingNestService,
    InstrumentsRepository,
    TradesRepository,
    CandlesRepository,
    FundingRatesRepository,
    InstrumentsImportTinkoffWorker,
    TradesImportTinkoffWorker,
    CandlesImportTinkoffWorker,
  ],
  imports: [
    BullModule.registerQueue({ name: 'instruments.import.tinkoff' }),
    BullModule.registerQueue({ name: 'trades.import.tinkoff' }),
    BullModule.registerQueue({ name: 'candles.import.tinkoff' }),
    TinkoffApiModule,
    MoexModule,
  ],
  exports: [],
  controllers: [
    SummaryController,
    UnderlyingController,
    CandlesController,
    PositionsController,
    TradesController,
    SearchController,
  ],
})
export class MarketModule {}
