import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ProfileEntity } from '../entities/profile.entity';

@Injectable()
export class AnalysisProfilesRepository extends Repository<ProfileEntity> {
  constructor(ds: DataSource) {
    super(ProfileEntity, ds.createEntityManager());
  }
}
