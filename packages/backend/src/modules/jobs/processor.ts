import { pickNextJob, updateJobStatus } from './store';

import type { Job } from './types';

export type JobHandler<T=any, R=any> = (job: Job<T>) => Promise<R> | R;

export interface ProcessorOptions {
  intervalMs?: number; // poll interval
}

export class JobsProcessor {
  private timer: NodeJS.Timeout | null = null;
  private readonly handlers = new Map<string, JobHandler>();
  private readonly interval: number;

  constructor(opts?: ProcessorOptions) {
    this.interval = Math.max(100, opts?.intervalMs ?? 1000);
  }

  register<T=any, R=any>(type: string, handler: JobHandler<T, R>) {
    this.handlers.set(type, handler as JobHandler);
    return this;
  }

  start() {
    if (this.timer) return;
    const tick = async () => {
      try {
        let handled = false;
        const job = pickNextJob();
        if (job) {
          handled = true;
          await this.execute(job);
        }
        // If handled a job, try immediate next to drain quickly; else wait interval
        this.timer = setTimeout(tick, handled ? 0 : this.interval);
      } catch {
        this.timer = setTimeout(tick, this.interval);
      }
    };
    this.timer = setTimeout(tick, 0);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private async execute(job: Job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      updateJobStatus(job.id, 'failed', {
        error: `No handler for job type ${job.type}`,
        finishedAt: new Date().toISOString(),
      });
      return;
    }
    try {
      const result = await handler(job);
      updateJobStatus(job.id, 'succeeded', {
        result: result,
        finishedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      const attempts = (job.attempts ?? 0);
      const willRetry = attempts < (job.maxAttempts ?? 1);
      updateJobStatus(job.id, willRetry ? 'queued' : 'failed', {
        error: e instanceof Error ? e.message : String(e),
        finishedAt: willRetry ? undefined : new Date().toISOString(),
      });
    }
  }
}
