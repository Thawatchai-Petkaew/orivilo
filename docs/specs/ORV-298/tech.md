---
issue: ORV-298 (https://tpetkaew.atlassian.net/browse/ORV-298)
spec: docs/specs/ORV-298/spec.md v1.1
adr: none new; the design stays inside ADR 0002 (server-only data access through `withWorkspace`), ADR 0015 decisions 2, 9 and 10, and ADR 0017 (the colour rules are called, never changed)
task: ORV-298-tech-1
author: architect
date: 2026-11-20
---

# ORV-298 tech notes: the expression rules, logo type, colour and typography

These notes design what the spec leaves to the architect, for the three PRs of its "Delivery: three PRs": the three new arms of the foundation entry contract and of the stored shape, how the root `competitive-frame` and the three nodes join the lists and functions of `foundation-marks.ts` and `view.ts`, the colour adapter around ORV-20, where the typography, name length and logo type rules live, the one migration per PR, what the action and the service gain, what `BusinessView` gains and the props of the three node views. They use the spec's default for each of its twelve open questions (G1, ORV-298 comment 10759); section 11 names where another answer changes the design.

**What is real.** Nothing here is built yet. Every file, table change and test below is a design for the builder. No part calls a model, in any PR; no test reaches a model or the internet.

**The base.** PR 1 builds on ORV-295 (PR 234, ORV-291 PR 2) once it is in `develop`. The code read for these notes is PR 234's head (`60f3c1b`): `business/foundation.ts`, `business/foundation-marks.ts`, `business/view.ts`, `packages/auth/src/foundation.ts`, `apps/web/app/business/foundation-actions.ts`, and in `packages/design-system/src/examples` `foundation-view.tsx`, `foundation-parts.tsx`, `architecture-view.tsx`, `business-graph.ts`, `business-text.ts`, `business-board.tsx`. The table is `develop`'s migrations 0015 and 0016 as they stand. ORV-296 (ORV-291 PR 3, the core idea gate) is not built and may land before or after any PR here (section 10).

**One rule holds the design together, ORV-291's rule grown by three nodes.** Nothing about a decision or a mark is stored. The table holds what the person gave (one row per act); every decision, state, mark and control is computed from those rows and the positioning gate each time the view is built, by engine functions the view and the server door both call. So the view offers a control exactly when the door accepts the entry, and a rule change shows on old projects at once (open question 2, default (a)).

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Question | Choice | Why not the other way | Confirmed by |
| --- | --- | --- | --- | --- |
| E1 | Where the three new rules and the colour adapter live | One new engine module, `packages/intent-engine/src/business/expression.ts`: `colorOf`, `colorOutcome`, `colorCandidates`, `TYPOGRAPHY_FAMILIES`, `typographyOf`, `nameLength`, `isLongName`, `LONG_NAME_OVER`, `logoTypeOf`, `checkLineupRows` | The rules are pure and read stored entries only; a module of their own keeps `foundation-marks.ts` the marks and `view.ts` the view, and gives `expression.test.ts` (the spec's file) one home. It imports `foundation.ts` (`checkEntry`, `TYPOGRAPHY_SCRIPTS`, types), `color-rules.ts`, `color-audit.ts` and `rules.ts`, and nothing from `foundation-marks.ts` or `view.ts`; `foundation.ts` imports nothing from it, so no import cycle | `expression.test.ts` |
| E2 | The three nodes: the same lists as ORV-291's four, or a second list | The same lists. `FOUNDATION_NODES`, `FOUNDATION_REQUIRES` and `MARK_NUMBERS` grow per PR, as the spec's impact section says; `RootId` gains `competitive-frame` | One graph is one propagation run, so `color` reads `identity-frame`'s result directly; a second list would need a second graph or a merge of two. The cost is that each list is a place where this story and ORV-296 both add a line (section 10) | `foundation-marks.test.ts` › "lists" |
| E3 | The typography and logo type rules: ORV-20's rule grammar or plain functions | Plain functions over data. ADR 0017's Consequences expects later topic nodes to follow its grammar; that line is a forecast, not a decision, and the grammar would need a new scope in `rules.ts` and knowledge entries in the corpus, while the spec keeps `rules.ts` unchanged and names no entry for these two rules | Changing `rules.ts` is out of the spec's impact list; a filter over three families and a two-reason rule gain nothing from three-valued logic | `expression.test.ts` › "typography", "logo type rule" |
| E4 | How the adapter calls ORV-20 | `decideColor({ facts, lineup })` with `facts` `{ personality, industry: null, audiences: [], avoid: [] }` and `lineup` the stored lineup or `null`. The candidate pair of a band and warmth comes from ORV-20's own `evaluateScope` over the signature rules of `COLOR_RULES` with `crowded: []` (section 6.1). No ORV-20 file changes | Reading `COLOR_RULES` through its own evaluator keeps one home for the thresholds; a table of candidates in the adapter would copy them | `git diff --stat` on the four ORV-20 files in the gate; `expression.test.ts` › "colour adapter" |
| E5 | Entry action, route and service | No change to `foundation-actions.ts`, its route `business/enterFoundation`, or `foundationService`: the new arms reach them through `checkEntry`, `entryAllowed` and `foundationState`. Only the comment on `READ_LIMIT` in `packages/auth/src/foundation.ts` changes (it says six rows) | ORV-291 D8 made one route for every node and kind; the door's six steps are the same here | `foundation-actions.test.ts` "lineup door", "typography door", "logo type door" |
| E6 | The lineup's U+0000 rule with `lineupSchema` unchanged | The arm wraps it: `z.preprocess(dropNulInNames, lineupSchema)`. `lineupSchema` trims, bounds and upper-cases as it is | `expression-entry-1` says U+0000 is dropped then the text trimmed; Postgres `jsonb` refuses U+0000, so a name holding it would fail the insert as `not-saved` | `foundation.test.ts` › "lineup entry" |
| E7 | The database bound on the lineup | PR 1's migration widens the pair check and adds one check, `business_foundation_entry_lineup`: an array of 1 to 20 entries, each `name` a string of 1 to 60 characters and each `hex` `#` and six upper-case hex digits | ORV-291 tech notes section 4.1: "the database holds the text bounds, so no row can carry a long text past a missed check". The lineup names are free text the person types | `access.test.ts` › "foundation entry shape" |
| E8 | The lineup editor's checks | One pure helper, `checkLineupRows(rows)` in `expression.ts`, drops the empty rows, finds the incomplete ones, then runs `checkEntry` and maps its problems back to the person's rows | Row 4's six messages need row positions that `checkEntry` cannot know once empty rows are dropped; a helper in the engine is unit-tested, where the view is proven only by stories | `expression.test.ts` › "lineup rows" |
| E9 | Where the decisions go in the view | Computed once in `foundationState` (new member `expression`), read by `ownStatus` and by the three view builders | `ownStatus` needs the decisions to say `derived` or `open`; computing them once keeps the view and the door on one run | `view.test.ts` › "controls match the door" |
| E10 | The state lines `partly` and `needsAnswer` | A new `expressionLines(result, decided)` in `view.ts` that wraps `foundationLines`: an `open` result reads `partly` with a decision made, `needsAnswer` without | ORV-291's `foundationLines` gives `empty` for an open result; the spec's table gives the three nodes their own lines and keeps ORV-291's table for the four foundation nodes | `view.test.ts` › "expression lines" |
| E11 | The screens | Three node views in their own files, `color-view.tsx`, `typography-view.tsx`, `logo-type-view.tsx`, with the shared decision line and rule label in `expression-parts.tsx`; fixtures and stories in new files `expression-fixtures.ts` and `expression.stories.tsx`. `FoundationNodeView` dispatches to them. No new shared component; two shared changes, recorded in design.md section 2.6: the present label of the `ds-node` recipe in `recipes.css` with its `canvas-node.yaml` catalog line, and the fit padding of `CanvasBoard`, 0.2 to 0.15 on every board | A file per node keeps each PR's screen diff to its own node, and new fixture and story files keep this story out of ORV-296's `foundation.stories.tsx` | The stories |
| E12 | New dependency, env var, service, table, column or model job | None | | Section 14 |

## 2. Where each part lives

<!-- prettier-ignore -->
| Path | Holds | PR |
| --- | --- | --- |
| `packages/intent-engine/src/business/foundation.ts` | The `lineup`, `typography` and `logo-type` arms of `entryInputSchema` and `storedEntrySchema`; `dropNulInNames`; the lineup name clause of `checkEntry`'s mapper; `newestByNode`'s three new slots; `TYPOGRAPHY_SCRIPTS` (PR 2) | 1, 2, 3 |
| `packages/intent-engine/src/business/expression.ts` (new) | Section 6: the colour adapter, `checkLineupRows`; `TYPOGRAPHY_FAMILIES`, `typographyOf`; `nameLength`, `isLongName`, `LONG_NAME_OVER`, `logoTypeOf`; `expressionOf` | 1, grown in 2 and 3 |
| `packages/intent-engine/src/business/foundation-marks.ts` | `ROOT_IDS` with `competitive-frame`; the three nodes in `FOUNDATION_NODES`, `FOUNDATION_REQUIRES`, `MARK_NUMBERS`; `ownStatus`, `entryAllowed` and `foundationState` for them | 1, 2, 3 |
| `packages/intent-engine/src/business/view.ts` | `expressionLines`; the `color`, `typography` and `logo-type` arms of `FoundationNode`; their field and state keys and builders (section 7) | 1, 2, 3 |
| `packages/intent-engine/src/index.ts` | Exports `./business/expression` | 1 |
| `packages/db/src/schema/business.ts` | The pair check widened; the lineup check (PR 1) | 1, 2, 3 |
| `packages/db/migrations/NNNN_foundation_entry_lineup.sql`, `NNNN_foundation_entry_typography.sql`, `NNNN_foundation_entry_logo_type.sql`, `meta/` | One migration per PR (section 4) | 1, 2, 3 |
| `packages/auth/src/foundation.ts` | The comment on `READ_LIMIT` only (E5) | 1 |
| `packages/design-system/src/examples/color-view.tsx`, `typography-view.tsx`, `logo-type-view.tsx` (new) | The three node views | 1, 2, 3 |
| `packages/design-system/src/examples/expression-parts.tsx` (new) | `DecisionLine`, `ByRuleLabel`, the label lines of `expression-honest-1` | 1 |
| `packages/design-system/src/examples/foundation-view.tsx` | The dispatch to the three views; `FoundationEditor` gains the lineup editor arm | 1, 2, 3 |
| `packages/design-system/src/examples/business-graph.ts`, `business-text.ts` | Positions and port order; node titles, the new lines and the word lists | 1, 2, 3 |
| `packages/design-system/src/examples/expression-fixtures.ts`, `expression.stories.tsx` (new) | Labelled fixture projects and the stories the spec names | 1, 2, 3 |
| `packages/design-system/src/i18n/messages/en.ts`, `th.ts` | The keys of "Strings" with their PR | 1, 2, 3 |

## 3. The entry contract (`business/foundation.ts`)

The three arms join ORV-291's union with no change to its other arms, to `checkEntry`'s signature or to `EntryProblem`. The code is a sketch; the builder types the narrowing of `row` in `dropNulInNames`.

```ts
import { lineupSchema } from "../color-audit";

// expression-entry-1, PR 1. U+0000 is dropped from each name before ORV-20's lineupSchema, which
// trims, bounds (1 to 60, counted in code points), upper-cases the hex and refuses a repeated name,
// unchanged. Anything that is not an array of objects with a string name passes through as it is,
// for lineupSchema to refuse.
const dropNulInNames = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map((row) =>
        typeof row === "object" && row !== null && typeof row.name === "string"
          ? { ...row, name: row.name.replaceAll("\u0000", "") }
          : row,
      )
    : value;

const lineupEntry = z.discriminatedUnion("kind", [
  z
    .object({
      projectId,
      node: z.literal("competitive-frame"),
      kind: z.literal("lineup"),
      payload: z.object({ lineup: z.preprocess(dropNulInNames, lineupSchema) }).strict(),
    })
    .strict(),
]);

// PR 2. The one home of the three answers; expression.ts imports it from here.
export const TYPOGRAPHY_SCRIPTS = ["thai-latin", "thai", "latin"] as const;
export type TypographyScripts = (typeof TYPOGRAPHY_SCRIPTS)[number];
const typographyEntry = z.discriminatedUnion("kind", [
  z
    .object({
      projectId,
      node: z.literal("typography"),
      kind: z.literal("answered"),
      payload: z.object({ scripts: z.enum(TYPOGRAPHY_SCRIPTS) }).strict(),
    })
    .strict(),
]);

// PR 3
const logoTypeEntry = z.discriminatedUnion("kind", [
  z
    .object({
      projectId,
      node: z.literal("logo-type"),
      kind: z.literal("answered"),
      payload: z.object({ appIcon: z.boolean() }).strict(),
    })
    .strict(),
]);
```

- **Import direction.** `expression.ts` imports `checkEntry`, `TYPOGRAPHY_SCRIPTS` and the types from `foundation.ts`; `foundation.ts` imports nothing from `expression.ts`, so the entry contract stays the lowest module of `business/` after `intake.ts`.
- **The mapper.** One clause joins `checkEntry`, before the `valueAt` branch: on a path matching `^payload\.lineup\.\d+\.name$`, `too_big` gives `too-long` and `too_small` gives `required`. Every other lineup issue falls through to the existing branches: a repeated name (`custom` from `lineupSchema`'s refine) and a bad hex (`invalid_format`) give `invalid`, a missing name or hex gives `required`, an array of 0 or 21 entries gives `invalid` at `payload.lineup`. The clause must not reuse `TEXT_PATHS`'s `custom` rule, because `custom` on a lineup name is the repeat check, not a length bound.
- **Length of a lineup name** is `lineupSchema`'s count, code points (zod 4.6.6's `max`, checked for these notes: 60 emoji parse, 61 fail), not the UTF-16 count of ORV-291's texts. The table's check counts characters too (section 4), so the two agree.
- **Row 1's inputs give** (the test inputs of the spec's row): the stand-in lineup, 1 entry, 20 entries and the padded, lower-case one parse, the last with names trimmed and colours upper case; 0 entries, `payload.lineup` `invalid`; 21, `payload.lineup` `invalid`; "Brand A" and "brand a", `payload.lineup.1.name` `invalid`; 61 characters, `payload.lineup.0.name` `too-long`; `#12345`, `red` and `#FFF`, `payload.lineup.0.hex` `invalid`; `source` in the payload, `payload.source` `unknown-key`; `competitive-frame` `skipped`, `kind` `invalid`; node `color`, `node` `invalid`. **Row 17:** the three answers parse; `chinese`, `payload.scripts` `invalid`; missing, `payload.scripts` `required`; `locale`, `payload.locale` `unknown-key`; `skipped`, `kind` `invalid`. **Row 27:** `true` and `false` parse; `"yes"`, `payload.appIcon` `invalid`; missing, `required`; `crowding`, `payload.crowding` `unknown-key`; `skipped`, `kind` `invalid`.
- **`storedEntrySchema`** gains the same three arms with `base` (`id`, `createdAt`) and no preprocess: a stored name holds no U+0000. The lineup arm uses `lineupSchema` as it is (a stored name is already trimmed and a stored hex already upper case, so its transforms change nothing).
- **`newestByNode`** gains the slots `"competitive-frame"`, `typography` and `"logo-type"`, each `null` at the start. `isNewer` needs no change: none of the new kinds is `skipped`, and the table holds one row per kind.
- **`EntryRequest`** follows `EntryInput` as built; nothing to add.

## 4. The table and the three migrations

No new table and no new column (`expression-saved-1`). `TENANT_TABLES` and `CLASSIFICATION` are unchanged: `payload` stays `personal`, which covers the competitor names the person types.

**The pair check is the only check on `node` and `kind`.** The table has no check on `node` alone (ORV-291 tech notes section 4.1, correction of task ORV-291-spec-3), so each migration widens `business_foundation_entry_pair` by its pair; the spec says so since its v1.1 (section 16 keeps the lines as they read before). The pair check of `develop` already holds ORV-296's two `core-idea` pairs, so ORV-296 adds no migration and the only migrations that race these are ORV-292's.

<!-- prettier-ignore -->
| PR | File (number taken at build time) | Content |
| --- | --- | --- |
| 1 | `NNNN_foundation_entry_lineup.sql` | Drop and add `business_foundation_entry_pair` with the six pairs of `develop` and (`competitive-frame`, `lineup`); add `business_foundation_entry_lineup` |
| 2 | `NNNN_foundation_entry_typography.sql` | Drop and add the pair check with (`typography`, `answered`) added |
| 3 | `NNNN_foundation_entry_logo_type.sql` | Drop and add the pair check with (`logo-type`, `answered`) added |

- **How each is made.** The builder edits the `check(...)` calls in `packages/db/src/schema/business.ts` and runs `pnpm --filter @orivilo/db generate`, so the snapshot chain in `meta/` stays drizzle's. If the generator emits no statement for a changed check, the builder writes the two statements by hand in the generated file and says so in the report. No access migration: grants, row security and the `workspace_rows` policy do not change with a check.
- **The numbers are taken at build time.** `develop` ends at 0016 today. The builder reads `packages/db/migrations/` and `meta/_journal.json` on the branch base and numbers the file after the last. If ORV-292 merges first, the later branch deletes its own migration and snapshot and generates again on the new base, rather than renaming files, so the snapshot's `prevId` points at the right parent. Nothing else in the design depends on the number.
- **The lineup check**, as a sketch the builder proves in `access.test.ts`:

```sql
(payload ? 'lineup') is false or (
  jsonb_typeof(payload->'lineup') = 'array'
  and jsonb_array_length(payload->'lineup') between 1 and 20
  and not jsonb_path_exists(payload, '$.lineup[*] ? (!(
        @.name.type() == "string" && @.name like_regex "^.{1,60}$" flag "s"
     && @.hex.type() == "string" && @.hex like_regex "^#[0-9A-F]{6}$"))')
)
```

- `jsonb_path_exists` without variables is immutable, so a check may use it. Lax mode makes a missing `name` or `hex` fail the filter's inner test, so such an entry is selected and refused. The repeat rule and the strict keys of an entry stay with the app schema, as the axes and the booleans do in ORV-291.
- **Existing rows** pass both changed checks: the pair set only grows, and no stored row has a `lineup` key. `ADD CONSTRAINT` validates them on a table of a few rows.
- **The unique index** (`project_id`, `node`, `kind`) holds, so each input is given once (`expression-entry-1`). With all PRs of ORV-291 and this story in, a project holds at most nine rows, one per pair; `READ_LIMIT` (24) stays a guard above that, and its comment says "one row per pair" instead of "six".

## 5. Roots, marks and the node rules (`business/foundation-marks.ts`)

### 5.1 The roots and the lists

```ts
export const ROOT_IDS = ["situation", "competitive-frame", "positioning"] as const; // ORV-126 number order
export type RootId = (typeof ROOT_IDS)[number];

// foundationRoots: competitive-frame is done on every saved project (expression-roots-1, departure 2).
return { situation: "done", "competitive-frame": "done", positioning };

// propagateMarks: the root loop reads ROOT_IDS in place of ["situation", "positioning"].

/** Fill order. ORV-296 adds "core-idea" after "name"; PR 3 adds "logo-type" before "color". */
export const FOUNDATION_NODES = [
  "identity-frame",
  "architecture",
  "name",
  "color" /* PR 2: , "typography" */,
] as const;

export const FOUNDATION_REQUIRES = {
  "identity-frame": ["positioning"],
  architecture: ["situation", "positioning"],
  name: ["positioning", "architecture"],
  color: ["competitive-frame", "identity-frame"], // PR 1
  // PR 2: typography: ["identity-frame"],
  // PR 3: "logo-type": ["architecture", "name"],
} as const satisfies Record<FoundationNodeId, readonly MarkRef[]>;

export const MARK_NUMBERS: Record<MarkRef, number> = {
  situation: 1,
  "competitive-frame": 5, // PR 1
  positioning: 6,
  "identity-frame": 7,
  architecture: 8,
  name: 9,
  color: 15, // PR 1; PR 2 adds typography: 16, PR 3 "logo-type": 13
};
```

- `FOUNDATION_EDGES` stays derived and gains `competitive-frame` to `color` and `identity-frame` to `color` (PR 1), `identity-frame` to `typography` (PR 2), `architecture` and `name` to `logo-type` (PR 3).
- `MarkRef` gains `competitive-frame` through `RootId`. Every `MarkGraph` a test builds gives `competitive-frame` a number, because `number` is typed by `RootId | N`; `foundation-marks.test.ts`'s own W4 graph gains that line.
- A require only names a node before it in fill order (`color` after `identity-frame`; `logo-type` after `architecture` and `name`), so `propagateMarks` never throws on the grown graph.

### 5.2 `ownStatus` and `foundationState`

`foundationState(gate, entries)` gains one member, `expression: ExpressionOutcomes` (section 6.4), computed once from `newest`. `ownStatus(newest, expression = expressionOf(newest))` reads it:

<!-- prettier-ignore -->
| Node | Own status | Rule | PR |
| --- | --- | --- | --- |
| `color` | `derived` when `expression.color.decided === 3`; `open` otherwise | `color-node-1` | 1 |
| `typography` | `derived` with a `typography` entry; `open` without | `typography-node-1` | 2 |
| `logo-type` | `derived` when `expression.logoType` is not null; `open` otherwise | `logo-type-1` | 3 |

None is `skipped` or `given`: none of the three is skippable (ORV-126 row 25) and each is worked out, never given. The marks then run unchanged; W8 is their test.

### 5.3 `entryAllowed` (the "Allowed when" column of `expression-entry-1`)

<!-- prettier-ignore -->
| Entry | Allowed when | PR |
| --- | --- | --- |
| `competitive-frame` `lineup` | `newest["competitive-frame"] === null` | 1 |
| `typography` `answered` | `newest.typography === null` | 2 |
| `logo-type` `answered` | `newest["logo-type"] === null` and not (`newest.name !== null` and `isLongName(newest.name.payload.name)`) | 3 |

None reads `blockCause`: each is a fact the person can give while the node waits. The view's controls come from the same function (section 7), so `give` and `answer` show exactly when the door accepts them.

## 6. The rules (`business/expression.ts`)

### 6.1 The colour adapter (`color-node-1`)

```ts
export type ColorAxes = Record<"expressive" | "warm" | "premium", AxisValue>;
export type SignatureFamily = ColorDecisionValue<"signature">; // lime, cyan, magenta, teal

export type ColorOutcome = {
  status: ColorDecisionResult["status"];
  signature: null | {
    value: SignatureFamily;
    rule: string; // the winning rule id, e.g. color.signature.lime-warm
    because: "signature" | "fallback"; // priority 80, or 70
    preferred: ChromaticFamily | null; // the priority 80 family, for a fallback only
  };
  neutral: null | { value: ColorDecisionValue<"neutral">; rule: string };
  canvas: null | { value: ColorDecisionValue<"canvas">; rule: string };
  /** Why the signature is open, when it is and the status is needs-input. */
  signatureOpen:
    | null
    | { why: "waitsForLineup" }
    | { why: "bothCrowded"; first: ChromaticFamily; second: ChromaticFamily };
  /** decideColor's questions, mapped to the node that would answer each, in ORV-126 number order. */
  asks: Array<"competitive-frame" | "identity-frame">;
  /** A conflicted or invalid result: no decision, and business.color.notDecided. */
  notDecided: boolean;
  /** The three axis values the reasons quote, or null with no given personality. */
  axes: ColorAxes | null;
  /** auditLineup's result, or null with no lineup. */
  audit: LineupAudit | null;
  decided: 0 | 1 | 2 | 3;
};

export function colorOutcome(result: ColorDecisionResult, axes: ColorAxes | null): ColorOutcome;
export function colorOf(newest: NewestByNode): ColorOutcome;
export function colorCandidates(
  personality: BriefFacts["personality"],
): [ChromaticFamily, ChromaticFamily] | null;
```

- **Input** (`colorOf`). `personality` is the `axes` of `newest["identity-frame"]` when its kind is `given` (the five values as stored), else `{}`. `lineup` is `newest["competitive-frame"]?.payload.lineup ?? null`. `decideColor({ facts: { personality, industry: null, audiences: [], avoid: [] }, lineup })`. Stored entries passed `storedEntrySchema`, so `colorInputSchema` cannot throw on them; the adapter does not catch.
- **The decisions** (`colorOutcome`), only on `status` `resolved` or `needs-input`: each key present in `result.evaluation.decisions` gives its value and `rules[0]` (under `COLOR_RULES` each decided key has exactly one winning rule; a test pins it). `signature.because` is `"signature"` for priority 80 and `"fallback"` for 70; for a fallback, `preferred` is the first of `colorCandidates`.
- **The candidates.** `colorCandidates(personality)` runs ORV-20's `evaluateScope` over the rules of `COLOR_RULES` that set `signature`, with the facts above and `crowded: []`: nothing is crowded, so exactly the two rules of the band and warmth fire, the priority 80 one and its fallback. It returns their `to` values, priority 80 first, or null when not exactly two fire (an axis missing). This is ORV-20's own threshold logic; nothing is copied.
- **The signature line.** While `signature` is open on `needs-input`: `waitsForLineup` when `questions` holds `lineup`; else, every axis given and a lineup stored, `bothCrowded` with the two candidates. Reading the spec literally, `waitsForLineup` and `needsPersonality` may show together when both are missing; each is true.
- **The questions** map by form: `lineup` to `competitive-frame`, `personality.<axis>` to `identity-frame`, each node once. An id of another form is dropped; `expression.test.ts` pins that `COLOR_RULES` with these facts never ask one.
- **`conflicted` or `invalid`:** every decision null, `signatureOpen` null, `notDecided` true. Row 9 forces both by building a `ColorDecisionResult` by hand; `colorOutcome` takes the result, so the test needs no rule set of its own.
- **Never:** a value `decideColor` did not give, a hex other than the stored ones, a guessed signature. `decided` counts the three decisions present.

### 6.2 The lineup editor's checks (`lineup-input-1`)

```ts
export type LineupRow = { name: string; hex: string };
export type LineupRowProblem =
  | { kind: "lineupRequired" }
  | { kind: "rowIncomplete"; row: number; field: "name" | "hex" }
  | { kind: "hexInvalid"; row: number }
  | { kind: "nameRepeated"; row: number }
  | { kind: "tooLong"; row: number; max: 60 };

export function checkLineupRows(
  rows: readonly LineupRow[],
  projectId: string,
):
  | { ok: true; request: Extract<EntryRequest, { node: "competitive-frame" }> }
  | { ok: false; problems: LineupRowProblem[] };
```

In order: a row whose two fields are empty after the trim is dropped; a row with one empty field gives `rowIncomplete` (field the empty one) and stops; no row left gives `lineupRequired` and stops; else `checkEntry({ projectId, node, kind, payload: { lineup } })` runs and its problems map back to the person's row numbers: `payload.lineup.<i>.hex` to `hexInvalid`, `payload.lineup.<i>.name` `too-long` to `tooLong`, `payload.lineup.<i>.name` `invalid` to `nameRepeated`. The view shows the line of the first problem by the spec's row 4 order and focuses its field. The 20-row bound is the editor's own: at 20 rows `business.color.add` is not offered and `business.color.lineupMax` shows. The view passes `NO_PROJECT` from `foundation-parts.tsx` as the project id, so the engine holds no stand-in id.

### 6.3 Typography (`typography-families-1`, `typography-node-1`)

```ts
// TYPOGRAPHY_SCRIPTS and TypographyScripts are imported from ./foundation (section 3).

export const TYPOGRAPHY_FAMILIES = [
  {
    id: "sarabun",
    family: "Sarabun",
    script: "thai",
    style: "looped",
    roles: ["reading"],
    licence: "OFL-1.1",
    licenceName: "SIL Open Font License 1.1",
    licenceFile: "packages/design-system/src/tokens/fonts/LICENSE-sarabun.txt",
  },
  {
    id: "anuphan",
    family: "Anuphan",
    script: "thai",
    style: "loopless",
    roles: ["display"],
    licence: "OFL-1.1",
    licenceName: "SIL Open Font License 1.1",
    licenceFile: "packages/design-system/src/tokens/fonts/LICENSE-anuphan.txt",
  },
  {
    id: "inter",
    family: "Inter",
    script: "latin",
    style: "latinSans",
    roles: ["reading", "display"],
    licence: "OFL-1.1",
    licenceName: "SIL Open Font License 1.1",
    licenceFile: "packages/design-system/src/tokens/fonts/LICENSE-inter.txt",
  },
] as const;

export type Face = {
  id: (typeof TYPOGRAPHY_FAMILIES)[number]["id"];
  family: string; // shown as written, both languages
  style: "looped" | "loopless" | "latinSans"; // business.typography.style.*
  licence: string; // licenceName, shown as written, both languages
  because: "reading" | "display" | null; // the Thai reading and display families only
};

export function typographyOf(
  scripts: TypographyScripts | null,
): null | { reading: Face[]; display: Face[]; pairing: boolean };
```

- Per role, the families whose `script` the answer names and whose `roles` holds the role, Thai first, then Latin (W7). `pairing` is true for `thai-latin` only. `because` is `reading` on the Thai family of the reading role and `display` on the Thai family of the display role, null on Inter.
- The list is data in the engine, and `licenceFile` is a path string from the repo root; the engine reads no file. `expression.test.ts` reads each path with `node:fs` (row 22). Nothing is imported from `suggest.ts`, and the module's source is checked for it.
- No axis is read (open question 5); the `identity-frame` require stays, so typography waits for, or is provisional on, a personality it does not read, and says so with `business.typography.noPersonalityLink`.

### 6.4 Name length and logo type (`name-length-1`, `logo-type-1`)

```ts
export const LONG_NAME_OVER = 12;
const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });
export const nameLength = (name: string): number =>
  [...graphemes.segment(name.replace(/\s/gu, ""))].length;
export const isLongName = (name: string): boolean => nameLength(name) > LONG_NAME_OVER;

export type LogoTypeOutcome = {
  type: "wordmark" | "symbol-plus-name";
  reasons: Array<"longName" | "appIcon" | "wordmark">; // in logo-type-1's order
  rule: "logo-type-1";
  name: string;
  length: number;
  max: typeof LONG_NAME_OVER;
};

export function logoTypeOf(name: string | null, appIcon: boolean | null): LogoTypeOutcome | null;

export type ExpressionOutcomes = {
  color: ColorOutcome; // PR 1
  typography: ReturnType<typeof typographyOf>; // PR 2
  logoType: LogoTypeOutcome | null; // PR 3
};
export function expressionOf(newest: NewestByNode): ExpressionOutcomes;
```

- `logoTypeOf` returns null with no name. Otherwise it lists `longName` when the name is long and `appIcon` when the answer is `true`; one or both give `symbol-plus-name`; neither with the answer `false` gives `wordmark` with the reason `wordmark`; neither with no answer gives null (W6). The `architecture` require is the marks' job, not this function's: `logo-type` is `blocked` while `architecture` is not derived, and the view shows no decision then.
- `Intl.Segmenter` is in the engine's `ES2022` lib (TypeScript's `lib.es2022.intl.d.ts`) and in Node and every browser the app supports. The locale `"en"` is fixed so the count does not follow the page's language; grapheme rules do not depend on it (W5).
- `\s` with the `u` flag removes every Unicode white space character, as `name-length-1` says.

