import { expect } from "storybook/test";

/**
 * Shared play helpers that assert what the user sees (L-0018, ORV-108). A play that checks the one
 * CSS property a fix sets passes whenever the CSS is as written; these read the rendered result:
 * the ink drawn at an edge, the height of siblings in a row, and glyph boxes inside a rounded clip.
 * The pure parts (`inkWidth`, `insideRoundedRect`) take plain numbers so they are tested in node.
 */

export type Side = "top" | "right" | "bottom" | "left";
export type Rgb = readonly [number, number, number];

/** A pixel counts as ink when it differs from both backgrounds by more than this (sum over RGB). */
const INK_DISTANCE = 48;

const distance = (a: Rgb, b: Rgb) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

/**
 * The width, in CSS px, of the ink in one pixel line that runs across an edge from outside to
 * inside. The first pixel is the outside background and the last the inside background; every
 * pixel that differs from both is ink. A 1 px border plus a 1 px outline drawn next to it reads 2.
 */
export function inkWidth(line: readonly Rgb[], devicePixelRatio: number): number {
  const outside = line[0];
  const inside = line[line.length - 1];
  if (!outside || !inside) throw new Error("inkWidth needs a pixel line with a start and an end");
  const ink = line.filter(
    (px) => distance(px, outside) > INK_DISTANCE && distance(px, inside) > INK_DISTANCE,
  );
  return ink.length / devicePixelRatio;
}

export interface Corner {
  /** Horizontal radius in px. */
  x: number;
  /** Vertical radius in px. */
  y: number;
}
export interface Radii {
  topLeft: Corner;
  topRight: Corner;
  bottomRight: Corner;
  bottomLeft: Corner;
}
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Which corner of the box the point sits outside of, or null when the point is inside the rounded box. */
export function outsideCorner(
  point: { x: number; y: number },
  box: Box,
  radii: Radii,
  tolerance = 0.5,
): keyof Radii | null {
  if (
    point.x < box.left - tolerance ||
    point.x > box.right + tolerance ||
    point.y < box.top - tolerance ||
    point.y > box.bottom + tolerance
  ) {
    return point.y < (box.top + box.bottom) / 2
      ? point.x < (box.left + box.right) / 2
        ? "topLeft"
        : "topRight"
      : point.x < (box.left + box.right) / 2
        ? "bottomLeft"
        : "bottomRight";
  }
  const corners: [keyof Radii, number, number][] = [
    ["topLeft", box.left + radii.topLeft.x, box.top + radii.topLeft.y],
    ["topRight", box.right - radii.topRight.x, box.top + radii.topRight.y],
    ["bottomRight", box.right - radii.bottomRight.x, box.bottom - radii.bottomRight.y],
    ["bottomLeft", box.left + radii.bottomLeft.x, box.bottom - radii.bottomLeft.y],
  ];
  for (const [name, cx, cy] of corners) {
    const r = radii[name];
    if (r.x <= 0 || r.y <= 0) continue;
    const inCornerX = name.endsWith("Left") ? point.x < cx : point.x > cx;
    const inCornerY = name.startsWith("top") ? point.y < cy : point.y > cy;
    if (!inCornerX || !inCornerY) continue;
    const dx = (point.x - cx) / (r.x + tolerance);
    const dy = (point.y - cy) / (r.y + tolerance);
    if (dx * dx + dy * dy > 1) return name;
  }
  return null;
}

async function pixelsOf(
  png: string,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
  const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("expectEdgeInk: no 2d canvas to read the screenshot");
  context.drawImage(bitmap, 0, 0);
  const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
  return { data, width: bitmap.width, height: bitmap.height };
}

const label = (el: Element) =>
  `<${el.localName}${el.className && typeof el.className === "string" ? `.${el.className.split(" ").join(".")}` : ""}>`;

/**
 * Asserts the ink drawn at one edge of `el` (or at each of several, from one screenshot) is `px` CSS px wide, read from a screenshot (a pixel
 * line through the middle of the edge, 4 CSS px outside to 4 inside). Computed style does not
 * decide the result, so a border and an outline drawn side by side count as the two they are.
 * It runs where Vitest browser mode runs (the Storybook test project).
 */
export async function expectEdgeInk(
  el: Element,
  sides: Side | readonly Side[],
  px: number,
  reach = 4,
) {
  const { page } = await import("vitest/browser");
  // The screenshot clips to one element, so shoot the nearest ancestor that holds the edge and its margin.
  const holds = (a: DOMRect, r: DOMRect) =>
    a.left <= r.left - reach &&
    a.top <= r.top - reach &&
    a.right >= r.right + reach &&
    a.bottom >= r.bottom + reach;
  let scope: Element = el;
  while (scope.parentElement && !holds(scope.getBoundingClientRect(), el.getBoundingClientRect())) {
    scope = scope.parentElement;
  }
  // Vitest runs story files in parallel iframes and a screenshot waits on the page, so concurrent shots
  // starve each other. One lock across the iframes takes them one at a time.
  const shot = await navigator.locks.request("orivilo-screenshot", () =>
    page.screenshot({ element: scope, save: false }),
  );
  const { data, width } = await pixelsOf(shot);
  const frame = scope.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const scale = width / frame.width;
  for (const side of typeof sides === "string" ? [sides] : sides) {
    const horizontal = side === "left" || side === "right";
    const edge = { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }[side];
    const across = (horizontal ? edge - frame.left : edge - frame.top) * scale;
    const along =
      (horizontal
        ? (rect.top + rect.bottom) / 2 - frame.top
        : (rect.left + rect.right) / 2 - frame.left) * scale;
    const from = Math.round(across - reach * scale);
    const to = Math.round(across + reach * scale);
    const line: Rgb[] = [];
    for (let i = from; i <= to; i++) {
      const x = horizontal ? i : Math.round(along);
      const y = horizontal ? Math.round(along) : i;
      const at = (y * width + x) * 4;
      line.push([data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0]);
    }
    // Read outside to inside for every side.
    if (side === "bottom" || side === "right") line.reverse();
    const read = inkWidth(line, scale);
    expect(
      Math.abs(read - px),
      `${side} edge of ${label(el)} draws ${read} px of ink, expected ${px} px`,
    ).toBeLessThanOrEqual(0.25);
  }
}

