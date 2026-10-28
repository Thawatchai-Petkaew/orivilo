---
issue: ORV-138 (https://tpetkaew.atlassian.net/browse/ORV-138)
lane: L (guard files; ORV-138 description)
version: 1.3
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
7. ORV-96: a glob, a variable or a `cd` into a record folder fails closed in `write-guard`; from
   v1.2 both guards read Bash through one shell reader (survey K-0090).

The round 0 review and security findings (v1.2) add commits after these seven; row 32 gives their
keys and order.

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
`scripts/ovl/shell-words.mjs` (rule shell-1) is a reader that `write-guard` and `worktree-guard`
call, not a guard of its own: it decides nothing and holds against nothing alone.

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
| 27 | ORV-96 | Rule `resolve-1`: the review F5 form `cd .oriv?lo/owner-approvals && printf '{"by":"owner"}' > 7.json` is blocked for the main session and for a subagent, and so is the same form into `owner-waivers`. | `node --test --test-name-pattern="ORV-138 row 27:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 28 | ORV-96 | Every form in "Write-guard forms to catch" is blocked, each as a main-session call and as a subagent call. | `node --test --test-name-pattern="ORV-138 row 28:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 29 | ORV-96 | Every form in "Write-guard forms to keep" is allowed in the session the list names (rule `shell-1` (f) for the commit and PR body forms). | `node --test --test-name-pattern="ORV-138 row 29:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 30 | ORV-96 | Rule `resolve-1` (e): a relative write target whose base is unknown is blocked and an absolute `/tmp` target in the same call shape is allowed, one test per cause: a missing call cwd, `cd`, `cd -`, `cd "$D"`, `cd ~-`, `pushd`, `pushd +1`, `popd`, `env -C /tmp`, `git --work-tree=x restore`. | `node --test --test-name-pattern="ORV-138 row 30:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 31 | ORV-96 | The ovl skill's Honest limits no longer say that a path built by `cd`, expansion or a glob is not seen, or that ORV-96 has not landed; they name the bypass classes of this spec's Honest limits, ORV-96 part. | `grep -n "until ORV-96 lands" .claude/skills/ovl/SKILL.md` prints nothing; `grep -n "expansion or a glob is not seen" .claude/skills/ovl/SKILL.md` prints nothing |
| 32 | ORV-138 | One PR from `chore/ORV-138-guard-batch`, title `ORV-138: ...`; every commit subject names one source key, and the keys first appear in build order: ORV-94, ORV-120, ORV-104, ORV-136, ORV-137, ORV-130, ORV-96. After the survey commit f026a32 (`docs(ORV-96)`, K-0090) the round 0 fix commits follow in this order: ORV-96 for shell-1 and resolve-1, ORV-130 for switch-1 on shell-1, ORV-136 for the RV-5 head check of no-throw-1. | `git log --reverse --format=%s origin/develop..HEAD` |
| 33 | ORV-138 | The merge needs the owner approval line for the PR's head, once for the whole batch (ORV-137 comment 10246); before the owner runs it, the pre-check names `.orivilo/owner-approvals/<n>.json` as missing. | `node scripts/ovl/merge-check.mjs <n> --head <sha>` |
| 34 | ORV-138 | The full gate passes on the head, `pnpm test:scripts` included, and the gate record for the head has `ok: true`. | `pnpm quality-gate`; `pnpm test:scripts` |
| 35 | ORV-138 | No em dash and no middot in any changed text; Prettier clean. | `pnpm format:check`; `git diff -U0 origin/develop...HEAD` read for the two characters |
| 36 | ORV-136 | Rule `no-throw-1` (K-0089 N1), one test per case: (a) an approve with no `.quality-gate/report.json` in the hook's checkout; (b) one whose file is not JSON; (c) one whose JSON lacks the fields; (d) an approve whose `head_sha` is not in the hook's checkout; (e) an approve whose diff holds a `*.stories.tsx` removed at the head. Cases (a) to (d) each run at SubagentStop and at PostToolUse on the Agent call. The `git show` route has no test: once the diff has run, the head holds every changed file that is not removed. | `node --test --test-name-pattern="ORV-138 row 36:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 37 | ORV-136 | The ovl skill section 2 tells the main session to keep at most one open unbound envelope per role, and why (Honest limits, the binding line; K-0089 N3). | `grep -n "open unbound" .claude/skills/ovl/SKILL.md` prints a line between the `## 2.` and `## 3.` headings |
| 38 | ORV-96 | Rule `shell-1` (a): `(git switch x)`, `git status & git switch x`, `if true; then git switch x; fi`, `git status # ; git switch x` and `git \` NL `switch x` (NL a newline) each give a segment whose command words are `git switch x`; a `$( )`, a backquote pair and a `>( )` each give the segments of the list inside them. | `node --test --test-name-pattern="ORV-138 row 38:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 39 | ORV-96 | Rule `shell-1` (b): the RV-1 form of "Write-guard forms to catch" gives the live segments `cd .oriv?lo/owner-approvals` and `printf x > 7.json` and no substitution (Worked examples, shell-1 (b)); `node -e 'process.exit(1 > 0 ? 0 : 1)'` gives no redirect; `"$(printf .oriv)"` opens a substitution; `echo \$(x)` and `echo '$(x)'` open none. | `node --test --test-name-pattern="ORV-138 row 39:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 40 | ORV-96 | Rule `shell-1` (c): the five words of Worked examples, shell-1 (c), give the fixed parts and kinds shown there; `"cd"`, `\cd` and `c""d` each give the fixed part `cd`; `$'\x2eorivilo'` and `$"x"` give kind `any` with an empty fixed part; `~/x` gives the home folder followed by `/x`, kind `none`. | `node --test --test-name-pattern="ORV-138 row 40:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 41 | ORV-96 | Rule `shell-1` (d): one test per prefix (`GIT_TRACE=0`, `env -i -u X`, `env -C d`, `command`, `command -p`, `builtin`, `exec -a n`, `nohup`, `timeout -s KILL 5`, `time -p`, `!`, `then`) before `git switch x` leaves `git` as the command name; `command -v git` has no command; `env -S 'git switch x'` and `$G switch x` have an unknown command; `TEE a` has the command `tee`; `env -C d` and `GIT_DIR=x` are recorded on the segment. | `node --test --test-name-pattern="ORV-138 row 41:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 42 | ORV-96 | Rule `shell-1` (e): the three forms of Worked examples, shell-1 (e), give the sets shown there; one test per form that makes the cwd unknown (a missing call cwd, `cd`, `cd -`, `cd "$D"`, `cd ~-`, `pushd`, `pushd +1`, `popd`); `pushd -n /tmp` moves nothing; `cd -P /tmp` gives `/tmp`; in `cd a && cd b && x`, the segment `x` gets the one folder `<cwd>/a/b`. | `node --test --test-name-pattern="ORV-138 row 42:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 43 | ORV-96 | Rule `shell-1` (f): a body after each quoted delimiter form (`'EOF'`, `"EOF"`, `\EOF`, `E"O"F`) gives no segment and no word, also when it holds `> x`, `rm x` and `$(rm x)`; a body after an unquoted delimiter that holds `$(rm x)` gives the segment `rm x`; `<<-` ends at a tab-indented delimiter line; the sec-F1 target word of "Write-guard forms to catch" is kind `any` with an empty fixed part. | `node --test --test-name-pattern="ORV-138 row 43:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 44 | ORV-96 | Rule `shell-1` (g): `> f`, `>> f`, `>\| f`, `>! f`, `&> f`, `&>> f`, `<> f`, `2> f`, `{fd}> f` and `>& f` each give the write target `f`; `2>&1`, `3>&-`, `< f`, `<<< f` and `<&0` give none; `printf > a x` and `> a printf x` give the write target `a`. | `node --test --test-name-pattern="ORV-138 row 44:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 45 | ORV-96 | Rule `resolve-1` (a): for each of the thirteen write programs (`tee`, `cp`, `mv`, `rm`, `ln`, `touch`, `sed -i`, and `git` `apply`, `restore`, `checkout`, `switch`, `stash`, `reset`), a path argument `.oriv?lo/x` is blocked and `/tmp/x` is allowed; `cp --target-directory=.oriv?lo/exports /tmp/a` is blocked; `grep -n x .oriv?lo/a > /tmp/g.txt` is allowed (its glob word is no write target). Each as the main session and as a subagent. | `node --test --test-name-pattern="ORV-138 row 45:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 46 | ORV-96 | Rule `resolve-1` (b): `printf x > scripts/x/../ovl/a.mjs` (RV-8) and `git -C .claude restore settings.json` are blocked; `env -C /tmp tee a.txt` is blocked and `env -C /tmp tee /tmp/a.txt` is allowed; with a link `<main>/l` to `<main>/.orivilo`, `printf x > l/a` is blocked. Each as the main session and as a subagent. | `node --test --test-name-pattern="ORV-138 row 46:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 47 | ORV-96 | Rule `resolve-1` (c): the three RV-2 forms of "Write-guard forms to catch" and `cd .claude && rm -rf hooks` are blocked as the main session and as a subagent; `printf x > packages/a.ts` from the checkout root is blocked as the main session and allowed as a subagent. | `node --test --test-name-pattern="ORV-138 row 47:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 48 | ORV-96 | Rule `resolve-1` (d), from the main checkout root: the words of Worked examples, shell-1 (c), as redirect targets, the first three blocked and the last two allowed; `rm *.tmp` blocked, and allowed with the cwd at `<main>/docs`; `printf x > logs/$n.txt` with the cwd at `<main>/docs` blocked; `printf x > x*/../.oriv?lo/owner-approvals/7.json` with a folder `<main>/xa` blocked. Each as the main session and as a subagent. | `node --test --test-name-pattern="ORV-138 row 48:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 49 | ORV-96 | Rule `resolve-1` (f): a qa bound to an open envelope that runs `cp /tmp/a.png <its own screenshots folder>/a.png` is allowed; the same qa writing into another task's screenshots folder is blocked; every write-guard test that predates this PR passes unchanged. | `node --test --test-name-pattern="ORV-138 row 49:" scripts/ovl/write-guard.test.mjs` reports at least one passing test; `pnpm test:scripts` |
| 50 | ORV-130 | Rule `switch-1` (a) and (b): each form in "Branch forms to keep" is allowed while an envelope is bound to the main checkout, with the cwd the list names; `git -C <main> -C .claude/worktrees/<wt> switch x` is allowed and `git -C <wt> -C <main> switch x` is blocked. | `node --test --test-name-pattern="ORV-138 row 50:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test |
| 51 | ORV-130 | Rule `switch-1` (c): each form in "Unknown checkout forms" is blocked while any envelope is bound, and its stderr says the checkout is unknown; with no bound envelope each is allowed. | `node --test --test-name-pattern="ORV-138 row 51:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test |
| 52 | ORV-96 | The ovl skill states the v1.2 rules: its Honest limits `write-guard` bullet names `scripts/ovl/shell-words.mjs`, the classes of this spec's Honest limits ORV-96 part (the user's shell among them) and its Cost lines, and no longer says the guard reads a quoted-delimiter `$(cat <<'X'` body as a literal; its "One issue per checkout" bullet names the classes of the ORV-130 part. | `grep -n "shell-words" .claude/skills/ovl/SKILL.md` prints a line; `grep -n "zsh" .claude/skills/ovl/SKILL.md` prints a line in each of the two bullets; `grep -n "reads a quoted-delimiter" .claude/skills/ovl/SKILL.md` prints nothing |

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
  recorder does not throw on any state of the spec (no-throw-1). An approve whose head the checkout
  lacks is no-throw-1's case, not this rule's.
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

  On an approve the head is checked first: when the checkout lacks the head
  (`git cat-file -e <head>^{commit}` fails), the report gets the `git diff` problem above before the
  spec is read, so a qa that only has to fetch is told so (row 36 (d), RV-5).

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
- `shell-1`: `scripts/ovl/shell-words.mjs` is the one reader of Bash text for `write-guard`
  (resolve-1) and `worktree-guard` (switch-1); neither guard splits or unquotes a command another
  way. It reads the forms survey K-0090 classes M and U (its sections 1 to 7), left to right, with
  the quoting of each word kept: nothing is unquoted before the split. It gives:
  - (a) Segments. A segment ends at each control operator outside quotes (`;`, `&`, `&&`, `||`, `|`,
    `|&`, `;;`, `;&`, `;;&`, `(`, `)` and a newline; K-0090 section 1) and records the operator that
    ends it. A `$( )`, a backquote pair, `<( )` and `>( )`, opened outside single quotes and backslash
    escapes, hold a list whose commands are segments too. A backslash before a newline joins the two
    lines. `#` starts no comment: the text after it is read as live, as zsh reads it unless
    `interactive_comments` is set (K-0090, "What the sources read do not say").
  - (b) Quoting. Single quotes, double quotes, `$'...'`, `$"..."` and backslash escapes stay part of
    the word they are in. `$`, `${`, `$(`, `$((` and a backquote open an expansion outside single
    quotes and backslash escapes, inside double quotes too; `?`, `*`, `[` and a brace `{` open one
    only outside every quote; `~` opens one at the start of a word, except `~` alone and `~/`. A
    `$'...'` that holds a backslash escape, and any `$"..."`, count as an expansion (shell-1 does not
    decode them). A `;`, `&`, `|`, `<`, `>`, `(` or `)` inside quotes is a plain character.
  - (c) Fixed part and kind. Each word gives its fixed part, the text before its first expansion with
    quotes and escaping backslashes removed (`"cd"`, `\cd` and `c""d` each give `cd`; `~` and `~/`
    give the home folder of the hook process), and its kind: `none` with no expansion; `glob` when
    every expansion in it is `?`, `*` or `[`, each of which matches inside one name; `any` otherwise
    (a `$`, backquote, brace or tilde expansion, whose value may hold `/` and `..`). Each word also
    carries its path components, split at each `/`: per component, its fixed part (the text of the
    component before its first expansion) and a glob flag (the component holds an expansion).
    resolve-1 (d) collapses `..` against these components, a component with the flag counting as one
    name (`x*/../.oriv?lo` leaves `.oriv?lo`).
  - (d) Command position. In each segment these words before the command name are skipped:
    assignments (`NAME=value`); reserved words (`if`, `then`, `elif`, `else`, `fi`, `while`, `until`,
    `do`, `done`, `for`, `select`, `case`, `esac`, `coproc`, `function`, `{`, `}`, `[[`, `]]`, `!`,
    and `time` with `-p`); `env` with its options (`-i`, `-0`, `-v`, `-`, `--`, `-u NAME`, `-a ARG`,
    `-C DIR`, and their `--name=value` forms) and its `NAME=VALUE` words; `command` with `-p`;
    `builtin`; `exec` with `-c`, `-l` and `-a NAME`; `nohup`; and `timeout` with its options and
    DURATION. A redirect anywhere in the segment is no command word (K-0090 section 3). The first word
    left is the command name, read as the base name of its fixed part (the text after its last `/`),
    lowercased: `/usr/bin/tee`, `./TEE` and `TEE` each read as `tee` (a case-insensitive file system
    finds `TEE` as `tee`). The prefix programs `env`, `command`, `builtin`, `exec`, `nohup` and
    `timeout` are found the same way (`/usr/bin/env git switch x` has the command `git`). A command
    name with an expansion is unknown. `command -v` and `command -V` run no command; `env -S` and
    `--split-string` make the command unknown. The segment records its `env -C` folder and each
    `GIT_DIR` or `GIT_WORK_TREE` assignment, as a prefix or an `env` word.
  - (e) Effective cwd. The call starts in the hook input's `cwd`, unknown when it is missing or no
    existing folder. A `cd`, `pushd` or `popd` at command position moves it: options `-L`, `-P`, `-e`,
    `-@` and `--` are skipped; `pushd -n` moves nothing; a literal target resolves against each folder
    of its own segment's effective cwd (an absolute target as it is, `~` and `~/` from the home folder,
    `.` and `..` collapsed). The cwd becomes unknown after a `cd` with no target, `cd -`, a target with
    an expansion (other than `~` and `~/`), `pushd` with no folder or with `+N` or `-N`, and `popd`.
    A `cd` can fail or be skipped, so the effective cwd of a segment is a set of folders. A segment
    gets only the folder after the latest `cd` before it in its and-or list (the segments joined by
    `&&` and `||` within one group) when every operator from the start of that list up to the segment
    is `&&`. Every other segment gets every folder the call may be in by then: its start folder and
    each `cd` result so far. An unknown member makes the set unknown. CDPATH and the directory stack
    are not read (Honest limits).
  - (f) Here-documents. After `<<` or `<<-` and its delimiter word, the body is the lines after the
    current line up to the first line that is exactly the delimiter (leading tabs removed for `<<-`),
    or to the end of the text. When any part of the delimiter word is quoted (`'EOF'`, `"EOF"`,
    `\EOF`, `E"O"F`), the body is a literal: no segment, word or expansion comes from it. Otherwise it
    is read as in double quotes: only its `$`, `$(` and backquote expansions count, and a substitution
    in it holds segments (K-0090 section 3). This holds wherever the here-document opens, inside a
    substitution or not, and the substitution around it stays an expansion of its word
    (`"$(cat <<'EOF'` ... `)"` is kind `any`). This clause replaces v1.1's heredoc-1.
  - (g) Redirects. A redirect operator outside quotes, with an optional number or `{name}` before it,
    gives a write target, its next word, when the operator is `>`, `>>`, `>|`, `>!` (zsh, read as
    `>|`), `&>`, `&>>`, `<>`, or `>&` whose word is not digits or `-`. `<`, `<<`, `<<-`, `<<<`, `<&`,
    and `>&` with digits or `-` give none.

