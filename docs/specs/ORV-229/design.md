---
issue: ORV-229
spec: docs/specs/ORV-229/spec.md v1.1
task: ORV-229-design-1
date: 2026-11-06
---

# ORV-229 design: Breadcrumb and Pagination (base)

The look of the trail and the page row, the answers to open questions 1 to 11, the proof of the colour pairs, the Copy table read aloud, and one row of CSS and markup per rule for the builder. Every value is an existing `--ds-*` or `--cmp-*` property; this design adds no token.

All eleven open questions stay on their defaults. The render still found five things the spec needs changed: one Thai name, the focus shape of a crumb, the height of a wrapped line, the ink and spacing of the ellipsis, and the ink of a disabled chevron. Those are amendments A1 to A5; A6 counts the pairs, and A7 writes down a glyph size and a wrap the spec leaves unsaid. Each has its old and new text, and the tables below assume they are taken. No colour pair is refused. Four pairs are added, so the count goes from twelve to sixteen.

## Flow

1. A person lands on a page inside a project. The trail shows where they are: links in quiet ink, slashes between them, and the page they are on in heavier ink, last, not a link.
2. With more crumbs than `maxVisible`, the middle ones hide behind an ellipsis button, in the same quiet ink as the links.
3. The person presses the ellipsis. The hidden crumbs appear in place, the button goes, and focus lands on the first crumb revealed (`crumb-expand-1`). The trail stays open until it unmounts.
4. On a long list, the person picks a number or a chevron. Each is a link, so the page loads and the row redraws around the new page, in the same width (`page-range-1`).
5. On the first page Previous, and on the last page Next, is greyed out and stays in its place.
6. In a frame under 480 px the numbers go, and the row reads as a chevron, "หน้า 5 จาก 12", a chevron, with the chevrons held at the two ends.

## Answers to the open questions

<!-- prettier-ignore -->
| # | Question | Answer | Why |
| --- | --- | --- | --- |
| 1 | The current crumb | (a), confirmed: a non-link with `aria-current="page"` | The page goes nowhere, so it costs no Tab stop. It reads as "here" through weight 500 and darker ink with no underline on hover. Ink alone would not hold: `nav-item.fg-active` against `nav-item.fg` is only 1.5 under Professional and Friendly dark, so weight and behaviour carry it, as `crumb-look-1` says |
| 2 | The current page's look | (a), confirmed: `--cmp-nav-item-*-active` plus the `border.strong` edge | It reads as "here" on the canvas and on a card, in both modes, and it never reads as a selected row. On a card the fill vanishes and the edge alone holds (`pagination-neutral-light-1440-th.png`, "On a card"). One thing to watch: under Professional light `focus.ring` (#19315E) and `border.strong` (#1B1E23) are close, so a focused number and the current number differ by the halo, not by the line. That is the shape rule of AGENTS.md doing its work, and it is listed for visual QA. No DESIGN.md section 7 line is needed |
| 3 | The ink of a crumb link and a page number | (a), confirmed: `--cmp-nav-item-fg` | A real choice: DESIGN.md section 2 lets violet do the work of links. But section 3.1 gives `text.link` to links in running text, and a trail is wayfinding. Section 2 also says to spend boldness once and leave the rest ink and canvas: six violet words at the top of a screen, or a violet page row beside the one primary action, would spend it on the quietest part of the page. The lowest pair is 5.1 |
| 4 | Pagination items | (a), confirmed: links through a URL | A page is a place you can link to and go back to, and the row looks the same either way. A screen with no URL reopens this with its own story |
| 5 | Collapse, and what the ellipsis opens | (a), confirmed: a count prop, expanding in place | Real links stay real, and no portal, menu or Drawer comes in. Open, a six-crumb Thai trail takes four lines at 360 px (`breadcrumb-neutral-light-360-th.png`, "Expanded"); that is a cost a person chose by pressing the button, and it reads cleanly with one start edge |
| 6 | The missing glyphs | (a), confirmed: Lucide `Ellipsis`, `ChevronLeft`, `ChevronRight` | Rendered at 16 px and stroke 2.4 they match the digits' weight. Row D11 sizes them, since an `iconOnly` child otherwise draws at Lucide's 24 px default |
| 7 | The separator | (a), confirmed: a slash with spaces | DESIGN.md section 10 names it, and a slash stays even in Thai and Latin (`breadcrumb-neutral-light-1440-th.png`, `breadcrumb-neutral-light-1440-en.png`). When a trail wraps, the slash ends the line and the next line starts on the crumb, so every line keeps one start edge |
| 8 | How the work splits | (a), confirmed: two PRs, Breadcrumb first | The two share no look beyond the nav item tokens. Amendments A2 to A5 add about 20 lines across the two PRs |
| 9 | A long crumb | (a), confirmed: cut at the end of its line | `fixtures.longThai` is 513 px whole against 347 px of room in a 360 px frame, so wrapped it takes two lines, and a Thai name with no spaces breaks mid-name. Cut, every line keeps its one height (D2) and the slash stays beside its crumb. The cost is real: the rest of a cut name is on no screen, and a Tooltip is out of scope. The page's own heading is where a cut current crumb reads whole |
| 10 | Previous and Next at the ends | (a), confirmed, with one ink change (A5) | Disabled in place holds the row still (40 px measured both ways). But `button.ghost.fg-disabled` is `text.secondary`, the same ink as a live page number, so a disabled chevron reads as live. Compare the last row of each half of `study-spec-against-proposal-light.png` |
| 11 | The small-frame form, and words on Previous and Next | (a), confirmed: the status replaces the numbers, chevrons alone at every width | Words were measured: at `button` md with the chevron, "หน้าก่อนหน้า" 133.1 px, "หน้าถัดไป" 114.4 px, "Previous page" 147.9 px, "Next page" 122.6 px. The row would be 559.5 px in Thai and 582.5 px in English, past the 480 px edge, and it would differ per locale. Chevrons alone stay at W3's 392 px, measured |

