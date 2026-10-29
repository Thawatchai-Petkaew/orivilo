import { aiUsage, eq, member, organization, sql, user } from "@orivilo/db";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSpendCap, monthOf } from "./spend-cap.ts";

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

  beforeAll(async () => {
    t = await createTestDatabase();
    const at = new Date(NOW);
    await t.admin.insert(user).values([
      { id: "u-1", name: "One", email: "one@example.com" },
      { id: "u-2", name: "Two", email: "two@example.com" },
    ]);
    await t.admin.insert(organization).values(
      ["ws-a", "ws-b", "ws-sum", "ws-big", "ws-rec", "ws-lock", "ws-empty", "ws-dead"].map(
        (id) => ({
          id,
          name: id,
          slug: id,
          createdAt: at,
        }),
      ),
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
    it("writes Access's ids, the injected time, the job, the model and the amounts", async () => {
      sessionUser = "u-1";
      const cap = capWith(5_000_000);
      await cap.record(headers, { workspaceId: "ws-rec", userId: "ignored-by-the-helper" }, [
        { job: "interpret", model: "anthropic/claude-sonnet-5.5", costMicroUsd: 14_000 },
        { job: "chat", model: "anthropic/claude-sonnet-5.5", costMicroUsd: null },
      ]);
      const rows = (await rowsOf("ws-rec")).sort((x, y) => x.job.localeCompare(y.job));
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.id)).toEqual([expect.any(String), expect.any(String)]);
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
      sessionUser = "u-1";
      await capWith(1).record(headers, { workspaceId: "ws-empty", userId: "u-1" }, [
        { job: "interpret", model: "m-zero", costMicroUsd: 0 },
      ]);
      const zero = (await rowsOf("ws-empty")).find((r) => r.model === "m-zero");
      expect(zero?.costMicroUsd).toBe(0);
    });

    it("writes nothing when one entry is invalid", async () => {
      sessionUser = "u-1";
      const count = (await rowsOf("ws-a")).length;
      await expect(
        capWith(1).record(headers, { workspaceId: "ws-a", userId: "u-1" }, [
          { job: "interpret", model: "m", costMicroUsd: 5 },
          { job: "interpret", model: "m", costMicroUsd: -1 },
        ]),
      ).rejects.toThrow();
      expect(await rowsOf("ws-a")).toHaveLength(count);
    });

    it("is charged to the workspace the check passed, not the session's other one", async () => {
      sessionUser = "u-1";
      await capWith(1).record(headers, { workspaceId: "ws-b", userId: "u-1" }, [
        { job: "interpret", model: "m-for-b", costMicroUsd: 1 },
      ]);
      expect((await rowsOf("ws-b")).some((r) => r.model === "m-for-b")).toBe(true);
      expect((await rowsOf("ws-a")).some((r) => r.model === "m-for-b")).toBe(false);
    });

    it("rejects with Denied for a workspace the person is no longer a member of", async () => {
      sessionUser = "u-2";
      await expect(
        capWith(1).record(headers, { workspaceId: "ws-a", userId: "u-2" }, [
          { job: "interpret", model: "m-denied", costMicroUsd: 1 },
        ]),
      ).rejects.toMatchObject({ name: "Denied", reason: "not-a-member" });
      expect((await rowsOf("ws-a")).some((r) => r.model === "m-denied")).toBe(false);
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
        sessionUser = "u-1";
        const unlock = await lockTable();
        try {
          const started = performance.now();
          await expect(
            capWith(5_000_000, 300).record(headers, { workspaceId: "ws-lock", userId: "u-1" }, [
              { job: "interpret", model: "m", costMicroUsd: 1 },
            ]),
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
