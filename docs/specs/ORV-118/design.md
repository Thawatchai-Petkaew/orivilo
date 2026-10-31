# ORV-118: design notes

Design decisions for ORV-118 (spec: `docs/specs/ORV-118/spec.md`, tech notes: `docs/specs/ORV-118/tech.md`). Each row is a numbered look change the builder makes as written; the designer proved it rendered before any builder envelope (L-0017).

## Rows

| #   | Target                                                                                                                                                                                                                      | Change                                                                                                                                                                                                                                                                                                                                                                                                   | Source                                                                                                                            | Play that proves it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Badge` variant `brand`: component tokens `badge.brand.bg`, `badge.brand.fg`, `badge.dot.brand` (`src/tokens/source/component.json` lines 733, 737, 784) and the markup in `src/components/badge/Badge.tsx` (lines 4 to 51) | `badge.brand.bg` `{surface.sunken}`, `badge.brand.fg` `{text.primary}`, `badge.dot.brand` `{brand.dot-small}`. The brand variant always renders its bead: the existing `.ds-badge__dot` span, 8 px (`badge.dot-size`), before the word. `icon` on `variant="brand"` becomes a type error. Height stays 20 px (sm) and 24 px (md), one line. No recipe line in `recipes.css` changes; no new colour value | Finding F1 of sign-off `ORV-118-signoff-2` (tech notes section 12, risk 5); the owner-delegated decision in ORV-118 comment 10373 | `Base/Badge` story `Variants` (a new play): the brand badge's first child is `.ds-badge__dot` with `aria-hidden="true"` and the text is `ORIVILO` alone; its `background-color` equals the neutral badge's; its `color` equals a probe span's `color: var(--ds-text-primary)`; the bead's `background-color` equals a probe's `var(--ds-brand-dot-small)`; its height equals the neutral badge's. `Application/Direction Studio` story `Default`, after line 74: the recommended badge holds a `.ds-badge__dot` and its `background-color` differs from that of the card's own button (`th.useLabel` with สุขุม). Probes, not literals, so both plays hold under every toolbar profile and mode |

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
