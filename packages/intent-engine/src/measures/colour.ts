// The colour measures of ORV-128 tech notes section 8, "Colour": OKLCH, the clusters of `quantizeWu`
// turned into area shares and bands, the warm share and mean chroma of the first screen, and the
// declared colours of a stylesheet. Pure: no I/O, no clock, no random source (row 30).

import { classifyHex, type HueFamily } from "../color-audit";
import { WARM_BANDS } from "../leans";
import { quantizeWu } from "./wu";

/** At most this many clusters per scope (tech notes section 8, "Colour"). */
export const CLUSTERS_PER_SCOPE = 8;

/** Decimals kept for an OKLCH number, so a value sits inside its bound in floating point (white is 1, not 1.0000000000000002). */
const OKLCH_DECIMALS = 4;
const round = (x: number, decimals: number): number => {
  const k = 10 ** decimals;
  return Math.round(x * k) / k;
};

const toHex = (r: number, g: number, b: number): string =>
  [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/** An sRGB channel byte as a linear-light number. */
export function linearChannel(byte: number): number {
  const x = byte / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

/** OKLCH lightness and chroma of an sRGB colour, each rounded to OKLCH_DECIMALS (Ottosson's OKLab). */
export function oklchOf(r: number, g: number, b: number): { lightness: number; chroma: number } {
  const lr = linearChannel(r);
  const lg = linearChannel(g);
  const lb = linearChannel(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    lightness: round(lightness, OKLCH_DECIMALS),
    chroma: round(Math.hypot(a, bb), OKLCH_DECIMALS),
  };
}

export type ColourArea = {
  /** Six lowercase hex digits, the mean colour of the cluster's box: the item's subject. */
  hex: string;
  /** The cluster's pixel count over the opaque pixels of the raster; not rounded. */
  share: number;
  band: HueFamily;
  lightness: number;
  chroma: number;
};

/** The colour areas of one raster: Wu's clusters with their shares, bands and OKLCH numbers. No opaque pixel gives none. */
export function colourAreasOf(rgba: Uint8Array): ColourArea[] {
  const clusters = quantizeWu(rgba, CLUSTERS_PER_SCOPE);
  const opaque = clusters.reduce((sum, c) => sum + c.count, 0);
  return clusters.map((c) => {
    const hex = toHex(c.red, c.green, c.blue);
    return {
      hex,
      share: c.count / opaque,
      band: classifyHex(`#${hex}`),
      ...oklchOf(c.red, c.green, c.blue),
    };
  });
}

/** The warm share (the area share of the bands `measure-to-lean-1` names) and the mean chroma weighted by area share. */
export function paletteOf(areas: readonly ColourArea[]): { warmShare: number; meanChroma: number } {
  const warm = areas
    .filter((a) => (WARM_BANDS as readonly string[]).includes(a.band))
    .reduce((sum, a) => sum + a.share, 0);
  const chroma = areas.reduce((sum, a) => sum + a.share * a.chroma, 0);
  return {
    // Held to 1 against floating point, not rounded: `measure-to-lean-1` rounds to thousandths once (S-10).
    warmShare: Math.min(1, warm),
    meanChroma: round(chroma, OKLCH_DECIMALS),
  };
}

// ---------------------------------------------------------------- declared colours

const clampByte = (v: number): number => Math.min(255, Math.max(0, Math.round(v)));

/**
 * One CSS number as a sign, digits with an optional fraction or a fraction alone, and an optional
 * exponent. Each character has one way to match (the number form of SEC-3), so a long token fails
 * in linear time. The two readers below write it out in full, as literals.
 */
const COMPONENT = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%?)$/i;
const HUE = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/i;

/** A token of a colour function longer than this is not a colour (SEC-3); a real one is a few characters. */
const COLOUR_TOKEN_MAX_CHARS = 64;

/** One CSS number or percentage as a fraction of `scale`; null for anything else (`none`, `calc()`, a unit). */
export function component(token: string, scale: number): number | null {
  const m = COMPONENT.exec(token);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "%" ? (n / 100) * scale : n;
}

/** A hue in degrees from a number or a `deg`, `grad`, `rad` or `turn` value. */
export function hueOf(token: string): number | null {
  const m = HUE.exec(token);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = (m[2] ?? "deg").toLowerCase();
  const degrees =
    unit === "grad"
      ? n * 0.9
      : unit === "rad"
        ? (n * 180) / Math.PI
        : unit === "turn"
          ? n * 360
          : n;
  return ((degrees % 360) + 360) % 360;
}

/** CSS Color 4 hsl to sRGB bytes (hue in degrees, saturation and lightness as fractions). */
function hslToBytes(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number): number => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [clampByte(channel(0) * 255), clampByte(channel(8) * 255), clampByte(channel(4) * 255)];
}

