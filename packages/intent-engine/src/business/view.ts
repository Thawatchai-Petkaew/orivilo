import type { HueFamily } from "../color-audit";
import type { InputEvidence } from "../evidence";
import { PERSONALITY_AXES, type PersonalityAxis } from "../knowledge";
import type { ColorOutcome, TypographyOutcome } from "./expression";
import type { AxisValue, StoredEntry, TypographyScripts } from "./foundation";
import {
  axisPointOf,
  derivedArchitecture,
  type DerivedArchitecture,
  entryAllowed,
  type AxisPoint,
  type FoundationResult,
  foundationState,
  type FoundationState,
  type MarkRef,
} from "./foundation-marks";
import type { StoredIntake } from "./intake";
import {
  type BusinessFieldId,
  type BusinessNodeId,
  nodeStates,
  type NodeState,
  type PlacedAnswer,
  placeIntake,
} from "./place";
import { positioningGate, type GateState, type StoredChoice } from "./positioning";
import type { ProxyQuestionId } from "./questions";
import type { BusinessReadReason, BusinessReading } from "./reading";

/**
 * What a business project shows (ORV-281 tech notes section 4). The view holds keys and values,
 * never resolved text, so a language switch redraws with no second load. With no reading row
 * `reading.status` is `none` and every field's `readings` is empty; a saved record (slice 3) gives
 * `model` with each reading under its field, or `rule-based` with the reason and no reading. A
 * reading is a proposal beside the person's words: it changes no answer, state or note.
 */

export type BusinessNote =
  | "business.industry.awaitingTaxonomy"
  | "business.website.notRead"
  | "business.competitors.coloursNotRead";

export type BusinessFieldReading = {
  value: string;
  modelId: string;
  confidence: number;
  belowFloor: boolean;
  quality: Array<"quality.fewWords">;
  /** The reading item itself, with its own quote. */
  item: InputEvidence;
  /** Every span it rests on. */
  spans: InputEvidence[];
};

/** A node's state in the view: `node-state-1`'s three, and the two the positioning gate adds. */
export type BusinessNodeState = NodeState | "awaitingChoice" | "agreed"; // a key of business.state.*

export type PositioningView = {
  gate: GateState;
  skipped: boolean;
  stale: boolean;
  /** The statement to show: the agreed one, or the stale one with its note. */
  statement: null | {
    text: string;
    label:
      | "business.positioning.by.picked"
      | "business.positioning.by.edited"
      | "business.positioning.by.own"
      | "business.positioning.stale";
    /** The draft's saved model id for `by.picked` and `by.edited`; no draft is stored yet. */
    modelId: string | null;
  };
  controls: Array<"writeOwn" | "skip">;
};

/** A foundation node's field names, a key of `business.field.*`. PR 3 adds its own. */
export type FoundationFieldKey =
  | "person"
  | "never"
  | "personality"
  | "subBrands"
  | "architecture"
  | "workingName"
  | "signature"
  | "neutral"
  | "canvas"
  | "lineup"
  | "crowded"
  | "scripts"
  | "readingFace"
  | "displayFace";
/** A foundation node's state line, a key of `business.state.*`. PR 3 adds `agreed`. */
export type FoundationStateKey =
  "given" | "derived" | "waiting" | "skipped" | "empty" | "notInVersion" | "partly" | "needsAnswer";

type FoundationBase = {
  result: FoundationResult;
  /** The state line, by the result table of `foundation-marks-1`. */
  state: FoundationStateKey;
  /** `{nodes}` of `business.state.waiting`: `result.blockedBy` while `state` is `waiting`, else empty. */
  waitingFor: MarkRef[];
  /** The mark line "rests on", shown only for a derived result. */
  restsOn: MarkRef[];
  /** The mark line "not yet checked against", shown only for a given or derived result. */
  unchecked: MarkRef[];
  /** The names the card lists, in the order the view shows them. */
  fields: FoundationFieldKey[];
};

