import { getCandlesDb } from '../../lib/db/sqlite';

// Ensure schema for scraping module lives in the existing SQLite DB
export function ensureScraperSchema() {
  const db = getCandlesDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      config TEXT NOT NULL, -- JSON string
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      update_strategy TEXT NOT NULL DEFAULT '{"type":"time_interval","options":{"value":1,"unit":"hour"}}',
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_data_sources_active_type ON data_sources(is_active, source_type);

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      content TEXT NOT NULL, -- JSON or TEXT serialized
      scraped_at TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      FOREIGN KEY(source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_source_hash ON documents(source_id, content_hash);
    CREATE INDEX IF NOT EXISTS idx_documents_source_time ON documents(source_id, scraped_at);
  `);
}
