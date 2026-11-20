import { describe, expect, it } from "vitest";
import * as engine from "../index";
import { STAND_IN_LINEUP } from "../color-fixtures";
import { PERSONALITY_AXES } from "../knowledge";
import { briefFactsSchema } from "../rules";
import {
  AXIS_VALUES,
  checkEntry,
  CORE_IDEA_MAX,
  newestByNode,
  storedEntrySchema,
  WORKING_NAME_MAX,
  type EntryInput,
  type EntryProblem,
  type EntryRequest,
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

// T27, spec row 14 and W5: the architecture and name arms of PR 2.
const answered = (subBrands: unknown, extra: Record<string, unknown> = {}) => ({
  projectId: PID,
  node: "architecture",
  kind: "answered",
  payload: { subBrands },
  ...extra,
});
const named = (name: unknown, payload: Record<string, unknown> = {}) => ({
  projectId: PID,
  node: "name",
  kind: "given",
  payload: { name, ...payload },
});
const THAI_60 = "ก".repeat(60);

describe("architecture and name entries", () => {
  it("row 14: the first four parse, the name as ORIVILO and the Thai name whole", () => {
    expect(entryOf(answered(false))).toEqual({
      projectId: PID,
      node: "architecture",
      kind: "answered",
      payload: { subBrands: false },
    });
    expect(entryOf(answered(true))).toEqual({
      projectId: PID,
      node: "architecture",
      kind: "answered",
      payload: { subBrands: true },
    });
    expect(entryOf(named("  ORIVILO  "))).toEqual({
      projectId: PID,
      node: "name",
      kind: "given",
      payload: { name: "ORIVILO" },
    });
    expect(entryOf(named(THAI_60))).toMatchObject({ payload: { name: THAI_60 } });
  });

  it("row 14: each other input fails at the path of its field", () => {
    const rows: Array<[string, unknown, EntryProblem[]]> = [
      ["subBrands as text", answered("no"), [{ path: "payload.subBrands", kind: "invalid" }]],
      ["a name of 61", named("ก".repeat(61)), [{ path: "payload.name", kind: "too-long" }]],
      ["white space only", named("   "), [{ path: "payload.name", kind: "required" }]],
      [
        "an unknown key screened",
        named("ORIVILO", { screened: true }),
        [{ path: "payload.screened", kind: "unknown-key" }],
      ],
      [
        "an architecture skip",
        { projectId: PID, node: "architecture", kind: "skipped", payload: {} },
        [{ path: "kind", kind: "invalid" }],
      ],
      [
        "a name skip",
        { projectId: PID, node: "name", kind: "skipped", payload: {} },
        [{ path: "kind", kind: "invalid" }],
      ],
    ];
    for (const [name, input, expected] of rows) {
      expect(problemsOf(input), name).toEqual(expected);
    }
  });

  it("W5: the trim and the bound of 1 to 60, as the node -e line prints it", () => {
    const printed = ["  ORIVILO  ", "ก".repeat(60), "ก".repeat(61), "   "].map((name) => {
      const checked = checkEntry(named(name));
      return checked.ok && checked.entry.node === "name"
        ? `ok:${checked.entry.payload.name.length}`
        : "refused";
    });
    expect(printed.join(" ")).toBe("ok:7 ok:60 refused refused");
  });

  it("the bound of a working name is 60: 1 and 60 pass, 61 is too long, nothing is required", () => {
    expect(WORKING_NAME_MAX).toBe(60);
    expect(checkEntry(named("x")).ok).toBe(true);
    expect(checkEntry(named("x".repeat(60))).ok).toBe(true);
    expect(problemsOf(named("x".repeat(61)))).toEqual([{ path: "payload.name", kind: "too-long" }]);
    for (const empty of ["", " ", "\n\t ", "\u0000", " \u0000 "]) {
      expect(problemsOf(named(empty)), JSON.stringify(empty)).toEqual([
        { path: "payload.name", kind: "required" },
      ]);
    }
  });

  it("a name drops U+0000 then trims, counts UTF-16 units and keeps a raw cap of 8,000", () => {
    const payloadName = (input: unknown) => {
      const entry = entryOf(input);
      if (entry.node !== "name") throw new Error("a name entry");
      return entry.payload.name;
    };
    expect(payloadName(named("\u0000 ORI\u0000VILO \u0000"))).toBe("ORIVILO");
    expect(checkEntry(named("😀".repeat(30))).ok).toBe(true);
    expect(problemsOf(named("😀".repeat(31)))).toEqual([
      { path: "payload.name", kind: "too-long" },
    ]);
    const padded = (n: number) => `${" ".repeat(n)}x`;
    expect(payloadName(named(padded(7999)))).toBe("x");
    expect(problemsOf(named(padded(8000)))).toEqual([{ path: "payload.name", kind: "too-long" }]);
  });

  it("a missing or mistyped name is required or invalid, never a value", () => {
    expect(problemsOf({ projectId: PID, node: "name", kind: "given", payload: {} })).toEqual([
      { path: "payload.name", kind: "required" },
    ]);
    expect(problemsOf(named(5))).toEqual([{ path: "payload.name", kind: "invalid" }]);
    expect(problemsOf(named(null))).toEqual([{ path: "payload.name", kind: "invalid" }]);
    expect(problemsOf({ projectId: PID, node: "name", kind: "given" })).toEqual([
      { path: "payload", kind: "required" },
    ]);
  });

  it("an answer is a boolean: each other value is invalid, a missing one required", () => {
    for (const bad of ["no", "true", 0, 1, null, [], {}]) {
      expect(problemsOf(answered(bad)), JSON.stringify(bad)).toEqual([
        { path: "payload.subBrands", kind: "invalid" },
      ]);
    }
    expect(
      problemsOf({ projectId: PID, node: "architecture", kind: "answered", payload: {} }),
    ).toEqual([{ path: "payload.subBrands", kind: "required" }]);
  });

  it("each arm refuses a key outside its row, at the root and in the payload", () => {
    expect(problemsOf(answered(true, { score: 1 }))).toEqual([
      { path: "score", kind: "unknown-key" },
    ]);
    expect(
      problemsOf({
        projectId: PID,
        node: "architecture",
        kind: "answered",
        payload: { subBrands: true, units: 3 },
      }),
    ).toEqual([{ path: "payload.units", kind: "unknown-key" }]);
    expect(problemsOf({ ...named("x"), score: 1 })).toEqual([
      { path: "score", kind: "unknown-key" },
    ]);
    expect(problemsOf(named("x", { person: "y" }))).toEqual([
      { path: "payload.person", kind: "unknown-key" },
    ]);
  });

  it("a kind of another node is refused: no given for architecture, no answered for name", () => {
    expect(
      problemsOf({
        projectId: PID,
        node: "architecture",
        kind: "given",
        payload: { subBrands: true },
      }),
    ).toEqual([{ path: "kind", kind: "invalid" }]);
    expect(
      problemsOf({ projectId: PID, node: "name", kind: "answered", payload: { name: "x" } }),
    ).toEqual([{ path: "kind", kind: "invalid" }]);
  });

  it("each new arm takes a whole UUID as the project id and nothing else", () => {
    for (const bad of [`x${PID}`, `${PID}x`, PID.replaceAll("-", ""), "not-a-uuid", ""]) {
      expect(problemsOf(answered(true, { projectId: bad })), bad).toEqual([
        { path: "projectId", kind: "invalid" },
      ]);
      expect(problemsOf({ ...named("x"), projectId: bad }), bad).toEqual([
        { path: "projectId", kind: "invalid" },
      ]);
    }
    expect(checkEntry(answered(true, { projectId: PID.toUpperCase() })).ok).toBe(true);
    expect(checkEntry({ ...named("x"), projectId: PID.toUpperCase() }).ok).toBe(true);
  });

  it("a node that is none of the four is refused at the node", () => {
    expect(problemsOf({ projectId: PID, node: "color", kind: "skipped", payload: {} })).toEqual([
      { path: "node", kind: "invalid" },
    ]);
  });

  it("a problem on a name holds a path and a kind only: the name never reaches it", () => {
    const secret = "SECRET-NAME-MARKER";
    const problems = [
      ...problemsOf(named(`${secret}${"x".repeat(61)}`)),
      ...problemsOf(named(secret, { screened: secret })),
      ...problemsOf(answered(secret)),
    ];
    expect(problems).toHaveLength(3);
    for (const p of problems) expect(Object.keys(p).sort()).toEqual(["kind", "path"]);
    expect(JSON.stringify(problems)).not.toContain(secret);
  });

  it("EntryRequest drops the project id of the two new arms", () => {
    const request: EntryRequest = { node: "name", kind: "given", payload: { name: "ORIVILO" } };
    const other: EntryRequest = {
      node: "architecture",
      kind: "answered",
      payload: { subBrands: false },
    };
    expect(checkEntry({ projectId: PID, ...request }).ok).toBe(true);
    expect(checkEntry({ projectId: PID, ...other }).ok).toBe(true);
  });
});

// T35, spec row 25: the arms of `core-idea` of PR 3.
const written = (statement: unknown, payload: Record<string, unknown> = {}, extra = {}) => ({
  projectId: PID,
  node: "core-idea",
  kind: "written",
  payload: { statement, ...payload },
  ...extra,
});
const coreSkipped = (payload: unknown = {}) => ({
  projectId: PID,
  node: "core-idea",
  kind: "skipped",
  payload,
});

describe("core-idea entry", () => {
  it("row 25: a statement of 1 and of 300 characters, with remember of 1 and of 2,000, parse", () => {
    expect(CORE_IDEA_MAX).toBe(300);
    expect(entryOf(written("x", { remember: "y" }))).toEqual({
      projectId: PID,
      node: "core-idea",
      kind: "written",
      payload: { statement: "x", remember: "y" },
    });
    const long = entryOf(written("ก".repeat(300), { remember: "ก".repeat(2000) }));
    expect(long).toMatchObject({
      node: "core-idea",
      payload: { statement: "ก".repeat(300), remember: "ก".repeat(2000) },
    });
  });

  it("row 25: one with no remember parses, and a skip with an empty payload parses", () => {
    expect(entryOf(written("  Make it simple  "))).toEqual({
      projectId: PID,
      node: "core-idea",
      kind: "written",
      payload: { statement: "Make it simple" },
    });
    expect(entryOf(coreSkipped())).toEqual({
      projectId: PID,
      node: "core-idea",
      kind: "skipped",
      payload: {},
    });
  });

  it("row 25: each other input fails at the path of its field", () => {
    const rows: Array<[string, unknown, EntryProblem[]]> = [
      ["white space only", written("   "), [{ path: "payload.statement", kind: "required" }]],
      [
        "301 characters",
        written("x".repeat(301)),
        [{ path: "payload.statement", kind: "too-long" }],
      ],
      [
        "remember of 2,001",
        written("x", { remember: "x".repeat(2001) }),
        [{ path: "payload.remember", kind: "too-long" }],
      ],
      [
        "a skip with a statement",
        coreSkipped({ statement: "x" }),
        [{ path: "payload.statement", kind: "unknown-key" }],
      ],
      [
        "a kind picked",
        { projectId: PID, node: "core-idea", kind: "picked", payload: { statement: "x" } },
        [{ path: "kind", kind: "invalid" }],
      ],
      [
        "an unknown key draftId",
        written("x", {}, { draftId: "d1" }),
        [{ path: "draftId", kind: "unknown-key" }],
      ],
    ];
    for (const [name, input, expected] of rows) {
      expect(problemsOf(input), name).toEqual(expected);
    }
  });

  it("the bound of a core idea is 300 in UTF-16 units: 300 passes, 301 is too long", () => {
    expect(checkEntry(written("😀".repeat(150))).ok).toBe(true);
    expect(problemsOf(written("😀".repeat(151)))).toEqual([
      { path: "payload.statement", kind: "too-long" },
    ]);
  });

  it("the statement drops U+0000, then trims, and nothing is required but the statement", () => {
    expect(entryOf(written("\u0000 a\u0000b \u0000"))).toMatchObject({
      payload: { statement: "ab" },
    });
    for (const empty of ["", " ", "\n\t ", "\u0000", " \u0000 "]) {
      expect(problemsOf(written(empty)), JSON.stringify(empty)).toEqual([
        { path: "payload.statement", kind: "required" },
      ]);
    }
    expect(problemsOf({ projectId: PID, node: "core-idea", kind: "written", payload: {} })).toEqual(
      [{ path: "payload.statement", kind: "required" }],
    );
    expect(problemsOf(written(5))).toEqual([{ path: "payload.statement", kind: "invalid" }]);
  });

  it("an empty remember is absent from the payload, a padded one is trimmed and capped raw at 8,000", () => {
    for (const empty of ["", "   ", "\u0000", " \u0000 \n"]) {
      const entry = entryOf(written("x", { remember: empty }));
      expect(Object.keys(entry.payload)).toEqual(["statement"]);
    }
    expect(entryOf(written("x", { remember: "  hi  " }))).toMatchObject({
      payload: { statement: "x", remember: "hi" },
    });
    const padded = (n: number) => `${" ".repeat(n)}x`;
    expect(checkEntry(written("x", { remember: padded(7999) })).ok).toBe(true);
    expect(problemsOf(written("x", { remember: padded(8000) }))).toEqual([
      { path: "payload.remember", kind: "too-long" },
    ]);
    expect(checkEntry(written("x", { remember: "😀".repeat(1000) })).ok).toBe(true);
    expect(problemsOf(written("x", { remember: "😀".repeat(1001) }))).toEqual([
      { path: "payload.remember", kind: "too-long" },
    ]);
  });

  it("each arm refuses a key outside its row, at the root and in the payload", () => {
    expect(problemsOf(written("x", {}, { score: 1 }))).toEqual([
      { path: "score", kind: "unknown-key" },
    ]);
    expect(problemsOf(written("x", { option: 2 }))).toEqual([
      { path: "payload.option", kind: "unknown-key" },
    ]);
    expect(problemsOf({ ...coreSkipped(), score: 1 })).toEqual([
      { path: "score", kind: "unknown-key" },
    ]);
  });

  it("a kind of another node is refused: no given and no answered for core-idea", () => {
    for (const kind of ["given", "answered", "edited"]) {
      expect(
        problemsOf({ projectId: PID, node: "core-idea", kind, payload: { statement: "x" } }),
        kind,
      ).toEqual([{ path: "kind", kind: "invalid" }]);
    }
    expect(
      problemsOf({ projectId: PID, node: "name", kind: "written", payload: { statement: "x" } }),
    ).toEqual([{ path: "kind", kind: "invalid" }]);
  });

  it("takes a whole UUID as the project id and nothing else", () => {
    for (const bad of [`x${PID}`, `${PID}x`, PID.replaceAll("-", ""), "not-a-uuid", ""]) {
      expect(problemsOf(written("x", {}, { projectId: bad })), bad).toEqual([
        { path: "projectId", kind: "invalid" },
      ]);
      expect(problemsOf({ ...coreSkipped(), projectId: bad }), bad).toEqual([
        { path: "projectId", kind: "invalid" },
      ]);
    }
    expect(checkEntry(written("x", {}, { projectId: PID.toUpperCase() })).ok).toBe(true);
  });

  it("a problem holds a path and a kind only: the statement never reaches it", () => {
    const secret = "SECRET-IDEA-MARKER";
    const problems = [
      ...problemsOf(written(`${secret}${"x".repeat(301)}`)),
      ...problemsOf(written(secret, { remember: secret.repeat(200) })),
      ...problemsOf(written(secret, { draftId: secret })),
    ];
    expect(problems).toHaveLength(3);
    for (const p of problems) expect(Object.keys(p).sort()).toEqual(["kind", "path"]);
    expect(JSON.stringify(problems)).not.toContain(secret);
  });

  it("EntryRequest drops the project id of the core-idea arms", () => {
    const request: EntryRequest = {
      node: "core-idea",
      kind: "written",
      payload: { statement: "x" },
    };
    const skip: EntryRequest = { node: "core-idea", kind: "skipped", payload: {} };
    expect(checkEntry({ projectId: PID, ...request }).ok).toBe(true);
    expect(checkEntry({ projectId: PID, ...skip }).ok).toBe(true);
  });
});

describe("text rules", () => {
  const payloadOf = (input: unknown) => {
    const entry = entryOf(input);
    if (entry.node !== "identity-frame" || entry.kind !== "given") {
      throw new Error("a given personality entry");
    }
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
    if (entry.node !== "identity-frame" || entry.kind !== "given") {
      throw new Error("a given personality entry");
    }
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

  describe("the architecture and name rows", () => {
    const stored = (node: string, kind: string, payload: unknown, over = {}) => ({
      id: "e1",
      node,
      kind,
      payload,
      createdAt: "2026-11-19T03:04:05.000Z",
      ...over,
    });

    it("parses an answered row of either value and a name of 1 and of 60, as they are", () => {
      for (const subBrands of [false, true]) {
        const row = stored("architecture", "answered", { subBrands });
        expect(storedEntrySchema.parse(row)).toEqual(row);
      }
      const spaced = stored("name", "given", { name: " keeps its spaces " });
      expect(storedEntrySchema.parse(spaced)).toEqual(spaced);
      expect(storedEntrySchema.safeParse(stored("name", "given", { name: "x" })).success).toBe(
        true,
      );
      expect(storedEntrySchema.safeParse(stored("name", "given", { name: THAI_60 })).success).toBe(
        true,
      );
    });

    it.each([
      ["an answer that is text", stored("architecture", "answered", { subBrands: "no" })],
      ["an answer that is missing", stored("architecture", "answered", {})],
      [
        "an unknown key beside the answer",
        stored("architecture", "answered", { subBrands: true, x: 1 }),
      ],
      [
        "an unknown top-level key on an answered row",
        stored("architecture", "answered", { subBrands: true }, { extra: 1 }),
      ],
      ["an architecture skip", stored("architecture", "skipped", {})],
      ["an architecture given row", stored("architecture", "given", { subBrands: true })],
      ["an empty name", stored("name", "given", { name: "" })],
      ["a name of 61", stored("name", "given", { name: "x".repeat(61) })],
      ["a name that is not text", stored("name", "given", { name: 5 })],
      ["a name row with no name", stored("name", "given", {})],
      ["an unknown key beside the name", stored("name", "given", { name: "x", screened: true })],
      [
        "an unknown top-level key on a name row",
        stored("name", "given", { name: "x" }, { extra: 1 }),
      ],
      ["a name skip", stored("name", "skipped", {})],
      ["a name answered row", stored("name", "answered", { name: "x" })],
    ])("refuses %s", (_label, row) => {
      expect(storedEntrySchema.safeParse(row).success).toBe(false);
    });

    it("counts a stored name in UTF-16 units: 30 emoji pass and 31 do not", () => {
      expect(
        storedEntrySchema.safeParse(stored("name", "given", { name: "😀".repeat(30) })).success,
      ).toBe(true);
      expect(
        storedEntrySchema.safeParse(stored("name", "given", { name: "😀".repeat(31) })).success,
      ).toBe(false);
    });
  });

  describe("the core-idea rows", () => {
    const stored = (kind: string, payload: unknown, over = {}) => ({
      id: "e1",
      node: "core-idea",
      kind,
      payload,
      createdAt: "2026-11-19T03:04:05.000Z",
      ...over,
    });

    it("parses a written row with and without remember, and a skipped row, as they are", () => {
      const spaced = stored("written", { statement: " keeps its spaces ", remember: " r " });
      expect(storedEntrySchema.parse(spaced)).toEqual(spaced);
      expect(storedEntrySchema.safeParse(stored("written", { statement: "x" })).success).toBe(true);
      expect(storedEntrySchema.safeParse(stored("skipped", {})).success).toBe(true);
      expect(
        storedEntrySchema.safeParse(
          stored("written", { statement: "x".repeat(300), remember: "x".repeat(2000) }),
        ).success,
      ).toBe(true);
    });

    it.each([
      ["an empty statement", stored("written", { statement: "" })],
      ["a statement of 301", stored("written", { statement: "x".repeat(301) })],
      ["a statement that is not text", stored("written", { statement: 5 })],
      ["a written row with no statement", stored("written", {})],
      ["an empty remember", stored("written", { statement: "x", remember: "" })],
      ["a remember of 2,001", stored("written", { statement: "x", remember: "x".repeat(2001) })],
      ["an unknown key beside the statement", stored("written", { statement: "x", draftId: "d" })],
      ["an unknown top-level key", stored("written", { statement: "x" }, { extra: 1 })],
      ["a skipped row with a payload", stored("skipped", { statement: "x" })],
      ["an unknown top-level key on a skipped row", stored("skipped", {}, { extra: 1 })],
      ["a picked row", stored("picked", { statement: "x" })],
      ["a given row", stored("given", { statement: "x" })],
    ])("refuses %s", (_label, row) => {
      expect(storedEntrySchema.safeParse(row).success).toBe(false);
    });

    it("counts a stored statement in UTF-16 units: 150 emoji pass and 151 do not", () => {
      expect(
        storedEntrySchema.safeParse(stored("written", { statement: "😀".repeat(150) })).success,
      ).toBe(true);
      expect(
        storedEntrySchema.safeParse(stored("written", { statement: "😀".repeat(151) })).success,
      ).toBe(false);
    });
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
    expect(newestByNode([])).toEqual({
      "identity-frame": null,
      architecture: null,
      name: null,
      "core-idea": null,
      "competitive-frame": null,
      typography: null,
      "logo-type": null,
    });
  });

  it("keeps the newest of each node apart: an entry of one node never hides another's", () => {
    const arch = storedEntrySchema.parse({
      id: "a1",
      node: "architecture",
      kind: "answered",
      payload: { subBrands: false },
      createdAt: "2026-11-19T05:00:00.000Z",
    });
    const name = storedEntrySchema.parse({
      id: "n1",
      node: "name",
      kind: "given",
      payload: { name: "ORIVILO" },
      createdAt: "2026-11-19T01:00:00.000Z",
    });
    const personality = at("p1", "2026-11-19T03:00:00.000Z", "given");
    for (const list of [
      [arch, name, personality],
      [name, personality, arch],
    ]) {
      expect(newestByNode(list)).toEqual({
        "identity-frame": personality,
        architecture: arch,
        name,
        "core-idea": null,
        "competitive-frame": null,
        typography: null,
        "logo-type": null,
      });
    }
  });

  it("is the entry with the latest created time, in whatever order the list comes", () => {
    const older = at("z", "2026-11-19T03:00:00.000Z");
    const newer = at("a", "2026-11-19T04:00:00.000Z", "given");
    expect(newestByNode([older, newer])["identity-frame"]?.id).toBe("a");
    expect(newestByNode([newer, older])["identity-frame"]?.id).toBe("a");
  });

  it("on equal times the given entry is the newer, whatever its id", () => {
    // Two calls queued on the project row can land inside one millisecond; the table orders by
    // microseconds, so the given entry (never the older one) must win here by its kind, not its id.
    const given = at("a", "2026-11-19T03:00:00.000Z", "given");
    const skipped = at("b", "2026-11-19T03:00:00.000Z");
    expect(newestByNode([given, skipped])["identity-frame"]?.id).toBe("a");
    expect(newestByNode([skipped, given])["identity-frame"]?.id).toBe("a");
    expect(newestByNode([skipped, given])["identity-frame"]?.kind).toBe("given");
  });

  it("on equal times and one kind, the larger id is the newer", () => {
    const a = at("a", "2026-11-19T03:00:00.000Z", "given");
    const b = at("b", "2026-11-19T03:00:00.000Z", "given");
    expect(newestByNode([a, b])["identity-frame"]?.id).toBe("b");
    expect(newestByNode([b, a])["identity-frame"]?.id).toBe("b");
  });
});

// ORV-298 tech notes section 13, T1 to T3; spec row 1 (the engine half).
describe("lineup entry", () => {
  const lineupOf = (lineup: unknown, over: Record<string, unknown> = {}) => ({
    projectId: PID,
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup },
    ...over,
  });
  const named = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ name: `Brand ${i + 1}`, hex: "#5B3FD9" }));
  const lineupFrom = (input: unknown) => {
    const entry = entryOf(input);
    if (entry.node !== "competitive-frame") throw new Error("expected a lineup entry");
    return entry.payload.lineup;
  };

  it("parses the stand-in lineup, one entry and twenty, as they are", () => {
    expect(entryOf(lineupOf(STAND_IN_LINEUP))).toEqual({
      projectId: PID,
      node: "competitive-frame",
      kind: "lineup",
      payload: { lineup: STAND_IN_LINEUP },
    });
    expect(lineupFrom(lineupOf(named(1)))).toHaveLength(1);
    expect(lineupFrom(lineupOf(named(20)))).toHaveLength(20);
  });

  it("trims each name and upper-cases each colour", () => {
    expect(
      lineupFrom(
        lineupOf([
          { name: "  Brand A  ", hex: "#5b3fd9" },
          { name: "\tBrand B\n", hex: "#6e4ae8" },
        ]),
      ),
    ).toEqual([
      { name: "Brand A", hex: "#5B3FD9" },
      { name: "Brand B", hex: "#6E4AE8" },
    ]);
  });

  it("keeps a name of 60 characters, counted in code points, and refuses 61", () => {
    expect(lineupFrom(lineupOf([{ name: "ก".repeat(60), hex: "#111111" }]))).toHaveLength(1);
    expect(lineupFrom(lineupOf([{ name: "😀".repeat(60), hex: "#111111" }]))).toHaveLength(1);
    expect(problemsOf(lineupOf([{ name: "😀".repeat(61), hex: "#111111" }]))).toEqual([
      { path: "payload.lineup.0.name", kind: "too-long" },
    ]);
  });

  it("maps the length and the empty bound of a name at any row, two digits included", () => {
    const rows = named(14);
    expect(
      problemsOf(
        lineupOf(rows.map((row, i) => (i === 11 ? { ...row, name: "x".repeat(61) } : row))),
      ),
    ).toEqual([{ path: "payload.lineup.11.name", kind: "too-long" }]);
    expect(
      problemsOf(lineupOf(rows.map((row, i) => (i === 12 ? { ...row, name: "\u0000" } : row)))),
    ).toEqual([{ path: "payload.lineup.12.name", kind: "required" }]);
  });

  it("each other input fails at the path of its field", () => {
    const one = (over: Record<string, unknown>) => [{ name: "Brand A", hex: "#111111", ...over }];
    const rows: Array<[string, unknown, EntryProblem[]]> = [
      ["no entry", lineupOf([]), [{ path: "payload.lineup", kind: "invalid" }]],
      ["21 entries", lineupOf(named(21)), [{ path: "payload.lineup", kind: "invalid" }]],
      [
        "two names equal ignoring case",
        lineupOf([
          { name: "Brand A", hex: "#111111" },
          { name: "brand a", hex: "#222222" },
        ]),
        [{ path: "payload.lineup.1.name", kind: "invalid" }],
      ],
      [
        "a name of 61",
        lineupOf(one({ name: "x".repeat(61) })),
        [{ path: "payload.lineup.0.name", kind: "too-long" }],
      ],
      [
        "#12345",
        lineupOf(one({ hex: "#12345" })),
        [{ path: "payload.lineup.0.hex", kind: "invalid" }],
      ],
      ["red", lineupOf(one({ hex: "red" })), [{ path: "payload.lineup.0.hex", kind: "invalid" }]],
      ["#FFF", lineupOf(one({ hex: "#FFF" })), [{ path: "payload.lineup.0.hex", kind: "invalid" }]],
      [
        "a name of white space",
        lineupOf(one({ name: "   " })),
        [{ path: "payload.lineup.0.name", kind: "required" }],
      ],
      [
        "no hex",
        lineupOf([{ name: "Brand A" }]),
        [{ path: "payload.lineup.0.hex", kind: "required" }],
      ],
      [
        "no name",
        lineupOf([{ hex: "#111111" }]),
        [{ path: "payload.lineup.0.name", kind: "required" }],
      ],
      [
        "a name that is no text",
        lineupOf(one({ name: 5 })),
        [{ path: "payload.lineup.0.name", kind: "invalid" }],
      ],
      [
        "an unknown key on an entry",
        lineupOf(one({ source: "x" })),
        [{ path: "payload.lineup.0.source", kind: "unknown-key" }],
      ],
      ["no lineup", lineupOf(undefined), [{ path: "payload.lineup", kind: "required" }]],
      ["a lineup that is no list", lineupOf("x"), [{ path: "payload.lineup", kind: "invalid" }]],
      [
        "an unknown key source in the payload",
        { ...lineupOf(STAND_IN_LINEUP), payload: { lineup: STAND_IN_LINEUP, source: "page" } },
        [{ path: "payload.source", kind: "unknown-key" }],
      ],
      [
        "an unknown top-level key",
        lineupOf(STAND_IN_LINEUP, { score: 1 }),
        [{ path: "score", kind: "unknown-key" }],
      ],
      [
        "a skipped entry of competitive-frame",
        { projectId: PID, node: "competitive-frame", kind: "skipped", payload: {} },
        [{ path: "kind", kind: "invalid" }],
      ],
      [
        "the node color, kind given",
        { projectId: PID, node: "color", kind: "given", payload: { lineup: STAND_IN_LINEUP } },
        [{ path: "node", kind: "invalid" }],
      ],
      [
        "the node color, kind lineup",
        { projectId: PID, node: "color", kind: "lineup", payload: { lineup: STAND_IN_LINEUP } },
        [{ path: "node", kind: "invalid" }],
      ],
    ];
    for (const [name, input, expected] of rows) {
      expect(problemsOf(input), name).toEqual(expected);
    }
  });

  it("a problem holds a path and a kind only: no name or colour reaches it", () => {
    const secret = "SECRET-COMPETITOR";
    const problems = [
      ...problemsOf(lineupOf([{ name: secret.repeat(5), hex: "#12345" }])),
      ...problemsOf(
        lineupOf([
          { name: secret, hex: "#111111" },
          { name: secret, hex: "#222222" },
        ]),
      ),
      ...problemsOf(lineupOf([{ name: secret, hex: "#111111", note: secret }])),
    ];
    expect(problems.length).toBeGreaterThanOrEqual(3);
    for (const p of problems) expect(Object.keys(p).sort()).toEqual(["kind", "path"]);
    expect(JSON.stringify(problems)).not.toContain(secret);
  });

  // T2: the mapper reads a length bound and a repeat apart.
  it("drops U+0000 from each name, then trims", () => {
    expect(
      lineupFrom(
        lineupOf([
          { name: "Br\u0000and A", hex: "#111111" },
          { name: " \u0000 Brand B \u0000", hex: "#222222" },
        ]),
      ),
    ).toEqual([
      { name: "Brand A", hex: "#111111" },
      { name: "Brand B", hex: "#222222" },
    ]);
  });

  it("a name that is only U+0000 is required, and a repeat made equal by it is invalid", () => {
    expect(problemsOf(lineupOf([{ name: "\u0000\u0000", hex: "#111111" }]))).toEqual([
      { path: "payload.lineup.0.name", kind: "required" },
    ]);
    expect(
      problemsOf(
        lineupOf([
          { name: "Brand\u0000 A", hex: "#111111" },
          { name: "Brand A", hex: "#222222" },
        ]),
      ),
    ).toEqual([{ path: "payload.lineup.1.name", kind: "invalid" }]);
  });

  it("gives too-long for 61 characters and invalid, never too-long, for a repeated name", () => {
    const long = problemsOf(lineupOf([{ name: "x".repeat(61), hex: "#111111" }]));
    const repeat = problemsOf(
      lineupOf([
        { name: "x".repeat(60), hex: "#111111" },
        { name: "X".repeat(60), hex: "#222222" },
      ]),
    );
    expect(long.map((p) => p.kind)).toEqual(["too-long"]);
    expect(repeat.map((p) => p.kind)).toEqual(["invalid"]);
  });

  it("passes input that is no list of objects on as it is, for the lineup check to refuse", () => {
    for (const bad of [null, 5, [null], [5], ["x"], [{ name: 5, hex: "#111111" }]]) {
      expect(checkEntry(lineupOf(bad)).ok, JSON.stringify(bad)).toBe(false);
    }
  });

  it("EntryRequest drops the project id of the lineup arm", () => {
    const request: EntryRequest = {
      node: "competitive-frame",
      kind: "lineup",
      payload: { lineup: STAND_IN_LINEUP },
    };
    expect(checkEntry({ projectId: PID, ...request }).ok).toBe(true);
  });
});

