// ORV-177 rows 36 and 37 (ORV-160 slice 7a): the recorder of orv160-recordings, tested through its
// exported `record` with a spy and a fake `fetch`. No test here calls the network or a model, and
// the only key is the fake one row 37 names.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it, mock } from "node:test";
import { record } from "./probe/openrouter-interpret-record.mjs";

// The engine is TypeScript; the recorder import above has registered the hook that lets node load it.
const { AI_MODELS } = await import("../packages/intent-engine/src/index.ts");
const MODEL = AI_MODELS.interpret;
const DATED_MODEL = `${MODEL}-20261001`;
const FAKE_KEY = "sk-or-v1-test-0000";
const IDS = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-18", "row-27", "row-30", "row-31"];

const dir = mkdtempSync(join(tmpdir(), "orv177-"));
after(() => rmSync(dir, { recursive: true, force: true }));

/** A hand-written answer, not a recording: a valid reading that quotes the brief's first word. */
function answer(init, { model = MODEL, chunks = 1 } = {}) {
  const user = JSON.parse(init.body).messages[1].content;
  const reading = {
    findings: [
      { field: "personality", axis: "playful", level: "desired", quote: user.slice(0, 3) },
    ],
    notUnderstood: [],
  };
  const body = new TextEncoder().encode(
    JSON.stringify({ model, choices: [{ message: { content: JSON.stringify(reading) } }] }),
  );
  const size = Math.ceil(body.byteLength / chunks);
  const stream = new ReadableStream({
    start(controller) {
      for (let at = 0; at < body.byteLength; at += size) {
        controller.enqueue(body.slice(at, at + size));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

/** A fake `fetch` that keeps every call; `status(n)` picks the answer for the n-th call (from 1). */
function fakeFetch(status = () => 200, options) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const code = status(calls.length);
    return code === 200
      ? answer(init, options)
      : new Response(JSON.stringify({ error: {} }), { status: code });
  };
  return { fetch, calls };
}

describe("ORV-177 row 36: the recorder without a key", () => {
  it("returns 1, writes one line, calls nothing and writes no file", async () => {
    const fixturePath = join(dir, "no-key.json");
    const { fetch, calls } = fakeFetch();
    const lines = [];
    const code = await record({ env: {}, fetch, fixturePath, write: (l) => lines.push(l) });
    assert.equal(code, 1);
    assert.deepEqual(lines, ["OPENROUTER_API_KEY is not set; no call made."]);
    assert.equal(calls.length, 0);
    assert.equal(existsSync(fixturePath), false);
  });
});

describe("ORV-177 row 37: the recorder with a key", () => {
  const env = { OPENROUTER_API_KEY: FAKE_KEY };

  it("makes 9 calls, one per case, and the key reaches neither the file nor a line", async () => {
    const fixturePath = join(dir, "ok.json");
    const { fetch, calls } = fakeFetch();
    const lines = [];
    const code = await record({ env, fetch, fixturePath, write: (l) => lines.push(l) });
    assert.equal(code, 0);
    assert.equal(calls.length, 9);
    // The key does go out, in the request header: that is the call, not a leak.
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${FAKE_KEY}`);
    const text = readFileSync(fixturePath, "utf8");
    for (const seen of [text, ...lines]) {
      assert.equal(seen.includes(FAKE_KEY), false);
      assert.equal(seen.includes("Bearer"), false);
    }
    const file = JSON.parse(text);
    assert.equal(file.model, MODEL);
    assert.deepEqual(
      file.cases.map((c) => c.id),
      IDS,
    );
    for (const c of file.cases) {
      assert.equal(c.outcome, "ok");
      assert.equal(c.model, MODEL);
      assert.equal(typeof c.raw, "string");
      assert.equal(typeof c.durationMs, "number");
      assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.deepEqual(Object.keys(c).sort(), [
        "date",
        "durationMs",
        "id",
        "model",
        "outcome",
        "raw",
        "text",
      ]);
    }
  });

  it("keeps each case's brief text exactly as sent, the tag-character brief included", async () => {
    const fixturePath = join(dir, "text.json");
    const { fetch, calls } = fakeFetch();
    await record({ env, fetch, fixturePath, write: () => undefined });
    const { cases } = JSON.parse(readFileSync(fixturePath, "utf8"));
    cases.forEach((c, i) => {
      const sent = JSON.parse(calls[i].init.body).messages[1].content;
      assert.equal(typeof c.text, "string");
      assert.ok(c.text.length > 0);
      assert.ok(sent.includes(c.text), `${c.id}: the request holds the kept text`);
    });
    const row4 = cases.find((c) => c.id === "row-4");
    assert.ok([...row4.text].some((ch) => ch.codePointAt(0) >= 0xe0000));
  });

  it("records the answering model of a dated answer delivered in 5 chunks", async () => {
    const fixturePath = join(dir, "dated.json");
    const { fetch } = fakeFetch(() => 200, { model: DATED_MODEL, chunks: 5 });
    const code = await record({ env, fetch, fixturePath, write: () => undefined });
    assert.equal(code, 0);
    const { cases } = JSON.parse(readFileSync(fixturePath, "utf8"));
    assert.equal(cases.length, 9);
    for (const c of cases) {
      assert.equal(c.model, DATED_MODEL);
      assert.equal(c.outcome, "ok");
    }
  });

  it("records a foreign answering model as itself with outcome adapter-failed", async () => {
    const fixturePath = join(dir, "foreign.json");
    const { fetch } = fakeFetch(() => 200, { model: "openai/gpt-x", chunks: 3 });
    await record({ env, fetch, fixturePath, write: () => undefined });
    const { cases } = JSON.parse(readFileSync(fixturePath, "utf8"));
    for (const c of cases) {
      assert.equal(c.model, "openai/gpt-x");
      assert.equal(c.outcome, "adapter-failed");
    }
  });

  it("keeps a failed first call as adapter-failed, goes on, and retries nothing", async () => {
    const fixturePath = join(dir, "failed.json");
    const { fetch, calls } = fakeFetch((n) => (n === 1 ? 500 : 200));
    const lines = [];
    const code = await record({ env, fetch, fixturePath, write: (l) => lines.push(l) });
    assert.equal(code, 0);
    assert.equal(calls.length, 9);
    const text = readFileSync(fixturePath, "utf8");
    const { cases } = JSON.parse(text);
    assert.equal(cases[0].id, "row-1");
    assert.equal(cases[0].outcome, "adapter-failed");
    assert.equal(cases[0].raw, null);
    assert.equal(cases[0].model, null);
    assert.equal(cases[1].outcome, "ok");
    for (const seen of [text, ...lines]) {
      assert.equal(seen.includes(FAKE_KEY), false);
      assert.equal(seen.includes("Bearer"), false);
    }
  });

  it("gives every call an abort signal of 20 s (orv160-bound-abort)", async () => {
    const timeout = mock.method(AbortSignal, "timeout");
    try {
      const { fetch, calls } = fakeFetch();
      await record({ env, fetch, fixturePath: join(dir, "signal.json"), write: () => undefined });
      assert.equal(timeout.mock.callCount(), 9);
      for (const call of timeout.mock.calls) assert.deepEqual(call.arguments, [20_000]);
      for (const { init } of calls) assert.ok(init.signal instanceof AbortSignal);
    } finally {
      timeout.mock.restore();
    }
  });
});
