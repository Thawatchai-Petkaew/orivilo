---
issue: ORV-229
spec: docs/specs/ORV-229/spec.md v1.2
task: ORV-229-design-1, ORV-229-design-2, ORV-229-design-3
date: 2026-11-06
---

# ORV-229 design: Breadcrumb and Pagination (base)

The look of the trail and the page row, the answers to open questions 1 to 11, the proof of the colour pairs, the Copy table read aloud, and one row of CSS and markup per rule for the builder. Every value is an existing `--ds-*` or `--cmp-*` property; this design adds no token.

All eleven open questions stay on their defaults. The render still found five things the spec needs changed: one Thai name, the focus shape of a crumb, the height of a wrapped line, the ink and spacing of the ellipsis, and the ink of a disabled chevron. Those are amendments A1 to A5; A6 counts the pairs, and A7 writes down a glyph size and a wrap the spec leaves unsaid. Each has its old and new text, and the tables below assume they are taken. A8 came later, from the built component: it withdraws the cut accepted on the analogue and replaces the focus pill (see "Row 15, the focus step"). A9 came from the visual sign-off: finding F1 of ORV-229-signoff-1 refuses "No padding-inline" in row D8, so the current crumb now pads its inline sides as a link does (see "The current crumb's ink, F1"). A10 takes sign-off suggestion S1 into row 20. No colour pair is refused. Four pairs are added, so the count goes from twelve to sixteen.

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
| D5 | `crumb-cut-1`, A2, A9 | `.ds-breadcrumb__item:last-child > .ds-breadcrumb__link, .ds-breadcrumb__item:last-child > .ds-breadcrumb__page` | `margin-inline-end: 0;` | A last crumb that is long, link or current, leaves the frame at 360, not 364, in Thai and English, and the two end on one edge | Row 15 with A2's second trail and A9's check |
| D6 | `crumb-look-1` | `.ds-breadcrumb__link:hover` | `color: var(--cmp-nav-item-fg-hover); text-decoration: underline;` No transition, so row 5 reads the end state at once | Ink and underline | Rows 5, 12 |
| D7 | `crumb-look-1`, A2, A8 | `.ds-breadcrumb__link:focus-visible` | `border-radius: var(--ds-shape-check-radius);` Line and halo stay global. The radius is on focus only, and it rounds the box that clips the text, so it must stay at 8 px or under (A8) | 4 px in neutral, `orivilo` and Professional, 6 px in Friendly | Row 4 with A8's check, row 15 |
| D8 | `crumb-look-1`, `crumb-current-1`, `crumb-cut-1`, A9 (F1 of ORV-229-signoff-1) | `.ds-breadcrumb__page` | `padding-inline: var(--ds-space-inline-sm); margin-inline: calc(-1 * var(--ds-space-inline-sm)); color: var(--cmp-nav-item-fg-active);` and the `--ds-type-label-md-*` set. No hover rule and no fill, so the padding never shows. D5 ends the margin on the last crumb | Weight 500 against 400. No Thai ink cut at either end: 0 of 4416 labels, against 2698 to 2820 as built. Ink does not move: 32 px item, 8 px from slash to ink. A cut crumb keeps its ellipsis and ends 4 px inside the frame | Row 2 with A9's check, rows 11, 15, 16, 45 |
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
| Focus | Link: global 1 px line and 4 px shadow, on the small corner of `shape.check.radius`. Ellipsis: Button's border form. Current crumb: not focusable | Number and current page: the border form. Chevron: Button's own. Gap: not focusable |
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

A8 replaces the radius in this amendment. The padding, the margin and the second trail stand.

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

### A8. The crumb's focus corner (`crumb-look-1`, `crumb-cut-1`, Fixtures, rows 4 and 15)

`crumb-look-1` old: "A link takes `--ds-space-inline-sm` of inline padding, cancelled by a negative margin so no ink moves, and `--cmp-nav-item-radius` while focused, so the line follows the control shape and clears the glyphs."