## Colour pairs

Each pair resolved from the token source through `TokenSet` and `contrastRatio`, the way `recipes.test.ts` does, under all four sets of `CONTRAST_SETS` in both modes. `orivilo` equals neutral in every cell, so it has no column of its own. N is neutral, P professional, F friendly, L light, D dark. Every pair passes; none is refused.

<!-- prettier-ignore -->
| # | Recipe, slot | Foreground on ground | Floor | N L | N D | P L | P D | F L | F D | Lowest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | breadcrumb, link on canvas | `nav-item.fg` on `ds:surface.canvas` | 4.5 | 6.1 | 7.6 | 5.1 | 9.3 | 5.1 | 9.2 | 5.1 |
| 2 | breadcrumb, link on card | `nav-item.fg` on `ds:surface.card` | 4.5 | 6.8 | 7.0 | 5.5 | 6.8 | 5.5 | 6.8 | 5.5 |
| 3 | breadcrumb, link hover on canvas | `nav-item.fg-hover` on `ds:surface.canvas` | 4.5 | 16.4 | 16.0 | 15.6 | 14.0 | 15.5 | 14.2 | 14.0 |
| 4 | breadcrumb, link hover on card | `nav-item.fg-hover` on `ds:surface.card` | 4.5 | 18.1 | 14.7 | 16.7 | 10.2 | 16.7 | 10.4 | 10.2 |
| 5 | breadcrumb, current on canvas | `nav-item.fg-active` on `ds:surface.canvas` | 4.5 | 16.4 | 16.0 | 15.6 | 14.0 | 15.5 | 14.2 | 14.0 |
| 6 | breadcrumb, current on card | `nav-item.fg-active` on `ds:surface.card` | 4.5 | 18.1 | 14.7 | 16.7 | 10.2 | 16.7 | 10.4 | 10.2 |
| 7 | pagination, link on canvas | `nav-item.fg` on `ds:surface.canvas` | 4.5 | 6.1 | 7.6 | 5.1 | 9.3 | 5.1 | 9.2 | 5.1 |
| 8 | pagination, link on card | `nav-item.fg` on `ds:surface.card` | 4.5 | 6.8 | 7.0 | 5.5 | 6.8 | 5.5 | 6.8 | 5.5 |
| 9 | pagination, link hover | `nav-item.fg-hover` on `nav-item.bg-hover` | 4.5 | 16.0 | 12.5 | 14.0 | 6.8 | 14.2 | 6.9 | 6.8 |
| 10 | pagination, current | `nav-item.fg-active` on `nav-item.bg-active` | 4.5 | 18.1 | 14.7 | 16.7 | 10.2 | 16.7 | 10.4 | 10.2 |
| 11 | pagination, current edge on canvas | `ds:border.strong` on `ds:surface.canvas` | 3 | 16.4 | 16.0 | 15.6 | 14.0 | 15.5 | 14.2 | 14.0 |
| 12 | pagination, current edge on card | `ds:border.strong` on `ds:surface.card` | 3 | 18.1 | 14.7 | 16.7 | 10.2 | 16.7 | 10.4 | 10.2 |
| 13 | breadcrumb, ellipsis hover (A4) | `nav-item.fg-hover` on `button.ghost.bg-hover` | 4.5 | 16.0 | 12.5 | 14.0 | 6.8 | 14.2 | 6.9 | 6.8 |
| 14 | breadcrumb, ellipsis press (A4) | `nav-item.fg-hover` on `button.ghost.bg-press` | 4.5 | 16.0 | 18.0 | 14.0 | 16.8 | 14.2 | 17.0 | 14.0 |
| 15 | pagination, disabled end on canvas (A5) | `ds:text.disabled` on `ds:surface.canvas` | 3 | 3.4 | 4.9 | 3.4 | 4.6 | 3.4 | 4.6 | 3.4 |
| 16 | pagination, disabled end on card (A5) | `ds:text.disabled` on `ds:surface.card` | 3 | 3.7 | 4.5 | 3.6 | 3.4 | 3.7 | 3.3 | 3.3 |