/** The foundation nodes in fill order: ORV-291's three built so far, then ORV-298's colour and typography. */
export type FoundationNode =
  | (FoundationBase & {
      id: "identity-frame";
      person: string | null;
      never: string | null;
      /** The five values the person chose, in the order of `PERSONALITY_AXES`; null unless given. */
      axes: null | Array<{ axis: PersonalityAxis; value: AxisValue; point: AxisPoint }>;
      controls: Array<"describe" | "skip">;
    })
  | (FoundationBase & {
      id: "architecture";
      /** The stored answer, shown in every state that holds one; null with no entry. */
      subBrands: boolean | null;
      /** The value of `architecture-derive-1`, only while the result is `derived`. */
      value: DerivedArchitecture | null;
      controls: Array<"answer">;
    })
  | (FoundationBase & {
      id: "name";
      /** The person's own text, shown with any entry; null with none. */
      name: string | null;
      controls: Array<"give">;
    })
  | (FoundationBase & {
      id: "color";
      /** The person's lineup in the order given; null with none. Shown in every result. */
      lineup: null | Array<{ name: string; hex: string }>;
      /** `auditLineup`'s crowded families in its order; null with no lineup. Shown in every result. */
      crowded: null | HueFamily[];
      /** Null while the result is blocked; each decision null when `decideColor` left it open. */
      decisions: null | Pick<ColorOutcome, "signature" | "neutral" | "canvas">;
      /** Why the signature is open; null while blocked. */
      signatureOpen: ColorOutcome["signatureOpen"];
      /** `business.color.needsPersonality`: the rules ask for the personality and the result is not blocked. */
      needsPersonality: boolean;
      /** `business.color.notDecided`: a conflicted or invalid result, not blocked. */
      notDecided: boolean;
      /** The scale points (1 to 5) the reasons quote; null while blocked or with no given personality. */
      points: null | Record<"expressive" | "warm" | "premium", AxisPoint>;
      controls: Array<"give">;
    })
  | (FoundationBase & {
      id: "typography";
      /** The stored answer, shown in every result that holds one; null with no entry. */
      scripts: TypographyScripts | null;
      /** The families of the answer, only while the result is `derived`; null in every other. */
      faces: TypographyOutcome | null;
      controls: Array<"answer">;
    });

export type BusinessView = {
  projectName: string;
  /** ISO time the project was saved. */
  savedAt: string;
  reading:
    | { status: "none" } // no reading row: slice 1 and 2, or a project saved before slice 3
    | { status: "model"; modelId: string }
    | { status: "rule-based"; reason: BusinessReadReason };
  positioning: PositioningView;
  /** The foundation nodes, in fill order, after the business nodes. */
  foundation: FoundationNode[];
  nodes: Array<{
    id: BusinessNodeId;
    state: BusinessNodeState;
    gate: boolean;
    /** True only on `positioning` once the gate is `given` or `confirmed`. */
    gatePassed: boolean;
    notes: BusinessNote[];
    stillToAsk: ProxyQuestionId[];
    fields: Array<{
      field: BusinessFieldId;
      answer: PlacedAnswer | null;
      readings: BusinessFieldReading[];
    }>;
  }>;
};

export type SavedBusiness = {
  /** `createdAt` is ISO. In slice 1 the intake is written in the project's transaction. */
  project: { id: string; name: string; createdAt: string };
  intake: StoredIntake;
  /** The saved reading record of the intake, or none. */
  reading?: BusinessReading | null;
  /**
   * The newest intake's id and the project's newest choice row. Absent, no choice is stored. The
   * choice's draft is not read yet: a draft is never a value.
   */
  positioning?: { intakeId: string; choice: StoredChoice | null };
  /** The project's foundation entries, in any order. Absent, no entry is stored. */
  foundation?: StoredEntry[];
};

/** The notes of `honest-business-1` that belong to a node, by rule. */
function notesOf(id: BusinessNodeId, intake: StoredIntake): BusinessNote[] {
  const notes: BusinessNote[] = [];
  if (id === "situation") {
    if (intake.industry !== undefined) notes.push("business.industry.awaitingTaxonomy");
    if (intake.website !== undefined) notes.push("business.website.notRead");
  }
  if (id === "competitive-frame") notes.push("business.competitors.coloursNotRead");
  return notes;
}

