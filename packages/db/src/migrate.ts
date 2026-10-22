import { migrate } from "drizzle-orm/postgres-js/migrator";
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

if (import.meta.url === `file://${process.argv[1]}`) {
  await runMigrations(requireEnv("MIGRATION_DATABASE_URL"));
  console.log("migrations applied");
}
