// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './dbdev.sqlite3.db'
    }
  },

  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:'
    },
    pool: {
      min: 1,
      max: 1
    }
  },

};
