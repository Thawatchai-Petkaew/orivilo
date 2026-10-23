#!/usr/bin/env node
// Checks the knowledge base (docs/knowledge) and the lessons (docs/lessons) against their rules,
// and that every K-NNNN cited in docs/adr, docs/specs, docs/plans, docs/lessons, docs/context,
// .claude/rules, .claude/agents, .claude/skills or AGENTS.md exists and has confidence 0.7 or more.
// Node stdlib only.
// Exit 0 when clean; otherwise exit 1 and print each problem as `path: message`.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const K_FIELDS = [
  "id",
  "topic",
  "claim",
  "source",
  "retrieved",
  "confidence",
  "applies_to",
  "license",
];
const L_FIELDS = ["id", "date", "issue", "what_happened", "cause", "rule"];
const ADR_MIN_CONFIDENCE = 0.7;
const CONFIDENCE_FORMAT = /^(0(\.\d+)?|1(\.0+)?)$/;
// Used only when docs/knowledge/README.md has no readable license row. Mirrors that README's list.
const FALLBACK_LICENSES = ["internal", "own-words", "link-only", "MIT", "CC-BY-4.0", "CC0-1.0"];

/** Reads the allowed licenses from the `license` row of the field table in docs/knowledge/README.md. */
function readLicenses(root) {
  const path = join(root, "docs/knowledge/README.md");
  if (!existsSync(path)) return FALLBACK_LICENSES;
  const row = readFileSync(path, "utf8")
    .split("\n")
    .find((line) => /^\|\s*`license`\s*\|/.test(line));
  const cell = row?.split("|")[2] ?? "";
  const found = [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  return found.length > 0 ? found : FALLBACK_LICENSES;
}

function splitList(text) {
  const items = [];
  let current = "";
  let quote = null;
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ",") {
      items.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim() !== "" || items.length > 0) items.push(current.trim());
  return items.filter((item) => item !== "");
}

function parseValue(raw, keepRaw) {
  const value = raw.trim();
  if (keepRaw) return value;
  if (value.startsWith("[") && value.endsWith("]")) return splitList(value.slice(1, -1));
  const quoted = value.match(/^(["'])(.*)\1$/);
  return quoted ? quoted[2] : value;
}

/** Parses the simple YAML subset: `key: value`, `key: [a, b]`, quoted strings. Null without frontmatter. */
export function parseFrontmatter(text, keepRaw = false) {
  const match = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z_][\w-]*):(.*)$/);
    if (pair) data[pair[1]] = parseValue(pair[2], keepRaw);
  }
  return data;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function isRealDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isPresent(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim() !== "";
}

