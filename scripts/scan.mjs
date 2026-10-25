#!/usr/bin/env node
// The secret scan and the code scan of the quality gate (ORV-108, slice B).
//
//   node scripts/scan.mjs secrets [--report]   secretlint over `git ls-files`
//   node scripts/scan.mjs code [--report]      ESLint with eslint-plugin-security over apps, packages, scripts
//
// Each finding prints as `file:line rule`. Without --report any finding exits 1. With --report the
// scan prints `report mode: <n> findings, not blocking` and exits 0 (a new scanner lands in report
// mode; the switch to blocking removes --report from the gate and CI). The scan never prints a
// matched secret: only the file, the line and the rule id. Exit 2 when the tool itself cannot run.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = (name) => path.join(root, "node_modules/.bin", name);
const CODE_FILE = /\.(?:[cm]?js|[cm]?ts|tsx|jsx)$/;

function trackedFiles(pathspec = []) {
  const r = spawnSync("git", ["ls-files", "-z", "--", ...pathspec], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr.trim()}`);
  return r.stdout.split("\0").filter((f) => f && existsSync(f));
}

function runJson(command, args) {
  const r = spawnSync(command, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw r.error;
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw new Error(
      `${path.basename(command)} gave no JSON (exit ${r.status}): ${r.stderr.trim()}`,
    );
  }
}

const rel = (file) => path.relative(process.cwd(), file);

/** Findings as { file, line, rule } from secretlint over the tracked files. */
export function scanSecrets() {
  const files = trackedFiles();
  if (files.length === 0) return [];
  const results = runJson(bin("secretlint"), [
    "--no-glob",
    "--no-gitignore",
    "--format",
    "json",
    "--secretlintrc",
    path.join(root, ".secretlintrc.json"),
    "--secretlintignore",
    path.join(root, ".secretlintignore"),
    ...files,
  ]);
  return results.flatMap((r) =>
    r.messages.map((m) => ({
      file: rel(r.filePath),
      line: m.loc?.start?.line ?? 0,
      rule: m.ruleId,
    })),
  );
}

/** Findings as { file, line, rule } from ESLint with the security plugin. */
export function scanCode() {
  const files = trackedFiles(["apps", "packages", "scripts"]).filter((f) => CODE_FILE.test(f));
  if (files.length === 0) return [];
  const results = runJson(bin("eslint"), [
    "--config",
    path.join(root, "eslint.security.config.mjs"),
    "--format",
    "json",
    "--no-warn-ignored",
    ...files,
  ]);
  return results.flatMap((r) =>
    r.messages.map((m) => ({
      file: rel(r.filePath),
      line: m.line ?? 0,
      rule: m.ruleId ?? "parse-error",
    })),
  );
}

export function main(argv) {
  const [kind, ...flags] = argv;
  const report = flags.includes("--report");
  const scan = { secrets: scanSecrets, code: scanCode }[kind];
  if (!scan || flags.some((f) => f !== "--report")) {
    console.error("Usage: node scripts/scan.mjs <secrets|code> [--report]");
    return 2;
  }
  let findings;
  try {
    findings = scan();
  } catch (err) {
    console.error(`scan ${kind}: ${err.message}`);
    return 2;
  }
  for (const f of findings) console.log(`${f.file}:${f.line} ${f.rule}`);
  if (report) {
    console.log(`report mode: ${findings.length} findings, not blocking`);
    return 0;
  }
  console.log(`scan ${kind}: ${findings.length} findings`);
  return findings.length > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
