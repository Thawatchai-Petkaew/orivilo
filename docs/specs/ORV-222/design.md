---
issue: ORV-222
spec: docs/specs/ORV-222/spec.md v1.2
task: ORV-222-design-1
date: 2026-11-06
---

# ORV-222 design: Alert and FeaturedIcon (base)

The look of the tile and the inline message, the answers to open questions 5, 6, 7 and 9, and one row of CSS and markup per rule for the builder. Every value is an existing semantic token or a component token the spec already names; this design adds no token.

Two answers differ from the spec's default (C1 and C2), and one acceptance check cannot run as written (C3). The tables below assume C1 and C2 are accepted. Each names its fallback, so a refusal changes one line.

## Flow

1. A job fails while the person is on the screen. The screen's own `role` container, mounted from its first render, receives `<Alert live="off">` where the job lives (`alert-mount-1`).
2. The person reads the tile, the title (what happened) and the description (the fix), in that order, starting from one edge.
3. The person presses the action, if the caller gave one. The caller shows its own `Button loading`, and the Alert stays until the state changes.
4. If the caller gave `onDismiss`, the person may close the message. The caller unmounts it and moves focus to the next control (`alert-stay-1`).
5. A message already there at first render takes `live="off"` and is read in page order (`alert-load-1`). Focus never moves on its own (`alert-focus-1`).

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 5 | The glyph per kind | Not the default. `success` Check, `warning` TriangleAlert, `info` Info as the spec says, and `danger` **OctagonX** in place of OctagonAlert (C1) | The spec rejects CircleAlert because it sits close to Info, "a mark in a circle either way". OctagonAlert has the same fault at the size Alert uses: at 16 px the octagon's corners nearly vanish, and what is left is a ring with a short vertical mark, dot down against dot up. With colour removed, the X inside the ring is what tells `danger` from `info` at a glance. Measured as the mean grey difference of a 16 px raster, on a scale of 0 to 100: CircleAlert to Info 1.9, CircleX 7.5, OctagonAlert 9.4, OctagonX 15.0. That number is a proxy; the judgement is the screen `glyph-study-light-grey-1x.png`. The octagon stays because a circled X sits nearer to Info (7.5). The X in the tile and the close X in the same block read apart, one enclosed at the start edge and one bare at the end edge (`long-thai-3x-light.png`). The spec's stated cost is unchanged: a failed job shows an octagon in Alert and a triangle in Toast, Task bar and Canvas node until the follow-up card |
| 6 | A neutral tile, here or in the Empty state story | (a), confirmed: in the Empty state story (D.3 row 20), with `neutral` and `icon` added together | No row of this story uses it. On a feedback tile the glyph is the kind, so a caller's `icon` would break `fi-glyph-1`. One constraint for that story: type `icon` so it is legal only on `neutral`, and the four feedback kinds keep their bound glyph. The change is additive, so nothing built here is redone |
| 7 | The Alert's ground, and whether it reads loud enough for a failed job | Ground: (a), confirmed, a neutral card with the tinted tile. Loud enough: not with `feedback.danger.border` on the edge; yes with `alert.danger-edge` from `feedback.danger.fg` (C2) | Option (b) is the loudest, but it drops the tile and needs new text pairs on four tinted grounds under every profile. The card ground also holds on a card, where the block keeps its shape through the edge alone. The default's pale edge measures 1.88 on the card and 1.71 on the canvas in light, and 1.86 on the card under Professional and Friendly dark, so among borderless cards only a 32 px tile says something failed. With `feedback.danger.fg` the edge measures 5.13 at its lowest across the six boundaries. The other three kinds keep the pale edge, which gives a hierarchy: a failure is the one message drawn at full strength. Compare `ground-study-light-colour.png` and `ground-study-dark-colour.png`, rows a and a2. The edge still never carries the kind: with colour removed the glyph and the words do (`ground-study-light-grey.png`) |
| 9 | FeaturedIcon sizes | (a), confirmed: `sm`, `md`, `lg` | The glyph is half the tile at all three, 32 / 16, 40 / 20, 48 / 24 (W1, measured), so the proportion holds as it grows, and the four kinds stay apart in grey at each one. Alert needs only `sm`; `md` and `lg` are what D.3 row 20 will reach for, and adding them later would reopen tokens and stories for six token lines saved now. No `xl`, as the spec says |

