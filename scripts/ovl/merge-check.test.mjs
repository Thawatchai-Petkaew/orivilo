// ORV-95 task 3: the records-stage decision and CLI, tested on fixture facts and records
// (spec rows 15 to 35). The CLI cases use a fixture gh on PATH and a throwaway git repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { decide, runMergeCheck } from "./merge-check.mjs";

const H = "a".repeat(40);
const H2 = "b".repeat(40);
const T0 = Date.parse("2026-10-24T10:00:00Z");
const at = (i) => new Date(T0 + i * 1000).toISOString();
const RUN = ".orivilo/runs/ORV-1";

const pass = (name) => ({
  name,
  state: "SUCCESS",
  bucket: "pass",
  description: "",
  link: "",
  workflow: "",
});
const vercel = (over = {}) => ({
  name: "Vercel – orivilo",
  state: "FAILURE",
  bucket: "fail",
  description: "Deployment rate limited — retry in 24 hours.",
  link: "",
  workflow: "",
  ...over,
});

const basePr = (over = {}) => ({
  number: 7,
  title: "ORV-1: x",
  baseRefName: "develop",
  headRefName: "feature/ORV-1-x",
  headRefOid: H,
  changedFiles: 1,
  files: ["scripts/x.mjs"],
  ...over,
});

function put(root, rel, value) {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value));
}
const drop = (root, rel) => rmSync(join(root, rel), { recursive: true, force: true });

const qaReport = (over = {}) => ({
  task_id: "q",
  issue: "ORV-1",
  pr: 7,
  verdict: "approve",
  head_sha: H,
  screenshots: [],
  ...over,
});

/** Records for ORV-1 that satisfy every rule for PR 7 and head H, with `writeSet` in a bound builder. */
function goodRoot({ writeSet = ["scripts/x.mjs"] } = {}) {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  put(root, `${RUN}/b/envelope.json`, { task_id: "b", role: "builder", write_set: writeSet });
  put(root, `${RUN}/b/agent.json`, { agent_id: "a" });
  put(root, `${RUN}/q/envelope.json`, { task_id: "q", role: "qa", write_set: [] });
  put(root, `${RUN}/q/qa.json`, { contract: "qa.v1", recorded_at: at(1), report: qaReport() });
  put(root, `${RUN}/r/envelope.json`, { task_id: "r", role: "reviewer", write_set: [] });
  put(root, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(2),
    report: { head_sha: H, verdict: "approve" },
  });
  put(root, `${RUN}/gates/${at(0)}.json`, {
    ok: true,
    sha: H,
    dirty: false,
    steps_source: "gate",
    recorded_at: at(0),
  });
  return root;
}

const facts = (root, over = {}) => ({
  pr: basePr(),
  checks: [pass("check")],
  head: H,
  root,
  storyTitleOf: () => null,
  ...over,
});

const approval = (root, over = {}) =>
  put(root, ".orivilo/owner-approvals/7.json", {
    by: "owner",
    pr: 7,
    head_sha: H,
    at: at(9),
    ...over,
  });
const waiver = (root, over = {}) =>
  put(root, ".orivilo/owner-waivers/7.json", {
    by: "owner",
    pr: 7,
    head_sha: H,
    checks: ["Vercel – orivilo"],
    at: at(9),
    ...over,
  });

const blocked = (reasons, ...patterns) => {
  assert.ok(reasons.length > 0, "expected a block");
  for (const p of patterns) assert.match(reasons.join("\n"), p);
};

test("row 15: everything in order allows", () => {
  assert.deepEqual(decide(facts(goodRoot())), []);
});

test("row 16: missing, request_changes and wrong-PR qa.json block", () => {
  const none = goodRoot();
  drop(none, `${RUN}/q/qa.json`);
  blocked(decide(facts(none)), /qa\.json/, /ORV-1/, new RegExp(H));
  const rc = goodRoot();
  put(rc, `${RUN}/q/qa.json`, {
    recorded_at: at(1),
    report: qaReport({ verdict: "request_changes" }),
  });
  blocked(decide(facts(rc)), /qa\.json/, /request_changes/);
  const other = goodRoot();
  put(other, `${RUN}/q/qa.json`, { recorded_at: at(1), report: qaReport({ pr: 6 }) });
  blocked(decide(facts(other)), /qa\.json/, /PR 6/);
});

