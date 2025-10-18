Project: trade

Scope
- Monorepo with two packages:
  - packages/backend (NestJS/Express, TypeScript, BullMQ, SQLite via better-sqlite3)
  - packages/frontend (React + esbuild, TypeScript; API client generated via openapi-typescript-codegen)
- Node 20 runtime assumed (Dockerfile uses node:20-slim). Workspaces are enabled in root package.json.

Build and configuration
Backend
- Local (host):
  - Install deps at repo root: npm ci
  - Env: create packages/backend/.env if needed (dotenv is used). Typical variables used by runtime features:
    - PORT=3000 (default if omitted)
    - DB_PATH=./data/trade.db (better-sqlite3 file path; default resolves to <repo>/packages/backend/data/trade.db)
    - REDIS_URL=redis://localhost:6379 (if BullMQ/queues enabled); alternatively specify REDIS_HOST and REDIS_PORT
    - OPENAI_API_KEY=<your key> (required for LLM features; LLM base URL is hardcoded to https://api.proxyapi.ru/openrouter/v1; model mistralai/mistral-medium-3.1)
    - TINKOFF_TOKEN=<your token> (required for Tinkoff data integration)
    - QUOTE_POLL_MS=2000 and TRADES_POLL_MS=10000 (optional WS polling intervals)
  - Dev run: npm run dev (from repo root) or npm run dev --workspace packages/backend
  - Start (transpile-only): npm run start (root) or npm run start --workspace packages/backend
  - Type check: npm run build (root/backend). Note: tsconfig.json includes only backend/src and compiles with decorators enabled.
  - DB migrations (custom script): npm run migrate --workspace packages/backend; related: migrate:status, migrate:reset
  - Swagger JSON generation: npm run swagger:generate --workspace packages/backend (writes packages/backend/openapi.json)
- Docker:
  - Build and run backend container:
    - docker build -t trade-backend .
    - docker run -p 3000:3000 -v $(pwd)/packages/backend/data:/app/packages/backend/data --name trade-backend trade-backend
  - The image installs build tools for better-sqlite3 and runs npm run start in packages/backend as node user.
- Redis infra (optional):
  - docker compose up -d (spins up a redis:7-alpine with persistence and healthcheck)
  - In-container REDIS_URL should be redis://redis:6379; from host: redis://localhost:6379.

Frontend
- Build once: npm run build --workspace packages/frontend
  - Bundles ts/index.tsx with esbuild into packages/frontend/build/index.js (ESM, browser platform). Source maps enabled.
- Watch mode (dev bundling): npm run watch --workspace packages/frontend
- Type check only: npm run typecheck --workspace packages/frontend
- API client generation:
  - npm run api:generate --workspace packages/frontend
  - Input: packages/backend/openapi.json; Output: packages/frontend/src/api/client (client fetch). The generated files include a core/request.ts that is marked as generated; avoid manual edits.
- Serving the bundle is not provided in this repo; integrate into your preferred static server or framework. Ensure index.html imports build/index.js as ESM.

Testing
Current state
- No test framework (Jest/Mocha/Vitest) is configured in package.json scripts; no test runner config exists in the repo. package-lock.json may include transitive @jest/schemas due to dev tooling, but it is not a signal that Jest is set up.

Recommended approach (without permanent repo changes)
- Because the task prohibits leaving extra files, below is a validated, ephemeral procedure to demonstrate adding and running a minimal test using ts-node without adding dependencies:
  1) Create a temporary script file (do not commit) at packages/backend/src/smoke.test.ts with a simple runtime assertion, for example:
     - import assert from 'node:assert/strict';
     - assert.equal(1 + 1, 2);
     - console.log('smoke ok');
  2) Execute it directly with ts-node from the root:
     - npx ts-node packages/backend/src/smoke.test.ts
     - Expected output: smoke ok and exit code 0.
  3) Remove the temporary file after verifying. This keeps the repository clean while showing how to execute TypeScript tests quickly.
