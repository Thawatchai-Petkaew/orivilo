import { describe, expect, it, vi } from "vitest";
import type { Complete } from "../llm-interpreter";
import { storedIntakeSchema, type Intake } from "./intake";
import { BUSINESS_READ_MODEL, modelReading, readBusiness, ruleBasedReading } from "./read";
import {
  FIXTURE_ANSWER,
  FIXTURE_INTAKE,
  FIXTURE_INTAKE_ID,
  FIXTURE_SAVED_AT,
} from "./read-fixtures";
import { BUSINESS_READ_REASONS, type BusinessReading } from "./reading";
import { toBusinessView, type SavedBusiness } from "./view";

// ORV-281 tech notes section 13, T8 and T37; spec rows 14 and 15 (the data half), 19, 27 and 33 (the data half).

const project = { id: "p1", name: "คลินิกฟัน", createdAt: "2026-11-18T03:04:05.000Z" };
const FULL = {
  version: "intake-1",
  idea: "เราเปิดคลินิกทันตกรรม",
  industry: "ทันตกรรม",
  customers: "พนักงานออฟฟิศ",
  problem: "ไม่มีเวลา",
  competitors: "คลินิกใกล้บ้าน",
  value: "นัดนอกเวลา",
  website: "https://clinic.example/",
} as const;
const saved = (
  intake: Record<string, string>,
  extra: Partial<SavedBusiness> = {},
): SavedBusiness => ({
  project,
  intake: storedIntakeSchema.parse({ version: "intake-1", ...intake }),
  ...extra,
});

describe("keys, not text", () => {
  it("a slice 1 view has reading status none and the project's name and save time", () => {
    const view = toBusinessView(saved(FULL, { reading: null }));
    expect(view.reading).toEqual({ status: "none" });
    expect(view.projectName).toBe(project.name);
    expect(view.savedAt).toBe(project.createdAt);
    expect(view.nodes.map((n) => n.id)).toEqual([
      "situation",
      "business-core",
      "audience",
      "competitive-frame",
      "positioning",
    ]);
    for (const n of view.nodes) for (const f of n.fields) expect(f.readings).toEqual([]);
  });

  it("carries the three notes by their rule", () => {
    const notes = (intake: Record<string, string>) =>
      Object.fromEntries(toBusinessView(saved(intake)).nodes.map((n) => [n.id, n.notes]));
    expect(notes(FULL)).toEqual({
      situation: ["business.industry.awaitingTaxonomy", "business.website.notRead"],
      "business-core": [],
      audience: [],
      "competitive-frame": ["business.competitors.coloursNotRead"],
      positioning: [],
    });
    // Neither an industry nor a website: no situation note. Competitor colours: always.
    expect(notes({ idea: "i" })).toEqual({
      situation: [],
      "business-core": [],
      audience: [],
      "competitive-frame": ["business.competitors.coloursNotRead"],
      positioning: [],
    });
    expect(notes({ idea: "i", industry: "x" }).situation).toEqual([
      "business.industry.awaitingTaxonomy",
    ]);
    expect(notes({ idea: "i", website: "https://a.example/" }).situation).toEqual([
      "business.website.notRead",
    ]);
  });

  it("holds states, gate, still-to-ask and each field's answer from the engine rules", () => {
    const view = toBusinessView(saved({ idea: "i", customers: "c" }));
    expect(
      view.nodes.map((n) => `${n.id} ${n.state} ${n.gate} ${n.stillToAsk.join(",") || "-"}`),
    ).toEqual([
      "situation empty false -",
      "business-core proposed false business-core.proxy.why",
      "audience proposed false audience.proxy.problem",
      "competitive-frame skipped false competitive-frame.proxy.instead",
      "positioning skipped true positioning.proxy.only",
    ]);
    const audience = view.nodes[2];
    expect(audience?.fields).toEqual([
      { field: "audience.customers", answer: { text: "c", from: "customers" }, readings: [] },
      { field: "audience.problem", answer: null, readings: [] },
    ]);
  });

  it("its JSON holds the person's words and keys, and no catalog text", () => {
    const view = toBusinessView(saved(FULL));
    const words = new Set<string>([project.name, ...Object.values(FULL)]);
    const strings: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === "string") strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v !== null && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(JSON.parse(JSON.stringify(view)));
    const rest = strings.filter((s) => !words.has(s));
    expect(rest.length).toBeGreaterThan(20);
    // A key has no space and starts in lower case; a sentence of any language has a space or a capital.
    for (const s of rest) expect(s).toMatch(/^[a-z0-9][A-Za-z0-9.:-]*$/);
  });

  it("does not leak the intake version, and the same saved project gives the same view", () => {
    const a = toBusinessView(saved(FULL));
    expect(JSON.stringify(a)).not.toContain("intake-1");
    expect(toBusinessView(saved(FULL))).toStrictEqual(a);
  });
});

const { createHash } = (await vi.importActual("node:crypto")) as {
  createHash(a: "sha256"): { update(s: string, e: "utf8"): { digest(e: "hex"): string } };
};
const sha256Text = (t: string): string => createHash("sha256").update(t, "utf8").digest("hex");
const ANSWERS = Object.fromEntries(
  Object.entries(FIXTURE_INTAKE).filter(([key]) => key !== "projectName"),
) as Intake;
const stored = storedIntakeSchema.parse({ version: "intake-1", ...ANSWERS });
const complete: Complete = () => Promise.resolve(JSON.stringify(FIXTURE_ANSWER));
const { items } = await readBusiness(
  { intake: ANSWERS, intakeId: FIXTURE_INTAKE_ID, savedAt: FIXTURE_SAVED_AT },
  { complete, sha256Text, model: BUSINESS_READ_MODEL },
);
const model = modelReading(FIXTURE_INTAKE_ID, BUSINESS_READ_MODEL, items);
const withReading = (reading: BusinessReading | null): SavedBusiness => ({
  project,
  intake: stored,
  reading,
});

