---
issue: ORV-302 (https://tpetkaew.atlassian.net/browse/ORV-302)
spec: docs/specs/ORV-302/spec.md v1.1
adr: none new; the design stays inside ADR 0002 (server-only data access through `withWorkspace`), ADR 0015 decisions 2, 6 and 10, and the route list of ORV-141 (`packages/auth/src/log.ts`), which it does not change
task: ORV-302-tech-1, revised by ORV-302-tech-2
author: architect
date: 2026-11-20
---

# ORV-302 tech notes: the first brand guidebook, assembled by fixed rules from the business board

These notes design what the spec leaves to the architect, for the two PRs of its "Delivery: two PRs": the `Guidebook` type and the assembly `guidebookOf`, field by field, with the fixed data it owns and where each field is copied from in `BusinessView`; how the "Not yet confirmed" list is read from the marks the view already carries; the route, its read and its log name; what the board and the project page gain for the link; the props of the guidebook example screen; how PR 1 reads the three expression nodes of ORV-298, and how PR 2 adds the drafted positioning of ORV-292. They use the spec's default for each of its twelve open questions (G1, ORV-302 comment 10785; open question 3's default (d) by comment 10786); section 11 names where another answer changes the design.

**What is real.** Nothing here is built yet. Every file and test below is a design for the builder. No part calls a model, in either PR; no test reaches a model or the internet.

**The base.** PR 1 builds on `develop` once ORV-298 (PR 237, its three parts `color`, `typography`, `logo-type`) is merged into it, and `develop` is merged into this branch before its first builder task. Read for these notes: `develop` at `95116d7` (ORV-296 merged: the nine board nodes, `business/view.ts` with the four foundation arms, `business/foundation-marks.ts`, `apps/web/app/business/data.ts` (`loadProject`), `[projectId]/page.tsx`, `[projectId]/ProjectBoard.tsx`, `packages/auth/src/log.ts` and the examples `business-board.tsx`, `business-text.ts`, `foundation-view.tsx`), and ORV-298 at PR 237's head `02b6cfe`, read only: `business/view.ts` with the three arms `logo-type`, `color`, `typography`, `business/expression.ts` and `examples/expression-parts.tsx`. PR 2 builds on `develop` once ORV-292 and PR 1 are in it.

**One rule holds the design together.** The guidebook computes nothing the board computes. Every state, mark, value, question and label of the guidebook is copied from the one `BusinessView` the board is drawn from, or is fixed data of the guidebook module. So the guidebook and the board cannot disagree, and a rule change shows in both at once.

## 1. Decisions in short

<!-- prettier-ignore -->
| # | Question | Choice | Why not the other way | Confirmed by |
| --- | --- | --- | --- | --- |
| G1 | Where the assembly lives | One new engine module, `packages/intent-engine/src/business/guidebook.ts`: `guidebookOf(view: BusinessView): Guidebook`, the `Guidebook` type and its fixed data (section 3), re-exported from `src/index.ts` | The engine is the one package both the app route and the example screen's stories can import; the view lives there already, so the assembly sits beside the one thing it reads | `guidebook.test.ts` |
| G2 | What the assembly reads | Only the `BusinessView` argument and its own constants. It calls none of `toBusinessView`, `foundationLines`, `expressionLines`, `foundationState`, `foundationRoots`, `foundationMarks`, `propagateMarks`, `positioningGate`, `nodeStates`, `expressionOf`, `colorOf`, `typographyOf` or `logoTypeOf`; it imports `MARK_NUMBERS` from `foundation-marks.ts` as data, for one sort, and `./expression` for types only | A second marks or rules run could disagree with the board after any rule change; copying cannot | `guidebook.test.ts` › "pure: no model, no clock" (the call list), › "the guidebook and the board agree" |
| G3 | The shape | Keys and values only (section 3). An item copies its board state key, its three mark lists and its value fields from its view node, and adds four things the board shows elsewhere or not at all: `status`, `method`, `rules`, `hypothesis`, plus the open item's `notes` and `questions` | The view holds keys and values; the guidebook keeps that, so a language switch redraws with no second load (row 14), and the data the client receives holds no resolved text and no reading | `guidebook.test.ts` › "no AI label, no claim" (no catalog line in the JSON) |
| G4 | "Not yet confirmed" | Read from the view: `view.positioning.skipped`, and each `view.foundation` node whose `result` is `open` with `skipped`; the items resting on a step are the done items whose copied `restsOn` or `unchecked` names it (section 4.5) | The view's `result` is the marks' own output and its `restsOn` and `unchecked` are the lines the board shows; a list built from them is the board's list | `guidebook.test.ts` › W2 cases B to E (PR 1) |
| G5 | Where the page reads | `apps/web/app/business/[projectId]/guidebook/page.tsx`, a server component, `dynamic = "force-dynamic"`, calling the existing `loadProject(projectId)` and then `guidebookOf(loaded.view)`. `data.ts` does not change | `loadProject` already holds the session, the approved list, `withWorkspace` with role `member`, the UUID check and the one `not-found`; a second loader would be a second door to audit | `guidebook/page.test.tsx` |
| G6 | The log name of the guidebook's read | The board's: `business/openProject`. `ROUTES` does not change (section 5.2) | The read is the board's read, call for call; a new name costs a change to `data.ts`, `log.ts` and `log.test.ts`, which pins the list in order, for a split no one reads in the POC | `guidebook/page.test.tsx` › "renders the guidebook of the project" (the line's route) |
| G7 | Where `guidebookOf` runs | On the server, in the page. The client screen receives the `Guidebook`, never the `BusinessView` | The view carries every AI reading with its model id, and the colour's lineup with its hex values; the guidebook carries neither (row 9, section 4.3), so the client gets less data and no reading | `guidebook/page.test.tsx` › "renders the guidebook of the project" |
| G8 | The link from the board | `BusinessBoardScreenProps` gains `guidebookHref?: string`; `[projectId]/page.tsx` builds `/business/<projectId>/guidebook` in its ready branch and passes it to `ProjectBoard`, which passes it on (section 6) | The board example knows no route today (its hrefs come from its caller); the page is where routes are built | `[projectId]/page.test.tsx` › "links to the guidebook"; story `Board` |
| G9 | The screen | One new example screen, `packages/design-system/src/examples/guidebook.tsx` (`GuidebookScreen`), with its own text helpers in `guidebook-text.ts`, fixtures in `guidebook-fixtures.ts` and stories in `guidebook.stories.tsx`. No shared component changes | New files keep this story out of the files ORV-292 changes, and leave every file ORV-298 brought into `develop` as it is (section 9) | The stories |
| G10 | PR 1 after ORV-298 | PR 1 starts once ORV-298 (PR 237) is in `develop`: `logo-type`, `color` and `typography` read ORV-298's view arms (section 4.3); `logo-mark` stays fixed data with `business.guidebook.notYet.logoMark`; PR 2 adds only the positioning states of ORV-292 (section 8). Spec "Delivery: two PRs" and open question 3 (d), comment 10786 | A PR 1 before ORV-298 would show a placeholder line on three items the board already shows once ORV-298 lands before PR 2, and would copy four of ORV-298's catalog keys; waiting on PR 237 needs neither | `guidebook.test.ts` › "sections and their order" (three visual items derived, `logo-mark` not in this version); section 12 (the order of the tasks) |
| G11 | New dependency, env var, service, table, column, limit, route name or model job | None | | Section 14 |

## 2. Where each part lives

