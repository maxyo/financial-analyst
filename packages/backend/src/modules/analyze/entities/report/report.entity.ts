import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ProfileEntity } from '../profile.entity';
import { reportStructures } from './report-structure';

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

  @Column({ type: 'varchar', enum: reportStructures, name: 'type', nullable: true })
  type!: keyof typeof reportStructures | null;

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
