import { eq, member, organization, project, rateLimitCounter, verification } from "@orivilo/db";
import { createDb, type Db } from "@orivilo/db/client";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { testUtils } from "better-auth/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { withWorkspace } from "./access.ts";
import { authRoute } from "./auth-route.ts";
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

  it("brings a production sign-in back to the project's domain, not the deployment's URL", async () => {
    const before = process.env["VERCEL_URL"];
    process.env["VERCEL_URL"] = "orivilo-abc123-team.vercel.app";
    try {
      const prod = createAuth({
        db: t.app,
        secret: "test-secret-that-is-long-enough-0123456789",
        baseURL: "https://orivilo.vercel.app",
        productionURL: "https://orivilo.vercel.app",
        google: { clientId: "test", clientSecret: "test" },
      });
      const { url } = await prod.api.signInSocial({
        body: { provider: "google", callbackURL: "/account" },
      });
      expect(new URL(url ?? "").searchParams.get("redirect_uri")).toBe(
        "https://orivilo.vercel.app/api/auth/callback/google",
      );
      const states = await t.admin.select({ value: verification.value }).from(verification);
      const saved = states.map((s) => s.value).join("\n");
      expect(saved).toContain("/account");
      expect(saved).not.toContain("orivilo-abc123-team");
    } finally {
      if (before === undefined) delete process.env["VERCEL_URL"];
      else process.env["VERCEL_URL"] = before;
    }
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

  // ORV-122 rows 12, 20 and 23: two instances on one store, Better Auth's limiter counting there.
  describe("Better Auth's limiter", () => {
    const secret = "test-secret-that-is-long-enough-0123456789";
    // 1 s after an aligned 10 s boundary.
    let clock = Date.parse("2026-10-26T10:00:01Z");
    let poolB: Db;
    let routeA: (r: Request) => Promise<Response>;
    let routeB: (r: Request) => Promise<Response>;
    const build = (db: Db) => {
      const instance = createAuth({
        db,
        secret,
        baseURL: "http://localhost:3000",
        google: { clientId: "test", clientSecret: "test" },
        rateLimit: { now: () => clock, pruneEveryMs: 0 },
      });
      return authRoute((r) => instance.handler(r));
    };
    beforeAll(() => {
      poolB = createDb(t.appUrl);
      routeA = build(t.app);
      routeB = build(poolB);
    });
    afterAll(async () => {
      await poolB?.$client.end();
    });
    const signInRequest = (n: number, xff: string) =>
      new Request("http://localhost:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-forwarded-for": xff,
          "x-vercel-forwarded-for": `198.51.100.${n}`,
          "x-real-ip": `192.0.2.${n}`,
        },
        body: JSON.stringify({ provider: "google", callbackURL: "/account" }),
      });

    it("Better Auth's limiter counts in the shared store", async () => {
      const statuses: number[] = [];
      let fourth: Response | undefined;
      for (const n of [1, 2, 3, 4]) {
        const res = await (n % 2 ? routeA : routeB)(signInRequest(n, "203.0.113.7"));
        statuses.push(res.status);
        if (n === 4) fourth = res;
      }
      expect(statuses).toEqual([200, 200, 200, 429]);
      const wait = Number(fourth?.headers.get("retry-after"));
      expect(wait).toBeGreaterThanOrEqual(1);
      expect(wait).toBeLessThanOrEqual(9);
      expect(await fourth?.json()).toMatchObject({
        error: { code: "RATE_LIMITED", retryable: true, requestId: expect.any(String) },
      });
      const found = (await t.admin.select().from(rateLimitCounter)).filter(
        (r) => r.key.startsWith("auth-http:ip:") && r.key.endsWith(":10x3"),
      );
      expect(found).toHaveLength(1);
      expect(found[0]?.key).toMatch(/^auth-http:ip:[0-9a-f]{64}:10x3$/);
      expect(found[0]?.count).toBe(3);
      // A different trusted header is a different bucket; the forged others never chose one.
      expect((await routeA(signInRequest(5, "203.0.113.8"))).status).toBe(200);
    });

    it("made-up paths share one bucket per rule", async () => {
      clock += 60_000;
      for (let i = 1; i <= 50; i++) {
        const res = await (i % 2 ? routeA : routeB)(
          new Request(`http://localhost:3000/api/auth/made-up-${i}`, {
            headers: { "x-forwarded-for": "203.0.113.9" },
          }),
        );
        expect(res.status).not.toBe(429);
      }
      const found = (await t.admin.select().from(rateLimitCounter)).filter(
        (r) => r.key.startsWith("auth-http:ip:") && r.key.endsWith(":10x100"),
      );
      expect(found).toHaveLength(1);
      expect(found[0]?.count).toBe(50);
    });

    it("keeps raw IPs out of every key", async () => {
      const keys = (await t.admin.select({ key: rateLimitCounter.key }).from(rateLimitCounter)).map(
        (r) => r.key,
      );
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) expect(key).not.toMatch(/203\.0\.113\./);
    });

    it("a store failure answers 503 through the handler", async () => {
      const dead = createDb(t.appUrl);
      await dead.$client.end();
      const route = authRoute((r) =>
        createAuth({
          db: dead,
          secret,
          baseURL: "http://localhost:3000",
          google: { clientId: "test", clientSecret: "test" },
          rateLimit: { now: () => clock, pruneEveryMs: 0 },
        }).handler(r),
      );
      const res = await route(signInRequest(1, "203.0.113.50"));
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
    });
  });
});