// T3.
describe("stored lineup", () => {
  const stored = (over: Record<string, unknown> = {}) => ({
    id: "l1",
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup: STAND_IN_LINEUP },
    createdAt: "2026-11-20T03:04:05.000Z",
    ...over,
  });

  it("parses a stored lineup as it is", () => {
    expect(storedEntrySchema.parse(stored())).toEqual(stored());
  });

  it.each([
    [
      "21 entries",
      stored({
        payload: {
          lineup: Array.from({ length: 21 }, (_, i) => ({ name: `B${i}`, hex: "#111111" })),
        },
      }),
    ],
    ["no entry", stored({ payload: { lineup: [] } })],
    ["an unknown payload key", stored({ payload: { lineup: STAND_IN_LINEUP, source: "x" } })],
    ["an unknown top-level key", stored({ extra: 1 })],
    [
      "an unknown key on an entry",
      stored({ payload: { lineup: [{ name: "a", hex: "#111111", x: 1 }] } }),
    ],
    ["a name of 61", stored({ payload: { lineup: [{ name: "x".repeat(61), hex: "#111111" }] } })],
    [
      "a repeated name",
      stored({
        payload: {
          lineup: [
            { name: "a", hex: "#111111" },
            { name: "A", hex: "#222222" },
          ],
        },
      }),
    ],
    ["a skipped kind", stored({ kind: "skipped", payload: {} })],
    ["an empty id", stored({ id: "" })],
  ])("refuses %s", (_name, input) => {
    expect(storedEntrySchema.safeParse(input).success).toBe(false);
  });

  it("fills the competitive-frame slot of the newest entries, and no other", () => {
    const lineup = storedEntrySchema.parse(stored());
    const name = storedEntrySchema.parse({
      id: "n1",
      node: "name",
      kind: "given",
      payload: { name: "ORIVILO" },
      createdAt: "2026-11-20T01:00:00.000Z",
    });
    const newest = newestByNode([name, lineup]);
    expect(newest["competitive-frame"]).toEqual(lineup);
    expect(newest.name).toEqual(name);
    expect(newest["identity-frame"]).toBeNull();
    expect(newestByNode([name])["competitive-frame"]).toBeNull();
  });
});

