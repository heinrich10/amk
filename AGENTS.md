# AMK — Agent Project Guide

This document is for AI coding agents working on the AMK repository. It describes the project's architecture, conventions, and workflows based on the actual codebase.

## Project Overview

AMK is a minimal, no-frills REST API server built with **Express.js 5**, **Kysely**, and **better-sqlite3**. It demonstrates a layered backend architecture for three related entities: `persons`, `countries`, and `continents`. The project uses **TypeScript** (`.ts`) and targets Node.js 20+ (see `Dockerfile`).

- **Repository**: https://github.com/amkjs/amk
- **License**: Apache-2.0
- **Runtime**: Node.js
- **Database**: SQLite3 via `better-sqlite3` (file-based for development, `:memory:` for tests)
- **Server port**: `3000` (hardcoded in `app.ts`)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| HTTP Framework | Express.js 5 |
| Query Builder / ORM | Kysely |
| Database | SQLite3 via `better-sqlite3` |
| Validation | Zod |
| Async Error Handling | Express 5 native |
| Testing | `node:test`, `expect`, Supertest 7 |
| Coverage | c8 9 |
| Linting | ESLint flat config (`eslint.config.mjs`) with `typescript-eslint` strict + stylistic type-checked rules |
| Environment Config | Node.js `--env-file` |
| Functional Utilities | Native ES2022 |
| TS Loader (dev/test) | tsx |
| Compiler | TypeScript (`tsc`) |

## Project Structure

```
├── app.ts                  # Entry point — starts the HTTP server
├── src/
│   ├── api.ts              # Express app factory — wires routers, middleware, models
│   ├── controller/         # Request/response handlers (one per entity)
│   ├── model/              # Business logic & DB queries (one per entity)
│   ├── router/             # Express route definitions (one per entity)
│   ├── schema/             # Zod schemas for request validation
│   ├── lib/                # Shared infrastructure (DB connection, error handling)
│   ├── types/              # Shared application types (API responses, errors)
│   ├── utils/              # Pure helper functions (query parsing, filtering, etc.)
│   ├── db-schema.ts        # Kysely-codegen generated DB schema types
│   └── types.d.ts          # Ambient type declarations (e.g. response-time)
├── test/
│   ├── api_tests/          # Integration / HTTP-level tests (*.test.ts)
│   │   └── helper.ts       # Shared Supertest pagination helper
│   ├── unit_tests/         # Unit tests for utilities (*.test.ts)
│   └── index.ts            # Test bootstrap — exports up/down/teardown
├── config/
│   └── config.ts           # Centralized config object (reads `process.env.DB`)
├── migrations/
│   ├── 20240302031604_initial.ts   # Kysely schema migration
│   └── 20240302031605_seed_data.ts # Kysely seed data migration
├── scripts/
│   └── migrate.ts          # Kysely migration runner
├── package.json            # Dependencies and npm scripts
├── .c8rc                   # Coverage reporter configuration
├── eslint.config.mjs       # ESLint flat config (type-aware rules)
└── Dockerfile              # Node 20 Alpine container image
```

## Architecture & Code Organization

The codebase follows a **layered architecture**:

1. **Router** (`src/router/*.ts`) — Defines Express routes. Controller methods are bound to their instance (`.bind(controller)`) so `this` context is preserved. Express 5 catches async errors natively.
2. **Controller** (`src/controller/*.ts`) — Extracts query/body/params from `req`, delegates to models, and writes to `res`. Performs Zod validation for write operations.
3. **Model** (`src/model/*.ts`) — Contains business logic and database queries. Each model uses the Kysely singleton (`src/lib/kysely.ts`) directly. `getCount()` is inlined per model because Kysely's compile-time typing makes a generic table-agnostic base class impractical.
4. **Schema** (`src/schema/*.ts`) — Zod schemas for runtime validation and type inference.
5. **Lib** (`src/lib/*.ts`) — Singletons for the Kysely connection (`kysely.ts`) and shared error classes / error handler.
6. **Utils** (`src/utils/*.ts`) — Pure, reusable functions. `query.ts` implements filtering, sorting, and pagination helpers using native arrow functions.

### Dependency Injection Pattern

`src/api.ts` instantiates models and controllers manually and passes model instances into controllers:

```ts
const person = new Person();
const personController = new PersonController({ person });
app.use('/persons', personRouter(personController));
```

### Pagination, Filtering, and Sorting

List endpoints return a standardized envelope:

```json
{
  "total": 13,
  "limit": 10,
  "offset": 0,
  "data": [ ... ]
}
```

- **Pagination**: controlled by `limit` and `offset` query params (defaults: 10 and 0).
- **Sorting**: controlled by `sort` query param. Prefix with `+` for ascending (default) or `-` for descending (e.g., `sort=-first_name`).
- **Filtering**: any valid field key can be passed as a query param. Fields containing `name` use SQL `LIKE` (case-insensitive substring match); all others use exact equality.

## Build and Test Commands

All commands are run via `npm`:

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build          # Runs tsc — compiles src/ and test/ into dist/

# Start the development server (listens on port 3000)
npm start              # Runs compiled output: node --env-file=.env dist/app.js
npm run dev            # Runs directly via tsx: tsx --env-file=.env app.ts

# Run the test suite with coverage
npm test               # Equivalent to: c8 tsx --env-file=.env.test --test --test-concurrency=1 **/*.test.ts

# Run lint checks
npm run lint           # Check for lint and type-aware errors
npm run lint:fix       # Auto-fix lint issues where possible

