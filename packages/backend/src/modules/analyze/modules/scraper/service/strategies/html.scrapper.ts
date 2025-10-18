import * as $ from 'cheerio';

import { Scraper } from '../../entities/scrapper.entity';
import { ScrapedItem, ScraperType } from '../../types';


function resolveUrl(baseUrl: string, href: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

export async function* htmlScraper(
  scrapper: Scraper<ScraperType.HTML>,
): AsyncGenerator<ScrapedItem<string>> {
  const cfg = scrapper.config;
  const headers = new Headers(cfg.headers || {});

  const fetchText = async (url: string, timeoutMs?: number) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs ?? cfg.timeoutMs ?? 15000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      const html = await res.text();
      return html;
    } finally {
      clearTimeout(timeout);
    }
  };

  const docCfg = cfg.document;
  const pagCfg = cfg.pagination;

  // If document config provided, perform pagination over listing pages and fetch documents
  if (docCfg) {
    const visitedPages = new Set<string>();
    const pagesQueue: string[] = [];
    const startUrl = cfg.url;
    const maxPages = pagCfg?.maxPages ?? 10;

    pagesQueue.push(startUrl);

    // If template-based pagination is configured, pre-enqueue pages up to maxPages
    if (pagCfg?.nextUrlTemplate) {
      const startPage = pagCfg.startPage ?? 1;
      for (let p = startPage; p < startPage + maxPages; p++) {
        const templ = pagCfg.nextUrlTemplate;
        const url = templ
          .replace('{page}', String(p))
          .replace('{base}', startUrl);
        pagesQueue.push(url);
      }
    }

    let processedPages = 0;
    while (pagesQueue.length > 0 && processedPages < maxPages) {
      const pageUrl = pagesQueue.shift()!;
      if (visitedPages.has(pageUrl)) continue;
      visitedPages.add(pageUrl);
      processedPages++;

      let pageHtml: string;
      try {
        pageHtml = await fetchText(pageUrl);
      } catch {
        continue; // skip failed page
      }
      const root = $.load(pageHtml);

      // Discover next page via selector if configured
      if (pagCfg?.nextSelector) {
        const nextEl = root(pagCfg.nextSelector).first();
        const href = nextEl.attr('href');
        if (href) {
          const nextUrl = resolveUrl(pageUrl, href);
          if (!visitedPages.has(nextUrl) && !pagesQueue.includes(nextUrl)) {
            pagesQueue.push(nextUrl);
          }
        }
      }

      // Collect document links on the listing page
      const linkAttr = docCfg.linkAttr ?? 'href';
      const baseForLinks = docCfg.baseUrl || pageUrl;
      const links: string[] = [];
      const maxDocsPerPage = docCfg.maxDocsPerPage ?? 50;
      const linkElements = root(docCfg.linkSelector).toArray().slice(0, maxDocsPerPage);
      for (const el of linkElements) {
        const href = root(el).attr(linkAttr);
        if (!href) continue;
        const abs = resolveUrl(baseForLinks, href);
        if (!links.includes(abs)) links.push(abs);
      }

      for (const docUrl of links) {
        let docHtml: string;
        try {
          docHtml = await fetchText(docUrl);
        } catch {
          continue; // skip failed doc
        }
        const doc = $.load(docHtml);
        const titleSel = docCfg.titleSelector ?? 'title';
        const contentSel = docCfg.contentSelector ?? 'body';
        const title = (doc(titleSel).first().text() || 'Untitled').trim();
        // Optional date extraction
        let dateStr: string | undefined;
        if (docCfg.dateSelector) {
          const dateEl = doc(docCfg.dateSelector).first();
          if (dateEl && dateEl.length > 0) {
            const raw = docCfg.dateAttr ? dateEl.attr(docCfg.dateAttr) : dateEl.text();
            if (raw) {
              const trimmed = raw.trim();
              const ts = Date.parse(trimmed);
              if (!Number.isNaN(ts)) {
                dateStr = new Date(ts).toISOString();
              } else {
                dateStr = trimmed; // keep as-is if cannot parse
              }
            }
          }
        }

        // Remove script/style/noscript elements before extracting text to avoid JS/CSS noise
        doc('script, style, noscript').remove();
        // Also remove inline event handler attributes which could leak code text in some cases
        doc('[onload], [onclick], [onmouseover], [onerror]').each((_, el) => {
          const $el = doc(el);
          ['onload','onclick','onmouseover','onerror'].forEach((attr) => $el.removeAttr(attr));
        });

        let content = '';
        if (contentSel) {
          const nodes = doc(contentSel);
          if (nodes.length > 0) {
            const parts: string[] = [];
            nodes.each((_, n) => { parts.push(doc(n).text().trim()); });
            content = parts.filter(Boolean).join('\n').trim();
          }
        }
        if (!content) content = doc('body').text().trim();

        // Post-trim: drop leftover typical UI noise lines (e.g., cookie banners)
        if (content) {
          const noisePatterns = [
            /правилами использования cookies/i,
            /cookie/i,
            /document\.ready\(/i,
            /\$\(document\)\.ready/i,
          ];
          content = content
            .split('\n')
            .filter((line) => !noisePatterns.some((re) => re.test(line)))
            .join('\n')
            .trim();
        }

        if (content) {
          const item: ScrapedItem<string> = { title, content };
          if (dateStr) item.date = dateStr;
          yield item;
        }
      }
    }

    return; // done
  }

  // Fallback: original simple selection (single page; or caller can still configure pagination via selectors list-only)
  const firstPageHtml = await fetchText(cfg.url);
  const root = $.load(firstPageHtml);
  root('script, style, noscript').remove();
  for (const rule of cfg.selectors) {
    for (const item of root(rule.selector)) {
      const value = root(item).text();
      if (value != null) yield { content: value, title: rule.name ?? 'Unknown' };
    }
  }
}
