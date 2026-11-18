import { describe, expect, it } from "vitest";
import { storedIntakeSchema } from "./intake";
import { toBusinessView, type SavedBusiness } from "./view";

// ORV-281 tech notes section 13, T8; spec rows 14 and 15 (the data half), 19.

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
