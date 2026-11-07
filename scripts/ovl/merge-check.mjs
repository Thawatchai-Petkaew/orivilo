#!/usr/bin/env node
// ORV-95: the records stage of merge-guard. `node merge-check.mjs <n> --head <sha>` reads the PR and
// its checks as gh reports them and the run records of the main checkout, and exits 0 only when the
// records prove the head may merge (spec ORV-95 v1.1). It writes nothing. Every non-zero exit is 2.
// The PR title, check descriptions and file contents are untrusted: stderr names check names, file
// paths, SHAs and the issue key only, each cut at 200 characters with control characters removed.
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { recordsRoot } from "./hook.mjs";
import {
  fetchBase,
  fetchPrHead,
  readBaseMerge,
  readChecks,
  readFileAtHead,
  readPr,
} from "./merge-check-facts.mjs";
import { readIssue, taskDir } from "./records.mjs";
import { storyPrefix, storyTitle } from "./result-recorder.mjs";
import { GUARD_PATH } from "./write-guard.mjs";

const RATE_LIMITED = "Deployment rate limited";
const MODES = ["light", "dark"];

/** Untrusted text made safe to print: control characters removed, cut at 200 characters. */
const clean = (value) =>
  String(value)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .slice(0, 200);

const time = (value, what) => {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new Error(`${what} has no valid time`);
  return ms;
};

/** The item with the latest `recorded_at` among `items` (each read through `at`), or undefined. */
function latest(items, at) {
  let best;
  let bestAt = -Infinity;
  for (const item of items) {
    const ms = at(item);
    if (ms >= bestAt) {
      best = item;
      bestAt = ms;
    }
  }
  return best;
}

/**
 * ORV-146: the record that judges `head` among `records` (each {recorded_at, report: {head_sha,
 * verdict}}), or undefined. The latest record on the exact head wins over any record carried from
 * an older head. With none on the head, the latest carried record (`carriesOver(its head)`) judges,
 * except that an approve does not hold while another carried head requests changes: the request is
 * returned instead.
 */
function pickVerdict(records, head, carriesOver, what) {
  const onHead = records.filter((r) => r.report?.head_sha === head);
  if (onHead.length > 0) return latest(onHead, (x) => time(x.recorded_at, what));
  const carried = records.filter(
    (r) => typeof r.report?.head_sha === "string" && carriesOver(r.report.head_sha),
  );
  const best = latest(carried, (x) => time(x.recorded_at, what));
  if (best?.report.verdict !== "approve") return best;
  return (
    carried.find(
      (r) => r.report.head_sha !== best.report.head_sha && r.report.verdict !== "approve",
    ) ?? best
  );
}

const readJsonIfExists = (file) =>
  existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;

/** The owner file `.orivilo/owner-<kind>/<n>.json` when it is valid for this PR and head, else null. */
function ownerRecord(root, kind, n, head) {
  const r = readJsonIfExists(join(root, ".orivilo", `owner-${kind}`, `${n}.json`));
  const ok =
    r !== null &&
    typeof r === "object" &&
    r.by === "owner" &&
    r.pr === n &&
    r.head_sha === head &&
    typeof r.at === "string" &&
    !Number.isNaN(Date.parse(r.at));
  return ok ? r : null;
}

const approvalFor = (root, n, head) => ownerRecord(root, "approvals", n, head);

function waiverFor(root, n, head) {
  const r = ownerRecord(root, "waivers", n, head);
  const ok =
    r !== null &&
    Array.isArray(r.checks) &&
    r.checks.length > 0 &&
    r.checks.every((c) => typeof c === "string");
  return ok ? r : null;
}