- `switch-1`: `worktree-guard` blocks a main-session Bash call (no `agent_id`) when an envelope is open
  and bound (`agent.json`, no `result.json`, no `closed.json`) and a segment of the call, as shell-1
  reads it, is a branch switch form whose checkout is that envelope's `worktree` (through realpath)
  or is unknown. The stderr names the bound task ids, and says so when the checkout is unknown. When
  the records cannot be read, a switch form is blocked; every other call keeps today's verdict. A
  subagent's call is not judged by switch-1.
  - (a) A segment is a switch form when, after its prefixes (shell-1 (d)), its command name is `git`
    and the first word after git's global options is `switch` or `checkout` (lowercased), or its first
    three words are `gh pr checkout`. Git's global options are the words before the subcommand that
    start with `-`; `-C`, `-c`, and a `--git-dir` or `--work-tree` with no `=`, take the next word as
    their value (git(1), K-0090 section 7). So in `git -C <worktree> add checkout` the subcommand is
    `add`.
  - (b) The checkout is the git top of the folder git runs in: each folder of the segment's effective
    cwd (shell-1 (e)), with each `-C <path>` applied in order, a relative path against the folder
    before it, and `-C ""` changing nothing (git(1)). `gh pr checkout` runs in the effective cwd.
  - (c) The checkout is unknown when the effective cwd is unknown; when the segment has `env -C`,
    `--git-dir`, `--work-tree`, or a `GIT_DIR` or `GIT_WORK_TREE` assignment (shell-1 (d)); when a
    `-C` value has an expansion; or when the git top of a folder cannot be read. A switch form whose
    git top cannot be read is blocked with or without a bound envelope, as a read failure like the
    records (the read-failure case of row 25, asserted since v1.0); its stderr says the records or the
    checkout cannot be read and the checkout is unknown. Every other unknown checkout is blocked only
    while an envelope is bound (open question 13).

