---
issue: ORV-138 (https://tpetkaew.atlassian.net/browse/ORV-138)
lane: L (guard files; ORV-138 description)
version: 1.8
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

The round 0 review and security findings (v1.2) and the round 1 re-check findings (v1.4) add commits
after these seven; row 32 gives their keys and order.

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
| 25 | ORV-130 | While an envelope is bound, `git worktree add`, `git status`, `git branch -a`, `git log` and a `git commit -m` whose message holds the word switch stay allowed; the read-failure case of switch-1 (c); and, in a test of its own (v1.5), the gone-cwd case of switch-1 (c). | `node --test --test-name-pattern="ORV-138 row 25:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test; `node --test --test-name-pattern="ORV-138 row 25: a call cwd that is gone" scripts/ovl/worktree-guard.test.mjs` reports 1 passing test |
| 26 | ORV-130 | The ovl skill's "Issue" bullet names no unchecked role but release, and its "One issue per checkout" bullet says `worktree-guard` blocks the switch. | `grep -n "Not enforced yet" .claude/skills/ovl/SKILL.md` prints nothing; `grep -n "worktree-guard" .claude/skills/ovl/SKILL.md` |
| 27 | ORV-96 | Rule `resolve-1`: the review F5 form `cd .oriv?lo/owner-approvals && printf '{"by":"owner"}' > 7.json` is blocked for the main session and for a subagent, and so is the same form into `owner-waivers`. | `node --test --test-name-pattern="ORV-138 row 27:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 28 | ORV-96 | Every form in "Write-guard forms to catch" is blocked, each as a main-session call and as a subagent call. | `node --test --test-name-pattern="ORV-138 row 28:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 29 | ORV-96 | Every form in "Write-guard forms to keep" is allowed in the session the list names (rule `shell-1` (f) for the commit and PR body forms). | `node --test --test-name-pattern="ORV-138 row 29:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 30 | ORV-96 | Rule `resolve-1` (e): a relative write target whose base is unknown is blocked and an absolute `/tmp` target in the same call shape is allowed, one test per cause: a missing call cwd, `cd`, `cd -`, `cd "$D"`, `cd ~-`, `pushd`, `pushd +1`, `popd`, `env -C /tmp`, `git --work-tree=x restore`. | `node --test --test-name-pattern="ORV-138 row 30:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 31 | ORV-96 | The ovl skill's Honest limits no longer say that a path built by `cd`, expansion or a glob is not seen, or that ORV-96 has not landed; they name the bypass classes of this spec's Honest limits, ORV-96 part. | `grep -n "until ORV-96 lands" .claude/skills/ovl/SKILL.md` prints nothing; `grep -n "expansion or a glob is not seen" .claude/skills/ovl/SKILL.md` prints nothing |
| 32 | ORV-138 | One PR from `chore/ORV-138-guard-batch`, title `ORV-138: ...`; every commit subject names one source key, and the keys first appear in build order: ORV-94, ORV-120, ORV-104, ORV-136, ORV-137, ORV-130, ORV-96. After the survey commit f026a32 (`docs(ORV-96)`, K-0090) the round 0 fix commits follow in this order: ORV-96 for shell-1 and resolve-1, ORV-130 for switch-1 on shell-1, ORV-136 for the RV-5 head check of no-throw-1. After the K-0090 sections 10 and 11 commit 985cae9 (`docs(ORV-136)`) and the v1.4 spec commit b19fe81 (`docs(ORV-96)`), the commits follow as built (v1.8), in this order: 7e91576 (`fix(ORV-96)`) for the shell reader, shell-1; 34113b1 (`fix(ORV-138)`) for the round 1 re-check fixes (ORV-138-review-2, ORV-138-security-2) of `write-guard` resolve-1 (f) and (g), `worktree-guard` switch-1 (d) and the records root of switch-1, with their shell-1 and ovl skill parts; then the ORV-138 and ORV-96 docs, test and merge commits: c490d76 (`docs(ORV-138)`, v1.5), 02c2dc5 (`docs(ORV-138)`, v1.6), a56cfb7 (`chore(ORV-138)`, merge of `develop`), 9b9d155 (`test(ORV-138)`), 18986d8 (`docs(ORV-96)`, v1.7), e4a11dd (`chore(ORV-138)`, merge of `develop`), 00ede5a (`docs(ORV-96)`), and the v1.8 spec commit. No ORV-130 commit follows b19fe81. | `git log --reverse --format=%s origin/develop..HEAD` |
| 33 | ORV-138 | The merge needs the owner approval line for the PR's head, once for the whole batch (ORV-137 comment 10246); before the owner runs it, the pre-check names `.orivilo/owner-approvals/<n>.json` as missing. | `node scripts/ovl/merge-check.mjs <n> --head <sha>` |
| 34 | ORV-138 | The full gate passes on the head, `pnpm test:scripts` included, and the gate record for the head has `ok: true`. | `pnpm quality-gate`; `pnpm test:scripts` |
| 35 | ORV-138 | No em dash and no middot in any changed text; Prettier clean. | `pnpm format:check`; `git diff -U0 origin/develop...HEAD` read for the two characters |
| 36 | ORV-136 | Rule `no-throw-1` (K-0089 N1), one test per case: (a) an approve with no `.quality-gate/report.json` in the hook's checkout; (b) one whose file is not JSON; (c) one whose JSON lacks the fields; (d) an approve whose `head_sha` is not in the hook's checkout; (e) an approve whose diff holds a `*.stories.tsx` removed at the head. Cases (a) to (d) each run at SubagentStop and at PostToolUse on the Agent call. The `git show` route has no test: once the diff has run, the head holds every changed file that is not removed. | `node --test --test-name-pattern="ORV-138 row 36:" scripts/ovl/result-recorder.test.mjs` reports at least one passing test |
| 37 | ORV-136 | The ovl skill section 2 tells the main session to keep at most one open unbound envelope per role, and why (Honest limits, the binding line; K-0089 N3). | `grep -n "open unbound" .claude/skills/ovl/SKILL.md` prints a line between the `## 2.` and `## 3.` headings |
| 38 | ORV-96 | Rule `shell-1` (a): `(git switch x)`, `git status & git switch x`, `if true; then git switch x; fi`, `git status # it's` NL `git switch x` (v1.4, a comment ends at its newline) and `git \` NL `switch x` (NL a newline) each give a segment whose command words are `git switch x`; a `$( )`, a backquote pair and a `>( )` each give the segments of the list inside them. | `node --test --test-name-pattern="ORV-138 row 38:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 39 | ORV-96 | Rule `shell-1` (b): the RV-1 form of "Write-guard forms to catch" gives the live segments `cd .oriv?lo/owner-approvals` and `printf x > 7.json` and no substitution (Worked examples, shell-1 (b)); `node -e 'process.exit(1 > 0 ? 0 : 1)'` gives no redirect; `"$(printf .oriv)"` opens a substitution; `echo \$(x)` and `echo '$(x)'` open none. | `node --test --test-name-pattern="ORV-138 row 39:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 40 | ORV-96 | Rule `shell-1` (c): the five words of Worked examples, shell-1 (c), give the fixed parts and kinds shown there; `"cd"`, `\cd` and `c""d` each give the fixed part `cd`; `$'\x2eorivilo'` and `$"x"` give kind `any` with an empty fixed part; `~/x` gives the home folder followed by `/x`, kind `none`. | `node --test --test-name-pattern="ORV-138 row 40:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 41 | ORV-96 | Rule `shell-1` (d): one test per prefix (`GIT_TRACE=0`, `env -i -u X`, `env -C d`, `command`, `command -p`, `builtin`, `exec -a n`, `nohup`, `timeout -s KILL 5`, `time -p`, `!`, `then`) before `git switch x` leaves `git` as the command name; `command -v git` has no command; `$G switch x` has an unknown command; `env -S 'git switch x'` makes the call unknown (v1.4, unknown-1); `TEE a` has the command `tee`; `env -C d` and `GIT_DIR=x` are recorded on the segment. | `node --test --test-name-pattern="ORV-138 row 41:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
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
| 53 | ORV-96 | Rule `shell-1` (a), comments (K-0090 C1 to C5): `# switch back, it's done` NL `git switch x`, `git status # don't` NL `git switch x` and `true;# it's` NL `git switch x` each give a segment whose command words are `git switch x`, and no word spans the newline; `git status # ; git switch x` gives the one segment `git status`; `echo a#b; git switch x` gives the segment `git switch x` (C3); `# note \` NL `git switch x` gives the segment `git switch x` (C4); `x=$(echo a # )` NL `); git switch x` gives a substitution that closes on the second line and the segment `git switch x` (C5). | `node --test --test-name-pattern="ORV-138 row 53:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 54 | ORV-96 | Rule `shell-1` (a), (b) and (g), the K-0090 section 10 rows marked model that v1.3 did not name: `echo $'it\'s'; git switch x` (Q1), `echo 'it''s'; git switch x` (Q2), `echo $"a b"; git switch x` (Q3), ``echo `echo a`; git switch x`` (S1), `x=$(case a in a) git status;; esac); git switch x` (S5), `echo ${ git switch x; }` (S6), `echo $[1<<2]` NL `git switch x` (S7), `cat =(git switch x)` (S8), `cat <<(git switch x)` (H20), `(( n = 1 << 2 ))` NL `git switch x` and `echo $(( 1 << 2 ))` NL `git switch x` (H17), and `{ git switch x }` (Z4) each give a segment whose command words are `git switch x`; `[[ a > b ]]` gives no write target (H19); `printf x >>! f`, `printf x >>\| f`, `printf x &>\| f` and `printf x &>! f` each give the write target `f` (Z8). | `node --test --test-name-pattern="ORV-138 row 54:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 55 | ORV-96 | Rule `shell-1` (f), v1.4: `cat <<'EOF' $(` NL `printf x > 7.json` NL `)` NL `rm x` NL `EOF` gives the segment `printf x > 7.json` with the write target `7.json` and no segment `rm x` (H3); `cat <<A; cat <<B` NL `a` NL `A` NL `rm x` NL `B` NL `git switch x` gives no segment `rm x` and the segment `git switch x` (H2); `cat <<$'EOF'` NL `rm x` NL `EOF` NL `git switch x` gives no segment `rm x` and the segment `git switch x` (H8); `cat <<$X` NL `EOF` NL `$X` NL `git switch x` ends the body at the line `$X` and gives the segment `git switch x` (H10); `cat <<'EOF'` NL `EOF` followed by a space NL `git switch x` gives no segment `git switch x` (H15, H16); `cat <<< EOF` NL `git switch x` gives the segment `git switch x` (H18). | `node --test --test-name-pattern="ORV-138 row 55:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 56 | ORV-96 | Rule `unknown-1`: each form in "Unknown call forms" gives a call marked unknown, with its cause; a call of 200,000 characters (`echo`, a space and 199,995 `a`) is read and one of 200,001 characters is unknown; no form in "Write-guard forms to keep" or "Branch forms to keep" is unknown. | `node --test --test-name-pattern="ORV-138 row 56:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 57 | ORV-96 | Rule `shell-1` (d), v1.4: for each row of "Runner grammar", the row's Example before `git switch x` leaves `git` as the command name; so do `sudo -u x nice -n 5 git switch x`, `- git switch x`, `noglob git switch x`, `nocorrect git switch x`, `repeat 3 git switch x`, `=git switch x` (S9), `if [[ -n a ]] { git switch x }` (Z3) and `{ : } always { git switch x }` (Z5); `sudo -D d`, `sudo -R d` and `chroot d` before `git switch x` are recorded on the segment as a folder change, and `sudo GIT_DIR=x` and `arch -e GIT_DIR=x` as a `GIT_DIR` assignment. | `node --test --test-name-pattern="ORV-138 row 57:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 58 | ORV-96 | Rule `resolve-1` (g): each form in "Unknown call forms" is blocked as the main session and as a subagent, and its stderr says the call could not be read. | `node --test --test-name-pattern="ORV-138 row 58:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 59 | ORV-130 | Rule `switch-1` (d): each form in "Unknown call forms" is blocked as a main-session call while an envelope is bound to any checkout, and its stderr says the call could not be read and names the bound task ids; with no bound envelope each is allowed; a subagent's call is not judged by switch-1. | `node --test --test-name-pattern="ORV-138 row 59:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test |
| 60 | ORV-96 | Rule `resolve-1` (f), the here-document body (RV2-3): the two RV2-3 forms of "Write-guard forms to keep" are allowed as a subagent; the same report written with an unquoted delimiter (`<<EOF`) is blocked as a subagent; `cat > .orivilo/x.json <<'EOF'` NL `{}` NL `EOF` is blocked as the main session and as a subagent; as the main session, `cat > /tmp/orv-note.md <<'EOF'` NL `printf x > .orivilo/owner-approvals/7.json` NL `EOF` is allowed. | `node --test --test-name-pattern="ORV-138 row 60:" scripts/ovl/write-guard.test.mjs` reports at least one passing test |
| 61 | ORV-130 | Rule `switch-1`, the records root (RV2-5): with `CLAUDE_PROJECT_DIR` set to the main checkout, an envelope bound to it and the call's cwd in a second git repository, `cd <main> && git switch x` is blocked; with `CLAUDE_PROJECT_DIR` unset the records come from the call's cwd, and every row 24 test passes. | `node --test --test-name-pattern="ORV-138 row 61:" scripts/ovl/worktree-guard.test.mjs` reports at least one passing test |
| 62 | ORV-96 | Rule `shell-1`, linear time (sec-F7): a call of `echo`, a space and 100,000 `[` (100,005 characters), and one of `echo`, a space and 100,000 `{`, are each read within 3,000 ms (Worked examples, shell-1 linear time). | `node --test --test-name-pattern="ORV-138 row 62:" scripts/ovl/shell-words.test.mjs` reports at least one passing test |
| 63 | ORV-96 | The ovl skill states v1.4: its `write-guard` Honest limits bullet and its "One issue per checkout" bullet say that a call the reader cannot read is blocked (unknown-1), name the runners shell-1 (d) skips, and no longer list `env -S` among the forms the guard does not see. | `grep -n "could not be read" .claude/skills/ovl/SKILL.md` prints a line in each of the two bullets; ``grep -n '`nice`' .claude/skills/ovl/SKILL.md`` prints a line in each of the two bullets |

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
  way. It reads the forms survey K-0090 classes M and U (its sections 1 to 7), the rows its section
  10 marks model, and the runners its section 11 marks M (clause (d)), left to right, with the
  quoting of each word kept: nothing is unquoted before the split. It reads each word in time linear
  in the word's length (sec-F7; row 62). A form it cannot read makes the whole call unknown (clause
  (h), unknown-1). It gives:
  - (a) Segments. A segment ends at each control operator outside quotes (`;`, `&`, `&&`, `||`, `|`,
    `|&`, `;;`, `;&`, `;;&`, `(`, `)` and a newline; K-0090 section 1) and records the operator that
    ends it; in zsh's form a `}` word ends one too (K-0090 Z4). A `$( )`, a backquote pair, `<( )`,
    `>( )`, zsh `<<( )` (read as `< <( )`, H20), zsh `=( )` at the start of a word (S8) and Bash
    `${ ...; }` and `${| ...; }` (S6), opened outside single quotes and backslash escapes, hold a list
    whose commands are segments too. A backquote pair ends at the first backquote that is not quoted
    and not after a backslash (S1). A `case` pattern's `)` inside a `$( )` closes no substitution
    (S5). A backslash before a newline joins the two lines, outside single quotes and comments (Q4).
    - Comments (K-0090 C1 to C5). An unquoted `#` at the start of a word (at the start of a line,
      after an unquoted blank, or right after an operator) starts a comment that runs to the end of its
      line, as non-interactive zsh and bash read it. Nothing in a comment opens a quote, a
      substitution or a here-document, and a backslash at its end joins no line (C4). Inside a `$( )`
      the comment also ends at its newline, so a `)` in it closes nothing (C5). A `#` inside a word or
      inside quotes starts none (`a#b`, `$#`, `${#x}`, `'#'`; C3). An interactive shell, which reads
      no comment without `interactive_comments`, is state from before the call (C8, Honest limits).
    - Arithmetic. `$((`, `$[` (zsh, S7) and a `((` at command position open arithmetic, which ends at
      its matching `))`, or at the matching `]` of a `$[`. Inside it `<<` is a shift and opens no here-document (H17). An
      opener whose arithmetic does not close as arithmetic is unknown-1's case (S3, S4).
  - (b) Quoting. Single quotes, double quotes, `$'...'`, `$"..."` and backslash escapes stay part of
    the word they are in. `\'` inside `$'...'` does not end it (Q1); `''` inside single quotes closes
    and reopens them (Q2); `$"..."` ends at its next unescaped `"` (Q3). `$`, `${`, `$(`, `$((` and a
    backquote open an expansion outside single quotes and backslash escapes, inside double quotes too;
    `?`, `*`, `[` and a brace `{` open one only outside every quote; `~` opens one at the start of a
    word, except `~` alone and `~/`. A `$'...'` that holds a backslash escape, and any `$"..."`, count
    as an expansion (shell-1 does not decode them). A `;`, `&`, `|`, `<`, `>`, `(` or `)` inside
    quotes is a plain character.
  - (c) Fixed part and kind. Each word gives its fixed part, the text before its first expansion with
    quotes and escaping backslashes removed (`"cd"`, `\cd` and `c""d` each give `cd`; `~` and `~/`
    give the home folder of the hook process), and its kind: `none` with no expansion; `glob` when
    every expansion in it is `?`, `*` or `[`, each of which matches inside one name; `any` otherwise
    (a `$`, backquote, brace or tilde expansion, whose value may hold `/` and `..`). Each word also
    carries its path components, split at each `/`: per component, its fixed part (the text of the
    component before its first expansion) and a glob flag (the component holds an expansion).
    resolve-1 (d) collapses `..` against these components, a component with the flag counting as one
    name (`x*/../.oriv?lo` leaves `.oriv?lo`).
  - (d) Command position. In each segment these words before the command name are skipped, in any
    order and any number:
    - assignments (`NAME=value`);
    - reserved words (`if`, `then`, `elif`, `else`, `fi`, `while`, `until`, `do`, `done`, `for`,
      `select`, `case`, `esac`, `coproc`, `function`, `{`, `}`, `[[`, `]]` and `!`), and zsh's
      `repeat` with its one word, `foreach`, `end`, `nocorrect` and `always` (K-0090 Z2, Z5). The
      words from `[[` to its `]]` are a condition, and the word after `]]` is at command position
      (zsh's short form `if [[ -n a ]] { git switch x }`, Z3);
    - the shell words of K-0090 section 11a: `command` with `-p`, `builtin`, `exec` with `-c`, `-l`
      and `-a NAME`, and zsh's `-` and `noglob`;
    - each runner in "Runner grammar" below (the reserved word `time` among them), with the options
      and positional words its row gives.

    zsh's `=word` at command position reads as `word` (S9). A redirect anywhere in the segment is no
    command word (K-0090 section 3). The first word left is the command name, read as the base name
    of its fixed part (the text after its last `/`), lowercased: `/usr/bin/tee`, `./TEE` and `TEE`
    each read as `tee` (a case-insensitive file system finds `TEE` as `tee`). The skipped programs are
    found the same way (`/usr/bin/env git switch x` and `/usr/bin/time git switch x` have the command
    `git`). A command name with an expansion is unknown. `command -v` and `command -V` run no command.
    The segment records its folder changes (`env -C DIR`, `sudo -D DIR`, `sudo -R DIR`, and the
    NEWROOT of `chroot`) and each `GIT_DIR` or `GIT_WORK_TREE` assignment (as a prefix, an `env` or
    `sudo` `NAME=VALUE` word, or the value of `arch -e`).

    A runner's options are read as getopt reads them: `--` ends them; a `--name=value` word is one
    option; a long option its row gives a value and written without `=` takes the next word; a word of
    short options is read letter by letter, a letter with no value going on to the next letter and a
    letter with a value taking the rest of the word (`-o0`) or, when it is the word's last letter, the
    next word. K-0090 does not say whether a page's short option takes an attached value ("What the
    sources read do not say"); this reading is ours, and `nice`, `arch` and `prlimit` keep the
    exceptions their rows give. These make the call unknown (unknown-1): a word that begins with `-`
    and holds an option the runner's row does not give, a form in the row's "Makes the call unknown"
    cell, and a word with an expansion where the runner's options or positional words stand (the value
    of an option excepted).

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
  - (f) Here-documents. After `<<` or `<<-` and its delimiter word, the body starts after the first
    newline at the nesting level of the operator (K-0090 H1). A newline inside a substitution opened
    later on that line is not that newline, so the lines up to the line where the substitution closes
    are read as its list, and the body starts after that line (H3). Several here-documents on one
    line take their bodies in order (H2). A body runs to the first line that is exactly the delimiter,
    with no trailing blank (H15; leading tabs removed for `<<-`, H14), or to the end of the text
    (H16). The delimiter is the literal text of the word after quote removal, with no expansion
    (`<<$X` ends at the line `$X`, H10). When any part of the delimiter word is quoted (`'EOF'`,
    `"EOF"`, `\EOF`, `E"O"F`, and `$'EOF'` with no backslash inside, H7, H8), the body is a literal:
    no segment, word or expansion comes from it, and shell-1 gives its place in the text (resolve-1
    (f)). Otherwise it is read as in double quotes: only its `$`, `$(` and backquote expansions count,
    and a substitution in it holds segments (K-0090 section 3). A here string `<<<` takes no body
    (H18). This holds wherever the here-document opens: in a function body, a group, an `if` or a case
    arm (H6), or inside a substitution whose list closes on a later line than the operator (the commit
    and PR body forms of "Write-guard forms to keep"); the substitution around it stays an expansion
    of its word (`"$(cat <<'EOF'` ... `)"` is kind `any`). A here-document whose substitution or
    backquote pair closes before that newline, and the delimiter forms K-0090 marks unknown, are
    unknown-1's case (H4, H5, H8 with a backslash, H9, H11, H12, H13). This clause replaces v1.1's
    heredoc-1.
  - (g) Redirects. A redirect operator outside quotes, with an optional number or `{name}` before it,
    gives a write target, its next word, when the operator is `>`, `>>`, `>|`, `>!` (zsh, read as
    `>|`), zsh's `>>!`, `>>|`, `&>|` and `&>!` (K-0090 Z8), `&>`, `&>>`, `<>`, or `>&` whose word is
    not digits or `-`. A redirect with no command gives its target too (Z7), and so does each of
    several on one command (Z6). `<`, `<<`, `<<-`, `<<<`, `<&`, and `>&` with digits or `-` give none.
    A `<` or `>` between `[[` and its `]]` is a comparison and gives none (H19), and so is one inside
    arithmetic (clause (a)).
  - (h) `unknown-1`. The call is unknown, and neither guard judges its segments, when its text holds
    any of these, or when it is longer than 200,000 characters (a bound the orchestrator set, not a
    derived number). The members are selected by K-0090's Reader cells: every section 10 row whose
    cell says unknown (in full or for a named case), and every section 11 runner form marked B or U.
    Each member, with the test the reader applies:
    - C6: a backquote pair whose text holds a `#` at the start of a word, outside quotes: the pages
      leave open whether that comment ends at the closing backquote or runs past it.
    - C7: an assignment to `histchars` (a `histchars=` word where an assignment stands).
    - H4: a here-document whose operator stands inside a `$( )` that closes before the first newline
      at the operator's level (Worked examples, unknown-1 H4).
    - H5: the same inside a backquote pair.
    - H8: a `$'...'` delimiter that holds a backslash (`<<$'E\x4fF'`).
    - H9: a `$"..."` delimiter.
    - H11: a delimiter word that holds a backquote.
    - H12: a backslash before a newline inside a delimiter word.
    - H13: in the body of a here-document with an unquoted delimiter, a line that ends in a backslash
      that is not itself escaped.
    - S2: a backquote pair whose text, read alone, leaves a quote open at its end.
    - S3, S4: a `$((` or a `((` at command position whose inner `(` closes with a `)` that is not
      followed at once by a second `)`.
    - S11: an unquoted `(` inside a word, other than the openers `$(`, `$((`, `<(`, `>(`, `<<(`, `=(`
      at the start of a word, and `((` at command position. zsh glob qualifiers (`*(.)`, S10) and
      extglob patterns hold such a `(`, so they are unknown too.
    - Section 11, B and U: each form in the "Makes the call unknown" cells of "Runner grammar"; every
      `watch` (B without `-x`; v1.4 does not model `-x`) and every `parallel` (U); and the runner
      reading cases of clause (d).

    The K-0090 section 10 rows marked S or B other than S10 (C8, Q5, Z1) and the runners K-0090 did
    not read are Honest limits. Unknown is a result, not a throw; a throw in the reader still fails
    closed in both guards (the ORV-138-security-2 record, 20,000 nested `$(`).

- `switch-1`: `worktree-guard` blocks a main-session Bash call (no `agent_id`) when an envelope is open
  and bound (`agent.json`, no `result.json`, no `closed.json`) and a segment of the call, as shell-1
  reads it, is a branch switch form whose checkout is that envelope's `worktree` (through realpath)
  or is unknown. It reads the envelopes from the records of `CLAUDE_PROJECT_DIR` when that is set,
  else of the hook input's `cwd`, as `write-guard` does (`scripts/ovl/write-guard.mjs` line 128
  on ad941b2; RV2-5). The stderr names the bound task ids, and says so when the checkout is unknown. When
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
  - (c) The checkout is unknown when the effective cwd is unknown; when the segment has a folder
    change (`env -C`, `sudo -D`, `sudo -R`, `chroot`), `--git-dir`, `--work-tree`, or a `GIT_DIR` or
    `GIT_WORK_TREE` assignment (shell-1 (d)); when a `-C` value has an expansion; or when the git
    top of a folder that exists cannot be read. A switch form whose git top cannot be read for a
    folder that exists is blocked with or without a bound envelope, as a read failure like the
    records (the read-failure case of row 25, asserted since v1.0); its stderr says the records or
    the checkout cannot be read and the checkout is unknown. A call cwd that is gone is no folder
    that exists: its effective cwd is unknown (shell-1 (e)), so with the records read from
    `CLAUDE_PROJECT_DIR` its switch form is an unknown checkout, not a read failure
    (the gone-cwd case of row 25, v1.5; with `CLAUDE_PROJECT_DIR` unset the records come from that
    cwd and cannot be read, a read failure). Every other unknown checkout, the gone-cwd case among
    them, is blocked only while an envelope is bound (open question 13).
  - (d) A main-session call that shell-1 marks unknown (unknown-1) is blocked while any envelope is
    open and bound, whatever its segments; its stderr says the call could not be read and names the
    bound task ids. When the records cannot be read, an unknown call is blocked as a switch form is.
    With no bound envelope an unknown call keeps today's verdict.

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
    applies them; under a folder change (`env -C`, `sudo -D`, `sudo -R`, `chroot`; shell-1 (d)),
    `--git-dir`, `--work-tree`, or a `GIT_DIR` or `GIT_WORK_TREE` assignment its base is unknown, and
    under `sudo -R` or `chroot` an absolute path argument counts as relative to that unknown base.
    Resolving collapses `.` and `..` (`scripts/x/../ovl/a.mjs` is
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
  - (f) Kept, with one change: the main session's literal-name rule (`named`, lines 67 to 76, and its
    exceptions, lines 651 to 656), the subagent rule of ORV-93 (a literal protected name and a write
    form by its text test, lines 642 to 649), the qa and designer screenshot exception (lines 644 to
    646 and `isOwnScreenshotWrite`, lines 372 to 381), which allows a subagent call before resolve-1
    is read, and the close rules (lines 632 to 634). Line numbers are on 38a7f73. The change (v1.4,
    RV2-3): the literal-name rule and the ORV-93 text rule do not read the body of a quoted-delimiter
    here-document that shell-1 (f) finds; they read the rest of the call text as before, and resolve-1
    still judges every write target of the call, the redirect target of that here-document's command
    included. A subagent call that names a protected path and holds no write form by the ORV-93 text
    test (`/usr/bin/tee .orivilo/x`) goes on to resolve-1 after the screenshot exception and the text
    rule. So for a subagent call resolve-1 may block more than the text rule. It judges only the
    targets the call's words name, so a call whose targets stand in a body the text rules skip passes
    both: the content line of Honest limits, ORV-96 part (v1.6, RV3-1).
  - (g) A call that shell-1 marks unknown (unknown-1) is blocked, for the main session and a subagent,
    after the screenshot exception and the close rules of (f) and before any target is judged; its
    stderr says the call could not be read and names the cause.

