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
const FIRST_CONFIRMED_ADR = 15;
const CONFIDENCE_FORMAT = /^(?:0(?:\.\d+|)|1(?:\.0+|))$/;
const ENTRY_FILE_NAME = {
  K: /^(K-\d{4})-[a-z0-9-]+\.md$/,
  L: /^(L-\d{4})-[a-z0-9-]+\.md$/,
};
// Used only when docs/knowledge/README.md has no readable license row. Mirrors that README's list.
const FALLBACK_LICENSES = ["internal", "own-words", "link-only", "MIT", "CC-BY-4.0", "CC0-1.0"];

/**
 * The rows of the `## Index` table in docs/knowledge/README.md as `{ name, confidence }`
 * (docs/specs/ORV-129/spec.md, index-read-1). Null when the file is absent or has no `## Index` line.
 */
function readIndex(root) {
  const path = join(root, "docs/knowledge/README.md");
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => /^## Index\s*$/.test(line));
  if (start === -1) return null;
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    const name = cells[1]?.match(/^\[\[([^\]]+)\]\]$/)?.[1];
    if (name !== undefined) rows.push({ name, confidence: cells[2] ?? "" });
  }
  return rows;
}

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

// A word of a `source:` value that only one machine can open: a rooted path, `~`, or a drive letter.
const NON_PORTABLE_WORD = /^(\/|~|[A-Za-z]:)/;

// Hyphen-like characters: ASCII "-" plus U+2010 to U+2013.
const K_CITATION = /\bk[-\u2010-\u2013]\d{4}\b/gi;

const SAVING_LINES = [
  "Metric",
  "Baseline",
  "Target",
  "Guard metric",
  "Evidence removed",
  "Check",
  "Check after",
];
// One collector command: issue keys, --flags, values and plain names only; no shell syntax.
const COLLECTOR_ARG = /^-{0,2}[A-Za-z0-9_][\w.\/:=-]*$/;
/** True for a backticked, single-spaced `node scripts/ovl/metrics.mjs <collect|report|session|due> <words>`. */
function isCollectorCheck(check) {
  if (check.length < 2 || !check.startsWith("`") || !check.endsWith("`")) return false;
  const [node, script, sub, ...args] = check.slice(1, -1).split(" ");
  return (
    node === "node" &&
    script === "scripts/ovl/metrics.mjs" &&
    ["collect", "report", "session", "due"].includes(sub) &&
    args.every((word) => COLLECTOR_ARG.test(word))
  );
}
// A saving counts tokens.total or one of the four kinds, never the notice figure (ORV-87 finding F6).
const NOT_A_TOTAL = /\b(?:reported_total|notice figure|subagent_tokens)\b/i;

