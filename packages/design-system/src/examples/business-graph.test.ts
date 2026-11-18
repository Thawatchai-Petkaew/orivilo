import { BUSINESS_EDGES, BUSINESS_NODES } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { messagesFor } from "../i18n/messages/index";
import { boardGraphOf, BUSINESS_POSITIONS } from "./business-graph";
import { SKIPPED_VIEW, THAI_VIEW } from "./business-fixtures";
import { nodeTitle } from "./business-text";

/**
 * ORV-281 tech notes T26, spec rows 22 and 23: `boardGraphOf` gives five nodes in fill order, each
 * opening one view with no page count, and exactly the six edges of W2.
 */

const W2 = [
  "situation>business-core",
  "situation>audience",
  "situation>competitive-frame",
  "business-core>positioning",
  "audience>positioning",
  "competitive-frame>positioning",
];

describe.each(["th", "en"] as const)("boardGraphOf in %s", (locale) => {
  const m = messagesFor(locale);
  const graph = boardGraphOf(THAI_VIEW, m);

  it("has five nodes in fill order, each titled by the catalog and opening with no count", () => {
    expect(graph.nodes.map((n) => n.id)).toEqual([...BUSINESS_NODES]);
    expect(graph.nodes.map((n) => n.data.title)).toEqual(
      BUSINESS_NODES.map((id) => nodeTitle(m, id)),
    );
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

  it("has exactly the six edges of W2, each solid and with no label pill", () => {
    expect(graph.edges.map((e) => `${e.source}>${e.target}`)).toEqual(W2);
    expect([...BUSINESS_EDGES].map(([a, b]) => `${a}>${b}`)).toEqual(W2);
    for (const edge of graph.edges) {
      expect(edge.data).toEqual({ meaning: "input", label: false });
    }
    expect(new Set(graph.edges.map((e) => e.id)).size).toBe(6);
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

  it("gives Positioning three inputs named by their source, in column order, and no output", () => {
    const positioning = graph.nodes.find((n) => n.id === "positioning");
    expect(positioning?.data.inputs.map((p) => [p.id, p.label])).toEqual([
      ["from-business-core", nodeTitle(m, "business-core")],
      ["from-audience", nodeTitle(m, "audience")],
      ["from-competitive-frame", nodeTitle(m, "competitive-frame")],
    ]);
    expect(positioning?.data.outputs).toEqual([]);
    const situation = graph.nodes.find((n) => n.id === "situation");
    expect(situation?.data.inputs).toEqual([]);
    expect(situation?.data.outputs.map((p) => p.label)).toEqual([nodeTitle(m, "situation")]);
  });

  it("sets the nodes where the design table puts them", () => {
    expect(graph.nodes.map((n) => [n.id, n.position.x, n.position.y])).toEqual([
      ["situation", 0, 326],
      ["business-core", 464, 28],
      ["audience", 464, 340],
      ["competitive-frame", 464, 652],
      ["positioning", 928, 326],
    ]);
    expect(Object.keys(BUSINESS_POSITIONS)).toEqual([...BUSINESS_NODES]);
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
    ]);
    expect(th.nodes.map((n) => n.data.title)).toEqual([
      "สถานการณ์ตั้งต้น",
      "แก่นธุรกิจ",
      "กลุ่มลูกค้า",
      "ตลาดและคู่แข่ง",
      "จุดยืน",
    ]);
  });
});
