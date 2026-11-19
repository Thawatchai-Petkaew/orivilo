"use client";

import { type RefObject, useEffect } from "react";

/**
 * The layout pass of a present board (ORV-280 rows 20 and 21): a pill is drawn only where it is
 * whole and clear. A pill that fails is hidden with `data-hidden` (CSS: `visibility: hidden`); it
 * stays in the accessible name of its edge or node, and the edge keeps its kind colour and dash.
 */

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Who keeps its place first: 1 the port and source pills of the pointed node (hover or focus), 2 an
 * edge pill that carries a state (stale, invalid), 3 a meaning-only edge pill, 4 any other shown port
 * or source pill (a selected node's).
 */
export type PillTier = 1 | 2 | 3 | 4;

export interface PillItem {
  /** Any key the caller gets back in the hidden set. */
  id: number;
  tier: PillTier;
  box: Box;
  /** The node a port or source pill belongs to; null for an edge pill. */
  owner: string | null;
  /** Whether the pill keeps its distance from cards, title lines and port dots (edge pills do). */
  avoidsSolids: boolean;
}

/**
 * The tier of a drawn pill: an edge pill is 2 when it carries a state and 3 when it only names the
 * meaning; a port or source pill is 1 when its node is pointed and 4 otherwise.
 */
export const pillTier = (kind: "edge" | "node", flag: boolean): PillTier =>
  kind === "edge" ? (flag ? 2 : 3) : flag ? 1 : 4;

/** The largest of the four gaps between two boxes: negative when they overlap. */
export const gapBetween = (a: Box, b: Box) =>
  Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom);

/**
 * The ids of the pills that are not drawn. Pills are kept in tier order, and in the order given
 * within a tier. A tier 1 pill is always kept. Any other pill is kept when it is at least `px` from
 * every pill kept before it, except one of its own node (a node's pills are its own rows and never
 * hide each other), and, for a pill that avoids solids, from every solid. All gaps are in screen px.
 */
export function hiddenPills(
  items: readonly PillItem[],
  solids: readonly Box[],
  px: number,
): Set<number> {
  const hidden = new Set<number>();
  const kept: PillItem[] = [];
  const ordered = [...items].sort((a, b) => a.tier - b.tier);
  for (const item of ordered) {
    const clearOfPills = kept.every(
      (other) =>
        (item.owner !== null && item.owner === other.owner) ||
        gapBetween(item.box, other.box) >= px,
    );
    const clearOfSolids =
      !item.avoidsSolids || solids.every((solid) => gapBetween(item.box, solid) >= px);
    if (item.tier === 1 || (clearOfPills && clearOfSolids)) kept.push(item);
    else hidden.add(item.id);
  }
  return hidden;
}

/** The gap a pill keeps, from `space.inline-sm` (4 screen px). */
const CLEARANCE = 4;

const HIDDEN = "data-hidden";

const drawn = (el: HTMLElement) =>
  el.getBoundingClientRect().width > 0 && getComputedStyle(el).visibility !== "hidden";

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
};

/**
 * Reads every shown pill of the board under `root` and hides the ones that fail
 * `hiddenPills`. The marks of the last pass come off first, so a pill that a hover or a
 * selection shows is read as shown. It reads rects only, no text width.
 */
export function layoutPills(root: HTMLElement) {
  for (const el of root.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN);
  const items: PillItem[] = [];
  const pills: HTMLElement[] = [];
  const add = (el: HTMLElement, tier: PillTier, owner: string | null, avoidsSolids: boolean) => {
    items.push({ id: pills.length, tier, box: boxOf(el), owner, avoidsSolids });
    pills.push(el);
  };
  for (const el of root.querySelectorAll<HTMLElement>(".ds-edge__label")) {
    if (drawn(el)) add(el, pillTier("edge", el.hasAttribute("data-state")), null, true);
  }
  for (const el of root.querySelectorAll<HTMLElement>(".ds-port__label, .ds-node__source")) {
    if (!drawn(el)) continue;
    const node = el.closest<HTMLElement>(".react-flow__node");
    const pointed = node?.matches(":hover, :focus-visible") ?? false;
    add(el, pillTier("node", pointed), node?.dataset["id"] ?? null, false);
  }
  if (items.length === 0) return;
  const solids = [...root.querySelectorAll(".ds-node, .ds-node__label, .ds-port__handle")]
    .filter((el) => el.getBoundingClientRect().width > 0)
    .map(boxOf);
  for (const id of hiddenPills(items, solids, CLEARANCE)) pills[id]?.setAttribute(HIDDEN, "");
}

/**
 * Runs `layoutPills` on `ref` while `enabled`: after a frame in which the board's DOM changed (a
 * zoom or a pan writes the viewport's style, a selection its class, a graph change its nodes and
 * pills), the pointer or focus moved, a font loaded or the board resized. Its own mark is not
 * watched, so it never triggers itself. It takes its marks off when it stops.
 */
export function usePillLayout(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return undefined;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        layoutPills(root);
      });
    };
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    const resizes = new ResizeObserver(schedule);
    resizes.observe(root);
    const events = ["mouseover", "mouseout", "focusin", "focusout"] as const;
    for (const name of events) root.addEventListener(name, schedule);
    document.fonts?.addEventListener("loadingdone", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resizes.disconnect();
      for (const name of events) root.removeEventListener(name, schedule);
      document.fonts?.removeEventListener("loadingdone", schedule);
      for (const el of root.querySelectorAll(`[${HIDDEN}]`)) el.removeAttribute(HIDDEN);
    };
  }, [ref, enabled]);
}
