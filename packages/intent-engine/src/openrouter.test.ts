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

const ok =
  (body: unknown): FetchLike =>
  () =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

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
        json: () => Promise.resolve({ usage: { cost: 0.014 } }),
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
      Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error("bad json")) }),
    );
    await expect(complete(REQUEST)).rejects.toThrow("bad json");
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