- `resolve-1`: `write-guard` judges a Bash call, from the main session or a subagent, by its write
  targets as shell-1 reads them, against the protected sets of the session (all three for the main
  session; guard file and record for a subagent, as today). It takes the place of v1.1's expand-1 in
  `judgeBash` (`scripts/ovl/write-guard.mjs` line 639 on 38a7f73). A call with a blocked target is
  blocked.
  - (a) Write targets: each redirect write target (shell-1 (g)), and the path arguments of a write
    program at command position (shell-1 (d)): `tee`, `cp`, `mv`, `rm`, `ln`, `touch`, `sed` with
    `-i` (alone, in a group such as `-ni`, with a suffix, or `--in-place`), and `git` whose subcommand,
    after its global options as switch-1 (a) reads them, is `apply`, `restore`, `checkout`, `switch`,
    `stash` or `reset` (the programs of `WRITE_FORMS`, lines 200 to 205). Its path arguments are every
    later word that is not an option (a word whose fixed part begins with `-`), every word after a
    literal `--`, and the value after `=` of an option word whose `=` stands in the fixed part of its
    first path component (`--target-directory=<folder>`). No other word of the call is judged; the
    option words this leaves out are a named class in Honest limits, ORV-96 part.
  - (b) Base. A redirect target resolves against each folder of its segment's effective cwd (shell-1
    (e)). A path argument resolves the same way, with git's `-C` folders applied as switch-1 (b)
    applies them; under `env -C`, `--git-dir`, `--work-tree`, or a `GIT_DIR` or `GIT_WORK_TREE`
    assignment its base is unknown. Resolving collapses `.` and `..` (`scripts/x/../ovl/a.mjs` is
    `scripts/ovl/a.mjs`), on the text and again through realpath of the nearest existing folder, as
    `judgeToolWrite` does (lines 182 to 195); either result counts. Realpath gets the path with its
    `..` already collapsed, so both readings take a `..` after a link by the text (Honest limits,
    ORV-96 part, the link line).
  - (c) A target of kind `none` is blocked when it lies inside a protected set: the path is in the set,
    or is the set's own folder (`.claude/hooks`, `.orivilo`).
  - (d) A target with an expansion is blocked when its fixed part could begin a protected path. For
    kind `glob`, after `.` and `..` are collapsed with a glob name counting as one name, it could when
    a protected path or a checkout of this project (the main checkout or one under
    `.claude/worktrees/`) begins with the resolved fixed part, or the resolved fixed part lies inside
    a protected set. A glob target whose resolved fixed part begins no protected path and no checkout
    and lies inside no protected set is allowed, so `printf x > foo*` from a checkout root is allowed
    (Worked examples, resolve-1 (d) glob). For kind `any`, it could when the fixed part is empty, or
    when the folder it names (the resolved fixed part up to its last `/`) lies inside a checkout of
    this project or above one.
  - (e) A relative target whose base is unknown is blocked (fail closed). An absolute target needs no
    base.
  - (f) Unchanged: the main session's literal-name rule (`named`, lines 67 to 76, and its exceptions,
    lines 651 to 656), the subagent rule of ORV-93 (a literal protected name and a write form by its
    text test, lines 642 to 649), the qa and designer screenshot exception (lines 644 to 646 and
    `isOwnScreenshotWrite`, lines 372 to 381), which allows a subagent call before resolve-1 is read,
    and the close rules (lines 632 to 634). Line numbers are on 38a7f73. A subagent call that names a
    protected path and holds no write form by the ORV-93 text test (`/usr/bin/tee .orivilo/x`) goes
    on to resolve-1 after the screenshot exception and the text rule. So for a subagent call resolve-1
    may block more than the text rule, never less.

