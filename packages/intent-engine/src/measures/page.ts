// The page measures of ORV-128 tech notes section 8, "Page": WCAG contrast of the body pair, text and
// element density, and the font families with their subjects. Pure: no I/O, no clock, no random
// source (row 30).

import { fingerprintOf } from "../resolver";
import { endOfCommentOrString, linearChannel } from "./colour";

/** The viewport the densities are per: 1280 x 800 CSS px, the first screen (tech notes section 7). */
export const FIRST_SCREEN_HEIGHT = 800;
const FIRST_SCREEN_AREA_PER_1000_PX2 = (1280 * FIRST_SCREEN_HEIGHT) / 1000;

const luminance = (hex: string): number => {
  const [r, g, b] = [0, 2, 4].map((i) => linearChannel(parseInt(hex.slice(i, i + 2), 16))) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio of two six-digit hex colours, from 1 to 21, rounded to thousandths. */
export function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return Math.round(ratio * 1000) / 1000;
}

export type Box = { x: number; y: number; width: number; height: number };

/** A box meets the first screen when it is not empty and starts above its bottom edge (`boxSchema` keeps it within the width). */
export const meetsFirstScreen = (box: Box): boolean =>
  box.width > 0 && box.height > 0 && box.y < FIRST_SCREEN_HEIGHT;

/** Characters of the given blocks per 1,000 px² of the first screen. */
export const textDensity = (characters: number): number =>
  characters / FIRST_SCREEN_AREA_PER_1000_PX2;

export type BodyPair = {
  /** `<color>-on-<backdrop>`, six lowercase hex digits each, no `#`. */
  subject: string;
  color: string;
  backdrop: string;
  /** The path of the first block, in the order given, whose box has this pair. */
  path: string;
  ratio: number;
};

/**
 * The body pair: among the given kept body blocks, the pair that covers the most characters; on a
 * tie the lower subject by code point (the lower colour, then the lower backdrop). A block whose
 * pair is null counts toward no pair. Null when no block has a pair.
 */
export function bodyPairOf(
  blocks: readonly {
    path: string;
    length: number;
    pair: { color: string; backdrop: string } | null;
  }[],
): BodyPair | null {
  const pairs = new Map<
    string,
    { color: string; backdrop: string; path: string; length: number }
  >();
  for (const b of blocks) {
    if (b.pair === null) continue;
    const color = b.pair.color.slice(1);
    const backdrop = b.pair.backdrop.slice(1);
    const subject = `${color}-on-${backdrop}`;
    const held = pairs.get(subject);
    if (held) held.length += b.length;
    else pairs.set(subject, { color, backdrop, path: b.path, length: b.length });
  }
  let best: BodyPair | null = null;
  let bestLength = -1;
  for (const [subject, p] of pairs) {
    if (
      p.length > bestLength ||
      (p.length === bestLength && best !== null && subject < best.subject)
    ) {
      best = {
        subject,
        color: p.color,
        backdrop: p.backdrop,
        path: p.path,
        ratio: contrastRatio(p.color, p.backdrop),
      };
      bestLength = p.length;
    }
  }
  return best;
}

// ---------------------------------------------------------------- font families

const ASCII_WHITESPACE = /[\t\n\f\r ]+/g;

/**
 * The subject of a `font-family` item (F53): `<role>.<family>` where the role is `heading`, `body`
 * or `declared`. Null when the family is empty. Five steps: drop one pair of quotes that opens and
 * closes the family; fold ASCII whitespace to one space and trim; lowercase `A` to `Z` only (so the
 * subject does not rest on the Node version's Unicode tables); a family of lowercase ASCII letters
 * and digits in words joined by one space or `-` gives `<role>.<the words joined by ->`; any other
 * family gives `<role>.<base>.<fingerprint>` with `base` the family's runs outside `a-z0-9` turned
 * into `-` and trimmed (`family` when nothing is left) and `fingerprint` the 8 hex digits of
 * `fingerprintOf` the folded, lowercased family. Two parts and three parts never meet.
 */
