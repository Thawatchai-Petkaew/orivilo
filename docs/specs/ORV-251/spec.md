---
issue: ORV-251 (https://tpetkaew.atlassian.net/browse/ORV-251), slice B of ORV-225 (https://tpetkaew.atlassian.net/browse/ORV-225), Section header
lane: L (as ORV-225, by the parent's reading of the risk flag "component public API"; Jira not read in this role)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
parent: docs/specs/ORV-225/spec.md v1.3, with docs/specs/ORV-225/design.md version 2
version: 1.0
---

# ORV-251: Section header (ORV-225 slice B)

## Why

ORV-225 asks for four named parts, so the Studio shell and the reference screen use a component with a catalog entry, a story and a contract instead of inline markup. The full reasoning is in the parent's "Goal" and applies here as written.

The parent's "Rows per PR" plans six PRs, one deliverable each. PR 189 carried slice A, Page header (rows 1 to 12, 75 and 76). This issue is slice B, Section header, split out so it has its own acceptance, its own PR and its own qa walk (L-0016). It adds no requirement and no gate.

What is real and what is not: Section header renders real markup, and it is plain elements on a recipe with no behaviour of its own. The workspace screen's projects and members stay Thai fixture data, labelled "ข้อมูลตัวอย่าง" as they are today, and the words in the stories are mock. No screen reader test has been run, and accessibility claims stop at the plays below. The forms of row 77 were measured on injected markup, so its plays are the first run of them on the real component.

## Story

As a builder of a screen, I place a Section header from the catalog and get the right heading level, spacing and stacking without writing them again. As a person working in the Studio, I read what each block of a screen holds, and its actions stay beside or under the title with the title still readable.

## What this story uses from ORV-225 (linked, not copied)

- **Spec:** `docs/specs/ORV-225/spec.md` v1.3: the "Section header" table of "Benchmark", the rules listed under "Rules and bounds" below, the Section header and recipe rows of "Contract changes and impact", and W6, W7 and W10 of "Worked examples".
- **Design:** `docs/specs/ORV-225/design.md` version 2 (its `spec:` line reads v1.3): "Slice B, Section header" (rows 6 to 10, with 8a), the "Section header" recipe block and the note under it on shared selectors and block order, the Section header part of "Finding F1" (its frames, floor and measurements), the Section header column of "States", amendments 5, 6, 7, 13, 17, 19 and 21, and the note in "Seen but out of scope" that slice B's sign-off reads the live row on the real wrapper.
- **Gates:** the G1 and G2 comments on ORV-225 cover this slice: G1 is ORV-225 comment 10523, G2 is ORV-225 comment 10532. G3 is raised on this issue.
- **Already on `develop` from PR 189:**
  - `PageHeader`, `PageHeaderProps` and `HeadingLevel`, exported from `packages/design-system/src/components/index.ts`.
  - The `ds-page-header` recipe in `packages/design-system/src/recipes/recipes.css`, with the wrap and basis of row 4a of `docs/specs/ORV-225/design.md`. Its `__row`, `__description` and `__actions` selectors do not name Section header yet.
  - `pageHeaderFixtures` in `packages/design-system/src/components/fixtures.ts`, with `moreActions` and `longAction`, the labels row 77 uses.
  - `headingLevel` on `WorkspaceScreen`, and Page header on the three example screens.
  - `packages/design-system/catalog/application/page-header.yaml` and its row in `packages/design-system/catalog/coverage.md`. The entry's line 27 and `states` are the model for the new entry (amendment 21 of `docs/specs/ORV-225/design.md`).
  - `expectStacked`, `expectActionsUnder`, `expectActionsBeside` and `tokenPx` in `packages/design-system/src/components/page-header/PageHeader.stories.tsx`. They are local to that file and read `.ds-page-header` and its own floor, so rows 15 and 77 need Section header forms of them. These are test helpers, not a contract.
- **Already there from other work:** `expectEdgeInk`, `expectInkClearsAbove`, `expectTitleOverText`, `expectLinesClear` and `expectFrameCutsNoInk` in `packages/design-system/src/testing/visual-asserts.ts`, `captionHidden` on `Table`, and `Tabs`.
- **Not there yet, so this story adds it:**
  - `SectionHeader` and `SectionHeaderProps` in `packages/design-system/src/components/section-header/`, exported from `packages/design-system/src/components/index.ts`.
  - `packages/design-system/src/components/section-header/SectionHeader.stories.tsx`, with the stories of `stories-1`.
  - The `ds-section-header` recipe, and its names added to the three shared selectors.
  - `packages/design-system/catalog/application/section-header.yaml`, and the "Section header" row of `packages/design-system/catalog/coverage.md`, which reads `none` today.
  - The story copy in `packages/design-system/src/components/fixtures.ts`.
  - The edit of `packages/design-system/src/examples/workspace.tsx` by `reference-adopt-1`. The line numbers in that rule predate PR 189: the selection row now sits at lines 363 to 372.
- **Order:** the PR title starts `ORV-251: ...`. Slice B can run beside slice C, and neither waits on the other.

## Acceptance criteria

Rows 13 to 22, 75 and 77 keep their numbers from the parent at v1.3. Row 76 is not here: it is Page header's, in PR 189. Row by row against the parent:

- Rows 13 to 21: the parent's wording, no change.
- Row 22: its Data effect cell adds "on ORV-251" after "posted as a Jira comment", since `stories-1` posts the sign-off on the issue and this is that issue. Nothing else in the row changes.
- Row 75: the parent's wording, no change. In this spec it applies to this issue's PR.
- Row 77: the parent's wording, no change.

No row drops anything for PR 189, because none of these rows holds work that PR merged.

Everything these rows name from outside them is the parent's:

- The opening paragraph of the parent's "Acceptance criteria" gives the locale of the plays, the `En` twins, the meaning of "a text proof", and where rows 76 and 77 take their frames and checks.
- Rows 4, 5, 11, 12 and 76, which rows 15, 21, 22 and 77 read through "As row", are in the parent's table. Their Page header plays merged in PR 189, and the rows here apply them to `.ds-section-header`.
- "Slice B" is this issue. W7 is the parent's.
- `design.md` is `docs/specs/ORV-225/design.md`.
- `section-header.yaml` is `packages/design-system/catalog/application/section-header.yaml`.
- `recipes.test.ts` is `packages/design-system/src/recipes/recipes.test.ts`.
- `SectionHeader.stories.tsx` is `packages/design-system/src/components/section-header/SectionHeader.stories.tsx`.
- The Workspace plays are in `packages/design-system/src/examples/workspace.stories.tsx`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 13 | Section header `Default`, Thai | Rendering | "โปรเจกต์ในเวิร์กสเปซ" as a section title with a description under it, the header form's gap between them | One `getByRole("heading", { level: 2 })`; `expectTitleOverText(title, description, { gap: 8, header: true })` passes (`header-type-1`) | `Default` play |
| 14 | `DefaultEn`, `TitleOnly` | Rendering | "Projects in this workspace"; then the title alone | English title; no description node in `TitleOnly` (`section-header-1`) | `DefaultEn`, `TitleOnly` plays |
| 15 | `WithActions` at 1280; `Narrow` at 360 px | Rendering | Wide: the action in position at the end edge. Narrow: under the title on one start edge | As rows 4 and 5, on `.ds-section-header` (`header-stack-1`) | `WithActions`, `Narrow` plays |
| 16 | `WithTabs` | Rendering, then pressing the second tab | A tab row under the title; the second tab selected | The tablist follows the title row in DOM order; the title row keeps its height after the press (`section-header-1`) | `WithTabs` play |
| 17 | `WithDivider`; `Default` | Rendering | A line under the block in `WithDivider`, no line in `Default` | `expectEdgeInk` finds the edge in `WithDivider` and not in `Default` (`section-header-1`) | `WithDivider` play |
| 18 | `LongTitle`, 360 px | Rendering | The title wraps; no line's marks overlap the line above | The text proof for the section header title passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip, `frame` the `.ds-section-header` (`frame-ink-1`, W7) | `LongTitle` play |
| 19 | `HeadingLevel`, level 5, `id="s1"`, a region with `aria-labelledby="s1"` | Rendering | The title at its usual size | Heading is `h5` with `id` `s1`; `getByRole("region", { name })` finds the region (`section-header-1`, `heading-level-1`) | `HeadingLevel` play |
| 20 | Workspace `Default` and `ArchiveSelected` | Rendering, then selecting a row | "โปรเจกต์ในเวิร์กสเปซ" as a section title over the table, in position under the page header; the selection count and archive button on its end edge | `getByRole("table", { name: "โปรเจกต์ในเวิร์กสเปซ" })` still finds the table; the count's wrapper keeps `aria-live="polite"`; `expectInkClearsAbove(title, pageHeader)` passes; existing plays pass (`reference-adopt-1`) | Workspace plays |
| 21 | Section header `RecipesAndModes` | Rendering | Six boundaries, title and description readable in each colour set | As row 11 | `RecipesAndModes` play |
| 22 | Slice B's PR | The gate runs and the designer reads the stories | Nothing new | As row 12, `section-header.yaml`, with the sign-off's PNG paths posted as a Jira comment on ORV-251 | `check-catalog`, Jira comment |
| 75 | Each slice's PR | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` runs | Nothing | All four pass, real output in the PR | CI and the G3 gate |
| 77 | `ManyActions`, `ManyActionsEn`, six frames at containers 479, 480 and 520 | Rendering | At 480 two, three and four actions in position under the title block, on the same start edge; one action beside it at the end edge; at 479 one action under; two actions beside at 520 | As row 76 on `.ds-section-header`, the floor reading `--ds-size-panel-min` (`header-stack-1`) | `ManyActions`, `ManyActionsEn` plays of `SectionHeader.stories.tsx`, on the component slice B builds. `design.md` specifies this play and has not run it: its forms were measured on injected markup, so these plays are the proof |

## Rows that render nothing

- Rows: 22, 75

Row 22 is the gate and the sign-off, and row 75 is the four checks. Both are in the parent's list.

## Rows per PR

No line yet: this issue's PR has no number. The main session adds one when the PR exists, in the form `qa-scope-1` reads, with a changelog line. Until then every row of the table is in scope for qa.

## Rules and bounds

This story adds no rule. Each rule keeps its one home in the parent's "Rules", and the list names what each one covers:

- `section-header-1`: the props, the divider, and what follows the title row.
- `heading-level-1`: the heading level and who sets it.
- `header-type-1`: the title and description type.
- `header-stack-1`: how the title block and the actions share a row or leave it.
- `frame-ink-1`: the text proof inside a frame.
- `reference-adopt-1`: what the reference screen takes.
- `stories-1`: the story list, the `En` twins and the designer's sign-off.

## Out of scope

- All of the parent's "Out of scope", as written.
- Rows 1 to 12 and 76, which merged in PR 189, and rows 23 to 74, which belong to slices C to F.
- Any change to `PageHeaderProps` or to a value in the Page header recipe. Adding Section header's names to the shared selectors changes neither.
- Any change to `Tabs`, `Table` or a token.

## Open questions (with defaults)

This story opens no requirement. One gap in the copy is recorded with its default:

- The story copy the parent does not name. Rows 13 and 14 name the titles and row 77 uses the `pageHeaderFixtures` labels, but no row names the description under the title in `Default`, or the action label in `WithActions` and `Narrow`. Options: the builder writes them, or the parent names them first. Impact: none on any row, since no row reads those words. Default: the builder adds them to `packages/design-system/src/components/fixtures.ts` as mock copy, Thai and English together.

The parent's question that bears on Section header stays in its "Open questions" and its default holds:

- 2 (the heading order bar): default in `heading-level-1`.

## Depends on

- `docs/specs/ORV-225/spec.md` v1.3 and `docs/specs/ORV-225/design.md` version 2, with the K entries, `DESIGN.md` sections and rule files listed in the parent's "Depends on" and "Knowledge".
- The G1 and G2 comments on ORV-225: comments 10523 (G1) and 10532 (G2).
- PR 189 (slice A), merged into `develop`, and PR 186 (`expectFrameCutsNoInk`).
- ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- L-0016 (a slice with its own issue has its own spec).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates), ADR 0013 (qa approve on a code PR).

## Worked examples

This story derives no number and adds no method. W6 (the level of the screen's section header), W7 (row 18) and W10 (row 77, through `header-stack-1`) stay in the parent's "Worked examples".

## Changelog

- v1.0 (2026-11-07): slice spec split from ORV-225 spec v1.3 (L-0016). Rows 13 to 22, 75 and 77 copied with their numbers and no new requirement; row 22 names ORV-251 for its Jira comment. Downstream to review: the builder envelope (these rows, one PR), the qa envelope (the Rows per PR line once the PR exists), the designer's sign-off, and the parent spec, which does not name ORV-251 yet.
