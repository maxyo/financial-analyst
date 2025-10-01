import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { getRepositories } from '../../repositories';
import { TradesNestService } from '../services/trades.service';
import { CandleInterval, Helpers } from 'tinkoff-invest-api';
import { normalizeInterval, intervalToMs, floorToBucket } from '../../lib/candles/aggregate';
import { normalizeTicker, toMs } from '../../lib/utils/format';
import type { CandlePoint } from '../../modules/market-prodivers/tinkoff/types';
import { Injectable } from '@nestjs/common';
import { TinkoffApiService, type InstrumentCategory } from '../modules/tinkoff/tinkoff.service';

@Injectable()
@Processor('jobs')
export class JobsWorker extends WorkerHost {
  constructor(
    private readonly tradesSvc: TradesNestService,
    private readonly tinkoff: TinkoffApiService,
  ) {
    super();
  }

  // BullMQ WorkerHost entrypoint
  async process(job: Job) {
    switch (job.name) {
      case 'noop': return this.noop(job);
      case 'ai.aggregate-analysis': return this.aiAggregate(job);
      case 'ai.summarize-documents': return this.aiSummarize(job);
      case 'instruments.import.tinkoff': return this.importInstruments(job);
      case 'trades.import.tinkoff': return this.importTrades(job);
      case 'candles.import.tinkoff': return this.importCandles(job);
      default: return { ok: true };
    }
  }
  async noop(job: Job) {
    return { ok: true, echo: job.data };
  }

