import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AnalysisProfileEntity } from './analysis-profile.entity';
import { DataSourceEntity } from './data-source.entity';

@Entity({ name: 'analysis_profile_sources' })
@Index(['profile_id'])
@Index(['source_id'])
export class AnalysisProfileSourceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'profile_id' })
  profile_id!: number;

  @ManyToOne(() => AnalysisProfileEntity)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile!: AnalysisProfileEntity;

  @Column({ type: 'integer', name: 'source_id' })
  source_id!: number;

  @ManyToOne(() => DataSourceEntity)
  @JoinColumn({ name: 'source_id', referencedColumnName: 'id' })
  source!: DataSourceEntity;

  @Column({ type: 'text', name: 'filters_json', nullable: true })
  filters_json!: string | null;
}
