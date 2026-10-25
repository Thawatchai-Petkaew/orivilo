# ADR 0016: Claude releases to staging on green checks

- Status: accepted, 2026-10-25
- Date: 2026-10-25
- Decided by: the owner chose option A on ORV-115 (comment 10169): Claude merges a staging release once every check is green, with no approval record. The decisions after it (Claude may also open the release PR, `merge-guard` refuses `--squash` and `--delete-branch` on a merge into `main`, a renamed file counts by its new path) were posted on the same issue.
- Builds on: ADR 0010 (environments), ADR 0013 (the `/ovl` orchestrator). Neither is superseded.
- Amends: ADR 0011 decision 3 (who opens and merges the release PR) and ADR 0012 (Staging is entered by the release merge, now without an owner yes). ADR 0011 and ADR 0012 are decided and are not rewritten; their text stands for everything not named here.

## Context

Release PR #102 (`develop` into `main`) could not merge through `merge-guard`:

1. `merge-check` asked for `.orivilo/owner-approvals/102.json`, which only the owner can write from a terminal. A release PR has no issue key, so the main session files no gate record for it either.
2. `readPr` read the changed files through `gh pr view --json files`, which stops at 100. PR #102 has 117 files, so `merge-check` failed closed.

Merging into `main` deploys staging only (ADR 0011, ORV-103). A `v*` tag deploys production (ORV-63). CI already runs the full gate on the PR, so its green checks are the release's gate evidence.

`merge-guard` is a guard rail for agents that follow the rules, not a boundary (ORV-95 comment 10109, lesson L-0012). Nothing outside the session enforces these rules, because GitHub rulesets return HTTP 403 on this plan (ORV-97).

## Decision

1. **Claude merges the staging release PR on green checks.** A PR with base `main` and head `develop` merges through `merge-guard` when every check passes, one of them is a check of the `CI` workflow, and the head matches. It needs no owner approval record, no gate record, no `qa.json` and no reviewer result. No checks, a failing or pending check, or no passing `CI` check blocks it, and so does any head other than `develop`.
2. **Claude may also open the release PR** when `develop` holds a finished batch. This replaces "opens when the owner says so" in ADR 0011 decision 3.
3. **A merge into `main` is a merge commit that keeps `develop`.** The form is `gh pr merge <n> --merge --match-head-commit <sha>`. The text stage of `merge-guard` refuses `--squash` and `--delete-branch` there, because a squash lets `develop` and `main` drift and `--delete-branch` would delete `develop`.
4. **Guard files keep the owner record on the way into `develop`.** A PR into `develop` that changes `scripts/ovl/`, `.claude/hooks/`, `.claude/settings.json` or `.github/workflows/` still needs `.orivilo/owner-approvals/<n>.json`. The release PR does not ask again, because each guard file was judged when its own PR merged into `develop`. The owner waiver for a rate-limited Vercel check stays owner-only.
5. **The full file list is read.** `merge-check` reads the changed files from `gh api repos/{owner}/{repo}/pulls/<n>/files --paginate` and fails closed when the count differs from `changedFiles`. A renamed file counts by its new path only.
6. **Production stays the owner's.** No tag, no `gh release create`, no production deploy, no G5. `merge-guard` keeps blocking all of them.

## Consequences

- A release to staging no longer waits for the owner. The owner still sees every batch in the PR and on staging, and keeps G5.
- The only gate on a release is CI. A change that CI does not cover reaches staging. Each PR was already judged at its own G3 merge into `develop`.
- `merge-guard` reads the PR base with one `gh pr view` for a merge that names `--squash` or `--delete-branch`. It needs the network and fails closed when the base cannot be read.
- AGENTS.md rule 5, the `ovl` skill (section 6 and its honest limits) and spec ORV-95 (via spec ORV-115) agree with this ADR.

Confirmation: `scripts/ovl/merge-check.test.mjs` (the release rows: green CI allows with no record, a failing, pending or missing check blocks, a non-`develop` head blocks, a guard-file PR into `develop` still needs the record), `scripts/ovl/merge-check-facts.test.mjs` (117 files over two pages, a count mismatch and a bad `gh api` answer fail closed) and `scripts/ovl/merge-guard.test.mjs` (`--squash` and `--delete-branch` into `main` block, tag pushes and `gh release create` block) fail in `pnpm test:scripts` and in CI when the rule is broken. The guard is a rail, not a boundary, so these tests do not prove that no session can merge or tag by another route; follow-up: ORV-97 (rulesets) and ORV-96 (forged records).
