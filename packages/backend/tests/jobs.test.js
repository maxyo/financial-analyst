require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');

const { JobsProcessor } = require('../src/modules/jobs/processor');
const { insertJob, getJob, listJobs, updateJobStatus, pickNextJob, initJobsStore } = require('../src/modules/jobs/store');

before(() => {
  process.env.CANDLES_DB_PATH = ':memory:'; // use in-memory sqlite
  initJobsStore();
});

test('enqueue and retrieve job', () => {
  const j = insertJob('noop', { a: 1 });
  assert.ok(j.id);
  const got = getJob(j.id);
  assert.equal(got.id, j.id);
  assert.equal(got.type, 'noop');
  assert.equal(got.status, 'queued');
  assert.deepEqual(got.payload, { a: 1 });
});

test('pickNextJob transitions to running', () => {
  const j = insertJob('noop', { b: 2 });
  const picked = pickNextJob();
  assert.ok(picked);
  assert.equal(picked.id, j.id);
  const got = getJob(j.id);
  assert.equal(got.status, 'running');
});

test('processor executes job and marks as succeeded', async () => {
  const proc = new JobsProcessor({ intervalMs: 10 });
  proc.register('sum', (job) => {
    const p = job.payload || {}; return (p.x || 0) + (p.y || 0);
  });
  proc.start();
  const j = insertJob('sum', { x: 2, y: 3 });
  // wait a bit for processor
  await new Promise(r => setTimeout(r, 100));
  const got = getJob(j.id);
  assert.equal(got.status, 'succeeded');
  assert.equal(got.result, 5);
  proc.stop();
});
