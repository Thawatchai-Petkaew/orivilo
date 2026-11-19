import { businessFoundationEntry, businessIntake, eq, member, project, sql } from "@orivilo/db";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { PERSONALITY_AXES } from "@orivilo/intent-engine";
import { testUtils } from "better-auth/plugins";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { BusinessError, businessService } from "./business.ts";
import { createAuth } from "./config.ts";
import { foundationService } from "./foundation.ts";
import { positioningService } from "./positioning.ts";

// ORV-291 tech notes sections 7 and 8, T12 to T14 (spec rows 2, 4, 5, 7 and 12), at the service,
// against a throwaway database as orivilo_app.
const axes = Object.fromEntries(PERSONALITY_AXES.map((axis) => [axis, 75]));
const PERSON = "อบอุ่น เป็นกันเอง ใส่ใจ";
const STATEMENT = "กาแฟคั่วสดสำหรับคนทำงานที่ส่งถึงออฟฟิศทุกเช้า";

describe.runIf(HAS_TEST_DATABASE)("brand foundation entries", () => {
  let t: TestDatabase;
  let auth: ReturnType<typeof make>;
  let business: ReturnType<typeof businessService>;
  let positioning: ReturnType<typeof positioningService>;
  let foundation: ReturnType<typeof foundationService>;
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
    const deps = { db: t.app, getSession: (headers: Headers) => auth.api.getSession({ headers }) };
    business = businessService(deps);
    positioning = positioningService(deps);
    foundation = foundationService(deps);
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  type Setup = "agreed" | "skipped" | "none";
  /** A person with a project whose positioning is agreed, skipped or not yet decided. */
  const create = async (email: string, name: string, setup: Setup = "agreed") => {
    const a = await signIn(email, name);
    const { projectId } = await business.create(a.headers, a.workspaceId, {
      projectName: "Foundation",
      idea: "Roasted coffee for office workers",
    });
    if (setup === "agreed") {
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId,
        statement: STATEMENT,
      });
    } else if (setup === "skipped") {
      await positioning.choose(a.headers, a.workspaceId, { kind: "skipped", projectId });
    }
    return { ...a, projectId };
  };
  const given = (projectId: string, over: Record<string, unknown> = {}) => ({
    projectId,
    node: "identity-frame",
    kind: "given",
    payload: { axes, person: PERSON },
    ...over,
  });
  const skip = (projectId: string) => ({
    projectId,
    node: "identity-frame",
    kind: "skipped",
    payload: {},
  });
  const rowsOf = (projectId: string) =>
    t.admin
      .select()
      .from(businessFoundationEntry)
      .where(eq(businessFoundationEntry.projectId, projectId));
  const refusal = async (run: Promise<unknown>) => {
    const error = await run.then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(BusinessError);
    return error as BusinessError;
  };

  // T12, row 2.
  describe("entry saved in the workspace", () => {
    it("saves one row: node, kind, axes of 75, the person trimmed, no never, made by the session's user", async () => {
      const a = await create("fe-save@example.com", "Fon");
      const done = await foundation.enter(
        a.headers,
        a.workspaceId,
        given(a.projectId, { payload: { axes, person: `  ${PERSON}  `, never: "   " } }),
      );
      expect(done).toEqual({ node: "identity-frame", kind: "given" });
      const rows = await rowsOf(a.projectId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        node: "identity-frame",
        kind: "given",
        payload: { axes, person: PERSON },
        createdBy: a.user.id,
      });
      expect(Object.keys((rows[0]?.payload ?? {}) as object).sort()).toEqual(["axes", "person"]);
    });

    it("saves a skip with an empty payload", async () => {
      const a = await create("fe-skip@example.com", "Fai");
      await foundation.enter(a.headers, a.workspaceId, skip(a.projectId));
      const rows = await rowsOf(a.projectId);
      expect(rows.map((r) => [r.kind, r.payload])).toEqual([["skipped", {}]]);
    });

    it("takes the workspace from the session: a client-named other workspace is denied before any query", async () => {
      const a = await create("fe-ws-a@example.com", "Fwa");
      const b = await signIn("fe-ws-b@example.com", "Fwb");
      await expect(
        foundation.enter(b.headers, a.workspaceId, given(a.projectId)),
      ).rejects.toMatchObject({ status: 404, reason: "not-a-member" });
      await expect(
        foundation.enter(new Headers(), a.workspaceId, given(a.projectId)),
      ).rejects.toMatchObject({ status: 401 });
      expect(await rowsOf(a.projectId)).toEqual([]);
    });
  });

  // T13, row 7.
  describe("another workspace reads as not found", () => {
    it("gives a member of B entering on A's project the same not-found as an unknown id, and saves nothing", async () => {
      const a = await create("fe-nf-a@example.com", "Fna");
      const b = await signIn("fe-nf-b@example.com", "Fnb");
      const other = await refusal(foundation.enter(b.headers, b.workspaceId, given(a.projectId)));
      const unknown = await refusal(
        foundation.enter(b.headers, b.workspaceId, given("00000000-0000-4000-8000-000000000000")),
      );
      expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
      expect(unknown.message).toBe(other.message);
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("answers not-found for a project with no intake", async () => {
      const a = await signIn("fe-nf-bare@example.com", "Fbr");
      const projectId = "11111111-1111-4111-8111-111111111111";
      await t.admin
        .insert(project)
        .values({ id: projectId, workspaceId: a.workspaceId, name: "Bare" });
      const error = await refusal(foundation.enter(a.headers, a.workspaceId, given(projectId)));
      expect(error.reason).toBe("not-found");
      expect(await rowsOf(projectId)).toEqual([]);
    });
  });

  describe("the service's own workspace conditions", () => {
    it("answers not-found for another workspace's project even when row security is out of the way (the owner role)", async () => {
      // The owner role skips row security, so only the service's own conditions (and the composite
      // foreign key behind them) can keep a member of B out of A's project.
      const a = await create("fe-own-a@example.com", "Foa");
      const b = await signIn("fe-own-b@example.com", "Fob");
      const owner = foundationService({
        db: t.admin,
        getSession: (headers: Headers) => auth.api.getSession({ headers }),
      });
      const error = await refusal(owner.enter(b.headers, b.workspaceId, given(a.projectId)));
      expect(error.reason).toBe("not-found");
      expect(await rowsOf(a.projectId)).toEqual([]);
    });
  });

  // T14, row 4.
  describe("newest wins, in lock order", () => {
    it("skipped, then given: open returns both, the given one first, and the node's newest entry is the given one", async () => {
      const a = await create("fe-order@example.com", "For");
      await foundation.enter(a.headers, a.workspaceId, skip(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.map((e) => e.kind)).toEqual(["given", "skipped"]);
      expect(await rowsOf(a.projectId)).toHaveLength(2);
    });

    /** Lock waits in this throwaway database, read from the server's own view of its backends. */
    const waiting = async () => {
      const rows = await t.admin.execute<{ n: number }>(
        sql`select count(*)::int as n from pg_stat_activity
            where datname = current_database() and wait_event_type = 'Lock'`,
      );
      return [...rows][0]?.n ?? 0;
    };

    /** Waits until `n` backends wait on a lock: a condition, never a fixed time. */
    const queued = (n: number) =>
      vi.waitFor(async () => expect(await waiting()).toBeGreaterThanOrEqual(n), {
        timeout: 30_000,
        interval: 25,
      });
    /**
     * Holds the project row, as another request would mid-save, so each call that follows queues
     * behind it. Returns what releases it and what ends the holding transaction.
     */
    const holdProject = async (projectId: string) => {
      let release: () => void = () => undefined;
      let held: () => void = () => undefined;
      const holding = new Promise<void>((resolve) => (held = resolve));
      const ended = t.admin.transaction(async (tx) => {
        await tx.execute(sql`select id from project where id = ${projectId} for update`);
        held();
        await new Promise<void>((resolve) => (release = resolve));
      });
      await holding;
      return { release: () => release(), ended };
    };

    it("a given sent first and a skipped second on an empty node: the skipped one is refused, and only the given one is saved", async () => {
      const a = await create("fe-race-gs@example.com", "Frg");
      const hold = await holdProject(a.projectId);
      const first = foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await queued(1);
      const second = foundation.enter(a.headers, a.workspaceId, skip(a.projectId));
      await queued(2);
      hold.release();
      await hold.ended;
      expect(await first).toEqual({ node: "identity-frame", kind: "given" });
      expect((await refusal(second)).reason).toBe("out-of-order");
      expect((await rowsOf(a.projectId)).map((r) => r.kind)).toEqual(["given"]);
    }, 60_000);

    it("a skipped sent first and a given second on an empty node: both are saved, and the given one is newest", async () => {
      const a = await create("fe-race-sg@example.com", "Fsg");
      const hold = await holdProject(a.projectId);
      const first = foundation.enter(a.headers, a.workspaceId, skip(a.projectId));
      await queued(1);
      const second = foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await queued(2);
      hold.release();
      await hold.ended;
      expect(await first).toEqual({ node: "identity-frame", kind: "skipped" });
      expect(await second).toEqual({ node: "identity-frame", kind: "given" });
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.map((e) => e.kind)).toEqual(["given", "skipped"]);
    }, 60_000);
  });

  // Row 5: the node waits for positioning.
  describe("waits for positioning", () => {
    it("refuses a given and a skipped entry with no positioning choice, and saves nothing", async () => {
      const a = await create("fe-wait-none@example.com", "Fwn", "none");
      for (const entry of [given(a.projectId), skip(a.projectId)]) {
        expect((await refusal(foundation.enter(a.headers, a.workspaceId, entry))).reason).toBe(
          "out-of-order",
        );
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("refuses both when the agreed positioning belongs to an older intake (stale)", async () => {
      const a = await create("fe-wait-stale@example.com", "Fws");
      await t.admin.insert(businessIntake).values({
        id: "bi-fe-stale",
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        version: "intake-1",
        idea: "a newer idea",
        createdBy: a.user.id,
        createdAt: new Date(Date.now() + 60_000),
      });
      for (const entry of [given(a.projectId), skip(a.projectId)]) {
        expect((await refusal(foundation.enter(a.headers, a.workspaceId, entry))).reason).toBe(
          "out-of-order",
        );
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("accepts both while positioning is skipped", async () => {
      const a = await create("fe-wait-skip@example.com", "Fwk", "skipped");
      await foundation.enter(a.headers, a.workspaceId, skip(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      expect((await rowsOf(a.projectId)).map((r) => r.kind).sort()).toEqual(["given", "skipped"]);
    });
  });

  // Row 7, "given stays given".
  describe("given stays given", () => {
    it("refuses a second given, a skip after a given and a second skip, and keeps what was saved", async () => {
      const a = await create("fe-stays@example.com", "Fst");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      for (const entry of [given(a.projectId), skip(a.projectId)]) {
        expect((await refusal(foundation.enter(a.headers, a.workspaceId, entry))).reason).toBe(
          "out-of-order",
        );
      }
      const b = await create("fe-stays-skip@example.com", "Fsk");
      await foundation.enter(b.headers, b.workspaceId, skip(b.projectId));
      expect(
        (await refusal(foundation.enter(b.headers, b.workspaceId, skip(b.projectId)))).reason,
      ).toBe("out-of-order");
      expect((await rowsOf(a.projectId)).map((r) => r.kind)).toEqual(["given"]);
      expect((await rowsOf(b.projectId)).map((r) => r.kind)).toEqual(["skipped"]);
    });
  });

  describe("input and failure", () => {
    it("refuses an entry the engine's check refuses, and writes nothing", async () => {
      const a = await create("fe-bad@example.com", "Fbd");
      for (const bad of [
        given(a.projectId, { payload: { axes: { ...axes, warm: 60 } } }),
        given(a.projectId, { payload: { axes, person: "x".repeat(2001) } }),
        given(a.projectId, { payload: { axes, score: 1 } }),
        { ...skip(a.projectId), payload: { axes } },
        given(a.projectId, { node: "color" }),
        given("not-a-uuid"),
        "not an entry",
      ]) {
        expect((await refusal(foundation.enter(a.headers, a.workspaceId, bad))).reason).toBe(
          "invalid-input",
        );
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("answers not-saved with a closed message when the database refuses the insert", async () => {
      const a = await create("fe-notsaved@example.com", "Fns");
      // The engine's check cannot be passed by a row the database refuses, so a probe constraint on
      // this throwaway database refuses one answer at the insert.
      await t.admin.execute(
        sql`alter table business_foundation_entry
            add constraint not_saved_probe check ((payload->>'person') is distinct from 'probe-answer')`,
      );
      const error = await refusal(
        foundation.enter(
          a.headers,
          a.workspaceId,
          given(a.projectId, { payload: { axes, person: "probe-answer" } }),
        ),
      );
      await t.admin.execute(
        sql`alter table business_foundation_entry drop constraint not_saved_probe`,
      );
      expect(error.reason).toBe("not-saved");
      expect(error.message).toBe("business refused: not-saved");
      expect(JSON.stringify(error)).not.toContain("probe-answer");
      expect(await rowsOf(a.projectId)).toEqual([]);
    });
  });

  // Row 12: opening reads and writes nothing.
  describe("open", () => {
    it("returns no entry for a project with none, and writes nothing", async () => {
      const a = await create("fe-open-none@example.com", "Fon");
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation).toEqual([]);
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("returns the entries newest first by time, then by id, never by id alone", async () => {
      const a = await create("fe-open-order@example.com", "Foo");
      const at = Date.now();
      // The older row has the larger id and the newer one the smaller.
      await t.admin.insert(businessFoundationEntry).values([
        {
          id: "zzzz-older",
          workspaceId: a.workspaceId,
          projectId: a.projectId,
          node: "identity-frame",
          kind: "skipped",
          payload: {},
          createdBy: a.user.id,
          createdAt: new Date(at - 60_000),
        },
        {
          id: "aaaa-newer",
          workspaceId: a.workspaceId,
          projectId: a.projectId,
          node: "identity-frame",
          kind: "given",
          payload: { axes },
          createdBy: a.user.id,
          createdAt: new Date(at),
        },
      ]);
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.map((e) => e.id)).toEqual(["aaaa-newer", "zzzz-older"]);
      expect(opened.foundation[0]).toMatchObject({
        node: "identity-frame",
        kind: "given",
        payload: { axes },
        createdAt: new Date(at).toISOString(),
      });
    });

    it("breaks a tie in time by the larger id first", async () => {
      const a = await create("fe-open-tie@example.com", "Fti");
      const at = new Date(Date.now());
      await t.admin.insert(businessFoundationEntry).values([
        {
          id: "aaaa-tie",
          workspaceId: a.workspaceId,
          projectId: a.projectId,
          node: "identity-frame",
          kind: "skipped",
          payload: {},
          createdBy: a.user.id,
          createdAt: at,
        },
        {
          id: "zzzz-tie",
          workspaceId: a.workspaceId,
          projectId: a.projectId,
          node: "identity-frame",
          kind: "given",
          payload: { axes },
          createdBy: a.user.id,
          createdAt: at,
        },
      ]);
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.map((e) => e.id)).toEqual(["zzzz-tie", "aaaa-tie"]);
    });

    it("keeps one project's entries out of another project's of the same workspace", async () => {
      const a = await create("fe-open-iso@example.com", "Foi");
      const { projectId: other } = await business.create(a.headers, a.workspaceId, {
        projectName: "Other",
        idea: "another",
      });
      await foundation.enter(a.headers, a.workspaceId, skip(a.projectId));
      expect((await business.open(a.headers, a.workspaceId, other)).foundation).toEqual([]);
    });

    it("shows an entry row changed outside the app as invalid, never as an answer", async () => {
      const a = await create("fe-open-tamper@example.com", "Fot");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      // The table holds the text bounds, not the axes: a given row with no axes is for the stored
      // form to refuse.
      await t.admin
        .update(businessFoundationEntry)
        .set({ payload: { person: PERSON } })
        .where(eq(businessFoundationEntry.projectId, a.projectId));
      const error = await refusal(business.open(a.headers, a.workspaceId, a.projectId));
      expect(error.reason).toBe("invalid-stored");
      expect(JSON.stringify(error)).not.toContain(PERSON);
    });
  });
});
