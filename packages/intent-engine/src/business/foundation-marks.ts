import { expressionOf, isLongName, type ExpressionOutcomes } from "./expression";
import {
  newestByNode,
  type AxisValue,
  type EntryInput,
  type NewestByNode,
  type StoredEntry,
} from "./foundation";
import type { GateState } from "./positioning";

/**
 * The roots, the marks and the node rules of the brand foundation (ORV-291 tech notes section 5;
 * spec `foundation-roots-1`, `foundation-marks-1`, `foundation-entry-1`). One pure function the view
 * and the server door both call, so a control is offered exactly when the door accepts its entry.
 * Nothing about a mark is stored: it is computed from the entries and the positioning gate each time.
 * PR 1 holds the node `identity-frame`, PR 2 adds `architecture` and `name`, PR 3 adds `core-idea`
 * (`core-idea-gate-1`). ORV-298 adds the node `color` and the root `competitive-frame` (spec
 * `expression-roots-1`, `expression-marks-1`), the node `typography` and the node `logo-type`
 * (`logo-type-1`).
 */

/** Fill order, by ORV-126 node number from `core-idea` on: 11, 13, 15, 16. */
export const FOUNDATION_NODES = [
  "identity-frame",
  "architecture",
  "name",
  "core-idea",
  "logo-type",
  "color",
  "typography",
] as const;
export type FoundationNodeId = (typeof FOUNDATION_NODES)[number];
/** The roots the nodes rest on, in ORV-126 number order. */
export const ROOT_IDS = ["situation", "competitive-frame", "positioning"] as const;
export type RootId = (typeof ROOT_IDS)[number];
export type MarkRef = RootId | FoundationNodeId;

/** ORV-126 requires, in ORV-126 order. One entry per node of FOUNDATION_NODES. */
export const FOUNDATION_REQUIRES = {
  "identity-frame": ["positioning"],
  architecture: ["situation", "positioning"],
  name: ["positioning", "architecture"],
  "core-idea": ["positioning", "identity-frame"],
  "logo-type": ["architecture", "name"],
  color: ["competitive-frame", "identity-frame"],
  typography: ["identity-frame"],
} as const satisfies Record<FoundationNodeId, readonly MarkRef[]>;

/** `[from, to]`, one per require. */
export const FOUNDATION_EDGES = FOUNDATION_NODES.flatMap((to) =>
  FOUNDATION_REQUIRES[to].map((from) => [from, to] as const),
);

/** ORV-126 node numbers, for the sort order of every mark list. */
export const MARK_NUMBERS: Record<MarkRef, number> = {
  situation: 1,
  "competitive-frame": 5,
  positioning: 6,
  "identity-frame": 7,
  architecture: 8,
  name: 9,
  "core-idea": 11,
  "logo-type": 13,
  color: 15,
  typography: 16,
};

export type RootStatus = "done" | "skipped" | "open";
export type FoundationRoots = Record<RootId, RootStatus>;

/**
 * `foundation-roots-1`. `situation` is done on every saved project (departure 1), and so is
 * `competitive-frame` (`expression-roots-1`, departure 2): a missing lineup shows only as the
 * colour's question. `positioning`
 * counts by its gate: `given` and `confirmed` are done; `open` with `skipped` is skipped; every
 * other state, a stale `open` and `awaiting-choice` included, is open and not skipped.
 */
export function foundationRoots(gate: { state: GateState; skipped: boolean }): FoundationRoots {
  const positioning: RootStatus =
    gate.state === "given" || gate.state === "confirmed"
      ? "done"
      : gate.state === "open" && gate.skipped
        ? "skipped"
        : "open";
  return { situation: "done", "competitive-frame": "done", positioning };
}

/** A node's status from its newest entry, before the rule of `foundation-marks-1` runs. */
export type OwnStatus = "given" | "derived" | "skipped" | "open";

export function ownStatus(
  newest: NewestByNode,
  expression: ExpressionOutcomes = expressionOf(newest),
): Record<FoundationNodeId, OwnStatus> {
  const personality = newest["identity-frame"];
  const architecture = newest.architecture;
  const name = newest.name;
  const coreIdea = newest["core-idea"];
  return {
    "identity-frame":
      personality === null ? "open" : personality.kind === "given" ? "given" : "skipped", // identity-frame-1
    // architecture-derive-1: only the answer no derives a value; yes and no answer are open.
    architecture: architecture === null || architecture.payload.subBrands ? "open" : "derived",
    name: name === null ? "open" : "given", // working-name-1
    // core-idea-gate-1: a written idea is given, a skip is skipped, none is open.
    "core-idea": coreIdea === null ? "open" : coreIdea.kind === "written" ? "given" : "skipped",
    // logo-type-1: derived with a decision, open without one.
    "logo-type": expression.logoType === null ? "open" : "derived",
    // color-node-1: derived only when the three decisions are made.
    color: expression.color.decided === 3 ? "derived" : "open",
    // typography-node-1: derived with an entry, open without one.
    typography: expression.typography === null ? "open" : "derived",
  };
}

