---
issue: ORV-252 (https://tpetkaew.atlassian.net/browse/ORV-252), the Top navigation slice, slice C, of ORV-225 (https://tpetkaew.atlassian.net/browse/ORV-225)
lane: L (as ORV-225, by that spec's reading of the risk flags; Jira not read in this role)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
parent: docs/specs/ORV-225/spec.md v1.3, with docs/specs/ORV-225/design.md version 2
version: 1.2
---

# ORV-252: Top navigation (ORV-225 slice C)

## Why

ORV-225 asks for four named parts, so the Studio shell and the reference screen use a component with a catalog entry, a story and a contract instead of inline markup. The full reasoning is in the parent's "Goal" (`docs/specs/ORV-225/spec.md`) and applies here as written.

The parent plans six PRs, slices A to F. PR 189 carried slice A, Page header, and merged into `develop`. This issue is slice C, split out so Top navigation has its own acceptance, its own PR and its own qa walk (L-0016). It adds no gate and one requirement, row 78: Breadcrumb merged after the parent was written and reads a token the parent repoints, so its current crumb has to keep its ink.

What is real and what is not, as the parent's Goal says it: Top navigation renders real markup and real links and reads the locale catalog. `navFixtures` is mock story data, and its routes do not exist. No route in `apps/web` shows Top navigation when this story ends, because the shell moves onto it in slice F. Nothing checks a permission. No screen reader test has been run, and accessibility claims stop at the plays below and row 38's probe.

## Story

As a person working in the Studio, I see which section I am on in the top menu, I can reach every item by keyboard and on a phone, and I can skip the menu. This story proves that in Storybook. The app gains it in slice F.

## What this story uses from ORV-225 (linked, not copied)

- **Spec:** `docs/specs/ORV-225/spec.md` v1.3: the Top navigation benchmark, the rules listed under "Rules and bounds" below, the rows of "Contract changes and impact" this story adds, the `nav.open` row of "Copy", and W1, W2 and W8 of "Worked examples".
- **Design:** `docs/specs/ORV-225/design.md` version 2: the answer to open question 3, the Flow, Source intent, the "Slice C" rows 11 to 22 of "Rules for the builders", the Builder notes, the recipe blocks "ds-nav-item" (without its group rows), "Top navigation" and "The drawer", "Tokens", "States", "Content that decides the shape", and the sign-off list in "Screens for visual QA".
- **Gates:** the G1 and G2 comments on ORV-225 cover this slice: comment 10523 (G1 and G2 passed under delegation, every open question on its default for then) and comment 10532 (G2, with open questions 3, 6 and 9 answered). G3 is raised on this issue.
- **Already on `develop` from PR 189:** `PageHeader` and its stories, the `ds-page-header` recipe and its pairs, `packages/design-system/catalog/application/page-header.yaml` and its `coverage.md` row, `headingLevel` on `WorkspaceScreen`, and `moreActions` and `longAction` in `pageHeaderFixtures`. None of it is a Top navigation part.
- **Already on `develop` from other PRs:** `expectFrameCutsNoInk` (PR 186), and `Sheet` with `side="start"`.
- **Not there yet, so this story adds it:**
  - Tokens: the three `nav-item` repoints, `nav-item.bead-size` and `nav-item.row-radius`, with the `spec-sheet.tsx` edit and the wording check on `DESIGN.md` lines 21 and 79 that the parent's first contract rows name.
  - Recipes: `ds-nav-item`, the `ds-top-nav` classes, and the nine new pairs of the parent's contract row `pairs.ts`.
  - Components: `TopNavigation`, `TopNavigationProps`, and the internal `src/components/nav-item/` with `NavItem` and `current.ts`.
  - Everything else: `MenuIcon`, `navFixtures`, `nav.open` in Thai and English, `packages/design-system/catalog/application/top-navigation.yaml`, its `coverage.md` row, and the stories of `Application/Top navigation`.
  - The drawer's recipe: `design.md` files it under slice D, in its rows 23, 24 and 31, but rows 35 to 37 are in this slice. So the base `ds-nav-item` row, `ds-nav-drawer` and its `__list` and `__label` land here, and slice D reuses them.
  - The current crumb's ink (open question 1, closed). `nav-item.fg-active` and `nav-item.bg-active` repoint as the parent says, and the current crumb reads `text.primary` directly: `--ds-text-primary` in a recipe, `ds:text.primary` in `pairs.ts`. No token is added, because `text.primary` is the value `nav-item.fg-active` holds today (`packages/design-system/src/tokens/source/component.json` lines 407 to 410). No profile overrides a `--cmp-nav-item-*` token, and `packages/design-system/src/tokens/generated.css` declares `--cmp-*` again on every `[data-mode]` and `[data-design-profile]`, so both reads resolve in the same scope and the crumb's colour stays what it is on `develop` in every profile and mode.
    - `packages/design-system/src/recipes/recipes.css`: line 5939, in `.ds-breadcrumb__page`, `color: var(--cmp-nav-item-fg-active);` becomes `color: var(--ds-text-primary);`. The comment at line 5882 says the current crumb reads `text.primary`, not a nav item token.
    - `packages/design-system/src/recipes/pairs.ts`: lines 1080 and 1087, the `breadcrumb` slots "current on canvas" and "current on card", change `fg` from `nav-item.fg-active` to `ds:text.primary`. Their `bg` and `floor` stay. The comment at line 1048 follows.
    - `packages/design-system/src/components/breadcrumb/Breadcrumb.stories.tsx`: line 152 reads `--ds-text-primary`, and the `CurrentInk` play gains row 78's check in each frame.
    - `packages/design-system/src/recipes/recipes.test.ts`: one test holds the two `breadcrumb` slots on `ds:text.primary`, in the form of the `alert` pair test.
    - Pairs: no new row. Those two rows change their `fg`, so the nine new pairs of row 39 stay nine and Breadcrumb keeps its eight rows. `docs/specs/ORV-229/design.md` rows 5 and 6 of its contrast table measured these values, and they stand. "current on card" then has the same `fg` and `bg` as the skip link's new pair, under another recipe, because each recipe lists its own pairs and no test rejects the repeat.
    - The builder shows row 78 red with `.ds-breadcrumb__page` put back on `--cmp-nav-item-fg-active`, then restores it.
    - Pagination, for its slice spec to copy: the current page reads `--ds-text-primary` on `--ds-surface-card`, with its border in `--ds-border-strong` and no hover change, and never `--cmp-nav-item-fg-active` or `--cmp-nav-item-bg-active`. Its pair is `ds:text.primary` on `ds:surface.card`, TEXT, in place of `nav-item.fg-active` on `nav-item.bg-active`. Its other `--cmp-nav-item-*` reads stay.
    - Impact, profiles: none. No profile value changes, and the crumb looks the same under all of them.
    - Impact, recipes: `breadcrumb`, one colour read and two pair rows. `ds-nav-item` is the only recipe left on `nav-item.fg-active` and `nav-item.bg-active`.
    - Impact, components: `Breadcrumb`, one story line and one play, with no change to `BreadcrumbProps`, to `packages/design-system/catalog/base/breadcrumb.yaml`, which says "darker ink" and names no token, or to the crumb's look, so no new sign-off. `Pagination`, not built, follows the line above.
    - Impact, screens: none. No route in `apps/web` uses Breadcrumb.
- **Order:** the PR title starts `ORV-252: ...`. This slice can run beside slices A and B, and slice D needs it.

## Acceptance criteria

Rows 23 to 41 and 75 keep their numbers from the parent at v1.3. Rows 23 to 37, 39, 40 and 75 keep its wording. Two rows differ:

- Row 38 changes in its Check cell only. The proof that focus lands on the target after Enter moves from the `SkipLink` play to a Playwright probe, because a real hash change reloads the Vitest browser tester page (builder report of `ORV-252-build-1`). Its Given, When, User sees and Data effect cells keep the parent's words, so the behaviour asked for does not change. The builder runs the probe on the Storybook build, puts the read in a `verified` row, and shows it red with `tabIndex` off the target. The probe is a one-time read and not a CI test, so CI holds no proof of this focus move until row 70's `shell.spec.ts` in slice F.
- Row 41 adds "on ORV-252" after "a Jira comment", in its Data effect cell only, since this is the issue the sign-off reports on.

Row 78 is this story's own, from open question 1. The parent's rows end at 77, so the number takes none of them.

No row drops anything for PR 189: that PR merged none of rows 23 to 41, and row 75 runs on each PR for itself.

Slice C is this issue, so "Slice C's" in rows 39 and 41 means this PR, and "Each slice's PR" in row 75 includes it. Everything these rows name from outside them is the parent's: the rules, W1 and W8, the contract row `pairs.ts` of row 39, and row 12, which row 41 reads with `top-navigation.yaml` in place of `page-header.yaml`. The opening paragraph of the parent's "Acceptance criteria" gives `navFixtures`, the locale of the plays, the `En` twins and what "the text proof" means. Row 38's label is fixture copy in this PR, because the key `app.skip` lands with the shell in slice F.

The file names in the rows stand for these paths:

- `current.test.ts`: `packages/design-system/src/components/nav-item/current.test.ts`, new.
- `generated.css`: `packages/design-system/src/tokens/generated.css`.
- `tokens.test.ts`: `packages/design-system/src/tokens/tokens.test.ts`, with the line number in "Where `develop` has moved".
- `recipes.test.ts`: `packages/design-system/src/recipes/recipes.test.ts`.
- `top-navigation.yaml`: `packages/design-system/catalog/application/top-navigation.yaml`, new.
- `pairs.ts`: `packages/design-system/src/recipes/pairs.ts`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 23 | `current.test.ts` | The cases of W1 run | Nothing | Each case gives W1's result (`nav-current-1`) | Unit test |
| 24 | Top navigation `Default`, 1280, Thai | Rendering | Logo, "ภาพรวม", "โปรเจกต์", "สมาชิก", then the actions in position at the end of one row | `getByRole("navigation", { name: "เมนูหลัก" })` holds the logo and three links; the actions sit after the `nav` and outside it; no opener in view; item height per `nav-size-1` (`top-nav-1`) | `Default` play |
| 25 | `DefaultEn` | Rendering | "Overview", "Projects", "Members" | Name "Main", three links (`stories-1`) | `DefaultEn` play |
| 26 | `WithCurrent`, `currentPath="/projects"` | Rendering | "โปรเจกต์" filled with the current colour and a bead at its start edge; the others at rest | `aria-current="page"` on that link only; computed fill and bead equal `nav-item.bg-active` and `nav-item.bead` probes; the bead has ink (`nav-current-1`, `nav-look-1`) | `WithCurrent` play |
| 27 | `ParentCurrent`, `currentPath="/projects/brand"`, then an item with `current: true` | Rendering | "โปรเจกต์" with the current look | `aria-current="true"` on that link, none on the others; the override gives the same value (`nav-current-1`) | `ParentCurrent` play |
| 28 | `Hover` | The pointer enters an item at rest | The item takes the hover colour | Computed fill equals a `nav-item.bg-hover` probe (`nav-look-1`) | `Hover` play |
| 29 | `FocusVisible`, on a marked and an unmarked item | Tab reaches each; Enter on the first | A focus line and halo inside the item, distinct from the current colour | The inset focus form reads true on both, by the computed read or `expectFocusInsetForm`; the fixture link records one press (`nav-focus-1`) | `FocusVisible` play |
| 30 | `LongLabels`, `fixtures.longThai` and a label of stacked marks | Rendering | The label stays on one line and truncates; its marks stay whole, with no overlap of the row's edge; the row's height does not change | The text proof for the Top navigation label passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip on the stacked marks label, `frame` its `.ds-nav-item`; item height per `nav-size-1` (`frame-ink-1`) | `LongLabels` play |
| 31 | `WithBadge`, `WithIcons` | Rendering | "โปรเจกต์" with a "4" badge after it; icons before labels; an item with no badge shows none | One `.ds-badge` in the row; the link's name starts with its label (`nav-item-1`) | `WithBadge`, `WithIcons` plays |
| 32 | `TwoRows`; `Default` | Rendering | A second row of links under the first in `TwoRows`, none in `Default` | Two `navigation` roles, "เมนูหลัก" and "เมนูย่อย", each with one marked link at most; one `navigation` role in `Default` (`top-nav-1`, `nav-landmark-1`) | `TwoRows` play |
| 33 | `NoItems` at 1280 and 360 px | Rendering | The logo and the actions, no list, no menu button | No `button` named by `nav.open` (`top-nav-1`) | `NoItems` play |
| 34 | `Narrow`, 360 px, `currentPath="/projects"` | Rendering | Logo, an icon button, the actions on one row; the links are out of view | `getByRole("button", { name: "เปิดเมนูหลัก", exact: true })` exists; `En` twin "Open Main menu"; root `scrollWidth` equals `clientWidth` (`nav-narrow-1`, W8) | `Narrow` play |
| 35 | `DrawerOpen`, same | The button is pressed | A drawer in position at the start edge, titled "เมนูหลัก": the items in their order, "โปรเจกต์" with the current look | `getByRole("dialog", { name: "เมนูหลัก" })`; link order equals `items`; `aria-current="page"` on "โปรเจกต์"; no `nav` in the dialog; items at the drawer height of `nav-size-1`; the text proof for a drawer label passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip, `frame` its `.ds-nav-item` (`nav-narrow-1`, `nav-landmark-1`, `frame-ink-1`) | `DrawerOpen` play |
| 36 | `DrawerOpen`, open | "สมาชิก" is pressed; reopen; Esc | The drawer closes each time | The fixture link records one press; after Esc `document.activeElement` is the opener (`nav-narrow-1`) | `DrawerOpen` play step |
| 37 | `InsideProfile`, friendly boundary, drawer open | Rendering | The drawer in the friendly profile's colours | The dialog's `closest("[data-design-profile]")` reads `friendly` (`.claude/rules/design-system.md`) | `InsideProfile` play |
| 38 | `SkipLink`, with `skipHref` and `skipLabel` | Tab once, then Enter | "ข้ามไปเนื้อหาหลัก" comes into view as an opaque bar over the row; then focus moves to the target | The link is the first focusable in the `header`; out of view before Tab; `document.activeElement` is the target after Enter (`top-skip-1`) | `SkipLink` play: the first focusable in the `header`, out of view before Tab, the opaque bar after Tab, and the target's `id` and `tabIndex`. Playwright probe on the built story `application-top-navigation--skip-link`: `document.activeElement` is the target after Tab and a real Enter |
| 39 | Slice C's token and pair changes | `pnpm --filter @orivilo/design-system tokens`, `pnpm test`, `pnpm contrast` | Nothing | `generated.css` is fresh; `tokens.test.ts` line 168 reads `["logo", "tile"]`; the nine new pairs pass under every profile in both modes ("Contract changes and impact", row `pairs.ts`) | `tokens.test.ts`, `recipes.test.ts`, `pnpm contrast` |
| 40 | Top navigation `RecipesAndModes` | Rendering | Six boundaries; the current item keeps a visible fill and bead colour in each | Six frames; the bead has ink on `bg-active` in each (`stories-1`, `nav-look-1`) | `RecipesAndModes` play |
| 41 | Slice C's PR | The gate runs and the designer reads the stories | Nothing new | As row 12, `top-navigation.yaml`, with the sign-off's PNG paths posted as a Jira comment on ORV-252; the entry says the two-row form has no route yet | `check-catalog`, Jira comment |
| 75 | Each slice's PR | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` runs | Nothing | All four pass, real output in the PR | CI and the G3 gate |
| 78 | Breadcrumb `Default`, and Breadcrumb `CurrentInk` in its six boundaries, with the repoints of row 39 in place | Rendering | The current crumb keeps the neutral ink it has on `develop`, with no selection colour | Computed `color` of the `aria-current="page"` crumb equals `resolvedColor(current, "--ds-text-primary")` in `Default` and in each `CurrentInk` frame, and differs from `resolvedColor(current, "--cmp-nav-item-fg-active")` in each frame; the `breadcrumb` slots "current on canvas" and "current on card" of `pairs.ts` read `ds:text.primary` and pass under every profile in both modes ("Not there yet", the current crumb's ink) | `Default` play step, `CurrentInk` play, `recipes.test.ts`, `pnpm contrast` |

## Rows that render nothing

- Rows: 23, 39, 41, 75

Row 23 is a unit test, row 39 is token and contrast checks, row 41 is the catalog check and the sign-off, and row 75 is the full gate.

## Rows per PR

- PR 202: rows 23-41, 75, 78

## Where `develop` has moved

The rows keep the parent's words, and the parent's line numbers and its "no other reader" were read on an earlier `develop`. Breadcrumb and other PRs have merged since. Read each of these through the table. It adds no requirement, and the parent's wording goes to the main session.

<!-- prettier-ignore -->
| Where | Parent or design says | On `develop` now |
| --- | --- | --- |
| Row 39 | `tokens.test.ts` line 168 | Line 178 of `packages/design-system/src/tokens/tokens.test.ts`, reading `["logo", "nav-item", "tile"]` today |
| `nav-focus-1`, `design.md` rules row 14 | `recipes.css` lines 919 to 923, the Tabs form | `.ds-tabs__trigger:focus-visible`, lines 1163 to 1166 of `packages/design-system/src/recipes/recipes.css` |
| `design.md` rules row 19 | The clip list at `recipes.css` line 4715 | Lines 5467 to 5484 of the same file |
| `nav-narrow-1` | `@container ds-table` at `recipes.css` line 1340 | Line 1636 of the same file |
| Contract row of the catalog | `coverage.md` rows 55 to 58 | Top navigation is line 59 of `packages/design-system/catalog/coverage.md` |
| First contract row | `DESIGN.md` line 314 is change-log history | The change-log lines that name the bead and `brand.signature` readers are 317 and 319 of `DESIGN.md`. Lines 21 and 79 have not moved |
| Contract row `pairs.ts` | "`pairs.ts` holds no `ds:text.primary` row today" | One exists, the Page header title on `ds:surface.canvas`, line 1306 of `packages/design-system/src/recipes/pairs.ts`. None sits on `ds:surface.card`, so the skip link's pair stays new. Breadcrumb's "current on card" row reaches the same `fg` and `bg` in this PR, under its own recipe |
| Contract row `pairs.ts` | `nav-item.fg` and `nav-item.fg-active` on `ds:surface.canvas` are new | Both exist under the recipe `breadcrumb`, lines 1052 and 1080 of the same file, and this story moves line 1080 to `ds:text.primary`. The nine stay new rows under this story's recipe |
| First contract row | "No other reader of `--cmp-nav-item-*`" | Breadcrumb reads `fg`, `fg-hover` and `fg-active`. Its `fg` and `fg-hover` do not move, and this story takes it off `fg-active` ("Not there yet", the current crumb's ink) |

## Rules and bounds

This story adds no rule. Each rule keeps its one home in the parent's "Rules" (`docs/specs/ORV-225/spec.md`), and the list names what each one covers:

- `nav-item-1`: the shape of an item.
- `nav-current-1`: which item is marked. Its group step has no reader until slice D, because Top navigation holds links only.
- `nav-look-1`: the colours and the bead.
- `nav-focus-1`: the focus form.
- `nav-size-1`: heights and label type. The `sm` and drawer forms apply here.
- `nav-landmark-1`: the landmarks and their names.
- `nav-narrow-1`: the switch to the drawer. The Top navigation half applies here.
- `top-nav-1`: the root, the rows and the slots.
- `top-skip-1`: the skip link. The prop and the story land here, and the five `main` targets land in slice F.
- `frame-ink-1`: what "the text proof" means.
- `stories-1`: the story list, the `En` twins and the sign-off.

Two rules of `docs/specs/ORV-229/spec.md` keep their home there and read differently from this story on: `crumb-look-1` for the current crumb's ink, and `page-current-1` for the current page's ink and fill. "Not there yet" gives both values.

## Out of scope

- All of the parent's "Out of scope", as written.
- Rows 1 to 12, 75 and 76 on PR 189, which merged. Rows 13 to 22 and 77, slice B.
- Rows 42 to 74: the Sidebar, its groups and rail, and the app shell. That holds `CollapsibleTrigger`'s `aria-current`, `nav.collapse`, `nav.expand`, `PanelStartCloseIcon`, the web keys of "Copy", the cookie `orv-sidebar`, `id="main"` on the routes and every edit under `apps/web`.
- Any change to Page header, its tokens or its stories.
- Any change to Breadcrumb beyond the current crumb's ink: its markup, type, links, separators, ellipsis and catalog entry stay.
- Pagination itself, which is not built. This story only says what it must read.

## Open questions (with defaults)

One question opened here, because `develop` moved after the parent's v1.3. It is closed, and row 78 comes from it.

1. Closed on b). What happens to the current crumb and page when `nav-item.fg-active` and `nav-item.bg-active` move? The parent repoints both and says nothing else reads them, which held at v1.3. Breadcrumb (ORV-229, PR 196) has since merged, and its current crumb reads `--cmp-nav-item-fg-active` (`packages/design-system/src/recipes/recipes.css` line 5939). ORV-229 says a current crumb or page is a place and never takes `surface.selected` (`docs/specs/ORV-229/design.md` line 144). Pagination, not built yet, is specified on both tokens as neutral ink (`docs/specs/ORV-229/spec.md` line 132).
   - a) Repoint as the parent says. The current crumb moves from `text.primary` to `selection.fg`, violet.700 in neutral light, and `page-current-1` no longer reads true. `packages/design-system/src/components/breadcrumb/Breadcrumb.stories.tsx` line 152 reads the token, so its play stays green and nothing flags the repaint. `docs/specs/ORV-225/design.md` did not measure `selection.fg` on `surface.card`, so Breadcrumb's "current on card" pair would be new ground for row 39. Not taken: it repaints a merged component against the ORV-229 decision.
   - b) Repoint, and Breadcrumb and Pagination keep neutral ink through a value of their own. Taken: the value is `text.primary`, and "Not there yet" holds the edits, the pairs, Pagination's line and the impact list. This edits merged Breadcrumb code and its pairs under row 78, and the ORV-229 spec follows through the main session.
   - c) Leave `nav-item.*-active` and give this recipe new tokens. Not taken: it reverses the contract passed at G2 on ORV-225 under its open question 3.
   - Answered by the main session under delegation, ORV-252 comment 10601, in place of the default a) this question opened with.

