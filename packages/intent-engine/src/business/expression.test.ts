import { describe, expect, it } from "vitest";
import { auditLineup, type Lineup } from "../color-audit";
import { STAND_IN_LINEUP } from "../color-fixtures";
import { COLOR_RULES, decideColor, type ColorDecisionResult } from "../color-rules";
import { PERSONALITY_AXES } from "../knowledge";
import { evaluateScope } from "../rules";
import {
  checkLineupRows,
  colorCandidates,
  colorOf,
  colorOutcome,
  expressionOf,
  type ColorAxes,
  type LineupRow,
  type LineupRowProblem,
} from "./expression";
import expressionSource from "./expression.ts?raw";
import foundationSource from "./foundation.ts?raw";
import marksSource from "./foundation-marks.ts?raw";
import { newestByNode, storedEntrySchema, type StoredEntry } from "./foundation";

// ORV-298 tech notes section 13, T4 to T8; spec rows 4, 5, 6 and 9 (the engine half), 16, W3 and W4.

const PID = "3f2b8c1e-0d4a-4b7e-9c55-1a2b3c4d5e6f";
const at = "2026-11-20T03:00:00.000Z";

/** A point 1 to 5 for every axis, or stored values for some axes (the rest at 50). */
const personality = (
  point: number | Partial<Record<(typeof PERSONALITY_AXES)[number], number>>,
) => {
  const value = (p: number) => (p - 1) * 25;
  const axes =
    typeof point === "number"
      ? Object.fromEntries(PERSONALITY_AXES.map((axis) => [axis, value(point)]))
      : { playful: 50, structured: 50, ...point };
  return storedEntrySchema.parse({
    id: "p1",
    node: "identity-frame",
    kind: "given",
    payload: { axes },
    createdAt: at,
  });
};
const skippedPersonality = () =>
  storedEntrySchema.parse({
    id: "p2",
    node: "identity-frame",
    kind: "skipped",
    payload: {},
    createdAt: at,
  });
const lineupEntry = (lineup: Lineup) =>
  storedEntrySchema.parse({
    id: "l1",
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup },
    createdAt: at,
  });
const colorFor = (entries: StoredEntry[]) => colorOf(newestByNode(entries));

const WITH_LIME: Lineup = [
  ...STAND_IN_LINEUP,
  { name: "lime-a", hex: "#C6F432" },
  { name: "lime-b", hex: "#B5E61D" },
];
const HEX = { lime: "#C6F432", cyan: "#00C8E0", magenta: "#D020B0", teal: "#00C8A0" } as const;
const EVERY_CANDIDATE_CROWDED: Lineup = [
  { name: "lime-a", hex: "#C6F432" },
  { name: "lime-b", hex: "#B5E61D" },
  { name: "cyan-a", hex: "#00C8E0" },
  { name: "cyan-b", hex: "#10D0E8" },
  { name: "magenta-a", hex: "#D020B0" },
  { name: "magenta-b", hex: "#E030C0" },
  { name: "teal-a", hex: "#00C8A0" },
  { name: "teal-b", hex: "#10D0A8" },
];

