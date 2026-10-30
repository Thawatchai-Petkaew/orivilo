---
issue: ORV-111 (https://tpetkaew.atlassian.net/browse/ORV-111)
lane: L (a token or font change is the semantic token contract risk flag of the AGENTS.md lanes table; M only when the fix stays inside one recipe rule, see fix-once-1)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-111: Thai labels sit above the vertical centre of single-line controls

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | What the user sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The PR's base commit, before the fix. Button `variant="primary"` at sm, md and lg, once with `fixtures.thai` ("บันทึกการเปลี่ยนแปลง") and once with `fixtures.latin` ("Save changes"), under the neutral profile in light and in dark | The row 4 play runs on that base | Nothing changes on screen; this row measures the base | `docs/specs/ORV-111/tech.md` gets a Before table: the base sha, then one line per size, label and mode with the control height, the ink top, the ink bottom and the offset, as `ink-centre-1` defines them. One sentence under it names what puts the offset there: a face's vertical metrics, a token, or one recipe rule | The play is red on the base, and its output gives the table's numbers; the heights read 32, 40 and 48 px (`--cmp-button-height-sm`, `-md` and `-lg`, `generated.css` lines 604 to 606) |
| 2 | The Before table of row 1 | The builder makes the fix | No control gets its own nudge; the label moves wherever the changed face or token sets text | One change, as `fix-once-1` allows. A DESIGN.md change-log line carries the impact list (AGENTS.md iron rule 2): the type roles and the members of `single-line-control-1` the change reaches, and the two-line heights `fix-once-1` asks for | `git diff --name-only <base>...HEAD` passes the path check of worked example 3; the reviewer reads the change against `fix-once-1` |
| 3 | The fix of row 2 | The `ink-centre-1` measure runs on each box of each member of `single-line-control-1`, at each of its sizes, with both labels, in light and in dark | Each member shows "บันทึกการเปลี่ยนแปลง" and "Save changes" centred as `ink-centre-1` judges, in light and in dark; a member that is not names its follow-up issue | `tech.md` gets an After table: the head sha and the command, then one line per box and size with four offsets (Thai light, Thai dark, English light, English dark) | The After table has the 24 box and size pairs of worked example 2; each offset passes `ink-centre-1` or its line names a follow-up Jira key (open question 3); qa screenshots each member's story |
| 4 | The fix of row 2 | The Storybook test project runs `Button.stories.tsx`, locally and in CI | Storybook Base/Button, story Label Centre: primary buttons at sm, md and lg reading "บันทึกการเปลี่ยนแปลง" and "Save changes", under neutral light and dark. Its play passes, with one `ink-centre-1` assertion per size, label and mode | `Button.stories.tsx` gains the story `LabelCentre`. `src/testing/visual-asserts.ts` gains a shared helper (for example `expectInkCentred`) whose failure message lists each failing box with its offset; its pure part has node tests in `visual-asserts.test.ts` | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/button/Button.stories.tsx` passes on the head and fails on the base with the head's story and helper (row 1); `pnpm --filter @orivilo/design-system exec vitest run --project checks src/testing/visual-asserts.test.ts` passes; the play takes one screenshot per boundary, not one per button |

## Why

Jira ORV-111 reports that Thai button labels render above the vertical centre of the control. The Studio shows Thai and English together (AGENTS.md line 52), and DESIGN.md holds Thai and Latin on the same line to the same tests (§2 line 20) and says Thai must not look smaller or lighter than the Latin beside it (§4 line 140). A Thai label that rides high makes the control look unfinished beside its English twin.

User story: as a Studio user who reads Thai, I want the label of a button, field, menu item, tab, tag or toggle to sit at the vertical centre of its control, so that a Thai control looks as settled as an English one.

Thai letters in body and UI text come from Sarabun and Latin ones from IBM Plex Sans (`packages/design-system/src/tokens/fonts.css` lines 38 to 86; DESIGN.md §4 line 138), so Thai text is set with the metrics of a different face than Latin text, and a change to the Sarabun face reaches Thai text only. ORV-65 found one such lift in ToggleGroup and removed it inside that recipe (`recipes.css` lines 2142 to 2145; DESIGN.md change log v1.29). This issue asks for one fix at the source instead of one per control.

Nothing here is simulated. The offsets come from screenshots in Chromium, the one browser of the Storybook test project (`packages/design-system/vite.config.ts` lines 27 to 34). The pixel read runs only under Vitest browser mode (`inVitest`, `src/testing/visual-asserts.ts` line 112), so the static Storybook shows the story without the check. The re-check of row 3 is a real run that stays out of the commit (open question 2).

## Scope

- Row 1 measures Button labels at each size on the base, with the row 4 play.
- Row 2 makes one fix, as `fix-once-1` allows.
- Row 3 re-checks the members of `single-line-control-1` after the fix.
- Row 4 adds one Storybook play on Button, through a shared helper in `src/testing/visual-asserts.ts`, as `.claude/rules/testing.md` line 30 asks of a visual criterion.

No UI string is added: the labels are `fixtures.thai` and `fixtures.latin` (`src/components/fixtures.ts` lines 10 and 11), so the locale catalog does not change (AGENTS.md line 52). Both are the button copy of DESIGN.md §10 (line 240), and "บันทึกการเปลี่ยนแปลง" stacks a vowel and a tone mark on one letter (ลี่ in เปลี่ยน), the kind of Thai sample testing.md line 30 asks for.

## Lane

L. The fix sits at the token or font level. A token change is the semantic token contract risk flag of the AGENTS.md lanes table (line 37; DESIGN.md §5 line 149), and a change to `fonts.css` has the same reach: it changes the type roles that set `font.family.plex-sans` (`generated.css` lines 307 to 352). The lane is M only under `fix-once-1` Branch B, when the fix stays inside one recipe rule. In the POC, G1 and G2 pass under the owner's delegation (ADR 0012 decision 4, AGENTS.md iron rule 5); G5 stays the owner's.

## Rules

### ink-centre-1

How the vertical offset of a label is measured and judged, for one control box (`.ds-button` in rows 1 and 4, or the box the member table of `single-line-control-1` names):

1. Fonts first: the play waits for the label's faces (`document.fonts.load` with the label's computed font and its text, then `document.fonts.ready`), never for a fixed time.
2. A screenshot of an element that holds the box, taken and decoded the way `expectEdgeInk` does it (`visual-asserts.ts` lines 121 to 172: `page.screenshot` under the shared `orivilo-screenshot` lock; the scale is the screenshot width over the element's CSS width).
3. Region: the columns of the label text (the client rects of a Range over it; for an `<input>`, its content box) and the rows of the box's padding box.
4. Ground: the most frequent colour in the region.
5. Ink: a pixel whose distance from the ground, summed over R, G and B, is more than `INK_DISTANCE` (48, `visual-asserts.ts` line 14).
6. Ink band: from the first region row that holds ink to the last such row, plus one row. Ink centre: the middle of the band, in CSS px.
7. Control centre: the top of the box's border box plus half its height.
8. Offset: ink centre minus control centre, in CSS px, reported to 2 decimals; a negative offset is above the centre.
9. Pass: the offset is at most 1 CSS px either way.

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

The fix is one change at the source of the offset, not one per control.

- Branch A, expected: the change sits in `packages/design-system/src/tokens/fonts.css` (an `@font-face` rule) or in `packages/design-system/src/tokens/source/*.json` with the generated CSS rebuilt from it. The PR changes no file that the path check of worked example 3 refuses: `src/recipes/recipes.css`, a component's own `.tsx` in `src/components/<name>/` (its stories are allowed), a profile source in `src/profiles/source/`, a font file in `src/tokens/fonts/`, or a file under `apps/`.
- The fix keeps the family, size, weight and line-height tokens of the `type.*` roles in `src/tokens/source/semantic.json`, and Sarabun stays the Thai body face (DESIGN.md §4 line 138, ORV-58).
- The fix reports the height of two lines of `fixtures.thai`, and of two lines of `fixtures.latin`, set in `type.body.md`, before and after, in `tech.md` and in the impact list (DESIGN.md §4 line 140: a mixed line takes the body line-height). Open question 7 holds whether a change of that height is accepted.
- Branch B: if row 1 names one recipe rule as the cause, as ORV-65 found in ToggleGroup, the fix changes that rule alone, the lane becomes M, and this spec moves to version 1.1 with a changelog line before the build goes on.

## Worked examples

None is run here (no shell in this role). Each runs from the repo root with `node -e` and prints one line.

1. `ink-centre-1` on one pixel column of a md primary button in light mode. Copied inputs: the ground `action.primary` #7A22C7 and the ink `text.on-action` #FFFFFF (DESIGN.md lines 64 and 50), the height 40 px (`--op-size-10`, `generated.css` line 131), the 1 px border (`recipes.css` line 22), so the padding box has 40 less 2 rows, and `INK_DISTANCE` 48 (`visual-asserts.ts` line 14). The ink rows are stand-ins for a screenshot: the Thai column has a faint pixel just above its ink (under the threshold) and a mid-tone pixel just below it (over the threshold); the English column has them the other way round. Offsets to 2 decimals with `toFixed(2)`, then the pass test. Expected output: `-1.50 0.50 false true`.

   ```bash
   node -e 'const G=[122,34,199],W=[255,255,255],M=[189,145,227],F=[130,45,202],D=48;const d=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);const col=p=>Array.from({length:40-2},(_,i)=>p[i+1]??G);const ground=c=>{const n=new Map();for(const p of c)n.set(p.join(),(n.get(p.join())??0)+1);return [...n].sort((x,y)=>y[1]-x[1])[0][0].split(",").map(Number)};const off=(c,top=0,h=40,s=1,bw=1)=>{const g=ground(c);const r=c.map((p,i)=>d(p,g)>D?i:-1).filter(i=>i>=0);const a=r[0],b=r.at(-1)+1;return top+bw+(a+b)/2/s-(top+h/2)};const th={10:F,25:M},en={13:M,28:F};for(let y=11;y<=24;y++)th[y]=W;for(let y=14;y<=27;y++)en[y]=W;const o=[off(col(th)),off(col(en))];console.log(o.map(x=>x.toFixed(2)).join(" "),o.map(x=>Math.abs(x)<=1).join(" "))'
   ```

2. `single-line-control-1` on the 23 entries of `catalog/base/`, in file-name order, each with the height tokens its own boxes read (`recipes.css` and `generated.css`; toggle-group reads `button.height.*` through a `calc()`) and whether its measured box shows one line of text; select lists its trigger sizes, then its option. Counts, no rounding. Expected output: `23 11 24 button,context-menu,dropdown-menu,input-group,input,password-input,select,tabs,tag,toast,toggle-group`.

   ```bash
   node -e 'const c=["size.control.sm","size.control.md","size.control.lg"];const E=[["badge",["size.icon.md","size.icon.lg"],true],["button",c,true],["checkbox",["size.icon.sm","size.icon.md"],false],["context-menu",[c[1]],true],["dropdown-menu",[c[1]],true],["field",[],false],["input-group",c,true],["input",c,true],["kbd",[],true],["password-input",c,true],["popover",[],false],["progress",["space.inline.sm","space.inline.md"],false],["range-slider",[],false],["resizable",[],false],["scroll-area",[],false],["select",[...c,c[1]],true],["slider",[],false],["tabs",[c[0],c[1]],true],["tag",["size.icon.lg",c[0]],true],["textarea",c,false],["toast",[c[0]],true],["toggle-group",[c[0],c[1]],true],["tooltip",[],false]];const m=E.filter(([,,one])=>one).map(([n,h])=>[n,h.filter(t=>t.startsWith("size.control.")).length]).filter(([,k])=>k>0);console.log(E.length,m.length,m.reduce((a,[,k])=>a+k,0),m.map(([n])=>n).join(","))'
   ```

3. `fix-once-1` path check on six file lists: the expected fix (`fonts.css`, the helper and its tests, the story file, DESIGN.md, `tech.md`), then that list plus `recipes.css`, plus `Button.tsx`, plus `friendly.json`, plus `apps/web/app/globals.css`, and plus a Sarabun font file. Booleans, no rounding. Expected output: `true false false false false false`.

   ```bash
   node -e 'const bad=f=>f==="packages/design-system/src/recipes/recipes.css"||f.startsWith("packages/design-system/src/tokens/fonts/")||f.startsWith("packages/design-system/src/profiles/source/")||f.startsWith("apps/")||(/^packages\/design-system\/src\/components\/[^/]+\/[^/]+\.tsx$/.test(f)&&!f.endsWith(".stories.tsx"));const A=["packages/design-system/src/tokens/fonts.css","packages/design-system/src/testing/visual-asserts.ts","packages/design-system/src/testing/visual-asserts.test.ts","packages/design-system/src/components/button/Button.stories.tsx","DESIGN.md","docs/specs/ORV-111/tech.md"];const ok=l=>!l.some(bad);console.log([A,[...A,"packages/design-system/src/recipes/recipes.css"],[...A,"packages/design-system/src/components/button/Button.tsx"],[...A,"packages/design-system/src/profiles/source/friendly.json"],[...A,"apps/web/app/globals.css"],[...A,"packages/design-system/src/tokens/fonts/sarabun-400-thai.woff2"]].map(l=>ok(l)).join(" "))'
   ```

## Out of scope

- A label that mixes Thai and Latin in one line (`fixtures.mixed`).
- Text on more than one line: textarea, a select option with a description, a checkbox label.
- Boxes in the application tier (open question 6).
- Horizontal centring.
- Browsers other than Chromium, and a page-by-page check of `apps/web`.
- Visual regression baselines (advisory, `.claude/rules/testing.md` line 15).

## Open questions (with defaults)

1. Profiles. Option: run the play and the re-check under Professional and Friendly too. Impact: each box is measured under each profile, which adds CI time (`.claude/rules/testing.md` line 18). Default: neutral only. Neither `professional.json` nor `friendly.json` (`src/profiles/source/`) overrides `font.body`, `type.label.*` or `type.body.*`: Friendly overrides `type.heading.md` and `type.heading.sm` (lines 402 to 422) and Professional `type.display` (line 347). Friendly's taller controls (`size.control.md` and `lg`, lines 424 to 432) change the height, not the type.
2. Committed re-check. Option: land row 3 as a committed play per member. Impact: a play in the story file of each member entry (worked example 2), with their CI time and their lines in this PR. Default: no. The re-check is a scratch run with the same helper; `tech.md` records its command, sha and output, and qa screenshots each member's story.
3. A member outside `ink-centre-1` after the fix. Option: fix it in this PR. Impact: a per-component change, which `fix-once-1` rules out. Default: one follow-up Jira issue per cause, with its key on the member's line of the After table and in the PR body.
4. No allowed change passes the play. Option, when no change that `fix-once-1` allows brings the offsets of row 4 inside `ink-centre-1`: relax the bound, nudge per component, or change the sample. Impact: the issue's own bound or its fix-once scope no longer holds. Default: the builder stops after row 1 and reports `blocked` with the Before table and the changes it tried; the owner decides.
5. The measure and the eye disagree. Option: another measure (for example the ink band without the marks above the letters). Impact: a requirement change, which bumps this spec's version. Default: (a) when row 1 finds no offset outside `ink-centre-1` although the issue reports Thai labels sitting high, the builder stops and reports `blocked` with the Before table and a screenshot; (b) when the play passes but a label still looks off to the designer, the issue's measure stays, with the designer's G3 screenshot as the visual check.
6. Application tier. Option: re-check the application-tier boxes that read the same height tokens too: `.ds-command__option` (command-menu, `recipes.css` line 2414), `.ds-chat__option`, `.ds-chat__header` and `.ds-chat__meta` (canvas-chat, lines 4292, 3954 and 4077), `.ds-controls__zoom` (canvas-controls, line 2259), `.ds-sheet__row` (shortcut-sheet, line 2492) and `.ds-taskbar__header` (task-bar, line 3704). Impact: more boxes in the scratch run and in the After table. Default: no; `single-line-control-1` keeps to the base tier, and these boxes set text in the same body stack (`--op-font-family-plex-sans`, `generated.css` line 149), so a fix in `fonts.css` reaches them.
7. Line height of running text. Option: refuse a fix that changes the height of two lines of Thai text that `fix-once-1` reports. Impact: a fix that moves Thai labels without moving Latin ones may then be out of reach, which leads to open question 4. Default: accept the change when `tech.md` and the impact list give the heights before and after and the designer's G3 screenshots show a Thai paragraph before and after; the owner can take it back at G5.

## Decisions it depends on

- AGENTS.md: the lanes table (line 37), iron rule 2 (line 26, the impact list), and the design-system rules on lines 50, 52 and 55 (recipes use semantic tokens, the locale catalog, a profile changes visual expression only).
- DESIGN.md §4 (Sarabun for Thai below 24 px, ORV-58; a mixed line takes the body line-height), §5 (the layers), §11 (the design gate, which blocks G3), and change log v1.29 (ORV-65).
- `docs/adr/0003-shadcn-behavior-own-visual-layer.md`: tokens and recipes are our own visual layer.
- `docs/adr/0012-jira-states-by-environment.md` decision 4: G1 and G2 under the owner's delegation in the POC.
- `.claude/rules/testing.md` line 30 (visual plays through the shared helpers, L-0018 from ORV-108) and line 18 (time limits sized for the CI runner).
- `.claude/skills/ovl/SKILL.md`, section "POC mode" (ORV-137).

## Changelog

- v1.0: first version, written before the build from Jira ORV-111 as the envelope of task ORV-111-spec-1 quotes it (the Jira tool was not available to this role). Downstream to review at build: `.claude/rules/testing.md` line 30 (its list of shared helpers gains one), DESIGN.md §4 and its change log (the fix and the impact list), and the G1 and G2 packets.
