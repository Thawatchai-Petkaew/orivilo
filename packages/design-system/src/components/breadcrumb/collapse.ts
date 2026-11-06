/** How many crumbs a trail shows before it collapses (ORV-229, `crumb-collapse-1`). */
export const DEFAULT_MAX_VISIBLE = 4;

export interface CollapsedTrail {
  /** Zero-based indexes of the crumbs that stay, in trail order. */
  kept: number[];
  /** Zero-based indexes of the crumbs the ellipsis holds back, in trail order. */
  hidden: number[];
}

/**
 * Which crumbs stay when a trail of `count` crumbs is capped at `maxVisible` (`crumb-collapse-1`).
 * 0 turns collapsing off; a value that is not a whole number, or is below 0, reads as the default;
 * 1 reads as 2. Over the cap, the first crumb stays, then the last `maxVisible - 1`.
 */
export function collapseTrail(
  count: number,
  maxVisible: number = DEFAULT_MAX_VISIBLE,
): CollapsedTrail {
  const cap = Number.isInteger(maxVisible) && maxVisible >= 0 ? maxVisible : DEFAULT_MAX_VISIBLE;
  const limit = cap === 0 ? 0 : Math.max(cap, 2);
  const all = Array.from({ length: count }, (_, i) => i);
  if (limit === 0 || count <= limit) return { kept: all, hidden: [] };
  const kept = [0, ...all.slice(count - (limit - 1))];
  return { kept, hidden: all.filter((i) => !kept.includes(i)) };
}