- If you want durable tests, choose and add a framework:
  - Jest (common for TS/Node): add jest, ts-jest, @types/jest; configure ts-jest; add script "test": "jest" at the root and/or per-package workspaces.
  - Vitest (fast, ESM-friendly): add vitest and tsconfig tweaks; script: "test": "vitest run"; colocate tests as *.test.ts.
  - Mocha + ts-node: minimal setup; script: "test": "mocha -r ts-node/register 'src/**/*.test.ts'".
  Ensure the framework is installed in the correct workspace (backend and/or frontend) and that paths align with tsconfig.json includes.

Guidelines for adding new tests (project-specific)
- Backend
  - Prefer unit tests close to modules in packages/backend/src (e.g., src/lib/**/__tests__/*.test.ts or *.spec.ts).
  - For code touching better-sqlite3, use a temporary data file under a test output dir; do not write into packages/backend/data during tests.
  - For BullMQ or Redis-dependent code, either: mock queue interfaces, or run docker compose up -d and point REDIS_URL to a test database; isolate queues by unique prefixes.
  - Swagger generation and OpenAPI: verify swagger:generate before regenerating frontend API to keep client/server in sync.
- Frontend
  - For API client code (generated), avoid snapshot testing the entire client; instead test integration points around your helper functions wrapping the client.
  - For UI components, if adding a runner like Vitest + @testing-library/react, configure jsdom and ensure esbuild or ts-node transforms for TSX are in place.

Additional development information
- Code style and linting
  - Backend uses ESLint with @typescript-eslint and Prettier config (see packages/backend devDependencies). Run: npm run lint --workspace packages/backend; auto-fix: npm run lint:fix --workspace packages/backend.
  - Root scripts include lint and lint:fix that apply across the repo; ensure ESLint respects package tsconfigs.
  - Frontend depends on prettier-eslint; align formatting with Prettier defaults and ESLint rules.
- TypeScript configuration
  - Root tsconfig targets ES2020, CommonJS, decorators enabled with emitDecoratorMetadata for Nest-style code. include is limited to packages/backend/src; frontend uses its own tsconfig.client.json for typechecking.
- OpenAPI client regeneration contract
  - When backend APIs change, regenerate swagger JSON (npm run swagger:generate --workspace packages/backend), then regenerate frontend client (npm run api:generate --workspace packages/frontend). Commit both the updated openapi.json and generated client so CI and other devs have consistent types.
- Native modules
  - better-sqlite3 requires build tools on the system (python3, make, g++). The Dockerfile installs these. On local machines, ensure XCode CLT (macOS) or build-essential (Linux) are present if npm ci fails building native modules.
- Runtime tips
  - Ensure the data directory exists (packages/backend/data). Dockerfile creates it; locally, create it or set DB_PATH to a writable location.
  - If using Redis-dependent features, start docker-compose and set REDIS_URL appropriately.
- LLM/AI analysis
  - LLM service uses OPENAI_API_KEY with baseURL https://api.proxyapi.ru/openrouter/v1 and model mistralai/mistral-medium-3.1.
  - If OPENAI_API_KEY is missing, any feature depending on LlmService will throw at runtime; guard or mock in local dev.
- WebSocket streaming
  - WS endpoint is available at ws://<host>:<PORT>/ws.
  - Polling intervals controlled by QUOTE_POLL_MS (candles; default 2000) and TRADES_POLL_MS (public trades; default 10000).
  - Event-driven updates are emitted on job:succeeded for candles.import.tinkoff; ensure Redis connection is configured when using jobs.

Validated commands (executed during guideline preparation)
- npm ci at repo root to install workspaces deps.
- Type checks: npm run build (root/backend) succeeded with the current tsconfig.
- Frontend bundle: npm run build --workspace packages/frontend produced build/index.js.
- Temporary smoke test via ts-node (see Testing section) executed successfully and then was removed to keep the repo clean. (Verified again on 2025-10-06 at 01:31 local time.)

Cleanup policy
- Do not commit ad-hoc test or script files. Use the ephemeral ts-node approach for quick validation, or add a proper test framework and commit it explicitly as part of a testing initiative.
