import { eq, rateLimitCounter, sql } from "@orivilo/db";
import { createDb, type Db } from "@orivilo/db/client";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { clientIp } from "./client-ip.ts";
import {
  BANGKOK_OFFSET_SECONDS,
  createRateLimiter,
  LIMITS,
  type Limit,
  type RateLimiter,
} from "./rate-limit.ts";

// ORV-112 AC 1 to 4, 14, 15, 17 and 22: two limiter instances on two pools, one store.
describe.runIf(HAS_TEST_DATABASE)("the shared rate limit store", () => {
  let t: TestDatabase;
  let poolB: Db;
  let a: RateLimiter;
  let b: RateLimiter;
  // 1 s after an aligned minute and hour.
  let clock = Date.parse("2026-10-26T10:00:01Z");
  const now = () => clock;

  beforeAll(async () => {
    t = await createTestDatabase();
    poolB = createDb(t.appUrl);
    a = createRateLimiter({ db: t.app, now, pruneEveryMs: 60_000 });
    b = createRateLimiter({ db: poolB, now, pruneEveryMs: 60_000 });
  }, 60_000);

  afterAll(async () => {
    await poolB?.$client.end();
    await t?.drop();
  });

  const rows = (key: string) =>
    t.admin.select().from(rateLimitCounter).where(eq(rateLimitCounter.key, key));
  const per = (seconds: number, max: number, name = "t"): Limit => ({
    name,
    windows: [{ seconds, max }],
  });

  it("two instances share one store", async () => {
    const limit = per(60, 2);
    const u = { user: "u-share" };
    expect(await a.consume(limit, u)).toEqual({ ok: true });
    expect(await b.consume(limit, u)).toEqual({ ok: true });
    const third = await a.consume(limit, u);
    expect(third).toMatchObject({ ok: false, reason: "limited" });
    if (!third.ok && third.reason === "limited") {
      expect(third.retryAfter).toBeGreaterThanOrEqual(1);
      expect(third.retryAfter).toBeLessThanOrEqual(60);
    }
    const found = await rows("t:u:u-share");
    expect(found).toHaveLength(1);
    expect(found[0]?.count).toBe(2);
  });

  it("racing instances never pass more than max", async () => {
    const limit = per(60, 5);
    for (let round = 0; round < 20; round++) {
      const u = { user: `race-${round}` };
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? a : b).consume(limit, u)),
      );
      expect(results.filter((r) => r.ok)).toHaveLength(5);
      expect(results.filter((r) => !r.ok)).toHaveLength(5);
      expect((await rows(`t:u:race-${round}`))[0]?.count).toBe(5);
    }
  });

  it("racing on two windows stays all or none", async () => {
    const limit: Limit = {
      name: "t2",
      windows: [
        { seconds: 3600, max: 6 },
        { seconds: 60, max: 4 },
      ],
    };
    const u = { user: "race-two" };
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? a : b).consume(limit, u)),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(4);
    const found = await rows("t2:u:race-two");
    expect(found.map((r) => r.count)).toEqual([4, 4]);
  });

  it("a refused call does not count, a new window starts fresh", async () => {
    const limit = per(60, 2);
    const u = { user: "u-fresh" };
    await a.consume(limit, u);
    await b.consume(limit, u);
    for (let i = 0; i < 3; i++) {
      expect(await a.consume(limit, u)).toMatchObject({ ok: false, reason: "limited" });
    }
    expect((await rows("t:u:u-fresh"))[0]?.count).toBe(2);
    const before = clock;
    try {
      clock = Math.floor(clock / 60_000) * 60_000 + 60_000;
      expect(await a.consume(limit, u)).toEqual({ ok: true });
      const found = await rows("t:u:u-fresh");
      expect(found.map((r) => r.count).sort()).toEqual([1, 2]);
    } finally {
      clock = before;
    }
  });

  it("every window or none", async () => {
    const limit: Limit = {
      name: "t3",
      windows: [
        { seconds: 86_400, max: 3, offsetSeconds: BANGKOK_OFFSET_SECONDS },
        { seconds: 3600, max: 2 },
      ],
    };
    const u = { user: "u-all" };
    const before = clock;
    try {
      clock = Date.parse("2026-10-26T03:00:01Z"); // 10:00:01 Bangkok
      expect(await a.consume(limit, u)).toEqual({ ok: true });
      expect(await b.consume(limit, u)).toEqual({ ok: true });
      const third = await a.consume(limit, u);
      // To 11:00 Bangkok, the end of the hour: 3599 s.
      expect(third).toEqual({ ok: false, reason: "limited", retryAfter: 3599 });
      expect((await rows("t3:u:u-all")).map((r) => r.count).sort()).toEqual([2, 2]);

      clock += 3_600_000;
      expect(await a.consume(limit, u)).toEqual({ ok: true });
      const fourth = await a.consume(limit, u);
      // Day is full (3). To 00:00 Bangkok = 17:00Z, from 04:00:01Z: 46799 s.
      expect(fourth).toEqual({ ok: false, reason: "limited", retryAfter: 46_799 });
      const found = await rows("t3:u:u-all");
      // Day row 3, first hour row 2, second hour row 1; the refused call raised none.
      expect(found.map((r) => r.count).sort()).toEqual([1, 2, 3]);
    } finally {
      clock = before;
    }
  });

  it("the hour and the day never share a row", async () => {
    const before = clock;
    try {
      clock = Date.parse("2026-10-26T17:00:00Z");
      expect(await a.consume(LIMITS["ai-read"], { user: "u-boundary" })).toEqual({ ok: true });
      const found = await rows("ai-read:u:u-boundary");
      expect(found).toHaveLength(2);
      expect(found[0]?.windowStart).toBe(found[1]?.windowStart);
      expect(found[0]?.windowEnd).not.toBe(found[1]?.windowEnd);
      expect(found.map((r) => r.count)).toEqual([1, 1]);
    } finally {
      clock = before;
    }
  });

  it("no raw IP is stored", async () => {
    const ip = "203.0.113.7";
    const subject = clientIp(
      new Headers({ "x-forwarded-for": ip }),
      { VERCEL_ENV: "production" },
      "secret",
    );
    await a.consume(per(60, 5, "ipt"), { ip: subject });
    await a.consume(per(60, 5, "ipt"), { ip: "local" });
    await a.consume(per(60, 5, "ipt"), { ip: "unknown" });
    const keys = (await t.admin.select({ key: rateLimitCounter.key }).from(rateLimitCounter)).map(
      (r) => r.key,
    );
    expect(keys.some((k) => k.includes(ip))).toBe(false);
    const ipKeys = keys.filter((k) => k.includes(":ip:"));
    expect(ipKeys.length).toBeGreaterThanOrEqual(3);
    for (const k of ipKeys) expect(k).toMatch(/:ip:([0-9a-f]{64}|local|unknown)$/);
  });

  it("expired rows are pruned", async () => {
    const t0 = Math.floor(clock / 1000);
    await t.admin.insert(rateLimitCounter).values([
      { key: "old:u:x", windowStart: t0 - 90_000, windowEnd: t0 - 86_401, count: 1 },
      { key: "open:u:x", windowStart: t0 - 30, windowEnd: t0 + 30, count: 1 },
    ]);
    const pruning = createRateLimiter({ db: t.app, now, pruneEveryMs: 0 });
    await pruning.consume(per(60, 5, "prune"), { user: "p" });
    // The prune runs behind the call, so wait for it.
    await vi.waitFor(async () => expect(await rows("old:u:x")).toHaveLength(0));
    expect(await rows("open:u:x")).toHaveLength(1);
  });

  it("the store fails closed", async () => {
    const dead = createDb(t.appUrl);
    await dead.$client.end();
    const events: string[] = [];
    const broken = createRateLimiter({
      db: dead,
      now,
      onResult: (r) => events.push(r.outcome),
    });
    expect(await broken.consume(per(60, 5, "dead"), { user: "d" })).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(await broken.consume(LIMITS["ai-read"], { user: "d" })).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(events).toEqual(["unavailable", "unavailable"]);
  });

  it("a locked table is unavailable within the bound, and the database drops the work", async () => {
    const limiter = createRateLimiter({ db: t.app, now, timeoutMs: 200, pruneEveryMs: 0 });
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    let locked!: () => void;
    const lockTaken = new Promise<void>((r) => (locked = r));
    const holder = t.admin.transaction(async (tx) => {
      await tx.execute(sql`LOCK TABLE rate_limit_counter IN ACCESS EXCLUSIVE MODE`);
      locked();
      await held;
    });
    await lockTaken;
    const started = Date.now();
    const result = await limiter.consume(per(60, 5, "locked"), { user: "l" });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
    expect(Date.now() - started).toBeLessThan(1_000);
    // Past the lock timeout the database has cancelled the upsert, so releasing the lock
    // does not let a late commit count the refused call.
    await new Promise((r) => setTimeout(r, 400));
    release();
    await holder;
    await new Promise((r) => setTimeout(r, 300));
    expect(await rows("locked:u:l")).toEqual([]);
  });
});
