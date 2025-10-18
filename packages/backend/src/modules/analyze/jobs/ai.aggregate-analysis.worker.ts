import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';

import { LlmService } from '../modules/llm/services/llm.service';
import { DocumentsRepository } from '../modules/scraper/repositories/documents.repository';
import { AnalysisProfilesRepository } from '../repositories/analysis-profiles.repository';
import { DocumentSourcesRepository } from '../repositories/document-sources.repository';
import { ProfileExecutionsRepository } from '../repositories/profile-executions.repository';
import { ReportsRepository } from '../repositories/reports.repository';

import type { Job } from 'bullmq';

@Injectable()
@Processor('ai.aggregate-analysis', {})
export class AiAggregateAnalysisWorker extends WorkerHost {
  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly llmService: LlmService,
    private readonly docSources: DocumentSourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly profiles: AnalysisProfilesRepository,
    private readonly executions: ProfileExecutionsRepository, 
  ) {
    super();
  }
  async process(job: Job) {
    // Mark execution running if provided
    const payload: any = job.data || {};
    const profileId = Number(payload.profileId || payload.profile_id);
    if (!Number.isFinite(profileId)) {
      throw new Error('profileId is required for ai.aggregate-analysis');
    }
    const instrumentKey = payload.instrumentKey || payload.instrument_key || undefined;
    const executionId: string | undefined = payload.executionId;
    if (executionId) {
      try {
        await this.executions.update({ id: executionId }, { status: 'running', started_at: new Date(), job_id: String(job.id) });
      } catch (e) {
        // ignore execution update errors
      }
    }

    // Load assigned document IDs for profile
    const links = await this.docSources.find({ where: { profile_id: profileId }, order: { id: 'DESC' } });
    const docIds = links.map((l: any) => l.documentId);

    // Minimal payload fields remaining in Report: content, llmModel, tokens, cost
    let contentText: string | null = null; // main narrative

    let llmModel = 'mistralai/mistral-medium-3.1';
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;
    let cost: number | null = null; // Not provided by LlmService currently

    if (docIds.length === 0) {
      contentText = 'Недостаточно данных для агрегированной аналитики. Добавьте документы к профилю и повторите попытку.';
    } else {
      // Fetch documents
      const docs = await this.documents.findBy({ id: In(docIds) });
      // Prepare compact context (limit content length per doc)
      const MAX_PER_DOC = 1200; // chars
      const items = docs.map((d: any) => ({
        id: d.id,
        title: d.title,
        scrapedAt: d.scrapedAt,
        excerpt: String(d.content || '').slice(0, MAX_PER_DOC),
      }));

      // Build prompt: take from task attached to profile; fallback to default if absent
      const profile = await this.profiles.findOne({ where: { id: profileId }, relations: ['task'] });
      const taskPrompt = profile?.task?.prompt?.toString().trim();
      const defaultInstructions = [
        'Ты — аналитик финансовых рынков. На основе предоставленного корпуса документов составь агрегированный отчет.',
        'Требуется только валидный JSON без каких-либо дополнительных пояснений.',
        'Структура JSON:',
        '{',
        '  "summary_bullets": string[],',
        '  "signals": string[],',
        '  "risks": string[],',
        '  "sentiment": { "label": "bearish"|"neutral"|"bullish", "score": number },',
        '  "confidence": number,',
        '  "outlook": string,',
        '  "support": {"documentId": string, "quote": string}[]',
        '}',
        'Где support — список цитат с указанием документа-источника.',
      ].join('\n');

      const instructions = [
        taskPrompt && taskPrompt.length ? taskPrompt : defaultInstructions,
        instrumentKey ? `Контекст инструмента: ${instrumentKey}` : undefined,
      ].filter(Boolean).join('\n');

      const prompt = `${instructions}\n\nДанные:\n${JSON.stringify(items, null, 2)}\n\nОтветь ТОЛЬКО JSON.`;

      try {
        const res = await this.llmService.infer(prompt);
        tokensIn = res.inTokens ?? null;
        tokensOut = res.outTokens ?? null;

        const raw = typeof res.message === 'string' ? res.message.trim() : String(res.message ?? '');
        const unwrapped = raw.replace(/^```(?:json)?\s*[\r\n]?([\s\S]*?)```\s*$/i, '$1').trim();
        // Prefer outlook field if valid JSON with outlook, otherwise keep unwrapped/raw as content
        try {
          const parsed = JSON.parse(unwrapped);
          if (parsed && typeof parsed === 'object' && typeof parsed.outlook === 'string') {
            contentText = parsed.outlook;
          } else {
            contentText = unwrapped || raw;
          }
        } catch {
          contentText = unwrapped || raw;
        }
      } catch (e: any) {
        contentText = 'Не удалось выполнить агрегированный анализ: ' + (e?.message ?? String(e));
      }
    }

    const insertRes = await this.reportsRepo.insert({
      profile_id: profileId,
      llmModel: llmModel,
      content: contentText,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost: cost,
      created_at: new Date(),
    });
    const reportId = insertRes.identifiers?.[0]?.id ?? insertRes.raw?.id ?? undefined;
    if (executionId) {
      try {
        await this.executions.update({ id: executionId }, { status: 'succeeded', finished_at: new Date(), report_id: reportId ?? null });
      } catch (e) {
        // ignore execution update errors
      }
    }
    return { reportId };
  }
}
