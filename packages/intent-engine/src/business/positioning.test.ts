import { describe, expect, it } from "vitest";
import {
  checkChoice,
  checkDraftAgainst,
  positioningDraftSchema,
  positioningGate,
  POSITIONING_DRAFT_JOB,
  POSITIONING_STATEMENT_MAX,
  settleEdit,
  storedChoiceSchema,
  type PositioningDraft,
  type StoredChoice,
} from "./positioning";
import { FIXTURE_INTAKE } from "./read-fixtures";
import type { BusinessAnswerKey } from "./reading";

// ORV-285 tech notes section 12, T1, T2 and T26; spec rows 1 and 5 (the data half), W4 and W5;
// ORV-292 spec row 27 (the choice check half) and W6.

const PROJECT = "22222222-2222-4222-8222-222222222222";
const DRAFT = "33333333-3333-4333-8333-333333333333";

describe("choice check", () => {
  const problems = (input: unknown) => {
    const result = checkChoice(input);
    if (result.ok) throw new Error("expected a refusal");
    return result.problems;
  };

  it("parses a written statement of 1 and of 300 characters, trimmed", () => {
    for (const statement of ["a", "ก".repeat(300), "  a  "]) {
      const result = checkChoice({ kind: "written", projectId: PROJECT, statement });
      expect(result).toEqual({
        ok: true,
        choice: { kind: "written", projectId: PROJECT, statement: statement.trim() },
      });
    }
  });

  it("refuses each other input at the path of its field, with no value in the problem", () => {
    const cases: Array<[string, unknown, unknown]> = [
      [
        "white space only",
        { kind: "written", projectId: PROJECT, statement: " \n\t " },
        [{ path: "statement", kind: "required" }],
      ],
      [
        "301 characters",
        { kind: "written", projectId: PROJECT, statement: "x".repeat(301) },
        [{ path: "statement", kind: "too-long" }],
      ],
      [
        "picked with a statement",
        { kind: "picked", projectId: PROJECT, draftId: DRAFT, option: 1, statement: "secret" },
        [{ path: "statement", kind: "unknown-key" }],
      ],
      [
        "written with a draft id",
        { kind: "written", projectId: PROJECT, statement: "a", draftId: DRAFT },
        [{ path: "draftId", kind: "unknown-key" }],
      ],
      [
        "skipped with a statement",
        { kind: "skipped", projectId: PROJECT, statement: "secret" },
        [{ path: "statement", kind: "unknown-key" }],
      ],
      [
        "option 4",
        { kind: "picked", projectId: PROJECT, draftId: DRAFT, option: 4 },
        [{ path: "option", kind: "invalid" }],
      ],
      [
        "unknown key by",
        { kind: "skipped", projectId: PROJECT, by: "secret" },
        [{ path: "by", kind: "unknown-key" }],
      ],
    ];
    for (const [name, input, expected] of cases) {
      expect(problems(input), name).toEqual(expected);
      expect(JSON.stringify(problems(input)), name).not.toContain("secret");
    }
  });

  it("refuses an unknown key on an edited choice and a bad draft id", () => {
    expect(
      problems({
        kind: "edited",
        projectId: PROJECT,
        draftId: DRAFT,
        option: 1,
        statement: "a",
        by: "x",
      }),
    ).toEqual([{ path: "by", kind: "unknown-key" }]);
    expect(problems({ kind: "picked", projectId: PROJECT, draftId: "d1", option: 1 })).toEqual([
      { path: "draftId", kind: "invalid" },
    ]);
  });

  it("holds the raw cap at 2,000 before the trim and the statement bound at 300 after it", () => {
    const padded = (n: number) => " ".repeat(n) + "a";
    expect(checkChoice({ kind: "written", projectId: PROJECT, statement: padded(1999) }).ok).toBe(
      true,
    );
    expect(problems({ kind: "written", projectId: PROJECT, statement: padded(2000) })).toEqual([
      { path: "statement", kind: "too-long" },
    ]);
    expect(POSITIONING_STATEMENT_MAX).toBe(300);
  });

  it("refuses an input over the raw cap, a missing key, a wrong type, a bad id and an unknown kind", () => {
    expect(problems({ kind: "written", projectId: PROJECT, statement: "x".repeat(2001) })).toEqual([
      { path: "statement", kind: "too-long" },
    ]);
    expect(problems({ kind: "written", projectId: PROJECT })).toEqual([
      { path: "statement", kind: "required" },
    ]);
    expect(problems({ kind: "picked", projectId: PROJECT, draftId: DRAFT })).toEqual([
      { path: "option", kind: "required" },
    ]);
    expect(problems({ kind: "written", projectId: PROJECT, statement: 5 })).toEqual([
      { path: "statement", kind: "invalid" },
    ]);
    expect(problems({ kind: "skipped", projectId: "p1" })).toEqual([
      { path: "projectId", kind: "invalid" },
    ]);
    expect(problems({ kind: "agreed", projectId: PROJECT })).toEqual([
      { path: "kind", kind: "invalid" },
    ]);
    expect(problems("text")).toEqual([{ path: "", kind: "invalid" }]);
    expect(problems(null)).toEqual([{ path: "", kind: "invalid" }]);
    expect(problems(undefined)).toEqual([{ path: "", kind: "invalid" }]);
  });

  it("parses a picked and an edited choice with a draft id and an option of 1 to 3", () => {
    for (const option of [1, 2, 3]) {
      expect(checkChoice({ kind: "picked", projectId: PROJECT, draftId: DRAFT, option }).ok).toBe(
        true,
      );
    }
    const edited = checkChoice({
      kind: "edited",
      projectId: PROJECT,
      draftId: DRAFT,
      option: 2,
      statement: " ok ",
    });
    expect(edited).toEqual({
      ok: true,
      choice: { kind: "edited", projectId: PROJECT, draftId: DRAFT, option: 2, statement: "ok" },
    });
    expect(checkChoice({ kind: "picked", projectId: PROJECT, draftId: DRAFT, option: 0 }).ok).toBe(
      false,
    );
    expect(
      checkChoice({ kind: "picked", projectId: PROJECT, draftId: DRAFT, option: 1.5 }).ok,
    ).toBe(false);
  });
});

