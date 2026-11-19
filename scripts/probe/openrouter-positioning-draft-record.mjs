#!/usr/bin/env node
// ORV-292 (ORV-285 tech notes section 8.4): the recorder of the `positioning-draft` evaluation set.
// Runs by hand, outside turbo and outside every test. One call per case of
// positioning-eval/cases.json (18), each through `draftPositioning`, the engine's own adapter, so
// the request is the one the engine sends: the pinned model, the system prompt, the JSON Schema, the
// given answers as the user message, the provider block and max_tokens. No retry; a 20 s abort per
// call; a failed call is kept with `raw: null` and the run goes on. The run needs the owner's
// confirmation of the bound and the cost (about 0.18 US dollars, at most 0.90, inferred), given
// here as the `--confirm` flag. The key arrives only through the environment, never from a file
// this script opens:
//
//   node --env-file=.env.recorder scripts/probe/openrouter-positioning-draft-record.mjs --confirm
//
// recorded.json is written with JSON.stringify. A recording is model output, so it is untrusted
// data: stored, never followed, run or pasted.
import { register } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// The engine is TypeScript with extensionless imports; the hook lets plain node load it.
register("./ts-resolve-hook.mjs", import.meta.url);
const {
  POSITIONING_DRAFT_MAX_TOKENS,
  POSITIONING_DRAFT_MODEL,
  draftPositioning,
  openRouterComplete,
} = await import("../../packages/intent-engine/src/index.ts");

const ABORT_MS = 20_000;
const RESPONSE_MAX_BYTES = 65_536;
export const CONFIRM_FLAG = "--confirm";
const EVAL_DIR = new URL(
  "../../packages/intent-engine/src/business/positioning-eval/",
  import.meta.url,
);
const CASES_PATH = fileURLToPath(new URL("cases.json", EVAL_DIR));
const DEFAULT_RECORDED = fileURLToPath(new URL("recorded.json", EVAL_DIR));

/** Wraps a fetch so the answer's own `model` can be read without changing what the client reads. */
function tapFetch(fetch, seen) {
  return async (url, init) => {
    const response = await fetch(url, init);
    const body = response.body;
    if (body === null || body === undefined) return response;
    return {
      ok: response.ok,
      status: response.status,
      body: {
        getReader() {
          const reader = body.getReader();
          return {
            async read() {
              const next = await reader.read();
              if (!next.done && next.value) {
                seen.bytes += next.value.byteLength;
                if (seen.bytes <= RESPONSE_MAX_BYTES) seen.chunks.push(next.value);
              }
              return next;
            },
            cancel: (reason) => reader.cancel(reason),
          };
        },
      },
    };
  };
}

function answeredModel(seen) {
  if (seen.bytes > RESPONSE_MAX_BYTES || seen.chunks.length === 0) return null;
  try {
    const all = new Uint8Array(seen.bytes);
    let at = 0;
    for (const chunk of seen.chunks) {
      all.set(chunk, at);
      at += chunk.byteLength;
    }
    const model = JSON.parse(new TextDecoder().decode(all))?.model;
    return typeof model === "string" ? model : null;
  } catch {
    return null;
  }
}

/**
 * Records one answer per case into the recorded file. Returns the exit code: 1 when the
 * confirmation flag or the key is missing (nothing is called, nothing is written), 0 once the file
 * is written.
 */
export async function record({ argv, env, fetch, recordedPath, write, cases = loadCases() }) {
  write(
    `This run makes ${cases.length} calls to ${POSITIONING_DRAFT_MODEL}, one per case, no retry, ` +
      `about 0.18 US dollars, at most 0.90 (inferred, not measured).`,
  );
  if (!argv.includes(CONFIRM_FLAG)) {
    write(
      `The owner has not confirmed the bound and the cost: pass ${CONFIRM_FLAG}. No call made.`,
    );
    return 1;
  }
  const apiKey = env.OPENROUTER_API_KEY;
  if (typeof apiKey !== "string" || apiKey === "") {
    write("OPENROUTER_API_KEY is not set; no call made.");
    return 1;
  }
  const entries = [];
  for (const { id, answers } of cases) {
    const seen = { bytes: 0, chunks: [] };
    const openRouter = openRouterComplete({
      apiKey,
      model: POSITIONING_DRAFT_MODEL,
      fetch: tapFetch(fetch, seen),
      signal: () => AbortSignal.timeout(ABORT_MS),
      maxTokens: POSITIONING_DRAFT_MAX_TOKENS,
    });
    let raw = null;
    const started = performance.now();
    let outcome = "recorded";
    try {
      await draftPositioning(
        { intake: answers, intakeId: id },
        {
          complete: async (request) => {
            raw = await openRouter(request);
            return raw;
          },
          model: POSITIONING_DRAFT_MODEL,
        },
      );
    } catch (error) {
      // A refused answer is kept: its text is the recording. A failed call has no text.
      outcome = raw === null ? "no answer" : `refused (${error?.clause ?? "unknown"})`;
    }
    const durationMs = Math.round(performance.now() - started);
    entries.push({
      caseId: id,
      model: raw === null ? null : answeredModel(seen),
      recordedAt: new Date().toISOString(),
      raw,
    });
    write(`${id}: ${outcome} in ${durationMs} ms`);
  }
  writeFileSync(recordedPath, `${JSON.stringify(entries, null, 2)}\n`);
  write(`Wrote ${entries.length} recordings to ${recordedPath}.`);
  return 0;
}

function loadCases() {
  return JSON.parse(readFileSync(CASES_PATH, "utf8"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(
    await record({
      argv: process.argv.slice(2),
      env: process.env,
      fetch: globalThis.fetch,
      recordedPath: DEFAULT_RECORDED,
      write: (line) => console.log(line),
    }),
  );
}
