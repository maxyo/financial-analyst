import { Scraper } from '../../entities/scrapper.entity';
import { ScrapedItem, ScraperType } from '../../types';

import AsyncIterator = NodeJS.AsyncIterator;

export async function* apiScraper(
  scraper: Scraper<ScraperType.API>,
): AsyncIterator<ScrapedItem<unknown>> {
  // TODO: Implement actual API scraping logic. For now, yield no items (stub).
  if (false) {
    yield { title: 'stub', content: undefined } as ScrapedItem<unknown>;
  }
  void scraper;
}