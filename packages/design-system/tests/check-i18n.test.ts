/**
 * The locale rules (spec ORV-39, AGENTS.md design-system rules): every catalog has the same keys
 * with the same placeholders and no empty leaf, and no component carries a Thai string, since
 * copy lives in the catalog. The scan covers comments too; a comment that needs a Thai word
 * names the catalog key instead.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  // In src/examples only (orv293-exempt-1): a file is data, and not scanned, when its base name ends
  // in -fixtures.ts, .fixtures.ts or .data.ts, or is exactly business-story-helpers.tsx. The match is
  // anchored at the end and takes .ts only, so a view (.tsx) is never data by its name.
  const EXAMPLE_DATA_FILE = /[-.]fixtures\.ts$|\.data\.ts$|^business-story-helpers\.tsx$/;
  // The known-debt list (orv293-debt-1): older screens in src/examples that still hold Thai strings
  // until ORV-294 moves them to the locale catalog. It can only shrink.
  const KNOWN_DEBT = [
    "workspace.tsx",
    "members.tsx",
    "decision-log.tsx",
    "settings-form.tsx",
    "landing.tsx",
  ];
  const examples = path.join(root, "src", "examples");
  const files = [
    ...walk(path.join(root, "src", "components"), code),
    ...walk(path.join(root, "src", "boundary"), code),
    path.join(root, "src", "commands", "index.ts"),
    ...walk(path.join(root, "src", "i18n"), (f) => f.endsWith(".tsx")),
    ...walk(path.join(repo, "apps", "web", "app"), code),
    ...walk(examples, (f) => code(f) && !EXAMPLE_DATA_FILE.test(f)).filter(
      (file) => !KNOWN_DEBT.includes(path.relative(examples, file)),
    ),
  ];

  // The scan reads lines, so it catches Thai in a string literal, a template literal, JSX text and
  // a comment alike. A hit is `<path from the repo root>:<line>`.
  it("carries no Thai string outside the catalog", () => {
    expect(files.length).toBeGreaterThan(20);
    const scanned = files.map((file) => path.relative(repo, file));
    for (const name of ["business-node-view.tsx", "brand-report.tsx", "orivilo-canvas.tsx"]) {
      expect(scanned, name).toContain(
        path.join("packages", "design-system", "src", "examples", name),
      );
    }
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

  it("exempts data files by their exact names only", () => {
    const names = [
      "brand-report.fixtures.ts",
      "brand-report.tsx",
      "business-fixtures.ts",
      "business-fixtures.test.ts",
      "business-node-view.tsx",
      "business-story-helpers.tsx",
      "orivilo-canvas.data.ts",
      "orivilo-canvas.tsx",
      "workspace.tsx",
      "business-fixtures.tsx",
      "metadata.ts",
      "prefixtures.ts",
      "orivilo-canvas.data.tsx",
      "my-business-story-helpers.tsx",
    ];
    expect(names.filter((n) => !demo.test(n) && EXAMPLE_DATA_FILE.test(n))).toEqual([
      "brand-report.fixtures.ts",
      "business-fixtures.ts",
      "business-story-helpers.tsx",
      "orivilo-canvas.data.ts",
    ]);
  });

  it("keeps the known-debt list to files that still hold Thai", () => {
    const problems: string[] = [];
    for (const name of KNOWN_DEBT) {
      const file = path.join(examples, name);
      const shown = path.relative(repo, file);
      if (!existsSync(file)) {
        problems.push(`${shown}: on the known-debt list with no file`);
      } else if (
        !readFileSync(file, "utf8")
          .split("\n")
          .some((line) => THAI.test(line))
      ) {
        problems.push(`${shown}: on the known-debt list with no Thai line`);
      }
    }
    expect(problems).toEqual([]);
    expect(KNOWN_DEBT).toEqual([
      "workspace.tsx",
      "members.tsx",
      "decision-log.tsx",
      "settings-form.tsx",
      "landing.tsx",
    ]);
  });
});