/** The readings of a model record, by the field each one is on, in the record's order. */
function readingsOf(record: BusinessReading | null | undefined) {
  const byField = new Map<string, BusinessFieldReading[]>();
  if (record?.method !== "model") return byField;
  const spans = new Map(record.items.filter((i) => i.reading === null).map((i) => [i.id, i]));
  for (const item of record.items) {
    if (item.reading === null) continue;
    const shape = item.reading.value;
    const reading: BusinessFieldReading = {
      value: "text" in shape ? shape.text : "name" in shape ? shape.name : "",
      modelId: record.modelId,
      confidence: item.confidence.value,
      belowFloor: item.belowFloor,
      quality: item.flags.some((f) => f.key === "quality.fewWords") ? ["quality.fewWords"] : [],
      item,
      spans: item.basedOn.flatMap((id) => spans.get(id) ?? []),
    };
    byField.set(item.reading.target, [...(byField.get(item.reading.target) ?? []), reading]);
  }
  return byField;
}

function statusOf(record: BusinessReading | null | undefined): BusinessView["reading"] {
  if (!record) return { status: "none" };
  if (record.method === "model") return { status: "model", modelId: record.modelId };
  return { status: "rule-based", reason: record.reason };
}

const BY_KIND = {
  picked: "business.positioning.by.picked",
  edited: "business.positioning.by.edited",
  written: "business.positioning.by.own",
} as const;

function positioningOf(saved: SavedBusiness): PositioningView {
  const choice = saved.positioning?.choice ?? null;
  const gate = positioningGate({
    newestIntakeId: saved.positioning?.intakeId ?? "",
    choice,
    draftOfNewest: false,
  });
  const agreed = gate.state === "given" || gate.state === "confirmed";
  const statement =
    choice === null || choice.kind === "skipped"
      ? null
      : {
          text: choice.statement,
          label: gate.stale ? ("business.positioning.stale" as const) : BY_KIND[choice.kind],
          modelId: null,
        };
  const controls: PositioningView["controls"] = agreed
    ? []
    : gate.skipped
      ? ["writeOwn"]
      : ["writeOwn", "skip"];
  return { gate: gate.state, skipped: gate.skipped, stale: gate.stale, statement, controls };
}

const STATE_OF = {
  given: "given",
  derived: "derived",
  blocked: "waiting",
  open: "empty",
} as const;

/**
 * The result table of `foundation-marks-1`: the state line a result shows and which mark lines
 * show with it. A blocked, skipped or open result keeps its lists in `result` but shows none.
 */
export function foundationLines(result: FoundationResult): Omit<FoundationBase, "fields"> {
  const shows = result.status === "given" || result.status === "derived";
  return {
    result,
    state: result.status === "open" && result.skipped ? "skipped" : STATE_OF[result.status],
    waitingFor: result.status === "blocked" ? result.blockedBy : [],
    restsOn: result.status === "derived" ? result.provisionalOn : [],
    unchecked: shows ? result.unchecked : [],
  };
}

/**
 * `expression-marks-1`'s table for the three expression nodes: an open result reads `partly` with
 * at least one decision made, and carries the mark lines as a derived one does; `needsAnswer`
 * with none, and no mark line. Every other status reads as `foundationLines` gives it.
 */
export function expressionLines(
  result: FoundationResult,
  decided: number,
): Omit<FoundationBase, "fields"> {
  if (result.status !== "open") return foundationLines(result);
  return decided > 0
    ? {
        result,
        state: "partly",
        waitingFor: [],
        restsOn: result.provisionalOn,
        unchecked: result.unchecked,
      }
    : { result, state: "needsAnswer", waitingFor: [], restsOn: [], unchecked: [] };
}

function personalityOf(state: FoundationState): FoundationNode {
  const result = state.results["identity-frame"];
  const entry = state.newest["identity-frame"];
  const given = entry?.kind === "given" ? entry : null;
  const allowed = (kind: "given" | "skipped") =>
    entryAllowed({ node: "identity-frame", kind }, state);
  return {
    id: "identity-frame",
    ...foundationLines(result),
    fields: ["person", "never", "personality"],
    person: given?.payload.person ?? null,
    never: given?.payload.never ?? null,
    axes:
      given === null
        ? null
        : PERSONALITY_AXES.map((axis) => ({
            axis,
            value: given.payload.axes[axis],
            point: axisPointOf(given.payload.axes[axis]),
          })),
    controls: [
      ...(allowed("given") ? (["describe"] as const) : []),
      ...(allowed("skipped") ? (["skip"] as const) : []),
    ],
  };
}

