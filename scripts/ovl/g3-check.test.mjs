// ORV-98 task 2: g3-check, the call stage, the records stage and the standalone pre-check
// (spec ORV-98 v1.1 rows 2 to 21). Fixture gh and git shims on PATH, throwaway repos only. No Jira call.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { handle } from "./hook.mjs";
import { g3Check } from "./g3-check.mjs";
import {
  fixture,
  heartbeatLines,
  hook,
  makeRepo,
  registeredCommands,
  runNode,
} from "./hook-test-kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const H = "a".repeat(40);
const KINDS = ["direct", "write", "destructive"];
const FILES = {
  direct: "PreToolUse-mcp-transitionJiraIssue",
  write: "PreToolUse-mcp-executeWrite",
  destructive: "PreToolUse-mcp-executeDestructive",
};
const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const scratch = () => realpathSync(mkdtempSync(join(tmpdir(), "g3-")));
const last = (root) => heartbeatLines(root).at(-1);

/** A recorded sample with `f` ({key, id, name}; an absent property is left out) in the right place. */
function build(kind, f, cwd, toolName = "transitionJiraIssue") {
  const base = fixture(FILES[kind]);
  const fields = { issueIdOrKey: "key" in f ? f.key : "ORV-1" };
  if ("id" in f) fields.transitionId = f.id;
  if ("name" in f) fields.transitionName = f.name;
  const tool_input =
    kind === "direct"
      ? { cloudId: base.tool_input.cloudId, ...fields }
      : { cloudId: base.tool_input.cloudId, name: toolName, inputs: fields };
  return { ...base, cwd, tool_input };
}

const run = (input, env) => runNode(hook("g3-check.mjs"), input, env);

// ---- fixture shims: git answers the repo URL, gh prints a file and logs its calls ----
const SHIM_URL = "https://github.com/Thawatchai-Petkaew/orivilo.git";
function shims({ list = [], text = null, exit = 0, withGh = true, failGit = "" } = {}) {
  const dir = join(scratch(), "shim");
  mkdirSync(dir);
  const real = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const put = (name, body) => {
    writeFileSync(join(dir, name), body);
    chmodSync(join(dir, name), 0o755);
  };
  put(
    "git",
    `#!/bin/sh
if [ "$1" = '${failGit}' ]; then echo boom >&2; exit 1; fi
if [ "$1" = ls-remote ] && [ "$2" = --get-url ]; then echo '${SHIM_URL}'; exit 0; fi
exec '${real}' "$@"
`,
  );
  writeFileSync(join(dir, "out.txt"), text ?? JSON.stringify(list));
  if (withGh) {
    put("gh", `#!/bin/sh\necho "$@" >> '${dir}/gh-calls'\ncat '${dir}/out.txt'\nexit ${exit}\n`);
  }
  const path = withGh ? `${dir}:${process.env.PATH}` : `${dir}:/usr/bin:/bin`;
  return {
    env: { PATH: path },
    ghCalls: () =>
      existsSync(join(dir, "gh-calls"))
        ? readFileSync(join(dir, "gh-calls"), "utf8").split("\n").filter(Boolean)
        : [],
  };
}

const pr = (n, over = {}) => ({
  number: n,
  state: "MERGED",
  title: "ORV-1: x",
  headRefName: "feature/ORV-1-x",
  headRefOid: H,
  mergedAt: "2026-10-24T10:00:00Z",
  ...over,
});

// ---- fixture origin: develop holds the real guard scripts and a stub merge-check ----
const STUB_MERGE_CHECK = `import { writeFileSync } from "node:fs";
export function runMergeCheck(argv, { env }) {
  if (env.STUB_ARGS) writeFileSync(env.STUB_ARGS, argv.join(" "));
  if (env.STUB_DENY === argv[0]) {
    return { code: 2, stderr: "merge-check blocked:\\n- no qa.json for ORV-1 on " + argv[2] };
  }
  return { code: 0, stderr: "" };
}
`;
const IDENTITY = [
  ["user.email", "t@example.com"],
  ["user.name", "t"],
  ["commit.gpgsign", "false"],
];
function fixtureOrigin({ withG3 = true } = {}) {
  const base = scratch();
  const origin = join(base, "origin.git");
  const seed = join(base, "seed");
  const clone = join(base, "clone");
  git(base, "init", "--bare", "-b", "develop", origin);
  git(base, "init", "-b", "develop", seed);
  for (const [key, value] of IDENTITY) git(seed, "config", key, value);
  const ovl = join(seed, "scripts", "ovl");
  mkdirSync(ovl, { recursive: true });
  copyFileSync(join(here, "hook.mjs"), join(ovl, "hook.mjs"));
  copyFileSync(join(here, "develop-export.mjs"), join(ovl, "develop-export.mjs"));
  if (withG3) copyFileSync(join(here, "g3-check.mjs"), join(ovl, "g3-check.mjs"));
  writeFileSync(join(ovl, "merge-check.mjs"), STUB_MERGE_CHECK);
  git(seed, "add", ".");
  git(seed, "commit", "-m", "seed");
  git(seed, "push", origin, "develop");
  git(base, "clone", "-b", "develop", origin, clone);
  for (const [key, value] of IDENTITY) git(clone, "config", key, value);
  return { clone, develop: git(seed, "rev-parse", "HEAD") };
}

