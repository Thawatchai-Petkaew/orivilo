---
issue: ORV-129 (https://tpetkaew.atlassian.net/browse/ORV-129)
lane: S
version: 1.0
---

# ORV-129: check:knowledge checks the Index and refuses absolute source paths

## Why

The knowledge base has two gaps that only a person can catch today.

1. `scripts/check-knowledge.mjs` reads `docs/knowledge/README.md` only for its license row (`readLicenses`). It never compares the `## Index` table with the entry files. PR 113 added 14 entries and left the Index unchanged, and a review round was spent on it (L-0020).
2. The script never reads a `source:` value beyond "present". Five entries cited a file in the owner's session upload folder, which no reviewer, CI run or later session can open (L-0031). The 12 entries numbered 0001 to 0012 still cite `~/` paths into two local checkouts. The ids are written without the K prefix in this spec, because `pnpm check:knowledge` reads a written id as a citation and the entry numbered 0001 sits below confidence 0.7.

The owner widened this issue to the source refusal (ORV-129 comment 10221) and decided the three changes, lane S, no guard path and the two repository URLs (ORV-129 comment 10252).

This is a CI check on files in the repo, not a hook that judges a tool call, so the guard frame of L-0012 does not apply. `scripts/check-knowledge.mjs` does not match `GUARD_PATH` in `scripts/ovl/write-guard.mjs`.

Nothing here is simulated. There is no UI text: the problems are developer output in English, in the script's existing `path: message` form.

## Story

As the main session or a reviewer, I want `pnpm check:knowledge` to fail when the Index and the entry files drift apart, or when an entry cites a path only one machine can open, so that neither waits for a review round to be found.

## Rules and bounds

Each rule below is the one home of its outcome. Other sections name the rule only.

### Reading the Index

- **index-read-1**: The Index is the run of lines after the line `## Index` in `docs/knowledge/README.md`, up to the next line that starts with `##` and a space, or the end of the file. A row is a line in that run that starts with `|`. The cells are the row split on `|` and trimmed; the first cell is the entry, the second is the confidence. A row whose first cell is not exactly `[[<name>]]` is not read (this skips the header and the separator row). When `docs/knowledge/README.md` does not exist, the Index rules below are not run (as `readLicenses` falls back today). When it exists, at least one entry file exists, and it has no `## Index` line, the script reports `docs/knowledge/README.md: has no ## Index table`.
- An entry file is a file the script already loads as a knowledge entry: `docs/knowledge/<topic>/K-NNNN-<kebab-slug>.md`, a name that passes the existing file name check. Its name for the Index is the file name without `.md`.

### Index checks

- **index-row-1**: For each entry file whose name is the first cell of no Index row, the script reports `<entry path>: has no row in the docs/knowledge/README.md Index`.
- **index-row-2**: For each Index row whose `<name>` is the name of no entry file, the script reports `docs/knowledge/README.md: Index row [[<name>]] names no entry file`.
- **index-row-3**: For each Index row that names an entry file whose raw `confidence` passes `CONFIDENCE_FORMAT`, the row's confidence cell and the entry's confidence are compared as numbers. They differ when the cell does not pass `CONFIDENCE_FORMAT` or `Number(cell) !== Number(confidence)`. Then the script reports `docs/knowledge/README.md: Index row [[<name>]] has confidence <cell>, the entry has <confidence>`. An entry whose own confidence fails the format is reported by the existing rule only.

### Source check

- **source-path-1**: For each entry file, the parsed `source` value (a list is joined with spaces) is split on whitespace into words. Each word loses its leading `(`, `[`, `<`, `"` and backtick characters. A word is refused when it then starts with `/`, with `~`, or with one letter and a colon (a drive letter such as `C:`). The script reports one problem per refused word: `<entry path>: source holds an absolute or session path <word>; cite a repo-relative path or an https URL (L-0031)`. An https URL and a repo-relative path start with neither, so they pass.

### The rewrite of the 12 entries

- **repo-cite-1**: In the `source:` line of each entry listed below, each `~/My Work/TechFlow/AI-First/allkons-marketplace/` becomes `https://bitbucket.org/ThammasornDEV/allkons-marketplace` followed by one space, and each `~/Claude/Projects/CAMPVIBE/` becomes `https://github.com/Thawatchai-Petkaew/campvibe` followed by one space. Everything after each prefix (the cited files, the lines, the notes in brackets) stays as it is. No other line of these files changes, so `retrieved`, `confidence` and the body are kept.

The 12 entries (`grep -rln -E '^source: "~/' docs/knowledge`), by folder, number and slug, with the prefixes in their `source:` line:

| Folder          | Number | Slug                                          | allkons-marketplace | CAMPVIBE |
| --------------- | ------ | --------------------------------------------- | ------------------- | -------- |
| `enforcement`   | 0001   | `prose-rules-vs-running-gates`                | 1                   | 0        |
| `orchestration` | 0002   | `atlas-orchestrates-from-the-main-loop`       | 1                   | 0        |
| `orchestration` | 0003   | `atlas-envelope-v2-and-checked-facts`         | 1                   | 0        |
| `orchestration` | 0004   | `atlas-report-contracts`                      | 1                   | 0        |
| `verification`  | 0005   | `proof-must-match-the-claim`                  | 1                   | 0        |
| `verification`  | 0006   | `finding-without-evidence-is-dropped`         | 1                   | 0        |
| `verification`  | 0007   | `model-review-capped-at-two-rounds`           | 1                   | 0        |
| `enforcement`   | 0008   | `hooks-fail-silently-without-a-heartbeat`     | 1                   | 2        |
| `orchestration` | 0009   | `campvibe-envelope-done-when-is-an-outcome`   | 0                   | 1        |
| `enforcement`   | 0010   | `campvibe-done-needs-a-verify-role`           | 0                   | 1        |
| `orchestration` | 0011   | `campvibe-circuit-breaker-and-stall-watchdog` | 0                   | 1        |
| `enforcement`   | 0012   | `skill-use-per-role-is-prose-only`            | 1                   | 1        |
|                 |        | Total                                         | 9                   | 6        |

### The README source row

- **readme-source-1**: In the `source` row of the field table in `docs/knowledge/README.md`, the last sentence, "Never an absolute path, for entries written or changed from 2026-10-26 on; the entries numbered 0001 to 0012 cite `~/` paths and are known exceptions, rewritten under ORV-129 (L-0031)", becomes "Never an absolute path; `pnpm check:knowledge` refuses one (L-0031)". The rest of the row stays. Prettier may re-pad the table.

### Bounds

- The Index rules and `source-path-1` add problems to `checkKnowledge`; they change no existing rule and no existing message.
- If `index-row-3` finds a current Index row that differs, the entry's frontmatter is the truth and the Index row is fixed in this PR. A check of every row on 2026-10-29 found none.
- The PR touches no file under `GUARD_PATH`, so it needs no owner approval record (comment 10252).

## Acceptance criteria

Tests run through `checkKnowledge(root)` on a temporary fixture, the same function `pnpm check:knowledge` runs on the repo root.

| #   | Given                                                                                                                                                              | When                                                                                                                                                                          | User sees                                                                                                                                                                                   | Data effect                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | A fixture with one entry under `docs/knowledge/contrast/` and a README whose `## Index` has no row for it                                                          | `checkKnowledge` runs                                                                                                                                                         | The `index-row-1` problem for that entry path                                                                                                                                               | None; the CLI would exit 1                             |
| 2   | A fixture whose Index has a row for a name with no entry file                                                                                                      | `checkKnowledge` runs                                                                                                                                                         | The `index-row-2` problem naming that row                                                                                                                                                   | None                                                   |
| 3   | A fixture entry with confidence `0.9` and its Index row with `0.8`; then the same row with `0.90`                                                                  | `checkKnowledge` runs on each                                                                                                                                                 | The `index-row-3` problem for `0.8`; no problem for `0.90`                                                                                                                                  | None                                                   |
| 4   | A fixture README with a license row and no `## Index` line, plus one entry; then a fixture with an entry and no README                                             | `checkKnowledge` runs on each                                                                                                                                                 | The `index-read-1` problem for the first; no Index problem for the second                                                                                                                   | None                                                   |
| 5   | A fixture entry whose source is, in turn: `/Users/someone/notes.md:3`, `~/.claude/uploads/<session id>/guide.pdf`, `C:\Users\someone\guide.pdf`, `see (/tmp/x.md)` | `checkKnowledge` runs on each                                                                                                                                                 | One `source-path-1` problem per fixture, naming the refused word (comment 10221)                                                                                                            | None                                                   |
| 6   | A fixture entry whose source is, in turn: `https://www.w3.org/TR/WCAG22/`, `scripts/check-knowledge.mjs:23`, and the rewritten source of the entry numbered 0010   | `checkKnowledge` runs on each                                                                                                                                                 | No problem                                                                                                                                                                                  | None                                                   |
| 7   | The script change applied and the 12 entries not yet rewritten                                                                                                     | `pnpm check:knowledge` runs                                                                                                                                                   | Exit 1 with 15 `source-path-1` problems (9 allkons-marketplace words and 6 CAMPVIBE words, the totals of the `repo-cite-1` table), and no Index problem                                     | None                                                   |
| 8   | The PR head                                                                                                                                                        | `grep -rlE '^source: "?~/' docs/knowledge` runs                                                                                                                               | No output                                                                                                                                                                                   | The 12 entries cite the two https URLs (`repo-cite-1`) |
| 9   | The PR head                                                                                                                                                        | `git diff -U0 origin/develop -- docs/knowledge/enforcement docs/knowledge/orchestration docs/knowledge/verification \| grep -E '^[-+][^-+]' \| grep -vE '^[-+]source: '` runs | No output: only `source:` lines changed in those folders, and each new line is its old line with the `repo-cite-1` replacements (worked example 2)                                          | `retrieved`, `confidence` and bodies kept              |
| 10  | The PR head                                                                                                                                                        | `grep -c 'known exceptions' docs/knowledge/README.md` and `grep -c 'refuses one (L-0031)' docs/knowledge/README.md` run                                                       | `0`, then `1` (`readme-source-1`)                                                                                                                                                           | README source row updated                              |
| 11  | The PR head                                                                                                                                                        | `pnpm check:knowledge` runs, and `node --test scripts/check-knowledge.test.mjs` runs                                                                                          | `check:knowledge: ok` with exit 0 on the tree; the tests pass, including rows 1 and 5, which fail on a fixture with a missing Index row and on one with `/Users/` in source (comment 10221) | None                                                   |
| 12  | The PR head                                                                                                                                                        | `git diff --name-only origin/develop...HEAD` runs                                                                                                                             | 16 files: `scripts/check-knowledge.mjs`, `scripts/check-knowledge.test.mjs`, `docs/knowledge/README.md`, the 12 entries, this spec; none matches `GUARD_PATH` (comment 10252)               | None                                                   |
| 13  | The PR head                                                                                                                                                        | `pnpm lint && pnpm typecheck && pnpm test && pnpm test:scripts && pnpm check:knowledge && pnpm format:check && pnpm build` run                                                | All pass                                                                                                                                                                                    | None                                                   |

## Tests

In `scripts/check-knowledge.test.mjs`:

- New: `ORV-129 index-row-1: an entry with no Index row is reported` (row 1), `ORV-129 index-row-2: an Index row that names no entry file is reported` (row 2), `ORV-129 index-row-3: an Index confidence that differs from the entry is reported` (row 3), `ORV-129 index-read-1: a README without an Index table is reported, no README skips the Index check` (row 4), `ORV-129 source-path-1: an absolute or session path in source is reported` (row 5), `ORV-129 source-path-1: an https URL and a repo-relative path pass` (row 6).
- Changed: `license must be on the README list` writes a README with only a license row and an entry, which `index-read-1` now reports. Its fixture README gains an `## Index` table with a row for the fixture entry, so it still checks licenses only.
- Unchanged: the tests whose fixtures have no README keep passing, because `index-read-1` skips the Index rules without a README.

## Worked examples

Run from the repo root. Words and numbers are printed as Node prints them; there is no rounding.

1. `source-path-1` on the real `source:` value of the entry numbered 0008 (copied from its line 5), before the rewrite. Expected output: `[ '~/My', '~/Claude/Projects/CAMPVIBE/.claude/hooks/palette-guard.sh:5-7', '~/Claude/Projects/CAMPVIBE/.claude/hooks/npm-shared-node-modules-guard.sh:17-24' ]`. The allkons word is `~/My`, because the checkout path holds a space.

```bash
node -e 'const s="~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/hooks/require-checked-by.py:15-20; ~/Claude/Projects/CAMPVIBE/.claude/hooks/palette-guard.sh:5-7 (CAM-691); ~/Claude/Projects/CAMPVIBE/.claude/hooks/npm-shared-node-modules-guard.sh:17-24 (CAM-690)"; console.log(s.split(/\s+/).map(w=>w.replace(/^[(\[<"`]+/,"")).filter(w=>/^(\/|~|[A-Za-z]:)/.test(w)))'
```

2. `repo-cite-1` on the same value. Expected output: `https://bitbucket.org/ThammasornDEV/allkons-marketplace .claude/hooks/require-checked-by.py:15-20; https://github.com/Thawatchai-Petkaew/campvibe .claude/hooks/palette-guard.sh:5-7 (CAM-691); https://github.com/Thawatchai-Petkaew/campvibe .claude/hooks/npm-shared-node-modules-guard.sh:17-24 (CAM-690)`. Running example 1's filter on this output prints `[]`.

