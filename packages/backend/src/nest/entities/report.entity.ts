import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AnalysisProfileEntity } from './analysis-profile.entity';

@Entity({ name: 'reports' })
@Index(['profile_id', 'created_at'])
@Index(['instrument_key', 'created_at'])
export class ReportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', name: 'run_id', nullable: true })
  run_id!: string | null;

  @Column({ type: 'integer', name: 'profile_id' })
  profile_id!: number;

  @ManyToOne(() => AnalysisProfileEntity)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile!: AnalysisProfileEntity;

  @Column({ type: 'text', name: 'job_id', nullable: true })
  job_id!: string | null;

  @Column({ type: 'text', name: 'instrument_key', nullable: true })
  instrument_key!: string | null;

  @Column({ type: 'text', name: 'llm_model', nullable: true })
  llm_model!: string | null;

  @Column({ type: 'integer', name: 'schema_version', default: 1 })
  schema_version!: number;

  @Column({ type: 'text', name: 'content_md', nullable: true })
  content_md!: string | null;

  @Column({ type: 'text', name: 'content_json' })
  content_json!: string;

  @Column({ type: 'real', name: 'confidence', nullable: true })
  confidence!: number | null;

  @Column({ type: 'text', name: 'created_at' })
  created_at!: string;
}
