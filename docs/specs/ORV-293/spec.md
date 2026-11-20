---
issue: ORV-293 (https://tpetkaew.atlassian.net/browse/ORV-293)
follows: ORV-287 (https://tpetkaew.atlassian.net/browse/ORV-287), docs/specs/ORV-287/spec.md v1.2, PR 229
lane: S (one test file, one prototype screen and its data module; no risk flag, see "Lane")
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-293: the Thai scan walks the example screens, and two follow-ups of the ORV-287 reviews

## Why

The reviews of PR 229 (ORV-287, the business read follow-ups) left three notes, read here as data and checked against this branch (`fix/ORV-293-i18n-scan-followups`, at `develop`'s head `1be9506`). The scope of this card is ORV-293 comment 10745.

1. **Migration 0014 is two statements** (findings ORV-287-sec-1 and ORV-287-review-1-S1). `packages/db/migrations/0014_business_reading_shape_tight.sql` holds two `ALTER TABLE` statements, a drop and an add, where the rule `orv287-shape-1` of `docs/specs/ORV-287/spec.md` words one. This card records that as one dated docs line in `docs/specs/ORV-281/tech.md` section 5.2 and one under `orv287-shape-1`. No row: it is wording, written by this card's spec task.
2. **The Thai scan does not walk `packages/design-system/src/examples`** (noted in the ORV-287 reviews and in ORV-287 spec v1.1). The test "carries no Thai string outside the catalog" of `packages/design-system/tests/check-i18n.test.ts` (group "UI code", line 97) walks `src/components`, `src/boundary`, `src/commands/index.ts`, the `.tsx` files of `src/i18n` and `apps/web/app`, and exempts by the regex `demo` (line 87) stories, tests, a file named exactly `fixtures.ts` and `story-shell.tsx`. The business and brand report screens live in `src/examples`, so a Thai string hard-coded in one of them passes the scan today. Widening the walk as it is fails nine files on 231 lines (W3): five older Thai-only screens and four data files. This card makes the walk pass by an exemption for data files, a move of the canvas prototype's specimen strings into its data module, and a known-debt list for the five older screens that can only shrink. Every line number this spec gives in `orivilo-canvas.tsx`, `orivilo-canvas.data.ts` or `check-i18n.test.ts` is that of the spec's base `1be9506`; PR 230, merged into the branch after v1.0, and this card's own build moved some of them, and each rule holds by the name it gives, not by the number.
3. **The count of rows already stored** (finding ORV-287-review-1-S2): closed with no row. The staging run "Migrate staging" of release PR 231 passed on 2026-11-19, so migration 0014 was applied and no stored row broke the tighter check.

This spec is not a guard on a tool call (it changes a test that reads source files in the suite), so the guard frame does not apply.

### What is real

Every item is a test, a move of strings between two files of a prototype screen, or wording. Nothing is simulated and no screen changes what it shows. The canvas prototype (`orivilo-canvas.tsx`) keeps its hand-written data, labelled as it is today.

## Lane

S. The PR changes `packages/design-system/tests/check-i18n.test.ts`, `packages/design-system/src/examples/orivilo-canvas.tsx` and `packages/design-system/src/examples/orivilo-canvas.data.ts`, and nothing else in code. It changes no profile or token schema, no semantic token, no component public API, no resolver, no auth or data access and no asset licensing. No locale string, recipe, story or catalog entry changes.

## Story

As the team, I want the copy check to read the example screens where the business and brand report screens live, so that a Thai string hard-coded in one of them fails the build as it would in a component, while the five older screens stay visible as named debt until ORV-294 moves them.

## Rules

Each rule below is defined here once; the rows and the other sections point to it by name.

### orv293-scan-1

The test "carries no Thai string outside the catalog" also walks `packages/design-system/src/examples`, with the same filter `code` as the other walks (`.ts` and `.tsx`, not matched by `demo`), and leaves out a file that `orv293-exempt-1` exempts or that `orv293-debt-1` lists. A hit keeps today's form, `<path from the repo root>:<line>`, and the test passes only with no hit. The walks of `src/components`, `src/boundary`, `src/commands/index.ts`, `src/i18n` and `apps/web/app` and the regex `demo` do not change. The test's head comment or title names the forms the scan catches, since it reads lines: a string literal, a template literal, JSX text and a comment.

### orv293-exempt-1

In the walk of `src/examples` only, a file is data, and not scanned, when its base name (the name the walk passes, without its folder) ends in `-fixtures.ts`, ends in `.fixtures.ts`, ends in `.data.ts`, or is exactly `business-story-helpers.tsx`. As a regex over the base name:

```js
/[-.]fixtures\.ts$|\.data\.ts$|^business-story-helpers\.tsx$/;
```

The match is anchored at the end and takes the extension `.ts` only, so a view (a `.tsx` file) is never data by its name, except the one story-only helper named in full. The character before `fixtures` or `data` must be a hyphen or a dot, so `metadata.ts` and `prefixtures.ts` are scanned. Today the names it exempts in `src/examples` are `business-fixtures.ts`, `brand-report.fixtures.ts`, `orivilo-canvas.data.ts` and `business-story-helpers.tsx` (W1), and also `foundation-fixtures.ts`, a file merged from `develop` after v1.0 and exempt by the `-fixtures.ts` form. W1 keeps its fixed list of names and its expected output. The test holds the regex as one named constant, so the test "exempts data files by their exact names only" can run it over a list of names.

### orv293-debt-1

A named list in the test, the known-debt list, holds exactly these five paths relative to `src/examples`, in this order: `workspace.tsx`, `members.tsx`, `decision-log.tsx`, `settings-form.tsx`, `landing.tsx`. The walk of `orv293-scan-1` leaves them out. A second test, "keeps the known-debt list to files that still hold Thai", reads each listed file and gives one problem line per entry, with the path from the repo root:

- `<path>: on the known-debt list with no file` when the file does not exist;
- `<path>: on the known-debt list with no Thai line` when the file holds no line with a Thai character.

It passes only with no problem line (W4). So an entry whose file was moved to the catalog (ORV-294) or deleted fails the build until it is taken off the list, and a file not on the list that holds Thai fails `orv293-scan-1`. No test stops a new entry for a file that holds Thai: the reviewer of any PR that adds an entry raises it as a finding (open question 3).

### orv293-canvas-1

In `orivilo-canvas.tsx`, the strings of the type specimen (`TypeSpecimen`, lines 1442 to 1472: the glyphs, the alphabet, the face label and the tagline, Latin and Thai) move into `orivilo-canvas.data.ts` as exported constants with the same text, byte for byte, and `TypeSpecimen` reads them from there. A constant that already holds the same text may be exported and reused (`ALPHABET_THAI`, line 919, holds the same Thai alphabet); `ALPHABET_LATIN` (line 918) has no digits and does not hold the specimen's Latin alphabet. The regex `THAI` (line 120, used by `langOf`) is written with unicode escapes for the first and last code point of the Thai block, U+0E00 and U+0E7F, and matches the same characters as today (W2). After the move `orivilo-canvas.tsx` holds no line with a Thai character.

## Acceptance criteria

Tests read the files of the branch; none reaches a network. Test names are suggested. A mutant row is seen red on the PR's test and restored; the builder adds one `verified` row per mutant with its red line (`.claude/rules/testing.md`, the text-guard and clause-by-clause rules).

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The PR head, and in turn the mutants of `business-node-view.tsx` (a business view with no Thai line today), each adding one Thai word: in a string literal; in a template literal; as JSX text; in a comment | The design-system tests run | No UI | By `orv293-scan-1`: on the PR head the scan's file list, asserted in the test, holds `packages/design-system/src/examples/business-node-view.tsx`, `brand-report.tsx` and `orivilo-canvas.tsx` and its hits are `[]`. Each mutant: hits are `["packages/design-system/src/examples/business-node-view.tsx:<line of the word>"]`. On today's test (no walk of `src/examples`) each mutant passes, which is the gap this row closes | `check-i18n.test.ts` "carries no Thai string outside the catalog"; four mutants, each red then restored, one `verified` row each |
| 2 | The named regex of `orv293-exempt-1` and the names of W1: the nine real names and the five invented ones | The test runs the regex (with `demo`) over the names | No UI | The exempt names are exactly `brand-report.fixtures.ts`, `business-fixtures.ts`, `business-story-helpers.tsx`, `orivilo-canvas.data.ts`; `business-fixtures.tsx`, `metadata.ts`, `prefixtures.ts`, `orivilo-canvas.data.tsx` and `my-business-story-helpers.tsx` are not exempt. Red, one mutant each, restored: each of the four name forms taken out in turn, the two fixtures forms by narrowing `[-.]` to a dot (takes `-fixtures.ts` out) and to a hyphen (takes `.fixtures.ts` out), the `.data.ts` form and the helper by dropping their alternative; `[-.]` dropped (lets `prefixtures.ts` in); `\.ts$` widened to `\.tsx?$` (lets `business-fixtures.tsx` in); the `^` of the helper dropped (lets `my-business-story-helpers.tsx` in) | `check-i18n.test.ts` "exempts data files by their exact names only"; seven mutants, one `verified` row each |
| 3 | The known-debt list of `orv293-debt-1`, and in turn the mutants that take `landing.tsx` off the list and that take `orv293-exempt-1` out of the walk | The design-system tests run | No UI | The list deep-equals `["workspace.tsx", "members.tsx", "decision-log.tsx", "settings-form.tsx", "landing.tsx"]`. With `landing.tsx` off the list, the scan's hits are the 23 lines of `packages/design-system/src/examples/landing.tsx`. With the exemption out of the walk, the hits name `business-fixtures.ts`, `orivilo-canvas.data.ts`, `business-story-helpers.tsx` and `foundation-fixtures.ts` | `check-i18n.test.ts` "carries no Thai string outside the catalog" and "keeps the known-debt list to files that still hold Thai"; both mutants red, restored, one `verified` row each |
| 4 | The known-debt list, and in turn the mutants that add `business-node-view.tsx` (no Thai line) and `gone.tsx` (no such file) to it | "keeps the known-debt list to files that still hold Thai" runs | No UI | On the PR head: `[]`. With `business-node-view.tsx`: `["packages/design-system/src/examples/business-node-view.tsx: on the known-debt list with no Thai line"]`. With `gone.tsx`: `["packages/design-system/src/examples/gone.tsx: on the known-debt list with no file"]` (W4) | `check-i18n.test.ts` "keeps the known-debt list to files that still hold Thai"; both mutants red, restored, one `verified` row each |
| 5 | The canvas prototype after `orv293-canvas-1` | They open the node "Type" ("ตัวอักษร") and page through its two pages | The same type pages as today, word for word: page 1 under "Latin: Inter" ("ตัวละติน: Inter") shows "Inter", "Aa", the Latin alphabet with its digits and "Give your ideas a world."; page 2 under "Thai: Anuphan and Sarabun" ("ตัวไทย: Anuphan กับ Sarabun") shows "Anuphan, Sarabun", "กข", the Thai consonant line of `ALPHABET_THAI` and "ให้ไอเดียมีตัวตน", with "Thai headings loopless, Thai body looped" ("หัวเรื่องไทยไม่มีหัว เนื้อความไทยมีหัว"); the same faces and `lang` values | None. `orivilo-canvas.tsx` holds no line with a Thai character; each constant the move adds holds the text of the literal it replaces | Story `LogoChapter`, play, as it is (it walks both type pages and checks the faces and `lang`, not the words); `orivilo-canvas.test.ts` as it is; the builder's `verified` row: `git diff origin/develop -- packages/design-system/src/examples/orivilo-canvas.tsx packages/design-system/src/examples/orivilo-canvas.data.ts` with each removed literal beside the constant that holds its text, which the reviewer reads |
| 6 | `THAI` in `orivilo-canvas.tsx` written with unicode escapes | `langOf` runs on art lines and heads | No UI | The regex matches the same 128 code units as today's literal and differs on none of the 65,536 code units (W2) | The builder's `verified` row: the W2 line with the regex read from `orivilo-canvas.tsx` at the PR head in place of `b`, printing `128 0`, which the reviewer reruns. The stories of `orivilo-canvas.stories.tsx` pass as they are; none asserts the `lang` that `langOf` sets, so they are not the proof |
| 7 | The PR head | The gate runs | No UI | `git diff --name-only origin/develop` lists the three code files of "Lane" and this card's docs only; no file under `apps/web`, `src/components`, `src/i18n`, `src/tokens` or `src/recipes` and no story file changes | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`, real output in the builder's `verified` rows |

## Rows that render nothing

- Rows: 1-4, 6, 7

Row 5 renders: the canvas prototype's type pages, proven on the story that walks them today.

## Out of scope

- Moving the five older screens (`workspace.tsx`, `members.tsx`, `decision-log.tsx`, `settings-form.tsx`, `landing.tsx`) to the locale catalog: ORV-294, lane M, in Backlog for the owner's go.
- Any change to a component, a token, a recipe, a story's look or a locale string.
- Any change to the scan of `apps/web` (`apps/web/app` in this test, and `apps/web/i18n/messages.test.ts`), or of `src/components`, `src/boundary`, `src/commands` and `src/i18n`.
- The other Thai lines of `src/examples` that are stories, tests or data by `orv293-exempt-1`.
- A count of the `business_reading` rows stored on staging: closed by the passing staging run (Why, item 3).
- Any change to migration 0014 or to the database.

## Open questions

Each has a default this spec uses; the main session or the owner can change it. What another answer changes is named beside it.

1. **Where the data exemption applies.** Default: in the walk of `src/examples` only (`orv293-exempt-1`), so the scan of `apps/web` and the other folders is unchanged. No file outside `src/examples` matches the names today. Other answer: add it to `demo` for every walk: row 7's file list is the same, and a later `*.data.ts` under `apps/web/app` would be exempt.
2. **How row 5 proves the words.** Default: the existing story `LogoChapter` and the reviewer's read of the diff, because today's play checks faces and `lang`, not the words. Other answer: add word assertions to `LogoChapter` (a story change with no change to its look): row 5's Check names them and the PR touches one story file.
3. **A guard against a growing known-debt list.** Default: review only (`orv293-debt-1`). Other answer: a test that the list is a subset of the five names: it lives in the same file as the list, so whoever adds an entry edits both, and it adds little.
4. **Which specimen strings move.** Default: all the strings of `TypeSpecimen` (Latin and Thai), so each pair sits in one file. Other answer: only the Thai ones: the move is smaller and the Latin half stays in the view.

## Depends on

- `docs/specs/ORV-287/spec.md` v1.2: the rule `orv287-shape-1` and its dated line of this card; changelog v1.1 (the note on `src/examples`).
- `docs/specs/ORV-281/tech.md` section 5.2.
- ORV-293 comment 10745 (scope); ORV-294 (the five screens).
- The review findings of PR 229: ORV-287-sec-1, ORV-287-review-1-S1, ORV-287-review-1-S2.
- The staging run "Migrate staging" of release PR 231, 2026-11-19.
- AGENTS.md, "Design-system rules" (every UI string from the locale catalog); `.claude/rules/testing.md` (text guards, clause by clause).

## Worked examples

Not run: this role has no shell. Each line runs from the repo root with `node -e`; the main session or the builder runs it and records the output. No rounding: the outputs are names, counts and lines.

W1. `orv293-exempt-1` over nine names copied from the folder listing of `packages/design-system/src/examples` and five invented names that no file holds today (`business-fixtures.tsx`, `metadata.ts`, `prefixtures.ts`, `orivilo-canvas.data.tsx`, `my-business-story-helpers.tsx`). `demo` is copied from `check-i18n.test.ts` line 87. Expected `brand-report.fixtures.ts business-fixtures.ts business-story-helpers.tsx orivilo-canvas.data.ts`.

```bash
node -e 'const demo=/\.(stories|test)\.tsx?$|^fixtures\.ts$|^story-shell\.tsx$/;const data=/[-.]fixtures\.ts$|\.data\.ts$|^business-story-helpers\.tsx$/;const names=["brand-report.fixtures.ts","brand-report.tsx","business-fixtures.ts","business-fixtures.test.ts","business-node-view.tsx","business-story-helpers.tsx","orivilo-canvas.data.ts","orivilo-canvas.tsx","workspace.tsx","business-fixtures.tsx","metadata.ts","prefixtures.ts","orivilo-canvas.data.tsx","my-business-story-helpers.tsx"];console.log(names.filter(n=>!demo.test(n)&&data.test(n)).join(" "))'
```

W2. `orv293-canvas-1`, the regex: `a` is today's literal, copied from `orivilo-canvas.tsx` line 120; `b` is built from the two code points the unicode escapes name, 0x0E00 and 0x0E7F. Over every code unit from 0 to 0xFFFF it prints how many `a` matches and on how many `a` and `b` differ. Expected `128 0`.

```bash
node -e 'const a=/[฀-๿]/;const b=new RegExp("["+String.fromCharCode(0xe00)+"-"+String.fromCharCode(0xe7f)+"]");let n=0,d=0;for(let c=0;c<0x10000;c++){const s=String.fromCharCode(c);if(a.test(s))n++;if(a.test(s)!==b.test(s))d++}console.log(n,d)'
```

W3. The survey's line counts (ORV-293 comment 10745): the five older screens and the four data files. Expected `180 51 231`.

```bash
node -e 'const debt=[48,47,38,24,23],data=[32,13,4,2];const s=a=>a.reduce((x,y)=>x+y,0);console.log(s(debt),s(data),s(debt)+s(data))'
```

W4. `orv293-debt-1` over the survey's Thai line counts of the five listed screens and `business-node-view.tsx` (0): the list as it is, with `business-node-view.tsx` added, and with `gone.tsx` added. Expected `[[],["packages/design-system/src/examples/business-node-view.tsx: on the known-debt list with no Thai line"],["packages/design-system/src/examples/gone.tsx: on the known-debt list with no file"]]`.

```bash
node -e 'const P="packages/design-system/src/examples/";const thai={"workspace.tsx":48,"members.tsx":47,"decision-log.tsx":38,"settings-form.tsx":24,"landing.tsx":23,"business-node-view.tsx":0};const DEBT=["workspace.tsx","members.tsx","decision-log.tsx","settings-form.tsx","landing.tsx"];const check=l=>l.flatMap(f=>!(f in thai)?[P+f+": on the known-debt list with no file"]:thai[f]===0?[P+f+": on the known-debt list with no Thai line"]:[]);console.log(JSON.stringify([check(DEBT),check([...DEBT,"business-node-view.tsx"]),check([...DEBT,"gone.tsx"])]))'
```

## Changelog

- v1.0 (2026-11-19, task ORV-293-spec-1): first version. The Thai scan walks `src/examples` with a data exemption by exact name and a known-debt list of five screens, and the canvas prototype's specimen strings move to its data module (rows 1 to 7, four named rules, four defaults). Item 1, the two-statement migration 0014, is one dated line each in `docs/specs/ORV-281/tech.md` section 5.2 and under `orv287-shape-1` in `docs/specs/ORV-287/spec.md` (v1.2); item 3 is closed by the staging run of 2026-11-19 with no row. No Jira call and no shell in this role; W1 to W4 are not run. Downstream to review: the ORV-293 builder, reviewer and qa envelopes; ORV-294's spec, when written, takes each moved screen off the known-debt list.
- v1.1 (2026-11-20, task ORV-293-spec-2): four statements brought in line with the build, caused by the deviations of builder task ORV-293-b1-scan (commit `f4e20de`) after `develop` (PR 230 and PR 234) was merged into the branch. Row 3's exemption mutant names `foundation-fixtures.ts` beside the three files; `orv293-exempt-1` notes that the names it exempts today also hold `foundation-fixtures.ts`; row 2 words its first two mutants as narrowing `[-.]` to a dot and to a hyphen, since the regex joins the two fixtures forms in one alternative; Why item 2 says once that the line numbers are those of the base `1be9506`. No rule, regex, list entry, row number, mutant count, open question, default or worked example result changed. Downstream to review: the ORV-293 reviewer and qa envelopes.
