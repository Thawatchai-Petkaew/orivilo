---
issue: E2-0 (placeholder; folder is renamed to the ORV key when the Jira issue is created)
lane: M
version: 1.2
---

## Why

The owner's rule (2026-10-21): no Studio UI is built before Storybook is set up and our components are registered against `DESIGN.md`, the catalog, and the UX/UI rules. ADR 0003 names Storybook as the catalog, the visual fixture set, and part of the handoff package. Doing it first means every later component (E2-4 onward) lands with its story, its two recipes, and its gate evidence from day one instead of back-filling.

Two slices:

- **Slice A, docs (no Jira issue needed):** `DESIGN.md`, `packages/design-system/catalog/` registry and coverage, `.claude/rules/design-system.md`, `AGENTS.md` lines, this spec, backlog and roadmap reorder. Lands in its own PR.
- **Slice B, code (this story):** the `packages/design-system` package with Storybook, token CSS, mode/profile toolbar, a11y and Vitest addons, the foundations docs page, the catalog check script, and the lint rule from ADR 0003.

## Story

As an agent or developer on the ORIVILO team, I want a running Storybook that renders our tokens and gives every future component a place for its stories, modes, and tests, so that a component cannot exist without a catalog entry and visible evidence of its states.

## Acceptance criteria

| #   | Given                                                                                                      | When                                                     | User sees                                                                                                           | Data effect                                         |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | A fresh clone with `pnpm install`                                                                          | `pnpm --filter @orivilo/design-system storybook`         | Storybook opens on `localhost:6006` with a "Foundations" section and no component stories claimed to be stable      | None                                                |
| 2   | Storybook open                                                                                             | The toolbar mode switch is set to light, then dark       | The Foundations pages re-render with the §3.1 then §3.2 values from `DESIGN.md`; nothing is hard-coded in a story   | `data-mode` attribute on the preview root changes   |
| 3   | Storybook open                                                                                             | The toolbar profile switch is used                       | A single `neutral` profile is listed; the control is wired through the same boundary component the app will use     | `data-design-profile` attribute on the preview root |
| 4   | Foundations › Colour page                                                                                  | Reading it                                               | Every semantic token in `DESIGN.md` §3 with its name, value per mode, and computed contrast against its pair        | Values come from `src/tokens/*.css`, one source     |
| 5   | Foundations › Typography page                                                                              | Reading it                                               | The scale from `DESIGN.md` §4 rendered with Thai and Latin on the same line at 14/16/20/32/56 px, self-hosted fonts | None                                                |
| 6   | A story file exists without a catalog entry, or an entry with `status: draft` or `stable` has no story     | `pnpm test`                                              | The `check-catalog` test fails and names the file                                                                   | None                                                |
| 7   | A component or page uses `bg-[#…]`, `rounded-[…]`, `shadow-…`, `font-[…]`, or a raw Tailwind palette class | `pnpm lint`                                              | Lint fails on that line with the rule name and a pointer to `DESIGN.md` §5                                          | None                                                |
| 8   | Repo root                                                                                                  | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | All pass, Storybook static build included in `build`, output attached to the PR                                     | None                                                |
| 9   | Storybook open                                                                                             | The a11y addon panel is opened on a Foundations page     | Zero violations                                                                                                     | None                                                |
| 11  | A component, story, or message file contains a middot (·) or an em dash (—)                                | `pnpm test`                                              | The `check-copy` test fails and names the file and line (owner's rule of 2026-10-21)                                | None                                                |
| 10  | PR description                                                                                             | Reading it                                               | States what is real (Storybook, tokens, lint, check script) and what is not (no components, neutral profile only)   | None                                                |

## Rules and bounds

- Package name `@orivilo/design-system`, pure React 19 and TypeScript strict, no Next.js imports (components must run inside any React host and inside preview frames).
- Storybook framework: React + Vite, latest stable at install time, pinned exactly in `package.json`. Tailwind v4 through its Vite plugin. Addons: a11y, Vitest (interaction and a11y tests run under `pnpm test` using the pre-installed Chromium), docs.
- Token CSS: `src/tokens/orivilo.css` declares `--ds-*` for light under `:root, [data-mode="light"]` and dark under `[data-mode="dark"]`, plus `@theme` aliases so Tailwind utilities like `bg-surface-canvas` resolve. Values copied from `DESIGN.md` §3 with a comment naming the section; the dark placeholders are marked as such.
- Mode and profile switching is a decorator that renders the preview inside a minimal `DesignProfileBoundary` (sets `data-mode` and `data-design-profile`, nothing else). E2-3 replaces its internals; its props stay.
- Lint rule as a flat-config ESLint rule in the package and in `apps/web`; no backlog exists, so it is blocking from the first commit.
- `check-copy` is a Vitest test that scans `src/**/*.{ts,tsx}` and `catalog/**` for U+00B7 and U+2014 and fails on any hit; it ships blocking because no UI exists yet.
- `check-catalog` is a Vitest test that reads `catalog/**/*.yaml` and `src/**/*.stories.tsx`; it does not need Storybook to run.
- Fonts self-hosted under the package (OFL files committed with their licence text), loaded by the Storybook preview head and later by `apps/web`.
- PR size ≤ ~400 lines of hand-written code; generated Storybook scaffolding and font binaries excluded from that count but listed.

## Out of scope

- Any component (E2-4), recipes (E2-2), the real `DesignProfileBoundary` (E2-3), portal scope (E2-5).
- Visual regression baselines and Chromatic or equivalent (advisory later; `testing.md`).
- Page examples per tier (E2-7). Deploying Storybook to a preview URL (E0-3 covers preview URLs; Storybook joins it then).
- Contrast computation in CI (E0-5); the Foundations page computes ratios at render time for display only.

## Open questions (option, impact, default)

1. Where the package lives: `packages/design-system` (default, matches AGENTS.md and ADR 0003) or inside `apps/web`. Inside the app would tie components to Next.js and break preview isolation.
2. Storybook framework: React + Vite (default, pure React package) or Next.js + Vite. The Next.js framework would allow `next/image` and `next/link` in components, which the preview frames cannot host.
3. Fonts: self-hosted in the package (default) or fetched from Google Fonts at runtime. Runtime fetch would leak a third-party request into customer previews.

## Depends on (ADRs, decisions, other issues)

- ADR 0001 (stack), ADR 0003 (shadcn behavior only, Storybook as catalog, Untitled UI structure).
- `DESIGN.md` v1 and `packages/design-system/catalog/README.md` (slice A).
- Owner's rule of 2026-10-21: Storybook before any UI.
- Unblocks E2-4, E2-5, E2-6, E2-7, E2-8, E2-14.

## Changelog

- v1.2 (2026-10-21): slice B implemented. Decisions taken while building: Playwright pinned to 1.56.1 because the CI and cloud images ship that Chromium (1194); Tailwind's default palette, radii, shadows, font families, and text sizes are removed in `@theme` so a raw class produces no CSS in addition to failing lint; `font-mono` is allowed because `mono` is a §4 role; the §4 scale is exposed as `text-display-lg` through `text-body-sm`; `check-copy` also scans `.css`, `.json`, `.md` under `src/`; the Storybook addon applies preview annotations itself since 10.3, so there is no Vitest setup file; `turbo.json` passes `PLAYWRIGHT_BROWSERS_PATH` through to `test`. Hand-written code came to about 930 lines (token CSS, two Foundations pages, two checks, the lint rule), above the ~400 guideline; the owner may ask for a split.
- v1.1 (2026-10-21): AC 11 and the copy check added for the owner's no-middot, no-em-dash rule.
- v1 (2026-10-21): first spec, written from the owner's request, ADR 0003, DESIGN.md v1.
