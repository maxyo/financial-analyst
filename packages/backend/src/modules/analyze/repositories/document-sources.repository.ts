import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { DocumentSourceEntity } from '../entities/source.entity';

@Injectable()
export class DocumentSourcesRepository extends Repository<DocumentSourceEntity> {
  constructor(ds: DataSource) {
    super(DocumentSourceEntity, ds.createEntityManager());
  }
}
