import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ProfileExecutionEntity } from '../entities/profile-execution.entity';

@Injectable()
export class ProfileExecutionsRepository extends Repository<ProfileExecutionEntity> {
  constructor(ds: DataSource) {
    super(ProfileExecutionEntity, ds.createEntityManager());
  }
}
