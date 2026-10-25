---
issue: ORV-81 (https://tpetkaew.atlassian.net/browse/ORV-81)
lane: L (epic size, seven build slices; it changes who may merge and who may move G3)
version: 1.5
---

## Why

The owner does not trust solo work, and the record shows why. From ORV-72 to ORV-78 the main session designed, built and checked its own work. G3 then passed four defects that the owner found in screenshots (ORV-80):

- a Checkbox not centred on its line, from an invalid `calc()` that had been there since E2-4;
- a cramped `sm` gap;
- story menus that overlap;
- a squash that reverted ORV-75.

Each one was "verified" in prose. None was caught by a check that ran. Allkons measured the same thing in their own repo: prose review caught 0 of 83 gaps, and running gates caught 7 of 7.

`/ovl` turns the main session into an orchestrator that cannot do the work and cannot pass a gate on its own word. Each task goes out as a JSON envelope to one role and comes back as a JSON report. Hooks, not the main session, write the records. Hooks and a script refuse the merge and the G3 move until the records prove the outcome.

## Decisions this spec relies on

- ADR 0013 (this story): the `/ovl` orchestrator.
- ADR 0014: the owner grants a rework round only by clicking an option in the question form. It amends ADR 0013 decisions 5 and 7.
- ADR 0012: who passes each gate. The owner decides G1, G2 and G5. During the POC, Claude passes G1 and G2 under the owner's delegation (decision 4). Claude passes G3 and G4 with evidence.
- ADR 0011: PRs go into `develop` once the full gate and CI are green, and `develop` deploys nothing.
- AGENTS.md iron rules 3 (verify before handoff) and 5 (humans own the gates). CLAUDE.md model policy: analysis on Opus, execution on Sonnet.
- ORV-13: `scripts/quality-gate.mjs` writes `.quality-gate/report.json` (`schemaVersion: 1`, `ok`, `git: {branch, sha, dirty}`, `steps[{name, status, exitCode, summary}]`) and exits non-zero on failure. Today the script exists only as an uncommitted file in the ORV-13 worktree; the branch `chore/ORV-13-quality-gate-script` has no commit of its own. An earlier draft wrote `git.sha` as a short SHA. ORV-81 needs `git.sha` as the full 40-hex SHA, `git.dirty` as a boolean, and `stepsSource`: `"gate"` for a real run, `"stub"` with `ok: false` when `QUALITY_GATE_STEPS_FILE` replaced the steps (ORV-13 review 4). ORV-13 keeps that shape when it merges, and the `pnpm quality-gate` alias it adds. Slices A3 and C1 wait for the merge.
- The owner passed G1 and G2 of ORV-81 on 2026-10-23, reviewing them personally (Jira ORV-81 comment 10056). The owner chose `ajv` as the validator, a blocking `write_set` union check at merge, and run records kept out of git.
- Decisions already made for this story (envelope `ORV-81-spec`, 2026-10-23): the name `ovl`; in-session first; the roles below; the records folder; the checks enforced with exit 2; at most two rework rounds, then the owner; the four lessons as rules.
- The owner's answers of 2026-10-23, given in chat through a question form and recorded here so envelopes can cite this line:
  1. Spec v1.1 is confirmed by a G2 addendum built from its change log.
  2. Open question 8: a PR that changes a guard file needs an owner approval record written from the owner's own terminal, and `merge-guard` blocks without it.
  3. Open question 9: after round 2, the owner's answer is enough to grant another round, and a hook writes a record that quotes it. Precedent: the owner granted ORV-13 a third round in chat ("อนุญาตรอบที่ 3"), and that round shipped. Narrowed by the owner on 2026-10-23, after the round-3 review, in the question form: "กดเลือกในแบบฟอร์มเท่านั้น" (count only answers clicked in the question form). Only an option the owner clicks in an `AskUserQuestion` form grants a round; text typed or pasted into chat never does (Hooks, `owner-grant`; ADR 0014).
  4. Open question 10: only `Explore` runs without an envelope.
- The owner's second set of answers, 2026-10-23, given in chat through the same question form:
  - (5) Open question 11: the owner merges slice C1 by hand in the GitHub web UI after reading its G3 packet.
  - (6) Open question 12: `.github/workflows/` files are guard files. A PR that edits them needs the owner's approval record from the owner's own terminal.
  - (7) Open question 13: one G2 addendum covers the v1.1, v1.2 and v1.3 change logs. The owner accepts the residual risk of the worktree's own `merge-guard` launcher copy (Honest limits).
  - (8) Spec round 3 is the last. After v1.3, a finding that does not block goes into Honest limits or is fixed in the slice that builds the mechanism, and build starts with slice A1.
- The owner's decision of 2026-10-24 in the question form (ORV-89 comment 10071): run records live in the main checkout's `.orivilo/` for the whole repo, and one envelope per role is open across the whole repo, not per worktree.
- The owner's answer of 2026-10-23 to ORV-87 open question 7, in the question form: "ห้าม resume ส่งงานใหม่ทุกครั้ง" (no resume; dispatch new work every time). ORV-88 builds it as `resume-guard` (`docs/specs/ORV-88/spec.md`).

## Story

As the owner, I want every task done by a named role from a checked brief, and every gate passed on records that a script can read, so that I stop finding on staging what G3 should have caught.

## Acceptance criteria

There is no UI in this story. Hook messages are English developer text on stderr, outside the locale catalog.

| #   | Given                                                  | When                                             | Result                                                                                                      | Evidence                         |
| --- | ------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | A `/ovl` run starts                                    | `ovl-doctor` probes each registered guard        | Each probe is blocked and logs a heartbeat; a silent guard stops the run and is named                       | `ovl-doctor` test                |
| 2   | A fact whose `checked_by` is missing or blank          | The main session calls Agent                     | Blocked with exit 2; stderr names the fact                                                                  | `envelope-guard` test            |
| 3   | A fact whose `checked_by` is prose, not a source       | The main session calls Agent                     | Blocked with exit 2; stderr lists the allowed `checked_by` forms                                            | `envelope-guard` test            |
| 4   | An envelope for role `qa` without `webapp-testing`     | The main session calls Agent                     | Blocked with exit 2; stderr names the role and the missing skill                                            | `envelope-guard` test            |
| 5   | An envelope that fails `envelope.v1`                   | The main session calls Agent                     | Blocked with exit 2; stderr gives the JSON path of each error                                               | `envelope-guard` test            |
| 6   | `done_when` holds `tests pass`                         | The main session calls Agent                     | Blocked with exit 2; stderr names the entry and the allowed forms                                           | `envelope-guard` test            |
| 7   | `done_when` holds `pnpm test`                          | The main session calls Agent                     | The call runs; `envelope.json` is saved under `.orivilo/runs/<ISSUE>/<task_id>/`                            | `envelope-guard` test            |
| 8   | A valid `qa` envelope                                  | Sent with `subagent_type: builder`               | Blocked with exit 2: the envelope role and the subagent type differ                                         | `envelope-guard` test            |
| 9   | An Agent call with no envelope                         | The main session calls Agent                     | Runs unrecorded for `subagent_type: Explore`; any other type is blocked with exit 2                         | `envelope-guard` test            |
| 10  | A `write_set` entry `packages/`, `apps/**` or `**`     | The main session calls Agent                     | Blocked with exit 2: a path, or a glob under two fixed folders                                              | `envelope-guard` test            |
| 11  | Two rounds used for the issue                          | A third builder envelope                         | Blocked with exit 2: "Two rework rounds used. Escalate to the owner."                                       | `envelope-guard` test            |
| 12  | Two rounds used as a chain, B of A and C of B          | Envelope D names `rework_of` C                   | Blocked with exit 2: rounds count per issue, not per `rework_of`                                            | `envelope-guard` test            |
| 13  | A `request_changes` or failed gate record              | A builder envelope without `rework_of`           | Blocked with exit 2: after a verdict, a builder must name `rework_of`                                       | `envelope-guard` test            |
| 14  | The owner granted a round in the form (`owner-grant`)  | The next builder envelope                        | Allowed: each grant adds one round after round 2                                                            | `envelope-guard` test            |
| 15  | A subagent ends with prose, not JSON                   | The subagent stops                               | Exit 2 sends it back to answer in its contract; no `result.json`                                            | `result-recorder` test           |
| 16  | A subagent ends with a valid report                    | Agent returns                                    | `result.json` holds the report, contract, `agent_id` and `agent_type`                                       | `result-recorder` test           |
| 17  | A `qa.v1` report from `agent_type: builder`            | The subagent stops                               | Exit 2: `qa.v1` comes only from `qa`; no `result.json`                                                      | `result-recorder` test           |
| 18  | A `reviewer.v1` finding with no re-executable evidence | Agent returns                                    | The finding moves to `dropped` and does not count                                                           | `result-recorder` test           |
| 19  | A `qa.v1` visual AC row whose only evidence is a test  | The subagent stops                               | Exit 2: a visual row needs a screenshot or a computed style                                                 | `result-recorder` test           |
| 20  | A `qa.v1` row marked `visual: false`                   | The subagent stops                               | Exit 2: the spec's keyword list makes the row visual                                                        | `result-recorder` test           |
| 21  | A `qa.v1` approve with `quality_gate.ok: false`        | The subagent stops                               | Exit 2: an approve needs a passing gate                                                                     | `result-recorder` test           |
| 22  | A `qa.v1` approve whose gate SHA is not `head_sha`     | The subagent stops                               | Exit 2: the evidence is stale                                                                               | `result-recorder` test           |
| 23  | A `qa.v1` approve missing a light screenshot           | The subagent stops                               | Exit 2; stderr names the story id and the mode                                                              | `result-recorder` test           |
| 24  | A screenshot outside its qa task folder, or not PNG    | The subagent stops                               | Exit 2; stderr names the path                                                                               | `result-recorder` test           |
| 25  | The main session                                       | Write or Edit under `packages/` or `apps/`       | Blocked with exit 2                                                                                         | `write-guard` test               |
| 26  | A builder subagent                                     | Write or Edit under `packages/`                  | Allowed                                                                                                     | `write-guard` test               |
| 27  | The main session                                       | Write `.orivilo/runs/ORV-1/t/qa.json`            | Blocked with exit 2                                                                                         | `write-guard` test               |
| 28  | The main session                                       | Bash `echo {} > .orivilo/runs/ORV-1/t/qa.json`   | Blocked with exit 2                                                                                         | `write-guard` test               |
| 29  | The main session                                       | Edit under `.claude/hooks/` or `scripts/ovl/`    | Blocked with exit 2                                                                                         | `write-guard` test               |
| 30  | The main session                                       | Edit `.claude/settings.json` or `.quality-gate/` | Blocked with exit 2                                                                                         | `write-guard` test               |
| 31  | A builder, its open envelope lists the path            | Write that exact path                            | Allowed; any other guard path is blocked                                                                    | `write-guard` test               |
| 32  | A `qa` subagent bound to its envelope                  | Bash `cp a.png` into its `screenshots/`          | Allowed for `*.png` there; another task's folder or any other file under `.orivilo/` is blocked             | `write-guard` test               |
| 33  | No `qa.json` approve on the PR head                    | `gh pr merge`                                    | Blocked with exit 2; stderr names the missing record                                                        | `merge-guard` test               |
| 34  | No `reviewer.v1` approve on the PR head                | `gh pr merge`                                    | Blocked with exit 2; stderr names the missing record                                                        | `merge-guard` test               |
| 35  | A check in `gh pr checks` is not green                 | `gh pr merge`                                    | Blocked with exit 2; stderr names the check                                                                 | `merge-guard` test               |
| 36  | The gate report is missing, failed, dirty or stale     | `gh pr merge`                                    | Blocked with exit 2; stderr names the field                                                                 | `merge-guard` test               |
| 37  | `qa.json` names a head SHA other than the PR head      | `gh pr merge`                                    | Blocked with exit 2: the evidence is stale                                                                  | `merge-guard` test               |
| 38  | A changed story with no light or no dark screenshot    | `gh pr merge`                                    | Blocked with exit 2; stderr names the story id and the mode                                                 | `merge-guard` test               |
| 39  | The PR has a file outside the run's `write_set` union  | `gh pr merge`                                    | Blocked with exit 2; stderr lists the files                                                                 | `merge-guard` test               |
| 40  | Any session                                            | `git push origin HEAD:develop`                   | Blocked with exit 2: `develop` and `main` move only by a guarded PR merge                                   | `merge-guard` test               |
| 41  | Any session                                            | `gh api -X PUT repos/o/r/pulls/7/merge`          | Blocked with exit 2: merges go through `gh pr merge`                                                        | `merge-guard` test               |
| 42  | Records are missing                                    | `gh  pr   merge 7` (extra spaces)                | Blocked with exit 2: whitespace is normalised first                                                         | `merge-guard` test               |
| 43  | A PR into `main` whose head is not `develop`           | `gh pr merge`                                    | Blocked with exit 2: only the release PR from `develop` goes into `main`                                    | `merge-guard` test               |
| 44  | Every record is present and current                    | `gh pr merge`                                    | The merge runs                                                                                              | `merge-guard` test               |
| 45  | The G3 evidence is incomplete                          | An Atlassian MCP move to G3 PR review            | Blocked with exit 2 by the merge checks plus the merge into `develop`                                       | `g3-check` test                  |
| 46  | A transition id not in `jira-transitions.json`         | An Atlassian MCP transition                      | Blocked with exit 2: an unknown target fails closed                                                         | `g3-check` test                  |
| 47  | Malformed JSON on stdin                                | Any hook runs, `pre-commit-gate` too             | Exit 2, never 0; `owner-grant` too, and it writes no record                                                 | Every hook test                  |
| 48  | A guard throws, or `node` is missing                   | Any hook runs                                    | Exit 2, never 0 or 1, `owner-grant` included; a test throws inside the guard                                | Every hook test                  |
| 49  | The docs ADR 0013 amends                               | Slice D is reviewed                              | `grep -rnw lead .claude/agents .claude/skills CLAUDE.md AGENTS.md docs/context` is empty; `lead.md` is gone | Command output and `reviewer.v1` |
| 50  | A builder envelope never started (call denied)         | `node scripts/ovl/close-envelope.mjs <task_id>`  | `closed.json` `{reason: denied}` is written; the next builder envelope is allowed; no round counts          | `close-envelope` test            |
| 51  | A subagent ended with no valid report                  | Agent returns                                    | `closed.json` `{reason: no_report}`; no `result.json`; closed, yet a bound builder's is a round             | `result-recorder` test           |
| 52  | A builder envelope is open in any worktree, any issue  | A second builder envelope, in parallel or later  | Blocked with exit 2; stderr names the open `task_id`. One open envelope per role across the repo            | `envelope-guard` test            |
| 53  | Open `qa` and `designer` envelopes, each bound         | qa writes a PNG into the designer's folder       | Blocked with exit 2: exceptions match the writer's `agent_id`, not its type                                 | `write-guard` test               |
| 54  | An `Explore` subagent ends                             | SubagentStop runs                                | Exit 0; nothing is recorded and nothing is checked                                                          | `result-recorder` test           |
| 55  | A builder runs the gate while its tests are red        | `pnpm quality-gate` exits 1 inside the subagent  | No gate record is written; the run is not a verdict and starts no round count                               | `result-recorder` test           |
| 56  | The main session in a worktree                         | `pnpm quality-gate` or `pnpm run quality-gate`   | A gate record `{ok, sha, dirty, steps_source}` is written from the report                                   | `result-recorder` test           |
| 57  | The gate report has `stepsSource: "stub"`              | `gh pr merge`                                    | Blocked with exit 2: a merge needs `stepsSource: "gate"`                                                    | `merge-guard` test               |
| 58  | A `qa.v1` approve on a stub gate report                | The subagent stops                               | Exit 2: an approve needs a report from a real gate run                                                      | `result-recorder` test           |
| 59  | A PR whose diff weakens `merge-guard`                  | `gh pr merge` from the PR's worktree             | Judged by the checks from the remote `develop` SHA; the branch's copy of the checks is never run            | `merge-guard` test               |
| 60  | A guard-file PR with no owner approval for its head    | `gh pr merge`                                    | Blocked with exit 2; stderr names `.orivilo/owner-approvals/<PR>.json` and the head SHA                     | `merge-guard` test               |
| 61  | Any session                                            | `gh api graphql` with `mergePullRequest`         | Blocked with exit 2: merge and ref mutations are blocked on GraphQL too                                     | `merge-guard` test               |
| 62  | Any session on branch `develop`                        | `git push origin HEAD`                           | Blocked with exit 2: `HEAD` and `@` resolve to the current branch first                                     | `merge-guard` test               |
| 63  | `result-recorder` throws, `stop_hook_active` true      | SubagentStop runs                                | Exit 0 and nothing is recorded, so the subagent stops instead of looping                                    | `result-recorder` test           |
| 64  | ORV-1 escalated after two rounds                       | The owner clicks `Grant round ORV-1` in the form | `owner-grant-<n>.json` quotes the question, the answer and the time; one more builder envelope is allowed   | `owner-grant` test               |
| 65  | The main session                                       | Bash `git diff -- .claude/hooks/`                | Allowed: read-only git commands with no redirect and no `--output`                                          | `write-guard` test               |
| 66  | Slice A1's four schemas and its fixture set            | `pnpm test:scripts` runs the A1 tests            | All four compile under ajv `strict: true`; each valid fixture passes and each invalid one fails             | `validate` test                  |
| 67  | A bound builder, after a verdict, ends `no_report`     | The next builder envelope                        | Its round is used: every bound builder envelope counts; only `denied` (never bound) does not                | `envelope-guard` test            |
| 68  | A bound envelope, no SubagentStop heartbeat yet        | `node scripts/ovl/close-envelope.mjs <task_id>`  | Exits 2: the subagent may still run; only the owner's terminal may pass `--owner`                           | `close-envelope` test            |
| 69  | An Agent call with `run_in_background: true`           | The main session calls Agent                     | Blocked with exit 2: `/ovl` waits for each report; an unflagged async launch is recorded at SubagentStop    | `envelope-guard`, recorder tests |
| 70  | An Agent call with a `model` field                     | The main session calls Agent                     | Blocked with exit 2: the model comes from the agent file                                                    | `envelope-guard` test            |
| 71  | An Agent call with `isolation`, or another `cwd`       | The main session calls Agent                     | Blocked with exit 2: `cwd` must equal the envelope `worktree`, which must be this checkout                  | `envelope-guard` test            |
| 72  | ORV-1 escalated                                        | The owner types `grant round ORV-1` in chat      | No `owner-grant` record: typed chat text never grants. Only a clicked form answer grants                    | `owner-grant` test               |
| 73  | ORV-1 escalated; a pasted or task-notification prompt  | Its text holds `grant round ORV-1`               | No `owner-grant` record: a chat prompt is never a form answer, whatever its text                            | `owner-grant` test               |
| 74  | Local `origin/develop` moved to the PR head            | `gh pr merge`                                    | Judged by the checks at develop's SHA from `git ls-remote`; the moved ref changes nothing                   | `merge-guard` test               |
| 75  | Any session                                            | `git update-ref refs/remotes/origin/develop`     | Blocked with exit 2, as are `git remote add` and `git remote set-url`                                       | `merge-guard` test               |
| 76  | A2-era envelopes with no `agent.json`                  | `ovl-doctor` runs after A3 is registered         | Each gets `closed.json` `{reason: pre_a3}` and is listed; none counts as a round                            | `ovl-doctor` test                |
| 77  | A PR changes `.github/workflows/ci.yml`, no approval   | `gh pr merge`                                    | Blocked with exit 2: CI workflows are guard files; stderr names the approval file                           | `merge-guard` test               |
| 78  | ORV-1 escalated; the form offers `Grant round ORV-1`   | The owner types `grant round ORV-1` under Other  | No `owner-grant` record: the answer must be an option label the question offered                            | `owner-grant` test               |
| 79  | ORV-1 escalated                                        | The owner clicks `Grant a round` in the form     | No `owner-grant` record: the clicked option must name the escalated issue's key                             | `owner-grant` test               |
| 80  | Only `approve` verdicts recorded for ORV-1             | A builder envelope without `rework_of`           | Allowed; no round counts: only a `request_changes` or failed gate record starts the count                   | `envelope-guard` test            |
| 81  | An `ORV-1` envelope, worktree on `feature/ORV-2-x`     | The main session calls Agent                     | Blocked with exit 2: issue must equal the branch key; a branch with no key is blocked too                   | `envelope-guard` test            |
| 82  | ORV-1 escalated; the form offers a decline option      | The owner clicks `Do not grant round ORV-1`      | No `owner-grant` record, nor for the Thai decline (below): the label must be exactly a grant form           | `owner-grant` test               |
| 83  | A subagent, in any worktree                            | Bash `git -C "$PWD" worktree remove .`           | Blocked with exit 2: quotes and backslashes removed and lowercased, the text holds `worktree` and `remove`  | `worktree-guard` test            |
| 84  | A subagent                                             | Bash `sh -c 'g"i"t worktree prune'`              | Blocked with exit 2: `prune` counts as `remove`, and no parser has to see through `sh -c` or quotes         | `worktree-guard` test            |
| 85  | The main session, or a subagent running `ls`           | Bash, cwd outside any repo, or in another repo   | Exit 0 for a call without those words or from the main session; no `.orivilo` is created in that cwd        | `worktree-guard` test            |
| 86  | Records left in another worktree's `.orivilo/runs/`    | `node scripts/ovl/doctor.mjs plan`               | Exits 2 and names each folder: the hooks no longer read it, so run `migrate` first                          | `ovl-doctor` test                |
| 87  | The same task folder in a worktree and in main         | `node scripts/ovl/doctor.mjs migrate`            | Exits 2 and lists it; the folder stays whole in the worktree and main's folder is unchanged                 | `ovl-doctor` test                |
| 88  | A symlink under a worktree's `.orivilo/runs/`          | `node scripts/ovl/doctor.mjs migrate`            | Exits 2 and lists it before anything moves; no file outside the repo is copied                              | `ovl-doctor` test                |
| 89  | A bound envelope whose stop beat was in a worktree     | `migrate`, then `close-envelope.mjs <task_id>`   | `abandoned` is written: migrate appended the worktree's heartbeat lines to main's `heartbeat.jsonl`         | `ovl-doctor` test                |

Each hook test feeds recorded stdin samples from the installed Claude Code version, so a change in the hook input shape turns the test red. AC 47 and 48 apply to every hook in the slice that ships it, `owner-grant` included, with one stated exception: SubagentStop with `stop_hook_active` true (AC 63). Row 82's Thai decline is a click on `ไม่ อนุญาตรอบ ORV-1`, which also writes no record (kept out of the table so its column widths stay fixed). Rows 11 to 14, 64, 72, 73, 78 to 82 ship in slice A2 and are tested there on fixture records (verdicts, `agent.json`, `result.json`, `closed.json`), since the recorder that writes those ships in A3. Each agent file names its report contract from slice A3 on (`qa.md` from slice B, when it is created); AC 49 checks in slice D that `lead` is gone and that `docs/context/ai-team-skills.md` lists `qa` in the model policy. Rows 83 to 89 ship in ORV-89.

## Roles and skills

| Role         | Job                                | Model  | Required skills                     | Report                          | Writes                                         |
| ------------ | ---------------------------------- | ------ | ----------------------------------- | ------------------------------- | ---------------------------------------------- |
| main session | Plans, dispatches, records, gates  | opus   | `ovl`, `gate-packet`                | none                            | Nothing; hooks write the records               |
| product      | Spec, AC, open questions           | opus   | `discover`                          | `implementer.v1`                | `docs/specs/<KEY>/spec.md`                     |
| ds-architect | Contracts, schemas, ADRs           | opus   | none                                | `implementer.v1`                | `tech.md` in the spec folder, `docs/adr/`      |
| designer     | Design notes, visual QA            | opus   | `frontend-design`, `webapp-testing` | `implementer.v1`, `reviewer.v1` | `design.md` in the spec folder, its run folder |
| builder      | Code by TDD                        | sonnet | `quality-gate`                      | `implementer.v1`                | Its `write_set` only                           |
| qa           | Quality gate, AC walk, screenshots | opus   | `quality-gate`, `webapp-testing`    | `qa.v1`                         | PNGs in its `screenshots/` only                |
| reviewer     | Fresh-context code review          | opus   | none                                | `reviewer.v1`                   | Nothing                                        |
| release      | Squash, PR, merge, Jira, branches  | sonnet | `gate-packet`                       | `implementer.v1`                | Git and Jira, no source file                   |

- The main session runs `/ovl`. It plans, writes envelopes, posts gate packets and talks to the owner. It never edits a deliverable, a guard file or a record (Hooks, `write-guard`).
- `qa` is a new agent, `.claude/agents/qa.md` (Opus; tools Read, Grep, Glob, Bash, Write). It did not write the code. It runs the quality gate, walks every AC row with evidence, and takes a light and a dark screenshot of each changed story, then says what it saw in each.
- `reviewer` keeps the fresh-context code review: contracts, a11y, security, honesty, tests that would fail on the defect. The AC walk and the quality-gate run move to `qa`.
- The designer writes PNGs only under its own run folder's `screenshots/`, like `qa`.
- "Required skills" must appear in the envelope `skills`. The envelope guard checks this per role.
- The Agent call's `subagent_type` must equal the envelope `role`. The recorder accepts `qa.v1` only from `agent_type` `qa`, and `reviewer.v1` only from `reviewer` or `designer`.
- An Agent call without an envelope is allowed only for the built-in read-only `Explore` agent (the owner's choice, open question 10). It is not recorded and never counts as evidence, and SubagentStop lets it end without a check (AC 54). Every other Agent call needs an envelope.
- The model comes from the agent file, never from the envelope or the Agent call: `envelope-guard` blocks a call that sets `model` (AC 70).
- Every role ends with exactly one JSON object in its contract. A role that cannot go on reports `result: blocked` with `blocked_on`; nobody reports to `lead`.
- `lead` is retired. A subagent cannot dispatch subagents, so the loop has to run in the main session, as the `ovl` skill.

## Envelope and reports

The schemas live in `scripts/ovl/schemas/` as JSON Schema (draft 2020-12), with absolute `$id` values under `https://orivilo.dev/ovl/` that are never fetched. Slice A1 compiles all four with `ajv` in `strict: true` mode. A subagent's final message is exactly one JSON object in its report contract. Anything else is sent back.

### `envelope.v1`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://orivilo.dev/ovl/envelope.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "envelope_version",
    "task_id",
    "issue",
    "role",
    "objective",
    "worktree",
    "write_set",
    "context_pointers",
    "facts",
    "boundaries",
    "done_when",
    "skills"
  ],
  "properties": {
    "envelope_version": { "const": 1 },
    "task_id": { "type": "string", "pattern": "^ORV-[0-9]+-[a-z0-9-]+$" },
    "issue": { "type": "string", "pattern": "^ORV-[0-9]+$" },
    "role": {
      "enum": [
        "product",
        "ds-architect",
        "designer",
        "builder",
        "qa",
        "reviewer",
        "release",
        "architect",
        "security",
        "research"
      ]
    },
    "report_contract": { "enum": ["implementer.v1", "reviewer.v1", "qa.v1"] },
    "objective": { "type": "string", "minLength": 1 },
    "worktree": { "type": "string", "pattern": "^/" },
    "write_set": { "type": "array", "items": { "type": "string" }, "uniqueItems": true },
    "context_pointers": { "type": "array", "items": { "type": "string" } },
    "facts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["claim", "checked_by"],
        "properties": {
          "claim": { "type": "string", "minLength": 1, "pattern": "\\S" },
          "checked_by": { "type": "string", "minLength": 1, "pattern": "\\S" }
        }
      }
    },
    "decisions_already_made": { "type": "array", "items": { "type": "string" } },
    "boundaries": { "type": "array", "items": { "type": "string" } },
    "done_when": { "type": "array", "minItems": 1, "items": { "type": "string" } },
    "skills": { "type": "array", "items": { "type": "string" }, "uniqueItems": true },
    "rework_of": { "type": "string", "pattern": "^ORV-[0-9]+-[a-z0-9-]+$" }
  }
}
```

The envelope guard adds the checks a schema cannot make:

- `tool_input.subagent_type` equals `role`.
- `skills` holds every required skill for the `role` (table above).
- `report_contract`, when given, is one the role may use. When it is absent, the role's first contract applies.
- `write_set` is empty for `reviewer`, `qa` and `release`, and not empty for the other roles. Each entry is repo-relative, with no leading `/` and no `..`. It is either an exact file path or a glob whose part before the first `*`, `?` or `[` holds at least two folders (`packages/design-system/src/components/checkbox/**` passes; `packages/`, `apps/**` and `**` fail).
- Each `done_when` entry is a command that starts with one of `pnpm `, `node `, `git `, `gh `, `test `, `grep `, `jq `, or a `path:line` reference to a file in the worktree. "tests pass" is rejected; `pnpm test` is accepted.
- Each `checked_by` is one of: a command with the same prefixes, a `path` or `path:line` that exists in the worktree, an `https://` URL, or a Jira reference `ORV-<n> comment <id>`. An answer the owner gave in the session is recorded in Jira or the spec first, then cited.
- The Agent call itself: `run_in_background: true`, any `isolation` and any `model` are blocked (AC 69 to 71). The main session never asks for a background call, so `/ovl` waits for each report before it plans the next step; `isolation` or another `cwd` would run the subagent in a checkout the envelope does not name. Claude Code can still run a call in the background without the flag: the IDE session does so for every Agent call (ORV-89 comment 10069). That launch passes the guard, PostToolUse(Agent) returns `status: async_launched` with no report and records nothing, and SubagentStop records the report instead (Hooks, `result-recorder`). A `cwd`, when given, must equal the envelope `worktree`, and `worktree` must be the git top level of the hook's own `cwd`, the checkout this session runs in.
- One open envelope per role across the whole repo. The records folder is the main checkout's whole `.orivilo/runs/` (Records), shared by every worktree and every issue, so one builder envelope is open per repo, not per worktree or per issue (the owner's decision of 2026-10-24, ORV-89 comment 10071). An envelope is blocked while another envelope of the same role is open, whether the two calls come in parallel or one after the other, and from the same worktree or another; stderr names the open `task_id` and how to close it (AC 52). Different roles may run in parallel, as `qa` and `reviewer` do in step 4 of the Rework loop. Two issues in two worktrees cannot run the same role at once; the second waits until the first envelope closes.
- The envelope's issue is the worktree's issue. For a `builder`, `reviewer`, `qa` or `designer` envelope, `issue` must equal the `ORV-<n>` key in the current branch name of the envelope `worktree`. A branch name with no key, or a detached `HEAD`, fails closed, so a call can never record work under another issue's rounds.
- Rework rounds count per issue (Rework loop step 8). A builder envelope is blocked once rounds used reach the allowance (two rounds plus one per `owner-grant` record), whether the last round is still waiting for review or the issue is escalated, when a negative verdict exists for the issue and `rework_of` is missing, or when `rework_of` does not name a task of the same issue that was bound (has an `agent.json`).

### `implementer.v1`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://orivilo.dev/ovl/implementer.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "task_id",
    "result",
    "changed",
    "verified",
    "skills_used",
    "deviations",
    "needs_decision",
    "blocked_on"
  ],
  "properties": {
    "task_id": { "type": "string" },
    "result": { "enum": ["done", "blocked"] },
    "changed": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["file", "note"],
        "properties": {
          "file": { "type": "string" },
          "note": { "type": "string", "minLength": 1 }
        }
      }
    },
    "verified": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["check", "evidence"],
        "properties": {
          "check": { "type": "string", "minLength": 1 },
          "evidence": { "type": "string", "minLength": 1 }
        }
      }
    },
    "skills_used": { "type": "array", "items": { "type": "string" } },
    "deviations": { "type": "array", "items": { "type": "string" } },
    "needs_decision": { "type": "array", "items": { "type": "string" } },
    "blocked_on": { "type": ["string", "null"] }
  },
  "if": { "properties": { "result": { "const": "done" } } },
  "then": {
    "properties": {
      "verified": { "type": "array", "minItems": 1 },
      "blocked_on": { "const": null }
    }
  },
  "else": { "properties": { "blocked_on": { "type": "string", "minLength": 1 } } }
}
```

`verified` is the implementer's own claim. It never counts for a gate. Only `qa.v1` and `reviewer.v1` do.

### `reviewer.v1`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://orivilo.dev/ovl/reviewer.v1",
  "type": "object",
  "additionalProperties": false,
  "required": ["task_id", "verdict", "head_sha", "checks_run", "findings"],
  "properties": {
    "task_id": { "type": "string" },
    "verdict": { "enum": ["approve", "request_changes"] },
    "head_sha": { "type": "string", "pattern": "^[0-9a-f]{40}$" },
    "checks_run": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["command", "exit_code", "summary"],
        "properties": {
          "command": { "type": "string" },
          "exit_code": { "type": "integer" },
          "summary": { "type": "string" }
        }
      }
    },
    "findings": { "type": "array", "items": { "$ref": "#/$defs/finding" } },
    "dropped": { "type": "array", "items": { "$ref": "#/$defs/finding" } }
  },
  "$defs": {
    "finding": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "severity", "claim", "expected", "evidence"],
      "properties": {
        "id": { "type": "string" },
        "severity": { "enum": ["Critical", "Important", "Suggestion"] },
        "file": { "type": "string" },
        "line": { "type": "integer", "minimum": 1 },
        "claim": { "type": "string", "minLength": 1 },
        "expected": { "type": "string", "minLength": 1 },
        "evidence": { "$ref": "#/$defs/evidence" }
      }
    },
    "evidence": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "ref"],
      "properties": {
        "kind": { "enum": ["command", "screenshot", "computed_style", "code"] },
        "ref": { "type": "string", "minLength": 1 },
        "observed": { "type": "string" }
      }
    }
  }
}
```

The recorder applies these rules before it writes `result.json`:

- A finding is kept only when its evidence can be run or opened again. `command`: `ref` is the command and `observed` its output. `screenshot`: `ref` is a PNG under the reporting task's own `screenshots/` folder in the main checkout's records that exists. `computed_style`: `ref` names the story, the selector and the property, and `observed` the value. `code`: `file` and `line` exist at `head_sha`. Any other finding moves to `dropped`.
- `approve` with a kept Critical finding is invalid.
- `request_changes` needs at least one kept Critical or Important finding. If none is left, the report goes back to its author.
- The recorder fills in `round` itself in `result.json`: the issue's rounds used at record time (Rework loop), 0 for the first review. A report does not carry it, so a subagent never has to guess it.

### `qa.v1`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://orivilo.dev/ovl/qa.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "task_id",
    "issue",
    "pr",
    "verdict",
    "head_sha",
    "quality_gate",
    "ac",
    "screenshots",
    "findings"
  ],
  "properties": {
    "task_id": { "type": "string" },
    "issue": { "type": "string", "pattern": "^ORV-[0-9]+$" },
    "pr": { "type": "integer", "minimum": 1 },
    "verdict": { "enum": ["approve", "request_changes"] },
    "head_sha": { "type": "string", "pattern": "^[0-9a-f]{40}$" },
    "quality_gate": {
      "type": "object",
      "additionalProperties": false,
      "required": ["report", "ok", "head_sha"],
      "properties": {
        "report": { "const": ".quality-gate/report.json" },
        "ok": { "type": "boolean" },
        "head_sha": { "type": "string", "pattern": "^[0-9a-f]{40}$" }
      }
    },
    "ac": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["row", "status", "visual", "evidence"],
        "properties": {
          "row": { "type": "integer", "minimum": 1 },
          "status": { "enum": ["pass", "fail", "owner_verify"] },
          "visual": { "type": "boolean" },
          "evidence": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "reviewer.v1#/$defs/evidence" }
          }
        },
        "if": { "properties": { "visual": { "const": true } } },
        "then": {
          "properties": {
            "evidence": {
              "type": "array",
              "contains": {
                "type": "object",
                "properties": { "kind": { "enum": ["screenshot", "computed_style"] } }
              }
            }
          }
        }
      }
    },
    "screenshots": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["story", "mode", "path", "looked_at", "note"],
        "properties": {
          "story": { "type": "string", "pattern": "^[a-z0-9-]+--[a-z0-9-]+$" },
          "mode": { "enum": ["light", "dark"] },
          "path": { "type": "string", "pattern": "^\\.orivilo/runs/ORV-[0-9]+/" },
          "looked_at": { "const": true },
          "note": { "type": "string", "minLength": 1 }
        }
      }
    },
    "findings": {
      "type": "array",
      "items": { "$ref": "reviewer.v1#/$defs/finding" }
    }
  },
  "if": { "properties": { "verdict": { "const": "approve" } } },
  "then": {
    "properties": {
      "quality_gate": { "type": "object", "properties": { "ok": { "const": true } } }
    }
  }
}
```

The recorder also checks, at record time:

- `ac` has one entry for every row in the spec's AC table.
- `approve` needs every row `pass` or `owner_verify`, `quality_gate.ok` true, `quality_gate.head_sha` equal to `head_sha`, and the gate report in the qa task's worktree with `git.sha` equal to `head_sha`, `git.dirty` false and `stepsSource` equal to `"gate"`. A stub report (`stepsSource: "stub"`) never backs an approve (AC 58).
- `owner_verify` is for what only a person can judge. Its evidence still has a screenshot, and the row goes into the G3 packet for the owner.
- The recorder derives `visual` for each row from the spec: a row is visual when its Result cell matches, case-insensitive, one of `layout`, `spacing`, `gap`, `align`, `centre`, `center`, `colour`, `color`, `overlap`, `motion`, `position`. A row the spec makes visual and the report marks `visual: false` is rejected. The qa agent may mark more rows visual, never fewer. Proof must match the claim: a play test proves behaviour, not position.
- `story` is the Storybook id (`title--export`). For each `*.stories.tsx` file in `git diff --name-only origin/develop...<head_sha>`, the title is the `title` in its default export, or Storybook's auto title from the path when there is none. An approve needs at least one story id under that title, each with a `light` and a `dark` entry.
- Each `path` exists, is under `.orivilo/runs/<issue>/<this task_id>/screenshots/` in the main checkout (resolved against the records root, never against the qa's own checkout), is named `<story>-<mode>.png`, and starts with the PNG signature.
- `note` on a screenshot says what was seen in it ("the check glyph sits on the label's centre line"). `looked_at` and `note` are still the qa agent's own statement; see Honest limits.
- The findings follow the `reviewer.v1` rules above.

## Records

The records folder is `.orivilo/runs/` in the repo's main checkout, for the whole repo. Every hook and script finds it from its `cwd` as the folder that holds `git rev-parse --git-common-dir`, so a session in a worktree under `.claude/worktrees/` reads and writes the same records as the main checkout, and the records outlive a removed worktree. A `cwd` that no longer exists, or a layout with no main checkout (a bare repo, `--separate-git-dir`), fails closed. Only hook processes, and the `close-envelope.mjs` and `doctor.mjs` scripts below, write records. They write files directly, never through a tool call, and create each file with an exclusive create (`wx`), so a record that exists is never rewritten. `write-guard` blocks every tool write to `.orivilo/` and `.quality-gate/`, in any checkout of the project, from the main session and from subagents, with one exception: a `qa` or `designer` subagent bound to an open envelope may write `*.png` files under that envelope's own `screenshots/` folder in the main checkout, by a tool write or by a single Bash `cp`, `mv` or redirect whose every protected target is such a file (AC 32, 53). Screenshots live in the main checkout's records like every other record: `write-guard` and `result-recorder` resolve `.orivilo/runs/<ISSUE>/<task_id>/screenshots/<file>.png` against the records root, never against the checkout the qa or designer works in, so a worktree's own `.orivilo/runs/` stays empty and `doctor.mjs plan` does not stop on it (ORV-93). The `qa` agent gives Playwright's `page.screenshot` that absolute path directly, so no stray `artifacts/` folder makes the gate report dirty. `.orivilo/handoff.md` in the main checkout is not a record: no hook or script reads it and it is never evidence, so the main session may write that one file by Write or Edit (Hooks, `write-guard`).

An envelope's life, each step a record in its task folder:

- **Open**: `envelope.json` exists, and neither `result.json` nor `closed.json` does.
- **Bound**: `result-recorder` on SubagentStart writes `agent.json` `{ "agent_id", "agent_type", "started_at" }` for the one open, unbound envelope whose `role` equals `agent_type`. One open envelope per role across the repo (envelope guard) makes the match unique, so a SubagentStart in any worktree binds the one open envelope of its role, whichever worktree dispatched it. From then on `write-guard`, SubagentStop and PostToolUse find the envelope by `agent_id`, never by type, so one subagent cannot use another's exceptions (AC 53).
- **Closed**: by `result.json`, or by `closed.json` `{ "reason", "closed_at" }`. PostToolUse(Agent) writes `reason: no_report` when a foreground call returns no valid report (AC 51); for a background call SubagentStop does (Hooks). `node scripts/ovl/close-envelope.mjs <task_id>`, which the main session may run, writes `reason: denied` for an envelope that was never bound (the call was refused at the permission prompt, so no hook after it ran; AC 50). For a bound envelope it writes `reason: abandoned` only when `heartbeat.jsonl` holds a SubagentStop line for that envelope's `agent_id`, so the subagent has stopped; otherwise it exits 2, because the subagent may still be running (AC 68). When a session ended while its subagent ran, no such line exists, and the owner closes the envelope from a terminal outside Claude Code with `close-envelope.mjs <task_id> --owner`, which writes `reason: abandoned` with `by: owner`. A closed envelope grants no exception. A builder envelope that was bound counts as a rework round however it closed, by `result.json`, `no_report` or `abandoned`; only `denied`, never bound, does not (Rework loop step 8, AC 67).
- **Pre-A3**: slice A2 writes `envelope.json` but nothing closes an envelope until A3. On its first run with `result-recorder` registered, `doctor.mjs` writes `closed.json` `{reason: pre_a3}` for every open envelope with no `agent.json` whose `envelope.json` is older than the first `result-recorder` heartbeat line, and lists them. Such an envelope was never bound, so it is never a round (AC 76).

The records:

- `.orivilo/runs/<ISSUE>/<task_id>/envelope.json`: written by `envelope-guard` when it lets a call through.
- `.orivilo/runs/<ISSUE>/<task_id>/agent.json`: written by `result-recorder` on SubagentStart.
- `.orivilo/runs/<ISSUE>/<task_id>/result.json`: written by `result-recorder`: `{ "contract", "agent_id", "agent_type", "round", "recorded_at", "report", "dropped" }`. A result without an `agent_id` from the Agent tool result, equal to the one in `agent.json`, does not exist (no phantom dispatch).
- `.orivilo/runs/<ISSUE>/<task_id>/closed.json`: written by `result-recorder`, `close-envelope.mjs` or `doctor.mjs`, as above: `{ "reason", "closed_at" }`, plus `"by": "owner"` for an owner close.
- `.orivilo/runs/<ISSUE>/<task_id>/qa.json`: written by `result-recorder` for a qa step. `screenshots/<story>-<light|dark>.png`: written by the qa or designer subagent into the main checkout's task folder, whichever checkout it works in.
- `.orivilo/runs/<ISSUE>/gates/<recorded_at>.json`: written by `result-recorder` after the main session runs the quality gate: `{ "ok", "sha", "dirty", "steps_source", "recorded_at" }`, read from `.quality-gate/report.json`. The issue comes from the worktree's branch name. A run inside a subagent writes no gate record (AC 55).
- `.orivilo/runs/<ISSUE>/owner-grant-<n>.json`: written by the `owner-grant` hook from the owner's answer in a question form, `{ "by": "owner", "source": "question_form", "question", "options", "answer", "answered_at", "tool_use_id", "session_id", "transcript_path" }`. `question` and `options` are the question text and option labels exactly as the form showed them, `answer` is the label the owner clicked, and `answered_at` is when the hook received the answer. Each record grants one more rework round (open question 9, answered and narrowed to the form).
- `.orivilo/owner-approvals/<PR>.json`: written by the owner from a terminal outside Claude Code, `{ "by": "owner", "pr", "head_sha", "at" }`, to approve a PR that changes a guard file. It covers that head SHA only; a later push needs a new approval (open question 8, answered). The G3 packet prints the one-line command for the owner to run.
- `.orivilo/heartbeat.jsonl`: one appended line per hook run, `{ "hook", "event", "at", "tool", "agent_id", "decision" }`. `agent_id` is null in the main session; `close-envelope.mjs` reads the SubagentStop lines by it.

The step folder name is the `task_id`. A rework is a new step.

## Hooks

Every hook reads the tool call as JSON on stdin, writes a heartbeat line, and exits 2 to block with its reason on stderr. A hook that cannot parse its input exits 2. All are registered in `.claude/settings.json` and live in `.claude/hooks/`.

A hook never fails open. Claude Code blocks only on exit 2, so:

- a node hook wraps its whole body in one top-level `try`/`catch` that exits 2, and a bash hook sets `trap 'exit 2' ERR`;
- each registration in `.claude/settings.json` ends in `|| exit 2`, so a missing file, a missing `node` (127) or any other non-zero exit blocks;
- `pre-commit-gate` gets the same treatment: malformed input and errors exit 2. Its lint and typecheck behaviour is unchanged.

One place where exit 2 would do harm, so the closed state is exit 0 with nothing recorded:

- SubagentStop with `stop_hook_active` true. Its registration is a small bash wrapper that keeps stdin, runs the recorder, and on any non-zero exit returns 2 unless the kept input has `stop_hook_active: true`; then it returns 0 and nothing is recorded, so a crashing recorder cannot send a subagent back forever (AC 63). PostToolUse then writes `closed.json` `no_report`.

`owner-grant` is not an exception. It runs on PostToolUse, after the owner has answered, so exit 2 erases nothing: it only tells the main session why no grant was written (AC 47, 48).

The hooks:

- **`envelope-guard`** (PreToolUse, matcher `Agent`). Blocks a dispatch whose prompt is not one valid `envelope.v1` JSON object or that fails a check in "The envelope guard adds" above, including the Agent call fields (`run_in_background`, `isolation`, `model`, `cwd`) and one open envelope per role. A call with no envelope passes only for `subagent_type: Explore`. On pass, it writes `envelope.json`.
- **`result-recorder`**, one script registered on four events:
  - SubagentStart: binds the subagent to its envelope by writing `agent.json` (Records). For `Explore` it does nothing.
  - SubagentStop: for `agent_type` `Explore`, exits 0 and records nothing (AC 54). Otherwise it finds the envelope by `agent_id`, validates `last_assistant_message` against that envelope's contract and applies the recorder rules. Exit 2 sends the subagent itself back to fix its report. If `stop_hook_active` is true and the report is still invalid, the subagent stops and nothing is recorded. A background call (the input's `background_tasks` lists the subagent's own `agent_id`) has no PostToolUse that carries its report, so SubagentStop records a valid report as `result.json` (and `qa.json`), and writes `closed.json` `no_report` when the report is still invalid with `stop_hook_active` true.
  - PostToolUse, matcher `Agent`: a background launch (`tool_response.status` `async_launched`) records nothing; its report arrives at SubagentStop. Otherwise it validates the returned report again and writes `result.json` (and `qa.json` for a qa step) with the `agentId` from `tool_response`, which must equal `agent.json`. With no valid report it writes `closed.json` `no_report` and exits 2, which only tells the main session; the call has already run.
  - PostToolUse, matcher `Bash`: after collapsing whitespace, a command that runs `node scripts/quality-gate.mjs`, `pnpm quality-gate` or `pnpm run quality-gate` writes the gate record, but only when the hook input has no `agent_id`, that is, from the main session (AC 55, 56).
- **`owner-grant`** (PostToolUse with matcher `AskUserQuestion`, and nothing else). By the owner's decision of 2026-10-23 (ADR 0014), only an option the owner clicks in a question form grants a round. No hook reads UserPromptSubmit for a grant, so text typed or pasted into chat never grants one, in English or in Thai (a typed `อนุญาตรอบ ORV-81` writes nothing, AC 72), and neither does a prompt Claude Code builds itself, such as a background agent's `<task-notification>` (AC 73). The recorded samples are why: a UserPromptSubmit carries no `source` in a headless run, and a task notification arrives as a UserPromptSubmit with no `source` too, so a prompt cannot be told apart from text the owner typed (`docs/specs/ORV-85/stdin-samples.md`). The hook acts only while an issue is escalated (Rework loop step 8): rounds used reach the allowance and the latest negative verdict is newer than the last bound builder envelope, whatever approves came after it. While the last round is still waiting for review, the issue is not escalated and no grant is written. It writes an `owner-grant` record only when all of these hold:
  - The hook input has no `agent_id`, so the form was asked by the main session, not a subagent.
  - The owner's answer is the label of one of the options the question offered. A free-text answer, such as text typed under Other, grants nothing, because the owner chose "clicked in the form only" (AC 78).
  - The clicked label is a grant option: the whole label is `อนุญาตรอบ ORV-<n>` or `grant round ORV-<n>` (the English words case-insensitive) with nothing before or after it, and `ORV-<n>` is an escalated issue. A label that only contains the phrase, such as `Do not grant round ORV-1`, grants nothing, so a decline option can never grant. The key is always required, so the issue is never guessed (AC 79). The `ovl` skill offers the option as `อนุญาตรอบ ORV-<n>` or `Grant round ORV-<n>`, next to a decline option.
  - The input has every field the hook reads: the question, its option labels and the chosen answer. A missing field writes nothing and exits 2 (fail closed). The field names come from a real answered form, not from recorded hook stdin: the `owner-grant` fixture is built from the `toolUseResult` of an `AskUserQuestion` call the owner answered in a Claude Code 2.1.308 session transcript (`docs/specs/ORV-85/stdin-samples.md`).
  - Otherwise it writes nothing and says why on stderr. The record quotes the question, the options, the answer and the time (AC 64). Its test also checks that `.claude/settings.json` registers `owner-grant` on no event other than PostToolUse(`AskUserQuestion`), and feeds it the recorded UserPromptSubmit samples, which must write nothing (AC 72, 73).
- **`write-guard`** (PreToolUse; ORV-93). Registered twice in `.claude/settings.json`, once in the existing `Bash` entry and once in an entry with matcher `Write|Edit|MultiEdit|NotebookEdit`, each with `node "$CLAUDE_PROJECT_DIR/.claude/hooks/write-guard.mjs" || exit 2`. It is deterministic: it reads the tool name, the path field, the command text and the records, and calls no model. A target path is made absolute against `cwd`, its nearest existing folder is resolved through `realpath` (so a link in `docs/` that leads into `packages/` is judged as `packages/`), and it is matched, in lowercase, against the main checkout and each worktree under `.claude/worktrees/`. A path outside every checkout of the project is in no protected set. It protects three sets:
  - Deliverables, `packages/` and `apps/`: the main session is blocked; subagents may write.
  - Guard files, `.claude/hooks/`, `.claude/settings*.json`, `scripts/ovl/`, `scripts/quality-gate.mjs`, `.github/workflows/` and the root `.gitignore`: every session is blocked, except a builder subagent's tool write (Write, Edit, MultiEdit or NotebookEdit) of a path listed exactly, not by a glob, in the `write_set` of the open builder envelope it is bound to, in the checkout that equals that envelope's `worktree`. A builder's Bash write form on a guard file is always blocked.
  - Records, `.orivilo/` and `.quality-gate/`, in any checkout of the project: every session is blocked, except the PNG rule in Records and the main session's Write or Edit of exactly `.orivilo/handoff.md` in the main checkout. A Bash write to the handoff, and a subagent write to it, are blocked.
  - `docs/`, `.claude/agents/`, `.claude/skills/`, `.claude/rules/`, `AGENTS.md` and `CLAUDE.md` are in no set.
  - Verdict order. A tool write outside every set, and a Bash command that names no protected path, is allowed before any record is read. A Bash command that names nothing protected is never blocked for its `cwd`, as in `worktree-guard`. A tool write is different: a relative path whose `cwd` is missing, empty or cannot be resolved fails closed before it is classified, since the guard cannot tell which set it lands in (ORV-93 AC 25); an absolute path outside every set is allowed whatever the `cwd`. Records are read only to grant a subagent's exception, and an error there blocks.
  - Naming, for `Bash`. Quotes and backslashes are removed, the text is lowercased, repeated slashes collapse and `./` segments drop. The text names a protected path when it holds a set prefix, or a protected folder followed by whitespace, a shell operator character or the end of the text. A redirect is found after the text inside quotes and every backslash escape is blanked, up to the first `$(` or backtick; fd copies (`2>&1`, `>&2`, `>&-`) and the null device (`>/dev/null` and its forms) are not writes.
  - For `Bash`, the main session is blocked when the command names a protected path, unless it is one of three forms. (a) A plain read: `cat`, `ls`, `head`, `tail`, `wc`, `jq`, `grep`, `sed -n` with one line range or one `/pattern/` followed by `p`, `git diff`, `git log`, `git show` or `git status`, joined only by pipes outside quotes, with no write redirect, no `--output`, no `;`, `&&`, `||`, `$(`, backtick, `<(`, `>(` or newline (AC 65). (b) An allowed run on one line: `node <prefix>scripts/ovl/<name>.mjs`, `node <prefix>scripts/quality-gate.mjs`, `pnpm quality-gate` or `pnpm run quality-gate`, with plain arguments only, where `<prefix>` is empty or the absolute path of a checkout of this project. `--owner` is refused only on `close-envelope.mjs` (below); a run of another script that carries `--owner` passes form (b), and today no other script reads that flag. (c) One whole `git add`, `git commit` with `-m` or with `-F` from a file in no set, or `git push`, alone, so the main session can still commit a builder's changes.
  - A subagent is blocked when a write form names a guard file or a record path, except the PNG rule in Records. The write forms are a redirect, `tee`, `sed -i`, `cp`, `mv`, `rm`, `ln`, `touch`, `git apply`, and any `git checkout`, `git restore`, `git switch`, `git stash` or `git reset` form whose text names such a path.
  - `close-envelope.mjs`: every Claude Code session is blocked from running it with `--owner`, and a subagent is blocked from running it at all. The `--owner` close is for the owner's own terminal (Records).
  - Untrusted text. stderr names only the set and the repo-relative path, never content or the whole command, and the heartbeat line holds the six `beat()` fields only. The heartbeat is written only when `cwd` resolves to this project's main checkout. Malformed input, an unknown tool or a missing path field exits 2 (`write-guard failed closed:`). The full rule set and its tests are in `docs/specs/ORV-93/spec.md` v1.3.
- **`merge-guard`** (PreToolUse, matcher `Bash`). It collapses runs of whitespace before matching.
  - Always blocked: `git push` whose refspec targets `develop` or `main`, after `HEAD`, `@` and a refspec with no `:` are resolved to the branch they name, so `git push origin HEAD` on `develop` is blocked (AC 62).
  - Always blocked: `git push --all` or `--mirror`, and a bare `git push` while the current branch is `develop` or `main`.
  - Always blocked: `gh api` on a path that contains `/merge`, `/merges` or `/git/refs`.
  - Always blocked: `git update-ref` on a ref under `refs/remotes/origin/`, `git remote add`, `git remote set-url`, and `git config` that writes a `remote.` key, so no session can point the checks at another `develop` (AC 75).
  - Always blocked: `gh api graphql` whose command contains `mergePullRequest`, `enablePullRequestAutoMerge`, `mergeBranch`, `updateRef`, `createRef` or `deleteRef`, or that reads its query from a file or stdin (`query=@...`, `--input`), since the guard cannot see that text (AC 61).
  - For `gh pr merge` it reads the PR with `gh pr view <n> --json title,baseRefName,headRefName,headRefOid,files`. Base `main`: allowed only when the head is `develop` (the release PR). The owner's yes for that merge is a process rule the hook cannot see.
  - Base `develop`: blocks unless the issue's latest `qa.json` approves `headRefOid`; a `reviewer.v1` approve exists on `headRefOid`; every check in `gh pr checks <n>` passes; the gate report in the qa task's worktree has `ok: true`, `stepsSource: "gate"`, `git.sha` equal to `headRefOid` and `dirty: false` (AC 57); a light and a dark screenshot exist for a story id under each changed `*.stories.tsx` file's title; every changed file is inside the union of the issue's `write_set` entries; and, when a changed file is a guard file (the `write-guard` list, `.github/workflows/` included), `.orivilo/owner-approvals/<n>.json` exists with `head_sha` equal to `headRefOid` (AC 60, 77).
  - Any other base: blocked.
  - Where the checks run from. In a worktree session the hooks are the branch's own copy, so a PR could weaken the guard that judges it. `.claude/hooks/merge-guard.sh` is therefore a short launcher that builds the develop export: it resolves the SHA with `git ls-remote origin refs/heads/develop`, fetches that SHA, and exports `scripts/ovl/` at that SHA (`git archive <sha> scripts/ovl`) into a temporary folder, then runs the checks from there with the repo's `node_modules`. It never reads the local `origin/develop` ref, which any session could move, and an unfetched ref cannot give it old checks (AC 74). The guard-file check and the owner-approval check run from that copy, never from the branch under review (AC 59). If develop has no `scripts/ovl/merge-check.mjs` yet, the launcher blocks; that is why the owner merges slice C1 by hand in the GitHub web UI after reading its G3 packet (open question 11, answered).
- **`g3-check`** (PreToolUse, matcher `^mcp__.*[Aa]tlassian.*__(transitionJiraIssue|executeWrite)$`, so the claude.ai connector and the project server both hit it). For `executeWrite` it acts only when `tool_input.name` is `transitionJiraIssue`. The target is a transition id, so it maps the id to a status through `scripts/ovl/jira-transitions.json`, recorded in slice C2 from the live workflow. An unknown id exits 2. When the target is G3 PR review, it runs `scripts/ovl/g3-check.mjs <ISSUE>` from the same develop export as `merge-guard`, which makes the `merge-guard` checks on the merged PR's head and also needs the PR to be merged into `develop`. Slice C2 records the real `tool_name` of a transition before the matcher is final.
- **`worktree-guard`** (PreToolUse, matcher `Bash`; ORV-89). A subagent must not remove a worktree, since the session's hook files live in its checkout and no hook runs once they are gone. The guard judges only a subagent's call. It removes every quote and backslash from the command and lowercases it; a text that then contains `worktree` and also `remove` or `prune` is blocked with exit 2. The forms it catches include `git -C "$PWD"`, `sh -c`, `xargs`, `eval`, an alias and a split quote (AC 83, 84); the forms it misses are in Honest limits. It is a text rule, not a command parser: a parser let ten forms through (R89b-2). Every other call, and every call from the main session, is allowed with exit 0 whatever the `cwd` is, so a `cwd` outside a repo or in a removed worktree never locks a session out of Bash (R89b-1, AC 85). The verdict never depends on a checkout; only the heartbeat does: it is written to the records of this project's repo (the same main checkout as `CLAUDE_PROJECT_DIR`), and a `cwd` in another repo, outside any repo or in a removed worktree gets none and no `.orivilo` is created there (ORV-90). The main session removes worktrees after the agent has stopped and its report is recorded.
- **`resume-guard`** (PreToolUse, matcher `SendMessage`; arrives with ORV-88 and is registered when that PR merges). A resume goes through `SendMessage`, and a resumed subagent runs with no envelope, which breaks open question 10 (only `Explore` runs without one). By the owner's no-resume answer (Decisions), the guard blocks every `SendMessage` call with exit 2, whatever `to` names (an agent id or a name such as `main`) and whether the main session or a subagent makes it; nothing is allow-listed. The verdict is fixed before any record is read, as in `worktree-guard`. After it, when `to` equals an `agent_id` in a task's `agent.json`, stderr names that task's issue and `task_id` as a hint; an error in that lookup still blocks. It never echoes or logs `message`, `summary` or `to`, and it writes only its heartbeat, under the same project rule as `worktree-guard`. A re-check, a follow-up or a fix is a fresh envelope with a new `task_id` (`docs/specs/ORV-88/spec.md`).
- **`pre-commit-gate`** (exists): lint and typecheck before `git commit`, now failing closed as above.

The `ovl-doctor` step runs at the start of every `/ovl` run. `node scripts/ovl/doctor.mjs` first reads `.claude/settings.json` and probes only the guards registered there, so a slice that has not shipped a guard yet does not stop every run (AC 1). The main session makes one probe call per registered guard, each built to be blocked so it changes nothing: an invalid envelope (`envelope-guard`), a Write to `packages/.ovl-probe` (`write-guard`), `gh pr merge 0` (`merge-guard`), a transition on `ORV-0` (`g3-check`, which recognises the probe key), and, from ORV-88 on, a `SendMessage` to `ovl-doctor-probe` (`resume-guard`). Then the doctor reads `heartbeat.jsonl`. If a registered guard wrote no line since the run started, `/ovl` stops and names it. `result-recorder` cannot be probed without a dispatch, so `/ovl` checks for its heartbeat after the first Agent call returns and stops if there is none. From slice A3 on, the doctor also closes pre-A3 envelopes once (Records, AC 76).

From ORV-89 on, `doctor.mjs plan` exits 2 while another worktree's own `.orivilo/runs/` still holds a file, and names each such folder: the hooks no longer read those records, so open envelopes and rounds would be lost from view (AC 86). `node scripts/ovl/doctor.mjs migrate` moves them into the main checkout:

- The task folder `<issue>/<task_id>` is the unit. A folder that already exists in main is left whole in the worktree and listed as a conflict, and migrate exits 2, so a worktree's `closed.json` or `result.json` never attaches to a different envelope in main (AC 87).
- Before it moves anything, it refuses every symlink under a stray `.orivilo/runs/`, lists them and exits 2, so it never stops halfway or copies a file from outside the repo (AC 88).
- It appends each worktree's `heartbeat.jsonl` lines to main's, so `close-envelope.mjs` still finds a migrated envelope's SubagentStop line (AC 89).
- A file that exists in main is never written over.

A quoting bug once silenced every hook in Allkons for a month; this is the check against that.

## Rework loop

1. The builder returns `implementer.v1` with `result: done`.
2. Deterministic checks first. The main session runs `pnpm quality-gate` (or `node scripts/quality-gate.mjs`) in the worktree, and the recorder writes the gate record. If it fails, the builder gets the report back, and that counts as a rework round, because the builder's `verified` claim was false. A builder's own gate runs during TDD write no record and count for nothing.
3. `release` squashes from `git merge-base origin/develop HEAD`, pushes, opens the PR into `develop` (or updates the open one), and returns the PR number in its report. `qa` and `reviewer` judge that pushed head; any later push makes their records stale.
4. A fresh `qa` dispatch walks the AC and returns `qa.v1`. Its envelope carries the PR number as a fact checked by `gh pr view <n>`.
5. A fresh `reviewer` dispatch returns `reviewer.v1`. Steps 4 and 5 may run in parallel; neither sees the other's report.
6. Both approve on the same head SHA and CI is green: `release` merges, and the G3 move follows.
7. Either requests changes: the main session writes a builder envelope with `rework_of`, and each kept finding becomes a fact (`claim` is the finding, `checked_by` is its evidence ref). Then steps 2 to 5 run again, with new dispatches, on the new head.
8. Rounds count per issue. A negative verdict is a `qa.v1` or `reviewer.v1` result with `verdict: request_changes`, or a failed gate record from the main session with `steps_source: "gate"` (a stub run is never a verdict). An approve is not a negative verdict and starts no count. Rounds used is the number of builder envelopes for the issue that were bound (have an `agent.json`) and were dispatched after its first negative verdict, however they ended: `result.json`, `closed.json` `no_report` or `abandoned`, or still open. Only an envelope closed as `denied` or `pre_a3`, which was never bound, is not a round (AC 67). A builder that changed the branch and then failed to report has still used its round. The allowance is two rounds plus one per `owner-grant` record for the issue. Once rounds used reach the allowance, `envelope-guard` blocks the next builder envelope. Two states follow. Waiting for review: no `qa.v1` or `reviewer.v1` result and no gate record has come since the last bound builder envelope, so the last round is not yet reviewed; a verdict from qa, the reviewer or the gate ends it. Escalated: the latest negative verdict is newer than the last bound builder envelope, whatever approves came after that verdict. `owner-grant` grants only while the issue is escalated, never while it waits for review. When the issue is escalated, the work stops. The main session posts both reports to the owner on the Jira issue and waits. The envelope guard blocks the next builder envelope until the owner clicks a grant option in a question form the main session asks, and the `owner-grant` hook records it (open question 9, answered). An answer typed in chat grants nothing; the main session then asks the form.

## Rules and bounds

- **Lessons from ORV-72 to ORV-78 become rules** in the `release` agent and the `ovl` skill:
  1. Squash from `git merge-base origin/develop HEAD`, never from a stale base. The ORV-75 revert came from that.
  2. Before push, compare `git diff --name-only origin/develop...HEAD` with the run's `write_set` union. `merge-guard` enforces the same at merge (AC 39).
  3. A new Jira issue goes into the active sprint when it is created.
  4. After a merge, confirm the remote branch is gone with `git ls-remote --heads origin <branch>`, not by trusting the delete command.
- **A release agent never removes the worktree it runs in.** Its hooks run from that checkout, so once it is gone the SubagentStop and PostToolUse hooks cannot find it and the envelope is not recorded. The main session removes the worktree after the agent has stopped and its report is recorded (`.claude/agents/release.md`). `worktree-guard` enforces the rule for every subagent, not only `release`, by command text (Hooks, AC 83 to 85; its limits are in Honest limits).
- **In-session only.** `/ovl` runs in the owner's Claude Code session. Nothing runs headless in this story.
- **Always on.** Once a hook is registered it runs in every Claude Code session in this repo, not only inside `/ovl`. A session without `/ovl` can still read, plan, use `Explore` and edit docs outside the protected sets. It cannot dispatch a role without an envelope, write a deliverable, a guard file or a record, or merge without records.
- **Honest limits.** The G3 packet states each of these:
  - The write guard is not a sandbox. A subagent with Bash can still write anywhere, including from inside a script it runs, and the main session could find a Bash form the guard misses.
  - Records are protected from tool writes, not from a process that writes files itself with a path the guard cannot see. The owner approval record and the `owner-grant` record cannot be told apart from such a file.
  - The `owner-grant` record is weaker than a record the owner writes from a terminal (the owner chose it anyway, open question 9). The main session composes the question and its options; the owner's click is the proof. The record proves that, in this session, a form the main session asked returned one of its own option labels as the answer, after Claude Code showed it to the person at the keyboard. It does not prove who clicked, that the owner read the reports first, or that the question was worded fairly. The exact label rule stops a decline option from granting, but a main session could still word the question text so that a click on `Grant round ORV-<n>` reads as something else. So the record quotes the question, every option and the answer, with the time, the session id and the transcript path, and the G3 packet quotes it, so the owner or a reviewer can check it against the transcript.
  - A program that answers `AskUserQuestion` for the session (an SDK host, for example) could supply a clicked answer. `/ovl` runs only in the owner's interactive session, so no such host exists in this story; the record cannot show the difference.
  - Chat is never a grant, so an owner who types "อนุญาตรอบ ORV-81" in chat is refused and must answer the form. That costs one more step; it is the owner's choice of 2026-10-23.
  - Version gap. The recorded samples come from Claude Code 2.1.282, the `claude` on PATH, while the owner's IDE session runs 2.1.308. The hooks do not assume the newer shape: a hook that finds an expected field missing fails closed (it blocks, or `owner-grant` writes no record and exits 2), and the samples are re-recorded when the guards must target 2.1.308.
  - Only `merge-guard` and `g3-check` run their checks from the develop export. The other guards run the worktree's own copy, so a builder that may edit a guard file (an exact path in its `write_set`) can weaken `envelope-guard`, `write-guard` or `result-recorder` for that worktree until the merge. The merge check then sees a guard-file change and needs the owner's approval.
  - The `merge-guard` launcher itself is the worktree's copy. A builder that edits `.claude/hooks/merge-guard.sh` or the hook registration in its worktree can stop the launcher from calling the develop checks for sessions in that worktree, so the guard-file and approval checks never run for that PR. Only a merge from a session whose `.claude/hooks/` and `.claude/settings.json` equal develop's closes that gap; the G3 packet lists every guard file the PR changes so the owner sees it. The owner accepted this residual risk on 2026-10-23 (open question 13).
  - The develop export runs with the checkout's own `node_modules`, which is not a guard file. A session that tampers with a dependency there, `ajv` for example, can change what the trusted checks decide.
  - The launcher trusts the `origin` remote. `merge-guard` blocks the `git remote` and `git config` forms that change it, but a process that edits `.git/config` directly, or a tool write to that file, is not caught.
  - The owner's `close-envelope.mjs --owner` close is blocked in Claude Code sessions by command text only, like the other Bash rules; a script that a session runs could still write the same record.
  - A session started without these hooks (hooks disabled, other settings, another client, an editor) escapes all of this.
  - The hooks are the only merge barrier. GitHub branch protection and rulesets are not available on this repo's plan (HTTP 403), so a merge through the GitHub web UI or another client is not guarded. `merge-guard` matches GraphQL mutations by name; a mutation it does not list, or one built so its name is not in the command text, is not caught.
  - The per-subagent `write_set` is not enforced at write time; it is enforced at merge (AC 39).
  - The envelope issue check reads the worktree's branch name at dispatch time. A session that renames or switches the branch can still dispatch under another key; the check ties an envelope to the branch, not to the work the subagent then does.
  - `g3-check` guards the G3 move only. Moves to Staging and Done are not checked by a hook.
  - `looked_at` and the screenshot `note` are the qa agent's own statement. The owner sees the screenshots in the G3 packet.
  - Background detection rests on one recorded sample: a background subagent's SubagentStop lists its own `agent_id` in `background_tasks`. If a later Claude Code version leaves that entry out, the stop is taken as foreground and records nothing, the `async_launched` PostToolUse records nothing either, and the envelope stays open with no warning until `close-envelope.mjs` closes it as `abandoned` (R89-5).
  - `worktree-guard` reads command text only. It does not catch `rm -rf` on a worktree folder, a script or program a subagent runs that removes a worktree itself, or the main session, which it never judges. It does not see a word the shell builds by expansion, such as `git work$()tree remove` or `git work${VAR}tree remove` with an empty `$()` or `${VAR}` inside the word, nor an encoded command piped to a shell, such as a base64 string decoded into `sh`. A hook whose own files went with a removed worktree cannot run at all. The text rule also blocks a harmless subagent command that holds the words, such as a `grep` for `worktree remove`; the subagent uses the Grep tool instead.
- **Main session or subagent.** The guards tell them apart by the `agent_id` and `agent_type` fields that Claude Code adds to hook input inside a subagent. Slice A2 records real stdin samples of PreToolUse, PostToolUse, SubagentStart, SubagentStop and UserPromptSubmit from the installed version before any guard relies on them, including which Agent `tool_input` fields exist (`run_in_background`, `isolation`, `model`, `cwd`). ORV-85 recorded the headless set (`docs/specs/ORV-85/stdin-samples.md`): `agent_id` and `agent_type` are present inside a subagent and absent in the main session, and UserPromptSubmit has no `source`. No guard reads UserPromptSubmit, so whether an interactive prompt carries `source: "user"` no longer matters. The `AskUserQuestion` answer shape comes from a real answered form in a 2.1.308 session transcript (`toolUseResult`), not from recorded hook stdin (same file); `isolation` and `cwd` are still to be recorded. If a field is not there (for example `agent_id` on SubagentStart, which binding needs), the guard fails closed and the story stops for a decision.
- **Records stay local.** `.orivilo/` is in `.gitignore`. The G3 packet quotes `qa.json` and `reviewer.v1` and links the screenshots.
- **Delivery slices**, each one PR of about 400 changed lines, each with its own Jira issue linked to ORV-81. A hook is registered only in the slice that ships the skill or agent that satisfies it:
  1. Slice A1: `ajv`, the four schemas, `scripts/ovl/validate.mjs`, strict-compile and fixture tests (AC 66). No hook is registered.
  2. Slice A2: `envelope-guard` (with the Agent call field checks), the heartbeat, the fail-closed wrapper and the `pre-commit-gate` fix, `ovl-doctor` (probing only registered guards), the `owner-grant` hook on PostToolUse(`AskUserQuestion`) with its fixture from a real answered form in a 2.1.308 session transcript (`docs/specs/ORV-85/stdin-samples.md`), a minimal `ovl` skill that writes envelopes, dispatches and asks the grant form, and `.orivilo/` in `.gitignore`, registered together (AC 1 to 14, 47, 48, 64, 69 to 73, 78 to 82). The round rules (AC 11 to 14, 64, 80) are tested on fixture records until A3 writes real ones. The ignore lands here because A2 is the first slice that writes under `.orivilo/`; without it, ORV-13's `dirty` (from `git status --porcelain`) is true on every run.
  3. Slice A3: `result-recorder` on all four events, the gate record, `close-envelope.mjs` (with the SubagentStop heartbeat check and `--owner`), the one-open-envelope-per-role rule and the bound-builder round count in `envelope-guard`, the doctor's one-time `pre_a3` close of A2-era envelopes, and the report-contract line in `product.md`, `ds-architect.md`, `designer.md`, `builder.md`, `reviewer.md` and `release.md` (AC 15 to 24, 50 to 52, 54 to 56, 58, 63, 67, 68, 76). The contracts land with the recorder that enforces them, so no role is sent back for prose it was never told to avoid. It needs ORV-13 merged first (the gate record and AC 21, 22, 56 and 58 read `git.sha`, `dirty` and `stepsSource`). If A3 passes about 400 changed lines, the agent-file lines split into their own PR that merges just before it.
  4. Slice B: `write-guard` and the `qa` agent with its `qa.v1` contract (AC 25 to 32, 53, 65).
  5. Slice C1: `merge-guard`, its develop-export launcher and `scripts/ovl/merge-check.mjs` (AC 33 to 44, 57, 59 to 62, 74, 75, 77). It needs ORV-13 merged first. The owner merges it by hand in the GitHub web UI after reading its G3 packet (open question 11).
  6. Slice C2: `g3-check` and `jira-transitions.json` (AC 45, 46).
  7. Slice D: the full `ovl` skill and the remaining doc changes ADR 0013 lists (AC 49).

## Impact

- New: `.claude/skills/ovl/SKILL.md`, `.claude/agents/qa.md`, six hooks in `.claude/hooks/` (`envelope-guard`, `result-recorder`, `owner-grant`, `write-guard`, `merge-guard`, `g3-check`), `scripts/ovl/` (schemas, `validate.mjs`, `merge-check.mjs`, `g3-check.mjs`, `doctor.mjs`, `close-envelope.mjs`, `jira-transitions.json`), their tests and recorded stdin samples, and `ajv` as a root dev dependency.
- Changed: `.claude/settings.json` (hook registration with `|| exit 2`, and the SubagentStop wrapper), `.claude/hooks/pre-commit-gate.sh` (fails closed), `.gitignore` (`.orivilo/`), `AGENTS.md` iron rule 3, `CLAUDE.md` (skills list, the `lead` line), `.claude/skills/gate-packet/SKILL.md` (G3 row), `.claude/agents/reviewer.md` (AC walk moves to qa), `.claude/agents/release.md` (the four lessons), `.claude/agents/product.md`, `.claude/agents/ds-architect.md`, `.claude/agents/designer.md` and `.claude/agents/builder.md` (each ends with one JSON report in its contract; `builder.md` reports `blocked_on` instead of to `lead`), `docs/context/ai-team-skills.md` (model policy drops `lead`, adds `qa`), `docs/context/master-plan.md` (Phase 3 item 3 is this story).
- Removed: `.claude/agents/lead.md`.
- Other issues: ORV-13 keeps the full `git.sha`, `git.dirty`, `stepsSource` and the `pnpm quality-gate` alias.
- No product code, token, component API or schema in `packages/` changes.
- ORV-89 (2026-10-24), records in the main checkout and background launches:
  - AC 52 now means one open envelope per role across every worktree of the repo, not per checkout.
  - Parallel worktree work (AGENTS.md, one issue per worktree): two issues still get two trees, but they cannot run the same role at the same time; the second dispatch waits for the first envelope to close.
  - Binding across worktrees: a SubagentStart in one worktree binds the open envelope of its role even when another worktree dispatched it. One open envelope per role keeps that match unique.
  - Every reader of records (`envelope-guard`, `owner-grant`, `result-recorder` and its gate record, `close-envelope.mjs`, `doctor.mjs`) resolves the main checkout, and `write-guard` (slice B) protects `.orivilo/` there.
  - `scripts/ovl/metrics.mjs` (ORV-87): `--root` defaults to the main checkout.
  - Records already written under a worktree's own `.orivilo/` are no longer read by the hooks (R89-2). `doctor.mjs plan` stops while any exist, and `doctor.mjs migrate` moves them into the main checkout by task folder, with their heartbeat lines (AC 86 to 89).
  - AC 69: a background launch Claude Code makes without the flag is recorded at SubagentStop; the `ovl` skill text on background calls needs review. `release.md` gains the rule that the agent never removes its own worktree.
  - New guard `worktree-guard` (`.claude/hooks/worktree-guard.mjs`, `scripts/ovl/worktree-guard.mjs`), registered on PreToolUse(`Bash`) in `.claude/settings.json` with `|| exit 2` (AC 83 to 85).
- ORV-88 (2026-10-24), no resume:
  - New guard `resume-guard` (`.claude/hooks/resume-guard.mjs`, `scripts/ovl/resume-guard.mjs`), registered on PreToolUse(`SendMessage`) in `.claude/settings.json` with `|| exit 2`, and one `doctor.mjs` probe. It arrives with the ORV-88 PR; until that merges, a resume runs unguarded.
  - `envelope-guard`, `envelope.v1` and the round rules do not change. `rework_of` stays a builder field; a reviewer re-check cites the earlier `result.json` in `context_pointers` (L-0008).
  - The same PR changes the `ovl` skill (step 2, the guard list, Honest limits) and the `metrics.mjs` notes line. Its acceptance rows are in `docs/specs/ORV-88/spec.md`, not in this table.
- ORV-93 (2026-10-24), slice B in two PRs:
  - PR 84, the qa agent: new `.claude/agents/qa.md` (Opus); `scripts/ovl/result-recorder.mjs` and its test resolve `qa.v1` and `reviewer.v1` screenshot paths against the records root in the main checkout; the `ovl` skill gains a `qa` dispatch in step 2. `qa.v1` and `envelope-guard` do not change.
  - PR 85, `write-guard`: new `.claude/hooks/write-guard.mjs`, `scripts/ovl/write-guard.mjs` and its test, recorded PreToolUse fixtures under `scripts/ovl/fixtures/hook-stdin/` and `docs/specs/ORV-93/samples.md`; `.claude/settings.json` registers it on PreToolUse(`Bash`) and on the four write tools with `|| exit 2`; `doctor.mjs` gains the `write-guard` probe and fails `check` while `packages/.ovl-probe` exists; `metrics.mjs` gains `session <id> --out <name>` with a bounded `--root`, so the session note is no longer a hand write; the `ovl` skill steps 1 and 4, Honest limits and "Not in this slice" change.
  - The main session's one write under `.orivilo/` is `.orivilo/handoff.md`; `docs/` stays outside every set. No ADR is amended (ORV-93 open question 4). Its acceptance rows are in `docs/specs/ORV-93/spec.md`; AC 25 to 32, 53 and 65 here are met by them.

## Out of scope

- Headless runs: `agent-stage.yml`, `agent-review.yml` and Jira Automation waking the next stage (Phase 3 items 4 and 5).
- A stall watchdog. In-session, the owner sees a stall. It comes with headless runs.
- Model choice in the envelope. The agent file sets the model.
- A sandbox for subagent writes, and write-time enforcement of each `write_set`.
- GitHub-side merge protection (needs a plan change).
- Hook checks on moves to Staging and Done.
- AI cost tracking and the Jira custom fields (Lane, Agent Role, Risk flags, AI cost).
- Changes to the `retro`, `discover`, `frontend-design` and `webapp-testing` skills.

## Open questions (option, impact, default)

1. **Who passes G1 and G2 for ORV-81?** Answered: the owner reviewed and passed both on 2026-10-23 (Jira ORV-81 comment 10056). The POC delegation stays for every other story.
2. **Schema validator.** Answered by the owner: `ajv` as a root dev dependency.
3. **ORV-13 first.** Options: merge the quality-gate script before slice C1; or have `merge-guard` run the gate itself. Default: merge ORV-13 first, with the full SHA and `dirty` in its report.
4. **The G3 move through a script.** In-session, Jira is reached through MCP, so the script runs inside a hook on the MCP transition tools. Options: that; or a script that calls the Jira API with its own token. Default: the hook, because no Jira token exists outside MCP yet.
5. **The `write_set` union check at merge.** Answered by the owner: block.
6. **Lane.** No AGENTS.md risk flag applies, but the story is epic size. Default: L.
7. **Records in git.** Answered by the owner: ignore `.orivilo/`, and quote the records in the G3 packet.
8. **A PR that changes a guard file** (`.claude/hooks/`, `.claude/settings*.json`, `scripts/ovl/`, `scripts/quality-gate.mjs`, `.gitignore`, and from v1.3 `.github/workflows/`). Answered by the owner on 2026-10-23: such a PR needs an owner approval record `.orivilo/owner-approvals/<PR>.json`, written from the owner's own terminal and naming the head SHA, and `merge-guard` blocks without it (AC 60). The check runs from the develop export (AC 59, 74).
9. **Leaving an escalation.** Answered by the owner on 2026-10-23: after round 2, the owner's answer is enough to grant another round, and the `owner-grant` hook writes a record that quotes it (AC 64). This replaces the `owner-reset` terminal record of v1.1. Narrowed by the owner the same day, in the question form: "กดเลือกในแบบฟอร์มเท่านั้น" (ADR 0014). Only a grant option clicked in a question form counts; text typed or pasted into chat never does (AC 72, 73, 78, 79). Its weakness is in Honest limits.
10. **Agent calls without an envelope.** Answered by the owner on 2026-10-23: `Explore` only.
11. **Merging slice C1 itself.** The `merge-guard` launcher runs the checks from the develop export, which has no `merge-check.mjs` until C1 merges, so the launcher blocks C1's own `gh pr merge`. Options: the owner merges C1 by hand in the GitHub web UI after reading its G3 packet; or the launcher falls back to the branch copy while develop has none. Impact: the fallback is the hole F2 describes, open for exactly one PR. Answered by the owner on 2026-10-23: the owner merges C1 by hand in the GitHub web UI after reading its G3 packet. The launcher has no fallback.
12. **CI workflows as guard files.** A merge needs green `gh pr checks`, and a PR can edit `.github/workflows/`. Options: add `.github/workflows/` to the guard files (owner approval at merge); or leave it to the G3 packet, which lists changed workflow files. Answered by the owner on 2026-10-23: `.github/workflows/` files are guard files. `write-guard` protects them, and a PR that edits them needs the owner's approval record from the owner's own terminal (AC 77).
13. **Confirming v1.2 and v1.3.** The owner confirmed v1.1 by a G2 addendum built from its change log. Answered by the owner on 2026-10-23: one G2 addendum covers the v1.1, v1.2 and v1.3 change logs together. The owner also accepts, and this spec records in Honest limits, the residual risk that the worktree's own `merge-guard` launcher copy can be edited so the develop checks never run.

## Changelog

- v1 (2026-10-23): spec. Owner passed G1 and G2.
- v1.1 (2026-10-23): resolves the fresh-context spec review, round 1 (19 findings). Line numbers are v1 lines. No decided choice changes; guards are tightened, formats defined, slices split and AC rows added (21 rows became 49).
  - F1 (blocking, line 67): the main session could write its own `qa.json`. Resolved: only hooks write records, with exclusive create; `write-guard` blocks `.orivilo/` and `.quality-gate/` for every session, with a PNG exception for qa and designer screenshots (Records, AC 27, 28, 32).
  - F2 (blocking, line 387): the guards did not protect themselves. Resolved: guard files are a protected set for every session, writable only by a builder that lists the exact path; a session without hooks is an honest limit (Hooks, AC 29 to 31, open question 8).
  - F3 (blocking, line 388): `merge-guard` matched only `gh pr merge`. Resolved: it normalises whitespace and always blocks pushes to `develop` or `main` and `gh api` merges; the missing branch protection is an honest limit (AC 40 to 43).
  - F4 (important, line 148): the rework limit could be escaped. Resolved: rounds count per issue, a failed gate is recorded and counts, `rework_of` is required after a verdict, and the owner resets with a record (Rework loop step 8, AC 11 to 14, open question 9).
  - F5 (important, line 385): role and subagent type were not tied. Resolved: `subagent_type` must equal `role`, the recorder ties contract to `agent_type`, and only `Explore` runs without an envelope (AC 8, 9, 17, open question 10).
  - F6 (important, line 389): the Jira matcher would not fire. Resolved: a regex matcher covers every Atlassian server and `executeWrite`, transition ids map to statuses through a recorded file, unknown ids fail closed, and the doctor probe hits the same matcher (AC 45, 46).
  - F7 (important, line 388): a merge did not need the reviewer or CI. Resolved: `merge-guard` needs a `reviewer.v1` approve on the head and green `gh pr checks` (AC 34, 35); ADR 0013 Consequences aligned.
  - F8 (important, line 26): the ORV-13 dependency was misdescribed. Resolved: the statement is corrected, ORV-81 needs the full SHA and `dirty`, and the gate report must match the PR head (AC 22, 36).
  - F9 (important, line 321): `visual` was self-declared and approve rules were untested. Resolved: the recorder derives `visual` from a keyword list, the schema rejects approve with `ok: false`, and SHA and screenshot rules run at record time (AC 20 to 23).
  - F10 (important, line 388): the story to screenshot link was undefined. Resolved: `story` is the Storybook id, each changed stories file needs a light and a dark shot under its title, and paths must be PNGs in the task's own folder (AC 23, 24, 38).
  - F11 (important, line 147): the `done_when` rule was not testable and `checked_by` accepted a space. Resolved: allowed command prefixes and source forms are defined, and the schema requires a non-space character (AC 2, 3, 6, 7).
  - F12 (important, line 20): hooks failed open on a crash. Resolved: a top-level catch or ERR trap, `|| exit 2` on each registration, and `pre-commit-gate` brought in (AC 47, 48).
  - F13 (important, line 424): Impact missed files. Resolved: product, ds-architect, designer and builder agents and `ai-team-skills.md` are added; AC 49 is a grep.
  - F14 (important, line 415): guards arrived before the skill that satisfies them, and slice A was too big. Resolved: seven slices; A1 registers nothing, and A2 registers `envelope-guard` with a minimal `ovl` skill; always-on behaviour is stated.
  - F15 (suggestion, line 386): applied. Report shape is checked on SubagentStop so the subagent itself is sent back; PostToolUse only records.
  - F16 (suggestion, line 200): applied. Typed then-branches, absolute `$id` values, `strict: true` in slice A1.
  - F17 (suggestion, line 408): applied. `write_set` entries are paths or globs under two fixed folders (AC 10).
  - F18 (suggestion, ADR 0013 line 5): answered. The owner did review G1 and G2 personally, so the ADR now records the owner as decider with the Jira reference.
  - F19 (suggestion, line 1): answered. No change needed; each build slice runs the full gate.
  - Also: step 3 of the Rework loop now pushes the squashed head before qa and review, so their records match the head that merges (follows from F8).
  - Downstream review: the owner's G2 approval of v1 (v1.1 changes guards, not choices), ADR 0013, the slice Jira issues (now seven), ORV-13 (report shape), `docs/context/master-plan.md`.
- v1.2 (2026-10-23): records the owner's four answers and resolves the fresh-context spec review, round 2 (task ORV-81-spec-review-2: 6 important, 5 suggestions, 1 verification note). Line numbers are v1.1 lines. AC rows 1, 14 and 32 change; rows 50 to 65 are added (49 rows became 65).
  - Owner answer 1: v1.1 is confirmed by a G2 addendum built from its change log (Decisions; open question 13 asks whether the same addendum covers v1.2).
  - Owner answer 2 (open question 8): a guard-file PR needs an owner approval record from the owner's own terminal, naming the head SHA; `merge-guard` blocks without it (Records, Hooks, AC 60).
  - Owner answer 3 (open question 9): after round 2 the owner grants another round in chat; the new `owner-grant` hook records the exact quote, the time, the session id and the transcript path. It replaces the `owner-reset` terminal record. Honest limits say plainly that it is weaker than a terminal record (Records, Hooks, Rework loop step 8, AC 14, 64).
  - Owner answer 4 (open question 10): only `Explore` runs without an envelope (Roles, AC 9).
  - R2-1 (important, line 424): envelopes were not tied to one subagent and never closed without a result. Resolved: one open envelope per role; SubagentStart binds the subagent by `agent_id`, and `write-guard` and SubagentStop match on `agent_id`; PostToolUse writes `closed.json` `no_report`; `close-envelope.mjs` closes a denied or abandoned envelope; a closed envelope is never a round; SubagentStop passes `Explore` (Records, Hooks, AC 50 to 54).
  - R2-2 (important, line 454): a PR could weaken the `merge-guard` that judges it, since hooks run from the worktree's copy. Resolved: the launcher runs `merge-check.mjs` and `g3-check.mjs` from an `origin/develop` export, so the guard-file and owner-approval checks never run from the branch under review (Hooks, AC 59). The launcher's own copy and the other guards are residual risks in Honest limits; bootstrapping C1 is open question 11.
  - R2-3 (important, line 451): the gate record missed `pnpm quality-gate` and counted a builder's red TDD run. Resolved: the matcher takes all three forms after collapsing whitespace, and only the main session writes a gate record (Hooks, Rework loop step 2, AC 55, 56). Also from the ORV-13 fact: the record carries `steps_source`, a stub run is never a verdict, and an approve and a merge need `stepsSource: "gate"` (AC 57, 58).
  - R2-4 (important, line 496): the slice plan broke sessions between slices. Resolved: `.gitignore` moves into A2; the report-contract lines in the agent files move into A3 with the recorder (`qa.md` in B); the doctor probes only registered guards (AC 1); A3 also waits for ORV-13.
  - R2-5 (important, line 457): GraphQL merges and `git push origin HEAD` on `develop` slipped through. Resolved: GraphQL merge and ref mutations, and queries read from a file or stdin, are blocked; `HEAD`, `@` and a bare branch refspec resolve to the current branch first (Hooks, AC 61, 62). Matching mutations by name is an honest limit.
  - R2-6 (important, ADR 0013 line 43): the ADR stated pending defaults as decided. Resolved by the owner's answers: questions 8, 9 and 10 are now decided, and the ADR says so with this spec as source; its Status line now says v1.1 added three questions, which the owner answered, and v1.2 records the answers.
  - R2-7 (suggestion, line 424): applied. The PNG exception covers Bash write forms into the subagent's own `screenshots/`, `qa` passes that path to `page.screenshot`, and AC 32 is a Bash write.
  - R2-8 (suggestion, line 456): applied. `git diff`, `git log`, `git show` and `git status` with no redirect and no `--output` are plain reads (AC 65).
  - R2-9 (suggestion, line 470): applied. Step 3 opens or updates the PR and returns its number; `round` is removed from `reviewer.v1` and `qa.v1` and the recorder fills it in `result.json`.
  - R2-10 (suggestion, line 442): applied. SubagentStop with `stop_hook_active` true exits 0 in the wrapper too, and records nothing (Hooks, AC 63).
  - R2-11 (suggestion, ADR 0013 line 64): applied. The iron rule 3 text names the `reviewer.v1` approve and green CI.
  - R2-12 (verification note, line 118): no change; the reviewer confirmed F1, F5 to F13 and F15 to F17 closed, and reopened F2, F3 and F14, which R2-2, R2-5 and R2-4 close.
  - Downstream review: the owner's G2 addendum (open question 13), ADR 0013, the slice Jira issues (A2, A3, B and C1 change scope; A3 grows), ORV-13 (`stepsSource` and the `pnpm quality-gate` alias stay), the `webapp-testing` usage in `qa.md` (screenshot path), `docs/context/master-plan.md`.
- v1.3 (2026-10-23): records the owner's second set of answers and resolves the fresh-context spec review, round 3 (task ORV-81-spec-review-3: 4 important, 3 suggestions). Line numbers are v1.2 lines. AC rows 51, 52, 59 and 64 change; rows 66 to 77 are added (65 rows became 77).
  - Owner answer 5 (open question 11): the owner merges slice C1 by hand in the GitHub web UI after reading its G3 packet; the launcher has no fallback (Hooks, slice C1).
  - Owner answer 6 (open question 12): `.github/workflows/` files are guard files, so `write-guard` protects them and a PR that edits them needs the owner's terminal approval record (Hooks, AC 77).
  - Owner answer 7 (open question 13): one G2 addendum covers v1.1, v1.2 and v1.3. The residual risk of the worktree's own `merge-guard` launcher copy is accepted and recorded (Honest limits).
  - Owner answer 8: v1.3 is the last spec round (Spec rounds, below).
  - R3-1 (important, line 517): a builder that ended without a report was never a round, so reworks were unlimited. Resolved: every builder envelope that was bound (has `agent.json`) after the first verdict is a round however it ended; only `denied` and `pre_a3`, never bound, are not; `rework_of` names a bound task; `close-envelope.mjs` refuses `abandoned` until a SubagentStop heartbeat line exists for the `agent_id`, and a session that died mid-run is closed by the owner with `--owner` from a terminal, which `write-guard` blocks inside Claude Code (Envelope guard, Records, Rework loop step 8, AC 51, 67, 68).
  - R3-2 (important, line 482): the Agent call's `run_in_background`, `isolation`, `model` and `cwd` were unchecked, and "records folder" was undefined. Resolved: `envelope-guard` blocks background, isolation and model; a `cwd` must equal the envelope `worktree`, which must be the session's checkout; the records folder is the checkout's whole `.orivilo/runs/`, so one envelope per role is open per checkout across issues (Roles, Envelope guard, Records, AC 52, 69 to 71). Beyond the review's fix, `worktree` must equal the session's checkout, since a `cwd` that matches a foreign `worktree` would reopen the same hole.
  - R3-3 (important, line 488): `owner-grant` accepted prompts the owner did not type and a common phrase. Resolved: only `source: user` (or a missing `source`, if A2's sample shows typed prompts omit it) and the question form can grant; the phrase must come with the issue key; `another round` is dropped and the one-escalated-issue guess is gone (Hooks, AC 64, 72, 73). Pasted text that holds the phrase and the key is an honest limit.
  - R3-4 (important, line 502): the launcher trusted the local `origin/develop` ref. Resolved: it resolves develop's SHA with `git ls-remote`, fetches it and archives by SHA; `merge-guard` blocks `git update-ref` under `refs/remotes/origin/`, `git remote add`, `git remote set-url` and `git config` on `remote.` keys (Hooks, AC 74, 75). `node_modules` tampering and a direct `.git/config` edit are in Honest limits.
  - R3-5 (suggestion, line 544): applied. The doctor closes A2-era envelopes once as `pre_a3` when A3 registers the recorder (Records, slice A3, AC 76).
  - R3-6 (suggestion, line 542): applied. Slice A1 has AC 66 (strict compile and fixtures); A2 states that its round tests use fixture records until A3.
  - R3-7 (suggestion, a verification note, line 455): no change; the reviewer confirmed the v1.2 schema changes and R2-1 to R2-11 closed, with the new holes covered by R3-1 to R3-4.
  - Spec rounds: by the owner's decision of 2026-10-23, v1.3 is the last spec round for ORV-81. A later finding that does not block is recorded in Honest limits or fixed in the slice that builds the mechanism it concerns, with a change-log line; only a blocking finding reopens the spec. Build starts with slice A1.
  - Downstream review: the owner's G2 addendum (now covering v1.1 to v1.3), ADR 0013 (decisions 2, 5 and 7, Consequences), the slice Jira issues (A1 gains AC 66; A2, A3 and C1 gain rows), the `ovl` skill text on `close-envelope.mjs` and grant phrasing, `docs/context/master-plan.md`.
  - Post-review owner decision, 2026-10-23 (no version bump, by the spec-rounds rule above: it narrows a mechanism before slice A2 builds it). Evidence: the ORV-85 samples (`docs/specs/ORV-85/stdin-samples.md`, `scripts/ovl/fixtures/hook-stdin/UserPromptSubmit-headless.json` and `UserPromptSubmit-task-notification.json`) show that a UserPromptSubmit has no `source` field in a headless run and that a background agent's completion notice arrives as a UserPromptSubmit with no `source`; whether an interactive typed prompt carries `source: "user"` cannot be recorded headless. So the R3-3 rule could not tell the owner's typing from a prompt Claude Code builds. Asked in the question form, the owner chose "กดเลือกในแบบฟอร์มเท่านั้น" (count only answers clicked in the question form). Changed: `owner-grant` runs only on PostToolUse(`AskUserQuestion`); the UserPromptSubmit path, its `source` rule and the free-text grant phrase are removed; a grant is a clicked option label that names the escalated issue's key; the record quotes the question, the options, the answer and the time; `owner-grant` now fails closed like every other hook (Decisions answer 3, Records, Hooks, Rework loop step 8, Honest limits, Main session or subagent, slice A2, open question 9). AC rows 14, 47, 48, 64, 72 and 73 change; rows 78 and 79 are added (77 rows became 79). Honest limits gain the form's own limits and the 2.1.282 to 2.1.308 version gap. Downstream review: ADR 0014, which records this decision and amends ADR 0013 decisions 5 and 7 (ADR 0013 is merged, so it is not rewritten; its Status line points to ADR 0014), the ORV-85 (slice A2) Jira issue and its envelopes, the `ovl` skill text on asking the grant form, the G2 addendum record.
  - Correction (slice A1 review, task ORV-81-A1-review-1 finding I-2): AC 66 named `pnpm test`, which runs the workspaces through turbo and never runs `scripts/ovl/*.test.mjs`. It now names `pnpm test:scripts`, the command CI and the quality gate call. No behaviour changes; no version bump.
  - Narrowing, 2026-10-23 (slice A2 review, task ORV-85-A2-review-1 finding S-4; no version bump, by the spec-rounds rule): rounds count from the first negative verdict (a `request_changes` result or a failed gate record), not from any `qa.v1` or `reviewer.v1` result, so an approve starts no count. The `rework_of` requirement follows the same term (Envelope guard, Rework loop step 8). Downstream review: the ORV-85 round tests and fixtures.
  - Narrowing, 2026-10-23 (slice A2 review, task ORV-85-A2-review-1 finding I-2; no version bump): escalated is defined once: rounds used reach the allowance and the latest negative verdict is newer than the last bound builder envelope, whatever approves came later. `owner-grant` grants only when escalated; `envelope-guard` blocks a builder once rounds used reach the allowance, and the waiting state between the two is set out by the S-8 line below (Envelope guard, Hooks `owner-grant`, Rework loop step 8). Downstream review: `envelope-guard`, `owner-grant` and their tests in ORV-85.
  - Narrowing, 2026-10-23 (slice A2 review, task ORV-85-A2-review-1 finding I-6; no version bump): a `builder`, `reviewer`, `qa` or `designer` envelope's `issue` must equal the `ORV-<n>` key in its worktree's current branch name, and a branch with no key fails closed; an `owner-grant` label must be exactly `อนุญาตรอบ ORV-<n>` or `grant round ORV-<n>` with nothing else, so a decline option can never grant (Envelope guard, Hooks `owner-grant`, Honest limits gain the branch-name limit and a narrower misleading-question limit). No AC row changes. Downstream review: `envelope-guard`, `owner-grant`, their tests, the `ovl` skill's grant form text in ORV-85.
  - AC rows, 2026-10-23 (owner's answer to task ORV-85-spec-notes, recorded by task ORV-85-spec-ac-rows; no version bump): the English grant words are case-insensitive inside the exact label form. Rows 80 to 82 make S-4 and I-6 testable: an approve-only history starts no rounds (80), an envelope whose issue differs from the branch key, or a branch with no key, is blocked (81), and a decline label such as `Do not grant round ORV-1` or `ไม่ อนุญาตรอบ ORV-1` writes no record (82). All three ship in slice A2 (79 rows became 82). Downstream review: the ORV-85 `envelope-guard` and `owner-grant` tests.
  - Wording, 2026-10-23 (slice A2 review, task ORV-85-A2-review-2 findings S-8 and S-9, recorded by task ORV-85-spec-s8; no version bump, no AC row changes). S-8: the I-2 line said one escalated definition serves both hooks, which the code does not do. Now `envelope-guard` blocks a builder once rounds used reach the allowance; `owner-grant` grants only when escalated; between the two the issue is waiting for review (the last round is not yet reviewed), and a verdict from qa, the reviewer or the gate ends that state (Envelope guard, Hooks `owner-grant`, Rework loop step 8). S-9: the spec said no question-form sample exists; the `owner-grant` fixture now comes from a real answered form in a Claude Code 2.1.308 session transcript (`toolUseResult`), not from recorded hook stdin (Hooks `owner-grant`, Main session or subagent, slice A2; `docs/specs/ORV-85/stdin-samples.md`). Downstream review: `docs/specs/ORV-85/stdin-samples.md` (the builder is updating it), the ORV-85 `owner-grant` fixture and tests.
  - Records location, 2026-10-24 (ORV-89, review task ORV-89-review-1 findings R89-1 and R89-5; owner decision ORV-89 comment 10071; no version bump). R89-1: records live in the main checkout's `.orivilo/` for the whole repo, resolved from `git rev-parse --git-common-dir`, and one envelope per role is open across the whole repo (Decisions, Envelope guard, Records, AC 52). R89-5: in the IDE session every Agent call runs in the background without `run_in_background` (ORV-89 comment 10069); such a launch passes the guard and is recorded at SubagentStop, so AC 69 no longer says nothing records it; the explicit flag stays blocked (Envelope guard, Hooks `result-recorder`, Honest limits). Also: a release agent never removes the worktree it runs in (Rules and bounds, Honest limits). AC rows 52 and 69 change; no row is added. Downstream review: the Impact list's ORV-89 entry, `envelope-guard`, `result-recorder`, `close-envelope.mjs`, `doctor.mjs`, `metrics.mjs` and their tests, the `ovl` skill, `release.md`, the `write-guard` slice B issue.
  - Worktree guard and migrate, 2026-10-24 (ORV-89, review task ORV-89-review-2 finding R89b-4; no version bump). The spec now names what the ORV-89 code adds. `worktree-guard` on PreToolUse(`Bash`) blocks a subagent command whose text, with quotes and backslashes removed and lowercased, holds `worktree` and `remove` or `prune`, and allows every other call without resolving a checkout; the orchestrator chose this fail-closed text rule over a command parser that let ten forms through and could lock a session out of Bash (R89b-1, R89b-2). `doctor.mjs plan` stops on stray worktree records, and `doctor.mjs migrate` moves them with the task folder as the unit, leaves and lists conflicts, appends heartbeat lines and refuses symlinks (R89b-3, R89b-6, R89b-8). The release-worktree rule and its honest limit now name `worktree-guard` and its limits: `rm -rf`, the main session, scripts (Hooks, doctor, Rules and bounds, Honest limits, Impact). Rows 83 to 89 are added (82 rows became 89). Downstream review: `worktree-guard`, `doctor.mjs` and their tests, `.claude/settings.json`, `.claude/skills/ovl/SKILL.md`, `release.md`.
  - Worktree guard limits and migrate wording, 2026-10-24 (ORV-89, review task ORV-89-review-3 findings R89c-1 to R89c-3; wording only, no version bump, no AC row changes). R89c-1: the Hooks entry for `worktree-guard` no longer says it blocks the words "whatever the form"; it lists the forms it catches, and Honest limits add that a word built by shell expansion (an empty `$()` or `${VAR}` inside it) or an encoded command piped to a shell is not seen. R89c-2: the `ovl` skill's migrate sentence now matches `doctor.mjs`: whole task folders move, a folder main already has is left whole and listed (exit 2), links are refused before any move (exit 2), and the worktree's heartbeat lines are appended. R89c-3: the previous line's note that the skill's open-envelope line still said "in this checkout" was stale and is dropped. R89c-4 (the heartbeat written into another repo) moves to ORV-90. Downstream review: `.claude/skills/ovl/SKILL.md`, the ORV-89 G3 packet's honest limits, ORV-90.
- v1.3 wording, 2026-10-24 (ORV-90, ORV-89 review 4; no version bump, no AC row added): `worktree-guard` writes its heartbeat only when the call's cwd belongs to the same repo as `CLAUDE_PROJECT_DIR`, so a session whose cwd is in an unrelated repo leaves no untracked `.orivilo/heartbeat.jsonl` there (closes R89c-4). The verdict is unchanged. AC 85 and Hooks `worktree-guard` are reworded. R89d-1 and R89d-2 (ORV-90 comment 10072) are closed: the `ovl` skill's Honest limits bullet now states the text rule and the missed forms, and the guard's top comment says the verdict is fixed before any checkout is looked up. Downstream review: `.claude/skills/ovl/SKILL.md`, `scripts/ovl/worktree-guard.mjs` and its test.
- v1.4 (2026-10-24): ORV-88. Records the owner's no-resume answer to ORV-87 open question 7 (Decisions). Hooks gain `resume-guard` on PreToolUse(`SendMessage`), which blocks every `SendMessage` call whatever `to` names; the `ovl-doctor` probe list gains a `SendMessage` probe; Impact gains an ORV-88 entry. The guard arrives with the ORV-88 PR. No AC row is added here (its rows are in `docs/specs/ORV-88/spec.md`), and `envelope.v1`, `envelope-guard` and the round rules do not change. Downstream review: `.claude/settings.json`, `scripts/ovl/doctor.mjs` and its test, `.claude/skills/ovl/SKILL.md`, `scripts/ovl/metrics.mjs`, `docs/specs/ORV-87/spec.md`.
- v1.5 (2026-10-24): ORV-93 (slice B, PR 84 and PR 85), as ORV-93 spec v1.3 decided. Hooks `write-guard` now states what shipped: the two registrations, paths resolved through `realpath` and lowercased, the main session's Write or Edit of `.orivilo/handoff.md` as the one exception under `.orivilo/`, `docs/` in no set, the builder grant for Write or Edit only and only in the envelope's own `worktree`, Bash naming with normalized paths, the redirect definition, `tail`, `wc` and the bounded `sed -n` as plain reads, the one-line run form with an empty or absolute checkout prefix, one whole `git add`, `git commit` or `git push`, and `ln`, `touch`, `git switch`, `git stash` and `git reset` as subagent write forms. Records, the reviewer rules and the `qa.v1` rules say screenshots resolve in the main checkout's records. Impact gains an ORV-93 entry. No AC row changes; ORV-93's rows test AC 25 to 32, 53 and 65. Downstream review: `docs/specs/ORV-87/spec.md` gets a changelog line for `metrics.mjs session --out` and `--root`, and slice C1's `write_set` union check must allow for main-session `docs/` files (ORV-93 open question 1).
  - Wording, 2026-10-24 (ORV-93 docs review, task ORV-93-docs-review-1 findings D2 to D4; no version bump, no AC row changes). The text now describes the shipped `scripts/ovl/write-guard.mjs`. D2: the promise that a call naming nothing protected is never locked out by its `cwd` covers Bash only; a tool write with a relative path and a `cwd` that cannot be resolved fails closed (ORV-93 AC 25). D3: `--owner` is refused on `close-envelope.mjs` only, not on every form (b) run. D4: the builder grant covers every tool write (Write, Edit, MultiEdit, NotebookEdit) of an exact listed path, not only Write or Edit; the v1.5 line above said Write or Edit only. Downstream review: `.claude/skills/ovl/SKILL.md` Honest limits and the `write-guard` stderr text that says "by Write or Edit", both to be read against this wording.
- Wording, 2026-10-25 (ORV-108, no version bump, no AC row changes). The `envelope.v1` role enum in the schema block gains `architect`, `security` and `research`, so the block equals `scripts/ovl/schemas/envelope.v1.json`.
