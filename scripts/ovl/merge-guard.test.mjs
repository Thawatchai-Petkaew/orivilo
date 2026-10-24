// ORV-95 task 5: the merge-guard text stage and its composition with develop-export and merge-check
// (spec rows 1 to 9, 11, 12, 36 to 38). Throwaway repos only; the real .orivilo is never touched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { judge } from "./merge-guard.mjs";
import { heartbeatLines, hook, makeRepo, runNode } from "./hook-test-kit.mjs";

const H = "a".repeat(40);
const MERGE = `gh pr merge 7 --squash --match-head-commit ${H}`;
const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** One PreToolUse(Bash) call. `project` is CLAUDE_PROJECT_DIR (default: the cwd). */
function call(command, { cwd, project = cwd, agent, env = {} } = {}) {
  const input = {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command },
    cwd,
    ...(agent ? { agent_id: agent } : {}),
  };
  return judge(JSON.stringify(input), {
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, ...env },
  });
}

const scratch = () => realpathSync(mkdtempSync(join(tmpdir(), "mguard-")));

/** `gh` and `git` shims on PATH that log their calls; `git` fails for `failOn`. */
function shims(failOn = "") {
  const dir = join(scratch(), "shim");
  mkdirSync(dir);
  const real = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const write = (name, body) => {
    writeFileSync(join(dir, name), body);
    chmodSync(join(dir, name), 0o755);
  };
  write("gh", `#!/bin/sh\necho "$@" >> '${dir}/gh-calls'\nexit 0\n`);
  write(
    "git",
    `#!/bin/sh
echo "$1" >> '${dir}/git-calls'
if [ "$1" = '${failOn}' ]; then echo boom >&2; exit 1; fi
exec '${real}' "$@"
`,
  );
  const read = (name) => (existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8") : "");
  return {
    env: { PATH: `${dir}:${process.env.PATH}` },
    ghCalls: () => read("gh-calls").split("\n").filter(Boolean).length,
    gitCalls: () => read("git-calls").split("\n").filter(Boolean),
  };
}

const OK_STUB = `import { writeFileSync } from "node:fs";
if (process.env.STUB_ARGS) writeFileSync(process.env.STUB_ARGS, process.argv.slice(2).join(" "));
`;
const DENY_STUB = `process.stderr.write("merge-check blocked:\\n- no qa.json for ORV-1 on " + process.argv[4] + "\\n");
process.exit(2);
`;

/** A bare origin whose develop holds `stub` as merge-check.mjs (none when null), and a clone of it. */
function fixtureOrigin(stub) {
  const base = scratch();
  const origin = join(base, "origin.git");
  const seed = join(base, "seed");
  const clone = join(base, "clone");
  git(base, "init", "--bare", "-b", "develop", origin);
  git(base, "init", "-b", "develop", seed);
  for (const dir of [seed]) {
    git(dir, "config", "user.email", "t@example.com");
    git(dir, "config", "user.name", "t");
    git(dir, "config", "commit.gpgsign", "false");
  }
  mkdirSync(join(seed, "scripts", "ovl"), { recursive: true });
  writeFileSync(join(seed, "scripts", "ovl", "hook.mjs"), "// hook\n");
  if (stub !== null) writeFileSync(join(seed, "scripts", "ovl", "merge-check.mjs"), stub);
  git(seed, "add", ".");
  git(seed, "commit", "-m", "seed");
  git(seed, "push", origin, "develop");
  git(base, "clone", "-b", "develop", origin, clone);
  git(clone, "config", "user.email", "t@example.com");
  git(clone, "config", "user.name", "t");
  git(clone, "config", "commit.gpgsign", "false");
  return { base, clone, develop: git(seed, "rev-parse", "HEAD") };
}

const exportsOf = (root) => existsSync(join(root, ".orivilo", "exports"));
const last = (root) => heartbeatLines(root).at(-1);

// ---- text stage ----

test("row 1: pushes to develop or main are blocked for every session, with no network call", () => {
  const repo = makeRepo("feature/ORV-1-x");
  const shim = shims();
  const commands = [
    "git push origin HEAD:develop",
    "git push origin develop",
    "git push origin feature/ORV-1-x:main",
    "git push origin +HEAD:refs/heads/develop",
    "git push origin :develop",
    "git push --delete origin main",
    "git push --all",
    "git push --mirror origin",
    "sh -c 'git push origin HEAD:develop'",
    "git push origin 'HEAD:Develop'",
    "git push origin HEAD:develop > /dev/null",
    "git push origin \\\n HEAD:develop",
  ];
  for (const agent of [undefined, "a-sub"]) {
    for (const command of commands) {
      const r = call(command, { cwd: repo, agent, env: shim.env });
      assert.equal(r.code, 2, command);
      assert.match(r.stderr, /^merge-guard blocked:/, command);
      assert.match(r.stderr, /develop and main move only by a guarded PR merge/, command);
    }
  }
  assert.ok(heartbeatLines(repo).every((l) => l.decision === "block"));
  assert.equal(heartbeatLines(repo).length, commands.length * 2);
  assert.equal(shim.ghCalls(), 0);
  assert.ok(!shim.gitCalls().some((c) => ["ls-remote", "fetch", "archive"].includes(c)));
});

test("row 2: HEAD, @ and a bare push resolve to the current branch of the named checkout", () => {
  const onDevelop = makeRepo("develop");
  const onMain = makeRepo("main");
  const feature = makeRepo("feature/ORV-1-x");
  for (const command of [
    "git push origin HEAD",
    "git push origin @",
    "git push origin",
    "git push",
  ]) {
    const r = call(command, { cwd: onDevelop });
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /develop and main move only by a guarded PR merge/);
  }
  assert.equal(call("git push -u origin HEAD", { cwd: onMain }).code, 2);
  const viaC = call(`git -C ${onDevelop} push`, { cwd: feature });
  assert.equal(viaC.code, 2);
  assert.match(viaC.stderr, /^merge-guard blocked:/);
  assert.equal(last(feature).decision, "block");
});