test("row 17: a stale qa.json names both SHAs, also after a later approve on another head", () => {
  const stale = goodRoot();
  put(stale, `${RUN}/q/qa.json`, { recorded_at: at(1), report: qaReport({ head_sha: H2 }) });
  blocked(decide(facts(stale)), /stale/, new RegExp(H), new RegExp(H2));
  const later = goodRoot();
  put(later, `${RUN}/q2/envelope.json`, { task_id: "q2", role: "qa", write_set: [] });
  put(later, `${RUN}/q2/qa.json`, { recorded_at: at(5), report: qaReport({ head_sha: H2 }) });
  blocked(decide(facts(later)), /stale/);
});

test("row 18: reviewer.v1 must be the latest on the head, from a reviewer", () => {
  const none = goodRoot();
  drop(none, `${RUN}/r/result.json`);
  blocked(decide(facts(none)), /reviewer\.v1/, new RegExp(H));
  const after = goodRoot();
  put(after, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(after, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(6),
    report: { head_sha: H, verdict: "request_changes" },
  });
  blocked(decide(facts(after)), /reviewer\.v1/);
  const designer = goodRoot();
  put(designer, `${RUN}/r/envelope.json`, { task_id: "r", role: "designer", write_set: [] });
  blocked(decide(facts(designer)), /reviewer\.v1/);
  const security = goodRoot();
  put(security, `${RUN}/r/envelope.json`, {
    task_id: "r",
    role: "security",
    write_set: [],
  });
  blocked(decide(facts(security)), /reviewer\.v1/, new RegExp(H));
});

test("row 19: failed, pending, skipping, cancel and no checks block", () => {
  const root = goodRoot();
  for (const bucket of ["fail", "pending", "skipping", "cancel"]) {
    blocked(
      decide(facts(root, { checks: [{ ...pass("ci"), bucket }] })),
      /"ci"/,
      new RegExp(bucket),
    );
  }
  blocked(decide(facts(root, { checks: [] })), /no checks/);
});

test("row 20 and 21: a waiver covers one rate-limited Vercel check on one head", () => {
  const ok = goodRoot();
  waiver(ok);
  const checks = [pass("check"), vercel()];
  assert.deepEqual(decide(facts(ok, { checks })), []);

  const ciLimited = { ...pass("ci"), bucket: "fail", description: "Deployment rate limited" };
  const cases = [
    [{ head_sha: H2 }, checks],
    [{ by: "agent" }, checks],
    [{ pr: 6 }, checks],
    [{ checks: ["other"] }, checks],
    [{}, [pass("check"), vercel({ description: "Build failed" })]],
    [{ checks: ["ci"] }, [pass("check"), ciLimited]],
    [{}, [pass("check"), vercel({ bucket: "pending", state: "PENDING" })]],
  ];
  for (const [over, cs] of cases) {
    const root = goodRoot();
    waiver(root, over);
    blocked(decide(facts(root, { checks: cs })), /owner-waivers\/7\.json/);
  }
  // No waiver file: a PR comment is never read.
  blocked(decide(facts(goodRoot(), { checks })), /owner-waivers\/7\.json/);
});

test("row 22 and 23: the gate record decides", () => {
  const base = { ok: true, sha: H, dirty: false, steps_source: "gate" };
  for (const [rec, re] of [
    [undefined, /sha/],
    [{ ...base, ok: false }, /ok/],
    [{ ...base, dirty: true }, /dirty/],
    [{ ...base, sha: H2 }, /sha/],
    [{ ...base, steps_source: "stub" }, /steps_source "gate"/],
  ]) {
    const root = goodRoot();
    drop(root, `${RUN}/gates`);
    if (rec) put(root, `${RUN}/gates/${at(0)}.json`, { recorded_at: at(0), ...rec });
    blocked(decide(facts(root)), re);
  }
});

