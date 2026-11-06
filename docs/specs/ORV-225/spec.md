---
issue: ORV-225 (https://tpetkaew.atlassian.net/browse/ORV-225)
lane: as set on ORV-225 in Jira (not read in this role). By this spec's reading the risk flag "component public API" applies (AGENTS.md, "Lanes and gates"): four new public components, a new prop on `CollapsibleTrigger` and on `WorkspaceScreen`, and three repointed component tokens ("Contract changes and impact"), so lane L
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_rows: docs/specs/ORV-64/audit.md section D.3 row 22
version: 1.2
design: docs/specs/ORV-225/design.md, version 1, at 9fe740e. It answers open questions 3, 6 and 9 and gives the builders the CSS and markup per rule; its "Amendments to the spec" rows 1 to 12 are in this version. The designer still signs the rows named in `stories-1`
---

# ORV-225: Sidebar navigation, Top navigation, Page header and Section header

## Benchmark

These tables follow the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). The Untitled UI and shadcn/ui cells are K-0236's, and each cell names its entry. Radix sits in the shadcn/ui row because shadcn's Navigation Menu wraps it (K-0219). The Ours row is the code on this branch. The Add and Do not copy rows are this spec's choices, and each one names the rule in "Rules" that holds it.

Not read, so not in the tables and not filled from memory (K-0236, "Not read"): Untitled UI's `<ApiReference>` tables for the sidebar, header and section header pages, `sidebar-navigation-base.tsx`, `nav-account-card.tsx`, and the source of its page headers and section headers. shadcn Blocks other than `sidebar-07/nav-main.tsx` and `dashboard-01/site-header.tsx`. Nothing was run in a browser or with a screen reader. Three claims did not re-check (K-0236, "Claims that did not re-check"), and no rule here rests on them.

### Sidebar navigation

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | https://www.untitledui.com/react/components/sidebar-navigations.md. Variants: Simple, Dual-tier, Slim, Section dividers, Sections subheadings; main width 280, 280, 68, 276, 276 px, second panel 256 px on Dual-tier and Slim (K-0204). Sizes: none stated (K-0204). States: current, as `bg-secondary` plus `aria-current="page"` on `NavItemBase`, by classes on the rail's `NavButton` (K-0205, K-0206); group open or closed (K-0205). Slots: item `label`, `href`, `icon`, `badge`, `items`, `divider`; `footerItems`, `featureCard`, `showAccountCard` (K-0204). Collapse: no desktop control stated (K-0204); Slim is an icon rail named by `aria-label` and tooltip, and its second panel shows while the pointer hovers (K-0206). Nested: native `details` that opens when the active item is inside (K-0205). Small screens: below `lg` a header bar and a dismissable modal; Slim shows a labelled list whose `NavList` call passes no `activeUrl` (K-0207). Landmark: `aside`, no `nav`; a subheading is a `p` (K-0205). |
| shadcn/ui | https://ui.shadcn.com/docs/components/radix/sidebar. Variants: `sidebar`, `floating`, `inset`; `side` left or right; `collapsible` `offcanvas`, `icon`, `none` (K-0213). Sizes: 16rem, 18rem on mobile, 3rem as icons (K-0214); menu button `sm`, `default`, `lg`, variants `default`, `outline` (K-0215); sub button `sm`, `md` (K-0218). States: `isActive` to `data-active`, no `aria-current` in the file (K-0215). Slots: Header, Footer, Content, Group with Label, Content and Action, Menu, MenuItem, MenuButton, MenuAction, MenuSub, MenuBadge, MenuSkeleton, Trigger, Rail, Inset (K-0213). Collapse: cookie for seven days, Cmd or Ctrl plus b (K-0214); tooltip on the collapsed desktop form (K-0215); offcanvas moves off screen (K-0216). Nested: `Collapsible` around the item, `defaultOpen={item.isActive}`, submenu hidden in icon mode (K-0218). Small screens: under 768 px a Sheet on Radix Dialog with an sr-only English title (K-0214, K-0217). Landmark: no `nav`, no `aside`; `SidebarInset` is `main`; group label a `div` (K-0216). Radix has no Sidebar primitive by the folder list read (K-0223). |
| Ours | None: `coverage.md` row "Sidebar navigation". Parts in hand: Sheet draft, variants `end` and `start`, focus trapped and returned to the trigger (`sheet.yaml`); Collapsible draft, a button with `aria-expanded` from Radix (`collapsible.yaml`); Tooltip stable (`coverage.md`); tokens `--cmp-nav-item-*` with `fg`, `fg-hover`, `fg-active`, `bg-hover`, `bg-active` (`surface.card`), `bead` (`brand.signature`), `radius`, `height` (`component.json`), used only on a spec sheet sample with `aria-current="page"` (`spec-sheet.tsx`). Mod+B is `panel.toggle-library` (DESIGN.md, K-0214). |
| Add | Variants Simple, Section dividers, Section labels and a nested group: `sidebar-groups-1`, `nav-group-1`. A rail in place of Slim: `sidebar-rail-1`. The item shape: `nav-item-1`. A `nav` with its own name in both languages: `nav-landmark-1`. `aria-current` wherever an item renders: `nav-current-1`. A drawer through Sheet: `nav-narrow-1`. A remembered collapsed state: `sidebar-memory-1`. |
| Do not copy | Dual-tier and the pointer-only second panel: the Slim file has no `onFocus`, `onKeyDown` or `aria-expanded`, and the disclosure pattern is a button that Enter and Space toggle (K-0206, K-0229). A drawer list with no `activeUrl`: ARIA26 and G128 are about the current item being indicated (K-0207, K-0227; `nav-narrow-1`). English names in code, "Sidebar", "Toggle Sidebar", "Expand navigation menu": UI strings come from the locale catalog (AGENTS.md; K-0207, K-0216, K-0217). `--sidebar-*` variables: "Token names are ours" (`.claude/rules/design-system.md`; K-0213). `SidebarMenuSkeleton`'s random width: "Never randomize style values at render time" (`.claude/rules/design-system.md`; K-0215); nav here has no loading state (`nav-item-1`). `floating` and `inset`: no Studio screen asks for them, and `surface.canvas` is the shell's one ground (K-0213). Cmd or Ctrl plus b as it stands: `nav-shortcut-1` (K-0214). Feature cards and an account card: D.3 row 22 is for the Studio shell and names none (K-0204). |

### Top navigation

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | https://www.untitledui.com/react/components/header-navigations.md. Variants: Simple, Dual-tier; `centered`; `secondaryType` `buttons` or `tabs` (K-0208). Sizes: none read (K-0208). States: active, by exact match, prefix match for nested routes, root excluded, `current` overrides (K-0208). Slots: `items`, `subItems`, `actions` (K-0208). Current: classes on `NavButton`, no `aria-current` (K-0209). Nested: a second row that renders when it has an item (K-0208). Small screens: hidden below `lg`, a modal drawer that reuses `items`, no active item by the page's words, icons and badges appear there (K-0209). Landmark: `header`; `nav` with no name on the primary row and the buttons row; logo link "Go to homepage" (K-0209). |
| shadcn/ui | https://ui.shadcn.com/docs/components/radix/navigation-menu. No navbar entry in the index (K-0223). Navigation Menu: List, Item, Trigger, Content, Link, Indicator, Viewport; `viewport` default true; no variant or size prop; trigger style `h-9` (K-0219). Radix: `orientation`, `delayDuration` 200, `skipDelayDuration` 300, Sub; `data-state`, `data-active`, `data-disabled`, `data-motion` (K-0220). Current: Link `active` sets `aria-current="page"` and `data-active` (K-0221). Nested: Content panels and Sub (K-0220). Keyboard: Enter, Space, Tab, arrows, Home, End, Esc (K-0220). Hover opens for mouse pointers (K-0221). Small screens: no statement; `md:` classes in the source (K-0219). Landmark: `nav`, default `aria-label="Main"` that props override; not the menu role (K-0220, K-0221). |
| Ours | None: `coverage.md` row "Top navigation". Inline in `apps/web/app/layout.tsx`: a `header` with `nav aria-label={m.app.nav}` ("Main", "เมนูหลัก", `messages.ts`), a Logo link and two text links (Studio, Account) in the text-link colours, then `LocaleSwitch`; `flex-wrap`, `max-w-2xl`. No `aria-current` and no skip link in the `.tsx` files under `apps/web` (K-0232). `landing.tsx` has its own `header` and `nav aria-label="หลัก"`. |
| Add | Variants one row and two rows, with `items`, `subItems` and `actions`: `top-nav-1`. The current state set by the component: `nav-current-1`. Each `nav` named on its own: `nav-landmark-1`. A drawer with the current item marked: `nav-narrow-1`. A skip link: `top-skip-1`. |
| Do not copy | `secondaryType="tabs"` for page links: tab items get a label and no `href` (K-0208). `centered`: no Studio screen asks for it. Two `nav` elements with no name: the APG asks for a unique label (K-0209, K-0224). The menu role for site links: the APG example says why it does not use it (K-0229). Radix NavigationMenu's Content panels and Viewport: this story's Top navigation holds links only (`top-nav-1`); a dropdown would be a change to this spec (K-0220, K-0229). Radix's "Main" left as the name on a Thai page: UI strings come from the locale catalog (AGENTS.md; K-0221). |

