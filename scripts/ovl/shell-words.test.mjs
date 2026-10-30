// ORV-138 rows 38 to 44, 53 to 57 and 62: shell-words rule shell-1 clauses (a) to (g) and unknown-1
// (shell-1 clause (h); docs/specs/ORV-138/spec.md). Every form below is copied from the spec rows, "Write-guard forms
// to catch", "Branch switch forms", "Branch forms to keep" or the Worked examples; the module is
// pure, so a test feeds text and reads the segments back. The forms and classes come from survey
// K-0090 (docs/knowledge/enforcement/K-0090-bash-forms-for-text-guards.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describeCause, readShell } from "./shell-words.mjs";
import { GUARD_PATH } from "./write-guard.mjs";

/** The fixed parts of a segment's command words, joined by a space. */
const said = (seg) =>
  seg.commandWords
    .map((w) => w.fixed)
    .join(" ")
    .trim();
const allSaid = (text, options) => readShell(text, options).segments.map(said);
const only = (text, options) => {
  const { segments } = readShell(text, options);
  assert.equal(segments.length, 1, `${text}: ${segments.length} segments`);
  return segments[0];
};
/** The segment of `text` whose command words read `words`. */
const find = (text, words, options) => {
  const seg = readShell(text, options).segments.find((s) => said(s) === words);
  assert.ok(seg, `${text}: no segment "${words}"`);
  return seg;
};

const root = realpathSync(mkdtempSync(join(tmpdir(), "shell-words-")));
const dir = (name) => {
  const p = join(root, name);
  mkdirSync(p, { recursive: true });
  return p;
};
const M = dir("m");
const W = dir("w");

// ---- row 38: clause (a), segments

test("ORV-138 row 38: a group, a background operator, a reserved word and a joined line each give the git switch segment", () => {
  for (const text of [
    "(git switch x)",
    "git status & git switch x",
    "if true; then git switch x; fi",
    "git status # it's\ngit switch x",
    "git \\\nswitch x",
  ]) {
    assert.ok(allSaid(text).includes("git switch x"), `${JSON.stringify(text)}: ${allSaid(text)}`);
  }
});

test("ORV-138 row 38: every control operator ends a segment and is recorded on it", () => {
  const ends = (text) => readShell(text).segments.map((s) => s.ends);
  assert.deepEqual(ends("a; b && c || d | e |& f & g\nh"), [
    ";",
    "&&",
    "||",
    "|",
    "|&",
    "&",
    "\n",
    null,
  ]);
  assert.deepEqual(ends("case x in a) b ;; c ;& d ;;& e"), [")", ";;", ";&", ";;&", null]);
  assert.deepEqual(ends("a && (b)"), ["&&", ")"]);
  assert.deepEqual(ends("a ;; b"), [";;", null]);
});

test("ORV-138 row 38: a backslash before a newline joins the two lines, between words and inside one", () => {
  assert.deepEqual(allSaid("git \\\n  switch x"), ["git switch x"]);
  assert.deepEqual(allSaid("git \\\n\\\n switch x"), ["git switch x"]);
  assert.deepEqual(allSaid("gi\\\nt switch x"), ["git switch x"]);
  assert.deepEqual(allSaid("git switch x \\\n"), ["git switch x"]);
  // an escaped backslash before a newline joins nothing
  assert.deepEqual(allSaid("echo \\\\\nrm x"), ["echo \\", "rm x"]);
});

test("ORV-138 row 38: a comment ends at its newline, so a quote in it opens none and the next line is live (v1.4)", () => {
  const seg = find("git status # it's\ngit switch x", "git switch x");
  assert.equal(seg.command, "git");
  assert.deepEqual(allSaid("git status # ; git switch x"), ["git status"]);
});

test("ORV-138 row 38: a $( ), a backquote pair and a >( ) each give the segments of the list inside them", () => {
  assert.ok(allSaid("echo $(git switch x)").includes("git switch x"));
  assert.ok(allSaid("echo `git switch x`").includes("git switch x"));
  assert.ok(allSaid("tee >(git switch x)").includes("git switch x"));
  assert.ok(allSaid("diff <(git switch x) b").includes("git switch x"));
  assert.ok(allSaid('echo "$(git switch x)"').includes("git switch x"));
  assert.deepEqual(readShell("echo $(a) `b` >(c) <(d)").substitutions, ["$(", "`", ">(", "<("]);
});

// ---- row 39: clause (b), quoting

test("ORV-138 row 39: the RV-1 form gives the live segments cd and printf and no substitution", () => {
  const text = `echo '$(cat <<"EOF"\n' ; cd .oriv?lo/owner-approvals && printf x > 7.json ; echo '\nEOF\n)'`;
  const { segments, substitutions } = readShell(text);
  assert.deepEqual(substitutions, []);
  const cd = segments.find((s) => s.command === "cd");
  assert.equal(cd.words[1].raw, ".oriv?lo/owner-approvals");
  assert.equal(cd.ends, "&&");
  const printf = segments.find((s) => said(s) === "printf x");
  assert.deepEqual(
    printf.writeTargets.map((w) => w.raw),
    ["7.json"],
  );
  assert.equal(printf.ends, ";");
  // Worked examples, shell-1 (b): the live characters are two separators and a redirect.
  assert.equal(segments.length, 4);
});

test("ORV-138 row 39: a > inside a quoted program is no redirect", () => {
  const seg = only(`node -e 'process.exit(1 > 0 ? 0 : 1)'`);
  assert.deepEqual(seg.redirects, []);
  assert.deepEqual(seg.writeTargets, []);
  const inQuotes = only(`echo "a > b ; c | d ( e )"`);
  assert.deepEqual(inQuotes.redirects, []);
});

test("ORV-138 row 39: a $( inside double quotes opens a substitution; an escaped or single-quoted one opens none", () => {
  assert.deepEqual(readShell(`echo "$(printf .oriv)"`).substitutions, ["$("]);
  assert.deepEqual(readShell(`echo \\$(x)`).substitutions, []);
  assert.deepEqual(readShell(`echo '$(x)'`).substitutions, []);
  assert.deepEqual(readShell("echo '`x`'").substitutions, []);
  assert.deepEqual(readShell("echo \\`x\\`").substitutions, []);
});

test("ORV-138 row 39: ?, *, [ and { open an expansion only outside every quote; ~ only at the start of a word", () => {
  const exp = (text) => only(`x ${text}`).words[1].expansions;
  assert.deepEqual(exp("a?"), ["?"]);
  assert.deepEqual(exp("a*"), ["*"]);
  assert.deepEqual(exp("a[b]"), ["["]);
  assert.deepEqual(exp("a{b,c}"), ["{"]);
  assert.deepEqual(exp("a{1..3}"), ["{"]);
  assert.deepEqual(exp('"a?*[b]{c,d}"'), []);
  assert.deepEqual(exp("'a?*'"), []);
  assert.deepEqual(exp("a\\?"), []);
  assert.deepEqual(exp("${a}"), ["${"]);
  assert.deepEqual(exp("$a"), ["$"]);
  assert.deepEqual(exp("$((1+2))"), ["$(("]);
  assert.deepEqual(exp("~user/x"), ["~"]);
  assert.deepEqual(exp("a~"), []);
  assert.deepEqual(exp("[ab"), []);
  assert.deepEqual(exp("{}"), []);
  assert.deepEqual(exp("{a}"), []);
});

test("ORV-138 row 39: a ; & | < > ( ) inside quotes is a plain character", () => {
  const seg = only(`echo 'a;b&c|d<e>f(g)h' "a;b&c|d<e>f(g)h"`);
  assert.equal(seg.words.length, 3);
  assert.deepEqual(seg.redirects, []);
});

test("ORV-138 row 39: $'...' with an escape and $\"...\" count as an expansion; a plain $'...' does not", () => {
  assert.deepEqual(only(`x $'a\\x2eb'`).words[1].expansions, ["$'"]);
  assert.deepEqual(only(`x $"a"`).words[1].expansions, ['$"']);
  assert.deepEqual(only(`x $'ab'`).words[1].expansions, []);
});

test("ORV-138 row 39: a substitution inside ${ } and $(( )) holds segments", () => {
  assert.ok(allSaid("echo ${x:-$(rm y)}").includes("rm y"));
  assert.ok(allSaid("echo $(( $(rm y) + 1 ))").includes("rm y"));
  assert.ok(allSaid("echo $( (rm y) )").includes("rm y"));
});

// ---- row 40: clause (c), fixed part and kind

test("ORV-138 row 40: the five words of the Worked examples give their fixed parts and kinds", () => {
  const cases = [
    [".oriv[i]lo/owner-approvals/7.json", ".oriv", "glob"],
    [".or{i,}vilo/owner-approvals/7.json", ".or", "any"],
    ["${D}ilo/owner-approvals/7.json", "", "any"],
    ["/tmp/orv-$n.txt", "/tmp/orv-", "any"],
    ["/tmp/orv-*", "/tmp/orv-", "glob"],
  ];
  for (const [word, fixed, kind] of cases) {
    const target = only(`printf x > ${word}`).writeTargets[0];
    assert.deepEqual([target.fixed, target.kind], [fixed, kind], word);
  }
});

