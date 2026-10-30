---
issue: ORV-162 (https://tpetkaew.atlassian.net/browse/ORV-162)
lane: S (loop tooling: one guard script and its test; no product code, no contract of the app)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1
---

# ORV-162: result-recorder judges a report against the envelope's worktree

## Why

`result-recorder` judges a subagent's final report against one checkout. Today that checkout is `handle()`'s `root = gitTop(input.cwd)` in `scripts/ovl/hook.mjs`, the checkout the hook runs in, which is the session's main checkout. A qa or reviewer bound to an issue worktree under `.claude/worktrees/<name>` (ORV-146) runs its gate and reads its spec there, but `judge` in `scripts/ovl/result-recorder.mjs` reads `.quality-gate/report.json`, `docs/specs/<KEY>/spec.md` and `git diff` from the main checkout. A valid approve is sent back or closed as `no_report` unless the main session first copies the spec into the main checkout (`.orivilo/handoff.md` lines 17 and 19, "spec copied to main"). The owner chose this fix in the question form on 2026-10-30 (Jira ORV-162).

Frame (L-0012): `result-recorder` is a guard rail for agents that follow the rules, not a boundary; a session without the hooks escapes it (SKILL.md "Honest limits"). The forms it must judge are the two a rule-following session produces: a foreground Agent call whose prompt is one envelope JSON (PostToolUse `Agent`, `onAgent`) and a background call's stop (`SubagentStop`, `onStop`), SKILL.md section 4. Nothing is simulated; the tests build real git repositories and worktrees through `scripts/ovl/hook-test-kit.mjs`.

Decisions it depends on: the ORV-146 spec (`docs/specs/ORV-146/spec.md`, `worktree-place-1`), ADR 0012 decision 4 (the owner's delegation), and the POC mode section of the ovl skill (ORV-137).

## Acceptance criteria

| #   | Given | When | Result | Tests |
| --- | ----- | ---- | ------ | ----- |
| 1   | A qa envelope bound with `worktree` W, an issue worktree under `<main>/.claude/worktrees/<name>`; W holds a clean full gate report for the head and `docs/specs/<KEY>/spec.md`; the main checkout holds neither | The qa's foreground Agent call returns a valid `qa.v1` approve (hook `cwd` is the main checkout) | `judge-root-1` picks W; the report, spec rows and diff are read from W; `result.json` and `qa.json` are written under the main checkout's `.orivilo/runs/<KEY>/<task_id>/`; exit 0 | `scripts/ovl/result-recorder.test.mjs` |
| 2   | The same envelope and checkouts as row 1, dispatched in the background | The subagent stops (`SubagentStop`, listed in `background_tasks`) with the same approve | `judge-root-1` picks W in `onStop` too; `result.json` is written once; exit 0 | `scripts/ovl/result-recorder.test.mjs` |
| 3   | An envelope whose `worktree` is a checkout with a different records root than the hook's (another clone of the repo) | Its subagent's report is judged | `judge-root-1` picks the hook's own root, as before ORV-162; the outcome equals today's for the same files | `scripts/ovl/result-recorder.test.mjs` |
| 4   | An envelope whose `worktree` folder no longer exists, or that has no `worktree` | Its subagent's report is judged | The hook fails closed: exit 2, stderr names the path; no `result.json` is written | `scripts/ovl/result-recorder.test.mjs` |

Each row's check: `node --test scripts/ovl/result-recorder.test.mjs` passes, with one test named "ORV-162 row <n>" per row.

## Rules

### judge-root-1

For `onAgent` and `onStop`, the checkout passed to `judge` is the bound envelope's `worktree` (its git top level) when `recordsRoot(worktree)` equals the hook's `store`; otherwise it is the hook's `root`. A `worktree` that is missing from the envelope or whose folder is gone fails closed (the error reaches `handle()`, which exits 2). The records are always written to the hook's `store`. `onBash` (gate records) is unchanged: it still reads the checkout of the Bash call's `cwd`.

## The ovl skill

SKILL.md has no line that tells the main session to copy a spec into the main checkout; the copy was a session habit recorded only in `.orivilo/handoff.md`. After ORV-162 that habit stops. These SKILL.md lines stay true and unchanged, since they concern gate records, not judging: lines 74 to 76 ("Parallel issues") and line 405 ("An approve across a merge of `develop`").

## Worked example

Not run here (no shell in this role); run from the repo root. It copies `judge-root-1` as a pure function, with the stores given as strings and a gone folder as `null`, and uses the worktree of `.orivilo/runs/ORV-145/ORV-145-review-1/envelope.json`. Strings, no rounding. Expected output, three lines: `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.claude/worktrees/orv-145`, then `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO`, then `fail closed: /Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.claude/worktrees/orv-145 no longer exists`.

```bash
node -e 'const pick=(root,store,wt,wtStore)=>{if(!wt||wtStore===null)throw new Error(wt+" no longer exists");return wtStore===store?wt:root};const M="/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO",W=M+"/.claude/worktrees/orv-145";console.log(pick(M,M,W,M));console.log(pick(M,M,"/elsewhere/ORIVILO","/elsewhere/ORIVILO"));try{pick(M,M,W,null)}catch(e){console.log("fail closed: "+e.message)}'
```

## Out of scope

- `onBash` and the gate record rule; `onStart` binding; `write-guard`.

## Open questions (with defaults)

1. Add one sentence to SKILL.md section 4 naming `judge-root-1`? Default: no; this spec is its home, and the skill states no copy step to remove.

## Changelog

- v1: first version (ORV-162-spec-1). Downstream to review: the builder envelope (cites rows 1 to 4 and `judge-root-1`) and the PR body.
