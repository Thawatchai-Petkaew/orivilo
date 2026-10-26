---
id: L-0026
date: 2026-10-26
issue: [ORV-20]
what_happened: QA could not reproduce the fact that the full gate passed on PR 112 until it found by trial the TEST_DATABASE_URL that works on this machine.
cause: The envelope fact cited only the gate report, the committed handoff gives only the CI URL (role postgres), and the URL that works here lives only in the uncommitted session handoff.
rule: An envelope fact that says the gate passed names the `TEST_DATABASE_URL` and `REQUIRE_DB_TESTS=1` it ran with in its `checked_by`, and `docs/context/handoff.md` documents a local Postgres whose role is the macOS user.
---

## What happened

The ORV-20-qa-1 envelope stated that the full gate passed on `58ccb27`, checked by `jq -c '{ok,partial,git}' .quality-gate/report.json`. QA finding QA-3 (Suggestion): `pnpm quality-gate` without the variable stops with `TEST_DATABASE_URL is unset`. The CI URL in `docs/context/handoff.md` line 93 (`postgres://postgres:postgres@localhost:5432/postgres`) fails here with `role "postgres" does not exist` in `@orivilo/db` and `@orivilo/auth`. The gate passed only with the macOS user as the role.

The working URL is in `.orivilo/handoff.md` step 3, which the main session writes and git does not track. Any role that reruns the gate (qa, reviewer, builder) has to find it on its own. ORV-20-qa-1 used 3,129,391 tokens, the most of any ORV-20 task, and the database detour is one part of that. The report does not split it out, so this lesson claims no saving.

## Rule

- When a fact says the gate passed, its `checked_by` names the run: `TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1 pnpm quality-gate`, with the URL the main session used. That URL is a local database with no password, never a secret.
- `docs/context/handoff.md` gains one line beside the CI URL: on a Homebrew Postgres the role is the macOS user (`postgres://$USER@localhost:5432/<db>`).
- Target: `.claude/skills/ovl/SKILL.md` (envelope facts) and `docs/context/handoff.md`.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, "A fact that the gate passed") and `docs/context/handoff.md` (Set up a machine, the line after the CI URL); no hook enforces it
