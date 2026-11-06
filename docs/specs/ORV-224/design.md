---
issue: ORV-224
spec: docs/specs/ORV-224/spec.md v1.3
task: ORV-224-design-1, ORV-224-design-2
date: 2026-11-06
---

# ORV-224 design: Avatar (base)

This design answers spec open questions 1, 2, 4, 6 and 7, checks `avatar-size-1` and `avatar-look-1` against a render, and gives the builder one row of markup and CSS per rule.

All five open questions keep their default. Three things in the spec do not hold when rendered, and each is listed under "Spec amendments" with the rule it changes:

1. `avatar.bg` and `avatar.fg`: on `surface.canvas` the spec's disc is 1.03 to 1, so it cannot be seen (AC 19).
2. The initials type at `sm`: `type.label.sm` puts ป on the edge of the centring bound and breaks a DESIGN.md §4 rule.
3. Two plays in AC 2 and AC 7 cannot run as written against a disc clipped by `clip-path` alone.

The images are proposals: CSS and markup injected into the existing `base-skeleton--shapes` story under the real boundary, profiles, fonts and recipes. They are not the built component. Names are mock and pictures are drawn; no real person's photo is used.

The sign-off ORV-224-signoff-1 rejected two looks on PR 188 head `23450be`. Rows R1 and R2 answer them, and they are rendered on the built stories, not on the skeleton story. R1 is also a finding against this design: D2 and `edge-dpr1.png` read the edge on a whole y only (L-0019).

## Flow

1. A screen hands Avatar a name and maybe a picture URL. The disc paints at once at its final size.
2. No picture, or one still loading: the disc shows the initials, or the person glyph when the name gives no initials.
3. The picture loads: it replaces the fallback in the same disc. Nothing moves and nothing fades.
4. The picture fails: the fallback stays. No broken-image mark shows, and the accessible name stays.
5. A new `src` arrives: step 2 again, then step 3.

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 1 | Form of a picture by use | (a), confirmed: the table of `avatar-name-1` | The three forms look the same, so nothing visible argues for a wider API (d). A visible name beside the disc reads once. A failed picture keeps its name because the label sits on the root. Limit: in "alone with no control" a sighted person sees initials and no name, and `avatar-data-1` rules out `title`, so a screen that needs the name on hover uses Tooltip around it |
| 2 | Thai initials | (a), confirmed: the owner accepted the Thai initials as built (ORV-224 comment 10529) | `q2-options-light.png` draws all four options on ปิ่นโต้ and โลโก้. (a) gives one calm consonant at both sizes. (b) stacks ิ and ่ above ป, which fills the disc top, and gives โ, a vowel that names nothing. (c) reads as an abbreviation (ปต, ลก) and fills the `sm` disc edge to edge. (d) drops a step Latin names keep. A tail letter (ฎ ฏ ฐ ญ) stays whole at both sizes (`neutral-light-1440-th.png`, row "Tails and marks"). That one consonant reads as an initial was this role's reading; the owner read the sheet and accepted it (ORV-224 comment 10529) |
| 4 | Sizes | (a), confirmed: discs 32 and 40, glyphs 16 and 20 | `md` matches the Skeleton circle `size-10` under neutral and professional, so there a loading shape and the disc that replaces it are one size. Under Friendly they are not: see Known limits, K1. `sm` beside two `type.body.sm` lines holds as a comment row (`neutral-light-1440-th.png`, third "beside a name" row). That row stays an assumption until a comment screen exists. The initials type at `sm` changes: see D5 |
| 6 | Fallback while loading | (a), confirmed: no `delayMs` | Radix reads `image.complete` in a layout effect, before paint. Measured: a data URI read a second time reports `complete: true`, so a picture already decoded in memory shows no flash. A dev server URL read again reported `complete: false`, so a fresh or uncached load does show initials first. That is a change of content in a disc of the same size, with no layout shift. (b) trades it for an empty disc, also after an early failure, plus a new time value |
| 7 | Shape under a profile | (a), confirmed: `clip-path: circle(50%)` | Under professional, controls are 6 px and the disc stays round beside them (`professional-light-1440-th.png`). The focus square of a Button around a round face reads as two things, which is right: the control and the person. (b) would square faces and break the match with Skeleton `circle` |

## Anatomy

```text
span.ds-avatar[data-size]                 Radix Root: disc, ground, clip
  img.ds-avatar__image                    Radix Image: mounted only once loaded
  span.ds-avatar__fallback                Radix Fallback: centres its one child, sets the ink
    span.ds-avatar__initials              one line box, or
    svg (PersonIcon)                      the glyph
```