```bash
node -e 'const s="~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/hooks/require-checked-by.py:15-20; ~/Claude/Projects/CAMPVIBE/.claude/hooks/palette-guard.sh:5-7 (CAM-691); ~/Claude/Projects/CAMPVIBE/.claude/hooks/npm-shared-node-modules-guard.sh:17-24 (CAM-690)"; console.log(s.replaceAll("~/My Work/TechFlow/AI-First/allkons-marketplace/","https://bitbucket.org/ThammasornDEV/allkons-marketplace ").replaceAll("~/Claude/Projects/CAMPVIBE/","https://github.com/Thawatchai-Petkaew/campvibe "))'
```

3. `index-read-1` on the last real Index row (README line 185). Expected output: `K-0088-material-color-utilities-0-4-0-quantizer-api-and-determinism 0.8`.

```bash
node -e 'const row="| [[K-0088-material-color-utilities-0-4-0-quantizer-api-and-determinism]]           | 0.8        | MCU 0.4.0 Apache-2.0; TS Celebi: 20 results in 20 calls (ORV-134 run) |"; const c=row.split("|").map(x=>x.trim()); console.log(c[1].match(/^\[\[([^\]]+)\]\]$/)[1], c[2])'
```

4. `index-row-3` comparison. The first pair is the Index cell and the frontmatter value of the entry numbered 0008; the other two are row 3's fixture values. Expected output, three lines: `0.85 0.85 same`, `0.90 0.9 same`, `0.8 0.9 differs`.

