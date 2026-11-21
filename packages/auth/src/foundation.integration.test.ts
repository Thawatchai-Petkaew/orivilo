import {
  and,
  businessFoundationEntry,
  businessIntake,
  eq,
  member,
  project,
  sql,
} from "@orivilo/db";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { PERSONALITY_AXES, STAND_IN_LINEUP } from "@orivilo/intent-engine";
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

  // ORV-295 (slice of ORV-291, PR 2), T30, rows 15, 18, 20 and 21 at the unchanged service: the
  // architecture and name arms reach it through `checkEntry` and `entryAllowed`.
  describe("architecture and name entries", () => {
    const answer = (projectId: string, subBrands: boolean) => ({
      projectId,
      node: "architecture",
      kind: "answered",
      payload: { subBrands },
    });
    const named = (projectId: string, name: string) => ({
      projectId,
      node: "name",
      kind: "given",
      payload: { name },
    });

    it("saves the answer no as one row with no derived value, made by the session's user", async () => {
      const a = await create("fe-arch-save@example.com", "Fas");
      expect(await foundation.enter(a.headers, a.workspaceId, answer(a.projectId, false))).toEqual({
        node: "architecture",
        kind: "answered",
      });
      const rows = await rowsOf(a.projectId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        node: "architecture",
        kind: "answered",
        payload: { subBrands: false },
        createdBy: a.user.id,
      });
      expect(JSON.stringify(rows[0]?.payload)).not.toContain("single");
    });

    it("saves a working name trimmed, as typed otherwise, with Thai whole", async () => {
      const a = await create("fe-name-save@example.com", "Fns");
      await foundation.enter(a.headers, a.workspaceId, named(a.projectId, "  ORIVILO  "));
      expect((await rowsOf(a.projectId)).map((r) => [r.node, r.kind, r.payload])).toEqual([
        ["name", "given", { name: "ORIVILO" }],
      ]);
      const b = await create("fe-name-thai@example.com", "Fnt");
      await foundation.enter(b.headers, b.workspaceId, named(b.projectId, "ก".repeat(60)));
      expect((await rowsOf(b.projectId))[0]?.payload).toEqual({ name: "ก".repeat(60) });
    });

    it("saves a name and an answer while positioning is not decided, and still refuses the personality", async () => {
      const a = await create("fe-name-wait@example.com", "Fnw", "none");
      await foundation.enter(a.headers, a.workspaceId, named(a.projectId, "ORIVILO"));
      await foundation.enter(a.headers, a.workspaceId, answer(a.projectId, false));
      expect(
        (await refusal(foundation.enter(a.headers, a.workspaceId, given(a.projectId)))).reason,
      ).toBe("out-of-order");
      expect((await rowsOf(a.projectId)).map((r) => r.node).sort()).toEqual([
        "architecture",
        "name",
      ]);
    });

    it("refuses a second answer and a second name, and keeps what was saved", async () => {
      const a = await create("fe-arch-twice@example.com", "Fat");
      await foundation.enter(a.headers, a.workspaceId, answer(a.projectId, true));
      await foundation.enter(a.headers, a.workspaceId, named(a.projectId, "First"));
      for (const entry of [
        answer(a.projectId, true),
        answer(a.projectId, false),
        named(a.projectId, "Second"),
      ]) {
        expect((await refusal(foundation.enter(a.headers, a.workspaceId, entry))).reason).toBe(
          "out-of-order",
        );
      }
      expect((await rowsOf(a.projectId)).map((r) => [r.node, r.payload]).sort()).toEqual([
        ["architecture", { subBrands: true }],
        ["name", { name: "First" }],
      ]);
    });

    it("gives a member of B entering on A's project the same not-found as an unknown id, for each arm", async () => {
      const a = await create("fe-an-nf-a@example.com", "Fan");
      const b = await signIn("fe-an-nf-b@example.com", "Fbn");
      const unknownId = "00000000-0000-4000-8000-000000000000";
      for (const make of [
        (id: string) => answer(id, false),
        (id: string) => named(id, "ORIVILO"),
      ]) {
        const other = await refusal(foundation.enter(b.headers, b.workspaceId, make(a.projectId)));
        const unknown = await refusal(foundation.enter(b.headers, b.workspaceId, make(unknownId)));
        expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
        expect(unknown.message).toBe(other.message);
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("refuses what the check refuses, writes nothing, and holds the name out of the error", async () => {
      const a = await create("fe-an-input@example.com", "Fai");
      for (const bad of [
        named(a.projectId, "   "),
        named(a.projectId, `SECRET-NAME-${"x".repeat(61)}`),
        { ...answer(a.projectId, false), payload: { subBrands: "no" } },
        { projectId: a.projectId, node: "name", kind: "skipped", payload: {} },
      ]) {
        const error = await refusal(foundation.enter(a.headers, a.workspaceId, bad));
        expect(error.reason).toBe("invalid-input");
        expect(JSON.stringify(error)).not.toContain("SECRET-NAME");
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("opens with the three nodes' entries newest first and reads each through the stored schema", async () => {
      const a = await create("fe-an-open@example.com", "Fao");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, answer(a.projectId, false));
      await foundation.enter(a.headers, a.workspaceId, named(a.projectId, "ORIVILO"));
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.map((e) => e.node)).toEqual([
        "name",
        "architecture",
        "identity-frame",
      ]);
      expect(opened.foundation[0]).toMatchObject({ kind: "given", payload: { name: "ORIVILO" } });
      expect(opened.foundation[1]).toMatchObject({
        kind: "answered",
        payload: { subBrands: false },
      });
    });

    it("shows an answer row changed outside the app as invalid, never as an answer", async () => {
      const a = await create("fe-an-tamper@example.com", "Fat2");
      await foundation.enter(a.headers, a.workspaceId, answer(a.projectId, false));
      // The table holds the text bounds, not the boolean: the stored form refuses a text answer.
      await t.admin
        .update(businessFoundationEntry)
        .set({ payload: { subBrands: "no" } })
        .where(eq(businessFoundationEntry.projectId, a.projectId));
      const error = await refusal(business.open(a.headers, a.workspaceId, a.projectId));
      expect(error.reason).toBe("invalid-stored");
    });
  });

  // ORV-298 T17, rows 3 and 10: the lineup of competitor colours.
  describe("lineup saved in the workspace", () => {
    const lineupOf = (projectId: string, lineup: unknown = STAND_IN_LINEUP, over = {}) => ({
      projectId,
      node: "competitive-frame",
      kind: "lineup",
      payload: { lineup },
      ...over,
    });

    it("saves one row of seven entries, colours upper case, made by the session's user", async () => {
      const a = await create("fe-lineup-save@example.com", "Fls");
      const lower = STAND_IN_LINEUP.map((row) => ({
        name: `  ${row.name}  `,
        hex: row.hex.toLowerCase(),
      }));
      // The service takes the app's own check: the colours are upper-cased and the names trimmed.
      expect(
        await foundation.enter(a.headers, a.workspaceId, lineupOf(a.projectId, lower)),
      ).toEqual({
        node: "competitive-frame",
        kind: "lineup",
      });
      const rows = await rowsOf(a.projectId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        node: "competitive-frame",
        kind: "lineup",
        payload: { lineup: STAND_IN_LINEUP },
        createdBy: a.user.id,
      });
    });

    it("saves while positioning is not decided, and opens through the stored schema", async () => {
      const a = await create("fe-lineup-wait@example.com", "Flw", "none");
      await foundation.enter(a.headers, a.workspaceId, lineupOf(a.projectId));
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation).toHaveLength(1);
      expect(opened.foundation[0]).toMatchObject({
        node: "competitive-frame",
        kind: "lineup",
        payload: { lineup: STAND_IN_LINEUP },
      });
    });

    it("refuses what the check refuses, writes nothing, and holds the names out of the error", async () => {
      const a = await create("fe-lineup-input@example.com", "Fli");
      const secret = [{ name: "SECRET-RIVAL", hex: "#ZZZZZZ" }];
      for (const bad of [
        lineupOf(a.projectId, secret),
        lineupOf(a.projectId, []),
        lineupOf(a.projectId, [
          { name: "SECRET-RIVAL", hex: "#111111" },
          { name: "secret-rival", hex: "#222222" },
        ]),
        lineupOf(a.projectId, [{ name: "x".repeat(61), hex: "#111111" }]),
        { projectId: a.projectId, node: "competitive-frame", kind: "skipped", payload: {} },
        {
          projectId: a.projectId,
          node: "color",
          kind: "lineup",
          payload: { lineup: STAND_IN_LINEUP },
        },
      ]) {
        const error = await refusal(foundation.enter(a.headers, a.workspaceId, bad));
        expect(error.reason).toBe("invalid-input");
        expect(JSON.stringify(error)).not.toContain("SECRET-RIVAL");
        expect(JSON.stringify(error)).not.toContain("#ZZZZZZ");
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });
  });

  describe("another workspace reads as not found (lineup)", () => {
    it("gives a member of B entering a lineup on A's project the same not-found as an unknown id", async () => {
      const a = await create("fe-lineup-nf-a@example.com", "Fla");
      const b = await signIn("fe-lineup-nf-b@example.com", "Flb");
      const make = (projectId: string) => ({
        projectId,
        node: "competitive-frame",
        kind: "lineup",
        payload: { lineup: STAND_IN_LINEUP },
      });
      const other = await refusal(foundation.enter(b.headers, b.workspaceId, make(a.projectId)));
      const unknown = await refusal(
        foundation.enter(b.headers, b.workspaceId, make("00000000-0000-4000-8000-000000000000")),
      );
      expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
      expect(unknown.message).toBe(other.message);
      expect(await rowsOf(a.projectId)).toEqual([]);
    });
  });

  describe("one lineup per project", () => {
    it("refuses a second lineup as out-of-order and keeps the stored one unchanged", async () => {
      const a = await create("fe-lineup-twice@example.com", "Flt");
      const make = (lineup: unknown) => ({
        projectId: a.projectId,
        node: "competitive-frame",
        kind: "lineup",
        payload: { lineup },
      });
      await foundation.enter(a.headers, a.workspaceId, make(STAND_IN_LINEUP));
      const error = await refusal(
        foundation.enter(a.headers, a.workspaceId, make([{ name: "Other", hex: "#123456" }])),
      );
      expect(error.reason).toBe("out-of-order");
      expect((await rowsOf(a.projectId)).map((r) => r.payload)).toEqual([
        { lineup: STAND_IN_LINEUP },
      ]);
    });
  });

  // ORV-298 PR 2, rows 18, 23 and 26: the scripts the brand writes in.
  describe("typography saved in the workspace", () => {
    const typed = (projectId: string, scripts: unknown = "thai-latin", over = {}) => ({
      projectId,
      node: "typography",
      kind: "answered",
      payload: { scripts },
      ...over,
    });

    it("saves one row with the answer, made by the session's user", async () => {
      const a = await create("fe-typo-save@example.com", "Fts");
      expect(await foundation.enter(a.headers, a.workspaceId, typed(a.projectId))).toEqual({
        node: "typography",
        kind: "answered",
      });
      const rows = await rowsOf(a.projectId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        node: "typography",
        kind: "answered",
        payload: { scripts: "thai-latin" },
        createdBy: a.user.id,
      });
    });

    it("saves while positioning is skipped or not decided, and opens through the stored schema", async () => {
      for (const setup of ["none", "skipped"] as const) {
        const a = await create(`fe-typo-wait-${setup}@example.com`, "Ftw", setup);
        await foundation.enter(a.headers, a.workspaceId, typed(a.projectId, "latin"));
        const opened = await business.open(a.headers, a.workspaceId, a.projectId);
        expect(opened.foundation).toHaveLength(1);
        expect(opened.foundation[0]).toMatchObject({
          node: "typography",
          kind: "answered",
          payload: { scripts: "latin" },
        });
      }
    });

    it("refuses what the check refuses, writes nothing, and holds the answer out of the error", async () => {
      const a = await create("fe-typo-input@example.com", "Fti");
      for (const bad of [
        typed(a.projectId, "klingon-secret"),
        typed(a.projectId, "thai", { payload: {} }),
        typed(a.projectId, "thai", { kind: "skipped", payload: {} }),
        typed(a.projectId, "thai", { kind: "given" }),
        { ...typed(a.projectId, "thai"), source: "x" },
        {
          projectId: a.projectId,
          node: "typography",
          kind: "answered",
          payload: { scripts: "thai", locale: "th" },
        },
      ]) {
        const error = await refusal(foundation.enter(a.headers, a.workspaceId, bad));
        expect(error.reason).toBe("invalid-input");
        expect(JSON.stringify(error)).not.toContain("klingon-secret");
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("gives a member of B entering on A's project the same not-found as an unknown id", async () => {
      const a = await create("fe-typo-nf-a@example.com", "Fta");
      const b = await signIn("fe-typo-nf-b@example.com", "Ftb");
      const other = await refusal(foundation.enter(b.headers, b.workspaceId, typed(a.projectId)));
      const unknown = await refusal(
        foundation.enter(b.headers, b.workspaceId, typed("00000000-0000-4000-8000-000000000000")),
      );
      expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
      expect(unknown.message).toBe(other.message);
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("refuses a second answer as out-of-order and keeps the stored one unchanged", async () => {
      const a = await create("fe-typo-twice@example.com", "Ftt");
      await foundation.enter(a.headers, a.workspaceId, typed(a.projectId, "thai"));
      const error = await refusal(
        foundation.enter(a.headers, a.workspaceId, typed(a.projectId, "latin")),
      );
      expect(error.reason).toBe("out-of-order");
      expect((await rowsOf(a.projectId)).map((r) => r.payload)).toEqual([{ scripts: "thai" }]);
    });
  });

  // ORV-298 PR 3, rows 29, 31 and 34 (T37): whether the brand needs a small square mark, at the
  // unchanged service. The long-name refusal is `entryAllowed`'s, read from the stored name.
  describe("logo type saved in the workspace", () => {
    const logo = (projectId: string, appIcon: unknown = false, over = {}) => ({
      projectId,
      node: "logo-type",
      kind: "answered",
      payload: { appIcon },
      ...over,
    });
    const named = (projectId: string, name: string) => ({
      projectId,
      node: "name",
      kind: "given",
      payload: { name },
    });

    it("saves one row with the answer, made by the session's user", async () => {
      const a = await create("fe-logo-save@example.com", "Fls");
      await foundation.enter(a.headers, a.workspaceId, named(a.projectId, "ORIVILO"));
      expect(await foundation.enter(a.headers, a.workspaceId, logo(a.projectId, false))).toEqual({
        node: "logo-type",
        kind: "answered",
      });
      const rows = (await rowsOf(a.projectId)).filter((r) => r.node === "logo-type");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        node: "logo-type",
        kind: "answered",
        payload: { appIcon: false },
        createdBy: a.user.id,
      });
    });

    it("saves the answer yes, and saves with no name or no positioning decision", async () => {
      for (const setup of ["agreed", "skipped", "none"] as const) {
        const a = await create(`fe-logo-wait-${setup}@example.com`, "Flw", setup);
        await foundation.enter(a.headers, a.workspaceId, logo(a.projectId, true));
        const opened = await business.open(a.headers, a.workspaceId, a.projectId);
        expect(opened.foundation).toHaveLength(1);
        expect(opened.foundation[0]).toMatchObject({
          node: "logo-type",
          kind: "answered",
          payload: { appIcon: true },
        });
      }
    });

    it("refuses what the check refuses, writes nothing, and holds the answer out of the error", async () => {
      const a = await create("fe-logo-input@example.com", "Fli");
      for (const bad of [
        logo(a.projectId, "klingon-secret"),
        logo(a.projectId, "yes"),
        logo(a.projectId, true, { payload: {} }),
        logo(a.projectId, true, { kind: "skipped", payload: {} }),
        logo(a.projectId, true, { kind: "given" }),
        { ...logo(a.projectId, true), source: "x" },
        { ...logo(a.projectId), payload: { appIcon: true, crowding: false } },
      ]) {
        const error = await refusal(foundation.enter(a.headers, a.workspaceId, bad));
        expect(error.reason).toBe("invalid-input");
        expect(JSON.stringify(error)).not.toContain("klingon-secret");
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("refuses an answer for a long name as out-of-order, writes nothing, and quotes no name", async () => {
      const a = await create("fe-logo-long@example.com", "Fll");
      await foundation.enter(a.headers, a.workspaceId, named(a.projectId, "Chase Manhattan Bank"));
      const error = await refusal(foundation.enter(a.headers, a.workspaceId, logo(a.projectId)));
      expect(error.reason).toBe("out-of-order");
      expect(JSON.stringify(error)).not.toContain("Chase");
      expect((await rowsOf(a.projectId)).map((r) => r.node)).toEqual(["name"]);
    });

    it("takes an answer for a name of twelve and refuses one of thirteen, in grapheme clusters", async () => {
      const twelve = await create("fe-logo-12@example.com", "F12");
      await foundation.enter(
        twelve.headers,
        twelve.workspaceId,
        named(twelve.projectId, "ก".repeat(12)),
      );
      expect(
        await foundation.enter(twelve.headers, twelve.workspaceId, logo(twelve.projectId, true)),
      ).toEqual({ node: "logo-type", kind: "answered" });
      const thirteen = await create("fe-logo-13@example.com", "F13");
      await foundation.enter(
        thirteen.headers,
        thirteen.workspaceId,
        named(thirteen.projectId, "ก".repeat(13)),
      );
      const error = await refusal(
        foundation.enter(thirteen.headers, thirteen.workspaceId, logo(thirteen.projectId, true)),
      );
      expect(error.reason).toBe("out-of-order");
    });

    it("gives a member of B entering on A's project the same not-found as an unknown id", async () => {
      const a = await create("fe-logo-nf-a@example.com", "Fla");
      const b = await signIn("fe-logo-nf-b@example.com", "Flb");
      const other = await refusal(foundation.enter(b.headers, b.workspaceId, logo(a.projectId)));
      const unknown = await refusal(
        foundation.enter(b.headers, b.workspaceId, logo("00000000-0000-4000-8000-000000000000")),
      );
      expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
      expect(unknown.message).toBe(other.message);
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("refuses a second answer as out-of-order and keeps the stored one unchanged", async () => {
      const a = await create("fe-logo-twice@example.com", "Flt");
      await foundation.enter(a.headers, a.workspaceId, logo(a.projectId, false));
      const error = await refusal(
        foundation.enter(a.headers, a.workspaceId, logo(a.projectId, true)),
      );
      expect(error.reason).toBe("out-of-order");
      expect((await rowsOf(a.projectId)).map((r) => r.payload)).toEqual([{ appIcon: false }]);
    });
  });

  // ORV-296 (slice of ORV-291, PR 3), T39, rows 26, 28, 29 and 32 at the unchanged service: the
  // core idea arms reach it through `checkEntry` and `entryAllowed`, and the table's pair and text
  // checks have held the node's pairs since PR 1 (no migration).
  describe("core idea entries", () => {
    const REMEMBER = "กาแฟที่ส่งถึงบ้านทันเวลา";
    const idea = (projectId: string, statement: string, remember?: string) => ({
      projectId,
      node: "core-idea",
      kind: "written",
      payload: remember === undefined ? { statement } : { statement, remember },
    });
    const ideaSkip = (projectId: string) => ({
      projectId,
      node: "core-idea",
      kind: "skipped",
      payload: {},
    });
    const rowsOfIdea = async (projectId: string) =>
      (await rowsOf(projectId)).filter((r) => r.node === "core-idea");

    it("saves a written idea trimmed, with the remember answer, made by the session's user", async () => {
      const a = await create("fe-idea-save@example.com", "Fis");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      expect(
        await foundation.enter(
          a.headers,
          a.workspaceId,
          idea(a.projectId, `  ${STATEMENT}  `, `  ${REMEMBER}  `),
        ),
      ).toEqual({ node: "core-idea", kind: "written" });
      const rows = await rowsOfIdea(a.projectId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        node: "core-idea",
        kind: "written",
        payload: { statement: STATEMENT, remember: REMEMBER },
        createdBy: a.user.id,
      });
    });

    it("saves a written idea with no remember answer as the statement alone, and a skip as {}", async () => {
      const a = await create("fe-idea-bare@example.com", "Fib");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, idea(a.projectId, STATEMENT, "   "));
      expect((await rowsOfIdea(a.projectId))[0]?.payload).toEqual({ statement: STATEMENT });
      const b = await create("fe-idea-skip@example.com", "Fik");
      await foundation.enter(b.headers, b.workspaceId, given(b.projectId));
      await foundation.enter(b.headers, b.workspaceId, ideaSkip(b.projectId));
      expect((await rowsOfIdea(b.projectId)).map((r) => [r.kind, r.payload])).toEqual([
        ["skipped", {}],
      ]);
    });

    it("row 28: a skip, then a written idea: two rows, and open returns the written one first", async () => {
      const a = await create("fe-idea-then@example.com", "Fit");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, ideaSkip(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, idea(a.projectId, STATEMENT));
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.filter((e) => e.node === "core-idea").map((e) => e.kind)).toEqual([
        "written",
        "skipped",
      ]);
    }, 60_000);

    it("row 29: waits while a block cause exists, and saves nothing", async () => {
      // Positioning agreed and no personality entry; no positioning choice; positioning stale.
      const noPersonality = await create("fe-idea-w1@example.com", "Fw1");
      const noPositioning = await create("fe-idea-w2@example.com", "Fw2", "none");
      const stale = await create("fe-idea-w3@example.com", "Fw3");
      await foundation.enter(stale.headers, stale.workspaceId, given(stale.projectId));
      await t.admin.insert(businessIntake).values({
        id: "bi-fe-idea-stale",
        workspaceId: stale.workspaceId,
        projectId: stale.projectId,
        version: "intake-1",
        idea: "a newer idea",
        createdBy: stale.user.id,
        createdAt: new Date(Date.now() + 60_000),
      });
      for (const a of [noPersonality, noPositioning, stale]) {
        for (const entry of [idea(a.projectId, STATEMENT, REMEMBER), ideaSkip(a.projectId)]) {
          const error = await refusal(foundation.enter(a.headers, a.workspaceId, entry));
          expect(error.reason).toBe("out-of-order");
          expect(JSON.stringify(error)).not.toContain(STATEMENT);
        }
        expect(await rowsOfIdea(a.projectId)).toEqual([]);
      }
    });

    it("saves both while positioning is skipped and the personality is given or skipped", async () => {
      const a = await create("fe-idea-ps@example.com", "Fps", "skipped");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, ideaSkip(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, idea(a.projectId, STATEMENT));
      const b = await create("fe-idea-pk@example.com", "Fpk");
      await foundation.enter(b.headers, b.workspaceId, skip(b.projectId));
      await foundation.enter(b.headers, b.workspaceId, idea(b.projectId, STATEMENT));
      expect((await rowsOfIdea(a.projectId)).map((r) => r.kind).sort()).toEqual([
        "skipped",
        "written",
      ]);
      expect((await rowsOfIdea(b.projectId)).map((r) => r.kind)).toEqual(["written"]);
    });

    it("row 32: after a written idea, a written and a skipped entry are refused and the first stays", async () => {
      const a = await create("fe-idea-stays@example.com", "Fiy");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, idea(a.projectId, STATEMENT, REMEMBER));
      for (const entry of [idea(a.projectId, "another idea"), ideaSkip(a.projectId)]) {
        expect((await refusal(foundation.enter(a.headers, a.workspaceId, entry))).reason).toBe(
          "out-of-order",
        );
      }
      const rows = await rowsOfIdea(a.projectId);
      expect(rows.map((r) => [r.kind, r.payload])).toEqual([
        ["written", { statement: STATEMENT, remember: REMEMBER }],
      ]);
      const b = await create("fe-idea-stays2@example.com", "Fy2");
      await foundation.enter(b.headers, b.workspaceId, given(b.projectId));
      await foundation.enter(b.headers, b.workspaceId, ideaSkip(b.projectId));
      expect(
        (await refusal(foundation.enter(b.headers, b.workspaceId, ideaSkip(b.projectId)))).reason,
      ).toBe("out-of-order");
    });

    it("row 32: a member of B entering on A's project gets the same not-found as an unknown id", async () => {
      const a = await create("fe-idea-nf-a@example.com", "Fna");
      const b = await signIn("fe-idea-nf-b@example.com", "Fnb");
      const unknownId = "00000000-0000-4000-8000-000000000000";
      for (const make of [(id: string) => idea(id, STATEMENT), (id: string) => ideaSkip(id)]) {
        const other = await refusal(foundation.enter(b.headers, b.workspaceId, make(a.projectId)));
        const unknown = await refusal(foundation.enter(b.headers, b.workspaceId, make(unknownId)));
        expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
        expect(unknown.message).toBe(other.message);
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("refuses what the check refuses, writes nothing, and holds the idea out of the error", async () => {
      const a = await create("fe-idea-input@example.com", "Fii");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      for (const bad of [
        idea(a.projectId, "   "),
        idea(a.projectId, `SECRET-IDEA-${"x".repeat(301)}`),
        idea(a.projectId, "ok", "x".repeat(2001)),
        { ...idea(a.projectId, "SECRET-IDEA"), kind: "picked" },
        { ...ideaSkip(a.projectId), payload: { statement: "SECRET-IDEA" } },
      ]) {
        const error = await refusal(foundation.enter(a.headers, a.workspaceId, bad));
        expect(error.reason).toBe("invalid-input");
        expect(JSON.stringify(error)).not.toContain("SECRET-IDEA");
      }
      expect(await rowsOfIdea(a.projectId)).toEqual([]);
    });

    it("opens with the four nodes' entries newest first and reads each through the stored schema", async () => {
      const a = await create("fe-idea-open@example.com", "Fio");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, idea(a.projectId, STATEMENT, REMEMBER));
      const opened = await business.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.foundation.map((e) => e.node)).toEqual(["core-idea", "identity-frame"]);
      expect(opened.foundation[0]).toMatchObject({
        kind: "written",
        payload: { statement: STATEMENT, remember: REMEMBER },
      });
    });

    it("shows a core idea row changed outside the app as invalid, never as an idea", async () => {
      const a = await create("fe-idea-tamper@example.com", "Fit2");
      await foundation.enter(a.headers, a.workspaceId, given(a.projectId));
      await foundation.enter(a.headers, a.workspaceId, idea(a.projectId, STATEMENT));
      // The table keeps the text bounds; the stored form refuses a key outside the row.
      await t.admin
        .update(businessFoundationEntry)
        .set({ payload: { statement: STATEMENT, draftId: "d1" } })
        .where(
          and(
            eq(businessFoundationEntry.projectId, a.projectId),
            eq(businessFoundationEntry.node, "core-idea"),
          ),
        );
      const error = await refusal(business.open(a.headers, a.workspaceId, a.projectId));
      expect(error.reason).toBe("invalid-stored");
    });
  });
});
