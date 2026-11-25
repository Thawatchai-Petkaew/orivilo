---
issue: ORV-308 (https://tpetkaew.atlassian.net/browse/ORV-308)
lane: S (a fix, no risk flag; the `Logo` component's public API does not change)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-308: the logo on the prototype canvas scenes is garbled in real Chrome

## Why

The owner reported on 2026-11-25, with screenshots of the Storybook story
`examples-prototype-orivilo-canvas--default` (the "04 In use" board and brandbook page 11), that the
lockup on the business card scene reads as a black blob and "olivilo". The in-use board exists to
show the real mark on real surfaces; a garbled mark there shows the brand wrongly. The goal is that
both scenes, the business card and the wall sign, show the real logo in every browser the owner
uses.

This spec is not a guard on a tool call, so the guard frame does not apply.

### Measured cause

- `scene-card.webp` and `scene-sign.webp` are blank scenes. The lockup is the inline `Logo` SVG,
  placed on the scene face by the `Scene` function of
  `packages/design-system/src/examples/orivilo-canvas.tsx` with a CSS `matrix3d` perspective
  transform (`transform: placeOnQuad(quad, face, size, imageSize)`).
- Real Google Chrome with GPU rendering draws stroked SVG paths wrongly under that perspective
  transform. Headless Chromium (software rendering, what the tests and CI use) draws them correctly,
  so no test saw the defect.
- Tried in real Chrome on the live story on 2026-11-25 (main session, Playwright with
  `channel: "chrome"`, `headless: false`): the inline SVG stays garbled with `will-change`,
  `translateZ(0)`, `backface-visibility`, `filter`, `opacity` or `isolation` on the face or its
  child, and with butt line caps or arcs redrawn as polylines. The same matrix without its
  perspective terms draws correctly, but the lockup then no longer follows the surface. The same
  lockup as an `<img>`, either a standalone SVG (data URL, colours resolved into attributes) or a
  PNG, under the same `matrix3d`, draws correctly.
- The sign scene uses the same technique. It drew correctly in that run, but it carries the same risk
  and gets the same fix.

The two scenes, from `packages/design-system/src/examples/orivilo-canvas.data.ts`:

| Piece  | Scene image  | Face (w × h) | Lockup width (share of face width) | Tone         | Mode    |
| ------ | ------------ | ------------ | ---------------------------------- | ------------ | ------- |
| `card` | `scene-card` | 350 × 200    | 0.56                               | `full`       | `light` |
| `sign` | `scene-sign` | 600 × 300    | 0.65                               | `one-colour` | `dark`  |

### What is real

- **Real once built:** the lockup on both scenes drawn as an image of the real logo drawing, made from
  the same drawing function and token colours as the `Logo` component.
- **Simulated, unchanged by this fix:** the canvas is a prototype example in Storybook. The scene
  photographs are generated blank scenes, and the lockup is laid on them in the browser; no photo
  holds a logo.

## Story

As the owner reviewing the brand in use, I want the business card and the wall sign to show the real
ORIVILO mark and the full word "orivilo" in my own Chrome, so that the in-use board shows the brand
as it is drawn.

## Acceptance criteria

The four rows are the issue's acceptance, with its numbers, split into columns; no requirement is
added. Test names are suggested; how the image is produced (a generated file or a string built from
`drawing.ts`) is the builder's choice inside row 3.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The canvas story, the "04 In use" board and brandbook page 11, both scene images present | The card and the sign scenes render | On both scenes the lockup inside the perspective face is drawn as an image of the real logo drawing, not as inline stroked SVG. The placement is unchanged: the quad, the face size, the lockup width and the tone of the table above | None. No stored data; the scene records in `orivilo-canvas.data.ts` keep their values | DOM read: each `[data-face]` of the two scenes holds an `img` of the lockup and no `svg`; `orivilo-canvas.test.ts` or the story play asserts it, with the lockup size of "Worked examples" |
| 2 | Real Google Chrome with GPU rendering, the built Storybook of the PR head | The walker opens the card and the sign at 100% zoom and at the overview zoom, on the board and on brandbook page 11 | The real mark and the full word "orivilo" on the card and on the sign, in all four views | None | Real Chrome walk, section "How row 2 is walked" |
| 3 | The PR head | The tests run | No UI | The image comes from the same drawing function (`logoSvg` in `drawing.ts`) and the same token colours as the `Logo` component, never drawn by hand. A test fails when a scene face holds an inline logo SVG again | `orivilo-canvas.test.ts` (or the story play): a scene face with an inline `svg` fails it; when the image is a committed file, `assets.test.ts` fails on a stale file |
| 4 | The stories `MissingImages`, `Default` (English) and `InThai` (Thai) | They run | The missing-image fallback of the scenes and the Thai and English stories work as before this PR; no new UI text | No copy key added or changed in either catalog | The three stories' plays pass; `check-i18n` and the copy check pass in the gate |

### How to read the rows

- "The real logo drawing" (rows 1 and 3) is the horizontal lockup drawn by `logoSvg` in
  `packages/design-system/src/components/logo/drawing.ts`, the function the `Logo` component renders
  with. `packages/design-system/src/components/logo/assets.ts` already renders files from it and the
  token source at build time; it is one route the builder may take.
- "The tone" (row 1) is per scene, from the table in "Measured cause": the card shows the `full` tone
  with the light mode colours, the sign the `one-colour` tone with the dark mode colours, as the
  inline `Logo` showed them before this PR.

## Worked examples

The lockup size that row 1 keeps: the lockup width is `lockup.width × face.w`, and its height is
`width × 150 / 663`, as `Scene` computes it today (`height={(lockupWidth * 150) / 663}`). Rounded to
two decimals for display; the test compares with the unrounded value. Not run, no shell in this role.

```bash
node -e "for (const [n,w,f] of [['card',0.56,350],['sign',0.65,600]]) { const l=w*f; console.log(n, l, (l*150/663).toFixed(2)) }"
```

Expected output:

```text
card 196 44.34
sign 390 88.24
```

## How row 2 is walked

Headless Chromium cannot show the defect, so row 2 is never proven by a CI screenshot.

1. Build Storybook from the PR head and serve the static build locally.
2. Open it with Playwright, `channel: "chrome"` (the installed Google Chrome) and `headless: false`,
   so Chrome draws with its GPU. Record the browser version the run reports.
3. Open the story `examples-prototype-orivilo-canvas--default`. On the "04 In use" board, view the
   card and the sign at 100% zoom, then at the overview zoom. Do the same on brandbook page 11.
4. In each of the four views, take a screenshot of the card and of the sign (eight screenshots).
5. Row 2 passes when every screenshot shows the mark and the full word "orivilo", with no blob and no
   missing or merged letter. A run in headless Chromium, or without the Chrome channel, does not count.

## Rows per PR

- PR 249: rows 1-4

One PR holds all four rows. 249 is the expected number of this issue's PR (the last PR is 248, a
release PR); if GitHub gives it another number, the line is corrected to it before the qa walk. A line that
names no PR of the report leaves every row in scope, which is the same rows 1 to 4.

## Rows that render nothing

- Rows: 3

Row 1's "image, not inline SVG" and row 4's "no new UI text" are read from the DOM and the gate, not
from a screenshot; the lockup that row 1 places does render.

## Out of scope

- New generated photos: the seven photos were checked on 2026-11-25 and are clean.
- Any change to the `Logo` component's public API.

## Depends on

- `packages/design-system/src/examples/orivilo-canvas.tsx` (`Scene`, `placeOnQuad`) and
  `packages/design-system/src/examples/orivilo-canvas.data.ts` (the `card` and `sign` pieces).
- `packages/design-system/src/components/logo/drawing.ts` and
  `packages/design-system/src/components/logo/assets.ts` (the build-time logo asset path, ORV-118
  slice B, rules `logo-icon-1` and `logo-asset-1`).
- ADR 0012 decision 4 (the owner's POC delegation) and `.claude/skills/ovl/SKILL.md`, section "POC
  mode".

## Changelog

- v1.0 (2026-11-25): first version, task ORV-308-spec. The issue's four acceptance rows with their
  numbers, split into columns, no requirement added; one PR for rows 1 to 4 (PR number 249 expected,
  not yet known); row 3 under "Rows that
  render nothing"; the real Chrome walk of row 2. No Jira tool call and no shell in this role: the
  issue text came from the envelope's first context pointer. To review downstream: the builder, the
  reviewer and the qa envelopes of this issue's PR.
