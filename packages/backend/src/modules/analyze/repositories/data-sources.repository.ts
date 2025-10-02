import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { SourceEntity } from '../entities/source.entity';

@Injectable()
export class DataSourcesRepository extends Repository<SourceEntity> {
  constructor(ds: DataSource) {
    super(SourceEntity, ds.createEntityManager());
  }
}
