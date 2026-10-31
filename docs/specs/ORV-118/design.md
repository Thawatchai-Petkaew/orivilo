# ORV-118: design notes

Design decisions for ORV-118 (spec: `docs/specs/ORV-118/spec.md`, tech notes: `docs/specs/ORV-118/tech.md`). Each row is a numbered look change the builder makes as written; the designer proved it rendered before any builder envelope (L-0017).

## Rows

| #   | Target                                                                                                                                                                                                                                                                                                                    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Source                                                                                                                                                               | Play that proves it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Badge` variant `brand`: component tokens `badge.brand.bg`, `badge.brand.fg`, `badge.dot.brand` (`src/tokens/source/component.json` lines 733, 737, 784) and the markup in `src/components/badge/Badge.tsx` (lines 4 to 51)                                                                                               | `badge.brand.bg` `{surface.sunken}`, `badge.brand.fg` `{text.primary}`, `badge.dot.brand` `{brand.dot-small}`. The brand variant always renders its bead: the existing `.ds-badge__dot` span, 8 px (`badge.dot-size`), before the word. `icon` on `variant="brand"` becomes a type error. Height stays 20 px (sm) and 24 px (md), one line. No recipe line in `recipes.css` changes; no new colour value                                                              | Finding F1 of sign-off `ORV-118-signoff-2` (tech notes section 12, risk 5); the owner-delegated decision in ORV-118 comment 10373                                    | `Base/Badge` story `Variants` (a new play): the brand badge's first child is `.ds-badge__dot` with `aria-hidden="true"` and the text is `ORIVILO` alone; its `background-color` equals the neutral badge's; its `color` equals a probe span's `color: var(--ds-text-primary)`; the bead's `background-color` equals a probe's `var(--ds-brand-dot-small)`; its height equals the neutral badge's. `Application/Direction Studio` story `Default`, after line 74: the recommended badge holds a `.ds-badge__dot` and its `background-color` differs from that of the card's own button (`th.useLabel` with สุขุม). Probes, not literals, so both plays hold under every toolbar profile and mode |
| 2   | Status: **G2 decided by the owner (ORV-118 comment 10376), opening 110 degrees; built in round 3**. The mark: `src/components/logo/geometry.ts` (`GEOMETRY.mark.ring`, a new `DOT_RADIUS`), `drawing.ts` (`markParts`), `orivilo-mark.svg` and `orivilo-lockup.svg` in `docs/context/brand/assets/`, brand spec section 2 | Kept: ring centre (75, 77.5), radius 52.5, round caps, stroke 34 / 32 / 30 by form, dot centre (105.11, 34.49) on the centreline, opening centred at 55 degrees. Changed: the dot's radius is half the stroke in each form (17, 16, 15; diameter 34, 32, 30) and the opening widens from 80 to 110 degrees, one arc `M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5` in every form. Gap 1.54 px at 16, 2.2 px at 20 (was 0.42 and 0.66). No colour value or token changes | Owner, ORV-118 comment 10375 (keep the mark, dot as wide as the stroke, more space before the dot), answering comment 10374; sign-off `ORV-118-signoff-1` finding F2 | `Base/Logo` story `Small sizes`: the dot's `r` is half the ring's `stroke-width` at every height and the ring's `d` is the G2 arc; W1 stays `52.50 52.50`, W2 becomes `30 18.48 3.94`, `32 16.48 2.64`, `34 14.48 1.54`. Pixel probe on the 16 px mark at scale 1, light, dark and one-colour: pixel (8, 3) is the canvas and pixel (12, 5) is within 24 of it                                                                                                                                                                                                                                                                                                                                  |

## Row 1: the brand badge is a bead on a quiet ground

### What was wrong

Since the signature turned violet (comment 10336), `badge.brand.bg` reads `brand.signature` and `badge.brand.fg` reads `brand.ink`. Under neutral these resolve to the primary button's values: white on violet.600 #7A22C7 in light, ink #16151D on violet.400 #B07FEE in dark, radius 999px on both. In the recommended Direction Studio card (and on `/directions`), the 20 px badge แนะนำ / Recommended sits above the 32 px button ดูทิศทางนี้ / View this direction and the two read as one object at two sizes; the selected card's border is violet too. DESIGN.md section 8 says brand presence is never an action. The tokens keep the two apart; the look did not.

### The change