## 7. What `BusinessView` gains (`view.ts`)

`SavedBusiness` does not change: the new entries arrive in `foundation`. `toBusinessView` appends the three nodes to `foundation` in `FOUNDATION_NODES` order.

```ts
type FoundationFieldKey =
  | /* ORV-291 */ "person" | "never" | "personality" | "subBrands" | "architecture" | "workingName"
  | "signature" | "neutral" | "canvas" | "lineup" | "crowded" // PR 1
  | "scripts" | "readingFace" | "displayFace" // PR 2
  | "appIcon" | "logoType"; // PR 3
type FoundationStateKey =
  | "given" | "derived" | "waiting" | "skipped" | "empty" | "notInVersion"
  | "partly" | "needsAnswer"; // PR 1

/** expression-marks-1's result table for the three nodes. */
export function expressionLines(result: FoundationResult, decided: number): Omit<FoundationBase, "fields">;
// result open: decided > 0 gives state "partly" with restsOn = provisionalOn and unchecked as for derived;
// decided === 0 gives "needsAnswer" with no mark line. Any other status: foundationLines(result).

export type FoundationNode =
  | /* ORV-291's arms */ ...
  | (FoundationBase & {
      id: "color"; // PR 1
      /** The person's lineup in the order given; null with none. Shown in every result. */
      lineup: null | Array<{ name: string; hex: string }>;
      /** auditLineup's crowded families in its order; null with no lineup. Shown in every result. */
      crowded: null | HueFamily[];
      /** Null while the result is blocked; each decision null when decideColor left it open. */
      decisions: null | Pick<ColorOutcome, "signature" | "neutral" | "canvas">;
      /** Null while blocked. */
      signatureOpen: ColorOutcome["signatureOpen"];
      /** business.color.needsPersonality: asks holds identity-frame and the result is not blocked. */
      needsPersonality: boolean;
      notDecided: boolean;
      /** The scale points (1 to 5) the reasons quote, from axisPointOf. */
      points: null | Record<"expressive" | "warm" | "premium", AxisPoint>;
      controls: Array<"give">;
    })
  | (FoundationBase & {
      id: "typography"; // PR 2
      scripts: TypographyScripts | null; // shown in every result
      faces: null | { reading: Face[]; display: Face[]; pairing: boolean }; // only while derived
      controls: Array<"answer">;
    })
  | (FoundationBase & {
      id: "logo-type"; // PR 3
      appIcon: boolean | null; // shown in every result
      decision: LogoTypeOutcome | null; // only while derived
      controls: Array<"answer">;
    });
```

