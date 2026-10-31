---
id: K-0098
topic: design
claim: Material 3 sets a dialog headline in headline-small (24 px on 32, regular; px from rem at a 16 px root, own arithmetic) on-surface over supporting text in body-medium (14 px on 20, regular) on-surface-variant, with 16dp between title and body, so the steps are size and colour with no weight step; its body styles are 14 on 20 and 16 on 24, and its title-medium and title-small styles are the medium weight.
source: "https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-comp-dialog.scss; https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-typescale.scss; https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-comp-snackbar.scss; https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192; https://m3.material.io/components/dialogs/specs (read through https://r.jina.ai/); https://m3.material.io/styles/typography/type-scale-tokens (read through https://r.jina.ai/); https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Typography.md"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: own-words
---

## Evidence

Material Web's token files, version folder `v0_192`, on `main`, read 2026-10-31. Confidence 0.8: one publisher (Google), tokens and spec page from the same system.

### Dialog tokens (`_md-comp-dialog.scss`)

```text
'headline-color': map.get($deps, 'md-sys-color', 'on-surface'),
'headline-size': map.get($deps, 'md-sys-typescale', 'headline-small-size'),
'supporting-text-color':
map.get($deps, 'md-sys-color', 'on-surface-variant'),
'supporting-text-size': map.get($deps, 'md-sys-typescale', 'body-medium-size'),
```

The headline weight and line height point at `headline-small-weight` and `headline-small-line-height`; the supporting text at `body-medium-weight` and `body-medium-line-height`.

### Type scale (`_md-sys-typescale.scss`)

```text
'body-large-size': if($exclude-hardcoded-values, null, 1rem),
'body-large-line-height': if($exclude-hardcoded-values, null, 1.5rem),
'body-medium-size': if($exclude-hardcoded-values, null, 0.875rem),
'body-medium-line-height': if($exclude-hardcoded-values, null, 1.25rem),
'headline-small-line-height': if($exclude-hardcoded-values, null, 2rem),
'headline-small-size': if($exclude-hardcoded-values, null, 1.5rem),
```

Weights: `body-*` and `headline-small` map to `weight-regular`; `title-medium` (1rem on 1.5rem) and `title-small` (0.875rem on 1.25rem) map to `weight-medium`; `title-large` (1.375rem on 1.75rem) maps to `weight-regular`. Body-small is 0.75rem on 1rem. The Android docs table agrees on sizes: "`textAppearanceTitleMedium` | Medium 16sp", "`textAppearanceBodyMedium` | Regular 14sp", "`textAppearanceHeadlineSmall` | Regular 24sp". The type-scale page says: "Material Design uses the Major Second type scale with 14 as its key base size."

### Dialog spacing (m3.material.io dialog specs, Basic dialog measurements)

> Padding between title and body | 16dp
> Padding between icon and title | 16dp
> Padding between body and actions | 24dp

### Snackbar

`_md-comp-snackbar.scss` sets supporting text in `body-medium` with `inverse-on-surface`; the file has no headline or title token.

## Why it matters for ORIVILO

Material is the one system read here that steps a dialog title by size and colour but not weight, and that puts 16dp, not 2 to 8 px, between title and body. ORIVILO's choice of a gap should note that a dialog header and a toast sit at different points of this range.