## Visual decisions

<!-- prettier-ignore -->
| # | Decision | Value (tokens) | Source intent |
| --- | --- | --- | --- |
| D1 | Disc | `sm` `size.control.sm` (32), `md` `size.control.md` (40); `flex: none`; `display: inline-block; vertical-align: middle` | `avatar-size-1`. Measured 32 by 32 and 40 by 40 in all twelve sheets, which hold neutral and professional. `md` is 44 under Friendly (K1) |
| D2 | Shape | `clip-path: circle(50%)`, `overflow: hidden` and `contain: paint` on the root | `avatar-look-1`, open question 7. `overflow` adds no look. It is there so `expectNoGlyphClip` finds a clipping ancestor (amendment 4). `contain: paint` holds the edge at every sub-pixel position (R1) |
| D3 | Ground | `avatar.bg` references `border.subtle`, set on the root | Changed from `surface.sunken`. Neutral light is 1.03 on canvas and 1.13 on card: the disc is gone (`explore-neutral-light-a.png`). In dark `surface.sunken` is darker than the page, so each disc reads as a hole (`explore-neutral-dark-a.png`). `border.subtle` is the value of `skeleton.bg`, so the placeholder and the disc that replaces it are the same colour, which is the intent of `avatar-look-1`. It holds at 1.18 to 2.05 on canvas and 1.18 to 1.5 on card. On the root, so a transparent picture still sits on a disc |
| D4 | Ink | `avatar.fg` references `text.primary`, on `.ds-avatar__fallback` | Forced by D3: `text.secondary` on `border.subtle` is 3.94 under professional light and 3.97 under friendly light, under the 4.5 floor. `text.primary` is 6.81 at its lowest (professional dark). A letter that stands for a person is content, not supporting text |
| D5 | Initials type | `type.control.md` (14 / 1.6, weight 500) at both sizes, on `.ds-avatar__fallback` | DESIGN.md §4: a label that never wraps, in a control with a height token, takes `type.control.md`; Button lg stays on it at 48 px. `type.label.sm` at `sm` puts ป at -1.5 px, on the bound. 14 / 1.6 reads -1.24 at worst. Rejected: 16 px at `md`, which looks fuller (`explore-neutral-light-c.png`) but puts ป at -1.75, past the bound, and needs a bundle no type token holds |
| D6 | Centring | `.ds-avatar__fallback` is inline-flex at the top of the root's line box (R2), centred on both axes; the initials sit in their own line box `.ds-avatar__initials` | DESIGN.md §4: a single-line control centres the label's body. The inner span is what `expectInkCentred` measures (amendment 3). Latin pair width at `sm`: `WM` 24.4 px, inside the 30 px chord at cap height |
| D7 | Tall and tailed consonants | No rule. ป ฝ ฟ rise and ฎ ฏ ฐ ญ ฤ ฦ fall from a centred body | The body stays on one band with every other consonant, as DESIGN.md §4 asks of marks. Their whole ink is off centre by design (ฎ 3.01, ฝ -0.99 at `md`), so a play never picks a tailed letter with `measure: "body"`. The fixtures of AC 2 hold no tailed letter |
| D8 | Glyph | `PersonIcon`, `size.icon.sm` (16) and `size.icon.md` (20), ink `avatar.fg`, stroke as `icons.tsx` sets it | `avatar-chain-1`, `avatar-size-1`. It has the same weight as the 14 px letters in every sheet |
| D9 | Picture | `display: block; inline-size: 100%; block-size: 100%; object-fit: cover` | `avatar-look-1` |
| D10 | Text in the disc | `white-space: nowrap; user-select: none` | Two clusters never wrap. An initial is part of a picture, so dragging across a row must not copy "ส สมชาย ใจดี". `.ds-button` sets the same `user-select` |
| D11 | Motion | None: no `transition`, no `animation`, no rule under reduced motion | `avatar-look-1`, DESIGN.md §9 item 6. The swap of step 3 is a hard cut |
| D12 | Row beside a name (stories only) | `flex items-start gap-3`; the text column `min-w-0` with `pt-2` at `md` and `pt-1` at `sm`, `text-body-sm` | One start edge, and a shape that holds at every line count: the first line stays centred on the disc at one, two and three lines (`neutral-light-360-th.png`). `items-center` would float the disc down a wrapped name |
| D13 | As a control | `Button` ghost `md` `iconOnly` holding an `sm` Avatar: a 32 disc in a 40 square, 3 px inside the 1 px border | AC 9 names no Button size, and it must be `md`: by the recipe, Button `sm` is 32 wide with 30 px inside its border, so a 32 disc would paint over the focus line (read from `recipes.css`, not rendered). Hover and focus are Button's own. Measured: button 40 by 40 |

