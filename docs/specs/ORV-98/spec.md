---
issue: ORV-98 (https://tpetkaew.atlassian.net/browse/ORV-98)
lane: L (a new guard, a change to `.claude/settings.json` and the `ovl-doctor` probe list; it changes who may move an issue to G3 PR review)
version: 1.1
---

## Why

ORV-81 splits the AI team loop into slices. Slice C1 shipped as ORV-95 (PR #88): `merge-guard` blocks a merge into `develop` without the records. Slice C2 is this story (ORV-81 delivery slice 6, AC 45 and 46, Hooks `g3-check`). Copy of the issue: `docs/specs/ORV-98/jira-issue.md`.

Until C2 ships, nothing checks a Jira move to "G3 PR review":

1. **A session can move an issue to G3 on its own say-so.** A status move through the Atlassian MCP tools runs whether or not the issue's PR is merged into `develop` and whether or not its qa, reviewer, gate and check records hold. AGENTS.md says G3 PR review means "merged into `develop`" (ADR 0012), and nothing holds a session to it.
2. **An unknown transition goes through.** A transition id or a transition name that maps to no known status is sent to Jira as is, so a guard that judges only named targets could be passed by an id or a name it does not know.

Nothing in this story is AI. `g3-check` is a deterministic read of the tool input, a committed id list, the PR list as GitHub reports it, and the run records, through `merge-check`.

**What `g3-check` is for.** Like `merge-guard` (ORV-95 v1.5, comment 10109), `g3-check` is a guard rail for agents that follow the rules: it stops a session that moves an issue to G3 by habit or by mistake before the merge and the evidence exist, and it tells that session which record is missing. It is not a boundary against a session that sets out to defeat it: Jira can be moved in its web UI, through its REST API, or by a tool name the matcher does not know (Honest limits). A review or qa finding of that class is recorded in Honest limits, with no code change, unless the owner decides otherwise.

## Decisions this spec relies on

- ORV-81 spec v1.5 (`docs/specs/ORV-81/spec.md`): AC 45 and 46; Hooks (`g3-check`, fail closed, heartbeat, `ovl-doctor` probe on `ORV-0`); Rules and bounds (Honest limits: `g3-check` guards the G3 move only; only `merge-guard` and `g3-check` run their checks from the develop export; delivery slice 6).
- ORV-95 spec v1.6 (`docs/specs/ORV-95/spec.md`): the develop export (`ensureDevelopExport` in `scripts/ovl/develop-export.mjs`), the records stage (`runMergeCheck` in `scripts/ovl/merge-check.mjs`) and what it reads; the three-stage split (text rules from the session's checkout, record checks from the export); the guard-rail framing (ORV-95 comment 10109).
- ORV-93 spec v1.3: `scripts/ovl/` and `.claude/hooks/` are guard files; `write-guard` form (b) lets the main session run `node scripts/ovl/<name>.mjs`.
- ORV-88 samples (`docs/specs/ORV-88/samples.md`): how hook stdin is recorded in a scratch project with `claude -p`.
- ADR 0012 (G3 PR review means merged into `develop`; decision 4, Claude passes G1 and G2 under the owner's POC delegation, ORV-95 comment 10102), ADR 0013 (records come only from hooks and the ovl scripts).
- L-0010 (one deliverable per builder task) and L-0011 (a contract change from a review goes through a spec revision before the fix).
- The transition ids in the ORV-98 Jira copy, read on 2026-10-24 with `listJiraIssueTransitions` on ORV-93.
- ORV-98 samples (`docs/specs/ORV-98/samples.md`, Build order task 1): the recorded `tool_name` values, the flat `transitionId` and `transitionName` fields, and the twelve transitions with their names and target statuses, the same on ORV-98, ORV-97 and ORV-93.
- ORV-98 comment 10114: the decision to read `transitionId` and `transitionName`, map a name to an id through `jira-transitions.json` by transition name, and fail closed on an unknown name or on a call with neither.

### Decided in this spec

**Two stages, like `merge-guard`.**

1. The **call stage**, `scripts/ovl/g3-check.mjs` run from the session's own checkout by `.claude/hooks/g3-check.mjs` through `runHook("g3-check", ...)` from `scripts/ovl/hook.mjs`. It reads the tool input and `scripts/ovl/jira-transitions.json`, makes no network call and reads no record. It allows every transition to a status other than G3 PR review, and blocks an id or a name it does not know.
2. The **records stage**, `node <export>/scripts/ovl/g3-check.mjs <ISSUE>`, run only for a move to G3 PR review, from the develop export that `ensureDevelopExport({cwd})` builds (no change to `develop-export.mjs`). Exit 0 allows; any other exit blocks, and its stderr lines become the reasons. When the export has no `scripts/ovl/g3-check.mjs`, the move blocks; there is no fallback to the branch copy.

**No new records stage.** The records stage finds the issue's merged PR and calls `runMergeCheck([<n>, "--head", <headRefOid>], {cwd, env})` from the same export. So the G3 move rests on exactly the checks `merge-guard` makes at merge time (qa, reviewer, gate record, checks with the Vercel waiver, screenshots, `write_set` union, owner approval for a guard file, the docs-only rule), judged again on the merged head. `merge-check.mjs` and `merge-check-facts.mjs` do not change.

**Which PR.** `gh pr list --base develop --state all --search "<ISSUE> in:title" --limit 100 --json number,state,title,headRefName,headRefOid,mergedAt`. A PR belongs to the issue when its head branch key (`<type>/<ISSUE>-<slug>`, as `merge-check` reads it) and its title key (`<ISSUE>:`) both equal the issue. Then:

- 100 entries returned: fail closed, the list may be cut.
- An `OPEN` PR of the issue: block, the issue's work is not all merged.
- No `MERGED` PR of the issue: block.
- Otherwise the `MERGED` PR with the latest `mergedAt` is judged by `runMergeCheck`.

**The id list.** `scripts/ovl/jira-transitions.json` is `{"project": "ORV", "recorded": "2026-10-24", "source": "listJiraIssueTransitions on ORV-98, ORV-97 and ORV-93", "transitions": {"<id>": {"name": "<transition name>", "to": "<target status>"}}}` with the twelve transitions of `docs/specs/ORV-98/samples.md`. A transition's name is not always its target status: id `11` is named `To Do` and goes to Backlog, id `21` is named `In Progress` and goes to Discovery, id `31` is named `In Review` and goes to G1 Scope review. The G3 target is the status `G3 PR review` (id `4`, also named `G3 PR review`). The call stage reads the list from the session's checkout (open question 6).

**What the call stage reads.** The recorded samples (`docs/specs/ORV-98/samples.md`) show two flat string fields that name a move, and no `transition` object:

- For `transitionJiraIssue`: `tool_input.issueIdOrKey`, `tool_input.transitionId` and `tool_input.transitionName`.
- For `executeWrite` and `executeDestructive`: it acts only when `tool_input.name` is `transitionJiraIssue`, and reads the same three fields under `tool_input.inputs`; any other `name` is allowed before the id list is read. `cloudId` sits at the top level and is not read.

It resolves the move to one entry of the id list (ORV-98 comment 10114):

1. `transitionId` only: the id must be a key of `transitions`. The id is a string of digits or a whole number.
2. `transitionName` only: the name must equal the `name` of exactly one entry, compared exactly (same case, no trimming); that entry's id is the move. A target status that is not a transition name (`Backlog`, `Discovery`), a case variant (`g3 pr review`) or a name of no entry is unknown.
3. Both: each must resolve as above, and to the same id (open question 8).
4. Neither, or a field that is present but not a string (or, for the id, not a whole number): the call names no transition it can judge.

An unknown id, an unknown name, a mismatch, or neither blocks in the call stage and fails closed (ORV-81 AC 46). The resolved entry's `to` decides the rest: `G3 PR review` goes on to the records stage, any other status is allowed.

**The issue key on a G3 move.** The records stage needs the key, so a move to G3 PR review needs `issueIdOrKey` in the form `ORV-<n>`. A numeric Jira id, a lowercase key or another project's key blocks and says to use the key. Moves to other statuses do not read the key.

**The probe.** A move to G3 PR review on `ORV-0`, named by id or by name, blocks in the call stage, with no network call and no export (ORV-81 Hooks: `g3-check` recognises the probe key).

## Story

As the owner, I want an issue to reach G3 PR review in Jira only when its PR is merged into `develop` with the qa, reviewer, gate and check records behind it, and an unknown transition to be refused, so that the Jira board tells me the truth about where the work is without my checking each move.

## Acceptance criteria

There is no UI in this story. Hook and script messages are English developer text on stderr, outside the locale catalog. In the rows, "a move" is a PreToolUse call built from the recorded sample `PreToolUse-mcp-transitionJiraIssue.json` of row 1, with `issueIdOrKey` `ORV-1` and the given `transitionId` (and no `transitionName`); "a named move" is the same with the given `transitionName` and no `transitionId`. "Through `executeWrite`" or "through `executeDestructive`" builds the call from `PreToolUse-mcp-executeWrite.json` or `PreToolUse-mcp-executeDestructive.json` with the same fields under `inputs`. Id `4` (named `G3 PR review`) is G3 PR review and id `3` (named `Build`) is Build. PR `7` is ORV-1's, head branch `feature/ORV-1-x`, title `ORV-1: x`, base `develop`, state `MERGED`, head `H`. "Fixture gh" is a stub `gh` on `PATH` that prints the recorded samples, edited per row, and counts its calls; "fixture origin" is a local bare repo whose `develop` holds the branch's own `scripts/ovl/` committed, as in the ORV-95 tests. Unless a row says otherwise, ORV-1 has no open PR and PR 7's records pass `merge-check` (ORV-95 row 15). Every row with a hook call writes one heartbeat line `{hook: "g3-check", event: "PreToolUse", at, tool, agent_id, decision}` through `beat()` in the records root.

<!-- prettier-ignore -->
| # | Given | When | Result | Data effect | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | No recorded Atlassian MCP PreToolUse stdin exists in the repo | Build order task 1 records it | `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-transitionJiraIssue.json`, `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeWrite.json` and `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeDestructive.json` exist, plus `scripts/ovl/fixtures/gh/pr-list.json`. `docs/specs/ORV-98/samples.md` names the Claude Code version, the exact `tool_name` for the claude.ai connector and for the `.mcp.json` server `atlassian` (each recorded, or marked not reachable), every `tool_input` field (the flat `transitionId` and `transitionName`), the `gh pr list` command and the issue it ran on, the transitions (id, name, target status) read on a second issue in another status, and marks each fixture recorded or derived | The fixtures and the note, committed (commit 5f37ff1); no Jira issue changed status | `test -f scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-transitionJiraIssue.json` |
| 2 | A move with id `3`, `10`, `21` and `9`, one call each; a named move with `Build`, `In Progress` and `To Do`, one call each; then the same seven through `executeWrite` and through `executeDestructive` with `name` `transitionJiraIssue`; then a move with `transitionId` `21` and `transitionName` `In Progress` together | The hook runs | Exit 0 for each: a known id, or a known transition name resolved to its id through `scripts/ovl/jira-transitions.json`, to a status other than G3 PR review is allowed. No `gh` call and no export is made | Heartbeat `allow` | `g3-check` test with fixture gh counting calls |
| 3 | `executeWrite` with `name` `addCommentToJiraIssue`, and with `name` `createJiraIssue`, whose inputs hold no transition | The hook runs | Exit 0 for each. The id list is not read | Heartbeat `allow` | `g3-check` test |
| 4 | A move with id `99`; with id `"4a"`; a named move with `Backlog` (a target status, not a transition name); with `g3 pr review`; with `Nope`; a call with neither `transitionId` nor `transitionName`; a call with `transitionName` `42` (not a string); a move with `transitionId` `3` and `transitionName` `G3 PR review` together; each of these directly, through `executeWrite` and through `executeDestructive` | The hook runs | Exit 2 for each. stderr starts `g3-check blocked:` and says the transition id or name is not in `scripts/ovl/jira-transitions.json`, that the call names no transition, or that the id and the name name different transitions, so an unknown target fails closed (ORV-81 AC 46) | Heartbeat `block`; no `gh` call | `g3-check` test |
| 5 | `scripts/ovl/jira-transitions.json` missing; not valid JSON; with no `transitions` object; with no entry whose `to` is `G3 PR review`; with an entry that has no `name` or no `to`; with two entries of the same `name` | A move with id `3`, and a named move with `Build` | Exit 2 for each. stderr starts `g3-check failed closed:` and names the id list | Heartbeat `error` | `g3-check` test, the id list path passed through a function parameter |
| 6 | The real `scripts/ovl/jira-transitions.json` | The test reads it | It holds exactly the twelve transitions of `docs/specs/ORV-98/samples.md`, each id with its name and target status: id `4` named `G3 PR review` to `G3 PR review`, id `11` named `To Do` to `Backlog`, id `21` named `In Progress` to `Discovery`, id `31` named `In Review` to `G1 Scope review`, and every other id named as its target status | None | `g3-check` test |
| 7 | A move with id `4`, fixture gh listing PR 7 as ORV-1's only PR, records passing; the same as a named move with `G3 PR review`; the same through `executeWrite` | The hook runs | Exit 0 for each: PR 7 is merged into `develop` and `merge-check` passes on `H` from develop's export. The named move is judged exactly as id `4` | Heartbeat `allow`; only the export folder under `.orivilo/exports/` is written | `g3-check` test with fixture gh and fixture origin |
| 8 | Row 7 with no PR of ORV-1 in the list; with PR 7 `CLOSED` and not merged; with PR 7 `OPEN`; the first case again as a named move with `G3 PR review` | A move with id `4` | Exit 2 for each. stderr says no PR of ORV-1 is merged into `develop`, or names the open PR (ORV-81 AC 45) | Heartbeat `block` | `g3-check` test |
| 9 | Row 7 plus an `OPEN` PR 9 of ORV-1 into `develop` | A move with id `4` | Exit 2. stderr says PR 9 of ORV-1 is open, so its work is not all merged | Heartbeat `block` | `g3-check` test |
| 10 | Row 7 with no `qa.json` for ORV-1; with no `reviewer.v1` approve on `H`; with no gate record for `H`; with the `ci` check `fail` | A move with id `4` | Exit 2 for each. stderr starts `g3-check blocked:` and holds the `merge-check` reason for PR 7 (the same line `merge-check` prints for that case) (ORV-81 AC 45) | Heartbeat `block` | `g3-check` test |
| 11 | Two merged PRs of ORV-1: PR 5 with passing records, merged first; PR 7 with no `qa.json`, merged later | A move with id `4` | Exit 2 naming PR 7: the PR with the latest `mergedAt` is judged | Heartbeat `block` | `g3-check` test |
| 12 | Row 7 with a PR whose head branch is `feature/ORV-1-y` and title `ORV-10: y`; with a PR `feature/ORV-10-z` titled `ORV-1: z`; each the only PR in the list | A move with id `4` | Exit 2 for each: a PR belongs to the issue only when its head branch key and title key are both `ORV-1`, so no merged PR is found | Heartbeat `block` | `g3-check` test |
| 13 | Fixture gh printing 100 entries; printing text that is not JSON; exiting 1; `gh` missing from `PATH` | A move with id `4` | Exit 2 for each, never 0. stderr starts `g3-check failed closed:` or, for the 100 entries, says the PR list may be cut | Heartbeat `block` or `error` | `g3-check` test |
| 14 | Row 10's first case, with the branch's `scripts/ovl/g3-check.mjs` and `merge-check.mjs` each replaced by one that writes a marker file and exits 0, develop's copies unchanged | A move with id `4` from the PR's worktree | Exit 2 from develop's copy, naming the missing `qa.json`. The marker file does not exist | Heartbeat `block` | `g3-check` test (ORV-81 AC 59 for the G3 move) |
| 15 | Row 7 while the fixture origin's `develop` has no `scripts/ovl/g3-check.mjs`; while `git ls-remote` fails | A move with id `4` | Exit 2 for each. The first says develop has no `scripts/ovl/g3-check.mjs` yet, so the owner moves the issue in the Jira web UI; the second starts `g3-check failed closed:` and names the step. The branch's own `g3-check.mjs` is not run as the records stage | Heartbeat `block` or `error` | `g3-check` test |
| 16 | A move with id `4` and `issueIdOrKey` `10123`; `orv-1`; `SCRUM-1`; a named move with `G3 PR review` and `issueIdOrKey` `10123` | The hook runs | Exit 2 for each. stderr says a move to G3 PR review names the issue by its key `ORV-<n>`. No `gh` call | Heartbeat `block` | `g3-check` test |
| 17 | A move with id `4` on `ORV-0`, directly, through `executeWrite` and through `executeDestructive`; a named move with `G3 PR review` on `ORV-0` | The hook runs | Exit 2. stderr says `ORV-0` is the ovl-doctor probe. No `gh` call and no export | Heartbeat `block` | `g3-check` test |
| 18 | `node scripts/ovl/g3-check.mjs ORV-1` with row 7's fixtures; with row 10's first case; with no argument; with `ORV-1 extra` | The main session (a pre-check, `write-guard` form (b)) | Exit 0; then exit 2 with row 10's reason; then exit 2 with `g3-check failed closed:` and the usage line for the last two | None: the script writes nothing | `g3-check` test |
| 19 | Malformed stdin; `tool_input` missing; a `tool_name` that matches no Atlassian transition tool; `cwd` outside any repo | The hook runs | Exit 2 for each, never 0. stderr starts `g3-check failed closed:` | Heartbeat `error` when a records root is found | `g3-check` test (ORV-81 AC 47, 48) |
| 20 | A move whose `tool_input` also holds `fields` and a comment with `CANARY`, once allowed (id `3`) and once blocked (id `99`); a named move with `transitionName` `CANARY` | The hook runs | Exit as rows 2 and 4 say. `CANARY` is in neither stderr nor `heartbeat.jsonl`; an unknown name is reported as unknown, not quoted. stderr names only the rule, the issue key, PR numbers, SHAs and `merge-check` reasons, each cut at 200 characters with control characters removed | Heartbeat with the six `beat()` fields only | `g3-check` test |
| 21 | `.claude/settings.json` is read | Test | `g3-check` is registered once, in a PreToolUse entry whose matcher is the one below, with the command below, and on no other event | None | `g3-check` test reading the real `.claude/settings.json` |
| 22 | `node scripts/ovl/doctor.mjs plan`; then `check <since>` with no `g3-check` `block` line since `<since>`, then with one | Main session | `plan` lists `g3-check` with a probe: the recorded claude.ai connector `tool_name` `mcp__claude_ai_Atlassian_MCP__transitionJiraIssue` and `tool_input` `{cloudId: "tpetkaew.atlassian.net", issueIdOrKey: "ORV-0", transitionId: "4"}`. `check` exits 2 naming `g3-check`, then exits 0 | None | `ovl-doctor` test |
| 23 | The planned probe, made for real in the owner's Claude Code session after the branch's settings load | Main session | Claude Code shows the call blocked with row 17's stderr; `doctor.mjs check <since>` then exits 0. ORV-0 does not exist, and nothing reaches Jira | Heartbeat `block` from the live hook | `doctor.mjs check <since>` exit code, quoted in the G3 packet |
| 24 | `.claude/skills/ovl/SKILL.md` is read | Reviewer | Step 1 names the `g3-check` probe. A step after the merge says the G3 move is a Jira transition with `transitionId` `4` (or `transitionName` `G3 PR review`) on the issue key, made after the merge, and that `node scripts/ovl/g3-check.mjs <ISSUE>` is its pre-check. Honest limits state the `g3-check` limits below. "Not in this slice" no longer says nothing checks the G3 move | None | `grep -n "g3-check" .claude/skills/ovl/SKILL.md` |

Row 21's matcher is `^mcp__.*[Aa]tlassian.*__(transitionJiraIssue|executeWrite|executeDestructive)$` and its command is `node "$CLAUDE_PROJECT_DIR/.claude/hooks/g3-check.mjs" || exit 2` (written here, not in the table, because a table cell must not hold a pipe character: `result-recorder` splits rows on it). Row 1 recorded `mcp__claude_ai_Atlassian_MCP__transitionJiraIssue`, `mcp__claude_ai_Atlassian_MCP__executeWrite` and `mcp__claude_ai_Atlassian_MCP__executeDestructive`, and the matcher matches all three. The `.mcp.json` server `atlassian` was not reachable headless; its expected names `mcp__atlassian__<tool>` match through `[Aa]tlassian` but are not recorded (Honest limits). Row 21's test also asserts the matcher matches the three recorded names and not `mcp__claude_ai_Atlassian_MCP__executeRead`.

Rows 2 to 22 run under `pnpm test:scripts`. A test feeds a recorded sample this way: it reads the fixture JSON (`PreToolUse-mcp-transitionJiraIssue.json`, `PreToolUse-mcp-executeWrite.json` or `PreToolUse-mcp-executeDestructive.json`), sets `cwd` to a fixture repo, sets `issueIdOrKey`, `transitionId` and `transitionName` (or the same fields under `inputs`) and `name` per row, removing `transitionId` when a row names only `transitionName` and the reverse, keeps every other recorded field, and pipes it to `.claude/hooks/g3-check.mjs` with `runNode` from `scripts/ovl/hook-test-kit.mjs`, with fixture gh first on `PATH`. Row 23 is the only live check; it counts for G3 only when the packet quotes the command and its exit code.

## Rules and bounds

- **Always on.** Once registered, `g3-check` runs on every Atlassian MCP transition in every Claude Code session in this repo, inside `/ovl` or not.
- **Deterministic.** No model is called. The call stage reads the tool input and the id list; the records stage reads the PR list, the PR, its checks and the records.
- **An id or a name, judged the same.** A move named by `transitionId` and a move named by `transitionName` resolve to one entry of the id list and are judged alike (rows 2, 7, 17). A name is matched exactly against the transition names in `jira-transitions.json`, never against target statuses and never loosely.
- **Cheap for every other move.** A move to any status other than G3 PR review is decided in the call stage, with no network call (row 2).
- **Fail closed.** Every non-zero exit is 2 and the registration ends in `|| exit 2`. A step that cannot run (no network, no `gh`, an id list or a record that cannot be read) blocks the move. An unknown id, an unknown name, an id and a name that disagree, or a call with neither blocks the move (row 4).
- **No fallback.** A G3 move is never judged by the branch's own `g3-check.mjs` or `merge-check.mjs` as the records stage (row 14).
- **Records stay read-only.** The guard writes its heartbeat line and, through `ensureDevelopExport`, the export folder. `g3-check.mjs` writes nothing else.
- **Untrusted text.** The tool input, PR titles and check text are data, never run and never echoed in full (row 20).
- **The owner's own hand.** A PR the owner merged in the GitHub web UI without the full records (as the C1 PR was) cannot pass the G3 move through a session. The owner moves such an issue in the Jira web UI; there is no override record (open question 7).
- **One PR, two builder tasks.** The slice ships as one PR into `develop`, `ORV-98: g3-check ...`, about 400 changed lines (Build order). It changes guard files, so its merge needs the owner approval record (ORV-95 row 26).

## Impact (Lane L)

- New guard files: `.claude/hooks/g3-check.mjs` (launcher), `scripts/ovl/g3-check.mjs`, `scripts/ovl/g3-check.test.mjs`, `scripts/ovl/jira-transitions.json`.
- New recorded fixtures (committed in 5f37ff1): `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-transitionJiraIssue.json`, `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeWrite.json`, `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeDestructive.json`, `scripts/ovl/fixtures/gh/pr-list.json`. New note: `docs/specs/ORV-98/samples.md`.
- `scripts/ovl/jira-transitions.json` holds each transition's name beside its target status, so a `transitionName` resolves to an id.
- Changed guard files: `.claude/settings.json` (one PreToolUse entry), `scripts/ovl/doctor.mjs` and `scripts/ovl/doctor.test.mjs` (one `PROBES` entry).
- Changed contract text: `.claude/skills/ovl/SKILL.md` (row 24).
- Read, not changed: `scripts/ovl/develop-export.mjs`, `scripts/ovl/merge-check.mjs`, `scripts/ovl/merge-check-facts.mjs`, `scripts/ovl/hook.mjs`, `scripts/ovl/hook-test-kit.mjs`.
- No schema, token, component API or resolver change, and nothing in `packages/` or `apps/`. `qa.v1`, `reviewer.v1` and `envelope.v1` do not change.

Downstream artifacts to review when this spec is accepted:

- `docs/specs/ORV-81/spec.md` Hooks, `g3-check`: the matcher adds `executeDestructive`; the guard reads the flat `transitionId` and `transitionName` (not `transition.id`) and resolves a name through the id list; the latest merged PR is judged, an open PR blocks, a G3 move needs the `ORV-<n>` key; the id list is read from the session's checkout. A version bump with a changelog line.
- `docs/specs/ORV-95/spec.md` Honest limits, "Moves to G3, Staging and Done are not guarded here": now the G3 move is guarded by ORV-98; a changelog line.
- `.claude/skills/gate-packet/SKILL.md`: the G3 packet quotes the `g3-check` heartbeat line of the move (slice D may fold this in).
- `docs/context/handoff.md` and `docs/plans/master-plan.md`: C2 moves from next to done at release.

## Honest limits

- **`g3-check` is a guard rail, not a boundary.** It keeps a session that follows the rules from moving an issue to G3 early. It does not hold against a session that sets out to defeat it.
- **Other ways to move Jira are not seen.** The Jira web UI, the Jira REST API through `curl` or a script, a Jira automation rule, and an Atlassian MCP tool whose name the matcher does not hold all move an issue with no check.
- **The call stage runs from the session's checkout.** A builder whose `write_set` lists `scripts/ovl/g3-check.mjs`, `scripts/ovl/jira-transitions.json`, `.claude/hooks/g3-check.mjs` or `.claude/settings.json` can weaken it (remap id `4`, for example) for its own worktree until the merge. Each is a guard file, so the merge needs the owner's approval record, as for `merge-guard` (ORV-81 open question 13).
- **Only the G3 move is guarded.** Moves to Staging, G4, Release, G5 and Done are allowed by any known id (ORV-81 Honest limits).
- **Only the latest merged PR is judged.** An earlier merged PR of the issue was judged by `merge-guard` at its own merge, or merged by hand before C1.
- **The records can be forged by a Bash call that hides `.orivilo`** (ORV-95 finding F5, ORV-96), and the G3 move then passes as a merge would.
- **The ids and names are this project's, read once.** A change to the Jira workflow changes the ids or the names; until `jira-transitions.json` is re-recorded, a new id or name blocks, and a reused id or a renamed transition maps to its old status.
- **A name is matched exactly; Jira may match it loosely.** If Jira accepts a case variant or a trimmed name, `g3-check` blocks that call as unknown. This fails safe; the session retries with the exact name or the id.
- **When a call holds both an id and a name, Jira's rule is not recorded.** `g3-check` blocks unless both resolve to the same transition, so either one Jira might use is judged.
- **The execute-tier shape is the model's choice.** `discover` lists `transitionJiraIssue` as a primary tool only, with no execute-tier route; the `executeWrite` and `executeDestructive` fixtures hold what the model sent to the hook, and the server may refuse that call. `g3-check` judges it anyway.
- **The `atlassian` server is not recorded.** The `.mcp.json` server needs authorization and was not reachable headless; its `tool_name` values are expected, not seen. Row 23 shows the live name in the owner's session.
- **A G3 move needs the network**, as a merge does.
- **Version gap.** The samples come from the `claude` on PATH; the owner's IDE session may run a newer version. A missing field fails closed, and row 23 shows the live tool name.

## Out of scope

- Checks on moves to Staging, G4 review, Release, G5 review or Done.
- Any rule change to `merge-check`, `develop-export`, `merge-guard`, `write-guard` or `result-recorder`.
- ORV-96 (a Bash write that hides `.orivilo`) and ORV-97 (GitHub rulesets).
- Re-recording transition ids automatically, and other Jira projects' workflows.

## Open questions (option, impact, default)

1. **`executeDestructive` in the matcher.** Options: (a) add it beside `executeWrite`; (b) keep ORV-81's two names. Impact: (b) lets a transition sent through the destructive tier pass unchecked if the server accepts it there; (a) costs one word and one row 4 case. Default: (a).
2. **Which merged PR.** Options: (a) the one with the latest `mergedAt`; (b) every merged PR of the issue. Impact: (b) blocks every issue with an earlier hand-merged PR or a PR from before slice A3 wrote records, such as ORV-93; (a) trusts that `merge-guard` judged the earlier ones. Default: (a).
3. **An open PR.** Options: (a) an open PR of the issue into `develop` blocks; (b) it is ignored. Impact: (b) lets the issue reach G3 with part of its work unmerged. Default: (a).
4. **The key on a G3 move.** Options: (a) only `ORV-<n>`; (b) also a numeric id, resolved through Jira. Impact: (b) adds a Jira read the hook cannot make itself; (a) costs a retry with the key. Default: (a).
5. **Are the ids global.** The Jira copy lists one id per target status, read on one issue. Options: (a) treat them as global transitions; (b) record per status. Impact: if Jira gives the same target another id from another status, (a) blocks it as unknown, which fails safe. Default: (a); task 1 reads the list on a second issue in another status, and a difference is a deviation that revises this spec (L-0011). Recorded in v1.1: the same twelve transitions on ORV-98 (Build), ORV-97 (Backlog) and ORV-93 (G3 PR review), so (a) holds.
6. **Where the id list is read.** Options: (a) the session's checkout; (b) the develop export. Impact: (b) puts a network call and an export on every transition, and until C2 is on `develop` it blocks every transition from a session with this branch's settings; (a) leaves the list as weak as the launcher, whose risk the owner accepted for `merge-guard`. Default: (a).
7. **An override for a hand-merged PR.** Options: (a) none, the owner moves the issue in the Jira web UI; (b) an owner record like `owner-approvals`. Impact: (b) adds a record kind and a rule; (a) costs the owner one click in Jira. Default: (a).
8. **A call with both `transitionId` and `transitionName`.** Options: (a) both must resolve to the same transition, else block; (b) judge the id and ignore the name; (c) block every call with both. Impact: (b) is passed if Jira uses the name when both are sent; (c) blocks a harmless call that agrees; (a) judges whichever Jira uses. Default: (a).

## Build order

One PR on `feature/ORV-98-g3-check`. Two builder tasks, each one deliverable, each envelope with `Do not commit or push`, this spec in its `context_pointers` and at most 8 pointers (L-0010). Budget: task 1 about 80 lines (data), task 2 about 300, the skill text about 20.

1. **Samples** (row 1), since no Atlassian MCP stdin is recorded in the repo. Done in commit 5f37ff1 (run `ORV-98-t1-samples-b`); its deviations are folded into v1.1. `write_set`: `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-transitionJiraIssue.json`, `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeWrite.json`, `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeDestructive.json`, `scripts/ovl/fixtures/gh/pr-list.json`, `docs/specs/ORV-98/samples.md`. Method as in ORV-88: a scratch project outside the repo with a recorder hook on PreToolUse matcher `mcp__.*` that saves stdin and exits 2 for any transition tool, so nothing reaches Jira; a `claude -p` run calls `transitionJiraIssue` on `ORV-0` with id `4`, directly and through `executeWrite`, once per Atlassian server it can reach. A server headless `claude` cannot reach is marked so; its sample may be derived from a real `tool_use` in a session transcript (tool name and input) wrapped in the common fields of `PreToolUse-SendMessage.json`, and marked derived. Then `gh pr list` as in Decided on ORV-93 (several merged PRs), and `listJiraIssueTransitions` on ORV-98 (read only) for open question 5. Never transition a real issue. Pointers: `docs/specs/ORV-88/samples.md`, `scripts/ovl/fixtures/hook-stdin/PreToolUse-SendMessage.json`, `docs/specs/ORV-98/jira-issue.md`.
2. **The `g3-check` guard, registered and probed** (rows 2 to 22). `write_set`: `scripts/ovl/g3-check.mjs`, `scripts/ovl/g3-check.test.mjs`, `scripts/ovl/jira-transitions.json`, `.claude/hooks/g3-check.mjs`, `.claude/settings.json`, `scripts/ovl/doctor.mjs`, `scripts/ovl/doctor.test.mjs`. Every new test is shown red before the code that makes it pass, and the report quotes that run. Pointers: the task 1 fixtures and note, `scripts/ovl/merge-guard.mjs` (`recordsStage`), `scripts/ovl/merge-check.mjs`, `scripts/ovl/develop-export.mjs`, `scripts/ovl/hook.mjs`, `scripts/ovl/hook-test-kit.mjs`, `scripts/ovl/doctor.mjs`.
3. A `product` task, not a builder, writes the `ovl` skill text (row 24). `write_set`: `.claude/skills/ovl/SKILL.md`.
4. The main session runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` and `pnpm quality-gate` on the pushed head, then the live probe (row 23) in the owner's session after the branch's settings load.
5. A fresh `qa` and a fresh `reviewer` on the PR head. A finding that changes the contract goes to a `product` revision first (L-0011); a finding of the guard-rail class goes to Honest limits with no builder round, unless the owner decides otherwise.
6. The owner writes the approval record for the head (guard files); the merge goes through `merge-guard`. ORV-98's own G3 move is then the first move judged by `g3-check`, and its G3 packet quotes the heartbeat line.

## Changelog

- v1.0 (2026-10-24): spec. Derives its rows from ORV-81 v1.5 AC 45 and 46 and the `g3-check` Hooks text. Decides the two stages (call stage from the session's checkout, records stage from the develop export), the reuse of `runMergeCheck` on the issue's latest merged PR with no new records stage, the open-PR and key rules, `executeDestructive` in the matcher, the id list format, the `ORV-0` probe, and two builder tasks plus one `product` task.
- v1.1 (2026-10-24): fits the recorded samples of task 1 (`docs/specs/ORV-98/samples.md`, commit 5f37ff1) and ORV-98 comment 10114 (L-0011). The call stage reads the flat `transitionId` and `transitionName` (under `inputs` for `executeWrite` and `executeDestructive`), not `transition.id`; a name maps to an id through `jira-transitions.json` by transition name, matched exactly; an unknown id or name, an id and a name that disagree, or a call with neither fails closed. `jira-transitions.json` holds each transition's name and target status. Fixture names are the recorded `PreToolUse-mcp-transitionJiraIssue.json`, `PreToolUse-mcp-executeWrite.json` and `PreToolUse-mcp-executeDestructive.json`. Rows 1, 2, 4 to 8, 16, 17, 20, 22 and 24 extended; the matcher note, Rules, Impact, Honest limits, open question 5 (recorded) and a new open question 8 updated. Review downstream: task 2 envelope and its tests, `docs/specs/ORV-81/spec.md` Hooks `g3-check` (fields), and row 24's `.claude/skills/ovl/SKILL.md` text.
