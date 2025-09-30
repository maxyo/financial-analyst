import type { IScraper, ScrapeContext, ScrapeResult } from '../types';

export interface HtmlSelectorRule {
  key: string; // field name in output object
  selector: string; // CSS selector
  attr?: string; // attribute name to extract; if omitted, use text()
  all?: boolean; // if true, collect array; else first
}

export interface HtmlScraperConfig {
  url: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  selectors?: HtmlSelectorRule[];
}

export class HtmlScraper implements IScraper {
  async scrape(config: unknown, _ctx: ScrapeContext): Promise<ScrapeResult> {
    void _ctx; // mark as used for strict TS
    const cfg = (config || {}) as HtmlScraperConfig;
    const headers = new Headers(cfg.headers || {});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 15000);
    try {
      const res = await fetch(cfg.url, { headers, signal: controller.signal });
      const html = await res.text();
      const $ = tryLoadCheerio();

      if ($ && Array.isArray(cfg.selectors) && cfg.selectors.length > 0) {
        const out: Record<string, unknown> = {};
        const root = $(html);
        for (const rule of cfg.selectors) {
          if (rule.all) {
            const arr: unknown[] = [];
            root(rule.selector).each((_: any, el: any) => {
              const value = rule.attr ? root(el).attr(rule.attr) : root(el).text();
              if (value != null) arr.push(value);
            });
            out[rule.key] = arr;
          } else {
            const el = root(rule.selector).first();
            const value = el.length > 0 ? (rule.attr ? el.attr(rule.attr) : el.text()) : undefined;
            if (value != null) out[rule.key] = value;
          }
        }
        return { items: [out], meta: { url: cfg.url, status: res.status } };
      }

      // Fallback: return raw HTML
      return { items: [{ html }], meta: { url: cfg.url, status: res.status } };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function tryLoadCheerio(): ((html: string) => any) | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cheerio = require('cheerio');
    return cheerio.load as (html: string) => any;
  } catch {
    return null;
  }
}
