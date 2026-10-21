/**
 * Catalog and Storybook parity (DESIGN.md §11, catalog/README.md).
 * A story in a component tier (base, application, marketing) needs a catalog entry whose `story`
 * field is its id; an entry with status draft or stable needs a story. Foundations stories are
 * documentation, not components, and are exempt. `catalog/commands/` is the command registry, checked
 * by check-commands. Page examples (E2-7): every `examples` path in an entry exists, every page
 * example row in coverage.md with status draft or stable names a story that resolves, and every
 * story under src/examples/ is titled `Examples/`. Runs on the file system; Storybook is not needed.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

const root = path.join(import.meta.dirname, "..");
const TIERS = ["base", "application", "marketing"] as const;

interface Entry {
  name: string;
  tier: string;
  status: "planned" | "draft" | "stable" | "deprecated";
  story: string;
  file: string;
  examples: string[];
}

interface PageExample {
  name: string;
  tier: string;
  status: string;
  story: string;
}

function walk(dir: string, match: (file: string) => boolean): string[] {
  let out: string[] = [];
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (["node_modules", "storybook-static", "commands"].includes(dirent.name)) continue;
      out = out.concat(walk(full, match));
    } else if (match(dirent.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Storybook's id for a title: lowercase, non-alphanumerics to dashes, `/` to `-`. */
function storyId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/\//g, "-")
    .replace(/^-+|-+$/g, "");
}

function readEntries(): Entry[] {
  const files = walk(path.join(root, "catalog"), (f) => f.endsWith(".yaml") && !f.startsWith("_"));
  return files.map((file) => {
    const doc = load(readFileSync(file, "utf8")) as Partial<Entry>;
    if (!doc.name || !doc.tier || !doc.status || !doc.story) {
      throw new Error(`${path.relative(root, file)}: needs name, tier, status, story`);
    }
    const examples = Array.isArray(doc.examples) ? doc.examples : [];
    if (examples.some((e) => typeof e !== "string")) {
      throw new Error(`${path.relative(root, file)}: examples must be paths`);
    }
    return {
      name: doc.name,
      tier: doc.tier,
      status: doc.status,
      story: doc.story,
      file: path.relative(root, file),
      examples,
    };
  });
}

/** The rows of the "Page examples" table in coverage.md: name, tier, status, story id. */
function readPageExamples(): PageExample[] {
  const text = readFileSync(path.join(root, "catalog", "coverage.md"), "utf8");
  const section = text.split(/^## /m).find((part) => part.startsWith("Page examples"));
  if (!section) throw new Error("catalog/coverage.md has no '## Page examples' section");
  return section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 5 && cells[1] !== "Example" && !/^-+$/.test(cells[1] ?? ""))
    .map((cells) => ({
      name: cells[1] ?? "",
      tier: cells[2] ?? "",
      status: cells[3] ?? "",
      story: cells[4] ?? "",
    }));
}

function readStoryTitles(): { file: string; title: string }[] {
  const files = walk(path.join(root, "src"), (f) => /\.stories\.tsx?$/.test(f));
  return files.map((file) => {
    const source = readFileSync(file, "utf8");
    const match = /title:\s*["'`]([^"'`]+)["'`]/.exec(source);
    if (!match?.[1]) throw new Error(`${path.relative(root, file)}: story file has no title`);
    return { file: path.relative(root, file), title: match[1] };
  });
}

describe("catalog and stories agree", () => {
  const entries = readEntries();
  const stories = readStoryTitles();
  const storyIds = new Set(stories.map((s) => storyId(s.title)));
  const entryIds = new Set(entries.map((e) => e.story));

  it("every component-tier story has a catalog entry", () => {
    const orphans = stories
      .filter((s) => TIERS.some((tier) => s.title.toLowerCase().startsWith(`${tier}/`)))
      .filter((s) => !entryIds.has(storyId(s.title)))
      .map((s) => `${s.file} (title "${s.title}", id ${storyId(s.title)})`);
    expect(orphans, "stories without a catalog entry").toEqual([]);
  });

  it("every draft or stable entry has a story", () => {
    const missing = entries
      .filter((e) => e.status === "draft" || e.status === "stable")
      .filter((e) => !storyIds.has(e.story))
      .map((e) => `${e.tier}/${e.name} (story ${e.story})`);
    expect(missing, "draft or stable entries without a story").toEqual([]);
  });

  it("entry story ids follow <tier>-<name> and sit in their tier directory", () => {
    const wrong = entries
      .filter(
        (e) =>
          !TIERS.includes(e.tier as (typeof TIERS)[number]) || !e.story.startsWith(`${e.tier}-`),
      )
      .map((e) => `${e.tier}/${e.name} (story ${e.story})`);
    expect(wrong).toEqual([]);
  });
});

describe("page examples (E2-7)", () => {
  const entries = readEntries();
  const stories = readStoryTitles();
  const storyIds = new Set(stories.map((s) => storyId(s.title)));
  const pages = readPageExamples();

  it("every examples path in a catalog entry exists", () => {
    const missing = entries
      .flatMap((e) => e.examples.map((p) => ({ entry: e.file, path: p })))
      .filter(({ path: p }) => !existsSync(path.join(root, p)))
      .map(({ entry, path: p }) => `${entry} lists ${p}`);
    expect(missing, "catalog examples that do not exist").toEqual([]);
  });

  it("coverage.md lists at least one page example per component tier", () => {
    const tiers = new Set(pages.map((p) => p.tier));
    expect([...TIERS].filter((t) => !tiers.has(t))).toEqual([]);
  });

  it("every draft or stable page example in coverage.md has a story", () => {
    const missing = pages
      .filter((p) => p.status === "draft" || p.status === "stable")
      .filter((p) => !storyIds.has(p.story))
      .map((p) => `${p.name} (${p.tier}, story ${p.story})`);
    expect(missing, "page example rows without a story").toEqual([]);
  });

  it("stories under src/examples/ are titled Examples/ and nothing else is", () => {
    const wrong = stories
      .filter(
        (s) => s.file.startsWith("src/examples/") !== s.title.toLowerCase().startsWith("examples/"),
      )
      .map((s) => `${s.file} (title "${s.title}")`);
    expect(wrong).toEqual([]);
  });
});
