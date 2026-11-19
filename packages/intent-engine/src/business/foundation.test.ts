import { describe, expect, it } from "vitest";
import * as engine from "../index";
import { PERSONALITY_AXES } from "../knowledge";
import { briefFactsSchema } from "../rules";
import {
  AXIS_VALUES,
  checkEntry,
  newestByNode,
  storedEntrySchema,
  type EntryInput,
  type EntryProblem,
  type StoredEntry,
} from "./foundation";
import marksSource from "./foundation-marks.ts?raw";
import foundationSource from "./foundation.ts?raw";
import { axisPointOf, axisValueOf } from "./foundation-marks";

// ORV-291 tech notes section 13, T1 to T3 and T26; spec rows 1, 2 and 13 (the engine half).

const PID = "3f2b8c1e-0d4a-4b7e-9c55-1a2b3c4d5e6f";
const AXES = { playful: 0, expressive: 25, structured: 50, warm: 75, premium: 100 };
const given = (payload: unknown, extra: Record<string, unknown> = {}) => ({
  projectId: PID,
  node: "identity-frame",
  kind: "given",
  payload,
  ...extra,
});
const skipped = (payload: unknown = {}) => ({
  projectId: PID,
  node: "identity-frame",
  kind: "skipped",
  payload,
});
const problemsOf = (input: unknown): EntryProblem[] => {
  const checked = checkEntry(input);
  if (checked.ok) throw new Error("expected a refusal");
  return checked.problems;
};
const entryOf = (input: unknown): EntryInput => {
  const checked = checkEntry(input);
  if (!checked.ok) throw new Error(`expected an entry, got ${JSON.stringify(checked.problems)}`);
  return checked.entry;
};

