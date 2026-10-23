import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { isEntry } from "./migrate.ts";

// ORV-73: `pnpm --filter @orivilo/db migrate` did nothing from a path with a space, because the
// entry check compared the URL-encoded module URL with the raw argv path.
describe("isEntry", () => {
  const script = "/Users/someone/My Work/orivilo/packages/db/src/migrate.ts";
  const url = pathToFileURL(script).href;

  it("matches the started script when its path holds a space", () => {
    expect(url).toContain("%20");
    expect(isEntry(url, script)).toBe(true);
  });

  it("matches a relative argv, the form the pnpm script passes", () => {
    const here = new URL("./migrate.ts", import.meta.url);
    const relative = path.relative(process.cwd(), fileURLToPath(here));
    expect(path.isAbsolute(relative)).toBe(false);
    expect(isEntry(here.href, relative)).toBe(true);
  });

  it("does not match another script or a missing argv", () => {
    expect(isEntry(url, "/Users/someone/My Work/orivilo/packages/db/src/seed.ts")).toBe(false);
    expect(isEntry(url, undefined)).toBe(false);
  });
});
