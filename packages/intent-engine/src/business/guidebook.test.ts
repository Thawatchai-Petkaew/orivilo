import { describe, expect, it, vi } from "vitest";
import { STAND_IN_LINEUP } from "../color-fixtures";
import type { Complete } from "../llm-interpreter";
import { storedEntrySchema, type StoredEntry } from "./foundation";
import {
  DONE_STATES,
  GUIDEBOOK_FOUNDATION,
  GUIDEBOOK_HYPOTHESIS,
  GUIDEBOOK_LEAD,
  GUIDEBOOK_NOT_HELD,
  GUIDEBOOK_QUESTIONS,
  GUIDEBOOK_VISUAL,
  guidebookOf,
  TYPOGRAPHY_RULE,
  type Guidebook,
  type GuidebookItem,
} from "./guidebook";
import guidebookSource from "./guidebook.ts?raw";
import { storedIntakeSchema } from "./intake";
import type { StoredChoice, StoredDraft } from "./positioning";
import { PROXY_QUESTIONS, START_QUESTIONS } from "./questions";
import { BUSINESS_READ_MODEL, modelReading, readBusiness } from "./read";
import {
  FIXTURE_ANSWER,
  FIXTURE_INTAKE,
  FIXTURE_INTAKE_ID,
  FIXTURE_SAVED_AT,
} from "./read-fixtures";
import { toBusinessView, type BusinessView, type SavedBusiness } from "./view";

// ORV-302 tech notes section 13, T1 to T13 and T33 to T35; spec rows 1 to 12 and 17 to 19, W2, W3.
// Fixtures are `SavedBusiness` values run through `toBusinessView`, then `guidebookOf`. Stand-in
// names and statements only; none is a real brand.

const at = "2026-11-18T03:04:05.000Z";
const NEWEST = "intake-b";
const OLDER = "intake-a";
const GIVEN_INTAKE = { idea: "i", value: "v" };
const AXES = { playful: 75, expressive: 75, structured: 75, warm: 75, premium: 75 };
const STATEMENT = "คั่วสดส่งถึงบ้าน";
const PERSON = "สุขุม แม่นยำ อบอุ่น";
const IDEA_TEXT = "ทำให้ง่ายที่สุด";
const REMEMBER = "ง่ายและอบอุ่น";

const choice = (kind: "written" | "skipped", intakeId: string): StoredChoice =>
  kind === "skipped"
    ? { id: "c", intakeId, createdAt: at, kind, statement: null, draftId: null, option: null }
    : { id: "c", intakeId, createdAt: at, kind, statement: STATEMENT, draftId: null, option: null };

const POSITIONING = {
  agreed: choice("written", NEWEST),
  skipped: choice("skipped", NEWEST),
  open: null,
  stale: choice("written", OLDER),
} as const;

const entry = (e: Record<string, unknown>): StoredEntry => storedEntrySchema.parse(e);
const PERSONALITY = (person: string | undefined = PERSON): StoredEntry =>
  entry({
    id: "p-given",
    node: "identity-frame",
    kind: "given",
    payload: { axes: AXES, ...(person === undefined ? {} : { person }) },
    createdAt: "2026-11-19T04:00:00.000Z",
  });
const PERSONALITY_SKIPPED = (): StoredEntry =>
  entry({
    id: "p-skip",
    node: "identity-frame",
    kind: "skipped",
    payload: {},
    createdAt: "2026-11-19T04:00:00.000Z",
  });
const ARCHITECTURE = (subBrands: boolean): StoredEntry =>
  entry({
    id: `a-${subBrands}`,
    node: "architecture",
    kind: "answered",
    payload: { subBrands },
    createdAt: "2026-11-19T05:00:00.000Z",
  });
const NAME = (name = "ORIVILO"): StoredEntry =>
  entry({
    id: "n1",
    node: "name",
    kind: "given",
    payload: { name },
    createdAt: "2026-11-19T06:00:00.000Z",
  });
const IDEA = (kind: "written" | "skipped"): StoredEntry =>
  entry({
    id: `i-${kind}`,
    node: "core-idea",
    kind,
    payload: kind === "written" ? { statement: IDEA_TEXT, remember: REMEMBER } : {},
    createdAt: "2026-11-19T07:00:00.000Z",
  });
const LINEUP = (lineup = STAND_IN_LINEUP): StoredEntry =>
  entry({
    id: "l1",
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup },
    createdAt: "2026-11-19T07:30:00.000Z",
  });
const TYPOGRAPHY = (scripts: "thai-latin" | "thai" | "latin" = "thai-latin"): StoredEntry =>
  entry({
    id: `t-${scripts}`,
    node: "typography",
    kind: "answered",
    payload: { scripts },
    createdAt: "2026-11-19T08:00:00.000Z",
  });
const LOGO_TYPE = (appIcon: boolean): StoredEntry =>
  entry({
    id: `g-${appIcon}`,
    node: "logo-type",
    kind: "answered",
    payload: { appIcon },
    createdAt: "2026-11-19T09:00:00.000Z",
  });

const project = (
  positioning: keyof typeof POSITIONING,
  foundation: StoredEntry[],
  intake: Record<string, string> = GIVEN_INTAKE,
): SavedBusiness => ({
  project: { id: "p1", name: "คลินิกฟัน", createdAt: at },
  intake: storedIntakeSchema.parse({ version: "intake-1", ...intake }),
  positioning: { intakeId: NEWEST, choice: POSITIONING[positioning] },
  foundation,
});

/** W2 case A's entries with the three visual answers: the foundation half and D's visual half. */
const FOUNDATION_A = [PERSONALITY(), ARCHITECTURE(false), NAME(), IDEA("written")];
const VISUAL = [LINEUP(), TYPOGRAPHY(), LOGO_TYPE(false)];

