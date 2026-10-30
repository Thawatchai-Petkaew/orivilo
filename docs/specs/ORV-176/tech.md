---
issue: ORV-176 (https://tpetkaew.atlassian.net/browse/ORV-176)
spec: docs/specs/ORV-176/spec.md v1.0
parent: docs/specs/ORV-160/spec.md, "Slices" item 5
task: ORV-176-tech-1
author: architect
date: 2026-10-30
---

# ORV-176 tech notes: the client hardening (ORV-160 slice 5)

These notes turn rows 17 and 26 into a source change in `packages/intent-engine/src/openrouter.ts`, the consumer edits and the tests that prove them. They use the parent's rule names (`orv160-bound-response`, `orv160-answer-model`, `orv160-form`, `orv160-fallback`, `orv160-wallet-gap`) and copy their values, never restate or change them; a change to a rule is made in the parent spec first. "Row n" is a row of the slice spec's "Acceptance criteria". "C" is `packages/intent-engine/src/openrouter.test.ts`, "A" is `apps/web/app/directions/actions.test.ts` (the parent's file keys). Line numbers are those of `develop` at d8c9fa7.

**What is real.** Every test below runs on a fake `fetch` or on a web `Response` built in the test; no test calls a model or the network (ADR 0009 point 8, `orv160-form`). The tests prove the client holds the bound and the model check, not that OpenRouter ever sends such an answer. The bound's value rests on the parent's assumed bytes-per-token ceiling (parent open question 9); the dated suffix form rests on an assumption until a recorded answer shows it (parent open question 10).

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Decision | Options | Choice | Confirmation |
| --- | --- | --- | --- | --- |
| D1 | Where the notes live (slice spec open question 1) | (a) `docs/specs/ORV-176/tech.md`; (b) `docs/specs/ORV-160/tech.md` | (a), the slice spec's default. The parent's pointer (Impact list, "Contract change, slice 5 only") goes stale: listed in §9 | This file exists; §9 item 1 |
| D2 | How `FetchLike` reads the body in chunks | (a) add `body` beside `json()`; (b) replace `json()` with `body`, a structural byte stream; (c) the DOM `ReadableStream` type | (b). With (a) an unbounded `json()` stays reachable and every fake carries a member the client never calls; (c) needs the DOM lib the engine has not got (`openrouter.ts` line 23, `read-page.ts` lines 7 and 8) | B1: the engine and `@orivilo/web` typecheck with the `actions.ts` line 393 wrapper unchanged (a web `Response` fits the structural type); B4 runs the reader on a real `Response` stream |
| D3 | Which bodies are bounded | (a) the 200 answer only; (b) every body the client reads, the error body too | (b): one reader, so no unbounded read is left in the client. An error body over the bound gives the status error without OpenRouter's text, never the size error | B3's error-body test |
| D4 | Whether `Content-Length` is read | (a) never; (b) as an early refusal beside the count | (a): `orv160-bound-response` says it is never trusted alone, and the count alone holds the rule. `FetchLike` carries no headers | Row 26, mutation M26-2 |
| D5 | What the count counts | the bytes the reader hands out, including the chunk that crosses the bound | The client never holds more than the bound plus that one chunk, and stops at it | Row 26 asserts the read count and one cancel |
| D6 | Where the new code goes | (a) above `openRouterComplete`; (b) appended after line 131, with the changed lines keeping their count | (b): every pin into `openrouter.ts` lines 1 to 131 in the parent spec, the ORV-172, ORV-173, ORV-141 and ORV-144 specs and this slice's row 17 stays true | B5: the diff of `openrouter.ts` touches only lines 27, 107, 114, 120 and 121 and appends after line 131 |
| D7 | The bound's value | the parent's `orv160-bound-response` (open question 9, default (a)) | Copied, not changed. Confirmation per the parent: not confirmed yet; follow-up is slice 7's recordings, which give a real answer's size | Row 26 sizes its bodies from a literal, so a change to the client's constant fails |

## 2. The change in `openrouter.ts`

### Lines that change (same count each)

<!-- prettier-ignore -->
| Line | Today | Slice 5 |
| --- | --- | --- |
| 27 | `) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;` | `) => Promise<{ ok: boolean; status: number; body: ResponseBody \| null }>;` |
| 107 | `const error = (await response.json().catch(() => null)) as {` | `const error = (await readBoundedJson(response.body).catch(() => null)) as {` |
| 114 | `const body = (await response.json()) as {` | `const body = (await readBoundedJson(response.body)) as {` |
| 120 | `// OpenRouter names the model that answered (sometimes with a dated suffix); another model is refused.` | `// The answer names its model: the pinned id, or it with a dated suffix (pinnedModel).` |
| 121 | `if (typeof body.model !== "string" \|\| !body.model.startsWith(options.model)) {` | `if (!pinnedModel(body.model, options.model)) {` |

Lines 118 and 119 stay: the cost is read after line 114, so a body refused at line 114 never reaches line 119 and `costMicroUsd` stays `null` (§3). If `prettier` moves any of these lines, the builder records the moved line and its pins in the report rather than reformatting by hand.

### Appended after line 131

```ts
/** The most bytes of an OpenRouter answer body the client reads (`orv160-bound-response`). */
const RESPONSE_MAX_BYTES = 65_536;

/** The part of a web `ReadableStream<Uint8Array>` this module reads; `Response.body` fits it. */
export interface ResponseBody {
  getReader(): {
    read(): Promise<{ done: boolean; value?: Uint8Array | undefined }>;
    cancel(reason?: unknown): Promise<void>;
  };
}

// The engine's tsconfig has no DOM or Node lib (as in read-page.ts): only the member used here.
declare class TextDecoder {
  decode(input: Uint8Array): string;
}

/**
 * Reads a body as JSON, counting its bytes as they arrive. Once the count passes
 * RESPONSE_MAX_BYTES it stops reading, cancels the stream and throws before anything is parsed,
 * so the cost in that body is never read and `onCall` gets null (a route into
 * `orv160-wallet-gap`). `Content-Length` is never read. A null body reads as "".
 */
async function readBoundedJson(body: ResponseBody | null): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (body !== null) {
    const reader = body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value === undefined) continue;
      total += value.byteLength;
      if (total > RESPONSE_MAX_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new Error(`OpenRouter answered with more than ${RESPONSE_MAX_BYTES} bytes.`);
      }
      chunks.push(value);
    }
  }
  const all = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    all.set(chunk, at);
    at += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(all));
}

/** The pinned id, or the pinned id followed by `-` and 8 digits (`orv160-answer-model`). */
function pinnedModel(answered: unknown, pinned: string): boolean {
  return (
    typeof answered === "string" &&
    (answered === pinned ||
      (answered.startsWith(`${pinned}-`) && /^\d{8}$/.test(answered.slice(pinned.length + 1))))
  );
}
```

Notes for the builder:

- **Exported surface.** One new export, the type `ResponseBody`, which reaches the package root through `src/index.ts` line 11 (`export * from "./openrouter"`). `RESPONSE_MAX_BYTES`, `readBoundedJson` and `pinnedModel` stay private: the tests pin the bound by a literal and the model check through `openRouterComplete`, so neither needs them.
- **The exact refusal text** is `OpenRouter answered with more than 65536 bytes.` It is an operator error, like the other `openRouterComplete` errors: it reaches `outcome.detail`, which `actions.ts` never logs (the comment above `throw new AiFailed(outcome.error)`). No UI string, outcome or code is added (parent "Impact list").
- **The cancel is not awaited**, so a stream whose cancel never settles cannot hold the call after the throw; its rejection is swallowed. `cancel()` is called before the `throw`, so a test sees it.
- **The model check** is the parent's worked example "The model check" written as a function. `\d` without the `u` flag is ASCII 0 to 9 only, and `$` without the `m` flag is the end of the input, so Thai digits and a trailing newline are refused (checked in a scratch run, see the report).
- **Decoding.** `JSON.parse` of the UTF-8 text gives what `response.json()` gave: a default `TextDecoder` strips a UTF-8 byte order mark and replaces a bad sequence, and a body that is not JSON throws a `SyntaxError`, which line 107's `.catch` turns into `null` and line 114 lets through to `finally`.

## 3. The cost of a refused body (`onCall`)

No new code: the order does it. The throw at line 114 comes before line 119 (`costMicroUsd = reportedCostMicroUsd(body);`), so the `finally` at line 128 calls `onCall({ costMicroUsd: null })` exactly once, as for a rejected `fetch` or an unparsable body today. In `apps/web` the ORV-121 `onCall` (`actions.ts` line 395) pushes `{ job: "interpret", model, costMicroUsd: null }`, and `recordUsage` (line 354) writes a step line `ai-usage` with outcome `cost-not-reported` and records the call as not reported, which adds nothing to the month's sum (ADR 0015 decision 12, "No cost is not zero"). This is the second route into `orv160-wallet-gap` that the parent's rule names; this slice does not close it (follow-up ORV-171).

The comment at line 118 ("Read first: an answer refused below still cost what it cost") stays true for every refusal after line 119; the size refusal happens before it and is described in `readBoundedJson`'s doc comment.

## 4. Consumers (impact list)

From the parent's "Impact list", "Contract change, slice 5 only", each checked against the checkout.

<!-- prettier-ignore -->
| Consumer | Where | Change | Proof |
| --- | --- | --- | --- |
| The `fetch` wrapper | `apps/web/app/directions/actions.ts` line 393, `fetch: (url, init) => fetch(url, init as RequestInit),` | None. A web `Response` is assignable to the new return type (`body: ReadableStream<Uint8Array> \| null` fits `ResponseBody \| null`) | `pnpm --filter @orivilo/web typecheck` passes with the line unchanged (B1); B4 runs it with a real `Response` |
| The ORV-121 `onCall` and `recordUsage` | `actions.ts` lines 395 and 354 | None. A refused body arrives as `costMicroUsd: null`, a value both already handle | B4 asserts the null record and the `cost-not-reported` line |
| `fakeFetch` | `packages/intent-engine/src/llm-interpreter.test.ts` line 170 | Line 177 `json: () => Promise.resolve(body),` becomes `body: oneChunk(body),`. `oneChunk` (a one-chunk `ResponseBody` of `JSON.stringify(body)`) and a module-scoped `declare class TextEncoder` (the shape of `read-page.test.ts` line 32) are appended after line 241, so lines 170 to 241 keep their numbers (the parent pins lines 170, 201 and 212 and the range 185 to 241) | The file's tests pass unchanged in their assertions (B1) |
| C's fakes | `openrouter.test.ts` lines 29 to 32 (`ok`), 84 to 90 (the 500), 101 to 107 (the unparsable 200) | `ok(body)` answers `body: chunked(JSON.stringify(body)).body`; the 500 answers the same for `{ usage: { cost: 0.014 } }`; the unparsable 200 answers the bytes of `not json` and expects `.rejects.toThrow(SyntaxError)` (it expected the fake's own `bad json` message). `chunked` and `TextEncoder` as in §5. No document pins a line of C | C passes (B1) |
| `fetchSpy` in A | `actions.test.ts` line 157 and every `new Response(...)` it resolves | None: a real `Response` has a real `body`. The error bodies `down` (line 814) and the `Response.json` 401 (line 393) read as before | A passes unchanged (B1) |
| `llm-guardrails.test.ts`, scripts, stories | none builds a `FetchLike` or calls `openRouterComplete` (searched the checkout) | None | The search in the report |

Addition, 2026-10-30 (ORV-160 slice 8, held from review ORV-176 finding S2). The last row is the record of these notes and is wrong for `llm-guardrails.test.ts`: its row 3 test builds a `FetchLike` (`doFetch`, line 193) and calls `openRouterComplete` (line 206), so it is one more consumer. PR 159 (`c054855`) moved its answer to `body: oneChunk({ ... })` (line 198), with `oneChunk` (line 411) and a module-scoped `declare class TextEncoder` (line 406) appended to the file, in the shape this section gives `fakeFetch`. Lines are those of `develop` at `b7e9d0d`. For scripts and stories the row held at `d8c9fa7`; the recorder script came later, in ORV-177.

## 5. Tests by acceptance row

All new tests go in C under one block, `describe("ORV-160 slice 5 (ORV-176): client hardening, rows 17 and 26", ...)`, after the slice 2 block, with a comment that every answer in it is hand-written, not a recording (`orv160-form`).

### Helpers (in C, above the new block)

```ts
// The engine's tsconfig has no DOM lib (as in read-page.test.ts line 32).
declare class TextEncoder {
  encode(input: string): Uint8Array;
}
const enc = new TextEncoder();

/** `orv160-bound-response`, written out: a change to the client's constant fails row 26. */
const BOUND = 65_536;

/** A body that hands out `text`'s bytes in `size`-byte chunks and counts reads and cancels. */
function chunked(text: string, size = 16_384) { ... returns { body, seen: { reads, cancels } } }

/** A valid 200 answer with `usage.cost` 0.014 whose UTF-8 form is exactly `bytes` bytes, padded by an extra `pad` key. */
function sized(bytes: number): string
```

`sized` pads with ASCII `x`, so the byte length is exact; the client ignores the unknown `pad` key. The scratch run gave 65,537 and 65,536 bytes for `sized(BOUND + 1)` and `sized(BOUND)`, in 5 and 4 chunks of 16,384.

### Row 17 (`orv160-answer-model`, slice 5 form)

One `it`: an answer whose `model` is MODEL plus `-evil` (through `run(ok(answer({ model })))`) rejects with `new Error("OpenRouter answered with another model.")`; one whose `model` is MODEL plus `-20261001` resolves `"{}"`. Row 14's slice 2 test stays as it is and still passes.

Mutation M17: `pinnedModel`'s body becomes `typeof answered === "string" && answered.startsWith(pinned)` (the Red when: line 121 back to the `startsWith` form). Row 17 goes red on `-evil`.

### Row 26 (`orv160-bound-response`)

Three cases, each with `run(...)` so `onCall`'s calls are kept:

<!-- prettier-ignore -->
| Case | Fake response | Expect |
| --- | --- | --- |
| Chunked, one byte over | `{ ok: true, status: 200, body }` from `chunked(sized(BOUND + 1))`, no headers | Rejects with `new Error("OpenRouter answered with more than 65536 bytes.")`; calls `[{ costMicroUsd: null }]` (the body holds cost 0.014, so null shows it was refused before it was parsed); `seen.reads` 5 (stopped at the chunk that crossed, never read the end); `seen.cancels` 1 |
| Mislabelled, one byte over | The same body plus `headers: { get: (name: string) => (name.toLowerCase() === "content-length" ? "100" : null) }`, built in a `const` first so the extra member passes the type check | The same four expectations |
| At the bound | `chunked(sized(BOUND))`, no headers | Resolves `"{}"`; calls `[{ costMicroUsd: 14000 }]`; `seen.reads` 5 (4 chunks and the end); `seen.cancels` 0 |

Mutations (each seen red, then restored, one `verified` row each):

- **M26-1** (Red when 1): the `if (total > RESPONSE_MAX_BYTES) { ... }` block deleted. Cases 1 and 2 resolve: red.
- **M26-2** (Red when 2): that block deleted and, before line 114, `const declared = Number((response as { headers?: { get(n: string): string | null } }).headers?.get("content-length") ?? 0); if (declared > RESPONSE_MAX_BYTES) throw new Error("too big");`. Cases 1 and 2 resolve: red. The mutant need not typecheck; `vitest` runs it.
- **M26-3** (the value): `RESPONSE_MAX_BYTES` becomes `65_537`. Cases 1 and 2 resolve: red. And `65_535`: case 3 rejects: red.

**The Person cell** ("a refused one reaches them as `orv160-fallback`"): the throw leaves `complete`, so `llmInterpreter`'s `interpret` throws, `interpretBrief` returns `adapter-failed` (`interpreter.ts` lines 121 to 129) and `readBriefWithAi` answers `ai-failed` with `UPSTREAM_FAILED`. B4 shows it end to end.

### Beyond the rows (they pin decisions D2, D3 and the consumers)

- **C, the error body (D3):** `{ ok: false, status: 500, body }` from `chunked(...)` of `{"error":{"message":"..."}}` padded past `BOUND` rejects with `new Error("OpenRouter answered 500.")` (no OpenRouter text), `seen.cancels` 1, calls `[{ costMicroUsd: null }]`.
- **A, the consumer and the Person cell:** one more case in the `it.each` of "a call with no reported cost is recorded as not reported" (lines 813 to 823), inserted after the "an aborted request" entry (line 822) so every pinned line of A up to 822 keeps its number: `["an answer over the response bound (ORV-160 row 26)", () => fetchSpy.mockImplementation(async () => completion(JSON.stringify(GOOD), { pad: "x".repeat(65_536) }))]`. The body carries cost 0.014 and a good reading, so the existing assertions (`UPSTREAM`, `[entry(null)]`, month sum 0, one `cost-not-reported` line) hold only if the bound refused it before the cost was read. Under M26-1 it reads `ok: true` with `entry(14_000)`: red. It is the one test that runs `readBoundedJson` on a real web `Response` stream, the type the production path passes.

## 6. Build table

One deliverable per row, in order. Every row's `done_when` includes `pnpm --filter @orivilo/intent-engine lint`, `typecheck` and `test`; B1 and B4 also the same three for `@orivilo/web`.

<!-- prettier-ignore -->
| # | Deliverable | Files | Tests that prove it |
| --- | --- | --- | --- |
| B1 | The contract change and every consumer compiling: §2 (lines 27, 107, 114, 120, 121 and the appended block) and §4's fake edits | `packages/intent-engine/src/openrouter.ts`, `packages/intent-engine/src/openrouter.test.ts` (fakes and helpers only), `packages/intent-engine/src/llm-interpreter.test.ts` | C, `llm-interpreter.test.ts` and A pass with no assertion changed except the unparsable 200 (`SyntaxError`); both packages typecheck with `actions.ts` line 393 unchanged; `git diff develop -- apps/web/app/directions/actions.ts` is empty |
| B2 | Row 17 | `openrouter.test.ts` | The row 17 test passes; M17 seen red and restored |
| B3 | Row 26 and the error body (D3) | `openrouter.test.ts` | The three row 26 cases and the error-body test pass; M26-1, M26-2 and M26-3 seen red and restored |
| B4 | The consumer and Person check in A | `apps/web/app/directions/actions.test.ts` | The new `it.each` case passes; M26-1 makes it red; restored |
| B5 | The gate and the pin check | none new | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` with real output; `git diff -U0 develop -- packages/intent-engine/src/openrouter.ts` shows hunks only at lines 27, 107, 114, 120, 121 and after 131 (D6); `pnpm quality-gate` in the foreground on a clean tree |

Size: about 50 lines in `openrouter.ts`, 90 in C, 12 in `llm-interpreter.test.ts` and 7 in A, under the parent's 400-line aim.

## 7. Review

The full review set (parent "Slices", item 5): `reviewer`, `qa` and `security` (`orv160-security-dispatch`) on the PR head. For `security`: the bound holds memory to the bound plus one chunk and refuses before parsing; `Content-Length` is never read (D4); the refusal text holds no answer content; a refused body's cost is recorded as not reported, the named `orv160-wallet-gap` route.

## 8. Is an ADR needed?

No. ADR 0009 keeps the client's design (one provider, pinned models, no fallback); this slice narrows a check and bounds a read inside it and adds no provider, dependency or runtime. The rule values live in the parent spec. ADR 0015 decision 3's rows for LLM04:2026 and LLM06:2026 gain these tests in slice 8, which the parent's "Docs to bring up to date" already lists.

## 9. Documents to bring up to date

Outside this file's write set, for the main session to place (most belong to slice 8's dated additions, never a rewrite):

1. `docs/specs/ORV-160/spec.md` line 249: "Tech notes `docs/specs/ORV-160/tech.md` list them before slice 5." becomes "Tech notes `docs/specs/ORV-176/tech.md` list them before slice 5." (D1), with a parent changelog line. The same line's "`FetchLike` ... gains a way to read the body in chunks" reads, after D2, "`FetchLike`'s `json()` is replaced by `body`, read in chunks so its bytes can be counted".
2. `docs/specs/ORV-160/spec.md` line 103 (`orv160-bound-response`): "Today no bound exists (`openrouter.ts` reads `response.json()` at lines 107 and 114 with no size check)." is history once B1 merges; after it, lines 107 and 114 call `readBoundedJson`.
3. `docs/specs/ORV-160/spec.md` line 107 (`orv160-answer-model`): "Today: ... (`openrouter.ts` line 121, `!body.model.startsWith(options.model)`)" is history once B1 merges; after it, line 121 is `if (!pinnedModel(body.model, options.model)) {`.
4. `docs/specs/ORV-160/spec.md` line 67 (row 14) and `docs/specs/ORV-172/spec.md` line 39: the Red when names "the `if` that tests `body.model.startsWith(options.model)`"; lines 121 to 123 still hold the `if` and its throw (D6), so the mutation still makes row 14 red; only the quoted condition is stale.
5. `docs/specs/ORV-121/tech.md` line 169: "`response.json()` has already parsed the number" stays true in substance (`JSON.parse` parses it now); no change needed.

Addition, 2026-10-30 (ORV-160 slice 8). Items 1 to 3 are placed in parent spec v1.4 as re-pins and dated notes, found by their text (the line numbers above had moved). Item 4 is not: the parent's rule against row text changes keeps row 14's Red when as written, and the parent's v1.4 changelog line records why the mutation still holds. `docs/specs/ORV-172/spec.md` was not edited.

## Findings for the spec

None. Rows 17 and 26 are met as written; open question 1 is taken at its default (D1).
