import type { InputEvidence } from "../evidence";
import type { StoredIntake } from "./intake";
import {
  type BusinessFieldId,
  type BusinessNodeId,
  nodeStates,
  type NodeState,
  type PlacedAnswer,
  placeIntake,
} from "./place";
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

export type BusinessView = {
  projectName: string;
  /** ISO time the project was saved. */
  savedAt: string;
  reading:
    | { status: "none" } // no reading row: slice 1 and 2, or a project saved before slice 3
    | { status: "model"; modelId: string }
    | { status: "rule-based"; reason: BusinessReadReason };
  nodes: Array<{
    id: BusinessNodeId;
    state: NodeState;
    gate: boolean;
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

export function toBusinessView(saved: SavedBusiness): BusinessView {
  const placed = placeIntake(saved.intake);
  const states = nodeStates(saved.intake);
  const readings = readingsOf(saved.reading);
  return {
    projectName: saved.project.name,
    savedAt: saved.project.createdAt,
    reading: statusOf(saved.reading),
    nodes: states.map((s) => ({
      id: s.id,
      state: s.state,
      gate: s.gate,
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