export function familySubject(
  role: "heading" | "body" | "declared",
  family: string,
): string | null {
  let name = family;
  const quote = name[0];
  if (name.length >= 2 && (quote === '"' || quote === "'") && name.endsWith(quote)) {
    name = name.slice(1, -1);
  }
  name = name.replace(ASCII_WHITESPACE, " ").trim();
  name = name.replace(/[A-Z]/g, (c) => c.toLowerCase());
  if (name === "") return null;
  if (/^(?![ -])(?![\s\S]*[ -](?:[ -]|$))[a-z0-9 -]+$/.test(name))
    return `${role}.${name.replace(/ /g, "-")}`;
  const base = name.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "family";
  return `${role}.${base}.${fingerprintOf(name)}`;
}

export type DeclaredFamily = {
  /** The family as written, quotes kept. */
  family: string;
  /** The index in the decoded stylesheet of the first character of the family. */
  offset: number;
};

/**
 * The bound of a family, in characters. It is the snapshot's bound of a text box's `fontFamily`
 * (`render-snapshot.ts`, 100), so a declared family and a rendered one are held to one limit; a
 * test in this file's folder keeps the two equal. A declared family over it gives no item (SEC-3).
 */
export const FONT_FAMILY_MAX_CHARS = 100;

/** The CSS-wide keywords: a value that names no font. */
const CSS_WIDE_KEYWORDS = new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);

const IMPORTANT = "!important";
const FONT_FACE = "@font-face";

/** The `@font-face` blocks of a stylesheet as [index of its `{`, index of its `}`], in order. One forward pass. */
function fontFaceBlocks(css: string): [number, number][] {
  const out: [number, number][] = [];
  const open: (number | null)[] = []; // for each open block, where it began when it is an @font-face
  let prelude = -1; // the first character of the text before the next "{"; -1 until one is seen
  let i = 0;
  while (i < css.length) {
    const skipped = endOfCommentOrString(css, i);
    if (skipped !== i) {
      if (css[i] !== "/" && prelude < 0) prelude = i; // a string counts as text, a comment does not
      i = skipped;
      continue;
    }
    const c = css[i] as string;
    if (c === "{") {
      const isFace =
        prelude >= 0 &&
        css.slice(prelude, prelude + FONT_FACE.length).toLowerCase() === FONT_FACE &&
        !/[\w-]/.test(css[prelude + FONT_FACE.length] ?? "");
      open.push(isFace ? i : null);
      prelude = -1;
    } else if (c === "}") {
      const start = open.pop();
      if (start !== undefined && start !== null) out.push([start, i]);
      prelude = -1;
    } else if (c === ";") {
      prelude = -1;
    } else if (prelude < 0 && c > " ") {
      prelude = i;
    }
    i++;
  }
  for (const start of open) if (start !== null) out.push([start, css.length]);
  return out.sort((a, b) => a[0] - b[0]);
}

/**
 * The first family of each `font-family` declaration of a stylesheet, in order: the value up to the
 * first comma outside quotes, without a trailing `!important`. The `font` shorthand is not read.
 * No item for a family that names no font: a value that holds `var(`, a CSS-wide keyword, or a descriptor of
 * an `@font-face` rule (S-8). The scan of a value stops at FONT_FAMILY_MAX_CHARS characters and a
 * family over it gives no item, so the cost is linear in the sheet however it is written (SEC-3).
 */
export function declaredFamiliesOf(css: string): DeclaredFamily[] {
  const out: DeclaredFamily[] = [];
  const faces = fontFaceBlocks(css);
  let face = 0;
  for (const m of css.matchAll(/(?<![\w-])font-family\s*:\s*/gi)) {
    while (face < faces.length && (faces[face]?.[1] ?? 0) < m.index) face++;
    const block = faces[face];
    if (block !== undefined && block[0] < m.index) continue;
    const start = m.index + m[0].length;
    const limit = Math.min(css.length, start + FONT_FAMILY_MAX_CHARS + 1);
    let end = start;
    let quote: string | null = null;
    for (; end < limit; end++) {
      const c = css[end];
      if (quote !== null) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === "," || c === ";" || c === "}") {
        break;
      }
    }
    if (end - start > FONT_FAMILY_MAX_CHARS) continue;
    let family = css.slice(start, end).trimEnd();
    if (family.slice(-IMPORTANT.length).toLowerCase() === IMPORTANT) {
      family = family.slice(0, -IMPORTANT.length).trimEnd();
    }
    if (family === "") continue;
    if (family.toLowerCase().includes("var(")) continue;
    if (CSS_WIDE_KEYWORDS.has(family.toLowerCase())) continue;
    out.push({ family, offset: start });
  }
  return out;
}
