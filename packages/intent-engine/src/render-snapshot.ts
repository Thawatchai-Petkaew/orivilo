import { z } from "zod";
import type { ReadResult } from "./read-page";

// The render snapshot of ORV-128 tech notes section 7: what the renderer hands the engine, parsed as
// untrusted data by a strict, bounded schema. It carries no text; the page text comes from the document bytes.

/**
 * The build that rendered a page, read from the running browser (ORV-128 tech notes section 7).
 */
export const rendererBuildSchema = z
  .object({
    driver: z.enum(["playwright", "puppeteer-core"]), // closed; a new driver is a minor schema bump
    driverVersion: z.string().regex(/^\d+\.\d+\.\d+$/), // the exact pinned package version
    browser: z.literal("chromium"),
    browserVersion: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/), // four parts, as the browser reports it
  })
  .strict();
export type RendererBuild = z.infer<typeof rendererBuildSchema>;

/**
 * The bound of a locator `path` and of every element path: a text block's, a text box's (F47). It
 * lives here, not in `evidence.ts`, which imports this module: the other way round, `textBoxSchema`,
 * built when this module loads, would read the constant before `evidence.ts` had set it.
 */
export const PATH_MAX_CHARS = 500;

const VIEWPORT_WIDTH = 1280; // CSS px; the rasters show it at 4 CSS px a raster pixel
const RASTER_WIDTH = 320; // both rasters are downsampled to this width
const RASTER_MAX_HEIGHT = 2000; // the renderer cuts the full page at 2,000 rows
const BOX_MAX_Y = 1_000_000; // CSS px down the page; the renderer clips every box to it (F47)
const FONT_FAMILY_MAX_CHARS = 100; // the bound of a font `family` in a reading's value
const PATH_FORM = /^html(?=>|$)(?![\s\S]*>(?:>|$))[^\t\n\f\r ]*$/; // html, then ">" and a segment with no ">" and no ASCII whitespace

/** RGBA bytes, four per pixel, row by row, from the top left (F46). */
const rasterSchema = (minHeight: number, maxHeight: number) =>
  z
    .object({
      width: z.literal(RASTER_WIDTH),
      height: z.number().int().min(minHeight).max(maxHeight),
      rgba: z.instanceof(Uint8Array), // a Node Buffer is one; a plain array or a Uint8ClampedArray is not
    })
    .strict()
    .refine((r) => r.rgba.length === r.width * r.height * 4, {
      path: ["rgba"],
      message: "the byte length is not width x height x 4",
    });

/** Whole CSS px of the laid-out page, from its top left, clipped by the renderer; width or height 0 is an empty box (F47). */
const boxSchema = z
  .object({
    x: z.int().min(0).max(VIEWPORT_WIDTH),
    y: z.int().min(0).max(BOX_MAX_Y),
    width: z.int().min(0).max(VIEWPORT_WIDTH),
    height: z.int().min(0).max(BOX_MAX_Y),
  })
  .strict()
  .refine((b) => b.x + b.width <= VIEWPORT_WIDTH, {
    path: ["width"],
    message: "the box passes the right edge of the viewport",
  })
  .refine((b) => b.y + b.height <= BOX_MAX_Y, {
    path: ["height"],
    message: "the box passes BOX_MAX_Y",
  });

/** Opaque sRGB as #rrggbb, lowercase, so one colour has one spelling (F47). */
const colourSchema = z.string().regex(/^#[0-9a-f]{6}$/);

/** One visible element that holds text. It carries no text: the text comes from the bytes (F47). */
const textBoxSchema = z
  .object({
    path: z.string().min(1).max(PATH_MAX_CHARS).regex(PATH_FORM), // a path that names no element is dropped later
    box: boxSchema,
    pair: z
      .object({ color: colourSchema, backdrop: colourSchema }) // both composited to opaque by the renderer
      .strict()
      .nullable(), // null: the text does not sit on one flat colour (a gradient)
    fontFamily: z.string().min(1).max(FONT_FAMILY_MAX_CHARS), // the first family of the computed list, as the browser writes it
  })
  .strict();

export const renderSnapshotSchema = z
  .object({
    version: z.literal("1"),
    renderer: rendererBuildSchema,
    viewport: z.object({ width: z.literal(VIEWPORT_WIDTH), height: z.literal(800) }).strict(),
    firstScreen: rasterSchema(200, 200), // 320 x 200
    fullPage: rasterSchema(1, RASTER_MAX_HEIGHT), // 320 wide, 1 to 2,000 high
    textBoxes: z
      .array(textBoxSchema)
      .max(5000) // each visible element that holds text
      .refine((t) => new Set(t.map((b) => b.path)).size === t.length, {
        message: "a path is listed twice",
      }),
    elements: z.array(boxSchema).max(5000), // visible element boxes, for element density
  })
  .strict();
export type RenderSnapshot = z.infer<typeof renderSnapshotSchema>;

/** The port a renderer fills (ADR 0019 decision 1): the engine defines it and never imports an implementation. */
export type Renderer = { render(read: ReadResult & { status: "read" }): Promise<unknown> };