### Runner grammar (shell-1 (d))

Each row is a runner K-0090 section 11 marks M, with the grammar its pages give, Linux and macOS
pages together (the `time` row joins the section 11a reserved word to the 11b programs). shell-1 (d)
skips the runner, its options and its positional words; the next word is the command name. The
Example cell is the prefix row 57 puts before `git switch x`.

<!-- prettier-ignore -->
| Runner | Options with a value | Options with no value | Positional words before the command | Makes the call unknown | Example |
| --- | --- | --- | --- | --- | --- |
| `nice` | `-n`, `--adjustment` | `--help`, `--version`; `-` and digits (`-5`) as one word | none | | `nice -n 5` |
| `time`, the reserved word and the program by its base name | `-f`, `--format`, `-o`, `--output` | `-p`, `--portability`, `-a`, `--append`, `-v`, `-q`, `-h`, `-l`, `-V`, `--help` | none | | `/usr/bin/time -p` |
| `stdbuf` | `-i`, `--input`, `-o`, `--output`, `-e`, `--error` | `--help`, `--version` | none | | `stdbuf -o0` |
| `caffeinate` | `-t`, `-w` | `-d`, `-i`, `-m`, `-s`, `-u` | none | | `caffeinate -i` |
| `ionice` | `-c`, `--class`, `-n`, `--classdata`, `-p`, `--pid`, `-P`, `--pgid`, `-u`, `--uid` | `-t`, `--ignore` | none | | `ionice -c 3` |
| `setsid` | none | `-c`, `-f`, `-w`, `-h`, `-V` | none | | `setsid -f` |
| `chrt` | `-T`, `-P`, `-D`, `-U`, `-X` | `-o`, `-f`, `-r`, `-b`, `-i`, `-d`, `-e`, `-G`, `-O`, `-R`, `-a`, `-m`, `-p`, `-v`, `-h`, `-V` | one word of digits, the priority | a first word after the options that is not digits (U) | `chrt -f 10` |
| `taskset` | none | `-a`, `-c`, `-p`, `-h`, `-V` | one mask or CPU list | | `taskset -c 0` |
| `flock` | `-E`, `--conflict-exit-code`, `-w`, `--wait`, `--timeout`, `--start`, `--length` | `-F`, `-n`, `--nb`, `--nonblocking`, `-o`, `-s`, `-u`, `-e`, `-x`, `--exclusive`, `--verbose`, `--fcntl`, `-h`, `-V` | one lock file or folder | `-c`, `--command`, among the options or right after the file (B) | `flock /tmp/orv.lock` |
| `lockf` | `-t` | `-k`, `-n`, `-s`, `-w` | one file | | `lockf /tmp/orv.lock` |
| `sudo` | `-a`, `-C`, `-c`, `-D`, `-g`, `-p`, `-R`, `-r`, `-t`, `-T`, `-U`, `-u`, `--preserve-env` (with `=`), and `-h` with its host attached | `-A`, `-B`, `-b`, `-E`, `-e`, `-H`, `-K`, `-k`, `-l`, `-N`, `-n`, `-P`, `-S`, `-V`, `-v` | `VAR=value` words, recorded as assignments | `-s`, `-i` (B); a `-h` with no attached value (U, help or host) | `sudo -u x` |
| `doas` | `-a`, `-C`, `-u` | `-L`, `-n`, `-s` | none | | `doas -u x` |
| `chronic` | none | `-e`, `-v` | none | | `chronic -v` |
| `unbuffer` | none | `-p` | none | | `unbuffer -p` |
| `script` | `-E`, `--echo`, `-B`, `--log-io`, `-I`, `--log-in`, `-O`, `--log-out`, `-T`, `--log-timing`, `-m`, `--logging-format`, `-o`, `--output-limit`, and `-t` or `--timing` with the value attached | `-a`, `-d`, `-e`, `-F`, `-f`, `--force`, `-k`, `-p`, `-q`, `-r`, `-h`, `-V` | one file, then an optional `--`; a `--` first means no file | `-c`, `--command` (U); a `-t` with no attached value (the two pages differ) | `script -q /tmp/orv.log` |
| `nohup` | none | `--help`, `--version` | an optional `--` (macOS) | | `nohup` |
| `timeout` | `-k`, `--kill-after`, `-s`, `--signal` | `-f`, `--foreground`, `-p`, `--preserve-status`, `-v`, `--verbose`, `--help`, `--version` | one DURATION | | `timeout -s KILL 5` |
| `env` | `-a`, `--argv0`, `-u`, `--unset`, `-C`, `--chdir`, `-P` (macOS) | `-i`, `--ignore-environment`, `-0`, `--null`, `-v`, `--debug`, `--list-signal-handling`, a lone `-`, and `--block-signal`, `--default-signal`, `--ignore-signal` (a value only after `=`) | `NAME=VALUE` words, recorded as assignments | `-S`, `--split-string` (B) | `env -i -u X` |
| `chroot` | `--groups`, `--userspec` (with `=`) | `--skip-chdir`, `--help`, `--version` | one NEWROOT, recorded as a folder change | | `chroot /tmp/root` |
| `prlimit` | `-o`, `--output`, `-p`, `--pid`; each long resource option (`--nofile` and the rest) with its limits after `=` | `--noheadings`, `--raw`, `--verbose`, `-h`, `-V` | none | a short resource option (`-c`, `-d`, `-e`, `-f`, `-i`, `-l`, `-m`, `-n`, `-q`, `-r`, `-s`, `-t`, `-u`, `-v`, `-x`, `-y`), and a long one with no `=` (U) | `prlimit --nofile=5` |
| `arch` (each option one word, no letter groups) | `-arch`, `-d`, `-e` (its `NAME=value` recorded as an assignment) | `-32`, `-64`, `-c`, `-h`, `-i386`, `-x86_64`, `-x86_64h`, `-arm64`, `-arm64e` | none | | `arch -arm64` |
| `xcrun` | `--sdk`, `--toolchain` | `-v`, `-n`, `-k`, `-l`, `-f`, `-r`, `--find`, and each `--show-` option | none | | `xcrun --sdk macosx` |
| `sandbox-exec` | `-f`, `-n`, `-p`, `-D` | none | none | | `sandbox-exec -n no-network` |
| `pnpm exec`, with `exec` the word right after `pnpm` | `--resume-from`, `--filter` | `-r`, `--recursive`, `--parallel`, `--no-reporter-hide-prefix`, `--report-summary` | none | `-c`, `--shell-mode` (B) | `pnpm exec` |
| `npx` | `--package`, `-p` | `--yes`, `-y`, `--no` | an optional `--` | `-c`, `--call` (B) | `npx --yes --` |