New: "A link takes `--ds-space-inline-sm` of inline padding, cancelled by a negative margin so no ink moves, and `--ds-shape-check-radius` while focused, so the line clears the glyphs. A link's box clips its text, so its focus corner rounds that clip too, and it stays at 8 px or under in every profile: a pill in a 32 px line cuts Thai marks at both ends of a label."

`crumb-cut-1` old: "The design's clip figures are an analogue: injected markup in Chromium at 2x, with the worst sample of `expectLabelInkWhole`, gave 0 pixels cut at rest, and under focus 0 in Professional and 3 device pixels in neutral, from the corner of the pill. Row 15 settles both on the built component."

New: "The design's first clip figures were an analogue, from one sample at the start corner. On the built component a pill cut marks at both corners, so the focus corner is `--ds-shape-check-radius` (`crumb-look-1`). Row 15 proves it."

`crumb-cut-1` old: "If that step goes red, the builder reports the pixel the helper names and does not widen the helper, drop the step or change the radius: the design accepted this cut on the analogue, so the call goes back to the designer."

New: "If that step goes red, the builder reports the pixel the helper names and does not widen the helper, drop the step or change the radius: no cut is accepted, so the call goes back to the designer."

Fixtures old: "The second trail of `At360` opens on `ฟื้ปั้ปี๊ฟื้`, the default sample of `expectLabelInkWhole`: a test string, shown in that story only."

New: "The second trail of `At360` opens on `ฟื้ปั้ปี๊กี๊`, a stack at the start corner and `กี๊` at the end corner: a test string, shown in that story only."

Row 4 old: "on a focused link computed `borderTopLeftRadius` equals `getComputedStyle(link).getPropertyValue("--cmp-nav-item-radius")`"

New: "on a focused link computed `borderTopLeftRadius` equals `getComputedStyle(link).getPropertyValue("--ds-shape-check-radius")`"

Row 15 old, in the action: "two links, `ฟื้ปั้ปี๊ฟื้` then `fixtures.longThai`"

New: "two links, `ฟื้ปั้ปี๊กี๊` then `fixtures.longThai`"

Row 15's check is not changed: "Under keyboard focus on the first link of the second trail, which is not cut, `expectFrameCutsNoInk(link, frame)` passes" stands, with no tolerance.

Why: see "Row 15, the focus step".

### A9. The current crumb's inline clip (`crumb-look-1`, `crumb-cut-1`, Fixtures, rows 2, 11, 15, 16, 19, 20, new row 45, Rows per PR)

`crumb-look-1` old: "A link takes `--ds-space-inline-sm` of inline padding, cancelled by a negative margin so no ink moves, and `--ds-shape-check-radius` while focused, so the line clears the glyphs."

New: "A link takes `--ds-space-inline-sm` of inline padding, cancelled by a negative margin so no ink moves, and `--ds-shape-check-radius` while focused, so the line clears the glyphs. The current crumb takes the same padding and margin, because its box clips its text too and Thai marks overhang both ends of a label; it has no fill, so the padding never shows."

`crumb-look-1` old: "A link that ends the trail keeps no negative end margin, so it cannot leave its frame."

New: "A link or a current crumb that ends the trail keeps no negative end margin, so it cannot leave its frame."

`crumb-cut-1` old: "A link's inline padding and its end margin are in `crumb-look-1`."

New: "The inline padding and the end margin of a link and of the current crumb are in `crumb-look-1`."

`crumb-cut-1` adds, after "so the call goes back to the designer.": "`expectLabelInkWhole` reads ink above the box only, and row 15's `expectFrameCutsNoInk(item, frame)` leaves the crumb's own clip on, so neither sees a cut at an inline end. Rows 11 and 45 read that cut: `expectFrameCutsNoInk(current, nav)` on a current crumb that is whole, since on a cut crumb the helper would draw the rest of the label."

Fixtures old: "a stack at the start corner and `กี๊` at the end corner: a test string, shown in that story only."

New: "a stack at the start corner and `กี๊` at the end corner: a test string, shown in that story only. `CurrentInk` shows `ไปให้` as its current crumb, a word whose marks overhang both ends of its box: a test string, shown in that story only."

