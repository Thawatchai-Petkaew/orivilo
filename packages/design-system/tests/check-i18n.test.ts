/**
 * The locale rules (spec ORV-39, AGENTS.md design-system rules): every catalog has the same keys
 * with the same placeholders and no empty leaf, and no component carries a Thai string, since
 * copy lives in the catalog. The scan covers comments too; a comment that needs a Thai word
 * names the catalog key instead.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "../src/i18n/locale";
import { messagesFor, placeholdersOf } from "../src/i18n/messages/index";

const root = path.join(import.meta.dirname, "..");
const repo = path.join(root, "..", "..");
const THAI = /[฀-๿]/;

function walk(dir: string, match: (file: string) => boolean): string[] {
  let out: string[] = [];
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name === "node_modules" || dirent.name === ".next") continue;
      out = out.concat(walk(full, match));
    } else if (match(dirent.name)) {
      out.push(full);
    }
  }
  return out;
}

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const at = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(at, value);
    else for (const [k, v] of leaves(value, at)) out.set(k, v);
  }
  return out;
}

describe("locale catalogs", () => {
  const th = leaves(messagesFor("th") as unknown as Tree);

  it("have the same keys in every locale", () => {
    for (const locale of LOCALES) {
      const keys = [...leaves(messagesFor(locale) as unknown as Tree).keys()].sort();
      expect(keys, locale).toEqual([...th.keys()].sort());
    }
  });

  it("have no empty leaf", () => {
    for (const locale of LOCALES) {
      const empty = [...leaves(messagesFor(locale) as unknown as Tree)]
        .filter(([, v]) => v.trim() === "")
        .map(([k]) => `${locale}:${k}`);
      expect(empty).toEqual([]);
    }
  });

  it("spell the same placeholders for every key", () => {
    const problems: string[] = [];
    for (const locale of LOCALES) {
      if (locale === "th") continue;
      for (const [key, value] of leaves(messagesFor(locale) as unknown as Tree)) {
        const want = [...new Set(placeholdersOf(th.get(key) ?? ""))].sort();
        const got = [...new Set(placeholdersOf(value))].sort();
        if (want.join() !== got.join()) {
          problems.push(`${locale}:${key} has {${got.join(", ")}}, th has {${want.join(", ")}}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("keep Thai out of the English catalog", () => {
    const hits = [...leaves(messagesFor("en") as unknown as Tree)]
      .filter(([, v]) => THAI.test(v))
      .map(([k]) => k);
    expect(hits).toEqual([]);
  });
});

describe("UI code", () => {
  // Stories, tests, fixtures, the story shell and the example screens are demo content.
  const demo = /\.(stories|test)\.tsx?$|^fixtures\.ts$|^story-shell\.tsx$/;
  const code = (f: string) => /\.tsx?$/.test(f) && !demo.test(f);
  const files = [
    ...walk(path.join(root, "src", "components"), code),
    ...walk(path.join(root, "src", "boundary"), code),
    path.join(root, "src", "commands", "index.ts"),
    ...walk(path.join(root, "src", "i18n"), (f) => f.endsWith(".tsx")),
    ...walk(path.join(repo, "apps", "web", "app"), code),
  ];

  it("carries no Thai string outside the catalog", () => {
    expect(files.length).toBeGreaterThan(20);
    const hits: string[] = [];
    for (const file of files) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (THAI.test(line)) hits.push(`${path.relative(repo, file)}:${i + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
