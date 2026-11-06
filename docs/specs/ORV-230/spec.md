---
issue: ORV-230 (https://tpetkaew.atlassian.net/browse/ORV-230)
lane: L (a new component public API is an L-lane risk flag, AGENTS.md "Lanes and gates"; G1 and G2 pass under the owner's delegation during the POC, ADR 0012 decision 4). The Jira issue was not read in this role, which has no Jira tool; the main session confirms the lane
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 27 ("Accordion, Separator, Metric, Filters": Inspector groups, overview; each has a story and catalog entry)
design: docs/specs/ORV-230/design.md
version: 1.2
---

# ORV-230: Accordion, Separator, Metric and Filter bar

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, one per component, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). The cells rest on the synthesis K-0369, which ties them to K-0340 to K-0368 (read 2026-11-06) and to K-0120 to K-0123 (read 2026-11-01, not re-read). The Ours rows were re-read on this branch at `cbbaa15`. The Add and Do not copy rows are this spec's choices from the options K-0369 lists; each points to the rule in "Rules" that holds it.

### Accordion

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | None. <https://www.untitledui.com/react/components> has no Accordion, Collapsible or Disclosure entry, and `components/base` and `components/application` of the open repo hold no such folder (K-0340). Nearest names: eight FAQ section examples at <https://www.untitledui.com/react/marketing/faq-sections>, "Accordion 01" to "04" and brand forms, with no behaviour text and no code read (K-0340). No variants, sizes, states or slots to read. |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/accordion>. Parts `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`; examples Basic, Multiple, Disabled, Borders, Card, RTL (K-0341). Variants and sizes: none named (K-0341). States: open and closed by `data-state`, disabled on an item (K-0341, K-0342). Slots: a trailing chevron in the trigger, one rotated in `new-york-v4`, two swapped in `bases/radix` (K-0342). No `aria-`, `role`, `asChild` or reduced-motion string in the `new-york-v4` file (K-0342). Primitive (Radix): Root `type` required, `collapsible` default false, `disabled`, `dir`, `orientation` default vertical; Item `value`, `disabled`; Header; Trigger; Content `forceMount` (K-0343). Keys: Space, Enter, Tab, Shift + Tab, arrows, Home, End, skipping disabled triggers and wrapping at the ends (K-0344). Header is `h3` until `asChild` changes it; `aria-disabled` while open and not collapsible; Content `role="region"` and `aria-labelledby` (K-0345). Height variables and a 300ms example with no reduced-motion rule (K-0346). |
| Ours | No Accordion: no component, no story, no row in `coverage.md`; `collapsible.yaml` line 10 says "an Accordion, not built yet". Collapsible exists, `draft`, story `base-collapsible` (`coverage.md` line 33), where audit line 68 still says `none`: `open`, `defaultOpen`, `onOpenChange`, `disabled`; trigger a ghost md `Button` with `ExpandIcon` or `CollapseIcon`; content fades in at `motion.feedback.duration`, no height animates (`Collapsible.tsx`, `collapsible.yaml`). DirectionStudio has four native `<details>` blocks (K-0369). `radix-ui` 1.8.1 (`packages/design-system/package.json` line 29) already exports `Accordion` (`radix-ui/dist/index.d.ts` lines 3 and 4), with `@radix-ui/react-accordion` 1.3.1 in `pnpm-lock.yaml` line 1625. |
| Add | Root and Item props from the primitive, `type` single or multiple (K-0343): `acc-api-1`. `collapsible` set on purpose, since it is off by default (K-0343, K-0345): `acc-api-1`. A heading level the caller sets, the button alone in the heading (K-0345, K-0348): `acc-heading-1`. `aria-controls` in both states (K-0348): `acc-aria-1`. A rule for `region` when many panels may be open (K-0345, K-0349): `acc-region-1`. Radix's arrow, Home and End keys, each in a story (K-0344): `acc-keys-1`. An open item with `aria-disabled` in a story (K-0345, K-0349): `acc-aria-1`. Collapsible's chevron and fade, so the two read alike (`collapsible.yaml`): `acc-motion-1`, `acc-look-1`. A long Thai trigger label at 360 px: `acc-look-1`. |
| Do not copy | shadcn's classes (`border-b`, `hover:underline`, `text-sm`, `animate-accordion-*`) (K-0342): our components consume a recipe (`.claude/rules/design-system.md`): `acc-look-1`. Radix's 300ms ease-out height example (K-0346): a raw duration with no reduced-motion rule: `acc-motion-1`. The `h3` as a fixed level (K-0345): the APG asks for a level that suits the page (K-0348): `acc-heading-1`. A control inside the heading (K-0348): the APG keeps the button alone there: `acc-heading-1`. Untitled's FAQ accordion as a model (K-0340): a marketing section whose behaviour is not described. Horizontal orientation (K-0343, K-0344): the APG calls an accordion vertically stacked (K-0347) and no ORIVILO story names it: `acc-api-1`. |

### Separator

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | No Separator entry; the audit (line 66) maps it to <https://www.untitledui.com/react/components/content-dividers.md> (K-0352). Variants: `type` single-line, dual-line, background-fill, required, no default (K-0352). Sizes: none on the page (K-0352). States: none on the page (K-0352). Slots: `children` (a text label, `Button` or `ButtonGroup`), `className` (K-0352). Orientation: the words vertical and orientation are not on the page (K-0352). Accessibility: a plain `div`, rules decorative, not exposed as a separator; a real heading inside when it opens a section; an `aria-label` on an icon-only button (K-0353). `SectionDivider` in `shared-assets` is a `div` with one `hr`, not on the index (K-0354). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/separator>. One part. Variants and sizes: none named (K-0355). Props `orientation` default horizontal and `decorative` default true, a 1 px `bg-border` line by data attribute (K-0355). States and slots: none (K-0355). Examples Vertical, Menu, List, RTL; no accessibility text (K-0355). Primitive (Radix): `asChild`, `orientation` default horizontal, `decorative` with no default; decorative gives `role="none"`, otherwise `role="separator"`, with `aria-orientation` written only when vertical, and `data-orientation` always (K-0356). |
| Ours | No Separator: no component, no story, no row in `coverage.md`. Private forms: `.ds-menu__separator` in DropdownMenu, ContextMenu and Select, each a Radix separator; `.ds-controls__divider`, a vertical 1 px `span` with no role; border lines on `--cmp-node-divider`, `--cmp-command-divider`, `--cmp-inspector-divider`, `--cmp-taskbar-divider`. The focusable case is Resizable's handle (K-0369). `border.subtle` is "Dividers; card edges in dark mode only" (`DESIGN.md` section 3.1). `radix-ui` 1.8.1 already exports `Separator` (`radix-ui/dist/index.d.ts` lines 49 and 50). |
| Add | `orientation` horizontal and vertical, with `aria-orientation` on vertical only (K-0355, K-0356, K-0358): `sep-api-1`, `sep-role-1`. `decorative` with a default chosen on purpose, since shadcn and Radix differ (K-0355, K-0356): `sep-api-1`. A line on `border.subtle` (`semantic.json`): `sep-look-1`. |
| Do not copy | shadcn's `bg-border`, `h-px` and `w-px` classes (K-0355): our recipes hold the look: `sep-look-1`. A text or button child inside `role="separator"` (K-0358): by our reading it is not exposed: `sep-scope-1`. `aria-orientation="horizontal"` written by hand (K-0358): it is the implicit value, and Radix leaves it off (K-0356): `sep-role-1`. A focusable separator (K-0357): it requires `aria-valuenow`, and Resizable already owns that job: `sep-scope-1`. `background-fill` and `dual-line` (K-0352): by our reading they are content bars, not lines: `sep-scope-1`. |

### Metric

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/metrics.md>. Variants: nine cards, `MetricsSimple`, `MetricsIcon01` to `04`, `MetricsChart01` to `04`, shown in 18 examples (K-0359); `MetricChangeIndicator` `type` simple, trend, modern (K-0360). Sizes: none on a card (K-0362). States: positive or negative through `trend` on two cards and `changeTrend` on five, which swaps the colours between the success and error tokens; no text on loading, empty or skeleton (K-0360, K-0362). Slots: `footer`, `actions` (off on three cards only), `icon` (three cards), `chartData`, `chartColor`, `chartAreaFill`, `chartCurveType`, `className` (K-0361). Accessibility: no text (K-0362). The title and value props, the API table and the code were not read (K-0359, K-0368). |
| shadcn/ui | None: the component list has no Metric or Stat (K-0363). This row is not filled from a nearest page. |
| Ours | No Metric: `coverage.md` line 64 lists it `none`, as does audit line 102. A local, unexported `Metric` in `src/examples/decision-log.tsx` (lines 131 to 139): `Card as="article"`, `CardTitle as="h2"`, `CardValue`, a note, with figures "computed from the rows shown, never typed in" (line 31). `CardValue` is "Digits, a unit and a sign only" (`Card.tsx` line 115). `formatNumber` and `formatPercent` exist (`i18n/format.ts`). Skeleton and Spinner are `draft`. `recharts` is not in `packages/design-system/package.json`. `icons.tsx` has no trend glyph (K-0369). |
| Add | A card over `Card`, `CardTitle` and `CardValue`, as the example composes it: `metric-look-1`. A change line whose direction shows by shape as well as colour (K-0360, `DESIGN.md` section 7): `metric-change-1`. A number formatted by `formatNumber` or `formatPercent`, since the page's `change` is a ready string (K-0360): `metric-change-1`. A missing value and a loading state, which the page does not cover (K-0362): `metric-data-1`. A figure traced to its rows, as the example's comment says: `metric-data-1`. |
| Do not copy | Two names for one prop, `trend` and `changeTrend` (K-0360): one control reads two ways: `metric-api-1`. Nine named exports for one idea (K-0359): our catalog names variants on one component: `metric-api-1`. Recharts charts (K-0359, K-0361): a new dependency, which AGENTS.md rule 6 allows only when the story needs it: `metric-api-1`. A dots menu that some cards cannot turn off (K-0361): the page gives neither its items nor its name: `metric-api-1`. A `footer` slot (K-0361): an option K-0369 raises, left out because no story here needs one (AGENTS.md rule 6): `metric-api-1`. Colour set by a positive or negative prop alone (K-0360): the page does not say what a bad rise shows: `metric-tone-1`. |

### Filter bar

<!-- prettier-ignore -->
| Item | Detail |
| ---- | ------ |
| Untitled UI | <https://www.untitledui.com/react/components/filter-bars.md>. Variants: 13 examples: eight bars, three filter dropdown menus, two slideout menus (K-0364). Sizes: search `Input` `size="sm"` only (K-0367). States: by example title, empty, inactive, active, plus `isDisabled` on `FilterDropdown`; no text on loading (K-0364, K-0366). Slots: `FilterBar.Root`, `Content`, `Actions`, `FilterRow` (`onRemove`), `FilterIconButton` (`icon`, `label` required, `onPress`), layout only, no filter state (K-0365). `FilterDropdown`: `filters`, `renderFilterRow`, `onAddFilter`, `onRemoveFilter`, `onFilterChange`, `onClearAll`, `onApply`, `appliedCount`, `children`, `placement` (K-0366). Small screens: `DateRangePicker` hidden below `md`, an icon-only Filters button, short labels such as `7d` (K-0367). Accessibility: `label` is the icon button's only name; search `aria-label="Search"`; `shortcut` registers nothing (K-0367). |
| shadcn/ui | None: the component list has no Filter or Filter bar (K-0363). This row is not filled from a nearest page. |
| Ours | No Filters: `coverage.md` line 65 lists it `none`, as does audit line 103; Date picker and Combobox are also `none`. In use: Tabs as a three-way filter in `decision-log.tsx` (lines 43, 105, 226). Parts that exist: InputGroup with `start` and `aria-label` on its input; `SearchIcon`; Select (stable) with `aria-label` (`Select.tsx` line 57); Tag (draft), whose entry names "a filter", with `onRemove` and the name `tag.remove` (`tag.yaml`, `th.ts` line 112). `Button` with `aria-disabled` stays focusable and inert (`Button.tsx` lines 60 to 66). Table has no filter prop. `icons.tsx` has no filter glyph (K-0369). |
| Add | A layout shell that holds no state, with the caller's state outside it (K-0365): `filter-api-1`. Regions that wrap (K-0365): `filter-look-1`. A clear-all action (K-0366): `filter-clear-1`. A removable Tag per active filter (K-0365, `tag.yaml`): `filter-api-1`. A small-screen form proven at 360 px (K-0367): `filter-look-1`. Copy from the locale catalog (K-0367, AGENTS.md): `filter-api-1`. A spoken result count, which no page read covers (K-0115): `filter-status-1`. |
| Do not copy | English strings in the component ("Filters", "Apply filter", "Search", `7d`) (K-0366, K-0367): every UI string comes from the locale catalog: `filter-api-1`. A `shortcut` hint with no handler (K-0367): it promises a key that does nothing: `filter-api-1`. Hiding `DateRangePicker` below `md` (K-0367): the filter is lost on a phone: `filter-look-1`. A custom trigger that silently drops `appliedCount` and `isDisabled` (K-0366): a state vanishes without a sign, and this story has no trigger: `filter-api-1`. The field, operator and value query builder (K-0364, K-0366): Date picker and Combobox are `none` and audit D.3 row 27 does not name it, so by AGENTS.md rule 6 it waits for a story that needs it (Out of scope). An Apply button (K-0366): `filter-apply-1`. |

### Not read

These stay unread, and this spec does not fill them from memory (K-0369, "Not read"):

- Untitled UI API tables, demo code and component code for Content dividers, Metrics and Filter bars, so a Metric card's title and value props are unknown (K-0352, K-0359, K-0364, K-0368).
- Untitled's page previews (K-0364), its FAQ accordion code (K-0340) and its "Metrics sections" marketing page (K-0359).
- shadcn's Accordion example bodies, the keyframes behind its animation classes, and its blocks pages (K-0341, K-0342, K-0363).
- The Base UI and React Aria APIs that shadcn's other versions defer to (K-0341, K-0355).
- Whether the Radix docs describe the versions pinned in `pnpm-lock.yaml` (K-0343, K-0356). The Radix statements in "Rules" therefore cite the installed `dist/index.mjs` files by line.
- The whole `aria-orientation` "Used in Roles" list (K-0358).
- No standard was read for Metric or Filter bar (K-0369, "What the standards say").

## Goal

The Studio holds detail in groups, shows overview figures and lists that grow. Audit D.3 row 27 asks for the four components those screens need, each with a story and a catalog entry: an Accordion for Inspector groups, a Separator between blocks, a Metric and a Filter bar for overview screens. Today a figure is a private function in one example, a divider is one of several private lines, and a filter is a set of Tabs.

This story gives the design system the four shared components, in Thai and English, for a mouse, a keyboard and a screen reader. A person can open only the group they need. A figure never claims more than its data: a missing number says so, and a rise that is bad news reads as bad news without colour alone. A filter takes effect at once, says how many results remain, and survives a phone.

What is real and what is not, so nobody over-reads it: the four components render real markup, and Accordion and Separator take their behaviour from Radix. Every figure and every filter result in the stories is mock data from `src/components/fixtures.ts` or the example's `DECISIONS` rows, and the story docs say so. The direction and tone of a change are computed by rule from two numbers and the caller's `betterWhen`, not by any model. Only the decision log example moves onto a new component (`metric-example-1`). When this story ends, no Studio screen and no Inspector shows an Accordion, a Separator or a Filter bar. No screen reader test has been run: `acc-aria-1`, `acc-region-1` and `filter-status-1` rest on the pages read and on the installed source, not on a measured announcement.

## Story

As a person using ORIVILO, I open only the group of detail I need, I read a figure and know where it stands and whether that is good, and I narrow a long list and hear how much is left, so I can find what matters on a phone or a desktop, by mouse, keyboard or screen reader.

## Rules

### acc-base-1

`Accordion` sits on `Accordion` from the `radix-ui` package, in `src/components/accordion/Accordion.tsx`. It does not wrap our `Collapsible`, and it holds no key handler of its own. Radix's own Accordion wraps Radix's Collapsible (K-0345), so the behaviour matches our Collapsible's without our Collapsible being a part of it. No package is added (open question 1).

### acc-api-1

Four new public parts, exported from `@orivilo/design-system`:

- `Accordion` (contract type `AccordionProps`), a union on `type`. `type: "single"` takes `value` and `defaultValue` as a string, `onValueChange(value: string)` and `collapsible` (default true, where Radix's default is false; open question 3). `type: "multiple"` takes `value` and `defaultValue` as a string array and `onValueChange(value: string[])`. Both take `headingAs`, required, one of `h2`, `h3`, `h4`, `h5`, `h6`; `disabled`; `className` for layout only; `children`.
- `AccordionItem` (`AccordionItemProps`): `value`, required; `disabled`; `className` for layout only; `children`.
- `AccordionTrigger` (`AccordionTriggerProps`): `children` (the label), `className` for layout only. It renders Radix's Header and Trigger together.
- `AccordionContent` (`AccordionContentProps`): `children`, `className` for layout only. Its children render only while open, as Collapsible's do, so state inside a closed panel is lost; the catalog entry says so.

No `orientation`, `dir`, `asChild`, `forceMount`, size or variant. The component owns no copy.

### acc-heading-1

`AccordionTrigger` renders Radix's Header with `asChild` over the element `headingAs` names, holding the trigger button and nothing else. No prop puts another control in the heading; a caller's action goes inside the panel.

### acc-aria-1

`aria-expanded` and `data-state` on the trigger are Radix's. `aria-controls` is ours, in both states: `AccordionItem` takes one `useId()` value and passes it as `id` to Radix's Content and as `aria-controls` to Radix's Trigger. Radix spreads both after its own values, and keeps the closed panel element in the DOM, `hidden` and empty, so the reference resolves while closed (`@radix-ui/react-collapsible` 1.2.1 `dist/index.mjs` lines 66 and 71, 128 to 130, 137). Open question 4 gives the reason.

`aria-disabled` is Radix's, on the open item of a group with `collapsible={false}` (`@radix-ui/react-accordion` 1.3.1 `dist/index.mjs` line 288). `Button` then blocks the press and stays focusable (`Button.tsx` lines 60 to 66). A disabled item takes `disabled` and `data-disabled` from Radix. Worked example W1 maps the states.

### acc-region-1

Under `type="single"`, a panel keeps Radix's `role="region"` and `aria-labelledby`: at most one is open. Under `type="multiple"`, `AccordionContent` passes `role` and `aria-labelledby` as `undefined`, which Radix spreads after its own values (`@radix-ui/react-accordion` 1.3.1 `dist/index.mjs` lines 309, 310 and 313): the number of open panels is then the person's, and the K-0349 warning has no limit to hold. The two go together, since a name on an element with no role names nothing. W1 maps the states.

### acc-keys-1

The keys are Radix's, with nothing added or removed: Enter and Space toggle the focused trigger, Tab and Shift + Tab follow the page order, ArrowDown and ArrowUp move focus between triggers and wrap at the ends, Home and End go to the first and last trigger, and a disabled trigger is skipped (K-0344, `dist/index.mjs` lines 135 and 157 to 192). These keys act only while a trigger has focus (line 138), so a control inside a panel keeps its own arrow keys.

### acc-motion-1

Opening fades the content in with the existing `ds-fade-in` keyframes at `--ds-motion-feedback-duration` and `--ds-motion-easing`, on the bare `.ds-accordion__content` selector, the form of `col-motion-1` in `docs/specs/ORV-203/spec.md`. Closing is at once. No rule animates or transitions `height`, `width`, `transform` or an inset. A `prefers-reduced-motion: reduce` rule on the same bare selector, later in the file, sets `animation: none`. The bare class sets no `display`, so the `hidden` attribute keeps working on a closed panel.

### acc-look-1

`AccordionTrigger` is Radix's Trigger with `asChild` over our `Button`, `variant="ghost"`, `size="md"`, class `ds-accordion__trigger`. The label sits in a `ds-accordion__label` span. The trailing icon is `ExpandIcon` while closed and `CollapseIcon` while open, swapped with no transition, so the state shows by shape. The trigger fills the item's width with the label at the start and the chevron at the end (open question 2). The recipe sets its `border-radius` to `--ds-shape-media-radius`, so the ground is one rounded card at every line count, as `menu.option.radius` is (ORV-204). The label wraps, so it takes `type.label.md` (`DESIGN.md` section 4), with `padding-block` from the height and `1lh` so that one line stays the md height (W7). The chevron stays beside the first line, as in `.ds-collapsible__trigger`.

New component tokens: `accordion.divider` from `border.subtle`, a 1 px line under each item but the last; `accordion.trigger-type` from `type.label.md`; `accordion.content-type` from `type.body.sm`; `accordion.content-gap` from `space.stack.md`, under the content. `.ds-accordion__item` has `padding-block` `--ds-space-inline-sm`, and `.ds-accordion__content` has `padding-block-start` `--ds-space-inline-sm`, so the 3 px focus halo clears the divider and the panel's first line. The content starts on the label's start edge and sets no colour. The pitch of a closed one-line row is 48 px, 49 with its divider (W8).

On the open item of a group with `collapsible={false}`, the recipe keeps `button.ghost.fg` on the label and sets `cursor: default`, since `.ds-button[data-variant="ghost"][aria-disabled="true"]` would otherwise put the disabled ink on the heading of the panel being read. The chevron takes `button.ghost.fg-disabled`, so the glyph does not promise a close. The two selectors exclude `:disabled`, so an open item that is also `disabled` keeps Button's disabled look.

`pairs.ts` gains no pair: the trigger's pairs are Button ghost's, the content sets no colour. Its "Not listed" comment gains `accordion.divider`, a `border.subtle` divider.

### sep-api-1

`Separator` is a new public component in `src/components/separator/Separator.tsx`, on `Separator` from the `radix-ui` package, exported from `@orivilo/design-system`, with the contract type `SeparatorProps`:

- `orientation`: `horizontal` (default) or `vertical`.
- `decorative`: boolean, default true (open question 8).
- `className` for layout only.

No `children`, `asChild`, variant or size.

### sep-role-1

The role is Radix's and is never written by hand: W2 maps `decorative` and `orientation` to `role` and `aria-orientation`. `data-orientation` is always set (K-0356). A Separator never takes focus.

### sep-look-1

The recipe `ds-separator` reads one new component token, `separator.line`, from `border.subtle`. The line is a 1 px border and never a background, because forced colours paint a background out. A horizontal line is `border-block-start` at its parent's width; a vertical line is `border-inline-start`, stretches to its parent's height and is at least `1lh` tall, so it never vanishes in a block parent; neither shrinks. The 1 px is the raw value the private dividers and `--cmp-inspector-divider` lines already use. The recipe sets no margin: the space beside the line is the caller's, with layout utilities.

`pairs.ts` lists no pair for it. Its "Not listed" comment gains `separator.line`, a `border.subtle` divider, for both values of `decorative`: the space around the line separates on screen, and the role tells a screen reader.

### sep-scope-1

`Separator` is a bare line and nothing else: no label, no button, no second line, no fill, no focus. A labelled divider waits for a story that needs one, and then is its own component with a real heading inside (open question 7). A focusable separator stays Resizable's job.

### metric-api-1

`Metric` is a new public component in `src/components/metric/Metric.tsx`, exported from `@orivilo/design-system`, with the contract type `MetricProps`:

- `title`: string, required.
- `value`: number or `undefined`, required as a key, so a caller states what it has.
- `kind`: `number` (default) or `percent`, where a `value` of 1 is 100%, as `formatPercent` reads it.
- `note`: optional string.
- `compare`: optional object: `value` (a number), `label` (a string naming the base, in the person's language), `betterWhen` (`up`, `down` or absent).
- `loading`: optional boolean.
- `titleAs`: a `CardTitleTag`, with `CardTitle`'s default.
- `className` for layout only.

No `change` string, `trend`, `changeTrend`, `icon`, `footer`, `actions`, `size`, `type` or chart prop: one component with one direction name, and no dependency added. A separate module `src/components/metric/change.ts` holds `metricChange(value, previous, kind)`, the method of `metric-change-1`, and is not exported from the package.

### metric-data-1

A `value` that is `undefined` or not finite is no data. The tile shows `metric.missing` in `ds-metric__missing`, never in `CardValue`, which holds digits only, and shows no change line and no tone. `0` is a real value and shows as digits.

With no `compare`, or a `compare.value` that is not finite, there is no change line and no tone.

With `loading`, the title stays and a `SkeletonGroup` takes the place of the value and the change line: a `Skeleton shape="block"` in `ds-metric__skeleton-value`, and with a `compare` a `Skeleton shape="text"` in `ds-metric__skeleton-change`; `loading` wins over `value`. The group's own label speaks the state (`skeleton.yaml`).

`Metric` takes numbers only and formats them with `formatNumber` or `formatPercent`, so no caller can type a figure or a trend as a string. A caller's numbers come from its data, as the decision log computes its own from the rows shown.

### metric-change-1

The method, in `metricChange`, with `delta = value - previous`:

- The rounded size of the change is what the person would read: for `number`, `Math.abs(delta)` to three decimals, the most `formatNumber` shows; for `percent`, `Math.abs(delta) * 100` to a whole number, in percentage points.
- The direction is `flat` when that rounded size is 0, otherwise `up` when `delta` is above 0 and `down` when below. The direction states the number and never its meaning.

The line is the direction's word and size, then `compare.label`, in that order: `metric.up` or `metric.down` with `{amount}`, or `metric.flat` alone. `{amount}` is `formatNumber` of the rounded size, and for `percent` it goes through `metric.points`, because a change between two percentages is not a percentage of either.

The glyph before the line is `TrendUpIcon`, `TrendDownIcon` or `MinusIcon` for `up`, `down` or `flat`, hidden from assistive tech as every icon is; the words carry the direction. Worked example W3 runs the method on the fixtures.

### metric-tone-1

Tone is the meaning of the direction, and only the caller's data can give it. With no `betterWhen`, or a `flat` direction, there is no tone. Otherwise the direction equal to `betterWhen` is `better` and the opposite is `worse`.

Tone shows as a `Badge` at `size="sm"` beside the figure, in `ds-metric__figure`, with the word `metric.better` on `variant="success"` or `metric.worse` on `variant="danger"`. The line's own ink stays neutral. So a rise that is bad news keeps its up glyph and its word for the rise, because the number did rise, and the Badge says it is worse, in words as well as colour (open question 10).

### metric-look-1

`Metric` renders `Card as="article"` with `CardTitle` and `CardValue`, with the classes `ds-metric`, `ds-metric__figure`, `ds-metric__change`, `ds-metric__missing`, `ds-metric__note`, `ds-metric__skeleton-value`, `ds-metric__skeleton-change`, and adds no overflow rule. `ds-metric__figure` holds `CardValue` and the Badge. The figure, `ds-metric__missing` and `ds-metric__skeleton-value` take one slot height, the value type's size times its line height, so a tile keeps its shape in every state. `.ds-card` already breaks a long word. The glyph sits beside the first line of a wrapped change line.

New component tokens: `metric.change-fg` and `metric.note-fg` from `text.secondary`; `metric.missing-fg` from `text.secondary`; `metric.change-type` and `metric.note-type` from `type.body.sm`; `metric.missing-type` from `type.body.md`. `pairs.ts` lists the three inks on `card.bg` at floor 4.5. Badge's pairs exist.

### metric-example-1

`src/examples/decision-log.tsx` drops its local `Metric` and uses the shared one, with `titleAs="h2"` and `note` as it has them now. Its figures stay computed from the rows shown: `value={rows.length}`, `value={review}` and, with `kind="percent"`, `withReason / rows.length`. With no rows the share is `undefined`, because a share of nothing has no backing data; the `Empty` story and its comment change with it (open question 12). `DecisionLog` passes no `compare`, because it holds no earlier figure.

### filter-api-1

Three new public parts in `src/components/filter-bar/FilterBar.tsx`, exported from `@orivilo/design-system`:

- `FilterBar` (`FilterBarProps`): `label`, a required string that names the group; `active`, a required boolean, true while any filter is on; `onClearAll`, required; `resultCount`, a number or `undefined`; `className` for layout only; `children`. The root is `role="group"` with `aria-label`.
- `FilterBarControls` (`FilterBarControlsProps`): `children`, `className` for layout only. It holds the caller's controls, such as an `InputGroup` and a `Select` at `size="sm"`, each named by the caller, so a row shares one 32 px height with Tag md and the clear button.
- `FilterBarActive` (`FilterBarActiveProps`): `children`, `className` for layout only. It holds one `Tag` with `onRemove` per active filter, as a `role="group"` named `filterBar.active`, and renders nothing with no children.

The component holds no filter state and fetches nothing. It has no `filters`, `onApply`, `appliedCount`, `renderFilterRow`, `shortcut` or `placement` prop and no trigger of its own. Its own words come from the locale catalog. It adds no glyph.

### filter-apply-1

A filter applies on change. Each control's own change event reaches the caller, which updates its list at once. There is no Apply button and no draft state (open question 13). `Tabs` as a filter works this way in the decision log.

### filter-clear-1

A `Button`, `variant="ghost"`, `size="sm"`, with the word `filterBar.clear`, stays mounted at all times. With `active` false it carries `aria-disabled`, so it is inert and focusable. With `active` true a press calls `onClearAll` once. Focus stays on the button through the change, since nothing unmounts it. Removing a Tag unmounts its remove button, so the caller moves focus to the next Tag, or to this button after the last one, as Task bar does (`TaskBar.tsx` line 157).

### filter-status-1

A `role="status"` element is mounted from the first render, whatever `resultCount` holds, so its text is what changes (K-0115). It holds nothing while `resultCount` is `undefined`, including while the caller loads. Otherwise it holds `filterBar.resultsNone` for 0, `filterBar.resultsOne` for 1, and `filterBar.results` with `{count}` through `formatNumber` above that. W6 maps it. The count is the caller's count of the rows it shows, never a typed figure.

### filter-look-1

The recipe `ds-filter-bar` draws no ground and no edge, and sits on a canvas or a card. Its order: the controls, then the active Tags, then `ds-filter-bar__meta`, which holds the count (`ds-filter-bar__count`) and the clear button at the end. `ds-filter-bar__controls`, `ds-filter-bar__active` and `ds-filter-bar__meta` wrap. The root is an inline-size container named `ds-filter-bar`, so the bar answers to its own width on a canvas or in a card. Each control is `--ds-size-panel-min` wide. Below 480 px of container each region and each control takes a full row, the count stays at the start and the clear button at the end. No control is hidden at any width. `display: none` never reaches the status.

New component tokens: `filter-bar.gap` from `space.inline.md`; `filter-bar.row-gap` from `space.stack.sm`; `filter-bar.count-fg` from `text.secondary`; `filter-bar.count-type` from `type.body.sm`. `pairs.ts` lists `filter-bar.count-fg` on `ds:surface.canvas` and on `ds:surface.card` at floor 4.5.

### catalog-rows-1

`coverage.md` changes in the PR of the component it names, as its line 3 asks: Base gains `| Accordion | draft | base-accordion |` and `| Separator | draft | base-separator |` after Collapsible; Application's `Metric` row becomes `draft`, `application-metric`; Application's `Filters` row becomes `Filter bar`, `draft`, `application-filter-bar`. `collapsible.yaml` line 10 loses "not built yet" in the Accordion PR. `docs/specs/ORV-64/audit.md` is a dated research record and stays as it is (open question 15).

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` and their `*Props` types (`acc-api-1`) | Component API | New exports in `src/components/index.ts`; new `catalog/base/accordion.yaml`; `catalog-rows-1` |
| `Separator`, `SeparatorProps` (`sep-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/base/separator.yaml`; `catalog-rows-1` |
| `Metric`, `MetricProps` (`metric-api-1`) | Component API | New export in `src/components/index.ts`; new `catalog/application/metric.yaml`, with `src/examples/decision-log.tsx` under `examples`; `catalog-rows-1` |
| `FilterBar`, `FilterBarControls`, `FilterBarActive` and their `*Props` types (`filter-api-1`) | Component API | New exports in `src/components/index.ts`; new `catalog/application/filter-bar.yaml`; `catalog-rows-1` |
| Recipe classes `ds-accordion` with `__item`, `__heading`, `__trigger`, `__label`, `__content`; `ds-separator`; `ds-metric` with `__figure`, `__change`, `__missing`, `__note`, `__skeleton-value`, `__skeleton-change`; `ds-filter-bar` with `__controls`, `__active`, `__meta`, `__count` | Recipe | `recipes.css`; `recipes.test.ts` checks each value is a `--cmp-*` or `--ds-*` property |
| The component tokens of `acc-look-1`, `sep-look-1`, `metric-look-1`, `filter-look-1` | Component token | `component.json`, regenerated `generated.css` (`pnpm --filter @orivilo/design-system tokens`); `pairs.ts` as those four rules say; no semantic or profile change |
| New glyphs `TrendUpIcon` (Lucide `TrendingUp`), `TrendDownIcon` (Lucide `TrendingDown`) (`metric-change-1`) | Icons | `src/components/icons.tsx`, and the glyph count in its comment |
| The locale keys of "Copy" | Copy | `src/i18n/messages/th.ts` and `en.ts`; `check-i18n` |
| Fixtures `accordionFixtures`, `separatorFixtures`, `metricFixtures`, `filterBarFixtures` | Story content | `src/components/fixtures.ts`, labelled mock |
| The decision log's metric tiles (`metric-example-1`) | Page example | `src/examples/decision-log.tsx`; `decision-log.stories.tsx`, the `Empty` play and comment; `coverage.md` page example rows unchanged |

No runtime dependency is added: `radix-ui` 1.8.1 already carries Accordion and Separator (W5) and `lucide-react` 1.52.0 carries both glyphs, so `package.json` and `pnpm-lock.yaml` do not change and no `security` pass is called for by a dependency. An option below that adds Recharts would bring one (Out of scope).

Not changed: Collapsible's code and stories, Card, Badge, Tag, Select, InputGroup, Tabs, Table, Inspector, DirectionStudio, the private separators, any semantic token or profile, `apps/web`.

### Copy

The catalog keys, then the story fixtures. The fixtures are caller text, not catalog keys; they are mock, and they live in `src/components/fixtures.ts` so `check-i18n` holds.

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | ---- | ------- |
| `metric.missing` | ไม่มีข้อมูล | No data |
| `metric.up` | เพิ่มขึ้น {amount} | Up {amount} |
| `metric.down` | ลดลง {amount} | Down {amount} |
| `metric.flat` | เท่าเดิม | No change |
| `metric.points` | {amount} จุดเปอร์เซ็นต์ | {amount} percentage points |
| `metric.better` | ดีขึ้น | Better |
| `metric.worse` | แย่ลง | Worse |
| `filterBar.clear` | ล้างตัวกรอง | Clear filters |
| `filterBar.active` | ตัวกรองที่ใช้อยู่ | Active filters |
| `filterBar.results` | พบ {count} รายการ | {count} results |
| `filterBar.resultsOne` | พบ 1 รายการ | 1 result |
| `filterBar.resultsNone` | ไม่พบรายการที่ตรงกับตัวกรอง | No results match these filters |

<!-- prettier-ignore -->
| Fixture | Thai | English |
| ------- | ---- | ------- |
| `accordionFixtures` trigger 1 | ข้อมูลแบรนด์ | Brand details |
| `accordionFixtures` content 1 | ชื่อแบรนด์ คุณค่า และกลุ่มลูกค้า | Brand name, values and audience |
| `accordionFixtures` trigger 2 | สีและตัวอักษร | Color and type |
| `accordionFixtures` content 2 | สีหลักและฟอนต์ที่ใช้ในทุกหน้า | The main color and the fonts each page uses |
| `accordionFixtures` trigger 3 | แหล่งที่มา | Sources |
| `accordionFixtures` content 3 | ไฟล์และโหนดที่ข้อมูลชุดนี้อ้างถึง | The files and nodes this data points to |
| `separatorFixtures` above, below | โปรไฟล์, การแจ้งเตือน | Profile, Notifications |
| `separatorFixtures` start, end | แก้ไข, ดูตัวอย่าง | Edit, Preview |
| `metricFixtures` compare label | จากสัปดาห์ก่อน | from last week |
| `metricFixtures.all` title, note | การตัดสินใจทั้งหมด, รายการในโปรเจกต์นี้ | All decisions, Items in this project |
| `metricFixtures.reasoned` title | มีเหตุผลกำกับ | With a reason |
| `metricFixtures.waiting` title | รอรีวิว | Waiting for review |
| `metricFixtures.failed` title | งานที่ไม่สำเร็จ | Failed jobs |
| `metricFixtures.nodes` title | โหนดบนบอร์ด | Nodes on the board |
| `filterBarFixtures` label | กรองการตัดสินใจ | Filter decisions |
| `filterBarFixtures` search | ค้นหาการตัดสินใจ | Search decisions |
| `filterBarFixtures` status | สถานะ | Status |
| `filterBarFixtures` status values | รอรีวิว, อนุมัติแล้ว | Waiting for review, Approved |
| `filterBarFixtures` tag | สถานะ: รอรีวิว | Status: Waiting for review |

The numbers of `metricFixtures` are in W3. Filter stories list the `DECISIONS` rows of `src/examples/decision-log.tsx`.

## Acceptance criteria

Stories: `Base/Separator` (id `base-separator`), `Base/Accordion` (id `base-accordion`), `Application/Metric` (id `application-metric`), `Application/Filter bar` (id `application-filter-bar`), each a new `*.stories.tsx` beside its component. Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); an `InEnglish` story nests `LocaleProvider locale="en"`. Waits are `waitFor` on a condition, never a fixed time. "The six boundaries" means neutral, professional, friendly, each in light and dark. A 360 px frame is `Narrow` from `src/components/matrix.tsx`, which sets no overflow; `At360` stories keep it that way, unlike the frame of Collapsible's `At360`. Calls to `expectEdgeInk`, `expectLinesClear`, `expectLabelInkWhole`, `expectInkClearsAbove` and `expectFrameCutsNoInk` run under `inVitest`. The test iframe is 1200 px wide (`Select.stories.tsx` line 94).

The measurements in `design.md` come from a render of real components with proposal CSS in Chromium. No play, `recipes.test.ts` run or screen reader touched it, so they are expectations. An amendment that rests on the built component is proven by the play its row names here.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | Separator `Default` renders between "โปรไฟล์" and "การแจ้งเตือน" | A thin line across the column between the two words | None. Role as W2 line 1 (`sep-role-1`) | `Default` play: `role` and `data-orientation` asserted, no `aria-orientation`, no `tabindex`; `expectEdgeInk(line, "top", 1)`, with the story keeping the words more than 4 px from the line, since that helper reads 4 px each side; line width equals its parent's to 0.5 px; computed `border-block-start-width` is `1px` and `background-color` is transparent, so the ink is a border (`sep-look-1`) |
| 2 | Same | Separator `Vertical` renders between "แก้ไข" and "ดูตัวอย่าง" in a row, and a second vertical line alone in a block parent | A thin upright line as tall as the row, between the two words; the second line stays visible, one line of text tall | None. Role as W2 line 2 | `Vertical` play: attributes as W2; `expectEdgeInk(line, "left", 1)`, with the same space as row 1; line height equals the row's to 0.5 px; computed `border-inline-start-width` is `1px` and `background-color` is transparent; the second line's height is not below its computed `line-height`, to 0.5 px (`sep-look-1`) |
| 3 | Same | Separator `Semantic` renders one horizontal and one vertical line with `decorative={false}` | The same two lines | None. Roles as W2 lines 3 and 4 | `Semantic` play: `getAllByRole("separator")` length 2; `aria-orientation` absent on the first and `vertical` on the second |
| 4 | Same, English | Separator `InEnglish` renders the states of rows 1, 2 and 3 | The same lines beside "Profile", "Notifications", "Edit", "Preview" | None | `InEnglish` play: the four words present; `getAllByRole("separator")` length 2 |
| 5 | A 360 px frame | Separator `At360` renders a horizontal line between two `fixtures.longThai` paragraphs | The names wrap, the line spans the frame, no horizontal scroll | None | `At360` play: frame `scrollWidth` not above 360; line width equals the frame's to 0.5 px; each paragraph and every ancestor of it up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLinesClear` on the first paragraph; `expectFrameCutsNoInk(paragraph, frame)` |
| 6 | Storybook test project | Separator `RecipesAndModes` renders one horizontal and one vertical line through `Matrix` | The two lines in the six boundaries | None | `RecipesAndModes` play: counts as W4 |
| 7 | The PR head | `pnpm typecheck` and the catalog and i18n checks run | Not a screen | `@ts-expect-error` lines hold for `children`, a `variant` prop and `asChild` (`sep-api-1`); `catalog/base/separator.yaml` (story `base-separator`, status `draft`, variants `[horizontal, vertical]`, states `[decorative, semantic]`, recipes neutral, professional, friendly) resolves; `catalog-rows-1` holds for its row; no middot or em dash | `pnpm --filter @orivilo/design-system typecheck` and `pnpm --filter @orivilo/design-system test` output (check-catalog, `i18n.test.ts`, `check-i18n`) |
| 8 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Separator `Default`, `Vertical`, `Semantic`, `At360`, `RecipesAndModes` | A line that divides without shouting, on the canvas and on a card, in both modes; under forced colours, one line and not a hollow double line | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set`. No play emulates forced colours, so this row is that look's proof. The answers to open questions 7 and 8 stand at the top of "Open questions" |
| 9 | Storybook test project, neutral, light, Thai | Accordion `Default` renders `type="single"`, `headingAs="h3"`, the three fixture items, closed | Three rows, "ข้อมูลแบรนด์", "สีและตัวอักษร", "แหล่งที่มา", each with a chevron down; no panel text | None. Trigger and panel as W1 line 1 (`acc-aria-1`) | `Default` play: `getAllByRole("heading", { level: 3 })` length 3; for each trigger, `aria-expanded`, and `aria-controls` equal to an element's `id` in the DOM that has `hidden`; the visible chevron is the down one; `queryByText` of a fixture content is null |
| 10 | Same | Accordion `OneAtATime`: the person presses "ข้อมูลแบรนด์", then "สีและตัวอักษร", then "สีและตัวอักษร" again | First panel opens with "ชื่อแบรนด์ คุณค่า และกลุ่มลูกค้า"; then it closes as the second opens with "สีหลักและฟอนต์ที่ใช้ในทุกหน้า"; then none is open | `onValueChange` spy called with the first value, the second value, then `""`. W1 lines 1 and 2 hold in turn | `OneAtATime` play: `userEvent.click`, `queryAllByRole("region")` length 1 while one is open, its name equal to the trigger's; `canvasElement.querySelectorAll('[role="region"]')` length 3 at the same moment, since a closed panel keeps the attribute while `hidden` (W1 line 1) and `queryAllByRole` skips it. This play is the proof of that count, which the design render did not run; spy call order; the visible chevron swaps |
| 11 | Same | Accordion `Multiple` renders `type="multiple"`; the person presses two triggers | Two panels open together | `onValueChange` spy called with one value, then two. Panels as W1 line 4 (`acc-region-1`) | `Multiple` play: both contents visible; `queryAllByRole("region")` length 0; no open panel has `aria-labelledby` |
| 12 | Same | Accordion `Controlled` holds `value` in story state and is pressed twice on one item | Opens, then closes | Story state follows; spy called twice | `Controlled` play: `aria-expanded` follows the state; `toHaveBeenNthCalledWith` |
| 13 | Same | Accordion `Keyboard`: Tab to the first trigger, Enter, Space, ArrowDown, ArrowUp twice, Home, End. Then, with a panel holding a `Slider`, ArrowDown on the Slider | Focus line and halo on the focused trigger; the panel opens and closes; focus walks the triggers and wraps from the first to the last | None. The keys of `acc-keys-1`; the Slider's value changes and focus stays on it | `Keyboard` play: `userEvent.tab`, `userEvent.keyboard`, `toHaveFocus()` after each key; `aria-expanded` after Enter and Space; Slider `aria-valuenow` changed |
| 14 | Same | Accordion `Disabled`: the second item `disabled`; the person presses it, then ArrowDown from the first trigger. A second group with `disabled` on the root is pressed. A third group, `collapsible={false}`, holds an open item that is also `disabled` | The second row in Button's disabled look, nothing opens; focus skips to the third trigger; the third group's open item keeps Button's disabled look | None. `disabled` and `data-disabled` on the trigger (`acc-aria-1`) | `Disabled` play: `toBeDisabled()`, `aria-expanded="false"` after the click, `toHaveFocus()` on the third trigger; on the second group, each trigger disabled; on the third group, the open trigger has `disabled` and `aria-disabled="true"`, and its label computed `color` equals resolved `--cmp-button-ghost-fg-disabled` (`acc-look-1`) |
| 15 | Same | Accordion `NotCollapsible` renders `type="single"`, `collapsible={false}`, first item open; the person presses it | The panel stays open, its label keeps its normal ink and its chevron goes quiet | None. Trigger as W1 line 3 (`acc-aria-1`, `acc-look-1`); it keeps focus | `NotCollapsible` play: `aria-disabled="true"`, not `disabled`, `aria-expanded="true"` after the click, `toHaveFocus()`; label computed `color` equals resolved `--cmp-button-ghost-fg`; the chevron's computed `color` equals resolved `--cmp-button-ghost-fg-disabled`; computed `cursor` is `default`. The chevron is read on `.ds-button__icon` and `cursor` on the trigger |
| 16 | Same | Accordion `HeadingLevels` renders groups with `headingAs` `h2` and `h4` | The same rows | None. The heading level follows the prop and the heading's only element child is the button (`acc-heading-1`) | `HeadingLevels` play: `getByRole("heading", { level })` for 2 and 4; `heading.children.length` is 1 and that child is the trigger |
| 17 | Same | A panel opens in `OneAtATime`, and Accordion `ReducedMotion` renders | The content fades in, nothing grows or slides | None. Computed `animationName` and `animationDuration` as `acc-motion-1`, with the duration of W2 in `docs/specs/ORV-203/spec.md`; a closed panel's computed `display` is `none` | Stylesheet walks in the form of `Collapsible.stories.tsx` lines 104 to 129 and 224 to 235, on the exact selector `.ds-accordion__content` |
| 18 | Same, English | Accordion `InEnglish` renders the states of rows 9, 10, 11, 14 and 15 | "Brand details", "Color and type", "Sources", and after a press "Brand name, values and audience" | None | `InEnglish` play: the three trigger names; `aria-expanded="true"` after the click; the content found; a disabled item and an open item with `aria-disabled` asserted |
| 19 | A 360 px frame | Accordion `At360` renders an item whose trigger label and open content are `fixtures.longThai`, with a short item after it, so the long item has the divider. The person then presses the long trigger closed | The long name wraps inside the frame in the label and in the panel, the chevron beside the label's first line, no horizontal scroll; the short trigger is the height of W7; the long trigger's ground is one rounded card, clear of the divider | None | `At360` play: frame `scrollWidth` not above 360; short trigger height equals W7's total to 0.5 px; the `ds-accordion__label` and the content and every ancestor of each up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLinesClear` on the label and on the content; `expectFrameCutsNoInk(label, frame)` and `expectFrameCutsNoInk(content, frame)`; the chevron's bottom is above the label's top plus the label's computed `line-height`, so it sits beside the first line; the trigger's computed `border-radius` equals resolved `--ds-shape-media-radius`, and the trigger's bottom is at least 3 px above the item's divider. Both read the long trigger, the divider after the press that closes it, because an open item keeps its panel in that gap and the last item has no divider. While it is open, `expectInkClearsAbove(content, trigger, 3)` |
| 20 | Storybook test project | Accordion `RecipesAndModes` renders one `type="multiple"` group through `Matrix`, first item open | The group in the six boundaries | None. `type="multiple"` so the Matrix holds no region: six same-named regions would repeat a landmark, which `matrix.tsx` lines 68 and 69 say the a11y addon reports | `RecipesAndModes` play: counts as W4; contrast is Button ghost's pairs, by `recipes.test.ts` |
| 21 | The PR head | `pnpm typecheck` and the catalog and i18n checks run | Not a screen | `@ts-expect-error` lines hold for a missing `headingAs`, `headingAs="h1"`, `collapsible` on `type="multiple"`, a string `value` on `type="multiple"` and an `orientation` prop (`acc-api-1`); `catalog/base/accordion.yaml` (story `base-accordion`, status `draft`, variants `[single, multiple]`, states `[closed, open, disabled, open-locked]`, recipes neutral, professional, friendly) resolves; `catalog-rows-1` holds for its row and for `collapsible.yaml`; no middot or em dash | `pnpm --filter @orivilo/design-system typecheck` and `pnpm --filter @orivilo/design-system test` output |
| 22 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Accordion `Default`, `OneAtATime`, `Multiple`, `Disabled`, `NotCollapsible`, `At360`, `RecipesAndModes` | Closed and open read as two states by the chevron's shape; the focus line and halo stay whole on a full-width trigger, clear of the divider and of the panel's first line; the hover ground is one rounded card at one, two and three lines; a panel reads as belonging to its row | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set`. The answers to open questions 2 and 3 stand at the top of "Open questions" |
| 23 | Storybook test project, neutral, light, Thai | Metric `Default` renders `metricFixtures.all` | A tile "การตัดสินใจทั้งหมด", the figure 5, and "รายการในโปรเจกต์นี้"; no change line | None | `Default` play: `getByRole("article")`; the heading by name; `.ds-card__value` text `5`; no `.ds-metric__change` |
| 24 | Same | Metric `Formats` renders `kind="percent"` with 0.8, and `kind="number"` with 1234567 and 0 | "80%", "1,234,567", "0" | None. `0` shows as digits (`metric-data-1`) | `Formats` play: three `.ds-card__value` texts |
| 25 | Same | Metric `Trends` renders W3 lines 1, 3, 4, 5 and 6 from `metricFixtures` | "เพิ่มขึ้น 5 จุดเปอร์เซ็นต์ จากสัปดาห์ก่อน" with "ดีขึ้น"; "ลดลง 3 จากสัปดาห์ก่อน" with "ดีขึ้น"; "ลดลง 20 จุดเปอร์เซ็นต์ จากสัปดาห์ก่อน" with "แย่ลง"; "เท่าเดิม จากสัปดาห์ก่อน" alone; "เพิ่มขึ้น 3 จากสัปดาห์ก่อน" alone. A tone word sits on a Badge beside the figure, not on the line | None. Direction and tone as W3 (`metric-change-1`, `metric-tone-1`) | `Trends` play: each line's text; each Badge's word and `data-variant`; each Badge's parent is `.ds-metric__figure`; no `.ds-metric__change` holds a `.ds-badge`; no Badge on the last two; each `.ds-metric__figure` is as tall as W9's slot to 0.5 px; the svg in each line differs by direction, taken from `src/components/icons.tsx`; the line's computed `color` equals resolved `--cmp-metric-change-fg` |
| 26 | Same | Metric `RiseIsBad` renders `metricFixtures.waiting`, W3 line 2 | "รอรีวิว", the figure 5 with a Badge "แย่ลง" beside it, then an up glyph and "เพิ่มขึ้น 2 จากสัปดาห์ก่อน" | None. Direction `up`, tone `worse` (`metric-tone-1`) | `RiseIsBad` play: the line's svg equals the up glyph; the Badge word and `data-variant="danger"`; the Badge's parent is `.ds-metric__figure`; the word "ดีขึ้น" absent |
| 27 | Same | Metric `Missing` renders `value={undefined}` with a `compare`, and a `value` of `NaN` | "ไม่มีข้อมูล" under each title; no figure, no change line, no Badge | None. `metric-data-1` | `Missing` play: the text found in `.ds-metric__missing`; each `.ds-metric__missing` is as tall as W9's slot to 0.5 px (`metric-look-1`); no `.ds-metric__figure`; no `.ds-card__value`; no `.ds-metric__change`; no `.ds-badge` |
| 28 | Same | Metric `Loading` renders one tile with `loading`, a `value` and a `compare`, and a second tile with `loading`, a `value` and no `compare` | In each tile the title, then still grey shapes where the figure and line will be; the second tile holds the figure's shape only | None. `aria-busy` on each group; one status per tile holding "กำลังโหลดเนื้อหา"; the figure is not in the DOM (`metric-data-1`) | `Loading` play: `getAllByRole("status")` length 2; `.ds-card__value` absent; the title present; `.ds-skeleton[data-shape="block"].ds-metric__skeleton-value` in both tiles, each as tall as W9's slot to 0.5 px; `.ds-skeleton[data-shape="text"].ds-metric__skeleton-change` in the first tile only |
| 29 | Same, English | Metric `InEnglish` renders the states of rows 23, 24, 25, 26, 27 and 28 | "Up 5 percentage points from last week" with "Better", "Down 3 from last week", "Down 20 percentage points from last week" with "Worse", "No change from last week", "Up 2 from last week" with "Worse", "No data" | None | `InEnglish` play: each string found; the loading status holding "Loading content" (`en.ts` key `skeleton.loading`) |
| 30 | A 360 px frame | Metric `At360` renders `fixtures.longThai` as `title` and as `note`, with `metricFixtures.reasoned` numbers | The name wraps inside the tile, the change line wraps with its glyph beside its first line, no horizontal scroll | None | `At360` play: frame `scrollWidth` not above 360; the title, the change line and every ancestor of each up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLinesClear` on the title and the note; `expectFrameCutsNoInk(title, frame)` and `expectFrameCutsNoInk(change, frame)` |
| 31 | Storybook test project | Metric `RecipesAndModes` renders W3 lines 1 and 2, a `Missing` tile and a tile with no `compare` through `Matrix` | The four tiles in the six boundaries | None. The pairs of `metric-look-1` pass at their floor | `RecipesAndModes` play: counts as W4; `recipes.test.ts` proves the contrast |
| 32 | Storybook test project | `Examples/Application: Decision log` `Default` and `Empty` render on the shared Metric | The same three tiles with "80%" as before; with no rows, "ไม่มีข้อมูล" in the share tile where "0%" stood | None. `metric-example-1` | `decision-log.stories.tsx`: `Default` play unchanged and green; `Empty` play asserts the words and no "0%"; `grep -n "function Metric" packages/design-system/src/examples/decision-log.tsx` prints nothing |
| 33 | The PR head | The unit test, `pnpm typecheck` and the catalog and i18n checks run | Not a screen | `change.test.ts` holds the eight lines of W3, each proven red by a changed line of `metricChange`; `@ts-expect-error` lines hold for a string `value`, a `change` prop and a `trend` prop (`metric-api-1`); `catalog/application/metric.yaml` (story `application-metric`, status `draft`, variants `[number, percent]`, states `[default, loading, missing, up, down, flat]`, recipes neutral, professional, friendly) resolves; `catalog-rows-1` holds for its row; the seven `metric.*` keys exist in Thai and English; the story docs say the figures are mock; no middot or em dash | `pnpm --filter @orivilo/design-system exec vitest run src/components/metric`; `pnpm --filter @orivilo/design-system typecheck`; `pnpm --filter @orivilo/design-system test`; `grep -n -i "mock" packages/design-system/src/components/metric/Metric.stories.tsx` |
| 34 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Metric `Trends`, `RiseIsBad`, `Missing`, `Loading`, `At360`, `RecipesAndModes` and the decision log | A bad rise reads as bad with the colour taken away; the Badge does not outshout the figure; tiles of one row keep one height, with no third row for the Badge; a missing figure reads as a gap, not as a fault | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set`. The answer to open question 10 stands at the top of "Open questions" |
| 35 | Storybook test project, neutral, light, Thai | Filter bar `Default` renders at rest with `DECISIONS` in a Table | A group "กรองการตัดสินใจ" with a search field, a status Select, an inert "ล้างตัวกรอง" and "พบ 5 รายการ"; no active Tags; five rows | None. `resultCount` 5; the Table shows the five rows | `Default` play: `getByRole("group", { name })`; the clear button has `aria-disabled="true"`, a click calls no spy; `getByRole("status")` text; no group named "ตัวกรองที่ใช้อยู่"; the search field and the Select are each as wide as resolved `--ds-size-panel-min` to 0.5 px, since the test iframe gives the bar its wide form (`filter-look-1`) |
| 36 | Same | Filter bar `ApplyOnChange`: the person picks "รอรีวิว" in the status Select, then clears it and types "Orbit" | With no further press: Tag "สถานะ: รอรีวิว", two rows and "พบ 2 รายการ"; then one row and "พบ 1 รายการ" | Story state follows each change, as W6. No Apply button exists (`filter-apply-1`). The status node is the same DOM node throughout (`filter-status-1`) | `ApplyOnChange` play: `body().findByRole("option")`; row counts with `waitFor`; node identity across the changes; `queryByRole("button", { name: /ใช้ตัวกรอง/ })` is null; while the Tag shows, `expectSameHeight(search, select, tag, clear)`, and the search field's height equals resolved `--ds-size-control-sm` to 0.5 px (`filter-api-1`) |
| 37 | Same | Filter bar `ClearAll` opens with two active filters; the person tabs to "ล้างตัวกรอง" and presses Enter | The Tags go, the five rows return, and the keyboard stays on the button | `onClearAll` spy called once; `active` false afterwards (`filter-clear-1`) | `ClearAll` play: spy count; `toHaveFocus()`; `aria-disabled="true"` after; a second Enter leaves the spy at 1 |
| 38 | Same | Filter bar `RemoveTag` opens with two Tags; the person presses "ลบ สถานะ: รอรีวิว", then the last Tag's remove | One Tag left and focus on it; then none and focus on "ล้างตัวกรอง" | The story host moves focus as `filter-clear-1` says | `RemoveTag` play: `document.activeElement` after each press |
| 39 | Same | Filter bar `NoResults` renders the filters of W6's last line | "ไม่พบรายการที่ตรงกับตัวกรอง" and the Table's empty state | None. `resultCount` 0 | `NoResults` play: status text; the Table's empty title found; "ล้างตัวกรอง" active |
| 40 | Same, English | Filter bar `InEnglish` renders the states of rows 35, 36, 37 and 39 | "Filter decisions", "Clear filters", "5 results", "2 results", "1 result", "No results match these filters", the Tag "Status: Waiting for review" | None | `InEnglish` play: each string found; the group named "Active filters" while a Tag shows |
| 41 | A 360 px frame | Filter bar `At360` renders two active filters, one Tag label `fixtures.longThai` | The search field and the Select each take a full row, then the Tags, then the count at the start and the clear button at the end, all inside the frame and on screen; the Tag cuts its long label with an ellipsis and keeps the whole text in `title`, as `tag.yaml` says; no horizontal scroll | None | `At360` play: frame `scrollWidth` not above 360; the search field, the Select, the Tags, the count and the clear button are each visible; the search field and the Select are each as wide as the bar to 0.5 px; the count's start edge is on the bar's start and the clear button's end edge on the bar's end, to 0.5 px; the frame sits in the 1200 px test iframe, so a viewport query fails these and only the bar's own width passes (`filter-look-1`); the status's computed `display` is not `none`; `expectSameHeight(search, select, tag, clear)`; the Tag's `title` equals the name; the count and every ancestor of it up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLabelInkWhole(count)`; `expectFrameCutsNoInk(count, frame)`. The Tag label is left out of the frame check because it clips by design |
| 42 | Storybook test project | Filter bar `RecipesAndModes` renders one active bar through `Matrix` | The bar in the six boundaries | None. The pairs of `filter-look-1` pass at their floor | `RecipesAndModes` play: counts as W4; `recipes.test.ts` proves the contrast |
| 43 | The PR head | `pnpm typecheck` and the catalog and i18n checks run | Not a screen | `@ts-expect-error` lines hold for a missing `label`, a missing `onClearAll`, an `onApply` prop and a `filters` prop (`filter-api-1`); `catalog/application/filter-bar.yaml` (story `application-filter-bar`, status `draft`, states `[at-rest, active, no-results]`, recipes neutral, professional, friendly) resolves; `catalog-rows-1` holds for its row; the five `filterBar.*` keys exist in Thai and English; the story docs say the rows are mock; no middot or em dash | `pnpm --filter @orivilo/design-system typecheck`; `pnpm --filter @orivilo/design-system test`; `grep -n -i "mock" packages/design-system/src/components/filter-bar/FilterBar.stories.tsx` |
| 44 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Filter bar `Default`, `ApplyOnChange`, `NoResults`, `At360`, `RecipesAndModes` | The bar reads as one tool over its list, on the canvas and on a card; the inert clear button does not read as an error | None | Designer visual sign-off, its PNG paths posted on the issue as a Jira comment, since a sign-off has an empty `write_set`. The answer to open question 14 stands at the top of "Open questions" |
| 45 | The PR head | The affected suites run | Not a screen | The plays and tests of the PR's component pass, with zero a11y addon violations on its stories | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/<folder>` for the PR's folder (`separator`, `accordion`, `metric` with `src/examples`, `filter-bar`), and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

Rows 1 to 8 are Separator, rows 9 to 22 Accordion, rows 23 to 34 Metric, rows 35 to 44 Filter bar, row 45 each PR.

## Rows that render nothing

- Rows: 7, 21, 33, 43, 45

Rows 7, 21 and 43 are type, catalog and copy checks, row 33 adds the unit test of `metricChange`, and row 45 is test runs.

## Rows per PR

Four PRs are planned in the order of open question 16: Separator with rows 1 to 8 and 45, then Accordion with rows 9 to 22 and 45, then Metric with rows 23 to 34 and 45, then Filter bar with rows 35 to 45. The main session adds each line, in the form `qa-scope-1` reads, with a changelog line when its PR opens (open question 17).

- PR 195: rows 1-8, 45

## Out of scope

- Any Studio screen, the Inspector and `apps/web`. Using Accordion for Inspector groups, and Metric and Filter bar for an overview screen, are follow-up cards.
- Moving DirectionStudio's `<details>` blocks onto Accordion.
- Moving the private separators onto `Separator` (open question 9).
- Changing Collapsible, including its `aria-controls` (open question 4).
- A labelled divider (`sep-scope-1`).
- Charts and any new dependency. A Recharts tile would be a new runtime dependency, an owner-facing cost that brings a `security` pass (`.claude/skills/ovl/SKILL.md`, "Main-session duties POC mode keeps").
- A filter query builder, an Apply flow, date filters (Date picker and Combobox are `none`), saved filters, and URL state.
- Moving the decision log's Tabs filter onto Filter bar.
- A currency or unit on Metric.
- A screen reader test. It stays the open evidence behind `acc-aria-1`, `acc-region-1` and `filter-status-1`.
- Any semantic token or profile change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

`design.md` answers questions 2, 3, 7, 8, 10 and 14. The main session takes its answers to questions 2 and 10, which differ in part from the defaults below, under the owner's delegation (AGENTS.md rule 5, ADR 0012 decision 4):

- Question 2: differs in part. Option (a) stays, a ghost `Button` md at full width, without its pill radius and with air around it (A1, A2). `acc-look-1` holds the radius, the padding and the row pitch; W8 derives the pitch.
- Question 10: confirmed in its model, differs in placement. Option (a) stays, and the Badge moves from the change line to the figure (A5, A6, A10). `metric-tone-1` holds the place, `metric-look-1` the classes.
- Question 3: confirmed, (a). The locked item gains a quiet chevron (A3, in `acc-look-1`).
- Questions 7, 8 and 14: confirmed, (a) each.

Questions 1, 4, 5, 6, 9, 11, 12, 13, 15, 16 and 17 stand on their defaults.

1. Accordion on our Collapsible, or on the Radix Accordion. `coverage.md` line 33 lists Collapsible `draft` while audit line 68 says `none`; the audit is the stale one (K-0369). Options: (a) the Radix Accordion directly, whose keys, grouping and `aria-disabled` arrive with it (K-0343, K-0344, K-0345); (b) wrap our Collapsible and write single or multiple state, arrow, Home and End keys and `aria-disabled` by hand, which adds behaviour outside the primitive against `.claude/rules/design-system.md` and ADR 0003 point 1, for a trigger we can match anyway (K-0120, K-0122). Neither adds a package: `radix-ui` 1.8.1 already holds the Accordion (W5). Default: (a), which is `acc-base-1`.
2. Trigger look. Options: (a) ghost `Button` md at full width, label at the start and chevron at the end, which keeps Button's hover, focus and pairs (`acc-look-1`); (b) Collapsible's own-width trigger (`collapsible.yaml`), which leaves the chevrons of a group ragged; (c) a new row recipe with its own hover and focus pairs, shadcn's form without its classes (K-0342), which adds tokens and pairs. Default: (a), with the worry that a pill hover at full width may read oddly in a dense panel (`DESIGN.md` section 3.3). The design render bore that out, and the top of this section gives the answer.
3. `collapsible` default on `type="single"`. Radix's default is false (K-0343), so the open item cannot close and carries `aria-disabled` (K-0345, K-0349). Options: (a) default true, a changed default from the primitive, recorded here against ADR 0003 point 1, because a person who opened a group expects to close it; (b) keep false, and every caller meets the locked item; (c) drop the prop, so the K-0349 state cannot arise, at the cost of a Radix prop. Default: (a), which is `acc-api-1`, with `aria-disabled` still proven in row 15.
4. `aria-controls` on a closed header. The APG bullet sets it to the panel's ID (K-0348); Radix sets it only while open (K-0122, K-0345), and our Collapsible follows that under the Disclosure pattern, where it is optional (K-0123). Options: (a) keep Radix's, and record the difference from the bullet in the catalog; (b) set it by hand in both states with an id we own, two props, since the installed source lets both through and keeps the closed element (`acc-aria-1`). ORV-203's open question 3 said this needs `forceMount`; on 1.2.1 it does not, because the closed element stays in the DOM. Default: (b), which is `acc-aria-1`, because the Accordion pattern asks for it and the cost is two props. The Radix wiring was read (K-0369) and then seen in the design render, with no play run, so if row 9 goes red the builder reports it and (a) is the fallback. Collapsible stays as it is.
5. `region` on every panel under `type="multiple"`. Radix sets it on each Content (K-0345); the APG makes it optional and says to avoid proliferation, for example more than approximately 6 panels open at once (K-0349); the APG example uses it on 3 panels (K-0350). Options: (a) by `type`, keeping it where one panel can be open and dropping it where the person decides, a rule with no count to track; (b) keep it always, which allows the proliferation K-0349 names; (c) count items and drop it above a limit, which needs a threshold the APG calls approximate and a count the component cannot read from wrapped children. Default: (a), which is `acc-region-1`. Its cost: K-0349 says `region` helps most when panels hold headings, and a `multiple` group gives that up.
6. Radix's arrow, Home and End keys beyond the APG's list (K-0344, K-0347, K-0350). Options: (a) keep them, as the page does not forbid them (K-0369); (b) strip them, which means fighting the primitive. Default: (a), which is `acc-keys-1`.
7. A bare line and a labelled divider: one component or two. The audit (line 66) maps Separator to Content dividers, but that component carries children and states it is not a separator (K-0352, K-0353), and a child inside `role="separator"` is not exposed by our reading (K-0358). Options: (a) `Separator` is the bare line, and a labelled divider waits for a story, as its own component; (b) one component that becomes a `div` with a heading when it has children, so one name has two roles; (c) both now, which no row of D.3 asks for. Default: (a), which is `sep-scope-1` (AGENTS.md rule 6). A native `hr` is the related concept (K-0354, K-0357), and K-0369 raises it as an option; the default keeps Radix's element, which renders a `div` (`dist/index.mjs`), because ADR 0003 point 1 keeps the primitive and W2 holds for it.
8. The default of `decorative`. shadcn defaults to true and Radix has no default, which means `role="separator"` (K-0355, K-0356). Options: (a) default true: most lines only divide, as the repo's private lines do (K-0369), and a silent line costs less than a noisy one; (b) default false, Radix's behaviour, which speaks each line; (c) required, so each caller chooses, which K-0369's "chosen on purpose" allows and which makes a tiny component noisy. Default: (a), which is `sep-api-1`, with the catalog entry saying when to pass `false`: a real break between sections of content (K-0357).
9. Whether the private forms move onto Separator now. The menu forms already are Radix separators and their spacing lives in `recipes.test.ts` line 150; `.ds-controls__divider` has its own token (K-0369). `.claude/rules/design-system.md` asks for a check of each story that uses a shared component. Options: (a) leave them, and raise a follow-up card; (b) move them here, which adds four stories' worth of risk to a tiny PR. Default: (a). Its cost: Separator ships with no caller.
10. What a Metric trend shows when a rise is bad news. Untitled swaps success and error colours on a direction prop and does not say what a bad rise shows (K-0360). Options: (a) separate the two: the direction comes from the numbers and the caller's `betterWhen` gives the meaning, shown as a word on a Badge; (b) one `trend` prop as Untitled has, so a rise in failures shows as green unless each caller inverts it (K-0360); (c) direction only, never a tone, which is the safest and leaves the person to judge each figure. Default: (a), which is `metric-change-1` and `metric-tone-1`, with no tone unless the caller sets one, so no success state appears without data behind it (AGENTS.md).
11. Size of the change. Untitled's `change` is a ready string such as `"100%"` (K-0360). Options: (a) the absolute difference in the figure's own unit, in percentage points for a percent: no division, so a `previous` of 0 needs no special case; (b) a relative percentage, which needs a rule for a `previous` of 0 and says "Up 5%" for 75% to 80%, which is false; (c) a caller's string, which breaks `metric-data-1`. Default: (a), which is `metric-change-1`.
12. The decision log's share with no rows. It shows `0%` today and the `Empty` play asserts it (`decision-log.stories.tsx` line 71). A share of nothing has no backing data (K-0362, AGENTS.md). Options: (a) `metric.missing`, with the play changed; (b) keep `0%` by passing 0, which leaves a figure the data does not support; (c) leave the example on its local tile, so no caller proves Metric. Default: (a), which is `metric-example-1`.
13. Whether filters apply on a press or on each change. Untitled applies on a press in its advanced popover (K-0366) and its bars hold no state (K-0365); no page settles it (K-0369). Options: (a) on change, with no draft state, as the decision log's Tabs filter; every control here is local and cheap; (b) on a press, which fits a query builder and adds a draft state, a dirty state and an Apply word; (c) a per-bar choice, which doubles the states with no story asking. Default: (a), which is `filter-apply-1`. Revisit when a filter calls the server, where each keystroke would cost a request: that story adds a debounce or an Apply.
14. The clear button at rest. K-0366 has `onClearAll`, with no word on its look at rest. Options: (a) mounted and inert through `aria-disabled`, so nothing shifts and focus is never lost; (b) rendered only while filters are on, which drops focus on a press and shifts the row. Default: (a), which is `filter-clear-1`.
15. The `coverage.md` rows for Accordion and Separator, which do not exist, while audit D.3 row 27 asks for an entry each (K-0369). Options: (a) add them in each component's PR, with `Filters` renamed `Filter bar`, as `coverage.md` line 3 says; (b) add `none` rows first in a docs PR, a PR for two lines; (c) keep the name `Filters`, which then differs from the story title. Default: (a), which is `catalog-rows-1`. Audit lines 66 to 68 and 103 stay as a dated record (audit line 3: "Research only").
16. How the work splits. The four together run far over the 400-line guide. Options: (a) one PR per component, in the order Separator, Accordion, Metric, Filter bar: smallest first, Accordion before the two application components, Filter bar last since it composes the most existing parts, and in sequence because each touches `index.ts`, `component.json`, `recipes.css` and `coverage.md`; (b) one PR with the review sized to it (ORV-146), which puts four public APIs into one review; (c) parallel PRs, which collide on those shared files. Estimates, not counts: Separator about 200 changed lines, Accordion about 500, Metric about 450, Filter bar about 400. Accordion and Metric may pass the guide; neither splits further, because a component's entry, story and code land in one PR (`.claude/rules/design-system.md`). Default: (a), with the rows as "Rows per PR" says.
17. The Rows per PR lines. Default: the main session adds a `- PR <n>: rows ...` line in the form `qa-scope-1` reads when each PR opens, with a changelog line.

## Depends on

- `docs/specs/ORV-230/design.md` (the look, the answers to open questions 2, 3, 7, 8, 10 and 14, amendments A1 to A12, and CSS and markup per rule).
- ORV-204 (`menu.option.radius`, the form `acc-look-1` follows).
- `docs/knowledge/design/K-0340` to `K-0369` (benchmark and standards, 2026-11-06); K-0120 to K-0123 (Collapsible and Disclosure, 2026-11-01); K-0115 (SC 4.1.3).
- `docs/specs/ORV-64/audit.md` section B (table form), lines 66 to 68, 102, 103, and section D.3 row 27 (the story and its done-when).
- `docs/specs/ORV-203/spec.md` (`col-motion-1`, `col-aria-1`, the trigger form) and `docs/specs/ORV-222/spec.md` (the form of this spec, `expectFrameCutsNoInk`).
- `DESIGN.md` section 3.1 and 3.3 (tokens), 4 (type), 6 (icons), 7 (states), 8 (colour roles), 9 (anti-patterns 3 and 11), 10 (copy), 11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off) and `.claude/rules/testing.md`.
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- ORV-146 (review by size, one review round).
- ADR 0003 (behaviour from primitives, recipes, Storybook and catalog), ADR 0012 (gates).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`, W5 after `pnpm install`.

W1. The state map of `acc-aria-1` and `acc-region-1`. Input: `@radix-ui/react-collapsible` 1.2.1 `dist/index.mjs` lines 66, 67, 71, 128 to 130; `@radix-ui/react-accordion` 1.3.1 `dist/index.mjs` lines 288, 309, 310, 313. `p1` stands for the item's `useId()` value and `t1` for Radix's trigger id. Expected output, four lines, no rounding: `single collapsible closed aria-expanded=false aria-controls=p1 aria-disabled=absent hidden=true role=region labelledby=t1`, `single collapsible open aria-expanded=true aria-controls=p1 aria-disabled=absent hidden=false role=region labelledby=t1`, `single locked open aria-expanded=true aria-controls=p1 aria-disabled=true hidden=false role=region labelledby=t1`, `multiple collapsible open aria-expanded=true aria-controls=p1 aria-disabled=absent hidden=false role=absent labelledby=absent`.

```bash
node -e 'const m=(type,collapsible,open)=>{const region=type==="single";return [type,collapsible?"collapsible":"locked",open?"open":"closed","aria-expanded="+open,"aria-controls=p1","aria-disabled="+(open&&!collapsible?"true":"absent"),"hidden="+!open,"role="+(region?"region":"absent"),"labelledby="+(region?"t1":"absent")].join(" ")};console.log(m("single",true,false));console.log(m("single",true,true));console.log(m("single",false,true));console.log(m("multiple",true,true))'
```

W2. The map of `sep-role-1`. Input: `@radix-ui/react-separator` 1.2.0 `dist/index.mjs` lines 17 to 20, with `decorative` true by `sep-api-1`. Expected output, four lines: `horizontal decorative role=none aria-orientation=absent`, `vertical decorative role=none aria-orientation=absent`, `horizontal semantic role=separator aria-orientation=absent`, `vertical semantic role=separator aria-orientation=vertical`.

```bash
node -e 'for(const decorative of [true,false])for(const orientation of ["horizontal","vertical"]){const aria=orientation==="vertical"?orientation:"absent";console.log(orientation,decorative?"decorative":"semantic",decorative?"role=none aria-orientation=absent":"role=separator aria-orientation="+aria)}'
```

W3. The method of `metric-change-1` and `metric-tone-1`. Input: line 1's value is the decision log's share, 4 of 5 rows with a reason (`src/examples/decision-log.tsx` lines 56 to 97 and 200 to 202; its story asserts `80%`, `decision-log.stories.tsx` line 32). The other figures and each `previous` are mock, the numbers of `metricFixtures`, which this spec sets here. Rounding: `percent` to a whole number of points, `number` to three decimals. Lines 7 and 8 are the rounding cases, for the unit test only. Each line prints kind, value, previous, `betterWhen`, direction, rounded size, tone. Expected output, eight lines: `percent 0.8 0.75 up up 5 better`, `number 5 3 down up 2 worse`, `number 1 4 down down 3 better`, `percent 0.6 0.8 up down 20 worse`, `number 5 5 up flat 0 none`, `number 12 9 unset up 3 none`, `percent 0.804 0.8 up flat 0 none`, `number 0.3 0.30000000000000004 up flat 0 none`.

```bash
node -e 'const run=(kind,value,prev,better)=>{const d=value-prev,a=Math.abs(d),r=kind==="percent"?Math.round(a*100):Math.round(a*1000)/1000,dir=r===0?"flat":d>0?"up":"down",tone=dir==="flat"||!better?"none":dir===better?"better":"worse";console.log(kind,value,prev,better||"unset",dir,r,tone)};run("percent",4/5,0.75,"up");run("number",5,3,"down");run("number",1,4,"down");run("percent",0.6,0.8,"up");run("number",5,5,"up");run("number",12,9);run("percent",0.804,0.8,"up");run("number",0.3,0.1+0.2,"up")'
```

W4. The counts of AC 6, 20, 31 and 42. Input: `PROFILE_IDS` neutral, professional, friendly (`src/profiles/index.ts` line 41), modes light and dark (`matrix.tsx` line 10); per cell, two Separators, one group of three triggers with one open, four Metric tiles, one Filter bar. Expected output, integers, no rounding: `cells 6 separators 12 triggers 18 open 6 metrics 24 bars 6`.

```bash
node -e 'const p=["neutral","professional","friendly"],m=["light","dark"],c=p.length*m.length;console.log("cells",c,"separators",c*2,"triggers",c*3,"open",c,"metrics",c*4,"bars",c)'
```

W5. No package is added (`acc-base-1`, `sep-api-1`, `metric-change-1`). Input: the pinned `radix-ui` 1.8.1 and `lucide-react` 1.52.0 (`packages/design-system/package.json` lines 28 and 29). Expected output: `TrendingUp true TrendingDown true Accordion true Separator true`.

```bash
node -e 'const l=require("./packages/design-system/node_modules/lucide-react"),r=require("./packages/design-system/node_modules/radix-ui");console.log("TrendingUp",Boolean(l.TrendingUp),"TrendingDown",Boolean(l.TrendingDown),"Accordion",Boolean(r.Accordion&&r.Accordion.Root),"Separator",Boolean(r.Separator&&r.Separator.Root))'
```

W6. The count and key of `filter-status-1`, and the rows of AC 35, 36 and 39. Input: the status and title of the five `DECISIONS` rows (`src/examples/decision-log.tsx` lines 56 to 97), with `fixtures.longThai` and `fixtures.longLatin` written as their constants from `fixtures.ts` lines 18 and 19. Expected output, five lines: `all 5 results`, `review 2 results`, `approved 3 results`, `search Orbit 1 resultsOne`, `review and search Orbit 0 resultsNone`.

```bash
node -e 'const r=[["ใช้ Orbit violet เป็นสีของการกระทำหลัก","approved"],["บริษัทพัฒนาซอฟต์แวร์เพื่อการออกแบบอัตลักษณ์แบรนด์และผลิตภัณฑ์ดิจิทัลจำกัดมหาชน","review"],["Anuphan คู่กับ IBM Plex Sans บนบรรทัดเดียวกัน","approved"],["Anuphan-and-Plex-mixed-identifier-that-never-breaks-on-its-own-2026","review"],["รัศมี 12, 16 และ 24 สำหรับ control, container และ overlay","approved"]],key=n=>n===0?"resultsNone":n===1?"resultsOne":"results",show=(name,rows)=>console.log(name,rows.length,key(rows.length)),review=x=>x[1]==="review",orbit=x=>x[0].includes("Orbit");show("all",r);show("review",r.filter(review));show("approved",r.filter(x=>x[1]==="approved"));show("search Orbit",r.filter(orbit));show("review and search Orbit",r.filter(x=>review(x)&&orbit(x)))'
```

W7. The one-line trigger height of `acc-look-1` and AC 19. Input: `button.height.md` is 40 px (W3 of `docs/specs/ORV-203/spec.md`), `.ds-button` has a 1 px border on each side (`recipes.css` line 23), and `type.label.md` is 14 / 1.7 (`DESIGN.md` section 4). Rounding: one decimal. Expected output: `lh 23.8 padding 7.1 total 40.0`.

```bash
node -e 'const h=40,border=2,lh=14*1.7,pad=(h-border-lh)/2;console.log("lh",lh.toFixed(1),"padding",pad.toFixed(1),"total",(lh+2*pad+border).toFixed(1))'
```

W8. The row pitch and the halo margin of `acc-look-1` and AC 19. Input: the 40 px one-line trigger of W7; `--ds-space-inline-sm` is 4 px (`src/tokens/generated.css` lines 115 and 273); the divider is 1 px (`acc-look-1`); the focus halo is 3 px (`DESIGN.md` section 3.1, `focus.ring`). Integers, no rounding. Expected output: `pitch 48 with divider 49 gap 4 margin 1`, where the gap runs from the trigger's bottom to the divider and the margin is what the halo leaves of it.

```bash
node -e 'const trigger=40,pad=4,divider=1,halo=3;console.log("pitch",trigger+2*pad,"with divider",trigger+2*pad+divider,"gap",pad,"margin",pad-halo)'
```

W9. The figure slot of `metric-look-1` and AC 25, 27 and 28. Input: `type.numeral.md` is 32 px at line height 1 (`src/tokens/generated.css` lines 157, 160, 370, 371), which no profile overrides; `type.body.md`, which `metric.missing-type` takes, is 16 px at line height 1.7 (lines 153, 166, 325, 326). Rounding: one decimal. Expected output: `slot 32.0 missing 27.2 short 4.8`, where short is how far a missing tile would fall short with no slot.

```bash
node -e 'const slot=32*1,missing=16*1.7;console.log("slot",slot.toFixed(1),"missing",missing.toFixed(1),"short",(slot-missing).toFixed(1))'
```

## Changelog

- v1.0 (2026-11-06): first version, from K-0340 to K-0369 and audit D.3 row 27. Downstream to review: the designer envelope (design.md, open questions 2, 3, 7, 8, 10 and 14, and any change to the rules they hold), the builder envelopes (one per PR, per open question 16), the qa envelopes (the Rows per PR lines once the PRs exist), `catalog/coverage.md`, `catalog/base/collapsible.yaml` and the decision log example with its stories.
- v1.1 (2026-11-06): takes in the amendments of `design.md`: A1, A2 and A3 in `acc-look-1`, A4 in `sep-look-1`, A5 in `metric-tone-1`, A6 in `metric-look-1`, A7 in `metric-data-1`, A8 in `filter-look-1`, A9 in `filter-api-1`, A10 in "Contract changes and impact", A11 in AC row 15, A12 in AC row 19. Front matter points at `design.md`; "Open questions" opens with its answers, and the main session takes questions 2 and 10 under the owner's delegation; W8 and W9 are new. AC rows 1, 2, 8, 10, 14, 19, 22, 25, 26, 27, 28, 34, 35, 36 and 41 gain the proof of an amendment that rests on the built component, and rows 8, 22, 34 and 44 now point at the answers, with row numbers, "Rows that render nothing" and "Rows per PR" unchanged. Downstream to review: the builder envelopes (one per PR), the qa envelopes, the designer sign-offs of rows 8, 22, 34 and 44, and the `spec:` line of `design.md`, which names v1.0.
- v1.2 (2026-11-06): by the main session. "Rows per PR" gains the line for PR 195.
