# DESIGN.md: ORIVILO (agent-readable, v1)

Read this before any UI work: a Studio screen, a shared component, a story, a recipe, a preview, or a review of generated output. It is the design contract the `frontend-design` skill critiques against and the **design gate** (§11) that blocks G3. Rules that enforce it live in `.claude/rules/design-system.md`; the component registry lives in `packages/design-system/catalog/`.

Status, so nobody over-reads this file: the values in §3–§5 are ORIVILO's brand v1.1 **hypothesis** (`docs/context/brand/orivilo-brand-spec-v1.1.md`, tests still open in its §8). No shared component, recipe, or Storybook exists yet; `apps/web/app/globals.css` holds three placeholder tokens. Each "planned" item names the backlog story that makes it real (`docs/specs/backlog-draft.md`).

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
- **Spend boldness once.** Lime is the signature; it appears as a bead, a highlight, or a single plane, never as body text on light ground and never as a status colour. Violet does the work of action. Everything else is ink and canvas.
- **Honest UI.** Rule-based behavior is labelled rule-based. Mock data is labelled mock. No trust badge, rating, discount, countdown, or success state without backing data (`AGENTS.md`).
- **Words are design.** Sentence case, plain verbs, from the user's view, in the user's language. Thai copy is written as Thai, never translated word by word.

## 3. Semantic tokens (the contract)

Naming: token path `group.role` ⇔ CSS custom property `--ds-group-role` ⇔ Tailwind utility `bg-surface-canvas` / `text-text-secondary` through `@theme`. Components and pages use these names only. shadcn's variable set (`--primary`, `--ring`, …) is an adapter target inside recipes (ADR 0003) and never appears in a profile, a story, or a page.

### 3.1 Colour, light mode (sRGB; ratios from the brand spec, computed 2026-10-21)

| Token                  | Value   | Use for                                                           | Never for                                       |
| ---------------------- | ------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| `surface.canvas`       | #F4F4F0 | Page background                                                   | Cards stacked on cards                          |
| `surface.card`         | #FFFFFF | Content containers, inputs, menus                                 | Full-page background                            |
| `surface.selected`     | #F4EEFD | Selected row, chosen option, active nav item                      | Hover (hover is a border or ink change)         |
| `surface.inverse`      | #16151D | Inverse blocks, tooltips, the dark set's canvas                   | Decorative tints                                |
| `text.primary`         | #16151D | Body, headings, values (canvas 16.4, white 18.1)                  |                                                 |
| `text.secondary`       | #5B5A66 | Supporting text, meta, placeholders (canvas 6.2)                  | Primary content                                 |
| `text.on-action`       | #FFFFFF | Text and icons on `action.*` surfaces (7.3 on primary)            |                                                 |
| `action.primary`       | #7A22C7 | One primary action per view; links (as text on canvas 6.6)        | Status, selection fill, decoration              |
| `action.primary-hover` | #6B22B0 | Hover of the above                                                |                                                 |
| `action.primary-press` | #3F1366 | Pressed of the above                                              |                                                 |
| `selection.fg`         | #6B22B0 | Text and icon on `surface.selected` (7.5)                         |                                                 |
| `focus.ring`           | #16151D | 2 px ring with a 2 px gap of the surface colour, on any ground    | Replaced by brand accent or selection           |
| `border.control`       | #85838F | Inputs, checkboxes, outlined buttons (white 3.7, canvas 3.4)      |                                                 |
| `border.subtle`        | #E3E2DC | Dividers, card edges; decorative only                             | The only cue of a control's edge                |
| `brand.signature`      | #D9F66F | Mark dot, one highlight plane, a selected tab's bead              | Text on light ground (1.2), status, large fills |
| `feedback.success`     | #0B6E4F | Success text/icon/border (canvas 5.7)                             |                                                 |
| `feedback.warning`     | #B54708 | Warning text/icon/border (canvas 4.9)                             |                                                 |
| `feedback.danger`      | #B42318 | Errors, destructive actions (canvas 6.0)                          |                                                 |
| `feedback.info`        | #1D6FD6 | Info at 18 px+ or bold (canvas 4.4); below that use ink plus icon |                                                 |

Feedback colours get a tint surface (`feedback.<name>.surface`) and a text pair when the first component needs them; add both in the same story, with the ratio.

### 3.2 Colour, dark mode

