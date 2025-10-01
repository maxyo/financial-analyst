import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'trades_user' })
@Index(['ticker', 'accountId', 'ts'])
export class TradeUserEntity {
  @PrimaryColumn({ type: 'text' })
  ticker!: string;

  @PrimaryColumn({ type: 'text', name: 'accountId' })
  accountId!: string; // empty string allowed per schema default

  @PrimaryColumn({ type: 'integer' })
  ts!: number;

  @PrimaryColumn({ type: 'real', name: 'price' })
  price!: number;

  @Column({ type: 'real', name: 'qty', nullable: true })
  qty!: number | null;

  @Column({ type: 'text', name: 'side', nullable: true })
  side!: string | null;
}
