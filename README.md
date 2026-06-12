# AMK

Minimal REST API server using Express.js 5, Kysely, and SQLite3. Written in TypeScript with strict ESLint rules.

## Pre-requisites
- Node.js 22+

## How to run
1. Install dependencies: `npm install`
2. Create a `.env` file with the required environment variables (see `config/config.ts` for available options)
3. Run migrations to initialize the database: `npm run migrate`
4. Start the server:
   - Production (compiled): `npm start`
   - Development (via tsx): `npm run dev`
5. Call the API endpoint: `curl http://localhost:3000/persons`

## Try the API with JetBrains HTTP Client
The `http/` folder contains [JetBrains HTTP Client](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html) files:
- `http/api.http` — ready-to-run requests for every endpoint (list, get, filter, sort, paginate, create)
- `http/http-client.env.json` — environments for `dev` (`localhost:3000`) and `docker` (`localhost:4000`)

Open `http/api.http` in any JetBrains IDE, pick the environment from the dropdown, and run individual requests from the gutter icons.

## Database migrations
Migrations are managed via Kysely's built-in `Migrator` API.

```bash
# Run all pending migrations (includes schema + seed data)
npm run migrate

# Roll back the last migration
npm run migrate:down

# Roll back all migrations
npm run migrate:reset
```

Migrations live in `migrations/` as TypeScript files and are executed via `tsx`.

## Tests
1. Make sure dependencies are installed
2. Run `npm test`

### Test stack
- `node:test` — built-in test runner (Node 22+)
- `expect` — standalone assertion library (Jest-style)
- `supertest` — HTTP-level integration testing
- `c8` — V8 coverage reporting

### Linting
```bash
npm run lint      # Check for lint and type-aware errors
npm run lint:fix  # Auto-fix lint issues where possible
```

### Building for production
```bash
npm run build   # Compiles TypeScript to dist/ via tsc
npm start       # Runs the compiled output
```

## License
[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0)
