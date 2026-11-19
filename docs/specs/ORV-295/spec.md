---
issue: ORV-295 (https://tpetkaew.atlassian.net/browse/ORV-295)
parent: ORV-291 (https://tpetkaew.atlassian.net/browse/ORV-291), docs/specs/ORV-291/spec.md v1.4
lane: L (inherited from ORV-291)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.1
---

# ORV-295: Brand architecture and the working name (slice of ORV-291, PR 2)

## Why

This is a slice. ORV-291 builds the brand foundation in three PRs (parent spec, "Delivery: three PRs"). PR 1, the brand personality (rows 1 to 13), is PR 232. ORV-291 holds a rejecting code review on PR 232 (task ORV-291-review-1), and after it every builder task on ORV-291 counts as a rework round. PR 2 is new work, not a rework of PR 1, so it gets its own card and this short spec, as ORV-278 did for ORV-274. It adds no requirement: every row below is copied word for word from `docs/specs/ORV-291/spec.md` v1.4 with its number, and the parent stays the source of every rule, string, screen and worked example.

The parent's intent holds unchanged: after the positioning gate, the brand gets a known architecture and a working name before any logo, colour or type is decided (parent spec, "Why").

Gates. G1 and G2 for this slice are the parent's. G1 Scope passed on ORV-291 in comment 10736 and G2 Design in comment 10741, both under the owner's POC delegation (ADR 0012 decision 4), each with its defaults listed for the owner.

This story is not a guard on a tool call, so the guard frame does not apply.

## Story

As a founder or product owner with a saved business, I want to say whether my brand sits above or below other brands and give it a working name, so that the board shows the architecture worked out from my answer and the name I gave, each labelled for what it is. Anything that rests on a step I skipped or have not agreed to yet says so.

## What is real

The parent's section "What is real, rule-based and simulated" holds for this slice as written. The architecture comes from a fixed rule (`architecture-derive-1`), the working name is the person's own text (`working-name-1`), and the marks come from rules (`foundation-marks-1`); none of them is AI. No model is called in this PR. Storybook stories run on labelled fixture projects.

## Rules this slice rests on

Not copied; each has its one home in `docs/specs/ORV-291/spec.md`:

- `architecture-derive-1` and `working-name-1`, the two node rules of this PR.
- `foundation-entry-1` (the `architecture` and `name` rows of its table), `foundation-door-1`, `foundation-saved-1`.
- `foundation-roots-1` and `foundation-marks-1`, with their table of state and mark lines.
- `foundation-honest-1` (the rows for the derived architecture, the working name and the provisional and unchecked marks) and `foundation-board-1`.
- "Worked examples" W2, W4 and W5.
- The section "Strings", the keys marked PR 2, and `strategy.provisional` entering the catalog in PR 2.
- The section "Departures from ORV-126, ORV-281 and ORV-285", departures 1 to 7 as written.

## Acceptance criteria

Copied from the parent's "Acceptance criteria", rows 14 to 24, every cell word for word. The parent's paragraph above its table holds here as written.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 14 | In turn: an `architecture` `answered` entry with `subBrands` false; one with true; a `name` `given` entry of "  ORIVILO  "; one of 60 Thai characters; `subBrands` "no" as text; a name of 61 characters; a name of white space only; a `name` entry with an unknown key `screened`; an `architecture` `skipped` entry; a `name` `skipped` entry | `foundation-entry-1` checks it | No UI | The first four parse, the name as "ORIVILO" and the Thai name whole (W5); each other input fails at the path of its field | `foundation.test.ts` "architecture and name entries" |
| 15 | A saved Thai fixture project, positioning agreed, no architecture entry | They open Brand architecture ("โครงสร้างแบรนด์"), choose "No, it stands on its own" ("ไม่ใช่ แบรนด์นี้อยู่เดี่ยว ๆ") under "Does this brand sit above or below other brands?" ("แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่") and press "Save this answer" ("บันทึกคำตอบนี้") | "Worked out by a fixed rule" ("ได้จากกฎที่กำหนดไว้"); under "Architecture" ("โครงสร้าง") "Single brand, one unit" ("แบรนด์เดียว หน่วยเดียว") with "Worked out from your answer: this brand does not sit above or below other brands." ("ได้จากคำตอบของคุณ: แบรนด์นี้ไม่ได้อยู่เหนือหรือใต้แบรนด์อื่น"); under "Other brands above or below" the answer; no control | One entry: node `architecture`, kind `answered`, `subBrands` false; no derived value stored; the view gives `architecture` `derived` with rule id `architecture-derive-1` | `foundation-actions.test.ts` "answer sub-brands"; `view.test.ts` "architecture derived"; story `ArchitectureDerived`, play |
| 16 | The project of row 15 before the answer; a second one the same | They press "Save this answer" with no choice; on the second, they choose "Yes, it sits above or below other brands" ("ใช่ แบรนด์นี้อยู่เหนือหรือใต้แบรนด์อื่น") and save | First "Choose one answer first." ("เลือกหนึ่งคำตอบก่อน"). On the second: "Not in this version" ("ยังไม่มีในเวอร์ชันนี้") with "A brand that sits above or below other brands needs a brand architecture study, which this version does not do yet." and no value under "Architecture"; the Name card shows "Waits for Brand architecture" ("รอ โครงสร้างแบรนด์ ก่อน") | No action call for the first; one entry with `subBrands` true for the second; `architecture` `open`, `name` `blocked` by `architecture` (W4, case 4) | Story `ArchitectureNotInVersion`, play; `view.test.ts` "architecture yes" |
| 17 | Three fixture projects: positioning with no choice and the answer "no"; positioning skipped and the answer "no"; positioning with no choice and no answer | They open Brand architecture | First: "Waits for Positioning" ("รอ จุดยืน ก่อน") with the saved answer and no "Single brand, one unit". Second: "Single brand, one unit", "Provisional. This rests on a step you skipped." ("ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้") and "Rests on: Positioning" ("อิงกับ: จุดยืน"). Third: "Waits for Positioning" with the question and "Save this answer" still offered | `architecture` results equal W4: `blocked` by `positioning`; `derived`, `provisionalOn` `positioning`; `blocked` by `positioning` | `view.test.ts` "architecture marks"; story `ArchitectureMarks`, play |
| 18 | A saved Thai fixture project, positioning agreed, the architecture answer "no", no name | They open Name ("ชื่อแบรนด์"), press "Give a working name" ("ตั้งชื่อใช้งาน"), type "  ORIVILO  " and press "Use this working name" ("ใช้ชื่อนี้") | Under "Working name" ("ชื่อใช้งาน"): "ORIVILO" with "Working name, not screened for trademarks." ("ชื่อใช้งานชั่วคราว ยังไม่ได้ตรวจสอบเครื่องหมายการค้า"); "Given by you"; no mark; no control | One entry: node `name`, kind `given`, name "ORIVILO"; the log line holds no name | `foundation-actions.test.ts` "give a working name", with a spy on the logger; story `NameGiven`, play |
| 19 | The name editor of row 18 open | They save it empty; then with 61 characters; then press "Cancel"; then type a name and press save twice while a save runs | "Write a working name, or cancel." ("เขียนชื่อใช้งาน หรือกดยกเลิก"); "Use 60 characters or fewer." ("ใช้ไม่เกิน 60 ตัวอักษร") with the text kept; on "Cancel", the editor closed and focus on "Give a working name"; the button disabled with "Saving your choice" | No action call for the first two or "Cancel"; one call for the double press | Story `NameInvalid`, play with a stub action |
| 20 | A fixture project with positioning with no choice and no architecture answer | They open Name, give "ORIVILO" and save | Before: "Waits for Positioning" with "Give a working name" offered. After: "ORIVILO", "Working name, not screened for trademarks.", "Given by you" and "Not yet checked against: Positioning" ("ยังไม่ได้ตรวจทานกับ: จุดยืน") | One `name` entry; `name` `given` with `unchecked` `positioning` (W4, case 5) | `foundation-actions.test.ts` "a name ahead of positioning"; story `NameAhead`, play |
| 21 | In turn, for an `architecture` and a `name` entry: no session; an email not on the approved list; the `write` limit used up; a project of another workspace; an unknown project id; a project whose node already holds an entry | The entry action is called with a valid entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`; one 404 body for the next two; `invalid-input` for the last; nothing saved in any case | `foundation-actions.test.ts` "architecture and name door" |
| 22 | A `name` entry `<img src=x onerror=alert(1)>` | They open Name | It as literal text; no image, no script, no link | None | Story `FoundationUntrustedText`, play |
| 23 | A saved project, PR 2 head, with the answer "no" and a name of 60 Thai characters with no spaces | Its board renders at 360 px, light and dark; they open Brand architecture and Name; they switch the language | Eight nodes and eleven edges (W2), Brand architecture and Name to the right of Positioning; each view's lines wrap with no horizontal scroll; titles, states and labels in the other language, the name as typed | Zero a11y violations | Stories `Board` and `FoundationNarrow`, play; a11y addon |
| 24 | The PR 2 head | The gate runs | No UI | Gate as row 13; `questions.test.ts` pins `situation.sub-brands` to ORV-126; `business-strings.test.ts` pins `strategy.provisional` to ORV-126 | Gate output |

Row 24's "Gate as row 13". Row 13 is the parent's gate row for PR 1 and is not a row of this slice. Its Data effect cell reads, word for word: "The new table is in `TENANT_TABLES` with row security and SELECT and INSERT only for the app role; each new column carries one classification tag, text and payload columns `personal`; `questions.test.ts` pins `identity-frame.proxy.person` and `identity-frame.proxy.never` to ORV-126; check-i18n and `apps/web/i18n/messages.test.ts` pass; no middot or em dash in new copy; no new module imports `openrouter` or `llm-interpreter`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `pnpm contrast` unchanged from `develop`". In row 24, "Gate as row 13" means that cell read at the head of this slice's PR.

How to read the other copied rows:

- "PR 2 head" in rows 23 and 24 is the head of this slice's PR, PR 234.
- Rows 1 to 13 are PR 232 (ORV-291) and rows 25 to 37 are ORV-296, so this table holds rows 14 to 24 only and no row is renumbered.
- The W2, W4 and W5 cited in the rows are the parent's worked examples, with their `node -e` lines and expected outputs; they are not copied here.

## Rows per PR

- PR 234: rows 14-24

## Rows that render nothing

These copied rows show no screen; the parent's list holds them with rows of the other two PRs.

- Rows: 14, 21, 24

## Delivery

One PR, tasks B1 and B2 of the parent's tech notes (`docs/specs/ORV-291/tech.md`, section 12 "Build order", "PR 2, the architecture and the working name (rows 14 to 24)"), with the tests of section 13 that the two tasks name:

- B1, engine and door: tests T27 to T31.
- B2, screens: tests T32 to T34, with `check-i18n` and `messages.test.ts`.

Per the same section, this PR has no migration and no change to the entry action or the service.

## Open questions

This slice adds none. The parent's open questions that touch it, by number, with the default in use (parent spec, "Open questions for the owner"):

- 4, where the working name is asked: default (a).
- 5, where the four nodes sit: default (a).
- 6, `situation` without a classifier: default (a).
- 7, the gaps of the business nodes: default (a).
- 8, where `situation.sub-brands` is asked: default (a).
- 9, changing a value: default (a).
- 11, a brand above or below other brands: default (a).
- 12, the board's lede: default (a).
- 14, the business board at a 360 px viewport: default (a).

The section "Rows per PR" names this slice's one PR, so the qa walk covers every row of the table above.

## Out of scope

- Rows 1 to 13 (PR 232, ORV-291) and rows 25 to 37 (ORV-296) of the parent spec.
- Everything the parent spec's "Out of scope" lists.

## Depends on

- PR 232 (ORV-291 PR 1, the brand personality) in `develop`. The parent spec, its tech notes and its design notes reach `develop` at `docs/specs/ORV-291/` with PR 232.
- `docs/specs/ORV-291/spec.md` v1.4: the rules, strings and worked examples named under "Rules this slice rests on", and its "Depends on" list, which holds for this slice as written.
- `docs/specs/ORV-291/tech.md`, sections 12 and 13, and `docs/specs/ORV-291/design.md`.
- ORV-291 comments 10736 (G1) and 10741 (G2), under the owner's POC delegation.

## Changelog

- v1.1 (2026-11-20): the PR has its number. "Rows per PR" added (PR 234, rows 14 to 24) and the two sentences that said the PR had no number yet now name it. No row changed.
- v1.0 (2026-11-20): first version, task ORV-295-spec-1. The slice spec of ORV-291 for PR 2: rows 14 to 24 copied word for word from the parent spec v1.4, with their numbers; no new requirement. Downstream to review: the B1 and B2 builder envelopes, the `security` and qa envelopes and the G3 packet of this slice's PR.
