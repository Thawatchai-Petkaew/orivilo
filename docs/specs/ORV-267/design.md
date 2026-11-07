# ORV-267: design notes

Design decisions for ORV-267 (spec: `docs/specs/ORV-267/spec.md`). Each row is a numbered change to the look. The builder makes it exactly as written. The designer showed it rendered before any builder envelope (L-0017). The rows settle finding SIGNOFF-267-1 of the visual sign-off `ORV-267-signoff-1` on PR 204 at head `470e5e1`.

## Rows

| #   | Target                                                                                               | Change                                                                                                                                                                                                                                                                                                                                   | Source                                                                                                                     | Play that proves it                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `packages/design-system/src/examples/brand-report.tsx`, function `ReadingCard`, the `li` at line 122 | Add `bg-surface-card` to the class list, so it reads `flex min-w-0 flex-1 basis-56 flex-col gap-2 rounded-container border border-border-card bg-surface-card p-3`. Keep `border-border-card`, `rounded-container` and `p-3`. Change nothing else: no other class, no prop, no string, no token, no change to the `ul` or the axis `div` | SIGNOFF-267-1; DESIGN.md §2 (airy bento: borderless white cards on the warm canvas), §3.1 `surface.card` and `border.card` | In `brand-report.stories.tsx`, story `Personality`, in the existing play after the destructure at line 485: for each of `high`, `low` and `below`, `await expect(getComputedStyle(card).backgroundColor).not.toBe("rgba(0, 0, 0, 0)")` |

## Row 1: the reading card has a ground in both modes

### What was wrong

