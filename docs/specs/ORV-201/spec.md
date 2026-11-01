---
issue: ORV-201 (https://tpetkaew.atlassian.net/browse/ORV-201)
lane: as set on ORV-201 in Jira (not read in this role); a new component public API is an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.1 row 1 ("Spinner and Skeleton (base)")
version: 1.1
---

# ORV-201: Spinner and Skeleton (base)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, one per component, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). Every cell is from K-0108 to K-0118 (read 2026-11-01); the Ours row is the code on this branch at `02f58d0`. The Add and Do not copy rows are this spec's choices; each points to the rule in "Rules" that holds it.

### Spinner

<!-- prettier-ignore -->
| Item        | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Untitled UI | <https://www.untitledui.com/react/components/loading-indicators.md>. Types `line-simple` (default), `line-spinner`, `dot-circle`. Sizes sm 32, md 48, lg 56, xl 64 px (default sm). Slot: an optional `label` under the spinner in text-secondary. States: one (turning). No `color` prop: draws in the brand foreground token. Not announced: no role, no live region; its FAQ says to wrap it in `role="status"`. `animate-spin` with no reduced-motion rule (K-0108, K-0112).                                                                                                   |
| shadcn/ui   | <https://ui.shadcn.com/docs/components/spinner>. One lucide icon, `size-4 animate-spin`; size by a `size-*` class; no variant, size or label prop. `role="status"` and `aria-label="Loading"` on the svg itself. Used in Button and Badge through `data-icon="inline-start"` or `"inline-end"`. No reduced-motion rule (K-0110, K-0112).                                                                                                                                                                                                                                     |
| Ours        | No Spinner component, story or catalog entry. `SpinnerIcon` (lucide `LoaderCircle`, `src/components/icons.tsx` line 87) turned by the shared `.ds-spin` rule, 1 s linear infinite, commented as essential motion that keeps turning under reduced motion (`src/recipes/recipes.css` line 1401); the Task bar play asserts that no reduced-motion rule stops `.ds-spin` (`TaskBar.stories.tsx` line 162). Button: spinner in the leading slot, `aria-hidden`, a `sr-only` `role="status"` span with `loadingLabel`, `aria-busy` and `aria-disabled` while loading (`Button.tsx` lines 75 to 96). Table: `role="status"` with the spinner and visible `loadingLabel` text (`Table.tsx` lines 310 to 312). |
| Add         | A size ladder of three steps on the existing icon tokens (K-0108 has a ladder, K-0110 one size): `spin-api-1`. A visible label slot (K-0108): `spin-api-1`. The status message outside the graphic, localised and polite (K-0114, K-0115): `spin-live-1`. An explicit reduced-motion stance, since neither publisher has one (K-0112, K-0116, K-0117): `spin-motion-1`. Button's loading graphic comes from the shared Spinner (audit D.1 row 1): `spin-button-1`.                                                                                                                            |
| Do not copy | shadcn's fixed English `aria-label="Loading"` and `role="status"` on the svg: one name for every use and every locale, and a live region role on a graphic (K-0110, K-0114). Untitled's silent default: a waiting state with no status message falls short of SC 4.1.3 by our reading (K-0108, K-0115). Untitled's 32 to 64 px sizes and its three types: no token holds those sizes and no screen needs another drawing (DESIGN.md §6, one icon set). Brand foreground as the only colour (K-0108): ours reads `spin-colour-1`, because brand presence is not a state colour (DESIGN.md §8). |

### Skeleton

<!-- prettier-ignore -->
| Item        | Detail                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untitled UI | None found: <https://www.untitledui.com/react/components> lists no skeleton, the `untitleduico/react` repo has no `components/base` skeleton folder, and `skeletons.md` returns 404 (K-0109).                                                                                                                                                                                                         |
| shadcn/ui   | <https://ui.shadcn.com/docs/components/skeleton>. One div, `data-slot="skeleton"`, `animate-pulse rounded-md bg-accent`; shape and size by `className` only. Compositions shown: Avatar, Card, Text, Form, Table. No aria attribute, no reduced-motion rule (K-0111, K-0112).                                                                                                                       |
| Ours        | No Skeleton component, story or catalog entry (no "Skeleton" in `packages/design-system`, K-0118). Busy regions already set `aria-busy`: Table (`Table.tsx` line 190), Dialog (line 113), Sheet (line 102), Canvas board (line 1124).                                                                                                                                                            |
| Add         | Shape presets from tokens for the compositions shadcn shows (K-0111): `skel-shape-1`. One busy container with `aria-busy` and one polite status for the region, not per shape (K-0113, K-0114, K-0115): `skel-live-1`. A stated stance on the pulse under reduced motion and under SC 2.2.2 (K-0116, K-0117): `skel-pulse-1`.                                                                       |
| Do not copy | A bare `animate-pulse` div with nothing for assistive technology and no reduced-motion rule (K-0111, K-0112). Shape and radius by free `className` (K-0111): colour and radius utilities are forbidden in our components (`.claude/rules/design-system.md`, "Tokens and layers"), so presets read tokens. `bg-accent` as the fill: a shadcn variable, never a token name of ours (ADR 0003). |

## Goal

ORIVILO waits in many places: a button that saves, a table that loads, a board that opens, a reply that streams. Today each one draws its own spinner from `SpinnerIcon` and wires its own status line, and nothing shows the shape of content before it arrives. This story gives the design system one Spinner and one Skeleton, so every waiting state looks the same, tells a screen reader user what is happening in Thai or English, and behaves the same way when the person has asked for less motion (audit D.1 row 1, needed by the CanvasChat work of D.1 rows 3 to 7).

Nothing here is simulated: both components render real markup and read the locale catalog. The stories use fixture text from `src/components/fixtures.ts` and no mock data is shown as real.

## Story

As a person using ORIVILO, when something is loading I see the same spinner or the same placeholder shapes everywhere, I hear one short status in my language, and the screen does not pulse at me, so I know the product is working and nothing has frozen.

## Rules

### spin-api-1

`Spinner` is a new public component (`src/components/spinner/Spinner.tsx`), exported from `@orivilo/design-system`, with the contract type `SpinnerProps`:

- `size`: `sm`, `md` (default), `lg`, drawn at `size.icon.sm`, `size.icon.md`, `size.icon.lg` (16, 20, 24 px; worked example W1). No new size token.
- `label`: the status text; default the catalog key `spinner.loading`.
- `labelHidden`: the label stays in the status region but is visually hidden (`sr-only`); default false, so the label shows beside the graphic.
- `decorative`: renders the graphic only, `aria-hidden`, with no status region and no label; for a control that owns its status (`spin-button-1`).
- `className` for layout only.

The graphic is `SpinnerIcon` turned by `.ds-spin`; no second drawing and no type prop.

### spin-live-1

Unless `decorative` is set, Spinner renders one `role="status"` element (polite, atomic by default, never focused; K-0114) that holds the `aria-hidden` graphic and the label text. The svg carries no `role` and no `aria-label` (K-0110, Do not copy). With `decorative`, Spinner renders no `role="status"`. W2 maps the props to the output.

### spin-motion-1

The Spinner keeps turning under `prefers-reduced-motion: reduce`: it is essential motion in the sense of SC 2.3.3 and C39 test step 2 (K-0116) and of SC 2.2.2 Note 4 (K-0117), and the label (visible or hidden, `spin-live-1`) carries the state, so motion is never the only carrier. No reduced-motion rule targets `.ds-spin` or `.ds-spinner`, as the comment at `recipes.css` line 1401 and the Task bar play at line 162 already hold. The chat mark's own rule (`recipes.css` line 4627) is unchanged and out of scope. The designer confirmed this stance in design.md (open question 1).

### spin-colour-1

A standalone Spinner draws in the new component token `spinner.fg`, which references `text.secondary`, listed as a text pair (floor 4.5, because the label reads the same token as the ring; design.md D7) on `ds:surface.canvas` and on `ds:surface.card` in `src/recipes/pairs.ts`. A `decorative` Spinner takes `currentColor`, so inside a Button it keeps the label's ink.

### spin-button-1

Button's loading state renders `<Spinner decorative />` in its leading icon slot in place of the inline `SpinnerIcon` (`Button.tsx` line 76). Its own `sr-only` `role="status"` with `loadingLabel` or `button.working`, its `aria-busy`, `aria-disabled` and click block stay as they are. A loading Button holds exactly one `role="status"`, Button's own. The Button public API does not change.

### skel-shape-1

`Skeleton` is a new public component (`src/components/skeleton/Skeleton.tsx`), exported from `@orivilo/design-system`, with the contract type `SkeletonProps`:

- `shape`: `text` (default, one line), `block`, `circle`.
- `text` draws its bar as a `::before` that takes `shape.control.radius`; `block` takes `shape.media.radius`; `circle` is round in every profile by `clip-path: circle(50%)` with no `border-radius` (design.md D8, D9, D11).
- The fill is the new component token `skeleton.bg`, which references `border.subtle` (the Progress track's ground, `pairs.ts` line 13).
- Width, and height for `block` and `circle`, come from the caller's layout utilities (Tailwind width and height are layout, `.claude/rules/design-system.md`); `circle` keeps a 1 to 1 aspect.
- Every Skeleton is `aria-hidden="true"`.

`skeleton.bg` is not a listed contrast pair: the shape is hidden from assistive technology and the status of `skel-live-1` carries the state, so WCAG 1.4.11 does not apply to it; `pairs.ts` gets a "Not listed" line saying so, as it does for `progress.track`. The `text` line height is `type.body.sm`: the host is one line box of it (worked example W3) and the drawn bar is inset by the half leading (design.md D8). No new token.

### skel-live-1

`SkeletonGroup` (same file, contract type `SkeletonGroupProps`) wraps the shapes of one loading region. It sets `aria-busy="true"` on itself (K-0113) and renders one visually hidden `role="status"` with `label`, default the catalog key `skeleton.loading`, however many shapes it holds (K-0114, K-0115). A Skeleton outside a group is allowed only inside a region that owns its own status (the catalog entry says so). Replacing the group with the content is the caller's; the group announces nothing when it unmounts.

### skel-pulse-1

A Skeleton is static: no animation and no transition, with or without `prefers-reduced-motion`. Reasons: DESIGN.md §3.3 makes the engine at work the only looping motion and a page waiting for data is not the engine; a pulse beside usable content that runs past five seconds falls under SC 2.2.2 at Level A (K-0117); and a pulse needs a loop duration no motion token holds (`motion.feedback`, `motion.overlay`, `motion.page`, DESIGN.md §3.3).

## Contract changes and impact

<!-- prettier-ignore -->
| Change                                                                                              | Layer            | Impact                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Spinner`, `SpinnerProps` (`spin-api-1`)                                                            | Component API    | New export in `src/index.ts`; new catalog entry `catalog/base/spinner.yaml`; a new Spinner row in `coverage.md` (it has none today; line 57 is "Loading state")                                            |
| `Skeleton`, `SkeletonProps`, `SkeletonGroup`, `SkeletonGroupProps` (`skel-shape-1`, `skel-live-1`) | Component API    | New exports in `src/index.ts`; new catalog entry `catalog/base/skeleton.yaml`; a new Skeleton row in `coverage.md`                                                              |
| Recipe classes `ds-spinner` and `ds-skeleton` (with `data-size`, `data-shape`)                     | Recipe           | `recipes.css`; `recipes.test.ts` checks every value is a `--cmp-*` or `--ds-*` property                                                                                     |
| Component tokens `spinner.fg` (to `text.secondary`) and `skeleton.bg` (to `border.subtle`)          | Component token  | `component.json`, regenerated `generated.css` (`pnpm --filter @orivilo/design-system tokens`); no semantic or profile change; `pairs.ts` two text pairs at floor 4.5 for `spinner.fg` (`spin-colour-1`), one "Not listed" line for `skeleton.bg` |
| Locale keys `spinner.loading` and `skeleton.loading`                                                | Copy             | `src/i18n/messages/th.ts` and `en.ts`; `check-i18n`                                                                                                                         |
| Button loading graphic from `Spinner` (`spin-button-1`)                                             | Internal         | `Button.tsx` line 76; every Button story that renders `loading`: `Loading` (line 218) and `LoadingWithIcons` (line 307) stay green; Button API unchanged |

Not changed: `SpinnerIcon`, `.ds-spin`, Table, Canvas board, Canvas chat, Task bar and Progress markup (Out of scope).

### Copy

<!-- prettier-ignore -->
| Key                | Thai               | English           |
| ------------------ | ------------------ | ----------------- |
| `spinner.loading`  | กำลังโหลด          | Loading           |
| `skeleton.loading` | กำลังโหลดเนื้อหา    | Loading content   |

## Acceptance criteria

Stories: `Base/Spinner` (id `base-spinner`) and `Base/Skeleton` (id `base-skeleton`), each a new `*.stories.tsx` beside its component. Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); an `InEnglish` story nests `LocaleProvider locale="en"`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | Spinner `Default` renders | A turning ring at 20 px with "กำลังโหลด" beside it | None. One `role="status"` holding "กำลังโหลด"; the svg is `aria-hidden="true"` with no `role` and no `aria-label` (`spin-live-1`) | `Default` play: `getAllByRole("status")` length 1 with that text; svg attributes asserted |
| 2 | Same | Spinner `LabelHidden` renders (`labelHidden`) | The ring alone, no visible text | None. The status still holds "กำลังโหลด" | `LabelHidden` play: status text present, the label's box is the `sr-only` 1 by 1 px |
| 3 | Same | Spinner `Sizes` renders sm, md, lg | Three rings, 16, 20 and 24 px | None | `Sizes` play: each svg `getBoundingClientRect` width and height equal W1's values to 0.5 px |
| 4 | Same | Spinner `Decorative` renders (`decorative`) | The ring alone | None. No `role="status"` in the story; svg `aria-hidden` (`spin-live-1`) | `Decorative` play: `queryAllByRole("status")` length 0 |
| 5 | Same, any motion setting | Spinner `ReducedMotion` renders | The ring turning and "กำลังโหลด" visible | None. No `prefers-reduced-motion` media rule in any loaded sheet sets `animation` on `.ds-spin` or `.ds-spinner` (`spin-motion-1`) | `ReducedMotion` play: computed `animationName` is `ds-spin`, and the stylesheet walk of the Task bar play (line 139) finds no such rule |
| 6 | Same, English | Spinner `InEnglish` renders with and without `labelHidden` | "Loading" beside the ring, then the ring alone | None. Both statuses hold "Loading" | `InEnglish` play |
| 7 | Storybook, a 360 px frame | Spinner `LongLabelAt360` renders with the fixture `longThai` as `label` | The label wraps beside the ring with no horizontal scroll and no clipped Thai marks | None | `LongLabelAt360` play: frame `scrollWidth` not above 360, `expectNoGlyphClip` on the label (`src/testing/visual-asserts.ts`) |
| 8 | Storybook test project | Spinner `RecipesAndModes` renders through `Matrix` | The labelled spinner in six boundaries: neutral, professional, friendly, each in light and dark | None. The `spinner.fg` pairs of `spin-colour-1` pass at their floor under each of the six | `RecipesAndModes` play renders six cells; `recipes.test.ts` and `pnpm contrast` |
| 9 | Storybook test project, Button | Button `Loading` and `LoadingWithIcons` render | The button as today: label kept, spinner in the leading slot, "กำลังดำเนินการ" announced | None. The spinner is a `decorative` Spinner; the button holds exactly one `role="status"` (`spin-button-1`) | The existing plays (`Button.stories.tsx` lines 218 and 307) unchanged and green, plus one assertion in `LoadingWithIcons` that `button.querySelectorAll('[role="status"]')` has length 1 |
| 10 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/spinner.yaml` (story `base-spinner`, status `draft`, recipes neutral, professional, friendly) resolves; `spinner.loading` exists in Thai and English; no middot or em dash in either file | `pnpm --filter @orivilo/design-system test` output (check-catalog, `i18n.test.ts`, `check-i18n`) |
| 11 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Spinner `Default`, `Sizes`, `LabelHidden`, `Decorative`, Button `Loading` | The same ring in each, legible label, the ring inside Button in the label's ink | None | Designer visual sign-off with screenshots in design.md, including the answer to open question 1 |
| 12 | Storybook test project, neutral, light, Thai | Skeleton `Shapes` renders `text`, `block`, `circle` | A grey line, a rounded block and a circle, no motion | None. Each shape is `aria-hidden="true"`; `circle` computed `clipPath` is `circle(50%)` and width equals height; `block` corner radius equals the resolved `--ds-shape-media-radius`; `text` `getComputedStyle(el, "::before").borderTopLeftRadius` equals the resolved `--ds-shape-control-radius`, and the `text` host height equals `font-size * line-height` of `type.body.sm` (W3) to 0.5 px (`skel-shape-1`) | `Shapes` play on computed `border-radius`, `clipPath` and boxes |
| 13 | Same | Skeleton `Loading` renders a `SkeletonGroup` with one circle, three text lines and one block | The five shapes in a card layout | None. The group has `aria-busy="true"` and exactly one `role="status"` holding "กำลังโหลดเนื้อหา" (`skel-live-1`) | `Loading` play: `getAllByRole("status")` length 1 with that text, group attribute asserted |
| 14 | Same, any motion setting | Skeleton `Loading` renders | The shapes stay still | None. Each of the five shapes has computed `animationName` `none` and `transitionDuration` `0s` (`skel-pulse-1`) | A step in the `Loading` play |
| 15 | Same, English | Skeleton `InEnglish` renders the group | The same shapes | None. The status holds "Loading content" | `InEnglish` play |
| 16 | Storybook, a 360 px frame | Skeleton `At360` renders the `Loading` composition | Every shape inside the frame, no horizontal scroll | None | `At360` play: frame `scrollWidth` not above 360 and each shape's right edge within the frame |
| 17 | Storybook test project | Skeleton `RecipesAndModes` renders through `Matrix` | The `Loading` composition in six boundaries: neutral, professional, friendly, each in light and dark | None | `RecipesAndModes` play renders six cells; `recipes.test.ts` passes with the `skeleton.bg` "Not listed" line |
| 18 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/skeleton.yaml` (story `base-skeleton`, status `draft`, recipes neutral, professional, friendly) resolves; `skeleton.loading` exists in Thai and English; no middot or em dash | `pnpm --filter @orivilo/design-system test` output |
| 19 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Skeleton `Shapes`, `Loading`, `At360` | The shapes visible on the canvas and on a card in both modes, the composition reading as the content it stands for | None | Designer visual sign-off with screenshots in design.md, including the answer to open question 2 |
| 20 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/spinner src/components/skeleton src/components/button src/components/task-bar` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

Rows 1 to 11 are the Spinner and its Button use; rows 12 to 19 the Skeleton; row 20 both.

## Rows per PR

No PR exists while this spec is written, and the recorder (`scripts/ovl/result-recorder.mjs`, `qa-scope-1`) marks a list line without a PR number as malformed, so this section holds no list line yet (open question 5). Per open question 4 (decided: one PR), the single PR covers rows 1 to 20, and the main session adds its one line when the PR opens.

## Out of scope

- Moving Table (`Table.tsx` line 311), Canvas board (`CanvasBoard.tsx` line 1175), Canvas chat (`CanvasChat.tsx` line 554), Canvas node (`CanvasNode.tsx` line 168) and Task bar to `Spinner`. Follow-up card; their markup already meets `spin-live-1` in substance.
- A loading-state page pattern (audit section A, "Loading state", application tier).
- A determinate or indeterminate bar: that is Progress.
- New spinner drawings, colours per profile, or sizes above `size.icon.lg`.
- Any semantic token, profile or `apps/web` change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. Spinner motion under `prefers-reduced-motion`. Options: (a) keep turning as essential motion, with the label as the carrier (K-0116 C39 step 2, K-0117 Note 4); (b) stop the turn and show the static ring, as the chat mark does (`recipes.css` line 4627), which reverses the Task bar play at line 162 and the comment at line 1401; (c) slow the turn. Default: (a), which is `spin-motion-1`; the designer confirms or picks (b) at sign-off (K-0118, open point 2), and (b) adds the Task bar play to the impact list. Answered: (a), confirmed in design.md, "Answers to the open questions" row 1.
2. Skeleton pulse. Options: (a) static in every motion setting (K-0117, DESIGN.md §3.3); (b) an opacity pulse that stops under reduced motion (K-0112, K-0116), which needs a new semantic loop duration (L lane, impact list) and a pause mechanism or a five second cap for SC 2.2.2 (K-0117); (c) a pulse copied from shadcn (K-0111). Default: (a), which is `skel-pulse-1`. Answered: (a), confirmed in design.md, "Answers to the open questions" row 2.
3. Live-region ownership. Options: (a) Spinner owns one status unless `decorative`, and `SkeletonGroup` owns one status for its shapes (K-0113, K-0114, K-0115); (b) both are silent graphics and every caller wires its own status, as Untitled and shadcn's Skeleton leave it (K-0108, K-0111); (c) the status on the graphic, as shadcn's Spinner (K-0110). Default: (a), which is `spin-live-1` and `skel-live-1`. Decided: (a), under the owner's delegation, ORV-201 comment 10465.
4. PR size. Both components, stories, catalog entries, tokens and copy are estimated at about 550 changed lines, over the 400-line guide. Options: (a) two PRs split vertically, Spinner with its Button use first, then Skeleton; (b) one PR with the review sized to it (ORV-146). Default: (a). Decided: (b), one PR for rows 1 to 20, under the owner's delegation, ORV-201 comment 10465.
5. The Rows per PR lines. Default: the main session adds the `- PR <n>: rows ...` line in the form `qa-scope-1` reads when the PR opens, per open question 4, with a changelog line.
6. The visible label's place beside or under the ring. Untitled puts it under (K-0108); Table puts it under (`.ds-table__status-inner` is a column, `recipes.css` line 1315). Default: beside for `sm` and `md`, under for `lg`, set by the designer in design.md with existing space tokens. Answered: beside for `sm` and `md`, under for `lg`, in design.md, "Answers to the open questions" row 6 and D4.

## Depends on

- `docs/knowledge/design/K-0108` to `K-0118` (benchmark and standards, 2026-11-01).
- `docs/specs/ORV-64/audit.md` section B (table form) and section D.1 row 1 (the story and its done-when).
- `DESIGN.md` §3.3 (motion), §6 (icons), §7 (loading state), §8 (colour roles), §11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers").
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` (the Rows per PR form).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).
- `docs/specs/ORV-201/design.md` (answers to open questions 1, 2 and 6; D7, D8, D9, D11; "Spec amendments this design needs (L-0019)").
- ORV-201 comment 10465 (open questions 3 and 4, decided under delegation).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The sizes of `spin-api-1`. Input: `size.icon.sm`, `.md`, `.lg` reference `size.icon-4`, `icon-5`, `icon-6` (`semantic.json` lines 875 to 885), whose values are `16px`, `20px`, `24px` (`primitives.json` lines 557 to 567). Expected output, integers, no rounding: `sm 16 md 20 lg 24`.

```bash
node -e 'const p=require("./packages/design-system/src/tokens/source/primitives.json");const f=o=>{for(const[k,v]of Object.entries(o)){if(k==="icon-4"||k==="icon-5"||k==="icon-6")return o;if(v&&typeof v==="object"){const r=f(v);if(r)return r}}};const s=f(p);console.log("sm",parseInt(s["icon-4"].$value),"md",parseInt(s["icon-5"].$value),"lg",parseInt(s["icon-6"].$value))'
```

W2. The output map of `spin-live-1`: props to the number of `role="status"` elements, the label's visibility and the svg's `aria-hidden`. Input: four prop sets. Expected output: `default 1 visible true`, `labelHidden 1 hidden true`, `decorative 0 none true`, `decorative+label 0 none true`.

```bash
node -e 'const out=p=>p.decorative?[0,"none",true]:[1,p.labelHidden?"hidden":"visible",true];for(const[n,p]of [["default",{}],["labelHidden",{labelHidden:true}],["decorative",{decorative:true}],["decorative+label",{decorative:true,label:"x"}]])console.log(n,...out(p))'
```

W3. The `text` host height and bar inset of `skel-shape-1` (AC 12). Input: `type.body.sm` references `font.size.14` and `font.line-height.1-7` (`semantic.json` lines 1011 to 1016), whose values are `14px` and `1.7` (`primitives.json` lines 618 to 621 and 676 to 679). Expected output, rounded to one decimal: `host 23.8 inset 4.9 bar 14.0`.

```bash
node -e 'const p=require("./packages/design-system/src/tokens/source/primitives.json");const g=(o,k)=>{for(const[n,v]of Object.entries(o)){if(n===k&&v&&v.$value!==undefined)return v.$value;if(v&&typeof v==="object"){const r=g(v,k);if(r!==undefined)return r}}};const fs=parseFloat(g(p.font.size,"14")),lh=Number(g(p.font["line-height"],"1-7"));const h=fs*lh,i=fs*(lh-1)/2;console.log("host",h.toFixed(1),"inset",i.toFixed(1),"bar",(h-2*i).toFixed(1))'
```

## Changelog

- v1.0 (2026-11-01): first version, from K-0108 to K-0118 at `02f58d0` and audit D.1 row 1. Downstream to review: the designer envelope (design.md, open questions 1, 2 and 6, the `text` line height of `skel-shape-1`), the builder envelopes (rows 1 to 20, split per open question 4), the qa envelope (Rows per PR lines once the PRs exist), and `catalog/coverage.md`.
- v1.1 (2026-11-01): the four amendments of design.md "Spec amendments this design needs (L-0019)": AC 12 checks the `circle` by `clipPath` and the `text` radius on `::before` with the host height (W3 added); `spin-colour-1`, the contract table and AC 8 list the `spinner.fg` pairs at floor 4.5; `skel-shape-1` names `type.body.sm` as the `text` line height and `circle` as round by `clip-path`. Open questions 1, 2 and 6 answered by design.md; 3 (a) and 4 (b, one PR) decided under delegation, ORV-201 comment 10465; Rows per PR names one PR for rows 1 to 20. Downstream to review: the builder envelope (one PR, rows 1 to 20, AC 8 and AC 12), the qa envelope (one Rows per PR line), and design.md (front matter cites spec v1.0).
