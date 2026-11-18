import { describe, expect, it } from "vitest";
import type { Intake } from "./intake";
import { BUSINESS_EDGES, BUSINESS_FIELDS, BUSINESS_NODES, nodeStates, placeIntake } from "./place";

// ORV-281 tech notes section 13, T5 to T7; spec rows 3 and 4, worked examples W1, W2, W3 and W7.

const THAI: Intake = {
  projectName: "คลินิกฟัน",
  idea: "เราเปิดคลินิกทันตกรรมสำหรับคนทำงาน",
  industry: "ทันตกรรม",
  customers: "พนักงานออฟฟิศอายุ 30 ปี",
  problem: "ไม่มีเวลาไปหาหมอ",
  competitors: "คลินิกใกล้บ้าน",
  value: "นัดนอกเวลางาน",
  website: "https://clinic.example/",
};

describe("each answer on its node", () => {
  it("places seven answers, each on the field its row names, as written", () => {
    const placed = placeIntake(THAI);
    const byField = new Map(placed.flatMap((n) => n.fields).map((f) => [f.field, f.answer]));
    expect(byField.get("business-core.offer")).toEqual({ text: THAI.idea, from: "idea" });
    expect(byField.get("situation.industry")).toEqual({ text: THAI.industry, from: "industry" });
    expect(byField.get("situation.website")).toEqual({ text: THAI.website, from: "website" });
    expect(byField.get("audience.customers")).toEqual({ text: THAI.customers, from: "customers" });
    expect(byField.get("audience.problem")).toEqual({ text: THAI.problem, from: "problem" });
    expect(byField.get("competitive-frame.alternatives")).toEqual({
      text: THAI.competitors,
      from: "competitors",
    });
    expect(byField.get("positioning.value")).toEqual({ text: THAI.value, from: "value" });
    const filled = [...byField.values()].filter((a) => a !== null);
    expect(filled).toHaveLength(7);
    // The readings-only fields hold no answer.
    expect(byField.get("situation.name")).toBeNull();
    expect(byField.get("business-core.why")).toBeNull();
    expect(byField.get("competitive-frame.category")).toBeNull();
  });

  it("W3: how many land on each node", () => {
    const counts: Record<string, number> = {};
    for (const n of placeIntake(THAI)) {
      const c = n.fields.filter((f) => f.answer !== null).length;
      if (c > 0) counts[n.id] = c;
    }
    expect(counts).toEqual({
      situation: 2,
      "business-core": 1,
      audience: 2,
      "competitive-frame": 1,
      positioning: 1,
    });
  });

  it("the value answer sits on positioning.value and on no other field", () => {
    const holding = placeIntake(THAI)
      .flatMap((n) => n.fields)
      .filter((f) => f.answer?.from === "value")
      .map((f) => f.field);
    expect(holding).toEqual(["positioning.value"]);
    const sameText = placeIntake(THAI)
      .flatMap((n) => n.fields)
      .filter((f) => f.answer?.text === THAI.value);
    expect(sameText).toHaveLength(1);
  });

  it("leaves a field with no answer null, and does not place the project name", () => {
    const placed = placeIntake({ idea: "x" });
    const texts = placed.flatMap((n) => n.fields).flatMap((f) => (f.answer ? [f.answer.text] : []));
    expect(texts).toEqual(["x"]);
    expect(JSON.stringify(placeIntake(THAI))).not.toContain(THAI.projectName);
  });

  it("two runs on the same intake are deep-equal, and the input is not changed", () => {
    const before = JSON.stringify(THAI);
    expect(placeIntake(THAI)).toStrictEqual(placeIntake(structuredClone(THAI)));
    expect(JSON.stringify(THAI)).toBe(before);
  });
});

