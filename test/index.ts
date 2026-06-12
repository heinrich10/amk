import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileMigrationProvider, Migrator, NO_MIGRATIONS } from 'kysely/migration';
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
  const { error } = await migrator.migrateToLatest();
  if (error) {
    throw new Error(error instanceof Error ? error.message : JSON.stringify(error));
  }
};

export const down = async () => {
  const { error } = await migrator.migrateTo(NO_MIGRATIONS);
  if (error) {
    throw new Error(error instanceof Error ? error.message : JSON.stringify(error));
  }
};

export const teardown = async () => {
  await db.destroy();
};
