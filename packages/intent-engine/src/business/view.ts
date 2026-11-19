import type { InputEvidence } from "../evidence";
import type { StoredIntake } from "./intake";
import {
  BUSINESS_FIELDS,
  type BusinessFieldId,
  type BusinessNodeId,
  nodeStates,
  type NodeState,
  type PlacedAnswer,
  placeIntake,
} from "./place";
import {
  positioningGate,
  type GateState,
  type StoredChoice,
  type StoredDraft,
} from "./positioning";
import type { ProxyQuestionId } from "./questions";
import type { BusinessAnswerKey, BusinessReadReason, BusinessReading } from "./reading";

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

/** A key of `business.field.*`: the label of a field of the board. */
export type BusinessFieldLabelKey = (typeof BUSINESS_FIELDS)[number]["labelKey"];

/**
 * The label of the field each of the six answers lands on (`INTAKE_FIELDS` place, `BUSINESS_FIELDS`),
 * written out so a new answer fails the compile here; `view.test.ts` checks it against the two tables.
 */
const QUOTE_LABEL: Record<BusinessAnswerKey, BusinessFieldLabelKey> = {
  idea: "business.field.offer",
  industry: "business.field.industry",
  customers: "business.field.customers",
  problem: "business.field.problem",
  competitors: "business.field.alternatives",
  value: "business.field.value",
};

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
    /** The draft's saved model id for `by.picked` and `by.edited`; null for the other labels. */
    modelId: string | null;
  };
  /**
   * The draft of the newest intake, while the gate is not `given` or `confirmed`. Start and end of a
   * quote stay on the server: the screen needs the words and the label of their answer.
   */
  options: null | {
    draftId: string;
    modelId: string;
    items: Array<{
      n: 1 | 2 | 3;
      statement: string;
      quotes: Array<{ labelKey: BusinessFieldLabelKey; text: string }>;
    }>;
  };
  controls: Array<"draft" | "writeOwn" | "skip" | "pick" | "edit">;
  /** The value answer is empty and the gate is not passed: no options can be drafted. */
  needsValue: boolean;
};

export type BusinessView = {
  projectName: string;
  /** ISO time the project was saved. */
  savedAt: string;
  reading:
    | { status: "none" } // no reading row: slice 1 and 2, or a project saved before slice 3
    | { status: "model"; modelId: string }
    | { status: "rule-based"; reason: BusinessReadReason };
  positioning: PositioningView;
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
   * The newest intake's id, the project's newest choice row and the stored draft of the newest
   * intake. Absent, no choice or draft is stored. A draft is never a value: the view shows its
   * options as proposals and a statement only from a choice. A draft of another intake is ignored.
   */
  positioning?: { intakeId: string; choice: StoredChoice | null; draft?: StoredDraft | null };
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
  const stored = saved.positioning?.draft;
  const draft = stored && stored.intakeId === saved.positioning?.intakeId ? stored : null;
  const gate = positioningGate({
    newestIntakeId: saved.positioning?.intakeId ?? "",
    choice,
    draftOfNewest: draft !== null,
  });
  const agreed = gate.state === "given" || gate.state === "confirmed";
  const statement =
    choice === null || choice.kind === "skipped"
      ? null
      : {
          text: choice.statement,
          label: gate.stale ? ("business.positioning.stale" as const) : BY_KIND[choice.kind],
          // Only the draft the choice names, which the table's key makes a draft of the choice's own
          // intake: a stale choice never names the draft of the newest one.
          modelId: draft !== null && draft.id === choice.draftId ? draft.modelId : null,
        };
  const options =
    draft !== null && !agreed
      ? {
          draftId: draft.id,
          modelId: draft.modelId,
          items: draft.options.map((option, at) => ({
            n: (at + 1) as 1 | 2 | 3,
            statement: option.statement,
            quotes: option.quotes.map((quote) => ({
              labelKey: QUOTE_LABEL[quote.answer],
              text: quote.text,
            })),
          })),
        }
      : null;
  const valueGiven = saved.intake.value !== undefined; // as `nodeStates`: a stored answer is never empty
  const controls: PositioningView["controls"] = agreed
    ? []
    : [
        ...(options === null && valueGiven ? (["draft"] as const) : []),
        "writeOwn",
        ...(gate.skipped ? [] : (["skip"] as const)),
        ...(options !== null ? (["pick", "edit"] as const) : []),
      ];
  return {
    gate: gate.state,
    skipped: gate.skipped,
    stale: gate.stale,
    statement,
    options,
    controls,
    needsValue: !agreed && !valueGiven,
  };
}

export function toBusinessView(saved: SavedBusiness): BusinessView {
  const placed = placeIntake(saved.intake);
  const states = nodeStates(saved.intake);
  const readings = readingsOf(saved.reading);
  const positioning = positioningOf(saved);
  const agreed = positioning.gate === "given" || positioning.gate === "confirmed";
  /** `positioning-gate-1`'s state; `open` without a skip keeps `node-state-1`'s own. */
  const stateOfPositioning = (own: NodeState): BusinessNodeState =>
    agreed
      ? "agreed"
      : positioning.skipped
        ? "skipped"
        : positioning.gate === "awaiting-choice"
          ? "awaitingChoice"
          : own;
  return {
    projectName: saved.project.name,
    savedAt: saved.project.createdAt,
    reading: statusOf(saved.reading),
    positioning,
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
