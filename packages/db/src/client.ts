import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "./env.ts";
import * as schema from "./schema/index.ts";

/**
 * The database client. Only the authorization helper (`@orivilo/auth`) may import this module;
 * a lint rule keeps everything else out (ADR 0002).
 */
export function createDb(url: string) {
  // The transaction pooler cannot keep prepared statements across connections.
  return drizzle(postgres(url, { prepare: false, max: 5 }), { schema });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

let shared: Db | undefined;

/** The app's client, as `orivilo_app` through `DATABASE_URL`. */
export function appDb(): Db {
  shared ??= createDb(requireEnv("DATABASE_URL"));
  return shared;
}

/**
 * Runs `fn` in one transaction scoped to a workspace: row security on tenant tables sees only
 * that workspace. `set_config(..., true)` ends with the transaction, so the setting never
 * reaches the next request on a pooled connection.
 */
export function inWorkspace<T>(db: Db, workspaceId: string, fn: (tx: Tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`);
    return fn(tx);
  });
}
