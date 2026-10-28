// ORV-138 rows 38 to 44: shell-words rule shell-1 clauses (a) to (g)
// (docs/specs/ORV-138/spec.md). Every form below is copied from the spec rows, "Write-guard forms
// to catch", "Branch switch forms", "Branch forms to keep" or the Worked examples; the module is
// pure, so a test feeds text and reads the segments back. The forms and classes come from survey
// K-0090 (docs/knowledge/enforcement/K-0090-bash-forms-for-text-guards.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { readShell } from "./shell-words.mjs";
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
    "git status # ; git switch x",
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

test("ORV-138 row 38: a # starts no comment, the text after it is live", () => {
  const seg = find("git status # ; git switch x", "git switch x");
  assert.equal(seg.command, "git");
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