### Page header

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | https://www.untitledui.com/react/components/page-headers.md. Variants: Simple, Avatar, Banner simple, Banner avatar, Banner simple centered, Banner avatar centered; no props, content inline (K-0210). Sizes: no size prop; banner `h-40`, `lg:h-60`; `Avatar` `xl`, `AvatarProfilePhoto` `md`, `lg` (K-0210). States: none described (K-0210). Slots by composition: Breadcrumbs, Back link, search, avatar, banner; actions and tabs not mentioned (K-0210). Heading: a real `h1`, one header per page or a lower level when nested (K-0210). Small screens: breadcrumbs give way to a Back link below `lg` (`md` centered), the title row is a column until `lg` in the non-centered variants, search is rendered twice (K-0210). |
| shadcn/ui | No page header entry in the index (K-0223). Nearest code: the dashboard-01 site header, a `header` with SidebarTrigger, a vertical Separator, an `h1` (`text-base font-medium`) and a ghost Button `hidden sm:flex` (K-0223). Breadcrumb exists: `nav`, `ol`, current page a span with `role="link"` (K-0222). |
| Ours | None: `coverage.md` rows "Page header" and "Breadcrumb". Inline `header` in `workspace.tsx`, `decision-log.tsx`, `settings-form.tsx`: an `h1` in `font-display text-display-md text-balance` and a `p` in `text-body-md text-text-secondary`; the first two add a dialog action in `flex flex-wrap items-end justify-between gap-4`, the third is `flex flex-col gap-2`. `apps/web/app/workspace/page.tsx` puts `WorkspaceScreen` inside `main`, so its `header` is generic by K-0225. `coverage.md` line 119 says an inline page header does not make the row real. |
| Add | Named parts for what the three inline headers repeat, plus the label row `workspace.tsx` holds: `page-header-slots-1`. A heading level control and its bar: `heading-level-1`. A row that stacks on small screens: `header-stack-1`. A title that keeps its wrapped lines clear: `header-type-1`. |
| Do not copy | Content written inline with no props: a shared component has a catalog entry and a story in one PR (`.claude/rules/design-system.md`; K-0210). The fixed gradient `#FBC5EC` to `#A5C0EE`: no hex in components (`.claude/rules/design-system.md`; K-0210). The Banner and Avatar compositions: no Studio screen asks for them, and Avatar is its own row, D.3 row 21. `AvatarProfilePhoto` `verified`: no trust badge without backing data (AGENTS.md; K-0210). `aria-label="Search"` in English code: UI strings come from the locale catalog (AGENTS.md; K-0210). A `header` as root: `page-header-root-1` (K-0225). A Breadcrumb slot now: Breadcrumb is D.3 row 26 and does not exist yet (K-0210, K-0212); that story adds it. |

### Section header

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | https://www.untitledui.com/react/components/section-headers.md. Variants: six examples (own count), buttons, search input, button group, and each with tabs (K-0211). Sizes: none on `SectionHeader`; `SectionLabel` `sm`, `md`, default `sm` (K-0211). States: none documented (K-0211). Slots: Root (bottom divider, `gap-5`), Group, Heading, Subheading, Actions; tabs as the second child of Root; `SectionLabel` `tooltip`, `tooltipDescription`, `isRequired`, Actions (K-0211). Heading: `h2`, your own element for another level (K-0211). Small screens: Group stacks until `md`; an overflow menu can be placed absolutely (K-0211). |
| shadcn/ui | No section header entry in the index (K-0223). No page read fills this row. |
| Ours | None: `coverage.md` row "Section header". Inline: `h2` in `text-heading-md` in `landing.tsx`; `header` in `Inspector.tsx` (`ds-inspector__header`) and `CanvasChat.tsx` (`ds-chat__header`). Tabs stable (`coverage.md`). |
| Add | Title, description, actions, an `id` on the heading, an optional divider and tabs as a following sibling: `section-header-1`. A level the caller sets: `heading-level-1`. A row that stacks on small screens: `header-stack-1`. |
| Do not copy | A fixed `h2` with no prop to change it: the WHATWG rule depends on the heading before it (K-0211, K-0231). The bottom divider built into Root with no option: no source read asks for a divider, so it is off by default (K-0211; `section-header-1`). `SectionLabel`'s `tooltip` and `isRequired`: those belong to a form label, and no Studio section needs them (K-0211). A search input in the header: `actions` takes what a caller passes (K-0211). |

## Goal

The Studio shell and the reference screen hand-write their navigation and their headers. D.3 row 22 asks for four named parts, so the shell and the reference screen use a component with a catalog entry, a story and a contract instead of inline markup. On the way the shell gains what the inline form lacks: a current page a person can see and a screen reader hears, a menu that still works at 360 px, and a way past the header by keyboard.

What is simulated: the workspace screen's projects and members stay Thai fixture data, labelled "ข้อมูลตัวอย่าง" as they are today. The story fixtures `navFixtures` link to routes that do not exist. In the app every nav item is a real route (`shell-ia-1`), and nothing checks a permission: the shell shows the same items to everyone. Nothing here claims a screen reader was run. Accessibility claims stop at the axe scan and the plays below.

## Story

As a person working in the Studio, I see which section and page I am on in the top and side menus, I can reach every page by keyboard and on a phone, and I can skip the menus. As a builder of a screen, I place a Page header and Section headers from the catalog and get the right heading level, spacing and stacking without writing them again.

## Rules

### nav-item-1

An item is a link, `{ label, href, icon?, badge?, current?, divider? }`, or in the Sidebar a group, `{ label, icon?, badge?, items, divider? }`. A group has no `href` and its `items` are links, so the tree has two levels at most. `badge` is a string from the caller's data, rendered as a `Badge` `size="sm"` after the label; a missing badge renders no node, and no component makes one up. `divider` draws a line before the item. There is no disabled item, because a route that is not built is not listed, and no loading state, because the items are static props. `label` is a caller's string, so the caller takes it from the locale catalog.

### nav-current-1

One matcher, `current.ts`, serves both navigations in every form (wide, drawer, rail, second row). It reads `currentPath`. When `currentPath` is undefined nothing is marked.

1. Normalise both paths: drop the query and the hash, and drop trailing slashes except on the root.
2. Equal paths give `aria-current="page"`.
3. A path that starts with `href + "/"` gives `aria-current="true"`. An `href` of `/` never matches this way.
4. `current: true` gives `aria-current="true"` when step 2 did not match. `current: false` gives no mark.
5. Each list is one set and holds at most one marked item (K-0226): `page` wins, then the longest `href`.
6. A group holding a marked link is marked `aria-current="true"` on its button. The group's own list is its own set (K-0226 does not say whether a nested list is its own set, so this rule says it).

Worked example W1.

### nav-look-1

Item colours come from `--cmp-nav-item-*` only. At rest `fg` on no fill. On hover `fg-hover` on `bg-hover`. A marked item takes `fg-active` on `bg-active`, plus a bead on its start edge: `--cmp-nav-item-bead` at `--cmp-nav-item-bead-size`, with `--cmp-nav-item-radius`, so the mark is a shape as well as a colour (DESIGN.md section 7). An open group marked `true` keeps `fg-active` only, so one filled row shows the page; a closed group marked `true` takes the full look, because its child is hidden. Which token each name points to is open question 3.

### nav-focus-1

`ds-nav-item` draws its focus inside its box, in the Tabs form (`recipes.css` lines 919 to 923), so a scroll box such as `.ds-side-sheet__body` cannot clip it: outline 1 px in `focus.ring`, offset -1px, inset halo. It keeps its line and halo on a marked item, so focus never reads as selection (DESIGN.md section 8).

The play proves this inset form by a computed read, or by a new `expectFocusInsetForm`. `expectFocusBorderForm` cannot pass here: it needs a 1 px ring border, a transparent outline and an outer halo.

### nav-size-1

- Top navigation item: `data-size="sm"`, height `--ds-size-control-sm`, label `type.control.md` on one line. A label that does not fit truncates and joins the clip-box rule in `recipes.css` (ORV-194 row 7). This height keeps the header's height and the logo's top as `apps/web/e2e/header.spec.ts` reads them. Worked example W2.
- Sidebar item: `data-size="md"`, minimum height `--cmp-nav-item-height`, label `type.label.md`, which wraps.
- Drawer item, in either navigation: minimum height `--ds-size-touch`, label `type.label.md`, which wraps.

### nav-landmark-1

The root of each navigation is a `nav` with an `aria-label` from its `name` prop, and each `nav` on a page has its own name (K-0224). The Sidebar is a `nav`, never an `aside`: this is the default of open question 1. The Sidebar's `nav` stays in the DOM below the breakpoint and holds the button that opens the drawer, so no content sits outside a landmark (K-0224). Worked example W5 counts the landmarks. A drawer's list sits in the dialog with no `nav` of its own, because the dialog's title carries the same name.

### nav-narrow-1

Both navigations switch by container, so the 360 px `Narrow` frame proves them. The queries are named, `@container ds-top-nav (max-width: 767px)` and `@container ds-sidebar (max-width: 767px)`, because the parts nest and an unnamed query reads the wrong container. The value comes from `--op-breakpoint-md` (a query cannot read a custom property; `@container ds-table` at `recipes.css` line 1340 is the precedent).

Above it the Sidebar takes room from the content, so the Table takes its narrow form at containers 768 and 769 and is a table from 770: `.ds-table__frame` has 1 px borders, so at container 768 its measured width is 480 and its `clientWidth` 478. The narrow form shows the same data, and no CSS changes for this. Worked example W4.

