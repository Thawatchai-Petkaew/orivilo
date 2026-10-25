// The quality-gate report never calls a failure a pass (ORV-13). Run with `node --test scripts/`.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  STEPS,
  USAGE,
  buildReport,
  parseArgs,
  readGit,
  reportEnv,
  summarize,
  toMarkdown,
} from "./quality-gate.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "quality-gate.mjs");

/** Runs main() as a child in a fresh git repo with a stub step list. */
function runGate(steps, { args = [], env = {} } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "qgate-"));
  const git = (...a) =>
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir });
  git("init", "-q");
  git("commit", "-q", "--allow-empty", "-m", "init");
  const stepsFile = path.join(dir, "steps.json");
  writeFileSync(stepsFile, JSON.stringify(steps));
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, QUALITY_GATE_STEPS_FILE: stepsFile, ...env },
  });
  const read = (f) => {
    try {
      return readFileSync(path.join(dir, ".quality-gate", f), "utf8");
    } catch {
      return undefined;
    }
  };
  return {
    ...r,
    json: read("report.json") && JSON.parse(read("report.json")),
    raw: read("report.json"),
  };
}

const node = (code) => ["node", "-e", code];

const git = { branch: "chore/x", sha: "abc1234", dirty: false };
const ok = (name) => ({ name, exitCode: 0, durationMs: 1000, output: "done" });

test("every step passing makes the report pass", () => {
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git,
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.ok, true);
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(
    report.steps.map((s) => s.status),
    STEPS.map(() => "pass"),
  );
});

test("one failing step fails the report and is named", () => {
  const results = STEPS.map((s) =>
    s.name === "test" ? { ...ok("test"), exitCode: 1 } : ok(s.name),
  );
  const report = buildReport({ results, git, startedAt: "t0", finishedAt: "t1" });
  assert.equal(report.ok, false);
  assert.equal(report.steps.find((s) => s.name === "test").status, "fail");
});

test("a step that never ran is 'not run' and fails the report", () => {
  const report = buildReport({ results: [ok("format")], git, startedAt: "t0", finishedAt: "t1" });
  assert.equal(report.ok, false);
  assert.equal(report.steps.find((s) => s.name === "build").status, "not run");
});

test("summary keeps test counts and failures, without colour codes", () => {
  const out =
    "noise\n\u001b[32m Tests  2 failed | 2483 passed (2485)\u001b[39m\n FAIL  storybook  Canvas > Viewport\nmore noise\n";
  const { summary, tail } = summarize(out);
  assert.deepEqual(summary, [
    "Tests  2 failed | 2483 passed (2485)",
    "FAIL  storybook  Canvas > Viewport",
  ]);
  assert.equal(tail.at(-1), "more noise");
});

test("summary keeps per-package test counts, turbo cache lines, and drops durations", () => {
  const out = [
    "@orivilo/auth:test:       Tests  22 passed (22)",
    "@orivilo/auth:test:    Duration  1.2s (transform 41%, import 40%, tests 17%)",
    "@orivilo/design-system:test:       Tests  2499 passed (2499)",
    "Cached:    0 cached, 5 total",
  ].join("\n");
  assert.deepEqual(summarize(out).summary, [
    "@orivilo/auth:test:       Tests  22 passed (22)",
    "@orivilo/design-system:test:       Tests  2499 passed (2499)",
    "Cached:    0 cached, 5 total",
  ]);
});

test("markdown names the result and each step", () => {
  const results = STEPS.map((s) =>
    s.name === "lint" ? { ...ok("lint"), exitCode: 2 } : ok(s.name),
  );
  const md = toMarkdown(buildReport({ results, git, startedAt: "t0", finishedAt: "t1" }));
  assert.match(md, /\*\*Quality gate: FAIL\*\*/);
  assert.match(md, /\| lint \| fail \|/);
  assert.match(md, /\| build \| pass \|/);
});

test("markdown shows a 7-char sha while the report keeps the full 40-hex sha", () => {
  const full = "0123456789abcdef0123456789abcdef01234567";
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git: { branch: "chore/x", sha: full, dirty: false },
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.git.sha, full);
  const md = toMarkdown(report);
  assert.match(md, /chore\/x @ 0123456\)/);
  assert.ok(!md.includes(full));
});

