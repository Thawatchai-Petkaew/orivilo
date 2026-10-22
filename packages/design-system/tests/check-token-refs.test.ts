/**
 * Every `var(--cmp-*)` and `var(--ds-*)` the source reads must be a token something defines.
 * A renamed token otherwise falls back to nothing and a component silently loses its padding
 * or type size (the spec sheet lost its button padding this way after E2-4). References built
 * from a template string (`--cmp-button-${name}-bg`) are skipped; their variants are listed tokens.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const src = path.join(import.meta.dirname, "..", "src");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) return walk(full);
    return /\.(tsx?|css)$/.test(dirent.name) ? [full] : [];
  });
}

const files = walk(src).map((file) => ({ file, text: readFileSync(file, "utf8") }));
const REF = /var\((--(?:cmp|ds)-[a-z0-9-]*[a-z0-9])(?![a-z0-9-]|\$)/g;
const DEF = /(--(?:cmp|ds)-[a-z0-9-]*[a-z0-9])"?\s*:/g;

describe("token references", () => {
  const defined = new Set(files.flatMap(({ text }) => [...text.matchAll(DEF)].map((m) => m[1])));

  it("finds the token definitions", () => {
    expect(defined.size).toBeGreaterThan(300);
  });

  it("only reads tokens that exist", () => {
    const missing: string[] = [];
    for (const { file, text } of files) {
      text.split("\n").forEach((line, i) => {
        for (const match of line.matchAll(REF)) {
          if (!defined.has(match[1] as string)) {
            missing.push(`${path.relative(src, file)}:${i + 1} reads ${match[1]}`);
          }
        }
      });
    }
    expect(missing).toEqual([]);
  });
});
