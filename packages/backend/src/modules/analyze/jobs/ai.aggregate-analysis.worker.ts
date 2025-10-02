import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
// using global getRepositories (ambient)

@Injectable()
@Processor('ai.aggregate-analysis')
export class AiAggregateAnalysisWorker extends WorkerHost {
  async process(job: Job) {
    // @ts-ignore
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
      outlook:
        'Промежуточный отчет-заглушка. Подключение LLM в следующих версиях.',
      support: [],
      _meta: {
        generated_at: nowIso,
        stub: true,
        window: payload.window ?? null,
      },
    } as const;
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
}
