---
issue: ORV-169 (https://tpetkaew.atlassian.net/browse/ORV-169)
parent: ORV-159 (docs/specs/ORV-159/spec.md v1.2)
lane: L
version: 1.0
---

# ORV-169: the app answers a missing workspace with its own line (ORV-159 slice 3)

## Why

ORV-169 is slice 3 of ORV-159, the `apps/web` boundary and copy, made its own Jira issue so its PR, its review and its QA record read a spec of its own (L-0016; ORV-167 did the same for slice 2). It adds no requirement: every row below is an ORV-159 row, rows 8, 9, 10, 11, 14 and 20, copied word for word with its number and its Test cell, and every rule it names is defined in the parent spec.

**What the slice does.** Slice 2 (ORV-167, PR 151, merged into `develop` as `765e357`) made `withWorkspace` throw `Denied(404, "not-a-member")` for a workspace the caller is not in. Until this slice, `apps/web/app/directions/actions.ts` still turns every non-401 `Denied` into `forbidden`, so no person sees the change (parent "Slices", item 2). This slice maps the 404 to its own outcome, code and catalog line, and pins that `/account` keeps its sign-in view for any `Denied`.

**Frame.** As in the parent spec ("Why", **Frame**): a server-side access control, not a hook that judges a tool call's text, so neither a guard rail nor a boundary in the L-0012 sense. What enforces it is server code the caller cannot change.

**What is real.** Real code and tests, as the parent's "What is real" says. The 404 stays dormant in the app: every caller passes the session's `activeOrganizationId`, so a person sees the new line only when a membership is removed during a live session. The rows prove the map with a mocked service throwing `Denied(404, "not-a-member")` and a mocked `listDirections`; those are test doubles, not a simulated product feature. Nothing here claims conformance to a standard (ADR 0015 decision 13).

## Story

The parent's story, unchanged: ORV-159 spec, "Story".

## Parent and decisions

- Parent spec: `docs/specs/ORV-159/spec.md` v1.2. Its "Rules and bounds", "Worked examples", "Out of scope", "Impact list" and "Open questions" are the one home for this issue too; this file points to them and does not restate them.
- ORV-159 comment 10292: G1 and G2 passed on the defaults of the parent's "Open questions", under the owner's delegation (ADR 0012 decision 4). They cover this slice; this issue raises no new G1 or G2.
- Tech notes: `docs/specs/ORV-159/tech.md` (linked, not copied). Section 3 (slice 3: the edits to `actions.ts`, `log.ts`, `log.test.ts` and `messages.ts`, and the tests), section 5 (tests per row, one mutation per clause: rows 8a to 8g, 9, 10, 11, 14a, 14b, 20a and 20b) and section 6 (what moves because PR 141 merged first), with T1, T3, T5 and T6 of section 1.
- Lane **L**, from the parent ("Lane"): the auth and data access flag. The `security` role is dispatched on the PR, as the diff touches `packages/auth/**` (`log.ts`, `log.test.ts`; ADR 0015 decision 2). The reviewer walks `DESIGN.md` section 11 for the one catalog line (parent "Lane", **Docs**).

## Acceptance criteria

The rows keep their ORV-159 numbers and their Test cells; rows 1 to 7, 12 and 13 (slice 2) and 15 to 19 (slice 4) stay in the ORV-159 spec (see "Out of scope"). "Operator" is the developer or agent who reads an outcome, a log line or a test. `<id>` is the request's id (ORV-141 `orv141-request-id`). A rule name in a row (`orv159-boundary`, `orv159-copy`, `orv159-account`) is defined once in the ORV-159 spec, "Rules and bounds". Each row's mutation is the one change to the code that must turn its test red (`.claude/rules/testing.md`, one mutation per clause, L-0042); the builder records each red run as one `verified` row.

<!-- prettier-ignore -->
| # | Given | When | Who sees what | Data effect | Test (mutation) |
| --- | --- | --- | --- | --- | --- |
| 8 | A signed-in person on `/directions`, Thai or English UI; the service throws `Denied(404, "not-a-member")` | They press "Save draft" / "บันทึกฉบับร่าง" | Person: a danger notice, badge "Not done" / "ทำไม่สำเร็จ", line English "This workspace was not found in your account. Sign in again on the Account page to open a workspace you belong to." / Thai "ไม่พบเวิร์กสเปซนี้ในบัญชีของคุณ ลงชื่อเข้าใช้อีกครั้งที่หน้าบัญชีเพื่อเปิดเวิร์กสเปซที่คุณเป็นสมาชิก", no reference line. Operator: the outcome is `{ ok: false, error: "workspace-not-found", code: "NOT_FOUND", requestId: <id>, retryable: false }`; one boundary line `{ level: "info", outcome: "refused", reason: "workspace-not-found" }` (`orv159-boundary`, `orv159-copy`) | None | `apps/web/app/directions/actions.test.ts` lines 300 and 394 arrange `Denied(404, "not-a-member")` and expect this outcome and line; `apps/web/app/directions/studio-calls.test.ts`, new "a workspace-not-found failure shows its line and no reference"; `apps/web/i18n/wait.test.ts` lines 72 to 78 gain `NOT_FOUND` among the codes with no reference line. Mutation: `run` maps status 404 to `forbidden` |
| 9 | The service throws `Denied(403, "no-workspace")`, then `Denied(403, "role-too-low")` | A person saves | Person: today's line, English "This account is not allowed to do this in this workspace." / Thai "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้". Operator: `error: "forbidden"`, `code: "FORBIDDEN"`, `retryable: false` for both | None | `actions.test.ts`, "each reason maps to its code": its table goes from 17 to 18 cases (line 500) with the `workspace-not-found` case and keeps the `role-too-low` case (line 426); a new case beside it, "a workspace id the session lacks stays forbidden", arranges `Denied(403, "no-workspace")`. Mutation: `run` maps a 403 `Denied` to `workspace-not-found` |
| 10 | The service throws `Denied(401, "no-session")` | A person saves | Operator: `error: "signed-out"`, `code: "UNAUTHENTICATED"` as today | None | `actions.test.ts`, today's case at line 515. Mutation: `run` maps 401 to `workspace-not-found` |
| 11 | `listDirections` returns the outcome of row 8 while `/directions` renders | The page loads, Thai or English | Person: the Studio with the danger notice of row 8 and no reference line | None | New `apps/web/app/directions/page.test.tsx`, which renders `DirectionsPage` with `listDirections` mocked (tech notes T3), "the first notice from the page names a missing workspace". Mutation: `directions/page.tsx` treats `workspace-not-found` as `signed-out` |
| 14 | A signed-in person whose `withWorkspace` call on `/account` throws `Denied(404, "not-a-member")`, then `Denied(403, "no-workspace")` | `/account` renders, Thai or English | Person: today's signed-out view: heading "Account and workspace" / "บัญชีและเวิร์กสเปซ", line "Sign in with your Google account; the first time, your own workspace is created for you." / "ลงชื่อเข้าใช้ด้วยบัญชี Google แล้วระบบจะสร้างเวิร์กสเปซของคุณเองให้ในครั้งแรก", button "Sign in with Google" / "ลงชื่อเข้าใช้ด้วย Google" (`orv159-account`) | None | `apps/web/app/account/page.test.tsx`, new "a denied workspace shows the sign-in view" with both throws. Mutation: `page.tsx` line 46 rethrows a `Denied` |
| 20 | The new key of `orv159-copy` in `apps/web/i18n/messages.ts` | `pnpm test` and `pnpm typecheck` run | Operator: both pass: the Thai and English trees have the same key paths and no middot or em dash | None | `apps/web/i18n/messages.test.ts` (today's); `pnpm typecheck` |

Notes on the rows (no row above is changed by them):

- **Line numbers.** The rows' line numbers and case counts are the parent's, at `develop` `eeb2e71`. PR 141 (ORV-121, the AI spend cap) merged first, as `739ee3b`, so tech notes section 6 applies to this slice: it gives the counts after PR 141 (`ActionError`, `REASONS`, the table of row 9) and two more edits in `actions.test.ts` (the fake spend cap check and the "AI reading needs a workspace the person belongs to" case). The builder and QA find every line by its text, not its number. For orientation only, on `develop` `7d04e4a`, by `grep -n`: `actions.ts` `| "forbidden"` at line 51, `forbidden: "FORBIDDEN"` at line 162 and the `Denied` map at lines 232 to 233; `log.ts` `"forbidden",` at line 51 and `log.test.ts` at line 76; in `actions.test.ts`, row 8's lines 300 and 394 are lines 377 and 471, row 9's case table is declared at line 485 and counted at lines 590 to 591, its `role-too-low` case arranges at line 503, row 10's 401 case is at line 606, and the fake check's non-member throw is at line 122; `wait.test.ts` `"FORBIDDEN"` at line 74; `messages.ts` `forbidden` at line 151 (Thai) and line 337 (English); `account/page.tsx` line 46 is unchanged.
- **Mutations per clause.** Rows 8 and 14 hold more than one clause; tech notes section 5 gives each clause its own mutation (8a to 8g, 14a, 14b), and row 20 two (20a, 20b). QA records each red run.

## Rules and bounds

The rules these rows test are defined once, in the ORV-159 spec, "Rules and bounds": `orv159-boundary` (rows 8, 9, 10), `orv159-copy` (rows 8, 20) and `orv159-account` (row 14). Their worked examples ("Reason to status to outcome", "The counts that change") are in the parent spec, "Worked examples"; tech notes section 6 says which counts move after PR 141. This file defines no rule of its own; a change to a rule is made in the parent spec first.

## Worked examples

Each line is written from its source and was not run in this task (no shell); the main session runs them from the repository root.

- **The rows the recorder reads.** Method: `specRows` in `scripts/ovl/result-recorder.mjs` (lines 106 to 121, as `docs/specs/ORV-167/spec.md` describes it): the first line matching `^\|\s*#\s*\|`, then each following line that starts with `|`, cells split on `|`, cell 1 kept when it is digits. Input: this file. No row of this table holds an escaped pipe, so each row splits into six cells. No rounding.

  ```bash
  node -e 'const l=require("fs").readFileSync("docs/specs/ORV-169/spec.md","utf8").split("\n");const s=l.findIndex(x=>/^\|\s*#\s*\|/.test(x));const r=[];for (const x of l.slice(s+2)){if(!x.startsWith("|"))break;const c=x.split("|").slice(1,-1).map(y=>y.trim());if(/^\d+$/.test(c[0]))r.push(c)}console.log(r.map(c=>c[0]).join(" "));console.log(r.every(c=>c.length===6))'
  # expected:
  # 8 9 10 11 14 20
  # true
  ```

- **The rows match the parent cell for cell** (L-0016 guard metric). Method: the same row reader on both files, each copied row compared with the parent's row of the same number. Input: this file and `docs/specs/ORV-159/spec.md`. No rounding.

  ```bash
  node -e 'const rows=f=>{const l=require("fs").readFileSync(f,"utf8").split("\n");const s=l.findIndex(x=>/^\|\s*#\s*\|/.test(x));const m={};for (const x of l.slice(s+2)){if(!x.startsWith("|"))break;const n=x.split("|")[1].trim();if(/^\d+$/.test(n))m[n]=x}return m};const a=rows("docs/specs/ORV-169/spec.md"),p=rows("docs/specs/ORV-159/spec.md");console.log(Object.keys(a).every(n=>a[n]===p[n]))'
  # expected: true
  ```

## Out of scope

- The ORV-159 rows of the other slices, which stay in the ORV-159 spec: rows 1 to 7, 12 and 13 (slice 2, ORV-167, merged as `765e357`) and rows 15 to 19 (slice 4, Better Auth's organization paths, the staging probe and the ADR Additions).
- Slice 1 (the docs: K-0092, the parent spec, the tech notes), done under ORV-159.
- Everything the parent spec's "Out of scope" lists.

## Impact list

- **Code and tests**: the slice 3 files of the parent's "Slices" item 3 and "Impact list", and tech notes sections 3 and 6: `apps/web/app/directions/actions.ts`, `packages/auth/src/log.ts`, `packages/auth/src/log.test.ts`, `apps/web/i18n/messages.ts`, and the tests rows 8 to 11 and 14 name (`actions.test.ts`, `studio-calls.test.ts`, `wait.test.ts`, the new `apps/web/app/directions/page.test.tsx`, `apps/web/app/account/page.test.tsx`). No migration; `packages/auth/src/index.ts` unchanged.
- **Contract**: the server action outcome of `actions.ts` and `REASONS` of `log.ts`, as the parent's "Impact list" says; one catalog key.
- **Size**: about 140 lines by the parent's "Slices" item 3, about 160 by tech notes section 7 task 2; one PR.
- **`security` role** on the PR (`packages/auth/**`).

## Open questions

The parent's open questions 1 to 9 are decided (ORV-159 comment 10292) and are not reopened here. This slice raises no question of its own.

## Depends on

ORV-159 spec v1.2 (the parent: rules, worked examples, open questions 1 to 9, "Slices" item 3); ORV-159 comment 10292 (G1 and G2 under delegation); `docs/specs/ORV-159/tech.md` sections 3, 5 and 6 (and T1, T3, T5, T6 of section 1); ORV-167 (slice 2, merged as `765e357`; its `Denied(404, ...)` is what this slice's tests construct); PR 141 (ORV-121, merged as `739ee3b`); L-0016 (slice issue spec); ADR 0015 decisions 2, 7 and 10; ADR 0012 decision 4; ORV-144 spec (`orv144-codes`, `orv144-outcome`, `orv144-ui`).

## Changelog

- v1.0 (2026-10-30): first spec, ORV-159 slice 3 as its own issue (task ORV-169-spec-1), written from ORV-159 spec v1.2 (L-0016). Rows 8, 9, 10, 11, 14 and 20 copied word for word with their numbers and Test cells; no new requirement. Downstream to review: the ORV-169 Jira acceptance (these rows), the first builder envelope for ORV-169 (fact `test -f docs/specs/ORV-169/spec.md`, L-0016), and the parent's "Slices" item 3 and tech notes section 7 task 2, which do not yet name ORV-169.
