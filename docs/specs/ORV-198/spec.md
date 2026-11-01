---
issue: ORV-198 (https://tpetkaew.atlassian.net/browse/ORV-198)
lane: S (no token, recipe or component change)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-198: the ink-centre measure stops reading a rounded corner as ink

## Goal

`measureInkCentre` and `expectInkCentred` (`packages/design-system/src/testing/visual-asserts.ts`, not `src/components/` as the issue says) read the label's columns over the rows of the padding box (`ink-centre-1` clause 3, `docs/specs/ORV-111/spec.md`). When those columns reach into a corner curve, the pixels outside the curve differ from the ground and count as ink, so the band takes the whole padding box and the offset reads 0.00 for any label. ORV-111 tech.md, After, note 4 found this on Input, Input group, Password input, Select trigger, Tag and the toast action at md and lg: a play on those members would pass with nothing measured. ORV-199 (sm field controls off centre) waits on this fix before it commits a play on those members.

This issue does two things:

1. Item 1: the region drops the columns a corner curve reaches, by `ink-corner-1` below, proven by a node test that reads 0.00 on the code today and the true offset after.
2. Item 2: one node test proves the measure takes its scale from `devicePixelRatio` (`ink-centre-1` clause 2) and goes red when the scale is the screenshot width over the CSS width.

Nothing is simulated: the node tests run on stand-in pixel arrays, and row 4 reads real screenshots in Chromium at device scale factor 1. The helper is a test helper, no component public API; no UI string, token, recipe or component file changes.

## Rules

### ink-corner-1

Extends the region of `ink-centre-1` clause 3 for a box with rounded corners.

1. Radii: the measured box's border-box corner radii as the browser draws them: the computed `border-*-radius` values, with radii that overlap scaled down together (the rule `paddingBoxOf` already applies in `visual-asserts.ts`). A pill radius therefore reads as half the box height.
2. Cuts: the left cut is the box's left edge plus the larger horizontal radius of its top-left and bottom-left corners; the right cut is the box's right edge minus the larger horizontal radius of its top-right and bottom-right corners.
3. Columns: the region runs from the larger of the label's left column and the left cut to the smaller of the label's right column and the right cut. A bound the label sets rounds outward, as clause 3 states. A bound a cut sets rounds inward (up on the left, down on the right), so a column the curve's antialiasing touches is not read (ORV-111 tech.md, After, note 5).
4. Nothing left: when the cuts leave no column, the reading is null, and `measureInkCentre` fails with its message that the region of the label holds no ink to measure.
5. A box with an input inside: a box that holds no text node and holds one `<input>` is read by that input's value (the label), with the input's content box as the label's columns and the box's own border box, borders and radii as the geometry. This makes `.ds-input-group` measurable as the box `single-line-control-1` names for Input group and Password input (ORV-111 tech.md, After, note 2).

A box with no radius keeps the region of clause 3 unchanged (both cuts equal its edges).

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | What the user sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/testing/visual-asserts.test.ts`, `describe("inkCentreOf")`, fixture of worked example 1: a 40 px box at left 0, 1 px border, radius 16 on every corner, label columns 8 to 32, the ink rows of ORV-111 worked example 1 (`thaiRows`) in column 20, and every pixel outside the padding box curve painted a stand-in canvas colour | The test reads the box with `inkCentreOf` at scale 1 | No UI; a developer sees the test name and its result | `inkCentreOf` reads the box's left edge, width and corner radii and cuts the columns by `ink-corner-1` | The test expects offset -1.50 and `centred` true. On the code before the fix it is red, reading 0.00 (worked example 1). The same fixture with radius 0 and no curve paint reads -1.50 on both codes |
| 2 | Same file and box, fixture of worked example 2: radius 16.5, no curve paint, one stand-in canvas pixel at column 16, row 1 and one at column 23, row 38 | The test reads the box at scale 1 | No UI | The cut bounds round inward (`ink-corner-1` clause 3) | The test expects -1.50. Two mutations, each seen red and restored: the left cut rounded down reads -6.50, the right cut rounded up reads 5.00 (worked example 2) |
| 3 | Same file, a new test for the pure part of `readBoxes` (the builder moves the screenshot-to-readings math into a function that takes the decoded image, the frame, the box geometry and `devicePixelRatio`; `readBoxes` passes `window.devicePixelRatio`). Fixture: an image 101 px wide for a frame 100.5 CSS px wide, a 40 px box at top 0 with a 1 px border, label columns 0 to 100.5, `thaiRows` in column 20, `devicePixelRatio` 1 | The test reads the box | No UI | None beyond the extracted function | The test expects offset -1.50 and `centred` true. Mutation: the scale set to the screenshot width over the frame width reads -1.59 and `centred` false, seen red and restored (worked example 3) |
| 4 | The head, a Storybook dev server on a free port that is not 3000, neutral profile, Thai locale, light and dark | A scratch story or script runs `measureInkCentre` on each box of the item 1 set in its own story: `.ds-control` (Base/Input Sizes), `.ds-input-group` (Base/Input group Sizes, Base/Password input Sizes, reveal on), `.ds-control[data-trigger]` (Base/Select Sizes), each at md and lg; `.ds-tag` md (Base/Tag Sizes); `.ds-toast__action` (Base/Toast Default, opened). Labels `fixtures.thai` and `fixtures.latin` | No UI change; the stories render as on the base | The scratch file is deleted before the commit. The PR body lists, per box, size, label and mode, the body and the whole-ink offset | Each body and whole-ink offset equals the matching line of ORV-111 tech.md, After table, to 2 decimals. A difference is listed in the PR body with both readings and is not tuned away in the rule |
| 5 | The head | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/button/Button.stories.tsx` and `pnpm --filter @orivilo/design-system exec vitest run --project checks src/testing/visual-asserts.test.ts` run, then `pnpm lint && pnpm typecheck && pnpm test` | Storybook Base/Button, story Label Centre, stays green | None | Both runs pass; every `inkCentreOf` test that passed before still passes with its expected values unchanged (its boxes have radius 0) |

## Worked examples

None is run here (no shell in this role). Each runs from the repo root with `node -e` and prints one line. The colours are those of ORV-111 worked example 1 (ground `action.primary` #7A22C7, ink #FFFFFF, the faint and mid-tone stand-ins) plus a stand-in canvas [240, 240, 240]; `INK_DISTANCE` is 48 (`visual-asserts.ts` line 16). Offsets to 2 decimals with `toFixed(2)`.

1. `ink-corner-1` clauses 2 and 3 on the row 1 fixture. Columns 8 to 32 as read today, then cut at 16 and 24. Expected output: `0.00 -1.50`.

   ```bash
   node -e 'const G=[122,34,199],W=[255,255,255],M=[189,145,227],F=[130,45,202],C=[240,240,240],D=48,N=40,b=1,r=16,ri=r-b;const d=(a,c)=>Math.abs(a[0]-c[0])+Math.abs(a[1]-c[1])+Math.abs(a[2]-c[2]);const out=(x,y)=>{const px=x+.5,py=y+.5;if(px<b||px>N-b||py<b||py>N-b)return true;const cx=px<b+ri?b+ri:px>N-b-ri?N-b-ri:null;const cy=py<b+ri?b+ri:py>N-b-ri?N-b-ri:null;return cx!==null&&cy!==null&&(px-cx)**2+(py-cy)**2>ri*ri};const ink={10:F,25:M};for(let y=11;y<=24;y++)ink[y]=W;const at=(x,y)=>out(x,y)?C:x===20?(ink[y]??G):G;const read=(L,R)=>{const n=new Map();let g,m=0;for(let y=b;y<N-b;y++)for(let x=L;x<R;x++){const p=at(x,y),k=p.join(),c=(n.get(k)??0)+1;n.set(k,c);if(c>m){m=c;g=p}}let f,l;for(let y=b;y<N-b;y++)for(let x=L;x<R;x++)if(d(at(x,y),g)>D){f??=y;l=y;break}return((f+l+1)/2-N/2).toFixed(2)};console.log(read(8,32),read(Math.max(8,Math.ceil(r)),Math.min(32,Math.floor(N-r))))'
   ```

2. `ink-corner-1` clause 3, the inward rounding, on the row 2 fixture: the cuts at 16.5 and 23.5 rounded inward, then the left cut rounded down, then the right cut rounded up. Expected output: `-1.50 -6.50 5.00`.

   ```bash
   node -e 'const G=[122,34,199],W=[255,255,255],M=[189,145,227],F=[130,45,202],C=[240,240,240],D=48,N=40,b=1,r=16.5;const d=(a,c)=>Math.abs(a[0]-c[0])+Math.abs(a[1]-c[1])+Math.abs(a[2]-c[2]);const ink={10:F,25:M};for(let y=11;y<=24;y++)ink[y]=W;const at=(x,y)=>(x===16&&y===1)||(x===23&&y===38)?C:x===20?(ink[y]??G):G;const read=(L,R)=>{const n=new Map();let g,m=0;for(let y=b;y<N-b;y++)for(let x=L;x<R;x++){const p=at(x,y),k=p.join(),c=(n.get(k)??0)+1;n.set(k,c);if(c>m){m=c;g=p}}let f,l;for(let y=b;y<N-b;y++)for(let x=L;x<R;x++)if(d(at(x,y),g)>D){f??=y;l=y;break}return((f+l+1)/2-N/2).toFixed(2)};console.log(read(Math.ceil(r),Math.floor(N-r)),read(Math.floor(r),Math.floor(N-r)),read(Math.ceil(r),Math.ceil(N-r)))'
   ```

3. `ink-centre-1` clause 2 on the row 3 fixture: ink rows 11 to 25 of a 40 px box at top 0, read at the scale `devicePixelRatio` (1) and at the screenshot width over the frame width (101 / 100.5). The offset is rounded to 2 decimals before the 1.5 px bound judges it, as clause 9 states. Expected output: `-1.50 true | -1.59 false`.

   ```bash
   node -e 'const s=[1,101/100.5];console.log(s.map(k=>{const t=11/k,b=26/k,o=Math.round(((t+b)/2-20)*100)/100;return o.toFixed(2)+" "+(Math.abs(o)<=1.5)}).join(" | "))'
   ```

## Out of scope

- Item 3 of ORV-198, the note that a sm field control sits on the 1.5 px bound with no margin: ORV-199 owns those boxes.
- Committed plays on the item 1 members: ORV-199 adds them once this lands.
- Any token, recipe, profile or component change, and any change to the bound or the clauses of `ink-centre-1` other than the region of clause 3.
- A label whose glyphs reach into the corner curve itself: the cut drops those columns of ink with the curve.
- Device scale factors other than 1 in the Storybook run (row 3 proves the scale in node only).
