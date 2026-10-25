// ORV-95: the gh and git reads of merge-check (records stage). Pure reading and parsing,
// no decision: merge-check.mjs judges these facts. Every failure throws a FactsError, which
// the caller turns into `merge-check failed closed:`. Error text names the step only, never
// PR text (spec row 35).
import { spawnSync } from "node:child_process";

export class FactsError extends Error {}

// ORV-115: the file list comes from gh api pulls/<n>/files --paginate, since gh pr view stops at 100.
const PR_FIELDS = "number,title,baseRefName,headRefName,headRefOid,changedFiles";
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
  return pages.flat().map((f) => f.filename);
}

/** `gh pr view` plus the paginated file list: {number, title, baseRefName, headRefName, headRefOid, changedFiles, files: string[]}. */
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
    Number.isInteger(data.changedFiles);
  if (!ok) throw new FactsError(`gh pr view ${num} printed a PR in an unexpected shape`);
  const files = readPaths(num, { cwd, env });
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
    files,
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