## States

<!-- prettier-ignore -->
| State | What shows | Story |
| --- | --- | --- |
| Default | Picture in the disc | `Picture` |
| Loading | Fallback at full size, no spinner and no pulse | `SlowPicture` |
| Empty (no `src`, no initials) | Person glyph | `NoName` |
| Error (failed load) | Fallback, same name | `FailedPicture`, `NewPicture` |
| Success | Not applicable. The picture itself | |
| Hover, focus | None on Avatar. Button's in `AsControl` | `AsControl` |
| Disabled, selected | Not applicable: Avatar has neither. A disabled Button does not dim the disc, so a screen that needs it raises it then | |
| Dark, profile B | Same shapes | `RecipesAndModes` |

Hover in `AsControl`: Button's fill is `surface.hover`, which equals `border.subtle` in dark under neutral, professional and friendly, so the disc merges into the fill and the initial stays (`neutral-dark-1440-th.png`, `professional-dark-1440-th.png`). In light the disc stays at 1.15 to 1.19. The spec's token merged in light instead. Accepted: hover belongs to the control and the letter never goes.

Pale picture on a light page: a picture with a pale ground loses its edge on `surface.canvas` (`neutral-light-1440-th.png`, the last disc of each step row). Accepted, since `avatar-look-1` says no border. A clip leaves no edge to draw, and a ring needs a round radius that no semantic token holds. A later story with real photos can raise it.

Forced colours: the ground drops, the ink and the picture stay (`forced-colours.png`). The initial still tells people apart, so no rule is added. Skeleton's transparent outline would not help: the circle clip cuts it away.

## Builder table: markup and CSS per rule

Put the recipe block in `packages/design-system/src/recipes/recipes.css` after the Skeleton block (ends at line 1501), and the token group in `component.json` after `skeleton` (line 2152). The block below was rendered as written, with the two `--cmp-*` values set by a style tag. R1 and R2 are already in it: their two changes were rendered by injection on the built stories.

```css
/* Avatar (ORV-224). Round under each profile by clip, the form Skeleton's circle uses. No border,
 * no shadow, no motion. `overflow` adds no look; the clip checks read it. `contain: paint` keeps
 * the clip and the box on one pixel, so the edge holds at a fractional position. */
.ds-avatar {
  display: inline-block;
  flex: none;
  vertical-align: middle;
  inline-size: var(--ds-size-control-md);
  block-size: var(--ds-size-control-md);
  overflow: hidden;
  clip-path: circle(50%);
  contain: paint;
  background: var(--cmp-avatar-bg);
}
.ds-avatar[data-size="sm"] {
  inline-size: var(--ds-size-control-sm);
  block-size: var(--ds-size-control-sm);
}
.ds-avatar__image {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
/* Inline-level on purpose: a link's line stops at an atomic inline, so the letter stays bare. */
.ds-avatar__fallback {
  display: inline-flex;
  vertical-align: top;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  block-size: 100%;
  color: var(--cmp-avatar-fg);
  font-family: var(--ds-type-control-md-font-family);
  font-size: var(--ds-type-control-md-font-size);
  line-height: var(--ds-type-control-md-line-height);
  font-weight: var(--ds-type-control-md-font-weight);
  letter-spacing: var(--ds-type-control-md-letter-spacing);
  white-space: nowrap;
  user-select: none;
}
.ds-avatar__fallback > svg {
  inline-size: var(--ds-size-icon-md);
  block-size: var(--ds-size-icon-md);
}
.ds-avatar[data-size="sm"] .ds-avatar__fallback > svg {
  inline-size: var(--ds-size-icon-sm);
  block-size: var(--ds-size-icon-sm);
}
```

`.ds-avatar__initials` needs no declaration of its own: as a flex item it is one line box. It stays a named class because the plays select it.