function architectureOf(state: FoundationState): FoundationNode {
  const result = state.results.architecture;
  const answer = state.newest.architecture?.payload.subBrands ?? null;
  const lines = foundationLines(result);
  return {
    id: "architecture",
    ...lines,
    // An answer yes leaves the node open: out of this version, with the answer kept.
    state: result.status === "open" && answer === true ? "notInVersion" : lines.state,
    fields: ["subBrands", "architecture"],
    subBrands: answer,
    value: derivedArchitecture(result),
    controls: entryAllowed({ node: "architecture", kind: "answered" }, state) ? ["answer"] : [],
  };
}

function nameOf(state: FoundationState): FoundationNode {
  return {
    id: "name",
    ...foundationLines(state.results.name),
    fields: ["workingName"],
    name: state.newest.name?.payload.name ?? null,
    controls: entryAllowed({ node: "name", kind: "given" }, state) ? ["give"] : [],
  };
}

function colorNodeOf(state: FoundationState): FoundationNode {
  const result = state.results.color;
  const outcome = state.expression.color;
  // A blocked result shows no decision; the lineup, its audit and the question show in every result.
  const blocked = result.status === "blocked";
  const { axes } = outcome;
  return {
    id: "color",
    ...expressionLines(result, outcome.decided),
    fields: ["signature", "neutral", "canvas", "lineup", "crowded"],
    lineup: state.newest["competitive-frame"]?.payload.lineup ?? null,
    crowded: outcome.audit?.crowded ?? null,
    decisions: blocked
      ? null
      : { signature: outcome.signature, neutral: outcome.neutral, canvas: outcome.canvas },
    signatureOpen: blocked ? null : outcome.signatureOpen,
    needsPersonality: !blocked && outcome.asks.includes("identity-frame"),
    notDecided: outcome.notDecided,
    // A blocked colour has no given personality (a given one is never blocked), so no axes.
    points:
      axes === null
        ? null
        : {
            expressive: axisPointOf(axes.expressive),
            warm: axisPointOf(axes.warm),
            premium: axisPointOf(axes.premium),
          },
    controls: entryAllowed({ node: "competitive-frame", kind: "lineup" }, state) ? ["give"] : [],
  };
}

function typographyNodeOf(state: FoundationState): FoundationNode {
  const result = state.results.typography;
  const outcome = state.expression.typography;
  return {
    id: "typography",
    // One decision, made with the answer: a derived result has it, and no result is partly.
    ...expressionLines(result, outcome === null ? 0 : 1),
    fields: ["scripts", "readingFace", "displayFace"],
    scripts: state.newest.typography?.payload.scripts ?? null,
    faces: result.status === "derived" ? outcome : null,
    controls: entryAllowed({ node: "typography", kind: "answered" }, state) ? ["answer"] : [],
  };
}

export function toBusinessView(saved: SavedBusiness): BusinessView {
  const placed = placeIntake(saved.intake);
  const states = nodeStates(saved.intake);
  const readings = readingsOf(saved.reading);
  const positioning = positioningOf(saved);
  const agreed = positioning.gate === "given" || positioning.gate === "confirmed";
  const foundation = foundationState(
    { state: positioning.gate, skipped: positioning.skipped },
    saved.foundation ?? [],
  );
  /**
   * `positioning-gate-1`'s state; `open` without a skip keeps `node-state-1`'s own. `awaitingChoice`
   * comes with the drafted options (no draft is read yet, so the gate is never `awaiting-choice`).
   */
  const stateOfPositioning = (own: NodeState): BusinessNodeState =>
    agreed ? "agreed" : positioning.skipped ? "skipped" : own;
  return {
    projectName: saved.project.name,
    savedAt: saved.project.createdAt,
    reading: statusOf(saved.reading),
    positioning,
    foundation: [
      personalityOf(foundation),
      architectureOf(foundation),
      nameOf(foundation),
      colorNodeOf(foundation),
      typographyNodeOf(foundation),
    ],
    nodes: states.map((s) => ({
      id: s.id,
      state: s.id === "positioning" ? stateOfPositioning(s.state) : s.state,
      gate: s.gate,
      gatePassed: s.id === "positioning" && agreed,
      notes: notesOf(s.id, saved.intake),
      stillToAsk: s.stillToAsk,
      fields: (placed.find((p) => p.id === s.id)?.fields ?? []).map((f) => ({
        field: f.field,
        answer: f.answer,
        readings: readings.get(f.field) ?? [],
      })),
    })),
  };
}