```bash
node -e 'for (const [cell,raw] of [["0.85","0.85"],["0.90","0.9"],["0.8","0.9"]]) console.log(cell, raw, /^(0(\.\d+)?|1(\.0+)?)$/.test(cell) && Number(cell)===Number(raw) ? "same" : "differs")'
```

5. The counts behind row 7 and the `repo-cite-1` table: entries whose `source:` holds `~/`, then allkons-marketplace prefixes, then CAMPVIBE prefixes, read from the tree before the rewrite. Expected output: `12 9 6`. Row 7's 15 is 9 + 6, one refused word per prefix (example 1).

```bash
node -e 'const fs=require("fs"),p=require("path");const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);const src=walk("docs/knowledge").map(f=>fs.readFileSync(f,"utf8").match(/^source: .*$/m)?.[0]??"");const all=src.join("\n");console.log(src.filter(s=>s.includes("~/")).length, all.split("~/My Work/TechFlow/AI-First/allkons-marketplace/").length-1, all.split("~/Claude/Projects/CAMPVIBE/").length-1)'
```

## Out of scope

- Duplicate Index rows, Index order and the "In short" cell are not checked.
- Whether a repo-relative `source:` path exists is not checked.
- A file or commit URL (`/blob/<ref>/` or `/src/<ref>/`) for the two repositories: their branch and commit were not read (open question 1).
- Body text of the 12 entries. The entry numbered 0012 keeps a `~/Claude/Projects/CAMPVIBE/.claude/hooks/` path in its body sweep (line 32); `source-path-1` reads `source:` only.