/** The done project of the spec: derived logo type, colour and typography. */
const DONE = project("agreed", [...FOUNDATION_A, ...VISUAL]);
/** Row 4: a positioning answer and no choice; then the same with the architecture and the name. */
const OPEN_FIRST = project("open", []);
const OPEN_SECOND = project("open", [ARCHITECTURE(false), NAME()]);
/** Row 5 and W2 case D: the done project with the positioning choice skipped. */
const SKIPPED = project("skipped", [...FOUNDATION_A, ...VISUAL]);
/** W2 case A, the foundation half of D. */
const SKIPPED_FOUNDATION = project("skipped", FOUNDATION_A);
/** Row 6 and W2 case B. */
const SKIPPED_STEPS = project("skipped", [
  PERSONALITY_SKIPPED(),
  ARCHITECTURE(false),
  NAME(),
  IDEA("skipped"),
]);
/** Row 7 and W2 case C: agreed on an older intake. */
const STALE = project("stale", [...FOUNDATION_A, ...VISUAL]);
/** Row 18: no lineup, no typography entry, no logo type entry and no working name. */
const WAITING_VISUAL = project("agreed", [PERSONALITY(), ARCHITECTURE(false), IDEA("written")]);
/** Open question 11: an empty value answer and no choice. */
const EMPTY_VALUE = project("open", [], { idea: "i" });
/** A skipped positioning with no lineup: the colour is partly decided and rests on the skip. */
const SKIPPED_PARTLY = project("skipped", [
  PERSONALITY(),
  ARCHITECTURE(false),
  NAME(),
  IDEA("written"),
  TYPOGRAPHY(),
  LOGO_TYPE(false),
]);

const viewOf = toBusinessView;
const gb = (s: SavedBusiness): Guidebook => guidebookOf(toBusinessView(s));
const items = (g: Guidebook): GuidebookItem[] => [...g.foundation, ...g.visual];
const itemOf = (g: Guidebook, id: GuidebookItem["id"]): GuidebookItem => {
  const found = items(g).find((i) => i.id === id);
  if (found === undefined) throw new Error(`no item ${id}`);
  return found;
};

/** The model reading of the board's own fixture, so a test can see it is never carried. */
const { createHash } = (await vi.importActual("node:crypto")) as {
  createHash(a: "sha256"): { update(s: string, e: "utf8"): { digest(e: "hex"): string } };
};
const sha256Text = (t: string): string => createHash("sha256").update(t, "utf8").digest("hex");
const ANSWERS = Object.fromEntries(
  Object.entries(FIXTURE_INTAKE).filter(([key]) => key !== "projectName"),
) as Omit<typeof FIXTURE_INTAKE, "projectName">;
const complete: Complete = () => Promise.resolve(JSON.stringify(FIXTURE_ANSWER));
const { items: readItems } = await readBusiness(
  { intake: ANSWERS, intakeId: FIXTURE_INTAKE_ID, savedAt: FIXTURE_SAVED_AT },
  { complete, sha256Text, model: BUSINESS_READ_MODEL },
);
const WITH_READING: SavedBusiness = {
  ...DONE,
  intake: storedIntakeSchema.parse({ version: "intake-1", ...ANSWERS }),
  reading: modelReading(FIXTURE_INTAKE_ID, BUSINESS_READ_MODEL, readItems),
};

/** Every fixture of PR 1, by the row it serves. */
const FIXTURES: Array<[string, SavedBusiness]> = [
  ["row 1 and 2, the done project", DONE],
  ["row 4, an open positioning", OPEN_FIRST],
  ["row 4, an open positioning with an architecture and a name", OPEN_SECOND],
  ["row 5, positioning skipped", SKIPPED],
  ["W2 case A, positioning skipped, foundation only", SKIPPED_FOUNDATION],
  ["row 6, three skipped steps", SKIPPED_STEPS],
  ["row 7, positioning out of date", STALE],
  ["row 18, the visual items wait", WAITING_VISUAL],
  ["row 19, a partly colour on a skipped positioning", SKIPPED_PARTLY],
  ["open question 11, an empty value answer", EMPTY_VALUE],
  ["a model reading on the board", WITH_READING],
];

/** The spec's W2 print: each step with the items resting on it, or "none". */
const printW2 = (g: Guidebook): string =>
  g.unconfirmed.length === 0
    ? "none"
    : g.unconfirmed
        .map((s) => `${s.id}=${s.restingOn.map((r) => `${r.id}:${r.mark}`).join(",") || "none"}`)
        .join(" ");

const W3 = "audit,verbal,look-feel,expression-kit,ip-screen,touchpoints,validation,launch";

describe("sections and their order", () => {
  it("lists the lead, the foundation and the visual items in the order of the spec", () => {
    const g = gb(DONE);
    expect(GUIDEBOOK_LEAD).toEqual(["situation", "business-core", "audience", "competitive-frame"]);
    expect(GUIDEBOOK_FOUNDATION).toEqual([
      "positioning",
      "identity-frame",
      "architecture",
      "name",
      "core-idea",
    ]);
    expect(GUIDEBOOK_VISUAL).toEqual(["logo-type", "logo-mark", "color", "typography"]);
    expect(g.lead.map((l) => l.id)).toEqual([...GUIDEBOOK_LEAD]);
    expect(g.foundation.map((i) => i.id)).toEqual([
      "positioning",
      "identity-frame",
      "architecture",
      "name",
      "core-idea",
    ]);
    expect(g.visual.map((i) => i.id)).toEqual(["logo-type", "logo-mark", "color", "typography"]);
  });

  it("has no skipped step, the eight nodes not held, and the method rule-based", () => {
    const g = gb(DONE);
    expect(g.unconfirmed).toEqual([]);
    expect(g.notHeld.join(",")).toBe(W3);
    expect(g.method).toBe("rule-based");
    expect(g.projectName).toBe("คลินิกฟัน");
    expect(g.savedAt).toBe(at);
  });

  it("derives logo type, colour and typography, and holds logo mark out of this version", () => {
    const g = gb(DONE);
    for (const id of ["logo-type", "color", "typography"] as const) {
      expect(itemOf(g, id)).toMatchObject({ status: "done", state: "derived", method: "rule" });
    }
    expect(itemOf(g, "logo-mark")).toEqual({
      id: "logo-mark",
      state: "notInVersion",
      waitingFor: [],
      restsOn: [],
      unchecked: [],
      notes: [{ key: "business.guidebook.notYet.logoMark" }],
      questions: [],
      status: "open",
      method: null,
      rules: [],
      hypothesis: null,
      value: null,
    });
  });

  it("is the same logo mark on every project", () => {
    for (const [, s] of FIXTURES) {
      expect(itemOf(gb(s), "logo-mark")).toEqual(itemOf(gb(DONE), "logo-mark"));
    }
  });
});

