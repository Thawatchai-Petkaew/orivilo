# ADR 0003: shadcn as the behavior layer, our own visual layer, Storybook as the catalog

- Status: accepted
- Date: 2026-10-21
- Decided by: GOLF (owner), in the project thread

## Context

The owner wants ORIVILO's UI, and the UI it generates for customers, to have a style of its own and never read as generic AI output ("UI slop"). shadcn/ui is in the stack (ADR 0001). The question was whether to use it as-is, replace it, or wrap it.

## Decision

1. **shadcn/ui provides behavior only.** We keep the primitives it generates (Radix or Base UI: focus, keyboard, portal, aria, open/close state) and their prop contracts. We do not keep its visual classes, its CSS variable set (`--primary`, `--radius`, ...), or its theme. When a component is added, every styling class is replaced by our recipe before it is committed.
2. **Style lives in recipes, not in components.** A recipe (handoff §9.4) defines how surface, edge, elevation, motion, density, and imagery combine, and it restyles the whole component set at once. Components in `packages/design-system` consume semantic tokens and the active recipe through `DesignProfileBoundary`; pages never see shadcn.
3. **Recipes are resolved, not preset.** The resolver chooses and tunes a recipe from intent, brand CI, and the knowledge base. Two brands using the same button component must not look alike.
4. **Storybook is the catalog.** It is the component catalog agents read before composing UI (handoff §15), the visual fixture set for regression tests, and part of the developer handoff package. It is not what makes the UI ours; it is where the tokens and recipes are proven in every mode and state.
5. **Reviewer gate.** Every generated or hand-built UI is checked against the "tells of generated design" list in `.claude/skills/frontend-design/SKILL.md` before G3.

## Enforcement

- Lint rule in `packages/design-system` and `apps/web`: no raw color, radius, shadow, or font utility classes in components; tokens and recipe classes only.
- `globals.css` declares our semantic tokens, never the shadcn variable set.
- A component PR shows the same component under at least two recipes in Storybook.

## Consequences

- More work per component at first (restyle every primitive), repaid by a real visual identity that the profile controls.
- Upgrading shadcn means re-applying our recipe layer; keeping the behavior/visual split strict makes that mechanical.