describe("identity-frame entry", () => {
  it("parses the full entry with an answer of 1 and one of 2,000 characters", () => {
    const entry = entryOf(given({ axes: AXES, person: "a", never: "ก".repeat(2000) }));
    expect(entry).toEqual({
      projectId: PID,
      node: "identity-frame",
      kind: "given",
      payload: { axes: AXES, person: "a", never: "ก".repeat(2000) },
    });
  });

  it("parses an entry with no person and no never, and a skip with an empty payload", () => {
    expect(entryOf(given({ axes: AXES })).kind).toBe("given");
    expect(entryOf(skipped())).toEqual({
      projectId: PID,
      node: "identity-frame",
      kind: "skipped",
      payload: {},
    });
  });

  it("each other input fails at the path of its field", () => {
    const fourAxes = Object.fromEntries(Object.entries(AXES).filter(([k]) => k !== "premium"));
    const rows: Array<[string, unknown, EntryProblem[]]> = [
      [
        "no premium",
        given({ axes: fourAxes }),
        [{ path: "payload.axes.premium", kind: "required" }],
      ],
      [
        "warm 60",
        given({ axes: { ...AXES, warm: 60 } }),
        [{ path: "payload.axes.warm", kind: "invalid" }],
      ],
      [
        "person of 2,001",
        given({ axes: AXES, person: "x".repeat(2001) }),
        [{ path: "payload.person", kind: "too-long" }],
      ],
      [
        "a skip with an axes key",
        skipped({ axes: AXES }),
        [{ path: "payload.axes", kind: "unknown-key" }],
      ],
      [
        "an unknown top-level key score",
        given({ axes: AXES }, { score: 1 }),
        [{ path: "score", kind: "unknown-key" }],
      ],
      [
        "the node color",
        { projectId: PID, node: "color", kind: "given", payload: { axes: AXES } },
        [{ path: "node", kind: "invalid" }],
      ],
    ];
    for (const [name, input, expected] of rows) {
      expect(problemsOf(input), name).toEqual(expected);
    }
  });

  it("refuses a payload key outside its row, an unknown axis, and a kind the node has not", () => {
    expect(problemsOf(given({ axes: AXES, extra: "x" }))).toEqual([
      { path: "payload.extra", kind: "unknown-key" },
    ]);
    expect(problemsOf(given({ axes: { ...AXES, bold: 50 } }))).toEqual([
      { path: "payload.axes.bold", kind: "unknown-key" },
    ]);
    expect(
      problemsOf({ projectId: PID, node: "identity-frame", kind: "written", payload: {} }),
    ).toEqual([{ path: "kind", kind: "invalid" }]);
  });

  it("a missing field is required, a present wrong one invalid, a skip needs its empty payload", () => {
    expect(problemsOf({ node: "identity-frame", kind: "skipped", payload: {} })).toEqual([
      { path: "projectId", kind: "required" },
    ]);
    expect(problemsOf({ ...skipped(), projectId: "not-a-uuid" })).toEqual([
      { path: "projectId", kind: "invalid" },
    ]);
    expect(problemsOf({ projectId: PID, node: "identity-frame", payload: {} })).toEqual([
      { path: "kind", kind: "required" },
    ]);
    expect(problemsOf({ projectId: PID, node: "identity-frame", kind: "skipped" })).toEqual([
      { path: "payload", kind: "required" },
    ]);
    expect(problemsOf({ projectId: PID, kind: "skipped", payload: {} })).toEqual([
      { path: "node", kind: "required" },
    ]);
    expect(problemsOf(given({ axes: AXES, person: 5 }))).toEqual([
      { path: "payload.person", kind: "invalid" },
    ]);
    expect(problemsOf(given({ axes: AXES, person: null }))).toEqual([
      { path: "payload.person", kind: "invalid" },
    ]);
  });

  it("a skip refuses a top-level key outside its row too", () => {
    expect(problemsOf({ ...skipped(), score: 1 })).toEqual([
      { path: "score", kind: "unknown-key" },
    ]);
  });

  it("the project id is a whole UUID, in either case, and nothing else", () => {
    expect(checkEntry({ ...skipped(), projectId: PID.toUpperCase() }).ok).toBe(true);
    for (const bad of [
      `x${PID}`,
      `${PID}x`,
      PID.slice(0, -1),
      `${PID}0`,
      PID.replaceAll("-", ""),
      PID.replace("9c55", "9g55"),
      "",
    ]) {
      expect(problemsOf({ ...skipped(), projectId: bad }), bad).toEqual([
        { path: "projectId", kind: "invalid" },
      ]);
    }
  });

  it("an input that is no object gives one problem at the root and never throws", () => {
    for (const input of [null, undefined, "x", 7, [], true]) {
      expect(problemsOf(input)).toEqual([{ path: "", kind: "invalid" }]);
    }
  });

  it("a problem holds a path and a kind only: no value reaches it", () => {
    const secret = "SECRET-ANSWER-MARKER";
    const problems = [
      ...problemsOf(
        given({ axes: { ...AXES, warm: secret }, person: `${secret}${"x".repeat(2001)}` }),
      ),
      ...problemsOf({ ...given({ axes: AXES }), node: secret }),
    ];
    expect(problems.length).toBeGreaterThanOrEqual(3);
    for (const p of problems) expect(Object.keys(p).sort()).toEqual(["kind", "path"]);
    expect(JSON.stringify(problems)).not.toContain(secret);
  });

  it("reports each problem once: a text past both the raw cap and its bound is one problem", () => {
    expect(problemsOf(given({ axes: AXES, person: "x".repeat(9000) }))).toEqual([
      { path: "payload.person", kind: "too-long" },
    ]);
  });

  it("holds the five axis values, each accepted and each neighbour refused", () => {
    expect(AXIS_VALUES).toEqual([0, 25, 50, 75, 100]);
    for (const value of [0, 25, 50, 75, 100]) {
      expect(checkEntry(given({ axes: { ...AXES, playful: value } })).ok, String(value)).toBe(true);
    }
    for (const value of [
      -25,
      -1,
      1,
      10,
      24,
      26,
      49,
      51,
      60,
      74,
      76,
      90,
      99,
      101,
      125,
      50.5,
      "50",
      null,
    ]) {
      expect(checkEntry(given({ axes: { ...AXES, playful: value } })).ok, String(value)).toBe(
        false,
      );
    }
  });

  it("every one of the five axes is checked, not only the first", () => {
    for (const axis of PERSONALITY_AXES) {
      expect(problemsOf(given({ axes: { ...AXES, [axis]: 60 } }))).toEqual([
        { path: `payload.axes.${axis}`, kind: "invalid" },
      ]);
    }
  });

  it("the bound of an answer is 2,000: 2,000 passes, 2,001 is too long, for each answer", () => {
    for (const key of ["person", "never"] as const) {
      expect(checkEntry(given({ axes: AXES, [key]: "x".repeat(2000) })).ok, key).toBe(true);
      expect(problemsOf(given({ axes: AXES, [key]: "x".repeat(2001) })), key).toEqual([
        { path: `payload.${key}`, kind: "too-long" },
      ]);
    }
  });
});

