import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { DataSourceEntity } from '../entities/data-source.entity';

export type InsertDataSource = {
  name: string;
  source_type: string;
  config: unknown;
  update_strategy?: unknown;
  is_active?: boolean;
};

@Injectable()
export class DataSourcesRepository extends Repository<DataSourceEntity> {
  constructor(ds: DataSource) {
    super(DataSourceEntity, ds.createEntityManager());
  }

  async listAll(): Promise<DataSourceEntity[]> {
    return this.find({ order: { id: 'ASC' } as any });
  }

  async listActive(): Promise<DataSourceEntity[]> {
    return this.find({ where: { isActive: 1 } as any, order: { id: 'ASC' } as any });
  }

  async getById(id: number): Promise<DataSourceEntity | null> {
    if (!Number.isFinite(id)) return null;
    return this.findOne({ where: { id } });
  }

  async insertOne(input: InsertDataSource): Promise<DataSourceEntity> {
    const row = new DataSourceEntity();
    row.name = input.name;
    row.sourceType = input.source_type;
    row.config = JSON.stringify(input.config ?? {});
    row.updateStrategy = JSON.stringify(
      input.update_strategy ?? { type: 'time_interval', options: { value: 1, unit: 'hour' } },
    );
    row.isActive = input.is_active === false ? 0 : 1;
    row.createdAt = new Date().toISOString();
    return this.save(row);
  }

  async updateOne(id: number, fields: Partial<InsertDataSource>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;
    if (fields.name != null) existing.name = String(fields.name);
    if (fields.source_type != null) existing.sourceType = String(fields.source_type);
    if (fields.config !== undefined) existing.config = JSON.stringify(fields.config);
    if (fields.update_strategy !== undefined) {
      existing.updateStrategy = JSON.stringify(fields.update_strategy);
    }
    if (fields.is_active !== undefined) {
      existing.isActive = fields.is_active ? 1 : 0;
    }
    await this.save(existing);
  }
}
