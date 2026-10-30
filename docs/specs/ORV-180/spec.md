---
issue: ORV-180 (https://tpetkaew.atlassian.net/browse/ORV-180)
parent: ORV-161 (slice 3, "Scan PR")
lane: L, inherited from ORV-161
version: 1.2
---

# ORV-180: ORV-161 slice 3, the axe scan of the pages without a database

## Why

ORV-180 is slice 3 of ORV-161, the axe scan of every `apps/web` page (ORV-113 item 8). The parent's "Slices" list, item 3, names it "Scan PR" with rows 5 to 10: `@playwright/test`, `@axe-core/playwright` and the `test:e2e` script in `apps/web/package.json`, the root `test:e2e` script, the new `apps/web/playwright.config.ts` with the port 3200 server, and the new `apps/web/e2e/pages.a11y.spec.ts` with the 40 scans of the states that need no database. Slices 1 and 2 (the parent spec and the fix PR, rows 1 to 4) merged in PR 163. Slice 3 is its own issue because it is the first slice that adds code to the scan, and each slice PR names its own Jira key in its title (AGENTS.md rule 2).

This file is the slice spec of L-0016: a slice issue gets its own spec. It adds no requirement and no gate of its own. The business intent, the story, the frame, what is real and the set structure are the parent's ("Why", "Story", "The set this covers").

**Frame.** The scan is a CI check, not a hook that judges a tool call's text (parent "Frame"). This slice holds no auth part: the session of `orv161-session` and the port 3201 server are slice 5's. The port 3200 server reaches no database (`orv161-servers`).

**What is real.** The parent's "What is real" paragraph holds, and `orv161-report` governs every title, PR body and gate line this slice writes. This slice runs no step in CI: the scan joins CI and `pnpm quality-gate` in slice 4.

## Parent spec and gates

- Parent spec: `docs/specs/ORV-161/spec.md` v1.3 (changelog line "v1.3 (2026-10-31)").
- G1 and G2: ORV-161 comment 10290, passed under the owner's delegation in POC mode (ADR 0012 decision 4, parent "Lane"). ORV-180 inherits both; no new gate decision is needed for this slice.
- Decisions: the parent's "Depends on".
- Review: full gate, reviewer and qa (parent "Slices", item 3). The `security` role is slice 5's (parent "Impact list", "Roles").
- Files: the parent's "Impact list" and "Placement" name them; this slice writes the slice 3 part of them and no guard file. That part includes the home page backlog link fix in `apps/web/app/page.tsx`, whose change the parent's "Slices", item 3, states.

## Acceptance criteria

Rows 5 to 10 of the parent spec, copied with their numbers, their columns and their text unchanged. The parent's "Acceptance criteria" opening paragraph holds: every scan runs on the pages of `orv161-pages`, under `orv161-matrix`, with `orv161-rules`, and "Red" means the scan, or the test named, fails with the line quoted.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 5 | The scan, any one of its scans | axe's result is read | The set of rule ids across `passes`, `violations`, `incomplete` and `inapplicable` is exactly the set `orv161-rules` runs. It holds `region`, `landmark-one-main` and `target-size`, and none of the ids `orv161-rules` leaves off | None | Slice 3: an assertion in every scan, "runs the rules of orv161-rules" (worked example "The rule set") |
| 6 | The scan config | `pnpm --filter @orivilo/web exec playwright test --list` runs | It lists 40 tests in slice 3 and 72 after slice 5. Each title names the route, the state, the locale, the scheme and the width, such as `/account not-configured en dark 360` | None | Slice 3 and slice 5: the list count as a `verified` row (worked example "The matrix") |
| 7 | A machine where `apps/web/.env.local` sets `DATABASE_URL`, and the owner's dev server running on port 3000 | `pnpm build`, then `pnpm test:e2e` | The scan server for the states without a database answers on port 3200, and port 3000 is never requested. `/directions` shows "ยังบันทึกทิศทางในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่าฐานข้อมูล" / "Directions cannot be saved in this environment yet: the database is not set up." `/account` shows "ยังลงชื่อเข้าใช้ในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่า Google และฐานข้อมูล" / "Sign-in is not available here yet: Google and the database are not set up." | No connection to any database (`orv161-servers`) | Slice 3: the state assertion of `orv161-wait` before each scan. A run on the owner's Mac is recorded as a `verified` row |
| 8 | The 40 scans of slice 3 | `pnpm test:e2e` runs | Each scan first passes the checks of `orv161-wait`, then axe finds zero violations. The run ends `40 passed` | None | Slice 3: new `apps/web/e2e/pages.a11y.spec.ts` |
| 9 | `orv161-exceptions` | The scan file is read | The list is empty at v1.0. A page-level rule exception exists only as an entry of that list | None | Slice 3: read by the reviewer. Mutant M8 shows an entry without a reason is refused |
| 10 | Each mutant of `orv161-mutants` | It is applied in a scratch run and the scan runs | Red, with the expected rule id or assertion in the failure line. Restored, the run is green again | None | Slice 3: one `verified` row per mutant with its red line (L-0002, testing.md lines 32 to 34) |

Reading notes, no new requirement:

- Row 6: this slice meets the "40 tests in slice 3" clause. The "72 after slice 5" clause is slice 5's, and its list count is a `verified` row of that PR.
- Row 8: "the 40 scans" are the 5 states `orv161-pages` gives slice 3, each under the 8 combinations of `orv161-matrix` (parent worked example "The matrix").
- Row 9: "v1.0" is the parent spec's version. No parent version since (v1.1 to v1.3 included) added an entry, so the list is empty in this slice too. An entry found needed while building follows `orv161-exceptions` and is listed in the PR body.
- Row 10: "Each mutant" is M1, M2, M3, M4, M5, M6, M7, M8 and M9, the nine rows of the `orv161-mutants` table, with the red line that table gives each. The PR body holds one `verified` row per mutant (parent "Slices", item 3).

## Rows per PR

The qa walk of a PR covers the rows its line names (ORV-138 rule `qa-scope-1`).

- PR 166 (`feature/ORV-180-axe-scan`, the slice 3 PR): rows 5, 6, 7, 8, 9, 10

The same line is in the parent's "Rows per PR", as the parent's section says.

## Rules and bounds

None of its own. Each rule has one home, the parent's "Rules and bounds"; this list points to it and restates no outcome, threshold or form.

- Named by the opening paragraph of "Acceptance criteria" and by rows 5, 6 and 8: `orv161-pages`, `orv161-matrix` and `orv161-rules`.
- Named by row 7: `orv161-servers` (this slice builds its port 3200 server only) and `orv161-wait`.
- Named by row 8: `orv161-wait`.
- Named by row 9: `orv161-exceptions`.
- Named by row 10: `orv161-mutants`.
- Also binding on the files this slice writes, with no row of their own here: `orv161-report` and "Placement".

## Worked examples

This slice derives no number and adds no method; each number in rows 5 to 10 comes from a parent worked example, which stays its one home. None was run in this task (no shell); the main session runs each from the repo root with the command the parent gives.

- 91 rules, and the 14 rule ids left off (row 5): parent "The rule set".
- 40 scans (rows 6 and 8): parent "The matrix", expected `9 8 72 40`.
- Port 3200 configured by no `.env.local` (row 7): parent "Blank beats .env.local".
- The `target-size` red line of M6 (row 10): parent "Target spacing".

## Out of scope

- Rows 1 to 4: slices 1 and 2, merged in PR 163.
- Slice 4, the guard-file PR (rows 11 to 14): the `e2e` step in `.github/workflows/ci.yml` and `scripts/quality-gate.mjs`, under the owner approval record, and the skill, template and `AGENTS.md` lines.
- Slice 5, the session PR (rows 15 to 18): `orv161-session`, the port 3201 server, the four states with a database and the new rule in `.claude/rules/security.md`.
- Slice 6, the closing PR (rows 19 and 20): the ADR 0015 Additions, the ORV-108 note, `DESIGN.md`, `qa.md`, the webapp-testing skill and the home page entry.
- Slice 7, the G4 walk (row 21): the `staging` project.
- Everything under the parent's "Out of scope".

## Open questions

The parent's open questions and their defaults hold (parent "Open questions"); G2 passed on them. This slice carries out the defaults of questions 2, 3, 5, 6, 8, 9, 10 and 11. One question on how this slice meets `orv161-wait` before slice 4 exists, no new requirement:

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | `orv161-wait` sizes its time limits from a local time measured under `pnpm quality-gate` and records the first CI run's step time, but the `e2e` step joins the gate and CI only in slice 4. What does this slice measure? | (a) the builder measures the local time of `pnpm test:e2e` after `pnpm build`, sets the limits from it as `orv161-wait` says, and reports the time as a `verified` row; slice 4 re-measures under `pnpm quality-gate` and records the CI run id; (b) this slice sets no limits and slice 4 sets them | (b) leaves this slice's scans on Playwright's default limits until slice 4; (a) may need a second look in slice 4 | (a) |

## Depends on

The parent spec `docs/specs/ORV-161/spec.md` v1.3 and its "Depends on"; ORV-161 comment 10290 (G1 and G2 under delegation); PR 163 (slices 1 and 2, rows 1 to 4: the `main` on `/workspace` that M1 reverts and the 404 page that `/_not-found` scans); L-0016 (a slice issue gets its own spec); ORV-138 rule `qa-scope-1` (the `## Rows per PR` form).

## Changelog

- v1.0 (2026-10-31): slice spec for ORV-180, ORV-161 slice 3, from ORV-161 spec v1.1 (task ORV-180-spec-1). Rows 5 to 10 copied with their numbers, columns and text unchanged; the rules are pointers to the parent; one open question on the time limits before slice 4. No new requirement. Downstream to review: the ORV-180 Jira acceptance (rows 5 to 10), the slice 3 builder envelope, the slice 3 PR body (the M1 to M9 `verified` rows and the `--list` count), and the parent's "Rows per PR", which gains the slice 3 line when the PR opens.
- v1.1 (2026-10-31): follows parent v1.2 (task ORV-180-spec-2); no acceptance row changes meaning. "Parent spec and gates", "Files", names the home page backlog link fix in `apps/web/app/page.tsx` as part of this slice, pointing to the parent's "Slices", item 3; the parent version in "Parent spec and gates" and "Depends on" is v1.2. The M2, M3 and M7 red lines change in the parent's `orv161-mutants` only, which row 10's reading note points to. Downstream to review: the slice 3 builder envelope (its write set gains `apps/web/app/page.tsx`), the slice 3 PR body (the M2, M3 and M7 `verified` rows) and the reviewer's `DESIGN.md` section 11 walk for the change on `/`.
- v1.2 (2026-10-31): follows parent v1.3 and names the PR (task ORV-180-spec-4, review ORV-180-review-1 findings R1-1 and R1-4); no acceptance row changes meaning. "Rows per PR" names PR 166 in place of "its number added when it opens", and the parent's "Rows per PR" gains the line "PR 166: rows 5, 6, 7, 8, 9, 10". The parent version in "Parent spec and gates" and "Depends on" is v1.3; the row 9 reading note counts v1.1 to v1.3 as adding no exception entry (parent v1.3 changes how an entry is applied, not the list). Downstream to review: the qa walk of PR 166 (`qa-scope-1` reads the new line) and the PR 166 body, if it cites the slice spec version.
