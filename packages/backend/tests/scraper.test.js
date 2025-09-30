require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');

process.env.CANDLES_DB_PATH = ':memory:'; // use in-memory sqlite for tests

const {
  DataSourceRepo,
  DocumentRepo,
  runScrapeForSourceAsync,
} = require('../src/modules/scraper');

let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchJsonOnce(payload, status = 200, headers = { 'content-type': 'application/json' }) {
  global.fetch = async () => new Response(JSON.stringify(payload), { status, headers });
}

function mockFetchTextOnce(body, status = 200, headers = { 'content-type': 'text/html' }) {
  global.fetch = async () => new Response(body, { status, headers });
}

test('registry default: API scraper works and dedup by content_hash', async () => {
  const sources = new DataSourceRepo();
  const docs = new DocumentRepo();

  const src = sources.insert({
    name: 'Example API',
    source_type: 'api',
    config: {
      url: 'https://example.com/api',
      itemsPath: 'data',
    },
  });

  // First run returns two identical items -> one insert, one skip
  mockFetchJsonOnce({ data: [{ id: 1, name: 'A' }, { id: 1, name: 'A' }] });
  const r1 = await runScrapeForSourceAsync(src.id);
  assert.equal(r1.items, 2);
  assert.equal(r1.inserted, 1);
  assert.equal(r1.skipped, 1);

  // Second run returns same item -> dedup skip
  mockFetchJsonOnce({ data: [{ id: 1, name: 'A' }] });
  const r2 = await runScrapeForSourceAsync(src.id);
  assert.equal(r2.items, 1);
  assert.equal(r2.inserted, 0);
  assert.equal(r2.skipped, 1);

  const saved = docs.listBySource(src.id, 10);
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].content, { id: 1, name: 'A' });
});

test('HTML scraper fallback returns raw HTML when no selectors', async () => {
  const sources = new DataSourceRepo();
  const docs = new DocumentRepo();

  const src = sources.insert({
    name: 'Example HTML',
    source_type: 'html',
    config: { url: 'https://example.com/page' },
  });

  mockFetchTextOnce('<html><body><h1>Hello</h1></body></html>');
  const r = await runScrapeForSourceAsync(src.id);
  assert.equal(r.items, 1);
  assert.equal(r.inserted, 1);
  assert.equal(r.skipped, 0);

  const saved = docs.listBySource(src.id, 10);
  assert.equal(saved.length, 1);
  assert.ok(typeof saved[0].content === 'object');
  assert.equal(saved[0].content.html.includes('<h1>Hello</h1>'), true);
});
