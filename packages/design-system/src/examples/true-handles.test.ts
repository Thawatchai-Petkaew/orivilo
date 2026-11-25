/**
 * The maths of `TrueHandles` (spec ORV-309 F3, rework 4): where a port dot lies in its node's own
 * frame when an ancestor scales or turns the board. The browser half (the edges of each board end on
 * their ports) is a play: `expectEdgesOnPorts` on the landing, the product pages and brandbook page 10.
 */
import { describe, expect, it } from "vitest";
import { pointRectDistance } from "../testing/visual-asserts";
import { compose, handleCorner, invert, isIdentity, type Linear, type Point } from "./true-handles";

const turn = (degrees: number): Linear => {
  const r = (degrees * Math.PI) / 180;
  return [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r)];
};
const apply = (m: Linear, p: Point): Point => ({
  x: m[0] * p.x + m[2] * p.y,
  y: m[1] * p.x + m[3] * p.y,
});

describe("compose", () => {
  it("applies the inner transform first, then the outer one", () => {
    // Turn (1, 0) a quarter turn to (0, 1), then stretch x by 2: still (0, 1). The other order
    // stretches first, to (2, 0), then turns: (0, 2).
    const quarter = turn(90);
    const stretch: Linear = [2, 0, 0, 1];
    const p = apply(compose(stretch, quarter), { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(1, 9);
    const q = apply(compose(quarter, stretch), { x: 1, y: 0 });
    expect(q.x).toBeCloseTo(0, 9);
    expect(q.y).toBeCloseTo(2, 9);
  });
});

describe("compose, term by term", () => {
  it("gives each of the four numbers of two general transforms", () => {
    // outer [1 3; 2 4] after inner [5 7; 6 8]: a 1*5+3*6, b 2*5+4*6, c 1*7+3*8, d 2*7+4*8.
    expect(compose([1, 2, 3, 4], [5, 6, 7, 8])).toEqual([23, 34, 31, 46]);
  });
});

describe("isIdentity", () => {
  it("is true for no transform and false for a scale, a turn and a shear, each on its own", () => {
    expect(isIdentity([1, 0, 0, 1])).toBe(true);
    expect(isIdentity([1.0004, 0, 0, 0.9996])).toBe(true);
    expect(isIdentity([0.5, 0, 0, 0.5])).toBe(false);
    expect(isIdentity(turn(-12))).toBe(false);
    expect(isIdentity([1, 0, 0.2, 1])).toBe(false);
    expect(isIdentity([1, 0.2, 0, 1])).toBe(false);
    expect(isIdentity([1, 0, 0, 2])).toBe(false);
  });
});

describe("invert", () => {
  it("undoes a scale and a turn, and refuses a flat transform", () => {
    const m = compose(turn(-12), [0.5, 0, 0, 0.5]);
    const inv = invert(m);
    expect(inv).not.toBeNull();
    const back = apply(inv as Linear, apply(m, { x: 30, y: -7 }));
    expect(back.x).toBeCloseTo(30, 9);
    expect(back.y).toBeCloseTo(-7, 9);
    expect(invert([2, 0, 0, 4])?.map((v) => v + 0)).toEqual([0.5, 0, 0, 0.25]);
    expect(invert([1, 2, 2, 4])).toBeNull();
    expect(invert([Number.NaN, 0, 0, 1])).toBeNull();
    // The bound: a determinant of 1e-8 (a 1e-4 scale) still inverts, 1e-10 (a 1e-5 scale) does not.
    expect(invert([1e-4, 0, 0, 1e-4])).not.toBeNull();
    expect(invert([1e-5, 0, 0, 1e-5])).toBeNull();
  });
});

describe("handleCorner", () => {
  // A 200 x 100 node with a 10 x 10 port whose top-left is at (-5, 20) in the node's own frame.
  const node = { width: 200, height: 100 };
  const handle = { width: 10, height: 10 };
  const local = { x: -5, y: 20 };
  const nodeCentre = { x: 500, y: 300 };
  /** The two centres as the screen shows them under `m`, the node's centre staying where it is. */
  const centresUnder = (m: Linear) => {
    const delta = apply(m, {
      x: local.x + handle.width / 2 - node.width / 2,
      y: local.y + handle.height / 2 - node.height / 2,
    });
    return { x: nodeCentre.x + delta.x, y: nodeCentre.y + delta.y };
  };

  it("gives the same corner under no transform, a scale, a turn and both", () => {
    for (const m of [
      [1, 0, 0, 1],
      [0.5, 0, 0, 0.5],
      [1.6, 0, 0, 1.6],
      turn(-12),
      compose(turn(-12), [0.41, 0, 0, 0.41]),
    ] as Linear[]) {
      const corner = handleCorner(m, centresUnder(m), nodeCentre, node, handle);
      expect(corner?.x).toBeCloseTo(local.x, 9);
      expect(corner?.y).toBeCloseTo(local.y, 9);
    }
  });

  it("takes the size of the node and of the port from layout, not from the screen", () => {
    const m: Linear = [0.5, 0, 0, 0.5];
    const wide = handleCorner(m, centresUnder(m), nodeCentre, { width: 240, height: 100 }, handle);
    expect(wide?.x).toBeCloseTo(local.x + 20, 9);
    const big = handleCorner(m, centresUnder(m), nodeCentre, node, { width: 20, height: 10 });
    expect(big?.x).toBeCloseTo(local.x - 5, 9);
    expect(big?.y).toBeCloseTo(local.y, 9);
  });

  it("gives up on a flat transform", () => {
    expect(handleCorner([1, 2, 2, 4], nodeCentre, nodeCentre, node, handle)).toBeNull();
  });
});

describe("pointRectDistance", () => {
  const rect = { left: 10, right: 20, top: 10, bottom: 30 };
  it("is 0 inside and on the edge, the gap beside a side and the diagonal off a corner", () => {
    expect(pointRectDistance({ x: 15, y: 20 }, rect)).toBe(0);
    expect(pointRectDistance({ x: 20, y: 30 }, rect)).toBe(0);
    expect(pointRectDistance({ x: 25, y: 20 }, rect)).toBe(5);
    expect(pointRectDistance({ x: 15, y: 4 }, rect)).toBe(6);
    expect(pointRectDistance({ x: 15, y: 35 }, rect)).toBe(5);
    expect(pointRectDistance({ x: 4, y: 20 }, rect)).toBe(6);
    expect(pointRectDistance({ x: 4, y: 2 }, rect)).toBe(10);
  });
});
