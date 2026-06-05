# AMK

Minimal REST API server using Express.js, Knex.js, and SQLite3

## Pre-requisites
- Node.js 20+

## How to run
1. Install dependencies: `npm install`
2. Create a `.env` file with the required environment variables (see `config/config.mjs` for available options)
3. Run the app: `npm start`
4. Call the API endpoint: `curl http://localhost:3000/persons`

## Try the API with JetBrains HTTP Client
The `http/` folder contains [JetBrains HTTP Client](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html) files:
- `http/api.http` — ready-to-run requests for every endpoint (list, get, filter, sort, paginate, create)
- `http/http-client.env.json` — environments for `dev` (`localhost:3000`) and `docker` (`localhost:4000`)

Open `http/api.http` in any JetBrains IDE, pick the environment from the dropdown, and run individual requests from the gutter icons.

## Initialize DB and seed data
1. Run migrations: `npm run migrate`
2. Run seeds: `npm run seed`
3. Refer to `knexfile.js` for other configuration

## Tests
1. Make sure dependencies are installed
2. Run `npm test`

### Test stack
- `node:test` — built-in test runner (Node 20+)
- `expect` — standalone assertion library (Jest-style)
- `supertest` — HTTP-level integration testing
- `c8` — V8 coverage reporting

## License
[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0)