## Changes this design asks for

<!-- prettier-ignore -->
| # | Change | Spec text it changes | Fallback if refused |
| --- | --- | --- | --- |
| C1 | `DangerIcon` draws Lucide `OctagonX` | `fi-glyph-1`; open question 5 option (a); W3's map and expected line, which becomes `danger OctagonX true` | `lucide(OctagonAlert, "DangerIcon")`: one import and one line in `icons.tsx`, nothing else moves |
| C2 | `alert.danger-edge` references `feedback.danger.fg`; `success`, `warning` and `info` stay on `feedback.<kind>.border`. Add one pair, `alert.danger-edge` on `alert.bg` at floor 3, so the strength is proven; the three pale edges keep the "Not listed" line | `alert-look-1`, the token list and its last paragraph | Reference `feedback.danger.border` and drop the pair: one token line and one pair row. No CSS changes |
| C3 | AC row 2: replace `expectInkCentred` with a box check, the svg's centre on the tile's centre to 0.5 px on both axes | AC row 2, Check column | None. `expectInkCentred` reads a label through `columnsOf` in `src/testing/visual-asserts.ts`, which throws "has no text to measure" on a tile that holds only an svg |

C1 and C2 add no token and rename none, so the spec's impact list stands.

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | Tile sizes | `size.control.sm` 32, `.md` 40, `.lg` 48, glyph `size.icon.sm` 16, `.md` 20, `.lg` 24 | `fi-api-1`, W1 |
| D2 | Tile shape | `shape.media.radius`: 12 neutral, 8 Professional, 16 Friendly. One radius for all sizes, no per-size value | `fi-colour-1`, `DESIGN.md` section 3.3. Under Friendly a 32 px tile comes out a circle, since 16 is half of 32, while `md` and `lg` stay rounded squares. Accepted: it is that profile's own shape decision |
| D3 | Tile ground and glyph | `feedback.<kind>.surface`, `feedback.<kind>.fg`. No edge on the tile | Tint and foreground (K-0159). In light the tile is pale on the card, in dark it is darker than the card; the glyph carries it at 4.94 or above in every boundary |
| D4 | Forced colours | `outline: 1px solid transparent; outline-offset: -1px` on the tile | The ground drops in forced colours and the transparent outline draws in the system colour, so the tile keeps its shape (`forced-colours.png`). The same form as ORV-201 D13 |
| D5 | Alert ground | `surface.card`, no shadow, no tint | Open question 7 |
| D6 | Alert edge | 1 px on every side. `feedback.success.border`, `.warning.border`, `.info.border`; `feedback.danger.fg` for `danger` (C2) | "Spend boldness once" (`DESIGN.md` section 2): the failure takes the one strong line |
| D7 | Alert radius and inset | `shape.container.radius` 16 around the 12 tile, `space.inset.md` 16, `space.inline.lg` 12 between tile, text and close | `alert-look-1`. The tile's glyph and the close's glyph land the same 24 px from their edges, so the block is even at both ends |
| D8 | Title on the tile | The content column's top padding is `(tile - title line) / 2` = (32 - 23.8) / 2 = 4.1 px, so the first line centres on the tile and on the close at any line count; later lines flow down and the tile stays at the top | `alert-look-1`; the Toast form. Measured off by 0.01 px at most |
| D9 | Title over text | `type.label.md` 500 in `text.primary` over `type.body.sm` 400 in `text.secondary`, both 14 / 1.7, 4 px apart | `DESIGN.md` section 4, compact form. 1.7 is what keeps Thai marks of neighbouring lines apart (`long-thai-3x-light.png`) |
| D10 | Action | Under the text at the text's start edge, 8 px below it: the 4 px column gap plus 4 px on the wrapper | `alert-look-1`, as Toast. One start edge for title, description and action |
| D11 | Close | `Button` ghost, sm, icon only, `CloseIcon className="size-4"` as Toast and Tag do. Without the class the svg renders at Lucide's 24 px in a 32 px button, which looks oversized | `alert-api-1`. Hover and focus are the Button's own: `state-hover-close-dark.png`, `state-focus-close-light.png` |
| D12 | Width | `inline-size: 100%` with `box-sizing: border-box`, and no cap on the text | "At its parent's width". Without it a flex parent with `items-center` shrinks the block. The longest reason runs about 1040 px on one line at 1440, which is long but rare; a page puts Alert in its content column, and no measure token exists to cap it |
| D13 | Wrap | `overflow-wrap: anywhere` on title and description only, not on the root, so the caller's action is left alone | `alert-copy-1` |
| D14 | Motion | None: no `animation`, no `transition`, so reduced motion needs no rule | `alert-look-1` |

