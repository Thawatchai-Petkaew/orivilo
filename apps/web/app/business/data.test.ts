import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { modelReading, readBusiness, ruleBasedReading } from "@orivilo/intent-engine";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-283 C4: the page loader passes the saved reading of the newest intake into the view, and
// opening never calls a model. A stored reading that no longer parses opens with no reading; an
// intake row that no longer parses reads as the page's one 404 (ORV-287).
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("../../server/auth", () => ({
  accessDeps: () => ({}),
  auth: () => ({
    api: {
      getSession: async () => ({
        user: { id: "u1", email: "reader@example.com" },
        session: { activeOrganizationId: "ws-a" },
      }),
    },
  }),
}));
const state = vi.hoisted(() => ({
  reading: null as unknown,
  throws: null as unknown,
  choice: null as unknown,
  foundation: [] as unknown[],
  /** Every write a service was asked for; opening a project asks for none. */
  writes: [] as string[],
  limitsConsumed: 0,
}));
// Opening a project counts no limit (ORV-291 rows 12 and 36).
vi.mock("../../server/rate-limit", () => ({
  subjectFromHeaders: () => "ip-1",
  limiter: () => ({
    async consume() {
      state.limitsConsumed += 1;
      return { ok: true };
    },
  }),
}));
const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

const PROJECT = "11111111-1111-4111-8111-111111111111";
const INTAKE = "22222222-2222-4222-8222-222222222222";
const SAVED = new Date("2026-11-18T03:15:00Z");
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  return {
    ...real,
    foundationService: () => ({
      async enter() {
        state.writes.push("foundation.enter");
      },
    }),
    positioningService: () => ({
      async choose() {
        state.writes.push("positioning.choose");
      },
    }),
    businessService: () => ({
      async create() {
        state.writes.push("business.create");
      },
      async saveReading() {
        state.writes.push("business.saveReading");
      },
      async open() {
        if (state.throws !== null) throw state.throws;
        return {
          project: { id: PROJECT, name: "Shop", createdAt: SAVED },
          intakeId: INTAKE,
          intake: { version: "intake-1", idea: "Roasted coffee for office workers" },
          savedAt: SAVED,
          reading: state.reading,
          positioning: { intakeId: INTAKE, choice: state.choice },
          foundation: state.foundation,
        };
      },
    }),
  };
});

const { loadProject } = await import("./data");

const record = async () => {
  const { items } = await readBusiness(
    {
      intake: { idea: "Roasted coffee for office workers" },
      intakeId: INTAKE,
      savedAt: SAVED.toISOString(),
    },
    {
      complete: async () =>
        JSON.stringify({
          readings: [
            {
              field: "audience.customers",
              value: "Office workers",
              quotes: [{ answer: "idea", text: "office workers" }],
            },
          ],
        }),
      sha256Text: (text) => createHash("sha256").update(text, "utf8").digest("hex"),
      model: "test/model",
    },
  );
  return modelReading(INTAKE, "test/model", items);
};

let capture: ReturnType<typeof captureLines>;
beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", "reader@example.com");
  state.reading = null;
  state.throws = null;
  state.choice = null;
  state.foundation = [];
  state.writes = [];
  state.limitsConsumed = 0;
  fetchSpy.mockClear();
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("loadProject and the saved reading", () => {
  it("gives a view with no reading when none was saved", async () => {
    const loaded = await loadProject(PROJECT);
    expect(loaded).toMatchObject({ access: "ready", view: { reading: { status: "none" } } });
  });

  it("passes a saved model reading into the view, with its readings under their field", async () => {
    state.reading = await record();
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.reading).toEqual({ status: "model", modelId: "test/model" });
    const field = loaded.view.nodes
      .flatMap((n) => n.fields)
      .find((f) => f.field === "audience.customers");
    expect(field?.readings.map((r) => r.value)).toEqual(["Office workers"]);
    // Opening reads a row and calls no model.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes a saved rule-based record into the view with its reason", async () => {
    state.reading = ruleBasedReading(INTAKE, "ai-rate-limited");
    const loaded = await loadProject(PROJECT);
    expect(loaded).toMatchObject({
      access: "ready",
      view: { reading: { status: "rule-based", reason: "ai-rate-limited" } },
    });
  });

  // `orv287-unparsed-reading-1`: `open` answers a reading that no longer parses with `reading: null`
  // (proved at the service, `business.integration.test.ts`); the loader shows what it shows for a
  // project that has no reading, and its boundary line is `ok`.
  it("a stored reading that no longer parses opens with no reading", async () => {
    state.reading = null;
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.reading).toEqual({ status: "none" });
    // The person's own words are in the view, and no field carries a reading.
    expect(loaded.view.nodes.flatMap((n) => n.fields).flatMap((f) => f.readings)).toEqual([]);
    expect(JSON.stringify(loaded.view.nodes)).toContain("Roasted coffee for office workers");
    expect(fetchSpy).not.toHaveBeenCalled();
    const lines = capture.lines.map((line) => expectLineShape(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ level: "info", outcome: "ok" });
  });

  it("answers the page's one 404 for an intake row that no longer parses, with an error line", async () => {
    const { BusinessError } = await import("@orivilo/auth");
    state.throws = new BusinessError("invalid-stored");
    expect(await loadProject(PROJECT)).toEqual({ access: "not-found" });
    const lines = capture.lines.map((line) => expectLineShape(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ level: "error", outcome: "failed", reason: "failed" });
  });

  it("answers not-found with a refusal line for a project the service does not find", async () => {
    const { BusinessError } = await import("@orivilo/auth");
    state.throws = new BusinessError("not-found");
    expect(await loadProject(PROJECT)).toEqual({ access: "not-found" });
    const lines = capture.lines.map((line) => expectLineShape(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ level: "info", outcome: "refused", reason: "not-found" });
  });
});

