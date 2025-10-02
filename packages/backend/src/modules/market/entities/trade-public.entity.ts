import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'trades_public' })
@Index(['ticker', 'ts'])
export class TradePublicEntity {
  @PrimaryColumn({ type: 'text' })
  ticker!: string;

  @PrimaryColumn({ type: 'integer' })
  ts!: number;

  @PrimaryColumn({ name: 'price', type: 'real' })
  price!: number;

  @Column({ name: 'qty', type: 'real', nullable: true })
  qty!: number | null;

  @Column({ name: 'side', type: 'text', nullable: true })
  side!: string | null;
}