## States

<!-- prettier-ignore -->
| State | FeaturedIcon | Alert root | Inside Alert |
| --- | --- | --- | --- |
| default | The tile | The block | |
| hover | None, not interactive | None, not interactive | Close and action: Button's own |
| focus | None, never focusable | None, never focusable (`alert-focus-1`) | Close and action: Button's line and halo in `focus.ring`, inside the block and clear of its edge |
| disabled | Does not apply | Does not apply | A caller's `disabled` action is Button's own |
| loading | Does not apply | Does not apply; the Alert stays | A caller's `<Button loading>` in `action`; Spinner and Skeleton cover the wait elsewhere |
| empty | Does not apply | No empty form: `title` and `description` are required | No action and no close is the plain form |
| error | `danger` | `danger` | |
| success | `success` | `success`, with backing data only | |

Selected does not apply to either. A missing value cannot reach Alert: the type refuses it (AC row 20), which answers that line of the design gate.

## Builder table: CSS and markup per rule

The recipe text follows the table. Insert it in `packages/design-system/src/recipes/recipes.css` after the Toast block, before `/* Progress (E4-5)`.

<!-- prettier-ignore -->
| Rule | Markup | CSS |
| --- | --- | --- |
| fi-api-1 | `<span className={cx("ds-featured-icon", className)} data-variant={variant} data-size={size} aria-hidden="true"><Glyph /></span>`; `size` defaults to `sm`; `FeaturedIconProps` has `variant`, `size`, `className` only | `.ds-featured-icon`; `[data-size="md"]` and `[data-size="lg"]`, each with its `> svg` |
| fi-glyph-1 | In `icons.tsx`: `export const DangerIcon = lucide(OctagonX, "DangerIcon");` and `export const InfoIcon = lucide(Info, "InfoIcon");`, with the two imports in order. In `FeaturedIcon.tsx`: `const GLYPHS = { success: CheckIcon, warning: WarningIcon, danger: DangerIcon, info: InfoIcon } as const`. The comment at line 62 says 46 glyphs while the file has 51 `= lucide(` lines today: set it to 53 | None |
| fi-colour-1 | None | `[data-variant="<kind>"]`, `background` and `color` from the tokens. Tokens below; four pair rows at floor 3 and the "Not listed" line for the tile against the page, in `pairs.ts` |
| fi-a11y-1 | `aria-hidden="true"` on the root; no `role`, no name, no `tabIndex`. The glyph is hidden already (`lucide()` in `icons.tsx`) | None |
| alert-api-1 | See the block under this table | `.ds-alert`, `.ds-alert__content`, `.ds-alert__close` |
| alert-copy-1 | `<p className="ds-alert__title">`, `<p className="ds-alert__description">`; a `p` and not a heading, since Alert does not know the page's outline. No hidden prefix | `.ds-alert__title, .ds-alert__description { overflow-wrap: anywhere; }`; no `line-clamp`, no `overflow: hidden`, no `text-overflow`, so nothing clips the ink `expectLabelInkWhole` reads |
| alert-live-1 | `const DEFAULT_LIVE = { success: "status", info: "status", warning: "status", danger: "alert" } as const`; `const value = live ?? DEFAULT_LIVE[variant]`; `role={value === "off" ? undefined : value}` on the root; no `aria-live`. Type block below | None |
| alert-mount-1 | No code in Alert. `ContainerFirst` story: `<div role="alert">{shown ? <Alert live="off" ... /> : null}</div>`, the same with `role="status"`, each mounted from the first render and truly empty before the press | None. An empty container draws nothing, so the story's stack may show a gap until the press, which is fine |
| alert-load-1 | No code in Alert. `AtLoad` passes `live="off"` | None |
| alert-focus-1 | No `tabIndex`, no `autoFocus`, no ref focus call in `Alert.tsx` | No `:focus` rule on `.ds-alert` |
| alert-stay-1 | `onClick={onDismiss}` on the close; no state, no timer, no key handler in Alert. `Dismissible` story host unmounts and focuses "งานถัดไป" | None |
| alert-look-1 | Root is a `div`; the order is tile, content, close, so the keyboard reaches the action and then the close | `.ds-alert` and the four `[data-variant]` edges; `.ds-alert__content` padding (D8), `.ds-alert__title`, `.ds-alert__action`. Tokens below; pairs `alert.title` and `alert.description` on `alert.bg` at floor 4.5, `alert.danger-edge` on `alert.bg` at floor 3 (C2), and the "Not listed" line for the three pale edges |