// ORV-298 tech notes section 13, T24; spec row 17 (the engine half).
describe("typography entry", () => {
  const typed = (payload: unknown, over: Record<string, unknown> = {}) => ({
    projectId: PID,
    node: "typography",
    kind: "answered",
    payload,
    ...over,
  });

  it.each(["thai-latin", "thai", "latin"] as const)("parses the answer %s as it is", (scripts) => {
    expect(entryOf(typed({ scripts }))).toEqual({
      projectId: PID,
      node: "typography",
      kind: "answered",
      payload: { scripts },
    });
  });

  it("each other input fails at the path of its field", () => {
    const rows: Array<[string, unknown, EntryProblem[]]> = [
      [
        "an unknown answer",
        typed({ scripts: "chinese" }),
        [{ path: "payload.scripts", kind: "invalid" }],
      ],
      [
        "an answer in another case",
        typed({ scripts: "Thai" }),
        [{ path: "payload.scripts", kind: "invalid" }],
      ],
      [
        "an answer that is no text",
        typed({ scripts: true }),
        [{ path: "payload.scripts", kind: "invalid" }],
      ],
      ["a missing answer", typed({}), [{ path: "payload.scripts", kind: "required" }]],
      [
        "an unknown key locale",
        typed({ scripts: "thai", locale: "th" }),
        [{ path: "payload.locale", kind: "unknown-key" }],
      ],
      [
        "a key beside the payload",
        typed({ scripts: "thai" }, { source: "x" }),
        [{ path: "source", kind: "unknown-key" }],
      ],
      ["a skipped entry", typed({}, { kind: "skipped" }), [{ path: "kind", kind: "invalid" }]],
      [
        "a given entry",
        typed({ scripts: "thai" }, { kind: "given" }),
        [{ path: "kind", kind: "invalid" }],
      ],
    ];
    for (const [name, input, expected] of rows) {
      expect(problemsOf(input), name).toEqual(expected);
    }
  });

  it("a problem holds a path and a kind only: the answer never reaches it", () => {
    const problems = problemsOf(typed({ scripts: "klingon-secret" }));
    expect(JSON.stringify(problems)).not.toContain("klingon");
    for (const problem of problems) expect(Object.keys(problem).sort()).toEqual(["kind", "path"]);
  });

  it("takes a whole UUID as the project id and nothing else", () => {
    expect(problemsOf(typed({ scripts: "thai" }, { projectId: "not-a-uuid" }))).toEqual([
      { path: "projectId", kind: "invalid" },
    ]);
  });

  it("EntryRequest drops the project id of the typography arm", () => {
    const request: Extract<EntryRequest, { node: "typography" }> = {
      node: "typography",
      kind: "answered",
      payload: { scripts: "thai-latin" },
    };
    expect(entryOf({ projectId: PID, ...request })).toMatchObject(request);
  });

  describe("stored", () => {
    const stored = (over: Record<string, unknown> = {}) => ({
      id: "t1",
      node: "typography",
      kind: "answered",
      payload: { scripts: "thai-latin" },
      createdAt: "2026-11-20T03:04:05.000Z",
      ...over,
    });

    it("parses a stored row of each answer as it is", () => {
      for (const scripts of ["thai-latin", "thai", "latin"]) {
        const row = stored({ payload: { scripts } });
        expect(storedEntrySchema.parse(row)).toEqual(row);
      }
    });

    it.each([
      ["an unknown answer", stored({ payload: { scripts: "chinese" } })],
      ["a missing answer", stored({ payload: {} })],
      ["an unknown payload key", stored({ payload: { scripts: "thai", locale: "th" } })],
      ["an unknown top-level key", stored({ extra: 1 })],
      ["a skipped kind", stored({ kind: "skipped", payload: {} })],
      ["an empty id", stored({ id: "" })],
    ])("refuses %s", (_name, input) => {
      expect(storedEntrySchema.safeParse(input).success).toBe(false);
    });

    it("fills the typography slot of the newest entries, and no other", () => {
      const typography = storedEntrySchema.parse(stored());
      const name = storedEntrySchema.parse({
        id: "n1",
        node: "name",
        kind: "given",
        payload: { name: "ORIVILO" },
        createdAt: "2026-11-20T01:00:00.000Z",
      });
      const newest = newestByNode([name, typography]);
      expect(newest.typography).toEqual(typography);
      expect(newest.name).toEqual(name);
      expect(newest["competitive-frame"]).toBeNull();
      expect(newestByNode([name]).typography).toBeNull();
    });
  });
});

