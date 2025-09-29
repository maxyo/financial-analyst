Project-specific development guidelines (trade)

Audience: advanced developers maintaining or extending this codebase.

1) Build and runtime configuration
- Runtime model
  - This is a TypeScript codebase that runs directly via ts-node. There is no bundler for the server; the static client under public/ is plain JS and loads AnyChart from CDNs.
  - package.json scripts:
    - dev: ts-node src/server.ts (type-checking on-the-fly; slower, may fail on strict type issues)
    - start: ts-node --transpile-only src/server.ts (fastest, skips type-checking at runtime)
    - build: tsc --noEmit (type-check only; emits no JS)
    - cli: ts-node src/main.ts (CLI example querying Tinkoff Invest API)

- TypeScript
  - Strict mode with noUnusedLocals/noUnusedParameters/noFallthroughCasesInSwitch.
  - Module: CommonJS, Target: ES2020, lib: ES2020.
  - outDir: dist (unused by build because build runs with --noEmit). If you want actual JS output, run tsc without --noEmit.

- Environment variables (.env)
  - TINKOFF_TOKEN: required for all calls that touch Tinkoff Invest API (src/api.ts). Missing token will throw.
  - PORT: optional server port (defaults 3000).
  - QUOTE_POLL_MS: optional WS quote update interval in ms (defaults 2000).
  - CANDLES_POLL_MS: optional candles poll interval in ms (defaults 5000).
  - .env is git-ignored; do not commit secrets. The server loads dotenv early in src/api.ts and src/server.ts.

- Known type-check caveat (important)
  - npm run build currently fails with tinkoff-invest-api v7.0.1 due to enum/shape differences referenced in src/api.ts (e.g., InstrumentIdType.*). Runtime is unaffected when using ts-node --transpile-only (npm start), which is the intended path for local dev.
  - Options to restore green type-checks (choose any):
    - Update src/api.ts to use InstrumentIdType UID/FIGI only (the library removed some variants), and adapt getLastPrices/getInstrumentBy signatures to the current SDK; or
    - Pin tinkoff-invest-api to a version that matches expectations in src/api.ts; or
    - Keep using npm start (transpile-only) during local development and skip npm run build in CI until types are aligned.

- Static client
  - Served from /public by Express (see src/server.ts). The app assumes API at http://localhost:3000 by default (see public/app.js -> const apiUrl).
  - WS endpoint: ws://<host>/ws. Messages:
    - {type: "subscribe", ticker: "CNYRUBF"}
    - {type: "unsubscribe", ticker: "CNYRUBF"}
    - {type: "ping"} -> server replies {type: "pong"}
  - REST endpoints:
    - GET /api/health -> { ok: true, ts }
    - GET /api/search?query=... -> { instruments: [...] }
    - GET /api/summary?ticker=... [&k1=&k2=&prevBasePrice=&d=&cbr=&underlyingPrice=&windowStart=&windowEnd=&mode=generic|currency|manual] -> Summary + funding metrics
    - GET /api/candles?ticker=... -> { points: CandlePoint[] }

2) Testing: configuration, running, adding tests
- Approach
  - Use Node’s built-in test runner (Node >= 18). No extra deps.
  - To import TS modules directly in tests, require ts-node/register/transpile-only at the top of the JS test file.

- Verified example (performed and passing locally)
  1. Create tests/smoke.test.js with:

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

  2. Run it:

     node --test tests/smoke.test.js

  3. Expected output (abridged):
     ✔ computeFunding clamps by L2 on large |D|\n✔ computeFunding symmetrical behavior around zero\npass 2, fail 0

  - Note: These unit tests avoid any external API calls or secrets. If you test SDK calls, set TINKOFF_TOKEN in the environment, and prefer to keep such tests opt-in to avoid rate limits.

- Guidelines for adding tests
  - Prefer pure-function units (e.g., computeFunding, computeL1L2, vwapInWindow) for deterministic tests.
  - For integration tests touching Tinkoff API:
    - Gate them with an env flag (e.g., INTEGRATION_TEST=1) and skip by default.
    - Use time windows and small data sets; SDK quotas apply.
  - Organize tests under tests/*.test.js to keep them decoupled from TS build settings.
  - If you need TypeScript test sources, you can still write tests in TS and run with ts-node/register, but .js tests with ts-node/register are simpler and avoid tsconfig interference.

3) Additional development information
- Code style
  - Prettier (.prettierrc): { singleQuote: true, printWidth: 80, tabWidth: 2 }.
  - Run formatting: npx prettier --write .

- Server behavior and internals
  - WebSocket
    - Per-ticker polling with INTERVAL_MS; maintains tickerSubs/clientSubs maps, cleans up on ws close/error. Candles are rate-limited by CANDLES_POLL_MS and sent as either snapshot or incremental updates.
    - Heartbeat pings every 30s; clients should respond with pong.
  - Candles
    - GET /api/candles returns today’s 1m points; public/app.js supports client-side aggregation to 5m/15m/1h.
  - Funding (MoEx-style)
    - computeL1L2(prevBasePrice, k1, k2) and computeFunding(D, L1, L2) implement the clamped funding formula; see src/api.ts. The example tests validate clamping and symmetry behavior.

- CLI (src/main.ts)
  - Demonstrates querying CNYRUBF instrument, fetching last price, order book, intraday candles, and printing a summary. Requires TINKOFF_TOKEN.

- Troubleshooting
  - Error: "TINKOFF_TOKEN not set in environment" -> create .env with TINKOFF_TOKEN=... or export in the shell.
  - Type-check errors on npm run build:
    - Either align src/api.ts to the current SDK’s enums/signatures (preferred), or run npm start (transpile-only) for local dev.
  - CORS/frontend not loading data:
    - Ensure the server URL in public/app.js (apiUrl) matches the server host/port.
  - WS not updating:
    - Verify the client sends {type: 'subscribe', ticker} after connection.

- Minimal setup checklist
  - Node 20+ (node --version).
  - npm ci (or npm i).
  - .env with TINKOFF_TOKEN=<your token> for API-dependent features.
  - npm start, then open http://localhost:3000 in a browser.

- Notes on distribution
  - There is no production build pipeline for the server; deploy as a Node process. Consider adding a PM2/systemd unit and configuring env vars in the runtime environment.
