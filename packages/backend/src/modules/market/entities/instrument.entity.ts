import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'instruments' })
export class InstrumentEntity {
  @PrimaryColumn({ type: 'text' })
  ticker!: string;

  @Column({ type: 'text', nullable: true })
  name!: string | null;

  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  figi!: string | null;

  @Index({ unique: true })
  @Column({ type: 'text', nullable: true })
  uid!: string | null;

  @Column({ type: 'integer', nullable: true })
  lot!: number | null;

  @Column({ type: 'text', nullable: true })
  classCode!: string | null;

  @Column({ name: 'updated_at', type: 'text' })
  updatedAt!: string; // ISO
}
