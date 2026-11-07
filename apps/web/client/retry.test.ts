import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry, retryDelay, type Answer } from "./retry";

// Every test fixes the random source and the clock: `sleep` records the wait and returns at once.
function harness(answers: Array<Response | Error>, random = 0.5) {
  const queue = [...answers];
  const waits: number[] = [];
  const fetch = vi.fn(async () => {
    const next = queue.shift();
    if (next === undefined) throw new Error("no answer queued");
    if (next instanceof Error) throw next;
    return next;
  });
  const deps = {
    fetch,
    sleep: async (ms: number) => {
      waits.push(ms);
    },
    random: () => random,
  };
  return { fetch, waits, deps };
}

const answer = (status: number, headers: Record<string, string> = {}, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? headers : { "content-type": "application/json", ...headers },
  });

const errorBody = (retryable: boolean) => ({
  error: { code: "X", message: "m", requestId: "id", retryable },
});

describe("retryDelay: the retry decision (worked example, r = 0.5)", () => {
  const get = { method: "GET", idempotencyKey: null };
  const a = (status: number, retryAfter: string | null = null, retryable: boolean | null = null) =>
    ({ status, retryAfter, retryable }) satisfies Answer;
  const cases: Array<[string, Parameters<typeof retryDelay>, number | null]> = [
    ["GET 404", [get, a(404), 0, 0.5], null],
    ["GET 500", [get, a(500), 0, 0.5], null],
    ["GET 429 Retry-After 2", [get, a(429, "2"), 0, 0.5], 2000],
    ["GET 408", [get, a(408), 0, 0.5], 1000],
    ["GET 429 Retry-After soon", [get, a(429, "soon"), 0, 0.5], 1000],
    ["GET 429 Retry-After 3600", [get, a(429, "3600"), 0, 0.5], null],
    ["GET 429 Retry-After 10", [get, a(429, "10"), 0, 0.5], 10000],
    ["GET 429 Retry-After 11", [get, a(429, "11"), 0, 0.5], null],
    ["GET 429 Retry-After 0", [get, a(429, "0"), 0, 0.5], 0],
    ["GET 429 Retry-After 1.5", [get, a(429, "1.5"), 0, 0.5], 1000],
    ["GET 503", [get, a(503), 0, 0.5], 500],
    ["GET 503 after 1 retry", [get, a(503), 1, 0.5], 1000],
    ["GET 503 after 2 retries", [get, a(503), 2, 0.5], 2000],
    ["GET 503 after 3 retries", [get, a(503), 3, 0.5], null],
    ["GET no answer", [get, null, 0, 0.5], 500],
    ["GET 503 retryable false", [get, a(503, null, false), 0, 0.5], null],
    ["POST 503", [{ method: "POST", idempotencyKey: null }, a(503), 0, 0.5], null],
    ["POST 503 with a key", [{ method: "POST", idempotencyKey: "k1" }, a(503), 0, 0.5], 500],
    [
      "POST 503 with an empty key",
      [{ method: "POST", idempotencyKey: "  " }, a(503), 0, 0.5],
      null,
    ],
    ["get in lower case", [{ method: "get", idempotencyKey: null }, a(502), 0, 0.5], 500],
    ["GET 504", [get, a(504), 0, 0.5], 500],
    ["GET 502", [get, a(502), 0, 0.5], 500],
  ];
  it.each(cases)("%s", (_name, args, expected) => {
    expect(retryDelay(...args)).toBe(expected);
  });

  it("the delay is rounded to whole milliseconds, halves and above up", () => {
    // 500 * (0.5 + 0.0012) = 250.6
    expect(retryDelay(get, a(503), 0, 0.0012)).toBe(251);
  });

  it("the jitter bounds: r at 0, 0.5 and 0.75 for retries 0 to 2", () => {
    const table = { 0: [250, 500, 1000], 0.5: [500, 1000, 2000], 0.75: [625, 1250, 2500] };
    for (const [r, delays] of Object.entries(table)) {
      expect([0, 1, 2].map((n) => retryDelay(get, a(503), n, Number(r)))).toEqual(delays);
    }
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => vi.useRealTimers());

  it.each([400, 401, 403, 404, 409, 413, 422, 500])(
    "4xx and 500 are not retried (%i)",
    async (status) => {
      const { fetch, waits, deps } = harness([answer(status)]);
      const result = await fetchWithRetry("/x", undefined, deps);
      expect(result.status).toBe(status);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(waits).toEqual([]);
    },
  );

  it("408 and 429 wait for Retry-After", async () => {
    const first = harness([answer(429, { "retry-after": "2" }), answer(408), answer(200)]);
    expect((await fetchWithRetry("/x", undefined, first.deps)).status).toBe(200);
    expect(first.waits).toEqual([2000, 1000]);

    const long = harness([answer(429, { "retry-after": "3600" })]);
    expect((await fetchWithRetry("/x", undefined, long.deps)).status).toBe(429);
    expect(long.fetch).toHaveBeenCalledTimes(1);

    const four = harness([answer(429), answer(429), answer(429), answer(429, { "x-last": "yes" })]);
    const last = await fetchWithRetry("/x", undefined, four.deps);
    expect(four.fetch).toHaveBeenCalledTimes(4);
    expect(four.waits).toEqual([1000, 1000, 1000]);
    expect(last.headers.get("x-last")).toBe("yes");
  });

  it("the default sleep waits the Retry-After seconds on the clock", async () => {
    vi.useFakeTimers();
    const queue = [answer(429, { "retry-after": "2" }), answer(200)];
    const fetch = vi.fn(async () => queue.shift() as Response);
    const pending = fetchWithRetry("/x", undefined, { fetch, random: () => 0.5 });
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect((await pending).status).toBe(200);
  });

  it("5xx gateway answers and network errors back off with jitter", async () => {
    const mid = harness([answer(502), answer(503), answer(504), answer(200)]);
    expect((await fetchWithRetry("/x", undefined, mid.deps)).status).toBe(200);
    expect(mid.waits).toEqual([500, 1000, 2000]);

    const rejects = harness([new Error("a"), new Error("b"), new Error("c"), answer(200)]);
    expect((await fetchWithRetry("/x", undefined, rejects.deps)).status).toBe(200);
    expect(rejects.waits).toEqual([500, 1000, 2000]);

    const low = harness([answer(503), answer(503), answer(503), answer(503)], 0);
    await fetchWithRetry("/x", undefined, low.deps);
    expect(low.waits).toEqual([250, 500, 1000]);

    const high = harness([answer(503), answer(503), answer(503), answer(503)], 0.75);
    await fetchWithRetry("/x", undefined, high.deps);
    expect(high.waits).toEqual([625, 1250, 2500]);

    const fourth = harness([
      answer(503),
      answer(503),
      answer(503),
      answer(504, { "x-last": "yes" }),
    ]);
    expect((await fetchWithRetry("/x", undefined, fourth.deps)).headers.get("x-last")).toBe("yes");
    expect(fourth.fetch).toHaveBeenCalledTimes(4);

    const lastError = harness([new Error("1"), new Error("2"), new Error("3"), new Error("4")]);
    await expect(fetchWithRetry("/x", undefined, lastError.deps)).rejects.toThrow("4");
    expect(lastError.fetch).toHaveBeenCalledTimes(4);
  });

  it("only a GET or a keyed write is retried, and never a retryable false", async () => {
    const no = harness([answer(503, undefined, errorBody(false))]);
    expect((await fetchWithRetry("/x", undefined, no.deps)).status).toBe(503);
    expect(no.fetch).toHaveBeenCalledTimes(1);

    const yes = harness([answer(503, undefined, errorBody(true)), answer(200)]);
    expect((await fetchWithRetry("/x", undefined, yes.deps)).status).toBe(200);
    expect(yes.waits).toEqual([500]);

    const post = harness([answer(503)]);
    expect((await fetchWithRetry("/x", { method: "POST" }, post.deps)).status).toBe(503);
    expect(post.fetch).toHaveBeenCalledTimes(1);

    const keyed = harness([answer(503), answer(200)]);
    const init = { method: "POST", headers: { "Idempotency-Key": "k1" } };
    expect((await fetchWithRetry("/x", init, keyed.deps)).status).toBe(200);
    expect(keyed.waits).toEqual([500]);
    expect(keyed.fetch).toHaveBeenCalledTimes(2);

    const blank = harness([answer(503)]);
    await fetchWithRetry("/x", { method: "POST", headers: { "Idempotency-Key": " " } }, blank.deps);
    expect(blank.fetch).toHaveBeenCalledTimes(1);
  });

  it("a body that does not parse, or lacks retryable, reads as the matrix default", async () => {
    const broken = harness([
      new Response("{nope", { status: 503, headers: { "content-type": "application/json" } }),
      answer(200),
    ]);
    expect((await fetchWithRetry("/x", undefined, broken.deps)).status).toBe(200);

    const bare = harness([answer(503, undefined, { error: {} }), answer(200)]);
    expect((await fetchWithRetry("/x", undefined, bare.deps)).status).toBe(200);

    const html = harness([
      new Response('{"error":{"retryable":false}}', {
        status: 503,
        headers: { "content-type": "text/html" },
      }),
      answer(200),
    ]);
    expect((await fetchWithRetry("/x", undefined, html.deps)).status).toBe(200);
  });

  it("a success answer is not cloned or read", async () => {
    const ok = answer(200, {}, { fine: true });
    const clone = vi.spyOn(ok, "clone");
    const { deps } = harness([ok]);
    await fetchWithRetry("/x", undefined, deps);
    expect(clone).not.toHaveBeenCalled();
  });

  it("the result keeps a readable body", async () => {
    const { deps } = harness([answer(503, undefined, errorBody(false))]);
    const result = await fetchWithRetry("/x", undefined, deps);
    expect(await result.json()).toEqual(errorBody(false));
  });

  it("an aborted call is not retried", async () => {
    const controller = new AbortController();
    const abort = new DOMException("stop", "AbortError");
    const { fetch, waits, deps } = harness([abort, answer(200)]);
    fetch.mockImplementationOnce(async () => {
      controller.abort();
      throw abort;
    });
    await expect(fetchWithRetry("/x", { signal: controller.signal }, deps)).rejects.toBe(abort);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(waits).toEqual([]);
  });
});