`watch` and `parallel` have no row (unknown-1 covers them). `xargs` has none either: it stays a
named bypass (Honest limits, ORV-96 part).

### Unknown call forms (unknown-1)

One form per member of unknown-1, each with harmless commands, so a test shows the block comes from
the reading alone (rows 56, 58 and 59):

- C6: `` x=`echo a # ` `` NL `` echo b` ``
- C7: `histchars='!^%'` NL `echo % it's` NL `git status`
- H4: `x=$(cat <<'EOF')` NL `git status` NL `EOF`
- H5: `` x=`cat <<'EOF'` `` NL `git status` NL `EOF`
- H8: `cat <<$'E\x4fF'` NL `x` NL `EOF`
- H9: `cat <<$"EOF"` NL `x` NL `EOF`
- H11: `` cat <<`EOF` `` NL `x` NL `` `EOF` ``
- H12: `cat <<E\` NL `OF` NL `x` NL `EOF`
- H13: `cat <<EOF` NL `EO\` NL `F` NL `git status`
- S2: ``echo `echo "a` b"``
- S3: `echo $((cd /tmp; git status) )`
- S4: `((git status) )`
- S11: `ls a(b|c)`, and the S10 form `print *(e:'git status':)`
- section 11: `env -S 'git status'`, `flock /tmp/orv.lock -c 'git status'`, `sudo -s git status`,
  `sudo -i git status`, `sudo -h git status`, `script -c 'git status' /tmp/t`, `script -t /tmp/t`,
  `watch git status`, `watch -x git status`, `parallel git status ::: a`,
  `pnpm exec -c 'git status'`, `npx -c 'git status'`, `chrt git status`, `prlimit -n 5 git status`,
  `prlimit --nofile git status`
