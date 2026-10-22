import { eq, member, organization, project } from "@orivilo/db";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { testUtils } from "better-auth/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withWorkspace } from "./access.ts";
import { createAuth } from "./config.ts";

// ORV-38 AC 1, 2 and 4, against a throwaway database as orivilo_app.
describe.runIf(HAS_TEST_DATABASE)("Better Auth and the authorization helper", () => {
  let t: TestDatabase;
  let auth: ReturnType<typeof make>;
  const make = (db: TestDatabase["app"]) =>
    createAuth({
      db,
      secret: "test-secret-that-is-long-enough-0123456789",
      baseURL: "http://localhost:3000",
      google: { clientId: "test", clientSecret: "test" },
      plugins: [testUtils()],
    });

  const signIn = async (email: string, name: string) => {
    const ctx = await auth.$context;
    const user = await ctx.internalAdapter.createUser(
      { email, name, emailVerified: true },
      // As Google sign-in creates a person.
      { method: "oauth", oauth: { providerId: "google" } },
    );
    const { headers } = await (ctx as unknown as { test: TestHelpersLike }).test.login({
      userId: user.id,
    });
    const [own] = await t.admin
      .select({ id: member.organizationId, role: member.role })
      .from(member)
      .where(eq(member.userId, user.id));
    return { user, headers, workspaceId: own?.id ?? "", role: own?.role };
  };
  interface TestHelpersLike {
    login(input: { userId: string }): Promise<{ headers: Headers }>;
  }
  const deps = () => ({
    db: t.app,
    getSession: (headers: Headers) => auth.api.getSession({ headers }),
  });

  beforeAll(async () => {
    t = await createTestDatabase();
    auth = make(t.app);
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  it("gives a new person their own workspace, as owner (AC 1)", async () => {
    const a = await signIn("a@example.com", "Anna");
    expect(a.role).toBe("owner");
    const [ws] = await t.admin.select().from(organization);
    expect(ws?.name).toBe("Anna");
    const session = await auth.api.getSession({ headers: a.headers });
    expect(session?.session.activeOrganizationId).toBe(a.workspaceId);
  });

  it("lets the owner read their workspace through the helper (AC 2)", async () => {
    const b = await signIn("b@example.com", "Ben");
    const name = await withWorkspace(deps(), b.headers, b.workspaceId, "owner", async ({ tx }) => {
      const [row] = await tx
        .select({ name: organization.name })
        .from(organization)
        .where(eq(organization.id, b.workspaceId));
      return row?.name;
    });
    expect(name).toBe("Ben");
  });

  it("denies a member of one workspace another workspace, before any query (AC 4)", async () => {
    const c = await signIn("c@example.com", "Chai");
    const d = await signIn("d@example.com", "Dao");
    await t.admin.insert(project).values({ id: "p-d", workspaceId: d.workspaceId, name: "Dao" });
    let ran = false;
    await expect(
      withWorkspace(deps(), c.headers, d.workspaceId, "member", async () => {
        ran = true;
      }),
    ).rejects.toMatchObject({ status: 403, reason: "not-a-member" });
    expect(ran).toBe(false);
  });

  it("denies a role below the one asked for", async () => {
    const e = await signIn("e@example.com", "Eak");
    await t.admin.update(member).set({ role: "member" }).where(eq(member.userId, e.user.id));
    await expect(
      withWorkspace(deps(), e.headers, e.workspaceId, "admin", async () => undefined),
    ).rejects.toMatchObject({ status: 403, reason: "role-too-low" });
  });

  it("denies a forged or expired session with 401", async () => {
    const forged = new Headers({ cookie: "better-auth.session_token=forged.value" });
    await expect(
      withWorkspace(deps(), forged, "anything", "member", async () => undefined),
    ).rejects.toMatchObject({ status: 401 });
  });
});