/** Asserts chips, tags or controls in one row have the same rendered height, within 0.5 px. */
export function expectSameHeight(el: Element, ...siblings: Element[]) {
  const height = el.getBoundingClientRect().height;
  for (const other of siblings) {
    const otherHeight = other.getBoundingClientRect().height;
    expect(
      Math.abs(height - otherHeight),
      `${label(el)} is ${height} px tall but ${label(other)} is ${otherHeight} px`,
    ).toBeLessThanOrEqual(0.5);
  }
}

const px = (value: string, basis: number) => {
  const n = parseFloat(value);
  return value.trim().endsWith("%") ? (n / 100) * basis : n;
};

function paddingBoxOf(clip: Element): { box: Box; radii: Radii } {
  const rect = clip.getBoundingClientRect();
  const style = getComputedStyle(clip);
  const borders = {
    top: parseFloat(style.borderTopWidth),
    right: parseFloat(style.borderRightWidth),
    bottom: parseFloat(style.borderBottomWidth),
    left: parseFloat(style.borderLeftWidth),
  };
  const box: Box = {
    left: rect.left + borders.left,
    top: rect.top + borders.top,
    right: rect.right - borders.right,
    bottom: rect.bottom - borders.bottom,
  };
  const corner = (value: string, bx: number, by: number): Corner => {
    const [rx = "0", ry = rx] = value.split(" ");
    return {
      x: Math.max(0, px(rx, rect.width) - bx),
      y: Math.max(0, px(ry, rect.height) - by),
    };
  };
  const radii: Radii = {
    topLeft: corner(style.borderTopLeftRadius, borders.left, borders.top),
    topRight: corner(style.borderTopRightRadius, borders.right, borders.top),
    bottomRight: corner(style.borderBottomRightRadius, borders.right, borders.bottom),
    bottomLeft: corner(style.borderBottomLeftRadius, borders.left, borders.bottom),
  };
  // Radii that overlap are scaled down together, as the browser does.
  const scale = Math.min(
    1,
    rect.width / Math.max(1, radii.topLeft.x + radii.topRight.x),
    rect.width / Math.max(1, radii.bottomLeft.x + radii.bottomRight.x),
    rect.height / Math.max(1, radii.topLeft.y + radii.bottomLeft.y),
    rect.height / Math.max(1, radii.topRight.y + radii.bottomRight.y),
  );
  if (scale < 1) {
    for (const c of Object.values(radii)) {
      c.x *= scale;
      c.y *= scale;
    }
  }
  return { box, radii };
}

const clips = (style: CSSStyleDeclaration) =>
  style.overflowX !== "visible" || style.overflowY !== "visible";

/**
 * Asserts that, for each text node under `el`, every glyph box (a `Range` client rect) lies inside
 * its nearest clipping ancestor's padding box and inside that box's rounded corners. Text that an
 * ellipsis truncates is judged on the part that shows. Use it with a Thai sample that has stacked
 * marks (`fixtures.thaiMarks`). A mark drawn above the font's own ascent is outside every Range
 * rect, so this cannot see it; a designer screenshot is the catch for that.
 */
export function expectNoGlyphClip(el: Element) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let checked = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? "";
    if (!text) continue;
    // Ink shows only inside every clipping ancestor, so each one is checked, innermost first.
    const clipsOf: Element[] = [];
    for (let up = node.parentElement; up && up !== el.parentElement; up = up.parentElement) {
      if (clips(getComputedStyle(up))) clipsOf.push(up);
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (rect.width === 0 || rect.height === 0) continue;
      let right = rect.right;
      for (const clip of clipsOf) {
        checked++;
        const { box, radii } = paddingBoxOf(clip);
        // Text that an ellipsis truncates is judged on the part that shows.
        if (getComputedStyle(clip).textOverflow === "ellipsis") right = Math.min(right, box.right);
        const corners = [
          { x: rect.left, y: rect.top },
          { x: right, y: rect.top },
          { x: right, y: rect.bottom },
          { x: rect.left, y: rect.bottom },
        ];
        for (const point of corners) {
          const out = outsideCorner(point, box, radii);
          expect(
            out,
            `"${text}" in ${label(clip)}: the glyph box corner (${Math.round(point.x)}, ${Math.round(point.y)}) is outside the clip${out ? ` at the ${out} corner` : ""}`,
          ).toBeNull();
        }
      }
    }
  }
  expect(checked, `${label(el)} has no text under a clipping ancestor to check`).toBeGreaterThan(0);
}
