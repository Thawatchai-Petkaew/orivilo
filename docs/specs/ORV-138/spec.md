---
issue: ORV-138 (https://tpetkaew.atlassian.net/browse/ORV-138)
lane: L (guard files; ORV-138 description)
version: 1.1
---

# ORV-138: phase-1 guard batch, seven guard changes in one PR

## Goal

The owner decided that every phase-1 guard change goes into one batch PR with one owner approval
line (ORV-137 comment 10246). This spec is that PR's acceptance: seven changes, in build order, each
from its own source issue, each commit naming its source key. The source issues stay open and move on
when this PR merges.

Build order:

1. ORV-94: builder grant wording, text only.
2. ORV-120: a qa report on an issue with no spec gets a plain reason, never an error.
3. ORV-104: four recorder defects: story id, slice spec, stuck envelope, `DESIGN.md` in the union.
4. ORV-136: an honest qa walk of a PR that carries part of a spec; no keyword-visual on engine rows;
   no throw while a qa report is judged (survey K-0089).
5. ORV-137 item 2: a rework round counts only after a rejecting verdict on a builder's head.
6. ORV-130: branch key check for every writing role; no branch switch while an envelope is bound.
7. ORV-96: a glob, a variable or a `cd` into a record folder fails closed in `write-guard`.

Process (ORV-138 description): lane L; G1 and G2 pass under the POC delegation (ADR 0012 decision 4);
one reviewer pass plus `security`; the merge needs the owner's approval line from a terminal outside
Claude Code (ovl skill section 6). The PR is far above the 400-line story size by the owner's decision
in comment 10246; it is one PR, not a split.

**Frame (L-0012).** Every guard this PR changes is a guard rail for agents that follow the rules, not
a boundary: `result-recorder` and `merge-check` (ORV-120, ORV-104, ORV-136), `envelope-guard` (ORV-137
item 2, ORV-130), `worktree-guard` (ORV-130) and `write-guard` (ORV-96). Nothing outside the session
enforces any of them: the run records and the owner approval file are local files, and the planned
server boundary for merges, GitHub rulesets (ORV-97), returns HTTP 403 on this plan (ORV-97 comment
10110). A text rule alone is never a boundary. Honest limits lists what each one does not stop.

No change renders anything: no UI text, no locale strings, no Thai or English copy.

## Acceptance criteria

Each test this PR adds follows rule `tests-1`. Rule names point to the section Rules, where each rule
has its one home.

<!-- prettier-ignore -->
| # | Source | Criterion | Check |
| --- | --- | --- | --- |
| 1 | ORV-94 | The builder-grant wording says "a tool write (Write, Edit, MultiEdit or NotebookEdit)" in the three places that say "Write or Edit" today: the guard-file message (`scripts/ovl/write-guard.mjs` line 48), the subagent message (line 395) and the guard-file sentence of `.claude/skills/ovl/SKILL.md` section 4. No behaviour changes. | `grep -n "Write or Edit" .claude/skills/ovl/SKILL.md scripts/ovl/write-guard.mjs` prints only lines about `.orivilo/handoff.md`; `grep -c "Write, Edit, MultiEdit or NotebookEdit" scripts/ovl/write-guard.mjs` prints 2 or more |
| 2 | ORV-94 | The tests that match the old message text are updated and pass. | `pnpm test:scripts` |
| 3 | ORV-120 | Rule `qa-spec-1`, the case of no spec file at the report's head: a SubagentStop test and its heartbeat line. | `node --test --test-name-pattern="ORV-138 row 3:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 4 | ORV-120 | Rule `qa-spec-1`, the case of a spec file with no acceptance table. | `node --test --test-name-pattern="ORV-138 row 4:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 5 | ORV-120 | Rule `qa-spec-1`, the PostToolUse case of the Agent call: the envelope is not left open. | `node --test --test-name-pattern="ORV-138 row 5:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 6 | ORV-120 | The ovl skill says that every issue a qa envelope walks needs `docs/specs/<issue>/spec.md` with an acceptance table, lane S and slice issues included (L-0016). | `grep -n "acceptance table" .claude/skills/ovl/SKILL.md` |
| 7 | ORV-104 | Defect 1, story id: `storyTitle` resolves `export default meta` to the title inside `const meta = { title }`. This is already true on this branch (`scripts/ovl/result-recorder.mjs` lines 141 to 171 on f2f5fa2, `metaTitle` and `storyTitle`, test at `scripts/ovl/result-recorder.test.mjs` line 753); no code change. | `node --test --test-name-pattern="storyTitle reads a named meta object" scripts/ovl/result-recorder.test.mjs` reports 1 passing test |
| 8 | ORV-104 | Defect 2, slice spec: rule `slice-spec-1`. A qa report on a slice issue whose own spec holds the copied rows is recorded; the recorder reads no parent spec. | `node --test --test-name-pattern="ORV-138 row 8:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 9 | ORV-104 | Defect 3, stuck envelope: rule `close-1`, one test per case: a qa envelope that meets (a) and (b) with decision `error`; a builder envelope in the same state; `--owner` on both. | `node --test --test-name-pattern="ORV-138 row 9:" scripts/ovl/close-envelope.test.mjs` reports at least one passing test |
| 10 | ORV-104 | Defect 4, `DESIGN.md`: rule `union-1`. A PR that changes `DESIGN.md` with no envelope listing it is not refused by the write_set union check. | `node --test --test-name-pattern="ORV-138 row 10:" scripts/ovl/merge-check.test.mjs` reports at least one passing test |
| 11 | ORV-104 | The ovl skill states close-1 in section 4 (the close paragraph) and union-1 in section 6 (the union list of "Records a merge into `develop` needs"). | `grep -n "DESIGN.md" .claude/skills/ovl/SKILL.md` prints the union list line; read section 4's close paragraph against close-1 |
| 12 | ORV-136 | Survey first (L-0045): one knowledge section lists every route by which `scripts/ovl/result-recorder.mjs`, `scripts/ovl/merge-check.mjs` and `scripts/ovl/schemas/qa.v1.json` can refuse, or fail to record, an honest qa walk, each with file, line and a quote, the search patterns with their hit counts, and a verdict per route: kept (it refuses a dishonest walk), changed by a named rule of this spec, or an Honest limit. It covers at least every route in "Refusal routes found by reading". It is committed before the first ORV-136 code commit. | `grep -n "ORV-136" docs/knowledge/README.md`; `git log --reverse --format=%s origin/develop..HEAD` |
| 13 | ORV-136 | Rule `spec-at-head-1`: a test whose working-tree spec differs from the spec committed at the head. | `node --test --test-name-pattern="ORV-138 row 13:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 14 | ORV-136 | Rule `qa-scope-1`, the accepted walk: an approve on a PR that has a line, with an entry for each listed row only; and the fallback case of no line for the PR. | `node --test --test-name-pattern="ORV-138 row 14:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 15 | ORV-136 | Rule `qa-scope-1`, one test for each of its four conditions, broken. | `node --test --test-name-pattern="ORV-138 row 15:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 16 | ORV-136 | Rule `qa-scope-2`, one test per case (unlisted, listed, listed and marked visual, a listed number not in the table), with the "User sees" cell of ORV-134 row 8 as fixture text (Worked examples, qa-scope-2); and the column case: a table whose header cells are this spec's (`#`, `Source`, `Criterion`, `Check`), with a keyword word in the Check cell of an unlisted row whose entry has `visual: false`, gets no keyword-visual problem for that row (Worked examples, qa-scope-2 column). | `node --test --test-name-pattern="ORV-138 row 16:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 17 | ORV-136 | No new bypass: the scope comes only from the spec at the head, which the reviewer reads. This PR leaves `scripts/ovl/schemas/qa.v1.json` unchanged, so a report has no field to narrow its own scope, and leaves the qa rules of `scripts/ovl/merge-check.mjs` (`qaProblems`, lines 134 to 170 on f2f5fa2) unchanged (Honest limits, the merge-check line). | `git diff --exit-code origin/develop...HEAD -- scripts/ovl/schemas/qa.v1.json` |
| 18 | ORV-136 | `.claude/agents/qa.md` step 4 and the ovl skill step 6 say: walk the rows that the spec's `## Rows per PR` line names for the PR, else every row; a row listed under `## Rows that render nothing` needs no screenshot unless marked visual. | `grep -n "Rows per PR" .claude/agents/qa.md .claude/skills/ovl/SKILL.md` prints a line in each file |
| 19 | ORV-137 | Rule `rework-1`, with the ORV-139 timeline as fixture (Worked examples, rework-1): the issue has 1 round used, not 2, and the next builder envelope that names `rework_of` is allowed. | `node --test --test-name-pattern="ORV-138 row 19:" scripts/ovl/envelope-guard.test.mjs` reports at least one passing test |
| 20 | ORV-137 | rework-1 keeps the limit: a builder after a rejecting verdict on a builder's head counts; at the allowance the next builder envelope is blocked; `owner-grant` writes a grant only when escalated; the existing round tests pass. | `pnpm test:scripts` |
| 21 | ORV-137 | The ovl skill (section 2 "Rework rules", section 4 last paragraph on rounds) and the comment above `reworkState` in `scripts/ovl/records.mjs` describe rework-1. | `grep -n -E "after the first (negative )?verdict" .claude/skills/ovl/SKILL.md scripts/ovl/records.mjs` prints nothing |
| 22 | ORV-130 | Rule `branch-key-1`: a research envelope on a branch keyed to another issue is blocked with the branch-key reason; the same for product, architect and ds-architect. | `node --test --test-name-pattern="ORV-138 row 22:" scripts/ovl/envelope-guard.test.mjs` reports at least one passing test |
| 23 | ORV-130 | A retro envelope (role ds-architect, skill retro) on `chore/<slice key>-retro-lessons` whose `issue` is that slice key passes the branch-key check. | `node --test --test-name-pattern="ORV-138 row 23:" scripts/ovl/envelope-guard.test.mjs` reports at least one passing test |
| 24 | ORV-130 | Rule `switch-1`: each form in "Branch switch forms" is blocked in the main session while an envelope bound to that checkout is open, and the stderr names the bound task id; with no such envelope each is allowed; a subagent's call is not judged by switch-1. | `node --test --test-name-pattern="ORV-138 row 24:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test |
| 25 | ORV-130 | While an envelope is bound, `git worktree add`, `git status`, `git branch -a`, `git log` and a `git commit -m` whose message holds the word switch stay allowed; and the read-failure case of switch-1. | `node --test --test-name-pattern="ORV-138 row 25:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test |
| 26 | ORV-130 | The ovl skill's "Issue" bullet names no unchecked role but release, and its "One issue per checkout" bullet says `worktree-guard` blocks the switch. | `grep -n "Not enforced yet" .claude/skills/ovl/SKILL.md` prints nothing; `grep -n "worktree-guard" .claude/skills/ovl/SKILL.md` |
| 27 | ORV-96 | Rule `expand-1`: the review F5 form `cd .oriv?lo/owner-approvals && printf '{"by":"owner"}' > 7.json` is blocked for the main session and for a subagent, and so is the same form into `owner-waivers`. | `node --test --test-name-pattern="ORV-138 row 27:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 28 | ORV-96 | Every form in "Write-guard forms to catch" is blocked, each as a main-session call and as a subagent call. | `node --test --test-name-pattern="ORV-138 row 28:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 29 | ORV-96 | Every form in "Write-guard forms to keep" is allowed in the session the list names (rule `heredoc-1` for the commit and PR body forms). | `node --test --test-name-pattern="ORV-138 row 29:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 30 | ORV-96 | Rule `expand-1`, the case where the cwd or a `cd` target cannot be resolved. | `node --test --test-name-pattern="ORV-138 row 30:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 31 | ORV-96 | The ovl skill's Honest limits no longer say that a path built by `cd`, expansion or a glob is not seen, or that ORV-96 has not landed; they name the bypass classes of this spec's Honest limits, ORV-96 part. | `grep -n "until ORV-96 lands" .claude/skills/ovl/SKILL.md` prints nothing; `grep -n "expansion or a glob is not seen" .claude/skills/ovl/SKILL.md` prints nothing |
| 32 | ORV-138 | One PR from `chore/ORV-138-guard-batch`, title `ORV-138: ...`; every commit subject names one source key, and the keys first appear in build order: ORV-94, ORV-120, ORV-104, ORV-136, ORV-137, ORV-130, ORV-96. | `git log --reverse --format=%s origin/develop..HEAD` |
| 33 | ORV-138 | The merge needs the owner approval line for the PR's head, once for the whole batch (ORV-137 comment 10246); before the owner runs it, the pre-check names `.orivilo/owner-approvals/<n>.json` as missing. | `node scripts/ovl/merge-check.mjs <n> --head <sha>` |
| 34 | ORV-138 | The full gate passes on the head, `pnpm test:scripts` included, and the gate record for the head has `ok: true`. | `pnpm quality-gate`; `pnpm test:scripts` |
| 35 | ORV-138 | No em dash and no middot in any changed text; Prettier clean. | `pnpm format:check`; `git diff -U0 origin/develop...HEAD` read for the two characters |
| 36 | ORV-136 | Rule `no-throw-1` (K-0089 N1), one test per case: (a) an approve with no `.quality-gate/report.json` in the hook's checkout; (b) one whose file is not JSON; (c) one whose JSON lacks the fields; (d) an approve whose `head_sha` is not in the hook's checkout; (e) an approve whose diff holds a `*.stories.tsx` removed at the head. Cases (a) to (d) each run at SubagentStop and at PostToolUse on the Agent call. The `git show` route has no test: once the diff has run, the head holds every changed file that is not removed. | `node --test --test-name-pattern="ORV-138 row 36:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 37 | ORV-136 | The ovl skill section 2 tells the main session to keep at most one open unbound envelope per role, and why (Honest limits, the binding line; K-0089 N3). | `grep -n "open unbound" .claude/skills/ovl/SKILL.md` prints a line between the `## 2.` and `## 3.` headings |

## Rules

Each rule below is the one home of its outcome. Other sections point to the name.

- `tests-1`: every test this PR adds for an acceptance row starts its name with `ORV-138 row <n>:`,
  where n is the row number in the table above. A row's Check runs that name pattern and must report
  at least one passing test (a pattern that matches nothing reports none and fails the row).
- `spec-at-head-1`: the recorder reads `docs/specs/<envelope issue>/spec.md` as it is at the
  report's `head_sha` (`git show <head_sha>:docs/specs/<issue>/spec.md` in the hook's checkout), not
  from a working tree.
