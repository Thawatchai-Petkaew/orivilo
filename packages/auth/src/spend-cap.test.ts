import { type Db } from "@orivilo/db/client";
import { describe, expect, it, vi } from "vitest";
import { Denied } from "./access.ts";
import { AI_SPEND_CAP_MICRO_USD, createSpendCap, monthOf } from "./spend-cap.ts";

/** A database that fails the test if anything touches it. */
const untouchable = new Proxy({} as Db, {
  get(_, key) {
    throw new Error(`the database was used (${String(key)})`);
  },
});

const iso = (nowIso: string) => {
  const { start, end } = monthOf(Date.parse(nowIso));
  return `${start.toISOString()} ${end.toISOString()}`;
};

// ORV-121 spend-cap-2, worked example 1.
describe("monthOf (the Bangkok calendar month)", () => {
  it("gives the two lines of worked example 1", () => {
    expect(iso("2026-10-31T16:59:59Z")).toBe("2026-09-30T17:00:00.000Z 2026-10-31T17:00:00.000Z");
    expect(iso("2026-10-31T17:00:00Z")).toBe("2026-10-31T17:00:00.000Z 2026-11-30T17:00:00.000Z");
  });

  it("starts the month at its first instant and ends it exclusive", () => {
    expect(iso("2026-09-30T17:00:00Z")).toBe("2026-09-30T17:00:00.000Z 2026-10-31T17:00:00.000Z");
    expect(iso("2026-09-30T16:59:59.999Z")).toBe(
      "2026-08-31T17:00:00.000Z 2026-09-30T17:00:00.000Z",
    );
  });

  it("rolls December into January of the next year", () => {
    expect(iso("2026-12-15T05:00:00Z")).toBe("2026-11-30T17:00:00.000Z 2026-12-31T17:00:00.000Z");
    expect(iso("2026-12-31T17:00:00Z")).toBe("2026-12-31T17:00:00.000Z 2027-01-31T17:00:00.000Z");
  });
});

describe("the cap", () => {
  it("is 5 US dollars in millionths", () => {
    expect(AI_SPEND_CAP_MICRO_USD).toBe(5_000_000);
  });
});

// The paths that never reach a workspace query, so no database is needed.
describe("createSpendCap before any query", () => {
  const charge = { workspaceId: "ws-a", userId: "u-1" };
  const entry = { job: "interpret", model: "m", costMicroUsd: 1 } as const;

  it("check throws Denied without a session", async () => {
    const cap = createSpendCap({ access: { db: untouchable, getSession: async () => null } });
    await expect(cap.check(new Headers(), "ws-a")).rejects.toMatchObject({
      status: 401,
      reason: "no-session",
    });
    await expect(cap.check(new Headers(), "ws-a")).rejects.toBeInstanceOf(Denied);
  });

  it.each([null, undefined, ""])("check throws Denied for the workspace %s", async (id) => {
    const cap = createSpendCap({
      access: { db: untouchable, getSession: async () => ({ user: { id: "u-1" } }) },
    });
    await expect(cap.check(new Headers(), id)).rejects.toMatchObject({
      status: 403,
      reason: "no-workspace",
    });
  });

  it("check answers unavailable when the session read hangs past timeoutMs", async () => {
    const cap = createSpendCap({
      access: { db: untouchable, getSession: () => new Promise(() => {}) },
      timeoutMs: 50,
    });
    expect(await cap.check(new Headers(), "ws-a")).toEqual({ ok: false, reason: "unavailable" });
  });

  it("check answers unavailable when the session read fails", async () => {
    const cap = createSpendCap({
      access: {
        db: untouchable,
        getSession: async () => {
          throw new Error("boom");
        },
      },
    });
    expect(await cap.check(new Headers(), "ws-a")).toEqual({ ok: false, reason: "unavailable" });
  });

  it("record rejects when the session read hangs past timeoutMs", async () => {
    const cap = createSpendCap({
      access: { db: untouchable, getSession: () => new Promise(() => {}) },
      timeoutMs: 50,
    });
    await expect(cap.record(new Headers(), charge, [entry])).rejects.toThrow();
  });

  it("record with no entries does nothing and reads no session", async () => {
    const getSession = vi.fn();
    const cap = createSpendCap({ access: { db: untouchable, getSession } });
    await expect(cap.record(new Headers(), charge, [])).resolves.toBeUndefined();
    expect(getSession).not.toHaveBeenCalled();
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "record rejects the cost %s before it touches the database",
    async (costMicroUsd) => {
      const getSession = vi.fn();
      const cap = createSpendCap({ access: { db: untouchable, getSession } });
      await expect(
        cap.record(new Headers(), charge, [entry, { ...entry, costMicroUsd }]),
      ).rejects.toThrow();
      expect(getSession).not.toHaveBeenCalled();
    },
  );
});
