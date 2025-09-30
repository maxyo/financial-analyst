import { randomUUID } from 'crypto';

import { getCandlesDb } from '../../lib/db/sqlite';

import type { Job, JobStatus } from './types';

function ensureSchema() {
  const db = getCandlesDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT,
      result TEXT,
      error TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      runAt TEXT,
      startedAt TEXT,
      finishedAt TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      maxAttempts INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 100,
      picked INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_status_runat_prio ON jobs(status, runAt, priority);
  `);
}

export function initJobsStore() {
  ensureSchema();
}

export function insertJob<T=any>(type: string, payload?: T, opts?: { runAt?: Date, maxAttempts?: number, priority?: number }): Job<T> {
  ensureSchema();
  const db = getCandlesDb();
  const id = randomUUID();
  const nowIso = new Date().toISOString();
  const runAtIso = opts?.runAt ? opts.runAt.toISOString() : nowIso;
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 1);
  const priority = Math.trunc(opts?.priority ?? 100);
  const payloadJson = payload != null ? JSON.stringify(payload) : null;
  const stmt = db.prepare(
    'INSERT INTO jobs(id,type,status,payload,createdAt,updatedAt,runAt,attempts,maxAttempts,priority) VALUES (?,?,?,?,?,?,?,?,?,?)'
  );
  stmt.run(id, type, 'queued', payloadJson, nowIso, nowIso, runAtIso, 0, maxAttempts, priority);
  return getJob(id) as Job<T>;
}

export function getJob<T=any>(id: string): Job<T> | null {
  const db = getCandlesDb();
  const row = db.prepare('SELECT * FROM jobs WHERE id=?').get(id) as any;
  if (!row) return null;
  return rowToJob(row);
}

export function listJobs(limit = 100, offset = 0, type?: string): Job[] {
  const db = getCandlesDb();
  let sql = 'SELECT * FROM jobs';
  const params: any[] = [];
  if (type) { sql += ' WHERE type=?'; params.push(type); }
  sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(rowToJob);
}

export function updateJobStatus(id: string, status: JobStatus, fields: Partial<Omit<Job,'id'|'type'|'status'>> = {}): Job | null {
  const db = getCandlesDb();
  const nowIso = new Date().toISOString();
  const sets: string[] = ['status=?','updatedAt=?'];
    if (status === 'queued') { sets.push('picked=?'); }
  const params: any[] = [status, nowIso];
  if ('result' in fields) { sets.push('result=?'); params.push(fields.result != null ? JSON.stringify(fields.result) : null); }
  if ('error' in fields) { sets.push('error=?'); params.push(fields.error ?? null); }
  if ('startedAt' in fields) { sets.push('startedAt=?'); params.push(fields.startedAt ?? null); }
  if ('finishedAt' in fields) { sets.push('finishedAt=?'); params.push(fields.finishedAt ?? null); }
  if ('attempts' in fields && typeof fields.attempts === 'number') { sets.push('attempts=?'); params.push(fields.attempts); }
  const sql = `UPDATE jobs SET ${sets.join(', ')} WHERE id=?`;
  params.push(id);
  if (status === 'queued') params.push(0);
    db.prepare(sql).run(...params);
  return getJob(id);
}

export function pickNextJob(now = new Date()): Job | null {
  const db = getCandlesDb();
  // Use a simple transactional pick-and-mark to avoid races
  const tx = db.transaction(() => {
    const row = db.prepare(
      `SELECT * FROM jobs 
       WHERE status='queued' AND picked=0 AND (runAt IS NULL OR runAt<=?) 
       ORDER BY priority ASC, runAt ASC, createdAt ASC 
       LIMIT 1`
    ).get(now.toISOString()) as any;
    if (!row) return null;
    db.prepare('UPDATE jobs SET picked=1, status="running", startedAt=?, updatedAt=?, attempts=attempts+1 WHERE id=?').run(
      now.toISOString(), now.toISOString(), row.id
    );
    return getJob(row.id);
  });
  return tx();
}

function rowToJob(row: any): Job {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    payload: row.payload ? safeJson(row.payload) : undefined,
    result: row.result ? safeJson(row.result) : undefined,
    error: row.error ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    runAt: row.runAt ?? undefined,
    startedAt: row.startedAt ?? undefined,
    finishedAt: row.finishedAt ?? undefined,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.maxAttempts ?? 1),
    priority: Number(row.priority ?? 100),
  };
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return undefined; }
}
