---
issue: ORV-173 (https://tpetkaew.atlassian.net/browse/ORV-173)
parent: ORV-160 (docs/specs/ORV-160/spec.md v1.2)
lane: L
version: 1.0
---

# ORV-173: the AI reading boundary and its label under the guardrail set (ORV-160 slice 4)

## Why

ORV-173 is slice 4 of ORV-160, "Boundary and label" (parent "Slices", item 4), made its own Jira issue so its PR, its review and its QA record read a spec of their own (L-0016). It adds no requirement: the six rows below are ORV-160 rows 6, 7, 8, 25, 28 and 32, copied word for word with their numbers and every column, Red when included. The rules they name are defined in the parent spec; this file points to them.

**What the slice does.** The parent's other slices test the interpreter and the OpenRouter client inside `packages/intent-engine`. This slice tests the same path where it meets the app: the server action `readBriefWithAi` in `apps/web` (rows 6, 7, 8 and 25, in A beside PR 141's spend cap tests) and the label and the quotes a person sees in `DirectionStudio` (rows 28 and 32, in the new W). It is test-only (parent "Slices", item 4).

**Frame.** As in the parent spec ("Why", **Frame**): the set is tests, not a hook that judges a tool call's text. The four parts L-0012 applies to (`orv160-titles`, `orv160-network-block`, `orv160-recorder-output`, `orv160-recorder-key`) are not in this slice.

**What is real.** As the parent's "What is real" says. In this slice `fetchSpy` stands in for OpenRouter with hand-written bodies, and the spend cap is the `spendCap` fake of A; both are test doubles, not simulated product features. The rows prove that the app's own code sends, logs, times out and renders as stated, not that a model resists an attack. Nothing here claims conformance to the OWASP LLM Top 10 (`orv160-no-conformance`).

## Story

The parent's story, unchanged: ORV-160 spec, "Story".

## Parent and decisions

- Parent spec: `docs/specs/ORV-160/spec.md` v1.2. Its "Rules and bounds", "Worked examples", "Out of scope", "Impact list" and "Open questions" are the one home for this issue too; this file points to them and does not restate them.
- ORV-160 comment 10293: G1 and G2 for ORV-160, passed under the owner's delegation (ADR 0012 decision 4), with the owner's decisions on open questions 7 and 12. They cover this slice; this issue raises no new G1 or G2.
- Lane **L**, from the parent ("Lane"): resolver logic. No `design.md`: rows 28 and 32 read existing UI and add no screen, component or copy (parent "Lane").
- Tech notes: none for this slice. The parent writes them only before slice 5 (parent "Lane").
- Review: `security` runs on this slice's PR by `orv160-security-dispatch`, which names slice 4.

## Acceptance criteria

Copied from the parent's "Acceptance criteria" paragraph, restricted to the file keys this slice uses: Each row's Test column names the file and the form (`orv160-form`); the Red when column names one mutation per clause the row asserts (per half of a two-part check, `.claude/rules/testing.md` line 32), numbered when there are two, each seen red and restored by the builder with one `verified` row. A mutation names its file, its line and the code text on that line; the lines were read on this branch's head 8727389, after PR 141 (739ee3b), and where a line has moved since, the code text decides. An outcome a row names is asserted exactly (`ok` and `error`), so a refusal of another kind is red too. A row that ends in `adapter-failed` reaches a person as `orv160-fallback` says. File keys: **A** `apps/web/app/directions/actions.test.ts`; **W** `apps/web/app/directions/ai-reading.test.tsx` (new). `MODEL` is `AI_MODELS.interpret`. In A, "the cap allows" means the `spendCap` fake (`actions.test.ts` line 116) with the person's workspace in `state.members` and its month sum under `state.cap`.

