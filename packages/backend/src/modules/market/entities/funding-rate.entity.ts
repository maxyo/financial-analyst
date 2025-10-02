import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'funding_rates' })
@Index(['ticker', 'ts'])
@Index(['figi', 'ts'])
export class FundingRateEntity {
  @PrimaryColumn({ type: 'text' })
  ticker!: string;

  @Column({ type: 'text', nullable: true })
  figi!: string | null;

  @PrimaryColumn({ type: 'text', default: 'moex' })
  source!: string;

  @PrimaryColumn({ type: 'integer' })
  ts!: number;

  @Column({ type: 'real' })
  value!: number; // funding per unit
}
