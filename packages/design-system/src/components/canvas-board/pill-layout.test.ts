import { describe, expect, it } from "vitest";
import {
  type Box,
  gapBetween,
  hiddenPills,
  type PillItem,
  type PillTier,
  pillTier,
} from "./pill-layout";

/** A 100 by 20 box at (left, top). */
const box = (left: number, top: number, width = 100, height = 20): Box => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

const pill = (
  id: number,
  tier: PillTier,
  at: Box,
  owner: string | null = null,
  avoidsSolids = tier === 2 || tier === 3,
): PillItem => ({ id, tier, box: at, owner, avoidsSolids });

describe("gapBetween", () => {
  it("is the largest of the four gaps, negative when the boxes overlap", () => {
    expect(gapBetween(box(0, 0), box(110, 0))).toBe(10);
    expect(gapBetween(box(110, 0), box(0, 0))).toBe(10);
    expect(gapBetween(box(0, 0), box(0, 30))).toBe(10);
    expect(gapBetween(box(0, 30), box(0, 0))).toBe(10);
    expect(gapBetween(box(0, 0), box(60, 10))).toBe(-10);
    // Apart on one axis only: the larger gap decides, not the sum.
    expect(gapBetween(box(0, 0), box(105, 25))).toBe(5);
  });
});

describe("pillTier", () => {
  it("ranks an edge pill by its state and a node's pill by its pointer", () => {
    expect(pillTier("edge", true)).toBe(2);
    expect(pillTier("edge", false)).toBe(3);
    expect(pillTier("node", true)).toBe(1);
    expect(pillTier("node", false)).toBe(4);
  });
});

describe("hiddenPills (rows 20 and 21)", () => {
  it("keeps a pill that is clear of every solid and every kept pill", () => {
    const hidden = hiddenPills(
      [pill(0, 3, box(0, 0)), pill(1, 3, box(200, 0))],
      [box(0, 100), box(400, 0)],
      4,
    );
    expect([...hidden]).toEqual([]);
  });

  it("hides an edge pill under a solid, and keeps it when the solid is exactly `px` away", () => {
    expect([...hiddenPills([pill(0, 3, box(0, 0))], [box(50, 10)], 4)]).toEqual([0]);
    expect([...hiddenPills([pill(0, 3, box(0, 0))], [box(104, 0)], 4)]).toEqual([]);
    expect([...hiddenPills([pill(0, 3, box(0, 0))], [box(103, 0)], 4)]).toEqual([0]);
  });

  it("hides a pill that is within `px` of a pill kept before it", () => {
    expect([...hiddenPills([pill(0, 3, box(0, 0)), pill(1, 3, box(104, 0))], [], 4)]).toEqual([]);
    expect([...hiddenPills([pill(0, 3, box(0, 0)), pill(1, 3, box(103, 0))], [], 4)]).toEqual([1]);
  });

  it("keeps pills in the order given within a tier, so the first one stays", () => {
    const hidden = hiddenPills([pill(0, 3, box(0, 0)), pill(1, 3, box(10, 0))], [], 4);
    expect([...hidden]).toEqual([1]);
    const reversed = hiddenPills([pill(1, 3, box(10, 0)), pill(0, 3, box(0, 0))], [], 4);
    expect([...reversed]).toEqual([0]);
  });

  it("keeps a pointed node's names (tier 1) over an edge pill, however they overlap", () => {
    const hidden = hiddenPills([pill(0, 2, box(0, 0)), pill(1, 1, box(20, 0), "a", false)], [], 4);
    expect([...hidden]).toEqual([0]);
  });

  it("never hides a tier 1 pill, not under a solid and not under another kept pill", () => {
    const hidden = hiddenPills(
      [pill(0, 1, box(0, 0), "a", false), pill(1, 1, box(10, 0), "b", false)],
      [box(0, 0)],
      4,
    );
    expect([...hidden]).toEqual([]);
  });

  it("keeps a state pill (tier 2) over a meaning pill (tier 3), whichever comes first", () => {
    const hidden = hiddenPills([pill(0, 3, box(0, 0)), pill(1, 2, box(10, 0))], [], 4);
    expect([...hidden]).toEqual([0]);
  });

  it("lets an edge pill (tier 3) win over a selected node's port pill (tier 4)", () => {
    const hidden = hiddenPills([pill(0, 4, box(0, 0), "b", false), pill(1, 3, box(10, 0))], [], 4);
    expect([...hidden]).toEqual([0]);
  });

  it("hides a port pill (tier 4) under a tier 1 pill of another node", () => {
    const hidden = hiddenPills(
      [pill(0, 4, box(0, 0), "b", false), pill(1, 1, box(10, 0), "a", false)],
      [],
      4,
    );
    expect([...hidden]).toEqual([0]);
  });

  it("never lets pills of one node hide each other, since they are its own rows", () => {
    const hidden = hiddenPills(
      [pill(0, 4, box(0, 0), "b", false), pill(1, 4, box(0, 10), "b", false)],
      [],
      4,
    );
    expect([...hidden]).toEqual([]);
    // The same two pills under two nodes: the second yields.
    const apart = hiddenPills(
      [pill(0, 4, box(0, 0), "b", false), pill(1, 4, box(0, 10), "c", false)],
      [],
      4,
    );
    expect([...apart]).toEqual([1]);
  });

  it("treats two edge pills as two owners, even though both have no node", () => {
    const hidden = hiddenPills([pill(0, 3, box(0, 0)), pill(1, 3, box(0, 10))], [], 4);
    expect([...hidden]).toEqual([1]);
  });

  it("keeps a port or source pill that avoids no solid when it sits under one", () => {
    const hidden = hiddenPills([pill(0, 4, box(0, 0), "b", false)], [box(0, 0)], 4);
    expect([...hidden]).toEqual([]);
  });

  it("reads each solid, not only the first", () => {
    const hidden = hiddenPills([pill(0, 3, box(0, 0))], [box(0, 200), box(50, 10)], 4);
    expect([...hidden]).toEqual([0]);
  });
});
