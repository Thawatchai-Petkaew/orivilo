---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/e2e/**"
  - "**/*.stories.tsx"
---

# Testing rules

- A test must fail on the real defect. Prove it: break the code, watch the test go red.
- Test behavior and contracts, not implementation details or class names.
- Required as the features land: resolver determinism and conflicts, schema round-trip (export → import → same result), interaction states, portal scope, contrast pairs per mode.
- Wait for conditions, never for fixed time.
- Visual regression runs on chosen fixture screens only and is advisory until baselines are stable.
- Verify a fix with the affected tests first, the full suite once. While you build and verify, run only the affected tests: `pnpm --filter <package> exec vitest related --run <changed files>` or `pnpm --filter <package> exec vitest run --changed origin/develop`. A fix for a flaky test repeats each affected file with `--repeats 4`, such as `pnpm --filter @orivilo/design-system exec vitest run --repeats 4 <file>`. Then run the full suite once before handoff. Never loop the full suite to prove a flake is gone (L-0009).
- The full suite always runs where it decides: the G3 gate (`pnpm quality-gate`) and CI. A change to a config file, a `package.json`, a shared setup file or a Storybook preview file runs the full suite while you build too, because the affected tests cannot be worked out from it.
- A time limit is sized for the CI runner under the parallel full suite, not for one file on the Mac
  (the ratio seen was about 8). A test that parses a heavy document (one sized at a bound, such as a
  2 MB page) passes the file's shared heavy timeout constant (`HEAVY_TIMEOUT`) as the third argument
  of `it()` or `it.each()`. A wall-clock assertion's bound is at least 10 times the local time
  measured while the full suite runs, or a measured CI time with its run id, and it still goes red on
  the mutant it guards (L-0042). Before handoff the builder runs
  `pnpm --filter <package> exec vitest run --testTimeout=400`, gives every test that fails it the
  heavy timeout or a lighter input, and adds one `verified` row with the command and its count. The
  reviewer runs the same command on a re-check of heavy tests. That run catches only a test over
  400 ms locally (on `769f09e` it caught 1 of the 7 heavy tests R4-1 listed), so no command checks
  the `HEAVY_TIMEOUT` sentence: the reviewer reads every test that builds a heavy document and raises
  one without the heavy timeout as a finding (L-0046). No hook checks this.
- A play for a visual criterion (an edge, a row of equal chips, text inside a rounded box) asserts the rendered result through the shared helpers in `packages/design-system/src/testing/visual-asserts.ts` (`expectEdgeInk`, `expectSameHeight`, `expectNoGlyphClip`), with a Thai sample that stacks marks. A play that sets one CSS property and asserts that property is not the visual check (L-0018).
- A test that guards source text (an import ban, a forbidden token, a copy check) lists the syntax forms it blocks in a comment or in its test name. For an import ban those are a single-line import, a multi-line import, a side-effect import, a dynamic `import()` and an `export ... from`. Before handoff the builder runs the guard on one failing sample of each form, as a fixture inside the test or a scratch run, and adds one `verified` row per form with the red line. The reviewer checks that each form has a row and raises any missing form as a finding. One red run is not enough for a text guard (L-0024, narrows L-0002). No hook checks this.
- A schema or guard module is proven clause by clause: one mutation per numbered check, per half of a
  two-part check, per closed list and per bound, each seen red and restored, one `verified` row each.
  A sample of clauses is not enough (L-0042, widens L-0002). No hook checks this.
