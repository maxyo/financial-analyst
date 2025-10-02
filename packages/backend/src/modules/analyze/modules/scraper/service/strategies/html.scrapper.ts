import * as $ from 'cheerio';

import { Scraper } from '../../entities/scrapper.entity';
import { ScrapedItem, ScraperType } from '../../types';

import AsyncIterator = NodeJS.AsyncIterator;

export async function* htmlScraper(
  scrapper: Scraper<ScraperType.HTML>,
): AsyncIterator<ScrapedItem<string>> {
  const cfg = scrapper.config;
  const headers = new Headers(cfg.headers || {});
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 15000);
  try {
    const res = await fetch(cfg.url, {
      headers,
      signal: controller.signal,
    });
    const html = await res.text();
    const root = $.load(html);
    for (const rule of cfg.selectors) {
      for (const item of root(rule.selector)) {
        const value = root(item).text();
        if (value != null) yield { content: value, title: rule.name };
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}
