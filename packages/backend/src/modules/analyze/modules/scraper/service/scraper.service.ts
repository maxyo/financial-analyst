import { createHash, randomUUID } from 'node:crypto';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from "bullmq";

import { Scraper } from '../entities/scrapper.entity';
import { DocumentsRepository } from '../repositories/documents.repository';
import { ScrapersRepository } from '../repositories/scrapers.repository';
import { ScrapedItem, ScraperType } from '../types';
import { apiScraper } from './strategies/api.scraper';
import { htmlScraper } from './strategies/html.scrapper';
import { applyPostProcessors } from '../utils/processing';


export interface ScrapingResult {
  items: number;
  inserted: number;
  skipped: number;
  failed: number;
  meta?: Record<string, unknown>;
}


@Injectable()
@Processor('scrap.run')
export class ScraperNestService extends WorkerHost {
  logger = new Logger(ScraperNestService.name);
  constructor(
    private readonly documents: DocumentsRepository,
    private readonly scrapers: ScrapersRepository,
  ) {
    super();
  }

  async process(job: Job) {
    const data = job.data || {};
    const scraperId: string | undefined = String(
      data.scraperId || data.scraper_id || data.id || ''
    ).trim() || undefined;
    if (!scraperId) {
      throw new Error('scraperId is required');
    }
    const scr = await this.scrapers.findOne({ where: { id: scraperId }});
    if (!scr) {
      throw new Error(`Scraper not found: ${scraperId}`);
    }
    return this.runScraper(scr);
  }


  async runScraper<T extends ScraperType>(
    scrapper: Scraper<T>,
  ): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      items: 0,
      meta: {},
      skipped: 0,
      inserted: 0,
      failed: 0,
    };

    let iterator: AsyncIterator<ScrapedItem<T>>;
    if (scrapper.type === ScraperType.HTML) {
      iterator = htmlScraper(scrapper as Scraper<ScraperType.HTML>) as AsyncIterator<ScrapedItem<T>>;
    } else if (scrapper.type === ScraperType.API) {
      iterator = apiScraper(scrapper as Scraper<ScraperType.API>) as AsyncIterator<ScrapedItem<T>>;
    } else {
      throw new Error(`Unsupported scraper type: ${String((scrapper).type)}`);
    }

    let item = await iterator.next();
    while (item.value) {
      result.items++;
      try {
        const scrapedItem = item.value as ScrapedItem<T>;
        const contentStr =
          typeof scrapedItem.content === 'string'
            ? scrapedItem.content
            : JSON.stringify(scrapedItem.content);

        const processed = applyPostProcessors(scrapper, {
          title: scrapedItem.title,
          content: contentStr,
        });

        const resultDocument = {
          content: processed.content,
          title: processed.title,
          contentHash: this.generateHash(processed.content),
          scrapedAt: new Date(),
          scraperId: scrapper.id,
          id: randomUUID(),
        };
        await this.documents.insert(resultDocument);
        result.inserted++;

      } catch (e) {
        result.failed++;
        this.logger.error(`Scraping failed`, e);
      } finally {
        item = await iterator.next();
      }
    }

    return result;
  }

  private generateHash(content: string): string {
    const hash = createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  async runById(scraperId: string) {
    const scr = await this.scrapers.findOne({ where: { id: scraperId } });
    if (!scr) throw new Error(`Scraper not found: ${scraperId}`);
    return this.runScraper(scr);
  }
}
