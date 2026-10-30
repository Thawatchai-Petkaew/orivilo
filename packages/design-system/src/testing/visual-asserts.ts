import { expect } from "storybook/test";

/**
 * Shared play helpers that assert what the user sees (L-0018, ORV-108). A play that checks the one
 * CSS property a fix sets passes whenever the CSS is as written; these read the rendered result:
 * the ink drawn at an edge, the height of siblings in a row, glyph boxes inside a rounded clip, and
 * where a label sits in its control. The pure parts (`inkWidth`, `outsideCorner`, `inkCentreOf`,
 * `offCentreReport`) take plain numbers so they are tested in node.
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
  if (!context) throw new Error("no 2d canvas to read the screenshot");
  context.drawImage(bitmap, 0, 0);
  const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
  return { data, width: bitmap.width, height: bitmap.height };
}

/**
 * One screenshot of `scope`, decoded. `scale` is the screenshot width over the element's CSS width.
 * Vitest runs story files in parallel iframes and a screenshot waits on the page, so concurrent
 * shots starve each other. One lock across the iframes takes them one at a time.
 */
async function screenshotOf(scope: Element) {
  const { page } = await import("vitest/browser");
  const shot = await navigator.locks.request("orivilo-screenshot", () =>
    page.screenshot({ element: scope, save: false }),
  );
  const { data, width } = await pixelsOf(shot);
  const frame = scope.getBoundingClientRect();
  return { data, width, frame, scale: width / frame.width };
}

const label = (el: Element) =>
  `<${el.localName}${el.className && typeof el.className === "string" ? `.${el.className.split(" ").join(".")}` : ""}>`;

/**
 * True under Vitest browser mode; false on the static Storybook, where `vitest/browser` is missing.
 * Vite's mode tells them apart: the test project runs in `test`, Storybook in `development` or
 * `production`. Vitest sets no `VITEST` key on `import.meta.env` in the browser, so a guard on that
 * key is always false there and the play behind it passes without reading a pixel.
 */
export const inVitest = (import.meta as { env?: Record<string, unknown> }).env?.["MODE"] === "test";

/**
 * Asserts the ink drawn at one edge of `el` (or at each of several, from one screenshot) is `px` CSS px wide, read from a screenshot (a pixel
 * line through the middle of the edge, 4 CSS px outside to 4 inside). Computed style does not
 * decide the result, so a border and an outline drawn side by side count as the two they are.
 * It runs where Vitest browser mode runs (the Storybook test project); `vitest/browser` does not
 * exist on the static Storybook, so a play guards the call with `inVitest` and skips it there.
 */
export async function expectEdgeInk(
  el: Element,
  sides: Side | readonly Side[],
  px: number,
  reach = 4,
) {
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
  const { data, width, frame, scale } = await screenshotOf(scope);
  const rect = el.getBoundingClientRect();
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

/** Pass bound of ink-centre-1 (spec ORV-111, clause 9): the ink centre is this close to the control centre, in CSS px. */
const INK_CENTRE_BOUND = 1;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * One control box and its label, in CSS px from the top-left corner of the screenshot. The label
 * columns and the padding box rows make the region that is read (clause 3).
 */
export interface InkBox {
  /** The border box: its top edge and its height. */
  top: number;
  height: number;
  /** The widths of the top and bottom borders; the rows between them are the padding box. */
  borderTop: number;
  borderBottom: number;
  /** The columns of the label text, from its left edge to its right edge. */
  textLeft: number;
  textRight: number;
}

export interface InkCentre {
  /** Top of the ink band, in CSS px below the top of the border box. */
  inkTop: number;
  /** Bottom of the ink band, one row past the last ink row, in CSS px below the top of the border box. */
  inkBottom: number;
  /** Ink centre minus control centre, in CSS px to 2 decimals. A negative offset is above the centre. */
  offset: number;
  /** True when the offset, as reported, is at most 1 CSS px either way. */
  centred: boolean;
}

/**
 * Where the ink of a label sits in its control box, read from a decoded screenshot (RGBA bytes,
 * `width` px wide, at `scale` device px per CSS px). This is ink-centre-1 of the ORV-111 spec,
 * clauses 3 to 9; null when the region holds no ink.
 */
export function inkCentreOf(
  image: { data: ArrayLike<number>; width: number },
  scale: number,
  box: InkBox,
): InkCentre | null {
  const { data, width } = image;
  const height = data.length / 4 / width;
  // Clause 3: the columns of the label, rounded outward, and the rows of the padding box, rounded
  // inward so a row that is half border is not read; all of it inside the image.
  const left = Math.max(0, Math.floor(box.textLeft * scale));
  const right = Math.min(width, Math.ceil(box.textRight * scale));
  const top = Math.max(0, Math.ceil((box.top + box.borderTop) * scale));
  const bottom = Math.min(height, Math.floor((box.top + box.height - box.borderBottom) * scale));
  const at = (x: number, y: number): Rgb => {
    const i = (y * width + x) * 4;
    return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
  };
  // Clause 4: the ground is the most frequent colour of the region (a tie goes to the colour that
  // reaches the top count first).
  const counts = new Map<number, number>();
  let ground: Rgb | undefined;
  let most = 0;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const px = at(x, y);
      const key = (px[0] << 16) | (px[1] << 8) | px[2];
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      if (n > most) {
        most = n;
        ground = px;
      }
    }
  }
  if (!ground) return null;
  // Clauses 5 and 6: ink is a pixel over INK_DISTANCE from the ground; the band runs from the first
  // row that holds ink to the last such row, plus one row.
  let first: number | undefined;
  let last = 0;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (distance(at(x, y), ground) > INK_DISTANCE) {
        first ??= y;
        last = y;
        break;
      }
    }
  }
  if (first === undefined) return null;
  // Clauses 7 and 8: the control centre is the top of the border box plus half its height. The
  // offset is reported to 2 decimals, and clause 9 judges it as reported.
  const inkTop = first / scale - box.top;
  const inkBottom = (last + 1) / scale - box.top;
  const offset = round2((inkTop + inkBottom) / 2 - box.height / 2);
  return {
    inkTop: round2(inkTop),
    inkBottom: round2(inkBottom),
    offset,
    centred: Math.abs(offset) <= INK_CENTRE_BOUND,
  };
}

