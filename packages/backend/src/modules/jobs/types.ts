export type JobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface Job<T = any, R = any> {
  id: string;
  type: string;
  status: JobStatus;
  payload?: T;
  result?: R;
  error?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  runAt?: string; // ISO planned start, optional
  startedAt?: string; // ISO
  finishedAt?: string; // ISO
  attempts: number;
  maxAttempts: number;
  priority: number; // lower first
}

export interface EnqueueOptions {
  runAt?: Date;
  maxAttempts?: number;
  priority?: number;
}
