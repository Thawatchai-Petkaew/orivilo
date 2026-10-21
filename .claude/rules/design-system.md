---
paths:
  - "packages/intent-engine/**"
  - "packages/design-system/**"
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.css"
---

# Design-system rules

- Layers: primitive → semantic → component tokens → recipes → components. Pages consume components and semantic tokens only.
- No hex, rgb, raw radius, or raw font values in pages or recipes. Add a token to the contract instead.
- Feedback colors (success, warning, error), selection, and focus are separate semantics from brand accent.
- Every declared mode (light, dark) has a complete token set and passes contrast checks on real pairs.
- `DesignProfileBoundary` scopes CSS variables. Overlays rendered through portals must receive the same profile as their trigger.
- Changing style controls must not remount the preview tree or lose form state.
- Never randomize style values at render time. Output must be reproducible from the profile.
- Resolver code is pure TypeScript: no Date, Math.random, network, or framework imports in resolved values.
- Schemas carry `schemaVersion`. Approved snapshots are immutable.