describe("every done item carries its value, its method and its labels", () => {
  it("gives the foundation items their methods, rule ids and hypothesis labels", () => {
    const g = gb(DONE);
    expect(g.foundation.map((i) => `${i.id} ${i.status} ${i.state} ${i.method}`)).toEqual([
      "positioning done agreed person",
      "identity-frame done given person",
      "architecture done derived rule",
      "name done given person",
      "core-idea done agreed person",
    ]);
    expect(g.foundation.filter((i) => i.rules.length > 0).map((i) => [i.id, i.rules])).toEqual([
      ["architecture", ["architecture-derive-1"]],
    ]);
    expect(g.foundation.filter((i) => i.hypothesis !== null).map((i) => i.id)).toEqual([
      "identity-frame",
    ]);
    expect(itemOf(g, "identity-frame").hypothesis).toBe("business.identity.hypothesis");
  });

  it("copies the values the view shows, a missing optional answer as null", () => {
    const g = gb(DONE);
    expect(itemOf(g, "positioning").value).toEqual({
      id: "positioning",
      statement: { text: STATEMENT, label: "business.positioning.by.own", modelId: null },
    });
    expect(itemOf(g, "identity-frame").value).toEqual({
      id: "identity-frame",
      person: PERSON,
      never: null,
      axes: [
        { axis: "playful", value: 75, point: 4 },
        { axis: "expressive", value: 75, point: 4 },
        { axis: "structured", value: 75, point: 4 },
        { axis: "warm", value: 75, point: 4 },
        { axis: "premium", value: 75, point: 4 },
      ],
    });
    expect(itemOf(g, "architecture").value).toEqual({
      id: "architecture",
      derived: { key: "business.architecture.single", rule: "architecture-derive-1" },
    });
    expect(itemOf(g, "name").value).toEqual({ id: "name", name: "ORIVILO" });
    expect(itemOf(g, "core-idea").value).toEqual({
      id: "core-idea",
      statement: { text: IDEA_TEXT, label: "business.positioning.by.own" },
      remember: REMEMBER,
    });
  });

  it("shows no mark on any item of the done project", () => {
    for (const i of items(gb(DONE))) {
      expect([i.id, i.restsOn, i.unchecked, i.waitingFor]).toEqual([i.id, [], [], []]);
    }
  });
});

/** The value fields a view node holds for each guidebook value arm, written out by hand. */
function viewValue(node: BusinessView["foundation"][number]): unknown {
  switch (node.id) {
    case "identity-frame":
      return { person: node.person, never: node.never, axes: node.axes };
    case "architecture":
      return { derived: node.value };
    case "name":
      return { name: node.name };
    case "core-idea":
      return { statement: node.statement, remember: node.remember };
    case "logo-type":
      return { decision: node.decision };
    case "color":
      return { decisions: node.decisions, points: node.points };
    case "typography":
      return { faces: node.faces };
  }
}

describe("the guidebook and the board agree", () => {
  it.each(FIXTURES.filter(([, s]) => s !== WITH_READING))(
    "%s: every state, mark and value is the view's",
    (_name, s) => {
      const view = viewOf(s);
      const g = guidebookOf(view);
      for (const node of view.foundation) {
        const item = itemOf(g, node.id);
        expect([item.id, item.state, item.waitingFor, item.restsOn, item.unchecked]).toEqual([
          node.id,
          node.state,
          node.waitingFor,
          node.restsOn,
          node.unchecked,
        ]);
        if (item.status === "done") {
          const { id, ...fields } = item.value;
          expect([id, fields]).toEqual([node.id, viewValue(node)]);
        }
      }
      const positioning = view.nodes.find((n) => n.id === "positioning");
      const item = itemOf(g, "positioning");
      expect(item.state).toBe(positioning?.state);
      if (item.status === "done" && item.value.id === "positioning") {
        expect(item.value.statement).toEqual(view.positioning.statement);
      }
      for (const l of g.lead) {
        expect(l.state).toBe(view.nodes.find((n) => n.id === l.id)?.state);
      }
    },
  );

  it("covers a skipped personality that the marks keep out of 'rests on'", () => {
    const view = viewOf(SKIPPED_STEPS);
    const node = view.foundation.find((n) => n.id === "identity-frame");
    // The result names the skip, the view's line does not: the guidebook copies the line.
    expect(node?.result.provisionalOn).toEqual(["positioning"]);
    expect(node?.restsOn).toEqual([]);
    expect(itemOf(guidebookOf(view), "identity-frame").restsOn).toEqual([]);
  });
});

describe("open stays open", () => {
  it("gives a positioning with no choice its question and no statement, and waits the rest", () => {
    const g = gb(OPEN_FIRST);
    const positioning = itemOf(g, "positioning");
    expect(positioning).toMatchObject({
      status: "open",
      state: "proposed",
      questions: ["business.question.only"],
      value: null,
    });
    for (const id of ["identity-frame", "architecture", "name", "core-idea"] as const) {
      expect(itemOf(g, id)).toMatchObject({
        status: "open",
        state: "waiting",
        waitingFor: ["positioning"],
        value: null,
      });
    }
  });

  it("holds no answer under a waiting architecture and keeps a given name unchecked", () => {
    const g = gb(OPEN_SECOND);
    const architecture = itemOf(g, "architecture");
    expect(architecture).toMatchObject({
      status: "open",
      state: "waiting",
      waitingFor: ["positioning"],
      value: null,
    });
    expect(Object.keys(architecture)).not.toContain("subBrands");
    expect(JSON.stringify(architecture)).not.toContain("subBrands");
    expect(itemOf(g, "name")).toMatchObject({
      status: "done",
      state: "given",
      unchecked: ["positioning"],
    });
  });

  it("waits the three visual items for positioning in both projects", () => {
    for (const s of [OPEN_FIRST, OPEN_SECOND]) {
      const g = gb(s);
      for (const id of ["logo-type", "color", "typography"] as const) {
        expect(itemOf(g, id)).toMatchObject({
          status: "open",
          state: "waiting",
          waitingFor: ["positioning"],
          value: null,
          notes: [],
          questions: [],
        });
      }
    }
  });

  it("carries a value on no open item of any fixture", () => {
    for (const [, s] of FIXTURES) {
      for (const i of items(gb(s))) {
        if (i.status === "open") {
          expect([i.id, i.value, i.method, i.rules, i.hypothesis]).toEqual([
            i.id,
            null,
            null,
            [],
            null,
          ]);
        }
      }
    }
  });
});