describe("text rules", () => {
  const payloadOf = (input: unknown) => {
    const entry = entryOf(input);
    if (entry.kind !== "given") throw new Error("a given entry");
    return entry.payload;
  };

  it("trims an answer", () => {
    expect(
      payloadOf(given({ axes: AXES, person: "  ร่าเริง  ", never: "\n\tแข็งกร้าว \n" })),
    ).toEqual({ axes: AXES, person: "ร่าเริง", never: "แข็งกร้าว" });
  });

  it("drops U+0000, then trims: the order shows on a NUL beside white space", () => {
    expect(payloadOf(given({ axes: AXES, person: "\u0000 warm \u0000" })).person).toBe("warm");
    expect(payloadOf(given({ axes: AXES, person: "a\u0000b" })).person).toBe("ab");
  });

  it("an empty optional answer is absent from the payload, not an empty string", () => {
    for (const empty of ["", "   ", "\u0000", " \u0000 \n"]) {
      const payload = payloadOf(given({ axes: AXES, person: empty, never: empty }));
      expect(Object.keys(payload)).toEqual(["axes"]);
    }
    const mixed = payloadOf(given({ axes: AXES, person: "", never: "x" }));
    expect(Object.keys(mixed).sort()).toEqual(["axes", "never"]);
  });

  it("counts length in UTF-16 units, and a 2,000 Thai answer parses", () => {
    expect(checkEntry(given({ axes: AXES, never: "ก".repeat(2000) })).ok).toBe(true);
    expect(checkEntry(given({ axes: AXES, never: "😀".repeat(1000) })).ok).toBe(true);
    expect(problemsOf(given({ axes: AXES, never: "😀".repeat(1001) }))).toEqual([
      { path: "payload.never", kind: "too-long" },
    ]);
  });

  it("the raw cap of 8,000 keeps a padded payload cheap: 8,000 of padding passes, 8,001 is too long", () => {
    const padded = (n: number) => `${" ".repeat(n)}x`;
    expect(payloadOf(given({ axes: AXES, person: padded(7999) })).person).toBe("x");
    expect(problemsOf(given({ axes: AXES, person: padded(8000) }))).toEqual([
      { path: "payload.person", kind: "too-long" },
    ]);
  });
});

describe("axes fit ORV-20's personality facts", () => {
  it("a given payload's axes parse with the personality schema of rules.ts, unchanged", () => {
    const entry = entryOf(given({ axes: AXES }));
    if (entry.kind !== "given") throw new Error("given");
    const facts = briefFactsSchema.safeParse({
      personality: entry.payload.axes,
      industry: null,
      audiences: [],
      avoid: [],
    });
    expect(facts.success).toBe(true);
    expect(Object.keys(entry.payload.axes)).toEqual([...PERSONALITY_AXES]);
  });

  it("the stored value of a point is (point - 1) * 25, and back", () => {
    expect([1, 2, 3, 4, 5].map((p) => axisValueOf(p as 1 | 2 | 3 | 4 | 5))).toEqual([
      0, 25, 50, 75, 100,
    ]);
    expect(AXIS_VALUES.map((v) => axisPointOf(v))).toEqual([1, 2, 3, 4, 5]);
  });

  it("points 1 to 5 are never an entry: a point stored as itself is refused on every axis", () => {
    const points = { playful: 1, expressive: 2, structured: 3, warm: 4, premium: 5 };
    expect(problemsOf(given({ axes: points })).map((p) => p.path)).toEqual(
      PERSONALITY_AXES.map((a) => `payload.axes.${a}`),
    );
  });
});

describe("the stored entry", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: "e1",
    node: "identity-frame",
    kind: "given",
    payload: { axes: AXES, person: " keeps its spaces ", never: "x" },
    createdAt: "2026-11-19T03:04:05.000Z",
    ...over,
  });

  it("parses a given row and a skipped row as they are, with no transform", () => {
    expect(storedEntrySchema.parse(row())).toEqual(row());
    expect(storedEntrySchema.parse(row({ kind: "skipped", payload: {} })).kind).toBe("skipped");
    expect(storedEntrySchema.parse(row({ payload: { axes: AXES } })).kind).toBe("given");
  });

  it.each([
    ["an unknown top-level key", row({ extra: 1 })],
    ["an unknown payload key", row({ payload: { axes: AXES, extra: 1 } })],
    ["an unknown top-level key on a skipped row", row({ kind: "skipped", payload: {}, extra: 1 })],
    ["an empty answer", row({ payload: { axes: AXES, person: "" } })],
    ["an answer of 2,001", row({ payload: { axes: AXES, never: "x".repeat(2001) } })],
    ["an axis outside the five values", row({ payload: { axes: { ...AXES, warm: 60 } } })],
    ["a missing axis", row({ payload: { axes: { playful: 0 } } })],
    ["a given row with no axes", row({ payload: { person: "x" } })],
    ["a skipped row with a payload", row({ kind: "skipped", payload: { axes: AXES } })],
    ["an unknown node", row({ node: "color" })],
    ["an unknown kind", row({ kind: "written" })],
    ["an empty id", row({ id: "" })],
    ["a created time that is no ISO time", row({ createdAt: "yesterday" })],
  ])("refuses %s", (_name, input) => {
    expect(storedEntrySchema.safeParse(input).success).toBe(false);
  });

  it("an answer of 2,000 stored passes", () => {
    expect(
      storedEntrySchema.safeParse(row({ payload: { axes: AXES, person: "x".repeat(2000) } }))
        .success,
    ).toBe(true);
  });
});

