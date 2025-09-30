require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const { getNextFundingWindow } = require('../src/api/tinkoff/summary');

function parseIsoToUtcHour(iso) {
  const d = new Date(iso);
  return d.getUTCHours();
}

test('next funding window is daily at 16:00 UTC (19:00 MSK)', () => {
  const { nextFundingTime } = getNextFundingWindow();
  const hour = parseIsoToUtcHour(nextFundingTime);
  assert.equal(hour, 16, `Expected next funding at 16:00 UTC, got hour=${hour} for ${nextFundingTime}`);
});