Row 2 old: "its computed `fontWeight` is 500 and a link's is 400"

New: "its computed `fontWeight` is 500 and a link's is 400; its computed `paddingInlineStart` is `4px` and `marginInlineStart` is `-4px`"

Row 11 old: "the current crumb reads "ไม่มีชื่อ" with `aria-current="page"`"

New: "the current crumb reads "ไม่มีชื่อ" with `aria-current="page"`; `expectFrameCutsNoInk(current, nav)` passes, with `current` the crumb itself, which is not cut, and the step guarded by `inVitest`"

Row 15 old: "The last link of the second trail has computed `marginInlineEnd` `0px`."

New: "The last link of the second trail and the current crumb each have computed `marginInlineEnd` `0px`."

Row 16 stands: "The same checks as row 15" takes this in.

Row 19 old: "zero a11y violations in the twelve Breadcrumb stories listed above"

New: "zero a11y violations in the thirteen Breadcrumb stories listed above"

Row 20 Expected adds, after "the cut reads as a cut;": "no mark of the current crumb is cut at either end;"

New row 45, in the same table after row 44:

"| 45 | Storybook test project | `CurrentInk` renders through `Matrix`, in each cell a link and a current crumb reading `ไปให้`, in a `Cell` named from `useDesignProfile()` | Six boundaries; in each, no mark of `ไปให้` is cut at its start or its end | None. Six `navigation`s; on each current crumb `scrollWidth` is not above `clientWidth`, and `expectFrameCutsNoInk(current, nav)` passes, the step guarded by `inVitest`. Red on a current crumb with no end padding, which row 11's label cannot show (`crumb-look-1`, `crumb-cut-1`) | `CurrentInk` play |"

Rows per PR old: "The first carries rows 1 to 21 and the second rows 22 to 44."

New: "The first carries rows 1 to 21 and row 45, and the second rows 22 to 44."

Rows per PR old: "- PR 196: rows 1-21"

New: "- PR 196: rows 1-21, 45"

Why: see "The current crumb's ink, F1".

### A10. What row 20 confirms (rows 20 and 43, from sign-off suggestion S1)

Row 20 old, in the action: "The designer opens `Default`, `Collapsed` (closed and opened), `Missing`, `At360`, `At360InEnglish`, `RecipesAndModes`"

New: "The designer opens `Default`, `Collapsed` (closed and opened), `Missing`, `NoCollapse`, `At360`, `At360InEnglish`, `RecipesAndModes`, `CurrentInk`"

Row 20 old, at its end: "confirms on the built component the answers to open questions 1, 2, 3, 5, 7 and 9 and the `design.md` visual QA screens 1, 2, 6 and 8"

New: "confirms on the built component the answers to open questions 1, 3, 5, 7 and 9 and the `design.md` visual QA screens 1, 2, 6, 8, 9 and 10"

Row 43 old, at its end: "confirms on the built component the answers to open questions 2, 4, 10 and 11"

New: "confirms on the built component the answers to open questions 2, 3, 4, 10 and 11"

Why: screen 9 is the cost A8 added, and row 20 never named it. Screen 10 is the cost A9 adds. Open question 2 is the current page's look, which only the Pagination PR can show: row 43 already holds it, so it leaves row 20 and nothing is added for it. Question 3 covers a crumb link and a page number, so it stays in row 20 for the crumb and joins row 43 for the number, which row 43 left out.

### Facts in the spec that have moved

Develop merged after v1.0. None of these changes a rule; product can correct them with the amendments.

- "`expectFrameCutsNoInk(el, frame)` arrives with PR 186 and is not in this worktree yet": it is here now (`src/testing/visual-asserts.ts` line 1288), so the builder is not blocked on it.
- `crumb-cut-1` says the clip-box list is at `recipes.css` line 4716: it is now lines 4767 to 4782.
- The contract table says the `icons.tsx` comment at line 62 counts 46 against 49 imports: the comment is now at line 64 and says 53, and the file imports 51. The builder counts again in the same edit.

## Row 15, the focus step

The builder found `expectFrameCutsNoInk(link, frame)` red on the first link of the second trail. The cut does not stand. The corner changes and the check stays as written.

