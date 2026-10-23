# ADR 0011: develop parks merged work; staging moves in batches

- Status: accepted
- Date: 2026-10-23
- Decided by: GOLF (owner) in the project thread on 2026-10-23: review on local, park merged work without deploying, and move it to staging when the owner says so, or when Claude proposes a finished batch (an epic, or a set of related stories) and the owner agrees. ORV-69
- Supersedes: decision 2 of ADR 0010 ("Who moves work between them"). The environment names, service names, variables and URLs of ADR 0010 stand.

## Context

Under ADR 0010 every PR built a preview and every merge into `main` built staging. On the Vercel free plan (100 deploys a day over the last 24 hours) that ran out on 2026-10-23. The owner now reviews each change on their own machine, so a preview per PR and a staging build per merge pay for reviews that already happened.

## Decision

1. **`develop` parks merged work.** Story PRs merge into `develop` once the full gate and CI are green; Claude merges them. Vercel builds nothing for `develop` (`scripts/vercel-ignore.sh`).
2. **Review happens locally.** The owner pulls `develop` (or the PR branch) and runs Storybook on `localhost:6100` and the app on `localhost:3000`. Vercel previews are off by default; a commit whose message contains `[preview]` builds one.
3. **Staging moves in batches.** A release PR from `develop` into `main` moves everything parked to staging. It opens when the owner says so, or when Claude proposes a finished batch with its list of stories and the owner agrees. Claude merges it only after that yes.
4. **Production is unchanged:** a `v*` tag the owner approves at G5, after ORV-63.
5. CI runs on every PR and on pushes to `main` and `develop`. Staging migrations still run on a push to `main`.

## Consequences

- Staging deploys about twice per batch instead of twice per story.
- `main` changes only through release PRs, so a hotfix also goes through `develop` unless the owner says otherwise.
- `develop` and `main` must not drift: a release PR is a plain merge of `develop`, and nothing merges into `main` from elsewhere.
- The owner may set `develop` as the GitHub default branch so new PRs target it.