// ORV-285: the loader passes the newest intake's id and the project's newest choice into the view.
describe("loadProject and the positioning choice", () => {
  const choice = (over: Record<string, unknown>) => ({
    id: "c-1",
    intakeId: INTAKE,
    kind: "written",
    statement: "Fresh roasted coffee for office workers",
    draftId: null,
    option: null,
    createdAt: "2026-11-18T04:00:00.000Z",
    ...over,
  });

  it("gives an open gate with the own controls when no choice was made", async () => {
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.positioning).toMatchObject({
      gate: "open",
      skipped: false,
      stale: false,
      statement: null,
      controls: ["writeOwn", "skip"],
    });
  });

  it("gives a given gate and the statement for a written choice on the newest intake", async () => {
    state.choice = choice({});
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.positioning).toMatchObject({
      gate: "given",
      stale: false,
      statement: {
        text: "Fresh roasted coffee for office workers",
        label: "business.positioning.by.own",
      },
      controls: [],
    });
    expect(loaded.view.nodes.find((n) => n.id === "positioning")).toMatchObject({
      state: "agreed",
      gatePassed: true,
    });
  });

  it("gives an open gate with the stale note for a choice made on an older intake", async () => {
    state.choice = choice({ intakeId: "44444444-4444-4444-8444-444444444444" });
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.positioning).toMatchObject({
      gate: "open",
      stale: true,
      statement: { label: "business.positioning.stale" },
    });
  });

  it("gives a skipped open gate for a skip on the newest intake, and calls no model", async () => {
    state.choice = choice({ kind: "skipped", statement: null });
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.positioning).toMatchObject({
      gate: "open",
      skipped: true,
      controls: ["writeOwn"],
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ORV-291 T19, row 12: the loader passes the project's foundation entries into the view, and
// opening writes nothing, counts no limit and calls no model.
describe("foundation replay", () => {
  const AXES = { playful: 75, expressive: 75, structured: 75, warm: 75, premium: 75 };
  const agreed = {
    id: "c-1",
    intakeId: INTAKE,
    kind: "written",
    statement: "Fresh roasted coffee for office workers",
    draftId: null,
    option: null,
    createdAt: "2026-11-18T04:00:00.000Z",
  };
  const given = {
    id: "e-1",
    node: "identity-frame",
    kind: "given",
    payload: { axes: AXES, person: "warm, plain, caring" },
    createdAt: "2026-11-18T05:00:00.000Z",
  };

  it("loaded twice a day apart gives the same view, and writes nothing, counts no limit, calls no model", async () => {
    state.choice = agreed;
    state.foundation = [given];
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T03:00:00Z"));
    const first = await loadProject(PROJECT);
    vi.setSystemTime(new Date("2026-11-20T03:00:00Z"));
    const second = await loadProject(PROJECT);
    if (first.access !== "ready" || second.access !== "ready") throw new Error("not ready");
    expect(second).toEqual(first);
    // The entry reached the view: Brand personality is given, with the axes as 4 of 5.
    expect(first.view.foundation[0]).toMatchObject({
      id: "identity-frame",
      state: "given",
      person: "warm, plain, caring",
      axes: expect.arrayContaining([{ axis: "warm", value: 75, point: 4 }]),
      controls: [],
    });
    expect(state.writes).toEqual([]);
    expect(state.limitsConsumed).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("gives Brand personality as waiting, with both controls hidden, while positioning is open", async () => {
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.foundation[0]).toMatchObject({
      id: "identity-frame",
      state: "waiting",
      waitingFor: ["positioning"],
      controls: [],
    });
  });

  it("gives Brand personality both controls once positioning is agreed and no entry exists", async () => {
    state.choice = agreed;
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.foundation[0]).toMatchObject({
      id: "identity-frame",
      state: "empty",
      controls: ["describe", "skip"],
    });
  });
});

// ORV-296 T40, row 36: the replay with an entry on every one of the four nodes.
describe("foundation replay, all four", () => {
  const AXES = { playful: 75, expressive: 75, structured: 75, warm: 75, premium: 75 };
  const agreed = {
    id: "c-1",
    intakeId: INTAKE,
    kind: "written",
    statement: "Fresh roasted coffee for office workers",
    draftId: null,
    option: null,
    createdAt: "2026-11-18T04:00:00.000Z",
  };
  const entries = () => [
    {
      id: "e-1",
      node: "identity-frame",
      kind: "given",
      payload: { axes: AXES, person: "warm, plain, caring" },
      createdAt: "2026-11-18T05:00:00.000Z",
    },
    {
      id: "e-2",
      node: "architecture",
      kind: "answered",
      payload: { subBrands: false },
      createdAt: "2026-11-18T05:10:00.000Z",
    },
    {
      id: "e-3",
      node: "name",
      kind: "given",
      payload: { name: "ORIVILO" },
      createdAt: "2026-11-18T05:20:00.000Z",
    },
    {
      id: "e-4",
      node: "core-idea",
      kind: "written",
      payload: { statement: "ทำให้ทุกเช้าง่ายขึ้น", remember: "กาแฟที่ส่งถึงบ้านทันเวลา" },
      createdAt: "2026-11-18T05:30:00.000Z",
    },
  ];

  it("loaded twice a day apart gives the same view and marks, and writes nothing, counts no limit, calls no model", async () => {
    state.choice = agreed;
    state.foundation = entries();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T03:00:00Z"));
    const first = await loadProject(PROJECT);
    vi.setSystemTime(new Date("2026-11-20T03:00:00Z"));
    const second = await loadProject(PROJECT);
    if (first.access !== "ready" || second.access !== "ready") throw new Error("not ready");
    expect(second).toEqual(first);
    expect(first.view.foundation.map((n) => [n.id, n.state])).toEqual([
      ["identity-frame", "given"],
      ["architecture", "derived"],
      ["name", "given"],
      ["core-idea", "agreed"],
    ]);
    expect(first.view.foundation[3]).toMatchObject({
      id: "core-idea",
      gate: "given",
      gatePassed: true,
      statement: { text: "ทำให้ทุกเช้าง่ายขึ้น", label: "business.positioning.by.own" },
      remember: "กาแฟที่ส่งถึงบ้านทันเวลา",
      unchecked: [],
      controls: [],
    });
    expect(state.writes).toEqual([]);
    expect(state.limitsConsumed).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("derives the architecture value on each load and stores none: the saved rows are untouched", async () => {
    state.choice = agreed;
    state.foundation = entries();
    const before = JSON.stringify(state.foundation);
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.foundation[1]).toMatchObject({
      id: "architecture",
      value: { key: "business.architecture.single", rule: "architecture-derive-1" },
    });
    expect(JSON.stringify(state.foundation)).toBe(before);
    expect(JSON.stringify(state.foundation)).not.toContain("business.architecture.single");
    expect(state.writes).toEqual([]);
  });

  it("with positioning gone stale the marks follow the same rule and nothing is written", async () => {
    state.choice = { ...agreed, intakeId: "33333333-3333-4333-8333-333333333333" };
    state.foundation = entries();
    const loaded = await loadProject(PROJECT);
    if (loaded.access !== "ready") throw new Error("not ready");
    expect(loaded.view.foundation[3]).toMatchObject({
      state: "agreed",
      unchecked: ["positioning"],
      controls: [],
    });
    expect(loaded.view.foundation[1]).toMatchObject({ state: "waiting" });
    expect(state.writes).toEqual([]);
    expect(state.limitsConsumed).toBe(0);
  });
});