- **State and marks** by `expressionLines(result, decided)`, with `decided` the colour's count, 1 for a derived typography or logo type, 0 otherwise. Only `color` can be `partly`.
- **Decisions show** when the result is not `blocked` (`expression-marks-1`, the result table). The input a node asks for, its saved answer, the lineup and the audit show in every result.
- **Controls** from `entryAllowed`: `give` on `color` for the `competitive-frame` `lineup` entry; `answer` on `typography` and on `logo-type`. "Controls match the door" grows over the new fixtures.
- **Fields per node** (the order the card lists them; the designer may reorder at G2): `color` `signature`, `neutral`, `canvas`, `lineup`, `crowded`; `typography` `scripts`, `readingFace`, `displayFace`; `logo-type` `appIcon`, `logoType`.
- **Keys only.** Reasons, family words, style words and labels stay keys the view resolves; the engine holds the values the placeholders take (points, families, the name, its length and the bound). Family and licence names are data shown as written.

## 8. The server action and the service

No change in behaviour (E5). The checks the spec asks of the door hold through what is already built:

- **Step 4** (`checkEntry`) refuses the inputs of rows 1, 17 and 27 with `invalid-input` and their problems.
- **Step 5** (`foundationService.enter`): the project row lock, the newest intake, `readPositioning`, `readFoundation`, `foundationState`, `entryAllowed`. A second lineup, typography or logo type answer, and a logo type answer for a long name, are `out-of-order`, which the action answers as `invalid-input` with no `problems` (rows 10, 23, 31, 34). Another workspace's project and an unknown id give one `not-found` body.
- **The log line** holds the route `business/enterFoundation` and the outcome only; no competitor name, colour, script or answer reaches a line or an error body (row 3's spy).
- **Loading** (`businessService.open`, `readFoundation`, `loadProject`) is unchanged: opening writes nothing, consumes no limit and calls no model (rows 15, 25, 38).

## 9. The screens

### 9.1 The board (`business-graph.ts`, `business-text.ts`, `business-board.tsx`)

- `BUSINESS_POSITIONS` gains `color` (PR 1), `typography` (PR 2) and `logo-type` (PR 3), to the right of the foundation nodes in fill order (open question 6); the coordinates are the designer's at G2. `INPUT_ORDER` gains an entry for `color` and `logo-type` only if the designer's port order differs from the require order.
- `boardGraphOf` needs no other change: `edgesOf` already takes every `FOUNDATION_EDGES` edge whose target the view holds, and `portsOf` gives `color` and `logo-type` two inputs each.
- `business-text.ts`: `NODE_KEY` gains `color` (`business.node.color`), `typography` and `"logo-type"` (`logoType`). New helpers: `familyWord(m, family)` (`business.color.family.*`), `listOfWords(locale, words)` (`Intl.ListFormat`, type `conjunction`, the crowded families), `colorReason(m, node, key)` (fills `because.*` with the points and family words), `decisionRule(m, rule)` (`business.decision.rule`), `logoTypeLines(m, node)`. `foundationStateLine` needs no change: `m.business.state[node.state]` resolves `partly` and `needsAnswer` once the catalog holds them; `provisionalLines` and `uncheckedLine` read `restsOn` and `unchecked`, which `expressionLines` fills for `partly`.
- `business-board.tsx`: re-checked, no change expected. A card's body is the state line and the field names (`expression-board-1`: never a value, an answer or a colour), and the viewer opens `FoundationNodeView` for any foundation id.

### 9.2 The node views and their props

```ts
/** foundation-view.tsx: the open editor gains the lineup arm (PR 1). Held by the board, one at a time. */
export type FoundationEditor =
  | /* ORV-291's arms */ ...
  | { node: "color"; rows: Array<{ key: number; name: string; hex: string }> } // key: a stable React key, never sent
  | null;

// color-view.tsx (PR 1)
export function ColorView(props: { node: Extract<FoundationNode, { id: "color" }>; controls?: FoundationControls }): JSX.Element;
// typography-view.tsx (PR 2)
export function TypographyView(props: { node: Extract<FoundationNode, { id: "typography" }>; controls?: FoundationControls }): JSX.Element;
// logo-type-view.tsx (PR 3)
export function LogoTypeView(props: { node: Extract<FoundationNode, { id: "logo-type" }>; controls?: FoundationControls }): JSX.Element;

// expression-parts.tsx (PR 1)
export function DecisionLine(props: { field: string; value: string; reason: string; rule: string }): JSX.Element;
export function ByRuleLabel(): JSX.Element; // business.label.byRule, once per view with a decision
```

- **`FoundationNodeView`** dispatches by `node.id` to the three views beside ORV-291's four; the shared head (state line, provisional pair, unchecked line) is unchanged.
- **The lineup editor** (PR 1) is held in `controls.editor` like the personality editor, so the rows stay through a refusal, a `rate-limited` answer and the viewer closing (row 4). `business.color.give` opens it with one empty row; Save runs `checkLineupRows` with `NO_PROJECT`, shows the first problem's line and focuses its field, and calls `onEnter` only when it is ok; Cancel clears the editor and returns focus to `business.color.give`. While `pending`, Save shows `business.positioning.saving` and both buttons are inert. Each row's two fields are named by `business.color.brandName` and `business.color.hex`; the remove button by `business.color.remove` with the row's name. The colour field is a text `Input` for `#RRGGBB`; a picker is the designer's at G2 and adds no shared component.
- **Typography and logo type** (PRs 2, 3) hold their choice in the view, as `ArchitectureView` does: a `RadioGroup` with nothing checked when it shows, Save `business.architecture.save`, no choice gives `business.architecture.choiceRequired` with no call. A server refusal naming `payload.scripts` or `payload.appIcon` asks for the choice again and focuses the first radio.
- **Untrusted text.** Every competitor name, hex and working name is a text node inside `bdi`, `whitespace-pre-wrap`, never HTML and never a link; a hex is never a CSS value, so no swatch is drawn from the person's input (`expression-honest-1`; the design-system rule against raw colour values in components). The remove button's name and the name length line carry the name through the catalog's `fill`, into a text node or an attribute string.
- **`ProjectBoard.tsx`** does not change: `onEnter` runs `checkEntry` with the project id and calls `enterFoundation` for any arm, and a refusal's `problems` reach the view through `controls.problems`.

## 10. Where this story, ORV-295 and ORV-296 meet

ORV-295 is the base, so this story adds to its lists. ORV-296 adds `core-idea` (ORV-126 number 11) to the same lists, before this story's nodes in fill order. Each meeting place is an ordered list or union; each story adds its own entries and changes none of the other's. Where both insert at the same point, git reports a conflict; the task that merges second resolves it by keeping both sides, in ORV-126 number order (`core-idea` 11, `logo-type` 13, `color` 15, `typography` 16), and runs the full gate. The lists are written one entry per line wherever Prettier keeps them so, which shrinks a conflict to the inserted lines.

<!-- prettier-ignore -->
| File | Meeting place | ORV-296 adds | This story adds |
| --- | --- | --- | --- |
| `business/foundation.ts` | `entryInputSchema` and `storedEntrySchema` arms; `newestByNode`'s slots; constants | `coreIdeaEntry`; slot `core-idea`; `CORE_IDEA_MAX`; `TEXT_PATHS` gains its two paths | `lineupEntry`, `typographyEntry`, `logoTypeEntry` after it; three slots; the lineup name clause of the mapper (a separate `else if`, not `TEXT_PATHS`) |
| `business/foundation-marks.ts` | `FOUNDATION_NODES`, `FOUNDATION_REQUIRES`, `MARK_NUMBERS`, `ownStatus`, `entryAllowed` | `core-idea` after `name` in each; `coreIdeaGate` | `color`, `typography` at the end; `logo-type` (PR 3) after `core-idea` or `name`, before `color`; `competitive-frame` in `MARK_NUMBERS` after `situation` |
| `business/foundation-marks.ts` | `ROOT_IDS`, `foundationRoots`, `propagateMarks`' root loop, `foundationState` | Nothing | The root `competitive-frame`; the `expression` member |
| `business/view.ts` | `FoundationFieldKey`, `FoundationStateKey`, the `FoundationNode` union, the builders, the `foundation:` array | `remember`, `coreIdea`; `agreed`; its arm and `coreIdeaOf` | Their keys, `partly`, `needsAnswer`; three arms, three builders, `expressionLines` |
| `examples/foundation-view.tsx` | The dispatch; `FoundationEditor` | `CoreIdeaView`; its editor arm | Three views; the lineup editor arm |
| `examples/business-text.ts`, `business-graph.ts` | `NODE_KEY`; `BUSINESS_POSITIONS`, `INPUT_ORDER` | `coreIdea`; its position | `color`, `typography`, `logoType`; three positions |
| `i18n/messages/en.ts`, `th.ts` | `business.node`, `business.field`, `business.state` | Its keys | The keys of "Strings" |
| `i18n/business-strings.test.ts` | One `describe` per story at the end | Core idea strings | "expression, colour strings" and the PR 2 and PR 3 blocks |
| `business-graph.test.ts`, `business-board.stories.tsx` | Node and edge counts of the board | One node, two edges | Per PR (W2); the tests assert the new edges by name and the counts relative to the base board, so both stories' counts add |
| `packages/db/migrations/` | The next free number | None | One per PR; ORV-292's migrations race these (section 4) |

## 11. The spec's open questions: where another answer changes the design

<!-- prettier-ignore -->
| # | Default used | What another answer changes |
| --- | --- | --- |
| 1 | (a) the lineup asked in the Colour view | (b) no `lineup` arm, no PR 1 migration, no editor, no `checkLineupRows`; `colorOf` always passes `lineup: null`, so the colour is `partly` at best on every project and the signature line is always `waitsForLineup` with no control. (c) as (b) until a page-read story fills a lineup through its own analyser and limit (`page-read`); the entry would then carry a source and the "given by you" label would change |
| 2 | (a) decisions worked out on each read | (b) a stored decision: a new kind per node (for example `decided` with the rule id and `COLOR_NODE_VERSION`), a pair per node in the check, a payload check, `storedEntrySchema` arms, a write on first view (which today writes nothing, rows 15, 25 and 38), and a line beside it when the current rule disagrees. (c) as (b) with a control to work it out again |
| 3 | (a) the scripts asked with no preset | (b) or (c): `toBusinessView` takes the page's locale as a new input and the typography arm gains an `assumed` flag; the view cache then depends on the language, against ORV-291 row 10's redraw with no second load |
| 4 | (a) the three families with a licence file | (b) `TYPOGRAPHY_FAMILIES` grows with a licence file per family beside the fonts, and `typographyOf` needs a rule that chooses between families of one role; `business.typography.oneChoice` goes. (c) a research task and a knowledge entry first |
| 5 | (a) no link, the require kept | (b) `FOUNDATION_REQUIRES.typography` becomes `[]`: the board loses the edge `identity-frame` to `typography`, W8's typography lines lose their personality marks, rows 21 and 24 change. (c) `typographyOf` reads axes, which needs (4)(b) first |
| 6 | (a) the same board | (b) a second board on its own route built from the three arms; the engine does not change. (c) a list under the board, with no graph change |
| 7 | (a) no overrule | (b) or (c): new kinds per node (`overruled` with a value, or `agreed` and `rejected`), their pairs and payload checks in a migration, own statuses `given` for an overruled node, and the marks of what rests on it |
| 8 | (a) colour, typography, logo type | (b) PR 3's tasks run first and wait on ORV-295, the same design in a different order. (c) PRs 1 and 2 as one PR of four tasks; the migration widens the pair check by both pairs |
| 9 | (a) `competitive-frame` done | (b) `foundationRoots` takes `nodeStates` from the intake: `competitive-frame` is `skipped` when the competitors answer is empty, so `color` is provisional on it, and the view needs the intake in `foundationState` |
| 10 | (a) more than 12 grapheme clusters | (b) `nameLength` counts words; a Thai name with no spaces is never long. (c) no length rule: the `logo-type` payload gains `longName: boolean`, asked beside the app icon, and `isLongName` goes from `entryAllowed` |
| 11 | (a) no app icon question for a long name | (b) `entryAllowed` drops the long-name clause; the view offers the question for every name; `reasons` can hold both `longName` and `appIcon` from an answer too |
| 12 | (a) wordmark or symbol plus name | (b) `LogoTypeOutcome.type` gains `letterform`, a rule for a short name with `appIcon` true, a hypothesis label, new copy; W6 changes |

## 12. Build order

Two builder tasks per PR: the engine with storage and the door, then the screens with the copy. Each task's file list is its `write_set`. Every builder `done_when` holds `pnpm format:check`, `pnpm lint`, the typecheck and tests named below, and the mutations of section 13 for its tests. `security` reviews each PR (ADR 0015 decision 2: `packages/intent-engine/**` and `packages/db/**`; `foundation-actions.ts` is unchanged, so the envelope names `foundation-actions.test.ts` only as evidence). PR 1 starts after PR 234 is in `develop`; PR 2 after PR 1; PR 3 after PR 2 and ORV-295.

**What stays red between the two tasks of a PR.** The first task widens `FoundationNodeId`, `FoundationNode` and `FoundationStateKey`, which `packages/design-system` reads (`NODE_KEY` and `BUSINESS_POSITIONS` are complete records; `foundationStateLine` indexes the catalog by the state key; `FoundationNodeView` dispatches on the union). So at the first task's commit the root `pnpm typecheck` is red in `@orivilo/design-system` (and in `apps/web` where it type-checks those sources), and `apps/web/app/business/[projectId]/page.test.tsx` and design-system tests that read the node titles can be red for the missing catalog keys, as in ORV-295's task B1. The first task's `done_when` names these as expected red, reports `result: done`, and lists every other check green; the second task turns them green and runs the full gate.

### PR 1, colour (rows 1 to 16)

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers (at most 8) | Green at its commit |
| --- | --- | --- | --- | --- |
| A1 engine, storage and door | `packages/intent-engine/src/business/foundation.ts`, `foundation.test.ts`, `foundation-marks.ts`, `foundation-marks.test.ts`, `expression.ts`, `expression.test.ts`, `view.ts`, `view.test.ts`, `packages/intent-engine/src/index.ts`; `packages/db/src/schema/business.ts`, `packages/db/migrations/NNNN_foundation_entry_lineup.sql`, `packages/db/migrations/meta/NNNN_snapshot.json`, `packages/db/migrations/meta/_journal.json`, `packages/db/src/access.test.ts`; `packages/auth/src/foundation.ts` (comment), `packages/auth/src/foundation.integration.test.ts`; `apps/web/app/business/foundation-actions.test.ts`, `apps/web/app/business/data.test.ts` | Sections 3 to 8 for the lineup and `color`; the root; the migration | This file sections 3 to 8; the spec's rules `expression-roots-1` to `color-node-1` and W3, W4, W8; `business/foundation.ts`; `business/foundation-marks.ts`; `business/view.ts`; `color-rules.ts`; `color-audit.ts`; `packages/db/src/schema/business.ts` | `@orivilo/intent-engine` typecheck and test; `@orivilo/db` typecheck and `access.test.ts` with `TEST_DATABASE_URL`; `@orivilo/auth` typecheck and test with the database; `apps/web` `foundation-actions.test.ts` and `data.test.ts`. Red, expected: root typecheck in `@orivilo/design-system`, `page.test.tsx` |
| A2 screens and copy | `packages/design-system/src/examples/color-view.tsx`, `expression-parts.tsx`, `foundation-view.tsx`, `business-board.tsx`, `business-graph.ts`, `business-graph.test.ts`, `business-text.ts`, `business-text.test.ts`, `expression-fixtures.ts`, `expression.stories.tsx`, `business-board.stories.tsx`; `packages/design-system/src/i18n/messages/en.ts`, `th.ts`, `packages/design-system/src/i18n/business-strings.test.ts` | Section 9 for `color`; PR 1's copy; the stories of rows 2 to 8 and 11 to 14 | This file sections 7, 9, 10; the spec's `lineup-input-1`, `color-node-1`, `expression-honest-1`, `expression-board-1`, "Strings"; the designer's notes for this story; `foundation-view.tsx`; `identity-frame-view.tsx`; `architecture-view.tsx`; `business-text.ts` | Everything: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, `check-i18n`, `apps/web/i18n/messages.test.ts`, the Storybook tests of the new stories, `pnpm contrast` unchanged from `develop`; `git diff --stat origin/develop -- packages/intent-engine/src/color-rules.ts color-audit.ts color-knowledge.ts rules.ts color-rules.test.ts color-audit.test.ts` empty |

### PR 2, typography (rows 17 to 26)

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers (at most 8) | Green at its commit |
| --- | --- | --- | --- | --- |
| B1 engine, storage and door | `packages/intent-engine/src/business/foundation.ts`, `foundation.test.ts`, `foundation-marks.ts`, `foundation-marks.test.ts`, `expression.ts`, `expression.test.ts`, `view.ts`, `view.test.ts`; `packages/db/src/schema/business.ts`, `packages/db/migrations/NNNN_foundation_entry_typography.sql`, `meta/NNNN_snapshot.json`, `meta/_journal.json`, `packages/db/src/access.test.ts`; `packages/auth/src/foundation.integration.test.ts`; `apps/web/app/business/foundation-actions.test.ts`, `data.test.ts` | The `typography` arm, node, require, `TYPOGRAPHY_FAMILIES`, `typographyOf`; the migration | This file sections 3 to 7; the spec's `typography-families-1`, `typography-node-1`, W7, W8; `business/expression.ts`; `business/foundation-marks.ts`; `business/view.ts`; `packages/design-system/src/tokens/fonts/`; `packages/db/src/schema/business.ts` | As A1; red, expected, as A1 |
| B2 screens and copy | `packages/design-system/src/examples/typography-view.tsx`, `foundation-view.tsx`, `business-graph.ts`, `business-graph.test.ts`, `business-text.ts`, `business-text.test.ts`, `expression-fixtures.ts`, `expression.stories.tsx`, `business-board.stories.tsx`; `packages/design-system/src/i18n/messages/en.ts`, `th.ts`, `business-strings.test.ts` | The view, PR 2's copy, the stories of rows 18 to 21 and 24 | This file sections 7, 9; the spec's `typography-node-1`, `expression-honest-1`, "Strings"; the designer's notes; `architecture-view.tsx`; `color-view.tsx`; `expression-parts.tsx` | Everything, as A2 |

### PR 3, logo type (rows 27 to 39)

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers (at most 8) | Green at its commit |
| --- | --- | --- | --- | --- |
| C1 engine, storage and door | `packages/intent-engine/src/business/foundation.ts`, `foundation.test.ts`, `foundation-marks.ts`, `foundation-marks.test.ts`, `expression.ts`, `expression.test.ts`, `view.ts`, `view.test.ts`; `packages/db/src/schema/business.ts`, `packages/db/migrations/NNNN_foundation_entry_logo_type.sql`, `meta/NNNN_snapshot.json`, `meta/_journal.json`, `packages/db/src/access.test.ts`; `packages/auth/src/foundation.integration.test.ts`; `apps/web/app/business/foundation-actions.test.ts`, `data.test.ts` | The `logo-type` arm, node, requires, `nameLength`, `logoTypeOf`, the long-name clause; W8 whole; the replay of all three | This file sections 3 to 8 and 10; the spec's `name-length-1`, `logo-type-1`, `expression-honest-1`, W5, W6, W8; `business/expression.ts`; `business/foundation-marks.ts`; `business/view.ts`; `packages/db/src/schema/business.ts` | As A1; red, expected, as A1 |
| C2 screens and copy | `packages/design-system/src/examples/logo-type-view.tsx`, `foundation-view.tsx`, `business-graph.ts`, `business-graph.test.ts`, `business-text.ts`, `business-text.test.ts`, `expression-fixtures.ts`, `expression.stories.tsx`, `business-board.stories.tsx`; `packages/design-system/src/i18n/messages/en.ts`, `th.ts`, `business-strings.test.ts` | The view, PR 3's copy, `ExpressionNoAi` over all three, the stories of rows 29 to 33 and 35 to 37 | This file sections 7, 9, 10; the spec's `logo-type-1`, `expression-honest-1`, `expression-board-1`, "Strings"; the designer's notes; `typography-view.tsx`; `expression-parts.tsx` | Everything, as A2 |

If ORV-296 is in `develop` before a task starts, the task's base already holds `core-idea` and section 10's order applies with no extra step; if it lands after, ORV-296's merge does the keeping of both sides.

## 13. Tests

<!-- prettier-ignore -->
| Test | File and name | Spec row | Asserts | Break it |
| --- | --- | --- | --- | --- |
| T1 | `foundation.test.ts` › "lineup entry" | 1 | Section 3's row 1 results; the names trimmed and the colours upper case; no problem carries a value | Add a `competitive-frame` `skipped` arm |
| T2 | `foundation.test.ts` › "lineup entry" › "drops U+0000 from each name, then trims" | 1 | A name with U+0000 inside parses with it removed; the mapper gives `too-long` for 61 characters and `invalid` (not `too-long`) for a repeated name | Remove `dropNulInNames` |
| T3 | `foundation.test.ts` › "stored lineup" | 1, 3 | `storedEntrySchema` parses a stored lineup, refuses 21 entries and an unknown key; `newestByNode` fills the `competitive-frame` slot | Make the stored arm not strict |
| T4 | `expression.test.ts` › "lineup rows" | 4 | Row 4's inputs give, in order, `lineupRequired`, `rowIncomplete`, `hexInvalid`, `nameRepeated`, `tooLong`, each at the person's row number after empty rows are dropped | Map the row index of `checkEntry` without the dropped rows |
| T5 | `expression.test.ts` › "colour adapter" › "maps each question to its node", "shows no value on a conflicted or invalid result" | 9 | `lineup` to `competitive-frame`, `personality.expressive` to `identity-frame`; a hand-built `conflicted` and `invalid` result give no decision and `notDecided`; `COLOR_RULES` ask no question of another form | Map `lineup` to `identity-frame` |
| T6 | `expression.test.ts` › "colour adapter" › "W4" | 2, 3, 5, 6 | W4's six cases through `colorOf`, with the rule id of each decision, one winning rule per decided key | Read the signature's rule from `fired[0]` |
| T7 | `expression.test.ts` › "colour adapter" › "candidates" | 5, 6 | `colorCandidates` gives the pair of each of the four bands and warmths, priority 80 first; a fallback's `preferred` is the first; both crowded gives `bothCrowded` with the pair | Take `preferred` from the fallback rule's own family |
| T8 | `expression.test.ts` › "no model import" | 16 | The sources of `expression.ts`, `foundation.ts` and `foundation-marks.ts` import neither `openrouter` nor `llm-interpreter`, and `expression.ts` imports nothing from `suggest.ts` | Import `AI_MODELS` in `expression.ts` |
| T9 | `foundation-marks.test.ts` › "roots" | 7 | `competitive-frame` is done on every gate state; `ROOT_IDS` is in number order | Make `competitive-frame` follow the gate |
| T10 | `foundation-marks.test.ts` › "lists" | 12 | `FOUNDATION_NODES` in fill order, `FOUNDATION_REQUIRES` in ORV-126 order, `MARK_NUMBERS` 5, 15 (and 16, 13 in PRs 2 and 3) | Give `color` the number 14 |
| T11 | `foundation-marks.test.ts` › "W8" | 7, 8 | W8's lines for the nodes built so far, through `foundationMarks` and through the test graph for all three from PR 1 | Pass a blocked require on as itself |
| T12 | `foundation-marks.test.ts` › "allowed" | 3, 7, 10 | A lineup is allowed exactly while none is stored, in every gate state | Add the block cause to the lineup |
| T13 | `view.test.ts` › "colour in the view" | 2, 5, 6, 7 | The rows' data: `partly` with neutral `warm` and canvas `soft`; `derived` with `lime` and its rule; the fallback with `preferred` `lime`; `bothCrowded`; `needsAnswer` with `needsPersonality`; `waiting` for `identity-frame`, then `positioning`; `give` in all; the view JSON holds no catalog text | Show the decisions while blocked |
| T14 | `view.test.ts` › "expression marks" › "colour takes the marks of W8 cases 2 and 3, with a partial decision too" | 8 | `restsOn` `positioning` for skipped, `unchecked` `positioning` for stale, both provisional lines on `partly`, the decisions unchanged by the marks | Leave `restsOn` empty on `partly` |
| T15 | `view.test.ts` › "expression lines", "controls match the door" | 2, 7 | `expressionLines` for every status and count; over every fixture, a control is offered exactly when `entryAllowed` is true | Offer `give` after a lineup |
| T16 | `access.test.ts` › "foundation entry shape" | 10, 16 | The pair check takes (`competitive-frame`, `lineup`), refuses (`competitive-frame`, `skipped`) and any `color` pair; the lineup check refuses 0 and 21 entries, a 61-character name, a lower-case hex and an entry with no hex; a second lineup fails the unique index | Drop `business_foundation_entry_lineup` |
| T17 | `foundation.integration.test.ts` › "lineup saved in the workspace", "another workspace reads as not found", "one lineup per project" | 3, 10 | One row, seven entries, colours upper case, made by the session's user; the same `not-found` for B on A's project and an unknown id; a second lineup `out-of-order`, the stored one unchanged | Insert the raw input |
| T18 | `foundation-actions.test.ts` › "give the lineup", "lineup door" | 3, 10 | Ok with `{ node, kind }`; the log spy finds no name and no colour; row 10's refusals, nothing saved | Log the payload |
| T19 | `data.test.ts` › "expression replay" › "colour loaded twice gives the same view and writes nothing" | 15 | Twice a day apart on a fake clock: the same view, no write, no limit, no fetch | Store the decision on open |
| T20 | `business-graph.test.ts` › "boardGraphOf in %s" › "adds Colour with its two edges" | 12 | One node and two edges more than the base board; the new edges are exactly `competitive-frame` to `color` and `identity-frame` to `color`, with one input each | Drop the `competitive-frame` require |
| T21 | `business-text.test.ts` › "expression lines" | 2, 3, 5, 8 | The reasons filled with points and family words; the crowded families joined by `Intl.ListFormat` in each locale; `business.decision.rule` with the rule id | Join the crowded families with a comma |
| T22 | `business-strings.test.ts` › "expression, colour strings" | 16 | PR 1's keys in both languages word for word; every `business.color.family.*` for each `HueFamily`; no middot or em dash | Edit one catalog line |
| T23 | Stories `ColorPartly`, `ColorDecided`, `ColorLineupInvalid`, `ColorWaits`, `ExpressionUntrustedText` (each with its English story), `ColorFallback`, `ColorBothCrowded`, `ColorMarks`, `ColorSwitchToEnglish`, `ColorSwitchToThai`, `ColorNarrow`, `ColorNarrowDark`, `ColorNarrowEnglish`, `Board`, `BoardEnglish`, with play | 2 to 8, 11 to 14 | The rows' lines; one call for a double press; markup as literal text; no remount on a language switch; letter spacing `normal` or `0px` on Thai; `expectFitsAt360`; the a11y addon | Render a competitor name as HTML |
| T24 | `foundation.test.ts` › "typography entry" | 17 | Section 3's row 17 results | Accept a `typography` `skipped` |
| T25 | `expression.test.ts` › "typography" › "families per script" | 19 | W7 for each answer; Thai first; `pairing` for `thai-latin` only; `because` on the Thai families only | Put Inter before Sarabun |
| T26 | `expression.test.ts` › "typography families carry a recorded licence" | 22 | Exactly `sarabun`, `anuphan`, `inter`; licence `OFL-1.1`; each `licenceFile` exists; no other id of `SUGGESTION_CANDIDATES` | Add `kanit` with no licence file |
| T27 | `foundation-marks.test.ts` › "allowed", "W8"; `view.test.ts` › "typography in the view", "expression marks" › "typography" | 18, 19, 21 | Allowed while no entry; W8 cases 3, 4 and 5 for typography; the saved answer and no family while blocked | Drop the `identity-frame` require |
| T28 | `access.test.ts` › "foundation entry shape" | 26 | The pair check takes (`typography`, `answered`) and refuses (`typography`, `skipped`) | Leave the pair check unwidened |
| T29 | `foundation-actions.test.ts` › "answer the scripts", "typography door" | 18, 23 | The entry saved, the log holds no answer; row 23's refusals | Allow a second answer |
| T30 | `data.test.ts` › "expression replay" › "typography" | 25 | As T19 | As T19 |
| T31 | `business-graph.test.ts` › "adds Typography with its edge"; `business-strings.test.ts` › "expression, typography strings" | 24, 26 | One node and one edge more than PR 1's board, the edge `identity-frame` to `typography`; PR 2's keys | Edit one catalog line |
| T32 | Stories `TypographyDecided`, `TypographyInvalid` (each with English), `TypographyScripts`, `TypographyMarks`, `TypographyNarrow`, `TypographySwitchToEnglish`, `Board` | 18 to 21, 24 | The rows' lines in both languages; 360 px light and dark; the a11y addon | Preset the scripts to "Thai and Latin" |
| T33 | `foundation.test.ts` › "logo type entry" | 27 | Section 3's row 27 results | Accept `appIcon` as text |
| T34 | `expression.test.ts` › "name length", "logo type rule" | 28 | W5's counts and verdicts, W6's decisions | Count UTF-16 units |
| T35 | `foundation-marks.test.ts` › "allowed", "W8"; `view.test.ts` › "expression marks" › "logo type waits", "logo type provisional" | 31, 32, 33 | Refused for a long name, allowed with no name; W8 whole for the three nodes; rows 32 and 33 as data | Drop the long-name clause |
| T36 | `view.test.ts` › "expression, no AI label" | 37 | Over every expression fixture, the view JSON holds none of the six AI keys of `expression-honest-1` and no model id | Label a decision `evidence.fromModel` |
| T37 | `access.test.ts` › "foundation entry shape"; `foundation-actions.test.ts` › "answer the app icon", "a long name needs no app icon answer", "logo type door" | 29, 31, 34, 39 | The pair (`logo-type`, `answered`); the entry saved, the log holds no name; the long name refused as `invalid-input`; row 34's refusals | Allow the answer for a long name in the door only |
| T38 | `data.test.ts` › "expression replay, all three" | 38 | As T19 with a lineup, a personality, a typography and a logo type entry | Recompute and store on open |
| T39 | `business-graph.test.ts` › "adds Logo type with its two edges"; `business-strings.test.ts` › "expression, logo type strings" | 36, 39 | One node and two edges more than PR 2's board, the edges `architecture` and `name` to `logo-type`; with `core-idea` in the view, twelve nodes and eighteen edges; PR 3's keys | Drop the `name` require |
| T40 | Stories `LogoTypeWordmark` (with English), `LogoTypeSymbol`, `LogoTypeLongName`, `LogoTypeWaits`, `LogoTypeMarks`, `LogoTypeNarrow`, `LogoTypeSwitchToEnglish`, `ExpressionUntrustedText`, `ExpressionNoAi`, `Board` | 29 to 33, 35 to 37 | The rows' lines; the hostile name as literal text in the length line; no AI label or other number over all three views; 360 px; the a11y addon | Render the name length line as HTML |

Each row of the spec has a test: 1 (T1 to T3), 2 (T6, T13, T23), 3 (T17, T18, T23), 4 (T4, T23), 5 and 6 (T6, T7, T13), 7 (T13), 8 (T14), 9 (T5 and the gate's diff), 10 (T16 to T18), 11 to 14 (T20, T23), 15 (T19), 16 (T8, T16, T22, the gate), 17 (T24), 18 to 21 (T25, T27, T29, T32), 22 (T26), 23 (T29), 24 (T31, T32), 25 (T30), 26 (T28, T31), 27 (T33), 28 (T34), 29 to 34 (T35, T37, T40), 35 to 37 (T36, T39, T40), 38 (T38), 39 (T37, T39).

## 14. Impact list

- **`packages/intent-engine`.** New `business/expression.ts` and its test. `foundation.ts`: three arms in the entry and stored contracts, `newestByNode`'s slots, one mapper clause, `TYPOGRAPHY_SCRIPTS`. `foundation-marks.ts`: `ROOT_IDS` and `RootId` (so `MarkRef`, `FoundationRoots` and every `MarkGraph.number` widen), three nodes in `FOUNDATION_NODES`, `FOUNDATION_REQUIRES`, `MARK_NUMBERS` (so `FoundationNodeId` and `FOUNDATION_EDGES` widen), `ownStatus`, `entryAllowed`, `foundationState.expression`. `view.ts`: three `FoundationNode` arms, `FoundationFieldKey`, `FoundationStateKey`, `expressionLines`. `index.ts`. Unchanged: `color-rules.ts`, `color-audit.ts`, `color-knowledge.ts`, `rules.ts`, `COLOR_RULES`, `COLOR_NODE_VERSION`, `PERSONALITY_AXES`, `suggest.ts`, `intake.ts`, `place.ts`, `positioning.ts`, `MODEL_JOBS`, `AI_MODELS`. New public contracts: `checkLineupRows`, `colorOf`, `colorOutcome`, `colorCandidates`, `TYPOGRAPHY_FAMILIES`, `TYPOGRAPHY_SCRIPTS`, `typographyOf`, `nameLength`, `isLongName`, `LONG_NAME_OVER`, `logoTypeOf`, `expressionOf`, `ROOT_IDS`.
- **Readers of the widened types re-checked:** `business-text.ts` (`NODE_KEY`, `foundationStateLine`), `business-graph.ts` (`BUSINESS_POSITIONS`), `foundation-view.tsx` (dispatch, `FoundationEditor`), `business-board.tsx` (no change expected), `foundation-fixtures.ts` (no change: its views gain the three nodes through `toBusinessView`), `foundation.stories.tsx` and `business-board.stories.tsx` (node counts), `business-graph.test.ts`, `business-text.test.ts`, `apps/web/app/business/[projectId]/page.tsx` and `page.test.tsx` (no change; the catalog keys turn the test green), `ProjectBoard.tsx` (no change), `packages/auth/src/foundation.ts` (comment only).
- **`packages/db`.** `schema/business.ts` (the pair check per PR, the lineup check in PR 1), three migrations with meta, `access.test.ts`. No new table or column; `TENANT_TABLES`, `CLASSIFICATION` and `classification.test.ts` unchanged.
- **`packages/auth`.** No behaviour change; `foundation.integration.test.ts` gains the rows' cases.
- **`apps/web`.** No source change; `foundation-actions.test.ts` and `data.test.ts` gain the rows' cases.
- **`packages/design-system`.** Three node views, `expression-parts.tsx`, `expression-fixtures.ts`, `expression.stories.tsx`; `foundation-view.tsx`, `business-graph.ts`, `business-text.ts` and their tests; the catalog's keys of "Strings". No new shared component, no token and no profile change. Two shared changes, recorded in design.md section 2.6: the present label of the `ds-node` recipe in `packages/design-system/src/recipes/recipes.css` (a size container; under 10rem the kind glyph and the open glyph are not drawn) with its present-board line in `packages/design-system/catalog/application/canvas-node.yaml`, and the fit padding of `packages/design-system/src/components/canvas-board/CanvasBoard.tsx` (`firstFit` and `board.zoom-to-fit`) going from 0.2 to 0.15 on every board, edit and present.
- **Docs.** None beyond these notes; section 16 lists the spec lines read one way.
- **Not added.** No dependency, env var, external service, model job, Storage object, route, limit or number.

## 15. For the `security` review

- **Access.** One existing route, `business/enterFoundation`, behind the session, the ORV-268 approved list and `LIMITS.write`, then `withWorkspace` with the workspace from the session, the project row lock and the workspace condition on every select (ADR 0002; rules 1, 2 and 6). No new route, limit or number.
- **One 404 body** for another workspace's project and an unknown id, at the action and at the page, unchanged (rule 9).
- **Input.** Each new arm is strict at the entry and the payload; `lineupSchema` is strict per entry, bounds the list at 20, each name at 60 characters and each hex to `#RRGGBB`, and refuses a repeated name; U+0000 is dropped before it (E6). The service inserts the named columns of the checked entry, never a spread body (rule 3). The database bounds the lineup again (E7); the pair check refuses any pair the app has not built.
- **Untrusted text.** Competitor names and colours, and the working name in the length line, render as text nodes in `bdi`, never HTML, a link or a CSS value (rows 11 and 35). No log line or error body holds them; an `EntryProblem` holds a path (with a row index) and a kind (rule 8). The names come only from the person's own entry, never from the `alternatives` answer, the AI reading or any model output (`lineup-input-1`). `payload` and `created_by` stay `personal` (rule 11).
- **No model.** No module of this story imports `openrouter` or `llm-interpreter` (T8); no entry row holds a model id (T36). Decisions are computed by pure functions on the server for the app and in the browser only for Storybook fixtures; no client code reads the database.
- **Bounds on work.** A project holds at most one row per pair; `decideColor` runs once per view build over at most 20 entries; `nameLength` segments at most 60 UTF-16 units.

## 16. Spec points this design reads one way

These are spec lines the notes read in one way; the spec is not changed here. The main session decides whether to amend them.

**Resolved, 2026-11-20 (task ORV-298-spec-2).** The spec's v1.1 amends the first three points below as these notes read them: the pair check alone is widened, PR 1's migration also adds the check that bounds the lineup, and row 36 states its count both ways (twelve nodes and eighteen edges with ORV-296 in `develop`, eleven and sixteen without). The quotes below are the spec's earlier text. The last two points stand as readings.

- **"The `node` check".** `expression-entry-1` ("The table's checks on `node` and on the pair"), "Impact on contracts", Storage ("widens the `node` check and the pair check"), and row 16 ("widens the `node` and pair checks", which rows 26 and 39 take as "Gate as row 16") name a check the table does not have (ORV-291 tech notes section 4.1, correction of task ORV-291-spec-3). Read as: each migration widens the pair check.
- **"By its pair only".** Row 16 says PR 1's migration widens the checks "by (`competitive-frame`, `lineup`) only". PR 1's migration also adds the lineup check (E7). Read as: the pair set grows by that one pair; a bound on the new payload is part of the same change.
- **Row 36's twelve nodes and eighteen edges** hold only with ORV-296 in `develop`, while "Delivery" says PR 3 does not wait on ORV-296. T39 asserts the new edges by name and the counts relative to PR 2's board, and twelve and eighteen when `core-idea` is in the view; without it the board has eleven nodes and sixteen edges.
- **Row 9's "unchanged"** for the four ORV-20 files is a check on the diff, not a unit test; the gate's `git diff --stat` in A2's `done_when` carries it, and `color-rules.test.ts` and `color-audit.test.ts` run unedited in the engine suite.
- **Signature lines together.** `color-node-1` shows `business.color.waitsForLineup` while `lineup` is asked and `business.color.needsPersonality` while an axis is asked; with neither personality nor lineup, both show (section 6.1).

## Changelog

- 2026-11-20: first version, task ORV-298-tech-1, from the spec's rules, rows and W1 to W8, ORV-291's spec and tech notes, ORV-20's spec, ADR 0002, ADR 0015, ADR 0017, `.claude/rules/security.md`, and the code of `color-rules.ts`, `color-audit.ts`, `rules.ts`, `color-fixtures.ts`, migrations 0015 and 0016, `packages/db/src/schema/business.ts` on this branch, and PR 234's head (`60f3c1b`): `business/foundation.ts`, `foundation-marks.ts`, `view.ts`, `packages/auth/src/foundation.ts`, `foundation-actions.ts`, `foundation-view.tsx`, `foundation-parts.tsx`, `architecture-view.tsx`, `business-graph.ts`, `business-text.ts`, `business-board.tsx`, and ORV-295's task B1 report. zod 4.6.6's string `max` was checked to count code points.
- 2026-11-20: bookkeeping by the main session after the spec's v1.1 (task ORV-298-spec-2): the front matter names v1.1, section 4 and section 16 say which of the spec points are resolved. No design change.
- 2026-11-20: task ORV-298-tech-r3, finding R3-1 of ORV-298-review-3: the last sentence of the E11 row (section 1) and of the `packages/design-system` bullet of section 14 now name the two shared changes of design.md section 2.6, the `ds-node` present label with its `canvas-node.yaml` line and the `CanvasBoard` fit padding from 0.2 to 0.15, where they said no shared component, recipe or catalog entry changes. No other change.