- the runner reading cases of shell-1 (d): `nice -z git status` (an option its row does not give),
  `nice $N git status` (an expansion where an option may stand)
- the length bound: `echo`, a space and 199,996 `a` (200,001 characters)

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
- `git status # don't` NL `git switch x`, and `# switch back, it's done` NL `git switch x` (RV2-1,
  sec-F5 (1); shell-1 (a))
- `cat <<$'EOF'` NL `x` NL `EOF` NL `git switch x` (sec-F5 (4); shell-1 (f), H8)
- `cat <<'EOF' $(` NL `git switch x` NL `)` NL `x` NL `EOF` (sec-F5 (3); shell-1 (f), H3)
- `(( n = 1 << 2 ))` NL `git switch x` (RV2-2; shell-1 (a), H17)
- `nice git switch x`, `stdbuf -o0 git switch x` and `/usr/bin/time git switch x` (RV2-4, sec-F6;
  shell-1 (d))
- `cd <bound> && git switch x` from a cwd in a second git repository, with `CLAUDE_PROJECT_DIR` set
  to the main checkout and `<bound>` the main checkout (RV2-5; switch-1)

These probed forms make the call unknown, so they are blocked while an envelope is bound to any
checkout (switch-1 (d)): `x=$(cat <<'EOF')` NL `git switch x` NL `EOF` (RV2-2, H4), and
`` x=`cat <<'EOF'` `` NL `git switch x` NL `EOF` (RV2-2, sec-F5 (2), H5).