describe("edit equal to its option", () => {
  it("is picked when the trimmed text equals the option, else edited (W4)", () => {
    expect(settleEdit("คั่วสดทุกสัปดาห์", "  คั่วสดทุกสัปดาห์ ")).toBe("picked");
    expect(settleEdit("คั่วสดทุกสัปดาห์", "คั่วสดทุกวัน")).toBe("edited");
  });
});

const at = "2026-11-18T03:04:05.000Z";
const row = (kind: StoredChoice["kind"], intakeId: string): StoredChoice => {
  if (kind === "skipped")
    return {
      id: "c1",
      intakeId,
      createdAt: at,
      kind,
      statement: null,
      draftId: null,
      option: null,
    };
  if (kind === "written")
    return { id: "c1", intakeId, createdAt: at, kind, statement: "s", draftId: null, option: null };
  return { id: "c1", intakeId, createdAt: at, kind, statement: "s", draftId: DRAFT, option: 1 };
};

describe("gate states", () => {
  const gate = (choice: StoredChoice | null, draftOfNewest = false) =>
    positioningGate({ newestIntakeId: "A", choice, draftOfNewest });

  it("gives open, awaiting-choice, open+skipped, given, confirmed and open+stale (W5)", () => {
    expect(gate(null)).toEqual({ state: "open", skipped: false, stale: false });
    expect(gate(null, true)).toEqual({ state: "awaiting-choice", skipped: false, stale: false });
    expect(gate(row("skipped", "A"))).toEqual({ state: "open", skipped: true, stale: false });
    expect(gate(row("written", "A"))).toEqual({ state: "given", skipped: false, stale: false });
    expect(gate(row("picked", "A"))).toEqual({ state: "confirmed", skipped: false, stale: false });
    expect(gate(row("edited", "A"))).toEqual({ state: "confirmed", skipped: false, stale: false });
    expect(
      positioningGate({ newestIntakeId: "B", choice: row("picked", "A"), draftOfNewest: false }),
    ).toEqual({
      state: "open",
      skipped: false,
      stale: true,
    });
  });

  it("marks a written or edited choice on an older intake stale, and a draft keeps awaiting-choice", () => {
    for (const kind of ["written", "edited"] as const) {
      expect(gate(row(kind, "OLD")).stale).toBe(true);
    }
    expect(gate(row("written", "OLD"), true)).toEqual({
      state: "awaiting-choice",
      skipped: false,
      stale: true,
    });
  });

  it("a skipped choice on an older intake is not stale", () => {
    expect(gate(row("skipped", "OLD"))).toEqual({ state: "open", skipped: false, stale: false });
  });
});

