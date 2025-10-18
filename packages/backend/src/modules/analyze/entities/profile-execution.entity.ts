import { Column, Entity, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

import { ProfileEntity } from './profile.entity';
import { ReportEntity } from './report/report.entity';

// Entity that represents a single run of profile generation ("запуск генерации профиля")
// Holds run-related metadata, status and links to profile and generated report
// Using a separate table allows keeping history of runs for the same profile
@Entity({ name: 'profile_executions' })
@Index(['profile_id', 'created_at'])
export class ProfileExecutionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer', name: 'profile_id' })
  profile_id!: number;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile!: ProfileEntity;

  // Optional link to a produced report as a result of this execution
  @Column({ type: 'text', name: 'report_id', nullable: true })
  report_id!: string | null;

  @ManyToOne(() => ReportEntity, { nullable: true })
  @JoinColumn({ name: 'report_id', referencedColumnName: 'id' })
  report!: ReportEntity | null;

  // Queue/job identification if applicable
  @Column({ type: 'text', name: 'job_id', nullable: true })
  job_id!: string | null;

  // Execution status lifecycle
  // pending -> running -> succeeded | failed | cancelled
  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';

  // Optional failure reason / diagnostics
  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ type: 'datetime', name: 'created_at', default: () => "(datetime('now'))" })
  created_at!: Date;

  @Column({ type: 'datetime', name: 'started_at', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'datetime', name: 'finished_at', nullable: true })
  finished_at!: Date | null;
}
