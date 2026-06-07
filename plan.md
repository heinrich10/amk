# AMK Project Modernization Roadmap

## Executive Summary

This roadmap transforms AMK from a minimal ES-module Express demo into a modern, type-safe, Domain-Driven REST API. The work is split into 6 phases (0–5) designed to be executed sequentially, with a working application at the end of each phase.

---

## Current State Analysis

### Dependency Health
| Package | Current | Latest | Status |
|---------|---------|--------|--------|
| express | 4.19.2 | 5.2.1 | **Major update available** (v5 stable) |
| knex | 3.1.0 | 3.2.10 | Patch/minor update available |
| ajv | 8.12.0 | 8.20.0 | Minor updates available |
| better-sqlite3 | 12.10.0 | 12.10.0 | Active, replaced sqlite3 |
| lodash | 4.17.21 | 4.18.1 | Patch update available |
| amk-error | 0.1.0 | 0.1.0 | **Abandoned** (single release, 2017) |
| amk-wrap | 0.2.0 | 1.0.0 | Active (v1 just released) |
| api-error-handler | 1.0.0 | 1.0.0 | **Abandoned** (single release, 2014) |

### Architecture Today
- **Pattern:** Anemic layered architecture (Router → Controller → Model)
- **DI:** Manual object graph in `src/api.mjs`
- **Modules:** ES modules (`.mjs`)
- **Types:** None (JavaScript only)
- **DB Access:** Knex query builder with inheritance-based models
- **Validation:** AJV for request bodies only
- **Testing:** `node:test` + `expect` + Supertest + c8 coverage
- **Database Driver:** `better-sqlite3` (replaced deprecated `sqlite3`)

### Database Schema
Three tables: `continents` → `countries` → `persons` (foreign-key chain)

---

## Dependency Audit: TypeScript-Native Replacements

Every dependency was evaluated for TypeScript ergonomics, maintenance health, and whether a modern native or TypeScript-first alternative exists.

### Production Dependencies

| Current | Status | TypeScript-Native Replacement | Recommendation |
|---------|--------|-------------------------------|----------------|
| `express` | Active (v5 stable) | **Express 5** | **Update**. Keep Express — v5 went stable in 2024 with native async error handling. Largest ecosystem, lowest migration cost for this codebase. |
| `knex` | Active but pre-TypeScript | **Kysely** | **Replace** (Phase 3). Already planned. Kysely infers query result types directly from your schema definitions — no generic annotations needed. |
| `ajv` | Active, JSON Schema standard | **Zod** | **Replace**. Zod defines schemas in TypeScript and infers types automatically. One schema = runtime validation + compile-time type. Eliminates the duplicate schema/type definitions that AJV requires. |
| `lodash` | Effectively maintenance mode | **Native ES2024 + small helpers** | **Replace**. `Object.groupBy`, `structuredClone`, `Array.toSorted`, `Array.flat` cover most lodash use cases. AMK only uses `fp.keys`, `fp.curry`, `fp.compose` — all replaceable with native code. |
| `sqlite3` | Active | **better-sqlite3** | **Replace** (with Kysely). Synchronous API, faster for read-heavy workloads, preferred by Kysely. |
| `dotenv` | Active | **Node.js `--env-file`** | **Remove**. Node 20 supports `--env-file=.env` natively. No package needed. |
| `response-time` | Active | **Keep** | Small, focused middleware. Works with Express 5. No replacement needed. |
| `amk-error` | Abandoned | **Custom error classes** | **Replace** (Phase 1). Already planned. |
| `amk-wrap` | Active | **Express v5 native** | **Remove**. Express v5 catches async errors natively — no wrapper needed. |
| `api-error-handler` | Abandoned | **Custom error handler** | **Replace** (Phase 1). Already planned. |

### Development Dependencies

| Current | Status | TypeScript-Native Replacement | Recommendation |
|---------|--------|-------------------------------|----------------|
| `mocha` | Active | **`node:test`** | **Replace** (Phase 0). Already planned. Built into Node 20+. |
| `chai` | Active | **`expect`** (standalone) | **Replace** (Phase 0). Jest's `expect` as a standalone package. Keeps familiar assertion syntax without the full Jest runner. |
| `sinon` | Active, unused | — | **Remove**. Not used in any test file. |
| `supertest` | Active | **Keep** | Works with any framework. Valuable for HTTP-level testing regardless of test runner. |
| `c8` | Active | **Keep** | V8 coverage is modern, fast, and framework-agnostic. No TypeScript-specific replacement needed. |

