import type { IScraper, ScrapeContext, ScrapeResult } from '../types';

interface ApiAuthConfig {
  type?: 'bearer' | 'header';
  token?: string; // direct value
  envVar?: string; // read from env if provided
  headerName?: string; // when type = header
  prefix?: string; // e.g., 'Bearer '
}

export interface ApiScraperConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  auth?: ApiAuthConfig;
  timeoutMs?: number;
  jsonPath?: string | string[]; // dot-path into JSON
  itemsPath?: string | string[]; // alias for jsonPath
}

function buildUrl(base: string, query?: ApiScraperConfig['query']): string {
  if (!query) return base;
  const u = new URL(base);
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function resolveAuth(auth: ApiAuthConfig | undefined, env: Record<string, string | undefined>): { header?: [string, string] } {
  if (!auth) return {};
  const token = auth.token ?? (auth.envVar ? env[auth.envVar] : undefined);
  if (!token) return {};
  const prefix = auth.prefix ?? (auth.type === 'bearer' ? 'Bearer ' : '');
  if (auth.type === 'header') {
    const name = auth.headerName || 'Authorization';
    return { header: [name, `${prefix}${token}`] };
  }
  // default to Authorization: Bearer <token>
  return { header: ['Authorization', `${prefix || 'Bearer '}${token}`] };
}

function getByPath(obj: any, path: string | string[] | undefined): any {
  if (!path) return obj;
  const parts = Array.isArray(path) ? path : path.split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p as keyof typeof cur];
  }
  return cur;
}

export class RestApiScraper implements IScraper {
  async scrape(config: unknown, ctx: ScrapeContext): Promise<ScrapeResult> {
    const cfg = (config || {}) as ApiScraperConfig;
    const method = cfg.method || 'GET';
    const url = buildUrl(cfg.url, cfg.query);
    const headers = new Headers(cfg.headers || {});

    const { header } = resolveAuth(cfg.auth, ctx.env || process.env);
    if (header) headers.set(header[0], header[1]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 15000);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: cfg.body ? JSON.stringify(cfg.body) : undefined,
        signal: controller.signal,
      } as RequestInit);
      const ct = res.headers.get('content-type') || '';
      let payload: unknown;
      if (/application\/json/i.test(ct) || ct.includes('+json')) {
        payload = await res.json();
      } else {
        payload = await res.text();
      }

      const itemsSource = getByPath(
        payload,
        cfg.jsonPath || cfg.itemsPath
      );
      let items: unknown[];
      if (Array.isArray(itemsSource)) {
        items = itemsSource as unknown[];
      } else if (itemsSource != null) {
        items = [itemsSource];
      } else if (payload != null) {
        items = [payload];
      } else {
        items = [];
      }
      return { items, meta: { status: res.status, url } };
    } finally {
      clearTimeout(timeout);
    }
  }
}
