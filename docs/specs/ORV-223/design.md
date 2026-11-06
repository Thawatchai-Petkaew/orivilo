---
issue: ORV-223
spec: docs/specs/ORV-223/spec.md v1.5
task: ORV-223-design-1, ORV-223-design-2, ORV-223-design-3
date: 2026-11-06
---

# ORV-223 design: Empty state and Loading state (application)

The look of the neutral tile, the two EmptyState sizes and the LoadingState column, the answers to open questions 7 and 9, and one row of CSS and markup per rule for the builder.

Open question 7 keeps its default. Open question 9 keeps its default on the board and differs in the bar (C1). The measure of the centred column adds two component tokens the spec does not list (C2). Two acceptance and rule texts cannot work as written (C3, C4). The tables below assume C1 and C2 are accepted. Each names its fallback, so a refusal changes a few lines.

Finding F1 of the sign-off `ORV-223-signoff-1` changes how the form sits on a short board: row D15 and the section "Rework F1". That section lists the spec changes it needs as amendments A1 to A8, which ask for spec v1.5.

Finding F2 of the sign-off `ORV-223-signoff-2` extends that rule to the open task bar: row D16 and the section "Rework F2". That section lists amendments A9 to A16, which ask for spec v1.6.

## Flow

1. A person opens a board with no nodes. CanvasBoard's overlay shows the tile, the title and the host's action, centred on the board, and on a short board raised just enough to stay clear of the toolbar (D15). Nothing is spoken: the words are read in page order (`empty-live-1`).
2. The person opens the task bar with no jobs. The panel shows the tile at the bar's start edge, the title over the description, and the action under them. The header still reads "ยังไม่มีงาน". If the board is empty too and short, the board's form rises clear of the card in the same frame (D16), and goes back when the panel closes.
3. The person presses the action. What it does is the host's; every action in the stories is mock.
4. The last item leaves. The bar's own status says `taskBar.none` and the toggle takes focus. The board's status line says what was deleted and the region takes focus, and the action is reached by Tab in page order after the toolbar (`empty-board-1`, spec row 20).
5. A wait starts. The board's overlay shows the ring and the words once, and the always-mounted status line carries the same words out of sight. When the wait ends the overlay goes and the line returns to `message || status || ""` (`load-board-1`).

`empty` is false while `loading` is true (`CanvasBoard.tsx` line 1073), so the two forms never show together.

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 7 | The neutral tile's ground on the board and in the bar | (a), confirmed: `border.subtle`, which is `fi-neutral-colour-1` | It is the only option that shows on all three grounds in all six boundaries. Against its ground the tile measures 1.15 on the board and 1.30 on the card in neutral light, 1.44 and 1.18 in neutral dark, and at least 1.23 and 1.39 in the other four (table in Evidence). Option (b) measures 1.00 to 1.06 on the board, so the tile is gone there; option (c) measures 1.00 on the card in all six, so it is gone in the bar. In dark, option (b) is also a near black hole on a card. Compare `ground-study.png`. The fill is faint on purpose: the glyph carries the tile at 3.94 or above, the words carry the meaning, and the action stays the loudest thing in the form |
| 9 | The glyphs | Board: (a), confirmed, `ArtifactIcon` (Lucide Shapes). Bar: not the default, a new `JobsIcon` (Lucide ListTodo) in place of `QueuedIcon` (C1). Table: (a), a follow-up card, unchanged | `QueuedIcon` is the mark of one job state: `TaskBar.tsx` line 77 draws it on every queued row. In a tile above "ยังไม่มีงานบนบอร์ดนี้" it says something is waiting when nothing is, and the first job the person starts lands in the same panel under the same clock. `glyph-study-light-1x.png` shows the two together. ListTodo says "a list of jobs" and claims no state. ListChecks reads as finished work, Inbox as messages, ClipboardList is the busiest at 16 px, and Layers does not say list. `ArtifactIcon` is also taken, by a node kind (`CanvasNode.tsx` line 45), but a kind of thing makes no false claim about the board, and keeping it adds no glyph, so the five other board candidates in the study are not worth one |

## Changes this design asks for

<!-- prettier-ignore -->
| # | Change | Spec text it changes | Fallback if refused |
| --- | --- | --- | --- |
| C1 | `export const JobsIcon = lucide(ListTodo, "JobsIcon");` in `icons.tsx`, used by the task bar's empty form and by FeaturedIcon `Neutral` | `empty-bar-1` (`icon={QueuedIcon}`); AC row 1 ("with `QueuedIcon`", "a clock glyph", which becomes "a list glyph"); open question 9 default for the bar; the impact list gains `src/components/icons.tsx`: one import, one line, and the glyph count in its comment | `icon={QueuedIcon}` and no new glyph: one prop, and AC row 1 stands |
| C2 | Two new component tokens, `empty-state.max-width` and `loading-state.max-width`, both from `size.panel.default` (320). `.ds-empty-state` at `md` and `.ds-loading-state` cap their column with them; `sm` has no cap | `empty-look-1` ("reads only these new component tokens"); `load-live-1` ("reading one new token"). W5 stands; AC rows 5 and 27 measure the cap (spec v1.2) | Drop both tokens and the two `max-inline-size` lines. A long description then runs 756 px on one line under a 40 px tile (`measure-uncapped.png`) |
| C3 | AC row 1: replace `expectInkCentred` with a box check, the svg's centre on the tile's centre to 0.5 px on both axes | AC row 1, Check column | None. `expectInkCentred` reads text, and `visual-asserts.ts` line 835 throws "has no text to measure" on a tile that holds only an svg. This is ORV-222 design C3 again |
| C4 | `load-board-1` hides the line by a recipe rule on `.ds-board[data-loading]`, not by adding the `sr-only` class | `load-board-1`, the words "by the `sr-only` form"; AC row 35's check stands | None. `recipes.css` is not in a layer, so `.ds-board__status` beats Tailwind's `sr-only`: the class alone measures 34 by 18 px, with its padding of 8 and 16 and its 1 px border kept, and AC row 35 asks for 1 by 1. The rule measures 1 by 1 |

Impact list of C2, as `AGENTS.md` rule 2 asks: `component.json` two tokens, `generated.css` regenerated, `recipes.css` two lines. No semantic or profile change, no pair, no change to `recipes.test.ts`. The precedents are `.ds-evidence-card` (`recipes.css` line 4839), which reads the same size, and `component.json` line 2286, a `max-width` token from `size.panel.min`.

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | Tile ground and glyph | `border.subtle`, `text.secondary`. No edge on the tile | Open question 7. The same fill as Skeleton and Progress's track: quiet furniture, never a feedback colour |
| D2 | Tile size per form | `md` form 40 / 20, `sm` form 32 / 16 | W1. `EmptyState` passes its own `size` to the tile |
| D3 | Tile radius and Friendly's scale | `shape.media.radius` as ORV-222 D2: 12 neutral, 8 Professional, 16 Friendly. Under Friendly the 32 px tile is a circle and the `md` tile a rounded square. The `md` tile reads `size.control.md`, which `friendly.json` sets to 44, so it renders 44 px there, not the 40 of D2, and its Button is 44 too; `sm` stays 32. The `md` form with an action is 143.8 px tall under Friendly and 135.8 px elsewhere (`matrix-1440.png`, S2) | Accepted in ORV-222 D2 as that profile's own shape. The 44 px is that profile's own scale, not a defect: Friendly is the 44 px control profile. D15 reads the rendered form, so it needs no per profile value |
| D4 | Forced colours | The tile keeps ORV-222's transparent outline, and `neutral` adds nothing | `forced-colours.png`: the outline draws in the system ink, glyph and words stay |
| D5 | Title over text | `type.label.md` 500 in `text.primary` over `type.body.sm` 400 in `text.secondary`, 14 / 1.7 both, 4 px apart, at both sizes | `DESIGN.md` section 4, compact form. 14 px on a 1440 board is small but calm; the tile and the action give the form its presence, and a bigger title would be a third type form to keep in step |
| D6 | `md` layout, confirmed | A centred column: tile, 16, text, 16, action. Capped at 320 (C2) | `empty-look-1`, W5. Without a description the same gaps hold (`board-empty-*`) |
| D7 | `sm` layout, confirmed | Tile at the start edge, 12, then a column of text, 8, action. Title, description and action share one start edge. Text aligns to the start | `empty-look-1`, W5. In the bar the tile starts on the header label's start, x 33 at 360 (`bar-neutral-light-360-en.png`) |
| D8 | Title on the tile at `sm` | The column's top padding is `(tile - title line) / 2` = (32 - 23.8) / 2 = 4.1 px, only when a tile comes before it, so the first line centres on the tile at any line count and a form with no tile leaves no gap | The form of ORV-222 D8. Measured off by 0.01 px at one and three lines. AC row 7 holds: with no tile the root is the title's height, 23.8 px |
| D9 | Wrap | `overflow-wrap: anywhere` on title and description only, so the caller's action is left alone. Nothing clamped | `empty-look-1`. The long Thai fixture wraps to two title lines at `md` and three at `sm`, nothing clipped. The stacked marks sample takes one line at `md` and two at `sm`, with marks clear (`thai-marks-3x-light.png`) |
| D10 | The action | A `secondary` Button at both places: `size="md"` on the board as today, `size="sm"` in the bar, the height of the toggle under it | "The tile quieter than the action" (AC row 25). The primary stays free for the view's one primary action (`DESIGN.md` section 3, `action.primary`). This is the stories' choice; the caller owns the Button (`empty-action-1`) |
| D11 | No plate behind the form on the board | The form sits straight on the dots | At 3x the dots stay far fainter than the text and none reads as a Thai mark (`board-dots-3x-light.png`). A plate would add a card to a screen that has nothing on it |
| D12 | LoadingState column, confirmed | Ring 24, 8, label, 16, action. Both forms measure the same: ring 24, 8 px to the label, 14 / 23.8, the same ink, centred to 0.01 px | `load-live-1`. The 8 is `.ds-spinner[data-size="lg"]`'s own gap, so ring and label stay one unit and the action stands apart at 16 |
| D13 | Loading against empty | The same centred column, the same cap, the same 16 before the action, the ring in the tile's place | AC row 42: one product. No tile around the ring: the ring is the thing to look at, and a tile would make a wait look like a state |
| D14 | Motion | None added. EmptyState has no animation or transition; the ring follows `spin-motion-1`. The panel's existing fade is the bar's, not EmptyState's | `empty-look-1`, `load-use-1` |
| D15 | The form on a short board (F1) | Target: the form stays on the board's centre and rises only as far as it must. The action's bottom stays at least 16 px (`space.inset.md`) above the toolbar's top, or the shelf's top when one is mounted; with a one line status showing, at least 8 px (`space.stack.sm`) above the pill. The horizontal centre never moves. There is no px threshold: the limit is the toolbar's own top edge, read live through `anchor()`. No new token. Proved by rows 44, 45 and 46 (`EmptyShort`, `EmptyShortInEnglish`, `EmptyBoardShort`, amendment A4) | F1: on a 294 by 360 board the form sat 25.9 px into the toolbar and 3 of its 14 buttons could not be pressed. 16 is the distance every piece of board furniture already keeps. Exact CSS in "Rework F1". D16 extends this row to the open bar |
| D16 | The form and the open bar (F2) | Target: with the bar's panel open, the action's bottom also stays at least 16 px (`space.inset.md`) above the bar's top, read live through `anchor()`, so the form clears the higher of the bar and the toolbar or shelf. A status adds nothing to that clear with the panel open, since the pill stands at the board's top. The action never rises past 16 px under the board's top: 56 px is the lowest the form's bottom goes, 60 under Friendly (`--cmp-button-height-md` plus `space.inset.md`). The horizontal centre never moves. Tall boards and the closed panel do not change. No new token. Proved by rows 47 to 50 (`EmptyBarOpen`, `EmptyBarOpenInEnglish`, `EmptyJobsOpen`, `EmptyBarOpenWithStatus`, amendment A11) | F2, AC row 25: on a 900 by 420 board with the empty bar open the form sat 38.7 px into the card, so the card's edge cut one form in two and the board's action read as the bar's second button. D15 cleared the toolbar, which the card hides, and not the card on top of it. Exact CSS in "Rework F2" |

