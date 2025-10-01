import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { DocumentEntity } from './document.entity';

@Entity({ name: 'document_summaries' })
@Index(['document_id'])
@Index(['created_at'])
@Unique(['document_id', 'kind'])
export class DocumentSummaryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'document_id' })
  document_id!: number;

  @ManyToOne(() => DocumentEntity)
  @JoinColumn({ name: 'document_id', referencedColumnName: 'id' })
  document!: DocumentEntity;

  @Column({ type: 'text', default: 'default' })
  kind!: string;

  @Column({ type: 'text', name: 'job_id', nullable: true })
  job_id!: string | null;

  @Column({ type: 'text', name: 'llm_model', nullable: true })
  llm_model!: string | null;

  @Column({ type: 'integer', name: 'schema_version', default: 1 })
  schema_version!: number;

  @Column({ type: 'text', name: 'content_json' })
  content_json!: string;

  @Column({ type: 'text', name: 'summary_text', nullable: true })
  summary_text!: string | null;

  @Column({ type: 'real', nullable: true })
  relevance!: number | null;

  @Column({ type: 'integer', name: 'tokens_in', nullable: true })
  tokens_in!: number | null;

  @Column({ type: 'integer', name: 'tokens_out', nullable: true })
  tokens_out!: number | null;

  @Column({ type: 'real', nullable: true })
  cost!: number | null;

  @Column({ type: 'text', name: 'created_at' })
  created_at!: string;

  @Column({ type: 'text', name: 'updated_at' })
  updated_at!: string;
}
