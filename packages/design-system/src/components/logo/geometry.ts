/**
 * The Logo's geometry and sizing (ORV-118, rules `logo-geometry-1` and `logo-size-1`). Every number
 * of the three brand files in `docs/context/brand/assets/` lives here as typed data, so one drawing
 * function can serve the component and the generated files. `logo.test.ts` parses the brand files
 * and fails when a number differs. Colour is not here: the tokens own it (`logo-colour-1`).
 *
 * This module imports nothing. Stroke widths, radii and positions are drawing geometry that no
 * profile may change, so they are constants and not tokens.
 */

export type LogoKind = "mark" | "wordmark" | "horizontal" | "stacked";

/** The ring's stroke form (`logo-size-1`): 16 and 24 are the small forms, `master` is the rest. */
export type LogoForm = "16" | "24" | "master";

export type Point = readonly [x: number, y: number];

/** `[x, y, width, height]`, as the `viewBox` attribute reads. */
export type ViewBox = readonly [x: number, y: number, width: number, height: number];

export interface CircleShape {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

/** One stroked shape of the wordmark, in the order the brand file draws them. */
export type StrokeShape =
  ({ readonly shape: "circle" } & CircleShape) | { readonly shape: "path"; readonly d: string };

export interface Geometry {
  readonly mark: {
    readonly viewBox: ViewBox;
    /** The open ring: an arc of `radius` around `centre`, from `start` to `end`, round caps. */
    readonly ring: {
      readonly d: string;
      readonly centre: Point;
      readonly radius: number;
      readonly start: Point;
      readonly end: Point;
      readonly cap: "round";
    };
    readonly dot: CircleShape;
  };
  readonly wordmark: {
    readonly viewBox: ViewBox;
    /** Baseline y of the lettering, in wordmark units. */
    readonly baseline: number;
    readonly strokes: {
      readonly width: number;
      readonly cap: "butt";
      readonly join: "round";
      /** The two `o`, the `r`, both `i` stems and the `l`. */
      readonly shapes: readonly StrokeShape[];
    };
    readonly fills: {
      /** The `v`. */
      readonly polygon: readonly Point[];
      /** The two i-dots. */
      readonly dots: readonly CircleShape[];
    };
  };
  readonly horizontal: {
    readonly viewBox: ViewBox;
    /** The wordmark's translate; the mark sits at the origin. */
    readonly wordmarkAt: Point;
  };
  readonly stacked: {
    readonly viewBox: ViewBox;
    readonly markAt: Point;
    readonly wordmarkAt: Point;
  };
}

export const GEOMETRY: Geometry = {
  mark: {
    viewBox: [0, 0, 150, 150],
    ring: {
      d: "M 57.04 28.17 A 52.5 52.5 0 1 0 127.5 77.5",
      centre: [75, 77.5],
      radius: 52.5,
      start: [57.04, 28.17],
      end: [127.5, 77.5],
      cap: "round",
    },
    /** The dot, one size in every form (`DOT_RADIUS`). */
    dot: { cx: 105.11, cy: 34.49, r: 19 },
  },
  wordmark: {
    viewBox: [0, -45, 473, 150],
    baseline: 100,
    strokes: {
      width: 24,
      cap: "butt",
      join: "round",
      shapes: [
        { shape: "circle", cx: 52, cy: 50, r: 40 },
        { shape: "path", d: "M 125 100 L 125 42 A 30 30 0 0 1 155 12 L 164 12" },
        { shape: "path", d: "M 182 100 L 182 0" },
        { shape: "path", d: "M 310 100 L 310 0" },
        { shape: "path", d: "M 344 100 L 344 -37" },
        { shape: "circle", cx: 420.5, cy: 50, r: 40 },
      ],
    },
    fills: {
      polygon: [
        [198, 0],
        [224, 0],
        [246, 58],
        [268, 0],
        [294, 0],
        [256, 100],
        [236, 100],
      ],
      dots: [
        { cx: 182, cy: -25, r: 15 },
        { cx: 310, cy: -25, r: 15 },
      ],
    },
  },
  horizontal: {
    viewBox: [0, 0, 663, 150],
    wordmarkAt: [190, 45],
  },
  stacked: {
    viewBox: [0, 0, 473, 375],
    markAt: [161.5, 0],
    wordmarkAt: [0, 270],
  },
};

/** The smallest `height` each kind renders at (`logo-size-1`). */
export const MINIMUM: Readonly<Record<LogoKind, number>> = {
  mark: 16,
  wordmark: 20,
  horizontal: 20,
  stacked: 50,
};

/** The height a `height` that is not a finite number falls back to. */
export const DEFAULT_HEIGHT = 24;

/** The ring's stroke width per form, in drawing units. */
export const RING_STROKE: Readonly<Record<LogoForm, number>> = {
  "16": 34,
  "24": 32,
  master: 30,
};

/** The dot's radius per form: one dot in every form, 0.63 x the master stroke (ORV-192 row 5). */
export const DOT_RADIUS: Readonly<Record<LogoForm, number>> = {
  "16": 19,
  "24": 19,
  master: 19,
};

export interface LogoSize {
  /** Rendered height in CSS px, never below the kind's minimum. */
  readonly height: number;
  /** Rendered width in CSS px, from the `viewBox` ratio. */
  readonly width: number;
  /** The mark's rendered height in CSS px; a wordmark has no mark. */
  readonly markHeight: number | null;
  readonly form: LogoForm;
}

export const round2 = (x: number): number => Math.round(x * 100) / 100;

/** The ring form for a mark height: below 20 is 16, 20 to 24 is 24, above 24 is the master. */
export function formOf(markHeight: number): LogoForm {
  if (markHeight < 20) return "16";
  if (markHeight <= 24) return "24";
  return "master";
}

/**
 * Height, width, mark height and form for a kind asked at `height` (`logo-size-1`). A `height` that
 * is not a finite number counts as 24, then the kind's minimum applies. The form comes from the
 * height after rounding, so the markup's `height` and its form always agree. A wordmark has no ring,
 * so its form is `master`.
 */
export function logoSize(kind: LogoKind, height: number): LogoSize {
  const h = round2(Math.max(MINIMUM[kind], Number.isFinite(height) ? height : DEFAULT_HEIGHT));
  const [, , viewBoxWidth, viewBoxHeight] = GEOMETRY[kind].viewBox;
  const width = round2((h * viewBoxWidth) / viewBoxHeight);
  if (kind === "wordmark") return { height: h, width, markHeight: null, form: "master" };
  const markHeight = kind === "stacked" ? (h * GEOMETRY.mark.viewBox[3]) / viewBoxHeight : h;
  return { height: h, width, markHeight, form: formOf(markHeight) };
}
