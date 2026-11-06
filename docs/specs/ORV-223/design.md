---
issue: ORV-223
spec: docs/specs/ORV-223/spec.md v1.2
task: ORV-223-design-1
date: 2026-11-06
---

# ORV-223 design: Empty state and Loading state (application)

The look of the neutral tile, the two EmptyState sizes and the LoadingState column, the answers to open questions 7 and 9, and one row of CSS and markup per rule for the builder.

Open question 7 keeps its default. Open question 9 keeps its default on the board and differs in the bar (C1). The measure of the centred column adds two component tokens the spec does not list (C2). Two acceptance and rule texts cannot work as written (C3, C4). The tables below assume C1 and C2 are accepted. Each names its fallback, so a refusal changes a few lines.

## Flow

1. A person opens a board with no nodes. CanvasBoard's overlay shows the tile, the title and the host's action, centred. Nothing is spoken: the words are read in page order (`empty-live-1`).
2. The person opens the task bar with no jobs. The panel shows the tile at the bar's start edge, the title over the description, and the action under them. The header still reads "ยังไม่มีงาน".
3. The person presses the action. What it does is the host's; every action in the stories is mock.
4. The last item leaves. The bar's own status says `taskBar.none` and the toggle takes focus. The board's status line says what was deleted and the region takes focus, one Tab from the action (`empty-focus-1`).
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
| D3 | Tile radius | `shape.media.radius` as ORV-222 D2: 12 neutral, 8 Professional, 16 Friendly. Under Friendly the 32 px tile is a circle, the 40 px tile a rounded square (`matrix-1440.png`) | Accepted in ORV-222 D2 as that profile's own shape |
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
| empty-board-1 | `<div className="ds-board__overlay"><EmptyState size="md" level={2} icon={ArtifactIcon} title={emptyText ?? m.board.empty} action={emptyAction} /></div>`; the focus fallback as the rule says | `.ds-board__overlay p` (line 1596) leaves. The rest of `.ds-board__overlay` stays: it is what these screens rendered, and its `> *` still gives the form its pointer events |
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
- `application-canvas-board`: `Empty`, `EmptyAt360`, `TurnsEmpty`, `Loading`, `LoadingAt360`. The form clear of the toolbar, no status pill while loading.
- `application-loading-state`: `Default`, `WithAction`, `LiveOff`, `LongAt360`, `RecipesAndModes`. The two halves of `LiveOff` must be indistinguishable.
- Focus on the action, by keyboard, in both modes. The form itself never shows focus.
- The tile on the board, on a card and on the canvas, above all neutral light on the board and neutral dark on a card, the two faintest.

## Open points

- A short board at 360. On a 520 px board the delete status pill sits 7 px from the action, with their rows overlapping by 3.7 px (`board-short-360x520.png`). "ลบ 1 node" clears it. A two digit count adds about one digit's width to the pill and may use up those 7 px; I did not render it. A longer status from the shell would pass under or over the action, since both sit at `z-index` 5. Not new to this story: the old overlay centred its words and action the same way. If it shows up, the fix is to raise the overlay's centre by the toolbar's height on narrow boards, as its own small card.
- A long action label. `ds-button` sets `white-space: nowrap`, so a label wider than the column overflows, as ORV-222 noted for Alert. Every fixture fits. `empty-state.yaml` and `loading-state.yaml` should say the label stays short.
- Target size. The bar's action is Button `sm`, 32 px, under `size.touch` 44, as with Alert and Toast. A fix belongs to Button across the set.
- `ArtifactIcon` and `JobsIcon` are named for what they draw elsewhere or here. If more empty forms arrive, a board-level glyph name may read better. Nothing to do now.
- Screen reader. Not measured. The hidden status line and the visible overlay hold the same words, and only the line is live. The spec keeps this with its open screen reader test.