/** The latest calendar date anywhere on Earth (UTC+14) at `now`. A later date is in the future. */
function latestDate(now) {
  return new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Hyphen-like characters: ASCII "-" plus U+2010 to U+2013.
const K_CITATION = /\bk[-\u2010-\u2013]\d{4}\b/gi;

/** Returns a list of `path: message` problems for the repo at `root`. */
export function checkKnowledge(root, now = new Date()) {
  const problems = [];
  const today = latestDate(now);
  const rel = (path) => relative(root, path).split("\\").join("/");
  const report = (path, message) => problems.push(`${rel(path)}: ${message}`);

  function loadEntries(dir, prefix, fields) {
    const entries = new Map();
    for (const path of walk(dir)) {
      const name = path.slice(path.lastIndexOf("/") + 1);
      if (name === "README.md" || name.startsWith(".")) continue;
      if (!name.endsWith(".md")) {
        report(path, "only .md files belong here; this file is not checked");
        continue;
      }
      const nameMatch = name.match(new RegExp(`^(${prefix}-\\d{4})-[a-z0-9-]+\\.md$`));
      if (!nameMatch) {
        report(path, `malformed file name ${name}; expected ${prefix}-NNNN-kebab-slug.md`);
        continue;
      }
      const text = readFileSync(path, "utf8");
      const data = parseFrontmatter(text);
      if (!data) {
        report(path, "missing frontmatter");
        continue;
      }
      for (const field of fields) {
        if (!isPresent(data[field])) report(path, `missing or empty field ${field}`);
      }
      if (isPresent(data.id)) {
        if (data.id !== nameMatch[1]) {
          report(path, `id ${data.id} does not match filename prefix ${nameMatch[1]}`);
        }
        if (entries.has(data.id)) {
          report(path, `duplicate id ${data.id} (also in ${rel(entries.get(data.id).path)})`);
        } else entries.set(data.id, { path, data, raw: parseFrontmatter(text, true) });
      }
      if (prefix === "L" && isPresent(data.date)) {
        if (!isRealDate(data.date)) {
          report(path, `date ${data.date} is not a valid YYYY-MM-DD date`);
        } else if (data.date > today) {
          report(path, `date ${data.date} is in the future (latest date on Earth is ${today})`);
        }
      }
      if (prefix === "K" && dirname(path) === dir) {
        report(path, "must sit in a topic folder below docs/knowledge");
      }
    }
    return entries;
  }

  const entries = loadEntries(join(root, "docs/knowledge"), "K", K_FIELDS);
  loadEntries(join(root, "docs/lessons"), "L", L_FIELDS);

  const licenses = readLicenses(root);
  for (const { path, data, raw } of entries.values()) {
    if (isPresent(data.retrieved)) {
      if (!isRealDate(data.retrieved)) {
        report(path, `retrieved ${data.retrieved} is not a valid YYYY-MM-DD date`);
      } else if (data.retrieved > today) {
        report(
          path,
          `retrieved ${data.retrieved} is in the future (latest date on Earth is ${today})`,
        );
      }
    }
    if (isPresent(raw.confidence) && !CONFIDENCE_FORMAT.test(raw.confidence)) {
      report(
        path,
        `confidence ${raw.confidence} is not a bare number from 0 to 1 (no quotes, no list)`,
      );
    }
    const folder = dirname(path).split(/[\\/]/).pop();
    if (isPresent(data.topic) && data.topic !== folder) {
      report(path, `topic ${data.topic} does not match its folder ${folder}`);
    }
    if (isPresent(data.license) && !licenses.includes(data.license)) {
      report(path, `license ${data.license} is not one of: ${licenses.join(", ")}`);
    }
  }

  const scanned = [
    "docs/adr",
    "docs/specs",
    "docs/plans",
    "docs/lessons",
    "docs/context",
    ".claude/rules",
    ".claude/agents",
    ".claude/skills",
  ];
  const files = scanned.flatMap((folder) => walk(join(root, folder)));
  if (existsSync(join(root, "AGENTS.md"))) files.push(join(root, "AGENTS.md"));
  for (const path of files) {
    if (!path.endsWith(".md") && !path.endsWith(".mdx")) continue;
    const cited = new Set(readFileSync(path, "utf8").match(K_CITATION) ?? []);
    for (const found of cited) {
      if (/[\u2010-\u2013]/.test(found)) {
        report(path, `cites ${found} with a non-ASCII hyphen; write it with "-" (K-NNNN)`);
        continue;
      }
      const id = found.toUpperCase();
      if (found !== id) {
        report(path, `cites ${found}; the id must be written ${id}`);
        continue;
      }
      const entry = entries.get(id);
      if (!entry) {
        report(path, `cites ${id}, which does not exist in docs/knowledge`);
      } else if (
        CONFIDENCE_FORMAT.test(entry.raw.confidence ?? "") &&
        Number(entry.raw.confidence) < ADR_MIN_CONFIDENCE
      ) {
        report(
          path,
          `cites ${id} with confidence ${entry.raw.confidence}, below ${ADR_MIN_CONFIDENCE}; it may not ground a decision`,
        );
      }
    }
  }

  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = checkKnowledge(root);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    console.error(`\ncheck:knowledge failed with ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log("check:knowledge: ok");
}
