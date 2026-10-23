/**
 * Home and End for one thumb of a RangeSlider (ORV-77), as a pure function a unit test can drive.
 * Radix sends Home to the first thumb and End to the last whatever has focus; here each thumb goes
 * as far as it may (its bound, or the other thumb less the gap), on the same step grid Radix uses,
 * and never backwards.
 */
export type Pair = readonly [number, number];

interface Bounds {
  min: number;
  max: number;
  step: number;
  /** Steps the thumbs keep between them. */
  minGap: number;
}

function decimals(n: number): number {
  return (String(n).split(".")[1] ?? "").length;
}

/** The grid value at or below `v` (`floor`) or at or above it (`ceil`), counted from `min`. */
function onGrid(v: number, b: Bounds, dir: "floor" | "ceil"): number {
  const steps = (v - b.min) / b.step;
  const n = dir === "floor" ? Math.floor(steps + 1e-9) : Math.ceil(steps - 1e-9);
  return Number((b.min + n * b.step).toFixed(decimals(b.step)));
}

export function jumpRange(current: Pair, thumb: 0 | 1, to: "home" | "end", b: Bounds): Pair {
  const [low, high] = current;
  const gap = b.minGap * b.step;
  if (thumb === 0) {
    if (to === "home") return [b.min, high];
    return [Math.max(low, onGrid(high - gap, b, "floor")), high];
  }
  if (to === "end") return [low, Math.max(high, onGrid(b.max, b, "floor"))];
  return [low, Math.min(high, onGrid(low + gap, b, "ceil"))];
}
