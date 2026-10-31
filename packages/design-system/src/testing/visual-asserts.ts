import { expect } from "storybook/test";

/**
 * Shared play helpers that assert what the user sees (L-0018, ORV-108). A play that checks the one
 * CSS property a fix sets passes whenever the CSS is as written; these read the rendered result:
 * the ink drawn at an edge, the height of siblings in a row, glyph boxes inside a rounded clip, and
 * where a label sits in its control. The pure parts (`inkWidth`, `outsideCorner`, `inkCentreOf`,
 * `bodyOf`, `offCentreReport`) take plain numbers or strings so they are tested in node.
 */

export type Side = "top" | "right" | "bottom" | "left";
type Side4 = "Top" | "Right" | "Bottom" | "Left";
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

/**
 * The index of the first row that holds a pixel more than `INK_DISTANCE` from `ground`, or null
 * when every row is plain ground. Used to find where a line of text starts to draw.
 */
export function firstInkRow(rows: readonly (readonly Rgb[])[], ground: Rgb): number | null {
  const at = rows.findIndex((row) => row.some((px) => distance(px, ground) > INK_DISTANCE));
  return at === -1 ? null : at;
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
 * One screenshot of `el`, decoded to pixels. Vitest runs story files in parallel iframes and a
 * screenshot waits on the page, so concurrent shots starve each other. One lock across the iframes
 * takes them one at a time. It needs Vitest browser mode (see `inVitest`).
 */
async function shoot(el: Element) {
  const { page } = await import("vitest/browser");
  const shot = await navigator.locks.request("orivilo-screenshot", () =>
    page.screenshot({ element: el, save: false }),
  );
  return pixelsOf(shot);
}

/** One screenshot of `scope` with its frame and `scale`, the screenshot width over the element's CSS width. */
async function screenshotOf(scope: Element) {
  const { data, width } = await shoot(scope);
  const frame = scope.getBoundingClientRect();
  return { data, width, frame, scale: width / frame.width };
}

const label = (el: Element) =>
  `<${el.localName}${el.className && typeof el.className === "string" ? `.${el.className.split(" ").join(".")}` : ""}>`;

/** True under Vitest browser mode; false on the static Storybook, where `vitest/browser` is missing. */
export const inVitest = Boolean(
  (globalThis as Record<string, unknown>)["__vitest_browser__"] === true,
);

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

export type ViewBox = readonly [minX: number, minY: number, width: number, height: number];
export interface PaintProbe {
  /** A point in the svg's `viewBox` units. */
  x: number;
  y: number;
  /** The colour the pixel there must be, as `#rrggbb`. */
  hex: string;
}

/** A pixel passes when the summed RGB difference from the expected colour is at most this. */
const PAINT_TOLERANCE = 12;

/** `#rrggbb` as RGB. Throws on anything else, so a mistyped expectation is not read as black. */
export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`hexToRgb needs #rrggbb, got "${hex}"`);
  return [parseInt(m[1] as string, 16), parseInt(m[2] as string, 16), parseInt(m[3] as string, 16)];
}

/** True when the pixel is within the paint tolerance (a summed RGB difference of 12) of the hex colour. */
export function paintMatches(pixel: Rgb, hex: string): boolean {
  return distance(pixel, hexToRgb(hex)) <= PAINT_TOLERANCE;
}

/**
 * Maps a point in `viewBox` units to CSS px from the top left of the svg's box. The svg draws with
 * `preserveAspectRatio="xMidYMid meet"` (the default): one uniform scale, the drawing centred in
 * the box. Parameters are plain numbers so the mapping is tested in node.
 */
export function viewBoxToBox(
  point: { x: number; y: number },
  viewBox: ViewBox,
  size: { width: number; height: number },
): { x: number; y: number } {
  const [minX, minY, vbWidth, vbHeight] = viewBox;
  if (vbWidth <= 0 || vbHeight <= 0) throw new Error("viewBoxToBox needs a viewBox with a size");
  const scale = Math.min(size.width / vbWidth, size.height / vbHeight);
  return {
    x: (size.width - vbWidth * scale) / 2 + (point.x - minX) * scale,
    y: (size.height - vbHeight * scale) / 2 + (point.y - minY) * scale,
  };
}