Below it the item list hides (`display: none`) and an icon-only `Button` opens a `Sheet` `side="start"`. The button's name is `fill(m.nav.open, { name })`, worked example W8. The Sheet's `title` is `name`. The drawer lists the same items in the same order (SC 3.2.3, K-0233) with `nav-current-1` applied (K-0227). A press on a drawer link closes the drawer. Esc and the close button close it and focus returns to the opener. The opener is `sm` with `MenuIcon` in Top navigation (`nav-size-1`) and `md` with `PanelStartOpenIcon` in the Sidebar: on `/workspace` at 360 both show, and each needs its own shape. Both forms render on the server, so links stay in the HTML.

### nav-shortcut-1

No keyboard shortcut in this story: the visible toggle in `sidebar-rail-1` is the keyboard path. This is the default of open question 4.

### top-nav-1

`TopNavigation` root is a full-width `header` and the container for `nav-narrow-1`. Its row holds `nav` (with `brand`, then the items) and then `actions`, after the `nav` and outside it. `contentClassName` sets the row's width and padding, so the shell sets its row per route (`shell-ia-1`) while the root stays full width. The items are links only. `subItems` adds a second row, its own `nav` named by `subName`, and it renders only when `subItems` has an item (K-0208). In the drawer the second row is a second list after the first, labelled by `subName`. With no items the row shows `brand` and `actions` and no opener. The shell uses the one-row form; the two-row form has no route yet, and the catalog entry says so.

### top-skip-1

With `skipHref` and `skipLabel` set, the `header`'s first child is a link, out of view until focused. In view it is an opaque bar over the row: it covers the header while it has focus and leaves with the next Tab. Focus sits on the bar, so SC 2.4.11 holds (K-0234). The shell passes `#main` and `m.app.skip`. The target is the `main` of every route: `apps/web/app/page.tsx`, `workspace/page.tsx`, `directions/page.tsx`, `account/page.tsx`, `not-found.tsx`. Each gets `id="main"` and `tabIndex={-1}`, after its `className` where it has one. This is the default of open question 7.

### sidebar-groups-1

`SidebarNavigation` takes `groups`, each `{ id, label?, divider?, items }`. A `label` is plain text, not a heading (K-0205, K-0216, K-0231), and names its list through `aria-labelledby`. A group's `divider` draws a line before it. `header` and `footer` are slots at the panel's start and end. With no group and no item it renders no `nav` and still renders `children`.

### sidebar-flow-1

The wrapper is the container (`ds-sidebar`): panel then `children`. The panel is `--ds-size-panel-min` wide. It is not sticky and not its own scroll box: it moves with the page, and no ancestor up to the viewport clips it, so the sticky case of SC 2.4.11 does not arise (K-0234). Long menus scroll with the page.

### nav-group-1

A group is a `Collapsible`. Its trigger is a button with `aria-expanded` from Radix, and it takes `aria-current` under `nav-current-1` through the contract change below (K-0229, K-0218). A group opens on first render, and on a route change that enters it, when it holds a marked link. A person's close stays until the route changes. Children unmount while closed (`CollapsibleContent`). The hybrid of a link and a button in one row is not built (K-0229).

### sidebar-rail-1

The rail is the Sidebar's `collapsed` state, and it applies above the breakpoint only. This is the default of open question 5.

- A toggle at the panel's end, a `Button` `iconOnly` named `m.nav.collapse`, or `m.nav.expand` while collapsed. It renders only when every first-level item has an `icon` (K-0204). Focus stays on it after a press.
- Width is `calc(var(--cmp-nav-item-height) + 2 * var(--ds-space-inset-sm))`, worked example W3. Each target keeps `nav-size-1`'s `md` height and is as wide as it is tall, which clears SC 2.5.8 (K-0235).
- Labels hide from view and stay in the accessible name, with the badge text after them. A `Tooltip` `side="right"` shows the label on hover and focus. There is no hover panel (K-0206).
- `nav-current-1` and `nav-look-1` hold.
- Group labels hide; dividers stay. A press on a group's button expands the Sidebar, opens the group and leaves focus on that button.
- A group renders closed in the rail and keeps its open state for when the Sidebar widens, because its children have no icon and cannot stand in a rail. A marked group in the rail takes the full look.

### sidebar-memory-1

`collapsed`, `defaultCollapsed` and `onCollapsedChange` make the state controlled or not; the component stores nothing. In the app the client wrapper writes cookie `orv-sidebar`, `collapsed` or `expanded`, `path=/`, `SameSite=Lax`, with the max age of `orv-locale` (`apps/web/i18n/actions.ts` line 27), worked example W9. The server layout reads it for `defaultCollapsed`, so a reload does not flash. It holds no personal data.

### shell-ia-1

Only built routes are listed.

- Top navigation, `name` `m.app.nav`: `brand` is the Logo link to `/`, then `m.app.studio` to `/directions` and `m.app.account` to `/account`, then `LocaleSwitch` as `actions`. Studio takes `current: true` on `/workspace`, its other section route.
- Sidebar, `name` `m.app.sideNav`, on `/directions` and `/workspace` only, through `apps/web/app/directions/layout.tsx` and `apps/web/app/workspace/layout.tsx`: `m.app.sideDirections` to `/directions`, `m.app.sideWorkspace` to `/workspace`. It renders on no other route.
- The top row, by `contentClassName`, which `AppNav` picks from `usePathname`: `px-6 pt-4` on the two Sidebar routes, so the row is full width and the logo, the Sidebar's icons and, at 360, the screen's title share one start edge at 24; `mx-auto max-w-2xl px-4 pt-4` elsewhere. Row height and logo top stay 48 and 20 (W2). `header.spec.ts` reads `/` only, so none of its numbers change.
- `next/link` reaches the components through `linkComponent` in client wrappers (`apps/web/app/AppNav.tsx`, `apps/web/app/StudioSidebar.tsx`), which read `usePathname`. The package has no Next import.

This is the default of open question 8, and the top row is the answer to open question 9.

### page-header-root-1

`PageHeader`'s root is a `div` with class `ds-page-header`, never a `header`: outside `main`, `article`, `aside`, `nav` and `section` a `header` is a banner (K-0225), and that holds in Storybook and in a shell that places the part elsewhere.

### page-header-slots-1

Props: `title`, `description`, `meta`, `actions`, `level`. `title` is required. `description` is one line of `text-body-md` secondary text. `meta` is a row under it for labels, such as the workspace screen's sample-data row. `actions` sits at the row's end. A missing slot renders no node. There is no `breadcrumb` slot until D.3 row 26 lands.

### section-header-1

Props: `title`, `description`, `actions`, `level`, `id`, `divider`, `children`. `id` goes on the heading, for a caller's `aria-labelledby` (K-0224). `divider` is off by default and draws one edge under the block. It does not draw when `children` render: Tabs draws its own line, and one edge takes one line. `children` render after the title row as a following sibling, the place for `Tabs` (K-0211).

### heading-level-1

The contract holds the WHATWG bar (K-0231): a heading is at most one level deeper than the heading before it, and a page has at most one `h1` (K-0210). This is the default of open question 2. `PageHeader`'s `level` is 1 to 6, default 1. `SectionHeader`'s `level` is 2 to 6, default 2. `level` changes the element only, never the size. The caller picks the level, so the screen passes it down: `WorkspaceScreen` takes `headingLevel`, default 1, and its section header is one deeper. Where the screen embeds in a preview it takes the level after the frame's heading, worked example W6.

### header-type-1

- Page header title: the size, weight, family and spacing of `type.display.md`, top padding `space.stack.sm`, and line height from `--ds-type-heading-sm-line-height`, so wrapped lines stay clear under `lines-clear-1` (ORV-194). `.text-display-md` is not used: it brings a 16 px top padding and the 1.25 line. Slice A adds one sentence for this title form to DESIGN.md section 4 line 141. Worked example W7. This is the answer to open question 6.
- Section header title: `type.heading.sm` in `text.primary`, over a `text-body-md` description in `text.secondary`, `--ds-space-inline-md` apart: the header form `expectTitleOverText` reads. Above a section header the content leaves the room DESIGN.md section 4 gives a heading.

### header-stack-1

`ds-page-header` and `ds-section-header` are containers. At `@container ds-page-header (max-width: 479px)` and `@container ds-section-header (max-width: 479px)`, named by the rule in `nav-narrow-1` and at the Table's value, the title block and `actions` stack, title first, on one start edge. Wider, they share a row with `actions` on the end edge. Neither scrolls sideways.

### frame-ink-1

Text in a frame is proved by ink, in Thai with stacked marks, and the play first walks from the text's parent up to the frame and asserts each one's overflow computes to `visible`.

For the frame clip each form below also calls `expectFrameCutsNoInk(el, frame)` under `inVitest`, with `el` the text in stacked marks and `frame` the form's frame, because `expectLabelInkWhole` reads only its own clone and cannot see a clip on an ancestor. The helper sets `overflow: visible` on `el` too, so on the Top navigation label `el` is a label that fits: a truncated label would read its own ellipsis as a cut.

- Top navigation label, one line, frame `.ds-nav-item`: `expectLabelInkWhole`.
- Sidebar and drawer label, wrapping, frame `.ds-nav-item`: `expectLinesClear`.
- Page header title, wrapping, frame `.ds-page-header`: `expectLinesClear`.
- Section header title, wrapping, frame `.ds-section-header`: `expectLinesClear`.

### reference-adopt-1