| Token              | Value                                                                                       | Note                                 |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| `surface.canvas`   | #16151D                                                                                     |                                      |
| `surface.card`     | #1E1D26                                                                                     |                                      |
| `surface.selected` | #2A2140                                                                                     | violet-900 tint; pair with `#B07FEE` |
| `text.primary`     | #F2F1EC                                                                                     | card 14.8                            |
| `text.secondary`   | #A9A7B3                                                                                     | 7.0                                  |
| `text.on-action`   | #16151D                                                                                     | ink on violet-400 6.1                |
| `action.primary`   | #B07FEE                                                                                     | hover #C49AF2, press #9A63E0         |
| `focus.ring`       | #F2F1EC                                                                                     | 2 px + 2 px gap                      |
| `border.control`   | #6F6D7A                                                                                     |                                      |
| `border.subtle`    | #2B2A36                                                                                     |                                      |
| `brand.signature`  | #D9F66F                                                                                     | unchanged; ink on it 15.0            |
| feedback           | lighten each hue until ≥ 4.5 on `surface.card`; values set with the contrast script in E0-5 |

Dark mode is a remap by role, not an inversion (handoff §10). `surface.selected` and the dark feedback values above are untested placeholders until E0-5 computes them; the gate requires the computed pair.

### 3.3 Shape, space, size, motion

| Group   | Tokens                                                                                                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius  | `shape.control.radius` 6, `shape.container.radius` 10, `shape.media.radius` 14, `shape.overlay.radius` 22                                                                   |
| Space   | 8-px scale: `space.1` 4, `space.2` 8, `space.3` 12, `space.4` 16, `space.6` 24, `space.8` 32, `space.12` 48                                                                 |
| Size    | `size.control.min-height` 40 (sm 32, lg 48), `size.touch` 44 minimum on touch surfaces                                                                                      |
| Motion  | `motion.feedback.duration` 120 ms, `motion.overlay.duration` 200 ms, `motion.page.duration` 320 ms, one ease-out, `prefers-reduced-motion` removes all non-essential motion |
| Density | `comfortable` (default) and `compact` (row block 8 instead of 12); a profile may set one, a page may not                                                                    |

Radius expresses hierarchy: controls are tighter than containers, containers tighter than overlays. One radius for every level is anti-pattern 4 (§9).

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

| Layer           | Contains                                                        | Who may add                             |
| --------------- | --------------------------------------------------------------- | --------------------------------------- |
| Primitive       | Scales: palette steps, radius, space, duration                  | Token story; never a page               |
| Semantic        | §3 names, per mode                                              | Contract change (L lane, impact list)   |
| Component token | `button.primary.bg` only when a semantic name cannot express it | The component's story, with the reason  |
| Recipe          | Which token each slot/state uses; surface depth, edge, motion   | Recipe story; proven under ≥ 2 profiles |
| Component       | Behavior, props, states; consumes recipe classes                | Component story + catalog entry         |
| Page/pattern    | Composition from components; layout utilities only              | Feature story                           |

Tailwind is allowed for layout and composition (flex, grid, gap, width). It is forbidden for colour, radius, shadow, and font values in components and pages; the lint rule from E2-0 fails the build on `bg-[#…]`, `rounded-[…]`, `shadow-…`, `font-[…]`, and raw Tailwind palette classes.

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

| Meaning           | Colour             | Not interchangeable with |
| ----------------- | ------------------ | ------------------------ |
| Act               | `action.primary`   | brand signature, info    |
| Selected          | `surface.selected` | focus, hover             |
| Focused           | `focus.ring` (ink) | selection, brand         |
| Brand presence    | `brand.signature`  | any feedback, any action |
| Wrong / dangerous | `feedback.danger`  | warning, brand           |
| Caution           | `feedback.warning` | danger                   |
| Done well         | `feedback.success` | brand signature          |
| Learn             | `feedback.info`    | action                   |

Proportion for the shell: about 60 canvas and card, 30 ink and neutrals, 10 violet and lime together. Charts and illustrations take a separate graphic palette (profile group 6 in handoff §10), never the transaction colours.

## 9. Named anti-patterns (the gate checks each)

From `.claude/skills/frontend-design/SKILL.md`, with ORIVILO's own added:

1. **Cream-serif-terracotta** and **near-black-with-acid-accent** as a default look.
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

| Item                                           | Status                                                |
| ---------------------------------------------- | ----------------------------------------------------- |
| Brand values in §3–§4                          | Hypothesis v1.1; similarity, lineup, print tests open |
| Dark `surface.selected`, dark feedback values  | Placeholder until E0-5 computes them                  |
| `packages/design-system`, Storybook, lint rule | Planned: E2-0                                         |
| Neutral profile for the shell                  | Planned: E2-3                                         |
| Button, Input, Select, Checkbox                | Planned: E2-4                                         |
| `DesignProfileBoundary`, portal scope          | Planned: E2-3, E2-5                                   |
| Catalog page examples per tier                 | Planned: E2-7                                         |
| Contrast check in CI                           | Planned: E0-5                                         |

Change log: v1.0.1 (2026-10-21) adds the owner's no-middot, no-em-dash rule to §10 and §11. v1 (2026-10-21) created from brand spec v1.1, handoff §9–§17 and §23, ADR 0003, and the owner's rule that Storybook and this file come before any UI.
