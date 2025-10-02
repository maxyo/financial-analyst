import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { DocumentEntity } from '../entities/document.entity';

@Injectable()
export class DocumentsRepository extends Repository<DocumentEntity> {
  constructor(ds: DataSource) {
    super(DocumentEntity, ds.createEntityManager());
  }
}
