import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { TaskEntity } from '../entities/task.entity';

@Injectable()
export class TasksRepository extends Repository<TaskEntity> {
  constructor(ds: DataSource) {
    super(TaskEntity, ds.createEntityManager());
  }
}
