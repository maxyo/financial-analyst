import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DocumentSourceEntity } from './source.entity';

@Entity({ name: 'profile' })
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', name: 'created_at' })
  created_at!: string;

  @Column({ type: 'text', name: 'updated_at' })
  updated_at!: string;

  // A profile has many document sources
  @OneToMany(() => DocumentSourceEntity, (source) => source.profile)
  documentSources!: DocumentSourceEntity[];
}
