import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ProfileEntity } from './profile.entity';

@Entity({ name: 'tasks' })
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string; // short title for the task

  @Column({ type: 'text', nullable: true })
  description!: string | null; // optional human-readable description

  @Column({ type: 'text' })
  prompt!: string; // the prompt/content describing the task to execute

  @Column({ type: 'text', name: 'created_at' })
  createdAt!: string;

  @Column({ type: 'text', name: 'updated_at' })
  updatedAt!: string;

  // One task can be assigned to many profiles, but each profile has at most one task.
  @OneToMany(() => ProfileEntity, (profile) => profile.task)
  profiles!: ProfileEntity[];
}
