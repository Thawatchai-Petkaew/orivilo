import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authRoute } from "./auth-route.ts";
import { captureLines, expectLineShape } from "./log-testing.ts";
import { type Consumed, RateLimitUnavailable } from "./rate-limit.ts";

interface Body {
  error: { code: string; requestId: string; retryable: boolean };
}

/** The parsed body, after asserting exact keys at both levels (ORV-144 `orv144-envelope`). */
const exactBody = async (res: Response) => {
  const body = (await res.json()) as Body;
  expect(Object.keys(body)).toEqual(["error"]);
  expect(Object.keys(body.error)).toEqual(["code", "message", "requestId", "retryable"]);
  return body;
};

const request = new Request("http://localhost:3000/api/auth/sign-in/social", {
  method: "POST",
  headers: { "content-type": "application/json" },
});
const allowed = async (): Promise<Consumed> => ({ ok: true });
const wrap = (
  handler: (r: Request) => Promise<Response>,
  consumeSignIn: (r: Request) => Promise<Consumed> = allowed,
) => authRoute(handler, { consumeSignIn });

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SEEDED_ID = "6f1c1f0e-3f5a-4c7e-9b1d-2a8e5d4c3b21";
const withId = (id: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/auth/sign-in/social", {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": id, ...headers },
  });

let capture: ReturnType<typeof captureLines> | undefined;
beforeEach(() => {
  capture = captureLines();
});
const linesOf = () => (capture?.lines ?? []).map((line) => expectLineShape(line));

afterEach(() => {
  // Row 15: every line any test here wrote has the shape, asserted or not.
  linesOf();
  capture?.restore();
  capture = undefined;
  vi.restoreAllMocks();
});