**Decision.** Row D7 becomes `border-radius: var(--ds-shape-check-radius);`. Row 15's play keeps its step, on a sharper label (A8). No token is added, no ink moves, no size changes.

**Why the cut does not stand.** The acceptance on the analogue was wrong on its one reason: "only with that stack as the first glyph". It read one sample at the start corner. A mark sits at the right of its base, so the end corner cuts far more. In the real `At360` story, under real keyboard focus, the pill cuts `เจ้าหนี้`, `ลูกหนี้`, `สิ่งนี้`, `ไฟฟ้า` and `ไปให้`, ordinary names a crumb can hold. Row 15 expects "no Thai mark is cut, at rest or under focus", and a tolerance would blind the check to the defect it exists for.

**Why the pill cannot hold.** The cut pixels are ink that lies outside the pill, not only outside the clip. A pill in a 32 px line, 4 px from the text, is too round for a label whose marks rise to about 2 px from its top: at the 4x study the marks run into the line. So a clip on an inner element would trade the cut for a mark across the focus line, and it would also add an element that `asChild` has no place for. The shape has to change, not the clip.

Measured on every Thai first and last cluster: 4416 labels of the form cluster, ก, cluster (44 consonants, upper and lower vowels, tone marks, leading vowels), each in a box with the crumb's own recipe, shot clipped and unclipped with the helper's threshold (`INK_DISTANCE` 48).

<!-- prettier-ignore -->
| Shape | Inline padding | Labels cut, 1x | Labels cut, 2x | Verdict |
| --- | --- | --- | --- | --- |
| Pill, as built | 4 px | 2138 | 2144 | Refused: nearly half |
| Radius 14 | 4 px | 1314 | 1622 | Refused |
| Radius 12, `shape.media.radius` in neutral | 4 px | 867 | 897 | Refused, and that token is 16 in Friendly |
| Radius 10 | 4 px | 622 | 336 | Refused |
| Radius 8 | 4 px | 0 | 0 | Clear: the bound |
| Radius 6, `shape.check.radius` in Friendly | 4 px | 0 | 0 | Taken |
| Radius 4, `shape.check.radius` in neutral and Professional | 4 px | 0 | 0 | Taken |
| Pill | 6 px, no token | 1237 | 1222 | Refused |
| Pill | 8 px, `space.inline.md` | 620 | 439 | Refused: still cuts, and the line sits on the slash |

**Why this token.** `shape.check.radius` is the only shape token at 8 px or under in every profile, and its description, "small chips inside controls", fits a box around a word; `cmp-tabs-radius` reads it too. It keeps the profiles apart, with Friendly softer than the others. `min(var(--cmp-nav-item-radius), var(--ds-shape-check-radius))` was tried and dropped: the computed values are the same in every profile, and `recipes.test.ts` line 60 refuses a `border-radius` that does not open with `var(`.

**The cost.** A focused crumb is no longer a pill in neutral and Friendly, so it differs from the focused ellipsis beside it, which stays a Button shape. Professional moves from 6 to 4 px, so there too the crumb and the ellipsis, at 6 px, no longer match. The line still clears the glyphs by 4 px at the sides, and the shape is still a line with a halo in the profile's brand hue, so it does not read as selection. The label is a word in running wayfinding, not a control with its own ground, and the small corner reads that way.

**The play.** The old label is a weak test: `ฟื้ปั้ปี๊ฟื้` passes at radius 12 and 14, because its marks clear the end corner. `ฟื้ปั้ปี๊กี๊` is red at the pill, at 12 and at 10, and green at 8, 6 and 4, in the real story at 1x and 2x, so the step guards the bound and not only the pill.

What the builder changes, nothing else:

