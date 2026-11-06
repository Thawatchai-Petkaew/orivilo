---
issue: ORV-229 (https://tpetkaew.atlassian.net/browse/ORV-229)
lane: as set on ORV-229 in Jira (not read in this role); a new component public API is an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 26 ("Breadcrumb, Pagination")
design: docs/specs/ORV-229/design.md
version: 1.3
---

# ORV-229: Breadcrumb and Pagination (base)

## Benchmark

Two comparison tables in the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). The Untitled UI and shadcn/ui cells come from K-0320 to K-0332, as K-0339 sums them up, and each cell names its entry. The Ours row is K-0339's reading of the repo on 2026-11-06, rechecked in this worktree, plus the facts marked "read for this spec". The Add and Do not copy rows are this spec's choices; each points to the rule in "Rules" that holds it, and the designer's answers to open questions 1 to 11 stand at the top of that section.

### Breadcrumb

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | <https://www.untitledui.com/react/components/breadcrumbs.md>. Variants: `type` text (default), text-line, button; `divider` chevron (default), slash, with a per-item override (K-0320). Sizes: none on the page (K-0320). States: current only, the last item through the `isCurrent` render prop, a link with `aria-current="page"`, disabled and not focusable; no disabled item, loading or mobile rule on the page (K-0320, K-0322). Slots: `icon` (icon-only crumb when children are left out), `avatarSrc`, `Breadcrumbs.AccountItem` (K-0320). Collapse: `maxVisibleItems` default 4, 0 turns it off, a clickable ellipsis labelled "See all breadcrumb items" expands the trail in place; which crumbs stay is not stated (K-0321, K-0322). Landmark: `<nav aria-label="Breadcrumbs">` (K-0322). No code read (K-0322). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/breadcrumb>. Parts `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` over `nav`, `ol`, `li`; no variant, size, disabled or loading state named (K-0323). Slots: separator `children`, link `asChild` (Radix) or `render` (Base UI) (K-0323). Current: `span` with `role="link"`, `aria-disabled="true"`, `aria-current="page"` (K-0324). Collapse: none built in, `BreadcrumbEllipsis` placed by hand; registry examples: static, inside a `DropdownMenuTrigger` named by sr-only "Toggle menu", and responsive (keeps 3 items, `DropdownMenu` from 768 px, `Drawer` below, labels `max-w-20 truncate md:max-w-none`) (K-0325). Landmark: `nav aria-label="breadcrumb"`, overridable; separator and ellipsis `role="presentation"` and `aria-hidden="true"` (K-0324). |
| Ours | None: `coverage.md` line 28 lists Breadcrumb as `none`, and no component, story or catalog entry exists (K-0339). Nearest parts: Button `variant="link"` with `asChild` on a real anchor, and `iconOnly` with a required `aria-label` (`Button.tsx`, `button.yaml`); DropdownMenu (stable, a list of actions, named by its trigger, `dropdown-menu.yaml`); `--cmp-nav-item-*` tokens (`fg`, `fg-hover`, `fg-active`, `bg-hover`, `bg-active`, `bead`, `radius`, `height`, `component.json` lines 398 to 431), read today only by a foundations sample (`spec-sheet.tsx`, which also holds the one `aria-current="page"`). `icons.tsx` has no ChevronRight, ChevronLeft or MoreHorizontal glyph. `en.ts` has no breadcrumb group. DESIGN.md section 10 names breadcrumbs: no middot and no em dash; separate with a comma, colon, slash with spaces, or a line break (K-0339). Read for this spec: `DropdownMenuItem` takes no `asChild` and no `href` (`MenuItemProps`, `DropdownMenu.tsx` lines 64 to 73), so a menu item cannot be a real link today. |
| Add | A native `nav` with a localised, replaceable name: `nav-name-1`. An ordered list with hidden separators: `crumb-markup-1`. One current crumb: `crumb-current-1`. A router link through `asChild`: `crumb-api-1`. A look from the nav item tokens: `crumb-look-1`. A collapse by count, with the hidden crumbs reachable through a named control: `crumb-collapse-1`, `crumb-expand-1`. A cut for long labels as its own rule (K-0325): `crumb-cut-1`. A word for a missing name: `crumb-missing-1`. The collapsed trail story of audit D.3 row 26: AC rows 6 to 8. |
| Do not copy | English strings in the component ("Breadcrumbs", "See all breadcrumb items", `breadcrumb`, "More", "Toggle menu") (K-0322, K-0324, K-0325): every UI string comes from the locale catalog (AGENTS.md). `avatarSrc` and `AccountItem` (K-0320): Avatar is `none` in `coverage.md`, and an account switcher is a different job from a trail. `type="button"` padded crumbs (K-0320): DESIGN.md section 8 keeps "go somewhere" apart from buttons. `type="text-line"` (K-0320): rules around the trail are decoration no screen asks for. A static ellipsis with no control (K-0325): by our reading the hidden crumbs cannot be reached. The sr-only "More" inside an `aria-hidden` part (K-0324): by our reading it is never exposed. `span` with `role="link"` and `aria-disabled` (K-0324): by our reading neither the APG nor G65 names this form (K-0333, K-0337). A link that is disabled and cannot be focused (K-0322): the Untitled page gives no reason, and a non-link says the same with less (open question 1). A `DropdownMenu` or `Drawer` of hidden crumbs (K-0325): open question 5. |

### Pagination

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | <https://www.untitledui.com/react/components/pagination.md>. Variants: six forms (`PaginationPageDefault`, `PaginationPageMinimalCenter`, `PaginationCardDefault`, `PaginationCardMinimal`, `PaginationButtonGroup`, `PaginationCardAdvanced`), `rounded`, `align` (K-0326); carousel-style indicators `PaginationDot`, `PaginationLine` (K-0329). Sizes: `size` md (default), lg on the indicators only; none on the number forms (K-0326, K-0329). States: current (`aria-current="page"`, name "Page {value}"), Previous and Next disabled at the ends; no disabled page or loading on the page (K-0326, K-0328). Slots: Root, PrevTrigger, NextTrigger, Item, Ellipsis, Context; Item takes `asChild` or a render function (K-0326). Extras: rows per page Select 10, 25, 50, 100, a page input, first and last jumps (K-0326). Range: `siblingCount` default 1; every page listed while `siblingCount * 2 + 5` is at least `total` (7 at the default, own arithmetic), else ellipses with first and last kept (K-0327). Small screens: `Page {page} of {total}` between Previous and Next, from source only (K-0326). Landmark: `nav` "Pagination Navigation", hard-coded; `PaginationCardMinimal` "Pagination" (K-0328). Items: `<button role="listitem">`, no list, no `href` (K-0328). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/pagination>. Parts `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` over `nav`, `ul`, `li` (K-0330). Variants: link is `outline` when `isActive`, else `ghost` (K-0330). Sizes: Button `size`, `icon` on links, `default` on previous and next (K-0330). States: `isActive`; no disabled prop in the lines read (K-0330). Slots: `text` on previous and next in `bases/radix`, not in `new-york-v4` as read; the anchor is swapped by editing the file (K-0330). Range: none computed; pages and ellipsis written by hand; Icons Only drops numbers (K-0331). Small screens: the word hides below `sm` (K-0330). Landmark: `role="navigation"`, `aria-label="pagination"`, overridable; names "Go to previous page", "Go to next page"; `aria-hidden` ellipsis holding sr-only "More pages" (K-0332). |
| Ours | None: `coverage.md` line 29 lists Pagination as `none`, and no component, story or catalog entry exists (K-0339). Nearest parts: Button with variants `ghost`, `secondary`, `link`, sizes sm, md, lg, `asChild`, `iconOnly` (`Button.tsx`, `button.yaml`); Select and Input (stable) for rows per page and a page field; `--cmp-nav-item-*` tokens with `fg-active` and `bg-active` (`component.json`). Card uses `aria-current="true"` for a selected card (`Card.tsx`). `icons.tsx` has no ChevronLeft or ChevronRight glyph. `en.ts` has a `table` group and no pagination one. Tabs is not for this job: its catalog entry avoids "Navigation that changes the URL" (`tabs.yaml`). Audit D.3 row 26 scopes it to project and decision-log navigation (K-0339). Read for this spec: `apps/web/app` has four page routes (`/`, `/account`, `/directions`, `/workspace`), none for a project or a decision log; `src/examples/decision-log.tsx` holds five fixture rows in client state with no paging; `--cmp-nav-item-bg-active` is `surface.card` (`component.json` line 417); the Table already has a narrow form on a named container (`recipes.css` line 1340). |
| Add | A native `nav` with a localised, replaceable name: `nav-name-1`. A real list: `page-markup-1`. A computed range: `page-range-1`. Safe handling of a page number that comes from a URL: `page-bounds-1`. One current page with a mark that does not rely on colour alone: `page-current-1`. A rule for the ends: `page-ends-1`. A small-frame form: `page-form-1`. Page items as links: `page-api-1`, open question 4. Names in both locales: `nav-copy-1`. |
| Do not copy | `<button role="listitem">` with no list (K-0328): WAI-ARIA 1.2 requires a list parent, and ARIA in HTML does not allow the role on a button. The label "Pagination Navigation" (K-0328): the APG says not to use the role in the label (K-0335). `role="navigation"` on `nav` (K-0332): ARIA in HTML marks it NOT RECOMMENDED. English strings in the component (K-0328, K-0332): every UI string comes from the locale catalog (AGENTS.md). sr-only "More pages" inside `aria-hidden` (K-0332): by our reading it is never exposed. Previous and Next names that change between forms (K-0328): one control reads two ways. First and last jumps with no `aria-label` (K-0326): icon-only controls need a name (`button.yaml`). A page input that commits on every change (K-0326): by our reading each keystroke would navigate. Brand fill on the current dot and `isBrand` (K-0329): DESIGN.md section 8 keeps selected and brand apart. Dot and line forms for a list of pages (K-0329): the page calls them carousel-style indicators, and they show no number, while DESIGN.md section 7 asks for a difference that does not rely on colour alone. Hand-placed pages and ellipses (K-0331): each caller would redo the range. Rows per page and `rounded`, `align` (K-0326): no screen needs them (Out of scope). |

