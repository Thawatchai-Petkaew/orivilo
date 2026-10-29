// ORV-95 task 3: the records-stage decision and CLI, tested on fixture facts and records
// (spec rows 15 to 35). The CLI cases use a fixture gh on PATH and a throwaway git repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { carriesApprove, decide, runMergeCheck } from "./merge-check.mjs";
import { commitFile, gitIn, mergeRepo } from "./hook-test-kit.mjs";

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
  isCrossRepository: false,
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

// ---- ORV-146 point 2a: a PR of test files and docs needs no qa ----

const noQaRoot = (files) => {
  const root = goodRoot({ writeSet: files });
  drop(root, `${RUN}/q/qa.json`);
  return root;
};
const noQa = (files, over = {}) =>
  decide(facts(noQaRoot(files), { pr: basePr({ files }), ...over }));

test("ORV-146 a: a PR of test files and docs needs the gate and a reviewer approve, not a qa", () => {
  const files = [
    "packages/design-system/src/button.test.tsx",
    "apps/web/lib/x.test.ts",
    "scripts/x.test.mjs",
    "docs/specs/ORV-1/design.png",
    "README.md",
    "scripts/y.test.js",
    "scripts/y.test.cjs",
    "scripts/y.test.mts",
    "scripts/y.test.cts",
    "packages/a/z.test.tsx",
    "packages/a.stories.d/b.test.ts",
  ];
  assert.deepEqual(noQa(files), []);
  assert.deepEqual(noQa(["docs/specs/ORV-1/design.png"]), []);

  const noReviewer = noQaRoot(files);
  drop(noReviewer, `${RUN}/r/result.json`);
  blocked(decide(facts(noReviewer, { pr: basePr({ files }) })), /reviewer\.v1/, new RegExp(H));

  const noGate = noQaRoot(files);
  drop(noGate, `${RUN}/gates`);
  blocked(decide(facts(noGate, { pr: basePr({ files }) })), /gate record has sha/);
  const failedGate = noQaRoot(files);
  put(failedGate, `${RUN}/gates/${at(0)}.json`, {
    ok: false,
    sha: H,
    dirty: false,
    steps_source: "gate",
    recorded_at: at(0),
  });
  blocked(decide(facts(failedGate, { pr: basePr({ files }) })), /ok: false/);
});

test("ORV-146 a: one file that is not a test file or docs keeps the qa", () => {
  const test = "packages/design-system/src/button.test.tsx";
  const keeps = [
    "packages/design-system/src/button.tsx",
    "packages/design-system/src/button.stories.tsx",
    "packages/design-system/notes.md",
    ".quality-gate/report.test.json",
    ".orivilo/x.test.json",
    ".quality-gate/report.test.mjs",
    ".orivilo/x.test.ts",
    "packages/a/foo.tests.ts",
    "packages/a/foo-test.ts",
    "packages/a/test.ts",
    "packages/a/foo.test",
    "packages/a.test.x/b.ts",
    "scripts/x.mjs",
    // ORV-146 F1, SEC-1: Storybook loads a stories file and an app loads a data or env file,
    // whatever else the name holds.
    "packages/design-system/src/button.test.stories.tsx",
    "packages/design-system/src/button.test.stories.ts",
    "packages/design-system/src/button.stories.test.tsx",
    "apps/web/.env.test.local",
    "packages/a/foo.test.json",
    "packages/a/foo.test.css",
  ];
  for (const other of keeps) {
    blocked(noQa([test, other]), /qa\.json/);
  }
});

test("ORV-146 a: a PR with no changed file keeps the qa", () => {
  blocked(noQa([]), /qa\.json/);
});

test("ORV-146 a: a test file in a guard path still needs the owner approval", () => {
  const files = ["scripts/ovl/x.test.mjs"];
  blocked(noQa(files), /owner-approvals\/7\.json/);
  const root = noQaRoot(files);
  approval(root);
  assert.deepEqual(decide(facts(root, { pr: basePr({ files }) })), []);
});

// ---- ORV-146 point 2b: an approve survives a merge of the base branch ----

const CARRIED = "c".repeat(40);

/** ORV-1 records where the reviewer and the qa approved CARRIED, and only the gate ran on H. */
function carriedRoot(writeSet) {
  const root = goodRoot({ writeSet });
  put(root, `${RUN}/q/qa.json`, { recorded_at: at(1), report: qaReport({ head_sha: CARRIED }) });
  put(root, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(2),
    report: { head_sha: CARRIED, verdict: "approve" },
  });
  return root;
}
const carries =
  (...shas) =>
  (sha) =>
    shas.includes(sha);