describe("lineup rows", () => {
  const row = (name: string, hex: string): LineupRow => ({ name, hex });
  const EMPTY = row("", "");
  const problemsOf = (rows: LineupRow[]): LineupRowProblem[] => {
    const checked = checkLineupRows(rows, PID);
    if (checked.ok) throw new Error("expected problems");
    return checked.problems;
  };

  it("throws on a project id that is no UUID: a bug of the caller, not a problem of the person", () => {
    expect(() => checkLineupRows([row("Brand A", "#5B3FD9")], "not-a-uuid")).toThrow(
      "the project id is no UUID",
    );
  });

  it("a name that is only U+0000 is rowIncomplete on the name", () => {
    expect(problemsOf([row("Brand A", "#111111"), row("\u0000", "#5B3FD9")])).toEqual([
      { kind: "rowIncomplete", row: 1, field: "name" },
    ]);
  });

  it("lists the problems of one kind in the order of the rows", () => {
    expect(
      problemsOf([row("A", "red"), row("B", "#111111"), row("C", "blue"), row("D", "green")]),
    ).toEqual([
      { kind: "hexInvalid", row: 0 },
      { kind: "hexInvalid", row: 2 },
      { kind: "hexInvalid", row: 3 },
    ]);
  });

  it("with no row filled gives lineupRequired, and so for no row at all", () => {
    expect(problemsOf([EMPTY])).toEqual([{ kind: "lineupRequired" }]);
    expect(problemsOf([EMPTY, row("  ", "\t")])).toEqual([{ kind: "lineupRequired" }]);
    expect(problemsOf([])).toEqual([{ kind: "lineupRequired" }]);
  });

  it("a row with one empty field is rowIncomplete, naming the empty field and the row", () => {
    expect(problemsOf([row("Brand A", "")])).toEqual([
      { kind: "rowIncomplete", row: 0, field: "hex" },
    ]);
    expect(problemsOf([row("", "#5B3FD9")])).toEqual([
      { kind: "rowIncomplete", row: 0, field: "name" },
    ]);
    expect(problemsOf([row("   ", "#5B3FD9")])).toEqual([
      { kind: "rowIncomplete", row: 0, field: "name" },
    ]);
  });

  it("an incomplete row stops the check: no other problem is reported beside it", () => {
    expect(
      problemsOf([row("Brand A", "5B3FD9"), row("Brand B", ""), row("brand a", "#111111")]),
    ).toEqual([{ kind: "rowIncomplete", row: 1, field: "hex" }]);
  });

  it("a colour that is not # and six characters is hexInvalid at its row", () => {
    for (const hex of ["5B3FD9", "#12345", "red", "#FFF", "#5B3FD9F", "#GGGGGG"]) {
      expect(problemsOf([row("Brand A", hex)]), hex).toEqual([{ kind: "hexInvalid", row: 0 }]);
    }
  });

  it("a name already in the list, ignoring case, is nameRepeated at the later row", () => {
    expect(problemsOf([row("Brand A", "#111111"), row("brand a", "#222222")])).toEqual([
      { kind: "nameRepeated", row: 1 },
    ]);
  });

  it("a name over 60 characters is tooLong with the bound, and 60 is not", () => {
    expect(problemsOf([row("x".repeat(61), "#111111")])).toEqual([
      { kind: "tooLong", row: 0, max: 60 },
    ]);
    expect(checkLineupRows([row("x".repeat(60), "#111111")], PID).ok).toBe(true);
  });

  it("T4: each problem is at the person's row after the empty rows are dropped", () => {
    // Two empty rows come first: the lineup sent holds one entry, the person's row is 2.
    expect(problemsOf([EMPTY, EMPTY, row("Brand A", "5B3FD9")])).toEqual([
      { kind: "hexInvalid", row: 2 },
    ]);
    expect(
      problemsOf([EMPTY, row("Brand A", "#111111"), EMPTY, row("BRAND A", "#222222")]),
    ).toEqual([{ kind: "nameRepeated", row: 3 }]);
    expect(problemsOf([row("Brand A", "#111111"), EMPTY, row("x".repeat(61), "#222222")])).toEqual([
      { kind: "tooLong", row: 2, max: 60 },
    ]);
    expect(problemsOf([EMPTY, EMPTY, row("Brand B", "")])).toEqual([
      { kind: "rowIncomplete", row: 2, field: "hex" },
    ]);
  });

  it("lists the problems in the order of the view: hex, then repeat, then length", () => {
    expect(
      problemsOf([
        row("x".repeat(61), "#111111"),
        row("Brand B", "nope"),
        row("Brand C", "#222222"),
        row("brand c", "#333333"),
      ]),
    ).toEqual([
      { kind: "hexInvalid", row: 1 },
      { kind: "nameRepeated", row: 3 },
      { kind: "tooLong", row: 0, max: 60 },
    ]);
  });

  it("puts every kind in its place: incomplete, hex, repeat, then length", () => {
    const rows = Array.from({ length: 20 }, (_, i) => row(`Brand ${i}`, "#111111"));
    rows[2] = row("\u0000", "#111111");
    rows[4] = row("Brand 4", "nope");
    rows[6] = row("brand 5", "#111111");
    rows[8] = row("x".repeat(61), "#111111");
    expect(problemsOf(rows)).toEqual([
      { kind: "rowIncomplete", row: 2, field: "name" },
      { kind: "hexInvalid", row: 4 },
      { kind: "nameRepeated", row: 6 },
      { kind: "tooLong", row: 8, max: 60 },
    ]);
  });

  it("numbers the rows past nine with every digit", () => {
    const rows = Array.from({ length: 16 }, (_, i) => row(`Brand ${i}`, "#111111"));
    rows[11] = row("Brand 11", "nope");
    rows[12] = row("x".repeat(61), "#111111");
    rows[15] = row("brand 14", "#111111");
    expect(problemsOf(rows)).toEqual([
      { kind: "hexInvalid", row: 11 },
      { kind: "nameRepeated", row: 15 },
      { kind: "tooLong", row: 12, max: 60 },
    ]);
  });

  it("a valid lineup gives the request: names trimmed, colours upper case, the empty rows left out", () => {
    const checked = checkLineupRows(
      [EMPTY, row("  Brand A  ", " #5b3fd9 "), EMPTY, row("Brand B", "#6e4ae8")],
      PID,
    );
    expect(checked).toEqual({
      ok: true,
      request: {
        node: "competitive-frame",
        kind: "lineup",
        payload: {
          lineup: [
            { name: "Brand A", hex: "#5B3FD9" },
            { name: "Brand B", hex: "#6E4AE8" },
          ],
        },
      },
    });
  });

  it("holds twenty rows and says so at twenty-one, rather than answering with no problem", () => {
    const rows = (n: number) => Array.from({ length: n }, (_, i) => row(`Brand ${i}`, "#111111"));
    expect(checkLineupRows(rows(20), PID).ok).toBe(true);
    expect(problemsOf(rows(21))).toEqual([{ kind: "lineupMax" }]);
  });

  it("a problem holds a kind and a row, never a name or a colour", () => {
    const secret = "SECRET-COMPETITOR";
    const problems = [
      ...problemsOf([row(secret, "5B3FD9")]),
      ...problemsOf([row(secret, "#111111"), row(secret.toLowerCase(), "#222222")]),
      ...problemsOf([row(secret.repeat(5), "#111111")]),
    ];
    expect(problems).toHaveLength(3);
    expect(JSON.stringify(problems)).not.toContain(secret);
    expect(JSON.stringify(problems)).not.toContain("5B3FD9");
  });
});

