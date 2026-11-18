import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inWorkspace } from "./client.ts";
import {
  aiUsage,
  businessIntake,
  businessReading,
  organization,
  project,
  rateLimitCounter,
  TENANT_TABLES,
} from "./schema/index.ts";
import {
  createTestDatabase,
  HAS_TEST_DATABASE,
  TEST_ROLE_LOCK,
  type TestDatabase,
} from "./testing/database.ts";

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
  // ORV-283 (tech notes section 5.2, T9 and T10): the saved reading of an intake is workspace data.
  // The app role adds and reads the rows of its workspace and can neither change nor delete one;
  // the database holds the record's shape and the one reading per intake and job.
  describe("business_reading", () => {
    const base = (id: string, workspaceId: string, intakeId: string) => ({
      id,
      workspaceId,
      intakeId,
      job: "business-read",
      method: "rule-based",
      reason: "ai-failed",
      createdBy: "u-1",
    });
    const model = {
      method: "model",
      reason: null,
      modelId: "test/model",
      adapterId: "business-read",
      adapterVersion: "1",
      promptVersion: "business-prompt-1",
    };
    const intake = (id: string, workspaceId: string, projectId: string) => ({
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
        .values([
          intake("br-i-a", "ws-a", "p-a"),
          intake("br-i-a2", "ws-a", "p-a"),
          intake("br-i-a3", "ws-a", "p-a"),
          intake("br-i-b", "ws-b", "p-b"),
        ]);
      await t.admin
        .insert(businessReading)
        .values([base("br-a", "ws-a", "br-i-a"), base("br-b", "ws-b", "br-i-b")]);
    });

    const failsWithCode = async (run: Promise<unknown>, code: string) => {
      const error = await run.then(
        () => null,
        (e: unknown) => e,
      );
      expect((error as { cause?: { code?: string } } | null)?.cause?.code).toBe(code);
    };

    it("is a tenant table with row security and the workspace policy (T9)", () => {
      expect(TENANT_TABLES).toContain("business_reading");
    });

    it("shows a scoped transaction only its own workspace's rows (T9)", async () => {
      const rows = await inWorkspace(t.app, "ws-a", (tx) => tx.select().from(businessReading));
      expect(rows.map((r) => r.id)).toEqual(["br-a"]);
      expect(await t.app.select().from(businessReading)).toEqual([]);
    });

    it("inserts for the scoped workspace and refuses an insert for another (T9)", async () => {
      await inWorkspace(t.app, "ws-a", (tx) =>
        tx.insert(businessReading).values({ ...base("br-a2", "ws-a", "br-i-a2"), ...model }),
      );
      // Another job, so that the one-per-job rule cannot be what refuses it: only the policy can.
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx
            .insert(businessReading)
            .values({ ...base("br-x", "ws-b", "br-i-b"), job: "other-job" }),
        ),
        "42501",
      );
    });

    it("refuses a reading whose intake sits in another workspace (T9)", async () => {
      // The owner role skips row security, so only the composite foreign key can refuse this.
      await failsWithCode(
        t.admin
          .insert(businessReading)
          .values({ ...base("br-cross", "ws-a", "br-i-b"), job: "cross-job" }),
        "23503",
      );
    });

    it("keeps one reading per intake and job (T40)", async () => {
      await failsWithCode(
        t.admin.insert(businessReading).values(base("br-twice", "ws-a", "br-i-a")),
        "23505",
      );
      // Another job on the same intake is another row.
      await t.admin
        .insert(businessReading)
        .values({ ...base("br-job", "ws-a", "br-i-a"), job: "other-job" });
    });

    it.each([
      ["an empty job", { job: "" }],
      ["a job past 40 characters", { job: "j".repeat(41) }],
      ["a method outside the list", { method: "guess" }],
      ["a reason outside the list", { reason: "ai-tired" }],
      ["a model record with a reason", { ...model, reason: "ai-failed" }],
      ["a model record with no model id", { ...model, modelId: null }],
      ["a model record with no adapter id", { ...model, adapterId: null }],
      ["a model record with no adapter version", { ...model, adapterVersion: null }],
      ["a model record with no prompt version", { ...model, promptVersion: null }],
      ["an empty model id", { ...model, modelId: "" }],
      ["a model id past 200 characters", { ...model, modelId: "m".repeat(201) }],
      ["an adapter id past 40 characters", { ...model, adapterId: "a".repeat(41) }],
      ["an empty adapter id", { ...model, adapterId: "" }],
      ["an adapter version past 40 characters", { ...model, adapterVersion: "v".repeat(41) }],
      ["an empty adapter version", { ...model, adapterVersion: "" }],
      ["a prompt version past 40 characters", { ...model, promptVersion: "p".repeat(41) }],
      ["an empty prompt version", { ...model, promptVersion: "" }],
      [
        "a rule-based record that has the model's columns and no reason",
        { ...model, method: "rule-based" },
      ],
      ["a rule-based record with evidence", { evidence: [{ id: "x" }] }],
    ])("refuses %s (T9)", async (_, change) => {
      await failsWithCode(
        t.admin.insert(businessReading).values({ ...base("br-bad", "ws-a", "br-i-a3"), ...change }),
        "23514",
      );
    });

    it.each(["ai-not-configured", "ai-failed", "ai-rate-limited", "ai-spend-cap"])(
      "keeps a rule-based record with the reason %s (T9)",
      async (reason) => {
        await t.admin
          .insert(businessReading)
          .values({ ...base(`br-${reason}`, "ws-a", "br-i-a2"), job: `reason-${reason}`, reason });
        const [row] = await t.admin
          .select()
          .from(businessReading)
          .where(eq(businessReading.id, `br-${reason}`));
        expect(row?.reason).toBe(reason);
      },
    );

    it("keeps a model record at the longest bounds and the evidence as it was written (T9)", async () => {
      const evidence = [{ id: "x", text: "ก".repeat(3) }];
      await t.admin.insert(businessReading).values({
        ...base("br-max", "ws-a", "br-i-a3"),
        ...model,
        modelId: "m".repeat(200),
        adapterId: "a".repeat(40),
        adapterVersion: "v".repeat(40),
        promptVersion: "p".repeat(40),
        evidence,
      });
      const [row] = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.id, "br-max"));
      expect([row?.modelId?.length, row?.evidence]).toEqual([200, evidence]);
    });

    it("gives a rule-based record an empty evidence list by default (T9)", async () => {
      const [row] = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.id, "br-a"));
      expect(row?.evidence).toEqual([]);
    });

    it("business rows never change: refuses an update and a delete, even in its own workspace (T10)", async () => {
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx
            .update(businessReading)
            .set({ reason: "ai-not-configured" })
            .where(eq(businessReading.id, "br-a")),
        ),
        "42501",
      );
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.delete(businessReading).where(eq(businessReading.id, "br-a")),
        ),
        "42501",
      );
      const kept = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.id, "br-a"));
      expect(kept.map((r) => r.reason)).toEqual(["ai-failed"]);
    });

    it("has row security on and only the owner and the app role as grantees (T9, T10)", async () => {
      const on = await t.admin.execute<{ relrowsecurity: boolean }>(
        sql`select relrowsecurity from pg_class where relname = 'business_reading'`,
      );
      expect([...on].map((r) => r.relrowsecurity)).toEqual([true]);
      const grants = await t.admin.execute<{ grantee: string; privilege_type: string }>(
        sql`select grantee, privilege_type from information_schema.role_table_grants
            where table_name = 'business_reading' and table_schema = 'public'
              and grantee <> current_user`,
      );
      const rows = [...grants];
      expect([...new Set(rows.map((r) => r.grantee))]).toEqual(["orivilo_app"]);
      expect(rows.map((r) => r.privilege_type).sort()).toEqual(["INSERT", "SELECT"]);
    });

    it("goes away with its intake, by the cascade (T9)", async () => {
      await t.admin.insert(project).values({ id: "p-r", workspaceId: "ws-a", name: "R project" });
      await t.admin.insert(businessIntake).values(intake("br-i-r", "ws-a", "p-r"));
      await t.admin.insert(businessReading).values(base("br-r", "ws-a", "br-i-r"));
      await t.admin.delete(project).where(eq(project.id, "p-r"));
      expect(
        await t.admin.select().from(businessReading).where(eq(businessReading.id, "br-r")),
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

// ORV-283: a host may grant new tables to PUBLIC and to its own roles by default privileges (Supabase
// does, to `anon`, `authenticated` and `service_role`). The access migrations of the business tables
// revoke all of it, so the only grantees of a business table are the owner and the app role.
describe.runIf(HAS_TEST_DATABASE)("business tables under the host's default privileges", () => {
  let t: TestDatabase;
  const HOST_ROLES = ["anon", "authenticated", "service_role"];

  beforeAll(async () => {
    t = await createTestDatabase({
      async beforeMigrations(database, cluster) {
        await cluster.begin(async (tx) => {
          await tx`select pg_advisory_xact_lock(${TEST_ROLE_LOCK})`;
          for (const role of HOST_ROLES) {
            await tx.unsafe(`do $$ begin
              if not exists (select from pg_roles where rolname = '${role}') then
                create role ${role} nologin;
              end if;
            end $$`);
          }
        });
        await database.unsafe(
          `alter default privileges in schema public grant all on tables to public, ${HOST_ROLES.join(", ")}`,
        );
      },
    });
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  it.each(["business_intake", "business_reading"])(
    "leaves %s to the owner and the app role only",
    async (table) => {
      const grants = await t.admin.execute<{ grantee: string }>(
        sql`select grantee from information_schema.role_table_grants
            where table_name = ${table} and table_schema = 'public' and grantee <> current_user`,
      );
      expect([...new Set([...grants].map((r) => r.grantee))]).toEqual(["orivilo_app"]);
    },
  );

  it("does hand the host's default privileges to a table its migration does not revoke", async () => {
    // The control: without a revoke, the same defaults reach the table, so the test above can fail.
    const grants = await t.admin.execute<{ grantee: string }>(
      sql`select grantee from information_schema.role_table_grants
          where table_name = 'project' and table_schema = 'public' and grantee <> current_user`,
    );
    expect([...new Set([...grants].map((r) => r.grantee))]).toEqual(
      expect.arrayContaining(["PUBLIC", "anon", "authenticated", "service_role"]),
    );
  });
});