- `qa-spec-1`: when that file does not exist at the head, cannot be read, or has no table whose header
  row starts with `#`, the qa.v1 report is refused with the one problem
  `no acceptance table in docs/specs/<issue>/spec.md` (the issue key filled in). It is a refusal like
  any other qa.v1 problem: SubagentStop exits 2 and its heartbeat line has decision `block`, and
  PostToolUse on the Agent call closes the envelope as `no_report` with that line in stderr. The
  recorder does not throw on any state of the spec (no-throw-1).
- `no-throw-1`: judging a qa.v1 report (`judge` in `scripts/ovl/result-recorder.mjs` and every
  function it calls) never throws. Each refusal route returns a one-line problem and is refused the
  way qa-spec-1 refuses a missing table. Below, `<checkout>` is the git top of the hook input's `cwd`
  and `<head>` the report's `head_sha`. The routes that throw on f2f5fa2 (K-0089 N1), with the
  problem each gives:
  - on an approve, `.quality-gate/report.json` is missing or cannot be read (line 130):
    `.quality-gate/report.json cannot be read in <checkout>`;
  - on an approve, the file is not JSON (line 130): `.quality-gate/report.json is not JSON`;
  - on an approve, the JSON lacks a field (line 136):
    `.quality-gate/report.json lacks ok, stepsSource, git.sha or git.dirty` (the text thrown today);
  - on an approve, `git diff --name-only origin/develop...<head>` fails, because the head or
    `origin/develop` is not in the checkout (line 215):
    `git diff origin/develop...<head> failed in <checkout>: fetch the head and origin/develop there`;
  - on an approve, `git show <head>:<file>` fails for a changed `*.stories.tsx` that the head holds
    (line 162): `git show <head>:<file> failed in <checkout>`.

  When the gate report cannot be used, the checks that read it (lines 198 to 213) add nothing, and
  the other problems of the report are still listed. A changed stories file that the head does not
  hold (removed) is skipped, as `merge-check` skips it (`scripts/ovl/merge-check.mjs` line 153; open
  question 9). A spec that cannot be read at the head is qa-spec-1's case. The hook-input check before
  any report is parsed (line 44, a blank final message) is outside this rule.