1. `packages/design-system/src/recipes/recipes.css`, the `.ds-breadcrumb__link:focus-visible` rule: D7's CSS. Its comment says a pill: it becomes "The focus corner rounds the box that clips the text, so it stays small: a pill cuts Thai marks at both ends of a label. The line and the halo stay global."
2. `Breadcrumb.stories.tsx`, `At360`: `first="ฟื้ปั้ปี๊กี๊"`, and the comment that marks the place is replaced by the step `if (inVitest) await expectFrameCutsNoInk(target, frame);`. The frame comes back from `playAt360`, which returns it.
3. `Breadcrumb.stories.tsx`, `expectCrumbFocus`: the radius line reads `--ds-shape-check-radius`, and its doc comment drops the word "pill".
4. `packages/design-system/catalog/base/breadcrumb.yaml` line 24: "on a pill that clears the glyphs" becomes "on a small corner that clears the glyphs".

Impact: Breadcrumb only. No token, no recipe of another component, no public API. Pagination's numbers are not affected: a page link does not clip its text.

## The current crumb's ink, F1

Finding F1 of ORV-229-signoff-1 stands, and it is a finding against this design: row D8 said "No padding-inline". The current crumb clips at its padding box, and with no padding that box is the text's own edge, so the flag of ไ, the head of โ and a tone mark at the end of a label are sliced straight, at rest, in every profile and mode.

**Decision.** Rows D8 and D5 change. The current crumb takes the link's inline padding and negative margin, and, as the last crumb, drops its end margin. No token is added: `--ds-space-inline-sm` is the value the link already reads. The ellipsis, the `overflow` and the clip-box list stay as they are, so a cut crumb still ends in an ellipsis.

Measured on the same 4416 labels as row 15's study (cluster, ก, cluster), each in a real `.ds-breadcrumb__page` box under the real boundary, shot clipped and unclipped with the helper's threshold (`INK_DISTANCE` 48). Neutral, Professional and Friendly in both modes, `orivilo` in light, at 1x and 2x: 14 runs per row.

<!-- prettier-ignore -->
| Inline padding | Labels cut, light, 1x and 2x | Labels cut, dark, 1x and 2x | Cut at the start, most | Cut at the end, most | Verdict |
| --- | --- | --- | --- | --- | --- |
| None, as built | 2698, 2802 | 2739, 2820 | 1524 | 1979 | Refused: about six labels in ten |
| 2 px, no token | 0 | 0 | 0 | 0 | Refused: clear in Chromium, but the widest ink, about 2 px past the box, meets it exactly, so nothing is left for another browser, and no inline token is this small |
| 4 px, `space.inline.sm` | 0 | 0 | 0 | 0 | Taken: about 2 px to spare, the link's own value |

The counts are the same in every profile because `type.label.md` is the same in every profile; only mode moves them, through the ink against the ground.

**What holds.** Shipped against proposed on one page: 10 stories, viewports 360, 392 and 1440, neutral and Friendly, light and dark, 120 runs.

<!-- prettier-ignore -->
| Measure | Sign-off 1 | With D8 |
| --- | --- | --- |
| Item height | 32 px | 32 px in all 120 runs |
| Ink to slash, whole crumb | 8 px | 8 px, and 8 px from a slash to the next crumb's ink |
| `At360` frame `scrollWidth` | 360 in a 360 frame | 360, Thai and English, and 328 in the 328 frame a 360 viewport gives |
| Page scroll | 0 | 0 in all 120 runs |
| Start edge | One | One, at one, two, three and four lines, each with 0 ink cut in all four cells |

**A cut crumb still reads as a cut.** A long label that opens on `ไปให้`, in the frame of `At360`, keeps its ellipsis in all four cells. Its start was sliced as built, 52 pixels in the first 60 px at 4x, and is whole now, 0 pixels. Only the end of the line moves: the text of a cut current crumb now ends 4 px inside the 360 px frame, on the same edge as the cut last link of the second trail, which it did not share before (`at360-neutral-light-th-360.png`).

**The cost.** The padding is real width at the end of a line. D5 keeps the frame at 360 by leaving the end padding inside the item, so the last item is 4 px wider than its text. Two things follow, both already true of a last link:

