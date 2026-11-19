import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { modelReading, readBusiness, ruleBasedReading } from "@orivilo/intent-engine";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-283 C4: the page loader passes the saved reading of the newest intake into the view, and
// opening never calls a model. A stored reading that no longer parses reads as the page's one 404.
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
  /** The stored draft of the newest intake, with the intake's answers it quotes. */
  draft: null as unknown,
  value: undefined as string | undefined,
  /** Every call that reads or writes beside `open`: a limit, the cap, a save of a choice or a draft. */
  beside: [] as string[],
}));
const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);
vi.mock("../../server/rate-limit", () => ({
  subjectFromHeaders: () => "ip-1",
  limiter: () => ({
    async consume() {
      state.beside.push("limit");
      return { ok: true };
    },
  }),
}));
vi.mock("../../server/spend-cap", () => ({
  spendCap: () => ({
    async check() {
      state.beside.push("spend-cap");
      return { ok: false, reason: "unavailable" };
    },
    async record() {
      state.beside.push("usage");
    },
  }),
}));

const PROJECT = "11111111-1111-4111-8111-111111111111";
const INTAKE = "22222222-2222-4222-8222-222222222222";
const SAVED = new Date("2026-11-18T03:15:00Z");
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  return {
    ...real,
    businessService: () => ({
      async open() {
        if (state.throws !== null) throw state.throws;
        return {
          project: { id: PROJECT, name: "Shop", createdAt: SAVED },
          intakeId: INTAKE,
          intake: {
            version: "intake-1",
            idea: "Roasted coffee for office workers",
            ...(state.value === undefined ? {} : { value: state.value }),
          },
          savedAt: SAVED,
          reading: state.reading,
          positioning: { intakeId: INTAKE, choice: state.choice, draft: state.draft },
        };
      },
    }),
    positioningService: () => ({
      async choose() {
        state.beside.push("choose");
        return { kind: "skipped" };
      },
      async saveDraft() {
        state.beside.push("save-draft");
        return { draftId: "x" };
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
  state.draft = null;
  state.value = undefined;
  state.beside = [];
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

  it("answers the page's one 404 for a stored reading that no longer parses, with an error line", async () => {
    const { BusinessError } = await import("@orivilo/auth");
    state.throws = new BusinessError("invalid-stored");
    expect(await loadProject(PROJECT)).toEqual({ access: "not-found" });
    const lines = capture.lines.map((line) => expectLineShape(line));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ level: "error", outcome: "failed", reason: "failed" });
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

// T37, row 22 (ORV-292): opening a project with a stored draft and a choice replays them. The loader
// calls no model, counts no limit, checks no cap and writes nothing, whatever the time.
describe("replay, never re-draft", () => {
  const VALUE = "Fresh beans every week";
  const draft = {
    id: "55555555-5555-4555-8555-555555555555",
    job: "positioning-draft",
    intakeId: INTAKE,
    modelId: "anthropic/claude-sonnet-5.5",
    adapter: { id: "positioning-draft", version: "1" },
    promptVersion: "positioning-prompt-1",
    options: [
      {
        statement: "Roasted coffee for office workers, fresh every week",
        quotes: [
          { answer: "value", start: 0, end: VALUE.length, text: VALUE },
          { answer: "idea", start: 20, end: 34, text: "office workers" },
        ],
      },
      {
        statement: "Fresh beans, every week",
        quotes: [
          { answer: "value", start: 0, end: 11, text: "Fresh beans" },
          { answer: "idea", start: 0, end: 14, text: "Roasted coffee" },
        ],
      },
    ],
  };
  const picked = {
    id: "c-2",
    intakeId: INTAKE,
    kind: "picked",
    statement: "Fresh beans, every week",
    draftId: draft.id,
    option: 2,
    createdAt: "2026-11-18T04:00:00.000Z",
  };
  const twice = async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T09:00:00Z"));
    const first = await loadProject(PROJECT);
    vi.setSystemTime(new Date("2026-11-20T09:00:00Z"));
    const second = await loadProject(PROJECT);
    return { first, second };
  };

  it("gives the same draft and the same choice a day apart, and does nothing beside reading", async () => {
    state.value = VALUE;
    state.draft = draft;
    const { first, second } = await twice();
    if (first.access !== "ready" || second.access !== "ready") throw new Error("not ready");
    expect(second).toEqual(first);
    expect(first.view.positioning).toMatchObject({
      gate: "awaiting-choice",
      options: {
        draftId: draft.id,
        modelId: "anthropic/claude-sonnet-5.5",
        items: [{ n: 1 }, { n: 2 }],
      },
      controls: expect.arrayContaining(["pick", "edit"]),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.beside).toEqual([]);
  });

  it("gives the same picked statement a day apart, labelled with the saved model, and does nothing beside reading", async () => {
    state.value = VALUE;
    state.draft = draft;
    state.choice = picked;
    const { first, second } = await twice();
    if (first.access !== "ready" || second.access !== "ready") throw new Error("not ready");
    expect(second).toEqual(first);
    expect(first.view.positioning).toMatchObject({
      gate: "confirmed",
      statement: {
        text: "Fresh beans, every week",
        label: "business.positioning.by.picked",
        modelId: "anthropic/claude-sonnet-5.5",
      },
      options: null,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.beside).toEqual([]);
  });

  it("a project with no draft is not drafted on open: the draft control is offered and nothing runs", async () => {
    state.value = VALUE;
    const { first } = await twice();
    if (first.access !== "ready") throw new Error("not ready");
    expect(first.view.positioning.controls).toContain("draft");
    expect(first.view.positioning.options).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.beside).toEqual([]);
  });
});