// ORV-298 tech notes section 13, T33; spec row 27 (the engine half).
describe("logo type entry", () => {
  const logo = (payload: unknown, over: Record<string, unknown> = {}) => ({
    projectId: PID,
    node: "logo-type",
    kind: "answered",
    payload,
    ...over,
  });

  it.each([true, false])("parses the answer appIcon %s as it is", (appIcon) => {
    expect(entryOf(logo({ appIcon }))).toEqual({
      projectId: PID,
      node: "logo-type",
      kind: "answered",
      payload: { appIcon },
    });
  });

  it("each other input fails at the path of its field", () => {
    const rows: Array<[string, unknown, EntryProblem[]]> = [
      ["a text answer", logo({ appIcon: "yes" }), [{ path: "payload.appIcon", kind: "invalid" }]],
      ["the text true", logo({ appIcon: "true" }), [{ path: "payload.appIcon", kind: "invalid" }]],
      ["a number", logo({ appIcon: 1 }), [{ path: "payload.appIcon", kind: "invalid" }]],
      ["a null", logo({ appIcon: null }), [{ path: "payload.appIcon", kind: "invalid" }]],
      ["a missing answer", logo({}), [{ path: "payload.appIcon", kind: "required" }]],
      [
        "an unknown key crowding",
        logo({ appIcon: true, crowding: false }),
        [{ path: "payload.crowding", kind: "unknown-key" }],
      ],
      [
        "a key beside the payload",
        logo({ appIcon: true }, { source: "x" }),
        [{ path: "source", kind: "unknown-key" }],
      ],
      ["a skipped entry", logo({}, { kind: "skipped" }), [{ path: "kind", kind: "invalid" }]],
      [
        "a given entry",
        logo({ appIcon: true }, { kind: "given" }),
        [{ path: "kind", kind: "invalid" }],
      ],
    ];
    for (const [name, input, expected] of rows) {
      expect(problemsOf(input), name).toEqual(expected);
    }
  });

  it("a problem holds a path and a kind only: the answer never reaches it", () => {
    const problems = problemsOf(logo({ appIcon: "klingon-secret" }));
    expect(JSON.stringify(problems)).not.toContain("klingon");
    for (const problem of problems) expect(Object.keys(problem).sort()).toEqual(["kind", "path"]);
  });

  it("takes a whole UUID as the project id and nothing else", () => {
    expect(problemsOf(logo({ appIcon: true }, { projectId: "not-a-uuid" }))).toEqual([
      { path: "projectId", kind: "invalid" },
    ]);
  });

  it("EntryRequest drops the project id of the logo type arm", () => {
    const request: Extract<EntryRequest, { node: "logo-type" }> = {
      node: "logo-type",
      kind: "answered",
      payload: { appIcon: false },
    };
    expect(entryOf({ projectId: PID, ...request })).toMatchObject(request);
  });

  describe("stored", () => {
    const stored = (over: Record<string, unknown> = {}) => ({
      id: "g1",
      node: "logo-type",
      kind: "answered",
      payload: { appIcon: true },
      createdAt: "2026-11-20T03:04:05.000Z",
      ...over,
    });

    it("parses a stored row of each answer as it is", () => {
      for (const appIcon of [true, false]) {
        const row = stored({ payload: { appIcon } });
        expect(storedEntrySchema.parse(row)).toEqual(row);
      }
    });

    it.each([
      ["a text answer", stored({ payload: { appIcon: "yes" } })],
      ["a missing answer", stored({ payload: {} })],
      ["an unknown payload key", stored({ payload: { appIcon: true, crowding: false } })],
      ["an unknown top-level key", stored({ extra: 1 })],
      ["a skipped kind", stored({ kind: "skipped", payload: {} })],
      ["an empty id", stored({ id: "" })],
    ])("refuses %s", (_name, input) => {
      expect(storedEntrySchema.safeParse(input).success).toBe(false);
    });

    it("fills the logo type slot of the newest entries, and no other", () => {
      const logoType = storedEntrySchema.parse(stored());
      const name = storedEntrySchema.parse({
        id: "n1",
        node: "name",
        kind: "given",
        payload: { name: "ORIVILO" },
        createdAt: "2026-11-20T01:00:00.000Z",
      });
      const newest = newestByNode([name, logoType]);
      expect(newest["logo-type"]).toEqual(logoType);
      expect(newest.name).toEqual(name);
      expect(newest.typography).toBeNull();
      expect(newestByNode([name])["logo-type"]).toBeNull();
    });
  });
});

