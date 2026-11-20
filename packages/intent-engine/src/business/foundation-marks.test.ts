import { describe, expect, it } from "vitest";
import { storedEntrySchema, type NewestByNode, type StoredEntry } from "./foundation";
import {
  blockCause,
  derivedArchitecture,
  entryAllowed,
  FOUNDATION_EDGES,
  FOUNDATION_NODES,
  FOUNDATION_REQUIRES,
  foundationMarks,
  foundationRoots,
  foundationState,
  MARK_NUMBERS,
  ownStatus,
  propagateMarks,
  type FoundationResult,
  type FoundationNodeId,
  type FoundationRoots,
  type MarkGraph,
  type OwnStatus,
  type RootStatus,
} from "./foundation-marks";
import { positioningGate, type GateState, type StoredChoice } from "./positioning";

// ORV-291 tech notes section 13, T4 to T6; spec rows 4 to 7, W4 and `foundation-roots-1`.

const AXES = { playful: 0, expressive: 25, structured: 50, warm: 75, premium: 100 };
type EntryOf<N extends StoredEntry["node"]> = Extract<StoredEntry, { node: N }>;
const entry = (kind: "given" | "skipped", id = "e1", createdAt = "2026-11-19T03:00:00.000Z") =>
  storedEntrySchema.parse({
    id,
    node: "identity-frame",
    kind,
    payload: kind === "given" ? { axes: AXES } : {},
    createdAt,
  }) as EntryOf<"identity-frame">;
const answer = (subBrands: boolean, id = "a1", createdAt = "2026-11-19T03:00:00.000Z") =>
  storedEntrySchema.parse({
    id,
    node: "architecture",
    kind: "answered",
    payload: { subBrands },
    createdAt,
  }) as EntryOf<"architecture">;
const nameEntry = (name = "ORIVILO", id = "n1", createdAt = "2026-11-19T03:00:00.000Z") =>
  storedEntrySchema.parse({
    id,
    node: "name",
    kind: "given",
    payload: { name },
    createdAt,
  }) as EntryOf<"name">;
/** The newest entry of each node, none unless named. */
const newestOf = (some: Partial<NewestByNode> = {}): NewestByNode => ({
  "identity-frame": null,
  architecture: null,
  name: null,
  ...some,
});
/** Every node's own status, open unless named. */
const ownOf = (
  some: Partial<Record<FoundationNodeId, OwnStatus>> = {},
): Record<FoundationNodeId, OwnStatus> => ({
  "identity-frame": "open",
  architecture: "open",
  name: "open",
  ...some,
});

describe("the lists", () => {
  it("holds the three nodes in fill order, their requires in ORV-126 order, and one edge per require", () => {
    expect(FOUNDATION_NODES).toEqual(["identity-frame", "architecture", "name"]);
    expect(FOUNDATION_REQUIRES).toEqual({
      "identity-frame": ["positioning"],
      architecture: ["situation", "positioning"],
      name: ["positioning", "architecture"],
    });
    expect(FOUNDATION_EDGES).toEqual([
      ["positioning", "identity-frame"],
      ["situation", "architecture"],
      ["positioning", "architecture"],
      ["positioning", "name"],
      ["architecture", "name"],
    ]);
  });

  it("gives the board eight nodes and eleven edges (W2): ORV-281's five and six, plus these", () => {
    expect(5 + FOUNDATION_NODES.length).toBe(8);
    expect(6 + FOUNDATION_EDGES.length).toBe(11);
  });

  it("sorts by the ORV-126 node numbers", () => {
    expect(MARK_NUMBERS).toEqual({
      situation: 1,
      positioning: 6,
      "identity-frame": 7,
      architecture: 8,
      name: 9,
    });
  });
});

