---
name: ovl
description: Run work as the orchestrator. Write a checked JSON envelope for each task, dispatch it to one role, and ask the owner for a rework round through a question form. Use to dispatch any subagent in this repo. This is the minimal slice A2 skill (ORV-81); the full loop arrives in slice D.
---

# ovl (slice A2, minimal)

Hooks now check every Agent call in this repo, in every session. The main session plans and dispatches; it does not write the deliverable. Spec: `docs/specs/ORV-81/spec.md`. Decisions: ADR 0013 and ADR 0014.

## 1. Start of a run: doctor

```bash
node scripts/ovl/doctor.mjs plan
```

Make the one probe call it prints for each guard (each is built to be blocked, so it changes nothing). Then run `node scripts/ovl/doctor.mjs check <since>` with the `since` value from the plan. If it exits 2, stop and name the silent guard to the owner.

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
- **Rework rules** (builder only). After a `request_changes` verdict or a failed gate record for the issue, the envelope must name `rework_of`, a task of the same issue that started. After two rework rounds, a builder envelope is blocked: first get a verdict on the last builder round (qa, reviewer or the gate); only if that verdict requests changes, the owner must grant another (step 3).

A valid call is saved as `.orivilo/runs/<ISSUE>/<task_id>/envelope.json`. Records are local and are not committed.

## 3. Rework round after round 2: ask the form

When the work stops for the owner, post both reports on the Jira issue, then ask a question form (`AskUserQuestion`) with these options, and no other way to grant:

- the grant option, whose whole label is exactly `อนุญาตรอบ ORV-<n>` or `Grant round ORV-<n>`, naming the escalated issue key, with nothing before or after it
- a decline option, worded without the grant phrase (`Decline`, `ไม่อนุญาต`, never `Do not grant round ORV-<n>`)

Only the grant option the owner clicks counts. Text typed in chat never grants a round, and neither does text typed under Other. If the owner types a grant in chat, say it does not count and ask the form. The `owner-grant` hook writes the record `.orivilo/runs/<ISSUE>/owner-grant-<n>.json`; it quotes the question, the options and the answer.

## Not in this slice

Nothing yet records a subagent's report, closes an envelope, guards writes or merges, or checks the G3 move. Those arrive in slices A3, B, C1 and C2. Until A3, an envelope is never closed, so do not claim a role's work as evidence on its own say-so: run the checks yourself and quote them.