- `slice-spec-1`: the recorder follows no parent pointer and the envelope names no spec. A slice
  issue's qa walk reads the slice's own spec, which L-0016 requires (ovl skill step 2). A slice with no
  spec of its own gets the qa-spec-1 refusal.
- `close-1`: `node scripts/ovl/close-envelope.mjs <task_id>`, without `--owner`, also closes a bound
  open envelope as `abandoned` when both hold: (a) its role writes nothing (qa, reviewer, security,
  release, or a designer whose `report_contract` is `reviewer.v1`), and (b) `.orivilo/heartbeat.jsonl`
  holds a `result-recorder` line with event `SubagentStop` for its `agent_id`, with decision `allow`,
  `block` or `error`. A builder, product, architect, ds-architect, research or writing designer
  envelope keeps today's rule: a final `allow` SubagentStop, else only the owner. `--owner` is
  unchanged.
- `union-1`: the main-session list of `merge-check` (`scripts/ovl/merge-check.mjs` lines 111 to 116
  on f2f5fa2) adds `DESIGN.md`, so a change to `DESIGN.md` counts inside the write_set union of any
  issue. The whole file counts: `merge-check` reads file names, not sections.
- `qa-scope-1`: a spec may hold a section `## Rows per PR` with lines `- PR <n>: rows <list>`, where n
  is a GitHub PR number and the list holds row numbers and ranges `<a>-<b>` (a not above b), comma
  separated. When the section has a line for the report's `pr`, these hold:
  - the report needs exactly one `ac` entry per listed row;
  - an entry for an unlisted row is refused (`ac row <r> is not in PR <n>'s rows`);
  - a listed number that is not a row of the acceptance table refuses the report
    (`PR <n> lists row <r>, which is not in the acceptance table`);
  - an approve needs every listed row `pass` or `owner_verify`.

  With no line for that PR, or no section, every row of the table is in scope (today's rule). The
  scope comes from the spec only; a report cannot narrow its own scope.

- `qa-scope-2`: the keyword rule (`scripts/ovl/result-recorder.mjs` line 33, applied at lines 265 to
  267 on f2f5fa2) reads, for each row, the cell in the column whose header cell, trimmed, is exactly
  `User sees` in the acceptance table that qa-spec-1 finds. A table whose header row has no such cell
  has no keyword-visual rows (K-0089 N5; today the rule reads the fourth cell whatever its header).
  A spec may also hold a section `## Rows that render nothing` with one line `- Rows: <list>`, in
  the qa-scope-1 list form. A listed row is exempt from the keyword rule, so its entry may carry
  `visual: false`. A listed row the report marks `visual: true` still needs screenshot or
  computed_style evidence (`scripts/ovl/schemas/qa.v1.json` lines 50 to 61). An unlisted row keeps
  the keyword rule. A listed number that is not a row of the table refuses the report.
- `rework-1`: a bound builder envelope B (one with `agent.json`) counts as a rework round only when a
  negative verdict was recorded after the start of the latest bound builder envelope that started
  before B, and before B started. A negative verdict is a `request_changes` qa.v1 or reviewer.v1
  result, or a failed gate record with `steps_source` `gate` (`scripts/ovl/records.mjs` lines 57 to
  74). The first bound builder of an issue never counts. `allowance`, `roundsUsed` and `escalated`
  keep their definitions over the new count (`scripts/ovl/records.mjs` lines 93 to 101), and
  `rework_of` is still required after any negative verdict (`scripts/ovl/envelope-guard.mjs` lines 187
  to 191).
- `branch-key-1`: `envelope-guard` checks the branch key (`scripts/ovl/envelope-guard.mjs` lines 160
  to 171) for these nine roles: builder, reviewer, qa, designer, security, product, architect,
  ds-architect and research. Release stays out (open question 1).
- `switch-1`: `worktree-guard` blocks a main-session Bash call (no `agent_id`) when one segment of it
  (split at `;`, `&&`, `||`, `|` and newlines, after quotes and backslashes are removed and the text is
  lowercased) is a branch switch form, and an envelope is open and bound (`agent.json`, no
  `result.json`, no `closed.json`) whose `worktree`, through realpath, is the checkout the call runs in:
  the `-C` path when given, else the git top of the call's cwd. A segment is a switch form when its
  first word is `git` and its first word after the git options (`-C <path>`, `-c <key=value>`) is
  `switch` or `checkout`, or when its first three words are `gh pr checkout`. When the records or the
  checkout cannot be read, a switch form is blocked and every other call keeps today's verdict. The
  stderr names the bound task ids. A subagent's call is not judged by switch-1.
- `expand-1`: `write-guard` judges a Bash call, from the main session or a subagent, as naming a
  protected path (all three sets for the main session; guard file and record for a subagent, as today)
  when the call holds a write form (`scripts/ovl/write-guard.mjs` lines 193 to 198 and 246 to 248: a
  redirect to a file, `tee`, `cp`, `mv`, `rm`, `ln`, `touch`, `sed -i`, and `git` `apply`, `restore`,
  `checkout`, `switch`, `stash` or `reset`) and any of:
  - (a) an expansion word: a word that holds `?`, `*`, `[` or `{` outside any quotes, or `$` or a
    backtick outside single quotes, whose fixed part (the text before the first of those characters)
    could begin a protected path. It could when the folder that fixed part names, resolved against the
    call's cwd, is a checkout of this project (the main checkout or one under `.claude/worktrees/`), a
    folder above one, or a folder inside a protected set. A word whose fixed part is empty always could.
  - (b) a `cd`, `pushd` or `popd` with no target, with `-`, with an expansion word as its target, or
    with a target that resolves (against the cwd, after the earlier `cd` words of the same command)
    inside a protected set.
  - (c) the call's own cwd is inside a protected set.

  The call is blocked. When the cwd or a `cd` target cannot be resolved, the call is judged as if (a)
  held (fail closed). The main session's literal-name rule (`scripts/ovl/write-guard.mjs` lines 386
  to 403) and the qa and designer screenshot exception (lines 365 to 374) are unchanged. Rule
  `heredoc-1` applies before (a) is read.

