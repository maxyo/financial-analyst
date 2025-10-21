import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Scraper } from '../entities/scrapper.entity';

@Injectable()
export class ScrapersRepository extends Repository<Scraper> {
  constructor(ds: DataSource) {
    super(Scraper, ds.createEntityManager());
  }
}
