# Master plan: where ORIVILO stands

The plan in one place, kept in git so every session and account reads the same thing. Jira holds live status; this file holds the shape of the plan and why the order is what it is. Update it when an epic moves, when the owner changes the order, or before you hand the work to another session. Last updated 2026-10-23, after ORV-70.

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

1. Base component depth, audit D.2 stories 15 to 17 (`docs/specs/ORV-64/audit.md`). Story 14 is ORV-70.
2. E4-5 (ORV-45) parts 2 and 3: TaskBar, then CanvasChat with the chat parts (audit D.1).
3. Audit D.3: missing components by Studio need (RadioGroup, Switch, Alert, empty states, Avatar, navigation, confirm dialog, file upload, combobox).
4. E4-6 CompareStrip and VersionBadge, E4-7 present mode, E4-8 canvas example page.
5. E2-14 agent catalog exercise.
6. E1-3 to E1-7 knowledge content, then E3 the ORIVILO brand run through the product.
7. ORV-63 separate staging and production after the POC; E0 scripts when the loop needs them.

Each step is a batch: when it is finished in `develop`, propose a release to staging (ADR 0011).

## Waiting on the owner

- G5 sign-off for what is on staging, or the list of what to fix. Nothing is Done until then.
- When to move the next batch from `develop` to staging (ORV-70 is parked there).
- ORV-63: when the POC ends, the second database, domain and keys for production.

## Not in the MVP (handoff section 19)

Payments and booking backend, a full map, a Figma plugin and automatic two-way sync, an LLM in every interaction, agent swarms, multi-tenant, a large component library before the vertical slice, slop or emotion scores that cannot be checked.