`alert-use-1` is a docs row and draws nothing.

Alert's markup. The action sits in a wrapper because it is the caller's node and cannot take a class:

```tsx
<div className={cx("ds-alert", className)} data-variant={variant} role={role}>
  <FeaturedIcon variant={variant} size="sm" />
  <div className="ds-alert__content">
    <p className="ds-alert__title">{title}</p>
    <p className="ds-alert__description">{description}</p>
    {action ? <div className="ds-alert__action">{action}</div> : null}
  </div>
  {onDismiss ? (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={m.alert.dismiss}
      className="ds-alert__close"
      onClick={onDismiss}
    >
      <CloseIcon className="size-4" />
    </Button>
  ) : null}
</div>
```

The type of `alert-live-1`, a union on `variant`, so AC row 20's `@ts-expect-error` lines hold:

```ts
type AlertKind =
  | { variant: "success"; live?: "status" | "off" | undefined }
  | { variant: "info" | "warning"; live?: "status" | "alert" | "off" | undefined }
  | { variant: "danger"; live?: "alert" | "off" | undefined };
```

The recipe, exactly as rendered in the screens below:

```css
/* FeaturedIcon (ORV-222) --------------------------------------------------------------------- */

.ds-featured-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--cmp-featured-icon-size-sm);
  block-size: var(--cmp-featured-icon-size-sm);
  border-radius: var(--cmp-featured-icon-radius);
  /* forced colours drop the ground; this line keeps the tile's shape */
  outline: 1px solid transparent;
  outline-offset: -1px;
}
.ds-featured-icon > svg {
  inline-size: var(--cmp-featured-icon-icon-size-sm);
  block-size: var(--cmp-featured-icon-icon-size-sm);
}
.ds-featured-icon[data-size="md"] {
  inline-size: var(--cmp-featured-icon-size-md);
  block-size: var(--cmp-featured-icon-size-md);
}
.ds-featured-icon[data-size="md"] > svg {
  inline-size: var(--cmp-featured-icon-icon-size-md);
  block-size: var(--cmp-featured-icon-icon-size-md);
}
.ds-featured-icon[data-size="lg"] {
  inline-size: var(--cmp-featured-icon-size-lg);
  block-size: var(--cmp-featured-icon-size-lg);
}
.ds-featured-icon[data-size="lg"] > svg {
  inline-size: var(--cmp-featured-icon-icon-size-lg);
  block-size: var(--cmp-featured-icon-icon-size-lg);
}
.ds-featured-icon[data-variant="success"] {
  background: var(--cmp-featured-icon-success-bg);
  color: var(--cmp-featured-icon-success-fg);
}
.ds-featured-icon[data-variant="warning"] {
  background: var(--cmp-featured-icon-warning-bg);
  color: var(--cmp-featured-icon-warning-fg);
}
.ds-featured-icon[data-variant="danger"] {
  background: var(--cmp-featured-icon-danger-bg);
  color: var(--cmp-featured-icon-danger-fg);
}
.ds-featured-icon[data-variant="info"] {
  background: var(--cmp-featured-icon-info-bg);
  color: var(--cmp-featured-icon-info-fg);
}

/* Alert (ORV-222) ---------------------------------------------------------------------------- */

.ds-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--cmp-alert-gap);
  box-sizing: border-box;
  inline-size: 100%;
  padding: var(--cmp-alert-padding);
  border: 1px solid transparent;
  border-radius: var(--cmp-alert-radius);
  background: var(--cmp-alert-bg);
  color: var(--cmp-alert-description);
  font-family: var(--cmp-alert-body-type-font-family);
  font-size: var(--cmp-alert-body-type-font-size);
  line-height: var(--cmp-alert-body-type-line-height);
  font-weight: var(--cmp-alert-body-type-font-weight);
  letter-spacing: var(--cmp-alert-body-type-letter-spacing);
}
.ds-alert[data-variant="success"] {
  border-color: var(--cmp-alert-success-edge);
}
.ds-alert[data-variant="warning"] {
  border-color: var(--cmp-alert-warning-edge);
}
.ds-alert[data-variant="danger"] {
  border-color: var(--cmp-alert-danger-edge);
}
.ds-alert[data-variant="info"] {
  border-color: var(--cmp-alert-info-edge);
}
.ds-alert__content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  /* title and description are one block, 4 px apart (DESIGN.md section 4) */
  gap: var(--ds-space-inline-sm);
  min-inline-size: 0;
  /* the title's first line centres on the tile and the close; later lines flow under it */
  padding-block-start: calc(
    (
        var(--cmp-featured-icon-size-sm) - var(--cmp-alert-title-type-font-size) *
          var(--cmp-alert-title-type-line-height)
      ) /
      2
  );
}
.ds-alert__title,
.ds-alert__description {
  margin: 0;
  overflow-wrap: anywhere;
}
.ds-alert__title {
  color: var(--cmp-alert-title);
  font-family: var(--cmp-alert-title-type-font-family);
  font-size: var(--cmp-alert-title-type-font-size);
  line-height: var(--cmp-alert-title-type-line-height);
  font-weight: var(--cmp-alert-title-type-font-weight);
  letter-spacing: var(--cmp-alert-title-type-letter-spacing);
}
/* with the content gap of 4, an action keeps 8 px above it */
.ds-alert__action {
  display: flex;
  margin-block-start: var(--ds-space-inline-sm);
}
.ds-alert__close {
  flex: none;
}
```

