# Trade Project – Developer Guidelines

Audience: advanced contributors familiar with Node.js, NestJS, React, TypeScript, TypeORM, and build tooling. Focused on project‑specific practices only.

---

## Build and Configuration (project‑specific)

Monorepo layout
- packages/backend – NestJS/Express + TypeORM (better-sqlite3), BullMQ (optional)
- packages/frontend – React + esbuild; OpenAPI client generated via openapi-typescript-codegen
- Node 20 runtime assumed; workspaces enabled

Install deps
- At repo root: npm ci

Backend (local host)
- Env via packages/backend/.env (dotenv). Typical variables:
  - PORT=3000 (default)
  - DB_PATH=./data/trade.db (better-sqlite3 file; resolves relative to packages/backend)
  - REDIS_URL=redis://localhost:6379 (optional features); alternatively REDIS_HOST/REDIS_PORT
  - OPENAI_API_KEY=<key> (required for LlmService features; baseURL https://api.proxyapi.ru/openrouter/v1; model mistralai/mistral-medium-3.1)
  - TINKOFF_TOKEN=<token> (required for Tinkoff integration)
  - QUOTE_POLL_MS=2000, TRADES_POLL_MS=10000 (optional WS polling)
- Data dir: packages/backend/data must exist and be writable (Dockerfile ensures this inside container). Create locally if missing.
- Dev run: npm run dev (root) or npm run dev --workspace packages/backend
- Start (transpile‑only): npm run start (root) or npm run start --workspace packages/backend
- Type check: npm run build (root/backend). Backend tsconfig includes only backend/src and enables decorators + emitDecoratorMetadata.
- DB migrations (custom script):
  - npm run migrate --workspace packages/backend
  - Related: migrate:status, migrate:reset
- Swagger JSON:
  - npm run swagger:generate --workspace packages/backend (outputs packages/backend/openapi.json)

Backend (Docker)
- Build: docker build -t trade-backend .
- Run: docker run -p 3000:3000 -v $(pwd)/packages/backend/data:/app/packages/backend/data --name trade-backend trade-backend
- In container, the app runs as node user and executes npm run start in packages/backend.

Redis infra (optional)
- docker compose up -d (spawns redis:7-alpine with persistence and healthcheck)
- Container REDIS_URL: redis://redis:6379; host: redis://localhost:6379

Frontend
- One‑off build: npm run build --workspace packages/frontend (bundles to packages/frontend/build/index.js, ESM + sourcemaps)
- Watch: npm run watch --workspace packages/frontend
- Type check only: npm run typecheck --workspace packages/frontend
- Serving: not provided; ensure index.html imports build/index.js as ESM.
- API client generation contract:
  1) Ensure server Swagger is up to date: npm run swagger:generate --workspace packages/backend
  2) Generate client: npm run api:generate --workspace packages/frontend
  3) Commit both packages/backend/openapi.json and packages/frontend/src/api/client/*
  4) Never hand‑edit generated client (core/request.ts is annotated as generated).


## Architectural and Coding Conventions

General
- Strictly TypeScript throughout. Back end compiled via tsconfig in repo root; front end has its own tsconfig.client.json for typechecks.
- ESLint + Prettier; align with default configs present in packages; use npm run lint / lint:fix at root or workspace‑scoped.

Backend (NestJS + TypeORM)
- Modules follow Nest conventions: controllers under src/**/controllers, repositories under src/**/repositories, entities under src/**/entities, services under src/**/service.
- Validation and API DTOs:
  - Use Zod with nestjs-zod. Controllers return via @ZodResponse({ type: ... }) and validate/shape using schemas (see DocumentsController and DocumentSchema).
  - When mapping persistence entities to API DTOs, prefer a dedicated mapper that pipes through Zod.parse to ensure response shape (see mapWithScrapers in DocumentsController).
- TypeORM usage:
  - Prefer repositories injected via constructor. For lists, use QueryBuilder for complex filters; keep pagination via .skip(offset) and .take(limit), and return total with getManyAndCount.
  - Use In from typeorm for one‑to‑many joins by IDs when avoiding explicit JOINs (fetch related entities separately; assemble maps).
