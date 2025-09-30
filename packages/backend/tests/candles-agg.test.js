require('ts-node/register/transpile-only');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { aggregateCandles, normalizeInterval } = require('../src/lib/candles/aggregate');

function make1m(startIso, n, base = 100, step = 1) {
  const start = new Date(startIso).getTime();
  const res = [];
  for (let i = 0; i < n; i++) {
    const t = new Date(start + i * 60_000).toISOString();
    const o = base + i * step;
    const h = o + 0.5;
    const l = o - 0.5;
    const c = o + 0.25;
    const v = 10 + i;
    res.push({ t, o, h, l, c, v });
  }
  return res;
}

test('normalizeInterval variants', () => {
  assert.equal(normalizeInterval('1m'), '1m');
  assert.equal(normalizeInterval('5'), '5m');
  assert.equal(normalizeInterval('15M'), '15m');
  assert.equal(normalizeInterval('1H'), '1h');
  assert.equal(normalizeInterval(), '1m');
});

test('aggregate 1m -> 5m respects O/H/L/C/V', () => {
  const src = make1m('2024-01-01T10:00:00.000Z', 5, 100, 1);
  const out = aggregateCandles(src, '5m');
  assert.equal(out.length, 1);
  const c0 = out[0];
  assert.equal(c0.o, src[0].o);
  assert.equal(c0.c, src[src.length - 1].c);
  assert.equal(c0.h, Math.max(...src.map((x) => x.h)));
  assert.equal(c0.l, Math.min(...src.map((x) => x.l)));
  assert.equal(c0.v, src.reduce((s, x) => s + x.v, 0));
});

test('aggregate 1m -> 15m over 17 minutes creates 4 buckets with partial last', () => {
  const src = make1m('2024-01-01T10:00:00.000Z', 17, 50, 0.1);
  const out = aggregateCandles(src, '5m');
  // 17 minutes -> buckets at 10:00, 10:05, 10:10, 10:15
  assert.equal(out.length, 4);
  assert.ok(out[0].t.endsWith('10:00:00.000Z'));
  assert.ok(out[1].t.endsWith('10:05:00.000Z'));
  assert.ok(out[2].t.endsWith('10:10:00.000Z'));
  assert.ok(out[3].t.endsWith('10:15:00.000Z'));
});

test('aggregate 1m -> 1h over 65 minutes creates 2 buckets', () => {
  const src = make1m('2024-01-01T00:00:00.000Z', 65, 10, 0);
  const out = aggregateCandles(src, '1h');
  assert.equal(out.length, 2);
  assert.ok(out[0].t.endsWith('00:00:00.000Z'));
  assert.ok(out[1].t.endsWith('01:00:00.000Z'));
});
