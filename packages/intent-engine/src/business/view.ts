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

/**
 * What a business project shows (ORV-281 tech notes section 4). The view holds keys and values,
 * never resolved text, so a language switch redraws with no second load. Slice 1 has no reading:
 * `reading.status` is `none` and every field's `readings` is empty. Slice 3 widens the `reading`
 * input and the status without changing a caller that passes `null`.
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
  /** No reading row: slice 1 and 2, or a project saved before slice 3. */
  reading: { status: "none" };
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
  /** Always null until slice 3 saves a reading. */
  reading?: null;
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

export function toBusinessView(saved: SavedBusiness): BusinessView {
  const placed = placeIntake(saved.intake);
  const states = nodeStates(saved.intake);
  return {
    projectName: saved.project.name,
    savedAt: saved.project.createdAt,
    reading: { status: "none" },
    nodes: states.map((s) => ({
      id: s.id,
      state: s.state,
      gate: s.gate,
      notes: notesOf(s.id, saved.intake),
      stillToAsk: s.stillToAsk,
      fields: (placed.find((p) => p.id === s.id)?.fields ?? []).map((f) => ({
        field: f.field,
        answer: f.answer,
        readings: [],
      })),
    })),
  };
}
