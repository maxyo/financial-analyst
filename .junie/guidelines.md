Project development guidelines (trade)

Audience: Advanced developers maintaining/extending this codebase. This repository is a TypeScript Node server (ts-node at runtime) plus a static browser client under frontend/. It integrates with the Tinkoff Invest API for market data and portfolio info, and exposes a small jobs subsystem.

1) Build and runtime configuration
- Runtime model
  - The server runs directly via ts-node. There is no bundler for the server. The client under frontend/ is served statically by Express.
  - Scripts (package.json):
    - npm run dev → ts-node src/server.ts (type-checks at runtime; slower; strict types may fail)
    - npm start → ts-node --transpile-only src/server.ts (recommended for local dev; fastest)
    - npm run build → tsc --noEmit (type-check only; does not emit JS)
    - npm run cli → ts-node src/main.ts (CLI demo; requires API token)
    - npm run lint / npm run lint:fix → ESLint with @typescript-eslint; Prettier integration
- TypeScript
  - Strict mode is enabled: strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch.
  - Module: CommonJS, Target/Lib: ES2020. outDir: dist (unused by default because build runs with --noEmit).
  - If you want JS output, run tsc without --noEmit.
- Environment variables (.env)
  - The server loads dotenv at startup (src/server.ts → configDotenv()).
  - TINKOFF_TOKEN (required for Tinkoff Invest API calls; see src/api/tinkoff/index.ts). Missing token will throw early.
  - PORT optional server port (default 3000).
  - QUOTE_POLL_MS websocket quote update interval in ms (default 2000).
  - CANDLES_POLL_MS candles poll interval for WS updates (default 5000).
  - TRADES_POLL_MS trades poll interval for WS updates (default 10000).
  - TINKOFF_ACCOUNT_ID optional default account used in positions lookup (src/api/tinkoff/positions.ts).
  - FUNDING_K2 optional fraction used by server to infer base price when computing clearing annotations.
  - JOBS_POLL_MS optional polling interval for the in-process job runner (default 1000).
  - .env is git-ignored; don’t commit tokens.
