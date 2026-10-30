import { LIMITS, type Limit } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-122 rows 11 and 20: the sign-in limit is checked before Better Auth starts OAuth.
const state = vi.hoisted(() => ({
  result: { ok: true } as
    | { ok: true }
    | { ok: false; reason: "limited"; retryAfter: number }
    | { ok: false; reason: "unavailable" },
  consumed: [] as Limit[],
  signInSocial: vi.fn(),
  signOut: vi.fn(),
  // How many lines were written when `redirect` was called (ORV-141 row 10: the line comes first).
  linesAtRedirect: [] as number[],
  written: (): number => 0,
  requestId: null as string | null,
  // When set, replaces the count: a non-async function that throws, or an async one that rejects.
  consume: null as null | (() => unknown),
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(state.requestId === null ? {} : { "x-request-id": state.requestId }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    state.linesAtRedirect.push(state.written());
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("../../server/auth", () => ({
  auth: () => ({ api: { signInSocial: state.signInSocial, signOut: state.signOut } }),
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

const { signInWithGoogle, signOut } = await import("./actions");

let capture: ReturnType<typeof captureLines>;
/** Every captured line, each checked against the line shape (ORV-142 row 15). */
const written = () => capture.lines.map((line) => expectLineShape(line));

beforeEach(() => {
  state.result = { ok: true };
  state.consumed = [];
  state.consume = null;
  state.signInSocial.mockReset().mockResolvedValue({ url: "https://accounts.example/oauth" });
  state.signOut.mockReset().mockResolvedValue({ success: true });
  state.linesAtRedirect = [];
  state.requestId = null;
  capture = captureLines();
  state.written = () => capture.lines.length;
});

afterEach(() => {
  capture.restore();
  vi.restoreAllMocks();
});

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("signInWithGoogle", () => {
  it("counts the sign-in limit per network, then starts OAuth", async () => {
    await expect(signInWithGoogle()).rejects.toThrow("redirect:https://accounts.example/oauth");
    expect(state.consumed).toEqual([LIMITS["sign-in"]]);
    expect(state.signInSocial).toHaveBeenCalledOnce();
  });

  it("sign-in over the limit does not start OAuth", async () => {
    state.result = { ok: false, reason: "limited", retryAfter: 180 };
    const result = await signInWithGoogle();
    expect(result).toStrictEqual({
      error: "rate-limited",
      code: "RATE_LIMITED",
      requestId: expect.stringMatching(UUID_V4),
      retryAfter: 180,
      retryable: true,
    });
    expect(result?.requestId).toBe(written()[0]?.["requestId"]);
    expect(state.signInSocial).not.toHaveBeenCalled();
  });

  it("sign-in fails closed", async () => {
    state.result = { ok: false, reason: "unavailable" };
    const result = await signInWithGoogle();
    expect(result).toStrictEqual({
      error: "failed",
      code: "SERVICE_UNAVAILABLE",
      requestId: expect.stringMatching(UUID_V4),
      retryable: true,
    });
    expect(result?.requestId).toBe(written()[0]?.["requestId"]);
    expect(state.signInSocial).not.toHaveBeenCalled();
  });

  // ORV-123 rows 1 and 2 (orv123-count-guard), ORV-142 row 9: the line is the boundary's.
  it("a count that throws or rejects returns failed and logs once", async () => {
    const counts = [
      // Not async: throws before it returns a promise.
      () => {
        throw new Error("secret detail");
      },
      async () => Promise.reject(new Error("secret detail")),
    ];
    for (const [index, count] of counts.entries()) {
      state.consume = count;
      const result = await signInWithGoogle();
      expect(result).toMatchObject({
        error: "failed",
        code: "SERVICE_UNAVAILABLE",
        retryable: true,
      });
      expect(state.signInSocial).not.toHaveBeenCalled();
      const lines = written();
      expect(lines).toHaveLength(index + 1);
      expect(lines[index]).toMatchObject({
        level: "error",
        route: "account/signInWithGoogle",
        outcome: "unavailable",
        reason: "rate-limit",
      });
      expect(JSON.stringify(lines)).not.toContain("secret detail");
    }
  });

  it("a count that answers unavailable writes the same line", async () => {
    state.result = { ok: false, reason: "unavailable" };
    await signInWithGoogle();
    expect(written()).toEqual([
      expect.objectContaining({
        level: "error",
        route: "account/signInWithGoogle",
        outcome: "unavailable",
        reason: "rate-limit",
      }),
    ]);
  });

  it("a limited count is logged as limited", async () => {
    state.result = { ok: false, reason: "limited", retryAfter: 180 };
    await signInWithGoogle();
    expect(written()).toEqual([
      expect.objectContaining({
        level: "warn",
        route: "account/signInWithGoogle",
        outcome: "limited",
        reason: "rate-limited",
      }),
    ]);
  });

  // ORV-144 row 15 (operator half), open question 9: a throw is the INTERNAL_ERROR state, not a rejection.
  it("an error from signInSocial returns the INTERNAL_ERROR state and logs one failed line", async () => {
    state.signInSocial.mockRejectedValue(new Error("oauth down for ana@example.com"));
    const result = await signInWithGoogle();
    expect(result).toStrictEqual({
      error: "failed",
      code: "INTERNAL_ERROR",
      requestId: expect.stringMatching(UUID_V4),
      retryable: false,
    });
    expect(JSON.stringify(result)).not.toContain("ana@example.com");
    expect(JSON.stringify(result)).not.toContain("oauth down");
    const lines = written();
    expect(lines).toEqual([
      expect.objectContaining({
        level: "error",
        route: "account/signInWithGoogle",
        outcome: "failed",
        reason: "unexpected",
        errorName: "Error",
        requestId: result?.requestId,
      }),
    ]);
    expect(JSON.stringify(lines)).not.toContain("oauth down");
    expect(state.linesAtRedirect).toEqual([]);
  });

  it("a missing URL returns the INTERNAL_ERROR state and logs one failed line", async () => {
    state.signInSocial.mockResolvedValue({ url: undefined });
    const result = await signInWithGoogle();
    expect(result).toStrictEqual({
      error: "failed",
      code: "INTERNAL_ERROR",
      requestId: expect.stringMatching(UUID_V4),
      retryable: false,
    });
    expect(written()).toEqual([
      expect.objectContaining({
        outcome: "failed",
        reason: "unexpected",
        requestId: result?.requestId,
      }),
    ]);
    expect(state.linesAtRedirect).toEqual([]);
  });

  it("a redirect is logged as ok", async () => {
    await expect(signInWithGoogle()).rejects.toThrow("redirect:https://accounts.example/oauth");
    await expect(signOut()).rejects.toThrow("redirect:/account");
    const lines = written();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      level: "info",
      route: "account/signInWithGoogle",
      outcome: "ok",
    });
    expect(lines[1]).toMatchObject({ level: "info", route: "account/signOut", outcome: "ok" });
    expect(state.signOut).toHaveBeenCalledOnce();
    // Each line was already written when its `redirect` ran.
    expect(state.linesAtRedirect).toEqual([1, 2]);
  });

  it("both lines carry the request's id, and a client's id is not kept", async () => {
    const id = "0b9e6f1c-3d2a-4c8e-9a41-5f7d2b6c8e10";
    state.requestId = id;
    await expect(signInWithGoogle()).rejects.toThrow("redirect:");
    await expect(signOut()).rejects.toThrow("redirect:");
    expect(written().map((line) => line["requestId"])).toEqual([id, id]);
    state.requestId = "client-chosen-id";
    capture.lines.length = 0;
    await expect(signOut()).rejects.toThrow("redirect:");
    const [line] = written();
    expect(line?.["requestId"]).not.toBe("client-chosen-id");
    expect(line?.["requestId"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