### Branch switch forms (switch-1, L-0012)

The forms a rule-following main session uses to change branch: `git switch <branch>`,
`git switch -c <branch>`, `git checkout <branch>`, `git checkout -b <branch>`,
`git -C <path> switch <branch>`, `gh pr checkout <n>`. Each is caught while an envelope is bound to
that checkout. These forms, probed by the reviews or made by shell-1 (e), are caught too, each with
an envelope bound to `<bound>`:

- `cd <bound> && git switch x`, from a cwd in an unbound worktree (RV-4, sec-F2)
- `(git switch x)`, `git status & git switch x`, `if true; then git switch x; fi` (RV-7, sec-F2)
- `git --no-pager checkout x` (RV-7, sec-F2)
- `env git switch x`, `command git switch x`, `GIT_TRACE=0 git switch x` (sec-F2)
- `true || cd <unbound> && git switch x` and `false && cd <unbound>; git switch x`, from a cwd in
  `<bound>` (shell-1 (e))

### Branch forms to keep (switch-1, L-0012)

With an envelope bound to the main checkout, these stay allowed, besides the forms of row 25:

- `cd <unbound worktree> && git switch x`, from a cwd in the main checkout (RV-4)
- `git -C <unbound worktree> switch x`, from a cwd in the main checkout
- `git -C <worktree> add checkout` (RV-7: its subcommand is `add`)