<!-- prettier-ignore -->
| Rule | Markup | CSS and tokens |
| --- | --- | --- |
| avatar-api-1 | `<AvatarPrimitive.Root className={cx("ds-avatar", className)} data-size={size} {...a11y}>`, with `size = "md"` as the default so `data-size` is always set. `AvatarSize` is `"sm" \| "md"` | `.ds-avatar` |
| avatar-chain-1 | Inside the root, always both: `<AvatarPrimitive.Image className="ds-avatar__image" src={src ?? undefined} alt="" />` and `<AvatarPrimitive.Fallback className="ds-avatar__fallback">{initials ? <span className="ds-avatar__initials">{initials}</span> : <PersonIcon />}</AvatarPrimitive.Fallback>`. Radix's `src` takes no `null`, hence `?? undefined`; it treats a missing or empty `src` as an error, which shows the fallback. No `delayMs` | `.ds-avatar__image`, `.ds-avatar__fallback`, the two `> svg` rules |
| avatar-initials-1 | `const initials = name ? initialsOf(name) : ""`. Thai ranges as `\u` escapes | None. No `text-transform`, no letter-spacing beyond the token's |
| avatar-name-1 | `a11y` is `decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name?.trim() \|\| m.avatar.noName }` | None. No focus style on any `.ds-avatar` selector |
| avatar-size-1 | `data-size` | `[data-size="sm"]` rules. Initials are one token at both sizes (D5) |
| avatar-look-1 | None | `component.json`: `"avatar": { "$description": "A person's disc (ORV-224): the ground of Skeleton's circle, so one replaces the other", "bg": { "$type": "color", "$value": "{border.subtle}" }, "fg": { "$type": "color", "$value": "{text.primary}" } }`, then `pnpm --filter @orivilo/design-system tokens`. `pairs.ts`: `{ recipe: "avatar", slot: "fallback", fg: "avatar.fg", bg: "avatar.bg", floor: TEXT }` |
| avatar-none-1 | No prop, no slot, no child | None. No dot and no badge rule |
| avatar-data-1 | No `title`, no `data-name`, no `data-src` | None |
| avatar-stories-1 | The twelve stories of the spec, with `BesideName` and `At360` in the row of D12 and `AsControl` as D13. Fixture picture below | None. Layout utilities only |

`avatarFixtures.picture`, the drawn stand-in used for these images (a head and shoulders of two flat shapes, no person). Its colours are picture content, not style values:

```text
data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2F6F73"/><circle cx="48" cy="38" r="18" fill="#DCE9E4"/><path d="M12 96a36 34 0 0 1 72 0z" fill="#DCE9E4"/></svg>
```

Encode the SVG part with `encodeURIComponent`. Label it mock in a comment.

## Rework rows (findings of ORV-224-signoff-1)

Each row was rendered with its CSS injected into the built stories at `23450be` through `page.addStyleTag`. Nothing under `packages/` changed. The block in "Builder table" already holds both changes. No token and no radius value is added, and `clip-path` and `overflow` stay as they are, so AC 2, 7 and 12 still read what they read.

