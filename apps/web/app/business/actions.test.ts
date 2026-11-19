import { type Limit, LIMITS, type Subject } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-281 tech notes section 13, T15 to T19 (spec rows 6, 8, 9, 11 and 12): `createProject`, steps 1
// to 5 of `business-door-1`. The service is a spy and the limiter counts in memory, so these tests
// prove the order (session, list, limit, check, save), what is saved, and what reaches a line.
// ORV-283 C5, T42 and T43 (rows 31 and 32): steps 6 to 9 after the save, the `ai-read` limit, the
// spend cap, the model call, the usage record and the saved reading. The network is a fake `fetch`
// that answers with a recorded body, so no test reaches a model or the internet.

const state = vi.hoisted(() => ({
  session: null as {
    user: { id: string; email?: string };
    session: { activeOrganizationId: string | null };
  } | null,
  order: [] as string[],
  ip: "ip-1",
  mode: "count" as "count" | "unavailable",
  /** The one limit whose store cannot count, while the others do. */
  downFor: null as string | null,
  counts: new Map<string, number>(),
  consumed: [] as string[],
  saved: [] as { workspaceId: string | null; intake: unknown }[],
  /** What the service does on its next call: succeed, or throw this. */
  createThrows: null as unknown,
  openThrows: null as unknown,
  saveReadingThrows: null as unknown,
  /** The records `saveReading` accepted, in order; `open` answers with the last one. */
  readings: [] as unknown[],
  cap: "ok" as "ok" | "capped" | "unavailable" | "throws",
  recordThrows: false,
  usage: [] as { job: string; model: string; costMicroUsd: number | null }[],
}));

// Hoisted with the mocks that read them.
const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const INTAKE_ID = "22222222-2222-4222-8222-222222222222";
const SAVED_AT = new Date("2026-11-18T03:15:00Z");

const keyOf = (limit: Limit, subject: Subject) =>
  "user" in subject ? `${limit.name}:u:${subject.user}` : `${limit.name}:ip:${subject.ip}`;

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("../../server/auth", () => ({
  accessDeps: () => ({}),
  auth: () => ({
    api: {
      getSession: async () => {
        state.order.push("session");
        return state.session;
      },
    },
  }),
}));
// The real check, wrapped so a test sees when it runs.
vi.mock("../../server/read-access", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../server/read-access")>();
  return {
    mayRead: (email: string | null | undefined) => {
      state.order.push("allow-list");
      return real.mayRead(email);
    },
  };
});
vi.mock("../../server/rate-limit", () => ({
  subjectFromHeaders: () => state.ip,
  limiter: () => ({
    async consume(limit: Limit, subject: Subject) {
      state.consumed.push(keyOf(limit, subject));
      state.order.push("consume");
      if (state.mode === "unavailable" || state.downFor === limit.name)
        return { ok: false, reason: "unavailable" };
      for (const w of limit.windows) {
        if ((state.counts.get(`${keyOf(limit, subject)}@${w.seconds}`) ?? 0) >= w.max) {
          return { ok: false, reason: "limited", retryAfter: w.seconds };
        }
      }
      for (const w of limit.windows) {
        const k = `${keyOf(limit, subject)}@${w.seconds}`;
        state.counts.set(k, (state.counts.get(k) ?? 0) + 1);
      }
      return { ok: true };
    },
  }),
}));
vi.mock("../../server/spend-cap", () => ({
  spendCap: () => ({
    async check() {
      state.order.push("spend-check");
      if (state.cap === "throws") throw new Error("the database is down");
      if (state.cap !== "ok") return { ok: false, reason: state.cap };
      return { ok: true, charge: { workspaceId: "ws-1", userId: "P" } };
    },
    async record(_charge: unknown, entries: typeof state.usage) {
      state.order.push("usage");
      if (state.recordThrows) throw new Error("insert into ai_usage");
      state.usage.push(...entries);
    },
  }),
}));
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  const { businessReadingSchema } = await import("@orivilo/intent-engine");
  return {
    ...real,
    businessService: () => ({
      async create(_h: Headers, workspaceId: string | null, intake: unknown) {
        state.order.push("save");
        state.saved.push({ workspaceId, intake });
        if (state.createThrows !== null) throw state.createThrows;
        return { projectId: PROJECT_ID };
      },
      // What the real `open` gives for the project `create` saved, with the newest saved reading.
      async open() {
        state.order.push("open");
        if (state.openThrows !== null) throw state.openThrows;
        const { projectName, ...answers } = (state.saved.at(-1)?.intake ?? {}) as Record<
          string,
          string
        >;
        return {
          project: { id: PROJECT_ID, name: projectName, createdAt: SAVED_AT },
          intakeId: INTAKE_ID,
          intake: { version: "intake-1", ...answers },
          savedAt: SAVED_AT,
          reading: state.readings.at(-1) ?? null,
        };
      },
      async saveReading(_h: Headers, _workspaceId: string, record: unknown) {
        state.order.push("save-reading");
        if (state.saveReadingThrows !== null) throw state.saveReadingThrows;
        state.readings.push(businessReadingSchema.parse(record));
      },
    }),
  };
});