| Token or code                            | Before                          | After                                                                                       |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `badge.brand.bg` (`component.json:733`)  | `{brand.signature}`             | `{surface.sunken}`, the neutral badge's ground                                              |
| `badge.brand.fg` (`component.json:737`)  | `{brand.ink}`                   | `{text.primary}`, one step stronger than the neutral badge's `text.secondary`               |
| `badge.dot.brand` (`component.json:784`) | `{brand.ink}`                   | `{brand.dot-small}`, the mark's small dot, which carries a 3.0 floor under every profile    |
| `Badge.tsx`, the dot span (line 43)      | rendered when `dot` is true     | rendered when `dot` is true or `variant === "brand"`; the icon span renders only without it |
| `BadgeProps` (lines 6 to 26)             | `icon` allowed on every variant | `variant: "brand"` takes `dot` but not `icon`: `icon` with brand is a type error            |
| `recipes.css` lines 733 to 760           | unchanged                       | unchanged: the recipe already reads `--cmp-badge-brand-*` and `--cmp-badge-dot-brand`       |

The bead uses the dot recipe as it stands: 8 px, `border-radius: var(--cmp-badge-radius)` (a circle under neutral and Friendly; 6 px on 8 px under Professional, which renders round), gap `--cmp-button-gap` (8 px), so the brand badge is one bead wider than the neutral one and every other measure is the neutral badge's.

Why the icon goes: the bead is what tells the brand badge from the neutral one, since they now share a ground. With an icon in its place (the `WithIcon` story passes a check) the brand badge is a neutral badge with a darker label, and a check reads as "done well", which DESIGN.md section 8 keeps apart from brand. One mark per badge stays the rule (`OneMarkOnly`).

### Colour pairs

The paths in `src/recipes/pairs.ts` (slot "brand", `badge.brand.fg` on `badge.brand.bg`, floor 4.5; slot "brand dot", `badge.dot.brand` on `badge.brand.bg`, floor 3.0) stay; what they resolve to changes. Ratios from the token source through `src/foundations/contrast.ts` (`/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/badge-row1/ratios.ts`), light / dark:

| Pair                                    | Floor | Neutral     | Professional | Friendly    | Status  |
| --------------------------------------- | ----- | ----------- | ------------ | ----------- | ------- |
| `brand.ink` on `brand.signature`, label | 4.5   | 7.3 / 6.1   | 9.3 / 6.7    | 6.8 / 6.8   | dropped |
| `brand.ink` on `brand.signature`, dot   | 3.0   | 7.3 / 6.1   | 9.3 / 6.7    | 6.8 / 6.8   | dropped |
| `text.primary` on `surface.sunken`      | 4.5   | 16.0 / 18.0 | 14.0 / 16.8  | 14.2 / 17.0 | added   |
| `brand.dot-small` on `surface.sunken`   | 3.0   | 6.4 / 6.9   | 7.8 / 8.1    | 6.5 / 8.1   | added   |

`text.primary` on `surface.sunken` is already a semantic pair (`contrast-pairs.ts` line 42); `brand.dot-small` on `surface.sunken` is new to the recipe list and passes with room. The semantic pair `brand.ink` on `brand.signature` (`contrast-pairs.ts` line 79, `semantic.json` `brand.ink`) stays in the contract; after this row no component token reads `brand.ink`, which remains an identity token a profile may set.

### Impact (the builder updates these in the same change)

- `src/tokens/tokens.test.ts`, "has one reader, the logo component tokens": the readers of `{brand.dot-small}` become `["badge.dot.brand", "logo.dot-small"]` and `componentsReading(["brand.dot-small"])` becomes `["badge", "logo"]`; rename the test to match.
- `src/tokens/tokens.test.ts`, "keeps brand readers and action readers apart": `componentsReading(["brand.signature"])` becomes `["logo", "nav-item", "tile"]`.
- `src/tokens/source/semantic.json`, `brand.dot-small` `$description`: "read only by logo.dot-small" becomes "read by logo.dot-small and badge.dot.brand (the brand badge's bead)".
- `src/components/badge/Badge.stories.tsx`: `ICONS` and the `WithIcon` and `RecipesAndModes` icon rows leave out `brand`; add the `Variants` play above; keep `OneMarkOnly`.
- `src/components/direction-studio/DirectionStudio.stories.tsx`: the assertion above in `Default`.
- `catalog/base/badge.yaml` `rules`: brand always shows its bead in `brand.dot-small` on the neutral ground and takes no icon.
- DESIGN.md section 3.1 row `brand.dot-small` (line 80) and section 8 row "Brand presence" (line 210): the small dot is read by the mark and by the brand badge's bead; a change log entry v1.44.
- `docs/specs/ORV-118/tech.md` section 12 risk 5 and the reader lists at lines 589 and 661: resolved by this row.
- Callers: `DirectionStudio.tsx:217` (sm), `Card.stories.tsx:137` (md), `Badge.stories.tsx:16`. None passes `icon` with brand outside the stories above; `apps/web` passes no brand badge directly.