/** The six hex digits of a colour function's arguments, or null: any other syntax, and an alpha that is not 1. */
function functionColour(name: string, args: string): string | null {
  const tokens = args.trim().split(/\s*[,/]\s*|\s+/);
  if (tokens.length !== 3 && tokens.length !== 4) return null;
  if (tokens.some((t) => t.length > COLOUR_TOKEN_MAX_CHARS)) return null;
  if (tokens.length === 4) {
    const alpha = component(tokens[3] ?? "", 1);
    if (alpha !== 1) return null;
  }
  if (name.startsWith("rgb")) {
    const rgb = tokens.slice(0, 3).map((t) => component(t, 255));
    if (rgb.some((v) => v === null)) return null;
    const [r, g, b] = rgb as [number, number, number];
    return toHex(clampByte(r), clampByte(g), clampByte(b));
  }
  const hue = hueOf(tokens[0] ?? "");
  const saturation = component(tokens[1] ?? "", 1);
  const lightness = component(tokens[2] ?? "", 1);
  if (hue === null || saturation === null || lightness === null) return null;
  if (!(tokens[1] ?? "").endsWith("%") || !(tokens[2] ?? "").endsWith("%")) return null;
  // A lightness outside 0 to 1 gives white or black by itself once the bytes are held to 0 to 255.
  const [r, g, b] = hslToBytes(hue, Math.min(1, Math.max(0, saturation)), lightness);
  return toHex(r, g, b);
}

const HEX_COLOUR = /#([0-9a-f]{3}|[0-9a-f]{6})(?![0-9a-z_\u0080-\uffff-])/gi;
const COLOUR_FUNCTION = /\b(rgba?|hsla?)\(([^()]*)\)/gi;
const IDENT_CHAR = /[A-Za-z0-9_\u0080-\uffff-]/;

/**
 * The index after the comment or the string that starts at `i`, or `i` when none does. A comment
 * with no end and a string with no end run to the end of the text; a string also ends before an
 * unescaped line break, as CSS ends a bad string. One `indexOf` or one walk, forward only.
 */
export function endOfCommentOrString(css: string, i: number): number {
  const c = css[i];
  if (c === "/" && css[i + 1] === "*") {
    const close = css.indexOf("*/", i + 2);
    return close < 0 ? css.length : close + 2;
  }
  if (c !== '"' && c !== "'") return i;
  let j = i + 1;
  while (j < css.length) {
    const d = css[j];
    if (d === "\\") j += 2;
    else if (d === c) return j + 1;
    else if (d === "\n" || d === "\r" || d === "\f") return j;
    else j++;
  }
  return css.length;
}

/** The index after the `url(` token that starts at `i` (its `)`, or the end of the text), or `i` when none starts there. */
function endOfUrl(css: string, i: number): number {
  const c = css[i];
  if ((c !== "u" && c !== "U") || css.slice(i, i + 4).toLowerCase() !== "url(") return i;
  if (i > 0 && IDENT_CHAR.test(css[i - 1] ?? "")) return i;
  let j = i + 4;
  while (j < css.length) {
    const k = endOfCommentOrString(css, j);
    if (k !== j) j = k;
    else if (css[j] === ")") return j + 1;
    else j++;
  }
  return css.length;
}

/**
 * The ranges of a stylesheet that are declaration values: the text after a `:` inside a block, up
 * to the `;` or `}` that ends it. A comment, a string and a `url()` split a value and are not in
 * it. A `:` whose text ends in `{` was a nested selector, not a declaration, and gives nothing.
 * One forward pass, so the cost is linear in the sheet.
 */
function declarationValues(css: string): [start: number, end: number][] {
  const out: [number, number][] = [];
  let depth = 0;
  let inValue = false;
  let from = 0; // the start of the piece of the value being read
  let mark = 0; // out.length when the value began
  const close = (end: number) => {
    if (inValue && end > from) out.push([from, end]);
  };
  let i = 0;
  while (i < css.length) {
    const skipped = Math.max(endOfCommentOrString(css, i), endOfUrl(css, i));
    if (skipped !== i) {
      close(i);
      i = skipped;
      from = i;
      continue;
    }
    const c = css[i];
    if (c === "{") {
      if (inValue) out.length = mark;
      inValue = false;
      depth++;
    } else if (c === "}") {
      close(i);
      inValue = false;
      depth = Math.max(0, depth - 1);
    } else if (c === ";") {
      close(i);
      inValue = false;
    } else if (c === ":" && depth > 0 && !inValue) {
      inValue = true;
      from = i + 1;
      mark = out.length;
    }
    i++;
  }
  close(css.length);
  return out;
}

export type DeclaredColour = {
  /** Six lowercase hex digits. */
  hex: string;
  /** The index in the decoded stylesheet of the first character of its first occurrence. */
  offset: number;
};

/**
 * The distinct colours a stylesheet declares, each with the offset of its first occurrence, in order
 * of that offset. Read: hex of 3 or 6 digits, and `rgb()`, `rgba()`, `hsl()` and `hsla()` with no
 * alpha or an alpha of 1. Any other syntax, a colour with an alpha below 1 among it, is skipped and
 * not counted, and so is a function with a token over 64 characters. Colours are read only in
 * declaration values (S-7): a selector, a comment, a string and a `url()` give none.
 */
export function declaredColoursOf(css: string): DeclaredColour[] {
  const first = new Map<string, number>();
  const note = (hex: string | null, offset: number) => {
    if (hex === null) return;
    const seen = first.get(hex);
    if (seen === undefined || offset < seen) first.set(hex, offset);
  };
  for (const [start, end] of declarationValues(css)) {
    const piece = css.slice(start, end);
    for (const m of piece.matchAll(HEX_COLOUR)) {
      const digits = (m[1] ?? "").toLowerCase();
      note(digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits, start + m.index);
    }
    for (const m of piece.matchAll(COLOUR_FUNCTION)) {
      note(functionColour((m[1] ?? "").toLowerCase(), m[2] ?? ""), start + m.index);
    }
  }
  return [...first].map(([hex, offset]) => ({ hex, offset })).sort((a, b) => a.offset - b.offset);
}