describe("stored choice", () => {
  it("accepts each kind with exactly its columns and refuses any other shape", () => {
    for (const kind of ["picked", "edited", "written", "skipped"] as const) {
      expect(storedChoiceSchema.safeParse(row(kind, "A")).success, kind).toBe(true);
    }
    const bad: unknown[] = [
      { ...row("skipped", "A"), statement: "s" },
      { ...row("written", "A"), statement: null },
      { ...row("written", "A"), draftId: DRAFT, option: 1 },
      { ...row("picked", "A"), draftId: null, option: null },
      { ...row("picked", "A"), option: 4 },
      { ...row("written", "A"), statement: "x".repeat(301) },
      { ...row("written", "A"), statement: "" },
      { ...row("written", "A"), createdAt: "yesterday" },
      { ...row("picked", "A"), statement: null },
      { ...row("written", "A"), draftId: DRAFT },
    ];
    for (const kind of ["picked", "edited", "written", "skipped"] as const) {
      expect(storedChoiceSchema.safeParse({ ...row(kind, "A"), extra: 1 }).success, kind).toBe(
        false,
      );
    }
    for (const value of bad) expect(storedChoiceSchema.safeParse(value).success).toBe(false);
  });
});

describe("choice check, U+0000", () => {
  const NUL = "\u0000";
  const written = (statement: string) =>
    checkChoice({ kind: "written", projectId: PROJECT, statement });
  const refusal = (statement: string) => {
    const result = written(statement);
    if (result.ok) throw new Error("expected a refusal");
    return result.problems;
  };
  const statementOf = (result: ReturnType<typeof checkChoice>) => {
    if (!result.ok) throw new Error("expected a parse");
    return "statement" in result.choice ? result.choice.statement : undefined;
  };

  it("drops U+0000 from a statement before the trim, as checkIntake does (W6)", () => {
    expect(written(`a${NUL}b`)).toEqual({
      ok: true,
      choice: { kind: "written", projectId: PROJECT, statement: "ab" },
    });
    // Only U+0000 and spaces: dropped first, then nothing is left. Trimmed first, one space would stay.
    expect(refusal(`${NUL} ${NUL} `)).toEqual([{ path: "statement", kind: "required" }]);
    expect(statementOf(written(` ${NUL}${FIXTURE_INTAKE.value}${NUL} `))).toBe(
      FIXTURE_INTAKE.value,
    );
  });

  it("judges the rest by the 1 to 300 bound: 300 and a U+0000 parse, 301 and a U+0000 is too long", () => {
    expect(statementOf(written("a".repeat(300) + NUL))).toHaveLength(300);
    expect(refusal("a".repeat(301) + NUL)).toEqual([{ path: "statement", kind: "too-long" }]);
  });

  it("drops it from an edited statement too", () => {
    expect(
      checkChoice({
        kind: "edited",
        projectId: PROJECT,
        draftId: DRAFT,
        option: 1,
        statement: ` ${NUL}Fresh beans every week${NUL} `,
      }),
    ).toEqual({
      ok: true,
      choice: {
        kind: "edited",
        projectId: PROJECT,
        draftId: DRAFT,
        option: 1,
        statement: "Fresh beans every week",
      },
    });
  });
});

// The draft record (tech notes section 4.2) and its tests T26. Spans are computed from the answers
// of the shared fixture, so each quote sits at its own place.
const spanOf = (answer: BusinessAnswerKey, text: string) => {
  const start = FIXTURE_INTAKE[answer].indexOf(text);
  return { answer, start, end: start + text.length, text };
};
const OPTION_A = {
  statement: "ร้านกาแฟคั่วเองที่คั่วสดทุกสัปดาห์",
  quotes: [spanOf("idea", "ร้านกาแฟคั่วเอง"), spanOf("value", "คั่วสดทุกสัปดาห์")],
};
const OPTION_B = {
  statement: "กาแฟคั่วสดที่ส่งถึงบ้านพนักงานออฟฟิศภายในสองวัน",
  quotes: [
    spanOf("idea", "พนักงานออฟฟิศ"),
    spanOf("value", "ส่งถึงบ้านภายในสองวัน"),
    spanOf("customers", "พนักงานออฟฟิศ"),
  ],
};
const OPTION_C = {
  statement: "เมล็ดกาแฟคั่วสดสำหรับคนที่อยากดื่มกาแฟดีๆ ที่บ้าน",
  quotes: [spanOf("idea", "อยากดื่มกาแฟดีๆ ที่บ้าน"), spanOf("value", "คั่วสด")],
};
const DRAFT_RECORD: PositioningDraft = {
  job: "positioning-draft",
  intakeId: "11111111-1111-4111-8111-111111111111",
  modelId: "anthropic/claude-sonnet-5.5",
  adapter: { id: "positioning-draft", version: "1" },
  promptVersion: "positioning-prompt-1",
  options: [OPTION_A, OPTION_B, OPTION_C],
};

