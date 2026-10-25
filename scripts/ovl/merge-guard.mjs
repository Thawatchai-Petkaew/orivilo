// ORV-95: merge-guard, the text stage and its composition (spec ORV-95 v1.3). Reads PreToolUse(Bash)
// input and blocks the calls that move develop or main outside a guarded PR merge:
//   text stage     this file, from the session's own checkout: reads the command text and, for a
//                  `git push` of HEAD, the current branch. No network call, no record. Decides every
//                  call except one whole `gh pr merge <n> ... --match-head-commit <sha>`. A push and
//                  a `gh api` call are an allow list; config, remote, token and host forms are named.
//   export stage   develop-export.mjs builds develop's copy of scripts/ovl (a whole merge only).
//   records stage  develop's merge-check.mjs, run as a process from the export, never the branch's.
//                  ORV-115: before it, a --squash or --delete-branch merge reads the PR base with one
//                  `gh pr view` and is refused when the base is main.
// The rule is a text rule, not a parser: quotes and backslashes are removed, runs of blanks collapse
// and the text is lowercased for comparison. It blocks toward safety. Every non-zero exit is 2.
// stderr and the heartbeat never hold the command: reasons are fixed sentences.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeSync } from "node:fs";
import { join, resolve } from "node:path";
import { ExportError, ensureDevelopExport } from "./develop-export.mjs";
import { beat, recordsRoot } from "./hook.mjs";

const SHA = /^[0-9a-f]{40}$/;
/** A branch a push may name: `<type>/orv-<n>-<slug>`, lowercased, with an optional refs/heads/. */
const BRANCH = /^(?:refs\/heads\/)?(?:feature|fix|chore|docs)\/orv-[0-9]+-[a-z0-9._-]+$/;
const SOURCE = /^[a-z0-9_./@^~{}-]+$/;
const CONFIG_KEY = /^(?:remote|url|include|includeif|push|alias)\./;
const CONFIG_TEXT = ["remote.", "url.", "include.", "includeif.", "push.", "alias."];

const MESSAGES = {
  push: "a push names origin and only <type>/ORV-<n>-<slug> branches, and develop, main and tags never move by a push",
  api: "gh api is read only here (a GET with no fields), and merges go through gh pr merge",
  graphql:
    "a GraphQL call is allowed only as a query the guard can read in the command text, so any mutation is blocked",
  remote:
    "no session may point the merge checks at another develop or change how a push or a remote resolves; git remote -v reads the remote instead",
  token: "no session reads the GitHub token, and no other program writes to the GitHub API",
  release:
    "a merge into main is gh pr merge <n> --merge --match-head-commit <sha>: no --squash, which would let develop and main drift, and no --delete-branch, which would delete develop",
  merge:
    "gh pr merge must be one whole command, gh pr merge <n> with --squash, --merge or --rebase, " +
    "optional --delete-branch, and --match-head-commit <40-hex sha>",
};

const GRAPHQL_NAMES =
  /mergepullrequest|enablepullrequestautomerge|mergebranch|updateref|createref|deleteref/;
const PUSH_OPTIONS = new Set([
  "-u",
  "--set-upstream",
  "-f",
  "--force",
  "--force-with-lease",
  "--force-if-includes",
  "-d",
  "--delete",
  "-q",
  "--quiet",
  "-v",
  "--verbose",
  "-n",
  "--dry-run",
]);
const GIT_OPTIONS_WITH_VALUE = new Set(["--git-dir", "--work-tree", "--namespace"]);
const BODY_OPTIONS = [
  "--data",
  "--json",
  "--form",
  "--upload-file",
  "--post-data",
  "--post-file",
  "--body-data",
  "--body-file",
];
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
  let squash = false;
  let del = 0;
  let sha = null;
  const flags = match[2].trim().split(" ");
  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (STRATEGIES.has(flag)) {
      strategy += 1;
      squash ||= flag === "--squash" || flag === "-s";
    } else if (flag === "--delete-branch" || flag === "-d") del += 1;
    else if (flag === "--match-head-commit" && sha === null && SHA.test(flags[i + 1] ?? "")) {
      sha = flags[i + 1];
      i += 1;
    } else return null;
  }
  return strategy === 1 && del <= 1 && sha !== null
    ? { n: Number(match[1]), sha, squash, deleteBranch: del === 1 }
    : null;
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

