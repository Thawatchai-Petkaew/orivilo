---
issue: ORV-296 (https://tpetkaew.atlassian.net/browse/ORV-296)
parent: ORV-291 (https://tpetkaew.atlassian.net/browse/ORV-291), docs/specs/ORV-291/spec.md v1.4
lane: L (inherited from ORV-291)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode"), a slice spec
version: 1.0
---

# ORV-296: the core idea gate (slice of ORV-291, PR 3)

## Why

This is a slice. ORV-291 builds the brand foundation in three PRs (parent spec, "Delivery: three PRs"). PR 1, the brand personality (rows 1 to 13), is PR 232; PR 2, Brand architecture and the working name (rows 14 to 24), is ORV-295. ORV-291 holds a rejecting code review on PR 232 (task ORV-291-review-1), and after it every builder task on ORV-291 counts as a rework round. PR 3 is new work, not a rework of PR 1, so it gets its own card and this short spec, as ORV-278 did for ORV-274. It adds no requirement: every row below is copied word for word from `docs/specs/ORV-291/spec.md` v1.4 with its number, and the parent stays the source of every rule, string, screen and worked example.

The parent's intent holds unchanged: the core idea is the second gate, and nothing visual should build on it until the person agrees (parent spec, "Why").

Gates. G1 and G2 for this slice are the parent's. G1 Scope passed on ORV-291 in comment 10736 and G2 Design in comment 10741, both under the owner's POC delegation (ADR 0012 decision 4), each with its defaults listed for the owner.

This story is not a guard on a tool call, so the guard frame does not apply.

## Story

As a founder or product owner with a saved business, I want to write the one idea people should remember about my brand and agree to it, or skip it for now, so that the logo, colour and type work that follows starts from an idea I agreed to. If it rests on a step I skipped or have not agreed to yet, the board says so.

## What is real

The parent's section "What is real, rule-based and simulated" holds for this slice as written. The gate states come from a fixed rule (`core-idea-gate-1`), the core idea is the person's own text, and the marks come from rules (`foundation-marks-1`); none of them is AI. No model is called in this PR, and no option is drafted by a model (parent open question 1). Storybook stories run on labelled fixture projects.

## Rules this slice rests on

Not copied; each has its one home in `docs/specs/ORV-291/spec.md`:

- `core-idea-gate-1`, the node rule of this PR, with its table of gate states and lines.
- `identity-frame-1`, for the behaviour of the editors that `core-idea-gate-1` points to.
- `foundation-entry-1` (the `core-idea` rows of its table), `foundation-door-1`, `foundation-saved-1`.
- `foundation-roots-1` and `foundation-marks-1`, with their table of state and mark lines.
- `foundation-honest-1`, over all four nodes, and `foundation-board-1`.
- "Worked examples" W2 and W4.
- The section "Strings", the keys marked PR 3, and the keys it reuses from ORV-285 and ORV-281.
- The section "Departures from ORV-126, ORV-281 and ORV-285", departures 1 to 7 as written.

## Acceptance criteria

Copied from the parent's "Acceptance criteria", rows 25 to 37, every cell word for word. The parent's paragraph above its table holds here as written.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 25 | In turn: a `core-idea` `written` entry with a statement of 1 and of 300 characters and `remember` of 1 and of 2,000; one with no `remember`; a statement of white space only; one of 301 characters; `remember` of 2,001; a `skipped` entry with a `statement`; a kind `picked`; an unknown key `draftId` | `foundation-entry-1` checks it | No UI | The first two parse; each other input fails at the path of its field | `foundation.test.ts` "core-idea entry" |
| 26 | A saved Thai fixture project, positioning agreed, a `given` personality, no core idea entry | They open Core idea ("แนวคิดหลัก"), press "Write my own" ("เขียนเอง"), answer "After someone meets your brand, what one thing should they remember?" ("หลังจากได้รู้จักแบรนด์ของคุณ คุณอยากให้คนจำอะไรได้หนึ่งอย่าง"), write a core idea and press "Agree to this core idea" ("เห็นชอบแนวคิดหลักนี้") | Before: "Nothing given yet" ("ยังไม่มีข้อมูล") with "A gate: nothing builds on this until you agree to it." ("จุดตัดสินใจ: ยังไม่มีขั้นใดต่อยอดจากตรงนี้จนกว่าคุณจะเห็นชอบ"). After: under "Core idea" the statement as typed with "Written by you." ("คุณเขียนเอง"); "Agreed" ("เห็นชอบแล้ว") and "You agreed to this core idea." ("คุณเห็นชอบแนวคิดหลักนี้แล้ว") in place of the gate line; the answer under "The one thing to remember" ("สิ่งเดียวที่อยากให้คนจำ") with `business.label.yourWords`; no control | One entry: node `core-idea`, kind `written`, the trimmed statement and `remember`, made by the session's user inside `withWorkspace`; the log line holds no text | `foundation-actions.test.ts` "write the core idea", with a spy on the logger; story `CoreIdeaWritten`, play |
| 27 | The core idea editor of row 26 open | They press "Agree to this core idea" with the core idea empty; then with 301 characters; then with a valid one while the action answers `rate-limited`; then press "Cancel" and open "Write my own" again; then press agree twice while a save runs | "Write your core idea before you agree to it, or cancel." ("เขียนแนวคิดหลักของคุณก่อนกดเห็นชอบ หรือกดยกเลิก"); "Use 300 characters or fewer." ("ใช้ไม่เกิน 300 ตัวอักษร"); `saved.errors.rate-limited` with the wait; the text kept each of those three times; on "Cancel", focus on "Write my own" and empty fields when it opens again; the button disabled with "Saving your choice" and "Cancel" disabled | No action call for the first two or "Cancel"; one call for the double press; nothing saved on `rate-limited` or "Cancel" | Story `CoreIdeaInvalid`, play with a stub action |
| 28 | The project of row 26 before any core idea entry | They press "Skip for now"; later they write their own and agree | First "Skipped for now" with the gate line and "Write my own" still offered, no "Skip for now"; then the view of row 26 | Two entries, `skipped`, then `written`; the newest wins | `foundation-actions.test.ts` "skip, then write"; story `CoreIdeaSkipped`, play |
| 29 | Three fixture projects with no core idea entry: positioning agreed and no personality entry; positioning with no choice and no personality entry; positioning stale and a `given` personality | They open Core idea; then the action is called directly with a valid `written` entry on each | First "Waits for Brand personality" ("รอ บุคลิกของแบรนด์ ก่อน"); second and third "Waits for Positioning" ("รอ จุดยืน ก่อน"); each with the gate line and no control | Each direct call refused as `invalid-input`; nothing saved | `foundation-actions.test.ts` "core idea waits"; story `CoreIdeaWaits`, play |
| 30 | Three fixture projects with a `written` core idea: positioning skipped and a `given` personality; positioning agreed and a `skipped` personality; all agreed on intake A, then a later intake B saved | They open Core idea | Each still "Agreed" with "You agreed to this core idea."; first "Not yet checked against: Positioning"; second "Not yet checked against: Brand personality" ("ยังไม่ได้ตรวจทานกับ: บุคลิกของแบรนด์"); third "Not yet checked against: Positioning" | `core-idea` results equal W4 cases 2, 4 and 5 | `view.test.ts` "core idea marks"; story `CoreIdeaMarks`, play |
| 31 | Four fixture projects, one per row of `core-idea-gate-1`: waiting, open, skipped, agreed | The board renders and they open Core idea on each | On the card and in the view, in order: "Waits for Positioning" with the gate line; "Nothing given yet" with the gate line; "Skipped for now" with the gate line; "Agreed" with "You agreed to this core idea." | None | Stories `CoreIdeaStates`, `CoreIdeaStatesOpen`, `CoreIdeaStatesSkipped`, `CoreIdeaStatesAgreed`, each with its English story, play |
| 32 | In turn: no session; an email not on the approved list; the `write` limit used up; a project of another workspace; an unknown project id; the project of row 26 after its `written` entry, sent a `written` and then a `skipped` entry | The entry action is called with a valid `core-idea` entry | No UI | `signed-out`; `forbidden` with no address and no limit consumed; `rate-limited` with `retryAfter`; one 404 body for the next two; `invalid-input` for both of the last, the newest entry still the first `written`; nothing saved in any case | `foundation-actions.test.ts` "core idea door" and "agreed stays agreed" |
| 33 | A `written` core idea whose statement is `<img src=x onerror=alert(1)>` and whose `remember` is `<script>alert(1)</script>` | They open Core idea | Both as literal text; no image, no script, no link | None | Story `FoundationUntrustedText`, play |
| 34 | A saved project, PR 3 head, with a 300-character Thai core idea with no spaces | Its board renders at 360 px, light and dark, keyboard only; they Tab to Core idea, open it and switch the language | Nine nodes and thirteen edges (W2), Core idea to the right of Brand personality; focus visible; the view wraps with no horizontal scroll; titles, states and gate lines in the other language, the statement as typed | Zero a11y violations | Stories `Board` and `CoreIdeaNarrow`, play; a11y addon |
| 35 | Fixture projects holding, together, every state the four nodes take in rows 2, 4, 15, 16, 18, 26 and 28 | They open each of the four views | None of the five AI labels listed in `foundation-honest-1`; no number other than "n of 5" points; no text saying verified, tested, screened or registered | No entry row holds a model id | Story `FoundationNoAi`, play reads the text; `view.test.ts` "foundation, no AI label" |
| 36 | A project with all four nodes holding an entry | Its board is loaded twice, a day apart on a fake clock | No UI | The same view and marks both times; nothing written, no limit consumed and no model call on loading | `data.test.ts` "foundation replay, all four" |
| 37 | The PR 3 head | The gate runs | No UI | Gate as row 13; `questions.test.ts` pins `core-idea.proxy.remember` to ORV-126 | Gate output |

Row 37's "Gate as row 13". Row 13 is the parent's gate row for PR 1 and is not a row of this slice. Its Data effect cell reads, word for word: "The new table is in `TENANT_TABLES` with row security and SELECT and INSERT only for the app role; each new column carries one classification tag, text and payload columns `personal`; `questions.test.ts` pins `identity-frame.proxy.person` and `identity-frame.proxy.never` to ORV-126; check-i18n and `apps/web/i18n/messages.test.ts` pass; no middot or em dash in new copy; no new module imports `openrouter` or `llm-interpreter`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `pnpm contrast` unchanged from `develop`". In row 37, "Gate as row 13" means that cell read at the head of this slice's PR.

How to read the other copied rows:

- "PR 3 head" in rows 34 and 37 is the head of this slice's PR, which has no number yet.
- Row 35 names the states of rows 2 and 4 (PR 232, ORV-291) and of rows 15, 16 and 18 (ORV-295). Those rows are not copied here; their Given and User sees cells in the parent spec say which states the fixtures hold.
- Rows 1 to 13 are PR 232 (ORV-291) and rows 14 to 24 are ORV-295, so this table holds rows 25 to 37 only and no row is renumbered.
- The W2 and W4 cited in the rows are the parent's worked examples, with their `node -e` lines and expected outputs; they are not copied here.

## Rows that render nothing

These copied rows show no screen; the parent's list holds them with rows of the other two PRs.

- Rows: 25, 32, 36, 37

## Delivery

One PR, tasks C1 and C2 of the parent's tech notes (`docs/specs/ORV-291/tech.md`, section 12 "Build order", "PR 3, the core idea gate (rows 25 to 37)"), with the tests of section 13 that the two tasks name:

- C1, engine and door: tests T35 to T40.
- C2, screens: tests T41 to T43, with `check-i18n` and `messages.test.ts`.

## Open questions

This slice adds none. The parent's open questions that touch it, by number, with the default in use (parent spec, "Open questions for the owner"):

- 1, drafted options for the personality and the core idea: default (a).
- 3, whether the core idea may be given while positioning is not agreed: default (b).
- 5, where the four nodes sit: default (a).
- 7, the gaps of the business nodes: default (a).
- 9, changing a value: default (a).
- 10, the bound of a core idea: default (a).
- 12, the board's lede: default (a).
- 14, the business board at a 360 px viewport: default (a).

One default of this slice: it has no "Rows per PR" section, because its PR has no number yet, so the qa walk covers every row of the table above.

## Out of scope

- Rows 1 to 13 (PR 232, ORV-291) and rows 14 to 24 (ORV-295) of the parent spec.
- Everything the parent spec's "Out of scope" lists.

## Depends on

- The PR of ORV-295 (ORV-291 PR 2, Brand architecture and the working name) in `develop`, which itself waits on PR 232 (ORV-291 PR 1). The parent spec, its tech notes and its design notes reach `develop` at `docs/specs/ORV-291/` with PR 232.
- `docs/specs/ORV-291/spec.md` v1.4: the rules, strings and worked examples named under "Rules this slice rests on", and its "Depends on" list, which holds for this slice as written.
- `docs/specs/ORV-291/tech.md`, sections 12 and 13, and `docs/specs/ORV-291/design.md`.
- ORV-291 comments 10736 (G1) and 10741 (G2), under the owner's POC delegation.

## Changelog

- v1.0 (2026-11-20): first version, task ORV-295-spec-1. The slice spec of ORV-291 for PR 3: rows 25 to 37 copied word for word from the parent spec v1.4, with their numbers; no new requirement. Downstream to review: the C1 and C2 builder envelopes, the `security` and qa envelopes and the G3 packet of this slice's PR.