describe("a skipped step is listed with what rests on it, and clears once answered", () => {
  it("lists W2 case D: positioning with the seven items resting on it", () => {
    const g = gb(SKIPPED);
    expect(printW2(g)).toBe(
      "positioning=identity-frame:unchecked,architecture:restsOn,name:unchecked,core-idea:unchecked,logo-type:restsOn,color:restsOn,typography:restsOn",
    );
    expect(g.unconfirmed).toEqual([
      {
        id: "positioning",
        questions: ["business.question.only"],
        restingOn: [
          { id: "identity-frame", mark: "unchecked" },
          { id: "architecture", mark: "restsOn" },
          { id: "name", mark: "unchecked" },
          { id: "core-idea", mark: "unchecked" },
          { id: "logo-type", mark: "restsOn" },
          { id: "color", mark: "restsOn" },
          { id: "typography", mark: "restsOn" },
        ],
      },
    ]);
    expect(itemOf(g, "positioning")).toMatchObject({
      state: "skipped",
      status: "open",
      value: null,
    });
  });

  it("lists W2 case A: the partly colour counts as done and rests on the skipped positioning", () => {
    expect(printW2(gb(SKIPPED_FOUNDATION))).toBe(
      "positioning=identity-frame:unchecked,architecture:restsOn,name:unchecked,core-idea:unchecked,color:restsOn",
    );
  });

  it("lists nothing in case E once the positioning is written, and no item keeps a mark", () => {
    const g = gb(DONE);
    expect(printW2(g)).toBe("none");
    expect(g.unconfirmed).toEqual([]);
    for (const i of items(g)) expect([i.id, i.restsOn, i.unchecked]).toEqual([i.id, [], []]);
  });
});

describe("every skipped step the marks see is listed", () => {
  it("lists W2 case B in node number order", () => {
    const g = gb(SKIPPED_STEPS);
    expect(printW2(g)).toBe(
      "positioning=architecture:restsOn,name:unchecked identity-frame=none core-idea=none",
    );
    expect(g.unconfirmed.map((s) => s.id)).toEqual(["positioning", "identity-frame", "core-idea"]);
    expect(g.unconfirmed.map((s) => s.questions)).toEqual([
      ["business.question.only"],
      ["business.question.person", "business.question.never"],
      ["business.question.remember"],
    ]);
    expect(itemOf(g, "identity-frame")).toMatchObject({
      state: "skipped",
      questions: ["business.question.person", "business.question.never"],
      value: null,
    });
    expect(itemOf(g, "core-idea")).toMatchObject({
      state: "skipped",
      questions: ["business.question.remember"],
      value: null,
    });
  });
});

describe("an out-of-date positioning is open, not skipped", () => {
  it("lists W2 case C as empty", () => {
    expect(printW2(gb(STALE))).toBe("none");
  });

  it("holds the stale note, the question and no statement", () => {
    const g = gb(STALE);
    const positioning = itemOf(g, "positioning");
    expect(positioning).toMatchObject({
      status: "open",
      notes: [{ key: "business.positioning.stale" }],
      questions: ["business.question.only"],
      value: null,
    });
    expect(JSON.stringify(positioning)).not.toContain(STATEMENT);
  });

  it("waits the logo type and keeps colour and typography with an unchecked mark", () => {
    const g = gb(STALE);
    expect(itemOf(g, "logo-type")).toMatchObject({
      status: "open",
      state: "waiting",
      waitingFor: ["positioning"],
    });
    for (const id of ["color", "typography"] as const) {
      expect(itemOf(g, id)).toMatchObject({
        status: "done",
        state: "derived",
        unchecked: ["positioning"],
      });
    }
  });
});

describe("what the guidebook does not hold", () => {
  it("is the eight nodes of W3 on every fixture", () => {
    expect(GUIDEBOOK_NOT_HELD.join(",")).toBe(W3);
    for (const [, s] of FIXTURES) expect(gb(s).notHeld.join(",")).toBe(W3);
  });
});

const AI_KEYS = [
  "evidence.fromModel",
  "strategy.draftedOptions",
  "business.positioning.draftedBy",
  "business.positioning.by.picked",
  "business.positioning.by.edited",
  "logo-mark.draftLabel",
];

/** Every string, every key and every `modelId` value of a guidebook's JSON, for T9 and T37. */
const claimsOf = (json: string): { strings: string[]; keys: string[]; modelIds: unknown[] } => {
  const strings: string[] = [];
  const keys: string[] = [];
  const modelIds: unknown[] = [];
  // `faces.reading` is the typography role "reading text", not the model's reading: it is the
  // one `reading` key the guidebook may hold, so its path is told apart.
  const walk = (v: unknown, parent: string): void => {
    if (typeof v === "string") strings.push(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, parent));
    else if (v !== null && typeof v === "object") {
      for (const [k, inner] of Object.entries(v)) {
        keys.push(parent === "faces" ? `faces.${k}` : k);
        if (k === "modelId") modelIds.push(inner);
        walk(inner, k);
      }
    }
  };
  walk(JSON.parse(json), "");
  return { strings, keys, modelIds };
};

describe("no AI label, no claim", () => {
  it.each(FIXTURES)("%s: the data holds no AI key, reading or model id", (_name, s) => {
    const g = gb(s);
    const json = JSON.stringify(g);
    for (const key of AI_KEYS) expect(json).not.toContain(key);
    const { strings, keys, modelIds } = claimsOf(json);
    expect(modelIds.every((m) => m === null)).toBe(true);
    expect(keys).not.toContain("readings");
    expect(keys).not.toContain("reading");
    const lines = [...PROXY_QUESTIONS, ...START_QUESTIONS].flatMap((q) => [q.en, q.th]);
    for (const text of strings) expect(lines).not.toContain(text);
    expect(json).not.toContain(BUSINESS_READ_MODEL);
  });

  it("sees the model reading on the board it copies from", () => {
    const view = viewOf(WITH_READING);
    expect(view.reading).toMatchObject({ status: "model" });
    expect(JSON.stringify(view)).toContain(BUSINESS_READ_MODEL);
  });
});

