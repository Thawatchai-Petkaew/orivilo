---
issue: ORV-103 (https://tpetkaew.atlassian.net/browse/ORV-103)
lane: S
version: 1
---

## Why

Since PR #92, both Vercel checks fail on every PR with "Deployment rate limited, retry in 24 hours". Each merge then needs a waiver file that the owner writes from a terminal.

`scripts/vercel-ignore.sh` already skips preview builds, but that does not stop the limit. The Hobby plan counts a deployment when it is created, and that happens before the ignore step runs.

Vercel's Git configuration docs (https://vercel.com/docs/project-configuration/git-configuration) give two rules this fix relies on:

- `git.deploymentEnabled` matches branches with minimatch patterns.
- When a branch matches several rules, it deploys if any matching rule is `true`.

## Acceptance criteria

| #   | Given                                                           | When                 | Result                                                                                                                      |
| --- | --------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | `apps/web/vercel.json` and `packages/design-system/vercel.json` | They are read        | Both parse as JSON and carry `"git": { "deploymentEnabled": { "**": false, "main": true } }`. `ignoreCommand` is unchanged. |
| 2   | This issue's PR                                                 | Its branch is pushed | No new Vercel deployment and no new Vercel check on that head                                                               |
| 3   | The next release PR into `main`                                 | It merges            | Staging deploys as before (checked at that release, `owner_verify` until then)                                              |

## Out of scope

- Production deploys on a tag (ORV-63).
- Removing `vercel-ignore.sh`, which still skips a `main` push that changes nothing for the project.

## Changelog

- v1 (2026-10-25): first spec.