### Branch forms to keep (switch-1, L-0012)

With an envelope bound to the main checkout, these stay allowed, besides the forms of row 25:

- `cd <unbound worktree> && git switch x`, from a cwd in the main checkout (RV-4)
- `git -C <unbound worktree> switch x`, from a cwd in the main checkout
- `git -C <worktree> add checkout` (RV-7: its subcommand is `add`)
- `git status # ; git switch x`, from a cwd in the main checkout: the switch is inside a comment and
  does not run (v1.4, shell-1 (a))

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
- shell-1 (a), (b), (e) and resolve-1 (a), (c): `git status # it's` NL
  `printf x > .oriv?lo/owner-approvals/7.json` (v1.4; v1.2 to v1.3 had `git status # ;` before the
  write on the same line, which the shell does not run); `printf x > $'\x2eorivilo/owner-approvals/7.json'`;
  `printf x > >(cat > .oriv?lo/owner-approvals/7.json)`; `false && cd /tmp; printf x > settings.json`
  with the cwd at `<main>/.claude`; `cp --target-directory=.oriv?lo/exports /tmp/x`;
  `cd .claude && rm -rf hooks`
- The round 1 re-check forms (v1.4). F5 below is the first form of this list, which zsh and bash
  each ran to write `.orivilo/owner-approvals/7.json` in the reviewers' temp repositories:
  - RV2-1, sec-F5 (1), a quote in a comment: `true # it's done` NL F5; `# the "owner` NL F5
    (shell-1 (a))
  - RV2-2, sec-F5 (2), here-documents in a substitution closed on its line (unknown-1, H4 and H5):
    `x=$(cat <<'EOF')` NL F5 NL `EOF`; `` x=`cat <<'EOF'` `` NL F5 NL `EOF`
  - RV2-2, a shift: `(( n = 1 << 2 ))` NL F5 (shell-1 (a), H17)
  - sec-F5 (3), a here-document pending across a `$(` newline: `cat <<'EOF' $(` NL F5 NL `)` NL `x`
    NL `EOF` (shell-1 (f), H3)
  - sec-F5 (4), a `$'...'` delimiter: `cat <<$'EOF'` NL `x` NL `EOF` NL F5 (shell-1 (f), H8)
  - RV2-4, runners: `nice cp /dev/null .oriv?lo/owner-approvals/`;
    `caffeinate -i cp /dev/null .oriv?lo/owner-approvals/`;
    `/usr/bin/time cp /dev/null .oriv?lo/owner-approvals/`;
    `cd .oriv?lo/owner-approvals && nice tee 7.json` (shell-1 (d))
  - sec-F6, runners: `cd .oriv?lo/owner-approvals && nice cp /tmp/a 7.json`;
    `cd .oriv?lo/owner-approvals && stdbuf -o0 tee 7.json`;
    `cd .oriv?lo/owner-approvals && /usr/bin/time cp /tmp/a 7.json` (shell-1 (d))

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
- subagent (reviewer, security; RV2-3, resolve-1 (f)): a report written from a quoted here-document
  whose body names a guard path and a record path, `cat > /tmp/orv-report.json <<'EOF'` NL
  `{"file": "scripts/ovl/write-guard.mjs", "ref": ".orivilo/runs/ORV-138/x/result.json"}` NL `EOF`;
  and its check, `node scripts/ovl/validate.mjs reviewer.v1 /tmp/orv-report.json`

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
rounding unless one states it. The v1.2 to v1.5 examples were written with no shell and are not run
yet.

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

- shell-1 (a) comments (v1.4), input the two RV2-1 forms copied from the ORV-138-review-2 record
  (W10 and W1): each line with its comment dropped, a comment being an unquoted `#` at the start of
  a line or after a blank or an operator, up to the end of its line. The one-liner handles only text
  with no quote before the `#`, which is all this input needs. Expected output, two lines:
  `["git switch x"]` and `["git status","git switch x"]` (the switch stays live in both).

  ```bash
  node -e 'for(const c of ["# switch back, it\x27s done\ngit switch x","git status # don\x27t\ngit switch x"])console.log(JSON.stringify(c.split("\n").map(l=>l.replace(/(^|[ \t;&|()])#.*$/,"$1").trim()).filter(Boolean)))'
  ```

- unknown-1 H4 (v1.4), input the RV2-2 form `x=$(cat <<'EOF')` NL `git switch x` NL `EOF` and the
  commit form of "Write-guard forms to keep": on the line of the `<<`, does a `)` close a `$(` that
  opened before the operator, before the line ends. The one-liner counts only `$(` and `)`, with no
  quote in between, which is all this input needs. Expected output, two lines: `unknown` and
  `modelled`.

  ```bash
  node -e 'for(const c of ["x=$(cat <<\x27EOF\x27)\ngit switch x\nEOF","git commit -m \"$(cat <<\x27EOF\x27\nmsg\nEOF\n)\""]){const l=c.split("\n")[0];const r=l.slice(l.indexOf("<<"));let d=0,u=false;for(let i=0;i<r.length;i++){if(r[i]==="$"&&r[i+1]==="("){d++;i++}else if(r[i]===")"&&--d<0)u=true}console.log(u?"unknown":"modelled")}'
  ```

