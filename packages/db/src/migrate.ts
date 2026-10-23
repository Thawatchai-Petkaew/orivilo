import { migrate } from "drizzle-orm/postgres-js/migrator";
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "./client.ts";
import { requireEnv } from "./env.ts";

export const MIGRATIONS = fileURLToPath(new URL("../migrations", import.meta.url));

/** Applies every migration as the owner role. Never run with the app's `DATABASE_URL`. */
export async function runMigrations(url: string) {
  const db = createDb(url);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS });
  } finally {
    await db.$client.end();
  }
}

/**
 * True when `moduleUrl` is the script node was started with. Compares file paths, not strings:
 * `import.meta.url` is URL-encoded, so a repo path with a space (`My Work`) never matched the
 * raw `file://${argv[1]}` and the script exited without migrating (ORV-73). Node resolves symlinks
 * in `import.meta.url`, so argv is resolved the same way.
 */
export function isEntry(moduleUrl: string, argv1: string | undefined): boolean {
  if (argv1 === undefined) return false;
  const started = path.resolve(argv1);
  let real = started;
  try {
    real = realpathSync(started);
  } catch {
    // A path that does not exist on disk is compared as given.
  }
  return fileURLToPath(moduleUrl) === real;
}

if (isEntry(import.meta.url, process.argv[1])) {
  await runMigrations(requireEnv("MIGRATION_DATABASE_URL"));
  console.log("migrations applied");
}
