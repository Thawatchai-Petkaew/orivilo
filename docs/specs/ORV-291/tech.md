---
issue: ORV-291 (https://tpetkaew.atlassian.net/browse/ORV-291)
spec: docs/specs/ORV-291/spec.md v1.1
adr: none new; the design stays inside ADR 0002 (server-only data access through `withWorkspace`) and ADR 0015 decisions 2, 9 and 10
task: ORV-291-tech-1
author: architect
date: 2026-11-19
---

# ORV-291 tech notes: the brand foundation, personality, architecture, working name and the core idea gate

These notes design what the spec leaves to the architect, for the three PRs of its "Delivery: three PRs": the foundation tenant table and its migrations, the entry contract, the roots and the marks, the node lists of the board, the server action and its door, what `BusinessView` gains, and the props of the board and the four node views. They use the spec's default for each of its twelve open questions (G1, ORV-291 comment 10736); section 11 names where another answer changes the design.

**What is real.** Nothing here is built yet. Every file, table and test below is a design for the builder. No part calls a model, in any PR; no test reaches a model or the internet.

**The base.** PR 1 builds on ORV-285 PR 1 (PR 226) once it is in `develop`: `business/positioning.ts` (`positioningGate`, `StoredChoice`), `view.ts` with `PositioningView`, `packages/auth/src/positioning.ts` (`readPositioning`), `business.ts` (`open` returns `positioning`), `apps/web/app/business/positioning-actions.ts`, `[projectId]/ProjectBoard.tsx`, and the migrations 0012 and 0013. The code read for these notes is PR 226 at head `c651a8e`.

**One rule holds the design together.** Nothing about a mark is stored. The table holds what the person did (an entry per act); every state, mark, derived value and control is computed from those rows and the positioning gate each time the view is built, by one engine function the view and the server door both call. So the view offers a control exactly when the door would accept the entry, and no stored row can disagree with the rule that reads it.

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Question | Choice | Why not the other way | Confirmed by |
| --- | --- | --- | --- | --- |
| D1 | Where the entry contract lives | `packages/intent-engine/src/business/foundation.ts`: `checkEntry`, `EntryInput`, `EntryProblem`, `storedEntrySchema`, the bounds. Shared by the client wrapper, the node views, the action and the service | The views must refuse rows 3, 19 and 27's invalid cases with no call, and the screen package cannot import `apps/web`; the engine sits below both, as `positioning.ts` does (ORV-285 tech notes D1) | `foundation.test.ts` |
| D2 | Where the roots, the marks and the four node rules live | `packages/intent-engine/src/business/foundation-marks.ts`: `FOUNDATION_NODES`, `FOUNDATION_REQUIRES`, `FOUNDATION_EDGES`, `foundationRoots`, `foundationMarks`, `ownStatus`, `blockCause`, `entryAllowed`, `coreIdeaGate`, `axisValueOf`, `axisPointOf` | One pure function both the view and the door call (the rule above); a separate file keeps the contract file small and lets ORV-126 slice 3 take the marks over with the same node ids | `foundation-marks.test.ts` |
| D3 | `BUSINESS_NODES` and `BUSINESS_EDGES` grow, or a second list | A second list. `FOUNDATION_NODES` and `FOUNDATION_REQUIRES` (edges derived as `FOUNDATION_EDGES`) grow per PR; `BUSINESS_NODES`, `BUSINESS_FIELDS` and `BUSINESS_EDGES` do not change | `placeIntake` and `nodeStates` map over `BUSINESS_NODES` and the spec keeps both unchanged; a business node's view entry is typed by intake fields and readings, which the four nodes do not have. The board concatenates the two lists | `business-graph.test.ts` "foundation edges"; `place.test.ts` as it stands |
| D4 | How entries are stored | One table `business_foundation_entry`: one row per act, insert only, keyed to the project (not the intake), the payload as checked JSON. The CHECKs hold the six node and kind pairs of all three PRs from PR 1 | An entry outlives a new intake (W4 case 5 keeps a given personality when positioning goes stale), so it belongs to the project. Typed columns would make eight sparse columns across four nodes; a checked `jsonb` payload is the shape `business_reading.evidence` already uses. Taking all six pairs in PR 1 means PRs 2 and 3 add no migration, so the migration number is settled once | `access.test.ts`; `foundation.integration.test.ts` |
| D5 | Given stays given, one skip per node | UNIQUE (`project_id`, `node`, `kind`). With the "Allowed when" column it permits exactly the histories `foundation-entry-1` allows: a skip, then a given or written; never a second of either | The door refuses these already; the index makes two tabs and a direct call fail in the database too (AGENTS.md: logic comes from the domain, not from hidden controls) | `access.test.ts` "one entry per kind" |
| D6 | Newest wins under concurrent requests | The save transaction locks the project row (`select ... for update`), then reads, checks and inserts; `created_at` defaults to `clock_timestamp()`, the time of the insert after the lock | Without the lock a skip and a given racing on an empty node could both pass the check; with `now()` (the transaction's start) the later row could carry the earlier time and hide the given entry. The app role holds UPDATE on `project` (migration 0001), which `for update` needs, as `directions.ts` `approve` does | `foundation.integration.test.ts` "newest wins, in lock order" |
| D7 | Where the database code lives | `packages/auth/src/foundation.ts`: `foundationService(deps).enter` and `readFoundation(tx, workspaceId, projectId)`, which `businessService.open` calls. Every call inside `withWorkspace` | One door to audit (ADR 0002); `business.ts` stays the intake's file and `positioning.ts` the choice's | `foundation.integration.test.ts` |
| D8 | One action or several | One: `enterFoundation(input: unknown)` in `apps/web/app/business/foundation-actions.ts`, route `business/enterFoundation`. The node and the kind are in the checked input | The door's six steps are the same for every node and kind; one route is one log name and one place for `security` to read. On ok the client calls `router.refresh()`, and the page builds the view again through `loadProject` (ORV-285 D6) | `foundation-actions.test.ts`; `log.test.ts` |
| D9 | The limit | `LIMITS.write`, reused; with no session `LIMITS["signed-out"]` by IP, as `choosePositioning` | The spec reuses the `write` limit with no new number | `foundation-actions.test.ts` "entry door" |
| D10 | `BusinessView` | Gains `foundation: FoundationNode[]`, the nodes of `FOUNDATION_NODES` in fill order, each a union arm by `id` with its state key, mark lists, content and controls (section 6) | The view keeps holding keys and values only, so a language switch redraws with no second load (row 10) | `view.test.ts` |
| D11 | The screens | Four node views in their own files beside a shared `foundation-view.tsx`; the board dispatches by id; `ProjectBoard.tsx` gains `onEnter` with its own transition. No shared component changes | `business-node-view.tsx` is 468 lines and typed by intake fields; a file per node keeps each PR's screen diff to its own node | The stories; `ProjectBoard.test.tsx` |
| D12 | The reused `business.positioning.*` keys | Reused as the spec says (section 10 lists what a rename would touch) | A rename touches PR 226's engine type, view, catalog, stories and strings test for no change of copy | `business-strings.test.ts` |
| D13 | New dependency, env var, service or model job | None | | Section 14 |

## 2. Where each part lives

<!-- prettier-ignore -->
| Path | Holds | PR |
| --- | --- | --- |
| `packages/intent-engine/src/business/foundation.ts` | The entry contract (section 3): `checkEntry`, `EntryInput`, `EntryRequest`, `EntryProblem`, `storedEntrySchema`, `StoredEntry`, `newestByNode`, `WORKING_NAME_MAX` (60), `CORE_IDEA_MAX` (300), `AXIS_VALUES` | 1, arms added in 2 and 3 |
| `packages/intent-engine/src/business/foundation-marks.ts` | Section 5: the node list, the requires, roots, marks, own status, block cause, allowed, the architecture rule, the core idea gate, the axis point mapping | 1, nodes added in 2 and 3 |
| `packages/intent-engine/src/business/view.ts` | `BusinessView.foundation` and `SavedBusiness.foundation` (section 6) | 1, 2, 3 |
| `packages/intent-engine/src/business/questions.ts` | `PROXY_QUESTIONS` gains `identity-frame.proxy.person`, `identity-frame.proxy.never` (PR 1) and `core-idea.proxy.remember` (PR 3); a new `START_QUESTIONS` holds `situation.sub-brands` (PR 2) | 1, 2, 3 |
| `packages/intent-engine/src/index.ts` | Exports the two new modules | 1 |
| `packages/db/src/schema/business.ts` | `businessFoundationEntry` | 1 |
| `packages/db/src/schema/workspace.ts`, `classification.ts` | `TENANT_TABLES` and `CLASSIFICATION` entries | 1 |
| `packages/db/migrations/NNNN_foundation_entry.sql`, `NNNN_foundation_entry_access.sql`, `meta/` | The table; its grants and row security (section 4.2) | 1 |
| `packages/auth/src/foundation.ts` | `foundationService`, `readFoundation` | 1 |
| `packages/auth/src/business.ts` | `open` returns `foundation`; `BusinessError.reason` gains `out-of-order` | 1 |
| `packages/auth/src/log.ts`, `index.ts` | Route `business/enterFoundation`; the exports | 1 |
| `apps/web/app/business/foundation-actions.ts` | `enterFoundation` | 1 |
| `apps/web/app/business/data.ts` | `loadProject` passes `opened.foundation` to `toBusinessView` | 1 |
| `apps/web/app/business/[projectId]/ProjectBoard.tsx` | The `foundation` controls and `onEnter` | 1 |
| `packages/design-system/src/examples/foundation-view.tsx` | `FoundationNodeView` (dispatch by id), the shared state line, mark lines, editor buttons and failure line | 1 |
| `packages/design-system/src/examples/identity-frame-view.tsx` | The Brand personality view and editor | 1 |
| `packages/design-system/src/examples/architecture-view.tsx`, `name-view.tsx` | The Brand architecture and Name views | 2 |
| `packages/design-system/src/examples/core-idea-view.tsx` | The Core idea view | 3 |
| `packages/design-system/src/examples/business-board.tsx`, `business-graph.ts`, `business-text.ts` | The board renders and opens the foundation nodes; the graph takes both lists; titles, field names and the state and mark lines | 1, 2, 3 |
| `packages/design-system/src/examples/foundation-fixtures.ts`, `foundation.stories.tsx` | Labelled fixture projects and the stories the spec names | 1, 2, 3 |
| `packages/design-system/src/i18n/messages/en.ts`, `th.ts` | The keys of "Strings" with their PR | 1, 2, 3 |

## 3. The entry contract (`business/foundation.ts`)

**The input.** `checkEntry(input: unknown)` returns `{ ok: true, entry: EntryInput }` or `{ ok: false, problems: EntryProblem[] }` and never throws. The input is `{ projectId, node, kind, payload }`, strict at both levels: a discriminated union on `node`, each arm a discriminated union on `kind` (zod 4.6.6 nests them; checked for these notes: an unknown node fails at the path `node`, an unknown top-level key gives `unrecognized_keys` at the root).

```ts
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const projectId = z.string().regex(UUID);
// U+0000 is dropped, then the text is trimmed, as checkIntake does; the raw cap keeps a padded payload cheap.
const clean = (s: string) => s.replaceAll("\u0000", "").trim();
const required = (max: number) =>
  z.string().max(RAW_MAX_CHARS).transform(clean).pipe(z.string().min(1).max(max));
const optional = (max: number) =>
  z.string().max(RAW_MAX_CHARS).transform(clean).pipe(z.string().max(max)).optional();
const axisValue = z.union(AXIS_VALUES.map((v) => z.literal(v))); // 0, 25, 50, 75, 100 (W3)
const axes = z.object(Object.fromEntries(PERSONALITY_AXES.map((a) => [a, axisValue]))).strict();
const none = z.object({}).strict();
const at = <N extends string>(node: N) => ({ projectId, node: z.literal(node) });

const identityEntry = z.discriminatedUnion("kind", [
  z
    .object({
      ...at("identity-frame"),
      kind: z.literal("given"),
      payload: z
        .object({ axes, person: optional(ANSWER_MAX_CHARS), never: optional(ANSWER_MAX_CHARS) })
        .strict(),
    })
    .strict(),
  z.object({ ...at("identity-frame"), kind: z.literal("skipped"), payload: none }).strict(),
]);
// PR 2
const architectureEntry = z.discriminatedUnion("kind", [
  z
    .object({
      ...at("architecture"),
      kind: z.literal("answered"),
      payload: z.object({ subBrands: z.boolean() }).strict(),
    })
    .strict(),
]);
const nameEntry = z.discriminatedUnion("kind", [
  z
    .object({
      ...at("name"),
      kind: z.literal("given"),
      payload: z.object({ name: required(WORKING_NAME_MAX) }).strict(),
    })
    .strict(),
]);
// PR 3
const coreIdeaEntry = z.discriminatedUnion("kind", [
  z
    .object({
      ...at("core-idea"),
      kind: z.literal("written"),
      payload: z
        .object({ statement: required(CORE_IDEA_MAX), remember: optional(ANSWER_MAX_CHARS) })
        .strict(),
    })
    .strict(),
  z.object({ ...at("core-idea"), kind: z.literal("skipped"), payload: none }).strict(),
]);

const entryInputSchema = z.discriminatedUnion("node", [
  identityEntry /* , architectureEntry, nameEntry, coreIdeaEntry */,
]);
```

- **An optional answer empty after the trim is not given:** a last transform on each payload drops a key whose value is `""`, so a checked entry and a stored row never hold an empty or `undefined` optional key. `ANSWER_MAX_CHARS` (2,000) and `RAW_MAX_CHARS` (8,000) are `intake.ts`'s; `PERSONALITY_AXES` is `knowledge.ts`'s, unchanged.
- **`EntryProblem`** is `{ path: string; kind: "required" | "too-long" | "invalid" | "unknown-key" }`, the mapping of `checkChoice` (ORV-285 tech notes section 3) applied to the text paths `payload.person`, `payload.never`, `payload.remember`, `payload.name` and `payload.statement`: an unrecognised key gives one problem at its own path; `too_big` on a text path is `too-long`; `too_small` on a text path, or a missing value, is `required`; anything else is `invalid`. No problem carries a value. The mapper is written in `foundation.ts`, not shared with `positioning.ts`, so ORV-285's file does not change; joining the two is a later tidy.
- **`EntryRequest`** is `EntryInput` without `projectId`, distributed over the union, as `ChoiceRequest`.
- **Length** is counted in UTF-16 units, as `checkIntake` and W5; the table checks code points (`char_length`), which are never more.
- **Row 1's inputs give** (paths of the canonical test inputs): the first two parse; no `premium`, `payload.axes.premium` `required`; `warm` 60, `payload.axes.warm` `invalid`; `person` of 2,001, `payload.person` `too-long`; `skipped` with `payload: { axes }`, `payload.axes` `unknown-key`; `score` at the top level, `score` `unknown-key`; node `color`, `node` `invalid`. **Row 14:** `subBrands` false and true, the name "ORIVILO" and the 60 Thai characters parse; `subBrands` "no", `payload.subBrands` `invalid`; 61, `payload.name` `too-long`; white space only, `payload.name` `required`; `screened`, `payload.screened` `unknown-key`; `architecture` `skipped` and `name` `skipped`, `kind` `invalid`. **Row 25:** two parse; white space only, `payload.statement` `required`; 301, `payload.statement` `too-long`; `remember` of 2,001, `payload.remember` `too-long`; `skipped` with `payload: { statement }`, `payload.statement` `unknown-key`; `picked`, `kind` `invalid`; `draftId`, `draftId` `unknown-key`.

**The stored entry.** `storedEntrySchema` parses a row read back: `{ id, node, kind, payload, createdAt }`, the same arms with exact bounds and no transform (a stored text is already clean). A row that fails it is `invalid-stored`, as a choice is. `newestByNode(entries)` returns, per node, the first entry of a list ordered `created_at` desc, `id` desc, or null.

**The colour story's shape.** A given `payload.axes` is a full `Record<PersonalityAxis, 0 | 25 | 50 | 75 | 100>`, which `rules.ts`'s `personality` facts (`z.partialRecord(personalityAxisSchema, int 0..100)`) parse unchanged (open question 2, default (a)); `foundation.test.ts` pins it.

## 4. The table and its migrations

### 4.1 `business_foundation_entry` (PR 1)

<!-- prettier-ignore -->
| Column | Type | Null | Rule | Tag | Basis |
| --- | --- | --- | --- | --- | --- |
| `id` | text, primary key | no | `randomUUID()` on the server | internal | row-key |
| `workspace_id` | text | no | FK `organization.id`, on delete cascade | internal | workspace-key |
| `project_id` | text | no | FK (`project_id`, `workspace_id`) to `project` (`id`, `workspace_id`), cascade, through the existing `project_id_workspace_unique` | internal | row-key |
| `node` | text | no | CHECK in (`identity-frame`, `architecture`, `name`, `core-idea`) | internal | record |
| `kind` | text | no | CHECK (`node`, `kind`) in the six pairs of `foundation-entry-1` | internal | record |
| `payload` | jsonb | no | CHECKs below; parsed by `storedEntrySchema` before every insert and after every read | personal | free-text |
| `created_by` | text | no | a plain id, as `business_intake.created_by` | personal | user-ref |
| `created_at` | timestamp with time zone | no | default `clock_timestamp()` (D6) | internal | record |

- CHECK `business_foundation_entry_pair`: `(node, kind) in (('identity-frame','given'), ('identity-frame','skipped'), ('architecture','answered'), ('name','given'), ('core-idea','written'), ('core-idea','skipped'))`.
- CHECK `business_foundation_entry_payload_shape`: `jsonb_typeof(payload) = 'object'` and `(kind = 'skipped') = (payload = '{}'::jsonb)`.
- CHECK `business_foundation_entry_text`: each text key, where present, is a JSON string within its bound in code points: `payload->>'person'`, `'never'` and `'remember'` 1 to 2,000; `'name'` 1 to 60; `'statement'` 1 to 300. Written as `(payload ? 'name') is false or (jsonb_typeof(payload->'name') = 'string' and char_length(payload->>'name') between 1 and 60)`, one clause per key. The axes and the boolean are held by the app schema; the database holds the text bounds, so no row can carry a long text past a missed check.
- UNIQUE `business_foundation_entry_one_per_kind` (`project_id`, `node`, `kind`) (D5).
- Index `business_foundation_entry_workspaceId_idx` on `workspace_id`; index `business_foundation_entry_project_created_idx` on (`project_id`, `created_at`).
- No model, adapter or prompt column: no entry row can hold a model id (row 35).

### 4.2 The migrations, named by content

- **`NNNN_foundation_entry.sql`** (drizzle generated, `pnpm --filter @orivilo/db generate`): the table, its FKs, checks and indexes.
- **`NNNN_foundation_entry_access.sql`** (hand written, the pattern of `0013_positioning_choice_access.sql`): `GRANT SELECT, INSERT ON "business_foundation_entry" TO orivilo_app`; `ENABLE ROW LEVEL SECURITY`; the `workspace_rows` policy with `USING` and `WITH CHECK` on `current_setting('app.workspace_id', true)`; `REVOKE ALL ... FROM PUBLIC` and from `anon`, `authenticated` and `service_role` when they exist.
- **The numbers are taken at build time.** PR 226 holds 0012 and 0013; ORV-285 PR 2 plans 0014 and 0015 for its draft table. Whichever story merges first takes the next two free numbers in `develop`; the builder reads `packages/db/migrations/` and `meta/_journal.json` on the branch base and numbers these two after the last. Nothing else in the design depends on the number.
- `TENANT_TABLES` gains `business_foundation_entry`; `CLASSIFICATION` gains `businessFoundationEntry` with the tags above; `classification.test.ts` "pins the secret and personal columns" gains its two personal columns.

## 5. Roots, marks and the four node rules (`business/foundation-marks.ts`)

### 5.1 The lists

```ts
/** Fill order. PR 2 adds "architecture" and "name"; PR 3 adds "core-idea". */
export const FOUNDATION_NODES = ["identity-frame"] as const;
export type FoundationNodeId = (typeof FOUNDATION_NODES)[number];
export type MarkRef = "situation" | "positioning" | FoundationNodeId;

/** ORV-126 requires, in ORV-126 order. One entry per node of FOUNDATION_NODES. */
export const FOUNDATION_REQUIRES = {
  "identity-frame": ["positioning"],
  // PR 2: architecture: ["situation", "positioning"], name: ["positioning", "architecture"],
  // PR 3: "core-idea": ["positioning", "identity-frame"],
} as const satisfies Record<FoundationNodeId, readonly MarkRef[]>;

/** `[from, to]`, one per require: 1, 4 and 6 edges after PRs 1, 2 and 3 (W2 less ORV-281's six). */
export const FOUNDATION_EDGES = FOUNDATION_NODES.flatMap((to) =>
  FOUNDATION_REQUIRES[to].map((from) => [from, to] as const),
);

/** ORV-126 node numbers, for the sort order of every mark list. */
const NUMBER: Record<MarkRef, number> = {
  situation: 1,
  positioning: 6,
  "identity-frame": 7 /* , architecture: 8, name: 9, "core-idea": 11 */,
};
```

Each list grows with its PR, so the type `FoundationNodeId` never names a node whose catalog title is not there yet, and `NODE_KEY` in `business-text.ts` stays a complete record. A node's requires only name nodes before it in fill order, so a node on the board never rests on one that is not.

### 5.2 `foundationRoots` (`foundation-roots-1`)

`foundationRoots(gate: { state: GateState; skipped: boolean })` returns `{ situation: "done", positioning }` with `positioning` `"done"` for `given` and `confirmed`, `"skipped"` for `open` with `skipped`, and `"open"` for every other state (`open`, `open` with `stale`, `awaiting-choice`). `situation` is `"done"` on every saved project (departure 1). The gate comes from `positioningGate` with `draftOfNewest: false`: the foundation reads no draft, and `awaiting-choice` and `open` count the same, so ORV-285 PR 2 changes no root.

### 5.3 `ownStatus` (the node rules, before the marks)

From the newest entry of each node (`newestByNode`):

<!-- prettier-ignore -->
| Node | Newest entry | Own status | Rule |
| --- | --- | --- | --- |
| `identity-frame` | `given` / `skipped` / none | `given` / `skipped` / `open` | `identity-frame-1` |
| `architecture` | `answered`, `subBrands` false / `answered`, true / none | `derived` / `open` / `open` | `architecture-derive-1` |
| `name` | `given` / none | `given` / `open` | `working-name-1` |
| `core-idea` | `written` / `skipped` / none | `given` / `skipped` / `open` | `core-idea-gate-1` |

### 5.4 `foundationMarks` (`foundation-marks-1`)

`foundationMarks(roots, own)` returns `Record<FoundationNodeId, FoundationResult>` with

```ts
export type FoundationResult = {
  status: "given" | "derived" | "blocked" | "open";
  skipped: boolean;
  blockedBy: MarkRef[];
  provisionalOn: MarkRef[];
  unchecked: MarkRef[];
};
```

It is W4's code as TypeScript. A root is held as a result: `done` as `given` with empty lists, `skipped` as `open` with `skipped`, `open` as `open`. Then for each node `n` in `FOUNDATION_NODES` order, with three sets `sk`, `bl` and `un`, for each `r` of `FOUNDATION_REQUIRES[n]`, with `q` the result of `r`:

1. `q` open and skipped: add `r` to `sk`;
2. `q` blocked: add each of `q.blockedBy` to `bl` (the causes travel, not the blocked node: W4 case 3 gives `name` `blockedBy=positioning`);
3. `q` open: add `r` to `bl`;
4. `q` given or derived: for each `x` of `q.provisionalOn` and `q.unchecked`, add `x` to `sk` when `x`'s result is open and skipped, else to `un`.

Then: own `given` gives `given` with `unchecked` = `sk` ∪ `bl` ∪ `un`; else a non-empty `bl` gives `blocked` with `blockedBy` = `bl`; else the own status (`derived`, `open`, or `open` with `skipped` for own `skipped`) with `provisionalOn` = `sk` and `unchecked` = `un`. Each list is sorted by `NUMBER`, each node once. No mark is stored.

### 5.5 `blockCause` and `entryAllowed` (the "Allowed when" column)

- `blockCause(node, roots, own)` is `foundationMarks(roots, { ...own, [node]: "open" })[node].blockedBy`: the spec's "as if it held no entry", computed by the same function.
- `entryAllowed(entry, { roots, newest })`, with `own` from `ownStatus(newest)`:

<!-- prettier-ignore -->
| Entry | Allowed when | PR |
| --- | --- | --- |
| `identity-frame` `given` | `blockCause` empty and `newest["identity-frame"]?.kind !== "given"` | 1 |
| `identity-frame` `skipped` | `blockCause` empty and `newest["identity-frame"] === null` | 1 |
| `architecture` `answered` | `newest.architecture === null` | 2 |
| `name` `given` | `newest.name === null` | 2 |
| `core-idea` `written` | `blockCause` empty and `newest["core-idea"]?.kind !== "written"` | 3 |
| `core-idea` `skipped` | `blockCause` empty and `newest["core-idea"] === null` | 3 |

`foundationState(gate, entries)` bundles `roots`, `newest`, `own` and `results` once, for the view and the door.

### 5.6 The architecture rule and the core idea gate

- **`architecture-derive-1`.** `derivedArchitecture(result)` returns `{ key: "business.architecture.single", rule: "architecture-derive-1" }` only when the result is `derived`; while it is `blocked` the stored answer shows and no value does (row 17). Nothing derived is stored.
- **`coreIdeaGate(result)`** returns the row of `core-idea-gate-1`: `given` (state key `agreed`, gate line `business.coreIdea.gatePassed`, label `business.positioning.by.own`) for a `written` entry; else `blocked` (state `waiting`), `open` with `skipped` (state `skipped`) or `open` (state `empty`), each with the gate line `business.state.gate`.
- **The axis points.** `axisValueOf(point: 1..5)` is `(point - 1) * 25` and `axisPointOf(value)` is `value / 25 + 1` (W3). The editor holds points; the entry and the row hold values.

## 6. What `BusinessView` gains (`view.ts`)

`SavedBusiness` gains `foundation?: StoredEntry[]` (absent is no entry). `toBusinessView` builds `foundation` from it and the positioning gate it already computes in `positioningOf`, through `foundationState`. The business nodes, `positioning` and `reading` are built exactly as before.

```ts
type FoundationFieldKey =
  | "person"
  | "never"
  | "personality"
  | "subBrands"
  | "architecture"
  | "workingName"
  | "remember"
  | "coreIdea"; // business.field.*
type FoundationStateKey =
  "given" | "agreed" | "derived" | "waiting" | "skipped" | "empty" | "notInVersion"; // business.state.*

type FoundationBase = {
  result: FoundationResult;
  /** The state line, by the result table of foundation-marks-1 (and core-idea-gate-1 on core-idea). */
  state: FoundationStateKey;
  /** `{nodes}` of business.state.waiting: `result.blockedBy` while `state` is `waiting`, else empty. */
  waitingFor: MarkRef[];
  /** The view's mark lines, already filtered by the result table: shown only when not empty. */
  restsOn: MarkRef[]; // with strategy.provisional and business.marks.restsOn (result `derived`)
  unchecked: MarkRef[]; // with business.marks.unchecked (result `given` or `derived`)
  /** The names the card lists and the order the view shows them in; the designer may reorder at G2. */
  fields: FoundationFieldKey[];
};

export type FoundationNode =
  | (FoundationBase & {
      id: "identity-frame";
      person: string | null;
      never: string | null;
      axes: null | Array<{
        axis: PersonalityAxis;
        value: 0 | 25 | 50 | 75 | 100;
        point: 1 | 2 | 3 | 4 | 5;
      }>;
      controls: Array<"describe" | "skip">;
    })
  | (FoundationBase & {
      // PR 2
      id: "architecture";
      subBrands: boolean | null;
      value: null | { key: "business.architecture.single"; rule: "architecture-derive-1" };
      controls: Array<"answer">;
    })
  | (FoundationBase & { id: "name"; name: string | null; controls: Array<"give"> }) // PR 2
  | (FoundationBase & {
      // PR 3
      id: "core-idea";
      gate: "blocked" | "open" | "given";
      skipped: boolean;
      gatePassed: boolean;
      statement: null | { text: string; label: "business.positioning.by.own" };
      remember: string | null;
      controls: Array<"writeOwn" | "skip">;
    });
```

- **State keys**, by the result table: `given` gives `given` (`agreed` on `core-idea`); `derived` gives `derived`; `blocked` gives `waiting`; `open` with `skipped` gives `skipped`; `open` gives `empty`, or `notInVersion` on `architecture` with a stored "yes".
- **Mark lines:** `unchecked` is `result.unchecked` when the result is `given` or `derived`, else empty; `restsOn` is `result.provisionalOn` when the result is `derived`, else empty. A `blocked`, `skipped` or `open` result shows none, though its result keeps its lists for the tests.
- **Content** shows from the newest entry: the personality's answers and axes while it is `given`; the stored sub-brands answer in every state with an answer, and the derived value only with `derived`; the name with any entry; the statement and the `remember` answer with a `written` entry. Labels are keys the view resolves (`foundation-honest-1`); the engine holds no catalog text.
- **Controls** come from `entryAllowed`, so the view offers a control exactly when the door accepts its entry: `describe` and `skip` on `identity-frame`; `answer` on `architecture`; `give` on `name`; `writeOwn` and `skip` on `core-idea`. `view.test.ts` "controls match the door" pins it over every fixture state.
- **Fields per node:** `identity-frame` `person`, `never`, `personality`; `architecture` `subBrands`, `architecture`; `name` `workingName`; `core-idea` `remember`, `coreIdea`.

## 7. The server action (`apps/web/app/business/foundation-actions.ts`)

`enterFoundation(input: unknown)`, route `business/enterFoundation`, one `atBoundary`, the shape of `choosePositioning` (its `CODE_OF`, `ERROR_OF_DENIED`, `Failed` and `Outcome` of `directions/actions.ts`). It logs closed words only: no answer, name, statement, axis value or id reaches a line or an error body; an `EntryProblem` carries a path and a kind.

<!-- prettier-ignore -->
| Step (`foundation-door-1`) | Code | On refusal |
| --- | --- | --- |
| 1. Session | `auth().api.getSession({ headers })` | Read again at step 3 |
| 2. Approved list | `mayRead(session.user.email)`, only when a session exists | `forbidden`, nothing counted, no address |
| 3. `write` limit | `limiter().consume(LIMITS.write, { user })`; with no session `LIMITS["signed-out"]` by `subjectFromHeaders`, then `signed-out` | `rate-limited` with `retryAfter`, `RATE_LIMITED`; a store failure is `failed` with `SERVICE_UNAVAILABLE` |
| 4. Entry check | `checkEntry(input)` | `EntryRefused`: `invalid-input`, `INVALID_INPUT`, with `problems`; nothing saved |
| 5. Project, intake, positioning, entries, allowed | `foundationService.enter(h, workspaceId, entry)` (section 8), the active workspace from the session, never from the client | `not-found` answers `not-found`, `NOT_FOUND`, one body for another workspace's project and an unknown id; `out-of-order` answers `invalid-input` with no `problems`; `Denied` maps by `ERROR_OF_DENIED` |
| 6. Save | the insert in the same transaction | `not-saved` answers `failed` |

Returns `{ ok: true, value: { node, kind } }`. The file is not under `apps/web/**/actions/**`, so the `security` envelope names it, as for `positioning-actions.ts`.

## 8. The service (`packages/auth/src/foundation.ts`)

- **`readFoundation(tx, workspaceId, projectId)`**: `select * from business_foundation_entry where project_id = $p and workspace_id = $ws order by created_at desc, id desc limit 24`, each row parsed by `storedEntrySchema` (a failure throws `invalid-stored`). The unique index bounds a project to six rows; the limit is a guard. `businessService.open` calls it inside its transaction after `readPositioning`, and `OpenedProject` gains `foundation: StoredEntry[]`. Opening writes nothing, consumes no limit and calls no model (rows 12 and 36).
- **`enter(headers, workspaceId, raw)`**: `checkEntry(raw)` again (`invalid-input`); then one `withWorkspace(..., "member", ...)` transaction that
  1. selects the project by id and workspace `for update` (none: `not-found`), the lock of D6;
  2. reads its newest intake (`created_at` desc, `id` desc; none: `not-found`), `readPositioning` for the newest choice, and `readFoundation`;
  3. builds `positioningGate({ newestIntakeId, choice, draftOfNewest: false })` and `foundationState(gate, entries)`, and refuses with `out-of-order` when `entryAllowed` is false;
  4. inserts `{ id: randomUUID(), workspaceId, projectId, node, kind, payload, createdBy: access.userId }`, `created_at` from the column default; an insert failure is `not-saved` with a closed message, so no driver text that holds the payload reaches a caller's log.

  It returns `{ node, kind }`. If ORV-285 PR 2 has changed `readPositioning`'s parameters by then, the service passes what that form takes; it needs only the newest choice.

- `BusinessError.reason` gains `out-of-order`: an entry its node's state does not allow now (`foundation-entry-1`, "Allowed when").

## 9. The screens

### 9.1 The board (`business-board.tsx`, `business-graph.ts`, `business-text.ts`)

- `BusinessBoardScreenProps` gains `foundation?: Omit<FoundationControls, "editor" | "onEditor">`. Absent, the views show content and labels with no control (read-only stories).
- `ReadyBoard` holds `foundationEditor` beside `editor` and finds the opened node in `view.nodes` or `view.foundation`. A foundation node opens `FoundationNodeView` in the same viewer dialog; the dialog's description is the core idea's gate line on `core-idea`, none on the other three. Closing the viewer calls both `onDismiss`.
- `renderBody` for a foundation node shows the state line (`foundationStateLine`), the field names (`m.business.field[key]`) and, on `core-idea`, its gate line; never an answer or a value.
- `boardGraphOf` builds nodes from `view.nodes` then `view.foundation`, and edges from `BUSINESS_EDGES` then `FOUNDATION_EDGES` filtered to targets in `view.foundation`. `portsOf` gives distinct `from-<source>` input handles to every node with more than one source (today only `positioning`; then `architecture`, `name` and `core-idea`), in place of the test `id === "positioning"`; the five business nodes' ports do not change.
- `BUSINESS_POSITIONS` is typed by `BusinessNodeId | FoundationNodeId` and gains a position per new node, to the right of Positioning (`x` 1400 and 1872 are placeholders); the positions and the card at rest are the designer's at G2.
- `business-text.ts`: `NODE_KEY` gains `identityFrame` (PR 1), `architecture` and `name` (PR 2), `coreIdea` (PR 3). New `foundationStateLine(m, locale, node)` fills `business.state.waiting` and the mark lines' `{nodes}` with `nodeTitle` of each ref, joined by `new Intl.ListFormat(DATE_TAGS[locale], { type: "conjunction" })`.

### 9.2 The node views and their props

```ts
/** The open editor. Held by the board, so it stays while the viewer closes and opens; one at a time. */
export type FoundationEditor =
  | {
      node: "identity-frame";
      person: string;
      never: string;
      axes: Partial<Record<PersonalityAxis, 1 | 2 | 3 | 4 | 5>>;
    }
  | { node: "architecture"; subBrands: boolean | null } // PR 2: the inline choice, no Cancel
  | { node: "name"; name: string } // PR 2
  | { node: "core-idea"; remember: string; statement: string } // PR 3
  | null;

export interface FoundationControls {
  /** A request is running: its button shows `loading` with business.positioning.saving, every other button is inert. */
  pending: "saving" | null;
  /** What the server refused, by field path; a new value moves focus to the first field it names. */
  problems?: EntryProblem[] | null | undefined;
  /** A line already resolved by the caller (signed out, rate limited, failed), kept under the controls. */
  failure?: string | undefined;
  /** Called with an entry the view has checked; the caller checks again and calls the action. */
  onEnter: (entry: EntryRequest) => void;
  /** Cancel, or the viewer closing: drop the last outcome. */
  onDismiss?: (() => void) | undefined;
  editor: FoundationEditor;
  onEditor: (next: FoundationEditor) => void;
}

export interface FoundationNodeViewProps {
  node: FoundationNode;
  heading?: boolean | undefined; // as BusinessNodeView
  controls?: FoundationControls | undefined;
}
```

- `FoundationNodeView` (in `foundation-view.tsx`) renders the shared head (state line with `role="status"`, mark lines) and dispatches to `IdentityFrameView`, `ArchitectureView`, `NameView` or `CoreIdeaView`, each taking `{ node: Extract<FoundationNode, { id: ... }>; controls?: FoundationControls }`. The shared editor buttons and failure line live beside it, so the four views behave as ORV-285 `positioning-choice-1` "The editors": Cancel saves nothing, clears the editor and returns focus to its opener; while `pending` both buttons are inert and the pressed one shows `business.positioning.saving`.
- **Each view checks before it calls `onEnter`.** The personality editor shows `business.identity.axesRequired` while any of the five axes has no point and makes no call; then `checkEntry({ ...request, projectId: NO_PROJECT })` maps a `too-long` on a text path to `business.intake.tooLong` with its `{max}` (2000, 60 or 300) and a `required` to the view's own line (`business.name.required`, `business.coreIdea.statementRequired`); architecture with no choice shows `business.architecture.choiceRequired`. Text and points stay through every refusal (rows 3, 19 and 27).
- **Controls** render from `node.controls` only, so no view decides a state. Every name, answer and statement is a text node inside `bdi`, `whitespace-pre-wrap`, never HTML and never a link (rows 8, 22 and 33). Scales use `RadioGroup` (one per axis, named by `business.identity.axisLegend`, items "n of 5"); text uses `Field` with `Input` or `Textarea`. No shared component changes; the layout is the designer's at G2.

### 9.3 The wrapper (`ProjectBoard.tsx`)

A second `useTransition` and a second last-outcome state hold the foundation's requests, so a foundation save never shows the positioning section busy. `onEnter(request)` returns while pending; runs `checkEntry({ ...request, projectId })` and keeps its problems with no call when it fails; else calls `enterFoundation(checked.entry)` in the transition and, on ok, `router.refresh()` inside it. Lines resolve at render as `failureOf` does now: `invalid-input` with `problems` goes to the fields; `invalid-input` without, `saved.errors.failed`; `rate-limited` through `errorLine` with the wait; `forbidden`, `business.notAllowed`; a rejected call, `saved.errors.failed`. `page.tsx` does not change.

## 10. The reused string keys

**Default, the spec's choice: reuse.** The four views read `business.positioning.writeOwn`, `.cancel`, `.saving` and `.by.own` as they are, with `strategy.skip` and `business.state.agreed`. No file of PR 226 changes for them.

**If the owner wants neutral keys** (for example `business.editor.writeOwn`, `business.editor.cancel`, `business.editor.saving`, `business.by.own`), the rename touches: `packages/design-system/src/i18n/messages/en.ts` and `th.ts`; `examples/business-node-view.tsx` (`PositioningSection`); `packages/intent-engine/src/business/view.ts` (the `PositioningView.statement.label` union names `business.positioning.by.own`) and `view.test.ts`; `i18n/business-strings.test.ts` ("positioning gate, strings"); `examples/business-board.stories.tsx` where plays read those lines; and, in docs, ORV-285's spec "Strings" and design notes. It is best done as its own small PR after PR 226 merges and before this story's PR 3, so the foundation views are written once against the new names.

## 11. The spec's open questions: where another answer changes the design

<!-- prettier-ignore -->
| # | Default used | What another answer changes |
| --- | --- | --- |
| 1 | (a) drafts in later stories | (b) a fourth PR: a `core-idea-draft` job with its adapter, prompt, evaluation set and `AI_MODELS` row, an ADR 0009 addition; drafts stored as ORV-285's `business_draft` rows with their own job name; `core-idea` gains `picked` and `edited` kinds with `draftId` and `option`, so the table's pair CHECK, the payload checks and `storedEntrySchema` change (a migration); the five AI labels of `foundation-honest-1` start to show. (c) adds the same for `identity-frame`, where the payload would carry axis values a model proposed |
| 2 | (a) five-point scales | (b) a slider: `axisValue` becomes any integer 0 to 100, the editor a slider with an unset state, `axisPointOf` and the "n of 5" line go; the table does not change. (c) paired choices: the payload stores choice ids, a rule maps them to values, new copy. (d) a model job, as question 1 (b) |
| 3 | (b) wait while a block cause exists | (a) `entryAllowed` drops `blockCause` for `identity-frame` and `core-idea`, the view offers their controls in every state without an entry; rows 5 and 29 flip; the marks do not change (a given value lists the gap under `unchecked`). (c) `foundationRoots` counts a skipped positioning as open for `entryAllowed` only |
| 4 | (a) the Name view, at any time | (b) the intake: `intake.ts`, `business_intake` (a column and a migration) and ORV-281's `intake-fields-1`; no `name` entries in this table. (c) the Name editor gains a one-press prefill from the project name; the saved entry is still the text the person sends, so the contract does not change |
| 5 | (a) the same board | (b) a second board: a new route `/business/[projectId]/foundation` with its own graph from `view.foundation`, a link on the business board; the engine does not change. (c) a list under the board: no graph change for the four nodes |
| 6 | (a) `situation` done | (b) `foundationRoots` returns `situation: "open"` until ORV-126 slice 2: `architecture` and `name` are blocked on every project; rows 15 to 20 change |
| 7 | (a) marks start at positioning | (b) `MarkRef` and `foundationRoots` gain `business-core`, `audience` and `competitive-frame` with a status from `nodeStates`, and positioning passes its requires on; `foundationMarks` keeps its algorithm, its input grows, and most `unchecked` lists grow |
| 8 | (a) the architecture view | (b) the intake, as question 4 (b) |
| 9 | (a) no change once given | (b) the unique index of D5 goes (a migration), `entryAllowed` lets `identity-frame` and `name` be given again, and `coreIdeaGate` compares the `written` entry's time with the newest personality entry to reopen the gate |
| 10 | (a) 300 | (b) 120: `CORE_IDEA_MAX` and the table's `statement` clause; a migration if PR 1's migration has already run on staging, else only the number in it |
| 11 | (a) not in this version | (b) the `answered` payload gains the number of units, `derivedArchitecture` gains "endorsed" and "house of brands", new copy, the table's text CHECK unchanged |
| 12 | (a) the lede unchanged | (b) one string and a choice in `ReadyBoard` on `gatePassed` of positioning or the core idea; no data change |

## 12. Build order

Lint, typecheck, test and `format:check` in every builder `done_when`. Each task is one module with its tests; its file list is its `write_set`. `security` reviews each PR (ADR 0015 decision 2: `packages/intent-engine/**`, `packages/auth/**`, `packages/db/**`; `foundation-actions.ts` named in the envelope). PR 1 starts after PR 226 is in `develop`; PRs 2 and 3 each start after the one before.

### PR 1, the brand personality (rows 1 to 13)

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers | Tests |
| --- | --- | --- | --- | --- |
| A1 engine | `packages/intent-engine/src/business/foundation.ts`, `foundation.test.ts`, `foundation-marks.ts`, `foundation-marks.test.ts`, `view.ts`, `view.test.ts`, `questions.ts`, `questions.test.ts`, `src/index.ts` | Sections 3, 5 and 6 for `identity-frame`; the two proxy questions | This file sections 3, 5, 6; the spec's rules and W3, W4; `business/positioning.ts`; `business/view.ts`; `business/intake.ts`; `knowledge.ts`; `rules.ts` | T1 to T8, T26 |
| A2 storage and server | `packages/db/src/schema/business.ts`, `workspace.ts`, `classification.ts`, `classification.test.ts`, `migrations/NNNN_foundation_entry.sql`, `migrations/NNNN_foundation_entry_access.sql`, `migrations/meta/`, `src/access.test.ts`; `packages/auth/src/foundation.ts`, `foundation.integration.test.ts`, `business.ts`, `log.ts`, `log.test.ts`, `index.ts`; `apps/web/app/business/foundation-actions.ts`, `foundation-actions.test.ts`, `data.ts`, `data.test.ts` | Sections 4, 7 and 8; the loader passes `foundation` | This file sections 4, 7, 8; the spec's `foundation-door-1`, `foundation-saved-1`; `0013_positioning_choice_access.sql`; `packages/auth/src/positioning.ts`; `positioning-actions.ts`; `.claude/rules/security.md` | T9 to T19 |
| A3 screens | `packages/design-system/src/examples/foundation-view.tsx`, `identity-frame-view.tsx`, `business-board.tsx`, `business-graph.ts`, `business-graph.test.ts`, `business-text.ts`, `foundation-fixtures.ts`, `foundation.stories.tsx`, `business-board.stories.tsx`, `src/i18n/messages/en.ts`, `th.ts`, `src/i18n/business-strings.test.ts`; `apps/web/app/business/[projectId]/ProjectBoard.tsx`, `ProjectBoard.test.tsx` | Section 9 for `identity-frame`; PR 1's copy | This file sections 6, 9, 10; the spec's `identity-frame-1`, `foundation-board-1`, "Strings"; the designer's notes; `business-node-view.tsx`; `business-board.tsx`; `ProjectBoard.tsx` | T20 to T25; `check-i18n`; `messages.test.ts` |

### PR 2, the architecture and the working name (rows 14 to 24)

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers | Tests |
| --- | --- | --- | --- | --- |
| B1 engine and door | `packages/intent-engine/src/business/foundation.ts`, `foundation.test.ts`, `foundation-marks.ts`, `foundation-marks.test.ts`, `view.ts`, `view.test.ts`, `questions.ts`, `questions.test.ts`; `packages/auth/src/foundation.integration.test.ts`; `apps/web/app/business/foundation-actions.test.ts` | The `architecture` and `name` arms, nodes, requires, `derivedArchitecture`, `START_QUESTIONS`; the door rows proven on the unchanged service and action | This file sections 3, 5, 6; the spec's `architecture-derive-1`, `working-name-1`, W2, W4, W5; ORV-126 "The start question" | T27 to T31 |
| B2 screens | `packages/design-system/src/examples/architecture-view.tsx`, `name-view.tsx`, `foundation-view.tsx`, `business-board.tsx`, `business-graph.ts`, `business-graph.test.ts`, `business-text.ts`, `foundation-fixtures.ts`, `foundation.stories.tsx`, `business-board.stories.tsx`, `src/i18n/messages/en.ts`, `th.ts`, `src/i18n/business-strings.test.ts` | The two views; PR 2's copy with `strategy.provisional` | This file sections 9, 10; the spec's two rules, `foundation-honest-1`, "Strings"; the designer's notes; `identity-frame-view.tsx` | T32 to T34; `check-i18n`; `messages.test.ts` |

No migration in PR 2 (D4), and no change to the action or the service: the arms reach them through `checkEntry` and `entryAllowed`.

### PR 3, the core idea gate (rows 25 to 37)

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers | Tests |
| --- | --- | --- | --- | --- |
| C1 engine and door | `packages/intent-engine/src/business/foundation.ts`, `foundation.test.ts`, `foundation-marks.ts`, `foundation-marks.test.ts`, `view.ts`, `view.test.ts`, `questions.ts`, `questions.test.ts`; `packages/auth/src/foundation.integration.test.ts`; `apps/web/app/business/foundation-actions.test.ts`, `data.test.ts` | The `core-idea` arms, node, requires, `coreIdeaGate`; W4 whole; the door rows; the replay of all four | This file sections 3, 5, 6; the spec's `core-idea-gate-1`, `foundation-honest-1`, W4 | T35 to T40 |
| C2 screens | `packages/design-system/src/examples/core-idea-view.tsx`, `foundation-view.tsx`, `business-board.tsx`, `business-graph.test.ts`, `business-text.ts`, `foundation-fixtures.ts`, `foundation.stories.tsx`, `business-board.stories.tsx`, `src/i18n/messages/en.ts`, `th.ts`, `src/i18n/business-strings.test.ts` | The view, the gate line on the card and the dialog, `FoundationNoAi` over all four; PR 3's copy | This file sections 9, 10; the spec's `core-idea-gate-1`, `foundation-honest-1`, "Strings"; the designer's notes; `identity-frame-view.tsx` | T41 to T43; `check-i18n`; `messages.test.ts` |

## 13. Tests

<!-- prettier-ignore -->
| Test | File and name | Spec row | Asserts | Break it |
| --- | --- | --- | --- | --- |
| T1 | `foundation.test.ts` › "identity-frame entry" | 1 | The eight inputs give the results of section 3; no problem carries a value | Drop `.strict()` on the `skipped` payload |
| T2 | `foundation.test.ts` › "text rules" | 1, 2 | U+0000 dropped then trimmed; an empty optional answer is absent from the payload; a 2,000 Thai `never` parses; length in UTF-16 units | Keep an empty `never` as `""` |
| T3 | `foundation.test.ts` › "axes fit ORV-20's personality facts" | 2 (W3) | A given payload's `axes` parse with `rules.ts`'s `personality` schema; `axisValueOf` gives `0 25 50 75 100` | Store points 1 to 5 |
| T4 | `foundation-marks.test.ts` › "roots" | 5, 6 | `foundation-roots-1`: `given`, `confirmed` done; `open`+`skipped` skipped; `open`, `open`+`stale`, `awaiting-choice` open | Count a stale positioning as done |
| T5 | `foundation-marks.test.ts` › "W4" | 6 (PR 1 column), 17, 30 | The five cases print W4's lines for the nodes built so far; the whole lines from PR 3 | Pass a blocked require on as itself, not its causes |
| T6 | `foundation-marks.test.ts` › "allowed" | 4, 5, 7 | The "Allowed when" matrix of section 5.5 for every built kind against no entry, a skip, a given or written entry, with and without a block cause | Allow a skip after a skip |
| T7 | `view.test.ts` › "foundation marks" | 6 | Three projects: `identity-frame` results equal W4 cases 1, 2 and 5; `unchecked` `positioning` on the last two; values unchanged | Drop `unchecked` from a given result |
| T8 | `view.test.ts` › "personality in the view", "controls match the door" | 2, 4, 5 | State keys, point 4 as value 75, `waitingFor` `positioning`; for every fixture and kind, a control is offered exactly when `entryAllowed` is true; the business nodes deep-equal a view built without `foundation`; the JSON holds no catalog text | Offer `skip` after a skip |
| T9 | `access.test.ts` (the walk) | 7, 13 | `TENANT_TABLES` holds `business_foundation_entry`; row security and `workspace_rows`; SELECT and INSERT only for the app role; one workspace visible | Leave it out of `TENANT_TABLES` |
| T10 | `access.test.ts` › "one entry per kind", "foundation entry shape" | 7, 13, 35 | A second `given` for a node fails; `skipped` then `given` passes; a skip with a payload, a name of 61 code points, a pair (`name`, `skipped`) and a project of another workspace each fail; the columns are exactly the eight of section 4.1 | Drop the unique index |
| T11 | `classification.test.ts` | 13 | Each column one tag; `payload` and `created_by` are `personal` | Tag `payload` `internal` |
| T12 | `foundation.integration.test.ts` › "entry saved in the workspace" | 2 | One row: node, kind, axes 75 each, `person` trimmed, no `never`, `created_by` the session's user | Insert the raw input |
| T13 | `foundation.integration.test.ts` › "another workspace reads as not found" | 7 | A member of B entering on A's project and an unknown id give the same `not-found`; nothing saved | Select the project without the workspace |
| T14 | `foundation.integration.test.ts` › "newest wins, in lock order" | 4 | `skipped` then `given`: `open` returns both, newest first; a `skipped` and a `given` sent at once on an empty node end with a `given` newest, or with the second refused | Drop `for update` |
| T15 | `log.test.ts` | 2, 13 | `business/enterFoundation` is a route; its line holds closed words only | Add a free text outcome |
| T16 | `foundation-actions.test.ts` › "give the personality", "skip, then give" | 2, 4 | Ok with `{ node, kind }`; with a spy on the logger, the line holds route and outcome and no answer or axis value; two calls give two rows, newest `given` | Log the input |
| T17 | `foundation-actions.test.ts` › "waits for positioning" | 5 | Positioning with no choice and stale: both direct calls `invalid-input`, nothing saved | Drop the `entryAllowed` check |
| T18 | `foundation-actions.test.ts` › "entry door", "given stays given" | 7 | `signed-out`; `forbidden`, no limit consumed, no address; `RATE_LIMITED` with `retryAfter`; one `not-found` body for the next two; `invalid-input` for the last three; nothing saved | Count the limit before the list |
| T19 | `data.test.ts` › "foundation replay" | 12 | Loaded twice a day apart on a fake clock: the same view, no write, no limit, no fetch | Write on open |
| T20 | `business-graph.test.ts` › "foundation edges" | 9, 23, 34 | Nodes and edges after each PR: 6/7, 8/11, 9/13 (W2); the five business nodes' ports unchanged | Give every node a single `in` handle |
| T21 | Stories `IdentityGiven`, `IdentityInvalid`, `IdentitySkipped`, `IdentityWaits`, `IdentityMarks`, `IdentityNarrow`, `FoundationUntrustedText`, `Board`, each in both languages, with play | 2 to 6, 8, 9, 11 | No point chosen when the editor opens; the lines of each row; markup as literal text; `scrollWidth` at most 360; the a11y addon | Preset each scale to point 3 |
| T22 | `ProjectBoard.test.tsx` | 3, 10 | Unchosen scale and 2,001 `never` make no call; a double press one call; disabled while pending; text kept on `rate-limited`; a language switch redraws with no second call | Drop the pending guard |
| T23 | `business-strings.test.ts` | 13 | PR 1's keys in both languages word for word; `business.question.person` and `.never` equal ORV-126; the `question` group is `PROXY_QUESTIONS` and `START_QUESTIONS`; no middot or em dash | Edit one catalog line |
| T24 | `questions.test.ts` | 13 | `identity-frame.proxy.person` and `.never` equal ORV-126 "Missing strategy" | Change one word |
| T25 | `business-text.test.ts` › "foundation lines" | 5, 10 | `business.state.waiting` and the mark lines fill `{nodes}` with `Intl.ListFormat` in each locale | Join with a comma |
| T26 | `foundation.test.ts` › "no model import" | 13 | The source of `foundation.ts` and `foundation-marks.ts` imports neither `openrouter` nor `llm-interpreter` | Import `AI_MODELS` |
| T27 | `foundation.test.ts` › "architecture and name entries" | 14 | Row 14's ten inputs; W5 `ok:7 ok:60 refused refused` | Allow a `name` `skipped` |
| T28 | `foundation-marks.test.ts` › "architecture derive" | 15, 16, 17 | "no" gives `derived` and `derivedArchitecture`; "yes" `open`; none `open`; blocked shows no value; `name` `blocked` by `architecture` on "yes" (W4 case 4) | Show the value while blocked |
| T29 | `view.test.ts` › "architecture derived", "architecture yes", "architecture marks" | 15, 16, 17 | Rows 15 to 17 as data: state keys, `restsOn` `positioning` with a skip, `notInVersion`, the stored answer, `answer` offered while no entry whatever the marks | Hide the question while blocked |
| T30 | `foundation-actions.test.ts` › "answer sub-brands", "give a working name", "a name ahead of positioning", "architecture and name door" | 15, 18, 20, 21 | The rows' entries saved; logger holds no name; a name given while positioning is open; row 21's refusals | Block a name on positioning |
| T31 | `questions.test.ts` › "start question" | 24 | `situation.sub-brands` equals ORV-126 "The start question" | Change one word |
| T32 | Stories `ArchitectureDerived`, `ArchitectureNotInVersion`, `ArchitectureMarks`, `NameGiven`, `NameInvalid`, `NameAhead`, `FoundationUntrustedText`, `FoundationNarrow`, `Board` | 15 to 20, 22, 23 | The rows' lines in both languages; 360 px, light and dark; the a11y addon | Render the name as a link |
| T33 | `business-strings.test.ts` | 24 | PR 2's keys; `strategy.provisional` equals ORV-126 "Missing strategy" in both languages | Edit the provisional line |
| T34 | `business-text.test.ts` › "rests on" | 17 | `strategy.provisional` and `business.marks.restsOn` resolve together for a `derived` result | Show "rests on" with no provisional line |
| T35 | `foundation.test.ts` › "core-idea entry" | 25 | Row 25's inputs give the results of section 3 | Accept `picked` |
| T36 | `foundation-marks.test.ts` › "core idea gate" | 31 | The four rows of `core-idea-gate-1` with their state, gate line and controls | Pass the gate on a skip |
| T37 | `view.test.ts` › "core idea marks", "core idea waits" | 29, 30 | Row 30 equals W4 cases 2, 4 and 5; row 29's three projects wait for Brand personality, Positioning, Positioning with no control | Leave `unchecked` empty on a written idea |
| T38 | `view.test.ts` › "foundation, no AI label" | 35 | Over every foundation fixture, the view JSON holds none of the five AI keys of `foundation-honest-1` and no model id | Label a written idea as drafted |
| T39 | `foundation-actions.test.ts` › "write the core idea", "skip, then write", "core idea waits", "core idea door", "agreed stays agreed" | 26, 28, 29, 32 | The rows' entries and refusals; logger holds no text; after `written`, a `written` and a `skipped` are `invalid-input` and the newest stays the first | Allow `written` after `written` |
| T40 | `data.test.ts` › "foundation replay, all four" | 36 | As T19 with an entry on every node | Recompute a derived value and store it |
| T41 | Stories `CoreIdeaWritten`, `CoreIdeaInvalid`, `CoreIdeaSkipped`, `CoreIdeaWaits`, `CoreIdeaMarks`, `CoreIdeaStates`, `CoreIdeaStatesOpen`, `CoreIdeaStatesSkipped`, `CoreIdeaStatesAgreed`, `CoreIdeaNarrow`, `FoundationUntrustedText`, `FoundationNoAi`, `Board` | 26 to 31, 33 to 35 | The rows' lines in both languages; the gate line on card and view; no AI label or score text over all four views; 360 px; the a11y addon | Render the statement as HTML |
| T42 | `business-strings.test.ts`, `questions.test.ts` | 37 | PR 3's keys; `core-idea.proxy.remember` equals ORV-126 | Edit one line |
| T43 | `ProjectBoard.test.tsx` › "core idea" | 27 | Empty and 301 make no call; a double press one call | Drop the wrapper's check |

## 14. Impact list

- **`packages/intent-engine`.** New `business/foundation.ts`, `business/foundation-marks.ts` and their tests; `view.ts` (`BusinessView.foundation`, `SavedBusiness.foundation`, the `FoundationNode` union); `questions.ts` (`PROXY_QUESTIONS` from six to nine ids, so `ProxyQuestionId` widens; new `START_QUESTIONS`); `index.ts`. Unchanged: `intake.ts`, `place.ts` (`BUSINESS_NODES`, `BUSINESS_FIELDS`, `BUSINESS_EDGES`, `placeIntake`, `nodeStates`), `positioning.ts`, `evidence.ts`, `EVIDENCE_SCHEMA_VERSION`, `MODEL_JOBS`, `AI_MODELS`, `knowledge.ts` (`PERSONALITY_AXES`), `color-rules.ts`, `rules.ts`. New public contracts: the entry contract, `storedEntrySchema`, `FOUNDATION_NODES`, `FOUNDATION_REQUIRES`, `FOUNDATION_EDGES`, `foundationMarks`, `entryAllowed`, `FoundationNode`.
- **`BusinessView` readers re-checked:** `business-board.tsx` (opens foundation nodes), `business-graph.ts` (two lists, multi-input ports), `business-text.ts` (`NODE_KEY`, the new lines), `business-node-view.tsx` (unchanged; typecheck only), `business-fixtures.ts` (every fixture view now carries `foundation`, built by `toBusinessView`), `business-board.stories.tsx` (the `Board` play counts six, eight, then nine nodes), `business-graph.test.ts` ("five nodes in fill order" becomes the board's order), `apps/web/app/business/data.ts`, `[projectId]/ProjectBoard.tsx`, `ProjectBoard.test.tsx`, `packages/auth/src/business.integration.test.ts` (`open` returns `foundation`).
- **`questions.ts` readers:** `questions.test.ts` ("holds the six ids" becomes nine, plus the start question); `business-strings.test.ts` ("the six questions are the catalog's whole question group" becomes `PROXY_QUESTIONS` plus `START_QUESTIONS`); `business-text.ts` (`QUESTION_KEY`, built from the list).
- **`packages/db`.** `schema/business.ts` (one table), `workspace.ts` (`TENANT_TABLES`), `classification.ts`, `classification.test.ts`, two migrations with meta, `access.test.ts`. `business_intake`, `business_reading` and `business_positioning_choice` unchanged.
- **`packages/auth`.** New `foundation.ts` and its integration test; `business.ts` (`open` returns `foundation`; `BusinessError` gains `out-of-order`); `log.ts` (one route); `index.ts`. No new limit and no new number.
- **`apps/web`.** New `app/business/foundation-actions.ts` and its test; `data.ts`, `data.test.ts`; `[projectId]/ProjectBoard.tsx` and its test. `page.tsx` and `page.test.tsx` unchanged.
- **`packages/design-system`.** New `foundation-view.tsx`, four node view files, `foundation-fixtures.ts`, `foundation.stories.tsx`; `business-board.tsx`, `business-graph.ts`, `business-text.ts` and their tests; the catalog's new keys of "Strings" with `strategy.provisional`. No shared component, token, recipe or catalog entry changes.
- **Docs.** None in this PR set beyond these notes; section 16 lists the spec points read one way.
- **Not added.** No dependency, env var, external service, model job, Storage object, token or shared component.

## 15. For the `security` review

- **Access.** One route, `business/enterFoundation`, behind the session, the ORV-268 approved list and `LIMITS.write`, then `withWorkspace` with the workspace from the session. The table has `workspace_id`, a two-column FK to the project in the same workspace, row security, and SELECT and INSERT only for `orivilo_app` (ADR 0002; rules 2 and 4).
- **One 404 body** for another workspace's project and an unknown id, at the action (`not-found`) and at the page (`loadProject`, unchanged) (rule 9).
- **Input.** `checkEntry` is strict at both levels and whitelists each payload key; the service inserts named columns from the checked entry, never a spread body (rule 3). The database bounds each text key again.
- **Untrusted text.** Answers, names and statements render as text nodes in `bdi`, never HTML or a link (rows 8, 22, 33); no log line or error body holds them; an `EntryProblem` holds a path and a kind (rule 8). `payload` and `created_by` are `personal` (rule 11).
- **No model.** No module of this story imports `openrouter` or `llm-interpreter` (T26); no entry row holds a model id (T10, T38).

## 16. Spec points this design reads one way

- **Row 24's pin of `strategy.provisional`.** The spec names `questions.test.ts`; that file is in the engine, which holds no catalog line and cannot import the design system. The pin goes into `business-strings.test.ts`, beside ORV-285's pin of `strategy.skip` (T33). `situation.sub-brands` is pinned in `questions.test.ts` as the spec says, from `START_QUESTIONS` (T31). Listed for the main session.
- **Row 1's "a `skipped` entry with an `axes` key".** Read as `payload: { axes }`, failing at `payload.axes`; a top-level `axes` fails at `axes`. Both are "the path of its field".
- **"Block cause"** is computed by the marks function with the node's own status set to `open`, the spec's "as if it held no entry", so the door and the view cannot disagree.
- **The table takes all six node and kind pairs in PR 1** (D4), though PRs 2 and 3 add the arms of the app contract; the app schema refuses what its PR has not built.
- **Newest wins is made safe under two tabs** by the project row lock and `clock_timestamp()` (D6); the spec states the order and leaves the race unsaid.

## Changelog

- 2026-11-19: first version, task ORV-291-tech-1, from the spec's rules, rows and W1 to W5, ORV-285's tech notes and the code of PR 226 at `c651a8e` (`positioning.ts`, `view.ts`, `place.ts`, `questions.ts`, `intake.ts`, `packages/auth/src/positioning.ts`, `business.ts`, migrations 0012 and 0013, `positioning-actions.ts`, `data.ts`, `ProjectBoard.tsx`, `business-board.tsx`, `business-graph.ts`, `business-text.ts`, `business-node-view.tsx`, `business-strings.test.ts`), ADR 0002, ADR 0015 and `.claude/rules/security.md`.