<!-- prettier-ignore -->
| # | Finding | Target | CSS and tokens | Play | Rendered |
| --- | --- | --- | --- | --- | --- |
| R1 | F1: a disc on a fractional position loses its circle, with a flat top and a narrow bottom | One round edge at every sub-pixel position. Device scale 1, neutral, ink lines at a threshold of 12 in px, read as top, bottom, left, right, at x and y offsets 0, 0.25, 0.5 and 0.75: `md` initials and glyph 10, 11, 10, 10; `md` picture 12, 12, 12, 12; `sm` initials and glyph 10, 10, 10, 10; `sm` picture 10, 10, 12, 11. Friendly `md` initials and glyph 10, 10, 12, 12. The built `md` initials disc reads top 8 to 14 and bottom 7 to 12 over the same offsets | `.ds-avatar { contain: paint; }`, beside `clip-path` and `overflow`. No token. It adds no other effect here: `clip-path` already makes a stacking context, the root already holds its own formatting context, and the paint clip is the padding box `overflow` clips at. Rejected: `will-change: transform` also removes the fault but gives every disc its own compositor layer, which a long list should not pay for (own reading, not measured). `overflow: clip` and `clip-path: inset(0 round 50%)` leave the flat top. A radius needs a round value no semantic token holds (sign-off `candidates.mjs`) | AC 7, `Sizes`, under `inVitest`, after the existing `expectInkCentred`: `await expectPaintHolds(canvas.getByTestId("row-picture").parentElement, discs(canvasElement), [0.25, 0.5, 0.75])`. New in `visual-asserts.ts`. (1) Shoot the frame at offset 0, then once per offset. (2) Move by layout: `padding-block-start` and `padding-inline-start` of `4 + o` px and `padding-block-end` of `4 - o` px, so the shot keeps its size. Never `translate` or `transform`: a transform carries box and clip together, so the built disc shows no fault and the play could not go red. Restore in `finally`. (3) Assert the frame sits on a whole pixel and each disc's `rect.x % 1` and `rect.y % 1` equal `o` within 0.02, so an offset that did nothing is red. (4) Read each disc's box plus 2 px on every side, anchored at `Math.round` of its position in the frame, since the box paints on the rounded pixel. `Math.floor` reads one row off at 0.5 and 0.75 and goes red on good CSS. (5) `paintDifference(a, b)`, pure and tested in node, counts pixels over `PAINT_TOLERANCE` (12), and it must be 0 for all nine discs. Not `INK_DISTANCE` (48): at 48 the built glyph row reads 0 in light, so the play would pass on the fault. (6) Keep every `expectInkCentred` out of the moved state: at y + 0.5 it reads บ at 1.51 against the layout box, past its 1.5 bound, though the ink sits where it does on a whole y. Device scale 1 only, which is the Storybook project's. Red proof for the builder: delete `contain: paint` and the play reads 41 to 169 px per disc in light and 52 to 184 in dark (stand-in numbers, see "Measured for R1 and R2") | Before and after, three steps at four offsets: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f1/f1-sweep-light-scale1.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f1/f1-sweep-dark-scale1.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f1/f1-sweep-light-scale3.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f1/f1-sweep-dark-scale3.png`. All six profile and mode cells: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/recipes-and-modes-360-light-th.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/recipes-and-modes-360-dark-th.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/recipes-and-modes-1440-light-th.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/recipes-and-modes-1440-dark-th.png`. A list at one to six lines: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/lines/lines-md-360-light-th-fix.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/lines/lines-md-360-dark-th-fix.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/lines/lines-sm-1440-dark-en-fix.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/lines/lines-sm-1440-light-en-fix.png`. Real device scale 1.5: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f1/real-scale-1_5.png` |
| R2 | F2: inside a flex or grid link, the link's line runs through the initial in the disc | 0 px differ between the link row's disc and the plain row's disc, light and dark. The name beside it keeps its line. The disc stays at `dx` 0 and `dy` 0 in the root, and the initials stay centred (box offset at most 0.01 px) | `.ds-avatar__fallback { display: inline-flex; vertical-align: top; }` in place of `display: flex`. No token. A line does not enter an atomic inline. The root cannot stop it, because a flex or grid parent blockifies the root's `inline-block`, which is why a block or an inline link shows no line on the built disc. `vertical-align: top` holds the box at the top of the root's line box, whatever `line-height` or `font-size` the page sets. Rejected: `.ds-avatar__initials { display: inline-block }` keeps the line, since a flex item is blockified too (sign-off `candidates.mjs`). `text-decoration: none` cannot lift a line a parent draws | AC 8, `BesideName`, under `inVitest`: `await expectSamePaint(canvasElement, roots[1], roots[2])`, with `expect(getComputedStyle(canvas.getByRole("link", { name: a.name })).textDecorationLine).toBe("underline")` beside it, so a story that drops the line cannot pass. New in `visual-asserts.ts`: one shot of the scope, both discs' boxes read with the anchors of R1 step 4, `paintDifference` must be 0. `roots[1]` is the plain row with no `src` and `roots[2]` the link row, so both read ส. Red proof for the builder: put `display: flex` back and the play reads 10 px at device scale 1, light and dark (stand-in numbers) | Before and after: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f2/f2-link-light.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/f2/f2-link-dark.png`. The story: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/beside-name-360-light-th.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/beside-name-360-dark-th.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/beside-name-1440-light-th.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/beside-name-1440-dark-th.png` |

R1 does not fix F2 and R2 does not fix F1: with one row alone, the other finding reads as built. The builder needs both, and `visual-asserts.ts` and its node test join the files of `recipes.css` and `Avatar.stories.tsx`.

The other ten stories were checked with both rows in, not only `BesideName` and `RecipesAndModes`. `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/stories/` holds the 96 full pages, named `<story>-<360|1440>-<light|dark>-<th|en>.png`, and `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/crops/` holds the same names cropped. Those 96 give 30 distinct crops by hash, because a width or a locale changes few of these stories. All 30 were opened.

## Known limits

