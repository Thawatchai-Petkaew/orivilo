/**
 * The Logo's one drawing function (ORV-118, `logo-geometry-1`, tech.md section 5). It builds the
 * `<svg>` element tree from `geometry.ts` with `createElement` and no hooks, so the component and
 * the generated files render the same markup and cannot drift. The markup carries no colour: no
 * `stroke`, no `style` and no `fill` other than `none`. The recipe `.ds-logo` paints it from the
 * `logo.*` tokens. Explicit `.ts` import paths and no JSX, so `node scripts/*.ts` can load it.
 */
import { createElement, type ReactElement } from "react";
import { cx } from "../cx.ts";
import {
  GEOMETRY,
  RING_STROKE,
  type Geometry,
  type LogoForm,
  type LogoKind,
  logoSize,
} from "./geometry.ts";

export type LogoTone = "full" | "one-colour";

export interface LogoDrawing {
  kind: LogoKind;
  height: number;
  tone: LogoTone;
  /** The accessible name. Leave it out for a decorative image: it is then hidden from assistive tech. */
  name?: string | undefined;
  className?: string | undefined;
}

const num = (x: number): string => String(x);
const translate = ([x, y]: readonly [number, number]): string => `translate(${x} ${y})`;

function markParts(geometry: Geometry, form: LogoForm): ReactElement[] {
  const { ring, dot } = geometry.mark;
  return [
    createElement("path", {
      key: "ring",
      className: "ds-logo__ring",
      d: ring.d,
      fill: "none",
      strokeWidth: RING_STROKE[form],
      strokeLinecap: ring.cap,
    }),
    createElement("circle", {
      key: "dot",
      className: "ds-logo__dot",
      cx: dot.cx,
      cy: dot.cy,
      r: dot.r,
    }),
  ];
}

function wordmarkParts(geometry: Geometry): ReactElement[] {
  const { strokes, fills } = geometry.wordmark;
  return [
    createElement(
      "g",
      {
        key: "strokes",
        className: "ds-logo__strokes",
        fill: "none",
        strokeWidth: strokes.width,
        strokeLinecap: strokes.cap,
        strokeLinejoin: strokes.join,
      },
      strokes.shapes.map((shape, i) =>
        shape.shape === "circle"
          ? createElement("circle", { key: i, cx: shape.cx, cy: shape.cy, r: shape.r })
          : createElement("path", { key: i, d: shape.d }),
      ),
    ),
    createElement(
      "g",
      { key: "fills", className: "ds-logo__fills" },
      createElement("polygon", {
        key: "v",
        points: fills.polygon.map(([x, y]) => `${x},${y}`).join(" "),
      }),
      ...fills.dots.map((d, i) => createElement("circle", { key: i, cx: d.cx, cy: d.cy, r: d.r })),
    ),
  ];
}

/** The `<svg>` of one logo kind at one height, in the form the height calls for (`logo-size-1`). */
export function logoSvg(
  { kind, height, tone, name, className }: LogoDrawing,
  geometry: Geometry = GEOMETRY,
): ReactElement {
  const size = logoSize(kind, height);
  const placed = (at: readonly [number, number], parts: ReactElement[], key: string) =>
    createElement("g", { key, transform: translate(at) }, ...parts);
  let parts: ReactElement[];
  if (kind === "mark") parts = markParts(geometry, size.form);
  else if (kind === "wordmark") parts = wordmarkParts(geometry);
  else if (kind === "horizontal")
    parts = [
      ...markParts(geometry, size.form),
      placed(geometry.horizontal.wordmarkAt, wordmarkParts(geometry), "wordmark"),
    ];
  else
    parts = [
      placed(geometry.stacked.markAt, markParts(geometry, size.form), "mark"),
      placed(geometry.stacked.wordmarkAt, wordmarkParts(geometry), "wordmark"),
    ];
  const a11y = name === undefined ? { "aria-hidden": "true" } : { role: "img", "aria-label": name };
  return createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      className: cx("ds-logo", className),
      "data-kind": kind,
      "data-form": size.form,
      "data-tone": tone,
      viewBox: geometry[kind].viewBox.map(num).join(" "),
      width: size.width,
      height: size.height,
      ...a11y,
    },
    ...parts,
  );
}