describe("states and still to ask", () => {
  // Row 4 and W7: the project name, the idea and the customers.
  const row4 = { idea: "i", customers: "c" };
  const show = (intake: Parameters<typeof nodeStates>[0]) =>
    nodeStates(intake).map((s) => `${s.id} ${s.state} ${s.stillToAsk.join(",") || "-"}`);

  it("W7 and row 4", () => {
    expect(show(row4)).toEqual([
      "situation empty -",
      "business-core proposed business-core.proxy.why",
      "audience proposed audience.proxy.problem",
      "competitive-frame skipped competitive-frame.proxy.instead",
      "positioning skipped positioning.proxy.only",
    ]);
  });

  it("only positioning is a gate, in every state", () => {
    expect(nodeStates(row4).map((s) => s.gate)).toEqual([false, false, false, false, true]);
    expect(nodeStates(THAI).map((s) => s.gate)).toEqual([false, false, false, false, true]);
  });

  it("a full intake is proposed everywhere and asks only why", () => {
    expect(show(THAI)).toEqual([
      "situation proposed -",
      "business-core proposed business-core.proxy.why",
      "audience proposed -",
      "competitive-frame proposed -",
      "positioning proposed -",
    ]);
  });

  it("situation is proposed with an industry alone, or a website alone, and never skipped", () => {
    expect(nodeStates({ idea: "i", industry: "x" })[0]?.state).toBe("proposed");
    expect(nodeStates({ idea: "i", website: "https://a.example/" })[0]?.state).toBe("proposed");
    expect(nodeStates({ idea: "i" })[0]?.state).toBe("empty");
  });

  it("an intake with the idea only skips audience, competitive-frame and positioning", () => {
    const s = nodeStates({ idea: "i" });
    expect(s.map((n) => n.state)).toEqual(["empty", "proposed", "skipped", "skipped", "skipped"]);
    expect(s[2]?.stillToAsk).toEqual(["audience.proxy.best-customer", "audience.proxy.problem"]);
  });

  it("one audience answer is enough to propose the node", () => {
    expect(nodeStates({ idea: "i", problem: "p" })[2]).toMatchObject({
      state: "proposed",
      stillToAsk: ["audience.proxy.best-customer"],
    });
  });

  it("business-core is never skipped, and its offer question is never listed", () => {
    for (const intake of [{ idea: "i" }, THAI]) {
      const core = nodeStates(intake)[1];
      expect(core?.state).toBe("proposed");
      expect(core?.stillToAsk).toEqual(["business-core.proxy.why"]);
    }
  });

  it("business-core stays proposed and asks only why even with no idea at all", () => {
    const core = nodeStates({} as never)[1];
    expect(core?.state).toBe("proposed");
    expect(core?.stillToAsk).toEqual(["business-core.proxy.why"]);
  });

  it("situation lists no question, whatever it holds", () => {
    expect(nodeStates({ idea: "i" })[0]?.stillToAsk).toEqual([]);
    expect(nodeStates(THAI)[0]?.stillToAsk).toEqual([]);
  });
});

describe("five nodes, ten fields, six edges", () => {
  it("W1: 5 nodes, 10 fields, 3,2,2,2,1 per node", () => {
    const per = BUSINESS_NODES.map((n) => BUSINESS_FIELDS.filter((f) => f.node === n).length);
    expect(`${BUSINESS_NODES.length} ${BUSINESS_FIELDS.length} ${per.join(",")}`).toBe(
      "5 10 3,2,2,2,1",
    );
  });

  it("the nodes are in fill order and every field id is its node and its name", () => {
    expect([...BUSINESS_NODES]).toEqual([
      "situation",
      "business-core",
      "audience",
      "competitive-frame",
      "positioning",
    ]);
    expect(BUSINESS_FIELDS.map((f) => f.id)).toEqual([
      "situation.industry",
      "situation.name",
      "situation.website",
      "business-core.offer",
      "business-core.why",
      "audience.customers",
      "audience.problem",
      "competitive-frame.category",
      "competitive-frame.alternatives",
      "positioning.value",
    ]);
    for (const f of BUSINESS_FIELDS) expect(f.id.startsWith(`${f.node}.`)).toBe(true);
  });

  it("each field has its label key and its source of business-fields-1", () => {
    expect(BUSINESS_FIELDS.map((f) => `${f.id} ${f.labelKey} ${f.source}`)).toEqual([
      "situation.industry business.field.industry answer",
      "situation.name business.field.name reading",
      "situation.website business.field.website answer",
      "business-core.offer business.field.offer both",
      "business-core.why business.field.why reading",
      "audience.customers business.field.customers both",
      "audience.problem business.field.problem both",
      "competitive-frame.category business.field.category reading",
      "competitive-frame.alternatives business.field.alternatives both",
      "positioning.value business.field.value answer",
    ]);
  });

  it("W2: the six requires links", () => {
    expect(
      `${BUSINESS_EDGES.length} ${BUSINESS_EDGES.map(([a, b]) => `${a}>${b}`).join(" ")}`,
    ).toBe(
      "6 situation>business-core situation>audience situation>competitive-frame business-core>positioning audience>positioning competitive-frame>positioning",
    );
  });
});
