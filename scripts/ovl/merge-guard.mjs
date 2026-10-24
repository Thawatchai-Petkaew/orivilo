// ORV-95: merge-guard, the text stage and its composition (spec ORV-95 v1.1). Reads PreToolUse(Bash)
// input and blocks the calls that move develop or main outside a guarded PR merge:
//   text stage     this file, from the session's own checkout: reads the command text and, for a
//                  `git push`, the current branch. No network call, no record. Decides every call
//                  except one whole `gh pr merge <n> ... --match-head-commit <sha>`.
//   export stage   develop-export.mjs builds develop's copy of scripts/ovl (a whole merge only).
//   records stage  develop's merge-check.mjs, run as a process from the export, never the branch's.
// The rule is a text rule, not a parser: quotes and backslashes are removed, runs of blanks collapse
// and the text is lowercased for comparison. It blocks toward safety. Every non-zero exit is 2.
// stderr and the heartbeat never hold the command: reasons are fixed sentences.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeSync } from "node:fs";
import { join, resolve } from "node:path";
import { ExportError, ensureDevelopExport } from "./develop-export.mjs";
import { beat, recordsRoot } from "./hook.mjs";

const PROTECTED = new Set(["develop", "main"]);
const SHA = /^[0-9a-f]{40}$/;

const MESSAGES = {
  push: "develop and main move only by a guarded PR merge (gh pr merge), never by git push",
  api: "merges go through gh pr merge, not gh api",
  graphql:
    "merge and ref mutations are blocked on GraphQL too, and a query the guard cannot read is blocked",
  remote:
    "no session may point the merge checks at another develop; git remote -v reads the remote instead",
  merge:
    "gh pr merge must be one whole command, gh pr merge <n> with --squash, --merge or --rebase, " +
    "optional --delete-branch, and --match-head-commit <40-hex sha>",
};

const GRAPHQL_NAMES =
  /mergepullrequest|enablepullrequestautomerge|mergebranch|updateref|createref|deleteref/;
const PUSH_OPTIONS_WITH_VALUE = new Set([
  "-o",
  "--push-option",
  "--repo",
  "--receive-pack",
  "--exec",
]);
const GIT_OPTIONS_WITH_VALUE = new Set(["-c", "--git-dir", "--work-tree", "--namespace"]);
const STRATEGIES = new Set(["--squash", "-s", "--merge", "-m", "--rebase", "-r"]);

