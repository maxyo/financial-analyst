import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CollectionEntity } from '../entities/collection.entity';

@Injectable()
export class CollectionsRepository extends Repository<CollectionEntity> {
  constructor(ds: DataSource) {
    super(CollectionEntity, ds.createEntityManager());
  }
}
