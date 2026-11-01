---
issue: ORV-204 (https://tpetkaew.atlassian.net/browse/ORV-204)
lane: L, because row 2 changes the semantic token `text.disabled` under every profile (a semantic token contract change is an L-lane risk flag, AGENTS.md "Lanes and gates"); G1 and G2 pass under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
design: docs/specs/ORV-204/design.md (rows 1 to 3, builder rows 1.1 to 3.2)
version: 1.0
---

# ORV-204: Select listbox polish

## Goal

The Select listbox is the list a person opens to pick a module, a status or a group. Three things in it look unfinished today (design.md, "Rows"): the selected option is a pill that turns into a stadium or an oval when the option has a description, the group heading floats between its line and its options, the disabled option is barely readable at about 2.3 to 1, and the panel has near-square corners under a pill trigger. This story fixes the three rows the owner listed, with existing tokens only, so the list reads as one calm family under every profile, and a disabled option is readable but still clearly disabled.

Nothing here is simulated. The stories use fixture options (`Select.stories.tsx` lines 45 to 62), shown in Thai and English as the same text, because an open listbox shows no catalog string (design.md, line 7).

## Owner's words

ORV-204 (owner, 2026-11-01): "ปรับทั้งหมดให้ดีขึ้น 1-3", that is, improve all of rows 1 to 3. The three rows, as design.md "Rows" states them:

1. The selected two-line option and the group separator: rules `menu-option-radius-1` and `menu-separator-1`.
2. The group heading spacing and the disabled option: rules `menu-label-1`, `text-disabled-1`, `menu-disabled-pair-1` and `design-doc-1`.
3. The listbox panel radius against the pill trigger: rule `menu-radius-1`.

The story `GroupedSelectedDescribed` that proves rows 1 to 3 is rule `select-story-1`.

## Story

As a person picking from a Select, I see the selected option as one rounded card whatever its line count, each group heading sitting on its own options, a disabled option I can read but cannot mistake for an active one, and a panel whose corners belong with the trigger above it.

## Rules

### menu-option-radius-1

The component token `menu.option.radius` references `{shape.media.radius}` instead of `{shape.control.radius}` (design.md builder row 1.1). Every menu option and command option takes one corner radius for every line count. Under each profile the option corner plus the panel padding is never rounder than the panel corner of `menu-radius-1` (worked example W3). Route rejected: `{shape.container.radius}`, which is rounder inside than the Professional panel allows (design.md row 1, "Route rejected").

### menu-separator-1

`.ds-menu__separator` takes `margin-block: var(--ds-space-inline-lg)` instead of `var(--cmp-menu-padding)`, the same gap above and below the line (design.md builder row 1.2). The line stays centred between its groups.

### menu-label-1

`.ds-menu__label` takes `padding-block: var(--ds-space-inline-sm)` instead of `var(--cmp-menu-padding)` (design.md builder row 2.1). With `menu-separator-1` the heading box starts under the line by the sum in W4 and ends over its first option's fill by the inline-sm step, so the heading leads the group below it.

### text-disabled-1

Contract change. The semantic token `text.disabled` moves to the 500 step of the profile's neutral ramp in both modes, under every profile (design.md builder rows 2.2 to 2.4):

- neutral, `semantic.json`: light `{color.gray.400}` to `{color.gray.500}`, dark `{color.gray.600}` to `{color.gray.500}`
- Professional, `professional.json` (the `text` block only, not `surface.disabled` or `border.disabled`): light `{color.slate.400}` to `{color.slate.500}`, dark `{color.slate.600}` to `{color.slate.500}`
- Friendly, `friendly.json` (the `text` block only): light `{color.cream.400}` to `{color.cream.500}`, dark `{color.cream.600}` to `{color.cream.500}`

`generated.css` and `profiles/generated.css` are regenerated with `pnpm --filter @orivilo/design-system tokens`. The `text.disabled` exemption in `contrast-pairs.ts` (line 151) stays, because the disabled Tag puts `text.disabled` on `surface.disabled`, which stays under the UI floor after the change (W2). The disabled ink keeps no fill, no brand hue and no check, `cursor: not-allowed`, and Radix still skips it on hover and on the arrow keys. Routes rejected: `menu.option.fg-disabled` to `{text.secondary}`, and a menu-only disabled token (design.md row 2, "Routes rejected").

### menu-disabled-pair-1

`pairs.ts` gains `{ recipe: "menu", slot: "disabled option", fg: "menu.option.fg-disabled", bg: "menu.bg", floor: UI }` next to the menu pairs (design.md builder row 2.5). `UI` is 3 (`pairs.ts` line 36). It holds under neutral, Professional and Friendly in light and dark, with the ratios of W1.

### menu-radius-1

The component token `menu.radius` references `{shape.overlay.radius}` instead of `{shape.media.radius}` (design.md builder row 3.1), the radius Command and Dialog already use. The trade-off: under Professional the panel corner grows from its media step to its overlay step under that profile's control-radius trigger (W3), which design.md row 3 accepts with `prof-after-media-grouped-1440-en-light.png`.

### select-story-1

`Select.stories.tsx` gains `GroupedSelectedDescribed`: `render: () => <Select groups={groups} defaultValue="design-system" />` in `inField` (design.md builder row 1.3). Its play opens the list and asserts, then presses Escape:

- the checked option's computed `border-radius` equals the resolved `--ds-shape-media-radius` (`menu-option-radius-1`);
- `separator.top - checked.bottom` and `nextLabel.top - separator.bottom`, from `getBoundingClientRect` rounded to the pixel, each equal the resolved `--ds-space-inline-lg` (`menu-separator-1`);
- each heading box's computed `padding-top` and `padding-bottom` equal the resolved `--ds-space-inline-sm` (`menu-label-1`, builder row 2.7);
- the disabled option's computed `color` equals the resolved `--ds-text-disabled` (`text-disabled-1`, builder row 2.7);
- the listbox's computed `border-radius` equals the resolved `--ds-shape-overlay-radius` (`menu-radius-1`, builder row 3.2).

No public API changes. The play compares against resolved custom properties, so it holds under any profile the boundary sets.

### design-doc-1

`DESIGN.md` §3, the `text.disabled` row (line 49), takes the values of `text-disabled-1` and the note "holds 3.0 on card and raised surfaces; exempt on `surface.disabled`", and DESIGN.md gets a change log line naming ORV-204 rows 1 to 3 with a version bump (design.md builder row 2.6).

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| `text.disabled`, three profiles, both modes (`text-disabled-1`) | Semantic token (contract) | Every reader of `--ds-text-disabled`, found with `grep -rn "text-disabled\|cmp-menu-option-fg-disabled\|cmp-tabs-\(count-\)\?fg-disabled\|cmp-port-fg-disabled\|cmp-tag-fg-disabled"` on this branch: `menu.option.fg-disabled` (`recipes.css` lines 494, 561, 2270, 2310, 2646, 2650: Select, DropdownMenu, ContextMenu, CanvasContextMenu and the Command menu option, with its `Kbd`); `tabs.fg-disabled` and `tabs.count-fg-disabled` (lines 911, 953: Tabs); `tag.fg-disabled` (lines 4007, 4011: Tag, on `surface.disabled`, stays exempt, W2); the Checkbox label (line 637 to 638, `.ds-checkbox[data-disabled] .ds-checkbox__label`); the Field label and description (lines 715 to 717, `.ds-field[data-disabled]`); `port.fg-disabled` (`generated.css` line 1297, no reader in `recipes.css` or the components on this branch); the Tailwind alias `--color-text-disabled` (`generated.css` line 1665, no `text-text-disabled` class in the repo). `DESIGN.md` line 49 (`design-doc-1`). Regenerated `generated.css` and `profiles/generated.css` |
| New pair "disabled option" (`menu-disabled-pair-1`) | Contrast contract | `pairs.ts`; `recipes.test.ts` and `pnpm contrast` check it under six boundaries (W1) |
| `menu.option.radius` (`menu-option-radius-1`) | Component token | The consumers of design.md "What else the change reaches": Select, DropdownMenu, ContextMenu, CanvasContextMenu, the Command menu option (`.ds-command__option`), the CanvasChat node picker option (`.ds-chat__option`) |
| `menu.radius` (`menu-radius-1`) | Component token | Select, DropdownMenu, ContextMenu, CanvasContextMenu, the CanvasChat node picker (`.ds-chat__picker`). Not the Command menu, whose `command.radius` already takes the overlay radius. Professional panel trade-off as `menu-radius-1` states |
| `.ds-menu__separator` margin (`menu-separator-1`) and `.ds-menu__label` padding (`menu-label-1`) | Recipe | Select, DropdownMenu, ContextMenu, CanvasContextMenu. Not the Command menu (its own `.ds-command__group` and `.ds-command__heading`) and not the CanvasChat picker |
| Story `GroupedSelectedDescribed` (`select-story-1`) | Story only | `Select.stories.tsx`; no catalog entry change, no component API change |

Not changed: any component public API, any profile value other than `text.disabled`, `contrast-pairs.ts`, `apps/web`.

## Acceptance criteria

Story `Base/Select` (id `base-select`), new story `GroupedSelectedDescribed` (id `base-select--grouped-selected-described`). Plays run in Thai (the Storybook preview locale), neutral, light. The Field label is "โมดูล"; the option labels are the fixtures in both locales.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai, `GroupedSelectedDescribed` | The play opens the listbox with "Design System" selected | "Design System" with its description "Tokens and recipes" as a rounded card with a straight left edge at the panel padding, its label on the same edge as the heading "ออกแบบ" | None. The checked option's radius is the one of `menu-option-radius-1` | `GroupedSelectedDescribed` play, first assertion of `select-story-1` |
| 2 | Same | Same | The line under "Design System" with an even gap above and below it, square under the card's straight edge, before the heading "ส่งมอบ" | None. The gaps of `menu-separator-1` | `GroupedSelectedDescribed` play, second assertion of `select-story-1` |
| 3 | Same | Same | The headings "ออกแบบ" and "ส่งมอบ" sitting on their own options instead of floating between line and options | None. The heading padding of `menu-label-1` | `GroupedSelectedDescribed` play, third assertion of `select-story-1` |
| 4 | Same | Same | The disabled "เก็บถาวรแล้ว" readable and dimmer than "Review" and "ผลิตภัณฑ์", with no fill and no check; hover and the arrow keys skip it | None. The option keeps `aria-disabled` and its ink is `text.disabled` (`text-disabled-1`) | `GroupedSelectedDescribed` play, fourth assertion of `select-story-1`; the existing `aria-disabled` assertion (`Select.stories.tsx` line 170) stays green |
| 5 | Same | Same | The panel with soft round corners under the pill trigger, the first heading and option clear of the top-left corner | None. The panel radius of `menu-radius-1` | `GroupedSelectedDescribed` play, fifth assertion of `select-story-1` |
| 6 | The PR head | The tokens build and the tokens test run | Not a screen | The generated files hold the references of `text-disabled-1` at every light, dark and `system` line (`generated.css` for neutral, `profiles/generated.css` for Professional and Friendly), and those of `menu-option-radius-1` and `menu-radius-1` | `pnpm --filter @orivilo/design-system test` (the stale-file test), plus `grep -n "ds-text-disabled:" packages/design-system/src/tokens/generated.css packages/design-system/src/profiles/generated.css`, nine lines, each naming the step `text-disabled-1` sets for its ramp |
| 7 | The PR head | `recipes.test.ts` and `pnpm contrast` run | Not a screen | The "disabled option" pair of `menu-disabled-pair-1` passes at the UI floor under neutral, Professional and Friendly, light and dark, at the ratios of W1 | `pnpm --filter @orivilo/design-system exec vitest run src/recipes` and `pnpm contrast` output |
| 8 | The PR head | The diff is read | Not a screen | `contrast-pairs.ts` is unchanged, so the `text.disabled` exemption of `text-disabled-1` stays (W2) | `git diff origin/develop -- packages/design-system/src/tokens/contrast-pairs.ts` is empty |
| 9 | Storybook, profile Professional then Friendly, light, `GroupedSelectedDescribed` opened | The designer opens the list | Under Professional the crisp trigger with a panel of the same corner as that profile's Dialog and Command, options nested exactly inside; under Friendly the rounder panel with options nested inside; primary, then secondary, then disabled ink in that order | None. The nesting of W3 | Visual QA screenshots at 1440, against `prof-after-media-grouped-1440-en-light.png` and `friendly-after-media-icons-and-descriptions-360-th-light.png` (design.md row 2 "After") |
| 10 | Storybook test project | The plays of every menu consumer and every `text.disabled` reader run | DropdownMenu with a wider separator band, its disabled "ไม้บรรทัด" readable; the Command menu's highlighted "Add node" as a rounded bar inside the palette, the disabled "Zoom to selection" readable and dim; Tabs, Tag, Checkbox and Field disabled states with a more legible ink and the same shape | None. Every existing play green | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/select src/components/dropdown-menu src/components/context-menu src/components/canvas-context-menu src/components/command-menu src/components/canvas-chat src/components/tabs src/components/tag src/components/checkbox src/components/field` output |
| 11 | The PR head | `DESIGN.md` is read | Not a screen | The §3 `text.disabled` row, note, change log line and version bump of `design-doc-1` | `grep -n "text.disabled" DESIGN.md` shows the values and the note of `design-doc-1`; `grep -n "ORV-204" DESIGN.md` shows the change log line |
| 12 | Storybook at 360 and 1440 px, Thai and English, light and dark | qa and the designer open the screens of design.md "Screens for visual QA": `base-select--grouped-selected-described`, `base-select--icons-and-descriptions` reopened after its play, `base-select--rich-at-360`, `base-dropdown-menu--checkable`, `application-command-menu--open`, and the disabled stories of Tabs, Tag, Checkbox and Field | The looks of design.md rows 1 to 3 "After": the three-line Thai option at 360 keeps the same corners as a one-line option and the fill does not cut in near its icon or its first and last lines; "เก็บถาวรแล้ว" and "ไม่รับการเปลี่ยนแปลงอีก" readable and dimmer than every enabled label and description; every Thai mark above and below (เก็, ไม่, ปลี่) whole in every cell | None | Designer visual sign-off and qa screenshots, named `<phase>-<story>-<width>-<locale>-<mode>.png` |
| 13 | The PR head | The affected suites, then the full gate run | Every play and test passes | None | The commands of rows 7 and 10 in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

Rows 1 to 5 prove rows 1 to 3 of the owner's list on the Select; rows 6 to 8 and 11 the contract; rows 9, 10 and 12 the reach and the look; row 13 the gate.

## Rows per PR

One PR covers rows 1 to 13 (design.md builder rows 1.1 to 3.2, estimated under the 400-line guide); the main session adds its line in the form `qa-scope-1` reads when the PR opens, with a changelog line.

- PR 177: rows 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13

## Rows that render nothing

- Rows: 6, 7, 8, 11, 13

## Out of scope

- The listbox running wider than the trigger at 360 (ORV-194 row 8's available-width rule, design.md "Seen but out of scope").
- The Grouped fixture's "Design System" without an icon (a fixture choice, design.md "Seen but out of scope").
- The selected and highlighted state, which stays as today (ORV-192, design.md "States").
- The Command menu's own group border and heading, and its panel radius (already the overlay radius).
- Raising `text.disabled` on `surface.disabled` (the Tag) to the UI floor; it stays exempt (`text-disabled-1`).
- Any new token, any component public API change, `apps/web`, and visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. `.claude/rules/testing.md` (L-0018) says a play that sets one CSS property and asserts it is not the visual check. Rows 1, 3, 4 and 5 assert computed properties against resolved tokens, as design.md builder rows 1.3, 2.7 and 3.2 state; row 2 asserts rendered boxes. Default: the play also calls `expectNoGlyphClip` on "เก็บถาวรแล้ว" and on the heading "ส่งมอบ" (`src/testing/visual-asserts.ts`), and the corners and ink are judged by the row 12 sign-off. The builder confirms or the main session drops the extra call.
2. `port.fg-disabled` has no reader in `recipes.css` or the components on this branch. Default: it follows `text.disabled` through the token and needs no shot; a follow-up may remove or wire it.

## Depends on

- `docs/specs/ORV-204/design.md` (rows 1 to 3, builder rows 1.1 to 3.2, "What else the change reaches", "Screens for visual QA").
- ORV-204, the owner's words and the three rows.
- `DESIGN.md` §3 (colour roles, the `text.disabled` row), §7 (states), §11 (design gate).
- `.claude/rules/design-system.md` ("Tokens and layers": a contract change is L lane with an impact list), `.claude/rules/testing.md` (L-0018).
- `packages/design-system/src/recipes/pairs.ts` (the `UI` floor, the menu pairs), `packages/design-system/src/tokens/contrast-pairs.ts` line 151 (the exemption).
- ADR 0003 (Storybook and catalog), ADR 0012 (gates and delegation).
- `docs/specs/ORV-192/tag-options.md` line 84 (the disabled Tag ratios today).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`. Contrast is the WCAG 2 relative-luminance ratio, rounded to two decimals.

W1. The ratios of `menu-disabled-pair-1`: the 500 step of each profile's neutral ramp on `surface.raised` (the `menu.bg`, `component.json` line 965) light (the 25 step) and dark (the 800 step), and on `surface.card` light (`color.white`). Input: `primitives.json` lines 6 to 53 and 355 to 358, `professional.json` and `friendly.json` `primitives.color` (`slate`, `cream`). Expected output (design.md row 2 table): `neutral 3.62 4.48 3.72`, `professional 3.55 3.35 3.64`, `friendly 3.54 3.33 3.66`. Every value is at least 3.

```bash
node -e 'const r=f=>require("./packages/design-system/src/"+f);const P=r("tokens/source/primitives.json").color,S=r("profiles/source/professional.json").primitives.color,F=r("profiles/source/friendly.json").primitives.color;const L=x=>{const c=[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};const C=(a,b)=>{const[x,y]=[L(a),L(b)].sort((m,n)=>n-m);return((x+0.05)/(y+0.05)).toFixed(2)};for(const[n,R,k]of[["neutral",P,"gray"],["professional",S,"slate"],["friendly",F,"cream"]]){const s=R[k];console.log(n,C(s["500"].$value,s["25"].$value),C(s["500"].$value,s["800"].$value),C(s["500"].$value,P.white.$value))}'
```

W2. The neutral ratios before the change and on the Tag's exempt ground (`text-disabled-1`). Input: `gray.400` and `gray.600` on `gray.25` and `gray.800` (today's `text.disabled` on the raised menu ground), `gray.500` and `gray.400` on `gray.200` (`surface.disabled` light), `primitives.json` lines 6 to 53. Expected output: `before 2.31 2.46 tag-after 2.87 tag-before 1.82`. Note: design.md row 2 says "the 1.9 it gives today" for the Tag; the computed value is 1.82, as `docs/specs/ORV-192/tag-options.md` line 84 also gives. The conclusion (under 3.0, stays exempt) is the same.

```bash
node -e 'const g=require("./packages/design-system/src/tokens/source/primitives.json").color.gray;const L=x=>{const c=[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};const C=(a,b)=>{const[x,y]=[L(g[a].$value),L(g[b].$value)].sort((m,n)=>n-m);return((x+0.05)/(y+0.05)).toFixed(2)};console.log("before",C("400","25"),C("600","800"),"tag-after",C("500","200"),"tag-before",C("400","200"))'
```

W3. The nesting of `menu-option-radius-1` inside `menu-radius-1`: option radius (`shape.media.radius`) plus panel padding (`menu.padding` = `space.inset.sm`, no profile overrides space) against the panel radius (`shape.overlay.radius`). Input: `semantic.json` lines 747 to 765 and 777 to 781, `professional.json` and `friendly.json` `semantic.shape`, `primitives.json` `radius` and `space`. Expected output, integers in px: `neutral option 12 panel 24 nested 20 ok`, `professional option 8 panel 16 nested 16 ok`, `friendly option 16 panel 32 nested 24 ok`.

```bash
node -e 'const r=f=>require("./packages/design-system/src/"+f);const P=r("tokens/source/primitives.json"),S=r("tokens/source/semantic.json");const px=ref=>{const[g,k]=ref.slice(1,-1).split(".");return parseFloat(P[g][k].$value)};const pad=px(S.space.inset.sm.$value);for(const[n,s]of[["neutral",S.shape],["professional",r("profiles/source/professional.json").semantic.shape],["friendly",r("profiles/source/friendly.json").semantic.shape]]){const m=px((s.media||S.shape.media).radius.$value),o=px((s.overlay||S.shape.overlay).radius.$value);console.log(n,"option",m,"panel",o,"nested",m+pad,m+pad<=o?"ok":"too round")}'
```

W4. The heading spacing of `menu-label-1` with `menu-separator-1`, and the first heading's distance from the panel top. Input: `space.inline.lg`, `space.inline.sm`, `space.inset.sm` (`semantic.json` lines 777 to 821) through `primitives.json` `space`. Expected output, integers in px: `under-line 16 over-option 4 first-from-top 12`.

```bash
node -e 'const r=f=>require("./packages/design-system/src/"+f);const P=r("tokens/source/primitives.json"),S=r("tokens/source/semantic.json");const px=ref=>{const[g,k]=ref.slice(1,-1).split(".");return parseFloat(P[g][k].$value)};const lg=px(S.space.inline.lg.$value),sm=px(S.space.inline.sm.$value),pad=px(S.space.inset.sm.$value);console.log("under-line",lg+sm,"over-option",sm,"first-from-top",pad+sm)'
```

## Changelog

- v1.0 (2026-11-01): first version, from design.md at `4dff493` (rows 1 to 3, builder rows 1.1 to 3.2) and the owner's words on ORV-204. Downstream to review: the builder envelope (one PR, AC rows 1 to 13, open question 1), the qa envelope (the Rows per PR line once the PR exists, the screens of row 12), design.md (the Tag "1.9" against W2's 1.82), and `DESIGN.md` §3 (`design-doc-1`).
