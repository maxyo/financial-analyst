require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const { computeFunding, computeL1L2 } = require('../src/api');

test('computeFunding clamps by L2 on large |D|', () => {
  const prevBase = 100;
  const { L1, L2 } = computeL1L2(prevBase, 0.01, 0.02); // L1=1, L2=2
  assert.equal(computeFunding(100, L1, L2), 2);
  assert.equal(computeFunding(-100, L1, L2), -2);
});

test('computeFunding symmetrical behavior around zero', () => {
  const prevBase = 200;
  const { L1, L2 } = computeL1L2(prevBase, 0.005, 0.015); // L1=1, L2=3
  assert.equal(computeFunding(0.5, L1, L2), 0);
  assert.equal(computeFunding(-0.5, L1, L2), 0);
});
