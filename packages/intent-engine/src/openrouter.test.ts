import { describe, expect, it } from "vitest";
import {
  AI_MODELS,
  openRouterComplete,
  reportedCostMicroUsd,
  type FetchLike,
  type OpenRouterCall,
} from "./openrouter";

const MODEL = AI_MODELS.interpret;
const REQUEST = { system: "s", user: "u", schemaName: "n", schema: {} };

function answer(extra: Record<string, unknown> = {}) {
  return { model: MODEL, choices: [{ message: { content: "{}" } }], ...extra };
}

/** A fetch that answers 200 with `body`, and the calls `onCall` saw. */
function run(doFetch: FetchLike) {
  const calls: OpenRouterCall[] = [];
  const complete = openRouterComplete({
    apiKey: "k",
    model: MODEL,
    fetch: doFetch,
    onCall: (c) => calls.push(c),
  });
  return { calls, complete };
}

// The engine's tsconfig has no DOM lib (as in read-page.test.ts line 32).
declare class TextEncoder {
  encode(input: string): Uint8Array;
}
const enc = new TextEncoder();

/** A body that hands out `text`'s bytes in `size`-byte chunks and counts reads and cancels. */
function chunked(text: string, size = 16_384) {
  const bytes = enc.encode(text);
  const seen = { reads: 0, cancels: 0 };
  let at = 0;
  const body = {
    getReader: () => ({
      read: () => {
        seen.reads += 1;
        if (at >= bytes.byteLength) return Promise.resolve({ done: true });
        const value = bytes.slice(at, at + size);
        at += size;
        return Promise.resolve({ done: false, value });
      },
      cancel: () => {
        seen.cancels += 1;
        return Promise.resolve();
      },
    }),
  };
  return { body, seen };
}

const ok =
  (body: unknown): FetchLike =>
  () =>
    Promise.resolve({ ok: true, status: 200, body: chunked(JSON.stringify(body)).body });

describe("reportedCostMicroUsd (spec spend-cap-6, K-0091)", () => {
  it("reads usage.cost in millionths of a dollar", () => {
    expect(reportedCostMicroUsd({ usage: { cost: 0.014 } })).toBe(14000);
  });

  it("keeps a reported 0 as 0", () => {
    expect(reportedCostMicroUsd({ usage: { cost: 0 } })).toBe(0);
  });

  it.each([
    ["not an object", 5],
    ["null body", null],
    ["no usage", {}],
    ["usage null", { usage: null }],
    ["no cost", { usage: {} }],
    ["cost null", { usage: { cost: null } }],
    ["cost a string", { usage: { cost: "0.014" } }],
    ["cost negative", { usage: { cost: -0.1 } }],
    ["cost NaN", { usage: { cost: Number.NaN } }],
    ["cost infinite", { usage: { cost: Number.POSITIVE_INFINITY } }],
    ["cost not a safe integer in millionths", { usage: { cost: 1e21 } }],
  ])("gives null when %s", (_name, body) => {
    expect(reportedCostMicroUsd(body)).toBeNull();
  });
});

describe("openRouterComplete onCall", () => {
  it("is called once with the cost for a 200 answer", async () => {
    const { calls, complete } = run(ok(answer({ usage: { cost: 0.014 } })));
    await expect(complete(REQUEST)).resolves.toBe("{}");
    expect(calls).toEqual([{ costMicroUsd: 14000 }]);
  });

  it("is called once with the cost for a reported 0", async () => {
    const { calls, complete } = run(ok(answer({ usage: { cost: 0 } })));
    await complete(REQUEST);
    expect(calls).toEqual([{ costMicroUsd: 0 }]);
  });

  it.each([
    ["cost null", { usage: { cost: null } }],
    ["no cost", { usage: {} }],
    ["no usage", {}],
  ])("is called once with null for %s", async (_name, extra) => {
    const { calls, complete } = run(ok(answer(extra)));
    await complete(REQUEST);
    expect(calls).toEqual([{ costMicroUsd: null }]);
  });

  it("is called once with null for a 500", async () => {
    const { calls, complete } = run(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        body: chunked(JSON.stringify({ usage: { cost: 0.014 } })).body,
      }),
    );
    await expect(complete(REQUEST)).rejects.toThrow("OpenRouter answered 500");
    expect(calls).toEqual([{ costMicroUsd: null }]);
  });

  it("is called once with null when fetch rejects", async () => {
    const { calls, complete } = run(() => Promise.reject(new Error("network")));
    await expect(complete(REQUEST)).rejects.toThrow("network");
    expect(calls).toEqual([{ costMicroUsd: null }]);
  });

  it("is called once with null when the 200 body cannot be parsed", async () => {
    const { calls, complete } = run(() =>
      Promise.resolve({ ok: true, status: 200, body: chunked("not json").body }),
    );
    await expect(complete(REQUEST)).rejects.toThrow(SyntaxError);
    expect(calls).toEqual([{ costMicroUsd: null }]);
  });

  it("keeps the cost when the answer names another model", async () => {
    const { calls, complete } = run(ok(answer({ model: "other/model", usage: { cost: 0.014 } })));
    await expect(complete(REQUEST)).rejects.toThrow("another model");
    expect(calls).toEqual([{ costMicroUsd: 14000 }]);
  });

  it("keeps the cost when the answer holds no text", async () => {
    const { calls, complete } = run(ok({ model: MODEL, choices: [], usage: { cost: 0.014 } }));
    await expect(complete(REQUEST)).rejects.toThrow("no text");
    expect(calls).toEqual([{ costMicroUsd: 14000 }]);
  });

  it("is never called when no request is sent", () => {
    const { calls } = run(ok(answer()));
    expect(calls).toEqual([]);
  });

  it("onCall is not called when the request is never sent", async () => {
    const calls: OpenRouterCall[] = [];
    let fetched = 0;
    const complete = openRouterComplete({
      apiKey: "k",
      model: MODEL,
      fetch: () => {
        fetched += 1;
        return ok(answer())("", { method: "POST", headers: {}, body: "" });
      },
      signal: () => {
        throw new Error("no signal");
      },
      onCall: (c) => calls.push(c),
    });
    await expect(complete(REQUEST)).rejects.toThrow("no signal");
    expect(fetched).toBe(0);
    expect(calls).toEqual([]);
  });

  it("works without an onCall", async () => {
    const complete = openRouterComplete({ apiKey: "k", model: MODEL, fetch: ok(answer()) });
    await expect(complete(REQUEST)).resolves.toBe("{}");
  });
});

