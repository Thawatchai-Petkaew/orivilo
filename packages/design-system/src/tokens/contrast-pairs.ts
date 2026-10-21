/**
 * The contrast contract (DESIGN.md §3, §11; spec E0-5). Every text and UI pair the semantic layer
 * puts together is derived here from the token paths, so a new surface or a profile override is
 * checked without anyone remembering to declare it. `scripts/check-contrast.ts` prints the report
 * and fails CI; `contrast-pairs.test.ts` runs the same pairs under `pnpm test`.
 *
 * Floors are WCAG 2.2: 4.5 for text (1.4.3), 3.0 for a boundary that identifies a control (1.4.11).
 * Tokens with no pair are listed in `EXEMPT` with the reason, so an unexplained colour fails.
 */
import { contrastRatio } from "../foundations/contrast.ts";
import type { Mode, TokenSet } from "./model.ts";
import { MODES } from "./model.ts";

export const TEXT = 4.5;
export const UI = 3;

export interface PairRule {
  /** Semantic paths drawn on top. */
  fg: readonly string[];
  /** Semantic paths underneath. */
  on: readonly string[];
  floor: number;
  /** Where the pair occurs, for the report. */
  where: string;
}

/** Surfaces that text sits on directly: the page, containers, and the tinted rows and wells. */
const TEXT_SURFACES = [
  "surface.canvas",
  "surface.card",
  "surface.raised",
  "surface.sunken",
  "surface.hover",
  "surface.selected",
] as const;

const FEEDBACK = ["success", "warning", "danger", "info"] as const;

export const PAIR_RULES: readonly PairRule[] = [
  {
    fg: ["text.primary", "text.secondary"],
    on: TEXT_SURFACES,
    floor: TEXT,
    where: "body and secondary text on every surface, including hovered and selected rows",
  },
  {
    fg: ["text.tertiary", "text.placeholder"],
    on: ["surface.canvas", "surface.card"],
    floor: TEXT,
    where: "captions and placeholders on the page and inside controls",
  },
  {
    fg: ["text.link", "text.link-hover", "text.brand"],
    on: ["surface.canvas", "surface.card"],
    floor: TEXT,
    where: "links and the brand word on the page and on cards",
  },
  {
    fg: ["text.on-action"],
    on: ["action.primary", "action.primary-hover", "action.primary-press"],
    floor: TEXT,
    where: "the primary button label in rest, hover and press",
  },
  {
    fg: ["text.on-destructive"],
    on: ["action.destructive", "action.destructive-hover", "action.destructive-press"],
    floor: TEXT,
    where: "the destructive button label in rest, hover and press",
  },
  {
    fg: ["text.on-intent"],
    on: ["action.intent", "action.intent-hover", "action.intent-press"],
    floor: TEXT,
    where: "the Intent Engine action label in rest, hover and press",
  },
  { fg: ["text.on-inverse"], on: ["surface.inverse"], floor: TEXT, where: "tooltips" },
  { fg: ["selection.fg"], on: ["selection.bg"], floor: TEXT, where: "selected text" },
  { fg: ["brand.ink"], on: ["brand.signature"], floor: TEXT, where: "text on the signature" },
  ...FEEDBACK.map((kind) => ({
    fg: [`feedback.${kind}.fg`],
    on: ["surface.canvas", "surface.card", `feedback.${kind}.surface`],
    floor: TEXT,
    where: `${kind} text on the page, on a card and on its own tinted surface`,
  })),
  {
    fg: ["action.primary", "action.destructive"],
    on: ["surface.canvas", "surface.card"],
    floor: UI,
    where: "a filled button at rest against the page and against a card",
  },
  {
    fg: ["border.control", "border.control-hover", "border.strong", "border.error"],
    on: ["surface.canvas", "surface.card"],
    floor: UI,
    where: "the edge of an input or checkbox against the page and against a card",
  },
  {
    fg: ["focus.ring"],
    on: ["surface.canvas", "surface.card", "focus.offset"],
    floor: UI,
    where: "the focus ring against the page, a card and its own offset halo",
  },
];