- K1 (finding S1). `md` is 44 px under Friendly, because `size.control.md` follows the profile, and 40 px under neutral and professional. `sm` stays 32 and the glyph stays 16 and 20 under all three. The Skeleton circle in its story is `size-10`, 40 px under all three, so under Friendly a swap from that circle to a disc shifts 4 px. Answer 4 holds under neutral and professional only. The first screen sizes its Skeleton circle from `size.control.md`, so the two stay one size. The same size moves the row of D12: `pt-2` centres the first line on a 40 px disc, so under Friendly the line sits 2.1 px above the centre of the disc, where the other two read -0.1 (`/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/friendly/beside-name-friendly-light.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/friendly/beside-name-friendly-dark.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/friendly/sizes-friendly-light.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2/friendly/sizes-friendly-dark.png`). D12 is a story layout, so no recipe changes. The first screen with this row aligns it for that profile.
- K2. A `transform` on an ancestor at a fractional offset is outside R1: built and proposal read the same. `translate(0.25px, 0.75px)` reads top 12, bottom 9, left 8, right 12 at device scale 1, against 10, 11, 10, 10. `scale(1.1)` reads 13, 3, 3, 13. No Avatar sits in an overlay yet, so the first overlay that holds one reads its edge there.
- K3. Chromium only. This machine has no WebKit or Firefox build, so R1 and R2 are not read in Safari or Firefox, and neither is F1.
- K4. A `text-indent` on a page around a disc moves the letter, in the built disc and in the proposal alike. No rule is added.

## Spec amendments this design needs (L-0019)

1. `avatar-look-1` and the contract row "Component tokens": `avatar.bg` references `border.subtle`, not `surface.sunken`, and `avatar.fg` references `text.primary`, not `text.secondary` (D3, D4). The row's reason changes from "the values of `badge.neutral`" to "the ground of `skeleton.bg`, and the ink that clears 4.5 on it". The `pairs.ts` row keeps its form and floor.
2. `avatar-size-1`: the `sm` row reads `type.control.md`, not `type.label.sm` (D5). The contract row "Recipe classes" loses `--ds-type-label-sm-*`.
3. AC 2 and AC 7: `expectInkCentred` takes `.ds-avatar__initials` as its boxes, not `.ds-avatar__fallback`. With the disc as the box, the rows reach past the circle, and the page outside it differs from the disc by more than the ink threshold, so the reading is the circle and not the letter. Measured at device scale 1, whole y: on the disc box the Latin labels read -0.5 to 0 where the same labels on their span read -2.5 to 1.51, a pass that proves nothing, and some Thai labels read -7.5.
4. AC 2 and AC 11: `expectNoGlyphClip` takes the `.ds-avatar` root in AC 2, not the initials span. It walks up from the text and stops at the element it is given, and it counts only `overflow` as a clip, not `clip-path`. Without `overflow: hidden` on the root and the root as argument, it throws "has no text under a clipping ancestor". AC 11: every ancestor of the name up to the frame keeps visible overflow, and `expectLinesClear` proves the ink (spec v1.1). The helper's box is square, so it does not prove a fit inside the circle; the screenshots do.
5. Contract row "Recipe classes": add `ds-avatar__initials`, and add `overflow: hidden` to `avatar-look-1`, which says nothing against it.
6. AC 9: name Button `size="md"` (D13).

No new token beyond the spec's table. Impact of amendments 1 and 2: `component.json` and the regenerated `generated.css` (the same two names, new references), `recipes.css` as above, `catalog/base/avatar.yaml` unchanged, `pairs.ts` unchanged from the spec's row. No primitive, semantic token, profile, Skeleton, Button or Badge changes. Spec rule text is the main session's to edit; this role writes `design.md` only.

### Amendments from R1, R2 and K1

Spec rule text stays the main session's to edit. Each row names what changes.

<!-- prettier-ignore -->
| Spec row | Change | From |
| --- | --- | --- |
| `avatar-look-1` | After the sentence on `overflow: hidden`, add: the root also has `contain: paint`, so the edge holds at every sub-pixel position, and `.ds-avatar__fallback` is `inline-flex` with `vertical-align: top`, so a link's line stops at the disc | R1, R2 |
| AC 7 | "User sees": add "each disc keeps one round edge at x and y offsets 0.25, 0.5 and 0.75". "Check": add `expectPaintHolds` under `inVitest`, after `expectInkCentred` | R1 |
| AC 8 | "User sees": add "the letter in the link row carries no line, and the name keeps its own". "Check": add `expectSamePaint` on the plain row's disc and the link row's disc under `inVitest`, and the link's computed `textDecorationLine` | R2 |
| AC 18 | "the reading at `design.md` line 181" moves with this edit: name it "the row `avatar.fg` on `avatar.bg` of `design.md`, section Measured" | This task |
| AC 20 | Add `src/testing` to the second Vitest command, for the node tests of `paintDifference` | R1, R2 |
| `avatar-size-1`, W2, contract row of `catalog/base/avatar.yaml` | W2 and the catalog's size rule give neutral and professional. Add: `md` is 44 px under Friendly, since `size.control.md` follows the profile. AC 7's 40 stays right, since `T` is neutral | K1 |
| "Contract changes and impact" | Add one row: `expectPaintHolds`, `expectSamePaint` and `paintDifference` in `src/testing/visual-asserts.ts` and its node test, layer Test helper, not public. The row "Recipe classes" gains no class. No token changes | R1, R2 |