/** The problems with the checks: every check must pass, bar a waived rate-limited Vercel failure. */
function checkProblems(checks, root, n, head) {
  if (checks.length === 0) return ["the PR has no checks"];
  let waiver;
  const out = [];
  for (const c of checks) {
    if (c.bucket === "pass") continue;
    const rateLimited =
      c.name.startsWith("Vercel") && c.bucket === "fail" && c.description.startsWith(RATE_LIMITED);
    if (rateLimited) {
      waiver ??= { value: waiverFor(root, n, head) };
      if (waiver.value?.checks.includes(c.name)) continue;
    }
    let reason = `check "${clean(c.name)}" is ${clean(c.bucket)}`;
    if (c.name.startsWith("Vercel") || c.description.startsWith(RATE_LIMITED)) {
      reason +=
        `; a waiver covers only a rate-limited Vercel check named in .orivilo/owner-waivers/${n}.json` +
        ` for ${head}, written from the owner's terminal`;
    }
    out.push(reason);
  }
  return out;
}

const isProtected = (file) =>
  /^(?:packages|apps)\//.test(file) ||
  /^(?:\.orivilo|\.quality-gate)(?:\/|$)/.test(file) ||
  GUARD_PATH.test(file);

const isDocsOnly = (files) =>
  files.length > 0 && files.every((f) => f.endsWith(".md") && !isProtected(f));

/**
 * ORV-146: a test file is a basename ending in `.test.` and a script or module extension, with no
 * `.stories.` segment (Storybook loads such a file as a story) and not in the record folders.
 */
const isTestFile = (f) => {
  const base = f.slice(f.lastIndexOf("/") + 1);
  return (
    /\.test\.(?:ts|tsx|js|mjs|cjs|mts|cts)$/.test(base) &&
    !base.includes(".stories.") &&
    !/^(?:\.orivilo|\.quality-gate)(?:\/|$)/.test(f)
  );
};

/** ORV-146: docs are `docs/**` and a `*.md` outside the protected folders. */
const isDocsFile = (f) => f.startsWith("docs/") || (f.endsWith(".md") && !isProtected(f));

/** ORV-146: every file is a test file or docs, so no qa evidence is needed (the reviewer approve and the gate still are). */
const needsNoQa = (files) => files.length > 0 && files.every((f) => isTestFile(f) || isDocsFile(f));

/** Files outside the union of the write_sets of the issue's bound envelopes plus the main-session docs. */
function outsideUnion(files, tasks, issue) {
  const entries = tasks
    .filter((t) => t.agent !== undefined)
    .flatMap((t) => (Array.isArray(t.envelope?.write_set) ? t.envelope.write_set : []));
  const main = [
    "docs/context/handoff.md",
    "docs/plans/*.md",
    `docs/specs/${issue}/jira-issue.md`,
    "DESIGN.md",
  ];
  const listed = [...entries, ...main];
  return files.filter((f) => !listed.some((e) => e === f || posix.matchesGlob(f, e)));
}

function gateProblems(gates, head) {
  const forHead = gates.filter((g) => g.sha === head);
  if (forHead.length === 0) return [`no gate record has sha ${head}`];
  const g = latest(forHead, (x) => time(x.recorded_at, "a gate record"));
  const out = [];
  if (g.ok !== true) out.push(`the latest gate record for ${head} has ok: ${g.ok}`);
  if (g.dirty !== false) out.push(`the latest gate record for ${head} has dirty: ${g.dirty}`);
  if (g.steps_source !== "gate") {
    out.push(`a merge needs steps_source "gate", the gate record for ${head} has a different one`);
  }
  return out;
}