D.3 row 22's reference screen is `packages/design-system/src/examples/workspace.tsx`. Page header and Section header go inside it, in place of lines 333 to 352 and the table's visible caption. Its selection row (lines 354 to 363) keeps its `aria-live` and moves into the Section header's `actions`. The table keeps its name through `captionHidden`. Sidebar and Top navigation go around it, not inside it: the screen stays landmark-free because `/directions` embeds it inside its own `main` (ORV-161). So they appear at `/workspace` and in the story `InShell`. `decision-log.tsx` and `settings-form.tsx` also take Page header, as the same inline markup. `apps/web/app/layout.tsx` gives up its inline `header`.

### stories-1

Every story below has a Thai form and an English twin named with the suffix `En`, except `RecipesAndModes` and `InsideProfile`, which render Thai. `RecipesAndModes` goes through `Matrix` (three profiles, two modes). `Narrow` goes through the 360 px frame. A designer signs each component's stories at 360 and 1280 before its PR's G3. A sign-off has an empty `write_set` and cannot write design.md, so its PNG paths are posted on the issue as a Jira comment.

- `Application/Top navigation` (id `application-top-navigation`): `Default`, `WithCurrent`, `ParentCurrent`, `WithBadge`, `WithIcons`, `TwoRows`, `NoItems`, `Hover`, `FocusVisible`, `LongLabels`, `Narrow`, `DrawerOpen`, `SkipLink`, `RecipesAndModes`, `InsideProfile`.
- `Application/Sidebar navigation` (id `application-sidebar-navigation`): `Simple`, `SectionDividers`, `SectionLabels`, `Nested`, `NestedCurrent`, `WithBadges`, `HeaderFooter`, `Empty`, `Hover`, `FocusVisible`, `LongLabels`, `LongPage`, `Narrow`, `DrawerOpen`, `Rail`, `RailTooltip`, `RailNested`, `RailNoIcons`, `RecipesAndModes`, `InsideProfile`.
- `Application/Page header` (id `application-page-header`): `Default`, `TitleOnly`, `WithActions`, `WithMeta`, `LongTitle`, `HeadingLevel`, `Narrow`, `RecipesAndModes`.
- `Application/Section header` (id `application-section-header`): `Default`, `TitleOnly`, `WithActions`, `WithTabs`, `WithDivider`, `LongTitle`, `HeadingLevel`, `Narrow`, `RecipesAndModes`.
- `Examples/Application: Workspace (reference)`: adds `InShell` and `InShellNarrow`.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| `nav-item.bg-active` from `{surface.card}` to `{surface.selected}`; `nav-item.fg-active` from `{text.primary}` to `{selection.fg}`; `nav-item.bead` from `{brand.signature}` to `{selection.fg}` (open question 3) | Component token, `component.json`, `generated.css` | `tokens.test.ts` line 168: the readers of `brand.signature` become `["logo", "tile"]`. `spec-sheet.tsx` lines 104 to 139 sample repaints. No other reader of `--cmp-nav-item-*`. `DESIGN.md` line 79's "a bead" and line 21 lose the nav item as their case, so slice C checks that wording; line 314 is change-log history and stays |
| New `nav-item.bead-size`, `{space.inline.md}` | Component token | `spec-sheet.tsx` replaces its raw `width: 6` and `borderRadius: 999` with the tokens. Value matches `badge.dot-size` |
| New `nav-item.row-radius`, `{shape.media.radius}` | Component token | `component.json` gains one key, `generated.css` regenerates, and `.ds-nav-item` reads it on Sidebar, drawer and rail rows; `sm` stays on `nav-item.radius`. Nothing else reads it, and no value moves on an existing reader. No semantic token, primitive or profile changes. `spec-sheet.tsx` keeps `nav-item.radius` on its one-line sample, so it needs no edit for this token |
| `ds-nav-item` with `__label`, `__bead`, `__badge`, and `data-size` `sm`, `md` | Recipe, `recipes.css` | New. Holds `nav-look-1`, `nav-focus-1`, `nav-size-1` |
| `ds-top-nav`, `ds-top-nav__row` (with `data-row="sub"` on the second row), `ds-top-nav__list`, `ds-top-nav__skip`, `ds-top-nav__nav`, `ds-top-nav__actions`, `ds-top-nav__opener`, `ds-sidebar`, `ds-sidebar__panel`, `ds-sidebar__label`, `ds-sidebar__toggle`, `ds-sidebar__content`, `ds-sidebar__groups`, `ds-sidebar__group`, `ds-sidebar__list`, `ds-sidebar__opener`, `ds-nav-item__icon`, `ds-nav-group`, `ds-nav-group__trigger`, `ds-nav-group__content`, `ds-nav-drawer`, `ds-nav-drawer__list`, `ds-nav-drawer__label`, `ds-page-header`, `ds-page-header__title`, `ds-page-header__row`, `ds-page-header__text`, `ds-page-header__description`, `ds-page-header__meta`, `ds-page-header__actions`, `ds-section-header`, `ds-section-header__title`, `ds-section-header__row`, `ds-section-header__text`, `ds-section-header__description`, `ds-section-header__actions` | Recipe | New. Layout from tokens only. Raw container widths have the `ds-table` precedent; if `recipes.test.ts` rejects `calc` with a literal 2, that is a contract change to raise, not to work around |
| `pairs.ts`: `nav-item.fg` on `ds:surface.canvas` TEXT; `nav-item.fg` on `side-sheet.bg` TEXT; `nav-item.fg-hover` on `nav-item.bg-hover` TEXT; `nav-item.fg-active` on `nav-item.bg-active` TEXT; `nav-item.bead` on `nav-item.bg-active` UI; `nav-item.fg-active` on `ds:surface.canvas` TEXT; `nav-item.fg-active` on `side-sheet.bg` TEXT; `nav-item.fg-active` on `nav-item.bg-hover` TEXT; `ds:text.primary` on `ds:surface.card` TEXT, for the skip link | Recipe pairs | Nine new pairs. An open marked group shows `fg-active` on no fill and on hover, and a drawer sits on `side-sheet.bg`. `pairs.ts` holds no `ds:text.primary` row today, so the skip link's pair is new. `recipes.test.ts` and `pnpm contrast` check each under every profile in both modes. A failing pair stops slice C |
| New public `TopNavigation`, `TopNavigationProps`: `name`, `brand`, `items`, `subItems`, `subName`, `actions`, `currentPath`, `linkComponent` (default `a`), `contentClassName`, `skipHref`, `skipLabel` | Component API | New, `src/components/top-navigation/`. Built on `Sheet` |
| New public `SidebarNavigation`, `SidebarNavigationProps`: `name`, `groups`, `header`, `footer`, `children`, `currentPath`, `linkComponent`, `collapsed`, `defaultCollapsed`, `onCollapsedChange` | Component API | New, `src/components/sidebar-navigation/`. Built on `Sheet`, `Collapsible`, `Tooltip` |
| New public `PageHeader`, `SectionHeader` and props, by `page-header-slots-1` and `section-header-1` | Component API | New, `src/components/page-header/`, `src/components/section-header/`. No primitive exists to build on (K-0223): plain elements on a recipe |
| Internal `src/components/nav-item/`: `NavItem`, `current.ts`, types | Internal | Not in the public index, so no catalog entry; its states show in the parents' stories |
| `CollapsibleTriggerProps` gains `"aria-current"` and passes it to the button | Component API | Stories of `Collapsible`, and every caller, keep their output when it is not passed |
| `WorkspaceScreenProps` gains `headingLevel`, 1 to 5, default 1 | Example API | `apps/web/app/directions/page.tsx` and `DirectionStudio.stories.tsx` line 39 pass 4 (W6). `apps/web/app/workspace/page.tsx` unchanged |
| Icons `MenuIcon` (Lucide Menu), `PanelStartCloseIcon` (Lucide PanelLeftClose) | `icons.tsx` | New. `MenuIcon` is the Top navigation opener. `PanelStartOpenIcon` is reused for expand and for the Sidebar opener (`nav-narrow-1`). The shell's Sidebar reuses `DirectionIcon` and `GroupIcon` |
| `navFixtures` in `src/components/fixtures.ts` | Fixtures | New, Acceptance criteria intro |
| Locale group `nav`, and web keys in "Copy" | i18n | `check-i18n`, `apps/web/i18n/messages.test.ts` |
| Cookie `orv-sidebar` | App | `sidebar-memory-1`. New name, read and written only by `apps/web` |
| Catalog `application/top-navigation.yaml`, `sidebar-navigation.yaml`, `page-header.yaml`, `section-header.yaml`, status `draft`; `coverage.md` rows 55 to 58 | Catalog | `check-catalog`. `coverage.md` line 119's note goes |
| Skip link and `id="main"` on five `main` elements | App | `top-skip-1`. `account/page.test.tsx` line 45's regex needs `class` first, so `id` follows it |
| `apps/web/app/layout.tsx` moves its header into `AppNav` | App | `layout.test.tsx` mocks `next/navigation`. `header.spec.ts`: the content edge at lines 53, 54 and 66 reads `.ds-top-nav__row`, because the root is full width now; line 87 takes one more Tab. Lines 83 and 108 to 109 hold their numbers (W2) |
| `DESIGN.md` section 12 reference screen row | Doc | Slice F updates it |
| `DESIGN.md` section 4 line 141, one sentence for the Page header title form | Doc | Slice A adds it (`header-type-1`) |

