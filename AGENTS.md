# AMK — Agent Project Guide

This document is for AI coding agents working on the AMK repository. It describes the project's architecture, conventions, and workflows based on the actual codebase.

## Project Overview

AMK is a minimal, no-frills REST API server built with **Express.js**, **Knex.js**, and **better-sqlite3**. It demonstrates a layered backend architecture for three related entities: `persons`, `countries`, and `continents`. The project uses **ES modules** (`.mjs` files) throughout and targets Node.js 20+ (see `Dockerfile`).

- **Repository**: https://github.com/amkjs/amk
- **License**: Apache-2.0
- **Runtime**: Node.js
- **Database**: SQLite3 via `better-sqlite3` (file-based for development, `:memory:` for tests)
- **Server port**: `3000` (hardcoded in `app.mjs`)

## Technology Stack

| Layer | Technology |
|-------|------------|
| HTTP Framework | Express.js 4 |
| Query Builder / ORM | Knex.js 3 |
| Database | SQLite3 via `better-sqlite3` |
| Validation | AJV 8 |
| Async Error Handling | `amk-wrap` |
| Testing | `node:test`, `expect`, Supertest 6 |
| Coverage | c8 9 |
| Linting | ESLint (eslint:recommended + custom rules) |
| Environment Config | dotenv |
| Functional Utilities | lodash/fp |

## Project Structure

```
├── app.mjs                 # Entry point — starts the HTTP server
├── src/
│   ├── api.mjs             # Express app factory — wires routers, middleware, models
│   ├── controller/         # Request/response handlers (one per entity)
│   ├── model/              # Business logic & DB queries (one per entity + base class)
│   ├── router/             # Express route definitions (one per entity)
│   ├── schema/             # AJV JSON schemas for request validation
│   ├── lib/                # Shared infrastructure (DB connection, AJV instance)
│   └── utils/              # Pure helper functions (query parsing, filtering, etc.)
├── test/
│   ├── api_tests/          # Integration / HTTP-level tests (*.test.mjs)
│   ├── unit_tests/         # Unit tests for utilities (*.test.mjs)
│   └── index.mjs           # Test bootstrap — exports up/down/teardown
├── config/
│   └── config.mjs          # Centralized config object (reads `process.env.DB`)
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

1. **Router** (`src/router/*.mjs`) — Defines Express routes and applies `amk-wrap` to controller methods so async errors are forwarded to the error handler automatically.
2. **Controller** (`src/controller/*.mjs`) — Extracts query/body/params from `req`, delegates to models, and writes to `res`. Performs AJV validation for write operations.
3. **Model** (`src/model/*.mjs`) — Contains business logic and database queries. All models extend `BaseModel` (`src/model/base.mjs`), which provides a Knex query builder instance via `getDB()` and a generic `getCount()` helper.
4. **Schema** (`src/schema/*.mjs`) — AJV JSON schemas. `src/schema/index.mjs` registers all schemas at runtime so controllers can retrieve them by name.
5. **Lib** (`src/lib/*.mjs`) — Singletons for the Knex connection (`db.mjs`) and the AJV instance (`ajv.mjs`).
6. **Utils** (`src/utils/*.mjs`) — Pure, reusable functions. `query.mjs` implements filtering, sorting, and pagination helpers using `lodash/fp` currying.

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

# Start the development server (listens on port 3000)
npm start          # Note: package.json says "node app.js" but the actual file is app.mjs

# Run the test suite with coverage
npm test           # Equivalent to: c8 node --test --test-concurrency=1

# Run Knex migrations
npm run migrate    # Equivalent to: knex migrate:latest

# Run seed script
npm run seed       # Equivalent to: knex seed:run
```

### Test Setup

- `node --test` auto-discovers `*.test.mjs` files; no glob or config needed.
- `test/index.mjs` exports `up()`, `down()`, and `teardown()` for Knex migrations/seeds.
- Each test file imports `up`/`down`/`teardown` and manages its own lifecycle hooks (`beforeEach`/`afterEach`/`after`).
- API tests live in `test/api_tests/*.test.mjs` and use **Supertest** against the Express app exported from `src/api.mjs`.
- Unit tests live in `test/unit_tests/**/*.test.mjs`.
- Tests must run sequentially (`--test-concurrency=1`) because all files share a singleton Knex instance backed by a single `:memory:` SQLite database.
- c8 is configured with `all: true` and reporters `lcov` + `text-summary`.

## Database

- **Development**: SQLite3 file (`./dbdev.sqlite3.db`) — configurable via `DB` env var (see `config/config.mjs`).
- **Test**: SQLite3 `:memory:` database (see `knexfile.js`).
- **Driver**: `better-sqlite3` via Knex. Replaced the deprecated `sqlite3` package.
- **Pool constraint for `:memory:`**: The singleton `db` instance uses `pool: { min: 1, max: 1 }` when `DB` is `:memory:`. `better-sqlite3` creates a separate in-memory database per connection; restricting the pool ensures migrations and queries share the same database.
- **Foreign keys**: `better-sqlite3` enforces foreign keys by default. Seed data deletion order must respect FK constraints (`persons` → `countries` → `continents`).
- Migrations and seeds are standard Knex files in `migrations/` and `seeds/`.
- Schema consists of three tables: `continents`, `countries`, `persons` with foreign-key relationships.

## Code Style Guidelines

ESLint is configured in `.eslintrc.js` with the following notable rules:

- `ecmaVersion: 8`, `sourceType: "module"`
- `strict: [2, 'global']`
- `no-var: 2` — use `const` / `let`
- `eqeqeq: [2, 'smart']` and `no-eq-null: 2`
- `callback-return: 2`
- `no-process-env: 2` — environment variables should be read in `config/` only
- `no-process-exit: 2`
- `global-require: 2`
- `default-case: 2`

### Conventions

- All source files use **ES modules** and the `.mjs` extension.
- Controllers are **classes** with async methods.
- Models extend `BaseModel` and work directly with Knex query builder.
- Routers are factory functions that receive a controller instance and return an Express router.
- `lodash/fp` is preferred for functional composition (e.g., `compose(applySort, applyPagination, applyFilter)`).

## Security Considerations

- The project relies on `api-error-handler` for Express error handling. Ensure that raw stack traces or SQL errors are not leaked to clients in production.
- AJV is used for request body validation, but query-parameter schemas are registered and validated inconsistently across controllers. The `PersonController` validates POST bodies; list endpoints rely on `extract()` helpers rather than AJV for query validation.
- No authentication or authorization layer is present — this is a sample/demo API.
- There is no `.env.example` file in the repository despite the README referencing one. The only env file present is `.env.test`.

## Deployment

A `Dockerfile` is included:

- Base image: `node:20.11.1-alpine`
- Working directory: `/usr/src/app`
- Exposes port `4000` (note: the app itself listens on `3000` by default; the Dockerfile exposes `4000`).
- Runs `npm start` by default.

## Common Pitfalls for Agents

1. **File extensions**: All source is `.mjs`. Do not create `.js` files in `src/` unless there is a specific reason.
2. **Knex instance**: Always use the singleton from `src/lib/db.mjs`. Do not create new Knex instances.
3. **Test database**: API tests use the real Express app and an in-memory SQLite database. Each test suite runs migrations and seeds in `beforeEach` and rolls back in `afterEach`.
4. **`amk-wrap`**: Controller methods passed to Express routers must be wrapped with `amk-wrap` so that rejected promises are caught and forwarded to the error handler.
5. **Query helper regex**: `applyFilter` uses `/.*name.*/` to decide between `whereLike` and `where`. Adding a field with "name" in it will automatically become a substring search.