Those of the parent that bear on this story keep their answers:

- 3 (the current page's look): answered, in `nav-look-1` and "Contract changes and impact".
- 7 (a skip link): default in `top-skip-1`.
- 9 (the top row's width): answered, in `shell-ia-1`, slice F. This story only provides `contentClassName`.

## Depends on

- `docs/specs/ORV-225/spec.md` v1.3 and `docs/specs/ORV-225/design.md` version 2, with the K-0204 to K-0236 entries, `DESIGN.md` sections and rule files listed in the parent's "Depends on" and "Knowledge".
- ORV-225 comments 10523 and 10532 (G1 and G2), taken from the envelope facts of `ORV-225-design-1` and `ORV-225-build-1`; Jira itself not read in this role.
- PR 189 (slice A) and PR 186 (`expectFrameCutsNoInk`), merged into `develop`.
- PR 196 (Breadcrumb), `docs/specs/ORV-229/spec.md` and `docs/specs/ORV-229/design.md`, for open question 1 and row 78.
- ORV-252 comment 10601 (the answer to open question 1), taken from the envelope facts of `ORV-252-tokens-1`; Jira itself not read in this role.
- The builder report of `ORV-252-build-1` (row 38's Check cell), taken from `.orivilo/runs/ORV-252/ORV-252-build-1/result.json`; the reload itself not reproduced in this role.
- ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- L-0016 (a slice with its own issue has its own spec).
- ADR 0003 (Radix behaviour, own visual layer), ADR 0012 (gates), ADR 0013 (qa approve on a code PR).

## Worked examples

This story derives no number and adds no method. W1 (row 23), W2 (`nav-size-1`) and W8 (row 34) stay in the parent's "Worked examples".

## Changelog

- v1.0 (2026-11-07): slice spec split from ORV-225 spec v1.3 (L-0016). Rows 23 to 41 and 75 copied with their numbers and no new requirement; row 41 names ORV-252 for its Jira comment. Open question 1 and "Where `develop` has moved" record what merged after v1.3. Downstream to review: the builder envelope (rows 23 to 41 and 75, one PR, after open question 1), the qa envelope (the Rows per PR line once the PR exists), the parent spec, which does not name ORV-252 yet and whose first contract row needs the Breadcrumb reader, and `docs/specs/ORV-229/spec.md` if open question 1 leaves its default.
- v1.1 (2026-11-07): open question 1 closed on b) (ORV-252 comment 10601). The repoints go ahead, and the current crumb reads `text.primary` directly, with no new token. "Not there yet" gains the current crumb's ink: file edits, the two pair rows, Pagination's line and the impact list. New row 78, with `pairs.ts` in the file names and in the Rows per PR note; "Why", "Where `develop` has moved", "Rules and bounds", "Out of scope" and "Depends on" follow. Rows 23 to 41 and 75 are unchanged, and "Rows that render nothing" stands, because row 78 renders. Downstream to review: the builder envelope (rows 23 to 41, 75 and 78), the qa envelope (row 78 is visual by `qa-scope-2`, so it needs a computed style reference), the first contract row of `docs/specs/ORV-225/spec.md`, and `crumb-look-1`, `page-current-1` and the pairs row of `docs/specs/ORV-229/spec.md` with their rows in `docs/specs/ORV-229/design.md`.
- v1.2 (2026-11-07): row 38's Check cell moves the proof that focus lands on the target after Enter from the `SkipLink` play to a Playwright probe on the built story, and the play keeps its other proofs plus the target's `id` and `tabIndex`. The behaviour row 38 asks for is unchanged, word for word, and it stays out of "Rows that render nothing". "Acceptance criteria" says why and names who runs the probe, "Why" counts the probe among the accessibility claims, "Depends on" names the builder report, and Rows per PR gains the line for PR 202. Downstream to review: the builder envelope (the probe has not run yet, so row 38 is not met until its `verified` row exists, and the play's `target.focus()` step and its comments should stop reading as this proof), the qa envelope (row 38's focus move is read from the probe, and PR 202 lists rows 23-41, 75 and 78), and row 38's Check cell in `docs/specs/ORV-225/spec.md`.