/** Whether the arguments of one `git push` are on the allow list. May throw (checkout unreadable). */
function pushAllowed(args, dirs, { cwd, env, hasCd }) {
  const words = [];
  for (let i = 0; i < args.length; i++) {
    if (/^\d*>>?$|^\d*<$|^&>$/.test(args[i])) i += 1;
    else if (!/^\d*[<>]/.test(args[i])) words.push(args[i].toLowerCase());
  }
  const positional = [];
  let deleting = false;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === "--") {
      positional.push(...words.slice(i + 1));
      break;
    }
    if (!word.startsWith("-")) positional.push(word);
    else if (word === "-d" || word === "--delete") deleting = true;
    else if (!PUSH_OPTIONS.has(word) && !word.startsWith("--force-with-lease=")) return false;
  }
  const [remote, ...refs] = positional;
  if (remote !== "origin" || refs.length === 0) return false;
  let needsCurrent = false;
  for (const raw of refs) {
    const ref = raw.replace(/^\+/, "");
    if (deleting) {
      if (!BRANCH.test(ref)) return false;
    } else if (ref === "head" || ref === "@") {
      needsCurrent = true;
    } else if (!ref.includes(":")) {
      if (!BRANCH.test(ref)) return false;
    } else {
      const src = ref.slice(0, ref.indexOf(":"));
      if (!BRANCH.test(ref.slice(src.length + 1)) || (src !== "" && !SOURCE.test(src))) {
        return false;
      }
    }
  }
  if (!needsCurrent) return true;
  if (hasCd) return false;
  if (typeof cwd !== "string" || cwd === "") throw new Error("hook input has no cwd");
  return BRANCH.test(
    currentBranch(
      dirs.reduce((dir, d) => resolve(dir, d), cwd),
      env,
    ),
  );
}

/** The reasons one git segment is blocked, or `[]`. `tokens` are the segment's words, case kept. */
function judgeGit(tokens, at, ctx) {
  let j = at + 1;
  const dirs = [];
  const options = [];
  let repoints = false;
  while (j < tokens.length && tokens[j].startsWith("-")) {
    const token = tokens[j];
    if (token === "-C") {
      dirs.push(tokens[j + 1] ?? ".");
      j += 2;
      continue;
    }
    options.push(token);
    if (token === "-c" || token === "--config-env") {
      repoints ||= CONFIG_KEY.test((tokens[j + 1] ?? "").toLowerCase());
      j += 2;
    } else if (token.startsWith("--config-env=")) {
      repoints ||= CONFIG_KEY.test(token.slice("--config-env=".length).toLowerCase());
      j += 1;
    } else {
      j += GIT_OPTIONS_WITH_VALUE.has(token.toLowerCase()) ? 2 : 1;
    }
  }
  const sub = (tokens[j] ?? "").toLowerCase();
  const rest = tokens.slice(j + 1);
  const segment = tokens.slice(at).join(" ").toLowerCase();
  if (repoints && sub !== "push") return [MESSAGES.remote];
  if (sub === "update-ref")
    return segment.includes("refs/remotes/origin/") ? [MESSAGES.remote] : [];
  if (sub === "config") {
    return CONFIG_TEXT.some((key) => segment.includes(key)) ? [MESSAGES.remote] : [];
  }
  if (sub === "remote") {
    return ["add", "set-url"].includes((rest[0] ?? "").toLowerCase()) ? [MESSAGES.remote] : [];
  }
  if (sub === "send-pack" || (sub === "subtree" && (rest[0] ?? "").toLowerCase() === "push")) {
    return [MESSAGES.push];
  }
  if (sub !== "push") return [];
  const prefixed = tokens
    .slice(0, at)
    .some((word) => /^[a-z_][a-z0-9_]*=/i.test(word) || word.toLowerCase() === "env");
  return options.length === 0 && !prefixed && pushAllowed(rest, dirs, ctx) ? [] : [MESSAGES.push];
}

/** Whether a header option names a method override (words lowercased). */
const hasHeaderMethod = (words) =>
  words.some((word, i) => {
    if (word === "-h" || word === "--header") return (words[i + 1] ?? "").includes("method");
    const attached =
      word.startsWith("--header=") || (word.startsWith("-h") && !word.startsWith("--"));
    return attached && word.includes("method");
  });

/** The values given to `-x` or one of `longs`, with or without a space or `=` (words lowercased). */
function methodsIn(words, longs) {
  const found = [];
  words.forEach((word, i) => {
    const long = longs.find((l) => word.startsWith(`${l}=`));
    if (word === "-x" || longs.includes(word)) found.push(words[i + 1] ?? "");
    else if (word.startsWith("-x")) found.push(word.slice(2).replace(/^=/, ""));
    else if (long) found.push(word.slice(long.length + 1));
  });
  return found;
}

/** Whether one `gh api` call (words after `api`, lowercased) is a write. */
function apiWrites(args) {
  return (
    methodsIn(args, ["--method"]).some((m) => m !== "get") ||
    hasHeaderMethod(args) ||
    args.some(
      (word) =>
        word.startsWith("-f") ||
        word.startsWith("--field") ||
        word.startsWith("--raw-field") ||
        word === "--input" ||
        word.startsWith("--input="),
    )
  );
}

