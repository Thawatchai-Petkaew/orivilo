---
issue: ORV-223 (https://tpetkaew.atlassian.net/browse/ORV-223)
lane: L (a new component public API and a changed `TaskBarProps` are L-lane risk flags, AGENTS.md "Lanes and gates"; G1 and G2 pass under the owner's delegation during the POC, ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 20 ("Empty state and Loading state pattern")
version: 1.5
---

# ORV-223: Empty state and Loading state pattern (application)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, one per pattern, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). Every cell is from K-0171 to K-0184 and the entries K-0184 cites (read 2026-11-06). The Ours rows are the code on this branch, line numbers re-read for this spec. The Add and Do not copy rows are this spec's choices from the candidates in K-0184; each points to the rule in "Rules" that holds it.

Untitled UI's API table for empty states was not read: the page text holds a placeholder there (K-0171), and K-0184 lists it, the demo code and the paid Figma kit under "Not read". Nothing in the Untitled UI rows comes from that table, and nothing is filled in from memory.

### Empty state

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/empty-states>. API table not read (see above). Variants: no `variant` prop in the file read; the look comes from the visual placed in `Header`. Sizes: `size` sm, md, lg on the root, default lg, through context to title, description and spacing. States: no state prop in the file read. Slots: `Header` with `pattern` circle (default), square, grid, grid-check or none and `patternSize` sm, md (default) or lg; `Content` with `Title` and `Description`; `Footer` with action buttons in a row. Visuals: `FeaturedIcon`, `Illustration`, `FileTypeIcon`, `AvatarRadius`, `AvatarRow`, `AvatarGrid`. Demos: six, two buttons each, five after a search miss and one first use, own count. All K-0171. Table page: "No vendors found", "No users found" (K-0173). Accessibility: `h1`, `main`, `header`, `footer`; decorations `aria-hidden`; `motion-reduce:animate-none` on `AvatarGrid`; no live region or status role found in the file (K-0172). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/empty>. Variants: `EmptyMedia` default or icon; outline and background by `border` and `bg-*` classes (K-0174). Sizes: no size prop; the icon tile is `size-10` in new-york-v4 and `size-8` in style-nova (K-0175). States: none named. Slots: `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, and `EmptyContent` for a button, input or link (K-0174). Accessibility: title and description are `div`s, no role or aria attribute in the two files read (K-0175). No results elsewhere: "No results." in a table cell, and `CommandEmpty` over cmdk's `role="presentation"` (K-0177). |
| Ours | No shared empty state: `coverage.md` line 59 reads none, and `audit.md` line 100 reads "build". Table: `TableEmpty` with title, description and action (`Table.tsx` lines 37 to 43) in a status row with no status role (lines 327 to 339); the foot status holds the sort text (line 342). CanvasBoard: `emptyText` and `emptyAction` (`CanvasBoard.tsx` lines 126 to 128) in an overlay with a plain `p` (lines 1179 to 1184), outside the status line (line 1185). TaskBar: one `p` with `taskBar.empty` and no action (`TaskBar.tsx` lines 223 to 224), in a panel hidden until opened (line 221); the summary `taskBar.none` sits in the header (line 189); `task-bar.yaml` line 10 has "A board with no jobs (collapsed by default)" under `avoidWhen`, and line 14 lists `empty` under states. Contract: `DESIGN.md` section 7, empty, "Invites an action", and section 10. D.3 row 20 asks for the empty board and the empty task bar. |
| Add | One shared set of parts for media, title, description and action (K-0171, K-0174): `empty-api-1`. Two sizes, for a board and for a bar (K-0171), where shadcn has none (K-0174): `empty-api-1`, `empty-look-1`. A heading whose level the caller chooses (K-0172, K-0175): `empty-sem-1`. An action on the task bar's empty form, which has none today: `empty-bar-1`, `empty-action-1`. A first-use form and a no-results form as stories over one component, as Untitled's demos show them apart (K-0171): `empty-live-1`. The no-results words in a status container that is there before them (K-0178): `empty-live-1`. |
| Do not copy | Default `h1` and `main`: they duplicate the page's own (K-0172, K-0181, K-0182): `empty-sem-1`. The `role="presentation"` override on `main`: not on the allowed list (K-0183): `empty-sem-1`. `header` and `footer` parts: banner and contentinfo outside a sectioning parent (K-0183): `empty-sem-1`. A plain `div` title: no heading to navigate by (K-0175): `empty-sem-1`. `EmptyDescription` typed `p` but rendering `div` (K-0175): `empty-sem-1`. Free `bg-*` classes for the look (K-0174): colour utilities are forbidden in our components (`.claude/rules/design-system.md`): `empty-look-1`. Background `pattern` and avatar visuals (K-0171): D.3 row 20 asks for neither: `empty-api-1`. Fixed English no-results text (K-0177): copy comes from the catalog or the caller in Thai and English: `empty-api-1`. cmdk's `role="presentation"` as the no-results answer (K-0177): it gives the text no status role (K-0178): `empty-live-1`. |

### Loading state

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | No page-loading or loading-state pattern found; the guessed pages `page-loading.md` and `loading-states.md` return 404 (K-0173). Nearest: Loading indicators, <https://www.untitledui.com/react/components/loading-indicators.md>. Variants: three types. Sizes: sm 32, md 48, lg 56, xl 64 px. States: one. Slots: a `label`. Silent by its own FAQ (K-0108). No skeleton found (K-0109). EmptyState has no loading part (K-0172). |
| shadcn/ui | Empty has no loading part (K-0174). Nearest: the Empty example on <https://ui.shadcn.com/docs/components/radix/spinner>: `EmptyMedia variant="icon"` with `<Spinner />`, title "Processing your request", a Cancel button at `variant="outline" size="sm"` (K-0176). Announced by the Spinner's `role="status"` and `aria-label="Loading"` on the icon; the example adds no `aria-busy` (K-0176, K-0110). Skeleton: a pulsing `div` with no aria (K-0111). The Data Table text read shows no loading UI (K-0177). cmdk's `Command.Loading` is `role="progressbar"`, not exported by shadcn's Command (K-0177). |
| Ours | No region-level loading pattern: `coverage.md` line 60 reads none, and `audit.md` line 101 reads "build as page pattern on Skeleton and Spinner". Spinner: sizes sm, md, lg, `label`, `labelHidden`, `decorative`; one `role="status"` with the hidden ring and the label (`Spinner.tsx` lines 46 to 57). SkeletonGroup: `aria-busy` on the group and one `sr-only` status inside it (`Skeleton.tsx` lines 44 to 47). Table: `aria-busy` on the table (line 190) and a status row with `SpinnerIcon` and `loadingLabel` under `role="status"` (lines 307 to 316). CanvasBoard: `aria-busy` on the region (line 1124), an overlay with `SpinnerIcon` and `board.loading` in a `p` (lines 1173 to 1178); the always-mounted status line shows only the board's message or the `status` prop (lines 1185 to 1187). TaskBar: no loading state. The Spinner, group and Table statuses mount with their message. Contract: `DESIGN.md` section 7, loading, "Blocks repeat submission; announces status". |
| Add | A region pattern built from the existing Spinner, with an optional stop action (K-0176): `load-api-1`, `load-use-1`. The region's own `aria-busy`, back to false when done (K-0113, K-0180): `load-busy-1`. One polite status per region (K-0114, K-0115): `load-live-1`. The status container in place before the message, and the board's loading text carried by its status line (K-0115, K-0178): `load-board-1`, `load-mount-1`. |
| Do not copy | Fixed English `aria-label="Loading"` on the icon (K-0110, K-0176): one name for every locale: `load-api-1`. A spinner in the empty layout with no `aria-busy` on a region whose content is changing (K-0176, K-0113): `load-busy-1`. A pulse (K-0111): `skeleton.yaml` line 21 keeps the shapes static and names SC 2.2.2 (K-0117): `load-use-1`. Untitled's silent indicator (K-0108): SC 4.1.3 names the waiting state (K-0115): `load-live-1`. A `progressbar` for the region (K-0179, K-0177): no job here has a known length, and Progress already owns that case: `load-use-1`. |

## Goal

A person opens a board with nothing on it, or opens the task bar before any job has run. Today the board shows one line of text, the task bar shows a sentence that points elsewhere, and neither reads as the same product. Audit D.3 row 20 asks for one Empty state and one Loading state pattern, used on the empty board and the empty task bar, each showing an action, in Thai and English. This story gives the design system `EmptyState` and `LoadingState`, puts them in CanvasBoard and TaskBar, and carries the board's loading text in the status line it already has, so a screen reader user hears the wait.

What is real and what is not, so nobody over-reads it: both components render real markup and read the locale catalog. The actions in the stories are mock: `emptyAction` is a Button the host supplies, and `catalog/commands/canvas.yaml` has no command that starts a job, so no press in these stories runs anything. No screen in `apps/web` mounts CanvasBoard or TaskBar today (a search of `apps/web` for both names finds none), so no Studio screen changes when this story ends. No screen reader test has been run, so `empty-live-1`, `load-mount-1` and `load-board-1` rest on the W3C pages read (K-0113, K-0115, K-0178), not on a measured announcement. What the short board form was and was not proven on is in `empty-board-short-1`.

## Story

As a person using ORIVILO, when a board or a job list has nothing in it I see what is missing and what I can do next, and when a region is waiting I see and hear that it is waiting, in my language, so I always know the product is working and where to go.

## Rules

### fi-neutral-1

`FeaturedIconProps` (ORV-222, `fi-api-1`) gains a fifth `variant`, `neutral`, and an `icon` prop that exists only with it:

- `variant="neutral"` requires `icon`. A feedback kind refuses `icon` by type, so its glyph stays the one of `fi-glyph-1` (ORV-222 open question 6).
- `icon` is a component reference of type `FeaturedIconGlyph`, a component taking `IconProps` from `src/components/icons.tsx`, never an element, so the tile sizes it and a hand-sized element cannot pass.
- `size`, `className` and `fi-a11y-1` hold unchanged. Alert keeps its four kinds: `AlertProps` never gains `neutral`.

### fi-neutral-colour-1

The recipe `ds-featured-icon` gains `data-variant="neutral"`, reading only two new component tokens: `featured-icon.neutral.bg` from `border.subtle` and `featured-icon.neutral.fg` from `text.secondary`. `src/recipes/pairs.ts` lists the glyph on its tile at floor 3; W2 gives the base set. The tile's own edge against its ground gets the "Not listed" line of `fi-colour-1`.

### empty-api-1

`EmptyState` is a new public component (`src/components/empty-state/EmptyState.tsx`), exported from `@orivilo/design-system`, with the contract type `EmptyStateProps`:

- `title`: required string.
- `level`: required, `2`, `3`, `4`, `5` or `6` (`empty-sem-1`).
- `description`: optional string.
- `action`: optional node (`empty-action-1`).
- `icon`: optional `FeaturedIconGlyph`; when given, EmptyState draws `FeaturedIcon` with `variant="neutral"` at the tile size of W1.
- `size`: `sm` or `md` (default), as `empty-look-1`.
- `className` for layout only.

There is no `variant`, `pattern`, `role`, `live` or `children` prop. No catalog key lives in it: the caller passes the words, so there is no fixed text in any locale.

### empty-sem-1

The root is a `div`. The title renders the heading element of `level`, so `h1` is impossible by type; the description renders a `p`. EmptyState renders no `main`, `header`, `footer` or `section`, and no `role` attribute on any part.

### empty-look-1

The recipe `ds-empty-state` (with `data-size`) reads only these new component tokens: `empty-state.title` from `text.primary`, `empty-state.description` from `text.secondary`, `empty-state.title-type` from `type.label.md`, `empty-state.body-type` from `type.body.sm`, `empty-state.text-gap` from `space.inline.sm`, `empty-state.gap-md` from `space.stack.md`, `empty-state.gap-sm` from `space.inline.lg`, `empty-state.action-gap` from `space.stack.sm`, `empty-state.max-width` from `size.panel.default`.

Title over text is the compact form of `DESIGN.md` section 4 at both sizes. `md` is a centred column: tile, text, action, each `gap-md` apart, its inline size capped at `max-width`. `sm` starts at the line's start: the tile, then `gap-sm`, then the text with the action `action-gap` under it, and has no cap. W5 gives the gaps. Long words break by `overflow-wrap: anywhere`; nothing is clamped. EmptyState has no animation and no transition.

`src/recipes/pairs.ts` lists `empty-state.title` and `empty-state.description` on `ds:surface.canvas`, `ds:surface.card` and `board.bg` at floor 4.5, six pairs.

### empty-action-1

`action` is the caller's own Button, one at most, and it names its outcome (`DESIGN.md` section 10). It is optional in the type because the right to act comes from the domain (`AGENTS.md`): a caller whose person can act passes it, and a read-only caller passes none. EmptyState adds no button of its own and owns no handler.

### empty-live-1

EmptyState never sets a live role, by type and in markup.

- Already empty on first render: nothing is spoken, and the words are read in page order.
- Turned empty by a change the person did not make, or by a search or filter: the words go through a status container mounted before them, owned by the region (K-0178).
- Turned empty by the person's own delete: the region's existing status line says what happened, and no second message is added (K-0178, its note on new messages).

TaskBar is the second case: `empty-bar-1`. CanvasBoard is the third: `empty-board-1`.

### empty-focus-1

EmptyState never takes or moves focus: no `tabindex` on any part, no `autoFocus`, no `focus()` call. When the last item leaves while focus is inside it, the region keeps the keyboard: TaskBar's existing effect sends focus to the toggle (`TaskBar.tsx` lines 174 to 181), and CanvasBoard follows `empty-board-1`.

### empty-bar-1

`TaskBarProps` gains `emptyAction?: ReactNode`, the name CanvasBoard uses. With no jobs the panel renders `<EmptyState size="sm" level={3} icon={JobsIcon}>` with the title `taskBar.emptyTitle`, the description `taskBar.empty` and the `action` `emptyAction`, inside the `ds-taskbar__empty` wrapper, which keeps only its padding. `JobsIcon` is a new glyph in `icons.tsx`, Lucide ListTodo: `QueuedIcon` marks one job state (`TaskBar.tsx` line 77), so in this tile it would say something is waiting when nothing is (`design.md` C1).

The bar stays collapsed by default, so the action shows once the panel is open (open question 1). When `jobs` goes from at least one job to none, the bar's own status (`TaskBar.tsx` line 307) holds `taskBar.none`; W6 prints the map. `task-bar.yaml` line 10 leaves `avoidWhen`, and its rules gain a line that says this.

### empty-board-1

CanvasBoard's empty overlay renders `<EmptyState size="md" level={2} icon={ArtifactIcon}>` with the title `emptyText ?? m.board.empty` and the `action` `emptyAction`. The props keep their names and types, and `empty` keeps its condition (`CanvasBoard.tsx` line 1073).

When a delete leaves no node and `document.activeElement` is the body or null, the board calls `wrapper.current?.focus()`, the form line 765 uses after a cut. The delete message stays the board's only status for that change.

The overlay keeps its place in the DOM, after the flow element and the toolbar, so reading order and stacking do not move. Row 20 holds what that means for the keyboard, and W7 counts the stops.

The form sits on the board's centre and rises only as far as it must to stay `space.inset.md` above the toolbar, or above the shelf when one is mounted, and `space.stack.sm` above a one line status. The rule applies to the empty form only; the Loading overlay keeps the board's centre (design.md D15). `empty-board-short-1` holds what this costs.

### empty-board-short-1

What the rise in `empty-board-1` costs and leaves open (`design.md` D15 and "What D15 costs, and its limits"). The costs, the open limit and the fallback below are accepted under the owner's delegation (ADR 0012 decision 4), in the task `ORV-223-spec-5`. Their cause is finding F1 of `ORV-223-signoff-1` (ORV-223 comment 10545).

- Cost, a status moves the form. On a short board the first toolbar command lifts the form 49.8 px in one step, with no transition, and it stays there until the next message. It lifts where the pill is not under the form too, 19.7 px at 1440 by 360, because the rule cannot read the pill's width.
- Cost, no room on a very short board. Under the height W8 prints for a three row toolbar, the form's top passes the board's edge: the decorative tile is cut first and the title next, while the action and the toolbar stay whole and no button is blocked. A status raises that height by 49.8 px, each title line raises it further, and the task bar's 50 px lift cuts the tile by 3.8 px at 294 by 360.
- Open limit, a host status that wraps. Only a one line status is held clear. A host's own `status` prop that wraps still reaches the action: three lines at 294 by 360 read a gap of -39.6, two lines at 360 by 420 read -15.8. A fix means moving the status ahead of the overlay in the DOM, so it is a later card of its own (Out of scope).
- Fallback, no anchor positioning. A browser without it top aligns the form on every board with a toolbar, tall boards included: 358.1 px off centre at 1440 by 900. A top aligned form blocks no button, and that is the trade.
- Proof. Every measure comes from CSS injected into the built stories at head `12afffe`, in Chromium only, and the fallback was rendered there by injecting that one rule. Firefox and WebKit were not installed, so neither the rise nor the fallback is proven in them, and this spec claims nothing for them. The Storybook test project runs Chromium alone (`packages/design-system/vite.config.ts` line 40), so rows 19, 22 and 44 to 46 add no other browser.

### load-api-1

`LoadingState` is a new public component (`src/components/loading-state/LoadingState.tsx`), exported from `@orivilo/design-system`, with the contract type `LoadingStateProps`:

- `label`: optional string; default the catalog key `spinner.loading`, so no new key.
- `live`: `status` (default) or `off` (`load-live-1`).
- `action`: optional node, the caller's Button that stops the wait, one at most.
- `className` for layout only.

The ring is the Spinner at `size="lg"`, label under it. There is no `size`, `progress`, `role` or `children` prop.

### load-live-1

`live` decides who speaks. `status` renders `<Spinner size="lg" label={...}>`, whose one status holds the ring and the label (`spin-live-1`). `off` renders `<Spinner decorative size="lg">` and the label in a plain `p` under it, with no role, for a region that owns its status. The two forms look the same: the recipe gives the `off` form the ink and type of `.ds-spinner[data-size="lg"]`. The action sits outside any status, so its name is not part of the message. W3 prints the map.

The recipe `ds-loading-state` is a centred column reading two new tokens: `loading-state.gap` from `space.stack.md`, between the ring and label and the action, and `loading-state.max-width` from `size.panel.default`, which caps its inline size. `src/recipes/pairs.ts` lists `spinner.fg` on `board.bg` at floor 4.5, in the place of the "overlay text" pair at line 667.

### load-busy-1

LoadingState sets no `aria-busy`, since it replaces the content and holds nothing that changes. The region that waits sets `aria-busy="true"` on itself while it waits and removes it when done (K-0113, K-0180), as CanvasBoard (line 1124) and Table (line 190) do. The catalog entry says so, and the `InRegion` story shows the form.

### load-mount-1

The mount order of Spinner, SkeletonGroup and Table does not change: each keeps mounting its status with its message. LoadingState `live="status"` does the same. For a wait that starts while the person is on the screen, in a region whose status container is already mounted, the catalog entry names the technique's order as the form to use: `live="off"` and the words in that container (K-0178), as `alert-mount-1` does for Alert. CanvasBoard takes this form (`load-board-1`). Open question 3 holds the rest.

### load-board-1

CanvasBoard's loading overlay renders `<LoadingState live="off" label={m.board.loading}>`. While `loading` is true the status line (`CanvasBoard.tsx` line 1185) holds `m.board.loading`, ahead of `message` and `status`, and is hidden from the eye by a recipe rule on `.ds-board[data-loading] .ds-board__status` that takes it to a 1 by 1 px box with no padding and no border, so the words show once, in the overlay. The `sr-only` class cannot do this: `recipes.css` is not in a layer, so `.ds-board__status` beats it and keeps its padding and border (`design.md` C4). When `loading` ends the line returns to `message || status || ""`. W6 prints the map. The node stays mounted throughout: the catalog's "One live region" (`canvas-board.yaml` line 28) holds, and `.ds-board__spinner` and the `SpinnerIcon` import leave.

### load-use-1

Which one to use: a whole region with no known layout takes LoadingState; a region with a known layout takes SkeletonGroup (`skeleton.yaml` line 8); a row or a control takes Spinner (`spinner.yaml` line 8); a job with a known length or value takes Progress. LoadingState has no pulse and adds no motion: the ring follows `spin-motion-1`. It holds no submit control, so repeat submission stays blocked by the control that started the wait (`DESIGN.md` section 7). The catalog entries of LoadingState and EmptyState say this.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| `FeaturedIcon` gains `neutral` and `icon`, `FeaturedIconGlyph` (`fi-neutral-1`) | Component API | `src/components/featured-icon/FeaturedIcon.tsx` and its stories (`Neutral` new, `InEnglish` and `RecipesAndModes` extended); `catalog/base/featured-icon.yaml` variants; `type IconProps` at `src/components/icons.tsx` line 65 gains `export`; the ORV-222 type checks stay green, with `AlertProps` kept to four kinds |
| `JobsIcon` (`empty-bar-1`) | Component API | `src/components/icons.tsx`: one import, one export line, and the glyph count in its comment (line 62, 46 becomes 47); used by the task bar's empty form and FeaturedIcon `Neutral` |
| `EmptyState`, `EmptyStateProps` (`empty-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/application/empty-state.yaml`; `coverage.md` line 59 |
| `LoadingState`, `LoadingStateProps` (`load-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/application/loading-state.yaml`; `coverage.md` line 60 |
| `TaskBarProps.emptyAction` (`empty-bar-1`) | Component API | `TaskBar.tsx`; `task-bar.yaml` lines 10 and 17 to 21; `TaskBar.stories.tsx` `Empty` (line 65 changes with the copy); `TaskBar.test.ts` line 30 stays green; `BlockLibrary.stories.tsx` line 343 passes jobs and is not affected |
| CanvasBoard overlay and status line (`empty-board-1`, `load-board-1`) | Internal, no prop change | `CanvasBoard.tsx` lines 1173 to 1187 and `onDelete` (line 421); `CanvasBoard.stories.tsx` `Empty` (line 106) and `Loading` (line 118, whose `getByText` would now find two nodes), the `EmptyAt360` play and its comment, new `EmptyShort` and `EmptyShortInEnglish`; `canvas-board.yaml` a11y line 28 and the overlay rule at line 25 |
| Short board proof on the shelf (design.md D15) | Story only | `BlockLibrary.stories.tsx`, new `EmptyBoardShort` |
| Recipe classes `ds-empty-state` (with `data-size`), `ds-loading-state`, and `ds-featured-icon[data-variant="neutral"]` | Recipe | `recipes.css`; the rule of `load-board-1` is new, after `.ds-board__status:empty`; the block of design.md D15 is new, after the status line's anchored rules; `.ds-board__overlay p` (line 1596) and `.ds-board__spinner` (line 1599) leave; the type rules of `.ds-taskbar__empty` (lines 4172 to 4180) leave; `recipes.test.ts` checks every value is a `--cmp-*` or `--ds-*` property |
| The component tokens of `fi-neutral-colour-1`, `empty-look-1` and `load-live-1`, with `empty-state.max-width` and `loading-state.max-width` among them | Component token | `component.json`, regenerated `generated.css` (`pnpm --filter @orivilo/design-system tokens`); `pairs.ts` as those rules say; no semantic or profile change |
| Locale keys `taskBar.emptyTitle` (new), `taskBar.empty` (value changes) | Copy | `src/i18n/messages/th.ts` line 58 and `en.ts` line 54; `check-i18n` |
| Fixtures `emptyStateFixtures` | Story content | `src/components/fixtures.ts`, labelled mock |
| `decorative` now also serves a region that owns its status (`load-live-1`) | Docs and catalog | `catalog/base/spinner.yaml` line 25 and the comment at `Spinner.tsx` lines 16 to 19; no markup change |
| Compact title over text (`empty-look-1`) | Docs | `DESIGN.md` section 4, "a table empty state" becomes "an empty state", with its version and change log |

Not changed: Skeleton, Table, Toast, Alert, Progress, Canvas chat and Select markup (Out of scope), and `audit.md`, a dated research record (open question 4 records where this story goes past its line 74).

### Copy

The catalog keys, then the story fixtures. The fixtures are caller text, not catalog keys, and they are mock.

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | ---- | ------- |
| `taskBar.emptyTitle` (new) | ยังไม่มีงานบนบอร์ดนี้ | No jobs on this board yet |
| `taskBar.empty` (new value) | งานที่เริ่มบนบอร์ดจะแสดงที่นี่ | Jobs you start on the board show up here |
| `taskBar.none` (unchanged, the summary and `empty-bar-1`'s status) | ยังไม่มีงาน | No jobs yet |
| `board.empty` (unchanged) | กระดานยังว่าง | The board is empty |
| `board.loading` (unchanged) | กำลังโหลดกระดาน | Loading the board |
| `spinner.loading` (unchanged) | กำลังโหลด | Loading |

<!-- prettier-ignore -->
| Fixture | Thai | English |
| ------- | ---- | ------- |
| First use title | ยังไม่มีบรีฟ | No brief yet |
| First use description | เพิ่มบรีฟเพื่อเริ่มอ่านข้อมูลแบรนด์ด้วยกฎ | Add a brief so the rules can read your brand |
| First use action | เพิ่มบรีฟ | Add a brief |
| No results title | ไม่พบงานที่ตรงกับ "โลโก้" | No job matches "logo" |
| No results description | ลองคำอื่น หรือล้างคำค้นหา | Try another word, or clear the search |
| No results action | ล้างคำค้นหา | Clear the search |
| No results trigger | ค้นหา | Search |
| Task bar action | เริ่มงานแรก | Start the first job |
| Board action (today's story text) | เพิ่ม node แรก | Add your first node |
| Loading label | กำลังอ่านบรีฟ | Reading the brief |
| Loading action | หยุดโหลด | Stop loading |
| Loading done trigger | โหลดเสร็จ | Finish loading |
| Loaded content | บรีฟพร้อมแล้ว | The brief is ready |

## Acceptance criteria

Stories: `Application/Empty state` (id `application-empty-state`) and `Application/Loading state` (id `application-loading-state`), each a new `*.stories.tsx` beside its component, plus new stories in the FeaturedIcon, TaskBar, CanvasBoard and BlockLibrary files. Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); an English story nests `LocaleProvider locale="en"`. Waits are `waitFor` on a condition, never a fixed time. "The six boundaries" means the profiles neutral, professional, friendly, each in light and dark. "The five tiles" means `success`, `warning`, `danger`, `info`, `neutral`. A 360 px frame is `Narrow` from `src/components/matrix.tsx`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral profile, light, Thai | FeaturedIcon `Neutral` renders `variant="neutral"` with `JobsIcon` at `sm`, `md`, `lg`, each beside "ยังไม่มีงานบนบอร์ดนี้" | Three grey tiles with a list glyph, beside the words | None. Each tile root as `fi-a11y-1` says | `Neutral` play: tile and glyph computed `width` and `height` equal W1 and ORV-222 W1 to 0.5 px; glyph computed `color` equals the resolved `--cmp-featured-icon-neutral-fg`; tile `backgroundColor` equals the resolved `--cmp-featured-icon-neutral-bg`; on one tile per size, the svg's bounding box centre equals the tile's bounding box centre to 0.5 px on both axes |
| 2 | Same, English | FeaturedIcon `InEnglish` renders the neutral tile as well | The tile beside "No jobs on this board yet" | None | `InEnglish` play: that text present; tile attributes as row 1 |
| 3 | Storybook test project | FeaturedIcon `RecipesAndModes` renders through `Matrix` | The five tiles in the six boundaries | None. The pair of `fi-neutral-colour-1` passes at its floor under the six boundaries | `RecipesAndModes` play: counts as W4; `recipes.test.ts` proves the contrast |
| 4 | The PR head | `pnpm typecheck` runs on the story files | Not a screen | `@ts-expect-error` lines hold for `variant="neutral"` with no `icon`, `variant="success"` with `icon`, and `icon` given an element (`icon={<QueuedIcon />}`); when Alert is on the PR's base, also for `<Alert variant="neutral">` (`fi-neutral-1`) | `pnpm --filter @orivilo/design-system typecheck` output |
| 5 | Storybook test project, neutral profile, light, Thai | EmptyState `Default` renders the first use fixture at `level={2}`; the person presses "เพิ่มบรีฟ" | A tile, "ยังไม่มีบรีฟ" over "เพิ่มบรีฟเพื่อเริ่มอ่านข้อมูลแบรนด์ด้วยกฎ", and the button "เพิ่มบรีฟ", centred | The story's `fn()` is called once. `getByRole("heading", { level: 2 })` holds the title; no `main`, `banner`, `contentinfo`, `status` or `alert` role inside (`empty-sem-1`, `empty-live-1`). Computed `animationName` `none` and `transitionDuration` `0s` on the root (`empty-look-1`) | `Default` play: `expectTitleOverText(title, text, { gap: 4 })`; roles queried; `document.activeElement` is the button after the press (`empty-focus-1`); the cap of `empty-look-1`: the root's parent is a block box (the `layout: "padded"` surface, `design.md` story notes) whose content box is asserted wider than `--cmp-empty-state-max-width`, resolved to px in the form of `resolvedLength` (`Select.stories.tsx` line 366), and the root's `getBoundingClientRect().width` is not above that value, so a root with no cap fills its parent and the play goes red |
| 6 | Same | EmptyState `Sizes` renders `sm` and `md` with the first use fixture | The `md` form as a centred column; the `sm` form with the tile at the start and the words beside it | None | `Sizes` play: tile widths equal W1 to 0.5 px; in `md` the tile's bottom is above the title's top by W5's `md` to 0.5 px and the action's top is under the text by the same; in `sm` the tile's right edge is left of the title's left by W5's `sm` to 0.5 px and the action's top is under the text by W5's `action` to 0.5 px |
| 7 | Same | EmptyState `TitleOnly` renders a title with no `icon`, `description` or `action` | "ยังไม่มีบรีฟ" alone | None. No svg, no `p` and no `button` in the root | `TitleOnly` play: those queries length 0; the root's height equals the title's to 0.5 px, so no gap is left behind |
| 8 | Same | EmptyState `NoResults`: a host keeps an empty `role="status"` container mounted; the person presses "ค้นหา", then "ล้างคำค้นหา" | First a job list, then `ไม่พบงานที่ตรงกับ "โลโก้"` over "ลองคำอื่น หรือล้างคำค้นหา" with the button "ล้างคำค้นหา", then the list again | None. The container is empty before the press, is the same DOM node after it and holds the title; the EmptyState root has no role (`empty-live-1`) | `NoResults` play: node identity asserted across the press; `textContent` before and after; `queryAllByRole("status")` length 1 |
| 9 | Same, English | EmptyState `InEnglish` renders the states of rows 5, 7 and 8 | "No brief yet" over "Add a brief so the rules can read your brand" with "Add a brief"; "No brief yet" alone; `No job matches "logo"` over "Try another word, or clear the search" with "Clear the search" | None | `InEnglish` play: those texts and button names found |
| 10 | Storybook, a 360 px frame | EmptyState `LongAt360` renders `sm` and `md` with `fixtures.longThai` as title and `fixtures.longLatin` as description, and an action | The whole title and description wrap inside the frame, with the action under them | None. Nothing clamped (`empty-look-1`) | `LongAt360` play: frame `scrollWidth` not above 360; `scrollHeight` not above `clientHeight` on title and description; every ancestor of the title up to the frame (`.ds-empty-state__text`, `.ds-empty-state__body`, `.ds-empty-state`, any story wrapper) has computed `overflowX` and `overflowY` `visible`; `expectLinesClear` on the title, which wraps; `expectFrameCutsNoInk(title, frame)` |
| 11 | Storybook test project | EmptyState `RecipesAndModes` renders through `Matrix` | The first use form in the six boundaries | None. The pairs of `empty-look-1` pass at their floor under the six boundaries | `RecipesAndModes` play: counts as W4; `recipes.test.ts` proves the contrast |
| 12 | The PR head | `pnpm typecheck` and a search of the source run | Not a screen | `@ts-expect-error` lines hold for a missing `title`, a missing `level`, `level={1}`, a `role` prop and a `live` prop (`empty-api-1`, `empty-sem-1`) | `pnpm --filter @orivilo/design-system typecheck` output; `grep -n -e tabIndex -e autoFocus -e 'focus()' packages/design-system/src/components/empty-state/EmptyState.tsx` prints nothing |
| 13 | Storybook test project, neutral profile, light, Thai | TaskBar `Empty` renders with no jobs and no `emptyAction`; the person opens the panel | Collapsed: "ยังไม่มีงาน". Open: a tile and "ยังไม่มีงานบนบอร์ดนี้" over "งานที่เริ่มบนบอร์ดจะแสดงที่นี่", with no action | None. The bar's own status is empty at first render and after the open (`empty-live-1`); no button in the panel | `Empty` play (updated): those texts; `announcer` `textContent` empty; `within(panel).queryAllByRole("button")` length 0. `TaskBar.test.ts` line 28 stays green |
| 14 | Same | TaskBar `EmptyWithAction` renders with no jobs and `emptyAction`; the person opens the panel and presses "เริ่มงานแรก" | The row 13 form with the button "เริ่มงานแรก" under the words | The story's `fn()` is called once. `getByRole("heading", { level: 3 })` holds the title (`empty-bar-1`) | `EmptyWithAction` play with `userEvent` |
| 15 | Same | TaskBar `TurnsEmpty`: one failed mock job, panel open; the person focuses "ลองอีกครั้ง" and presses Enter, and the host removes the job | The row goes and the row 13 form takes its place; the summary reads "ยังไม่มีงาน" | The bar's own status holds "ยังไม่มีงาน" (W6). `document.activeElement` is the toggle (`empty-focus-1`) | `TurnsEmpty` play: `waitFor` on the announcer's text and on the active element |
| 16 | Same, English | TaskBar `EmptyInEnglish` renders row 14 | "No jobs yet"; open: "No jobs on this board yet" over "Jobs you start on the board show up here" with "Start the first job" | None | `EmptyInEnglish` play |
| 17 | Storybook, a 360 px frame | TaskBar `EmptyAt360` renders row 14 opened | The tile, the wrapped words and the action inside the bar, with no horizontal scroll | None | `EmptyAt360` play: frame `scrollWidth` not above 360; every ancestor of the title up to the bar root (`.ds-empty-state__text`, `.ds-empty-state__body`, `.ds-empty-state`, `.ds-taskbar__empty`, `.ds-taskbar__panel`) has computed `overflowX` and `overflowY` `visible`; the root `.ds-taskbar` is the one clip inside the frame (`recipes.css` line 4030), so the title's box lies inside its padding box; `expectLabelInkWhole` on the title, which is one line at this width; `expectFrameCutsNoInk(title, root)` |
| 18 | Storybook test project | TaskBar `EmptyRecipesAndModes` renders row 14 opened through `Matrix` | The empty panel in the six boundaries | None | `EmptyRecipesAndModes` play: counts as W4 |
| 19 | Storybook test project, neutral profile, light, Thai | CanvasBoard `Empty` renders with `emptyAction` | A tile, "กระดานยังว่าง" and the button "เพิ่ม node แรก", centred on the board | None. `getByRole("heading", { level: 2 })` holds the title; the status line is empty at first render (`empty-board-1`, `empty-live-1`) | `Empty` play (lines 104 to 109 stay green, plus these two assertions, and the form's centre on the board's centre to 0.5 px on both axes, the story's board being at least 520 px tall) |
| 20 | Same | CanvasBoard `TurnsEmpty`: one fixture node (`BOARD_NODES[0]`, no edges); the person focuses it, presses Delete, then presses Tab until the action | The node goes, the status line reads "ลบ 1 node", and the row 19 form shows | Graph has no node. After Delete focus stays on the region (`document.activeElement` is the region). Tab then goes in page order, the toolbar buttons and the attribution link first, and reaches "เพิ่ม node แรก" (`empty-board-1`, W7) | `TurnsEmpty` play: `status(region)` text, active element in `waitFor`, then a Tab loop with a bound of 14 (W7) that ends on the action. The loop proves the action is reached within the bound, not the order, which rests on the markup `empty-board-1` keeps |
| 21 | Same, English | CanvasBoard `EmptyInEnglish` renders row 19 | "The board is empty" and "Add your first node" | None | `EmptyInEnglish` play |
| 22 | Storybook, a 360 px frame | CanvasBoard `EmptyAt360` renders row 19 | The form centred across the frame, clear of the toolbar, nothing cut | None | `EmptyAt360` play: frame `scrollWidth` not above 360; the action's left and right edges inside the frame; the form's centre on the board's centre line to 0.5 px across; the action's bottom above the toolbar's top by at least the resolved `--ds-space-inset-md` less 0.5 px; the tile's top not above the board's top |
| 23 | Storybook test project | CanvasBoard `EmptyRecipesAndModes` renders row 19 through `Matrix` and `MatrixBoard` | The empty board in the six boundaries | None | `EmptyRecipesAndModes` play: counts as W4 |
| 24 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/application/empty-state.yaml` (story `application-empty-state`, status `draft`, sizes `[sm, md]`, states `[first-use, no-results, title-only]`, recipes neutral, professional, friendly) resolves and its rules name `empty-live-1` and `load-use-1`; `coverage.md` line 59 reads draft; `task-bar.yaml` carries `empty-bar-1`; `taskBar.emptyTitle` and `taskBar.empty` exist in Thai and English; the story docs say the actions are mock; no middot or em dash | `pnpm --filter @orivilo/design-system test` output; `grep -n "EmptyState\|Empty state" packages/design-system/catalog/coverage.md` |
| 25 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens FeaturedIcon `Neutral`, EmptyState `Default`, `Sizes`, `NoResults`, `LongAt360`, `RecipesAndModes`, TaskBar `EmptyWithAction`, CanvasBoard `Empty`, `EmptyShort`, `EmptyShortInEnglish`, BlockLibrary `EmptyBoardShort` | An empty board and an empty bar that read as one product, with the tile quieter than the action, on the board ground and on a card, in both modes | None | Designer visual sign-off, its PNG paths posted as a Jira comment on ORV-223 by the main session, with the answers to open questions 7 and 9 |
| 26 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/empty-state src/components/featured-icon src/components/task-bar src/components/canvas-board src/components/block-library` (with `src/components/alert` when Alert is on the PR's base) and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 27 | Storybook test project, neutral profile, light, Thai | LoadingState `Default` renders with no props | A turning ring with "กำลังโหลด" under it | None. One `role="status"` holding "กำลังโหลด"; the svg is `aria-hidden="true"` (`load-live-1`) | `Default` play: `getAllByRole("status")` length 1 with that text; ring width equals W1's `ring` to 0.5 px; label's top under the ring's bottom; the cap of `load-live-1`: the parent and the width as row 5, on the `.ds-loading-state` root against `--cmp-loading-state-max-width` |
| 28 | Same | LoadingState `WithAction` renders the loading fixture; the person presses "หยุดโหลด" | "กำลังอ่านบรีฟ" under the ring and the button "หยุดโหลด" below | The story's `fn()` is called once. The status holds "กำลังอ่านบรีฟ" and not the button's name | `WithAction` play: status `textContent`; button found by name outside the status; gap equals W5's `md` to 0.5 px |
| 29 | Same | LoadingState `LiveOff` renders `Default` and `live="off"` side by side | The same ring and words twice | None. The `off` root holds no role and the words in a `p` (W3) | `LiveOff` play: `queryAllByRole("status")` length 1, from the `Default` half; ring and label sizes of the two halves equal to 0.5 px |
| 30 | Same | LoadingState `InRegion`: a host region with `aria-busy="true"` shows LoadingState; the person presses "โหลดเสร็จ" | The ring and "กำลังอ่านบรีฟ", then "บรีฟพร้อมแล้ว" | None. `aria-busy` is `true`, then absent on the region (`load-busy-1`); LoadingState's root has no `aria-busy` | `InRegion` play on the attribute before and after |
| 31 | Same, English | LoadingState `InEnglish` renders the states of rows 27, 28 and 29 | "Loading"; "Reading the brief" with "Stop loading"; "Loading" with no role | None | `InEnglish` play |
| 32 | Storybook, a 360 px frame | LoadingState `LongAt360` renders `fixtures.longThai` as `label` with the action | The label wraps under the ring, centred, nothing cut | None | `LongAt360` play: frame `scrollWidth` not above 360; every ancestor of the label up to the frame (`.ds-spinner`, `.ds-loading-state`, any story wrapper) has computed `overflowX` and `overflowY` `visible`; `expectLinesClear` on the label, which wraps; `expectFrameCutsNoInk(label, frame)` |
| 33 | Storybook test project | LoadingState `RecipesAndModes` renders through `Matrix` | The ring, the label and the action in the six boundaries | None. The pair of `load-live-1` passes at its floor | `RecipesAndModes` play: counts as W4; `recipes.test.ts` proves the contrast |
| 34 | The PR head | `pnpm typecheck` runs on the story file | Not a screen | `@ts-expect-error` lines hold for `live="alert"`, a `size` prop and a `children` prop (`load-api-1`) | `pnpm --filter @orivilo/design-system typecheck` output |
| 35 | Storybook test project, neutral profile, light, Thai | CanvasBoard `Loading` renders | The ring and "กำลังโหลดกระดาน" once, centred on the board, with no status pill | None. Region `aria-busy="true"`; exactly one `role="status"` in the region, holding "กำลังโหลดกระดาน", at the hidden box of `load-board-1` | `Loading` play (updated): `getAllByRole("status")` length 1 and its text; its bounding box 1 by 1 px; the overlay label visible |
| 36 | Same | CanvasBoard `LoadingFinishes`: a host outside the region starts with `loading`; the person presses "โหลดเสร็จ" | The overlay goes and the board shows its fixture nodes | None. The status node is the same DOM node before and after; its text is empty after; `aria-busy` is absent (W6) | `LoadingFinishes` play: node identity, `textContent`, attribute |
| 37 | Same, English | CanvasBoard `LoadingInEnglish` renders row 35 | "Loading the board" under the ring | None. The status holds the same words | `LoadingInEnglish` play |
| 38 | Storybook, a 360 px frame | CanvasBoard `LoadingAt360` renders row 35 | The ring and words centred in the frame | None | `LoadingAt360` play: frame `scrollWidth` not above 360; every ancestor of the label up to the board root (`.ds-loading-state__quiet`, `.ds-loading-state`, `.ds-board__overlay`) has computed `overflowX` and `overflowY` `visible`; the root `.ds-board` is the one clip inside the frame (`recipes.css` line 1514), so the label's box lies inside its padding box; `expectLabelInkWhole` on the label, which is one line at this width; `expectFrameCutsNoInk(label, root)` |
| 39 | Storybook test project | CanvasBoard `LoadingRecipesAndModes` renders row 35 through `Matrix` and `MatrixBoard` | The loading board in the six boundaries | None | `LoadingRecipesAndModes` play: counts as W4 |
| 40 | The PR head | A diff and the existing plays run | Not a screen | `Skeleton.tsx` and `Table.tsx` are unchanged and `Spinner.tsx` changes only its comment (`load-mount-1`); `base-spinner`, `base-skeleton` and `application-table` plays stay green | `git diff origin/develop --stat -- packages/design-system/src/components/skeleton/Skeleton.tsx packages/design-system/src/components/table/Table.tsx` prints nothing; the row 43 run |
| 41 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/application/loading-state.yaml` (story `application-loading-state`, status `draft`, states `[status, live-off, with-action]`, recipes neutral, professional, friendly) resolves and its rules name `load-busy-1`, `load-mount-1` and `load-use-1`; `coverage.md` line 60 reads draft; `canvas-board.yaml` and `spinner.yaml` carry `load-board-1` and `load-live-1`; no middot or em dash | `pnpm --filter @orivilo/design-system test` output |
| 42 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens LoadingState `Default`, `WithAction`, `LongAt360`, `RecipesAndModes`, CanvasBoard `Loading` | A wait that reads as the same product as the empty forms, on the board ground and on a card, in both modes | None | Designer visual sign-off, its PNG paths posted as a Jira comment on ORV-223 by the main session |
| 43 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/loading-state src/components/canvas-board src/components/spinner src/components/skeleton src/components/table` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 44 | Storybook, a 294 px frame, board 360 tall, Thai | CanvasBoard `EmptyShort` renders (`w-[294px]` frame, `Stateful height={360} fill={false}`) | The form with "กระดานยังว่าง" and "เพิ่ม node แรก" clear of the wrapped toolbar, every button reachable, and still clear after a status appears | None | `EmptyShort` play: toolbar height above twice `--cmp-button-height-sm`, so it has wrapped; action's bottom above the toolbar's top by at least the resolved `--ds-space-inset-md` less 0.5 px; `document.elementFromPoint` at the centre of each of the 14 buttons of W7's `ORDER` lies inside that button; tile's top inside the board; form's centre on the board's centre line to 0.5 px across. Then `userEvent` presses `[data-command="board.zoom-in"]`, `waitFor` the status text "ซูมเข้า", and the pill's top is below the action's bottom by at least the resolved `--ds-space-stack-sm` less 0.5 px, with the action still above the toolbar and the tile inside the board |
| 45 | The same, English | `EmptyShortInEnglish` renders under `LocaleProvider locale="en"` | The same in English: "The board is empty", "Add your first node" | None | `EmptyShortInEnglish` play: row 44's check, status "Zoomed in" |
| 46 | Storybook, a 360 px frame, a shelf on the board | BlockLibrary `EmptyBoardShort` renders (`ShelfBoard initial={{ nodes: [], edges: [] }} height={640} fixed`) | The form with "กระดานยังว่าง" clear of the shelf | None | `EmptyBoardShort` play: form's bottom above the shelf's top by at least the resolved `--ds-space-inset-md` less 0.5 px |

Rows 1 to 4 are FeaturedIcon, rows 5 to 12 EmptyState, rows 13 to 18 TaskBar, rows 19 to 23 the empty board, rows 24 to 26 the empty half as a whole, rows 27 to 34 LoadingState, rows 35 to 39 the loading board, rows 40 to 43 the loading half as a whole, rows 44 to 46 the empty form on a short board.

The builder proves each of rows 44 and 46 red on the head before the CSS goes in: row 44 reads gap -25.9 with 3 blocked, row 46 reads -52.7. Plays read lengths with the `resolvedLength(el, token)` form at `Select.stories.tsx` line 366, and scroll each button into view first, because `elementFromPoint` returns null outside the viewport.

## Rows that render nothing

- Rows: 4, 12, 24, 26, 34, 40, 41, 43

Rows 4, 12 and 34 are type checks and a source search, rows 24 and 41 are catalog and copy checks, row 40 is a diff, and rows 26 and 43 are test runs.

## Rows per PR

- PR 190: rows 1-26, 44-46

The loading half, rows 27 to 43, gets its line when its PR opens (open question 11).

## Out of scope

- Any `apps/web` screen, and a real job or a command that starts one.
- Moving Table to EmptyState or LoadingState (`Table.tsx` lines 307 to 339), and any status role on its empty row. Follow-up card (open question 9).
- Canvas chat, Select, BlockLibrary, CommandMenu and Inspector empty texts (`chat.empty`, `select.empty`, `blockLibrary` and `commandMenu` keys, `emptySummary`). Follow-up card.
- Changing the mount order of Spinner, SkeletonGroup or Table, or moving `aria-busy` off a region that holds its own status (open question 3).
- A screen reader test. It stays the open evidence behind `empty-live-1`, `load-mount-1` and `load-board-1`.
- Illustrations, background patterns and avatar visuals.
- A `lg` EmptyState, a size on LoadingState, and a progress bar in the loading form.
- Any semantic token or profile change.
- Visual regression baselines (`.claude/rules/testing.md`).
- A host status that wraps still reaching the action: the open limit of `empty-board-short-1`, a later card of its own, with no row here.

## Open questions (with defaults)

1. What the empty task bar shows as its action. D.3 row 20 asks for an action; `task-bar.yaml` line 10 lists "A board with no jobs (collapsed by default)" under `avoidWhen` while line 14 lists `empty` as a state; `TaskBarProps` has no action prop; both publishers keep the action in its own slot (K-0171, K-0174, K-0184 open points). Options: (a) an `emptyAction` prop in the panel under the words, the bar still collapsed by default, and the `avoidWhen` line replaced by a rule; its cost is that the action shows only after the person opens the panel; (b) the action in the header beside the summary whenever there are no jobs, seen while collapsed, in a header that already holds a label, a summary and a toggle at 360 px; (c) no action and the pointer sentence stays, which leaves D.3 row 20 unmet and needs an owner decision; (d) the host does not mount the bar with no jobs, the plain reading of `avoidWhen`, which also leaves D.3 row 20 unmet. Default: (a), which is `empty-bar-1`. What the action does stays the host's: no command starts a job yet.
2. Whether a region already empty on first render needs a status message. WCAG's page counts "No results returned" as a status update and says the criterion does not force new messages; a region empty from the start is no "change in content" by our reading, and the pages read do not name it (K-0178, K-0184 open points). Neither publisher's empty component sets a status role (K-0172, K-0175). Options: (a) no message at first render, a message only when the region turns empty by a change the person did not make or by a search; (b) a status on every EmptyState, which would speak on page load and on each route change, past what K-0178 asks; (c) never a message, which fails the search case K-0178 names. Default: (a), which is `empty-live-1`.
3. Whether the loading pattern changes the mount order of Spinner, SkeletonGroup, Table and the CanvasBoard status line. ARIA22 checks the role on the container before the message (K-0178); Spinner, the group and Table mount both together (K-0184 Ours); the board's line is always mounted but does not carry the loading text. A second point sits beside it: `aria-busy` lets assistive technology ignore changes inside the element (K-0113), and the status of the board, the group and Table sits inside its busy element, while K-0179 only says to point to the status. Options: (a) leave Spinner, SkeletonGroup and Table as they are, carry the board's text in the status line it already has, and name the order in the catalog; (b) a new `LoadingRegion` that holds the status from page load, which adds public API and fails silent if forgotten, as ORV-222 question 3 found for Alert; (c) also move every status out of its busy element, which changes the ORV-201 contract and the board's `aria-busy` play (`CanvasBoard.stories.tsx` line 117). Default: (a), which is `load-mount-1` and `load-board-1`. A screen reader test settles (c), as its own card.
4. How Empty state uses FeaturedIcon's neutral kind and icon prop. ORV-222 ships four kinds with no `icon`, and its question 6 sends both here; `audit.md` line 74 names Empty state as a use and also says "feedback colours only", so a neutral tile goes past that line's wording, and this question is the record of that; on a feedback tile the glyph is the kind; shadcn's nearest tile is muted (K-0174, K-0175); Untitled's default is a gray tile with a chosen icon (K-0171). Options: (a) `neutral` with a required `icon` given as a component, refused on the four kinds; (b) a bare glyph with no tile, ORV-222 question 6 option (c), which drops the audit's use; (c) a tile recipe inside EmptyState, a second tile to keep in step; (d) `icon` on every kind, which breaks `fi-glyph-1`. Default: (a), which is `fi-neutral-1`, and `empty-api-1` keeps the tile optional.
5. The reading of "Both show an action" in D.3 row 20. K-0184 reads "both" as the empty board and the empty task bar; the row could also mean Empty state and Loading state. Options: (a) K-0184's reading, with `action` required of neither type; (b) the second reading, an action required on LoadingState too, though a wait has no stop in CanvasBoard today (K-0176's Cancel is optional in its own example). Default: (a). `load-api-1` gives LoadingState the slot, so (b) needs only a required prop.
6. The title's element. Untitled's `h1` and shadcn's `div` are the two ends (K-0172, K-0175, K-0181, K-0183). Options: (a) a required `level` from 2 to 6, fixed by CanvasBoard and TaskBar at the values of `empty-board-1` and `empty-bar-1`; (b) a default of `h2`, which is wrong silently inside a deeper region; (c) a `p`, with no heading to navigate by. Default: (a), which is `empty-api-1` and `empty-sem-1`.
7. The neutral tile's ground. It must show on the board ground and on the bar's card ground. Options: (a) `border.subtle`, the fill Skeleton and Progress read (`component.json` lines 2156 and 2163), with W2's contrast; (b) `surface.sunken`, the nearest to shadcn's `bg-muted` (K-0175), which equals `surface.board` in both modes and vanishes on the board; (c) `surface.card`, which vanishes in the bar. Default: (a), which is `fi-neutral-colour-1`. Answered: (a), confirmed (`design.md`, "Answers to the open questions", row 7).
8. Where focus goes when the last item leaves. K-0184 lists this as unread, so no entry backs a choice. TaskBar already sends it to the toggle; CanvasBoard's delete has no fallback and its cut does (`CanvasBoard.tsx` line 765). Options: (a) the region keeps the keyboard, and the action is reached by Tab in page order; (b) focus jumps to the action, a move the person did not ask for, against the stance of `alert-focus-1`; (c) leave the board as it is, focus falling to the body; (d) move the empty overlay before the flow element, so the action is the first stop after the region, which changes reading order and stacking. Default: (a), which is `empty-focus-1` and `empty-board-1`. Answered (main session, from the deviation of ORV-223-build-1): (a), not (d); row 20 holds the stops.
9. The glyphs, and Table. Options for the glyphs: (a) `ArtifactIcon` on the board and `QueuedIcon` in the bar, both already in `icons.tsx`, so no glyph is added; (b) new Lucide glyphs chosen by the designer. Default: (a). Table has the same three parts in its own status row (`recipes.css` lines 1319 to 1339) and is not named in D.3 row 20: options (a) a follow-up card, (b) move it here at the cost of the `application-table` plays. Default: (a) (`AGENTS.md` rule 6). Answered (`design.md`, "Answers to the open questions", row 9, and C1): the board stays on (a), which is `empty-board-1`; the bar takes (b), which is `empty-bar-1`; Table stays on (a).
10. PR size. FeaturedIcon's neutral kind, EmptyState and its two uses are estimated at about 550 changed lines, and LoadingState with the board's status at about 300 (estimates, not counts), against the 400-line guide. Options: (a) two PRs split vertically, the empty half (rows 1 to 26 and 44 to 46) then the loading half (rows 27 to 43); (b) three PRs, with the task bar and the board as their own PR after EmptyState, which leaves a PR with no story user; (c) one PR with the review sized to it (ORV-146, as ORV-201 decided). Default: (a).
11. The Rows per PR lines. Default: the main session adds a `- PR <n>: rows ...` line in the form `qa-scope-1` reads when each PR opens, per open question 10, with a changelog line.

## Depends on

- The first ORV-222 PR, FeaturedIcon with its glyphs (ORV-222 rows 1 to 8). It merged as PR 186, and rows 1 to 26 and 44 to 46 here extend it. If the Alert PR of ORV-222 lands after this half, that PR carries the `<Alert variant="neutral">` type check of row 4. ORV-222 spec v1.3, rules `fi-api-1`, `fi-glyph-1`, `fi-colour-1`, `fi-a11y-1`, `alert-api-1`, `alert-mount-1`, and its open question 6 (ORV-222 comment 10513).
- ORV-201 (Spinner and Skeleton): `spin-live-1`, `spin-motion-1`, and the form of this spec.
- `docs/knowledge/design/K-0171` to `K-0184` (benchmark and standards, 2026-11-06), with the K-0108 to K-0118 entries K-0184 cites.
- `docs/specs/ORV-64/audit.md` section B (table form), lines 74, 100 and 101, and section D.3 row 20 (the story and its done-when).
- `DESIGN.md` section 4 (title over text), 6 (icons), 7 (empty and loading states), 9 (anti-patterns), 10 (writing), 11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers") and `.claude/rules/testing.md`.
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).
- `docs/specs/ORV-223/design.md` D15 and "Rework F1" (`ORV-223-design-2`), for finding F1 of `ORV-223-signoff-1` (ORV-223 comment 10545).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The sizes of `empty-api-1` and `load-api-1`. Input: `size.control.sm`, `.md` reference `size.8`, `size.10`, `size.icon.sm`, `.md`, `.lg` reference `size.icon-4`, `icon-5`, `icon-6` (`primitives.json` lines 521 to 567). EmptyState `sm` draws the `sm` tile and `md` the `md` tile; LoadingState's ring is Spinner `lg`. Expected output, integers, no rounding: `sm tile 32 glyph 16 md tile 40 glyph 20 ring 24`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/primitives.json").size;const n=k=>parseInt(s[k].$value);console.log("sm tile",n("8"),"glyph",n("icon-4"),"md tile",n("10"),"glyph",n("icon-5"),"ring",n("icon-6"))'
```

W2. The contrast of `fi-neutral-colour-1` in the base set. Input: `text.secondary` on `border.subtle`, gray.600 on gray.200 in light and gray.400 on gray.700 in dark (`semantic.json` lines 108 to 113 and 330 to 335), read from `primitives.json`. Expected output, WCAG relative luminance, rounded to two decimals, both above the floor of 3: `light 5.22 dark 5.96`. The other profiles are proven by `recipes.test.ts`.

```bash
node -e 'const g=require("./packages/design-system/src/tokens/source/primitives.json").color.gray;const L=h=>{const c=[1,3,5].map(i=>parseInt(h["$value"].slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const r=(a,b)=>{const[x,y]=[L(a),L(b)].sort((p,q)=>q-p);return ((x+.05)/(y+.05)).toFixed(2)};console.log("light",r(g["600"],g["200"]),"dark",r(g["400"],g["700"]))'
```

W3. The map of `load-live-1`: `live` to the number of status roles, the ring, and where the label sits. Expected output, two lines: `status statuses 1 ring aria-hidden label in-status`, `off statuses 0 ring aria-hidden label plain-p`.

```bash
node -e 'const m={status:[1,"in-status"],off:[0,"plain-p"]};for(const[k,[n,l]]of Object.entries(m))console.log(k,"statuses",n,"ring aria-hidden label",l)'
```

W4. The counts of rows 3, 11, 18, 23, 33 and 39. Input: profiles neutral, professional, friendly (`src/profiles/index.ts`), modes light and dark (`matrix.tsx` line 10), and the five tiles. Each matrix story has one form per cell. Expected output, integers, no rounding: `cells 6 tiles 30 headings 6 statuses 6`. Row 3 asserts `tiles`; rows 11, 18 and 23 each assert `headings`; rows 33 and 39 each assert `statuses`; every one of the six stories asserts `cells`.

```bash
node -e 'const p=["neutral","professional","friendly"],m=["light","dark"],t=["success","warning","danger","info","neutral"];const c=p.length*m.length;console.log("cells",c,"tiles",c*t.length,"headings",c,"statuses",c)'
```

W5. The gaps of `empty-look-1` and `load-live-1`. Input: `space.inline.sm`, `space.inline.lg`, `space.stack.sm`, `space.stack.md` reference `space.1`, `space.3`, `space.2`, `space.4` (`semantic.json` lines 795 to 822), whose values are at `primitives.json` lines 463 to 478. Expected output, integers, no rounding: `text 4 sm 12 action 8 md 16`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/primitives.json").space;const n=k=>parseInt(s[k].$value);console.log("text",n("1"),"sm",n("3"),"action",n("2"),"md",n("4"))'
```

W6. Two status maps. For `empty-bar-1`: job count before and after to the bar's status, with no job state change. For `load-board-1`: `loading`, `message`, `status` to the line's text. Inputs are the Thai values of `taskBar.none`, `board.loading` and `board.deletedNode`, and a mock shell status. Expected output, seven lines: `bar 1 0 ยังไม่มีงาน`, `bar 0 0 (empty)`, `bar 0 1 (empty)`, `line true ลบ 1 node สถานะ กำลังโหลดกระดาน`, `line false ลบ 1 node สถานะ ลบ 1 node`, `line false (none) สถานะ สถานะ`, `line false (none) (none) (empty)`.

```bash
node -e 'const none="ยังไม่มีงาน",load="กำลังโหลดกระดาน",del="ลบ 1 node",st="สถานะ";const bar=(a,b)=>a>0&&b===0?none:"";for(const[a,b]of[[1,0],[0,0],[0,1]])console.log("bar",a,b,bar(a,b)||"(empty)");const line=(l,m,s)=>(l?load:"")||m||s||"";for(const[l,m,s]of[[true,del,st],[false,del,st],[false,"",st],[false,"",""]])console.log("line",l,m||"(none)",s||"(none)",line(l,m,s)||"(empty)")'
```

W7. The Tab stops of row 20. Input: `ORDER` (`CanvasControls.tsx` lines 27 to 42), 14 commands. Select and pan share one roving stop. At `TurnsEmpty` three are disabled and take no stop: `board.zoom-to-selection` with nothing picked, and `board.undo` and `board.redo` with `canUndo` and `canRedo` at their default of false (`CanvasBoard.tsx` lines 279, 280 and 641 to 648). After the buttons come the attribution link and the action, so the action is the twelfth stop from the region. The bound of 14 adds the two stops a host has with undo and redo on. Expected output, integers, no rounding: `buttons 10 action 12 bound 14`.

```bash
node -e 'const order=["board.zoom-out","board.zoom-100","board.zoom-in","board.zoom-to-fit","board.zoom-to-selection","board.select-mode","board.pan-mode","board.toggle-minimap","board.undo","board.redo","board.add-node","board.command-menu","board.search","board.shortcut-sheet"];const off=["board.zoom-to-selection","board.undo","board.redo"];const buttons=order.filter(c=>!off.includes(c)&&c!=="board.pan-mode").length;const action=buttons+2;console.log("buttons",buttons,"action",action,"bound",action+2)'
```

W8. The heights of `empty-board-short-1`, and why row 19's 520 stays centred. Input, from `design.md` "Rework F1" and D3: a one line form 135.8 px tall, 143.8 under Friendly; a three row toolbar 122; a clear of 16 (`space.inset.md`) above it and 16 under it; the pill of two `space.inset.sm` of 8, a 14 by 1.7 line and 2 px of edges; then `space.stack.sm` of 8. `pill` is its height, `lift` the rise a status adds, `clear` the action's gap to the toolbar with a status. `centred` is form + 2 x (toolbar + 16 + 16), the least height that keeps the form exactly on the centre, and 520 is above both values. `room` is form + 16 + toolbar + 16, the height under which the form's top passes the board's edge. Expected output, rounded to one decimal: `pill 41.8 lift 49.8 clear 65.8 centred 443.8 friendly 451.8 room 289.8 friendly 297.8`.

```bash
node -e 'const f=135.8,fr=143.8,t=122,c=16,pill=2*8+14*1.7+2,lift=pill+8;const r=x=>x.toFixed(1);console.log("pill",r(pill),"lift",r(lift),"clear",r(c+lift),"centred",r(f+2*(t+c+c)),"friendly",r(fr+2*(t+c+c)),"room",r(f+c+t+c),"friendly",r(fr+c+t+c))'
```

## Changelog

- v1.0 (2026-11-06): first version, from K-0171 to K-0184 and audit D.3 row 20. No Jira tool in this role, so ORV-223 and ORV-222 comment 10513 were not read; the dependency comes from the envelope fact and ORV-222 question 6. Downstream to review: the designer envelope (design.md, open questions 7 and 9, and the `sm` layout of `empty-look-1`), the builder envelopes (rows per open question 10, the empty half after the first ORV-222 PR), the qa envelope (Rows per PR lines once the PRs exist), `catalog/coverage.md`, `catalog/application/task-bar.yaml`, `catalog/application/canvas-board.yaml`, `catalog/base/spinner.yaml`, `catalog/base/featured-icon.yaml` and `DESIGN.md` section 4.
- v1.1 (2026-11-06): the designer's C1 to C4 and the `IconProps` impact line of `design.md`, accepted under delegation (ORV-223 comment 10520), in `empty-bar-1`, `empty-look-1`, `load-live-1`, `load-board-1`, the impact list and AC rows 1 and 35; open questions 7 and 9 answered; the dependency cites ORV-222 spec v1.2; rows 10, 17, 32 and 38 drop `expectNoGlyphClip`, which throws when no ancestor clips and cannot see a mark above the font ascent, for an overflow check and `expectLabelInkWhole` or `expectLinesClear`, with rows 17 and 38 stopping at the clipping root `.ds-taskbar` or `.ds-board`. Downstream to review: `design.md` (its `spec:` line), the builder envelopes (`icons.tsx`, the two `max-width` tokens, the rule on `.ds-board[data-loading]`, the four plays) and the qa envelope (rows 1, 10, 17, 32, 35 and 38).
- v1.2 (2026-11-06): no row measured the width cap of `design.md` C2, so the Check of rows 5 and 27 now asserts it in `Default`: on a block parent wider than the cap, the root is not wider than the resolved `--cmp-empty-state-max-width` or `--cmp-loading-state-max-width`. Downstream to review: `design.md` (its `spec:` line, and "every AC row stand" in C2), the builder envelopes (the two `Default` plays and their `layout: "padded"`) and the qa envelope (rows 5 and 27).
- v1.3 (2026-11-06): by the main session. Rows 25 and 42: a sign-off has an empty write set, so its PNG paths go on a Jira comment. Rows 10, 17, 32 and 38 add `expectFrameCutsNoInk`, which PR 186 merged, for the frame clip that the overflow check alone does not prove. The dependency cites ORV-222 spec v1.3 and PR 186 as merged. Downstream to review: the builder envelopes (the four plays) and the qa envelope (rows 10, 17, 25, 32, 38, 42).
- v1.4 (2026-11-06): from the deviation of ORV-223-build-1 (L-0025). With the toolbar mounted the board's action is the twelfth stop from the region, not one Tab away. By the main session's decision the overlay keeps its place in the DOM: `empty-board-1` says so, row 20 reads focus on the region, then Tab in page order with a bound of 14, open question 8 is answered with option (d) recorded, and W7 counts the stops. Rows per PR gains the line for PR 190. Downstream to review: `design.md` line 19 (and its `spec:` line), the comment at `CanvasBoard.tsx` line 321, and the qa envelope (row 20).
- v1.5 (2026-11-06): from finding F1 of `ORV-223-signoff-1` (ORV-223 comment 10545) and `design.md` D15, amendments A1 to A8 of "Rework F1". On a short board the form rises clear of the toolbar, the shelf and a one line status: `empty-board-1` says so (A1), rows 19 and 22 change (A2, A3), rows 44 to 46 are new (A4), Rows per PR takes them (A5), the row guide and rows 25 and 26 follow (A6), and the impact list gains the block and the stories (A7). New rule `empty-board-short-1` records D15's named costs, open limit and fallback as accepted under delegation and says the proof is Chromium only, and W8 prints its heights. The Acceptance criteria intro, open question 10 and Depends on follow rows 44 to 46. Downstream to review: `design.md` (its `spec:` line), the builder envelope (takes "Rework F1": `recipes.css`, the `EmptyAt360` play and its comment, `EmptyShort`, `EmptyShortInEnglish`, `EmptyBoardShort`, `canvas-board.yaml` line 25) and the qa envelope (rows 19, 22, 25, 26 and 44 to 46).