## States

<!-- prettier-ignore -->
| State | Neutral tile | EmptyState | LoadingState | The action inside either |
| --- | --- | --- | --- | --- |
| default | The tile | `md` or `sm` | The ring and the label | Button's own |
| hover | None, not interactive | None, not interactive | None | Button's own (`state-hover-*`) |
| focus | Never focusable | Never focusable (`empty-focus-1`) | Never focusable | Button's line and halo in `focus.ring`, clear of the text above it, inside the bar (`state-focus-*`) |
| disabled | Does not apply | Does not apply | Does not apply | A read-only caller passes no action rather than a disabled one (`empty-action-1`) |
| loading | Does not apply | Replaced by LoadingState, never both | Is this state | A caller's own `Button loading`, if the stop takes time |
| empty | Does not apply | Is this state. No description, no icon or no action closes up with no gap left (AC row 7, measured) | Does not apply | No action is the read-only form |
| error | Does not apply | Not an error form: a failed load is Alert's | A failed wait ends the form; the region shows Alert | Does not apply |
| success | Does not apply | Does not apply, nothing celebrates | Ends the form, the content shows | Does not apply |

Selected does not apply to any of these. A missing title cannot reach EmptyState: the type refuses it (AC row 12). A missing LoadingState label falls back to `spinner.loading`.

## Builder table: CSS and markup per rule

The recipe text follows the table. `load-use-1` is a docs row and draws nothing.

<!-- prettier-ignore -->
| Rule | Markup | CSS |
| --- | --- | --- |
| fi-neutral-1 | Type block below. `const Glyph = props.variant === "neutral" ? props.icon : GLYPHS[props.variant];` then `<Glyph />` in the same `span`. `type IconProps` at `icons.tsx` line 65 is not exported yet: add `export`, which the impact list needs with or without C1. `AlertProps` keeps its own four kinds | None: `.ds-featured-icon > svg` sizes the glyph at each size |
| fi-neutral-colour-1 | None | `[data-variant="neutral"]`, after `[data-variant="info"]`. Tokens below. `pairs.ts`: `featured-icon.neutral.fg` on `featured-icon.neutral.bg` at floor 3, and add the tile's edge against its ground to the "Not listed" line of `fi-colour-1` (lowest 1.15) |
| empty-api-1 | Block below. `FeaturedIcon` gets `size={size}` | `.ds-empty-state` and its parts. Exports from `src/components/index.ts` |
| empty-sem-1 | `` const Title = `h${level}` as const; `` in a `div` root, `p` for the description; no `main`, `header`, `footer`, `section`, no `role` | No heading style outside `.ds-empty-state__title`. The recipe resets `margin`, since `.ds-board__overlay p` leaves |
| empty-look-1 | The `__body` and `__text` wrappers in the block below, so `md` and `sm` differ in CSS only | `.ds-empty-state`, `[data-size="sm"]`, `__body`, `__text`, `__title`, `__description`, `__action`. Tokens below. Six pairs in `pairs.ts` as the rule says |
| empty-action-1 | `{action ? <div className="ds-empty-state__action">{action}</div> : null}`, a wrapper because the node is the caller's | `.ds-empty-state__action` |
| empty-live-1 | No role on any part. The `NoResults` story's host owns the empty `role="status"` container and keeps it mounted | None |
| empty-focus-1 | No `tabIndex`, `autoFocus` or `focus()` in `EmptyState.tsx` | No `:focus` rule on `.ds-empty-state` |
| empty-bar-1 | The `p` at `TaskBar.tsx` line 224 becomes a `div`, since a `div` cannot sit in a `p`: `<div className="ds-taskbar__empty"><EmptyState size="sm" level={3} icon={JobsIcon} title={m.taskBar.emptyTitle} description={m.taskBar.empty} action={emptyAction} /></div>` | `.ds-taskbar__empty` leaves the shared rule at lines 4171 to 4180, which stays for `.ds-taskbar__reason`, and its own rule drops `color` and keeps `padding` |
| empty-board-1 | `<div className="ds-board__overlay"><EmptyState size="md" level={2} icon={ArtifactIcon} title={emptyText ?? m.board.empty} action={emptyAction} /></div>`; the focus fallback as the rule says | `.ds-board__overlay p` (line 1596) leaves. The rest of `.ds-board__overlay` stays: it is what these screens rendered, and its `> *` still gives the form its pointer events. The blocks in "Rework F1" and "Rework F2" are added after the status line's anchored rules (D15, D16) |
| load-api-1 | Block below | `.ds-loading-state`. Exports from `src/components/index.ts` |
| load-live-1 | Block below. `status`: `<Spinner size="lg" label={text} />`. `off`: `.ds-loading-state__quiet` holding `<Spinner decorative size="lg" />` and `<p className="ds-loading-state__label">`. The action sits outside both | `.ds-loading-state__quiet`, `__label`, `__action`. `pairs.ts`: `spinner.fg` on `board.bg` at floor 4.5 in the place of "overlay text" (line 667) |
| load-busy-1 | No `aria-busy` in `LoadingState.tsx`. `InRegion` story's host sets it on itself | None |
| load-mount-1 | No change to Spinner, SkeletonGroup or Table markup | None |
| load-board-1 | `<div className="ds-board__overlay"><LoadingState live="off" label={m.board.loading} /></div>`; the line's text is `{loading ? m.board.loading : message \|\| status \|\| ""}`; no `sr-only` class (C4); the `SpinnerIcon` import leaves | `.ds-board__spinner` (line 1599) leaves. New rule `.ds-board[data-loading] .ds-board__status`, after `.ds-board__status:empty`. `data-loading` is already on the section (`CanvasBoard.tsx` line 1127). It is the form of `.ds-table__head` with padding and border added. The later `:has()` status rules (`recipes.css` lines 2490, 4240, 4261, 4271, 4278) set only placement, so they do not undo it |

The type of `fi-neutral-1`, a union on `variant`, so AC row 4's `@ts-expect-error` lines hold:

```ts
export type FeaturedIconGlyph = ComponentType<IconProps>;

type FeaturedIconKind =
  | { variant: "success" | "warning" | "danger" | "info"; icon?: never }
  | { variant: "neutral"; icon: FeaturedIconGlyph };

export type FeaturedIconProps = FeaturedIconKind & {
  size?: FeaturedIconSize | undefined;
  className?: string | undefined;
};
```

EmptyState's markup:

```tsx
<div className={cx("ds-empty-state", className)} data-size={size}>
  {icon ? <FeaturedIcon variant="neutral" icon={icon} size={size} /> : null}
  <div className="ds-empty-state__body">
    <div className="ds-empty-state__text">
      <Title className="ds-empty-state__title">{title}</Title>
      {description ? <p className="ds-empty-state__description">{description}</p> : null}
    </div>
    {action ? <div className="ds-empty-state__action">{action}</div> : null}
  </div>
</div>
```

LoadingState's markup:

```tsx
const text = label ?? m.spinner.loading;

<div className={cx("ds-loading-state", className)}>
  {live === "status" ? (
    <Spinner size="lg" label={text} />
  ) : (
    <div className="ds-loading-state__quiet">
      <Spinner decorative size="lg" />
      <p className="ds-loading-state__label">{text}</p>
    </div>
  )}
  {action ? <div className="ds-loading-state__action">{action}</div> : null}
</div>;
```

The recipe, exactly as rendered in the screens below. The first rule goes after `.ds-featured-icon[data-variant="info"]`, the `ds-empty-state` and `ds-loading-state` blocks after `.ds-skeleton-group`, and the board rule after `.ds-board__status:empty`:

```css
.ds-featured-icon[data-variant="neutral"] {
  background: var(--cmp-featured-icon-neutral-bg);
  color: var(--cmp-featured-icon-neutral-fg);
}

/* Empty state (ORV-223): md is a centred column, sm starts at the line's start. */
.ds-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cmp-empty-state-gap-md);
  min-inline-size: 0;
  max-inline-size: var(--cmp-empty-state-max-width);
  text-align: center;
}
.ds-empty-state__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cmp-empty-state-gap-md);
  min-inline-size: 0;
  max-inline-size: 100%;
}
.ds-empty-state__text {
  display: flex;
  flex-direction: column;
  gap: var(--cmp-empty-state-text-gap);
  min-inline-size: 0;
  max-inline-size: 100%;
}
.ds-empty-state__title,
.ds-empty-state__description {
  margin: 0;
  overflow-wrap: anywhere;
}
.ds-empty-state__title {
  color: var(--cmp-empty-state-title);
  font-family: var(--cmp-empty-state-title-type-font-family);
  font-size: var(--cmp-empty-state-title-type-font-size);
  line-height: var(--cmp-empty-state-title-type-line-height);
  font-weight: var(--cmp-empty-state-title-type-font-weight);
  letter-spacing: var(--cmp-empty-state-title-type-letter-spacing);
}
.ds-empty-state__description {
  color: var(--cmp-empty-state-description);
  font-family: var(--cmp-empty-state-body-type-font-family);
  font-size: var(--cmp-empty-state-body-type-font-size);
  line-height: var(--cmp-empty-state-body-type-line-height);
  font-weight: var(--cmp-empty-state-body-type-font-weight);
  letter-spacing: var(--cmp-empty-state-body-type-letter-spacing);
}
.ds-empty-state__action {
  display: flex;
  max-inline-size: 100%;
}
.ds-empty-state[data-size="sm"] {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--cmp-empty-state-gap-sm);
  max-inline-size: none;
  text-align: start;
}
.ds-empty-state[data-size="sm"] > .ds-empty-state__body {
  flex: 1 1 auto;
  align-items: flex-start;
  gap: var(--cmp-empty-state-action-gap);
}
/* with a tile, the title's first line centres on it; later lines flow under it */
.ds-empty-state[data-size="sm"] > .ds-featured-icon + .ds-empty-state__body {
  padding-block-start: calc(
    (
        var(--cmp-featured-icon-size-sm) - var(--cmp-empty-state-title-type-font-size) *
          var(--cmp-empty-state-title-type-line-height)
      ) /
      2
  );
}

/* Loading state (ORV-223): the off form takes the ink, type and gap of .ds-spinner[data-size="lg"]. */
.ds-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cmp-loading-state-gap);
  min-inline-size: 0;
  max-inline-size: var(--cmp-loading-state-max-width);
  text-align: center;
}
.ds-loading-state__quiet {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-stack-sm);
  min-inline-size: 0;
  max-inline-size: 100%;
  color: var(--cmp-spinner-fg);
}
.ds-loading-state__label {
  margin: 0;
  overflow-wrap: anywhere;
  font-family: var(--ds-type-body-sm-font-family);
  font-size: var(--ds-type-body-sm-font-size);
  line-height: var(--ds-type-body-sm-line-height);
  font-weight: var(--ds-type-body-sm-font-weight);
}
.ds-loading-state__action {
  display: flex;
  max-inline-size: 100%;
}

/* While the board loads the overlay shows the words; the line keeps them for assistive technology. */
.ds-board[data-loading] .ds-board__status {
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  white-space: nowrap;
  clip-path: inset(50%);
}
```

Component tokens for `component.json`, with `$description` lines naming ORV-223. The names are the spec's, and the two marked C2 are new:

<!-- prettier-ignore -->
| Token | References |
| --- | --- |
| `featured-icon.neutral.bg`, `featured-icon.neutral.fg` | `border.subtle`, `text.secondary` |
| `empty-state.title`, `empty-state.description` | `text.primary`, `text.secondary` |
| `empty-state.title-type`, `empty-state.body-type` | `type.label.md`, `type.body.sm` (`$type` typography, as `toast.title-type`) |
| `empty-state.text-gap`, `empty-state.action-gap` | `space.inline.sm`, `space.stack.sm` |
| `empty-state.gap-md`, `empty-state.gap-sm` | `space.stack.md`, `space.inline.lg` |
| `empty-state.max-width` (C2) | `size.panel.default` |
| `loading-state.gap` | `space.stack.md` |
| `loading-state.max-width` (C2) | `size.panel.default` |

Story notes:

- EmptyState and LoadingState stories take `layout: "padded"`, and the 360 px stories use `Narrow`.
- A form inside a parent with no width of its own wraps one glyph per line, because `overflow-wrap: anywhere` lowers the min-content width. My first sheet did this with `.ds-taskbar`, whose `container-type: inline-size` gives it no width of its own inside a centred layout. So no story puts a bar in `layout: "centered"`.
- The Thai sample for `expectLinesClear` should be long enough to wrap and should stack marks above and below, as the `sm` form in `thai-marks-3x-light.png` does.
- Stories pass `size="sm"` on the bar's Button (D10).

## Rework F1: the form on a short board

Task `ORV-223-design-2`, for finding F1 of `ORV-223-signoff-1`. Rendered on 2026-11-06 on the built stories at head `12afffe`, Storybook on port 6450, Chromium through Playwright, reduced motion on, with the CSS below injected by `addStyleTag`. No file under `packages/` changed. Sizes other than a story's own were set by resizing the board's host in the page, so no story's board height was raised. Firefox and WebKit are not installed here, so nothing below was rendered in them.

### The CSS

`.ds-board` takes no change: no `container`, no size containment. `.ds-board__overlay` keeps its rule at line 1654 as it stands. This block goes after the status line's two anchored `@supports` blocks, before the comment that starts "An open list adds up". Order matters inside it: the shelf and status rules equal the first rule's specificity and win by coming later.

```css
/* The empty form never sits under the toolbar (ORV-223 D15). Without anchor positioning it starts at
 * the top: the toolbar's height cannot be read, and clear beats centred. */
.ds-board:has(.ds-controls) .ds-board__overlay:has(> .ds-empty-state) {
  justify-content: flex-start;
}
/* The box is symmetric about the board's centre while there is room, so the form stays centred. When
 * the form outgrows it, the auto margins fall to 0 and the reversed column grows it upward, away from
 * the toolbar. A status line adds its own height: 41.8 px of padding, line and border, then 8 px. */
@supports (anchor-name: --a) {
  .ds-board:has(.ds-controls) .ds-board__overlay:has(> .ds-empty-state) {
    --_clear: var(--ds-space-inset-md);
    position-anchor: --ds-board-controls;
    top: min(calc(anchor(top) - var(--_clear)), calc(100% - anchor(top) + var(--_clear)));
    bottom: calc(anchor(top) + var(--_clear));
    flex-direction: column-reverse;
    padding-block: 0;
  }
  .ds-board:has(.ds-shelf) .ds-board__overlay:has(> .ds-empty-state) {
    position-anchor: --ds-board-shelf;
  }
  .ds-board:has(.ds-board__status:not(:empty)) .ds-board__overlay:has(> .ds-empty-state) {
    --_clear: calc(
      var(--ds-space-inset-md) + 2 * var(--ds-space-inset-sm) +
        var(--cmp-node-body-type-font-size) * var(--cmp-node-body-type-line-height) + 2px +
        var(--ds-space-stack-sm)
    );
  }
  .ds-board:has(.ds-controls) .ds-board__overlay > .ds-empty-state {
    margin-block: auto;
  }
}
```

Notes for the builder:

- `justify-content: safe center` does not do this. Rendered with the reversed column, it fell back to the box's top and put the form on the toolbar. Keep the auto margins.
- The overlay holds one child, so `column-reverse` changes no reading or tab order.
- `:has(> .ds-empty-state)` is what leaves Loading alone. Do not widen the selector to `.ds-board__overlay`.
- `--_clear` is a local name, as `--_lift` and `--_glass` are, and `recipes.test.ts` skips `--_` names. The `2px` is the pill's two 1 px edges, the form of `calc(var(--_h) - 2px - ...)` at line 442 and lines 2433 and 2453. No new token, no pair, no prop.
- The status text is the later sibling, so the overlay cannot anchor to it without moving in the DOM, and `empty-board-1` keeps the overlay's place. That is why the pill's height is summed from the tokens that draw it. If `.ds-board__status` changes its padding, type or border, this calc changes with it. The comment above says so.

### The threshold, and why there is no number

The sign-off's candidate was a fixed one: `.ds-board { container: ds-board / size; }` and `@container ds-board (max-block-size: 420px) and (max-inline-size: 640px) { .ds-board__overlay { justify-content: flex-start; } }`. Tested by injection, it is refused:

<!-- prettier-ignore -->
| Case | Head | Candidate | D15 |
| --- | --- | --- | --- |
| 294 by 360, gap to the toolbar, buttons blocked | -25.9, 3 | 62.2, 0 | 16, 0 |
| 294 by 260 | -75.9, 6 | -37.8, 3 | Not rendered at 260. At 270 and at 200: 16, 0, with the form's top past the board's edge (see limits) |
| 900 by 240 | -13.9, 0 | -13.9, 0: the width cap lets it pass, and 1440 by 240 reads the same | 16, 0 |
| 294 by 300 | -55.9 by arithmetic, not rendered | 2.2 neutral, -5.8 Friendly | 16 by construction, not read alone at this size |
| 360 by 420 | 4.1, 0 | 122.2, top aligned, against row 22 | 16, 0 |
| Loading ring's top at 294 by 360 | 143.3 | 20.9: it matches every overlay | 143.3 |

A fixed number cannot hold because the point where the form meets the toolbar depends on three things that vary: the form's height (135.8, 143.8 under Friendly, more at each title line), the toolbar's rows (one, two or three, 50, 86 or 122 px) and the width that sets those rows. Raising it to cover them would top align boards that have room. So the threshold is the toolbar's own top edge.

The form stays exactly centred while the board is at least form + 2 x (toolbar + 16 + 16) tall. For the one line form:

<!-- prettier-ignore -->
| Toolbar rows | Toolbar height | Neutral, Professional | Friendly |
| --- | --- | --- | --- |
| One | 50 | 299.8 | 307.8 |
| Two | 86 | 371.8 | 379.8 |
| Three | 122 | 443.8 | 451.8 |

Checked at the edge, neutral, three rows: 294 by 444 reads 0 off centre, gap 16.1; 294 by 443 reads 0.4 off, gap 16. Under that height the form leaves the centre by half a pixel for each pixel of board lost, so it never jumps at a size.

The form does not centre in the free space above the toolbar instead. That would give 43 px on each side at 294 by 360 (arithmetic, not rendered) but would pull every board off its centre, tall ones included, and row 19 keeps the board's centre.

### S1: the 360 by 420 board

It stays nearly centred, not top aligned and not the tight fit. The form is 11.9 px above centre (15.9 under Friendly), the gap is 16 instead of head's 4.1 (0.1 under Friendly), and the top aligned form's gap of 122.2 is not used. So `EmptyAt360` still shows a form that reads as centred, and row 22 changes only in saying what "clear" means (A3). The action's focus halo of 3 px leaves 13 px clear of the toolbar.

### Measured with D15

Rows are board size. Figures are form top to form bottom, gap to the toolbar, and offset from the board's centre, neutral then Friendly. All are the same in Thai and English and in light and dark, the horizontal offset is 0 everywhere, and no button is blocked and no tile clipped on any of the 40 board screens.

