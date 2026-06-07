import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { db } from '../src/lib/kysely.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs: await import('node:fs/promises'),
    path: await import('node:path'),
    migrationFolder: path.join(__dirname, '../migrations'),
  }),
});

export const up = async () => {
  await migrator.migrateToLatest();
};

export const down = async () => {
  await migrator.migrateTo('no_migrations');
};

export const teardown = async () => {
  await db.destroy();
};
