import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { TopicEntity } from '../entities/topic.entity';

@Injectable()
export class TopicsRepository extends Repository<TopicEntity> {
  constructor(ds: DataSource) {
    super(TopicEntity, ds.createEntityManager());
  }
}
