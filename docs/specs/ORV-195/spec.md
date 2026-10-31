---
issue: ORV-195 (https://tpetkaew.atlassian.net/browse/ORV-195)
parent: ORV-118 (https://tpetkaew.atlassian.net/browse/ORV-118), slice B
parent_spec: docs/specs/ORV-118/spec.md v1.3
tech_notes: docs/specs/ORV-118/tech.md (spec: v1.3)
lane: L, the parent's lane (ORV-118 front matter)
mode: POC mode (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
gates: G1 and G2 passed on the parent, ORV-118 comment 10289 (Claude under the owner's delegation, ADR 0012 decision 4)
---

# ORV-195: the ORIVILO logo in the app (ORV-118 slice B)

This is the slice spec that L-0016 asks for (`.claude/skills/ovl/SKILL.md`, step 2). It copies the parent's slice B rows with their numbers and adds no requirement. Every rule a row names (`logo-name-1`, `logo-space-1`, `logo-icon-1`, `logo-asset-1`, `logo-size-1`, `logo-colour-1`) has its one home in the parent spec, section "Rules"; the worked examples W4 and W7 that rows 14, 19 and 20 cite are in the parent spec, section "Worked examples". Where develop has moved a number since the parent was written, the row keeps the parent's text and the change is listed under "Changed since the parent".

## Acceptance criteria

Rows 12 to 22 of the parent spec (`docs/specs/ORV-118/spec.md` lines 28 to 38), copied unchanged.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect |
| --- | --- | --- | --- | --- |
| 12 | Any app page, locale Thai, width 1280 px, light mode | The page loads | The horizontal lockup at height 24 at the start of the main menu, before "สตูดิโอ" and "บัญชี"; the 8 px dot and the text "ORIVILO" beside it are gone | None. The link to `/` is named "ORIVILO หน้าแรก"; the Logo inside it is decorative (`logo-name-1`) |
| 13 | The same page, locale English, dark mode | The page loads | The same lockup before "Studio" and "Account", coloured for dark mode | None. The link to `/` is named "ORIVILO home" |
| 14 | Any app page at 360 px, Thai and English | The header is measured | The lockup whole, no horizontal scroll, and no other element inside its clear space (`logo-space-1`, W4) | None. A scripted Playwright run on a production build (`webapp-testing`) measures the bounding boxes; its output goes in the slice B G3 packet |
| 15 | `/account` signed out, locale Thai | The page loads | The stacked lockup at height 80 above the heading "บัญชีและเวิร์กสเปซ", and the button "ลงชื่อเข้าใช้ด้วย Google" below | None. The lockup is an image named "ORIVILO" |
| 16 | `/account` in the signed-in view and in the not-configured view, locale English | The page loads | The same stacked lockup above the heading "Account and workspace" | None |
| 17 | A browser with a light tab bar (`prefers-color-scheme: light`) | Any app page opens | The tab shows the favicon form `logo-icon-1` gives for a light scheme | The document head has `<link rel="icon" type="image/svg+xml">` pointing at the generated SVG |
| 18 | A browser with a dark tab bar (`prefers-color-scheme: dark`) | Any app page opens | The tab shows the same SVG in its dark-scheme form (`logo-icon-1`) | Same file as row 17 |
| 19 | A browser that does not render SVG favicons | It requests the PNG icon | The 32 px app icon form (`logo-icon-1`, W7) | The head has `<link rel="icon" type="image/png" sizes="32x32">`; the file is 32 by 32 |
| 20 | iOS "Add to Home Screen" | It requests the touch icon | The 180 px app icon form (`logo-icon-1`, W7) | The head has `<link rel="apple-touch-icon" sizes="180x180">`; the file is 180 by 180 |
| 21 | A token value or the geometry changes and the generated assets are not regenerated | `pnpm test` runs | Not a screen | A test fails and names the stale asset (`logo-asset-1`) |
| 22 | Storybook opens | The manager sidebar renders | The horizontal lockup image at height 24 in the sidebar header, in the form `logo-size-1` and `logo-colour-1` give for 24 px, light mode | `.storybook/manager.ts` sets `brandTitle` "ORIVILO" and `brandImage` to the generated asset |

The copy these rows show is the parent spec's "Copy" table: `app.home`, `account.heading` and `account.signInWithGoogle` already exist in `apps/web/i18n/messages.ts` (Thai lines 14, 84 and 86; English lines 201, 274 and 277), and `brandTitle` is one name in `.storybook/manager.ts`, not UI copy.

## Rows per PR

The slice B PR (no number yet) carries rows 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22. The main session adds the line `- PR <n>: rows 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22` here once the PR exists (open question 1). Until then the qa result recorder reads every row of the table above, which is the same set of rows.

## Why

ORIVILO shows its name in the app header today as an 8 px dot and a line of text (`apps/web/app/layout.tsx` lines 37 to 41). Slice A (PR 165, merged) built the `Logo` component, its tokens, recipe, catalog entry and stories, so a designer can read the logo in Storybook. Slice B puts that component where a person meets the product: the app header, `/account`, the browser tab, a home screen icon and the Storybook sidebar. The business intent is the parent's (parent spec, section "Why"): the logo renders correctly wherever the product shows itself, and nothing here serves marketing (POC focus is function, owner, 2026-10-26).

Nothing in this slice is simulated or mocked: the header and `/account` render the real `Logo`, and the favicon, app icons and Storybook image are generated from the same drawing function and token source (`logo-asset-1`). Two limits are stated so nobody reads more into the evidence:

- The browser halves of rows 17 and 18 are the favicon file rendered under each colour scheme in headless Chromium, not a real browser tab; the designer checks one real tab per scheme at visual sign-off (tech notes, section 7, "R2 output").
- The mark is not a cleared trademark: `logo-screen-1` keeps a release that carries it off production until the screening record is on ORV-118.

## Story

As a person using ORIVILO, I see the ORIVILO logo in the app header and on the sign-in page, in my browser tab and on my home screen, in light and dark mode, and a designer sees it in the Storybook sidebar.

## Build order

The build order is the parent's tech notes, section 8 (`docs/specs/ORV-118/tech.md` lines 415 to 439), slice B tasks. Each task's deliverable, files and tests live there; this list only maps the tasks to the rows above.

1. B1, the asset module, the `logo-assets` command, the generated files and the freshness test (tech notes, section 5): rows 17 to 21, file halves. Needs slice A merged.
2. B2, the header lockup in `apps/web/app/layout.tsx`: rows 12 and 13, markup. Needs slice A merged; runs beside B1.
3. B3, the `/account` lockup in `apps/web/app/account/page.tsx`: rows 15 and 16. Needs slice A merged; runs beside B1.
4. B4, the Storybook brand (`.storybook/main.ts`, `.storybook/manager.ts`): row 22. Needs B1.
5. R2, the evidence run on a production build and the contact sheet (`logo-render-1`): rows 12 to 20 and 22 in the browser, row 14 measured. Needs B1 to B4.

Slice B was estimated at about 490 changed lines plus two generated PNG files (tech notes, section 9), over the 400-line guide; the parent's Story section, paragraph "Size", keeps it one PR with the review sized to it (ORV-146).

## Changed since the parent

What develop at `18763ee` has changed in a parent row or a tech notes number since they were written. No text of rows 12 to 22 changes; each item below names its source line.

1. The dot radius. ORV-192 row 5 (`docs/specs/ORV-192/spec.md` line 32) set the mark's dot to radius 19 drawing units in every form (16, 24 and master). Develop carries it in `packages/design-system/src/components/logo/geometry.ts` line 87 (`GEOMETRY.mark.dot.r` 19) and lines 151 to 155 (`DOT_RADIUS` 19 for each form), and the drawing reads `DOT_RADIUS[form]` (`drawing.ts` line 50). The parent spec already says radius 19 in `logo-geometry-1` (line 82), `logo-size-1` (line 92), row 3 (line 19) and W2 (line 167), still at version 1.3, with no changelog line for that edit. For slice B it means the favicon, both app icons and the Storybook image (rows 17 to 22) draw the dot at radius 19 in their forms.
2. Tech notes line 368: "the dot at height 16, with a radius of 1.6 px" is the radius-15 value. At radius 19 it is 2.03 px (worked example WB1). The conclusion on that line, that the dot is wider than the 1.41 px pixel diagonal, still holds. This is a slice A probe note; no slice B task reads it.
3. Tech notes line 403 (row 21): "With the dot radius changed in a copy of the geometry, all four are" (stale). On develop the drawing takes the dot radius from the `DOT_RADIUS` constant, not from the `geometry` argument that `logoAssetFiles(set, geometry)` passes on (`drawing.ts` lines 34 to 51 and 87 to 90). A copy of `GEOMETRY` with a changed `mark.dot.r` therefore leaves every asset fresh, and that case of row 21 would not go red as written (open question 2).
4. `docs/specs/ORV-118/design.md` lines 139, 145 and 146 still record the earlier change, the dot as wide as the stroke (`DOT_RADIUS` 17, 16 and 15), which ORV-192 row 5 superseded (parent spec line 92 says so). No slice B task reads them.
5. ORV-192 row 19 (`docs/specs/ORV-192/spec.md` line 46) gave every `text-display-md` line a 16 px top padding, the `/account` heading included (`apps/web/app/account/page.tsx` line 56). Rows 15 and 16 keep their text: the stacked lockup still sits above the heading, with more space between them. No number in rows 12 to 22 changes.

## Out of scope

The parent's "Out of scope" holds for this slice. Also out of scope here: rows 1 to 11 (slice A, PR 165), and any change to the `Logo` component, its tokens, its recipe or its catalog entry.

## Open questions (option, impact, default)

1. The Rows per PR line. The PR number does not exist while this spec is written, and the recorder treats a `- PR` line without a number as malformed. Default: the main session adds `- PR <n>: rows 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22` when it opens the PR; the parent spec's own line for slice B (parent line 44) gets the same line in that edit.
2. Row 21's radius case (Changed since the parent, item 3). Options: (a) the case changes the radius the drawing reads, `DOT_RADIUS`, through the generator's inputs; (b) the drawing reads `geometry.mark.dot.r` for the master and a per-form value from the geometry argument. Impact: (b) changes slice A code. Default: (a), decided by `ds-architect` in the tech notes before B1, or else the B1 builder reports the change from tech notes line 403 as a deviation.
3. Row 21 shows "Not a screen", and the parent has no "Rows that render nothing" section. Default: none is added here; qa records row 21 from the freshness test.

## Depends on

- `docs/specs/ORV-118/spec.md` v1.3: rows 12 to 22, the rules each row names, the Copy table, W4 and W7, Out of scope.
- `docs/specs/ORV-118/tech.md`: section 5 (assets, rasteriser, freshness test, Storybook brand), section 7 (tests by row, R2 setup and output), section 8 (build order), section 12 risks 1 and 2 (PNG bytes across platforms, local cache), section 13 (the violet dot; "Slice B adds no task").
- ORV-118 comment 10289: G1 and G2 on the parent; comment 10336 (the owner's violet dot) and comment 10338 (the delegated decisions on it).
- `docs/specs/ORV-192/spec.md` rows 5 and 19.
- ADR 0012 (Jira states, decision 4 on the delegated gates), ADR 0013 (the qa approve on a code PR), ADR 0003 (Storybook and the catalog).
- L-0016 (a slice issue gets its own short spec), L-0019 (renders before review, designer sign-off).

## Worked examples

None is run here (no shell in this role); it runs from the repo root.

WB1. Changed since the parent, item 2: the dot's rendered radius at height 16, from radius 19 (`geometry.ts` lines 87 and 152) and the 150-unit mark box (`geometry.ts` line 77), beside the radius-15 value tech notes line 368 gives. Rounded to 2 decimals. Expected: `2.03 1.60`.

```bash
node -e 'console.log((19*16/150).toFixed(2),(15*16/150).toFixed(2))'
```

## Changelog

- v1.0 (2026-11-01): first version, the slice B spec of ORV-118 (L-0016), from parent spec v1.3 rows 12 to 22 and tech notes section 8 at develop `18763ee`. Downstream to review: the slice B builder envelopes B1 to B4 and R2 (B1 against open question 2), the qa envelope (rows 12 to 22), the parent spec's Rows per PR line, and tech notes lines 368 and 403.
