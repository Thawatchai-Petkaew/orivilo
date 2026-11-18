---
issue: ORV-271 (https://tpetkaew.atlassian.net/browse/ORV-271)
lane: S (no risk flag: one build setting, no schema, token, component API, resolver or data access)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-271: the repo pins the Node line of apps/web to 22.x

## Goal

This is not a hook on a tool call, so the guard frame of L-0012 does not apply.

The staging live check of ORV-266 (comment 10627) found the Vercel project of `apps/web` building on Node 24.x until the owner set 22.x in the project settings on 2026-11-07. The repo itself says 22: `.nvmrc` holds `22`, which CI reads (`.github/workflows/ci.yml` line 39, `migrate.yml` line 35), and the root `package.json` carries `"engines": { "node": ">=22.23.0 <23" }`. But Vercel builds `apps/web` from its own directory (the `ignoreCommand` of `apps/web/vercel.json` walks up with `../../`), and `apps/web/package.json` carries no `engines`. So the Node line of staging lives only in a dashboard setting that the repo does not show and a review cannot see.

After this story the Node line of `apps/web` is written in the repo by `node-line-1`, so staging builds on the line CI tests on, whatever the dashboard says.

What is real: this is one field in one `package.json`. Nothing is AI, nothing is simulated, and nothing renders, so no Thai or English copy changes. The project setting is already 22.x, so row 2 shows staging runs Node 22 with the pin in place; it does not show the pin winning over a different setting (Out of scope).

## Rules and bounds

### node-line-1

`apps/web/package.json` carries `"engines": { "node": "22.x" }`, and no other field of the file changes. Its major, 22, is the major of `.nvmrc` and the only major the root range `>=22.23.0 <23` allows. No other file of the repo changes its Node line in this story.

## Acceptance criteria

Every row renders nothing: the checks are a file read, the diff and a build log.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The PR head | `apps/web/package.json` is read | No UI | `node-line-1` holds | `node -p "require('./apps/web/package.json').engines.node"` prints `22.x`; `git diff --stat origin/develop` lists only `apps/web/package.json` and this spec; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass on the head |
| 2 | The PR is in a release, `develop` into `main`, and Vercel has built `main` for staging | The build log of that staging deployment is read | No UI | The log names Node 22 as the version the build ran on, and no 24 | Checked after the release by the owner or the main session, not by qa at G3: the Vercel build log of the first staging deployment that holds the PR's commit, with its deployment id and the line that names the Node version, quoted in a Jira comment on ORV-271 |

## Rows per PR

- PR 209: rows 1

## Rows that render nothing

- Rows: 1-2

The story changes one build field. Row 1 is a file read, the diff and the gate; row 2 is a Vercel build log.

## Out of scope

- Setting the Vercel project back to 24.x to show that the pin wins over the dashboard. The owner owns the project settings, and staging stays on 22.x.
- Removing or changing the Node.js version in the Vercel project settings.
- The Node 24.x of ADR 0019 decision 5, which belongs to the renderer slice. If that slice moves `apps/web` to 24.x, its own spec changes `node-line-1` and bumps this spec's version.
- `engines` in any other workspace package, `.nvmrc`, the root `package.json`, the CI workflows, and `engine-strict` in pnpm.
- Production. A git tag, the owner's, deploys it; it gets the pin when the tag holds this commit.

## Open questions (with defaults)

1. **The form of the pin.** Default: `22.x`, the form the issue names, which Vercel reads as one major. Option: the root's `>=22.23.0 <23`, which also allows only 22 but sets a minor floor; the builder takes it only if row 2's log shows Vercel rejects `22.x`.

## Depends on

- ORV-266 comment 10627 and ADR 0019, section "Addition 2026-11-07" (the Node line: staging ran 24.x until the owner set 22.x) and decision 7 (the route runs the repo's Node 22.x).
- ADR 0016: Claude merges the release PR from `develop` into `main` on green checks, which is when row 2 can be read.

## Changelog

- v1.0 (2026-11-08): first version. Task `ORV-271-spec-1`. Downstream to review: the builder envelope (row 1), and the qa envelope once "Rows per PR" names the PR number.