### Copy

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | --- | --- |
| `nav.open` (design system) | เปิด{name} | Open {name} menu |
| `nav.collapse` (design system) | ย่อเมนู | Collapse menu |
| `nav.expand` (design system) | ขยายเมนู | Expand menu |
| `app.nav` (exists) | เมนูหลัก | Main |
| `app.sideNav` (web) | เมนูสตูดิโอ | Studio |
| `app.sideDirections` (web) | สองทิศทาง | Two directions |
| `app.sideWorkspace` (web) | เวิร์กสเปซ | Workspace |
| `app.skip` (web) | ข้ามไปเนื้อหาหลัก | Skip to main content |

## Acceptance criteria

Stories are those of `stories-1`. Plays run in Thai; each `En` twin runs the same play on the English copy. `navFixtures` is story data for routes that do not exist: "ภาพรวม" / "Overview" (`/overview`), "โปรเจกต์" / "Projects" (`/projects`, badge "4"), "สมาชิก" / "Members" (`/members`), and a group "ตั้งค่า" / "Settings" holding "ทั่วไป" / "General" (`/settings/general`) and "ความปลอดภัย" / "Security" (`/settings/security`), nav names "เมนูหลัก" / "Main" and second row "เมนูย่อย" / "Section". A fixture `linkComponent` records presses. Where a row says a text proof it means `frame-ink-1`. Sizes and looks are those of the named rule.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Page header `Default`, neutral, light, Thai | Rendering | "ทีมออกแบบ Brand Canvas" as the page title, a line of description under it | One `getByRole("heading", { level: 1 })`; no `header` element and no `banner` role in the canvas (`page-header-root-1`) | `Default` play |
| 2 | `DefaultEn` | Rendering | "Brand Canvas design team" and its English description | Same as row 1 (`stories-1`) | `DefaultEn` play |
| 3 | `TitleOnly` | Rendering | The title alone | No empty `p` under the root: the title block has one child (`page-header-slots-1`) | `TitleOnly` play |
| 4 | `WithActions` at 1280 | Rendering | The action button in position at the row's end edge, the title at the start edge | Button `right` equals the root's `right`, title `left` equals the root's `left`, within 0.5 (`header-stack-1`) | `WithActions` play |
| 5 | `Narrow` with an action, 360 px | Rendering | The action's position is under the title, on the same start edge, and nothing scrolls sideways | Button `top` at or below the title block's `bottom`; the two `left` values equal within 0.5; root `scrollWidth` equals `clientWidth` (`header-stack-1`) | `Narrow` play |
| 6 | `WithMeta` | Rendering | "ข้อมูลตัวอย่าง" as a label under the description | The `meta` node follows the description in DOM order (`page-header-slots-1`) | `WithMeta` play |
| 7 | `LongTitle`, `fixtures.longThai` and a title of stacked marks, 360 px | Rendering | The title wraps; no line's marks overlap the line above | The text proof for the page header title passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip, `frame` the `.ds-page-header` (`frame-ink-1`, `header-type-1`, W7) | `LongTitle` play |
| 8 | `HeadingLevel`, level 4 beside level 1 | Rendering | Two titles at one size | First heading is `h4`; both `font-size` values are equal (`heading-level-1`) | `HeadingLevel` play |
| 9 | Stories of `workspace.tsx`, `decision-log.tsx`, `settings-form.tsx` | Rendering | Each screen's title, description and action as before; "ข้อมูลตัวอย่าง" stays on the workspace screen | One `.ds-page-header` per screen; no `header` element left in the three files; existing plays pass unchanged (`reference-adopt-1`) | Plays of the three story files |
| 10 | `DirectionStudio` story with the embedded screen | Rendering | The preview shows the title as before | No `h1` inside the preview; the screen's title is `h4` (`heading-level-1`, W6) | `DirectionStudio.stories.tsx` play |
| 11 | Page header `RecipesAndModes` | Rendering | Six boundaries, the title and description readable in each colour set | Six `data-design-profile` frames render; `recipes.test.ts` passes (`stories-1`) | `RecipesAndModes` play |
| 12 | Slice A's PR | The gate runs and the designer reads the stories | Nothing new | `catalog/application/page-header.yaml` and the coverage row in the same PR, status `draft`; `check-catalog` passes; designer sign-off recorded, its PNG paths posted as a Jira comment (`stories-1`) | `check-catalog`, Jira comment |
| 13 | Section header `Default`, Thai | Rendering | "โปรเจกต์ในเวิร์กสเปซ" as a section title with a description under it, the header form's gap between them | One `getByRole("heading", { level: 2 })`; `expectTitleOverText(title, description, { gap: 8, header: true })` passes (`header-type-1`) | `Default` play |
| 14 | `DefaultEn`, `TitleOnly` | Rendering | "Projects in this workspace"; then the title alone | English title; no description node in `TitleOnly` (`section-header-1`) | `DefaultEn`, `TitleOnly` plays |
| 15 | `WithActions` at 1280; `Narrow` at 360 px | Rendering | Wide: the action in position at the end edge. Narrow: under the title on one start edge | As rows 4 and 5, on `.ds-section-header` (`header-stack-1`) | `WithActions`, `Narrow` plays |
| 16 | `WithTabs` | Rendering, then pressing the second tab | A tab row under the title; the second tab selected | The tablist follows the title row in DOM order; the title row keeps its height after the press (`section-header-1`) | `WithTabs` play |
| 17 | `WithDivider`; `Default` | Rendering | A line under the block in `WithDivider`, no line in `Default` | `expectEdgeInk` finds the edge in `WithDivider` and not in `Default` (`section-header-1`) | `WithDivider` play |
| 18 | `LongTitle`, 360 px | Rendering | The title wraps; no line's marks overlap the line above | The text proof for the section header title passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip, `frame` the `.ds-section-header` (`frame-ink-1`, W7) | `LongTitle` play |
| 19 | `HeadingLevel`, level 5, `id="s1"`, a region with `aria-labelledby="s1"` | Rendering | The title at its usual size | Heading is `h5` with `id` `s1`; `getByRole("region", { name })` finds the region (`section-header-1`, `heading-level-1`) | `HeadingLevel` play |
| 20 | Workspace `Default` and `ArchiveSelected` | Rendering, then selecting a row | "โปรเจกต์ในเวิร์กสเปซ" as a section title over the table, in position under the page header; the selection count and archive button on its end edge | `getByRole("table", { name: "โปรเจกต์ในเวิร์กสเปซ" })` still finds the table; the count's wrapper keeps `aria-live="polite"`; `expectInkClearsAbove(title, pageHeader)` passes; existing plays pass (`reference-adopt-1`) | Workspace plays |
| 21 | Section header `RecipesAndModes` | Rendering | Six boundaries, title and description readable in each colour set | As row 11 | `RecipesAndModes` play |
| 22 | Slice B's PR | The gate runs and the designer reads the stories | Nothing new | As row 12, `section-header.yaml`, with the sign-off's PNG paths posted as a Jira comment | `check-catalog`, Jira comment |
| 23 | `current.test.ts` | The cases of W1 run | Nothing | Each case gives W1's result (`nav-current-1`) | Unit test |
| 24 | Top navigation `Default`, 1280, Thai | Rendering | Logo, "ภาพรวม", "โปรเจกต์", "สมาชิก", then the actions in position at the end of one row | `getByRole("navigation", { name: "เมนูหลัก" })` holds the logo and three links; the actions sit after the `nav` and outside it; no opener in view; item height per `nav-size-1` (`top-nav-1`) | `Default` play |
| 25 | `DefaultEn` | Rendering | "Overview", "Projects", "Members" | Name "Main", three links (`stories-1`) | `DefaultEn` play |
| 26 | `WithCurrent`, `currentPath="/projects"` | Rendering | "โปรเจกต์" filled with the current colour and a bead at its start edge; the others at rest | `aria-current="page"` on that link only; computed fill and bead equal `nav-item.bg-active` and `nav-item.bead` probes; the bead has ink (`nav-current-1`, `nav-look-1`) | `WithCurrent` play |
| 27 | `ParentCurrent`, `currentPath="/projects/brand"`, then an item with `current: true` | Rendering | "โปรเจกต์" with the current look | `aria-current="true"` on that link, none on the others; the override gives the same value (`nav-current-1`) | `ParentCurrent` play |
| 28 | `Hover` | The pointer enters an item at rest | The item takes the hover colour | Computed fill equals a `nav-item.bg-hover` probe (`nav-look-1`) | `Hover` play |
| 29 | `FocusVisible`, on a marked and an unmarked item | Tab reaches each; Enter on the first | A focus line and halo inside the item, distinct from the current colour | The inset focus form reads true on both, by the computed read or `expectFocusInsetForm`; the fixture link records one press (`nav-focus-1`) | `FocusVisible` play |
| 30 | `LongLabels`, `fixtures.longThai` and a label of stacked marks | Rendering | The label stays on one line and truncates; its marks stay whole, with no overlap of the row's edge; the row's height does not change | The text proof for the Top navigation label passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip on the stacked marks label, `frame` its `.ds-nav-item`; item height per `nav-size-1` (`frame-ink-1`) | `LongLabels` play |
| 31 | `WithBadge`, `WithIcons` | Rendering | "โปรเจกต์" with a "4" badge after it; icons before labels; an item with no badge shows none | One `.ds-badge` in the row; the link's name starts with its label (`nav-item-1`) | `WithBadge`, `WithIcons` plays |
| 32 | `TwoRows`; `Default` | Rendering | A second row of links under the first in `TwoRows`, none in `Default` | Two `navigation` roles, "เมนูหลัก" and "เมนูย่อย", each with one marked link at most; one `navigation` role in `Default` (`top-nav-1`, `nav-landmark-1`) | `TwoRows` play |
| 33 | `NoItems` at 1280 and 360 px | Rendering | The logo and the actions, no list, no menu button | No `button` named by `nav.open` (`top-nav-1`) | `NoItems` play |
| 34 | `Narrow`, 360 px, `currentPath="/projects"` | Rendering | Logo, an icon button, the actions on one row; the links are out of view | `getByRole("button", { name: "เปิดเมนูหลัก", exact: true })` exists; `En` twin "Open Main menu"; root `scrollWidth` equals `clientWidth` (`nav-narrow-1`, W8) | `Narrow` play |
| 35 | `DrawerOpen`, same | The button is pressed | A drawer in position at the start edge, titled "เมนูหลัก": the items in their order, "โปรเจกต์" with the current look | `getByRole("dialog", { name: "เมนูหลัก" })`; link order equals `items`; `aria-current="page"` on "โปรเจกต์"; no `nav` in the dialog; items at the drawer height of `nav-size-1`; the text proof for a drawer label passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip, `frame` its `.ds-nav-item` (`nav-narrow-1`, `nav-landmark-1`, `frame-ink-1`) | `DrawerOpen` play |
| 36 | `DrawerOpen`, open | "สมาชิก" is pressed; reopen; Esc | The drawer closes each time | The fixture link records one press; after Esc `document.activeElement` is the opener (`nav-narrow-1`) | `DrawerOpen` play step |
| 37 | `InsideProfile`, friendly boundary, drawer open | Rendering | The drawer in the friendly profile's colours | The dialog's `closest("[data-design-profile]")` reads `friendly` (`.claude/rules/design-system.md`) | `InsideProfile` play |
| 38 | `SkipLink`, with `skipHref` and `skipLabel` | Tab once, then Enter | "ข้ามไปเนื้อหาหลัก" comes into view as an opaque bar over the row; then focus moves to the target | The link is the first focusable in the `header`; out of view before Tab; `document.activeElement` is the target after Enter (`top-skip-1`) | `SkipLink` play |
| 39 | Slice C's token and pair changes | `pnpm --filter @orivilo/design-system tokens`, `pnpm test`, `pnpm contrast` | Nothing | `generated.css` is fresh; `tokens.test.ts` line 168 reads `["logo", "tile"]`; the nine new pairs pass under every profile in both modes ("Contract changes and impact", row `pairs.ts`) | `tokens.test.ts`, `recipes.test.ts`, `pnpm contrast` |
| 40 | Top navigation `RecipesAndModes` | Rendering | Six boundaries; the current item keeps a visible fill and bead colour in each | Six frames; the bead has ink on `bg-active` in each (`stories-1`, `nav-look-1`) | `RecipesAndModes` play |
| 41 | Slice C's PR | The gate runs and the designer reads the stories | Nothing new | As row 12, `top-navigation.yaml`, with the sign-off's PNG paths posted as a Jira comment; the entry says the two-row form has no route yet | `check-catalog`, Jira comment |
| 42 | Sidebar `Simple`, 1280, Thai | Rendering | A panel in position at the page's start with "ภาพรวม", "โปรเจกต์", "สมาชิก", content beside it | `getByRole("navigation", { name: "เมนูหลัก" })`; no `aside` and no `complementary` role; panel width per `sidebar-flow-1`; item height per `nav-size-1` (`nav-landmark-1`) | `Simple` play |
| 43 | `SectionLabels` | Rendering | A group label over each list | No heading role in the `nav`; `getByRole("list", { name })` finds each group by its label (`sidebar-groups-1`) | `SectionLabels` play |
| 44 | `SectionDividers` | Rendering | A line between groups, no labels | `expectEdgeInk` finds the line (`sidebar-groups-1`) | `SectionDividers` play |
| 45 | `Nested`, `currentPath="/overview"` | Enter on "ตั้งค่า", then Space | The group opens under its button with "ทั่วไป" and "ความปลอดภัย", then closes | The button has no `href`; `aria-expanded` goes true, then false; children absent while closed (`nav-group-1`, `nav-item-1`) | `Nested` play |
| 46 | `NestedCurrent`, `currentPath="/settings/general"` | Rendering | "ตั้งค่า" open with its ink current; "ทั่วไป" filled with the current colour and a bead | Button `aria-current="true"`, link `aria-current="page"`; the button has no fill (`nav-current-1`, `nav-look-1`, `nav-group-1`) | `NestedCurrent` play |
| 47 | `NestedCurrent` | The person closes the group; `currentPath` becomes `/overview`, then `/settings/security` | Closed; closed; open again | Closed "ตั้งค่า" takes the full look before the route moves; `aria-expanded` true after the route enters (`nav-group-1`, `nav-look-1`) | `NestedCurrent` play step |
| 48 | `WithBadges`, `Hover`, `FocusVisible` | Rendering; pointer; Tab | Badge after the label; hover colour; focus line and halo inside the item | As rows 28, 29 and 31, on `.ds-sidebar`; the inset focus form reads true by the computed read or `expectFocusInsetForm` (`nav-focus-1`) | Three plays |
| 49 | `LongLabels`, 1280 | Rendering | The label wraps inside the item, the item grows, no line's marks overlap the line above | The text proof for the Sidebar label passes, with `expectFrameCutsNoInk(el, frame)` for the frame clip, `frame` its `.ds-nav-item` (`frame-ink-1`, W7) | `LongLabels` play |
| 50 | `HeaderFooter` | Rendering | The `header` slot above the list and the `footer` slot in position under it | DOM order header, list, footer inside the `nav` (`sidebar-groups-1`) | `HeaderFooter` play |
| 51 | `Empty`, no groups | Rendering | The page content alone | No `navigation` role; `children` render (`sidebar-groups-1`) | `Empty` play |
| 52 | `LongPage`, content taller than the frame | The page scrolls down | The panel leaves with the page | Panel `top` falls by the scroll distance; every ancestor up to the frame computes overflow `visible` (`sidebar-flow-1`) | `LongPage` play |
| 53 | `Narrow` and `DrawerOpen`, 360 px, `currentPath="/settings/general"` | Rendering; the button is pressed | Content at full width under a row with an icon button; then a drawer with the group open and "ทั่วไป" with the current look | `nav` still in the DOM holding `getByRole("button", { name: "เปิดเมนูหลัก", exact: true })`; the dialog holds the same order; `aria-current="page"` on "ทั่วไป"; Esc returns focus (`nav-narrow-1`, `nav-landmark-1`) | `Narrow`, `DrawerOpen` plays |
| 54 | `InsideProfile`, drawer open | Rendering | The drawer in the friendly profile's colours | As row 37 | `InsideProfile` play |
| 55 | Sidebar `RecipesAndModes` | Rendering | Six boundaries; the current item keeps a visible fill and bead colour in each | As row 40 | `RecipesAndModes` play |
| 56 | Slice D's PR | The gate runs and the designer reads the stories | Nothing new | As row 12, `sidebar-navigation.yaml`, with the sign-off's PNG paths posted as a Jira comment | `check-catalog`, Jira comment |
| 57 | `Rail`, Thai, `currentPath="/projects"` | "ย่อเมนู" is pressed, then the same button | The layout changes: the panel narrows to icons and the content fills the room, then the panel widens; "ขยายเมนู" names the button in between ("Collapse menu", "Expand menu" in `RailEn`) | Width per `sidebar-rail-1` (W3); `getByRole("link", { name: "โปรเจกต์ 4" })` stays; `aria-current="page"` stays; focus stays on the toggle; `onCollapsedChange` fires once per press | `Rail` play |
| 58 | `RailTooltip`, collapsed | The pointer rests on an item, then Tab reaches another | The label beside the rail in a tooltip, one at a time | `role="tooltip"` holds the label; no other new node, so no panel (`sidebar-rail-1`) | `RailTooltip` play |
| 59 | `Rail`, collapsed | Rendering | Square icon targets, group labels gone, dividers kept, groups closed, the current item with its fill and bead colour | Each link's width equals its height, per `sidebar-rail-1`; `expectEdgeInk` finds the divider; the group's button reads `aria-expanded` false and its children are absent; `nav-look-1` as row 26 | `Rail` play step |
| 60 | `RailNested`, collapsed, `currentPath="/settings/general"` | The "ตั้งค่า" button is pressed | Before the press the group is closed with the full look; then the Sidebar widens and the group opens | Before the press `aria-expanded` false and the marked button takes the fill and the bead; after it `collapsed` false, `aria-expanded` true, `document.activeElement` is that button (`sidebar-rail-1`) | `RailNested` play |
| 61 | `RailNoIcons`, one first-level item with no `icon` | Rendering | The wide Sidebar and no toggle | No button named by `nav.collapse` (`sidebar-rail-1`) | `RailNoIcons` play |
| 62 | `Rail` at 360 px, `collapsed` true | Rendering | The drawer form, not the rail | The opener exists; no toggle in view (`sidebar-rail-1`, `nav-narrow-1`) | `Rail` play step |
| 63 | Slice E's PR | The gate runs and the designer reads the stories | Nothing new | `sidebar-navigation.yaml` lists the rail state; designer sign-off recorded, its PNG paths posted as a Jira comment (`stories-1`) | `check-catalog`, Jira comment |
| 64 | `/directions`, Thai and English | Loading the page | "สตูดิโอ" marked in the top menu; "สองทิศทาง" marked in the side menu ("Studio", "Two directions") | `aria-current="page"` on both (`shell-ia-1`, `nav-current-1`) | New `apps/web/e2e/shell.spec.ts` |
| 65 | `/workspace` | Loading the page | "สตูดิโอ" marked; "เวิร์กสเปซ" marked in the side menu | `aria-current="true"` on Studio, `aria-current="page"` on Workspace (`shell-ia-1`) | `shell.spec.ts` |
| 66 | `/account`, then `/` | Loading the page | "บัญชี" marked on `/account`; nothing marked on `/`; no side menu on either | `aria-current="page"` on Account; no `[aria-current]` on `/`; one `navigation` role on each (`shell-ia-1`) | `shell.spec.ts` |
| 67 | The axe scan, its routes in th and en, light and dark, 360 and 1280 | `pages.a11y.spec.ts` runs | Nothing new | Its rules pass, `landmark-unique`, `region`, `heading-order`, `skip-link`, `target-size` and `label-content-name-mismatch` among them; `/workspace` shows the landmark count of W5 (`nav-landmark-1`) | `pages.a11y.spec.ts`, `shell.spec.ts` |
| 68 | The home page, its widths and locales | `header.spec.ts` runs | The header's layout holds as ORV-194 set it | Its numbers at lines 83, 104 to 109 pass; no horizontal overflow; Tab reaches the skip link, then the home link (W2) | `header.spec.ts` |
| 69 | `/workspace` at 360 px, Thai | The side menu's button is pressed, then "สองทิศทาง" | The drawer opens titled "เมนูสตูดิโอ"; the route changes and it closes | URL `/directions`; no dialog in the DOM; button name "เปิดเมนูสตูดิโอ" (`nav-narrow-1`, W8) | `shell.spec.ts` |
| 70 | Each route of `top-skip-1` | Tab, then Enter | "ข้ามไปเนื้อหาหลัก" shows; focus moves to the content | `document.activeElement.id` is `main` on each of the five routes ("Skip to main content" in English) | `shell.spec.ts` |
| 71 | `/workspace` at 1280 | "ย่อเมนู" is pressed, then reload | The rail stays after the reload, with no wide panel first | Cookie `orv-sidebar=collapsed` with W9's max age; first HTML already has the collapsed state (`sidebar-memory-1`) | `shell.spec.ts` |
| 72 | `layout.test.tsx` | It renders `RootLayout` | Nothing | The header holds the home link with its svg, Studio and Account links in that order in the server HTML (`nav-narrow-1`) | Unit test |
| 73 | Workspace `InShell`, `InShellNarrow` | Rendering | Top menu, side menu and the reference screen in position in one page; at 360 px both menus as icon buttons and the table in its narrow form; beside the wide Sidebar the table turns where `nav-narrow-1` says | `WorkspaceScreen` itself holds no landmark; `getByRole("main")` is the story's; one `h1`; under neutral `.ds-table__frame` `clientWidth` and the table's form at containers 768, 769 and 770 match W4 (`reference-adopt-1`, `nav-narrow-1`) | `InShell`, `InShellNarrow` plays |
| 74 | Slice F's copy and docs | `check-i18n` and `messages.test.ts` run | Nothing | Every key of "Copy" has Thai and English; no middot and no em dash; `DESIGN.md` section 12 and `coverage.md` name the four parts | `check-i18n`, `messages.test.ts`, `check-catalog` |
| 75 | Each slice's PR | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` runs | Nothing | All four pass, real output in the PR | CI and the G3 gate |

