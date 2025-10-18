import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum DocumentType {
  MD = 'MD',
  XML = 'XML',
  JSON = 'JSON',
}

@Entity({ name: 'documents' })
@Index(['scraperId', 'scrapedAt'])
@Index(['scraperId', 'contentHash'], { unique: true })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', enum: DocumentType, default: DocumentType.MD })
  type!: DocumentType;

  @Column({ type: 'datetime', default: Date.now })
  date!: Date;

  @Column({ type: 'simple-json', default: '{}' })
  meta!: Record<string, string>;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text' })
  scraperId!: string;

  @Column({ name: 'scraped_at', type: 'datetime' })
  scrapedAt!: Date;

  @Column({ name: 'content_hash', type: 'text' })
  contentHash!: string;
}
