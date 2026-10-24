// ORV-95: the export stage of merge-guard. Builds (or reuses) the develop export, a copy of develop's
// `scripts/ovl/` at the SHA `git ls-remote` gives, under `<records root>/.orivilo/exports/<sha>/`, so
// the records stage runs develop's code and never the branch's (spec ORV-95 v1.1). Since v1.2 it checks
// the origin URL first and uses an export only when its tree equals `git ls-tree` of the SHA. This
// script's own process writes the folder; no tool call does, so write-guard has nothing to allow.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { recordsRoot } from "./hook.mjs";

const SHA = /^[0-9a-f]{40}$/;
const MAX_BUFFER = 256 * 1024 * 1024;
// The repo's origin, lowercased, without a trailing "/" or ".git" (spec ORV-95 v1.2, finding F3).
const EXPECTED_URLS = [
  "https://github.com/thawatchai-petkaew/orivilo",
  "git@github.com:thawatchai-petkaew/orivilo",
  "ssh://git@github.com/thawatchai-petkaew/orivilo",
];

/** A step failed (`bootstrap` false) or develop has no merge-check yet (`bootstrap` true). */
export class ExportError extends Error {
  constructor(message, { bootstrap = false } = {}) {
    super(message);
    this.bootstrap = bootstrap;
  }
}

class StopForTest extends Error {}

function run(cmd, args, step, { cwd, env, input }) {
  const r = spawnSync(cmd, args, { cwd, env, input, maxBuffer: MAX_BUFFER });
  if (r.error) throw new ExportError(`${step} could not run (${r.error.code ?? "error"})`);
  if (r.status !== 0) throw new ExportError(`${step} exited ${r.status}`);
  return r.stdout;
}

const normalizeUrl = (url) =>
  url
    .trim()
    .toLowerCase()
    .replace(/\/$/, "")
    .replace(/\.git$/, "");

const lstatOrNull = (path) => {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
};

/** `{path: blob hash}` of develop's scripts/ovl at `sha`; a link or submodule maps to null. */
function listTree(sha, opts) {
  const out = run("git", ["ls-tree", "-r", "-z", sha, "scripts/ovl"], "git ls-tree", opts);
  const blobs = new Map();
  for (const entry of out.toString("utf8").split("\0").filter(Boolean)) {
    const m = /^(\d+) (\w+) ([0-9a-f]{40})\t(.+)$/s.exec(entry);
    if (!m) throw new ExportError("git ls-tree gave an entry that cannot be read");
    blobs.set(m[4], m[1] === "120000" || m[2] !== "blob" ? null : m[3]);
  }
  return blobs;
}

/** True when `dir` holds exactly the listed blobs as regular files and nothing else. */
function treeMatches(dir, blobs) {
  const folders = new Set([""]);
  for (const path of blobs.keys()) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i += 1) folders.add(parts.slice(0, i).join("/"));
  }
  const seen = new Set();
  const walk = (rel) => {
    for (const name of readdirSync(join(dir, rel))) {
      const path = rel === "" ? name : `${rel}/${name}`;
      const st = lstatSync(join(dir, path));
      if (st.isDirectory()) {
        if (!folders.has(path) || !walk(path)) return false;
      } else if (st.isFile() && blobs.get(path)) {
        const data = readFileSync(join(dir, path));
        const hash = createHash("sha1").update(`blob ${data.length}\0`).update(data).digest("hex");
        if (hash !== blobs.get(path)) return false;
        seen.add(path);
      } else {
        return false;
      }
    }
    return true;
  };
  try {
    return walk("") && seen.size === blobs.size;
  } catch {
    return false;
  }
}

/**
 * The develop export for the repo of `cwd`: `{sha, dir}`. Throws ExportError when a step fails, or
 * (bootstrap) when develop has no `scripts/ovl/merge-check.mjs`. `expectedUrl` and `stopBeforeRename`
 * are function parameters for tests only, never an environment variable or a file.
 */
export function ensureDevelopExport({
  cwd,
  env = process.env,
  expectedUrl = null,
  stopBeforeRename = false,
}) {
  const opts = { cwd, env };
  const url = run("git", ["ls-remote", "--get-url", "origin"], "git ls-remote", opts)
    .toString("utf8")
    .trim();
  const allowed = expectedUrl === null ? EXPECTED_URLS : [normalizeUrl(expectedUrl)];
  if (!allowed.includes(normalizeUrl(url))) {
    throw new ExportError("git ls-remote origin URL check failed: origin is not the repo's remote");
  }
  let root;
  try {
    root = recordsRoot(cwd);
  } catch (e) {
    throw new ExportError(`the records root could not be found (${e.message})`);
  }
  const exports = join(root, ".orivilo", "exports");
  for (const folder of [join(root, ".orivilo"), exports]) {
    for (const name of ["package.json", "node_modules"]) {
      if (lstatOrNull(join(folder, name)) !== null) {
        throw new ExportError(`${join(folder, name)} exists and node would read it`);
      }
    }
  }
  const listed = run("git", ["ls-remote", "origin", "refs/heads/develop"], "git ls-remote", opts)
    .toString("utf8")
    .trim();
  const sha = listed.split(/\s+/)[0] ?? "";
  if (!SHA.test(sha)) throw new ExportError("git ls-remote gave no SHA for origin develop");

  const dir = join(exports, sha);
  const extract = () => {
    const tar = run("git", ["archive", "--format=tar", sha, "scripts/ovl"], "git archive", opts);
    mkdirSync(exports, { recursive: true });
    const aside = join(exports, `.aside-${sha}-${process.pid}`);
    rmSync(aside, { recursive: true, force: true });
    mkdirSync(aside);
    try {
      run("tar", ["-x", "-C", aside], "tar extract", { ...opts, input: tar });
      if (stopBeforeRename) throw new StopForTest();
      renameSync(aside, dir);
    } catch (e) {
      if (e instanceof StopForTest) throw new ExportError("stopped before the rename");
      rmSync(aside, { recursive: true, force: true });
      if (lstatOrNull(dir) === null)
        throw e instanceof ExportError ? e : new ExportError(e.message);
    }
  };

  const hasCommit = spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], opts).status === 0;
  const present = lstatOrNull(dir) !== null;
  if (!present || !hasCommit) run("git", ["fetch", "origin", sha], "git fetch", opts);
  if (!present) extract();
  const blobs = listTree(sha, opts);
  if (!treeMatches(dir, blobs)) {
    const gone = join(exports, `.removed-${sha}-${process.pid}`);
    rmSync(gone, { recursive: true, force: true });
    renameSync(dir, gone);
    rmSync(gone, { recursive: true, force: true });
    extract();
    if (!treeMatches(dir, blobs)) {
      throw new ExportError("the develop export does not match develop's tree");
    }
  }
  if (!blobs.has("scripts/ovl/merge-check.mjs")) {
    throw new ExportError(
      "develop has no scripts/ovl/merge-check.mjs yet, so the owner merges this PR in the GitHub web UI",
      { bootstrap: true },
    );
  }
  return { sha, dir };
}