test('ORV-138 row 40: "cd", \\cd and c""d each give the fixed part cd', () => {
  for (const word of ['"cd"', "\\cd", 'c""d', "'cd'", "c'd'"]) {
    const w = only(`${word} x`).words[0];
    assert.deepEqual([w.fixed, w.kind], ["cd", "none"], word);
  }
});

test("ORV-138 row 40: $'\\x2eorivilo' and $\"x\" give kind any with an empty fixed part", () => {
  for (const word of ["$'\\x2eorivilo'", '$"x"']) {
    const w = only(`x ${word}`).words[1];
    assert.deepEqual([w.fixed, w.kind], ["", "any"], word);
  }
});

test("ORV-138 row 40: ~/x gives the home folder followed by /x, kind none; ~ alone gives the home folder", () => {
  const w = only("x ~/x", { home: "/h" }).words[1];
  assert.deepEqual([w.fixed, w.kind], ["/h/x", "none"]);
  assert.deepEqual(
    [only("x ~", { home: "/h" }).words[1].fixed, only("x ~", { home: "/h" }).words[1].kind],
    ["/h", "none"],
  );
  assert.equal(only("x ~/x").words[1].fixed, `${homedir()}/x`);
  assert.deepEqual(
    [only("x ~user/x").words[1].fixed, only("x ~user/x").words[1].kind],
    ["", "any"],
  );
  assert.equal(only('x "~/x"', { home: "/h" }).words[1].fixed, "~/x");
});

test("ORV-138 row 40: backslashes and quotes are removed from the fixed part; a double-quoted expansion cuts it", () => {
  assert.equal(only("x a\\ b\"c d\"'e f'").words[1].fixed, "a bc de f");
  const w = only('x "a$B"c').words[1];
  assert.deepEqual([w.fixed, w.kind], ["a", "any"]);
  assert.deepEqual([only("x a*b$c").words[1].fixed, only("x a*b$c").words[1].kind], ["a", "any"]);
});

test("ORV-138 row 40: a word gives its path components, split at every slash, each with its fixed part and whether it holds an expansion", () => {
  const parts = (word) => only(`x ${word}`).words[1].parts.map((p) => [p.fixed, p.glob]);
  assert.deepEqual(parts("a/b"), [
    ["a", false],
    ["b", false],
  ]);
  assert.deepEqual(parts("x*/../.oriv?lo/7.json"), [
    ["x", true],
    ["..", false],
    [".oriv", true],
    ["7.json", false],
  ]);
  assert.deepEqual(parts("/tmp/orv-*"), [
    ["", false],
    ["tmp", false],
    ["orv-", true],
  ]);
  // A quoted slash splits too (the shell does not match a slash with a glob), a quoted glob does not glob.
  assert.deepEqual(parts("'a?/b'"), [
    ["a?", false],
    ["b", false],
  ]);
  assert.deepEqual(parts("${D}ilo/o"), [
    ["", true],
    ["o", false],
  ]);
});

// ---- row 41: clause (d), command position

const PREFIXES = [
  "GIT_TRACE=0",
  "env -i -u X",
  "env -C d",
  "command",
  "command -p",
  "builtin",
  "exec -a n",
  "nohup",
  "timeout -s KILL 5",
  "time -p",
  "!",
  "then",
];
for (const prefix of PREFIXES) {
  test(`ORV-138 row 41: ${prefix} before git switch x leaves git as the command name`, () => {
    const seg = only(`${prefix} git switch x`);
    assert.equal(seg.command, "git");
    assert.equal(seg.unknown, false);
    assert.equal(said(seg), "git switch x");
  });
}

test("ORV-138 row 41: the other reserved words and option forms are skipped", () => {
  for (const prefix of [
    "if",
    "elif",
    "else",
    "while",
    "until",
    "do",
    "{",
    "coproc",
    "time",
    "FOO=1 BAR=2",
    "env --ignore-environment --unset=X --chdir=d",
    "env -i -uX",
    "env -- GIT_TRACE=0",
    "env FOO=1",
    "command --",
    "exec -cl",
    "timeout --preserve-status --signal=KILL --kill-after=1 5",
    "timeout -sKILL 5",
    "timeout -k 1 -s TERM 5",
    "env timeout 5 nohup command -p builtin exec",
  ]) {
    assert.equal(only(`${prefix} git switch x`).command, "git", prefix);
  }
  assert.equal(only("function f git switch x").command, "git");
  assert.equal(only('"if" git switch x').command, "if");
});

test("ORV-138 row 41: command -v and -V run no command", () => {
  for (const text of ["command -v git", "command -V git", "command -pv git"]) {
    const seg = only(text);
    assert.equal(seg.command, null, text);
    assert.equal(seg.unknown, false, text);
    assert.deepEqual(seg.commandWords, [], text);
  }
});

test("ORV-138 row 41: env -S and $G make the command unknown", () => {
  for (const text of [
    "env -S 'git switch x'",
    "env --split-string='git switch x'",
    "$G switch x",
    "g*t switch x",
    "env --bogus git switch x",
  ]) {
    const seg = only(text);
    assert.equal(seg.command, null, text);
    assert.equal(seg.unknown, true, text);
  }
  assert.equal(readShell("$(printf git) switch x").segments.filter((s) => s.unknown).length, 1);
  assert.equal(only("timeout --bogus 5 git switch x").unknown, true);
  assert.equal(only("command -z git").unknown, true);
  assert.equal(only("exec -z git").unknown, true);
});

test("ORV-138 row 41: env -S makes the whole call unknown (v1.4, unknown-1); $G switch x makes only its segment unknown", () => {
  for (const text of ["env -S 'git switch x'", "env --split-string='git switch x'"]) {
    const read = readShell(text);
    assert.equal(read.unknown, true, text);
    assert.deepEqual(read.causes, ["runner:env"], text);
  }
  const variable = readShell("$G switch x");
  assert.equal(variable.unknown, false);
  assert.equal(variable.segments[0].unknown, true);
});

test("ORV-138 row 41: the command name is the lowercased fixed part", () => {
  assert.equal(only("TEE a").command, "tee");
  assert.equal(only('"GiT" switch x').command, "git");
  assert.equal(only("FOO=1").command, null);
  assert.equal(only("FOO=1").unknown, false);
});

test("ORV-138 row 41: the command name is the lowercased base name of the fixed part, so /usr/bin/tee and /usr/bin/git read as tee and git", () => {
  assert.equal(only("/usr/bin/tee a").command, "tee");
  assert.equal(only("/usr/bin/git switch x").command, "git");
  assert.equal(only("./TEE a").command, "tee");
  assert.equal(only('"/usr/bin/GIT" switch x').command, "git");
  assert.equal(only("/usr/bin/env -C d /usr/bin/git switch x").command, "git");
  assert.equal(said(only("/usr/bin/git switch x")), "/usr/bin/git switch x");
  // A command name with an expansion stays unknown, whatever its folder.
  assert.equal(only("/usr/bin/$G switch x").unknown, true);
});

test("ORV-138 row 41: for, select, case and [[ name no command", () => {
  for (const text of ["for i in a b", "select i in a b", "case x in", "[[ -f x"]) {
    assert.equal(only(text).command, null, text);
  }
});

test("ORV-138 row 41: env -C and GIT_DIR=x are recorded on the segment", () => {
  const chdir = only("env -C d git switch x");
  assert.deepEqual(
    chdir.envChdir.map((w) => w.fixed),
    ["d"],
  );
  assert.equal(only("env --chdir=d git switch x").envChdir.length, 1);
  assert.equal(only("env -Cd git switch x").envChdir.length, 1);
  assert.deepEqual(only("git switch x").envChdir, []);

  const prefix = only("GIT_DIR=x git switch x");
  assert.deepEqual(
    prefix.gitEnv.map((g) => [g.name, g.word.raw]),
    [["GIT_DIR", "GIT_DIR=x"]],
  );
  assert.deepEqual(
    only("env GIT_WORK_TREE=y git switch x").gitEnv.map((g) => g.name),
    ["GIT_WORK_TREE"],
  );
  assert.deepEqual(only("GIT_TRACE=0 git switch x").gitEnv, []);
});

test("ORV-138 row 41: a redirect anywhere in the segment is no command word", () => {
  assert.equal(said(only("> a git switch x")), "git switch x");
  assert.equal(said(only("git > a switch x")), "git switch x");
  assert.equal(said(only("git switch x > a")), "git switch x");
  assert.equal(only("2>&1 FOO=1 git switch x").command, "git");
});

// ---- row 42: clause (e), effective cwd

const folders = (text, cwd) => find(text, "git switch x", { cwd }).cwd;

test("ORV-138 row 42: the three forms of the Worked examples give the sets shown there", () => {
  assert.deepEqual(folders(`cd ${W} && git switch x`, M), [W]);
  assert.deepEqual(folders(`true || cd ${W} && git switch x`, M), [M, W]);
  assert.deepEqual(folders(`false && cd ${W}; git switch x`, M), [M, W]);
});

