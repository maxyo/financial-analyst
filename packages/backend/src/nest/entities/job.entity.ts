import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'jobs' })
@Index(['status', 'runAt', 'priority'])
export class JobEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text' })
  type!: string;

  @Column({ type: 'text' })
  status!: string; // queued|running|succeeded|failed|canceled

  @Column({ type: 'text', nullable: true })
  payload!: string | null; // JSON text

  @Column({ type: 'text', nullable: true })
  result!: string | null; // JSON text

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ type: 'text' })
  createdAt!: string; // ISO

  @Column({ type: 'text' })
  updatedAt!: string; // ISO

  @Column({ type: 'text', nullable: true })
  runAt!: string | null; // ISO

  @Column({ type: 'text', nullable: true })
  startedAt!: string | null; // ISO

  @Column({ type: 'text', nullable: true })
  finishedAt!: string | null; // ISO

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({ type: 'integer', default: 1 })
  maxAttempts!: number;

  @Column({ type: 'integer', default: 100 })
  priority!: number;

  @Column({ type: 'integer', default: 0 })
  picked!: number; // 0/1
}