test("readGit reports the full 40-hex HEAD sha", () => {
  assert.match(readGit().sha, /^[0-9a-f]{40}$/);
});

test("--only and --bail", () => {
  assert.deepEqual(parseArgs(["--only", "lint,test"]), { bail: false, only: ["lint", "test"] });
  assert.deepEqual(parseArgs(["--only=build", "--bail"]), { bail: true, only: ["build"] });
  assert.deepEqual(parseArgs([]), { bail: false, only: undefined });
});

test("--only with an unknown step name throws", () => {
  assert.throws(() => parseArgs(["--only", "lnt"]), /unknown step "lnt"/);
  assert.throws(() => parseArgs(["--only=lint,nope"]), /unknown step "nope"/);
});

test("--only without a value throws", () => {
  assert.throws(() => parseArgs(["--only"]), /--only needs/);
  assert.throws(() => parseArgs(["--only", "--bail"]), /--only needs/);
  assert.throws(() => parseArgs(["--only="]), /--only needs/);
});

test("a filtered run lists every step, marks the rest 'not run', and is partial and not ok", () => {
  const only = ["format"];
  const report = buildReport({
    results: [ok("format")],
    only,
    git,
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.ok, false);
  assert.equal(report.partial, true);
  assert.equal(report.steps.length, STEPS.length);
  const lint = report.steps.find((s) => s.name === "lint");
  assert.equal(lint.status, "not run");
  assert.equal(lint.reason, "excluded by --only");
  assert.equal(report.steps.find((s) => s.name === "format").status, "pass");
});

test("a full run is not partial", () => {
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git,
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.partial, false);
});

test("a run with zero steps is not ok", () => {
  const report = buildReport({ results: [], git, startedAt: "t0", finishedAt: "t1" });
  assert.equal(report.ok, false);
});

test("a sha that changed during the run fails the report with a reason", () => {
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git,
    gitEnd: { ...git, sha: "def5678" },
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.ok, false);
  assert.match(report.problems.join("\n"), /HEAD changed/);
});

test("unreadable git fails the report with a reason", () => {
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git: { ...git, sha: "unknown" },
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.ok, false);
  assert.match(report.problems.join("\n"), /git/);
});

test("the gate runs pnpm test:scripts after format and commits, and the test step requires the database", () => {
  assert.deepEqual(STEPS.map((s) => s.name).slice(0, 3), ["format", "commits", "scripts"]);
  assert.deepEqual(STEPS.find((s) => s.name === "scripts").command, ["pnpm", "test:scripts"]);
  assert.equal(STEPS.find((s) => s.name === "test").env.REQUIRE_DB_TESTS, "1");
});

test("reportEnv records the database URL as set or unset, never the value", () => {
  const secret = "postgres://u:secret@h/db";
  const env = reportEnv({ TEST_DATABASE_URL: secret });
  assert.equal(env.TEST_DATABASE_URL, "set");
  assert.equal(reportEnv({}).TEST_DATABASE_URL, "unset");
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git,
    env,
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.ok(!JSON.stringify(report).includes("u:secret@h"));
});

test("an unset TEST_DATABASE_URL is a named problem when the test step ran", () => {
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git,
    env: reportEnv({}),
    startedAt: "t0",
    finishedAt: "t1",
  });
  assert.equal(report.ok, false);
  assert.match(report.problems.join("\n"), /TEST_DATABASE_URL is unset/);
});

test("summary keeps node:test pass and fail totals", () => {
  assert.deepEqual(summarize("# pass 12\n# fail 1\nℹ pass 3\nnoise").summary, [
    "# pass 12",
    "# fail 1",
    "ℹ pass 3",
  ]);
});

test("the test step keeps going past a failing package", () => {
  assert.ok(STEPS.find((s) => s.name === "test").command.includes("--continue"));
});

test("an unknown flag throws", () => {
  assert.throws(() => parseArgs(["--bial"]), /unknown option "--bial"/);
});

test("main: an unknown flag prints usage and exits 2", () => {
  const r = runGate([{ name: "a", command: node("0") }], { args: ["--bial"] });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Usage:/);
});