const fetchSpy =
  vi.fn<
    (
      url: string,
      init: { body: string; signal?: AbortSignal; headers: Record<string, string> },
    ) => Promise<Response>
  >();
vi.stubGlobal("fetch", fetchSpy);

const { createProject } = await import("./actions");
const { loadProject } = await import("./data");
const auth = await import("@orivilo/auth");
const { MissingEnvError } = await import("@orivilo/db");

// Fixtures only: addresses under example.com and example.test (ORV-268).
const LIST = "reader@example.com,second@example.test";
const person = {
  user: { id: "P", email: "reader@example.com" },
  session: { activeOrganizationId: "ws-1" },
};
const INTAKE = {
  projectName: "ร้านกาแฟคั่วเอง",
  idea: "ขายกาแฟคั่วสดให้คนทำงานในย่านอารีย์",
  industry: "ร้านอาหารและเครื่องดื่ม",
  website: "cafe.example/menu",
};
// The key is a placeholder that must never reach a line, an outcome or a saved record.
const FAKE_KEY = "sk-or-test-not-a-real-key";
const PINNED = "anthropic/claude-sonnet-5.5";
/** A recorded answer of the job for INTAKE: a customer named in the idea, and the category. */
const RECORDED = {
  readings: [
    {
      field: "audience.customers",
      value: "คนทำงานในย่านอารีย์",
      quotes: [{ answer: "idea", text: "คนทำงานในย่านอารีย์" }],
    },
    {
      field: "competitive-frame.category",
      value: "ร้านอาหารและเครื่องดื่ม",
      quotes: [{ answer: "industry", text: "ร้านอาหารและเครื่องดื่ม" }],
    },
  ],
};
/** What OpenRouter answers: the pinned model, the text, and the cost it reports (US dollars). */
const modelReply = (content: string, status = 200, cost = 0.0113) =>
  new Response(
    JSON.stringify(
      status === 200
        ? { model: PINNED, choices: [{ message: { content } }], usage: { cost } }
        : { error: { message: content } },
    ),
    { status },
  );
const stepLines = () => written().filter((l) => l["step"] === "business-read");
let capture: ReturnType<typeof captureLines>;
const written = () => capture.lines.map((line) => expectLineShape(line));
const everything = (outcome: unknown) =>
  JSON.stringify([outcome, capture.lines.map((l) => l.args)]);

beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
  state.order = [];
  state.session = person;
  state.ip = "ip-1";
  state.mode = "count";
  state.downFor = null;
  state.counts.clear();
  state.consumed = [];
  state.saved = [];
  state.createThrows = null;
  state.openThrows = null;
  state.saveReadingThrows = null;
  state.readings = [];
  state.cap = "ok";
  state.recordThrows = false;
  state.usage = [];
  fetchSpy.mockReset();
  // The default network: a recorded answer. A test with no key never reaches it.
  fetchSpy.mockImplementation(async () => modelReply(JSON.stringify(RECORDED)));
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// T15, row 6.
describe("not approved", () => {
  it("answers forbidden with no address, counts nothing and saves nothing", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await createProject(INTAKE);
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list"]);
    const all = everything(outcome);
    for (const secret of ["stranger", "example.com", INTAKE.projectName, INTAKE.idea]) {
      expect(all).not.toContain(secret);
    }
    expect(written()).toMatchObject([
      { route: "business/createProject", outcome: "refused", reason: "forbidden" },
    ]);
  });

  it("an unset list denies everyone", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", "");
    expect(await createProject(INTAKE)).toMatchObject({ ok: false, error: "forbidden" });
    expect(state.saved).toEqual([]);
  });
});