### Unknown checkout forms (switch-1 (c))

Each from a cwd in an unbound worktree, while an envelope is bound to the main checkout:

- `cd - && git switch x`
- `cd "$W" && git switch x`, and `git -C "$W" switch x`
- `git --git-dir=<wt>/.git switch x`, and `git --work-tree <wt> checkout x`
- `GIT_DIR=<wt>/.git git switch x`
- `env -C <wt> git switch x`

### Write-guard forms to catch (resolve-1, L-0012)

The owner lines in the ovl skill section 6 (the `mkdir -p .orivilo/owner-approvals && printf ...`
line and the `owner-waivers` line) stay blocked inside Claude Code, as today. These forms are added,
each a test as a main-session call and as a subagent call (NL marks a newline):

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
- RV-1, the F5 form wrapped in single quotes:
  `echo '$(cat <<"EOF"` NL `' ; cd .oriv?lo/owner-approvals && printf x > 7.json ; echo '` NL `EOF`
  NL `)'`
- RV-2, a cwd left by an earlier call: `printf x > settings.json` with the cwd at `<main>/.claude`;
  `tee ovl/a.mjs` with the cwd at `<main>/scripts`; `printf x > workflows/ci.yml` with the cwd at
  `<main>/.github`
- RV-6: `"cd" scripts && tee ovl/a.mjs`; `\cd scripts && tee ovl/a.mjs`;
  `builtin cd scripts && tee ovl/a.mjs`; `command cd .claude && printf x > settings.json`
- RV-8: `printf x > scripts/x/../ovl/a.mjs`
- sec-F1, a here-document as a path part:
  `printf x > "$(cat <<"EOF"` NL `.oriv` NL `EOF` NL `)ilo/owner-approvals/7.json"`
- shell-1 (a), (b), (e) and resolve-1 (a), (c): `git status # ; printf x > .oriv?lo/owner-approvals/7.json`;
  `printf x > $'\x2eorivilo/owner-approvals/7.json'`;
  `printf x > >(cat > .oriv?lo/owner-approvals/7.json)`; `false && cd /tmp; printf x > settings.json`
  with the cwd at `<main>/.claude`; `cp --target-directory=.oriv?lo/exports /tmp/x`;
  `cd .claude && rm -rf hooks`

### Write-guard forms to keep (resolve-1, L-0012)

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

These forms, which the reviews found blocked under v1.1 (RV-3, sec-F4), stay allowed as the main
session and as a subagent, from the main checkout root; `<scratchpad>` is a folder outside every
checkout:

- `cat > <scratchpad>/x.json <<'EOF'` NL `{"a": 1}` NL `EOF` (RV-3)
- `printf a > /tmp/y.txt; echo "exit=$?"` (RV-3)
- `for n in 1 2; do printf x > /tmp/orv-$n.txt; done` (RV-3, a for loop with a redirect)
- `grep -n x "$HOME/.zshrc" > /tmp/g.txt` (RV-3, a `$HOME` word in a read)
- `pnpm test > /tmp/t.log 2>&1; echo "exit=$?"` (sec-F4)
- `echo "$(git rev-parse HEAD)"; node -e 'process.exit(1 > 0 ? 0 : 1)'` (sec-F4, a `>` inside a
  quoted program after a `$(`)

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

Run from the repo root. Each command prints exactly the output shown; every output is exact, with no
rounding. The v1.2 and v1.3 examples were written with no shell and are not run yet.

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

- shell-1 (b), input the RV-1 form copied from "Write-guard forms to catch": the characters that
  stay live outside single quotes, from `;`, `>` and `$(`. The scan tracks single quotes only, which
  is all this input needs. Expected output: `; > ;` (two separators and a redirect, no
  substitution), so the `cd` and `printf` segments run and resolve-1 judges them.

  ```bash
  node -e 'const c="echo \x27$(cat <<\"EOF\"\n\x27 ; cd .oriv?lo/owner-approvals && printf x > 7.json ; echo \x27\nEOF\n)\x27";let q=false;const live=[];for(let i=0;i<c.length;i++){if(c[i]==="\x27")q=!q;else if(!q&&c[i]==="$"&&c[i+1]==="(")live.push("$(");else if(!q&&";>".includes(c[i]))live.push(c[i])}console.log(live.join(" "))'
  ```