/** Whether a command that names a GitHub API host also writes (curl, wget; words lowercased). */
function hostWrites(words) {
  return (
    methodsIn(words, ["--request", "--method"]).some((m) => m !== "get" && m !== "head") ||
    hasHeaderMethod(words) ||
    words.some(
      (word) => BODY_OPTIONS.some((o) => word.startsWith(o)) || /^-(?!x)[a-z]*[dft]/.test(word),
    )
  );
}

/** The reasons one `gh api` call is blocked. `segment` is its lowercased text, `whole` the command's. */
function judgeApi(args, segment, whole) {
  if (!args.includes("graphql")) {
    return /\/merge|\/git\/refs/.test(segment) || apiWrites(args) ? [MESSAGES.api] : [];
  }
  const inline = /(?:^| )(?:-f|--raw-field)[ =]?query=[^@$`]/.test(segment);
  const unreadable =
    GRAPHQL_NAMES.test(whole) ||
    whole.includes("mutation") ||
    whole.includes("=@") ||
    args.some((word) => word === "--input" || word.startsWith("--input="));
  return inline && !unreadable ? [] : [MESSAGES.graphql];
}

/**
 * The text stage. Returns `{reasons, merge}`: the reasons to block (empty to allow), and `merge`
 * (`{n, sha}`) only for one whole allowed `gh pr merge`, which the records stage must still judge.
 */
export function textStage(command, cwd, env = process.env) {
  const text = normalize(command);
  const low = text.toLowerCase();
  if (!/\bgit\b|\bgh\b|gh_token|github_token|api\.github\.com|uploads\.github\.com/.test(low)) {
    return { reasons: [], merge: null };
  }

  if (/\bgh\b[^;&|\n]*\bpr merge\b/.test(low)) {
    const merge = wholeMerge(low);
    return merge === null ? { reasons: [MESSAGES.merge], merge: null } : { reasons: [], merge };
  }

  const reasons = new Set();
  if (/gh auth token|gh_token|github_token/.test(low)) reasons.add(MESSAGES.token);
  if (/api\.github\.com|uploads\.github\.com/.test(low) && hostWrites(low.split(/\s+/))) {
    reasons.add(MESSAGES.token);
  }
  if (/\bgh release create\b/.test(low)) reasons.add(MESSAGES.push);
  if (/\bgh repo sync\b/.test(low)) reasons.add(MESSAGES.api);

  const ctx = { cwd, env, hasCd: /(?:^|[\s;&|(`])(?:cd|pushd)(?:\s|$)/.test(low) };
  for (const segment of text.split(/[;&|\n\r`()]+/)) {
    const tokens = segment.split(" ").filter(Boolean);
    const words = tokens.map((token) => token.toLowerCase());
    tokens.forEach((token, at) => {
      if (/(?:^|\/)git$/i.test(token)) {
        for (const reason of judgeGit(tokens, at, ctx)) reasons.add(reason);
      } else if (/git-(?:push|send-pack|subtree)$/.test(words[at])) {
        reasons.add(MESSAGES.push);
      } else if (/(?:^|\/)gh$/.test(words[at]) && words[at + 1] === "api") {
        for (const reason of judgeApi(words.slice(at + 2), segment.toLowerCase(), low)) {
          reasons.add(reason);
        }
      }
    });
  }
  return { reasons: [...reasons], merge: null };
}

/**
 * ORV-115: a merge into main must be a merge commit that keeps develop, so --squash and
 * --delete-branch are refused there. The base is read with one `gh pr view`, only for a merge that
 * names one of the two flags; a base that cannot be read throws, which fails closed.
 */
function releaseFlagProblems({ n, squash, deleteBranch }, input, env) {
  if (!squash && !deleteBranch) return [];
  const r = spawnSync("gh", ["pr", "view", String(n), "--json", "baseRefName"], {
    cwd: input.cwd,
    env,
    encoding: "utf8",
    timeout: 30_000,
  });
  if (r.error) throw new Error(`gh could not run (${r.error.code ?? "error"})`);
  let base;
  try {
    base = JSON.parse(r.stdout).baseRefName;
  } catch {
    base = undefined;
  }
  if (r.status !== 0 || typeof base !== "string") {
    throw new Error(`the base branch of PR ${n} could not be read`);
  }
  return base === "main" ? [MESSAGES.release] : [];
}

/** The records stage: develop's merge-check from the export, as a process. Returns the reasons. */
function recordsStage(input, merge, env) {
  const { n, sha } = merge;
  let exported;
  try {
    exported = ensureDevelopExport({ cwd: input.cwd, env });
  } catch (error) {
    if (error instanceof ExportError && error.bootstrap) return [error.message];
    throw error;
  }
  const flagReasons = releaseFlagProblems(merge, input, env);
  if (flagReasons.length > 0) return flagReasons;
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