describe("draft record", () => {
  const accepts = (value: unknown) => positioningDraftSchema.safeParse(value).success;
  const withOption = (change: object, at = 0): unknown => ({
    ...DRAFT_RECORD,
    options: DRAFT_RECORD.options.map((o, i) => (i === at ? { ...o, ...change } : o)),
  });
  const withQuote = (change: object): unknown =>
    withOption({ quotes: [{ ...OPTION_A.quotes[0], ...change }, OPTION_A.quotes[1]] });

  it("names its job and accepts two and three options", () => {
    expect(POSITIONING_DRAFT_JOB).toBe("positioning-draft");
    expect(positioningDraftSchema.parse(DRAFT_RECORD)).toEqual(DRAFT_RECORD);
    expect(accepts({ ...DRAFT_RECORD, options: [OPTION_A, OPTION_B] })).toBe(true);
  });

  it.each<[string, unknown]>([
    ["an extra key", { ...DRAFT_RECORD, confidence: 1 }],
    ["another job", { ...DRAFT_RECORD, job: "business-read" }],
    ["an empty intake id", { ...DRAFT_RECORD, intakeId: "" }],
    ["an intake id of 101 characters", { ...DRAFT_RECORD, intakeId: "i".repeat(101) }],
    ["an empty model id", { ...DRAFT_RECORD, modelId: "" }],
    ["a model id of 201 characters", { ...DRAFT_RECORD, modelId: "m".repeat(201) }],
    ["an empty adapter id", { ...DRAFT_RECORD, adapter: { id: "", version: "1" } }],
    ["an adapter id of 41", { ...DRAFT_RECORD, adapter: { id: "a".repeat(41), version: "1" } }],
    ["an empty adapter version", { ...DRAFT_RECORD, adapter: { id: "a", version: "" } }],
    [
      "an adapter version of 41",
      { ...DRAFT_RECORD, adapter: { id: "a", version: "v".repeat(41) } },
    ],
    ["an extra adapter key", { ...DRAFT_RECORD, adapter: { id: "a", version: "1", x: 1 } }],
    ["an empty prompt version", { ...DRAFT_RECORD, promptVersion: "" }],
    ["a prompt version of 41", { ...DRAFT_RECORD, promptVersion: "p".repeat(41) }],
    ["one option", { ...DRAFT_RECORD, options: [OPTION_A] }],
    [
      "four options",
      {
        ...DRAFT_RECORD,
        options: [OPTION_A, OPTION_B, OPTION_C, { ...OPTION_C, statement: "สี่" }],
      },
    ],
    ["an extra option key", withOption({ score: 1 })],
    ["an empty statement", withOption({ statement: "" })],
    ["a statement of 301", withOption({ statement: "ก".repeat(301) })],
    ["no quote", withOption({ quotes: [] })],
    [
      "nine quotes",
      withOption({
        quotes: [...Array.from({ length: 8 }, () => OPTION_A.quotes[0]), OPTION_A.quotes[1]],
      }),
    ],
    // The idea and the value quotes stay: only the answer's name is wrong.
    [
      "a quote naming website",
      withOption({ quotes: [...OPTION_A.quotes, { ...OPTION_A.quotes[0], answer: "website" }] }),
    ],
    ["an extra quote key", withQuote({ extra: 1 })],
    ["an empty quote text", withQuote({ text: "", end: OPTION_A.quotes[0]?.start })],
    [
      "a quote text of 301",
      withQuote({ text: "ก".repeat(301), end: (OPTION_A.quotes[0]?.start ?? 0) + 301 }),
    ],
    // The span is as long as the text, so only the start is wrong.
    ["a start below 0", withQuote({ start: -1, end: (OPTION_A.quotes[0]?.text.length ?? 0) - 1 })],
    ["a start that is not whole", withQuote({ start: 0.5, end: 0.5 + 15 })],
  ])("refuses %s", (_name, value) => {
    expect(accepts(value)).toBe(false);
  });

  it("accepts each bound exactly: ids and versions at their length, a statement at 300, 8 quotes, a text at 300", () => {
    expect(
      accepts({
        ...DRAFT_RECORD,
        intakeId: "i".repeat(100),
        modelId: "m".repeat(200),
        adapter: { id: "a".repeat(40), version: "v".repeat(40) },
        promptVersion: "p".repeat(40),
      }),
    ).toBe(true);
    expect(accepts(withOption({ statement: "ก".repeat(300) }))).toBe(true);
    const seven = Array.from({ length: 7 }, () => OPTION_A.quotes[0]);
    expect(accepts(withOption({ quotes: [...seven, OPTION_A.quotes[1]] }))).toBe(true);
    expect(
      accepts(withQuote({ text: "ก".repeat(300), end: (OPTION_A.quotes[0]?.start ?? 0) + 300 })),
    ).toBe(true);
  });

  it("refuses a quote whose span is not as long as its text", () => {
    for (const end of [(OPTION_A.quotes[0]?.end ?? 0) - 1, (OPTION_A.quotes[0]?.end ?? 0) + 1]) {
      expect(accepts(withQuote({ end }))).toBe(false);
    }
  });

  it("refuses an option with no quote on value, and one with no quote on idea", () => {
    expect(
      accepts(withOption({ quotes: [OPTION_A.quotes[0], spanOf("customers", "พนักงาน")] })),
    ).toBe(false);
    expect(
      accepts(withOption({ quotes: [spanOf("value", "คั่วสด"), spanOf("customers", "พนักงาน")] })),
    ).toBe(false);
    // The basis is judged option by option: a quote on value in another option does not count.
    expect(accepts(withOption({ quotes: [OPTION_A.quotes[0]] }, 1))).toBe(false);
  });

  it("refuses two equal statements, also when they differ only by white space", () => {
    expect(
      accepts({
        ...DRAFT_RECORD,
        options: [OPTION_A, { ...OPTION_B, statement: OPTION_A.statement }],
      }),
    ).toBe(false);
    expect(
      accepts({
        ...DRAFT_RECORD,
        options: [OPTION_A, { ...OPTION_B, statement: ` ${OPTION_A.statement} ` }],
      }),
    ).toBe(false);
    expect(
      accepts({
        ...DRAFT_RECORD,
        options: [OPTION_A, OPTION_B, { ...OPTION_C, statement: OPTION_A.statement }],
      }),
    ).toBe(false);
  });
});

