// ORV-95: the gh and git reads of merge-check (records stage). Pure reading and parsing,
// no decision: merge-check.mjs judges these facts. Every failure throws a FactsError, which
// the caller turns into `merge-check failed closed:`. Error text names the step only, never
// PR text (spec row 35).
import { spawnSync } from "node:child_process";

export class FactsError extends Error {}

// ORV-115: the file list comes from gh api pulls/<n>/files --paginate, since gh pr view stops at 100.
const PR_FIELDS = "number,title,baseRefName,headRefName,headRefOid,changedFiles,isCrossRepository";
const CHECK_FIELDS = "name,state,bucket,description,link,workflow";
const SHA = /^[0-9a-f]{40}$/;
const MAX_BUFFER = 64 * 1024 * 1024;

function run(cmd, args, { cwd, env }) {
  const r = spawnSync(cmd, args, { cwd, env, encoding: "utf8", maxBuffer: MAX_BUFFER });
  if (r.error) throw new FactsError(`${cmd} could not run (${r.error.code ?? "error"})`);
  return r;
}

function prNumber(n) {
  if (!Number.isInteger(n) || n < 1)
    throw new FactsError("the PR number must be a whole number of 1 or more");
  return String(n);
}

const isString = (v) => typeof v === "string";

/**
 * The changed paths of PR `num`, read page by page from the REST list (`gh pr view --json files`
 * stops at 100). A page that is not an array of items with a string `filename` fails closed.
 */
function readPaths(num, { cwd, env }) {
  const r = run("gh", ["api", `repos/{owner}/{repo}/pulls/${num}/files`, "--paginate", "--slurp"], {
    cwd,
    env,
  });
  if (r.status !== 0) throw new FactsError(`gh api pulls/${num}/files exited ${r.status}`);
  let pages;
  try {
    pages = JSON.parse(r.stdout);
  } catch {
    throw new FactsError(`gh api pulls/${num}/files printed text that is not JSON`);
  }
  const ok =
    Array.isArray(pages) &&
    pages.every(
      (page) =>
        Array.isArray(page) &&
        page.every((f) => f !== null && typeof f === "object" && isString(f.filename)),
    );
  if (!ok) throw new FactsError(`gh api pulls/${num}/files printed files in an unexpected shape`);
  const items = pages.flat();
  // A renamed file also counts by its previous path, so a guard file cannot be renamed out of sight.
  const previous = items
    .filter((f) => f.status === "renamed" && isString(f.previous_filename))
    .map((f) => f.previous_filename);
  return { files: items.map((f) => f.filename), previous };
}

/**
 * `gh pr view` plus the paginated file list: {number, title, baseRefName, headRefName, headRefOid,
 * changedFiles, isCrossRepository, files: string[], previousFiles: string[] (old paths of renames)}.
 */
export function readPr(n, { cwd, env = process.env } = {}) {
  const num = prNumber(n);
  const r = run("gh", ["pr", "view", num, "--json", PR_FIELDS], { cwd, env });
  if (r.status !== 0) throw new FactsError(`gh pr view ${num} exited ${r.status}`);
  let data;
  try {
    data = JSON.parse(r.stdout);
  } catch {
    throw new FactsError(`gh pr view ${num} printed text that is not JSON`);
  }
  const ok =
    data !== null &&
    typeof data === "object" &&
    data.number === n &&
    isString(data.title) &&
    isString(data.baseRefName) &&
    isString(data.headRefName) &&
    isString(data.headRefOid) &&
    SHA.test(data.headRefOid) &&
    Number.isInteger(data.changedFiles) &&
    typeof data.isCrossRepository === "boolean";
  if (!ok) throw new FactsError(`gh pr view ${num} printed a PR in an unexpected shape`);
  const { files, previous } = readPaths(num, { cwd, env });
  if (files.length !== data.changedFiles) {
    throw new FactsError(
      `GitHub cut the file list of PR ${num} (${files.length} of ${data.changedFiles} files)`,
    );
  }
  return {
    number: data.number,
    title: data.title,
    baseRefName: data.baseRefName,
    headRefName: data.headRefName,
    headRefOid: data.headRefOid,
    changedFiles: data.changedFiles,
    isCrossRepository: data.isCrossRepository,
    files,
    previousFiles: previous,
  };
}

/**
 * `gh pr checks`: an array of {name, state, bucket, description, link, workflow}. stdout is read
 * whatever the exit code, since gh exits non-zero when a check fails or waits. An empty list is
 * returned as []; the caller decides that no checks blocks.
 */
