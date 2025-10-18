import { Filter } from '@trade/filter';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'collections' })
@Index(['name'], { unique: true })
export class CollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // JSON string that stores filter criteria
  @Column({ type: 'simple-json', default: '{}' })
  filters!: Filter;

  @Column({ type: 'datetime', name: 'created_at' })
  created_at!: Date;

  @Column({ type: 'datetime', name: 'updated_at' })
  updated_at!: Date;
}
