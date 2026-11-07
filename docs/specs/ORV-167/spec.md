---
issue: ORV-167 (https://tpetkaew.atlassian.net/browse/ORV-167)
parent: ORV-159 (docs/specs/ORV-159/spec.md v1.1)
lane: L
version: 1.1
---

# ORV-167: the helper answers 404 for a workspace the caller is not in (ORV-159 slice 2)

## Why

ORV-167 is slice 2 of ORV-159, the `packages/auth` helper, made its own Jira issue on 2026-10-30. It adds no requirement: every row below is an ORV-159 row, copied word for word with its number and its Check cell, and every rule it names is defined in the parent spec.

**Why its own issue.** The QA walk of the slice 2 PR (task ORV-159-qa-1, PR 150 at head `218271e`) found every slice 2 row passing, each with a red mutation per clause, and the full gate green. Its verdict was `request_changes` only because of finding QA-1 (Important): the result recorder needs an `ac` entry for every row of `docs/specs/<issue>/spec.md` and has no out-of-scope status, so the ORV-159 rows of slices 3 and 4 (rows 8 to 11 and 14 to 20) could only be recorded truthfully as `fail`. QA-1's first remedy is a slice spec under the slice's own key (ovl skill, step 2, L-0016) and a fresh `qa` envelope on that issue. This file is that slice spec: its acceptance table holds the slice 2 rows only, so the recorder reads exactly those.

**Frame.** As in the parent spec ("Why", **Frame**): a server-side access control, not a hook that judges a tool call's text, so neither a guard rail nor a boundary in the L-0012 sense. What enforces it is server code the caller cannot change: the helper's member lookup and the row security of `inWorkspace`.

**What is real.** Real code and tests, as the parent's "What is real" says. The helper's 404 is dormant in the app today (every caller passes the session's `activeOrganizationId`), and no person sees a change from this slice: `apps/web/app/directions/actions.ts` still maps any non-401 `Denied` to `forbidden` until slice 3 (parent "Slices", item 2). The stub database of `access.test.ts` is a test double, not a simulated product feature.

## Story

The parent's story, unchanged: ORV-159 spec, "Story".

## Parent and decisions

- Parent spec: `docs/specs/ORV-159/spec.md` v1.1. Its "Rules and bounds", "Worked examples", "Out of scope", "Impact list" and "Open questions" are the one home for this issue too; this file points to them and does not restate them.
- ORV-159 comment 10292: G1 and G2 passed on the defaults of the parent's "Open questions", under the owner's delegation (ADR 0012 decision 4). They cover this slice; this issue raises no new G1 or G2.
- Tech notes: `docs/specs/ORV-159/tech.md` (linked, not copied). Section 2 (slice 2: the edits to `access.ts` and the tests of `access.test.ts`, `auth.integration.test.ts` and `directions.integration.test.ts`) and section 5 (tests per row, one mutation per clause: rows 1 to 7, 3a to 3d, 12, 13a and 13b, with T4 and T7 of section 1).
- Lane **L**, from the parent ("Lane"): the auth and data access flag. The `security` role is dispatched on the PR, as the diff touches `packages/auth/**` (ADR 0015 decision 2).

## Acceptance criteria

The rows keep their ORV-159 numbers and their Check cells; rows 8 to 11 and 14 to 20 stay in the ORV-159 spec (see "Out of scope"). "Operator" is the developer or agent who reads an outcome, a log line or a test. No row here shows UI text: every result is for the operator, so no Thai or English copy is quoted. A rule name in a row (`orv159-denied`, `orv159-same-answer`) is defined once in the ORV-159 spec, "Rules and bounds". Each row's mutation is the one change to the code that must turn its test red (`.claude/rules/testing.md`, L-0042).

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test (mutation) |
| --- | --- | --- | --- | --- | --- |
| 1 | `withWorkspace` with no session | It is called for `ws-a` | Operator: rejects with `Denied`, `status: 401`, `reason: "no-session"`; `fn` not called (`orv159-denied`) | No query | `packages/auth/src/access.test.ts`, "denies without a session, with 401, and runs nothing" (today's, line 13). Mutation: line 52 throws 403 |
| 2 | A session, workspace id `undefined`, `null` or `""` | It is called | Operator: `Denied`, `status: 403`, `reason: "no-workspace"`; `fn` not called | No query | `access.test.ts`, "denies a missing workspace id (%s) with 403" (today's, line 27). Mutation: line 53 throws 404 |
| 3 | Chai signed in; Dao's workspace exists and Chai has no member row in it | `withWorkspace` is called for Dao's workspace id, `minRole` `"member"` | Operator: `Denied`, `status: 404`, `reason: "not-a-member"`, message `access denied: not-a-member`; `fn` not called | One select on `member`, nothing else | `packages/auth/src/auth.integration.test.ts` AC 4, line 119 changes from 403 to 404; new `access.test.ts` case with a stub database whose member select resolves to `[]`, "denies a workspace the caller is not in with 404". Mutation: line 59 throws 403 |
| 4 | Chai signed in; the id `9f1c2d3e-0000-4000-8000-000000000000` belongs to no workspace | `withWorkspace` is called for that id | Operator: a `Denied` equal to row 3's in `status`, `reason` and `message` (`orv159-same-answer`) | One select on `member`, nothing else | New `auth.integration.test.ts` case, "a missing workspace id is denied like a foreign one"; the `access.test.ts` stub case of row 3 runs both ids. Mutation: the helper first selects `organization` and throws `Denied(403, "no-workspace")` when no row is found |
| 5 | Eak is a `member` of his workspace | `withWorkspace` is called with `minRole` `"admin"` | Operator: `Denied`, `status: 403`, `reason: "role-too-low"` | One select on `member` | `auth.integration.test.ts`, "denies a role below the one asked for" (today's, line 128). Mutation: line 60 throws 404 |
| 6 | The type of `Denied["status"]` | `pnpm typecheck` runs | Operator: passes only while the status union is exactly `401`, `403` and `404` (`orv159-denied`, the status clause) | None | New `access.test.ts` case, `expectTypeOf<Denied["status"]>().toEqualTypeOf<401 \| 403 \| 404>()` (`packages/auth/tsconfig.json` includes `src`, so test files are type-checked). Mutation: the union gains `500`, or loses `404` |
| 7 | The type of `Denied["reason"]` | `pnpm typecheck` runs | Operator: passes only while the reason union is exactly `no-session`, `no-workspace`, `not-a-member` and `role-too-low` (`orv159-denied`, the reason clause) | None | New `access.test.ts` case, `expectTypeOf<Denied["reason"]>()` against the four literals. Mutation: the union gains `"not-found"` |
| 12 | Fon signed in; Eak's direction id, then the direction id `00000000-0000-4000-8000-000000000000`, which no direction has | `service.read` in Fon's own workspace for each | Operator: both reject with `reason: "not-found"`; through the boundary both give `{ ok: false, error: "not-found", code: "NOT_FOUND", requestId: <id>, retryable: false }` (ADR 0015 line 153's pair) | No row read from Eak's workspace | `packages/auth/src/directions.integration.test.ts` AC 8 (lines 167 to 186) gains the missing id read; `actions.test.ts` today's `not-found` case (line 469). Mutation (tech notes T4): `packages/db/migrations/0003_directions_access.sql` line 16, the `USING` clause of `direction_version`, becomes `USING (true)`, in the throwaway test database only. The earlier mutation, `withWorkspace` runs `fn` on `deps.db` instead of inside `inWorkspace`, is also run and recorded as red at setup (Eak's `saveDraft` fails the `WITH CHECK` of lines 12 to 13) |
| 13 | Chai signed in; then Chai's member row is deleted by the admin database handle, and his session still holds that workspace as active | `service.list(c.headers, c.workspaceId)`; then `service.list(f.headers, e.workspaceId)` for another person's workspace | Operator: both reject with `status: 404`, `reason: "not-a-member"` | The session row is unchanged | `directions.integration.test.ts` line 180 changes from `{ status: 403 }` to `{ status: 404, reason: "not-a-member" }`, plus the new removed-member case. Mutation: the helper trusts the session's `activeOrganizationId` and skips the member select |

Notes on the rows (no row above is changed by them):

- **Row 12, the reviewed mutation.** Task ORV-159-review-1, finding S1 (Suggestion), ran row 12's mutation as written and found it reaches only the last AC 8 assertion: with line 16 alone set to `USING (true)`, `directions.integration.test.ts` goes red at line 192, while the read at line 173 stays `not-found`, because `service.read` inner-joins `direction` (`packages/auth/src/directions.ts` line 183), whose policy still holds. The mutation that reaches the clause "a foreign direction answers like a missing one" sets both policies, `0003_directions_access.sql` lines 12 and 16, to `USING (true)`; it goes red at line 173 ("promise resolved instead of rejecting"). The reviewer accepted the two-policy mutation as row 12's mutation and the builder's deviation that recorded it. QA records row 12 with three red runs: the two-policy mutation (red at the clause), the line 16 mutation of the row (red at line 192) and the earlier `deps.db` mutation (red at setup). The row's own text changes only in the parent spec and tech notes T4, in the slice 3 or slice 4 bookkeeping pass (S1: "Follow-up, does not block").
- **Line numbers.** The rows' line numbers are the parent's, at `develop` `eeb2e71`. The `access.ts` throws of rows 1, 2, 3 and 5 sit at lines 58, 59, 65 and 66 (`grep -n "throw new Denied" packages/auth/src/access.ts` on `develop` `7d04e4a`, review finding N1 of ORV-167), and row 12's `actions.test.ts` `not-found` case is at line 546 at PR 150's head `218271e` (after PR 141, ORV-121), as task ORV-159-qa-1 recorded. QA finds each by its text.
- **Database evidence.** The integration tests of rows 3, 4, 5, 12 and 13 skip without `TEST_DATABASE_URL`; their evidence is a local run against Postgres (tech notes T7) and the CI run id on the PR head (parent "Slices", item 2).

## Rules and bounds

The rules these rows test are defined once, in the ORV-159 spec, "Rules and bounds": `orv159-denied` (rows 1, 6, 7) and `orv159-same-answer` (row 4). Their worked examples ("Reason to status to outcome", "A foreign and a missing workspace give one answer") are in the parent spec, "Worked examples". This file defines no rule of its own; a change to a rule is made in the parent spec first.

## Worked examples

Each line is written from its source and was not run in this task (no shell); the main session runs them from the repository root.

- **The rows the recorder reads.** Method: `specRows` in `scripts/ovl/result-recorder.mjs` (lines 106 to 121): the first line matching `^\|\s*#\s*\|`, then each following line that starts with `|`, cells split on `|`, cell 1 kept when it is digits, cell 4 as the result. Input: this file. The escaped pipes of row 6 sit in cell 6, after cell 4, so they do not move the result cell. No rounding.

  ```bash
  node -e 'const l=require("fs").readFileSync("docs/specs/ORV-167/spec.md","utf8").split("\n");const s=l.findIndex(x=>/^\|\s*#\s*\|/.test(x));const r=[];for (const x of l.slice(s+2)){if(!x.startsWith("|"))break;const c=x.split("|").slice(1,-1).map(y=>y.trim());if(/^\d+$/.test(c[0]))r.push(c)}console.log(r.map(c=>c[0]).join(" "));console.log(r.every(c=>c[3].startsWith("Operator:")))'
  # expected:
  # 1 2 3 4 5 6 7 12 13
  # true
  ```

- **The size.** Input: the code lines of PR 150 at `218271e`, from task ORV-159-review-1's `git diff --stat` (`access.ts` +9 −4, `access.test.ts` +67, `auth.integration.test.ts` +28, `directions.integration.test.ts` +24). The sum adds no rounding; the rest of PR 150's +669 is docs (the parent spec v1.1, the tech notes, K-0092 and the knowledge index).

  ```bash
  node -e 'const add={access:9,accessTest:67,authInt:28,dirInt:24},del=4;const a=Object.values(add).reduce((x,y)=>x+y,0);console.log(a,del,a+del)'
  # expected: 128 4 132
  ```

## Out of scope

- The ORV-159 rows of the other slices, which stay in the ORV-159 spec: rows 8 to 11, 14 and 20 (slice 3, `apps/web` boundary and copy) and rows 15 to 19 (slice 4, Better Auth's organization paths, the staging probe and the ADR Additions).
- Slice 1 (the docs: K-0092, the parent spec, the tech notes), done under ORV-159.
- Everything the parent spec's "Out of scope" lists.

## Impact list

- **Code and tests**: the slice 2 files of the parent's "Impact list" and tech notes section 2: `packages/auth/src/access.ts` (the `Denied` status union, its class comment, the `not-a-member` throw), `access.test.ts`, `auth.integration.test.ts`, `directions.integration.test.ts`. No migration; `packages/auth/src/index.ts` unchanged.
- **Contract**: `Denied["status"]` widens to `401 | 403 | 404`. `Denied` is a public export of `@orivilo/auth`; its consumers are listed in ORV-159-review-1 finding S3 (`actions.ts` `run`, still `forbidden` until slice 3; `spend-cap.ts` `check`; the account page's `Denied` map).
- **Size**: 132 changed code lines (worked example "The size"), one PR.
- **`security` role** on the PR (`packages/auth/**`).

## Open questions

The parent's open questions 1 to 9 are decided (ORV-159 comment 10292) and are not reopened here. One question of this slice, with its default:

- **Q1. How does QA record row 12, whose Check names the line 16 mutation that review S1 found reaches only the last assertion?** Options: (a) record the three red runs of the row 12 note and pass the row, with S1 cited; (b) block row 12 until the parent's row 12 and T4 are reworded. Impact: (b) holds a slice that review and QA both found correct for a wording follow-up; (a) keeps the record true, as every run in it is a real red run. Default: (a).

## Depends on

ORV-159 spec v1.1 (the parent: rules, worked examples, open questions 1 to 9, "Slices" item 2); ORV-159 comment 10292 (G1 and G2 under delegation); `docs/specs/ORV-159/tech.md` sections 2 and 5 (and T4, T7 of section 1); task ORV-159-qa-1 finding QA-1 (why this issue exists); task ORV-159-review-1 findings S1 and S3; the ovl skill, step 2 (L-0016); ADR 0015 decisions 2 and 10; ADR 0012 decision 4; ADR 0002 (the central authorization helper).

## Changelog

- v1.0 (2026-10-30): first spec, ORV-159 slice 2 as its own issue (task ORV-167-spec-1), written from ORV-159 spec v1.1 after task ORV-159-qa-1 finding QA-1. Rows 1 to 7, 12 and 13 copied word for word with their numbers and Check cells; no new requirement. The reviewed row 12 mutation (ORV-159-review-1 S1) is a note under the table, not a changed row. Downstream to review: the ORV-167 Jira acceptance (these rows), the fresh `qa` envelope on ORV-167 for PR 150, the first builder envelope for ORV-167 (fact `test -f docs/specs/ORV-167/spec.md`, L-0016), and the parent's "Slices" item 2 and tech notes section 7 task 1, which do not yet name ORV-167.
- v1.1 (2026-10-30): "Notes on the rows", second bullet: the `access.ts` throw lines become 58, 59, 65 and 66, read on `develop` `7d04e4a` (review finding N1, task ORV-169-spec-1). No row changes. The parent's row 12 and tech notes T4 now carry the two-policy mutation of the first bullet (parent v1.2); row 12 here keeps the v1.1 text QA recorded. Downstream to review: none beyond the parent's v1.2 list.
