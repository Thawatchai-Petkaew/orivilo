---
issue: ORV-118 (https://tpetkaew.atlassian.net/browse/ORV-118)
spec: docs/specs/ORV-118/spec.md v1.2
task: ORV-118-tech-1, ORV-118-tech-2 (findings F1 to F6 applied in the spec; the row 5 test fixed), ORV-118-arch-violet (section 13, the owner decision in comment 10336; findings F7 to F11 open)
author: ds-architect
date: 2026-10-31
---

# ORV-118 tech notes: the Logo, the small-dot token and the generated icons

These notes turn the spec's rules (`logo-geometry-1` to `logo-render-1`) into a token contract change, a component, an asset generator and a build order. They cite the spec by rule name, acceptance row and open question number and do not restate its values. A value that must change is changed in the spec first ("Findings for the spec" at the end).

Sources read, at `eeb2e71`:

- The spec, every section.
- `packages/design-system`:
  - `src/tokens/`: `model.ts`, `contrast-pairs.ts` and its test, `tokens.test.ts`, `source/semantic.json`, `source/component.json`, `orivilo.css`.
  - `src/profiles/`: `refine.ts`, `profiles.test.ts`, `source/professional.json`, `source/friendly.json`.
  - `src/recipes/`: `recipes.css`, `pairs.ts`, `recipes.test.ts`.
  - `src/foundations/contrast.ts` and `profiles.stories.tsx`; `src/i18n/` (the catalogs, `LocaleProvider.tsx`).
  - `src/components/`: `index.ts`, `matrix.tsx`, `badge/`, `progress/Progress.tsx`.
  - `src/testing/visual-asserts.ts` with its test and stories.
  - `tests/check-catalog.test.ts` and `tests/check-token-refs.test.ts`.
  - `.storybook/main.ts`, `.storybook/preview.tsx`, `vite.config.ts`, `package.json`.
  - `catalog/_template.yaml`, `catalog/base/badge.yaml`, `catalog/coverage.md`.
- `apps/web`: `app/layout.tsx`, `app/globals.css`, `app/account/page.tsx` and `page.test.tsx`, `proxy.ts`, `security-headers.ts`, `vitest.config.ts`, `package.json`.
- Next.js 16.4.1 as installed, `apps/web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`:
  - lines 22 to 26: `icon` takes `.svg` and `.png`, and `apple-icon` takes `.png`;
  - line 64: numbered icons sort lexically;
  - line 67: a 32 by 32 PNG gets `type="image/png"` and `sizes="32x32"`;
  - line 68: an `.svg` icon gets `sizes="any"`.
- Storybook 10.6.3 as installed: `storybook/manager-api`, `storybook/theming` and `storybook/theming/create` are package exports, and the package `tsconfig.json` already includes `.storybook`.
- `docs/context/brand/assets/*.svg`; DESIGN.md §3.1, §5, §8, §11 and §12; handoff §9.3 to §9.5 and §11; `.claude/rules/design-system.md` and `testing.md`; ADR 0015; `turbo.json`.

The worked examples W1 to W7 were run from the repo root, and each printed the spec's expected lines.

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Decision | Section | Confirmed by |
| --- | --- | --- | --- |
| D1 | Open question 1: the small dot reads a new semantic token `brand.dot-small`. It is identity-scoped, violet.600 in light and violet.400 in dark (lime.300 in dark before D10), and paired with `surface.canvas` at 3.0. Professional overrides it with navy.700 and navy.400, Friendly with coral.700 and coral.400 | §2 | Row 10: `pnpm contrast`, `contrast-pairs.test.ts`, `profiles.test.ts`, `tokens.test.ts` |
| D2 | Component tokens `logo.ink`, `logo.dot` and `logo.dot-small`, as `logo-colour-1` names them. They are kept because `componentsReading` finds a component only through its component tokens. Recipe `ds-logo` with two recipe pairs. The master dot stays out of `pairs.ts`, with the reason in its header comment | §3 | `recipes.test.ts`, row 10 |
| D3 | `logo-api-1` confirmed with five amendments: the `LogoKind` and `LogoTone` type exports, a `height` that is not a finite number falls back to 24, closed props, a wordmark's form is always `master`, and one fixed markup | §4 | Unit tests for rows 5, 7 and 8 |
| D4 | Asset form: inline SVG drawn from a typed geometry module, which a test checks against the three brand files. No SVG file is imported or fetched at runtime | §5 | Row 1 unit test |
| D5 | One drawing function (`createElement`, no JSX) renders both the component and the generated files, so the two cannot drift. One command, `pnpm --filter @orivilo/design-system logo-assets`, writes the favicon SVG, the two app icon PNGs and the Storybook image. `@resvg/resvg-wasm` (a new dev dependency, pinned) rasterises the PNGs | §5 | Rows 17 to 21 |
| D6 | Row 14, and the browser halves of rows 12, 13 and 17 to 22, are proven by a scripted Playwright run (R2) on a production build (`webapp-testing`), not by a new e2e suite in CI | §7, F2 | R2 output in the slice B G3 packet |
| D7 | The "Kinds" story renders the four kinds at height 64, not 96. At 96 the horizontal lockup is 424.32 px wide and overflows the 360 px width the design gate checks | §7, F1 | Row 1 play |
| D8 | The Storybook manager is pinned to the light base, because the brand image carries light values only (`logo-icon-1`) | §5, F5 | Row 22 |
| D9 | The test project runs each story once, in Thai and light mode. The dark halves of rows 2 and 4 are therefore asserted in the neutral dark cell of "Recipes and modes", and the English half of row 7 in a unit test | §7, F6 | Rows 2, 4 and 7 |
| D10 | Comment 10336 (owner): under neutral the dot is violet at every size. `brand.signature` becomes violet.600 and violet.400, `brand.ink` white in light, `brand.dot-small` violet.400 in dark. No token name is added or dropped: `brand.dot-small` and `logo.dot-small` stay, because they carry the 3.0 floor other profiles need. The app icon's dot takes the dark value | §13 | `pnpm contrast`; the three new cases in `tokens.test.ts`; rows 1 to 4 and 17 to 21 |

Open questions 2 to 12 keep their spec defaults:

- 2: the form boundaries of `logo-size-1` (below 20 is form 16; 20 to 24 is form 24).
- 3: the wordmark minimum measures its 150-unit box.
- 4: the stacked gap is 75 units, the mark box.
- 5: the app icon's mark box is 2/3 of the side, centred.
- 6: the SVG favicon with a scheme switch plus a 32 px PNG; no `favicon.ico` and no manifest.
- 7: lockups on a violet ground stay out of scope, with no violet-ground token and no surface that would use one (POC focus is function).
- 8: the accessible name is "ORIVILO" in Thai and in English.
- 9: the designer reads the Untitled UI page and corrects the benchmark row before the stories task (A5) starts.
- 10: the ring end 1 or 2 units below the baseline in forms 16 and 24 is accepted; the ring does not move.
- 11: the header lockup is 24 px high.
- 12: `/account` shows the stacked lockup at 80, named, above the heading in all three views.

## 2. The small-dot token (open question 1)

Section 13 changes the neutral dark value from lime.300 to violet.400 and keeps the token; the values in this section are updated to it. The proof run below is the one made at `eeb2e71`, before that change; section 13 has the run after it.

**Choice.** A new semantic token `brand.dot-small`, identity scope, `{color.violet.600}` in light and `{color.violet.400}` in dark. Its contrast pair is `brand.dot-small` on `surface.canvas` at floor 3.0. The name is confirmed. It names the one thing it colours, the mark's dot in the small forms, and it sits beside `brand.signature` (the master dot) in the `brand` group.

**Why a semantic token.**

1. Only semantic tokens carry modes; `TokenSet.validate` rejects a mode value on any other layer ("only semantic tokens carry modes"). The small dot changes with the mode, so its value lives in the semantic layer and `logo.dot-small` points at it.
2. The spec's other option is a recipe rule keyed on `data-mode`. It misses `mode="system"`, the shell's mode (`apps/web/app/layout.tsx`), where dark comes from a media query rather than the attribute. To cover it, the recipe would copy mode logic that the token build already writes once.
3. No existing token has these values. `text.brand` is violet.700 and violet.300. `action.primary` is violet.600 in light and violet.400 in dark, and it means "act" (DESIGN.md §8).

**Why identity scope, not Studio scope.**

- Identity scope makes every profile override the token (`Profile.validate`), as it does for `brand.signature`. A customer profile then sets its own small dot, and none of ORIVILO's violet or lime survives under a customer profile (DESIGN.md §9 item 10).
- Studio scope remaps a token in CSS to the profile's action, while the profile's `TokenSet` still resolves the base value. `pnpm contrast` would then measure lime on the profile canvas while the screen shows the profile's action, so the pair would test a colour nobody sees. The scratch run below shows this gap on an existing Studio token: under Professional, `action.intent` resolves to #D9F66F while the CSS remaps it to #19315E.

**Values per boundary.** This follows the spec's rule in open question 1: each profile takes its own `text.brand` primitive step in light and its `brand.signature` step in dark. The ratios come from the scratch run below, to one decimal. The floor is 3.0 and the lowest ratio is 6.1.

<!-- prettier-ignore -->
| Boundary | `brand.dot-small` | `surface.canvas` | Ratio |
| --- | --- | --- | --- |
| neutral, light | violet.600 #7A22C7 | #F4F4F0 | 6.6 |
| neutral, dark | violet.400 #B07FEE | #16151D | 6.1 |
| Professional, light | navy.700 #254582 | #F5F7F9 | 8.7 |
| Professional, dark | navy.400 #7CA4EE | #1B1E23 | 6.7 |
| Friendly, light | coral.700 #972F1D | #F9F6F2 | 7.1 |
| Friendly, dark | coral.400 #FC826B | #241D13 | 6.8 |

**Use rule.** Only `logo.dot-small` reads `brand.dot-small`. It is never text, an action, a link, a selection, focus or a status. DESIGN.md §8 "Brand presence" names it, and a test pins the one reader (§6). The build also writes the Tailwind theme variable `--color-brand-dot-small`, as it does for every semantic colour; no class uses it.

**The source change.** In `semantic.json`, group `brand`, after `ink`:

```json
"dot-small": {
  "$type": "color",
  "$value": { "light": "{color.violet.600}", "dark": "{color.violet.400}" },
  "$description": "The mark's dot at 24 px and below (logo forms 16 and 24), at least 3.0 on the canvas under every profile; equal to brand.signature in the ORIVILO profile; read only by logo.dot-small",
  "$extensions": {
    "orivilo": {
      "contrast": { "against": "surface.canvas", "floor": 3 },
      "scope": "identity"
    }
  }
}
```

- The `brand.signature` description becomes "The signature colour: the mark dot above 24 px, a bead, one highlight plane; never text and never an action; shares violet with action.primary in the ORIVILO profile only (ORV-118)" (section 13).
- `professional.json`, `semantic.brand`: `"dot-small": { "$value": { "light": "{color.navy.700}", "dark": "{color.navy.400}" } }`.
- `friendly.json`, `semantic.brand`: the same with `{color.coral.700}` and `{color.coral.400}`.

In `contrast-pairs.ts`, `PAIR_RULES`, after the `brand.ink` rule (line 79):

```ts
{ fg: ["brand.dot-small"], on: ["surface.canvas"], floor: UI, where: "the logo's small-form dot on the page" },
```

The declaration and the rule give one pair: `semanticPairs` keeps one pair per foreground and ground, and the rule's `where` wins. The declaration also shows the pair on the Foundations/Semantic page, as `brand.ink`'s does.

**Proof run (a design check, not the build).** A scratch script applied this change in memory and ran the repo's own `TokenSet`, `Profile` and contrast code at `eeb2e71`:

- Semantic pairs: 96 before, 97 after.
- `validate()` is empty for neutral, and for Professional and Friendly with their overrides.
- Professional without its override fails with "brand.dot-small carries ORIVILO's identity and must be overridden by every profile (DESIGN.md §9 item 10)".
- 582 pair checks under the three profiles and two modes, with 0 failures, no unexplained colour and no stale exemption under any profile.
- The sorted identity list starts with `brand.dot-small` and has nine entries.

The builder's `pnpm contrast` output is the evidence for row 10.

## 3. Component tokens, recipe and pairs

**`component.json`**, a new group after `chat`:

```json
"logo": {
  "$description": "The ORIVILO mark, wordmark and lockups (ORV-118, logo-colour-1)",
  "ink": { "$type": "color", "$value": "{text.primary}" },
  "dot": { "$type": "color", "$value": "{brand.signature}" },
  "dot-small": { "$type": "color", "$value": "{brand.dot-small}" }
}
```

**Why component tokens rather than `var(--ds-...)` in the recipe.** Handoff §9.3 asks for no component token that only copies a semantic one, and some recipes read `--ds-*` directly. Two reasons apply here:

- `componentsReading` finds the components that read a semantic path through `component.json` only. With `logo.*`, the Direction Studio trace names the Logo when a profile overrides `text.primary`, `brand.signature` or `brand.dot-small`, and the one-reader test of §6 works.
- The Logo has three slots, each with its own colour, which DESIGN.md §5 gives a component token for ("one name per slot").

There are no dimension tokens. Stroke widths, radii and positions are drawing geometry (`logo-geometry-1`, `logo-size-1`) that no profile may change, so they stay constants in `geometry.ts`. Handoff §9.5 keeps graphic composition out of tokens.

**Recipe**, appended to `src/recipes/recipes.css`:

```css
/* Logo (ORV-118): colour only. Geometry, stroke widths and size are attributes the component writes. */
.ds-logo {
  display: block;
  flex: none;
}
.ds-logo__ring,
.ds-logo__strokes {
  stroke: var(--cmp-logo-ink);
}
.ds-logo__fills {
  fill: var(--cmp-logo-ink);
}
.ds-logo__dot {
  fill: var(--cmp-logo-dot);
}
.ds-logo:is([data-form="16"], [data-form="24"]) .ds-logo__dot {
  fill: var(--cmp-logo-dot-small);
}
/* Last on purpose: the same specificity as the rule above, so one colour wins in every form. */
.ds-logo[data-tone="one-colour"] .ds-logo__dot {
  fill: var(--cmp-logo-ink);
}
```

`flex: none` keeps the box whole inside a flex row at 360 px (row 14). `apps/web` gets the recipe through `@orivilo/design-system/tokens.css`, which imports `recipes.css`.

**Pairs** in `src/recipes/pairs.ts`:

```ts
// Logo
{ recipe: "logo", slot: "ink", fg: "logo.ink", bg: "ds:surface.canvas", floor: UI },
{ recipe: "logo", slot: "small dot", fg: "logo.dot-small", bg: "ds:surface.canvas", floor: UI },
```

The "Not listed" paragraph of the header comment gains: "`logo.dot`, the master dot (`brand.signature`; 2.3 on the light canvas under Friendly): a logotype's accent is decoration and the ring carries the shape; WCAG 1.4.11 does not apply to a logotype." In the scratch run, under all six boundaries, `logo.ink` reaches at least 14.0 on the canvas and `logo.dot-small` at least 6.1 (section 13).

## 4. The public API (`logo-api-1`)

**Confirmed as the spec states it:**

- `Logo` and `LogoProps`, with `kind`, `height`, `tone`, `decorative` and `className` and the spec's defaults;
- no colour, stroke, ground or width prop;
- the recipe class `ds-logo` with `data-kind`, `data-form` and `data-tone`;
- six stories under `Base/Logo`.

```ts
export type LogoKind = "mark" | "wordmark" | "horizontal" | "stacked";
export type LogoTone = "full" | "one-colour";

export interface LogoProps {
  /** Default "horizontal". */
  kind?: LogoKind;
  /** Rendered height in CSS px of the kind's whole viewBox (logo-size-1). Default 24. */
  height?: number;
  /** Default "full". */
  tone?: LogoTone;
  /** Default false: an image named from the locale catalog. True: hidden from assistive tech. */
  decorative?: boolean;
  /** Layout only (margin, self-alignment). */
  className?: string;
}
```

**Amendments.** The spec's `logo-api-1` carries amendments 1 to 4 (F4). Amendment 5 is a design detail and stays here.

1. `LogoKind` and `LogoTone` are exported types beside `LogoProps`, as `BadgeVariant` sits beside `BadgeProps`, so a caller can type a value it passes through.
2. A `height` that is not a finite number renders at the default 24, and then the kind's minimum applies. `logo-size-1` covers small values only; without this rule, `NaN` or `Infinity` would reach the markup.
3. The props are closed. `LogoProps` extends no SVG or HTML attribute type, and the component spreads nothing, so `style`, `fill`, `stroke`, `width` and `color` cannot be passed. `Badge` spreads its HTML attributes; the Logo does not, because `logo-api-1` forbids colour, stroke, ground and width.
4. A `wordmark` has no ring, so its `data-form` is always `master`. The form changes only the ring stroke (`logo-size-1`).
5. The rendered markup is fixed (below), and the generated files use the same drawing function (§5).

Not exported: the geometry module, the drawing function, the form function and the asset module. `Logo` reads its name through `useMessages()`, so `Logo.tsx` starts with `"use client"`, as `Progress.tsx` does. The root layout and `/account` are server components and render it as they render `LocaleSwitch`. `src/components/index.ts` gains `Logo`, `type LogoKind`, `type LogoProps` and `type LogoTone`.

**Sizing**, in `geometry.ts`, where `round2(x)` is `Math.round(x * 100) / 100`:

- `h = round2(max(MINIMUM[kind], Number.isFinite(height) ? height : 24))`, with `MINIMUM` 16 for `mark`, 20 for `wordmark`, 20 for `horizontal` and 50 for `stacked`.
- `w = round2(h * viewBoxWidth / viewBoxHeight)` (W4).
- `m = h` for `mark` and `horizontal`, and `h * 150 / 375` for `stacked`. A `wordmark` has no `m`.
- The form: `m < 20` is `"16"` (stroke 34), `m <= 24` is `"24"` (stroke 32), and anything above is `"master"` (stroke 30). A `wordmark` is `"master"` (W3). The form is taken from `h` after rounding, so the markup's `height` and its form always agree.

**Rendered markup.** This is React's static output for `<Logo kind="mark" height={16} />`. The drawing function fixes the attribute order:

```text
<svg xmlns="http://www.w3.org/2000/svg" class="ds-logo" data-kind="mark" data-form="16" data-tone="full" viewBox="0 0 150 150" width="16" height="16" role="img" aria-label="ORIVILO"><path class="ds-logo__ring" d="M 70.42 25.2 A 52.5 52.5 0 1 0 125.71 63.91" fill="none" stroke-width="34" stroke-linecap="round"></path><circle class="ds-logo__dot" cx="105.11" cy="34.49" r="15"></circle></svg>
```

- The wordmark is drawn in two groups, with the numbers of `orivilo-wordmark.svg`:
  - `<g class="ds-logo__strokes" fill="none" stroke-width="24" stroke-linecap="butt" stroke-linejoin="round">` holds both `o` circles, the `r`, both `i` stems and the `l`;
  - `<g class="ds-logo__fills">` holds the `v` polygon and both i-dots.
- `horizontal` draws the mark at the origin and the wordmark in `<g transform="translate(190 45)">`.
- `stacked` draws the mark in `<g transform="translate(161.5 0)">` and the wordmark in `<g transform="translate(0 270)">` (W5).
- Named: `role="img"` and an `aria-label` from the catalog key `logo.name`. Decorative: `aria-hidden="true"`, with no role and no label. There is no `<title>`, so there is one name and no tooltip.
- The markup carries no colour: no `fill` attribute other than `none`, and no `stroke` or `style` attribute. Colour comes only from the recipe (`logo-asset-1`: no hex in a component).
- `className` is joined after `ds-logo` with `cx`, as `Badge` does.

**Locale catalog.** `logo: { name: "ORIVILO" }` goes into `src/i18n/messages/th.ts` and `en.ts` (copy table; open question 8). `check-i18n` guards key parity.

**Gate lines that do not apply.**

- The fixture line of DESIGN.md §11 and the design-system rule (Thai, Latin, a long Thai name, a missing value) is not applicable: the Logo has no text slot, and its one string is the accessible name, the same in both locales.
- The Logo has no interactive state, so DESIGN.md §7 reduces to the default state.
- It has no behaviour, so it uses no Radix primitive, as with `Badge` and `Kbd`.

## 5. Asset form and the generated files

### Inline SVG from a typed module (`logo-geometry-1`)

`src/components/logo/geometry.ts` holds every number of the three brand files as typed data:

- the `viewBox`es, the path `d` strings, the circle centres and radii, and the polygon points;
- the caps and joins, the wordmark stroke and the lockup transforms;
- `MINIMUM`, the stroke per form and the sizing functions of §4.

It imports types only. A unit test parses `docs/context/brand/assets/orivilo-mark.svg`, `orivilo-wordmark.svg` and `orivilo-lockup.svg` and fails when any number differs. The test ignores the colours in those files, because the tokens own colour.

Rejected:

- **Importing the brand files** (SVGR, `<img src>`, `fetch`). Their colours are fixed hex, so profiles, modes and `logo-colour-1` cannot apply. The small forms need a different stroke per height (`logo-size-1`), and an `<img>` cannot take the recipe.
- **Paths copied by hand into JSX.** Nothing would catch drift from the artwork.

### One drawing function for the component and the files

`src/components/logo/drawing.ts` exports `logoSvg(options, geometry = GEOMETRY)`. It builds the `<svg>` element tree from `geometry.ts` with React's `createElement` and no hooks.

- `Logo.tsx` calls it with the name from `useMessages()`.
- The generator calls it with no name (decorative) and renders the result with `renderToStaticMarkup` from `react-dom/server`, then inserts a `<style>` element after the opening tag. So the files are exactly what the component renders.
- `drawing.ts`, `geometry.ts` and `assets.ts` use explicit `.ts` import paths and no JSX, so `node scripts/*.ts` loads them with type stripping, as `scripts/check-contrast.ts` loads `src/tokens/index.ts`.

### The four files (`logo-icon-1`)

<!-- prettier-ignore -->
| File | What | Colours read (neutral token source) |
| --- | --- | --- |
| `apps/web/app/icon1.svg` | The mark at height 16 (form 16), on a transparent ground. Its `<style>` sets the ring and dot for light, then again inside `@media (prefers-color-scheme: dark)` | Ring `text.primary` and dot `brand.dot-small`, through `logo.ink` and `logo.dot-small`: light values, then dark |
| `apps/web/app/icon2.png` | 32 by 32 app icon: a `<rect>` with `rx` 7.33 (side × 22 / 96); a 21.33 mark box centred at offset 5.34 inside a `<g transform>`; form 24 (W3, W7) | Ground `surface.inverse`, ring `text.on-inverse`, both light values; dot: the dark value of the token the form picks (`logo-colour-1`), here `brand.dot-small` (section 13) |
| `apps/web/app/apple-icon.png` | 180 by 180 app icon: `rx` 41.25, a 120 mark box at offset 30, master form | The same as `icon2.png`; the master form's dot is the dark value of `brand.signature` |
| `packages/design-system/.storybook/static/orivilo-logo.svg` | `horizontal` at height 24 (width 106.08, form 24) | `logo.ink` and `logo.dot-small`, light values only |

Next adds the head links from the file names (app-icons.md lines 64 to 68):

- `icon1.svg` gives `<link rel="icon" type="image/svg+xml" sizes="any">`;
- `icon2.png` gives `type="image/png" sizes="32x32"`;
- `apple-icon.png` gives `<link rel="apple-touch-icon" sizes="180x180">`.

Numbered icons sort lexically, so the SVG comes first. The proxy runs on these paths, because its matcher skips only `_next/static`, `_next/image` and `favicon.ico`. The CSP's `img-src 'self'` covers them.

The generator resolves each colour through the `TokenSet`, with `set.resolve(set.get(layer, path), mode).value`. A missing token, or one that is not a colour, throws with its path and never falls back. The app icon reads semantic tokens directly: it is a generated file, not a recipe, so it needs no component token.

### Rasteriser

`@resvg/resvg-wasm` goes into `packages/design-system` `devDependencies` at an exact version (the repo pins every dependency). It is initialised once per process, with its `.wasm` file resolved from the package.

- **Why it gives byte-stable output.** It is a WebAssembly build of resvg, so the same binary runs on every platform, with the PNG encoder inside the module. The drawing has no text, so no font is loaded. The output should therefore be byte-stable between the Mac that commits the files and the Linux CI runner. The first slice B CI run proves it (§12, risk 1).
- **Licence.** Believed MPL-2.0, as resvg-js publishes it. The builder confirms it from the installed `package.json` and names it in the PR.
- **Where it is used.** Only by the generator and its test, at build time. It is never a runtime dependency.

Rejected:

- **Next code icon routes** (`icon.tsx` with `ImageResponse`). Nothing would be committed to compare (`logo-asset-1`), the Storybook image would need a second path, and the rasteriser would be Next's internal copy.
- **`sharp`** (already in the lockfile through Next). It uses native libvips and librsvg builds per platform, so PNG bytes can differ between the Mac and the CI runner, and a byte comparison would flake.

### The command and the freshness test (`logo-asset-1`)

- `src/components/logo/assets.ts` holds two functions:
  - `logoAssetFiles(set = tokens, geometry = GEOMETRY)` returns `{ path, bytes }[]` for the four files, with paths from the repo root;
  - `staleAssets(files, readCommitted)` returns the paths whose committed bytes differ or are missing.
- The module is pure apart from the wasm initialisation: no `Date` and no randomness, numbers printed with at most two decimals, LF line ends.
- `scripts/build-logo-assets.ts` writes the four files. `package.json` gains the script `"logo-assets": "node scripts/build-logo-assets.ts"`.
- `src/components/logo/assets.test.ts` regenerates the files in memory and fails with the stale paths and the command (row 21). It never writes a file.

### Storybook brand (row 22)

- `.storybook/main.ts` gains `staticDirs: ["./static"]`.
- `.storybook/manager.ts` (new) calls `addons.setConfig({ theme: create({ base: "light", brandTitle: "ORIVILO", brandImage: "./orivilo-logo.svg" }) })`. `addons` comes from `storybook/manager-api` and `create` from `storybook/theming/create`. A relative image path also resolves when the site is served from a sub-path.
- `base: "light"` pins the manager to light. By default Storybook follows the OS scheme, and on a dark sidebar the light-valued image would lose its ink ring. This is the one manager colour change, and the brand image needs it (F5).

## 6. Determinism and conflicts

Determinism:

- `geometry.ts` sizing is pure: the same `kind` and `height` always give the same `h`, `w`, `m` and form. The tests for rows 3 and 5 run the same inputs twice in one case.
- `logoAssetFiles()` gives equal bytes when called twice, and its output equals the committed files on the Mac and on the CI runner (row 21).
- No resolved design value depends on time, randomness, the network or the locale. The name is the only locale input, and it is not drawn.

Conflicts (a required value is never changed silently):

- A profile that leaves `brand.dot-small` at the shell's value fails `Profile.validate`. The existing case "a profile that leaves an identity token at the shell's value" in `profiles.test.ts` iterates `IDENTITY_OVERRIDES`, so adding the token to that fixture makes the case cover it.
- A profile value under 3.0 on its canvas fails `pnpm contrast`, `contrast-pairs.test.ts` and CI.
- A reader of `brand.dot-small` other than `logo.dot-small` fails `tokens.test.ts`, which requires `componentsReading(["brand.dot-small"])` to equal `["logo"]`.
- A colour literal in the recipe fails `recipes.test.ts`, and a colour attribute in the component fails the markup case in `logo.test.ts`.
- A missing or non-colour token in the generator throws with its path.
- Under neutral, `brand.signature` and `action.primary` must resolve to one hex in each mode, each straight to its primitive, and no component may read both. A change to either value, a reference from one to the other, or a shared reader fails `tokens.test.ts` (section 13).

## 7. Tests by acceptance row

**Where plays run.** Plays run in the Storybook test project: Chromium, test locale Thai, initial mode light, profile neutral. Each story runs there once, so a play cannot switch the toolbar (D9). The dark halves of rows 2 and 4 are therefore asserted in the neutral dark cell of "Recipes and modes", which renders the same kinds and all three forms under a dark boundary. The contact sheet (R1) shows "Kinds" and "Small sizes" in dark mode through the toolbar.

**Paint checks.** A paint check reads the computed style of each part. Per L-0018, it also reads the rendered pixel through a new shared helper, `expectPaintAt(svg, probes)`, in `src/testing/visual-asserts.ts`:

- It maps points in the svg's `viewBox` units to page pixels.
- It takes one screenshot under the existing `orivilo-screenshot` lock.
- It compares each pixel with a hex value, allowing a summed RGB difference of 12.

Probe points, in drawing units:

- mark: the ring at (22.5, 77.5) and the dot at (105.11, 34.49);
- wordmark: the `o` stroke at (12, 50) and an i-dot at (182, -25);
- stacked lockup: the mark's points shifted by (161.5, 0).

The smallest probed part is the dot at height 16, with a radius of 1.6 px. That is more than the 1.41 px diagonal of a pixel, and every probed stroke is at least 3.2 px wide. So the pixel holding a probe point lies wholly inside its part, and no anti-aliasing reaches it.

**Story content.** Each story fits the 328 px content column of a 360 px viewport (Storybook's padded layout) and the 262 px content box of a `Matrix` cell at that width.

- "Kinds": the four kinds at height 64 (widths 64, 201.81, 282.88 and 80.73).
- "Small sizes": the mark at 12, 16, 19.9, 20, 24, 24.1, 32 and 120.
- "One colour", through `Matrix`: `tone="one-colour"` on mark 16, mark 64, horizontal 24, wordmark 20 and stacked 80.
- "Named": `<Logo />`.
- "Decorative": `<Logo decorative />`.
- "Recipes and modes", through `Matrix`: mark 16, mark 24, mark 64, horizontal 32 (141.44 wide), wordmark 20 and stacked 80.

<!-- prettier-ignore -->
| Row | File | Test | What it asserts |
| --- | --- | --- | --- |
| 1, unit | `src/components/logo/logo.test.ts` (new) | "draws each kind as logo-geometry-1 and the brand files" | Each kind's `viewBox`, and every `d`, centre, radius, polygon point, cap and join, the wordmark stroke 24 and the lockup transforms, equal the numbers parsed from the three brand files. The stacked transforms equal W5. W1 (both arc ends 52.50 from (75, 77.5)) and W2 (gaps 5.91, 4.91 and 3.91) are computed from the module's numbers |
| 1, play | `Logo.stories.tsx` "Kinds" | play | Four `svg.ds-logo` with the four `data-kind` values, boxes 64 high at the widths above. Computed ring and wordmark stroke #16151D and master dot #7A22C7. `expectPaintAt` on the mark's ring and dot |
| 2 | "Recipes and modes" | play, neutral dark cell | The master forms (mark 64, horizontal 32, wordmark 20, stacked 80): computed ring and wordmark stroke #F2F1EC and dot #B07FEE (W6's source values). `expectPaintAt` on ring and dot |
| 3 | "Small sizes"; `logo.test.ts` "picks the form from the mark height" | play; unit | Play: for the eight heights, `data-form` and the ring's `stroke-width` attribute follow W3 (`34 34 34 32 32 30 30 30`), and the dot is #7A22C7 in every form (section 13), both computed and by `expectPaintAt`. The switch between `logo.dot` and `logo.dot-small` stays proven by row 9 in the Friendly light cell, where the small forms paint coral.700 #972F1D and the master coral.400 #FC826B. Unit: the same inputs through the form function, plus stacked 60 (form 24) and 60.25 (master) |
| 4 | "Recipes and modes" | play, neutral dark cell | Mark 16 and mark 24: `stroke-width` 34 and 32, and the dot #B07FEE, both computed and by `expectPaintAt` |
| 5 | `logo.test.ts` "never renders below the kind's minimum" | unit (`renderToStaticMarkup`) | Mark 12 renders `height="16"`, wordmark 10 renders 20, horizontal 10 renders 20, stacked 30 renders 50. `NaN` and `Infinity` render the larger of 24 and the minimum; 0 and -5 render the kind's minimum |
| 6 | "One colour" | play, all six cells | For every Logo of the four kinds, each painted part (the ring or wordmark strokes, the dot or the fills) has the same computed colour, equal to the cell's resolved `logo.ink`. `expectPaintAt` shows the dot equal to the ring in the neutral light and dark cells |
| 7 | "Named"; `logo.test.ts` "names the image from the catalog" | play (Thai); unit | Play: `getByRole("img", { name: "ORIVILO" })` finds exactly one. Unit: inside `LocaleProvider` `th` and `en`, `role="img"` and an `aria-label` equal to `th.logo.name` and `en.logo.name` |
| 8 | "Decorative"; the a11y addon | play; every story | No element has role `img`. The svg has `aria-hidden="true"` and no `aria-label`. The six stories report zero violations (the project runs a11y as an error) |
| 9 | "Recipes and modes" | play, all six cells | Each Logo's `getBoundingClientRect()` is the same in all six cells and equals W4 within 0.01 (horizontal 32 is 141.44 by 32). Computed paints equal the values the token source resolves for the cell: `logo.ink`, and `logo.dot` or `logo.dot-small` by `data-form`, under neutral, Professional and Friendly |
| 10 | `pnpm contrast`; `contrast-pairs.test.ts`; `recipes.test.ts`; `tokens.test.ts`; `profiles.test.ts` | script; unit | `pnpm contrast` passes with the new pair under the six boundaries (output attached to the PR). The pair key `brand.dot-small\|surface.canvas` exists. The two logo recipe pairs pass under all six. The identity list has nine tokens. `componentsReading(["brand.dot-small"])` is `["logo"]`. The identity case covers `brand.dot-small` |
| 11 | `tests/check-catalog.test.ts` | unit | `catalog/base/logo.yaml` holds: `name: Logo`, `tier: base`, `status: stable`, `since: ORV-118`, `import: "@orivilo/design-system"`, `story: base-logo`, `contract: LogoProps`, `variants: [mark, wordmark, horizontal, stacked]`, `sizes: [form-16, form-24, master]`, `states: [default]`, `recipes: [neutral, professional, friendly]` and `examples: []`. Its `rules` lines cover `logo-scope-1`, `logo-screen-1`, and height and clear space; its `a11y` lines cover named and decorative. `coverage.md` has the Base row "Logo, stable, base-logo" |
| 12 | `apps/web/app/layout.test.tsx` (new), Thai | unit (`renderToStaticMarkup`) | The nav's first link has `href="/"` and `aria-label="ORIVILO หน้าแรก"`. It holds one `svg.ds-logo` with `data-kind="horizontal"`, `height="24"`, `width="106.08"`, `aria-hidden="true"` and no role, and no text. The markup has no `bg-brand-signature`. The Studio and Account links follow it |
| 13 | `layout.test.tsx`, English; R2 | unit; evidence | The link is named "ORIVILO home". R2 shows the dark colours (the mode is CSS, not markup) |
| 14 | R2 | scripted run | At 360 px, in Thai and English, on `/`, `/directions`, `/account` and `/workspace`: the header svg box is 106.08 by 24 (within 0.01), and `document.documentElement.scrollWidth <= innerWidth`. No painting element other than the Logo and its ancestors has a box that meets the Logo box grown by 4.8 px. A painting element is a text node's parent, a link, a button, a form control, an image or svg, or an element with a visible border or background |
| 15 | `apps/web/app/account/page.test.tsx` (widened), Thai | unit | Signed out: an svg with `role="img"`, `aria-label="ORIVILO"`, `data-kind="stacked"` and `height="80"` comes before the `h1` "บัญชีและเวิร์กสเปซ". The sign-in form comes after the `h1` (the `SignInForm` mock renders a marker element) |
| 16 | `page.test.tsx`, English | unit | The same svg comes before the `h1` "Account and workspace" in the signed-in view (`getSession` returns a session; `withWorkspace` is mocked) and in the not-configured view (`auth()` throws `MissingEnvError`) |
| 17 | `src/components/logo/assets.test.ts` (new); R2 | unit; evidence | Unit: `icon1.svg` is the mark with `data-form="16"` and `stroke-width="34"`. Outside the media block the ring is #16151D and the dot #7A22C7; inside `@media (prefers-color-scheme: dark)` they are #F2F1EC and #B07FEE. R2: the head has `<link rel="icon" type="image/svg+xml" sizes="any">` to the file, the file is fetched with 200 and `image/svg+xml`, and it is rendered under `colorScheme: "light"` |
| 18 | As row 17 | unit; evidence | Unit: the dark block. R2: the file is rendered under `colorScheme: "dark"` |
| 19 | `assets.test.ts`; R2 | unit; evidence | Unit: the `icon2.png` IHDR is 32 by 32. In the in-memory render, corner (0, 0) is transparent, the centre is #16151D, the dot centre #B07FEE and a ring point #F2F1EC. R2: `<link rel="icon" type="image/png" sizes="32x32">`, fetched with 200 |
| 20 | `assets.test.ts`; R2 | unit; evidence | Unit: the `apple-icon.png` IHDR is 180 by 180, with the same four probes. R2: `<link rel="apple-touch-icon" sizes="180x180">`, fetched with 200 |
| 21 | `assets.test.ts` "the committed assets are fresh" | unit | Regenerated bytes equal the four committed files; otherwise the failure lists each stale path and the command. With the light value of `brand.dot-small` changed in a `TokenSet` built from a copy of the sources, exactly `apps/web/app/icon1.svg` and `.storybook/static/orivilo-logo.svg` are stale. With the dark value of `brand.dot-small` changed, exactly `icon1.svg` and `icon2.png` are (the 32 px icon is form 24); with the dark value of `brand.signature` changed, exactly `apple-icon.png` is (section 13). With the dot radius changed in a copy of the geometry, all four are. Two generations give equal bytes |
| 22 | `assets.test.ts` "the Storybook brand reads the generated image"; R2 | unit; evidence | Unit: `.storybook/manager.ts` sets `base: "light"`, `brandTitle: "ORIVILO"` and `brandImage: "./orivilo-logo.svg"`. `.storybook/main.ts` has `staticDirs: ["./static"]`. The image has `data-kind="horizontal"`, `height="24"`, `data-form="24"` and the dot #7A22C7. R2: after `pnpm build`, `storybook-static/orivilo-logo.svg` exists; plus a screenshot of the sidebar |

**R2 setup.** R2 runs on a production build: `pnpm build`, then `pnpm --filter @orivilo/web exec next start -p 3100`. The owner's dev server keeps port 3000. It runs Playwright Chromium from a scratch script.

**R2 extra checks.** R2 also renders:

- rows 12 and 13 at 1280 px, Thai in light and English in dark, with the lockup 24 high before the Studio and Account links;
- the `/account` lockup's clear space (`m` 32, so 6.4 px).

**R2 output.** Its output and screenshots go into the slice B G3 packet and the `logo-render-1` contact sheet. Headless Chromium cannot show a real tab, so rows 17 and 18 show the favicon file rendered under each scheme. The designer checks one real tab in each scheme at visual sign-off.

## 8. Build order

One builder deliverable per task.

- Each task runs its affected tests (`.claude/rules/testing.md`).
- The last task of each slice runs the full gate.
- A task that adds a guard proves each clause red and then restores it, with one `verified` row per clause (L-0042).

<!-- prettier-ignore -->
| Task | Slice | Deliverable | Files | Tests (acceptance rows) | Needs |
| --- | --- | --- | --- | --- | --- |
| A1 | A | The small-dot token and the `logo` component tokens, with their contract text (§2, §3) | `src/tokens/source/semantic.json`; `source/component.json`; `src/profiles/source/professional.json`; `friendly.json`; `src/tokens/generated.css` and `src/profiles/generated.css` (both from `pnpm --filter @orivilo/design-system tokens`); `src/tokens/contrast-pairs.ts`; `contrast-pairs.test.ts`; `tokens.test.ts`; `src/profiles/profiles.test.ts`; `src/foundations/profiles.stories.tsx` (the runtime probe gains the override); DESIGN.md lines 32, 78 to 79, 209 and 289 and the change log entry (§10) | Row 10, token half: `pnpm contrast` output; the pair key; the identity list of nine; the one reader; the identity case red with the Professional override taken out, then restored | none |
| A2 | A | The geometry module (§4 sizing, `logo-geometry-1`) | `src/components/logo/geometry.ts`, `logo.test.ts` (geometry cases) | Row 1 (unit), row 3 (the form table), row 5 (sizing); W1 to W5 from the module; one mutation per minimum, per form bound and per stroke | none |
| A3 | A | The drawing, the `Logo` component, the recipe, the pairs, the catalog string and the exports | `src/components/logo/drawing.ts`; `Logo.tsx`; `src/recipes/recipes.css`; `src/recipes/pairs.ts`; `src/i18n/messages/th.ts`; `en.ts`; `src/components/index.ts`; `logo.test.ts` (render cases) | Row 5 (rendered height), row 7 (unit), row 8 (attributes), row 10 (recipe pairs in `recipes.test.ts`); no colour in the markup; `check-i18n` | A1, A2 |
| A4 | A | The `expectPaintAt` helper | `src/testing/visual-asserts.ts`; `visual-asserts.test.ts` (the pure point mapping); `visual-asserts.stories.tsx` (the helper rejects a wrong colour) | The red case and the mapping; no acceptance row of its own | none |
| A5 | A | The six stories with their plays | `src/components/logo/Logo.stories.tsx` | Rows 1, 2, 3, 4, 6, 7, 8 and 9; zero a11y violations | A3 and A4; the designer has read the Untitled UI page and corrected the benchmark row (open question 9) |
| A6 | A | The catalog entry, the coverage row and the DESIGN.md §12 Logo row | `catalog/base/logo.yaml`; `catalog/coverage.md`; DESIGN.md §12 | Row 11; the design gate walk | A5 |
| R1 | A | The contact sheet, then the slice A review (`logo-render-1`) | none (a Jira comment by the main session) | Rows 1 to 9, light and dark, each story at 360 px | A5 |
| B1 | B | The asset module, the command, the generated files and the freshness test (§5) | `src/components/logo/assets.ts`; `assets.test.ts`; `scripts/build-logo-assets.ts`; `package.json` (the `logo-assets` script and `@resvg/resvg-wasm`, pinned); `pnpm-lock.yaml`; the generated `apps/web/app/icon1.svg`, `icon2.png` and `apple-icon.png` and `packages/design-system/.storybook/static/orivilo-logo.svg`; the DESIGN.md §12 Logo row (generated assets) | Rows 17 to 21 (file halves); two generations equal; `vitest run --testTimeout=400` on the file, with the file's `HEAVY_TIMEOUT` on any case the wasm start pushes over it | Slice A merged |
| B2 | B | The header lockup | `apps/web/app/layout.tsx`: the dot and `{m.app.title}` give way to `<Logo decorative />`. The link keeps `aria-label={m.app.home}` and drops `gap-2`, `text-text-primary` and the hover colour, which reach nothing once the text is gone. `apps/web/app/layout.test.tsx` (new) | Rows 12 and 13 (markup) | Slice A merged |
| B3 | B | The `/account` lockup | `apps/web/app/account/page.tsx` (`<Logo kind="stacked" height={80} />` first in `main`; the page already imports from the package); `page.test.tsx` | Rows 15 and 16 | Slice A merged |
| B4 | B | The Storybook brand | `.storybook/main.ts`; `.storybook/manager.ts` (new); `assets.test.ts` (the row 22 case) | Row 22 (config and image) | B1 |
| R2 | B | The evidence run and contact sheet | none (a scratch script, the G3 packet, a Jira comment) | Rows 12 to 20 and 22 in the browser; row 14 measured | B1 to B4 |

A2 and A4 can run beside A1. B2 and B3 do not need B1 and can run beside it. `app.title` stays in the catalog, because `generateMetadata` still reads it.

## 9. Size and slices

Estimated changed lines, with tests:

<!-- prettier-ignore -->
| Slice | Tasks (lines) | Total |
| --- | --- | --- |
| A | A1 95, A2 220, A3 210, A4 70, A5 230, A6 30 | about 855 |
| B | B1 340 plus two PNG files, B2 70, B3 60, B4 20 | about 490 |

Both slices are over the 400-line guide. Whether to split them is decided in the spec's Story section, paragraph "Size".

## 10. Impact list

This list predates comment 10336. The contract change of comment 10336 has its own impact list in section 13.

### Contract change

- A new semantic token `brand.dot-small`: identity scope, both modes, paired with `surface.canvas` at 3.0.
- New component tokens `logo.ink`, `logo.dot` and `logo.dot-small`, a new recipe `ds-logo`, and two recipe pairs.
- A new public API (`Logo`, `LogoProps`, `LogoKind`, `LogoTone`) and a new catalog key `logo.name`.

### Files, by layer

All `src/`, `catalog/`, `scripts/` and `.storybook/` paths are under `packages/design-system/`.

<!-- prettier-ignore -->
| File | Change |
| --- | --- |
| `src/tokens/source/semantic.json` | `brand.dot-small`; the `brand.signature` description |
| `src/tokens/source/component.json` | The `logo` group |
| `src/tokens/generated.css` | 7 new lines: `--ds-brand-dot-small` for light, dark and system dark; `--cmp-logo-ink`, `--cmp-logo-dot` and `--cmp-logo-dot-small`; `--color-brand-dot-small` |
| `src/profiles/source/professional.json`, `friendly.json` | The override |
| `src/profiles/generated.css` | 3 lines per profile (light, dark, system dark) |
| `src/tokens/contrast-pairs.ts` | One `PAIR_RULES` entry |
| `src/recipes/recipes.css`, `src/recipes/pairs.ts` | The `ds-logo` block; two pairs and the header comment |
| `src/components/logo/` (new) | `geometry.ts`, `drawing.ts`, `Logo.tsx`, `Logo.stories.tsx`, `logo.test.ts`, `assets.ts`, `assets.test.ts` |
| `src/components/index.ts`, `src/i18n/messages/th.ts`, `en.ts` | The exports; `logo.name` |
| `src/testing/visual-asserts.ts`, with its test and stories | `expectPaintAt` |
| `catalog/base/logo.yaml` (new), `catalog/coverage.md` | The entry; the Base row |
| `scripts/build-logo-assets.ts` (new), `package.json`, `pnpm-lock.yaml` | The command; the dev dependency |
| `.storybook/main.ts`, `.storybook/manager.ts` (new), `.storybook/static/orivilo-logo.svg` (generated) | The Storybook brand |
| `apps/web/app/layout.tsx`, `apps/web/app/account/page.tsx` | The two placements |
| `apps/web/app/icon1.svg`, `icon2.png`, `apple-icon.png` (generated) | The favicon and app icons |

### Profiles, recipes, components and screens that change

- **Profiles.**
  - Neutral gains the token, and Professional and Friendly override it.
  - `refineProfile` swaps only the shape, type and motion groups, so a refined profile keeps the override.
  - The runtime probe in Foundations/Profiles gains the override. Without it the probe still renders, but it carries ORIVILO's violet and lime, and no play checks that.
  - A resolved customer profile (E2-9, not built yet) must override `brand.dot-small` like every identity token, and `Profile.validate` enforces it.
- **Recipes.** `ds-logo` is new; no existing recipe changes.
- **Components.** `Logo` is new. Direction Studio's trace lists "logo" among the components a profile's overrides reach (`componentsReading`), and its token list shows a `brand.dot-small` line. Both are visible text that no test pins.
- **Screens.**
  - The app header on every page, `/account` in three views, the browser tab, the home-screen icon and the Storybook sidebar.
  - The Foundations pages Semantic, Component tokens and Profiles show the new tokens.
- **`packages/intent-engine`.** No change: `rules.ts` names hue families, not tokens.

### Tests that change

- `tokens.test.ts`: the identity list and the one-reader case.
- `profiles.test.ts`: `IDENTITY_OVERRIDES`.
- `contrast-pairs.test.ts`: the pair key line.
- `recipes.test.ts`: no code change; it runs the new pairs.
- `apps/web/app/account/page.test.tsx`: the three views and the sign-in marker.
- `visual-asserts.test.ts` and `visual-asserts.stories.tsx`: the helper.

### Documents to bring up to date

These are outside this task's write set; the last column names the task that edits each one, or the spec version that already made the edit. "Today" is the text before ORV-118. For the spec rows, the line number is where the edit sits in the spec, and "After ORV-118" is the wording these notes proposed; the spec's own wording holds.

<!-- prettier-ignore -->
| File and line | Today | After ORV-118 | Brought up to date in |
| --- | --- | --- | --- |
| `docs/specs/ORV-118/spec.md:17` (row 1) | "at height 96" | "at height 64" (F1) | Spec v1.1 |
| `docs/specs/ORV-118/spec.md:18`, `:20`, `:23` (rows 2, 4, 7) | "The same story in dark mode"; "Story "Small sizes", dark mode"; "locale Thai, then English" | Each adds where it is asserted: the neutral dark cell of "Recipes and modes" for rows 2 and 4, a unit test for row 7's English half (F6) | Spec v1.1 |
| `docs/specs/ORV-118/spec.md:30` (row 14) | "A Playwright test measures the bounding boxes" | "A scripted Playwright run on a production build (webapp-testing) measures the bounding boxes; its output is in the G3 packet" (F2) | Spec v1.1 |
| `docs/specs/ORV-118/spec.md:124` (`logo-api-1`) | The `LogoProps` line, without the type exports | Adds the `LogoKind` and `LogoTone` exports, the fallback for a `height` that is not a finite number, and closed props (F4) | Spec v1.1 |
| `docs/specs/ORV-118/spec.md:126` (`logo-api-1`) | "`data-form` (`16`, `24`, `master`)" | Adds "a wordmark is always `master`" (F4) | Spec v1.1 |
| `docs/specs/ORV-118/spec.md:202` (Out of scope) | "Storybook manager colours and fonts beyond the brand image and title." | "Storybook manager colours and fonts beyond the brand image, its title and the light base the image needs." (F5) | Spec v1.1 |
| `docs/specs/ORV-118/spec.md:210` (open question 1) | "`ds-architect` confirms the name.", with an impact list that leaves out `component.json`, `tokens.test.ts`, `profiles.stories.tsx`, `recipes.css`, `pairs.ts` and DESIGN.md §8 and §12 | "Decided in the tech notes: `brand.dot-small` confirmed; the full impact list is there" (F3) | Spec v1.1 |
| `DESIGN.md:32` (§3.1) | "Eight are identity-scoped (`text.link`, `text.link-hover`, `text.brand`, `surface.selected`, `selection.bg`, `selection.fg`, `brand.signature`, `brand.ink`)" | "Nine are identity-scoped (..., `brand.signature`, `brand.ink`, `brand.dot-small`)" | A1 |
| `DESIGN.md:78` (§3.1 table) | `brand.signature`: "Mark dot, one highlight plane; never text on light ground" | "Mark dot above 24 px, one highlight plane; never text on light ground"; plus a new row after line 79: `brand.dot-small`, violet.600 #7A22C7, lime.300 #D9F66F, "surface.canvas, 3", "The mark's dot at 24 px and below; read only by `logo.dot-small`" | A1 |
| `DESIGN.md:209` (§8) | "Brand presence, `brand.signature`, any feedback, any action" | "Brand presence, `brand.signature` and `brand.dot-small` (the mark's small dot only), any feedback, any action" | A1 |
| `DESIGN.md:289` (§12) | "61 pairs" (already stale: 96 at `eeb2e71`) | "97 pairs" | A1 |
| `DESIGN.md` change log | No entry | The next entry, naming the contract change and "Downstream: every profile overrides `brand.dot-small`" | A1 |
| `DESIGN.md` §12 | No Logo row | A Logo row: component, tokens, recipe and plays (A6); generated assets and the command (B1); "not screened" (`logo-screen-1`) | A6, B1 |

`.claude/rules/design-system.md:20` names the identity scope but lists no tokens, so it stays as it is.

## 11. Is an ADR needed?

No.

- The identity scope, the token layers and the recipe and pair checks already exist (DESIGN.md §3.1, §5 and §9 item 10, `Profile.validate`, `recipes.test.ts`). This story adds names inside them and records the contract change in DESIGN.md's change log.
- The generated files follow the pattern of `generated.css`, `commands/generated.ts` and `blocks/generated.ts`: the committed output of one command, with a test that fails when it is stale.
- `@resvg/resvg-wasm` is a dev dependency for the generator and its test. It does not change the production stack (ADR 0001) and is not a runtime dependency, so ADR 0015's dependency clause does not require the `security` role. The main session may still dispatch it.

## 12. Risks and follow-ups

1. **PNG bytes across platforms (risk).** The design expects the WebAssembly rasteriser to give the same bytes on the Mac and on the Linux runner, and the first slice B CI run proves it. If it does not, the freshness test compares decoded pixels for the two PNGs instead of bytes, and the B1 builder reports that as a deviation.
2. **Local cache (risk).** `turbo.json` sets no `inputs`, so the design-system `test` task hashes only its own package. After an edit to `apps/web/app/icon*` or `docs/context/brand/assets` alone, a local cache hit can skip the freshness and geometry tests. CI starts without a cache, and `pnpm test --force` reruns locally. Follow-up: a package `turbo.json` with those inputs.
3. **Trademark (`logo-screen-1`).** The mark may merge into `develop` and run on staging. A release that carries it to production, to the app or to a production Storybook site, waits for the screening record on ORV-118.
4. **Follow-up: a permanent e2e suite.** An `apps/web/e2e` suite for row 14 and the head links. It changes CI, which waits for the owner's approval during the POC.
5. **A violet brand badge reads like a button (risk, section 13).** Under neutral in light mode, `Badge` variant `brand` now has the same ground and label colours as the primary button. The designer checks the recommended badge in Direction Studio at sign-off.
6. **Follow-up: the colour node on ORIVILO's own brief.** `packages/intent-engine` `color-rules.test.ts` ("ORIVILO decides lime, near, soft") and the knowledge entry that keeps the action colour apart from the signature (`color-knowledge.ts`, sourced from brand spec v1.1 §5) now disagree with ORIVILO's shell. No engine change in ORV-118; the engine's own issue decides whether its rules or its test change (ADR 0017 keeps `signature` to lime, cyan, magenta and teal).

## 13. The violet dot (owner decision, ORV-118 comment 10336)

**The decision.** ORV-118 comment 10336 records the owner's choice of 2026-10-31. The owner looked at the Logo stories on PR 165 and said the lime dot and the violet primary button do not go together. Asked which colour is the main brand colour, the owner picked violet for both. For the ORIVILO (neutral) profile:

- the mark's dot is violet at every size: violet.600 #7A22C7 in light and violet.400 #B07FEE in dark, the values of `action.primary`;
- lime #D9F66F stays as the Studio intent accent (`action.intent`) only, and is no longer the signature;
- other profiles keep `logo-scope-1`: their identity tokens colour the logo.

**Reading.** "Lime only for `action.intent`" covers every lime that neutral spends outside the intent action. Outside the `action.intent` group, two semantic tokens resolve to lime under neutral: `brand.signature` in both modes and `brand.dot-small` in dark (a scratch walk of every semantic and component token's resolve chain; on the component side only the `button.intent` group and `node.fg-missing`, both through `action.intent`, stay lime). So `brand.signature` changes, and all of its readers change with it, not only the logo (the table of readers below). The owner saw the logo and the button only. The other readers (the brand badge, the glow and the bead) are named for the designer's sign-off in task V2.

### Token changes

Only `src/tokens/source/semantic.json` changes. Professional and Friendly override all three tokens already, so their sources do not change.

<!-- prettier-ignore -->
| Token (identity scope) | Before, light and dark | After, light and dark | Why |
| --- | --- | --- | --- |
| `brand.signature` | lime.300, lime.300 | violet.600, violet.400 | The decision. It references the primitives itself, never `{action.primary}` (below) |
| `brand.ink` | gray.900, gray.900 | white, gray.900 | gray.900 on violet.600 is 2.49, under the 4.5 floor of `brand.ink` on `brand.signature`. White on violet.600 is 7.29. The dark value stays: gray.900 on violet.400 is 6.14. The pattern is Professional's (`brand.ink` white and slate.900 on navy.700 and navy.400) |
| `brand.dot-small` | violet.600, lime.300 | violet.600, violet.400 | The dot is violet in both modes |
| `logo.dot`, `logo.dot-small` (component) | `{brand.signature}`, `{brand.dot-small}` | No change | They keep pointing at the brand tokens |

Descriptions:

- `brand.signature`: "The signature colour: the mark dot above 24 px, a bead, one highlight plane; never text and never an action; shares violet with action.primary in the ORIVILO profile only (ORV-118)".
- `brand.dot-small`: the text in section 2.
- `brand.ink` keeps "Ink on the signature".

### `brand.dot-small` and `logo.dot-small` stay

Under neutral, the two dot tokens now resolve to one value in each mode, and that is the owner's "every size". The contract keeps both, because the second one carries a rule the first cannot:

1. **The floor.** `brand.dot-small` carries a 3.0 floor against `surface.canvas` under every profile. That floor keeps the 16 px dot visible: brand spec v1.1 §8 has the tab-bar test, where a light dot vanished on a light tab. `brand.signature` has no floor against the canvas. It is a ground (the brand badge), a glow and a bead, and a profile may set a light highlight there: Friendly's coral.400 is 2.3 on its light canvas. If the two tokens merged, either `brand.signature` would take the 3.0 floor, which fails Friendly and would change its badge, glow and bead, or the small dot would lose its floor.
2. **`logo-scope-1` unchanged.** Under Friendly in light mode, the small forms paint coral.700 (7.1 on the canvas) and the master paints coral.400. Without `brand.dot-small`, Friendly's small dot would drop to 2.3.
3. **No new name, and none dropped.** The change is three values and two descriptions. The recipe rule `.ds-logo:is([data-form="16"], [data-form="24"]) .ds-logo__dot` stays. Under neutral it now paints the same violet, and the Friendly light cell of "Recipes and modes" still shows the switch (row 3 in section 7).

### How the dot stays a brand token while it equals `action.primary`

- **Equal by primitive, not by reference.** `brand.signature` points at `{color.violet.600}` and `{color.violet.400}` itself. Its resolve chain is `["primitive:color.violet.600"]` in light and `["primitive:color.violet.400"]` in dark, with no action token in it. A profile that moves its action colour leaves its logo alone, and a profile that moves its signature leaves its button alone.
- **Separate readers.**
  - `componentsReading(["brand.signature"])` is `["badge", "logo", "nav-item", "tile"]`.
  - `componentsReading(["action.primary"])` is `["button", "checkbox", "progress", "resizable", "slider"]`.
  - The two lists share no component. No brand reader takes a click, and no action reads the brand.
- **Identity scope stays.** Every profile must override `brand.signature`, `brand.ink` and `brand.dot-small` (`Profile.validate`), so the shell's violet never reaches a customer preview through them (DESIGN.md §9 item 10).
- **The equality holds under neutral only, and a test pins it.** Under Professional the values are #254582 and #19315E, under Friendly #FC826B and #E05C45, as before. Under neutral a test requires one hex in each mode. A later change to either token therefore fails the test and needs a decision; nothing drifts silently.
- **DESIGN.md §8 keeps Brand presence and Act as two rows.** Only the neutral value is shared.

### Pairs and floors this change touches

From a scratch run at `d31aaf3`. It applied the three values in memory and ran the repo's `TokenSet`, `Profile`, `checkContrast`, `unexplainedColours`, `staleExemptions` and `RECIPE_PAIRS`. Ratios are rounded as `pnpm contrast` prints them; W6 gives two decimals.

<!-- prettier-ignore -->
| Pair | Floor | Neutral before, light and dark | Neutral after, light and dark |
| --- | --- | --- | --- |
| `brand.ink` on `brand.signature` (the declaration in `semantic.json` and `PAIR_RULES` "text on the signature") | 4.5 | 15, 15 | 7.3 (#FFFFFF on #7A22C7), 6.1 (#16151D on #B07FEE) |
| `brand.dot-small` on `surface.canvas` | 3.0 | 6.6, 15 | 6.6, 6.1 (#B07FEE on #16151D) |
| Recipe `badge`, slot "brand" (`badge.brand.fg` on `badge.brand.bg`) | 4.5 | 15, 15 | 7.3, 6.1 |
| Recipe `badge`, slot "brand dot" (`badge.dot.brand` on `badge.brand.bg`) | 3.0 | 15, 15 | 7.3, 6.1 |
| Recipe `logo`, slot "small dot" (`logo.dot-small` on `ds:surface.canvas`) | 3.0 | 6.6, 15 | 6.6, 6.1 |
| Recipe `logo`, slot "ink" | 3.0 | 16.4, 16 | No change |
| `logo.dot`, the master dot (not a pair) | None | 1.1, 15 | 6.6, 6.1. It stays out of `pairs.ts`, because Friendly's master dot is still 2.3 on its light canvas |
| App icon dot on the ink square (a generated file, not a pair) | None | lime.300, 15 | violet.600 would be 2.49, so the icon takes the dark value, 6.14 (`logo-icon-1`, F9) |

- Professional and Friendly: every ratio is unchanged.
- Totals after the change:
  - 97 semantic pairs and 582 checks, with 0 under the floor, 0 unexplained colours and 0 stale exemptions;
  - lowest 3.3 (`border.control` on `surface.card`, Friendly dark), the same as before;
  - 249 recipe pairs in 6 cells, 0 under the floor.
- No pair is added or dropped, and no exemption changes.

### Readers of `brand.signature`

The search: `grep -rn -E "brand\.signature|brand-signature|brand\.ink|brand-ink|dot-small" packages apps`, without `node_modules`, `.next`, `storybook-static` and `generated.css`, plus a walk of `component.json` for every `{brand.*}` value.

<!-- prettier-ignore -->
| Reader | Where it shows | Effect under neutral |
| --- | --- | --- |
| `logo.dot` (`component.json:2532`) | The Logo's master dot | Lime becomes violet; the small forms were violet in light already, and dark now matches |
| `badge.brand.bg` (`component.json:733`), with `badge.brand.fg` and `badge.dot.brand` reading `brand.ink` (`:737`, `:784`) | `Badge` variant `brand`: `DirectionStudio.tsx:217` (the recommended direction, rendered on `/directions` through `SavedStudio.tsx`), `Card.stories.tsx:137`, `Badge.stories.tsx:16` | The lime pill with ink text becomes a violet.600 pill with a white label in light, and a violet.400 pill with an ink label in dark. In light this is the primary button's pair of colours (risk 5) |
| `tile.glow` (`component.json:391`) | `foundations/spec-sheet.tsx:78`, the Foundations spec sheet | The soft glow becomes violet |
| `nav-item.bead` (`component.json:421`) | `foundations/spec-sheet.tsx:132` | The bead becomes violet |
| Tailwind `bg-brand-signature` | `apps/web/app/layout.tsx:39` (the header dot, which task B2 replaces with the Logo); `examples/landing.tsx:43` (the example's header dot) | The dot becomes violet |
| `brand.ink`'s contrast declaration and `PAIR_RULES` line 79 | `pnpm contrast` | New values, as in the pair table |

`packages/intent-engine` reads no design token (follow-up 6 in section 12).

### Generated CSS

`pnpm --filter @orivilo/design-system tokens` rewrites 6 lines of `src/tokens/generated.css` (line numbers at `d31aaf3`):

- 245: `--ds-brand-signature` becomes `var(--op-color-violet-600)`;
- 246: `--ds-brand-ink` becomes `var(--op-color-white)`;
- 445 and 528 (dark, and system dark): `--ds-brand-signature` becomes `var(--op-color-violet-400)`;
- 447 and 530: `--ds-brand-dot-small` becomes `var(--op-color-violet-400)`.

`src/profiles/generated.css` is byte-equal: a scratch run of `emitProfilesCss` with the change gave the committed file.

### Determinism and conflicts

- **Determinism.** The values are primitive references in a source file. They resolve the same way on every run, and the generated CSS is checked against them by the existing "matches the source files" case in `tokens.test.ts`.
- **Conflicts.**
  - A profile that leaves any of the three at the shell's value still fails `Profile.validate`.
  - A value under a floor fails `pnpm contrast`, `contrast-pairs.test.ts` and `recipes.test.ts`.
  - The three new cases below turn a drift between the brand and the action into a failure.

### Tests

New cases in `src/tokens/tokens.test.ts`, under `describe("the violet signature (ORV-118, comment 10336)")`:

1. "shares one value with action.primary under neutral, in both modes". For each of `MODES`, `brand.signature` and `action.primary` resolve to the same value: #7A22C7 in light and #B07FEE in dark.
2. "reaches its primitive directly, never through an action token". The resolve chain is `["primitive:color.violet.600"]` in light and `["primitive:color.violet.400"]` in dark.
3. "keeps brand readers and action readers apart".
   - `componentsReading(["brand.signature"])` equals `["badge", "logo", "nav-item", "tile"]`.
   - It shares no entry with `componentsReading(["action.primary"])`.

Red proofs (L-0042), one per case, each restored afterwards:

- for case 1, `brand.signature` dark set to `{color.lime.300}`;
- for case 2, `brand.signature` set to `{action.primary}`;
- for case 3, a temporary `button.primary.ring` with the value `{brand.signature}`.

<!-- prettier-ignore -->
| Test | Change | Rows |
| --- | --- | --- |
| `src/tokens/tokens.test.ts` | The three cases above; the identity list (nine) and the one-reader case for `brand.dot-small` stay | 10 |
| `src/components/logo/Logo.stories.tsx` lines 30 and 31 | `NEUTRAL_LIGHT.dot` becomes #7A22C7; `NEUTRAL_DARK.dot` and `NEUTRAL_DARK.dotSmall` become #B07FEE. The plays read these constants, so no play code changes | 1 to 4 and 6; row 9 reads the token source |
| `src/tokens/contrast-pairs.test.ts`, `src/profiles/profiles.test.ts`, `src/recipes/recipes.test.ts`, `src/components/logo/logo.test.ts`, `tests/check-catalog.test.ts` | None. They pass as they are, because no pair key, override fixture, recipe rule, markup or catalog field changes | 5, 7, 8, 10, 11 |
| `src/components/logo/assets.test.ts` (slice B, not built) | Written against the updated rows 17 to 21 of section 7 | 17 to 21 |
| `packages/intent-engine/src/color-rules.test.ts` | None (follow-up 6) | None |

### DESIGN.md lines that change

<!-- prettier-ignore -->
| Line | Today | After |
| --- | --- | --- |
| 21 (§2) | "Lime is the signature; it appears as a bead, a highlight plane, or the one Intent Engine button per screen, never as body text on light ground and never as a status colour. Orbit violet does the work of action, selection and links (brand case study board 06); it is never a tint or a wash." | "Violet is the signature (owner, ORV-118): the mark's dot, a bead and one highlight plane (`brand.signature`), the same value as the one primary action (`action.primary`) in the ORIVILO profile, and still a separate token. Lime is spent once, on the one Intent Engine button per screen (`action.intent`), never as body text on light ground and never as a status colour. Orbit violet also does the work of selection and links (brand case study board 06); apart from the one signature glow it is never a tint or a wash." |
| 22 (§2) | "at most one soft lime glow per screen"; "with the lime limited to one button and one bead" | "at most one soft signature glow per screen"; "with the lime limited to one button" |
| 78 (§3.1) | `brand.signature`: lime.300 #D9F66F, lime.300 #D9F66F, "Mark dot above 24 px, one highlight plane; never text on light ground" | violet.600 #7A22C7, violet.400 #B07FEE, "Mark dot above 24 px, a bead, one highlight plane; never text, never an action" |
| 79 (§3.1) | `brand.ink`: gray.900 #16151D in light | white #FFFFFF in light; dark stays gray.900 #16151D |
| 80 (§3.1) | `brand.dot-small`: lime.300 #D9F66F in dark | violet.400 #B07FEE in dark |
| 121 (§3.5, Depth) | "a soft lime glow (radial, 35% light, 14% dark)" | "a soft signature glow (radial, 35% light, 14% dark)" |
| After 214 (§8, below the table) | No text | "Brand presence and Act share one value in the ORIVILO profile (violet.600 and violet.400, owner, ORV-118) and stay two tokens: no component reads both, and `tokens.test.ts` fails when they drift apart." |
| 222 (§9 item 1) | "in dark mode lime stays at one button and one bead and the glow at 14%" | "in dark mode lime stays at one button, and the signature glow at 14%" |
| After 300 (change log) | No entry | v1.43: the ORIVILO signature becomes violet (ORV-118, comment 10336): `brand.signature` violet.600 and violet.400, `brand.ink` white in light, `brand.dot-small` violet.400 in dark; lime is `action.intent` only. Downstream: the brand badge, the glow and the bead turn violet under neutral; Professional and Friendly unchanged |

Lines 32 (nine identity tokens), 210 (Brand presence row), 216 (proportion; lime stays under 2), 229 (§9 item 8) and 290 (§12 Logo row) stay as they are.

### Brand spec lines that change

These are in `docs/context/brand/orivilo-brand-spec-v1.1.md`.

<!-- prettier-ignore -->
| Line | Today | After |
| --- | --- | --- |
| 1 and 3 | Title v1.1; the Status line | Title v1.2; the Status line adds "v1.2 (2026-10-31): the signature is violet (owner, ORV-118 comment 10336)" |
| 18 (§2, Colours) | "dot lime #D9F66F" | "dot violet #7A22C7 on paper, #B07FEE on ink" |
| 19 (§2, Small) | "≤ 24 px on light ground: dot becomes violet #7A22C7" | "≤ 24 px: stroke 32 to 34; the dot keeps its colour" |
| 58 (§5, `brand.signature`) | "#D9F66F", "ink on it 15.0; never text on light ground (1.2)" | "#7A22C7", "white on it 7.3; canvas 6.6; never text, never an action" |
| 64 (§5, dark set) | Ends with "lime unchanged" | Ends with "signature #B07FEE (ink on it 6.1); lime #D9F66F is the intent action only" |
| 66 (§5) | "10 lime" | "10 violet and lime, lime under 2" |
| 92 (§8, Mark similarity) | "the 55° opening and the lime bead carry the difference" | "the 55° opening and the dot carry the difference" |
| New §10 | No text | "Changes in v1.2": the decision, and that the §8 favicon result of 2026-10-21 (violet reads on a light tab, lime does not) now holds at every size |

The file name keeps `v1.1`, because six files link to it: `DESIGN.md`, `docs/context/ui-direction.md`, `docs/specs/ORV-20/spec.md`, `docs/specs/ORV-118/spec.md`, `docs/specs/ORV-125/spec.md` and `packages/intent-engine/src/color-knowledge.ts`. A new `-v1.2` file is the other option (needs a decision).

### Other documents

- `packages/design-system/catalog/base/logo.yaml:24`: "(violet on the light canvas, lime on the dark one)" becomes "(violet in both modes under the ORIVILO profile; another profile sets its own)".
- `src/recipes/pairs.ts:13` (code comment): the change in section 3.
- The spec: findings F7 to F11.

### Builder task list

<!-- prettier-ignore -->
| Task | Role | Deliverable | Files | Tests and evidence | Needs |
| --- | --- | --- | --- | --- | --- |
| S1 | product | The spec's next version, from F7 to F11 | `docs/specs/ORV-118/spec.md` | The lines in the findings table | None |
| S2 | designer | Brand spec v1.2 | `docs/context/brand/orivilo-brand-spec-v1.1.md` | The table above | None |
| V1 | builder | The violet signature on PR 165 | `src/tokens/source/semantic.json`; `src/tokens/generated.css` (from `pnpm --filter @orivilo/design-system tokens`; `src/profiles/generated.css` must come out unchanged); `src/recipes/pairs.ts:13`; `src/tokens/tokens.test.ts`; `src/components/logo/Logo.stories.tsx:30-31`; `catalog/base/logo.yaml:24`; DESIGN.md as in the table above | The three new cases, each red and then restored, one `verified` row per clause; `pnpm contrast` prints "97 pairs x 3 sets x 2 modes = 582 checks, 0 under floor, 0 unexplained; lowest 3.3"; the Logo stories pass in the Storybook test project; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` | S1 |
| V2 | designer | A new sign-off on PR 165 (`logo-render-1`) | None (a Jira comment) | A contact sheet at 360 px, light and dark: the six Logo stories, `Badge` "brand", Direction Studio with the recommended badge, the Card story and the Foundations spec sheet (glow and bead). It decides risk 5 | V1 |

Slice B adds no task: B1 builds against the updated §5 table and rows 17 to 21, and R2 checks the favicon's dark block for #B07FEE.

### Impact list

- **Contract change.**
  - The values of three identity-scoped semantic tokens under neutral (`brand.signature`, `brand.ink`, `brand.dot-small`) and two descriptions.
  - The `logo-icon-1` rule for the app icon's dot.
  - No token, component token, recipe rule, pair or public API is added, renamed or dropped. The identity tokens stay nine, and the semantic pairs stay 97.
- **Profiles.**
  - Neutral changes.
  - Professional and Friendly do not change: their sources stay, and their generated CSS is byte-equal.
  - A refined profile keeps its overrides (`refineProfile` swaps only shape, type and motion).
  - A resolved customer profile (E2-9) must still override all three tokens.
- **Recipes.** No CSS change. The `pairs.ts` header comment changes.
- **Components.**
  - `Logo`: the dot is violet in every form under neutral.
  - `Badge` variant `brand`: a violet ground, with a white label in light and an ink label in dark.
  - The Foundations spec sheet: the `tile` glow and the `nav-item` bead.
  - The Landing example: its header dot.
- **Screens.**
  - The app header dot on every page (until B2 puts the Logo there).
  - `/directions`: the recommended badge.
  - `/account`, once B3 lands.
  - The favicon and app icons, once B1 lands.
  - Storybook: Base/Logo, Base/Badge, the Card and Direction Studio stories, and the Foundations pages Semantic, Component tokens, Profiles and the spec sheet. The Storybook brand image does not change: it is light and form 24, which was violet already.
- **`packages/intent-engine`.** No change (follow-up 6).

### Is an ADR needed?

No.

- The token layers, the identity scope and the floors stay as DESIGN.md §3.1, §5 and §9 item 10 describe them; only values change.
- DESIGN.md's change log and brand spec v1.2 record the brand change.
- ADR 0017's `signature` vocabulary names the hue families the colour node may pick for a customer. It does not name ORIVILO's own token, so it does not change.

## Findings for the spec

<!-- prettier-ignore -->
| # | Where in the spec | Finding | This design assumes | Status |
| --- | --- | --- | --- | --- |
| F1 | Row 1; `logo-api-1` (stories at 360 px) | At height 96 the horizontal lockup is 424.32 px wide, but the content column of a 360 px viewport is 328 px (Storybook's padded layout). "Kinds" would overflow, against the design gate's 360 px line. Check: `node -e 'const w=(vw,vh,h)=>(h*vw/vh).toFixed(2);console.log(w(663,150,96),w(663,150,64),360-2*16)'` prints `424.32 282.88 328` | "Kinds" renders the four kinds at height 64, all in the master form | Applied in spec v1.1 |
| F2 | Row 14, data effect | "A Playwright test" reads as a permanent test, but `apps/web` has no Playwright suite and adding one changes CI | A scripted Playwright run on a production build (R2), with its output in the G3 packet; a permanent suite is a follow-up | Applied in spec v1.1 |
| F3 | Open question 1, impact | The list leaves out `component.json` (the `logo` group), `tokens.test.ts` (the identity list), `foundations/profiles.stories.tsx` (the runtime probe), `recipes.css`, `pairs.ts`, and DESIGN.md §3.1's count, §8 and §12 | The full list in §10 | Applied in spec v1.1 |
| F4 | `logo-api-1` | Amendments: the `LogoKind` and `LogoTone` exports; a `height` that is not a finite number renders at 24 before the minimum applies; closed props; a wordmark is always `master` | §4 | Applied in spec v1.1 |
| F5 | Out of scope, Storybook manager | The brand image carries light values only, so the manager must use the light base, while Storybook's default follows the OS scheme | `base: "light"` in `manager.ts` | Applied in spec v1.1 |
| F6 | Rows 2, 4 and 7, Given | The rows name a story in a mode or locale that the test project does not run: it runs each story once, in Thai and light mode | The dark halves are asserted in the neutral dark cell of "Recipes and modes", row 7's English half in a unit test; the toolbar renders are on the R1 contact sheet | Applied in spec v1.1 |
| F7 | `logo-colour-1`, the neutral values (spec line 98) | Comment 10336 makes the dot violet at every size. The line gives `brand.signature` lime.300 in both modes and `brand.dot-small` lime.300 in dark, and cites board 05 and brand spec v1.1 §2 for "violet on the light canvas and lime on the dark canvas" | "`brand.signature` violet.600 #7A22C7 light, violet.400 #B07FEE dark; `brand.dot-small` the same values. So the dot is violet at every size in both modes (owner, ORV-118 comment 10336; brand spec v1.2 §2)." Contract change: token values (section 13) | Open |
| F8 | `logo-colour-1`, the contrast paragraph (spec line 100) | "The master dot (`brand.signature` on the light canvas, 1.10 by W6) is left out" no longer gives the reason: neutral's master dot is now 6.61 | "The master dot is left out of `src/recipes/pairs.ts` (`brand.signature` has no floor on the canvas; Friendly's is 2.3 on its light canvas), with the reason in its header comment" | Open |
| F9 | `logo-icon-1`, the app icon (spec line 113) | "dot `brand.signature` in every form", with the light values, puts violet.600 on the ink square at 2.49 (W6) | "dot: the dark value of the token the form picks (`logo-colour-1`), because the ground is the ink square: `brand.dot-small` at 32 px (form 24), `brand.signature` at 180 px (master), #B07FEE in both, 6.14 (W6)". Contract change: the asset's colour rule | Open |
| F10 | W6 (spec lines 185 and 188) | The pairs it computes (lime.300 on gray.900, lime.300 on gray.50) no longer describe the logo | "violet.600 on gray.50 (dot, light canvas), violet.400 on gray.900 (dot, dark canvas), white on violet.600 (`brand.ink` on the signature, light), violet.600 on gray.900 (why the app icon takes the dark value). Expected: `6.61 6.14 7.29 2.49`." The command prints `R("7A22C7","F4F4F0"),R("B07FEE","16151D"),R("FFFFFF","7A22C7"),R("7A22C7","16151D")` with the same `L` and `R` | Open |
| F11 | Changelog; open question 1 (spec line 210) | No changelog entry for the decision. Open question 1 asks for a dot "violet on the light canvas, lime on the dark one" | A changelog entry naming F7 to F10 and their kinds. Downstream: brand spec v1.2, DESIGN.md (section 13), the tech notes' `spec:` version, task V1 and the V2 sign-off. Open question 1 keeps its text and gains "Values revised by comment 10336 (tech notes, section 13)" | Open |