function qaProblems(root, issue, tasks, n, head, changedStories, storyTitleOf, carriesOver) {
  const qas = tasks
    .map((t) => readJsonIfExists(join(taskDir(root, issue, t.id), "qa.json")))
    .filter((q) => q !== null);
  const last = latest(qas, (x) => time(x.recorded_at, "a qa.json"));
  if (last === undefined) return [`no qa.json for ${issue} on ${head}`];
  // A later qa.json on a head that is neither this one nor carried makes the evidence stale; a
  // later one carried from an older head gives way to a verdict on this head (ORV-146 SEC-2).
  const lastSha = last.report.head_sha;
  if (lastSha !== head && !(typeof lastSha === "string" && carriesOver(lastSha))) {
    return [
      `the qa.json evidence is stale: the latest qa.json is for ${lastSha}, the head is ${head}`,
    ];
  }
  const q = pickVerdict(qas, head, carriesOver, "a qa.json");
  const r = q.report;
  const out = [];
  if (r.pr !== n)
    out.push(`the latest qa.json for ${issue} is for PR ${r.pr}, not PR ${n} (head ${head})`);
  if (r.verdict !== "approve")
    out.push(`the latest qa.json for ${issue} on ${head} is ${r.verdict}`);
  for (const file of changedStories) {
    const title = storyTitleOf(file);
    if (title === null) continue; // removed at the head: nothing to show
    const prefix = storyPrefix(title);
    const shots = r.screenshots.filter((s) => s.story.startsWith(prefix));
    if (shots.length === 0) {
      out.push(
        `no screenshot for a story of "${clean(title)}" (${clean(prefix)}*): needs light and dark`,
      );
    }
    for (const story of new Set(shots.map((s) => s.story))) {
      for (const mode of MODES) {
        if (!shots.some((s) => s.story === story && s.mode === mode)) {
          out.push(`story ${clean(story)} has no ${mode} screenshot`);
        }
      }
    }
  }
  return out;
}

/**
 * ORV-146: true when `merge` (from readBaseMerge) shows that the head differs from the approved
 * commit only by a merge of the base, and that merge touches no file the PR changes now, changed at
 * the approved commit, or renamed from. A null `merge` carries nothing.
 */
export function carriesApprove(merge, pr) {
  if (merge === null) return false;
  const prFiles = new Set([...pr.files, ...(pr.previousFiles ?? []), ...merge.approvedFiles]);
  return !merge.changed.some((f) => prFiles.has(f));
}

/**
 * True when the latest reviewer.v1 result of a reviewer envelope on `head` approves. A result on an
 * older head counts as one on `head` when `carriesOver(its head)` says the head only merged the base.
 */
function reviewerApproves(tasks, head, carriesOver) {
  const results = tasks
    .filter((t) => t.envelope?.role === "reviewer" && t.result?.contract === "reviewer.v1")
    .map((t) => t.result);
  return (
    pickVerdict(results, head, carriesOver, "a reviewer.v1 result")?.report.verdict === "approve"
  );
}

/**
 * ORV-115: a release PR (develop into main) needs no owner record. Its gate evidence is the green CI
 * checks, and each guard file in it was judged when its own PR merged into develop.
 */
function releaseProblems(pr, checks, root) {
  const out = [];
  // A fork head is not this repository's develop; a missing isCrossRepository was refused when read.
  if (pr.headRefName !== "develop" || pr.isCrossRepository !== false) {
    out.push("only the release PR from this repository's develop goes into main");
  }
  out.push(...checkProblems(checks, root, pr.number, pr.headRefOid));
  if (checks.length > 0 && !checks.some((c) => c.workflow === "CI" && c.bucket === "pass")) {
    out.push("a release into main needs a passing CI check");
  }
  return out;
}

/**
 * The reasons to block the merge (empty to allow). `pr` and `checks` come from merge-check-facts,
 * `root` is the checkout holding the records, `storyTitleOf(file)` gives the Storybook title of a
 * stories file at the head, or null when the head no longer has the file. `carriesOver(sha)` says
 * whether an approve given on the older head `sha` still holds (ORV-146, see carriesApprove).
 */
