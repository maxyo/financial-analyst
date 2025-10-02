import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

import { ProfileEntity } from './profile.entity';

@Entity({ name: 'reports' })
@Index(['profile_id', 'created_at'])
export class ReportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'profile_id' })
  profile_id!: number;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile!: ProfileEntity;

  @Column({ type: 'text', name: 'job_id', nullable: true })
  job_id!: string | null;

  @Column({ type: 'text', name: 'content', nullable: true })
  content!: string | null;

  @Column({ type: 'real', name: 'confidence', nullable: true })
  confidence!: number | null;

  @Column({ type: 'text', name: 'created_at' })
  created_at!: string;

  @Column({ type: 'text', default: 'default' })
  kind!: string;

  @Column({ type: 'real', nullable: true })
  relevance!: number | null;

  @Column({ type: 'integer', name: 'tokens_in', nullable: true })
  tokens_in!: number | null;

  @Column({ type: 'integer', name: 'tokens_out', nullable: true })
  tokens_out!: number | null;

  @Column({ type: 'real', nullable: true })
  cost!: number | null;
}