test("ORV-138 row 42: the Worked example of resolve-1 (b) and (c) resolves the RV-8 and RV-2 pairs under a checkout", () => {
  // The cwd of each RV-2 pair comes from the module; the path step is the Worked example's.
  const checkout = dir("rv");
  for (const folder of ["", ".claude", "scripts", ".github"])
    mkdirSync(join(checkout, folder), { recursive: true });
  const pairs = [
    ["", "scripts/x/../ovl/a.mjs", "scripts/ovl/a.mjs"],
    [".claude", "settings.json", ".claude/settings.json"],
    ["scripts", "ovl/a.mjs", "scripts/ovl/a.mjs"],
    [".github", "workflows/ci.yml", ".github/workflows/ci.yml"],
  ];
  for (const [cwd, target, want] of pairs) {
    const seg = only(`printf x > ${target}`, { cwd: join(checkout, cwd) });
    assert.equal(seg.cwd.length, 1);
    const rel = relative(checkout, resolve(seg.cwd[0], seg.writeTargets[0].fixed));
    assert.equal(rel, want);
    assert.equal(GUARD_PATH.test(rel), true);
  }
});

test("ORV-138 row 42: a missing or non-folder call cwd makes the cwd unknown", () => {
  assert.equal(only("x").cwd, null);
  assert.equal(only("x", { cwd: join(root, "nope") }).cwd, null);
  assert.deepEqual(only("x", { cwd: M }).cwd, [M]);
});

for (const form of [
  "cd",
  "cd -",
  'cd "$D"',
  "cd ~-",
  "pushd",
  "pushd +1",
  "pushd -2",
  "popd",
  "cd a b",
  "cd $HOME",
  "cd a*",
]) {
  test(`ORV-138 row 42: ${form} makes the cwd unknown`, () => {
    assert.equal(find(`${form} && git switch x`, "git switch x", { cwd: M }).cwd, null);
    assert.equal(find(`${form}; git switch x`, "git switch x", { cwd: M }).cwd, null);
    assert.equal(find(`git status && ${form}; git switch x`, "git switch x", { cwd: M }).cwd, null);
  });
}

test("ORV-138 row 42: pushd -n /tmp moves nothing; cd -P /tmp gives /tmp", () => {
  assert.deepEqual(folders("pushd -n /tmp && git switch x", M), [M]);
  assert.deepEqual(folders("pushd -n /tmp; git switch x", M), [M]);
  assert.deepEqual(folders("cd -P /tmp && git switch x", M), ["/tmp"]);
  assert.deepEqual(folders("cd -L -- /tmp && git switch x", M), ["/tmp"]);
  assert.deepEqual(folders("pushd /tmp && git switch x", M), ["/tmp"]);
  assert.deepEqual(folders("builtin cd /tmp && git switch x", M), ["/tmp"]);
});

test("ORV-138 row 42: in cd a && cd b && x the segment gets the one folder <cwd>/a/b", () => {
  assert.deepEqual(folders("cd a && cd b && git switch x", M), [join(M, "a", "b")]);
  assert.deepEqual(folders("cd a; cd b && git switch x", M), [join(M, "b"), join(M, "a", "b")]);
});

test("ORV-138 row 42: a target resolves against each folder of its own segment's set; . and .. collapse; ~ is the home folder", () => {
  assert.deepEqual(folders("cd a || cd b; cd c && git switch x", M), [
    join(M, "c"),
    join(M, "a", "c"),
    join(M, "b", "c"),
    join(M, "a", "b", "c"),
  ]);
  assert.deepEqual(folders("cd a/../b/. && git switch x", M), [join(M, "b")]);
  assert.deepEqual(folders("cd ~ && git switch x", M), [homedir()]);
  assert.deepEqual(folders("cd ~/x && git switch x", M), [join(homedir(), "x")]);
  assert.deepEqual(folders("cd '' && git switch x", M), [M]);
});

test("ORV-138 row 42: a segment after a | , a ( or a ) gets every folder the call may be in", () => {
  assert.deepEqual(folders(`cd ${W} | git switch x`, M), [M, W]);
  assert.deepEqual(folders(`cd ${W} && (git switch x)`, M), [M, W]);
  assert.deepEqual(folders(`cd ${W} & git switch x`, M), [M, W]);
  assert.deepEqual(folders(`cd ${W} && echo $(git switch x)`, M), [M, W]);
  assert.deepEqual(folders(`cd ${W}\ngit switch x`, M), [M, W]);
});

test("ORV-138 row 42: a cd only counts at command position", () => {
  assert.deepEqual(folders("echo cd /tmp && git switch x", M), [M]);
});

// ---- row 43: clause (f), here-documents

for (const delimiter of ["'EOF'", '"EOF"', "\\EOF", 'E"O"F']) {
  test(`ORV-138 row 43: a body after ${delimiter} gives no segment and no word`, () => {
    const text = `cat <<${delimiter}\n> x\nrm x\n$(rm x)\n\`rm y\`\nEOF\n`;
    const { segments, substitutions } = readShell(text);
    assert.equal(segments.length, 1);
    assert.equal(said(segments[0]), "cat");
    assert.deepEqual(substitutions, []);
    assert.deepEqual(segments[0].writeTargets, []);
  });
}

test("ORV-138 row 43: a body after an unquoted delimiter that holds $(rm x) gives the segment rm x", () => {
  const { segments, substitutions } = readShell("cat <<EOF\n$(rm x)\nEOF\n");
  assert.ok(segments.some((s) => said(s) === "rm x"));
  assert.deepEqual(substitutions, ["$("]);
  assert.ok(allSaid("cat <<EOF\n`rm x`\nEOF").includes("rm x"));
  assert.ok(!allSaid("cat <<EOF\n\\$(rm x)\nEOF").includes("rm x"));
  // read as in double quotes: a > or a bare command word in the body is text
  assert.deepEqual(allSaid("cat <<EOF\n> x\nrm x\nEOF"), ["cat"]);
});

test("ORV-138 row 43: <<- ends at a tab-indented delimiter line; <<EOF does not", () => {
  assert.deepEqual(allSaid("cat <<-EOF\nbody\n\tEOF\nrm x"), ["cat", "rm x"]);
  assert.deepEqual(allSaid("cat <<EOF\nbody\n\tEOF\nrm x\nEOF\nls"), ["cat", "ls"]);
  assert.deepEqual(allSaid("cat <<EOF\nbody\nEOF\nrm x"), ["cat", "rm x"]);
});

test("ORV-138 row 43: a body without its delimiter runs to the end of the text", () => {
  assert.deepEqual(allSaid("cat <<'EOF'\nrm x\nrm y"), ["cat"]);
});

test("ORV-138 row 43: the body starts after the current line, and the rest of the line is read", () => {
  assert.deepEqual(allSaid("cat <<'EOF' | tee a\nrm x\nEOF\nls"), ["cat", "tee a", "ls"]);
  assert.deepEqual(allSaid("cat <<'A' <<'B'\nrm 1\nA\nrm 2\nB\nls"), ["cat", "ls"]);
});

test("ORV-138 row 43: the sec-F1 target word is kind any with an empty fixed part", () => {
  const text = `printf x > "$(cat <<"EOF"\n.oriv\nEOF\n)ilo/owner-approvals/7.json"`;
  const { segments } = readShell(text);
  const printf = segments.find((s) => said(s) === "printf x");
  assert.deepEqual([printf.writeTargets[0].fixed, printf.writeTargets[0].kind], ["", "any"]);
  assert.ok(segments.some((s) => said(s) === "cat"));
});

test("ORV-138 row 43: a here-document inside a substitution keeps its quoted body literal and the substitution an expansion", () => {
  const text = `git commit -m "$(cat <<'EOF'\nmessage > x; rm y; git switch z\nEOF\n)"`;
  const { segments } = readShell(text);
  assert.deepEqual(segments.map(said).sort(), ["cat", "git commit -m"].sort());
  const commit = segments.find((s) => said(s) === "git commit -m");
  assert.equal(commit.words[3].kind, "any");
  assert.deepEqual(commit.writeTargets, []);
});

// ---- row 44: clause (g), redirects

for (const op of [">", ">>", ">|", ">!", "&>", "&>>", "<>", "2>", "{fd}>", ">&"]) {
  test(`ORV-138 row 44: ${op} f gives the write target f`, () => {
    const seg = only(`x ${op} f`);
    assert.deepEqual(
      seg.writeTargets.map((w) => w.raw),
      ["f"],
    );
    assert.equal(said(seg), "x");
    assert.equal(only(`x ${op}f`).writeTargets[0].raw, "f");
  });
}

for (const redirect of [
  "2>&1",
  "3>&-",
  "< f",
  "<<< f",
  "<&0",
  "<&-",
  ">&2",
  "1>&2-",
  "<< EOF",
  "<<-EOF",
]) {
  test(`ORV-138 row 44: ${redirect} gives no write target`, () => {
    const seg = only(`x ${redirect}`);
    assert.deepEqual(seg.writeTargets, []);
    assert.equal(said(seg), "x");
  });
}

test("ORV-138 row 44: a redirect before or inside the command gives the same write target", () => {
  for (const text of ["printf > a x", "> a printf x", "printf x > a"]) {
    const seg = only(text);
    assert.deepEqual(
      seg.writeTargets.map((w) => w.raw),
      ["a"],
      text,
    );
    assert.equal(seg.command, "printf", text);
  }
});

test("ORV-138 row 44: a number or {name} before the operator is no word; a number apart from it is", () => {
  assert.equal(said(only("echo 2 > f")), "echo 2");
  assert.equal(said(only("echo 2> f")), "echo");
  assert.equal(said(only("echo a2> f")), "echo a2");
  assert.equal(said(only("echo {fd}> f")), "echo");
  assert.equal(said(only('echo "2"> f')), "echo 2");
});

