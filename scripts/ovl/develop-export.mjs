// ORV-95: the export stage of merge-guard. Builds (or reuses) the develop export, a copy of develop's
// `scripts/ovl/` at the SHA `git ls-remote` gives, under `<records root>/.orivilo/exports/<sha>/`, so
// the records stage runs develop's code and never the branch's (spec ORV-95 v1.1). This script's own
// process writes the folder; no tool call does, so write-guard has nothing to allow.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { recordsRoot } from "./hook.mjs";

const SHA = /^[0-9a-f]{40}$/;
const MERGE_CHECK = join("scripts", "ovl", "merge-check.mjs");
const MAX_BUFFER = 256 * 1024 * 1024;

/** A step failed (`bootstrap` false) or develop has no merge-check yet (`bootstrap` true). */
export class ExportError extends Error {
  constructor(message, { bootstrap = false } = {}) {
    super(message);
    this.bootstrap = bootstrap;
  }
}

function run(cmd, args, step, { cwd, env, input }) {
  const r = spawnSync(cmd, args, { cwd, env, input, maxBuffer: MAX_BUFFER });
  if (r.error) throw new ExportError(`${step} could not run (${r.error.code ?? "error"})`);
  if (r.status !== 0) throw new ExportError(`${step} exited ${r.status}`);
  return r.stdout;
}

/**
 * The develop export for the repo of `cwd`: `{sha, dir}`. Throws ExportError when a step fails, or
 * (bootstrap) when develop has no `scripts/ovl/merge-check.mjs`.
 */
export function ensureDevelopExport({ cwd, env = process.env }) {
  let root;
  try {
    root = recordsRoot(cwd);
  } catch (e) {
    throw new ExportError(`the records root could not be found (${e.message})`);
  }
  const listed = run("git", ["ls-remote", "origin", "refs/heads/develop"], "git ls-remote", {
    cwd,
    env,
  })
    .toString("utf8")
    .trim();
  const sha = listed.split(/\s+/)[0] ?? "";
  if (!SHA.test(sha)) throw new ExportError("git ls-remote gave no SHA for origin develop");

  const exports = join(root, ".orivilo", "exports");
  const dir = join(exports, sha);
  if (!existsSync(dir)) {
    run("git", ["fetch", "origin", sha], "git fetch", { cwd, env });
    const tar = run("git", ["archive", "--format=tar", sha, "scripts/ovl"], "git archive", {
      cwd,
      env,
    });
    mkdirSync(exports, { recursive: true });
    const aside = join(exports, `.aside-${sha}-${process.pid}`);
    rmSync(aside, { recursive: true, force: true });
    mkdirSync(aside);
    try {
      run("tar", ["-x", "-C", aside], "tar extract", { cwd, env, input: tar });
      renameSync(aside, dir);
    } catch (e) {
      rmSync(aside, { recursive: true, force: true });
      if (!existsSync(dir)) throw e instanceof ExportError ? e : new ExportError(e.message);
    }
  }
  if (!existsSync(join(dir, MERGE_CHECK))) {
    throw new ExportError(
      "develop has no scripts/ovl/merge-check.mjs yet, so the owner merges this PR in the GitHub web UI",
      { bootstrap: true },
    );
  }
  return { sha, dir };
}