- shell-1 (d) runners (v1.4), input the three sec-F6 runners chained before `git switch x`, with the
  option letters copied from the `nice`, `stdbuf` and `time` rows of "Runner grammar" (short options
  only), read by the getopt reading of shell-1 (d). Expected output: `git`.

  ```bash
  node -e 'const g={nice:{v:"n",f:""},stdbuf:{v:"ioe",f:""},time:{v:"fo",f:"pavqhlV"}};const w="nice -n 5 stdbuf -o0 /usr/bin/time -p git switch x".split(" ");let i=0;for(;;){const r=g[w[i].slice(w[i].lastIndexOf("/")+1)];if(!r)break;i++;while(i<w.length&&w[i].startsWith("-")){const o=w[i++];if(o==="--")break;for(let k=1;k<o.length;k++){if(r.v.includes(o[k])){if(k===o.length-1)i++;break}if(!r.f.includes(o[k]))throw new Error("unknown "+o)}}}console.log(w[i])'
  ```

- shell-1 linear time (v1.4, row 62), input the ORV-138-security-2 probe-cost observation
  `word of [ x40000 | chars 40005 | 1560 ms | ok` on ad941b2: the time the ad941b2 reading, whose
  time grows with the square of the count of `[`, would take on the row 62 call of 100,005
  characters, scaled by the square of the length ratio. Expected output: `9749` (milliseconds,
  rounded to the nearest whole one). Row 62's bound of 3,000 ms is under a third of it, so the
  ad941b2 reading fails row 62 with room for a machine three times faster, and a reading that does a
  fixed amount of work per character passes it.

  ```bash
  node -e 'console.log(Math.round(1560*(100005/40005)**2))'
  ```

- switch-1 (c), the gone-cwd case (v1.5), input the cwd and command of the row 25 gone-cwd test
  (`scripts/ovl/worktree-guard.test.mjs` lines 253 and 256: `join(main, "gone")` and
  `git switch x`), with the repo root as `main`, read by `readShell` (`scripts/ovl/shell-words.mjs`
  line 149; its start folder is null for a cwd that is no existing folder, lines 181 to 188): the
  effective cwd of the segment, for the repo root and for `<root>/gone`, which does not exist.
  Expected output, two lines: `known` and `unknown`.

  ```bash
  node -e 'const p=require("path");import(require("url").pathToFileURL(p.resolve("scripts/ovl/shell-words.mjs")).href).then(({readShell})=>{for(const cwd of [process.cwd(),p.join(process.cwd(),"gone")])console.log(readShell("git switch x",{cwd}).segments[0].cwd===null?"unknown":"known")})'
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
- A full shell parser: shell-1 reads the forms K-0090 classes M and U, the section 10 rows it marks
  model and the section 11 runners it marks M; the rows it marks unknown make the call unknown
  (unknown-1); the B and S classes are Honest limits.
- The subagent rule of ORV-93 and the main session's literal-name rule, beyond the here-document body
  they no longer read (resolve-1 (f)).
- The CI timing bound of `packages/intent-engine/src/page-text.test.ts` (RV2-6): its own issue.

## Honest limits

ORV-96, `write-guard` resolve-1 on shell-1 (a guard rail; each class is named once, and a bypass of a
named class is not a new finding, L-0012). The classes K-0090 marks B (section 8), the state it marks
S, and the shell:

- The shell. Claude Code runs a Bash call in the user's shell, zsh on the owner's machine, with the
  profile's aliases and functions. shell-1 reads the forms bash and zsh share and the zsh forms
  K-0090 section 10 marks model. The call's shell is not interactive (the ORV-138-review-2 and
  ORV-138-security-2 runs: zsh 5.9, `interactive_comments` off, a comment skipped), so a `#` word
  starts a comment (shell-1 (a)); an interactive shell, and an option or `histchars` value set before
  the call, are state (K-0090 C8, Q5). A zsh-only form is a named bypass: `=name` expansion outside
  command position, `${~X}` and the other expansion flags, an alias (Z1), and a profile option that
  changes how a word expands. Glob qualifiers (`*(.)`) and extglob patterns with `(` are no longer
  in this class: they make the call unknown (unknown-1, S11).
- The desync line (v1.7, ORV-138-sec-F8): a place where the reader's quote, brace, arithmetic or
  here-document state parts from the shell's. The reader then reads a wrong list of segments instead
  of marking the call unknown, since unknown-1 holds only the members it lists, so the call fails
  open: the lines the shell runs and the reader swallows are not judged. The four forms sec-F8 found
  (the ORV-138-security-3 probe on 9b9d155), each with a hidden
  `cd .oriv?lo/owner-approvals && printf x > 7.json` that `write-guard` allowed and the shell ran:
  - a single quote inside a `${ }` default value, under zsh: in `x=; echo "${x:-'}"` NL a hidden line
    NL `echo "'}"`, the reader takes the `'` as opening a quote that runs to the next `'`, two lines
    down, while zsh ends `${x:-'}` at its first `}` and runs the hidden line (bash does not). Allowed
    as the main session and as a subagent;
  - an assignment before `[[`, under bash 3.2: in `x=1 [[ a > 7.json ]]` the `[[` is no reserved
    word, so bash takes `>` as a redirect and writes `7.json`, while the reader reads the words as the
    condition of shell-1 (g) (H19);
  - a quoted here-document delimiter line with trailing text, under bash: in `x=$(cat <<'E'` NL `hi`
    NL `E)` NL a hidden line, bash ends the body at the line `E)` and runs the next line, while the
    body end of shell-1 (f) (H15) does not end it there;
  - a quoted `))` inside `$(( ))`, under bash: in `echo $(( '))' + $(<hidden command>) ))` bash runs
    the hidden command, and the reader's arithmetic state (shell-1 (a)) gives it no segment.

  The first, third and fourth forms hide a `git switch x` the same way (the ORV-130 part). A hidden
  target written as a glob (`.oriv?lo`) names no literal `.orivilo` for the text rules to find. No
  form in "Write-guard forms to keep" or "Branch forms to keep" has these shapes: the commit and PR
  body forms end the body at a line that is exactly `EOF` and close the substitution on the next
  line. A follow-up issue surveys the whole class (L-0045): every place where the reader's quote,
  brace, arithmetic or here-document state can part from zsh or from bash (`${ }` and `$[ ]` values,
  an assignment before `[[`, a delimiter line with trailing text, a quoted `))` in `$(( ))` or
  `(( ))` among them), and makes a form unknown (unknown-1) where the reader cannot match both
  shells.

- `eval`, and `sh -c`, `bash -c`, `zsh -c` and every other interpreter with a program in a word
  (`node -e`, `python3 -c`, `perl -e`) or in a quoted-delimiter here-document body (`sh <<'EOF'`,
  `python3 - <<'PY'`; v1.5), which the text rules do not read (resolve-1 (f)); `source` or `.` of a
  file; a script the session wrote and then runs (`node /tmp/x.mjs`); an encoded command piped to a
  shell (`echo <base64> | base64 -d | sh`).
- `xargs` and `find -exec`: the program takes its arguments from input
  (`printf '\x2eorivilo/owner-approvals/7.json' | xargs touch`).
- The content line (v1.6, RV3-1): a write program whose targets come from the content it reads, not
  from its words, so resolve-1 (a) judges only the words and never the targets. One such program is
  `git apply` with a patch from a quoted-delimiter here-document (`git apply <<'EOF'` with a patch
  that creates `.orivilo/owner-approvals/7.json` or changes a guard file), whose body the text rules
  do not read since v1.4 (resolve-1 (f)), or from a file (`git apply /tmp/x.patch`). Both forms pass
  as the main session and as a subagent, and zsh and bash write the file (the ORV-138-review-3 probe
  on c490d76); the file form passed on ad941b2 too. A patch after an unquoted delimiter is still read
  by the text rules, and the probe's unquoted form was blocked.
- A variable, substitution, alias or function that holds a command: an unknown command name
  (`$W x`, `$(printf tee) x`), an alias from the profile or an earlier call, a function defined
  earlier, a git alias (`git rs x` for `git restore x`), and `git --exec-path=<path>`. (`env -S` left
  this class in v1.4: it makes the call unknown, unknown-1.)
- A runner K-0090 did not read, which shell-1 (d) does not skip, so the command after it is not
  judged: `strace`, `ltrace`, `valgrind`, `gdb --args`, `nsenter`, `unshare`, `runuser`, `su -c`,
  `systemd-run`, `firejail`, `bwrap`, `fakeroot`, `faketime`, `eatmydata`, `ssh`, `docker exec`,
  `kubectl exec`, `direnv exec`, `mise exec`, `asdf exec`, `uv run`, `poetry run`, `bundle exec`,
  macOS `taskpolicy`, `ktrace` and `dtruss`, and `busybox` (K-0090 section 11b, the programs not
  read; `find -exec` is in the line above); and `pnpm` with an option before `exec`, whose own
  options K-0090 did not read.
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
  an exported `GIT_DIR` or `GIT_WORK_TREE` for a git write program, and which program `xcrun`,
  `env -P`, `pnpm exec` and `npx` find (K-0090 section 11b).