test("row 3: ordinary git and gh calls are allowed with no gh call, ls-remote or export", () => {
  const repo = makeRepo("feature/ORV-1-x");
  const shim = shims();
  const commands = [
    "git push -u origin feature/ORV-1-x",
    "git push origin HEAD",
    "git push --delete origin feature/ORV-1-x",
    "git push --tags",
    "gh pr view 7",
    "gh pr checks 7",
    'gh pr create --base develop --title "ORV-1: x" --body "y"',
    "gh api repos/o/r/pulls/7",
    "gh api graphql -f query='query { viewer { login } }'",
    "git remote -v",
    "git config user.name",
    "ls",
  ];
  for (const command of commands) {
    const r = call(command, { cwd: repo, env: shim.env });
    assert.deepEqual(r, { code: 0, stderr: "" }, command);
  }
  assert.ok(heartbeatLines(repo).every((l) => l.decision === "allow"));
  assert.equal(shim.ghCalls(), 0);
  assert.ok(!shim.gitCalls().some((c) => ["ls-remote", "fetch", "archive"].includes(c)));
  assert.equal(exportsOf(repo), false);
});

test("row 4: gh api merge and ref paths are blocked", () => {
  const repo = makeRepo();
  for (const command of [
    "gh api -X PUT repos/o/r/pulls/7/merge",
    "gh api repos/o/r/merges -f base=develop -f head=x",
    "gh api -X PATCH repos/o/r/git/refs/heads/develop -f sha=" + H,
    "gh  api   repos/o/r/pulls/7/merge",
    'sh -c "gh api -X PUT repos/o/r/pulls/7/merge"',
  ]) {
    const r = call(command, { cwd: repo });
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /merges go through gh pr merge/);
  }
  assert.ok(heartbeatLines(repo).every((l) => l.decision === "block"));
});

test("row 5: GraphQL merge and ref mutations and unreadable queries are blocked", () => {
  const repo = makeRepo();
  const mutations = [
    "mergePullRequest",
    "enablePullRequestAutoMerge",
    "mergeBranch",
    "updateRef",
    "createRef",
    "deleteRef",
  ];
  const commands = [
    ...mutations.map(
      (m) => `gh api graphql -f query='mutation { ${m}(input: {}) { clientMutationId } }'`,
    ),
    "gh api graphql -F query=@q.graphql",
    "gh api graphql --input q.json",
  ];
  for (const command of commands) {
    const r = call(command, { cwd: repo });
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /blocked on GraphQL too, and a query the guard cannot read is blocked/);
  }
});

test("row 6: forms that repoint the remote are blocked", () => {
  const repo = makeRepo();
  for (const command of [
    `git update-ref refs/remotes/origin/develop ${H}`,
    "git remote add evil https://example.com/x.git",
    "git remote set-url origin https://example.com/x.git",
    "git config remote.origin.url https://example.com/x.git",
    "git config --get remote.origin.url",
  ]) {
    const r = call(command, { cwd: repo });
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /no session may point the merge checks at another develop/);
    assert.match(r.stderr, /git remote -v reads the remote instead/);
  }
});

