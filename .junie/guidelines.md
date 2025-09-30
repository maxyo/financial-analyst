# Project Development Guidelines (trade)

Audience: advanced developers maintaining or extending this codebase.

This repository is a TypeScript Node server (ts-node at runtime) plus a static browser client (public/). It integrates with the Tinkoff Invest API for market data and portfolio info.

---

## 1) Build and runtime configuration

- Runtime model
  - Server runs directly via ts-node. There is no bundler for the server. The client under `public/` is served statically and loads AnyChart from CDNs.
  - package.json scripts:
    - `npm run dev` → `ts-node src/server.ts` (type-checking at runtime; slower; may fail on strict issues)
    - `npm start` → `ts-node --transpile-only src/server.ts` (recommended for local dev; fastest)
    - `npm run build` → `tsc --noEmit` (type-check only; emits no JS)
    - `npm run cli` → `ts-node src/main.ts` (CLI demo; requires API token)

- TypeScript
  - Strict mode is on (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
  - Module: CommonJS, Target/Lib: ES2020. `outDir: dist` (unused by build since we run with `--noEmit`). If you want JS output, run `tsc` without `--noEmit`.

- Environment variables (.env)
  - `TINKOFF_TOKEN` (required for any Tinkoff Invest API calls; see `src/api.ts` and `src/api/*`). Missing token will throw early.
  - `PORT` optional server port (default 3000).
  - `QUOTE_POLL_MS` optional WS quote update interval in ms (default 2000).
  - `CANDLES_POLL_MS` optional candles poll interval in ms (default 5000).
  - `TINKOFF_ACCOUNT_ID` optional, used by positions lookup (`src/api/positions.ts`). If not set, the first account returned by the API is used.
  - `.env` is git-ignored. The server loads dotenv early.

- Known type-check caveat (with tinkoff-invest-api@7.0.1)
  - `npm run build` may fail due to enum/shape differences (e.g., `InstrumentIdType.*` and method signatures) referenced in `src/api.ts` and related modules.
  - Options:
    1. Update code to use only supported ID types (UID/FIGI) and adjust SDK method calls accordingly; or
    2. Pin `tinkoff-invest-api` to a version that matches expectations in the code; or
    3. Use `npm start` (transpile-only) for local dev and skip `npm run build` in CI until types are aligned.

- Static client
  - Served by Express from `/public` (see `src/server.ts`).
  - The client assumes API at `http://localhost:3000` by default (see `public/app.js` → `const apiUrl`).
  - WS endpoint: `ws://<host>/ws`. Messages:
    - `{type: "subscribe", ticker: "CNYRUBF"}`
    - `{type: "unsubscribe", ticker: "CNYRUBF"}`
    - `{type: "ping"}` → server replies `{type: "pong"}`
  - REST endpoints:
    - `GET /api/health` → `{ ok: true, ts }`
    - `GET /api/search?query=...` → `{ instruments: [...] }`
    - `GET /api/summary?ticker=... [&k1=&k2=&prevBasePrice=&d=&cbr=&underlyingPrice=&windowStart=&windowEnd=&mode=generic|currency|manual]` → Summary + funding metrics
    - `GET /api/candles?ticker=...` → `{ points: CandlePoint[] }`

- Minimal setup checklist
  - Node 20+.
  - `npm ci` (or `npm i`).
  - `.env` with `TINKOFF_TOKEN=<your token>` for API-dependent features.
  - `npm start`, then open `http://localhost:3000`.

---

## 2) Testing: configuration, running, adding tests

- Approach
  - Uses Node’s built-in test runner (Node ≥ 18), no extra deps.
  - JS tests can import TS modules by requiring `ts-node/register/transpile-only` at the top of the test file.

- How to run tests
  - Example (already in repo): `tests/smoke.test.js`

    ```js
    require('ts-node/register/transpile-only');
    const { test } = require('node:test');
    const assert = require('node:assert/strict');
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
    ```

  - Run a specific file: `node --test tests/smoke.test.js`
  - Run all tests: `node --test` (ensure tests live under `tests/*.test.js` or the patterns recognized by Node test runner).

- Verified locally
  - With Node 20.19.3, `node --test tests/smoke.test.js` passes (2 tests, 0 failures). These unit tests do not call external APIs and do not require `TINKOFF_TOKEN`.

- Adding tests
  - Prefer pure-function units for determinism (e.g., `computeFunding`, `computeL1L2`, `vwapInWindow` from `src/lib/calculations.ts`).
  - For integration tests that touch the Tinkoff API:
    - Gate with an env flag like `INTEGRATION_TEST=1` and skip by default to avoid rate limits.
    - Keep time windows small and data sets minimal; API quotas apply.
  - If you write TypeScript tests, you can still run them via ts-node, but `.js` tests that require `ts-node/register/transpile-only` are simpler and avoid tsconfig interference.

- Notes
  - Strict TS types can fail under `npm run dev`; prefer `npm start` during test runs if you encounter type mismatches from the SDK.

---

## 3) Additional development information

- Code style
  - Prettier config: `{ singleQuote: true, printWidth: 80, tabWidth: 2 }`.
  - Format: `npx prettier --write .`
  - ESLint scripts: `npm run lint` and `npm run lint:fix`.

- Server behavior and internals
  - WebSocket:
    - Per-ticker polling using configurable intervals; manages `tickerSubs`/`clientSubs`, cleans up on ws close/error.
    - Heartbeat pings every 30s; clients should respond with `pong`.
    - Candles are rate-limited by `CANDLES_POLL_MS` and delivered as snapshot or incremental updates.
  - Candles:
    - `GET /api/candles` returns today’s 1m candles. The client (`public/app.js`) supports client-side aggregation to 5m/15m/1h.
  - Funding (MoEx-style):
    - `computeL1L2(prevBasePrice, k1, k2)` and `computeFunding(D, L1, L2)` in `src/lib/calculations.ts` implement the clamped funding formula. The included tests validate clamping and symmetry.

- CLI (`src/main.ts`)
  - Demonstrates querying instrument, fetching last price, order book, and intraday candles. Requires `TINKOFF_TOKEN`.

- Troubleshooting
  - Error: "TINKOFF_TOKEN not set in environment" → create `.env` or export in the shell.
  - Type-check errors on `npm run build` → see the Known caveat above; prefer `npm start` locally.
  - CORS/frontend not loading data → ensure server URL in `public/app.js` matches server host/port.
  - WS not updating → verify the client sends `{type: 'subscribe', ticker}` after connection.

- Notes on distribution
  - There is no production build pipeline for the server; deploy as a long-running Node process. Consider PM2/systemd and environment configuration.

- Domain specifics (positions and instruments)
  - `src/api/positions.ts` attempts `operations.getPortfolio` and falls back to `operations.getPositions`; it filters positions by the requested instrument UID and computes effective lot size for futures as `underlyingLot * futuresLot`.
  - Instrument details are fetched via `getInstrumentBy` using FIGI or UID depending on identifier shape; last prices via `marketdata.getLastPrices`.
  - Underlying instrument resolution flows through `instrumentService` (`src/lib/instrument.ts`).