export type FoundationResult<R extends string = MarkRef> = {
  status: "given" | "derived" | "blocked" | "open";
  skipped: boolean;
  blockedBy: R[];
  provisionalOn: R[];
  unchecked: R[];
};

/** A graph the propagation rule runs over: the fixed one below, or a test's own. */
export type MarkGraph<N extends string> = {
  nodes: readonly N[];
  requires: Record<N, readonly (RootId | N)[]>;
  number: Record<RootId | N, number>;
};

const ROOT_RESULT: Record<RootStatus, Pick<FoundationResult, "status" | "skipped">> = {
  done: { status: "given", skipped: false },
  skipped: { status: "open", skipped: true },
  open: { status: "open", skipped: false },
};

/**
 * ORV-126 "The propagation rule" (W4 as code), in fill order. For each require `r` of a node, with
 * `q` the result of `r`: a skipped open `r` is a skip; a blocked `q` passes on its causes, not
 * itself; an open `q` blocks; a given or derived `q` passes on what it rests on, a skip staying a
 * skip. Own `given` keeps its status and lists everything under `unchecked`; else a block wins; else
 * the own status stands with its skips under `provisionalOn`. Each list is sorted by node number.
 */
export function propagateMarks<N extends string>(
  graph: MarkGraph<N>,
  roots: FoundationRoots,
  own: Record<N, OwnStatus>,
): Record<N, FoundationResult<RootId | N>> {
  type Ref = RootId | N;
  const results = new Map<Ref, FoundationResult<Ref>>();
  for (const root of ROOT_IDS) {
    results.set(root, {
      ...ROOT_RESULT[roots[root]],
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
    });
  }
  const sorted = (refs: Set<Ref>): Ref[] =>
    [...refs].sort((a, b) => graph.number[a] - graph.number[b]);
  const resultOf = (ref: Ref): FoundationResult<Ref> => {
    const result = results.get(ref);
    if (result === undefined)
      throw new Error(`mark graph: ${ref} comes after a node that needs it`);
    return result;
  };
  const isSkipped = (ref: Ref) => {
    const result = resultOf(ref);
    return result.status === "open" && result.skipped;
  };
  for (const node of graph.nodes) {
    const skips = new Set<Ref>();
    const blocks = new Set<Ref>();
    const unchecked = new Set<Ref>();
    for (const required of graph.requires[node]) {
      const q = resultOf(required);
      if (q.status === "open" && q.skipped) {
        skips.add(required);
      } else if (q.status === "blocked") {
        for (const cause of q.blockedBy) blocks.add(cause);
      } else if (q.status === "open") {
        blocks.add(required);
      } else {
        for (const x of [...q.provisionalOn, ...q.unchecked])
          (isSkipped(x) ? skips : unchecked).add(x);
      }
    }
    const status = own[node];
    if (status === "given") {
      results.set(node, {
        status: "given",
        skipped: false,
        blockedBy: [],
        provisionalOn: [],
        unchecked: sorted(new Set([...skips, ...blocks, ...unchecked])),
      });
    } else if (blocks.size > 0) {
      results.set(node, {
        status: "blocked",
        skipped: false,
        blockedBy: sorted(blocks),
        provisionalOn: [],
        unchecked: [],
      });
    } else {
      results.set(node, {
        status: status === "skipped" ? "open" : status,
        skipped: status === "skipped",
        blockedBy: [],
        provisionalOn: sorted(skips),
        unchecked: sorted(unchecked),
      });
    }
  }
  return Object.fromEntries(graph.nodes.map((node) => [node, results.get(node)])) as Record<
    N,
    FoundationResult<Ref>
  >;
}

const GRAPH: MarkGraph<FoundationNodeId> = {
  nodes: FOUNDATION_NODES,
  requires: FOUNDATION_REQUIRES,
  number: MARK_NUMBERS,
};

/** `foundation-marks-1`: the status and the three lists of every node on the board. */
export function foundationMarks(
  roots: FoundationRoots,
  own: Record<FoundationNodeId, OwnStatus>,
): Record<FoundationNodeId, FoundationResult> {
  return propagateMarks(GRAPH, roots, own);
}

/**
 * "Block cause", the non-empty `blockedBy` the node would have if it held no entry: the same
 * function with the node's own status set to `open`, so the door and the view cannot disagree.
 */
export function blockCause(
  node: FoundationNodeId,
  roots: FoundationRoots,
  own: Record<FoundationNodeId, OwnStatus>,
): MarkRef[] {
  return foundationMarks(roots, { ...own, [node]: "open" })[node].blockedBy;
}