test("ORV-138 row 44: the target keeps its quoting, fixed part and kind; several redirects give several targets", () => {
  const seg = find(`x > "a b" 2>> c*d >(e)`, "x");
  assert.deepEqual(
    seg.writeTargets.map((w) => [w.fixed, w.kind]),
    [
      ["a b", "none"],
      ["c", "glob"],
    ],
  );
  assert.deepEqual(readShell("x > >(cat > f)").substitutions, [">("]);
  assert.deepEqual(
    find("x > >(cat > f)", "cat").writeTargets.map((w) => w.raw),
    ["f"],
  );
  assert.deepEqual(
    only("x >").redirects.map((r) => r.word),
    [null],
  );
  assert.deepEqual(
    readShell("x > ; y").segments.map((s) => s.writeTargets),
    [[], []],
  );
});

// ---- row 53: clause (a), comments (K-0090 C1 to C5)

const targets = (seg) => seg.writeTargets.map((w) => w.raw);

test("ORV-138 row 53: a comment with a quote in it ends at its newline and the next line is live (C1, C2)", () => {
  for (const text of [
    "# switch back, it's done\ngit switch x",
    "git status # don't\ngit switch x",
    "true;# it's\ngit switch x",
    'true # the "owner\ngit switch x',
  ]) {
    const read = readShell(text);
    assert.ok(read.segments.map(said).includes("git switch x"), JSON.stringify(text));
    for (const seg of read.segments) {
      for (const w of seg.words)
        assert.ok(!w.raw.includes("\n"), `${JSON.stringify(text)}: ${w.raw}`);
    }
    assert.equal(read.unknown, false, text);
  }
  // a comment opens no substitution, backquote or here-document
  assert.deepEqual(readShell("# $(rm x) `rm y` <<EOF\ngit switch x").substitutions, []);
  assert.deepEqual(allSaid("# $(rm x) `rm y` <<EOF\ngit switch x"), ["git switch x"]);
  // a # right after any operator, and after a blank, starts one
  for (const text of [
    "a|# x\ngit switch x",
    "a&# x\ngit switch x",
    "(# x\ngit switch x)",
    "a #x\ngit switch x",
  ]) {
    assert.ok(allSaid(text).includes("git switch x"), text);
  }
});

test("ORV-138 row 53: the text after a # on the same line is no segment", () => {
  assert.deepEqual(allSaid("git status # ; git switch x"), ["git status"]);
  assert.deepEqual(allSaid("git status # && rm x | tee a > b"), ["git status"]);
  assert.deepEqual(readShell("git status # > a").segments[0].writeTargets, []);
  // a # after a redirect operator is a comment, not its target
  assert.deepEqual(only("x > # y").writeTargets, []);
});

test("ORV-138 row 53: a # inside a word or inside quotes starts no comment (C3)", () => {
  const read = readShell("echo a#b; git switch x");
  assert.deepEqual(read.segments.map(said), ["echo a#b", "git switch x"]);
  for (const text of [
    "echo $#; git switch x",
    "echo ${#x}; git switch x",
    "echo '#'; git switch x",
    'echo "# a"; git switch x',
    "echo \\#; git switch x",
    "echo $# ${#x} '#'; git switch x",
  ]) {
    const segments = readShell(text).segments.map(said);
    assert.equal(segments.length, 2, text);
    assert.equal(segments[1], "git switch x", text);
  }
});

test("ORV-138 row 53: a backslash at the end of a comment joins no line (C4)", () => {
  assert.deepEqual(allSaid("# note \\\ngit switch x"), ["git switch x"]);
  assert.deepEqual(allSaid("git status # note \\\ngit switch x"), ["git status", "git switch x"]);
});

test("ORV-138 row 53: a comment inside a $( ) ends at its newline, so a ) in it closes nothing (C5)", () => {
  const read = readShell("x=$(echo a # )\n); git switch x");
  assert.deepEqual(read.substitutions, ["$("]);
  assert.deepEqual(read.segments.map(said).filter(Boolean), ["echo a", "git switch x"]);
  const closed = read.segments.find((s) => said(s) === "echo a");
  assert.equal(closed.ends, "\n");
  // the segment after the substitution is a top-level one: it is not inside the $( )
  assert.equal(find("x=$(echo a # )\n); git switch x", "git switch x").command, "git");
  assert.equal(read.unknown, false);
});

// ---- row 54: the section 10 rows marked model that v1.3 did not name

test("ORV-138 row 54: Q1, Q2, Q3 and S1 give the segment git switch x", () => {
  for (const text of [
    "echo $'it\\'s'; git switch x",
    "echo 'it''s'; git switch x",
    'echo $"a b"; git switch x',
    "echo `echo a`; git switch x",
  ]) {
    assert.ok(allSaid(text).includes("git switch x"), JSON.stringify(text));
    assert.equal(readShell(text).unknown, false, text);
  }
  // Q1: the escaped quote is part of the word; Q2: the quotes close and reopen; Q3: a counted expansion
  assert.deepEqual(allSaid("echo $'it\\'s'; git switch x"), ["echo", "git switch x"]);
  assert.equal(only("echo 'it''s'").words[1].fixed, "its");
  assert.deepEqual(only('echo $"a b"').words[1].expansions, ['$"']);
  assert.equal(only('echo $"a b"').words.length, 2);
  // S1: a backquote pair ends at the first backquote that is not after a backslash
  const nested = readShell("echo `echo \\`a\\``; git switch x");
  assert.deepEqual(nested.segments.map(said), ["a", "echo", "echo", "git switch x"]);
});

test("ORV-138 row 54: S5 a case pattern ) inside a $( ) closes no substitution", () => {
  const text = "x=$(case a in a) git status;; esac); git switch x";
  const read = readShell(text);
  assert.ok(read.segments.map(said).includes("git status"));
  assert.ok(read.segments.map(said).includes("git switch x"));
  assert.equal(find(text, "git switch x").ends, null);
  assert.equal(read.unknown, false);
  // a pattern in parentheses, several arms, a second pattern with |
  const arms = "x=$(case a in (a) git status;; b|c) git log;; (d) git diff;; esac); git switch x";
  assert.deepEqual(
    allSaid(arms).filter((said) => said.startsWith("git")),
    ["git status", "git log", "git diff", "git switch x"],
  );
  // the `)` after esac closes the substitution: the outer word is a segment that the `;` ends, in
  // both the plain form and the form with a parenthesis right after `in`
  for (const form of [text, arms]) {
    const outer = readShell(form).segments.find((s) => s.words[0].raw.startsWith("x=$(case"));
    assert.equal(outer?.ends, ";", form);
  }
  // an empty case, and a case on several lines
  assert.ok(allSaid("x=$(case a in esac); git switch x").includes("git switch x"));
  assert.ok(
    allSaid("x=$(case a in\n a)\n git status\n ;;\n esac\n); git switch x").includes(
      "git switch x",
    ),
  );
  // `)` after the esac closes the substitution
  assert.equal(find(text, "git switch x").cwd, null);
});

test("ORV-138 row 54: S6 ${ list; } and ${| list; } hold a list; S7 $[ ] is arithmetic; S8 =( ) and H20 <<( ) are substitutions", () => {
  for (const text of [
    "echo ${ git switch x; }",
    "echo ${| git switch x; }",
    "echo ${\ngit switch x\n}",
  ]) {
    const read = readShell(text);
    assert.ok(read.segments.map(said).includes("git switch x"), JSON.stringify(text));
    assert.deepEqual(read.substitutions, ["${"], text);
    assert.equal(read.unknown, false, text);
  }
  assert.deepEqual(allSaid("echo ${x:-a} git switch x"), ["echo  git switch x"]);
  // the `}` closes the list, and the word and its segment go on after it
  const closed = readShell("echo ${ true; }; git status");
  assert.deepEqual(
    closed.segments.map((s) => [s.words.length, s.ends]),
    [
      [1, ";"],
      [2, ";"],
      [2, null],
    ],
  );
  assert.deepEqual(
    readShell("echo ${ true; } git status").segments.map((s) => s.words.length),
    [1, 4],
  );
  const shift = readShell("echo $[1<<2]\ngit switch x");
  assert.deepEqual(shift.segments.map(said), ["echo", "git switch x"]);
  assert.deepEqual(only("echo $[1<<2]").words[1].expansions, ["$["]);
  assert.ok(allSaid("echo $[$(rm y)+1]").includes("rm y"));
  const proc = readShell("cat =(git switch x)");
  assert.ok(proc.segments.map(said).includes("git switch x"));
  assert.deepEqual(proc.substitutions, ["=("]);
  assert.equal(proc.unknown, false);
  const zsh = readShell("cat <<(git switch x)");
  assert.ok(zsh.segments.map(said).includes("git switch x"));
  assert.deepEqual(zsh.substitutions, ["<("]);
  assert.deepEqual(
    zsh.segments.find((s) => s.command === "cat").redirects.map((x) => x.op),
    ["<"],
  );
  assert.equal(zsh.unknown, false);
  // the here-document after <<( is not pending: the next line is live
  assert.ok(allSaid("cat <<(true)\ngit switch x").includes("git switch x"));
});

