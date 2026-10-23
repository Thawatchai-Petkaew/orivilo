import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { createDb, type Db } from "../client.ts";
import { runMigrations } from "../migrate.ts";

/**
 * A throwaway database for integration tests: created from `TEST_DATABASE_URL` (a superuser on a
 * local or CI Postgres, never the owner's project), migrated, with `orivilo_app` able to log in.
 * CI sets `REQUIRE_DB_TESTS=1`, so a missing database fails there instead of skipping.
 */
export const TEST_DATABASE_URL = process.env["TEST_DATABASE_URL"];
export const HAS_TEST_DATABASE = (() => {
  if (TEST_DATABASE_URL) return true;
  if (process.env["REQUIRE_DB_TESTS"] === "1")
    throw new Error("REQUIRE_DB_TESTS=1 but TEST_DATABASE_URL is not set");
  return false;
})();

export interface TestDatabase {
  /** The owner role, for seeding across workspaces. */
  admin: Db;
  /** The app role, as production connects. */
  app: Db;
  appUrl: string;
  drop(): Promise<void>;
}

/** Any fixed key; it only has to be the same for every test run on the server. */
const ROLE_LOCK = 380_380;

const withDatabase = (url: string, name: string) => {
  const u = new URL(url);
  u.pathname = `/${name}`;
  return u;
};

export async function createTestDatabase(): Promise<TestDatabase> {
  if (!TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
  const name = `orivilo_test_${randomBytes(4).toString("hex")}`;
  const root = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
  await root.unsafe(`create database ${name}`);
  const adminUrl = withDatabase(TEST_DATABASE_URL, name).toString();
  // Roles live on the server, not in a database. Two fresh migrations racing to create
  // `orivilo_app` can both pass the migration's "if not exists" check, and the loser fails on
  // pg_authid's unique index (not `duplicate_object`). Create it here first, one run at a time,
  // so the migration always finds it.
  await root.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${ROLE_LOCK})`;
    await tx.unsafe(`do $$ begin
      if not exists (select from pg_roles where rolname = 'orivilo_app') then
        create role orivilo_app nologin nobypassrls nocreatedb nocreaterole;
      end if;
    end $$`);
  });
  await runMigrations(adminUrl);
  // The role is shared by every test database on the server, and test files run in parallel, so
  // every run sets the same test-only password, one at a time: two concurrent ALTER ROLE
  // statements on one role fail with "tuple concurrently updated".
  const password = "orivilo_app_test";
  await root.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${ROLE_LOCK})`;
    await tx.unsafe(`alter role orivilo_app login password '${password}'`);
  });
  const app = withDatabase(TEST_DATABASE_URL, name);
  app.username = "orivilo_app";
  app.password = password;
  const admin = createDb(adminUrl);
  const appDb = createDb(app.toString());
  return {
    admin,
    app: appDb,
    appUrl: app.toString(),
    async drop() {
      await appDb.$client.end();
      await admin.$client.end();
      await root.unsafe(`drop database if exists ${name} with (force)`);
      await root.end();
    },
  };
}
