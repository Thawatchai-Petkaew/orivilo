---
issue: ORV-277 (https://tpetkaew.atlassian.net/browse/ORV-277)
lane: S (chore, no risk flag; a security review runs before merge)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-277: one dated audit exception for GHSA-fc5q-39xc-vjpf (picomatch)

## Goal

This is not a hook on a tool call, so the guard frame of L-0012 does not apply.

`pnpm audit --prod --audit-level high` is blocking in the quality gate and in CI (ADR 0015 decision 1, `.github/workflows/ci.yml` line 60). On `develop` b52f81a it fails on one high advisory: GHSA-fc5q-39xc-vjpf, a ReDoS in picomatch, vulnerable versions `<=4.0.7`, patched versions `<0.0.0`, path `apps__web>better-auth>vitest>picomatch`. The latest picomatch release is 4.0.7, so no upgrade can clear it. While it stands, every PR's gate is red.

After this story the audit configuration ignores this one advisory by `audit-exception-1`, and the blocking step passes. Any high advisory whose id is not on the ignore list still fails the step.

What is real: this accepts a known high advisory for now. It is not a fix, and it does not claim the advisory is harmless in general. The claim is narrower: in this repo picomatch is reached only through the test runner vitest as a peer of better-auth, the app never calls it at run time, and no user input reaches it. Nothing renders, so no Thai or English copy changes.

## Rules and bounds

### audit-exception-1

The pnpm audit ignore list holds exactly one id, `GHSA-fc5q-39xc-vjpf`, and no CVE id or other GHSA id. In the same file, directly beside the entry, the repo records the date `2026-11-18`, the reason (reached only through vitest as a peer of better-auth, never called by the app at run time, no user input reaches it) and the removal condition (a patched picomatch release exists, or better-auth no longer resolves vitest in the production graph). No dependency, version range or lockfile line changes, and the audit command and its level stay as they are.

## Acceptance criteria

Every row renders nothing: each check is a command run on the PR head.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The PR head after `pnpm install` | The blocking audit runs | No UI | None | `pnpm audit --prod --audit-level high; echo "exit=$?"` prints `exit=0` |
| 2 | The PR head | The audit runs without a level | No UI | None | `pnpm audit --prod` still prints its advisory count line and the remaining moderate advisories; no advisory block names `GHSA-fc5q-39xc-vjpf`; and the summary line counts it as ignored, `Severity: 3 moderate \| 1 high (1 ignored)` |
| 3 | The PR head | The audit config is searched | No UI | `audit-exception-1` holds: one id | `git grep -n -e "GHSA-" -e "CVE-" -- package.json pnpm-workspace.yaml` shows only lines that name `GHSA-fc5q-39xc-vjpf`, and the ignore list has one entry |
| 4 | The PR head | The file that holds the ignore entry is read | No UI | `audit-exception-1` holds: the record | `git grep -n "2026-11-18" -- package.json pnpm-workspace.yaml` hits the line beside the entry, and the lines there state the reason and the removal condition |
| 5 | The PR head | The diff against `origin/develop` is read | No UI | No dependency change | `git diff --stat origin/develop` lists only the audit config file and this spec; `git diff origin/develop -- pnpm-lock.yaml '**/package.json'` shows no dependency or version line |
| 6 | The PR head | The full gate runs | No UI | None | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass, the quality gate's audit step passes, and the CI audit step is green |

## Rows that render nothing

- Rows: 1-6

The story changes one audit setting. Every row is a command, a search or the diff.

## Out of scope

- Upgrading better-auth or vitest, or any other dependency or lockfile change.
- Changing the audit level, the `--prod` flag, or where the audit step runs.
- The moderate advisories.
- Claiming GHSA-fc5q-39xc-vjpf is harmless outside this repo's graph.

## Open questions (with defaults)

1. **Which file holds the ignore list.** Default: the file pnpm 10.28.0 actually reads for `auditConfig.ignoreGhsas`, confirmed by row 1 passing. If it is `pnpm-workspace.yaml`, the record of `audit-exception-1` is a YAML comment above the entry. If only the `pnpm` field of `package.json` works, JSON has no comments, so the builder does not invent a key and raises it in `needs_decision`.

## Depends on

- ADR 0015 decision 1: `pnpm audit --prod --audit-level high` is blocking.
- ORV-277 (Jira): lane S, security review before merge, the out-of-scope list above.

## Changelog

- v1.0 (2026-11-18): first version. Task `ORV-277-spec-1`. Downstream to review: the builder envelope (rows 1-6), the security review envelope, and a `## Rows per PR` section once the PR number exists.
- v1.1 (2026-11-18): row 2 corrected from the builder deviation of `ORV-277-build-1`; its Check now expects the summary line to count the advisory as ignored. Task `ORV-277-spec-2`. Downstream to review: the qa and security envelopes.
