# ORV-95 task 1: recorded gh samples for merge-check

Evidence for spec ORV-95 v1.1, row 43. Every value comes from a recorded run on a real PR unless a note says derived.

## How it was recorded

- Installed GitHub CLI: **gh 2.95.0** (2026-06-17), from `gh --version`.
- Repo: `Thawatchai-Petkaew/orivilo`, PR **#87** (merged into `develop`, 2026-10-24T12:38:13Z). It holds two Vercel checks that failed with a rate-limit text and a green Actions check, so it is the sample the spec names.
- Command 1: `gh pr view 87 -R Thawatchai-Petkaew/orivilo --json number,title,baseRefName,headRefName,headRefOid,files,changedFiles`, exit 0, saved to `scripts/ovl/fixtures/gh/pr-view.json`.
- Command 2: `gh pr checks 87 -R Thawatchai-Petkaew/orivilo --json name,state,bucket,description,link,workflow`, exit 0 (all checks had finished, and `gh pr checks` still exited 0 with failed checks in this run), saved to `scripts/ovl/fixtures/gh/pr-checks.json`.
- Both fixtures are **recorded**, not derived. Output was re-indented (2 spaces) and ends with a newline; no value was edited or redacted (no tokens or emails; the SHA, URLs and paths are public repo data).
- PRs #83 to #86 were also read with `--json name,bucket,state`: all their checks are `pass`, so none of them holds a rate-limited or skipped check. #87 is the only sample of a rate limit.

## `pr-view.json`

Top level (an object): `baseRefName`, `changedFiles`, `files`, `headRefName`, `headRefOid`, `number`, `title`. Keys come back sorted by name.

| Field          | Type   | Sample                                                                         |
| -------------- | ------ | ------------------------------------------------------------------------------ |
| `number`       | number | `87`                                                                           |
| `title`        | string | `ORV-93: improvement run (L-0010, L-0011), downstream specs, handoff and plan` |
| `baseRefName`  | string | `develop`                                                                      |
| `headRefName`  | string | `docs/ORV-93-improvement-and-docs`                                             |
| `headRefOid`   | string | 40-hex head SHA `59c1ed7d5079ed9f5e992bf02c9ef9af95f0e387`                     |
| `changedFiles` | number | `10`, equal to `files.length`                                                  |
| `files`        | array  | one object per changed file                                                    |

Each `files` entry: `path` (repo-relative, POSIX), `additions` (number), `deletions` (number), `changeType` (`MODIFIED` or `ADDED` in this sample).

Notes:

- `headRefName` here is `docs/ORV-93-improvement-and-docs`, form `<type>/ORV-<n>-<slug>` with type `docs`. The issue key is `ORV-93`, and the title starts `ORV-93:`.
- `files` has no rename source path field in this sample (no renamed file); a `RENAMED` entry's shape is not recorded.

## `pr-checks.json`

An array with one object per check, keys sorted by name: `bucket`, `description`, `link`, `name`, `state`, `workflow`.

<!-- prettier-ignore -->
| `name` | `bucket` | `state` | `workflow` | `description` | `link` |
| --- | --- | --- | --- | --- | --- |
| `check` | `pass` | `SUCCESS` | `CI` | empty string | `https://github.com/Thawatchai-Petkaew/orivilo/actions/runs/40094118817/job/120872851859` |
| `Vercel – orivilo` | `fail` | `FAILURE` | empty string | `Deployment rate limited — retry in 24 hours.` | `https://vercel.com/tawatchai-petkaews-projects?upgradeToPro=build-rate-limit` |
| `Vercel – orivilo-design-system` | `fail` | `FAILURE` | empty string | `Deployment rate limited — retry in 24 hours.` | `https://vercel.com/tawatchai-petkaews-projects?upgradeToPro=build-rate-limit` |

## What differs from the spec's assumptions

- **Check names (open question 7 context).** The Vercel checks are named `Vercel – orivilo` and `Vercel – orivilo-design-system`, with an **en dash** (U+2013) between `Vercel` and the project, not a hyphen. `name.startsWith("Vercel")` holds. The waiver's `checks` list must hold these names exactly, en dash included. `gh pr view --json statusCheckRollup` shows them as `StatusContext` entries (`context`, `state: FAILURE`), not `CheckRun` entries; `gh pr checks` normalises both into the same fields.
- **Rate-limit text (open question 7).** The description is `Deployment rate limited — retry in 24 hours.`: it starts with `Deployment rate limited` as the spec assumes, so rule (a) holds. It then continues with an **em dash** (U+2014) and a retry time (`24 hours`), so an exact-equality rule (b) would break on a different retry time. Keep (a), a `startsWith` rule. This text comes from Vercel, is untrusted, and is never echoed in full by the guard (row 35).
- **Skipped check (open question 8).** No recorded check is in bucket `skipping` or `cancel`, so no check routinely skips in PRs #83 to #87. Default (a) stands.
- **A check the spec does not mention.** PRs #83 to #86 also hold a `Vercel Preview Comments` check, bucket `pass`, state `SUCCESS`. PR #87 does not hold it. It passes, so the rule "every check has bucket `pass`" needs no change; a test that lists checks must not assume a fixed count.
- **Empty fields.** `description` and `workflow` are empty strings (not missing, not null) when they carry nothing. The Vercel checks have an empty `workflow`.
- **Exit code.** With the checks finished, `gh pr checks 87 --json ...` exited 0 even though two checks failed. The spec reads stdout whatever the exit code, so the reader stays valid; the non-zero exit for a failing or waiting check was not reproduced here.
- **`gh pr view` has no `comments` or owner login** in this selection, as v1.1 expects.
