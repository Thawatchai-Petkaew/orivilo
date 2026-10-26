import { LIMITS, type Limit, type Subject } from "@orivilo/auth";
import { describe, expect, it, vi } from "vitest";

const seen = vi.hoisted(() => ({ calls: [] as { limit: Limit; subject: Subject }[] }));
vi.mock("server-only", () => ({}));
vi.mock("./rate-limit", () => ({
  subjectFromHeaders: (h: Headers) => `subject-of-${h.get("x-forwarded-for")}`,
  limiter: () => ({
    async consume(limit: Limit, subject: Subject) {
      seen.calls.push({ limit, subject });
      return { ok: true };
    },
  }),
}));

const { consumeSignIn } = await import("./sign-in-limit");

// ORV-122 row 24: the action and the route share one count.
describe("consumeSignIn", () => {
  it("consumes the sign-in limit for the subject of the request headers", async () => {
    const result = await consumeSignIn(new Headers({ "x-forwarded-for": "1.2.3.4" }));
    expect(result).toEqual({ ok: true });
    expect(seen.calls).toEqual([
      { limit: LIMITS["sign-in"], subject: { ip: "subject-of-1.2.3.4" } },
    ]);
  });
});