test("ORV-138 row 54: H17 a << inside (( )) or $(( )) is a shift and opens no here-document", () => {
  for (const text of ["(( n = 1 << 2 ))\ngit switch x", "echo $(( 1 << 2 ))\ngit switch x"]) {
    const read = readShell(text);
    assert.ok(read.segments.map(said).includes("git switch x"), JSON.stringify(text));
    assert.equal(read.unknown, false, text);
  }
  // a substitution in the arithmetic is still read; ((  )) at command position after a reserved word
  assert.ok(allSaid("(( n = $(rm y) << 2 ))").includes("rm y"));
  assert.ok(allSaid("while (( i < 3 )); do git switch x; done").includes("git switch x"));
  assert.deepEqual(readShell("(( n = 1 << 2 ))").segments, []);
});

test("ORV-138 row 54: Z4 a } ends the segment in any position, and a group closes", () => {
  const read = readShell("{ git switch x }");
  assert.deepEqual(read.segments.map(said), ["git switch x"]);
  assert.equal(read.segments[0].ends, "}");
  assert.deepEqual(allSaid("{ git switch x; }"), ["git switch x"]);
  // a stray } with no open group is a plain word, so a path after it stays an argument
  assert.deepEqual(allSaid("rm } .orivilo/x"), ["rm } .orivilo/x"]);
  // after the group closes, a } is a plain word again
  assert.deepEqual(allSaid("{ a; } ; rm } y"), ["a", "rm } y"]);
});

test("ORV-138 row 54: H19 a < or > between [[ and ]] is a comparison and gives no write target", () => {
  const seg = only("[[ a > b ]]");
  assert.deepEqual(seg.writeTargets, []);
  assert.deepEqual(seg.redirects, []);
  assert.deepEqual(only("[[ a < b ]]").redirects, []);
  assert.deepEqual(targets(find("[[ a > b ]] && printf x > c", "printf x")), ["c"]);
  assert.deepEqual(targets(find("if [[ a > b ]]; then printf x > c; fi", "printf x")), ["c"]);
  // outside [[ ]] the same text is a redirect, and a newline ends a condition left open
  assert.deepEqual(targets(only("echo a > b")), ["b"]);
  assert.deepEqual(targets(find("[[ a\nprintf x > c", "printf x")), ["c"]);
  // a [[ that is no command word is an argument and opens no condition
  assert.deepEqual(targets(only("echo [[ x > f")), ["f"]);
});

test("ORV-138 row 54: Z8 >>!, >>|, &>| and &>! give the write target f", () => {
  for (const op of [">>!", ">>|", "&>|", "&>!"]) {
    const seg = only(`printf x ${op} f`);
    assert.deepEqual(targets(seg), ["f"], op);
    assert.equal(said(seg), "printf x", op);
    assert.equal(seg.redirects[0].op, op, op);
  }
});

// ---- row 55: clause (f), here-documents (v1.4)

test("ORV-138 row 55: H3 a here-document pending across a $( newline takes its body after the line where the substitution closes", () => {
  const text = "cat <<'EOF' $(\nprintf x > 7.json\n)\nrm x\nEOF";
  const read = readShell(text);
  const printf = read.segments.find((s) => said(s) === "printf x");
  assert.deepEqual(targets(printf), ["7.json"]);
  assert.ok(!read.segments.some((s) => said(s) === "rm x"));
  assert.equal(read.unknown, false);
  // the body is a quoted-delimiter literal; the cat segment carries the substitution as an expansion
  assert.equal(find(text, "cat").words[1].kind, "any");
});

test("ORV-138 row 55: H2 several here-documents on one line take their bodies in order", () => {
  const read = readShell("cat <<A; cat <<B\na\nA\nrm x\nB\ngit switch x");
  const names = read.segments.map(said);
  assert.ok(!names.includes("rm x"));
  assert.ok(names.includes("git switch x"));
  // with an unquoted second delimiter the body is still read to its own delimiter
  assert.ok(!allSaid("cat <<'A'; cat <<B\nrm 1\nA\nrm 2\nB\nls").includes("rm 1"));
  assert.ok(allSaid("cat <<'A'; cat <<B\nrm 1\nA\n$(rm 2)\nB\nls").includes("rm 2"));
});

test("ORV-138 row 55: H8 a $'EOF' delimiter has no backslash, its body is a literal, and the line EOF ends it", () => {
  const read = readShell("cat <<$'EOF'\nrm x\nEOF\ngit switch x");
  assert.ok(!read.segments.map(said).includes("rm x"));
  assert.ok(read.segments.map(said).includes("git switch x"));
  assert.equal(read.unknown, false);
  assert.ok(!allSaid("cat <<$'EOF'\n$(rm x)\nEOF").includes("rm x"));
});

test("ORV-138 row 55: H10 a delimiter with an expansion is its literal text, and the body is expanded", () => {
  const read = readShell("cat <<$X\nEOF\n$X\ngit switch x");
  assert.deepEqual(read.segments.map(said), ["cat", "git switch x"]);
  assert.equal(read.unknown, false);
  assert.ok(allSaid("cat <<$X\n$(rm x)\n$X").includes("rm x"));
  // the line EOF is body, not the delimiter
  assert.ok(allSaid("cat <<$X\nEOF\n$(rm x)\n$X").includes("rm x"));
});

test("ORV-138 row 55: H15 and H16 a delimiter line with a trailing blank ends nothing; the body runs to the end of the text", () => {
  assert.deepEqual(allSaid("cat <<'EOF'\nEOF \ngit switch x"), ["cat"]);
  assert.deepEqual(allSaid("cat <<'EOF'\ngit switch x"), ["cat"]);
  assert.deepEqual(allSaid("cat <<'EOF'\n EOF\ngit switch x"), ["cat"]);
  assert.deepEqual(allSaid("cat <<'EOF'\nEOF\ngit switch x"), ["cat", "git switch x"]);
});

test("ORV-138 row 55: H18 a here string takes no body", () => {
  const read = readShell("cat <<< EOF\ngit switch x");
  assert.deepEqual(read.segments.map(said), ["cat", "git switch x"]);
  assert.equal(read.unknown, false);
  // one operator `<<<` with the word EOF, and no write
  const cat = read.segments[0];
  assert.deepEqual(
    cat.redirects.map((x) => [x.op, x.word?.raw, x.write]),
    [["<<<", "EOF", false]],
  );
});

test("ORV-138 row 55: the place of each quoted-delimiter body is given, the delimiter line and an unquoted body are not", () => {
  const text = "cat <<'EOF'\nrm x\nEOF\nls\ncat <<EOF\nbody\nEOF\ncat <<\"A\"; ls\nbody\nA";
  const { heredocBodies } = readShell(text);
  assert.deepEqual(
    heredocBodies.map((b) => text.slice(b.start, b.end)),
    ["rm x\n", "body\n"],
  );
  // a body in a substitution of the original text has its place too
  const nested = "echo \"$(cat <<'EOF'\nrm x\nEOF\n)\"";
  assert.deepEqual(
    readShell(nested).heredocBodies.map((b) => nested.slice(b.start, b.end)),
    ["rm x\n"],
  );
  // the text of a backquote pair is a copy with other offsets, so its body is given no place
  assert.deepEqual(readShell("echo `cat <<'EOF'\nx\nEOF\n`").heredocBodies, []);
  // a body that never ends runs to the end of the text
  const open = "cat <<'EOF'\nrm x";
  assert.deepEqual(
    readShell(open).heredocBodies.map((b) => open.slice(b.start, b.end)),
    ["rm x"],
  );
});

// ---- row 56: clause (h), unknown-1

/** Each form of "Unknown call forms", with the cause the reader gives. NL is a newline. */
const UNKNOWN_FORMS = [
  ["C6", "x=`echo a # `\necho b`"],
  ["C7", "histchars='!^%'\necho % it's\ngit status"],
  ["H4", "x=$(cat <<'EOF')\ngit status\nEOF"],
  ["H5", "x=`cat <<'EOF'`\ngit status\nEOF"],
  ["H8", "cat <<$'E\\x4fF'\nx\nEOF"],
  ["H9", 'cat <<$"EOF"\nx\nEOF'],
  ["H11", "cat <<`EOF`\nx\n`EOF`"],
  ["H12", "cat <<E\\\nOF\nx\nEOF"],
  ["H13", "cat <<EOF\nEO\\\nF\ngit status"],
  ["S2", 'echo `echo "a` b"'],
  ["S3", "echo $((cd /tmp; git status) )"],
  ["S4", "((git status) )"],
  ["S11", "ls a(b|c)"],
  ["S11", "print *(e:'git status':)"],
  ["runner:env", "env -S 'git status'"],
  ["runner:flock", "flock /tmp/orv.lock -c 'git status'"],
  ["runner:sudo", "sudo -s git status"],
  ["runner:sudo", "sudo -i git status"],
  ["runner:sudo", "sudo -h git status"],
  ["runner:script", "script -c 'git status' /tmp/t"],
  ["runner:script", "script -t /tmp/t"],
  ["runner:watch", "watch git status"],
  ["runner:watch", "watch -x git status"],
  ["runner:parallel", "parallel git status ::: a"],
  ["runner:pnpm exec", "pnpm exec -c 'git status'"],
  ["runner:npx", "npx -c 'git status'"],
  ["runner:chrt", "chrt git status"],
  ["runner:prlimit", "prlimit -n 5 git status"],
  ["runner:prlimit", "prlimit --nofile git status"],
  ["runner:nice", "nice -z git status"],
  ["runner:nice", "nice $N git status"],
  ["length", `echo ${"a".repeat(199996)}`],
];

