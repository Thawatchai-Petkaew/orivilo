// Wu's colour quantiser, ported from `QuantizerWu` and `QuantizerMap` of Material Color Utilities
// 0.4.0 (@material/material-color-utilities, quantize/quantizer_wu.js and quantize/quantizer_map.js).
//
// @license
// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// The licence text is in LICENSE-material-color-utilities.txt beside this file.
//
// This file was changed from the original (Apache License 2.0, section 4(b)). The changes: it is
// TypeScript, it reads RGBA bytes (the original reads ARGB integers), it returns each box's pixel
// count beside its colour, one function walks the three axes (the original has one copy per axis),
// and the histogram is built straight from the pixels (no `Map`). The steps and the constants are
// the original's: 5 index bits, a cube of 33 per side, the box of largest variance cut next.
// Pure: no I/O, no clock, no random source, no sort; the result is a function of the colour
// histogram, so the order of the pixels does not change it (ORV-128 tech notes §8, F41).

const INDEX_BITS = 5;
const SIDE = (1 << INDEX_BITS) + 1; // 33 cells per side; cell 0 is the empty border of the prefix sums
const TOTAL = SIDE * SIDE * SIDE; // 35937

export type Cluster = {
  red: number;
  green: number;
  blue: number;
  /** How many opaque pixels the cluster's box holds. */
  count: number;
};

type Moment = Float64Array;
/** The five sums Wu's method keeps per cell of the cube; after `prefixSums` they are sums over every cell up to it. */
type Histogram = { weight: Moment; red: Moment; green: Moment; blue: Moment; squares: Moment };
type Point = [number, number, number];
type Axis = 0 | 1 | 2;
const AXES: readonly Axis[] = [0, 1, 2];
const NEXT_AXIS: Record<Axis, Axis> = { 0: 1, 1: 2, 2: 0 };
/** A box of the cube: cells above `lo` and up to `hi` on each axis. */
type Box = { lo: Point; hi: Point; vol: number };

const cellOf = (r: number, g: number, b: number): number => (r * SIDE + g) * SIDE + b;

/**
 * Wu's quantiser. `rgba` holds four bytes per pixel (red, green, blue, alpha). A pixel with alpha
 * below 255 is skipped, so the counts sum to the opaque pixel count. Returns at most `maxColors`
 * clusters in box order (the order the boxes were made in): each box's mean colour, rounded per
 * channel, and its pixel count. No opaque pixel gives an empty list. `maxColors` is at least 1.
 */
export function quantizeWu(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Cluster[] {
  const h = histogramOf(rgba);
  for (const m of Object.values(h)) prefixSums(m);
  const entries = [{ box: wholeCube(), variance: 0 }];
  let next = entries[0] ?? { box: wholeCube(), variance: 0 };
  while (entries.length < maxColors) {
    const added = cut(h, next.box);
    if (added) {
      next.variance = varianceOf(h, next.box);
      entries.push({ box: added, variance: varianceOf(h, added) });
    } else {
      next.variance = 0;
    }
    // The box of largest variance goes next; a strict `>` keeps the lower index on a tie.
    next = entries.reduce((best, e) => (e.variance > best.variance ? e : best));
    if (next.variance <= 0) break;
  }
  const clusters: Cluster[] = [];
  for (const { box } of entries) {
    const count = volume(h.weight, box);
    if (count > 0) {
      clusters.push({
        red: Math.round(volume(h.red, box) / count),
        green: Math.round(volume(h.green, box) / count),
        blue: Math.round(volume(h.blue, box) / count),
        count,
      });
    }
  }
  return clusters;
}

function wholeCube(): Box {
  return { lo: [0, 0, 0], hi: [SIDE - 1, SIDE - 1, SIDE - 1], vol: 0 };
}

function histogramOf(rgba: Uint8Array | Uint8ClampedArray): Histogram {
  const h: Histogram = {
    weight: new Float64Array(TOTAL),
    red: new Float64Array(TOTAL),
    green: new Float64Array(TOTAL),
    blue: new Float64Array(TOTAL),
    squares: new Float64Array(TOTAL),
  };
  const shift = 8 - INDEX_BITS;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if ((rgba[i + 3] ?? 0) < 255) continue; // as 0.4.0's QuantizerMap skips a translucent pixel
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    const cell = cellOf((r >> shift) + 1, (g >> shift) + 1, (b >> shift) + 1);
    h.weight[cell] = (h.weight[cell] ?? 0) + 1;
    h.red[cell] = (h.red[cell] ?? 0) + r;
    h.green[cell] = (h.green[cell] ?? 0) + g;
    h.blue[cell] = (h.blue[cell] ?? 0) + b;
    h.squares[cell] = (h.squares[cell] ?? 0) + (r * r + g * g + b * b);
  }
  return h;
}

