import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ScraperConfiguration, ScraperType } from '../types';

@Entity({ name: 'scrapers' })
export class Scraper<T extends ScraperType = ScraperType> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  type!: T;

  @Column({ type: 'simple-json' })
  config!: ScraperConfiguration[T];
}
