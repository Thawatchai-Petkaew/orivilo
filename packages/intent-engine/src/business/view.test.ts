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
import {
  entryAllowed,
  foundationState,
  type FoundationResult,
  type MarkRef,
} from "./foundation-marks";
import { storedEntrySchema, type StoredEntry } from "./foundation";
import { AI_MODELS } from "../openrouter";
import type { StoredChoice } from "./positioning";
import { STAND_IN_LINEUP } from "../color-fixtures";
import type { Lineup } from "../color-audit";
import { typographyOf } from "./expression";
import { expressionLines, foundationLines, toBusinessView, type SavedBusiness } from "./view";

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

// ORV-285 tech notes section 12, T3 and T4; spec rows 5 and 7 (the data half).

describe("positioning in the view", () => {
  const NEWEST = "intake-b";
  const at = "2026-11-18T03:04:05.000Z";
  const choice = (
    kind: StoredChoice["kind"],
    intakeId: string,
    statement = "คั่วสดส่งถึงบ้าน",
  ): StoredChoice => {
    if (kind === "skipped")
      return {
        id: "c",
        intakeId,
        createdAt: at,
        kind,
        statement: null,
        draftId: null,
        option: null,
      };
    if (kind === "written")
      return { id: "c", intakeId, createdAt: at, kind, statement, draftId: null, option: null };
    return { id: "c", intakeId, createdAt: at, kind, statement, draftId: "d1", option: 1 };
  };
  const withChoice = (intake: Record<string, string>, c: StoredChoice | null, intakeId = NEWEST) =>
    saved(intake, { positioning: { intakeId, choice: c } });
  const GIVEN = { idea: "i", value: "v" };
  const positioningNode = (view: ReturnType<typeof toBusinessView>) =>
    view.nodes.find((n) => n.id === "positioning");

  it("gives the four projects of row 5 their state, gate line and controls", () => {
    const rows = [
      withChoice(GIVEN, null),
      withChoice({ idea: "i" }, null),
      withChoice(GIVEN, choice("skipped", NEWEST)),
      withChoice(GIVEN, choice("written", NEWEST)),
    ].map((s) => toBusinessView(s));
    expect(
      rows.map((v) => {
        const node = positioningNode(v);
        return `${node?.state} ${node?.gatePassed} ${v.positioning.gate} ${v.positioning.controls.join(",") || "-"}`;
      }),
    ).toEqual([
      "proposed false open writeOwn,skip",
      "skipped false open writeOwn,skip",
      "skipped false open writeOwn",
      "agreed true given -",
    ]);
    expect(rows[3]?.positioning.statement).toEqual({
      text: "คั่วสดส่งถึงบ้าน",
      label: "business.positioning.by.own",
      modelId: null,
    });
    expect(rows[2]?.positioning.skipped).toBe(true);
    expect(rows[2]?.positioning.statement).toBeNull();
  });

  it("labels a picked or edited statement and shows it with no control once confirmed", () => {
    for (const [kind, label] of [
      ["picked", "business.positioning.by.picked"],
      ["edited", "business.positioning.by.edited"],
    ] as const) {
      const view = toBusinessView(withChoice(GIVEN, choice(kind, NEWEST)));
      expect(view.positioning.gate).toBe("confirmed");
      expect(view.positioning.statement?.label).toBe(label);
      expect(view.positioning.controls).toEqual([]);
      expect(positioningNode(view)?.state).toBe("agreed");
      expect(positioningNode(view)?.gatePassed).toBe(true);
    }
  });

  it("builds the other four nodes exactly as a view built without positioning", () => {
    const without = toBusinessView(saved(FULL));
    for (const c of [
      null,
      choice("skipped", NEWEST),
      choice("written", NEWEST),
      choice("written", "older"),
    ]) {
      const view = toBusinessView(withChoice(FULL, c));
      expect(view.nodes.filter((n) => n.id !== "positioning")).toEqual(
        without.nodes.filter((n) => n.id !== "positioning"),
      );
      for (const n of view.nodes.filter((n) => n.id !== "positioning")) {
        expect(n.gatePassed).toBe(false);
      }
    }
  });

  it("a view with no positioning saved is open, with no statement", () => {
    const view = toBusinessView(saved(FULL));
    expect(view.positioning).toEqual({
      gate: "open",
      skipped: false,
      stale: false,
      statement: null,
      controls: ["writeOwn", "skip"],
    });
  });

  it("its positioning JSON holds the statement and keys, and no catalog text", () => {
    const view = toBusinessView(
      withChoice(GIVEN, choice("written", NEWEST, "<img src=x onerror=alert(1)>")),
    );
    const strings: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === "string") strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v !== null && typeof v === "object") Object.values(v).forEach(walk);
    };
    walk(JSON.parse(JSON.stringify(view.positioning)));
    expect(strings).toContain("<img src=x onerror=alert(1)>");
    for (const s of strings.filter((s) => s !== "<img src=x onerror=alert(1)>")) {
      expect(s).toMatch(/^[a-z][A-Za-z0-9.-]*$/);
    }
  });

  it("stale positioning: a choice on an older intake reopens the gate with the old statement", () => {
    for (const kind of ["written", "picked"] as const) {
      const view = toBusinessView(withChoice(GIVEN, choice(kind, "intake-a")));
      expect(view.positioning.gate).toBe("open");
      expect(view.positioning.stale).toBe(true);
      expect(view.positioning.statement).toEqual({
        text: "คั่วสดส่งถึงบ้าน",
        label: "business.positioning.stale",
        modelId: null,
      });
      expect(positioningNode(view)?.state).toBe("proposed");
      expect(positioningNode(view)?.gatePassed).toBe(false);
      expect(JSON.stringify(view.positioning)).not.toContain("business.positioning.by.");
      expect(view.positioning.controls).toEqual(["writeOwn", "skip"]);
    }
  });

  it("a skipped choice on an older intake is not stale and shows no statement", () => {
    const view = toBusinessView(withChoice(GIVEN, choice("skipped", "intake-a")));
    expect(view.positioning.stale).toBe(false);
    expect(view.positioning.statement).toBeNull();
    expect(positioningNode(view)?.state).toBe("proposed");
  });
});