Component tokens for `component.json`, with `$description` lines naming ORV-222. The names are the spec's:

<!-- prettier-ignore -->
| Token | References |
| --- | --- |
| `featured-icon.<kind>.bg`, `featured-icon.<kind>.fg` | `feedback.<kind>.surface`, `feedback.<kind>.fg` |
| `featured-icon.radius` | `shape.media.radius` |
| `featured-icon.size.{sm,md,lg}` | `size.control.{sm,md,lg}` |
| `featured-icon.icon-size.{sm,md,lg}` | `size.icon.{sm,md,lg}` |
| `alert.bg` | `surface.card` |
| `alert.success-edge`, `alert.warning-edge`, `alert.info-edge` | `feedback.<kind>.border` |
| `alert.danger-edge` | `feedback.danger.fg` (C2) |
| `alert.radius`, `alert.padding`, `alert.gap` | `shape.container.radius`, `space.inset.md`, `space.inline.lg` |
| `alert.title`, `alert.description` | `text.primary`, `text.secondary` |
| `alert.title-type`, `alert.body-type` | `type.label.md`, `type.body.sm` (`$type` typography, as `toast.title-type`) |

Story notes: the Alert stories take `layout: "padded"`, and the 360 px stories use `Narrow`. AC row 9's first-line check reads `title.top + lineHeight / 2` against the tile's centre, and row 15 reads the top of the action's button against the bottom of the description.

## Evidence