test("row 24: a changed stories file needs light and dark screenshots", () => {
  const file = "packages/design-system/src/button.stories.tsx";
  const withShots = (shots) => {
    const root = goodRoot({ writeSet: [file] });
    put(root, `${RUN}/q/qa.json`, {
      recorded_at: at(1),
      report: qaReport({ screenshots: shots }),
    });
    return root;
  };
  const shot = (story, mode) => ({ story, mode });
  const run = (root, title) =>
    decide(facts(root, { pr: basePr({ files: [file] }), storyTitleOf: () => title }));
  blocked(run(withShots([shot("button--primary", "light")]), "Button"), /button--primary/, /dark/);
  blocked(run(withShots([]), "Button"), /"Button"/);
  const both = [shot("button--primary", "light"), shot("button--primary", "dark")];
  assert.deepEqual(run(withShots(both), "Button"), []);
  assert.deepEqual(run(withShots([]), null), []);
});

test("row 25: files outside the write_set union block, main-session docs do not", () => {
  const readme = basePr({ files: ["README.md"] });
  blocked(decide(facts(goodRoot(), { pr: readme })), /README\.md/);
  const denied = goodRoot({ writeSet: [] });
  put(denied, `${RUN}/d/envelope.json`, {
    task_id: "d",
    role: "builder",
    write_set: ["README.md"],
  });
  put(denied, `${RUN}/d/closed.json`, { reason: "denied" });
  blocked(decide(facts(denied, { pr: readme })), /README\.md/);
  const docs = [
    "docs/context/handoff.md",
    "docs/plans/master-plan.md",
    "docs/specs/ORV-1/jira-issue.md",
  ];
  const root = goodRoot();
  approval(root);
  assert.deepEqual(decide(facts(root, { pr: basePr({ files: docs }) })), []);
  const other = basePr({ files: ["docs/specs/ORV-2/jira-issue.md"] });
  blocked(decide(facts(root, { pr: other })), /ORV-2\/jira-issue/);
});

test("row 26: a guard file needs the owner approval for the head", () => {
  for (const file of ["scripts/ovl/x.mjs", ".github/workflows/ci.yml"]) {
    const pr = basePr({ files: [file] });
    for (const over of [null, { head_sha: H2 }, { by: "agent" }, { pr: 6 }]) {
      const root = goodRoot({ writeSet: [file] });
      if (over) approval(root, over);
      blocked(decide(facts(root, { pr })), /owner-approvals\/7\.json/, new RegExp(H));
    }
    const root = goodRoot({ writeSet: [file] });
    approval(root);
    assert.deepEqual(decide(facts(root, { pr })), []);
  }
});

test("row 27: the title and the head branch name the same issue key", () => {
  const root = goodRoot();
  const cases = [
    { title: "ORV-2: x" },
    { headRefName: "fix-x" },
    { headRefName: "feature/ORV-2-x" },
  ];
  for (const over of cases) {
    blocked(decide(facts(root, { pr: basePr(over) })), /same issue key/);
  }
});

test("row 28: a moved head blocks", () => {
  blocked(decide(facts(goodRoot(), { head: H2 })), /head moved/);
});

test("row 29 and 30: docs-only PRs need a reviewer or the owner, not a qa", () => {
  const files = ["docs/specs/ORV-1/spec.md", ".claude/skills/ovl/SKILL.md"];
  const docsRoot = () => {
    const root = goodRoot({ writeSet: files });
    drop(root, `${RUN}/q/qa.json`);
    drop(root, `${RUN}/gates`);
    return root;
  };
  const pr = basePr({ files });
  assert.deepEqual(decide(facts(docsRoot(), { pr })), []);
  const owner = docsRoot();
  drop(owner, `${RUN}/r/result.json`);
  approval(owner);
  assert.deepEqual(decide(facts(owner, { pr })), []);
  const neither = docsRoot();
  drop(neither, `${RUN}/r/result.json`);
  blocked(decide(facts(neither, { pr })), /reviewer\.v1/, /owner-approvals\/7\.json/);
  const mixed = ["docs/a.md", "packages/a/notes.md"];
  const notDocs = goodRoot({ writeSet: mixed });
  drop(notDocs, `${RUN}/q/qa.json`);
  blocked(decide(facts(notDocs, { pr: basePr({ files: mixed }) })), /qa\.json/);
});

