-- Initial schema migration
-- candles
CREATE TABLE IF NOT EXISTS candles (
  symbol TEXT NOT NULL,
  interval VARCHAR(50) NOT NULL,
  ts DATETIME NOT NULL,
  o REAL,
  h REAL,
  l REAL,
  c REAL,
  v REAL NOT NULL DEFAULT 0,
  PRIMARY KEY(symbol, interval, ts)
);
CREATE INDEX IF NOT EXISTS idx_candles_symbol_interval_ts ON candles(symbol, interval, ts);

-- scraper: data_sources
CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  config TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  update_strategy TEXT NOT NULL DEFAULT '{"type":"time_interval","options":{"value":1,"unit":"hour"}}',
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_data_sources_active_type ON data_sources(is_active, source_type);

-- scraper: documents
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  scraped_at DATETIME NOT NULL,
  content_hash TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_source_hash ON documents(source_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_documents_source_time ON documents(source_id, scraped_at);

-- jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT,
  result TEXT,
  error TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  runAt DATETIME,
  startedAt DATETIME,
  finishedAt DATETIME,
  attempts INTEGER NOT NULL DEFAULT 0,
  maxAttempts INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100,
  picked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_runat_prio ON jobs(status, runAt, priority);

-- AI analytics schema migration

-- analysis_profiles
CREATE TABLE IF NOT EXISTS analysis_profiles (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 name TEXT NOT NULL,
                                                 description TEXT,
                                                 instrument_ticker TEXT,
                                                 created_at DATETIME NOT NULL DEFAULT (datetime('now')),
                                                 updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analysis_profiles_ticker ON analysis_profiles(instrument_ticker);

-- analysis_profile_sources
CREATE TABLE IF NOT EXISTS analysis_profile_sources (
                                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                        profile_id INTEGER NOT NULL,
                                                        source_id INTEGER NOT NULL,
                                                        filters_json TEXT,
                                                        FOREIGN KEY(profile_id) REFERENCES analysis_profiles(id) ON DELETE CASCADE,
                                                        FOREIGN KEY(source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_profile_sources_profile ON analysis_profile_sources(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_sources_source ON analysis_profile_sources(source_id);

-- document_summaries (per-document AI output)
CREATE TABLE IF NOT EXISTS document_summaries (
                                                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                  document_id INTEGER NOT NULL,
                                                  kind TEXT NOT NULL DEFAULT 'default',
                                                  job_id TEXT,
                                                  llm_model TEXT,
                                                  schema_version INTEGER NOT NULL DEFAULT 1,
                                                  content_json TEXT NOT NULL,
                                                  summary_text TEXT,
                                                  relevance REAL,
                                                  tokens_in INTEGER,
                                                  tokens_out INTEGER,
                                                  cost REAL,
                                                  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
                                                  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                                                  UNIQUE(document_id, kind),
                                                  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_document_summaries_doc ON document_summaries(document_id);
CREATE INDEX IF NOT EXISTS idx_document_summaries_created ON document_summaries(created_at);

-- reports (aggregated AI analysis)
CREATE TABLE IF NOT EXISTS reports (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       run_id TEXT, -- optional external run id
                                       profile_id INTEGER NOT NULL,
                                       job_id TEXT, -- back-reference to jobs.id
                                       instrument_key TEXT,
                                       llm_model TEXT,
                                       schema_version INTEGER NOT NULL DEFAULT 1,
                                       content_md TEXT,
                                       content_json TEXT NOT NULL,
                                       confidence REAL,
                                       created_at DATETIME NOT NULL DEFAULT (datetime('now')),
                                       FOREIGN KEY(profile_id) REFERENCES analysis_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reports_profile_created ON reports(profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_instr_created ON reports(instrument_key, created_at);

-- trades: public and user
CREATE TABLE IF NOT EXISTS trades_public (
  ticker TEXT NOT NULL,
  ts INTEGER NOT NULL,
  price REAL NOT NULL,
  qty REAL,
  side TEXT,
  PRIMARY KEY(ticker, ts, price)
);
CREATE INDEX IF NOT EXISTS idx_trades_public_ticker_ts ON trades_public(ticker, ts);

CREATE TABLE IF NOT EXISTS trades_user (
  ticker TEXT NOT NULL,
  accountId TEXT NOT NULL DEFAULT '',
  ts INTEGER NOT NULL,
  price REAL NOT NULL,
  qty REAL,
  side TEXT,
  PRIMARY KEY(ticker, accountId, ts, price)
);
CREATE INDEX IF NOT EXISTS idx_trades_user_ticker_account_ts ON trades_user(ticker, accountId, ts);


-- instruments
CREATE TABLE IF NOT EXISTS instruments (
  ticker TEXT PRIMARY KEY,
  name TEXT,
  figi TEXT,
  uid TEXT,
  lot INTEGER,
  classCode TEXT,
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
-- Helpful indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_instruments_figi ON instruments(figi);
CREATE UNIQUE INDEX IF NOT EXISTS uq_instruments_uid ON instruments(uid);
CREATE INDEX IF NOT EXISTS idx_instruments_name ON instruments(name);
