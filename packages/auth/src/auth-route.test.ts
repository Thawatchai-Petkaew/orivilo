import { afterEach, describe, expect, it, vi } from "vitest";
import { authRoute } from "./auth-route.ts";
import { type Consumed, RateLimitUnavailable } from "./rate-limit.ts";

interface Body {
  error: { requestId: string };
}

const request = new Request("http://localhost:3000/api/auth/sign-in/social", {
  method: "POST",
  headers: { "content-type": "application/json" },
});
const allowed = async (): Promise<Consumed> => ({ ok: true });
const wrap = (
  handler: (r: Request) => Promise<Response>,
  consumeSignIn: (r: Request) => Promise<Consumed> = allowed,
) => authRoute(handler, { consumeSignIn });

afterEach(() => vi.restoreAllMocks());

// ORV-122 rows 12, 20 and 24: the wrapper's header, bodies, request id and log line.
describe("authRoute", () => {
  it("turns a 429 into Retry-After and the RATE_LIMITED body", async () => {
    const res = await wrap(
      async () => new Response("{}", { status: 429, headers: { "X-Retry-After": "7" } }),
    )(request);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
    expect(res.headers.get("x-retry-after")).toBe("7");
    const body = (await res.json()) as Body;
    expect(body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
        requestId: expect.any(String),
        retryable: true,
      },
    });
    expect(res.headers.get("x-request-id")).toBe(body.error.requestId);
  });

  it("a store failure answers 503", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await wrap(async () => {
      throw new RateLimitUnavailable();
    })(request);
    expect(res.status).toBe(503);
    const body = (await res.json()) as Body;
    expect(body).toEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable. Try again later.",
        requestId: expect.any(String),
        retryable: true,
      },
    });
    expect(res.headers.get("x-request-id")).toBe(body.error.requestId);
  });

  it("a store failure logs one line by name only", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await wrap(async () => {
      throw new RateLimitUnavailable();
    })(request);
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(line).toEqual({
      level: "error",
      requestId: res.headers.get("x-request-id"),
      route: "auth",
      outcome: "unavailable",
    });
  });

  it("counts a sign-in first; refused, the handler never runs", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const res = await wrap(handler, async () => ({ ok: false, reason: "limited", retryAfter: 42 }))(
      request,
    );
    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(res.headers.get("x-request-id")).toBe(((await res.json()) as Body).error.requestId);
  });

  it("a sign-in count that fails or throws answers 503 and logs once", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn(async () => new Response("ok"));
    for (const consume of [
      async (): Promise<Consumed> => ({ ok: false, reason: "unavailable" }),
      async (): Promise<Consumed> => {
        throw new Error("secret detail");
      },
    ]) {
      expect((await wrap(handler, consume)(request)).status).toBe(503);
    }
    expect(handler).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(2);
    expect(String(log.mock.calls[1]?.[0])).not.toContain("secret detail");
  });

  it("counts only POST requests under /api/auth/sign-in/", async () => {
    const consume = vi.fn(allowed);
    const handler = async () => new Response("ok");
    await wrap(handler, consume)(new Request("http://localhost:3000/api/auth/sign-in/social"));
    await wrap(
      handler,
      consume,
    )(new Request("http://localhost:3000/api/auth/sign-out", { method: "POST" }));
    expect(consume).not.toHaveBeenCalled();
    await wrap(handler, consume)(request);
    expect(consume).toHaveBeenCalledTimes(1);
  });

  // Row 25: only a request Better Auth would parse as a JSON sign-in body is counted.
  it("does not count other media types, with or without a foreign Origin", async () => {
    const consume = vi.fn(allowed);
    const handler = vi.fn(async () => new Response("ok"));
    const post = (headers: Record<string, string>) =>
      new Request("http://localhost:3000/api/auth/sign-in/social", { method: "POST", headers });
    for (const origin of ["https://evil.example", undefined]) {
      for (const type of [
        "text/plain",
        "application/x-www-form-urlencoded",
        "multipart/form-data; boundary=x",
        "",
      ]) {
        await wrap(
          handler,
          consume,
        )(post({ ...(origin ? { origin } : {}), ...(type ? { "content-type": type } : {}) }));
      }
    }
    expect(consume).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledTimes(8);
  });

  it("counts a JSON sign-in with a foreign Origin and no cookie, however the type is written", async () => {
    const consume = vi.fn(allowed);
    for (const type of [
      "application/json",
      "Application/JSON; charset=utf-8",
      " application/json ",
    ]) {
      await wrap(
        async () => new Response("ok"),
        consume,
      )(
        new Request("http://localhost:3000/api/auth/sign-in/social", {
          method: "POST",
          headers: { "content-type": type, origin: "https://evil.example" },
        }),
      );
    }
    expect(consume).toHaveBeenCalledTimes(3);
  });

  it("a count that throws before it returns a promise answers 503 and logs once", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn(async () => new Response("ok"));
    const res = await wrap(handler, () => {
      throw new Error("secret detail");
    })(request);
    expect(res.status).toBe(503);
    const body = (await res.json()) as Body & { error: { code: string } };
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(res.headers.get("x-request-id")).toBe(body.error.requestId);
    expect(handler).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0]?.[0])).not.toContain("secret detail");
  });

  it("rethrows any other error and passes a 200 through", async () => {
    const boom = new Error("boom");
    await expect(
      wrap(async () => {
        throw boom;
      })(request),
    ).rejects.toBe(boom);
    const ok = new Response("fine", { status: 200 });
    expect(await wrap(async () => ok)(request)).toBe(ok);
  });
});