### Options weighed

- **Bead on the neutral ground (chosen, comment 10373).** Presence becomes the mark's own dot, the thing the logo already spends violet on, and the badge stops being a filled violet pill. The label is `text.primary`, so it stays one step apart from the neutral badge's `text.secondary`.
- **Tinted ground (`surface.selected`).** Under neutral it is a violet wash, the selected card's own ground: the badge would vanish into the recommended card, which is selected by default.
- **Accept the shared look.** Left to the owner by the sign-off; comment 10373 took the bead instead.

### Measured, with the change injected

Method: Storybook dev from this worktree on port 6100 at head `034b488`; per page, after the story's render phase ended, the token change injected as CSS on the brand badge (`.ds-badge[data-variant="brand"]{--cmp-badge-brand-bg:var(--ds-surface-sunken);--cmp-badge-brand-fg:var(--ds-text-primary);--cmp-badge-dot-brand:var(--ds-brand-dot-small)}`) and the markup change injected as the recipe's own `<span class="ds-badge__dot" aria-hidden="true">` prepended to each brand badge with no dot or icon. Viewport 360 and 1440 wide, device scale 2, reduced motion; globals `profile` neutral, professional, friendly, `mode` light, dark, `locale` th, en. Script: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/badge-row1/shoot.mjs`; values in `/tmp/orv-118-design-badge/log.json`.

| Story                      | Size | Profile      | Ground light / dark | Label light / dark | Bead light / dark | Height | Lines | Beside it                    |
| -------------------------- | ---- | ------------ | ------------------- | ------------------ | ----------------- | ------ | ----- | ---------------------------- |
| Direction Studio Default   | sm   | neutral      | #F2F1EC / #060509   | #16151D / #F2F1EC  | #7A22C7 / #B07FEE | 20     | 1     | info badge 20 px, top 0.3 px |
| Direction Studio Default   | sm   | professional | #E8EBEF / #06070A   | #1B1E23 / #E8EBEF  | #254582 / #7CA4EE | 20     | 1     | info badge 20 px, top 0.3 px |
| Direction Studio Default   | sm   | friendly     | #F2ECE3 / #0C0804   | #241D13 / #F2ECE3  | #972F1D / #FC826B | 20     | 1     | info badge 20 px, top 0.3 px |
| Badge Variants, Card Bento | md   | all three    | as above            | as above           | as above          | 24     | 1     | neutral badge 24 px          |

In every render the bead is 8 x 8 px and centred on the badge's middle (offset 0), the page's scroll width equals the viewport, and the brand badge's ground differs from the card button's. The badge is `white-space: nowrap`, so it is one line at every content length; the longest label, Recommended, plus the info badge Viewing fits the 360 px card in one row.

What the screenshots show:

- Direction Studio, all 24: แนะนำ / Recommended is a quiet pill in the neutral badge's ground with a dark label (light) or a near-black pill with a light label (dark), a small round bead before the word in the profile's mark colour (violet, navy, rust in light; light violet, light blue, coral in dark). ดูทิศทางนี้ / View this direction is the only filled pill in the card, so badge and button no longer read as one object. The bead and the info badge กำลังดู / Viewing sit on one baseline and one height. The sara am of แนะนำ and the sara uu of ดู are whole.
- Badge Variants, all 24: the brand badge ORIVILO shares the neutral badge's ground and shape and is told apart by its bead and its darker label; it wraps to the second row at 360 and stays in the row at 1440. The marks of อนุมัติแล้ว and กำลังทำงาน are whole.
- Card Bento, all 24: Intent Engine in the card footer with its bead, on the card ground: a light warm or cool pill on the white card in light; in dark the #1E1D26, #30363D and #3E3424 cards show the sunken pill as a darker inset. One line, Thai heading รอรีวิว with its marks whole.
- Badge WithIcon, all 24 (the type change): today a brand badge with a check is a neutral badge with a darker label, which is why the row drops `icon` on brand.
- Trade-off: under Friendly in dark the coral bead (#FC826B) is close in hue to `feedback.danger.fg` (#F58A80). The danger badge carries a dark red ground and salmon text, the brand badge a near-black ground and light text, and the word carries the meaning, so the two stay apart; it is listed for visual QA.

Screenshots (device scale 2):

- Contact sheets: `/tmp/orv-118-design-badge/sheet-studio-badge-row-360.png`, `/tmp/orv-118-design-badge/sheet-studio-badge-row-1440.png`, `/tmp/orv-118-design-badge/sheet-studio-neutral-360.png`, `/tmp/orv-118-design-badge/sheet-studio-neutral-1440.png`, `/tmp/orv-118-design-badge/sheet-studio-professional-360.png`, `/tmp/orv-118-design-badge/sheet-studio-professional-1440.png`, `/tmp/orv-118-design-badge/sheet-studio-friendly-360.png`, `/tmp/orv-118-design-badge/sheet-studio-friendly-1440.png`, `/tmp/orv-118-design-badge/sheet-variants-360.png`, `/tmp/orv-118-design-badge/sheet-variants-1440.png`, `/tmp/orv-118-design-badge/sheet-with-icon-360.png`, `/tmp/orv-118-design-badge/sheet-with-icon-1440.png`, `/tmp/orv-118-design-badge/sheet-card-bento-360.png`, `/tmp/orv-118-design-badge/sheet-card-bento-1440.png`.
- Single renders, named `/tmp/orv-118-design-badge/<story>-<profile>-<mode>-<locale>-<width>.png` with story `studio`, `variants`, `with-icon`, `card-bento`; profile `neutral`, `professional`, `friendly`; mode `light`, `dark`; locale `th`, `en`; width `360`, `1440` (96 files). For example `/tmp/orv-118-design-badge/studio-neutral-light-th-360.png` and `/tmp/orv-118-design-badge/studio-friendly-dark-en-1440.png`.
- The sign-off's candidate set (`/tmp/orv-118-signoff-2/candidate-bead-badge-*.png`, `/tmp/orv-118-signoff-2/sheet-candidate-bead-badge-360.png`) drew the bead as a `::before` with a 4 px gap and covered Professional and Friendly only in Thai at 360; the set above replaces it with the markup the builder adds and the full grid.

### Screens to check in visual QA

- `application-direction-studio--default` at 360 and 1440, light and dark, Thai and English, under neutral, Professional and Friendly: the recommended badge is a quiet pill with a bead, the card's button is the only filled pill, the badge and the info badge share one height and baseline, the Thai marks are whole.
- `base-badge--variants`, `base-badge--recipes-and-modes` and `application-card--bento` under the same grid: the brand badge carries its bead and the neutral ground; under Friendly dark, the brand badge and the danger badge stay apart.
- `/directions` (signed out) at 360 and 1440, light and dark, Thai and English: the same recommended card as in the story.

## Row 2: the dot as wide as the stroke, and more space before it

Status: **geometry decided by the owner (ORV-118 comment 10375); G2, opening 110 degrees, decided by the owner (ORV-118 comment 10376); built in round 3.** Row 1 is untouched.

### What was wrong

The owner raised two points in ORV-118 comment 10374:

1. At a 16 px and a 20 px mark the dot is hard to see. Measured on the geometry at head: at 16 px (form 16, stroke 34) the dot is 3.2 px across and 0.42 px from the top cap; at 20 px (form 24, stroke 32) 4.0 px and 0.66 px. At device scale 1 the dot shares a pixel with the cap, and in one-colour it fuses into the ring (sign-off `ORV-118-signoff-1` F2, W2 `34 3.91 0.42`).
2. The open ring with a dot reads as a refresh, loading or power icon.

In comment 10375 the owner kept the mark and asked for two changes only: the dot's diameter equals the ring stroke, and there is more space before the dot. The current geometry is a look the spec prescribed (brand spec v1.2 section 2, `logo-geometry-1`), so this is a finding against the spec (L-0019).

### The decision and the gap sizes

Kept as now: the 150 box, ring centre (75, 77.5), radius 52.5, round caps, the stroke ladder 34 / 32 / 30 by form (`logo-size-1`), the dot's centre on the ring centreline at the opening (105.11, 34.49), the opening centred at 55 degrees, the lockup offsets and every colour (neutral: ring `logo.ink` = `text.primary` #16151D light, #F2F1EC dark; dot `brand.dot-small` / `brand.signature` #7A22C7 light, #B07FEE dark).

Changed: the dot's radius is half the stroke in each form (17 in form 16, 16 in form 24, 15 in the master, which is today's value), and the opening widens. With the dot as wide as the stroke and the opening left at 80 degrees, the gap at 16 px would shrink from 0.42 to 0.20 px (1.91 units), so the opening has to grow. One opening angle serves every form: the gap in units is the chord between the dot's centre and a cap's centre minus the stroke, so it is smallest in form 16 and a little larger in the forms above.

Measures in CSS px: dot diameter / narrowest gap between the dot and a cap / narrowest opening between the two caps. The 1x pixel is the lightest pixel on the line from the dot's centre to each cap's centre in a 16 px raster at device scale 1 (upper cap, lower cap; light / dark, the same in one-colour).

| #   | Opening     | Ring arc, every form                          | Gap units (forms 16 / 24 / master) | 16 px              | 20 px              | 16 px 1x pixel between dot and caps                   |
| --- | ----------- | --------------------------------------------- | ---------------------------------- | ------------------ | ------------------ | ----------------------------------------------------- |
| Now | 80 degrees  | `M 70.42 25.2 A 52.5 52.5 0 1 0 125.71 63.91` | 3.91 / 4.91 / 5.91                 | 3.2 / 0.42 / 3.57  | 4.0 / 0.66 / 4.73  | #C0A4D6, #AF7DD9 / #52426A, #6C5092: joined           |
| G1  | 100 degrees | `M 61.41 26.79 A 52.5 52.5 0 1 0 127.3 72.92` | 10.37 / 12.37 / 14.37              | 3.63 / 1.11 / 4.95 | 4.27 / 1.65 / 6.46 | #C2C2C1, #EDE8ED / #46454A, #1D1928: upper cap joined |
| G2  | 110 degrees | `M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5`  | 14.48 / 16.48 / 18.48              | 3.63 / 1.54 / 5.55 | 4.27 / 2.2 / 7.2   | #F4F4F0, #EDE8ED / #16151D, #1D1928: parted           |
| G3  | 120 degrees | `M 52.81 29.92 A 52.5 52.5 0 1 0 127.3 82.08` | 18.5 / 20.5 / 22.5                 | 3.63 / 1.97 / 6.07 | 4.27 / 2.73 / 7.86 | canvas on both sides, light and dark: parted          |

At 20 px G2 and G3 give a pure canvas pixel on both sides; G1 toward the upper cap gives #E4D8EB (light) and #2A2238 (dark).

### Recommendation: G2, opening 110 degrees

- The gap at 16 px grows from 0.42 to 1.54 px and at 20 px from 0.66 to 2.2 px; the dot grows from 3.2 to 3.63 px and from 4.0 to 4.27 px. In the 16 px 1x raster the pixel toward the upper cap is pure canvas and the one toward the lower cap is #EDE8ED in light and #1D1928 in dark (about 5 percent ink), in full colour and in one-colour, so the dot stands apart in a tab bar; at 20 px both sides are pure canvas.
- The lower end lands on the horizontal through the ring centre (127.5, 77.5), a construction a reader can redraw, and the ring keeps 250 degrees of its turn, so the mark still reads as an "o" with a dot in the lockup at 24 and 48 px.
- G1 leaves a grey pixel (#C2C2C1 light, #46454A dark) joining the dot to the upper cap at 16 px, the fault the owner named. G3 parts the dot cleanly at 16 px, but a third of the ring is open: at 64 px and in the 48 px lockup it reads as a "c", the read brand spec 2 moved the opening to 55 degrees to avoid.
- Trade-off: a wider opening is a little more like a spinner's arc (concern 2). The owner kept the mark in comment 10375; the lineup with three outsiders (brand spec section 8, not run) stays the test for that concern.

### What the builder changes (G2)

| Where                                                                                    | Before                                                                                          | After                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `geometry.ts` `GEOMETRY.mark.ring` (lines 79 to 83)                                      | `d` `M 70.42 25.2 A 52.5 52.5 0 1 0 125.71 63.91`, `start` (70.42, 25.2), `end` (125.71, 63.91) | `d` `M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5`, `start` (57.04, 28.17), `end` (127.5, 77.5); centre, radius and cap unchanged                                                                        |
| `geometry.ts`, a new export beside `RING_STROKE`                                         | the dot is radius 15 in every form                                                              | `DOT_RADIUS: Readonly<Record<LogoForm, number>>` = `{ "16": 17, "24": 16, master: 15 }`, half of `RING_STROKE`; `GEOMETRY.mark.dot` keeps cx 105.11, cy 34.49, r 15 (the master, as in the brand file) |
| `drawing.ts` `markParts` (line 49)                                                       | `r: dot.r`                                                                                      | `r: DOT_RADIUS[form]`                                                                                                                                                                                  |
| `logo.test.ts` W1 (lines 174 to 181)                                                     | ends (70.42, 25.2), (125.71, 63.91)                                                             | the new ends; still `52.50 52.50`                                                                                                                                                                      |
| `logo.test.ts` W2 (lines 184 to 201)                                                     | gap `nearest - (stroke / 2 + dot.r)`, `30 5.91 1.26`, `32 4.91 0.79`, `34 3.91 0.42`            | gap `nearest - (stroke / 2 + DOT_RADIUS[form])`, `30 18.48 3.94`, `32 16.48 2.64`, `34 14.48 1.54`; a new case: `DOT_RADIUS[form] * 2` equals `RING_STROKE[form]` in each form                         |
| `logo.test.ts` markup snapshot (line 353)                                                | `d="M 70.42 25.2 A 52.5 52.5 0 1 0 125.71 63.91"`, `r="15"`                                     | `d="M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5"`, `r="17"` (the 16 px mark is form 16)                                                                                                                 |
| `docs/context/brand/assets/orivilo-mark.svg` line 2, `orivilo-lockup.svg` line 3         | the old arc                                                                                     | the new arc; the circle stays r 15 (both files draw the master). `orivilo-wordmark.svg` unchanged                                                                                                      |
| Brand spec section 2 (file `orivilo-brand-spec-v1.1.md`), becomes v1.3 with a section 11 | Opening 80 degrees; dot radius 15 (half the stroke)                                             | Opening 110 degrees centred at 55, the lower end on the horizontal through the centre; dot diameter equals the stroke in each form (34, 32, 30); "Small" row names the dot too                         |
| `docs/specs/ORV-118/spec.md` `logo-geometry-1` (line 82), `logo-size-1` (line 92)        | the old arc; "the dot stays radius 15"                                                          | the new arc; "the dot's diameter equals the form's stroke: 34, 32, 30"                                                                                                                                 |
| `docs/specs/ORV-118/spec.md` W1 and W2 (lines 161 to 171)                                | the old ends and `30 5.91 1.26`, `32 4.91 0.79`, `34 3.91 0.42`                                 | the new ends in both scripts, the W2 gap `d - s`, expected `30 18.48 3.94`, `32 16.48 2.64`, `34 14.48 1.54`                                                                                           |
| `docs/specs/ORV-118/tech.md` line 242 (markup example) and line 382 (W2 numbers)         | the old `d`, `r="15"`, gaps 5.91, 4.91 and 3.91                                                 | the new `d`, `r="17"`, gaps 18.48, 16.48 and 14.48                                                                                                                                                     |
| `catalog/base/logo.yaml` rule (line 24)                                                  | the stroke follows the mark height                                                              | adds: the dot's diameter equals the ring stroke in each form                                                                                                                                           |

Unchanged: the dot's centre, so the `Logo.stories.tsx` colour probe at (105.11, 34.49) and the ring probe at its left extreme still land inside their parts; the ring's bottom (y = 145) and right extreme, so the lockup baseline, the clear space and W4 to W7; every token and colour pair. The dot's top is at y = 17.49 in form 16, inside the box. The generated favicon, app icons and Storybook logo come from `drawing.ts`, so they follow when that slice regenerates them.

Play that proves it: `Base/Logo` story `Small sizes`: for each height, the dot's `r` attribute is half the ring's `stroke-width` (17 at 12, 16 and 19.9; 16 at 20 and 24; 15 at 24.1, 32 and 120) and the ring's `d` is the G2 arc. Pixel probe on the 16 px mark: the `<svg>` with each part's computed `fill` and `stroke` written inline, drawn onto a 16 x 16 canvas at scale 1 over the canvas colour; pixel (8, 3) equals the canvas and pixel (12, 5) is within 24 of it (RGB distance), in light and dark and with `tone="one-colour"`.

### Considered and not taken (comment 10375)

The first round (task `ORV-118-design-mark`) answered comment 10374 with geometry changes. The owner took none of them and kept the mark. Measures at 16 px and 20 px, dot / gap / opening in CSS px:

| #     | Candidate                                   | What it changed                                                                                                                      | 16 px              | 20 px              |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------ |
| A1    | Wider opening, bigger dot, small forms only | Forms 16 and 24: opening 104 degrees, dot radius 20; master unchanged. Two drawings of the mark                                      | 4.27 / 0.96 / 5.2  | 5.33 / 1.34 / 6.77 |
| A2 B1 | Flat ends, bigger dot                       | Every form: butt ring ends, dot radius 20, opening 80 degrees. Reads as a chart segment                                              | 4.27 / 1.47 / 4.87 | 5.33 / 1.83 / 6.26 |
| A3 B2 | Bead: the dot cuts the loop                 | A closed ring minus a disc of radius 34 round the dot, dot radius 22; the ring becomes a filled outline. Recommended then, not taken | 4.69 / 1.28 / 4.87 | 5.87 / 1.60 / 6.29 |
| B3    | Satellite: dot outside the ring             | Ring radius 46 on (64, 86), opening 70 degrees at 45, dot radius 20 at (128, 22). Reads as "c."                                      | 4.27 / 2.35 / 2.0  | 5.33 / 3.07 / 2.77 |

Their sheets stay for reference: `/tmp/orv-118-design-mark/sheet-a-small-dot.png`, `/tmp/orv-118-design-mark/sheet-b-generic-read.png`.

### Rendered

Method: the candidates are drawn from the first round's parametric module with one option added (the dot's radius is half the form's stroke), `/tmp/orv-118-design-mark-2/marks.mjs`; the sheet is built by `/tmp/orv-118-design-mark-2/sheet.mjs` and shot with Playwright at 1700 px wide, device scale 2, reduced motion. Colours from the token source under neutral (`src/tokens/generated.css`: gray.50 #F4F4F0, gray.900 #16151D, gray.100 #F2F1EC, violet.600 #7A22C7, violet.400 #B07FEE). The "1x" cells are the SVG rasterised to a 16 or 20 px canvas at device scale 1 and shown enlarged without smoothing, as a favicon on a tab bar gets it. Gaps and openings are sampled from the painted ring (`measures.json`; G2 samples 1.55 px at 16 against 1.54 computed for W2); the 1x pixels come from `/tmp/orv-118-design-mark-2/probe.cjs` (`probe.txt`).

- Sheet: `/tmp/orv-118-design-mark-2/sheet-owner-gap.png`: Now, G1, G2, G3 at 16, 20, 24, 32 and 64 px (dot, gap and opening under 16 and 20), 16 and 20 px at 1x zoomed 4x, 16 px one-colour at 1x, the horizontal lockup at 24 and 48 px, in light and dark, with the recommendation.
- Close-up: `/tmp/orv-118-design-mark-2/crop-1x-zoom10.png`: 16 px, 20 px and 16 px one-colour at 1x, zoomed 10x, every candidate, light and dark.

What the sheet shows:

- Now: at 16 px 1x the dot is a violet smudge on the top cap; in one-colour the mark is a closed "o" with a bump.
- G1: the dot is bigger and apart from the lower cap, but a grey pixel still ties it to the upper cap at 16 px, in light, dark and one-colour.
- G2: at 16 px 1x the dot is a separate square of violet with canvas round it; in one-colour it is a separate dot in light and dark. From 24 px up it reads as today's mark with a rounder, fuller dot and a clear breath before it; the lockup keeps its weight and baseline.
- G3: the cleanest separation at 1x, but the ring is visibly a "c" at 64 px and in the 48 px lockup.

### Screens to check in visual QA (when G2 is built)

- `base-logo--small-sizes`, `base-logo--kinds` and `base-logo--one-colour` at 360 and 1440, light and dark, under neutral, Professional and Friendly, device scale 1 and 2: at 16 and 20 px the dot stands apart from both caps in full colour and one-colour, and the dot is as wide as the ring.
- The favicon and the 32 px app icon in a browser tab bar, light and dark.
- The Storybook manager header (lockup at 24) and `/account` (stacked at 80).
