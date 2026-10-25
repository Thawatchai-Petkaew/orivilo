---
issue: ORV-115 (https://tpetkaew.atlassian.net/browse/ORV-115)
lane: S
version: 1.1
---

# ORV-115: Claude merges the staging release on green checks

## Why

The release PR #102 (`develop` into `main`) cannot merge through `merge-guard` today, for two reasons:

1. `merge-check` asks for `.orivilo/owner-approvals/102.json`, which only the owner can write from a terminal.
2. `readPr` reads files through `gh pr view --json files`, which stops at 100. PR #102 has 117 files, so `merge-check` fails closed with "GitHub cut the file list of PR 102 (100 of 117 files)".

On 2026-10-25 the owner chose option A (ORV-115 comment 10169): Claude merges a staging release once every check is green, with no approval record. Production stays the owner's. Merging into `main` deploys staging only (ADR 0011, ORV-103). A `v*` tag deploys production (ORV-63).

A release PR has no gate record from the main session. Its head branch is `develop`, which names no issue key, so the session cannot file a gate record under any issue. CI already runs the full gate on the PR: format, commitlint, lint, both scans, typecheck, contrast, script tests, check:knowledge, tests, build and audit (`.github/workflows/ci.yml`). So the green CI checks are the release's gate evidence.

**Frame (L-0012).** `merge-guard` is a **guard rail for agents that follow the rules, not a boundary** (ORV-95 comment 10109). Nothing outside the session enforces the release rule or the production rule. GitHub rulesets return HTTP 403 on this plan (ORV-97), and the session's `gh` signs in with the owner's admin token. The guard must catch the forms that rule-following agents use, as written in the ovl skill and in AGENTS.md:

- `gh pr merge <n> --merge --match-head-commit <sha>` for the release PR. The ovl skill form `gh pr merge <n> --squash --delete-branch --match-head-commit <sha>` is the one for `develop`.
- `git push origin <tag>`, `git push --tags` and `git push origin refs/tags/<tag>`. The push rule already blocks all three.
- `gh release create`.

## Acceptance criteria

| #   | Given                                                                                                                                     | When                                                                                                                                                                                                | Result                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A PR with base `main`, head `develop`, every check `pass` including the `CI` workflow's check, and no `.orivilo/owner-approvals/<n>.json` | `merge-check <n> --head <sha>` runs                                                                                                                                                                 | Exit 0 with empty stderr. No gate record, qa.json or reviewer result is asked for                                                                                                                                                                                                                              |
| 2   | Same as 1, and the PR's files include guard files (`scripts/ovl/`, `.claude/hooks/`, `.claude/settings.json`, `.github/workflows/`)       | `merge-check` runs                                                                                                                                                                                  | Exit 0. Each guard file was judged when its own PR merged into `develop`                                                                                                                                                                                                                                       |
| 3   | A PR with base `main` and head `develop`, where one check is `fail` or `pending`                                                          | `merge-check` runs                                                                                                                                                                                  | Exit 2. stderr names `check "<name>" is <bucket>`. A rate-limited Vercel check passes only with the owner waiver file, as today                                                                                                                                                                                |
| 4   | A PR with base `main` and head `develop`, with no checks, or with no check from the `CI` workflow                                         | `merge-check` runs                                                                                                                                                                                  | Exit 2. stderr says `the PR has no checks` or `a release into main needs a passing CI check`                                                                                                                                                                                                                   |
| 5   | A PR with base `main` and a head other than `develop`                                                                                     | `merge-check` runs                                                                                                                                                                                  | Exit 2 with `only the release PR from develop goes into main`, even when an approval record exists                                                                                                                                                                                                             |
| 6   | A PR into `develop` that changes a guard file and has no approval record for its head                                                     | `merge-check` runs                                                                                                                                                                                  | Exit 2 with `the PR changes guard files (...): it needs .orivilo/owner-approvals/<n>.json for <sha>`. This is unchanged                                                                                                                                                                                        |
| 7   | A PR with 117 changed files across two pages                                                                                              | `readPr` reads it                                                                                                                                                                                   | `files` holds all 117 paths, read from `gh api repos/{owner}/{repo}/pulls/<n>/files --paginate`. `changedFiles` is 117                                                                                                                                                                                         |
| 8   | The paginated list has a different length from `changed_files` (GitHub stops at 3000, or a page is missing)                               | `readPr` reads it                                                                                                                                                                                   | It throws `FactsError` and `merge-check` exits 2 with `merge-check failed closed: GitHub cut the file list of PR <n> (<got> of <want> files)`                                                                                                                                                                  |
| 9   | `gh api` exits non-zero, or prints text that is not JSON, or prints an item with no string `filename`                                     | `readPr` reads it                                                                                                                                                                                   | It throws `FactsError` and `merge-check` exits 2, failing closed. stderr names the step only, never PR text                                                                                                                                                                                                    |
| 10  | Any session                                                                                                                               | It runs `git push origin v1.0.0`, `git push --tags`, `git push origin refs/tags/v1.0.0` or `gh release create v1.0.0`; or a merge of a PR whose base is `main` with `--squash` or `--delete-branch` | `merge-guard` exits 2. The tests pin these forms. A merge into `main` with `--merge` and no `--delete-branch` goes on to the records stage; a base that cannot be read fails closed                                                                                                                            |
| 11  | `AGENTS.md`, `.claude/skills/ovl/SKILL.md` and `docs/adr/0016-*.md`                                                                       | A reader opens them                                                                                                                                                                                 | Rule 5 says Claude merges the staging release PR when every check is green (ADR 0016), and never tags or deploys to production. The skill's "A merge into `main`" paragraph and its limits say the same. ADR 0016 amends ADR 0011 decision 3 and ADR 0012 for staging releases, and has a `Confirmation:` line |
| 12  | The PR for this issue                                                                                                                     | `pnpm lint && pnpm typecheck && pnpm test:scripts && pnpm check:knowledge && pnpm build` run                                                                                                        | All pass, and `node scripts/ovl/merge-check.mjs 102 --head <sha>` no longer fails on the file count                                                                                                                                                                                                            |

## Rules and bounds

- `releaseProblems` keeps the head check and `checkProblems`, adds "a passing check whose `workflow` is `CI`", and drops the approval check. No gate record is read for `main`.
- `readPr` keeps `gh pr view` for `number`, `title`, `baseRefName`, `headRefName`, `headRefOid` and `changedFiles`, and drops `files` from its fields. It reads paths from `gh api repos/{owner}/{repo}/pulls/<n>/files --paginate --slurp`, flattens the pages and maps `filename`. A length different from `changedFiles` fails closed, whether it is longer or shorter.
- The owner waiver for a rate-limited Vercel check stays owner-only, for `main` and for `develop`.
- This PR changes guard files (`scripts/ovl/merge-check.mjs`, `scripts/ovl/merge-check-facts.mjs`, `scripts/ovl/merge-guard.mjs`), so its merge into `develop` needs the owner approval record. The new release rule takes effect only once it is on `develop`, because the records stage runs from develop's export.
- Production stays the owner's: no tag, no `gh release create`, no production deploy.

## Files touched

- Guard files: `scripts/ovl/merge-check.mjs`, `scripts/ovl/merge-check-facts.mjs`, `scripts/ovl/merge-guard.mjs`.
- Tests: `scripts/ovl/merge-check.test.mjs` for rows 1 to 6, `scripts/ovl/merge-check-facts.test.mjs` for rows 7 to 9, and `scripts/ovl/merge-guard.test.mjs` for row 10 (the tag forms it did not pin and the merge flags into `main`).
- Docs: `AGENTS.md` rule 5, `.claude/skills/ovl/SKILL.md` (the merge section and its honest limits: the docs-only line, the approval line and the "file list GitHub cut" line), and the new `docs/adr/0016-claude-releases-to-staging.md`.

## Out of scope

- Production tags and releases (ORV-63).
- GitHub rulesets (ORV-97) and making the owner records impossible to forge (ORV-96).

## Open questions (decided)

1. Does option A also let Claude open a release PR without asking? **Yes** (decided after comment 10169). Claude may open and merge the release PR. ADR 0016 decision 2 replaces "opens when the owner says so" in ADR 0011 decision 3.
2. The records stage cannot see the merge flags. Should `--delete-branch` and `--squash` be blocked on a merge into `main`? **Block now.** `merge-guard` reads the PR base with one `gh pr view` for a merge that names either flag, after the export stage's URL check and before the records stage, and refuses both when the base is `main`. A base it cannot read fails closed. Every other command stays free of network calls in the text stage.
3. Should a renamed file's `previous_filename` count toward the guard-file check? **Default: no**, to keep parity with `gh pr view`, which shows the new path only.

## Decisions it depends on

ADR 0011 (develop parks work), ADR 0012 (Jira states, who passes each gate), ADR 0016 (new, this story, `docs/adr/0016-claude-releases-to-staging.md`), ADR 0015 (`Confirmation:` line), spec ORV-95 (merge-guard), ORV-103 (Vercel deploys `main` only), lesson L-0012 (the guard frame).

## Changelog

- v1 (2026-10-25): first spec.
- v1.1 (2026-10-25): open questions decided (Claude may open the release PR, block `--squash` and `--delete-branch` into `main` now, rename default kept); `merge-guard.mjs` joins the guard files; the ADR file is `0016-claude-releases-to-staging.md`.