## Rows per PR

- PR 189: rows 1-12, 75

The main session adds one line per PR once it exists, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line. The plan is six PRs, one deliverable each, in this order. A and B can run beside C. D needs C, E needs D, F needs all of them. Row 75 belongs to every PR.

<!-- prettier-ignore -->
| Slice | Deliverable | Rows | Changed lines, estimate |
| --- | --- | --- | --- |
| A | Page header in the catalog, used by the three example screens, with `headingLevel` on the workspace screen | 1 to 12 | 350 |
| B | Section header in the catalog, used by the reference screen | 13 to 22 | 300 |
| C | Top navigation in the catalog, with the matcher, `ds-nav-item`, the token changes and the pairs | 23 to 41 | 400 |
| D | Sidebar navigation in the catalog, with groups, nested items and the drawer | 42 to 56 | 400 |
| E | The rail state of the Sidebar | 57 to 63 | 200 |
| F | The app shell on both navigations, with the skip link, the cookie, the `InShell` stories and the docs | 64 to 74 | 350 |

## Rows that render nothing

- Rows: 12, 22, 23, 39, 41, 56, 63, 67, 72, 74, 75

## Out of scope

- Breadcrumb and a Back link in Page header: D.3 row 26 (ORV-229).
- Avatar and an account menu in either navigation: D.3 row 21 (ORV-224). Banner compositions.
- Dropdowns in Top navigation. The hybrid link and button group row (K-0229).
- Permissions, roles or per-workspace items in any menu. The shell's items are static.
- `landing.tsx`'s own header and `nav`, the home page's headings, `/directions`' own `h1` and the `DirectionStudio` `h3` headings, `ds-inspector__header` and `ds-chat__header`.
- A global search, a notification bell, feature cards.
- The screen flow and final look of the shell beyond these parts. The POC's focus is function, so the top row's width beside a Sidebar is open question 9's answer, not a redesign.
- A screen reader run.

