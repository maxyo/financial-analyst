import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { FundingRateEntity } from '../entities/funding-rate.entity';

@Injectable()
export class FundingRatesRepository extends Repository<FundingRateEntity> {
  constructor(ds: DataSource) {
    super(FundingRateEntity, ds.createEntityManager());
  }
}