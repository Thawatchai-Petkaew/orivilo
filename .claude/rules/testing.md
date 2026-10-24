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
- Verify a fix with the affected tests first, the full suite once. While you build and verify, run only the affected tests: `vitest related --run <changed files>` or `vitest run --changed origin/develop`. A fix for a flaky test repeats each affected file with `--repeats 4`, such as `pnpm --filter @orivilo/design-system exec vitest run --repeats 4 <file>`. Then run the full suite once before handoff. Never loop the full suite to prove a flake is gone (L-0009).
- The full suite always runs where it decides: the G3 gate (`pnpm quality-gate`) and CI. A change to a config file, a `package.json`, a shared setup file or a Storybook preview file runs the full suite while you build too, because the affected tests cannot be worked out from it.