const G3 = { id: "4" };

// ---- row 2, 3: allowed moves ----

test("row 2: a known id or name to a status other than G3 PR review is allowed with no gh call", () => {
  const repo = makeRepo();
  const shim = shims();
  const moves = [
    { id: "3" },
    { id: "10" },
    { id: "21" },
    { id: "9" },
    { name: "Build" },
    { name: "In Progress" },
    { name: "To Do" },
  ];
  let count = 0;
  for (const kind of KINDS) {
    for (const move of moves) {
      const r = run(build(kind, move, repo), shim.env);
      assert.deepEqual([r.code, r.stderr], [0, ""], `${kind} ${JSON.stringify(move)}`);
      assert.equal(last(repo).decision, "allow");
      count += 1;
    }
  }
  const both = run(build("direct", { id: "21", name: "In Progress" }, repo), shim.env);
  assert.equal(both.code, 0);
  assert.equal(heartbeatLines(repo).length, count + 1);
  assert.equal(shim.ghCalls().length, 0);
  assert.equal(existsSync(join(repo, ".orivilo", "exports")), false);
});

test("row 3: an execute call that is not a transition is allowed without reading the id list", () => {
  const repo = makeRepo();
  const shim = shims();
  for (const kind of ["write", "destructive"]) {
    for (const name of ["addCommentToJiraIssue", "createJiraIssue"]) {
      const r = run(build(kind, { key: "ORV-1" }, repo, name), shim.env);
      assert.equal(r.code, 0, `${kind} ${name}`);
      assert.equal(last(repo).decision, "allow");
    }
  }
  const noList = handle(
    "g3-check",
    JSON.stringify(build("write", {}, repo, "createJiraIssue")),
    g3Check({ transitionsPath: join(scratch(), "missing.json") }),
  );
  assert.equal(noList.code, 0);
  assert.equal(shim.ghCalls().length, 0);
});

// ---- row 4: unknown targets fail closed ----

test("row 4: an unknown id or name, a mismatch or neither blocks, with no gh call", () => {
  const repo = makeRepo();
  const shim = shims();
  const cases = [
    [{ id: "99" }, /transition id is not in scripts\/ovl\/jira-transitions\.json/],
    [{ id: "4a" }, /not in scripts\/ovl\/jira-transitions\.json/],
    [{ name: "Backlog" }, /transition name is not in scripts\/ovl\/jira-transitions\.json/],
    [{ name: "g3 pr review" }, /not in scripts\/ovl\/jira-transitions\.json/],
    [{ name: "Nope" }, /not in scripts\/ovl\/jira-transitions\.json/],
    [{}, /names no transition/],
    [{ name: 42 }, /names no transition/],
    [{ id: "3", name: "G3 PR review" }, /different transitions/],
  ];
  let count = 0;
  for (const kind of KINDS) {
    for (const [move, reason] of cases) {
      const r = run(build(kind, move, repo), shim.env);
      assert.equal(r.code, 2, `${kind} ${JSON.stringify(move)}`);
      assert.match(r.stderr, /^g3-check blocked:/);
      assert.match(r.stderr, reason, `${kind} ${JSON.stringify(move)}`);
      assert.equal(last(repo).decision, "block");
      count += 1;
    }
  }
  assert.equal(heartbeatLines(repo).length, count);
  assert.equal(shim.ghCalls().length, 0);
});

// ---- row 5: a broken id list fails closed ----