test("ORV-146 b: a reviewer and a qa approve on an older head carry when carriesOver says so", () => {
  const root = carriedRoot();
  assert.deepEqual(decide(facts(root, { carriesOver: carries(CARRIED) })), []);
  blocked(decide(facts(root)), /stale/, /no reviewer\.v1 approve/);
  blocked(decide(facts(root, { carriesOver: carries(H2) })), /stale/, /no reviewer\.v1 approve/);
});

test("ORV-146 b: each of the reviewer and the qa needs its own carry", () => {
  const reviewerOnly = carriedRoot();
  put(reviewerOnly, `${RUN}/q/qa.json`, { recorded_at: at(1), report: qaReport() });
  assert.deepEqual(decide(facts(reviewerOnly, { carriesOver: carries(CARRIED) })), []);
  const reviewerStale = carriedRoot();
  put(reviewerStale, `${RUN}/q/qa.json`, {
    recorded_at: at(1),
    report: qaReport({ head_sha: H2 }),
  });
  blocked(decide(facts(reviewerStale, { carriesOver: carries(CARRIED) })), /stale/);
  const qaOnly = carriedRoot();
  put(qaOnly, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(2),
    report: { head_sha: H, verdict: "approve" },
  });
  assert.deepEqual(decide(facts(qaOnly, { carriesOver: carries(CARRIED) })), []);
  blocked(decide(facts(qaOnly)), /stale/);
});

test("ORV-146 b: a carried request_changes is a verdict, a later one on an unrelated head is not", () => {
  const rc = carriedRoot();
  put(rc, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(rc, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(6),
    report: { head_sha: CARRIED, verdict: "request_changes" },
  });
  blocked(decide(facts(rc, { carriesOver: carries(CARRIED) })), /no reviewer\.v1 approve/);
  const unrelated = carriedRoot();
  put(unrelated, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(unrelated, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(6),
    report: { head_sha: H2, verdict: "request_changes" },
  });
  assert.deepEqual(decide(facts(unrelated, { carriesOver: carries(CARRIED) })), []);
});

test("ORV-146 SEC-2: a reviewer verdict on the exact head wins over an approve carried from an older head", () => {
  const rc = carriedRoot();
  put(rc, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(6),
    report: { head_sha: CARRIED, verdict: "approve" },
  });
  put(rc, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(rc, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(5),
    report: { head_sha: H, verdict: "request_changes" },
  });
  blocked(decide(facts(rc, { carriesOver: carries(CARRIED) })), /no reviewer\.v1 approve/);
  // The other way round: an approve on the exact head wins over a carried request_changes.
  const ok = carriedRoot();
  put(ok, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(5),
    report: { head_sha: CARRIED, verdict: "request_changes" },
  });
  put(ok, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(ok, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(4),
    report: { head_sha: H, verdict: "approve" },
  });
  put(ok, `${RUN}/q/qa.json`, { recorded_at: at(1), report: qaReport() });
  assert.deepEqual(decide(facts(ok, { carriesOver: carries(CARRIED) })), []);
});

test("ORV-146 SEC-2: a qa verdict on the exact head wins over an approve carried from an older head", () => {
  const root = carriedRoot();
  put(root, `${RUN}/q/qa.json`, { recorded_at: at(6), report: qaReport({ head_sha: CARRIED }) });
  put(root, `${RUN}/q2/envelope.json`, { task_id: "q2", role: "qa", write_set: [] });
  put(root, `${RUN}/q2/qa.json`, {
    recorded_at: at(5),
    report: qaReport({ verdict: "request_changes" }),
  });
  blocked(decide(facts(root, { carriesOver: carries(CARRIED) })), /request_changes/);
  const ok = carriedRoot();
  put(ok, `${RUN}/q/qa.json`, {
    recorded_at: at(5),
    report: qaReport({ head_sha: CARRIED, verdict: "request_changes" }),
  });
  put(ok, `${RUN}/q2/envelope.json`, { task_id: "q2", role: "qa", write_set: [] });
  put(ok, `${RUN}/q2/qa.json`, { recorded_at: at(4), report: qaReport() });
  assert.deepEqual(decide(facts(ok, { carriesOver: carries(CARRIED) })), []);
});