// T16, row 8, fourth case.
describe("website refused", () => {
  it("answers invalid-input with the website problem and saves nothing", async () => {
    const outcome = await createProject({ ...INTAKE, website: "ftp://example.com/" });
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      code: "INVALID_INPUT",
      retryable: false,
      problems: [{ field: "website", kind: "website" }],
    });
    expect(state.saved).toEqual([]);
    // The check runs after the limit counted: a refused submission still costs a use.
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
    expect(everything(outcome)).not.toContain("ftp://");
    expect(everything(outcome)).not.toContain(INTAKE.idea);
    expect(written()).toMatchObject([
      { route: "business/createProject", outcome: "refused", reason: "invalid-input" },
    ]);
  });

  it("carries the request id of the boundary line and never the person's words", async () => {
    const outcome = await createProject({ projectName: "", idea: "  ", role: "admin" });
    if (outcome.ok || !("problems" in outcome)) throw new Error("expected a refusal");
    expect(outcome.problems).toEqual([{ field: null, kind: "unknown-key" }]);
    expect(outcome.requestId).toBe(written()[0]?.["requestId"]);
    expect(state.saved).toEqual([]);
  });

  it("a name, an idea and an answer over its bound are refused the same way", async () => {
    const outcome = await createProject({ projectName: "", idea: "x".repeat(2001) });
    if (outcome.ok || !("problems" in outcome)) throw new Error("expected a refusal");
    expect(outcome.problems).toEqual([
      { field: "projectName", kind: "required" },
      { field: "idea", kind: "too-long" },
    ]);
    expect(everything(outcome)).not.toContain("xxxxx");
  });
});

// T17, row 9.
describe("saves in the workspace", () => {
  it("answers ok with the project id and logs the route and outcome only", async () => {
    const outcome = await createProject(INTAKE);
    expect(outcome).toEqual({ ok: true, value: { projectId: PROJECT_ID } });
    // Step 5 gets the person's active workspace and the checked intake, the website as kept.
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        intake: { ...INTAKE, website: "https://cafe.example/menu" },
      },
    ]);
    // Steps 6 to 9 follow the save; with no key the reading is the rule-based record.
    expect(state.consumed).toEqual([`write:u:P`, `ai-read:u:P`]);
    expect(state.order).toEqual([
      "session",
      "allow-list",
      "consume",
      "save",
      "open",
      "consume",
      "spend-check",
      "save-reading",
    ]);
    const lines = written();
    expect(lines).toMatchObject([
      { step: "business-read", outcome: "not-configured", level: "warn" },
      { route: "business/createProject", outcome: "ok", level: "info" },
    ]);
    const all = everything(outcome);
    for (const secret of [
      INTAKE.projectName,
      INTAKE.idea,
      INTAKE.industry,
      "cafe.example",
      "reader@example.com",
      "ws-1",
    ]) {
      expect(all).not.toContain(secret);
    }
  });

  it("takes the workspace from the session and never from the input", async () => {
    await createProject({ ...INTAKE, workspaceId: "other" });
    expect(state.saved).toEqual([]);
    await createProject(INTAKE);
    expect(state.saved[0]?.workspaceId).toBe("ws-1");
  });

  it.each([
    [401, "signed-out", "UNAUTHENTICATED"],
    [403, "forbidden", "FORBIDDEN"],
    [404, "workspace-not-found", "NOT_FOUND"],
  ] as const)("a denied %s from the service is %s", async (status, error, code) => {
    state.createThrows = new auth.Denied(status, "no-workspace");
    expect(await createProject(INTAKE)).toMatchObject({ ok: false, error, code });
    expect(written()).toMatchObject([{ outcome: "refused", reason: error }]);
  });

  it("a missing database variable is not-configured", async () => {
    state.createThrows = new MissingEnvError("DATABASE_URL");
    expect(await createProject(INTAKE)).toMatchObject({
      ok: false,
      error: "not-configured",
      code: "INTERNAL_ERROR",
    });
    expect(written()).toMatchObject([
      { outcome: "failed", level: "error", reason: "not-configured" },
    ]);
  });

  it("any other failure is failed and the line holds the error's name, never its text", async () => {
    state.createThrows = new Error("insert into project values ('ร้านกาแฟคั่วเอง')");
    const outcome = await createProject(INTAKE);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(written()).toMatchObject([
      { outcome: "failed", reason: "unexpected", errorName: "Error" },
    ]);
    expect(everything(outcome)).not.toContain("ร้านกาแฟ");
  });
});