test("row 5: a missing or malformed id list fails closed, naming the list", () => {
  const repo = makeRepo();
  const good = JSON.parse(readFileSync(join(here, "jira-transitions.json"), "utf8"));
  const dir = scratch();
  const write = (name, value) => {
    writeFileSync(join(dir, name), typeof value === "string" ? value : JSON.stringify(value));
    return join(dir, name);
  };
  const noG3 = structuredClone(good);
  delete noG3.transitions[4];
  const withEntry = (entry) => ({ transitions: { ...good.transitions, 3: entry } });
  const lists = [
    join(dir, "missing.json"),
    write("bad.json", "{not json"),
    write("no-transitions.json", { project: "ORV" }),
    write("no-g3.json", noG3),
    write("no-name.json", withEntry({ to: "Build" })),
    write("no-to.json", withEntry({ name: "Build" })),
    write("dup-name.json", withEntry({ name: "Done", to: "Build" })),
  ];
  for (const transitionsPath of lists) {
    for (const move of [{ id: "3" }, { name: "Build" }]) {
      const r = handle(
        "g3-check",
        JSON.stringify(build("direct", move, repo)),
        g3Check({ transitionsPath }),
      );
      assert.equal(r.code, 2, transitionsPath);
      assert.match(r.stderr, /^g3-check failed closed:/);
      assert.match(r.stderr, /jira-transitions\.json/);
      assert.equal(last(repo).decision, "error");
    }
  }
});

// ---- row 6: the real id list ----

test("row 6: the real id list holds exactly the twelve recorded transitions", () => {
  const list = JSON.parse(readFileSync(join(here, "jira-transitions.json"), "utf8"));
  const names = {
    2: "G2 review",
    3: "Build",
    4: "G3 PR review",
    5: "Staging",
    6: "G4 review",
    7: "Release",
    8: "G5 review",
    9: "Done",
    10: "Design",
  };
  const expected = {};
  for (const [id, name] of Object.entries(names)) expected[id] = { name, to: name };
  expected[11] = { name: "To Do", to: "Backlog" };
  expected[21] = { name: "In Progress", to: "Discovery" };
  expected[31] = { name: "In Review", to: "G1 Scope review" };
  assert.deepEqual(list.transitions, expected);
  assert.equal(list.project, "ORV");
});

// ---- rows 7 to 15: the records stage ----

test("row 7: a merged PR whose records pass allows the move by id, by name and through executeWrite", () => {
  const { clone, develop } = fixtureOrigin();
  const shim = shims({ list: [pr(7)] });
  const args = join(scratch(), "args");
  const env = { ...shim.env, STUB_ARGS: args };
  for (const input of [
    build("direct", G3, clone),
    build("direct", { name: "G3 PR review" }, clone),
    build("write", G3, clone),
  ]) {
    const r = run(input, env);
    assert.deepEqual([r.code, r.stderr], [0, ""]);
    assert.equal(last(clone).decision, "allow");
    assert.equal(readFileSync(args, "utf8"), `7 --head ${H}`);
  }
  assert.deepEqual(readdirSync(join(clone, ".orivilo")).sort(), ["exports", "heartbeat.jsonl"]);
  assert.ok(existsSync(join(clone, ".orivilo", "exports", develop)));
  assert.match(shim.ghCalls()[0], /^pr list --base develop --state all --search ORV-1 in:title/);
});

test("row 8: no merged PR of the issue blocks", () => {
  const { clone } = fixtureOrigin();
  const lists = [
    [],
    [pr(7, { state: "CLOSED", mergedAt: null })],
    [pr(7, { state: "OPEN", mergedAt: null })],
  ];
  for (const list of lists) {
    const shim = shims({ list });
    for (const move of [G3, { name: "G3 PR review" }]) {
      const r = run(build("direct", move, clone), shim.env);
      assert.equal(r.code, 2);
      assert.match(r.stderr, /^g3-check blocked:/);
      assert.match(r.stderr, /no PR of ORV-1 is merged into develop|PR 7 of ORV-1 is open/);
      assert.equal(last(clone).decision, "block");
    }
  }
});

test("row 9: an open PR of the issue blocks even when another is merged", () => {
  const { clone } = fixtureOrigin();
  const shim = shims({ list: [pr(7), pr(9, { state: "OPEN", mergedAt: null })] });
  const r = run(build("direct", G3, clone), shim.env);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /PR 9 of ORV-1 is open, so its work is not all merged/);
});

test("row 10: a merge-check reason becomes the reason of the move", () => {
  const { clone } = fixtureOrigin();
  const shim = shims({ list: [pr(7)] });
  const r = run(build("direct", G3, clone), { ...shim.env, STUB_DENY: "7" });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^g3-check blocked:/);
  assert.ok(r.stderr.includes(`- no qa.json for ORV-1 on ${H}`));
  assert.equal(last(clone).decision, "block");
});