<!-- prettier-ignore -->
| Path | Holds | PR |
| --- | --- | --- |
| `packages/intent-engine/src/business/guidebook.ts` (new) | Section 3's type and constants; `guidebookOf` (section 4) | 1 (2 only if ORV-292's view changes a type it copies, section 8) |
| `packages/intent-engine/src/business/guidebook.test.ts` (new) | T1 to T13 and T33 to T35, then T36 and T37 | 1, grown in 2 |
| `packages/intent-engine/src/index.ts` | `export * from "./business/guidebook";` | 1 |
| `apps/web/app/business/[projectId]/guidebook/page.tsx` (new) | The route (section 5) | 1 |
| `apps/web/app/business/[projectId]/guidebook/page.test.tsx` (new) | T14 to T17 and T38 | 1 |
| `apps/web/app/business/[projectId]/page.tsx`, `page.test.tsx` | The guidebook's address for the board; T18 | 1 |
| `apps/web/app/business/[projectId]/ProjectBoard.tsx` | Takes `guidebookHref` and passes it to `BusinessBoardScreen` | 1 |
| `packages/design-system/src/examples/guidebook.tsx` (new) | `GuidebookScreen` (section 7), with the four visual items | 1, grown in 2 (the picked and edited labels) |
| `packages/design-system/src/examples/guidebook-text.ts`, `guidebook-text.test.ts` (new) | `itemTitle`, `guidebookStateLine`, `questionLine`, `noteLine`, `notHeldLines` (section 7.2) | 1 |
| `packages/design-system/src/examples/guidebook-fixtures.ts`, `guidebook.stories.tsx` (new) | Labelled fixture projects and the stories the spec names | 1, grown in 2 |
| `packages/design-system/src/examples/business-board.tsx`, `business-board.stories.tsx` | The `guidebookHref` prop and its link; the `Board` play reads it | 1 |
| `packages/design-system/src/examples/business-text.ts` | `provisionalLines` and `uncheckedLine` take `Pick<FoundationNode, "restsOn">` and `Pick<FoundationNode, "unchecked">`; no behaviour change | 1 |
| `packages/design-system/src/examples/index.ts` | Exports `GuidebookScreen` and `GuidebookScreenProps` | 1 |
| `packages/design-system/catalog/coverage.md` | A "Page examples" row: `Brand guidebook (ORV-302)`, `application`, `draft`, `examples-application-brand-guidebook` | 1 |
| `packages/design-system/src/i18n/messages/en.ts`, `th.ts`; `src/i18n/business-strings.test.ts` | The keys of "Strings"; one `describe` "guidebook, strings" | 1 |

## 3. The `Guidebook` type and the fixed data (`business/guidebook.ts`, PR 1)

Every member is a key, an id or a value copied from the view; nothing holds resolved catalog text. The code is a sketch the builder types; names are the contract the screen and the tests read. The visual members read the types ORV-298 brought into `develop` (`expression.ts`, the three `FoundationNode` arms of `view.ts`).

```ts
import type { PersonalityAxis } from "../knowledge";
import type { ColorOutcome, LogoTypeOutcome, TypographyOutcome } from "./expression";
import type { AxisValue } from "./foundation";
import {
  type AxisPoint,
  type DerivedArchitecture,
  type FoundationNodeId,
  MARK_NUMBERS,
  type MarkRef,
} from "./foundation-marks";
import type { BusinessNodeId } from "./place";
import type { BusinessNodeState, BusinessView, FoundationStateKey } from "./view";

/** guidebook-sections-1: the members of each part, in order. */
export const GUIDEBOOK_LEAD = [
  "situation",
  "business-core",
  "audience",
  "competitive-frame",
] as const satisfies readonly BusinessNodeId[];
export const GUIDEBOOK_FOUNDATION = [
  "positioning",
  "identity-frame",
  "architecture",
  "name",
  "core-idea",
] as const;
export const GUIDEBOOK_VISUAL = ["logo-type", "logo-mark", "color", "typography"] as const;
/** guidebook-not-held-1 (W3): ORV-126's nodes outside the POC set, in node number order. */
export const GUIDEBOOK_NOT_HELD = [
  "audit",
  "verbal",
  "look-feel",
  "expression-kit",
  "ip-screen",
  "touchpoints",
  "validation",
  "launch",
] as const;

export type GuidebookLeadId = (typeof GUIDEBOOK_LEAD)[number];
export type GuidebookItemId =
  (typeof GUIDEBOOK_FOUNDATION)[number] | (typeof GUIDEBOOK_VISUAL)[number];
export type GuidebookNotHeldId = (typeof GUIDEBOOK_NOT_HELD)[number];

/** A key of business.question.*: the question text of guidebook-open-1. */
export type GuidebookQuestionKey =
  | "business.question.only"
  | "business.question.person"
  | "business.question.never"
  | "business.question.subBrands"
  | "business.question.remember"
  | "business.question.appIcon"
  | "business.question.lineup"
  | "business.question.scripts";

/** guidebook-open-1, the table "Question keys"; the visual items apply theirs by section 4.3. */
export const GUIDEBOOK_QUESTIONS = {
  positioning: ["business.question.only"],
  "identity-frame": ["business.question.person", "business.question.never"],
  architecture: ["business.question.subBrands"],
  name: [],
  "core-idea": ["business.question.remember"],
  "logo-type": ["business.question.appIcon"],
  "logo-mark": [],
  color: ["business.question.lineup"],
  typography: ["business.question.scripts"],
} as const satisfies Record<GuidebookItemId, readonly GuidebookQuestionKey[]>;

/** guidebook-item-1, the column "Hypothesis label": shown on a done item only. */
export const GUIDEBOOK_HYPOTHESIS = {
  "identity-frame": "business.identity.hypothesis",
  "logo-type": "business.logoType.hypothesis",
  color: "business.color.hypothesis",
  typography: "business.typography.noPersonalityLink",
} as const satisfies Partial<Record<GuidebookItemId, string>>;
export type GuidebookHypothesisKey =
  (typeof GUIDEBOOK_HYPOTHESIS)[keyof typeof GUIDEBOOK_HYPOTHESIS];

/** The one rule id `TypographyOutcome` does not carry (guidebook-item-1, column "Rule id"). */
export const TYPOGRAPHY_RULE = "typography-node-1";

/** The board's state line of an item or a lead line: a key of business.state.*. */
export type GuidebookStateKey = BusinessNodeState | FoundationStateKey;

/** guidebook-item-1: an item is done when its board state line is one of these. */
export const DONE_STATES = [
  "agreed",
  "given",
  "derived",
  "partly",
] as const satisfies readonly GuidebookStateKey[];

/** Departure 9: who or what made a done item. `ai-draft-picked` is reachable only once ORV-292 ships. */
export type GuidebookMethod = "person" | "rule" | "ai-draft-picked";

type ColorOpen = Extract<ColorOutcome["signatureOpen"], { why: "bothCrowded" }>;

/** A line under an item's state line, beyond its questions (guidebook-open-1). */
export type GuidebookNote =
  | { key: "business.architecture.notInVersion" }
  | { key: "business.guidebook.notYet.logoMark" }
  | { key: "business.positioning.stale" }
  | { key: "business.color.waitsForLineup" }
  | { key: "business.color.needsPersonality" }
  | { key: "business.color.bothCrowded"; first: ColorOpen["first"]; second: ColorOpen["second"] }
  | { key: "business.color.notDecided" };

/** A done item's value, one arm per item, copied from its view node (sections 4.2 and 4.3). */
export type GuidebookValue =
  | {
      id: "positioning";
      statement: {
        text: string;
        label:
          | "business.positioning.by.own"
          | "business.positioning.by.picked"
          | "business.positioning.by.edited";
        modelId: string | null;
      };
    }
  | {
      id: "identity-frame";
      person: string | null;
      never: string | null;
      axes: Array<{ axis: PersonalityAxis; value: AxisValue; point: AxisPoint }>;
    }
  | { id: "architecture"; derived: DerivedArchitecture }
  | { id: "name"; name: string }
  | {
      id: "core-idea";
      statement: { text: string; label: "business.positioning.by.own" };
      remember: string | null;
    }
  | { id: "logo-type"; decision: LogoTypeOutcome }
  | {
      id: "color";
      decisions: Pick<ColorOutcome, "signature" | "neutral" | "canvas">;
      points: null | Record<"expressive" | "warm" | "premium", AxisPoint>;
    }
  | { id: "typography"; faces: TypographyOutcome };

type ItemLines = {
  id: GuidebookItemId;
  /** The board's state line. */
  state: GuidebookStateKey;
  /** `{nodes}` of business.state.waiting; empty unless `state` is `waiting`. */
  waitingFor: MarkRef[];
  /** With strategy.provisional and business.marks.restsOn; already filtered by the view. */
  restsOn: MarkRef[];
  /** With business.marks.unchecked; already filtered by the view. */
  unchecked: MarkRef[];
  notes: GuidebookNote[];
  /** Shown under business.stillToAsk; empty when the item asks nothing now. */
  questions: GuidebookQuestionKey[];
};

export type GuidebookItem = ItemLines &
  (
    | { status: "open"; method: null; rules: []; hypothesis: null; value: null }
    | {
        status: "done";
        method: GuidebookMethod;
        /** The rule ids shown by business.decision.rule, in the item's order. */
        rules: string[];
        hypothesis: GuidebookHypothesisKey | null;
        value: GuidebookValue;
      }
  );

/** One step of "Not yet confirmed" (guidebook-unconfirmed-1). Its state line is always business.state.skipped. */
export type GuidebookStep = {
  id: "positioning" | FoundationNodeId;
  questions: GuidebookQuestionKey[];
  /** The done items that rest on it, in item order; empty gives business.guidebook.unconfirmed.nothing. */
  restingOn: Array<{ id: GuidebookItemId; mark: "restsOn" | "unchecked" }>;
};

export type Guidebook = {
  method: "rule-based";
  projectName: string;
  /** ISO time, as the view holds it; the screen formats it. */
  savedAt: string;
  lead: Array<{ id: GuidebookLeadId; state: BusinessNodeState }>;
  /** GUIDEBOOK_FOUNDATION order. */
  foundation: GuidebookItem[];
  /** GUIDEBOOK_VISUAL order. */
  visual: GuidebookItem[];
  /** Node number order (MARK_NUMBERS); empty gives business.guidebook.unconfirmed.none. */
  unconfirmed: GuidebookStep[];
  notHeld: GuidebookNotHeldId[];
};

export function guidebookOf(view: BusinessView): Guidebook;
```