// ORV-291 tech notes section 13, T7 and T8; spec rows 2, 4, 5, 6 (the data half).
describe("foundation in the view", () => {
  const NEWEST = "intake-b";
  const at = "2026-11-18T03:04:05.000Z";
  const AXES = { playful: 75, expressive: 75, structured: 75, warm: 75, premium: 75 };
  const written = (intakeId: string): StoredChoice => ({
    id: "c",
    intakeId,
    createdAt: at,
    kind: "written",
    statement: "คั่วสดส่งถึงบ้าน",
    draftId: null,
    option: null,
  });
  const skippedChoice: StoredChoice = {
    id: "c",
    intakeId: NEWEST,
    createdAt: at,
    kind: "skipped",
    statement: null,
    draftId: null,
    option: null,
  };
  const POSITIONING = {
    agreed: written(NEWEST),
    skipped: skippedChoice,
    open: null,
    stale: written("intake-a"),
  } as const;
  const entry = (
    kind: "given" | "skipped",
    id: string,
    createdAt: string,
    answers: { person?: string; never?: string } = {},
  ): StoredEntry =>
    storedEntrySchema.parse({
      id,
      node: "identity-frame",
      kind,
      payload: kind === "given" ? { axes: AXES, ...answers } : {},
      createdAt,
    });
  const GIVEN_ENTRY = entry("given", "g1", "2026-11-19T04:00:00.000Z", {
    person: "อบอุ่น เป็นกันเอง จริงใจ",
  });
  const SKIP_ENTRY = entry("skipped", "s1", "2026-11-19T03:00:00.000Z");
  const GIVEN_INTAKE = { idea: "i", value: "v" };
  const project_ = (
    positioning: keyof typeof POSITIONING,
    foundation?: StoredEntry[],
  ): SavedBusiness =>
    saved(GIVEN_INTAKE, {
      positioning: { intakeId: NEWEST, choice: POSITIONING[positioning] },
      ...(foundation === undefined ? {} : { foundation }),
    });
  const personality = (view: ReturnType<typeof toBusinessView>) => {
    const node = view.foundation[0];
    if (node?.id !== "identity-frame") throw new Error("the node identity-frame");
    return node;
  };
  const architecture = (view: ReturnType<typeof toBusinessView>) => {
    const node = view.foundation[1];
    if (node?.id !== "architecture") throw new Error("the node architecture");
    return node;
  };
  const nameNode = (view: ReturnType<typeof toBusinessView>) => {
    const node = view.foundation[2];
    if (node?.id !== "name") throw new Error("the node name");
    return node;
  };
  const coreIdea = (view: ReturnType<typeof toBusinessView>) => {
    const node = view.foundation[3];
    if (node?.id !== "core-idea") throw new Error("the node core-idea");
    return node;
  };
  const IDEA = (
    kind: "written" | "skipped",
    createdAt = "2026-11-19T07:00:00.000Z",
    payload: { statement?: string; remember?: string } = {},
  ): StoredEntry =>
    storedEntrySchema.parse({
      id: `i-${kind}-${createdAt}`,
      node: "core-idea",
      kind,
      payload: kind === "written" ? { statement: "ทำให้ง่ายที่สุด", ...payload } : {},
      createdAt,
    });
  const colorNode = (view: ReturnType<typeof toBusinessView>) => {
    const node = view.foundation[4];
    if (node?.id !== "color") throw new Error("the node color");
    return node;
  };
  const typographyNode = (view: ReturnType<typeof toBusinessView>) => {
    const node = view.foundation[5];
    if (node?.id !== "typography") throw new Error("the node typography");
    return node;
  };
  const TYPOGRAPHY = (
    scripts: "thai-latin" | "thai" | "latin" = "thai-latin",
    createdAt = "2026-11-19T08:00:00.000Z",
  ): StoredEntry =>
    storedEntrySchema.parse({
      id: `t-${scripts}`,
      node: "typography",
      kind: "answered",
      payload: { scripts },
      createdAt,
    });
  const LINEUP = (lineup: Lineup = STAND_IN_LINEUP): StoredEntry =>
    storedEntrySchema.parse({
      id: "l1",
      node: "competitive-frame",
      kind: "lineup",
      payload: { lineup },
      createdAt: "2026-11-19T07:00:00.000Z",
    });
  const ANSWER = (subBrands: boolean, createdAt = "2026-11-19T05:00:00.000Z"): StoredEntry =>
    storedEntrySchema.parse({
      id: `a-${subBrands}`,
      node: "architecture",
      kind: "answered",
      payload: { subBrands },
      createdAt,
    });
  const NAME = (name = "ORIVILO"): StoredEntry =>
    storedEntrySchema.parse({
      id: "n1",
      node: "name",
      kind: "given",
      payload: { name },
      createdAt: "2026-11-19T06:00:00.000Z",
    });

  describe("foundation marks", () => {
    it("gives identity-frame the results of W4 cases 1, 2 and 5 on a given personality", () => {
      const agreed = personality(toBusinessView(project_("agreed", [GIVEN_ENTRY])));
      const skipped = personality(toBusinessView(project_("skipped", [GIVEN_ENTRY])));
      const stale = personality(toBusinessView(project_("stale", [GIVEN_ENTRY])));
      expect([agreed.result, skipped.result, stale.result]).toEqual([
        { status: "given", skipped: false, blockedBy: [], provisionalOn: [], unchecked: [] },
        {
          status: "given",
          skipped: false,
          blockedBy: [],
          provisionalOn: [],
          unchecked: ["positioning"],
        },
        {
          status: "given",
          skipped: false,
          blockedBy: [],
          provisionalOn: [],
          unchecked: ["positioning"],
        },
      ]);
      expect([agreed.unchecked, skipped.unchecked, stale.unchecked]).toEqual([
        [],
        ["positioning"],
        ["positioning"],
      ]);
    });

    it("keeps the five values unchanged and the state given under every mark", () => {
      for (const positioning of ["agreed", "skipped", "stale"] as const) {
        const node = personality(toBusinessView(project_(positioning, [GIVEN_ENTRY])));
        expect(node.state, positioning).toBe("given");
        expect(node.axes?.map((a) => [a.axis, a.value, a.point])).toEqual([
          ["playful", 75, 4],
          ["expressive", 75, 4],
          ["structured", 75, 4],
          ["warm", 75, 4],
          ["premium", 75, 4],
        ]);
        expect(node.person).toBe("อบอุ่น เป็นกันเอง จริงใจ");
        expect(node.never).toBeNull();
      }
    });

    it("shows a mark line only for a given or derived result, and restsOn only for derived", () => {
      const open = personality(toBusinessView(project_("open")));
      expect(open.result.status).toBe("blocked");
      expect(open.unchecked).toEqual([]);
      expect(open.restsOn).toEqual([]);
      const skipped = personality(toBusinessView(project_("skipped", [SKIP_ENTRY])));
      expect(skipped.result.status).toBe("open");
      expect(skipped.unchecked).toEqual([]);
      expect(skipped.restsOn).toEqual([]);
    });
  });

  describe("the result table", () => {
    const lists = {
      blockedBy: ["positioning"] as MarkRef[],
      provisionalOn: ["positioning"] as MarkRef[],
      unchecked: ["situation"] as MarkRef[],
    };
    const lines = (status: FoundationResult["status"], skipped: boolean) => {
      const { state, waitingFor, restsOn, unchecked } = foundationLines({
        status,
        skipped,
        ...lists,
      });
      return { state, waitingFor, restsOn, unchecked };
    };

    it("a given result shows its unchecked line and no rests-on or waiting line", () => {
      expect(lines("given", false)).toEqual({
        state: "given",
        waitingFor: [],
        restsOn: [],
        unchecked: ["situation"],
      });
    });

    it("a derived result shows what it rests on and what it is unchecked against", () => {
      expect(lines("derived", false)).toEqual({
        state: "derived",
        waitingFor: [],
        restsOn: ["positioning"],
        unchecked: ["situation"],
      });
    });

    it("a blocked result waits for its causes and shows no mark line", () => {
      expect(lines("blocked", false)).toEqual({
        state: "waiting",
        waitingFor: ["positioning"],
        restsOn: [],
        unchecked: [],
      });
    });

    it("a skipped or an open result shows its state and no mark line", () => {
      expect(lines("open", true)).toEqual({
        state: "skipped",
        waitingFor: [],
        restsOn: [],
        unchecked: [],
      });
      expect(lines("open", false)).toEqual({
        state: "empty",
        waitingFor: [],
        restsOn: [],
        unchecked: [],
      });
    });
  });

  describe("personality in the view", () => {
    it("holds the state keys, the values and the points", () => {
      const row = (positioning: keyof typeof POSITIONING, entries?: StoredEntry[]) => {
        const node = personality(toBusinessView(project_(positioning, entries)));
        return `${node.state} ${node.waitingFor.join(",") || "-"} ${node.controls.join(",") || "-"}`;
      };
      expect(row("agreed")).toBe("empty - describe,skip");
      expect(row("agreed", [])).toBe("empty - describe,skip");
      expect(row("agreed", [SKIP_ENTRY])).toBe("skipped - describe");
      expect(row("agreed", [GIVEN_ENTRY])).toBe("given - -");
      expect(row("agreed", [SKIP_ENTRY, GIVEN_ENTRY])).toBe("given - -");
      expect(row("open")).toBe("waiting positioning -");
      expect(row("stale")).toBe("waiting positioning -");
      expect(row("skipped")).toBe("empty - describe,skip");
    });

    it("maps the five points: a value of 0, 25, 50, 75 and 100 is point 1 to 5", () => {
      const node = personality(
        toBusinessView(
          project_("agreed", [
            storedEntrySchema.parse({
              id: "g",
              node: "identity-frame",
              kind: "given",
              payload: {
                axes: { playful: 0, expressive: 25, structured: 50, warm: 75, premium: 100 },
              },
              createdAt: at,
            }),
          ]),
        ),
      );
      expect(node.axes?.map((a) => [a.value, a.point])).toEqual([
        [0, 1],
        [25, 2],
        [50, 3],
        [75, 4],
        [100, 5],
      ]);
      expect(node.person).toBeNull();
    });

    it("shows no value and no answer while the node is open or skipped", () => {
      for (const entries of [undefined, [SKIP_ENTRY]]) {
        const node = personality(toBusinessView(project_("agreed", entries)));
        expect(node.axes).toBeNull();
        expect(node.person).toBeNull();
        expect(node.never).toBeNull();
      }
    });

    it("names the fields the card lists, in order, and has the node first and only", () => {
      const view = toBusinessView(project_("agreed"));
      expect(view.foundation.map((n) => n.id)).toEqual([
        "identity-frame",
        "architecture",
        "name",
        "core-idea",
        "color",
        "typography",
      ]);
      expect(coreIdea(view).fields).toEqual(["remember", "coreIdea"]);
      expect(personality(view).fields).toEqual(["person", "never", "personality"]);
      expect(architecture(view).fields).toEqual(["subBrands", "architecture"]);
      expect(nameNode(view).fields).toEqual(["workingName"]);
      expect(colorNode(view).fields).toEqual([
        "signature",
        "neutral",
        "canvas",
        "lineup",
        "crowded",
      ]);
      expect(typographyNode(view).fields).toEqual(["scripts", "readingFace", "displayFace"]);
    });

    it("the newest entry wins in whatever order the entries are stored", () => {
      const a = personality(toBusinessView(project_("agreed", [SKIP_ENTRY, GIVEN_ENTRY])));
      const b = personality(toBusinessView(project_("agreed", [GIVEN_ENTRY, SKIP_ENTRY])));
      expect(a.state).toBe("given");
      expect(b.state).toBe("given");
    });

    it("an absent foundation is no entry", () => {
      expect(toBusinessView(project_("agreed")).foundation).toEqual(
        toBusinessView(project_("agreed", [])).foundation,
      );
    });
  });

  // T29, rows 15 to 17 and 20, the data half.
  describe("architecture derived", () => {
    it("row 15: with positioning agreed and the answer no, the node is derived by rule architecture-derive-1", () => {
      const node = architecture(toBusinessView(project_("agreed", [ANSWER(false)])));
      expect(node.state).toBe("derived");
      expect(node.subBrands).toBe(false);
      expect(node.value).toEqual({
        key: "business.architecture.single",
        rule: "architecture-derive-1",
      });
      expect(node.result.status).toBe("derived");
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual([]);
      expect(node.waitingFor).toEqual([]);
      expect(node.controls).toEqual([]);
    });

    it("row 15, before the answer: empty, no answer, no value, and the question is offered", () => {
      for (const entries of [undefined, []]) {
        const node = architecture(toBusinessView(project_("agreed", entries)));
        expect(node.state).toBe("empty");
        expect(node.subBrands).toBeNull();
        expect(node.value).toBeNull();
        expect(node.controls).toEqual(["answer"]);
      }
    });

    it("stores no derived value: the stored entry holds the answer and the view derives the value", () => {
      const entry = ANSWER(false);
      expect(JSON.stringify(entry)).not.toContain("single");
      expect(JSON.stringify(entry)).not.toContain("architecture-derive-1");
    });
  });

  describe("architecture yes", () => {
    it("row 16: the answer yes is not in this version, shows no value, and name waits for architecture", () => {
      const view = toBusinessView(project_("agreed", [ANSWER(true)]));
      const node = architecture(view);
      expect(node.state).toBe("notInVersion");
      expect(node.subBrands).toBe(true);
      expect(node.value).toBeNull();
      expect(node.result).toMatchObject({ status: "open", skipped: false });
      expect(node.controls).toEqual([]);
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual([]);
      const name = nameNode(view);
      expect(name.state).toBe("waiting");
      expect(name.waitingFor).toEqual(["architecture"]);
      expect(name.result).toMatchObject({ status: "blocked", blockedBy: ["architecture"] });
      expect(name.controls).toEqual(["give"]);
    });

    it("a yes while positioning is open waits for positioning: a block wins over notInVersion", () => {
      for (const positioning of ["open", "stale"] as const) {
        const node = architecture(toBusinessView(project_(positioning, [ANSWER(true)])));
        expect(node.state, positioning).toBe("waiting");
        expect(node.waitingFor, positioning).toEqual(["positioning"]);
        expect(node.subBrands, positioning).toBe(true);
      }
      expect(architecture(toBusinessView(project_("skipped", [ANSWER(true)]))).state).toBe(
        "notInVersion",
      );
    });

    it("notInVersion is the open state of a stored yes only: no answer is empty", () => {
      expect(architecture(toBusinessView(project_("agreed", []))).state).toBe("empty");
      expect(architecture(toBusinessView(project_("agreed", [ANSWER(false)]))).state).toBe(
        "derived",
      );
    });
  });

  describe("architecture marks", () => {
    it("row 17: the three projects give W4's results and show the saved answer without a value", () => {
      const noChoiceNo = architecture(toBusinessView(project_("open", [ANSWER(false)])));
      const skippedNo = architecture(toBusinessView(project_("skipped", [ANSWER(false)])));
      const noChoiceNone = architecture(toBusinessView(project_("open", [])));
      expect(noChoiceNo.result).toEqual({
        status: "blocked",
        skipped: false,
        blockedBy: ["positioning"],
        provisionalOn: [],
        unchecked: [],
      });
      expect(skippedNo.result).toEqual({
        status: "derived",
        skipped: false,
        blockedBy: [],
        provisionalOn: ["positioning"],
        unchecked: [],
      });
      expect(noChoiceNone.result).toEqual({
        status: "blocked",
        skipped: false,
        blockedBy: ["positioning"],
        provisionalOn: [],
        unchecked: [],
      });
    });

    it("row 17, first: waits for positioning with the saved answer and no value", () => {
      const node = architecture(toBusinessView(project_("open", [ANSWER(false)])));
      expect(node.state).toBe("waiting");
      expect(node.waitingFor).toEqual(["positioning"]);
      expect(node.subBrands).toBe(false);
      expect(node.value).toBeNull();
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual([]);
    });

    it("row 17, second: derived with the value, provisional, resting on positioning", () => {
      const node = architecture(toBusinessView(project_("skipped", [ANSWER(false)])));
      expect(node.state).toBe("derived");
      expect(node.value).not.toBeNull();
      expect(node.restsOn).toEqual(["positioning"]);
      expect(node.unchecked).toEqual([]);
      expect(node.waitingFor).toEqual([]);
    });

    it("row 17, third: waits for positioning with the question still offered", () => {
      const node = architecture(toBusinessView(project_("open", [])));
      expect(node.state).toBe("waiting");
      expect(node.waitingFor).toEqual(["positioning"]);
      expect(node.subBrands).toBeNull();
      expect(node.controls).toEqual(["answer"]);
    });

    it("a stale positioning shows the same as an open one", () => {
      const node = architecture(toBusinessView(project_("stale", [ANSWER(false)])));
      expect(node.state).toBe("waiting");
      expect(node.value).toBeNull();
    });

    it("the question is offered while no entry exists whatever the marks, and never after one", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        expect(
          architecture(toBusinessView(project_(positioning, []))).controls,
          positioning,
        ).toEqual(["answer"]);
        for (const subBrands of [false, true]) {
          expect(
            architecture(toBusinessView(project_(positioning, [ANSWER(subBrands)]))).controls,
          ).toEqual([]);
        }
      }
    });
  });

  describe("the working name in the view", () => {
    it("row 18: a given name shows with state given, no mark and no control", () => {
      const node = nameNode(toBusinessView(project_("agreed", [ANSWER(false), NAME()])));
      expect(node.state).toBe("given");
      expect(node.name).toBe("ORIVILO");
      expect(node.unchecked).toEqual([]);
      expect(node.restsOn).toEqual([]);
      expect(node.controls).toEqual([]);
    });

    it("row 20: before, waits for positioning with give offered; after, given and unchecked positioning", () => {
      const before = nameNode(toBusinessView(project_("open", [])));
      expect(before.state).toBe("waiting");
      expect(before.waitingFor).toEqual(["positioning"]);
      expect(before.name).toBeNull();
      expect(before.controls).toEqual(["give"]);
      const after = nameNode(toBusinessView(project_("open", [NAME()])));
      expect(after.state).toBe("given");
      expect(after.name).toBe("ORIVILO");
      expect(after.unchecked).toEqual(["positioning"]);
      expect(after.result).toMatchObject({ status: "given", unchecked: ["positioning"] });
      expect(after.controls).toEqual([]);
    });

    it("with no entry and nothing blocking it is empty and offers give; a stored name shows in any state", () => {
      const empty = nameNode(toBusinessView(project_("agreed", [ANSWER(false)])));
      expect(empty.state).toBe("empty");
      expect(empty.controls).toEqual(["give"]);
      expect(empty.name).toBeNull();
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        expect(nameNode(toBusinessView(project_(positioning, [NAME("ชื่อ")]))).name).toBe("ชื่อ");
      }
    });

    it("a name stays given when positioning goes stale or architecture is yes (W4 case 5)", () => {
      const view = toBusinessView(project_("stale", [ANSWER(true), NAME()]));
      expect(nameNode(view).state).toBe("given");
      expect(nameNode(view).unchecked).toEqual(["positioning"]);
      const yes = nameNode(toBusinessView(project_("agreed", [ANSWER(true), NAME()])));
      expect(yes.state).toBe("given");
      expect(yes.unchecked).toEqual(["architecture"]);
    });

    it("the name is the typed text: it is neither the project's name nor derived from it", () => {
      const view = toBusinessView(project_("agreed", [NAME("Other")]));
      expect(nameNode(view).name).toBe("Other");
      expect(view.projectName).not.toBe("Other");
      expect(nameNode(toBusinessView(project_("agreed", []))).name).toBeNull();
    });
  });

  describe("controls match the door for architecture and name", () => {
    const SETS: Record<string, StoredEntry[]> = {
      none: [],
      "answer no": [ANSWER(false)],
      "answer yes": [ANSWER(true)],
      name: [NAME()],
      "answer yes and name": [ANSWER(true), NAME()],
      "personality skipped": [SKIP_ENTRY],
    };

    it("offers answer and give exactly when entryAllowed is true, for every fixture", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        for (const [label, entries] of Object.entries(SETS)) {
          const view = toBusinessView(project_(positioning, entries));
          const gate = { state: view.positioning.gate, skipped: view.positioning.skipped };
          const { roots, newest } = foundationState(gate, entries);
          expect(architecture(view).controls.includes("answer"), `${positioning} / ${label}`).toBe(
            entryAllowed({ node: "architecture", kind: "answered" }, { roots, newest }),
          );
          expect(nameNode(view).controls.includes("give"), `${positioning} / ${label}`).toBe(
            entryAllowed({ node: "name", kind: "given" }, { roots, newest }),
          );
        }
      }
    });
  });

  describe("controls match the door", () => {
    const ENTRIES: Record<string, StoredEntry[]> = {
      none: [],
      skipped: [SKIP_ENTRY],
      given: [GIVEN_ENTRY],
      "skipped then given": [SKIP_ENTRY, GIVEN_ENTRY],
    };

    it("offers a control exactly when entryAllowed is true, for every fixture and kind", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        for (const [name, entries] of Object.entries(ENTRIES)) {
          const view = toBusinessView(project_(positioning, entries));
          const node = personality(view);
          const gate = { state: view.positioning.gate, skipped: view.positioning.skipped };
          const { roots, newest } = foundationState(gate, entries);
          const door = (kind: "given" | "skipped") =>
            entryAllowed({ node: "identity-frame", kind }, { roots, newest });
          const label = `${positioning} / ${name}`;
          expect(node.controls.includes("describe"), label).toBe(door("given"));
          expect(node.controls.includes("skip"), label).toBe(door("skipped"));
        }
      }
    });

    it("offers describe once and skip once, and no skip after a skip", () => {
      expect(personality(toBusinessView(project_("agreed", []))).controls).toEqual([
        "describe",
        "skip",
      ]);
      expect(personality(toBusinessView(project_("agreed", [SKIP_ENTRY]))).controls).toEqual([
        "describe",
      ]);
      expect(personality(toBusinessView(project_("agreed", [GIVEN_ENTRY]))).controls).toEqual([]);
    });
  });

  // ORV-298 tech notes section 13, T13 to T15: spec rows 2, 5, 6, 7 and 8, the data half.
  describe("colour in the view", () => {
    const LIME_A = { name: "lime-a", hex: "#C6F432" };
    const LIME_B = { name: "lime-b", hex: "#B5E61D" };
    const EVERY: Lineup = [
      LIME_A,
      LIME_B,
      { name: "cyan-a", hex: "#00C8E0" },
      { name: "cyan-b", hex: "#10D0E8" },
      { name: "magenta-a", hex: "#D020B0" },
      { name: "magenta-b", hex: "#E030C0" },
      { name: "teal-a", hex: "#00C8A0" },
      { name: "teal-b", hex: "#10D0A8" },
    ];

    it("decides neutral and canvas and keeps the signature open with no lineup", () => {
      const node = colorNode(toBusinessView(project_("agreed", [GIVEN_ENTRY])));
      expect(node.state).toBe("partly");
      expect(node.result.status).toBe("open");
      expect(node.decisions).toEqual({
        signature: null,
        neutral: { value: "warm", rule: "color.neutral.warm" },
        canvas: { value: "soft", rule: "color.canvas.soft" },
      });
      expect(node.signatureOpen).toEqual({ why: "waitsForLineup" });
      expect(node.needsPersonality).toBe(false);
      expect(node.notDecided).toBe(false);
      expect(node.points).toEqual({ expressive: 4, warm: 4, premium: 4 });
      expect(node.lineup).toBeNull();
      expect(node.crowded).toBeNull();
      expect(node.controls).toEqual(["give"]);
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual([]);
      expect(node.waitingFor).toEqual([]);
    });

    it("decides the signature with its rule once a lineup is stored, and offers no control", () => {
      const node = colorNode(toBusinessView(project_("agreed", [GIVEN_ENTRY, LINEUP()])));
      expect(node.state).toBe("derived");
      expect(node.decisions?.signature).toEqual({
        value: "lime",
        rule: "color.signature.lime-warm",
        because: "signature",
        preferred: null,
      });
      expect(node.signatureOpen).toBeNull();
      expect(node.lineup).toEqual(STAND_IN_LINEUP);
      expect(node.crowded).toEqual(["ink", "orange", "violet"]);
      expect(node.controls).toEqual([]);
    });

    it("a crowded lime gives the fallback with lime as the preferred family", () => {
      const node = colorNode(
        toBusinessView(
          project_("agreed", [GIVEN_ENTRY, LINEUP([...STAND_IN_LINEUP, LIME_A, LIME_B])]),
        ),
      );
      expect(node.state).toBe("derived");
      expect(node.decisions?.signature).toEqual({
        value: "cyan",
        rule: "color.signature.cyan-warm-fallback",
        because: "fallback",
        preferred: "lime",
      });
      expect(node.crowded).toContain("lime");
    });

    it("both candidates crowded leaves the signature open, with no value invented", () => {
      const node = colorNode(toBusinessView(project_("agreed", [GIVEN_ENTRY, LINEUP(EVERY)])));
      expect(node.state).toBe("partly");
      expect(node.decisions?.signature).toBeNull();
      expect(node.signatureOpen).toEqual({ why: "bothCrowded", first: "lime", second: "cyan" });
      expect(node.decisions?.neutral?.value).toBe("warm");
      expect(node.controls).toEqual([]);
    });

    it("waits for the personality, or asks for it once skipped", () => {
      const skippedP = colorNode(toBusinessView(project_("agreed", [SKIP_ENTRY])));
      expect(skippedP.state).toBe("needsAnswer");
      expect(skippedP.result).toMatchObject({ status: "open", provisionalOn: ["identity-frame"] });
      expect(skippedP.needsPersonality).toBe(true);
      expect(skippedP.decisions).toEqual({ signature: null, neutral: null, canvas: null });
      expect(skippedP.restsOn).toEqual([]);
      expect(skippedP.unchecked).toEqual([]);
      expect(skippedP.controls).toEqual(["give"]);

      const none = colorNode(toBusinessView(project_("agreed", [])));
      expect(none.state).toBe("waiting");
      expect(none.waitingFor).toEqual(["identity-frame"]);
      expect(none.decisions).toBeNull();
      expect(none.signatureOpen).toBeNull();
      expect(none.needsPersonality).toBe(false);
      expect(none.points).toBeNull();
      expect(none.controls).toEqual(["give"]);

      const open = colorNode(toBusinessView(project_("open", [])));
      expect(open.state).toBe("waiting");
      expect(open.waitingFor).toEqual(["positioning"]);
      expect(open.decisions).toBeNull();
      expect(open.controls).toEqual(["give"]);
    });

    it("shows the lineup and its audit in every result, a blocked one too", () => {
      const node = colorNode(toBusinessView(project_("open", [LINEUP()])));
      expect(node.state).toBe("waiting");
      expect(node.lineup).toEqual(STAND_IN_LINEUP);
      expect(node.crowded).toEqual(["ink", "orange", "violet"]);
      expect(node.decisions).toBeNull();
      expect(node.controls).toEqual([]);
    });

    it("keeps the lineup in the order the person gave it", () => {
      const reversed = [...STAND_IN_LINEUP].reverse();
      expect(colorNode(toBusinessView(project_("agreed", [LINEUP(reversed)]))).lineup).toEqual(
        reversed,
      );
    });

    it("its JSON holds keys, rule ids and the person's names and colours, no catalog text", () => {
      const view = toBusinessView(project_("agreed", [GIVEN_ENTRY, LINEUP()]));
      const json = JSON.stringify(colorNode(view));
      for (const text of ["Worked out", "Lime", "Warm greys", "Rule:", "Waits for"]) {
        expect(json).not.toContain(text);
      }
      expect(json).toContain("color.signature.lime-warm");
    });
  });

  describe("expression marks", () => {
    it("colour takes the marks of W8 cases 2 and 3, with a partial decision too", () => {
      const agreed = colorNode(toBusinessView(project_("agreed", [GIVEN_ENTRY, LINEUP()])));
      const skipped = colorNode(toBusinessView(project_("skipped", [GIVEN_ENTRY, LINEUP()])));
      expect(skipped.state).toBe("derived");
      expect(skipped.restsOn).toEqual(["positioning"]);
      expect(skipped.unchecked).toEqual([]);
      expect(skipped.result.provisionalOn).toEqual(["positioning"]);
      const stale = colorNode(toBusinessView(project_("stale", [GIVEN_ENTRY, LINEUP()])));
      expect(stale.state).toBe("derived");
      expect(stale.restsOn).toEqual([]);
      expect(stale.unchecked).toEqual(["positioning"]);
      // The marks change no decision.
      expect(skipped.decisions).toEqual(agreed.decisions);
      expect(stale.decisions).toEqual(agreed.decisions);
      // Skipped with no lineup: partly, with both provisional lines.
      const partly = colorNode(toBusinessView(project_("skipped", [GIVEN_ENTRY])));
      expect(partly.state).toBe("partly");
      expect(partly.restsOn).toEqual(["positioning"]);
      expect(partly.decisions?.neutral?.value).toBe("warm");
      // Stale with no lineup: partly, unchecked against positioning.
      const partlyStale = colorNode(toBusinessView(project_("stale", [GIVEN_ENTRY])));
      expect(partlyStale.state).toBe("partly");
      expect(partlyStale.unchecked).toEqual(["positioning"]);
      expect(partlyStale.restsOn).toEqual([]);
    });
  });

  describe("expression marks, typography", () => {
    // W8 cases 4, 3 and 5 for typography, and the fourth fixture of row 21.
    it("row 21, first: derived, provisional on the personality the person skipped", () => {
      const node = typographyNode(toBusinessView(project_("agreed", [SKIP_ENTRY, TYPOGRAPHY()])));
      expect(node.state).toBe("derived");
      expect(node.restsOn).toEqual(["identity-frame"]);
      expect(node.unchecked).toEqual([]);
      expect(node.result.provisionalOn).toEqual(["identity-frame"]);
      expect(node.faces).toEqual(typographyOf("thai-latin"));
    });

    it("row 21, second: derived, not yet checked against a stale positioning", () => {
      const node = typographyNode(toBusinessView(project_("stale", [GIVEN_ENTRY, TYPOGRAPHY()])));
      expect(node.state).toBe("derived");
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual(["positioning"]);
      expect(node.faces).toEqual(typographyOf("thai-latin"));
    });

    it("row 21, third: waits for the personality, shows the saved answer and no family", () => {
      const node = typographyNode(toBusinessView(project_("agreed", [TYPOGRAPHY()])));
      expect(node.state).toBe("waiting");
      expect(node.waitingFor).toEqual(["identity-frame"]);
      expect(node.scripts).toBe("thai-latin");
      expect(node.faces).toBeNull();
    });

    it("row 21, fourth: waits for positioning, shows the saved answer and no family", () => {
      const node = typographyNode(toBusinessView(project_("open", [TYPOGRAPHY()])));
      expect(node.state).toBe("waiting");
      expect(node.waitingFor).toEqual(["positioning"]);
      expect(node.result.blockedBy).toEqual(["positioning"]);
      expect(node.scripts).toBe("thai-latin");
      expect(node.faces).toBeNull();
    });

    it("positioning skipped and a given personality: derived, provisional on positioning", () => {
      const node = typographyNode(toBusinessView(project_("skipped", [GIVEN_ENTRY, TYPOGRAPHY()])));
      expect(node.state).toBe("derived");
      expect(node.restsOn).toEqual(["positioning"]);
    });

    it("the marks change no family", () => {
      const faces = (positioning: keyof typeof POSITIONING) =>
        typographyNode(toBusinessView(project_(positioning, [GIVEN_ENTRY, TYPOGRAPHY()]))).faces;
      expect(faces("skipped")).toEqual(faces("agreed"));
      expect(faces("stale")).toEqual(faces("agreed"));
    });
  });

  describe("expression lines", () => {
    const result = (over: Partial<FoundationResult>): FoundationResult => ({
      status: "open",
      skipped: false,
      blockedBy: [],
      provisionalOn: [],
      unchecked: [],
      ...over,
    });

    it("an open result reads partly with a decision made and needsAnswer without", () => {
      const open = result({ provisionalOn: ["positioning"], unchecked: ["identity-frame"] });
      expect(expressionLines(open, 1)).toEqual({
        result: open,
        state: "partly",
        waitingFor: [],
        restsOn: ["positioning"],
        unchecked: ["identity-frame"],
      });
      expect(expressionLines(open, 2).state).toBe("partly");
      expect(expressionLines(open, 0)).toEqual({
        result: open,
        state: "needsAnswer",
        waitingFor: [],
        restsOn: [],
        unchecked: [],
      });
    });

    it("every other status reads as foundationLines gives it, whatever the count", () => {
      for (const decided of [0, 1, 3]) {
        for (const status of ["blocked", "derived", "given"] as const) {
          const r = result({
            status,
            blockedBy: status === "blocked" ? ["positioning"] : [],
            provisionalOn: status === "derived" ? ["positioning"] : [],
            unchecked: status === "given" ? ["positioning"] : [],
          });
          expect(expressionLines(r, decided), `${status} ${decided}`).toEqual(foundationLines(r));
        }
      }
    });
  });

  describe("controls match the door for colour", () => {
    const SETS: Record<string, StoredEntry[]> = {
      none: [],
      lineup: [LINEUP()],
      personality: [GIVEN_ENTRY],
      "personality and lineup": [GIVEN_ENTRY, LINEUP()],
      "personality skipped": [SKIP_ENTRY],
    };

    it("offers give exactly when entryAllowed is true, for every fixture", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        for (const [label, entries] of Object.entries(SETS)) {
          const view = toBusinessView(project_(positioning, entries));
          const gate = { state: view.positioning.gate, skipped: view.positioning.skipped };
          const { roots, newest } = foundationState(gate, entries);
          expect(colorNode(view).controls.includes("give"), `${positioning} / ${label}`).toBe(
            entryAllowed({ node: "competitive-frame", kind: "lineup" }, { roots, newest }),
          );
        }
      }
    });
  });

  // ORV-298 tech notes section 13, T27: spec rows 18, 19 and 21, the data half.
  describe("typography in the view", () => {
    it("row 18, before the answer: needsAnswer, no scripts, no family, and answer is offered", () => {
      const node = typographyNode(toBusinessView(project_("agreed", [GIVEN_ENTRY])));
      expect(node.state).toBe("needsAnswer");
      expect(node.result.status).toBe("open");
      expect(node.scripts).toBeNull();
      expect(node.faces).toBeNull();
      expect(node.controls).toEqual(["answer"]);
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual([]);
      expect(node.waitingFor).toEqual([]);
    });

    it("row 18, after the answer: derived with the families of the answer and no control", () => {
      const node = typographyNode(
        toBusinessView(project_("agreed", [GIVEN_ENTRY, TYPOGRAPHY("thai-latin")])),
      );
      expect(node.state).toBe("derived");
      expect(node.scripts).toBe("thai-latin");
      expect(node.faces).toEqual(typographyOf("thai-latin"));
      expect(node.faces?.reading.map((f) => f.id)).toEqual(["sarabun", "inter"]);
      expect(node.faces?.display.map((f) => f.id)).toEqual(["anuphan", "inter"]);
      expect(node.faces?.pairing).toBe(true);
      expect(node.controls).toEqual([]);
      expect(node.restsOn).toEqual([]);
      expect(node.unchecked).toEqual([]);
    });

    it("row 19: Thai only and Latin only give W7's families and no pairing", () => {
      const thai = typographyNode(
        toBusinessView(project_("agreed", [GIVEN_ENTRY, TYPOGRAPHY("thai")])),
      );
      expect(thai.faces?.reading.map((f) => f.id)).toEqual(["sarabun"]);
      expect(thai.faces?.display.map((f) => f.id)).toEqual(["anuphan"]);
      expect(thai.faces?.pairing).toBe(false);
      const latin = typographyNode(
        toBusinessView(project_("agreed", [GIVEN_ENTRY, TYPOGRAPHY("latin")])),
      );
      expect(latin.faces?.reading.map((f) => f.id)).toEqual(["inter"]);
      expect(latin.faces?.display.map((f) => f.id)).toEqual(["inter"]);
      expect(latin.faces?.pairing).toBe(false);
    });

    it("waits with the saved answer and no family while blocked, and offers the question", () => {
      const node = typographyNode(toBusinessView(project_("agreed", [TYPOGRAPHY("thai-latin")])));
      expect(node.state).toBe("waiting");
      expect(node.waitingFor).toEqual(["identity-frame"]);
      expect(node.scripts).toBe("thai-latin");
      expect(node.faces).toBeNull();
      // No answer stored and blocked: the question is offered all the same, whatever the marks.
      const empty = typographyNode(toBusinessView(project_("open", [])));
      expect(empty.state).toBe("waiting");
      expect(empty.faces).toBeNull();
      expect(empty.controls).toEqual(["answer"]);
    });

    it("the answer is read from the newest typography entry, in whatever order they are stored", () => {
      const a = typographyNode(
        toBusinessView(project_("agreed", [GIVEN_ENTRY, TYPOGRAPHY("latin")])),
      );
      const b = typographyNode(
        toBusinessView(project_("agreed", [TYPOGRAPHY("latin"), GIVEN_ENTRY])),
      );
      expect(a).toEqual(b);
    });

    it("its JSON holds keys, ids and the licence name as data, no catalog text", () => {
      const view = toBusinessView(project_("agreed", [GIVEN_ENTRY, TYPOGRAPHY()]));
      const json = JSON.stringify(typographyNode(view));
      for (const text of ["Worked out", "Looped Thai", "Licence:", "Waits for", "Reading text"]) {
        expect(json).not.toContain(text);
      }
      expect(json).toContain("looped");
      expect(json).toContain("SIL Open Font License 1.1");
    });
  });

  describe("controls match the door for typography", () => {
    const SETS: Record<string, StoredEntry[]> = {
      none: [],
      answer: [TYPOGRAPHY()],
      personality: [GIVEN_ENTRY],
      "personality and answer": [GIVEN_ENTRY, TYPOGRAPHY("latin")],
      "personality skipped": [SKIP_ENTRY],
    };

    it("offers answer exactly when entryAllowed is true, for every fixture", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        for (const [label, entries] of Object.entries(SETS)) {
          const view = toBusinessView(project_(positioning, entries));
          const gate = { state: view.positioning.gate, skipped: view.positioning.skipped };
          const { roots, newest } = foundationState(gate, entries);
          expect(
            typographyNode(view).controls.includes("answer"),
            `${positioning} / ${label}`,
          ).toBe(entryAllowed({ node: "typography", kind: "answered" }, { roots, newest }));
        }
      }
    });
  });

  // T37, spec rows 29 and 30: the core idea's rows as data.
  describe("core idea marks", () => {
    it("row 30: three written ideas give W4 cases 2, 4 and 5, each still agreed", () => {
      const first = coreIdea(toBusinessView(project_("skipped", [GIVEN_ENTRY, IDEA("written")])));
      const second = coreIdea(toBusinessView(project_("agreed", [SKIP_ENTRY, IDEA("written")])));
      const third = coreIdea(toBusinessView(project_("stale", [GIVEN_ENTRY, IDEA("written")])));
      const given = (unchecked: MarkRef[]): FoundationResult => ({
        status: "given",
        skipped: false,
        blockedBy: [],
        provisionalOn: [],
        unchecked,
      });
      expect([first.result, second.result, third.result]).toEqual([
        given(["positioning"]),
        given(["identity-frame"]),
        given(["positioning"]),
      ]);
      expect([first.unchecked, second.unchecked, third.unchecked]).toEqual([
        ["positioning"],
        ["identity-frame"],
        ["positioning"],
      ]);
      for (const node of [first, second, third]) {
        expect(node.state).toBe("agreed");
        expect(node.gate).toBe("given");
        expect(node.gatePassed).toBe(true);
        expect(node.waitingFor).toEqual([]);
        expect(node.restsOn).toEqual([]);
        expect(node.controls).toEqual([]);
      }
    });

    it("a written idea whose roots are all agreed has no unchecked line", () => {
      const node = coreIdea(toBusinessView(project_("agreed", [GIVEN_ENTRY, IDEA("written")])));
      expect(node.unchecked).toEqual([]);
      expect(node.state).toBe("agreed");
    });

    it("shows the statement as typed with its own label, and the remember answer", () => {
      const typed = "<img src=x onerror=alert(1)>";
      const node = coreIdea(
        toBusinessView(
          project_("agreed", [
            GIVEN_ENTRY,
            IDEA("written", "2026-11-19T07:00:00.000Z", {
              statement: typed,
              remember: "<script>alert(1)</script>",
            }),
          ]),
        ),
      );
      expect(node.statement).toEqual({ text: typed, label: "business.positioning.by.own" });
      expect(node.remember).toBe("<script>alert(1)</script>");
    });

    it("a written idea with no remember answer has none", () => {
      const node = coreIdea(toBusinessView(project_("agreed", [GIVEN_ENTRY, IDEA("written")])));
      expect(node.remember).toBeNull();
    });

    it("shows no statement and no answer while the gate is waiting, open or skipped", () => {
      for (const view of [
        toBusinessView(project_("open", [])),
        toBusinessView(project_("agreed", [GIVEN_ENTRY])),
        toBusinessView(project_("agreed", [GIVEN_ENTRY, IDEA("skipped")])),
      ]) {
        const node = coreIdea(view);
        expect(node.statement).toBeNull();
        expect(node.remember).toBeNull();
      }
    });
  });

  describe("core idea waits", () => {
    it("row 29: waits for Brand personality, then for Positioning twice, with no control", () => {
      const rows = [
        coreIdea(toBusinessView(project_("agreed", []))),
        coreIdea(toBusinessView(project_("open", []))),
        coreIdea(toBusinessView(project_("stale", [GIVEN_ENTRY]))),
      ];
      expect(rows.map((n) => n.waitingFor)).toEqual([
        ["identity-frame"],
        ["positioning"],
        ["positioning"],
      ]);
      for (const node of rows) {
        expect(node.state).toBe("waiting");
        expect(node.gate).toBe("blocked");
        expect(node.gatePassed).toBe(false);
        expect(node.controls).toEqual([]);
        expect(node.unchecked).toEqual([]);
        expect(node.statement).toBeNull();
      }
    });

    it("a skipped core idea waits too once its roots change, and offers nothing", () => {
      const node = coreIdea(toBusinessView(project_("open", [IDEA("skipped")])));
      expect(node.state).toBe("waiting");
      expect(node.controls).toEqual([]);
    });
  });

  describe("core idea states", () => {
    it("row 31: waiting, open, skipped and agreed, each with its gate and controls", () => {
      const row = (view: ReturnType<typeof toBusinessView>) => {
        const n = coreIdea(view);
        return [n.state, n.gate, n.skipped, n.gatePassed, n.controls.join(",") || "-"];
      };
      expect(row(toBusinessView(project_("open", [])))).toEqual([
        "waiting",
        "blocked",
        false,
        false,
        "-",
      ]);
      expect(row(toBusinessView(project_("agreed", [GIVEN_ENTRY])))).toEqual([
        "empty",
        "open",
        false,
        false,
        "writeOwn,skip",
      ]);
      expect(row(toBusinessView(project_("agreed", [GIVEN_ENTRY, IDEA("skipped")])))).toEqual([
        "skipped",
        "open",
        true,
        false,
        "writeOwn",
      ]);
      expect(row(toBusinessView(project_("agreed", [GIVEN_ENTRY, IDEA("written")])))).toEqual([
        "agreed",
        "given",
        false,
        true,
        "-",
      ]);
    });

    it("row 28: a skip, then a written idea: the newest wins, in whatever order they are stored", () => {
      const skip = IDEA("skipped", "2026-11-19T07:00:00.000Z");
      const write = IDEA("written", "2026-11-19T08:00:00.000Z");
      for (const entries of [
        [GIVEN_ENTRY, skip, write],
        [write, skip, GIVEN_ENTRY],
      ]) {
        expect(coreIdea(toBusinessView(project_("agreed", entries))).state).toBe("agreed");
      }
      expect(coreIdea(toBusinessView(project_("agreed", [GIVEN_ENTRY, skip]))).state).toBe(
        "skipped",
      );
    });

    it("the other three nodes keep the state keys they had: given, derived, empty", () => {
      const view = toBusinessView(
        project_("agreed", [GIVEN_ENTRY, ANSWER(false), NAME(), IDEA("written")]),
      );
      expect(view.foundation.map((n) => n.state)).toEqual([
        "given",
        "derived",
        "given",
        "agreed",
        "partly",
        "needsAnswer",
      ]);
    });
  });

  describe("controls match the door for the core idea", () => {
    const SETS: Record<string, StoredEntry[]> = {
      none: [],
      "personality given": [GIVEN_ENTRY],
      "personality skipped": [SKIP_ENTRY],
      "idea skipped": [GIVEN_ENTRY, IDEA("skipped")],
      "idea written": [GIVEN_ENTRY, IDEA("written")],
      "idea skipped then written": [
        GIVEN_ENTRY,
        IDEA("skipped", "2026-11-19T07:00:00.000Z"),
        IDEA("written", "2026-11-19T08:00:00.000Z"),
      ],
      "idea skipped, no personality": [IDEA("skipped")],
    };

    it("offers writeOwn and skip exactly when entryAllowed is true, for every fixture", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        for (const [label, entries] of Object.entries(SETS)) {
          const view = toBusinessView(project_(positioning, entries));
          const gate = { state: view.positioning.gate, skipped: view.positioning.skipped };
          const { roots, newest } = foundationState(gate, entries);
          const controls = coreIdea(view).controls;
          const key = `${positioning} / ${label}`;
          expect(controls.includes("writeOwn"), key).toBe(
            entryAllowed({ node: "core-idea", kind: "written" }, { roots, newest }),
          );
          expect(controls.includes("skip"), key).toBe(
            entryAllowed({ node: "core-idea", kind: "skipped" }, { roots, newest }),
          );
        }
      }
    });

    it("offers writeOwn once and skip once, and no skip after a skip", () => {
      expect(coreIdea(toBusinessView(project_("agreed", [GIVEN_ENTRY]))).controls).toEqual([
        "writeOwn",
        "skip",
      ]);
      expect(
        coreIdea(toBusinessView(project_("agreed", [GIVEN_ENTRY, IDEA("skipped")]))).controls,
      ).toEqual(["writeOwn"]);
    });
  });

  // T38, spec row 35: no AI label on any of the four nodes.
  describe("foundation, no AI label", () => {
    const AI_LABELS = [
      "evidence.fromModel",
      "strategy.draftedOptions",
      "business.positioning.draftedBy",
      "business.positioning.by.picked",
      "business.positioning.by.edited",
    ];
    const SETS: StoredEntry[][] = [
      [],
      [SKIP_ENTRY],
      [GIVEN_ENTRY],
      [GIVEN_ENTRY, ANSWER(false)],
      [GIVEN_ENTRY, ANSWER(true)],
      [GIVEN_ENTRY, ANSWER(false), NAME()],
      [SKIP_ENTRY, ANSWER(true), NAME(), IDEA("skipped")],
      [GIVEN_ENTRY, IDEA("skipped")],
      [GIVEN_ENTRY, ANSWER(false), NAME(), IDEA("written", undefined, { remember: "x" })],
      [
        SKIP_ENTRY,
        IDEA("skipped", "2026-11-19T07:00:00.000Z"),
        IDEA("written", "2026-11-19T08:00:00.000Z"),
      ],
    ];
    const everyView = () =>
      (Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>).flatMap((positioning) =>
        SETS.map((entries) => toBusinessView(project_(positioning, entries))),
      );
    const walk = (v: unknown, out: { strings: string[]; keys: string[] }): void => {
      if (typeof v === "string") out.strings.push(v);
      else if (Array.isArray(v)) for (const item of v) walk(item, out);
      else if (v !== null && typeof v === "object") {
        for (const [k, item] of Object.entries(v)) {
          out.keys.push(k);
          walk(item, out);
        }
      }
    };

    it("over every fixture the foundation JSON holds none of the five AI labels and no model id", () => {
      const ids = Object.values(AI_MODELS);
      for (const view of everyView()) {
        const json = JSON.stringify(view.foundation);
        const found = { strings: [] as string[], keys: [] as string[] };
        walk(JSON.parse(json), found);
        for (const label of AI_LABELS) expect(found.strings, label).not.toContain(label);
        expect(found.keys).not.toContain("modelId");
        for (const id of ids) expect(json).not.toContain(id);
        expect(json).not.toMatch(/anthropic|openrouter|gemini/i);
      }
    });

    it("a written idea is the person's own words: labelled as their own, never drafted, picked or edited", () => {
      let seen = 0;
      for (const view of everyView()) {
        const node = coreIdea(view);
        if (node.statement === null) continue;
        seen += 1;
        expect(node.statement.label).toBe("business.positioning.by.own");
      }
      expect(seen).toBeGreaterThan(0);
    });

    it("no entry kind of the four nodes is picked or edited", () => {
      for (const view of everyView()) {
        expect(JSON.stringify(view.foundation)).not.toMatch(/"(picked|edited|drafted)"/);
      }
    });
  });

  describe("beside the business nodes", () => {
    it("builds the five nodes, positioning and reading exactly as a view built without foundation", () => {
      for (const positioning of Object.keys(POSITIONING) as Array<keyof typeof POSITIONING>) {
        const without = toBusinessView(project_(positioning));
        for (const entries of [[SKIP_ENTRY], [GIVEN_ENTRY], [SKIP_ENTRY, GIVEN_ENTRY]]) {
          const withEntries = toBusinessView(project_(positioning, entries));
          expect(withEntries.nodes, positioning).toEqual(without.nodes);
          expect(withEntries.positioning, positioning).toEqual(without.positioning);
          expect(withEntries.reading).toEqual(without.reading);
          expect(withEntries.projectName).toBe(without.projectName);
          expect(withEntries.savedAt).toBe(without.savedAt);
        }
      }
    });

    it("its JSON holds state keys, label keys and the person's words, never catalog text", () => {
      const view = toBusinessView(project_("skipped", [GIVEN_ENTRY]));
      const strings: string[] = [];
      const walk = (v: unknown): void => {
        if (typeof v === "string") strings.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v !== null && typeof v === "object") Object.values(v).forEach(walk);
      };
      walk(JSON.parse(JSON.stringify(view.foundation)));
      const closed = new Set([
        "identity-frame",
        "architecture",
        "name",
        "given",
        "open",
        "empty",
        "waiting",
        "blocked",
        "positioning",
        "person",
        "never",
        "personality",
        "subBrands",
        "workingName",
        "answer",
        "give",
        "core-idea",
        "remember",
        "coreIdea",
        "writeOwn",
        "describe",
        "skip",
        "playful",
        "expressive",
        "structured",
        "warm",
        "premium",
        // The color node: its id, field keys, decision values, rule ids and control.
        "color",
        "signature",
        "neutral",
        "canvas",
        "lineup",
        "crowded",
        "soft",
        "color.neutral.warm",
        "color.canvas.soft",
        "waitsForLineup",
        "partly",
        // The typography node: its id, field keys, control and state.
        "typography",
        "scripts",
        "readingFace",
        "displayFace",
        "needsAnswer",
      ]);
      const rest = strings.filter((s) => !closed.has(s));
      expect(rest).toEqual(["อบอุ่น เป็นกันเอง จริงใจ"]);
    });

    it("the same saved project gives the same view, and the view survives a JSON round trip", () => {
      const s = project_("stale", [SKIP_ENTRY, GIVEN_ENTRY]);
      const view = toBusinessView(s);
      expect(toBusinessView(s)).toStrictEqual(view);
      expect(JSON.parse(JSON.stringify(view))).toEqual(view);
    });
  });
});