## Follow-ups (outside this lane S PR)

- `.claude/skills/ovl/SKILL.md:255`, "Research envelope that adds a knowledge entry": the interim absolute-path grep says "it stops when ORV-129 makes `pnpm check:knowledge` refuse an absolute `source:` path". Once this PR is on `develop`, that sentence and the grep are removed (L-0031), and the `grep -q <K id> docs/knowledge/README.md` duty of L-0020 can be dropped in favour of `index-row-1`. The skill is a guard-adjacent file, so it gets its own change.
- `.claude/agents/research.md:27-29`: "known exceptions until ORV-129 rewrites them. No hook or check refuses an absolute path yet" becomes untrue; the same follow-up rewrites it.
- `docs/lessons/L-0020-knowledge-index-left-out-of-the-pr.md:33`, `docs/lessons/L-0031-knowledge-source-cited-a-session-upload.md:56` and `docs/LESSONS.md:27` and `:38`: the status lines say the check is not applied; the retro after this PR updates them.

## Open questions (option, impact, default)

1. How the repository URL and the path inside it are joined. Options: the URL, a space, the path; or a file URL with a branch. A file URL needs the branch or commit, which no one read. **Default: the URL, a space, the path** (`repo-cite-1`).
2. The README source row: drop only the "known exceptions" clause, or the date clause too. With no exception left, "for entries written or changed from 2026-10-26 on" implies exceptions that no longer exist. **Default: both go, and the sentence names the check** (`readme-source-1`).
3. A README with no Index: skip or report. Skipping keeps the existing fixtures without a README valid; reporting covers a real README that lost its Index. **Default: skip when the README is absent, report when it is present without `## Index`** (`index-read-1`).
4. The drive letter form. Comment 10252 says "a drive letter such as C:". **Default: one letter and a colon at the start of a word, as written**; no current source has such a word (`grep -rlE '^source: .*["[:space:](<[]([A-Za-z]:|/|~)' docs/knowledge` lists only the 12 entries; a backtick before the word is left out of this command only because it sits in inline code).

## Decisions it depends on

- ORV-129 comment 10221 (owner): the source refusal, done when it fails on a fixture with `/Users/` in source and passes on the current tree (rows 5 and 11).
- ORV-129 comment 10252 (owner): lane S, no guard path, the three changes and the two repository URLs (rows 1 to 12, `repo-cite-1`).
- L-0020 (the Index check), L-0031 (the source rule).
- ADR 0012 (lane S: G3 by Claude with evidence, G5 by the owner).

## Changelog

- v1.0 (2026-10-29): first spec.
