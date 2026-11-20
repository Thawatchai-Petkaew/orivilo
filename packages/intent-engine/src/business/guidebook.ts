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
import type { BusinessNodeState, BusinessView, FoundationNode, FoundationStateKey } from "./view";

/**
 * ORV-302 `guidebook-assembly-1`: the brand guidebook, assembled by fixed rules from the one
 * `BusinessView` the board is drawn from. Pure: no model, no clock, no random source, no
 * environment. It computes nothing the board computes: every state, mark, value and question is
 * copied from the view, or is fixed data of this module. The result holds keys and values only,
 * never resolved text, so a language switch redraws with no second load.
 */

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

/** Who or what made a done item. `ai-draft-picked` is reachable only once ORV-292 ships. */
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

const HYPOTHESIS: Partial<Record<GuidebookItemId, GuidebookHypothesisKey>> = GUIDEBOOK_HYPOTHESIS;

const isDone = (state: GuidebookStateKey): boolean =>
  (DONE_STATES as readonly GuidebookStateKey[]).includes(state);

/** What a done item holds beyond its lines; null while the view's node has no value to copy. */
type Made = { method: GuidebookMethod; rules: string[]; value: GuidebookValue };

/** A done item whose node holds no value cannot come out of `toBusinessView`: a closed message. */
function itemOf(lines: ItemLines, made: Made | null): GuidebookItem {
  if (!isDone(lines.state)) {
    return { ...lines, status: "open", method: null, rules: [], hypothesis: null, value: null };
  }
  if (made === null) throw new Error(`guidebook: a done ${lines.id} has no value`);
  return {
    ...lines,
    status: "done",
    method: made.method,
    rules: made.rules,
    hypothesis: HYPOTHESIS[lines.id] ?? null,
    value: made.value,
  };
}

function nodeOf<I extends FoundationNode["id"]>(
  view: BusinessView,
  id: I,
): Extract<FoundationNode, { id: I }> {
  const node = view.foundation.find((n): n is Extract<FoundationNode, { id: I }> => n.id === id);
  if (node === undefined) throw new Error(`guidebook: the view has no ${id}`);
  return node;
}

function linesOf(node: FoundationNode): Omit<ItemLines, "notes" | "questions"> {
  return {
    id: node.id,
    state: node.state,
    waitingFor: [...node.waitingFor],
    restsOn: [...node.restsOn],
    unchecked: [...node.unchecked],
  };
}

/** The questions of a foundation item: asked while the person has to answer (`empty`, `skipped`). */
function askedWhileOpen(id: GuidebookItemId, state: GuidebookStateKey): GuidebookQuestionKey[] {
  return state === "empty" || state === "skipped" ? [...GUIDEBOOK_QUESTIONS[id]] : [];
}

function positioningItem(view: BusinessView): GuidebookItem {
  const node = view.nodes.find((n) => n.id === "positioning");
  if (node === undefined) throw new Error("guidebook: the view has no positioning");
  const { statement, stale } = view.positioning;
  const lines: ItemLines = {
    id: "positioning",
    state: node.state,
    waitingFor: [],
    restsOn: [],
    unchecked: [],
    notes: stale ? [{ key: "business.positioning.stale" }] : [],
    questions:
      !isDone(node.state) && node.state !== "awaitingChoice"
        ? [...GUIDEBOOK_QUESTIONS.positioning]
        : [],
  };
  const label = statement?.label;
  const made: Made | null =
    statement === null || label === undefined || label === "business.positioning.stale"
      ? null
      : {
          method: label === "business.positioning.by.own" ? "person" : "ai-draft-picked",
          rules: [],
          value: {
            id: "positioning",
            statement: { text: statement.text, label, modelId: statement.modelId },
          },
        };
  return itemOf(lines, made);
}

function identityItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "identity-frame");
  const lines: ItemLines = {
    ...linesOf(node),
    notes: [],
    questions: askedWhileOpen("identity-frame", node.state),
  };
  const made: Made | null =
    node.axes === null
      ? null
      : {
          method: node.state === "derived" ? "rule" : "person",
          rules: [],
          value: {
            id: "identity-frame",
            person: node.person,
            never: node.never,
            axes: node.axes.map((a) => ({ ...a })),
          },
        };
  return itemOf(lines, made);
}

function architectureItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "architecture");
  const lines: ItemLines = {
    ...linesOf(node),
    notes: node.state === "notInVersion" ? [{ key: "business.architecture.notInVersion" }] : [],
    questions: askedWhileOpen("architecture", node.state),
  };
  const made: Made | null =
    node.value === null
      ? null
      : {
          method: "rule",
          rules: [node.value.rule],
          value: { id: "architecture", derived: node.value },
        };
  return itemOf(lines, made);
}

function nameItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "name");
  const lines: ItemLines = {
    ...linesOf(node),
    notes: [],
    questions: askedWhileOpen("name", node.state),
  };
  const made: Made | null =
    node.name === null
      ? null
      : { method: "person", rules: [], value: { id: "name", name: node.name } };
  return itemOf(lines, made);
}

function coreIdeaItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "core-idea");
  const lines: ItemLines = {
    ...linesOf(node),
    notes: [],
    questions: askedWhileOpen("core-idea", node.state),
  };
  const made: Made | null =
    node.statement === null
      ? null
      : {
          method: "person",
          rules: [],
          value: {
            id: "core-idea",
            statement: { ...node.statement },
            remember: node.remember,
          },
        };
  return itemOf(lines, made);
}

function logoTypeItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "logo-type");
  const lines: ItemLines = {
    ...linesOf(node),
    notes: [],
    questions:
      node.state === "needsAnswer" && node.controls.includes("answer")
        ? [...GUIDEBOOK_QUESTIONS["logo-type"]]
        : [],
  };
  const made: Made | null =
    node.decision === null
      ? null
      : {
          method: "rule",
          rules: [node.decision.rule],
          value: { id: "logo-type", decision: node.decision },
        };
  return itemOf(lines, made);
}

/** guidebook-open-1: the fixed record of the item the guidebook does not hold yet. */
function logoMarkItem(): GuidebookItem {
  return {
    id: "logo-mark",
    state: "notInVersion",
    waitingFor: [],
    restsOn: [],
    unchecked: [],
    notes: [{ key: "business.guidebook.notYet.logoMark" }],
    questions: [],
    status: "open",
    method: null,
    rules: [],
    hypothesis: null,
    value: null,
  };
}

function colorItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "color");
  // A waiting item shows its state line only, so a blocked colour shows no note (section 16).
  const asks = node.state !== "waiting";
  const open = node.signatureOpen;
  const notes: GuidebookNote[] = [];
  if (asks && open?.why === "waitsForLineup") notes.push({ key: "business.color.waitsForLineup" });
  if (asks && node.needsPersonality) notes.push({ key: "business.color.needsPersonality" });
  if (asks && open?.why === "bothCrowded") {
    notes.push({ key: "business.color.bothCrowded", first: open.first, second: open.second });
  }
  if (asks && node.notDecided) notes.push({ key: "business.color.notDecided" });
  const lines: ItemLines = {
    ...linesOf(node),
    notes,
    questions: asks && open?.why === "waitsForLineup" ? [...GUIDEBOOK_QUESTIONS.color] : [],
  };
  const made: Made | null =
    node.decisions === null
      ? null
      : {
          method: "rule",
          rules: [node.decisions.signature, node.decisions.neutral, node.decisions.canvas].flatMap(
            (d) => (d === null ? [] : [d.rule]),
          ),
          value: {
            id: "color",
            decisions: {
              signature: node.decisions.signature,
              neutral: node.decisions.neutral,
              canvas: node.decisions.canvas,
            },
            points: node.points === null ? null : { ...node.points },
          },
        };
  return itemOf(lines, made);
}

function typographyItem(view: BusinessView): GuidebookItem {
  const node = nodeOf(view, "typography");
  const lines: ItemLines = {
    ...linesOf(node),
    notes: [],
    questions: node.state === "needsAnswer" ? [...GUIDEBOOK_QUESTIONS.typography] : [],
  };
  const made: Made | null =
    node.faces === null
      ? null
      : {
          method: "rule",
          rules: [TYPOGRAPHY_RULE],
          value: { id: "typography", faces: node.faces },
        };
  return itemOf(lines, made);
}

/** `guidebook-unconfirmed-1`: the steps the marks see as skipped, with what rests on each. */
function unconfirmedOf(view: BusinessView, items: readonly GuidebookItem[]): GuidebookStep[] {
  const steps = [
    ...(view.positioning.skipped ? (["positioning"] as const) : []),
    ...view.foundation
      .filter((n) => n.result.status === "open" && n.result.skipped)
      .map((n) => n.id),
  ].sort((a, b) => MARK_NUMBERS[a] - MARK_NUMBERS[b]);
  return steps.map((id) => ({
    id,
    questions: [...GUIDEBOOK_QUESTIONS[id]],
    restingOn: items.flatMap((i) =>
      i.status === "done" && (i.restsOn.includes(id) || i.unchecked.includes(id))
        ? [
            {
              id: i.id,
              mark: i.restsOn.includes(id) ? ("restsOn" as const) : ("unchecked" as const),
            },
          ]
        : [],
    ),
  }));
}

const ITEM_OF = {
  positioning: positioningItem,
  "identity-frame": identityItem,
  architecture: architectureItem,
  name: nameItem,
  "core-idea": coreIdeaItem,
  "logo-type": logoTypeItem,
  "logo-mark": logoMarkItem,
  color: colorItem,
  typography: typographyItem,
} as const satisfies Record<GuidebookItemId, (view: BusinessView) => GuidebookItem>;

export function guidebookOf(view: BusinessView): Guidebook {
  const lead = GUIDEBOOK_LEAD.map((id) => {
    const node = view.nodes.find((n) => n.id === id);
    if (node === undefined) throw new Error(`guidebook: the view has no ${id}`);
    return { id, state: node.state };
  });
  const foundation = GUIDEBOOK_FOUNDATION.map((id) => ITEM_OF[id](view));
  const visual = GUIDEBOOK_VISUAL.map((id) => ITEM_OF[id](view));
  return {
    method: "rule-based",
    projectName: view.projectName,
    savedAt: view.savedAt,
    lead,
    foundation,
    visual,
    unconfirmed: unconfirmedOf(view, [...foundation, ...visual]),
    notHeld: [...GUIDEBOOK_NOT_HELD],
  };
}