describe("roots", () => {
  const roots = (state: GateState, skipped: boolean) => foundationRoots({ state, skipped });

  it("situation is done on every saved project", () => {
    for (const state of ["open", "awaiting-choice", "given", "confirmed"] as const) {
      expect(roots(state, false).situation).toBe("done");
    }
  });

  it("given and confirmed are done", () => {
    expect(roots("given", false).positioning).toBe("done");
    expect(roots("confirmed", false).positioning).toBe("done");
  });

  it("open with skipped is skipped, and only open with skipped", () => {
    expect(roots("open", true).positioning).toBe("skipped");
    expect(roots("awaiting-choice", true).positioning).toBe("open");
  });

  it("open, a stale open and awaiting-choice are open and not skipped", () => {
    expect(roots("open", false).positioning).toBe("open");
    expect(roots("awaiting-choice", false).positioning).toBe("open");
    const stale = positioningGate({
      newestIntakeId: "intake-b",
      choice: {
        id: "c",
        intakeId: "intake-a",
        createdAt: "2026-11-18T03:04:05.000Z",
        kind: "written",
        statement: "x",
        draftId: null,
        option: null,
      } satisfies StoredChoice,
      draftOfNewest: false,
    });
    expect(stale).toEqual({ state: "open", skipped: false, stale: true });
    expect(foundationRoots(stale).positioning).toBe("open");
  });

  it("a given or confirmed gate is done even when a skip flag came with it", () => {
    expect(roots("given", true).positioning).toBe("done");
  });
});

describe("own status", () => {
  it("is open with no entry, skipped for a skip and given for a given entry", () => {
    expect(ownStatus(newestOf())).toEqual(ownOf());
    expect(ownStatus(newestOf({ "identity-frame": entry("skipped") }))).toEqual(
      ownOf({ "identity-frame": "skipped" }),
    );
    expect(ownStatus(newestOf({ "identity-frame": entry("given") }))).toEqual(
      ownOf({ "identity-frame": "given" }),
    );
  });

  // architecture-derive-1 and working-name-1.
  it("architecture is derived for the answer no, open for yes and open for none", () => {
    expect(ownStatus(newestOf({ architecture: answer(false) })).architecture).toBe("derived");
    expect(ownStatus(newestOf({ architecture: answer(true) })).architecture).toBe("open");
    expect(ownStatus(newestOf()).architecture).toBe("open");
  });

  it("name is given with an entry and open without one, and no node reads another's entry", () => {
    expect(ownStatus(newestOf({ name: nameEntry() })).name).toBe("given");
    expect(ownStatus(newestOf()).name).toBe("open");
    expect(ownStatus(newestOf({ name: nameEntry(), architecture: answer(false) }))).toEqual(
      ownOf({ name: "given", architecture: "derived" }),
    );
  });
});

/** One line per node, in W4's print form. */
function line<N extends string>(
  graph: MarkGraph<N>,
  results: Record<N, FoundationResult<string>>,
): string {
  return graph.nodes
    .map((n) => {
      const r = results[n];
      const status = r.status === "open" && r.skipped ? "skipped" : r.status;
      return (
        `${n}:${status}` +
        (r.blockedBy.length > 0 ? `/blockedBy=${r.blockedBy.join(",")}` : "") +
        (r.provisionalOn.length > 0 ? `/provisionalOn=${r.provisionalOn.join(",")}` : "") +
        (r.unchecked.length > 0 ? `/unchecked=${r.unchecked.join(",")}` : "")
      );
    })
    .join(" ");
}

const roots = (positioning: RootStatus): FoundationRoots => ({ situation: "done", positioning });

