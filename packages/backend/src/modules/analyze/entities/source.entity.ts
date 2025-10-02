import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ProfileEntity } from './profile.entity';

export abstract class SourceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'profile_id' })
  profile_id!: number;

  @ManyToOne(() => ProfileEntity)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  profile!: ProfileEntity;
}

@Index(['profile_id'])
@Entity({ name: 'document_sources' })
export class DocumentSourceEntity extends SourceEntity {
  @Column({ type: 'uuid', name: 'document_id' })
  @Index(['document_id'])
  documentId!: string;
}
