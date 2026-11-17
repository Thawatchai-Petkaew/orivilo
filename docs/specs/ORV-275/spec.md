---
issue: ORV-275 (https://tpetkaew.atlassian.net/browse/ORV-275)
lane: L (risk flag: semantic token contract). During the POC, G1 and G2 pass under the owner's delegation (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
tech: docs/specs/ORV-275/tech.md (ds-architect, written in parallel)
version: 1.2
---

# ORV-275: Inter for Latin, Anuphan for Thai headings, Sarabun for Thai body, across the system

## Goal

The owner's words, a voice transcript of 2026-11-17, word for word as ORV-275 comment 10647 records them (the form answers were first posted as ORV-274 comment 10644):

> ช่วยปรับ before ใน Canva หน้านี้เป็นภาษาอังกฤษผมรู้สึกว่าอยากจะใช้ฟอนต์ภาษาอังกฤษเป็นอินเตอร์แฟมิลี่และใช้เฮดดิ้งของฟอนต์ภาษาไทยเป็นแบบอื่นหรืออาจจะเป็นฟอนต์ที่เคยใช้ก่อนหน้านี้ส่วนบอดี้ก็ใช้เหมือนเดิมตอนนี้มันดูเป็น ai slop มากๆ

The owner's answers on the form, word for word:

- Thai headings: "A: Anuphan (Recommended)"
- Scope: "ทั้งระบบ (Recommended)"

In English (a gloss, not the owner's words): make the "before" on this Canva page English; the English font should be the Inter family, Thai headings another face, perhaps one used before; the body stays as it is; right now it looks very much like AI slop. The first clause, the "before" of the Canva page in English, is ORV-274's work (Out of scope).

Today Latin letters and digits are IBM Plex Sans in every style, and Thai is looped Sarabun at every size, headings included (DESIGN.md section 4; owner, ORV-192 rows 15 and 16). After this story the families per style are those of `type-face-1`, set once in the design system's shared tokens, so every story and every page of `apps/web` follows with no per-page change.

This reverses the ORV-192 decision for the Thai heading face only. The other half of that decision holds: every profile carries the same families, and no profile picks a heading family of its own.

This story is not a guard on a tool call, so the guard frame of L-0012 does not apply.

What is real: real OFL font files, self-hosted, and a real token change. Nothing is AI and nothing is simulated. The clearances and centring that DESIGN.md section 4 records were measured with Sarabun and IBM Plex Sans; nobody has measured Inter and Anuphan in this system yet. `tech.md` records those measurements, and the plays of rows 7 and 8 are the proof.

## Rules and bounds

### type-face-1

The type styles are the 15 `type.*` tokens of `packages/design-system/src/tokens/source/semantic.json` (worked example 1). Each belongs to one group:

- Heading styles (4): `type.display.lg`, `type.display.md`, `type.heading.md`, `type.heading.sm`. Latin letters and digits in Inter, Thai in Anuphan.
- Body styles (10): `type.body.lg`, `type.body.md`, `type.body.sm`, `type.body.xs`, `type.label.md`, `type.label.sm`, `type.control.md`, `type.field.sm`, `type.numeral.lg`, `type.numeral.md`. Latin letters and digits in Inter, Thai in looped Sarabun. Numerals take the body face (DESIGN.md section 3.3) and hold digits only.
- Code style (1): `type.code.md`. Unchanged: IBM Plex Mono for Latin, Sarabun for Thai, as today (open question 1).

The semantic families follow their group: `font.display` the heading styles, `font.body` the body styles, `font.mono` the code style. Text with no type token of its own inherits `type.body.md` (DESIGN.md section 4), so it is body text.

The groups hold under every token set of `CONTRAST_SETS` (`packages/design-system/src/profiles/index.ts` line 49): neutral, Professional, Friendly and the ORIVILO brand profile, in light and in dark. No set names a different family. After this story no type style and no `font.*` family names IBM Plex Sans or IBM Plex Sans Thai.

Token names, the order of each stack, fallbacks, weights and metrics are `tech.md`'s.

### font-files-1

Fonts load from the design-system package, as today (`fonts.css`, imported by `apps/web/app/globals.css` line 6 and by `packages/design-system/.storybook/preview.tsx` line 5). No page and no story requests a font from another host at runtime. The package ships one OFL licence file per family it ships: Inter, Anuphan, Sarabun and IBM Plex Mono, four in all. No font file and no licence file of IBM Plex Sans stays. File names, subsets and weights are `tech.md`'s.

### type-clear-1

The four heading styles keep the line heights they have on `origin/develop` before this story: `type.display.lg` 1.2, `type.display.md` 1.25, `type.heading.md` 1.3, and `type.heading.sm` as today. This story changes the face, not the line height.

At those line heights, at each heading size of the contract (56, 32, 24 and 20 px), at 360 px and at 1440 px wide:

- No ink of a heading style is cut at the top or the bottom of its box, and none covers the caption above it, on one line and wrapped.
- Wrapped lines do not touch for `type.heading.sm`, the one heading style whose wrapped lines are asserted today (the `LongTitle` titles of Page header and Section header).
- For `type.display.lg`, `type.display.md` and `type.heading.md` the wrapped sample is shown for the designer's sign-off, with no assertion that its lines clear. `tech.md` records the gaps measured between their wrapped lines, Anuphan against Sarabun.

The samples carry the Thai stacks that rise highest (ฟื้, ปี๊), Thai marks below the line (กู้ภัย, ฎีกา) and Latin accents and descenders (Ågjpqy). Any padding that makes this hold is `tech.md`'s.

Why the three line heights stay (decision under the owner's POC delegation, ORV-275 comment 10647): the owner asked for a font change, not a new rhythm; the looser line weighed for this story, 1.45, reads loose in English display type; and the new faces are no regression at today's line heights: the worst wrapped gap, at `type.display.lg`, is -8.1 px with Anuphan against -22.1 px with Sarabun today (a negative gap is an overlap; `tech.md` holds the measurement).

## Acceptance criteria

The sets, groups and sizes that these rows name are the rules' above; the copy of row 10 is in "Copy (row 10)".

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook `Foundations/Typography` `Scale` under each token set of `type-face-1`, light and dark | The scale renders, one row per type style of `type-face-1` | In every sans row the Latin "Intent Engine" and the digits 0123 are Inter, never IBM Plex Sans; each row's caption names its style | The semantic families and `type.*` tokens change as `type-face-1` says; the generated token and profile CSS is rebuilt | `Scale` play: each of the 14 sans rows has a computed `font-family` that names Inter first and never "IBM Plex Sans"; `document.fonts.load("400 16px Inter", "A")` returns an Inter face; `profiles.test.ts`: under each set, every `type.*` token but `type.code.md`, and `font.display` and `font.body`, name Inter first and never IBM Plex Sans |
| 2 | `Scale`, the four heading rows; `Application/Page header` `Default` and `Application/Section header` `Default` (titles in `type.heading.sm`, DESIGN.md section 4), Thai | They render | Thai in each heading line is loopless Anuphan; the Thai in the body text beside or under it stays looped Sarabun | Heading group of `type-face-1` | The plays: each heading row and each title has a computed stack with Inter before Anuphan and no other Thai face before Anuphan; `document.fonts.load("500 56px Anuphan", "ก")` and `document.fonts.load("500 20px Anuphan", "ก")` return an Anuphan face; `profiles.test.ts` under each set; the designer's sign-off sheet shows loopless Thai in the heading rows |
| 3 | `Scale`, the ten body rows; `Application/Card` `Default`, the paragraph with no type token of its own | They render | Thai is looped Sarabun and Latin is Inter in every body row and in the untyped paragraph | Body group of `type-face-1` | The plays: each row and the paragraph have a computed stack with Inter before Sarabun and no Anuphan; `document.fonts.load("400 16px Sarabun", "ก")` returns a Sarabun face; `profiles.test.ts` under each set |
| 4 | `Scale`, the code row | It renders | The code sample in the same family as before this story | None: `type.code.md` and `font.mono` resolve under each set to `["IBM Plex Mono", "Sarabun", "ui-monospace", "monospace"]`, as `primitives.json` line 606 holds today; no IBM Plex Mono file changes | `Scale` play: the code row's computed stack matches `/^"IBM Plex Mono", Sarabun,/`; `profiles.test.ts` asserts that value under each set; `git diff --stat origin/develop -- packages/design-system/src/tokens/fonts/plex-mono-400-latin.woff2 packages/design-system/src/tokens/fonts/plex-mono-500-latin.woff2 packages/design-system/src/tokens/fonts/LICENSE-ibm-plex-mono.txt` prints nothing |
| 5 | The PR head; `Scale`; a page of `apps/web` that `apps/web/e2e` already opens | The story and the page load | Nothing new | `font-files-1` | `grep -rn -e fonts.googleapis.com -e fonts.gstatic.com -e rsms.me -e fonts.bunny.net packages/design-system/src apps/web --exclude-dir=node_modules` prints nothing; the `Scale` play: every `performance.getEntriesByType("resource")` entry whose name ends in `.woff2` starts with `location.origin`; an `apps/web/e2e` check: every request of resource type `font` while the page loads has the page's origin, and at least one is an Inter file |
| 6 | The PR head | The font directory that `fonts.css` reads is listed | Nothing | `font-files-1` | The directory holds four licence files, one each naming Inter, Anuphan, Sarabun and IBM Plex Mono, and each carries the SIL Open Font License 1.1 text; no file name holds `plex-sans`; every font file in it is the `src` of an `@font-face` rule in `fonts.css`, except the two IBM Plex Mono files, which stay as today (open question 1); `grep -rn "IBM Plex Sans" packages/design-system/src/tokens packages/design-system/src/profiles/source` prints nothing |
| 7 | `Scale` at 360 and 1440 px, Thai and English, light and dark, under each set of `type-face-1`, with a wrapped sample per heading style; `Application/Page header` `LongTitle` and `Application/Section header` `LongTitle` | They render | The heading rows, their wrapped samples and the two long titles as `type-clear-1` says | None to a line height: `type-clear-1`; any padding as `tech.md` sets | The `Scale` play, for each of the four heading rows: `expectNoGlyphClip` on the heading row's clipping wrapper and `expectInkClearsAbove(row, caption, 4)`; `expectLinesClear(sample)` on the `type.heading.sm` wrapped sample only; the two `LongTitle` plays pass with their `expectLinesClear` as today; `profiles.test.ts` under each set: the four heading styles resolve to the line heights `type-clear-1` keeps; the designer's sign-off sheet at 360 and 1440 shows all four wrapped samples |
| 8 | Every story whose play calls `expectInkCentred` or `expectLabelInkWhole`, selected by `grep -rln -e expectInkCentred -e expectLabelInkWhole packages/design-system/src --include=*.stories.tsx` | The plays run | Each control label, Thai and Latin, centred in its control and whole; text contrast as before | None beyond `type-face-1`; no line height changes (`type-clear-1`) | Each selected play passes; `pnpm contrast` passes; `src/tokens/contrast-pairs.test.ts` and `src/recipes/recipes.test.ts` pass |
| 9 | The PR head | The documents are read | Nothing | DESIGN.md section 4, the typography section 6 of `docs/context/brand/orivilo-brand-spec-v1.1.md` and the catalog's type foundation name the families of `type-face-1`; DESIGN.md gets a version bump and a change log line, the brand spec a new "Changes in" section | In DESIGN.md section 4 the Display row names Inter and Anuphan, the Body/UI row Inter and Sarabun, the Mono row is as today, no row names IBM Plex Sans, and no bullet says Thai is Sarabun in headings; brand spec section 6 names Inter, Anuphan, Sarabun and IBM Plex Mono and no IBM Plex Sans or IBM Plex Sans Thai row; `grep -rn -e Inter -e Anuphan packages/design-system/catalog` prints the foundation line that `tech.md` places |
| 10 | Storybook `Foundations/Typography` | It renders | The intro in English and Thai, then a block of three families in the order Inter, Anuphan, Sarabun, each with its English and Thai caption and a sample in its family (copy below), then the scale of row 1 | Story copy in `packages/design-system/src/foundations/typography.stories.tsx` | A play finds each caption by its text in both languages and reads each sample's computed stack: the Inter sample names Inter first, the Anuphan sample has Anuphan as its Thai face, the Sarabun sample has Sarabun as its Thai face; the copy check passes (no middot, no em dash) |
| 11 | The `apps/web` page of row 5, light and dark | It renders | Its title in the heading families and its text in the body families of `type-face-1`, with no change to any `apps/web` file but the e2e check | None in `apps/web`: `globals.css` declares nothing visual | The `apps/web/e2e` check reads the computed stack of an element with a `text-display-*` or `text-heading-*` class (Inter before Anuphan) and of a paragraph (Inter before Sarabun); `git diff --stat origin/develop -- apps/web` lists only files under `apps/web/e2e` |
| 12 | The PR | The gate runs and the designer reads the changed stories | Nothing | The designer's sign-off PNG paths posted as a Jira comment on ORV-275 | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` and `pnpm contrast` pass, real output in the PR; CI green; the G3 gate record on the head |

### Copy (row 10)

<!-- prettier-ignore -->
| Where | English | Thai |
| --- | --- | --- |
| Intro | Thai and Latin on the same line at each step of the scale. Latin letters and digits are Inter in every style. Thai headings are Anuphan, and Thai body text is looped Sarabun, in every profile. Code is IBM Plex Mono, with Sarabun for Thai. Fonts are self-hosted from this package. No letter-spacing and no text-transform on Thai. | ภาษาไทยและละตินบนบรรทัดเดียวกันในทุกขั้นของสเกล ตัวอักษรละตินและตัวเลขใช้ Inter ในทุกสไตล์ หัวข้อภาษาไทยใช้ Anuphan และเนื้อความภาษาไทยใช้ Sarabun แบบมีหัว ในทุกโปรไฟล์ โค้ดใช้ IBM Plex Mono และใช้ Sarabun กับภาษาไทย ฟอนต์โหลดจากแพ็กเกจนี้เอง ภาษาไทยไม่เว้นระยะตัวอักษรและไม่แปลงรูปตัวอักษร |
| Inter caption | Inter: Latin letters and digits in every style | Inter: ตัวอักษรละตินและตัวเลขในทุกสไตล์ |
| Inter sample | Brand evidence report 0123 | (the same sample: Inter carries no Thai) |
| Anuphan caption | Anuphan: Thai in headings | Anuphan: ภาษาไทยในหัวข้อ |
| Anuphan sample | ฟื้นฟูแบรนด์ด้วยระบบตั้งใจ | (the same sample) |
| Sarabun caption | Sarabun: Thai in body text | Sarabun: ภาษาไทยในเนื้อความ |
| Sarabun sample | ผลิตภัณฑ์ที่มีชีวิตเริ่มจากความตั้งใจของธุรกิจ | (the same sample) |

## Rows per PR

- PR 210: rows 1-12

The number is the next PR number expected on 2026-11-17 (the last merged is 209). The main session corrects it once the PR is open; until then a qa walk of another number finds no line for its PR and walks every row, which for this one-PR story is the same set.

## Rows that render nothing

- Rows: 5, 6, 9, 12

Row 5 is a source search and a network check, row 6 a file listing, row 9 a document read and row 12 the gate.

## Out of scope

- The ORV-274 concept canvas page and its default language.
- The intent engine's font analysis and font suggestions (`packages/intent-engine/src/suggest.ts`, the URL analyser): they measure and suggest fonts for a customer's brand, not ORIVILO's own type.
- Fixture copy that names a font as mock content (the decision log example, the canvas board and chat fixtures).
- Any change to the code family or to how it loads (open question 1).
- New sizes, new weights or a new type style beyond what `tech.md` needs for `type-clear-1` and row 8.
- Letter-spacing: none on Thai, as today; the numerals' tight Latin tracking is as today.
- Rewriting ORV-192's spec. Its rows 15 and 16 stay as the history of that decision; this spec supersedes them for the Thai heading face.
- Production. A git tag, the owner's, deploys it.

## Defaults taken

The two open questions of v1.0 are closed: their defaults are taken, ORV-275 comment 10647. Their numbers stay, so "open question 1" elsewhere in this spec points to item 1 here.

1. **The code family.** Taken: IBM Plex Mono stays, with Sarabun for Thai, as today. The package ships `plex-mono-400-latin.woff2` and `plex-mono-500-latin.woff2`, but no `@font-face` rule in `fonts.css` loads them, so code renders in the system's monospace today. This story leaves that as it is; loading them is a possible follow-up, not part of this story.
2. **`type.heading.sm` at 20 px.** The brand spec section 6 says "Looped below 24 px, loopless above". Taken: all four heading styles take Anuphan, `type.heading.sm` at 20 px included, because the owner's answer names headings with no size bound. Impact: the Page header and Section header titles, which carry `type.heading.sm`, are Anuphan.

## Depends on

- ORV-274 comment 10644: the owner's decision.
- ORV-275 comment 10647: the owner's words word for word, the line-height decision of `type-clear-1` and the defaults taken.
- ORV-192 rows 15 and 16 (Thai headings in Sarabun, superseded here for the Thai heading face), row 7 (weights as true faces), row 18 (running text at 1.7) and row 19 (display type pads its own top, proved again through `type-clear-1`).
- ORV-58 (looped Sarabun for Thai body text), ORV-111 `ink-centre-1`, ORV-194 rows 6, 6b and 7, ORV-199 and ORV-269 (`expectLabelInkWhole`): the checks of row 8.
- `docs/specs/ORV-275/tech.md`: token names, stacks, weights, files and metrics.
- DESIGN.md section 4, the brand spec section 6, `.claude/rules/design-system.md`, `.claude/rules/testing.md`.
- ADR 0003 (Storybook and catalog), ADR 0012 (gates), ADR 0013 (the qa approve on a code PR).

## Worked examples

1. The type styles of `type-face-1`, read from the token source. Run from the repo root. Expected output, exact, one line: `display.lg display.md heading.md heading.sm body.lg body.md body.sm body.xs label.md label.sm control.md field.sm code.md numeral.lg numeral.md 15`. Not run: this role has no shell.

   ```bash
   node -e 'const t=require("./packages/design-system/src/tokens/source/semantic.json").type;const s=Object.entries(t).flatMap(([g,v])=>Object.keys(v).map(k=>g+"."+k));console.log(s.join(" "),s.length)'
   ```

## Changelog

- v1.0 (2026-11-17): first version. Task `ORV-275-spec-1`. Downstream to review: `docs/specs/ORV-275/tech.md` (it names the tokens, stacks and files these rows check), the builder envelope (rows 1-12, one PR), the designer's sign-off (rows 2, 7 and 10), the qa envelope (the Rows per PR number once the PR is open), DESIGN.md section 4, the brand spec section 6 and the catalog's type foundation.
- v1.1 (2026-11-17): `type-clear-1` keeps the line heights of the four heading styles as today and asks wrapped-line clearance for `type.heading.sm` only, the one style where it is asserted today; row 7 and row 8 follow; the Goal quotes the owner's words word for word (ORV-275 comment 10647); the two open questions become "Defaults taken". Task `ORV-275-spec-2`. Downstream to review: `docs/specs/ORV-275/tech.md` (line heights, the `Scale` assertions, the measured gaps, and every line that sets 1.45: the line-height table, "Choosing 1.45", the impact rows, build order steps 3, 4, 5, 7 and 10, the catalog and story comment lines), the builder envelope (rows 7 and 8), the designer's sign-off (row 7: all four wrapped samples), DESIGN.md section 4 (no new line heights), and the qa envelope (row 7's check).
- v1.2 (2026-11-17): row 7's check names `expectNoGlyphClip` on the heading row's clipping wrapper, as `tech.md` build step 6 places it; Depends on lists ORV-275 comment 10647. Wording only, no requirement changes. Task `ORV-275-spec-3`. Downstream to review: the builder envelope and the qa envelope (row 7's check).