- Error handling:
  - Throw Nest exceptions (NotFoundException, InternalServerErrorException…) from controllers; do not leak raw DB errors.
  - For date query params: construct Date and guard against NaN before applying filters.
- Data patterns:
  - When storing structured content that may be string or object, normalize to string (JSON.stringify if needed) and compute contentHash with sha256 on the final string. Respect inbound contentHash overrides only when explicitly provided at creation; on partial updates, recompute when content changes.
- Scraper/document conventions:
  - DocumentsController demonstrates list/get/create/update/delete around scraper‑document relationship with scraperId. Always validate that referenced scraper exists during mapping; fail fast if missing (InternalServerErrorException), as downstream consumers rely on denormalized fields like scraper.name.
- Swagger/OpenAPI:
  - Keep DTOs and controllers annotated so swagger:generate produces accurate openapi.json; regenerate client after relevant changes.
- Queues/Redis:
  - Queue‑dependent features (e.g., job:succeeded events like candles.import.tinkoff) require configured Redis. Feature‑gate or short‑circuit behavior when REDIS_URL is absent during dev.
- WebSocket:
  - WS endpoint: ws://<host>:<PORT>/ws. Polling intervals controlled by QUOTE_POLL_MS and TRADES_POLL_MS. Event‑driven updates are tied to queue events; ensure Redis configured when enabling jobs.

Frontend (React + esbuild)
- Bundling with esbuild to ESM. Keep imports ESM‑safe.
- API access goes through generated client under packages/frontend/src/api/client. Do not alter generated files manually; wrap with custom helpers if behavior adjustments are needed.
- When backend APIs change, follow the generation contract above to maintain type sync.


## Development Workflow Tips

- Running locally without Redis: set no REDIS_URL to bypass queue features; expect LlmService and any Redis‑dependent code to be inactive or mocked. If OPENAI_API_KEY is missing, features that use LlmService will throw at runtime—guard those paths in UI and services during local dev.
- Migrations: use provided scripts; do not write tests or dev data to packages/backend/data in automated runs. Prefer temp DB files for ad‑hoc experiments.
- Native module (better-sqlite3): Requires build toolchain on host. Dockerfile already installs required deps; on local machines ensure Python 3 + C/C++ toolchain (build‑essential or XCode CLT) when running npm ci.
- Logging/diagnostics: Favor Nest’s built‑in logger and structured errors. Keep sensitive configs in .env.
- Repository hygiene: Commit both server openapi.json and generated client when API changes. Avoid committing local dev artifacts or temporary test files.
- After finishing any feature, commit everything and push to remote.

## Quick Test Strategy (no permanent test framework)

- Ephemeral ts-node smoke test without adding dependencies:
  1) Create a temporary file: packages/backend/src/smoke.test.ts with minimal assertion (e.g., assert.equal(1 + 1, 2); console.log('smoke ok')).
  2) Run: npx ts-node packages/backend/src/smoke.test.ts
  3) Remove the file after verifying. Do not commit.

If adding durable tests is desired in a dedicated effort, adopt Jest or Vitest scoped to workspaces with proper scripts; keep tests colocated under src and mock external infra (SQLite file paths, Redis, LLM).


## Gotchas and Edge Cases Observed

- Date filters: always validate Date objects before using in QueryBuilder to avoid incorrect SQL and silent failures.
- Content normalization: ensure content is stringified consistently before hashing; otherwise duplicate detection via contentHash fails.
- Denormalized lookups: when producing API DTOs with related display data (e.g., scraper name), fetch referenced entities in batches (In(ids)) and map; throw if missing to avoid partial responses.
- OpenAPI drift: client types go stale if backend swagger isn’t regenerated; wire regeneration into your change workflow.
- WS/queues dependency: Event updates require Redis; without it, only polling operates. Ensure proper envs when debugging real‑time flows.