- Known type-check caveat (tinkoff-invest-api@7.0.1)
  - npm run build may fail on enum/shape differences (e.g., InstrumentIdType.* and method signatures) referenced by src/api and src/api/tinkoff/*.
  - Options:
    - Update code to only use supported ID types (UID/FIGI) and align method calls, or
    - Pin tinkoff-invest-api to a version matching current code expectations, or
    - Use npm start (transpile-only) for local dev and skip npm run build in CI until types are aligned.
- Minimal setup checklist
  - Node 20+.
  - npm ci (or npm i).
  - .env with TINKOFF_TOKEN=<your token> to enable API-dependent features.
  - npm start, then open http://localhost:3000.

2) Testing: configuration, running, adding tests
- Approach
  - Uses Node’s built-in test runner (Node ≥ 18), no extra deps.
  - JS tests import TS modules by requiring ts-node/register/transpile-only at the top of each .test.js file.
  - Prefer pure-function units for determinism (e.g., computeFunding, computeL1L2, vwapInWindow from src/lib/calculations.ts via src/api.ts).
- How to run tests
  - Run a specific file: node --test tests/smoke.test.js
  - Run all tests: node --test
    - Note: On low-memory environments you may prefer per-file execution to avoid the runner being killed by the OS.
- Adding tests
  - Create tests under tests/*.test.js (or subfolders recognized by Node’s runner).
  - At the top of the test file add: require('ts-node/register/transpile-only');
  - Import via the facade to avoid coupling to internal paths: const { computeFunding, computeL1L2 } = require('../src/api');
  - Example (validated locally):
    require('ts-node/register/transpile-only');
    const { test } = require('node:test');
    const assert = require('node:assert/strict');
    const { computeL1L2, computeFunding } = require('../src/api');
    test('guidelines demo: computeFunding basic clamp and symmetry', () => {
      const prevBase = 100;
      const { L1, L2 } = computeL1L2(prevBase, 0.01, 0.02); // L1=1, L2=2
      assert.equal(computeFunding(0.5, L1, L2), 0);
      assert.equal(computeFunding(-0.5, L1, L2), 0);
      assert.equal(computeFunding(100, L1, L2), 2);
      assert.equal(computeFunding(-100, L1, L2), -2);
    });
  - Integration tests that touch the Tinkoff API:
    - Gate with an env flag like INTEGRATION_TEST=1 and skip by default to avoid rate limits.
    - Keep time windows small and data sets minimal; API quotas apply.
- Verified locally
  - The provided smoke test passes: node --test tests/smoke.test.js → 2 tests, 0 failures.
  - The demo test above was created and run successfully, then removed to keep the repo clean as per this guideline task.
- Notes
  - Strict TS types can fail under npm run dev; prefer npm start during test runs if encountering SDK type mismatches.

3) Additional development information
- Code style
  - Prettier config: { singleQuote: true, printWidth: 80, tabWidth: 2 }.
  - Format: npx prettier --write .
  - ESLint scripts: npm run lint and npm run lint:fix.
- Server behavior and internals
  - Static client: served from /frontend (index.html plus assets). Ensure frontend points to the API host/port you run.
  - REST endpoints (src/server.ts):
    - GET /api/health → { ok: true, ts }
    - GET /api/search?query=... → { instruments: [...] }
    - GET /api/summary?ticker=...[&windowStart=&windowEnd=] → Summary + funding metrics
    - GET /api/underlying-summary?ticker=... → Underlying (if resolvable), 404 otherwise
    - GET /api/candles?ticker=...[&interval=] → { points, clearings }
    - GET /api/positions?ticker=...[&accountId=] → { positions }
    - GET /api/trades?ticker=...[&accountId=&hours=&mode=public] → { trades [, fallback] }
    - Jobs subsystem:
      - POST /api/jobs { type, payload, runAt?, maxAttempts?, priority? } → { job }
      - GET /api/jobs[?limit=&offset=&type=] → { jobs }
      - GET /api/jobs/:id → { job } | 404
      - POST /api/jobs/:id/cancel → { job } | 400 if running
  - WebSocket (path /ws):
    - Client → Server messages: {type: 'subscribe'|'unsubscribe'|'ping', ticker?}
    - Server → Client messages:
      - { type: 'quote', ticker, summary, underlying?, ts }
      - { type: 'candles', ticker, mode: 'snapshot'|'update', points, clearings?, ts }
      - { type: 'trades', ticker, trades, ts }
      - { type: 'error', ticker, message }
    - Internals:
      - Per-ticker polling intervals: QUOTE_POLL_MS; candles/trades throttled by CANDLES_POLL_MS/TRADES_POLL_MS.
      - Cleans up pollers when last subscriber unsubscribes or disconnects.
      - Sends an initial candles snapshot on subscribe.
- Domain specifics
  - Positions: src/api/tinkoff/positions.ts uses operations.getPortfolio or operations.getPositions, filters by instrument UID, computes effective lot size for futures when applicable.
  - Instruments/market data: instrument resolution via getProvider() (src/api/factory.ts) and Tinkoff SDK; last prices via marketdata.
  - Funding (MoEx-style): computeL1L2(prevBasePrice, k1, k2) and computeFunding(D, L1, L2) implement the clamped formula; vwapInWindow and fundingRateEstAt provide additional metrics. See tests for examples.
- Troubleshooting
  - Error: "TINKOFF_TOKEN not set in environment" → create .env or export in the shell. The server throws early in src/api/tinkoff/index.ts.
  - Type-check errors on npm run build → see the Known caveat above.
  - Frontend not loading data → ensure server URL/port and WS path /ws are reachable and not blocked by CORS.
  - WS not updating → verify the client sends {type: 'subscribe', ticker} after connection, and check QUOTE_POLL_MS/CANDLES_POLL_MS/TRADES_POLL_MS values.
  - Jobs polling too aggressive or too slow → tune JOBS_POLL_MS.
- Distribution/runtime
  - There is no production build pipeline for the server; deploy as a long-running Node process (e.g., PM2/systemd) with appropriate env configuration.