Rows 1 to 12 are the spec's twelve. The ellipsis at rest, the gap glyph and the status read `nav-item.fg`, so rows 1, 2, 7 and 8 cover them. Three readings that are not pairs:

- The hover ground on a card is 1.1 to 1.5, a tint too faint to carry hover alone. Ink changes with it (`fg` to `fg-hover`), which is what DESIGN.md section 7 asks for.
- `nav-item.fg-active` against `nav-item.fg` is 2.7 in neutral light and 1.5 under Professional and Friendly dark, so the current mark never rests on ink.
- `focus.ring`, already proven at its floor, is lowest under Friendly light: 3.4 on the canvas, 3.6 on a card.

## The Copy table, read aloud

Each string was read aloud in Thai and English, in the place it is heard or seen.

<!-- prettier-ignore -->
| Key | Thai | English | Verdict |
| --- | --- | --- | --- |
| `breadcrumb.label` | เส้นทางถึงหน้านี้ | Breadcrumb | Keep both. The Thai says what the trail is and reads as Thai. The English is the word a screen reader user already knows and the APG example's name (K-0334), and it is heard only beside the word "navigation". It is not on any screen, so "No jargon" does not bite |
| `breadcrumb.showAll` | แสดงเส้นทางทั้งหมด | Show the full path | Keep both. Says what happens, and both name the same "path" as the trail's Thai name |
| `breadcrumb.missing` | ไม่มีชื่อ | No name | Keep both. Plain, and it fits a place that has no name better than the catalog's other word, "ไม่มีข้อมูล", would |
| `pagination.label` | หน้าของรายการ | Pages | Change the Thai to เลขหน้า (A1). Heard as a landmark, "หน้าของรายการ" reads first as "the page of an item", a detail page, because รายการ means one entry as often as a list. It is a word-for-word build. "เลขหน้า" is the everyday noun for exactly what the region holds, and it still fits the narrow form, where the status says a page number. Keep the English |
| `pagination.page` | หน้า {page} | Page {page} | Keep both. The space stays (`nav-copy-1`) |
| `pagination.previous` | หน้าก่อนหน้า | Previous page | Keep both. หน้า twice sounds doubled when spelled out, yet it is the form Thai readers meet on the web, and it pairs with หน้าถัดไป |
| `pagination.next` | หน้าถัดไป | Next page | Keep both |
| `pagination.status` | หน้า {page} จาก {total} | Page {page} of {total} | Keep both. "หน้า 5 จาก 12" reads naturally without a closing classifier, and it stays short on a phone |

Fixture crumbs read as Thai. Crumb 6 ends in "การกระทำหลัก", which leans on the English "primary action", but it is the existing `DECISIONS[0].title` and not this story's copy.

## CSS and markup per rule

The proposal ran on this markup, which is what `crumb-markup-1`, `crumb-expand-1`, `page-markup-1` and `page-ends-1` write:

```text
nav.ds-breadcrumb[aria-label]
  ol.ds-breadcrumb__list
    li.ds-breadcrumb__item
      a.ds-breadcrumb__link[href]
      span.ds-breadcrumb__separator[aria-hidden=true]
    li.ds-breadcrumb__item
      button.ds-button[data-variant=ghost][data-size=sm][data-icon-only][aria-label] > svg
      span.ds-breadcrumb__separator[aria-hidden=true]
    li.ds-breadcrumb__item
      span.ds-breadcrumb__page[aria-current=page]

nav.ds-pagination[aria-label]
  ul.ds-pagination__list
    li > a.ds-button[data-variant=ghost][data-size=md][data-icon-only][aria-label][href] > svg
    li.ds-pagination__page > a.ds-pagination__link[href][aria-label][aria-current=page]
    li.ds-pagination__gap[aria-hidden=true] > svg
    li.ds-pagination__status
    li > button.ds-button[data-variant=ghost][data-size=md][data-icon-only][aria-label][disabled] > svg
```

