import { describe, expect, it } from "vitest";
import { authRoute } from "./auth-route.ts";
import { RateLimitUnavailable } from "./rate-limit.ts";

const request = new Request("http://localhost:3000/api/auth/sign-in/social", { method: "POST" });

// ORV-122 rows 12 and 20: the wrapper's header and bodies.
describe("authRoute", () => {
  it("turns a 429 into Retry-After and the RATE_LIMITED body", async () => {
    const res = await authRoute(
      async () => new Response("{}", { status: 429, headers: { "X-Retry-After": "7" } }),
    )(request);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
    expect(res.headers.get("x-retry-after")).toBe("7");
    expect(await res.json()).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
        requestId: expect.any(String),
        retryable: true,
      },
    });
  });

  it("a store failure answers 503", async () => {
    const res = await authRoute(async () => {
      throw new RateLimitUnavailable();
    })(request);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable. Try again later.",
        requestId: expect.any(String),
        retryable: true,
      },
    });
  });

  it("rethrows any other error and passes a 200 through", async () => {
    const boom = new Error("boom");
    await expect(
      authRoute(async () => {
        throw boom;
      })(request),
    ).rejects.toBe(boom);
    const ok = new Response("fine", { status: 200 });
    expect(await authRoute(async () => ok)(request)).toBe(ok);
  });
});
