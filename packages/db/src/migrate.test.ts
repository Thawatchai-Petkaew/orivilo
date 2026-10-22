import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { runMigrations } from "./migrate.ts";
import { HAS_TEST_DATABASE, TEST_DATABASE_URL } from "./testing/database.ts";

// Hosted Postgres (Supabase) runs migrations as an owner that is not a superuser. The first run
// against staging failed because 0001 named SUPERUSER, which only a superuser may do. This test
// migrates a fresh database as an owner with the same attributes as Supabase's postgres role.
describe.runIf(HAS_TEST_DATABASE)("migrations as a hosted owner", () => {
  it("apply without superuser rights and leave row security on", async () => {
    if (!TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
    const root = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
    const suffix = randomBytes(4).toString("hex");
    const owner = `hosted_owner_${suffix}`;
    const name = `orivilo_hosted_${suffix}`;
    try {
      // The owner creates orivilo_app itself on Supabase, so it holds admin rights on that role.
      await root.unsafe(`
        DO $$ BEGIN
          CREATE ROLE orivilo_app NOLOGIN;
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
      await root.unsafe(
        `create role ${owner} login createdb createrole bypassrls nosuperuser password 'hosted'`,
      );
      await root.unsafe(`grant orivilo_app to ${owner} with admin option`);
      await root.unsafe(`create database ${name} owner ${owner}`);
      const u = new URL(TEST_DATABASE_URL);
      u.pathname = `/${name}`;
      const asRoot = postgres(u.toString(), { max: 1, onnotice: () => {} });
      await asRoot.unsafe(`alter schema public owner to ${owner}`);
      await asRoot.end();
      u.username = owner;
      u.password = "hosted";

      await expect(runMigrations(u.toString())).resolves.toBeUndefined();

      const db = postgres(u.toString(), { max: 1, onnotice: () => {} });
      const open = await db`select tablename from pg_tables
        where schemaname = 'public' and not rowsecurity`;
      await db.end();
      expect(open).toEqual([]);
    } finally {
      await root.unsafe(`drop database if exists ${name} with (force)`);
      await root.unsafe(`drop role if exists ${owner}`);
      await root.end();
    }
  }, 60_000);
});