// T18, row 11.
describe("signed out", () => {
  it("counts the signed-out limit by IP, answers signed-out and saves nothing", async () => {
    state.session = null;
    const outcome = await createProject(INTAKE);
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    // No session: the list is never asked, and the check never runs ahead of the session.
    expect(state.order).toEqual(["session", "consume"]);
    expect(written()).toMatchObject([{ outcome: "refused", reason: "signed-out" }]);
  });

  it("limits a signed-out caller by its own number, not the write limit", async () => {
    state.session = null;
    const max = LIMITS["signed-out"].windows[0]?.max ?? 0;
    for (let i = 0; i < max; i++) await createProject(INTAKE);
    expect(await createProject(INTAKE)).toMatchObject({ ok: false, error: "rate-limited" });
  });
});

// T19, row 12.
describe("write limit", () => {
  it("answers RATE_LIMITED with retryAfter once the limit is used up, and saves nothing more", async () => {
    const window = LIMITS.write.windows[0];
    if (!window) throw new Error("the write limit has a window");
    for (let i = 0; i < window.max; i++) {
      expect(await createProject(INTAKE)).toMatchObject({ ok: true });
    }
    expect(state.saved).toHaveLength(window.max);
    const outcome = await createProject(INTAKE);
    expect(outcome).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryable: true,
      retryAfter: window.seconds,
    });
    expect(state.saved).toHaveLength(window.max);
    expect(written().at(-1)).toMatchObject({ outcome: "limited", level: "warn" });
  });

  it("counts every call from an approved person, a refused intake too", async () => {
    await createProject({ projectName: "", idea: "" });
    await createProject({ ...INTAKE, website: "javascript:alert(1)" });
    expect(state.consumed).toEqual(["write:u:P", "write:u:P"]);
  });

  it("a store that cannot count fails closed with SERVICE_UNAVAILABLE and saves nothing", async () => {
    state.mode = "unavailable";
    const outcome = await createProject(INTAKE);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "SERVICE_UNAVAILABLE" });
    expect(state.saved).toEqual([]);
    expect(written()).toMatchObject([{ outcome: "unavailable", level: "error" }]);
  });
});

const ANSWERS = {
  idea: INTAKE.idea,
  industry: INTAKE.industry,
};
const lastRecord = () => state.readings.at(-1) as Record<string, unknown> | undefined;

/** What the person's own words and the secrets are never in: the outcome, every line, every record. */
function expectNothingSecret(outcome: unknown) {
  const all = JSON.stringify([everything(outcome), state.readings, state.usage]);
  for (const secret of [FAKE_KEY, "reader@example.com", "ws-1", "No endpoints for"]) {
    expect(all).not.toContain(secret);
  }
  // The person's words reach the saved record only as quotes inside model items; never a line or an outcome.
  const visible = JSON.stringify([outcome, capture.lines.map((l) => l.args)]);
  for (const words of [INTAKE.projectName, INTAKE.idea, INTAKE.industry, "cafe.example"]) {
    expect(visible).not.toContain(words);
  }
}