- **No member is optional.** An empty list is `[]` and an absent value is `null`, so `JSON.parse(JSON.stringify(g))` deep-equals `g` and the server component can hand it to the client screen as props unchanged (T12).
- **`rules` as `string[]`.** PR 1 holds all four kinds of rule id the board shows: `architecture-derive-1`, `logo-type-1`, `typography-node-1` and the colour rule ids, which are ORV-20 rule ids (strings such as `color.signature.lime-warm`).
- **The reading is not carried.** No member holds `view.reading`, `nodes[].fields`, `nodes[].notes`, `nodes[].stillToAsk` or a field reading, so no AI reading and no model id can reach the guidebook data; the one model id it can hold is the positioning statement's, once ORV-292 stores drafts (PR 2, open question 10).

## 4. The assembly `guidebookOf` (PR 1)

### 4.1 The header and the lead block

<!-- prettier-ignore -->
| Field | Copied from | Rule |
| --- | --- | --- |
| `method` | fixed `"rule-based"` | `guidebook-assembly-1` |
| `projectName` | `view.projectName` | as typed; rendered as text |
| `savedAt` | `view.savedAt` | the screen formats it with `formatSavedAt` |
| `lead[i].id` | `GUIDEBOOK_LEAD[i]` | `guidebook-sections-1` item 2 |
| `lead[i].state` | `view.nodes.find((n) => n.id === id).state` | the board's state line, nothing else (open question 6) |
| `notHeld` | `[...GUIDEBOOK_NOT_HELD]` | the same on every project |

A node the view lacks is a programming error: `guidebookOf` throws `Error("guidebook: the view has no <id>")`, a message with an id and no value.

### 4.2 The foundation items

`positioning` reads `view.positioning` and `view.nodes`; the four others read their arm of `view.foundation` by `id`.

<!-- prettier-ignore -->
| Item field | `positioning` | `identity-frame`, `architecture`, `name`, `core-idea` |
| --- | --- | --- |
| `state` | `view.nodes` positioning `.state` (`agreed`, `skipped`, `proposed`, `empty`, `awaitingChoice`) | `node.state` |
| `waitingFor` | `[]` (a root waits for nothing) | `node.waitingFor` |
| `restsOn` | `[]` | `node.restsOn` |
| `unchecked` | `[]` | `node.unchecked` |
| `status` | `done` when `state` is in `DONE_STATES` (here `agreed`, which is `gatePassed`), else `open` | the same rule |
| `value` (done) | `statement` from `view.positioning.statement` (`text`, `label`, `modelId`) | `identity-frame`: `node.person`, `node.never`, `node.axes`; `architecture`: `derived` is `node.value`; `name`: `node.name`; `core-idea`: `node.statement`, `node.remember` |
| `method` (done) | `ai-draft-picked` when the label is `by.picked` or `by.edited`, else `person` | `person` for `given` and `agreed`, `rule` for `derived` |
| `rules` (done) | `[]` | `architecture`: `[node.value.rule]`; else `[]` |
| `hypothesis` (done) | `null` | `GUIDEBOOK_HYPOTHESIS[id] ?? null` (`identity-frame` only) |
| `notes` | `[{ key: "business.positioning.stale" }]` while `view.positioning.stale`, else `[]` | `architecture` with state `notInVersion`: `[{ key: "business.architecture.notInVersion" }]`; else `[]` |
| `questions` | `GUIDEBOOK_QUESTIONS.positioning` while not done and `state` is not `awaitingChoice`; else `[]` | `GUIDEBOOK_QUESTIONS[id]` while `state` is `empty` or `skipped`; else `[]` |

