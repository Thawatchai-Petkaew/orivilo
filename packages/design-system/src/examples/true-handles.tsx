"use client";

import { type HandleType, useStoreApi } from "@xyflow/react";
import { useEffect } from "react";

/** The linear part of a 2D transform, `[a, b, c, d]` as in `matrix(a, b, c, d, e, f)`. */
export type Linear = readonly [a: number, b: number, c: number, d: number];
export interface Point {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}

const IDENTITY: Linear = [1, 0, 0, 1];
/** A scale or a turn that differs from the identity by less than this is no transform at all. */
const TOLERANCE = 1e-3;

/** `outer` applied after `inner`: the linear part of two transforms stacked one inside the other. */
export function compose(outer: Linear, inner: Linear): Linear {
  const [a, b, c, d] = outer;
  const [e, f, g, h] = inner;
  return [a * e + c * f, b * e + d * f, a * g + c * h, b * g + d * h];
}

/** Whether the transform keeps every length and direction (no ancestor scales or turns the board). */
export function isIdentity(m: Linear): boolean {
  return m.every((v, i) => Math.abs(v - (IDENTITY[i] ?? 0)) < TOLERANCE);
}

/** The inverse of a transform, or `null` when it flattens the plane. */
export function invert(m: Linear): Linear | null {
  const [a, b, c, d] = m;
  const det = a * d - b * c;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-9) return null;
  return [d / det, -b / det, -c / det, a / det];
}

/**
 * Where a handle's top-left corner lies in its node's own, untransformed frame, from the two
 * centres as the screen shows them. `toScreen` is the linear part of every transform from the node
 * down to the screen (ancestor scales and turns, the board's own zoom). A box keeps its centre under
 * any affine map, so the vector between the two centres, taken back through `toScreen`, is exact
 * where the corner of a turned bounding box is not. Sizes come from layout and are not transformed.
 */
export function handleCorner(
  toScreen: Linear,
  handleCentre: Point,
  nodeCentre: Point,
  node: Size,
  handle: Size,
): Point | null {
  const back = invert(toScreen);
  if (!back) return null;
  const dx = handleCentre.x - nodeCentre.x;
  const dy = handleCentre.y - nodeCentre.y;
  return {
    x: node.width / 2 + back[0] * dx + back[2] * dy - handle.width / 2,
    y: node.height / 2 + back[1] * dx + back[3] * dy - handle.height / 2,
  };
}

/**
 * The linear part of every `transform` from `el` up to the document: what the ancestors (and `el`)
 * do to a vector drawn inside `el`. A translation moves a box but not its size or direction, so only
 * the linear part is kept. The individual `scale` and `rotate` properties are not read: no surface
 * of the examples uses them.
 */
export function linearOf(el: Element): Linear {
  let total: Linear = IDENTITY;
  for (let node: Element | null = el; node; node = node.parentElement) {
    const transform = getComputedStyle(node).transform;
    if (transform === "none") continue;
    const m = new DOMMatrixReadOnly(transform);
    total = compose([m.a, m.b, m.c, m.d], total);
  }
  return total;
}

const centreOf = (rect: DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

/**
 * Keeps the edges of a board on their ports when an ancestor scales or turns the board (spec
 * ORV-309 F3). React Flow measures a port as `(handle.getBoundingClientRect - node.getBoundingClientRect)
 * / zoom` and reads the node's size from `offsetWidth`, so a CSS scale above the board (a live
 * frame, a dialog's opening scale, the zoom of the canvas that holds the node) or a turn (the field
 * of brandbook page 10) puts every port offset in the wrong frame while the node's size stays whole.
 * This reads each fresh measure once, takes every port's offset again from the two centres
 * (`handleCorner`), and tells the edges to draw again. A board that no ancestor transforms is left
 * as React Flow measured it.
 */
export function TrueHandles() {
  const store = useStoreApi();
  useEffect(() => {
    const seen = new WeakSet<object>();
    const settle = () => {
      const { nodeLookup, domNode } = store.getState();
      if (!domNode) return;
      let transformed: boolean | undefined;
      let changed = false;
      for (const [id, node] of nodeLookup) {
        const bounds = node.internals.handleBounds;
        if (!bounds || seen.has(bounds)) continue;
        transformed ??= !isIdentity(linearOf(domNode));
        const el = transformed
          ? [
              ...domNode.querySelectorAll<HTMLElement>(
                `.react-flow__node[data-id="${CSS.escape(id)}"]`,
              ),
            ].find((n) => n.closest(".react-flow") === domNode)
          : undefined;
        if (!el) {
          seen.add(bounds);
          continue;
        }
        const toScreen = linearOf(el);
        const nodeCentre = centreOf(el.getBoundingClientRect());
        const nodeSize = { width: el.offsetWidth, height: el.offsetHeight };
        const handles = [...el.querySelectorAll<HTMLElement>(".source, .target")].filter(
          (h) => h.closest(".react-flow__node") === el,
        );
        const redo = (type: HandleType) =>
          (bounds[type] ?? null)?.map((h) => {
            const dom = handles.find(
              (c) =>
                c.classList.contains(type) && c.getAttribute("data-handleid") === (h.id ?? null),
            );
            if (!dom) return h;
            const corner = handleCorner(
              toScreen,
              centreOf(dom.getBoundingClientRect()),
              nodeCentre,
              nodeSize,
              { width: h.width, height: h.height },
            );
            return corner ? { ...h, x: corner.x, y: corner.y } : h;
          }) ?? null;
        const next = { source: redo("source"), target: redo("target") };
        seen.add(next);
        nodeLookup.set(id, { ...node, internals: { ...node.internals, handleBounds: next } });
        changed = true;
      }
      if (changed) store.setState({});
    };
    settle();
    return store.subscribe(settle);
  }, [store]);
  return null;
}
