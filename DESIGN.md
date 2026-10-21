# DESIGN.md: ORIVILO (agent-readable, v1.2)

Read this before any UI work: a Studio screen, a shared component, a story, a recipe, a preview, or a review of generated output. It is the design contract the `frontend-design` skill critiques against and the **design gate** (§11) that blocks G3. Rules that enforce it live in `.claude/rules/design-system.md`; the component registry lives in `packages/design-system/catalog/`.

Status, so nobody over-reads this file: the values in §3–§5 are ORIVILO's brand v1.1 **hypothesis** (`docs/context/brand/orivilo-brand-spec-v1.1.md`, tests still open in its §8). Storybook and the token CSS exist (`packages/design-system/src/tokens/orivilo.css`, E2-0); no shared component or recipe exists yet. The mood (§2, airy bento) is the owner's choice of 2026-10-21 from the UI direction study (`docs/context/ui-direction.md`). Each "planned" item names the backlog story that makes it real (`docs/specs/backlog-draft.md`).

## 1. What this file governs, and what it does not

| Surface                                                                | Governed by                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| The Studio shell (ORIVILO's own screens, Storybook chrome, docs pages) | This file. The shell runs the **neutral profile** (E2-3), whose values are §3–§5               |
| Shared components in `packages/design-system`                          | This file for behavior, states, naming, and the gate; **recipes** for every visual value       |
| Previews and output generated for a customer brand                     | The **resolved profile** of that brand. Nothing in §3 leaks into a preview frame (handoff §16) |

Two namespaces, one component set. A component never knows which brand it is rendering; it reads semantic tokens from the nearest `DesignProfileBoundary`. If a value from this file appears hard-coded in a component or a page, the gate fails.

## 2. Point of view

- **Idea.** A loop that does not close, and the dot it stays connected to: a product keeps becoming, and every artifact traces back to its reason. Space, restraint, one signature colour spent where it counts.
- **ORIVILO is its own first customer.** The shell must pass the same tests we run on generated output: the "tells of generated design" list in `.claude/skills/frontend-design/SKILL.md`, contrast on real pairs in every mode, Thai and Latin on the same line.
- **Spend boldness once.** Lime is the signature; it appears as a bead, a highlight plane, or the one Intent Engine button per screen, never as body text on light ground and never as a status colour. Ink does the work of action. Violet marks selection and links. Everything else is ink and canvas.
- **Airy bento (mood E, owner's choice 2026-10-21).** Overview screens are a loose grid of borderless white cards on the warm canvas with generous padding, pill controls, big numerals set in the body face at weight 600, and at most one soft lime glow per screen. Working surfaces (canvas, inspector, tables) keep the compact density of §3.3; the bento is for reading, not for operating. In dark mode the same shapes hold, with the lime limited to one button and one bead so the screen does not collapse into the near-black-with-acid-accent look (§9 item 1).
- **Honest UI.** Rule-based behavior is labelled rule-based. Mock data is labelled mock. No trust badge, rating, discount, countdown, or success state without backing data (`AGENTS.md`).
- **Words are design.** Sentence case, plain verbs, from the user's view, in the user's language. Thai copy is written as Thai, never translated word by word.

## 3. Semantic tokens (the contract)

Naming: token path `group.role` ⇔ CSS custom property `--ds-group-role` ⇔ Tailwind utility `bg-surface-canvas` / `text-text-secondary` through `@theme`. Components and pages use these names only. shadcn's variable set (`--primary`, `--ring`, …) is an adapter target inside recipes (ADR 0003) and never appears in a profile, a story, or a page.

### 3.1 Colour, both modes (snapshot of `semantic.json`, 2026-10-21)

The source of truth is `packages/design-system/src/tokens/source/semantic.json`; Storybook renders it live under Foundations › Semantic with the reference chain and the contrast of every declared pair. The table below is a snapshot so the contract can be read without the tool. Each cell names the primitive step and its hex. Dark is a remap by role, not an inversion (handoff §10). Every declared pair is tested in both modes by `tokens.test.ts`; a failing pair fails `pnpm test`.

| Token                      | Light                   | Dark               | Pair, floor             | Use for                                                                                       |
| -------------------------- | ----------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| `surface.canvas`           | gray.50 #F4F4F0         | gray.900 #16151D   |                         | Page background                                                                               |
| `surface.card`             | white #FFFFFF           | gray.800 #1E1D26   |                         | Content containers, inputs, menus                                                             |
| `surface.raised`           | gray.25 #FCFCFA         | gray.700 #2B2A36   |                         | A surface on a card: menus, nested panels                                                     |
| `surface.sunken`           | gray.100 #F2F1EC        | gray.950 #060509   |                         | Wells, code blocks, table headers                                                             |
| `surface.hover`            | gray.100 #F2F1EC        | gray.700 #2B2A36   |                         | Hover ground for rows, ghost buttons, nav items                                               |
| `surface.selected`         | violet.50 #F4EEFD       | violet.950 #2A2140 |                         | Selected row, chosen option                                                                   |
| `surface.disabled`         | gray.200 #E3E2DC        | gray.700 #2B2A36   |                         | Disabled controls                                                                             |
| `surface.inverse`          | gray.900 #16151D        | gray.50 #F4F4F0    |                         | Inverse blocks, toasts, tooltips                                                              |
| `surface.scrim`            | black #000000           | black #000000      |                         | Behind overlays, at opacity.scrim                                                             |
| `text.primary`             | gray.900 #16151D        | gray.100 #F2F1EC   | surface.canvas, 4.5     | Body, headings, values                                                                        |
| `text.secondary`           | gray.600 #5B5A66        | gray.400 #A9A7B3   | surface.canvas, 4.5     | Supporting text, meta                                                                         |
| `text.tertiary`            | gray.600 #5B5A66        | gray.400 #A9A7B3   | surface.card, 4.5       | Hints, timestamps. Same value as secondary until a three-level hierarchy is proven in a story |
| `text.placeholder`         | gray.600 #5B5A66        | gray.400 #A9A7B3   | surface.card, 4.5       | Placeholder in inputs; must read at 4.5 like any text                                         |
| `text.disabled`            | gray.400 #A9A7B3        | gray.600 #5B5A66   |                         | Disabled labels                                                                               |
| `text.on-action`           | white #FFFFFF           | gray.900 #16151D   | action.primary, 4.5     | On action.primary                                                                             |
| `text.on-intent`           | gray.900 #16151D        | gray.900 #16151D   | action.intent, 4.5      | On action.intent                                                                              |
| `text.on-destructive`      | white #FFFFFF           | gray.900 #16151D   | action.destructive, 4.5 | On action.destructive                                                                         |
| `text.on-inverse`          | gray.100 #F2F1EC        | gray.900 #16151D   | surface.inverse, 4.5    | On surface.inverse                                                                            |
| `text.link`                | violet.700 #6B22B0      | violet.300 #C49AF2 | surface.canvas, 4.5     | Links in running text                                                                         |
| `text.link-hover`          | violet.900 #3F1366      | violet.200 #D3B6F7 | surface.canvas, 4.5     | Hover of links                                                                                |
| `text.brand`               | violet.700 #6B22B0      | violet.300 #C49AF2 | surface.canvas, 4.5     | Brand-coloured text, used rarely                                                              |
| `border.control`           | gray.500 #85838F        | gray.500 #85838F   | surface.card, 3         | Inputs, checkboxes, outlined buttons                                                          |
| `border.control-hover`     | gray.600 #5B5A66        | gray.400 #A9A7B3   | surface.card, 3         | Hover of control edges                                                                        |
| `border.subtle`            | gray.200 #E3E2DC        | gray.700 #2B2A36   |                         | Dividers; card edges in dark mode only                                                        |
| `border.strong`            | gray.900 #16151D        | gray.100 #F2F1EC   | surface.card, 3         | Emphasised edges, selected chips                                                              |
| `border.card`              | transparent transparent | gray.700 #2B2A36   |                         | Card edge: none in light, subtle in dark                                                      |
| `border.disabled`          | gray.200 #E3E2DC        | gray.700 #2B2A36   |                         | Disabled control edges                                                                        |
| `border.error`             | red.700 #B42318         | red.400 #F58A80    | surface.card, 3         | Invalid inputs                                                                                |
| `action.primary`           | gray.900 #16151D        | gray.100 #F2F1EC   | surface.canvas, 3       | One primary action per view, as an ink pill                                                   |
| `action.primary-hover`     | gray.700 #2B2A36        | white #FFFFFF      |                         | Hover of action.primary                                                                       |
| `action.primary-press`     | black #000000           | gray.200 #E3E2DC   |                         | Pressed of action.primary                                                                     |
| `action.primary-disabled`  | gray.300 #C6C5CC        | gray.700 #2B2A36   |                         | Disabled primary                                                                              |
| `action.intent`            | lime.300 #D9F66F        | lime.300 #D9F66F   | surface.canvas          | The one Intent Engine button per screen                                                       |
| `action.intent-hover`      | lime.400 #CFEF5C        | lime.400 #CFEF5C   |                         | Hover of action.intent                                                                        |
| `action.intent-press`      | lime.500 #BFE23F        | lime.500 #BFE23F   |                         | Pressed of action.intent                                                                      |
| `action.destructive`       | red.700 #B42318         | red.400 #F58A80    | surface.canvas, 3       | Destructive actions, confirmed by a dialog                                                    |
| `action.destructive-hover` | red.800 #770602         | red.300 #FEA69D    |                         | Hover of action.destructive                                                                   |
| `action.destructive-press` | red.900 #4F0B06         | red.500 #E06B5F    |                         | Pressed of action.destructive                                                                 |
| `selection.bg`             | violet.50 #F4EEFD       | violet.950 #2A2140 |                         | Selected ground; same as surface.selected                                                     |
| `selection.fg`             | violet.700 #6B22B0      | violet.400 #B07FEE | selection.bg, 4.5       | Text and icon on selection.bg                                                                 |
| `focus.ring`               | gray.900 #16151D        | gray.100 #F2F1EC   | surface.canvas, 3       | 2 px ring with a 2 px gap, on any ground                                                      |
| `focus.offset`             | gray.50 #F4F4F0         | gray.900 #16151D   |                         | The gap colour between ring and control                                                       |
| `brand.signature`          | lime.300 #D9F66F        | lime.300 #D9F66F   |                         | Mark dot, one highlight plane; never text on light ground                                     |
| `brand.ink`                | gray.900 #16151D        | gray.900 #16151D   | brand.signature, 4.5    | Ink on the signature                                                                          |
| `feedback.success.fg`      | green.700 #0B6E4F       | green.400 #5CC9A3  | surface.canvas, 4.5     | Success text, icon                                                                            |
| `feedback.success.surface` | green.50 #EAF9F3        | green.950 #072016  |                         |                                                                                               |
| `feedback.success.border`  | green.300 #83D4B5       | green.700 #0B6E4F  |                         |                                                                                               |
| `feedback.warning.fg`      | amber.700 #B54708       | amber.400 #F0A060  | surface.canvas, 4.5     | Warning text, icon                                                                            |
| `feedback.warning.surface` | amber.50 #FFF2E9        | amber.950 #300F02  |                         |                                                                                               |
| `feedback.warning.border`  | amber.300 #F2B180       | amber.700 #B54708  |                         |                                                                                               |
| `feedback.danger.fg`       | red.700 #B42318         | red.400 #F58A80    | surface.canvas, 4.5     | Errors, destructive                                                                           |
| `feedback.danger.surface`  | red.50 #FFF0EE          | red.950 #2F0503    |                         |                                                                                               |
| `feedback.danger.border`   | red.300 #FEA69D         | red.700 #B42318    |                         |                                                                                               |
| `feedback.info.fg`         | blue.700 #0C55AB        | blue.300 #7FB3F5   | surface.canvas, 4.5     | Info text, icon; reads at body size                                                           |
| `feedback.info.surface`    | blue.50 #ECF6FF         | blue.950 #071A35   |                         |                                                                                               |
| `feedback.info.border`     | blue.300 #7FB3F5        | blue.700 #0C55AB   |                         |                                                                                               |

Ratios recorded elsewhere in this file were computed from these values. `surface.scrim` is used at `opacity.scrim`; `border.card` is transparent in light so cards sit on the canvas without an edge (mood E) and takes `border.subtle` in dark where card on canvas is only 1.1.

### 3.2 Primitives behind the names

`primitives.json` holds seven colour ramps of twelve steps (25 to 950) for gray, violet, lime, red, amber, green, and blue, anchored on the brand spec v1.1 values and interpolated in OKLCH, plus the radius, space, size, font, shadow, blur, opacity, duration, easing, breakpoint, and z scales. Primitives carry no meaning; a page or component that references `--op-*` directly fails the gate. Storybook renders every ramp under Foundations › Primitives with the best contrast ink or white reaches on each step.

### 3.3 Shape, space, size, type, motion (semantic, from `semantic.json`)

| Group   | Tokens                                                                                                                                                                                                                                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius  | `shape.control.radius` 999 (pill), `shape.media.radius` 12, `shape.container.radius` 16, `shape.overlay.radius` 24                                                                                                                                                                                                         |
| Depth   | Flat: no shadow in the shell. Light: cards sit on the canvas with no border. Dark: `border.subtle` marks card edges (card on canvas is 1.1). Glass only on floating layers (toolbar over a preview, command palette, toasts) with a solid fallback; a soft lime glow (radial, 35% light, 14% dark) at most once per screen |
| Space   | 8-px scale: `space.1` 4, `space.2` 8, `space.3` 12, `space.4` 16, `space.6` 24, `space.8` 32, `space.12` 48                                                                                                                                                                                                                |
| Size    | `size.control.min-height` 40 (sm 32, lg 48), `size.touch` 44 minimum on touch surfaces                                                                                                                                                                                                                                     |
| Motion  | `motion.feedback.duration` 120 ms, `motion.overlay.duration` 200 ms, `motion.page.duration` 320 ms, one ease-out, `prefers-reduced-motion` removes all non-essential motion                                                                                                                                                |
| Density | `comfortable` (default) and `compact` (row block 8 instead of 12); a profile may set one, a page may not                                                                                                                                                                                                                   |

Controls are pills; rectangular shapes grow with their level: media 12 inside a container 16 inside an overlay 24. One radius for every level is anti-pattern 3 (§9). Numerals in a bento tile use the body face at weight 600 with letter-spacing -0.02em on Latin digits only, never on Thai.

## 4. Typography, Thai and Latin together

| Role    | Family stack                                                   | Weights       | Size / line-height     |
| ------- | -------------------------------------------------------------- | ------------- | ---------------------- |
| Display | `"Anuphan", "IBM Plex Sans Thai", system-ui, sans-serif`       | 600, 700      | 56/1.2 and 32/1.25     |
| Body/UI | `"IBM Plex Sans", "IBM Plex Sans Thai", system-ui, sans-serif` | 400, 500, 600 | 20/1.5, 16/1.7, 14/1.6 |
| Mono    | `"IBM Plex Mono", ui-monospace, monospace`                     | 400, 500      | 14 / 1.6               |

Rules (from the specimen run, brand spec §6 and §8):

- Loopless Thai (Anuphan) at 24 px and above; looped (Plex Sans Thai) below. Tone marks need the 1.2 line-height at display size.
- No letter-spacing and no text-transform on Thai, ever. Latin eyebrows in tracked caps are anti-pattern 5.
- A mixed line takes the body line-height; Thai must not look smaller or lighter than the Latin beside it.
- Fixture content for every component includes Thai, Latin, a long Thai name without spaces, and a missing value.
- Fonts load self-hosted from `apps/web` (OFL); no runtime fetch from Google Fonts in product code.

## 5. Layers: where a value may live

| Layer           | Contains                                                                                           | Who may add                             |
| --------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Primitive       | `primitives.json`, CSS `--op-*`: palette steps, radius, space, duration                            | Token story; never a page               |
| Semantic        | `semantic.json`, CSS `--ds-*`: §3 names, per mode; references primitives only                      | Contract change (L lane, impact list)   |
| Component token | `component.json`, CSS `--cmp-*`: one name per slot (`button.primary.bg`); references semantic only | The component's story, with the reason  |
| Recipe          | Which token each slot/state uses; surface depth, edge, motion                                      | Recipe story; proven under ≥ 2 profiles |
| Component       | Behavior, props, states; consumes recipe classes                                                   | Component story + catalog entry         |
| Page/pattern    | Composition from components; layout utilities only                                                 | Feature story                           |

The three files compile to `generated.css` (`pnpm --filter @orivilo/design-system tokens`); `tokens.test.ts` fails when a layer references the wrong layer, when a semantic colour lacks a mode, or when the generated file is stale. Tailwind is allowed for layout and composition (flex, grid, gap, width). It is forbidden for colour, radius, shadow, and font values in components and pages; the lint rule from E2-0 fails the build on `bg-[#…]`, `rounded-[…]`, `shadow-…`, `font-[…]`, and raw Tailwind palette classes.

## 6. Choosing a component (handoff §15)

Order of evidence: requirement and data → catalog (`packages/design-system/catalog/`) → the entry's contract and example → the active profile → shadcn, Radix, Tailwind docs last.

| Task                                                      | Start with                          | Then check                                  |
| --------------------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| Pick one of a short list where all options should be seen | RadioGroup                          | Count and space; ≥ 6 options → Select       |
| Pick one of a long list, needs search                     | Combobox                            | Async data, empty, keyboard                 |
| On/off setting that applies immediately                   | Switch                              | Save feedback and error recovery            |
| On/off that applies on submit                             | Checkbox                            |                                             |
| Confirm a destructive action                              | ConfirmDialog pattern (ours)        | Impact text, pending, failure               |
| Secondary task without leaving the page                   | Dialog (small) or Sheet (long form) | Portal receives the profile; focus returns  |
| Compare rows of the same shape                            | Table                               | Long Thai names, missing cells, small width |
| One primary action per view                               | Button `primary`                    | Everything else `secondary` or `ghost`      |

A pattern that already exists comes before composing new base components, but only when the task matches, not when the name is close. If nothing fits, propose an extension (variant, recipe slot, or pattern) in the PR with scope and reason; do not fork a component.

Tiers (ADR 0003 item 5): **base** (controls, inputs, feedback, navigation primitives) → **application** (navigation shells, overlays, tables, empty/loading states, settings layouts) → **marketing** (sections for generated landing pages). Coverage is tracked in `packages/design-system/catalog/coverage.md`; a tier with no stable entry is reported as a gap, not implied.

## 7. State completeness

A component is complete when every state that applies has a story and a visual difference that does not rely on colour alone:

| State          | Applies to             | Must show                                                   |
| -------------- | ---------------------- | ----------------------------------------------------------- |
| default        | all                    |                                                             |
| hover          | interactive            | Edge or ink change, not a tint only                         |
| focus-visible  | interactive            | `focus.ring` 2 px + 2 px gap; never removed                 |
| active/pressed | buttons, toggles       | `action.primary-press` or equivalent                        |
| disabled       | interactive            | Reduced contrast ≥ 3.0 still; `aria-disabled` or `disabled` |
| loading        | async actions, tables  | Blocks repeat submission; announces status                  |
| selected       | options, rows, tabs    | `surface.selected` + `selection.fg`; distinct from focus    |
| invalid/error  | inputs, forms          | `feedback.danger` border and message; message says the fix  |
| empty          | lists, tables, pickers | Invites an action                                           |
| read-only      | inputs                 | Looks like text, not a disabled control                     |
| dark mode      | all                    | Same story under both modes                                 |
| profile B      | all                    | Same story under a second recipe                            |

Hover and focus stay interaction states, not public props (handoff §14). Icon-only buttons carry an accessible name.

## 8. Colour roles: meaning never moves

| Meaning           | Colour                 | Not interchangeable with     |
| ----------------- | ---------------------- | ---------------------------- |
| Act               | `action.primary` (ink) | selection, info              |
| Ask the engine    | `action.intent` (lime) | any other action, any status |
| Go somewhere      | `text.link` (violet)   | buttons                      |
| Selected          | `surface.selected`     | focus, hover                 |
| Focused           | `focus.ring` (ink)     | selection, brand             |
| Brand presence    | `brand.signature`      | any feedback, any action     |
| Wrong / dangerous | `feedback.danger`      | warning, brand               |
| Caution           | `feedback.warning`     | danger                       |
| Done well         | `feedback.success`     | brand signature              |
| Learn             | `feedback.info`        | action                       |

Proportion for the shell: about 60 canvas and card, 30 ink and neutrals, 10 violet and lime together; lime alone stays under 2. Charts and illustrations take a separate graphic palette (profile group 6 in handoff §10), never the transaction colours.

## 9. Named anti-patterns (the gate checks each)

From `.claude/skills/frontend-design/SKILL.md`, with ORIVILO's own added:

1. **Cream-serif-terracotta** and **near-black-with-acid-accent** as a default look. Mood E keeps ink actions and one lime button on a light canvas; in dark mode lime stays at one button and one bead and the glow at 14%, which is the line between the brand and this tell.
2. **Broadsheet**: hairlines, zero radius, dense columns, for a tool that needs air.
3. **Card kit**: every block a rounded card with the same radius and the same soft shadow.
4. **Template chrome**: tracked ALL-CAPS eyebrows, middle-dot meta strings, "WORD, dash, fragment" labels, tinted near-black for black, monospace for small labels, arrows on every link.
5. **One accented word** in a headline; labels above content that add nothing.
6. **Ambient motion**: fade-and-slide on every section, hover transitions on every card.
7. **Numbered markers** on content that is not a sequence.
8. **Lime as status or text**, violet as a tint, focus ring removed or recoloured.
9. **Thai set with Latin rules**: tracking, caps transform, 1.1 line-height, Thai visibly smaller than Latin on the same line.
10. **Studio style in the preview**: the shell's violet or lime appearing inside a customer preview frame.
11. **Fake evidence**: badge, rating, count, success state, or "AI-generated" claim without data or implementation.
12. **Per-page mood patch**: a hex, radius, or font value in a page or component to make one screen feel different.

## 10. Writing in the UI

**Hard rule (owner, 2026-10-21): no middot (·) and no em dash (—) anywhere in UI text.** Not in labels, meta lines, breadcrumbs, captions, generated copy, or Storybook docs. Separate with a comma, a colon, a slash with spaces, or a line break. The copy check in E2-0 fails the build on either character in a component, story, or message file.

Sentence case. A button says what happens ("บันทึกการเปลี่ยนแปลง", "Save changes") and keeps its name through the flow. An error says what went wrong and how to fix it. An empty state invites the next action. No jargon in user copy (API, endpoint, token are developer words). Thai copy on a screen is reviewed by reading it aloud; if it sounds translated, rewrite it.

## 11. Design gate (blocks G3 for any PR that touches UI)

The reviewer records each line as pass, fail, or not applicable, with the story id or screenshot as evidence. Any fail blocks.

- [ ] Every visual value comes from a semantic token or a recipe; lint passes with zero raw colour, radius, shadow, or font classes.
- [ ] Every applicable state in §7 has a story; focus-visible is present and distinct from selected.
- [ ] Stories render under light and dark, and under at least two recipes, without layout change.
- [ ] Contrast on the real pairs used, in every mode, meets text ≥ 4.5 and UI ≥ 3.0 (script output attached, not eyeballed).
- [ ] Fixture content includes Thai and Latin, a long Thai name, and a missing value; nothing clips or overflows at 360 px width.
- [ ] Keyboard path works end to end; icon-only controls have names; a11y addon reports zero violations.
- [ ] Overlays rendered through a portal receive the same profile as their trigger (from E2-5 onward).
- [ ] The catalog entry exists, its `status` matches reality, and its `story` id resolves.
- [ ] Walked §9: each tell either absent or justified in the PR description in one line.
- [ ] Nothing claims AI interpretation, Figma sync, accessibility, or export beyond what is implemented and tested.
- [ ] Thai copy reads as Thai.
- [ ] No middot or em dash in any UI string (copy check passes).

## 12. What is real today

| Item                                                             | Status                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Brand values in §3–§4                                            | Hypothesis v1.1 plus mood E; similarity, lineup, print tests open                                 |
| Three-layer token files, generated CSS, layer and contrast tests | Real: E2-1 (`src/tokens/source/*.json`, Foundations pages Primitives, Semantic, Component tokens) |
| Mood E in Storybook                                              | Tokens only; the `airy` recipe and a bento example page are planned: E2-2, E2-7                   |
| Dark `surface.selected`, dark feedback values                    | Placeholder until E0-5 computes them                                                              |
| `packages/design-system`, Storybook, lint rule                   | Real: E2-0 slice B (tokens, Foundations, checks)                                                  |
| Neutral profile for the shell                                    | Planned: E2-3                                                                                     |
| Button, Input, Select, Checkbox                                  | Planned: E2-4                                                                                     |
| `DesignProfileBoundary`, portal scope                            | Minimal attribute-only boundary (E2-0); real: E2-3, E2-5                                          |
| Catalog page examples per tier                                   | Planned: E2-7                                                                                     |
| Contrast check in CI                                             | Planned: E0-5                                                                                     |

Change log: v1.2 (2026-10-21) replaces the hand-written §3.1 and §3.2 with the three-layer token source (primitive, semantic, component) and its snapshot; value changes against v1.1 from the ramps: `text.tertiary` and `text.placeholder` to gray.600/gray.400 (placeholders must read at 4.5), `border.control` dark to gray.500 (4.5 on card), `action.primary-hover` to gray.700, dark `action.primary-press` to gray.200, `feedback.info.fg` to blue.700 (reads at body size); new names: surface.raised, surface.sunken, surface.hover, surface.disabled, surface.scrim, text.tertiary, text.disabled, text.on-destructive, text.on-inverse, text.link-hover, text.brand, border.control-hover, border.strong, border.card, border.disabled, border.error, action.primary-disabled, action.destructive and its states, selection.bg, focus.offset, brand.ink, feedback._.surface and .border, shape.check, space._, size._, type._, font._, elevation._, opacity.*. v1.1 (2026-10-21) folds in the owner's mood choice (E, airy bento): ink actions, lime `action.intent`, violet `text.link`, pill controls, radii 12/16/24, flat depth with one glow, bento rule in §2 and §3.3. Impact: `action.primary`, `action.primary-hover`, `action.primary-press`, `text.on-action` change value; `action.intent`, `action.intent-hover`, `action.intent-press`, `text.on-intent`, `text.link` are new; `shape.*.radius` change value. No component consumes them yet (E2-0 Foundations only), so no code outside the token CSS and the Foundations page changes. v1.0.2 (2026-10-21) corrects two §3.1 ratios from the token source (text.secondary 6.1, brand.signature 1.1) and marks E2-0 slice B as real in §12. v1.0.1 (2026-10-21) adds the owner's no-middot, no-em-dash rule to §10 and §11. v1 (2026-10-21) created from brand spec v1.1, handoff §9–§17 and §23, ADR 0003, and the owner's rule that Storybook and this file come before any UI.
