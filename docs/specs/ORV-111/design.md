---
issue: ORV-111 (https://tpetkaew.atlassian.net/browse/ORV-111)
spec: docs/specs/ORV-111/spec.md (v1.1)
tech: docs/specs/ORV-111/tech.md (Before, base 18763ee)
task: ORV-111-design-1
---

# ORV-111: design

## Row 2 target

### Decision

**Target, one sentence the builder can measure:** in a single-line control, the label's body (the ink of the label with its Thai marks above and below the consonant removed; a Latin label as it is) is centred on the control: `ink-centre-1` run on that body reads at most 1.5 CSS px either way at sm, md and lg, in light and in dark, at device scale factor 1, and the marks above the body rise freely, so the whole-ink offset of a Thai label is reported, not judged.

Chosen candidate: **C, the consonant-body target, with no change to `fonts.css`, the tokens or any recipe.** The base `18763ee` already meets it (readings below). The Thai label rides "high" only by the measure of its whole ink. The cause is the stacked vowel and tone marks (ลี่, ที่, ซื้อ), which Thai sets above its consonants by design, as Latin sets accents above its capitals.

Why not move the baseline (B):

1. **Whole-ink centring depends on the string, not on the type.** At md on the base, the whole-ink offset of Thai labels runs from +0.5 (ตกลง, no marks) to -3.0 (ยืนยันที่นี่, บันทึกการเปลี่ยนแปลง), a spread of 3.5 px. At sm it runs from 0 to -4. A font or token change moves every label by the same amount, so it can centre one of them and no more. B centres บันทึกการเปลี่ยนแปลง (0.0) and pushes ตกลง to +3.5, Sign up to +4.0 and Save changes to +4.0. The B zoom shows it: in a Thai document every label without stacks, and every Latin label, sits low.
2. **The baseline is shared.** Thai and Latin in one control sit on one baseline, set by IBM Plex Sans as the primary font. Only the strut moves Thai, and the strut moves Latin and digits with it. In a Thai document the Studio is full of Latin and digits (names, counts, units), and all of them would drop 3 px off centre.
3. **B splits a string by locale.** B can only be scoped with `:lang(th)`. The same Thai label in an English document (Storybook's default, a Thai user name in an English Studio) stays where it is today.
4. **B clips lower vowels.** It moves the baseline to 2 px above the bottom of the sm line box (13 / 1.5). ุ and ู reach 0.33 em below the baseline, so ปุ่มสั่งซื้อ at sm inks 2.25 px below its line box (ink 6 to 28 in a 32 px control, line box 6.25 to 25.75). Any label that truncates with `overflow: hidden` would cut them.

By the body, the base is already centred. The fixture's body reads -0.5 to -1.06 at md and lg and -0.56 to -1.0 at sm. That body includes the stem of ป, which rises like a Latin ascender to 0.815 em. A label without a stem reads 0 to +1.0 (ตกลง, ยกเลิก, ยืนยันที่นี่). English reads +0.44 to +1.0. The body sits on the centre on both sides of the 1 px target, which is where a font change cannot improve it: every change that brings one of these closer pushes another one out.

### Rows

<!-- prettier-ignore -->
| # | Target | Tokens | The play that proves it |
| --- | --- | --- | --- |
| R2-1 | Body offset (the label with U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E removed, measured by `ink-centre-1` clauses 1 to 8) at most 1.5 CSS px either way, for `fixtures.thai` and `fixtures.latin`, at sm (32 px), md (40 px) and lg (48 px), in neutral light and dark. The bound is the 1 px target plus the half device pixel that text snaps to at device scale factor 1 while the box may sit at a fractional y (the dark cell of the story sits at y + 0.44 and reads up to 0.56 px apart from light for the same markup) | None changed. The controls keep `--cmp-button-height-sm/-md/-lg` (`size.control.*`), `type.label.sm` 13 / 1.5 and `type.label.md` 14 / 1.6, family `font.family.plex-sans` ("IBM Plex Sans", Sarabun, system-ui, sans-serif) | Base/Button, story Label Centre: `expectInkCentred(cell, buttons, { measure: "body" })`. The helper renders each Thai label without its marks, measures it, and puts the label back. The scale is `devicePixelRatio`, not the screenshot width over the CSS width (build-3 needs_decision 1). One screenshot per boundary per pass |
| R2-2 | The whole-ink offset is reported, not judged: the failure message and `tech.md` list it beside the body offset, so a reader sees how far the marks rise | None | Same play; the helper returns both offsets |
| R2-3 | Guard against the wrong fix: a change that moves the baseline by 2 px or more fails R2-1 (B reads Thai body +1.94 to +2.5 and English +3.44 to +4.0) | None | Same play, red when B's CSS is injected |
| R2-4 | Stacked marks stay inside the control at every size: the topmost ink of บันทึกการเปลี่ยนแปลง and ปุ่มสั่งซื้อ clears the inner border edge (sm ink top 3 px on a 1 px border, so 2 px clear) | None | Covered by the existing `expectInkClearsAbove` where a member uses it; the designer's G3 screenshot otherwise |

### Candidates rendered

Every candidate was injected with `page.addStyleTag` into Base/Button Label Centre (`iframe.html?id=base-button--label-centre`), served from the branch head `b3b5362` on port 6111, in Chromium (Playwright 1.56.1), viewport 360 px. It was rendered in a Thai document (`globals=locale:th`) and an English one (`locale:en`), with neutral light and dark, at sm, md and lg. Each boundary got one extra row per size with ตกลง, ยกเลิก, ยืนยันที่นี่, ปุ่มสั่งซื้อ and Sign up, plus one `text-body-md` paragraph of Thai and Latin set to a 300 px width. These DOM additions exist only in the scratch render; no story changed. Readings are at device scale factor 1 with the scale fixed at 1. Screenshots are at factor 2.

<!-- prettier-ignore -->
| Candidate | CSS route | Thai whole ink sm / md / lg (light, dark) | Thai body sm / md / lg (light, dark) | English sm / md / lg (light, dark) | What it reaches beyond controls |
| --- | --- | --- | --- | --- | --- |
| A, the base | none | -3.5 / -3.0 / -3.0; -3.06 / -3.56 / -3.56 | -1.0 / -0.5 / -0.5; -0.56 / -1.06 / -1.06 | +0.5 / +1.0 / +1.0; +0.94 / +0.44 / +0.44 | Nothing |
| B, Sarabun sets the baseline in a Thai document, shifted to centre the whole Thai ink | a Sarabun 500 face that covers U+0020 only (so Chromium takes it as the primary font) with `ascent-override: 124.2%`, `descent-override: 5.8%`, `line-gap-override: 0%`, set first in `--op-font-family-plex-sans` under `:root:lang(th)` and `:lang(th) [data-mode]` | -0.5 / 0.0 / 0.0; -0.06 / -0.56 / -0.56 | +2.0 / +2.5 / +2.5; +2.44 / +1.94 / +1.94 | +3.5 / +4.0 / +4.0; +3.94 / +3.44 / +3.44 | Every `type.*` role and `font.*` family that reads `font.family.plex-sans`, in a Thai document only: running text, headings, display, tables, badges and the canvas drop 0.217 em inside their line box (3 px at 14, 3.5 at 16, 12 at 56). This undoes the ORV-192 row 19 display padding sums, moves Latin and digits off centre, and clips ุ ู in truncated sm labels. Line-box heights do not change: the paragraph is 3 lines, 81.56 px, in A, B and B plain (27.19 per line, body.md 16 / 1.7), so two lines are 54.4 px in each. In an English document nothing changes, so the same Thai text sits 3 px apart by locale |
| B plain, Sarabun first with its own metrics, no override | the same strut face with Sarabun's own metrics (`ascent-override: 106.8%`, `descent-override: 23.2%`) | -2.5 / -2.0 / -2.0; -2.06 / -2.56 / -2.56 | 0.0 / +0.5 / +0.5; +0.44 / -0.06 / -0.06 | +1.5 / +2.0 / +2.0; +1.94 / +1.44 / +1.44 | The same reach as B at a 1 px shift (0.043 em). It still fails the whole-ink measure for Thai, and it fails English by the body measure at md and lg |
| C, the consonant-body target | none (A as it stands, judged by R2-1) | reported only | as A, all within 1.5 | as A, all within 1.5 | Nothing |

Body readings of the extra words on A (light, sm / md / lg): ตกลง 0 / +0.5 / +0.5, ยกเลิก 0 / +1.0 / +1.0, ยืนยันที่นี่ 0 / +1.0 / +1.0, ปุ่มสั่งซื้อ -1.0 / -0.5 / -0.5, Sign up +0.5 / +1.0 / +1.0. Their whole-ink readings on A run from +0.5 to -4.0, and on B from +4.0 to -1.0.

The earlier note in `tech.md` (a Sarabun `ascent-override` moved nothing) has its reason here. Chromium takes the primary font, whose metrics set the strut and the baseline, from the first face whose `unicode-range` covers U+0020. The Sarabun faces cover U+0E01 to U+0E5B and no space, so they are never primary in any family order. B needs a face that covers U+0020 to move Thai at all.

### What the builder does (no source change)

1. `src/testing/visual-asserts.ts`: give `measureInkCentre` and `expectInkCentred` a body measure (the stripped render of R2-1) and take the scale from `devicePixelRatio`. Report the whole-ink offset beside the body offset. Add node tests for the pure part (the strip set U+0E31, U+0E34 to U+0E3A, U+0E47 to U+0E4E).
2. `Button.stories.tsx`, Label Centre: judge the body with the 1.5 px bound.
3. `DESIGN.md` §4: add one rule line: "A single-line control centres the label's body: Thai marks above and below the consonant rise and fall outside it, as Latin accents and descenders do (ORV-111)." Add a change-log line saying no token, font or recipe changed.
4. `tech.md`: an After table with the body offsets of the 24 box and size pairs of `single-line-control-1`, measured the same way.

Rows 1 and 2 of the spec no longer read as written (the play is not red on the base, and no source change is made). The measure changes as open question 5 foresees. The spec moves to v1.1 before the build, which is the main session's call.

### Screenshots

All are in `/tmp/orv-111-design-1/`. The contact sheet is `contact-sheet.png`.

- `A-th.png`, `A-en.png`: the base (also C), Thai and English documents, light and dark, sm, md and lg, words and paragraph.
- `B-th.png`, `B-en.png`: B. In the Thai document every label drops; in the English one nothing changes.
- `Bplain-th.png`, `Bplain-en.png`: B plain.
- `A-th-guides.png`, `B-th-guides.png`, `Bplain-th-guides.png`, each with `-light.png` and `-dark.png` crops: a tick left of each control at its centre and a tick right of it at its body centre, drawn outside the control so they cover no glyph.

What the eye reads. In A the left and right ticks meet within a pixel at every size and in both modes. The consonants of every Thai label share one line with Save changes and Sign up, and the marks of บันทึกการเปลี่ยนแปลง rise above them, as Latin accents would. In B the right tick sits 2 to 4 px under the left one on ตกลง, ยกเลิก, Save changes and Sign up, and those labels look dropped, with more space above them than below. B plain splits the difference and pushes English 2 px low at md and lg.

### Screens to check in visual QA (G3)

- Base/Button Label Centre at 360 px and at the widest canvas, Thai and English documents, neutral light and dark: the body ticks of R2-1, if the qa run draws them, or the label sharing one line across a row.
- One member per box family from `single-line-control-1` with ปุ่มสั่งซื้อ at its smallest size (Tabs sm, Toggle Group sm, Input sm), to confirm that no ุ, ู or stacked mark is clipped (R2-4).
- A Thai paragraph in `text-body-md` before and after (spec open question 7): unchanged, since no source changes.