for (const [cause, text] of UNKNOWN_FORMS) {
  test(`ORV-138 row 56: ${cause} makes ${JSON.stringify(text.length > 60 ? text.slice(0, 20) : text)} unknown, with its cause`, () => {
    const read = readShell(text);
    assert.equal(read.unknown, true);
    assert.ok(read.causes.includes(cause), `${read.causes}`);
  });
}

test("ORV-138 row 56: each form gives its one cause, no other", () => {
  for (const [cause, text] of UNKNOWN_FORMS) {
    assert.deepEqual(readShell(text).causes, [cause], JSON.stringify(text));
  }
});

test("ORV-138 row 56: a call of 200,000 characters is read and one of 200,001 characters is unknown", () => {
  const ok = readShell(`echo ${"a".repeat(199995)}`);
  assert.equal(`echo ${"a".repeat(199995)}`.length, 200000);
  assert.equal(ok.unknown, false);
  assert.equal(ok.segments.length, 1);
  const long = readShell(`echo ${"a".repeat(199996)}`);
  assert.equal(long.unknown, true);
  assert.deepEqual(long.causes, ["length"]);
  assert.deepEqual(long.segments, []);
});

test("ORV-138 row 56: no form in Write-guard forms to keep or Branch forms to keep is unknown", () => {
  const keep = [
    "git grep -n -F 'old' HEAD -- $(git diff --name-only origin/develop...HEAD)",
    "{ git diff --name-only origin/develop...HEAD; git ls-files docs; } | xargs grep -n -E 'source:'",
    "export TEST_DATABASE_URL=postgres://localhost/x REQUIRE_DB_TESTS=1; pnpm quality-gate",
    "git -C /w push -u origin HEAD",
    "pnpm lint && pnpm typecheck && pnpm test && pnpm build",
    "git commit -m \"$(cat <<'EOF'\nfix > x; rm y; git switch z\nEOF\n)\"",
    'gh pr create --title "ORV-138: x" --body "$(cat <<\'EOF\'\nbody\nEOF\n)"',
    "node --test scripts/ovl/*.test.mjs",
    "pnpm test:scripts 2>&1 | tail -5",
    "rm -rf /tmp/orv-*",
    "ls /m/.orivilo/runs/ORV-1/ORV-1-qa-1/screenshots/*.png",
    'cat > /tmp/orv-report.json <<\'EOF\'\n{"file": "scripts/ovl/write-guard.mjs", "ref": ".orivilo/runs/ORV-138/x/result.json"}\nEOF',
    "node scripts/ovl/validate.mjs reviewer.v1 /tmp/orv-report.json",
    "cat > /tmp/x.json <<'EOF'\n{\"a\": 1}\nEOF",
    'printf a > /tmp/y.txt; echo "exit=$?"',
    "for n in 1 2; do printf x > /tmp/orv-$n.txt; done",
    'grep -n x "$HOME/.zshrc" > /tmp/g.txt',
    'pnpm test > /tmp/t.log 2>&1; echo "exit=$?"',
    `echo "$(git rev-parse HEAD)"; node -e 'process.exit(1 > 0 ? 0 : 1)'`,
    "cd /w && git switch x",
    "git -C /w switch x",
    "git -C /w add checkout",
    "git status # ; git switch x",
    "(git switch x)",
    "git status & git switch x",
    "if true; then git switch x; fi",
    "git --no-pager checkout x",
    "env git switch x",
    "command git switch x",
    "GIT_TRACE=0 git switch x",
    "true || cd /w && git switch x",
    "false && cd /w; git switch x",
    "git status # don't\ngit switch x",
    "# switch back, it's done\ngit switch x",
    "cat <<$'EOF'\nx\nEOF\ngit switch x",
    "cat <<'EOF' $(\ngit switch x\n)\nx\nEOF",
    "(( n = 1 << 2 ))\ngit switch x",
    "nice git switch x",
    "stdbuf -o0 git switch x",
    "/usr/bin/time git switch x",
    "cd - && git switch x",
    'cd "$W" && git switch x',
    'git -C "$W" switch x',
    "git --git-dir=/w/.git switch x",
    "git --work-tree /w checkout x",
    "GIT_DIR=/w/.git git switch x",
    "env -C /w git switch x",
  ];
  for (const text of keep) {
    const read = readShell(text);
    assert.deepEqual(read.causes, [], JSON.stringify(text));
    assert.equal(read.unknown, false, JSON.stringify(text));
  }
});

test("ORV-138 row 56: the S11 members: a ( inside a word is unknown, the openers at the start of a word are not", () => {
  for (const text of ["x=(a b)", "f() { :; }", "ls @(a|b)", "ls a(b)", 'ls "a"(b)', 'ls ""(b)']) {
    assert.deepEqual(readShell(text).causes, ["S11"], text);
  }
  for (const text of [
    "echo $(x)",
    "echo $((1+2))",
    "echo <(x)",
    "echo >(x)",
    "cat <<(x)",
    "cat =(x)",
    "(( n = 1 ))",
    "(x)",
    "a | (b)",
    "echo a ( b",
    "echo \\(",
    "echo '('",
    'echo "a(b)"',
  ]) {
    assert.ok(!readShell(text).causes.includes("S11"), text);
  }
});

test("ORV-138 row 56: H4 a here-document in a substitution that closes on a later line is modelled", () => {
  assert.deepEqual(readShell("echo \"$(cat <<'EOF'\nx\nEOF\n)\"").causes, []);
  assert.deepEqual(readShell("echo `cat <<'EOF'\nx\nEOF\n`").causes, []);
  assert.deepEqual(readShell("echo <(cat <<'EOF')\nx\nEOF").causes, ["H4"]);
  assert.deepEqual(readShell("(cat <<'EOF'\nx\nEOF\n)").causes, []);
  // at the top level of the call a here-document with no body is allowed (H16)
  assert.deepEqual(readShell("cat <<'EOF'").causes, []);
});

test("ORV-138 row 56: H13 a backslash at the end of a body line is unknown only when it is not escaped, and only in an unquoted body", () => {
  assert.deepEqual(readShell("cat <<EOF\na\\\\\nEOF").causes, []);
  assert.deepEqual(readShell("cat <<EOF\na\\\\\\\nEOF").causes, ["H13"]);
  assert.deepEqual(readShell("cat <<'EOF'\na\\\nEOF").causes, []);
});

test("ORV-138 row 56: C6 and S2 are read in a backquote pair; C7 where an assignment stands", () => {
  assert.deepEqual(readShell("echo `echo a # b`").causes, ["C6"]);
  assert.deepEqual(readShell("echo `echo a#b`").causes, []);
  assert.deepEqual(readShell("echo `echo '#'`").causes, []);
  assert.deepEqual(readShell("echo `echo $(a # b\n)`").causes, ["C6"]);
  assert.deepEqual(readShell("echo `echo 'a`").causes, ["S2"]);
  assert.deepEqual(readShell('echo `echo "a`').causes, ["S2"]);
  assert.deepEqual(readShell("echo `echo $'a`").causes, ["S2"]);
  assert.deepEqual(readShell("echo `echo 'a' \"b\" $'c'`").causes, []);
  assert.deepEqual(readShell('echo `echo a`; echo "b').causes, []);
  assert.deepEqual(readShell("histchars= git status").causes, ["C7"]);
  assert.deepEqual(readShell("env histchars=% git status").causes, ["C7"]);
  assert.deepEqual(readShell("echo histchars=x").causes, []);
  assert.deepEqual(readShell("echo $((cd /tmp) )").causes, ["S3"]);
  assert.deepEqual(readShell("echo $((1 + (2)))").causes, []);
  assert.deepEqual(readShell("((a); (b))").causes, ["S4"]);
});

test("ORV-138 row 56: the causes have a sentence for a guard to print", () => {
  for (const [cause] of UNKNOWN_FORMS) assert.ok(describeCause(cause).length > 10, cause);
  assert.match(describeCause("runner:nice"), /nice/);
  assert.match(describeCause("length"), /200000/);
});

// ---- row 57: clause (d), runner grammar (v1.4)

