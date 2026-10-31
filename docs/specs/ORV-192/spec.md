---
issue: ORV-192 (https://tpetkaew.atlassian.net/browse/ORV-192)
lane: L by default (open question 1)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-192: UI polish batch, 19 look and test rows

## Goal

The owner's UI polish batch card: the rows of Jira ORV-192 comment 10388 and the comments that follow it (10391 to 10404), as `docs/specs/ORV-192/design.md` cites them. Small look comments go into one combined card and one PR (owner, 2026-10-31). Each row keeps its number from the `## Rows` table of design.md; where its values live: `rows-home-1`.

The 19 rows by kind:

- Decided by the owner, built: 5 (comment 10388, then reduced to radius 19), 9 (comments 10402 and 10403), 13 (style A, comment 10397), 15 (comment 10400) and 16 (comment 10401, which supersedes the Friendly part of row 15).
- Recommended by the designer, built, for the owner to judge: the eight rows of `judge-built-1`.
- Test and token fixes carried from earlier cards: 1 (ORV-189 row 9, comment 10378), 3 and 6 (ORV-190), 4 (design.md row 4, the dark block survey) and 10 (ORV-189 row 6).
- From sign-off ORV-192-signoff-2 finding F3, recommended by the designer, built, judged by the designer's visual sign-off: 19. It is not under `judge-built-1`, because the owner approved the built rows live (ORV-192 comment 10406) before row 19 existed.

Nothing here is simulated: the stories render the real components, and the tests read the real token source and generated CSS. No product behaviour, permission or stored data changes.

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook, Inspector `Selected` | The story renders and its play runs | The square panel follows the wrapper's rounded corners; no corner shows past the curve. No new copy | None | Inspector `Selected` play: the `Panel` wrapper's computed `overflow` is `hidden` (`Inspector.stories.tsx` line 193), red before the class (design.md row 1) |
| 2 | Storybook, Block library at 360 px with one, two or three rows of canvas controls | `Default`, `Narrow`, `WithTaskBar` and `RecipesAndModes` render and their plays run | The shelf and the status line sit 16 px above the canvas controls at any row count; no overlap (today 14 px at two rows and 50 px at three). No new copy | None | The plays: controls top minus shelf bottom is 16 within 1 px (`expectClear`, `BlockLibrary.stories.tsx` line 436), replacing `expectRise` 88 and 162 (design.md row 2) |
| 3 | Storybook, Block library `Narrow` | The play scrolls a tile into view at each end | Nothing new (section "Rows that render nothing") | None | `Narrow` play `expectScrollPadding` (`BlockLibrary.stories.tsx` line 286): red (gap 4 off) when `.ds-shelf__groups` loses its `scroll-padding` |
| 4 | A dark boundary nested inside another profile, such as neutral dark inside Friendly | The nested boundary renders | Its own size, shape, space, type, font, motion, opacity and layer values: neutral dark reads `size.control.md` 40, not Friendly's 44. No token name or value changes | `tokens/generated.css` regenerated: the dark and the system-dark blocks declare all 147 semantic tokens | `tokens.test.ts` "declares every semantic token in the light, the dark and the system-dark block" (line 70); `profiles.test.ts` "a nested boundary resets every semantic value (ORV-192 row 4)" (line 542), red on today's output for neutral, Professional and Friendly in dark; the Contract play passes with the preview mode set to dark |
| 5 | Storybook `Base/Logo` `SmallSizes`, and the brand files | The mark renders at 16, 24, 32 and master heights | A bigger dot that balances the ring: radius 19 drawing units in every form (16, 24 and master); the centre, ring, stroke ladder and colours as before; clearance 3.09 px at 32, 2.16 px at 24 and 1.33 px at 16 (worked example 1) | `geometry.ts` `DOT_RADIUS`, `orivilo-mark.svg` and `orivilo-lockup.svg` change | `SmallSizes` play: the eight `.ds-logo__dot` radii read `19 19 19 19 19 19 19 19` (`Logo.stories.tsx` line 260); the 16 px probe reads pixel (8, 3) as the canvas and pixel (13, 5) within 24 of it, light and dark, full colour and one-colour; `logo.test.ts` row 5 case (line 216) |
| 6 | Storybook, Block library `Default` and `Narrow` | `expectRings` ends | Nothing new (section "Rows that render nothing") | None | The play asserts the row scrolled to 0 and no tile focused (`BlockLibrary.stories.tsx` lines 157 to 159), red (scrollLeft 1806, 2646) when the reset and the blur are dropped |
| 7 | Storybook `Foundations/Typography` `Scale`, under neutral | The scale renders and its play runs | Display, heading and numeral at 500 (today 600); label at 500; body and code at 400; each weight a true face, never a synthesized bold. The ToggleGroup pressed item has the same weight as the other items. No new copy | `semantic.json` display, heading and numeral weights and the profile overrides that restate them | `Scale` play: `.text-display-lg`, `.text-display-md`, `h1`, `h2` compute 500 and the three body rows 400 (`typography.stories.tsx` lines 107 to 112); `document.fonts.load("500 20px Sarabun", "ก")` returns a Sarabun face (line 119); `profiles.test.ts` "type weights" (line 153); `Base/ToggleGroup` `Single`: the pressed and the other items share one weight |
| 8 | Storybook `Base/Kbd` `RecipesAndModes` | The caps render under neutral, Professional and Friendly, light and dark | Each key cap has one 1 px border on all four sides (the heavier bottom goes) and 8 px inline padding each side; a one-glyph cap is a lozenge about 29.3 by 21.5 px, never a circle (worked example 2); weight 500. Key labels as today, such as `Cmd Shift L` | `component.json` `kbd.padding-x` | The play: border widths 1/1/1/1, padding-left equals padding-right at 8 px (`Kbd.stories.tsx` lines 107 and 108), and a one-glyph cap is at least 1.3 times as wide as it is tall |
| 9 | Storybook, each focusable control that design.md section "Every focusable control" lists, under neutral, Professional and Friendly, light and dark | Keyboard focus lands on it | The control's 1 px border (or a 1 px line on its edge) turns the profile's brand (the `action.primary` primitive: violet, navy or coral) with a 3 px halo of the same colour at 24 percent touching it, no gap; filled buttons and a checked checkbox add a 1 px ink line inside; an invalid field keeps its red border; the Thai label การตัดสินใจ stays whole inside a focused tab | Token contract: `focus.ring` restated per profile, new `focus.halo-opacity` and `opacity.focus-halo`, `focus.offset` removed, the `focus` group leaves the locked groups | `profiles.test.ts` "focus.ring is the action.primary primitive under every set and mode (ORV-192 row 9)" (line 122); `tokens.test.ts` "focus follows the brand (ORV-192 row 9)" (line 174); the contrast pairs of `focus.ring` on six grounds at 3.0; the plays `Base/InputGroup` `FocusRing`, `Base/Button` `InteractionStates`, `Application/CanvasChat` `Send` and the `Base/DropdownMenu` checkable play |
| 10 | Storybook `Base/Button` `RecipesAndModes` (ORV-189 `matrix-keep-1`) | The play runs | Nothing new (section "Rows that render nothing") | None | The play asserts the grid top equals the surface top plus 16 (`Button.stories.tsx` line 424), red (0 against 16) with `layout: "fullscreen"` |
| 11 | Storybook `Base/Toast` `RecipesAndModes` and `At360`, Thai | A toast shows with one, two or three title lines | The status icon and the title's first line centre on the close button (content 4.8 px down, icon 6 px down; worked example 3); the description sits 4 px under the title in the muted inverse ink at 14 / 1.7; an action keeps 8 px above it. Copy, the saved toast of the story fixture (Thai only): title บันทึกร่างแล้ว, description ข้อมูลตัวอย่างจากชุดทดสอบ, action เลิกทำ | `recipes.css` `.ds-toast__content`, `__icon`, `__action`; `component.json` `toast.description` | The plays: per toast, the title's first line centre and the icon centre equal the close button centre within 0.5 px at one, two and three title lines; description top minus title bottom is 4; the description colour differs from the title's; an action sits 8 below the text (design.md row 11) |
| 12 | Storybook `Base/ToggleGroup` `Single`, under each profile, light and dark | An item is pressed, then hovered | The pressed item keeps today's `surface.card` chip and `text.primary` ink, loses its 1 px ring and sits on a soft lift; hover keeps the pressed chip; a disabled pressed chip has no lift; no inverse chip in any mode. The cue's contrast: `pressed-cue-1`. No new copy | `component.json` `toggle.border-pressed` deleted | `Single` play (`ToggleGroup.stories.tsx` line 87): the pressed item's box-shadow ends with `0px 1px 3px 0px` and has no `0px 0px 0px 1px` ring; its background is unchanged under `userEvent.hover`; the lift's alpha is worked example 5 |
| 13 | Storybook `Base/Tag` `Sizes` | The md and sm tags render | Style A, a soft pill: sunken fill, subtle hairline, label 400 at 14 px (md) and 13 px (sm); the x button a 24 by 24 circle 4 px from the end (24 by 22 in sm); the label ends 4 px before the x; hover shows on a selectable tag's edge only. No new copy | New semantic `type.body.xs` (13 px, 400); `tag.*` component tokens | `Sizes` play "Style A" (`Tag.stories.tsx` line 92): 13px 400 sm, 14px 400 md, a 24 by 24 round x button, the label 4 px clear of it; recipe pairs `hover edge` at 3.0 and the x on hover at 4.5 (`pairs.ts` line 893) |
| 14 | Storybook `Base/Progress` `RecipesAndModes` | The bars render under the three profiles, both modes | The empty track is a filled `border.subtle` bar with no outline; the running fill is `text.brand`, not Friendly's coral `action.primary` (2.6 on any visible track). No new copy | `component.json` `progress.*`, `pairs.ts` | The play (`Progress.stories.tsx` lines 178 to 195): border width 0 on each side, bar background equals `--ds-border-subtle`, fill height equals bar height; recipe pairs fill, done fill and failed fill on `progress.track` at 3.0 |
| 15 | Storybook `Foundations/Typography` `Scale`, under neutral and Professional | The display rows render | Thai in a display heading is Sarabun 500, the same face as the Thai in the text under it; Latin and digits in IBM Plex Sans | `semantic.json` `font.display`, `type.display.lg` and `type.display.md` take the Plex Sans stack | `Scale` play: `.text-display-lg` and `.text-display-md` compute `/^"IBM Plex Sans", Sarabun,/` (`typography.stories.tsx` lines 97 to 102); `document.fonts.load("500 56px Sarabun", "ก")` returns a Sarabun face (line 121). Row 15's Friendly exception is superseded by row 16 |
| 16 | Storybook `Foundations/Typography` `Friendly`, and Card and Dialog titles under Friendly | The page renders | Thai in each display and heading line is Sarabun; Thai in code is Sarabun after IBM Plex Mono; the Anuphan and IBM Plex Sans Thai files no longer load | Friendly's font overrides removed; the `font.family.anuphan` primitive, both families' files and their `@font-face` rules dropped | `Friendly` play (`typography.stories.tsx` line 130); `Scale` play mono family `/^"IBM Plex Mono", Sarabun,/` (line 105); `profiles.test.ts` "Thai face (row 16)" (line 202): under neutral, Professional and Friendly, each `type.*` token and `font.*` family has IBM Plex Sans or IBM Plex Mono first and Sarabun second, and names neither Anuphan nor IBM Plex Sans Thai |
| 17 | Storybook, the compact pairs (Toast, Tooltip, Field, Table empty state, Missing-inputs prompt, Block library tile), the header pairs (Dialog, Inspector with nothing selected) and the Select option | Each renders | Compact: one size, title 500 in the ground's primary ink over text 400 in its secondary ink, 4 px apart. Header: 20 / 500 primary over 16 / 400 secondary, 8 px apart. The Select option description is 13 / 400 secondary, 0 px under its label. On Toast and Tooltip the text takes the new muted inverse ink. Copy, Field `WithDescription` (story fixture, Thai only): label ชื่อโปรเจกต์ over ชื่อที่ทีมจะเห็นในรายการโปรเจกต์. Checkbox, Card and Side sheet do not move | New semantic `text.on-inverse-secondary` in the base, Professional and Friendly sets; seven component tokens change or join (design.md section "Builder table (row 17)", Impact) | The plays `Base/Field` `WithDescription`, `Base/Toast` `RecipesAndModes`, `Base/Tooltip` `WithDescription`, `Application/Dialog` `Open`, `Application/Inspector` `NoSelection`, `Application/MissingInputsPrompt` `ImagesLater` and `Application/BlockLibrary` `Default`, through `expectTitleOverText` (`visual-asserts.ts` line 309): size, weight, colour and the 4 or 8 px gap per pair; recipe pairs toast and tooltip description at 4.5 under the base, Professional and Friendly sets in both modes; the Select option by the designer's visual QA (design.md, section "Screens to check in visual QA (row 17)") |
| 18 | Storybook `Foundations/Typography` `Scale`, `Application/Card` `Default`, `Base/Tag` `Sizes`, a Thai paragraph with stacked marks | The stories render | Running text is 1.7 at each body size: 13 / 22.1, 14 / 23.8, 16 / 27.2, 20 / 34 (worked example 4); in a wrapped Thai paragraph no mark touches the line above; untyped text inside a boundary is 16 / 27.2, not 16 / 1.5; tags stay 24 and 32 px tall. No new copy | `semantic.json` `type.body.xs`, `type.body.sm`, `type.body.lg` line heights; `orivilo.css` boundary type | `Scale` play: body lg, md, sm compute 34, 27.2 and 23.8 px (`typography.stories.tsx` lines 116 to 118); `profiles.test.ts` (line 246): each `type.body.*` line height is at least 1.7 under the base, Professional and Friendly sets; `Card` `Default` play: the untyped paragraph computes 27.2 px (`Card.stories.tsx` line 43); `Tag` `Sizes`: still 24 and 32 |
| 19 | Storybook `Foundations/Typography` `Scale` and `Friendly` at 360 and 1440, Thai and English, light and dark, under neutral, Professional and Friendly; and the pages that set display type | The display rows render; the story fixture's sample starts with ฟื้น, Sarabun's tallest stack | A band of ground between each display row's caption and the highest Thai mark of its first line (7 px or more measured, design.md row 19); the mark no longer covers the caption (today 17 px into it at 56 / 1.2 and 9 px at 32 / 1.25). Every `text-display-lg` line (the Typography row, the landing hero) sits 24 px lower and every `text-display-md` line (the Foundations page titles, the decision log, settings and workspace examples, the app's home, not found, account and directions pages) 16 px lower than before; headings and numerals do not move. Copy, the sample of the story fixture (one line, Thai with Latin and digits): ฟื้นฟูแบรนด์ด้วยระบบตั้งใจ Intent Engine ให้เป็นผลิตภัณฑ์ที่มีชีวิต 0123 | `orivilo.css`: `.text-display-lg` takes `padding-block-start: var(--ds-space-stack-lg)` and `.text-display-md` `var(--ds-space-stack-md)`, outside any `@layer`; no token, value or contrast pair changes; `typography.stories.tsx` `SAMPLE`; DESIGN.md §4 display bullet and change log v1.54 | `Scale` play (`typography.stories.tsx` lines 122 to 131): for `.text-display-lg` and `.text-display-md` in the `dl`, `expectInkClearsAbove(row, caption, 4)` (`visual-asserts.ts` line 532) passes and `paddingTop` computes `24px` and `16px`; `StackClear` (`visual-asserts.stories.tsx` line 170): with `padding-block-start: 0` it throws /expected at least 4/, with the shipped padding it passes; the `firstInkRow` node cases in `visual-asserts.test.ts`; `profiles.test.ts` "display stack clearance (row 19)" (line 268): under the base set and each profile, `type.display.lg` 56 px at 1.2 or more, `type.display.md` 32 px at 1.25 or more, `space.stack.lg` 24 and `space.stack.md` 16; the `Friendly` story by the designer's visual QA (design.md, section "Screens to check in visual QA (row 19)") |