/**
 * ORV-160 slice 2 (ORV-172): the request the client sends. Every answer here is hand-written, not a
 * recording, and the fake `fetch` keeps the call; no row calls a model or the network.
 */
type Init = Parameters<FetchLike>[1];

function spy(body: unknown = answer()) {
  const seen: { url: string; init: Init }[] = [];
  const doFetch: FetchLike = (url, init) => {
    seen.push({ url, init });
    return ok(body)(url, init);
  };
  return { seen, doFetch };
}

/** One call with no `maxTokens` and no `signal` (row 9), and the request `fetch` got. */
async function oneCall(extra: Partial<Parameters<typeof openRouterComplete>[0]> = {}) {
  const { seen, doFetch } = spy();
  const complete = openRouterComplete({ apiKey: "k", model: MODEL, fetch: doFetch, ...extra });
  await complete(REQUEST);
  expect(seen).toHaveLength(1);
  const [call] = seen;
  if (!call) throw new Error("openRouterComplete made no fetch call");
  const { url, init } = call;
  const body = JSON.parse(init.body) as {
    max_tokens: number;
    messages: { role: string; content: string }[];
    provider: Record<string, unknown>;
  } & Record<string, unknown>;
  return { url, init, body };
}

describe("the request openRouterComplete sends (ORV-160 rows 9 to 16, 23, 24)", () => {
  it("row 9: a POST with exactly three headers and the five body keys (orv160-request-envelope)", async () => {
    const { init, body } = await oneCall();
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer k",
      "Content-Type": "application/json",
      "X-Title": "ORIVILO",
    });
    expect(Object.keys(body).sort()).toEqual([
      "max_tokens",
      "messages",
      "model",
      "provider",
      "response_format",
    ]);
    expect(body.messages).toEqual([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
  });

  it("row 10: provider.zdr is true (orv160-flag-zdr)", async () => {
    expect((await oneCall()).body.provider.zdr).toBe(true);
  });

  it("row 11: provider.data_collection is deny (orv160-flag-data-collection)", async () => {
    expect((await oneCall()).body.provider.data_collection).toBe("deny");
  });

  it("row 12: AI_MODELS is exactly the six pinned jobs (orv160-model-ids)", () => {
    expect(AI_MODELS).toEqual({
      chat: "anthropic/claude-sonnet-5.5",
      instant: "inception/mercury-3",
      interpret: "anthropic/claude-sonnet-5.5",
      see: "google/gemini-4-argon",
      "logo-vector": "anthropic/claude-opus-5.5",
      "logo-image": "google/gemini-nano-banana-2.1",
    });
  });

  it("row 13: fetch gets the one pinned URL (orv160-url)", async () => {
    expect((await oneCall()).url).toBe("https://openrouter.ai/api/v1/chat/completions");
  });

  it("row 14: an answer from another model is refused, a dated suffix is not (orv160-answer-model)", async () => {
    const refused = run(ok(answer({ model: "openai/gpt-6-luna" }))).complete;
    await expect(refused(REQUEST)).rejects.toThrow(
      new Error("OpenRouter answered with another model."),
    );
    const dated = run(ok(answer({ model: `${MODEL}-20261001` }))).complete;
    await expect(dated(REQUEST)).resolves.toBe("{}");
  });

  it("row 15: provider.require_parameters is true (orv160-flag-require-parameters)", async () => {
    expect((await oneCall()).body.provider.require_parameters).toBe(true);
  });

  it("row 16: provider.allow_fallbacks is false (orv160-flag-allow-fallbacks)", async () => {
    expect((await oneCall()).body.provider.allow_fallbacks).toBe(false);
  });

  it("row 23: max_tokens is 2000 without maxTokens, then the given 500 (orv160-bound-max-tokens)", async () => {
    expect((await oneCall()).body.max_tokens).toBe(2000);
    expect((await oneCall({ maxTokens: 500 })).body.max_tokens).toBe(500);
  });

  it("row 24: the caller's signal reaches fetch, and no signal key without one", async () => {
    const marker = {};
    const withSignal = await oneCall({ signal: () => marker });
    expect(withSignal.init.signal).toBe(marker);
    const without = await oneCall();
    expect("signal" in without.init).toBe(false);
  });
});
