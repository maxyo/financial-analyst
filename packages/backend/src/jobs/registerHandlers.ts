import { JobsProcessor } from '../modules/jobs/processor';
import { getRepositories } from '../repositories';

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
}
