import { captureLines, expectLineShape, type CapturedLine } from "@orivilo/auth/log-testing";
import { atBoundary } from "@orivilo/auth";
import { afterEach, describe, expect, it, vi } from "vitest";

const made = vi.hoisted(() => ({ deps: [] as { onResult?: unknown }[] }));
vi.mock("server-only", () => ({}));
vi.mock("@orivilo/db/client", () => ({ appDb: () => ({}) }));
vi.mock("@orivilo/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@orivilo/auth")>()),
  createRateLimiter: (deps: { onResult?: unknown }) => {
    made.deps.push(deps);
    return { consume: async () => ({ ok: true }) };
  },
}));

const { limiter, logRateLimit } = await import("./rate-limit");

const ID = "3f2b8c1e-5d4a-4b7e-9c2d-1a6f0e8b7d35";
let capture: ReturnType<typeof captureLines> | undefined;
afterEach(() => capture?.restore());

// ORV-142 rows 3 and 7 (step halves): the limiter's one writer is the `rate-limit` step line.
describe("logRateLimit", () => {
  it("writes a rate-limit step line with the open request's id and route", async () => {
    capture = captureLines();
    await atBoundary({ requestId: ID, route: "directions/saveDirection" }, async () => {
      logRateLimit({ limit: "write", outcome: "allowed", durationMs: 3.4 });
      return { value: undefined, ending: { level: "info", outcome: "ok" } };
    });
    const step = expectLineShape(capture.lines[0] as CapturedLine);
    expect(step).toEqual({
      level: "info",
      requestId: ID,
      route: "directions/saveDirection",
      durationMs: 3,
      outcome: "allowed",
      step: "rate-limit",
      limit: "write",
    });
    expect(capture.lines[0]?.stream).toBe("log");
  });

  it("writes an unavailable count at info, the boundary line being the only error line", () => {
    capture = captureLines();
    logRateLimit({ limit: "ai-read", outcome: "unavailable", durationMs: 1 });
    const step = expectLineShape(capture.lines[0] as CapturedLine);
    expect(step).toMatchObject({ level: "info", step: "rate-limit", outcome: "unavailable" });
    expect(capture.lines[0]?.stream).toBe("log");
  });

  it("serves Better Auth's counts under the limit name auth-http", () => {
    capture = captureLines();
    logRateLimit({ limit: "auth-http", outcome: "limited", durationMs: 2 });
    expect(expectLineShape(capture.lines[0] as CapturedLine)).toMatchObject({
      limit: "auth-http",
      outcome: "limited",
    });
  });

  it("carries no key, id or IP: a field beyond the result is not written", () => {
    capture = captureLines();
    const result = {
      limit: "write",
      outcome: "allowed",
      durationMs: 1,
      key: "user:ana@example.com",
    } as const;
    logRateLimit(result);
    expect(String(capture.lines[0]?.args[0])).not.toContain("ana@example.com");
  });
});

describe("limiter", () => {
  it("passes logRateLimit as onResult", () => {
    limiter();
    expect(made.deps).toHaveLength(1);
    expect(made.deps[0]?.onResult).toBe(logRateLimit);
  });
});