/** The `- Name: value` lines under `## Expected saving`, up to the next `## ` heading, and the names written twice. Null without it. */
function savingLines(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => /^## Expected saving\s*$/.test(line));
  if (start === -1) return null;
  const found = new Map();
  const repeated = new Set();
  for (const line of lines.slice(start + 1)) {
    if (/^## /.test(line)) break;
    const pair = line.match(/^- ([A-Za-z ]+):\s*(.*)$/);
    if (!pair) continue;
    if (found.has(pair[1])) repeated.add(pair[1]);
    else found.set(pair[1], pair[2].trim());
  }
  return { found, repeated };
}

/** Problems with a lesson's `## Expected saving` section (docs/specs/ORV-87/spec.md, rows 20 to 22). */
function checkSaving(text) {
  const lines = savingLines(text);
  if (!lines) return [];
  const { found, repeated } = lines;
  const problems = [];
  for (const name of repeated) problems.push(`## Expected saving: line "${name}:" appears twice`);
  for (const name of SAVING_LINES) {
    if (!found.get(name)) problems.push(`## Expected saving: missing line "${name}:"`);
  }
  const baseline = found.get("Baseline");
  if (baseline) {
    const n = baseline.match(/\bn=(\d+)/);
    if (!n || Number(n[1]) < 3) {
      problems.push('## Expected saving: "Baseline:" needs n of 3 or more, written n=3');
    }
  }
  for (const name of ["Metric", "Baseline", "Target"]) {
    if (NOT_A_TOTAL.test(found.get(name) ?? "")) {
      problems.push(
        `## Expected saving: "${name}:" must count tokens.total or a kind, not reported_total or a notice figure`,
      );
    }
  }
  const check = found.get("Check");
  if (check && !isCollectorCheck(check)) {
    problems.push(
      '## Expected saving: "Check:" must be a collector command in backticks, node scripts/ovl/metrics.mjs ...',
    );
  }
  const after = found.get("Check after");
  if (after && !isRealDate(after)) {
    problems.push(`## Expected saving: "Check after:" ${after} is not a valid YYYY-MM-DD date`);
  }
  return problems;
}

/** Returns a list of `path: message` problems for the repo at `root`. */
export function checkKnowledge(root, now = new Date()) {
  const problems = [];
  const today = latestDate(now);
  const rel = (path) => relative(root, path).split("\\").join("/");
  const report = (path, message) => problems.push(`${rel(path)}: ${message}`);

  function loadEntries(dir, prefix, fields, files = []) {
    const entries = new Map();
    for (const path of walk(dir)) {
      const name = path.slice(path.lastIndexOf("/") + 1);
      if (name === "README.md" || name.startsWith(".")) continue;
      if (!name.endsWith(".md")) {
        report(path, "only .md files belong here; this file is not checked");
        continue;
      }
      const nameMatch = name.match(ENTRY_FILE_NAME[prefix]);
      if (!nameMatch) {
        report(path, `malformed file name ${name}; expected ${prefix}-NNNN-kebab-slug.md`);
        continue;
      }
      const text = readFileSync(path, "utf8");
      const data = parseFrontmatter(text);
      files.push({ path, name: name.slice(0, -3), data, raw: parseFrontmatter(text, true) });
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
      if (prefix === "L") {
        for (const message of checkSaving(text)) report(path, message);
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

  const entryFiles = [];
  const entries = loadEntries(join(root, "docs/knowledge"), "K", K_FIELDS, entryFiles);
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

  for (const { path, data } of entryFiles) {
    if (!data || !isPresent(data.source)) continue;
    const source = Array.isArray(data.source) ? data.source.join(" ") : data.source;
    for (const word of source.split(/\s+/)) {
      const bare = word.replace(/^[([<"`]+/, "");
      if (NON_PORTABLE_WORD.test(bare)) {
        report(
          path,
          `source holds an absolute or session path ${bare}; cite a repo-relative path or an https URL (L-0031)`,
        );
      }
    }
  }

  const index = entryFiles.length > 0 ? readIndex(root) : null;
  const readmePath = join(root, "docs/knowledge/README.md");
  if (entryFiles.length > 0 && existsSync(readmePath)) {
    if (index === null) report(readmePath, "has no ## Index table");
    else {
      const rowNames = new Set(index.map((row) => row.name));
      const byName = new Map(entryFiles.map((file) => [file.name, file]));
      for (const { path, name } of entryFiles) {
        if (!rowNames.has(name)) {
          report(path, "has no row in the docs/knowledge/README.md Index");
        }
      }
      for (const row of index) {
        const file = byName.get(row.name);
        if (!file) {
          report(readmePath, `Index row [[${row.name}]] names no entry file`);
          continue;
        }
        const confidence = file.raw?.confidence;
        if (
          confidence !== undefined &&
          CONFIDENCE_FORMAT.test(confidence) &&
          !(CONFIDENCE_FORMAT.test(row.confidence) && Number(row.confidence) === Number(confidence))
        ) {
          report(
            readmePath,
            `Index row [[${row.name}]] has confidence ${row.confidence}, the entry has ${confidence}`,
          );
        }
      }
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

  // ADR 0015 and later carry a `Confirmation:` line (ORV-108). ADRs 0001 to 0014 are decided and never rewritten.
  for (const path of walk(join(root, "docs/adr"))) {
    const number = path.slice(path.lastIndexOf("/") + 1).match(/^(\d{4})-.*\.md$/)?.[1];
    if (number === undefined || Number(number) < FIRST_CONFIRMED_ADR) continue;
    if (!/^Confirmation:/m.test(readFileSync(path, "utf8"))) {
      report(path, "has no Confirmation: line");
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
