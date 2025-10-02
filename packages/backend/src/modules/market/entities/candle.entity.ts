import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'candles' })
@Index(['symbol', 'interval', 'ts'])
export class CandleEntity {
  @PrimaryColumn({ type: 'text' })
  symbol!: string;

  @PrimaryColumn({ type: 'text' })
  interval!: string; // normalized e.g. 1m,5m,15m,1h

  @PrimaryColumn({ type: 'integer' })
  ts!: number; // epoch ms

  @Column({ type: 'real', nullable: true }) o!: number | null;
  @Column({ type: 'real', nullable: true }) h!: number | null;
  @Column({ type: 'real', nullable: true }) l!: number | null;
  @Column({ type: 'real', nullable: true }) c!: number | null;
  @Column({ type: 'real', default: 0 }) v!: number;
}
