---
issue: ORV-252 (https://tpetkaew.atlassian.net/browse/ORV-252)
spec: docs/specs/ORV-252/spec.md v1.3
parent design: docs/specs/ORV-225/design.md version 2
task: ORV-252-design-1
version: 1
---

# ORV-252 design: the skip bar fills the header

This file settles findings F1 and F2 of ORV-252-signoff-1 on head 1b467ca. Everything else in `docs/specs/ORV-225/design.md` stands. Where the two differ on the skip bar, this file wins. That file is not edited here (see "What it amends").

The finding is also against the spec (L-0019): row 22 of the parent design prescribes the 4 px inset, and the `expectSkipLink` play asserts it.

## What was wrong

- **F1.** The 4 px inset makes the bar 24 tall in a 32 header, so the logo, the links and the action show around it. In the shell form the bar is 40 tall in 48, and the action shows 4 px below it.
- **F2.** In the 24 px bar the Thai upper marks rise 0.75 px above the bar's top edge, into the 1 px focus line.

## Flow

Unchanged from the parent's Flow step 3, with the look made exact:

1. The first Tab puts focus on the skip link. The bar fills the header and the row goes out of view. Nothing moves, because the row keeps its place.
2. Enter moves focus to the target (row 38).
3. A second Tab, in place of Enter, takes the bar away, brings the row back and lands on the row's first stop. Shift and Tab from there brings the bar back.

## Source intent

- The bar is one thing with one job while it has focus, so nothing else shows (the parent's amendment 9: "an opaque bar covers the header").
- Focus keeps its own shape, a line with a halo, drawn inside the box (`.claude/rules/design-system.md`, the parent's "Source intent"). A bar at inset 0 has no room around it for the global outer form, and the shell's header runs to the viewport edge.
- Thai sets the size: the marks need the header's full height, not a smaller bar inside it.

## Rows for the builder

Sizes are CSS px under neutral. The bar's height is the header's, so a profile or a form moves it with no rule of its own.

<!-- prettier-ignore -->
| # | Finding | Amends | Target | Tokens | CSS | Play proof |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | F1, F2 | Parent rules row 22 ("inset 4"), recipe block line 384 | The bar's four edges on the header's: 32 tall in the story form, 48 in the shell form. Label still 16 inside the bar, radius still `shape.media.radius` | None read. `space.inline.sm` leaves this rule | `recipes.css` line 6159, `inset: 0;` | The four `near` reads of `expectSkipLink`, edit A |
| 2 | F1 | Parent rules row 22 ("Focus comes from the global `:focus-visible`"), "States" line 816 | 1 px line, offset -1 px, 4 px inset halo: the form of `nav-focus-1` | `focus.ring`, `--_focus-shadow-inset` | Three declarations in `.ds-top-nav__skip:focus`, lines 6178 to 6184 | `expectInsetFocus(skip)`, edit B |
| 3 | F1 | New. Parent rules row 22 has no such rule | While the bar has focus every row of the header paints nothing, so no corner of a row shows past the bar's radius, under any profile or `actions` content. The row keeps its place and its Tab stops | None | New rule after line 6184, `.ds-top-nav__skip:focus ~ .ds-top-nav__row` | The row read and the next Tab step, edits C and E |
| 4 | F2 | Nothing new: follows from row 1 | Thai ink at least 2 px under the bar's top edge, which is the 1 px line and 1 px clear. Measured 3.25 | None | None | The ink read, edit D |

Parent rules row 39 keeps its words and reads the amended row 22: the bar covers the first row on every route. Its proof stays row 70.

No token, prop, string or catalog line changes. `pairs.ts` stays at nine: `focus.ring` on `surface.card` is already checked under every set in both modes (`packages/design-system/src/tokens/contrast-pairs.ts` lines 105 to 108), so the "nine pairs" test at `recipes.test.ts` line 486 and spec row 39 stand. `top-navigation.yaml` line 46 ("an opaque bar over the row") stays true.

## The exact CSS

`packages/design-system/src/recipes/recipes.css`, with line numbers at 1b467ca.

Line 6159:

```css
inset: 0;
```

Lines 6178 to 6184 become this, and the new rule follows:

```css
.ds-top-nav__skip:focus {
  clip-path: none;
  inline-size: auto;
  block-size: auto;
  padding-inline: var(--ds-space-inset-md);
  outline: 1px solid var(--ds-focus-ring);
  outline-offset: -1px;
  box-shadow: var(--_focus-shadow-inset);
  overflow: visible;
}
/* Opacity, not visibility: the row keeps its Tab stops, and the next Tab must reach them. */
.ds-top-nav__skip:focus ~ .ds-top-nav__row {
  opacity: 0;
}
```

Lines 6154 to 6156, the comment: add that the bar fills the header and draws its focus inside, because it has no room around it. The rest stays, since the note about `:not(:focus)` still holds.

The `:focus` rule (0,2,0) beats the global `:focus-visible` (0,1,0) in `orivilo.css` line 74 wherever it sits in the file. `recipes.test.ts` passes each new value: `inset: 0` is at `recipes.css` line 1235 already, and `box-shadow` reads a `var()`.

## The story checks that change

`packages/design-system/src/components/top-navigation/TopNavigation.stories.tsx`, `expectSkipLink`, lines 757 to 779, with line numbers at 1b467ca. Both `SkipLink` and `SkipLinkEn` run it.

**Edit A, lines 766 to 770.** Delete `gap` at line 766. The four reads become:

```ts
near(bar.left, box.left, "the bar's start edge");
near(bar.right, box.right, "the bar's end edge");
near(bar.top, box.top, "the bar's top edge");
near(bar.bottom, box.bottom, "the bar's bottom edge");
```

Lines 771 to 774, the fill, the opaque check and the ink colour, stay.

**Edit B, after line 774.** `await expectInsetFocus(skip);`, the helper at line 364, as it stands.

**Edit C, after edit B.**

```ts
const row = part(header, "row");
await expect(getComputedStyle(row).opacity, "the row paints nothing beside the bar").toBe("0");
```

This is a computed read on purpose. The test project runs under neutral, where inset 0 alone already shows no pixel of the row (table below), so a pixel read there stays green with row 3 removed. The pixels were read here under all four profiles, and sign-off reads them again.

**Edit D, after edit C.** `measureInkCentre` comes from `visual-asserts.ts`, in the import at lines 7 to 15.

```ts
if (inVitest) {
  // Line and halo off for the read, so the first ink is the label's.
  skip.style.outline = "none";
  skip.style.boxShadow = "none";
  try {
    const [label] = await measureInkCentre(header, [skip]);
    await expect(label?.ink.inkTop, "the marks clear the focus line").toBeGreaterThanOrEqual(2);
  } finally {
    skip.style.outline = "";
    skip.style.boxShadow = "";
  }
}
```

The fixture's "เนื้" is a stacked mark, so the Thai story reads the case of F2 with no extra sample. `expectInkClearsAbove` does not fit: it reads ink under another element.

**Edit E, after line 778, the end of the function.**

```ts
await userEvent.tab();
await expect(skip).not.toHaveFocus();
await expect(row.contains(document.activeElement), "the next Tab lands in the row").toBe(true);
await expect(getComputedStyle(row).opacity, "the row is back").toBe("1");
```

The doc comment at line 756 adds "with nothing showing beside it". The other lines of the function stay, and the `id` and `tabIndex` reads stay where they are.

The builder shows each of these red, then restores it, one `verified` row each (`.claude/rules/testing.md`):

<!-- prettier-ignore -->
| Mutant | Goes red on |
| --- | --- |
| Line 6159 back to `var(--ds-space-inline-sm)` | Edit A and edit D |
| `outline-offset: -1px` removed | Edit B |
| `box-shadow` line removed | Edit B |
| The `~` rule removed | Edit C |
| The `~` rule with `visibility: hidden` in place of `opacity: 0` | Edit C and edit E |

Edit D has not been run through Vitest here. The numbers below come from a rig that reads pixels the same way on the built story. If `measureInkCentre` cannot read the focused bar, that goes back to the designer. The check is not dropped.

## Why this form

The sign-off proposed inset 0 with the inset line, and it read boxes, under neutral and friendly. Reading pixels under every profile showed that the proposal alone still leaves a row's corner past the bar's radius in the story form, because a row with no padding puts the action in the header's end corner. Row 3 is the change.

Each cell compares a shot of the focused bar with a shot of the same page with the row hidden, at DPR 4, so any differing pixel is the row showing. Th, 360 and 1440, light and dark. Differing pixels and largest colour step per cell:

<!-- prettier-ignore -->
| CSS | neutral, orivilo | friendly | professional |
| --- | --- | --- | --- |
| As built, the control (neutral light 1440 only) | 10230 px, step 170 | Not read | Not read |
| Sign-off proposal, story form | 0 | 161 to 168 px, step 21 to 27 | 263 to 264 px, step 113 to 120 |
| Sign-off proposal, shell form | 0 | 0 | 0 |
| Rows 1 to 3, story form | 0 | 0 | 0 |
| Rows 1 to 3, shell form | 0 | 0 | 0 |

Forms considered:

<!-- prettier-ignore -->
| Form | What it does | Verdict |
| --- | --- | --- |
| Inset 4, as built | F1 and F2 | Rejected by the sign-off |
| Inset 0 alone | The Button's 6 px corner sits outside the bar's 8 px corner under professional, a grey sliver at the end corner. Under friendly the two 16 px curves meet and leave a faint fringe | Not enough. `corner-signoff-professional-light.png` |
| Radius 0 on the bar | Would cover every corner, but needs a raw radius, which `recipes.test.ts` rejects as "radius literal", and no token holds 0 | Rejected, not rendered |
| Radius from the smaller of `shape.media.radius` and `shape.control.radius` | Puts two equal curves together under every profile, the fringe friendly already shows, and answers a Button only, not what a caller puts in `actions` | Rejected, not rendered |
| `visibility: hidden` on the row | A hidden row has no Tab stops, so the next Tab would leave the header. This breaks Flow step 3 | Rejected, not rendered |
| `opacity: 0` on the row, by the sibling selector | 0 px under all four profiles, and the Tab stops stay. The skip link is the header's first child, so `~` reaches both rows and needs no `:has()` | Chosen |

With the row out of view, the label has nothing to line up with. So its 16 px start, against the logo's 24 in the shell form, and its centre, 8 px above the row's in that form, need no rule.

## States

Selected and focused are different states, and the bar has no selected state.

<!-- prettier-ignore -->
| State | The skip bar |
| --- | --- |
| Default | Out of view: 1 px, clipped. The row shows |
| Hover | None of its own: the link can only be hovered while it has focus, and it stays as it is |
| Focus | Fills the header, card ground, primary ink, inset line and halo. The row paints nothing |
| Disabled | Not built: a skip link is either rendered or not |
| Loading | None |
| Empty | No `skipHref` or `skipLabel`: no node, and the `~` rule has nothing to match |
| Error | None |
| Success | None |

## Content that decides the shape

<!-- prettier-ignore -->
| Case | What holds it | Read |
| --- | --- | --- |
| Line count | One, always: `white-space: nowrap`. Only the bar's height changes, with the header's | 32 and 48 in all 48 cells |
| Thai marks above | Ink 3.25 under the top edge, so 2.25 clear of the line. Its top 0.75 sits on the soft halo, as a 32 px `sm` item's does under `nav-focus-1` | Neutral, friendly, professional, the fixture and "ฟื้ปั้ปี๊ฟื้ ปิ่นโต้ โลโก้" |
| Thai marks below | Ink 6.25 over the bottom edge | The same three, "ฎีกา ฐาน ปู่ ญาติ สุขุม ฤๅษี" |
| Latin twin | Same bar, no marks | `sheet-skip-story-360.png`, English cells |
| Two rows | `~` reaches both rows, and the bar takes the header's full height | Read from the CSS, not rendered: no story has both, and no route has two rows |
| 360 px | The opener is the row's first stop, and it stays reachable | Next Tab at 360 lands on the button "เปิดเมนูหลัก" |
| Reduced motion | Nothing to reduce: neither the bar nor the row has a transition | Read from the CSS |

## What it amends

`docs/specs/ORV-225/design.md` is not edited by this task. These lines follow when the main session updates it:

<!-- prettier-ignore -->
| Line | Now | Becomes |
| --- | --- | --- |
| 110, rules row 22 | "inset 4"; `space.inline.sm`; "Focus comes from the global `:focus-visible`" | Rows 1 to 3 here |
| 384, recipe block | `inset: var(--ds-space-inline-sm);` | `inset: 0;`, with the `:focus` declarations and the `~` rule. The block's `:not(:focus)` form is already replaced on the head |
| 816, "States" | "Skip bar with the global focus form" | "Skip bar with the inset focus form" |
| 866, sign-off list | "the skip bar with nothing showing beside it" | Stands, and reads under professional too |

## Screens for visual QA

Everything sits under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/`. The scratchpad is temporary, so the sign-off shoots again from the built stories. The CSS is `rig/proposal.css` there, injected into the Storybook build of head 1b467ca. Each sheet holds neutral, friendly and professional, light and dark, Thai and English.

<!-- prettier-ignore -->
| Sheet | Shows |
| --- | --- |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/sheet-skip-story-360.png | The story form at 360 |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/sheet-skip-story-1440.png | The story form at 1440 |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/sheet-skip-shell-360.png | The shell form at 360 |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/sheet-skip-shell-1440.png | The shell form at 1440 |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/shots/corner-signoff-professional-light.png | The sign-off proposal: the Button's corner past the bar |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/shots/corner-changed-professional-light.png | Rows 1 to 3: the same corner, clean |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/shots/corner-signoff-professional-dark.png | The sign-off proposal, dark |
| /private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-design-1/shots/corner-changed-professional-dark.png | Rows 1 to 3, dark |

The sign-off's four proposal sheets, `sheet-skip-proposal-1440.png`, `sheet-skip-proposal-360.png`, `sheet-skip-proposal-shell-1440.png` and `sheet-skip-proposal-shell-360.png` under `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-252-signoff-1/`, show the same bar under neutral and friendly, before row 3.

Sign-off of this rework shoots `SkipLink` and `SkipLinkEn` from the build, in the story form and the shell form, at 360 and 1440, under neutral, friendly and professional, light and dark, and checks: nothing from the row beside the bar, the end corners above all; one line and halo, whole, on all four sides; Thai marks clear of the line; the row back on the next Tab.

Limits of this proof. The rules were injected after the page loaded, so they did not pass through the pseudo-states addon, which rewrites `:focus` selectors in the real stylesheet (the comment at `recipes.css` line 6154). Edit C proves the `~` rule on the real file. The shell form was imitated with `.ds-top-nav__row{padding:16px 24px 0}` inside Storybook's padded page, so the bar at a real viewport edge was not shot. Forced colours were not rendered.

## Seen but out of scope

- A `skipLabel` wider than the bar runs past its end and scrolls the page sideways: 455 px of label in a 328 px bar at 360, document 471 wide, `shots/long-label-360.png`. These rows leave `white-space: nowrap` and `overflow: visible` as they are. The only planned label, `app.skip`, fits at every width shot. A follow-up, if the prop is ever given longer copy.
- S1 to S3 of the sign-off stay follow-ups.
