/**
 * The canvas token contract (spec E4-1). Fails when a port kind lacks a colour or a shape, when two
 * kinds share a shape or a colour in either mode, when an edge meaning lacks a distinct dash pattern,
 * when a canvas group is open to profile override, or when a canvas colour is outside the contrast set.
 */
import { describe, expect, it } from "vitest";
import { LOCKED_GROUPS } from "../profiles/model";
import {
  CANVAS_WORDS,
  EDGE_MEANINGS,
  NODE_STATUSES,
  PORT_KINDS,
  PORT_SHAPES,
  portShape,
} from "./canvas";
import { semanticPairs } from "./contrast-pairs";
import { MODES, tokens } from "./index";

describe("port kinds", () => {
  it("each has a colour token and a shape, and no two share either", () => {
    const shapes = PORT_KINDS.map((kind) => portShape(kind));
    expect(new Set(shapes).size).toBe(PORT_KINDS.length);
    expect([...shapes].sort()).toEqual([...PORT_SHAPES].sort());
    for (const mode of MODES) {
      const colours = PORT_KINDS.map((kind) => {
        const t = tokens.get("semantic", `port.${kind}`);
        if (!t) throw new Error(`port.${kind} missing`);
        return String(tokens.resolve(t, mode).value);
      });
      expect(new Set(colours).size, mode).toBe(PORT_KINDS.length);
    }
  });

  it("never take a transaction colour: no port shares a value with an action or feedback token", () => {
    for (const mode of MODES) {
      const taken = new Set(
        tokens
          .layer("semantic")
          .filter((t) => /^(action|feedback)\./.test(t.path) && t.type === "color")
          .map((t) => String(tokens.resolve(t, mode).value)),
      );
      for (const kind of PORT_KINDS) {
        const t = tokens.get("semantic", `port.${kind}`);
        if (!t) throw new Error(`port.${kind} missing`);
        expect(taken.has(String(tokens.resolve(t, mode).value)), `port.${kind} in ${mode}`).toBe(
          false,
        );
      }
    }
  });
});

describe("edge meanings", () => {
  const value = (path: string) => {
    const t = tokens.get("semantic", path);
    if (!t) throw new Error(`${path} missing`);
    return String(tokens.resolve(t, "light").value);
  };

  it("differ by dash pattern, not only by colour: input is solid, the others an on and an off length", () => {
    const patterns = EDGE_MEANINGS.map((m) =>
      m === "input"
        ? value("edge.dash.input")
        : `${value(`edge.dash.${m}-on`)} ${value(`edge.dash.${m}-off`)}`,
    );
    expect(new Set(patterns).size).toBe(EDGE_MEANINGS.length);
    expect(patterns[0]).toBe("none");
    expect(patterns[1]).toBe("6px 5px");
    expect(patterns[2]).toBe("0px 5px");
  });

  it("a present edge is thinner than an edit edge, and its selected width sits between them", () => {
    const px = (path: string) => parseFloat(value(path));
    expect(px("edge.width-present")).toBe(1.5);
    expect(px("edge.width-present-selected")).toBe(2.5);
    expect(px("edge.width")).toBe(2);
    expect(px("edge.width-selected")).toBe(3);
  });
});

describe("canvas groups", () => {
  it("are Studio chrome: locked against profile override", () => {
    for (const group of ["canvas", "port", "edge", "status"]) {
      expect(LOCKED_GROUPS, group).toContain(group);
    }
  });

  it("every canvas colour is in the contrast set, and every status has words", () => {
    const covered = new Set(semanticPairs(tokens).flatMap((p) => [p.fg, p.bg]));
    const colours = tokens
      .layer("semantic")
      .filter((t) => t.type === "color" && /^(port|edge|status)\.|^surface\.board$/.test(t.path));
    expect(colours.length).toBeGreaterThanOrEqual(14);
    for (const t of colours) expect(covered.has(t.path), t.path).toBe(true);
    for (const s of NODE_STATUSES) expect(CANVAS_WORDS.status[s].th.length).toBeGreaterThan(0);
    for (const k of PORT_KINDS) expect(CANVAS_WORDS.port[k].th.length).toBeGreaterThan(0);
  });
});
