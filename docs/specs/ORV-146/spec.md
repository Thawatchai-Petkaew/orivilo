---
issue: ORV-146 (https://tpetkaew.atlassian.net/browse/ORV-146)
lane: S (loop tooling: guard scripts, their tests and the ovl skill; no product code, no contract of the app)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
built_in: PR 145, head `99f2bd8`
---

# ORV-146: parallel issue worktrees, review by size, one review round

## Acceptance criteria

| #   | Owner point (ORV-146 comment 10275)                                              | Rules                                 | Done when                                                                                                                                        | Test file                                                                    |
| --- | -------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | Several issues at once, each in its own git worktree                             | `worktree-place-1`, `open-envelope-1` | `node --test scripts/ovl/envelope-guard.test.mjs scripts/ovl/records-root.test.mjs` passes                                                       | `scripts/ovl/envelope-guard.test.mjs`, `scripts/ovl/records-root.test.mjs`   |
| 2   | Review by size: test files and docs need no qa; an approve survives a base merge | `test-file-1`, `approve-carry-1`      | `node --test scripts/ovl/merge-check.test.mjs scripts/ovl/merge-check-facts.test.mjs` passes                                                     | `scripts/ovl/merge-check.test.mjs`, `scripts/ovl/merge-check-facts.test.mjs` |
| 3   | One review round, written in the ovl skill with points 1 and 2                   | `one-round-1`                         | `grep -c -e "One review round (ORV-146):" -e "Review by size (ORV-146):" -e "Parallel issues (ORV-146):" .claude/skills/ovl/SKILL.md` prints `3` | None, a text rule; the grep is the check                                     |

What each row's tests prove, on `99f2bd8`:

- Row 1: the tests named "ORV-146" in `scripts/ovl/envelope-guard.test.mjs` (lines 663 to 958) and the `worktreesOf` tests in `scripts/ovl/records-root.test.mjs` (lines 59, 71 and 77). An issue-role envelope into a worktree that `worktree-place-1` accepts exits 0, and each case it refuses exits 2. Each case that `open-envelope-1` blocks exits 2, a bound open envelope of the same role on another issue does not block, and of two same-role calls made at the same moment at most one runs.
- Row 2: the tests named "ORV-146" in `scripts/ovl/merge-check.test.mjs` (lines 322 to 654, and the two CLI tests on a real repo at lines 839 and 843) and in `scripts/ovl/merge-check-facts.test.mjs` (lines 267 to 364). A PR that `test-file-1` classes as test files and docs passes with no `qa.json` and still fails with no reviewer approve or no gate record; one file outside the class keeps the qa; a reviewer or qa approve carries as `approve-carry-1` states, and the gate record and the owner approval do not carry.
- Row 3: the three lines are the "One review round", "Review by size" and "Parallel issues" bullets of section "POC mode" (lines 68, 71 and 73). Section 6 holds the paragraphs "Test-only and docs PRs" and "An approve across a merge of `develop`" (lines 403 and 405). No test reads the skill text; no hook checks it.

## Why

On 2026-10-29 the owner approved, through the question form recorded as ORV-146 comment 10275, three changes that make the delivery loop faster during the POC: work on several issues in parallel, skip the qa pass where a PR cannot change behavior, and stop review ping-pong after one round. Rows 1 to 3 of the table above are those three points, one row each.

Frame (L-0012): `envelope-guard` (judges the Agent tool call and its envelope JSON) and `merge-check` (judges the `gh pr merge` Bash call) are guard rails for agents that follow the rules, not a boundary. A session without these hooks escapes both (`.claude/skills/ovl/SKILL.md`, "Honest limits"). The forms a rule-following agent uses, which the guards must judge: an Agent call whose prompt is one envelope JSON (SKILL.md section 2), and `gh pr merge <n> --squash --delete-branch --match-head-commit <40-hex sha>` (SKILL.md section 6). Nothing here is simulated or mocked; the tests build real git repositories through `scripts/ovl/hook-test-kit.mjs`.

Decisions it depends on: `docs/adr/0012-jira-states-by-environment.md` decision 4 (the owner's delegation), the POC mode section of `.claude/skills/ovl/SKILL.md` (ORV-137), and ADR 0013 (the qa approve on a code PR).

## Rules

### worktree-place-1

For the issue roles (builder, reviewer, qa, designer, security), `envelope-guard` accepts an envelope `worktree` only when it is a git worktree of this repo (as `worktreesOf` in `scripts/ovl/records.mjs` lists them), it is the main working tree or sits directly under `<main>/.claude/worktrees/<name>`, and its own branch, read from that worktree and not from the session checkout, carries the envelope `issue` key (`<type>/ORV-<n>-<slug>`). A path that is no worktree of this repo, a worktree elsewhere, a worktree nested below `.claude/worktrees/<name>`, a detached head and a branch with no key are blocked. When the call gives `cwd`, it must equal the envelope `worktree`. The other roles keep the rule that the worktree is the session checkout.

### open-envelope-1

One envelope per role and issue is open across the repo, worktrees included. A dispatch is also blocked while an envelope of the same role, of any issue, is open and has no `agent.json` (not yet bound), because the start hook binds a starting subagent to the one open unbound envelope of its role. A bound open envelope of the same role on another issue does not block. The check runs again after the envelope is saved, so two same-role calls made at the same moment never both run.

### test-file-1

A test file is a path whose basename ends in `.test.ts`, `.test.tsx`, `.test.js`, `.test.mjs`, `.test.cjs`, `.test.mts` or `.test.cts`, holds no `.stories.` segment, and is not under `.orivilo/` or `.quality-gate/`. Docs are any path under `docs/`, or a `.md` outside `packages/`, `apps/`, the record folders and the guard paths. When every file of the PR is a test file or docs (and the list is not empty), `merge-check` needs no `qa.json` and no screenshots; the reviewer approve on the head, the gate record for the head and green checks still apply, and a test file in a guard path still needs the owner approval record. A test-only PR under an auth or data-access path is in the class too.

### approve-carry-1

A reviewer or qa approve recorded on an older head counts for the current head when the older head is its ancestor, every commit between them that `origin/<base>` lacks is a merge commit, and the files that differ between the two include no file the PR changes now, changed at the older head, or was renamed from (`readBaseMerge` in `scripts/ovl/merge-check-facts.mjs`). Among the verdicts (`pickVerdict` in `scripts/ovl/merge-check.mjs`): the latest verdict on the exact head wins over any carried one, whatever the recording order. With none on the exact head, the latest carried verdict counts, except that a carried approve does not hold while another carried head holds a verdict that is not an approve. The gate record and the owner approval record stay bound to the exact head.

### one-round-1

The reviewer, and `qa` when the PR needs it, pass once on the head. A Suggestion never goes back to a builder: it becomes a follow-up Jira issue and is listed in the PR body. Only a Critical or Important finding goes back with `rework_of`, followed by one re-check.

## Decisions taken under the owner's delegation

- On ORV-146 (2026-10-29) the main session kept the qa skip for a test-only PR under an auth or data-access path (qa-1 finding F2; build-2 envelope fact citing ORV-146 comment 10275), as `test-file-1` states. A test file changes no runtime behavior, and no production file imports a test file (review-2, `git grep` exit 1).
- Build-2 made the last sentence of `approve-carry-1` stricter than SEC-2 asked (SEC-2 named only heads between the approved one and the current one), because `carriesOver` gives no ancestry between carried heads. It may block an approve re-given on a merge-only head after an older request for changes; the owner approval record is the way through.
- Under ADR 0012 decision 4. The owner can take either back at any time.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`. Each copies the method's logic from `scripts/ovl/merge-check.mjs` on `99f2bd8` (`isTestFile`, lines 139 to 146; `pickVerdict`, lines 59 to 72, with `latest` reduced to a sort on `recorded_at`), because neither function is exported.

1. `test-file-1` on the file names review-2 probed (`.orivilo/runs/ORV-146/ORV-146-review-2/result.json`), booleans with no rounding. Expected output: `true true true false false false false`.

   ```bash
   node -e 'const t=f=>{const b=f.slice(f.lastIndexOf("/")+1);return /\.test\.(?:ts|tsx|js|mjs|cjs|mts|cts)$/.test(b)&&!b.includes(".stories.")&&!/^(?:\.orivilo|\.quality-gate)(?:\/|$)/.test(f)};console.log(["a/b.test.ts","apps/web/app/page.test.tsx","a/x.stories.dir/b.test.ts","button.test.stories.tsx",".env.test.local","b.test.json",".quality-gate/x.test.ts"].map(t).join(" "))'
   ```

2. `approve-carry-1`, the verdict pick, on the SEC-2 cases of review-2 (head H; H0 and H1 carry, H2 does not). In order: request_changes on H at t2 with an approve on H0 at t3; request_changes on H1 at t1 with an approve on H0 at t2; an approve on H0 alone; an approve on H2 alone. Expected output: `request_changes request_changes approve undefined`.

   ```bash
   node -e 'const latest=a=>a.slice().sort((x,y)=>Date.parse(x.recorded_at)-Date.parse(y.recorded_at)).at(-1);const pick=(rs,h,c)=>{const on=rs.filter(r=>r.report?.head_sha===h);if(on.length>0)return latest(on);const ca=rs.filter(r=>typeof r.report?.head_sha==="string"&&c(r.report.head_sha));const b=latest(ca);if(b?.report.verdict!=="approve")return b;return ca.find(r=>r.report.head_sha!==b.report.head_sha&&r.report.verdict!=="approve")??b};const R=(h,v,t)=>({recorded_at:"2026-10-29T00:00:0"+t+"Z",report:{head_sha:h,verdict:v}});const c=h=>h==="H0"||h==="H1";const v=x=>x?x.report.verdict:"undefined";console.log([v(pick([R("H","request_changes",2),R("H0","approve",3)],"H",c)),v(pick([R("H1","request_changes",1),R("H0","approve",2)],"H",c)),v(pick([R("H0","approve",1)],"H",c)),v(pick([R("H2","approve",1)],"H",c))].join(" "))'
   ```

## Out of scope

Each is named in `.claude/skills/ovl/SKILL.md` "Honest limits" and not built here:

- `write-guard` does not compare a bound subagent's deliverable write with its envelope `worktree` (review-1 F3).
- `envelope-guard` does not require `cwd`; the Agent call in this session has none, so a cross-worktree subagent works by the absolute paths in its envelope (security-1 SEC-5).
- `result-recorder` `onStart` still binds by role alone; `open-envelope-1` makes the dispatch wait instead of choosing among candidates by `cwd` (build-1 `needs_decision`).

## Open questions (with defaults)

1. A follow-up issue for each item of Out of scope. Default: none is opened by this spec; the main session decides when it raises G3.

## Changelog

- v1.0: first version, written after the build from PR 145 head `99f2bd8` (build-1 on `4c0e7fc`, build-2 fixing review-1 F1 and F2 and security-1 SEC-1 to SEC-4; review-2 and security-2 approve on `99f2bd8`). Downstream to review: the PR 145 body (link this spec), and the G3 packet.