The rows of `judge-built-1` wait for the owner's live judgement; rows 5, 9, 13, 15 and 16 build an owner decision as written.

## Rows that render nothing

Rows 3, 6 and 10 change only a play (a scroll gap, a scroll and focus reset, and a grid offset that already hold today), and row 4 changes no token name or value, so none of them shows a change on any screen except a dark boundary nested inside another profile (row 4's Given).

## Rules and bounds

### rows-home-1

Each row's values (sizes, colours, gaps, tokens, files and lines) live in design.md: the row's line of the `## Rows` table and the row's own section with its builder table. The acceptance criteria name what the user sees and the check that proves it. Where this spec and design.md disagree on a value, design.md holds and this spec is corrected with a version bump.

### judge-built-1

The rows whose design.md status says the owner judges the built result: 2, 7, 8, 11, 12, 14, 17 and 18. They ship as the designer recommended; the owner judges each one live. A rejection reopens that row alone, with a new status in design.md and one builder round.

### pressed-cue-1

The ToggleGroup pressed item (row 12) has no colour cue at 3:1: the chip `surface.card` on the track `surface.sunken` is 1.1 to 1.7, and the pressed ink `text.primary` against the other ink `text.secondary` is 1.5 to 3.0, across the six profile and mode cells (design.md, section "Without the ring, chip and ink are weak in lightness"). WCAG 1.4.11 asks 3:1 for a state cue. The cue other than colour is the filled chip and, in light mode, its lift; assistive tech reads `aria-checked` (single) or `aria-pressed` (multiple). The owner kept today's chip and colours in comment 10404; the main session reported the cue under 3:1 to the owner on 2026-10-31 (ORV-192 comment 10405), and the owner judges the built result live under judge-built-1 (design.md line 495 raised it as a finding). No contrast pair is added for the chip (design.md builder row 12.8).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

1. Logo clearance in px (row 5). Inputs: the clearance 14.48, 13.48 and 12.48 drawing units of the master, 24 and 16 forms at radius 19 (design.md row 5); the mark's `viewBox` `[0, 0, 150, 150]` (`geometry.ts` line 77); heights 32, 24 and 16. Expected output, rounded to two decimals half up: `3.09 2.16 1.33`.

   ```bash
   node -e 'const r=x=>Math.round(x*100)/100;console.log([[14.48,32],[13.48,24],[12.48,16]].map(([u,h])=>r(u*h/150)).join(" "))'
   ```

2. Kbd cap of one glyph (row 8). Inputs: `type.label.sm` 13 px at line height 1.5 (19.5 px, design.md row 17 table, Tooltip title 13 / 19.5); the minimum width 2.25em (design.md row 8); a 1 px border top and bottom. Expected output, width rounded to one decimal half up, ratio to two decimals: `29.3 21.5 1.36`, which clears the play's bound of 1.3.

   ```bash
   node -e 'const em=13,w=2.25*em,h=em*1.5+2;console.log(Math.round(w*10)/10,h,Math.round(w/h*100)/100)'
   ```

3. Toast centring (row 11). Inputs: the 32 px close button, the title line 14 px at 1.6 (22.4 px) and the 20 px icon (design.md row 11). Expected output, rounded to one decimal: `4.8 6`, the content offset and the icon offset in px.

   ```bash
   node -e 'const r=x=>Math.round(x*10)/10;console.log(r((32-14*1.6)/2),r((32-20)/2))'
   ```

4. Body line heights at 1.7 (row 18). Inputs: body sizes 13, 14, 16 and 20 px (design.md row 18). Expected output, rounded to one decimal: `22.1 23.8 27.2 34`.

   ```bash
   node -e 'const r=x=>Math.round(x*10)/10;console.log([13,14,16,20].map(s=>r(s*1.7)).join(" "))'
   ```

5. Toggle lift alpha (row 12). Inputs: `opacity.scrim` 0.48 and the factor 50 percent (design.md section "Recommended" of row 12, line 493). Expected output, no rounding: `0.24`.

   ```bash
   node -e 'console.log(0.48*0.5)'
   ```

## Out of scope

Follow-ups the designer recorded, none changed in this card:

- Wrapped Thai labels and headings: `type.label.md` (14 / 1.6) wraps in the toast title at 360 and in the prompt question with 0.5 px between lines, and `type.heading.sm` (20 / 1.5) wraps in dialog and sheet titles at 360 with 0 px. Raising them changes control and header heights across the system (design.md line 1079).
- One-line labels with an ellipsis that clip about 1 px at their own line box, such as ฟื้ or ปั้ in `.ds-shelf__name`, the task bar and group titles; one fix for every route of the class, a separate card (design.md line 1078).
- The Select menu that runs past the viewport at 360 (the designer's report to the main session; no line of design.md records it).
- Dark mode Dialog: the selected input text is hard to read on its selection highlight (design.md line 214).
- The ToggleGroup pressed cue of `pressed-cue-1`: no fix in this card.

Also out of scope: `apps/web`, a component public API change, and visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. Lane. Options: (a) L, because the card changes the semantic token contract (row 9 focus tokens, row 13 `type.body.xs`, row 17 `text.on-inverse-secondary`), a risk flag; (b) M. Default: (a); the main session confirms it in Jira.
2. The follow-ups of Out of scope. Options: (a) open them now; (b) leave them to the main session at G3, as one combined card for the small ones (owner, 2026-10-31). Default: (b).

## Depends on

- `docs/specs/ORV-192/design.md`: the `## Rows` table, rows 1 to 19 and their sections, including "Every focusable control", "Without the ring, chip and ink are weak in lightness", "Out of scope, measured" and "Screens to check in visual QA (row 19)".
- `DESIGN.md` §3.1 (the `text.on-inverse-secondary` row) and §4 (the row 17 and row 18 rules).
- `docs/knowledge/design/K-0107-synthesis-title-supporting-text-and-paragraph-line-height.md` and K-0096 to K-0106: the research behind rows 17 and 18.
- `docs/specs/ORV-189/spec.md` `matrix-keep-1`: the Button Matrix that row 10 asserts.
- ADR 0003 (`docs/adr/0003-shadcn-behavior-own-visual-layer.md`): Storybook is the visual half of the catalog.
- `.claude/rules/testing.md`: a play for a visual criterion goes through `visual-asserts.ts`, and a test fails on the real defect.

## Changelog

- v1.0 (2026-10-31): first version, from design.md rows 1 to 18 and the owner comments it cites (10378, 10388, 10391 to 10404; no Jira tool in this role, so the comment text is as design.md quotes it). The `## Rows per PR` section is left for the main session to add once the PR exists. Downstream to review: the qa envelope and the G3 packet for ORV-192 (they cite criteria 1 to 18).
- v1.1 (2026-10-31): adds criterion 19 from design.md row 19 (sign-off ORV-192-signoff-2 finding F3, the display stack clearance only), for review finding R4-1 of ORV-192-review-4, and a row 19 line in the design.md `## Rows` index. Row 19's F1 (Toast root focus) and F2 (side sheet edge) stay under criterion 9. The title, the rows by kind (a row 19 kind: judged by the designer's visual sign-off, not under `judge-built-1`, because the owner approved the built rows in comment 10406 before row 19 existed) and Depends on (rows 1 to 19 and "Screens to check in visual QA (row 19)") now count 19 rows. Downstream to review: the qa envelope and the G3 packet for ORV-192 (they now cite criteria 1 to 19).