- `heredoc-1`: before expand-1 reads the words, a `$(cat <<'X'` ... `X` ... `)` whose delimiter is
  quoted (single or double quotes around X) is read as one quoted literal: nothing inside it is an
  expansion word or a write form. It covers Claude Code's commit and PR body forms. An unquoted
  delimiter gets no exception.

### Branch switch forms (switch-1, L-0012)

The forms a rule-following main session uses to change branch: `git switch <branch>`,
`git switch -c <branch>`, `git checkout <branch>`, `git checkout -b <branch>`,
`git -C <path> switch <branch>`, `gh pr checkout <n>`. Each is caught while an envelope is bound to
that checkout.

### Write-guard forms to catch (expand-1, L-0012)

The owner lines in the ovl skill section 6 (the `mkdir -p .orivilo/owner-approvals && printf ...`
line and the `owner-waivers` line) stay blocked inside Claude Code, as today. These forms are added,
each a test as a main-session call and as a subagent call:

- `cd .oriv?lo/owner-approvals && printf '{"by":"owner"}' > 7.json` (review F5 on PR #88)
- `cd .oriv?lo/owner-waivers && printf '{"by":"owner"}' > 7.json`
- `cp -r /tmp/x .oriv*/exports/abc` (a planted export folder)
- `printf x > .oriv[i]lo/owner-approvals/7.json`
- `printf x > .or{i,}vilo/owner-approvals/7.json`
- `D=.oriv; printf x > ${D}ilo/owner-approvals/7.json`
- `printf x > "$(printf .oriv)ilo/owner-approvals/7.json"`
- ``printf x > `printf .oriv`ilo/owner-approvals/7.json``
- `cd scripts/o?l && tee a.mjs` (a guard file)
- `cd - && rm x`, and `cd && rm x`
- `printf x > 7.json` with the call's cwd at `<main>/.orivilo/owner-approvals`

### Write-guard forms to keep (expand-1, L-0012)

The commands the ovl skill and `AGENTS.md` give an agent, plus Claude Code's commit and PR forms, stay
allowed:

- main session: `git grep -n -F 'old' HEAD -- $(git diff --name-only origin/develop...HEAD)` (ovl
  skill section 2, "Before a re-check")
- main session: the knowledge `source:` check of the ovl skill section 2 ("Research envelope that
  adds a knowledge entry"), the `{ git diff ...; git ls-files ...; } | xargs grep -n -E '...'` form
- main session: `export TEST_DATABASE_URL=postgres://localhost/x REQUIRE_DB_TESTS=1; pnpm quality-gate`
- main session: `git -C <worktree> push -u origin HEAD`, and `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- main session: `git commit -m "$(cat <<'EOF'` with a message that holds `>`, `rm` and `git switch`,
  then `EOF` and `)`; and `gh pr create --title "ORV-138: x" --body "$(cat <<'EOF'` ... `EOF` `)`
- subagent: `node --test scripts/ovl/*.test.mjs`, and `pnpm test:scripts 2>&1 | tail -5`
- subagent: `rm -rf /tmp/orv-*` (its fixed part is outside every checkout)
- subagent (qa): `ls <main>/.orivilo/runs/ORV-1/ORV-1-qa-1/screenshots/*.png`

### Refusal routes found by reading (ORV-136 survey seed)

The survey of row 12 covers at least these routes. Lines are on f2f5fa2 as K-0089 reads them, with
its route ids (v1.0 gave lines read on 81e95d5):

- `scripts/ovl/result-recorder.mjs` lines 108 to 114 and 249 to 250 (R1): a missing or unreadable
  spec (qa-spec-1, on this branch since 97bab4f).
- lines 115 to 117 (R2): a spec with no acceptance table (qa-spec-1).
- line 111 (R3): the spec is read from the working tree (spec-at-head-1).
- lines 118 to 123 (R4): which rows count, and the cell the keyword rule reads (qa-scope-2).
- lines 252 to 257 (R5, R6): a repeated `ac` row, or a row not in the spec.
- lines 259 to 264 (R7): an `ac` entry is needed for every spec row (ORV-136 point 1).
- line 33 and lines 265 to 267 (R8): the keyword list makes a row visual (ORV-136 point 2), and then
  `scripts/ovl/schemas/qa.v1.json` lines 50 to 61 need screenshot or computed_style evidence.
- lines 268 to 270 (R9): an approve with any `fail` row is refused.
- lines 271 to 273 (R10): an `owner_verify` row needs a screenshot.
- lines 274 to 277 with 238 to 245, 48 to 62 and 35 (R11): evidence screenshot path, PNG signature,
  and the computed_style form.
- lines 179 to 190 (R12): screenshot file naming.
- lines 192 to 213 with 128 to 138 (R13): an approve needs `.quality-gate/report.json` in the hook's
  checkout, for the head, clean, full and ok; a missing or malformed report throws at lines 130 and
  136 (no-throw-1).
- lines 215 to 234 with 161 to 171 (R14): each changed `*.stories.tsx` needs light and dark
  screenshots; the `git diff` at line 215 and the `git show` at line 162 throw when they fail
  (no-throw-1).
- lines 87 to 102 with 78 to 84 (R15): an approve with a kept Critical finding, or a
  `request_changes` with no kept Critical or Important finding.
- lines 285 to 314 (R16): not one JSON object, a report in another contract, a schema error, or
  another `task_id`.
- lines 369 to 375 and 410 to 414 (R17, R18): a report still refused after one send-back records
  nothing, and PostToolUse closes it as `no_report`.
- lines 325 to 330 (R19): binding needs exactly one open unbound envelope of the role (Honest limits,
  the binding line).
- lines 339 to 344 with 357 and 404 to 405 (R20): no bound envelope, or a closed one.
- lines 43 to 45 with 362 (R21): a blank final message.
- lines 461 to 476 (R22): a failed Agent call closes the envelope as `no_report`.
- `scripts/ovl/schemas/qa.v1.json` line 35 (`ac` needs one entry or more), line 46 (each entry needs
  evidence) and lines 84 to 89 (an approve needs `quality_gate.ok` true); K-0089 S1 to S10.
- `scripts/ovl/merge-check.mjs` line 139 (M1, no `qa.json`), lines 135 to 138 (M2, the latest
  `qa.json` of the issue; Honest limits, the merge-check line), 141 to 145 (M3, a stale head), 147 to
  148 (M4, another PR), 149 to 150 (M5, not an approve), 151 to 168 (M6, story screenshots), 121 to
  132 (M7, the gate record) and 107 to 119 with 236 to 239 (M8, the write_set union).

The survey is K-0089 (`docs/knowledge/orchestration/K-0089-ovl-qa-walk-refusal-routes.md`). It found
five points that v1.0 named nowhere; v1.1 places each before the first ORV-136 builder task (L-0045):
N1 in rule no-throw-1; N2, N3 and N4 in Honest limits (the recorder part); N5 in rule qa-scope-2.

## Worked examples

Run from the repo root. Each line prints exactly the output shown; every output is exact, with no
rounding.

- rework-1, input copied from `.orivilo/runs/ORV-139/` on 2026-10-29: the `started_at` of
  `ORV-139-build-1`, `-build-2` and `-build-3` `agent.json`, and the `recorded_at` of the two
  `request_changes` results, `ORV-139-qa-1` and `ORV-139-qa-2` (both gate records there have
  `ok: true`, so neither is negative). The first number is today's count, the second the rework-1
  count. Expected output: `2 1`.

  ```bash
  node -e 'const b=["2026-10-28T18:50:51.651Z","2026-10-28T19:51:32.972Z","2026-10-28T20:01:52.849Z"].map(Date.parse);const n=["2026-10-28T19:51:09.039Z","2026-10-28T20:31:41.852Z"].map(Date.parse);console.log(b.filter(t=>t>n[0]).length,b.filter((t,i)=>i>0&&n.some(v=>v>b[i-1]&&v<t)).length)'
  ```

- qa-scope-1 list form, input the rows that `docs/specs/ORV-134/spec.md` line 61 gives to later
  slices (34, 35 and 38), written as a list. Expected output: `34 35 38`.

  ```bash
  node -e 'console.log("34-35, 38".split(",").flatMap(p=>{const [a,b=a]=p.trim().split("-").map(Number);return Array.from({length:b-a+1},(_,i)=>a+i)}).join(" "))'
  ```

- qa-scope-2, why the exemption is needed: the keyword list copied from
  `scripts/ovl/result-recorder.mjs` line 33, on the start of the "User sees" cell of
  `docs/specs/ORV-134/spec.md` line 67 (row 8, an engine row that renders nothing). Expected output:
  `true`.

  ```bash
  node -e 'console.log(/layout|spacing|gap|align|centre|center|colou?r|overlap|motion|position/i.test("`colour-area` items whose `area-share` sums to 1 within 0.001 per scope"))'
  ```

- qa-scope-2 column, input the header row of `docs/specs/ORV-134/spec.md` line 64 and the header
  row of this spec's acceptance table: the index of the `User sees` cell, split as
  `scripts/ovl/result-recorder.mjs` lines 119 to 122 split a row. Expected output: `3` on the first
  line and `-1` on the second (no such column, so no keyword-visual rows).

  ```bash
  node -e 'for(const h of ["| # | Given | When | User sees | Data effect | Test | Slice |","| # | Source | Criterion | Check |"])console.log(h.split("|").slice(1,-1).map(c=>c.trim()).indexOf("User sees"))'
  ```

- expand-1 (a), input the review F5 command from the ORV-96 description: the words with an expansion
  character, each with its fixed part. Expected output: `.oriv?lo/owner-approvals .oriv`. The fixed
  part `.oriv` has no folder, so its folder is the call's cwd, the checkout root, which is a checkout
  of this project: the word could begin `.orivilo`, the command has a redirect, and it is blocked.

  ```bash
  node -e 'const c="cd .oriv?lo/owner-approvals && printf x > 7.json";const x=/[?*[{$`]/;for(const w of c.split(/\s+/))if(x.test(w))console.log(w,w.slice(0,w.search(x)))'
  ```

## Out of scope

- Revising the ORV-81, ORV-93 and ORV-95 specs, which state the old rules; for the rules this PR
  changes, this spec holds. In POC mode that bookkeeping is done once before the merge or dropped.
- A boundary for the owner approval: a signed approval, or a server rule with a credential the session
  does not hold (ORV-97).
- The branch-key check for release (open question 1).
- A `doctor.mjs stalled` command (L-0027).
- Any UI, locale string or rendered change.
- Moving the source issues ORV-94, ORV-96, ORV-104, ORV-120, ORV-130 and ORV-136: each moves on when
  this PR merges (ORV-138 description).

## Honest limits

ORV-96, `write-guard` expand-1 (a guard rail; each class is named once, and a bypass of a named class
is not a new finding, L-0012):

- An interpreter or a script writes the file with no write form in the text: `node -e`,
  `python3 -c`, `perl -e`, or a script the session wrote and then runs (`node /tmp/x.mjs`).
- A program makes the path and passes it on with no expansion word: a pipe into `xargs` or
  `find -exec` (`printf '\x2eorivilo/owner-approvals/7.json' | xargs touch`).
- An encoded or built command run by a shell: `echo <base64> | base64 -d | sh`, `sh -c`, `eval`, or
  `source` of a file the session wrote.
- A write program outside the write-form list: `dd of=`, `install`, `rsync`, `tar -x`, `unzip -d`,
  `curl -o`, `wget -O`, `git clone`.
- A link into a protected folder made by one of the routes above, then written through by a plain
  path.
- The fixed-part test works by folder: a fixed part under a folder outside every checkout
  (`/tmp/x*`) never counts, even when a link there leads into a checkout.
- A session without these hooks escapes them, and a builder whose `write_set` lists
  `scripts/ovl/write-guard.mjs` can weaken it for its own worktree until the merge, which needs the
  owner approval line.
- Cost: a write form with an unquoted glob in a checkout root (`rm *.tmp`) is blocked; use a literal
  path.

ORV-130, `worktree-guard` switch-1 and `envelope-guard` branch-key-1:

- switch-1 is a text rule: a `git` or `gh` word the shell builds (`$G switch`), an alias and a script
  are not seen. A subagent's switch is not judged.
- A stuck bound envelope blocks every switch in its checkout until it is closed; the stall check (ovl
  skill section 2) raises it first.

ORV-136 and ORV-120, the recorder:

- Nothing checks that the `## Rows per PR` lines of a spec together cover every row; the reviewer
  does.
- A spec can list a row that renders something under `## Rows that render nothing`; only the reviewer
  catches it.
- spec-at-head-1 needs the spec committed at the head the qa walks.
- The gate report line (K-0089 N2): an approve is judged against `.quality-gate/report.json` in the
  checkout the hook runs in (the git top of the hook input's `cwd`, `scripts/ovl/hook.mjs` line 87),
  not a report tied to the head by any other means. So qa runs the gate in the main checkout, on the
  head it walks; a gate run in another checkout is not seen. Which checkout the hook input's `cwd`
  names at SubagentStop and at PostToolUse is a K-0089 open point.
- The binding line (K-0089 N3): SubagentStart binds a subagent only when exactly one open unbound
  envelope of its role exists (`scripts/ovl/result-recorder.mjs` lines 325 to 330). With two open
  unbound envelopes of one role (two PRs of one issue walked at once, say), neither binds and neither
  report is recorded. The main session keeps one open unbound envelope per role at a time (row 37).
- The merge-check line (K-0089 N4): `merge-check` reads the latest `qa.json` of the whole issue
  (`scripts/ovl/merge-check.mjs` lines 135 to 148), and row 17 keeps those lines. When one issue has
  several PRs (qa-scope-1), a walk of PR B makes PR A's merge refuse, as stale or as for PR B. So a PR
  of a multi-PR issue is walked again right before its own merge.
- no-throw-1 covers the judging of a report. Writing the records afterwards (`record`, and
  `scripts/ovl/records.mjs`, which K-0089 did not read) is not surveyed; a throw there still fails
  closed with decision `error`.

ORV-104 close-1: a subagent that was sent back (`block`) may still run when its envelope is closed;
its later report is not recorded, and the main session dispatches a new envelope.

ORV-137 rework-1: time order, not the head SHA, decides that a verdict came after a builder; a builder
task that changed nothing still makes the next rejecting verdict count.

## Open questions (option, impact, default)

1. Release in branch-key-1? The ORV-130 description lists release, but release always has an empty
   `write_set` and its G5 packet spans a batch. Impact: a release envelope dispatched from a feature
   branch would be blocked. Default: release stays out.
2. The close-1 signal. Options: any SubagentStop heartbeat line for the agent, for roles that write
   nothing (default); or a new record written when the Agent call returns. Impact: the default needs no
   new record and no change to `beat`.
3. union-1 scope. Options: `DESIGN.md` in the main-session list (default, as the ORV-138 description
   says), or a documented rule that routes the edit through a role. Impact: the whole file counts, not
   only section 12.
4. The visual exemption was proposed before: L-0028 (`Visual: no`) was declined by the owner on
   2026-10-26 (ORV-20 comment 10218). The owner put ORV-136 point 2 into this batch on 2026-10-29.
   Default: build qa-scope-2 as written; the G1 comment names L-0028 and its decline so the owner can
   stop it.
5. heredoc-1. Options: exempt a quoted-delimiter heredoc inside `$(cat ...)` (default), or block every
   `$(` with a write form. Impact: without it, Claude Code's own commit and PR body forms are blocked
   whenever the message holds `>` or a write word.
6. The expand-1 write forms. Options: today's list (default), or every command. Impact: every command
   would block reads such as `ls *` in a checkout root; the other write programs are an Honest limit.
7. The home of switch-1. Options: `worktree-guard`, which already runs on every Bash call (default),
   or a new hook with a settings entry.
8. The spec the recorder reads. Options: at the report's head (default, spec-at-head-1), or the
   working tree as today. Impact: the declaration the reviewer read is the one the recorder uses.
9. A changed stories file removed at the head (no-throw-1). Options: skip it, as `merge-check` does
   (default); or refuse with the `git show` problem. Impact: refusing would send back an honest walk
   of a PR that deletes a story, and the merge would not need its screenshots anyway.

## Depends on

- ORV-137 comment 10246: every phase-1 guard change in one batch PR with one owner approval line.
- ORV-139 comment 10249: ORV-139 parked at rework round 3, the rework-1 example.
- ADR 0012 (Jira states and gates, decision 4 for the POC delegation), ADR 0013 (ovl orchestrator),
  ADR 0014 (owner grant by form only).
- `docs/specs/ORV-81/spec.md` (recorder rules, rework loop), `docs/specs/ORV-93/spec.md`
  (`write-guard`), `docs/specs/ORV-95/spec.md` (`merge-check`), `docs/specs/ORV-137/spec.md` (POC
  mode).
- K-0089 (`docs/knowledge/orchestration/K-0089-ovl-qa-walk-refusal-routes.md`): the row 12 survey
  on f2f5fa2, its routes R1 to R22, S1 to S10, M1 to M8, and the points N1 to N5 that v1.1 places.
- Lessons L-0012 (guard-rail frame), L-0016 (slice spec), L-0028 (declined visual rule), L-0032 (one
  issue per checkout), L-0045 (survey a risk class first).

## Changelog

- v1.0: first version, the seven source changes of the ORV-138 description in build order, with ORV-137
  comment 10246.
- v1.1: places the five points of survey K-0089 (N1 to N5), decided by the orchestrator under the
  owner's delegation (ADR 0012 decision 4). New rule no-throw-1 (N1) with row 36 and open question
  9; Honest limits gain the gate report line (N2), the binding line (N3, with row 37 for the ovl
  skill) and the merge-check line (N4); qa-scope-2 names the `User sees` column (N5), with row 16
  and a worked example; qa-spec-1 points to no-throw-1; the seed routes, row 7, row 17, union-1 and
  qa-scope-2 cite lines on f2f5fa2. Review downstream: `scripts/ovl/result-recorder.mjs` and
  `scripts/ovl/result-recorder.test.mjs` (no-throw-1, the qa-scope-2 column, rows 16 and 36),
  `.claude/skills/ovl/SKILL.md` section 2 (row 37), the K-0089 claim that the five points are named
  by no rule, and the G1 comment on ORV-138.
