---
issue: ORV-249 (https://tpetkaew.atlassian.net/browse/ORV-249), the Switch slice of ORV-221 (https://tpetkaew.atlassian.net/browse/ORV-221)
lane: L (as ORV-221)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
parent: docs/specs/ORV-221/spec.md v1.3, with docs/specs/ORV-221/design.md
version: 1.1
---

# ORV-249: Switch (ORV-221 slice)

## Why

ORV-221 asks for two controls the design system does not have: `RadioGroup`, to pick one of a short list with every option in view, and `Switch`, to turn a setting on or off with immediate effect. The full reasoning is in `docs/specs/ORV-221/spec.md`, section "Goal", and applies here as written.

Open question 6 of the parent split that story into two PRs by default, and ORV-221 comment 10512 settled it on that default: RadioGroup with `Field group` first, then Switch with `Field orientation`. PR 187 carried the first half and merged into `develop` (rows 1 to 20 and row 40). This issue is the second half, split out so Switch has its own acceptance, its own PR and its own qa walk (L-0016). It adds no requirement and no gate.

What is real and what is not, as the parent's Goal says it: Switch renders real markup and behaviour, and it saves nothing by itself, because the caller owns the request. The `Saving` and `SaveFails` stories simulate a save with a fixture, and the settings form example still saves nothing.

## Story

As a person changing workspace settings, I flip a setting and see whether it took, so I know what the workspace does now and can try again when a save fails.

## What this story uses from ORV-221 (linked, not copied)

- **Spec:** `docs/specs/ORV-221/spec.md` v1.3: the Switch benchmark, the Switch rows of "Contract changes and impact", the `switch` list of `control-pairs-1`, the Switch rows of "Copy", and W1 and W3 of "Worked examples".
- **Design:** `docs/specs/ORV-221/design.md` (its `spec:` line reads v1.3): the Switch flow, the answers to open questions 1, 3 and 5, D6 to D20, the rule on `focusVisible` in D25, D26, the Switch table of "States", "Thai, long content, small screens, motion", recipes R2 and R3, the Switch and Field rows of the builder table, the `settings-example-1` paragraph after it, amendments A1 to A4 and A10, and the Switch, Field and settings form lines of "Screens to check in visual QA".
- **Gates:** G1 and G2 passed under the owner's delegation in ORV-221 comment 10512, and they cover this slice. G3 is raised on this issue.
- **Already on `develop` from PR 187:**
  - `RadioGroup`, `RadioGroupItem` and their types, with `packages/design-system/catalog/base/radio-group.yaml` and line 18 of `packages/design-system/catalog/coverage.md`.
  - `FieldProps.group`, `FieldControlProps.labelId`, and `labelledBy` from `useFieldControl`, in `packages/design-system/src/components/field/Field.tsx`.
  - The semantic token `shape.round.radius`, the `radio.*` tokens, the `ds-radio*` recipe classes and the `radio` pairs.
  - `radioFixtures`, and the access group with `errors.access` on the general tab of `packages/design-system/src/examples/settings-form.tsx`.
  - `DESIGN.md` section 12, which records the RadioGroup and says Switch follows.
- **Not there yet, so this story adds it:**
  - `Switch` and `SwitchProps` in `packages/design-system/src/components/switch/Switch.tsx`, with `packages/design-system/src/components/switch/Switch.stories.tsx` and the export in `packages/design-system/src/components/index.ts`.
  - `FieldProps.orientation` and its `data-orientation`, with the `Horizontal` and `HorizontalInvalid` stories in `packages/design-system/src/components/field/Field.stories.tsx` and the edits to `packages/design-system/catalog/base/field.yaml`.
  - The `switch.*` tokens in `packages/design-system/src/tokens/source/component.json`, with the regenerated `packages/design-system/src/tokens/generated.css`.
  - The recipe classes `ds-switch`, `ds-switch__track`, `ds-switch__thumb` and `.ds-field[data-orientation="horizontal"]` in `packages/design-system/src/recipes/recipes.css`, and the `switch` pairs in `packages/design-system/src/recipes/pairs.ts`.
  - The locale key `switch.saving` in `packages/design-system/src/i18n/messages/th.ts` and `packages/design-system/src/i18n/messages/en.ts`, and `switchFixtures` in `packages/design-system/src/components/fixtures.ts`.
  - `packages/design-system/catalog/base/switch.yaml` and line 19 of `packages/design-system/catalog/coverage.md`, which reads `none` today.
  - The notifications panel of `packages/design-system/src/examples/settings-form.tsx`, which replaces `fixtures.missingLabel` at lines 180 to 182 today (the parent's `settings-example-1` read lines 152 to 154 before PR 187), and the `Notifications` and `NotificationsAt360` stories in `packages/design-system/src/examples/settings-form.stories.tsx`.
  - The action row of `packages/design-system/src/examples/settings-form.tsx`, which moves from under `Tabs` into the general tab's form, by the lines named under D26 in `docs/specs/ORV-221/design.md`.
  - The Switch text of `DESIGN.md` section 12, which says Switch follows at lines 286 and 359 today, and its version line.
- **Order:** the PR title starts `ORV-249: ...`.

## Acceptance criteria

Rows 21 to 39 keep their numbers from the parent at v1.3. Each row, one by one:

- Rows 21 to 36 and row 38: the parent's wording, unchanged.
- Row 37: the parent's wording, plus D26 of `docs/specs/ORV-221/design.md`: no Save or Cancel on a tab without a form. The parent takes this through A10 of that file.
- Row 39: one change, in the Check cell. It says ORV-249 where the parent says "the issue", since this is the issue the sign-off reports on.

No row drops anything: none of rows 21 to 39 names what PR 187 merged. Row 40 stays out, see S1 under "Open questions".

Everything these rows name from outside them is the parent's: rule names are headings of its "Rules", "Copy" is its copy table, W1 is its worked example, and open questions 1, 3 and 5 are its own. The rows keep the parent's short file names, so here is each one from the repo root:

- `design.md` is `docs/specs/ORV-221/design.md`.
- `catalog/base/switch.yaml` is `packages/design-system/catalog/base/switch.yaml`.
- `coverage.md` is `packages/design-system/catalog/coverage.md`.
- `recipes.test.ts` is `packages/design-system/src/recipes/recipes.test.ts`.
- `tokens.test.ts` is `packages/design-system/src/tokens/tokens.test.ts`.
- `Spinner.stories.tsx` is `packages/design-system/src/components/spinner/Spinner.stories.tsx`.
- ORV-201 `spin-motion-1` is in `docs/specs/ORV-201/spec.md`.

The opening paragraph of the parent's "Acceptance criteria" gives the story title (`Base/Switch`, id `base-switch`), the locale of the plays and the helpers a visual play uses.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 21 | Storybook test project, neutral, light, Thai | `Default` renders a `Field orientation="horizontal"` around a Switch with no `defaultChecked` (the missing value), and the play clicks the label, then the description | "แจ้งเตือนเมื่อมีความเห็นใหม่" (Notify me about new comments) over "ส่งอีเมลเมื่อมีคนแสดงความเห็นในโปรเจกต์ของคุณ" (Sends an email when someone comments on your project), the Switch at the end of the line; the thumb moves on the label click and stays on the description click | `aria-checked` `true` after the label click, unchanged after the description click (`switch-keys-1`, `field-row-1`) | `Default` play: `getByRole("switch", { name })`, `toHaveAccessibleDescription`, both clicks |
| 22 | Same | `Keyboard` renders, and the play presses Tab, Space, Enter | The focus ring, then the thumb moves on each key | `aria-checked` flips on Space and again on Enter (`switch-keys-1`) | `Keyboard` play |
| 23 | Same | `FixedLabel` renders, and the play toggles | The label stays "แจ้งเตือนเมื่อมีความเห็นใหม่" (Notify me about new comments) | None. The accessible name is identical in both states (`switch-label-1`) | `FixedLabel` play compares the name before and after |
| 24 | Same | `Sizes` renders `sm` and `md`, off and on | Two switches of each size, the thumb at the start when off and at the end when on | None. Track, thumb and thumb travel equal W1's `md` and `sm` lines to 0.5 px; the `sm` target equals `switch.target-min` | `Sizes` play: boxes by `getBoundingClientRect`, travel as the thumb's `left` on minus off; target by `elementFromPoint` |
| 25 | Same | `InteractionStates` renders rest, hover, pressed and focus, off and on | Hover changes the ink or the edge, pressed changes the track, focus shows the brand line with its halo | None (`control-tokens-1`) | `InteractionStates` play: `parameters.pseudo` for hover and active, computed `backgroundColor` or `borderColor` against rest, `expectFocusBorderForm` on both focus rows |
| 26 | Same | `Disabled` renders off and on, and the play clicks both | Disabled ink, the thumb at the start and at the end, nothing moves | None. Each `toBeDisabled`; `.ds-switch` computed `opacity` 1 (`control-disabled-1`) | `Disabled` play, with the thumb's `left` differing between the two |
| 27 | Same | `Invalid` renders `Field error` with `switchFixtures.saveError` | "บันทึกการตั้งค่าไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง" (We could not save this setting. Check your connection, then try again) under the row, and the error edge on the track | None. The switch has `aria-invalid="true"` and the message in its description; one `role="alert"` | `Invalid` play, with `expectEdgeInk` on the track |
| 28 | Same | `Saving` renders `checked` and `saving`, and the play clicks, then presses Space and Enter | A turning ring in the thumb, and nothing moves | `aria-checked` unchanged; `aria-busy` and `aria-disabled` `true`; focus stays on the Switch; exactly one `role="status"` holds "กำลังบันทึก" (Saving) (`switch-save-1`) | `Saving` play, with `.ds-spin` inside the thumb |
| 29 | Same | `SaveFails` renders a fixture host held by a latch; the play toggles, releases the failure, then toggles again and releases a success | The thumb moves and the ring turns; the thumb returns and the failure message shows; on the retry the message goes and the thumb stays, with no tick and no saved word | Simulated save. `aria-checked` returns to the old value, `aria-invalid="true"`, focus on the Switch; then `aria-checked` holds the new value and no `role="alert"` remains (`switch-save-1`) | `SaveFails` play with `findBy` waits, no fixed time |
| 30 | Same | `Bare` renders one Switch with `aria-label` and one with `aria-labelledby`, no `Field` | Two switches with no visible label of their own | None. Each has a name; the a11y addon reports zero violations (`switch-api-1`) | `Bare` play: `getByRole("switch", { name })` for both, with the names `switchFixtures.jobs` and `switchFixtures.comments` |
| 31 | Same | `InForm` renders a Switch with `name` `comments` in a `<form>`, and the play toggles | The thumb moves | `new FormData(form).get("comments")` is `null` off and `on` on | `InForm` play |
| 32 | Same | `ReducedMotion` renders | The thumb moves with no slide under reduced motion, and the ring keeps turning in `Saving` | None. A `prefers-reduced-motion: reduce` rule removes the transition from `.ds-switch__thumb`, and none stops `.ds-spin` (`switch-size-1`, ORV-201 `spin-motion-1`) | `ReducedMotion` play: the stylesheet walk of `Spinner.stories.tsx` lines 97 to 112 |
| 33 | Storybook, a 360 px frame | `LongContentAt360` renders `Field orientation="horizontal"` with `fixtures.longThai` as label, `fixtures.longLatin` as description and `fixtures.longThai` as error, and one with `fixtures.thaiMarks` as label | The text wraps in its column, the Switch stays at the end of the first line, no sideways scroll, no clipped Thai marks | None | `LongContentAt360` play: frame `scrollWidth` equals `clientWidth`, the Switch's right edge inside the frame, each label and every ancestor up to the frame have `overflow` visible, `expectLinesClear` on the wrapped long Thai label |
| 34 | Same as row 21, English | `InEnglish` renders Default, InteractionStates, Sizes `sm` and `md`, off and on, Disabled, Invalid, Saving and SaveFails | The English column of "Copy": "Notify me about new comments", "Saving", "We could not save this setting. Check your connection, then try again" | None. The status holds "Saving" | `InEnglish` play |
| 35 | Storybook test project | `RecipesAndModes` renders through `Matrix` | Off, on, invalid, disabled, saving and `sm` rows in six boundaries: neutral, professional, friendly, each in light and dark | None | `RecipesAndModes` play: six cells; contrast is row 38 |
| 36 | `Base/Field`, Thai | `Horizontal` renders a Switch and `HorizontalInvalid` adds an error | The row of row 21, and the error under both columns | None. DOM order label, description, control, error (`field-row-1`) | `Horizontal` and `HorizontalInvalid` plays |
| 37 | `Examples/Base: Settings form` | `Notifications` opens the members tab, then the notifications tab, and the play toggles one Switch; `NotificationsAt360` renders it in `Narrow` | "อีเมลแจ้งเตือน" (Email notifications), "การเปลี่ยนแปลงในหน้านี้มีผลทันที ไม่ต้องกดบันทึก" (Changes here apply right away, with no need to save) and two Switch rows; no "ไม่มีข้อมูล" in the tab; no "บันทึกการเปลี่ยนแปลง" (Save changes) or "ยกเลิก" (Cancel) on the members or notifications tab, because both sit in the general tab's form (D26); no sideways scroll at 360 px | None. Fixture, nothing saved. One `role="group"` named by the heading; two switches inside it (`settings-example-1`); on each of the two tabs no primary button and no button named "ยกเลิก" in the canvas | `Notifications` and `NotificationsAt360` plays; the `Notifications` play queries the action row on `canvasElement`, not on the panel (D26) |
| 38 | The PR head | `check-catalog`, the i18n checks, `recipes.test.ts`, `tokens.test.ts` and `pnpm contrast` run | Not a screen | `catalog/base/switch.yaml` resolves its story; `coverage.md` line 19 reads `draft`, `base-switch`; `switch.saving` exists in Thai and English; every `switch` pair of `control-pairs-1` passes under each set of `CONTRAST_SETS` (neutral, professional, friendly, orivilo) in both modes; no middot or em dash in either locale file | `pnpm --filter @orivilo/design-system test` and `pnpm contrast` output |
| 39 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Sizes`, `InteractionStates`, `Disabled`, `Invalid`, `Saving`, `SaveFails` and Settings form `Notifications` | A clear off and on in each profile, the ring legible in the thumb, Thai that reads as Thai | None | Designer visual sign-off, its PNG paths posted on ORV-249 as a Jira comment, since a sign-off has an empty `write_set` and cannot write design.md; the answers to open questions 1, 3 and 5 in design.md |

## Rows that render nothing

- Rows: 38

Row 38 is catalog, copy, token and contrast checks.

## Rows per PR

- PR 201: rows 21-39

## Rules and bounds

This story adds no rule. Each rule keeps its one home in the "Rules" of `docs/specs/ORV-221/spec.md`, and this list names what each one covers:

- `switch-api-1`: the public component and its props.
- `switch-use-1`: when to use Switch, Checkbox or a menu item.
- `switch-label-1`: the label across states.
- `switch-keys-1`: keyboard and clicks.
- `switch-size-1`: geometry, shape, motion and forced colours.
- `switch-save-1`: saving, failure and success.
- `field-row-1`: the horizontal `Field`.
- `control-tokens-1`: the Switch column, and the focus paragraph on an on Switch.
- `control-disabled-1`: the disabled look, in its first paragraph. Its second paragraph is the RadioGroup's.
- `control-pairs-1`: the `switch` list. It sits under "Contract changes and impact", not under "Rules".
- `state-set-1`: the Switch column.
- `no-unstable-1`: the Radix parts Switch may use.
- `settings-example-1`: the notifications tab. Its general tab merged in PR 187.

## Out of scope

- All of the parent's "Out of scope", as written.
- Rows 1 to 20 and row 40, which merged in PR 187.
- Any change to `RadioGroup`, `Field group`, their tokens or their recipe.
- The content of the members tab of the settings form, which `settings-example-1` leaves unchanged. The tab loses the action row through D26 and changes in nothing else (A10).

## Open questions (with defaults)

Three points come from slicing the parent, numbered S1 to S3 so they do not read as the parent's open questions. None adds a requirement, and each default keeps the parent's wording:

- S1. Row 40, the affected suites. The parent's "Rows per PR" gives it to PR 187, though its command names `src/components/switch`, which did not exist there. Options: (a) row 40 stays out, as this issue names rows 21 to 39; (b) the parent splits row 40 and this slice carries a Switch half, as ORV-240 did with ORV-222 row 23. Impact: under (a) no acceptance row in this slice names the affected suite run, and qa walks none. Default: (a). The run still happens through the builder's `done_when` and the G3 gate (AGENTS.md rule 3).
- S2. Row 25, the focus rows. `docs/specs/ORV-221/design.md` A6 found on the radio that `expectFocusBorderForm` focuses and then blurs, so it passes while the focus rows read as rest, and it left row 25 "until the Switch PR". Row 25's Check still names only hover and active in `parameters.pseudo`, while its "User sees" asks for the focus look. Options: (a) keep the row as written, and the builder holds the look by D25's rule, which binds any story that forces `focusVisible`; (b) the parent rewrites row 25 as it did row 8, and this slice copies that. Impact: under (a) the row's Check can go green with the focus rows at rest. Default: (a), because a change to the Check is the parent's to make.
- S3. Row 33, the frame clip. Parent v1.3 gave row 12 `expectFrameCutsNoInk(el, frame)` and left row 33 "until the Switch PR". Options: (a) keep the row as written, since its `overflow` clause and "Thai, long content, small screens, motion" in `docs/specs/ORV-221/design.md` hold the proof for it; (b) the parent adds the helper to row 33, and this slice copies that. Impact: under (a) the `fixtures.thaiMarks` label has no ink check against the frame. Default: (a).

The parent's own questions that bear on Switch are closed or held at their defaults, and none is reopened:

- 1 (the token of an on switch): closed in `control-tokens-1`.
- 2 (own label or `Field` wiring): default in `field-row-1` and `switch-api-1`.
- 3 (a saving or failed state): closed in `switch-save-1`.
- 5 (the pressed look): closed in `control-tokens-1`.
- 6 (PR size): this issue is the second PR of its default. The parent's estimate of about 900 changed lines per component stands, over the 400-line guide.

## Depends on

- `docs/specs/ORV-221/spec.md` v1.3 and `docs/specs/ORV-221/design.md`, with the K-0144 to K-0157 entries, `DESIGN.md` sections and rule files in the parent's "Depends on".
- ORV-221 comment 10512 (G1 and G2 passed; open questions 2 and 6 on their defaults).
- PR 187 (`RadioGroup`, `Field group`), merged into `develop`.
- ORV-201 (`Spinner`, `spin-motion-1`), which the saving ring shows and changes nothing in.
- ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- L-0016 (a slice with its own issue has its own spec).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).

## Worked examples

This story derives no number and adds no method. W1 (row 24) and W3 (the margin behind row 38) stay in the parent's "Worked examples".

## Changelog

- v1.0 (2026-11-07): slice spec split from ORV-221 spec v1.3 (L-0016). Rows 21 to 39 copied with their numbers and no new requirement; row 39 names ORV-249 for its Jira comment. Downstream to review: the builder envelope (rows 21 to 39, one PR), the qa envelope (the Rows per PR line once the PR exists), and the parent spec, which does not name ORV-249 yet.
- v1.1 (2026-11-07): row 37 names D26 of `docs/specs/ORV-221/design.md`, from F1 of `ORV-249-signoff-1`: the action row moves into the general tab's form, so the members and notifications tabs show no Save or Cancel. Row numbers, the other rows' wording and the Rows per PR line are unchanged. The list of what this story adds and the members line of "Out of scope" follow it. Downstream to review: the builder envelope (`settings-form.tsx` and `settings-form.stories.tsx`, by the D26 lines), the qa walk of row 37, the sign-off of row 39, and A10 for the parent spec.