## Open questions (each with a default)

<!-- prettier-ignore -->
| # | Question | Options | Default |
| --- | --- | --- | --- |
| 1 | Which landmark is the side navigation? (K-0224, K-0225; neither sidebar read has `nav`, K-0205, K-0216) | a) `nav` with its own name. b) `aside`, a complementary landmark, holding a `nav`: two landmarks for one panel, and `aside` must stay top level. c) `aside` alone, as Untitled UI: no navigation landmark at all | a), in `nav-landmark-1`: the panel is navigation, and one named landmark keeps the count low (W5) |
| 2 | Which heading order bar do Page header and Section header hold to? (K-0230, K-0231, K-0210) | a) WHATWG's "must", at most one level deeper, plus one `h1` per page. b) WCAG's reading only, order is advisory and SC 2.4.10 is AAA, so the contract states nothing and axe `heading-order` stays the only check | a), in `heading-level-1`: it costs one prop, and the scan already reads order. It is what forces `headingLevel` on the workspace screen |
| 3 | How does the current page look, given DESIGN.md section 8 gives Selected to `surface.selected` and limits `brand.signature`? Section 8's Brand presence row names "the brand badge's bead only", while section 3.1's `brand.signature` row says "a bead" with no owner, so the two read differently. (K-0204, K-0205) | a) Repoint: `bg-active` to `surface.selected`, `fg-active` and `bead` to `selection.fg`, bead shape kept as the non-colour cue. b) Keep `surface.card` and a `brand.signature` bead: `surface.card` is not Selected by section 8, and a card fill vanishes on a card ground. c) `surface.selected` with a `brand.signature` bead: section 3.1 would allow it, but the bead is here part of the selection cue, and brand accent never replaces selection semantics (AGENTS.md). d) No bead: colour alone fails section 7 | a), in "Contract changes and impact" and `nav-look-1`. Answered below |
| 4 | What is the collapse shortcut, since Mod+B is `panel.toggle-library`, scope app (DESIGN.md section 12, K-0214)? | a) None; the visible toggle is the keyboard path. b) Mod+\, free in `catalog/commands/canvas.yaml` by search: a new command entry, a focus check in text fields (shadcn's listener has none, K-0214), and a catalog change. c) Move `panel.toggle-library`: rejected, it changes a shipped binding for a two-item menu | a), in `nav-shortcut-1`. b) can follow when the Sidebar has more items |
| 5 | Does a rail ship at all? (K-0206, K-0235; K-0214 for shadcn's `collapsible="icon"`) | a) Ships, as slice E, on `sidebar-rail-1`: keyboard reachable, marked, no hover panel. b) No rail: the shell has two items, and AGENTS.md rule 6 says lean | a), because the owner asks for variant depth comparable to Untitled UI (`component-benchmark`) and both libraries read have an icon form. Slice E is its own PR, so dropping it removes rows 57 to 63, row 71 and `sidebar-memory-1`, and nothing else |
| 6 | Does a wrapping Page header title take a taller line? (K-0210; DESIGN.md section 4; W7) | a) Line height from `--ds-type-heading-sm-line-height`, so wrapped lines clear; a one-line title grows by W7's figure. b) Keep 1.25 and accept touching marks on wrap | a), in `header-type-1`. Answered below |
| 7 | Does the shell gain a skip link? (K-0232; SC 2.4.1) | a) Yes, on `TopNavigation`, in this story. b) Leave it: landmarks and headings also meet SC 2.4.1 by ARIA11 and H69, and the header is short | a), in `top-skip-1`: the Sidebar adds stops ahead of the content on two routes |
| 8 | Which items go where, with four routes? (K-0208, K-0233) | a) Top holds Studio and Account; Sidebar holds Two directions and Workspace on those two routes. b) No Sidebar in the app yet, stories only: D.3 row 22 names the Studio shell, so the row would stay half done. c) Sidebar on every route: it would repeat Top's items | a), in `shell-ia-1` |
| 9 | Does the top row's `max-w-2xl` stay on routes with a Sidebar? (ORV-194 rows 12, 13) | a) Stay: `header.spec.ts` numbers hold, and the row's start edge differs from the panel's at wide widths. b) Full width on all routes: `header.spec.ts` line 108 changes, a new number for the owner to see | a). Not taken, answered below |