  async aiAggregate(job: Job) {
    const repos = getRepositories();
    const payload: any = job.data || {};
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
      job_id: String(job.id),
      instrument_key: instrumentKey,
      llm_model: 'stub',
      schema_version: 1,
      content_md: null,
      content_json: content,
      confidence: 0.1,
    });
    return { reportId: rep.id };
  }

  async aiSummarize(job: Job) {
    const repos = getRepositories();
    const payload: any = job.data || {};
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

    let docs = repos.documents.listRecent(limit * 2, since, sourceIds, documentIds);
    if (until) {
      docs = docs.filter((d: any) => d.scraped_at <= until);
    }
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
        job_id: String(job.id),
      });
      summarized++;
    }

    return { processed, summarized, skipped };
  }

  async importInstruments(job: Job) {
    const repos = getRepositories();
    const payload: any = job.data || {};
    const rawTypes: any = payload.types || payload.categories || payload.kinds;
    const allowed: InstrumentCategory[] = ['shares', 'futures', 'bonds', 'etfs', 'currencies'];
    let categories: InstrumentCategory[] | undefined = undefined;
    if (Array.isArray(rawTypes)) {
      const norm = rawTypes.map((x) => String(x).toLowerCase().trim());
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
      const norm = rawTypes
        .split(/[\s,]+/)
        .map((s: string) => s.toLowerCase().trim())
        .filter(Boolean);
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    }
    const dryRun = Boolean(payload.dryRun || payload.dry_run);
    const rows = await this.tinkoff.listInstruments(categories);
    let upserts = 0;
    if (!dryRun) {
      for (const r of rows) {
        if (!r.ticker) continue;
        repos.instruments.upsert(r);
        upserts++;
      }
    }
    return { provider: 'tinkoff', categories: categories ?? allowed, dryRun, fetched: rows.length, upserted: dryRun ? 0 : upserts };
  }

  async importTrades(job: Job) {
    const repos = getRepositories();
    const payload: any = job.data || {};
    let tickers: string[] = [];
    if (Array.isArray(payload.tickers)) {
      tickers = payload.tickers.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof payload.tickers === 'string') {
      tickers = payload.tickers.split(/[\s,]+/).map((s: string) => s.trim()).filter(Boolean);
    }
    const singleTicker = (payload.ticker || payload.symbol || '').trim?.() || '';
    if (singleTicker) tickers.push(singleTicker);
    tickers = Array.from(new Set(tickers.map((t) => t.toUpperCase())));
    if (tickers.length === 0) {
      throw new Error('ticker(s) required');
    }
    const accountId: string | undefined = (payload.accountId || payload.account_id || '').trim?.() || undefined;
    const hoursN = Number(payload.hours);
    const hours = Number.isFinite(hoursN) && hoursN > 0 ? Math.floor(hoursN) : 24;

    let totalFetched = 0;
    let totalSavedApprox = 0;
    const perTicker: Array<{ ticker: string; fetched: number; savedApprox: number }>= [];
    const errors: Array<{ ticker: string; error: string }> = [];

    for (const ticker of tickers) {
      try {
        const trades = await this.tradesSvc.getUserTrades(ticker, accountId, hours);
        totalFetched += trades.length;
        void repos.trades.upsertUser(ticker, accountId, trades);
        totalSavedApprox += trades.length;
        perTicker.push({ ticker, fetched: trades.length, savedApprox: trades.length });
      } catch (e: any) {
        errors.push({ ticker, error: e?.message || String(e) });
      }
    }

    return { tickers, accountId: accountId ?? null, hours, totals: { fetched: totalFetched, savedApprox: totalSavedApprox }, perTicker, errors };
  }

  async importCandles(job: Job) {
    const payload: any = job.data || {};
    const repos = getRepositories();

    let symbol = normalizeTicker(payload.ticker || payload.symbol);
    const intervalIn = String(payload.interval || '1m');
    const cacheInterval = normalizeInterval(intervalIn);
    const sdkInterval = (function cacheIntervalToTinkoff(i?: string | null): CandleInterval {
      switch (normalizeInterval(i || '1m')) {
        case '1m': return CandleInterval.CANDLE_INTERVAL_1_MIN;
        case '5m': return CandleInterval.CANDLE_INTERVAL_5_MIN;
        case '15m': return CandleInterval.CANDLE_INTERVAL_15_MIN;
        case '1h': return CandleInterval.CANDLE_INTERVAL_HOUR;
      }
    })(cacheInterval);

    const now = Date.now();
    const fromMsRaw = toMs(payload.windowStart ?? payload.from) ?? now - 24 * 60 * 60 * 1000;
    const toMsRaw = toMs(payload.windowEnd ?? payload.to) ?? now;
    const ivMs = intervalToMs(cacheInterval);
    const fromAligned = floorToBucket(Math.trunc(fromMsRaw), ivMs);
    const lastBucket = floorToBucket(Math.trunc((toMsRaw ?? now) - 1), ivMs);

    let instrumentId: string | undefined = payload.instrumentId || payload.instrument_id;
    if (!instrumentId && symbol) {
      const found = await this.tinkoff.findInstrument(symbol);
      const instrument = found.instruments.find((i) => i.ticker?.toUpperCase() === symbol) || found.instruments[0];
      if (!instrument) {
        throw new Error(`Инструмент не найден по запросу: ${symbol}`);
      }
      instrumentId = (instrument.figi as string) || (instrument.uid as string) || (instrument.ticker as string);
      if (!symbol) symbol = (instrument.ticker as string)?.toUpperCase?.() || symbol;
    }
    if (!instrumentId) {
      throw new Error('instrumentId or ticker is required');
    }
    if (!symbol) {
      symbol = String(payload.ticker || payload.symbol || instrumentId).toUpperCase();
    }

    const apiResp = await this.tinkoff.marketdataGetCandles({
      instrumentId,
      from: new Date(fromAligned),
      to: new Date(lastBucket + ivMs),
      interval: sdkInterval,
    });

    const byBucket = new Map<number, CandlePoint>();
    const list = apiResp.candles || [];
    for (const c of list) {
      const time = new Date(c.time || new Date()).getTime();
      if (!Number.isFinite(time)) continue;
      const b = floorToBucket(time, ivMs);
      const p: CandlePoint = {
        t: new Date(b).toISOString(),
        o: c.open ? Helpers.toNumber(c.open) : 0,
        h: c.high ? Helpers.toNumber(c.high) : 0,
        l: c.low ? Helpers.toNumber(c.low) : 0,
        c: c.close ? Helpers.toNumber(c.close) : 0,
        v: Number(c.volume ?? 0),
      };
      byBucket.set(b, p);
    }

    const complete: CandlePoint[] = [];
    let filledZeros = 0;
    for (let ts = fromAligned; ts <= lastBucket; ts += ivMs) {
      const have = byBucket.get(ts);
      if (have) {
        complete.push({ ...have, t: new Date(ts).toISOString() });
      } else {
        complete.push({ t: new Date(ts).toISOString(), o: 0, h: 0, l: 0, c: 0, v: 0 });
        filledZeros += 1;
      }
    }

    repos.candles.upsertCandles(symbol, cacheInterval, complete);

    return { ticker: symbol, interval: cacheInterval, from: new Date(fromAligned).toISOString(), to: new Date(lastBucket + ivMs).toISOString(), fetched: list.length, saved: complete.length, filledZeros };
  }
}