describe("draft against the saved answers", () => {
  it("accepts a draft whose every quote is at its place in the answers", () => {
    expect(checkDraftAgainst(DRAFT_RECORD, FIXTURE_INTAKE)).toBe(true);
  });

  it("refuses a quote not at its place, a changed answer, and a quote on an answer that is not given", () => {
    const moved = {
      ...DRAFT_RECORD,
      options: [
        { ...OPTION_A, quotes: [{ ...OPTION_A.quotes[0], start: 1, end: 16 }, OPTION_A.quotes[1]] },
        OPTION_B,
        OPTION_C,
      ],
    } as PositioningDraft;
    expect(checkDraftAgainst(moved, FIXTURE_INTAKE)).toBe(false);
    expect(checkDraftAgainst(DRAFT_RECORD, { ...FIXTURE_INTAKE, value: "ขายกาแฟทุกวัน" })).toBe(
      false,
    );
    expect(checkDraftAgainst(DRAFT_RECORD, { ...FIXTURE_INTAKE, customers: undefined })).toBe(
      false,
    );
  });

  it("checks the quotes of every option, not only the first", () => {
    const last = {
      ...DRAFT_RECORD,
      options: [
        OPTION_A,
        OPTION_B,
        { ...OPTION_C, quotes: [OPTION_C.quotes[0], { ...OPTION_C.quotes[1], text: "คั่วสดx" }] },
      ],
    } as PositioningDraft;
    expect(checkDraftAgainst(last, FIXTURE_INTAKE)).toBe(false);
  });
});
