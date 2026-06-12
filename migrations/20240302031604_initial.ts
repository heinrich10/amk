import { Kysely, sql } from 'kysely';
import { DB } from '../src/db-schema.js';

export async function up(db: Kysely<DB>): Promise<void> {
  await db.schema
    .createTable('continents')
    .addColumn('code', 'varchar', (col) => col.primaryKey())
    .addColumn('name', 'varchar')
    .execute();

  await db.schema
    .createTable('countries')
    .addColumn('code', 'varchar', (col) => col.primaryKey())
    .addColumn('name', 'varchar')
    .addColumn('phone', 'integer')
    .addColumn('symbol', 'varchar')
    .addColumn('capital', 'varchar')
    .addColumn('currency', 'varchar')
    .addColumn('continent_code', 'varchar', (col) => col.references('continents.code'))
    .addColumn('alpha_3', 'varchar')
    .execute();

  await db.schema
    .createTable('persons')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('first_name', 'varchar')
    .addColumn('last_name', 'varchar')
    .addColumn('country_code', 'varchar', (col) => col.references('countries.code'))
    .execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
  await db.schema.dropTable('persons').execute();
  await db.schema.dropTable('countries').execute();
  await db.schema.dropTable('continents').execute();
}
