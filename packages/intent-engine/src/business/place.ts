import { INTAKE_FIELDS, type IntakeAnswers, type IntakeField } from "./intake";
import type { ProxyQuestionId } from "./questions";

/**
 * The business nodes as fixed data, and where each given answer lands (ORV-281 tech notes
 * section 4; spec `intake-place-1`, `business-fields-1`, `node-state-1`). Rule-based, no AI: the
 * same intake gives the same output. ORV-126 owns the ids and the `requires` links; its graph code
 * is not built, so they are fixed here until it is.
 */

/** The five business nodes in fill order. */
export const BUSINESS_NODES = [
  "situation",
  "business-core",
  "audience",
  "competitive-frame",
  "positioning",
] as const;

export type BusinessNodeId = (typeof BUSINESS_NODES)[number];

export type FieldSource = "answer" | "reading" | "both";

/** The ten fields of `business-fields-1`, in node order. */
export const BUSINESS_FIELDS = [
  {
    id: "situation.industry",
    node: "situation",
    labelKey: "business.field.industry",
    source: "answer",
  },
  { id: "situation.name", node: "situation", labelKey: "business.field.name", source: "reading" },
  {
    id: "situation.website",
    node: "situation",
    labelKey: "business.field.website",
    source: "answer",
  },
  {
    id: "business-core.offer",
    node: "business-core",
    labelKey: "business.field.offer",
    source: "both",
  },
  {
    id: "business-core.why",
    node: "business-core",
    labelKey: "business.field.why",
    source: "reading",
  },
  {
    id: "audience.customers",
    node: "audience",
    labelKey: "business.field.customers",
    source: "both",
  },
  { id: "audience.problem", node: "audience", labelKey: "business.field.problem", source: "both" },
  {
    id: "competitive-frame.category",
    node: "competitive-frame",
    labelKey: "business.field.category",
    source: "reading",
  },
  {
    id: "competitive-frame.alternatives",
    node: "competitive-frame",
    labelKey: "business.field.alternatives",
    source: "both",
  },
  {
    id: "positioning.value",
    node: "positioning",
    labelKey: "business.field.value",
    source: "answer",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  node: BusinessNodeId;
  labelKey: string;
  source: FieldSource;
}>;

export type BusinessFieldId = (typeof BUSINESS_FIELDS)[number]["id"];

/** The six `requires` links as `[from, to]`: `to` requires `from`. */
export const BUSINESS_EDGES = [
  ["situation", "business-core"],
  ["situation", "audience"],
  ["situation", "competitive-frame"],
  ["business-core", "positioning"],
  ["audience", "positioning"],
  ["competitive-frame", "positioning"],
] as const satisfies ReadonlyArray<readonly [BusinessNodeId, BusinessNodeId]>;

export type PlacedAnswer = { text: string; from: IntakeField };

export type PlacedNode = {
  id: BusinessNodeId;
  fields: Array<{ field: BusinessFieldId; answer: PlacedAnswer | null }>;
};

/** The intake rows that land on a node (every row but the project name). */
type PlacedRow = Extract<(typeof INTAKE_FIELDS)[number], { place: { node: string } }>;
const PLACED_ROWS: readonly PlacedRow[] = INTAKE_FIELDS.filter(
  (f): f is PlacedRow => f.place !== null,
);
type AnswerKey = Exclude<IntakeField, "projectName">;

/** `intake-place-1`: each given answer on the node and field its row names, as written, nowhere else. */
export function placeIntake(intake: IntakeAnswers): PlacedNode[] {
  return BUSINESS_NODES.map((id) => ({
    id,
    fields: BUSINESS_FIELDS.filter((f) => f.node === id).map((f) => {
      const row = PLACED_ROWS.find((r) => `${r.place.node}.${r.place.field}` === f.id);
      const from: AnswerKey | null = row ? row.key : null;
      const text = from === null ? undefined : intake[from];
      return { field: f.id, answer: from !== null && text !== undefined ? { text, from } : null };
    }),
  }));
}

export type NodeState = "proposed" | "skipped" | "empty";

export type NodeStatus = {
  id: BusinessNodeId;
  state: NodeState;
  /** True on `positioning` in every state. */
  gate: boolean;
  stillToAsk: ProxyQuestionId[];
};

const SKIPPABLE: readonly BusinessNodeId[] = ["audience", "competitive-frame", "positioning"];

const fieldsOf = (node: BusinessNodeId) => PLACED_ROWS.filter((r) => r.place.node === node);

/**
 * `node-state-1`, set from the answers alone. `business-core` always lists its `why` question,
 * which the intake does not ask; the other nodes list the question of each empty optional field.
 */
export function nodeStates(intake: IntakeAnswers): NodeStatus[] {
  return BUSINESS_NODES.map((id) => {
    const rows = fieldsOf(id);
    const given = rows.some((r) => intake[r.key] !== undefined);
    const state: NodeState = given
      ? "proposed"
      : SKIPPABLE.includes(id)
        ? "skipped"
        : id === "situation"
          ? "empty"
          : "proposed";
    const stillToAsk: ProxyQuestionId[] = [];
    for (const r of rows) {
      if (!r.required && r.proxy !== null && intake[r.key] === undefined) {
        stillToAsk.push(r.proxy);
      }
    }
    if (id === "business-core") stillToAsk.push("business-core.proxy.why");
    return { id, state, gate: id === "positioning", stillToAsk };
  });
}
