// The page measures of ORV-128 tech notes section 8, "Page": WCAG contrast of the body pair, text and
// element density, and the font families with their subjects. Pure: no I/O, no clock, no random
// source (row 30).

import { fingerprintOf } from "../resolver";
import { linearChannel } from "./colour";

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
  if (/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/.test(name)) return `${role}.${name.replace(/ /g, "-")}`;
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
 * The first family of each `font-family` declaration of a stylesheet, in order: the value up to the
 * first comma outside quotes, without a trailing `!important`. The `font` shorthand is not read.
 */
export function declaredFamiliesOf(css: string): DeclaredFamily[] {
  const out: DeclaredFamily[] = [];
  for (const m of css.matchAll(/(?<![\w-])font-family\s*:\s*/gi)) {
    const start = m.index + m[0].length;
    let end = start;
    let quote: string | null = null;
    for (; end < css.length; end++) {
      const c = css[end];
      if (quote !== null) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === "," || c === ";" || c === "}") {
        break;
      }
    }
    const family = css
      .slice(start, end)
      .replace(/\s*!important\s*$/i, "")
      .trimEnd();
    if (family !== "") out.push({ family, offset: start });
  }
  return out;
}
