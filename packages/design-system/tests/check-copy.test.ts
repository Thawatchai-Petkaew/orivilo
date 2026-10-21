/**
 * Owner's rule (2026-10-21): no middot (U+00B7) and no em dash (U+2014) in any UI text.
 * Scans component, story, and message sources plus the catalog. Fails with file and line.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.join(import.meta.dirname, "..");
const FORBIDDEN = [
  { char: "\u00B7", name: "a middot" },
  { char: "\u2014", name: "an em dash" },
];

function walk(dir: string, match: (file: string) => boolean): string[] {
  let out: string[] = [];
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name === "node_modules" || dirent.name === "storybook-static") continue;
      out = out.concat(walk(full, match));
    } else if (match(dirent.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("UI copy", () => {
  const files = [
    ...walk(path.join(root, "src"), (f) => /\.(tsx?|css|json|md|mdx)$/.test(f)),
    ...walk(path.join(root, "catalog"), (f) => /\.(ya?ml|md)$/.test(f)),
  ];

  it("contains no middot and no em dash", () => {
    const hits: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const { char, name } of FORBIDDEN) {
          if (line.includes(char)) hits.push(`${path.relative(root, file)}:${i + 1} has ${name}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});