- **Not copied:** `result`, `fields`, `controls`, `subBrands`, `gate`, `skipped` and `gatePassed` of a foundation node; `controls` and `gate` of `view.positioning`. The architecture's stored answer is never copied, so a waiting architecture shows no answer (`guidebook-open-1`). The guidebook changes nothing, so no control is carried.
- **A done item with no value** (a `given` personality with `axes` null, a `given` name with `name` null, an `agreed` core idea with no statement, a `derived` architecture with `value` null, an agreed positioning whose statement is null or carries `business.positioning.stale`, and the visual cases of section 4.3) cannot come out of `toBusinessView`; `guidebookOf` throws a closed message for it, as for a missing node. T3 runs every fixture through both functions, so a view change that breaks the invariant turns a test red.
- **Fixed lines the screen adds, not data:** on a done `positioning` `business.positioning.gatePassed`; on a done `core-idea` `business.coreIdea.gatePassed`; on a done `architecture` `business.architecture.because`; on a done `name` `business.name.notScreened`; on `person`, `never` and `remember` `business.label.yourWords`. These are the labels the node's own view shows (`guidebook-item-1`); the screen places them by `value.id`. A done item's optional field that is `null` (in the done project, the personality's `never`) shows its `business.field.*` name with `business.state.empty` (`guidebook-item-1`, the sentence under its table).

### 4.3 The visual items

`logo-type`, `color` and `typography` read their arm of `view.foundation` by `id`, as ORV-298 built it; `logo-mark` is fixed data.

<!-- prettier-ignore -->
| Item field | `logo-type` | `color` | `typography` |
| --- | --- | --- | --- |
| `state`, `waitingFor`, `restsOn`, `unchecked` | the node's (`expressionLines`) | the node's | the node's |
| `status` | `done` when `state` is in `DONE_STATES` (`derived`), else `open` | `done` for `derived` and `partly`, else `open` | `done` for `derived`, else `open` |
| `value` (done) | `decision`: `node.decision` | `decisions`: `node.decisions`; `points`: `node.points` (not the lineup, not `crowded`, no hex) | `faces`: `node.faces` |
| `method` (done) | `rule` | `rule` (`derived` or `partly`) | `rule` |
| `rules` (done) | `[node.decision.rule]` | the `rule` of `signature`, `neutral`, `canvas`, each that is not null, in that order | `[TYPOGRAPHY_RULE]` |
| `hypothesis` (done) | `business.logoType.hypothesis` | `business.color.hypothesis` | `business.typography.noPersonalityLink` |
| `notes` | `[]` | unless `waiting`, in this order: `waitsForLineup` while `node.signatureOpen?.why === "waitsForLineup"`; `needsPersonality` while `node.needsPersonality`; `bothCrowded` with `first` and `second` while `node.signatureOpen?.why === "bothCrowded"`; `notDecided` while `node.notDecided` | `[]` |
| `questions` | `[appIcon]` while `state` is `needsAnswer` and `node.controls` holds `answer` ("only while the view offers it") | `[lineup]` while `node.signatureOpen?.why === "waitsForLineup"` and not `waiting` | `[scripts]` while `state` is `needsAnswer` |

- **`logo-mark`, the same on every project:** `{ state: "notInVersion", notes: [{ key: "business.guidebook.notYet.logoMark" }] }`, `open`, with empty mark lists, no questions and no value (`guidebook-open-1`, "Out of this version").
- **Not copied:** `result`, `fields`, `controls`, `appIcon`, `scripts`, `lineup`, `crowded`, `signatureOpen` (beyond the note it gives) and `needsPersonality`. The lineup and its hex values never reach the guidebook data (G7).
- **A done visual item with no value** (a `derived` logo type with `decision` null, a `derived` or `partly` colour with `decisions` null, a `derived` typography with `faces` null) throws the closed message of section 4.2.
- A `waiting` item shows its state line only, so a blocked colour shows no note even where its node carries `notDecided` (section 16).
- A `partly` colour is `done` with its decisions (some null) and also carries its open notes and question; the screen shows the decisions made and what the open one waits for (row 18).
- **Fixed lines the screen adds by `value.id`** (`guidebook-item-1`): `business.logoType.nameLength` (filled from `decision.name`, `decision.length` and `decision.max`), `crowdingNotChecked`, `otherTypes` on `logo-type`; `business.color.familyOnly` on `color`; `business.typography.licence`, `because.pairing`, `oneChoice` on `typography`. No competitor name and no colour value is in the data.

### 4.4 The open item's lines (`guidebook-open-1`)

The rules of 4.2 and 4.3 give exactly the spec's cases, read off the state line the item copied:

- **Waits for another step** (`waiting`): `waitingFor` only; `notes` and `questions` empty.
- **Waits for the person** (`empty`, `skipped`, `needsAnswer`; on `positioning`, `proposed` too): the questions of `GUIDEBOOK_QUESTIONS` by the conditions of 4.2 and 4.3; `name` has none and shows its state line only. A `partly` colour, though done, carries its open notes and question too.
- **Out of this version** (`notInVersion`): one note (`architecture` with an answer yes, and `logo-mark` always).
- **Positioning out of date** (`view.positioning.stale`): its state line, the note `business.positioning.stale`, the question, no statement.
- **Positioning waiting for a choice** (`awaitingChoice`, from ORV-292): the state line only; no question, no option, no label (`guidebook-open-1`, its last bullet).

### 4.5 "Not yet confirmed" (`guidebook-unconfirmed-1`)

```ts
const steps = [
  ...(view.positioning.skipped ? (["positioning"] as const) : []),
  ...view.foundation.filter((n) => n.result.status === "open" && n.result.skipped).map((n) => n.id),
].sort((a, b) => MARK_NUMBERS[a] - MARK_NUMBERS[b]);
const items = [...foundation, ...visual]; // item order
const unconfirmed = steps.map((id) => ({
  id,
  questions: [...GUIDEBOOK_QUESTIONS[id]],
  restingOn: items
    .filter((i) => i.status === "done" && (i.restsOn.includes(id) || i.unchecked.includes(id)))
    .map((i) => ({ id: i.id, mark: i.restsOn.includes(id) ? "restsOn" : "unchecked" })),
}));
```

- **Which skips.** `view.positioning.skipped` is true only with the gate `open` and skipped (`positioningGate`), which is exactly the root `positioning` the marks count as skipped (`foundationRoots`). A foundation node's `result` is the marks' own output; `open` with `skipped` is the skip its dependents see. Only `identity-frame` and `core-idea` can be so; no expression node is ever skipped. Nothing is recomputed: the list reads two flags the view carries and the mark lines the items copied.
- **Which items.** A done item's `restsOn` and `unchecked` are the lines the board shows for it. By the propagation rule a skipped step reaches a derived item through `provisionalOn` and a given item through `unchecked`, never both, so `mark` is well defined. A `partly` colour is done and carries both lists as a derived one does (`expressionLines`).
- **An empty value answer** (open question 11, default (a)): the board's positioning state is `skipped` (`node-state-1`) while `view.positioning.skipped` is false, so the item shows "Skipped for now" and its question, and the step is not listed.
- **W2 as data:** case B gives positioning with architecture (`restsOn`) and name (`unchecked`), then `identity-frame` and `core-idea` each with `restingOn: []`; cases C and E give `[]`; case D gives `[{ id: "positioning", restingOn: identity-frame unchecked, architecture restsOn, name unchecked, core-idea unchecked, logo-type restsOn, color restsOn, typography restsOn }]`. Case A, the foundation half of D, is no longer a row of its own.

## 5. The route (`[projectId]/guidebook/page.tsx`, PR 1)

### 5.1 The page

```tsx
export const dynamic = "force-dynamic";

export default async function GuidebookPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const loaded = await loadProject(projectId);
  if (loaded.access === "not-found") notFound();
  return (
    <main className="w-full">
      {loaded.access === "ready" ? (
        <GuidebookScreen
          access="ready"
          guidebook={guidebookOf(loaded.view)}
          boardHref={`/business/${projectId}`}
          signInHref="/account"
        />
      ) : (
        <GuidebookScreen access={loaded.access} signInHref="/account" />
      )}
    </main>
  );
}
```

- **The read.** `loadProject` is the board's loader, unchanged: the session read on the server, then `mayRead` (the ORV-268 approved list), then `businessService.open` inside `withWorkspace(..., "member", ...)` with the workspace from the session, never from the client. An id not in UUID form never reaches the database. Another workspace's project, an unknown id, an id of another form and a stored row that fails its schema all answer `{ access: "not-found" }`, and the page calls `notFound()`, the app's one 404 body (security rule 9). A row that fails its schema also writes an error line, as on the board.
- **No write, no limit, no model.** `loadProject` counts no limit and calls no model; `guidebookOf` is pure. The page writes nothing and sets no cookie.
- **No metadata from the project.** The page exports no `generateMetadata`; the document title stays the app's, so no project name reaches a title or a link preview.
- **The address of the back link** is built only in the ready branch, where `loadProject` has accepted `projectId` as a UUID, so the href holds no text the person typed.
- **The page needs no web catalog line** (`getWebMessages`): every line it shows comes from the design-system catalog through the screen.

### 5.2 The log name: `business/openProject`, reused

Each page load writes one boundary line, through `loadProject`'s `atBoundary`, with the route `business/openProject`, its outcome and reason, and no id, name or answer.

- **Why the board's name.** `ROUTES` names server entries (ORV-141), and this entry is the board's, call for call: the same loader, the same service call, the same rows and the same outcomes. Reusing it keeps `data.ts` unchanged, as the spec's impact section says, and keeps `log.ts` and `log.test.ts` ("pins the lists the spec names, in order") unchanged, so this story touches no file under `packages/auth/**`.
- **What it costs.** A log reader cannot tell a board open from a guidebook open. Nothing reads that split in the POC; the `durationMs` of the two is the same work.
- **If the split is wanted later:** `ROUTES` gains `business/openGuidebook` after `business/enterFoundation`; `loadProject(id, route: "business/openProject" | "business/openGuidebook" = "business/openProject")` passes it to `load`; the guidebook page passes the new name; `log.test.ts` and `data.test.ts` pin it. `security` reviews that change as a `packages/auth/**` diff.

## 6. The link from the board (PR 1)

- **`business-board.tsx`.** `BusinessBoardScreenProps` gains `guidebookHref?: string | undefined`. When it is set and `access` is `ready`, `ReadyBoard` renders one link named `business.board.openGuidebook` to it, an `<a href>` (through `Button asChild`, as the list link is). Absent, no link: every story and caller that does not pass it keeps today's board. Where the link sits in the header is the designer's.
- **`[projectId]/page.tsx`.** In its ready branch it passes `guidebookHref={`/business/${projectId}/guidebook`}` to `ProjectBoard`; the not-ready branch passes nothing.
- **`ProjectBoard.tsx`.** Its props gain `guidebookHref: string`, passed to `BusinessBoardScreen` as is. No state and no action change.
- **The way back.** The guidebook shows `business.guidebook.backToBoard` to `boardHref`. Both links are plain navigations; neither carries a query string.

## 7. The guidebook example screen (PR 1)

### 7.1 Props

```ts
export interface GuidebookScreenProps {
  access: BusinessAccess; // "ready" | "signed-out" | "not-allowed" | "not-configured"
  /** Where the sign-in link of the signed-out notice goes. */
  signInHref: string;
  /** guidebookOf's result. Required when `access` is `ready`, ignored otherwise. */
  guidebook?: Guidebook | undefined;
  /** The project's board, the back link. Required when `access` is `ready`. */
  boardHref?: string | undefined;
}
```

- **Not ready:** the access notice of `business-access.tsx` (`BusinessAccessNotice`), as the board shows it, with no guidebook content.
- **Ready:** throws, as the board does, when `guidebook` or `boardHref` is missing. It renders the content of `guidebook-sections-1` from the data alone; it decides no state, computes no mark and holds no state of its own beyond what a language switch needs (none: the catalog comes from `useMessages`).
- **No control.** No button, field or form; the two links are the only interactive elements, each reachable by Tab in reading order (rows 13, 15).
- **Untrusted text.** `projectName`, `statement.text`, `name`, `person`, `never`, `remember` and the logo type's `decision.name` (inside `business.logoType.nameLength`) render as text nodes inside `bdi` with `whitespace-pre-wrap`, never through `dangerouslySetInnerHTML`, never as a link or an attribute other than a `fill` result in a text node (row 12).
- **Headings.** One top heading (the title) and one heading per section (row 13); the levels, the layout, the look and the section order on the page are the designer's (the spec's `guidebook-sections-1` gives the order the designer starts from).
- **The positioning label in PR 1.** The screen shows `business.positioning.by.own` under an agreed statement whose label is `by.own`, and no label line for `by.picked` or `by.edited`, as the board on `develop` does today (`business-node-view.tsx`): those two keys come with ORV-292. PR 2 adds their line (section 8).
- **Reuse** is the designer's call within the spec's "Screens" list. `FoundationNodeView` and ORV-298's three expression views (`logo-type-view.tsx`, `color-view.tsx`, `typography-view.tsx`) take a `FoundationNode`, not a `GuidebookItem`, so they can be reused only for their parts (the mark lines through `provisionalLines` and `uncheckedLine`, the axis lines of `identity-frame-view.tsx`, `DecisionLine` of `expression-parts.tsx`); the screen does not rebuild a view node from an item.

