import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity({ name: 'analysis_profiles' })
@Index(['instrument_ticker'])
export class AnalysisProfileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', name: 'instrument_ticker', nullable: true })
  instrument_ticker!: string | null;

  @Column({ type: 'text', name: 'created_at' })
  created_at!: string;

  @Column({ type: 'text', name: 'updated_at' })
  updated_at!: string;
}