// ORV-307, T36 and T37 (spec rows 20 and 21). ORV-292's real view: a saved project holding a stored
// draft of three options, run through `toBusinessView`, then `guidebookOf`. Stand-in text and a
// stand-in model id; no model is called.
const DRAFT_INTAKE = { idea: "คั่วเองที่ขายเมล็ดกาแฟ", value: "คั่วสดทุกสัปดาห์" };
const DRAFT_MODEL = "anthropic/claude-sonnet-5.5";
const OPTIONS = [
  "กาแฟคั่วสดสำหรับคนทำงานออฟฟิศ",
  "เมล็ดกาแฟคั่วใหม่ทุกสัปดาห์ถึงโต๊ะคุณ",
  "คั่วเองส่งตรงไม่ผ่านคนกลาง",
] as const;
const EDITED_STATEMENT = "เมล็ดกาแฟคั่วใหม่ถึงโต๊ะคุณทุกสัปดาห์";
const quote = (answer: keyof typeof DRAFT_INTAKE) => ({
  answer,
  start: 0,
  end: DRAFT_INTAKE[answer].length,
  text: DRAFT_INTAKE[answer],
});
const STORED_DRAFT: StoredDraft = {
  id: "d1",
  job: "positioning-draft",
  intakeId: NEWEST,
  modelId: DRAFT_MODEL,
  adapter: { id: "positioning-draft", version: "1" },
  promptVersion: "positioning-prompt-1",
  options: OPTIONS.map((statement) => ({ statement, quotes: [quote("idea"), quote("value")] })),
};
const draftChoice = (kind: "picked" | "edited" | null): StoredChoice | null =>
  kind === null
    ? null
    : {
        id: "c",
        intakeId: NEWEST,
        createdAt: at,
        kind,
        statement: kind === "picked" ? OPTIONS[1] : EDITED_STATEMENT,
        draftId: "d1",
        option: 2,
      };
const draftProject = (kind: "picked" | "edited" | null): SavedBusiness => ({
  project: { id: "p1", name: "คลินิกฟัน", createdAt: at },
  intake: storedIntakeSchema.parse({ version: "intake-1", ...DRAFT_INTAKE }),
  positioning: { intakeId: NEWEST, choice: draftChoice(kind), draft: STORED_DRAFT },
  // No entry while the draft waits, as `OPEN_FIRST`; the whole foundation once an option is chosen.
  foundation: kind === null ? [] : [...FOUNDATION_A, ...VISUAL],
});

describe("a draft is not a decision", () => {
  it("keeps a positioning that waits for a choice open, with no question, no value and no option text", () => {
    const saved = draftProject(null);
    expect(viewOf(saved).positioning.gate).toBe("awaiting-choice");
    const g = gb(saved);
    expect(itemOf(g, "positioning")).toMatchObject({
      status: "open",
      state: "awaitingChoice",
      questions: [],
      notes: [],
      value: null,
    });
    // The foundation items still wait for the positioning, as on a project with no draft.
    for (const id of ["identity-frame", "architecture", "name", "core-idea"] as const) {
      expect(itemOf(g, id)).toMatchObject({
        status: "open",
        state: "waiting",
        waitingFor: ["positioning"],
        value: null,
      });
    }
    const json = JSON.stringify(g);
    for (const option of OPTIONS) expect(json).not.toContain(option);
    expect(json).not.toContain(DRAFT_MODEL);
  });

  it("reads option 2 once picked, with the picked label and the draft's model id, and options 1 and 3 nowhere", () => {
    const g = gb(draftProject("picked"));
    expect(itemOf(g, "positioning")).toMatchObject({
      status: "done",
      method: "ai-draft-picked",
      value: {
        statement: {
          text: OPTIONS[1],
          label: "business.positioning.by.picked",
          modelId: DRAFT_MODEL,
        },
      },
    });
    const json = JSON.stringify(g);
    expect(json).toContain(OPTIONS[1]);
    expect(json).not.toContain(OPTIONS[0]);
    expect(json).not.toContain(OPTIONS[2]);
  });

  it("reads an edited choice with the edited label, the edited statement and the same model id", () => {
    const g = gb(draftProject("edited"));
    expect(itemOf(g, "positioning")).toMatchObject({
      status: "done",
      method: "ai-draft-picked",
      value: {
        statement: {
          text: EDITED_STATEMENT,
          label: "business.positioning.by.edited",
          modelId: DRAFT_MODEL,
        },
      },
    });
    const json = JSON.stringify(g);
    for (const option of OPTIONS) expect(json).not.toContain(option);
  });
});

describe("no AI label, the one exception", () => {
  const ROW_20: Array<[string, SavedBusiness, string | null]> = [
    ["a draft that waits for a choice", draftProject(null), null],
    ["option 2 picked", draftProject("picked"), "business.positioning.by.picked"],
    ["option 2 edited", draftProject("edited"), "business.positioning.by.edited"],
  ];

  it.each(ROW_20)(
    "%s: T9's checks hold, bar the label and model id of the picked statement",
    (_name, s, label) => {
      const json = JSON.stringify(gb(s));
      // The exception is exactly one label and one model id, on the positioning statement.
      expect(json.split(DRAFT_MODEL).length - 1).toBe(label === null ? 0 : 1);
      for (const key of AI_KEYS) {
        expect(json.split(key).length - 1).toBe(key === label ? 1 : 0);
      }
      const rest = JSON.parse(json) as {
        foundation: Array<{ id: string; value: { statement?: Record<string, unknown> } | null }>;
      };
      const statement = rest.foundation.find((i) => i.id === "positioning")?.value?.statement;
      if (label !== null) {
        expect(statement).toMatchObject({ label, modelId: DRAFT_MODEL });
        delete statement?.label;
        delete statement?.modelId;
      }
      const bare = JSON.stringify(rest);
      for (const key of AI_KEYS) expect(bare).not.toContain(key);
      expect(bare).not.toContain(DRAFT_MODEL);
      expect(bare).not.toContain(BUSINESS_READ_MODEL);
      const { strings, keys, modelIds } = claimsOf(bare);
      expect(modelIds.every((m) => m === null)).toBe(true);
      expect(keys).not.toContain("readings");
      expect(keys).not.toContain("reading");
      const lines = [...PROXY_QUESTIONS, ...START_QUESTIONS].flatMap((q) => [q.en, q.th]);
      for (const text of strings) expect(lines).not.toContain(text);
    },
  );
});

/** Strips `/* *\/` and `//` comments, as `business-read.test.ts` does. */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

/**
 * The module specifiers of the source, by every syntax form: a single-line import, a multi-line
 * import, an `export ... from`, a side-effect import and a dynamic `import()`.
 */