### 7.2 `guidebook-text.ts`

- `itemTitle(m, id: GuidebookItemId | GuidebookLeadId)`: `nodeTitle` for the nine board nodes; `business.node.logoType`, `business.node.color`, `business.node.typography` (ORV-298's keys, in `develop`) and `business.node.logoMark` (this story's) for the visual items. A map of its own, so `NODE_KEY` in `business-text.ts` is not touched.
- `guidebookStateLine(m, locale, item | lead)`: `business.state.waiting` filled with `listOfNodes(waitingFor)` while `waiting`, else `m.business.state[state]` (`partly` and `needsAnswer` included).
- `questionLine(m, key: GuidebookQuestionKey)`: `m.business.question[key.slice("business.question.".length)]`.
- `noteLine(m, note: GuidebookNote)`: one `switch` over `note.key`; exhaustive, so a new arm is a compile error until handled. `bothCrowded` fills its two families as ORV-298's colour view does.
- `notHeldLines(m, id)`: `{ title, reason }` of `business.guidebook.notHeld.<id>`.
- The mark lines reuse `provisionalLines` and `uncheckedLine` of `business-text.ts`, whose parameter types widen to the one field each reads (section 2), so an item passes as it is.

## 8. PR 2: the drafted positioning

PR 2 starts once ORV-292 and this story's PR 1 are in `develop`. ORV-292's view gives the positioning state `awaitingChoice` and the labels `by.picked` and `by.edited` with the draft's model id, and its catalog the keys `business.positioning.by.picked` and `business.positioning.by.edited`.

- **The engine: no change expected.** PR 1 already maps `awaitingChoice` to an open item with no question and no value, and the labels `by.picked` and `by.edited` to `ai-draft-picked` with the statement's `modelId`, because both are members of `develop`'s view types today (`BusinessNodeState`, `PositioningView`). If ORV-292's view changes a type the guidebook copies, B1 changes `guidebook.ts` by members only, and T3 stays green.
- **The screen** gains the label line of a picked or edited statement, `business.positioning.by.picked` or `business.positioning.by.edited` with its model id, as the board shows it (open question 10, the one exception of `guidebook-honest-1`). No key of its own.
- **The proof.** T36 over ORV-292's real view: while a draft waits, the guidebook data holds no option text; once picked, the picked statement and its label, and options 1 and 3 nowhere. T37 grows T9 by row 20's states with the one exception; T41 the stories; T40 the gate.

## 9. Where this story meets ORV-298 and ORV-292

ORV-298 is in `develop` before PR 1 starts, so its files are read, not met: this story changes none of them, and the merge of `develop` into this branch brings them in with no conflict on this story's files. ORV-292 may land before or after PR 1. Each meeting place with it is an ordered list, a union or a catalog group; this story adds its own entries and changes none of the others'. Where two stories insert at the same point, the task that merges second keeps both sides and runs the full gate.

<!-- prettier-ignore -->
| File | ORV-298 (in `develop` before PR 1) | ORV-292 adds | This story, PR 1 | This story, PR 2 |
| --- | --- | --- | --- | --- |
| `intent-engine/src/business/view.ts` | Three `FoundationNode` arms, two state keys, `foundationLines` and `expressionLines` exported | The `awaitingChoice` state, the drafted labels and model id | Nothing: read only | Nothing: read only |
| `intent-engine/src/business/expression.ts` | The module | Nothing known | Nothing: types only | Nothing |
| `intent-engine/src/business/foundation-marks.ts` | Three nodes, the root `competitive-frame`, `MARK_NUMBERS` lines | Nothing known | Nothing: reads `MARK_NUMBERS` | Nothing |
| `intent-engine/src/index.ts` | `export * from "./business/expression";` | Nothing known | `export * from "./business/guidebook";` at the end | Nothing |
| `design-system/src/examples/business-board.tsx` | As merged | Its Positioning controls, if any | The `guidebookHref` prop and the link in the header | Nothing |
| `design-system/src/examples/business-board.stories.tsx` | As merged | Its stories, if any | The `Board` play reads the link | Nothing |
| `design-system/src/examples/business-text.ts` | `NODE_KEY` entries and its helpers | Nothing known | Two parameter types widen | Nothing |
| `design-system/src/i18n/messages/en.ts`, `th.ts` | `business.node.logoType`, `.color`, `.typography`, `business.decision.rule`, its groups | `business.positioning.by.picked`, `.by.edited` | `business.node.logoMark`, `business.board.openGuidebook`, the group `business.guidebook`; no key of ORV-298 copied | Nothing |
| `design-system/src/i18n/business-strings.test.ts` | Its `describe` blocks | Its block | "guidebook, strings" at the end | Nothing |
| `design-system/catalog/coverage.md` | As merged | Nothing known | One "Page examples" row | Nothing |

## 10. Strings

The keys of the spec's "Strings", all PR 1, in the design-system catalog under `business.board.openGuidebook`, `business.node.logoMark` and the new group `business.guidebook` (`title`, `byRule`, `draftNote`, `backToBoard`, `section.{business,foundation,visual,unconfirmed,notHeld}`, `businessNote`, `unconfirmed.{none,restsOnIt,nothing}`, `notYet.logoMark`, `notHeld.<id>.{title,reason}` for the eight ids). The `notHeld` group is keyed by the ids of `GUIDEBOOK_NOT_HELD`, so `notHeldLines` is typed by the engine's list and a missing id fails `pnpm typecheck`. `business.guidebook.section.unconfirmed` is pinned to ORV-126 "Missing strategy" (guidebook section `unconfirmed`) in both languages. PR 1 copies no key of ORV-298, which is in `develop` before it; PR 2 adds no key and reads ORV-292's.

## 11. The spec's open questions: where another answer changes the design