describe("colour adapter", () => {
  const real = decideColor({
    facts: {
      personality: { expressive: 75, warm: 75, premium: 75 },
      industry: null,
      audiences: [],
      avoid: [],
    },
    lineup: null,
  });
  const forced = (patch: Partial<ColorDecisionResult>): ColorDecisionResult => ({
    ...real,
    ...patch,
  });
  const AXES: ColorAxes = { expressive: 75, warm: 75, premium: 75 };

  it("shows no reason for an open signature without a lineup audit or a personality", () => {
    const open = (audit: ColorDecisionResult["audit"], axes: ColorAxes | null) =>
      colorOutcome(
        forced({
          status: "needs-input",
          questions: [],
          audit,
          evaluation: {
            ...real.evaluation,
            // The signature is left out: a decision that is not there is not a key with no value.
            decisions: Object.fromEntries(
              Object.entries(real.evaluation.decisions).filter(([key]) => key !== "signature"),
            ),
          },
        }),
        axes,
      ).signatureOpen;
    expect(open(auditLineup(STAND_IN_LINEUP), AXES)).toEqual({
      why: "bothCrowded",
      first: "lime",
      second: "cyan",
    });
    expect(open(null, AXES)).toBeNull();
    expect(open(auditLineup(STAND_IN_LINEUP), null)).toBeNull();
  });

  it("names the first winning rule of a decision when two rules win it", () => {
    const outcome = colorOutcome(
      forced({
        evaluation: {
          ...real.evaluation,
          decisions: {
            ...real.evaluation.decisions,
            neutral: {
              value: "warm",
              priority: 50,
              rules: ["color.neutral.first", "color.neutral.second"],
              because: [],
            },
          },
        },
      }),
      AXES,
    );
    expect(outcome.neutral).toEqual({ value: "warm", rule: "color.neutral.first" });
  });

  // T5, row 9.
  it("maps each question to its node, in ORV-126 number order, once", () => {
    const outcome = colorOutcome(
      forced({ questions: ["lineup", "personality.expressive", "personality.warm"] }),
      null,
    );
    expect(outcome.asks).toEqual(["competitive-frame", "identity-frame"]);
    expect(colorOutcome(forced({ questions: ["personality.premium"] }), null).asks).toEqual([
      "identity-frame",
    ]);
    expect(colorOutcome(forced({ questions: ["lineup"] }), null).asks).toEqual([
      "competitive-frame",
    ]);
    expect(colorOutcome(forced({ questions: [] }), AXES).asks).toEqual([]);
  });

  it("drops a question of another form", () => {
    expect(colorOutcome(forced({ questions: ["industry", "audience"] }), null).asks).toEqual([]);
  });

  it("shows no value on a conflicted or invalid result", () => {
    for (const status of ["conflicted", "invalid"] as const) {
      const outcome = colorOutcome(forced({ status }), AXES);
      expect(outcome.signature, status).toBeNull();
      expect(outcome.neutral, status).toBeNull();
      expect(outcome.canvas, status).toBeNull();
      expect(outcome.signatureOpen, status).toBeNull();
      expect(outcome.notDecided, status).toBe(true);
      expect(outcome.decided, status).toBe(0);
    }
    // The evaluation of a real result held values: none of them is shown.
    const withValues = decideColor({
      facts: {
        personality: { expressive: 75, warm: 75, premium: 75 },
        industry: null,
        audiences: [],
        avoid: [],
      },
      lineup: STAND_IN_LINEUP,
    });
    expect(withValues.evaluation.decisions.signature?.value).toBe("lime");
    const outcome = colorOutcome({ ...withValues, status: "conflicted" }, AXES);
    expect(outcome.signature).toBeNull();
    expect(outcome.decided).toBe(0);
  });

  it("a resolved or needs-input result is not notDecided", () => {
    expect(colorOutcome(forced({ status: "needs-input" }), AXES).notDecided).toBe(false);
    expect(colorOutcome(forced({ status: "resolved" }), AXES).notDecided).toBe(false);
  });

  it("COLOR_RULES, with these facts, ask no question of another form, and one rule wins each key", () => {
    const values = [undefined, 0, 25, 50, 75, 100];
    for (const expressive of values) {
      for (const warm of values) {
        for (const premium of values) {
          for (const lineup of [null, STAND_IN_LINEUP, WITH_LIME, EVERY_CANDIDATE_CROWDED]) {
            const personality = Object.fromEntries(
              Object.entries({ expressive, warm, premium }).filter(([, v]) => v !== undefined),
            );
            const result = decideColor({
              facts: { personality, industry: null, audiences: [], avoid: [] },
              lineup,
            });
            for (const question of result.questions) {
              expect(question).toMatch(/^(lineup|personality\.(expressive|warm|premium))$/);
            }
            for (const decision of Object.values(result.evaluation.decisions)) {
              expect(decision.rules).toHaveLength(1);
            }
          }
        }
      }
    }
  });

  // T6, rows 2, 3, 5, 6, W4.
  describe("W4", () => {
    const line = (entries: StoredEntry[]) => {
      const o = colorFor(entries);
      const sig =
        o.signature !== null
          ? o.signature.value
          : o.signatureOpen?.why === "waitsForLineup"
            ? "open(lineup)"
            : o.signatureOpen?.why === "bothCrowded"
              ? "open(both-crowded)"
              : "open";
      return `${sig} ${o.neutral?.value} ${o.canvas?.value}`;
    };

    it("prints W4's six lines", () => {
      const lines = [
        line([personality(4), lineupEntry(STAND_IN_LINEUP)]),
        line([personality(4), lineupEntry(WITH_LIME)]),
        line([personality(4)]),
        line([personality(4), lineupEntry(EVERY_CANDIDATE_CROWDED)]),
        line([personality(2), lineupEntry(STAND_IN_LINEUP)]),
        line([personality(4), lineupEntry([{ name: "one", hex: "#C6F432" }])]),
      ];
      expect(lines.join(" | ")).toBe(
        "lime warm soft | cyan warm soft | open(lineup) warm soft | open(both-crowded) warm soft | teal cool bright | lime warm soft",
      );
    });

    it("case 1: lime by the priority 80 rule, with every rule id and the audit", () => {
      const o = colorFor([personality(4), lineupEntry(STAND_IN_LINEUP)]);
      expect(o.status).toBe("resolved");
      expect(o.signature).toEqual({
        value: "lime",
        rule: "color.signature.lime-warm",
        because: "signature",
        preferred: null,
      });
      expect(o.neutral).toEqual({ value: "warm", rule: "color.neutral.warm" });
      expect(o.canvas).toEqual({ value: "soft", rule: "color.canvas.soft" });
      expect(o.decided).toBe(3);
      expect(o.signatureOpen).toBeNull();
      expect(o.notDecided).toBe(false);
      expect(o.asks).toEqual([]);
      expect(o.axes).toEqual({ expressive: 75, warm: 75, premium: 75 });
      expect(o.audit?.crowded).toEqual(["ink", "orange", "violet"]);
      expect(o.audit).toEqual(auditLineup(STAND_IN_LINEUP));
    });

    it("case 2: a crowded lime gives cyan by the fallback, preferring lime", () => {
      const o = colorFor([personality(4), lineupEntry(WITH_LIME)]);
      expect(o.signature).toEqual({
        value: "cyan",
        rule: "color.signature.cyan-warm-fallback",
        because: "fallback",
        preferred: "lime",
      });
      expect(o.audit?.crowded).toContain("lime");
      expect(o.decided).toBe(3);
    });

    it("case 3: no lineup decides greys and background, asks for the lineup, and waits for it", () => {
      const o = colorFor([personality(4)]);
      expect(o.status).toBe("needs-input");
      expect(o.signature).toBeNull();
      expect(o.neutral).toEqual({ value: "warm", rule: "color.neutral.warm" });
      expect(o.canvas).toEqual({ value: "soft", rule: "color.canvas.soft" });
      expect(o.signatureOpen).toEqual({ why: "waitsForLineup" });
      expect(o.asks).toEqual(["competitive-frame"]);
      expect(o.audit).toBeNull();
      expect(o.decided).toBe(2);
    });

    it("case 4: every candidate crowded leaves the signature open with both families", () => {
      const o = colorFor([personality(4), lineupEntry(EVERY_CANDIDATE_CROWDED)]);
      expect(o.status).toBe("needs-input");
      expect(o.signature).toBeNull();
      expect(o.signatureOpen).toEqual({ why: "bothCrowded", first: "lime", second: "cyan" });
      expect(o.neutral).toEqual({ value: "warm", rule: "color.neutral.warm" });
      expect(o.canvas?.value).toBe("soft");
      expect(o.asks).toEqual([]);
      expect(o.decided).toBe(2);
    });

    it("case 5: every axis at point 2 gives teal, cool greys and a bright background", () => {
      const o = colorFor([personality(2), lineupEntry(STAND_IN_LINEUP)]);
      expect(o.signature).toMatchObject({
        value: "teal",
        rule: "color.signature.teal-cool",
        because: "signature",
      });
      expect(o.neutral).toEqual({ value: "cool", rule: "color.neutral.cool" });
      expect(o.canvas).toEqual({ value: "bright", rule: "color.canvas.bright" });
    });

    it("case 6: one lime entry is not crowded, so lime stands", () => {
      const o = colorFor([personality(4), lineupEntry([{ name: "one", hex: "#C6F432" }])]);
      expect(o.signature?.value).toBe("lime");
      expect(o.signature?.because).toBe("signature");
    });

    it("the signature's rule is the winning rule, not the first that fired", () => {
      // A crowded lime fires cyan-warm-fallback alone, so the winner is also fired[0] there: the
      // two differ on the neutral key, where the fired list holds the signature rule first by id.
      const o = colorFor([personality(4), lineupEntry(STAND_IN_LINEUP)]);
      const result = decideColor({
        facts: {
          personality: { playful: 75, expressive: 75, structured: 75, warm: 75, premium: 75 },
          industry: null,
          audiences: [],
          avoid: [],
        },
        lineup: STAND_IN_LINEUP,
      });
      expect(result.evaluation.fired[0]).not.toBe(o.neutral?.rule);
      expect(o.neutral?.rule).toBe("color.neutral.warm");
      expect(o.canvas?.rule).toBe("color.canvas.soft");
      expect(o.signature?.rule).toBe("color.signature.lime-warm");
    });

    it("with no personality nothing is decided, and the person is asked for it", () => {
      for (const entries of [[], [skippedPersonality()]]) {
        const o = colorFor(entries);
        expect(o.decided).toBe(0);
        expect(o.axes).toBeNull();
        expect(o.asks).toEqual(["competitive-frame", "identity-frame"]);
        expect(o.signatureOpen).toEqual({ why: "waitsForLineup" });
      }
      const withLineup = colorFor([lineupEntry(STAND_IN_LINEUP)]);
      expect(withLineup.asks).toEqual(["identity-frame"]);
      expect(withLineup.signatureOpen).toBeNull();
      expect(withLineup.audit?.crowded).toEqual(["ink", "orange", "violet"]);
      expect(withLineup.decided).toBe(0);
    });

    it("reads only the given personality: a skipped one gives no axis", () => {
      expect(colorFor([skippedPersonality(), lineupEntry(STAND_IN_LINEUP)]).axes).toBeNull();
    });
  });

  // T7, rows 5 and 6.
  describe("candidates", () => {
    it("gives the pair of each band and warmth, priority 80 first", () => {
      expect(colorCandidates({ expressive: 75, warm: 75 })).toEqual(["lime", "cyan"]);
      expect(colorCandidates({ expressive: 75, warm: 25 })).toEqual(["cyan", "lime"]);
      expect(colorCandidates({ expressive: 25, warm: 75 })).toEqual(["magenta", "teal"]);
      expect(colorCandidates({ expressive: 25, warm: 25 })).toEqual(["teal", "magenta"]);
    });

    it("switches at the edges of the band and of the warmth", () => {
      expect(colorCandidates({ expressive: 55, warm: 50 })).toEqual(["lime", "cyan"]);
      expect(colorCandidates({ expressive: 54, warm: 50 })).toEqual(["magenta", "teal"]);
      expect(colorCandidates({ expressive: 55, warm: 49 })).toEqual(["cyan", "lime"]);
    });

    it("gives null when an axis the rules read is missing", () => {
      expect(colorCandidates({})).toBeNull();
      expect(colorCandidates({ expressive: 75 })).toBeNull();
      expect(colorCandidates({ warm: 75 })).toBeNull();
      expect(colorCandidates({ premium: 75 })).toBeNull();
    });

    it("a fallback's preferred is the first candidate, not the fallback's own family", () => {
      for (const [axes, first, second] of [
        [{ expressive: 75, warm: 75 }, "lime", "cyan"],
        [{ expressive: 75, warm: 25 }, "cyan", "lime"],
        [{ expressive: 25, warm: 75 }, "magenta", "teal"],
        [{ expressive: 25, warm: 25 }, "teal", "magenta"],
      ] as const) {
        const crowdedFirst: Lineup = [
          { name: "a", hex: HEX[first] },
          { name: "b", hex: HEX[first] },
        ];
        const o = colorFor([personality({ ...axes, premium: 75 }), lineupEntry(crowdedFirst)]);
        expect(o.signature?.value, `${first}`).toBe(second);
        expect(o.signature?.because).toBe("fallback");
        expect(o.signature?.preferred).toBe(first);
      }
    });

    it("both crowded names the pair in order, in each band", () => {
      const o = colorFor([
        personality({ expressive: 25, warm: 25, premium: 75 }),
        lineupEntry(EVERY_CANDIDATE_CROWDED),
      ]);
      expect(o.signatureOpen).toEqual({ why: "bothCrowded", first: "teal", second: "magenta" });
    });

    it("a lineup stored with one candidate crowded and the other free is not open", () => {
      const o = colorFor([
        personality({ expressive: 75, warm: 75, premium: 75 }),
        lineupEntry([
          { name: "a", hex: "#C6F432" },
          { name: "b", hex: "#B5E61D" },
          { name: "c", hex: "#00C8E0" },
        ]),
      ]);
      expect(o.signatureOpen).toBeNull();
      expect(o.signature?.value).toBe("cyan");
    });
  });

  it("gives a pair exactly when both rules of a band fire, over every axis from 0 to 100 in steps of 5", () => {
    const steps = Array.from({ length: 21 }, (_, i) => i * 5);
    const signature = COLOR_RULES.filter((r) => r.then.some((a) => a.set === "signature"));
    let pairs = 0;
    for (const expressive of steps) {
      for (const warm of steps) {
        for (const premium of steps) {
          const personality = { expressive, warm, premium };
          const fired = evaluateScope(
            signature,
            { personality, industry: null, audiences: [], avoid: [], crowded: [] },
            ["signature"],
          ).fired;
          // Never one rule alone: a band's rule and its fallback fire together or not at all.
          expect(fired.length === 0 || fired.length === 2).toBe(true);
          expect(colorCandidates(personality) !== null).toBe(fired.length === 2);
          pairs += fired.length === 2 ? 1 : 0;
        }
      }
    }
    expect(pairs).toBeGreaterThan(0);
  });

  it("the rules the candidates read are the signature rules of COLOR_RULES, two to a band", () => {
    const signature = COLOR_RULES.filter((r) => r.then.some((a) => a.set === "signature"));
    expect(signature).toHaveLength(8);
    expect(signature.filter((r) => r.priority === 80)).toHaveLength(4);
    expect(signature.filter((r) => r.priority === 70)).toHaveLength(4);
  });

  it("expressionOf holds the colour outcome of the same entries", () => {
    const newest = newestByNode([personality(4), lineupEntry(STAND_IN_LINEUP)]);
    expect(expressionOf(newest)).toEqual({ color: colorOf(newest) });
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
const SUGGEST_MODULE = /(^|\/)suggest(\.[cm]?[jt]s)?$/;
const modelImports = (source: string) =>
  importedModules(source).filter((m) => MODEL_MODULE.test(m));
const suggestImports = (source: string) =>
  importedModules(source).filter((m) => SUGGEST_MODULE.test(m));

// T8, row 16. Forms blocked: a single-line import, a multi-line import, a side-effect import, a
// dynamic import() and an export ... from, of openrouter, llm-interpreter and (for expression.ts) suggest.
describe("no model import", () => {
  const SAMPLES: Array<[string, string]> = [
    ["a single-line import", `import { AI_MODELS } from "../openrouter";`],
    ["a multi-line import", `import {\n  AI_MODELS,\n  type X,\n} from "../openrouter";`],
    ["a side-effect import", `import "../llm-interpreter";`],
    ["a dynamic import", `const m = await import("../openrouter");`],
    ["an export from", `export { AI_MODELS } from "../openrouter";`],
    ["an export star from", `export * from "../llm-interpreter";`],
    ["a type import", `import type { Complete } from "../llm-interpreter.ts";`],
  ];
  const SUGGEST_SAMPLES: Array<[string, string]> = [
    ["a single-line import", `import { SUGGESTION_CANDIDATES } from "../suggest";`],
    ["a multi-line import", `import {\n  SUGGESTION_CANDIDATES,\n} from "../suggest.ts";`],
    ["a side-effect import", `import "../suggest";`],
    ["a dynamic import", `const m = await import("../suggest");`],
    ["an export from", `export { SUGGESTION_CANDIDATES } from "../suggest";`],
  ];

  it.each(SAMPLES)("the model guard catches %s", (_name, source) => {
    expect(modelImports(source)).toHaveLength(1);
  });

  it.each(SUGGEST_SAMPLES)("the suggest guard catches %s", (_name, source) => {
    expect(suggestImports(source)).toHaveLength(1);
  });

  it("the guards let pass an import of another module and a comment that names one", () => {
    expect(modelImports(`import { z } from "zod";\nimport { A } from "./knowledge";`)).toEqual([]);
    expect(suggestImports(`import { A } from "../suggestions-of-others";`)).toEqual([]);
    expect(
      modelImports(
        `// import { AI_MODELS } from "../openrouter";\n/* import "../llm-interpreter"; */`,
      ),
    ).toEqual([]);
  });

  it("expression.ts, foundation.ts and foundation-marks.ts import neither openrouter nor llm-interpreter", () => {
    for (const source of [expressionSource, foundationSource, marksSource]) {
      expect(importedModules(source).length).toBeGreaterThan(0);
      expect(modelImports(source)).toEqual([]);
    }
  });

  it("expression.ts imports nothing from suggest.ts", () => {
    expect(suggestImports(expressionSource)).toEqual([]);
  });
});