- A current crumb that fits its line with under 4 px to spare wraps to the next line. This is on a fixture: `NoCollapse` in a 360 px frame goes from three lines to four, with "ใช้ Orbit violet เป็นสีของการกระทำหลัก" alone on the last. It was the only change in the 120 runs: `NoCollapse` at viewport 392, in all four cells. It reads cleanly, with one start edge (`nocollapse-neutral-light-th-360.png`), and it is QA screen 10.
- A label over 356 px wide and up to 360 px, alone on its line, is cut in a 360 px frame, where it was whole. Measured with a sized label: whole with 4 px of slack, cut with 3.

A hanging mark also shows now where it was sliced: ink reaches about 2 px past the box at either end, so the flag of ใ at a line start sits just past the start edge. The text still starts on the edge, as a link's does.

**Refused and not tried.** Keeping the end margin on the last crumb removes the wrap cost and puts the frame at 364 (mutant M3 below), which is what D5 exists to stop. `overflow-clip-margin` might carry no wrap cost, but it was not tried: it would be a second clip form beside the link's, and F1 asks for one form.

**The play.** Two steps read the cut, and each needs its own label. `ไม่มีชื่อ` overhangs at the start only, so `Missing` alone stays green with no end padding. `ไปให้` overhangs at both ends, so `CurrentInk` carries the end and, through `Matrix`, all six boundaries. The real helpers ran on these plays, in a scratch copy of the packages, with this CSS and these mutants:

<!-- prettier-ignore -->
| CSS | Breadcrumb stories passing | Red |
| --- | --- | --- |
| Today's, head a35da46 | 10 of 13 | `Missing`: "cuts ink: the pixel at x 60, y 5". `CurrentInk`: "the pixel at x 68, y 5". `Default`: `0px` against `4px` |
| D8 and D5 | 13 of 13 | None |
| M1, no start padding | 10 of 13 | The same three |
| M2, no end padding | 12 of 13 | `CurrentInk` only: "the pixel at x 98, y 6" |
| M3, D5's page selector dropped | 11 of 13 | `At360` and `At360InEnglish`: frame `scrollWidth` 364 |
| M4, start margin dropped, ink moves | 12 of 13 | `Default`: `0px` against `-4px` |
| M5, `overflow: visible`, the cut is gone | 11 of 13 | `At360` 511 and `At360InEnglish` 466 against 360 |

With the exact edits below in the copy, in place and not appended: 13 of 13 stories, and `--project checks` on `src/recipes` and `tests` 1893 of 1893, `recipes.test.ts` and `check-i18n` among them.

What the builder changes, nothing else:

1. `packages/design-system/src/recipes/recipes.css`, the `.ds-breadcrumb__item:last-child > .ds-breadcrumb__link` rule: D5's two selectors.
2. Same file, the `.ds-breadcrumb__page` rule: D8's two new lines first, and above the rule the comment "The current crumb pads its inline sides as a link does: its box clips its text, and Thai marks overhang both ends of a label. The margin keeps the ink where it was."
3. `Breadcrumb.stories.tsx`, `Default`, after the `fontWeight` lines of row 2: `await expect(getComputedStyle(current).paddingInlineStart).toBe("4px");` and `await expect(getComputedStyle(current).marginInlineStart).toBe("-4px");`
4. `Breadcrumb.stories.tsx`, `Missing`, as its last line: `if (inVitest) await expectFrameCutsNoInk(current, current.closest("nav") as HTMLElement);`
5. `Breadcrumb.stories.tsx`, `playAt360`, after the `lastLink` margin line: `await expect(getComputedStyle(page).marginInlineEnd).toBe("0px");`
6. `Breadcrumb.stories.tsx`, a new story `CurrentInk`, after `RecipesAndModes`, in the form of `Cell` and `RecipesAndModes`: a cell with `<Breadcrumb aria-label={...}>`, a `BreadcrumbLink` on `trail[0].th` and `<BreadcrumbPage>ไปให้</BreadcrumbPage>`, inside `Matrix`. Its play: six `navigation`s, and for each `const current = currentOf(nav) as HTMLElement;`, `await expect(current.scrollWidth).toBeLessThanOrEqual(current.clientWidth);` and `if (inVitest) await expectFrameCutsNoInk(current, nav);`

