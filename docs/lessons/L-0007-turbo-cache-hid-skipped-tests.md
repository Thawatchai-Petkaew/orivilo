---
id: L-0007
date: 2026-10-23
issue: [ORV-13]
what_happened: A cached turbo run replayed old test output and hid that the database tests were being skipped.
cause: TEST_DATABASE_URL and REQUIRE_DB_TESTS are `passThroughEnv` (turbo.json:11), so they are not part of the cache hash; a cache hit replays a run that had no database.
rule: Test runs that back a handoff or a gate use `--force`, and the report says the run was not cached and how many tests were skipped.
---

## What happened

`pnpm test` goes through turbo. The test task lists `TEST_DATABASE_URL` and `REQUIRE_DB_TESTS` under `passThroughEnv` (`turbo.json:11`). turbo passes them to the task but leaves them out of the cache hash. So a run with the database set can hit the cache of an earlier run without it, and turbo replays that run's output, skipped database tests and all. The output looked like a complete run. ORV-13 makes the quality gate run tests with `--force`.

## Rule

- For a handoff, a gate packet or CI, run `pnpm test --force`. This is what ORV-13's `quality-gate.mjs` runs (`["pnpm","test","--force"]`); that line is from ORV-13, which is not merged yet. Do not write `pnpm test -- --force`: the `--` hands `--force` to each package's test script, and turbo still reads its cache.
- The report gives the counts: passed, failed and skipped, per package. A skipped suite is named with the reason.
- "Tests passed" with a cache hit is not evidence.

Status: proposed (targets `.claude/rules/testing.md` and the `quality-gate` skill; ORV-13)