### Why Zod over AJV?
- **Type inference**: `const UserSchema = z.object({ name: z.string() }); type User = z.infer<typeof UserSchema>;` — no duplication
- **Error messages**: Human-readable by default, no error template configuration
- **Composable**: Schemas can be extended, merged, and transformed — ideal for DTOs and domain validation
- **Standard Schema**: Zod implements the Standard Schema spec, making it portable across frameworks
- **DX**: Method chaining is more intuitive than JSON Schema for TypeScript developers

> **Trade-off**: AJV is ~7× faster at runtime (14M vs 2M ops/sec). For a small demo API, Zod's developer experience outweighs the performance gap. If validation becomes a bottleneck later, migrate hot paths to TypeBox + AJV without changing the types.

### Why remove Lodash?
AMK uses only three lodash/fp functions:
- `fp.keys` → `Object.keys` (native)
- `fp.curry` → arrow functions or inline wrappers (native)
- `fp.compose` → a 3-line `pipe` helper or native `Array.prototype.reduce` (native)

No lodash functions remain after these replacements.

---

## Phase 0: Test Runner Modernization ✅ COMPLETE

**Goal:** Replace Mocha with Node.js built-in `node:test`. Replace Chai with the standalone `expect` package. Keep c8 for coverage and Supertest for HTTP assertions.

### What Was Done

**Database Driver:** Replaced deprecated `sqlite3` (v5) with `better-sqlite3` (v12). The old driver failed to compile on Node.js 24 + Python 3.12 due to missing `distutils`. `better-sqlite3` is the recommended Knex SQLite driver going forward and is also the preferred driver for the future Kysely migration (Phase 3).

**Test Runner:** Mocha → `node:test` (Node.js built-in)
- Zero dependency — shipped with Node.js 20+
- Native `describe`/`it`/`beforeEach`/`afterEach` support
- Files renamed to `*.test.mjs` for auto-discovery

