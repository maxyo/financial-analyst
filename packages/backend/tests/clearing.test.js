require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const mod = require('../src/lib/calculations');

const { computeMoexClearingInstants, fundingRateEstAt } = mod.computeMoexClearingInstants ? mod : (mod.default || {});

test('computeMoexClearingInstants returns 11:00Z and 16:00Z for given day', () => {
  const d = new Date(Date.UTC(2025, 8, 29, 10, 15, 0)); // 2025-09-29
  const [t1, t2] = computeMoexClearingInstants(d);
  assert.equal(t1, '2025-09-29T11:00:00.000Z');
  assert.equal(t2, '2025-09-29T16:00:00.000Z');
});

test('fundingRateEstAt returns 0 when last close equals VWAP up to cutoff', () => {
  const points = [
    { t: '2025-09-29T10:58:00.000Z', c: 100, v: 10 },
    { t: '2025-09-29T10:59:00.000Z', c: 102, v: 10 },
    { t: '2025-09-29T11:00:00.000Z', c: 101, v: 10 },
    { t: '2025-09-29T11:01:00.000Z', c: 150, v: 10 }, // after cutoff, ignored
  ];
  const est = fundingRateEstAt(points, '2025-09-29T11:00:00.000Z');
  assert.equal(est, 0);
});

test('fundingRateEstAt clamps to ±0.003', () => {
  // vwap up to 11:00Z is 100; last close at 11:00 is 110 => premium 0.1 => clamp to 0.003
  const points = [
    { t: '2025-09-29T10:58:00.000Z', c: 100, v: 10 },
    { t: '2025-09-29T10:59:00.000Z', c: 100, v: 10 },
    { t: '2025-09-29T11:00:00.000Z', c: 110, v: 10 },
  ];
  const est = fundingRateEstAt(points, '2025-09-29T11:00:00.000Z');
  assert.equal(est, 0.003);
});
