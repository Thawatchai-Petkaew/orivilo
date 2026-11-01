---
issue: ORV-203 (https://tpetkaew.atlassian.net/browse/ORV-203)
lane: as set on ORV-203 in Jira (not read in this role); a new component public API is an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.1 row 2 ("Collapsible (base)")
version: 1.2
---

# ORV-203: Collapsible (base)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). Every cell is from K-0119 to K-0126 (read 2026-11-01); the Ours row is the code on this branch at `e619487`, as K-0126 records it. The Add and Do not copy rows are this spec's choices; each points to the rule in "Rules" that holds it.

### Collapsible

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | None found: <https://www.untitledui.com/react/components> lists no Collapsible, Disclosure or Accordion, and the open-source repo's `components/base` (17 folders) and `components/application` (12 folders) hold none. Nearest pages: <https://www.untitledui.com/react/marketing/faq-sections> (examples "Accordion 01" to "04" and brand versions, React Aria, no open or close behaviour described, code not read) and <https://www.untitledui.com/react/components/tree-views> (`defaultExpandedKeys`, `expandedKeys`, `onExpandedChange`). No variants, sizes, states or slots to read (K-0119). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/collapsible>. Parts `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`; `open` and `onOpenChange` for control. The Radix registry file adds `data-slot` only: no class, no size, no variant, no animation, no ARIA of its own. The API is deferred to Base UI, React Aria or Radix UI. Examples: Basic (card with a chevron), Settings Panel, File Tree (nested), RTL, Controlled State (K-0120). |
| Radix (primitive) | Root `asChild`, `defaultOpen`, `open`, `onOpenChange`, `disabled`; Trigger `asChild`; Content `asChild`, `forceMount`. `data-state` `open` or `closed` and `data-disabled` on every part; Content exposes `--radix-collapsible-content-height` and `-width`. Trigger is `type="button"` with `aria-expanded`, `disabled`, and `aria-controls` only while open; Content is unmounted when closed unless `forceMount`, and skips its animation on first render when it starts open. Space and Enter toggle. Docs example: height keyframes at 300ms ease-out, no reduced-motion rule (K-0121, K-0122). |
| Standards | APG Disclosure: role button, `aria-expanded` true or false, `aria-controls` optional, Enter and Space toggle, nothing on animation (K-0123). WCAG 2.3.3 (AAA): motion animation from an interaction can be disabled unless essential; opacity, colour and blur changes are not motion; C39 under `prefers-reduced-motion` (K-0124). WCAG 2.2.2 (A): motion that starts automatically; a button press is not automatic, hover and focus are (K-0125). |
| Ours | No Collapsible or Accordion component, story or catalog entry. Three hand-built disclosures: TaskBar (a ghost sm `Button` with `aria-expanded`, `aria-controls` always set, a trailing chevron and a label that swap with the state, a panel `hidden={!open}` that fades in on opacity at `--ds-motion-feedback-duration`, `animation: none` under reduced motion; `TaskBar.tsx` lines 206 to 222, `recipes.css` lines 4070 and 4209); Resizable (an icon-only reopen `Button` with `aria-expanded={false}`); DirectionStudio (four native `<details>` blocks). `orivilo.css` line 80 zeroes the three motion durations under reduced motion (K-0126). |
| Add | Root `open`, `defaultOpen`, `onOpenChange`, `disabled` from Radix (K-0121): `col-api-1`. Trigger wiring from the primitive, not by hand (K-0122, K-0123): `col-aria-1`. A trigger that is our `Button` with an indicator that changes shape with the state, as TaskBar does (K-0126): `col-trigger-1`. A stated motion stance with an explicit reduced-motion rule, since neither publisher has one (K-0121, K-0124, K-0125): `col-motion-1`. |
| Do not copy | shadcn's bare parts with no recipe (K-0120): our components consume a recipe class and take no colour or radius classes (`.claude/rules/design-system.md`, "Tokens and layers"). Radix's 300ms ease-out example (K-0121): a raw value, where our motion reads `--ds-motion-*` tokens. Opening on hover or focus: by our reading that motion starts automatically under 2.2.2 and potentially fails 2.3.3 (K-0125). `forceMount` in this story: no current caller needs closed content in the DOM (K-0121, K-0122); see Out of scope. Untitled's FAQ accordion as a model: a marketing section whose behaviour the page does not describe (K-0119). |

## Goal

ORIVILO hides detail behind a control in several places: the task bar's job list, the canvas chat's reasoning to come (audit D.1 rows 3 to 7), and the Direction Studio's blocks. Today each one wires its own button, its own `aria-expanded` and its own fade. This story gives the design system one Collapsible on the Radix primitive, so every show and hide toggles by mouse, Enter and Space alike, tells a screen reader user whether it is open, and behaves the same when the person has asked for less motion (audit D.1 row 2: "Keyboard and screen reader story passes; open and closed states in both modes").

Nothing here is simulated: the component renders real markup on the primitive. The stories use fixture text from `src/components/fixtures.ts`, labelled as fixtures; no mock data is shown as real.

## Story

As a person using ORIVILO, when a section has more detail than I need right now, I press one button to show it and the same button to hide it, by mouse or keyboard, and I can always tell from the button whether the detail is showing.

## Rules

### col-api-1

Three new public parts in `src/components/collapsible/Collapsible.tsx`, exported from `@orivilo/design-system`:

- `Collapsible` (contract type `CollapsibleProps`): `open`, `defaultOpen` (default false), `onOpenChange(open: boolean)`, `disabled`, `className` for layout only, `children`. These pass to Radix `Collapsible.Root` unchanged (K-0121). No `asChild`, no size, no variant.
- `CollapsibleTrigger` (contract type `CollapsibleTriggerProps`): `children` (the label), `className` for layout only. Look per `col-trigger-1`.
- `CollapsibleContent` (contract type `CollapsibleContentProps`): `children`, `className` for layout only. Content is mounted only while open (Radix default, no `forceMount`), so state inside it is lost when it closes; the catalog entry says so.

Behaviour comes from `Collapsible` in the `radix-ui` package (`package.json` pins `1.8.1`); the builder confirms that version exports it before writing code, and reports a missing export as `blocked`.

### col-aria-1

The trigger's ARIA is Radix's, never set by hand (K-0122): a `type="button"` element with `aria-expanded="true"` while open and `"false"` while closed, `aria-controls` equal to the content's `id` while open and absent while closed, `disabled` and `data-disabled` when the root is disabled, and `data-state` `open` or `closed` on root, trigger and content. While closed the content element stays in the DOM, empty: it keeps its `id` and `data-state="closed"`, carries `hidden`, and renders none of its children, so the caller's content text is not in the DOM (the installed `@radix-ui/react-collapsible` 1.2.1, through `radix-ui`, passes `Presence` a function child and renders `hidden={!isOpen}` and `isOpen && children`). Enter and Space toggle it (K-0121, K-0123). The trigger opens on activation only: no hover, focus or pointer-enter handler (K-0125). Worked example W1 maps the state to the attributes.

### col-trigger-1

`CollapsibleTrigger` renders Radix `Collapsible.Trigger asChild` over our `Button` with `variant="ghost"` and `size="md"`, carrying the class `ds-collapsible__trigger`. Its trailing icon is `ExpandIcon` (chevron down) while closed and `CollapseIcon` (chevron up) while open (`src/components/icons.tsx` lines 110 and 111), swapped with no transition, so the state shows by shape and not by colour alone (DESIGN.md §7). The label is the caller's `children` and stays the same in both states; the state is carried by `aria-expanded` and the icon (K-0123). Hover, focus-visible, pressed and disabled are Button's own, with no override (DESIGN.md §7). Open question 2 closed as (a) (`design.md`, "Answers to the open questions" row 2).

### col-motion-1

On open, `ds-collapsible__content` fades in on opacity with the existing `ds-fade-in` keyframes (`recipes.css` line 1092) at `--ds-motion-feedback-duration` and `--ds-motion-easing`. Close has no animation: the content unmounts at once. No rule on the content animates or transitions `height`, `width`, `transform` or any inset. A first render that starts open does not animate (Radix's mount rule, K-0122). Under `prefers-reduced-motion: reduce` a recipe rule sets `animation: none` on `.ds-collapsible__content`, beside the token file's 0ms duration (`orivilo.css` line 82); worked example W2 gives both durations. Reason: an opacity fade is not motion animation by the 2.3.3 definition (K-0124), it follows a direct press so 2.2.2 does not apply (K-0125), and it is the fade TaskBar already ships (K-0126). Both rules sit on the bare `.ds-collapsible__content` selector, never `[data-state="open"]`, so the reduce rule, later in the file at the same specificity, wins (`design.md` D9, D10). Open question 1 closed as (a) (`design.md`, "Answers to the open questions" row 1).

### col-copy-1

The component owns no copy: no locale key is added. Every visible string is the caller's (the trigger label, the content). Stories take their text from a new `collapsibleFixtures` object in `src/components/fixtures.ts` (see "Copy").

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` and their `*Props` types (`col-api-1`) | Component API | New exports in `src/components/index.ts` (`src/index.ts` re-exports it, unchanged); new catalog entry `catalog/base/collapsible.yaml` (story `base-collapsible`, status `draft`, recipes neutral, professional, friendly); a new Collapsible row in `catalog/coverage.md` (it has none today) |
| Recipe classes `ds-collapsible`, `ds-collapsible__trigger`, `ds-collapsible__content` | Recipe | `recipes.css`: the root is a column with `--ds-space-stack-sm` between trigger and content; the trigger keeps its own width (`align-self: flex-start`, `max-inline-size: 100%`); the trigger label wraps (`white-space: normal`, `text-align: start`, `padding-block` from `--cmp-button-height-md` so one line stays the md height, `design.md` D3); the chevron stays on the first line (`align-items: flex-start` and a `margin-block-start` on `.ds-collapsible__trigger .ds-button__icon` from `--cmp-button-icon-size-md`, D4); the content is inset to the label's start edge (`padding-inline` from `--cmp-button-padding-x-md`, D6), set in `type.body.sm` from the `--ds-type-body-sm-*` properties with no colour (D7), and breaks a long word only when it cannot fit (`min-inline-size: 0`, `overflow-wrap: break-word`, D8); the content rules of `col-motion-1` and its reduced-motion rule. `recipes.test.ts` checks every value is a `--cmp-*` or `--ds-*` property (it already accepts `calc()`, `1lh` and `2px`, `design.md` amendment 1). No new token in any layer and no new colour pair: the trigger's pairs are Button ghost's, the content sets no colour, so `pairs.ts` is unchanged |
| `collapsibleFixtures` | Fixture | `src/components/fixtures.ts` only; no component reads it |

Not changed: no token in any layer, no locale key, no profile, `Button` API and recipe, TaskBar, Resizable, DirectionStudio, `apps/web` (Out of scope).

### Copy

Fixture copy for the stories (`col-copy-1`), not catalog keys.

<!-- prettier-ignore -->
| Fixture key | Thai | English |
| ----------- | ---- | ------- |
| `collapsibleFixtures.trigger` | รายละเอียดโปรเจกต์ | Project details |
| `collapsibleFixtures.content` | โปรเจกต์ Brand Canvas ของทีม (`fixtures.mixed`) | The team's Brand Canvas project |

The 360 px story uses `fixtures.longThai` as the first Collapsible's content and as the second Collapsible's trigger label (AC 11).

## Acceptance criteria

Story file: `Base/Collapsible` (id `base-collapsible`), a new `Collapsible.stories.tsx` beside the component. Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); `InEnglish` nests `LocaleProvider locale="en"` and the English fixtures.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | `Default` renders (closed) | A ghost button "รายละเอียดโปรเจกต์" with a chevron down; no content below | None. The button has `aria-expanded="false"`, no `aria-controls`, `data-state="closed"`; the content element's closed state per `col-aria-1` (W1 closed row) | `Default` play: `getByRole("button", { name: "รายละเอียดโปรเจกต์" })` attributes; `queryByText("โปรเจกต์ Brand Canvas ของทีม")` is null; no `.ds-collapsible__content:not([hidden])` in the canvas |
| 2 | Same | `Keyboard` play: Tab to the trigger, press Enter | The content "โปรเจกต์ Brand Canvas ของทีม" below the button, the chevron now up, the focus line and halo on the button | None. `aria-expanded="true"`; `aria-controls` equals the content's `id`; `data-state="open"` on root, trigger, content (`col-aria-1`, W1 open row) | `Keyboard` play: `userEvent.tab()`, `toHaveFocus()`, `userEvent.keyboard("{Enter}")`, attribute and `id` asserts |
| 3 | Same, open after row 2 | Press Space | The content gone, chevron down, focus still on the button | None. `aria-expanded="false"`, `aria-controls` absent, the content element's closed state per `col-aria-1` (W1 closed row) | Same play: `userEvent.keyboard(" ")`, asserts, no `.ds-collapsible__content:not([hidden])` in the canvas, `toHaveFocus()` |
| 4 | Same | `Controlled` renders with `open` held in story state and an `onOpenChange` spy (`fn()`), and the trigger is clicked twice | Opens, then closes | `onOpenChange` called with `true`, then `false`, two calls | `Controlled` play: `expect(args.onOpenChange).toHaveBeenNthCalledWith(1, true)` and `(2, false)` |
| 5 | Same | `Open` renders (`defaultOpen`) | Button with chevron up and the content shown at once, no fade | None. `aria-expanded="true"`; the content's computed `animationName` is `none` on first render (`col-motion-1`, Radix mount rule K-0122) | `Open` play |
| 6 | Same | `Default` trigger is clicked to open | The content fades in, nothing grows or slides | None. Content computed `animationName` is `ds-fade-in` and `animationDuration` is `0.12s` (W2); a loaded sheet holds a rule whose selector is exactly `.ds-collapsible__content` with `animation` naming `ds-fade-in`; no rule matching `.ds-collapsible__content` in any loaded sheet sets `height`, `width`, `transform` or an inset in an `animation`, `transition` or keyframes (`col-motion-1`) | `Default` play step: `getComputedStyle` and a stylesheet walk in the form of the Task bar play (`TaskBar.stories.tsx` line 139) |
| 7 | Same, any motion setting | `ReducedMotion` renders | Same story as row 6 | None. A `prefers-reduced-motion: reduce` media rule in a loaded sheet holds a rule whose selector is exactly `.ds-collapsible__content` (the same bare selector as row 6, not `[data-state="open"]`) and sets `animation: none` (`col-motion-1`) | `ReducedMotion` play: stylesheet walk finds the rule by exact `selectorText` |
| 8 | Same | `Disabled` renders (`disabled`) and the trigger is clicked | The button in Button's disabled look; nothing opens | None. Trigger has `disabled`, `data-disabled` on root and trigger, `aria-expanded="false"` after the click (`col-aria-1`) | `Disabled` play |
| 9 | Same | The `Default` trigger is hovered, then focused, with no press | Button's hover and focus looks only; the content stays closed | None. `aria-expanded` stays `"false"` after `userEvent.hover` and after `focus()` (`col-aria-1`) | `Default` play step |
| 10 | Same, English | `InEnglish` renders closed, then the trigger is clicked | "Project details", then "The team's Brand Canvas project" below it | None. Button name "Project details", `aria-expanded="true"` after the click | `InEnglish` play |
| 11 | Storybook, a 360 px frame | `At360` renders two Collapsibles: one open with `fixtures.longThai` as content and the Thai trigger, and a second whose trigger label is `fixtures.longThai` | The long Thai name wraps inside the frame, in the first one's content and in the second one's trigger label, with the chevron beside the label's first line; no horizontal scroll; no clipped Thai marks on either label or the content | None | `At360` play: frame `scrollWidth` not above 360; `expectNoGlyphClip` on both trigger labels and the content (`src/testing/visual-asserts.ts`); on the second trigger, `scrollWidth` not above its `clientWidth` and its rendered height above 40 px, the one-line md height (W3), so the label wrapped (`design.md` D3, amendment 2) |
| 12 | Storybook test project | `RecipesAndModes` renders through `Matrix` | In each of six boundaries (neutral, professional, friendly, each light and dark) one closed and one open Collapsible | None. 12 triggers: six with `aria-expanded="false"`, six with `"true"`; six contents | `RecipesAndModes` play counts; contrast is Button ghost's existing pairs, proven by `recipes.test.ts` and `pnpm contrast` with no new pair |
| 13 | Storybook test project | The a11y addon runs on every Collapsible story | Not a screen | Zero violations (DESIGN.md §11) | Vitest Storybook project output |
| 14 | The PR head | `check-catalog` and the copy checks run | Not a screen | `catalog/base/collapsible.yaml` (story `base-collapsible`, status `draft`, recipes neutral, professional, friendly) resolves; no new locale key (`col-copy-1`); no middot or em dash in the new files | `pnpm --filter @orivilo/design-system test` output (check-catalog, `i18n.test.ts`, `check-i18n`) |
| 15 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Open`, `Disabled`, `At360`, `RecipesAndModes` | Closed and open read as two states by the icon shape; focus line and halo visible on the trigger; content sits under its trigger | None | Designer visual sign-off with screenshots in design.md, including the answers to open questions 1 and 2 |
| 16 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/collapsible src/components/button` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows per PR

One PR is planned for rows 1 to 16: the component, recipe, stories, fixtures and catalog entry are estimated at about 350 changed lines, under the 400-line guide. The main session adds the PR line, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line once the PR exists.

- PR 176: rows 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16

## Out of scope

- Moving TaskBar, Resizable's reopen control or DirectionStudio's `<details>` blocks onto Collapsible. Follow-up card; TaskBar's bottom-docked chevron and its always-set `aria-controls` would change, and TaskBar would need `forceMount` or a different focus path (K-0126, open points).
- `forceMount` and kept content state while closed.
- An Accordion (a group with one open at a time) and nested trees.
- A height or slide animation (open question 1, option b, would bring it back with an impact list).
- Any token, locale key, profile or `apps/web` change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

All three are closed as option (a) by the designer in `docs/specs/ORV-203/design.md`, section "Answers to the open questions" (rows 1 to 3), under the G1 and G2 pass by delegation (ORV-203 comment 10475). The options stay below as the record.

1. Open motion. Options: (a) opacity fade on open at `motion.feedback.duration`, none on close, `animation: none` under reduced motion: not motion animation under 2.3.3 (K-0124), a direct press so outside 2.2.2 (K-0125), TaskBar's existing form (K-0126); (b) height from 0 to `--radix-collapsible-content-height` at `motion.overlay.duration`, a 2.3.3 motion case that C39 must suppress under reduced motion (K-0121, K-0124), with `overflow: hidden` that can clip focus halos inside the content; (c) no animation. Default: (a), which is `col-motion-1`. Closed: (a) (`design.md` row 1, D9, D10).
2. Trigger look. Options: (a) our ghost `Button` md with a chevron that swaps down and up (TaskBar's form, K-0126 Add); (b) a full-width row trigger, label at the start and chevron at the end, as shadcn's Basic card example (K-0120), which needs a new recipe part with its own hover and focus pairs in `pairs.ts` (contract table and impact list grow); (c) a bare trigger the caller dresses (shadcn's parts, K-0120), which Do not copy rules out. Default: (a), which is `col-trigger-1`. Closed: (a), with the label wrap and first-line chevron of D3 and D4 (`design.md` row 2).
3. `aria-controls` while closed. Options: (a) Radix's, absent while closed (K-0122), which the APG allows since it is optional (K-0123); (b) always set, as TaskBar does, which needs `forceMount` (K-0126). Default: (a), which is `col-aria-1`. Closed: (a) (`design.md` row 3).

## Depends on

- `docs/knowledge/design/K-0119` to `K-0126` (benchmark and standards, 2026-11-01).
- `docs/specs/ORV-64/audit.md` section B (table form) and section D.1 row 2 (the story and its done-when).
- `DESIGN.md` §3.3 (motion), §7 (states), §9 item 6 (ambient motion), §11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers").
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` (the Rows per PR form).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).
- `docs/specs/ORV-201/spec.md` (the spec shape, the stylesheet-walk check).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The state map of `col-aria-1`, from the installed `@radix-ui/react-collapsible` 1.2.1 `dist/index.mjs`: Trigger lines 66 and 67 (`"aria-controls": context.open ? context.contentId : void 0`, `"aria-expanded": context.open || false`), Content line 84 (`Presence` with `present: forceMount || context.open` and a function child that always renders `CollapsibleContentImpl`), and Impl lines 97 and 126 to 137 (`isOpen = context.open || isPresent`, `"data-state": getState(context.open)`, `id: context.contentId`, `hidden: !isOpen`, `children: isOpen && children`). Input: `open` true and false, `forceMount` false, no close animation (`col-motion-1`), so `isPresent` equals `open`. Expected output: `open aria-expanded=true aria-controls=c1 content=element id=c1 hidden=false children=rendered state=open` and `closed aria-expanded=false aria-controls=absent content=element id=c1 hidden=true children=none state=closed`.

```bash
node -e 'const m=(open,forceMount=false)=>{const isPresent=forceMount||open,isOpen=open||isPresent;return [open?"open":"closed","aria-expanded="+(open||false),"aria-controls="+(open?"c1":"absent"),"content=element","id=c1","hidden="+!isOpen,"children="+(isOpen?"rendered":"none"),"state="+(open?"open":"closed")].join(" ")};console.log(m(true));console.log(m(false))'
```

W2. The fade duration of `col-motion-1` (AC 6). Input: `motion.feedback.duration` references `{duration.120}` (`semantic.json` lines 1140 to 1144), whose value is `120ms` (`primitives.json` lines 768 to 771); under reduced motion `orivilo.css` line 82 sets it to `0ms`. Expected output, seconds as `getComputedStyle` reports them, no rounding: `normal 0.12s reduced 0s`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const ref=s.motion.feedback.duration.$value.replace(/[{}]/g,"").split(".");const ms=parseFloat(p[ref[0]][ref[1]].$value);console.log("normal",ms/1000+"s","reduced",0+"s")'
```

W3. The one-line trigger height of AC 11. Input: `button.height.md` references `{size.control.md}` (`component.json` lines 163 to 171), which references `{size.10}` (`semantic.json` lines 855 to 858), whose value is `40px` (`primitives.json` lines 529 to 532). Expected output, px, no rounding: `40`. A wrapped trigger is above it (design.md measured 62.4 at two lines).

```bash
node -e 'const c=require("./packages/design-system/src/tokens/source/component.json"),s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const r1=c.button.height.md.$value.replace(/[{}]/g,"").split(".");const r2=s[r1[0]][r1[1]][r1[2]].$value.replace(/[{}]/g,"").split(".");console.log(parseFloat(p[r2[0]][r2[1]].$value))'
```

## Changelog

- v1.0 (2026-11-01): first version, from K-0119 to K-0126 at `e619487` and audit D.1 row 2. Downstream to review: the designer envelope (design.md, open questions 1 to 3), the builder envelope (rows 1 to 16, one PR), the qa envelope (the Rows per PR line once the PR exists), and `catalog/coverage.md`.
- v1.1 (2026-11-01): the three amendments of `design.md` ("Spec amendments this design needs"): the contract table's recipe row gains the trigger wrap, the first-line chevron, and the content inset, `type.body.sm` type and word breaks (D3, D4, D6 to D8), still with no new token or pair; AC 11 `At360` adds a second Collapsible whose trigger label is `fixtures.longThai`, with W3 for its 40 px threshold; AC 6 and 7 find the fade and reduce rules on the bare `.ds-collapsible__content` selector, and `col-motion-1` names it. Open questions 1 to 3 closed as (a), citing `design.md`. Downstream to review: the builder envelope (recipe block per design.md's builder table, the `At360` story and play, the stylesheet walks of rows 6 and 7), the qa envelope (AC 6, 7, 11), and `design.md`'s `spec:` front matter, which still reads v1.0.
- v1.2 (2026-11-01): builder deviation 1 of ORV-203-build-1 (commit `5f4d59d`): the installed `@radix-ui/react-collapsible` 1.2.1 keeps the closed content element in the DOM, empty, `hidden`, with `data-state="closed"` and its `id`; only its children are not rendered, and `aria-controls` stays absent while closed. `col-aria-1` states the closed content element; AC 1 and 3 point to it and check no `.ds-collapsible__content:not([hidden])`; W1 reads the 1.2.1 source lines and its closed line and `node -e` command change to match. Downstream to review: the qa envelope (AC 1, 3, 12 content counts), `col-api-1`, `col-motion-1`, the Benchmark Do not copy row and Out of scope (wording on unmount, listed by the product role for a decision), `design.md` line 35, and the catalog entry `catalog/base/collapsible.yaml`.
