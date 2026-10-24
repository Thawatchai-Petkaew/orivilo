// ORV-95 tasks 5 and R1: the merge-guard text stage and its composition with develop-export and
// merge-check (spec rows 1 to 9, 11, 12, 36 to 38). Throwaway repos only; the real .orivilo is never
// touched.
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
const exitStub = (code) => `process.stderr.write("stub reason\\n");
process.exit(${code});
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

const PUSH_REASON =
  /a push names origin and only <type>\/ORV-<n>-<slug> branches, and develop, main and tags never move by a push/;
const API_REASON =
  /gh api is read only here \(a GET with no fields\), and merges go through gh pr merge/;
const GRAPHQL_REASON =
  /a GraphQL call is allowed only as a query the guard can read in the command text, so any mutation is blocked/;
const REMOTE_REASON = /no session may point the merge checks at another develop/;
const TOKEN_REASON =
  /no session reads the GitHub token, and no other program writes to the GitHub API/;

/** Every command exits 2 with `reason` in stderr, for each agent, with no gh or network call. */
function assertBlocked(commands, reason, { cwd, agents = [undefined, "a-sub"] }) {
  const shim = shims();
  for (const agent of agents) {
    for (const command of commands) {
      const r = call(command, { cwd, agent, env: shim.env });
      assert.equal(r.code, 2, command);
      assert.match(r.stderr, /^merge-guard blocked:/, command);
      assert.match(r.stderr, reason, command);
    }
  }
  assert.equal(shim.ghCalls(), 0);
  assert.ok(!shim.gitCalls().some((c) => ["ls-remote", "fetch", "archive"].includes(c)));
}

// ---- text stage ----

test("row 1: pushes to develop or main are blocked for every session, with no network call", () => {
  const repo = makeRepo("feature/ORV-1-x");
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
  assertBlocked(commands, PUSH_REASON, { cwd: repo });
  assert.ok(heartbeatLines(repo).every((l) => l.decision === "block"));
  assert.equal(heartbeatLines(repo).length, commands.length * 2);
});

test("row 1 (F1): a destination git reads as develop or main is blocked", () => {
  const repo = makeRepo("feature/ORV-1-x");
  assertBlocked(
    [
      "git push origin HEAD:heads/develop",
      "git push origin heads/develop",
      "git push origin :",
      "git push origin +:",
      "git push origin 'refs/heads/*:refs/heads/*'",
      "git push origin HEAD:$B",
    ],
    PUSH_REASON,
    { cwd: repo },
  );
});

test("row 1 (F2): other push programs are blocked", () => {
  const repo = makeRepo("feature/ORV-1-x");
  assertBlocked(
    [
      "/Library/Developer/CommandLineTools/usr/libexec/git-core/git-push origin HEAD:develop",
      "$(git --exec-path)/git-push origin HEAD:develop",
      "git send-pack ../origin.git HEAD:refs/heads/develop",
      "git subtree push --prefix=x origin develop",
    ],
    PUSH_REASON,
    { cwd: repo },
  );
});

test("row 1 (F8): tag pushes and gh release create are blocked", () => {
  const repo = makeRepo("feature/ORV-1-x");
  assertBlocked(
    [
      "git push --tags",
      "git push --follow-tags origin HEAD",
      "git push origin v1.0",
      "git push origin HEAD:refs/tags/v1.0",
      "gh release create v1.0",
    ],
    PUSH_REASON,
    { cwd: repo },
  );
});

test("row 1 (allow list): only origin, a plain option and a feature branch pass", () => {
  const repo = makeRepo("feature/ORV-1-x");
  assertBlocked(
    [
      "git push upstream HEAD:feature/ORV-1-x",
      "git push --receive-pack=x origin HEAD:feature/ORV-1-x",
      "git push --no-verify origin HEAD:feature/ORV-1-x",
      "git push origin HEAD:release/ORV-1-x",
      "git push origin HEAD:feature/ORV-x",
    ],
    PUSH_REASON,
    { cwd: repo },
  );
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
    assert.match(r.stderr, PUSH_REASON);
  }
  assert.equal(call("git push -u origin HEAD", { cwd: onMain }).code, 2);
  const viaC = call(`git -C ${onDevelop} push origin HEAD`, { cwd: feature });
  assert.equal(viaC.code, 2);
  assert.match(viaC.stderr, /^merge-guard blocked:/);
  assert.equal(last(feature).decision, "block");
});

test("row 2 (F1, F2): no refspec, a git option, a variable or a cd blocks on a feature branch", () => {
  const feature = makeRepo("feature/ORV-1-x");
  const dev = makeRepo("develop");
  assertBlocked(
    [
      "git push origin",
      "git push",
      "git -c push.default=matching push origin",
      "git -c remote.origin.push=HEAD:refs/heads/develop push origin",
      `git --git-dir=${dev}/.git push origin HEAD`,
      `git --work-tree=${dev} push origin HEAD`,
      `GIT_DIR=${dev}/.git git push origin HEAD`,
      `env GIT_DIR=${dev}/.git git push origin HEAD`,
      `cd ${dev} && git push origin HEAD`,
    ],
    PUSH_REASON,
    { cwd: feature, agents: [undefined] },
  );
});

test("row 3: ordinary git and gh calls are allowed with no gh call, ls-remote or export", () => {
  const repo = makeRepo("feature/ORV-1-x");
  const other = makeRepo("fix/ORV-2-y");
  const shim = shims();
  const commands = [
    "git push -u origin feature/ORV-1-x",
    "git push origin HEAD",
    "git push --delete origin feature/ORV-1-x",
    "gh pr view 7",
    "gh pr checks 7",
    'gh pr create --base develop --title "ORV-1: x" --body "y"',
    "gh api repos/o/r/pulls/7",
    "gh api graphql -f query='query { viewer { login } }'",
    "git remote -v",
    "git config user.name",
    "ls",
    `git -C ${other} push -u origin HEAD`,
    "git push origin HEAD:refs/heads/feature/ORV-1-x",
    "git push --force-with-lease origin HEAD",
    "git push origin :fix/ORV-1-y",
    "gh api -X GET repos/o/r/pulls",
    "gh api repos/o/r/pulls/7/comments --paginate",
    "git -c core.pager=cat log",
    "git config --get user.email",
    "git config --list",
    "gh auth status",
    "curl -s https://api.github.com/repos/o/r/pulls/7",
    "curl -X GET https://api.github.com/repos/o/r",
    "curl -s https://example.com/a -d x",
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
  assertBlocked(
    [
      "gh api -X PUT repos/o/r/pulls/7/merge",
      "gh api repos/o/r/merges -f base=develop -f head=x",
      "gh api -X PATCH repos/o/r/git/refs/heads/develop -f sha=" + H,
      "gh  api   repos/o/r/pulls/7/merge",
      'sh -c "gh api -X PUT repos/o/r/pulls/7/merge"',
    ],
    API_REASON,
    { cwd: repo, agents: [undefined] },
  );
  assert.ok(heartbeatLines(repo).every((l) => l.decision === "block"));
});

test("row 4 (F4): gh api is read only", () => {
  const repo = makeRepo();
  assertBlocked(
    [
      "gh api -X PUT repos/o/r/contents/a.txt -f branch=develop -f message=x -f content=eA==",
      "gh api -X POST repos/o/r/branches/develop/rename -f new_name=old",
      "gh api repos/o/r/issues/7/comments -f body=x",
      "gh api --method=DELETE repos/o/r/git/refs/tags/v1.0",
      "gh api -XPATCH repos/o/r",
      "gh api repos/o/r/pulls --input body.json",
      "gh api -H 'X-HTTP-Method-Override: PUT' repos/o/r/pulls/7",
      "gh repo sync --branch develop",
    ],
    API_REASON,
    { cwd: repo, agents: [undefined] },
  );
});

test("row 4 (QA-F2): the token is never read and no other program writes to the API hosts", () => {
  const repo = makeRepo();
  assertBlocked(
    [
      'curl -X PUT -H "Authorization: token $(gh auth token)" https://api.github.com/repos/o/r/pulls/7/merge',
      "gh auth token",
      "T=$(gh auth token)",
      "echo $GH_TOKEN",
      "printenv GITHUB_TOKEN",
      "env GH_TOKEN=x gh pr view 7",
      "curl -X PUT https://api.github.com/repos/o/r/pulls/7/merge",
      "curl --request=PATCH https://api.github.com/repos/o/r/git/refs/heads/develop",
      "curl -d '{}' https://api.github.com/repos/o/r/merges",
      "curl --json '{}' https://api.github.com/graphql",
      "wget --method=DELETE https://api.github.com/repos/o/r/git/refs/tags/v1.0",
      "curl -H 'X-HTTP-Method-Override: PUT' https://api.github.com/repos/o/r/pulls/7",
      "curl --data-binary @a.zip https://uploads.github.com/repos/o/r/releases/1/assets",
    ],
    TOKEN_REASON,
    { cwd: repo, agents: [undefined] },
  );
  const file = readFileSync(join(repo, ".orivilo", "heartbeat.jsonl"), "utf8");
  assert.ok(!file.includes("github.com") && !file.toLowerCase().includes("token"));
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
  assertBlocked(
    [
      ...mutations.map(
        (m) => `gh api graphql -f query='mutation { ${m}(input: {}) { clientMutationId } }'`,
      ),
      "gh api graphql -F query=@q.graphql",
      "gh api graphql --input q.json",
      "gh api graphql -f query='mutation { createCommitOnBranch(input:{}) { commit { oid } } }'",
      "gh api graphql -f query='mutation{addComment(input:{}){clientMutationId}}'",
    ],
    GRAPHQL_REASON,
    { cwd: repo, agents: [undefined] },
  );
});

test("row 6: forms that repoint the remote are blocked", () => {
  const repo = makeRepo();
  const commands = [
    `git update-ref refs/remotes/origin/develop ${H}`,
    "git remote add evil https://example.com/x.git",
    "git remote set-url origin https://example.com/x.git",
    "git config remote.origin.url https://example.com/x.git",
    "git config --get remote.origin.url",
    "git config url.https://example.com/x.git.insteadOf https://github.com/Thawatchai-Petkaew/orivilo.git",
    "git config --global url.https://example.com/x.git.insteadOf https://github.com/o/r.git",
    "git config url.x.pushInsteadOf y",
    "git config include.path ../x.cfg",
    "git config includeIf.gitdir:~/w/.path ../x.cfg",
    "git config push.default matching",
    "git config set push.default matching",
    "git config alias.p push",
    "git -c url.x.insteadOf=y fetch",
    "git --config-env=url.x.insteadOf=V ls-remote",
  ];
  assertBlocked(commands, REMOTE_REASON, { cwd: repo, agents: [undefined] });
  assert.match(call(commands[1], { cwd: repo }).stderr, /git remote -v reads the remote instead/);
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
    `gh pr merge 7 --match-head-commit ${H}`,
    `gh pr merge 7 --delete-branch --match-head-commit ${H}`,
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

test("row 9 (QA-F5 a): a merge-check that exits 1 or 3 blocks and its line is the reason", () => {
  for (const code of [1, 3]) {
    const { clone } = fixtureOrigin(exitStub(code));
    const r = call(MERGE, { cwd: clone });
    assert.equal(r.code, 2, `exit ${code}`);
    assert.equal(r.stderr, "merge-guard blocked:\n- stub reason");
    assert.equal(last(clone).decision, "block");
  }
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
  const throwing = call("git -C /nonexistent/folder push origin HEAD", { cwd: repo });
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
