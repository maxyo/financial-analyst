import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CollectionController } from './controllers/collection.controller';
import { DocumentsController } from './controllers/documents.controller';
import { ScrapersController } from './controllers/scrapers.controller';
import { DocumentsRepository } from './repositories/documents.repository';
import { ScrapersRepository } from './repositories/scrapers.repository';
import { ScraperNestService } from './service/scraper.service';
import { CollectionsRepository } from '../../repositories/collections.repository';

@Module({
  imports: [BullModule.registerQueue({ name: 'scrap.run' })],
  controllers: [DocumentsController, ScrapersController, CollectionController],
  providers: [
    ScraperNestService,
    CollectionsRepository,
    DocumentsRepository,
    ScrapersRepository,
  ],
})
export class ScrapperModule {}