### Answers

G2 passed under delegation (ORV-225 comment 10532) on the designer's answers in `design.md`, section "Answers to the open questions". The other questions stand on their defaults. Each value lives in the rule named here.

<!-- prettier-ignore -->
| # | Answer | Why | Home |
| --- | --- | --- | --- |
| 3 | Default a), confirmed | Ink and bead carry the mark, and the fill is a soft ground, never the only mark. Every pair passes in the four colour sets (`design.md`, worst contrast pairs). Shot under neutral, friendly and professional in both modes | `nav-look-1`, "Contract changes and impact" |
| 6 | Default a), with the changed padding | At 1.25 wrapped lines collide; at 1.7 they clear, and the ink sits lower in its box, so a smaller top padding still gives the mark its room (`design.md`, Page header title table) | `header-type-1`, W7 |
| 9 | Neither a) nor b): the designer's proposal, a third option, the per-route top row | Default a) renders three start edges at 1440. The proposal puts the logo on the Sidebar's icon edge | `shell-ia-1` |

## Depends on

- `docs/specs/ORV-64/audit.md` section B (form), section D.3 row 22.
- ADR 0003 (Radix behaviour, own visual layer), ADR 0012 (gates), ADR 0013 (qa approve on a code PR).
- `DESIGN.md` sections 3.1, 4, 6, 7, 8, 12.
- `.claude/rules/design-system.md`, `.claude/rules/testing.md`.
- ORV-161 (the screen stays landmark-free), ORV-194 (rows 7, 12, 13, `lines-clear-1`).
- `docs/specs/ORV-225/design.md` and G2, ORV-225 comment 10532 (the comment taken from this task's facts; Jira itself not read in this role).
- ORV-222 PR 186 (the helper `expectFrameCutsNoInk`, which `frame-ink-1` calls). It merges before any slice of this issue is built.
- ORV-137 comment 10247 (benchmark table, as read through `.claude/rules/design-system.md`; Jira itself not read in this role).

## Knowledge

- K-0204 to K-0212: Untitled UI sidebar, header, page header, section header and breadcrumbs.
- K-0213 to K-0223: shadcn/ui Sidebar, Navigation Menu, Breadcrumb, and Radix sources.
- K-0224 to K-0235: APG, ARIA in HTML, WAI-ARIA 1.2, WCAG 2.2 and WHATWG facts on landmarks, `aria-current`, disclosure, heading order, bypass, reflow, focus and target size.
- K-0236: the synthesis these tables come from, with its "Not read" list.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1, `nav-current-1`, on the app's real routes and the K-0208 cases. Expected, in order: `none, /directions page, /directions page, /directions page, /directions true, none, /directions true, /directions page, /a/b true, none`.

```bash
node -e 'const norm=p=>{const s=p.split(/[?#]/)[0];return s.length>1?s.replace(/\/+$/,""):s};const raw=(h,p)=>{const a=norm(h),b=norm(p);return a===b?"page":a!=="/"&&b.startsWith(a+"/")?"true":null};const pick=(items,p)=>{const hits=items.map(i=>({h:i.href,v:i.current===false?null:raw(i.href,p)??(i.current===true?"true":null)})).filter(x=>x.v);const w=hits.find(x=>x.v==="page")??hits.sort((x,y)=>y.h.length-x.h.length)[0];return w?w.h+" "+w.v:"none"};const top=[{href:"/directions"},{href:"/account"}];console.log([pick(top,"/"),pick(top,"/directions"),pick(top,"/directions/"),pick(top,"/directions?x=1"),pick(top,"/directions/abc"),pick(top,"/directionsx"),pick([{href:"/directions",current:true},{href:"/account"}],"/workspace"),pick([{href:"/"},{href:"/directions"}],"/directions"),pick([{href:"/a"},{href:"/a/b"}],"/a/b/c"),pick([{href:"/directions",current:false}],"/directions")].join(", "))'
```

W2, `nav-size-1`: `pt-4` (16, `layout.tsx` line 30), `--ds-size-control-sm` (32), Logo default height (24). Expected `48 20`, the numbers `header.spec.ts` lines 83 and 109 read. No rounding.

```bash
node -e 'const top=16,row=32,logo=24;console.log(top+row,top+(row-logo)/2)'
```

W3, `sidebar-rail-1`: `--cmp-nav-item-height` (40), `--ds-space-inset-sm` (8), the 24 px of SC 2.5.8 (K-0235). Expected `56 true`. No rounding.

```bash
node -e 'const item=40,inset=8;console.log(item+2*inset,item>=24)'
```

W4, `nav-narrow-1`: `--op-breakpoint-md` (768), `--ds-size-panel-min` (240), the screen's `p-6` (24 each side, `workspace.tsx` line 332), the 1 px borders of `.ds-table__frame` (`recipes.css` line 1192, 2 in all), and the Table's narrow query (479). Expected `767 478 true`: at the narrowest wide form the table takes its narrow form. Then `479 true 480 false`: at containers 769 and 770, so it is a table from 770. No rounding.

```bash
node -e 'const bp=768,panel=240,pad=24,border=2,table=479;const f=c=>c-panel-2*pad-border;const w=f(bp);console.log(bp-1,w,w<=table);console.log(f(769),f(769)<=table,f(770),f(770)<=table)'
```

W5, `nav-landmark-1`: landmarks on `/workspace` and the bound of seven (K-0224). Expected `4 true`.

```bash
node -e 'const l=["banner","Main nav","Studio nav","main"];console.log(l.length,l.length<=7)'
```

W6, `heading-level-1`: the path through `/directions` to the embedded screen, page `h1`, studio `h2` (`DirectionStudio.tsx` line 481), preview `h3` (line 698), then the screen and its section. Expected `true 2` today's order with a section header added at its default, `true 1` with `headingLevel` 4. Today's order passes the depth test and fails on the `h1` count, which is why the level is passed.

```bash
node -e 'const deep=o=>o.every((l,i)=>i===0||l<=o[i-1]+1);const h1=o=>o.filter(l=>l===1).length;for(const o of [[1,2,3,1,2],[1,2,3,4,5]])console.log(deep(o),h1(o))'
```

W7, `header-type-1`: the gap between lines is size times (line height minus 1.58), from DESIGN.md section 4 (1.25 em above, 0.33 em below). Inputs in order: display-md at 1.25, heading-md at 1.3, heading-sm at 1.7, label-md at 1.7, display size at 1.7. Then the growth of a one-line title at 32 px, from the box height of 1.25 with top padding 16 (56) to that of 1.7 with top padding 8 (62.39). Both boxes are the measured ones of `design.md`'s Page header title table, in Chromium at DPR 2; the plain sum for the second is 62.40. Expected `-10.56 -6.72 2.40 1.68 3.84 6.39`, two places. Against the `lines-clear-1` floor of 1.5 less one device pixel, 1.25 fails and 1.7 passes.

```bash
node -e 'const g=(s,l)=>(s*(l-1.58)).toFixed(2);console.log(g(32,1.25),g(24,1.3),g(20,1.7),g(14,1.7),g(32,1.7),(62.39-56).toFixed(2))'
```

W8, `nav-narrow-1`: `fill` on `nav.open`. Expected `เปิดเมนูหลัก, Open Main menu, เปิดเมนูสตูดิโอ, Open Studio menu`.

```bash
node -e 'const fill=(t,v)=>t.replace(/\{(\w+)\}/g,(_,k)=>v[k]);console.log([fill("เปิด{name}",{name:"เมนูหลัก"}),fill("Open {name} menu",{name:"Main"}),fill("เปิด{name}",{name:"เมนูสตูดิโอ"}),fill("Open {name} menu",{name:"Studio"})].join(", "))'
```

W9, `sidebar-memory-1`: `maxAge` of `orv-locale`, `apps/web/i18n/actions.ts` line 27. Expected `31536000` seconds.

```bash
node -e 'console.log(60*60*24*365)'
```

## Changelog

- 1: first version, from K-0204 to K-0236 and the repo on this branch.
- 1.1: takes in `design.md` amendments 1 to 12 and its answers to open questions 3, 6 and 9, with question 9 on the designer's proposal (G2, ORV-225 comment 10532). Rules changed: `nav-focus-1`, `nav-narrow-1`, `top-nav-1`, `top-skip-1`, `sidebar-rail-1`, `shell-ia-1`, `section-header-1`, `header-type-1`, `header-stack-1`. Rows 12, 22, 41, 56 and 63 post the sign-off's PNG paths as a Jira comment (`stories-1`). `frame-ink-1` and rows 7, 18, 30, 35 and 49 name `expectFrameCutsNoInk(el, frame)` for the frame clip, because `expectLabelInkWhole` reads only its own clone, and Depends on gains PR 186. Rows 29, 38, 39, 48, 59, 60 and 73 and W4 and W7 follow the amendments, and the front matter points to `design.md`. No row number changes, so "Rows per PR" stands. Downstream to review: `design.md` (it still reads "Waits for a decision" on question 9), the slice A to F builder envelopes, the designer's sign-off list and the qa envelopes.
- 1.2: by the main session. Rows per PR gains the line for PR 189, slice A. No requirement changes.
