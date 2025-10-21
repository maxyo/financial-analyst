import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { CollectionEntity } from './collection.entity';
import { ProfileEntity } from './profile.entity';
import { Scraper } from './scrapper.entity';

@Entity({ name: 'topics' })
export class TopicEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => TopicEntity, (topic) => topic.children, { nullable: true })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parent!: TopicEntity | null;

  @OneToMany(() => TopicEntity, (topic) => topic.parent)
  children!: TopicEntity[];

  // Backrefs
  @OneToMany(() => ProfileEntity, (p) => p.topic)
  profiles!: ProfileEntity[];

  @OneToMany(() => Scraper, (s) => s.topic)
  scrapers!: Scraper[];

  @OneToMany(() => CollectionEntity, (c) => c.topic)
  collections!: CollectionEntity[];

  @Column({ type: 'text', name: 'created_at' })
  createdAt!: string;

  @Column({ type: 'text', name: 'updated_at' })
  updatedAt!: string;
}
