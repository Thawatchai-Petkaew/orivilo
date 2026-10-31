---
issue: ORV-118 (https://tpetkaew.atlassian.net/browse/ORV-118)
lane: L (risk flag: component public API; also a semantic token contract change, see open question 1)
mode: POC mode (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.3
gates: G1 and G2 passed by Claude under the owner's delegation (ADR 0012 decision 4)
---

# ORV-118: the ORIVILO logo component and its use in the app

## Acceptance criteria

Rows 1 to 11 are slice A (the `Logo` component in `packages/design-system`), rows 12 to 22 are slice B (its use in `apps/web` and the Storybook brand). Expected numbers come from the rules below and the worked examples (W1 to W7); a row names the rule and does not repeat its values.

| #   | Given                                                                                          | When                                                                                        | User sees                                                                                                                                                                                          | Data effect                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Storybook story `Base/Logo` "Kinds", neutral profile, light mode                               | The story renders the four kinds (`mark`, `wordmark`, `horizontal`, `stacked`) at height 64 | The open ring with its dot, the drawn lowercase "orivilo", the horizontal lockup and the stacked lockup, each drawn as `logo-geometry-1` states, coloured as `logo-colour-1` states for light mode | None written. A unit test compares each kind's `viewBox` and path data with `logo-geometry-1`                                                                                                                                          |
| 2   | The neutral dark cell of story "Recipes and modes", the four kinds in the master form          | It renders                                                                                  | The same four drawings coloured as `logo-colour-1` states for dark mode                                                                                                                            | None. A play test reads the computed ring stroke and dot fill and compares them with W6's source values                                                                                                                                |
| 3   | Story "Small sizes", light mode                                                                | The mark renders at heights 12, 16, 19.9, 20, 24, 24.1, 32 and 120                          | For each height the form `logo-size-1` picks (W3), with the dot colour `logo-colour-1` gives that form in light mode                                                                               | None. The ring's `stroke-width` attribute equals the form's stroke (W3); the dot's `r` is 21 in every form (21 at all eight heights) and the ring's `d` is the arc of `logo-geometry-1`                                               |
| 4   | The neutral dark cell of story "Recipes and modes", forms 16 and 24                            | It renders                                                                                  | The same forms as row 3, with the dot colour `logo-colour-1` gives them in dark mode                                                                                                               | None                                                                                                                                                                                                                                   |
| 5   | A Logo asked below its kind's minimum: `mark` 12, `wordmark` 10, `horizontal` 10, `stacked` 30 | It renders                                                                                  | Each drawing at its kind's minimum height from `logo-size-1`, never smaller                                                                                                                        | None. A unit test reads the rendered `height` of each                                                                                                                                                                                  |
| 6   | `tone="one-colour"` for each of the four kinds, light and dark                                 | It renders                                                                                  | One colour for the whole drawing as `logo-colour-1` states                                                                                                                                         | None. A play test reads the computed dot fill and the computed ring stroke and finds them equal                                                                                                                                        |
| 7   | Story "Named", `decorative` false, locale Thai (play), then English (unit test)                | The accessibility tree is read                                                              | One image named "ORIVILO" in Thai and "ORIVILO" in English (`logo-name-1`, copy table)                                                                                                             | None. The name comes from the design-system locale catalog                                                                                                                                                                             |
| 8   | Story "Decorative", `decorative` true                                                          | The accessibility tree is read                                                              | Nothing announced for the drawing (`logo-name-1`)                                                                                                                                                  | None. The a11y addon reports zero violations on the six stories `logo-api-1` lists                                                                                                                                                     |
| 9   | Story "Recipes and modes"                                                                      | It renders the four kinds under neutral, Professional and Friendly, light and dark          | The same box size for a kind in all six boundaries; colours follow each profile's identity tokens (`logo-scope-1`)                                                                                 | None                                                                                                                                                                                                                                   |
| 10  | The token source with the slice A change                                                       | `pnpm contrast` and `pnpm test` run                                                         | Not a screen                                                                                                                                                                                       | The pair `logo-colour-1` adds passes floor 3.0 under neutral, Professional and Friendly in light and dark; output attached to the PR (W6 gives the neutral values)                                                                     |
| 11  | The catalog after slice A                                                                      | `check-catalog` runs                                                                        | Not a screen                                                                                                                                                                                       | `packages/design-system/catalog/base/logo.yaml` exists with `status: stable`, `story: base-logo`, `recipes: [neutral, professional, friendly]`, and `rules` lines for `logo-scope-1` and `logo-screen-1`; `coverage.md` has a Logo row |
| 12  | Any app page, locale Thai, width 1280 px, light mode                                           | The page loads                                                                              | The horizontal lockup at height 24 at the start of the main menu, before "สตูดิโอ" and "บัญชี"; the 8 px dot and the text "ORIVILO" beside it are gone                                             | None. The link to `/` is named "ORIVILO หน้าแรก"; the Logo inside it is decorative (`logo-name-1`)                                                                                                                                     |
| 13  | The same page, locale English, dark mode                                                       | The page loads                                                                              | The same lockup before "Studio" and "Account", coloured for dark mode                                                                                                                              | None. The link to `/` is named "ORIVILO home"                                                                                                                                                                                          |
| 14  | Any app page at 360 px, Thai and English                                                       | The header is measured                                                                      | The lockup whole, no horizontal scroll, and no other element inside its clear space (`logo-space-1`, W4)                                                                                           | None. A scripted Playwright run on a production build (`webapp-testing`) measures the bounding boxes; its output goes in the slice B G3 packet                                                                                         |
| 15  | `/account` signed out, locale Thai                                                             | The page loads                                                                              | The stacked lockup at height 80 above the heading "บัญชีและเวิร์กสเปซ", and the button "ลงชื่อเข้าใช้ด้วย Google" below                                                                            | None. The lockup is an image named "ORIVILO"                                                                                                                                                                                           |
| 16  | `/account` in the signed-in view and in the not-configured view, locale English                | The page loads                                                                              | The same stacked lockup above the heading "Account and workspace"                                                                                                                                  | None                                                                                                                                                                                                                                   |
| 17  | A browser with a light tab bar (`prefers-color-scheme: light`)                                 | Any app page opens                                                                          | The tab shows the favicon form `logo-icon-1` gives for a light scheme                                                                                                                              | The document head has `<link rel="icon" type="image/svg+xml">` pointing at the generated SVG                                                                                                                                           |
| 18  | A browser with a dark tab bar (`prefers-color-scheme: dark`)                                   | Any app page opens                                                                          | The tab shows the same SVG in its dark-scheme form (`logo-icon-1`)                                                                                                                                 | Same file as row 17                                                                                                                                                                                                                    |
| 19  | A browser that does not render SVG favicons                                                    | It requests the PNG icon                                                                    | The 32 px app icon form (`logo-icon-1`, W7)                                                                                                                                                        | The head has `<link rel="icon" type="image/png" sizes="32x32">`; the file is 32 by 32                                                                                                                                                  |
| 20  | iOS "Add to Home Screen"                                                                       | It requests the touch icon                                                                  | The 180 px app icon form (`logo-icon-1`, W7)                                                                                                                                                       | The head has `<link rel="apple-touch-icon" sizes="180x180">`; the file is 180 by 180                                                                                                                                                   |
| 21  | A token value or the geometry changes and the generated assets are not regenerated             | `pnpm test` runs                                                                            | Not a screen                                                                                                                                                                                       | A test fails and names the stale asset (`logo-asset-1`)                                                                                                                                                                                |
| 22  | Storybook opens                                                                                | The manager sidebar renders                                                                 | The horizontal lockup image at height 24 in the sidebar header, in the form `logo-size-1` and `logo-colour-1` give for 24 px, light mode                                                           | `.storybook/manager.ts` sets `brandTitle` "ORIVILO" and `brandImage` to the generated asset                                                                                                                                            |

## Rows per PR

- PR 165: rows 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

PR 165 is slice A (Story). Slice B, rows 12 to 22, gets its line here when the slice B PR opens.

## Benchmark (component rule, ORV-137 comment 10247)

In the form of `docs/specs/ORV-64/audit.md` section B. It sits after the acceptance criteria because the qa result recorder reads the first table headed `#` (ORV-146).

| Item        | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untitled UI | Read from Untitled UI React's code and site on 2026-10-31 (K-0094, confidence 0.8; nothing rendered). Its own brand is two foundation components in `components/foundations/logo/`, with no docs page: the components list has no logo entry, and the "Logos" resource is fictional placeholder logos. `UntitledLogo`, the lockup, is an HTML `div` holding the mark SVG, a spacer `div` and a 97 by 32 wordmark SVG. `UntitledLogoMinimal`, the mark only, is one 38 by 38 SVG. Props are the plain `HTMLAttributes` or `SVGProps`, spread onto the root: no variant, size, state, tone, mode or slot prop. Size comes only from a `className` merged after a default `h-8` (lockup) or `size-8` with `scale-[1.2]` (mark); its own header and slim sidebar pass `h-6` and `size-6`. Colour: the wordmark fills with the theme token `fg-primary`, which switches in dark mode; the mark uses fixed fills, gradients, drop-shadow filters and an embedded base64 WebP image, so it looks the same in both modes. Accessible name: none on either component; its header puts `aria-label="Go to homepage"` on the link around the lockup, and its slim sidebar names neither. No minimum size, clear space, small-size form or one-colour form is stated. Category list: https://www.untitledui.com/react/components |
| shadcn/ui   | No logo component. Its login and sidebar blocks put a Lucide icon in a rounded square as a placeholder brand.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Ours        | No Logo component. The header draws an 8 px `brand.signature` dot beside the text "ORIVILO" (`apps/web/app/layout.tsx` lines 37 to 41). No favicon, no app icon, no Storybook brand. The drawings exist only as files: `docs/context/brand/assets/orivilo-mark.svg`, `orivilo-wordmark.svg`, `orivilo-lockup.svg`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Gap         | No component reads the drawings; no small-size forms; no one-colour form; no accessible name; nothing in the browser tab or on a home screen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Add         | Four kinds, a `height` with a minimum per kind and small forms below 25 px, a one-colour tone, an accessible name on the Logo itself with a decorative switch (`logo-name-1`, `logo-api-1`), and generated favicon, app icon and Storybook images (`logo-asset-1`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Do not copy | Sizing by `className` (Untitled, confirmed by K-0094): the small forms depend on the rendered height, so the Logo takes `height` and never scales with its container. Spread attribute props (Untitled spreads `HTMLAttributes` or `SVGProps`): `LogoProps` is closed (`logo-api-1`). A lockup built from HTML boxes and a spacer (Untitled): each kind is one SVG with one `viewBox` (`logo-geometry-1`). Fixed colours, gradients, filters and an embedded raster image in the mark (Untitled): every part reads a component token, so the whole drawing follows the mode and the profile (`logo-colour-1`, `logo-asset-1`). A logo with no name of its own (Untitled leaves the name to an enclosing link): the Logo is named by default, and only `decorative` hides it (`logo-name-1`). A placeholder icon (shadcn/ui): the drawn mark is the only form. A name set in a font: brand spec v1.1 section 3 says the drawn wordmark is the only form in a logo context.                                                                                                                                                                                                                                                                                                                                            |

## Why

ORIVILO shows its name today as a dot and a line of text. The owner's brand identity case study (board 05, Logo) fixes the mark, the wordmark, two lockups, the small-size forms and the app icon; this story makes them render correctly wherever the product shows itself: the app header, the sign-in page, the browser tab, a home screen icon and the Storybook sidebar. POC focus is function (owner, 2026-10-26): the spec covers a correct render and nothing for marketing.

Nothing here is simulated or mocked. The logo is real artwork, but it is not a cleared trademark: `logo-screen-1` keeps it off production until the mark is screened.

## Story

As a person using ORIVILO, I see the ORIVILO logo, drawn the same way at every size, in the app header, on the sign-in page, in my browser tab and on my home screen, in light and dark mode, and a screen reader names it "ORIVILO" where no visible name sits beside it.

Two vertical slices, one PR each (L-0016: each slice gets its own short spec section in this file):

- Slice A, rows 1 to 11: the `Logo` component, its tokens, recipe, catalog entry and stories. A designer reads it in Storybook.
- Slice B, rows 12 to 22: the header, `/account`, the generated favicon and app icons, and the Storybook brand. A person sees it in the app. Slice B starts after slice A merges.

Size (main session decision, 2026-10-30): by the tech notes' estimate (section 9), tests included, slice A is about 855 changed lines and slice B about 490 plus two generated PNG files. Each slice stays one PR, over the 400-line guide, and the token contract is not split out of slice A; the review is sized to the PR (ORV-146).

## Rules

### logo-geometry-1

All coordinates are in drawing units; source files are in `docs/context/brand/assets/`.

- `mark`: `viewBox="0 0 150 150"`. Ring: the arc `M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5` (centre (75, 77.5), radius 52.5; 110 degrees open, centred at 55 degrees, the lower end on the horizontal through the centre), no fill, round caps, stroke width from `logo-size-1`. Dot: circle at (105.11, 34.49), radius 21 in every form (the radius the brand files draw; ORV-192 row 5). Both arc ends lie on the ring (W1); the dot sits in the opening with the same gap to each cap (W2).
- `wordmark`: `viewBox="0 -45 473 150"`, the strokes and shapes of `orivilo-wordmark.svg` unchanged: stroke 24, butt caps, round joins, i-dots radius 15. Baseline y = 100.
- `horizontal`: `viewBox="0 0 663 150"`. The mark box at (0, 0); the wordmark drawn with `translate(190, 45)`, so both 150 boxes are bottom-aligned, the ring bottom (y = 145) sits on the wordmark baseline, and the gap between boxes is 40. This is `orivilo-lockup.svg`.
- `stacked`: `viewBox="0 0 473 375"`. The mark box centred above the wordmark box at x = 161.5, y = 0; the wordmark box top at y = 225 (gap 75 = 0.5 of the mark box height, open question 4), drawn with `translate(0, 270)` (W5).

### logo-size-1

`height` is the rendered height in CSS px of the kind's whole `viewBox`; width follows from the `viewBox` ratio (W4). The mark height `m` is `height` for `mark` and `horizontal`, and `height × 150 / 375` for `stacked`.

- Minimum per kind: `mark` 16, `wordmark` 20, `horizontal` 20, `stacked` 50 (each gives a mark of at least 16 px and a wordmark box of at least 20 px). A smaller `height` renders at the minimum.
- Form by `m`: below 20 is form 16, stroke 34; from 20 to 24 is form 24, stroke 32; above 24 is the master, stroke 30 (W3). The ring stroke changes, the wordmark stays stroke 24 and the dot stays radius 21 in every form (ORV-192 row 5, which superseded the dot as wide as the stroke).
- In a `horizontal` lockup in form 16 or 24 the thicker ring ends 1 or 2 units below the baseline (open question 10).

### logo-colour-1

The Logo reads three component tokens, each pointing at one semantic token (component tokens reference semantic tokens only, DESIGN.md §5):

| Part                              | `tone="full"`, master form         | `tone="full"`, forms 16 and 24                             | `tone="one-colour"`, every form |
| --------------------------------- | ---------------------------------- | ---------------------------------------------------------- | ------------------------------- |
| Ring, wordmark strokes, i-dots, v | `logo.ink` reads `text.primary`    | `logo.ink`                                                 | `logo.ink`                      |
| Dot                               | `logo.dot` reads `brand.signature` | `logo.dot-small` reads `brand.dot-small` (new, question 1) | `logo.ink`                      |

Neutral values: `text.primary` gray.900 #16151D light, gray.100 #F2F1EC dark; `brand.signature` violet.600 #7A22C7 light, violet.400 #B07FEE dark; `brand.dot-small` the same values. So the dot is violet at every size in both modes (owner, ORV-118 comment 10336; brand spec v1.2 §2). Under neutral these are the values of the primary button (`action.primary`), and the two stay separate tokens; lime is spent only on `action.intent` (tech notes, section 13).

Contrast (`pnpm contrast`): one new semantic pair, `brand.dot-small` on `surface.canvas`, floor 3.0 (W6). The ring is `text.primary` on `surface.canvas`, already a pair. The master dot is left out of `src/recipes/pairs.ts` (`brand.signature` has no floor on the canvas; Friendly's is 2.3 on its light canvas), with the reason in its header comment: a logo's accent is decoration, and the ring carries the shape (WCAG 1.4.11 does not apply to a logotype).

### logo-name-1

With `decorative` false (the default) the drawing is an image (`role="img"`) named with the logo name from the copy table, read from the design-system locale catalog. With `decorative` true it is `aria-hidden="true"` and has no name; use it where the name is beside it or where an enclosing element already carries it (the header link, row 12).

### logo-space-1

Clear space is the master stroke width scaled to the rendered mark: `m × 30 / 150` px on every side of the Logo's box, where no other element's box may start (W4). The Logo adds no padding of its own; the page that places it keeps the space.

### logo-icon-1

- Favicon, SVG: the mark in form 16 on a transparent ground. Ring `text.primary` and dot `brand.dot-small`, light values by default and dark values inside `@media (prefers-color-scheme: dark)` in the same file.
- App icon, PNG, at 32 px (favicon fallback) and 180 px (Apple touch icon): a square with corner radius `side × 22 / 96` filled with `surface.inverse` (light value, #16151D), the mark box `side × 2 / 3` centred (open question 5), ring `text.on-inverse` (light value, #F2F1EC), dot: the dark value of the token the form picks (`logo-colour-1`), because the ground is the ink square: `brand.dot-small` at 32 px (form 24), `brand.signature` at 180 px (master), #B07FEE in both, 6.14 (W6); stroke by `logo-size-1` for the mark box size (W7).
- Storybook brand image: the `horizontal` lockup at height 24, `tone="full"`, light values.

### logo-asset-1

The favicon SVG, the two app icon PNGs and the Storybook brand image are generated by one command from the geometry module the component uses and the token source, never drawn or typed by hand. A test regenerates each asset in memory and fails, naming the file, when it differs from the committed one. No hex value appears in a page, a component or a recipe.

### logo-api-1

Public API, exported from `@orivilo/design-system` (the component public API is this story's risk flag; `ds-architect` may refine names in tech notes, which then bump this spec):

- `Logo`, props `LogoProps`: `kind` (`LogoKind`, `"mark" | "wordmark" | "horizontal" | "stacked"`, default `"horizontal"`), `height` (number, CSS px, default 24, `logo-size-1`; a value that is not a finite number, such as `NaN` or `Infinity`, is read as the default, and every finite value, 0 and negative ones included, goes to `logo-size-1` as given), `tone` (`LogoTone`, `"full" | "one-colour"`, default `"full"`), `decorative` (boolean, default false, `logo-name-1`), `className` (layout only). `LogoKind` and `LogoTone` are exported types beside `LogoProps`. The props are closed: `LogoProps` extends no SVG or HTML attribute type, and the component spreads nothing onto the markup.
- No colour, stroke, ground or width prop. The Logo never scales with its container.
- Recipe class `ds-logo` with `data-kind`, `data-form` (`16`, `24`, `master`; a wordmark is always `master`) and `data-tone`.
- Stories under `Base/Logo`: "Kinds", "Small sizes", "One colour", "Named", "Decorative", "Recipes and modes" (six stories, each rendered at 360 px and through the locale toolbar in Thai and English).

### logo-scope-1

The Logo is ORIVILO's own mark for the Studio shell: the app header, `/account`, the favicon and app icons, and the Storybook brand. It never renders inside a customer preview frame (DESIGN.md §9 item 10). Under a customer profile its colours follow that profile's identity tokens; the "Recipes and modes" story shows this for layout proof only.

### logo-screen-1

The mark is not yet screened against DIP Thailand (classes 9 and 42) or the WIPO Global Brand Database (brand spec v1.1 section 8). It may merge into `develop` and run on staging. G5 for a release that carries it to production waits for a screening record linked on ORV-118. The catalog entry's `rules` carry this line.

### logo-render-1

The owner sees the renders before the review (ORV-118 description, L-0019). For each slice, before the reviewer is dispatched on a head, the main session posts on ORV-118 a contact sheet: slice A, the six `Base/Logo` stories in light and dark; slice B, the header and `/account` at 360 and 1280 px in Thai and English, light and dark, the favicon on a light and a dark tab, the 180 px app icon, and the Storybook sidebar. The designer's visual sign-off (L-0019) still applies.

## Copy

| Where                     | Thai                     | English               | Source                                               |
| ------------------------- | ------------------------ | --------------------- | ---------------------------------------------------- |
| Logo accessible name      | ORIVILO                  | ORIVILO               | New, design-system locale catalog (question 8)       |
| Header link to `/`        | ORIVILO หน้าแรก          | ORIVILO home          | Existing `app.home`, `apps/web/i18n/messages.ts`     |
| `/account` heading        | บัญชีและเวิร์กสเปซ       | Account and workspace | Existing `account.heading`                           |
| `/account` sign-in button | ลงชื่อเข้าใช้ด้วย Google | Sign in with Google   | Existing `account.signInWithGoogle`                  |
| Storybook `brandTitle`    | ORIVILO                  | ORIVILO               | New, `.storybook/manager.ts` (one name, not UI copy) |

## Worked examples

None is run here (no shell in this role); each runs from the repo root. Inputs are copied from `docs/context/brand/assets/orivilo-mark.svg`, `orivilo-lockup.svg`, `orivilo-wordmark.svg`, DESIGN.md §3.1 and the heights this spec places.

W1. `logo-geometry-1`, both arc ends on the ring (centre (75, 77.5)). Rounded to 2 decimals. Expected: `52.50 52.50`.

```bash
node -e 'const r=([x,y])=>Math.hypot(x-75,y-77.5).toFixed(2);console.log(r([57.04,28.17]),r([127.5,77.5]))'
```

W2. `logo-geometry-1` and `logo-size-1`, the gap between the dot and the nearer cap, in units and in px at one height per form: 32 (master, the mark of the `/account` lockup), 24 (form 24, the header) and 16 (form 16, the favicon). Rounded to 2 decimals. Expected: `30 12.48 2.66`, `32 11.48 1.84`, `34 10.48 1.12` on three lines. The gap is the distance from the dot's centre to the nearer cap's centre minus half the stroke and the dot's radius (21).

```bash
node -e 'const d=Math.min(...[[57.04,28.17],[127.5,77.5]].map(([x,y])=>Math.hypot(x-105.11,y-34.49)));for(const[s,h]of[[30,32],[32,24],[34,16]]){const g=d-s;console.log(s,g.toFixed(2),(g*h/150).toFixed(2))}'
```

W3. `logo-size-1`, the form method: mark height in, ring stroke out. Inputs: below the minimum, the favicon, the boundaries, the header lockup (24), the mark of the `/account` lockup (32) and of the 180 px app icon (120). No rounding. Expected: `34 34 34 32 32 30 30 30`.

```bash
node -e 'const f=h=>{h=Math.max(16,h);return h<20?34:h<=24?32:30};console.log([12,16,19.9,20,24,24.1,32,120].map(f).join(" "))'
```

W4. `logo-size-1` and `logo-space-1`: header lockup width at 24, wordmark width at its minimum 20, `/account` stacked width at 80, the mark height inside a stacked 80 and a stacked 50, and the header clear space. Rounded to 2 decimals. Expected: `106.08 63.07 100.91 32.00 20.00 4.80`.

```bash
node -e 'const w=(vw,vh,h)=>(h*vw/vh).toFixed(2);console.log(w(663,150,24),w(473,150,20),w(473,375,80),(80*150/375).toFixed(2),(50*150/375).toFixed(2),(24*30/150).toFixed(2))'
```

W5. `logo-geometry-1`, the stacked positions: mark x, wordmark box top, wordmark translate y, total height. Rounded to 2 decimals for x. Expected: `161.50 225 270 375`.

```bash
node -e 'console.log(((473-150)/2).toFixed(2),150+0.5*150,150+0.5*150+45,150+0.5*150+150)'
```

W6. `logo-colour-1` and `logo-icon-1`, WCAG 2 contrast from DESIGN.md §3.1 hex values: violet.600 on gray.50 (dot, light canvas), violet.400 on gray.900 (dot, dark canvas), white on violet.600 (`brand.ink` on the signature, light), violet.600 on gray.900 (why the app icon takes the dark value). Rounded to 2 decimals. Expected: `6.61 6.14 7.29 2.49`.

```bash
node -e 'const L=h=>{const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};const R=(a,b)=>{const[x,y]=[L(a),L(b)].sort((p,q)=>q-p);return((x+0.05)/(y+0.05)).toFixed(2)};console.log(R("7A22C7","F4F4F0"),R("B07FEE","16151D"),R("FFFFFF","7A22C7"),R("7A22C7","16151D"))'
```

W7. `logo-icon-1`, app icon corner radius (22 on 96) and mark box (2/3) at 32 and 180 px. Rounded to 2 decimals. Expected: `32 7.33 21.33` and `180 41.25 120.00` on two lines; by W3 the 32 px icon draws form 24 and the 180 px icon the master.

```bash
node -e 'for(const s of [32,180])console.log(s,(s*22/96).toFixed(2),(s*2/3).toFixed(2))'
```

## Out of scope

- Lockups on a violet ground (open question 7).
- A web app manifest, maskable or PWA icons, and `favicon.ico` (open question 6).
- Open Graph or social share images, email templates, marketing pages.
- Storybook manager colours and fonts beyond the brand image, the brand title and the light base the brand image needs (`logo-icon-1`).
- Motion of the logo.
- A Thai-script wordmark.
- The trademark screening itself, the lineup test with outsiders, and print or embroidery tests (brand spec v1.1 section 8).
- Customer logos made by the Brand module.
- The `packages/intent-engine` colour rules and their test on ORIVILO's own brief, which still pick lime as the signature: follow-up ORV-185 (ORV-118 comment 10338 item 5; tech notes, section 12, item 6).

## Open questions (option, impact, default)

1. Which token carries the small dot (violet on the light canvas, lime on the dark one)? No existing semantic token has those values: `text.brand` is violet.700 in light and violet.300 in dark, `action.primary` means "act" (DESIGN.md §8). Option: a recipe rule keyed on the mode, which breaks under `mode="system"`. Decided in the tech notes (section 2, D1) at the default, and accepted by the main session under ADR 0012 decision 4: the name `brand.dot-small` is confirmed, a new identity-scoped semantic token whose neutral values and pair are in `logo-colour-1` and whose profile values are in the tech notes, section 2. Professional and Friendly must override it (each takes its own `text.brand` primitive step in light and its `brand.signature` step in dark, and `pnpm contrast` proves the pair). Impact (contract change): the full list is in the tech notes, section 10. Values revised by comment 10336 (tech notes, section 13).
2. Form boundaries. Brand spec v1.1 says "≤ 24 px: stroke 32 to 34" and Jira gives 34 at 16 and 32 at 24. Default: `logo-size-1` (below 20 is form 16, 20 to 24 is form 24).
3. What "wordmark never below 20 px high" measures. Default: the wordmark's 150-unit box (x-height then 13.3 px).
4. The stacked gap "0.5 × mark height": the mark box (150) or the ring's outer height (135)? Default: the box, 75 units.
5. The mark's size inside the app icon. Not given on the board or in Jira. Default: 2/3 of the side, centred; the margin (16 on 96) is more than the clear space (12.8 on 96).
6. Favicon formats. Default: the SVG with a scheme switch, plus a 32 px PNG of the app icon form for browsers without SVG favicons; no `favicon.ico`, no manifest.
7. Lockups on a violet ground (board 05). No app surface uses a violet ground and no semantic token names one; adding one now is a contract change with no consumer (AGENTS.md rule 6). Default: out of scope; the ink ground is the dark canvas (`surface.canvas` dark is #16151D) and the app icon.
8. The Thai accessible name. Jira says "ORIVILO"; brand identity v1 gives "ออริวิโล" as the Thai name. Default: "ORIVILO" in both locales.
9. The Untitled UI benchmark row was not read from its page. Answered in v1.2: the designer read Untitled UI React's code and site through knowledge entry K-0094 (`docs/knowledge/platform/K-0094-untitled-ui-react-logo-components.md`) and rewrote the row. The Add and Do not copy rows still hold; Do not copy gains four Untitled items, each already decided by a rule (`logo-api-1`, `logo-geometry-1`, `logo-colour-1`, `logo-name-1`). No acceptance row changes.
10. In a `horizontal` lockup at form 16 or 24 the ring ends 1 or 2 units below the baseline (0.16 to 0.32 px). Default: accept; do not move the ring.
11. Header size. At 24 px the header lockup is form 24, so its dot is violet in light mode. Default: 24 (brand spec v1.1 "24 px UI" minimum).
12. `/account` placement. Default: the stacked lockup at height 80, named, above the heading in all three views (signed out, signed in, not configured).

## Depends on

- Jira ORV-118 description; G1 and G2 passed by Claude under ADR 0012 decision 4 (`docs/adr/0012-jira-states-by-environment.md`).
- Brand identity case study, board 05 Logo: https://claude.ai/artifact/1Hmo2mQ9GnfRvN5WmJJB4C
- `docs/context/brand/orivilo-brand-spec-v1.1.md` sections 2 to 4 and 8; `docs/context/brand/assets/`. The file holds brand spec v1.2 from 2026-10-31, edited in place with its file name kept (ORV-118 comment 10338 item 4).
- ORV-118 comment 10336 (the owner's decision: the mark's dot is violet, the same as the primary button; lime only for `action.intent`) and comment 10338 (the delegated decisions on it); tech notes, section 13.
- DESIGN.md §3.1 (tokens, identity scope), §5 (layers), §8 (colour roles), §9 item 10, §10 (copy), §11 (design gate).
- ADR 0003 (`docs/adr/0003-shadcn-behavior-own-visual-layer.md`, Storybook and catalog), ADR 0013 (qa approve on a code PR).
- ORV-39 (locale catalog), E2-3 (neutral shell), E0-5 (`pnpm contrast`), ORV-137 (POC mode, component benchmark), ORV-146 (the qa recorder reads the first table headed `#`).
- L-0019 (designer sign-off and renders before review).

## Changelog

- v1.0 (2026-10-30): first version, from the ORV-118 description and board 05. Downstream to write next: tech notes for the token contract change (open question 1) and the public API (`logo-api-1`).
- v1.1 (2026-10-30): from the tech notes' findings F1 to F6 (`docs/specs/ORV-118/tech.md`, "Findings for the spec") and the main session's decisions under ADR 0012 decision 4. Each finding, with its kind:
  - F1, no contract change: row 1 renders "Kinds" at height 64, so the widest kind fits a story rendered at 360 px (`logo-api-1`); the tech notes' F1 row holds the check.
  - F2, no contract change: row 14 is measured by a scripted Playwright run on a production build (`webapp-testing`), not by a permanent suite; an `apps/web` e2e suite is a follow-up (tech notes, section 12, item 4).
  - F3, a repeat of an earlier finding: the contract change is the one v1.0 declared in open question 1, and `logo-colour-1` and `logo-api-1` already named the component tokens, the recipe and the pairs; the finding adds only the files these touch (token and recipe sources, tests, a story, DESIGN.md sections). Open question 1 is now decided and points to the tech notes' impact list (section 10) instead of keeping a partial copy.
  - F4, contract change (component public API): `logo-api-1` gains the `LogoKind` and `LogoTone` exports, the default for a `height` that is not a finite number, closed props, and a wordmark's `data-form` fixed at `master`. The fifth amendment of the tech notes' D3, one fixed markup, is a design detail and stays in the tech notes (section 4).
  - F5, no contract change: the light base of the Storybook manager moves into scope (Out of scope).
  - F6, no contract change: the test project runs each story once, in Thai and light mode, so rows 2 and 4 are asserted in the neutral dark cell of story "Recipes and modes" and row 7's English half in a unit test; row 4's When follows its new Given. The dark views through the toolbar stay on the contact sheet (`logo-render-1`).
  - Size, a main session decision and not a finding, no contract change: each slice stays one PR at the tech notes' estimate (Story).
  - Downstream to review: the tech notes (the `spec:` version in the front matter, the Status column of F1 to F6, the size quote in section 9, the spec rows of section 10, and the row 5 test for a `height` of 0 or below); DESIGN.md §3.1, §8, §12 and its change log, brought up to date by tasks A1, A6 and B1 (tech notes, section 10); the builder envelopes of tasks A2, A3, A5 and R2.
- v1.2 (2026-10-31): open question 9 answered from knowledge entry K-0094 (`docs/knowledge/platform/K-0094-untitled-ui-react-logo-components.md`). No contract change and no acceptance row changes.
  - Benchmark, Untitled UI row: rewritten from Untitled UI React's code: two components, no variant, size, state or slot props, sized by `className`, no accessible name on the logo itself. v1.0's "drawn as an SVG" was partly wrong: the mark is one SVG with an embedded raster image, the lockup an HTML `div` around two SVGs (K-0094 section 5). New facts: the mark's colours are fixed, and no minimum size, clear space or small form is stated.
  - Benchmark, Add row: names the accessible name on the Logo itself beside the decorative switch; same scope as v1.1.
  - Benchmark, Do not copy row: gains spread attribute props, a lockup of HTML boxes, fixed colours in the mark and a logo with no name of its own, each already decided by `logo-api-1`, `logo-geometry-1`, `logo-colour-1` and `logo-name-1`.
  - Downstream to review: the tech notes' `spec:` version (v1.1 to v1.2); the dependency of task A5 in tech notes section 8 is now met.
- v1.3 (2026-10-31): the violet dot, from the owner's decision in ORV-118 comment 10336 and the delegated decisions of comment 10338, through tech notes section 13 and its findings F7 to F11 ("Findings for the spec"). This is the spec's v1.3; the v1.2 that comment 10338 item 4 names is the brand spec's. Each finding, with its kind:
  - F7, contract change (the values of identity-scoped tokens under neutral, tech notes section 13): `logo-colour-1`'s neutral values make the dot violet at every size in both modes, at the primary button's values, with lime left to `action.intent`. Comment 10338 item 1, the wide reading: `brand.signature` itself turns violet, so every reader of it changes with the logo (tech notes section 13, "Readers of `brand.signature`").
  - F8, no contract change: `logo-colour-1`'s contrast paragraph gives the reason that still holds for keeping the master dot out of `src/recipes/pairs.ts`.
  - F9, contract change (the asset's colour rule): `logo-icon-1`'s app icon dot takes the dark value of the token its form picks.
  - F10, no contract change: W6 computes the pairs the new values give, with a new expected line.
  - F11, no contract change: this entry; open question 1 keeps its text and points to tech notes section 13.
  - Rows per PR, no contract change: a new section after the acceptance criteria names the rows the slice A PR (PR 165) carries, rows 1 to 11, so the qa result recorder walks only those (`qa-scope-1`, ORV-138); slice B's line, rows 12 to 22, is added when its PR opens.
  - Acceptance rows: no row's text changes. Rows 1 to 4, 9, 10, 13, 15, 16 and 18 to 20 now show or check the new dot values through the rules they name; rows 12, 17 and 22 render light-mode small forms, which were violet already.
  - Comment 10338, the other items: item 2, risk 5 (a violet brand badge reads like the primary button) is judged by the designer at the V2 sign-off; item 3, the glow stays and becomes the one violet signature glow (DESIGN.md §2, task V1); item 4, the brand spec is edited in place (Depends on); item 5, the intent-engine colour rules are follow-up ORV-185 (Out of scope).
  - Downstream to review: brand spec v1.2 (task S2); DESIGN.md §2, §3.1, §3.5, §8, §9 item 1 and its change log (tech notes section 13, task V1); `catalog/base/logo.yaml:24`, `src/recipes/pairs.ts:13` and `Logo.stories.tsx` lines 30 and 31 (task V1); the tech notes' `spec:` version (v1.2 to v1.3) and the Status column of F7 to F11; the V2 sign-off (the Logo stories, the brand badge, the glow and the bead); slice B tasks B1 (the app icon dot) and R2 (the favicon's dark block).