const FROM_FORM = /\b(?:import|export)\b[^;"'`]*?\bfrom\s*["'`]([^"'`]+)["'`]/g;
const SIDE_EFFECT_FORM = /\bimport\s*["'`]([^"'`]+)["'`]/g;
const DYNAMIC_FORM = /\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
const specifiersOf = (code: string): string[] => {
  const bare = stripComments(code);
  return [FROM_FORM, SIDE_EFFECT_FORM, DYNAMIC_FORM].flatMap((form) =>
    [...bare.matchAll(form)].map((m) => m[1] ?? ""),
  );
};

/** The names ORV-302 G2 forbids the module to call, and the clock, random and environment tokens. */
const RULE_CALLS = [
  "toBusinessView",
  "foundationLines",
  "expressionLines",
  "foundationState",
  "foundationRoots",
  "foundationMarks",
  "propagateMarks",
  "positioningGate",
  "nodeStates",
  "expressionOf",
  "colorOf",
  "typographyOf",
  "logoTypeOf",
];
const FORBIDDEN: Array<[string, RegExp]> = [
  ["Date", /\bDate\b/],
  ["Math.random", /\bMath\s*\.\s*random\b/],
  ["process.env", /\bprocess\s*\.\s*env\b/],
  ["performance", /\bperformance\b/],
  ...RULE_CALLS.map((name): [string, RegExp] => [
    `a call to ${name}`,
    new RegExp(`\\b${name}\\s*\\(`),
  ]),
];
const forbiddenIn = (code: string): string[] =>
  FORBIDDEN.filter(([, re]) => re.test(stripComments(code))).map(([name]) => name);
const MODEL_MODULE = /openrouter|llm-interpreter/;

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object") {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
};

describe("pure: no model, no clock", () => {
  it("imports exactly the six modules of the tech notes, expression as types only", () => {
    expect([...new Set(specifiersOf(guidebookSource))].sort()).toEqual([
      "../knowledge",
      "./expression",
      "./foundation",
      "./foundation-marks",
      "./place",
      "./view",
    ]);
    expect(specifiersOf(guidebookSource).some((s) => MODEL_MODULE.test(s))).toBe(false);
    expect(guidebookSource).toMatch(/import type \{[^}]*\} from "\.\/expression";/);
    expect(guidebookSource).not.toMatch(/import \{[^}]*\} from "\.\/expression";/);
  });

  it("holds no clock, random source, environment or call of the rules the board runs", () => {
    expect(forbiddenIn(guidebookSource)).toEqual([]);
  });

  it("gives a deep-equal result twice from a deep-frozen view", () => {
    for (const [, s] of FIXTURES) {
      const view = deepFreeze(viewOf(s));
      expect(guidebookOf(view)).toStrictEqual(guidebookOf(view));
    }
  });

  // The guard of the import ban, one failing sample of each syntax form (L-0024).
  it.each([
    ["a single-line import", 'import { AI_MODELS } from "../openrouter";'],
    ["a multi-line import", 'import {\n  AI_MODELS,\n} from "../openrouter";'],
    ["a side-effect import", 'import "../llm-interpreter";'],
    ["a dynamic import()", 'const m = await import("../openrouter");'],
    ["an export ... from", 'export { AI_MODELS } from "../openrouter";'],
    ["an export * from", 'export * from "../llm-interpreter";'],
  ])("the import guard flags %s", (_form, code) => {
    expect(specifiersOf(code).some((s) => MODEL_MODULE.test(s))).toBe(true);
  });

  it.each([
    ["Date.now()", "const t = Date.now();", "Date"],
    ["new Date(", "const t = new Date();", "Date"],
    ["Math.random()", "const x = Math.random();", "Math.random"],
    ["process.env", "const k = process.env.KEY;", "process.env"],
    ["performance.now()", "const t = performance.now();", "performance"],
    ["foundationMarks(", "const r = foundationMarks(a, b);", "a call to foundationMarks"],
    ["colorOf(", "const c = colorOf(newest);", "a call to colorOf"],
  ])("the token guard flags %s", (_form, code, name) => {
    expect(forbiddenIn(code)).toContain(name);
  });

  it("the guards ignore a comment that names a blocked import or call", () => {
    const code = '// import { X } from "../openrouter";\n/* Date.now() colorOf(x) */ const y = 1;';
    expect(specifiersOf(code)).toEqual([]);
    expect(forbiddenIn(code)).toEqual([]);
  });
});

describe("an empty value answer", () => {
  it("shows the board's skipped line with its question and lists no step", () => {
    const view = viewOf(EMPTY_VALUE);
    // The board says skipped (node-state-1) while the marks count positioning open, not skipped.
    expect(view.nodes.find((n) => n.id === "positioning")?.state).toBe("skipped");
    expect(view.positioning.skipped).toBe(false);
    const g = guidebookOf(view);
    expect(itemOf(g, "positioning")).toMatchObject({
      status: "open",
      state: "skipped",
      questions: ["business.question.only"],
      value: null,
    });
    expect(g.unconfirmed).toEqual([]);
    for (const id of ["identity-frame", "architecture", "name", "core-idea"] as const) {
      expect(itemOf(g, id)).toMatchObject({ state: "waiting", waitingFor: ["positioning"] });
    }
  });
});

describe("keys and values only", () => {
  it.each(FIXTURES)("%s: survives a JSON round trip and holds every member", (_name, s) => {
    const g = gb(s);
    expect(JSON.parse(JSON.stringify(g))).toStrictEqual(g);
    const missing: string[] = [];
    const walk = (v: unknown, path: string): void => {
      if (v === undefined) missing.push(path);
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}.${i}`));
      else if (v !== null && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
      }
    };
    walk(g, "guidebook");
    expect(missing).toEqual([]);
  });
});

describe("question keys are ORV-126's", () => {
  const listed = new Set<string>([...PROXY_QUESTIONS, ...START_QUESTIONS].map((q) => q.key));
  it("takes each foundation key from the proxy or start questions", () => {
    for (const id of GUIDEBOOK_FOUNDATION) {
      for (const key of GUIDEBOOK_QUESTIONS[id]) expect(listed.has(key), `${id} ${key}`).toBe(true);
    }
    expect([...GUIDEBOOK_QUESTIONS.name, ...GUIDEBOOK_QUESTIONS["logo-mark"]]).toEqual([]);
  });

  // The three visual keys are catalog keys of ORV-298, not in the proxy or start lists; the engine
  // cannot read the en and th catalogs, so their presence there is the screen task's check (A2).
  it("names the three visual keys exactly, each a business.question key", () => {
    const visual = [
      ...GUIDEBOOK_QUESTIONS["logo-type"],
      ...GUIDEBOOK_QUESTIONS.color,
      ...GUIDEBOOK_QUESTIONS.typography,
    ];
    expect(visual).toEqual([
      "business.question.appIcon",
      "business.question.lineup",
      "business.question.scripts",
    ]);
    for (const key of visual)
      expect(listed.has(key) || /^business\.question\.\w+$/.test(key)).toBe(true);
  });
});