## Measured

Rendered with Chromium through Playwright on Storybook port 6426, stopped after the run.

<!-- prettier-ignore -->
| Reading | Result |
| --- | --- |
| `avatar.fg` on `avatar.bg`, proposed, each set of `CONTRAST_SETS` | neutral 13.96 light, 12.49 dark; professional 12.01, 6.81; friendly 11.94, 6.95; orivilo 13.96, 12.49. Floor 4.5 |
| `text.secondary` on `border.subtle` (not taken) | professional light 3.94, friendly light 3.97: under the floor |
| Disc on page, spec `surface.sunken` | canvas 1.03 to 1.21, card 1.13 to 1.65; neutral light 1.03 and 1.13 |
| Disc on page, proposed `border.subtle` | canvas 1.18 to 2.05, card 1.18 to 1.5; neutral light 1.18 and 1.3 |
| Ink centre of ส พ ป บ ล AS SC A B on `.ds-avatar__initials`, final CSS | Worst offset 1.26 px (ส, บ, ล), ป -1.24, both sizes. Bound 1.5. Read under neutral and professional, light and dark, at y offsets 0, 0.25, 0.5 and 0.75, device scale 1 and 2, by the method of `inkCentreOf` copied into the scratch tool, not by the helper itself |
| All 46 consonants at `md`, 14 / 1.6, device scale 1, whole y | Most 0.51; ป -0.49; ฝ ฟ -0.99; ธ บ ษ ฮ 1.01; ญ ฤ ฦ 2.51; ฎ ฏ ฐ 3.01 (D7) |
| Rejected: 13 / 1.5 at `sm` | ป -1.5, on the bound |
| Rejected: 16 / 1.6 at `md` | ป -1.75, past the bound |
| Glyph box inside the disc | Text rect 18 px tall in a 32 and a 40 disc, inside the box for every label |
| 360 px frame | `scrollWidth` 360 in all six 360 sheets |
| 1440 px | `scrollWidth` 1440 in all six 1440 sheets |

Nothing here ran in Vitest. `expectInkCentred` reads at that project's device scale, so the builder's plays are the proof on the real component.

### Measured for R1 and R2