// ORV-122 rows 12, 20 and 24 and ORV-141 rows 2, 12, 13 and 15: the wrapper's header, bodies,
// request id and boundary line.
describe("authRoute", () => {
  it("turns a 429 into Retry-After and the RATE_LIMITED body", async () => {
    const res = await wrap(
      async () => new Response("{}", { status: 429, headers: { "X-Retry-After": "7" } }),
    )(request);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
    expect(res.headers.get("x-retry-after")).toBe("7");
    const body = await exactBody(res);
    expect(body).toStrictEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
        requestId: expect.any(String),
        retryable: true,
      },
    });
    expect(res.headers.get("x-request-id")).toBe(body.error.requestId);
    expect(res.headers.get("content-type")).toBe("application/json");

    // The other path: a count that answers limited, with no handler 429.
    const counted = await wrap(
      async () => new Response("ok"),
      async (): Promise<Consumed> => ({ ok: false, reason: "limited", retryAfter: 7 }),
    )(request);
    expect(counted.status).toBe(429);
    expect(counted.headers.get("retry-after")).toBe("7");
    const countedBody = await exactBody(counted);
    expect(countedBody.error).toStrictEqual({
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
      requestId: countedBody.error.requestId,
      retryable: true,
    });
    expect(counted.headers.get("x-request-id")).toBe(countedBody.error.requestId);
  });

  // Row 12.
  it("a store failure answers 503 and logs once", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const res = await wrap(async () => {
      throw new RateLimitUnavailable();
    })(withId(SEEDED_ID));
    expect(res.status).toBe(503);
    const body = await exactBody(res);
    expect(body).toStrictEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable. Try again later.",
        requestId: SEEDED_ID,
        retryable: true,
      },
    });
    expect(res.headers.get("x-request-id")).toBe(SEEDED_ID);
    expect(capture?.lines).toHaveLength(1);
    expect(capture?.lines[0]?.stream).toBe("error");
    expect(linesOf()).toEqual([
      {
        level: "error",
        requestId: SEEDED_ID,
        route: "api/auth",
        durationMs: expect.any(Number),
        outcome: "unavailable",
        reason: "rate-limit",
        status: 503,
      },
    ]);
    // A sign-in count that answers unavailable never reaches the handler, and the answer carries
    // the request's id in the body, the header and the line.
    capture?.lines.splice(0);
    const refused = await wrap(handler, async () => ({ ok: false, reason: "unavailable" }))(
      withId(SEEDED_ID),
    );
    expect(refused.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
    expect(refused.headers.get("x-request-id")).toBe(SEEDED_ID);
    expect(await exactBody(refused)).toStrictEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service unavailable. Try again later.",
        requestId: SEEDED_ID,
        retryable: true,
      },
    });
    expect(capture?.lines).toHaveLength(1);
    expect(linesOf()).toEqual([
      {
        level: "error",
        requestId: SEEDED_ID,
        route: "api/auth",
        durationMs: expect.any(Number),
        outcome: "unavailable",
        reason: "rate-limit",
        status: 503,
      },
    ]);
  });

  // ORV-141 row 12: a 429 authRoute writes itself carries the request's id, not a fresh one.
  it.each([
    {
      name: "a refused sign-in count",
      consume: async (): Promise<Consumed> => ({ ok: false, reason: "limited", retryAfter: 42 }),
      handler: async () => new Response("ok"),
      handlerCalls: 0,
    },
    {
      name: "the handler's own 429",
      consume: allowed,
      handler: async () => new Response("{}", { status: 429, headers: { "X-Retry-After": "7" } }),
      handlerCalls: 1,
    },
  ])("$name answers 429 on the request's id in the body, the header and the line", async (c) => {
    const handler = vi.fn(c.handler);
    const res = await wrap(handler, c.consume)(withId(SEEDED_ID));
    expect(res.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(c.handlerCalls);
    expect(res.headers.get("x-request-id")).toBe(SEEDED_ID);
    expect(((await res.json()) as Body).error.requestId).toBe(SEEDED_ID);
    expect(capture?.lines).toHaveLength(1);
    expect(linesOf()).toEqual([
      {
        level: "warn",
        requestId: SEEDED_ID,
        route: "api/auth",
        durationMs: expect.any(Number),
        outcome: "limited",
        status: 429,
      },
    ]);
  });

  // Row 2, the api/auth boundary: the client's value is never kept.
  it("never keeps the client's id", async () => {
    const res = await wrap(async () => {
      throw new RateLimitUnavailable();
    })(withId("client-chosen-id"));
    const id = res.headers.get("x-request-id");
    expect(id).toMatch(UUID_V4);
    expect(id).not.toBe("client-chosen-id");
    expect(((await res.json()) as Body).error.requestId).toBe(id);
    expect(linesOf().map((line) => line["requestId"])).toEqual([id]);
    // A handler answer gets the same fresh id, and two requests get two ids.
    const passed = await wrap(async () => new Response("ok"))(withId("client-chosen-id"));
    const other = await wrap(async () => new Response("ok"))(withId("client-chosen-id"));
    expect(passed.headers.get("x-request-id")).toMatch(UUID_V4);
    expect(passed.headers.get("x-request-id")).not.toBe(other.headers.get("x-request-id"));
    expect(linesOf().at(-1)?.["requestId"]).toBe(other.headers.get("x-request-id"));
  });

  // Row 13.
  it("every answer carries the request id and one line", async () => {
    const handler = async () => {
      const headers = new Headers({ "content-type": "text/plain" });
      headers.append("set-cookie", "a=1; Path=/; HttpOnly");
      headers.append("set-cookie", "b=2; Path=/; HttpOnly");
      return new Response("fine", { status: 200, headers });
    };
    const get = new Request("http://localhost:3000/api/auth/get-session", {
      headers: { "x-request-id": SEEDED_ID },
    });
    const res = await wrap(handler)(get);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("fine");
    expect(res.headers.get("x-request-id")).toBe(SEEDED_ID);
    expect(res.headers.get("content-type")).toBe("text/plain");
    expect(res.headers.getSetCookie()).toEqual(["a=1; Path=/; HttpOnly", "b=2; Path=/; HttpOnly"]);
    expect(capture?.lines[0]?.stream).toBe("log");
    expect(linesOf()).toEqual([
      {
        level: "info",
        requestId: SEEDED_ID,
        route: "api/auth",
        durationMs: expect.any(Number),
        outcome: "ok",
        status: 200,
      },
    ]);

    capture?.lines.splice(0);
    const thrown500 = await wrap(async () => {
      throw new Error("ana@example.com at /Users/x/app.ts:12");
    })(get);
    expect(thrown500.status).toBe(500);
    const text = await thrown500.clone().text();
    expect(text).not.toContain("ana@example.com");
    expect(text).not.toContain("/Users/");
    expect(text).not.toContain(" at ");
    const thrownBody = await exactBody(thrown500);
    expect(thrownBody.error).toStrictEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong on our side.",
      requestId: SEEDED_ID,
      retryable: false,
    });
    expect(thrown500.headers.get("x-request-id")).toBe(thrownBody.error.requestId);
    expect(capture?.lines).toHaveLength(1);
    expect(capture?.lines[0]?.stream).toBe("error");
    expect(linesOf()).toEqual([
      {
        level: "error",
        requestId: SEEDED_ID,
        route: "api/auth",
        durationMs: expect.any(Number),
        outcome: "failed",
        reason: "unexpected",
        errorName: "Error",
        status: 500,
      },
    ]);
    expect(String(capture?.lines[0]?.args[0])).not.toContain("ana@example.com");
  });

  // Row 4 (orv144-route-answers, open question 1): Better Auth's own error answers.
  it("an error answer from Better Auth gets the error body", async () => {
    const get = new Request("http://localhost:3000/api/auth/get-session", {
      headers: { "x-request-id": SEEDED_ID },
    });
    const betterAuth = (status: number) => async () => {
      const headers = new Headers({
        "content-type": "application/json",
        "content-length": "999",
        "x-custom": "kept",
      });
      headers.append("set-cookie", "a=1; Path=/; HttpOnly");
      headers.append("set-cookie", "b=2; Path=/; HttpOnly");
      return new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "ana@example.com" }), {
        status,
        headers,
      });
    };

    const denied = await wrap(betterAuth(401))(get);
    expect(denied.status).toBe(401);
    expect(denied.headers.get("content-type")).toBe("application/json");
    expect(denied.headers.get("x-request-id")).toBe(SEEDED_ID);
    expect(denied.headers.get("x-custom")).toBe("kept");
    // The handler's content-length described its own body, not the one written here.
    expect(denied.headers.get("content-length")).not.toBe("999");
    expect(denied.headers.getSetCookie()).toEqual([
      "a=1; Path=/; HttpOnly",
      "b=2; Path=/; HttpOnly",
    ]);
    expect(await denied.clone().text()).not.toContain("ana@example.com");
    expect((await exactBody(denied)).error).toStrictEqual({
      code: "UNAUTHENTICATED",
      message: "Sign in to continue.",
      requestId: SEEDED_ID,
      retryable: false,
    });

    for (const [status, code, retryable] of [
      [400, "BAD_REQUEST", false],
      [418, "BAD_REQUEST", false],
      [500, "INTERNAL_ERROR", false],
      [501, "INTERNAL_ERROR", false],
      [503, "SERVICE_UNAVAILABLE", true],
    ] as const) {
      const res = await wrap(betterAuth(status))(get);
      expect(res.status).toBe(status);
      const { error } = await exactBody(res);
      expect({ code: error.code, retryable: error.retryable, requestId: error.requestId }).toEqual({
        code,
        retryable,
        requestId: SEEDED_ID,
      });
    }

    // The handler's body is cancelled, not left open.
    let cancelled = false;
    await wrap(
      async () =>
        new Response(
          new ReadableStream({
            cancel() {
              cancelled = true;
            },
          }),
          { status: 401 },
        ),
    )(get);
    expect(cancelled).toBe(true);

    // Below 400 the answer is the handler's, byte for byte.
    const ok = await wrap(async () => new Response("fine", { status: 200 }))(get);
    expect(await ok.text()).toBe("fine");
    const moved = await wrap(
      async () =>
        new Response("moved body", { status: 302, headers: { location: "http://localhost/x" } }),
    )(get);
    expect(moved.status).toBe(302);
    expect(await moved.text()).toBe("moved body");
    expect(moved.headers.get("location")).toBe("http://localhost/x");
    capture?.lines.splice(0);
  });

  it("reads a redirect, a refusal and Better Auth's own 503 from the status", async () => {
    const redirect = await wrap(async () =>
      Response.redirect("http://localhost:3000/account", 302),
    )(withId(SEEDED_ID));
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("x-request-id")).toBe(SEEDED_ID);
    expect(redirect.headers.get("location")).toBe("http://localhost:3000/account");
    await wrap(async () => new Response("no", { status: 401 }))(withId(SEEDED_ID));
    await wrap(async () => new Response("down", { status: 503 }))(withId(SEEDED_ID));
    expect(
      linesOf().map(({ level, outcome, status, reason }) => ({ level, outcome, status, reason })),
    ).toEqual([
      { level: "info", outcome: "ok", status: 302, reason: undefined },
      { level: "info", outcome: "refused", status: 401, reason: undefined },
      { level: "error", outcome: "unavailable", status: 503, reason: undefined },
    ]);
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

  it("a refused sign-in is one warn line, limited, with no reason", async () => {
    await wrap(
      async () => new Response("ok"),
      async () => ({
        ok: false,
        reason: "limited",
        retryAfter: 42,
      }),
    )(withId(SEEDED_ID));
    expect(capture?.lines[0]?.stream).toBe("warn");
    expect(linesOf()).toEqual([
      {
        level: "warn",
        requestId: SEEDED_ID,
        route: "api/auth",
        durationMs: expect.any(Number),
        outcome: "limited",
        status: 429,
      },
    ]);
  });

  it("a sign-in count that fails or throws answers 503 and logs once", async () => {
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
    expect(capture?.lines).toHaveLength(2);
    expect(linesOf().map((line) => line["reason"])).toEqual(["rate-limit", "rate-limit"]);
    expect(String(capture?.lines[1]?.args[0])).not.toContain("secret detail");
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
    const handler = vi.fn(async () => new Response("ok"));
    const res = await wrap(handler, () => {
      throw new Error("secret detail");
    })(request);
    expect(res.status).toBe(503);
    const body = (await res.json()) as Body;
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(res.headers.get("x-request-id")).toBe(body.error.requestId);
    expect(handler).not.toHaveBeenCalled();
    expect(capture?.lines).toHaveLength(1);
    linesOf();
    expect(String(capture?.lines[0]?.args[0])).not.toContain("secret detail");
  });

  it("answers any other error with 500 and passes a 200 through", async () => {
    const failed = await wrap(async () => {
      throw new Error("boom");
    })(request);
    expect(failed.status).toBe(500);
    expect((await exactBody(failed)).error.requestId).toBe(failed.headers.get("x-request-id"));
    const res = await wrap(async () => new Response("fine", { status: 200 }))(request);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("fine");
    expect(res.headers.get("x-request-id")).toMatch(UUID_V4);
  });
});
