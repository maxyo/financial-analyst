import { JobsProcessor } from '../../modules/jobs/processor';

export default function registerNoop(jobsProcessor: JobsProcessor) {
  jobsProcessor.register('noop', (job) => ({ ok: true, echo: job.payload }));
}