test("row 7: a session never writes the waiver; a PR comment is no waiver and is allowed", () => {
  const { clone } = fixtureOrigin(OK_STUB);
  const env = { CLAUDE_PROJECT_DIR: clone };
  const waiver = join(clone, ".orivilo", "owner-waivers", "7.json");
  const command = `mkdir -p .orivilo/owner-waivers && printf '{"by":"owner","pr":%s}' 7 > .orivilo/owner-waivers/7.json`;
  const base = { hook_event_name: "PreToolUse", cwd: clone };
  const bash = runNode(
    hook("write-guard.mjs"),
    {
      ...base,
      tool_name: "Bash",
      tool_input: { command },
    },
    env,
  );
  const write = runNode(
    hook("write-guard.mjs"),
    {
      ...base,
      tool_name: "Write",
      tool_input: { file_path: waiver, content: "{}" },
    },
    env,
  );
  assert.equal(bash.code, 2);
  assert.equal(write.code, 2);
  const comment = call('gh pr comment 7 --body "waive vercel rate limit H"', { cwd: clone });
  assert.deepEqual(comment, { code: 0, stderr: "" });
  assert.deepEqual(
    heartbeatLines(clone).map((l) => [l.hook, l.decision]),
    [
      ["write-guard", "block"],
      ["write-guard", "block"],
      ["merge-guard", "allow"],
    ],
  );
  assert.equal(existsSync(waiver), false);
});

test("row 8: every gh pr merge that is not one whole allowed command is blocked, with no gh call or export", () => {
  const repo = makeRepo("feature/ORV-1-x");
  const shim = shims();
  const commands = [
    "gh pr merge",
    `gh pr merge 0 --squash --match-head-commit ${H}`,
    "gh pr merge 0 --squash",
    "gh pr merge 7 --squash",
    "gh pr merge 7 --squash --match-head-commit abc",
    `gh pr merge 7 --auto --squash --match-head-commit ${H}`,
    `gh pr merge 7 --admin --squash --match-head-commit ${H}`,
    `gh pr merge 7 --squash -R o/r --match-head-commit ${H}`,
    `gh pr merge 7 --squash --repo o/r --match-head-commit ${H}`,
    `gh pr merge 7 --squash --body "x" --match-head-commit ${H}`,
    `gh pr merge 7 --squash --match-head-commit ${H} && git pull`,
    `gh pr merge $(cat n) --squash --match-head-commit ${H}`,
    `gh pr merge 7 --squash --match-head-commit ${H}\nrm x`,
    `gh pr merge 7 --squash --merge --match-head-commit ${H}`,
    `sh -c "gh pr merge 7 --squash --match-head-commit ${H}"`,
  ];
  for (const command of commands) {
    const r = call(command, { cwd: repo, env: shim.env });
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /^merge-guard blocked:/, command);
    assert.match(r.stderr, /one whole command/, command);
    assert.match(r.stderr, /--match-head-commit <40-hex sha>/, command);
  }
  assert.ok(heartbeatLines(repo).every((l) => l.decision === "block"));
  assert.equal(shim.ghCalls(), 0);
  assert.equal(exportsOf(repo), false);
});

// ---- composition ----

test("row 9: one whole gh pr merge goes to develop's merge-check from the export and is allowed on exit 0", () => {
  for (const agent of [undefined, "a-release"]) {
    for (const command of [
      `gh pr merge 7 --squash --delete-branch --match-head-commit ${H}`,
      `gh  pr   merge  7 -s -d --match-head-commit ${H}`,
      `gh pr merge 7 --match-head-commit ${H} --rebase`,
    ]) {
      const { clone, develop } = fixtureOrigin(OK_STUB);
      const out = join(scratch(), "args");
      const r = call(command, { cwd: clone, agent, env: { STUB_ARGS: out } });
      assert.deepEqual(r, { code: 0, stderr: "" }, command);
      assert.equal(readFileSync(out, "utf8"), `7 --head ${H}`);
      assert.ok(existsSync(join(clone, ".orivilo", "exports", develop, "scripts", "ovl")));
      assert.equal(last(clone).decision, "allow");
    }
  }
});

test("row 9: a non-zero merge-check blocks and its lines become the reasons", () => {
  const { clone } = fixtureOrigin(DENY_STUB);
  const r = call(MERGE, { cwd: clone });
  assert.equal(r.code, 2);
  assert.equal(r.stderr, `merge-guard blocked:\n- no qa.json for ORV-1 on ${H}`);
  assert.equal(last(clone).decision, "block");
});

test("row 10 and 11: no merge-check on develop blocks, and the branch's copy is never run", () => {
  const { clone } = fixtureOrigin(null);
  const marker = join(clone, "MARKER");
  mkdirSync(join(clone, "scripts", "ovl"), { recursive: true });
  writeFileSync(
    join(clone, "scripts", "ovl", "merge-check.mjs"),
    `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "ran");\n`,
  );
  const r = call(MERGE, { cwd: clone });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^merge-guard blocked:/);
  assert.match(r.stderr, /develop has no scripts\/ovl\/merge-check\.mjs yet/);
  assert.match(r.stderr, /GitHub web UI/);
  assert.equal(existsSync(marker), false);
  assert.equal(last(clone).decision, "block");
});

