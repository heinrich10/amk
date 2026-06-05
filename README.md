# AMK

sample backend using express.js, knex.js, and amk plugins

## Pre-requisites
- Node.js 20+

## How to run
1. Install dependencies: `npm install`
2. Create a `.env` file with the required environment variables (see `config/config.mjs` for available options)
3. Run the app: `npm start`
4. Call the API endpoint: `curl http://localhost:3000/persons`

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