/** A copy of the spec table "Runner grammar": per runner its options, and the words that stand before the command. */
const GRAMMAR = {
  nice: { val: ["-n", "--adjustment"], flag: ["--help", "--version"], pos: [] },
  time: {
    val: ["-f", "--format", "-o", "--output"],
    flag: ["-p", "--portability", "-a", "--append", "-v", "-q", "-h", "-l", "-V", "--help"],
    pos: [],
  },
  stdbuf: {
    val: ["-i", "--input", "-o", "--output", "-e", "--error"],
    flag: ["--help", "--version"],
    pos: [],
  },
  caffeinate: { val: ["-t", "-w"], flag: ["-d", "-i", "-m", "-s", "-u"], pos: [] },
  ionice: {
    val: ["-c", "--class", "-n", "--classdata", "-p", "--pid", "-P", "--pgid", "-u", "--uid"],
    flag: ["-t", "--ignore"],
    pos: [],
  },
  setsid: { val: [], flag: ["-c", "-f", "-w", "-h", "-V"], pos: [] },
  chrt: {
    val: ["-T", "-P", "-D", "-U", "-X"],
    flag: [
      "-o",
      "-f",
      "-r",
      "-b",
      "-i",
      "-d",
      "-e",
      "-G",
      "-O",
      "-R",
      "-a",
      "-m",
      "-p",
      "-v",
      "-h",
      "-V",
    ],
    pos: ["10"],
  },
  taskset: { val: [], flag: ["-a", "-c", "-p", "-h", "-V"], pos: ["0"] },
  flock: {
    val: ["-E", "--conflict-exit-code", "-w", "--wait", "--timeout", "--start", "--length"],
    flag: [
      "-F",
      "-n",
      "--nb",
      "--nonblocking",
      "-o",
      "-s",
      "-u",
      "-e",
      "-x",
      "--exclusive",
      "--verbose",
      "--fcntl",
      "-h",
      "-V",
    ],
    pos: ["/tmp/orv.lock"],
  },
  lockf: { val: ["-t"], flag: ["-k", "-n", "-s", "-w"], pos: ["/tmp/orv.lock"] },
  sudo: {
    val: ["-a", "-C", "-c", "-D", "-g", "-p", "-R", "-r", "-t", "-T", "-U", "-u"],
    flag: [
      "-A",
      "-B",
      "-b",
      "-E",
      "-e",
      "-H",
      "-K",
      "-k",
      "-l",
      "-N",
      "-n",
      "-P",
      "-S",
      "-V",
      "-v",
    ],
    eq: ["--preserve-env"],
    attached: ["-h"],
    pos: [],
  },
  doas: { val: ["-a", "-C", "-u"], flag: ["-L", "-n", "-s"], pos: [] },
  chronic: { val: [], flag: ["-e", "-v"], pos: [] },
  unbuffer: { val: [], flag: ["-p"], pos: [] },
  script: {
    val: [
      "-E",
      "--echo",
      "-B",
      "--log-io",
      "-I",
      "--log-in",
      "-O",
      "--log-out",
      "-T",
      "--log-timing",
      "-m",
      "--logging-format",
      "-o",
      "--output-limit",
    ],
    flag: ["-a", "-d", "-e", "-F", "-f", "--force", "-k", "-p", "-q", "-r", "-h", "-V"],
    eqOpt: ["--timing"],
    attached: ["-t"],
    pos: ["/tmp/orv.log"],
  },
  nohup: { val: [], flag: ["--help", "--version"], pos: [] },
  timeout: {
    val: ["-k", "--kill-after", "-s", "--signal"],
    flag: [
      "-f",
      "--foreground",
      "-p",
      "--preserve-status",
      "-v",
      "--verbose",
      "--help",
      "--version",
    ],
    pos: ["5"],
  },
  env: {
    val: ["-a", "--argv0", "-u", "--unset", "-C", "--chdir", "-P"],
    flag: [
      "-i",
      "--ignore-environment",
      "-0",
      "--null",
      "-v",
      "--debug",
      "--list-signal-handling",
      "-",
    ],
    eqOpt: ["--block-signal", "--default-signal", "--ignore-signal"],
    pos: ["A=1"],
  },
  chroot: {
    val: [],
    flag: ["--skip-chdir", "--help", "--version"],
    eq: ["--groups", "--userspec"],
    pos: ["/tmp/root"],
  },
  prlimit: {
    val: ["-o", "--output", "-p", "--pid"],
    flag: ["--noheadings", "--raw", "--verbose", "-h", "-V"],
    eq: [
      "--core",
      "--data",
      "--nice",
      "--fsize",
      "--sigpending",
      "--memlock",
      "--rss",
      "--nofile",
      "--msgqueue",
      "--rtprio",
      "--stack",
      "--cpu",
      "--nproc",
      "--as",
      "--locks",
      "--rttime",
    ],
    pos: [],
  },
  arch: {
    whole: true,
    val: ["-arch", "-d", "-e"],
    flag: ["-32", "-64", "-c", "-h", "-i386", "-x86_64", "-x86_64h", "-arm64", "-arm64e"],
    pos: [],
  },
  xcrun: {
    val: ["--sdk", "--toolchain"],
    flag: ["-v", "-n", "-k", "-l", "-f", "-r", "--find", "--show-sdk-path"],
    pos: [],
  },
  "sandbox-exec": { val: ["-f", "-n", "-p", "-D"], flag: [], pos: [] },
  "pnpm exec": {
    val: ["--resume-from", "--filter"],
    flag: ["-r", "--recursive", "--parallel", "--no-reporter-hide-prefix", "--report-summary"],
    pos: [],
  },
  npx: { val: ["--package", "-p"], flag: ["--yes", "-y", "--no"], pos: [] },
};

/** The text of `runner options... positional... git switch x`. */
const run = (runner, options, positional) =>
  [runner, ...options, ...positional, "git switch x"].join(" ");

for (const [runner, g] of Object.entries(GRAMMAR)) {
  test(`ORV-138 row 57: every option of the ${runner} row of Runner grammar is skipped, and one outside the row makes the call unknown`, () => {
    const check = (options, label) => {
      const text = run(runner, options, g.pos);
      const read = readShell(text);
      const seg = read.segments.at(-1);
      assert.equal(seg.command, "git", `${label}: ${text}`);
      assert.equal(said(seg), "git switch x", `${label}: ${text}`);
      assert.deepEqual(read.causes, [], `${label}: ${text}`);
    };
    for (const o of g.flag) check([o], `flag ${o}`);
    for (const o of g.val) {
      check([o, "VALUE"], `value ${o}`);
      if (o.startsWith("--")) check([`${o}=VALUE`], `value ${o}=`);
      else if (!g.whole) check([`${o}VALUE`], `attached ${o}`);
    }
    for (const o of g.eq ?? []) check([`${o}=VALUE`], `eq ${o}`);
    for (const o of g.eqOpt ?? []) {
      check([o], `eqOpt ${o}`);
      check([`${o}=VALUE`], `eqOpt ${o}=`);
    }
    for (const o of g.attached ?? []) check([`${o}VALUE`], `attached ${o}`);
    // none, then all of them in one call
    check([], "no option");
    // (script reads a `--` first as "no file")
    if (runner !== "script") check(["--"], "end of options");
    // an option the row does not give
    for (const o of ["-Z", "--zzz-not-an-option", "-Z5"]) {
      const read = readShell(run(runner, [o], g.pos));
      assert.equal(read.unknown, true, `${runner} ${o}`);
      assert.deepEqual(read.causes, [`runner:${runner}`], `${runner} ${o}`);
    }
    // an expansion where an option may stand
    const read = readShell(run(runner, ["$X"], g.pos));
    assert.equal(read.unknown, true);
    assert.deepEqual(read.causes, [`runner:${runner}`]);
  });
}

test("ORV-138 row 57: the Example of each row of Runner grammar before git switch x leaves git as the command name", () => {
  const examples = [
    "nice -n 5",
    "/usr/bin/time -p",
    "stdbuf -o0",
    "caffeinate -i",
    "ionice -c 3",
    "setsid -f",
    "chrt -f 10",
    "taskset -c 0",
    "flock /tmp/orv.lock",
    "lockf /tmp/orv.lock",
    "sudo -u x",
    "doas -u x",
    "chronic -v",
    "unbuffer -p",
    "script -q /tmp/orv.log",
    "nohup",
    "timeout -s KILL 5",
    "env -i -u X",
    "chroot /tmp/root",
    "prlimit --nofile=5",
    "arch -arm64",
    "xcrun --sdk macosx",
    "sandbox-exec -n no-network",
    "pnpm exec",
    "npx --yes --",
  ];
  assert.equal(examples.length, Object.keys(GRAMMAR).length);
  for (const example of examples) {
    const read = readShell(`${example} git switch x`);
    const seg = read.segments.at(-1);
    assert.equal(seg.command, "git", example);
    assert.equal(said(seg), "git switch x", example);
    assert.equal(read.unknown, false, example);
  }
});

test("ORV-138 row 57: runners chain, and the shell words of zsh are skipped", () => {
  for (const text of [
    "sudo -u x nice -n 5 git switch x",
    "nice -n 5 stdbuf -o0 /usr/bin/time -p git switch x",
    "- git switch x",
    "noglob git switch x",
    "nocorrect git switch x",
    "repeat 3 git switch x",
    "=git switch x",
    "if [[ -n a ]] { git switch x }",
    "{ : } always { git switch x }",
    "foreach f (a) git switch x; end",
    "end git switch x",
    "foreach git switch x",
    "for f (a) git switch x",
    "FOO=1 sudo FOO=2 nice git switch x",
  ]) {
    const read = readShell(text);
    assert.ok(
      read.segments.some((s) => s.command === "git" && said(s).endsWith("git switch x")),
      text,
    );
    assert.equal(read.unknown, false, text);
  }
  assert.equal(only("=git switch x").command, "git");
  assert.equal(only('"=git" switch x').command, "=git");
  assert.equal(only("repeat 3").command, null);
  assert.equal(only("[[ -f x ]]").command, null);
  assert.equal(only("[[ -f x ]] rm y").command, "rm");
});

