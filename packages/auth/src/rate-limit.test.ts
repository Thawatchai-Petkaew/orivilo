import type { Db } from "@orivilo/db/client";
import { describe, expect, it } from "vitest";
import {
  assertNested,
  BANGKOK_OFFSET_SECONDS,
  createRateLimiter,
  keyOf,
  LIMITS,
  type Limit,
  retryAfterOf,
  windowOf,
} from "./rate-limit.ts";

const at = (iso: string) => Date.parse(iso);
const secs = (iso: string) => at(iso) / 1000;
const day = { seconds: 86_400, max: 50, offsetSeconds: BANGKOK_OFFSET_SECONDS };

describe("windowOf", () => {
  it("aligns 10 s, 10 minute and hour windows to multiples of their length", () => {
    const now = at("2026-10-26T10:07:33.500Z");
    expect(windowOf({ seconds: 10, max: 1 }, now)).toEqual({
      start: secs("2026-10-26T10:07:30Z"),
      end: secs("2026-10-26T10:07:40Z"),
    });
    expect(windowOf({ seconds: 600, max: 1 }, now)).toEqual({
      start: secs("2026-10-26T10:00:00Z"),
      end: secs("2026-10-26T10:10:00Z"),
    });
    expect(windowOf({ seconds: 3600, max: 1 }, now)).toEqual({
      start: secs("2026-10-26T10:00:00Z"),
      end: secs("2026-10-26T11:00:00Z"),
    });
  });

  it("starts the day at 00:00 Asia/Bangkok, which is 17:00 UTC", () => {
    const before = windowOf(day, at("2026-10-26T16:59:59Z"));
    expect(before).toEqual({
      start: secs("2026-10-25T17:00:00Z"),
      end: secs("2026-10-26T17:00:00Z"),
    });
    const exactly = windowOf(day, at("2026-10-26T17:00:00Z"));
    expect(exactly).toEqual({
      start: secs("2026-10-26T17:00:00Z"),
      end: secs("2026-10-27T17:00:00Z"),
    });
    const late = windowOf(day, at("2026-10-26T23:59:59Z"));
    expect(late.start).toBe(secs("2026-10-26T17:00:00Z"));
  });
});

describe("retryAfterOf", () => {
  it("rounds up and is never below 1", () => {
    const end = secs("2026-10-26T17:00:00Z");
    expect(retryAfterOf(end, at("2026-10-26T16:59:59Z"))).toBe(1);
    expect(retryAfterOf(end, at("2026-10-26T16:59:59.200Z"))).toBe(1);
    expect(retryAfterOf(end, at("2026-10-26T16:59:58.900Z"))).toBe(2);
    expect(retryAfterOf(end, at("2026-10-26T17:00:00Z"))).toBe(1);
    expect(retryAfterOf(end, at("2026-10-26T17:00:05Z"))).toBe(1);
  });
});

describe("assertNested", () => {
  const limit = (...windows: Limit["windows"][number][]): Limit => ({ name: "t", windows });
  it("accepts the hour inside the Bangkok day", () => {
    expect(() => assertNested(limit(day, { seconds: 3600, max: 1 }))).not.toThrow();
  });
  it("rejects a shorter window offset off the longer one's grid", () => {
    expect(() =>
      assertNested(limit({ seconds: 3600, max: 1 }, { seconds: 600, max: 1, offsetSeconds: 300 })),
    ).toThrow(/nest/);
  });
  it("rejects a longer window after a shorter one", () => {
    expect(() => assertNested(limit({ seconds: 600, max: 1 }, { seconds: 3600, max: 1 }))).toThrow(
      /nest/,
    );
  });
});

describe("keyOf", () => {
  const limit: Limit = { name: "ai-read", windows: [] };
  it("keys a person by user id and a network by its subject", () => {
    expect(keyOf(limit, { user: "u1" })).toBe("ai-read:u:u1");
    expect(keyOf(limit, { ip: "abc" })).toBe("ai-read:ip:abc");
  });
});

describe("a store that never settles", () => {
  it("returns unavailable within the timeout, with pruning on", async () => {
    const never = () => new Promise<never>(() => {});
    const db = { execute: never, transaction: never } as unknown as Db;
    const limiter = createRateLimiter({ db, timeoutMs: 50, pruneEveryMs: 0 });
    const started = performance.now();
    const result = await limiter.consume(LIMITS.write, { user: "u" });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
    expect(performance.now() - started).toBeLessThan(50 + 200);
  });
});
