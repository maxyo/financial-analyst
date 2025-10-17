import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

import { ProfileEntity } from './profile.entity';

@Entity({ name: 'reports' })
@Index(['profile_id', 'created_at'])
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer', name: 'profile_id' })
  profile_id!: number;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile!: ProfileEntity;

  @Column({ type: 'text', name: 'job_id', nullable: true })
  job_id!: string | null;

  // Type of report content structure, e.g., 'md' | 'json' | custom identifiers
  @Column({ type: 'varchar', name: 'type', nullable: true })
  type!: string | null;

  @Column({ type: 'text', name: 'content', nullable: true })
  content!: string | null;

  @Column({ type: 'varchar', name: 'llm_model', nullable: true })
  llmModel!: string | null;

  @Column({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @Column({ type: 'integer', name: 'tokens_in', nullable: true })
  tokens_in!: number | null;

  @Column({ type: 'integer', name: 'tokens_out', nullable: true })
  tokens_out!: number | null;

  @Column({ type: 'real', nullable: true })
  cost!: number | null;
}