<!-- prettier-ignore -->
| # | Default used | What another answer changes |
| --- | --- | --- |
| 1 | (a) its own page | (b) no route and no `guidebook/page.test.tsx`; `business-board.tsx` opens the screen in its viewer dialog or a panel and runs `guidebookOf(view)` on the client, so the client again holds the view's readings (G7 goes); the link becomes a button. (c) `[projectId]/page.tsx` renders both with a tab state in `ProjectBoard.tsx`; the same loss of G7. `guidebookOf` and its tests do not change in either |
| 2 | (a) assembled on each read | (b) a new tenant table (workspace, project, `created_at`, a `jsonb` payload holding a `Guidebook`, `created_by`) with row security, a classification and a migration; a zod schema for the stored `Guidebook` with a `schemaVersion`; a write action under `LIMITS.write` with its own route in `ROUTES`; a line beside a snapshot whose rules have changed. The keys-only shape is what makes it storable. (c) the same table written inside `foundationService.enter`'s transaction on every entry |
| 3 | (d) PR 1 after ORV-298 with the visual items, PR 2 the drafted positioning (comment 10786) | (a) PR 1 before ORV-298: the three visual items become fixed data with a placeholder line and its key, PR 2 replaces them with section 4.3, and PR 1 copies ORV-298's four catalog keys if they are not in `develop`; the guidebook then says "not on your board yet" while the board shows those items. (b) `Guidebook.visual` is absent in PR 1 and added in PR 2: a type change, not an addition, and the screen gains the section then. (c) one PR after ORV-298 and ORV-292: section 8 joins PR 1 |
| 4 | (a) a title and a reason per node | (b) `notHeld` stays data; the screen shows one sentence and sixteen keys become one. (c) the screen shows ids and numbers; no copy keys |
| 5 | (a) the spec's titles | Copy only; (c) numbering is the screen's. No data change |
| 6 | (b) the lead block, state only | (a) the four become items carrying `nodes[].fields` with answers and readings: model ids enter the guidebook data, `guidebook-honest-1`'s label list and row 9 change, and G7 loses its point. (c) `lead` goes |
| 7 | (a) always a draft | (b) `Guidebook` gains `complete: boolean` (no open item and `unconfirmed` empty), and the screen picks the title by it. (c) copy only |
| 8 | (a) architecture and name in the foundation | (b) `name` moves from `GUIDEBOOK_FOUNDATION` to `GUIDEBOOK_VISUAL` before `logo-type`. (c) both join the lead block as state lines, losing their values |
| 9 | (a) no source ids | (b) a fixed map from rule id to knowledge ids in `guidebook.ts` and `sources: string[]` on a done item; each id must pass the knowledge check at 0.7. (c) `view.ts` and the ORV-20, ORV-291 and ORV-298 rule outputs gain sources: outside this story |
| 10 | (a) the board's label on a picked positioning (PR 2) | (b) `value.statement` drops `label` and `modelId`; `method` stays `ai-draft-picked` in the data only; PR 2 adds no label line to the screen |
| 11 | (a) the board's "Skipped for now" | (b) the positioning item's `state` reads `view.positioning.gate` (`open` gives `empty`) and no longer equals `view.nodes`; T3's positioning clause changes |
| 12 | (a) the skips the marks see | (b) `unconfirmed` also takes each `view.nodes` entry whose state is `skipped` (`audience`, `competitive-frame`, positioning with an empty answer), each with `restingOn` always empty, since no mark starts there |

## 12. Build order

Two builder tasks per PR, each a whole deliverable. Lint, typecheck, test and `format:check` are in every builder `done_when`. `security` reviews each PR (ADR 0015 decision 2: a new route that reads workspace data, and `packages/intent-engine/**`). The designer's notes (`docs/specs/ORV-302/design.md`) pass G2 before each screen task. Paths below are paths on `develop` after the merge.

### PR 1, the guidebook of the foundation and the visual items (rows 1-19, 23)

