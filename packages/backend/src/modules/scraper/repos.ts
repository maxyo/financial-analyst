import { ensureScraperSchema } from './schema';
import { computeContentHash } from './types';
import { getCandlesDb } from '../../lib/db/sqlite';

import type { DataSourceRecord, DocumentRecord, NewDataSource } from './types';


export class DataSourceRepo {
  constructor() {
    ensureScraperSchema();
  }

  insert(ds: NewDataSource): DataSourceRecord {
    const db = getCandlesDb();
    const isActive = ds.is_active === false ? 0 : 1;
    const updateStrategy = ds.update_strategy ?? {
      type: 'time_interval',
      options: { value: 1, unit: 'hour' },
    };
    const stmt = db.prepare(
      `INSERT INTO data_sources(name, source_type, config, update_strategy, is_active)
       VALUES(?,?,?,?,?)`
    );
    const info = stmt.run(
      ds.name,
      ds.source_type,
      JSON.stringify(ds.config ?? {}),
      JSON.stringify(updateStrategy),
      isActive
    );
    return this.getById(Number(info.lastInsertRowid))!;
  }

  getById(id: number): DataSourceRecord | null {
    const db = getCandlesDb();
    const row = db.prepare('SELECT * FROM data_sources WHERE id=?').get(id);
    if (!row) return null;
    return this.mapSourceRow(row);
  }

  listActive(): DataSourceRecord[] {
    const db = getCandlesDb();
    const rows = db
      .prepare('SELECT * FROM data_sources WHERE is_active=1 ORDER BY id ASC')
      .all();
    return rows.map((r: any) => this.mapSourceRow(r));
  }

  listAll(): DataSourceRecord[] {
    const db = getCandlesDb();
    const rows = db.prepare('SELECT * FROM data_sources ORDER BY id ASC').all();
    return rows.map((r: any) => this.mapSourceRow(r));
  }

  updateConfig(id: number, config: unknown): void {
    const db = getCandlesDb();
    db.prepare('UPDATE data_sources SET config=? WHERE id=?').run(
      JSON.stringify(config ?? {}),
      id
    );
  }

  private mapSourceRow(row: any): DataSourceRecord {
    return {
      id: Number(row.id),
      name: row.name,
      source_type: row.source_type,
      config: safeJson(row.config),
      created_at: row.created_at,
      update_strategy: safeJson(row.update_strategy),
      is_active: Number(row.is_active) as 0 | 1,
    };
  }
}

export class DocumentRepo {
  constructor() {
    ensureScraperSchema();
  }

  insert(sourceId: number, content: unknown, scrapedAt = new Date()): {
    inserted: boolean;
    record: DocumentRecord;
  } {
    const db = getCandlesDb();
    const contentStr =
      typeof content === 'string' ? content : JSON.stringify(content ?? null);
    const contentHash = computeContentHash(contentStr);
    const scrapedIso = scrapedAt.toISOString();
    try {
      const info = db
        .prepare(
          `INSERT INTO documents(source_id, content, scraped_at, content_hash)
           VALUES (?,?,?,?)`
        )
        .run(sourceId, contentStr, scrapedIso, contentHash);
      const rec = this.getById(Number(info.lastInsertRowid))!;
      return { inserted: true, record: rec };
    } catch (e: any) {
      // Unique constraint -> already exists
      const msg: string = typeof e?.message === 'string' ? e.message : '';
      const code: string | undefined = e?.code;
      const isUnique =
        code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        msg.includes('UNIQUE constraint failed') ||
        msg.includes('uq_documents_source_hash');
      if (isUnique) {
        const existing = this.getBySourceAndHash(sourceId, contentHash);
        if (!existing) throw e;
        return { inserted: false, record: existing };
      }
      throw e;
    }
  }

  getById(id: number): DocumentRecord | null {
    const db = getCandlesDb();
    const row = db.prepare('SELECT * FROM documents WHERE id=?').get(id);
    return row ? this.mapDocRow(row) : null;
  }

  getBySourceAndHash(
    sourceId: number,
    hash: string
  ): DocumentRecord | null {
    const db = getCandlesDb();
    const row = db
      .prepare(
        'SELECT * FROM documents WHERE source_id=? AND content_hash=? LIMIT 1'
      )
      .get(sourceId, hash);
    return row ? this.mapDocRow(row) : null;
  }

  listBySource(sourceId: number, limit = 50): DocumentRecord[] {
    const db = getCandlesDb();
    const rows = db
      .prepare(
        'SELECT * FROM documents WHERE source_id=? ORDER BY scraped_at DESC LIMIT ?'
      )
      .all(sourceId, limit);
    return rows.map((r: any) => this.mapDocRow(r));
  }

  private mapDocRow(row: any): DocumentRecord {
    return {
      id: Number(row.id),
      source_id: Number(row.source_id),
      content: safeJson(row.content) ?? row.content,
      scraped_at: row.scraped_at,
      content_hash: row.content_hash,
    };
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return undefined;
  }
}
