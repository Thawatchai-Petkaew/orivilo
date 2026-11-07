---
issue: ORV-222 (https://tpetkaew.atlassian.net/browse/ORV-222)
lane: L (a new component public API is an L-lane risk flag, AGENTS.md "Lanes and gates"; G1 and G2 pass under the owner's delegation during the POC, ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 19 ("Alert and FeaturedIcon")
version: 1.4
---

# ORV-222: Alert and FeaturedIcon (base)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, one per component, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). Every cell is from K-0158 to K-0170 (read 2026-11-06). The Add and Do not copy rows are this spec's choices from the candidates in K-0170; each points to the rule in "Rules" that holds it.

### Alert

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/alerts>. Variants: `AlertFloating`, `AlertFullWidth`; colours default, brand, gray, error, warning, success. Sizes: none named. States: none named beyond dismissible and confirmable. Slots: a featured icon picked by colour (InfoCircle for default, brand and gray; AlertCircle for error and warning; CheckCircle for success); `title` a string; `description` a node, cut to one line from `md` up; `onConfirm` with `confirmLabel`; `onClose` with `dismissLabel`, default Dismiss, also the close button's label; `actionType` button or link, full width only. Accessibility: the page names no role, live region, keyboard or focus, and the public repo's `components/application` lists no alerts, so this stays unknown. All K-0158. |
| shadcn/ui | <https://ui.shadcn.com/docs/components/alert>. Variants: `default`, `destructive`; both keep `bg-card`, the ink changes. Sizes: none. States: none. Slots: an icon child, `AlertTitle`, `AlertDescription`, `AlertAction` at the top right (`new-york-v4` has no `AlertAction`). No dismiss. A warning look comes from custom classes `bg-amber-50 dark:bg-amber-950`. Accessibility: nothing on the page; `role="alert"` on the root in the three registry files read, whatever the variant. All K-0160. |
| Ours | No Alert: `audit.md` line 65 reads none, with "build: inline banner, feedback tokens only"; `coverage.md` has no Alert row. Toast: variants neutral, success, danger (`Toast.tsx` line 9), with title, description, action and a close named from the locale catalog (line 143); danger is assertive and stays until dismissed (`toast.yaml` lines 22 and 29); it sits on `surface.inverse` (`component.json` line 545). Badge: six variants, sizes sm and md, the word carries the meaning (`badge.yaml` line 27). Inline errors: a `role="alert"` node in `Field.tsx` line 110, `Checkbox.tsx` line 94, `Dialog.tsx` line 144, `Sheet.tsx` line 130 and `Table.tsx` line 320, each mounted together with its message. `CanvasNode.tsx` line 219 shows a failed node's `WarningIcon` with no role. Tokens: `feedback.{success,warning,danger,info}.{fg,surface,border}` (`DESIGN.md` lines 82 to 93), closed to profiles (line 161); fg on its own surface is a text pair (`contrast-pairs.ts` lines 86 to 91); border is listed as decorative (line 162). Icons: `WarningIcon`, `CheckIcon`, `CloseIcon`, `RetryIcon`; no info glyph. All K-0170, line numbers re-read for this spec. |
| Add | Four kinds, and the slots tile, title, description, action, optional close, with the close named from the locale catalog (K-0158, K-0160): `alert-api-1`. A description that wraps and says the fix (K-0158): `alert-copy-1`. A live role set by what the message says (K-0162, K-0164, K-0166): `alert-live-1`. A form with no role for a message already on the page (K-0163): `alert-load-1`. A story whose role node exists before its text (K-0165, K-0166): `alert-mount-1`. A story test that focus does not move (K-0162, K-0163): `alert-focus-1`. A different shape per kind as well as colour (K-0167): `fi-glyph-1`. |
| Do not copy | `brand`, `gray` and `default` colours: D.3 row 19 says four feedback kinds only, and `DESIGN.md` section 8 keeps brand apart from any feedback (K-0158): `alert-api-1`. One icon for error and warning: on the icon alone only colour tells them apart, against `DESIGN.md` section 7 (K-0158, K-0167): `fi-glyph-1`. Description cut to one line and the `line-clamp-1` title of `new-york-v4`: either can hide the fix, and our fixtures include a long Thai name without spaces (K-0158, K-0160): `alert-copy-1`. `AlertFullWidth`: D.3 row 19 asks for inline errors and `audit.md` line 65 for an inline banner, while this form runs edge to edge (K-0158): `alert-look-1`. `role="alert"` on every variant: the SC 4.1.3 page lists it as a failure on content that is not important and time-sensitive (K-0160, K-0164): `alert-live-1`. Custom classes such as `bg-amber-50`: colour utilities are forbidden and `feedback.*` already has warning (K-0160): `alert-look-1`. English default "Close" on the button: every UI string comes from the locale catalog (K-0158): `alert-api-1`. A required close: ARIA 1.2 says authors should not require it (K-0162): `alert-stay-1`. Moving focus to the alert: that is `alertdialog` (K-0162, K-0163): `alert-focus-1`. |

### FeaturedIcon

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/featured-icons>. Themes: light (default), gradient, dark, outline, modern, modern-neue. Colours: brand (default in the source), gray, success, warning, error, no info; modern-neue gray only. Sizes: sm (default), md, lg, xl, given as 32, 40, 48 and 56 px containers for every theme except outline. States: none named. Slots: `icon`, a component or an element; `children`; `className` merged last, so it can change the shape. Accessibility: no `role` or `aria-*` in the lines read and no word on it on the page. All K-0159. |
| shadcn/ui | No featured icon among the 66 index names, on the fetch tool's count (K-0161). Nearest: `EmptyMedia` variant `icon`, a muted square; `ItemMedia` variant `icon`, which sets only the svg size; the alert dialog's media tile, `bg-muted size-10 rounded-md` (K-0161). None shows a status colour in what was read (K-0161). In Alert the icon is a bare child with no tile (K-0160). |
| Ours | No FeaturedIcon: `audit.md` line 74 reads none, with "build, small: icon in a tinted tile for Alert, Empty state and Toast, feedback colours only"; `coverage.md` has no row. Every icon is `aria-hidden` with `currentColor`, and Lucide comes first (`DESIGN.md` line 187). Badge's icon is 14 px in sm and 16 px in md and hidden (`badge.yaml` line 25). `feedback.*.fg` on `feedback.*.surface` is a checked text pair, and Badge reads the same two tokens (`component.json` lines 676 to 715). All K-0170, line numbers re-read for this spec. |
| Add | Four kinds, with `info` as Untitled has none (K-0159, `DESIGN.md` section 8), a required `variant` with no default (K-0159), and three of Untitled's sizes (K-0159): `fi-api-1`. A tint with a foreground, the light theme's form (K-0159), with the icon on its tile held to the 3.0 UI floor (K-0169): `fi-colour-1`. The tile hidden from assistive tech, as Badge's icon is (K-0167, `badge.yaml` line 27): `fi-a11y-1`. |
| Do not copy | All held by `fi-api-1`. `brand` colour and the `brand` default: `AGENTS.md` says brand accent never replaces error or warning semantics (K-0159). Gradient, dark, modern and modern-neue themes: D.3 row 19 does not name them, and modern-neue has gray only (K-0159). Outline's rings at 30% and 10%: D.3 row 19 does not name them, and `feedback.*.border` is listed as a decorative edge (K-0159). `className` that changes the shape: no per-page radius (`DESIGN.md` section 9 item 12, K-0159). `children` custom content: D.3 row 19 does not name it (K-0159). A hand-sized React element as `icon`: it escapes the size scale (K-0159). `xl` at 56 px: `size.control` stops at `lg` and no screen asks for it (`semantic.json` lines 850 to 863). |

## Goal

A job can fail while a person works, and the failure has a place: the node, the panel or the page the job belongs to. Today ORIVILO can say so only with a Toast, which floats away from that place on an inverse ground, or with five separate `role="alert"` nodes that each draw their own message. D.3 row 19 of the audit asks for one inline message with four feedback kinds, each saying what happened and the fix. This story gives the design system `Alert` and the `FeaturedIcon` tile it shows, so a failed job reads the same everywhere, in Thai and English, for a sighted person and for a screen reader user, without colour alone and without stealing focus.

What is real and what is not, so nobody over-reads it: both components render real markup and read the locale catalog. The jobs in the stories are mock data from `src/components/fixtures.ts`, and the story docs say so. No Studio screen shows an Alert when this story ends. No screen reader test has been run, so `alert-mount-1` and `alert-load-1` rest on the W3C pages read (K-0163, K-0165, K-0166), not on a measured announcement.

## Story

As a person using ORIVILO, when a job fails I see a message where the job lives that tells me what happened and how to fix it, I hear it if I use a screen reader, and I keep my place on the page, so I can fix the cause and run the job again.

## Rules

### fi-api-1

`FeaturedIcon` is a new public component (`src/components/featured-icon/FeaturedIcon.tsx`), exported from `@orivilo/design-system`, with the contract type `FeaturedIconProps`:

- `variant`: `success`, `warning`, `danger`, `info`; required, no default.
- `size`: `sm` (default), `md`, `lg`, tile and glyph as worked example W1, from `size.control.*` and `size.icon.*`. No new semantic token.
- `className` for layout only.

One look, a tint with a foreground. There is no `theme`, `color`, `icon` or `children` prop: the variant sets the glyph (`fi-glyph-1`, open question 6).

### fi-glyph-1

The variant maps to one glyph from `src/components/icons.tsx`: `success` to `CheckIcon` (Lucide `Check`), `warning` to `WarningIcon` (Lucide `TriangleAlert`), `danger` to the new `DangerIcon` (Lucide `OctagonX`), `info` to the new `InfoIcon` (Lucide `Info`). The four drawings differ, so the kind never rests on colour alone. W3 proves the names exist in the pinned Lucide. A test holds the map itself, not only the difference between the drawings (AC row 1).

### fi-colour-1

The recipe `ds-featured-icon` reads only these new component tokens: `featured-icon.<kind>.bg` from `feedback.<kind>.surface` and `featured-icon.<kind>.fg` from `feedback.<kind>.fg` for the kinds `success`, `warning`, `danger`, `info`; `featured-icon.radius` from `shape.media.radius`; `featured-icon.size.{sm,md,lg}` from `size.control.{sm,md,lg}`; `featured-icon.icon-size.{sm,md,lg}` from `size.icon.{sm,md,lg}`. `src/recipes/pairs.ts` lists the glyph on its tile for the four kinds at floor 3 (K-0169). The tile's own edge against the page gets a "Not listed" line: the glyph on the tile is the graphic, the tile ground is decoration.

### fi-a11y-1

The tile root is `aria-hidden="true"`, with no role and no name, and never takes focus. A tile is allowed only beside words that say the same thing; the catalog's `avoidWhen` sends a status with no words to Badge.

### alert-api-1

`Alert` is a new public component (`src/components/alert/Alert.tsx`), exported from `@orivilo/design-system`, with the contract type `AlertProps`:

- `variant`: `success`, `warning`, `danger`, `info`; required, no default. These four are Alert's own type, spelled as literals in `Alert.tsx` (the `AlertKind` union in `design.md`) and never derived from `FeaturedIconProps`, so a later kind on FeaturedIcon never widens `AlertProps`.
- `title`, `description`: required strings (`alert-copy-1`).
- `action`: optional node, the caller's `<Button size="sm" variant="secondary">`, one at most. A node and not an object, as `Table`'s `error.action`, so the caller keeps the Button's own props.
- `onDismiss`: optional; when given, a close button shows: `Button` `variant="ghost"`, `size="sm"`, `iconOnly`, `CloseIcon`, its `aria-label` from the catalog key `alert.dismiss`.
- `live`: `alert-live-1`.
- `className` for layout only.

Alert draws `FeaturedIcon` at `size="sm"` with its own `variant`. There is no `size`, `icon`, `duration` or `actionType` prop.

### alert-copy-1

`title` says what happened. `description` says the fix for `danger` and `warning`, and what the person can do next for `success` and `info`, where nothing needs fixing (open question 8). Neither is cut: no line clamp, no truncation, and a long word breaks by `overflow-wrap: anywhere`. The words carry the kind, with no hidden prefix. A `success` Alert needs backing data (`AGENTS.md`), and the catalog entry says so.

### alert-live-1

`live` sets the role of the Alert root and nothing else; `aria-live` is not set beside it. The values: `status` gives `role="status"`, `alert` gives `role="alert"`, `off` gives no role.

- `success`: default `status`; also `off`. Results of an action (K-0164 Situation A).
- `info`: default `status`; also `alert`, `off`. State of the application unless the message warns of an error (K-0164).
- `warning`: default `status`; also `alert`, `off`. A caution is state; `alert` is for a warning on the existence of an error (K-0164 Situation B).
- `danger`: default `alert`; also `off`. An error (K-0164 Situation B).

The type refuses a value outside its kind's list, so `success` cannot take `alert` (the listed failure, K-0164) and `danger` cannot take `status`. W2 prints the map.

### alert-mount-1

An Alert with a role mounts its role node and its text together, the order of the five repo nodes. For a failed job that arrives while the person is on the screen, the catalog entry names the technique's order as the form to use: the screen keeps its own `role` container mounted from its first render and puts `<Alert live="off">` inside it when the message arrives (K-0165, K-0166). The container holds exactly one live role. Alert adds no region component and no two-step mount (open question 3).

### alert-load-1

A message already in a screen's first render takes `live="off"`: it is there to read in page order, with no role and nothing spoken (K-0163). The caller sets this from its own data at first render, and `live` does not change while the Alert is mounted.

### alert-focus-1

Alert never takes or moves focus: no `tabindex` on the root, no `autoFocus`, no `focus()` call. A message that must move focus or wait for an answer is a Dialog (K-0162, K-0163).

### alert-stay-1

Alert has no timer and stays until the caller removes it (K-0163). `onDismiss` is optional on the four kinds, so no kind requires a close (K-0162). Pressing close calls `onDismiss` once and removes nothing itself; the caller unmounts the Alert and moves focus to the next control, as Task bar does (`TaskBar.tsx` line 157). Escape does nothing, since the APG lists no keyboard interaction for an alert (K-0163).

### alert-look-1

The recipe `ds-alert` is an in-flow block at its parent's width, never edge to edge, floating or shadowed, and it reads only these new component tokens: `alert.bg` from `surface.card`; `alert.<kind>-edge`, a 1 px line on every side, from `feedback.<kind>.border` for `success`, `warning` and `info`, with `alert.danger-edge` from `feedback.danger.fg`; `alert.radius` from `shape.container.radius`, so the 12 tile sits inside a 16 block (`DESIGN.md` section 3.3); `alert.padding` from `space.inset.md`; `alert.gap` from `space.inline.lg`; `alert.title` from `text.primary`; `alert.description` from `text.secondary`; `alert.title-type` from `type.label.md`; `alert.body-type` from `type.body.sm`.

Title over text follows the compact form of `DESIGN.md` section 4, as Toast does. The title's first line centres on the tile, and on the close button when there is one; the close sits at the top end corner. An action sits under the text, 8 px above it as in Toast. Alert has no animation and no transition.

`src/recipes/pairs.ts` lists `alert.title` and `alert.description` on `alert.bg` at floor 4.5, and `alert.danger-edge` on `alert.bg` at floor 3, so the strength of a failure's edge is proven. The `success`, `warning` and `info` edges get a "Not listed" line, since `contrast-pairs.ts` line 162 holds `feedback.*.border` as decoration. The tile and the words say the kind, the edge never does, on `danger` too. Status colour comes only from `feedback.*`, which is how this spec reads "feedback tokens only" in `audit.md` line 65 (audit line 13; open question 7).

### alert-use-1

Alert is for a message that belongs to a place on the page and stays true until the state changes, a failed job shown where the job lives included. Toast is for a short notice with no place on the current screen. An error tied to one field stays in Field, and a message needing a decision is a Dialog. `toast.yaml` line 8, `DESIGN.md` section 6 and the catalog entry of Alert say this in the same PR (open question 1).

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| `FeaturedIcon`, `FeaturedIconProps` (`fi-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/featured-icon.yaml`; a new row in `coverage.md` |
| `Alert`, `AlertProps` (`alert-api-1`, `alert-live-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/alert.yaml`; a new row in `coverage.md` |
| Recipe classes `ds-featured-icon` (with `data-variant`, `data-size`) and `ds-alert` (with `data-variant`) | Recipe | `recipes.css`; `recipes.test.ts` checks every value is a `--cmp-*` or `--ds-*` property |
| The component tokens of `fi-colour-1` and `alert-look-1` | Component token | `component.json`, regenerated `generated.css` (`pnpm --filter @orivilo/design-system tokens`); `pairs.ts` as those two rules say; no semantic or profile change |
| New glyphs `DangerIcon`, `InfoIcon` (`fi-glyph-1`) | Icons | `src/components/icons.tsx`, and the glyph count in its comment at line 62 |
| Locale key `alert.dismiss` | Copy | `src/i18n/messages/th.ts` and `en.ts`; `check-i18n` |
| Fixtures `alertFixtures` | Story content | `src/components/fixtures.ts`, labelled mock |
| Which component says a job failed (`alert-use-1`) | Docs and catalog | `catalog/base/toast.yaml` line 8 and its `avoidWhen`; `DESIGN.md` section 6, a new table row, section 4, Alert added to the compact list, and its version and change log. Toast's code and stories do not change |
| `expectFrameCutsNoInk(el, frame)` (AC rows 4 and 18) | Test helper, not a component API | `packages/design-system/src/testing/visual-asserts.ts`, called under `inVitest`, with its story in `visual-asserts.stories.tsx`, built in PR 186. It compares a screenshot as shipped with one where every ancestor from `el` up to and including `frame` is forced to `overflow: visible`, and goes red when any ink differs: a pixel more than `INK_DISTANCE` from the same pixel of the other shot. Both shots cover a region that reaches 8 px past the frame's box on every side, as `expectLabelInkWhole` reaches past its clone, since a frame's clip cuts ink outside that box and a shot of the frame alone would match. A row's red proof counts only on this helper's own failure line, so a row's other checks must not stop the play first |

Not changed: Toast, Badge, Field, Checkbox, Dialog, Sheet, Table, Canvas node and Task bar markup (Out of scope).

### Copy

The one catalog key, then the story fixtures. The fixtures are caller text, not catalog keys, and they are mock.

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | ---- | ------- |
| `alert.dismiss` | ปิดข้อความนี้ | Dismiss this message |

<!-- prettier-ignore -->
| Fixture | Thai | English |
| ------- | ---- | ------- |
| `success` title | สร้างหน้าแรกเสร็จแล้ว | Home page built |
| `success` description | ดูผลลัพธ์ได้ที่โหนดหน้าแรก | See the result in the home page node |
| `success` action | ดูผลลัพธ์ | View the result |
| `info` title | ผลนี้มาจากกฎ ไม่ได้มาจากโมเดล | This result comes from rules, not a model |
| `info` description | แก้ข้อมูลในโหนดแบรนด์ แล้วรันอีกครั้งเพื่อเปลี่ยนผล | Edit the brand node, then run it again to change the result |
| `info` action | เปิดโหนดแบรนด์ | Open the brand node |
| `warning` title | ผลนี้เก่ากว่าข้อมูลต้นทาง | This result is older than its source |
| `warning` description | โหนดแบรนด์เปลี่ยนแล้ว รันโหนดนี้อีกครั้งเพื่ออัปเดตผล | The brand node changed. Run this node again to update the result |
| `warning` action | รันอีกครั้ง | Run again |
| `danger` title | สร้างหน้าแรกไม่สำเร็จ | Couldn't build the home page |
| `danger` description | `fixtureJobs.failed.reason`: ไม่พบโลโก้ในบอร์ด เพิ่มโลโก้ในโหนดแบรนด์แล้วลองอีกครั้ง | `fixtureTaskJobsEn` first job's reason: No logo found on the board. Add a logo to the brand node, then retry |
| `danger` action | ลองอีกครั้ง | Retry |
| Story trigger | แสดงข้อความ | Show the message |
| Next control | งานถัดไป | Next job |

## Acceptance criteria

Stories: `Base/Featured icon` (id `base-featured-icon`) and `Base/Alert` (id `base-alert`), each a new `*.stories.tsx` beside its component. Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); an `InEnglish` story nests `LocaleProvider locale="en"`. Waits are `waitFor` on a condition, never a fixed time. "The four variants" means `success`, `warning`, `danger`, `info`; "the six boundaries" means neutral, professional, friendly, each in light and dark.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | FeaturedIcon `Variants` renders the four variants, each beside its fixture title | Four tinted tiles with four different glyphs, beside "สร้างหน้าแรกเสร็จแล้ว", "ผลนี้เก่ากว่าข้อมูลต้นทาง", "สร้างหน้าแรกไม่สำเร็จ", "ผลนี้มาจากกฎ ไม่ได้มาจากโมเดล" | None. Each tile root is `aria-hidden="true"` with no `role` and no name (`fi-a11y-1`) | `Variants` play: the four svg `innerHTML` values are pairwise different (`fi-glyph-1`); each tile's svg `innerHTML` equals that of the glyph `fi-glyph-1` names for its kind, with the play taking the glyphs from `src/components/icons.tsx` and not through `FeaturedIcon.tsx`, so a swapped map goes red; tile attributes asserted; each glyph's computed `color` equals the resolved `--cmp-featured-icon-<kind>-fg` |
| 2 | Same | FeaturedIcon `Sizes` renders `sm`, `md`, `lg` for the four variants | Three tile sizes in each kind, each glyph centred in its tile | None | `Sizes` play: tile and glyph computed `width` and `height` equal W1's values to 0.5 px; a box check on one glyph per size: the svg's centre on the tile's centre to 0.5 px on both axes |
| 3 | Same, English | FeaturedIcon `InEnglish` renders row 1 and row 2's stories with the English titles | The same tiles beside "Home page built", "This result is older than its source", "Couldn't build the home page", "This result comes from rules, not a model" | None | `InEnglish` play: the four English titles present; tile attributes as row 1 |
| 4 | Storybook, a 360 px frame | FeaturedIcon `At360` renders the four variants at `lg`, each beside `fixtures.longThai` | Each tile keeps its size and the long name wraps beside it, with no horizontal scroll | None | `At360` play: frame `scrollWidth` not above 360; each tile's computed width equals W1's `lg` value; each name and every ancestor of it up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLabelInkWhole` on the first name, under `inVitest`, proves only that element's own box, on its clone; `expectFrameCutsNoInk(name, frame)` on the first name, under `inVitest`, proves the frame clips nothing, and is proven red by restoring the frame's clip with the overflow clause taken out |
| 5 | Storybook test project | FeaturedIcon `RecipesAndModes` renders through `Matrix` | The four tiles in the six boundaries | None. The pairs of `fi-colour-1` pass at their floor under the six boundaries | `RecipesAndModes` play: six cells, four tiles in each (W4); `recipes.test.ts` proves the contrast |
| 6 | The PR head | `pnpm typecheck` runs on the story file | Not a screen | `@ts-expect-error` lines hold for a missing `variant`, `variant="brand"`, an `icon` prop on a feedback kind (written with `variant="success"`) and a `children` prop (`fi-api-1`) | `pnpm --filter @orivilo/design-system typecheck` output |
| 7 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/featured-icon.yaml` (story `base-featured-icon`, status `draft`, variants `[success, warning, danger, info]`, sizes `[sm, md, lg]`, recipes neutral, professional, friendly) resolves; `coverage.md` has the row; no middot or em dash in either file | `pnpm --filter @orivilo/design-system test` output (check-catalog, `i18n.test.ts`, `check-i18n`) |
| 8 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens FeaturedIcon `Variants`, `Sizes`, `At360`, `RecipesAndModes` | Tiles that read as four kinds with the colour taken away | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set` and cannot write design.md; the answers to open questions 5, 6 and 9 in design.md |
| 9 | Storybook test project, neutral, light, Thai | Alert `Variants` renders the four variants with the fixture copy | Four blocks, each with its tile, title and description, for example "สร้างหน้าแรกไม่สำเร็จ" over "ไม่พบโลโก้ในบอร์ด เพิ่มโลโก้ในโหนดแบรนด์แล้วลองอีกครั้ง"; no close and no action | None. Computed `animationName` is `none` and `transitionDuration` is `0s` on the root (`alert-look-1`) | `Variants` play: each title and description present; `expectTitleOverText(title, text, { gap: 4 })`; each title's first line within 0.5 px of the tile's centre |
| 10 | Same | Alert `LiveRoles` renders the four variants with no `live` prop | The same four blocks | None. Each root's role equals W2's default for its kind (`alert-live-1`) | `LiveRoles` play: `getAllByRole("status")` length 3, `getAllByRole("alert")` length 1, each holding its own title |
| 11 | Same | Alert `LiveRaised` renders `warning` and `info` with `live="alert"` | The two blocks, looking as in row 9 | None. Both roots have `role="alert"` | `LiveRaised` play: `getAllByRole("alert")` length 2 |
| 12 | Same | Alert `AtLoad` renders the four variants with `live="off"` | The same four blocks | None. No `role` on any root and the text is in the page (`alert-load-1`) | `AtLoad` play: `queryAllByRole("alert")` and `queryAllByRole("status")` length 0; the four titles found by text |
| 13 | Same | Alert `ContainerFirst` opens with an empty `role="alert"` container and an empty `role="status"` container; the person presses "แสดงข้อความ" | First nothing, then the `danger` block in the first container and the `success` block in the second | None. The steps of K-0165 and K-0166 hold (`alert-mount-1`): each role node is empty before the press, is the same DOM node after it and holds the message; the Alert inside has no role | `ContainerFirst` play: node identity asserted across the press, `textContent` empty before, the title inside after, one live role per container |
| 14 | Same | Alert `ArrivesLater`: the person presses "แสดงข้อความ" and a `danger` Alert mounts with its role | "สร้างหน้าแรกไม่สำเร็จ" appears and the keyboard stays on the trigger | None. `document.activeElement` is the trigger before and after; the root has no `tabindex` (`alert-focus-1`) | `ArrivesLater` play with `userEvent` and `waitFor` |
| 15 | Same | Alert `WithAction` renders the four variants with their fixture actions; the person presses "ลองอีกครั้ง" | Each block with its action under the text: "ดูผลลัพธ์", "รันอีกครั้ง", "ลองอีกครั้ง", "เปิดโหนดแบรนด์" | None. The story's `fn()` is called once | `WithAction` play: the four buttons found by name; click on "ลองอีกครั้ง"; the action's distance under the text matches `alert-look-1` to 0.5 px |
| 16 | Same | Alert `Dismissible` renders the four variants with `onDismiss`; the person presses Escape, then tabs to the `danger` close and presses Enter | Each block with a close named "ปิดข้อความนี้" at the top end corner. Escape leaves them. Enter removes the `danger` block and the keyboard lands on "งานถัดไป" | None. `onDismiss` called once (`alert-stay-1`) | `Dismissible` play: four buttons named "ปิดข้อความนี้"; the block stays after Escape; `onDismiss` count 1; the story host unmounts and focuses "งานถัดไป"; `document.activeElement` asserted; title first line and close centre within 0.5 px |
| 17 | Same, English | Alert `InEnglish` renders the four variants in the states of rows 9, 12, 15 and 16 | The same blocks with the English copy, for example "Couldn't build the home page" over "No logo found on the board. Add a logo to the brand node, then retry", the action "Retry" and the close named "Dismiss this message" | None | `InEnglish` play: the English titles, the four actions and the close name found |
| 18 | Storybook, a 360 px frame | Alert `LongAt360` renders `danger` with `fixtures.longThai` as title, `fixtureJobs.longReason.reason` as description, an action and a close | The whole title and the whole reason wrap inside the block, nothing cut, and the close stays in its corner | None. Neither element is clamped (`alert-copy-1`) | `LongAt360` play: frame `scrollWidth` not above 360; `scrollHeight` not above `clientHeight` on title and description; the title and every ancestor of it up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLabelInkWhole` on the title, under `inVitest`, proves only that element's own box, on its clone; `expectFrameCutsNoInk(title, frame)`, under `inVitest`, proves nothing from the title up to the frame clips it, and is proven red with the overflow clause taken out and a clip restored on the title, since a clip on the frame stops outside the block's padding (D7 and D8 of design.md) and cuts no ink here; `expectLinesClear` on the description |
| 19 | Storybook test project | Alert `RecipesAndModes` renders the four variants through `Matrix` | The four blocks in the six boundaries | None. The pairs of `alert-look-1` and `fi-colour-1` pass at their floor under the six boundaries | `RecipesAndModes` play: six cells, roles counted as W4; `recipes.test.ts` proves the contrast |
| 20 | The PR head | `pnpm typecheck` and a search of the source run | Not a screen | `@ts-expect-error` lines hold for a missing `title`, a missing `description`, `variant="brand"`, `live="alert"` on `success`, `live="status"` on `danger`, and a `duration` prop; `Alert.tsx` holds no timer (`alert-stay-1`) | `pnpm --filter @orivilo/design-system typecheck` output; `grep -n -e setTimeout -e setInterval -e duration packages/design-system/src/components/alert/Alert.tsx` prints nothing |
| 21 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/alert.yaml` (story `base-alert`, status `draft`, variants `[success, warning, danger, info]`, states `[default, with-action, dismissible, static]`, recipes neutral, professional, friendly) resolves and its rules name `alert-mount-1` and `alert-load-1`; `coverage.md` has the row; `alert.dismiss` exists in Thai and English; `toast.yaml` and `DESIGN.md` section 6 carry `alert-use-1`; the story docs say the jobs are mock; no middot or em dash | `pnpm --filter @orivilo/design-system test` output; `grep -n "Alert" packages/design-system/catalog/base/toast.yaml DESIGN.md` |
| 22 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Alert `Variants`, `WithAction`, `Dismissible`, `LongAt360`, `RecipesAndModes` | A failed job that reads as failed without its colour, on the canvas and on a card, in both modes | None | Designer visual sign-off, its PNG paths posted as a Jira comment on ORV-240, since a sign-off has an empty `write_set` and cannot write design.md; the answer to open question 7 in design.md |
| 23 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/alert src/components/featured-icon` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

Rows 1 to 8 are FeaturedIcon, rows 9 to 22 Alert, row 23 both.

## Rows that render nothing

- Rows: 6, 7, 20, 21, 23

Rows 6 and 20 are type checks and a source search, rows 7 and 21 are catalog and copy checks, and row 23 is test runs.

## Rows per PR

- PR 186: rows 1-8, 23

Rows 9 to 22 and the Alert half of row 23 live in `docs/specs/ORV-240/spec.md`, the Alert slice, whose PR carries its own Rows per PR line.

## Out of scope

- Any Studio screen. Showing an Alert for a failed job on the board, in the task bar or in the shell is a follow-up card.
- Moving `Field`, `Checkbox`, `Dialog`, `Sheet` or `Table` off their `role="alert"` nodes to Alert, or changing their mount order.
- Toast's code: its missing warning and info variants, its tile, and its `danger` glyph. `Toast.tsx` line 124, `TaskBar.tsx` line 80 and `CanvasNode.tsx` line 219 keep `WarningIcon` for a failure until a follow-up card (open question 5).
- Empty state (D.3 row 20) and any neutral tile (open question 6).
- A screen reader test. It stays the open evidence behind `alert-mount-1` and `alert-load-1`.
- SC 3.3.1 and SC 3.3.3, which K-0170 lists as not read.
- An alert dialog; that is the ConfirmDialog story (D.3 row 23).
- Any semantic token or profile change, and any `apps/web` change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. Alert or Toast for a failed job. `toast.yaml` line 8 uses Toast for "generation failed", D.3 row 19 gives Alert "Inline errors for failed jobs", and `DESIGN.md` section 6 has no row between them (K-0170). Options: (a) split by place, with Alert where the job lives and Toast when it has no place on the screen; (b) Alert only, and "generation failed" leaves Toast; (c) both at once, a Toast on arrival and an Alert that stands, which says the same thing twice and adds an interruption (K-0163). Default: (a), which is `alert-use-1`.
2. Which live role each kind takes. K-0164 splits by what a message says, and our four kinds do not map onto it by name. Options: (a) a default per kind with a typed override where the page leaves it open; (b) `role="alert"` on every kind, as shadcn does (K-0160), which K-0164 lists as a failure on content that is not important and time-sensitive; (c) no default, the caller picks every time, which makes a silent Alert one omission away. Default: (a), which is `alert-live-1`. On `warning`, the alternative default is `alert`, since Situation B names "a warning on the existence of an error" (K-0164); the default stays `status` because our `warning` is Caution (`DESIGN.md` section 8), which is mostly state.
3. Mount order. The five repo nodes mount with their text, both technique tests put the role on the container first, and ARIA19 says the container "must be present" on page load; neither page names a node mounted with its text as a failure (K-0165, K-0166, K-0170). Options: (a) keep that order inside Alert and show the technique's order through a caller's container with `live="off"`; (b) a new `AlertRegion` component that holds the role from page load, which adds public API and leaves a screen silent if the region is forgotten; (c) a two-step mount inside Alert, role first and text a frame later, which is still not "on page load" (K-0165). Default: (a), which is `alert-mount-1`. A screen reader test settles it (K-0170); if the Alert's own order proves silent, (b) follows as its own card.
4. A failed job already on the page at load. K-0163 says screen readers do not tell users of alerts present before load completes, in "at this time" wording with no test behind it, and K-0164 found nothing on content present at load. Options: (a) no role, read in page order; (b) keep the role, which says nothing at load by K-0163 and could speak stale news on a client route change; (c) one polite summary after load, which no source read covers. Default: (a), which is `alert-load-1`.
5. The glyph per kind. `icons.tsx` has one warning glyph and no info glyph, and Lucide comes first (`DESIGN.md` line 187, K-0170). Untitled shares one icon for error and warning (K-0158), which K-0167 and `DESIGN.md` section 7 rule out here. Options: (a) the map of `fi-glyph-1`; (b) Lucide `CircleAlert` for `danger`, which sits close to `Info`, a mark in a circle either way; (c) keep `WarningIcon` for `danger`, as Toast does, and find another drawing for `warning`. Answered: (a), with the `danger` glyph of C1 in the map, since v1.0's `OctagonAlert` sits close to `Info` at 16 px, the fault of option (b) (`design.md`, "Answers to the open questions" row 5 and C1; accepted in ORV-222 comment 10515). Its cost: a failed job shows an octagon in Alert and a triangle in Toast, Task bar and Canvas node until the follow-up card in Out of scope.
6. Whether FeaturedIcon gets a neutral tile. `audit.md` line 74 names Empty state as a use, D.3 row 19 says four feedback kinds only, and no token decision exists (K-0170); shadcn's nearest forms are muted tiles (K-0161). A caller's own glyph goes with it, since on a feedback tile the glyph is the kind (K-0167). Options: (a) four kinds and no `icon` prop now, with D.3 row 20's spec adding `neutral` and `icon` together from existing tokens; (b) add both here, which no row of this story uses; (c) Empty state takes a bare icon and never a tile. Answered: (a), which is `fi-api-1` (`AGENTS.md` rule 6; `design.md`, "Answers to the open questions" row 6).
7. The Alert's ground. A tile on a tinted ground of the same token vanishes, since both read `feedback.<kind>.surface`, and K-0170 notes the border cannot be what tells the kind. Options: (a) a neutral card ground with a decorative edge and the tinted tile (K-0158's form, a tile on a card); (b) a tinted ground with a bare glyph and no tile (the bare icon of K-0160), which drops FeaturedIcon from Alert against `audit.md` line 74 and needs new text pairs on four tinted grounds under every profile; (c) a tinted ground with a neutral tile, which reverses the tile's role. Answered: (a), which is `alert-look-1`, with the `danger` edge of C2, since the pale edge did not read loud enough for a failed job (`design.md`, "Answers to the open questions" row 7 and C2; accepted in ORV-222 comment 10515).
8. "Each states what happened and the fix" (D.3 row 19) for `success` and `info`, where nothing is broken. Options: (a) `description` is required on the four kinds and says the next step there; (b) required on `danger` and `warning`, optional on the other two; (c) optional everywhere, which lets a failed job ship without its fix (K-0158 and K-0160 leave it to the caller). Default: (a), which is `alert-copy-1`.
9. FeaturedIcon sizes. Alert needs one, and K-0170 says to take Untitled's scale "if screens need more than one". Options: (a) `sm`, `md`, `lg` on existing tokens, so D.3 row 20 needs no token change (K-0159); (b) `sm` only (`AGENTS.md` rule 6). Answered: (a), which is `fi-api-1`; six component tokens are its whole cost (`design.md`, "Answers to the open questions" row 9).
10. PR size. Both components with stories, tokens, recipes, catalog and copy are estimated at about 800 changed lines (an estimate, not a count), over the 400-line guide. Options: (a) two PRs split vertically, FeaturedIcon with its glyphs first (rows 1 to 8), then Alert (rows 9 to 22, the slice ORV-240), row 23 in each; (b) one PR with the review sized to it (ORV-146, as ORV-201 decided). Default: (a).
11. The Rows per PR lines. Default: the main session adds a `- PR <n>: rows ...` line in the form `qa-scope-1` reads when each PR opens, per open question 10, with a changelog line. The Alert PR's line goes in `docs/specs/ORV-240/spec.md`, the file the qa recorder reads for that issue.

## Depends on

- `docs/knowledge/design/K-0158` to `K-0170` (benchmark and standards, 2026-11-06), with K-0114 and K-0115 on role status and SC 4.1.3.
- `docs/specs/ORV-64/audit.md` section B (table form), lines 65 and 74, and section D.3 row 19 (the story and its done-when).
- `DESIGN.md` section 3.3 (radius), 4 (title over text), 6 (choosing a component, icons), 7 (states), 8 (colour roles), 9 (anti-patterns), 11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers") and `.claude/rules/testing.md`.
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- ORV-201 (Spinner and Skeleton: the form of this spec, and open question 4 on PR size).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`, W3 after `pnpm install`.

W1. The sizes of `fi-api-1`. Input: `size.control.sm`, `.md`, `.lg` reference `size.8`, `size.10`, `size.12` (`semantic.json` lines 850 to 862), whose values are `32px`, `40px`, `48px` (`primitives.json` lines 521, 529, 537); `size.icon.sm`, `.md`, `.lg` reference `size.icon-4`, `icon-5`, `icon-6` (`semantic.json` lines 875 to 885), whose values are `16px`, `20px`, `24px` (`primitives.json` lines 557 to 567). Expected output, tile then glyph, integers, no rounding: `sm 32 16 md 40 20 lg 48 24`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/primitives.json").size;const n=k=>parseInt(s[k].$value);console.log("sm",n("8"),n("icon-4"),"md",n("10"),n("icon-5"),"lg",n("12"),n("icon-6"))'
```

W2. The map of `alert-live-1`: variant to default role and allowed values. Input: the four kinds as that rule lists them. Expected output, four lines: `success default status allowed status,off`, `info default status allowed status,alert,off`, `warning default status allowed status,alert,off`, `danger default alert allowed alert,off`.

```bash
node -e 'const m={success:["status","status,off"],info:["status","status,alert,off"],warning:["status","status,alert,off"],danger:["alert","alert,off"]};for(const[k,[d,a]]of Object.entries(m))console.log(k,"default",d,"allowed",a)'
```

W3. The map of `fi-glyph-1`: variant to a Lucide export that exists in the pinned version (`lucide-react` 1.52.0, `packages/design-system/package.json` line 28), and four different glyphs. Expected output: `success Check true`, `warning TriangleAlert true`, `danger OctagonX true`, `info Info true`, `distinct 4`.

```bash
node -e 'const l=require("./packages/design-system/node_modules/lucide-react");const m={success:"Check",warning:"TriangleAlert",danger:"OctagonX",info:"Info"};for(const[k,g]of Object.entries(m))console.log(k,g,Boolean(l[g]));console.log("distinct",new Set(Object.values(m).map(g=>l[g])).size)'
```

W4. The counts of AC 5 and AC 19. Input: `PROFILE_IDS` neutral, professional, friendly (`src/profiles/index.ts` line 41 and the Spinner play at `Spinner.stories.tsx` line 165), modes light and dark (`matrix.tsx` line 10), and W2's defaults. Expected output, integers, no rounding: `cells 6 tiles 24 alert 6 status 18`.

```bash
node -e 'const p=["neutral","professional","friendly"],m=["light","dark"],d={success:"status",info:"status",warning:"status",danger:"alert"};const c=p.length*m.length,v=Object.values(d);console.log("cells",c,"tiles",c*v.length,"alert",c*v.filter(r=>r==="alert").length,"status",c*v.filter(r=>r==="status").length)'
```

## Changelog

- v1.0 (2026-11-06): first version, from K-0158 to K-0170 and audit D.3 row 19. Downstream to review: the designer envelope (design.md, open questions 5, 6, 7 and 9), the builder envelopes (rows per open question 10), the qa envelope (Rows per PR lines once the PRs exist), `catalog/coverage.md`, `catalog/base/toast.yaml` and `DESIGN.md` sections 4 and 6.
- v1.1 (2026-11-06): C1, C2 and C3 of design.md accepted (ORV-222 comment 10515), changing `fi-glyph-1`, W3, `alert-look-1` and AC row 2; from the ORV-223 spec, `alert-api-1` names the four kinds as Alert's own type and AC row 6 checks `icon` on a feedback kind; open questions 5, 6, 7 and 9 answered. Downstream to review: design.md (its `spec:` line reads v1.0), the builder envelopes (`icons.tsx`, `component.json`, `pairs.ts`, the `Sizes` play), the qa envelope, and the ORV-223 spec (its Depends on line names v1.0, and its row 1 uses the check C3 replaces here).
- v1.2 (2026-11-06): sign-off finding F1 of ORV-222-signoff-1 (ORV-222 comment 10519). `expectNoGlyphClip` cannot see a mark above the font ascent and throws when no ancestor clips, so AC row 4 passed while the story frame's `overflow-hidden` cut the Thai tone mark by 1.33 px. The Checks of AC rows 4 and 18, the two rows that named it on Thai text, now require a frame that clips nothing and `expectLabelInkWhole`. Downstream to review: design.md (its `spec:` line reads v1.2, and its `alert-copy-1` row still names the old check), the builder envelopes (the frame and play of `At360`, the play of `LongAt360`), the qa envelope, and the ORV-223 spec (its Depends on line names a version of this spec).
- v1.3 (2026-11-06): findings R1, R2 and S4 of ORV-222-review-1. R2: `fi-glyph-1` says a test holds the map, and the Check of AC row 1 compares each tile's svg with its named glyph, since a swapped map passed. R1: `expectLabelInkWhole` sees only its own clone's box, so a frame clip cut both its shots alike; the Checks of AC rows 4 and 18 stop giving it that proof and add the test helper `expectFrameCutsNoInk`, added to the impact table. Row 18's red proof sets its clip on the title, since a frame clip cannot reach the title there. S4: the Checks of AC rows 8 and 22 say the sign-off's PNG paths go on the issue as a Jira comment. Row 3 is unchanged (R3 is met by the build). Downstream to review: the builder envelopes (the helper and its story, the `Variants` and `At360` plays and the comment above the ink check in `At360`, the play of `LongAt360`), design.md (its `spec:` line reads v1.2), the qa envelope, and the ORV-223 spec (its Depends on line names v1.2, and its rows 25 and 42 keep the old sign-off words).
- v1.4 (2026-11-06): by the main session. The Alert half moved to the slice ORV-240 (L-0016), because the rework allowance under this issue is spent. Row 22, open questions 10 and 11 and Rows per PR name it. No requirement changes. Downstream to review: `docs/specs/ORV-240/spec.md`.