describe("readings in the view", () => {
  const fieldOf = (view: ReturnType<typeof toBusinessView>, id: string) =>
    view.nodes.flatMap((n) => n.fields).find((f) => f.field === id);

  it("a model record gives status model with its model id and a reading on each of the seven", () => {
    const view = toBusinessView(withReading(model));
    expect(view.reading).toEqual({ status: "model", modelId: "anthropic/claude-sonnet-5.5" });
    const counts = Object.fromEntries(
      view.nodes.flatMap((n) => n.fields).map((f) => [f.field, f.readings.length]),
    );
    expect(counts).toEqual({
      "situation.industry": 0,
      "situation.name": 1,
      "situation.website": 0,
      "business-core.offer": 1,
      "business-core.why": 1,
      "audience.customers": 1,
      "audience.problem": 1,
      "competitive-frame.category": 1,
      "competitive-frame.alternatives": 2,
      "positioning.value": 0,
    });
    expect(fieldOf(view, "competitive-frame.alternatives")?.readings.map((r) => r.value)).toEqual([
      "สตาร์บัคส์",
      "กาแฟกระป๋อง",
    ]);
    expect(fieldOf(view, "situation.name")?.readings[0]?.value).toBe("บ้านสวนคอฟฟี่");
    expect(fieldOf(view, "audience.customers")?.readings[0]?.value).toBe("พนักงานออฟฟิศ");
  });

  it("each reading carries the saved model id, its item, and the spans it rests on", () => {
    const view = toBusinessView(withReading(model));
    const customers = fieldOf(view, "audience.customers")?.readings[0];
    expect(customers?.modelId).toBe("anthropic/claude-sonnet-5.5");
    expect(customers?.item.reading?.target).toBe("audience.customers");
    expect(customers?.spans).toHaveLength(2);
    expect(customers?.spans.map((s) => s.id)).toEqual(customers?.item.basedOn);
    for (const span of customers?.spans ?? []) expect(span.reading).toBeNull();
    expect(customers?.confidence).toBe(customers?.item.confidence.value);
  });

  it("a reading below the floor carries belowFloor and quality.fewWords; one above does not", () => {
    const view = toBusinessView(withReading(model));
    // The problem answer holds 12 words: one span, few words, 0.392.
    const problem = fieldOf(view, "audience.problem")?.readings[0];
    expect(problem).toMatchObject({
      confidence: 0.392,
      belowFloor: true,
      quality: ["quality.fewWords"],
    });
    // The idea holds 22 words: one span, 0.56.
    const offer = fieldOf(view, "business-core.offer")?.readings[0];
    expect(offer).toMatchObject({ confidence: 0.56, belowFloor: false, quality: [] });
    // Two spans in two answers of 33 words together: 0.7.
    const customers = fieldOf(view, "audience.customers")?.readings[0];
    expect(customers).toMatchObject({ confidence: 0.7, belowFloor: false, quality: [] });
    const below = view.nodes
      .flatMap((n) => n.fields)
      .flatMap((f) => f.readings)
      .filter((r) => r.belowFloor);
    expect(below.length).toBeGreaterThan(0); // below the floor stays shown
    for (const r of below) expect(r.quality).toEqual(["quality.fewWords"]);
  });

  it.each(BUSINESS_READ_REASONS)(
    "a rule-based record gives its reason %s and no reading",
    (reason) => {
      const view = toBusinessView(withReading(ruleBasedReading(FIXTURE_INTAKE_ID, reason)));
      expect(view.reading).toEqual({ status: "rule-based", reason });
      for (const n of view.nodes) for (const f of n.fields) expect(f.readings).toEqual([]);
    },
  );

  it("no record, and a missing record, give status none and no reading", () => {
    for (const saved of [withReading(null), { project, intake: stored }]) {
      const view = toBusinessView(saved);
      expect(view.reading).toEqual({ status: "none" });
      for (const n of view.nodes) for (const f of n.fields) expect(f.readings).toEqual([]);
    }
  });

  it("a reading changes no placed answer, state, note or still-to-ask", () => {
    const strip = (v: ReturnType<typeof toBusinessView>) =>
      v.nodes.map((n) => ({
        ...n,
        fields: n.fields.map((f) => ({ field: f.field, answer: f.answer })),
      }));
    const without = toBusinessView(withReading(null));
    const withModel = toBusinessView(withReading(model));
    const withRule = toBusinessView(withReading(ruleBasedReading(FIXTURE_INTAKE_ID, "ai-failed")));
    expect(strip(withModel)).toEqual(strip(without));
    expect(strip(withRule)).toEqual(strip(without));
    expect(stored).toEqual(storedIntakeSchema.parse({ version: "intake-1", ...ANSWERS }));
  });

  it("holds the same view after a JSON round trip, and the same view for the same record", () => {
    const view = toBusinessView(withReading(model));
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
    expect(toBusinessView(withReading(model))).toStrictEqual(view);
  });
});
