---
issue: ORV-283 (https://tpetkaew.atlassian.net/browse/ORV-283)
parent: ORV-281 (https://tpetkaew.atlassian.net/browse/ORV-281), docs/specs/ORV-281/spec.md v1.1
lane: L (inherited from ORV-281)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.0
---

# ORV-283: ORIVILO reads the business (slice 3 of ORV-281)

## Why

This is a slice. ORV-281 ships in three pull requests (parent spec, section "Delivery: three slices"): slice 1 saves the intake, slice 2 puts the business nodes on the board, and slice 3, this issue, adds the `business-read` model job and shows its readings on the board. It is its own Jira issue so that the PR carries its own key. It adds no requirement: every row and the rule below are copied word for word from `docs/specs/ORV-281/spec.md` v1.1, and the parent stays their source. The rows keep their parent numbers, 27 to 35.

The parent's intent holds unchanged: each business field shows what AI read and the exact words it rests on, or why AI did not read, so that the person can check every reading against what they said (parent spec, "Why" and "Story").

Gates. G1 and G2 for this slice are the parent's: they passed on ORV-281 in comment 10673, under the owner's POC delegation (ADR 0012 decision 4). ADR 0009's addition of 2026-11-18 and the tech notes name comment 10669 for G1.

The owner's word on the model (ORV-281 comment 10678, 2026-11-18):

- The model may be used: this slice calls it, through the job of `business-read-1` below.
- The call stays on OpenRouter, server-side, under ADR 0009 and its addition of 2026-11-18.
- The call stays under the spend cap of 5 US dollars per workspace per month (ADR 0015 decision 4; step 7 of the parent's `business-door-1`).
- A recorder run is still confirmed with the owner first: no recorder run that fills the evaluation set of row 34 starts before the owner confirms its bound and its cost (ADR 0009's addition of 2026-11-18, "The evaluation set"; tech notes section 8.5).

What is real and what is simulated: the parent's section "What is real, rule-based and simulated" holds for this slice as written. In short, for this slice: real once built, the model call and its checks, the saved reading and its replay, the confidence numbers by ORV-128's method; read by a model and labelled, the seven fields the rule below names, each reading a proposal with its quotes and never a value; hypothesis-grade, the confidence bases and factors; rule-based, the placement of the person's own words, which stands alone whenever the model gives no reading. Tests replay recordings and never call a model. Nothing in the product is simulated; Storybook stories run on labelled fixture projects.

Cost per call. The parent spec states no cost figure. The tech notes (`docs/specs/ORV-281/tech.md`, section 8.1) and ADR 0009's addition of 2026-11-18 give it, inferred from ADR 0009's price of 2 / 10 US dollars per million tokens (as read on 2026-10-23, not read again), not measured: a typical intake, about 1,500 input and 800 output tokens, is about 1.1 US cents; the worst case, six answers of 2,000 Thai characters and 3,000 output tokens, is under 5 cents. Each reading counts toward the one spend cap of 5 US dollars per workspace per month and the `ai-read` limit. The recorder run of the evaluation set, 22 calls, is about 0.5 US dollars, inferred (tech notes section 8.5).

This story is not a guard on a tool call, so the guard frame does not apply.

## Story

As a founder or product owner who is signed in, I want each field of my business nodes to show what AI read from my answers and the exact words each reading rests on, or why AI did not read them, so that I can check every reading against what I said (parent spec, "Story").

## Rules

Copied word for word from the parent spec's "Rules" section: `business-read-1`, the one rule the rows below cite by name (rows 27, 28 and 34). The names inside it (`intake-fields-1`, `business-fields-1`, `intake-place-1`, `honest-business-1`, `business-door-1`, "Worked examples", W5, departures 8 and 9) point to the parent spec's sections of those names.

### business-read-1

Slice 3. After the answers are saved, one model call reads the six business answers (fields 2 to 7 of `intake-fields-1`) into readings on the seven fields marked "reading" or "both" in `business-fields-1`: `situation.name`, `business-core.offer`, `business-core.why`, `audience.customers`, `audience.problem`, `competitive-frame.category`, `competitive-frame.alternatives`.

- **Spans.** Each reading quotes at least one span of the answers, and each quote equals the answer text at its place (ADR 0008 decision 2). A reading may quote any of the six answers, so a customer named inside the idea can land on `audience.customers`.
- **What it may not read.** No reading on `situation.industry` (no code list, departure 8), on `situation.website` (not read, departure 9) or on `positioning.value` (no drafting of the gate). No reading on any node outside the five.
- **Checks.** The answer is parsed strictly. An unknown key, a quote that is not in the answers, a reading on a field outside the seven, or a value past its bound refuses the whole answer, and the placement of `intake-place-1` stands alone, labelled (`honest-business-1`), as ORV-128 row 18 does for the URL analyser.
- **Evidence.** Each reading is an ORV-128 evidence item: `fromModel` true, the pinned model id, the adapter id and version, `basedOn` its spans, and a confidence by ORV-128 "Confidence" (base `model-reading`; factor `few-words` when the answers its spans sit in hold fewer than 20 words together by `word-count-1`; factor `single-signal` when it names one span only). Below the floor it stays shown and counts as no support ("Worked examples", W5).
- **Prompt.** The six answers go only in the user message, never in the instructions. The project name, the website, the person's id and email and the workspace are never sent (ADR 0009 point 4). The request keeps zero data retention and denies data collection, as `interpret` does (ADR 0009 point 4 and its Addition of 2026-10-23).
- **No fallback model.** When the call fails, times out, has no key, or is stopped by the limit or the spend cap (`business-door-1`), no other model is tried (ADR 0009 point 3), and the reason is saved with the result.
- **The job.** A new pinned job in ADR 0009's addition of 2026-11-18, named by the architect (`business-read` is a suggestion), with a Thai and English evaluation set recorded as fixtures before it ships (ADR 0009 point 2). Tests replay recordings and never call a model (ADR 0009 point 8).

### Rules this slice uses from the parent, not copied

Their one home is the parent spec; each is named here by its section, and its outcomes are read there.

- `business-door-1`: steps 6 to 9 are this slice's (the `ai-read` limit, the spend cap, the model call and its checks, the save of the reading or of its reason).
- `business-saved-1`: the clauses that begin "from slice 3" (what the saved reading holds) and the replay clause.
- `honest-business-1`: the table rows marked "slice 3" (the labels of a model reading, of a reading below the floor and of a result with no reading).

## Strings

Copied word for word from the parent spec's "Strings" table: the keys rows 31 and 33 cite and the labels of the slice 3 rows of `honest-business-1`. The parent is their home; they live in the design-system catalog (`packages/design-system/src/i18n`).

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `business.state.proposed` | Not confirmed yet | ยังไม่ได้ยืนยัน |
| `business.label.yourWords` | Your words, placed here by fixed rules. Not read by AI. | คำของคุณเอง วางไว้ตรงนี้ด้วยกฎที่กำหนดไว้ ไม่ได้ให้ AI อ่าน |
| `business.label.aiUnavailable` | AI did not read these answers, so only your own words are shown. | AI ไม่ได้อ่านคำตอบเหล่านี้ จึงแสดงเฉพาะคำของคุณเอง |
| `business.label.confidence` | Confidence numbers come from fixed rules, not from a test of accuracy. | ตัวเลขความมั่นใจมาจากกฎที่กำหนดไว้ ไม่ได้มาจากการทดสอบความแม่นยำ |
| `business.reading.confidence` | Confidence {value} | ความมั่นใจ {value} |
| `business.errors.aiNotConfigured` | AI is not set up in this environment, so only your own words are shown. | สภาพแวดล้อมนี้ยังไม่ได้ตั้งค่า AI จึงแสดงเฉพาะคำของคุณเอง |
| `business.errors.aiFailed` | AI could not read your answers, so only your own words are shown. | AI อ่านคำตอบของคุณไม่สำเร็จ จึงแสดงเฉพาะคำของคุณเอง |
| `business.errors.aiRateLimited` | You have reached the limit for AI readings, so only your own words are shown. | ใช้ AI อ่านครบจำนวนที่กำหนดแล้ว จึงแสดงเฉพาะคำของคุณเอง |
| `business.errors.aiSpendCap` | This workspace has used its AI budget for this month, so only your own words are shown. | เวิร์กสเปซนี้ใช้งบ AI ของเดือนนี้ครบแล้ว จึงแสดงเฉพาะคำของคุณเอง |

Reused as they are, with their home in ORV-128 "Strings": `evidence.fromModel`, `evidence.belowFloor` and `quality.fewWords` (parent spec, the paragraph under "Strings").

## Acceptance criteria

Copied from the parent spec's "Acceptance criteria": its opening paragraph holds for these rows as written (tests use fixtures, a fake network and recorded model answers; none reaches the internet or a model, ADR 0009 point 8; screen rows are proven on stories on labelled fixture projects, in both languages). Rows 27 to 35, word for word, with their parent numbers.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 27 | A Thai fixture intake and a recorded answer of the new job | `business-read-1` runs on it | No UI | Readings on the seven fields only, each `fromModel` true with the pinned model id, the adapter id and version; every quote equals its answer text at its place; a customer named in the idea lands on `audience.customers` quoting the idea; no reading on industry, website or value | `business-read.test.ts` "readings quote the answers" |
| 28 | Recorded answers with, in turn: an extra key `confidence`; a quote not in the answers; a reading on `positioning.value`; a reading on `situation.industry` | `business-read-1` runs | No UI | The whole answer is refused each time; the result is method `rule-based` with the reason that gives `business.errors.aiFailed`; the placement stands | `business-read.test.ts` "refused answers" |
| 29 | A reading with one span in an answer of fewer than 20 words; a reading with one span in an answer of 20 words or more | Confidence is computed | No UI | 0.392 with `belowFloor` true; 0.56 with `belowFloor` false (W5) | `business-read.test.ts` "confidence by ORV-128" |
| 30 | A spy on the model request | The read runs | No UI | The system prompt holds no answer text; the user message holds the six answers and nothing else of the intake; no project name, website, user id, email or workspace in the request; zero retention on and data collection denied | `business-read.test.ts` "untrusted input" |
| 31 | In turn: no key; a call that fails; a call that times out; the `ai-read` limit used up; the spend cap reached | They submit a valid intake | The board with `business.label.aiUnavailable` and, in that order, "AI is not set up in this environment, so only your own words are shown.", "AI could not read your answers, so only your own words are shown." twice, `business.errors.aiRateLimited`, `business.errors.aiSpendCap` (Thai in the Thai stories) | The project and answers are saved each time; the reading record is method `rule-based` with its reason; no model call in the last two; no other model tried | `actions.test.ts` "no reading", one case each; story `AiUnavailable` |
| 32 | A saved project with a reading | They open its board twice, a day apart on a fake clock | The same readings both times | No model call on opening; the record holds the model id, adapter id and version and prompt version | `actions.test.ts` "replay, never re-read" |
| 33 | The fixture of row 27 on the board | They open Audience | Under Customers: the person's words with `business.label.yourWords`; then each reading with "Read by AI (anthropic/claude-sonnet-5.5). Check it before you use it." (the saved model id; Thai from `evidence.fromModel`), "Not confirmed yet" ("ยังไม่ได้ยืนยัน"), its quote through `EvidenceSpan`, `business.reading.confidence`; one `business.label.confidence` in the view; a reading below the floor under `evidence.belowFloor` with "the text has fewer than 20 words" ("ข้อความมีไม่ถึง 20 คำ") | None | Story `Readings`, play |
| 34 | The evaluation set: Thai and English intakes covering each of the seven read fields, and intakes whose answers carry instructions to the model | Recorded answers are replayed | No UI | Each recording parses or is refused by `business-read-1`; no recorded answer that follows an instruction from an answer is accepted; the G3 packet reports, per field and language, how many readings a person marked as right, without a pass claim | `business-read-eval.test.ts`; G3 packet |
| 35 | The slice 3 head | The gate runs | No UI | Gate as row 21; the model is imported only by the read's adapter module; ADR 0009's addition of 2026-11-18 and `AI_MODELS` name the new job; `MODEL_JOBS` and the evidence schema version are bumped with their tests | Gate output |

How to read the copied rows:

- "The slice 3 head" in row 35 is the head of this issue's PR.
- Row 35's "Gate as row 21" points to row 21 of the parent spec (`docs/specs/ORV-281/spec.md`, line 295), which belongs to slice 1 and is not copied here. Read on this slice's head, its "new tables" include the table slice 3 adds for the reading (`business_reading`, tech notes section 5.2), and its classification and copy checks cover the columns and keys this slice adds. Every other word of row 21 holds as the parent gives it.
- Row 29's "(W5)" is W5 of the parent spec's "Worked examples".
- Rows 31 and 33 say "the board" and "open Audience". The parent's "Delivery" lets slice 3 land before or after slice 2, and these two rows name the screen they use: the project board screen as it stands on this PR's base.
- Row 34's evaluation set is recorded by the owner-confirmed recorder run (see "Why", the owner's word on the model); the tech notes put that run before this PR is raised for G3 (section 12, "Slice 3, PR C").
- Rows 1 to 26 belong to slices 1 and 2, so the numbers start at 27.

## Rows that render nothing

These copied rows show no screen; the parent's list holds them with rows 1-4, 13, 21 and 26, which are not in this slice.

- Rows: 27-30, 32, 34, 35

## Design and tech notes

Not copied. They live in the parent folder:

- Design: `docs/specs/ORV-281/design.md`, section 5 "The node view (`BusinessNodeView`)" (the readings, their labels and the confidence row) and section 6.4 "Board states".
- Tech notes: `docs/specs/ORV-281/tech.md`, sections 5.2 (`business_reading`), 7 (the evidence contract change, schema 1.1), 8 (the `business-read` job: model, limits and cost, the answer schema, the prompt, the evidence it builds, the evaluation set and the exit test), 12 "Slice 3, PR C (rows 27 to 35)" (tasks C1 to C6), and 13 (tests T28 to T46).
- ADR: `docs/adr/0009-ai-through-openrouter.md`, "Addition, 2026-11-18 (ORV-281): the `business-read` job".

## Out of scope

- Rows 1 to 26 of the parent spec: the intake, its save and the three screens (slice 1), and the business nodes on the present board (slice 2).
- Everything the parent spec's "Out of scope" lists.

## Open questions

None new. Two defaults:

- This spec has no "Rows per PR" section, because this issue's PR has no number yet, so the qa walk covers every row of the table above.
- The parent's open questions that bear on this slice (2, the model job; 7, confidence on short answers; 8, who may use it; 11, the evaluation bar) stand at their defaults as G1 and G2 passed them on the parent; their home is the parent's "Open questions for the owner".

## Depends on

- `docs/specs/ORV-281/spec.md` v1.1: `business-read-1`, `business-door-1`, `business-saved-1`, `honest-business-1`, "Strings", rows 21 and 27 to 35, "Delivery: three slices", "Impact on contracts", "Worked examples" (W4, W5).
- ORV-281 comments 10673 (G1 and G2 under the owner's POC delegation) and 10678 (the owner's word on the model, under "Why").
- `docs/specs/ORV-281/tech.md` and `docs/specs/ORV-281/design.md`, as "Design and tech notes" names them.
- ADR 0009 and its addition of 2026-11-18 (the `business-read` job); ADR 0015 decision 4 (the spend cap).
- Slice 1 of ORV-281 (PR 214) in the base: the intake, its save and the board screen.
- The parent's "Depends on" list, which holds for this slice as written.

## Worked examples

This slice derives no number of its own. Row 29 cites W5, and `business-read-1` cites W5 and, through `business-fields-1`, W4; both live in the parent spec's "Worked examples" section with their `node -e` lines and expected outputs, and are not copied here. The cost figures under "Why" are quoted from the tech notes section 8.1 and ADR 0009's addition, inferred there, not derived here.

## Changelog

- v1.0 (2026-11-18): first version, task ORV-283-spec-1. The slice spec of ORV-281 for its third PR (the `business-read` job and its readings on the board): rows 27-35, the rule `business-read-1` and nine strings, copied word for word from the parent spec v1.1; the owner's word on the model of ORV-281 comment 10678; the cost per call as the tech notes section 8.1 and ADR 0009's addition give it, inferred. No new requirement; no row added, removed or renumbered. Downstream to review: the ORV-283 builder envelopes (tasks C1 to C6 of the tech notes), the `security` envelope for this PR, the owner's confirmation before the recorder run, and the qa envelope for this PR.