/** Replaces each cell of `m` by the sum of every cell up to it on the three axes. */
function prefixSums(m: Moment): void {
  for (let r = 1; r < SIDE; r++) {
    const area = new Float64Array(SIDE);
    for (let g = 1; g < SIDE; g++) {
      let line = 0;
      for (let b = 1; b < SIDE; b++) {
        const cell = cellOf(r, g, b);
        line += m[cell] ?? 0;
        area[b] = (area[b] ?? 0) + line;
        m[cell] = (m[cellOf(r - 1, g, b)] ?? 0) + (area[b] ?? 0);
      }
    }
  }
}

/** The sum of `m` over the cells of the plane at `pos` on `axis`, within the box's range on the other two axes. */
function plane(m: Moment, box: Box, axis: Axis, pos: number): number {
  const a = NEXT_AXIS[axis];
  const b = NEXT_AXIS[a];
  const at = (ca: number, cb: number): number => {
    const p: Point = [0, 0, 0];
    p[axis] = pos;
    p[a] = ca;
    p[b] = cb;
    return m[cellOf(p[0], p[1], p[2])] ?? 0;
  };
  return (
    at(box.hi[a], box.hi[b]) -
    at(box.hi[a], box.lo[b]) -
    at(box.lo[a], box.hi[b]) +
    at(box.lo[a], box.lo[b])
  );
}

/** The sum of `m` over the cells inside the box. */
function volume(m: Moment, box: Box): number {
  return plane(m, box, 0, box.hi[0]) - plane(m, box, 0, box.lo[0]);
}

function varianceOf(h: Histogram, box: Box): number {
  if (box.vol <= 1) return 0;
  const dr = volume(h.red, box);
  const dg = volume(h.green, box);
  const db = volume(h.blue, box);
  return volume(h.squares, box) - (dr * dr + dg * dg + db * db) / volume(h.weight, box);
}

/**
 * The position on `axis` that splits the box into two halves with the largest summed
 * (sum of colour)^2 / weight, and that sum; `cut` is -1 when no position leaves both halves weighty.
 */
function maximize(h: Histogram, box: Box, axis: Axis): { cut: number; max: number } {
  const whole = {
    r: volume(h.red, box),
    g: volume(h.green, box),
    b: volume(h.blue, box),
    w: volume(h.weight, box),
  };
  const low = box.lo[axis];
  const base = {
    r: plane(h.red, box, axis, low),
    g: plane(h.green, box, axis, low),
    b: plane(h.blue, box, axis, low),
    w: plane(h.weight, box, axis, low),
  };
  let max = 0;
  let cut = -1;
  for (let i = low + 1; i < box.hi[axis]; i++) {
    let hr = plane(h.red, box, axis, i) - base.r;
    let hg = plane(h.green, box, axis, i) - base.g;
    let hb = plane(h.blue, box, axis, i) - base.b;
    let hw = plane(h.weight, box, axis, i) - base.w;
    if (hw === 0) continue;
    let temp = (hr * hr + hg * hg + hb * hb) / hw;
    hr = whole.r - hr;
    hg = whole.g - hg;
    hb = whole.b - hb;
    hw = whole.w - hw;
    if (hw === 0) continue;
    temp += (hr * hr + hg * hg + hb * hb) / hw;
    if (temp > max) {
      max = temp;
      cut = i;
    }
  }
  return { cut, max };
}

/**
 * Cuts `box` along the axis of the largest maximum (red, then green, then blue on a tie) and
 * returns the box above the cut, or null when the cut is refused. As in 0.4.0, a cut is refused
 * only when red wins with no cut position.
 */
function cut(h: Histogram, box: Box): Box | null {
  const found = AXES.map((a) => maximize(h, box, a));
  let axis: Axis = 0;
  let best = found[0] ?? { cut: -1, max: 0 };
  for (const a of AXES) {
    const f = found[a];
    if (f && f.max > best.max) {
      axis = a;
      best = f;
    }
  }
  if (axis === 0 && best.cut < 0) return null;
  const above: Box = { lo: [...box.lo], hi: [...box.hi], vol: 0 };
  box.hi[axis] = best.cut;
  above.lo[axis] = best.cut;
  const size = (b: Box): number => (b.hi[0] - b.lo[0]) * (b.hi[1] - b.lo[1]) * (b.hi[2] - b.lo[2]);
  box.vol = size(box);
  above.vol = size(above);
  return above;
}
