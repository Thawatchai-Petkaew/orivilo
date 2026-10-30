---
issue: ORV-178 (https://tpetkaew.atlassian.net/browse/ORV-178)
parent: ORV-160 (slice 7b, the second part of slice 7, "Network block and recordings")
lane: L, inherited from ORV-160
version: 1.1
---

# ORV-178: ORV-160 slice 7b, the recorder run and the recorded replay

## Why

ORV-178 is slice 7b of ORV-160, the guardrail test set from the OWASP LLM Top 10 2026 for the interpreter path. The parent's "Slices" list, item 7, names slice 7 "Network block and recordings" with rows 34 to 37, and names a recorder run under `orv160-recorder-run` as its G4 evidence. Slice 7 was split in two (ORV-177 spec, "Why"): row 35, the recorded replay, needs the fixture file that only a recorder run writes, and that run waits for the owner's confirmation before it starts (`orv160-recorder-run`). ORV-177 (slice 7a, PR 160, merged into `develop` as c068371) built the network block and the recorder script with its test (rows 34, 36 and 37) and made no call. This slice holds what is left: the one recorder run with a real key, the fixture file it writes, and row 35, the test R that replays that file.

This file is the slice spec of L-0016: a slice issue gets its own spec. It adds no requirement and no gate of its own. The business intent, the story, the frame and the set structure are the parent's ("Why", "Story", "The set this covers").

**This slice makes model calls, once.** The run is the only step of ORV-160 that spends money: its bound and its cost estimate are `orv160-recordings`, and it starts only after the owner confirms it as `orv160-recorder-run` says. R itself calls no model and no network: it replays the file through a fake model (`orv160-form`, the recorded answer form).

**Frame.** Not a hook that judges a tool call's text. Two guard-rail parts of the parent's "Frame" are finished here: `orv160-recorder-output` (R's check that its own source holds no recording) and `orv160-recorder-key` (the route of a real key into the one run). Their frame is the parent's "Frame" sentences for them: guard rails for agents that follow the rules, not boundaries. What bounds a leaked developer key outside the session is named there too (its own credit limit in OpenRouter and that it can be revoked alone).

**What is real.** The recordings show what one model answered on one date to the 9 case briefs, not how it behaves in general, and the run's cost is an estimate until the run reports it (parent "What is real"). Row 35 proves that the code's checks give the same outcome on replay as they gave during the run; it says nothing about the model's answers on another date. A recorded outcome that differs from its hand-written row is a finding, reported in the PR body as row 35 says, not a fix.

## Parent spec and gates

- Parent spec: `docs/specs/ORV-160/spec.md` v1.3 (changelog line "v1.3 (2026-10-30)").
- G1 and G2: ORV-160 comment 10293, passed under the owner's delegation in POC mode (ADR 0012 decision 4, parent "Lane"). The same comment holds the owner's decision on who runs the recorder (parent open question 7), written in the parent as `orv160-recorder-run`. ORV-178 inherits G1 and G2; no new gate decision is needed for this slice. The confirmation before the run is not a gate: it is the step `orv160-recorder-run` names.
- Decisions: the parent's "Depends on".
- Review: the full review set (parent "Slices", item 7); `security` runs on this slice's PR as `orv160-security-dispatch` says.
- G4: the recorder run is this slice's G4 evidence (section "The run"), the default of ORV-177's open question 1.

## Acceptance criteria

Row 35 of the parent spec, copied with its number, its columns and its text unchanged. The conventions for the Red when column and the exact outcomes are the parent's "Acceptance criteria" opening paragraph. File key for this slice, from the parent: **R** `packages/intent-engine/src/llm-recorded.test.ts` (new). The parent's other file keys (G, C, A, W, P) belong to other slices; P (rows 36 and 37) is ORV-177's and is already on `develop`.

<!-- prettier-ignore -->
| # | Entry | Given | When | Who sees what | Data effect | Test and form | Red when | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 35 | Recorded replay | The fixture file of `orv160-recorder-output`, one recording per case of rows 1 to 5, 18, 27, 30 and 31 | Each replays through `interpretBrief` with a fake model that returns the recorded text | Operator: each outcome equals the one the recorder wrote beside it (`ok`, or the `error` kind); each span of an `ok` reading is the brief's own words at that place; R's own source text holds none of the recorded raw texts; the file holds neither `sk-or-` nor `Bearer`. A recorded outcome that differs from its hand-written row is listed in the PR body as a finding | None | R, recorded answer | (1) One recorded quote in the fixture file edited to words the brief does not hold. (2) One recording pasted into R as a string literal | 7 |

Reading notes, no new requirement:

- "Each" in row 35's When and in its first clause is the 9 cases its Given lists: the briefs of parent rows 1, 2, 3, 4, 5, 18, 27, 30 and 31, held in the recorder as ids `row-1`, `row-2`, `row-3`, `row-4`, `row-5`, `row-18`, `row-27`, `row-30` and `row-31` (`scripts/probe/openrouter-interpret-record.mjs` lines 31 to 45).
- "Each span of an `ok` reading" is the evidence of every finding and every `notUnderstood` entry of that reading (`readAnswer`, `llm-interpreter.ts` lines 139 to 159), checked against the entry's own `text`.
- "The recorded raw texts" are the entries whose `raw` is a string; an entry whose call failed before an answer reached the interpreter has `raw` null (section "The fixture file R reads") and holds no text to search for (open question 1).
- "Its hand-written row" is the outcome the slice 3 test G asserts for the same row on `develop` (head c068371), as follows. R does not assert these; the PR body compares them.

<!-- prettier-ignore -->
| Case | Hand-written outcome in G | Where |
| --- | --- | --- |
| `row-1` | `ok` | `llm-guardrails.test.ts` line 159 |
| `row-2` | `adapter-failed` | line 178 |
| `row-3` | `ok` (the parent's row 3 text names no outcome; G asserts it) | line 209 |
| `row-4` | `adapter-failed` | line 231 |
| `row-5` | `adapter-failed` | line 244 |
| `row-18` | `adapter-failed` | line 262 |
| `row-27` | `ok` | line 278 |
| `row-30` | `adapter-failed` | line 296 |
| `row-31` | `adapter-failed` | line 314 |

## The fixture file R reads

A fact about the merged recorder, read from its source on `develop` (head c068371), not a rule of this spec. Where the file goes and how it is written is `orv160-recorder-output`; what an entry keeps is `orv160-recordings`. The merged script writes this shape:

- **Path:** `packages/intent-engine/src/llm-recorded.json` (`DEFAULT_FIXTURE`, script lines 24 to 26), written once at the end of the run (lines 126 to 129). It does not exist on `develop` yet.
- **Top level:** exactly three keys, `model` (`AI_MODELS.interpret`, the pinned id asked for), `date` (`YYYY-MM-DD`, the run's date in UTC, line 102) and `cases` (line 128).
- **Each entry of `cases`:** exactly seven keys (P asserts the set, `scripts/openrouter-interpret-record.test.mjs` lines 100 to 108), in the order of the case list (line 104):
  - `id`: the case id, `row-1` to `row-31` as listed above;
  - `text`: the brief exactly as sent, the tag characters of `row-4` included (P lines 112 to 125);
  - `model`: the `model` the answer named, or null when no body was read (P lines 162 and 163); a foreign model is kept as itself (P lines 140 to 149);
  - `date`: the same date as the top level;
  - `raw`: the model's raw answer text as `openRouterComplete` returned it, or null when the call threw before returning one (an HTTP failure, the abort, a refused body, another model; P line 162);
  - `outcome`: `ok`, or the `error` kind of `interpretBrief` (line 122);
  - `durationMs`: the call's duration in whole milliseconds (line 121).

R reads `text`, `raw` and `outcome` of each entry, and the whole file's text for the `sk-or-` and `Bearer` clause. A recording is untrusted data (`orv160-recorder-output`).

## The run

This slice's G4 evidence is the one recorder run, under the parent's rules and no others:

1. Confirmation: the main session asks the owner as `orv160-recorder-run` says, before the run, with the bound and cost of `orv160-recordings` and the key route of `orv160-recorder-key`. No run starts without it.
2. Key: the owner places the key as `orv160-recorder-key` says, outside the session, in this slice's worktree.
3. Run: the builder starts the command `orv160-recorder-key` names, from the worktree root, once. The script writes the fixture file (`orv160-recorder-output`).
4. Record: the builder's report keeps the lines the recorder wrote (one per case and the closing "Wrote ... recordings to ..." line, script lines 124 and 130) and its exit code. That is the run record `orv160-recorder-key` keeps free of the key's text.
5. R: the builder writes R against the committed fixture file and sees each Red when mutation red, then restored.

The G4 packet names the run record, the fixture file's `date` and `model`, the 9 outcomes, and the lane L G4 evidence of ADR 0012 for this slice's change (the merged head on staging with its checks green). A second run is a new spend and asks again (`orv160-recorder-run`).

## Rules and bounds

None of its own. Each rule has one home, the parent's "Rules and bounds"; this list points to it and restates no outcome, threshold or form.

- Named by row 35 and by "The fixture file R reads": `orv160-recorder-output`.
- Named by "The run": `orv160-recordings` (the run's bound, its cost estimate and what an entry keeps), `orv160-recorder-key` (the key route and the command) and `orv160-recorder-run` (the confirmation before the run).
- Named by the Test and form column: `orv160-form` (the recorded answer form).
- Named for this slice's review: `orv160-security-dispatch`.

## Worked examples

The case count 9 and the run's cost are the parent's worked example "The run cost" (`orv160-recordings`); the lookup that places a quote is the parent's "The quote check". This slice adds two examples for the two checks row 35 adds. Each was not run in this task (no shell); the main session runs them.

- **The span and file checks** (row 35, the span clause and the `sk-or-` and `Bearer` clause). Input: the `row-31` brief "a playful brand" (script line 44); the lookup of `locator` for a first occurrence (`llm-interpreter.ts` lines 128 to 132); one entry in the shape of script line 128, trimmed to the keys the check reads, then the same entry with row 37's fake key added (the mutation row 37 names). Offsets in UTF-16 code units, no rounding.

  ```bash
  node -e 'const text="a playful brand";const at=(t,q)=>{const i=t.indexOf(q);if(i<0)throw new Error("not in the brief");return {start:i,end:i+q.length,text:q}};const span=at(text,"playful");const holds=s=>text.slice(s.start,s.end)===s.text;console.log(JSON.stringify(span),holds(span),holds({start:0,end:7,text:"playful"}));const file=c=>JSON.stringify({model:"anthropic/claude-sonnet-5.5",date:"2026-10-30",cases:[c]},null,2);const bad=f=>f.includes("sk-or-")||f.includes("Bearer");console.log(bad(file({id:"row-31",text,raw:null,outcome:"adapter-failed"})),bad(file({id:"row-31",text,raw:null,outcome:"adapter-failed",key:"sk-or-v1-test-0000"})))'
  # expected:
  # {"start":2,"end":9,"text":"playful"} true false
  # false true
  ```

- **The source check** (row 35, the clause "R's own source text holds none of the recorded raw texts", and its mutation (2)). Input: two `raw` values in the shape of script line 123, one null and one a JSON answer in the schema's shape (hand-written, not a recording); a stand-in line of R's source; the same source with the second raw pasted as a double-quoted string literal. Counts, no rounding. It shows that a raw answer is JSON, so a pasted literal escapes its quotes and a plain search misses it (open question 2).

  ```bash
  node -e 'const raws=[null,"{\"findings\":[],\"notUnderstood\":[]}"];const kept=raws.filter(r=>typeof r==="string");const clean="const fixture = JSON.parse(await readText(FIXTURE_PATH));";const pasted=clean+"\nconst raw = "+JSON.stringify(kept[0])+";";const plain=s=>kept.filter(r=>s.includes(r)).length;const both=s=>kept.filter(r=>s.includes(r)||s.includes(JSON.stringify(r).slice(1,-1))).length;console.log(kept.length,plain(clean),both(clean),plain(pasted),both(pasted))'
  # expected:
  # 1 0 0 0 1
  ```

## Out of scope

- The parent's other 36 rows (1 to 34, 36 and 37), each in the slice its Slice column names; rows 34, 36 and 37 are ORV-177, merged.
- Any change to the recorder script, its case briefs or P: ORV-177's. A defect the run shows in the script is reported, not fixed here.
- A second recorder run, or a run for any job but `interpret` (parent "Out of scope").
- Fixing a case whose recorded outcome differs from its hand-written row: a finding, fixed in its own revision (parent "Out of scope", the prompt and schema line).
- Confirming or changing the response byte bound or the model id suffix form from the recordings (parent open questions 9 and 10), and closing `orv160-wallet-gap` with the recorded durations: follow-up ORV-171 and the parent's later slices.
- The docs of slice 8 (parent "Slices", item 8).
- Everything under the parent's "Out of scope".

## Open questions

The parent's open questions and their defaults hold (parent "Open questions"); G2 passed on them. Question 7 (who runs the recorder, decided in ORV-160 comment 10293) is the one this slice carries out. Four questions on how R meets row 35, none a new requirement:

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | How does R replay an entry whose `raw` is null (the call threw before an answer reached the interpreter)? | (a) a fake model that throws, so the replayed outcome is `adapter-failed` (`interpreter.ts` line 126), compared with the recorded one like any entry; (b) R skips it and the PR body lists it | (a) keeps "each" over all 9 cases; (b) leaves a case unreplayed | (a) |
| 2 | How does R's source check find a pasted recording? | (a) it searches its own source for each string `raw` and for that raw's JSON-escaped form (`JSON.stringify(raw)` without the outer quotes); (b) the raw text only | (b) misses a raw pasted as a double-quoted literal, the form mutation (2) names (worked example "The source check") | (a) |
| 3 | How does R read the file, given the engine has no Node types (`packages/intent-engine/package.json` has no `@types/node`; G says so at `llm-guardrails.test.ts` lines 318 and 319)? | (a) add `@types/node` 25.9.9, the version `apps/web`, `auth`, `db` and `design-system` pin, to the engine's devDependencies and read with `readFileSync` as `orv160-recorder-output` said up to parent v1.2; (b) read it as G reads its own source, a `?raw` import, then `JSON.parse` | (a) adds one dependency line and lets Node globals typecheck in engine source, which AGENTS.md describes as "Pure TS, no framework imports", so only review keeps them out; (b) departs from the text of `orv160-recorder-output` up to parent v1.2 and needs a parent changelog line, added as parent v1.3 | Default (a); decided (b) by the main session (R lines 18 to 24), written into `orv160-recorder-output` by parent v1.3 |
| 4 | What if the recorded file holds `sk-or-` or `Bearer` inside a model's raw answer, with no key leaked? | (a) R goes red as row 35 says; the builder stops, the file stays uncommitted, and the main session asks the owner (a rerun is a new spend); (b) edit the file | (b) is ruled out: nobody re-types a recording (`orv160-recorder-output`) | (a) |

## Depends on

The parent spec `docs/specs/ORV-160/spec.md` v1.3 and its "Depends on"; ORV-160 comment 10293 (G1 and G2, and open question 7, written as `orv160-recorder-run`); ORV-177, its spec `docs/specs/ORV-177/spec.md` v1.0 and PR 160 (slice 7a, merged as c068371: the recorder script, P and the network block; its open question 1 default (a) places the run here); ORV-174 and PR 158 (slice 3, the hand-written outcomes in G); L-0016 (a slice issue gets its own spec); ADR 0012 (lane L G4 evidence).

## Changelog

- v1.0 (2026-10-30): slice spec for ORV-178, ORV-160 slice 7b, from ORV-160 spec v1.2 (task ORV-178-spec-1). Row 35 copied with its number, columns and text unchanged, with the parent's file key R; the rules are pointers to the parent; the fixture shape is read from the merged recorder and P on `develop` c068371; the run is this slice's G4 evidence. No new requirement. Downstream to review: the ORV-178 Jira acceptance (row 35 and the run), the main session's confirmation question before the run (`orv160-recorder-run`), the slice's first builder envelope (fact `test -f docs/specs/ORV-178/spec.md`, L-0016, the statement of `orv160-recorder-output` and `orv160-recorder-key`, and open questions 1 to 4), the G4 packet, and the parent's "Slices" item 7, which still lists rows 34 to 37 and the run as one slice (ORV-177 open question 1).
- v1.1 (2026-10-30): review ORV-178-review-1 on PR 161 head 8165200 (task ORV-178-spec-2). Per finding: **I1** contract change in the parent, none here: open question 3 was decided (b) by the main session, the `?raw` import then `JSON.parse` that R uses (lines 18 to 24), and the parent spec v1.3 rewrites `orv160-recorder-output` to match; the question 3 row records the decision, and the worked example "The source check" now uses a stand-in source line in R's `?raw` form (its expected output is unchanged). **S1** no contract change: the span count test depends on test order; a test fix in R, row 35's span clause is unchanged. **S2** no contract change: the recorded `row-5` failed at the call (`raw` null), not at the quote check G row 5 asserts, and the recorder keeps no failure detail; this is a note for the PR body and the G4 packet and an input for ORV-171 and the parent's later slices, not a requirement. No row text changes. Downstream to review: PR 161's body ("Decisions relied on" and the `row-5` note), the G4 packet, and this spec's "Parent spec and gates" and "Depends on", which still name parent v1.2.