Row 15's `expectCutCrumb` keeps passing the `li`: on a cut crumb the crumb itself would draw the rest of the label. If a new step goes red, the builder reports the pixel and sends the call back here, as row 15 says.

Impact: Breadcrumb only. No token, no public API, no colour pair, no catalog line: `catalog/base/breadcrumb.yaml` says nothing about the padding.

## Screens to check in visual QA

Rows 20 and 43 name the stories, and screen 7 adds `FormEdge`. Look hard at these:

1. `Collapsed`, closed and hovered: the dots read as part of the trail at rest, and on hover and focus the pill may touch both slashes but leaves each one readable.
2. `Default` under Tab, Thai: the focus line clears "โปรเจกต์ทั้งหมด", marks included, at both corners. The halo reaches the slash and leaves it readable.
3. `Default`, focus on "5" against focus on "6", under Professional light: the halo is what tells them apart, since `focus.ring` and `border.strong` are close there.
4. `OnCard` with focus on the current page: the fill is gone and the focus line replaces the edge, so ink and halo carry it while focused.
5. `FirstPage` and `LastPage` under Friendly dark on a card: the lowest disabled pair, 3.3.
6. `At360`: a cut crumb and its slash. The cut falls between whole glyphs, so the gap before the slash was about 16 px on both long fixtures, where a whole crumb has 8. It reads as a cut, not as a fault, but it is the loosest spot in the trail.
7. `FormEdge`: the jump at 479 and 480 px, with the chevrons at the ends in the first and beside the numbers in the second.
8. `RecipesAndModes`: Friendly has no screenshot here, so this is its first look.
9. `RecipesAndModes` under Tab: a focused crumb beside the focused ellipsis's shape. In neutral and Friendly the crumb has a small corner and the ellipsis is a circle; in Professional it is 4 px against 6 px. This is A8's cost, and the closed-trail sheet shows it.
10. `NoCollapse` and `At360` in a 360 px frame, Thai: A9's cost. In `NoCollapse` the current crumb sits alone on a fourth line, where it fit on the third with under 4 px to spare. In `At360` the cut current crumb and the cut last link end on one edge, 4 px inside the frame, each with its ellipsis.

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

Row 15's focus step (ORV-229-design-2): the real Breadcrumb stories in Storybook, with D7's CSS added by `page.addStyleTag`, under real keyboard focus. Neutral, Friendly and Professional, light and dark, Thai and English, in the narrowest and widest frame each story allows. Console and page errors over the run: 0.

Contact sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/contact-sheet.png`

<!-- prettier-ignore -->
| Screen | Path |
| --- | --- |
| As built against the proposal, 4x, every profile and mode | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/study.png` |
| Neutral, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/neutral-light.png` |
| Neutral, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/neutral-dark.png` |
| Friendly, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/friendly-light.png` |
| Friendly, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/friendly-dark.png` |
| Professional, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/professional-light.png` |
| Professional, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/professional-dark.png` |
| A closed trail, real focus in each of the six cells of `RecipesAndModes`, crumb and ellipsis, 360 and 1440, Thai only since that story has no English | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/sheets/closed-trail.png` |

Each sheet is built from the single shots in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/shots/` and `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-2/shots/closed/`. In the `Default` sheets "หน้าแรก" and "Home" are underlined because the play leaves its forced hover on them; that is not part of the proposal.

The current crumb's ink (ORV-229-design-3): the real Breadcrumb stories on head a35da46 in Storybook, with D8 and D5 added by `page.addStyleTag`. Neutral and Friendly, light and dark, Thai and English, in a 360 px and a 1440 px frame, plus the 328 px frame of a 360 viewport for `At360`. `RecipesAndModes` shows all six cells, Professional among them. The label `ไปให้` of `CurrentInk` is shown by swapping the text of `Missing` in the browser, since that story is not built yet. Console and page errors over the run: 0.

