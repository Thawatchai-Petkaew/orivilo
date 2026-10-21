# Backlog draft for review (not yet in Jira)

Drafted 2026-10-21 for GOLF to review before anything is created in Jira (creation waits for the owner's go-ahead). Sources: handoff §19–§22, the brief's MVP implications, ADR 0001–0003, the brand spec v1.1. Keys are placeholders; Jira assigns the real ORV numbers. Lanes and gates follow `AGENTS.md`. Every story is one PR of roughly 400 lines or less.

Reading the table: **Lane** S/M/L sets the gates. **Risk flag** names why a story is L. **Depends on** is build order, not optional.

## Epic E0: Delivery loop (the AI team can ship on its own)

Goal: a story can go Backlog → Done with the human only at the gates.

| #    | Story                                                           | Lane | Depends on | Done when                                                                                                     |
| ---- | --------------------------------------------------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| E0-1 | Jira field and transition check script                          | S    |            | `pnpm jira:check` reports the 12 statuses, transitions and issue types match `docs/context/ai-team-skills.md` |
| E0-2 | Gate packet posted as Jira comment from the `gate-packet` skill | S    | E0-1       | Running the skill on an issue posts the packet and moves it to the review status                              |
| E0-3 | Vercel preview URL in every PR and gate packet                  | S    |            | PR body and G3 packet carry the preview link; CI fails if missing                                             |
| E0-4 | Quality-gate script with real output capture                    | S    |            | `pnpm quality-gate` runs lint, typecheck, test, build, audit and writes a report file the packet quotes       |
| E0-5 | Contrast check in CI for brand and profile tokens               | S    | E2-2       | A script computes every text and UI pair from the token JSON; failing pairs fail CI                           |
| E0-6 | Retro ledger wired to Done transition                           | S    | E0-2       | `retro` skill appends to `docs/LESSONS.md` and proposes rule changes as a PR                                  |

## Epic E1: Knowledge base (the moat)

Goal: every node of the canvas has knowledge with provenance, and decision rules are closed, versioned and testable.

| #    | Story                                                                              | Lane | Risk flag       | Depends on | Done when                                                                                |
| ---- | ---------------------------------------------------------------------------------- | ---- | --------------- | ---------- | ---------------------------------------------------------------------------------------- |
| E1-1 | Knowledge entry schema (source, verifiedAt, confidence, license, scope)            | L    | schema contract |            | zod schema in `packages/intent-engine`, round-trip test, ADR 0004 records the shape      |
| E1-2 | Decision-rule grammar (closed form, no free text)                                  | L    | resolver logic  | E1-1       | Rules parse, validate and evaluate deterministically; conflicting rules are reported     |
| E1-3 | Seed corpus from UI/UX Pro Max data (MIT), confidence capped 0.7                   | M    | licensing       | E1-1       | Entries imported with provenance; license file included; a report lists what was skipped |
| E1-4 | Brand node knowledge: the brand CI method as rules                                 | M    |                 | E1-2       | §3–§6 of `brand-ci-method.md` encoded as rules with tests for the ORIVILO vector         |
| E1-5 | Color node knowledge: category audit and role rules                                | M    |                 | E1-2       | Rules produce a role palette from a lineup and personality vector; contrast verified     |
| E1-6 | Thai and Latin type node knowledge                                                 | M    |                 | E1-2       | Pairing, line-height and size-parity rules with the specimen test as fixture             |
| E1-7 | Reference source collectors (Mobbin, Dribbble, public Storybooks) as metadata only | L    | licensing       | E1-1       | Collector stores links and metadata, never assets; documented per source                 |

## Epic E2: Intent Studio MVP (handoff §19, phases 1–8)

Goal: two brand or intent sets drive the same components and patterns with behavior and data contracts unchanged, and a profile reproduces exactly.

| #     | Story                                                                                                | Lane | Risk flag               | Depends on     | Done when (handoff §22)                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------- | ---- | ----------------------- | -------------- | --------------------------------------------------------------------------------------- |
| E2-1  | Task, constraints and semantic contract for the reference screen (team workspace / project creation) | L    | semantic token contract |                | Schema and reference screen agreed at G1/G2                                             |
| E2-2  | Primitive palette and two hand-made profiles (Professional, Friendly)                                | L    | profile/token schema    | E2-1           | Swapping profiles changes the look; every state still present; tokens pass E0-5         |
| E2-3  | Neutral Studio profile for the app shell                                                             | M    |                         | E2-2           | Shell uses ink, canvas, one violet; no brand token inside the preview frame             |
| E2-4  | Button, Input, Select, Checkbox on shadcn primitives with recipes                                    | L    | component public API    | E2-2           | Each shows at least two recipes in Storybook; lint forbids raw color and radius classes |
| E2-5  | Dialog (overlay) and Card with profile scope through portals                                         | L    | component public API    | E2-4           | Overlay subtree receives the profile; test proves theme scope                           |
| E2-6  | Small Table or list with Thai and Latin content, long names, missing data                            | M    |                         | E2-4           | Fixture content renders in both profiles without layout breakage                        |
| E2-7  | Storybook catalog in Untitled UI's three tiers with page examples                                    | M    |                         | E2-4           | Catalog entries follow the handoff §15 shape; coverage checklist shows gaps honestly    |
| E2-8  | Reference screen built from the shared components                                                    | M    |                         | E2-5, E2-6     | Long data, small viewport, error and overlay work in both profiles                      |
| E2-9  | Deterministic resolver with validation and conflict report                                           | L    | resolver logic          | E2-2, E1-2     | Same input gives the same output; locked-field conflicts shown, never silently fixed    |
| E2-10 | Brief interpreter, rule-based, with an LLM adapter interface                                         | L    | AI claims               | E2-9           | UI labels it rule-based; adapter interface typed; no AI claim without implementation    |
| E2-11 | Two directions on one task, with live preview and inspector                                          | M    |                         | E2-10          | Directions differ visibly; preview keeps its inputs and state when style changes        |
| E2-12 | Draft, approve, version, export and import JSON                                                      | L    | data access             | E2-9, ADR 0002 | Approved snapshot immutable; edits create drafts; round-trip returns the same look      |
| E2-13 | Canvas board with block input and per-node drill-down conversation                                   | L    | UX architecture         | E2-11          | Input works as blocks, not a form; a node asks for missing dependencies when opened     |
| E2-14 | Agent catalog exercise: an agent composes a screen from public components only                       | M    |                         | E2-7           | Generated code imports real components and props; no duplicates created                 |
| E2-15 | Auth and workspace data access (Better Auth, restricted role)                                        | L    | auth/data access        | ADR 0002       | Every query goes through the authorization helper; default deny tested                  |

## Epic E3: ORIVILO brand, run through our own pipeline

Goal: ORIVILO is the first customer of its own tool, and its brand passes the tests in the spec.

| #    | Story                                                                                              | Lane | Risk flag       | Depends on | Done when                                                                      |
| ---- | -------------------------------------------------------------------------------------------------- | ---- | --------------- | ---------- | ------------------------------------------------------------------------------ |
| E3-1 | Mark similarity pre-screen (DIP Thailand, WIPO, visual search) and name screen in classes 9 and 42 | M    | asset licensing |            | Report in `docs/context/brand/`; outcome decides whether E3-3 proceeds         |
| E3-2 | Lineup test with three outsiders                                                                   | S    |                 |            | Protocol run; result recorded; palette adjusted or confirmed                   |
| E3-3 | Favicon, app icon and OG image from the SVG assets                                                 | S    |                 | E3-1       | Icons at 16/32/48/180/512 in `apps/web`; 16 px uses the violet dot             |
| E3-4 | Brand tokens as a profile JSON through the resolver                                                | M    |                 | E2-9       | ORIVILO's vector resolves to the v1.1 tokens; diff explained where it does not |
| E3-5 | Brand book export of ORIVILO from the product                                                      | M    |                 | E2-12      | The case study boards regenerate from the profile; manual boards retired       |

## Suggested order

1. E0-4, E0-3, E0-1, E0-2 (one week of mechanics so every later story runs through the loop).
2. E2-1 → E2-2 → E2-3 → E2-4 (the vertical slice starts here; E1-1 and E1-2 run in parallel because E2-9 needs them).
3. E2-5, E2-6, E2-7, E2-8, then E0-5.
4. E2-9, E2-10, E2-11, E2-12, E2-15.
5. E2-13, E2-14, E1-3 to E1-7, E3-4, E3-5.
6. E3-1 and E3-2 can run any time; E3-3 after E3-1.

## Open questions for the owner (each with the default we use if no answer)

1. Reference screen: team workspace / project creation as in the handoff, or the brand canvas itself? Default: handoff's screen, because it exercises forms, tables and overlays.
2. Light-only or light and dark in the MVP? Default: both, since the brand spec already defines a dark set.
3. Supabase project and Vercel project names and regions. Default: ask at E2-15; nothing before needs them.
4. Should E1-3 (seed corpus) land before E2-10, so the interpreter has knowledge to point at? Default: no; the first interpreter is rule-based on a hand-written vocabulary.