export function readChecks(n, { cwd, env = process.env } = {}) {
  const num = prNumber(n);
  const r = run("gh", ["pr", "checks", num, "--json", CHECK_FIELDS], { cwd, env });
  let data;
  try {
    data = JSON.parse(r.stdout);
  } catch {
    throw new FactsError(
      `the checks of PR ${num} could not be read (stdout is not JSON, gh exited ${r.status})`,
    );
  }
  const ok =
    Array.isArray(data) &&
    data.every(
      (c) =>
        c !== null &&
        typeof c === "object" &&
        isString(c.name) &&
        isString(c.bucket) &&
        isString(c.state) &&
        isString(c.description),
    );
  if (!ok) throw new FactsError(`the checks of PR ${num} could not be read (unexpected shape)`);
  return data.map((c) => ({
    name: c.name,
    state: c.state,
    bucket: c.bucket,
    description: c.description,
    link: isString(c.link) ? c.link : "",
    workflow: isString(c.workflow) ? c.workflow : "",
  }));
}

/** `git fetch origin refs/pull/<n>/head`, so the PR head's files can be read with git show. */
export function fetchPrHead(n, { cwd, env = process.env } = {}) {
  const num = prNumber(n);
  const r = run("git", ["fetch", "--quiet", "origin", `refs/pull/${num}/head`], { cwd, env });
  if (r.status !== 0)
    throw new FactsError(`git fetch origin refs/pull/${num}/head exited ${r.status}`);
}

/** The text of `file` at commit `sha`, or null when the commit has no such file. */
export function readFileAtHead(sha, file, { cwd, env = process.env } = {}) {
  if (!SHA.test(sha)) throw new FactsError("the head must be a 40-hex SHA");
  if (
    !isString(file) ||
    file === "" ||
    file.startsWith("/") ||
    file.startsWith("-") ||
    file.split("/").includes("..")
  ) {
    throw new FactsError("the file path is not a path inside the repository");
  }
  const tree = run("git", ["ls-tree", sha, "--", file], { cwd, env });
  if (tree.status !== 0) throw new FactsError(`git ls-tree ${sha} exited ${tree.status}`);
  if (tree.stdout.trim() === "") return null;
  const r = run("git", ["show", `${sha}:${file}`], { cwd, env });
  if (r.status !== 0) throw new FactsError(`git show ${sha} exited ${r.status}`);
  return r.stdout;
}

const BASE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function baseName(base) {
  if (!isString(base) || !BASE.test(base)) {
    throw new FactsError("the base is not a plain branch name");
  }
  return base;
}

/** `git fetch origin <base>` into origin/<base>, so the commits a merge of the base brought are known. */
export function fetchBase(base, { cwd, env = process.env } = {}) {
  const name = baseName(base);
  const r = run(
    "git",
    ["fetch", "--quiet", "origin", `+refs/heads/${name}:refs/remotes/origin/${name}`],
    { cwd, env },
  );
  if (r.status !== 0) throw new FactsError(`git fetch origin ${name} exited ${r.status}`);
}

const gitLines = (args, opts, what) => {
  const r = run("git", args, opts);
  if (r.status !== 0) throw new FactsError(`${what} exited ${r.status}`);
  return r.stdout.split("\0").filter((line) => line !== "");
};

/**
 * ORV-146: whether `head` differs from the approved commit `approved` only by merges of origin/<base>.
 * Null when it does not: `approved` is not a known commit or not behind `head`, or a commit between
 * them that origin/<base> lacks is not a merge. Otherwise {changed, approvedFiles}: the files that differ
 * between `approved` and `head`, and the files the PR had changed at `approved` (against its
 * merge base with origin/<base>). Both lists name a rename by its old and its new path. The caller
 * decides whether the two lists meet; origin/<base> and `head` must be fetched first.
 */
export function readBaseMerge(approved, head, base, { cwd, env = process.env } = {}) {
  if (!SHA.test(head)) throw new FactsError("the head must be a 40-hex SHA");
  const ref = `origin/${baseName(base)}`;
  const opts = { cwd, env };
  if (!SHA.test(approved)) return null;
  if (run("git", ["cat-file", "-e", `${approved}^{commit}`], opts).status !== 0) return null;
  const behind = run("git", ["merge-base", "--is-ancestor", approved, head], opts);
  if (behind.status === 1) return null;
  if (behind.status !== 0) {
    throw new FactsError(`git merge-base --is-ancestor exited ${behind.status}`);
  }
  const own = gitLines(
    ["rev-list", "--parents", "-z", head, `^${approved}`, `^${ref}`, "--"],
    opts,
    "git rev-list",
  );
  // A line is a commit and its parents; one parent only means a commit of the branch's own, not a merge.
  if (own.some((line) => line.split(" ").length < 3)) return null;
  const fork = run("git", ["merge-base", approved, ref], opts).stdout.trim();
  const names = (from, to) =>
    gitLines(["diff", "--name-only", "--no-renames", "-z", from, to, "--"], opts, "git diff");
  return { changed: names(approved, head), approvedFiles: names(fork, approved) };
}
