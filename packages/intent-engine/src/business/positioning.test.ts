import { describe, expect, it } from "vitest";
import {
  checkChoice,
  positioningGate,
  POSITIONING_STATEMENT_MAX,
  settleEdit,
  storedChoiceSchema,
  type StoredChoice,
} from "./positioning";

// ORV-285 tech notes section 12, T1 and T2; spec rows 1 and 5 (the data half), W4 and W5.

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
