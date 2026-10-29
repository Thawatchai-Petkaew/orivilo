import { LIMITS, type Limit } from "@orivilo/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-122 rows 11 and 20: the sign-in limit is checked before Better Auth starts OAuth.
const state = vi.hoisted(() => ({
  result: { ok: true } as
    | { ok: true }
    | { ok: false; reason: "limited"; retryAfter: number }
    | { ok: false; reason: "unavailable" },
  consumed: [] as Limit[],
  signInSocial: vi.fn(),
  // When set, replaces the count: a non-async function that throws, or an async one that rejects.
  consume: null as null | (() => unknown),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("../../server/auth", () => ({
  auth: () => ({ api: { signInSocial: state.signInSocial } }),
}));
vi.mock("../../server/sign-in-limit", () => ({
  consumeSignIn: () => {
    if (state.consume) return state.consume();
    return (async () => {
      state.consumed.push(LIMITS["sign-in"]);
      return state.result;
    })();
  },
}));

const { signInWithGoogle } = await import("./actions");

beforeEach(() => {
  state.result = { ok: true };
  state.consumed = [];
  state.consume = null;
  state.signInSocial.mockReset().mockResolvedValue({ url: "https://accounts.example/oauth" });
});

afterEach(() => vi.restoreAllMocks());

describe("signInWithGoogle", () => {
  it("counts the sign-in limit per network, then starts OAuth", async () => {
    await expect(signInWithGoogle()).rejects.toThrow("redirect:https://accounts.example/oauth");
    expect(state.consumed).toEqual([LIMITS["sign-in"]]);
    expect(state.signInSocial).toHaveBeenCalledOnce();
  });

  it("sign-in over the limit does not start OAuth", async () => {
    state.result = { ok: false, reason: "limited", retryAfter: 180 };
    expect(await signInWithGoogle()).toEqual({
      error: "rate-limited",
      retryAfter: 180,
    });
    expect(state.signInSocial).not.toHaveBeenCalled();
  });

  it("sign-in fails closed", async () => {
    state.result = { ok: false, reason: "unavailable" };
    expect(await signInWithGoogle()).toEqual({ error: "failed" });
    expect(state.signInSocial).not.toHaveBeenCalled();
  });

  // ORV-123 rows 1 and 2: orv123-count-guard and orv123-log-line.
  it("a count that throws or rejects returns failed and logs once", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const counts = [
      // Not async: throws before it returns a promise.
      () => {
        throw new Error("secret detail");
      },
      async () => Promise.reject(new Error("secret detail")),
    ];
    for (const [index, count] of counts.entries()) {
      state.consume = count;
      expect(await signInWithGoogle()).toEqual({ error: "failed" });
      expect(state.signInSocial).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledTimes(index + 1);
      const line = String(log.mock.calls[index]?.[0]);
      expect(JSON.parse(line)).toEqual({
        level: "error",
        route: "account/sign-in",
        outcome: "unavailable",
      });
      expect(line).not.toContain("secret detail");
    }
  });

  it("a count that answers unavailable adds no line here", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    state.result = { ok: false, reason: "unavailable" };
    await signInWithGoogle();
    expect(log).not.toHaveBeenCalled();
  });

  it("an error from signInSocial passes through the guard", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    state.signInSocial.mockRejectedValue(new Error("oauth down"));
    await expect(signInWithGoogle()).rejects.toThrow("oauth down");
    expect(log).not.toHaveBeenCalled();
  });
});