<!-- prettier-ignore -->
| Board | Neutral | Friendly |
| --- | --- | --- |
| 294 by 360 | 70.2 to 206, 16, -41.9 | 62.2 to 206, 16, -45.9 |
| 360 by 420 | 130.2 to 266, 16, -11.9 | 122.2 to 266, 16, -15.9 |
| 662 by 360 | 106.2 to 242, 16, -5.9 | 98.2 to 242, 16, -9.9 |
| 900 by 240 | 22.2 to 158, 16, -29.9 | 14.2 to 158, 16, -33.9 |
| 1440 by 900 | 382.1 to 517.9, 316.1, 0 | 378.1 to 521.9, 312.1, 0 |

<!-- prettier-ignore -->
| Check | Result |
| --- | --- |
| Six boundaries, `EmptyRecipesAndModes`, 14 buttons each scrolled into view and hit tested, Thai and English | Head at 294 by 360: gap -25.9 (-29.9 Friendly), 3 blocked in all six. Head at 662 by 360: gap 10.1 (6.1 Friendly), 0 blocked. D15: gap 16, 0 blocked, 0 unread in all 24 cells |
| Tall boards | 1440 by 900 and 360 by 900 stay centred, offset 0 |
| Loading | Box and children identical to head at 294 by 360, 360 by 420 and 1440 by 900: ring 143.3 to 173.5, label 186.4 to 213.6 at the first. `flex-direction` column, `top` and `bottom` 0 |
| Status pill, `board.zoom-in` pressed | Pill 41.8 tall, one line, and the form's bottom stays 8 px above it. Gap from the action to the toolbar 65.8. 294 by 360 form top 20.4 (12.4 Friendly); 360 by 420 form top 80.4 (72.4 Friendly) |
| Every enabled toolbar command on an empty 294 by 360 board | One line pill each, longest 249.9 px of the 262 allowed ("Pan mode: drag to move the board"), Thai longest 219.5, pill gap 8. The add node command adds a node, so the form leaves |
| Real delete, `TurnsEmpty` at 294 by 360 | Form 20.4 to 156.2, "ลบ 1 node" 8 px under it |
| Focus on the action | `:focus-visible` true on 16 of 16 screens, gap 16 |
| Title line counts | 294 by 360: two lines top 46.4 (38.4 Friendly), three lines 22.6 (14.6). 360 by 420: two lines 106.4 (98.4), three lines 82.6 (74.6), gap 16 at all. Nothing clipped. My Thai three line sample took only two lines at 360 by 420, so three lines there is English only |
| Minimap on at 294 by 360 | Does not touch the form |
| No toolbar (`.ds-controls` taken out of the page) | Form 112.1 to 247.9 at 294 by 360, offset 0: the rule does not apply and the old centre holds |
| Mode pill at the top (simulated, a span added by hand) | No hit at 294 by 360 or 900 by 240. At 294 by 300 the form's root box meets the pill's box, though the centred tile's ink does not |
| Task bar lift (simulated, a 50 px bar added by hand) | The anchor follows: 294 by 420 toolbar top 208, form 56.2 to 192, gap 16. 1440 by 360 gap 16. 1440 by 900 offset 0 |

### A second case of the same defect: the shelf

The sign-off saw the shelf board 900 tall. At head, a 360 by 640 board puts the form at 280.1 to 359.9 and the shelf's top at 307.2, so the form overlaps the shelf by 52.7 px. D15 anchors to the shelf when one is mounted: form 211.4 to 291.2, gap 16. At 1440 by 640 the shelf is lower, head's gap of 19.3 stays and the form does not move. On the 700 tall screens the gap is 16 at 360 and 49.3 at 1440 (47.3 Friendly). The 640 figures come from a probe's printed output, and `before-shelf-neutral-light-360-th.png` shows the same overlap on a 700 tall board. Row 46 keeps this from coming back.

### What D15 costs, and its limits

- A status moves the form. The first toolbar command on a short board lifts it 49.8 px in one step, with no transition (D14), and it stays there until the next message, since a message persists. This also happens where the pill is not under the form: at 1440 by 360 the form goes from 112.1 to 247.9 to 92.4 to 228.2, 19.7 px, because the rule cannot read the pill's width. Tall boards do not move: at 1440 by 900 the pill stays 258.3 px clear of the form.
- A board under form + 16 + toolbar + 16 tall has no room. With a three row toolbar that is 289.8, 297.8 under Friendly. The form's top then passes the board's edge, so the decorative tile is cut first and the title next, while the action and the toolbar stay whole and no button is blocked. 294 by 290 top 0.2, 294 by 270 top -19.8, 294 by 200 top -89.8, the action alone. The action was chosen over the tile because it is what the person came to press.
- The same limit is 49.8 px higher with a status, and higher per title line. A two line title with a status at 294 by 360 has its top at -3.4, tile cut (about -11.4 under Friendly, by arithmetic). A four line title at 294 by 360 has its top at -1.2 (-9.2 Friendly), measured before the final CSS with the same clear of 16.
- A host's own `status` prop that wraps. The calc holds one line, and the pill grows upward onto the action: three lines at 294 by 360 are 89.4 tall, gap -39.6; two lines at 360 by 420 are 65.6 tall, gap -15.8. No toolbar message wraps at 294 px, and "ลบ 1 node" stays on one line; the long string here is a test string a host could pass. Left as an open point.
- Task bar on a very short board: 294 by 360 with the bar's 50 px lift puts the form at -3.8 to 132, tile cut by 3.8 px. The action stays clear.
- Browsers without anchor positioning take the first rule only. Rendered in Chromium by injecting that rule alone: 294 by 360 gap 62.2, 360 by 420 gap 122.2, and 1440 by 900 is top aligned, 358.1 px off centre. Those browsers lose the centre on tall boards. That trade is made on purpose: head's collision blocks buttons and a top aligned form blocks nothing. Whether it renders so in Firefox or WebKit is not proven.

### Amendments to the spec (ask v1.5)

The main session decides these; this file does not change `spec.md`.

**A1. `empty-board-1`, a new last paragraph.**

Old: the rule ends "The overlay keeps its place in the DOM, after the flow element and the toolbar, so reading order and stacking do not move. Row 20 holds what that means for the keyboard, and W7 counts the stops."

New: the same text, then "The form sits on the board's centre and rises only as far as it must to stay `space.inset.md` above the toolbar, or above the shelf when one is mounted, and `space.stack.sm` above a one line status. The rule applies to the empty form only; the Loading overlay keeps the board's centre (design.md D15)."

**A2. Row 19, Check column, one clause added.**

Old: "`Empty` play (lines 104 to 109 stay green, plus these two assertions)"

New: "`Empty` play (lines 104 to 109 stay green, plus these two assertions, and the form's centre on the board's centre to 0.5 px on both axes, the story's board being at least 520 px tall)"

This holds tall boards centred. `Stateful` defaults to 520, which sits above the 451.8 where a three row toolbar under Friendly starts to lift the form.

**A3. Row 22.**

Old, User sees: "The form centred in the frame, nothing cut". Old, Check: "`EmptyAt360` play: frame `scrollWidth` not above 360; the action's left and right edges inside the frame".

New, User sees: "The form centred across the frame, clear of the toolbar, nothing cut". New, Check: "`EmptyAt360` play: frame `scrollWidth` not above 360; the action's left and right edges inside the frame; the form's centre on the board's centre line to 0.5 px across; the action's bottom above the toolbar's top by at least the resolved `--ds-space-inset-md` less 0.5 px; the tile's top not above the board's top".

The story's comment at `CanvasBoard.stories.tsx` line 164, "the form stays centred and nothing is cut", changes to match.

**A4. Three new rows, after row 43.**

Old: none.

New:

<!-- prettier-ignore -->
| # | Given | When | User sees | Data | Check |
| --- | --- | --- | --- | --- | --- |
| 44 | Storybook, a 294 px frame, board 360 tall, Thai | CanvasBoard `EmptyShort` renders (`w-[294px]` frame, `Stateful height={360} fill={false}`) | The form clear of the wrapped toolbar, every button reachable, and still clear after a status appears | None | Play: toolbar height above twice `--cmp-button-height-sm`, so it has wrapped; action's bottom above the toolbar's top by at least the resolved `--ds-space-inset-md` less 0.5 px; `document.elementFromPoint` at the centre of each of the 14 buttons lies inside that button; tile's top inside the board; form's centre on the board's centre line to 0.5 px across. Then `userEvent` presses `[data-command="board.zoom-in"]`, `waitFor` the status text, and the pill's top is below the action's bottom by at least the resolved `--ds-space-stack-sm` less 0.5 px, with the action still above the toolbar and the tile inside the board |
| 45 | The same, English | `EmptyShortInEnglish` renders under `LocaleProvider locale="en"` | The same in English: "The board is empty", "Add your first node" | None | Row 44's check, status "Zoomed in" |
| 46 | Storybook, a 360 px frame, a shelf on the board | BlockLibrary `EmptyBoardShort` renders (`ShelfBoard initial={{ nodes: [], edges: [] }} height={640} fixed`) | The form clear of the shelf | None | Play: form's bottom above the shelf's top by at least the resolved `--ds-space-inset-md` less 0.5 px |

The builder proves each red on the head before the CSS goes in: row 44 reads gap -25.9 with 3 blocked, row 46 reads -52.7. Read lengths with the `resolvedLength(el, token)` form at `Select.stories.tsx` line 366, and scroll each button into view first, because `elementFromPoint` returns null outside the viewport.

**A5. Rows per PR.**

Old: `- PR 190: rows 1-26`

New: `- PR 190: rows 1-26, 44-46`. `parseRowList` in `scripts/ovl/result-recorder.mjs` splits on commas and takes a range in each part.

**A6. The row guide and rows 25 and 26.**

Old, guide: "... rows 35 to 39 the loading board, rows 40 to 43 the loading half as a whole."

New, guide: "... rows 35 to 39 the loading board, rows 40 to 43 the loading half as a whole, rows 44 to 46 the empty form on a short board."

Old, row 25: "... TaskBar `EmptyWithAction`, CanvasBoard `Empty`"

New, row 25: "... TaskBar `EmptyWithAction`, CanvasBoard `Empty`, `EmptyShort`, `EmptyShortInEnglish`, BlockLibrary `EmptyBoardShort`"

Old, row 26: "... src/components/task-bar src/components/canvas-board` (with ..."

New, row 26: "... src/components/task-bar src/components/canvas-board src/components/block-library` (with ..."

**A7. The impact list.**

Old, recipe row: "the rule of `load-board-1` is new, after `.ds-board__status:empty`;"