test("main: a stub run is never ok, says so, and the report never holds the database URL", () => {
  const r = runGate([{ name: "a", command: node("0") }], {
    env: { TEST_DATABASE_URL: "postgres://u:secret@h/db" },
  });
  assert.equal(r.status, 1);
  assert.equal(r.json.ok, false);
  assert.equal(r.json.stepsSource, "stub");
  assert.match(
    r.json.problems.join("\n"),
    /steps replaced by QUALITY_GATE_STEPS_FILE \(test hook\)/,
  );
  assert.equal(r.json.steps[0].status, "pass");
  assert.equal(r.json.env.TEST_DATABASE_URL, "set");
  assert.ok(!r.raw.includes("u:secret@h"));
});

test("main: a HEAD that moves during the run fails the report (end-of-run git read)", () => {
  const commit = `require("child_process").execSync("git -c user.name=t -c user.email=t@t commit -q --allow-empty -m two")`;
  const r = runGate([{ name: "a", command: node(commit) }]);
  assert.equal(r.status, 1);
  assert.equal(r.json.ok, false);
  assert.match(r.json.problems.join("\n"), /HEAD changed/);
  assert.match(r.json.problems.join("\n"), /steps replaced by QUALITY_GATE_STEPS_FILE/);
});

test("a real-gate report has stepsSource gate and no stub problem", () => {
  const report = buildReport({
    results: STEPS.map((s) => ok(s.name)),
    git,
    startedAt: "t0",
    finishedAt: "t1",
    stepsSource: "gate",
  });
  assert.equal(report.stepsSource, "gate");
  assert.equal(report.ok, true);
  assert.deepEqual(report.problems, []);
});

test("markdown flags a partial run and lists problems", () => {
  const md = toMarkdown(
    buildReport({
      results: [ok("format")],
      only: ["format"],
      git,
      startedAt: "t0",
      finishedAt: "t1",
    }),
  );
  assert.match(md, /partial run/i);
});

/** The `pnpm ...` commands of the CI `run:` lines, in order. */
function ciCommands() {
  const yml = readFileSync(
    path.join(path.dirname(script), "..", ".github/workflows/ci.yml"),
    "utf8",
  );
  return [...yml.matchAll(/^\s*- run: (pnpm .+)$/gm)].map((m) => m[1]);
}

test("ORV-108 row 20: the gate and CI run commits, secrets and codescan in the same order, with --report on the scans", () => {
  const gate = Object.fromEntries(STEPS.map((s) => [s.name, s.command.join(" ")]));
  assert.equal(gate.commits, "pnpm lint:commits");
  assert.equal(gate.secrets, "pnpm scan:secrets --report");
  assert.equal(gate.codescan, "pnpm scan:code --report");
  assert.equal(gate.audit, "pnpm audit --prod --audit-level high");
  const names = STEPS.map((s) => s.name);
  assert.equal(names[names.indexOf("format") + 1], "commits");
  const shared = ["format", "commits", "lint", "secrets", "codescan", "typecheck", "audit"];
  const ci = ciCommands();
  const inCi = shared.map((n) => ci.indexOf(gate[n]));
  assert.ok(
    inCi.every((i) => i >= 0),
    "every shared step is a CI run line",
  );
  assert.deepEqual(
    inCi,
    [...inCi].sort((x, y) => x - y),
    "CI runs them in the gate order",
  );
  const inGate = shared.map((n) => names.indexOf(n));
  assert.deepEqual(
    inGate,
    [...inGate].sort((x, y) => x - y),
  );
});

test("ORV-108 row 20: USAGE lists the three new steps", () => {
  for (const name of ["commits", "secrets", "codescan"])
    assert.match(USAGE, new RegExp(`\\b${name}\\b`));
});

test("ORV-108 row 21: CI checks out the full history and adds no action, secret or permission", () => {
  const yml = readFileSync(
    path.join(path.dirname(script), "..", ".github/workflows/ci.yml"),
    "utf8",
  );
  assert.match(yml, /actions\/checkout@v4\n\s+with:\n\s+fetch-depth: 0/);
  assert.deepEqual([...new Set([...yml.matchAll(/uses: (\S+)/g)].map((m) => m[1]))].sort(), [
    "actions/cache@v4",
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "pnpm/action-setup@v4",
  ]);
  assert.doesNotMatch(yml, /secrets\./);
  assert.match(yml, /permissions:\n\s+contents: read/);
});