- A write program outside the write-form list: `dd of=`, `install`, `rsync`, `tar -x`, `unzip -d`,
  `curl -o`, `wget -O`, `git clone`, `mkdir`; the `nohup.out` that `nohup` writes; and the file a
  runner of "Runner grammar" writes by its own option or word: the `-o` or `--output` value of
  `time`, the lock file of `flock` and `lockf`, the file of `script` and its default `typescript`,
  and the files of `sudo -e` (K-0090 section 11b).
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
- Cost: the subagent rule of ORV-93 is kept, so a subagent call that names a protected path in any
  word and holds a write form by its text test is still blocked, a `>` inside a quoted program after
  a `$(` included (sec-F4). Since v1.4 the text rule skips the body of a quoted-delimiter
  here-document (resolve-1 (f), RV2-3), so a report written that way passes; a body after an
  unquoted delimiter is still read.
- Cost: under unknown-1 a call that holds one of its forms is blocked: an array assignment
  `x=(a b)` and a function definition `f() { ...; }` (S11), a here-document in a substitution that
  closes on its own line (H4, H5), every `watch` (`watch -x` included), a runner option its row does
  not give, and a call longer than 200,000 characters. Write a here-document whose substitution
  closes on a later line, as the commit form does, split the call, or use the Write tool.

ORV-130, `worktree-guard` switch-1 on shell-1 and `envelope-guard` branch-key-1:

- The classes K-0090 marks B hide a switch as they hide a write: `eval "git sw""itch x"`,
  `sh -c 'git switch x'` and every other interpreter, a script, `xargs`, a variable, alias or
  function that holds `git` or the switch (`$G switch x`, an alias `gs` from the profile), a git
  alias (`git co x`), and `git --exec-path=<path>`. So do the runners K-0090 did not read (the
  runner line of the ORV-96 part), such as `ssh localhost git -C <main> switch x`.
- The shell line of the ORV-96 part holds here: Claude Code runs the call in the user's shell, zsh on
  the owner's machine, with the profile's aliases and functions; shell-1 reads the forms that line
  names, and the zsh-only forms it lists are named bypasses.
- The desync line of the ORV-96 part holds here (v1.7, sec-F8): with a hidden `git switch x` in
  place of the write, its first, third and fourth forms pass `worktree-guard` as a bound main-session
  call, and zsh (the first) or bash (the third and fourth) switches the bound checkout (the
  ORV-138-security-3 probe on 9b9d155).
- State from before the call: an exported `GIT_DIR` or `GIT_WORK_TREE`, `core.worktree` set in a git
  config file or by `-c core.worktree=<path>`, and CDPATH.
- A subagent's switch is not judged.
- A stuck bound envelope blocks every switch in its checkout until it is closed; the stall check (ovl
  skill section 2) raises it first.
- Cost: while any envelope is bound, switch-1 (c) blocks a switch whose checkout is unknown
  (`cd - && git switch x`); name the checkout with a literal `git -C <path>`. A switch after
  `cd <path>;` is judged against both folders (shell-1 (e)); join the two with `&&`.
- Cost: while any envelope is bound, switch-1 (d) blocks every main-session call that shell-1 marks
  unknown, a call with no switch in it included (the Cost line of unknown-1 in the ORV-96 part lists
  the forms).

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
11. `#` in shell-1 (a) (v1.4). Options: a comment to the end of its line, as non-interactive zsh and
    bash read it (default, v1.4; the Bash tool's zsh 5.9 is not interactive and has
    `interactive_comments` off, by the RV2-1 and sec-F5 live checks); or v1.2's live reading of the
    text after `#`. Impact: the live reading was not fail closed: a quote in a comment opened a quote
    the shell never opens, and the next lines read as one word (RV2-1, sec-F5 (1)). An interactive
    shell is state from before the call (K-0090 C8, Honest limits).
12. The effective cwd of shell-1 (e). Options: a set of folders (default), or one folder that each `cd`
    replaces. Impact: one folder lets `false && cd /tmp; printf x > settings.json` from a cwd at
    `<main>/.claude` write the hook wiring, and `true || cd <unbound> && git switch x` switch a bound
    checkout; the set judges a target after a `cd` that may be skipped against both folders.
13. An unknown checkout with no bound envelope (switch-1), other than a git top that cannot be read
    (switch-1 (c)). Options: allowed (default), or blocked.
    Impact: blocking would stop `cd - && git switch x` in a session with nothing bound.
14. The files a runner writes by its own option or word (`time -o`, the `flock` and `lockf` lock
    file, the `script` file, `sudo -e`; K-0090 section 11b). Options: an Honest limit, with the other
    write programs outside the list (default, v1.4); or resolve-1 (a) write targets. Impact: the
    second adds five write forms to resolve-1 (a) and their tests; the orchestrator decision for v1.4
    covers skipping runners, not judging their own files.
15. `watch -x` (v1.4). Options: unknown, with every `watch` (default, the orchestrator decision); or
    skipped as a runner, as K-0090 marks `watch -x` M. Impact: the default blocks `watch -x` in
    `write-guard`, and in `worktree-guard` while an envelope is bound.

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
  switch-1 and resolve-1 (L-0045). Its sections 10 (where a one-pass reader can part from the shell,
  rows C1 to C8, Q1 to Q5, H1 to H20, S1 to S11, Z1 to Z8) and 11 (runners, 11a and 11b), commit
  985cae9, bound unknown-1 and shell-1 (d) in v1.4.
- The round 4 findings on head 9b9d155, in the git-ignored run records
  `.orivilo/runs/ORV-138/ORV-138-review-4/result.json` (RV4-1) and
  `.orivilo/runs/ORV-138/ORV-138-security-3/result.json` (ORV-138-sec-F8), recorded 2026-10-30; and
  the owner's answer on sec-F8 in the question form on 2026-10-30, "บันทึกเป็นข้อจำกัด (แนะนำ)"
  (record it as a limit, the recommended route).
- The round 3 findings on head c490d76, in the git-ignored run record
  `.orivilo/runs/ORV-138/ORV-138-review-3/result.json` (RV3-1, RV3-2 and RV2-6 again, recorded
  2026-10-30).
- The round 1 re-check findings on head ad941b2, in the git-ignored run records
  `.orivilo/runs/ORV-138/ORV-138-review-2/result.json` (RV2-1 to RV2-6, recorded 2026-10-29) and
  `.orivilo/runs/ORV-138/ORV-138-security-2/result.json` (ORV-138-sec-F5 to sec-F7, recorded
  2026-10-28).
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

- v1.4: answers the round 1 re-check findings of ORV-138-review-2 and ORV-138-security-2 on ad941b2,
  decided by the orchestrator under the owner's delegation (ADR 0012 decision 4) on K-0090 sections
  10 and 11 (commit 985cae9), one bound per class, fail closed. shell-1 (a) reads a `#` word as a
  comment and names the section 10 rows it models; new clause (h) unknown-1 makes a call unknown on
  each section 10 row marked unknown, each section 11 runner form marked B or U, and a call longer
  than 200,000 characters; shell-1 (d) skips the runners of the new "Runner grammar" table; shell-1
  (f) takes a here-document body after the newline at the operator's level and reads a plain
  `$'EOF'` delimiter; shell-1 reads each word in linear time; resolve-1 (g) and switch-1 (d) block an
  unknown call; resolve-1 (f) skips a quoted-delimiter body in the two text rules; switch-1 reads the
  records of `CLAUDE_PROJECT_DIR`. Rows 32, 38 and 41 change; rows 53 to 63 are new; "Branch switch
  forms", "Branch forms to keep" and both write-guard form lists grow; "Runner grammar" and "Unknown
  call forms" are new; four worked examples are new; Honest limits change the shell line and the
  `env -S` lines and add the runner line, the runner write targets and two Cost lines; open question
  11 changes and 14 and 15 are new. Per finding:
  - RV2-1: contract change, shell-1 (a) comments (rows 38 and 53; open question 11).
  - RV2-2: contract change, unknown-1 H4 and H5 and the shell-1 (a) arithmetic shift H17 (rows 54,
    56, 58 and 59).
  - RV2-3: contract change, resolve-1 (f) (row 60; "Write-guard forms to keep").
  - RV2-4: contract change, shell-1 (d) and "Runner grammar" (row 57).
  - RV2-5: contract change, switch-1 reads the records of `CLAUDE_PROJECT_DIR` (row 61).
  - RV2-6: no contract change; CI run 40789926810 passed on ad941b2 after its re-run, and the timing
    bound of `packages/intent-engine/src/page-text.test.ts` is out of scope.
  - sec-F5: contract change; parts (1) and (2) repeat RV2-1 and RV2-2, part (3) is shell-1 (f) H3
    and part (4) is shell-1 (f) H8 with unknown-1 for a `$'...'` delimiter that holds a backslash
    (rows 55 and 56).
  - sec-F6: repeats RV2-4.
  - sec-F7: contract change, shell-1 linear time (row 62).

  Review downstream: `scripts/ovl/shell-words.mjs` and `scripts/ovl/shell-words.test.mjs` (rows 38,
  41, 53 to 57 and 62; the row 38 and row 41 tests change); `scripts/ovl/write-guard.mjs` and
  `scripts/ovl/write-guard.test.mjs` (rows 28, 29, 58 and 60; the row 28 test of the old
  `git status # ;` form changes); `scripts/ovl/worktree-guard.mjs` and
  `scripts/ovl/worktree-guard.test.mjs` (rows 24, 50, 59 and 61); `.claude/skills/ovl/SKILL.md`
  lines 269 to 290 and 459 (row 63); K-0090 line 513, which says the sources do not tell which shell
  runs the call or whether it is interactive (the spec now rests that on the live checks of the two
  run records, not on a page); the PR body's deviation list; and the G1 comment on ORV-138.