describe("W4", () => {
  // The four nodes of ORV-126 with W4's requires: the algorithm runs over them already in PR 1.
  const W4 = {
    nodes: ["identity-frame", "architecture", "name", "core-idea"],
    requires: {
      "identity-frame": ["positioning"],
      architecture: ["situation", "positioning"],
      name: ["positioning", "architecture"],
      "core-idea": ["positioning", "identity-frame"],
    },
    number: {
      situation: 1,
      positioning: 6,
      "identity-frame": 7,
      architecture: 8,
      name: 9,
      "core-idea": 11,
    },
  } as const satisfies MarkGraph<"identity-frame" | "architecture" | "name" | "core-idea">;
  type N = (typeof W4.nodes)[number];
  const graph: MarkGraph<N> = {
    nodes: W4.nodes,
    requires: W4.requires,
    number: W4.number,
  };
  const GIVEN: Record<N, OwnStatus> = {
    "identity-frame": "given",
    architecture: "derived",
    name: "given",
    "core-idea": "given",
  };
  const OPEN: Record<N, OwnStatus> = {
    "identity-frame": "open",
    architecture: "open",
    name: "open",
    "core-idea": "open",
  };
  const run = (positioning: RootStatus, own: Record<N, OwnStatus>) =>
    line(graph, propagateMarks(graph, roots(positioning), own));

  it("case 1: positioning done, all given", () => {
    expect(run("done", GIVEN)).toBe(
      "identity-frame:given architecture:derived name:given core-idea:given",
    );
  });

  it("case 2: the same with positioning skipped", () => {
    expect(run("skipped", GIVEN)).toBe(
      "identity-frame:given/unchecked=positioning architecture:derived/provisionalOn=positioning name:given/unchecked=positioning core-idea:given/unchecked=positioning",
    );
  });

  it("case 3: positioning open and nothing else stored", () => {
    expect(run("open", OPEN)).toBe(
      "identity-frame:blocked/blockedBy=positioning architecture:blocked/blockedBy=positioning name:blocked/blockedBy=positioning core-idea:blocked/blockedBy=positioning",
    );
  });

  it("case 4: positioning done, the personality skipped, architecture yes, core idea given", () => {
    expect(
      run("done", {
        "identity-frame": "skipped",
        architecture: "open",
        name: "open",
        "core-idea": "given",
      }),
    ).toBe(
      "identity-frame:skipped architecture:open name:blocked/blockedBy=architecture core-idea:given/unchecked=identity-frame",
    );
  });

  it("case 5: the values of case 1 with positioning open", () => {
    expect(run("open", GIVEN)).toBe(
      "identity-frame:given/unchecked=positioning architecture:blocked/blockedBy=positioning name:given/unchecked=positioning core-idea:given/unchecked=positioning",
    );
  });

  it("each list is sorted by node number, whatever the order of the requires", () => {
    // situation is open (a block), positioning skipped and a skipped (two skips): b's own given
    // lists all three, by number 1, 6, 7.
    const open: FoundationRoots = { situation: "open", positioning: "skipped" };
    const g = (order: Array<"a" | "situation" | "positioning">): MarkGraph<"a" | "b"> => ({
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: order },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    });
    for (const order of [
      ["a", "situation", "positioning"],
      ["situation", "positioning", "a"],
      ["positioning", "a", "situation"],
    ] as const) {
      const r = propagateMarks(g([...order]), open, { a: "skipped", b: "given" });
      expect(r.b.unchecked, order.join(",")).toEqual(["situation", "positioning", "a"]);
    }
  });

  it("a node rests on a skipped root through two requires and lists it once", () => {
    const r = propagateMarks(graph, roots("skipped"), GIVEN);
    expect(r.name.unchecked).toEqual(["positioning"]);
    expect(r["core-idea"].unchecked).toEqual(["positioning"]);
  });

  it("a node that is not given keeps what it rests on that is not skipped under unchecked", () => {
    // a is given with positioning open (unchecked positioning); b, derived, requires only a.
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: ["a"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    const r = propagateMarks(g, roots("open"), { a: "given", b: "derived" });
    expect(r.b).toEqual({
      status: "derived",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: ["positioning"],
    });
  });

  it("a skip a require rests on passes on as a skip, a given one on as unchecked", () => {
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: ["a"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    // a is derived on a skipped positioning; b, derived, rests on a: positioning stays a skip.
    expect(propagateMarks(g, roots("skipped"), { a: "derived", b: "derived" }).b).toEqual({
      status: "derived",
      skipped: false,
      blockedBy: [],
      provisionalOn: ["positioning"],
      unchecked: [],
    });
  });

  it("a given node rests on what its given require is unchecked against, and lists it", () => {
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: ["a"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    // a is given with positioning open; b, given, requires only a: nothing blocks b, a's gap travels.
    const r = propagateMarks(g, roots("open"), { a: "given", b: "given" });
    expect(r.a.unchecked).toEqual(["positioning"]);
    expect(r.b.unchecked).toEqual(["positioning"]);
  });

  it("lists each node once in provisionalOn, blockedBy and unchecked, however many requires reach it", () => {
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: ["positioning", "a"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    // Skipped positioning reaches b directly and through a (provisional): once.
    expect(
      propagateMarks(g, roots("skipped"), { a: "derived", b: "open" }).b.provisionalOn,
    ).toEqual(["positioning"]);
    // Open positioning blocks b directly and through a (blocked by it): once.
    expect(propagateMarks(g, roots("open"), { a: "open", b: "open" }).b.blockedBy).toEqual([
      "positioning",
    ]);
    // Positioning gap reaches a given b directly (open) and through a given a (unchecked): once.
    expect(propagateMarks(g, roots("open"), { a: "given", b: "given" }).b.unchecked).toEqual([
      "positioning",
    ]);
    // A non-given b that rests on a given a and an unchecked root: once in unchecked.
    const g2: MarkGraph<"a" | "b" | "c"> = {
      nodes: ["a", "b", "c"],
      requires: { a: ["positioning"], b: ["a"], c: ["a", "b"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8, c: 9 },
    };
    expect(
      propagateMarks(g2, roots("open"), { a: "given", b: "derived", c: "derived" }).c.unchecked,
    ).toEqual(["positioning"]);
  });

  it("a blocked require passes its causes on, not itself", () => {
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: ["a"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    const r = propagateMarks(g, roots("open"), { a: "open", b: "open" });
    expect(r.a.blockedBy).toEqual(["positioning"]);
    expect(r.b.blockedBy).toEqual(["positioning"]);
  });

  it("a skipped require is provisional for an open node, and the node is not blocked", () => {
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["positioning"], b: ["a"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    const r = propagateMarks(g, roots("done"), { a: "skipped", b: "open" });
    expect(r.a).toEqual({
      status: "open",
      skipped: true,
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
    });
    expect(r.b).toEqual({
      status: "open",
      skipped: false,
      blockedBy: [],
      provisionalOn: ["a"],
      unchecked: [],
    });
  });

  it("a block wins over an own skip: the node is blocked, not skipped", () => {
    const g: MarkGraph<"a"> = {
      nodes: ["a"],
      requires: { a: ["positioning"] },
      number: { situation: 1, positioning: 6, a: 7 },
    };
    const r = propagateMarks(g, roots("open"), { a: "skipped" });
    expect(r.a.status).toBe("blocked");
    expect(r.a.skipped).toBe(false);
  });

  it("a graph that lists a require after its node is refused, not read as open", () => {
    const g: MarkGraph<"a" | "b"> = {
      nodes: ["a", "b"],
      requires: { a: ["b"], b: ["positioning"] },
      number: { situation: 1, positioning: 6, a: 7, b: 8 },
    };
    expect(() => propagateMarks(g, roots("done"), { a: "open", b: "open" })).toThrow();
  });
});

describe("the marks of the nodes built so far", () => {
  const marks = (positioning: RootStatus, own: OwnStatus) =>
    foundationMarks(roots(positioning), ownOf({ "identity-frame": own }))["identity-frame"];

  it("matches W4 cases 1, 2, 3, 4 and 5 for identity-frame", () => {
    expect(marks("done", "given")).toEqual({
      status: "given",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
    });
    expect(marks("skipped", "given")).toEqual({
      status: "given",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: ["positioning"],
    });
    expect(marks("open", "open")).toEqual({
      status: "blocked",
      skipped: false,
      blockedBy: ["positioning"],
      provisionalOn: [],
      unchecked: [],
    });
    expect(marks("done", "skipped")).toEqual({
      status: "open",
      skipped: true,
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
    });
    expect(marks("open", "given").unchecked).toEqual(["positioning"]);
    expect(marks("open", "given").status).toBe("given");
  });

  it("an open node with positioning skipped is open and provisional on positioning", () => {
    expect(marks("skipped", "open")).toEqual({
      status: "open",
      skipped: false,
      blockedBy: [],
      provisionalOn: ["positioning"],
      unchecked: [],
    });
  });
});

describe("block cause", () => {
  it("is positioning while positioning is open, and none when it is done or skipped", () => {
    expect(blockCause("identity-frame", roots("open"), ownOf())).toEqual(["positioning"]);
    expect(blockCause("identity-frame", roots("done"), ownOf())).toEqual([]);
    expect(blockCause("identity-frame", roots("skipped"), ownOf())).toEqual([]);
  });

  it("is computed as if the node held no entry: a given node still shows its cause", () => {
    expect(
      blockCause("identity-frame", roots("open"), ownOf({ "identity-frame": "given" })),
    ).toEqual(["positioning"]);
    expect(
      blockCause("identity-frame", roots("open"), ownOf({ "identity-frame": "skipped" })),
    ).toEqual(["positioning"]);
  });

  it("name is blocked by architecture while it is open, and by positioning first when that is open", () => {
    expect(blockCause("name", roots("done"), ownOf())).toEqual(["architecture"]);
    expect(blockCause("name", roots("done"), ownOf({ architecture: "derived" }))).toEqual([]);
    expect(blockCause("name", roots("open"), ownOf({ architecture: "derived" }))).toEqual([
      "positioning",
    ]);
    expect(blockCause("name", roots("open"), ownOf())).toEqual(["positioning"]);
    // The name's own entry never lifts the cause.
    expect(blockCause("name", roots("done"), ownOf({ name: "given" }))).toEqual(["architecture"]);
  });

  it("architecture is blocked by positioning alone: situation is done", () => {
    expect(blockCause("architecture", roots("open"), ownOf())).toEqual(["positioning"]);
    expect(blockCause("architecture", roots("done"), ownOf())).toEqual([]);
    expect(blockCause("architecture", roots("skipped"), ownOf())).toEqual([]);
  });
});

describe("allowed", () => {
  const NEWEST = {
    none: null,
    skipped: entry("skipped"),
    given: entry("given"),
  } as const;
  const POSITIONING: RootStatus[] = ["done", "skipped", "open"];

  // The "Allowed when" column of `foundation-entry-1`: given while no block cause and the newest
  // entry is not given; skipped while no block cause and no entry.
  const EXPECTED: Record<string, boolean> = {
    "done none given": true,
    "done none skipped": true,
    "done skipped given": true,
    "done skipped skipped": false,
    "done given given": false,
    "done given skipped": false,
    "skipped none given": true,
    "skipped none skipped": true,
    "skipped skipped given": true,
    "skipped skipped skipped": false,
    "skipped given given": false,
    "skipped given skipped": false,
    "open none given": false,
    "open none skipped": false,
    "open skipped given": false,
    "open skipped skipped": false,
    "open given given": false,
    "open given skipped": false,
  };

  it("holds the matrix of every kind against no entry, a skip and a given entry, with and without a block cause", () => {
    const got: Record<string, boolean> = {};
    for (const p of POSITIONING) {
      for (const [name, newest] of Object.entries(NEWEST)) {
        for (const kind of ["given", "skipped"] as const) {
          got[`${p} ${name} ${kind}`] = entryAllowed(
            { node: "identity-frame", kind },
            { roots: roots(p), newest: newestOf({ "identity-frame": newest }) },
          );
        }
      }
    }
    expect(got).toEqual(EXPECTED);
  });

  // The "Allowed when" column for the two new kinds: no entry on the node, and nothing else. The
  // block cause is not consulted (a name may come first, the answer is an input of `situation`).
  it("architecture answered and name given are allowed exactly while the node has no entry, whatever the marks", () => {
    const got: Record<string, boolean> = {};
    for (const p of POSITIONING) {
      for (const [label, newest] of Object.entries({
        "no entry": newestOf(),
        "answer no": newestOf({ architecture: answer(false) }),
        "answer yes": newestOf({ architecture: answer(true) }),
        "name given": newestOf({ name: nameEntry() }),
        "personality skipped": newestOf({ "identity-frame": entry("skipped") }),
        "personality given": newestOf({ "identity-frame": entry("given") }),
      })) {
        got[`${p} / ${label} / architecture`] = entryAllowed(
          { node: "architecture", kind: "answered" },
          { roots: roots(p), newest },
        );
        got[`${p} / ${label} / name`] = entryAllowed(
          { node: "name", kind: "given" },
          { roots: roots(p), newest },
        );
      }
    }
    const expected: Record<string, boolean> = {};
    for (const p of POSITIONING) {
      expected[`${p} / no entry / architecture`] = true;
      expected[`${p} / no entry / name`] = true;
      expected[`${p} / answer no / architecture`] = false;
      expected[`${p} / answer no / name`] = true;
      expected[`${p} / answer yes / architecture`] = false;
      expected[`${p} / answer yes / name`] = true;
      expected[`${p} / name given / architecture`] = true;
      expected[`${p} / name given / name`] = false;
      expected[`${p} / personality skipped / architecture`] = true;
      expected[`${p} / personality skipped / name`] = true;
      expected[`${p} / personality given / architecture`] = true;
      expected[`${p} / personality given / name`] = true;
    }
    expect(got).toEqual(expected);
  });
});

describe("foundationState", () => {
  it("bundles the roots, the newest entry, the own status and the results once", () => {
    const state = foundationState({ state: "open", skipped: true }, [
      entry("skipped", "a", "2026-11-19T03:00:00.000Z"),
      entry("given", "b", "2026-11-19T04:00:00.000Z"),
    ]);
    expect(state.roots).toEqual({ situation: "done", positioning: "skipped" });
    expect(state.newest["identity-frame"]?.kind).toBe("given");
    expect(state.own).toEqual(ownOf({ "identity-frame": "given" }));
    expect(state.results["identity-frame"].status).toBe("given");
    expect(state.results["identity-frame"].unchecked).toEqual(["positioning"]);
  });

  it("holds a result for each of the three nodes, from the stored answer and name", () => {
    const state = foundationState({ state: "given", skipped: false }, [answer(false), nameEntry()]);
    expect(state.own).toEqual(ownOf({ architecture: "derived", name: "given" }));
    expect(Object.keys(state.results)).toEqual(["identity-frame", "architecture", "name"]);
    expect(state.results.architecture.status).toBe("derived");
    expect(state.results.name.status).toBe("given");
  });
});

// T28, spec rows 15 to 17 and 20; W4's cases on the real graph of PR 2.
const PRINT = (
  results: Record<FoundationNodeId, FoundationResult>,
  nodes: readonly FoundationNodeId[] = FOUNDATION_NODES,
) =>
  nodes
    .map((n) => {
      const r = results[n];
      const status = r.status === "open" && r.skipped ? "skipped" : r.status;
      return (
        `${n}:${status}` +
        (r.blockedBy.length > 0 ? `/blockedBy=${r.blockedBy.join(",")}` : "") +
        (r.provisionalOn.length > 0 ? `/provisionalOn=${r.provisionalOn.join(",")}` : "") +
        (r.unchecked.length > 0 ? `/unchecked=${r.unchecked.join(",")}` : "")
      );
    })
    .join(" ");

describe("the three nodes on the real graph, W4's cases", () => {
  const run = (positioning: RootStatus, own: Record<FoundationNodeId, OwnStatus>) =>
    PRINT(foundationMarks(roots(positioning), own));

  it("case 1 to 5 print W4's lines for identity-frame, architecture and name", () => {
    const all = ownOf({ "identity-frame": "given", architecture: "derived", name: "given" });
    expect(run("done", all)).toBe("identity-frame:given architecture:derived name:given");
    expect(run("skipped", all)).toBe(
      "identity-frame:given/unchecked=positioning architecture:derived/provisionalOn=positioning name:given/unchecked=positioning",
    );
    expect(run("open", ownOf())).toBe(
      "identity-frame:blocked/blockedBy=positioning architecture:blocked/blockedBy=positioning name:blocked/blockedBy=positioning",
    );
    expect(run("done", ownOf({ "identity-frame": "skipped" }))).toBe(
      "identity-frame:skipped architecture:open name:blocked/blockedBy=architecture",
    );
    expect(run("open", all)).toBe(
      "identity-frame:given/unchecked=positioning architecture:blocked/blockedBy=positioning name:given/unchecked=positioning",
    );
  });
});

describe("architecture derive", () => {
  const results = (positioning: RootStatus, entries: StoredEntry[]) =>
    foundationState(
      {
        state: positioning === "done" ? "given" : "open",
        skipped: positioning === "skipped",
      },
      entries,
    ).results;

  it("an answer no gives derived, and the value is the single brand by rule architecture-derive-1", () => {
    const r = results("done", [answer(false)]).architecture;
    expect(r).toEqual({
      status: "derived",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
    });
    expect(derivedArchitecture(r)).toEqual({
      key: "business.architecture.single",
      rule: "architecture-derive-1",
    });
  });

  it("an answer yes is open, not skipped, and shows no value", () => {
    const r = results("done", [answer(true)]).architecture;
    expect(r).toEqual({
      status: "open",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
    });
    expect(derivedArchitecture(r)).toBeNull();
  });

  it("no answer is open and shows no value", () => {
    const r = results("done", []).architecture;
    expect(r.status).toBe("open");
    expect(derivedArchitecture(r)).toBeNull();
  });

  it("while positioning is open an answer no is blocked by it and shows no value (row 17, W4)", () => {
    const r = results("open", [answer(false)]).architecture;
    expect(r).toMatchObject({ status: "blocked", blockedBy: ["positioning"] });
    expect(derivedArchitecture(r)).toBeNull();
    expect(PRINT(results("open", [answer(false)]), ["architecture"])).toBe(
      "architecture:blocked/blockedBy=positioning",
    );
  });

  it("with positioning skipped an answer no is derived and provisional on positioning", () => {
    const r = results("skipped", [answer(false)]).architecture;
    expect(r).toMatchObject({ status: "derived", provisionalOn: ["positioning"] });
    expect(PRINT(results("skipped", [answer(false)]), ["architecture"])).toBe(
      "architecture:derived/provisionalOn=positioning",
    );
    expect(derivedArchitecture(r)).toEqual({
      key: "business.architecture.single",
      rule: "architecture-derive-1",
    });
  });

  it("no answer with positioning open is blocked, with a skipped positioning provisional and open", () => {
    expect(PRINT(results("open", []), ["architecture"])).toBe(
      "architecture:blocked/blockedBy=positioning",
    );
    expect(results("skipped", []).architecture).toMatchObject({
      status: "open",
      skipped: false,
      provisionalOn: ["positioning"],
    });
  });

  it("an answer yes makes name blocked by architecture (W4 case 4), and an answer no does not", () => {
    expect(results("done", [answer(true)]).name).toMatchObject({
      status: "blocked",
      blockedBy: ["architecture"],
    });
    expect(results("done", [answer(false)]).name.status).toBe("open");
    expect(results("done", [answer(false), nameEntry()]).name.status).toBe("given");
  });

  it("a name given ahead of positioning is given with positioning unchecked (W4 case 5, row 20)", () => {
    expect(results("open", [nameEntry()]).name).toEqual({
      status: "given",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: ["positioning"],
    });
  });

  it("a name given while architecture is yes lists architecture as unchecked", () => {
    expect(results("done", [answer(true), nameEntry()]).name).toEqual({
      status: "given",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: ["architecture"],
    });
  });

  it("a name given on a skipped positioning and an answer yes lists positioning, then architecture, by number", () => {
    expect(results("skipped", [answer(true), nameEntry()]).name.unchecked).toEqual([
      "positioning",
      "architecture",
    ]);
  });

  it("derivedArchitecture is null for every result that is not derived", () => {
    for (const status of ["given", "blocked", "open"] as const) {
      expect(
        derivedArchitecture({
          status,
          skipped: false,
          blockedBy: [],
          provisionalOn: [],
          unchecked: [],
        }),
        status,
      ).toBeNull();
    }
    expect(
      derivedArchitecture({
        status: "open",
        skipped: true,
        blockedBy: [],
        provisionalOn: [],
        unchecked: [],
      }),
    ).toBeNull();
  });
});
