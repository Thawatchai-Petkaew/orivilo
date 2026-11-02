---
issue: ORV-214 (https://tpetkaew.atlassian.net/browse/ORV-214)
lane: S (a chore with no risk flag); `.github/workflows/ci.yml` is a guard file, so the merge into `develop` needs the owner approval record (see "Merge")
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-214: Pin the CI runner to ubuntu-24.04

## Goal

The `check` job in `.github/workflows/ci.yml` runs on `ubuntu-latest` (line 17). GitHub now resolves
that label to Ubuntu 26.04, and the step
`pnpm --filter @orivilo/design-system exec playwright install chromium` (line 57) fails there with
"Playwright does not support chromium on ubuntu26.04-x64" (PR 180, run 41380315247, failed twice).
Every PR and every push to `develop` and `main` now fails CI, and ADR 0016 lets Claude merge the
staging release PR only with a passing `CI` check, so delivery is stopped.

The owner approved pinning the runner to `ubuntu-24.04` on 2026-11-02 (recorded in the ORV-214
description). This is a stopgap: the job moves back to `ubuntu-latest` once the Playwright version
the lockfile pins supports Ubuntu 26.04 (follow-up below).

## Rules

- `runner-pin-1`: the `check` job's `runs-on` is exactly `ubuntu-24.04`. No other key, step, cache
  key or version in `ci.yml` changes in this PR.

## Acceptance criteria

The change has no UI, so no AC names user-facing copy in Thai or English.

<!-- prettier-ignore -->
| # | Given | When | What the user sees | Data effect |
| --- | --- | --- | --- | --- |
| 1 | `.github/workflows/ci.yml` on this branch | a reader opens the `check` job | `runs-on: ubuntu-24.04` on line 17, as `runner-pin-1` sets | none |
| 2 | the PR diff against `develop` | a reviewer reads `git diff origin/develop -- .github/workflows/ci.yml` | one changed line, the `runs-on` value, and no other hunk (`runner-pin-1`) | none |
| 3 | the PR for ORV-214 is open | the `CI` workflow runs on its head | the job log's "Set up job" step names the image Ubuntu 24.04, and the step `playwright install chromium` passes | the Playwright browser cache entry is written or restored as before |
| 4 | the same CI run | it reaches the end of the job | every step after the install (`pnpm test --continue`, `pnpm build`, `pnpm audit --prod --audit-level high`) runs, and the `CI` check is green | none |
| 5 | the follow-up issue exists | a reader opens it | it names the condition to revert (the pinned Playwright lists Ubuntu 26.04 as supported) and the change (`runs-on` back to `ubuntu-latest`) | a Jira issue linked to ORV-214 |

AC 3 and 4 are proved by the CI run on the PR head, not by a local run: a local `pnpm` gate cannot
show which runner image GitHub uses.

## Merge

`ci.yml` is a guard file. The merge into `develop` through `merge-guard` needs
`.orivilo/owner-approvals/<n>.json` for the PR head, written by the owner from a terminal outside
Claude Code with the line in `.claude/skills/ovl/SKILL.md` ("Owner approval"). No Claude session
writes it. A new push needs a new approval.

## Follow-up

Open a Jira chore, linked to ORV-214: move `runs-on` back to `ubuntu-latest` once the Playwright
version in `pnpm-lock.yaml` supports chromium on Ubuntu 26.04. Until then the pin stays. The main
session creates the issue; this spec does not.

## Out of scope

- Any other change to `ci.yml` (cache key, timeout, `--with-deps`, Node version, service image).
- A Playwright version bump, or any other dependency change.
- Other workflows in `.github/workflows/`.

## Open questions (with defaults)

1. The cache key `playwright-${{ runner.os }}-...` reads `runner.os`, which is `Linux` on both
   images, so a cache saved on one image can restore on the other. Default: leave it (out of scope);
   the install failed on 26.04, so no 26.04 browser was saved, and the install step still runs after
   the restore.

## Rows per PR

Filled in by the main session.

## Decisions this relies on

- Owner approval of the pin, 2026-11-02, ORV-214 description.
- ADR 0016 (`docs/adr/0016-claude-releases-to-staging.md`): the release PR merges on a passing `CI`
  check.
- ADR 0012 and `AGENTS.md` "Lanes and gates": lane S, G3 passed by Claude with evidence, G5 the
  owner's.

## Changelog

- v1.0 (2026-11-02): first version, task ORV-214-spec-1.
