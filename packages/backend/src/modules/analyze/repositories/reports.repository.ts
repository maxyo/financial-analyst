import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ReportEntity } from '../entities/report/report.entity';

@Injectable()
export class ReportsRepository extends Repository<ReportEntity> {
  constructor(ds: DataSource) {
    super(ReportEntity, ds.createEntityManager());
  }
}