test("ORV-138 row 57: sudo -D, sudo -R and chroot are recorded as a folder change", () => {
  for (const text of [
    "sudo -D d git switch x",
    "sudo -Dd git switch x",
    "sudo -R d git switch x",
    "sudo -u x -D d git switch x",
    "sudo -nD d git switch x",
    "chroot d git switch x",
    "env -C d git switch x",
    "env --chdir=d git switch x",
  ]) {
    const seg = only(text);
    assert.equal(seg.command, "git", text);
    assert.equal(seg.envChdir.length, 1, text);
  }
  assert.deepEqual(
    only("sudo -D d git switch x").envChdir.map((w) => w.fixed),
    ["d"],
  );
  assert.deepEqual(
    only("chroot d git switch x").envChdir.map((w) => w.fixed),
    ["d"],
  );
  assert.deepEqual(only("sudo -u d git switch x").envChdir, []);
  assert.deepEqual(only("nice -n 5 git switch x").envChdir, []);
});

test("ORV-138 row 57: sudo GIT_DIR=x and arch -e GIT_DIR=x are recorded as a GIT_DIR assignment", () => {
  for (const text of [
    "sudo GIT_DIR=x git switch x",
    "sudo -u x GIT_DIR=x git switch x",
    "arch -e GIT_DIR=x git switch x",
    "env GIT_DIR=x git switch x",
  ]) {
    const seg = only(text);
    assert.equal(seg.command, "git", text);
    assert.deepEqual(
      seg.gitEnv.map((g) => [g.name, g.word.raw]),
      [["GIT_DIR", "GIT_DIR=x"]],
      text,
    );
  }
  assert.deepEqual(
    only("sudo GIT_WORK_TREE=y git switch x").gitEnv.map((g) => g.name),
    ["GIT_WORK_TREE"],
  );
  assert.deepEqual(only("sudo GIT_TRACE=0 git switch x").gitEnv, []);
  assert.deepEqual(only("arch -e GIT_TRACE=0 git switch x").gitEnv, []);
});

test("ORV-138 row 57: a runner option is read as getopt reads it", () => {
  // -- ends the options; a letter with a value takes the rest of the word or the next word
  assert.equal(only("nice -- git switch x").command, "git");
  assert.equal(only("nice -n5 git switch x").command, "git");
  assert.equal(only("nice -5 git switch x").command, "git");
  assert.equal(only("nice --adjustment 5 git switch x").command, "git");
  assert.equal(only("caffeinate -dis -t 5 git switch x").command, "git");
  assert.equal(only("caffeinate -dist5 git switch x").command, "git");
  assert.equal(only("env -iu X git switch x").command, "git");
  assert.equal(only("sudo -nu x git switch x").command, "git");
  assert.equal(only("sudo -hhost git switch x").command, "git");
  assert.equal(only("sudo --preserve-env=PATH git switch x").command, "git");
  assert.equal(only("script -q -t5 /tmp/f git switch x").command, "git");
  assert.equal(only("script -- git switch x").command, "git");
  assert.equal(only("script /tmp/f -- git switch x").command, "git");
  assert.equal(only("flock -n -w 5 /tmp/f git switch x").command, "git");
  assert.equal(only("timeout -k 1 -s TERM 5 git switch x").command, "git");
  assert.equal(only("timeout -- 5 git switch x").command, "git");
  assert.equal(only("chrt -r 10 git switch x").command, "git");
  // a value word may hold an expansion; a flag word may not
  assert.equal(only("nice -n $N git switch x").command, "git");
  assert.equal(only("nice -n$N git switch x").command, "git");
  assert.equal(only("nice --adjustment=$N git switch x").command, "git");
  assert.equal(readShell("nice -$N git switch x").unknown, true);
  assert.equal(readShell("caffeinate -i$X git switch x").unknown, true);
  // a bare long option that takes a value only after = is unknown; so is an abbreviation
  assert.equal(readShell("sudo --preserve-env git switch x").unknown, true);
  assert.equal(readShell("chroot --userspec x /r git switch x").unknown, true);
  assert.equal(readShell("nice --adj 5 git switch x").unknown, true);
  // a lone - is an option of env; arch reads each option as one word
  assert.equal(only("env - git switch x").command, "git");
  assert.equal(readShell("arch -arm64e git switch x").unknown, false);
  assert.equal(readShell("arch -ad git switch x").unknown, true);
  assert.equal(only("arch -arch arm64 git switch x").command, "git");
  // xcrun --show- options, the digits option of nice
  assert.equal(only("xcrun --show-sdk-version git switch x").command, "git");
  assert.equal(only("nice -10 git switch x").command, "git");
  assert.equal(readShell("time -5 git switch x").unknown, true);
});

test("ORV-138 row 57: a positional word of a runner, and the forms of its Makes the call unknown cell", () => {
  // a missing positional word runs no command
  assert.equal(only("timeout 5").command, null);
  assert.equal(only("timeout 5").unknown, false);
  // an expansion where a positional word stands
  for (const text of [
    "timeout $D git switch x",
    "timeout 1$D git switch x",
    "taskset 0x$M git switch x",
    "lockf f$X git switch x",
    "script f$X git switch x",
    "flock f$X git switch x",
    "chrt 1$X git switch x",
    "taskset -c $M git switch x",
    "flock $F git switch x",
    "chroot $R git switch x",
    "env $X git switch x",
    "sudo $X git switch x",
    "script $F git switch x",
  ]) {
    const read = readShell(text);
    assert.equal(read.unknown, true, text);
    assert.deepEqual(read.causes.length, 1, text);
  }
  // the cells: flock -c right after the file or among the options, chrt without a priority,
  // script -c and --command and a bare -t, env --split-string
  for (const text of [
    "flock /f --command 'git status'",
    "flock /f --command='git status'",
    "flock --command 'git status' /f",
    "chrt -f git switch x",
    "chrt -f 1x git switch x",
    "script --command 'git status' /f",
    "script -qt /f git switch x",
    "env --split-string 'git status'",
    "env -iS 'git status'",
    "sudo --shell git status",
    "pnpm exec --shell-mode git status",
    "npx --call 'git status'",
    "nice --adjustment$X git switch x",
    "env --chdir$X git switch x",
    "prlimit -c git status",
    "prlimit -o git status; prlimit -n5 git status",
  ]) {
    const read = readShell(text);
    assert.equal(read.unknown, true, text);
    assert.ok(
      read.causes.every((c) => c.startsWith("runner:")),
      text,
    );
  }
  // a lone - is an option of env, so more options may follow it; elsewhere it ends the options
  assert.equal(only("env - -i git switch x").command, "git");
  assert.equal(only("env - -u A git switch x").command, "git");
  // pnpm without exec is a command; npx and pnpm exec options after the command are its own
  assert.equal(only("pnpm lint").command, "pnpm");
  assert.equal(only("pnpm exec vitest -c x").command, "vitest");
  assert.equal(only("pnpm --filter x exec git switch x").command, "pnpm");
  // watch and parallel only at command position
  assert.equal(readShell("echo watch parallel").unknown, false);
  // a runner name by its base name, in any case, in quotes, after another runner
  assert.equal(only("/usr/bin/NICE git switch x").command, "git");
  assert.equal(only('"nice" git switch x').command, "git");
  assert.equal(only("sudo /usr/bin/env git switch x").command, "git");
  // xargs has no row: it stays a named bypass
  assert.equal(only("xargs git switch x").command, "xargs");
});

// ---- row 62: linear time (sec-F7)

for (const char of ["[", "{"]) {
  test(`ORV-138 row 62: a call of echo, a space and 100,000 ${char} is read within 3,000 ms`, () => {
    const text = `echo ${char.repeat(100000)}`;
    assert.equal(text.length, 100005);
    const started = Date.now();
    const read = readShell(text);
    const took = Date.now() - started;
    assert.ok(took < 3000, `${took} ms`);
    assert.equal(read.segments.length, 1);
    assert.equal(read.segments[0].words[1].kind, "none");
    assert.equal(read.unknown, false);
  });
}

test("ORV-138 row 62: a word of brackets or braces that do open an expansion is read within 3,000 ms too, and its expansions are counted", () => {
  for (const [open, close] of [
    ["[", "]"],
    ["{", ",}"],
    ["{", "..}"],
  ]) {
    const text = `echo ${open.repeat(100000)}${close}`;
    const started = Date.now();
    const word = readShell(text).segments[0].words[1];
    assert.ok(Date.now() - started < 3000, `${open}${close}`);
    // every opener has its closing character after it
    assert.equal(word.expansions.length, 100000, `${open}${close}`);
  }
});

test("ORV-138 row 62: [ and { look ahead as before for a closing ] and a } with a , or ..", () => {
  const exp = (text) => only(`x ${text}`).words[1].expansions;
  assert.deepEqual(exp("[a]"), ["["]);
  assert.deepEqual(exp("[a"), []);
  assert.deepEqual(exp("{a,b}"), ["{"]);
  assert.deepEqual(exp("{a..b}"), ["{"]);
  assert.deepEqual(exp("{a.b}"), []);
  assert.deepEqual(exp("{a}"), []);
  assert.deepEqual(exp("{}"), []);
  assert.deepEqual(exp("{,}"), ["{"]);
  assert.deepEqual(exp("{..}"), ["{"]);
  assert.deepEqual(exp("{.}"), []);
  assert.deepEqual(exp("{{a,b}"), ["{", "{"]);
  assert.deepEqual(exp("{a}b,c}"), []);
  assert.deepEqual(exp("a{b,c}d{e..f}"), ["{", "{"]);
  assert.deepEqual(exp("{\\,}"), []);
  assert.deepEqual(exp("{'a,b'}"), []);
});