New, recipe row: "the rule of `load-board-1` is new, after `.ds-board__status:empty`; the block of design.md D15 is new, after the status line's anchored rules;"

Old, CanvasBoard row: "`Loading` (line 118, whose `getByText` would now find two nodes); `canvas-board.yaml` a11y line 28"

New, CanvasBoard row: "`Loading` (line 118, whose `getByText` would now find two nodes), the `EmptyAt360` play and its comment, new `EmptyShort` and `EmptyShortInEnglish`; `canvas-board.yaml` a11y line 28 and the overlay rule at line 25"

New row: "| Short board proof on the shelf (design.md D15) | Story only | `BlockLibrary.stories.tsx`, new `EmptyBoardShort` |"

No token and no prop changes, so nothing further is listed.

**A8. Version.**

Old: frontmatter `v1.4`, changelog ending at v1.4.

New: `v1.5`, with a changelog line naming F1, D15 and rows 44 to 46. Downstream, the builder's envelope takes this section and the qa envelope takes rows 44 to 46.

### Rework screens

All paths sit under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/`. The 135 screens are in its `shots/` folder, named `<family>-<profile>-<mode>-<size>-<locale>.png`, for example `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/shots/board-friendly-dark-294x360-th.png`. English screens use the story `EmptyInEnglish`, so the action is English too.

Contact sheet, all 135: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/contact-sheet.png`

Family sheets: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/sheets/`

Numbers: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/measures.json`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/matrix-hit.json`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-2/final-measures.json`. For blocked buttons in the matrix read `matrix-hit.json`, not `measures.json`: the second skipped cells outside the viewport and undercounts.

<!-- prettier-ignore -->
| Family, count | What it shows |
| --- | --- |
| `board-*`, 40 | Neutral and Friendly, light and dark, Thai and English, at five sizes. One centre line, a clear band above the toolbar, tall boards centred |
| `lines2-*`, `lines3-*`, 32 | Longer titles at 294 by 360 and 360 by 420. The shape holds, Thai marks whole |
| `status-*`, 16 | The pill between the action and the toolbar, on the start edge, 8 px under the action |
| `focus-*`, 16 | The action's line and halo, clear of the toolbar |
| `matrix-*`, 4 | All six boundaries in one page at 360 and 1440, Thai and English. The English matrix keeps the story's Thai action, a fixture on head |
| `shelf-*`, 8 | The form above the shelf, at 360 and 1440 |
| `loading-*`, 4 | The ring on the board's centre, as on head |
| `limit-*`, 5 | The named limits: 294 by 290, 270 and 200, a two line title with a status, a three line status |
| `turns-*`, 2 | The real delete at 294 by 360 |
| `before-*`, `candidate-*`, 8 | Head and the candidate on the sizes that decide it, with head's matrix and head's shelf |

I saw every family on its sheet, in `sheets/`, and the contact sheet. Full size and alone I opened `matrix-360-th.png`, `matrix-360-en.png`, `matrix-1440-th.png` and `matrix-1440-en.png`, not the other 131. `matrix-narrow.png` and `matrix-wide.png`, the sheets of those four, I did not open.

## Rework F2: the form and the open bar

Task `ORV-223-design-3`, for finding F2 of `ORV-223-signoff-2`. Rendered on 2026-11-06 at head `13db7b0`, Storybook on port 6474 from a scratch copy of that head, Chromium through Playwright, reduced motion on, with the CSS below injected by `addStyleTag`. No built story shows the board and the open bar together, so the screens come from probe stories in the scratch copy, of the same composition as the stories under "The stories and their plays". No file under `packages/` changed. Sizes other than a story's own were set by resizing the board's host in the page. Firefox and WebKit are not installed here, so nothing below was rendered in them.

### What the sign-off's candidate left open

The candidate holds on the look F2 names: gap 16 at 900 by 420, tall boards as they were. Rendered further, it fails three ways, so D16 is the candidate plus three things.

<!-- prettier-ignore -->
| Case, neutral | Head | Candidate | D16 |
| --- | --- | --- | --- |
| 900 by 420, empty bar open, form and gap to the bar | 128.2 to 264, -38.7 | 73.5 to 209.3, 16 | 73.5 to 209.3, 16 |
| Open bar on a board with no toolbar (`chrome={false}`), 900 by 420 | 142.1 to 277.9 | 444 to 579.8: `anchor(top)` has no default anchor, `top` falls back and the form leaves the board | 142.1 to 277.9, as head |
| 12 jobs open, 900 by 420, action | 224 to 264, the whole form on the rows | -31 to 9: cut, its centre outside the board, off the board in 98 of 134 sizes | 16 to 56, whole and pressable, off the board in 0 of 134 |
| Status with the panel open, 900 by 420, form | 78.4 to 214.2, gap 11.1 | 23.7 to 159.5, gap 65.8: it keeps a clear for a pill that is not there | 73.5 to 209.3, gap 16 |
| Status with the panel open, 900 by 640, form | 252.1 to 387.9 | 243.7 to 379.5: a tall board leaves the centre | 252.1 to 387.9, as head |
| Status with the panel open, 360 by 420 English, form top | 6.4 | 6.4 | 49.7 |

With the panel open the pill does not stand on the toolbar. The open list rule at `recipes.css` line 4557 sends it high on the start edge, 14.2 to 56 on a short board, so the 49.8 px the status adds to `--_clear` holds nothing apart. D16 sets `--_clear` back, which also removes one cost: with the panel open a status no longer moves the form (268 of 268 rows read the same top with and without one).

### The CSS

Two changes in `recipes.css`, nothing else. First, one line in the existing `.ds-board .ds-taskbar` rule (line 4466):

```css
anchor-name: --ds-board-taskbar;
```

Second, this block after the `@supports` block of D15, before the comment that starts "An open list adds up":

```css
/* With the bar's panel open the card covers the toolbar, so the form clears the higher of the two
 * (ORV-223 D16). The pill has gone up to the board's start edge, so it adds nothing to the clear.
 * The action stops rising one inset under the board's top: a full list must not push it off the
 * board, where neither a pointer nor the focus line can reach it. */
@supports (anchor-name: --a) {
  .ds-board:has(.ds-controls):has(.ds-taskbar__panel:not([hidden]))
    .ds-board__overlay:has(> .ds-empty-state) {
    --_clear: var(--ds-space-inset-md);
    --_floor: calc(var(--cmp-button-height-md) + var(--ds-space-inset-md));
    top: min(
      max(
        min(
          calc(anchor(top) - var(--_clear)),
          calc(anchor(--ds-board-taskbar top) - var(--_clear))
        ),
        var(--_floor)
      ),
      max(
        calc(100% - anchor(top) + var(--_clear)),
        calc(100% - anchor(--ds-board-taskbar top) + var(--_clear))
      ),
      calc(100% - var(--_floor))
    );
    bottom: min(
      max(calc(anchor(top) + var(--_clear)), calc(anchor(--ds-board-taskbar top) + var(--_clear))),
      calc(100% - var(--_floor))
    );
  }
}
```

Notes for the builder:

- Read as one limit: `L` is the higher of the toolbar's (or shelf's) top and the bar's top, less the clear, and never under the floor. The box is `min(L, 100% - L)` to `L`, the box of D15 with `L` in place of the toolbar. `anchor(top)` reads the distance from the side its own property names, so in `bottom` it is already `100% - top`, and one custom property cannot serve both.
- `:has(.ds-controls)` stays in the selector. Without it a board with no toolbar has no default anchor and the form leaves the board (table above).
- Specificity is 0,6,0 against 0,5,0 for the status rule of D15, so this `--_clear` wins wherever the block sits in the file.
- `anchor(top)` is the shelf when one is mounted, through the `position-anchor` of D15, so the shelf needs no rule of its own.
- The anchor holds because `{children}` sits inside React Flow, ahead of the overlay in the DOM (`CanvasBoard.tsx` lines 1146 and 1211). An anchor that came later would not resolve. Keep the bar a child of the board.
- The form's ancestors up to `.ds-board` keep visible overflow: this block sets none, and `.ds-board__overlay` stays free of it. The column grows upward out of a box that can be 0 tall, so a clip on the overlay would cut the whole form.
- `--_floor` is a local name like `--_clear`. `--cmp-button-height-md` is the board's action in D10, and it reads 44 under Friendly. No new token, no pair, no prop.
- Browsers without anchor positioning skip the block and `anchor-name`, and keep D15's top aligned form.

### The stories and their plays

Three things change in `CanvasBoard.stories.tsx`, which gains the imports of `TaskBar`, `fixtureManyJobs`, `expectFrameCutsNoInk`, `expectLabelInkWhole` and `inVitest`.

`expectFormClearOfToolbar` must select `.ds-board__overlay .ds-empty-state`, not `.ds-empty-state`. With a panel open the bar's own form comes first in the DOM, and the helper would measure that one.

```tsx
/** The bar's mock action (D10): it names its outcome and starts nothing. */
const startFirst = (label: string) => (
  <Button variant="secondary" size="sm">
    {label}
  </Button>
);

/** The action answers a hit test at its own centre. */
async function expectAnswers(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  await expect(hit !== null && el.contains(hit)).toBe(true);
}

/**
 * Rows 47 and 48: the form clears the open bar as it clears the toolbar, no ink is cut, and closing
 * the panel gives the form back to the toolbar's rule (ORV-223 D16).
 */
async function expectFormClearOfOpenBar(root: HTMLElement, actionName: string) {
  const board = part(root, ".ds-board");
  const form = part(board, ".ds-board__overlay .ds-empty-state");
  const action = within(form).getByRole("button", { name: actionName });
  const clear = resolvedLength(board, "--ds-space-inset-md");
  await expectFormClearOfToolbar(root, actionName);
  await expect(
    part(board, ".ds-taskbar").getBoundingClientRect().top - action.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(clear - HALF_PX);
  await expectAnswers(action);
  if (inVitest) {
    await expectFrameCutsNoInk(form, board);
    await expectLabelInkWhole(part(form, ".ds-empty-state__title"));
  }
  await userEvent.click(part(board, ".ds-taskbar button[aria-expanded='true']"));
  await waitFor(() =>
    expect(part(board, ".ds-taskbar button[aria-expanded='false']")).toBeVisible(),
  );
  await expectFormClearOfToolbar(root, actionName);
  await expectAnswers(action);
}
```