Contact sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/contact-sheet.png`

<!-- prettier-ignore -->
| Screen | Path |
| --- | --- |
| F1 at 6x, as built against the proposal, each cell | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/ink.png` |
| A cut crumb at 4x, its start and its end, as built against the proposal | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/cut.png` |
| Neutral, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/neutral-light.png` |
| Neutral, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/neutral-dark.png` |
| Friendly, light | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/friendly-light.png` |
| Friendly, dark | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/friendly-dark.png` |
| One to four lines, the current crumb at the end of each | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/lines.png` |
| `RecipesAndModes`, all six cells, 360 and 1440 | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/sheets/matrix.png` |

Each sheet is built from the single shots in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/shots/` and its `study/` folder, 154 PNGs, listed in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-229-design-3/png-list.txt`. The figures are in `exhaust.json`, `holds.json`, `words.json`, `shots.json`, `lines.json` and `realplay-all.json` in the same folder.

The scratchpad is not kept. The main session copies these under `.orivilo/runs/` if they are to outlive the session.

## What this does not prove

- No component exists, so no play or acceptance row ran. The sizes above come from the injected markup, and Button is real only as its recipe, not its React.
- ORV-229-design-1 did not render Friendly; its colours are in the pair table. ORV-229-design-2 rendered it, with a 6 px crumb corner, so `RecipesAndModes` is its first look on the built component (QA screen 8).
- The clip was first measured by comparing `overflow: hidden` with `visible` on the worst sample in `expectLabelInkWhole` ("ฟื้ปั้ปี๊ฟื้"), at 2x, in neutral and Professional. At rest: 0 pixels cut on the link and on the current crumb. Under real keyboard focus: 0 in Professional, and 3 device pixels in neutral, from the pill's corner. That cut was accepted here, and the acceptance is withdrawn: see "Row 15, the focus step". The reading of 0 on the current crumb did not hold either: that one sample showed no cut, and the current crumb cuts ordinary labels at rest (see "The current crumb's ink, F1").
- Row 15's figures come from a Playwright port of `expectFrameCutsNoInk`, not from the helper. Against the built component the port is red at the pixel the builder reported, x 3, y 146, at 1x, so it reads what the helper reads. The helper itself runs on this only when the builder restores the step.
- The 4416 labels are Thai, in Chromium, in boxes that carry the crumb's recipe and an inline radius, not in a trail under real focus. Fifty-four real words and samples, Latin among them, ran in the story under real focus: 0 cut at radius 8 and under. Safari and Firefox draw marks a little differently, and radius 6 and 4 leave 2 px and more below the bound for that.
- Nothing guards the bound in a profile. A profile that sets `shape.check.radius` above 8 px brings the cut back, and row 15 runs only under neutral in Vitest. Friendly at 6 px was measured here, not by the play.
- F1's plays ran on a scratch copy of `packages/design-system` and `packages/intent-engine` with the worktree's dependencies linked in, not on a branch, and only in Chromium on the Mac. CI has not run them. The worktree holds no change under `packages/`.
- The end of a cut crumb is judged by eye, in the 4x crops. The helper cannot read it, since `overflow: visible` draws the rest of the name, so no play guards that end. The padding box and the whole-crumb plays guard the same clip.
- The 4416 labels ran in Chromium only. Safari and Firefox draw marks a little differently; 4 px leaves about 2 px past the widest ink measured.
- `CurrentInk` was not rendered in Storybook here, since it does not exist yet. Its look comes from `Missing` with the text swapped, and its play ran in the scratch copy.
- Open class: 16 other selectors in the clip-box list (`recipes.css` lines 4767 to 4782) pad only the block axis, as this crumb did. They were not measured here, and `expectLabelInkWhole` would not see an inline cut on any of them. DESIGN.md section 4 says a truncating label joins that list, which covers the block axis only.
- The 16 pairs were read from the token source with a scratch script, not from `pnpm contrast` or `recipes.test.ts`, since the pairs are not in `pairs.ts` yet.
- Target size: a crumb is 31.8 px high and a page link 40 px, under `size.touch` 44. A page link matches Button md, and the spec sets both, so neither is changed here.
- Frame edge: a first crumb's focus line overhangs the start edge by 4 px, plus the halo. A parent that clips flush with the trail cuts it, as it would cut any control's halo.
