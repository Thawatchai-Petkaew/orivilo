---
issue: ORV-275 (https://tpetkaew.atlassian.net/browse/ORV-275)
spec: docs/specs/ORV-275/spec.md v1.1
decision: ORV-274 comment 10644 (owner): Latin in Inter, Thai headings in Anuphan, Thai body in Sarabun, system-wide; ORV-275 comment 10647 (POC delegation): the heading line heights stay as today
task: ORV-275-tech-2 (revises ORV-275-tech-1)
author: ds-architect
date: 2026-11-17
---

# ORV-275 tech notes: Inter, Anuphan and Sarabun in the type contract

One builder task builds all of this in one PR. No ADR: this changes token values and font files, not the architecture; the layers, the token build and the boundary stay as they are.

## Contract

### Primitives (`packages/design-system/src/tokens/source/primitives.json`)

| Token                             | Before                                                      | After                                             |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `font.family.plex-sans`           | `["IBM Plex Sans", "Sarabun", "system-ui", "sans-serif"]`   | removed                                           |
| `font.family.inter-anuphan` (new) | none                                                        | `["Inter", "Anuphan", "system-ui", "sans-serif"]` |
| `font.family.inter-sarabun` (new) | none                                                        | `["Inter", "Sarabun", "system-ui", "sans-serif"]` |
| `font.family.plex-mono`           | `["IBM Plex Mono", "Sarabun", "ui-monospace", "monospace"]` | unchanged                                         |
| `font.line-height.*`              | every step                                                  | unchanged: no step added, none removed            |

Decisions, one line each:

- Primitive names say what the stack holds (Latin face, Thai face), as `plex-mono` does; a role name belongs to the semantic layer.
- The heading stack names no Sarabun after Anuphan: one Thai face per stack, so a heading never mixes looped and loopless Thai and never loads a second Thai file.
- No line-height primitive changes (spec `type-clear-1`, ORV-275 comment 10647): `1-2`, `1-25` and `1-3` keep their readers, `type.display.lg`, `type.display.md` and `type.heading.md`. The new faces are no regression at those values (section Metrics).
- The token build quotes a family with a space and leaves `Inter` bare, so the computed stacks read `Inter, Anuphan, system-ui, sans-serif` and `Inter, Sarabun, system-ui, sans-serif`; plays match `/^Inter, Anuphan,/` and `/^Inter, Sarabun,/`.

### Semantic (`packages/design-system/src/tokens/source/semantic.json`)

| Token                               | Family before → after         | Line height        | Size, weight, letter-spacing |
| ----------------------------------- | ----------------------------- | ------------------ | ---------------------------- |
| `type.display.lg`                   | `plex-sans` → `inter-anuphan` | unchanged (`1-2`)  | unchanged (56, 500, normal)  |
| `type.display.md`                   | `plex-sans` → `inter-anuphan` | unchanged (`1-25`) | unchanged (32, 500, normal)  |
| `type.heading.md`                   | `plex-sans` → `inter-anuphan` | unchanged (`1-3`)  | unchanged (24, 500, normal)  |
| `type.heading.sm`                   | `plex-sans` → `inter-anuphan` | unchanged (`1-7`)  | unchanged (20, 500, normal)  |
| `type.body.lg`, `.md`, `.sm`, `.xs` | `plex-sans` → `inter-sarabun` | unchanged (`1-7`)  | unchanged                    |
| `type.label.md`                     | `plex-sans` → `inter-sarabun` | unchanged (`1-7`)  | unchanged                    |
| `type.label.sm`                     | `plex-sans` → `inter-sarabun` | unchanged (`1-5`)  | unchanged                    |
| `type.control.md`                   | `plex-sans` → `inter-sarabun` | unchanged (`1-6`)  | unchanged                    |
| `type.field.sm`                     | `plex-sans` → `inter-sarabun` | unchanged (`1-6`)  | unchanged                    |
| `type.numeral.lg`, `.md`            | `plex-sans` → `inter-sarabun` | unchanged (`1`)    | unchanged (500, tight)       |
| `type.code.md`                      | `plex-mono`, unchanged        | unchanged (`1-6`)  | unchanged                    |
| `font.display`                      | `plex-sans` → `inter-anuphan` | n/a                | n/a                          |
| `font.body`                         | `plex-sans` → `inter-sarabun` | n/a                | n/a                          |
| `font.mono`                         | `plex-mono`, unchanged        | n/a                | n/a                          |

New `$description` text (no description may name IBM Plex Sans, spec row 6):

- `font.display`: "Heading role: Latin and digits in Inter, Thai in loopless Anuphan, in every profile (owner, ORV-274 comment 10644)."
- `font.body`: "Body and UI role: Latin and digits in Inter, Thai in looped Sarabun (owner, ORV-58; ORV-274 comment 10644)."
- `type.control.md` and `type.field.sm` keep their text; the measured centring holds unchanged (section Metrics).

### Profiles

| File                                                | Before                                                                            | After                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/profiles/source/professional.json`             | `type.display.lg` and `.md` restated with `plex-sans`, `1-2` / `1-25`, 500, tight | same restatement with `inter-anuphan`; `1-2` / `1-25`, 500, tight kept |
| `src/profiles/source/friendly.json`, `orivilo.json` | no type token                                                                     | unchanged                                                              |

Under all four sets of `CONTRAST_SETS` (neutral, Professional, Friendly, ORIVILO) the families are the table above. Professional keeps its tight display tracking as today: tracking is outside this story (spec section "Out of scope"). That tracking reaches Thai display text, against DESIGN.md §4; it predates this story, and the task report raises it to the owner.

### The type utilities carry their family (`src/tokens/orivilo.css`)

Tailwind's `text-*` utilities set size, line height, weight and tracking, never family, so `text-heading-sm` alone renders in the boundary's body stack. Ten sites in eight files use a heading utility without `font-display`, three of them in `apps/web` (`page.tsx` lines 52 and 71, `directions/SavedStudio.tsx` line 370; section Impact list, group D). Add, unlayered, after the display padding rules:

```css
.text-display-lg {
  font-family: var(--ds-type-display-lg-font-family);
}
.text-display-md {
  font-family: var(--ds-type-display-md-font-family);
}
.text-heading-md {
  font-family: var(--ds-type-heading-md-font-family);
}
.text-heading-sm {
  font-family: var(--ds-type-heading-sm-font-family);
}
```

Reason: a heading style then renders in the heading faces wherever its utility is used, with no edit in `apps/web` (spec row 11). No tracked file pairs a heading utility with `font-body` or `font-mono` (search in section Impact list), so the unlayered rule overrides nothing.

## Heading and body styles

| Group       | Styles                                                                                                                                                       | Stack (Latin, Thai)    | Weights used |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------------ |
| Heading (4) | `type.display.lg`, `type.display.md`, `type.heading.md`, `type.heading.sm`; `font.display`                                                                   | Inter, Anuphan         | 500          |
| Body (10)   | `type.body.lg`, `.md`, `.sm`, `.xs`, `type.label.md`, `type.label.sm`, `type.control.md`, `type.field.sm`, `type.numeral.lg`, `type.numeral.md`; `font.body` | Inter, Sarabun         | 400, 500     |
| Code (1)    | `type.code.md`; `font.mono`                                                                                                                                  | IBM Plex Mono, Sarabun | 400          |

Deviation from the task's default: the numeral styles are body styles, not heading styles. DESIGN.md §3 sets numerals in the body face, spec `type-face-1` groups them so, and they hold digits only, which Inter draws in both stacks.

`type.heading.sm` (20 px) is a heading style, so the Page header, Section header, Card, Dialog, Sheet, Inspector and direction titles take Anuphan (spec open question 2, its default). Text with no type token inherits `type.body.md` from the boundary, so it is body text.

## Font files

Directory `packages/design-system/src/tokens/fonts/`, declared in `src/tokens/fonts.css`. All new files were downloaded in this task from the Google Fonts CSS2 API (`https://fonts.googleapis.com/css2?family=Inter:wght@400..600` and `family=Anuphan:wght@400..600`, Chrome user agent) and hashed; the builder fetches the same URLs at build time and checks the SHA-256. Nothing is fetched at runtime.

| File                                                     | Family, weights                       | Subset, `unicode-range`                                                                                                                                                                                         | Bytes            | SHA-256                                                            | Source URL                                                                               | Licence file                            |
| -------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| `inter-latin.woff2` (add)                                | Inter, variable, declared `400 600`   | latin: `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`                             | 48432            | `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4` | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2   | `LICENSE-inter.txt`                     |
| `inter-latin-ext.woff2` (add)                            | Inter, variable, declared `400 600`   | latin-ext: `U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF` | 85272            | `a28eb6d3ccb534ae0c94ca999371df024aab60b08c3c8a5720ee9e32fa0faaa2` | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7W0Q5n-wU.woff2 | `LICENSE-inter.txt`                     |
| `anuphan-thai.woff2` (add)                               | Anuphan, variable, declared `400 600` | thai: `U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC`                                                                                                                                                | 18952            | `6966233243092b0ca96f875793aa1dd12fdb6193317abf6bbf7b658d3dc431ad` | https://fonts.gstatic.com/s/anuphan/v6/2sDeZGxYgY7LkLT0mX4Dam--C70lZQ.woff2              | `LICENSE-anuphan.txt`                   |
| `LICENSE-inter.txt` (add)                                | Inter                                 | n/a                                                                                                                                                                                                             | 4377             | `5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57` | https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt                    | itself                                  |
| `LICENSE-anuphan.txt` (add)                              | Anuphan                               | n/a                                                                                                                                                                                                             | 4388             | `cbc57ac0dddda1b70f246a16358fc3c2a32628a23a6d10ef64f746141d3fb159` | https://raw.githubusercontent.com/google/fonts/main/ofl/anuphan/OFL.txt                  | itself                                  |
| `sarabun-400-thai.woff2`, `-500-`, `-600-`               | Sarabun, static 400, 500, 600         | thai, as above                                                                                                                                                                                                  | 9676, 9732, 9736 | unchanged                                                          | unchanged                                                                                | `LICENSE-sarabun.txt` (unchanged)       |
| `plex-mono-400-latin.woff2`, `plex-mono-500-latin.woff2` | IBM Plex Mono                         | no `@font-face`, as today (spec row 4, open question 1)                                                                                                                                                         | 14708, 14888     | unchanged                                                          | unchanged                                                                                | `LICENSE-ibm-plex-mono.txt` (unchanged) |
| `plex-sans-latin.woff2` (remove)                         | IBM Plex Sans                         | n/a                                                                                                                                                                                                             | 45712            | n/a                                                                | n/a                                                                                      | n/a                                     |
| `plex-sans-latin-ext.woff2` (remove)                     | IBM Plex Sans                         | n/a                                                                                                                                                                                                             | 30964            | n/a                                                                | n/a                                                                                      | n/a                                     |
| `LICENSE-ibm-plex-sans.txt` (remove)                     | IBM Plex Sans                         | n/a                                                                                                                                                                                                             | 4456             | n/a                                                                | n/a                                                                                      | n/a                                     |

Licences, read at the source in this task (fetched text treated as data):

- Inter: `ofl/inter/OFL.txt` in google/fonts opens "Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)", then the SIL Open Font License 1.1 text; no Reserved Font Name is declared. The upstream `rsms/inter` `LICENSE.txt` (4380 bytes) is the same licence with "Copyright (c) 2016". The google/fonts file ships, because the binaries are Google's build.
- Anuphan: `ofl/anuphan/OFL.txt` in google/fonts, byte-identical to `cadsondemak/Anuphan` `OFL.txt` (same SHA-256), opens "Copyright 2019 The Anuphan Project Authors (https://github.com/cadsondemak/Anuphan)", then OFL 1.1; no Reserved Font Name.

Decisions:

- Variable files for Inter and Anuphan, each declared `400 600`: every weight the contract uses (400, 500) and the 600 a component may set is a true face, and one file per subset serves them all (the static Anuphan 500 thai file is 7816 bytes but covers one weight).
- Inter latin-ext ships: today's Plex Sans has the same split, and `unicode-range` loads it only for a character it covers, so a Latin page never fetches it.
- Inter and Anuphan carry the same subsets and ranges as the faces they replace or join (Plex Sans latin and latin-ext; Sarabun thai), so `unicode-range` routing is unchanged.
- `font-display: swap` and `font-style: normal`, as today.
- Package size: +161421 bytes added, -81132 removed, net +80289.

`fonts.css` after (comments rewritten, Sarabun rules unchanged):

```css
/*
 * Self-hosted fonts (DESIGN.md §4). All files are SIL Open Font License 1.1; see LICENSE-*.txt
 * in ./fonts. Subsets: Latin and Latin Extended for Inter, Thai for Anuphan and Sarabun.
 * Never fetch fonts from a font host at runtime in product code.
 */
/* Sarabun, looped Thai, body role (owner, ORV-58): three @font-face rules as today. */
/* Anuphan, loopless Thai, heading role (owner, ORV-274 comment 10644), variable 400 to 600. */
@font-face {
  font-family: "Anuphan";
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url("./fonts/anuphan-thai.woff2") format("woff2");
  unicode-range: U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC;
}
/* Inter, Latin and digits in every sans role, variable 400 to 600. */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url("./fonts/inter-latin-ext.woff2") format("woff2");
  unicode-range:
    U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329,
    U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F,
    U+A720-A7FF;
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url("./fonts/inter-latin.woff2") format("woff2");
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

## Metrics

All numbers come from scripts run in this task: Chromium 141.0.7390.37 through Playwright 1.56.1 (the repo's copy), darwin, fonts loaded as data URLs with the ranges above. Scripts, run with `node <path> [deviceScaleFactor]`:

| Script                                                                                                                                                       | Measures                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-1/scripts/tables.mjs`  | head, hhea, OS/2 and fvar read from each WOFF2 (Brotli stream, untransformed tables)                                                         |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-1/scripts/glyphs.mjs`  | canvas ink extents of single glyphs at 100 px                                                                                                |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-1/scripts/measure.mjs` | per style at today's line heights: font box, baseline, Thai and Latin ink against the line box; control ink centre at 16 sub-pixel positions |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-1/scripts/lines.mjs`   | the `expectLinesClear` reading, old stack against new, at today's line heights                                                               |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-1/scripts/final.mjs`   | the numeral rows: highest and lowest ink, caption clearance (its heading rows read a line height this file no longer sets)                   |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-2/scripts/today.mjs`   | the heading styles at today's line heights, old stack against new: highest and lowest ink, lines gap, caption clearance per padding top      |
| `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-1/scripts/widths.mjs`  | Latin advance widths, Plex Sans against Inter                                                                                                |

Method, shared: ink is a pixel more than 48 (RGB distance, `INK_DISTANCE` of `visual-asserts.ts`) from the ground. "Highest ink" is the first ink row minus the line box top (negative rises above the box); "lowest ink" is the last ink row's bottom minus the line box bottom (positive falls below). Each shot first swaps the ground between rgb(255,255,255) and rgb(254,254,254) and waits two frames, so no ink of the previous sample stays in the raster. The lines gap repeats `expectLinesClear`: red "ฟูฟูฟูปู่ปู่ฟูฟู" over blue "ฟื้ฟื้ฟื้ปี๊ปี๊ฟื้ฟื้", per column, coverage 0.05 of 224; its floor is 1.5 less one device pixel (1.0 at scale 2, 0.5 at scale 1). The caption clearance repeats `expectInkClearsAbove(row, caption, 4)`: a mono 14 / 1.7 caption directly above the row, hidden, and the gap from its box bottom to the row's first ink. Top samples: ผู้ ปิ่น ก็ ชื่อ ที่ ฟื้ ปี๊ ฟื้นฟู Å É H. Low samples: ผู้ ปู่ กู้ภัย ฎีกา ฎฏ ญฐ ฤ Ågjpqy. Numeral samples: "Intent Engine 0123" and "0123456789".

### Font tables (`tables.mjs`)

| Face                      | UPM  | hhea ascent / descent / gap (em) | OS/2 win ascent / descent | USE_TYPO_METRICS | xHeight / capHeight (em) | Axes          |
| ------------------------- | ---- | -------------------------------- | ------------------------- | ---------------- | ------------------------ | ------------- |
| Inter latin, latin-ext    | 2048 | 0.9688 / 0.2412 / 0              | 2269 / 660                | on               | 0.5459 / 0.7275          | wght 100..900 |
| IBM Plex Sans latin (old) | 1000 | 1.025 / 0.275 / 0                | 1120 / 275                | on               | 0.516 / 0.698            | wght 100..700 |
| Anuphan thai              | 1000 | 1.025 / 0.275 / 0                | 1119 / 324                | on               | 0.570 / 0.698            | wght 100..700 |
| Sarabun thai              | 1000 | 1.068 / 0.232 / 0                | 1286 / 567                | on               | 0.500 / 0.700            | none          |

Inter is the primary (first) font of both new stacks, so its rounded ascent and descent set every line's strut; at the same line height Inter's shorter font box puts the baseline 0 to 1 px higher than Plex Sans did.

### Glyph ink at 100 px, above / below the baseline (`glyphs.mjs`)

| Face    | Highest Thai stack   | ผู้ (above / below) | ฎ below | Latin H, x, g below     |
| ------- | -------------------- | ------------------- | ------- | ----------------------- |
| Sarabun | ฟื้ 125.9, ปี๊ 124.1 | 96.2 / 33.8         | 31.9    | Plex: 69.8, 52.0, 21.2  |
| Anuphan | ปี๊ 106.5, ฟื้ 104.7 | 82.4 / 28.0         | 21.6    | Inter: 72.8, 54.6, 21.6 |

Anuphan's stacks rise 0.19 em less than Sarabun's and fall 0.06 to 0.10 em less; that is why the heading styles keep today's line heights with no regression (below).

### Heading styles at today's line heights, before and after (`today.mjs`, weight 500)

Each pair of numbers: device scale 2 / device scale 1; one number where both scales read the same. Before: Plex Sans and Sarabun. After: Inter and Anuphan. Line heights are today's in both columns (spec `type-clear-1`). Padding top is the one the row carries after this story: the token padding of `text-display-lg` and `text-display-md`, and the Scale story's 8 px (`pt-2`) above `heading.md` and `heading.sm` (section Build order). Script: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-275-tech-2/scripts/today.mjs`, run as `node today.mjs 2` and `node today.mjs 1`.

| Style                      | Line height, padding top | Highest ink before | Highest ink after | Lowest ink before | Lowest ink after | Caption clearance before | Caption clearance after |
| -------------------------- | ------------------------ | ------------------ | ----------------- | ----------------- | ---------------- | ------------------------ | ----------------------- |
| `type.display.lg` 56       | 1.2, pad 24              | -17 (ฟื้)          | -7 / -8 (ปี๊)     | 5.81 (ผู้)        | 1.81 (ผู้)       | 7.2                      | 18.2 / 17.2             |
| `type.display.md` 32       | 1.25, pad 16             | -9 (ฟื้)           | -3.5 / -4 (ปี๊)   | 3.00 (ผู้)        | 0.00 (ผู้)       | 7.2                      | 13.2                    |
| `type.heading.md` 24       | 1.3, pad 8               | -6.5 / -7 (ฟื้)    | -2 (ปี๊ / ฟื้)    | 1.31 / 0.81 (ผู้) | -0.19 (ผู้)      | 1.7 / 1.2                | 6.7 / 6.2               |
| `type.heading.sm` 20       | 1.7, pad 8               | -1.5 / -2 (ฟื้)    | 2.5 / 2 (ฟื้)     | -3.00 (ผู้)       | -4.00 (ผู้)      | 6.7 / 6.2                | 10.7 / 10.2             |
| Page header title 32 / 1.7 | 1.7, pad 8, unchanged    | -2 (ฟื้)           | 3.5 / 3 (ปี๊)     | -4.39 (ผู้)       | -7.39 (ผู้)      | 6.2                      | 12.2                    |

Caption clearance at other padding tops, the reading of `expectInkClearsAbove(row, caption, 4)`, after (Inter and Anuphan), scale 2 / 1:

| Style                  | pad 0       | pad 2     | pad 4     | pad 6     | pad 8       | Token padding   |
| ---------------------- | ----------- | --------- | --------- | --------- | ----------- | --------------- |
| `type.display.lg` 1.2  | -5.8 / -6.8 | not read  | not read  | not read  | not read    | 24: 18.2 / 17.2 |
| `type.display.md` 1.25 | -2.8        | not read  | not read  | not read  | not read    | 16: 13.2        |
| `type.heading.md` 1.3  | -1.3 / -1.8 | not read  | 2.7 / 2.2 | 4.7 / 4.2 | 6.7 / 6.2   | none            |
| `type.heading.sm` 1.7  | 2.7 / 2.2   | 4.7 / 4.2 | 6.7 / 6.2 | not read  | 10.7 / 10.2 | none            |

Readings of the assertions the builder keeps or adds:

- `expectInkClearsAbove` at 4 px with the paddings 24 and 16: passes (18.2 / 17.2 and 13.2). With the padding at 0, display.lg reads -5.8 / -6.8, so `StackClear`'s negative half still throws under 4 with Anuphan.
- `type.heading.md` and `type.heading.sm` pad no top of their own. At pad 0 they fail 4 px (-1.3 / -1.8 and 2.7 / 2.2). The smallest padding that passes at both scales is 6 px for heading.md (4.2, 0.2 over the bound) and 2 px for heading.sm (4.2); 8 px (`space.stack.sm`, the `pt-2` of the Scale rows) passes both with 2.2 px or more to spare, which covers the about 1.1 px Mac to Linux spread ORV-221 recorded. DESIGN.md's sentence becomes "leave 8 px above a heading" (from "leave 11 and 8 px").
- Display.lg ink falls 1.81 px below its line box (ผู้). No heading box clips its overflow today, so nothing is cut; it lands in the ground under the row.

Rows of the "before" column reproduce DESIGN.md §4's figures (17 px rise at 56 / 1.2, 6.5 px at 24 / 1.3, 2.5 to 3 px wrapped page header), which calibrates the method; the before and after readings at 20 / 1.7 and 32 / 1.7 equal those of `final.mjs` in the first task.

Numerals keep line height 1 and the body stack; their readings come from `final.mjs` (device scale 2 / 1). They are not checked for caption clearance (body styles, digits only); their lowest ink is the descender of "Intent Engine".

| Style                    | Highest ink before | Highest ink after | Lowest ink before | Lowest ink after | Caption clearance before | Caption clearance after |
| ------------------------ | ------------------ | ----------------- | ----------------- | ---------------- | ------------------------ | ----------------------- |
| `type.numeral.lg` 40 / 1 | 5 / 4              | 3.5 / 3           | 3.5 / 4           | 3 / 3            | 5.2 / 4.2                | 3.7 / 3.2               |
| `type.numeral.md` 32 / 1 | 3.5 / 4            | 2.5 / 2           | 3 / 3             | 2 / 2            | 3.7 / 3.7                | 2.7 / 2.2               |

### Wrapped heading lines at today's line heights (`today.mjs`)

The `expectLinesClear` reading (floor 1.0 at scale 2, 0.5 at scale 1), Sarabun today against Anuphan after, scale 2 / 1. A negative gap is an overlap.

| Style                       | Sarabun (before) | Anuphan (after) | Asserted after this story                                                                        |
| --------------------------- | ---------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `type.display.lg` 56 / 1.2  | -22.08 / -22.34  | -8.43 / -8.13   | no: the wrapped sample is for the designer's sign-off (spec `type-clear-1`)                      |
| `type.display.md` 32 / 1.25 | -11.00 / -10.92  | -3.04 / -2.27   | no, as above                                                                                     |
| `type.heading.md` 24 / 1.3  | -7.29 / -7.27    | 0.15 / 0.32     | no, as above; it is under the floor at both scales                                               |
| `type.heading.sm` 20 / 1.7  | 2.10 / 2.14      | 6.94 / 7.14     | yes: the Scale wrapped sample, and the Page header and Section header `LongTitle` plays as today |
| Page header title 32 / 1.7  | 3.00 / 2.97      | 10.74 / 10.77   | yes: Page header `LongTitle`, as today                                                           |

Every wrapped gap grows with the new faces: display.lg by 13.6 to 14.2 px, display.md by 8.0 to 8.7, heading.md by 7.4 to 7.6, heading.sm by 4.8 to 5.0. The first version of this file gave the display.lg, display.md and heading.md gaps with the scale labels swapped; `lines.mjs 2` of the first task, rerun in this task, reads -8.43, -3.04 and 0.15 at scale 2, as above.

### Body styles and controls (`measure.mjs`, `lines.mjs`)

Thai body text stays Sarabun; only the primary font changes from Plex Sans to Inter.

| Style                                              | Change measured                                                                                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `body.lg` 20 / 1.7, `body.md` 16 / 1.7             | none: same baseline, same Thai rise and fall, lines gap body.md 1.80 / 1.72 both                                                                                       |
| `body.sm`, `label.md` 14 / 1.7, `body.xs` 13 / 1.7 | baseline 1 px lower (Inter's rounded descent 3 against Plex's 4): Thai rise -2 → -1, fall -2.8 → -1.8; lines gap unchanged (label.md 1.76 / 1.69, body.sm 2.00 / 1.91) |
| `label.sm` 13 / 1.5                                | none: rise -2.5 / -3 both                                                                                                                                              |
| `control.md`, `field.sm` 14 / 1.6                  | none: rise -2, fall -1.39 both                                                                                                                                         |

Control label ink centre minus box centre over 16 sub-pixel positions (scale 2), bound 1.5; old and new identical in every case:

| Control                            | Thai body    | Latin      |
| ---------------------------------- | ------------ | ---------- |
| Button sm 32 (`label.sm`)          | -1.44..-0.50 | 0.31..1.25 |
| Button md 40, lg 48 (`control.md`) | -1.44..-0.50 | 0.56..1.50 |
| Input sm 32 (`field.sm`)           | -1.19..-0.25 | 0.56..1.50 |
| Input md 40 (`body.md`)            | -1.56..-0.62 | 0.69..1.63 |

The input md body reading of -1.56 is the same with Plex Sans today; this change does not move it.

### Widths (`widths.mjs`)

Inter is wider than Plex Sans for Latin text: "Save changes" at 14 / 500 87.26 → 93.81 px (x1.075), "Ctrl K" at 13 / 500 x1.046, a body sentence at 16 / 400 x1.050, "Intent Engine" at 56 / 500 x1.010, digits at 40 / 500 x1.001. No play asserts a text width as a number (search in section Impact list); the 360 px frame plays (`scrollWidth <= 360`) run in the full suite and are the guard.

## Values measured for the old fonts

| Value                                                                 | File                                               | Guarding test                                                                                                            | Keep or new                                                                                                                              |
| --------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `type.display.lg` line height 1.2                                     | `semantic.json`, `professional.json`               | `profiles.test.ts` "display stack clearance (row 19)"; Typography `Scale`                                                | keep (spec `type-clear-1`): ink rises 7 / 8 px (Sarabun 17), wrapped gap -8.43 / -8.13 (Sarabun -22.08 / -22.34), not asserted           |
| `type.display.md` line height 1.25                                    | `semantic.json`, `professional.json`               | same                                                                                                                     | keep: ink rises 3.5 / 4 px (Sarabun 9), wrapped gap -3.04 / -2.27 (Sarabun -11.00 / -10.92), not asserted                                |
| `type.heading.md` line height 1.3                                     | `semantic.json`                                    | none today; new assertion in the row 19 block                                                                            | keep: ink rises 2 px (Sarabun 6.5 / 7), wrapped gap 0.15 / 0.32 (Sarabun -7.29 / -7.27), not asserted                                    |
| `text-display-lg` top padding `space.stack.lg` (24)                   | `src/tokens/orivilo.css`                           | `Scale` (paddingTop "24px", `expectInkClearsAbove`); `Testing/Visual asserts` `StackClear`; `profiles.test.ts` row 19    | keep: 18.2 / 17.2 px clear after (7.2 before); with padding 0 it reads -5.8 / -6.8, so `StackClear`'s negative half still throws under 4 |
| `text-display-md` top padding `space.stack.md` (16)                   | `src/tokens/orivilo.css`                           | same                                                                                                                     | keep: 13.2 px clear after (7.2 before)                                                                                                   |
| Page header title: 1.7 line of `heading.sm`, `space.stack.sm` (8) pad | `src/recipes/recipes.css` `.ds-page-header__title` | `PageHeader.stories.tsx` (line height size x 1.7, top padding), `LongTitle` (`expectLinesClear`, `expectFrameCutsNoInk`) | keep: lines gap 10.74 / 10.77, clearance 12.2 after                                                                                      |
| `type.heading.sm` line height 1.7                                     | `semantic.json`                                    | `profiles.test.ts` "wrapping labels and headings clear Thai marks"; `SectionHeader` `LongTitle`                          | keep: gap 6.94 / 7.14 after                                                                                                              |
| Body line heights 1.7 (`body.*`, `label.md`)                          | `semantic.json`                                    | `profiles.test.ts` row 18; `Scale` (34px, 27.2px, 23.8px)                                                                | keep: Sarabun stays the Thai body face, readings unchanged                                                                               |
| `type.label.sm` 1.5                                                   | `semantic.json`                                    | the `expectLabelInkWhole` plays                                                                                          | keep: unchanged reading                                                                                                                  |
| `type.control.md` 1.6                                                 | `semantic.json`                                    | `profiles.test.ts` "ORV-194 row 6b"; Button, Avatar `expectInkCentred`                                                   | keep: centre identical                                                                                                                   |
| `type.field.sm` 1.6                                                   | `semantic.json`                                    | `profiles.test.ts` "ORV-199"; Select `expectInkCentred`                                                                  | keep: centre identical                                                                                                                   |
| Ellipsis clip pad 4 px (label stacks rise up to 3 px)                 | `src/recipes/recipes.css` line 5666                | `LabelInkWhole`, `LabelPaddingNoise`, `FrameCutsNoInk`; the `expectLabelInkWhole` plays                                  | keep: label rise unchanged (-3 px at label.sm); comment names Sarabun as the body face, still true                                       |
| `INK_CENTRE_BOUND` 1.5                                                | `src/testing/visual-asserts.ts`                    | Button, Avatar, Select plays                                                                                             | keep                                                                                                                                     |
| Lines floor 1.5 less one device pixel                                 | `src/testing/visual-asserts.ts` (`linesFloor`)     | every `expectLinesClear` play                                                                                            | keep                                                                                                                                     |
| `expectInkClearsAbove` default 4 px                                   | `src/testing/visual-asserts.ts`                    | `Scale`, `StackClear`, Workspace                                                                                         | keep                                                                                                                                     |
| "Leave 11 and 8 px above a heading" (heading.md, heading.sm)          | `DESIGN.md` §4, line 141                           | none (prose); the Scale `pt-2` rows with `expectInkClearsAbove`                                                          | new: 8 px above either (clears 6.2 and 10.2 px at worst; the smallest passing values are 6 and 2 px)                                     |
| Numerals 40 / 1 and 32 / 1                                            | `semantic.json`                                    | none                                                                                                                     | keep: digits only, ink 3 px or more inside the box top                                                                                   |
| `WEIGHTS_BY_FAMILY` `"IBM Plex Sans": [400, 500, 600]`                | `src/profiles/profiles.test.ts` line 161           | itself                                                                                                                   | new: `"Inter": [400, 500, 600]`; `"IBM Plex Mono"` kept                                                                                  |

## Impact list

Searches, run from the worktree root on the branch head:

- Family names: `git grep -l -P "IBM Plex|plex-sans|plex-mono|Sarabun|sarabun|Anuphan|anuphan|\bInter\b(?!-)|\"inter\"" -- ':!docs/specs/ORV-275'`: 54 files (group A).
- Family utilities and heading type variables naming no family: `git grep -l -E "\bfont-(display|body|mono)\b|text-(display|heading)-(lg|md|sm)|--ds-type-(display|heading)|--ds-font-" -- '*.tsx' '*.ts' '*.css'`, less generated CSS and group A: 11 files (group D, PageHeader moves to C).
- Heading utility with another family: `git grep -n -E "font-(body|mono)[^\"'\`]*text-(display|heading)-|text-(display|heading)-[a-z]+[^\"'\`]*font-(body|mono)"`: 0.
- Heading line-height primitives: `git grep -n -E "line-height\.(1-2|1-25|1-3)\}" -- packages/design-system/src`: 6 (semantic 3, professional 2, the profiles.test fixture 1). All six stay; in the fixture only the family reference changes.
- Line-height text that names a heading value: `1.25` in `PageHeader.stories.tsx` line 93 and `catalog/application/page-header.yaml` line 25 say what `text-display-md` brings; it still brings a 1.25 line, so both stay.
- Text widths asserted as numbers: no story asserts a Latin text width; every numeric width assertion found reads a box or a 360 px frame.

Counts: A 54 (13 change, 41 no change), B font directory 10 today (3 removed, 5 added, 7 unchanged), C 5 files that name no family but change, D 10 files that follow with no edit. Paths the builder touches: 13 + 8 + 5 = 26, the two regenerated CSS files included.

Keeping the line heights changes no profile, recipe, component or screen beyond the font change itself: no line box of any style grows or shrinks, so no layout height moves. The screens follow the new faces only (group D and the components of section Heading and body styles).

### A. Files that name a family (54)

| #     | File                                                                                                                                                                                                                                                                     | Change         | Reason                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `packages/design-system/src/tokens/source/primitives.json`                                                                                                                                                                                                               | change         | section Contract                                                                                                                             |
| 2     | `packages/design-system/src/tokens/source/semantic.json`                                                                                                                                                                                                                 | change         | families, two descriptions; line heights kept                                                                                                |
| 3     | `packages/design-system/src/profiles/source/professional.json`                                                                                                                                                                                                           | change         | restated display styles: family only                                                                                                         |
| 4     | `packages/design-system/src/tokens/generated.css`                                                                                                                                                                                                                        | change         | regenerated by `pnpm --filter @orivilo/design-system tokens`                                                                                 |
| 5     | `packages/design-system/src/profiles/generated.css`                                                                                                                                                                                                                      | change         | regenerated                                                                                                                                  |
| 6     | `packages/design-system/src/tokens/fonts.css`                                                                                                                                                                                                                            | change         | Inter and Anuphan rules, Plex Sans rules out, comments                                                                                       |
| 7     | `packages/design-system/src/tokens/orivilo.css`                                                                                                                                                                                                                          | change         | four family rules; padding comment rewritten with the Anuphan numbers at 1.2 and 1.25                                                        |
| 8     | `packages/design-system/src/recipes/recipes.css`                                                                                                                                                                                                                         | change         | line 5666 comment: "the body face's tallest stack (Sarabun ปี๊, ฟื้)", value kept                                                            |
| 9     | `packages/design-system/src/profiles/profiles.test.ts`                                                                                                                                                                                                                   | change         | weights map, Thai-face test, row 19 block (today's four heading line heights, comment), fixture family                                       |
| 10    | `packages/design-system/src/foundations/typography.stories.tsx`                                                                                                                                                                                                          | change         | spec rows 1, 2, 4, 5, 7, 10                                                                                                                  |
| 11    | `packages/design-system/src/testing/visual-asserts.stories.tsx`                                                                                                                                                                                                          | change         | `StackClear` loads Anuphan first; caption "56 / 1.2" kept; the three Sarabun loads stay (body-style labels)                                  |
| 12    | `DESIGN.md`                                                                                                                                                                                                                                                              | change         | §4 table rows 134 to 136 and bullets 140, 141; version bump and a change-log line (spec row 9); change-log lines 324 and 326 stay as history |
| 13    | `docs/context/brand/orivilo-brand-spec-v1.1.md`                                                                                                                                                                                                                          | change         | §6 table, stack and scale lines 72 to 78; new "Changes in v1.6" section (spec row 9)                                                         |
| 14    | `packages/design-system/src/components/fixtures.ts`                                                                                                                                                                                                                      | no change      | mock chat copy and a long identifier naming fonts as content (spec "Out of scope")                                                           |
| 15    | `packages/design-system/src/components/canvas-board/fixtures.ts`                                                                                                                                                                                                         | no change      | mock node summary                                                                                                                            |
| 16    | `packages/design-system/src/examples/decision-log.tsx`                                                                                                                                                                                                                   | no change      | mock decision title                                                                                                                          |
| 17    | `packages/design-system/src/examples/brand-report.stories.tsx`                                                                                                                                                                                                           | no change      | a customer page's font evidence ("inter")                                                                                                    |
| 18    | `packages/intent-engine/src/suggest.ts`                                                                                                                                                                                                                                  | no change      | font suggestions for a customer brand (spec "Out of scope")                                                                                  |
| 19    | `packages/intent-engine/src/suggest.test.ts`                                                                                                                                                                                                                             | no change      | same                                                                                                                                         |
| 20    | `packages/intent-engine/src/url-analyser.test.ts`                                                                                                                                                                                                                        | no change      | customer font analysis                                                                                                                       |
| 21    | `packages/intent-engine/src/measures/page.test.ts`                                                                                                                                                                                                                       | no change      | same                                                                                                                                         |
| 22    | `packages/intent-engine/src/evidence.test.ts`                                                                                                                                                                                                                            | no change      | same                                                                                                                                         |
| 23    | `packages/intent-engine/src/report.test.ts`                                                                                                                                                                                                                              | no change      | same                                                                                                                                         |
| 24    | `packages/intent-engine/src/report-view.test.ts`                                                                                                                                                                                                                         | no change      | same                                                                                                                                         |
| 25    | `docs/context/brand/brand-ci-method.md`                                                                                                                                                                                                                                  | no change      | research method; names candidate faces                                                                                                       |
| 26    | `docs/context/brand/brand-identity-v1-review.md`                                                                                                                                                                                                                         | no change      | review of brand v1, history                                                                                                                  |
| 27    | `docs/context/brand/orivilo-brand-identity-v1.md`                                                                                                                                                                                                                        | no change      | brand v1, superseded by `orivilo-brand-spec-v1.1.md`                                                                                         |
| 28    | `docs/context/ui-direction.md`                                                                                                                                                                                                                                           | no change      | the 2026-10-21 direction study, history; listed for the owner (report)                                                                       |
| 29    | `docs/knowledge/design/K-0103-ibm-type-scale-thai-at-95-percent-same-line-height.md`                                                                                                                                                                                     | no change      | research source entry                                                                                                                        |
| 30    | `docs/knowledge/design/K-0104-thai-is-a-tall-script-with-stacked-marks.md`                                                                                                                                                                                               | no change here | line 45 "ORIVILO sets Thai in Sarabun in every profile" goes stale; listed for the owner (report)                                            |
| 31    | research note on tall scripts clipping at a 1.1 line height (under docs/knowledge/design)                                                                                                                                                                                | no change      | research source entry                                                                                                                        |
| 32    | `docs/knowledge/design/K-0107-synthesis-title-supporting-text-and-paragraph-line-height.md`                                                                                                                                                                              | no change      | "no source gives a Sarabun figure" stays true                                                                                                |
| 33-54 | `docs/specs/` ORV-100 design, ORV-105 design, ORV-107 design, ORV-111 design, spec, tech, ORV-114 spec, ORV-128 spec, tech, ORV-192 design, spec, ORV-194 design, spec, ORV-199 design, spec, ORV-217, ORV-224, ORV-230, ORV-26, ORV-266, ORV-52, ORV-61 spec (22 files) | no change      | the history of their stories; ORV-192 rows 15 and 16 are superseded by spec `type-face-1`, not rewritten                                     |

`apps/web`: 0 files name a family (search above).

### B. Font directory (`packages/design-system/src/tokens/fonts/`)

Removed 3: `plex-sans-latin.woff2`, `plex-sans-latin-ext.woff2`, `LICENSE-ibm-plex-sans.txt`. Added 5: `inter-latin.woff2`, `inter-latin-ext.woff2`, `anuphan-thai.woff2`, `LICENSE-inter.txt`, `LICENSE-anuphan.txt`. Unchanged 7: the three Sarabun files, `LICENSE-sarabun.txt`, the two Plex Mono files, `LICENSE-ibm-plex-mono.txt`. After: 12 files, four licences (spec row 6).

### C. Files that name no family but change (5)

| File                                                                             | Change                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/design-system/catalog/coverage.md` line 121                            | row name "Tokens and type specimen" becomes "Tokens and type specimen: Inter, Anuphan, Sarabun, IBM Plex Mono" (spec row 9's foundation line); tier, status and story unchanged |
| `packages/design-system/src/components/page-header/PageHeader.stories.tsx`       | `Default` play asserts the title stack (spec row 2); comment lines 93 and 94 ("not the 1.25 and 16 px of text-display-md") stay true and stay                                   |
| `packages/design-system/src/components/section-header/SectionHeader.stories.tsx` | `Default` play asserts the title stack (spec row 2)                                                                                                                             |
| `packages/design-system/src/components/card/Card.stories.tsx`                    | `Default` play asserts the untyped paragraph's stack (spec row 3)                                                                                                               |
| `apps/web/e2e/fonts.spec.ts` (new)                                               | spec rows 5 and 11                                                                                                                                                              |

### D. Files that follow the tokens with no edit (10)

`apps/web/app/page.tsx`, `apps/web/app/not-found.tsx`, `apps/web/app/account/page.tsx`, `apps/web/app/directions/page.tsx`, `apps/web/app/directions/SavedStudio.tsx`, `packages/design-system/src/components/badge/Badge.stories.tsx`, `packages/design-system/src/examples/landing.tsx`, `packages/design-system/src/examples/members.tsx`, `packages/design-system/src/foundations/profiles.stories.tsx`, `packages/design-system/src/foundations/shared.tsx`. They use `font-display`, `font-body`, `font-mono` or a type utility; the theme variables and the group C rules carry the new families. Every recipe and component token reads `--ds-type-*` parts, so the components named in section Heading and body styles follow too.

## Build order

One builder task, one PR, in this order. Worktree `.claude/worktrees/orv-275`.

1. Font files. Download the three WOFF2 files and two licences from the URLs in section Font files into `src/tokens/fonts/` under the names given, check each SHA-256 against the table, then `git rm` the three IBM Plex Sans files.
2. `fonts.css`: add the Anuphan and two Inter rules, drop the two Plex Sans rules, rewrite the comments (no "IBM Plex Sans" left, spec row 6).
3. Tokens: edit `primitives.json` (the two new families, `plex-sans` out; no line-height step touched), `semantic.json` (families and the two `font.*` descriptions; every `lineHeight` reference kept) and `professional.json` (family only; `1-2` and `1-25` kept); run `pnpm --filter @orivilo/design-system tokens`; commit both `generated.css` files. In the generated CSS no `--op-font-line-height-*` and no `--ds-type-*-line-height` line changes.
4. `orivilo.css`: the four family rules after the display padding rules; rewrite the padding comment with the Anuphan reading: "Display type pads its own top (ORV-192 row 19): Anuphan's tallest stack (ปี๊) rises 7 to 8 px above a 56 / 1.2 line box and 3.5 to 4 px above a 32 / 1.25 one; the padding keeps it 13 px or more clear of whatever sits above (ORV-275)." `recipes.css` line 5666 comment as group A row 8.
5. `profiles.test.ts`:
   - `WEIGHTS_BY_FAMILY`: `"Inter": [400, 500, 600]`, `"IBM Plex Mono": [400, 500]`.
   - Replace "Thai face (row 16)" with a block over `CONTRAST_SETS` (four sets, ids neutral, professional, friendly, orivilo): heading styles and `font.display` equal `["Inter", "Anuphan", "system-ui", "sans-serif"]`; body styles, numerals and `font.body` equal `["Inter", "Sarabun", "system-ui", "sans-serif"]`; `type.code.md` and `font.mono` equal `["IBM Plex Mono", "Sarabun", "ui-monospace", "monospace"]`; no stack names "IBM Plex Sans" or "IBM Plex Sans Thai"; the Thai face (`family[1]`) of each is in a list with its weights, Anuphan and Sarabun `[400, 500, 600]`, and each style's weight is in it.
   - Row 19 block (spec row 7): under every set, `type.display.lg` 56 px at line height `toBe(1.2)`, `type.display.md` 32 px `toBe(1.25)`, `type.heading.md` 24 px `toBe(1.3)` and `type.heading.sm` 20 px `toBe(1.7)`; stack.lg 24 and stack.md 16 kept. Its comment says the paddings are 24 and 16 px and were re-measured with Anuphan in this file's section Metrics.
   - Fixture at line 424: `{font.family.inter-anuphan}`; `{font.line-height.1-2}` kept.
6. `typography.stories.tsx`:
   - Intro and the three-family block with the spec's copy table (spec row 10), each sample in its family.
   - `SCALE` gets 15 rows, one per type style, `font-display` on the four heading rows, `font-body` on the ten body rows, `font-mono` on code. Captions give today's line heights: "56 / 1.2", "32 / 1.25", "24 / 1.3", "20 / 1.7" for the heading rows, the body, label, control, field, numeral and code values of section Contract for the rest. Numeral rows show "Intent Engine 0123" (digits only, spec `type-face-1`); every other row shows `SAMPLE`.
   - The `heading.md` and `heading.sm` rows carry `pt-2` (8 px, a layout utility): these styles do not pad their own top, and DESIGN.md §4 asks 8 px above a heading. Measured clearance 6.7 / 6.2 and 10.7 / 10.2 px (section Metrics); without it both fail the 4 px bound.
   - Each heading row's wrapper `div` (today `border-b border-border-subtle pb-6`, holding the `dt` caption and the `dd` sample) also holds a wrapped sample: the row's type classes on `SAMPLE` at a 360 px layout width. The wrapper carries `overflow-hidden` (layout). Reason: `expectNoGlyphClip` checks glyph boxes only under a clipping ancestor inside the element it is given, and throws "has no text under a clipping ancestor to check" when there is none; no Scale element clips today, so `expectNoGlyphClip` on a bare `dd` fails with any font. The clip goes on the wrapper, not the `dd`: Inter's font box (1.21 em, section Font tables) is taller than a 1.2 line, and display.lg ink falls 1.81 px below its line box, so a clip on the `dd` would fail the helper and cut real ink; the wrapper's 24 px bottom padding holds both.
   - `Scale` play: wait for `document.fonts.load` of "500 56px Anuphan", "500 20px Anuphan" (Thai text) and "400 16px Inter" ("A") before any shot. Assert each sans row matches `/^Inter, /` and never "IBM Plex Sans"; heading rows `/^Inter, Anuphan,/`, body rows `/^Inter, Sarabun,/`, code `/^"IBM Plex Mono", Sarabun,/`. For each of the four heading rows, `expectNoGlyphClip(wrapper)` and `expectInkClearsAbove(dd, dt, 4)`. `expectLinesClear` runs on the `type.heading.sm` wrapped sample only (gap 6.94 / 7.14, floor 1.0 / 0.5); the display.lg, display.md and heading.md wrapped samples carry no clearance assertion and are for the designer's sign-off (spec `type-clear-1`). `expectNoGlyphClip` cannot see ink above the font's ascent (its doc comment), so the top of each row is guarded by `expectInkClearsAbove`. Every `.woff2` resource entry starts with `location.origin`. Line heights 34px, 27.2px, 23.8px and paddings 24px, 16px are kept.
   - `Friendly` play: heading lines match `/^Inter, Anuphan,/`.
7. `visual-asserts.stories.tsx` `StackClear`: caption "Display 56: 56 / 1.2, weight 500" kept; the play loads "500 56px Anuphan" for "ฟื้นฟู" before the first shot. Both halves keep their assertions: with padding 0 the reading is -5.8 / -6.8 px and throws under 4; with the shipped 24 px it is 18.2 / 17.2 and passes. Its doc comment keeps "the stack of ฟื้ rises into the caption", still true with Anuphan.
8. `PageHeader.stories.tsx`, `SectionHeader.stories.tsx`, `Card.stories.tsx` as group C.
9. `apps/web/e2e/fonts.spec.ts` on `/`:
   - every request of resource type `font` has the page's origin, and a loaded `FontFace` with family "Inter" exists;
   - the `h1` (`text-display-md`) and an `h2` (`text-heading-sm`) compute `/^Inter, Anuphan,/`;
   - a paragraph computes `/^Inter, Sarabun,/`.
10. Docs:
    - DESIGN.md §4 table: Display row names the Inter, Anuphan stack and keeps "56/1.2 and 32/1.25"; Body/UI row names Inter, Sarabun; Mono row unchanged.
    - Bullet 140 rewritten for `type-face-1`.
    - Bullet 141 with this file's numbers, the rest of its text kept: "Anuphan's tallest stack (ปี๊) rises 7 to 8 px above a 56 / 1.2 line box and 3.5 to 4 px above a 32 / 1.25 one, so `text-display-lg` takes `space.stack.lg` (24) and `text-display-md` takes `space.stack.md` (16) as `padding-block-start`, and the mark stays 13 px or more clear of what sits above." For the Page header: "the mark clears by 12 px, wrapped lines clear each other by 10.7 px at 32 px (at 1.25 they overlap by 2.3 to 3)"; "a one-line title grows 6.39 px" kept (line-height arithmetic, no font in it). "Heading stacks rise 2 px (24 / 1.3) and sit 2 px inside the line top (20 / 1.7): leave 8 px above a heading." The Section header sentence ("the caller leaves 8 px or more above it") stays.
    - Version bump and a change-log line that says the faces change and no line height does.
    - Brand spec §6: the table and the stack line name the four faces; the scale line keeps its line heights, and "Looped below 24 px, loopless above." becomes "Loopless Thai (Anuphan) in every heading style, looped Thai (Sarabun) in body text."; a "Changes in v1.6" section.
    - Catalog: the `coverage.md` line of group C. `page-header.yaml` line 25 stays.
    - Run prettier on the changed Markdown and YAML.
11. Checks:
    - `pnpm --filter @orivilo/design-system exec vitest run src/profiles/profiles.test.ts`.
    - The affected stories by `vitest related`: Typography, Visual asserts, Page header, Section header, Card, and the plays of spec row 8 (`grep -rln -e expectInkCentred -e expectLabelInkWhole packages/design-system/src --include=*.stories.tsx`).
    - The two greps of spec rows 5 and 6.
    - Then `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, `pnpm contrast` and the `apps/web` e2e.
    - A config, preview or `fonts.css` change runs the full suite while building (`.claude/rules/testing.md`).