test("row 11: develop's copy decides; the branch's replacement is never run", () => {
  const { clone } = fixtureOrigin(DENY_STUB);
  const marker = join(clone, "MARKER");
  writeFileSync(
    join(clone, "scripts", "ovl", "merge-check.mjs"),
    `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "ran");\n`,
  );
  const r = call(MERGE, { cwd: clone });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /no qa\.json/);
  assert.equal(existsSync(marker), false);
  assert.equal(last(clone).decision, "block");
});

test("row 12: a moved local origin/develop changes nothing, the SHA comes from ls-remote", () => {
  const { clone, develop } = fixtureOrigin(DENY_STUB);
  writeFileSync(join(clone, "scripts", "ovl", "merge-check.mjs"), OK_STUB);
  git(clone, "commit", "-am", "permissive");
  git(clone, "update-ref", "refs/remotes/origin/develop", git(clone, "rev-parse", "HEAD"));
  const r = call(MERGE, { cwd: clone });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /no qa\.json/);
  assert.ok(existsSync(join(clone, ".orivilo", "exports", develop)));
});

test("row 13: a failed export step fails closed, naming the step", () => {
  for (const step of ["ls-remote", "fetch", "archive"]) {
    const { clone } = fixtureOrigin(OK_STUB);
    const shim = shims(step);
    const r = call(MERGE, { cwd: clone, env: shim.env });
    assert.equal(r.code, 2, step);
    assert.match(r.stderr, new RegExp(`^merge-guard failed closed: git ${step} exited 1`), step);
    assert.equal(last(clone).decision, "error");
  }
});

// ---- fail closed and scope ----

test("row 36: malformed input and a throwing text stage exit 2 and fail closed", () => {
  const repo = makeRepo("feature/ORV-1-x");
  const env = { env: { ...process.env, CLAUDE_PROJECT_DIR: repo } };
  const bad = judge("{not json", env);
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /^merge-guard failed closed:/);
  const noCommand = judge(
    JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: {}, cwd: repo }),
    env,
  );
  assert.equal(noCommand.code, 2);
  assert.match(noCommand.stderr, /^merge-guard failed closed:/);
  const throwing = call("git -C /nonexistent/folder push", { cwd: repo });
  assert.equal(throwing.code, 2);
  assert.match(throwing.stderr, /^merge-guard failed closed:/);
  assert.deepEqual(
    heartbeatLines(repo).map((l) => l.decision),
    ["error", "error"],
  );
});

test("row 37: calls outside the project are allowed and leave no .orivilo, a push is still judged", () => {
  const project = makeRepo();
  const outside = scratch();
  const other = makeRepo();
  const gone = join(scratch(), "removed-worktree");
  for (const cwd of [outside, other, gone]) {
    for (const command of ["ls", "git status"]) {
      assert.deepEqual(
        call(command, { cwd, project }),
        { code: 0, stderr: "" },
        `${cwd} ${command}`,
      );
    }
  }
  for (const cwd of [outside, other, gone]) {
    assert.equal(existsSync(join(cwd, ".orivilo")), false, cwd);
  }
  const push = call("git push origin HEAD:develop", { cwd: outside, project });
  assert.equal(push.code, 2);
  assert.match(push.stderr, /^merge-guard blocked:/);
  assert.equal(existsSync(join(outside, ".orivilo")), false);
  assert.deepEqual(heartbeatLines(project), []);
});

test("row 38: the command never reaches stderr or the heartbeat", () => {
  const repo = makeRepo("feature/ORV-1-x");
  const blocked = call('git push origin HEAD:develop -o "CANARY"', { cwd: repo });
  const merge = call(`gh pr merge 7 --squash --body "CANARY" --match-head-commit ${H}`, {
    cwd: repo,
  });
  const allowed = call('gh pr create --body "CANARY"', { cwd: repo });
  assert.equal(blocked.code, 2);
  assert.equal(merge.code, 2);
  assert.equal(allowed.code, 0);
  for (const r of [blocked, merge, allowed]) assert.ok(!r.stderr.includes("CANARY"));
  const file = readFileSync(join(repo, ".orivilo", "heartbeat.jsonl"), "utf8");
  assert.ok(!file.includes("CANARY"));
  for (const line of heartbeatLines(repo)) {
    assert.deepEqual(Object.keys(line).sort(), [
      "agent_id",
      "at",
      "decision",
      "event",
      "hook",
      "tool",
    ]);
    assert.equal(line.hook, "merge-guard");
  }
});