Add the rows to `recipes.css` in this order: D17 has the specificity of D16 and must follow it. `crumb-missing-1` has no row of its own, since the word takes the look of the crumb it stands in for. Each `--ds-type-*-*` set below means the `font-family`, `font-size`, `line-height`, `font-weight` and `letter-spacing` properties of that role. Target sizes are measured from the render.

<!-- prettier-ignore -->
| # | Rule | Selector | CSS | Target | Proved by |
| --- | --- | --- | --- | --- | --- |
| D1 | `crumb-markup-1`, `crumb-look-1` | `.ds-breadcrumb__list` | `display: flex; flex-wrap: wrap; align-items: center; min-block-size: var(--ds-size-control-sm); margin: 0; padding: 0; list-style: none; color: var(--cmp-nav-item-fg);` and the `--ds-type-body-sm-*` set. The separator inherits the type from here | 32 px, computed `minHeight` `32px` | Row 1 |
| D2 | `crumb-cut-1`, A3 | `.ds-breadcrumb__item` | `display: flex; align-items: center; min-inline-size: 0; max-inline-size: 100%; min-block-size: var(--ds-size-control-sm);` | Every line 32 px, with or without the ellipsis | Row 1 with A3's check, row 15 |
| D3 | `crumb-cut-1` | `.ds-breadcrumb__link, .ds-breadcrumb__page` | `min-inline-size: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` and both selectors join the clip-box list in `recipes.css` (lines 4767 to 4782), which gives `padding-block: var(--ds-space-inline-sm); margin-block: calc(-1 * var(--ds-space-inline-sm));` | Box 31.8 px high in a 32 px line, so the link's hit area is 31.8 px, not 23.8 | Rows 15, 16 |
| D4 | `crumb-look-1`, A2 | `.ds-breadcrumb__link` | `padding-inline: var(--ds-space-inline-sm); margin-inline: calc(-1 * var(--ds-space-inline-sm)); color: var(--cmp-nav-item-fg); text-decoration: none; text-underline-offset: 0.2em;` | Ink stays where it was, the focus line clears the glyphs by 4 px, the first crumb's ink sits on the start edge | Row 4 with A2's check |
| D5 | `crumb-cut-1`, A2 | `.ds-breadcrumb__item:last-child > .ds-breadcrumb__link` | `margin-inline-end: 0;` | A last crumb that is a long link leaves the frame at 360, not 364, in Thai and English | Row 15 with A2's second trail |
| D6 | `crumb-look-1` | `.ds-breadcrumb__link:hover` | `color: var(--cmp-nav-item-fg-hover); text-decoration: underline;` No transition, so row 5 reads the end state at once | Ink and underline | Rows 5, 12 |
| D7 | `crumb-look-1`, A2 | `.ds-breadcrumb__link:focus-visible` | `border-radius: var(--cmp-nav-item-radius);` Line and halo stay global. The radius is on focus only: at rest a pill would round the box that clips the text, and cut glyph ink | A pill in neutral and Friendly, radius 6 in Professional | Row 4 with A2's check |
| D8 | `crumb-look-1`, `crumb-current-1` | `.ds-breadcrumb__page` | `color: var(--cmp-nav-item-fg-active);` and the `--ds-type-label-md-*` set. No padding-inline, no hover rule | Weight 500 against 400 | Row 2 |
| D9 | `crumb-markup-1` | `.ds-breadcrumb__separator` | `flex: none; margin-inline: var(--ds-space-inline-md); color: var(--cmp-nav-item-fg);` | 8 px from a crumb to its slash on each side | Row 3 for the markup, row 20's sign-off for the spacing |
| D10 | `crumb-expand-1`, A4 | `.ds-breadcrumb__item > .ds-button[data-variant="ghost"]` | `margin-inline: calc(-1 * var(--ds-space-inline-md)); color: var(--cmp-nav-item-fg);` and, on `:hover` and `:active`, `color: var(--cmp-nav-item-fg-hover);` | The dots sit 10 px from each slash, where the spec as written leaves 15 | Row 6 with A4's check |
| D11 | `nav-glyphs-1`, A7 | `.ds-breadcrumb .ds-button[data-icon-only] > svg, .ds-pagination .ds-button[data-icon-only] > svg, .ds-pagination__gap > svg` | `inline-size: var(--cmp-button-icon-size-md); block-size: var(--cmp-button-icon-size-md);` The form of `.ds-chat .ds-button[data-icon-only] > svg` (`recipes.css` line 4392) | 16 px, where `iconOnly` alone leaves Lucide's 24 | Rows 6, 22 with A7's check |
| D12 | `page-markup-1` | `.ds-pagination` | `display: block; container: ds-pagination / inline-size;` No overflow rule, so a halo is not clipped | Fills its parent | Row 39 |
| D13 | `page-markup-1`, W3, A7 | `.ds-pagination__list` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-inline-sm); margin: 0; padding: 0; list-style: none;` The row starts at the start edge. The wrap only acts past W3's sum: 392 px at `siblingCount` 1, 480 at 2 with nothing spare, 568 at 3, so a large `siblingCount` wraps in a small frame and never overflows | 392 px, measured | Rows 22, 39 |
| D14 | `page-current-1` | `.ds-pagination__link` | `display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-block-size: var(--cmp-nav-item-height); min-inline-size: var(--cmp-nav-item-height); padding-inline: var(--ds-space-inline-sm); border: 1px solid transparent; border-radius: var(--cmp-nav-item-radius); background: transparent; color: var(--cmp-nav-item-fg); text-decoration: none;` the `--ds-type-control-md-*` set, and the three-property `transition` of `.ds-button` (`recipes.css` lines 35 to 38), so a number and a chevron answer alike and reduced motion takes it to 0 ms | 40 by 40 px at one and two digits, 43.6 px wide at four. Digit ink 0 to 0.25 px off centre | Rows 23, 32 |
| D15 | `page-current-1` | `.ds-pagination__link:hover:not([aria-current="page"])` | `background: var(--cmp-nav-item-bg-hover); color: var(--cmp-nav-item-fg-hover);` Under the transition, plays read this inside `waitFor` | Fill and ink | Rows 31, 34 |
| D16 | `page-current-1` | `.ds-pagination__link[aria-current="page"]` | `background: var(--cmp-nav-item-bg-active); border-color: var(--ds-border-strong); color: var(--cmp-nav-item-fg-active);` | 1 px edge on all four sides | Rows 23, 32 |
| D17 | `page-current-1` | `.ds-pagination__link:focus-visible` | `border-color: var(--ds-focus-ring); outline: 1px solid transparent; outline-offset: 0; box-shadow: var(--_focus-shadow-border);` After D16: both have the same specificity, and focus must win | Line and 3 px halo, on the current page too | Rows 31, 34 |
| D18 | `page-markup-1` | `.ds-pagination__gap` | `display: inline-flex; align-items: center; justify-content: center; inline-size: var(--cmp-nav-item-height); block-size: var(--cmp-nav-item-height); color: var(--cmp-nav-item-fg);` | 40 by 40 px, the width of a page slot | Rows 22, 24 |
| D19 | `page-form-1` | `.ds-pagination__status` | `display: none; color: var(--cmp-nav-item-fg); white-space: nowrap;` and the `--ds-type-body-sm-*` set. Stay on 1.7: Thai body measures 0 px off the row's centre and digits 0.75 px, against 1 px and 0.25 px at 1.6, and 1.7 is the better of the two for a Thai line | One line | Rows 37, 38 |
| D20 | `page-ends-1`, A5 | `.ds-pagination .ds-button[data-variant="ghost"]:disabled` | `color: var(--ds-text-disabled);` Scoped here, so no other ghost Button moves | Paler than a live number, at least 3.3 | Rows 26, 27, A5's new check |
| D21 | `page-form-1`, A7 | `@container ds-pagination (max-width: 479px)` | `.ds-pagination__list { flex-wrap: nowrap; justify-content: space-between; } .ds-pagination__page, .ds-pagination__gap { display: none; } .ds-pagination__status { display: block; }` The chevrons hold the two ends, so they do not move when the status grows from "5" to "12". A chevron's glyph sits 12 px inside its box, so the box, not the ink, is what meets the edge | Status centred, 98.8 px clear on each side in a 360 px frame in Thai, 100.9 in English | Rows 37, 38, 39 |

D1 to D11 go in the Breadcrumb PR, with D11's breadcrumb selector only and pairs 1 to 6, 13 and 14. D12 to D21 go in the Pagination PR, which adds D11's two pagination selectors and pairs 7 to 12, 15 and 16.

## States

Selected does not apply: a current crumb or page is a place, marked `aria-current`, and it never takes `surface.selected`. Focused is its own state on top of current.

<!-- prettier-ignore -->
| State | Breadcrumb | Pagination |
| --- | --- | --- |
| Default | Links in `nav-item.fg` at 400, slashes in the same ink | Numbers in `nav-item.fg` at 500, chevrons in `button.ghost.fg`, gaps in `nav-item.fg` |
| Hover | Link: darker ink and an underline. Ellipsis: Button's own ground and edge, plus darker ink. Current crumb: no change | Number: hover ground and darker ink. Chevron: Button's own. Current page: no change |
| Focus | Link: global 1 px line and 4 px shadow, on a pill. Ellipsis: Button's border form. Current crumb: not focusable | Number and current page: the border form. Chevron: Button's own. Gap: not focusable |
| Current | Weight 500, `nav-item.fg-active`, no link | `nav-item.fg-active` on `bg-active`, in a 1 px `border.strong` edge, still a link |
| Disabled | None: a crumb is a link or the page | Previous on page 1 and Next on the last page, `text.disabled`, not a Tab stop, in place |
| Loading | None (Out of scope): each is a navigation to a new page | The same |
| Empty | The spec has no rule for a trail with no children, no story shows one and no screen asks for it, so nothing is designed here | `total` below 2 renders nothing (`page-bounds-1`) |
| Error | None. A blank label shows `breadcrumb.missing` | None. A bad `page` is clamped, never thrown (`page-bounds-1`) |
| Success | None | None |

Thai and Latin share every row above. Long names cut at the end of a line (D3), a missing name reads "ไม่มีชื่อ", a phone takes the status form (D21), and reduced motion takes D14's transition to 0 ms through the token.

## Amendments for product to take in

### A1. `pagination.label`, Thai (Copy table, row 22)

Old: ``| `pagination.label` | หน้าของรายการ | Pages |``, and in row 22 `getByRole("navigation", { name: "หน้าของรายการ" })`.

New: ``| `pagination.label` | เลขหน้า | Pages |``, and in row 22 `getByRole("navigation", { name: "เลขหน้า" })`.

### A2. The crumb's focus shape (`crumb-look-1`, `crumb-cut-1`)

Old: "Focus is the global `:focus-visible` line and halo (`orivilo.css` lines 74 to 78); no breadcrumb class sets its own."

New: "Focus is the global `:focus-visible` line and halo (`orivilo.css` lines 74 to 78); no breadcrumb class sets its own line or halo. A link takes `--ds-space-inline-sm` of inline padding, cancelled by a negative margin so no ink moves, and `--cmp-nav-item-radius` while focused, so the line follows the control shape and clears the glyphs. A link that ends the trail keeps no negative end margin, so it cannot leave its frame."

Why: as written, the line is a square box touching the first and last glyph, in a system of pills (`study-spec-against-proposal-light.png`, top against bottom).

Row 4 adds: on a focused link computed `borderTopLeftRadius` equals `getComputedStyle(link).getPropertyValue("--cmp-nav-item-radius")`, and `paddingInlineStart` is `4px`.

Row 15 adds a second trail to `At360`, all links, ending in `fixtures.longThai`, under its own `aria-label`: the frame's `scrollWidth` is not above 360. Row 16 adds the same with `fixtures.longLatin`.

### A3. One height per line (`crumb-look-1`)

Old: "The list keeps `min-block-size: var(--ds-size-control-sm)`, so a press on the ellipsis does not change the height of a one-line trail."

New: "The list and each item keep `min-block-size: var(--ds-size-control-sm)`, so a press on the ellipsis does not change the height of a one-line trail, and every line of a wrapped trail has one height, with or without the ellipsis."

Why: with the list alone, a wrapped line holding the ellipsis is 32 px and the next is 24 px. At 32 px the padded hit areas of two lines meet and do not overlap.

Row 1 adds: each `listitem`'s computed `minHeight` is `32px`.

### A4. The ellipsis sits in the trail (`crumb-expand-1`, rows 6 and 13)

Old: "The ellipsis is a `Button` `variant="ghost"` `size="sm"` `iconOnly` with `EllipsisIcon`, named `breadcrumb.showAll`."

New: "The ellipsis is a `Button` `variant="ghost"` `size="sm"` `iconOnly` with `EllipsisIcon`, named `breadcrumb.showAll`. Inside the trail it reads `--cmp-nav-item-fg`, and `--cmp-nav-item-fg-hover` on hover and press, and a negative inline margin of `--ds-space-inline-md` takes back the empty part of its 32 px square."

Why: Button's `text.primary` draws the dots as dark as the current crumb, and its square leaves 15 px to each slash where a crumb has 8, or 18 px once the glyph is 16 px (A7), so the trail looks broken at that point (`study-spec-against-proposal-light.png`). With the margin it is 10 px. The cost: on hover and focus the button's ground and halo reach both slashes, for as long as that state lasts.

Row 6 adds: the button's computed `color` equals `resolvedColor(button, "--cmp-nav-item-fg")`, and its `marginInlineStart` is `-8px`.

### A5. The disabled chevron's ink (`page-ends-1`, rows 26 and 27)

Old: "On the first page Previous, and on the last page Next, is a native `<Button disabled>`: not a link, not a Tab stop, still in its place, so the row does not shift (K-0328)."

New: "On the first page Previous, and on the last page Next, is a native `<Button disabled>`: not a link, not a Tab stop, still in its place, so the row does not shift (K-0328). Inside `.ds-pagination` its ink is `--ds-text-disabled`, because `button.ghost.fg-disabled` is `text.secondary`, the ink of a live page number."

Rows 26 and 27 add: the disabled button's computed `color` equals `resolvedColor(button, "--ds-text-disabled")`.

Why not change the token: `button.ghost.fg-disabled` is read by every ghost Button, and the spec rules out any Button change. A follow-up can ask whether the token itself should move.

### A6. The pair count (contract table)

Old: "Twelve colour pairs".

New: "Sixteen colour pairs", with these four added after the list: "Breadcrumb, text 4.5: `nav-item.fg-hover` on `button.ghost.bg-hover` and on `button.ghost.bg-press`. Pagination, UI 3.0: `ds:text.disabled` on `ds:surface.canvas` and on `ds:surface.card`."

Old, in the pagination recipe row: "Other Button recipes untouched: Previous and Next are plain Buttons".

New: "Other Button recipes untouched: Previous and Next are Buttons, and the only rules on them are scoped to `.ds-pagination` (`design.md` D11, D20)". The breadcrumb recipe row adds: "Two scoped rules on the ghost Button inside the trail (`design.md` D10, D11)".

### A7. A glyph size and a wrap the spec leaves unsaid (`nav-glyphs-1`, `page-markup-1`, `page-form-1`)

`nav-glyphs-1` old ending: "No new runtime dependency comes with this story, so it brings no dependency security review."

New ending: "No new runtime dependency comes with this story, so it brings no dependency security review. An `iconOnly` Button gives its child no size, so the recipes size the glyphs inside `.ds-breadcrumb` and `.ds-pagination`, and the gap glyph, to `--cmp-button-icon-size-md`."

Row 6 adds: the ellipsis `svg` is 16 px wide. Row 22 adds: each chevron `svg` and each gap `svg` is 16 px wide.

`page-markup-1` adds, as its last sentence: "From 480 px up the list wraps, so a large `siblingCount` wraps in a small frame and never overflows; the catalog entry says that above 2 it wraps below 568 px."

`page-form-1` old: "`li.ds-pagination__status` shows `pagination.status`, in `type.body.sm` and `--cmp-nav-item-fg`, between Previous and Next (K-0326)."

New: "`li.ds-pagination__status` shows `pagination.status`, in `type.body.sm` and `--cmp-nav-item-fg`, between Previous and Next (K-0326), and the list stops wrapping and spreads, so Previous and Next hold the two ends."

### Facts in the spec that have moved

Develop merged after v1.0. None of these changes a rule; product can correct them with the amendments.

- "`expectFrameCutsNoInk(el, frame)` arrives with PR 186 and is not in this worktree yet": it is here now (`src/testing/visual-asserts.ts` line 1288), so the builder is not blocked on it.
- `crumb-cut-1` says the clip-box list is at `recipes.css` line 4716: it is now lines 4767 to 4782.
- The contract table says the `icons.tsx` comment at line 62 counts 46 against 49 imports: the comment is now at line 64 and says 53, and the file imports 51. The builder counts again in the same edit.

## Screens to check in visual QA

Rows 20 and 43 name the stories, and screen 7 adds `FormEdge`. Look hard at these:

1. `Collapsed`, closed and hovered: the dots read as part of the trail at rest, and on hover and focus the pill may touch both slashes but leaves each one readable.
2. `Default` under Tab, Thai: the pill clears "โปรเจกต์ทั้งหมด", marks included. The halo reaches the slash and leaves it readable.
3. `Default`, focus on "5" against focus on "6", under Professional light: the halo is what tells them apart, since `focus.ring` and `border.strong` are close there.
4. `OnCard` with focus on the current page: the fill is gone and the focus line replaces the edge, so ink and halo carry it while focused.
5. `FirstPage` and `LastPage` under Friendly dark on a card: the lowest disabled pair, 3.3.
6. `At360`: a cut crumb and its slash. The cut falls between whole glyphs, so the gap before the slash was about 16 px on both long fixtures, where a whole crumb has 8. It reads as a cut, not as a fault, but it is the loosest spot in the trail.
7. `FormEdge`: the jump at 479 and 480 px, with the chevrons at the ends in the first and beside the numbers in the second.
8. `RecipesAndModes`: Friendly has no screenshot here, so this is its first look.

## Screenshots

Each is the proposal in Storybook: the story `base-button--variants` under its real decorator, boundary, fonts and tokens, with the surface's content replaced by the markup of `crumb-markup-1` and `page-markup-1` and the rows above added with `page.addStyleTag`. Hover and focus are the real rules, forced on several elements at once through the DevTools protocol. Console and page errors over the run: 0. Thai at 360 and 1440 px, light and dark, neutral and Professional, plus English in neutral light as a check of Latin.

Contact sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/contact-sheet.png`

