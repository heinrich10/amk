# AMK — Agent Project Guide

This document is for AI coding agents working on the AMK repository. It describes the project's architecture, conventions, and workflows based on the actual codebase.

## Project Overview

AMK is a minimal, no-frills REST API server built with **Express.js**, **Knex.js**, and **better-sqlite3**. It demonstrates a layered backend architecture for three related entities: `persons`, `countries`, and `continents`. The project is migrating from **JavaScript/ESM** (`.mjs`) to **TypeScript** (`.ts`) in Phase 2 and targets Node.js 20+ (see `Dockerfile`).

- **Repository**: https://github.com/amkjs/amk
- **License**: Apache-2.0
- **Runtime**: Node.js
- **Database**: SQLite3 via `better-sqlite3` (file-based for development, `:memory:` for tests)
- **Server port**: `3000` (hardcoded in `app.mjs`)

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (migrating from `.mjs`) |
| HTTP Framework | Express.js 5 |
| Query Builder / ORM | Knex.js 3 |
| Database | SQLite3 via `better-sqlite3` |
| Validation | Zod |
| Async Error Handling | Express 5 native |
| Testing | `node:test`, `expect`, Supertest 6 |
| Coverage | c8 9 |
| Linting | ESLint (eslint:recommended + custom rules) |
| Environment Config | Node.js `--env-file` |
| Functional Utilities | Native ES2022 |
| TS Loader (dev/test) | tsx |
| Compiler | TypeScript (`tsc`) |

## Project Structure

```
├── app.mjs / app.ts        # Entry point — starts the HTTP server
├── src/
│   ├── api.mjs / api.ts    # Express app factory — wires routers, middleware, models
│   ├── controller/         # Request/response handlers (one per entity)
│   ├── model/              # Business logic & DB queries (one per entity + base class)
│   ├── router/             # Express route definitions (one per entity)
│   ├── schema/             # Zod schemas for request validation
│   ├── lib/                # Shared infrastructure (DB connection, error handling)
│   └── utils/              # Pure helper functions (query parsing, filtering, etc.)
├── test/
│   ├── api_tests/          # Integration / HTTP-level tests (*.test.mjs → *.test.ts)
│   ├── unit_tests/         # Unit tests for utilities (*.test.mjs → *.test.ts)
│   └── index.mjs / index.ts # Test bootstrap — exports up/down/teardown
├── config/
│   └── config.mjs / config.ts # Centralized config object (reads `process.env.DB`)
├── migrations/
│   └── *.js                # Knex migration files
├── seeds/
│   └── seed_data.js        # Seed script for continents, countries, and persons
├── http/
│   ├── api.http            # JetBrains HTTP Client requests for all API endpoints
│   └── http-client.env.json # Environment configs (dev / docker) for the HTTP Client
├── knexfile.js             # Knex configuration (development + test environments)
├── package.json            # Dependencies and npm scripts
├── .c8rc                   # Coverage reporter configuration
├── .eslintrc.js            # Linting rules
└── Dockerfile              # Node 20 Alpine container image
```

## Architecture & Code Organization

The codebase follows a **layered architecture**:

1. **Router** (`src/router/*.mjs` → `*.ts`) — Defines Express routes. Controller methods are bound to their instance (`.bind(controller)`) so `this` context is preserved. Express 5 catches async errors natively.
2. **Controller** (`src/controller/*.mjs` → `*.ts`) — Extracts query/body/params from `req`, delegates to models, and writes to `res`. Performs Zod validation for write operations.
3. **Model** (`src/model/*.mjs` → `*.ts`) — Contains business logic and database queries. All models extend `BaseModel` (`src/model/base.mjs` → `base.ts`), which provides a Knex query builder instance via `getDB()` and a generic `getCount()` helper.
4. **Schema** (`src/schema/*.mjs` → `*.ts`) — Zod schemas for runtime validation and type inference.
5. **Lib** (`src/lib/*.mjs` → `*.ts`) — Singletons for the Knex connection (`db.mjs` → `db.ts`) and shared error classes / error handler.
6. **Utils** (`src/utils/*.mjs` → `*.ts`) — Pure, reusable functions. `query.ts` implements filtering, sorting, and pagination helpers using native arrow functions.

### Dependency Injection Pattern

`src/api.mjs` instantiates models and controllers manually and passes model instances into controllers:

```js
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
npm run build      # Runs tsc — compiles src/ and test/ into dist/

# Start the development server (listens on port 3000)
npm start          # Runs compiled output: node --env-file=.env dist/app.mjs
npm run dev        # Runs directly via tsx: tsx --env-file=.env app.mjs

# Run the test suite with coverage
npm test           # Equivalent to: c8 tsx --env-file=.env.test --test --test-concurrency=1 <test-files>

# Run Knex migrations
npm run migrate    # Equivalent to: knex migrate:latest

# Run seed script
npm run seed       # Equivalent to: knex seed:run
```

