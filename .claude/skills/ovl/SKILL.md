---
name: ovl
description: Run work as the orchestrator. Write a checked JSON envelope for each task, dispatch it to one role, and ask the owner for a rework round through a question form. Use to dispatch any subagent in this repo.
---

# ovl

Hooks now check every Agent call in this repo, in every session. The main session plans and dispatches; it does not write the deliverable. Spec: `docs/specs/ORV-81/spec.md`. Decisions: ADR 0013 and ADR 0014.

## The loop

Before planning, read `AGENTS.md`, `docs/context/orivilo-brief.md`, the relevant part of `docs/context/intent-studio-handoff.md`, the Jira issue and `docs/LESSONS.md`. Every dispatch below is one envelope (section 2) to one role.

1. **Lane.** Pick S, M or L from `AGENTS.md`; any risk flag forces L. Write the lane on the issue.
2. **Discover** (M, L). Dispatch `product` with the `discover` skill; it writes `docs/specs/<KEY>/spec.md` with acceptance criteria and open questions. When a slice becomes its own Jira issue, the same `product` task writes `docs/specs/<slice key>/spec.md` (why, the parent spec and its G1 and G2 comments, the slice's acceptance rows copied with their numbers and no new requirement), and the slice's first builder envelope carries the fact `test -f docs/specs/<slice key>/spec.md` (L-0016).
3. **Design** (M, L). Dispatch `ds-architect` for schema, token, recipe or resolver changes and `designer` for flows, states and visual direction. They extend the spec folder. Dispatch `research` first when a design or tech decision rests on an external fact that has no knowledge entry yet, and `architect` when the story changes system architecture, adds an external service, or needs an ADR outside the design system.
4. **G1 and G2.** For lane L, before the G1 packet, dispatch `reviewer` (`reviewer.v1`, docs) on the
   committed spec head; Important findings go back to `product` before the packet, or each is listed in
   the packet next to the decision it touches. The later G3 review of that spec is a re-check from the
   reviewed sha (L-0008, L-0037). No hook checks this; it is the main session's duty. Raise each with
   the `gate-packet` skill, move the issue, and stop. The owner decides; during the POC Claude passes G1
   and G2 under the owner's delegation (ADR 0012 decision 4), and the packet says so.
5. **Build.** Dispatch `builder` per task, each in its own worktree. A blocker comes back in `blocked_on`.
   After a builder result, read its `deviations`. A line that names a spec row, an AC or a spec statement as wrong, or as not met by design, goes to `product` in a revision envelope that cites the line, the row and the ADR. That revision runs before the review envelope, and the review envelope carries a fact for the new spec version (`checked_by` `grep -n "^- v<version>" docs/specs/<KEY>/spec.md`) (L-0025). No hook checks this; it is the main session's duty.
6. **Review and qa.** Round 0 (when the PR changes no rendered component; otherwise follow the Visual sign-off paragraph below, where the sign-off goes first and `qa` waits for both approves): dispatch `qa` (`qa.v1`) and `reviewer` (`reviewer.v1`) on the same head SHA. In round 0 also dispatch `security` (`reviewer.v1`) on the same head when the lane is L with the auth or data-access risk flag, the diff touches a path in `.claude/rules/security.md`, the diff changes a model call or a prompt, or the diff adds a runtime dependency; its `request_changes` is a verdict like the reviewer's (findings go back to `builder` with `rework_of`, and round 1 or more re-checks with a new `security` envelope), and it does not replace the reviewer. Round 1 or more: dispatch the reviewer re-check first, and `qa` only on a head that re-check approved; a re-check that requests changes sends the head back with no qa walk on it (L-0014).
   **Visual sign-off** (L-0019). When the PR changes a rendered component (a changed `*.stories.tsx`, or a changed file under `packages/design-system/src/components/` or `packages/design-system/src/recipes/`), dispatch `designer` with `report_contract` `reviewer.v1` and an empty `write_set` to judge the look of the head. Round 0: the sign-off goes first; when it returns, post its PNG paths (the contact sheet, absolute paths) on the Jira issue, then dispatch `reviewer` (and `security` when its cases hold) on the same head. Round 1 or more: the reviewer re-check first, then a new sign-off on the head the re-check approved, then `qa`. `qa` goes only to a head with both a sign-off approve and a reviewer approve. A sign-off's `request_changes` is a verdict: the fix goes to `builder` with `rework_of`. A docs-only PR has no sign-off.
   **A look change in rework** (L-0017). A finding or an owner comment whose fix changes how something looks goes to `designer` before any builder envelope. The designer records the change in `docs/specs/<KEY>/design.md` and screenshots it rendered, with the proposed CSS injected into the story, light and dark. The builder envelope then carries that design.md section in `context_pointers` and one fact per screenshot (`checked_by` `test -f <absolute path>`). Findings go back to `builder` as a new envelope; after round 2, ask the form (section 3). A docs-only PR has no qa; the reviewer walks its AC rows.
7. **G3.** Merge into `develop` through `merge-guard` (section 6), move the issue through `g3-check` (section 7), and post the G3 packet. For a PR that changed a rendered component, the packet lists the PNG paths of the latest designer sign-off approve for the merged head.
8. **Staging and G4.** When the owner sends a batch to staging (ADR 0011), dispatch `qa` to walk the AC on staging; for lane L its approve backs the G4 packet.
9. **G5.** Dispatch `release` to prepare the G5 packet. Only the owner decides G5.
10. **Retro.** Run section 5 after each merge and each staging batch; propose a `retro` when the story taught something reusable.

Rules:

- Bundle questions for the owner into one round, each with options and a default.
- If the owner requests changes, read the comment, dispatch the right role, and re-raise the same gate.
- Any action that costs money, touches production or deletes data: stop and ask.
- Report in the handoff shape: `{ issue, lane, gate, artifacts, checks, summary, next }`.

## POC mode

The owner switched the POC to lean delivery on 2026-10-28 (ORV-137; spec
`docs/specs/ORV-137/spec.md`). POC mode is in effect until the owner says the POC is over. Until
then, where this section and the loop above or section 2 disagree, this section holds. Hooks and
guards run unchanged: every block in sections 2 to 7 still applies, and a guard changes only through a
PR merged with the owner approval line (ORV-137 comment 10246).

Rules:

- One short spec per issue: goal, AC rows, out of scope. Tech notes only when a contract changes; no
  findings tables or status cells.
- No doc review before code; G1 and G2 pass under delegation with a short comment.
- A review finding that changes no contract: the builder fixes it in code, the PR body notes it. No
  architect, product and bookkeeping chain.
- A contract-changing finding: one spec fix, then the builder.
- Cross-reference and status bookkeeping: once before merge, or dropped.
- One reviewer pass, plus `security` whenever step 6 calls for it (untrusted input, auth or data
  access, a path in `.claude/rules/security.md`, a model call or prompt, a new runtime dependency); a
  re-check only for Critical or Important findings. `merge-check` still needs a reviewer approve on
  the merged head, and for a code PR the qa approve and the gate record on it (section 6); a fix
  pushed after the approve needs a reviewer pass on the new head.
- G3 evidence: in POC mode, "two reviewer passes" in `AGENTS.md` rule 5, ADR 0012 decision 2, the
  `gate-packet` G3 row and section 2 ("Builder envelope: one deliverable") reads as the reviewer
  approve on the merged head (with, for a code PR, the qa approve on it, ADR 0013), plus a re-check
  for Critical or Important findings. The G3 packet reports the passes that actually ran.
- Kept: tests, security on untrusted input, no secrets, honesty labels, the quality gate, CI,
  merge-check.
- Aim: a demo the owner runs, a URL in and a brand evidence report out.

Main-session duties POC mode suspends:

- L-0037 and L-0008 (step 4): the `reviewer` on the spec before the G1 packet, and the G3 re-check
  from the reviewed sha.
- L-0013 (section 2, "Contract change from a review"): the revision's record of every finding id. The
  order of L-0011 is kept.
- L-0033 ("Fixes across documents that cite each other"): research, architect and product fixes in
  turn.
- L-0039 ("A finding that two sections disagree"): the pointer fix envelope.
- L-0035 ("Before a re-check"): the grep of corrected values and the fix envelopes before the
  re-check.
- L-0040 ("Bookkeeping after the content fixes"): replaced by the bookkeeping rule above.
- L-0041 ("A fix greps the other documents").

Main-session duties POC mode keeps:

- Tests, `security` whenever step 6 calls for it (untrusted input, auth or data access, a path in
  `.claude/rules/security.md`, a model call or prompt, a new runtime dependency), no secrets, honesty
  labels, the quality gate, CI and `merge-check`.
- L-0025 (step 5): a builder deviation that names a spec row, an AC or a spec statement as wrong, or
  as not met by design, goes to `product` in a revision before the review envelope, and the review
  envelope carries the new spec version as a fact.
- L-0029 ("Fix for a rule finding"): the fix envelope lists every line the rule governs, and the fix
  adds one `verified` row per governed line.
- L-0045 ("A risk-class finding"): survey every route of the class before one design and one builder
  round.
- L-0046 (`.claude/rules/testing.md`): time guards sized for CI.
- L-0047 and L-0026 ("A fact that the gate passed"): the gate runs after `export`, and the fact names
  the run.
- L-0011: a contract change from a review gets the spec fix first and the builder after it.
- L-0010 and L-0043 ("Builder envelope: one deliverable"): one deliverable per builder task, every
  named test file in the `write_set`; `merge-check` reads the `write_set` union.
- L-0044 ("Builder objective points to the design"): the objective cites the short spec's AC rows, or
  the tech notes when a contract change has them.
- L-0016 (step 2): a slice issue gets its own short spec.
- L-0030 ("Owner decisions reach every document they change"): the owner's decision comments reach
  the spec.
- L-0012 ("Review of a guard-rail spec").
- L-0014, L-0017 and L-0019 (step 6): qa only on a head the reviewer approved; a look change goes to
  `designer` first; a visual sign-off on every changed rendered component.
- L-0020 and L-0031 ("Research envelope that adds a knowledge entry").
- L-0034 ("A count in an envelope", "A primary file research could not read").
- L-0027 ("Stall check before each dispatch") and L-0032 ("One issue per checkout at a time").
- L-0048 (section 3): the grant form only after every verdict on the last builder head is in.
- L-0023 and L-0038 (section 4): run research's `done_when` and a spec's worked examples, when it has
  them.
- The component benchmark (ORV-137 comment 10247). Before a component story is built, its spec opens
  with a comparison table in the form of `docs/specs/ORV-64/audit.md` section B, with these rows:
  Untitled UI (variants, sizes, states and slots, read from its page, with the URL), shadcn/ui, Ours,
  Add, and Do not copy (with the reason). The story ships with Thai and English stories for every
  variant and state, the Recipes and modes matrix, and a designer visual sign-off. The same rule is in
  `.claude/rules/design-system.md`.

POC mode ends when the owner says the POC is over. A docs PR then removes this section and its
pointer in `AGENTS.md`, and the suspended duties apply again.

## 1. Start of a run: doctor

```bash
node scripts/ovl/doctor.mjs plan
```

Make the one probe call it prints for each guard (each is built to be blocked, so it changes nothing). The `write-guard` probe is a `Write` of `packages/.ovl-probe`; `write-guard` blocks it, so no file appears, and `check` also exits 2 if that file exists. The `merge-guard` probe is a Bash call of `gh pr merge 0`; the text stage blocks it with no network call, so nothing merges. The `g3-check` probe is an Atlassian MCP `transitionJiraIssue` call (`mcp__claude_ai_Atlassian_MCP__transitionJiraIssue`) with `cloudId` `tpetkaew.atlassian.net`, `issueIdOrKey` `ORV-0` and `transitionId` `4`; the call stage blocks it as the ovl-doctor probe with no network call and no export, and ORV-0 does not exist, so nothing reaches Jira. The `resume-guard` probe is a `SendMessage` call; that tool may be deferred, so load it first (ToolSearch, query `select:SendMessage`), and if the session offers no `SendMessage` at all, stop and tell the owner: the doctor cannot tell a missing tool from a silent guard. Then run `node scripts/ovl/doctor.mjs check <since>` with the `since` value from the plan. If it exits 2, stop and name the silent guard to the owner.

If the doctor says a dependency is missing, run `pnpm install` and start again. `plan` stops (exit 2, naming each path) when any other worktree still holds records in its own `.orivilo/runs/` from before the shared root (the hooks no longer read them, so a `request_changes` verdict or used rework rounds recorded there would be forgotten); run `node scripts/ovl/doctor.mjs migrate` to move them into the main checkout's `.orivilo/runs/`, then plan again. Migrate moves each task folder whole and appends the worktree's heartbeat lines to main's `heartbeat.jsonl`. A task folder main already has is left whole in the worktree and listed, and migrate exits 2. A link under a worktree's `.orivilo/runs/` stops it before any move: it lists the links and exits 2. `plan` also closes envelopes left open by slice A2 (`closed_pre_a3`); it lists them, and none counts as a round. `result-recorder` cannot be probed: after the first Agent call returns, run `node scripts/ovl/doctor.mjs recorder <since>` and stop if it exits 2.

## 2. Dispatch: the prompt is one envelope and nothing else

An Agent call needs a `prompt` that is exactly one `envelope.v1` JSON object (no prose, no code fence), with `subagent_type` equal to the envelope `role`. Only the built-in `Explore` agent runs without one.

Do not set `model`, `isolation` or `run_in_background` on the call. `cwd`, if given, must equal the envelope `worktree`, which must be the checkout this session runs in.

```json
{
  "envelope_version": 1,
  "task_id": "ORV-85-a2-build",
  "issue": "ORV-85",
  "role": "builder",
  "objective": "One sentence naming the result",
  "worktree": "/absolute/path/of/this/checkout",
  "write_set": ["scripts/ovl/*.mjs", "package.json"],
  "context_pointers": ["docs/specs/ORV-81/spec.md"],
  "facts": [{ "claim": "A checked statement", "checked_by": "docs/specs/ORV-85/stdin-samples.md" }],
  "boundaries": ["Do not commit or push"],
  "done_when": ["pnpm test:scripts"],
  "skills": ["quality-gate"]
}
```

- **QA envelope** (G3 acceptance). `role` `qa`, `subagent_type` `qa`, `write_set` `[]`, `skills` `["quality-gate", "webapp-testing"]`, `context_pointers` the spec, and one fact with the PR number, `checked_by` `gh pr view <n>`. The qa runs the full gate in its checkout and writes its screenshots into the main checkout's `.orivilo/runs/<ISSUE>/<task_id>/screenshots/`. Every issue a qa envelope walks needs `docs/specs/<issue>/spec.md` with an acceptance table (a table whose header row starts with `#`), lane S and slice issues included (L-0016): `result-recorder` reads that spec and refuses a qa report with the one problem `no acceptance table in docs/specs/<issue>/spec.md` when the file is missing, unreadable or holds no such table, and the envelope closes as `no_report`.
- **Re-check envelope** (reviewer, round 1 or more). `context_pointers` name the absolute paths of the
  previous review's `result.json` and the rework task's `result.json`, both under the main checkout's
  `.orivilo/runs/<ISSUE>/<task_id>/` (found through `git rev-parse --git-common-dir`; a relative
  `.orivilo/` path does not exist in the reviewer's worktree), and the spec, not the full pointer list
  of the first review. One fact is the sha the previous review judged, read from its record
  (`checked_by`: `jq -r .report.head_sha "<absolute path of the previous review's result.json>"`).
- **Builder envelope: one deliverable.** A builder task builds one deliverable: one module with its
  tests, one hook with its launcher and settings entry, or one doc change. A slice with more gets one
  builder task per deliverable, dispatched in build order, each with only the `context_pointers` and
  `write_set` that deliverable needs. A builder envelope with more than 8 `context_pointers` is split
  before dispatch, unless one fact says why its parts cannot be built apart. The PR still gets one
  full gate, two reviewer passes and the qa walk (L-0010). The `write_set` holds every test file the
  spec's Tests cell names for the deliverable, even when an earlier or later envelope also writes it;
  the envelopes run one at a time. Before the first code review, each builder deviation that names a
  file outside its `write_set` gets a fix envelope or a spec revision that records it (L-0043). No
  hook checks this; it is the main session's duty.
- **Builder objective points to the design.** A builder objective names the tech notes section, the
  clause numbers and the spec rows it builds, by number. It does not restate a signature, return
  shape, constant, threshold or list. When it must state one (a value the tech notes leave open), it
  copies the tech notes text word for word and adds a fact whose `checked_by` is
  `grep -n -F '<text>' docs/specs/<KEY>/tech.md` (L-0044). No hook checks this; it is the main
  session's duty.
- **Contract change from a review.** When a review's findings or the owner's answers change the
  spec's contract, dispatch the `product` revision first and the builder fix only after it returns;
  never both from one review at once. When a reviewer and a qa judged the same head in parallel, the
  revision waits for both reports and the owner gets one question form for both. The revision envelope
  names every finding id of each report, and the revision records each as a contract change, as no
  contract change, or as the review id it repeats (L-0013). The fix envelope carries the
  new spec version as a fact (`checked_by` `grep -n "^- v<version>" docs/specs/<KEY>/spec.md`) and the
  spec in `context_pointers`. A point where the fix must differ from the spec goes in its `deviations`,
  and the next revision starts from those lines and the fix diff only (L-0011).
- **Fix for a rule finding.** When a finding says a rule is broken (a counting, format, naming or
  citation rule that governs many lines), the fix envelope names the rule by file and line and lists
  every line it governs, not only the lines the finding names; the boundary "change only the lines
  named" is not used for it. The fix adds one `verified` row per governed line with the source line it
  was checked against and `meets` or `changed`. A summary row ("walked A to S") does not count (L-0029).
  No hook checks this; it is the main session's duty.
- **Owner decisions reach every document they change.** Before a `product` or `architect` envelope
  for an issue, list the owner's decision comments on that issue that the target document does not cite
  yet (`grep -n "<comment id>" <doc>`). Each becomes a fact (`checked_by` `ORV-<n> comment <id>`) and a
  `done_when` entry `grep -n "<comment id>" <doc>`. When one comment changes a spec and an ADR, both
  envelopes carry it (L-0030). No hook checks this; it is the main session's duty.
- **Fixes across documents that cite each other.** When one review's findings land in two or more of a
  spec, an ADR and knowledge entries, dispatch one fix at a time in this order: `research`
  (knowledge), then `architect` (ADR), then `product` (spec). Each finding id goes to exactly one
  envelope. Each later envelope carries the earlier fixes' `result.json` absolute paths in
  `context_pointers` and their changed files as facts, and its objective asks it to bring every
  reference to those files up to date. The re-check is dispatched after the last fix (L-0033). No hook
  checks this; it is the main session's duty.
- **A finding that two sections disagree.** The fix envelope names the section that keeps the rule and
  asks to replace the other statement with a pointer to it; it never asks to state the rule in both
  places (L-0039). No hook checks this; it is the main session's duty.
- **Before a re-check.** For every finding that corrects a value (a count, a code, a date, a name),
  run `git grep -n -F '<old value>' HEAD -- $(git diff --name-only origin/develop...HEAD)` before the
  fixes go out, and give each file it hits to a fix envelope with the corrected value as a fact, in the L-0033 order. After the
  fixes, read every fix report's `deviations` and `needs_decision`; a line that names a file, a line
  or a value still out of step goes to a new fix envelope before the re-check is dispatched, whatever
  the role (L-0035). No hook checks this; it is the main session's duty.
- **Bookkeeping after the content fixes.** A report line (`needs_decision` or `deviations`) that only
  brings a reference, a version number, a status or findings row, or a pointer in another document up to
  date is bookkeeping. Do not dispatch it alone. Hold it until every content fix of the round is back,
  then send one envelope per role in the L-0033 order that owns a named document, with every held line as a fact
  (`file:line`, old text, new text), before the re-check (L-0035 still applies). A line that changes a
  rule, a field, a closed list or a number a test asserts is a content fix and is dispatched as now. A
  finding whose spots sit in two roles' sections of one file goes to one envelope whose `write_set`
  covers every spot (L-0040). No hook checks this; it is the main session's duty.
- **A fix greps the other documents.** For each name, value, rule or row the fix adds, removes,
  renames or narrows (from the finding's `expected` and the objective), the fix envelope gets one
  `done_when` `git grep -n -F '<term>' -- <each other document of the PR's docs set>` for the old term
  and one for the new term, and its objective asks the role to do the same for every term its own
  design introduces. Each hit outside the `write_set` goes in the report's `needs_decision` as
  `file:line`, old text, new text, and the main session sends it with the round's bookkeeping (L-0040)
  or as a content fix. For `product`, which has no shell, the main session runs these `done_when`
  lines after the task (L-0041). No hook checks this; it is the main session's duty.
- **Review of a guard-rail spec.** When the spec frames a guard as a guard rail, the reviewer
  envelope's objective names the frame and asks for (a) forms a rule-following agent uses that pass
  the guard and (b) bypass classes, each reported once with one probe. A finding of kind (a) goes to
  rework as usual. A finding of kind (b) goes to the spec's Honest limits in the next revision, with no
  builder round, unless the owner decides otherwise in the question form. A re-check envelope says
  that a bypass of a class already named in Honest limits is not a new finding (L-0012).
- **A risk-class finding.** When a `security` or reviewer finding of Critical or Important severity
  is one route of a risk class (resource exhaustion: a cost that grows faster than the input or with
  an uncapped count; injection; auth bypass; path or address escape) in code the spec does not frame
  as a guard rail, the next envelope is `research`, before any spec, design or builder envelope. Its
  objective asks for every route of the class in the code the slice runs on (the pinned dependency
  included), each with file, line and a quote, and the
  search method that found them (the patterns run and their hit counts), recorded in one knowledge
  section. Then one design task covers every listed route with one bound or a named set of bounds,
  one spec revision carries the findings and the design's spec findings, and one builder round builds
  it. Every later reviewer and `security` envelope names that knowledge section as a context pointer
  and says a route outside the list is a new finding that also names the search that missed it
  (L-0045). A bypass class of kind (b) in a guard-rail spec follows the "Review of a guard-rail spec"
  bullet instead (L-0012). No hook checks this; it is the main session's duty.
- **Visual fix from a finding.** See step 6, "A look change in rework": the designer decides and screenshots the look first; the builder envelope carries the design.md section and one `test -f <absolute path>` fact per screenshot, and states no CSS value that design.md does not hold.
- **Never resume.** A re-check, a follow-up question or a fix is a new envelope with a new `task_id`, never a `SendMessage`. A builder rework names `rework_of`; a reviewer re-check does not (`rework_of` is read on builder envelopes only) and puts the earlier `result.json` absolute paths in `context_pointers`. `resume-guard` (PreToolUse `SendMessage`) blocks every `SendMessage`, from the main session and from a subagent, whatever `to` names; it never echoes `to` or the message. When `to` is a recorded agent's id, the stderr names that task, as a hint for the fresh envelope. A subagent that needs a decision reports `blocked` with `needs_decision`, and the answer goes out in a fresh envelope.
- **Research envelope that adds a knowledge entry.** The main session lists `docs/knowledge/README.md` in its `write_set` and gives it one `done_when` entry `grep -q <K id> docs/knowledge/README.md` per new entry. A `needs_decision` or deviation about a file outside the `write_set` is answered by a new envelope before the review is dispatched. After the task, the main session runs `{ git diff --name-only --diff-filter=d HEAD -- docs/knowledge; git ls-files -o --exclude-standard -- docs/knowledge; } | xargs grep -n -E '^source: "?([^"]*; )?(/Users/|/home/|/private/|/tmp/|~/)'` from the repo root, on the files the task changed or added, and expects no output (L-0031); it stops when ORV-129 makes `pnpm check:knowledge` refuse an absolute `source:` path. No hook checks this; it is the main session's duty (L-0020, L-0031).
- **A count in an envelope.** A fact that gives a count names the one file it was counted in, and its
  `checked_by` reproduces it (`grep -c -E '<pattern>' <file>`). A figure derived from counts (a total
  minus an exclusion) takes every operand from that one file. A total that another source states is a
  separate fact and never an operand. A figure that is exact on its base is not written "about". The
  main session never asks research to raise confidence on a count the main session made (L-0034). No
  hook checks this; it is the main session's duty.
- **A primary file research could not read.** When a research report says a PDF or XLSX did not
  decode, the main session converts it to text in the scratchpad (a mechanical step, no reading for
  the document) and dispatches research again with the absolute text path in `context_pointers`.
  Research counts and quotes from that text and records the pattern it counted with (L-0034). No hook
  checks this; it is the main session's duty.
- **A fact that the gate passed.** Its `checked_by` names the run: `export TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1; pnpm quality-gate`, with the URL the main session used. That URL is a local database with no password, never a secret (L-0026, L-0047). No hook checks this; it is the main session's duty.
- **Stall check before each dispatch.** Before each Agent call, and as the first step after a context compaction or a resumed session, list every task folder under the main checkout's `.orivilo/runs/` with `agent.json`, no `result.json`, no `closed.json`, and no heartbeat line for its `agent_id` in the last 20 minutes. Each listed envelope goes to the owner close form (section 4) in the same turn, and no other dispatch of that role happens until the owner answers. Until a script does the check, list those folders with a one-off `ls` and `jq`; a `doctor.mjs stalled` command is a later builder task under its own Jira issue (L-0027). No hook checks this; it is the main session's duty.
- **One issue per checkout at a time.** Do not run `git checkout` or `git switch` in the session's
  checkout while any envelope there is bound with no `result.json` and no `closed.json` (the stall list
  above shows them). To work on a second issue at the same time, start a `claude --worktree` session
  for it (L-0032). No hook checks this; it is the main session's duty.

The guard blocks, with exit 2 and a reason on stderr, when:

- **`task_id`** is used already for this issue. Every dispatch, including a retry after a refused call, needs a new `task_id` (`ORV-<n>-<lowercase-words>`).
- **`checked_by`** is prose. Allowed: a command starting with `pnpm `, `node `, `git `, `gh `, `test `, `grep ` or `jq `; a `path` or `path:line` that exists in the worktree; an `https://` URL; a Jira reference `ORV-<n> comment <id>`. An answer the owner gave in chat is recorded in Jira or the spec first, then cited.
- **`done_when`** is not a check. Each entry is a command with those prefixes, or a `path:line` reference. `pnpm test` passes; "tests pass" does not.
- **`write_set`** is too broad. Each entry is an exact file or a glob under at least two fixed folders (`scripts/ovl/*.mjs` passes; `packages/`, `apps/**` and `**` do not). No `.` or `..` segment, no leading `./`, no empty segment, and no brace or extglob character (`{ ( ! + @ [`) before the second folder. It is empty for `reviewer`, `qa`, `release` and `security`, and for a `designer` envelope with `report_contract` `reviewer.v1` (a visual sign-off); it is not empty for the other roles. `architect` and `research` write only ADRs and `tech.md`, and `docs/knowledge/` entries, in that order.
- **`skills`** misses a required one: `product` needs `discover`; `designer` needs `frontend-design` and `webapp-testing`; `builder` needs `quality-gate`; `qa` needs `quality-gate` and `webapp-testing`; `release` needs `gate-packet`; `security` needs `quality-gate`; `ds-architect`, `reviewer`, `architect` and `research` need none.
- **Issue.** For every role with a non-empty `write_set`, and for reviewer, qa, designer and security, the envelope `issue` must equal the key in the checkout's branch name (`<type>/ORV-<n>-<slug>`); a branch without a key blocks (L-0032). Not enforced yet for product, architect, research and ds-architect: `scripts/ovl/envelope-guard.mjs` (`ISSUE_ROLES`) checks builder, reviewer, qa, designer and security only, and extending it is the builder follow-up ORV-130. Until then no hook checks those four roles; the main session compares the envelope `issue` with the branch key before it dispatches them.
- **Resume.** Not an Agent call: `resume-guard` blocks every `SendMessage` (see "Never resume" above).
- **Background, model, isolation.** Blocked for every agent, Explore included.
- **Open envelope.** One envelope per role is open across the whole repo, all issues and worktrees included. A second one is blocked until the first has a report or is closed (see step 4).
- **Rework rules** (builder only). After a `request_changes` verdict or a failed gate record for the issue, the envelope must name `rework_of`, a task of the same issue that started. After two rework rounds, a builder envelope is blocked: first get a verdict on the last builder round (qa, reviewer or the gate); only if that verdict requests changes, the owner must grant another (step 3).

A valid call is saved as `.orivilo/runs/<ISSUE>/<task_id>/envelope.json`. Records are local and are not committed. They live in one place for the whole repo, the main checkout's `.orivilo/` (found through `git rev-parse --git-common-dir`), so every worktree shares them and removing a worktree keeps them. A hook whose working directory no longer exists fails closed with a clear message. A `.orivilo` that leads outside the main checkout (a link) is refused. The `worktree-guard` hook (PreToolUse Bash) blocks a subagent Bash call whose text (quotes and backslashes removed) holds both "worktree" and "remove" or "prune"; it allows every other call whatever the working directory is, and the main session is never judged. It writes its heartbeat only when the call's directory belongs to this project's repo, so a session in an unrelated repo leaves nothing there. It is a text rule, not a shield: `rm -rf` and a script are not seen. The orchestrator removes a worktree after the agent stops.

## 3. Rework round after round 2: ask the form

When the work stops for the owner, post both reports on the Jira issue, then ask a question form (`AskUserQuestion`) with these options, and no other way to grant:

- the grant option, whose whole label is exactly `อนุญาตรอบ ORV-<n>` or `Grant round ORV-<n>`, naming the escalated issue key, with nothing before or after it
- a decline option, worded without the grant phrase (`Decline`, `ไม่อนุญาต`, never `Do not grant round ORV-<n>`)

Ask the form only after every verdict dispatched on the last builder head is in and one of them
requests changes, or a gate record on it failed. A red CI on that head is not a verdict: dispatch the
reviewer re-check (and `security` when its cases hold) on the head first, with the failing CI run id
as a fact; `owner-grant` writes no grant while the issue is not escalated. The question names the
verdict task ids and the finding ids the round will fix, and nothing else (L-0048).

When the round is for a look change, the question names the designer's screenshot paths, so the owner grants a look and not a sentence (L-0017).

Only the grant option the owner clicks counts. Text typed in chat never grants a round, and neither does text typed under Other. If the owner types a grant in chat, say it does not count and ask the form. The `owner-grant` hook writes the record `.orivilo/runs/<ISSUE>/owner-grant-<n>.json`; it quotes the question, the options and the answer.

## 4. After the call: records and closing

Hooks write the records; the main session never does. `write-guard` (PreToolUse on Write, Edit, MultiEdit, NotebookEdit and Bash) blocks the main session from a deliverable (`packages/`, `apps/`), a guard file (`.claude/hooks/`, `.claude/settings*.json`, `scripts/ovl/`, `scripts/quality-gate.mjs`, `.github/workflows/`, the root `.gitignore`) and a record (`.orivilo/`, `.quality-gate/`). The main session's one write under `.orivilo/` is `.orivilo/handoff.md`, by Write or Edit; everything else under `.orivilo/` is written by hooks and by `node scripts/ovl/*.mjs` runs, which are allowed as whole commands (`doctor.mjs`, `metrics.mjs collect|report|session --out`, `close-envelope.mjs`, `pnpm quality-gate`). A redirect, a chain or a pipe makes the run a normal command, judged by the path rules. The main session may still run one whole `git add`, `git commit` or `git push`. A builder changes a guard file only when its open envelope lists the exact path, and only by a tool write (Write, Edit, MultiEdit or NotebookEdit). A subagent's final message must be exactly one JSON object in its contract (`implementer.v1`, `reviewer.v1` or `qa.v1`), and the same JSON object is what the Agent call returns. Prose is sent back to the subagent. A valid report becomes `result.json` in the task folder; a `reviewer.v1` or `qa.v1` finding with no evidence that can be run again moves to `dropped` and does not count. A call that returns no valid report closes the envelope as `no_report`. A background Agent call (`async_launched`) records nothing when it launches; its report is checked and recorded as `result.json` when the subagent stops (`SubagentStop`, matched by `agent_id`), once, and a report that stays invalid after one send-back closes the envelope as `no_report`. An Agent call that fails or is interrupted (`PostToolUseFailure`) closes its bound envelope as `no_report` too.

A `research` or `product` result is followed by the main session running that envelope's `done_when` commands, and for `product` every line under the spec's `## Worked examples`, in the worktree, before any review or gate packet. An output that differs from the one the spec states goes back to `product` in a new envelope that names it (L-0038). No hook checks this; it is the main session's duty. A failing command goes back to `research` in a new envelope that names the output; a passing run goes into the reviewer envelope as one fact per command (`checked_by` the command itself) (L-0023).

If the Agent call was refused at the permission prompt, the envelope never started. Close it before the next dispatch of that role:

```bash
node scripts/ovl/close-envelope.mjs <task_id>
```

For an envelope whose subagent has already stopped, the same command closes it as `abandoned`. It refuses (exit 2) while the subagent may still run. If a session ended while its subagent ran, the envelope is stuck: it is bound and has no final `SubagentStop`. Only the owner closes it, in one of two ways. Never run `--owner` yourself. A bound envelope that has gone silent is found by the stall check (section 2) before each dispatch and after a compaction or a resumed session, and is raised in the close form in the same turn (L-0027).

1. The close form (first choice, works from the phone). Ask one `AskUserQuestion` that names the task id, its role, its `agent_id` and its `started_at`, and warns that a builder envelope closed this way still counts as a rework round. The options are:
   - the close option, whose whole label is exactly `ปิดงาน <task_id>` or `Close envelope <task_id>`, with nothing before or after it
   - a decline option, worded without the close phrase (`Keep open`, `ยังไม่ปิด`)

   Only the close option the owner clicks counts. Text typed in chat never closes an envelope, and neither does text typed under Other. If the owner types it in chat, say it does not count and ask the form. The `owner-close` hook writes `closed.json` (`reason` `abandoned`, `by` `owner`, `source` `question_form`, with the question, options, answer and ids). It refuses a never-bound envelope, one that has stopped, one that is already closed, and one the session still lists as running.

2. From a terminal outside Claude Code: `node scripts/ovl/close-envelope.mjs <task_id> --owner`.

A builder envelope that was bound counts as a rework round after the first verdict, however it ended. Only `denied` and `pre_a3` do not.

Running `pnpm quality-gate` in the main session writes a gate record from `.quality-gate/report.json`, whether the run passes (`PostToolUse`) or fails (`PostToolUseFailure`; a failing gate exits 1). A record is written only when the report started after the command started, finished no later than now, and is for the commit now checked out. The same run inside a subagent writes none, an interrupted run writes none, and a partial run (`--only`) writes none.
A run behind an inline variable prefix (`VAR=... pnpm quality-gate` or `env ... pnpm quality-gate`)
writes none either: set the variables with `export` in an earlier segment (L-0047).

## 5. After a merge: measure and improve

After a slice merges into `develop` (its G3), and after a release batch reaches staging, run the improvement loop. Spec: `docs/specs/ORV-87/spec.md`, "Improvement loop". These are plain script runs; `write-guard` allows them.

1. For each issue in scope: `node scripts/ovl/metrics.mjs collect <ISSUE>`. Then `node scripts/ovl/metrics.mjs report <ISSUE...> --out <batch>` (it prints `wrote <absolute path>`, under the main checkout's `.orivilo`; keep that path) and `node scripts/ovl/metrics.mjs due`. Run `collect` soon after the merge: if Claude Code cleans up a transcript first, that task's numbers are `null`.
2. Dispatch one envelope: `role` `ds-architect`, `skills` `["retro"]`, `issue` the key of the slice's own Jira issue (each slice has one; the retro runs on a `chore/<slice key>-retro-lessons` branch, so the branch carries the slice's key, L-0032), `context_pointers` the absolute path that `report --out` printed (the role works in its own worktree, where a relative `.orivilo/` path does not exist), `docs/LESSONS.md`, `docs/lessons/README.md` and `docs/specs/ORV-87/spec.md`, and `write_set` `["docs/lessons/L-*.md", "docs/LESSONS.md", "docs/lessons/README.md"]`: lesson paths only, never a rule, agent or skill file. A fact's `checked_by` is a command that reads that report, for example `grep -n "## By role" "<absolute path>"` (the report is markdown, so `jq` fails on it; the guard refuses a bare absolute path as `checked_by` but accepts a `grep ` command). The task follows the retro skill's cost and flow step. A kind with fewer than 3 tasks gets no proposal, and its report says why.
3. Post a Jira comment on the slice's issue that lists each proposal (lesson id, the rule in short, expected saving, guard metric) and each measured result. Then ask the owner a question form with `Approve L-NNNN` and `Decline` per proposal. Only the clicked option counts.
4. On approval, dispatch a second envelope to the same role whose `write_set` is the target rule file (named exactly), the exact lesson file `docs/lessons/L-NNNN-<slug>.md` and `docs/LESSONS.md`. That envelope applies the rule and sets `Status: promoted` and `Check after:` (promotion date plus 14 days) in the lesson file and the ledger row. A declined proposal stays `proposed`.

Nothing automatic decides: no hook runs the collector and no guard reads its output. Metrics are never evidence for a gate.

## 6. Merge a PR

Spec: `docs/specs/ORV-95/spec.md`. `merge-guard` (PreToolUse `Bash`) judges every Bash call in three stages. The text stage reads the command text only and blocks the always-blocked forms. The export stage first checks that `git ls-remote --get-url origin` (after every `insteadOf` rewrite and included config file) is this repo's GitHub URL, and fails closed without printing the URL when it is not. Then it builds develop's `scripts/ovl` under the main checkout's `.orivilo/exports/<sha>/`, from the SHA that `git ls-remote origin refs/heads/develop` gives, and before every run checks that folder's tree against `git ls-tree` for that SHA: a changed, added, removed or planted file means a fresh extract, and a `package.json` or `node_modules` under `.orivilo/` or `.orivilo/exports/` fails closed. The records stage runs `merge-check.mjs` from that export, never from the branch.

**A merge is one whole command**, with nothing before, after or around it:

```bash
gh pr merge <n> --squash --delete-branch --match-head-commit <40-hex sha>
```

Use `--squash`, `--merge` or `--rebase` (or `-s`, `-m`, `-r`); `--delete-branch` (or `-d`) is optional; `--match-head-commit` with the head SHA is required. `--auto`, `--admin`, `-R`, `--body`, a missing strategy flag, a missing number, a chain, a pipe or a `$(...)` is blocked. Merge only through the one command above.

**A push** is one of these two forms, and nothing else:

```bash
git -C <worktree> push -u origin HEAD
git push -u origin <type>/ORV-<n>-<slug>
```

`<type>` is `feature`, `fix`, `chore` or `docs`. The text stage is an allow list for pushes: the remote is `origin`; every refspec is `HEAD`, `@` or such a branch (also as `<src>:<branch>`, `:<branch>` or `refs/heads/<branch>`), and `HEAD` or `@` must resolve to such a branch in the checkout `-C` names (else `cwd`); the only git option is `-C`; the push options are `-u`, `--force-with-lease`, `--delete` and their plain kin. So a push with no refspec, a push of `develop`, `main` or a tag, `--tags`, `--follow-tags`, `--all`, `--mirror`, `--no-verify`, `--receive-pack`, `-c`, `--git-dir`, `--work-tree`, `GIT_DIR=` or `env` before `git`, a `cd` or `pushd` in a command that pushes `HEAD`, an unexpanded `$B`, a glob, `git-push`, `git send-pack` and `git subtree push` all block. Develop, main and tags never move by a push; a git tag deploys to production, so `gh release create` blocks too.

**Other blocked forms**, for every session:

- `gh api` is read only: a GET with no field (`-f`, `-F`, `--field`, `--raw-field`), no `--input`, no method header, and no path with `/merge` or `/git/refs`. `gh api graphql` is allowed only with an inline `-f query=` that holds no `mutation`. `gh repo sync` blocks.
- A command that names the GitHub token blocks, whatever it does with it: `gh auth token`, `GH_TOKEN` or `GITHUB_TOKEN` (a read, an assignment or a word in a message alike; reword a commit message that names one). A command that names `api.github.com` or `uploads.github.com` blocks when it also holds a write method, a body option or a method header (`curl -X PUT`, `-d`, `--json`, `wget --method=DELETE`); a plain GET is allowed. The text is lowercased, so `curl -x <proxy>` and `curl -f` against those hosts block too.
- Config that could repoint origin or change a push: `git update-ref refs/remotes/origin/...`, `git remote add|set-url`, and any `git config` (reads included, any scope) or git `-c` or `--config-env` naming `remote.`, `url.`, `include.`, `includeIf.`, `push.` or `alias.`. Read the remote with `git remote -v`.

Pre-check from your own checkout; only the hook's run from the export counts, but the output tells you what is missing:

```bash
node scripts/ovl/merge-check.mjs <n> --head <sha>
```

**Records a merge into `develop` needs** (all for the PR's head SHA, as GitHub reports it):

- the latest `qa.json` of the issue is an approve for that head and PR, with a light and a dark screenshot for each changed `*.stories.tsx` title;
- the latest `reviewer.v1` result from a `reviewer` envelope for that head is an approve;
- the latest gate record for that head has `ok: true`, `dirty: false` and `steps_source: "gate"`, so run `pnpm quality-gate` in the main session on the pushed head;
- every check from `gh pr checks` has bucket `pass`;
- the head branch key and the PR title key name the same issue, and every changed file is in the `write_set` union of the issue's bound envelopes (plus `docs/context/handoff.md`, `docs/plans/*.md`, the issue's `jira-issue.md` and `DESIGN.md`, the whole file);
- a guard file in the PR also needs the owner approval record (below).

A push after the checks changes the head: run the gate again and get new records for the new SHA.

**Docs-only PRs.** When every changed file ends in `.md` and is in no protected set (so an improvement run, a handoff or plan update, a spec revision, or a rule, agent or skill file), the PR needs no `qa.json`, no gate record and no screenshots. It needs a `reviewer.v1` approve on the head or the owner approval record, and every other check above. One file outside that definition, a `.md` under `packages/` included, needs the full set.

**A merge into `main`** is allowed only for the staging release PR (head branch `develop`), with every check green and a passing check of the `CI` workflow among them (ADR 0016). It needs no owner approval record, no gate record, no `qa.json` and no reviewer result: the green CI checks are the evidence, and each guard file in it was judged when its own PR merged into `develop`. Claude may open the release PR and merge it. The form is a merge commit that keeps `develop`:

```bash
gh pr merge <n> --merge --match-head-commit <40-hex sha>
```

The records stage cannot see the flags, so the guard reads the PR base with one `gh pr view` for any merge that is not a plain `--merge`, and refuses `--squash`, `--rebase` and `--delete-branch` when the base is `main` (a squash or a rebase lets `develop` and `main` drift, `--delete-branch` deletes `develop`). The release head must also be this repository's `develop`: `merge-check` reads `isCrossRepository` and refuses a fork head named `develop`. A base it cannot read fails closed. Tags, `git push origin <tag>` and `gh release create` stay blocked: production is the owner's.

**Owner approval.** The G3 packet prints this line for a guard-file PR into `develop`. The owner runs it from a terminal outside Claude Code, in the main checkout, with `<n>` and `<sha>` filled in. Every Claude Code session is blocked from writing it. A new push needs a new approval; the same line writes over the old file.

```bash
mkdir -p .orivilo/owner-approvals && printf '{"by":"owner","pr":%s,"head_sha":"%s","at":"%s"}\n' <n> <sha> "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > .orivilo/owner-approvals/<n>.json
```

**Owner waiver (Vercel rate limit only).** A check whose name starts with `Vercel`, with bucket `fail` and a description that starts with `Deployment rate limited`, is waived only when the owner's waiver file names it for that head. The pre-check prints the rate-limited check names as a JSON list. The owner runs this line from a terminal outside Claude Code, in the main checkout, with `<checks>` such as `["Vercel"]`:

```bash
mkdir -p .orivilo/owner-waivers && printf '{"by":"owner","pr":%s,"head_sha":"%s","checks":%s,"at":"%s"}\n' <n> <sha> '<checks>' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > .orivilo/owner-waivers/<n>.json
```

A PR comment, from anyone, is not a waiver; the guard reads no comment. A waiver never covers a failed build, a failed Actions check or a check that waits.

When the guard blocks, stderr names the rule, the issue key, SHAs, file paths and check names. Fix the missing record or ask the owner for the approval or waiver line; do not look for another way to merge. While develop has no `scripts/ovl/merge-check.mjs` (the bootstrap), the guard blocks and the owner merges that PR in the GitHub web UI.

## 7. Move the issue to G3 PR review

Spec: `docs/specs/ORV-98/spec.md`. G3 PR review means merged into `develop` (ADR 0012), so the move comes after the merge, never before. The move is a Jira transition on the issue key (`ORV-<n>`, not a numeric id or a lowercase key) with `transitionId` `4`, or `transitionName` `G3 PR review` (exact case). Send one of them, or both only when they name the same transition.

`g3-check` (PreToolUse on the Atlassian MCP `transitionJiraIssue`, and `executeWrite` or `executeDestructive` whose `name` is `transitionJiraIssue` or whose `inputs` hold `transitionId` or `transitionName`, whatever the `name`) judges every transition in two stages. An execute call named `transitionJiraIssue` with `inputs` `null` or missing blocks, since it names no transition.

- **Call stage**, from the session's checkout, with no network call. The `transitionId` or `transitionName` must be in `scripts/ovl/jira-transitions.json`; a name is matched exactly against transition names, never against target statuses (`Backlog`, `Discovery`). An unknown id or name, an id and a name that disagree, or a call with neither blocks. A move to any status other than G3 PR review is allowed here.
- **Records stage**, for a move to G3 PR review only, from develop's export (as for `merge-guard`). The issue's latest merged PR into `develop` (head branch key and title key both the issue) must pass `merge-check` on its merged head: qa, reviewer, gate record, checks and the rest of step 6. An open PR of the issue into `develop`, or no merged PR, blocks. Open PRs are read from an open list (`gh pr list --state open`, no `--search`), so a PR opened moments before the move is seen; the merged PRs come from a search list. Each `gh pr list` is bounded at 30 seconds and the records stage at 120, under the hook's `"timeout": 300`.

Pre-check from your own checkout; only the hook's run counts, but the output names what is missing:

```bash
node scripts/ovl/g3-check.mjs <ISSUE>
```

When the guard blocks, fix the missing record or the PR, or ask the owner. A PR the owner merged by hand without the records cannot pass; the owner moves that issue in the Jira web UI. While develop has no `scripts/ovl/g3-check.mjs`, the move blocks and the owner moves the issue in the Jira web UI. The G3 packet quotes the `g3-check` heartbeat line of the move.

## Honest limits

- `SubagentStart` cannot block (exit 2 only shows stderr). If a subagent starts with no single open envelope to bind to, it runs unbound: no `agent.json`, no round counted, no `result.json`. The guard at dispatch time (one open envelope per role, checked again after the envelope is saved, so two same-role calls made at once never both run: at most one is allowed and the others close as denied) is what prevents this, not the start hook. Every record is written whole (aside, then linked into place), so a start hook running at the same moment as another never reads half a record. One residual window remains: a losing envelope of a same-role race stays visible as open and unbound until its `closed.json` is written, and on a very slow filesystem the winner's start hook could scan inside that span, see two candidates and run unbound. It was not reproduced in 31 trials.
- Hooks cannot run once the session's own worktree is removed. When `CLAUDE_PROJECT_DIR` is a removed worktree (`claude --worktree`), the hook files are gone with it: `/bin/sh` cannot find `result-recorder.sh`, `|| exit 2` fires even when `stop_hook_active` is true, and nothing is recorded. `worktree-guard` blocks a subagent Bash command whose text, with quotes and backslashes stripped, holds the word `worktree` together with `remove` or `prune`. It misses a word built by shell expansion (an empty `$()` or `${VAR}` inside it) and an encoded command piped to a shell. The main session, `rm -rf`, a shell script or a tool outside Bash can still delete the worktree. Remove a worktree only after the run, from outside it.
- `resume-guard` sees the `SendMessage` tool only. A Claude Code version that adds a resume field to the Agent tool would pass `envelope-guard` with a valid envelope, and a session without these hooks escapes it. It blocks all messaging: a subagent cannot ask the main session anything through `SendMessage`, and a stale task hint (an agent recorded in a stray worktree folder before `doctor.mjs migrate`) still gets the same block.
- `write-guard` is a path and text rule, not a sandbox. A script written to a scratchpad and run with `node /tmp/x.mjs` names no protected path and can still write a record; a path built by `cd`, expansion or a glob is not seen; and a harmless command that names a protected path in a message is blocked too. A whole `git commit` still moves a protected change, so the reviewer and the qa check what gets committed. A builder whose `write_set` lists `scripts/ovl/write-guard.mjs` can weaken the guard for its own worktree until the merge. A session without these hooks escapes it.
- The main session can still edit a spec, an ADR, an agent or a skill file: `docs/`, `.claude/agents/`, `.claude/skills/` and `.claude/rules/` are outside every protected set.
- `merge-guard` is a guard rail for agents that follow the rules, not a boundary (ORV-95 comment 10109). It stops a session that merges or pushes by habit or by mistake from moving `develop` or `main` without the records, and names the missing record. It does not hold against a session that sets out to defeat it, and more ways around it exist than the ones named here. An agent never uses any form below or any other way around the guard; when the guard blocks, fix the record or ask the owner.
- The planned boundary is GitHub rulesets on `develop` and `main` (ORV-97). They are not available today: on this private repo's plan, rulesets and branch protection return HTTP 403 (ORV-97 comment 10110), so the hooks are the only merge barrier. A merge in the GitHub web UI or from another client is not guarded, and the owner's hand merge of the bootstrap PR is one. Once on, a ruleset holds only against a credential that cannot administer the repo and that no bypass actor matches; a session's `gh` signs in today with the owner's admin token, which can disable the ruleset or merge past it. Even then a ruleset rejects a push or API write that moves `develop` or `main`, but not a PR merge with green checks, which skips the records stage.
- Second-round limits (review N1 to N5, qa QA2-F1 to QA2-F5), named as this class with no code change: a `gh` alias that stands for `pr` or `api`; `gh api` short flags in a group that hide a write method or a field; a refspec fed to a push by `xargs` or a backtick substitution; an exported `GIT_` variable (a git dir or a config key) in an earlier segment; a push refspec under the origin remote in `.git/config`, which git maps a colon-less refspec through, so an allowed feature-branch push can move `develop`; git replace refs, which make the export of develop's SHA hold the session's own `merge-check.mjs`; a GraphQL query the shell builds, which hides a mutation; and curl's method option in a group of short flags (`-sX`). The export's symlink check has no test, so a change that drops it would not be caught.
- `merge-guard` text rules and its launcher run from the session's own checkout. A builder whose `write_set` lists `scripts/ovl/merge-guard.mjs`, `scripts/ovl/develop-export.mjs`, `.claude/hooks/merge-guard.mjs` or `.claude/settings.json` can weaken them for its own worktree until the merge; the merge of such a PR needs the owner approval record. The records stage always runs from develop's export, never from the branch.
- The text rules are text, not a parser. They block an unexpanded push target (`git push origin HEAD:$B`) and a `cd` before a push of `HEAD`, but not a `git` or `gh` word the shell builds (`$G push`), an encoded command piped to a shell, a script file a session wrote and then runs, or an alias a Write puts in a config file. A config file written by a tool (`~/.gitconfig`, `.git/config`) is not seen either; the origin URL check catches a rewrite of origin's URL, not `http.proxy`, `core.sshCommand` or `credential.helper`.
- Only `gh api`, `gh pr merge`, `gh repo sync` and `gh release create` have rules; `gh pr edit --base`, `gh workflow run`, `gh secret set` and `gh repo edit` are allowed. The token rule sees only the names `gh auth token`, `GH_TOKEN` and `GITHUB_TOKEN`: it does not see the token read another way (`gh auth status --show-token`, `git credential fill`, the `gh` config file, the keychain), a host or token name the shell builds (`api.$H`, `${P}_TOKEN`), or a program that sends a method or body without the named options.
- The export tree is checked right before `merge-check.mjs` starts, so a change in the short window between the two is not caught. The expected origin URL is a constant: a rename or move of the GitHub repo blocks every guarded merge until `develop-export.mjs` changes.
- The owner approval and waiver are files. `write-guard` blocks a tool write that names `.orivilo`, but until ORV-96 lands a Bash call that hides the folder name (`cd .oriv?lo/owner-approvals && printf ... > 7.json`), or a script a session runs, writes a valid approval or waiver and so can forge the owner's approval for a guard-file PR into `develop` (a release into `main` reads no approval record). The waiver covers only a rate-limited Vercel check on one head, never a failed build or a failed Actions check.
- Docs-only PRs skip the qa and the gate record: CI is the only check that runs, and a rule, agent or skill file merges on a reviewer's or the owner's approve.
- A merge needs the network (`gh` and `git ls-remote`); offline, every `gh pr merge` is blocked. The changed files come from `gh api repos/{owner}/{repo}/pulls/<n>/files --paginate`; a PR whose list length differs from `changedFiles` (GitHub stops the list at 3000 files) is blocked, not judged. A renamed file counts by both its previous and its new path in the guard-file check. A release into `main` rests on CI alone: a change CI does not cover reaches staging, and the guard is a rail, not a boundary, so another route to `main` or a tag is not stopped (ORV-97, ORV-96).
- The records stage checks that the qa's screenshots exist for each story title, not what they show.
- `g3-check` is a guard rail for agents that follow the rules, not a boundary. It stops a session that moves an issue to G3 PR review by habit or by mistake before the merge and the records exist, and names the missing record. It does not hold against a session that sets out to defeat it. An agent never uses any form below to move an issue around it.
- `g3-check` does not see other ways to move Jira: the Jira web UI, the Jira REST API through `curl` or a script, a Jira automation rule, or an Atlassian MCP tool whose name its matcher does not hold. The `.mcp.json` server `atlassian` was not reachable headless, so its tool names (`mcp__atlassian__<tool>`) are expected, not recorded.
- `g3-check`'s call stage and its id list run from the session's checkout. A builder whose `write_set` lists `scripts/ovl/g3-check.mjs`, `scripts/ovl/jira-transitions.json`, `.claude/hooks/g3-check.mjs` or `.claude/settings.json` can weaken it (remap id `4`, for example) for its own worktree until the merge; the merge of such a PR needs the owner approval record. The records stage always runs from develop's export, never from the branch.
- Only the G3 move is guarded. Moves to Staging, G4, Release, G5 and Done pass with any known id or name.
- Only the issue's latest merged PR is judged; an earlier one was judged by `merge-guard` at its own merge, or merged by hand before slice C1.
- Records forged by a Bash call that hides `.orivilo` (ORV-96) pass the G3 move as they would pass a merge.
- The transition ids and names are this project's, recorded once (`listJiraIssueTransitions` on ORV-98, ORV-97 and ORV-93). A Jira workflow change makes a new id or name block, and a reused id or a renamed transition maps to its old status, until `jira-transitions.json` is recorded again.
- A name is matched exactly. If Jira accepts a case variant or a trimmed name, `g3-check` blocks it as unknown; retry with the exact name or the id. When a call holds both an id and a name, which one Jira uses is not recorded, so both must name the same transition.
- The `executeWrite` and `executeDestructive` routes are judged as the model sent them; the Jira server may refuse a transition through them.
- A G3 move needs the network (`gh` and `git ls-remote`), as a merge does. The samples come from the `claude` on PATH; a newer Claude Code that drops a field fails closed.
- A hook past its timeout lets the call through: per Claude Code's hooks docs, a cancelled hook is not an exit 2. `g3-check` bounds its own spawns under its 300-second `timeout`, but the develop export's `git` steps carry no bound, so an export that hangs past the remaining time lets the move through. `merge-guard` has the same gap: its entry sets no `timeout`, so the 60-second default applies while its records stage waits up to 120 seconds (ORV-94).
- The merged PR still comes from the search index. The open list does not use search, but the search list does, so a PR merged moments before the move may be missing: an earlier merged PR of the issue is judged instead, or no merged PR is found and the move blocks.
- The `g3-check` tests run a stub `merge-check.mjs` on the fixture origin's `develop`; no `g3-check` test runs the real `runMergeCheck` on a merged PR. The relay is pinned by its argv (`<n> --head <sha>`); the other `merge-check` reasons rest on the ORV-95 `merge-check` tests.
- An execute call with a variant `name` (`TransitionJiraIssue`, for example) whose `inputs` hold neither `transitionId` nor `transitionName` names no target, so it is allowed; Jira cannot move an issue from it without a transition.

## Not guarded

`write-guard` guards writes (slice B), `merge-guard` guards merges (slice C1) and `g3-check` guards the move to G3 PR review (slice C2). Moves to Staging, G4, Release, G5 and Done are not checked. Do not claim a role's work as evidence on its own say-so: a gate needs the recorded `qa.v1` and `reviewer.v1` results and the checks you ran yourself.