test("row 11: the merged PR with the latest mergedAt is judged", () => {
  const { clone } = fixtureOrigin();
  const shim = shims({
    list: [
      pr(5, { mergedAt: "2026-10-23T10:00:00Z" }),
      pr(7, { mergedAt: "2026-10-24T10:00:00Z" }),
    ],
  });
  const r = run(build("direct", G3, clone), { ...shim.env, STUB_DENY: "7" });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /PR 7/);
  const ok = run(build("direct", G3, clone), { ...shim.env, STUB_DENY: "5" });
  assert.equal(ok.code, 0);
});

test("row 12: a PR belongs to the issue only when branch key and title key both match", () => {
  const { clone } = fixtureOrigin();
  for (const odd of [
    pr(7, { headRefName: "feature/ORV-1-y", title: "ORV-10: y" }),
    pr(7, { headRefName: "feature/ORV-10-z", title: "ORV-1: z" }),
  ]) {
    const shim = shims({ list: [odd] });
    const r = run(build("direct", G3, clone), shim.env);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /no PR of ORV-1 is merged into develop/);
    assert.equal(last(clone).decision, "block");
  }
});

test("row 13: a gh list that is cut, not JSON, failing or missing never allows", () => {
  const { clone } = fixtureOrigin();
  const hundred = Array.from({ length: 100 }, (_, i) => pr(i + 1));
  const cases = [
    [shims({ list: hundred }), /may be cut/, "block"],
    [shims({ text: "not json" }), /^g3-check failed closed:/, "error"],
    [shims({ exit: 1 }), /^g3-check failed closed:/, "error"],
    [shims({ withGh: false }), /^g3-check failed closed:/, "error"],
  ];
  for (const [shim, pattern, decision] of cases) {
    const r = run(build("direct", G3, clone), shim.env);
    assert.equal(r.code, 2);
    assert.match(r.stderr, pattern);
    assert.equal(last(clone).decision, decision);
  }
});

test("row 14: develop's copies decide; the branch's replacements never run", () => {
  const { clone } = fixtureOrigin();
  const marker = join(clone, "MARKER");
  const writer = `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "ran");\n`;
  writeFileSync(join(clone, "scripts", "ovl", "g3-check.mjs"), writer);
  writeFileSync(join(clone, "scripts", "ovl", "merge-check.mjs"), writer);
  const shim = shims({ list: [pr(7)] });
  const r = run(build("direct", G3, clone), { ...shim.env, STUB_DENY: "7" });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /no qa\.json/);
  assert.equal(existsSync(marker), false);
});

test("row 15: develop without g3-check.mjs blocks; a failed ls-remote fails closed", () => {
  const { clone } = fixtureOrigin({ withG3: false });
  const shim = shims({ list: [pr(7)] });
  const r = run(build("direct", G3, clone), shim.env);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /develop has no scripts\/ovl\/g3-check\.mjs yet/);
  assert.match(r.stderr, /Jira web UI/);
  assert.equal(last(clone).decision, "block");

  const other = fixtureOrigin();
  const failing = shims({ list: [pr(7)], failGit: "ls-remote" });
  const f = run(build("direct", G3, other.clone), failing.env);
  assert.equal(f.code, 2);
  assert.match(f.stderr, /^g3-check failed closed: git ls-remote exited 1/);
  assert.equal(last(other.clone).decision, "error");
});

// ---- rows 16, 17: the key and the probe ----

test("row 16: a G3 move names the issue by its key ORV-<n>", () => {
  const repo = makeRepo();
  const shim = shims();
  for (const [key, move] of [
    ["10123", G3],
    ["orv-1", G3],
    ["SCRUM-1", G3],
    ["10123", { name: "G3 PR review" }],
  ]) {
    const r = run(build("direct", { key, ...move }, repo), shim.env);
    assert.equal(r.code, 2, key);
    assert.match(r.stderr, /names the issue by its key ORV-<n>/);
    assert.equal(last(repo).decision, "block");
  }
  assert.equal(shim.ghCalls().length, 0);
});