Rendered on 2026-11-06 in Storybook dev on port 6422, Chromium through Playwright, reduced motion on. No component exists yet, so this is the recipe text above with its tokens, and markup of the shape above with the real Lucide glyphs, injected into the existing stories `base-badge--variants` and `base-badge--recipes-and-modes`. It runs inside the real boundary, Button recipe and fonts. Copy is the spec's mock fixtures. These files sit in a scratch folder and will not outlive the session; the sign-off of AC rows 8 and 22 shoots the built stories again.

Measured in all 22 sheets. Console errors were logged on the 20 sheets outside `Matrix`, and there were none; the two `Matrix` pages were not logged:

<!-- prettier-ignore -->
| Check | Result |
| --- | --- |
| Frame width | `scrollWidth` 360 at 360 and 1440 at 1440: no horizontal scroll |
| Title first line against tile centre | 0.01 px at most |
| Close centre against tile centre | 0 px |
| Title to description; description to action | 4 px; 8 px |
| Close from the block's end edge | 17 px, the 1 px edge plus 16 padding |
| Clipped title or description, block overflow | 0 of every Alert, including the long Thai name and reason |
| Tile and glyph | 32 / 16, 40 / 20, 48 / 24; the svg box exactly on the tile's centre |
| Drawn glyph off the centre of its grid | Check 0.33 px high at 16 px and 0.50 px at 24 px, which is how Lucide draws it; the other three 0.01 px at most |

Contrast read from the tokens as each boundary resolves them:

<!-- prettier-ignore -->
| Boundary | Title | Description | Danger edge on card, canvas (C2) | Default edge on card, canvas | Glyph on tile, lowest |
| --- | --- | --- | --- | --- | --- |
| Neutral light | 18.12 | 6.78 | 6.57, 5.96 | 1.88, 1.71 | 4.94 |
| Neutral dark | 14.75 | 7.04 | 7.01, 7.62 | 2.54, 2.76 | 7.72 |
| Professional light | 16.71 | 5.49 | 6.57, 6.12 | 1.88, 1.75 | 4.94 |
| Professional dark | 10.21 | 6.78 | 5.13, 7.03 | 1.86, 2.54 | 7.72 |
| Friendly light | 16.66 | 5.54 | 6.57, 6.10 | 1.88, 1.75 | 4.94 |
| Friendly dark | 10.39 | 6.75 | 5.13, 7.01 | 1.86, 2.53 | 7.72 |

These come from a script in the scratch folder, not from `pnpm contrast`; `recipes.test.ts` proves the pairs once they are in `pairs.ts`.

## Screens

All paths sit under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/`.

Contact sheet, all 40 screens: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/contact-sheet.png`