export function decide({ pr, checks, head, root, storyTitleOf, carriesOver = () => false }) {
  const sha = pr.headRefOid;
  if (head !== sha) {
    return [`the PR head moved: --head is ${clean(head)}, GitHub reports ${sha}`];
  }
  if (pr.baseRefName === "main") return releaseProblems(pr, checks, root);
  if (pr.baseRefName !== "develop") return ["a PR merges only into develop or main"];

  const issue = /^[a-z]+\/(ORV-\d+)-/.exec(pr.headRefName)?.[1];
  const titleKey = /^(ORV-\d+):/.exec(pr.title)?.[1];
  if (issue === undefined || titleKey !== issue) {
    return [
      `the title and the head branch must name the same issue key (branch key ${issue ?? "none"}, title key ${titleKey ?? "none"})`,
    ];
  }

  const { tasks, gates } = readIssue(root, issue);
  const n = pr.number;
  const out = checkProblems(checks, root, n, sha);
  const approval = approvalFor(root, n, sha);
  const approvalFile = `.orivilo/owner-approvals/${n}.json`;

  const guarded = [...pr.files, ...(pr.previousFiles ?? [])].filter((f) => GUARD_PATH.test(f));
  if (guarded.length > 0 && approval === null) {
    out.push(
      `the PR changes guard files (${guarded.map(clean).join(", ")}): it needs ${approvalFile} for ${sha}`,
    );
  }
  const outside = outsideUnion(pr.files, tasks, issue);
  if (outside.length > 0) {
    out.push(`files outside the write_set union of ${issue}: ${outside.map(clean).join(", ")}`);
  }

  if (isDocsOnly(pr.files)) {
    if (!reviewerApproves(tasks, sha, carriesOver) && approval === null) {
      out.push(`a docs-only PR needs a reviewer.v1 approve on ${sha} or ${approvalFile}`);
    }
    return out;
  }
  out.push(...gateProblems(gates, sha));
  if (!needsNoQa(pr.files)) {
    const stories = pr.files.filter((f) => f.endsWith(".stories.tsx"));
    out.push(...qaProblems(root, issue, tasks, n, sha, stories, storyTitleOf, carriesOver));
  }
  if (!reviewerApproves(tasks, sha, carriesOver)) out.push(`no reviewer.v1 approve on ${sha}`);
  return out;
}

function parseArgs(argv) {
  const n = /^[1-9][0-9]*$/.test(argv[0] ?? "") ? Number(argv[0]) : null;
  const flag = argv[1] === "--head" && /^[0-9a-f]{40}$/.test(argv[2] ?? "");
  if (n === null || !flag || argv.length !== 3) {
    throw new Error("usage: merge-check.mjs <pr number> --head <40-hex sha>");
  }
  return { n, head: argv[2] };
}

/** Runs the records stage for `argv`; returns {code, stderr}. */
export function runMergeCheck(argv, { cwd = process.cwd(), env = process.env } = {}) {
  try {
    const { n, head } = parseArgs(argv);
    const root = recordsRoot(cwd);
    const pr = readPr(n, { cwd, env });
    const checks = readChecks(n, { cwd, env });
    let fetched = false;
    const fetchHead = () => {
      if (!fetched) {
        fetchPrHead(n, { cwd, env });
        fetched = true;
      }
    };
    const storyTitleOf = (file) => {
      fetchHead();
      return readFileAtHead(pr.headRefOid, file, { cwd, env }) === null
        ? null
        : storyTitle(cwd, pr.headRefOid, file);
    };
    // ORV-146: git is read only when a record names an older head; each older head is judged once.
    const carried = new Map();
    const carriesOver = (approved) => {
      if (!carried.has(approved)) {
        if (carried.size === 0) {
          fetchHead();
          fetchBase(pr.baseRefName, { cwd, env });
        }
        const merge = readBaseMerge(approved, pr.headRefOid, pr.baseRefName, { cwd, env });
        carried.set(approved, carriesApprove(merge, pr));
      }
      return carried.get(approved);
    };
    const reasons = decide({ pr, checks, head, root, storyTitleOf, carriesOver });
    if (reasons.length === 0) return { code: 0, stderr: "" };
    return { code: 2, stderr: `merge-check blocked:\n- ${reasons.join("\n- ")}` };
  } catch (error) {
    return { code: 2, stderr: `merge-check failed closed: ${clean(error.message)}` };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { code, stderr } = runMergeCheck(process.argv.slice(2));
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.exit(code);
}
