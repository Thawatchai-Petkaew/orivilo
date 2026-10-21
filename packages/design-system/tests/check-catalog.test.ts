/**
 * Catalog and Storybook parity (DESIGN.md §11, catalog/README.md).
 * A story in a component tier (base, application, marketing) needs a catalog entry whose `story`
 * field is its id; an entry with status draft or stable needs a story. Foundations stories are
 * documentation, not components, and are exempt. Runs on the file system; Storybook is not needed.
 */
import { readdirSync, readFileSync } from "node:fs";
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
}

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
    return { name: doc.name, tier: doc.tier, status: doc.status, story: doc.story };
  });
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