/** The command with quotes and backslashes removed and blanks collapsed (newlines stay). */
const normalize = (command) =>
  command
    .replace(/\\\r?\n/g, " ")
    .replace(/["'\\]/g, "")
    .replace(/[ \t]+/g, " ");

/** `{n, sha}` when `text` (lowercased, normalized) is exactly one allowed `gh pr merge`, else null. */
function wholeMerge(text) {
  const match = /^gh pr merge ([1-9][0-9]*)((?: [^ ]+)+)$/.exec(text.trim());
  if (match === null) return null;
  let strategy = 0;
  let del = 0;
  let sha = null;
  const flags = match[2].trim().split(" ");
  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (STRATEGIES.has(flag)) strategy += 1;
    else if (flag === "--delete-branch" || flag === "-d") del += 1;
    else if (flag === "--match-head-commit" && sha === null && SHA.test(flags[i + 1] ?? "")) {
      sha = flags[i + 1];
      i += 1;
    } else return null;
  }
  return strategy === 1 && del <= 1 && sha !== null ? { n: Number(match[1]), sha } : null;
}

/** The branch HEAD names in `dir`; throws when it cannot be read (detached, no repo, no folder). */
function currentBranch(dir, env) {
  try {
    return execFileSync("git", ["symbolic-ref", "--short", "-q", "HEAD"], {
      cwd: dir,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .toLowerCase();
  } catch {
    throw new Error("the current branch of the checkout the push names could not be read");
  }
}

/** The words of a push segment without redirects: `{always, targets, needsCurrent}`. */
function pushTargets(args) {
  let tags = false;
  const positional = [];
  const words = [];
  for (let i = 0; i < args.length; i++) {
    if (/^\d*>>?$|^\d*<$|^&>$/.test(args[i])) i += 1;
    else if (!/^\d*[<>]/.test(args[i])) words.push(args[i]);
  }
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (word === "--") {
      positional.push(...words.slice(i + 1));
      break;
    }
    if (word === "--all" || word === "--mirror") return { always: true };
    if (word === "--tags") tags = true;
    else if (PUSH_OPTIONS_WITH_VALUE.has(word)) i += 1;
    else if (!word.startsWith("-")) positional.push(word);
  }
  const refs = positional.slice(1);
  const targets = [];
  let needsCurrent = refs.length === 0 && !tags;
  for (const ref of refs) {
    const dst = ref
      .replace(/^\+/, "")
      .replace(/^.*:/, "")
      .replace(/^refs\/heads\//, "");
    if (dst === "head" || dst === "@") needsCurrent = true;
    else if (dst !== "") targets.push(dst);
  }
  return { always: false, targets, needsCurrent };
}

/** The reasons one git segment is blocked, or `[]`. `tokens` are the segment's words, case kept. */
function judgeGit(tokens, at, cwd, env) {
  let j = at + 1;
  const dirs = [];
  while (j < tokens.length && tokens[j].startsWith("-")) {
    const token = tokens[j];
    if (token === "-C") {
      dirs.push(tokens[j + 1] ?? ".");
      j += 2;
    } else {
      j += GIT_OPTIONS_WITH_VALUE.has(token) ? 2 : 1;
    }
  }
  const sub = (tokens[j] ?? "").toLowerCase();
  const rest = tokens.slice(j + 1);
  const segment = tokens.slice(at).join(" ").toLowerCase();
  if (sub === "update-ref")
    return segment.includes("refs/remotes/origin/") ? [MESSAGES.remote] : [];
  if (sub === "config") return segment.includes("remote.") ? [MESSAGES.remote] : [];
  if (sub === "remote") {
    return ["add", "set-url"].includes((rest[0] ?? "").toLowerCase()) ? [MESSAGES.remote] : [];
  }
  if (sub !== "push") return [];
  const { always, targets, needsCurrent } = pushTargets(rest);
  if (always || targets.some((t) => PROTECTED.has(t))) return [MESSAGES.push];
  if (needsCurrent) {
    if (typeof cwd !== "string" || cwd === "") throw new Error("hook input has no cwd");
    const branch = currentBranch(
      dirs.reduce((dir, d) => resolve(dir, d), cwd),
      env,
    );
    if (PROTECTED.has(branch)) return [MESSAGES.push];
  }
  return [];
}

/**
 * The text stage. Returns `{reasons, merge}`: the reasons to block (empty to allow), and `merge`
 * (`{n, sha}`) only for one whole allowed `gh pr merge`, which the records stage must still judge.
 */
export function textStage(command, cwd, env = process.env) {
  const text = normalize(command);
  const low = text.toLowerCase();
  if (!/\bgit\b|\bgh\b/.test(low)) return { reasons: [], merge: null };

  if (/\bgh\b[^;&|\n]*\bpr merge\b/.test(low)) {
    const merge = wholeMerge(low);
    return merge === null ? { reasons: [MESSAGES.merge], merge: null } : { reasons: [], merge };
  }

  const reasons = new Set();
  if (/\bgh api\b/.test(low)) {
    if (/\/merge|\/git\/refs/.test(low)) reasons.add(MESSAGES.api);
    if (
      low.includes("graphql") &&
      (GRAPHQL_NAMES.test(low) || low.includes("=@") || low.includes("--input"))
    ) {
      reasons.add(MESSAGES.graphql);
    }
  }
  for (const segment of text.split(/[;&|\n\r`()]+/)) {
    const tokens = segment.split(" ").filter(Boolean);
    tokens.forEach((token, at) => {
      if (/(?:^|\/)git$/i.test(token)) {
        for (const reason of judgeGit(tokens, at, cwd, env)) reasons.add(reason);
      }
    });
  }
  return { reasons: [...reasons], merge: null };
}

/** The records stage: develop's merge-check from the export, as a process. Returns the reasons. */
function recordsStage(input, { n, sha }, env) {
  let exported;
  try {
    exported = ensureDevelopExport({ cwd: input.cwd, env });
  } catch (error) {
    if (error instanceof ExportError && error.bootstrap) return [error.message];
    throw error;
  }
  const script = join(exported.dir, "scripts", "ovl", "merge-check.mjs");
  const r = spawnSync(process.execPath, [script, String(n), "--head", sha], {
    cwd: input.cwd,
    env,
    encoding: "utf8",
    timeout: 120_000,
  });
  if (r.error) throw new Error(`merge-check could not run (${r.error.code ?? "error"})`);
  if (r.status === 0) return [];
  const lines = r.stderr
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter((line) => line !== "" && line !== "merge-check blocked:");
  return lines.length > 0 ? lines : [`merge-check exited ${r.status}`];
}

function decide(input, env) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("hook input is not a JSON object");
  }
  if (input.tool_name !== "Bash") throw new Error("tool_name is not Bash");
  const command = input.tool_input?.command;
  if (typeof command !== "string" || command === "") throw new Error("Bash input has no command");
  const { reasons, merge } = textStage(command, input.cwd, env);
  return merge === null ? reasons : recordsStage(input, merge, env);
}

/** One heartbeat line, only when the call's cwd belongs to this project's repo. */
function heartbeat(input, decision, env) {
  if (input === null || typeof input !== "object") return;
  try {
    const store = recordsRoot(input.cwd);
    if (store === recordsRoot(env.CLAUDE_PROJECT_DIR)) beat(store, "merge-guard", input, decision);
  } catch {
    // No store to write to (cwd outside a checkout, or its worktree is gone): the verdict stands.
  }
}

/** Returns {code, stderr}: 2 to block or on any error, 0 to allow. */
export function judge(raw, { env = process.env } = {}) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return { code: 2, stderr: "merge-guard failed closed: stdin is not valid JSON" };
  }
  let reasons;
  try {
    reasons = decide(input, env);
  } catch (error) {
    heartbeat(input, "error", env);
    return { code: 2, stderr: `merge-guard failed closed: ${error.message}` };
  }
  heartbeat(input, reasons.length > 0 ? "block" : "allow", env);
  return reasons.length > 0
    ? { code: 2, stderr: `merge-guard blocked:\n- ${reasons.join("\n- ")}` }
    : { code: 0, stderr: "" };
}

/** Entry point of the hook script: reads stdin, prints the reason on stderr, exits. */
export function runMergeGuard() {
  let raw = "";
  try {
    raw = readFileSync(0, "utf8");
  } catch {
    // An unreadable stdin leaves raw empty, which judge() rejects.
  }
  const { code, stderr } = judge(raw);
  if (stderr) writeSync(2, `${stderr}\n`);
  process.exit(code);
}