<!-- prettier-ignore -->
| Screen | Absolute path | What it shows |
| --- | --- | --- |
| FeaturedIcon, neutral, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-neutral-light-360-th.png` | Variants beside titles, three sizes, the sizes in grey, `lg` beside the long name, which wraps to two lines with the tile held at the top |
| FeaturedIcon, neutral, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-neutral-light-1440-th.png` | The same at full width |
| FeaturedIcon, neutral, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-neutral-dark-360-th.png` | Tiles darker than the ground, glyphs bright |
| FeaturedIcon, neutral, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-neutral-dark-1440-th.png` | The same at full width |
| FeaturedIcon, Professional, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-professional-light-360-th.png` | 8 px tile radius |
| FeaturedIcon, Professional, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-professional-light-1440-th.png` | The same at full width |
| FeaturedIcon, Professional, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-professional-dark-360-th.png` | The same in dark |
| FeaturedIcon, Professional, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/fi-professional-dark-1440-th.png` | The same at full width |
| Alert, neutral, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-light-360-th.png` | Plain, action, close, both, long, on a card. Descriptions of one, two and six lines, titles of one and three; `danger` is the one strong edge |
| Alert, neutral, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-light-1440-th.png` | The same at full width, the close at the far corner |
| Alert, neutral, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-dark-360-th.png` | Same layout as light, nothing moves |
| Alert, neutral, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-dark-1440-th.png` | The long reason on one line of about 1040 px (D12) |
| Alert, Professional, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-professional-light-360-th.png` | 12 px block, 8 px tile, squarer action |
| Alert, Professional, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-professional-light-1440-th.png` | The same at full width |
| Alert, Professional, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-professional-dark-360-th.png` | A lighter card ground; the danger edge still leads |
| Alert, Professional, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-professional-dark-1440-th.png` | The same at full width |
| Alert, English, neutral, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-light-360-en.png` | Two-line titles beside a close; the shape holds |
| Alert, English, neutral, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-light-1440-en.png` | The same at full width |
| Alert, English, neutral, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-dark-360-en.png` | The same in dark |
| Alert, English, neutral, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/alert-neutral-dark-1440-en.png` | The same at full width |
| Six boundaries, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/matrix-1440.png` | Through `Matrix`, with Friendly: the sm tile as a circle (D2) |
| Six boundaries, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/matrix-360.png` | The same at 360 |
| Long Thai at 3x, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/long-thai-3x-light.png` | Upper and lower marks clear across the 4 px gap and every wrapped line |
| Long Thai at 3x, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/long-thai-3x-dark.png` | The same in dark |
| Focus on the action, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/state-focus-action-light.png` | Reached by Tab; line and halo touch the pill |
| Focus on the action, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/state-focus-action-dark.png` | The same in dark; violet stays apart from the red edge |
| Focus on the close, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/state-focus-close-light.png` | Second Tab; the halo stays inside the block |
| Focus on the close, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/state-focus-close-dark.png` | The same in dark |
| Hover on the close, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/state-hover-close-light.png` | Button's ghost hover on the card ground |
| Hover on the close, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/state-hover-close-dark.png` | The same in dark |
| Forced colours | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/forced-colours.png` | Grounds gone; tile outline, glyph, words and edges stay, and the four kinds still read |
| Glyph study, grey, 1x | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/glyph-study-light-grey-1x.png` | Open question 5, four candidate sets at real size with colour removed |
| Glyph study, grey, 2x | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/glyph-study-light-grey.png` | The same at 2x |
| Glyph study, colour | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/glyph-study-light-colour.png` | The same in colour |
| Glyph study, dark, colour | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/glyph-study-dark-colour.png` | The same in dark |
| Glyph study, dark, grey | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/glyph-study-dark-grey.png` | The same in dark, grey |
| Ground study, light, colour | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/ground-study-light-colour.png` | Open question 7: the default, the `feedback.danger.fg` edge and the tinted ground among cards, on canvas and on a card |
| Ground study, light, grey | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/ground-study-light-grey.png` | The same with colour removed |
| Ground study, dark, colour | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/ground-study-dark-colour.png` | The same in dark |
| Ground study, dark, grey | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-222-design-1/ground-study-dark-grey.png` | The same in dark, grey |

The two studies were shot before the last two recipe edits (the action's wrapper and the one-rule-per-variant edges). Neither changes what they compare. Their rows are labelled, and row a is the spec's default edge.

## Screens to check in visual QA

AC rows 8 and 22, on the built stories, at 360 and 1440, light and dark, Thai and English:

- `base-featured-icon`: `Variants`, `Sizes`, `At360`, `RecipesAndModes`. With colour removed, the four kinds read apart at `sm`, above all `danger` from `info`. The tile keeps its size beside a wrapped name.
- `base-alert`: `Variants`, `WithAction`, `Dismissible`, `LongAt360`, `RecipesAndModes`. One start edge for title, description and action. The tile, the title's first line and the close on one centre at every line count. `danger` leads its siblings. No Thai mark touches across lines or at the block's edge.
- Focus on the close and the action, by keyboard, in both modes. The block itself never shows focus.
- Alert on a card and on the canvas, in both modes.

## Open points

- Target size. The close and the action are `Button` sm, 32 px, as in Toast, and the spec prescribes them. That is under `size.touch` 44 (`DESIGN.md` section 3.3), and no recipe raises it on touch. It is not new to Alert; a fix belongs to Button across the set, as a follow-up card.
- A long action label. `ds-button` sets `white-space: nowrap`, so a label wider than the text column overflows. At 360 with a close that column is about 206 px, and every fixture fits. `alert.yaml` should say the action's label stays short.
- Screen reader. `role="alert"` is atomic, so the action's and the close's names may be read with the message. Not measured; the spec keeps this with its open screen reader test.
