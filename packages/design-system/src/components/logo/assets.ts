/**
 * The Logo's generated files (ORV-118 slice B, rules `logo-icon-1` and `logo-asset-1`, tech.md
 * section 5): the favicon SVG, the two app icon PNGs and the Storybook brand image. They come from
 * `drawing.ts` (the function the component renders with) and the token source, never by hand;
 * `pnpm --filter @orivilo/design-system logo-assets` writes them and `assets.test.ts` fails when a
 * committed file differs from a fresh render. Pure apart from the wasm start: no clock and no
 * randomness, numbers printed with at most two decimals, LF line ends. Explicit `.ts` import paths and
 * no JSX, so `node scripts/*.ts` loads it. Build-time only: nothing at runtime imports it.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { cloneElement, createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { tokens, type Mode, type TokenSet } from "../../tokens/index.ts";
import { logoSvg } from "./drawing.ts";
import { GEOMETRY, round2, type Geometry } from "./geometry.ts";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../..");

export interface LogoAssetFile {
  /** From the repo root, with forward slashes. */
  path: string;
  bytes: Uint8Array;
}

const FAVICON = "apps/web/app/icon1.svg";
const ICON_32 = "apps/web/app/icon2.png";
const ICON_180 = "apps/web/app/apple-icon.png";
const STORYBOOK = "packages/design-system/.storybook/static/orivilo-logo.svg";

type Layer = "semantic" | "component";

/** A colour token resolved for a mode; a missing or non-colour token throws with its path. */
function colour(set: TokenSet, layer: Layer, name: string, mode: Mode): string {
  const token = set.get(layer, name);
  if (!token) throw new Error(`Logo assets: ${layer} token "${name}" is missing`);
  if (token.type !== "color")
    throw new Error(`Logo assets: ${layer} token "${name}" is not a colour`);
  const value = set.resolve(token, mode).value;
  if (typeof value !== "string")
    throw new Error(`Logo assets: "${name}" does not resolve to a colour`);
  return value;
}

/** The recipe's colour rules, as a CSS string: ink for the lines, one colour for the dot. */
const inkAndDot = (ink: string, dot: string): string =>
  `.ds-logo__ring,.ds-logo__strokes{stroke:${ink}}.ds-logo__fills{fill:${ink}}.ds-logo__dot{fill:${dot}}`;

/** Inserts a `<style>` element right after the opening `<svg>` tag and ends the file with a line feed. */
function withStyle(markup: string, css: string): string {
  const at = markup.indexOf(">") + 1;
  return `${markup.slice(0, at)}<style>${css}</style>${markup.slice(at)}\n`;
}

const staticSvg = (element: ReactElement): string => renderToStaticMarkup(element);

/** The favicon: the mark in form 16, light colours, then the dark ones inside the media block. */
function faviconSvg(set: TokenSet, geometry: Geometry): string {
  const mark = logoSvg({ kind: "mark", height: 16, tone: "full" }, geometry);
  const light = inkAndDot(
    colour(set, "component", "logo.ink", "light"),
    colour(set, "component", "logo.dot-small", "light"),
  );
  const dark = inkAndDot(
    colour(set, "component", "logo.ink", "dark"),
    colour(set, "component", "logo.dot-small", "dark"),
  );
  return withStyle(staticSvg(mark), `${light}@media (prefers-color-scheme:dark){${dark}}`);
}

/**
 * The app icon at `side` px: a rounded ground, the mark box 2/3 of the side centred in it. The mark
 * is the drawing function's own svg placed with `x` and `y`, so its form follows the box height
 * (24 at 32 px, master at 180 px). `dotToken` is the semantic token whose dark value the form picks.
 */
function appIconSvg(set: TokenSet, geometry: Geometry, side: number, dotToken: string): string {
  const box = round2((side * 2) / 3);
  const offset = round2((side - box) / 2);
  const mark = logoSvg({ kind: "mark", height: box, tone: "full" }, geometry);
  const ground = createElement("rect", {
    className: "ds-icon__ground",
    width: side,
    height: side,
    rx: round2((side * 22) / 96),
  });
  const root = createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: side,
      height: side,
      viewBox: `0 0 ${side} ${side}`,
    },
    ground,
    cloneElement(mark as ReactElement<{ x: number; y: number }>, { x: offset, y: offset }),
  );
  const css =
    `.ds-icon__ground{fill:${colour(set, "semantic", "surface.inverse", "light")}}` +
    inkAndDot(
      colour(set, "semantic", "text.on-inverse", "light"),
      colour(set, "semantic", dotToken, "dark"),
    );
  return withStyle(staticSvg(root), css);
}

/** The Storybook brand image: the horizontal lockup at height 24, light colours. */
function storybookSvg(set: TokenSet, geometry: Geometry): string {
  const lockup = logoSvg({ kind: "horizontal", height: 24, tone: "full" }, geometry);
  return withStyle(
    staticSvg(lockup),
    inkAndDot(
      colour(set, "component", "logo.ink", "light"),
      colour(set, "component", "logo.dot-small", "light"),
    ),
  );
}

let wasmReady: Promise<void> | undefined;
/** Starts the rasteriser once per process, from the `.wasm` file the package ships. */
function startRasteriser(): Promise<void> {
  wasmReady ??= initWasm(
    readFileSync(createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm")),
  );
  return wasmReady;
}

/** The SVG as PNG bytes at its own size. The drawing has no text, so no font is loaded. */
function png(svg: string): Uint8Array {
  return new Resvg(svg, { fitTo: { mode: "original" } }).render().asPng();
}

const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text);

/** The four generated files, in a fixed order, rendered in memory from the token set and geometry. */
export async function logoAssetFiles(
  set: TokenSet = tokens,
  geometry: Geometry = GEOMETRY,
): Promise<LogoAssetFile[]> {
  await startRasteriser();
  return [
    { path: FAVICON, bytes: utf8(faviconSvg(set, geometry)) },
    { path: ICON_32, bytes: png(appIconSvg(set, geometry, 32, "brand.dot-small")) },
    { path: ICON_180, bytes: png(appIconSvg(set, geometry, 180, "brand.signature")) },
    { path: STORYBOOK, bytes: utf8(storybookSvg(set, geometry)) },
  ];
}

/** The paths whose committed bytes differ from the fresh ones, or are missing. */
export function staleAssets(
  files: readonly LogoAssetFile[],
  readCommitted: (path: string) => Uint8Array | undefined,
): string[] {
  return files
    .filter((file) => {
      const committed = readCommitted(file.path);
      return committed === undefined || !Buffer.from(committed).equals(Buffer.from(file.bytes));
    })
    .map((file) => file.path);
}