/**
 * The "Allowed when" column of `foundation-entry-1` and `expression-entry-1`, for the entries
 * built so far.
 */
export function entryAllowed(
  entry: Pick<EntryInput, "node" | "kind">,
  state: { roots: FoundationRoots; newest: NewestByNode },
): boolean {
  const own = ownStatus(state.newest);
  switch (entry.node) {
    case "identity-frame": {
      const newest = state.newest["identity-frame"];
      if (blockCause("identity-frame", state.roots, own).length > 0) return false;
      return entry.kind === "given" ? newest?.kind !== "given" : newest === null;
    }
    // The answer is an input of `situation`, and a name may come first (ORV-126 group B): neither
    // waits for a block cause, each is allowed once.
    case "architecture":
      return state.newest.architecture === null;
    case "name":
      return state.newest.name === null;
    case "core-idea": {
      const newest = state.newest["core-idea"];
      if (blockCause("core-idea", state.roots, own).length > 0) return false;
      return entry.kind === "written" ? newest?.kind !== "written" : newest === null;
    }
    // expression-entry-1: the lineup is a fact about the business, given once, whatever the marks.
    case "competitive-frame":
      return state.newest["competitive-frame"] === null;
    // The scripts are a fact about the brand, given once while the node waits (typography-node-1).
    case "typography":
      return state.newest.typography === null;
    // The need for a small square mark is a fact about the brand, given once while the node waits.
    // A long name needs no answer: the name alone gives the symbol (name-length-1, logo-type-1).
    case "logo-type": {
      const name = state.newest.name;
      return (
        state.newest["logo-type"] === null && !(name !== null && isLongName(name.payload.name))
      );
    }
  }
}

/** Everything the view and the door need from the gate and the stored entries, computed once. */
export function foundationState(
  gate: { state: GateState; skipped: boolean },
  entries: readonly StoredEntry[],
) {
  const roots = foundationRoots(gate);
  const newest = newestByNode(entries);
  // The decisions of the expression nodes, worked out once for the status and the view.
  const expression = expressionOf(newest);
  const own = ownStatus(newest, expression);
  return { roots, newest, own, expression, results: foundationMarks(roots, own) };
}

export type FoundationState = ReturnType<typeof foundationState>;

/** `architecture-derive-1`: the value "single brand, one unit" of an answer no, never stored. */
export type DerivedArchitecture = {
  key: "business.architecture.single";
  rule: "architecture-derive-1";
};

/**
 * The derived value of a node result: only a `derived` result has one. A `blocked` result shows the
 * stored answer and no value, an `open` one (the answer yes, or none) has none.
 */
export function derivedArchitecture(result: FoundationResult): DerivedArchitecture | null {
  return result.status === "derived"
    ? { key: "business.architecture.single", rule: "architecture-derive-1" }
    : null;
}

export type AxisPoint = 1 | 2 | 3 | 4 | 5;

/** The editor holds points; the entry and the row hold values (W3). */
export function axisValueOf(point: AxisPoint): AxisValue {
  return ((point - 1) * 25) as AxisValue; // 0, 25, 50, 75, 100
}

export function axisPointOf(value: AxisValue): AxisPoint {
  return (value / 25 + 1) as AxisPoint;
}

/** A row of `core-idea-gate-1`: the gate state, the state line's key, the gate line and the label. */
export type CoreIdeaGate = {
  gate: "blocked" | "open" | "given";
  skipped: boolean;
  /** The state line, a key of `business.state.*`. */
  state: "waiting" | "skipped" | "empty" | "agreed";
  /** The line under the state: the gate is still shut, or it has passed. */
  gateLine: "business.state.gate" | "business.coreIdea.gatePassed";
  /** True only in `given`: nothing builds on the core idea before then. */
  gatePassed: boolean;
  /** The label of the statement, shown with a written idea only. */
  label: "business.positioning.by.own" | null;
};

/**
 * `core-idea-gate-1`, the four rows of its table. The gate passes only in `given`, a written idea;
 * a block cause, no entry and a skip each leave it shut with the gate line `business.state.gate`.
 */
export function coreIdeaGate(result: FoundationResult): CoreIdeaGate {
  if (result.status === "given") {
    return {
      gate: "given",
      skipped: false,
      state: "agreed",
      gateLine: "business.coreIdea.gatePassed",
      gatePassed: true,
      label: "business.positioning.by.own",
    };
  }
  const shut = { gateLine: "business.state.gate", gatePassed: false, label: null } as const;
  if (result.status === "blocked") {
    return { gate: "blocked", skipped: false, state: "waiting", ...shut };
  }
  return result.skipped
    ? { gate: "open", skipped: true, state: "skipped", ...shut }
    : { gate: "open", skipped: false, state: "empty", ...shut };
}