**Assertions:** Chai → standalone `expect` (Jest's assertion library)
- Keeps familiar assertion syntax without the full Jest runner

**Removed:** `mocha`, `chai`, `sinon`, `.mocharc.cjs`

### 0.1 Rename Test Files
- `test/api_tests/person.mjs` → `test/api_tests/person.test.mjs`
- `test/api_tests/country.mjs` → `test/api_tests/country.test.mjs`
- `test/api_tests/continents.mjs` → `test/api_tests/continents.test.mjs`
- `test/unit_tests/utils/query.mjs` → `test/unit_tests/utils/query.test.mjs`

### 0.2 Update `test/index.mjs`
- Removed `mochaGlobalSetup` / `mochaGlobalTeardown` exports
- Exports `up()`, `down()`, and `teardown()`
- Each test file imports these and manages its own `beforeEach`/`afterEach`/`after` hooks

### 0.3 Migrate Assertions (Chai → `expect`)

| Chai | `expect` |
|------|----------|
| `expect(x).to.equal(y)` | `expect(x).toBe(y)` |
| `expect(x).to.deep.equal(y)` | `expect(x).toEqual(y)` |
| `expect(x).to.be.an('array')` | `expect(x).toBeInstanceOf(Array)` |
| `expect(x).to.have.length(n)` | `expect(x).toHaveLength(n)` |
| `expect(x).to.have.property('a', 1)` | `expect(x.a).toBe(1)` |
| `expect(x).to.not.have.property('a')` | `expect(x.a).toBeUndefined()` |

### 0.4 Update Each Test File
- `import { describe, it, beforeEach, afterEach, after } from 'node:test'`
- `import { expect } from 'expect'`
- `beforeEach`/`afterEach` hooks call `up()`/`down()`
- `after` hook calls `teardown()` to close the DB connection
- Supertest for HTTP-level testing (unchanged)

### 0.5 Update `package.json`
- **Removed** devDependencies: `mocha`, `chai`, `sinon`
- **Added** devDependency: `expect`
- **Updated** `"test"` script:
  ```json
  "test": "c8 node --test --test-concurrency=1"
  ```
- **Added** convenience scripts:
  ```json
  "migrate": "knex migrate:latest",
  "seed": "knex seed:run"
  ```

> **Why `--test-concurrency=1`?** All test files share a singleton Knex instance backed by a single `:memory:` SQLite database. `node --test` runs files in parallel by default, which causes migration lock races. Sequential execution is required.

### 0.6 Pool Configuration for `:memory:`
`better-sqlite3` creates a separate in-memory database per connection. The singleton `db` instance is configured with:
```js
pool: isMemoryDb ? { min: 1, max: 1 } : undefined
```
This ensures migrations and queries share the same in-memory database.

### 0.7 Seed Data Fixes
`better-sqlite3` enforces foreign keys by default (unlike `sqlite3`). Two fixes were required:
1. **Deletion order** in seed script: `persons` → `countries` → `continents`
2. **Invalid `country_code`**: Changed `'EU'` to `'FR'` in seed data (EU is not a valid ISO country code in the `countries` table)

### 0.8 Coverage Verification
- `.c8rc` still produces `lcov` and `text-summary`
- `npm test` passes with 93.27% statements, 92.77% branches

**Exit Criteria:** ✅ `npm test` passes. Coverage report generated. Zero Mocha/Sinon/Chai references remain.

---

## Phase 1: Dependency Cleanup & Foundation ✅ COMPLETE

**Goal:** Modernize the dependency tree and replace abandoned packages while keeping all tests green. This phase also introduces the first TypeScript-native replacements from the Dependency Audit.

**Status:** All 26 tests pass. Zero abandoned dependencies remain. Production dependency count reduced from 10 to 5.

### 1.1 Install TypeScript-Native Replacements

**Express 4 → Express 5**
- Update `express` to v5.2.1
- Address breaking changes:
  - Path syntax changes (`*` wildcard behavior)
  - Promise rejection handling in middleware (v5 handles rejected promises natively)
  - `req.query` changes
- Update `app.mjs` entry point if needed
- Keep `response-time` middleware — it works with Express 5

**AJV → Zod**
- Install `zod`
- Create domain-level Zod schemas in `src/schema/`:
  ```ts
  export const PersonSchema = z.object({
    first_name: z.string().min(1),
    last_name: z.string().optional(),
    country_code: z.string().length(2),
  });
  export type Person = z.infer<typeof PersonSchema>;
  ```
- Replace AJV validation in controllers with Zod `.safeParse()` or `.parse()`
- Remove `ajv` and `src/lib/ajv.mjs`

**Lodash → Native JavaScript**
- Remove `lodash` dependency
- Replace `fp.keys` with `Object.keys`
- Replace `fp.curry` with inline arrow functions
- Replace `fp.compose` with a small native `pipe` helper in `src/utils/fp.ts`:
  ```ts
  export const pipe = <T>(...fns: Array<(arg: T) => T>) =>
    (value: T) => fns.reduce((acc, fn) => fn(acc), value);
  ```
- Update `src/utils/query.mjs` to use native functions

**Remove `dotenv`**
- Remove `dotenv` dependency
- Update `package.json` scripts to use Node's built-in flag:
  ```json
  "start": "node --env-file=.env dist/app.mjs",
  "dev": "tsx --env-file=.env app.mjs"
  ```
- For tests, `.env.test` is loaded by the test bootstrap; keep loading it programmatically or use `--env-file=.env.test`

### 1.2 Replace Abandoned Packages

**Replace `api-error-handler` (abandoned since 2014)**
- Build a custom Express error-handling middleware
- Must handle: JSON parse errors, validation errors (Zod), 404s, generic 500s
- Ensure stack traces are hidden in production
- Map custom error classes to HTTP status codes

**Replace `amk-error` (abandoned since 2017)**
- Create a small custom error hierarchy:
  - `AppError` (base)
  - `ValidationError` (400)
  - `NotFoundError` (404)
  - `ConflictError` (409)
- Remove the `amk-error` dependency entirely

**Remove `amk-wrap`**
- Express v5 handles async errors natively — no wrapper needed
- Remove `amk-wrap` dependency

### 1.3 Verify All Tests Pass
- Ensure `npm test` passes after all dependency swaps
- Supertest works unchanged with Express 5
- Update any test helpers if Express 5 behavior differs

### 1.4 Tooling Setup (pre-TS)
- Update `.eslintrc.js` to support modern ECMAScript and relax `no-process-env` for config-only files
- Ensure `npm test` passes after all changes

**Exit Criteria:** ✅ All tests pass. Zero abandoned dependencies remain. Production dependency count is reduced (no lodash, dotenv, ajv, amk-wrap).

**What was done:**
- `express` updated to `^5.2.1` — native async error handling removes need for `amk-wrap`
- `ajv` replaced with `zod` — schemas in `src/schema/*.mjs` now use Zod; controllers use `.safeParse()`
- `lodash` removed — `fp.keys` → `Object.keys`, `fp.curry` → inline arrows, `fp.compose` → manual composition in models
- `dotenv` removed — `package.json` scripts use Node's built-in `--env-file` flag
- `api-error-handler` replaced with custom middleware in `src/lib/error-handler.mjs`
- `amk-error` replaced with custom error hierarchy in `src/lib/error.mjs` (`AppError`, `ValidationError`, `NotFoundError`, `ConflictError`)
- `amk-wrap` removed — Express 5 catches async errors natively; routers now use `.bind(controller)`
- `.eslintrc.js` updated to `ecmaVersion: 2022` and `es2022` env

> **Note:** Test runner migration (Mocha → `node:test`) is handled in **Phase 0** and is assumed complete before Phase 1 begins.

---

## Phase 2: TypeScript Migration (Weeks 2–3)

**Goal:** Convert the entire codebase from JavaScript/ESM to TypeScript without changing runtime behavior.

### 2.1 Tooling Installation ✅ COMPLETE

**Status:** TypeScript compiler, type definitions, and `tsx` loader installed and verified. Pilot file converted. All 27 tests pass. `npm run build` succeeds.

**What was done:**
- Installed dev dependencies: `typescript`, `@types/node`, `@types/express`, `@types/supertest`, `tsx`
- Created `tsconfig.json` with gradual migration settings:
  - `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`
  - `strict: true`, `allowJs: true`, `checkJs: false`
  - `rootDir: "."`, `outDir: "./dist"` — mirrors full source tree into `dist/`
- Updated `package.json`:
  - `"main": "dist/src/api.mjs"`, `"types": "dist/src/api.d.mts"`
  - `"build": "tsc"`, `"start": "node --env-file=.env dist/app.mjs"`, `"dev": "tsx --env-file=.env app.mjs"`
  - `"test": "c8 tsx --env-file=.env.test --test --test-concurrency=1 <files>"` — explicit file list required because `node --test` does not auto-discover `.test.ts`
- **Pilot conversion**: `src/utils/query.mjs` → `src/utils/query.ts` with full type annotations
- Updated all importers to use `.js` extension (NodeNext convention: `import { x } from './query.js'` even though source is `query.ts`)

**Key decisions:**
- `allowJs: true` enables gradual migration — `.mjs` and `.ts` files can coexist during Phase 2
- `tsx` is used for dev and test workflows (no compile step needed)
- `tsc` is used for production builds (`npm run build` → `dist/`)

### 2.2 File-by-File Migration ✅ COMPLETE

**Status:** All `.mjs` source and test files converted to `.ts`. All 27 tests pass. `npm run build` succeeds with zero errors. Source is 100% TypeScript.

**What was done:**
- Converted all source files from `.mjs` → `.ts`:
  - `src/lib/db.mjs` → `src/lib/db.ts`
  - `src/lib/error.mjs` → `src/lib/error.ts`
  - `src/lib/error-handler.mjs` → `src/lib/error-handler.ts`
  - `src/schema/*.mjs` → `src/schema/*.ts`
  - `src/model/base.mjs` → `src/model/base.ts`
  - `src/model/continent.mjs`, `country.mjs`, `person.mjs` → `.ts`
  - `src/controller/*.mjs` → `src/controller/*.ts`
  - `src/router/*.mjs` → `src/router/*.ts`
  - `src/api.mjs` → `src/api.ts`
  - `app.mjs` → `app.ts`
  - `config/config.mjs` → `config/config.ts`
- Converted all test files from `.test.mjs` → `.test.ts`:
  - `test/index.mjs` → `test/index.ts`
  - `test/api_tests/*.test.mjs` → `*.test.ts`
  - `test/unit_tests/**/*.test.mjs` → `*.test.ts`
- Added `"type": "module"` to `package.json` so TypeScript `.ts` files compile to ESM.
- Renamed Knex migration/seed files from `.js` → `.cjs` to keep them as CommonJS:
  - `migrations/20240302031604_migration.js` → `.cjs`
  - `seeds/seed_data.js` → `.cjs`
  - `knexfile.js` → `knexfile.cjs`
- Updated `package.json` scripts:
  - `"main": "dist/src/api.js"`, `"types": "dist/src/api.d.ts"`
  - `"start": "node --env-file=.env dist/app.js"`
  - `"dev": "tsx --env-file=.env app.ts"`
  - `"test": "c8 tsx --env-file=.env.test --test --test-concurrency=1 <test-files>"`
- Updated `tsconfig.json`:
  - Replaced `"app.mjs"` with `"app.ts"` in `include`
  - Replaced `"knexfile.js"` with `"knexfile.cjs"` in `include`

**Type annotations added:**
- Express `Request`, `Response`, `ErrorRequestHandler` for controllers/routers/error handler
- `Knex.QueryBuilder` for `BaseModel.getDB()` and model query chains
- Inline constructor param types for controllers and models
- Cast `req.params.code` with `String()` to handle `string | string[]` Express typing
- Used `as Knex.QueryBuilder` at `applyFilter` call sites where generic inference was weak (to be fixed in Phase 3)
- Added `src/types.d.ts` with `declare module 'response-time'` for missing types

**Exit Criteria:** ✅ `npm run build` succeeds with zero errors. `npm test` passes (27/27). Source is 100% TypeScript.

---

## Phase 3: Knex → Kysely Migration (Weeks 4–5)

**Goal:** Replace Knex with Kysely, a type-safe SQL query builder designed for TypeScript.

### 3.1 Why Kysely?
- First-class TypeScript inference — query results are typed from schema definitions
- SQL-first, no ORM magic — aligns well with the existing Knex mental model
- Lightweight, no hidden N+1 queries
- Active ecosystem (~800K weekly downloads, strong maintenance)
- Natural pairing with the Phase 2 TypeScript migration

### 3.2 Installation & Setup
- Install `kysely`, `better-sqlite3` (Kysely's preferred SQLite driver)
- Install `kysely-codegen` (dev) to auto-generate DB types from the existing schema
- Create `src/lib/kysely.ts` with DB instance and schema types

### 3.3 Schema Type Generation
- Run `kysely-codegen` against the existing SQLite database to generate:
  ```ts
  // src/db-schema.ts
  export interface DB {
    continents: ContinentsTable
    countries: CountriesTable
    persons: PersonsTable
  }
  ```
- Check generated types into version control

### 3.4 Migrate Data Access Layer
For each model, rewrite Knex queries as Kysely queries:

**BaseModel → Repository pattern (lightweight)**
```ts
// Before: class BaseModel with getDB()
// After: abstract class BaseRepository with protected db: Kysely<DB>
```

**Model migration examples:**
- `Continent.get()` → `db.selectFrom('continents').select(['code', 'name']).execute()`
- `Country.get()` → `db.selectFrom('countries')...` with composed filter/sort/pagination
- `Person.getById()` → `db.selectFrom('persons').innerJoin('countries', ...).innerJoin('continents', ...)...`

### 3.5 Update Query Utilities
- Rewrite `applyFilter` as a generic Kysely `ExpressionBuilder` callback using `sql.ref(key)` for column references
- Remove `applySort` and `applyPagination` — Kysely's fluent API and strong typing make generic chainable helpers impractical; sorting and pagination are inlined directly in each model's query chain

### 3.6 Migration System Decision
Kysely has no built-in migration CLI. Options:
- **Option A (Recommended):** Use Kysely's built-in `Migrator` API with `FileMigrationProvider`
  - Convert existing Knex migration files to Kysely migration format
  - Keep the same up/down semantics
- **Option B:** Keep existing Knex migrations for historical schema, use Kysely for new queries
  - Simpler but leaves a Knex dependency in the project

**Recommended:** Option A — fully remove Knex.

### 3.7 Update Test Bootstrap
- Rewrite `test/index.ts` to use Kysely migrations
- Ensure seed data runs via Kysely queries
- Keep the `node:test` + `beforeEach`/`afterEach` pattern from Phase 0

### 3.8 Remove Knex
- Uninstall `knex`
- Delete `knexfile.cjs`
- Update `package.json` scripts

**Exit Criteria:** ✅ No Knex references remain. All queries compile with full type safety. All tests pass.

**What was done:**
- Installed `kysely` and `kysely-codegen`
- Generated `src/db-schema.ts` from existing SQLite DB using `kysely-codegen`
- Created `src/lib/kysely.ts` with Kysely `SqliteDialect` using a shared `better-sqlite3` `Database` instance
- Deleted `src/lib/db.ts` (old Knex singleton)
- Rewrote all models to use Kysely queries (`selectFrom`, `insertInto`, `updateTable`, `innerJoin`)
- Deleted `src/model/base.ts` — Kysely's strong typing makes a generic `BaseModel` impractical; `getCount` is inlined per model
- Rewrote `src/utils/query.ts`: `applyFilter` returns a generic `ExpressionBuilder` callback using `sql.ref(key)`; `applySort` and `applyPagination` were removed and inlined in model query chains
- Converted Knex migration to Kysely format: `migrations/20240302031604_initial.ts`
- Created seed data as a versioned Kysely migration: `migrations/20240302031605_seed_data.ts`
- Created `scripts/migrate.ts` using Kysely's `Migrator` + `FileMigrationProvider` — supports `latest`, `down`, and `reset` commands
- Rewrote `test/index.ts` to use Kysely's `Migrator` API (`migrateToLatest` / `migrateTo('no_migrations')`)
- Removed `knexfile.cjs`, `seeds/seed_data.cjs`, and `seeds/` directory
- Updated `package.json`: removed `knex` dependency, removed `"seed"` script, added `"migrate"`, `"migrate:down"`, and `"migrate:reset"` scripts
- Updated `tsconfig.json`: removed `knexfile.cjs` from `include`
- Updated `AGENTS.md` to reflect Kysely architecture

---

## Phase 3.5: Linting & Code Quality

**Goal:** Add a working TypeScript-aware linter to enforce code quality and consistency. The project already has an `.eslintrc.js` (pre-TypeScript, unused), but ESLint is not installed and there is no `lint` script.

### What to do

1. **Install dependencies**
   - `eslint` (core)
   - `@eslint/js` (recommended rules)
   - `typescript-eslint` (TypeScript parser + plugin)

2. **Replace `.eslintrc.js` with `eslint.config.mjs`** (flat config format)
   - Extend `eslint.configs.recommended` and `tseslint.configs.recommended`
   - Target `src/**/*.ts`, `test/**/*.ts`, `scripts/**/*.ts`, `migrations/**/*.ts`
   - Key rules:
     - `@typescript-eslint/no-explicit-any: error`
     - `no-var: error`
     - `eqeqeq: [error, smart]`
     - `no-eq-null: error`

3. **Add `package.json` scripts**
   - `"lint": "eslint src test scripts migrations"`
   - `"lint:fix": "eslint src test scripts migrations --fix"`

4. **Fix lint errors**
   - Run `npm run lint:fix` to auto-fix what it can
   - Manually fix remaining issues (unused imports, missing `await`, etc.)

### Why now?
- Phase 2 gave us TypeScript; Phase 3 gave us type-safe queries
- Adding linting before Phase 4 (DDD refactor) ensures the new architecture is built on clean, consistently styled code
- Catching issues like unused imports or missing `await` early prevents bugs in the DDD layer

**Exit Criteria:** ✅ `npm run lint` passes with zero errors. All source, test, script, and migration files are covered.

---

## Phase 4: Domain-Driven Design Architecture (Weeks 6–8)

**Goal:** Restructure the codebase from a technical layered architecture to a domain-centric architecture.

### 4.1 DDD Layers for This Project

```
src/
├── domain/              # Pure business logic, no infra dependencies
│   ├── person/
│   │   ├── Person.ts           # Aggregate root
│   │   ├── PersonRepository.ts # Interface (port)
│   │   ├── PersonName.ts       # Value object
│   │   └── events/
│   ├── country/
│   │   ├── Country.ts
│   │   ├── CountryRepository.ts
│   │   └── Currency.ts         # Value object
│   └── continent/
│       ├── Continent.ts
│       └── ContinentRepository.ts
├── application/         # Use cases / application services
│   ├── person/
│   │   ├── CreatePerson.ts
│   │   ├── GetPerson.ts
│   │   ├── ListPersons.ts
│   │   └── UpdatePerson.ts
│   ├── country/
│   │   ├── GetCountry.ts
│   │   └── ListCountries.ts
│   └── continent/
│       ├── GetContinent.ts
│       └── ListContinents.ts
├── infrastructure/      # External concerns
│   ├── db/
│   │   ├── KyselyDatabase.ts
│   │   ├── migrations/
│   │   └── repositories/
│   │       ├── SqlitePersonRepository.ts
│   │       ├── SqliteCountryRepository.ts
│   │       └── SqliteContinentRepository.ts
│   ├── http/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   └── validation/
│       └── zod-schemas.ts
└── shared/              # Cross-cutting utilities
    ├── errors/
    ├── pagination/
    └── types/
```

### 4.2 Domain Layer Implementation

**Aggregates:**
- `Person` aggregate: `{ id, name: PersonName, countryCode }`
- `Country` aggregate: `{ code, name, phone, symbol, capital, currency, alpha3, continentCode }`
- `Continent` aggregate: `{ code, name }`

**Value Objects:**
- `PersonName` (validates non-empty, max length)
- `CountryCode` (ISO 3166-1 alpha-2 format)
- `Currency` (3-letter code)

**Repository Interfaces (Ports):**
```ts
interface PersonRepository {
  findById(id: number): Promise<Person | null>
  findAll(filter: PersonFilter): Promise<PaginatedResult<Person>>
  save(person: Person): Promise<Person>
  update(person: Person): Promise<Person>
  delete(id: number): Promise<void>
}
```

### 4.3 Application Layer Implementation

Each use case is a single class with an `execute()` method:
```ts
class ListPersonsUseCase {
  constructor(private readonly personRepo: PersonRepository) {}

  async execute(query: ListPersonsQuery): Promise<PaginatedResult<PersonDto>> {
    // 1. Validate query (can delegate to domain or use Zod here)
    // 2. Call repository
    // 3. Map domain entities to DTOs
    // 4. Return
  }
}
```

### 4.4 Infrastructure Layer Refactor

- Move Kysely DB setup to `infrastructure/db/`
- Implement repository interfaces as SQL-backed adapters
- Move Express routes, controllers, and middleware to `infrastructure/http/`
- Controllers become thin — only extract req data, call use cases, format responses

### 4.5 Dependency Injection Container

Introduce a lightweight DI container (manual or a small library like `tsyringe` or `inversify`):
```ts
// container.ts
container.register('PersonRepository', SqlitePersonRepository)
container.register('ListPersonsUseCase', ListPersonsUseCase)
// ...
```

Or stick with manual wiring in a composition root:
```ts
// composition-root.ts
const db = createKyselyDb()
const personRepo = new SqlitePersonRepository(db)
const listPersons = new ListPersonsUseCase(personRepo)
// wire to controllers
```

### 4.6 Validation Strategy

- **Zod for HTTP request validation** (infrastructure concern) — already introduced in Phase 1
- Add domain-level validation in value objects and aggregates
- Share Zod schemas between domain and infrastructure layers via the Standard Schema spec

### 4.7 Replace `amk-wrap`

Since Express v5 handles async errors natively, `amk-wrap` is no longer necessary:
- Remove `amk-wrap` dependency
- Update routers to pass controller methods directly
- Let Express v5 catch rejected promises

**Exit Criteria:** No imports from `domain/` into `infrastructure/`. Domain layer has zero external dependencies. Tests pass.

---

## Phase 5: New Features & API Completeness (Weeks 9–10)

**Goal:** Evolve the API from read-only/demo into a full-featured CRUD API.

### 5.1 Missing CRUD Operations

**Continents (currently read-only):**
- `POST /continents` — Create a continent
- `PUT /continents/:code` — Update a continent
- `DELETE /continents/:code` — Delete a continent (cascade to countries?)

**Countries (currently read-only):**
- `POST /countries` — Create a country
- `PUT /countries/:code` — Update a country
- `DELETE /countries/:code` — Delete a country

**Persons (partial CRUD):**
- `PUT /persons/:id` — Update a person (exists in model, no route)
- `DELETE /persons/:id` — Delete a person

### 5.2 Validation Schemas
- Add Zod schemas for all new endpoints
- Validate `country_code` exists in `countries` table before creating/updating a person
- Validate `continent_code` exists in `continents` table before creating/updating a country

### 5.3 API Feature Enhancements
- **Search endpoint:** `GET /countries/search?q=united` (full-text search across name, capital, currency)
- **Statistics endpoint:** `GET /continents/:code/stats` — aggregate country count, total population (if added)
- **Bulk operations:** `POST /persons/bulk` for batch inserts
- **HATEOAS links:** Add `_links` to response envelopes

### 5.4 Potential Schema Extensions
- Add `created_at` / `updated_at` timestamps to all tables
- Add `population` field to `countries`
- Add `email` field to `persons`
- Consider a `cities` table between `countries` and `persons` for richer hierarchy

### 5.5 OpenAPI Specification
- Add an `openapi.yaml` or generate one from routes
- Add a `/docs` endpoint serving Swagger UI

**Exit Criteria:** Full CRUD for all 3 entities. New features have tests. API is documented.

---

## Appendix A: Dependency Replacement Map

| Old | Status | Replacement | Phase |
|-----|--------|-------------|-------|
| `express` | Active (v5 stable) | **Express 5** | 1 |
| `ajv` | Active | **Zod** | 1 |
| `lodash` | Maintenance mode | **Native ES2024** | 1 |
| `dotenv` | Active | **Node.js `--env-file`** | 1 |
| `response-time` | Active | **Keep** | 1 |
| `amk-error` | Abandoned | Custom error hierarchy | 1 |
| `api-error-handler` | Abandoned | Custom Express error handler | 1 |
| `amk-wrap` | Active but unnecessary | Express v5 native async handling | 1 |
| `mocha` | Replaced by built-in | `node:test` | 0 |
| `chai` | Replaced by standalone | `expect` | 0 |
| `sinon` | Unused | Remove | 0 |
| `knex` | To be replaced | `kysely` + `better-sqlite3` | 3 |

## Appendix B: Technology Stack (Target)

| Layer | Current | Target |
|-------|---------|--------|
| Language | JavaScript (ESM) | TypeScript (strict) |
| HTTP Framework | Express 4 | **Express 5** |
| Query Builder | Knex | **Kysely** |
| Database Driver | sqlite3 | **better-sqlite3** |
| Validation | AJV | **Zod** + Domain validation |
| Environment Config | dotenv | **Node.js `--env-file`** |
| Functional Utilities | lodash/fp | **Native ES2024** |
| Testing | Mocha/Chai/Supertest | **`node:test`** + **`expect`** + Supertest |
| Coverage | c8 | c8 |
| DI | Manual | Lightweight container |
| Architecture | Layered | Domain-Driven Design |

## Appendix C: Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Express 5 breaking changes | Run full API test suite after upgrade; address routing/query changes |
| Kysely migration complexity | Keep Knex as fallback during Phase 3; run both query builders in parallel briefly |
| TypeScript strict mode pain | Enable strict incrementally: `strictNullChecks` first, then full `strict` |
| DDD over-engineering | Keep aggregates flat; no event sourcing or CQRS unless needed |
| Test regression | Never delete tests; only refactor them alongside source code |

## Appendix D: Recommended Execution Order

0. **Phase 0** — Test runner migration. Small, self-contained, reduces dependencies early.
1. **Phase 1** — Do not skip. Foundation must be solid.
2. **Phase 2** — Critical enabler for everything after.
3. **Phase 3** — Natural follow-up to TypeScript; Kysely's types shine here.
4. **Phase 4** — Easier once types and queries are modern.
5. **Phase 5** — Build new features on the clean architecture.

**Estimated total effort:** 8–10 weeks for a single developer working part-time (including Phase 0).
