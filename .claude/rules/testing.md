---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/e2e/**"
---

# Testing rules

- A test must fail on the real defect. Prove it: break the code, watch the test go red.
- Test behavior and contracts, not implementation details or class names.
- Required as the features land: resolver determinism and conflicts, schema round-trip (export → import → same result), interaction states, portal scope, contrast pairs per mode.
- Wait for conditions, never for fixed time.
- Visual regression runs on chosen fixture screens only and is advisory until baselines are stable.