<!-- prettier-ignore -->
| Screen | Path |
| --- | --- |
| Breadcrumb, neutral, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-neutral-light-1440-th.png` |
| Breadcrumb, neutral, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-neutral-light-360-th.png` |
| Breadcrumb, neutral, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-neutral-dark-1440-th.png` |
| Breadcrumb, neutral, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-neutral-dark-360-th.png` |
| Breadcrumb, Professional, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-professional-light-1440-th.png` |
| Breadcrumb, Professional, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-professional-light-360-th.png` |
| Breadcrumb, Professional, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-professional-dark-1440-th.png` |
| Breadcrumb, Professional, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-professional-dark-360-th.png` |
| Pagination, neutral, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-neutral-light-1440-th.png` |
| Pagination, neutral, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-neutral-light-360-th.png` |
| Pagination, neutral, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-neutral-dark-1440-th.png` |
| Pagination, neutral, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-neutral-dark-360-th.png` |
| Pagination, Professional, light, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-professional-light-1440-th.png` |
| Pagination, Professional, light, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-professional-light-360-th.png` |
| Pagination, Professional, dark, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-professional-dark-1440-th.png` |
| Pagination, Professional, dark, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-professional-dark-360-th.png` |
| English, Breadcrumb, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-neutral-light-1440-en.png` |
| English, Breadcrumb, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/breadcrumb-neutral-light-360-en.png` |
| English, Pagination, 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-neutral-light-1440-en.png` |
| English, Pagination, 360 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/pagination-neutral-light-360-en.png` |
| The spec as written against the proposal, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/study-spec-against-proposal-light.png` |
| The spec as written against the proposal, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-1/shots/study-spec-against-proposal-dark.png` |

