---
name: quality-gate
description: Run the full automated gate with one command and quote its report. Use before raising G3 and before any handoff that claims work is complete.
---

# Quality gate

Run from the repo root:

```bash
pnpm quality-gate
```

When the run needs variables (the test database URL), export them first:
`export TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1; pnpm quality-gate`. The gate record hook does not
count `VAR=... pnpm quality-gate` (L-0047).

It runs, in the order CI runs them: `format`, `scripts` (`pnpm test:scripts`), `lint`, `typecheck`, `contrast`, `test` (forced past the turbo cache and `--continue` so every package reports, with `REQUIRE_DB_TESTS=1` so a missing test database fails instead of skipping), `build`, `audit`. A failure does not stop the run; every step reports.

Quote the report, never a summary of it:

- `.quality-gate/report.md`: the table to paste into a gate packet.
- `.quality-gate/report.json` (schemaVersion 1): per step status, exit code, time, key lines; the branch and full sha; `partial`; `problems`; and `env` (`TEST_DATABASE_URL` set or unset, never its value).

Options:

- `--bail` stops at the first failure; the remaining steps report "not run".
- `--only lint,test` runs those steps only. Every other step still appears as "not run", `ok` is false and `partial` is true. **A partial run never grounds G3**; use it to iterate, then run the full gate.
- An unknown flag, an unknown step name or a missing `--only` value prints usage and exits 2 without running anything.

`ok` is true only when every step passed, at least one step ran, and git was readable with the same HEAD at start and end. Exit code is 0 for ok, 1 otherwise.

As new checks land (resolver determinism, export/import round-trip, portal scope, visual fixtures), add them to `STEPS` in `scripts/quality-gate.mjs` and to CI in the same PR.

A check you could not run is "not run" with the reason. Never summarize a failure as a pass.

Tests only: `QUALITY_GATE_STEPS_FILE` (a JSON list of steps) replaces the gate so the script's own tests can run it. A stub run reports `stepsSource: "stub"` and is always `ok: false` (exit 1), so it can never pass as evidence.
