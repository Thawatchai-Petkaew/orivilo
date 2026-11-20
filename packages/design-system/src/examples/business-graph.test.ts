import {
  BUSINESS_EDGES,
  BUSINESS_NODES,
  FOUNDATION_EDGES,
  FOUNDATION_NODES,
} from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { messagesFor } from "../i18n/messages/index";
import { boardGraphOf, BUSINESS_POSITIONS } from "./business-graph";
import { SKIPPED_VIEW, THAI_VIEW } from "./business-fixtures";
import { nodeTitle } from "./business-text";

/**
 * ORV-281 tech notes T26, spec rows 22 and 23: `boardGraphOf` gives the business nodes in fill order,
 * each opening one view with no page count, and exactly the six edges of W2. ORV-291 tech notes T20
 * (spec rows 9, 23 and 34): after PR 3 the board has nine nodes and thirteen edges, the new nodes and
 * their one edge per require (W2), and a node with several sources gets one input handle per source,
 * in the order of the design's table (2.2), which is not always the order of the engine's edge list.
 */

const W2 = [
  "situation>business-core",
  "situation>audience",
  "situation>competitive-frame",
  "business-core>positioning",
  "audience>positioning",
  "competitive-frame>positioning",
];
/** ORV-281's six edges, then one edge per require of the foundation nodes built so far (W2, after PR 3). */
const W2_PR3 = [
  ...W2,
  "positioning>identity-frame",
  "situation>architecture",
  "positioning>architecture",
  "positioning>name",
  "architecture>name",
  "positioning>core-idea",
  "identity-frame>core-idea",
];

