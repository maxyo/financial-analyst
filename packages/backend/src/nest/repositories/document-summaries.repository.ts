import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { DocumentSummaryEntity } from '../entities/document-summary.entity';

@Injectable()
export class DocumentSummariesRepository extends Repository<DocumentSummaryEntity> {
  constructor(ds: DataSource) {
    super(DocumentSummaryEntity, ds.createEntityManager());
  }

  async getByDocumentId(documentId: number, kind: string = 'default'): Promise<DocumentSummaryEntity | null> {
    return this.findOne({ where: { document_id: documentId, kind } as any });
  }

  async upsertSummary(
    documentId: number,
    content: unknown,
    opts: {
      kind?: string;
      llm_model?: string | null;
      schema_version?: number;
      summary_text?: string | null;
      relevance?: number | null;
      job_id?: string | null;
      tokens_in?: number | null;
      tokens_out?: number | null;
      cost?: number | null;
    } = {},
  ): Promise<DocumentSummaryEntity> {
    const kind = opts.kind ?? 'default';
    const existing = await this.getByDocumentId(documentId, kind);
    const nowIso = new Date().toISOString();
    if (existing) {
      existing.content_json = JSON.stringify(content ?? {});
      existing.summary_text = opts.summary_text ?? existing.summary_text ?? null;
      existing.llm_model = opts.llm_model ?? existing.llm_model ?? null;
      if (opts.schema_version != null) existing.schema_version = opts.schema_version;
      if (opts.relevance !== undefined) existing.relevance = opts.relevance;
      if (opts.tokens_in !== undefined) existing.tokens_in = opts.tokens_in;
      if (opts.tokens_out !== undefined) existing.tokens_out = opts.tokens_out;
      if (opts.cost !== undefined) existing.cost = opts.cost;
      existing.job_id = opts.job_id ?? existing.job_id ?? null;
      existing.updated_at = nowIso;
      return this.save(existing);
    }
    const row = new DocumentSummaryEntity();
    row.document_id = documentId;
    row.kind = kind;
    row.content_json = JSON.stringify(content ?? {});
    row.summary_text = opts.summary_text ?? null;
    row.llm_model = opts.llm_model ?? null;
    row.schema_version = opts.schema_version ?? 1;
    row.relevance = opts.relevance ?? null;
    row.tokens_in = opts.tokens_in ?? null;
    row.tokens_out = opts.tokens_out ?? null;
    row.cost = opts.cost ?? null;
    row.job_id = opts.job_id ?? null;
    row.created_at = nowIso;
    row.updated_at = nowIso;
    return this.save(row);
  }
}
