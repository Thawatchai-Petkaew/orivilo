---
issue: ORV-240 (https://tpetkaew.atlassian.net/browse/ORV-240), the Alert slice of ORV-222 (https://tpetkaew.atlassian.net/browse/ORV-222)
lane: L (as ORV-222)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
parent: docs/specs/ORV-222/spec.md v1.3, with docs/specs/ORV-222/design.md
version: 1.0
---

# ORV-240: Alert (ORV-222 slice)

## Why

ORV-222 asks for `Alert` and the `FeaturedIcon` tile it shows, so a failed job reads the same everywhere. The full reasoning is in [the parent's Goal](../ORV-222/spec.md#goal) and applies here as written.

Open question 10 of the parent split that story into two PRs by default: FeaturedIcon first, then Alert. PR 186 carried the first half and merged into `develop` (rows 1 to 8 and the FeaturedIcon half of row 23, ORV-222 comment 10534). This issue is the second half, split out so Alert has its own acceptance, its own PR and its own qa walk (L-0016). It adds no requirement and no gate.

What is real and what is not, as the parent's Goal says it: Alert renders real markup and reads the locale catalog. The jobs in the stories are mock data, and no Studio screen shows an Alert when this story ends. No screen reader test has been run.

## Story

As a person using ORIVILO, when a job fails I see a message where the job lives that tells me what happened and how to fix it, I hear it if I use a screen reader, and I keep my place on the page, so I can fix the cause and run the job again.

## What this story uses from ORV-222 (linked, not copied)

- **Spec:** [`docs/specs/ORV-222/spec.md`](../ORV-222/spec.md) v1.3: the Alert benchmark, the Alert rows of "Contract changes and impact", the "Copy" tables, and W2 and W4 of "Worked examples".
- **Design:** [`docs/specs/ORV-222/design.md`](../ORV-222/design.md) (its `spec:` line reads v1.3): the Flow, the answer to open question 7 with C2, D5 to D14, the States table, the `alert-*` rows of the builder table, Alert's markup and type, the `.ds-alert` recipe, the `alert.*` tokens, the story notes, the `base-alert` screens to check, and the Open points.
- **Gates:** the G1 and G2 comments on ORV-222 cover this slice, and C1, C2 and C3 of design.md were accepted in ORV-222 comment 10515. G3 is raised on this issue.
- **Already on `develop` from PR 186:** `FeaturedIcon` and its `featured-icon.*` tokens, `DangerIcon`, `InfoIcon`, `expectFrameCutsNoInk`, and `featuredIconFixtures` with the four Thai and English titles.
- **Not there yet, so this story adds it:** `Alert`, `AlertProps`, `ds-alert`, the `alert.*` tokens and pairs, `alert.dismiss`, `alertFixtures`, `catalog/base/alert.yaml`, its `coverage.md` row, and the edits of `alert-use-1`.
- **Order:** the PR title starts `ORV-240: ...`.

## Acceptance criteria

Rows 9 to 23 keep their numbers from the parent at v1.3. Rows 9 to 21 keep its wording. Two rows differ, each in its Check cell only:

- Row 22 says ORV-240 where the parent says "the issue", since this is the issue the sign-off reports on.
- Row 23 is the Alert half of the parent's row: its Storybook run drops `src/components/featured-icon`, which merged in PR 186.

Everything these rows name from outside them is the parent's: design.md is `docs/specs/ORV-222/design.md`; open question 7, W2 and W4 are the parent's; D7 and D8 are design.md's. The opening paragraph of [the parent's Acceptance criteria](../ORV-222/spec.md#acceptance-criteria) gives the story id, the locale of the plays, the rule on waits, and what "the four variants" and "the six boundaries" mean.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 9 | Storybook test project, neutral, light, Thai | Alert `Variants` renders the four variants with the fixture copy | Four blocks, each with its tile, title and description, for example "สร้างหน้าแรกไม่สำเร็จ" over "ไม่พบโลโก้ในบอร์ด เพิ่มโลโก้ในโหนดแบรนด์แล้วลองอีกครั้ง"; no close and no action | None. Computed `animationName` is `none` and `transitionDuration` is `0s` on the root (`alert-look-1`) | `Variants` play: each title and description present; `expectTitleOverText(title, text, { gap: 4 })`; each title's first line within 0.5 px of the tile's centre |
| 10 | Same | Alert `LiveRoles` renders the four variants with no `live` prop | The same four blocks | None. Each root's role equals W2's default for its kind (`alert-live-1`) | `LiveRoles` play: `getAllByRole("status")` length 3, `getAllByRole("alert")` length 1, each holding its own title |
| 11 | Same | Alert `LiveRaised` renders `warning` and `info` with `live="alert"` | The two blocks, looking as in row 9 | None. Both roots have `role="alert"` | `LiveRaised` play: `getAllByRole("alert")` length 2 |
| 12 | Same | Alert `AtLoad` renders the four variants with `live="off"` | The same four blocks | None. No `role` on any root and the text is in the page (`alert-load-1`) | `AtLoad` play: `queryAllByRole("alert")` and `queryAllByRole("status")` length 0; the four titles found by text |
| 13 | Same | Alert `ContainerFirst` opens with an empty `role="alert"` container and an empty `role="status"` container; the person presses "แสดงข้อความ" | First nothing, then the `danger` block in the first container and the `success` block in the second | None. The steps of K-0165 and K-0166 hold (`alert-mount-1`): each role node is empty before the press, is the same DOM node after it and holds the message; the Alert inside has no role | `ContainerFirst` play: node identity asserted across the press, `textContent` empty before, the title inside after, one live role per container |
| 14 | Same | Alert `ArrivesLater`: the person presses "แสดงข้อความ" and a `danger` Alert mounts with its role | "สร้างหน้าแรกไม่สำเร็จ" appears and the keyboard stays on the trigger | None. `document.activeElement` is the trigger before and after; the root has no `tabindex` (`alert-focus-1`) | `ArrivesLater` play with `userEvent` and `waitFor` |
| 15 | Same | Alert `WithAction` renders the four variants with their fixture actions; the person presses "ลองอีกครั้ง" | Each block with its action under the text: "ดูผลลัพธ์", "รันอีกครั้ง", "ลองอีกครั้ง", "เปิดโหนดแบรนด์" | None. The story's `fn()` is called once | `WithAction` play: the four buttons found by name; click on "ลองอีกครั้ง"; the action's distance under the text matches `alert-look-1` to 0.5 px |
| 16 | Same | Alert `Dismissible` renders the four variants with `onDismiss`; the person presses Escape, then tabs to the `danger` close and presses Enter | Each block with a close named "ปิดข้อความนี้" at the top end corner. Escape leaves them. Enter removes the `danger` block and the keyboard lands on "งานถัดไป" | None. `onDismiss` called once (`alert-stay-1`) | `Dismissible` play: four buttons named "ปิดข้อความนี้"; the block stays after Escape; `onDismiss` count 1; the story host unmounts and focuses "งานถัดไป"; `document.activeElement` asserted; title first line and close centre within 0.5 px |
| 17 | Same, English | Alert `InEnglish` renders the four variants in the states of rows 9, 12, 15 and 16 | The same blocks with the English copy, for example "Couldn't build the home page" over "No logo found on the board. Add a logo to the brand node, then retry", the action "Retry" and the close named "Dismiss this message" | None | `InEnglish` play: the English titles, the four actions and the close name found |
| 18 | Storybook, a 360 px frame | Alert `LongAt360` renders `danger` with `fixtures.longThai` as title, `fixtureJobs.longReason.reason` as description, an action and a close | The whole title and the whole reason wrap inside the block, nothing cut, and the close stays in its corner | None. Neither element is clamped (`alert-copy-1`) | `LongAt360` play: frame `scrollWidth` not above 360; `scrollHeight` not above `clientHeight` on title and description; the title and every ancestor of it up to and including the frame have computed `overflowX` and `overflowY` `visible`; `expectLabelInkWhole` on the title, under `inVitest`, proves only that element's own box, on its clone; `expectFrameCutsNoInk(title, frame)`, under `inVitest`, proves nothing from the title up to the frame clips it, and is proven red with the overflow clause taken out and a clip restored on the title, since a clip on the frame stops outside the block's padding (D7 and D8 of design.md) and cuts no ink here; `expectLinesClear` on the description |
| 19 | Storybook test project | Alert `RecipesAndModes` renders the four variants through `Matrix` | The four blocks in the six boundaries | None. The pairs of `alert-look-1` and `fi-colour-1` pass at their floor under the six boundaries | `RecipesAndModes` play: six cells, roles counted as W4; `recipes.test.ts` proves the contrast |
| 20 | The PR head | `pnpm typecheck` and a search of the source run | Not a screen | `@ts-expect-error` lines hold for a missing `title`, a missing `description`, `variant="brand"`, `live="alert"` on `success`, `live="status"` on `danger`, and a `duration` prop; `Alert.tsx` holds no timer (`alert-stay-1`) | `pnpm --filter @orivilo/design-system typecheck` output; `grep -n -e setTimeout -e setInterval -e duration packages/design-system/src/components/alert/Alert.tsx` prints nothing |
| 21 | The PR head | `check-catalog` and the i18n checks run | Not a screen | `catalog/base/alert.yaml` (story `base-alert`, status `draft`, variants `[success, warning, danger, info]`, states `[default, with-action, dismissible, static]`, recipes neutral, professional, friendly) resolves and its rules name `alert-mount-1` and `alert-load-1`; `coverage.md` has the row; `alert.dismiss` exists in Thai and English; `toast.yaml` and `DESIGN.md` section 6 carry `alert-use-1`; the story docs say the jobs are mock; no middot or em dash | `pnpm --filter @orivilo/design-system test` output; `grep -n "Alert" packages/design-system/catalog/base/toast.yaml DESIGN.md` |
| 22 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens Alert `Variants`, `WithAction`, `Dismissible`, `LongAt360`, `RecipesAndModes` | A failed job that reads as failed without its colour, on the canvas and on a card, in both modes | None | Designer visual sign-off, its PNG paths posted as a Jira comment on ORV-240, since a sign-off has an empty `write_set` and cannot write design.md; the answer to open question 7 in design.md |
| 23 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/alert` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/tokens`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows that render nothing

- Rows: 20, 21, 23

Row 20 is a type check and a source search, row 21 is catalog and copy checks, and row 23 is test runs.

## Rows per PR

One PR is planned for rows 9 to 23. The main session adds its line here, in the form `qa-scope-1` reads, with a changelog line once the PR exists.

## Rules and bounds

This story adds no rule. Each Alert rule keeps its one home in the parent's "Rules", and the list names what each one covers:

- [`alert-api-1`](../ORV-222/spec.md#alert-api-1): the public component and its props.
- [`alert-copy-1`](../ORV-222/spec.md#alert-copy-1): what the title and description say, and how they wrap.
- [`alert-live-1`](../ORV-222/spec.md#alert-live-1): the live role of each kind.
- [`alert-mount-1`](../ORV-222/spec.md#alert-mount-1): the order of role and text.
- [`alert-load-1`](../ORV-222/spec.md#alert-load-1): a message in a screen's first render.
- [`alert-focus-1`](../ORV-222/spec.md#alert-focus-1): focus.
- [`alert-stay-1`](../ORV-222/spec.md#alert-stay-1): how long an Alert stays, and closing it.
- [`alert-look-1`](../ORV-222/spec.md#alert-look-1): the recipe, its tokens and its pairs.
- [`alert-use-1`](../ORV-222/spec.md#alert-use-1): when to use Alert, Toast, Field or Dialog.

Row 19 also reads [`fi-colour-1`](../ORV-222/spec.md#fi-colour-1), a FeaturedIcon rule that PR 186 met. Alert shows that tile and changes nothing in it.

## Out of scope

- All of the parent's [Out of scope](../ORV-222/spec.md#out-of-scope), as written.
- Rows 1 to 8 and the FeaturedIcon half of row 23, which merged in PR 186.
- Any change to `FeaturedIcon`, its tokens or its glyphs.

## Open questions (with defaults)

This story opens none. Those that bear on Alert stay in the parent's [Open questions](../ORV-222/spec.md#open-questions-with-defaults), and their defaults hold:

- 1 (Alert or Toast for a failed job): default in `alert-use-1`.
- 2 (the live role of each kind): default in `alert-live-1`.
- 3 (mount order): default in `alert-mount-1`.
- 4 (a failed job on the page at load): default in `alert-load-1`.
- 7 (the Alert's ground): answered, in `alert-look-1`.
- 8 (the description on `success` and `info`): default in `alert-copy-1`.
- 10 (PR size): this issue is the second PR of its default.
- 11 (the Rows per PR lines): for this PR, see "Rows per PR" above.

## Depends on

- `docs/specs/ORV-222/spec.md` v1.3 and `docs/specs/ORV-222/design.md`, with the K-0158 to K-0170 entries, `DESIGN.md` sections and rule files listed in [the parent's Depends on](../ORV-222/spec.md#depends-on).
- The G1 and G2 comments on ORV-222; ORV-222 comment 10515 (C1, C2 and C3 accepted); ORV-222 comment 10534 (PR 186 merged).
- PR 186 (`FeaturedIcon`, `expectFrameCutsNoInk`), merged into `develop`.
- ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- L-0016 (a slice with its own issue has its own spec).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).

## Worked examples

This story derives no number and adds no method. W2 (row 10) and W4 (row 19) stay in [the parent's Worked examples](../ORV-222/spec.md#worked-examples).

## Changelog

- v1.0 (2026-11-06): slice spec split from ORV-222 spec v1.3 (L-0016). Rows 9 to 23 copied with their numbers and no new requirement; row 22 names ORV-240 for its Jira comment, and row 23 keeps its Alert half. Downstream to review: the builder envelope (rows 9 to 23, one PR), the qa envelope (the Rows per PR line once the PR exists), and the parent spec, which does not name ORV-240 yet.