// T42, row 31: one case each. The project and its intake are saved every time; the reading record
// says why there is no model reading; the action still answers ok and the boundary line stays ok.
describe("no reading", () => {
  const expectSavedAndRuleBased = async (reason: string, outcomeWord: string) => {
    const outcome = await createProject(INTAKE);
    expect(outcome).toEqual({ ok: true, value: { projectId: PROJECT_ID } });
    // Step 5 committed once and nothing undid it.
    expect(state.saved).toHaveLength(1);
    expect(lastRecord()).toEqual({
      method: "rule-based",
      job: "business-read",
      intakeId: INTAKE_ID,
      reason,
    });
    expect(stepLines()).toHaveLength(1);
    expect(stepLines()[0]).toMatchObject({ outcome: outcomeWord, level: "warn" });
    expect(written().at(-1)).toMatchObject({ route: "business/createProject", outcome: "ok" });
    expectNothingSecret(outcome);
  };

  it("no key: ai-not-configured, no model call", async () => {
    await expectSavedAndRuleBased("ai-not-configured", "not-configured");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.usage).toEqual([]);
  });

  it("a call that fails: ai-failed, one call to the pinned model and no other", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    fetchSpy.mockImplementation(async () => modelReply("No endpoints for this request", 402));
    await expectSavedAndRuleBased("ai-failed", "failed");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchSpy.mock.calls[0]?.[1].body ?? "{}")).toMatchObject({
      model: PINNED,
      provider: { allow_fallbacks: false },
    });
    // The call was sent, so it is recorded, with no reported cost.
    expect(state.usage).toEqual([{ job: "business-read", model: PINNED, costMicroUsd: null }]);
  });

  it("a call that times out after 20 s: ai-failed, no second call", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(AbortSignal.abort(new DOMException("timed out", "TimeoutError")));
    fetchSpy.mockImplementation(async (_url, init) => {
      if (init.signal?.aborted) throw init.signal.reason;
      return modelReply(JSON.stringify(RECORDED));
    });
    await expectSavedAndRuleBased("ai-failed", "failed");
    expect(timeout).toHaveBeenCalledWith(20_000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("a refused answer: ai-failed, the usage is still recorded, no second model", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    // An extra key `confidence` refuses the whole answer (row 28).
    fetchSpy.mockImplementation(async () =>
      modelReply(JSON.stringify({ readings: RECORDED.readings, confidence: 1 })),
    );
    await expectSavedAndRuleBased("ai-failed", "refused");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(state.usage).toEqual([{ job: "business-read", model: PINNED, costMicroUsd: 11300 }]);
  });

  it("the ai-read limit used up: ai-rate-limited, no spend check and no model call", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    const window = LIMITS["ai-read"].windows[0];
    if (!window) throw new Error("the ai-read limit has a window");
    state.counts.set(`ai-read:u:P@${window.seconds}`, window.max);
    await expectSavedAndRuleBased("ai-rate-limited", "limited");
    expect(stepLines()[0]).toMatchObject({ limit: "ai-read" });
    expect(state.order).not.toContain("spend-check");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("the spend cap reached: ai-spend-cap, no model call and nothing recorded", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    state.cap = "capped";
    await expectSavedAndRuleBased("ai-spend-cap", "spend-cap");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.order).not.toContain("usage");
  });

  it.each(["unavailable", "throws"] as const)(
    "a spend cap that is %s fails closed as ai-failed",
    async (cap) => {
      vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
      state.cap = cap;
      await expectSavedAndRuleBased("ai-failed", "unavailable");
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("an ai-read limit store that cannot count fails closed as ai-failed", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    // The write limit counts; the store goes down for the ai-read count only.
    state.downFor = "ai-read";
    await expectSavedAndRuleBased("ai-failed", "unavailable");
    expect(state.order).not.toContain("spend-check");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a usage record that fails changes nothing: the reading is still saved", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    state.recordThrows = true;
    const outcome = await createProject(INTAKE);
    expect(outcome).toMatchObject({ ok: true });
    expect(lastRecord()).toMatchObject({ method: "model" });
    expect(
      written().some((l) => l["step"] === "ai-usage" && l["outcome"] === "record-failed"),
    ).toBe(true);
  });

  it("a reading that cannot be saved still answers ok, with the step line save-failed", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    state.saveReadingThrows = new Error("insert into business_reading ('ขายกาแฟ')");
    const outcome = await createProject(INTAKE);
    expect(outcome).toEqual({ ok: true, value: { projectId: PROJECT_ID } });
    expect(state.saved).toHaveLength(1);
    expect(stepLines()).toMatchObject([{ outcome: "save-failed", level: "warn" }]);
    expect(written().at(-1)).toMatchObject({ outcome: "ok" });
    expect(everything(outcome)).not.toContain("ขายกาแฟ");
  });

  it("an intake that cannot be read back gets no model call and still answers ok", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    state.openThrows = new Error("select from business_intake");
    const outcome = await createProject(INTAKE);
    expect(outcome).toEqual({ ok: true, value: { projectId: PROJECT_ID } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(stepLines()).toMatchObject([{ outcome: "save-failed" }]);
  });

  it("steps 6 to 9 start only after the save committed", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    await createProject(INTAKE);
    const at = (step: string) => state.order.indexOf(step);
    expect(at("save")).toBeGreaterThan(-1);
    expect(state.order.lastIndexOf("consume")).toBeGreaterThan(at("save"));
    expect(at("spend-check")).toBeGreaterThan(at("save"));
    expect(at("usage")).toBeLessThan(at("save-reading"));
  });
});