<!-- prettier-ignore -->
| Story | Render, inside `<div className="w-[900px] max-w-full">` | Play |
| --- | --- | --- |
| `EmptyBarOpen` | `<Stateful {...args} height={420} fill={false}><TaskBar jobs={[]} defaultExpanded emptyAction={startFirst("เริ่มงานแรก")} /></Stateful>`, args `emptyAction: addFirst("เพิ่ม node แรก")` | `expectFormClearOfOpenBar(canvasElement, "เพิ่ม node แรก")` |
| `EmptyBarOpenInEnglish` | The same under `LocaleProvider locale="en"`, "Add your first node", "Start the first job" | `expectFormClearOfOpenBar(canvasElement, "Add your first node")` |
| `EmptyJobsOpen` | The same with `jobs={fixtureManyJobs}` | The action's top at least the resolved `--ds-space-inset-md` less 0.5 px under the board's top, and `expectAnswers(action)` |
| `EmptyBarOpenWithStatus` | `EmptyBarOpen` with `status="ซูมเข้า"` on `Stateful` | The action's bottom stands the resolved `--ds-space-inset-md` above the higher of the bar's and the toolbar's tops, to 0.5 px: `Math.abs(Math.min(bar.top, toolbar.top) - action.bottom - clear) <= 0.5` |

Each story was run as a play in the scratch copy, Vitest browser mode, Chromium, with no a11y parameter on the stories, so the project's default applied, in a 1200 px wide page, so the board is 900:

<!-- prettier-ignore -->
| Play | Today's CSS | The candidate | D16 |
| --- | --- | --- | --- |
| `EmptyBarOpen` | Red: expected -38.6875 to be at least 15.5 | Green | Green, with `expectFrameCutsNoInk` and `expectLabelInkWhole` run |
| `EmptyBarOpenInEnglish` | Red: expected -38.6875 to be at least 15.5 | Not run | Green |
| `EmptyJobsOpen` | Green: head keeps the action on the board | Red: expected -31 to be at least 15.5 | Green |
| `EmptyBarOpenWithStatus` | Red: 11.1 from the bar, 4.89 off, at most 0.5 allowed | Red: 65.8 from the bar, 49.8 off | Green |

So the first two go red on today's CSS. The third is the guard on `--_floor` and the fourth on the `--_clear` line: each goes red if that line of D16 is left out. All four also finish without error in a static page at 360 and 1440 px, neutral and Friendly, with no sideways scroll, so the plays hold at the story's narrowest width.

### Measured with D16

3,484 rows for each of head, candidate and D16: 13 probe stories, neutral and Friendly, Thai and English, 67 board sizes (widths 360 to 1000 at 420 tall, heights 240 to 620 at 900 wide, and 360 and 1440 wide up to 900 tall).

<!-- prettier-ignore -->
| Check | Result |
| --- | --- |
| Closed panel, no bar, closed panel with a status, shelf with the panel closed, shelf with no bar | 0 of 268 rows differ from head in each, on form, action, bar, toolbar, shelf and pill |
| Tall boards, panel open | Every row where head already stood 16 or more above the bar reads the same under D16: 36 of 36 one line, 29 of 29 two lines, 22 of 22 three lines, 108 of 108 one job, 66 of 66 no action. 1440 by 900 stays 382.1 to 517.9, offset 0, Friendly 378.1 to 521.9 |
| The 420 tall sweep, empty bar, all widths | Gap to the bar 16 or more in 136 of 136 rows, both profiles, both locales |
| Gap under 16 anywhere, empty bar | 4 of 134 per profile, all at 240 and 260 tall, where the floor binds (limits below) |
| Action pressable | Not blocked in any row of D16 where it could be read. 152 reads were skipped, the action lying outside the 900 px page |
| Action on the bar's words | 0 rows in any story. The fixture's job names are short: see the costs |
| Horizontal centre | 0 on all 208 screens |
| Title lines, 900 by 420 | One line 73.5, two 49.7, three 25.9 (Friendly 61.5, 37.7, 13.9) to 209.3 (205.3). Tile whole, gap 16 |
| Title lines, 360 by 420 | Three lines 8.6 Thai, 2.1 English. Friendly -3.4 and -9.9, tile cut, the same limit as D15 with one more title line |
| The real toggle at 900 by 420 | Closed 128.2, open 73.5 with gap 16, closed again 128.2. Focus stays on the toggle |
| Focus on the action | 16 screens, line and halo in the profile's focus colour, gap to the card at least 16, so the 3 px halo stays at least 13 px clear of it |
| Shelf with the panel open | Unchanged while the shelf's limit stays over the floor: 900 by 640 is 153.4 to 289.2, 900 by 520 is 33.4 to 169.2, 360 by 640 is 81.4 to 217.2, gap to the shelf 16. The candidate changes nothing here because the shelf stands above the card. D16 differs from head in 120 of 268 rows, all where head's action reached above the floor (its top at most 9.2): there the floor brings it back |
| A read-only board (`variant="present"`), 900 by 420 | Form 129.5 to 209.3, clear of the mode pill at 16 to 57.8 on the end edge |

### What D16 costs, and its limits

In px, Thai, 900 wide, one row toolbar, neutral then Friendly. Thresholds lie between two measured rows and are worked out from the card's top, H - 194.7 (H - 198.7 Friendly).

- Opening the panel moves the form, in one step, with no transition (D14). It moves 54.7 on a board from 280 to 440 tall (54.7 from 280 to 460 Friendly), then less, and 0 from about 557 tall (573 Friendly). At 420 tall it is 54.7 with a one row toolbar, 18.7 with two, and 0 Thai or 6.5 English with three. One job moves it 34.1 at 900 by 420, and a full list up to 241.9 (246.9). Closing the panel gives back the same distance. No rule avoids this: the card is not there while closed, so reserving its room would change the closed board, which stays as it is, and a transition would break D14 and slide the form while the card fades in. It is bearable because it follows one deliberate press, with the pointer and focus on the toggle at the far end of the bar, and the form moves in the frame the card appears.
- A short board cuts the tile. With the empty bar open the tile passes the board's top under 346.5 tall (358.5): at 340 it reads -6.5 (-18.5), at 300 -46.5 (-58.5), against head's 8.2 (-3.8) at 300. The title follows under 290.5 (298.5). Three title lines at 900 reach this about 48 px higher. This is D15's trade with the bar in the toolbar's place: the action stays clear and whole, the decorative tile goes first. Holding the tile whole instead puts the action back on the card, which is F2. On the 300 tall screens the tile is gone altogether, and title and action read as a shorter form.
- The floor gives up the gap on the shortest boards. Under 266.7 tall (274.7) the action stops at 16 under the board's top, and the gap to the card falls: 9.3 at 260 (1.3), -10.7 at 240 (-18.7). By then only the action is left on the board.
- A list that fills the board puts the action on the card. Twelve jobs make the card 379 tall (383). The tile stays whole only from 546.8 tall (558.8), and the title from 490.8 (498.8). Under 467 (475) the action sits at the floor, so at 900 by 420 it stands at 16 to 56 across the card's top edge at 25, with 31 px on the card. This is the look of F2 on the action alone, kept on purpose: it stays whole, pressable and in reach of the keyboard, where the candidate lost it, and head put the whole form on the rows (`beforejobs-*`). At 360 wide the action ends just beside the first job's name, so a long name would run under it; the list scrolls and the panel closes, so the name can still be read. The fix is a list that caps itself to leave the form room, a change to the bar that this task leaves alone (open points).
- A board with no toolbar keeps the old centre with the panel open: 142.1 to 277.9 at 900 by 420 against a card top of 225.3, so F2's overlap stays there. D15 does not apply to that board either, and no screen pairs `chrome={false}` with a bar today.
- At 360 wide in English the pill's box meets the form's root box beside the tile, ink apart, as on head and the candidate (4 of 134 rows per profile; head reads 5 neutral and 4 Friendly). Under Friendly at 360 by 420 Thai the form's top of 44.2 lies above the pill's bottom of 60 with the pill on the start edge, ink apart (`status-friendly-*-360x420-th.png`).
- Browsers without anchor positioning keep D15's fallback, unproven in Firefox and WebKit as before.

### Amendments to the spec (ask v1.6)

The main session decides these; this file does not change `spec.md`. Numbers go on from "Rework F1".

**A9. `empty-board-1`, last paragraph.**

Old: "The form sits on the board's centre and rises only as far as it must to stay `space.inset.md` above the toolbar, or above the shelf when one is mounted, and `space.stack.sm` above a one line status. The rule applies to the empty form only; the Loading overlay keeps the board's centre (design.md D15). `empty-board-short-1` holds what this costs."

New: "The form sits on the board's centre and rises only as far as it must to stay `space.inset.md` above the toolbar, or above the shelf when one is mounted, and `space.stack.sm` above a one line status. With the task bar's panel open it also stays `space.inset.md` above the bar's top, a status adds nothing to that clear because the pill has gone to the board's top, and the action stops rising `space.inset.md` under the board's top. The rule applies to the empty form only; the Loading overlay keeps the board's centre (design.md D15, D16). `empty-board-short-1` holds what this costs."

**A10. `empty-board-short-1`.**

Old, opening: "... Their cause is finding F1 of `ORV-223-signoff-1` (ORV-223 comment 10545)."

New, opening: the same, then "The costs of D16 have their cause in finding F2 of `ORV-223-signoff-2`."

Old: none. New, four bullets after "Cost, no room on a very short board":

- "Cost, opening the panel moves the form. On a board where the open card stands above the toolbar the form rises in one step, with no transition: 54.7 px with a one row toolbar, 18.7 with two, up to 246.9 with a full list. Closing gives it back. From about 557 px tall (573 under Friendly) nothing moves with the empty bar."
- "Cost, no room above the open bar. With the empty bar open and a one row toolbar the tile passes the board's top under 346.5 px tall (358.5 under Friendly) and the title under 290.5 (298.5). The action stays clear and whole."
- "Cost, a list that fills the board. The action stops `space.inset.md` under the board's top and no higher, so under 467 px tall (475 under Friendly) with a full list it stands on the card, whole and pressable, and a long first job name can run under it. The same stop takes the gap to the empty card below 16 under 266.7 px tall (274.7)."
- "Open limit, a board with no toolbar. It keeps the board's centre with the panel open, so the form can overlap the card. No screen pairs them."

Old, Proof: "Every measure comes from CSS injected into the built stories at head `12afffe`, in Chromium only, ..."

New, Proof: "Every measure comes from CSS injected into the built stories at head `12afffe`, and for D16 into probe stories at head `13db7b0`, in Chromium only, ..." The rest stands, and "rows 19, 22 and 44 to 46" becomes "rows 19, 22 and 44 to 50".