describe("visual items carry their decisions", () => {
  const g = gb(DONE);

  it("holds the decisions of W4 case 1, W6 and W7 with their rule ids", () => {
    expect(itemOf(g, "logo-type")).toMatchObject({
      method: "rule",
      rules: ["logo-type-1"],
      hypothesis: "business.logoType.hypothesis",
      value: {
        id: "logo-type",
        decision: {
          type: "wordmark",
          reasons: ["wordmark"],
          rule: "logo-type-1",
          name: "ORIVILO",
          length: 7,
          max: 12,
        },
      },
    });
    expect(itemOf(g, "color")).toMatchObject({
      method: "rule",
      rules: ["color.signature.lime-warm", "color.neutral.warm", "color.canvas.soft"],
      hypothesis: "business.color.hypothesis",
      value: {
        id: "color",
        decisions: {
          signature: { value: "lime", rule: "color.signature.lime-warm" },
          neutral: { value: "warm", rule: "color.neutral.warm" },
          canvas: { value: "soft", rule: "color.canvas.soft" },
        },
        points: { expressive: 4, warm: 4, premium: 4 },
      },
    });
    const typography = itemOf(g, "typography");
    expect(typography).toMatchObject({
      method: "rule",
      rules: [TYPOGRAPHY_RULE],
      hypothesis: "business.typography.noPersonalityLink",
    });
    expect(typography.status === "done" && typography.value.id === "typography").toBe(true);
    if (typography.status === "done" && typography.value.id === "typography") {
      const { reading, display } = typography.value.faces;
      expect(reading.map((f) => f.family)).toEqual(["Sarabun", "Inter"]);
      expect(display.map((f) => f.family)).toEqual(["Anuphan", "Inter"]);
    }
    expect(TYPOGRAPHY_RULE).toBe("typography-node-1");
  });

  it("equals the view's state on each of the three items", () => {
    const view = viewOf(DONE);
    for (const node of view.foundation.filter((n) =>
      ["logo-type", "color", "typography"].includes(n.id),
    )) {
      expect(itemOf(g, node.id).state).toBe(node.state);
    }
  });

  it("holds no lineup, no crowded family, no competitor name and no colour value", () => {
    const json = JSON.stringify(g);
    expect(json).not.toContain("lineup");
    expect(json).not.toContain("crowded");
    expect(json).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    for (const row of STAND_IN_LINEUP) {
      expect(json).not.toContain(row.name);
      expect(json).not.toContain(row.hex);
    }
  });

  it("gives the wordmark's other answers their reasons and the other scripts their faces", () => {
    const longName = gb(
      project("agreed", [...FOUNDATION_A.slice(0, 2), NAME("ORIVILO-ORIVILO-X"), LOGO_TYPE(true)]),
    );
    expect(itemOf(longName, "logo-type")).toMatchObject({
      status: "done",
      value: { decision: { type: "symbol-plus-name", reasons: ["longName", "appIcon"] } },
    });
    const latin = gb(project("agreed", [...FOUNDATION_A, TYPOGRAPHY("latin")]));
    expect(itemOf(latin, "typography").rules).toEqual(["typography-node-1"]);
  });
});

describe("visual items that wait", () => {
  const g = gb(WAITING_VISUAL);

  it("gives colour a partly state with two decisions, its note and its question", () => {
    const color = itemOf(g, "color");
    expect(color).toMatchObject({
      status: "done",
      state: "partly",
      method: "rule",
      rules: ["color.neutral.warm", "color.canvas.soft"],
      notes: [{ key: "business.color.waitsForLineup" }],
      questions: ["business.question.lineup"],
      value: {
        id: "color",
        decisions: {
          signature: null,
          neutral: { value: "warm", rule: "color.neutral.warm" },
          canvas: { value: "soft", rule: "color.canvas.soft" },
        },
      },
    });
  });

  it("opens typography with the scripts question and no family", () => {
    expect(itemOf(g, "typography")).toMatchObject({
      status: "open",
      state: "needsAnswer",
      questions: ["business.question.scripts"],
      value: null,
    });
  });

  it("waits the logo type for the name and shows no app icon question", () => {
    expect(itemOf(g, "logo-type")).toMatchObject({
      status: "open",
      state: "waiting",
      waitingFor: ["name"],
      questions: [],
      value: null,
    });
  });

  it("asks the app icon only while the view offers the answer", () => {
    const view = viewOf(project("agreed", [...FOUNDATION_A]));
    expect(itemOf(guidebookOf(view), "logo-type")).toMatchObject({
      state: "needsAnswer",
      questions: ["business.question.appIcon"],
    });
    // A view that no longer offers the answer: a hand-edited copy, the one hand-built view here.
    const refused: BusinessView = {
      ...view,
      foundation: view.foundation.map((n) => (n.id === "logo-type" ? { ...n, controls: [] } : n)),
    };
    expect(itemOf(guidebookOf(refused), "logo-type").questions).toEqual([]);
  });

  it("holds the colour's open notes in their order, none while it waits", () => {
    const view = viewOf(WAITING_VISUAL);
    const color = view.foundation.find((n) => n.id === "color");
    if (color?.id !== "color") throw new Error("the node color");
    const noted = (patch: Partial<typeof color>): GuidebookItem =>
      itemOf(
        guidebookOf({
          ...view,
          foundation: view.foundation.map((n) => (n.id === "color" ? { ...color, ...patch } : n)),
        }),
        "color",
      );
    expect(
      noted({
        needsPersonality: true,
        notDecided: true,
        signatureOpen: { why: "bothCrowded", first: "lime", second: "cyan" },
      }).notes,
    ).toEqual([
      { key: "business.color.needsPersonality" },
      { key: "business.color.bothCrowded", first: "lime", second: "cyan" },
      { key: "business.color.notDecided" },
    ]);
    expect(
      noted({
        needsPersonality: true,
        notDecided: true,
        state: "waiting",
        waitingFor: ["identity-frame"],
      }),
    ).toMatchObject({ notes: [], questions: [], state: "waiting", status: "open" });
  });
});

