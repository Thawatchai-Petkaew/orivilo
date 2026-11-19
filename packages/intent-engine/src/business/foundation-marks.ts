import { newestByNode, type AxisValue, type EntryInput, type StoredEntry } from "./foundation";
import type { GateState } from "./positioning";

/**
 * The roots, the marks and the node rules of the brand foundation (ORV-291 tech notes section 5;
 * spec `foundation-roots-1`, `foundation-marks-1`, `foundation-entry-1`). One pure function the view
 * and the server door both call, so a control is offered exactly when the door accepts its entry.
 * Nothing about a mark is stored: it is computed from the entries and the positioning gate each time.
 * PR 1 holds the node `identity-frame`; PRs 2 and 3 add the other three to each list.
 */

/** Fill order. PR 2 adds "architecture" and "name"; PR 3 adds "core-idea". */
export const FOUNDATION_NODES = ["identity-frame"] as const;
export type FoundationNodeId = (typeof FOUNDATION_NODES)[number];
/** The two roots the nodes rest on, and the nodes themselves. */
export type RootId = "situation" | "positioning";
export type MarkRef = RootId | FoundationNodeId;

/** ORV-126 requires, in ORV-126 order. One entry per node of FOUNDATION_NODES. */
export const FOUNDATION_REQUIRES = {
  "identity-frame": ["positioning"],
} as const satisfies Record<FoundationNodeId, readonly MarkRef[]>;

/** `[from, to]`, one per require. */
export const FOUNDATION_EDGES = FOUNDATION_NODES.flatMap((to) =>
  FOUNDATION_REQUIRES[to].map((from) => [from, to] as const),
);

/** ORV-126 node numbers, for the sort order of every mark list. */
export const MARK_NUMBERS: Record<MarkRef, number> = {
  situation: 1,
  positioning: 6,
  "identity-frame": 7,
};

export type RootStatus = "done" | "skipped" | "open";
export type FoundationRoots = Record<RootId, RootStatus>;

/**
 * `foundation-roots-1`. `situation` is done on every saved project (departure 1). `positioning`
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
  return { situation: "done", positioning };
}

/** A node's status from its newest entry, before the rule of `foundation-marks-1` runs. */
export type OwnStatus = "given" | "derived" | "skipped" | "open";

export function ownStatus(
  newest: Record<FoundationNodeId, StoredEntry | null>,
): Record<FoundationNodeId, OwnStatus> {
  const entry = newest["identity-frame"];
  return {
    "identity-frame": entry === null ? "open" : entry.kind === "given" ? "given" : "skipped",
  }; // identity-frame-1
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
  for (const root of ["situation", "positioning"] as const) {
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

/** The "Allowed when" column of `foundation-entry-1`, for the entries PR 1 builds. */
export function entryAllowed(
  entry: Pick<EntryInput, "node" | "kind">,
  state: {
    roots: FoundationRoots;
    newest: Record<FoundationNodeId, StoredEntry | null>;
  },
): boolean {
  const own = ownStatus(state.newest);
  switch (entry.node) {
    case "identity-frame": {
      const newest = state.newest["identity-frame"];
      if (blockCause("identity-frame", state.roots, own).length > 0) return false;
      return entry.kind === "given" ? newest?.kind !== "given" : newest === null;
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
  const own = ownStatus(newest);
  return { roots, newest, own, results: foundationMarks(roots, own) };
}

export type FoundationState = ReturnType<typeof foundationState>;

export type AxisPoint = 1 | 2 | 3 | 4 | 5;

/** The editor holds points; the entry and the row hold values (W3). */
export function axisValueOf(point: AxisPoint): AxisValue {
  return ((point - 1) * 25) as AxisValue; // 0, 25, 50, 75, 100
}

export function axisPointOf(value: AxisValue): AxisPoint {
  return (value / 25 + 1) as AxisPoint;
}
