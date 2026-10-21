---
name: quality-gate
description: Run every automated check the repo has and report the real result. Use before raising G3 and before any handoff that claims work is complete.
---

# Quality gate

Run from the repo root and capture the output:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod --audit-level high
```

As the design-system checks land (token schema validation, contrast pairs per mode, resolver determinism, export/import round-trip, portal scope, visual fixtures), add them here and to CI in the same PR.

Report each command as pass or fail with the relevant lines. A check you could not run is reported as "not run" with the reason. Never summarize a failure as a pass.
