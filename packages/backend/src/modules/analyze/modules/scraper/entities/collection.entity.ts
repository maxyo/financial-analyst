import { Filter } from '@trade/filter';
import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TopicEntity } from '../../../entities/topic.entity';

@Entity({ name: 'collections' })
@Index(['name'], { unique: true })
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // JSON string that stores filter criteria
  @Column({ type: 'simple-json', default: '{}' })
  filters!: Filter;

  // Optional topic association
  @ManyToOne(() => TopicEntity, (topic) => topic.collections, { nullable: true })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: TopicEntity | null;

  @Column({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @Column({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;
}
