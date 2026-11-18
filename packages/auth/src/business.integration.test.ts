import { businessIntake, eq, member, project } from "@orivilo/db";
import { inWorkspace } from "@orivilo/db/client";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { testUtils } from "better-auth/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BUSINESS_LIST_LIMIT, BusinessError, businessService } from "./business.ts";
import { createAuth } from "./config.ts";

// ORV-281 rows 9, 13 and 17 at the service, against a throwaway database as orivilo_app.
const intake = {
  projectName: "ร้านกาแฟคั่วเอง",
  idea: "ขายกาแฟคั่วสดให้คนทำงานในย่านอารีย์",
  industry: "ร้านอาหารและเครื่องดื่ม",
  customers: "พนักงานออฟฟิศ",
  problem: "กาแฟร้านทั่วไปไม่สด",
  competitors: "ร้านกาแฟเชน",
  value: "คั่วสดทุกเช้า",
  website: "example.com",
};

describe.runIf(HAS_TEST_DATABASE)("business projects", () => {
  let t: TestDatabase;
  let auth: ReturnType<typeof make>;
  let service: ReturnType<typeof businessService>;
  const make = (db: TestDatabase["app"]) =>
    createAuth({
      db,
      secret: "test-secret-that-is-long-enough-0123456789",
      baseURL: "http://localhost:3000",
      google: { clientId: "test", clientSecret: "test" },
      plugins: [testUtils()],
    });
  interface TestHelpersLike {
    login(input: { userId: string }): Promise<{ headers: Headers }>;
  }
  const signIn = async (email: string, name: string) => {
    const ctx = await auth.$context;
    const user = await ctx.internalAdapter.createUser(
      { email, name, emailVerified: true },
      { method: "oauth", oauth: { providerId: "google" } },
    );
    const { headers } = await (ctx as unknown as { test: TestHelpersLike }).test.login({
      userId: user.id,
    });
    const [own] = await t.admin
      .select({ id: member.organizationId })
      .from(member)
      .where(eq(member.userId, user.id));
    return { user, headers, workspaceId: own?.id ?? "" };
  };

  beforeAll(async () => {
    t = await createTestDatabase();
    auth = make(t.app);
    service = businessService({
      db: t.app,
      getSession: (headers) => auth.api.getSession({ headers }),
    });
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  it("create writes one project and one intake in the active workspace (T11)", async () => {
    const a = await signIn("a@example.com", "Anna");
    const { projectId } = await service.create(a.headers, a.workspaceId, intake);
    const projects = await t.admin.select().from(project).where(eq(project.id, projectId));
    expect(projects.map((p) => [p.workspaceId, p.name, p.createdBy])).toEqual([
      [a.workspaceId, intake.projectName, a.user.id],
    ]);
    const rows = await t.admin
      .select()
      .from(businessIntake)
      .where(eq(businessIntake.projectId, projectId));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      workspaceId: a.workspaceId,
      createdBy: a.user.id,
      version: "intake-1",
      idea: intake.idea,
      industry: intake.industry,
      customers: intake.customers,
      problem: intake.problem,
      competitors: intake.competitors,
      value: intake.value,
      // The check keeps what `websiteOf` makes of what was typed.
      website: "https://example.com/",
    });
  });

  it("create leaves no project behind when the intake insert fails (T11)", async () => {
    const a = await signIn("atomic@example.com", "Atom");
    // The engine's check allows a NUL character; Postgres refuses it in text, at the intake insert
    // that follows the project insert.
    await expect(
      service.create(a.headers, a.workspaceId, { projectName: "Atomic", idea: "a\u0000b" }),
    ).rejects.toThrow();
    const left = await t.admin.select().from(project).where(eq(project.workspaceId, a.workspaceId));
    expect(left).toEqual([]);
  });

  it("create refuses input the engine's check refuses, and writes nothing (T11)", async () => {
    const a = await signIn("refused@example.com", "Rin");
    for (const bad of [
      { projectName: "", idea: "x" },
      { projectName: "n", idea: "" },
      { projectName: "n", idea: "x".repeat(2001) },
      { projectName: "ก".repeat(121), idea: "x" },
      { projectName: "n", idea: "x", website: "https://user:secret@example.com" },
      { projectName: "n", idea: "x", workspaceId: "other" },
    ]) {
      await expect(service.create(a.headers, a.workspaceId, bad)).rejects.toMatchObject({
        name: "BusinessError",
        reason: "invalid-input",
      });
    }
    expect(
      await t.admin.select().from(project).where(eq(project.workspaceId, a.workspaceId)),
    ).toEqual([]);
  });

  it("create is denied without a session and for a workspace the caller is not in (T11)", async () => {
    const a = await signIn("denied-a@example.com", "Dee");
    const b = await signIn("denied-b@example.com", "Dan");
    await expect(service.create(new Headers(), a.workspaceId, intake)).rejects.toMatchObject({
      status: 401,
    });
    await expect(service.create(b.headers, a.workspaceId, intake)).rejects.toMatchObject({
      status: 404,
      reason: "not-a-member",
    });
    expect(
      await t.admin.select().from(project).where(eq(project.workspaceId, a.workspaceId)),
    ).toEqual([]);
  });

  it("opens a project with its checked answers and its save time (T11)", async () => {
    const a = await signIn("open@example.com", "Ola");
    const { projectId } = await service.create(a.headers, a.workspaceId, {
      projectName: "Open",
      idea: "Roasted coffee",
    });
    const opened = await service.open(a.headers, a.workspaceId, projectId);
    expect(opened.project).toMatchObject({ id: projectId, name: "Open" });
    expect(opened.intake).toEqual({ version: "intake-1", idea: "Roasted coffee" });
    const [row] = await t.admin
      .select({ at: businessIntake.createdAt })
      .from(businessIntake)
      .where(eq(businessIntake.projectId, projectId));
    expect(opened.savedAt).toEqual(row?.at);
  });

  it("opens the newest intake of a project, and shows a row changed outside the app as invalid (T11)", async () => {
    const a = await signIn("newest@example.com", "Nok");
    const { projectId } = await service.create(a.headers, a.workspaceId, {
      projectName: "Newest",
      idea: "first",
    });
    await t.admin.insert(businessIntake).values({
      id: "bi-newest-later",
      workspaceId: a.workspaceId,
      projectId,
      version: "intake-1",
      idea: "second",
      createdBy: a.user.id,
      createdAt: new Date(Date.now() + 60_000),
    });
    expect((await service.open(a.headers, a.workspaceId, projectId)).intake.idea).toBe("second");

    // Valid for the database's checks, refused by the stored form: a website that is not what
    // `websiteOf` keeps.
    await t.admin
      .update(businessIntake)
      .set({ website: "ftp://example.com" })
      .where(eq(businessIntake.id, "bi-newest-later"));
    await expect(service.open(a.headers, a.workspaceId, projectId)).rejects.toMatchObject({
      reason: "invalid-stored",
    });
  });

  it("answers not-found the same way for another workspace's project and an unknown id (T12)", async () => {
    const a = await signIn("owner-a@example.com", "Aon");
    const b = await signIn("owner-b@example.com", "Bua");
    const { projectId } = await service.create(a.headers, a.workspaceId, {
      projectName: "A only",
      idea: "x",
    });
    const refusal = async (id: string) => {
      const error = await service.open(b.headers, b.workspaceId, id).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(BusinessError);
      return error as BusinessError;
    };
    const other = await refusal(projectId);
    const unknown = await refusal("00000000-0000-4000-8000-000000000000");
    const notAnId = await refusal("not-an-id");
    expect([other.reason, unknown.reason, notAnId.reason]).toEqual([
      "not-found",
      "not-found",
      "not-found",
    ]);
    expect([unknown.message, notAnId.message]).toEqual([other.message, other.message]);
    // Asking in A's workspace is denied before any query, as a workspace the caller is not in.
    await expect(service.open(b.headers, a.workspaceId, projectId)).rejects.toMatchObject({
      status: 404,
      reason: "not-a-member",
    });
    // And without the helper, row security alone returns nothing.
    const rows = await inWorkspace(t.app, b.workspaceId, (tx) =>
      tx.select().from(project).where(eq(project.id, projectId)),
    );
    expect(rows).toEqual([]);
  });

  it("lists the workspace's projects newest first, and none as empty (T13)", async () => {
    const a = await signIn("list-a@example.com", "Lek");
    const b = await signIn("list-b@example.com", "Bow");
    const c = await signIn("list-c@example.com", "Cho");
    expect(await service.list(c.headers, c.workspaceId)).toEqual([]);
    // Names are in reverse order of saving, so ordering by name would show the opposite.
    const first = await service.create(a.headers, a.workspaceId, {
      projectName: "Z first",
      idea: "x",
    });
    const second = await service.create(a.headers, a.workspaceId, {
      projectName: "M second",
      idea: "x",
    });
    const third = await service.create(a.headers, a.workspaceId, {
      projectName: "A third",
      idea: "x",
    });
    await service.create(b.headers, b.workspaceId, { projectName: "Not mine", idea: "x" });
    // A project with no intake is not listed.
    await t.admin
      .insert(project)
      .values({ id: "p-no-intake", workspaceId: a.workspaceId, name: "No intake" });
    const listed = await service.list(a.headers, a.workspaceId);
    expect(listed.map((p) => [p.id, p.name])).toEqual([
      [third.projectId, "A third"],
      [second.projectId, "M second"],
      [first.projectId, "Z first"],
    ]);
    expect(listed[0]?.createdAt).toBeInstanceOf(Date);
    await expect(service.list(b.headers, a.workspaceId)).rejects.toMatchObject({ status: 404 });
  });

  it("lists at most the bound, newest first (T13)", async () => {
    const a = await signIn("many@example.com", "Mai");
    const total = BUSINESS_LIST_LIMIT + 1;
    const base = Date.now() - 10 * 60_000;
    const ids = Array.from({ length: total }, (_, i) => `many-${String(i).padStart(3, "0")}`);
    await t.admin.insert(project).values(
      ids.map((id, i) => ({
        id,
        workspaceId: a.workspaceId,
        name: id,
        createdAt: new Date(base + i * 1000),
      })),
    );
    await t.admin.insert(businessIntake).values(
      ids.map((id) => ({
        id: `bi-${id}`,
        workspaceId: a.workspaceId,
        projectId: id,
        version: "intake-1",
        idea: "x",
        createdBy: a.user.id,
      })),
    );
    const listed = await service.list(a.headers, a.workspaceId);
    expect(listed).toHaveLength(BUSINESS_LIST_LIMIT);
    expect(listed[0]?.id).toBe(ids[total - 1]);
    expect(listed.at(-1)?.id).toBe(ids[1]);
  });
});