/**
 * Semantic colour tokens that appear in no pair, each with the reason (DESIGN.md §3.1). A token
 * that only ever sits underneath text (a hover or press background, a tint, a feedback surface)
 * needs no entry: the text on it is the check, and a boundary floor would be the wrong rule.
 */
export const EXEMPT: Readonly<Record<string, string>> = {
  "text.disabled": "disabled text is exempt (WCAG 1.4.3, inactive component)",
  "surface.disabled": "the surface of a disabled control; its text is exempt with it",
  "action.primary-disabled": "a disabled button is exempt (WCAG 1.4.11, inactive component)",
  "surface.scrim": "a translucent overlay; nothing is read on it",
  "border.subtle": "a divider on a surface, not a control boundary; decorative",
  "border.card": "a card edge; the card is identified by its surface and content",
  "border.disabled": "the edge of a disabled control; exempt with it",
  ...Object.fromEntries(
    FEEDBACK.map((kind) => [
      `feedback.${kind}.border`,
      "a decorative edge on a tinted surface; the feedback text carries the state",
    ]),
  ),
};

export interface SemanticPair {
  fg: string;
  bg: string;
  floor: number;
  where: string;
}

/**
 * Every pair to check: the rules above plus any `$extensions.orivilo.contrast` a token declares
 * with a floor. The same fg and bg appear once, at the higher floor.
 */
export function semanticPairs(set: TokenSet): SemanticPair[] {
  const byKey = new Map<string, SemanticPair>();
  const add = (pair: SemanticPair) => {
    const key = `${pair.fg}|${pair.bg}`;
    const seen = byKey.get(key);
    if (!seen || seen.floor < pair.floor) byKey.set(key, pair);
  };
  for (const rule of PAIR_RULES) {
    for (const fg of rule.fg)
      for (const bg of rule.on) add({ fg, bg, floor: rule.floor, where: rule.where });
  }
  for (const token of set.layer("semantic")) {
    if (token.contrast?.floor) {
      add({
        fg: token.path,
        bg: token.contrast.against,
        floor: token.contrast.floor,
        where: "declared in semantic.json",
      });
    }
  }
  return [...byKey.values()];
}

export interface ContrastResult extends SemanticPair {
  profile: string;
  mode: Mode;
  fgValue: string;
  bgValue: string;
  /** null when a value is not a hex colour, which also fails. */
  ratio: number | null;
  pass: boolean;
}

function valueOf(set: TokenSet, path: string, mode: Mode): string {
  const token = set.get("semantic", path);
  if (!token) throw new Error(`contrast pair names ${path}, which is not a semantic token`);
  return String(set.resolve(token, mode).value);
}

/** Computes every pair under every set in both modes. */
export function checkContrast(sets: readonly { id: string; set: TokenSet }[]): ContrastResult[] {
  const out: ContrastResult[] = [];
  for (const { id, set } of sets) {
    for (const mode of MODES) {
      for (const pair of semanticPairs(set)) {
        const fgValue = valueOf(set, pair.fg, mode);
        const bgValue = valueOf(set, pair.bg, mode);
        const ratio = contrastRatio(fgValue, bgValue);
        out.push({
          ...pair,
          profile: id,
          mode,
          fgValue,
          bgValue,
          ratio,
          pass: ratio !== null && ratio >= pair.floor,
        });
      }
    }
  }
  return out;
}

/** Semantic colour tokens that appear in no pair and carry no exemption: must be empty. */
export function unexplainedColours(set: TokenSet): string[] {
  const covered = new Set(semanticPairs(set).flatMap((p) => [p.fg, p.bg]));
  return set
    .layer("semantic")
    .filter((t) => t.type === "color")
    .map((t) => t.path)
    .filter((path) => !covered.has(path) && !(path in EXEMPT));
}

/** Exemptions that name a token the set does not have, or one a pair already covers: must be empty. */
export function staleExemptions(set: TokenSet): string[] {
  const covered = new Set(semanticPairs(set).flatMap((p) => [p.fg, p.bg]));
  return Object.keys(EXEMPT).filter((path) => !set.get("semantic", path) || covered.has(path));
}