### Not read

K-0339 lists what no entry read, and this spec does not fill any of it from memory: the Untitled UI API tables for both pages (slug placeholders) and any breadcrumbs code (K-0320, K-0322, K-0326); Untitled's rule for which crumbs stay when collapsed (K-0321); the child element of `pagination-line.tsx` (K-0329); shadcn's Base UI and React Aria Pagination pages and its React Aria Breadcrumb page (K-0330); which registry example the shadcn Collapsed section renders (K-0325); the APG example's HTML and `breadcrumb.css` (K-0334). Where a rule below needs one of these, it says the rule is ours.

## Goal

Studio screens are about to need two ways to say where the person is: a trail from the project down to the page, and a way through a long list of decisions (audit D.3 row 26: "Project and decision-log navigation"). Neither component exists, so each screen would hand-build its own `nav`, its own current mark and its own Thai names. This story gives the design system one Breadcrumb and one Pagination, with the current page marked `aria-current` and a collapsed trail story, the audit's two done-when lines.

What is simulated: nothing in the components. They render real markup. No route uses them yet: the stories run on fixture trails and fixture links (`#page-5`), labelled as fixtures, and `page` and `total` are props the caller passes, not data this story reads.

## Story

As a person working in a project, I see where I am as a short trail of places I can go back to, with the page I am on marked as the current one. On a long list, I move page by page, or jump to a page number, and I can always tell which page I am on, on a phone too.

## Rules

### nav-name-1

Both components render a native `nav`, never `role="navigation"` (K-0332), named by `aria-label`. The name defaults to the catalog's `breadcrumb.label` or `pagination.label`, and a caller's `aria-label` prop replaces it, because each navigation landmark on a page takes a unique label without the role word (K-0335, K-0338). A story with several copies in one document names each copy after its cell, in the form of `Cell` in `ScrollArea.stories.tsx` (lines 54 to 62), so axe's `landmark-unique` rule stays on. `matrix.tsx` lines 68 and 69 say a component has no landmark; these two have one.

### nav-glyphs-1

Three exports go in `src/components/icons.tsx` through its `lucide()` helper: `EllipsisIcon` (Lucide `Ellipsis`), `ChevronLeftIcon` (`ChevronLeft`) and `ChevronRightIcon` (`ChevronRight`). DESIGN.md section 6 puts Lucide first, and the installed `lucide-react.d.ts` exports all three (lines 26525, 26526, 26776). Nothing is drawn. The Breadcrumb PR adds `EllipsisIcon`; the Pagination PR adds the two chevrons. No new runtime dependency comes with this story, so it brings no dependency security review. An `iconOnly` Button gives its child no size, so the recipes size the glyphs inside `.ds-breadcrumb` and `.ds-pagination`, and the gap glyph, to `--cmp-button-icon-size-md`.

### nav-copy-1

Eight keys go in two new groups, `breadcrumb` and `pagination`, in `src/i18n/messages/th.ts` and `en.ts` (table "Copy"). A page number prints as `String(n)`, Arabic digits with no grouping, in both locales. The Thai `pagination.page` keeps its space, so axe `label-content-name-mismatch` finds the digit as a word of the name (the finding of ORV-217 `copy-name-1`). The components hold no other string; the separator slash of `crumb-markup-1` is punctuation, not copy.

### crumb-api-1

Three new public parts in `src/components/breadcrumb/Breadcrumb.tsx`, exported from `@orivilo/design-system`:

- `Breadcrumb` (contract type `BreadcrumbProps`): `children`, `maxVisible` (`crumb-collapse-1`), `aria-label` (`nav-name-1`), `className` for layout only. A client component: it holds the expand state.
- `BreadcrumbLink` (`BreadcrumbLinkProps`): `href`, `asChild`, `children`, `className` for layout only. An `a`, or with `asChild` the child through Radix Slot, as Button does (`Button.tsx` line 59, K-0323).
- `BreadcrumbPage` (`BreadcrumbPageProps`): `children`, `className` for layout only.

`BreadcrumbLink` and `BreadcrumbPage` read the catalog (`crumb-missing-1`), so all three are client components. The caller writes the crumbs as direct children, in trail order. `Breadcrumb` counts them with `Children.toArray` (an array flattens; a Fragment counts as one crumb), wraps each in its `li`, and adds the separators and the ellipsis itself, so shadcn's `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbSeparator` and `BreadcrumbEllipsis` are not public parts. There is no variant and no size. A label is a React text child, never HTML. An `href` comes from route code, never from user text.

### crumb-markup-1

`nav.ds-breadcrumb` holds `ol.ds-breadcrumb__list` (K-0334), which holds one `li.ds-breadcrumb__item` per shown crumb and one for the ellipsis. An item that is not the last ends in `span.ds-breadcrumb__separator` with `aria-hidden="true"`, holding a slash, with `--ds-space-inline-md` on each side: DESIGN.md section 10 names a slash with spaces for breadcrumbs. No part sets a `role`. The list wraps between items. The trail adds no key handling (K-0333, K-0334): its links and its button are native.

### crumb-current-1

`BreadcrumbPage` renders `span.ds-breadcrumb__page` with `aria-current="page"`, and no `href`, `role`, `tabindex` or `aria-disabled`, so it is not a Tab stop (G65 step 5 and Example 1, K-0337). `aria-current` is optional on a non-link (K-0333); it is set here because audit row 26 asks for it and ARIA26 exposes the visual mark (K-0338). The caller places one `BreadcrumbPage`, last (K-0336), and the catalog entry says so. A trail with none is all links, which G65 step 4 accepts (K-0337).

### crumb-look-1

The trail reads the nav item tokens. A link sets `--cmp-nav-item-fg` in `type.body.sm` (the `--ds-type-body-sm-*` properties), with no underline at rest. On hover it sets `--cmp-nav-item-fg-hover` and an underline, an ink and shape change (DESIGN.md section 7). The current crumb sets `--cmp-nav-item-fg-active` in `type.label.md` (the `--ds-type-label-md-*` properties, weight 500), with no fill, no underline and no hover change, so it differs from a link by weight and behaviour, not by colour alone. The separator sets `--cmp-nav-item-fg`. Focus is the global `:focus-visible` line and halo (`orivilo.css` lines 74 to 78); no breadcrumb class sets its own line or halo. A link takes `--ds-space-inline-sm` of inline padding, cancelled by a negative margin so no ink moves, and `--ds-shape-check-radius` while focused, so the line clears the glyphs. The current crumb takes the same padding and margin, because its box clips its text too and Thai marks overhang both ends of a label; it has no fill, so the padding never shows. A link's box clips its text, so its focus corner rounds that clip too, and it stays at 8 px or under in every profile: a pill in a 32 px line cuts Thai marks at both ends of a label. W8 lists the profiles. A link or a current crumb that ends the trail keeps no negative end margin, so it cannot leave its frame. The list and each item keep `min-block-size: var(--ds-size-control-sm)`, so a press on the ellipsis does not change the height of a one-line trail, and every line of a wrapped trail has one height, with or without the ellipsis. Open questions 2 and 3 hold the choice of tokens.

### crumb-hover-1

A Breadcrumb play forces hover and does not rely on `userEvent.hover`, because a synthetic pointer sets no `:hover`. The story meta sets `parameters.pseudo` (`hover-force-1` in `docs/specs/ORV-84/spec.md`) with a hover selector that matches nothing, so the addon rewrites the `:hover` rules to `.pseudo-hover` and no element takes the class at render. The play reads the rest state first, then adds the `pseudo-hover` class to the element itself, so one element shows both states; the class stays on that element for the rest of the play. What is simulated: this shows and tests the hover look, and does not prove that a pointer reaches it.

A play reads an expected ink with `resolvedColor` once, outside `waitFor`, and compares only the computed colour inside it. `resolvedColor` adds and removes a probe node, and that change makes `waitFor` run its callback again, so a read inside it never ends.

### crumb-collapse-1

`maxVisible` defaults to 4 (K-0321), and 0 turns collapsing off (K-0321). It counts crumbs, not the ellipsis. A value that is not a whole number, or is below 0, reads as the default; 1 reads as 2. When the crumbs number more than `maxVisible`, the first crumb stays, the ellipsis follows it, and the last `maxVisible - 1` crumbs stay. Hidden crumbs are not rendered. Which crumbs stay is this spec's rule: Untitled's was not read (K-0321), and shadcn's example keeps 3 by hand (K-0325). The method is `collapseTrail(count, maxVisible)` in `src/components/breadcrumb/collapse.ts`, a pure function, not a package export. Worked example W1.

### crumb-expand-1

