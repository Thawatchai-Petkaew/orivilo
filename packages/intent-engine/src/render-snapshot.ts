import { z } from "zod";

/**
 * The build that rendered a page, read from the running browser (ORV-128 tech notes section 7).
 * Slice 1a holds only this; slice 1c adds the snapshot schema and the Renderer port to this file.
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
