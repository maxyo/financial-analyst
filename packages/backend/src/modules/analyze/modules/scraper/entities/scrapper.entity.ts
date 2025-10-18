import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { PostProcessorConfiguration, PostProcessorType, ScraperConfiguration, ScraperType } from '../types';

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

  // Hardcoded (code-defined) post-processors configuration per scraper, not stored as a separate entity
  @Column({ type: 'simple-json', nullable: true })
  postProcessors?: { type: PostProcessorType; config: PostProcessorConfiguration[PostProcessorType] }[];
}