# Run Kysely migrations
npm run migrate        # Run all pending migrations
npm run migrate:down   # Roll back one migration
npm run migrate:reset  # Roll back all migrations
```

### Test Setup

- `node --test` auto-discovers `*.test.js` files natively, but **not** `*.test.ts`. Test files are run via `tsx` with an explicit file list.
- `test/index.ts` exports `up()`, `down()`, and `teardown()` for Kysely migrations.
- Each test file imports `up`/`down`/`teardown` and manages its own lifecycle hooks (`beforeEach`/`afterEach`/`after`).
- API tests live in `test/api_tests/*.test.ts` and use **Supertest** against the Express app exported from `src/api.ts`.
- `test/api_tests/helper.ts` provides a shared Supertest helper for paginated list assertions.
- Unit tests live in `test/unit_tests/**/*.test.ts`.
- Tests must run sequentially (`--test-concurrency=1`) because all files share a singleton Kysely instance backed by a single `:memory:` SQLite database.
- c8 is configured with `all: true` and reporters `lcov` + `text-summary`.

## Database

- **Development**: SQLite3 file (`./dbdev.sqlite3.db`) — configurable via `DB` env var. `NODE_ENV` is also centralized in `config/config.ts` (see `Config.DB` and `Config.NODE_ENV`).
- **Test**: SQLite3 `:memory:` database.
- **Driver**: `better-sqlite3` via Kysely. Replaced the deprecated `sqlite3` package.
- **Pool constraint for `:memory:`**: Kysely's `SqliteDialect` accepts a shared `better-sqlite3` `Database` instance directly. This ensures migrations and queries share the same in-memory database without connection-pool configuration.
- **Foreign keys**: `better-sqlite3` enforces foreign keys by default. Seed data deletion order must respect FK constraints (`persons` → `countries` → `continents`).
- Migrations are Kysely `.ts` files in `migrations/` using Kysely's built-in `Migrator` API with `FileMigrationProvider`.
- Seed data is a versioned migration (`20240302031605_seed_data.ts`) rather than a separate seed script.
- Schema consists of three tables: `continents`, `countries`, `persons` with foreign-key relationships.

## Code Style Guidelines

ESLint is configured as a flat config in `eslint.config.mjs` with the following notable setup:

- Targets `src/**/*.ts`, `test/**/*.ts`, `scripts/**/*.ts`, and `migrations/**/*.ts`
- Extends `js.configs.recommended`, `tseslint.configs.strictTypeChecked`, and `tseslint.configs.stylisticTypeChecked`
- Uses `parserOptions.projectService: true` for type-aware linting
- Preserved custom rules:
  - `strict: [2, 'global']`
  - `no-var: 2` — use `const` / `let`
  - `eqeqeq: [2, 'smart']` and `no-eq-null: 2`
  - `callback-return: 2`
  - `no-process-env: 2` — environment variables should be read in `config/` only
  - `no-process-exit: 2`
  - `global-require: 2`
  - `default-case: 2`
- Added TypeScript-specific rules:
  - `@typescript-eslint/no-explicit-any: error`
  - `@typescript-eslint/no-unused-vars: [error, { argsIgnorePattern: '^_' }]`
  - `@typescript-eslint/no-floating-promises: off` only for `test/**/*.ts`

### Conventions

- All source files use **TypeScript** (`.ts`).
- TypeScript uses `module: "NodeNext"` / `moduleResolution: "NodeNext"`. Import specifiers for `.ts` source files must use **`.js`** extensions (e.g., `import { x } from './query.js'` even though the source file is `query.ts`).
- Controllers are **classes** with async methods.
- Models work directly with Kysely query builder. No `BaseModel` — Kysely's strong typing makes generic table-agnostic repositories impractical for this small codebase.
- Routers are factory functions that receive a controller instance and return an Express router.
- Shared application types live in `src/types/` (e.g., `src/types/api-response.ts`, `src/types/error.ts`) and are imported by both source and test code using `.js` specifiers.
- Ambient module declarations (e.g. for `response-time`) live in `src/types.d.ts`.
- Zod schemas are colocated in `src/schema/`; `src/schema/index.ts` exports a `schemas` registry for consumers that need the full set.
- `applyFilter` is a generic Kysely `ExpressionBuilder` callback. It only processes string filter values; non-string values are ignored. Sorting and pagination are inlined directly in model query chains (no generic `applySort`/`applyPagination` helpers).

## Security Considerations

- The project uses a custom error handler (`src/lib/error-handler.ts`) for Express error handling. Stack traces are hidden in production (`NODE_ENV=production`).
- Zod is used for request body validation. The `PersonController` validates POST bodies with `PersonSchema.safeParse()`; list endpoints rely on `extract()` helpers for query parsing.
- No authentication or authorization layer is present — this is a sample/demo API.
- Environment variables are read only in `config/config.ts` (`DB`, `NODE_ENV`). The repository includes `.env` for development and `.env.test` for tests.

## Deployment

A `Dockerfile` is included:

- Base image: `node:20.11.1-alpine`
- Working directory: `/usr/src/app`
- Exposes port `4000` (note: the app itself listens on `3000` by default; the Dockerfile exposes `4000`).
- Runs `npm start` by default.

## Common Pitfalls for Agents

1. **File extensions**: All source is `.ts`. When importing a `.ts` file, use a `.js` extension in the specifier (NodeNext convention: `import { x } from './query.js'`).
2. **Kysely instance**: Always use the singleton from `src/lib/kysely.ts`. Do not create new Kysely instances.
3. **Test database**: API tests use the real Express app and an in-memory SQLite database. Each test suite runs migrations and seeds in `beforeEach` and rolls back in `afterEach`.
4. **Express 5 async errors**: Express 5 catches rejected promises from async handlers natively — no wrapper needed. Just pass the controller method (bound to its instance).
5. **Query helper regex**: `applyFilter` uses `/.*name.*/` to decide between `whereLike` and `where`. Adding a field with "name" in it will automatically become a substring search.