const hexOf = (px: Rgb) =>
  `#${px
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

export interface SvgPaint {
  svg: SVGSVGElement;
  probes: readonly PaintProbe[];
}

/** The nearest element that holds every one of `els` (the element itself when there is one). */
function commonAncestor(els: readonly Element[]): Element {
  let scope: Element | null = els[0] ?? null;
  while (scope && !els.every((el) => scope?.contains(el))) scope = scope.parentElement;
  if (!scope) throw new Error("expectPaintsAt needs svgs that share an ancestor");
  return scope;
}

/** Moves `el` by less than a pixel so its box starts on the pixel grid; it moves nothing else. */
function snapToGrid(el: HTMLElement | SVGElement) {
  el.style.translate = "none";
  const box = el.getBoundingClientRect();
  el.style.translate = `${Math.round(box.x) - box.x}px ${Math.round(box.y) - box.y}px`;
}

/**
 * Asserts the rendered pixel at each probe point of each svg is the expected colour, within a
 * summed RGB difference of 12, from ONE screenshot of the nearest ancestor that holds all the svgs.
 * Each screenshot queues on the shared lock behind every other story file, so a play with many svgs
 * takes one shot rather than one per svg (ORV-118 R2). A box at a half pixel is painted snapped to
 * the grid but screenshotted from its floor, so the scope and then each svg are moved by less than
 * a pixel onto the grid first. Probe points are in `viewBox` units; they must sit wholly inside the
 * part they probe (further than a pixel's diagonal from its edge), so no antialiasing reaches them.
 * It reads a screenshot, so computed style does not decide the result. It runs where Vitest browser
 * mode runs; a play guards the call with `inVitest`.
 */
export async function expectPaintsAt(entries: readonly SvgPaint[]) {
  const scope = commonAncestor(entries.map((entry) => entry.svg));
  if (scope instanceof HTMLElement || scope instanceof SVGElement) snapToGrid(scope);
  for (const { svg } of entries) if (svg !== scope) snapToGrid(svg);
  const { data, width, height } = await shoot(scope);
  const frame = scope.getBoundingClientRect();
  const scale = scope === entries[0]?.svg ? width / frame.width : window.devicePixelRatio;
  for (const { svg, probes } of entries) {
    const viewBox = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    for (const probe of probes) {
      const at = viewBoxToBox(probe, [viewBox.x, viewBox.y, viewBox.width, viewBox.height], rect);
      const x = Math.floor((rect.x - frame.x + at.x) * scale);
      const y = Math.floor((rect.y - frame.y + at.y) * scale);
      expect(
        x >= 0 && y >= 0 && x < width && y < height,
        `probe (${probe.x}, ${probe.y}) of ${label(svg)} falls outside the screenshot`,
      ).toBe(true);
      const i = (y * width + x) * 4;
      const pixel: Rgb = [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
      expect(
        paintMatches(pixel, probe.hex),
        `${label(svg)} paints ${hexOf(pixel)} at (${probe.x}, ${probe.y}), expected ${probe.hex.toUpperCase()}`,
      ).toBe(true);
    }
  }
}

/** One svg of `expectPaintsAt`. */
export function expectPaintAt(svg: SVGSVGElement, probes: readonly PaintProbe[]) {
  return expectPaintsAt([{ svg, probes }]);
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

/**
 * Asserts a title over its supporting text (ORV-192 row 17): the text starts `gap` px under the
 * title (within 0.5), the title is 500 and the text 400, and their inks differ. A compact pair has
 * one size; a header pair (`header: true`) has a 20 px title over 16 px text. `titleBottom` is for a
 * title that is a bare text node (the Tooltip's content): pass the bottom of its line box.
 */
export function expectTitleOverText(
  title: Element,
  text: Element,
  { gap, header = false, titleBottom }: { gap: number; header?: boolean; titleBottom?: number },
) {
  const bottom = titleBottom ?? title.getBoundingClientRect().bottom;
  const actual = text.getBoundingClientRect().top - bottom;
  expect(
    Math.abs(actual - gap),
    `${label(text)} starts ${actual} px under its title, not ${gap} px`,
  ).toBeLessThanOrEqual(0.5);
  const t = getComputedStyle(title);
  const x = getComputedStyle(text);
  expect(t.fontWeight, `${label(title)} weight`).toBe("500");
  expect(x.fontWeight, `${label(text)} weight`).toBe("400");
  if (header) {
    expect(parseFloat(t.fontSize), `${label(title)} size`).toBe(20);
    expect(parseFloat(x.fontSize), `${label(text)} size`).toBe(16);
  } else {
    expect(x.fontSize, `${label(text)} is the size of its title`).toBe(t.fontSize);
  }
  expect(x.color, `${label(text)} reads in a different ink than its title`).not.toBe(t.color);
}

/** The colour a semantic token resolves to at `el`, as the browser computes it (`rgb(...)`). */
export function resolvedColor(el: Element, token: string): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  el.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/**
 * The border form of focus (ORV-192 row 9, DESIGN.md "Every focusable control"): under keyboard
 * focus the element's own border turns `focus.ring` on each of `sides` (all four by default), the
 * other sides stay 0 px wide so no second line sits anywhere (the side sheet has one border, on its
 * open edge: `["Left"]` in a left-to-right page), the outline stays transparent so no line sits
 * beside the border, and a 3 px halo touches the border. The element's rest elevation, if it has
 * one, stays first in the shadow list. Puts focus back where it was.
 */
export async function expectFocusBorderForm(
  el: HTMLElement,
  sides: readonly Side4[] = ["Top", "Right", "Bottom", "Left"],
) {
  const rest = getComputedStyle(el).boxShadow;
  const before = document.activeElement;
  el.focus();
  expect(el.matches(":focus-visible"), `${label(el)} matches :focus-visible`).toBe(true);
  // A border-color transition (Card) is still running right after focus; read the settled look.
  await Promise.all(el.getAnimations().map((a) => a.finished));
  const style = getComputedStyle(el);
  const ring = resolvedColor(el, "--ds-focus-ring");
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    if (sides.includes(side)) {
      expect(style[`border${side}Color`], `${label(el)} border ${side} is focus.ring`).toBe(ring);
      expect(parseFloat(style[`border${side}Width`]), `${label(el)} border ${side} width`).toBe(1);
    } else {
      expect(parseFloat(style[`border${side}Width`]), `${label(el)} border ${side} width`).toBe(0);
    }
  }
  // No second line beside the border: the outline is transparent, or a library already set it to none.
  if (style.outlineStyle !== "none") {
    expect(style.outlineColor, `${label(el)} outline is transparent`).toBe("rgba(0, 0, 0, 0)");
  }
  expect(style.boxShadow, `${label(el)} halo is 3 px`).toMatch(/ 0px 0px 0px 3px$/);
  if (rest !== "none")
    expect(style.boxShadow.startsWith(rest), `${label(el)} keeps its elevation`).toBe(true);
  if (before instanceof HTMLElement && before !== document.body) before.focus();
  else el.blur();
}

/**
 * The elevation form of focus (ORV-192 row 9): the element keeps its rest shadow, first in the list,
 * and gains a 4 px halo after it, with a 1 px outline in `ink` (`focus.ring` unless the element sits
 * on a ground where the brand is not readable). Puts focus back where it was.
 */
export async function expectFocusElevationForm(
  el: HTMLElement,
  ink = resolvedColor(el, "--ds-focus-ring"),
) {
  const rest = getComputedStyle(el).boxShadow;
  expect(rest, `${label(el)} has an elevation at rest`).not.toBe("none");
  const before = document.activeElement;
  el.focus();
  expect(el.matches(":focus-visible"), `${label(el)} matches :focus-visible`).toBe(true);
  // A border-color transition (Card) is still running right after focus; read the settled look.
  await Promise.all(el.getAnimations().map((a) => a.finished));
  const style = getComputedStyle(el);
  expect(style.boxShadow.startsWith(rest), `${label(el)} keeps its elevation`).toBe(true);
  expect(style.boxShadow, `${label(el)} adds the halo`).toMatch(/ 0px 0px 0px 4px$/);
  expect(style.outlineWidth, `${label(el)} outline width`).toBe("1px");
  expect(style.outlineStyle, `${label(el)} outline style`).toBe("solid");
  expect(style.outlineColor, `${label(el)} outline colour`).toBe(ink);
  if (before instanceof HTMLElement && before !== document.body) before.focus();
  else el.blur();
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

/**
 * Pass bound of ink-centre-1 (spec ORV-111 v1.1, clause 9): the body's ink centre is this close to
 * the control centre, in CSS px. It is the 1 px target plus the half device pixel that text snaps
 * to at device scale factor 1 while the box may sit at a fractional y.
 */
const INK_CENTRE_BOUND = 1.5;

/**
 * The body of a label (ink-centre-1): the label with the Thai marks above and below the consonant
 * removed, U+0E31, U+0E34 to U+0E3A and U+0E47 to U+0E4E. A Latin label is its own body.
 */
export const bodyOf = (text: string) => text.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, "");

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
  /** True when the offset, as reported, is at most `INK_CENTRE_BOUND` (1.5) CSS px either way. */
  centred: boolean;
}

/**
 * Where the ink of a label sits in its control box, read from a decoded screenshot (RGBA bytes,
 * `width` px wide, at `scale` device px per CSS px). This is ink-centre-1 of the ORV-111 spec,
 * clauses 3 to 9, on whatever ink the region holds (the caller decides whether that is the body or
 * the whole label); null when the region holds no ink.
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

/** What a label is judged by: its body (the rule), or its whole ink. */
export type InkMeasure = "body" | "ink";

export interface InkReading {
  /** The box, its label and its height, so a failure line names it. */
  name: string;
  /** The reading of the label's body (clause 9 judges this one). */
  body: InkCentre;
  /** The reading of the whole ink, Thai marks included: reported beside the body. */
  ink: InkCentre;
}

/**
 * The failure message of `expectInkCentred`: each box whose `measure` reading is off the centre,
 * with the body offset and the whole-ink offset beside it. Empty when none is.
 */
export function offCentreReport(readings: readonly InkReading[], measure: InkMeasure): string {
  const off = readings.filter((reading) => !reading[measure].centred);
  if (off.length === 0) return "";
  return [
    `${off.length} of ${readings.length} labels have a ${measure === "body" ? "body" : "whole ink"} more than ${INK_CENTRE_BOUND} px from the centre of their control (a negative offset is above it):`,
    ...off.map(
      (r) =>
        `${r.name}: body offset ${r.body.offset.toFixed(2)} px, whole-ink offset ${r.ink.offset.toFixed(2)} px`,
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

/** The label of `box` as the screenshot shows it, with the text nodes (or the input value) set by `text`. */
function setLabelText(box: Element, text: (current: string) => string): () => void {
  if (box instanceof HTMLInputElement) {
    const before = box.value;
    box.value = text(before);
    return () => {
      box.value = before;
    };
  }
  const nodes = textNodesOf(box).map((node) => ({ node, before: node.data }));
  for (const { node, before } of nodes) node.data = text(before);
  return () => {
    for (const { node, before } of nodes) node.data = before;
  };
}

/** One pass of clauses 2 to 8: a screenshot of `scope`, then the ink of each box as it renders now. */
async function readBoxes(scope: Element, boxes: readonly Element[], names: readonly string[]) {
  const { data, width, frame } = await screenshotOf(scope);
  // Clause 2: the scale is the device pixel ratio, not the screenshot width over the CSS width,
  // which drifts when the scope has a fractional width.
  const scale = window.devicePixelRatio;
  return boxes.map((box, i) => {
    const rect = box.getBoundingClientRect();
    const style = getComputedStyle(box);
    const columns = columnsOf(box, rect);
    const found = inkCentreOf({ data, width }, scale, {
      top: rect.top - frame.top,
      height: rect.height,
      borderTop: parseFloat(style.borderTopWidth),
      borderBottom: parseFloat(style.borderBottomWidth),
      textLeft: columns.left - frame.left,
      textRight: columns.right - frame.left,
    });
    if (!found) throw new Error(`${names[i]}: the region of its label holds no ink to measure`);
    return found;
  });
}

/**
 * Where the ink of each label sits in its control (spec ORV-111 v1.1, rule ink-centre-1), from a
 * screenshot of `scope`, which holds every box. It waits for the faces of the labels first (clause
 * 1), shoots `scope` the way `expectEdgeInk` does (clause 2) and reads each box (clauses 3 to 8):
 * that is the whole-ink reading. When a label holds Thai marks, it then takes the marks out of the
 * text, shoots again, reads the body, and puts the label back; a label with no marks has the one
 * reading for both. It runs where Vitest browser mode runs; a play guards the call with `inVitest`.
 */
export async function measureInkCentre(
  scope: Element,
  boxes: readonly Element[],
): Promise<InkReading[]> {
  const runs = boxes.map(runsOf);
  await Promise.all(
    runs
      .flat()
      .flatMap(({ font, text }) => [
        document.fonts.load(font, text),
        document.fonts.load(font, bodyOf(text)),
      ]),
  );
  await document.fonts.ready;
  const names = boxes.map((box, i) => {
    const boundary = box.closest("[data-design-profile]");
    return `${label(box)} "${(runs[i] ?? []).map((run) => run.text.trim()).join(" ")}", ${box.getBoundingClientRect().height} px tall${
      boundary
        ? `, in ${boundary.getAttribute("data-design-profile")} ${boundary.getAttribute("data-mode")}`
        : ""
    }`;
  });
  const whole = await readBoxes(scope, boxes, names);
  const marked = runs.map((box) => box.some(({ text }) => bodyOf(text) !== text));
  let stripped = whole;
  if (marked.some(Boolean)) {
    const restores = boxes.map((box) => setLabelText(box, bodyOf));
    try {
      stripped = await readBoxes(scope, boxes, names);
    } finally {
      for (const restore of restores) restore();
    }
  }
  return boxes.map((_, i) => ({
    name: names[i] ?? "",
    body: marked[i] ? (stripped[i] as InkCentre) : (whole[i] as InkCentre),
    ink: whole[i] as InkCentre,
  }));
}

/**
 * Asserts the label of each of `boxes` sits at the vertical centre of its control (ink-centre-1),
 * read from screenshots of `scope`, the element that holds them all: one for the whole ink and one
 * for the body. `measure` names the reading that is judged, within 1.5 CSS px: `"body"` for a
 * Thai label whose marks rise freely above the consonants, `"ink"` for the whole ink. Each box is
 * one assertion, and a failure lists every box that is off with its body offset and its whole-ink
 * offset. Computed style does not decide the result, so a face whose glyphs ride high in its line
 * shows. Use it with the Thai and the English sample of `fixtures.ts`. It runs where Vitest browser
 * mode runs; a play guards the call with `inVitest`.
 */
export async function expectInkCentred(
  scope: Element,
  boxes: readonly Element[],
  { measure }: { measure: InkMeasure },
) {
  expect(boxes.length, `${label(scope)} has no box to measure`).toBeGreaterThan(0);
  const readings = await measureInkCentre(scope, boxes);
  const report = offCentreReport(readings, measure);
  for (const reading of readings) expect(reading[measure].centred, report).toBe(true);
}

/**
 * Asserts the first ink of `el`'s first line starts at least `px` CSS px below the bottom of
 * `above` (ORV-192 row 19). Thai marks such as the ฟื้ stack rise above the line box, so a box
 * check cannot see them; this reads them. `above` is hidden while one screenshot of the nearest
 * ancestor holding both boxes is taken (restored in `finally`), the ground is the pixel 1 CSS px
 * inside the top left of `above`, and the rows from the top of `above` down to the bottom of
 * `el`'s first line are scanned over `el`'s columns. It runs where Vitest browser mode runs; a play
 * guards the call with `inVitest`.
 */
export async function expectInkClearsAbove(el: Element, above: Element, px = 4) {
  const holds = (a: DOMRect, r: DOMRect) =>
    a.left <= r.left && a.top <= r.top && a.right >= r.right && a.bottom >= r.bottom;
  const aboveRect = above.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const both = new DOMRect(
    Math.min(rect.left, aboveRect.left),
    Math.min(rect.top, aboveRect.top),
    Math.max(rect.right, aboveRect.right) - Math.min(rect.left, aboveRect.left),
    Math.max(rect.bottom, aboveRect.bottom) - Math.min(rect.top, aboveRect.top),
  );
  let scope: Element = el;
  while (scope.parentElement && !holds(scope.getBoundingClientRect(), both)) {
    scope = scope.parentElement;
  }
  const hidden = above as HTMLElement;
  const previous = hidden.style.visibility;
  hidden.style.visibility = "hidden";
  try {
    const { data, width } = await shoot(scope);
    const frame = scope.getBoundingClientRect();
    const scale = width / frame.width;
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);
    const firstLineBottom = Number.isNaN(lineHeight)
      ? rect.bottom
      : Math.min(rect.bottom, rect.top + parseFloat(style.paddingTop) + lineHeight);
    const pixel = (x: number, y: number): Rgb => {
      const at = (y * width + x) * 4;
      return [data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0];
    };
    const ground = pixel(
      Math.round((aboveRect.left + 1 - frame.left) * scale),
      Math.round((aboveRect.top + 1 - frame.top) * scale),
    );
    const top = Math.round((aboveRect.top - frame.top) * scale);
    const bottom = Math.round((firstLineBottom - frame.top) * scale);
    const left = Math.round((rect.left - frame.left) * scale);
    const right = Math.round((rect.right - frame.left) * scale);
    const rows: Rgb[][] = [];
    for (let y = top; y < bottom; y++) {
      const row: Rgb[] = [];
      for (let x = left; x < right; x++) row.push(pixel(x, y));
      rows.push(row);
    }
    const found = firstInkRow(rows, ground);
    expect(found, `${label(el)} draws no ink in its first line`).not.toBeNull();
    const gap = (top + (found ?? 0)) / scale + frame.top - aboveRect.bottom;
    const read = Math.round(gap * 10) / 10;
    expect(
      read,
      `${label(el)} ink starts ${read} px under ${label(above)}, expected at least ${px} px`,
    ).toBeGreaterThanOrEqual(px);
  } finally {
    hidden.style.visibility = previous;
  }
}