describe("newest by node", () => {
  const at = (id: string, createdAt: string, kind: "given" | "skipped" = "skipped"): StoredEntry =>
    storedEntrySchema.parse({
      id,
      node: "identity-frame",
      kind,
      payload: kind === "skipped" ? {} : { axes: AXES },
      createdAt,
    });

  it("is null for a node with no entry", () => {
    expect(newestByNode([])).toEqual({ "identity-frame": null });
  });

  it("is the entry with the latest created time, in whatever order the list comes", () => {
    const older = at("z", "2026-11-19T03:00:00.000Z");
    const newer = at("a", "2026-11-19T04:00:00.000Z", "given");
    expect(newestByNode([older, newer])["identity-frame"]?.id).toBe("a");
    expect(newestByNode([newer, older])["identity-frame"]?.id).toBe("a");
  });

  it("breaks a tie of time by the larger id", () => {
    const a = at("a", "2026-11-19T03:00:00.000Z");
    const b = at("b", "2026-11-19T03:00:00.000Z", "given");
    expect(newestByNode([a, b])["identity-frame"]?.id).toBe("b");
    expect(newestByNode([b, a])["identity-frame"]?.id).toBe("b");
  });
});

describe("exports", () => {
  it("the package index exports the entry contract and the marks", () => {
    expect(typeof engine.checkEntry).toBe("function");
    expect(typeof engine.storedEntrySchema.parse).toBe("function");
    expect(typeof engine.newestByNode).toBe("function");
    expect(typeof engine.foundationMarks).toBe("function");
    expect(typeof engine.entryAllowed).toBe("function");
    expect(engine.FOUNDATION_NODES).toEqual(["identity-frame"]);
  });
});

/**
 * The names of every module a source text imports, through each syntax form: a single-line import,
 * a multi-line import, a side-effect import, a dynamic `import()` and an `export ... from`.
 */
function importedModules(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const found: string[] = [];
  const forms = [
    /\b(?:import|export)\b[^;'"]*?\bfrom\s*["']([^"']+)["']/g, // single-line, multi-line, export from
    /\bimport\s*["']([^"']+)["']/g, // side-effect
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // dynamic
  ];
  for (const form of forms) for (const m of code.matchAll(form)) found.push(m[1] ?? "");
  return found;
}
const MODEL_MODULE = /(^|\/)(openrouter|llm-interpreter)(\.[cm]?[jt]s)?$/;
const modelImports = (source: string) =>
  importedModules(source).filter((m) => MODEL_MODULE.test(m));

describe("no model import", () => {
  const SAMPLES: Array<[string, string]> = [
    ["a single-line import", `import { AI_MODELS } from "./openrouter";`],
    ["a multi-line import", `import {\n  AI_MODELS,\n  type X,\n} from "../openrouter";`],
    ["a side-effect import", `import "./llm-interpreter";`],
    ["a dynamic import", `const m = await import("./openrouter");`],
    ["an export from", `export { AI_MODELS } from "./openrouter";`],
    ["an export star from", `export * from "./llm-interpreter";`],
    ["a type import", `import type { Complete } from "./llm-interpreter.ts";`],
  ];

  it.each(SAMPLES)("the guard catches %s", (_name, source) => {
    expect(modelImports(source)).toHaveLength(1);
  });

  it("the guard lets pass an import of another module and a comment that names one", () => {
    expect(modelImports(`import { z } from "zod";\nimport { A } from "./knowledge";`)).toEqual([]);
    expect(
      modelImports(
        `// import { AI_MODELS } from "./openrouter";\n/* import "./llm-interpreter"; */`,
      ),
    ).toEqual([]);
  });

  it("foundation.ts and foundation-marks.ts import neither openrouter nor llm-interpreter", () => {
    expect(importedModules(foundationSource).length).toBeGreaterThan(0);
    expect(importedModules(marksSource).length).toBeGreaterThan(0);
    expect(modelImports(foundationSource)).toEqual([]);
    expect(modelImports(marksSource)).toEqual([]);
  });
});