The scratchpad is not kept. The main session copies these under `.orivilo/runs/` if they are to outlive the session.

## What this does not prove

- No component exists, so no play or acceptance row ran. The sizes above come from the injected markup, and Button is real only as its recipe, not its React.
- Friendly was not rendered. Its colours are in the pair table, and its pill is neutral's, so `RecipesAndModes` is its first look (QA screen 8).
- The clip was measured by comparing `overflow: hidden` with `visible` on the worst sample in `expectLabelInkWhole` ("ฟื้ปั้ปี๊ฟื้"), at 2x, in neutral and Professional. At rest: 0 pixels cut on the link and on the current crumb. Under real keyboard focus: 0 in Professional, and 3 device pixels in neutral, from the pill's corner. It lasts only while focused, and only with that stack as the first glyph, so it is accepted. The repo's own `expectLabelInkWhole` and `expectFrameCutsNoInk` have not run on this; rows 15 and 16 do that.
- The 16 pairs were read from the token source with a scratch script, not from `pnpm contrast` or `recipes.test.ts`, since the pairs are not in `pairs.ts` yet.
- Target size: a crumb is 31.8 px high and a page link 40 px, under `size.touch` 44. A page link matches Button md, and the spec sets both, so neither is changed here.
- Frame edge: a first crumb's focus pill overhangs the start edge by 4 px, plus the halo. A parent that clips flush with the trail cuts it, as it would cut any control's halo.
