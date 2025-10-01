import { JobsProcessor } from '../../modules/jobs/processor';
import { getRepositories } from '../../repositories';

export default function registerAiSummarizeDocuments(jobsProcessor: JobsProcessor) {
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