test("ORV-146 SEC-2: a request_changes and a later approve on the same carried head hold", () => {
  const root = carriedRoot();
  put(root, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(6),
    report: { head_sha: CARRIED, verdict: "approve" },
  });
  put(root, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(root, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(3),
    report: { head_sha: CARRIED, verdict: "request_changes" },
  });
  put(root, `${RUN}/q2/envelope.json`, { task_id: "q2", role: "qa", write_set: [] });
  put(root, `${RUN}/q2/qa.json`, {
    recorded_at: at(0),
    report: qaReport({ head_sha: CARRIED, verdict: "request_changes" }),
  });
  assert.deepEqual(decide(facts(root, { carriesOver: carries(CARRIED) })), []);
});

test("ORV-146 SEC-2: a reviewer result with no report is ignored, not a crash", () => {
  for (const root of [goodRoot(), carriedRoot()]) {
    put(root, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
    put(root, `${RUN}/r2/result.json`, { contract: "reviewer.v1", recorded_at: at(7) });
    assert.deepEqual(decide(facts(root, { carriesOver: carries(CARRIED) })), []);
  }
});

test("ORV-146 SEC-2: a qa.json with no head sha carries nothing, whatever carriesOver says", () => {
  const root = goodRoot();
  put(root, `${RUN}/q/qa.json`, {
    recorded_at: at(1),
    report: qaReport({ head_sha: undefined }),
  });
  blocked(decide(facts(root, { carriesOver: () => true })), /qa\.json/);
});

test("ORV-146 SEC-2: a carried approve holds only when no other carried head requests changes", () => {
  const MID = "d".repeat(40);
  const reviewer = carriedRoot();
  put(reviewer, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(6),
    report: { head_sha: CARRIED, verdict: "approve" },
  });
  put(reviewer, `${RUN}/r2/envelope.json`, { task_id: "r2", role: "reviewer", write_set: [] });
  put(reviewer, `${RUN}/r2/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(5),
    report: { head_sha: MID, verdict: "request_changes" },
  });
  blocked(
    decide(facts(reviewer, { carriesOver: carries(CARRIED, MID) })),
    /no reviewer\.v1 approve/,
  );
  assert.deepEqual(decide(facts(reviewer, { carriesOver: carries(CARRIED) })), []);
  const qa = carriedRoot();
  put(qa, `${RUN}/q/qa.json`, { recorded_at: at(6), report: qaReport({ head_sha: CARRIED }) });
  put(qa, `${RUN}/q2/envelope.json`, { task_id: "q2", role: "qa", write_set: [] });
  put(qa, `${RUN}/q2/qa.json`, {
    recorded_at: at(5),
    report: qaReport({ head_sha: MID, verdict: "request_changes" }),
  });
  blocked(decide(facts(qa, { carriesOver: carries(CARRIED, MID) })), /request_changes/);
  assert.deepEqual(decide(facts(qa, { carriesOver: carries(CARRIED) })), []);
});

test("ORV-146 b: a carried qa that did not approve, or is for another PR, still blocks", () => {
  const rc = carriedRoot();
  put(rc, `${RUN}/q/qa.json`, {
    recorded_at: at(1),
    report: qaReport({ head_sha: CARRIED, verdict: "request_changes" }),
  });
  blocked(decide(facts(rc, { carriesOver: carries(CARRIED) })), /request_changes/);
  const other = carriedRoot();
  put(other, `${RUN}/q/qa.json`, {
    recorded_at: at(1),
    report: qaReport({ head_sha: CARRIED, pr: 6 }),
  });
  blocked(decide(facts(other, { carriesOver: carries(CARRIED) })), /PR 6/);
});

test("ORV-146 b: a docs-only PR keeps a reviewer approve across a base merge", () => {
  const files = ["docs/specs/ORV-1/spec.md"];
  const root = carriedRoot(files);
  drop(root, `${RUN}/gates`);
  drop(root, `${RUN}/q/qa.json`);
  const pr = basePr({ files });
  blocked(decide(facts(root, { pr })), /docs-only/);
  assert.deepEqual(decide(facts(root, { pr, carriesOver: carries(CARRIED) })), []);
});

test("ORV-146 b: a record with no head sha carries nothing, whatever carriesOver says", () => {
  const root = carriedRoot();
  put(root, `${RUN}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(2),
    report: { verdict: "approve" },
  });
  put(root, `${RUN}/q/qa.json`, { recorded_at: at(1), report: qaReport({ head_sha: H }) });
  blocked(decide(facts(root, { carriesOver: () => true })), /no reviewer\.v1 approve/);
});

test("ORV-146 b: carriesOver is not asked about the head itself", () => {
  const asked = [];
  const carriesOver = (sha) => {
    asked.push(sha);
    return false;
  };
  assert.deepEqual(decide(facts(goodRoot(), { carriesOver })), []);
  assert.deepEqual(asked, []);
});