The `li` of `ReadingCard` takes `border.card` but not `surface.card`. `border.card` is transparent in light, because in this system the white card makes its own edge. So in light the card has no fill and no edge. Its text still sits 13 px inside the column (12 px `p-3` plus the 1 px border): 37 px against 24 px for the h2 and the axis label at 360, and 373 against 360 at 1440. Nothing on screen explains that indent. The two opposite premium leans read as two loose columns of text, not as two equal cards. In dark the `border.card` edge (gray.700 #2B2A36) shows, so the cards had a shape in dark only.

Measured at `470e5e1` (`ORV-267-signoff-1`, `node scratchpad/probe.cjs`): the `li` `background-color` is `rgba(0, 0, 0, 0)` in all 8 variants (360 and 1440, th and en, light and dark). The `border-top-color` is `rgba(0, 0, 0, 0)` in light and `rgb(43, 42, 54)` in dark.

Before, light: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/pers360thl-b.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/pers1440thl.png`. Before, dark: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/pers360thd-b.png`, `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/pers1440end.png`.

### The token

| Token                                | Light           | Dark             | Utility                     | CSS variable        |
| ------------------------------------ | --------------- | ---------------- | --------------------------- | ------------------- |
| `surface.card`                       | white #FFFFFF   | gray.800 #1E1D26 | `bg-surface-card`           | `--ds-surface-card` |
| `border.card`                        | transparent     | gray.700 #2B2A36 | `border-border-card` (kept) |                     |
| `surface.canvas` (the ground behind) | gray.50 #F4F4F0 | gray.900 #16151D | (not touched)               |                     |

The token, the utility and the variable already exist (`packages/design-system/src/tokens/generated.css` line 1792 maps `--color-surface-card` to `--ds-surface-card`), and `Resizable.stories.tsx` line 30 already uses the same `bg-surface-card` plus `border-border-card` pair. No new token, prop or string.

### Options weighed

- **Fill the card with `surface.card` (chosen).** This is the system's own card: white on the warm canvas in light, gray.800 inside the subtle gray.700 edge in dark. The card's outer edge now sits on the column's start edge (the h2 and the axis label), so the 13 px text inset reads as card padding, and the page has one start edge.
- **Drop the card (no border, no padding).** The text would sit on the start edge, but the two leans of one axis would no longer read as two separate, comparable readings, and the below-floor reading would no longer stand apart from the leans. Rejected.
- **Give the card an edge in light (`border.subtle`).** This goes against §3.1 (`border.card` is none in light) and the bento rule of §2. It adds a second card language to one screen. Rejected.

### Contrast

Nothing new to check. Every text in the card sits on `surface.card`, and the pairs are already declared there: `text.primary` (the quote and the below-floor line), and `text.secondary` through `FIELD_NOTE`, with the same value as `text.tertiary`, whose declared pair is `surface.card` at 4.5. The `Badge` keeps its own fill. `pnpm contrast` does not change.

### States

The card is static. Nothing in it is focusable: `Page` is a `bdi` and the source is plain text. So it has one state, default, in two forms. The lean form shows the level badge, quote, source, rules and confidence, and the hypothesis line when the reading is a working assumption. The below-floor form adds the reason line on top. Both forms take the same ground. There is no hover, focus, loading, empty or error form of the card itself. The empty axis shows `noSignal` as text, not as a card, and that does not change. Reduced motion: the card has no motion.

### Rendered, with the change injected

`ORV-267-signoff-1` rendered the change by injection (`node scratchpad/inject.cjs`, `page.addStyleTag` with `[data-report] li.rounded-container{background-color:var(--ds-surface-card)}` on the `Personality` story). That is the same variable `bg-surface-card` resolves to. Opened and checked in this task:

- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/proposed-card-fill__360__th__light.png`: white cards on the warm canvas. The card's left edge lines up with the h2 "คำในหน้านี้สื่อถึงอะไร" and the axis labels, with the text 12 px inside. The warm card, the two premium leans (stacked at 360) and the below-floor card each have one clear shape. The hypothesis line (two lines) and the below-floor reason line sit inside their cards. No Thai mark is clipped (ที่มา, ความมั่นใจ, ยังไม่แน่ชัดพอจะนำไปใช้).
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/proposed-card-fill__360__th__dark.png`: the shapes match light. The gray.800 fill sits inside the gray.700 edge on the gray.900 canvas, and the start edge and text inset are the same as light.
- `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-267-signoff-1/crops/proposed-card-fill__1440__en__light.png`: the two premium leans sit side by side at the same height. "little" is one line longer (the hypothesis line), and "very" stretches to match it through the flex row, so the shape holds with unequal line counts. The below-floor card runs the full width below them, and the warm card fills its row. The card edge is on the h2's start edge.

The shape holds at every line count the content can reach. The card is a `flex-col` with a fill, so extra lines (a long source path that wraps, the hypothesis line, the below-floor reason) only make it taller. Cards that share a row stretch to one height, because `ul` is `flex flex-wrap` and each `li` is `flex-1`. A lone card fills its row. The 1440 dark render was not shot again. The CSS is the same as 360 dark and the column width does not change the fill, and the dark shape was already a card before the change (`pers1440end.png`).

### Screens to check in visual QA

For the `Personality` and `Incomplete` stories of `Examples/Application: Brand report`, and for `/read` with a report, at 360 and 1440, th and en, light and dark:

1. Every reading card has a visible ground in light: white on the warm canvas.
2. The card's outer edge is on the start edge of the h2 and the axis label, with the text 13 px inside (12 px padding plus the 1 px border).
3. The two premium leans at 1440 are side by side at one height. At 360 they stack, each with its own shape.
4. In dark the gray.800 fill shows inside the gray.700 edge.
5. No Thai mark is clipped at a card edge, and no card makes the page scroll sideways.

## Out of scope

The other findings of `ORV-267-signoff-1` are Suggestions. They stay follow-ups, and this file does not settle them:

- SIGNOFF-267-2: the two empty live containers add two 24 px gaps, so the form sits 72 px from the first notice or report.
- SIGNOFF-267-3: on `/read` the page's `px-4` and the screen's `p-6` give two start edges.
- SIGNOFF-267-4: the English axis names are lower case as h3 headings.

## Changelog

- v1.0 (2026-11-07): row 1 settles SIGNOFF-267-1, the reading card takes `surface.card`. Task `ORV-267-design-1`.
