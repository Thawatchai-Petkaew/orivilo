---
issue: ORV-84 (https://tpetkaew.atlassian.net/browse/ORV-84)
lane: M (design-system stories and the Storybook preview surface, found in the ORV-80 visual QA)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-84: hover items without a pointer, focus rings and Thai marks inside the mode surface

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook UI, neutral profile, light then dark mode, no pointer over the story | A story of `hover-items-1` opens | Its hover item shows the hover look beside its default item; the two differ in the colour that `hover-items-1` names for the story (look from `hover-force-1`) | None | The screenshots of row 5 |
| 2 | The storybook test project | The plays of the `hover-items-1` stories run | Each play passes the assertion of `hover-test-1`, and its red run is recorded as `hover-test-1` states | None | The command of `hover-test-1`; the red runs in the builder's `verified` |
| 3 | The padding of `surface-padding-1` on the mode surface | The whole storybook test project runs (a preview file changed, `.claude/rules/testing.md`) | Every story of `single-component-story-1` renders with the padding and bounds that `surface-padding-1` states, and the project passes | None | A read of the `preview.tsx` diff; the command and the measurement of `surface-padding-1` |
| 4 | Storybook UI, neutral profile, light then dark mode | A story of `eye-check-1` opens and its play has run | The whole focus ring of a focused item and every Thai mark the story renders, such as those of the labels เลือกทั้งหมด (Checkbox `Indeterminate`) and บรีฟ (Textarea `Counter` and `OverLimit`), sit on the surface colour; no part overlaps Storybook's white margin | None | The screenshots of row 5 |
| 5 | The head the reviewer approved | The designer takes light and dark screenshots of the `eye-check-1` stories | Each screenshot shows the hover colour of row 1 and the ring and marks of row 4 for its story | None | Designer visual sign-off before qa (L-0019) |

Criterion 1 of the issue (each `InteractionStates` story shows a visible hover item without a real pointer, with a test) is rows 1 and 2; criterion 2 (no focus ring or Thai mark outside the mode surface, light and dark) is rows 3 and 4; criterion 3 (light and dark screenshots checked by eye) is row 5. No row changes product data or app behavior: the change stays in Storybook stories and the preview. The Thai lines of row 4 are fixture text, the same under both toolbar locales, so they have no English pair.

## Why

Storybook is the visual half of the catalog (ADR 0003), and DESIGN.md §7 asks that each state that applies has a story and a visible difference (line 181); hover shows an edge or ink change (line 186). The ORV-80 visual QA found two defects against that (L-0001: visual defects no one looked at).

- The hover item of the `InteractionStates` stories renders like the default item, as the issue saw in Checkbox (`Checkbox.stories.tsx` line 102) and Textarea (`Textarea.stories.tsx` line 51). Each play calls `userEvent.hover`, which dispatches synthetic events, and the browser sets `:hover` only under a real pointer; the CanvasEdge play says so (`CanvasEdge.stories.tsx` line 155). With a real pointer the Checkbox and Textarea border turns from #85838F to #5B5A66 in light mode and to #A9A7B3 in dark mode (the issue's observation; DESIGN.md §3.1 `border.control` and `border.control-hover`). No `InteractionStates` play asserts hover.
- The mode surface (`packages/design-system/.storybook/preview.tsx` line 24) has no inner padding. In a story with `layout: "padded"`, Storybook pads the body by 1rem outside the surface (Storybook 10.6.3 `assets/server/base-preview-head.html` lines 51 to 56), so an item flush with the surface draws its focus ring (2 px at a 2 px offset, `packages/design-system/src/tokens/orivilo.css` lines 32 to 35) and its Thai marks on that white margin: Checkbox `InteractionStates` and `Indeterminate`, Textarea `Counter` and `OverLimit`. In dark mode they sit on white.

What is simulated: the forced hover (`hover-force-1`) is a Storybook display of the recipe's hover look without a pointer. It shows and tests the look; it does not prove that a pointer reaches it (the `:hover` rules do that, kept by `hover-force-1`). No product behavior changes.

## Story

As the designer or the owner reviewing a component in Storybook, I want each `InteractionStates` story to show its hover item in the hover look without a pointer, and focus rings and Thai marks inside the mode surface, so that a light and a dark screenshot show each state as it renders.

## Scope

- The 8 `InteractionStates` stories of `hover-items-1`: the force of `hover-force-1`, the default items that `hover-items-1` adds, and the assertion of `hover-test-1`.
- The Storybook preview surface: the `withDesignProfile` decorator in `packages/design-system/.storybook/preview.tsx` (lines 19 to 28), as `surface-padding-1` states. Checkbox `Indeterminate` and Textarea `Counter` and `OverLimit` need no change of their own.
- For the default route of `hover-force-1`: `packages/design-system/.storybook/main.ts` (the addons list, line 5), `packages/design-system/package.json` (devDependencies) and `pnpm-lock.yaml`. For the fallback route instead: `packages/design-system/src/recipes/recipes.css` (section Recipe contract impact).
- One PR into `develop`, about 200 changed lines outside the lockfile.

## Rules and bounds

Mode surface: the element that `withDesignProfile` renders inside `DesignProfileBoundary` (`packages/design-system/.storybook/preview.tsx` line 24), with the canvas background and the full frame height. White margin: Storybook's 1rem body padding around a padded story (`base-preview-head.html` line 53), outside the mode surface.

### hover-items-1

The 8 stories with an `InteractionStates` export in `packages/design-system/src` on `eeb2e71`. For each: the hover item, the default item it is compared with, the hover rule in `packages/design-system/src/recipes/recipes.css`, the property compared, and the tokens at rest and on hover (`--cmp-*` lines in `packages/design-system/src/tokens/generated.css`; values per profile and mode in DESIGN.md §3.1). A default item marked added is new in its story.

- `base-button--interaction-states` (`button/Button.stories.tsx` line 56): hover item, the button `Hover`; default item, a button `Default` (added); rule line 76; compared, background colour; `action.primary` at rest, `action.primary-hover` on hover (`generated.css` lines 568 and 569).
- `application-card--interaction-states` (`card/Card.stories.tsx` line 84): hover item, the card with `data-testid="hover"`; default item, a card with `data-testid="default"` (added); rule line 1060; compared, border colour; `border.card` at rest, `border.control-hover` on hover (lines 663 and 664).
- `base-checkbox--interaction-states` (`checkbox/Checkbox.stories.tsx` line 102): hover item, the box of the checkbox `Hover`; default item, the box of a checkbox `Default` (added); rule line 566; compared, border colour of `.ds-checkbox__box`; `border.control` at rest, `border.control-hover` on hover (lines 848 and 854).
- `base-input--interaction-states` (`input/Input.stories.tsx` line 48): hover item, the field `Hover`; default item, a field `Default` (added); rule line 242; compared, border colour; `border.control` at rest, `border.control-hover` on hover (lines 628 and 629).
- `base-textarea--interaction-states` (`textarea/Textarea.stories.tsx` line 51): hover item, the field `Hover`; default item, a field `Default` (added); rule line 242; compared, border colour; the same tokens as Input.
- `base-tabs--interaction-states` (`tabs/Tabs.stories.tsx` line 174): hover item, the tab ประวัติ; default item, the tab การตัดสินใจ, at rest once the play has selected `Tokens`; rule line 829; compared, text colour and background colour, both; `text.secondary` (line 912) and a transparent background (recipe line 815) at rest, `text.primary` and `surface.hover` on hover (lines 913 and 916).
- `application-canvas-edge--interaction-states` (`canvas-edge/CanvasEdge.stories.tsx` line 130): hover item, edge 2; default item, edge 1 (the play names both, line 146); rule line 1939; compared, stroke colour of `.ds-edge__path`; `edge.stroke` at rest, `edge.stroke-hover` on hover (lines 1027 and 1028).
- `application-canvas-node--interaction-states` (`canvas-node/CanvasNode.stories.tsx` line 203): hover item, the node `hover`; default item, a node `default` (added); rule line 1501; compared, border colour; `border.card` at rest, `border.control-hover` on hover (lines 971 and 976).

Story labels are fixture text written in the story and do not change with the toolbar locale; an added label follows its siblings (`Default` beside `Hover` and `Focus`, `default` beside the CanvasNode titles). Stories are outside the locale check (`packages/design-system/tests/check-i18n.test.ts` lines 86 and 87).

### hover-force-1

Each story of `hover-items-1` renders its hover item in the hover look from render, with no pointer, through one route for all 8 stories:

1. Default route: a pseudo-state parameter, `parameters.pseudo` of the Storybook addon `storybook-addon-pseudo-states`, registered in `packages/design-system/.storybook/main.ts` and added to the devDependencies of `packages/design-system`. Its selector hits the element the hover rule keys on (for the Checkbox the root `.ds-checkbox` div, `Checkbox.tsx` lines 56 to 60, not the box that the story's `id` lands on).
2. Fallback route: a data attribute that the hover rule also matches, set on the hover item or on an element the story renders around it. It changes the recipe contract (section Recipe contract impact).

The builder takes the default route. If no release of the addon accepts storybook 10.6.3 in its peer dependencies, or the parameter does not show the hover look in the storybook test project, the builder stops with `blocked` and names the reason; the fallback then waits for tech notes, since it changes a contract (POC mode). The force never comes from a pointer event (`userEvent.hover` sets no `:hover`), a new component prop or graph data field (a public API; DESIGN.md §7 line 198 keeps hover out of public props) or a colour set in the story (`.claude/rules/design-system.md`, section Storybook). The `:hover` rules stay as they are, so a real pointer still shows the look.

### hover-test-1

Each play of a `hover-items-1` story asserts, after the story's own waits, that the computed value of the compared property on the hover item differs from the one on the default item (for Tabs, each of the two properties). It waits for the condition with `waitFor`, never a fixed time, because the recipes ease colour over the feedback duration (`recipes.css` lines 824 and 1928, for example). This reads the recipe's result, not a property the play sets (L-0018); the look itself is checked on the screenshots of `eye-check-1`. The builder runs each play once with the force of `hover-force-1` removed, sees it fail (`.claude/rules/testing.md`: a test fails on the real defect) and records the red runs in `verified`. The test project runs light, neutral and Thai only (`preview.tsx` lines 52 to 55 and 94, `packages/design-system/vite.config.ts` line 26), so dark mode is checked by eye.

```bash
pnpm --filter @orivilo/design-system exec vitest run --project storybook button/Button.stories card/Card.stories checkbox/Checkbox.stories input/Input.stories textarea/Textarea.stories tabs/Tabs.stories canvas-edge/CanvasEdge.stories canvas-node/CanvasNode.stories
```

### surface-padding-1

The `withDesignProfile` decorator (`packages/design-system/.storybook/preview.tsx` lines 19 to 28) gives the mode surface the padding `p-4` (16 px) when the story's resolved `layout` parameter is `padded`; a story whose layout is `fullscreen` keeps the surface as it is. The padding lives in that one place and every story of `single-component-story-1` renders through it, so no story file changes for it. Bounds: the padding is wider than the reach of the focus ring (worked example 1), and at the test viewport a `Narrow` column still renders 360 px wide (worked example 1), which the builder measures on one `LongContentAt360` story in the test project and records in `verified` (L-0015). The whole storybook test project passes, run in full because a preview file changed (`.claude/rules/testing.md`):

```bash
pnpm --filter @orivilo/design-system exec vitest run --project storybook
```

### single-component-story-1

The stories whose resolved `layout` is `padded`: each story of the 32 files below in `packages/design-system/src/components`, whose meta sets `layout: "padded"`, except `StudioLayout` in `Inspector.stories.tsx` (line 253 sets fullscreen). The files, each `<Name>.stories.tsx`: Badge, Button, CanvasChat, Card, Checkbox, ContextMenu, Dialog, DirectionStudio, DropdownMenu, Field, Input, InputGroup, Inspector, Kbd, MissingInputsPrompt, PasswordInput, Popover, Progress, RangeSlider, Resizable, ScrollArea, Select, Sheet, Slider, Table, Tabs, Tag, TaskBar, Textarea, Toast, ToggleGroup and Tooltip.

Not members: the 12 component story files whose meta sets `layout: "fullscreen"` (BlockLibrary, CanvasBoard, CanvasContextMenu, CanvasControls, CanvasEdge, CanvasNode, CommandMenu, MiniMap, NodeGroup, NodePort, NodeToolbar and ShortcutSheet), and the 4 files in `src/examples` and the 6 in `src/foundations`, which take the preview's default `fullscreen` (`preview.tsx` line 96). In fullscreen Storybook puts no margin around the surface (`base-preview-head.html` lines 45 to 49), so there is no white margin to draw on. `src/testing/visual-asserts.stories.tsx` is padded and gets the padding too, but it holds test fixtures, not a component.

### eye-check-1

The stories the designer screenshots in the Storybook UI, in light and dark mode under the neutral profile, after each story's play has run: the 8 stories of `hover-items-1`, plus `base-checkbox--indeterminate`, `base-textarea--counter` and `base-textarea--over-limit`, where the issue saw focus rings and Thai marks on the white margin (as in Checkbox `InteractionStates`). That is 11 stories and 22 screenshots; the ids come from worked example 2. The designer judges rows 1 and 4 on them by eye in the visual sign-off before qa (L-0019).

## Recipe contract impact (fallback route only)

The default route of `hover-force-1` changes no recipe, token or component. The addon runs in Storybook only and is not a runtime dependency, so POC mode asks no security pass for it (`.claude/skills/ovl/SKILL.md` lines 57 and 58). The fallback route adds a hover hook to the recipe contract:

- `packages/design-system/src/recipes/recipes.css` lines 8 to 10 say interaction states are pseudo-classes; the header gains the hook and who may set it.
- The hover rules that `hover-items-1` names gain the hook beside `:hover`, with the same declarations. The rule at line 242 is `.ds-control`, so the hook also reaches the Select trigger (`Select.tsx` line 103) and the DirectionStudio control (`DirectionStudio.tsx` line 179). The 20 other lines with `:hover` (Out of scope) stay as they are.
- No token and no `--cmp-*` name is added: the token sources, `generated.css`, `src/recipes/pairs.ts` and the contrast pairs stay, and `src/recipes/recipes.test.ts` keeps passing, because the new selectors reuse the same custom properties.
- Reach: Button, Input, Textarea, TabsTrigger and Card pass unknown attributes to their element, so a story sets the hook on them directly. Checkbox props are closed (`Checkbox.tsx` lines 10 to 27), and CanvasNode and CanvasEdge render from graph data, so for those three the hook sits on an element the story renders, or the play sets it before its assertion. `hover-force-1` rules out a prop or a graph field for it, which would also make the PR lane L (component public API, lanes table of AGENTS.md).
- Risk: product code could set the hook and show a control at rest as hovered. The tech notes name the hook and how product code is kept from setting it.
- Process: tech notes before the builder (POC mode, a contract change), the designer sign-off on the changed recipe (L-0019), and this list as the impact list of AGENTS.md iron rule 2.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

1. Ring reach, padding and the 360 px column (`surface-padding-1`). Inputs: outline 2 px and offset 2 px (`packages/design-system/src/tokens/orivilo.css` lines 33 and 34); Storybook's padded body, 1rem at 16 px (Storybook 10.6.3 `assets/server/base-preview-head.html` line 53); `p-4` as 4 times `--spacing: 0.25rem` (tailwindcss 4.3.3 `theme.css` line 325); the Vitest browser viewport, 414 px wide (vitest 5.0.5 `dist/chunks/index.1TqnEahn.js` lines 9112 and 9113); `Narrow` at 360 px (`packages/design-system/src/components/matrix.tsx` line 50). `inside` models the Storybook UI: the surface edge sits at the body padding, the item at that edge plus the padding, and the ring reaches `reach` beyond the item. `room` is the width a story gets in the test project, where Storybook's body padding does not apply. Expected output, integers with no rounding: `4 16 false true 382 360`.

   ```bash
   node -e 'const outline=2,offset=2,rem=16,body=1*rem,pad=4*0.25*rem,viewport=414,narrow=360;const reach=outline+offset;const inside=p=>body+p-reach>=body;const room=viewport-2*pad;console.log(reach,pad,inside(0),inside(pad),room,Math.min(narrow,room))'
   ```

2. Story ids of `eye-check-1`, from the story titles (`title:` in `Checkbox.stories.tsx` line 8, `Input.stories.tsx` line 9, `Button.stories.tsx` line 18, `Card.stories.tsx` and `Textarea.stories.tsx` line 20, `CanvasNode.stories.tsx` line 59, `CanvasEdge.stories.tsx` line 80 and `Tabs.stories.tsx` line 83) and the export names. Method: `storyPrefix` in `scripts/ovl/result-recorder.mjs` (lines 167 to 171) for the title and the name, with Storybook 10.6.3 `toStartCaseStr` (`dist/_browser-chunks/chunk-NULBREPZ.js` lines 2 and 3) reduced to the two replacements these export names hit. Expected output, strings with no rounding: `base-button--interaction-states application-card--interaction-states base-checkbox--interaction-states base-input--interaction-states base-textarea--interaction-states base-tabs--interaction-states application-canvas-edge--interaction-states application-canvas-node--interaction-states base-checkbox--indeterminate base-textarea--counter base-textarea--over-limit`.

   ```bash
   node -e 'const t=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");const n=k=>k.replace(/([^\n])([A-Z])([a-z])/g,"$1 $2$3").replace(/([a-z])([A-Z])/g,"$1 $2");console.log([["Base/Button","InteractionStates"],["Application/Card","InteractionStates"],["Base/Checkbox","InteractionStates"],["Base/Input","InteractionStates"],["Base/Textarea","InteractionStates"],["Base/Tabs","InteractionStates"],["Application/Canvas edge","InteractionStates"],["Application/Canvas node","InteractionStates"],["Base/Checkbox","Indeterminate"],["Base/Textarea","Counter"],["Base/Textarea","OverLimit"]].map(([a,b])=>t(a)+"--"+t(n(b))).join(" "))'
   ```

## Out of scope

- Pressed items in the Button and Card `InteractionStates` stories: a synthetic pointer sets no `:active` either.
- Hover of the 20 lines with `:hover` in `recipes.css` that no `InteractionStates` story shows: lines 93, 110, 128, 144 and 162 (the other Button variants), 353, 1157, 1208, 1872, 1876, 2190, 2275, 2635, 2698, 2745, 3049, 3489, 3647, 3668 and 4171.
- Storybook's white margin itself (open question 4), and fullscreen stories.
- A dark mode or second profile run of the plays.
- Visual regression baselines (`.claude/rules/testing.md`: advisory until baselines are stable).
- `apps/web`, tokens, profiles, contrast pairs and component props.
- Thai versions of the story fixture labels `Hover`, `Focus`, `Pressed` and `Default`.
- An automated check of rings and marks against the surface (open question 7).

## Open questions (with defaults)

1. Hover route. Options: (a) the pseudo-state parameter, a devDependency and no contract change; whether a release accepts storybook 10.6.3 was not checked here (no network); (b) a data attribute, a recipe contract change with tech notes. Default: as `hover-force-1` states.
2. What to compare where the hover rule changes no border (Button, Tabs, CanvasEdge), though the issue says border. Options: (a) the property the hover rule sets; (b) add a border change to those hover rules, a design change beyond this issue. Default: (a), the compared entries of `hover-items-1`.
3. Where the padding lives. Options: (a) the decorator, padded stories only; (b) a padded wrapper in each of the 32 files; (c) the decorator for every story, fullscreen ones too, which shifts the stories that fill the frame. Default: (a), as `surface-padding-1` states.
4. Storybook's white margin around padded stories, white in dark mode too. Options: (a) keep it; (b) move the 32 files to fullscreen, which changes the frame of every padded story and each of those files. Default: (a); this issue keeps rings and marks off it.
5. The default items. Options: (a) a visible default item in the 6 stories without one; (b) a probe element the play creates, as a Button play does (`Button.stories.tsx` lines 119 to 126). Default: (a), the default items of `hover-items-1`, so a screenshot shows hover beside default.
6. Which stories are single-component stories, a term the issue does not define. Options: (a) `single-component-story-1`; (b) every story in `src/components`, the 12 fullscreen files that `single-component-story-1` leaves out too, which have no white margin, so the padding would only shift stories that fill the frame. Default: (a).
7. An automated check that rings and marks stay inside the mode surface. Options: (a) none, the screenshots of row 5 are the check, as the issue names them; (b) a play that measures the ring box against the surface box, which still cannot see a mark drawn above the font's ascent (`packages/design-system/src/testing/visual-asserts.ts` lines 243 and 244). Default: (a).
8. Follow-up issues for the items of Out of scope. Options: (a) open them now; (b) leave them to the main session at G3, when the PR shows what is left. Default: (b); none is opened by this spec.

## Depends on

- ADR 0003 (`docs/adr/0003-shadcn-behavior-own-visual-layer.md`): Storybook is the visual half of the catalog, and recipes are the visual layer.
- DESIGN.md §7 (lines 181, 186, 187 and 198) and §11, the design gate for a PR that touches UI.
- `.claude/rules/design-system.md`, sections Components (states per §7, each a story) and Storybook (a story never sets a colour itself).
- `.claude/rules/testing.md`: a test fails on the real defect and waits for conditions, and a preview file change runs the full suite.
- Lessons L-0001, L-0015, L-0018 and L-0019 (`docs/LESSONS.md`).
- ORV-80, the visual QA that found both defects, and ORV-137, POC mode (`.claude/skills/ovl/SKILL.md`).

## Changelog

- v1.0 (2026-10-30): first version, from the ORV-84 description as the envelope of task ORV-84-spec-1 gives it (no Jira tool in this role). Downstream to review: none yet; no tech notes, design or code exist for ORV-84.
