#!/usr/bin/env node
// Lints each commit of `origin/develop..HEAD` with commitlint (ORV-108, slice B).
// A release PR (GITHUB_BASE_REF is main) is skipped: its commits are squash commits already checked.
// Exit 0 when every commit passes, 1 when one fails, 2 when git or commitlint cannot run.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RANGE = "origin/develop..HEAD";

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

/** Lints one message. Returns { ok, output }. */
export function lintMessage(message) {
  const r = spawnSync(
    path.join(root, "node_modules/.bin/commitlint"),
    ["--config", path.join(root, "commitlint.config.mjs")],
    { input: message, encoding: "utf8" },
  );
  if (r.error) throw r.error;
  return { ok: r.status === 0, output: `${r.stdout}${r.stderr}`.trim() };
}

export function main(env = process.env) {
  if (env.GITHUB_BASE_REF === "main") {
    console.log("release PR: each commit was checked on its own PR");
    return 0;
  }
  const list = git(["log", "--no-merges", "--format=%H", RANGE]);
  if (list.status !== 0) {
    console.error(`check-commits: cannot read ${RANGE}: ${list.stderr.trim()}`);
    return 2;
  }
  const shas = list.stdout.split("\n").filter(Boolean);
  let failed = 0;
  for (const sha of shas) {
    const message = git(["log", "-1", "--format=%B", sha]).stdout;
    const { ok, output } = lintMessage(message);
    if (!ok) {
      failed++;
      console.error(`commit ${sha.slice(0, 7)} failed:\n${output}\n`);
    }
  }
  if (failed > 0) {
    console.error(`check-commits: ${failed} of ${shas.length} commits failed commitlint`);
    return 1;
  }
  console.log(`check-commits: ${shas.length} commits ok`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
