import { JobsProcessor } from '../modules/jobs/processor';
import { getRepositories } from '../repositories';
import { getUserTradesByTicker } from '../api';
import { listInstruments, type InstrumentCategory } from '../api/tinkoff/instruments';

export function registerJobHandlers(jobsProcessor: JobsProcessor) {
  // Default noop handler
  jobsProcessor.register('noop', (job) => ({ ok: true, echo: job.payload }));

  // AI: aggregate analysis (stub)
  jobsProcessor.register('ai.aggregate-analysis', (job) => {
    const repos = getRepositories();
    const payload: any = job.payload || {};
    const profileId = Number(payload.profileId || payload.profile_id || 0) || undefined;
    const instrumentKey = payload.instrumentKey || payload.instrument_key || undefined;
    const nowIso = new Date().toISOString();
    const content = {
      summary_bullets: [
        'Авто-отчет (заглушка): агрегированная аналитика пока не подключена к LLM.',
        `Профиль: ${profileId ?? 'n/a'}, Инструмент: ${instrumentKey ?? 'n/a'}`,
      ],
      signals: [],
      risks: [],
      sentiment: { label: 'neutral', score: 0 },
      confidence: 0.1,
      outlook: 'Промежуточный отчет-заглушка. Подключение LLM в следующих версиях.',
      support: [],
      _meta: { generated_at: nowIso, stub: true, window: payload.window ?? null },
    };
    const rep = repos.reports.insert({
      run_id: undefined,
      profile_id: profileId || 0,
      job_id: job.id,
      instrument_key: instrumentKey,
      llm_model: 'stub',
      schema_version: 1,
      content_md: null,
      content_json: content,
      confidence: 0.1,
    });
    return { reportId: rep.id };
  });

  // AI: per-document summarize (stub)
  jobsProcessor.register('ai.summarize-documents', (job) => {
    const repos = getRepositories();
    const payload: any = job.payload || {};
    const limit = Math.max(1, Math.min(500, Number(payload.limit ?? 100)));
    const since: string | undefined = payload.since || undefined;
    const until: string | undefined = payload.until || undefined;
    const sourceIds: number[] | undefined = Array.isArray(payload.sourceIds)
      ? payload.sourceIds.map((x: any) => Number(x)).filter(Number.isFinite)
      : undefined;
    const documentIds: number[] | undefined = Array.isArray(payload.documentIds)
      ? payload.documentIds.map((x: any) => Number(x)).filter(Number.isFinite)
      : undefined;
    const force = Boolean(payload.forceRegen);

    // Select candidates
    let docs = repos.documents.listRecent(limit * 2, since, sourceIds, documentIds);
    if (until) {
      docs = docs.filter((d) => d.scraped_at <= until);
    }
    // Respect overall limit after filtering
    docs = docs.slice(0, limit);

    let processed = 0;
    let summarized = 0;
    let skipped = 0;

    for (const d of docs) {
      processed++;
      const existing = repos.documentSummaries.getByDocumentId(d.id, 'default');
      if (existing && !force) {
        skipped++;
        continue;
      }
      const nowIso = new Date().toISOString();
      const content = {
        summary: 'Заглушка: саммари ещё не сгенерировано реальным LLM.',
        key_points: [],
        sentiment: { label: 'neutral', score: 0 },
        relevance: 0,
        events: [],
        quotes: [],
        entities: [],
        uncertainty: ['not-generated'],
        _meta: { document_id: d.id, generated_at: nowIso, stub: true },
      };
      repos.documentSummaries.upsert(d.id, content, {
        kind: 'default',
        llm_model: 'stub',
        schema_version: 1,
        summary_text: 'Заглушка: саммари не сгенерировано.',
        relevance: 0,
        job_id: job.id,
      });
      summarized++;
    }

    return { processed, summarized, skipped };
  });

  // Trades: fetch user trades by ticker(s)
  jobsProcessor.register('trades.fetch-by-user', async (job) => {
    const repos = getRepositories();
    const payload: any = job.payload || {};

    // Normalize tickers from payload: allow ticker, tickers (array or comma-separated string)
    let tickers: string[] = [];
    if (Array.isArray(payload.tickers)) {
      tickers = payload.tickers.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof payload.tickers === 'string') {
      tickers = payload.tickers
        .split(/[\s,]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    const singleTicker = (payload.ticker || payload.symbol || '').trim?.() || '';
    if (singleTicker) tickers.push(singleTicker);

    // Deduplicate and normalize case
    tickers = Array.from(new Set(tickers.map((t) => t.toUpperCase())));
    if (tickers.length === 0) {
      throw new Error('ticker(s) required');
    }

    const accountId: string | undefined = (payload.accountId || payload.account_id || '').trim?.() || undefined;
    const hoursN = Number(payload.hours);
    const hours = Number.isFinite(hoursN) && hoursN > 0 ? Math.floor(hoursN) : 24;

    let totalFetched = 0;
    let totalSavedApprox = 0;
    const perTicker: Array<{ ticker: string; fetched: number; savedApprox: number }> = [];
    const errors: Array<{ ticker: string; error: string }> = [];

    for (const ticker of tickers) {
      try {
        const trades = await getUserTradesByTicker(ticker, accountId, hours);
        totalFetched += trades.length;
        repos.trades.upsertUser(ticker, accountId, trades);
        totalSavedApprox += trades.length; // approximate due to INSERT OR IGNORE
        perTicker.push({ ticker, fetched: trades.length, savedApprox: trades.length });
      } catch (e: any) {
        errors.push({ ticker, error: e?.message || String(e) });
      }
    }

    return {
      tickers,
      accountId: accountId ?? null,
      hours,
      totals: { fetched: totalFetched, savedApprox: totalSavedApprox },
      perTicker,
      errors,
    };
  });

  // Instruments: import from Tinkoff provider and save to DB
  jobsProcessor.register('instruments.import.tinkoff', async (job) => {
    const repos = getRepositories();
    const payload: any = job.payload || {};

    // Normalize categories (types) from payload
    const rawTypes: any = payload.types || payload.categories || payload.kinds;
    const allowed: InstrumentCategory[] = ['shares', 'futures', 'bonds', 'etfs', 'currencies'];
    let categories: InstrumentCategory[] | undefined = undefined;
    if (Array.isArray(rawTypes)) {
      const norm = rawTypes.map((x) => String(x).toLowerCase().trim());
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
      const norm = rawTypes
        .split(/[,\s]+/)
        .map((s: string) => s.toLowerCase().trim())
        .filter(Boolean);
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    }

    const dryRun = Boolean(payload.dryRun || payload.dry_run);

    const rows = await listInstruments(categories);
    let upserts = 0;

    if (!dryRun) {
      for (const r of rows) {
        // Skip invalid ticker rows just in case
        if (!r.ticker) continue;
        repos.instruments.upsert(r);
        upserts++;
      }
    }

    return {
      provider: 'tinkoff',
      categories: categories ?? allowed,
      dryRun,
      fetched: rows.length,
      upserted: dryRun ? 0 : upserts,
    };
  });
}