- shell-1 (c) with resolve-1 (d), input five write target words copied from "Write-guard forms to
  catch" and "Write-guard forms to keep": each word's fixed part and kind. Expected output, five
  lines: `".oriv" glob`, `".or" any`, `"" any`, `"/tmp/orv-" any`, `"/tmp/orv-" glob`. From the main
  checkout root, `<main>/.orivilo/` begins with `<main>/.oriv` (blocked); the folder of `.or` is the
  checkout root (blocked); an empty `any` fixed part is blocked; the folder `/tmp` of `/tmp/orv-` is
  neither in nor above a checkout, and no protected path begins with `/tmp/orv-` (both allowed).

  ```bash
  node -e 'for(const w of [".oriv[i]lo/owner-approvals/7.json",".or{i,}vilo/owner-approvals/7.json","${D}ilo/owner-approvals/7.json","/tmp/orv-$n.txt","/tmp/orv-*"]){const i=w.search(/[?*[{$`]/);console.log(JSON.stringify(w.slice(0,i)),/[?*[]/.test(w[i])?"glob":"any")}'
  ```

- shell-1 (d) base name (v1.3), input `/usr/bin/tee` from the comment at `scripts/ovl/shell-words.mjs`
  line 538, `./TEE` and `TEE` from row 41 and the ORV-138-build-resolve report, and `/usr/bin/env`,
  each read by the expression copied from line 540. Expected output, four lines: `tee`, `tee`,
  `tee`, `env`.

  ```bash
  node -e 'for(const f of ["/usr/bin/tee","./TEE","TEE","/usr/bin/env"])console.log(f.slice(f.lastIndexOf("/")+1).toLowerCase())'
  ```

- shell-1 (c) path components with resolve-1 (d) (v1.3), input the row 48 target
  `x*/../.oriv?lo/owner-approvals/7.json` from the main checkout root: the components with their
  fixed parts and glob flags, `..` collapsed with a glob name counting as one name, and the names up
  to the first glob name, as `globHits` in `scripts/ovl/write-guard.mjs` lines 425 to 445 keeps them
  (the checkout root base is left out). Expected output: `.oriv`, which `<main>/.orivilo/` begins
  with (blocked).

  ```bash
  node -e 'const s=[];for(const c of "x*/../.oriv?lo/owner-approvals/7.json".split("/")){const i=c.search(/[?*[]/);const p={fixed:i<0?c:c.slice(0,i),glob:i>=0};if(p.glob||(p.fixed!==""&&p.fixed!=="."&&p.fixed!==".."))s.push(p);else if(p.fixed==="..")s.pop()}const at=s.findIndex(p=>p.glob);console.log(s.slice(0,at+1).map(p=>p.fixed).join("/"))'
  ```

- resolve-1 (d) glob (v1.3), input the fixed parts of `foo*`, `*.tmp` and `.oriv[i]lo` relative to
  the main checkout root, the checkout prefixes (the root itself and `.claude/worktrees/`), and the
  name prefixes of the three sets copied from `TEXT_PREFIXES` in `scripts/ovl/write-guard.mjs` lines
  29 to 40: does a checkout or a protected path begin with the fixed part. The one-liner leaves out
  the inside-a-set test, which none of the three meets. Expected output, three lines: `"foo" false`
  (allowed), `"" true` (blocked), `".oriv" true` (blocked).

  ```bash
  node -e 'const pre=["",".claude/worktrees/","packages","apps",".claude/hooks",".claude/settings","scripts/ovl","scripts/quality-gate.mjs",".github/workflows",".gitignore",".orivilo",".quality-gate"];for(const f of ["foo","",".oriv"])console.log(JSON.stringify(f),pre.some(q=>q.startsWith(f)))'
  ```

- shell-1 (e), input three forms copied from "Branch forms to keep" and "Branch switch forms", with
  `/m` for the bound main checkout and `/w` for an unbound worktree: the effective cwd set of the
  `git switch x` segment. The one-liner models only `&&`, `||` and `;` with literal `cd` targets.
  Expected output, three lines: `/w` (allowed), `/m /w` (blocked), `/m /w` (blocked).

  ```bash
  node -e 'for(const c of ["cd /w && git switch x","true || cd /w && git switch x","false && cd /w; git switch x"]){const t=c.split(/ ?(&&|\|\||;) /);let all=["/m"],exact=all,andOnly=true;for(let i=0;i<t.length;i+=2){const w=t[i].split(" ");if(w[0]==="cd"){exact=[w[1]];all=[...all,w[1]]}if(w[0]==="git")console.log((andOnly?exact:all).join(" "));const op=t[i+1];if(op==="||")andOnly=false;if(op===";"){andOnly=true;exact=all}}}'
  ```

- resolve-1 (b) and (c), input the RV-8 target and the three RV-2 cwd and target pairs from "Write-guard
  forms to catch", resolved under a checkout `/m`, and the `GUARD_PATH` pattern copied from
  `scripts/ovl/write-guard.mjs` line 41. Expected output, four lines: `scripts/ovl/a.mjs true`,
  `.claude/settings.json true`, `scripts/ovl/a.mjs true`, `.github/workflows/ci.yml true`.

  ```bash
  node -e 'const p=require("path");const g=/^(?:\.claude\/hooks\/|\.claude\/settings[^/]*\.json$|scripts\/ovl\/|scripts\/quality-gate\.mjs$|\.github\/workflows\/|\.gitignore$)/;for(const [cwd,t] of [["","scripts/x/../ovl/a.mjs"],[".claude","settings.json"],["scripts","ovl/a.mjs"],[".github","workflows/ci.yml"]]){const r=p.relative("/m",p.resolve("/m",cwd,t));console.log(r,g.test(r))}'
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
- A full shell parser: shell-1 reads the forms K-0090 classes M and U; the B and S classes are Honest
  limits.
- The subagent rule of ORV-93 and the main session's literal-name rule (resolve-1 (f)).

## Honest limits

ORV-96, `write-guard` resolve-1 on shell-1 (a guard rail; each class is named once, and a bypass of a
named class is not a new finding, L-0012). The classes K-0090 marks B (section 8), the state it marks
S, and the shell:

- The shell. Claude Code runs a Bash call in the user's shell, zsh on the owner's machine, with the
  profile's aliases and functions. shell-1 reads the forms bash and zsh share; K-0090 read the bash
  manual only. A zsh-only form is a named bypass: `=name` expansion, glob qualifiers (`*(.)`),
  `KSH_GLOB` and extglob patterns with `(`, `${~X}` and the other expansion flags, and a profile
  option that changes how a word expands.
- `eval`, and `sh -c`, `bash -c`, `zsh -c` and every other interpreter with a program in a word
  (`node -e`, `python3 -c`, `perl -e`); `source` or `.` of a file; a script the session wrote and then
  runs (`node /tmp/x.mjs`); an encoded command piped to a shell (`echo <base64> | base64 -d | sh`).
- `xargs` and `find -exec`: the program takes its arguments from input
  (`printf '\x2eorivilo/owner-approvals/7.json' | xargs touch`).
- A variable, substitution, alias or function that holds a command: an unknown command name
  (`$W x`, `$(printf tee) x`), an alias from the profile or an earlier call, a function defined
  earlier, `env -S`, a git alias (`git rs x` for `git restore x`), and `git --exec-path=<path>`.
