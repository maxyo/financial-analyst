import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

import { PostProcessorConfiguration, PostProcessorType, ScraperConfiguration, ScraperType } from '../types';
import { TopicEntity } from './topic.entity';

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

  // Optional topic association
  @ManyToOne(() => TopicEntity, (topic) => topic.scrapers, { nullable: true })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: TopicEntity | null;
}
