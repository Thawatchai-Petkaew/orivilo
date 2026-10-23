---
name: ovl
description: Run work as the orchestrator. Write a checked JSON envelope for each task, dispatch it to one role, and ask the owner for a rework round through a question form. Use to dispatch any subagent in this repo. This is the minimal skill (slices A2 and A3 of ORV-81); the full loop arrives in slice D.
---

# ovl (slices A2 and A3, minimal)

Hooks now check every Agent call in this repo, in every session. The main session plans and dispatches; it does not write the deliverable. Spec: `docs/specs/ORV-81/spec.md`. Decisions: ADR 0013 and ADR 0014.

## 1. Start of a run: doctor

```bash
node scripts/ovl/doctor.mjs plan
```

Make the one probe call it prints for each guard (each is built to be blocked, so it changes nothing). Then run `node scripts/ovl/doctor.mjs check <since>` with the `since` value from the plan. If it exits 2, stop and name the silent guard to the owner.

If the doctor says a dependency is missing, run `pnpm install` and start again. `plan` also closes envelopes left open by slice A2 (`closed_pre_a3`); it lists them, and none counts as a round. `result-recorder` cannot be probed: after the first Agent call returns, run `node scripts/ovl/doctor.mjs recorder <since>` and stop if it exits 2.

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

The guard blocks, with exit 2 and a reason on stderr, when:

- **`task_id`** is used already for this issue. Every dispatch, including a retry after a refused call, needs a new `task_id` (`ORV-<n>-<lowercase-words>`).
- **`checked_by`** is prose. Allowed: a command starting with `pnpm `, `node `, `git `, `gh `, `test `, `grep ` or `jq `; a `path` or `path:line` that exists in the worktree; an `https://` URL; a Jira reference `ORV-<n> comment <id>`. An answer the owner gave in chat is recorded in Jira or the spec first, then cited.
- **`done_when`** is not a check. Each entry is a command with those prefixes, or a `path:line` reference. `pnpm test` passes; "tests pass" does not.
- **`write_set`** is too broad. Each entry is an exact file or a glob under at least two fixed folders (`scripts/ovl/*.mjs` passes; `packages/`, `apps/**` and `**` do not). No `.` or `..` segment, no leading `./`, no empty segment, and no brace or extglob character (`{ ( ! + @ [`) before the second folder. It is empty for `reviewer`, `qa` and `release`, and not empty for the other roles.
- **`skills`** misses a required one: `product` needs `discover`; `designer` needs `frontend-design` and `webapp-testing`; `builder` needs `quality-gate`; `qa` needs `quality-gate` and `webapp-testing`; `release` needs `gate-packet`; `ds-architect` and `reviewer` need none.
- **Issue.** For builder, reviewer, qa and designer, the envelope `issue` must equal the key in the checkout's branch name (`<type>/ORV-<n>-<slug>`); a branch without a key blocks.
- **Background, model, isolation.** Blocked for every agent, Explore included.
- **Open envelope.** One envelope per role is open in this checkout, across all issues. A second one is blocked until the first has a report or is closed (see step 4).
- **Rework rules** (builder only). After a `request_changes` verdict or a failed gate record for the issue, the envelope must name `rework_of`, a task of the same issue that started. After two rework rounds, a builder envelope is blocked: first get a verdict on the last builder round (qa, reviewer or the gate); only if that verdict requests changes, the owner must grant another (step 3).

A valid call is saved as `.orivilo/runs/<ISSUE>/<task_id>/envelope.json`. Records are local and are not committed.

## 3. Rework round after round 2: ask the form

When the work stops for the owner, post both reports on the Jira issue, then ask a question form (`AskUserQuestion`) with these options, and no other way to grant:

- the grant option, whose whole label is exactly `อนุญาตรอบ ORV-<n>` or `Grant round ORV-<n>`, naming the escalated issue key, with nothing before or after it
- a decline option, worded without the grant phrase (`Decline`, `ไม่อนุญาต`, never `Do not grant round ORV-<n>`)

Only the grant option the owner clicks counts. Text typed in chat never grants a round, and neither does text typed under Other. If the owner types a grant in chat, say it does not count and ask the form. The `owner-grant` hook writes the record `.orivilo/runs/<ISSUE>/owner-grant-<n>.json`; it quotes the question, the options and the answer.

## 4. After the call: records and closing

Hooks write the records; the main session never does. A subagent's final message must be exactly one JSON object in its contract (`implementer.v1`, `reviewer.v1` or `qa.v1`), and the same JSON object is what the Agent call returns. Prose is sent back to the subagent. A valid report becomes `result.json` in the task folder; a `reviewer.v1` or `qa.v1` finding with no evidence that can be run again moves to `dropped` and does not count. A call that returns no valid report closes the envelope as `no_report`. An Agent call that fails or is interrupted (`PostToolUseFailure`) closes its bound envelope as `no_report` too.

If the Agent call was refused at the permission prompt, the envelope never started. Close it before the next dispatch of that role:

```bash
node scripts/ovl/close-envelope.mjs <task_id>
```

For an envelope whose subagent has already stopped, the same command closes it as `abandoned`. It refuses (exit 2) while the subagent may still run. If a session ended while its subagent ran, only the owner closes the envelope, from a terminal outside Claude Code, with `--owner`. Never run `--owner` yourself.

A builder envelope that was bound counts as a rework round after the first verdict, however it ended. Only `denied` and `pre_a3` do not.

Running `pnpm quality-gate` in the main session writes a gate record from `.quality-gate/report.json`, whether the run passes (`PostToolUse`) or fails (`PostToolUseFailure`; a failing gate exits 1). A record is written only when the report started after the command started, finished no later than now, and is for the commit now checked out. The same run inside a subagent writes none, an interrupted run writes none, and a partial run (`--only`) writes none.

## Honest limits of this slice

- `SubagentStart` cannot block (exit 2 only shows stderr). If a subagent starts with no single open envelope to bind to, it runs unbound: no `agent.json`, no round counted, no `result.json`. The guard at dispatch time (one open envelope per role, checked again after the envelope is saved, so two same-role calls made at once never both run: at most one is allowed and the others close as denied) is what prevents this, not the start hook. Every record is written whole (aside, then linked into place), so a start hook running at the same moment as another never reads half a record. One residual window remains: a losing envelope of a same-role race stays visible as open and unbound until its `closed.json` is written, and on a very slow filesystem the winner's start hook could scan inside that span, see two candidates and run unbound. It was not reproduced in 31 trials.
- Until slice B ships `write-guard`, any session or subagent can run `close-envelope --owner`, or append an `allow` line to `.orivilo/heartbeat.jsonl`, and so close a bound envelope as `abandoned` while its subagent may still run.
- The stories-file check on a `qa.v1` approve reads the local `origin/develop` ref, which any session can move. Treat a recorded approve as evidence only after you check the changed stories files yourself, until develop is resolved the way `merge-guard` will.

## Not in this slice

Nothing yet guards writes or merges, or checks the G3 move. Those arrive in slices B, C1 and C2. Until then, do not claim a role's work as evidence on its own say-so: a gate needs the recorded `qa.v1` and `reviewer.v1` results and the checks you ran yourself.