- A link into a protected folder made by one of the routes above, then written through by a plain
  path; a fixed part under a folder outside every checkout (`/tmp/x*`), even when a link there leads
  into a checkout; and a `..` after a link, which the system resolves through the link and resolve-1
  by the text in both readings of resolve-1 (b), since realpath already gets the path with its `..`
  collapsed.
- An option word, which resolve-1 (a) does not judge as a path: a word that begins with `-` and holds
  an expansion (`rm -rf -$X`, `--x$Y=.orivilo/x`, whose `=` comes after the expansion), and a short
  option with its value attached (`cp -t<dir>`, as in `cp -t.oriv?lo/exports /tmp/x`). `rm -- -$X`
  is not in this class (resolve-1 (a), the `--` word).
- The value of a kind `any` expansion that climbs out of a folder outside every checkout with `..`
  (`/tmp/$V`, with V holding `/../` and then a checkout path).
- State from before the call: CDPATH (a relative `cd` target is resolved against the folder only),
  and an exported `GIT_DIR` or `GIT_WORK_TREE` for a git write program.
- A write program outside the write-form list: `dd of=`, `install`, `rsync`, `tar -x`, `unzip -d`,
  `curl -o`, `wget -O`, `git clone`, `mkdir`; and the `nohup.out` that `nohup` writes.
- A literal write target that holds a protected set without lying inside one (`rm -r scripts`, or
  `git checkout -- .` in a checkout root; open question 10). The reviewer checks what is committed.
- A session without these hooks escapes them, and a builder whose `write_set` lists
  `scripts/ovl/write-guard.mjs` or `scripts/ovl/shell-words.mjs` can weaken it for its own worktree
  until the merge, which needs the owner approval line.
- Cost: a write form with an unquoted glob in a checkout root (`rm *.tmp`) is blocked; use a literal
  path.
- Cost: under resolve-1 (d), `printf x > "$f"` and `tee "$OUT"` are blocked from every cwd, and
  `printf x > logs/$n.txt` inside a checkout is blocked; write under a literal folder outside every
  checkout (`/tmp/orv-$n.txt`), or use the Write tool.
- Cost: under resolve-1 (e), a relative write target after `cd -`, a bare `cd`, `popd` or a `cd` to
  an expansion is blocked; under shell-1 (e), a target after a `cd` that may be skipped (after `;`,
  `||`, `&`, or across a group) is judged against both folders.
- Cost: the subagent rule of ORV-93 is unchanged, so a subagent call that names a protected path in
  any word and holds a write form by its text test is still blocked, a `>` inside a quoted program
  after a `$(` included (sec-F4).

ORV-130, `worktree-guard` switch-1 on shell-1 and `envelope-guard` branch-key-1:

- The classes K-0090 marks B hide a switch as they hide a write: `eval "git sw""itch x"`,
  `sh -c 'git switch x'` and every other interpreter, a script, `xargs`, a variable, alias or
  function that holds `git` or the switch (`$G switch x`, an alias `gs` from the profile),
  `env -S 'git switch x'`, a git alias (`git co x`), and `git --exec-path=<path>`.
- The shell line of the ORV-96 part holds here: Claude Code runs the call in the user's shell, zsh on
  the owner's machine, with the profile's aliases and functions; shell-1 reads the forms bash and zsh
  share, and a zsh-only form is a named bypass.
- State from before the call: an exported `GIT_DIR` or `GIT_WORK_TREE`, `core.worktree` set in a git
  config file or by `-c core.worktree=<path>`, and CDPATH.
- A subagent's switch is not judged.
- A stuck bound envelope blocks every switch in its checkout until it is closed; the stall check (ovl
  skill section 2) raises it first.
- Cost: while any envelope is bound, switch-1 (c) blocks a switch whose checkout is unknown
  (`cd - && git switch x`); name the checkout with a literal `git -C <path>`. A switch after
  `cd <path>;` is judged against both folders (shell-1 (e)); join the two with `&&`.

ORV-136 and ORV-120, the recorder:

- Nothing checks that the `## Rows per PR` lines of a spec together cover every row; the reviewer
  does.
- A spec can list a row that renders something under `## Rows that render nothing`; only the reviewer
  catches it.