describe("a reading", () => {
  it("is saved as the model's record, with the usage and a wire that holds the six answers only", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    const outcome = await createProject(INTAKE);
    expect(outcome).toEqual({ ok: true, value: { projectId: PROJECT_ID } });
    expect(lastRecord()).toMatchObject({
      method: "model",
      job: "business-read",
      intakeId: INTAKE_ID,
      modelId: PINNED,
      adapter: { id: "business-read", version: "1" },
      promptVersion: "business-prompt-1",
    });
    const items = (lastRecord()?.["items"] ?? []) as { reading: { target: string } | null }[];
    expect(items.filter((i) => i.reading !== null).map((i) => i.reading?.target)).toEqual([
      "audience.customers",
      "competitive-frame.category",
    ]);
    expect(state.usage).toEqual([{ job: "business-read", model: PINNED, costMicroUsd: 11300 }]);
    expect(stepLines()).toMatchObject([{ outcome: "read", level: "info" }]);
    expect(state.order).toEqual([
      "session",
      "allow-list",
      "consume",
      "save",
      "open",
      "consume",
      "spend-check",
      "usage",
      "save-reading",
    ]);

    // The wire: the answers only in the user message, nothing else of the project or the person.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init?.headers["Authorization"]).toBe(`Bearer ${FAKE_KEY}`);
    const body = JSON.parse(init?.body ?? "{}") as {
      messages: { role: string; content: string }[];
      max_tokens: number;
      provider: { zdr: boolean; data_collection: string };
    };
    expect(JSON.parse(body.messages[1]?.content ?? "")).toEqual(ANSWERS);
    expect(body.messages[0]?.content).not.toContain(INTAKE.idea);
    expect(body.max_tokens).toBe(3000);
    expect(body.provider).toMatchObject({ zdr: true, data_collection: "deny" });
    for (const never of [INTAKE.projectName, "cafe.example", "reader@example.com", "ws-1"]) {
      expect(init?.body).not.toContain(never);
    }

    // Only the person's own words reach the record, and the key never does.
    expect(JSON.stringify(state.readings)).not.toContain(FAKE_KEY);
    expect(JSON.stringify(outcome)).not.toContain(FAKE_KEY);
    for (const line of capture.lines) expect(line.args[0]).not.toContain(FAKE_KEY);
  });

  it("holds model text as data: markup in a value is kept as text and a quote that is not there refuses", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    const markup = "<img src=x onerror=alert(1)>";
    fetchSpy.mockImplementation(async () =>
      modelReply(
        JSON.stringify({
          readings: [
            {
              field: "audience.customers",
              value: markup,
              quotes: [{ answer: "idea", text: "คนทำงานในย่านอารีย์" }],
            },
          ],
        }),
      ),
    );
    await createProject(INTAKE);
    expect(JSON.stringify(state.readings)).toContain(JSON.stringify(markup).slice(1, -1));
    expect(lastRecord()).toMatchObject({ method: "model" });
  });
});

// T43, row 32: opening a saved project reads the saved record. It never calls the model, counts no
// limit and checks no spend cap, however much time has passed.
describe("replay, never re-read", () => {
  it("opens twice a day apart on a fake clock and shows the same readings with no fetch", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-18T03:15:00Z"));
      await createProject(INTAKE);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockClear();
      state.consumed = [];
      state.order = [];

      const first = await loadProject(PROJECT_ID);
      vi.setSystemTime(new Date("2026-11-19T03:15:00Z"));
      const second = await loadProject(PROJECT_ID);

      if (first.access !== "ready") throw new Error("not ready");
      expect(second).toEqual(first);
      expect(first.view.reading).toEqual({ status: "model", modelId: PINNED });
      const customers = first.view.nodes
        .flatMap((n) => n.fields)
        .find((f) => f.field === "audience.customers");
      expect(customers?.readings.map((r) => r.value)).toEqual(["คนทำงานในย่านอารีย์"]);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(state.consumed).toEqual([]);
      expect(state.order).toEqual([
        "session",
        "allow-list",
        "open",
        "session",
        "allow-list",
        "open",
      ]);
      // The record holds what a replay needs.
      expect(lastRecord()).toMatchObject({
        modelId: PINNED,
        adapter: { id: "business-read", version: "1" },
        promptVersion: "business-prompt-1",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("opens a project whose reading is rule-based with its reason and no fetch", async () => {
    await createProject(INTAKE);
    fetchSpy.mockClear();
    const loaded = await loadProject(PROJECT_ID);
    expect(loaded).toMatchObject({
      access: "ready",
      view: { reading: { status: "rule-based", reason: "ai-not-configured" } },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
