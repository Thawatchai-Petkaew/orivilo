---
issue: ORV-87 (https://tpetkaew.atlassian.net/browse/ORV-87)
lane: L (it reads the owner's session transcripts, which hold personal data, and adds a contract under scripts/ovl; three slices)
version: 1.2
---

## Why

On 2026-10-23 the owner asked for a team that improves the way we work: collect data so that both token use and the work process get better (Jira ORV-87). Today nobody can say where the tokens go or which step of the process is worth changing, except by reading a long session by hand.

The baseline for 2026-10-23 (`docs/specs/ORV-87/baseline.md`) was counted by hand from the completion notices in one session:

- 76 subagent runs, 5,355,001 notice tokens, about 4.7 hours of agent time.
- Reviews took 35 runs and 51% of the notice tokens.
- Some resumed reviewers ended at about 200k tokens of context after fewer than 10 tool uses.
- Shipping time is mostly waiting for CI, not tokens.
- The orchestrator's own tokens are not in those numbers.

A notice's `subagent_tokens` is not what a run used. It is the size of the run's last model call (its input, cache write, cache read and output), so the baseline's token figures are final context sizes, and their sum is not a total (the correction at the top of `baseline.md`). The gap is large: reviewer task ORV-87-collector-review-1 (finding F6) summed every call of three resumed reviewer runs whose notices said 152,810, 197,719 and 211,661, and got 2,829,134, 2,660,391 and 1,639,697. The baseline still ranks which runs end with a large context; it cannot rank total cost. That is one more reason for a collector.

Those totals also hide what kind of token was spent. In the one foreground run whose usage was recorded (`scripts/ovl/fixtures/hook-stdin/PostToolUse-Agent.json`), `totalTokens` 32,737 is exactly input 2 + cache write 3,643 + cache read 28,976 + output 116, so 89% of that total was cache reads. A total is not a cost, and most of a run's tokens may be re-reads of a cached context. The collector has to keep the four kinds apart.

This story gives the team two things: a collector that turns the run records and the transcripts into numbers per task, and a loop that reads those numbers after each slice or batch and proposes a process change with an expected saving, which the owner approves the way lessons are approved today.

## Decisions this spec relies on

- ADR 0013: the `/ovl` orchestrator. Roles, the envelope, the report contracts, and the run records under `.orivilo/runs/`, local and not in git.
- ADR 0014: the owner grants a rework round only by clicking an option in a question form. This spec uses the same form for approving a proposal (open question 4).
- ADR 0012: who passes each gate. Nothing here changes a gate.
- `docs/specs/ORV-81/spec.md` v1.3, Records: the shapes of `envelope.json`, `agent.json`, `result.json` (`contract`, `agent_id`, `agent_type`, `round`, `recorded_at`, `report`, `dropped`), `closed.json` (`reason`, `closed_at`), the gate records (`ok`, `sha`, `dirty`, `steps_source`, `recorded_at`) and `heartbeat.jsonl` (`hook`, `event`, `at`, `tool`, `agent_id`, `decision`). Also its guard-file list, which includes `scripts/ovl/`.
- `docs/specs/ORV-85/stdin-samples.md`: the recorded hook input and the fact that a transcript tool result and a hook `tool_response` share their keys.
- `.claude/skills/retro/SKILL.md` and `docs/lessons/README.md`: a lesson is proposed by the retro and promoted to a rule only with the owner's approval.
- AGENTS.md rule 4 (be honest about what is real) and rule 6 (lean).

## Story

As the owner, I want every `/ovl` task's cost and outcome kept as numbers, and after each slice or batch a short list of process changes, each with the saving it should bring and a way to check it later, so that I can approve the changes that pay and drop the ones that do not.

## Scope

1. **Collector.** One node script, `scripts/ovl/metrics.mjs`, with a JSON Schema `scripts/ovl/schemas/metrics.v1.json`. It reads the run records and the Claude Code transcripts and writes one `metrics.v1` file per issue under `.orivilo/metrics/`. It is a reader: it never edits a record or a transcript, no hook calls it, and no guard reads its output.
2. **Report.** Subcommands of the same script that print tables by role and by issue, split fresh from resumed runs, read a whole session (including runs from before the records existed), and list proposals whose check is due.
3. **Improvement loop.** No new agent. A step in the `ovl` skill runs the collector after a merge or a batch and dispatches an existing Opus role (`ds-architect`, open question 1) with the `retro` skill. Its output is lesson files in `docs/lessons/` with a new `## Expected saving` section, one ledger row each in `docs/LESSONS.md`, and a Jira comment on the slice's issue. The owner approves each proposal; nothing changes in a rule file before that.

There is no UI in this story. Script output and stderr are English developer text, outside the locale catalog.

## Data sources

Each source is marked verified (seen on this machine, with where) or unverified (the slice that relies on it records a sample first, as ORV-85 did).

### Run records (ORV-81)

- `.orivilo/runs/<ISSUE>/<task_id>/envelope.json`: `task_id`, `issue`, `role`, `context_pointers`, `facts`, `rework_of`, and the file's byte length. Verified as written since slice A2 (a builder run listed `ORV-86-a3-build/envelope.json`).
- `agent.json` (`agent_id`, `agent_type`, `started_at`), `result.json`, `closed.json` and the gate records under `.orivilo/runs/<ISSUE>/gates/`: shapes from the ORV-81 spec. Unverified in real runs: they are written by `result-recorder`, which ships in slice A3 (ORV-86). Until A3 merges, the tests use fixture records, as the A2 round tests did.
- From `result.json` the collector reads `round`, `contract`, `report.result` (`implementer.v1`), `report.verdict` (`reviewer.v1`, `qa.v1`), `report.findings[].severity`, and the length of `dropped`.
- `.orivilo/heartbeat.jsonl`: lines with `event` SubagentStop and the task's `agent_id`. The value of `decision` that means "sent back to fix its report" is unverified: slice 1 reads it from the A2 and A3 hook code before relying on it.

### Main session transcript (Claude Code 2.1.308)

- Path: `~/.claude/projects/<project-folder>/<session_id>.jsonl`. Verified for session `0baff5a3-4a6a-4d70-99db-b6b7a526f04f`, folder `-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO`. The rule that turns a working folder into the folder name is unverified (one example, and a worktree session may get its own folder), so the collector finds a file by its session or agent id with a glob over `~/.claude/projects/*/`, and never builds the name.
- Assistant lines carry `timestamp`, `version`, `message.id`, `message.model` and `message.usage` with `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` and `output_tokens`. Verified: 1,327 usage lines in that transcript.
- A `SendMessage` tool result carries `toolUseResult.resumedAgentId` when it resumes an agent. Verified at line 1735 (`"message":"Resuming agent a4749f5"`, `"resumedAgentId":"a4749f50857d699e3"`).
- A background run's completion arrives as a `<task-notification>` prompt holding `<usage><subagent_tokens>`, `<tool_uses>` and `<duration_ms>`. Verified at line 724; the same notice appears again at line 726, so notices are counted once per agent id and completion. `subagent_tokens` is the last call's context size, not the run's total: on the 15 agents resumed in session `0baff5a3-4a6a-4d70-99db-b6b7a526f04f`, the final notice equalled the four kinds of the final call exactly in 9 and was 3 to 430 tokens above them in 6, never below (finding F6 of ORV-87-collector-review-1). `/ovl` now blocks background calls, so this source matters only for older sessions (session mode).
- A foreground Agent call's tool result with `agentId`, `totalTokens`, `totalDurationMs`, `totalToolUseCount`, `toolStats` and `usage`: verified only in recorded hook stdin from 2.1.282 (`PostToolUse-Agent.json`). Its presence in a 2.1.308 transcript `toolUseResult` is unverified (ORV-85 showed the keys match only for the async case). That sample is one call, so `totalTokens` equals the sum of its four kinds; whether it is also the last call's size on a multi-call run is unverified, and the collector treats it like `subagent_tokens`.

### Subagent transcripts (Claude Code 2.1.308)

- Path: `~/.claude/projects/<project-folder>/<session_id>/subagents/agent-<agent_id>.jsonl`, with `agent-<agent_id>.meta.json` beside it. Verified (that session holds more than 100 such files), and the SubagentStop hook input names the same path in `agent_transcript_path` (`SubagentStop.json` fixture).
- Lines carry `isSidechain: true`, `agentId`, `timestamp`, `version`, and on assistant lines `message.id`, `message.model`, `message.usage` and `tool_use` content blocks with an `id`. Verified in `agent-a784a35b33e35efc7.jsonl` (13 `tool_use` blocks, model `claude-opus-5-5`, version `2.1.308`).
- One `message.id` repeats on several lines, one per content block, and each line carries the same usage. Verified: lines 29, 30 and 32 of that file share an id. Usage therefore counts once per `message.id`, or every multi-block message would be counted two or three times.
- The meta file holds `agentType`, `description`, `toolUseId`, `spawnDepth`, `requestShape` and `finished` (verified). The collector reads `agentType` and `requestShape` only; `description` is text and is never read into output.
- Unverified: whether a resumed agent appends to the same file, and whether SubagentStart fires on a resume. Slice 1 records one resume before relying on either.
- Unverified: how long Claude Code keeps transcripts before it cleans them up. The loop collects after each slice, and the numbers that matter are quoted in the lesson files, which are in git.

## The metrics (`metrics.v1`)

One file per issue, `.orivilo/metrics/<ISSUE>.json`, rewritten on every `collect`. It is derived data, not a record: it is never evidence for a gate and no guard reads it. The schema has `additionalProperties: false` at every level, so a text field cannot slip in later without a schema change. An example, with numbers from the recorded sample (a one-call run, which is why `reported_total` equals `tokens.total` here; on a run of several calls they differ, as the bullets below say):

```json
{
  "metrics_version": 1,
  "issue": "ORV-1",
  "collected_at": "2026-10-23T12:00:00.000Z",
  "cc_versions": ["2.1.308"],
  "skipped_lines": 0,
  "gates": { "passed": 1, "failed": 0 },
  "tasks": [
    {
      "task_id": "ORV-1-build",
      "role": "builder",
      "agent_id": "a9676f924989bd70c",
      "model": "claude-opus-5-5",
      "round": 0,
      "outcome": "done",
      "envelope": { "bytes": 1840, "context_pointers": 4, "facts": 3 },
      "findings": { "critical": 0, "important": 0, "suggestion": 0, "dropped": 0 },
      "sent_back": 0,
      "missing": [],
      "runs": [
        {
          "start": "fresh",
          "session_id": "f07dac3e-9e6e-4bc1-bd68-a408d9e08f0b",
          "api_calls": 1,
          "tokens": {
            "input": 2,
            "cache_creation": 3643,
            "cache_read": 28976,
            "output": 116,
            "total": 32737
          },
          "reported_total": 32737,
          "total_mismatch": false,
          "tool_uses": 1,
          "duration_ms": 3579,
          "started_at": "2026-10-23T10:12:31.917Z",
          "ended_at": "2026-10-23T10:12:35.496Z"
        }
      ]
    }
  ]
}
```

- `outcome`: `done` or `blocked` from `implementer.v1`; `approve` or `request_changes` from `reviewer.v1` and `qa.v1`; otherwise the `closed.json` reason (`no_report`, `denied`, `abandoned`, `pre_a3`), or `open`.
- `round`: from `result.json`, as the recorder filled it in. `null` when there is no result.
- `findings`: kept findings by severity from the report, and the length of `dropped`.
- `sent_back`: SubagentStop heartbeat lines for the agent that sent it back to fix its report.
- `envelope`: the byte length of `envelope.json` and the counts of `context_pointers` and `facts`. These let the loop test the baseline's guess that a narrow envelope costs less.
- `runs`: the first run is `fresh`, from the Agent call that bound the envelope. Each `SendMessage` resume of the same `agent_id` adds a run with `start: "resumed"`. A run's numbers come from the agent transcript lines between its start and the next run's start, with usage counted once per `message.id`. If a resume's lines cannot be found there, the run takes the completion notice's numbers and its `tokens` split by kind is `null`.
- `tokens.total` is the collector's own sum of the four kinds over every call of the run. It is the run's token count.
- `reported_total` is what Claude Code reported (`totalTokens` or `subagent_tokens`). It is the last call's context size, not the run's total (finding F6: exact in 9 of 15 resumed agents, 3 to 430 tokens above the last call in the other 6). It is kept because it shows how large a run's context had grown, which a resume pays for on every later call.
- `total_mismatch` is true when the two differ by more than 1%. On a run of more than one call it is expected to be true (it was true in 40 of 40 runs in the F6 check), so it says nothing there. Only on a one-call run does a mismatch point at a counting fault.
- Lessons, proposals, `Baseline:` and `Check:` lines compare `tokens.total` or the four kinds, never `reported_total` and never a notice figure.
- `tool_uses`: `tool_use` blocks in the run, counted once per block `id`.
- `duration_ms`: the reported duration when there is one, else the last line's `timestamp` minus the first.
- A number the collector could not find is `null`, never 0, and `missing` names the source.

## Acceptance criteria

| #   | Given                                                      | When                                 | Result                                                              | Data effect                                       | Evidence                                          |
| --- | ---------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| 1   | A task folder with records and its agent transcript        | `metrics.mjs collect ORV-1`          | One row per task: role, round, outcome, tokens, tool uses, duration | `.orivilo/metrics/ORV-1.json`, valid `metrics.v1` | `metrics` test                                    |
| 2   | One message id on three transcript lines                   | `collect`                            | Its usage counts once                                               | Sums equal the fixture's deduped sums             | `metrics` test                                    |
| 3   | Usage with input, cache write, cache read and output       | `collect`                            | Four sums and their total, never the total alone                    | `tokens` has five sums                            | `metrics` test                                    |
| 4   | An Agent result with `totalTokens`                         | `collect`                            | Both totals kept; a gap over 1% is flagged                          | `reported_total`, `total_mismatch: true`          | `metrics` test                                    |
| 5   | A `reviewer.v1` result: 1 Critical, 2 Important, 1 dropped | `collect`                            | Kept findings by severity, dropped counted apart                    | `critical: 1`, `important: 2`, `dropped: 1`       | `metrics` test                                    |
| 6   | `resumedAgentId` in a `SendMessage` result names the agent | `collect`                            | A second run for the task, marked resumed                           | `runs[1].start: "resumed"`                        | `metrics` test                                    |
| 7   | A builder envelope closed `no_report`                      | `collect`                            | The task stays, with its tokens and outcome                         | `outcome: "no_report"`                            | `metrics` test                                    |
| 8   | Two heartbeat lines where SubagentStop sent the agent back | `collect`                            | Both send-backs are counted                                         | `sent_back: 2`                                    | `metrics` test                                    |
| 9   | The task's `envelope.json`                                 | `collect`                            | The envelope's size is kept                                         | `bytes`, `context_pointers`, `facts`              | `metrics` test                                    |
| 10  | A bound task with no agent transcript                      | `collect`                            | Exit 0; stderr names the gap                                        | Numbers `null`, never 0; `missing` names it       | `metrics` test                                    |
| 11  | A transcript line that is not JSON                         | `collect`                            | The line is skipped and counted                                     | `skipped_lines: 1`                                | `metrics` test                                    |
| 12  | A canary string in every fixture text field                | `collect`, `report`, `session`       | The canary is in no file, stdout or stderr                          | Numbers, ids, enums, times, model ids only        | `metrics` test                                    |
| 13  | Any collector run                                          | `collect`                            | No transcript path or home folder in any output                     | Sessions and agents by id only                    | `metrics` test                                    |
| 14  | Any collector run                                          | `collect`                            | Records and transcripts are byte for byte unchanged                 | Writes under `.orivilo/metrics/` only             | `metrics` test, file hashes                       |
| 15  | A transcript `version` the tests were not recorded on      | `collect`                            | A warning names the version; numbers still computed                 | `cc_versions` lists it                            | `metrics` test                                    |
| 16  | ORV-1 and ORV-2 collected                                  | `metrics.mjs report ORV-1 ORV-2`     | Tables by role and by issue, every `metrics.v1` sum                 | stdout or `.orivilo/metrics/<name>.md`            | `metrics` snapshot test                           |
| 17  | Fresh and resumed reviewer runs                            | `report`                             | Fresh and resumed apart: runs, median tokens, median tool uses      | stdout only                                       | `metrics` test                                    |
| 18  | A session that repeats a completion notice                 | `metrics.mjs session <id>`           | Each notice once; main session tokens on their own line             | stdout only                                       | `metrics` test                                    |
| 19  | A slice merged into `develop`, or a batch on staging       | The `ovl` after-merge step           | Collect, report, then a `ds-architect` envelope with `retro`        | An `envelope.json` for the improvement task       | `grep -n metrics.mjs .claude/skills/ovl/SKILL.md` |
| 20  | A lesson whose `## Expected saving` lacks a line           | `pnpm check:knowledge`               | Fails and names the missing line                                    | None                                              | `check-knowledge` test                            |
| 21  | A `Check:` line that is not a collector command            | `pnpm check:knowledge`               | Fails: the check must be a collector command                        | None                                              | `check-knowledge` test                            |
| 22  | A `Baseline:` line with `n=2`                              | `pnpm check:knowledge`               | Fails: a baseline needs n of 3 or more                              | None                                              | `check-knowledge` test                            |
| 23  | A promoted saving past `Check after`, not measured         | `metrics.mjs due`                    | The lesson is listed as due                                         | stdout only                                       | `metrics` test                                    |
| 24  | Fewer than 3 tasks of the kind a change targets            | The improvement task ends            | No proposal for it; its report says why                             | No lesson file is written                         | Improvement `result.json`                         |
| 25  | An improvement task                                        | It edits a rule, agent or skill file | The merge is blocked: the file is outside its `write_set`           | Lesson paths only in its `write_set`              | ORV-81 AC 39, `merge-guard`                       |

Notes on the rows:

- Row 4 tests that both totals are kept and the 1% gap is flagged. Since v1.1 a flag on a multi-call run is the expected result, not a fault (see `total_mismatch` above).
- `metrics.mjs` means `node scripts/ovl/metrics.mjs`. The `metrics` tests run under `pnpm test:scripts` on fixtures: synthetic records and transcripts, plus samples recorded in slice 1 with every text field replaced by the canary. No test reads the owner's real transcripts.
- Row 12's canary goes into every text field the sources can hold: prompts, assistant text, tool inputs and results, `description`, `last_assistant_message`, Jira text, envelope `objective`, `facts` and `boundaries`. Output may hold only numbers, ids (`task_id`, `issue`, `session_id`, `agent_id`, `message.id` is not kept), enums, ISO times and model ids.
- Row 18: `session` mode reads one main transcript and its subagent files, with or without run records, so sessions from before slice A3 can be measured too. Main-session tokens are summed per session on a line marked "main session, not per task".
- Row 23 and row 24 are about the lesson format in "Improvement loop" below. Row 24's evidence is the improvement task's `implementer.v1` report with `result: done` and `changed: []`, and a `deviations` line that names each change it did not propose and its `n`.
- Row 25 needs ORV-81 slice C1 (`merge-guard`). Until C1 merges, the G3 packet of an improvement PR lists its changed files for the owner instead.
- A local check, not a row (it needs the owner's transcript): slice 2's qa runs `session 0baff5a3-4a6a-4d70-99db-b6b7a526f04f` and lists, for the 76 runs of the baseline, each run's `tokens.total` beside its notice figure, and any baseline run it could not find. The notice is the last call's size, so the two differ on every multi-call run; the check is that every run is found and that a one-call run's figures agree. That session went on after the baseline, so later runs are expected.

## Improvement loop

### When

After each slice merges into `develop` (its G3), and after each release batch reaches staging. The `ovl` skill gains one step for this; the full `ovl` skill of ORV-81 slice D keeps it.

### Steps

1. The main session runs `node scripts/ovl/metrics.mjs collect <ISSUE>` for each issue in scope, then `node scripts/ovl/metrics.mjs report <ISSUE...> --out <batch>` and `node scripts/ovl/metrics.mjs due`. Both are plain script runs that `write-guard` allows (`node scripts/ovl/<name>.mjs`).
2. It dispatches one envelope: role `ds-architect` (open question 1), skills `["retro"]`, `context_pointers` with the report file, `docs/LESSONS.md`, `docs/lessons/README.md` and this spec, and `write_set` `["docs/lessons/L-*.md", "docs/LESSONS.md", "docs/lessons/README.md"]`. A fact cites the report file as its `checked_by`.
3. The role reads the report and the due list, never a transcript. For each change it can back with numbers, it writes one lesson file by the retro skill, with the section below. A change that would save little, or whose kind has fewer than 3 tasks in the report, is not proposed (row 24). "No proposal this time" is a valid result.
4. For each due lesson it re-runs that lesson's `Check:` command and adds `## Measured after`. A verdict of `not met` comes with a new proposal to revert or change the rule.
5. The main session posts a Jira comment on the slice's issue that lists each proposal (lesson id, rule in short, expected saving, guard metric) and each measured result, then asks the owner a question form with `Approve L-NNNN` and `Decline` per proposal (open question 4).
6. On approval, the retro skill's step 9 applies: a second envelope to the same role, whose `write_set` names the target rule file exactly, applies the diff, and the ledger row and the file's `Status:` become `promoted`. A declined proposal stays `proposed` with a line saying the owner declined it and when.

The improvement task is a task like any other: its own tokens show up in the next report under its role, so the loop measures its own cost.

### The `## Expected saving` section

A lesson that proposes a process change for cost or flow adds this section after `## Rule`. `pnpm check:knowledge` checks that every line is there (rows 20 to 22):

```markdown
## Expected saving

- Metric: median `tokens.total` per reviewer run with round 1 or more
- Baseline: median 2,660,391, n=3, from ORV-81, ORV-85 (`node scripts/ovl/metrics.mjs report ORV-81 ORV-85`)
- Target: median 1,000,000 or less, about 60% less per re-check
- Guard metric: kept Critical and Important findings per review do not fall
- Evidence removed: none
- Check: `node scripts/ovl/metrics.mjs report ORV-90 ORV-91`
- Check after: 2026-11-06
```

The example only shows the format; it is not a measured proposal. Its baseline is the median `tokens.total` of the three resumed reviewer runs in the F6 check (2,829,134, 2,660,391 and 1,639,697), not the output of the command shown. v1 used 197,719 here, which was one of those runs' notice figure (its last call), not its total.

- `Baseline:` cites the command that produced it and has `n=` of 3 or more.
- `Metric:`, `Baseline:` and `Target:` count `tokens.total` or one of the four kinds, never `reported_total` or a notice figure.
- `Guard metric:` names what must not get worse. A saving that lowers the kept findings, or lets a defect reach staging that the owner then finds, is not a saving.
- `Evidence removed:` is `none`, or names the check, review or record the change removes. Anything other than `none` touches a gate (ADR 0012, ADR 0013): the proposal says so in its first line and needs an ADR amendment as well as the owner's approval.
- `Check:` is a `node scripts/ovl/metrics.mjs` command.
- `Check after:` is a date. By then at least 5 comparable tasks should exist; if they do not, the measured verdict is `not enough data` and the date moves on.

`## Measured after` holds `Measured:` (median, `n=`, issues, the command), `Guard metric:` (its value) and `Verdict:` (`met`, `not met` or `not enough data`), with the date.

## Rules and bounds

- **Numbers and ids only.** The collector reads text-bearing files, and keeps none of the text. It never writes prompt, message, tool input, tool result, description, file path, transcript path or Jira text to a file, stdout or stderr (rows 12, 13). Session and agent ids are random ids, not personal data. This holds for the report and the lesson files too: a lesson quotes numbers and task ids, never an excerpt of a transcript.
- **Read-only.** The collector writes only under `.orivilo/metrics/` and changes no record and no transcript (row 14). It is not a record writer in the ORV-81 sense, and its output never counts for a gate.
- **Nothing automatic decides.** No hook runs the collector and no guard reads its output. A process change happens only through a lesson the owner approved.
- **Lean.** One script beside the other `/ovl` scripts, reusing their records reader and `ajv`. No new agent, no new hook, no new dependency. A new agent was considered and not chosen: `envelope.v1` lists the roles in an enum, so a new role means a contract change, a guard-file PR and a new row in the role table, while the job (read numbers, write a proposal by the retro format) fits an existing Opus role with the `retro` skill.
- **Guard files.** `scripts/ovl/metrics.mjs` and its schema sit under `scripts/ovl/`, a guard folder (ORV-81). A builder writes them only when its `write_set` lists the exact path, and once slice C1 has merged the PR needs the owner's approval record. Open question 2 weighs this.
- **Medians, not means.** Every comparison uses medians, with `n` shown, because one long run would move a mean.
- **No money.** The collector reports tokens by kind, never a price (open question 6).

## Honest limits

What the metrics cannot show, said in every report footer and every G3 packet of this story:

- **The orchestrator per task.** Main-session tokens are summed per session in `session` mode only. Planning, writing envelopes and reading reports cost tokens there, and none of it is split per task.
- **Money.** A cache read is not priced like an output token, and the plan the owner pays on is not in any source. A total is a count, not a cost.
- **Cache behaviour.** The collector shows cache write and cache read counts as the API reported them. It cannot show why a cache missed, or what a different dispatch would have hit.
- **Waiting.** CI, the owner's answers and permission prompts are not in agent duration. The baseline's point that shipping is mostly CI waiting is not measured here (out of scope).
- **Quality.** Tokens, rounds and finding counts do not show whether a review was good. Defects the owner finds after G3 are counted only when they are filed as a Jira issue; the collector does not count them.
- **Runs outside records.** `Explore` runs and sessions without `/ovl` have no envelope, so they have no task, role or round. `session` mode shows them as runs without a task.
- **Resumes.** `envelope-guard` matches `Agent` calls only, so before ORV-88 a `SendMessage` resume ran with no envelope. Open question 7 is answered: with the ORV-88 PR, `resume-guard` blocks every `SendMessage` call. A resumed run in the data predates that PR or ran in a session without the hooks; the collector still attaches it to the task by `agent_id`, but nothing checked what it was asked.
- **Small samples.** A batch holds a handful of tasks, and story size varies a lot. A met target is a sign, not proof; nothing here claims statistical significance.
- **Integrity.** Transcripts live outside the repo and can be edited by any process; `.orivilo/` is protected only from tool writes. That is acceptable because metrics are never evidence for a gate.
- **Format drift.** The transcript shape is Claude Code's, not ours. A version the tests were not recorded on is warned about (row 15), and a missing field gives `null`, never a guessed 0.
- **Retention.** If Claude Code cleans up a transcript before the collector runs, that task's numbers are `null`. The loop runs after each slice for that reason.

How a saving is checked after it is adopted: the lesson names its metric, its baseline with `n`, its target, its guard metric, the exact collector command and a date. At that date the next improvement run re-runs the command over the tasks since promotion and writes `## Measured after` with the measured median, `n`, the guard metric and a verdict. A rule that missed its target, or whose guard metric got worse, gets a proposal to revert it. `metrics.mjs due` keeps the list of open checks, so none is forgotten (row 23).

## Risks

- **Optimising the number instead of the work.** Fewer review tokens can mean a worse review. Mitigation: the guard metric and the `Evidence removed:` line, and any proposal that removes evidence needs an ADR amendment.
- **A personal-data leak through a new field.** Mitigation: `additionalProperties: false` throughout `metrics.v1`, and the canary test across all three commands.
- **Wrong numbers that look right.** Double counting by repeated `message.id` lines, or a reported total that means something else (it did: the notice is the last call's size, finding F6). Mitigation: dedupe by id (row 2), keep both totals and flag a gap (row 4), compare only `tokens.total` or the four kinds in lessons, record real samples in slice 1.
- **Noise.** Proposals from too little data. Mitigation: `n` of 3 or more for a baseline, 5 for a check, and the owner's approval.
- **The loop's own cost.** Each run is one more Opus task per slice. Mitigation: it is measured like any task, and a proposal can target it.

## Impact

- New: `scripts/ovl/metrics.mjs`, `scripts/ovl/schemas/metrics.v1.json`, their tests and fixtures under `scripts/ovl/`, and the local folder `.orivilo/metrics/` (already ignored with `.orivilo/`).
- Changed: `.claude/skills/ovl/SKILL.md` (the after-merge step), `.claude/skills/retro/SKILL.md` (a cost and flow step that reads the metrics report and writes `## Expected saving`), `docs/lessons/README.md` (the two new sections in the format), `scripts/check-knowledge.mjs` and its test (the line rules for `## Expected saving`).
- New contract: `metrics.v1`. No change to `envelope.v1`, `implementer.v1`, `reviewer.v1`, `qa.v1`, any hook, or `.claude/settings.json`.
- Other issues: ORV-81 slice D keeps the after-merge step in the full `ovl` skill. ORV-86 (slice A3) must merge before the collector sees real `agent.json` and `result.json` files. Open question 7 is answered and built by ORV-88 (`resume-guard`).
- No product code, token, component API or schema in `packages/` or `apps/` changes.

## Out of scope

- CI and other waiting time (open question 10).
- Prices and money (open question 6).
- Any hook that collects automatically, and any guard that reads metrics.
- Blocking or enveloping `SendMessage` resumes; ORV-88 blocks them (open question 7).
- Headless runs and dashboards.
- Measuring sessions on other machines; the collector reads this machine's `~/.claude/projects/`.

## Slices

Each slice is one PR of about 400 changed lines, with its own Jira issue linked to ORV-87.

1. **Collector.** First, record samples with every text field replaced: a foreground Agent call's `toolUseResult` in a 2.1.308 transcript, one `SendMessage` resume and what the agent transcript holds after it, and the `decision` value of a SubagentStop send-back from the hook code. Then `metrics.v1`, `collect` and its tests (rows 1 to 15). Real records arrive with ORV-86; until then the tests use fixture records.
2. **Report.** `report` and `session` (rows 16 to 18), and the local check on the baseline session.
3. **Loop.** The `ovl` and `retro` skill steps, the lesson format, the `check-knowledge` rules and `due` (rows 19 to 25). Its acceptance in practice is the first improvement run on the ORV-81 slices.

## Open questions (option, impact, default)

1. **Who runs the improvement analysis.** Options: `ds-architect` with the `retro` skill; `product` with the `retro` skill; a new `improver` agent. Impact: a new agent changes the `envelope.v1` role enum, a guard file, and the role table; `product` already owns specs, which mixes jobs. Default: `ds-architect`, an Opus role that owns contracts and process decisions and did not build the work it judges.
2. **Where the collector lives.** Options: `scripts/ovl/metrics.mjs`, a guard file (exact `write_set` path, owner approval at merge after C1); or `scripts/metrics.mjs`, not guarded. Impact: outside `scripts/ovl/`, any builder could change how the numbers are counted without the owner seeing it, and the main session's run of it is not on `write-guard`'s allowed list. Default: `scripts/ovl/metrics.mjs`.
3. **Cadence.** Options: after each slice and each batch; after each batch only; on request. Impact: per slice gives more data points and costs one more Opus task per slice. Default: after each slice and each batch.
4. **How the owner approves a proposal.** Options: a question form with `Approve L-NNNN` and `Decline` per proposal; chat, as lessons are approved today. Impact: a click is unambiguous and sits in the transcript, but no hook writes a record of it in this story. Default: the question form.
5. **Check window.** Options: a date 14 days after promotion and at least 5 comparable tasks; the next batch; a fixed task count. Default: 14 days and at least 5 tasks, else `not enough data`.
6. **Money.** Options: tokens by kind only; a pinned price table per model in the report. Impact: a price table must be kept current and may not match the owner's plan. Default: tokens by kind only.
7. **Resumes run without an envelope.** Options: measure only, and raise a follow-up on ORV-81; block `SendMessage` in `envelope-guard` now; require an envelope for a resume. Impact: the baseline's costliest re-checks were resumes, and today nothing checks what a resumed agent is asked. Default: measure only here, and raise the ORV-81 follow-up with the first report's numbers. Answered by the owner on 2026-10-23 in the question form: "ห้าม resume ส่งงานใหม่ทุกครั้ง" (no resume; dispatch new work every time). This replaces the default. ORV-88 builds it as `resume-guard`, which blocks every `SendMessage` call, and the collector keeps the fresh and resumed split so it can still read past sessions (`docs/specs/ORV-88/spec.md`).
8. **Main-session tokens.** Options: one line per session in `session` mode; leave them out; split them by time between dispatches. Impact: a time split would look precise and would not be. Default: one line per session, marked not per task.
9. **Lane.** Options: L or M. Impact: L adds G1 and the owner's G2 on the reading of personal transcripts. Default: L.
10. **CI and waiting time.** Options: out of scope; add `gh run view` timings to `report` in slice 2. Impact: the baseline says shipping time is mostly CI, so it is worth measuring, but it is a different source and about 100 more lines. Default: out of scope, a follow-up issue if the owner wants it.
11. **Assumed thresholds.** A 1% gap for `total_mismatch`, `n` of 3 for a baseline and 5 for a check. Since v1.1 the 1% gap means something only on a one-call run. Default: as stated; the first improvement run may propose others.

## Changelog

- v1 (2026-10-23): spec.
- v1.1 (2026-10-24): finding F6 of reviewer task ORV-87-collector-review-1. `reported_total` (a notice's `subagent_tokens`) is the last call's context size, not the run total; `total_mismatch` is expected on multi-call runs; lessons and proposals compare `tokens.total` or the four kinds. The Why baseline and the `## Expected saving` example are corrected. Review: `docs/specs/ORV-87/samples.md` (say "exact in 9 of 15", not an exact rule), `scripts/ovl/metrics.mjs` and `scripts/ovl/schemas/metrics.v1.json` (descriptions of `reported_total` and `total_mismatch`, no shape change), `scripts/ovl/metrics.test.mjs` (row 4), and slice 3's `docs/lessons/README.md`, `.claude/skills/retro/SKILL.md` and `scripts/check-knowledge.mjs` (the metric rule for `## Expected saving`).
- v1.2 (2026-10-24): ORV-88. Open question 7 is answered by the owner (no resume) and replaces its default; Honest limits "Resumes are not guarded" becomes "Resumes", saying that `resume-guard` blocks every `SendMessage` call with the ORV-88 PR; Impact and Out of scope point to ORV-88. No metric, row or schema changes. Review: `scripts/ovl/metrics.mjs` and `scripts/ovl/metrics.test.mjs` (the notes line, ORV-88 row 16), `docs/specs/ORV-81/spec.md` v1.4.
- v1.2 note (2026-10-24): ORV-93 (PR 85), no version bump and no row change here. `session <id>` gains `--out <name>`, which writes the same text to `.orivilo/metrics/<name>.md` under the records root of `cwd` and prints `wrote <absolute path>`; without `--out`, stdout is unchanged (row 18). `--out` takes a plain name, never a path. With `--out`, `--root <dir>` is accepted only when `<dir>` is the root of a main checkout; a subfolder, a worktree root or a folder in no git checkout exits 2 with `metrics: --root is not the root of a checkout` and writes nothing. This replaces the main session's hand write of `.orivilo/metrics/session-*.md`, which `write-guard` now blocks; Improvement loop step 1's plain script runs stay allowed. Its rows are ORV-93 row 21 (`docs/specs/ORV-93/spec.md` v1.3). `--root` checks the shape, not the project, so it can write under another repo's main checkout (ORV-93 Honest limits). Review: `scripts/ovl/metrics.mjs` and `scripts/ovl/metrics.test.mjs`, `.claude/skills/ovl/SKILL.md` step 4.