describe.each(["th", "en"] as const)("boardGraphOf in %s", (locale) => {
  const m = messagesFor(locale);
  const graph = boardGraphOf(THAI_VIEW, m);

  it("has nine nodes in fill order, each titled by the catalog and opening with no count", () => {
    const fill = [...BUSINESS_NODES, ...FOUNDATION_NODES];
    expect(graph.nodes.map((n) => n.id)).toEqual(fill);
    expect(graph.nodes.map((n) => n.data.title)).toEqual(fill.map((id) => nodeTitle(m, id)));
    for (const node of graph.nodes) {
      expect(node.data.open).toEqual({});
      expect(node.data.open).not.toHaveProperty("count");
      expect(node.data.kind).toBe("knowledge");
      expect(node.data.size).toBe("md");
      expect(node.data.pad).toBe("text");
      expect(node.data.status).toBeUndefined();
      expect(node.data.basis).toBeUndefined();
      expect(node.data.source).toBeUndefined();
    }
  });

  it("has exactly the thirteen edges of W2, each solid and with no label pill", () => {
    expect(graph.edges.map((e) => `${e.source}>${e.target}`)).toEqual(W2_PR3);
    expect([...BUSINESS_EDGES].map(([a, b]) => `${a}>${b}`)).toEqual(W2);
    expect(FOUNDATION_EDGES.map(([a, b]) => `${a}>${b}`)).toEqual(W2_PR3.slice(6));
    for (const edge of graph.edges) {
      expect(edge.data).toEqual({ meaning: "input", label: false });
    }
    expect(new Set(graph.edges.map((e) => e.id)).size).toBe(13);
  });

  it("joins every edge to a port that exists, of the same kind, on its two nodes", () => {
    for (const edge of graph.edges) {
      const source = graph.nodes.find((n) => n.id === edge.source);
      const target = graph.nodes.find((n) => n.id === edge.target);
      const out = source?.data.outputs.find((p) => p.id === edge.sourceHandle);
      const into = target?.data.inputs.find((p) => p.id === edge.targetHandle);
      expect(out?.kind).toBe("text");
      expect(into?.kind).toBe("text");
    }
  });

  it("gives a node with several sources one input per source, named by it, in column order", () => {
    const positioning = graph.nodes.find((n) => n.id === "positioning");
    expect(positioning?.data.inputs.map((p) => [p.id, p.label])).toEqual([
      ["from-business-core", nodeTitle(m, "business-core")],
      ["from-audience", nodeTitle(m, "audience")],
      ["from-competitive-frame", nodeTitle(m, "competitive-frame")],
    ]);
    // Positioning feeds the three foundation nodes, from the one output (ORV-291, design 2.2).
    expect(positioning?.data.outputs.map((p) => [p.id, p.label])).toEqual([
      ["out", nodeTitle(m, "positioning")],
    ]);
    const situation = graph.nodes.find((n) => n.id === "situation");
    expect(situation?.data.inputs).toEqual([]);
    expect(situation?.data.outputs.map((p) => p.label)).toEqual([nodeTitle(m, "situation")]);
  });

  it("leaves the ports of the four other business nodes as they were", () => {
    const portsOf = (id: string) => {
      const node = graph.nodes.find((n) => n.id === id);
      return [
        node?.data.inputs.map((p) => [p.id, p.label]),
        node?.data.outputs.map((p) => [p.id, p.label]),
      ];
    };
    expect(portsOf("business-core")).toEqual([
      [["in", nodeTitle(m, "situation")]],
      [["out", nodeTitle(m, "business-core")]],
    ]);
    expect(portsOf("audience")).toEqual([
      [["in", nodeTitle(m, "situation")]],
      [["out", nodeTitle(m, "audience")]],
    ]);
    expect(portsOf("competitive-frame")).toEqual([
      [["in", nodeTitle(m, "situation")]],
      [["out", nodeTitle(m, "competitive-frame")]],
    ]);
  });

  it("gives Brand architecture two inputs, Positioning above Situation (design 2.2), and one output to Name", () => {
    const architecture = graph.nodes.find((n) => n.id === "architecture");
    // The engine's edge list reads Situation first (ORV-126 order); the table puts the upper source
    // in the upper port so no two edges cross at the card.
    expect(architecture?.data.inputs.map((p) => [p.id, p.label])).toEqual([
      ["from-positioning", nodeTitle(m, "positioning")],
      ["from-situation", nodeTitle(m, "situation")],
    ]);
    expect(architecture?.data.outputs.map((p) => [p.id, p.label])).toEqual([
      ["out", nodeTitle(m, "architecture")],
    ]);
  });

  it("gives Name two inputs, Positioning above Brand architecture, and no output", () => {
    const name = graph.nodes.find((n) => n.id === "name");
    expect(name?.data.inputs.map((p) => [p.id, p.label])).toEqual([
      ["from-positioning", nodeTitle(m, "positioning")],
      ["from-architecture", nodeTitle(m, "architecture")],
    ]);
    expect(name?.data.outputs).toEqual([]);
  });

  it("joins each edge of the three new nodes to the port of its own source", () => {
    const into = (target: string) =>
      graph.edges.filter((e) => e.target === target).map((e) => [e.source, e.targetHandle]);
    expect(into("architecture")).toEqual([
      ["situation", "from-situation"],
      ["positioning", "from-positioning"],
    ]);
    expect(into("name")).toEqual([
      ["positioning", "from-positioning"],
      ["architecture", "from-architecture"],
    ]);
    expect(into("core-idea")).toEqual([
      ["positioning", "from-positioning"],
      ["identity-frame", "from-identity-frame"],
    ]);
  });

  it("gives Brand personality one input from Positioning and one output to Core idea", () => {
    const identity = graph.nodes.find((n) => n.id === "identity-frame");
    expect(identity?.data.inputs.map((p) => [p.id, p.label])).toEqual([
      ["in", nodeTitle(m, "positioning")],
    ]);
    expect(identity?.data.outputs.map((p) => [p.id, p.label])).toEqual([
      ["out", nodeTitle(m, "identity-frame")],
    ]);
    const edge = graph.edges.find((e) => e.target === "identity-frame");
    expect(edge).toMatchObject({ source: "positioning", sourceHandle: "out", targetHandle: "in" });
  });

  it("gives Core idea two inputs, Brand personality above Positioning (design 2.2), and no output", () => {
    const coreIdea = graph.nodes.find((n) => n.id === "core-idea");
    // The engine lists Positioning first (ORV-126 order); the table puts the upper source in the
    // upper port (278 against 318) so the two edges do not cross at the card.
    expect(coreIdea?.data.inputs.map((p) => [p.id, p.label])).toEqual([
      ["from-identity-frame", nodeTitle(m, "identity-frame")],
      ["from-positioning", nodeTitle(m, "positioning")],
    ]);
    expect(coreIdea?.data.outputs).toEqual([]);
  });

  it("sets the nodes where the design table puts them", () => {
    // Situation moves down from PR 2 (design 2.1), so its edge to Brand architecture clears Audience.
    expect(graph.nodes.map((n) => [n.id, n.position.x, n.position.y])).toEqual([
      ["situation", 0, 447],
      ["business-core", 456, 28],
      ["audience", 456, 340],
      ["competitive-frame", 456, 652],
      ["positioning", 928, 326],
      ["identity-frame", 1400, 160],
      ["architecture", 1400, 576],
      ["name", 1888, 473],
      ["core-idea", 1888, 212],
    ]);
    expect(Object.keys(BUSINESS_POSITIONS)).toEqual([...BUSINESS_NODES, ...FOUNDATION_NODES]);
  });

  it("is the same graph for a project that skipped answers, and is deterministic", () => {
    expect(boardGraphOf(SKIPPED_VIEW, m)).toEqual(graph);
    expect(boardGraphOf(THAI_VIEW, m)).toEqual(graph);
  });
});

describe("boardGraphOf in two languages", () => {
  it("changes only the words, never the structure", () => {
    const th = boardGraphOf(THAI_VIEW, messagesFor("th"));
    const en = boardGraphOf(THAI_VIEW, messagesFor("en"));
    expect(en.edges).toEqual(th.edges);
    expect(en.nodes.map((n) => [n.id, n.position])).toEqual(
      th.nodes.map((n) => [n.id, n.position]),
    );
    expect(en.nodes.map((n) => n.data.title)).toEqual([
      "Situation",
      "Business core",
      "Audience",
      "Competitive frame",
      "Positioning",
      "Brand personality",
      "Brand architecture",
      "Name",
      "Core idea",
    ]);
    expect(th.nodes.map((n) => n.data.title)).toEqual([
      "สถานการณ์ตั้งต้น",
      "แก่นธุรกิจ",
      "กลุ่มลูกค้า",
      "ตลาดและคู่แข่ง",
      "จุดยืน",
      "บุคลิกของแบรนด์",
      "โครงสร้างแบรนด์",
      "ชื่อแบรนด์",
      "แนวคิดหลัก",
    ]);
  });
});