The ellipsis is a `Button` `variant="ghost"` `size="sm"` `iconOnly` with `EllipsisIcon`, named `breadcrumb.showAll`. Inside the trail it reads `--cmp-nav-item-fg`, and `--cmp-nav-item-fg-hover` on hover and press, and a negative inline margin of `--ds-space-inline-md` takes back the empty part of its 32 px square. A press (mouse, Enter or Space, Button's own) renders the hidden crumbs in place and in order, and removes the button (K-0321). Focus then moves to the link of the first crumb revealed, because the control that held it is gone. The trail stays expanded until the component unmounts, so the control carries no `aria-expanded`. It adds no live region: the focus move speaks. There is no menu and no portal, so no `PortalScope` and no `InsideProfile` story apply. The sources set out no keyboard rule for this control, and word searches of the APG pattern and G65 found nothing on collapsing a trail (K-0339); this rule is ours.

### crumb-cut-1

A crumb's label stays on one line. `.ds-breadcrumb__item` is a flex row with `min-inline-size: 0` and `max-inline-size: 100%`. `.ds-breadcrumb__link` and `.ds-breadcrumb__page` take `min-inline-size: 0`, `overflow: hidden`, `text-overflow: ellipsis` and `white-space: nowrap`, and the separator takes `flex: none`. So the trail wraps first, and only a crumb wider than a whole line is cut, at the end of its line, with no new value and no token. Both classes join the clip-box selector list in `recipes.css` (lines 4767 to 4782, DESIGN.md section 4). The whole text stays in the DOM, so the accessible name is never cut. `li`, `ol` and `nav` keep `overflow: visible`, so a focus halo is not clipped. The inline padding and the end margin of a link and of the current crumb are in `crumb-look-1`.

The design's first clip figures were an analogue, from one sample at the start corner. On the built component a pill cut marks at both corners, so the focus corner is `--ds-shape-check-radius` (`crumb-look-1`). Row 15 proves it. `expectLabelInkWhole` reads a clone that never has focus, so the focus step is `expectFrameCutsNoInk` on the focused link, which has no tolerance. If that step goes red, the builder reports the pixel the helper names and does not widen the helper, drop the step or change the radius: no cut is accepted, so the call goes back to the designer. `expectLabelInkWhole` reads ink above the box only, and row 15's `expectFrameCutsNoInk(item, frame)` leaves the crumb's own clip on, so neither sees a cut at an inline end. Rows 11 and 45 read that cut: `expectFrameCutsNoInk(current, nav)` on a current crumb that is whole, since on a cut crumb the helper would draw the rest of the label.

### crumb-missing-1

A `BreadcrumbLink` without `asChild`, or a `BreadcrumbPage`, whose `children` are `undefined`, `null` or `""` shows `breadcrumb.missing`. DESIGN.md section 4 lists a missing value among the fixtures of every component, and a blank crumb would be a link with no name. The link still goes to its `href`. With `asChild` the child owns its text.

### page-api-1

One new public part in `src/components/pagination/Pagination.tsx`, exported from `@orivilo/design-system`: `Pagination` (contract type `PaginationProps`), since a computed range leaves nothing for a caller to compose. Props: `page` (1 is the first page), `total` (a count of pages; the caller computes it, as `Math.ceil(totalItems / pageSize)` in K-0326), `hrefPattern`, `siblingCount` (`page-range-1`), `linkAs`, `aria-label` (`nav-name-1`), `className` for layout only. It holds no state: the URL owns the page.

`hrefPattern` is a string that holds `{page}`, filled by `fill` from `src/i18n/messages/index.ts` (W5). It is a string so that a server page can pass it to this client component, where a function prop could not cross. It comes from route code, never from user text. `linkAs` is the element type that renders each link, default `"a"`; a router passes its own client link there.

### page-markup-1

`nav.ds-pagination` is a block that fills its parent and the named container `ds-pagination` (`container-type: inline-size`). In a flex parent the caller gives it a width, and the catalog entry says so. It holds `ul.ds-pagination__list` (K-0330), with `li` items in this order: Previous, the slots of `page-range-1`, `li.ds-pagination__status`, Next. A page slot is `li.ds-pagination__page` holding `a.ds-pagination__link` through `linkAs`, with the digit as its text and `pagination.page` as its `aria-label`. A gap slot is `li.ds-pagination__gap` with `aria-hidden="true"`, holding `EllipsisIcon` and no text, sr-only text included (K-0328, K-0332). From 480 px up the list wraps, so a large `siblingCount` wraps in a small frame and never overflows; the catalog entry says that above 2 it wraps below 568 px (W6).

### page-range-1

The method is `pageRange(page, total, siblingCount)` in `src/components/pagination/range.ts`, a pure function, not a package export. `siblingCount` defaults to 1 (K-0327); a value that is not a whole number, or is below 0, reads as 1. With `s` for `siblingCount`: while `2s + 5` is at least `total`, every page is listed. Otherwise the row keeps the first and the last page, and `left = max(page - s, 1)`, `right = min(page + s, total)`. When `left` is 2 or less, the row is pages 1 to `2s + 3`, a gap, `total`. When `right` is `total - 1` or more, it is 1, a gap, the last `2s + 3` pages. Otherwise it is 1, a gap, `left` to `right`, a gap, `total`. K-0327 gives the threshold and the three cases; the block length `2s + 3` is this spec's, chosen so that the row always holds `2s + 5` slots and does not change width between pages. Worked example W2.

### page-bounds-1

A `total` that is not a whole number, or is below 2, renders nothing: no `nav`, since there is nowhere to go. A `page` that is not a whole number reads as 1; below 1 reads as 1; above `total` reads as `total`. The method is `clampPage(page, total)` in `src/components/pagination/range.ts`, a pure function, not a package export. The component never throws on these values, because they come from a URL. Worked example W4.

### page-current-1

The slot of `page` has `aria-current="page"` (K-0328, K-0332, K-0336) and stays a real link with its `href`: both libraries read keep the item interactive. At rest a link sets `--cmp-nav-item-fg`, a transparent 1 px border, `--cmp-nav-item-radius`, `min-block-size` and `min-inline-size` of `--cmp-nav-item-height`, and the `--ds-type-control-md-*` properties. On hover a link that is not current sets `--cmp-nav-item-fg-hover` on `--cmp-nav-item-bg-hover`. The current page sets `--cmp-nav-item-fg-active` on `--cmp-nav-item-bg-active`, with its border in `--ds-border-strong` and no hover change. The border is the mark that does not rely on colour: `bg-active` is `surface.card`, so on a card the fill vanishes and only ink would be left (DESIGN.md section 7). It is neutral ink, so it reads neither as `focus.ring` nor as `surface.selected` (open question 2). Focus turns the link's own border to `--ds-focus-ring` with `--_focus-shadow-border` (`recipes.css` lines 177 to 182, the Button form).

### page-ends-1

Previous and Next are `Button` `variant="ghost"` `size="md"` `iconOnly` with `ChevronLeftIcon` and `ChevronRightIcon`, named `pagination.previous` and `pagination.next` in every form. Between the ends each is `Button asChild` over `linkAs`, with the `href` of `page - 1` or `page + 1`. On the first page Previous, and on the last page Next, is a native `<Button disabled>`: not a link, not a Tab stop, still in its place, so the row does not shift (K-0328). Inside `.ds-pagination` its ink is `--ds-text-disabled`, because `button.ghost.fg-disabled` is `text.secondary`, the ink of a live page number.

### page-form-1

Inside `@container ds-pagination (max-width: 479px)`, the form and the 480 px edge the Table and the task bar use, `.ds-pagination__page` and `.ds-pagination__gap` take `display: none`, so no empty `li` stays in the list, and `li.ds-pagination__status` shows `pagination.status`, in `type.body.sm` and `--cmp-nav-item-fg`, between Previous and Next (K-0326), and the list stops wrapping and spreads, so Previous and Next hold the two ends. From 480 px up the status takes `display: none`. In the narrow form no page link is in the accessibility tree and the status says the page in plain text. It is not a live region, because a page change is a navigation. Worked example W3 gives the width that sets this.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| `Breadcrumb`, `BreadcrumbLink`, `BreadcrumbPage` and their `*Props` types (`crumb-api-1`) | Component API | New exports in `src/components/index.ts`; new `catalog/base/breadcrumb.yaml` (story `base-breadcrumb`, status `draft`, recipes neutral, professional, friendly, states default, hover, focus-visible, current, collapsed, expanded); `catalog/coverage.md` line 28 goes to `draft` and `base-breadcrumb` |
| `Pagination` and `PaginationProps` (`page-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/pagination.yaml` (story `base-pagination`, status `draft`, recipes as above, states default, hover, focus-visible, current, disabled); `catalog/coverage.md` line 29 goes to `draft` and `base-pagination` |
| Recipe classes `ds-breadcrumb`, `ds-breadcrumb__list`, `__item`, `__link`, `__page`, `__separator` | Recipe | `recipes.css`, values from existing `--cmp-*` and `--ds-*` properties (`crumb-look-1`, `crumb-markup-1`); `__link` and `__page` join the clip-box list (`crumb-cut-1`). Two scoped rules on the ghost Button inside the trail (`design.md` D10, D11). `recipes.test.ts` checks the file |
| Recipe classes `ds-pagination`, `ds-pagination__list`, `__page`, `__link`, `__gap`, `__status` and one `@container ds-pagination` block | Recipe | `recipes.css`, values from existing properties (`page-current-1`, `page-form-1`). Other Button recipes untouched: Previous and Next are Buttons, and the only rules on them are scoped to `.ds-pagination` (`design.md` D11, D20) |
| Sixteen colour pairs | Recipe pairs | `pairs.ts`. Breadcrumb, text 4.5: `nav-item.fg`, `nav-item.fg-hover`, `nav-item.fg-active`, each on `ds:surface.canvas` and on `ds:surface.card`. Pagination, text 4.5: `nav-item.fg` on `ds:surface.canvas` and on `ds:surface.card`, `nav-item.fg-hover` on `nav-item.bg-hover`, `nav-item.fg-active` on `nav-item.bg-active`. Pagination, UI 3.0: `ds:border.strong` on `ds:surface.canvas` and on `ds:surface.card`. Breadcrumb, text 4.5: `nav-item.fg-hover` on `button.ghost.bg-hover` and on `button.ghost.bg-press`. Pagination, UI 3.0: `ds:text.disabled` on `ds:surface.canvas` and on `ds:surface.card`. No `nav-item` pair is listed today, so `recipes.test.ts` proves these under three profiles and both modes for the first time; a pair under its floor is a token finding, which the builder reports and does not patch with a raw value |
| Eight locale keys in two new groups (`nav-copy-1`) | Locale catalog | `th.ts`, `en.ts`; `check-i18n` and `i18n.test.ts` check key and placeholder parity |
| Three icon exports (`nav-glyphs-1`) | Icon module | `icons.tsx` only. Its comment at line 64 counts 53 glyphs while the file imports 51 today; the builder counts again in the same edit |
| `breadcrumbFixtures`, `paginationFixtures` | Fixture | `src/components/fixtures.ts` only |

Not changed: no token in any layer, no profile, `Button`, `DropdownMenu`, `Matrix`, `Table`, `DESIGN.md`, `apps/web`, `src/examples/decision-log.tsx`. No new runtime dependency.

## Copy

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | --- | --- |
| `breadcrumb.label` | เส้นทางถึงหน้านี้ | Breadcrumb |
| `breadcrumb.showAll` | แสดงเส้นทางทั้งหมด | Show the full path |
| `breadcrumb.missing` | ไม่มีชื่อ | No name |
| `pagination.label` | เลขหน้า | Pages |
| `pagination.page` | หน้า {page} | Page {page} |
| `pagination.previous` | หน้าก่อนหน้า | Previous page |
| `pagination.next` | หน้าถัดไป | Next page |
| `pagination.status` | หน้า {page} จาก {total} | Page {page} of {total} |

Fixture copy for the stories, not catalog keys. `breadcrumbFixtures.trail` holds six crumbs, each with a `#` link; `Default` uses the first three, the third as the current crumb. `paginationFixtures` holds `hrefPattern` `#page-{page}`, `page` 5 and `total` 12. The second trail of `At360` opens on `ฟื้ปั้ปี๊กี๊`, a stack at the start corner and `กี๊` at the end corner: a test string, shown in that story only. `CurrentInk` shows `ไปให้` as its current crumb, a word whose marks overhang both ends of its box: a test string, shown in that story only.

<!-- prettier-ignore -->
| Crumb | Thai | English |
| --- | --- | --- |
| 1 | หน้าแรก | Home |
| 2 | โปรเจกต์ทั้งหมด | All projects |
| 3 | โปรเจกต์ Brand Canvas ของทีม (`fixtures.mixed`) | The team's Brand Canvas project |
| 4 | บอร์ด | Board |
| 5 | บันทึกการตัดสินใจ | Decision log |
| 6 | ใช้ Orbit violet เป็นสีของการกระทำหลัก (`DECISIONS[0].title`) | Use Orbit violet as the main action colour |

## Acceptance criteria

Stories: `Base/Breadcrumb` (id `base-breadcrumb`) and `Base/Pagination` (id `base-pagination`), each a new `*.stories.tsx` beside its component. Plays run in Thai; an `InEnglish` story nests `LocaleProvider locale="en"` and the English fixtures. Hover and focus are play steps, not props. English covers each catalog state: default, current, hover and focus (rows 12 and 34), collapsed and expanded (row 13), disabled (rows 35 and 36). Breadcrumb stories: `Default`, `DefaultInEnglish`, `Collapsed`, `CollapsedInEnglish`, `CollapsedKeyboard`, `NoCollapse`, `RouterLink`, `Missing`, `MissingInEnglish`, `At360`, `At360InEnglish`, `RecipesAndModes`, `CurrentInk`. Pagination stories: `Default`, `DefaultInEnglish`, `FirstPage`, `FirstPageInEnglish`, `LastPage`, `LastPageInEnglish`, `FewPages`, `SinglePage`, `OutOfRange`, `OnCard`, `RouterLink`, `FormEdge`, `At360`, `At360InEnglish`, `RecipesAndModes`.

`expectFrameCutsNoInk(el, frame)` is in `src/testing/visual-asserts.ts` (line 1288), merged with PR 186, so rows 11, 15, 16, 37, 38 and 45 wait on nothing.

The design's proof was injected CSS and markup in Chromium, so a size in it binds nothing until a row below holds it on the built component: A1 row 22; A2 rows 4, 15 and 16; A3 rows 1, 6 and 15; A4 rows 6 and 13; A5 rows 26 and 27; A6 rows 19 and 42; A7 rows 6, 22, 37, 38 and 39; A8 rows 4 and 15; A9 rows 2, 11, 15, 16 and 45. The CSS of each rule is in `design.md`, rows D1 to D21.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | `Default` renders | One line: "หน้าแรก / โปรเจกต์ทั้งหมด / โปรเจกต์ Brand Canvas ของทีม" | None. `getByRole("navigation", { name: "เส้นทางถึงหน้านี้" })` holds one `list` of three `listitem`s and two `link`s, in that order; the list's computed `minHeight` is `32px`, and each `listitem`'s computed `minHeight` is `32px` (`nav-name-1`, `crumb-markup-1`, `crumb-look-1`) | `Default` play |
| 2 | Same | `Default` renders | "โปรเจกต์ Brand Canvas ของทีม" in the heavier weight and darker ink, not a link | None. `querySelectorAll("[aria-current]")` has length 1, its element reads `aria-current="page"` and that text; `queryByRole("link", { name: "โปรเจกต์ Brand Canvas ของทีม" })` is null; the element has no `role`, `tabindex` or `aria-disabled`; its computed `fontWeight` is 500 and a link's is 400; its computed `paddingInlineStart` is `4px` and `marginInlineStart` is `-4px` (`crumb-current-1`, `crumb-look-1`, W7) | `Default` play step |
| 3 | Same | `Default` renders | A slash between two crumbs, none after the last | None. Two `.ds-breadcrumb__separator`, both `aria-hidden="true"`; `getByRole("link", { name: "หน้าแรก" })` matches exactly, with no slash in the name (`crumb-markup-1`) | `Default` play step |
| 4 | Same | Tab, Tab, Tab | Focus lands on "หน้าแรก", then "โปรเจกต์ทั้งหมด", then leaves the trail; the focused link shows the focus line and halo | None. `toHaveFocus()` in that order; after the third Tab `nav.contains(document.activeElement)` is false; on a focused link computed `outlineColor` equals `resolvedColor(link, "--ds-focus-ring")`, `outlineWidth` is `1px`, `boxShadow` ends in `0px 0px 0px 4px`; on a focused link computed `borderTopLeftRadius` equals `getComputedStyle(link).getPropertyValue("--ds-shape-check-radius")`, `paddingInlineStart` is `4px` and `marginInlineStart` is `-4px`. These steps run after row 5, so "หน้าแรก" still holds the forced hover of `crumb-hover-1` (`parameters.pseudo` and the `pseudo-hover` class); `.ds-breadcrumb__link:hover` sets only `color` and `text-decoration`, and this row reads neither (`crumb-current-1`, `crumb-look-1`, `crumb-hover-1`, W7, W8) | `Default` play step |
| 5 | Same | The pointer rests on "หน้าแรก", then on the current crumb | The link darkens and gains an underline; the current crumb does not change | None. Under the forced hover of `crumb-hover-1` (`parameters.pseudo` and the `pseudo-hover` class), inside `waitFor`, link `color` equals the ink `resolvedColor(link, "--cmp-nav-item-fg-hover")` read outside `waitFor`, and `textDecorationLine` is `underline`; the current crumb's `color` and `textDecorationLine` are the same before and after the class is added (`crumb-look-1`, `crumb-hover-1`) | `Default` play step |
| 6 | Same | `Collapsed` renders the six crumbs at the default `maxVisible` | "หน้าแรก / ... / บอร์ด / บันทึกการตัดสินใจ / ใช้ Orbit violet เป็นสีของการกระทำหลัก", with "..." an ellipsis button | None. Five `listitem`s, three `link`s, and `getByRole("button", { name: "แสดงเส้นทางทั้งหมด" })`; `queryByRole("link", { name: "โปรเจกต์ทั้งหมด" })` and the crumb 3 link are null. The button's computed `color` equals `resolvedColor(button, "--cmp-nav-item-fg")`, and under the forced hover of `crumb-hover-1` (`parameters.pseudo` and the `pseudo-hover` class), inside `waitFor`, it equals the ink `resolvedColor(button, "--cmp-nav-item-fg-hover")` read outside `waitFor`; its `marginInlineStart` is `-8px`; its `svg` is 16 px wide by `getBoundingClientRect()`; `expectSameHeight` holds across the five `listitem`s, the ellipsis item included (`crumb-collapse-1`, `crumb-expand-1`, `crumb-look-1`, `crumb-hover-1`, `nav-glyphs-1`, W1 row `6 4`, W7) | `Collapsed` play |
| 7 | Same, after row 6 | The ellipsis button is clicked | Six crumbs in order; the button is gone; focus is on "โปรเจกต์ทั้งหมด" | None. Six `listitem`s, five `link`s, `queryByRole("button")` is null, the "โปรเจกต์ทั้งหมด" link `toHaveFocus()`, not `document.body` (`crumb-expand-1`) | `Collapsed` play step |
| 8 | Same | `CollapsedKeyboard`: Tab, Tab, Enter | Focus goes "หน้าแรก", the ellipsis button, then the trail opens with focus on "โปรเจกต์ทั้งหมด" | None. `toHaveFocus()` in that order; six `listitem`s after Enter (`crumb-expand-1`) | `CollapsedKeyboard` play |
| 9 | Same | `NoCollapse` renders a six-crumb trail with `maxVisible={0}` and a four-crumb trail at the default, with the `aria-label`s "เส้นทาง ก" and "เส้นทาง ข" | Both trails whole, no ellipsis | None. Two `navigation`s, each found by its own name; no `button` in the canvas; 6 and 4 `listitem`s (`crumb-collapse-1`, `nav-name-1`, W1 rows `6 0` and `4 4`) | `NoCollapse` play |
| 10 | Same | `RouterLink` renders a `BreadcrumbLink asChild` over a story `StoryLink` that sets `data-router` | The same trail | None. The link is one anchor with `data-router`, the class `ds-breadcrumb__link` and its `href`; `querySelectorAll("a a")` has length 0 (`crumb-api-1`) | `RouterLink` play |
| 11 | Same | `Missing` renders a link crumb and a current crumb with `fixtures.missing` | "ไม่มีชื่อ" in both places, never a blank | None. `getByRole("link", { name: "ไม่มีชื่อ" })` keeps its `href`; the current crumb reads "ไม่มีชื่อ" with `aria-current="page"`; `expectFrameCutsNoInk(current, nav)` passes, with `current` the crumb itself, which is not cut, and the step guarded by `inVitest` (`crumb-missing-1`, `crumb-look-1`, `crumb-cut-1`) | `Missing` play |
| 12 | Same, English | `DefaultInEnglish` renders, then Tab, then the pointer rests on "Home" | "Home / All projects / The team's Brand Canvas project"; "Home" takes the focus line and halo, then an underline | None. `navigation` named "Breadcrumb"; two `link`s; the current crumb has `aria-current="page"`; the "Home" link `toHaveFocus()`, and under the forced hover of `crumb-hover-1` (`parameters.pseudo` and the `pseudo-hover` class), inside `waitFor`, its `textDecorationLine` is `underline` (`nav-copy-1`, `crumb-current-1`, `crumb-look-1`, `crumb-hover-1`) | `DefaultInEnglish` play |
| 13 | Same, English | `CollapsedInEnglish` renders, then the ellipsis button is clicked | "Home / ... / Board / Decision log / Use Orbit violet as the main action colour", then six crumbs | None. `button` named "Show the full path", with the rest `color`, the `marginInlineStart` and the hover `color` of row 6, the last under the forced hover of `crumb-hover-1` (`parameters.pseudo` and the `pseudo-hover` class), its ink read outside `waitFor`; after the click the "All projects" link `toHaveFocus()` (`crumb-expand-1`, `crumb-hover-1`) | `CollapsedInEnglish` play |
| 14 | Same, English | `MissingInEnglish` renders | "No name" in both places | None. `link` named "No name" (`crumb-missing-1`) | `MissingInEnglish` play |
| 15 | Storybook, a 360 px `Narrow` frame, Thai | `At360` renders a four-crumb trail with `fixtures.longThai` as crumb 2 and as the current crumb, and a second trail under the `aria-label` "เส้นทาง ก", two links, `ฟื้ปั้ปี๊กี๊` then `fixtures.longThai`; then Tab reaches the first link of the second trail | Short crumbs stay whole; each long Thai name sits on its own line, cut with an ellipsis at the line's end; no horizontal scroll; no Thai mark is cut, at rest or under focus | None. Frame `scrollWidth` not above 360. Every ancestor of each long crumb up to the frame has computed `overflow` `visible`. On each long crumb, the last link of the second trail included: `scrollWidth` above `clientWidth`; `expectLabelInkWhole(el)` passes; `expectFrameCutsNoInk(item, frame)` passes, with `item` the crumb's `li`, because the helper forces its first argument to `overflow: visible`, which on the crumb itself would draw the rest of a cut label. The last link of the second trail and the current crumb each have computed `marginInlineEnd` `0px`. `expectSameHeight` holds across the `listitem`s of each trail. `within(nav).getByRole("link", { name: fixtures.longThai })` finds the whole name in each trail. Under keyboard focus on the first link of the second trail, which is not cut, `expectFrameCutsNoInk(link, frame)` passes: this step settles the focus clip (`crumb-cut-1`, `crumb-look-1`) | `At360` play, the ink steps guarded by `inVitest` |
| 16 | Same, English | `At360InEnglish` renders with `fixtures.longLatin` as crumb 2 and as the current crumb, and a second trail under the `aria-label` "Trail A", two links, "Home" then `fixtures.longLatin` | The same, in English | None. The same checks as row 15 on `fixtures.longLatin`, without the focus step, since Latin stacks no marks (`crumb-cut-1`, `crumb-look-1`) | `At360InEnglish` play, the ink steps guarded by `inVitest` |
| 17 | Storybook test project | `RecipesAndModes` renders through `Matrix`, one collapsed trail per cell, in a `Cell` named from `useDesignProfile()` | Six boundaries (neutral, professional, friendly, each light and dark), each with a trail | None. Six `navigation`s with six different names; six `[aria-current="page"]`; `landmark-unique` not turned off (`nav-name-1`); colours from the pairs of the contract table, proven by `recipes.test.ts` and `pnpm contrast` | `RecipesAndModes` play count |
| 18 | Vitest, node | `collapse.test.ts` runs the six cases of W1 | Not a screen | `collapseTrail` returns W1's kept and hidden lists; a mutant that keeps `maxVisible` crumbs after the first goes red (`crumb-collapse-1`) | `collapse.test.ts` |
| 19 | The Breadcrumb PR head | `check-catalog`, `check-i18n`, `i18n.test.ts`, the copy check, `recipes.test.ts` and the a11y addon run | Not a screen | `catalog/base/breadcrumb.yaml` resolves to `base-breadcrumb`; the three `breadcrumb` keys exist in Thai and English; `pairs.ts` holds the eight Breadcrumb pairs of the contract table, at their floors under `recipes.test.ts` and `pnpm contrast`; no middot or em dash in new files; zero a11y violations in the thirteen Breadcrumb stories listed above | `pnpm --filter @orivilo/design-system test`, `pnpm contrast` |
| 20 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Collapsed` (closed and opened), `Missing`, `NoCollapse`, `At360`, `At360InEnglish`, `RecipesAndModes`, `CurrentInk` | The trail reads as quiet navigation; the current crumb reads as "here" and not as a link or a selected row; the slash spacing is even in Thai and Latin; the cut reads as a cut; no mark of the current crumb is cut at either end; the ellipsis holds its ink on hover and press | None | Designer visual sign-off. A sign-off has an empty `write_set`, so its PNG paths are posted as a Jira comment on ORV-229, which confirms on the built component the answers to open questions 1, 3, 5, 7 and 9 and the `design.md` visual QA screens 1, 2, 6, 8, 9 and 10 |
| 21 | The Breadcrumb PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/breadcrumb`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 22 | Storybook test project, neutral, light, Thai, a frame of 720 px | `Default` renders page 5 of 12 | A chevron left, "1 ... 4 5 6 ... 12", a chevron right | None. `getByRole("navigation", { name: "เลขหน้า" })` holds one `list` of seven `listitem`s (Previous, five pages, Next); page links named "หน้า 1", "หน้า 4", "หน้า 5", "หน้า 6", "หน้า 12" with `href`s `#page-1`, `#page-4`, `#page-5`, `#page-6`, `#page-12`; each chevron `svg` and each gap `svg` is 16 px wide by `getBoundingClientRect()` (`page-markup-1`, `page-range-1`, `nav-glyphs-1`, W2 row `5/12`, W5, W7) | `Default` play |
| 23 | Same | `Default` renders | "5" stands out in dark ink inside a thin dark edge; the other numbers have no edge | None. `querySelectorAll("[aria-current]")` has length 1: the link "หน้า 5", with `aria-current="page"`, `href` `#page-5` and text "5" (`page-current-1`) | `Default` play step |
| 24 | Same | `Default` renders | Two ellipsis marks | None. Two `.ds-pagination__gap`, both `aria-hidden="true"`, with empty `textContent`, no `.sr-only` inside (`page-markup-1`) | `Default` play step |
| 25 | Same | `Default` renders | Both chevrons are live | None. `link` named "หน้าก่อนหน้า" has `href` `#page-4`, `link` named "หน้าถัดไป" has `href` `#page-6` (`page-ends-1`, `nav-copy-1`) | `Default` play step |
| 26 | Same | `FirstPage` renders page 1 of 12 | "1 2 3 4 5 ... 12"; the left chevron is greyed out and does nothing | None. `getByRole("button", { name: "หน้าก่อนหน้า" })` `toBeDisabled()`, and its computed `color` equals `resolvedColor(button, "--ds-text-disabled")`; no `link` of that name; the first Tab lands on "หน้า 1" (`page-ends-1`, W2 row `1/12`) | `FirstPage` play |
| 27 | Same | `LastPage` renders page 12 of 12 | "1 ... 8 9 10 11 12"; the right chevron is greyed out and does nothing | None. `getByRole("button", { name: "หน้าถัดไป" })` `toBeDisabled()`, and its computed `color` equals `resolvedColor(button, "--ds-text-disabled")`; no `link` of that name; its `getBoundingClientRect().width` equals that of the "หน้าก่อนหน้า" link, so the row keeps its shape (`page-ends-1`, W2 row `12/12`) | `LastPage` play |
| 28 | Same | `FewPages` renders page 3 of 7 | "1 2 3 4 5 6 7", no ellipsis | None. Seven page links, no `.ds-pagination__gap` (`page-range-1`, W2 row `3/7`) | `FewPages` play |
| 29 | Same | `SinglePage` renders `total` 1 | Nothing | None. `queryByRole("navigation")` is null and the canvas has no `.ds-pagination` (`page-bounds-1`) | `SinglePage` play |
| 30 | Same | `OutOfRange` renders `page` 99 of 12 and `page` `NaN` of 12, with `aria-label`s "ช่วง ก" and "ช่วง ข" | The first row marks 12, the second marks 1; no error | None. In the first nav `[aria-current]` reads "12", and Next is the disabled button; in the second it reads "1", and Previous is the disabled button (`page-bounds-1`, `nav-name-1`, W4) | `OutOfRange` play |
| 31 | Same | Tab through `Default`, and hold the pointer on "4" | Focus moves left to right through the chevrons and numbers, skipping the ellipses; a focused number shows the focus line and halo; "4" takes a hover ground | None. Tab order: "หน้าก่อนหน้า", "หน้า 1", "หน้า 4", "หน้า 5", "หน้า 6", "หน้า 12", "หน้าถัดไป"; `expectFocusBorderForm(link)` passes on "หน้า 4" and on "หน้า 5"; under `userEvent.hover`, inside `waitFor` since the link eases its colours, "หน้า 4" `backgroundColor` equals `resolvedColor(link, "--cmp-nav-item-bg-hover")` and its `color` equals `resolvedColor(link, "--cmp-nav-item-fg-hover")` (`page-current-1`) | `Default` play step |
| 32 | Same | `OnCard` renders the row inside a `Card`, and `Default` on the canvas | The current page reads as current on both grounds, by its edge and not by a fill | None. On both, `expectEdgeInk(current, ["top", "right", "bottom", "left"], 1)` and `expectEdgeInk(rest, "top", 0)` on "หน้า 4", guarded by `inVitest`; `expectInkCentred(list, pageLinks, { measure: "body" })` (`page-current-1`) | `OnCard` play, `Default` play step |
| 33 | Same | `RouterLink` renders with `linkAs={StoryLink}` | The same row | None. The page links, Previous and Next each have `data-router`; `querySelectorAll("a a")` has length 0 (`page-api-1`) | `RouterLink` play |
| 34 | Same, English | `DefaultInEnglish` renders, then Tab twice, then the pointer rests on "4" | The same row; "1" takes the focus line and halo; "4" takes a hover ground | None. `navigation` named "Pages"; links named "Page 1", "Page 5", "Previous page", "Next page"; `expectFocusBorderForm(link)` passes on "Page 1"; under `userEvent.hover`, inside `waitFor`, "Page 4" `backgroundColor` equals `resolvedColor(link, "--cmp-nav-item-bg-hover")` (`nav-copy-1`, `page-current-1`) | `DefaultInEnglish` play |
| 35 | Same, English | `FirstPageInEnglish` renders | The left chevron is greyed out | None. `button` named "Previous page" `toBeDisabled()` (`page-ends-1`) | `FirstPageInEnglish` play |
| 36 | Same, English | `LastPageInEnglish` renders | The right chevron is greyed out | None. `button` named "Next page" `toBeDisabled()` (`page-ends-1`) | `LastPageInEnglish` play |
| 37 | Storybook, a 360 px `Narrow` frame, Thai | `At360` renders page 5 of 12 | A chevron left, "หน้า 5 จาก 12", a chevron right on one line, with the chevrons at the two ends; no number row; no horizontal scroll | None. `queryByRole("link", { name: "หน้า 5" })` is null; `getByText("หน้า 5 จาก 12")` visible; the links "หน้าก่อนหน้า" and "หน้าถัดไป" keep their names; by `getBoundingClientRect()`, within 0.5 px, the left edge of the Previous link is the list's left edge and the right edge of the Next link is the list's right edge; frame `scrollWidth` not above 360. Every ancestor of the status up to the frame has computed `overflow` `visible`; `expectLabelInkWhole(status)` and `expectFrameCutsNoInk(status, frame)` pass (`page-form-1`, W3, W5) | `At360` play, the ink steps guarded by `inVitest` |
| 38 | Same, English | `At360InEnglish` renders | "Page 5 of 12" between the chevrons | None. The same checks as row 37 on "Page 5 of 12", with the links "Previous page" and "Next page" (`page-form-1`) | `At360InEnglish` play |
| 39 | Storybook test project | `FormEdge` renders the row in a frame of 479 px, in a frame of 480 px, and in a frame of 480 px with `siblingCount={3}`, with `aria-label`s "กรอบ ก", "กรอบ ข" and "กรอบ ค" | The status at 479, with the chevrons at the two ends; the number row at 480, with the chevrons beside the numbers; two lines of numbers in the third frame | None. In the first nav the status is visible, `queryByRole("link", { name: "หน้า 5" })` is null and the right edge of the Next link is the list's right edge; in the second the link exists, the status has computed `display` `none` and the right edge of the Next link is left of the frame's right edge; in the third the `top` of the Previous link and the `top` of the Next link differ; each row's `scrollWidth` is not above its frame (`page-form-1`, `page-markup-1`, W3, W6) | `FormEdge` play |
| 40 | Storybook test project | `RecipesAndModes` renders through `Matrix`, in a `Cell` named from `useDesignProfile()` | Six boundaries (neutral, professional, friendly, each light and dark), each with a row | None. Six `navigation`s with six different names; `landmark-unique` not turned off (`nav-name-1`); colours from the pairs of the contract table, proven by `recipes.test.ts` and `pnpm contrast` | `RecipesAndModes` play count |
| 41 | Vitest, node | `range.test.ts` runs the ten cases of W2 and the five of W4 | Not a screen | `pageRange` returns W2's rows; `clampPage` returns W4's values; a mutant with `2s + 4` as the threshold goes red (`page-range-1`, `page-bounds-1`) | `range.test.ts` |
| 42 | The Pagination PR head | `check-catalog`, `check-i18n`, `i18n.test.ts`, the copy check, `recipes.test.ts` and the a11y addon run | Not a screen | `catalog/base/pagination.yaml` resolves to `base-pagination`; the five `pagination` keys exist in Thai and English with matching placeholders; `pairs.ts` holds the eight Pagination pairs of the contract table, at their floors under `recipes.test.ts` and `pnpm contrast`; no middot or em dash in new files; zero a11y violations in the fifteen Pagination stories listed above | `pnpm --filter @orivilo/design-system test`, `pnpm contrast` |
| 43 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `FirstPage`, `LastPage`, `OnCard`, `FormEdge`, `At360`, `At360InEnglish`, `RecipesAndModes` | The current page reads as "here" on the canvas and on a card, and apart from focus; a disabled chevron reads as an end; the narrow form reads as one line | None | Designer visual sign-off. A sign-off has an empty `write_set`, so its PNG paths are posted as a Jira comment on ORV-229, which confirms on the built component the answers to open questions 2, 3, 4, 10 and 11 and the `design.md` visual QA screens 3, 4, 5, 7 and 8 |
| 44 | The Pagination PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/pagination`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 45 | Storybook test project | `CurrentInk` renders through `Matrix`, in each cell a link and a current crumb reading `ไปให้`, in a `Cell` named from `useDesignProfile()` | Six boundaries (neutral, professional, friendly, each light and dark); in each, no mark of `ไปให้` is cut at its start or its end | None. Six `navigation`s; on each current crumb `scrollWidth` is not above `clientWidth`, and `expectFrameCutsNoInk(current, nav)` passes, the step guarded by `inVitest`. Red on a current crumb with no end padding, which row 11's label cannot show (`crumb-look-1`, `crumb-cut-1`) | `CurrentInk` play |

## Rows that render nothing

- Rows: 18, 19, 21, 29, 41, 42, 44

## Rows per PR

Two PRs are planned, Breadcrumb first (open question 8). The first carries rows 1 to 21 and row 45, and the second rows 22 to 44. Each holds its component, recipe, pairs, locale keys, fixtures, stories, catalog entry and coverage line, since an entry, a story and its code land together. Each is estimated at 400 to 500 changed lines, about half of them stories, a little over the 400-line guide; open question 8 holds the smaller split. Amendments A2 to A5 add about 20 lines across the two. The design splits the same way: D1 to D11, with D11's breadcrumb selector only and pairs 1 to 6, 13 and 14, go in the first; D12 to D21, D11's two pagination selectors and pairs 7 to 12, 15 and 16 go in the second. The main session adds the PR lines, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line, once each PR number exists.

- PR 196: rows 1-21, 45

## Out of scope

- Wiring either component into `apps/web` or `src/examples/decision-log.tsx`. No project or decision-log route exists yet; the screen that needs one uses these with its own story.
- A home crumb with an icon, and any `icon` slot (K-0320). A Tooltip on a cut crumb.
- Collapsing the trail again after it expands, and a controlled `expanded` prop.
- Page size, rows per page, a page input, first and last jumps, `rounded`, `align`, dot and line forms (K-0326, K-0329).
- Button page items with `onPageChange` (open question 4).
- A loading state on either component: none is read in the sources, and each is a navigation to a new page.
- Any token, profile, `Button`, `DropdownMenu` or `Matrix` change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The method of `crumb-collapse-1`. Input: the crumb count and `maxVisible` as `[count, maxVisible]`: `[3, 4]`, `[4, 4]`, `[6, 4]` (the six crumbs of `breadcrumbFixtures.trail`), `[6, 0]`, `[6, 1]`, `[5, 2.5]`. Expected output, zero-based indexes, no rounding:

```text
3 4 kept 0 1 2 hidden none
4 4 kept 0 1 2 3 hidden none
6 4 kept 0 3 4 5 hidden 1 2
6 0 kept 0 1 2 3 4 5 hidden none
6 1 kept 0 5 hidden 1 2 3 4
5 2.5 kept 0 2 3 4 hidden 1
```

```bash
node -e 'const keep=(n,max=4)=>{let m=Number.isInteger(max)&&max>=0?max:4;if(m!==0)m=Math.max(m,2);const all=[...Array(n).keys()];if(m===0||n<=m)return {kept:all,hidden:[]};const kept=[0,...all.slice(n-(m-1))];return {kept,hidden:all.filter(i=>!kept.includes(i))}};for(const [n,m] of [[3,4],[4,4],[6,4],[6,0],[6,1],[5,2.5]]){const r=keep(n,m);console.log(n,m,"kept",r.kept.join(" "),"hidden",r.hidden.join(" ")||"none")}'
```

W2. The method of `page-range-1`. Input: `[page, total, siblingCount]`: `paginationFixtures` (`[5, 12, 1]`), then the edge cases around K-0327's three branches and its threshold of 7. Expected output, `...` standing for a gap slot, no rounding:

```text
5/12 s1: 1 ... 4 5 6 ... 12
1/12 s1: 1 2 3 4 5 ... 12
3/12 s1: 1 2 3 4 5 ... 12
4/12 s1: 1 ... 3 4 5 ... 12
9/12 s1: 1 ... 8 9 10 ... 12
10/12 s1: 1 ... 8 9 10 11 12
12/12 s1: 1 ... 8 9 10 11 12
3/7 s1: 1 2 3 4 5 6 7
3/8 s1: 1 2 3 4 5 ... 8
1/8 s0: 1 2 3 ... 8
```

```bash
node -e 'const seq=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);const range=(p,t,s=1)=>{if(2*s+5>=t)return seq(1,t);const l=Math.max(p-s,1),r=Math.min(p+s,t),b=2*s+3;if(l<=2)return [...seq(1,b),"...",t];if(r>=t-1)return [1,"...",...seq(t-b+1,t)];return [1,"...",...seq(l,r),"...",t]};for(const [p,t,s] of [[5,12,1],[1,12,1],[3,12,1],[4,12,1],[9,12,1],[10,12,1],[12,12,1],[3,7,1],[3,8,1],[1,8,0]])console.log(p+"/"+t+" s"+s+":",range(p,t,s).join(" "))'
```

W3. The width behind `page-form-1`. Input: `nav-item.height` references `{size.control.md}` (`component.json` line 429), which references `{size.10}` (`semantic.json` line 857), value `40px` (`primitives.json` line 531); `space.inline.sm` references `{space.1}` (`semantic.json` line 812), value `4px` (`primitives.json` line 465). The row at `siblingCount` 1 holds 7 slots (`page-range-1`) plus Previous and Next: 9 controls with 8 gaps between them, at the digit widths of one or two digits. Expected output, px, no rounding: `40 4 392 false true`: control, gap, row, whether it fits a 360 px frame, whether it fits a 480 px one. The row does not fit at 360, so a narrow form is needed; it fits at the 480 px edge, with 88 px spare for wider digits.

```bash
node -e 'const c=require("./packages/design-system/src/tokens/source/component.json"),s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const at=(o,r)=>r.replace(/[{}]/g,"").split(".").reduce((a,k)=>a[k],o).$value;const h=parseFloat(at(p,at(s,c["nav-item"].height.$value)));const g=parseFloat(at(p,s.space.inline.sm.$value));const row=9*h+8*g;console.log(h,g,row,row<=360,row<=480)'
```

W4. The method `clampPage` of `page-bounds-1`. Input: `[page, total]`: `[5, 12]`, `[0, 12]`, `[99, 12]`, `[NaN, 12]`, `[2.5, 12]`. Expected output, one line per case as `page total shown`, no rounding: `5 12 5`, `0 12 1`, `99 12 12`, `NaN 12 1`, `2.5 12 1`.

```bash
node -e 'const clamp=(p,t)=>Number.isInteger(p)?Math.min(Math.max(p,1),t):1;for(const [p,t] of [[5,12],[0,12],[99,12],[NaN,12],[2.5,12]])console.log(p,t,clamp(p,t))'
```

W5. The strings of `page-api-1` and `nav-copy-1`. Input: `fill` as `src/i18n/messages/index.ts` lines 29 to 35 writes it, `paginationFixtures.hrefPattern` and the `pagination.page` and `pagination.status` rows of the Copy table. Expected output, five lines: `#page-6`, `หน้า 6`, `Page 6`, `หน้า 5 จาก 12`, `Page 5 of 12`.

```bash
node -e 'const fill=(t,p={})=>t.replace(/\{([a-zA-Z0-9_]+)\}/g,(_,n)=>{const v=p[n];if(v===undefined)throw new Error(n);return String(v)});console.log(fill("#page-{page}",{page:6}));console.log(fill("หน้า {page}",{page:6}));console.log(fill("Page {page}",{page:6}));console.log(fill("หน้า {page} จาก {total}",{page:5,total:12}));console.log(fill("Page {page} of {total}",{page:5,total:12}))'
```

W6. The widths behind `page-markup-1`. Input: the tokens of W3 and `page-range-1`'s `2s + 5` slots, plus Previous and Next, so `2s + 7` controls with `2s + 6` gaps. Expected output, one line per `siblingCount` as `s controls row`, px, no rounding: `1 9 392`, `2 11 480`, `3 13 568`. At 2 the row fills the 480 px edge with nothing spare; at 3 it wraps below 568 px.

```bash
node -e 'const c=require("./packages/design-system/src/tokens/source/component.json"),s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const at=(o,r)=>r.replace(/[{}]/g,"").split(".").reduce((a,k)=>a[k],o).$value;const h=parseFloat(at(p,at(s,c["nav-item"].height.$value)));const g=parseFloat(at(p,s.space.inline.sm.$value));for(const k of [1,2,3]){const n=2*k+7;console.log(k,n,n*h+(n-1)*g)}'
```

W7. The sizes rows 1, 2, 4, 6 and 22 read. Input: `space.inline.sm` and `space.inline.md` (`semantic.json` lines 812 and 816), `button.icon-size.md` (`component.json` line 152, which references `{size.icon.sm}`, then `{size.icon-4}`, `primitives.json` line 559) and `size.control.sm` (`semantic.json` line 853). Expected output, px, no rounding: `4 8 16 32`: the inline padding of a link and of the current crumb, the ellipsis margin before its minus sign, a glyph, a line.

```bash
node -e 'const c=require("./packages/design-system/src/tokens/source/component.json"),s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const at=(o,r)=>r.replace(/[{}]/g,"").split(".").reduce((a,k)=>a[k],o).$value;console.log(parseFloat(at(p,s.space.inline.sm.$value)),parseFloat(at(p,s.space.inline.md.$value)),parseFloat(at(p,at(s,c.button["icon-size"].md.$value))),parseFloat(at(p,s.size.control.sm.$value)))'
```

W8. The profiles of `crumb-look-1`, and row 4's radius. The set is the base set (`neutral`) and every file in `src/profiles/source/`: `orivilo`, `professional`, `friendly`. Input: `shape.check.radius` is `{radius.4}` in `semantic.json` (line 771), `friendly.json` sets `{radius.6}` (line 418), `orivilo.json` and `professional.json` set nothing, and `radius.4` and `radius.6` are `4px` and `6px` (`primitives.json` lines 423 and 427). Expected output, one line per profile as `id px within`, px, no rounding: `neutral 4 true`, `orivilo 4 true`, `professional 4 true`, `friendly 6 true`. The bound of 8 px comes from `design.md` ("Row 15, the focus step"), where radius 8 was the largest shape measured with no label cut. This example reads the token source; no play holds the bound per profile.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const px=r=>parseFloat(r.replace(/[{}]/g,"").split(".").reduce((a,k)=>a[k],p).$value);for(const id of ["neutral","orivilo","professional","friendly"]){const o=id==="neutral"?undefined:require("./packages/design-system/src/profiles/source/"+id+".json").semantic.shape?.check?.radius?.$value;const v=px(o??s.shape.check.radius.$value);console.log(id,v,v<=8)}'
```

## Open questions (each with a default)

The designer answered all eleven in `design.md` (section "Answers to the open questions"), and all eleven stand on their defaults, so the rules above are written at the answers. G2 passed under the owner's delegation (ADR 0012 decision 4) on v1.0. A default that changes bumps this spec, and the Impact cell of the table below says what moves.

<!-- prettier-ignore -->
| # | Answer | What the design adds |
| --- | --- | --- |
| 1 | (a) | Weight and behaviour carry the mark, since ink alone is as low as 1.5 |
| 2 | (a) | Under Professional light the halo tells focus from current: QA screen 3 |
| 3 | (a) | Spend boldness once: no violet in a trail or a page row |
| 4 | (a) | A screen with no URL reopens this with its own story |
| 5 | (a) | An open six-crumb Thai trail takes four lines at 360 px, by the person's choice |
| 6 | (a) | Glyph size: A7 |
| 7 | (a) | A wrapped line ends on the slash, and the next starts on the crumb |
| 8 | (a) | A2 to A5 add about 20 lines across the two PRs |
| 9 | (a) | The rest of a cut name is on no screen; the page's heading carries a cut current crumb |
| 10 | (a) | With one ink change: A5 |
| 11 | (a) | Word widths measured: with words the row is 559.5 px in Thai and 582.5 px in English, past the 480 px edge |

<!-- prettier-ignore -->
| # | Question | Options | Default | Impact if another option wins |
| --- | --- | --- | --- | --- |
| 1 | The current crumb | (a) a non-link with `aria-current="page"` (K-0333, K-0337 step 5 and Example 1); (b) a real link with `aria-current="page"`, as the APG example does (K-0334, K-0337 step 6); (c) Untitled's link that is disabled and cannot be focused (K-0322), for which the page gives no reason, so this is a question and not a fault found (K-0339); (d) shadcn's `span` with `role="link"` (K-0324) | (a), `crumb-current-1`: the page goes nowhere, so it costs no Tab stop | (b) adds a Tab stop and an `href` on `BreadcrumbPage`: rows 2, 4, 12 |
| 2 | The current page's look | (a) `--cmp-nav-item-*-active` plus a neutral edge; (b) `surface.selected` and `selection.fg`. DESIGN.md section 7 lists `selected` for options, rows and tabs, and ARIA says `aria-current` is not a substitute for `aria-selected` (K-0336, K-0339) | (a), `crumb-look-1`, `page-current-1` | (b) changes the pairs and needs a DESIGN.md section 7 line: rows 2, 23, 32 |
| 3 | The ink of a crumb link and a page number | (a) `--cmp-nav-item-fg`, the token family made for navigation; (b) `text.link`, which DESIGN.md section 8 names for "go somewhere" and section 3.1 for "links in running text" (K-0339) | (a), `crumb-look-1`: a trail is not running text. DESIGN.md section 2 says violet also does the work of links, so (b) stays a real option | (b) changes the pairs: rows 2, 5 |
| 4 | Pagination items | (a) links through a URL (K-0330, K-0335 "groups (e.g. lists) of links", H97 in K-0338); (b) real `button`s with `onPageChange`, in a real list (K-0326, K-0328); (c) both. Whether decision-log pages have URLs is not settled by any source (K-0339), and no such route exists yet | (a), `page-api-1`: the page is a place you can link to and go back to | (b) replaces `hrefPattern` and `linkAs`: `page-api-1`, `page-ends-1`, rows 22, 25, 33. A list screen with no URL would need (b) or (c) |
| 5 | Collapse, and what the ellipsis opens | (a) a count prop, expanding in place (K-0321); (b) a count prop opening a `DropdownMenu` (K-0325); (c) hand composition, with the caller placing the ellipsis (K-0325) | (a), `crumb-collapse-1`, `crumb-expand-1`: real links stay real, and no portal comes in | (b) needs `DropdownMenuItem` to render a link, a public API change to a stable component, with `InsideProfile` and a Drawer question below it: rows 6 to 8 |
| 6 | The missing glyphs | (a) add Lucide `Ellipsis`, `ChevronLeft`, `ChevronRight` to `icons.tsx` (DESIGN.md section 6, K-0339); (b) draw them | (a), `nav-glyphs-1` | (b) is against section 6's order while Lucide has them |
| 7 | The separator | (a) a slash with spaces (K-0320 `divider="slash"`, DESIGN.md section 10); (b) a chevron, Untitled's default (K-0320) and shadcn's (K-0323), which needs a reading that section 10 covers text only | (a), `crumb-markup-1` | (b) adds `ChevronRightIcon` to the first PR: rows 1, 3 |
| 8 | How the work splits | (a) two PRs, Breadcrumb first, since it carries the collapsed trail story the audit names (K-0321) and Pagination's range is separate work (K-0327); (b) one PR; (c) three PRs, the trail, then its collapse, then Pagination | (a), "Rows per PR" | (c) brings each near the 400-line guide, at the cost of one more review pass; rows move, none changes |
| 9 | A long crumb | (a) cut at the end of its line (K-0325); (b) wrap with the text whole, as shadcn's list does for a trail (K-0323) | (a), `crumb-cut-1` | (b) swaps the check to `expectLinesClear`: rows 15, 16 |
| 10 | Previous and Next at the ends | (a) disabled in place (K-0328); (b) left as links, as the shadcn lines read name no disabled prop (K-0330); (c) removed | (a), `page-ends-1`: the row does not shift, and a link to nowhere is not offered | (c) moves the row between pages: rows 26, 27, 35, 36 |
| 11 | The small-frame form, and words on Previous and Next | (a) the status replaces the numbers (K-0326), with chevrons alone at every width; (b) the same, with the words shown at 480 px and up (K-0326, K-0330); (c) a smaller `siblingCount` at narrow widths | (a), `page-form-1`, `page-ends-1`: W3's sum holds | (b) widens the row past W3's sum, so its edge moves: W3, rows 22, 39 |

## Depends on

- `docs/knowledge/design/K-0320` to `K-0338` and their synthesis K-0339 (benchmark, standards, open points, what was not read).
- `docs/specs/ORV-64/audit.md` section B (table form) and section D.3 row 26 (the story and its done-when).
- `DESIGN.md` section 4 (Thai, clip-box rule), section 6 (icons), section 7 (states), section 8 (colour roles), section 10 (separators, copy), section 11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers"); `.claude/rules/testing.md` (visual helpers).
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` (the Rows per PR form).
- ADR 0003 (behaviour layer, own recipes, Storybook as the catalog), ADR 0012 (gates). shadcn's Breadcrumb and Pagination wrap no Radix primitive beyond Slot (K-0323, K-0330), so native `nav`, `ol`, `ul` and `a` plus Slot are the behaviour layer here.
- `docs/specs/ORV-229/design.md` (answers to open questions 1 to 11, amendments A1 to A10, rows D1 to D21, the colour pairs, the visual QA screens).
- PR 186, merged (`expectFrameCutsNoInk`), for rows 11, 15, 16, 37, 38 and 45.
- `docs/specs/ORV-84/spec.md` (`hover-force-1`, the route `crumb-hover-1` takes).
- `docs/specs/ORV-203/spec.md` and `docs/specs/ORV-217/spec.md` (the spec shape; `copy-name-1` on the Thai name).

## Changelog

- v1.0 (2026-11-06): first version, from K-0320 to K-0339 and audit D.3 row 26. Downstream to review: the designer envelope (open questions 1 to 11, the Copy table read aloud), the builder envelopes (rows 1 to 21, then rows 22 to 44), the qa envelopes (the Rows per PR lines once each PR exists), `catalog/coverage.md`.
- v1.1 (2026-11-06): takes in `design.md` amendments A1 (`pagination.label` Thai), A2 (crumb focus shape), A3 (one height per line), A4 (ellipsis ink and margin), A5 (disabled chevron ink), A6 (sixteen pairs), A7 (glyph size, wrap, spread), records the eleven answers, corrects the facts that moved after develop merged, adds W6 and W7, and passes `expectFrameCutsNoInk` the crumb's `li` in rows 15 and 16. AC row numbers are unchanged. Downstream to review: the builder envelopes (rows 1, 4, 6, 13, 15, 16, 19, 20, 22, 26, 27, 31, 34, 37, 38, 39, 42, 43), the qa envelopes, `design.md` (its front matter names spec v1.0).
- v1.2 (2026-11-06): takes in `design.md` amendment A8 (the focus corner of a crumb, in `crumb-look-1`, `crumb-cut-1`, Fixtures, rows 4 and 15), adds W8 for the profiles A8 names, adds `crumb-hover-1` and records it in rows 4, 5, 6, 12 and 13 from the deviations of ORV-229-build-1, and adds the line for PR 196. AC row numbers are unchanged. Downstream to review: the builder envelope (the four edits of `design.md` "Row 15, the focus step", which restore row 15's focus step on PR 196), the qa envelope of PR 196, `catalog/base/breadcrumb.yaml`, `design.md` (its front matter names spec v1.1).
- v1.3 (2026-11-06): takes in `design.md` amendments A9 (the current crumb's inline padding and end margin, from finding F1 of ORV-229-signoff-1, in `crumb-look-1`, `crumb-cut-1`, Fixtures, rows 2, 11, 15, 19 and 20, new row 45, Rows per PR) and A10 (what rows 20 and 43 confirm, from suggestion S1). Follows through in the lines A9 leaves stale: `CurrentInk` joins the Breadcrumb story list, rows 11 and 45 join the rows that wait on `expectFrameCutsNoInk`, A9 joins the list of what the rows hold, row 2 joins W7, and "Depends on" names A1 to A10. Existing AC row numbers are unchanged. Downstream to review: the builder envelope (the six edits of `design.md` "The current crumb's ink, F1", on PR 196), the designer sign-off (row 20, with `NoCollapse`, `CurrentInk` and QA screens 9 and 10), the qa envelope of PR 196 (the new line of "Rows per PR"), `design.md` (its front matter names spec v1.2). `catalog/base/breadcrumb.yaml` needs no line (`design.md`, "The current crumb's ink, F1").
