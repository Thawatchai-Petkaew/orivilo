---
issue: ORV-136 (https://tpetkaew.atlassian.net/browse/ORV-136)
lane: L (it changes the result-recorder, the qa.v1 contract, merge-check and g3-check, which are guard files; their merge needs the owner approval record)
version: 1
---

## Why

The qa walk of PR 134 (ORV-134 PR 1, the quantiser, head 1da1529) could not be recorded. The orchestrator's fact says it passed every PR 1 row, and Jira finding QA-1 lists the blocks; that comment was not read here, because this session has no Jira tool. The code shows why such a walk cannot be recorded:

- The recorder asks for an `ac` entry for every row of the spec. ORV-134's spec holds rows 4, 8 to 12, 34, 35, 38 and 29 to 31, and most of them belong to PR 2.
- An entry can only be `pass`, `fail` or `owner_verify`. A row that this PR does not carry has no honest status. `pass` would be false, `fail` blocks the approve, and `owner_verify` misstates what the owner is asked to judge.
- Row 8's "User sees" cell names data (`colour-area` items), so the keyword list makes it visual. That means it needs a screenshot or a computed style, but PR 134 renders nothing, so nothing honest can be shown.

The envelope `ORV-134-qa-1` was closed as `no_report` at 2026-10-28T10:30:58Z (`.orivilo/runs/ORV-134/ORV-134-qa-1/closed.json`). The walk's evidence is lost.

This has happened before. ORV-100's PR 94 walk marked slice B rows 14 and 15 as `owner_verify`, with a screenshot of an unrelated story (`.orivilo/runs/ORV-100/ORV-100-qa-1/qa.json:241` to `:270`). ORV-20's walk attached a screenshot of the vitest runner because "the recorder regex matched the domain words color/gap" (`.orivilo/runs/ORV-20/ORV-20-qa-1/qa.json:35` to `:37`, lesson L-0028). Each time, an honest qa had to choose between a record that proves nothing and no record at all.

The class is wider than PR 134. The section "The class" below lists every route found. The fix is one bound with three parts:

- The spec declares which rows each PR walks and which rows render nothing (`qa-scope-1`, `renders-nothing-1`).
- The recorder and merge-check hold each walk to its declaration.
- The issue cannot reach G3 PR review until its last code PR has walked every row on the code that ships (`last-walk-1`).

**Frame (L-0012).** This is a guard rail for agents that follow the rules. It is not a boundary against a session that sets out to defeat it. Nothing outside the session enforces it: the hooks, the records and the spec all live in the session's repo, and the spec is a doc any PR can change. The forms a rule-following agent uses, which the guard must catch, are:

- the qa's final message: exactly one `qa.v1` JSON object (`.claude/agents/qa.md:35`), judged at SubagentStop and PostToolUse(Agent);
- the qa dispatch: an Agent call whose prompt is one envelope (`.claude/skills/ovl/SKILL.md:73`), judged by `envelope-guard`;
- the merge: `gh pr merge <n> --squash --delete-branch --match-head-commit <40-hex sha>` (`.claude/skills/ovl/SKILL.md:266`), whose records stage is `node scripts/ovl/merge-check.mjs <n> --head <sha>` (`.claude/skills/ovl/SKILL.md:289`);
- the G3 move: the Atlassian MCP `transitionJiraIssue`, or `executeWrite` or `executeDestructive` naming it (`.claude/settings.json:94`, `.claude/skills/ovl/SKILL.md:333`), whose records stage is `node scripts/ovl/g3-check.mjs <ISSUE>` (`.claude/skills/ovl/SKILL.md:341`).

The release merge `gh pr merge <n> --merge` (`.claude/skills/ovl/SKILL.md:308`) checks no issue's rows. See Honest limits.

**What is real.** Everything here is process tooling that runs. Nothing is simulated and no model is involved. There is no UI. Hook messages are English developer text on stderr, outside the locale catalog, as in ORV-81.

## Story

As the owner, I want an honest qa walk of a PR that carries only part of an issue to be recorded, with no filler evidence. I also want the issue to stay out of G3 PR review until every row has been walked on the code that ships, so that splitting an issue into PRs neither blocks the walk nor lets a row go unwalked.

## The class: every way an honest walk is refused or misread

I surveyed `scripts/ovl/result-recorder.mjs` (`specRows`, `VISUAL`, `qaProblems`, `approveProblems`), `scripts/ovl/schemas/qa.v1.json`, `scripts/ovl/merge-check.mjs` (`qaProblems`), `scripts/ovl/envelope-guard.mjs` and, because merge-check is called from it, `scripts/ovl/g3-check.mjs`. Line numbers are at commit 2c21436.

<!-- prettier-ignore -->
| Id | Where | What it does | What an honest walk meets | Closed by |
| --- | --- | --- | --- | --- |
| C1 | `result-recorder.mjs:252` to `:256` | Every row of the spec needs an `ac` entry, whatever the PR | PR 134 must report rows 9 to 12, 29, 34, 35 and 38, which PR 2 carries | `qa-scope-1` |
| C2 | `qa.v1.json:42` | Status is `pass`, `fail` or `owner_verify` | A row outside the PR has no true status | `qa-scope-1` (no entry for it) |
| C3 | `result-recorder.mjs:261` to `:263` | An approve refuses any `fail` row | A truthful "not built yet" as `fail` blocks the approve | `qa-scope-1` |
| C4 | `result-recorder.mjs:264` to `:266` | `owner_verify` needs a screenshot | The ORV-100 route: an unrelated screenshot under `owner_verify` (`ORV-100-qa-1/qa.json:241`) | `qa-scope-1` |
| C5 | `qa.v1.json:46` | Every entry needs evidence | A row outside the PR has no evidence of its own | `qa-scope-1` |
| C6 | `result-recorder.mjs:33`, `:258` to `:260` | A row is visual when its cell matches the keyword list, as a substring, with no word bounds | Rows 8, 12, 34 and 35 of ORV-134 name data (`colour-area`, `colour-declared`, colour measures) and become visual; "promotion" matches `motion` and "composition" matches `position` | `renders-nothing-1` |
| C7 | `qa.v1.json:50` to `:61` | A visual row needs a `screenshot` or `computed_style` item | No honest item exists when nothing renders | `renders-nothing-1` |
| C8 | `result-recorder.mjs:35`, `:75`, `:235` to `:237` | `computed_style` must name a Storybook story id | An engine-only PR has no story | `renders-nothing-1` |
| C9 | `result-recorder.mjs:49` to `:62`, `:234` | A screenshot only has to be a PNG in the task folder | The ORV-20 route: a test-runner screenshot that proves nothing (`ORV-20-qa-1/qa.json:35`, L-0028) | `renders-nothing-1` |
| C10 | `result-recorder.mjs:115` | The keyword text is `cells[3]`, by position | With a `Slice` column second (`docs/specs/ORV-101/spec.md:26`), the check reads the When cell (ORV-105-qa-1 finding QA-4) | `qa-scope-1` (column found by its header) |
| C11 | `result-recorder.mjs:107`, `:110` | The first table anywhere whose header starts with `#`, read to its end | A `#` table above the AC is read in its place. A spec with its rows in several tables (`ORV-34/spec.md:39`, `:66`, `:105`; `ORV-35/spec.md:40`, `:55`; `ORV-44/spec.md:37`, `:61`; `ORV-62/spec.md:28`, `:40`) is read from its first table only | `qa-scope-1` |
| C12 | `result-recorder.mjs:115` | A first cell that is not a whole number is skipped | A row numbered `20a` is never asked for | `qa-scope-1` (refused, named) |
| C13 | `result-recorder.mjs:106`, `:117` to `:118`; `hook.mjs:93` to `:99`; `result-recorder.mjs:369` to `:371`, `:403`, `:405`; `envelope-guard.mjs:174` to `:181` | No spec file or no AC table throws. The hook fails closed. After the qa's second stop, PostToolUse throws at `:403` before the close at `:405` | The walk is lost after it ran. The envelope stays open, and the next qa dispatch is refused until it is closed by hand | `qa-scope-1` (refused at dispatch); a throw at record time closes the envelope |
| C14 | `result-recorder.mjs:252` to `:271` | The row checks run for both verdicts | An honest `request_changes` on a part walk is refused too | `qa-scope-1` |
| C15 | `result-recorder.mjs:364` to `:368`, `:404` to `:406` | A refused report goes back once, then closes as `no_report` | Nothing of the walk is recorded (`ORV-134-qa-1/closed.json`) | Follows from C1 to C14 |
| C16 | `envelope.v1.json:5`; `envelope-guard.mjs:246` | The envelope has no field for the rows in scope | Scope is prose that no hook reads (`ORV-134-qa-1/envelope.json:29`, "list them as not in scope") | `qa-scope-1` (declared in the spec) |
| C17 | `merge-check.mjs:129` to `:165` | Reads the latest `qa.json`'s verdict, PR, head and screenshots; never the spec or `ac` | Once C1 is relaxed, a partial walk could merge as the last PR | `last-walk-1` point 1 |
| C18 | `merge-check.mjs:236` to `:241` | A docs-only PR merges without a qa | A row added to the spec after the last code walk is never walked | `last-walk-1` point 2 (reads the spec on develop) |
| C19 | `g3-check.mjs:248` to `:266` | Blocks while a PR is open, then judges only the latest merged PR | After PR 1 merges and before PR 2 is opened, nothing is open, and the move would rest on PR 1's walk alone | `last-walk-1` point 2 |
| C20 | `merge-check.mjs:133` | The latest `qa.json` of the issue, for any PR (ORV-95 spec line 75) | Two PRs of one issue walked out of order block the earlier one | Out of scope (one PR at a time) |

Checked and not members:

- `approveProblems` (`result-recorder.mjs:186` to `:230`) has no row logic. Its diff (`:209`) is the one `renders-nothing-1` reuses.
- `result-recorder.mjs:248` to `:250` refuses an `ac` row that is not a spec row. That rule stays.
- Row numbers that are not consecutive or not sorted are not refused today: `specRows` keeps any whole numbers in table order, as ORV-134's order 4, 8 to 12, 34, 35, 38, 29 to 31 shows. The range form in `qa-scope-1` must keep that (Worked example 2).

## The bound

One declaration per spec, read by every party that judges a walk:

<!-- prettier-ignore -->
| Who | When | Reads | Does |
| --- | --- | --- | --- |
| `product` | At discover, or when an issue is split into PRs | The issue's rows | Writes the `## QA scope` section under `qa-scope-1`; a change to it bumps the spec version |
| `reviewer` | At each review where the section is in the diff, and at G2 | The section and the PR's tests | Checks each Rows cell against the tests the PR carries and each Why against the code the row's tests run; a row that renders gets a finding |
| `envelope-guard` | At the qa dispatch | `docs/specs/<issue>/spec.md` in the checkout | Refuses a qa envelope whose spec fails `qa-scope-1` |
| `qa` | The walk | Its PR's line | Walks the rows of its part, names the label in `part`, and gives no entry to another row |
| `result-recorder` | When the qa stops | The spec at the qa's checkout (the head), and the PR diff | Holds the walk to its part (`qa-scope-1`) and decides `visual` (`renders-nothing-1`) |
| `merge-check` | At each merge into develop | The spec at the PR head, and the PR's latest `qa.json` | `last-walk-1` point 1 |
| `g3-check`, through merge-check | At the move to G3 PR review | The spec on develop, the issue's merged PRs and their `qa.json` | `last-walk-1` point 2 |

## Acceptance criteria

There is no UI in this story. Messages are English developer text on stderr. The test files are those under `scripts/ovl/` that `pnpm test:scripts` runs.

The fixture "the ORV-134 spec" is the 12 rows 4, 8 to 12, 34, 35, 38 and 29 to 31, copied from `docs/specs/ORV-128/spec.md` lines 327, 331 to 335, 357, 358, 361 and 352 to 354, plus a QA scope section with two tables:

- **Rows per PR.** It has two lines. The first is label `PR 1`, Rows `4, 8, 30, 31`, and What the walk covers "the `wu.test.ts` cases of tech notes §14 rows 4 and 8; row 30's scan with `measures/wu`; the full gate". The second is label `PR 2`, Rows `every row`, and What the walk covers "every row as written, on the head of PR 2".
- **Renders nothing.** It has one line: `every row`, with the Why "engine functions and the command only; no row renders a screen (ORV-128 acceptance preamble)".

"PR 134's files" are `packages/intent-engine/src/measures/wu.ts`, `packages/intent-engine/src/measures/wu.test.ts`, `packages/intent-engine/src/measures/LICENSE-material-color-utilities.txt` and `packages/intent-engine/src/evidence.test.ts`, the `write_set` of `ORV-134-build-wu-1`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | Fixture copies of `docs/specs/ORV-128/spec.md` (header cells #, Given, When, User sees, Data effect, Test, Slice), `docs/specs/ORV-101/spec.md` (#, Slice, Given, When, User sees, Data effect) and `docs/specs/ORV-81/spec.md` (#, Given, When, Result, Evidence). Then a spec with a table headed # and Step above `## Acceptance criteria`; under the heading, two `#` tables (rows 1 to 3 and 4 to 6) and a fenced code block holding a `#` table with row 7. Then a row whose Given cell holds an escaped pipe | Reading the AC rows (`qa-scope-1` point 1) | ORV-128: rows 1 to 38, each with its User sees text. ORV-101: each row's text is its User sees cell, not its When cell. ORV-81: the Result cell. The second spec: rows 1 to 6, with nothing from the Step table or the code block. The escaped pipe stays inside its cell, and the row's User sees text is its own | None | `spec-rows.test.mjs` › "rows come from the acceptance criteria tables, by header" |
| 2 | Specs, each in turn: no `## Acceptance criteria` heading; the heading with no `#` table under it; a row whose first cell is `20a`; row 7 twice; a header with no `User sees`, `Result` or `Then` cell; no spec file | Reading the AC rows | Each throws with, in turn: "no acceptance criteria table under ## Acceptance criteria" (twice); "row 20a is not a whole number"; "row 7 appears twice"; "the acceptance criteria table has no User sees, Result or Then column"; "docs/specs/ORV-1/spec.md does not exist" | None | `spec-rows.test.mjs` › "a spec that cannot be walked says why" |
| 3 | The ORV-134 spec; then the same spec without its `## QA scope` section | Reading the QA scope (`qa-scope-1` point 2) | Labels `PR 1` and `PR 2`; PR 1 rows 4, 8, 30, 31; PR 2 rows 4, 8, 9, 10, 11, 12, 34, 35, 38, 29, 30, 31; renders nothing: the same 12 rows. Without the section: one part of every row, and no row that renders nothing | None | `spec-rows.test.mjs` › "rows per PR and rows that render nothing" |
| 4 | The ORV-134 spec with, in turn: the last Rows cell `9, 10`; `every row` on the PR 1 line; labels `PR 1` then `PR 3`; one PR line only; PR 1 Rows `4, 5`; PR 1 Rows `4 to 12`; PR 1 Rows `4, 4`; an empty What the walk covers cell; a renders-nothing line with an empty Why; a renders-nothing line naming row 99 | Reading the QA scope | Each throws with, in turn: "QA scope: the last PR line must say every row"; "QA scope: only the last PR line says every row"; "QA scope: PR 3 follows PR 1; labels count up from PR 1 by one"; "QA scope: one PR needs no rows per PR table"; "QA scope: PR 1 names row 5, which is not a row of the acceptance criteria"; "QA scope: PR 1 range 4 to 12 names rows 5, 6, 7, which are not rows of the acceptance criteria"; "QA scope: PR 1 names row 4 twice"; "QA scope: PR 1 says nothing about what its walk covers"; "QA scope: a renders nothing line gives no reason"; "QA scope: renders nothing names row 99, which is not a row of the acceptance criteria" | None | `spec-rows.test.mjs` › "a QA scope that cannot be read says why" |
| 5 | The ORV-134 spec at the head; PR 134's files as the diff; a full gate on the head. A `qa.v1` approve with `part: "PR 1"` and `ac` rows 4, 8, 30 and 31, each `pass`, `visual: false`, with `command` evidence, and `screenshots: []`. Then the same walk as `request_changes`, with row 30 `fail` and a kept Important finding | SubagentStop, then PostToolUse(Agent) | Exit 0 at both, for each report | `qa.json` and `result.json` written; `report.part` is `PR 1`; `report.ac` holds rows 4, 8, 30 and 31 only | `result-recorder.test.mjs` › "a walk of one PR records that PR's rows" |
| 6 | Row 5's spec, head and diff. Reports, each in turn: no `part`; `part: "PR 3"`; part PR 1 with no entry for row 30; part PR 1 with an extra entry for row 9; part PR 2 with rows 4, 8, 30 and 31 only | SubagentStop | Exit 2 for each. stderr holds, in turn: "the spec has rows per PR (qa-scope-1): part is required"; "part PR 3 is not a PR of the spec's QA scope"; "ac has no entry for row 30 of PR 1"; "ac row 9 is not a row of PR 1"; "ac has no entry for row 9 of PR 2", and the same line for rows 10, 11, 12, 34, 35, 38 and 29 | Nothing recorded at this stop | `result-recorder.test.mjs` › "a walk names its PR and walks exactly its rows" |
| 7 | A spec with rows 1 to 3 and no `## QA scope` section. A report with `part: "PR 1"` and rows 1 to 3; then a report with no `part` and rows 1 and 3 | SubagentStop | Exit 2 for each. stderr: "part is set but the spec has no rows per PR (qa-scope-1)"; then "ac has no entry for spec row 2" | Nothing recorded at this stop | `result-recorder.test.mjs` › "one PR walks every row" |
| 8 | Row 5's walk, with row 8 `visual: false` and only `command` evidence: (a) on row 5's diff; (b) on row 5's diff plus `apps/web/app/page.tsx`; (c) on a copy of the spec with no renders-nothing table, on row 5's diff | SubagentStop | (a) exit 0. (b) exit 2: "ac row 8 is visual by the keyword list; the PR changes apps/web/app/page.tsx, a rendering file, so renders-nothing-1 does not apply". (c) exit 2: "ac row 8 is visual by the spec's keyword list; visual cannot be false" | (a) `qa.json` with row 8 `visual: false`; (b) and (c) nothing | `result-recorder.test.mjs` › "a row that renders nothing needs no screenshot only when the PR renders nothing" |
| 9 | A bound qa envelope whose spec at the qa's checkout has no `## Acceptance criteria` heading when the qa returns | SubagentStop twice, then PostToolUse(Agent) | Exit 2, with stderr "docs/specs/ORV-1/spec.md cannot be walked (qa-scope-1): no acceptance criteria table under ## Acceptance criteria" and "ORV-1-qa-1 closed as no_report" | `closed.json` with `reason: no_report`; the next qa envelope is not refused as open | `result-recorder.test.mjs` › "a spec that breaks after dispatch closes the envelope" |
| 10 | An Agent call with a valid qa envelope for ORV-1 whose spec has no `## Acceptance criteria` heading; the same call after the spec is fixed; a builder envelope for the broken spec | `envelope-guard` | The first: exit 2, "the spec docs/specs/ORV-1/spec.md cannot be walked (qa-scope-1): no acceptance criteria table under ## Acceptance criteria". The second and third: no reason from this check | The first writes no `envelope.json` | `envelope-guard.test.mjs` › "a qa envelope needs a spec it can walk" |
| 11 | `qa.v1` fixtures with `part` `"PR 1"` and `"PR 12"`; then `"pr 1"`, `"PR 0"`, `"PR 01"` and the number `1` | `node scripts/ovl/validate.mjs qa.v1 <file>` | The first two are valid. Each of the others is invalid, with the error at `/part` | None | `validate.test.mjs` › the qa.v1 fixtures `valid-part-*` and `invalid-part-*` |
| 12 | The ORV-95 merge-check fixture (PR 7, head `H`, issue ORV-1, checks passing, a clean gate record, a reviewer approve on `H`) with the ORV-134 spec at `H`, and the latest `qa.json` for PR 7 on `H` an approve with part PR 1, rows 4 and 8 `pass` and rows 30 and 31 `owner_verify` | `node scripts/ovl/merge-check.mjs 7 --head H` | Exit 0 | None | `merge-check.test.mjs` › "a walk of one PR merges on its own rows" |
| 13 | Row 12, with, in turn, a `qa.json` for PR 7 on `H` that has: part PR 1 and no row 30 (written by an older recorder); part PR 2 and rows 4, 8, 30 and 31 only; no `part`; and part PR 1 on a copy of the spec with no QA scope section | `node scripts/ovl/merge-check.mjs 7 --head H` | Exit 2 for each. stderr, in turn: "the qa walk of PR 7 on H has no pass for row 30 of PR 1 (qa-scope-1)"; "the qa walk of PR 7 on H has no pass for rows 9, 10, 11, 12, 34, 35, 38, 29 of PR 2 (qa-scope-1)"; "the qa walk of PR 7 names no part, and the spec has rows per PR"; "the qa walk of PR 7 names part PR 1, and the spec has no rows per PR" | None | `merge-check.test.mjs` › "a merge needs the rows of its part walked" |
| 14 | Issue ORV-1 with the ORV-134 spec on develop and no open PR. Merged code PRs 7 (its `qa.json` part PR 1) and 9 (its `qa.json` an approve with part PR 2 and all 12 rows `pass`), each passing merge-check | The g3-check records stage, `node scripts/ovl/g3-check.mjs ORV-1` | Exit 0 | None | `g3-check.test.mjs` › "the last code PR walked every row" |
| 15 | Row 14 with, in turn: only PR 7 merged; PR 9's walk naming part PR 1; a docs-only PR 10 merged after PR 9, the spec unchanged; a docs-only PR 10 that adds row 39 to the spec on develop; a spec with no QA scope section whose only merged code PR, 7, has a full walk with no `part` | The g3-check records stage | In turn: exit 2, "last-walk-1: the last code PR of ORV-1, PR 7, was walked as PR 1; the issue's last walk covers every row"; exit 2, the same line for PR 9; exit 0; exit 2, "last-walk-1: the walk of PR 9 has no pass for row 39 of the spec on develop"; exit 0 | None | `g3-check.test.mjs` › "the move to G3 needs every row walked on the last code PR" |
| 16 | The repo after this story | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, `pnpm test:scripts`, and CI | All pass; `pnpm contrast` output unchanged from `develop` | None | The gate output in the G3 packet |

## Rules and bounds

**Rule `qa-scope-1`** (the rows a walk covers). One parser holds it (suggested `scripts/ovl/spec-rows.mjs`). `envelope-guard`, `result-recorder` and `merge-check` all use that parser. A parse failure is always a refusal that names the problem, never a pass.

1. **The AC rows.** These are the body lines of every table under the heading `## Acceptance criteria`, up to the next level-two heading, whose header's first cell is `#`.
   - Lines inside a fenced code block are never read, here or in point 2, and a heading inside one is not a heading.
   - A cell ends at a pipe that has no backslash before it; an escaped pipe stays inside its cell.
   - Each line's first cell is a whole number, unique across those tables.
   - The order is table order. The numbers need not be consecutive or sorted.
   - The text the keyword list reads is the cell under the first header among `User sees`, `Result` and `Then`.
   - A spec with no such table, a missing spec file, a line whose first cell is not a whole number, a repeated number, or a header with none of the three names cannot be walked.
2. **The QA scope.** This is an optional `## QA scope` section. It holds at most one rows-per-PR table (`| PR | Rows | What the walk covers |`) and at most one renders-nothing table (`| Renders nothing | Why |`).
   - **Labels.** A rows-per-PR table has two lines or more. Its labels are `PR 1`, `PR 2` and so on, in order, each one more than the line before.
   - **Rows cells.** The last line's Rows cell is exactly `every row`, and no other line's cell is. Every other Rows cell is a list of items separated by commas. Each item is a row number, or a range `a to b` with `a` below `b`. Every number an item names, including each whole number from `a` to `b`, is a row from point 1, and none is named twice in one cell.
   - **What the walk covers.** This cell is never empty.
   - **Renders-nothing table.** It has one line or more. Each line's first cell is `every row` or a list in the same form, and its Why is never empty.
3. **The part of a walk.**
   - When the spec has a rows-per-PR table, a `qa.v1` report names a label in `part`, and its part is that line's rows (every row for the last label).
   - When the spec has no table, the report has no `part`, and its part is every row.
   - A walk with no PR of its own, such as the G4 staging walk, is a full walk and names the last label.
4. **Entries.** A walk has one `ac` entry for each row of its part, and none for any other row. This holds for both verdicts.
5. **Status in a part walk.** In a walk of any label but the last, a row's status judges what that line's "What the walk covers" says. The row as written is judged by the last walk (`last-walk-1`).
6. **Format.** `part` matches `^PR [1-9][0-9]*$` in `qa.v1`. The field is optional in the schema; point 3 makes it required or forbidden by the spec.
7. **A spec that breaks after dispatch.** When the recorder cannot read the spec at record time, PostToolUse(Agent) closes the bound envelope as `no_report`, with the reason (row 9).

**Rule `renders-nothing-1`** (a keyword row that is not visual). The keyword list stays as ORV-81 defines it (`docs/specs/ORV-81/spec.md:480`, `result-recorder.mjs:33`). A row it makes visual is not visual only when both of these hold:

1. The spec's renders-nothing table names the row, or says `every row`.
2. `git diff --name-only origin/develop...<head_sha>`, the diff `approveProblems` already reads, names no rendering file. A rendering file is a path ending in `.tsx`, `.jsx`, `.css`, `.mdx` or `.html`, or any path under `apps/web/` or `packages/design-system/`.

Otherwise the row is visual and needs a screenshot or a computed style, as today. The qa may still mark any row visual. The reviewer checks each Why against the code the row's tests run.

**Rule `last-walk-1`** (every row walked on the code that ships).

1. **At each merge into develop.** merge-check reads the spec at the PR head and the PR's latest `qa.json`. It refuses unless the walk's `part` fits the spec (a label of its table, or none when it has no table) and every row of that part has an entry that is `pass` or `owner_verify`.
2. **At the move to G3 PR review.** The g3-check records stage takes the issue's latest merged PR that is not docs-only, as merge-check judges docs-only (ORV-95). It refuses unless the latest `qa.json` for that PR and its head is an approve whose part is every row (the last label, or no `part` when the spec has no table), with a `pass` or `owner_verify` entry for every row from `qa-scope-1` point 1 of the spec on develop.
   - An issue whose merged PRs are all docs-only has no walk to check.
   - The latest merged PR is still judged by merge-check, as ORV-98 decided.
3. **Earlier rows are walked again.** The last walk runs on the head of the last code PR, so rows walked by earlier PRs are walked again on the code that ships. A label after the last one does not exist: a PR beyond the table walks as the last label.

**Other bounds.**

- Messages print row numbers, labels, PR numbers, SHAs and file paths only, each cleaned as merge-check's `clean` does (control characters removed, cut at 200 characters). Spec text is untrusted and is never printed.
- The records stages read the spec through git at a SHA (`readFileAtHead` in `merge-check-facts.mjs`, or the develop export), never from a working tree.
- No new record kind, no new hook and no new dependency.

## PR 134, walked through

**Today.** `ORV-134-qa-1` walks rows 4, 8 and 30 and the full gate (its envelope, lines 6 and 29). The recorder asks for 9 more rows: the 8 that PR 2 carries, and row 31 (Worked example 3, C1). Row 8 is visual by "colour" (Worked example 1, C6), so it needs a screenshot or a computed style that PR 134 cannot honestly give (C7 to C9). After two refusals the envelope closes as `no_report` (C15).

**After this story.**

1. ORV-134's spec carries the QA scope of the fixture "the ORV-134 spec" (Acceptance criteria). Row 31 is added to PR 1 there, because PR 1 runs the gate that row 31 names.
2. The walk names `part: "PR 1"` and reports rows 4, 8, 30 and 31.
3. Row 8 is not visual, because the spec says every row renders nothing and PR 134's files hold no rendering file (Worked example 4).
4. The walk is recorded (row 5), and merge-check lets PR 134 merge on those four rows (row 12).
5. A G3 move after that merge is refused, because PR 134 was walked as PR 1 (row 15). The issue moves once PR 2 merges with a walk of all 12 rows on its own head.

## Worked examples

None of these was run: this session has no shell. The input of each is copied from the named source, and the expected output is exact (whole numbers, no rounding).

1. **The keyword list on PR 1's rows.** The regex is from `scripts/ovl/result-recorder.mjs:33`. The cells are the User sees cells of rows 4, 8, 30 and 31 from `docs/specs/ORV-128/spec.md` lines 327, 331, 353 and 354, which ORV-134 copies unchanged. The apostrophe in row 8 is written as the shell sequence that closes the single quote, adds an escaped quote and opens it again, so the quoting holds. Expected output: `8`. Reading the other eight cells the same way, rows 12, 34 and 35 also match ("colour measures", `colour-declared`, `colour-area`).

   ```bash
   node -e 'const V=/layout|spacing|gap|align|centre|center|colou?r|overlap|motion|position/i;const r={4:"Deep-equal results with equal ids for the first two; evidence sorted by kind, then locator; with the later clock, equal ids and only `retrievedAt` differs",8:"`colour-area` items whose `area-share` sums to 1 within 0.001 per scope, each with its ORV-20 hue band; a `contrast-ratio` for the body text pair; `text-density` and `element-density`; `font-family` for headings and body; every item `fromModel: false` with a `measure` and a `locator`; every rendered item names the snapshot'\''s `renderer`",30:"None imports `openrouter`, `llm-interpreter`, `@orivilo/page-reader` or a `node:` module, or calls `Math.random` or `Date.now`; only the model-reading adapters import `openrouter`; tests use a fake network and recorded answers",31:"All pass; `pnpm contrast` output unchanged from `develop`"};console.log(Object.keys(r).filter(k=>V.test(r[k])).join(" "))'
   ```

2. **The range form of `qa-scope-1` on rows that are neither consecutive nor sorted.** The input is the Rows cell of slice 1c, `docs/specs/ORV-128/spec.md:306`. Expected output: `4 8 9 10 11 12 34 35 38 29 30 31 12`.

   ```bash
   node -e 'const s="4, 8 to 12, 34, 35, 38, 29 to 31";const out=s.split(", ").flatMap(p=>{const m=/^(\d+) to (\d+)$/.exec(p);if(!m)return[Number(p)];const a=[];for(let i=Number(m[1]);i<=Number(m[2]);i++)a.push(i);return a});console.log(out.join(" "),out.length)'
   ```

3. **The rows today's recorder asks PR 1 for, which PR 1 does not carry.** The spec rows are the output of example 2. PR 1's rows are those of the QA scope above. Expected output: `9 10 11 12 34 35 38 29 8`, meaning 8 rows, each an "ac has no entry for spec row n" today (`result-recorder.mjs:255`) and each named in row 6's last case and row 13's second case. Against the walk `ORV-134-qa-1` ran (rows 4, 8 and 30), row 31 joins them, for 9 rows.

   ```bash
   node -e 'const spec=[4,8,9,10,11,12,34,35,38,29,30,31];const pr1=[4,8,30,31];const miss=spec.filter(r=>!pr1.includes(r));console.log(miss.join(" "),miss.length)'
   ```

4. **The rendering-file test of `renders-nothing-1` on PR 134's files.** The paths are from `.orivilo/runs/ORV-134/ORV-134-build-wu-1/envelope.json` lines 9 to 12. Expected output: `0`. The PR's real diff, `git diff --name-only origin/develop...1da1529`, was not run here. Its fact in `ORV-134-qa-1` says no `*.stories.tsx` and no design-system file changed.

   ```bash
   node -e 'const R=/\.(tsx|jsx|css|mdx|html)$|^apps\/|^packages\/design-system\//;const f=["packages/intent-engine/src/measures/wu.ts","packages/intent-engine/src/measures/wu.test.ts","packages/intent-engine/src/measures/LICENSE-material-color-utilities.txt","packages/intent-engine/src/evidence.test.ts"];console.log(f.filter(x=>R.test(x)).length)'
   ```

## Options considered

1. **Where the rows of each PR are declared.**
   - (a) The spec's `## QA scope` section. It is reviewed, kept in git, and read by every judge.
   - (b) A new envelope field written by the main session: unreviewed, outside git, and written by the session that wants the pass.
   - (c) The qa report alone: no second reader.
   - (d) One Jira issue per PR, each with its own spec (L-0016): ORV-134's rows 4 and 8 are carried in part by both PRs, so a slice spec could not copy them without new wording, and C6 to C9 would stay.
   - Taken: (a).
2. **Rows that render nothing.** See open question 2.
3. **How the last walk is ensured.**
   - (a) The last code PR walks every row on its own head, checked at the G3 move.
   - (b) The union of approved part walks across merged PRs. The repo squash-merges (`.claude/skills/ovl/SKILL.md:266`), so an earlier PR's head is not an ancestor of develop, and an earlier walk cannot be tied to the code that ships.
   - (c) A check only at merge, with the spec marking the last PR: a PR that names an early label as the last PR passes.
   - (d) The reviewer only.
   - Taken: (a), with merge-check holding each merge to its part (`last-walk-1`).
4. **Word bounds on the keyword list.** Rejected. `\bcentre\b` misses "centred" and `\balign\b` misses "misaligned", so it would make rows that render stop being visual. C6's false matches are handled by `renders-nothing-1` instead.

## Honest limits

- **A guard rail, not a boundary.** A session that sets out to defeat it can do so; the items below are the known routes.
- **The QA scope is a doc.** `docs/` is outside every protected set (`docs/specs/ORV-93/spec.md:184`). A PR can narrow its own line, or list rows as rendering nothing, and the recorder and merge-check accept it. Only the reviewer sees that. A narrowed row comes back at `last-walk-1` point 2, but a wrong renders-nothing entry does not.
- **`part` is the qa's own statement.** A qa that names an early label on the last PR merges on a partial walk. `last-walk-1` point 2 then blocks the G3 move until a full walk on that PR's head is recorded.
- **The fence sees only files that render directly.** An engine change that alters what the Studio shows, for example through the resolver in `packages/intent-engine`, passes the fence. The reviewer's check of the Why is the only check.
- **"What the walk covers" is free text.** Nothing checks that a `pass` in a part walk covers what the line says.
- **`last-walk-1` point 2 runs only on the G3 move through g3-check.** A move in the Jira web UI or through the REST API (`.claude/skills/ovl/SKILL.md:365`), or a workflow move that skips G3 PR review, is not checked. A release into main checks no issue's rows (`merge-check.mjs:185` to `:196`).
- **A docs-only PR still merges without a qa** (`merge-check.mjs:236` to `:241`). A row it adds is caught at the G3 move, not at its merge.
- **The last walk costs a re-walk.** Evidence that was a one-off run must be run again.
- **Older records.** A `qa.json` written before this story has no `part`. On a spec with no QA scope it reads as a full walk, as the old recorder required.
- **`looked_at` and the screenshot `note` stay the qa's own statement**, as ORV-81 and ORV-95 already say.

## Out of scope

- C20: merge-check reading the latest `qa.json` of the issue for any PR (ORV-95 spec line 75). The flow walks and merges one PR at a time.
- A coverage check on the release PR into main, and on moves to Staging, G4, Release, G5 and Done.
- Any change to the keyword list itself, to the screenshot rules for changed stories (ORV-81 rows 21 to 23), or to the designer sign-off.
- Edits to other specs, agent files and skills. They are listed under "Downstream review" for their owners.

## Open questions (option, impact, default)

1. **One PR or two.**
   - Options: (a) one PR, about 600 changed lines, most of them tests; (b) the recorder first, then merge-check and g3-check, both on ORV-136; (c) two Jira issues, merge-check first.
   - Impact: (b) leaves a window after the first merge where merge-check does not check rows, which is a new route. (c) needs a second spec (L-0016). Merge-check first on one issue cannot be walked, because the old recorder would ask its walk for the second PR's rows, which is this story's own block. (a) is over the 400-line guide.
   - Default: (a), because the bound is one bound.
2. **Rows that render nothing (must ask the owner).**
   - Options: (a) keep today's rule, so a row that renders nothing gets a test-runner screenshot, as ORV-20 did; (b) L-0028 as proposed: the keyword rule applies only when the diff touches a UI path, and a row may say `Visual: no`; (c) `renders-nothing-1`: a reviewed declaration in the spec, switched off by any rendering file in the diff; (d) a new evidence kind for data rows.
   - Impact: The owner declined L-0028 on 2026-10-26 (ORV-20 comment 10218); the comment was not read here, so its reason is unknown. (c) differs from L-0028 in two ways: nothing is exempt unless the spec names it, and a rendering file in the diff switches the exemption off. (a) keeps PR 134's row 8 on filler evidence. If the owner keeps (a), row 8, `renders-nothing-1` and Worked example 4 drop, and C6 to C9 stay open.
   - Default used in this spec: (c), pending the owner's answer.
3. **Extra rows in a part walk.**
   - Options: (a) exactly the part's rows; (b) also any other spec row.
   - Impact: (b) lets a qa add a row the line does not name, and then the record differs from the declaration.
   - Default: (a).
4. **Refuse at dispatch.**
   - Options: (a) `envelope-guard` refuses a qa envelope whose spec fails `qa-scope-1`; (b) the recorder only.
   - Impact: (b) loses a finished walk (C13).
   - Default: (a).
5. **The list of rendering files.**
   - Options: (a) the list in `renders-nothing-1`; (b) also all of `packages/intent-engine/`.
   - Impact: (b) switches the exemption off for PR 134 and every ORV-128 slice, which reopens C6 to C9 for them.
   - Default: (a). Indirect rendering is an Honest limit.
6. **PR 134 until this story merges.**
   - Options: (a) wait. Then PR 134 merges develop, ORV-134's spec gains its QA scope, and a new qa walks it as PR 1. (b) The owner merges PR 134 by hand in the GitHub web UI, as in the bootstrap rule (`.claude/skills/ovl/SKILL.md:327`). (c) Walk it now with filler evidence.
   - Impact: (a) holds slice 1c for this story. (b) puts the walk's record in the G3 packet only. (c) is the record this story removes.
   - Default: (a).

## Downstream review

These need review when this spec passes G1. Each item is outside this task's write set, and each is a version bump with a changelog line for its owner.

- **`docs/specs/ORV-81/spec.md:72` (row 20).** Given changes from "A `qa.v1` row marked `visual: false`" to "A `qa.v1` row marked `visual: false` that the keyword list makes visual, where ORV-136 `renders-nothing-1` does not apply".
- **`docs/specs/ORV-81/spec.md:73` to `:75` (rows 21 to 23).** Checked; no change. They test the gate's `ok`, the gate SHA and the light screenshot of a changed story, and none of them reads AC rows.
- **`docs/specs/ORV-81/spec.md:477`.** "`ac` has one entry for every row in the spec's AC table." becomes "`ac` has one entry for each row of the walk's part and none for another row (ORV-136 `qa-scope-1`); a spec with no rows per PR has one part, every row."
- **`docs/specs/ORV-81/spec.md:480`.** "a row is visual when its Result cell matches" becomes "a row is visual when its User sees, Result or Then cell, found by its header (ORV-136 `qa-scope-1`), matches", and the rule adds "unless ORV-136 `renders-nothing-1` applies".
- **`.claude/agents/qa.md:21` (step 4).** Old: "Walk every row of the spec's AC table. A row the recorder's keyword list makes visual needs a screenshot or a computed style." New: "Walk the rows of your PR's line in the spec's QA scope (`qa-scope-1`), or every row when the spec has none, and name the line's label in `part`; give no entry to another row. A row the recorder's keyword list makes visual needs a screenshot or a computed style unless `renders-nothing-1` applies."
- **`.claude/agents/qa.md:25` (G4 walk).** Add: "On a spec with rows per PR, name the last label in `part`."
- **`.claude/agents/qa.md:35` (report contract).** Add `part` to the list of fields, as optional.
- **`.claude/skills/ovl/SKILL.md:73` (section 2, QA envelope).** Add: "When the spec has a QA scope with rows per PR, one more fact names the PR's label, `checked_by` `grep -n '^| PR <k> |' docs/specs/<KEY>/spec.md`; the last code PR of the issue walks as the last label."
- **`.claude/skills/ovl/SKILL.md:15` (Discover).** Add: "A spec whose issue ships in more than one PR carries a `## QA scope` section (ORV-136 `qa-scope-1`) before the first PR's qa."
- **`docs/specs/ORV-134/spec.md`.** After the table "Which PR carries which test", add a `## QA scope` section as the fixture "the ORV-134 spec" describes it in the acceptance criteria above, with PR 1 rows 4, 8, 30 and 31, PR 2 `every row`, and renders nothing for every row. The Why cites the ORV-128 acceptance preamble (`docs/specs/ORV-128/spec.md:319`). PR 134 then merges develop, so its head runs the new recorder.
- **`docs/specs/ORV-93/spec.md:145`.** It quotes the qa step. Old: "It walks every row of the spec's AC table. A row the recorder's keyword list makes visual needs a screenshot or a computed style". New: the qa.md step 4 text above, or a note that ORV-136 replaced it.
- **`docs/specs/ORV-95/spec.md:75`.** Add: "and the walk covers its part's rows (ORV-136 `last-walk-1` point 1)".
- **`docs/specs/ORV-98/spec.md:158`.** "Only the latest merged PR is judged." becomes "The latest merged PR is judged; the latest merged code PR's walk must cover every row (ORV-136 `last-walk-1` point 2)."

## Depends on

- ADR 0013 decision 4: proof must match the claim, and a visual row needs a screenshot or a computed style. `renders-nothing-1` keeps that; it only decides which rows are visual.
- ADR 0012 and its decision 4: G1 and G2 pass under the owner's delegation during the POC. Open question 2 still goes to the owner, because it revisits the owner's own decline.
- ORV-81 v1.5: the recorder rules (lines 477 to 480) and rows 19 to 24. ORV-95: the merge-check `qa` rule (line 75) and docs-only (line 281). ORV-98: g3-check judges the latest merged PR (line 158).
- L-0012: the guard frame. L-0016: slice specs copy rows with their numbers. L-0028: the declined keyword lesson (ORV-20 comment 10218).
- ORV-134 spec v1.2 (lines 43 to 50 and 73 to 84, as the run records cite them; the file is on branch `feature/ORV-134-url-analyser` and was not read here), and the records `ORV-134-qa-1` (`envelope.json`, `closed.json`) and `ORV-134-build-wu-1` (`envelope.json`).
- ORV-136 finding QA-1 in Jira. It was not read here; the blocks above come from the code.

## Changelog

- v1 (2026-10-28): spec. Surveys 20 routes (C1 to C20) and closes C1 to C19 with one bound: `qa-scope-1`, `renders-nothing-1` and `last-walk-1`. Adds 16 rows, 4 worked examples and 6 open questions. Downstream review: ORV-81 lines 72 and 477 to 480; `.claude/agents/qa.md` lines 21, 25 and 35; `.claude/skills/ovl/SKILL.md` lines 15 and 73; the ORV-134 spec; ORV-95 line 75; ORV-98 line 158.