<!-- prettier-ignore -->
| # | Entry | Given | When | Who sees what | Data effect | Test and form | Red when | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | LLM01:2026 at the boundary | A signed-in person whose workspace the cap allows; the brief of row 1; `fetchSpy` answers 200 through `completion` (`actions.test.ts` line 682) with a valid reading quoting "playful" | `readBriefWithAi(brief)` | Operator: the body `fetchSpy` received has `messages[0].content` equal to `LLM_SYSTEM_PROMPT` and `messages[1].content` equal to the brief; the outcome is `ok: true` with a reading whose `method` is `llm` and a seal | One usage record per request sent (job `interpret`, `model` MODEL, the reported cost; ORV-121), nothing else saved: no direction, version or reading | A, fake `fetch`, hand-written body | `actions.ts` line 400, `outcome = await interpretBrief(adapter, { text: brief });`, becomes `outcome = await interpretBrief(adapter, { text: "Brief: " + String(brief) });` | 4 |
| 7 | LLM02:2026 nothing of the request context | A signed-in person `user-7f3a` in workspace `ws-9c21`, which the cap allows; `fetchSpy` answers 200 as row 6 | `readBriefWithAi("a calm clinic")` | Operator: `JSON.stringify` of `fetchSpy`'s call arguments (URL, headers, body) holds neither `user-7f3a`, `ws-9c21` nor the boundary line's `requestId`; the header names are `orv160-request-envelope`'s | As row 6 | A, fake `fetch`, hand-written body | (1) Header names: `openrouter.ts` lines 94 to 98, the `headers` object, gain a fourth key `"HTTP-Referer": "https://orivilo.app"`. (2) No id: `actions.ts` line 393, `fetch: (url, init) => fetch(url, init as RequestInit),`, becomes `fetch: (url, init) => fetch(url + "?ws=" + String(workspaceId), init as RequestInit),` (the header names stay three) | 4 |
| 8 | LLM02:2026 personal data not logged | A signed-in person whose workspace the cap allows, Thai or English UI; the brief `Contact ana@example.com or 081-234-5678, playful`; `fetchSpy` answers 500 | `readBriefWithAi(brief)` | Person: as `orv160-fallback`. Operator: the outcome is `ai-failed` with `UPSTREAM_FAILED`; the call writes one boundary line (`reason` `adapter-failed`) and one `ai-usage` step line (`cost-not-reported`), and no line, boundary or step, holds `ana@example.com`, `081-234-5678` or `OpenRouter answered` | One usage record with `costMicroUsd` null (not reported); no reading saved | A, fake `fetch` | `actions.ts` line 407, `throw new AiFailed(outcome.error);`, becomes `throw new AiFailed(outcome.detail as AiFailure);` (the boundary line's `reason` then carries the detail) | 4 |
| 25 | LLM06:2026 time | A signed-in person whose workspace the cap allows; `vi.spyOn(AbortSignal, "timeout")`; `fetchSpy` answers 200 as row 6 | `readBriefWithAi("a calm clinic")` | Operator: `AbortSignal.timeout` was called once, with `orv160-bound-abort`, and the signal it returned is the one `fetchSpy` received. No wall clock is read | As row 6 | A, fake `fetch` and a spy | `actions.ts` line 346, `const AI_TIMEOUT_MS = 20_000;`, becomes `30_000` | 4 |
| 28 | LLM07:2026 the label | `DirectionStudio` rendered with `renderToStaticMarkup`, `defaultBrief` set to row 27's brief (the brief the reading was made from; line 393 keeps an AI reading only while the brief equals it) and `defaultReading` set to the reading of row 27 (DirectionStudio.tsx line 386), English then Thai catalog | The markup is read | Person: "Read by AI (anthropic/claude-sonnet-5.5)" / "อ่านโดย AI (anthropic/claude-sonnet-5.5)", and neither "Read by rules" nor "อ่านตามกฎ" | None | W, static render | `DirectionStudio.tsx` line 513, `? fill(m.byAi, { model: reading.adapter.version.split("+").at(-1) ?? "" })`, becomes `? m.byRulesOnly` | 4 |
| 32 | LLM10:2026 markup in a quote | The brief `<img src=x onerror=alert(1)> playful` and an AI reading whose `notUnderstood` quotes `<img src=x onerror=alert(1)>`, rendered as row 28 with `defaultBrief` set to this brief | The markup is read | Person: the tag shows as text; the markup holds `&lt;img src=x onerror=alert(1)&gt;` and no `<img` element | None | W, static render | `DirectionStudio.tsx` lines 566 to 568: the `<p className="ds-direction__muted">` renders `fill(m.notUnderstood, { list: notUnderstood.join(", ") })` through `dangerouslySetInnerHTML={{ __html: ... }}` instead of as its text child | 4 |

Notes on the rows (no row above is changed by them):

- **Rows the copied rows point to.** Row 6 names "the brief of row 1", and row 28 names "row 27's brief" and "the reading of row 27". Rows 1 and 27 belong to slice 3 and stay in the parent's table; their Given cells there are the one source of that brief and that reading.
- **Line numbers.** The rows' line numbers are the parent's, read on 8727389; the code text decides where a line has moved. For orientation only, on this worktree (`develop` 2d77c30), by search: `actions.ts` lines 346, 393, 400 and 407 hold the code text rows 25, 7, 6 and 8 name; in A, `vi.mock("../../server/spend-cap"` is at line 116 with `spendCap: () =>` at line 117, `fetchSpy` at line 156 and `completion` at line 682; `DirectionStudio.tsx` is `packages/design-system/src/components/direction-studio/DirectionStudio.tsx`, where line 386 reads `defaultReading`, line 513 holds the `m.byAi` text of row 28 and lines 566 to 568 hold the `<p>` of row 32.
- **Mutations per clause.** Row 7 names two mutations, numbered (1) and (2); rows 6, 8, 25, 28 and 32 name one each. The builder records each red run as one `verified` row (parent "Acceptance criteria" paragraph, copied above).

## Rules and bounds

This file defines no rule. The rule names the rows and the paragraph above use are defined once in the ORV-160 spec, "Rules and bounds": `orv160-form` (the paragraph), `orv160-fallback` (the paragraph, row 8), `orv160-request-envelope` (row 7) and `orv160-bound-abort` (row 25). "Why" and "Parent and decisions" point to `orv160-no-conformance` and `orv160-security-dispatch` there. A change to one of them is made in the parent spec first.

## Worked examples

The six rows cite no worked example of the parent by title; the parent's "Worked examples" stay its own. Each line below is written from its source and was not run in this task (no shell); the main session runs them from the worktree root.

- **The rows the recorder reads.** Method: the row reader of `docs/specs/ORV-169/spec.md` ("Worked examples", after `specRows` in `scripts/ovl/result-recorder.mjs`): the first line matching `^\|\s*#\s*\|`, then each following line that starts with `|`, cells split on `|`, cell 1 kept when it is digits. Input: this file. No row of this table holds a pipe inside a cell, so each row splits into nine cells. No rounding.

  ```bash
  node -e 'const l=require("fs").readFileSync("docs/specs/ORV-173/spec.md","utf8").split("\n");const s=l.findIndex(x=>/^\|\s*#\s*\|/.test(x));const r=[];for (const x of l.slice(s+2)){if(!x.startsWith("|"))break;const c=x.split("|").slice(1,-1).map(y=>y.trim());if(/^\d+$/.test(c[0]))r.push(c)}console.log(r.map(c=>c[0]).join(" "));console.log(r.every(c=>c.length===9))'
  # expected:
  # 6 7 8 25 28 32
  # true
  ```

- **The rows match the parent cell for cell** (L-0016 guard metric). Method: the same row reader on both files, each copied row compared as a whole line with the parent's row of the same number. Input: this file and `docs/specs/ORV-160/spec.md` v1.2. No rounding.

  ```bash
  node -e 'const rows=f=>{const l=require("fs").readFileSync(f,"utf8").split("\n");const s=l.findIndex(x=>/^\|\s*#\s*\|/.test(x));const m={};for (const x of l.slice(s+2)){if(!x.startsWith("|"))break;const n=x.split("|")[1].trim();if(/^\d+$/.test(n))m[n]=x}return m};const a=rows("docs/specs/ORV-173/spec.md"),p=rows("docs/specs/ORV-160/spec.md");console.log(Object.keys(a).join(" "),Object.keys(a).every(n=>a[n]===p[n]))'
  # expected:
  # 6 7 8 25 28 32 true
  ```

## Out of scope

- The ORV-160 rows of the other slices, which stay in the ORV-160 spec: rows 9 to 16, 19 to 24 and 29 (slice 2); rows 1 to 5, 18, 27, 30, 31 and 33 (slice 3); rows 17 and 26 (slice 5); rows 34 to 37 (slice 7).
- Slice 1 (the parent spec and K-0093, PR 154), slice 6 (only if the parent's open question 5 is (b)) and slice 8 (docs closing).
- Everything the parent spec's "Out of scope" lists.

## Impact list

- **Tests**: A gains rows 6, 7, 8 and 25; W is new, holding rows 28 and 32 (parent "Impact list", **New test files** and **Changed tests**). No source, config, catalog key or UI string changes.
- **Contract**: none. This slice is test-only (parent "Slices", item 4).

## Open questions

The parent's open questions 1 to 12 are answered by their defaults or by the owner (ORV-160 comment 10293) and are not reopened here. This slice raises no question of its own.

## Depends on

ORV-160 spec v1.2 (the parent: rules, worked examples, open questions, "Slices" item 4); ORV-160 comment 10293 (G1 and G2, open questions 7 and 12); ORV-121 and PR 141 (merged as 739ee3b: the spend cap, the `spendCap` fake and `completion` in A); ORV-144 (`orv144-outcome`, `UPSTREAM_FAILED`, through `orv160-fallback`); L-0016 (slice issue spec); ADR 0012 decision 4; ADR 0009 point 8; ADR 0015 decision 13.

## Changelog

- v1.0 (2026-10-30): first spec, ORV-160 slice 4 as its own issue (task ORV-173-spec-1), written from ORV-160 spec v1.2 (L-0016). Rows 6, 7, 8, 25, 28 and 32 copied word for word with their numbers and every column; the parent's file keys A and W and its meaning of "the cap allows" copied; no new requirement. Downstream to review: the ORV-173 Jira acceptance (these rows), the first builder envelope for ORV-173 (fact `test -f docs/specs/ORV-173/spec.md`, L-0016), and the parent's "Slices" item 4, which does not yet name ORV-173.