test("ORV-146 b: the gate record and the owner approval stay bound to the exact head", () => {
  const noGate = carriedRoot();
  drop(noGate, `${RUN}/gates`);
  blocked(decide(facts(noGate, { carriesOver: carries(CARRIED) })), /gate record has sha/);
  const pr = basePr({ files: ["scripts/ovl/x.mjs"] });
  const root = carriedRoot();
  put(root, `${RUN}/b/envelope.json`, {
    task_id: "b",
    role: "builder",
    write_set: ["scripts/ovl/x.mjs"],
  });
  approval(root, { head_sha: CARRIED });
  blocked(decide(facts(root, { pr, carriesOver: carries(CARRIED) })), /owner-approvals\/7\.json/);
});

test("ORV-146 b: a carry needs a merge that touches no file the PR changes or changed", () => {
  const merge = (changed, approvedFiles = ["f.txt"]) => ({ changed, approvedFiles });
  const pr = basePr({ files: ["f.txt", "g.txt"], previousFiles: ["old.txt"] });
  assert.equal(carriesApprove(null, pr), false);
  assert.equal(carriesApprove(merge([]), pr), true);
  assert.equal(carriesApprove(merge(["c.txt", "d/e.txt"]), pr), true);
  assert.equal(carriesApprove(merge(["c.txt", "g.txt"]), pr), false);
  assert.equal(carriesApprove(merge(["old.txt"]), pr), false);
  assert.equal(carriesApprove(merge(["dropped.txt"], ["dropped.txt"]), pr), false);
});

const ci = (over = {}) => ({ ...pass("check"), workflow: "CI", ...over });
const release = (over) =>
  basePr({ number: 8, baseRefName: "main", headRefName: "develop", ...over });

test("ORV-115 rows 1 and 2: a release PR with green CI needs no record, guard files or not", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  const f = (pr, checks = [ci()]) => decide(facts(root, { pr, checks }));
  assert.deepEqual(f(release()), []);
  const guards = ["scripts/ovl/x.mjs", ".claude/hooks/x.mjs", ".claude/settings.json"];
  assert.deepEqual(f(release({ files: [...guards, ".github/workflows/ci.yml"] })), []);
  assert.deepEqual(f(release(), [ci(), pass("other")]), []);
});

test("ORV-115 row 3: a failing or pending check blocks the release, a Vercel waiver is the owner's", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  const f = (checks) => decide(facts(root, { pr: release(), checks }));
  blocked(f([ci(), { ...pass("lint"), bucket: "fail" }]), /check "lint" is fail/);
  blocked(f([ci(), { ...pass("build"), bucket: "pending" }]), /check "build" is pending/);
  blocked(f([ci(), vercel()]), /Vercel/, /owner-waivers\/8\.json/);
  put(root, ".orivilo/owner-waivers/8.json", {
    by: "owner",
    pr: 8,
    head_sha: H,
    checks: ["Vercel – orivilo"],
    at: at(1),
  });
  assert.deepEqual(f([ci(), vercel()]), []);
});

test("ORV-115 row 4: no checks, or no passing CI check, blocks the release", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  const f = (checks) => decide(facts(root, { pr: release(), checks }));
  blocked(f([]), /the PR has no checks/);
  blocked(f([pass("lint")]), /a release into main needs a passing CI check/);
  blocked(f([ci({ bucket: "fail" })]), /check "check" is fail/, /passing CI check/);
});

test("ORV-115 row 5: only develop goes into main, an approval record does not change it", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  put(root, ".orivilo/owner-approvals/8.json", {
    by: "owner",
    pr: 8,
    head_sha: H,
    at: at(1),
  });
  const pr = release({ headRefName: "feature/ORV-1-x" });
  blocked(
    decide(facts(root, { pr, checks: [ci()] })),
    /only the release PR from this repository's develop/,
  );
  blocked(
    decide(facts(root, { pr: basePr({ baseRefName: "release/x" }) })),
    /only into develop or main/,
  );
});