- v1.5: answers the two needs_decision items and deviation 1 of ORV-138-build-r3 (round 3, head
  34113b1), decided by the orchestrator under the owner's delegation (ADR 0012 decision 4). No new
  row and no new requirement: switch-1 (c), row 25, the interpreter line of Honest limits (ORV-96
  part) and the Worked examples change. Per item (L-0013):
  - needs_decision 1, an interpreter whose program comes from a quoted-delimiter here-document body
    (`sh <<'EOF'`, `python3 - <<'PY'`): no contract change. resolve-1 (f) skips that body since v1.4
    (RV2-3), so the form passes as the main session and as a subagent (the ORV-138-build-r3 probe;
    the same body after an unquoted delimiter is still blocked). It is a bypass of the named
    interpreter class (L-0012 kind (b)), so the interpreter line names it, with no builder round.
  - needs_decision 2 with deviation 1, a call cwd that is gone: contract change, switch-1 (c) and
    row 25. That cwd is an unknown effective cwd (shell-1 (e)), so with the records read from
    `CLAUDE_PROJECT_DIR` (RV2-5) its switch form is an unknown checkout, blocked only while an
    envelope is bound (open question 13's default). Before round 3 the records came from the cwd,
    and the row 25 test blocked it as a read failure with nothing bound. The read-failure case keeps
    a git top that cannot be read for a folder that exists and records that cannot be read. Row 25
    names the gone-cwd case, and its Check names the test. The code and tests at 34113b1 already do
    this, so no builder round. A new worked example shows the reader's unknown cwd for a folder that
    is gone.

  Review downstream: `scripts/ovl/worktree-guard.test.mjs` lines 230 to 264 (the read-failure test
  of row 25 and the gone-cwd test) and `scripts/ovl/worktree-guard.mjs` lines 50 to 140
  (`switchForms`, `switchBlock`), which already match; `.claude/skills/ovl/SKILL.md` line 471 (the
  `write-guard` Honest limits bullet, which already names a program in a quoted here-document) and
  lines 283 to 286 (the "One issue per checkout" bullet, whose list of unknown checkouts does not
  name a cwd that is gone); and the PR body's deviation list (ORV-138-build-r3 deviation 1).

- v1.6: answers the findings of ORV-138-review-3 on c490d76, decided by the orchestrator under the
  owner's delegation (ADR 0012 decision 4) in POC mode (ORV-137). No new row, no new requirement and
  no rule change: Honest limits, ORV-96 part, gains the content line, and the last sentence of
  resolve-1 (f) points to it. Per finding (L-0013):
  - RV3-1: no contract change. A write program whose targets come from the content it reads
    (`git apply` with a patch from a quoted-delimiter here-document or a file) is a guard-rail bypass
    class (L-0012 kind (b)), so the content line names it, with no builder round and no new test. The
    resolve-1 (a) route (count `git apply`'s targets as unknown, so the call is blocked) is not
    taken: the main session itself applies patch files with `git apply`. resolve-1 (f) no longer says
    a subagent call is blocked never less than by the text rule.
  - RV3-2: no contract change. The merge of `develop` into the branch and the two conflict hunks in
    `.claude/skills/ovl/SKILL.md` (the "One issue per checkout" bullet, and the Issue and Open
    envelope bullets) are builder work; the merge keeps the row 37 bullet, as the binding line of
    Honest limits (recorder part) requires.
  - RV2-6: no contract change. The timing bound is out of scope here; `develop` holds its fix
    (d736b80, ORV-139), which reaches the branch with the RV3-2 merge, and CI on the merged head is a
    G3 precondition, not a spec requirement.

  Review downstream: `.claude/skills/ovl/SKILL.md` line 471 on c490d76 (the `write-guard` Honest
  limits bullet, which does not name the content class); the PR body's deviation list; and the G1
  comment on ORV-138. The code and tests already match.

- v1.7: answers the findings of ORV-138-security-3 and ORV-138-review-4 on 9b9d155. sec-F8 is
  decided by the owner (the question form, 2026-10-30, "บันทึกเป็นข้อจำกัด (แนะนำ)": record it as a
  limit); RV4-1 by the orchestrator under the owner's delegation (ADR 0012 decision 4) in POC mode
  (ORV-137). No new row, no new requirement and no rule change: Honest limits gain the desync line in
  the ORV-96 part and its pointer in the ORV-130 part. Per finding (L-0013):
  - sec-F8: no contract change. The reader-versus-shell quote, brace, arithmetic and here-document
    desyncs that fail open are a guard-rail bypass class (L-0012 kind (b)): a rule-following agent
    writes none of the four forms, and no command of "Write-guard forms to keep" or "Branch forms to
    keep" has their shapes. So the desync line names the class, with no builder round and no new
    test, and a follow-up issue surveys it. The route the finding expects (survey now, make each form
    unknown under unknown-1, and add the forms to the tests of rows 24, 28, 55, 58 and 59) is that
    follow-up's, not this PR's.
  - RV4-1: no contract change. The merge of `develop` (ea032aa) into the branch, with its conflicts
    in `docs/knowledge/README.md` (the K-0089, K-0090 and K-0091 index rows, kept in key order) and
    `scripts/ovl/result-recorder.test.mjs` (the ORV-138 block, the `});` that closes its last test,
    then the ORV-162 block), is builder work. The auto-merged `scripts/ovl/result-recorder.mjs` keeps
    ORV-162's `judgeRoot` and every rule of this spec. The gate on the clean merged head, CI on it and
    the reviewer approve on it are G3 preconditions, not spec requirements.

  Review downstream: `.claude/skills/ovl/SKILL.md` line 489 on 9b9d155 (the `write-guard` Honest
  limits bullet) and lines 305 to 313 (the "One issue per checkout" bullet's list of what
  `worktree-guard` does not see), which do not name the desync class that rows 31 and 52 ask them to
  name; `docs/knowledge/enforcement/K-0090-bash-forms-for-text-guards.md` section 10, whose rows H15
  and H19 are marked model with no word on the trailing-text and assignment-before-`[[` cases; the
  follow-up issue, to be filed, whose key a later revision adds to the desync line; the PR body's
  deviation list; and the G1 comment on ORV-138. The code and tests are unchanged.

- v1.8: answers QA-1 of ORV-138-qa-1 on 00ede5a (row 32 fails), decided by the orchestrator under
  the owner's delegation (ADR 0012 decision 4) in POC mode (ORV-137). No new row, no new requirement
  and no rule change: only row 32 changes. Since v1.4 row 32 said the round 1 re-check fixes follow
  b19fe81 as ORV-96 for shell-1 and `write-guard`, then ORV-130 for `worktree-guard`, and v1.5 to
  v1.7 never restated it. The builders built them as 7e91576 (`fix(ORV-96)`, shell-1 only) and
  34113b1 (`fix(ORV-138)`, the `write-guard` and `worktree-guard` changes with the records root), so
  no ORV-130 commit follows b19fe81. QA-1 accepts a spec revision that restates the order as built,
  with the reason here, or re-keyed commits; the orchestrator chose the revision, so no history is
  rewritten. Row 32 now states the post-v1.4 order as built, the v1.8 commit included. Cost: the
  ORV-130 trace of its round 1 changes (switch-1 (d), the records root; rows 59 and 61) runs through
  34113b1 under the batch key, not a commit keyed ORV-130.

  Review downstream: the PR body's commit list and deviation list; the G1 comment on ORV-138; ORV-130,
  whose trace names 34113b1 for its round 1 changes when it moves on; and the head, which moves with
  this commit, so the owner approval line, the gate, CI and the reviewer and qa passes are needed again
  on the new head. The code and tests are unchanged.