Starts when ORV-298 (PR 237) is in `develop` and `develop` is merged into this branch.

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers (8 at most) | Green at its commit |
| --- | --- | --- | --- | --- |
| A1 engine | `packages/intent-engine/src/business/guidebook.ts`, `packages/intent-engine/src/business/guidebook.test.ts`, `packages/intent-engine/src/index.ts` | Sections 3 and 4, the foundation and the four visual items; T1 to T13, T33 to T35 | This file sections 3, 4, 13; `docs/specs/ORV-302/spec.md` (rules, rows 1 to 12, 17 to 19, W2, W3); `packages/intent-engine/src/business/view.ts`; `packages/intent-engine/src/business/expression.ts`; `packages/intent-engine/src/business/foundation-marks.ts`; `packages/intent-engine/src/business/questions.ts`; `packages/intent-engine/src/business/view.test.ts` (fixture builders, ORV-298's included); `docs/specs/ORV-298/spec.md` (W4, W6, W7, W8) | `@orivilo/intent-engine` lint, typecheck, test; `@orivilo/design-system` and `apps/web` unchanged and green (the barrel only grows; the task first checks that no `guidebook` name exists in `packages/intent-engine/src` after the merge) |
| A2 screen, copy, route and link | `packages/design-system/src/examples/guidebook.tsx`, `guidebook-text.ts`, `guidebook-text.test.ts`, `guidebook-fixtures.ts`, `guidebook.stories.tsx`, `business-board.tsx`, `business-board.stories.tsx`, `business-text.ts`, `index.ts`; `packages/design-system/catalog/coverage.md`; `packages/design-system/src/i18n/messages/en.ts`, `th.ts`; `packages/design-system/src/i18n/business-strings.test.ts`; `apps/web/app/business/[projectId]/guidebook/page.tsx`, `guidebook/page.test.tsx`; `apps/web/app/business/[projectId]/page.tsx`, `page.test.tsx`, `ProjectBoard.tsx` | Sections 5 to 7 and 10, the screen of the four visual items included; T14 to T32, T38, T39 | This file sections 4.3, 5 to 7, 9, 10, 13; the spec ("Screens", "Strings", rows 1, 2, 4 to 9, 11 to 19, 23); `docs/specs/ORV-302/design.md` (sections 1 to 13 and 15 to 17); `packages/design-system/src/examples/business-board.tsx`; `packages/design-system/src/examples/foundation-view.tsx`; `packages/design-system/src/examples/expression-parts.tsx`; `packages/design-system/src/examples/color-view.tsx` (and its siblings `logo-type-view.tsx`, `typography-view.tsx` when needed); `packages/design-system/src/examples/expression-fixtures.ts` | Every package: lint, typecheck, test, build; `check-i18n`; `apps/web/i18n/messages.test.ts`; `pnpm contrast` unchanged |

### PR 2, the drafted positioning (rows 20-22)

Starts when ORV-292 and PR 1 are in `develop`.

<!-- prettier-ignore -->
| Task | Files (`write_set`) | Delivers | Context pointers (8 at most) | Green at its commit |
| --- | --- | --- | --- | --- |
| B1 engine | `packages/intent-engine/src/business/guidebook.test.ts`; `packages/intent-engine/src/business/guidebook.ts` only if ORV-292's view changed a type it copies (section 8) | T36, T37 | This file sections 3, 4.2, 8, 13; the spec (rows 20 to 22, `guidebook-honest-1`, open question 10); `packages/intent-engine/src/business/view.ts` as merged; `packages/intent-engine/src/business/positioning.ts`; ORV-292's view change (its tech notes); `guidebook.ts`; `guidebook.test.ts` | `@orivilo/intent-engine` lint, typecheck, test. If `guidebook.ts` gained a member, `@orivilo/design-system` typecheck may be red until B2 handles it in its exhaustive switches; B1 and B2 land in one PR, and the PR's gate runs at B2's commit |
| B2 screen | `packages/design-system/src/examples/guidebook.tsx`, `guidebook-fixtures.ts`, `guidebook.stories.tsx` | The picked and edited label line and the two positioning states on the screen; T40, T41 | This file sections 7, 8, 13; the spec (rows 20 to 22); `docs/specs/ORV-302/design.md` (section 14, plays P15 grown, P22, P23); `business-node-view.tsx` as ORV-292 left it; `guidebook.tsx`; `guidebook-fixtures.ts` | Every package, as A2 |

## 13. Tests

Engine fixtures are `SavedBusiness` values run through `toBusinessView`, then `guidebookOf`; none is a hand-built view except where a test says so. "The done project" is the spec's: it carries the stand-in lineup, the scripts answer `thai-latin`, the app icon answer false and no `never` answer, so its three visual items are derived.

<!-- prettier-ignore -->
| Test | File and name | Spec row | Asserts | Turns red when |
| --- | --- | --- | --- | --- |
| T1 | `guidebook.test.ts` › "sections and their order" | 1 | The lead, foundation and visual ids in order; `unconfirmed` `[]`; `notHeld` W3's eight; `method` `rule-based`; `logo-type`, `color`, `typography` derived; `logo-mark` `notInVersion` with its note | `name` and `architecture` swap in `GUIDEBOOK_FOUNDATION` |
| T2 | › "every done item carries its value, its method and its labels" | 2 | Foundation methods `person`, `person`, `rule`, `person`, `person`; among the foundation items, `rules` `["architecture-derive-1"]` on `architecture` only and `hypothesis` on `identity-frame` only; values as the view's (`never` null); no mark on any item | `architecture`'s method reads `person` |
| T3 | › "the guidebook and the board agree" | 3 | Over the fixtures of rows 1, 2, 4 to 7, 17 to 19 and the empty value answer: each foundation item's and each of `logo-type`, `color` and `typography`'s `state`, `waitingFor`, `restsOn`, `unchecked` and value fields equal its view node's; positioning's `state` equals `view.nodes`', its statement `view.positioning.statement` while agreed; the four lead states equal `view.nodes`' | `restsOn` is read from `result.provisionalOn` (row 6's skipped personality then shows "rests on") |
| T4 | › "open stays open" | 4 | Both projects as the row; no `value` on any open item; the waiting architecture holds no answer; `name` given with `unchecked` `["positioning"]`; in both, `logo-type`, `color` and `typography` waiting for `positioning` | The waiting architecture copies `subBrands` |
| T5 | › "a skipped step is listed with what rests on it, and clears once answered" | 5 | W2 case D, then case E `[]`; after the answer no item has a mark | Only `restsOn` items are listed |
| T6 | › "every skipped step the marks see is listed" | 6 | W2 case B, in node number order | Only `view.positioning.skipped` is read |
| T7 | › "an out-of-date positioning is open, not skipped" | 7 | W2 case C; positioning `open`, note `stale`, question `only`, no value; `logo-type` waiting for `positioning`; `color` and `typography` derived with `unchecked` `["positioning"]` | A stale positioning shows its statement |
| T8 | › "what the guidebook does not hold" | 8 | `notHeld` equals W3 on every fixture | `launch` dropped |
| T9 | › "no AI label, no claim" | 9 | Over every fixture of PR 1, the JSON holds none of the six AI keys of `guidebook-honest-1`, no `modelId` other than null, no `readings`, no `reading`, and no string equal to an `en` or `th` line of `PROXY_QUESTIONS` or `START_QUESTIONS` | The view's `reading` is carried |
| T10 | › "pure: no model, no clock" | 10 | `guidebook.ts`'s imports are exactly `../knowledge`, `./expression` (types only), `./foundation`, `./foundation-marks`, `./place`, `./view`, and none is `openrouter` or `llm-interpreter`; its source holds no `Date`, `Math.random`, `process.env`, `performance` and calls none of the functions of G2; a deep-frozen view gives a deep-equal result twice | `import { AI_MODELS } from "../openrouter"`, or a call to `foundationMarks` or `colorOf` |
| T11 | › "an empty value answer" | 3, open question 11 | Positioning `skipped` from the board with question `only`, `unconfirmed` `[]`, the foundation items waiting for Positioning | The step is listed from the board state |
| T12 | › "keys and values only" | 14 | `JSON.parse(JSON.stringify(g))` deep-equals `g`; every member is present (no `undefined`) | A member left `undefined` |
| T13 | › "question keys are ORV-126's" | 16 | Each foundation key in `GUIDEBOOK_QUESTIONS` is a `key` of `PROXY_QUESTIONS` or `START_QUESTIONS`; each visual key (`appIcon`, `lineup`, `scripts`) is a key of `PROXY_QUESTIONS` or `START_QUESTIONS` where ORV-298 listed it there, else a `business.question` key of the `en` and `th` catalogs (section 16) | A typo in one key |
| T14 | `guidebook/page.test.tsx` › "renders the guidebook of the project" | 1, 13 | `dynamic` is `force-dynamic`; the screen gets `guidebook` deep-equal to `guidebookOf` of the service's project and `boardHref` `/business/<id>`, and no `view` prop; one line with route `business/openProject`, outcome `ok`, no name or answer | The page passes the view to the screen |
| T15 | › "access states"; story `GuidebookAccess`, play | 11 | Signed out, not on the list, no database: the screen with that `access`, no guidebook, nothing read; the story shows the three notices | The approved list is skipped |
| T16 | › "one 404 for a bad, unknown or other-workspace id and an unreadable row" | 11 | `notFound()` for each of the four; the service is asked only for UUID-form ids and only with the session's workspace; an error line for the unreadable row and a refusal line with no id for the others | The page calls the service without `loadProject` |
| T17 | › "loaded twice gives the same guidebook and writes nothing, counts no limit, calls no model" | 10 | On a fake clock a day apart: deep-equal guidebooks; the limiter's `consume` never called; the fetch spy never called; the service's only call is `open` | The page consumes `LIMITS["page-read"]` |
| T18 | `[projectId]/page.test.tsx` › "links to the guidebook" | 13 | The ready branch hands `ProjectBoard` `guidebookHref` `/business/<id>/guidebook`; the not-ready branches pass none | The prop is dropped |
| T19 | `guidebook-text.test.ts` | 1, 14 | `itemTitle` resolves all thirteen ids in both languages; `guidebookStateLine` fills `{nodes}` with `Intl.ListFormat` and resolves `partly` and `needsAnswer`; `noteLine` and `notHeldLines` resolve each key | `logo-mark` has no title |
| T20 | Stories `GuidebookDone`, `GuidebookDoneEnglish`, play | 1, 2, 8, 13 | The lines of rows 1, 2 and 8; one top heading and one per section in order; the back link | The draft note shows twice |
| T21 | `GuidebookOpen`, `GuidebookOpenEnglish` | 4 | Row 4's lines; no answer under the waiting architecture; the three visual items waiting for Positioning with no value | A value shows on a waiting item |
| T22 | `GuidebookSkipped`, `GuidebookSkippedEnglish` | 5 | Row 5's lines, both renders, the three visual items under "Not yet confirmed" | "Rests on" shows without `strategy.provisional` |
| T23 | `GuidebookSkippedSteps` | 6 | Row 6's three steps, in order, and `business.guidebook.unconfirmed.nothing` under Brand personality and Core idea | The screen hides a step whose `restingOn` is empty |
| T24 | `GuidebookStale` | 7 | Row 7's lines: the stale line, the question, no statement, the visual items as the row, "You have skipped no step." | The screen shows the stale statement |
| T25 | `GuidebookNoAi` | 9 | The text holds none of the six AI labels and none of the claim words outside the listed lines; no score, count or colour value and no number other than those `guidebook-honest-1` allows; no control | An AI label is rendered |
| T26 | `GuidebookUntrustedText`, `GuidebookUntrustedTextEnglish` | 12 | Each hostile text as literal text, the working name also inside the logo type's length line; no `img`, `script` or `a` from it | The statement is rendered as HTML |
| T27 | `GuidebookSwitchToEnglish`, `GuidebookSwitchToThai` | 14 | Every line switches with no remount; letter spacing `normal` or `0px` on Thai text | The screen keys its tree by locale |
| T28 | `GuidebookNarrow`, `GuidebookNarrowDark`, `GuidebookNarrowEnglish` | 15 | `expectFitsAt360`; focus visible on each link in reading order; the a11y addon | A fixed width on an item |
| T29 | Story `Board`, play | 13 | The link `business.board.openGuidebook` with the story's href; Tab reaches it; Enter follows it | The link is a button with no href |
| T30 | `business-strings.test.ts` › "guidebook, strings" | 16 | Every PR 1 key word for word in both languages; `business.guidebook.section.unconfirmed` equals ORV-126's copy; no middot or em dash | One catalog line edited |
| T31 | `coverage.md` row and the catalog check | 16 | The row's story id resolves | The story title differs from the row |
| T32 | The gate | 16 | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; `pnpm contrast` unchanged; no migration; `TENANT_TABLES` and `ROUTES` unchanged; no key of ORV-298 copied into the catalog | A new key in one language only |
| T33 | `guidebook.test.ts` › "visual items carry their decisions" | 17 | Row 17's values, methods `rule`, rule ids (ORV-298 W4 case 1, W6, W7); each item's state equals its view node's; no `lineup`, `crowded` or hex in the JSON | The colour copies `lineup` |
| T34 | › "visual items that wait" | 18 | `color` done `partly` with two decisions, note `waitsForLineup`, question `lineup`; `typography` open with `scripts`; `logo-type` waiting for `name`, no question | A waiting logo type shows the app icon question |
| T35 | › "a skipped step reaches the visual items" | 19 | W2 case D; `logo-type`, `color` and `typography` derived with `restsOn` `["positioning"]` | A `partly` colour is not counted done |
| T36 | › "a draft is not a decision" | 20 | Over ORV-292's view: `awaitingChoice` open with no question and no statement text in the JSON; then `ai-draft-picked` with option 2's statement, its label and model id; options 1 and 3 absent | The guidebook reads the draft while no option is picked |
| T37 | › "no AI label, the one exception" | 21 | T9's checks over the fixtures of row 20, with the one exception: the picked positioning's `label` and `modelId` only | A model id on any member other than the picked statement |
| T38 | `guidebook/page.test.tsx` › "replay, with the visual items" | 23 | As T17 over the done project, its three visual items derived | A decision is recomputed with a clock |
| T39 | Stories `GuidebookVisual`, `GuidebookVisualEnglish`, `GuidebookVisualOpen`, `GuidebookVisualSkipped`, `GuidebookNoAi` (grown by rows 17 to 19), `GuidebookVisualNarrow`, `GuidebookVisualNarrowDark` | 17 to 19, 23 | The rows' lines; no colour value; no number other than those `guidebook-honest-1` allows (the scale points, the name length with its bound); 360 px with no sideways scroll | A swatch drawn from a decision |
| T40 | The gate | 22 | As T32; PR 2 adds no key; `business.positioning.by.picked` and `.by.edited` are ORV-292's keys, read and not copied | A copied ORV-292 key differs from its source |
| T41 | Stories `GuidebookAwaitingChoice`, `GuidebookPicked`, `GuidebookNoAi` (grown by row 20) | 20, 21 | Row 20's lines; the one AI label exception on the picked positioning only; no option statement while a draft waits | An option shows while no option is picked |

## 14. Impact list

- **`packages/intent-engine`.** New `business/guidebook.ts` and its test; `src/index.ts` gains one export. New public contract: `Guidebook`, `GuidebookItem`, `GuidebookStep`, `GuidebookValue`, `GuidebookNote`, the key and id unions, `GUIDEBOOK_LEAD`, `GUIDEBOOK_FOUNDATION`, `GUIDEBOOK_VISUAL`, `GUIDEBOOK_NOT_HELD`, `GUIDEBOOK_QUESTIONS`, `GUIDEBOOK_HYPOTHESIS`, `DONE_STATES`, `TYPOGRAPHY_RULE`, `guidebookOf`. Unchanged: `view.ts`, `expression.ts`, `foundation-marks.ts`, `foundation.ts`, `place.ts`, `positioning.ts`, `questions.ts`, the intake contract, `MODEL_JOBS`, `AI_MODELS`.
- **New reader of `BusinessView`.** From this story, a change to `BusinessView`, `FoundationNode` (the three expression arms included), `FoundationStateKey`, `BusinessNodeState`, `PositioningView`, the outcome types of `expression.ts` or the mark lists is a change `guidebook.ts` reads; T3 fails on a field the guidebook copies that changes meaning. ORV-292's PR, if it lands after PR 1, runs `guidebook.test.ts` in its gate.
- **`apps/web`.** New route `app/business/[projectId]/guidebook/page.tsx` and its test; `[projectId]/page.tsx`, `page.test.tsx` and `ProjectBoard.tsx` gain the address. `data.ts`, `data.test.ts` and `ProjectBoard.test.tsx` unchanged.
- **`packages/auth`.** None: `ROUTES`, `log.ts`, `log.test.ts`, limits, `withWorkspace` and `businessService` unchanged (G6).
- **`packages/db`.** None: no table, column, migration or `TENANT_TABLES` change.
- **`packages/design-system`.** New example screen, text helpers and their test, fixtures and stories; `business-board.tsx` (one optional prop and a link), `business-board.stories.tsx`, `business-text.ts` (two parameter types), `examples/index.ts`, `catalog/coverage.md`; the catalog's new keys, none copied from ORV-298 or ORV-292. ORV-298's expression views and parts unchanged. No shared component, token, recipe, profile or catalog component entry changes.
- **Docs.** These notes; the designer's notes follow. Section 16 lists the spec points read one way.
- **Not added.** No dependency, env var, external service, model job, Storage object, limit, route name, token or shared component.

## 15. For the `security` review

<!-- prettier-ignore -->
| Control | How it holds | Proven by |
| --- | --- | --- |
| Server-only data access (rule 2, ADR 0002) | The page is a server component; its only data call is `loadProject`, which calls `businessService.open` inside `withWorkspace(..., "member", ...)` with the workspace from the session | T14, T16 (the service mock records the only call and its workspace); `business.integration.test.ts` for `open`'s own scope, unchanged |
| Session and approved list (rule 1, ORV-268) | `loadProject` reads the session on the server and checks `mayRead` before any query | T15 |
| One 404 body (rule 9, ADR 0015 decision 10) | Bad form, unknown id, another workspace's project and an unreadable row all give `not-found`, then `notFound()` | T16 |
| No write, no limit, no model (rule 6) | Opening runs a read and a pure function; no action, no limit, no fetch | T17, T38; T10 (no model import, no model call and no rule run in the module) |
| Logs (rule 15, ADR 0015 decision 6) | One boundary line per load with route `business/openProject`, closed words only; the guidebook adds no line | T14 |
| Untrusted text (rule 8, AGENTS.md) | Project name, statements, answers and the working name are values in the data and text nodes on the screen; never HTML, never a link, never in a log line, a title or an href | T26; T14 (the line); section 5.1 (no `generateMetadata`; hrefs from the checked UUID only) |
| Less data to the client | The client gets the `Guidebook`, which holds no reading, no lineup, no hex and no model id (bar a picked positioning's, PR 2) | T9, T14, T33, T37 |
| No caching across people | `dynamic = "force-dynamic"`, as the board | T14 |
| A throw | `guidebookOf` throws only on a view that breaks its own invariants, with a message holding an id and no value; the page's error boundary shows the app's error page | T3 over every fixture |

The engine's barrel re-exports `openrouter.ts`, as it does for the board's `data.ts`; the route imports `guidebookOf` through it and calls nothing else of it (T17's fetch spy). A route-level scan for model imports is not added: the spec asks it of the guidebook module (row 10), which T10 checks by its own import list.

## 16. Spec points this design reads one way

- **The waiting colour's `notDecided`.** ORV-298's view sets `notDecided` whatever the result; the guidebook shows a waiting item's state line only (`guidebook-open-1`), so it drops the note while `waiting`.
- **The rule id of typography** is fixed data of the guidebook (`TYPOGRAPHY_RULE`), because `TypographyOutcome` carries none; the value is ORV-298's rule name.
- **The board's link on a not-ready board.** No link: a signed-out or refused board shows its notice only.
- **The visual question keys and T13.** Row 16 asks for the question keys to be ORV-126's. The three visual keys are catalog keys of ORV-298 ("Strings"); whether ORV-298 also lists them in `PROXY_QUESTIONS` or `START_QUESTIONS` was not read for these notes, so T13 checks them there when they are listed and against both catalogs otherwise.
- **The positioning label in PR 1.** `PositioningView` already types `by.picked` and `by.edited`, but their catalog keys come with ORV-292; PR 1's screen shows the `by.own` line only, as the board does (section 7.1), and PR 2 adds the other two.

## Changelog

- 2026-11-20: first version, task ORV-302-tech-1, from the spec's rules, rows, open questions and W1 to W3; ORV-291's tech notes (the form); the code at `95116d7` plus the spec commit (`view.ts`, `foundation-marks.ts`, `place.ts`, `questions.ts`, `positioning.ts`, `index.ts`, `data.ts`, `[projectId]/page.tsx` and its test, `ProjectBoard.tsx`, `log.ts`, `business-board.tsx`, `business-text.ts`, `business-access.tsx`, the catalog, `coverage.md`, `foundation.test.ts`, `business-read.test.ts`, `data.test.ts`); ORV-298's `view.ts` and tech notes on `feature/ORV-298-expression-rules`, read only; ADR 0002, ADR 0015 and `.claude/rules/security.md`.
- 2026-11-20: task ORV-302-tech-2, for spec v1.1, caused by ORV-302 comment 10786 (PR 1 after ORV-298 with the visual items, PR 2 the drafted positioning only, the placeholder line removed). Changed: the header and base; G2, G4, G7, G9 and G10; section 2's PR column; section 3 (the visual members, `partly` in `DONE_STATES`, `TYPOGRAPHY_RULE`, the placeholder note gone); section 4.3 (the visual items read from ORV-298's view, `logo-mark` alone fixed data), 4.4 and 4.5 (W2 case D); section 7 (the length line's name, the PR 1 positioning label, ORV-298's views as reuse candidates); section 8 (PR 2 the drafted positioning only); section 9 (ORV-298 read, not met; no copied key); section 10; section 11 rows 3 and 10; section 12 (PR 1 rows 1-19 and 23 in A1 and A2, PR 2 rows 20-22 in B1 and B2); section 13 (T1 to T5, T7, T9, T10, T13, T15, T19, T21, T22, T24 to T26, T32 to T41; T41 new); sections 14 to 16. Read: the spec v1.1, its revision's report, `design.md`, and ORV-298's `view.ts`, `expression.ts`, `expression-parts.tsx` and spec at PR 237's head `02b6cfe`, read only.