test("ORV-115 SEC-1: a head named develop from a fork, or with no repository field, is refused", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-"));
  const f = (pr) => decide(facts(root, { pr, checks: [ci()] }));
  blocked(f(release({ isCrossRepository: true })), /this repository's develop/);
  blocked(f(release({ isCrossRepository: undefined })), /this repository's develop/);
});

test("ORV-115 SEC-3: a guard file renamed out of its path is judged by its previous path", () => {
  const pr = basePr({ files: ["scripts/x.mjs"], previousFiles: [".github/workflows/ci.yml"] });
  blocked(decide(facts(goodRoot(), { pr })), /guard files \(\.github\/workflows\/ci\.yml\)/);
});

// CLI: a fixture gh on PATH and a throwaway git repo that holds the records.
function cli(over = {}, { head = H, noGh = false, badQa = false, canary = false } = {}) {
  const repo = mkdtempSync(join(tmpdir(), "mcr-"));
  execFileSync("git", ["init", "-q", repo]);
  cpSync(join(goodRoot(), ".orivilo"), join(repo, ".orivilo"), { recursive: true });
  if (badQa) put(repo, `${RUN}/q/qa.json`, "not json");
  const bin = mkdtempSync(join(tmpdir(), "mcbin-"));
  const title = canary ? "ORV-1: CANARY" : "ORV-1: x";
  const { files: _files, ...view } = { ...basePr(), title };
  put(bin, "view.json", view);
  put(bin, "files.json", [[{ filename: "scripts/x.mjs" }]]);
  const checks = over.checks ?? [{ ...pass("check"), description: canary ? "CANARY" : "" }];
  put(bin, "checks.json", checks);
  const gh = join(bin, "gh");
  writeFileSync(
    gh,
    `#!/bin/sh\ncase "$2" in view) cat '${bin}/view.json' ;; checks) cat '${bin}/checks.json' ;; repos/*) cat '${bin}/files.json' ;; esac\nexit ${over.exit ?? 0}\n`,
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

// ORV-146: the whole check on a real repo, an approve given on h0 and a head that merged develop.
function carryCli({ prFiles = ["f.txt"], ownCommit = false } = {}) {
  const { work, h0, advance, mergeBase, cloneOrigin } = mergeRepo();
  // The checkout that runs merge-check is cloned before develop moves and has neither the head nor the new develop.
  const check = cloneOrigin();
  advance("c.txt");
  let head = mergeBase();
  if (ownCommit) head = commitFile(work, "g.txt");
  gitIn(work, "push", "-q", "origin", `${head}:refs/pull/7/head`);
  const run = ".orivilo/runs/ORV-1";
  put(check, `${run}/b/envelope.json`, { task_id: "b", role: "builder", write_set: prFiles });
  put(check, `${run}/b/agent.json`, { agent_id: "a" });
  put(check, `${run}/q/envelope.json`, { task_id: "q", role: "qa", write_set: [] });
  put(check, `${run}/q/qa.json`, {
    recorded_at: at(1),
    report: qaReport({ head_sha: h0 }),
  });
  put(check, `${run}/r/envelope.json`, { task_id: "r", role: "reviewer", write_set: [] });
  put(check, `${run}/r/result.json`, {
    contract: "reviewer.v1",
    recorded_at: at(2),
    report: { head_sha: h0, verdict: "approve" },
  });
  put(check, `${run}/gates/${at(0)}.json`, {
    ok: true,
    sha: head,
    dirty: false,
    steps_source: "gate",
    recorded_at: at(0),
  });
  const bin = mkdtempSync(join(tmpdir(), "mcbin-"));
  const { files: _files, ...view } = basePr({
    headRefOid: head,
    files: prFiles,
    changedFiles: prFiles.length,
  });
  put(bin, "view.json", view);
  put(bin, "files.json", [prFiles.map((filename) => ({ filename }))]);
  put(bin, "checks.json", [pass("check")]);
  const gh = join(bin, "gh");
  writeFileSync(
    gh,
    `#!/bin/sh\ncase "$2" in view) cat '${bin}/view.json' ;; checks) cat '${bin}/checks.json' ;; repos/*) cat '${bin}/files.json' ;; esac\nexit 0\n`,
  );
  chmodSync(gh, 0o755);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
  return runMergeCheck(["7", "--head", head], { cwd: check, env });
}

test("ORV-146 b as a CLI: reviewer and qa approves on h0 hold across a merge of develop", () => {
  assert.deepEqual(carryCli(), { code: 0, stderr: "" });
});

test("ORV-146 b as a CLI: a merge that touches a file of the PR, or a commit of its own, drops them", () => {
  for (const r of [
    carryCli({ prFiles: ["f.txt", "c.txt"] }),
    carryCli({ prFiles: ["f.txt", "g.txt"], ownCommit: true }),
  ]) {
    assert.equal(r.code, 2);
    assert.match(r.stderr, /stale/);
    assert.match(r.stderr, /no reviewer\.v1 approve/);
  }
});