### Test Setup

- `node --test` auto-discovers `*.test.mjs` files natively, but **not** `*.test.ts`. During the TypeScript migration, test files are run via `tsx` with an explicit file list.
- `test/index.mjs` (→ `test/index.ts`) exports `up()`, `down()`, and `teardown()` for Knex migrations/seeds.
- Each test file imports `up`/`down`/`teardown` and manages its own lifecycle hooks (`beforeEach`/`afterEach`/`after`).
- API tests live in `test/api_tests/*.test.mjs` (→ `*.test.ts`) and use **Supertest** against the Express app exported from `src/api.mjs` (→ `src/api.ts`).
- Unit tests live in `test/unit_tests/**/*.test.mjs` (→ `*.test.ts`).
- Tests must run sequentially (`--test-concurrency=1`) because all files share a singleton Knex instance backed by a single `:memory:` SQLite database.
- c8 is configured with `all: true` and reporters `lcov` + `text-summary`.

## Database

- **Development**: SQLite3 file (`./dbdev.sqlite3.db`) — configurable via `DB` env var (see `config/config.mjs` / `config.ts`).
- **Test**: SQLite3 `:memory:` database (see `knexfile.js`).
- **Driver**: `better-sqlite3` via Knex. Replaced the deprecated `sqlite3` package.
- **Pool constraint for `:memory:`**: The singleton `db` instance uses `pool: { min: 1, max: 1 }` when `DB` is `:memory:`. `better-sqlite3` creates a separate in-memory database per connection; restricting the pool ensures migrations and queries share the same database.
- **Foreign keys**: `better-sqlite3` enforces foreign keys by default. Seed data deletion order must respect FK constraints (`persons` → `countries` → `continents`).
- Migrations and seeds are standard Knex files in `migrations/` and `seeds/`.
- Schema consists of three tables: `continents`, `countries`, `persons` with foreign-key relationships.

## Code Style Guidelines

ESLint is configured in `.eslintrc.js` with the following notable rules:

- `ecmaVersion: 2022`, `sourceType: "module"`
- `strict: [2, 'global']`
- `no-var: 2` — use `const` / `let`
- `eqeqeq: [2, 'smart']` and `no-eq-null: 2`
- `callback-return: 2`
- `no-process-env: 2` — environment variables should be read in `config/` only
- `no-process-exit: 2`
- `global-require: 2`
- `default-case: 2`

### Conventions

- Source files are migrating from **`.mjs`** to **`.ts`**. During Phase 2, the codebase is a mix of both.
- TypeScript uses `module: "NodeNext"` / `moduleResolution: "NodeNext"`. Import specifiers for `.ts` source files must use **`.js`** extensions (e.g., `import { x } from './query.js'` even though the source file is `query.ts`).
- Controllers are **classes** with async methods.
- Models extend `BaseModel` and work directly with Knex query builder.
- Routers are factory functions that receive a controller instance and return an Express router.
- Native arrow functions are used for functional composition (manual `applyFilter` → `applySort` → `applyPagination` chaining).

## Security Considerations

- The project uses a custom error handler (`src/lib/error-handler.mjs` → `error-handler.ts`) for Express error handling. Stack traces are hidden in production (`NODE_ENV=production`).
- Zod is used for request body validation. The `PersonController` validates POST bodies with `PersonSchema.safeParse()`; list endpoints rely on `extract()` helpers for query parsing.
- No authentication or authorization layer is present — this is a sample/demo API.
- There is no `.env.example` file in the repository despite the README referencing one. The only env file present is `.env.test`.

## Deployment

A `Dockerfile` is included:

- Base image: `node:20.11.1-alpine`
- Working directory: `/usr/src/app`
- Exposes port `4000` (note: the app itself listens on `3000` by default; the Dockerfile exposes `4000`).
- Runs `npm start` by default.

## Common Pitfalls for Agents

1. **File extensions**: Source is migrating from `.mjs` to `.ts`. New files should be `.ts`. When importing a `.ts` file, use a `.js` extension in the specifier (NodeNext convention: `import { x } from './query.js'`).
2. **Knex instance**: Always use the singleton from `src/lib/db.mjs` (→ `db.ts`). Do not create new Knex instances.
3. **Test database**: API tests use the real Express app and an in-memory SQLite database. Each test suite runs migrations and seeds in `beforeEach` and rolls back in `afterEach`.
4. **Express 5 async errors**: Express 5 catches rejected promises from async handlers natively — no wrapper needed. Just pass the controller method (bound to its instance).
5. **Query helper regex**: `applyFilter` uses `/.*name.*/` to decide between `whereLike` and `where`. Adding a field with "name" in it will automatically become a substring search.
