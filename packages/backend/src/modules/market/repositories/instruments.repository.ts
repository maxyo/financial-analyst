import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';

import { InstrumentEntity } from '../entities/instrument.entity';

export type UpsertInstrument = Partial<InstrumentEntity> & { ticker: string };

@Injectable()
export class InstrumentsRepository extends Repository<InstrumentEntity> {
  constructor(dataSource: DataSource) {
    super(InstrumentEntity, dataSource.createEntityManager());
  }

  async getByTicker(ticker: string): Promise<InstrumentEntity | null> {
    const t = String(ticker || '').trim();
    if (!t) return null;
    return this.findOne({ where: { ticker: t.toUpperCase() } });
  }

  async findByQuery(query: string): Promise<InstrumentEntity | null> {
    const q = String(query || '').trim();
    if (!q) return null;
    // Try exact by ticker first
    const exact = await this.getByTicker(q);
    if (exact) return exact;
    // Then try by FIGI/UID exact match
    const byId = await this.findOne({ where: [{ figi: q }, { uid: q }] });
    if (byId) return byId;
    // Then fuzzy by name or ticker (case-insensitive)
    const like = `%${q}%`;
    const found = await this.findOne({
      where: [{ name: ILike(like) }, { ticker: ILike(like) }],
    });
    return found ?? null;
  }

  async upsertInstrument(data: UpsertInstrument): Promise<InstrumentEntity> {
    const ticker = String(data.ticker || '').toUpperCase();
    if (!ticker) throw new Error('ticker required');
    const existing = await this.findOne({ where: { ticker } });
    const row: InstrumentEntity = existing
      ? { ...existing, ...data, ticker, updatedAt: new Date().toISOString() }
      : ({
          ticker,
          name: data.name ?? null,
          figi: data.figi ?? null,
          uid: data.uid ?? null,
          lot: data.lot ?? null,
          classCode: data.classCode ?? null,
          updatedAt: new Date().toISOString(),
        } as InstrumentEntity);
    return this.save(row);
  }
}