describe("exports", () => {
  it("the package index exports the entry contract and the marks", () => {
    expect(typeof engine.checkEntry).toBe("function");
    expect(typeof engine.storedEntrySchema.parse).toBe("function");
    expect(typeof engine.newestByNode).toBe("function");
    expect(typeof engine.foundationMarks).toBe("function");
    expect(typeof engine.entryAllowed).toBe("function");
    expect(engine.FOUNDATION_NODES).toEqual([
      "identity-frame",
      "architecture",
      "name",
      "core-idea",
      "logo-type",
      "color",
      "typography",
    ]);
    expect(engine.LONG_NAME_OVER).toBe(12);
    expect(engine.nameLength("ชื่อแบรนด์")).toBe(7);
    expect(engine.isLongName("Chase Manhattan Bank")).toBe(true);
    expect(engine.logoTypeOf("ORIVILO", false)?.type).toBe("wordmark");
    expect([...engine.TYPOGRAPHY_SCRIPTS]).toEqual(["thai-latin", "thai", "latin"]);
    expect(engine.TYPOGRAPHY_FAMILIES.map((f) => f.id)).toEqual(["sarabun", "anuphan", "inter"]);
    expect(engine.typographyOf("thai")?.reading.map((f) => f.id)).toEqual(["sarabun"]);
    expect(engine.WORKING_NAME_MAX).toBe(60);
    expect(engine.CORE_IDEA_MAX).toBe(300);
    expect(typeof engine.coreIdeaGate).toBe("function");
    expect(engine.START_QUESTIONS.map((q) => q.id)).toEqual(["situation.sub-brands"]);
    expect(typeof engine.derivedArchitecture).toBe("function");
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
