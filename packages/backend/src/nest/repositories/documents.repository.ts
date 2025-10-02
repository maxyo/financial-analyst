import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { DocumentEntity } from '../entities/document.entity';
import { computeContentHash } from '../../modules/scraper/types';

@Injectable()
export class DocumentsRepository extends Repository<DocumentEntity> {
  constructor(ds: DataSource) {
    super(DocumentEntity, ds.createEntityManager());
  }

  async insertOne(sourceId: number, content: unknown, scrapedAt?: Date): Promise<{ inserted: boolean; id?: number }>
  {
    const nowIso = (scrapedAt ?? new Date()).toISOString();
    const hash = computeContentHash(content);
    const existing = await this.findOne({ where: { sourceId, contentHash: hash } as any });
    if (existing) return { inserted: false, id: existing.id };
    const row = new DocumentEntity();
    row.sourceId = sourceId;
    row.content = typeof content === 'string' ? content : JSON.stringify(content);
    row.scrapedAt = nowIso;
    row.contentHash = hash;
    const saved = await this.save(row);
    return { inserted: true, id: saved.id };
  }

  async listRecent(limit: number, sinceIso?: string, sourceIds?: number[], documentIds?: number[]): Promise<DocumentEntity[]> {
    const whereClauses: any = {};
    if (Array.isArray(sourceIds) && sourceIds.length > 0) whereClauses.sourceId = In(sourceIds);
    if (Array.isArray(documentIds) && documentIds.length > 0) whereClauses.id = In(documentIds);
    const rows = await this.find({ where: whereClauses, order: { scrapedAt: 'DESC' }, take: Math.max(1, Math.min(1000, Number(limit) || 100)) });
    if (!sinceIso) return rows;
    return rows.filter((r) => r.scrapedAt <= sinceIso);
  }
}
