import { LIMITS, type Limit, type RateLimiter, type Subject } from "@orivilo/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ORV-122 rows 11 and 20: the sign-in limit is checked before Better Auth starts OAuth.
const state = vi.hoisted(() => ({
  result: { ok: true } as
    | { ok: true }
    | { ok: false; reason: "limited"; retryAfter: number }
    | { ok: false; reason: "unavailable" },
  consumed: [] as { limit: Limit; subject: Subject }[],
  signInSocial: vi.fn(),
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
vi.mock("../../server/rate-limit", () => ({
  subjectFromHeaders: () => "ip-1",
  limiter: (): RateLimiter => ({
    async consume(limit, subject) {
      state.consumed.push({ limit, subject });
      return state.result;
    },
  }),
}));

const { signInWithGoogle } = await import("./actions");

beforeEach(() => {
  state.result = { ok: true };
  state.consumed = [];
  state.signInSocial.mockReset().mockResolvedValue({ url: "https://accounts.example/oauth" });
});

describe("signInWithGoogle", () => {
  it("counts the sign-in limit per network, then starts OAuth", async () => {
    await expect(signInWithGoogle()).rejects.toThrow("redirect:https://accounts.example/oauth");
    expect(state.consumed).toEqual([{ limit: LIMITS["sign-in"], subject: { ip: "ip-1" } }]);
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
});
