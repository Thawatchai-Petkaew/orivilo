# Master plan: where ORIVILO stands

The plan in one place, kept in git so every session and account reads the same thing. Jira holds live status; this file holds the shape of the plan and why the order is what it is. Update it when an epic moves, when the owner changes the order, or before you hand the work to another session. Last updated 2026-10-24, after release PR #92 (merged into `main` as fcad4c8): the AI team loop is complete and on staging (slices B ORV-93, C1 ORV-95, C2 ORV-98 and D ORV-99), with ORV-76. The epic table below is still the 2026-10-23 count.

Sources: the roadmap (https://claude.ai/artifact/H6YU5RrKniVMS1azGdG1oa, 2026-10-21), the progress report (https://claude.ai/artifact/WiTsC13it9yESkFiRU7wL7, 2026-10-22), `docs/specs/backlog-draft.md` (draft keys to Jira keys) and Jira project ORV on 2026-10-23. Where they differ, Jira and this file win.

## Principles that set the order

1. **Vertical slice before library.** Prove that two profiles dress the same components without changing behaviour before building every component.
2. **Contract before UI.** Profile, token, knowledge and rule schemas settle first; everything above reads them.
3. **Knowledge is the moat.** Collect per-node knowledge with its source from the structural layer on, not after the product.
4. **Honest about what is real.** The first interpreter is rule-based, Figma sync is bounded, and anything mocked says so in the UI.

## Four layers (read from the bottom)

| Layer        | What                                                                                                                           | State                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 0 Foundation | Stack and monorepo (ADR 0001), AI team rules and gates, Jira workflow, brand v1.1 hypothesis, delivery loop, auth (ADR 0002)   | Mostly done; E0 scripts remain               |
| 1 Structure  | Token layers, two hand-made profiles, components on shadcn with our recipes, Storybook and catalog, resolver, knowledge schema | Done and on staging                          |
| 2 Product    | Intent Studio MVP: reference screen, two directions, live preview and inspector, interpreter, approve and export, canvas       | In progress (E2 nearly done, E4 half)        |
| 3 Expansion  | Brand, Discover, Product and Build modules, Figma sync, image generation, voice                                                | Not started; order set by the first customer |

## Epics on 2026-10-23

| Epic                 | Jira  | Stories | On staging | In progress | Backlog | Notes                                                                   |
| -------------------- | ----- | ------- | ---------- | ----------- | ------- | ----------------------------------------------------------------------- |
| E0 Delivery loop     | ORV-5 | 6       | 1          | 1 (ORV-12)  | 4       | Scripts for Jira check, gate comment, quality gate, retro not built     |
| E1 Knowledge base    | ORV-6 | 7       | 2          | 0           | 5       | Schema and rule grammar done; no real knowledge content yet             |
| E2 Intent Studio MVP | ORV-7 | 18      | 15         | 0           | 3       | E2-13 superseded by E4; E2-14 agent exercise and ORV-64 coverage remain |
| E4 Canvas and nodes  | ORV-8 | 9       | 5          | 1 (ORV-45)  | 3       | E4-5 part 1 merged; TaskBar and CanvasChat next; E4-6 to E4-8 after     |
| E3 ORIVILO brand     | ORV-9 | 5       | 0          | 0           | 5       | Not started                                                             |

Owner requests outside the epics (ORV-54 to ORV-70) are listed in Jira; the recent ones are in `docs/context/handoff.md`.

## Order from here

The AI team loop is finished (see the AI team section below) and on staging since release PR #92. Audit D.2 base depth is done: ORV-67, 68, 70, 72, 77, 78. ORV-76 (canvas stories flaky on macOS) is done.

1. E4-5 (ORV-45) part 2: TaskBar.
2. Story fixes: ORV-83, ORV-84.
3. Guard follow-ups: ORV-94 (the `merge-guard` hook-timeout gap and ORV-95 rework R3), then ORV-96 (a Bash call that writes a record without naming `.orivilo`).
4. E4-5 (ORV-45) part 3: CanvasChat with the chat parts (audit D.1).
5. Audit D.3: missing components by Studio need (RadioGroup, Switch, Alert, empty states, Avatar, navigation, confirm dialog, file upload, combobox).
6. E4-6 CompareStrip and VersionBadge, E4-7 present mode, E4-8 canvas example page.
7. E2-14 agent catalog exercise.
8. E1-3 to E1-7 knowledge content, then E3 the ORIVILO brand run through the product.
9. ORV-63 separate staging and production after the POC; Phase 3 automation and the E0 scripts still open when the loop needs them.

Each step is a batch: when it is finished in `develop`, propose a release to staging (ADR 0011). Jira statuses follow ADR 0012.

## Waiting on the owner

- G5 sign-off for what is on staging, or the list of what to fix. Nothing is Done until then.
- When to move the next batch from `develop` to staging. Release PR #92 moved ORV-76, ORV-93, ORV-95, ORV-98, ORV-99 (PRs #83 to #91) there on 2026-10-24 (ORV-99 comment 10123); `develop` holds nothing new.
- ORV-97: GitHub rulesets on `develop` and `main` return HTTP 403 on this private free-plan repo (ORV-97 comment 10110). Only the owner can unblock it: GitHub Pro or a public repo.
- ORV-63: when the POC ends, the second database, domain and keys for production.

## AI team setup (the AI Team Loop plan, 2026-10-21)

Source: https://claude.ai/artifact/G7gBVvVk5fgsxZPYWbw4XC. Where it differs from the repo, the repo wins. Since the plan: AI goes through OpenRouter (ADR 0009), the Jira statuses are those of ADR 0012, and previews are off (ADR 0011).

| Phase                     | What                                                                                                                            | State on 2026-10-24                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 0 Decide and grant access | Jira site, connector                                                                                                            | Done                                                        |
| 1 Foundation              | Project ORV and its workflow, AGENTS.md, CLAUDE.md, settings, `.mcp.json`                                                       | Mostly done; the Jira fields are not set (Needs the owner)  |
| 2 AI team                 | Role agents, skills, gate packet, quality-gate script, hooks                                                                    | Loop complete (ORV-81 slices A to D); see Built below       |
| 3 Automation              | Jira Automation rules, `agent-stage.yml` and `agent-review.yml` on claude-code-action, an approve in Jira waking the next stage | Not started; the main session dispatches by hand            |
| 4 Pilot                   | One lane S and one lane M story through the automated loop, then a retro                                                        | Done by hand (ORV-72 to ORV-78); improvement run 2026-10-24 |

Phase 1: lanes are labels (`lane-L`), not a custom field; GitHub for Jira is not checked.

Built (ORV-81 and its slices ORV-85, ORV-86, ORV-89, ORV-90; ORV-88; ORV-93 slice B; ORV-95 slice C1; ORV-98 slice C2; ORV-99 slice D; metrics ORV-87 and ORV-91):

- Hooks on every Agent call: `envelope-guard`, `result-recorder`, `owner-grant`, `worktree-guard`; `resume-guard` blocks every SendMessage (ORV-88). The main session dispatches role agents with one envelope.v1 JSON prompt each, through the `ovl` skill and `node scripts/ovl/doctor.mjs`.
- `pnpm quality-gate` (E0-4): the full gate with real exit codes and a JSON report; run in the main session, it writes a gate record.
- Metrics: `node scripts/ovl/metrics.mjs collect|report|session|due` (spec `docs/specs/ORV-87/spec.md`).
- The improvement loop (`ovl` skill step 5) with Expected saving lessons. The first run, 2026-10-24, produced L-0008 (a reviewer re-check starts from the previous findings and the rework diff); the owner approved it, it is applied, and it is checked after 2026-11-07. The same run measured the orchestrator main session at 388,875,503 tokens in session 0baff5a3, about 4.3 times all its subagents.
- `write-guard` (ORV-93): the main session cannot write deliverables, guard files or records. The `qa` agent walks every AC with the full gate; its first walk found an untested clause by mutation.
- Guard rails that read the records: `merge-guard` (ORV-95, slice C1) blocks a merge or a push into `develop` or `main` without a qa approve, a reviewer approve, a passing gate and green checks for the head; `g3-check` (ORV-98, slice C2) blocks a Jira move to "G3 PR review" until the PR is merged into `develop` and its records hold. Both stop an agent that follows the rules and errs; neither is a boundary against a session that sets out to defeat it (L-0012, Honest limits in each spec).
- Slice D (ORV-99): the AC walk moves to the `qa` agent, and the `ovl` skill runs the full loop in the main session.
- Lessons L-0009 (ORV-76: verify a fix with the affected tests, then the full suite once), L-0010 and L-0011 (ORV-93), L-0012 and L-0013 (ORV-95); each is checked after 2026-11-07.
- 7 role agents and 7 skills, plus the pre-commit hook.

Owner only:

- ORV-97: GitHub rulesets on `develop` and `main`, the planned server-side boundary. They return HTTP 403 on this private free-plan repo (ORV-97 comment 10110), and hold only against a session credential that cannot administer the repo, with no bypass actor that matches it.

Follow-ups:

- ORV-94: the `merge-guard` hook-timeout gap (ORV-98 review F1) and ORV-95 rework R3 (the stories file path in row 24's stderr, the 300-character cut case in row 35).
- ORV-96: a Bash call that writes a record without naming `.orivilo` in its text (ORV-95 review finding F5).

Not built:

- The superpowers skills (plan in small tasks, TDD, verification before completion).
- Phase 3 automation: E0-1, the workflows and Jira Automation below.

Phase 3 plan, in order:

1. E0-4: a quality-gate script that runs the full gate, writes a JSON report and exits non-zero on failure. Done: `pnpm quality-gate`.
2. E0-1: a Jira field and transition check. Not built.
3. A task schema (JSON). Done as the envelope and report contracts of ORV-81, checked by the hooks. The verify step is the reviewer, the qa agent (ORV-93) and the gate record.
4. `agent-stage.yml` and `agent-review.yml` with max-turns, allowed tools and concurrency. Not built.
5. Jira Automation, which the owner sets up: an approve wakes the next stage. Not built.

Needs the owner:

- Jira custom fields (Lane, Agent Role, Risk flags, AI cost)
- GitHub for Jira
- the Anthropic or OpenRouter key and the Jira token as GitHub secrets
- the Jira plan (Claude Agent for Jira needs Standard or above)

## Not in the MVP (handoff section 19)

Payments and booking backend, a full map, a Figma plugin and automatic two-way sync, an LLM in every interaction, agent swarms, multi-tenant, a large component library before the vertical slice, slop or emotion scores that cannot be checked.
