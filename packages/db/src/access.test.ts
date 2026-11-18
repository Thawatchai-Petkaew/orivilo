import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inWorkspace } from "./client.ts";
import {
  aiUsage,
  businessIntake,
  organization,
  project,
  rateLimitCounter,
  TENANT_TABLES,
} from "./schema/index.ts";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "./testing/database.ts";

// ORV-38 AC 5 and 6: the second wall. Even if code skipped the authorization helper, the app
// role sees one workspace's rows at most, and cannot change the schema or escape its role.
describe.runIf(HAS_TEST_DATABASE)("orivilo_app and row security", () => {
  let t: TestDatabase;

  beforeAll(async () => {
    t = await createTestDatabase();
    const now = new Date();
    await t.admin.insert(organization).values([
      { id: "ws-a", name: "A", slug: "a", createdAt: now },
      { id: "ws-b", name: "B", slug: "b", createdAt: now },
    ]);
    await t.admin.insert(project).values([
      { id: "p-a", workspaceId: "ws-a", name: "A project" },
      { id: "p-b", workspaceId: "ws-b", name: "B project" },
    ]);
  }, 60_000);

  afterAll(async () => {
    await t?.drop();
  });

  it("sees only the workspace set for the transaction", async () => {
    const rows = await inWorkspace(t.app, "ws-a", (tx) => tx.select().from(project));
    expect(rows.map((r) => r.id)).toEqual(["p-a"]);
    const other = await inWorkspace(t.app, "ws-a", (tx) =>
      tx.select().from(project).where(eq(project.workspaceId, "ws-b")),
    );
    expect(other).toEqual([]);
  });

  it("sees nothing without a workspace, and the setting does not outlive its transaction", async () => {
    expect(await t.app.select().from(project)).toEqual([]);
    await inWorkspace(t.app, "ws-a", async () => undefined);
    expect(await t.app.select().from(project)).toEqual([]);
  });

  it("cannot write into another workspace", async () => {
    await expect(
      inWorkspace(t.app, "ws-a", (tx) =>
        tx.insert(project).values({ id: "p-x", workspaceId: "ws-b", name: "x" }),
      ),
    ).rejects.toThrow();
    const moved = await inWorkspace(t.app, "ws-a", (tx) =>
      tx.update(project).set({ name: "y" }).where(eq(project.id, "p-b")).returning(),
    );
    expect(moved).toEqual([]);
  });

  it.each([
    ["create a table", sql`create table intruder (id int)`],
    ["turn row security off", sql`alter table project disable row level security`],
    ["drop a policy", sql`drop policy workspace_rows on project`],
    ["become the owner", sql`set role postgres`],
    ["create a role", sql`create role intruder`],
  ])("cannot %s", async (_, statement) => {
    await expect(t.app.execute(statement)).rejects.toThrow();
  });

  it("has row security on every table in public", async () => {
    const rows = await t.admin.execute<{ relname: string }>(
      sql`select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
          and relname <> '__drizzle_migrations'`,
    );
    expect([...rows].map((r) => r.relname)).toEqual([]);
  });
  it("limits every tenant table to the workspace set for the transaction", async () => {
    const rows = await t.admin.execute<{ tablename: string }>(
      sql`select tablename from pg_policies
          where schemaname = 'public' and policyname = 'workspace_rows'
            and roles = '{orivilo_app}'
            and qual = '(workspace_id = current_setting(''app.workspace_id''::text, true))'`,
    );
    expect([...rows].map((r) => r.tablename).sort()).toEqual([...TENANT_TABLES].sort());
  });
  // ORV-121 row 13: AI usage records are workspace data. The app role adds and reads the rows of
  // the workspace it is scoped to, and can neither change nor delete one.
  describe("ai_usage", () => {
    const record = (id: string, workspaceId: string) => ({
      id,
      workspaceId,
      userId: "u-1",
      job: "interpret",
      model: "test/model",
      costMicroUsd: 14_000,
      createdAt: new Date("2026-10-15T00:00:00Z"),
    });

    beforeAll(async () => {
      await t.admin.insert(aiUsage).values([record("u-a", "ws-a"), record("u-b", "ws-b")]);
    });

    it("shows a scoped transaction only its own workspace's records", async () => {
      const rows = await inWorkspace(t.app, "ws-a", (tx) => tx.select().from(aiUsage));
      expect(rows.map((r) => r.id)).toEqual(["u-a"]);
      const other = await inWorkspace(t.app, "ws-a", (tx) =>
        tx.select().from(aiUsage).where(eq(aiUsage.workspaceId, "ws-b")),
      );
      expect(other).toEqual([]);
      expect(await t.app.select().from(aiUsage)).toEqual([]);
    });

    it("inserts for the scoped workspace and refuses an insert for another", async () => {
      await inWorkspace(t.app, "ws-a", (tx) =>
        tx.insert(aiUsage).values({ ...record("u-a2", "ws-a"), costMicroUsd: null }),
      );
      const rows = await inWorkspace(t.app, "ws-a", (tx) =>
        tx.select().from(aiUsage).where(eq(aiUsage.id, "u-a2")),
      );
      expect(rows.map((r) => [r.currency, r.costMicroUsd])).toEqual([["USD", null]]);
      await expect(
        inWorkspace(t.app, "ws-a", (tx) => tx.insert(aiUsage).values(record("u-x", "ws-b"))),
      ).rejects.toThrow();
    });

    it("refuses a negative amount and a currency other than USD", async () => {
      await expect(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.insert(aiUsage).values({ ...record("u-neg", "ws-a"), costMicroUsd: -1 }),
        ),
      ).rejects.toThrow();
      await expect(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.insert(aiUsage).values({ ...record("u-eur", "ws-a"), currency: "EUR" }),
        ),
      ).rejects.toThrow();
    });

    // drizzle wraps the driver error; the cause carries Postgres' code 42501 (insufficient privilege).
    const refusedByGrant = async (run: Promise<unknown>) => {
      const error = await run.then(
        () => null,
        (e: unknown) => e,
      );
      expect((error as { cause?: { code?: string } } | null)?.cause?.code).toBe("42501");
    };

    it("refuses an update and a delete, even of its own workspace's record", async () => {
      await refusedByGrant(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.update(aiUsage).set({ costMicroUsd: 0 }).where(eq(aiUsage.id, "u-a")),
        ),
      );
      await refusedByGrant(
        inWorkspace(t.app, "ws-a", (tx) => tx.delete(aiUsage).where(eq(aiUsage.id, "u-a"))),
      );
      const kept = await t.admin.select().from(aiUsage).where(eq(aiUsage.id, "u-a"));
      expect(kept.map((r) => r.costMicroUsd)).toEqual([14_000]);
    });

    it("has row security on and only the owner and the app role as grantees", async () => {
      const on = await t.admin.execute<{ relrowsecurity: boolean }>(
        sql`select relrowsecurity from pg_class where relname = 'ai_usage'`,
      );
      expect([...on].map((r) => r.relrowsecurity)).toEqual([true]);
      const grants = await t.admin.execute<{ grantee: string; privilege_type: string }>(
        sql`select grantee, privilege_type from information_schema.role_table_grants
            where table_name = 'ai_usage' and table_schema = 'public'
              and grantee <> current_user`,
      );
      const rows = [...grants];
      expect([...new Set(rows.map((r) => r.grantee))]).toEqual(["orivilo_app"]);
      expect(rows.map((r) => r.privilege_type).sort()).toEqual(["INSERT", "SELECT"]);
    });

    it("is removed with its workspace, by the cascade, when the app role deletes the workspace", async () => {
      await t.admin.insert(organization).values({
        id: "ws-c",
        name: "C",
        slug: "c",
        createdAt: new Date(),
      });
      await t.admin.insert(aiUsage).values(record("u-c", "ws-c"));
      // orivilo_app holds DELETE on the auth tables (migration 0001), not on ai_usage.
      await t.app.delete(organization).where(eq(organization.id, "ws-c"));
      const left = await t.admin.select().from(aiUsage).where(eq(aiUsage.workspaceId, "ws-c"));
      expect(left).toEqual([]);
    });
  });
  // ORV-281 rows 9, 13 and 17: what a person told ORIVILO about their business is workspace data.
  // The app role adds and reads the rows of the workspace it is scoped to, and can neither change
  // nor delete one; the database holds the same bounds as the engine's intake check.
  describe("business_intake", () => {
    const answers = (id: string, workspaceId: string, projectId: string) => ({
      id,
      workspaceId,
      projectId,
      version: "intake-1",
      idea: "ร้านกาแฟคั่วเอง",
      createdBy: "u-1",
    });

    beforeAll(async () => {
      await t.admin
        .insert(businessIntake)
        .values([answers("bi-a", "ws-a", "p-a"), answers("bi-b", "ws-b", "p-b")]);
    });

    // drizzle wraps the driver error; the cause carries Postgres' error code.
    const failsWithCode = async (run: Promise<unknown>, code: string) => {
      const error = await run.then(
        () => null,
        (e: unknown) => e,
      );
      expect((error as { cause?: { code?: string } } | null)?.cause?.code).toBe(code);
    };

    it("shows a scoped transaction only its own workspace's rows", async () => {
      const rows = await inWorkspace(t.app, "ws-a", (tx) => tx.select().from(businessIntake));
      expect(rows.map((r) => r.id)).toEqual(["bi-a"]);
      const other = await inWorkspace(t.app, "ws-a", (tx) =>
        tx.select().from(businessIntake).where(eq(businessIntake.workspaceId, "ws-b")),
      );
      expect(other).toEqual([]);
      expect(await t.app.select().from(businessIntake)).toEqual([]);
    });

    it("inserts for the scoped workspace and refuses an insert for another", async () => {
      await inWorkspace(t.app, "ws-a", (tx) =>
        tx.insert(businessIntake).values({ ...answers("bi-a2", "ws-a", "p-a"), website: null }),
      );
      await expect(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.insert(businessIntake).values(answers("bi-x", "ws-b", "p-b")),
        ),
      ).rejects.toThrow();
    });

    it("refuses an intake whose project sits in another workspace", async () => {
      // The owner role skips row security, so only the composite foreign key can refuse this.
      await failsWithCode(
        t.admin.insert(businessIntake).values(answers("bi-cross", "ws-a", "p-b")),
        "23503",
      );
    });

    it.each([
      ["a version other than intake-1", { version: "intake-2" }],
      ["an empty idea", { idea: "" }],
      ["an idea past 2,000 characters", { idea: "ก".repeat(2001) }],
      ["an empty industry", { industry: "" }],
      ["an industry past 2,000 characters", { industry: "x".repeat(2001) }],
      ["a customers answer past 2,000 characters", { customers: "x".repeat(2001) }],
      ["a problem past 2,000 characters", { problem: "x".repeat(2001) }],
      ["a competitors answer past 2,000 characters", { competitors: "x".repeat(2001) }],
      ["a value answer past 2,000 characters", { value: "x".repeat(2001) }],
      ["an empty website", { website: "" }],
      ["a website past 2,048 characters", { website: "https://a.example/" + "x".repeat(2031) }],
    ])("refuses %s", async (_, change) => {
      await failsWithCode(
        t.admin.insert(businessIntake).values({ ...answers("bi-bad", "ws-a", "p-a"), ...change }),
        "23514",
      );
    });

    it("keeps an idea of 2,000 characters and a website of 2,048", async () => {
      await t.admin.insert(businessIntake).values({
        ...answers("bi-max", "ws-a", "p-a"),
        idea: "ก".repeat(2000),
        website: "https://a.example/" + "x".repeat(2030),
      });
      const [row] = await t.admin
        .select()
        .from(businessIntake)
        .where(eq(businessIntake.id, "bi-max"));
      expect([row?.idea.length, row?.website?.length]).toEqual([2000, 2048]);
    });

    it("refuses a project name of no characters or of more than 120", async () => {
      await failsWithCode(
        t.admin.insert(project).values({ id: "p-empty", workspaceId: "ws-a", name: "" }),
        "23514",
      );
      await failsWithCode(
        t.admin
          .insert(project)
          .values({ id: "p-long", workspaceId: "ws-a", name: "ก".repeat(121) }),
        "23514",
      );
      await t.admin
        .insert(project)
        .values({ id: "p-120", workspaceId: "ws-a", name: "ก".repeat(120) });
    });

    it("business rows never change: refuses an update and a delete, even in its own workspace", async () => {
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.update(businessIntake).set({ idea: "changed" }).where(eq(businessIntake.id, "bi-a")),
        ),
        "42501",
      );
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.delete(businessIntake).where(eq(businessIntake.id, "bi-a")),
        ),
        "42501",
      );
      const kept = await t.admin.select().from(businessIntake).where(eq(businessIntake.id, "bi-a"));
      expect(kept.map((r) => r.idea)).toEqual(["ร้านกาแฟคั่วเอง"]);
    });

    it("has row security on and only the owner and the app role as grantees", async () => {
      const on = await t.admin.execute<{ relrowsecurity: boolean }>(
        sql`select relrowsecurity from pg_class where relname = 'business_intake'`,
      );
      expect([...on].map((r) => r.relrowsecurity)).toEqual([true]);
      const grants = await t.admin.execute<{ grantee: string; privilege_type: string }>(
        sql`select grantee, privilege_type from information_schema.role_table_grants
            where table_name = 'business_intake' and table_schema = 'public'
              and grantee <> current_user`,
      );
      const rows = [...grants];
      expect([...new Set(rows.map((r) => r.grantee))]).toEqual(["orivilo_app"]);
      expect(rows.map((r) => r.privilege_type).sort()).toEqual(["INSERT", "SELECT"]);
    });

    it("goes away with its project, by the cascade", async () => {
      await t.admin.insert(project).values({ id: "p-d", workspaceId: "ws-a", name: "D project" });
      await t.admin.insert(businessIntake).values(answers("bi-d", "ws-a", "p-d"));
      await t.admin.delete(project).where(eq(project.id, "p-d"));
      expect(
        await t.admin.select().from(businessIntake).where(eq(businessIntake.id, "bi-d")),
      ).toEqual([]);
    });
  });
  // ORV-112 AC 18: the counter table is the app role's to use and nobody else's.
  describe("rate_limit_counter", () => {
    it("lets the app role select, insert, update and delete", async () => {
      const row = { key: "t:u:x", windowStart: 0, windowEnd: 60, count: 1 };
      await t.app.insert(rateLimitCounter).values(row);
      await t.app
        .update(rateLimitCounter)
        .set({ count: 2 })
        .where(eq(rateLimitCounter.key, "t:u:x"));
      const rows = await t.app
        .select()
        .from(rateLimitCounter)
        .where(eq(rateLimitCounter.key, "t:u:x"));
      expect(rows.map((r) => r.count)).toEqual([2]);
      await t.app.delete(rateLimitCounter).where(eq(rateLimitCounter.key, "t:u:x"));
      expect(await t.app.select().from(rateLimitCounter)).toEqual([]);
    });

    it("cannot be altered by the app role", async () => {
      await expect(
        t.app.execute(sql`alter table rate_limit_counter add column x int`),
      ).rejects.toThrow();
    });

    it("has row security on and only the owner and the app role as grantees", async () => {
      const on = await t.admin.execute<{ relrowsecurity: boolean }>(
        sql`select relrowsecurity from pg_class where relname = 'rate_limit_counter'`,
      );
      expect([...on].map((r) => r.relrowsecurity)).toEqual([true]);
      const grantees = await t.admin.execute<{ grantee: string }>(
        sql`select distinct grantee from information_schema.role_table_grants
            where table_name = 'rate_limit_counter' and table_schema = 'public'`,
      );
      const names = [...grantees].map((r) => r.grantee).sort();
      expect(names).toHaveLength(2);
      expect(names).toContain("orivilo_app");
      expect(names).not.toContain("PUBLIC");
    });
  });
});