test("row 17: the ORV-0 probe is blocked in the call stage with no gh call or export", () => {
  const repo = makeRepo();
  const shim = shims();
  const inputs = [
    ...KINDS.map((kind) => build(kind, { key: "ORV-0", ...G3 }, repo)),
    build("direct", { key: "ORV-0", name: "G3 PR review" }, repo),
  ];
  for (const input of inputs) {
    const r = run(input, shim.env);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ORV-0 is the ovl-doctor probe/);
    assert.equal(last(repo).decision, "block");
  }
  assert.equal(shim.ghCalls().length, 0);
  assert.equal(existsSync(join(repo, ".orivilo", "exports")), false);
});

// ---- row 18: the standalone pre-check ----

test("row 18: node g3-check.mjs <ISSUE> exits 0, then 2 with the reason, then 2 on bad arguments", () => {
  const { clone } = fixtureOrigin();
  const script = join(clone, "scripts", "ovl", "g3-check.mjs");
  const exec = (args, env) => {
    const r = spawnSync(process.execPath, [script, ...args], {
      cwd: clone,
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
    return { code: r.status, stderr: r.stderr };
  };
  const shim = shims({ list: [pr(7)] });
  assert.deepEqual(exec(["ORV-1"], shim.env), { code: 0, stderr: "" });
  const denied = exec(["ORV-1"], { ...shim.env, STUB_DENY: "7" });
  assert.equal(denied.code, 2);
  assert.match(denied.stderr, /^g3-check blocked:/);
  assert.match(denied.stderr, /no qa\.json for ORV-1/);
  for (const args of [[], ["ORV-1", "extra"]]) {
    const r = exec(args, shim.env);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^g3-check failed closed: usage: g3-check\.mjs <ISSUE>/);
  }
  assert.equal(existsSync(join(clone, ".orivilo")), false);
});

// ---- row 19, 20: fail closed, no echo ----

test("row 19: malformed stdin, a missing tool_input, a foreign tool and a stray cwd never allow", () => {
  const repo = makeRepo();
  const bad = run("{not json", {});
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /^g3-check failed closed:/);
  const input = build("direct", G3, repo);
  const noInput = { ...input };
  delete noInput.tool_input;
  const foreign = { ...input, tool_name: "mcp__claude_ai_Atlassian_MCP__executeRead" };
  for (const broken of [noInput, foreign]) {
    const r = run(broken, {});
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^g3-check failed closed:/);
    assert.equal(last(repo).decision, "error");
  }
  const outside = run(build("direct", G3, scratch()), {});
  assert.equal(outside.code, 2);
  assert.match(outside.stderr, /^g3-check failed closed:/);
});

test("row 20: tool input text never reaches stderr or the heartbeat", () => {
  const repo = makeRepo();
  const shim = shims();
  const withExtras = (move) => {
    const input = build("direct", move, repo);
    input.tool_input.fields = { summary: "CANARY" };
    input.tool_input.update = { comment: [{ add: { body: "CANARY" } }] };
    return input;
  };
  const results = [
    run(withExtras({ id: "3" }), shim.env),
    run(withExtras({ id: "99" }), shim.env),
    run(withExtras({ name: "CANARY" }), shim.env),
  ];
  assert.deepEqual(
    results.map((r) => r.code),
    [0, 2, 2],
  );
  for (const r of results) assert.ok(!r.stderr.includes("CANARY"));
  assert.ok(!readFileSync(join(repo, ".orivilo", "heartbeat.jsonl"), "utf8").includes("CANARY"));
  for (const line of heartbeatLines(repo)) {
    assert.deepEqual(Object.keys(line).sort(), [
      "agent_id",
      "at",
      "decision",
      "event",
      "hook",
      "tool",
    ]);
    assert.equal(line.hook, "g3-check");
  }
});

// ---- row 21: registration ----

test("row 21: g3-check is registered once, on PreToolUse, with the Atlassian matcher", () => {
  const entries = registeredCommands().filter((c) => c.command.includes("g3-check.mjs"));
  assert.deepEqual(entries, [
    {
      event: "PreToolUse",
      matcher: "^mcp__.*[Aa]tlassian.*__(transitionJiraIssue|executeWrite|executeDestructive)$",
      command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/g3-check.mjs" || exit 2',
    },
  ]);
  const matcher = new RegExp(entries[0].matcher);
  for (const kind of ["transitionJiraIssue", "executeWrite", "executeDestructive"]) {
    assert.ok(matcher.test(`mcp__claude_ai_Atlassian_MCP__${kind}`), kind);
    assert.ok(matcher.test(`mcp__atlassian__${kind}`), kind);
  }
  assert.equal(matcher.test("mcp__claude_ai_Atlassian_MCP__executeRead"), false);
});
