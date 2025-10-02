import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ReportEntity } from '../entities/report.entity';

@Injectable()
export class ReportsRepository extends Repository<ReportEntity> {
  constructor(ds: DataSource) {
    super(ReportEntity, ds.createEntityManager());
  }

  async getById(id: number): Promise<ReportEntity | null> {
    if (!Number.isFinite(id)) return null;
    return this.findOne({ where: { id } });
  }
}
