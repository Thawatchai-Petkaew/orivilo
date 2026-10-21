---
paths:
  - "packages/intent-engine/**"
  - "packages/design-system/**"
  - "apps/web/**/*.tsx"
  - "apps/web/**/*.css"
  - "**/*.stories.tsx"
  - "**/.storybook/**"
  - "DESIGN.md"
---

# Design-system and UX/UI rules

Read `DESIGN.md` first; it is the contract these rules enforce. The catalog is `packages/design-system/catalog/`; Storybook is its visual half (E2-0).

## Tokens and layers

- Layers: primitive → semantic → component tokens → recipes → components. Pages consume components and semantic tokens only.
- Three layers in `packages/design-system/src/tokens/source/`: `primitives.json` (`--op-*`), `semantic.json` (`--ds-*`), `component.json` (`--cmp-*`). Semantic references primitives only; component references semantic only; pages and components use `--ds-*` and `--cmp-*` names only. Edit the JSON, run `pnpm --filter @orivilo/design-system tokens`, commit `generated.css`; the test fails on a stale file.
- Profiles live in `packages/design-system/src/profiles/source/<id>.json` (E2-2): new values for existing semantic names plus own primitive ramps, never a new semantic name, never a changed base primitive, never `feedback.*` or `focus.*`. Register a profile in `src/profiles/index.ts`, run the tokens build, commit `src/profiles/generated.css`; `profiles.test.ts` checks every rule and every contrast pair per profile and mode. A boundary always sets `data-mode` and `data-design-profile` together; `mode` is `light`, `dark`, or `system` (follows the OS in CSS). A profile never overrides a Studio-scoped token (`action.intent*`, `text.on-intent`) and must override every identity-scoped token (`$extensions.orivilo.scope` in `semantic.json`); a runtime `Profile` object renders through the same boundary without a build (E2-3).
- The Studio shell (`apps/web`) renders every page inside `DesignProfileBoundary profile="neutral" mode="system"` and imports fonts and tokens from the package only; `globals.css` declares nothing visual. Studio chrome uses the intent and brand tokens; a shared component used inside a preview never does, and inside a profile boundary those tokens render as the profile's own action anyway.
- Token names are ours (`surface.canvas` ⇔ `--ds-surface-canvas`), never shadcn's. shadcn variables are an adapter target inside recipes only (ADR 0003).
- No hex, rgb, raw radius, shadow, or raw font values in pages, components, or recipes. Add a token to the contract instead; a contract change is L lane with an impact list.
- Tailwind is for layout and composition. Colour, radius, shadow, and font utilities are forbidden in components and pages; the lint rule (E2-0) fails the build on them.
- Feedback colours (success, warning, danger, info), selection, focus, action, and brand signature are separate semantics. None substitutes for another.
- Every declared mode (light, dark) has a complete token set and passes contrast checks on real pairs (text ≥ 4.5, UI ≥ 3.0), by script, not by eye.

## Components

- Every shared component lives in `packages/design-system`, is built on a shadcn primitive, carries no shadcn visual classes, and consumes its recipe.
- A component exists only when its catalog entry, its story, and its code land in the same PR. An entry without a story or a story without an entry fails the gate.
- States per `DESIGN.md` §7, each a story. Hover and focus are interaction states, not public props. Icon-only controls have accessible names. Loading blocks repeat submission.
- Each component PR shows the same component under at least two recipes and both modes in Storybook.
- Fixture content includes Thai, Latin, a long Thai name without spaces, and a missing value; stories render at 360 px.
- `DesignProfileBoundary` scopes CSS variables. Overlays rendered through portals must receive the same profile as their trigger, proven by a test.
- Changing style controls must not remount the preview tree or lose form state.
- Do not change a shared component for one case without checking every story that uses it. If a component does not fit, propose a variant, recipe slot, or pattern in the PR with scope and reason.

## Storybook

- One `*.stories.tsx` next to each component; story title `<tier>/<Name>` so the id matches the catalog `story` field.
- Stories are the fixtures for interaction and a11y tests (Vitest addon) and for visual regression (advisory until baselines are stable, see `testing.md`).
- Global toolbar switches mode and profile through the same `DesignProfileBoundary` the app uses; a story never sets a colour itself.
- Docs pages for foundations (colour, type, space, radius, motion) render from the token source, never from copied values.

## UX and writing

- Sentence case; a button names its outcome and keeps that name through the flow; errors say what went wrong and how to fix it; empty states invite an action.
- No middot (·) and no em dash (—) in any UI text, ever (owner's rule, 2026-10-21). Use a comma, colon, slash, or line break. The copy check (E2-0) fails the build on either character in components, stories, and message files.
- No letter-spacing or text-transform on Thai. Thai copy is written as Thai; if it reads as a translation, rewrite it.
- Label rule-based behavior as rule-based and mock data as mock. Never render trust badges, ratings, discounts, countdowns, or success states without backing data.
- Brand accent never replaces error, warning, selection, or focus semantics. Studio colours never appear inside a customer preview frame.

## Resolver and data (unchanged)

- Never randomize style values at render time. Output must be reproducible from the profile.
- Resolver code is pure TypeScript: no Date, Math.random, network, or framework imports in resolved values.
- Schemas carry `schemaVersion`. Approved snapshots are immutable.
- A profile changes visual expression only. Business logic, permissions, and validation come from the domain.

## Gate

Before G3 on any PR that touches UI, the reviewer walks `DESIGN.md` §11 line by line and records pass, fail, or not applicable with evidence. Any fail blocks. Agents never approve their own gate.
