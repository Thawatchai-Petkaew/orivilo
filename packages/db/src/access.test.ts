import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inWorkspace } from "./client.ts";
import {
  aiUsage,
  businessFoundationEntry,
  businessIntake,
  businessPositioningChoice,
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

    // ORV-287 rows 10 to 13 (orv287-shape-1): the check holds what the app writes and nothing
    // else. Every refusal is the check violation on `business_reading_shape`, never another error.
    const failsOnShape = async (run: Promise<unknown>) => {
      const error = await run.then(
        () => null,
        (e: unknown) => e,
      );
      const cause = (error as { cause?: { code?: string; constraint_name?: string } } | null)
        ?.cause;
      expect([cause?.code, cause?.constraint_name]).toEqual(["23514", "business_reading_shape"]);
    };

    it("refuses a rule-based record with no reason (T9)", async () => {
      await failsOnShape(
        t.admin
          .insert(businessReading)
          .values({ ...base("br-shape-1", "ws-a", "br-i-a3"), reason: null }),
      );
    });

    it.each([
      ["model id", { modelId: "m" }],
      ["adapter id", { adapterId: "a" }],
      ["adapter version", { adapterVersion: "1" }],
      ["prompt version", { promptVersion: "p" }],
    ])("refuses a rule-based record that holds only its %s (T9)", async (_, change) => {
      await failsOnShape(
        t.admin
          .insert(businessReading)
          .values({ ...base("br-shape-2", "ws-a", "br-i-a3"), ...change }),
      );
    });

    it.each([
      ["an object", { x: 1 }],
      ["a string", "text"],
      ["a number", 1],
    ])("refuses a model record whose evidence is %s (T9)", async (_, evidence) => {
      await failsOnShape(
        t.admin
          .insert(businessReading)
          .values({ ...base("br-shape-3", "ws-a", "br-i-a3"), ...model, evidence }),
      );
    });

    const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `x${i}` }));

    it("refuses evidence past 200 items (T9)", async () => {
      await failsOnShape(
        t.admin.insert(businessReading).values({
          ...base("br-shape-4", "ws-a", "br-i-a3"),
          ...model,
          job: "evidence-201",
          evidence: items(201),
        }),
      );
    });

    it("keeps evidence of 200 items (T9)", async () => {
      await t.admin.insert(businessReading).values({
        ...base("br-shape-5", "ws-a", "br-i-a3"),
        ...model,
        job: "evidence-200",
        evidence: items(200),
      });
      const [row] = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.id, "br-shape-5"));
      expect(row?.evidence).toEqual(items(200));
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
  // ORV-285 (tech notes section 4.1, T5 and T6): the choice of a positioning statement is workspace
  // data, insert only. The database holds the row's shape and the one agreed choice per intake.
  describe("business_positioning_choice", () => {
    const intake = (id: string, workspaceId: string, projectId: string) => ({
      id,
      workspaceId,
      projectId,
      version: "intake-1",
      idea: "ร้านกาแฟคั่วเอง",
      createdBy: "u-1",
    });
    const written = (id: string, workspaceId: string, intakeId: string) => ({
      id,
      workspaceId,
      intakeId,
      kind: "written",
      statement: "กาแฟคั่วสดที่ส่งถึงออฟฟิศทุกเช้า",
      createdBy: "u-1",
    });
    const skipped = (id: string, workspaceId: string, intakeId: string) => ({
      id,
      workspaceId,
      intakeId,
      kind: "skipped",
      createdBy: "u-1",
    });

    beforeAll(async () => {
      await t.admin
        .insert(businessIntake)
        .values([
          intake("pc-i-a", "ws-a", "p-a"),
          intake("pc-i-a2", "ws-a", "p-a"),
          intake("pc-i-a3", "ws-a", "p-a"),
          intake("pc-i-b", "ws-b", "p-b"),
        ]);
      await t.admin
        .insert(businessPositioningChoice)
        .values([written("pc-a", "ws-a", "pc-i-a"), written("pc-b", "ws-b", "pc-i-b")]);
    });

    const failsWithCode = async (run: Promise<unknown>, code: string) => {
      const error = await run.then(
        () => null,
        (e: unknown) => e,
      );
      expect((error as { cause?: { code?: string } } | null)?.cause?.code).toBe(code);
    };

    it("is a tenant table, and a scoped transaction sees only its own workspace's rows (T5)", async () => {
      expect(TENANT_TABLES).toContain("business_positioning_choice");
      const rows = await inWorkspace(t.app, "ws-a", (tx) =>
        tx.select().from(businessPositioningChoice),
      );
      expect(rows.map((r) => r.id)).toEqual(["pc-a"]);
      expect(await t.app.select().from(businessPositioningChoice)).toEqual([]);
    });

    it("inserts for the scoped workspace and refuses an insert for another (T5)", async () => {
      await inWorkspace(t.app, "ws-a", (tx) =>
        tx.insert(businessPositioningChoice).values(skipped("pc-a-skip", "ws-a", "pc-i-a2")),
      );
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.insert(businessPositioningChoice).values(skipped("pc-x", "ws-b", "pc-i-b")),
        ),
        "42501",
      );
    });

    it("refuses a choice whose intake sits in another workspace (T5)", async () => {
      // The owner role skips row security, so only the composite foreign key can refuse this.
      await failsWithCode(
        t.admin.insert(businessPositioningChoice).values(skipped("pc-cross", "ws-a", "pc-i-b")),
        "23503",
      );
    });

    it("keeps one agreed choice per intake: a second written fails, skips repeat (T6)", async () => {
      await failsWithCode(
        t.admin.insert(businessPositioningChoice).values(written("pc-twice", "ws-a", "pc-i-a")),
        "23505",
      );
      // A skipped row on an agreed intake is still not a second agreement: only the kind counts.
      await t.admin
        .insert(businessPositioningChoice)
        .values([
          skipped("pc-s1", "ws-a", "pc-i-a3"),
          skipped("pc-s2", "ws-a", "pc-i-a3"),
          written("pc-after-skips", "ws-a", "pc-i-a3"),
        ]);
      const rows = await t.admin
        .select()
        .from(businessPositioningChoice)
        .where(eq(businessPositioningChoice.intakeId, "pc-i-a3"));
      expect(rows.map((r) => r.kind).sort()).toEqual(["skipped", "skipped", "written"]);
    });

    it.each([
      ["a skip with a statement", { ...skipped("pc-bad", "ws-a", "pc-i-a2"), statement: "x" }],
      [
        "a written choice with no statement",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), statement: null },
      ],
      [
        "a written choice with a draft id",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), draftId: "d-1", option: 1 },
      ],
      [
        "a picked choice with no draft id",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "picked", option: 1 },
      ],
      [
        "a picked choice with no option",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "picked", draftId: "d-1" },
      ],
      [
        "an edited choice with neither",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "edited" },
      ],
      ["a draft id without an option", { ...skipped("pc-bad", "ws-a", "pc-i-a2"), draftId: "d-1" }],
      ["a kind outside the list", { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "guessed" }],
      ["another kind outside the list", { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "other" }],
      ["an empty statement", { ...written("pc-bad", "ws-a", "pc-i-a2"), statement: "" }],
      [
        "a statement past 300 characters",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), statement: "ก".repeat(301) },
      ],
      [
        "an option past 3",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "picked", draftId: "d-1", option: 4 },
      ],
      [
        "an option of 0",
        { ...written("pc-bad", "ws-a", "pc-i-a2"), kind: "picked", draftId: "d-1", option: 0 },
      ],
    ])("refuses %s (T6)", async (_, row) => {
      await failsWithCode(t.admin.insert(businessPositioningChoice).values(row), "23514");
    });

    it("keeps a picked row of the right shape and a statement at 300 characters (T6)", async () => {
      await t.admin.insert(businessPositioningChoice).values({
        ...written("pc-picked", "ws-a", "pc-i-a2"),
        kind: "picked",
        draftId: "d-1",
        option: 3,
        statement: "ก".repeat(300),
      });
      const [row] = await t.admin
        .select()
        .from(businessPositioningChoice)
        .where(eq(businessPositioningChoice.id, "pc-picked"));
      expect([row?.kind, row?.option, row?.statement?.length]).toEqual(["picked", 3, 300]);
    });

    it("business rows never change: refuses an update and a delete, even in its own workspace (T5)", async () => {
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx
            .update(businessPositioningChoice)
            .set({ statement: "changed" })
            .where(eq(businessPositioningChoice.id, "pc-a")),
        ),
        "42501",
      );
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.delete(businessPositioningChoice).where(eq(businessPositioningChoice.id, "pc-a")),
        ),
        "42501",
      );
      const kept = await t.admin
        .select()
        .from(businessPositioningChoice)
        .where(eq(businessPositioningChoice.id, "pc-a"));
      expect(kept.map((r) => r.statement)).toEqual(["กาแฟคั่วสดที่ส่งถึงออฟฟิศทุกเช้า"]);
    });

    it("has row security on and only the owner and the app role as grantees (T5)", async () => {
      const on = await t.admin.execute<{ relrowsecurity: boolean }>(
        sql`select relrowsecurity from pg_class where relname = 'business_positioning_choice'`,
      );
      expect([...on].map((r) => r.relrowsecurity)).toEqual([true]);
      const policies = await t.admin.execute<{ policyname: string }>(
        sql`select policyname from pg_policies where tablename = 'business_positioning_choice'`,
      );
      expect([...policies].map((r) => r.policyname)).toEqual(["workspace_rows"]);
      const grants = await t.admin.execute<{ grantee: string; privilege_type: string }>(
        sql`select grantee, privilege_type from information_schema.role_table_grants
            where table_name = 'business_positioning_choice' and table_schema = 'public'
              and grantee <> current_user`,
      );
      const rows = [...grants];
      expect([...new Set(rows.map((r) => r.grantee))]).toEqual(["orivilo_app"]);
      expect(rows.map((r) => r.privilege_type).sort()).toEqual(["INSERT", "SELECT"]);
    });

    it("has the workspace index and the intake and time index (T5)", async () => {
      const found = await t.admin.execute<{ indexname: string }>(
        sql`select indexname from pg_indexes
            where tablename = 'business_positioning_choice' and indexname like '%idx'`,
      );
      expect([...found].map((r) => r.indexname).sort()).toEqual([
        "business_positioning_choice_intake_created_idx",
        "business_positioning_choice_workspaceId_idx",
      ]);
    });

    it("goes away with its intake, by the cascade (T5)", async () => {
      await t.admin.insert(project).values({ id: "p-pc", workspaceId: "ws-a", name: "PC project" });
      await t.admin.insert(businessIntake).values(intake("pc-i-r", "ws-a", "p-pc"));
      await t.admin.insert(businessPositioningChoice).values(written("pc-r", "ws-a", "pc-i-r"));
      await t.admin.delete(project).where(eq(project.id, "p-pc"));
      expect(
        await t.admin
          .select()
          .from(businessPositioningChoice)
          .where(eq(businessPositioningChoice.id, "pc-r")),
      ).toEqual([]);
    });
  });
  // ORV-291 (tech notes section 4.1, T9 and T10): what a person did on the four foundation nodes is
  // workspace data, insert only. The database holds the pairs, the payload shape, the text bounds
  // and the one entry per project, node and kind, so no direct call can pass a missed app check.
  describe("business_foundation_entry", () => {
    const entry = (
      id: string,
      workspaceId: string,
      projectId: string,
      node: string,
      kind: string,
      payload: unknown,
    ) => ({ id, workspaceId, projectId, node, kind, payload, createdBy: "u-1" });
    const given = (
      id: string,
      workspaceId: string,
      projectId: string,
      payload: unknown = { axes: { warm: 50 } },
    ) => entry(id, workspaceId, projectId, "identity-frame", "given", payload);
    const skipped = (id: string, workspaceId: string, projectId: string) =>
      entry(id, workspaceId, projectId, "identity-frame", "skipped", {});

    const failsWithCode = async (run: Promise<unknown>, code: string) => {
      const error = await run.then(
        () => null,
        (e: unknown) => e,
      );
      expect((error as { cause?: { code?: string } } | null)?.cause?.code).toBe(code);
    };
    // Each bad row is a project of its own, so one failure never masks another by the unique index.
    let n = 0;
    const freshProject = async () => {
      const id = `p-fe-${++n}`;
      await t.admin.insert(project).values({ id, workspaceId: "ws-a", name: `FE ${n}` });
      return id;
    };

    beforeAll(async () => {
      await t.admin
        .insert(businessFoundationEntry)
        .values([
          given("fe-a", "ws-a", "p-a", { axes: { warm: 75 }, person: "ใจดี" }),
          given("fe-b", "ws-b", "p-b", { axes: { warm: 25 } }),
        ]);
    });

    it("is a tenant table, and a scoped transaction sees only its own workspace's rows (T9)", async () => {
      expect(TENANT_TABLES).toContain("business_foundation_entry");
      const rows = await inWorkspace(t.app, "ws-a", (tx) =>
        tx.select().from(businessFoundationEntry),
      );
      expect(rows.map((r) => r.id)).toEqual(["fe-a"]);
      expect(await t.app.select().from(businessFoundationEntry)).toEqual([]);
    });

    it("inserts for the scoped workspace and refuses an insert for another (T9)", async () => {
      const mine = await freshProject();
      await inWorkspace(t.app, "ws-a", (tx) =>
        tx.insert(businessFoundationEntry).values(skipped("fe-own", "ws-a", mine)),
      );
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.insert(businessFoundationEntry).values(skipped("fe-x", "ws-b", "p-b")),
        ),
        "42501",
      );
    });

    it("refuses an entry whose project sits in another workspace (T10)", async () => {
      // The owner role skips row security, so only the composite foreign key can refuse this.
      await failsWithCode(
        t.admin.insert(businessFoundationEntry).values(skipped("fe-cross", "ws-a", "p-b")),
        "23503",
      );
    });

    it("rows never change: refuses an update and a delete, even in its own workspace (T9)", async () => {
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx
            .update(businessFoundationEntry)
            .set({ payload: {} })
            .where(eq(businessFoundationEntry.id, "fe-a")),
        ),
        "42501",
      );
      await failsWithCode(
        inWorkspace(t.app, "ws-a", (tx) =>
          tx.delete(businessFoundationEntry).where(eq(businessFoundationEntry.id, "fe-a")),
        ),
        "42501",
      );
      const kept = await t.admin
        .select()
        .from(businessFoundationEntry)
        .where(eq(businessFoundationEntry.id, "fe-a"));
      expect(kept.map((r) => r.payload)).toEqual([{ axes: { warm: 75 }, person: "ใจดี" }]);
    });

    it("has row security on and only the owner and the app role as grantees (T9)", async () => {
      const on = await t.admin.execute<{ relrowsecurity: boolean }>(
        sql`select relrowsecurity from pg_class where relname = 'business_foundation_entry'`,
      );
      expect([...on].map((r) => r.relrowsecurity)).toEqual([true]);
      const policies = await t.admin.execute<{ policyname: string }>(
        sql`select policyname from pg_policies where tablename = 'business_foundation_entry'`,
      );
      expect([...policies].map((r) => r.policyname)).toEqual(["workspace_rows"]);
      const grants = await t.admin.execute<{ grantee: string; privilege_type: string }>(
        sql`select grantee, privilege_type from information_schema.role_table_grants
            where table_name = 'business_foundation_entry' and table_schema = 'public'
              and grantee <> current_user`,
      );
      const rows = [...grants];
      expect([...new Set(rows.map((r) => r.grantee))]).toEqual(["orivilo_app"]);
      expect(rows.map((r) => r.privilege_type).sort()).toEqual(["INSERT", "SELECT"]);
    });

    it("has the workspace index and the project and time index (T9)", async () => {
      const found = await t.admin.execute<{ indexname: string }>(
        sql`select indexname from pg_indexes
            where tablename = 'business_foundation_entry' and indexname like '%idx'`,
      );
      expect([...found].map((r) => r.indexname).sort()).toEqual([
        "business_foundation_entry_project_created_idx",
        "business_foundation_entry_workspaceId_idx",
      ]);
    });

    it("goes away with its project, by the cascade (T9)", async () => {
      const id = await freshProject();
      await t.admin.insert(businessFoundationEntry).values(skipped(`fe-r-${id}`, "ws-a", id));
      await t.admin.delete(project).where(eq(project.id, id));
      expect(
        await t.admin
          .select()
          .from(businessFoundationEntry)
          .where(eq(businessFoundationEntry.projectId, id)),
      ).toEqual([]);
    });

    it("holds exactly the eight columns of section 4.1, none for a model, adapter or prompt (T10)", async () => {
      const cols = await t.admin.execute<{ column_name: string }>(
        sql`select column_name from information_schema.columns
            where table_name = 'business_foundation_entry' and table_schema = 'public'`,
      );
      expect([...cols].map((c) => c.column_name).sort()).toEqual(
        [
          "created_at",
          "created_by",
          "id",
          "kind",
          "node",
          "payload",
          "project_id",
          "workspace_id",
        ].sort(),
      );
    });

    describe("one entry per kind (T10, the unique index)", () => {
      it("refuses a second given and a second skipped for one node", async () => {
        const id = await freshProject();
        await t.admin.insert(businessFoundationEntry).values(given(`${id}-1`, "ws-a", id));
        await failsWithCode(
          t.admin.insert(businessFoundationEntry).values(given(`${id}-2`, "ws-a", id)),
          "23505",
        );
        await t.admin.insert(businessFoundationEntry).values(skipped(`${id}-3`, "ws-a", id));
        await failsWithCode(
          t.admin.insert(businessFoundationEntry).values(skipped(`${id}-4`, "ws-a", id)),
          "23505",
        );
      });

      it("takes a skipped, then a given, for one node, and the same kind on another project", async () => {
        const id = await freshProject();
        const other = await freshProject();
        await t.admin.insert(businessFoundationEntry).values([
          skipped(`${id}-s`, "ws-a", id),
          given(`${id}-g`, "ws-a", id),
          // The same node and kind on another project is no second of the first.
          given(`${other}-g`, "ws-a", other),
        ]);
        const rows = await t.admin
          .select()
          .from(businessFoundationEntry)
          .where(eq(businessFoundationEntry.projectId, id));
        expect(rows.map((r) => r.kind).sort()).toEqual(["given", "skipped"]);
      });

      it("counts the node: the same kind on a second node is not a second entry", async () => {
        const id = await freshProject();
        await t.admin
          .insert(businessFoundationEntry)
          .values([
            skipped(`${id}-i`, "ws-a", id),
            entry(`${id}-c`, "ws-a", id, "core-idea", "skipped", {}),
          ]);
        const rows = await t.admin
          .select()
          .from(businessFoundationEntry)
          .where(eq(businessFoundationEntry.projectId, id));
        expect(rows).toHaveLength(2);
      });
    });

    describe("foundation entry shape (T10)", () => {
      const six = [
        ["identity-frame", "given", { axes: { warm: 75 } }],
        ["identity-frame", "skipped", {}],
        ["architecture", "answered", { subBrands: false }],
        ["name", "given", { name: "ORIVILO" }],
        ["core-idea", "written", { statement: "Brands that stay alive" }],
        ["core-idea", "skipped", {}],
        ["competitive-frame", "lineup", { lineup: [{ name: "Brand A", hex: "#5B3FD9" }] }],
      ] as const;

      it.each(six)("takes the pair %s and %s", async (node, kind, payload) => {
        const id = await freshProject();
        await t.admin
          .insert(businessFoundationEntry)
          .values(entry(`${id}-ok`, "ws-a", id, node, kind, payload));
        const rows = await t.admin
          .select()
          .from(businessFoundationEntry)
          .where(eq(businessFoundationEntry.projectId, id));
        expect(rows.map((r) => [r.node, r.kind])).toEqual([[node, kind]]);
      });

      it.each([
        ["name", "skipped", {}],
        ["name", "written", { name: "x" }],
        ["architecture", "given", { subBrands: true }],
        ["architecture", "skipped", {}],
        ["identity-frame", "written", {}],
        ["identity-frame", "answered", {}],
        ["core-idea", "given", { statement: "x" }],
        ["color", "given", {}],
        ["color", "skipped", {}],
        ["color", "lineup", { lineup: [{ name: "Brand A", hex: "#5B3FD9" }] }],
        ["competitive-frame", "skipped", {}],
        ["competitive-frame", "given", { lineup: [{ name: "Brand A", hex: "#5B3FD9" }] }],
        ["competitive-frame", "answered", { lineup: [{ name: "Brand A", hex: "#5B3FD9" }] }],
        ["identity-frame", "lineup", { lineup: [{ name: "Brand A", hex: "#5B3FD9" }] }],
      ])("refuses the pair %s and %s (the pair check)", async (node, kind, payload) => {
        const id = await freshProject();
        await failsWithCode(
          t.admin
            .insert(businessFoundationEntry)
            .values(entry(`${id}-bad`, "ws-a", id, node, kind, payload)),
          "23514",
        );
      });

      it("refuses a skip with a payload (the payload shape, skipped half)", async () => {
        const id = await freshProject();
        await failsWithCode(
          t.admin
            .insert(businessFoundationEntry)
            .values(entry(`${id}-bad`, "ws-a", id, "identity-frame", "skipped", { axes: {} })),
          "23514",
        );
      });

      it("refuses an empty object on a given entry (the payload shape, other half)", async () => {
        const id = await freshProject();
        await failsWithCode(
          t.admin.insert(businessFoundationEntry).values(given(`${id}-bad`, "ws-a", id, {})),
          "23514",
        );
      });

      it.each([
        ["an array", []],
        ["an array of an object", [{ name: "x" }]],
        ["a string", "name"],
        ["a number", 5],
        ["a JSON null", sql`'null'::jsonb`],
      ])("refuses a payload that is %s (the payload shape, object half)", async (_, payload) => {
        const id = await freshProject();
        await failsWithCode(
          t.admin
            .insert(businessFoundationEntry)
            .values(entry(`${id}-bad`, "ws-a", id, "identity-frame", "given", payload)),
          "23514",
        );
      });

      // One row per key and per side of its bound: a missing "is a string" half or a moved bound
      // each leaves one of these passing.
      const TEXT = [
        ["person", "identity-frame", "given", 2000],
        ["never", "identity-frame", "given", 2000],
        ["remember", "core-idea", "written", 2000],
        ["name", "name", "given", 60],
        ["statement", "core-idea", "written", 300],
      ] as const;

      it.each(TEXT)("%s: keeps 1 and %i code points, in Thai", async (key, node, kind, max) => {
        const id = await freshProject();
        await t.admin
          .insert(businessFoundationEntry)
          .values([entry(`${id}-1`, "ws-a", id, node, kind, { [key]: "ก" })]);
        const other = await freshProject();
        await t.admin
          .insert(businessFoundationEntry)
          .values(entry(`${other}-m`, "ws-a", other, node, kind, { [key]: "ก".repeat(max) }));
        const [row] = await t.admin
          .select()
          .from(businessFoundationEntry)
          .where(eq(businessFoundationEntry.projectId, other));
        expect(((row?.payload as Record<string, string>)[key] ?? "").length).toBe(max);
      });

      it.each(TEXT)(
        "%s: refuses an empty text and one of one past the bound",
        async (key, node, kind, max) => {
          for (const text of ["", "ก".repeat(max + 1)]) {
            const id = await freshProject();
            await failsWithCode(
              t.admin
                .insert(businessFoundationEntry)
                .values(entry(`${id}-bad`, "ws-a", id, node, kind, { [key]: text })),
              "23514",
            );
          }
        },
      );

      it.each(TEXT)("%s: refuses a value that is not a string", async (key, node, kind) => {
        for (const value of [5, true, null, ["x"], { a: "x" }]) {
          const id = await freshProject();
          await failsWithCode(
            t.admin
              .insert(businessFoundationEntry)
              .values(entry(`${id}-bad`, "ws-a", id, node, kind, { [key]: value })),
            "23514",
          );
        }
      });

      it("counts code points, not UTF-16 units: 60 astral characters keep, 61 do not (name)", async () => {
        const id = await freshProject();
        await t.admin
          .insert(businessFoundationEntry)
          .values(entry(`${id}-ok`, "ws-a", id, "name", "given", { name: "😀".repeat(60) }));
        const other = await freshProject();
        await failsWithCode(
          t.admin
            .insert(businessFoundationEntry)
            .values(
              entry(`${other}-bad`, "ws-a", other, "name", "given", { name: "😀".repeat(61) }),
            ),
          "23514",
        );
      });
    });

    // ORV-298 (tech notes sections 4 and 13, T16): the lineup of competitor colours. The app schema
    // holds the strict keys and the repeat rule; the table bounds the count, each name and each
    // colour, so no direct call passes a missed app check.
    describe("lineup entry shape (T16)", () => {
      const ok = { name: "Brand A", hex: "#5B3FD9" };
      const lineupRow = (id: string, payload: unknown) =>
        entry(`${id}-l`, "ws-a", id, "competitive-frame", "lineup", payload);
      const many = (n: number) =>
        Array.from({ length: n }, (_, i) => ({ name: `Brand ${i}`, hex: "#111111" }));

      it.each([
        ["one entry", [ok]],
        ["twenty entries", many(20)],
        ["a name of 60 Thai characters", [{ name: "ก".repeat(60), hex: "#111111" }]],
        ["a name of 60 astral characters", [{ name: "😀".repeat(60), hex: "#111111" }]],
        ["a name of one character", [{ name: "x", hex: "#111111" }]],
        ["a name with a line break inside", [{ name: "a\nb", hex: "#111111" }]],
        ["upper-case hex digits and letters", [{ name: "a", hex: "#0A9BFE" }]],
      ])("keeps %s", async (_label, lineup) => {
        const id = await freshProject();
        await t.admin.insert(businessFoundationEntry).values(lineupRow(id, { lineup }));
        const rows = await t.admin
          .select()
          .from(businessFoundationEntry)
          .where(eq(businessFoundationEntry.projectId, id));
        expect(rows).toHaveLength(1);
      });

      it.each([
        ["no entry", []],
        ["twenty-one entries", many(21)],
        ["a name of 61 Thai characters", [{ name: "ก".repeat(61), hex: "#111111" }]],
        ["a name of 61 astral characters", [{ name: "😀".repeat(61), hex: "#111111" }]],
        ["an empty name", [{ name: "", hex: "#111111" }]],
        ["a name that is no text", [{ name: 5, hex: "#111111" }]],
        ["a null name", [{ name: null, hex: "#111111" }]],
        ["no name", [{ hex: "#111111" }]],
        ["no hex", [{ name: "a" }]],
        ["a hex that is no text", [{ name: "a", hex: 5 }]],
        ["a null hex", [{ name: "a", hex: null }]],
        ["a lower-case hex", [{ name: "a", hex: "#5b3fd9" }]],
        ["a hex of five digits", [{ name: "a", hex: "#12345" }]],
        ["a hex of seven digits", [{ name: "a", hex: "#5B3FD9F" }]],
        ["a hex of three digits", [{ name: "a", hex: "#FFF" }]],
        ["a hex with no #", [{ name: "a", hex: "5B3FD9" }]],
        ["a hex with a letter past F", [{ name: "a", hex: "#GGGGGG" }]],
        ["a hex followed by text", [{ name: "a", hex: "#5B3FD9\nx" }]],
        ["a bad entry among good ones", [ok, { name: "b", hex: "red" }, ok]],
        ["an entry that is no object", [5]],
        ["an entry that is a list holding a good one", [[ok]]],
        ["a hex with text before it", [{ name: "a", hex: "x#5B3FD9" }]],
        ["an entry that is a text", ["x"]],
        ["an entry that is null", [null]],
        ["a list that is an object", { name: "a", hex: "#111111" }],
        ["a list that is a text", "Brand A"],
        ["a list that is null", null],
      ])("refuses %s (the lineup check)", async (_label, lineup) => {
        const id = await freshProject();
        await failsWithCode(
          t.admin.insert(businessFoundationEntry).values(lineupRow(id, { lineup })),
          "23514",
        );
      });

      it("refuses a lineup entry whose payload holds no lineup key", async () => {
        const id = await freshProject();
        await failsWithCode(
          t.admin.insert(businessFoundationEntry).values(lineupRow(id, { other: [ok] })),
          "23514",
        );
      });

      it("refuses a second lineup for one project (the unique index)", async () => {
        const id = await freshProject();
        await t.admin.insert(businessFoundationEntry).values(lineupRow(id, { lineup: [ok] }));
        await failsWithCode(
          t.admin
            .insert(businessFoundationEntry)
            .values(entry(`${id}-2`, "ws-a", id, "competitive-frame", "lineup", { lineup: [ok] })),
          "23505",
        );
      });

      it("leaves the other nodes' payloads alone: a given entry takes no lineup check", async () => {
        const id = await freshProject();
        await t.admin
          .insert(businessFoundationEntry)
          .values(given(`${id}-g`, "ws-a", id, { axes: { warm: 50 } }));
      });
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

  it.each([
    "business_intake",
    "business_reading",
    "business_positioning_choice",
    "business_foundation_entry",
  ])("leaves %s to the owner and the app role only", async (table) => {
    const grants = await t.admin.execute<{ grantee: string }>(
      sql`select grantee from information_schema.role_table_grants
            where table_name = ${table} and table_schema = 'public' and grantee <> current_user`,
    );
    expect([...new Set([...grants].map((r) => r.grantee))]).toEqual(["orivilo_app"]);
  });

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