- The column line (sec-F3): qa-scope-2 reads only a `User sees` column, and 42 of the 59 spec
  acceptance tables in `docs/specs` on 38a7f73 have none (their fourth header is `Result` in 32,
  `Then` in 8 and `Check` in 1, and 1 has no fourth column; ORV-138-security-1). So the reviewer
  checks the visual rows of an older `Result` or `Then` spec.
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
5. The here-document clause, shell-1 (f) (v1.1's heredoc-1). Options: a quoted-delimiter body is a
   literal wherever a here-document opens, and the substitution around it stays an expansion
   (default, v1.2); or v1.1's exemption of `$(cat <<'X'` alone, read as one plain letter. Impact: the
   v1.1 form hid the F5 form inside single quotes (RV-1) and let a here-document build a path part
   (sec-F1).
6. The resolve-1 write programs. Options: today's list (default), or every command. Impact: every
   command would judge the words of reads such as `ls *` in a checkout root; the other write programs
   are an Honest limit.
7. The home of switch-1. Options: `worktree-guard`, which already runs on every Bash call (default),
   or a new hook with a settings entry.
8. The spec the recorder reads. Options: at the report's head (default, spec-at-head-1), or the
   working tree as today. Impact: the declaration the reviewer read is the one the recorder uses.
9. A changed stories file removed at the head (no-throw-1). Options: skip it, as `merge-check` does
   (default); or refuse with the `git show` problem. Impact: refusing would send back an honest walk
   of a PR that deletes a story, and the merge would not need its screenshots anyway.
10. A literal write target that holds a protected set (resolve-1 (c)). Options: not blocked (default;
    Honest limits), or blocked when the program writes a whole folder (`rm -r`, `git checkout --`,
    `git restore`). Impact: the second blocks `git checkout -- .` and `git restore .` in a checkout
    root; v1.1 did not block them either.
11. `#` in shell-1 (a). Options: no comment, the text after it read as live (default, fail closed under
    zsh), or a comment as bash reads it. Impact: a call whose text after `#` holds a write form or a
    switch form is judged on it.
12. The effective cwd of shell-1 (e). Options: a set of folders (default), or one folder that each `cd`
    replaces. Impact: one folder lets `false && cd /tmp; printf x > settings.json` from a cwd at
    `<main>/.claude` write the hook wiring, and `true || cd <unbound> && git switch x` switch a bound
    checkout; the set judges a target after a `cd` that may be skipped against both folders.
13. An unknown checkout with no bound envelope (switch-1), other than a git top that cannot be read
    (switch-1 (c)). Options: allowed (default), or blocked.
    Impact: blocking would stop `cd - && git switch x` in a session with nothing bound.

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
- K-0090 (`docs/knowledge/enforcement/K-0090-bash-forms-for-text-guards.md`, commit f026a32): the
  survey of the Bash forms a text guard reads, with classes M, U, S and B, that bounds shell-1,
  switch-1 and resolve-1 (L-0045).
- The round 0 findings on head 38a7f73, recorded 2026-10-28 in the git-ignored run records
  `.orivilo/runs/ORV-138/ORV-138-review-1/result.json` (RV-1 to RV-8) and
  `.orivilo/runs/ORV-138/ORV-138-security-1/result.json` (ORV-138-sec-F1 to sec-F4).
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
- v1.2: answers the round 0 findings of ORV-138-review-1 and ORV-138-security-1 on 38a7f73, decided
  by the orchestrator under the owner's delegation (ADR 0012 decision 4) on survey K-0090, one bound
  per class. New rule shell-1 (`scripts/ovl/shell-words.mjs`, clauses (a) to (g)) folds in v1.1's
  heredoc-1; resolve-1 replaces expand-1; switch-1 reads shell-1. Rows 27, 29, 30 and 32 name the
  new rules and commits; rows 38 to 52 are new; "Branch switch forms" and both write-guard form lists
  grow, and "Branch forms to keep" and "Unknown checkout forms" are new; four worked examples replace
  the expand-1 one; Honest limits name the K-0090 B classes and the user's shell in the ORV-96 and
  ORV-130 parts, and the column line in the recorder part; open questions 5 and 6 change and 10 to 13
  are new. Per finding:
  - RV-1: contract change, shell-1 (b) and (f).
  - RV-2: contract change, resolve-1 (b) and (c) on shell-1 (e).
  - RV-3: contract change, resolve-1 (a).
  - RV-4: contract change, switch-1 (b) on shell-1 (e).
  - RV-5: no contract change; no-throw-1 now says that the head check comes before the spec read,
    which row 36 (d) already required, and qa-spec-1 points to it.
  - RV-6: contract change, shell-1 (c) and (d).
  - RV-7: contract change, shell-1 (a) and switch-1 (a).
  - RV-8: contract change, resolve-1 (b).
  - sec-F1: contract change, shell-1 (f) with resolve-1 (d).
  - sec-F2: repeats RV-4 and RV-7.
  - sec-F3: no contract change; Honest limits, the column line.
  - sec-F4: repeats RV-3; the `>` in a quoted program is shell-1 (b), and the ORV-93 subagent text
    test that keeps it is a Cost line.

  Review downstream: `scripts/ovl/shell-words.mjs` and `scripts/ovl/shell-words.test.mjs` (new, rows
  38 to 44); `scripts/ovl/write-guard.mjs` (`withoutHeredocs`, `shellWords`, `hidesProtectedPath`
  and their expand-1 and heredoc-1 comments) and `scripts/ovl/write-guard.test.mjs` (rows 27 to 30,
  45 to 49); `scripts/ovl/worktree-guard.mjs` (`switchForms`) and its test (rows 24, 25, 50, 51);
  `scripts/ovl/result-recorder.mjs` and the row 36 (d) test (RV-5); `.claude/skills/ovl/SKILL.md`
  lines 269 to 275 and 445 (row 52); `docs/knowledge/enforcement/K-0090-bash-forms-for-text-guards.md`
  line 299, which names expand-1; the PR body's deviation list; and the G1 comment on ORV-138.

- v1.3: bookkeeping (L-0040), no new requirement and no new row: the spec states what the round 1
  builders built, decided by the orchestrator under the owner's delegation (ADR 0012 decision 4).
  - shell-1 (d): the command name is the lowercased base name of its fixed part (`/usr/bin/tee` and
    `./TEE` read as `tee`), the orchestrator decision on ORV-138-build-shell needs_decision 1, built
    in ORV-138-build-resolve (deviation 1). shell-1 (c): each word carries its path components with
    their fixed part and glob flag, which resolve-1 (d) uses to collapse `..` against a glob name
    (ORV-138-build-resolve deviation 2).
  - Honest limits, ORV-96 part: the option word class (`rm -rf -$X`, `--x$Y=...`, `cp -t<dir>`),
    with resolve-1 (a) saying which option words it judges (ORV-138-build-resolve needs_decision 2);
    the link line and resolve-1 (b) say realpath gets `..` already collapsed, so a `..` after a link
    keeps its named bypass (ORV-138-build-resolve needs_decision 1).
  - switch-1 (c): a switch form whose git top cannot be read is blocked with or without a bound
    envelope, as row 25 has asserted since v1.0 (ORV-138-build-switch deviation 2); open question 13
    points to it.
  - resolve-1 (d): a glob target at a checkout root whose fixed part begins no protected path and no
    checkout (`printf x > foo*`) is allowed (ORV-138-build-resolve deviation 6).
  - resolve-1 (f): a subagent call that names a protected path with no write form in its text goes to
    resolve-1 after the screenshot exception and the text rule; resolve-1 may block more, never less
    (ORV-138-build-resolve deviation 7).
  - Worked examples: three new ones, the base name, the path components and the resolve-1 (d) glob.

  Review downstream: `.claude/skills/ovl/SKILL.md` line 459 (the `write-guard` Honest limits bullet,
  which does not yet name the option word class); the PR body's deviation list; and the G1 comment on
  ORV-138. The code and tests already match (commits up to 80cc36b).