describe("a skipped step reaches the visual items", () => {
  it("gives W2 case D logo type, colour and typography derived and resting on positioning", () => {
    const g = gb(SKIPPED);
    for (const id of ["logo-type", "color", "typography"] as const) {
      expect(itemOf(g, id)).toMatchObject({
        status: "done",
        state: "derived",
        restsOn: ["positioning"],
        unchecked: [],
      });
    }
  });

  it("counts a partly colour as done and lists it under the skipped step", () => {
    const g = gb(SKIPPED_PARTLY);
    expect(itemOf(g, "color")).toMatchObject({
      status: "done",
      state: "partly",
      restsOn: ["positioning"],
    });
    expect(g.unconfirmed[0]?.restingOn).toContainEqual({ id: "color", mark: "restsOn" });
  });
});

describe("the closed lists and the done states", () => {
  it("fixes the done states, the hypothesis labels and the question table", () => {
    expect([...DONE_STATES]).toEqual(["agreed", "given", "derived", "partly"]);
    expect(GUIDEBOOK_HYPOTHESIS).toEqual({
      "identity-frame": "business.identity.hypothesis",
      "logo-type": "business.logoType.hypothesis",
      color: "business.color.hypothesis",
      typography: "business.typography.noPersonalityLink",
    });
    expect(GUIDEBOOK_QUESTIONS).toEqual({
      positioning: ["business.question.only"],
      "identity-frame": ["business.question.person", "business.question.never"],
      architecture: ["business.question.subBrands"],
      name: [],
      "core-idea": ["business.question.remember"],
      "logo-type": ["business.question.appIcon"],
      "logo-mark": [],
      color: ["business.question.lineup"],
      typography: ["business.question.scripts"],
    });
  });

  it("marks an architecture answered yes as not in this version, with its note", () => {
    const g = gb(project("agreed", [ARCHITECTURE(true)]));
    expect(itemOf(g, "architecture")).toMatchObject({
      status: "open",
      state: "notInVersion",
      notes: [{ key: "business.architecture.notInVersion" }],
      questions: [],
      value: null,
    });
  });
});

describe("the lines of an open item, clause by clause", () => {
  it("asks the questions of an item that waits for the person with nothing given", () => {
    const asked = (g: Guidebook, ids: GuidebookItem["id"][]) =>
      ids.map((id) => [id, itemOf(g, id).state, itemOf(g, id).questions]);
    // The name and the core idea wait on the architecture and the personality, so they need them.
    expect(asked(gb(project("agreed", [])), ["identity-frame", "architecture"])).toEqual([
      ["identity-frame", "empty", ["business.question.person", "business.question.never"]],
      ["architecture", "empty", ["business.question.subBrands"]],
    ]);
    expect(
      asked(gb(project("agreed", [PERSONALITY(), ARCHITECTURE(false)])), ["name", "core-idea"]),
    ).toEqual([
      ["name", "empty", []],
      ["core-idea", "empty", ["business.question.remember"]],
    ]);
  });

  it("asks and notes nothing on a done item, bar the open lines of a partly colour", () => {
    for (const [, s] of FIXTURES) {
      for (const i of items(gb(s))) {
        if (i.status === "done" && i.state !== "partly") {
          expect([i.id, i.questions, i.notes]).toEqual([i.id, [], []]);
        }
      }
    }
  });

  it("asks nothing of a positioning that waits for a choice, in a hand-edited view", () => {
    // `toBusinessView` gives awaitingChoice from a stored draft (T36 proves it over the real view);
    // this copy keeps the state for a view with no draft, so the item's own rule is proven alone.
    const view = viewOf(OPEN_FIRST);
    const waiting: BusinessView = {
      ...view,
      nodes: view.nodes.map((n) =>
        n.id === "positioning" ? { ...n, state: "awaitingChoice" } : n,
      ),
    };
    expect(itemOf(guidebookOf(waiting), "positioning")).toMatchObject({
      status: "open",
      state: "awaitingChoice",
      questions: [],
      notes: [],
      value: null,
    });
  });

  it("reads a picked or edited positioning as a draft the person chose", () => {
    for (const kind of ["picked", "edited"] as const) {
      const saved: SavedBusiness = {
        ...DONE,
        positioning: {
          intakeId: NEWEST,
          choice: {
            id: "c",
            intakeId: NEWEST,
            createdAt: at,
            kind,
            statement: STATEMENT,
            draftId: "d1",
            option: 1,
          },
        },
      };
      const positioning = itemOf(gb(saved), "positioning");
      expect(positioning).toMatchObject({
        status: "done",
        method: "ai-draft-picked",
        value: { statement: { label: `business.positioning.by.${kind}` } },
      });
    }
  });
});

describe("a view that breaks its own invariants", () => {
  it("throws a closed message with an id and no value when a node is missing", () => {
    const view = viewOf(DONE);
    expect(() =>
      guidebookOf({ ...view, nodes: view.nodes.filter((n) => n.id !== "audience") }),
    ).toThrow("guidebook: the view has no audience");
    expect(() =>
      guidebookOf({ ...view, nodes: view.nodes.filter((n) => n.id !== "positioning") }),
    ).toThrow("guidebook: the view has no positioning");
    expect(() =>
      guidebookOf({ ...view, foundation: view.foundation.filter((n) => n.id !== "name") }),
    ).toThrow("guidebook: the view has no name");
  });

  it("throws a closed message when a done item has no value", () => {
    const view = viewOf(DONE);
    const without = (id: string, patch: Record<string, unknown>): BusinessView => ({
      ...view,
      foundation: view.foundation.map((n) => (n.id === id ? ({ ...n, ...patch } as typeof n) : n)),
    });
    expect(() => guidebookOf(without("name", { name: null }))).toThrow(
      "guidebook: a done name has no value",
    );
    expect(() => guidebookOf(without("logo-type", { decision: null }))).toThrow(
      "guidebook: a done logo-type has no value",
    );
    expect(() =>
      guidebookOf({ ...view, positioning: { ...view.positioning, statement: null } }),
    ).toThrow("guidebook: a done positioning has no value");
  });
});