export interface InkReading extends InkCentre {
  /** The box, its label and its height, so a failure line names it. */
  name: string;
}

/** The failure message of `expectInkCentred`: each box whose label is off the centre, with its offset. Empty when none is. */
export function offCentreReport(readings: readonly InkReading[]): string {
  const off = readings.filter((reading) => !reading.centred);
  if (off.length === 0) return "";
  return [
    `${off.length} of ${readings.length} labels sit more than ${INK_CENTRE_BOUND} px from the centre of their control (a negative offset is above it):`,
    ...off.map(
      (r) =>
        `${r.name}: ink ${r.inkTop.toFixed(2)} to ${r.inkBottom.toFixed(2)} px, offset ${r.offset.toFixed(2)} px`,
    ),
  ].join("\n");
}

/** The text nodes under `box` that hold characters. */
function textNodesOf(box: Element): Text[] {
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent?.trim()) nodes.push(node as Text);
  }
  return nodes;
}

/** The runs of label text in `box`, each with the font that sets it. An `<input>` has one run: its value. */
function runsOf(box: Element): { text: string; font: string }[] {
  const fontOf = (el: Element) => {
    const style = getComputedStyle(el);
    return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  };
  if (box instanceof HTMLInputElement) return [{ text: box.value, font: fontOf(box) }];
  return textNodesOf(box).map((node) => ({
    text: node.data,
    font: fontOf(node.parentElement ?? box),
  }));
}

/** The columns of the label (clause 3): the client rects of a Range over its text, or an `<input>`'s content box. */
function columnsOf(box: Element, rect: DOMRect): { left: number; right: number } {
  if (box instanceof HTMLInputElement) {
    const style = getComputedStyle(box);
    return {
      left: rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
      right: rect.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
    };
  }
  let left = Infinity;
  let right = -Infinity;
  for (const node of textNodesOf(box)) {
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const part of range.getClientRects()) {
      left = Math.min(left, part.left);
      right = Math.max(right, part.right);
    }
  }
  if (left > right) throw new Error(`${label(box)} has no text to measure`);
  return { left, right };
}

/**
 * Where the ink of each label sits in its control (spec ORV-111, rule ink-centre-1), from one
 * screenshot of `scope`, which holds every box. It waits for the faces of the labels first (clause
 * 1), shoots `scope` the way `expectEdgeInk` does (clause 2), then reads each box (clauses 3 to 9).
 * It runs where Vitest browser mode runs; a play guards the call with `inVitest`.
 */
export async function measureInkCentre(
  scope: Element,
  boxes: readonly Element[],
): Promise<InkReading[]> {
  const runs = boxes.map(runsOf);
  await Promise.all(runs.flat().map(({ font, text }) => document.fonts.load(font, text)));
  await document.fonts.ready;
  const { data, width, frame, scale } = await screenshotOf(scope);
  return boxes.map((box, i) => {
    const rect = box.getBoundingClientRect();
    const style = getComputedStyle(box);
    const columns = columnsOf(box, rect);
    const boundary = box.closest("[data-design-profile]");
    const name = `${label(box)} "${(runs[i] ?? []).map((run) => run.text.trim()).join(" ")}", ${rect.height} px tall${
      boundary
        ? `, in ${boundary.getAttribute("data-design-profile")} ${boundary.getAttribute("data-mode")}`
        : ""
    }`;
    const found = inkCentreOf({ data, width }, scale, {
      top: rect.top - frame.top,
      height: rect.height,
      borderTop: parseFloat(style.borderTopWidth),
      borderBottom: parseFloat(style.borderBottomWidth),
      textLeft: columns.left - frame.left,
      textRight: columns.right - frame.left,
    });
    if (!found) throw new Error(`${name}: the region of its label holds no ink to measure`);
    return { ...found, name };
  });
}

/**
 * Asserts the label of each of `boxes` sits at the vertical centre of its control, within 1 CSS px
 * (ink-centre-1), read from one screenshot of `scope`, the element that holds them all. Each box
 * is one assertion, and a failure lists every box that is off with its offset. Computed style does
 * not decide the result, so a face whose glyphs ride high in its line shows. Use it with the Thai
 * and the English sample of `fixtures.ts`. It runs where Vitest browser mode runs; a play guards
 * the call with `inVitest`.
 */
export async function expectInkCentred(scope: Element, boxes: readonly Element[]) {
  expect(boxes.length, `${label(scope)} has no box to measure`).toBeGreaterThan(0);
  const readings = await measureInkCentre(scope, boxes);
  const report = offCentreReport(readings);
  for (const reading of readings) expect(reading.centred, report).toBe(true);
}
