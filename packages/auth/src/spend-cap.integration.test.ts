import { aiUsage, eq, member, organization, sql, user } from "@orivilo/db";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Charge, createSpendCap, monthOf, type SpendCap } from "./spend-cap.ts";

// ORV-121 spend-cap-1 to spend-cap-7 for the helper, against a throwaway database as orivilo_app.
const NOW = Date.parse("2026-10-15T05:00:00Z");
const { start, end } = monthOf(NOW);
// A lock-wait test waits out a 300 ms bound and then polls; sized for a slow runner, not the Mac.
const LOCK_TIMEOUT = 30_000;
const shifted = (ms: number, from: Date) => new Date(from.getTime() + ms);

describe.runIf(HAS_TEST_DATABASE)("the spend cap helper", () => {
  let t: TestDatabase;
  // Who the fake session names; each test sets it.
  let sessionUser: string | null = "u-1";
  const getSession = async () => (sessionUser ? { user: { id: sessionUser } } : null);
  const capWith = (capMicroUsd: number, timeoutMs = 2_000) =>
    createSpendCap({
      access: { db: t.app, getSession },
      now: () => NOW,
      capMicroUsd,
      timeoutMs,
    });
  const headers = new Headers();
  // A cap that never caps, so its `check` always issues a charge; `record` needs the same instance.
  const openCap = (timeoutMs = 2_000) => capWith(Number.MAX_SAFE_INTEGER - 1, timeoutMs);
  // A charge only `check` makes: `check` as u-1 in `workspaceId`.
  const chargeFor = async (cap: SpendCap, workspaceId: string) => {
    sessionUser = "u-1";
    const checked = await cap.check(headers, workspaceId);
    if (!checked.ok) throw new Error(`no charge: ${checked.reason}`);
    return checked.charge;
  };

  beforeAll(async () => {
    t = await createTestDatabase();
    const at = new Date(NOW);
    await t.admin.insert(user).values([
      { id: "u-1", name: "One", email: "one@example.com" },
      { id: "u-2", name: "Two", email: "two@example.com" },
    ]);
    await t.admin.insert(organization).values(
      [
        "ws-a",
        "ws-b",
        "ws-sum",
        "ws-big",
        "ws-rec",
        "ws-lock",
        "ws-empty",
        "ws-dead",
        "ws-gone-session",
        "ws-gone-member",
        "ws-twice",
        "ws-deleted",
      ].map((id) => ({
        id,
        name: id,
        slug: id,
        createdAt: at,
      })),
    );
    await t.admin.insert(member).values([
      { id: "m-a", organizationId: "ws-a", userId: "u-1", role: "member", createdAt: at },
      { id: "m-b2", organizationId: "ws-b", userId: "u-2", role: "member", createdAt: at },
      { id: "m-b1", organizationId: "ws-b", userId: "u-1", role: "member", createdAt: at },
      { id: "m-sum", organizationId: "ws-sum", userId: "u-1", role: "member", createdAt: at },
      { id: "m-big", organizationId: "ws-big", userId: "u-1", role: "member", createdAt: at },
      { id: "m-rec", organizationId: "ws-rec", userId: "u-1", role: "member", createdAt: at },
      { id: "m-lock", organizationId: "ws-lock", userId: "u-1", role: "member", createdAt: at },
      { id: "m-empty", organizationId: "ws-empty", userId: "u-1", role: "member", createdAt: at },
      { id: "m-dead", organizationId: "ws-dead", userId: "u-1", role: "member", createdAt: at },
      {
        id: "m-gone-session",
        organizationId: "ws-gone-session",
        userId: "u-1",
        role: "member",
        createdAt: at,
      },
      {
        id: "m-gone-member",
        organizationId: "ws-gone-member",
        userId: "u-1",
        role: "member",
        createdAt: at,
      },
      {
        id: "m-deleted",
        organizationId: "ws-deleted",
        userId: "u-1",
        role: "member",
        createdAt: at,
      },
      { id: "m-twice", organizationId: "ws-twice", userId: "u-1", role: "member", createdAt: at },
    ]);
    const row = (id: string, workspaceId: string, cost: number | null, createdAt: Date) => ({
      id,
      workspaceId,
      userId: "u-1",
      job: "interpret",
      model: "m",
      costMicroUsd: cost,
      createdAt,
    });
    await t.admin.insert(aiUsage).values([
      // ws-sum: 1_000_000 at the first instant, 2_000_000 mid month, a null, and two outside.
      row("s1", "ws-sum", 1_000_000, start),
      row("s2", "ws-sum", 2_000_000, at),
      row("s3", "ws-sum", null, at),
      row("s4", "ws-sum", 7_000_000, shifted(-1, start)),
      row("s5", "ws-sum", 7_000_000, end),
      // Another workspace in the same month.
      row("s6", "ws-b", 9_000_000, at),
      // ws-big: two amounts whose sum passes the safe integers.
      row("b1", "ws-big", 9_000_000_000_000_000, at),
      row("b2", "ws-big", 9_000_000_000_000_000, at),
    ]);
  }, 60_000);

  afterAll(async () => {
    await t?.drop();
  });

  const rowsOf = (workspaceId: string) =>
    t.admin.select().from(aiUsage).where(eq(aiUsage.workspaceId, workspaceId));

  describe("check", () => {
    it("sums only this workspace's records in this month and skips nulls", async () => {
      sessionUser = "u-1";
      // The sum is exactly 3_000_000: at the cap and above it is capped, one below it is ok.
      expect(await capWith(3_000_000).check(headers, "ws-sum")).toEqual({
        ok: false,
        reason: "capped",
      });
      expect(await capWith(2_999_999).check(headers, "ws-sum")).toEqual({
        ok: false,
        reason: "capped",
      });
      expect(await capWith(3_000_001).check(headers, "ws-sum")).toEqual({
        ok: true,
        charge: { workspaceId: "ws-sum", userId: "u-1" },
      });
    });

    it("counts the first instant of the month and not the first instant of the next", async () => {
      sessionUser = "u-1";
      // Without the record at `start` the sum is 2_000_000; with the one at `end` it is 10_000_000.
      expect(await capWith(2_000_001).check(headers, "ws-sum")).toMatchObject({
        ok: false,
        reason: "capped",
      });
      expect(await capWith(10_000_000).check(headers, "ws-sum")).toMatchObject({ ok: true });
    });

    it("issues a frozen charge", async () => {
      expect(Object.isFrozen(await chargeFor(openCap(), "ws-empty"))).toBe(true);
    });

    it("a workspace with no records is ok and charges the session's person", async () => {
      sessionUser = "u-1";
      expect(await capWith(1).check(headers, "ws-empty")).toEqual({
        ok: true,
        charge: { workspaceId: "ws-empty", userId: "u-1" },
      });
    });

    it("is per workspace: another workspace's records do not count", async () => {
      sessionUser = "u-1";
      // ws-b holds 9_000_000; ws-a holds nothing.
      expect(await capWith(1).check(headers, "ws-a")).toMatchObject({ ok: true });
      expect(await capWith(9_000_000).check(headers, "ws-b")).toMatchObject({
        ok: false,
        reason: "capped",
      });
    });

    it("scopes its own query by workspace, not only through row security", async () => {
      sessionUser = "u-1";
      // The owner role is not held back by row security, so only the query's own filter separates
      // ws-a (no records) from ws-b (9_000_000).
      const cap = createSpendCap({
        access: { db: t.admin, getSession },
        now: () => NOW,
        capMicroUsd: 1,
      });
      expect(await cap.check(headers, "ws-a")).toMatchObject({ ok: true });
      expect(await cap.check(headers, "ws-b")).toMatchObject({ ok: false, reason: "capped" });
    });

    it("throws Denied without a session", async () => {
      sessionUser = null;
      await expect(capWith(1).check(headers, "ws-a")).rejects.toMatchObject({
        name: "Denied",
        status: 401,
      });
    });

    it("throws Denied without an active workspace", async () => {
      sessionUser = "u-1";
      await expect(capWith(1).check(headers, null)).rejects.toMatchObject({
        name: "Denied",
        reason: "no-workspace",
      });
    });

    it("throws Denied for a workspace the person is not a member of", async () => {
      sessionUser = "u-2";
      await expect(capWith(1).check(headers, "ws-a")).rejects.toMatchObject({
        name: "Denied",
        reason: "not-a-member",
      });
    });

    it("answers unavailable when the sum is not a safe integer", async () => {
      sessionUser = "u-1";
      expect(await capWith(Number.MAX_SAFE_INTEGER).check(headers, "ws-big")).toEqual({
        ok: false,
        reason: "unavailable",
      });
    });

    it("answers unavailable when the database is gone", async () => {
      sessionUser = "u-1";
      const dead = await createTestDatabase();
      await dead.app.$client.end();
      const cap = createSpendCap({ access: { db: dead.app, getSession }, now: () => NOW });
      try {
        expect(await cap.check(headers, "ws-dead")).toEqual({ ok: false, reason: "unavailable" });
      } finally {
        await dead.drop();
      }
    });
  });

  describe("record", () => {
    it("writes the charge's ids, the injected time, the job, the model and the amounts", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-rec");
      await cap.record(charge, [
        { job: "interpret", model: "anthropic/claude-sonnet-5.5", costMicroUsd: 14_000 },
        { job: "chat", model: "anthropic/claude-sonnet-5.5", costMicroUsd: null },
      ]);
      const rows = (await rowsOf("ws-rec")).sort((x, y) => x.job.localeCompare(y.job));
      expect(rows).toHaveLength(2);
      expect(new Set(rows.map((r) => r.id)).size).toBe(2);
      expect(rows[0]).toMatchObject({
        workspaceId: "ws-rec",
        userId: "u-1",
        job: "chat",
        model: "anthropic/claude-sonnet-5.5",
        costMicroUsd: null,
        currency: "USD",
        createdAt: new Date(NOW),
      });
      expect(rows[1]).toMatchObject({
        workspaceId: "ws-rec",
        userId: "u-1",
        job: "interpret",
        costMicroUsd: 14_000,
        currency: "USD",
        createdAt: new Date(NOW),
      });
    });

    it("a recorded cost counts in the next check and a null adds nothing", async () => {
      sessionUser = "u-1";
      // ws-rec holds 14_000 and a null from the test above.
      expect(await capWith(14_000).check(headers, "ws-rec")).toMatchObject({
        ok: false,
        reason: "capped",
      });
      expect(await capWith(14_001).check(headers, "ws-rec")).toMatchObject({ ok: true });
    });

    it("stores a reported cost of 0 as 0, not as not reported", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-empty");
      await cap.record(charge, [{ job: "interpret", model: "m-zero", costMicroUsd: 0 }]);
      const zero = (await rowsOf("ws-empty")).find((r) => r.model === "m-zero");
      expect(zero?.costMicroUsd).toBe(0);
    });

    it("writes nothing for no entries", async () => {
      const before = (await rowsOf("ws-a")).length;
      const cap = openCap();
      await expect(cap.record(await chargeFor(cap, "ws-a"), [])).resolves.toBeUndefined();
      expect(await rowsOf("ws-a")).toHaveLength(before);
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
      "writes nothing when one entry has the cost %s",
      async (costMicroUsd) => {
        const count = (await rowsOf("ws-a")).length;
        const cap = openCap();
        await expect(
          cap.record(await chargeFor(cap, "ws-a"), [
            { job: "interpret", model: "m", costMicroUsd: 5 },
            { job: "interpret", model: "m", costMicroUsd },
          ]),
        ).rejects.toThrow();
        expect(await rowsOf("ws-a")).toHaveLength(count);
      },
    );

    it("is charged to the workspace the check passed, not the session's other one", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-b");
      await cap.record(charge, [{ job: "interpret", model: "m-for-b", costMicroUsd: 1 }]);
      expect((await rowsOf("ws-b")).some((r) => r.model === "m-for-b")).toBe(true);
      expect((await rowsOf("ws-a")).some((r) => r.model === "m-for-b")).toBe(false);
    });

    // SEC-1: the record reads no session, so nothing that happens to the caller after `check`
    // keeps a paid request out of the sum.
    it("record writes the charge after the session is deleted", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-gone-session");
      sessionUser = null;
      await cap.record(charge, [{ job: "interpret", model: "m-no-session", costMicroUsd: 7 }]);
      expect(await rowsOf("ws-gone-session")).toEqual([
        expect.objectContaining({
          workspaceId: "ws-gone-session",
          userId: "u-1",
          model: "m-no-session",
          costMicroUsd: 7,
        }),
      ]);
    });

    it("record writes the charge after the membership is removed", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-gone-member");
      await t.admin.delete(member).where(eq(member.id, "m-gone-member"));
      sessionUser = "u-1";
      // The person is no longer a member: a check now is refused, the earlier charge still records.
      await expect(cap.check(headers, "ws-gone-member")).rejects.toMatchObject({
        name: "Denied",
        reason: "not-a-member",
      });
      await cap.record(charge, [{ job: "interpret", model: "m-no-member", costMicroUsd: 8 }]);
      expect(await rowsOf("ws-gone-member")).toEqual([
        expect.objectContaining({
          workspaceId: "ws-gone-member",
          userId: "u-1",
          model: "m-no-member",
          costMicroUsd: 8,
        }),
      ]);
    });

    it("record refuses a charge used twice and writes one row", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-twice");
      await cap.record(charge, [{ job: "interpret", model: "m-twice", costMicroUsd: 3 }]);
      await expect(
        cap.record(charge, [{ job: "interpret", model: "m-twice", costMicroUsd: 3 }]),
      ).rejects.toThrow("not issued");
      expect(await rowsOf("ws-twice")).toHaveLength(1);
    });

    it("record refuses a charge another spend cap issued", async () => {
      const charge = await chargeFor(openCap(), "ws-twice");
      const other = openCap();
      await expect(
        other.record(charge, [{ job: "interpret", model: "m-other", costMicroUsd: 3 }]),
      ).rejects.toThrow("not issued");
      expect((await rowsOf("ws-twice")).some((r) => r.model === "m-other")).toBe(false);
    });

    it("record refuses a forged charge and writes nothing", async () => {
      const before = (await rowsOf("ws-a")).length;
      const forged = { workspaceId: "ws-a", userId: "u-1" } as unknown as Charge;
      await expect(
        openCap().record(forged, [{ job: "interpret", model: "m-forged", costMicroUsd: 1 }]),
      ).rejects.toThrow("not issued");
      expect(await rowsOf("ws-a")).toHaveLength(before);
    });

    it("rejects when the workspace was deleted after the check and writes nothing", async () => {
      const cap = openCap();
      const charge = await chargeFor(cap, "ws-deleted");
      await t.admin.delete(organization).where(eq(organization.id, "ws-deleted"));
      await expect(
        cap.record(charge, [{ job: "interpret", model: "m-dead", costMicroUsd: 1 }]),
      ).rejects.toThrow();
      expect(await rowsOf("ws-deleted")).toHaveLength(0);
    });
  });

  describe("when the table is locked", () => {
    const waiters = async () => {
      const rows = await t.admin.execute(
        sql`select count(*)::int as n from pg_stat_activity
            where datname = current_database() and usename = 'orivilo_app' and wait_event_type = 'Lock'`,
      );
      return Number((rows[0] as { n: number }).n);
    };

    // Holds ACCESS EXCLUSIVE on ai_usage until `release` is called.
    const lockTable = async () => {
      let release!: () => void;
      const held = new Promise<void>((resolve) => (release = resolve));
      let locked!: () => void;
      const ready = new Promise<void>((resolve) => (locked = resolve));
      const tx = t.admin.transaction(async (inner) => {
        await inner.execute(sql`lock table ai_usage in access exclusive mode`);
        locked();
        await held;
      });
      await ready;
      return async () => {
        release();
        await tx;
      };
    };

    it(
      "check answers unavailable within timeoutMs and leaves no waiting query",
      async () => {
        sessionUser = "u-1";
        const unlock = await lockTable();
        try {
          const started = performance.now();
          const result = await capWith(5_000_000, 300).check(headers, "ws-lock");
          const elapsed = performance.now() - started;
          expect(result).toEqual({ ok: false, reason: "unavailable" });
          // Sized for a slow runner: the bound is 300 ms.
          expect(elapsed).toBeLessThan(3_000);
          // The database stopped the waiting query at the same bound, while the lock is still held.
          await expect.poll(waiters, { timeout: 5_000 }).toBe(0);
        } finally {
          await unlock();
        }
      },
      LOCK_TIMEOUT,
    );

    it(
      "record rejects within timeoutMs, leaves no waiting query and writes nothing",
      async () => {
        const cap = openCap(300);
        const charge = await chargeFor(cap, "ws-lock");
        const unlock = await lockTable();
        try {
          const started = performance.now();
          await expect(
            cap.record(charge, [{ job: "interpret", model: "m", costMicroUsd: 1 }]),
          ).rejects.toThrow();
          expect(performance.now() - started).toBeLessThan(3_000);
          await expect.poll(waiters, { timeout: 5_000 }).toBe(0);
        } finally {
          await unlock();
        }
        expect(await rowsOf("ws-lock")).toHaveLength(0);
      },
      LOCK_TIMEOUT,
    );
  });
});