Rendered with Chromium through Playwright on Storybook port 6437, head `23450be`, stopped after the run. The read tools sit in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-2-tools/`. A row marked stand-in used the plays' method from outside Vitest: same device scale, same element screenshot, no helper. The builder's plays are the proof on the real code.

<!-- prettier-ignore -->
| Reading | Result |
| --- | --- |
| Edge, emulated scale 1, 2 and 3, `Sizes`, picture, initials and glyph, `sm` and `md`, neutral and Friendly, eight x and y offsets | Proposal: one reading per disc at scale 1 and 2. At scale 3 `md` shifts by 1 device px at the threshold on some offsets (Friendly picture: top 22 or 23). Built: seven or eight different readings per disc |
| Edge, real device scale 1, 1.25, 1.5, 1.75, 2 and 3 (`--force-device-scale-factor`), `md` initials, eight offsets | Proposal: one reading per scale at all eight offsets, at each of the six scales. Built at 1.5: top 6 to 16, bottom 12 to 16; proposal 14 and 14 |
| Edge, emulated scale 1.25, 1.5 and 1.75 | Proposal drifts here (1.5 reads top 2 at y + 0.5, 61 rows). Not a fault of the disc: Playwright's `deviceScaleFactor` keeps layout in CSS px, and a real scale does not. Read a fractional scale with `--force-device-scale-factor` only |
| Stand-in play R1, device scale 1, nine discs, three offsets | Built: 41 to 169 px per disc in light, 52 to 184 in dark. With R1: 0 at all offsets, both modes. At threshold 48 the built glyph row reads 0 in light |
| Stand-in play R1, `Math.floor` anchor | R1 in, dark, offsets 0.5 and 0.75: 208 to 373 px per disc, so the floor goes red on good CSS |
| Stand-in play R2, device scale 1 | Built: 10 px, light and dark. With R1 and R2: 0. R1 alone: 10 |
| Link forms, device scale 2, plain disc against link disc | Built 36 px (underline), 20 (`line-through`), 36 (`overline`), 172 (wavy 3 px), 36 (grid link), 0 (block link), 0 (inline link). Proposal 0 in all seven |
| Built against proposal, 12 stories, 96 shots, device scale 2 | 80 shots: no pixel differs. `BesideName`, 8 shots: 36 px. `RecipesAndModes`: 3972 px at 360, 5309 at 1440. All of it within 1.5 px of a disc box, and 0 px outside. Page size the same in all 96 |
| Computed style, every disc in the 96 shots | `clip-path` `circle(50%)`, `overflow` `hidden`, `contain` `paint`, widths 32, 40 and 44, box offset of letter and glyph at most 0.01 px. `scrollWidth` equals the viewport width in all 96 |
| Line counts, a list of names at 1 to 6 lines, `md` and `sm`, 360 and 1440, Thai and English, light and dark, device scale 2, 16 lists | Disc y reaches .00, .16, .17, .59 and .98. Proposal `md`: 16, 14, 16, 16 device px on every row. Proposal `sm`: bottom 12 or 14, the rest one reading. Built `md`: top 12 to 20, bottom 2 to 18. First line against the disc: -0.1 px at every count. No sideways scroll |
| Ink centre of ส พ ป บ ล AS SC A B, final CSS, `sm` and `md`, three profiles, light and dark, device scale 1 and 2, y offsets 0 to 0.75, method of `inkCentreOf` | On a whole y the proposal reads as built (device scale 1: ส 0.51, ป -0.49, บ 1.01, AS 0.51). Against the layout box the proposal reads -0.99 to 1.51, built -1.24 to 1.26. The 1.51 is บ at y + 0.5, past the bound by 0.01. The ink has not moved in the disc: stand-in play R1 reads 0 px with ส in the region. The plays of AC 2 and 7 read on a whole y, so they stay inside the bound |
| Page styles around the proposal, device scale 2 | `text-align` center and right, `line-height` 4 and 0, `font-size` 48 and 0, `word-spacing`, `letter-spacing` and `direction: rtl`: 0 px differ from the plain disc. `text-indent` moves the letter, built and proposal alike (K4) |
| Under Friendly, `md` | Disc 44, glyph 20, first line -2.1 px, Skeleton circle 40 (K1) |

## Screens to check in visual QA

Stories: `Picture`, `Initials`, `NoName`, `Sizes`, `BesideName`, `AsControl`, `At360`, `RecipesAndModes` at 360 and 1440 px, Thai and English, light and dark. Look for:

- The disc holds on `surface.canvas` and on `surface.card` in every mode, and a Skeleton circle swapped for it does not change colour or size.
- The three steps read as one component: same disc, same ink weight in letter and glyph.
- Each Thai consonant sits alone, whole and centred at both sizes, with no mark and no vowel.
- A wrapped name keeps its first line centred on the disc, one start edge for every line.
- Focus: Button's line and halo around the disc, nothing on the disc, and it differs from hover.
- No dot, tick or count anywhere.
- A disc on a fractional y, as in `RecipesAndModes` and on the third row of a wrapped list: the same round edge as on a whole y (R1).
- The link row of `BesideName`: no line through the letter, and the name keeps its line (R2).

## Proposal images

Contact sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-1/contact-sheet.png`

Each file below sits in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-224-design-1/`. Each sheet holds the three steps on canvas and card, W1 at both sizes, tails and marks, rows beside a name, the Skeleton swap and the control states. Sheets are named `<profile>-<mode>-<width>-<locale>.png`.

<!-- prettier-ignore -->
| File | Shows |
| --- | --- |
| `neutral-light-360-th.png`, `neutral-light-1440-th.png` | Neutral light, Thai |
| `neutral-dark-360-th.png`, `neutral-dark-1440-th.png` | Neutral dark, Thai |
| `professional-light-360-th.png`, `professional-light-1440-th.png` | Second profile, light, Thai: round disc beside square controls |
| `professional-dark-360-th.png`, `professional-dark-1440-th.png` | Second profile, dark, Thai |
| `neutral-light-360-en.png`, `neutral-light-1440-en.png`, `neutral-dark-360-en.png`, `neutral-dark-1440-en.png` | English rows, beyond the envelope's Thai set |
| `explore-neutral-light-a.png`, `explore-neutral-dark-a.png` | The spec's tokens and type, for comparison |
| `explore-neutral-light-c.png`, `explore-neutral-dark-c.png` | Rejected 14 and 16 type on the proposed tokens |
| `q2-options-light.png`, `q2-options-dark.png` | Open question 2, options (a) to (d) |
| `forced-colours.png` | Forced colours emulated |
| `edge-dpr1.png` | The circle edge at device scale 1, on a whole y only: clean, no stair steps at either size. A fractional y was not read here; see R1 |
