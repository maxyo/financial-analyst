import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

import { DocumentSourceEntity } from './source.entity';
import { TaskEntity } from './task.entity';
import { TopicEntity } from './topic.entity';

@Entity({ name: 'profile' })
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', name: 'created_at' })
  created_at!: string;

  @Column({ type: 'text', name: 'updated_at' })
  updated_at!: string;

  @OneToMany(() => DocumentSourceEntity, (source) => source.profile)
  documentSources!: DocumentSourceEntity[];

  // Each profile must have at most one task. Many profiles can reference the same task.
  @ManyToOne(() => TaskEntity, { nullable: true })
  @JoinColumn({ name: 'task_id', referencedColumnName: 'id' })
  task!: TaskEntity | null;

  // Optional topic this profile belongs to
  @ManyToOne(() => TopicEntity, (topic) => topic.profiles, { nullable: true })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: TopicEntity | null;
}
