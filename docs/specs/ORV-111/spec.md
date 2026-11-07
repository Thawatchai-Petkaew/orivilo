---
issue: ORV-111 (https://tpetkaew.atlassian.net/browse/ORV-111)
lane: S (since v1.1; v1.0 was L. Under target C row 2 changes no token, font, recipe or component, see fix-once-1, so no risk flag of the AGENTS.md lanes table holds; see section Lane)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-111: Thai labels sit above the vertical centre of single-line controls

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | What the user sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The PR's base commit. Button `variant="primary"` at sm, md and lg, once with `fixtures.thai` ("บันทึกการเปลี่ยนแปลง") and once with `fixtures.latin` ("Save changes"), under the neutral profile in light and in dark | The row 4 play runs on that base, with the head's story and helper | Nothing changes on screen; this row measures the base | `docs/specs/ORV-111/tech.md` gets a Before table: the base sha, then one line per size, label and mode with the control height, the body offset and the whole-ink offset, as `ink-centre-1` defines them. The sentence under it that names the cause stays | The play is green on the base. The table's numbers come from `measureInkCentre` in a scratch story with the same meta and markup, deleted before the commit, as the Before section of `tech.md` reads them today; the heights read 32, 40 and 48 px (`--cmp-button-height-sm`, `-md` and `-lg`, `generated.css` lines 604 to 606) |
| 2 | The Before table of row 1 | The builder does row 2 | The labels stay where the base sets them: in "บันทึกการเปลี่ยนแปลง" the consonants share one line with "Save changes" and the marks rise above them. No control gets its own nudge | No source change, as `fix-once-1` states. DESIGN.md §4 gains one rule line: "A single-line control centres the label's body: Thai marks above and below the consonant rise and fall outside it, as Latin accents and descenders do (ORV-111)." DESIGN.md gains a change-log line saying no token, font or recipe changed | `git diff --name-only <base>...HEAD` passes the path check of worked example 3; the reviewer reads the diff against `fix-once-1`; `grep -n "centres the label's body" DESIGN.md` finds the rule line in §4 |
| 3 | Row 2 | The `ink-centre-1` measure runs on each box of each member of `single-line-control-1`, at each of its sizes, with both labels, in light and in dark | Each member shows "บันทึกการเปลี่ยนแปลง" and "Save changes" centred as `ink-centre-1` judges, in light and in dark; a member that is not names its follow-up issue | `tech.md` gets an After table: the head sha and the command, then one line per box and size with the body offset and the whole-ink offset for each of Thai light, Thai dark, English light and English dark (for English the two are one reading, since the body removes nothing from a Latin label) | The After table has the 24 box and size pairs of worked example 2; each body offset passes `ink-centre-1` or its line names a follow-up Jira key (open question 3); qa screenshots each member's story |
| 4 | Rows 1 and 2 | The Storybook test project runs `Button.stories.tsx`, locally and in CI | Storybook Base/Button, story Label Centre: primary buttons at sm, md and lg reading "บันทึกการเปลี่ยนแปลง" and "Save changes", under neutral light and dark. Its play passes, with one `ink-centre-1` assertion per size, label and mode, on the body | `Button.stories.tsx`, story `LabelCentre`, judges the body: `expectInkCentred(cell, buttons, { measure: "body" })`. `src/testing/visual-asserts.ts`: `measureInkCentre` returns the body offset and the whole-ink offset of each box, takes the scale as `ink-centre-1` clause 2 states, and the failure message of `expectInkCentred` lists each failing box with both offsets. Its pure part, the strip set of the body included, has node tests in `visual-asserts.test.ts` | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/button/Button.stories.tsx` passes on the head and on the base with the head's story and helper (row 1); `pnpm --filter @orivilo/design-system exec vitest run --project checks src/testing/visual-asserts.test.ts` passes; the play takes one screenshot per boundary per pass (one pass for the body, one for the whole ink), not one per button |

## Why

Jira ORV-111 reports that Thai button labels render above the vertical centre of the control. The Studio shows Thai and English together (AGENTS.md line 52), and DESIGN.md holds Thai and Latin on the same line to the same tests (§2 line 20) and says Thai must not look smaller or lighter than the Latin beside it (§4 line 140). A Thai label that rides high makes the control look unfinished beside its English twin.

User story: as a Studio user who reads Thai, I want the label of a button, field, menu item, tab, tag or toggle to sit at the vertical centre of its control, so that a Thai control looks as settled as an English one.

Thai letters in body and UI text come from Sarabun and Latin ones from IBM Plex Sans (`packages/design-system/src/tokens/fonts.css` lines 38 to 86; DESIGN.md §4 line 138), so Thai text is set with the metrics of a different face than Latin text. ORV-65 found one lift in ToggleGroup and removed it inside that recipe (`recipes.css` lines 2142 to 2145; DESIGN.md change log v1.29).

The owner chose target C in ORV-111 comment 10412: keep the current label position, and judge the label's body (design.md section "Row 2 target"). Measured by its whole ink, the Thai label sits high (`tech.md`, Before: 3.0 to 3.6 px above the centre); measured by its body, the base is already centred (design.md, candidate A). The gap is the stacked vowel and tone marks, which Thai sets above its consonants by design, as Latin sets accents above its capitals. A font or token change moves every label by the same amount, while the whole-ink offset depends on the string, so no such change can centre the whole ink of every label (design.md, "Why not move the baseline (B)", point 1). This issue settles the target once for every control, and moves no label.

Nothing here is simulated. The offsets come from screenshots in Chromium, the one browser of the Storybook test project (`packages/design-system/vite.config.ts` lines 27 to 34). The pixel read runs only under Vitest browser mode (`inVitest`, `src/testing/visual-asserts.ts` line 143), so the static Storybook shows the story without the check. The re-check of row 3 is a real run that stays out of the commit (open question 2). No font, token or recipe changes: the play judges what the base renders.

## Scope

- Row 1 measures Button labels at each size on the base, with the row 4 play: the body and the whole-ink offset.
- Row 2 makes no source change, as `fix-once-1` states, and adds one DESIGN.md §4 rule line.
- Row 3 re-checks the members of `single-line-control-1`.
- Row 4 judges the body in the Storybook play on Button, through the shared helper in `src/testing/visual-asserts.ts`, as `.claude/rules/testing.md` line 30 asks of a visual criterion.

No UI string is added: the labels are `fixtures.thai` and `fixtures.latin` (`src/components/fixtures.ts` lines 10 and 11), so the locale catalog does not change (AGENTS.md line 52). Both are the button copy of DESIGN.md §10 (line 240), and "บันทึกการเปลี่ยนแปลง" stacks a vowel and a tone mark on one letter (ลี่ in เปลี่ยน), the kind of Thai sample testing.md line 30 asks for.

## Lane

S since v1.1. v1.0 was L because the fix was expected at the token or font level, the semantic token contract risk flag of the AGENTS.md lanes table (line 37). Under target C, `fix-once-1` refuses every token, font, recipe, profile and component file, so the PR changes a test helper and its tests, one story file, DESIGN.md §4 and the docs of this issue. None of these is a risk flag of the lanes table: the helper lives in `src/testing/` and is no component public API, and the DESIGN.md rule line describes how the base already renders without changing a token. In lane S the owner decides G5 and Claude passes G3 with evidence (AGENTS.md iron rule 5). The main session records the lane in Jira.

## Rules

### ink-centre-1

Target (design.md section "Row 2 target", chosen in ORV-111 comment 10412): in a single-line control, the label's body (the ink of the label with its Thai marks above and below the consonant removed; a Latin label as it is) is centred on the control: `ink-centre-1` run on that body reads at most 1.5 CSS px either way at sm, md and lg, in light and in dark, at device scale factor 1, and the marks above the body rise freely, so the whole-ink offset of a Thai label is reported, not judged.

Each control box (`.ds-button` in rows 1 and 4, or the box the member table of `single-line-control-1` names) gets two readings, each by clauses 1 to 8:

- Body: the label with U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E removed. The helper renders each Thai label without its marks, measures it, and puts the label back. A Latin label is measured as it is (worked example 4).
- Whole ink: the label as it is.

1. Fonts first: the play waits for the label's faces (`document.fonts.load` with the label's computed font and its text, then `document.fonts.ready`), never for a fixed time.
2. A screenshot of an element that holds the box, taken and decoded the way `expectEdgeInk` does it (`visual-asserts.ts` lines 124 to 137, `shoot` and `screenshotOf`: `page.screenshot` under the shared `orivilo-screenshot` lock). The scale is `devicePixelRatio`, not the screenshot width over the CSS width (design.md R2-1).
3. Region: the columns of the label text (the client rects of a Range over it; for an `<input>`, its content box) and the rows of the box's padding box.
4. Ground: the most frequent colour in the region.
5. Ink: a pixel whose distance from the ground, summed over R, G and B, is more than `INK_DISTANCE` (48, `visual-asserts.ts` line 16).
6. Ink band: from the first region row that holds ink to the last such row, plus one row. Ink centre: the middle of the band, in CSS px.
7. Control centre: the top of the box's border box plus half its height.
8. Offset: ink centre minus control centre, in CSS px, reported to 2 decimals; a negative offset is above the centre.
9. Pass: the body offset reads at most 1.5 CSS px either way. The bound is the 1 px target plus the half device pixel that text snaps to at device scale factor 1 while the box may sit at a fractional y (the dark cell of the story sits at y + 0.44 and reads up to 0.56 px apart from light for the same markup) (worked example 5). The whole-ink offset is reported beside the body offset, in the failure message and in `tech.md`, and not judged.

### single-line-control-1

A catalog entry is a member when all three hold:

1. Its file sits in `packages/design-system/catalog/base/`, the tier that holds controls (catalog README line 9).
2. Its `status` is `draft` or `stable`.
3. Its own component renders a box that the user presses, types in or chooses from, that shows one line of text, and whose `min-height` the recipe takes from a component height token that resolves to `size.control.*`, directly or through a `calc()`. A component that a caller passes into a slot counts under its own entry: a Button in an InputGroup slot is measured as a Button.

The catalog has three tiers (README lines 7 to 11). On `develop` at `eeb2e71` the base tier holds 23 entries and the application tier 23 (`packages/design-system/catalog/application/*.yaml`); the marketing tier has none (there is no `catalog/marketing/` directory). Clause 1 keeps the application tier out (open question 6). Of the 23 base entries, 11 are members, with 24 box and size pairs (worked example 2). Members in file-name order, with the box measured:

<!-- prettier-ignore -->
| Entry | Box measured | Sizes |
| --- | --- | --- |
| button | `.ds-button`, primary | sm, md, lg |
| context-menu | `.ds-menu__item` | one size |
| dropdown-menu | `.ds-menu__item` | one size |
| input-group | `.ds-input-group`, its input's value | sm, md, lg |
| input | `.ds-control`, its value | sm, md, lg |
| password-input | `.ds-input-group`, its value with reveal on | sm, md, lg |
| select | `.ds-control[data-trigger]`, the chosen value | sm, md, lg |
| select | `.ds-menu__option`, an option with no description | one size |
| tabs | `.ds-tabs__trigger`, not selected and with no count | sm, md |
| tag | `.ds-tag`, not selected | md (its sm height reads `size.icon.lg`) |
| toast | `.ds-toast__action` | one size |
| toggle-group | `.ds-toggle__item`, not pressed | sm, md |

Not members: badge (its height reads `size.icon.*`); checkbox (its box reads `size.icon.*`, and its label sits beside the box and may wrap); field (it wraps a control that is measured under its own entry); kbd, popover and tooltip (no height token); textarea (several lines); progress, range-slider and slider (no text in the control); resizable and scroll-area (no text box).

### fix-once-1

No control gets its own nudge, and row 2 changes no source (target C, ORV-111 comment 10412). The PR changes no file that the path check of worked example 3 refuses, which is any file of these five kinds:

1. a file under `packages/design-system/src/tokens/` (`fonts.css`, `generated.css`, `source/*.json`, the font files in `fonts/`);
2. a file under `packages/design-system/src/profiles/` (`source/*.json`, `generated.css`);
3. a file under `packages/design-system/src/recipes/`;
4. a component's own `.tsx` in `packages/design-system/src/components/<name>/` (its stories are allowed);
5. a file under `apps/`.

The files row 2 and row 4 change are `src/testing/visual-asserts.ts`, `src/testing/visual-asserts.test.ts`, `src/components/button/Button.stories.tsx`, `DESIGN.md` and the docs in `docs/specs/ORV-111/`. A change that moves the baseline (candidate B of design.md) is out of scope.

## Worked examples

None is run here (no shell in this role). Each runs from the repo root with `node -e` and prints one line.

1. `ink-centre-1` on one pixel column of a md primary button in light mode, scale 1 (device scale factor 1). Copied inputs: the ground `action.primary` #7A22C7 and the ink `text.on-action` #FFFFFF (DESIGN.md lines 64 and 50), the height 40 px (`--op-size-10`, `generated.css` line 131), the 1 px border (`recipes.css` line 22), so the padding box has 40 less 2 rows, and `INK_DISTANCE` 48 (`visual-asserts.ts` line 16). The ink rows are stand-ins for a screenshot: the first column has a faint pixel just above its ink (under the threshold) and a mid-tone pixel just below it (over the threshold); the second column has them the other way round. Offsets to 2 decimals with `toFixed(2)`, then the pass test of clause 9 on the unrounded offset, with the bound inclusive. Expected output: `-1.50 0.50 true true`.

   ```bash
   node -e 'const G=[122,34,199],W=[255,255,255],M=[189,145,227],F=[130,45,202],D=48,B=1.5;const d=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);const col=p=>Array.from({length:40-2},(_,i)=>p[i+1]??G);const ground=c=>{const n=new Map();for(const p of c)n.set(p.join(),(n.get(p.join())??0)+1);return [...n].sort((x,y)=>y[1]-x[1])[0][0].split(",").map(Number)};const off=(c,top=0,h=40,s=1,bw=1)=>{const g=ground(c);const r=c.map((p,i)=>d(p,g)>D?i:-1).filter(i=>i>=0);const a=r[0],b=r.at(-1)+1;return top+bw+(a+b)/2/s-(top+h/2)};const th={10:F,25:M},en={13:M,28:F};for(let y=11;y<=24;y++)th[y]=W;for(let y=14;y<=27;y++)en[y]=W;const o=[off(col(th)),off(col(en))];console.log(o.map(x=>x.toFixed(2)).join(" "),o.map(x=>Math.abs(x)<=B).join(" "))'
   ```

2. `single-line-control-1` on the 23 entries of `catalog/base/`, in file-name order, each with the height tokens its own boxes read (`recipes.css` and `generated.css`; toggle-group reads `button.height.*` through a `calc()`) and whether its measured box shows one line of text; select lists its trigger sizes, then its option. Counts, no rounding. Expected output: `23 11 24 button,context-menu,dropdown-menu,input-group,input,password-input,select,tabs,tag,toast,toggle-group`.

   ```bash
   node -e 'const c=["size.control.sm","size.control.md","size.control.lg"];const E=[["badge",["size.icon.md","size.icon.lg"],true],["button",c,true],["checkbox",["size.icon.sm","size.icon.md"],false],["context-menu",[c[1]],true],["dropdown-menu",[c[1]],true],["field",[],false],["input-group",c,true],["input",c,true],["kbd",[],true],["password-input",c,true],["popover",[],false],["progress",["space.inline.sm","space.inline.md"],false],["range-slider",[],false],["resizable",[],false],["scroll-area",[],false],["select",[...c,c[1]],true],["slider",[],false],["tabs",[c[0],c[1]],true],["tag",["size.icon.lg",c[0]],true],["textarea",c,false],["toast",[c[0]],true],["toggle-group",[c[0],c[1]],true],["tooltip",[],false]];const m=E.filter(([,,one])=>one).map(([n,h])=>[n,h.filter(t=>t.startsWith("size.control.")).length]).filter(([,k])=>k>0);console.log(E.length,m.length,m.reduce((a,[,k])=>a+k,0),m.map(([n])=>n).join(","))'
   ```

3. `fix-once-1` path check on eight file lists: the expected change (the helper and its tests, the story file, DESIGN.md, `spec.md` and `tech.md`), then that list plus `fonts.css`, plus `semantic.json`, plus `recipes.css`, plus `Button.tsx`, plus `friendly.json`, plus `apps/web/app/globals.css`, and plus a Sarabun font file. Booleans, no rounding. Expected output: `true false false false false false false false`.

   ```bash
   node -e 'const P="packages/design-system/src/";const bad=f=>f.startsWith(P+"tokens/")||f.startsWith(P+"profiles/")||f.startsWith(P+"recipes/")||f.startsWith("apps/")||(/^packages\/design-system\/src\/components\/[^/]+\/[^/]+\.tsx$/.test(f)&&!f.endsWith(".stories.tsx"));const A=[P+"testing/visual-asserts.ts",P+"testing/visual-asserts.test.ts",P+"components/button/Button.stories.tsx","DESIGN.md","docs/specs/ORV-111/spec.md","docs/specs/ORV-111/tech.md"];const ok=l=>!l.some(bad);console.log([A,[...A,P+"tokens/fonts.css"],[...A,P+"tokens/source/semantic.json"],[...A,P+"recipes/recipes.css"],[...A,P+"components/button/Button.tsx"],[...A,P+"profiles/source/friendly.json"],[...A,"apps/web/app/globals.css"],[...A,P+"tokens/fonts/sarabun-400-thai.woff2"]].map(l=>ok(l)).join(" "))'
   ```

4. `ink-centre-1` body: the strip set of the body on `fixtures.thai` and `fixtures.latin` (`src/components/fixtures.ts` lines 10 and 11). Strings, no rounding. Expected output: `บนทกการเปลยนแปลง|Save changes` (ั ึ ี ่ removed, as the stripped label of `tech.md` reads; the Latin label as it is).

   ```bash
   node -e 'const body=t=>t.replace(/[ัิ-ฺ็-๎]/g,"");console.log(body("บันทึกการเปลี่ยนแปลง")+"|"+body("Save changes"))'
   ```

5. `ink-centre-1` clause 9 bound and pass test on the body readings of design.md, table "Candidates rendered": candidate A (Thai body sm, md, lg in light then dark, then English the same way) and candidate B (the same order). The bound is the 1 px target plus half a device px at device scale factor 1. Readings as design.md reports them, no further rounding. Expected output: `1.5 true false 0` (the base passes, B fails, and no B reading passes, as design.md R2-3 asks).

   ```bash
   node -e 'const bound=1+0.5/1;const A=[-1.0,-0.5,-0.5,-0.56,-1.06,-1.06,0.5,1.0,1.0,0.94,0.44,0.44];const B=[2.0,2.5,2.5,2.44,1.94,1.94,3.5,4.0,4.0,3.94,3.44,3.44];const ok=r=>r.every(x=>Math.abs(x)<=bound);console.log(bound,ok(A),ok(B),B.filter(x=>Math.abs(x)<=bound).length)'
   ```

## Out of scope

- A label that mixes Thai and Latin in one line (`fixtures.mixed`).
- Text on more than one line: textarea, a select option with a description, a checkbox label.
- Boxes in the application tier (open question 6).
- Horizontal centring.
- Browsers other than Chromium, and a page-by-page check of `apps/web`.
- Device scale factors other than 1.
- Visual regression baselines (advisory, `.claude/rules/testing.md` line 15).
- Moving the label: a font, token or recipe change, such as candidate B of design.md.

## Open questions (with defaults)

1. Profiles. Option: run the play and the re-check under Professional and Friendly too. Impact: each box is measured under each profile, which adds CI time (`.claude/rules/testing.md` line 18). Default: neutral only. Neither `professional.json` nor `friendly.json` (`src/profiles/source/`) overrides `font.body`, `type.label.*` or `type.body.*`: Friendly overrides `type.heading.md` and `type.heading.sm` (lines 402 to 422) and Professional `type.display` (line 347). Friendly's taller controls (`size.control.md` and `lg`, lines 424 to 432) change the height, not the type.
2. Committed re-check. Option: land row 3 as a committed play per member. Impact: a play in the story file of each member entry (worked example 2), with their CI time and their lines in this PR. Default: no. The re-check is a scratch run with the same helper; `tech.md` records its command, sha and output, and qa screenshots each member's story.
3. A member outside `ink-centre-1` after row 2. Option: fix it in this PR. Impact: a per-component change, which `fix-once-1` rules out. Default: one follow-up Jira issue per cause, with its key on the member's line of the After table and in the PR body.
4. Resolved in v1.1 (ORV-111 comment 10412). The question was what to do when no change that `fix-once-1` allowed brought the offsets of row 4 inside `ink-centre-1`. The owner chose target C: no change is made, and the measure judges the body, which the base already meets (design.md, candidate A).
5. Resolved in v1.1 (ORV-111 comment 10412). The measure and the eye disagreed: the whole ink put Thai labels 3 px high while their consonants share one line with the Latin label (design.md, "What the eye reads"). The measure is now the body of `ink-centre-1`, and the whole ink is reported beside it. When the play passes but a label still looks off to the designer, the measure stays, with the designer's G3 screenshot as the visual check.
6. Application tier. Option: re-check the application-tier boxes that read the same height tokens too: `.ds-command__option` (command-menu, `recipes.css` line 2414), `.ds-chat__option`, `.ds-chat__header` and `.ds-chat__meta` (canvas-chat, lines 4292, 3954 and 4077), `.ds-controls__zoom` (canvas-controls, line 2259), `.ds-sheet__row` (shortcut-sheet, line 2492) and `.ds-taskbar__header` (task-bar, line 3704). Impact: more boxes in the scratch run and in the After table. Default: no; `single-line-control-1` keeps to the base tier, and no source changes, so these boxes render as on the base.
7. Closed in v1.1. The question was whether to accept a fix that changes the height of two lines of Thai text. Row 2 changes no source, so no line height changes (design.md, table "Candidates rendered": two lines are 54.4 px on the base) and `fix-once-1` no longer asks for the two-line heights.

## Decisions it depends on

- ORV-111 comment 10412: the owner chose target C, keep the current label position.
- `docs/specs/ORV-111/design.md` section "Row 2 target": the target sentence, rows R2-1 to R2-4 and the readings of candidates A, B, B plain and C.
- AGENTS.md: the lanes table (line 37), iron rules 2 and 5, and the design-system rules on lines 50, 52 and 55 (recipes use semantic tokens, the locale catalog, a profile changes visual expression only).
- DESIGN.md §4 (Sarabun for Thai below 24 px, ORV-58; a mixed line takes the body line-height), §5 (the layers), §11 (the design gate, which blocks G3), and change log v1.29 (ORV-65).
- `docs/adr/0003-shadcn-behavior-own-visual-layer.md`: tokens and recipes are our own visual layer.
- `docs/adr/0012-jira-states-by-environment.md`: gate ownership by lane.
- `.claude/rules/testing.md` line 30 (visual plays through the shared helpers, L-0018 from ORV-108) and line 18 (time limits sized for the CI runner).
- `.claude/skills/ovl/SKILL.md`, section "POC mode" (ORV-137).

## Changelog

- v1.0: first version, written before the build from Jira ORV-111 as the envelope of task ORV-111-spec-1 quotes it (the Jira tool was not available to this role). Downstream to review at build: `.claude/rules/testing.md` line 30 (its list of shared helpers gains one), DESIGN.md §4 and its change log (the fix and the impact list), and the G1 and G2 packets.
- v1.1: the owner chose target C in ORV-111 comment 10412, as `docs/specs/ORV-111/design.md` section "Row 2 target" states it. `ink-centre-1` judges the label's body with a new bound (clause 9), takes the scale as clause 2 now states it and reports the whole-ink offset; `fix-once-1` now refuses every source change (Branches A and B and the two-line heights removed); rows 1 to 4 follow (the play is green on the base and on the head, the Before and After tables carry body and whole-ink offsets, row 2 adds one DESIGN.md §4 rule line); open questions 4 and 5 resolved, 7 closed, 6 reworded; worked examples 1 and 3 updated, 4 and 5 added; the lane drops from L to S; the line references to `visual-asserts.ts` (`INK_DISTANCE`, `inVitest`, the screenshot code) corrected to the head. Downstream to review: `docs/specs/ORV-111/tech.md` (front matter `spec` v1.0; "The play is red on the base"; the Before table gains body and whole-ink columns), `docs/specs/ORV-111/design.md` (front matter `spec` v1.0), `packages/design-system/src/testing/visual-asserts.ts` (`INK_CENTRE_BOUND = 1` on line 530, the scale on line 136, the doc comments on lines 529, 557, 563 and 730 that say 1 px or clauses 3 to 9), `visual-asserts.test.ts` line 114, `Button.stories.tsx` lines 122 to 128 and 159, DESIGN.md §4 and its change log, `.claude/rules/testing.md` line 30, and the Jira lane and any gate packet raised under L.