**A11. Four new rows, after row 46.**

Old: none.

New:

<!-- prettier-ignore -->
| # | Given | When | User sees | Data | Check |
| --- | --- | --- | --- | --- | --- |
| 47 | Storybook, a 900 px frame, board 420 tall, the empty bar open, Thai | CanvasBoard `EmptyBarOpen` renders (`w-[900px] max-w-full` frame, `Stateful height={420} fill={false}`, `TaskBar jobs={[]} defaultExpanded`) | The form with "กระดานยังว่าง" and "เพิ่ม node แรก" whole on the board, clear of the bar's card, and back on the toolbar's rule once the panel closes | None | `EmptyBarOpen` play: the form read as `.ds-board__overlay .ds-empty-state`; action's bottom above the bar's top and above the toolbar's top by at least the resolved `--ds-space-inset-md` less 0.5 px; tile's top inside the board; form's centre on the board's centre line to 0.5 px across; `document.elementFromPoint` at the action's centre lies inside it; under `inVitest`, `expectFrameCutsNoInk(form, board)` and `expectLabelInkWhole(title)`. Then `userEvent` presses the toggle, `waitFor` it reads collapsed, and the action stands above the toolbar by the same clear and still answers |
| 48 | The same, English | `EmptyBarOpenInEnglish` renders under `LocaleProvider locale="en"` | The same in English: "The board is empty", "Add your first node", "Start the first job" | None | `EmptyBarOpenInEnglish` play: row 47's check |
| 49 | The same, a list that fills the board | `EmptyJobsOpen` renders with `jobs={fixtureManyJobs}` | "เพิ่ม node แรก" whole on the board and pressable | None | `EmptyJobsOpen` play: action's top under the board's top by at least the resolved `--ds-space-inset-md` less 0.5 px; `document.elementFromPoint` at its centre lies inside it |
| 50 | The same as row 47, with a status | `EmptyBarOpenWithStatus` renders with `status="ซูมเข้า"` | The form where it stands with no status, the pill at the board's top | None | `EmptyBarOpenWithStatus` play: the action's bottom stands the resolved `--ds-space-inset-md` above the higher of the bar's and the toolbar's tops, to 0.5 px |

The builder proves rows 47 and 48 red on the head before the CSS goes in: expected -38.6875 to be at least 15.5. Row 50 reads red on the head too, 4.89 off. Row 49 is green on the head: its proof is that it reads -31 with the `--_floor` lines left out. Row 47 needs `.ds-board__overlay` in `expectFormClearOfToolbar`, or the play measures the bar's own form.

**A12. Rows per PR.**

Old: `- PR 190: rows 1-26, 44-46`

New: `- PR 190: rows 1-26, 44-50`

**A13. The row guide, row 25 and the lists that name the rows.**

Old, guide: "... rows 44 to 46 the empty form on a short board."

New, guide: "... rows 44 to 46 the empty form on a short board, rows 47 to 50 the empty form with the bar open."

Old, row 25, When: "... CanvasBoard `Empty`, `EmptyShort`, `EmptyShortInEnglish`, BlockLibrary `EmptyBoardShort`"

New, row 25, When: "... CanvasBoard `Empty`, `EmptyShort`, `EmptyShortInEnglish`, `EmptyBarOpen`, `EmptyBarOpenInEnglish`, `EmptyJobsOpen`, BlockLibrary `EmptyBoardShort`". This closes the gap F2 names: row 25's Given now names a story that shows both together.

Old, open question 10 and Depends on: "rows 1 to 26 and 44 to 46"

New, both: "rows 1 to 26 and 44 to 50"

**A14. The impact list and the catalog.**

Old, recipe row: "the block of design.md D15 is new, after the status line's anchored rules;"

New, recipe row: "the blocks of design.md D15 and D16 are new, after the status line's anchored rules, and `.ds-board .ds-taskbar` gains `anchor-name`;"

Old, CanvasBoard row: "the `EmptyAt360` play and its comment, new `EmptyShort` and `EmptyShortInEnglish`;"

New, CanvasBoard row: "the `EmptyAt360` play and its comment, the selector in `expectFormClearOfToolbar`, new `EmptyShort`, `EmptyShortInEnglish`, `EmptyBarOpen`, `EmptyBarOpenInEnglish`, `EmptyJobsOpen` and `EmptyBarOpenWithStatus`;"

Old, `canvas-board.yaml` rule: "... and `space.stack.sm` above a one line status; a host `status` that wraps still reaches the action, ..."

New: "... and `space.stack.sm` above a one line status, and with the task bar's panel open `space.inset.md` above the bar, the action stopping `space.inset.md` under the board's top; a host `status` that wraps still reaches the action, ..."

No token and no prop changes. `--ds-board-taskbar` is an anchor name, as `--ds-board-controls` is, not a token.

**A15. A new worked example, after W8.**

Old: none.

New: "W9. The heights of D16, with the empty bar open and a one row toolbar. Input, from `design.md` "Rework F2" and D3: a one line form 135.8 px tall, 143.8 under Friendly; the card's top at H - 194.7, H - 198.7 under Friendly; a clear of 16; a Button 40 tall, 44 under Friendly. `tile` is the height under which the tile passes the board's top, `form + 16 + the card's offset`. `action` is the height under which the action sits at the floor, `Button + 16 + 16 + the card's offset`. Expected output, rounded to one decimal: `tile 346.5 friendly 358.5 action 266.7 friendly 274.7`."

**A16. Version.**

Old: frontmatter `version: 1.5`, changelog ending at v1.5.

New: `version: 1.6`, with a changelog line naming F2, D16 and rows 47 to 50. Downstream, the builder's envelope takes this section (`recipes.css`, `CanvasBoard.stories.tsx`, `canvas-board.yaml`) and the qa envelope takes rows 25 and 47 to 50.

### Rework screens

All paths sit under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/`. The 208 screens are in its `shots/` folder, named `<family>-<profile>-<mode>-<width>x<height>-<locale>.png`, for example `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/shots/open-friendly-dark-900x420-th.png`. Each size has eight: neutral and Friendly, light and dark, Thai and English. Each shot is the board alone at 2x. 0 page errors, 0 sideways scroll.

Contact sheet, all 208: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/contact-sheet.png`

Sheets, one per family and size: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/sheets/`

Numbers: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/manifest.json` and `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/sweep.json`. Play output: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-3/tools/plays.log`. The probe stories stay in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-signoff-2-tools/head/packages/design-system/src/components/canvas-board/`, files `Design3.stories.tsx` and `Design3Play.stories.tsx`.

<!-- prettier-ignore -->
| Family, sizes | What it shows |
| --- | --- |
| `open-*`: 900 by 420, 360 by 420, 1440 by 420, 1440 by 900 | The form whole on the dots, 16 above the card, the card one piece. At 360 the toolbar limits the form and the stub of sign-off 2's S1 shows behind the card in Thai, unchanged. At 1440 by 900 it sits on the board's centre |
| `closed-*`: 900 by 420, 360 by 420 | The closed panel as sign-off 2 measured it |
| `shelf-*`: 900 by 640, 900 by 520, 360 by 640 | The form above the shelf, the bar over the shelf's foot as on head |
| `short-*`: 900 by 340, 300, 260 | The named limits: tile cut at 340, gone at 300 with the title and action whole, the action alone at 260 |
| `status-*`: 900 by 420, 360 by 420 | The pill at the top start edge, the form where it stands with no status |
| `lines2-*`, `lines3-*`: 900 by 420, 360 by 420 | Longer titles. The shape holds, Thai marks whole. Friendly at 360 cuts the tile with three lines |
| `jobone-*`: 900 by 420 | One job, form above the card |
| `jobmany-*`: 900 by 420, 900 by 560, 360 by 420 | A full list: the action alone on the card's top edge at 420, the whole form above it at 560 |
| `focus-*`: 900 by 420, 360 by 420 | The action's line and halo, clear of the card |
| `before-*`, `beforejobs-*`: 900 by 420 | Head, no CSS injected: the action inside the card, and the whole form on the rows |

I opened the sheets of `open` at 900 by 420 and 360 by 420, `short` at 300 and 260, `status` at 360 by 420, `lines3` at both sizes, `jobmany` at all three, `beforejobs`, `focus` at 900 by 420, and `shelf` at 900 by 640, 900 by 520 and 360 by 640, and the contact sheet. Alone at full size I opened `open-friendly-dark-900x420-th.png` only. The other 11 of the 26 sheets I saw only on the contact sheet, and the numbers in `manifest.json` cover them. What I saw: at 900 by 420 the tile, title and action make one column on the dots, with a clear band over the card, and the bar reads as one card with one action of its own, in both profiles and both modes. Thai marks in กระดานยังว่าง and เพิ่ม node แรก are whole at full size, and those of the three line title read whole at sheet size; `expectLabelInkWhole` is the proof the play adds. The look that is not good, and is named above, is `jobmany` at 420: the action straddles the card's edge.

## Evidence

Rendered on 2026-11-06 in Storybook dev on port 6423, Chromium through Playwright, reduced motion on, at head `fe898b8`. EmptyState, LoadingState and FeaturedIcon are not built on this branch, so this is the recipe text above with its tokens, plus ORV-222's tile recipe, injected by `addStyleTag`, with markup of the shape above and real Lucide glyphs. The board and bar screens are the real stories `application-canvas-board--empty`, `application-canvas-board--loading` and `application-task-bar--empty` with the overlay or the empty `p` swapped in place, so the real boundary, toolbar, status line, fonts and Button recipe are on screen. The sheets are `base-badge--variants`, and the six boundaries are `base-badge--recipes-and-modes`. Copy is the spec's. The status line's text on the loading screens was set by hand, as `load-board-1` will set it.

What these screens do not prove: nothing here runs the built components, and the sign-off of AC rows 25 and 42 shoots the built stories again. The files sit in a scratch folder and will not outlive the session.

Measured on the 60 screens of the main run, 156 EmptyState forms and 96 LoadingState forms. Console errors: none on 48 of the 60, the 40 Thai screens and the 8 English sheets. Each of the 12 English bar and board screens logged one. I read the message on the three stories involved: it is the story's own play looking for Thai text, because those plays assert the Thai catalog and the locale here came from the toolbar global. It does not come from the injected CSS. The matrix, state and study screens were not logged.

