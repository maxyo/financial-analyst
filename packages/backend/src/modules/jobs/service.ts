import { insertJob, getJob, listJobs, updateJobStatus, initJobsStore } from './store';
import type { EnqueueOptions, Job } from './types';

initJobsStore();

export function enqueueJob<T=any>(type: string, payload?: T, opts?: EnqueueOptions): Job<T> {
  return insertJob<T>(type, payload, opts);
}

export function getJobStatus<T=any>(id: string): Job<T> | null {
  return getJob<T>(id);
}

export function getJobs(limit?: number, offset?: number, type?: string) {
  return listJobs(limit, offset, type);
}

export function cancelJob(id: string): Job | null {
  const job = getJob(id);
  if (!job) return null;
  if (job.status === 'succeeded' || job.status === 'failed') return job; // no-op
  return updateJobStatus(id, 'canceled', { finishedAt: new Date().toISOString() });
}
