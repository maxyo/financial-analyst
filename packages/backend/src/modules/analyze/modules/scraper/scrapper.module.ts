import { Module } from '@nestjs/common';


import { DocumentsController } from './controllers/documents.controller';
import { ScrapersController } from './controllers/scrapers.controller';
import { DocumentsRepository } from './repositories/documents.repository';
import { ScrapersRepository } from './repositories/scrapers.repository';
import { ScraperNestService } from './service/scraper.service';

@Module({
  controllers: [DocumentsController, ScrapersController],
  providers: [ScraperNestService, DocumentsRepository, ScrapersRepository],
})
export class ScrapperModule {}
