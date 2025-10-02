import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { AnalysisProfileEntity } from '../entities/analysis-profile.entity';
import { AnalysisProfileSourceEntity } from '../entities/analysis-profile-source.entity';

export type InsertAnalysisProfile = {
  name: string;
  description?: string | null;
  instrument_ticker?: string | null;
};

export type UpdateAnalysisProfile = Partial<InsertAnalysisProfile>;

export type UpsertSource = {
  source_id: number;
  filters_json?: string | null;
};

@Injectable()
export class AnalysisProfilesRepository extends Repository<AnalysisProfileEntity> {
  constructor(ds: DataSource) {
    super(AnalysisProfileEntity, ds.createEntityManager());
  }

  async list(limit: number, offset: number): Promise<AnalysisProfileEntity[]> {
    const take = Math.max(1, Math.min(1000, Number(limit) || 100));
    const skip = Math.max(0, Number(offset) || 0);
    return this.find({ order: { id: 'ASC' } as any, take, skip });
  }

  async getById(id: number): Promise<AnalysisProfileEntity | null> {
    if (!Number.isFinite(id)) return null;
    return this.findOne({ where: { id } });
  }

  async createOne(input: InsertAnalysisProfile): Promise<AnalysisProfileEntity> {
    const nowIso = new Date().toISOString();
    const row = new AnalysisProfileEntity();
    row.name = input.name;
    row.description = input.description ?? null;
    row.instrument_ticker = input.instrument_ticker ?? null;
    row.created_at = nowIso;
    row.updated_at = nowIso;
    return this.save(row);
  }

  async updateOne(id: number, fields: UpdateAnalysisProfile): Promise<AnalysisProfileEntity | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    if (fields.name !== undefined) existing.name = String(fields.name);
    if (fields.description !== undefined) existing.description = fields.description as any;
    if (fields.instrument_ticker !== undefined) existing.instrument_ticker = fields.instrument_ticker as any;
    existing.updated_at = new Date().toISOString();
    return this.save(existing);
  }

  async listSources(profileId: number): Promise<AnalysisProfileSourceEntity[]> {
    const repo = this.manager.getRepository(AnalysisProfileSourceEntity);
    return repo.find({ where: { profile_id: profileId }, order: { id: 'ASC' } as any });
  }

  async upsertSources(profileId: number, sources: UpsertSource[]): Promise<void> {
    const repo = this.manager.getRepository(AnalysisProfileSourceEntity);
    // Replace all existing sources for the profile with provided list
    await repo.delete({ profile_id: profileId } as any);
    if (!Array.isArray(sources) || sources.length === 0) return;
    const rows = sources.map((s) => {
      const r = new AnalysisProfileSourceEntity();
      r.profile_id = profileId;
      r.source_id = Number(s.source_id);
      r.filters_json = s.filters_json ?? null;
      return r;
    });
    await repo.save(rows);
  }
}