test("row 31 to 33: the release PR and other bases", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  const release = (over) =>
    basePr({ number: 8, baseRefName: "main", headRefName: "develop", ...over });
  const a8 = (over) =>
    put(root, ".orivilo/owner-approvals/8.json", {
      by: "owner",
      pr: 8,
      head_sha: H,
      at: at(1),
      ...over,
    });
  const f = (pr, checks = [pass("check")]) => decide(facts(root, { pr, checks }));
  a8();
  assert.deepEqual(f(release()), []);
  blocked(f(release({ headRefName: "feature/ORV-1-x" })), /release PR from develop/);
  a8({ head_sha: H2 });
  blocked(f(release()), /owner-approvals\/8\.json/);
  a8();
  blocked(f(release(), [{ ...pass("ci"), bucket: "fail" }]), /"ci"/);
  blocked(f(basePr({ baseRefName: "release/x" })), /only into develop or main/);
});

// CLI: a fixture gh on PATH and a throwaway git repo that holds the records.
function cli(over = {}, { head = H, noGh = false, badQa = false, canary = false } = {}) {
  const repo = mkdtempSync(join(tmpdir(), "mcr-"));
  execFileSync("git", ["init", "-q", repo]);
  cpSync(join(goodRoot(), ".orivilo"), join(repo, ".orivilo"), { recursive: true });
  if (badQa) put(repo, `${RUN}/q/qa.json`, "not json");
  const bin = mkdtempSync(join(tmpdir(), "mcbin-"));
  const title = canary ? "ORV-1: CANARY" : "ORV-1: x";
  put(bin, "view.json", { ...basePr(), title, files: [{ path: "scripts/x.mjs" }] });
  const checks = over.checks ?? [{ ...pass("check"), description: canary ? "CANARY" : "" }];
  put(bin, "checks.json", checks);
  const gh = join(bin, "gh");
  writeFileSync(
    gh,
    `#!/bin/sh\ncase "$2" in view) cat '${bin}/view.json' ;; checks) cat '${bin}/checks.json' ;; esac\nexit ${over.exit ?? 0}\n`,
  );
  chmodSync(gh, 0o755);
  const path = noGh ? "/usr/bin:/bin" : `${bin}:${process.env.PATH}`;
  const args = head === null ? ["7"] : ["7", "--head", head];
  return runMergeCheck(args, { cwd: repo, env: { ...process.env, PATH: path } });
}

test("row 15 as a CLI: exit 0 and nothing on stderr", () => {
  assert.deepEqual(cli(), { code: 0, stderr: "" });
});

test("row 34: every unreadable input fails closed", () => {
  for (const r of [
    cli({}, { badQa: true }),
    cli({ exit: 1 }),
    cli({}, { noGh: true }),
    cli({}, { head: null }),
  ]) {
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^merge-check failed closed:/);
  }
});

test("row 34: a waiver that is not JSON fails closed", () => {
  const root = goodRoot();
  put(root, ".orivilo/owner-waivers/7.json", "{nope");
  assert.throws(() => decide(facts(root, { checks: [pass("check"), vercel()] })));
});

test("row 28 and 35: a moved head blocks and PR text never reaches stderr", () => {
  const moved = cli({}, { head: H2 });
  assert.equal(moved.code, 2);
  assert.match(moved.stderr, /head moved/);
  const failing = { ...pass("ci"), bucket: "fail", description: "CANARY" };
  const r = cli({ checks: [failing] }, { canary: true });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /"ci"/);
  assert.doesNotMatch(r.stderr, /CANARY/);
});