<!-- prettier-ignore -->
| Check | Result |
| --- | --- |
| Frame width | `scrollWidth` never above the viewport on all 60, at 360 and at 1440 |
| Clipped title, description or label | 0 |
| `md`: tile to title, text to action | 16 px, 16 px |
| `sm`: tile to title, text to action | 12 px, 8 px |
| Title to description | 4 px |
| `sm`: first line against tile centre | 0.01 px, at one and at three title lines |
| `sm`: action's start against the title's start | 0 px |
| Title only, both sizes | Root 23.8 px, the title's height |
| Ring, ring to label, label to action | 24 px, 8 px, 16 px |
| `status` against `off` | Same ring, gap, 14 / 23.8 and ink in the four colour boundaries read; centred to 0.01 px |
| Status line while loading | 1 by 1 px with the rule; 34 by 18 with the class alone |
| Title line count reached | Main run: `md` 1 and 2, `sm` 1 and 3. Stacked marks sample: `sm` 2, not clipped, its first line offset not read. The padding in D8 does not depend on the line count |
| Description line count reached | None, one or two seen on the screens (two: `bar-neutral-light-360-en.png`, `thai-marks-3x-light.png`). The main run logged no count for descriptions |

The tile against its ground, each option as a ratio, and every pair as each boundary resolves it. These come from a script in the scratch folder, not from `pnpm contrast`; `recipes.test.ts` proves the pairs once they are in `pairs.ts`.

<!-- prettier-ignore -->
| Boundary | (a) on board, card, canvas | (b) on board, card | (c) on board, card | Glyph on (a) | Title on canvas, card, board | Description on canvas, card, board |
| --- | --- | --- | --- | --- | --- | --- |
| Neutral light | 1.15, 1.30, 1.18 | 1.00, 1.13 | 1.13, 1.00 | 5.22 | 16.43, 18.12, 16.02 | 6.15, 6.78, 5.99 |
| Neutral dark | 1.44, 1.18, 1.28 | 1.00, 1.22 | 1.22, 1.00 | 5.96 | 16.02, 14.75, 17.97 | 7.65, 7.04, 8.58 |
| Professional light | 1.23, 1.39, 1.30 | 1.06, 1.20 | 1.13, 1.00 | 3.94 | 15.56, 16.71, 14.78 | 5.11, 5.49, 4.85 |
| Professional dark | 2.50, 1.50, 2.05 | 1.01, 1.65 | 1.67, 1.00 | 4.52 | 13.98, 10.21, 16.99 | 9.28, 6.78, 11.29 |
| Friendly light | 1.23, 1.40, 1.30 | 1.04, 1.17 | 1.13, 1.00 | 3.97 | 15.47, 16.66, 14.74 | 5.14, 5.54, 4.90 |
| Friendly dark | 2.49, 1.50, 2.04 | 1.02, 1.64 | 1.67, 1.00 | 4.52 | 14.19, 10.39, 17.30 | 9.23, 6.75, 11.25 |

The glyph's lowest is 3.94 against a floor of 3, and W2's 5.22 and 5.96 match the render. `spinner.fg` on `board.bg` is the description's board column, lowest 4.85 against a floor of 4.5.

## Screens

These are the screens of `ORV-223-design-1`. The screens of F1 and F2 are listed under the two "Rework screens" sections.

All paths sit under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-1/`. Each family below is named `<family>-<profile>-<mode>-<width>-<locale>.png`, for example `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-1/board-empty-professional-dark-1440-th.png`, and each has twelve files: neutral and professional, light and dark, 360 and 1440, in Thai, and neutral in English.

Contact sheet, all 82 screens: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-1/contact-sheet.png`

Numbers behind the tables: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-1/measures.json` and `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-223-design-1/extra.json`

<!-- prettier-ignore -->
| Screen | What it shows |
| --- | --- |
| `board-empty-*`, 12 | The real board with the `md` form, centred, clear of the toolbar. Dark holds the same layout |
| `bar-*`, 12 | The real bar opened, with the `sm` form. One start edge for tile and header label, another for title, description and action. In English the description wraps at 360 and the shape holds. On the Thai screens the toggle shows focus from the story's own play. On the English ones that play fails first, so my script opened the panel by a click and the toggle shows none |
| `board-loading-*`, 12 | The real board loading: ring and words once, no status pill |
| `empty-*`, 12 | EmptyState sheet: `md` on canvas, card and board ground; `sm` on canvas and card; no action; title only at both sizes; no results; the long fixture at both sizes; the tile at three sizes |
| `loading-*`, 12 | LoadingState sheet: `status` and `off` side by side, with action, on card and board ground, long label |
| `matrix-1440.png`, `matrix-360.png` | Six boundaries: `md`, `sm` in a bar, and `off` with an action. Friendly's `sm` tile is a circle (D3) |
| `ground-study.png` | Open question 7: options a, b, c on the board, a card and the canvas in six boundaries |
| `glyph-study-light-1x.png`, `glyph-study-light.png`, `glyph-study-dark.png` | Open question 9: six glyphs for the bar, each above a real queued row, and six for the board. Real size, then 2x |
| `measure-capped.png`, `measure-uncapped.png` | C2: a long description on a 1440 board, 320 px against 756 px |
| `state-focus-board-light.png`, `state-focus-board-dark.png`, `state-focus-bar-light.png`, `state-focus-bar-dark.png` | Line and halo on the action, clear of the text. In the bar the halo stays inside the panel |
| `state-hover-board-light.png`, `state-hover-board-dark.png`, `state-hover-bar-light.png`, `state-hover-bar-dark.png` | Button's hover on each ground. The bar's toggle keeps the play's focus |
| `forced-colours.png` | Grounds gone. The tile's outline, the glyph, the ring, the words and the button edge stay |
| `thai-marks-3x-light.png`, `thai-marks-3x-dark.png` | Stacked marks across the 4 px gap and across a line break, at both sizes |
| `board-dots-3x-light.png`, `board-dots-3x-dark.png` | The real dot grid behind the form at 3x (D11) |
| `board-short-360x520.png` | A 520 px board at 360 with the delete status beside the form (open points) |

I opened 27 of the 82 at full size: at least one of each family in each mode, `ground-study.png`, `glyph-study-light-1x.png`, `glyph-study-dark.png`, both matrix screens, both capped and uncapped measures, `forced-colours.png`, `board-short-360x520.png`, both Thai marks screens, `board-dots-3x-light.png`, and three of the eight state screens. Some of these I opened before the last render, which changed only the loading cap token and the status rule's margin. The other 55 I saw only as contact sheet thumbnails, and the 60 of the main run are also covered by `measures.json`.

## Screens to check in visual QA

AC rows 25 and 42, on the built stories, at 360 and 1440, light and dark, Thai and English:

- `base-featured-icon`: `Neutral`. Tile and glyph at three sizes, the glyph quiet beside the words.
- `application-empty-state`: `Default`, `Sizes`, `NoResults`, `LongAt360`, `RecipesAndModes`. One centre at `md`. At `sm`, one start edge for title, description and action, the first line on the tile's centre at every line count. The tile never louder than the action.
- `application-task-bar`: `EmptyWithAction`, `EmptyAt360`. The tile's start on the header label's start. No clock in the tile (C1).
- `application-canvas-board`: `Empty`, `EmptyAt360`, `EmptyShort`, `EmptyShortInEnglish`, `TurnsEmpty`, `Loading`, `LoadingAt360`. The form clear of the toolbar by 16 px at every size, centred on tall boards, no status pill while loading. On `EmptyShort`, press a toolbar button and shoot the pill between the action and the toolbar.
- `application-canvas-board`: `EmptyBarOpen`, `EmptyBarOpenInEnglish`, `EmptyBarOpenWithStatus`, `EmptyJobsOpen`. One form on the dots, 16 px above the bar's card, the card whole, the bar's action the only action on it. Press the toggle and shoot the form back on the toolbar's rule. `EmptyJobsOpen` shows the named cost: the action whole on the card's top edge.
- `application-block-library`: `EmptyBoard`, `EmptyBoardShort`. The form clear of the shelf.
- `application-loading-state`: `Default`, `WithAction`, `LiveOff`, `LongAt360`, `RecipesAndModes`. The two halves of `LiveOff` must be indistinguishable.
- Focus on the action, by keyboard, in both modes. The form itself never shows focus.
- The tile on the board, on a card and on the canvas, above all neutral light on the board and neutral dark on a card, the two faintest.

## Open points

- A short board at 360. Closed by D15: a one line status now sits 8 px under the action at any board height, so the point about a two digit count falls away. What stays open is a host's own `status` that wraps to two lines or more, which still reaches the action, as "Rework F1" measures. A fix needs the overlay to anchor to the status, so the status must come first in the DOM, which moves the overlay's order and belongs in its own card if a host shows it.
- The form's move when a status appears, and a board too short for the form (tile cut first). Both are named under "What D15 costs, and its limits" and accepted there. The owner may ask for a different trade.
- The bar's list against a short board. A full list is 320 px whatever the board's height, so under 467 px tall the action lands on the card (D16). A list that caps itself to leave the form room would end that cost, and it is a change to the bar for its own card.
- Loading with the bar open. `load-board-1` keeps the board's centre, so at 900 by 420 the label reads 216.4 to 243.6 against a card top of 225.3 on the head's overlay: the same overlap as F2, 18.3 px deep. The loading half is not built on this head, so it was not rendered with LoadingState. The loading PR decides whether D16 widens to it, and until then D15's note not to widen the selector stands.
- A shelf board with the panel closed has no floor. With a shelf, the action leaves the board in 116 of 268 rows, up to 420 tall, as on head, and the closed board was to stay as sign-off 2 measured it. D16's floor would cure it if it moved up to D15's rule.
- Two things on head that show on these screens and that this story leaves alone: at 662 px the toolbar's keyboard button drops alone to a second row, with a trailing divider before it, and the toolbar covers the lower part of the React Flow attribution at the board's corner.
- A long action label. `ds-button` sets `white-space: nowrap`, so a label wider than the column overflows, as ORV-222 noted for Alert. Every fixture fits. `empty-state.yaml` and `loading-state.yaml` should say the label stays short.
- Target size. The bar's action is Button `sm`, 32 px, under `size.touch` 44, as with Alert and Toast. A fix belongs to Button across the set.
- `ArtifactIcon` and `JobsIcon` are named for what they draw elsewhere or here. If more empty forms arrive, a board-level glyph name may read better. Nothing to do now.
- Screen reader. Not measured. The hidden status line and the visible overlay hold the same words, and only the line is live. The spec keeps this with its open screen reader test.
