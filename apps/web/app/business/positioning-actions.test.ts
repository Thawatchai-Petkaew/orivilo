import { type Limit, LIMITS, type Subject } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-285 tech notes section 12, T11 to T14 (spec rows 2, 4 and 6): `choosePositioning`, the choice
// door of `positioning-door-1`. The service is a fake that keeps the rows it was given and refuses
// as the real one does (the real one is proven against a database in `business.integration.test.ts`),
// and the limiter counts in memory, so these tests prove the order (session, list, limit, check,
// save), what is saved, the one answer for what is not there, and what reaches a line.
// ORV-292 B3, T33 to T36 (rows 15, 16, 18 to 21 and 27): `draftPositioning`, the draft door of
// `positioning-door-1` (steps 1 to 9), and `picked` and `edited` choices. The network is a fake
// `fetch` that answers with a typed body, so no test reaches a model or the internet.

const state = vi.hoisted(() => ({
  session: null as {
    user: { id: string; email?: string };
    session: { activeOrganizationId: string | null };
  } | null,
  order: [] as string[],
  mode: "count" as "count" | "unavailable",
  counts: new Map<string, number>(),
  consumed: [] as string[],
  /** The rows the fake service saved, in order. */
  saved: [] as {
    workspaceId: string;
    choice: {
      kind: string;
      projectId?: string;
      statement?: string;
      draftId?: string;
      option?: number;
    };
  }[],
  /** The project ids the fake service finds in the session's workspace. */
  known: ["11111111-1111-4111-8111-111111111111"] as string[],
  throws: null as unknown,
  /** The drafts the fake service knows: a draft names its project and whether its intake is the newest. */
  drafts: [] as {
    id: string;
    projectId: string;
    current: boolean;
    options: { statement: string }[];
  }[],
  /** What `businessService.open` answers for the draft door, or throws. */
  opened: null as unknown,
  /** Answers the next calls of `open` in order, before `opened`. */
  openSeq: [] as unknown[],
  openThrows: null as unknown,
  saveDraftThrows: null as unknown,
  /** The records `saveDraft` accepted, in order. */
  draftsSaved: [] as unknown[],
  cap: "ok" as "ok" | "capped" | "unavailable" | "throws",
  usage: [] as { job: string; model: string; costMicroUsd: number | null }[],
  recordThrows: false,
}));

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999";
const DRAFT_ID = "33333333-3333-4333-8333-333333333333";
const SAVED_DRAFT_ID = "44444444-4444-4444-8444-444444444444";
const INTAKE_ID = "22222222-2222-4222-8222-222222222222";
const SAVED_AT = new Date("2026-11-19T03:15:00Z");

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
  subjectFromHeaders: () => "ip-1",
  limiter: () => ({
    async consume(limit: Limit, subject: Subject) {
      state.consumed.push(keyOf(limit, subject));
      state.order.push("consume");
      if (state.mode === "unavailable") return { ok: false, reason: "unavailable" };
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
  const { settleEdit } = await import("@orivilo/intent-engine");
  return {
    ...real,
    businessService: () => ({
      async open() {
        state.order.push("open");
        if (state.openThrows !== null) throw state.openThrows;
        return state.openSeq.length > 0 ? state.openSeq.shift() : state.opened;
      },
    }),
    positioningService: () => ({
      async saveDraft(_h: Headers, _workspaceId: string, record: unknown) {
        state.order.push("save-draft");
        if (state.saveDraftThrows !== null) throw state.saveDraftThrows;
        state.draftsSaved.push(record);
        return { draftId: SAVED_DRAFT_ID };
      },
      async choose(
        _h: Headers,
        workspaceId: string,
        choice: {
          kind: string;
          projectId: string;
          statement?: string;
          draftId?: string;
          option?: number;
        },
      ) {
        state.order.push("save");
        if (state.throws !== null) throw state.throws;
        if (!state.known.includes(choice.projectId)) throw new real.BusinessError("not-found");
        // As the service: an agreed choice on the intake refuses.
        if (state.saved.some((s) => s.choice.kind !== "skipped")) {
          throw new real.BusinessError("gate-passed");
        }
        if (choice.kind === "picked" || choice.kind === "edited") {
          // As the service: a draft of this project's newest intake with that option, else not-found;
          // the statement is the stored option's, never the caller's.
          const draft = state.drafts.find(
            (d) => d.id === choice.draftId && d.projectId === choice.projectId && d.current,
          );
          const chosen = draft?.options[(choice.option ?? 0) - 1];
          if (!draft || !chosen) throw new real.BusinessError("not-found");
          const kind =
            choice.kind === "picked"
              ? "picked"
              : settleEdit(chosen.statement, choice.statement ?? "");
          state.saved.push({
            workspaceId,
            choice: {
              kind,
              projectId: choice.projectId,
              draftId: draft.id,
              option: choice.option ?? 0,
              statement: kind === "picked" ? chosen.statement : (choice.statement ?? ""),
            },
          });
          return { kind };
        }
        state.saved.push({ workspaceId, choice });
        return { kind: choice.kind };
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

const { choosePositioning, draftPositioning } = await import("./positioning-actions");
const { BusinessError, Denied } = await import("@orivilo/auth");
const { MissingEnvError } = await import("@orivilo/db");

// Fixtures only: addresses under example.com and example.test (ORV-268).
const LIST = "reader@example.com,second@example.test";
const person = {
  user: { id: "P", email: "reader@example.com" },
  session: { activeOrganizationId: "ws-1" },
};
const STATEMENT = "กาแฟคั่วสดสำหรับคนทำงานที่ส่งถึงออฟฟิศทุกเช้า";
const write = { kind: "written", projectId: PROJECT_ID, statement: `  ${STATEMENT}  ` };
const skip = { kind: "skipped", projectId: PROJECT_ID };

// The draft door's fixtures: the answers of W6, one project and a typed model answer that quotes them.
const IDEA = "ขายกาแฟคั่วสดให้คนทำงานในย่านอารีย์";
const VALUE = "คั่วสดทุกสัปดาห์และส่งถึงบ้านภายในสองวัน";
const FAKE_KEY = "sk-or-test-not-a-real-key";
const PINNED = "anthropic/claude-sonnet-5.5";
const TYPED = {
  options: [
    {
      statement: "กาแฟคั่วสดสำหรับคนทำงานในย่านอารีย์ ส่งถึงบ้านภายในสองวัน",
      quotes: [
        { answer: "value", text: "คั่วสดทุกสัปดาห์" },
        { answer: "idea", text: "คนทำงานในย่านอารีย์" },
      ],
    },
    {
      statement: "ส่งถึงบ้านภายในสองวัน กาแฟคั่วสดทุกสัปดาห์",
      quotes: [
        { answer: "value", text: "ส่งถึงบ้านภายในสองวัน" },
        { answer: "idea", text: "กาแฟคั่วสด" },
      ],
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
/** What `businessService.open` gives: the newest intake, no reading, the positioning state. */
function openedProject(
  over: {
    value?: string | undefined;
    choice?: unknown;
    draft?: unknown;
  } = {},
) {
  const { choice = null, draft = null } = over;
  const value = "value" in over ? over.value : VALUE;
  return {
    project: { id: PROJECT_ID, name: "Shop", createdAt: SAVED_AT },
    intakeId: INTAKE_ID,
    intake: { version: "intake-1", idea: IDEA, ...(value === undefined ? {} : { value }) },
    savedAt: SAVED_AT,
    reading: null,
    positioning: { intakeId: INTAKE_ID, choice, draft },
  };
}
const draftStep = () => written().filter((l) => l["step"] === "positioning-draft");

let capture: ReturnType<typeof captureLines>;
const written = () => capture.lines.map((line) => expectLineShape(line));
const everything = (outcome: unknown) =>
  JSON.stringify([outcome, capture.lines.map((l) => l.args)]);
/** The body of a refusal without the request id, which is made for each call. */
const body = (outcome: unknown) =>
  Object.fromEntries(Object.entries(outcome as object).filter(([key]) => key !== "requestId"));

beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
  state.order = [];
  state.session = person;
  state.mode = "count";
  state.counts.clear();
  state.consumed = [];
  state.saved = [];
  state.known = [PROJECT_ID];
  state.throws = null;
  state.drafts = [];
  state.opened = openedProject();
  state.openSeq = [];
  state.openThrows = null;
  state.saveDraftThrows = null;
  state.draftsSaved = [];
  state.cap = "ok";
  state.usage = [];
  state.recordThrows = false;
  vi.stubEnv("OPENROUTER_API_KEY", FAKE_KEY);
  fetchSpy.mockReset();
  // The default network: a typed answer. A test with no key never reaches it.
  fetchSpy.mockImplementation(async () => {
    state.order.push("fetch");
    return modelReply(JSON.stringify(TYPED));
  });
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// T11, row 2.
describe("write my own", () => {
  it("answers ok with the kind, saves the trimmed statement in the session's workspace, and logs closed words", async () => {
    const outcome = await choosePositioning(write);
    expect(outcome).toEqual({ ok: true, value: { kind: "written" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        choice: { kind: "written", projectId: PROJECT_ID, statement: STATEMENT },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    expect(written()).toMatchObject([
      { route: "business/choosePositioning", outcome: "ok", level: "info" },
    ]);
    // The statement, the ids, the address and the workspace reach no line and no body.
    const all = everything(outcome);
    for (const secret of [STATEMENT, PROJECT_ID, "reader@example.com", "ws-1"]) {
      expect(all).not.toContain(secret);
    }
  });

  it("never reaches a line with the statement when the save fails", async () => {
    state.throws = new Error(`insert failed for ${STATEMENT}`);
    const outcome = await choosePositioning(write);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(everything(outcome)).not.toContain(STATEMENT);
    expect(written()).toMatchObject([
      { route: "business/choosePositioning", outcome: "failed", reason: "unexpected" },
    ]);
  });

  it("answers failed for a save the database refused, with no statement", async () => {
    state.throws = new BusinessError("not-saved");
    const outcome = await choosePositioning(write);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(everything(outcome)).not.toContain(STATEMENT);
    expect(written()).toMatchObject([{ outcome: "failed", reason: "failed" }]);
  });

  it("answers not-configured when the database settings are missing", async () => {
    state.throws = new MissingEnvError("DATABASE_URL");
    expect(await choosePositioning(write)).toMatchObject({ ok: false, error: "not-configured" });
  });
});

// T12, row 4.
describe("skip, then write", () => {
  it("accepts both calls and keeps two rows", async () => {
    expect(await choosePositioning(skip)).toEqual({ ok: true, value: { kind: "skipped" } });
    expect(await choosePositioning(write)).toEqual({ ok: true, value: { kind: "written" } });
    expect(state.saved.map((s) => s.choice.kind)).toEqual(["skipped", "written"]);
  });

  it("accepts a second skip", async () => {
    await choosePositioning(skip);
    expect(await choosePositioning(skip)).toMatchObject({ ok: true });
    expect(state.saved).toHaveLength(2);
  });
});

// T13, row 6.
describe("choice door", () => {
  it("signed-out: counts the signed-out limit by IP, then answers signed-out, and saves nothing", async () => {
    state.session = null;
    const outcome = await choosePositioning(write);
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("forbidden: answers forbidden with no address, counts nothing and saves nothing", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await choosePositioning(write);
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list"]);
    const all = everything(outcome);
    for (const secret of ["stranger", "example.com", STATEMENT]) {
      expect(all).not.toContain(secret);
    }
    expect(written()).toMatchObject([
      { route: "business/choosePositioning", outcome: "refused", reason: "forbidden" },
    ]);
  });

  it("an unset list denies everyone", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", "");
    expect(await choosePositioning(write)).toMatchObject({ ok: false, error: "forbidden" });
    expect(state.consumed).toEqual([]);
  });

  it("rate-limited: answers RATE_LIMITED with how long to wait, and saves nothing", async () => {
    for (const w of LIMITS.write.windows) {
      state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
    }
    const outcome = await choosePositioning(write);
    expect(outcome).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryAfter: expect.any(Number),
    });
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
    expect(written()).toMatchObject([
      { outcome: "limited", reason: "rate-limited", level: "warn" },
    ]);
  });

  it("a store that cannot count fails closed with SERVICE_UNAVAILABLE", async () => {
    state.mode = "unavailable";
    const outcome = await choosePositioning(write);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "SERVICE_UNAVAILABLE" });
    expect(state.saved).toEqual([]);
  });

  it("a workspace the person is not in is refused as workspace-not-found, and no session or role as its own word", async () => {
    state.throws = new Denied(404, "not-a-member");
    expect(await choosePositioning(write)).toMatchObject({
      ok: false,
      error: "workspace-not-found",
      code: "NOT_FOUND",
    });
    state.throws = new Denied(401, "no-session");
    expect(await choosePositioning(write)).toMatchObject({ ok: false, error: "signed-out" });
    state.throws = new Denied(403, "role-too-low");
    expect(await choosePositioning(write)).toMatchObject({ ok: false, error: "forbidden" });
    expect(state.saved).toEqual([]);
  });

  it("an unknown project and a project of another workspace give one not-found body, and save nothing", async () => {
    const unknown = await choosePositioning({ ...write, projectId: UNKNOWN_ID });
    const other = await choosePositioning({ ...skip, projectId: UNKNOWN_ID });
    expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(other)).toEqual(body(unknown));
    expect(state.saved).toEqual([]);
    expect(everything(unknown)).not.toContain(UNKNOWN_ID);
    expect(everything(unknown)).not.toContain(STATEMENT);
  });

  it("an input the check refuses is invalid-input with paths and kinds only, after the limit and before the service", async () => {
    const outcome = await choosePositioning({
      kind: "written",
      projectId: PROJECT_ID,
      statement: "   ",
      by: "admin",
    });
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      code: "INVALID_INPUT",
      retryable: false,
      problems: [
        { path: "statement", kind: "required" },
        { path: "by", kind: "unknown-key" },
      ],
    });
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
    expect(state.saved).toEqual([]);
    expect(everything(outcome)).not.toContain("admin");
    expect(written()).toMatchObject([{ outcome: "refused", reason: "invalid-input" }]);
  });

  it("a statement past 300 characters is refused with no call to the service", async () => {
    const outcome = await choosePositioning({ ...write, statement: "x".repeat(301) });
    expect(outcome).toMatchObject({ problems: [{ path: "statement", kind: "too-long" }] });
    expect(state.order).not.toContain("save");
    expect(everything(outcome)).not.toContain("xxxxx");
  });
});

// T14, D4.
describe("agreed stays agreed", () => {
  it("after a written, a skipped and a second written answer invalid-input and save nothing more", async () => {
    expect(await choosePositioning(write)).toMatchObject({ ok: true });
    const afterSkip = await choosePositioning(skip);
    const afterWrite = await choosePositioning({ ...write, statement: "another statement" });
    for (const outcome of [afterSkip, afterWrite]) {
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    }
    expect(state.saved.map((s) => s.choice.kind)).toEqual(["written"]);
    expect(everything(afterWrite)).not.toContain("another statement");
    expect(written().at(-1)).toMatchObject({ outcome: "refused", reason: "invalid-input" });
  });
});

const OPTIONS = [{ statement: "S1 first" }, { statement: "S2 second" }, { statement: "S3 third" }];
const knownDraft = (over: Partial<(typeof state.drafts)[number]> = {}) => ({
  id: DRAFT_ID,
  projectId: PROJECT_ID,
  current: true,
  options: OPTIONS,
  ...over,
});

// T35, row 18.
describe("pick", () => {
  it("saves the option's statement copied on the server, with the draft id and option, and leaves the draft as it was", async () => {
    state.drafts = [knownDraft()];
    const before = JSON.stringify(state.drafts);
    const outcome = await choosePositioning({
      kind: "picked",
      projectId: PROJECT_ID,
      draftId: DRAFT_ID,
      option: 2,
    });
    expect(outcome).toEqual({ ok: true, value: { kind: "picked" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        choice: {
          kind: "picked",
          projectId: PROJECT_ID,
          draftId: DRAFT_ID,
          option: 2,
          statement: "S2 second",
        },
      },
    ]);
    expect(JSON.stringify(state.drafts)).toBe(before);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(written()).toMatchObject([{ route: "business/choosePositioning", outcome: "ok" }]);
    for (const secret of ["S2 second", DRAFT_ID, PROJECT_ID, "ws-1"]) {
      expect(everything(outcome)).not.toContain(secret);
    }
  });

  it("refuses a statement sent with a pick: the client's words are never the saved statement", async () => {
    state.drafts = [knownDraft()];
    const outcome = await choosePositioning({
      kind: "picked",
      projectId: PROJECT_ID,
      draftId: DRAFT_ID,
      option: 2,
      statement: "Written by the client",
    });
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "statement", kind: "unknown-key" }],
    });
    expect(state.saved).toEqual([]);
    expect(everything(outcome)).not.toContain("Written by the client");
  });
});

// T35, row 19.
describe("edit", () => {
  const edit = (statement: string | undefined, option = 1) => ({
    kind: "edited",
    projectId: PROJECT_ID,
    draftId: DRAFT_ID,
    option,
    ...(statement === undefined ? {} : { statement }),
  });

  it("saves the trimmed text as edited, naming the draft and the option", async () => {
    state.drafts = [knownDraft()];
    const outcome = await choosePositioning(edit("  S1 first, changed  "));
    expect(outcome).toEqual({ ok: true, value: { kind: "edited" } });
    expect(state.saved.map((s) => s.choice)).toEqual([
      {
        kind: "edited",
        projectId: PROJECT_ID,
        draftId: DRAFT_ID,
        option: 1,
        statement: "S1 first, changed",
      },
    ]);
    expect(everything(outcome)).not.toContain("S1 first, changed");
  });

  it("saves an edit equal to its option as picked (W4)", async () => {
    state.drafts = [knownDraft()];
    const outcome = await choosePositioning(edit("  S1 first "));
    expect(outcome).toEqual({ ok: true, value: { kind: "picked" } });
    expect(state.saved.map((s) => [s.choice.kind, s.choice.statement])).toEqual([
      ["picked", "S1 first"],
    ]);
  });

  it("refuses an edit with no statement or an empty one, with the path and kind only", async () => {
    state.drafts = [knownDraft()];
    for (const statement of [undefined, "   "]) {
      expect(await choosePositioning(edit(statement))).toMatchObject({
        ok: false,
        error: "invalid-input",
        problems: [{ path: "statement", kind: "required" }],
      });
    }
    expect(state.saved).toEqual([]);
  });
});

// T36, row 20.
describe("draft references", () => {
  const pick = (over: Record<string, unknown> = {}) => ({
    kind: "picked",
    projectId: PROJECT_ID,
    draftId: DRAFT_ID,
    option: 1,
    ...over,
  });

  it("a draft of another project, an option the draft lacks, a draft of an older intake and an unknown draft give one not-found body, the one of an unknown project, and save nothing", async () => {
    const unknownProject = await choosePositioning({ ...pick(), projectId: UNKNOWN_ID });
    expect(unknownProject).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    const cases: [string, typeof state.drafts, Record<string, unknown>][] = [
      ["another project", [knownDraft({ projectId: UNKNOWN_ID })], pick()],
      [
        "an option the draft lacks",
        [knownDraft({ options: OPTIONS.slice(0, 2) })],
        pick({ option: 3 }),
      ],
      ["an older intake", [knownDraft({ current: false })], pick()],
      ["an unknown draft", [], pick()],
    ];
    for (const [, drafts, input] of cases) {
      state.drafts = drafts;
      const outcome = await choosePositioning(input);
      expect(outcome).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
      expect(body(outcome)).toEqual(body(unknownProject));
      expect(everything(outcome)).not.toContain(DRAFT_ID);
    }
    expect(state.saved).toEqual([]);
  });
});

// T36, row 21.
describe("skip, then pick", () => {
  it("accepts both: a skip, then a pick, two rows in that order", async () => {
    state.drafts = [knownDraft()];
    expect(await choosePositioning(skip)).toEqual({ ok: true, value: { kind: "skipped" } });
    expect(
      await choosePositioning({
        kind: "picked",
        projectId: PROJECT_ID,
        draftId: DRAFT_ID,
        option: 1,
      }),
    ).toEqual({ ok: true, value: { kind: "picked" } });
    expect(state.saved.map((s) => s.choice.kind)).toEqual(["skipped", "picked"]);
  });
});

// Row 27, the action half: U+0000 is dropped by the choice check, so the service and the column never
// see it, and a statement that is nothing else is an input problem, not an internal error.
describe("U+0000 in a statement", () => {
  it("saves a statement that held U+0000 without it, answers ok and writes no error line", async () => {
    const outcome = await choosePositioning({
      kind: "written",
      projectId: PROJECT_ID,
      statement: "a\u0000b",
    });
    expect(outcome).toEqual({ ok: true, value: { kind: "written" } });
    expect(state.saved.map((s) => s.choice.statement)).toEqual(["ab"]);
    expect(written().filter((l) => l["level"] === "error")).toEqual([]);
    expect(written()).toMatchObject([{ outcome: "ok", level: "info" }]);
  });

  it("answers invalid-input at the statement for one that is only U+0000 and spaces, saves nothing, and is no failure", async () => {
    const outcome = await choosePositioning({
      kind: "written",
      projectId: PROJECT_ID,
      statement: "\u0000 \u0000 ",
    });
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      code: "INVALID_INPUT",
      problems: [{ path: "statement", kind: "required" }],
    });
    expect(state.saved).toEqual([]);
    expect(state.order).not.toContain("save");
    expect(JSON.stringify(outcome)).not.toContain("INTERNAL_ERROR");
    expect(written().filter((l) => l["level"] === "error")).toEqual([]);
    expect(written()).toMatchObject([{ outcome: "refused", reason: "invalid-input" }]);
  });
});

// Row 30, the action half: a choice after an agreed one is `gate-passed` at the service and
// `invalid-input` here, never `failed`, whatever the order of the two calls was.
describe("agreed stays agreed, as the service answers it under a race", () => {
  it("answers gate-passed as invalid-input with no error line, for a skip and for a second write", async () => {
    state.throws = new BusinessError("gate-passed");
    for (const input of [skip, write]) {
      const outcome = await choosePositioning(input);
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
      expect(JSON.stringify(outcome)).not.toContain("INTERNAL_ERROR");
    }
    expect(written().filter((l) => l["level"] === "error")).toEqual([]);
  });
});

const DRAFT = { id: "55555555-5555-4555-8555-555555555555", intakeId: INTAKE_ID };
const GIVEN = {
  id: "c-1",
  intakeId: INTAKE_ID,
  kind: "written",
  statement: "Fresh roasted coffee",
  draftId: null,
  option: null,
  createdAt: "2026-11-19T04:00:00.000Z",
};
const ask = { projectId: PROJECT_ID };

// T34, row 16.
describe("draft door", () => {
  it("a value answer that is empty and a gate that is given are refused at step 5: no limit, no call, nothing saved", async () => {
    for (const opened of [openedProject({ value: undefined }), openedProject({ choice: GIVEN })]) {
      state.opened = opened;
      state.order = [];
      const outcome = await draftPositioning(ask);
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
      expect(state.consumed).toEqual([]);
      expect(state.order).toEqual(["session", "allow-list", "open"]);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(state.draftsSaved).toEqual([]);
    }
    expect(written()).toMatchObject([
      { route: "business/draftPositioning", outcome: "refused", reason: "invalid-input" },
      { route: "business/draftPositioning", outcome: "refused", reason: "invalid-input" },
    ]);
  });

  it("a stored draft of the newest intake is returned: no limit consumed, no call, nothing saved", async () => {
    state.opened = openedProject({ draft: DRAFT });
    const outcome = await draftPositioning(ask);
    expect(outcome).toEqual({ ok: true, value: { draftId: DRAFT.id } });
    expect(state.consumed).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list", "open"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.draftsSaved).toEqual([]);
    expect(written()).toMatchObject([
      { route: "business/draftPositioning", outcome: "ok", level: "info" },
    ]);
  });

  it("another workspace's project and an unknown id give one not-found body, with no limit consumed", async () => {
    state.openThrows = new BusinessError("not-found");
    const first = await draftPositioning({ projectId: UNKNOWN_ID });
    const second = await draftPositioning({ projectId: "33333333-3333-4333-8333-333333333333" });
    expect(first).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(second)).toEqual(body(first));
    expect(state.consumed).toEqual([]);
    expect(everything(first)).not.toContain(UNKNOWN_ID);
  });

  it("an input that is no project id, or holds another key, is invalid-input at step 3, before the project is read", async () => {
    for (const input of [
      { projectId: "not-an-id" },
      { projectId: PROJECT_ID, workspaceId: "ws-2" },
      {},
      "nope",
      null,
    ]) {
      state.order = [];
      expect(await draftPositioning(input)).toMatchObject({
        ok: false,
        error: "invalid-input",
        code: "INVALID_INPUT",
      });
      expect(state.order).toEqual(["session", "allow-list"]);
    }
    expect(state.consumed).toEqual([]);
  });

  it("with no session counts the signed-out limit by address and answers signed-out; an address not on the list is forbidden with nothing counted", async () => {
    state.session = null;
    expect(await draftPositioning(ask)).toMatchObject({
      ok: false,
      error: "signed-out",
      code: "UNAUTHENTICATED",
    });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.order).toEqual(["session", "consume"]);
    state.consumed = [];
    state.order = [];
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list"]);
    for (const secret of ["stranger", "example.com"]) {
      expect(everything(outcome)).not.toContain(secret);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("a workspace the person is not in, and a stored row that no longer parses, are answered without detail", async () => {
    state.openThrows = new Denied(404, "not-a-member");
    expect(await draftPositioning(ask)).toMatchObject({ error: "workspace-not-found" });
    state.openThrows = new BusinessError("invalid-stored");
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(state.consumed).toEqual([]);
  });
});

// T33, row 15.
describe("draft stopped", () => {
  const nothingStored = () => {
    expect(state.draftsSaved).toEqual([]);
    expect(state.order).not.toContain("save-draft");
  };
  const secrets = [FAKE_KEY, IDEA, VALUE, "reader@example.com", "ws-1", PROJECT_ID];

  it("drafts: the limit, then the cap, then one call to the one pinned model, then the usage and the save", async () => {
    const outcome = await draftPositioning(ask);
    expect(outcome).toEqual({ ok: true, value: { draftId: SAVED_DRAFT_ID } });
    expect(state.order).toEqual([
      "session",
      "allow-list",
      "open",
      "consume",
      "spend-check",
      "fetch",
      "usage",
      "save-draft",
    ]);
    expect(state.consumed).toEqual(["ai-read:u:P"]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(fetchSpy.mock.calls[0]?.[1].body ?? "{}");
    expect(sent.model).toBe(PINNED);
    expect(sent).not.toHaveProperty("models");
    expect(sent.provider).toMatchObject({
      zdr: true,
      data_collection: "deny",
      allow_fallbacks: false,
    });
    expect(fetchSpy.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    expect(state.draftsSaved).toMatchObject([
      {
        job: "positioning-draft",
        intakeId: INTAKE_ID,
        modelId: PINNED,
        adapter: { id: "positioning-draft", version: "1" },
        promptVersion: "positioning-prompt-1",
      },
    ]);
    expect(state.usage).toEqual([
      { job: "positioning-draft", model: PINNED, costMicroUsd: 11_300 },
    ]);
    expect(written()).toMatchObject([
      { step: "positioning-draft", outcome: "drafted", level: "info" },
      { route: "business/draftPositioning", outcome: "ok", level: "info" },
    ]);
    // No answer, option, quote, id or key reaches a line or the outcome.
    const all = everything(outcome);
    for (const secret of [...secrets, TYPED.options[0]?.statement ?? "", "คนทำงานในย่านอารีย์"]) {
      expect(all).not.toContain(secret);
    }
  });

  it("no key: the limit and the cap are counted, no call is made, nothing is stored", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({
      ok: false,
      error: "ai-not-configured",
      code: "INTERNAL_ERROR",
    });
    expect(state.order).toEqual(["session", "allow-list", "open", "consume", "spend-check"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "not-configured" }]);
    expect(written().at(-1)).toMatchObject({
      route: "business/draftPositioning",
      outcome: "failed",
      reason: "ai-not-configured",
    });
    expect(everything(outcome)).not.toContain(FAKE_KEY);
  });

  it("a call that fails: ai-failed after one call and no other model, nothing stored", async () => {
    fetchSpy.mockImplementation(async () => {
      state.order.push("fetch");
      return modelReply(`failed for ${IDEA} with ${FAKE_KEY}`, 500);
    });
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "ai-failed", code: "UPSTREAM_FAILED" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(state.order.slice(3)).toEqual(["consume", "spend-check", "fetch", "usage"]);
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "failed" }]);
    for (const secret of secrets) expect(everything(outcome)).not.toContain(secret);
  });

  it("a call that times out: ai-failed, with the abort signal passed, nothing stored", async () => {
    fetchSpy.mockImplementation(async () => {
      state.order.push("fetch");
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "ai-failed", code: "UPSTREAM_FAILED" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "failed" }]);
  });

  it("an answer that breaks a check is refused whole: ai-failed, nothing stored, the word refused", async () => {
    fetchSpy.mockImplementation(async () => {
      state.order.push("fetch");
      return modelReply(JSON.stringify({ options: [TYPED.options[0]] }));
    });
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "ai-failed", code: "UPSTREAM_FAILED" });
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "refused" }]);
    expect(everything(outcome)).not.toContain(TYPED.options[0]?.statement);
  });

  it("the ai-read limit used up: ai-rate-limited with how long to wait, no cap check, no call", async () => {
    for (const w of LIMITS["ai-read"].windows) {
      state.counts.set(`${keyOf(LIMITS["ai-read"], { user: "P" })}@${w.seconds}`, w.max);
    }
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({
      ok: false,
      error: "ai-rate-limited",
      code: "RATE_LIMITED",
      retryAfter: expect.any(Number),
    });
    expect(state.order).toEqual(["session", "allow-list", "open", "consume"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "limited", limit: "ai-read" }]);
    expect(written().at(-1)).toMatchObject({ outcome: "limited", reason: "ai-rate-limited" });
  });

  it("a store that cannot count the limit fails closed: ai-failed, SERVICE_UNAVAILABLE, no call", async () => {
    state.mode = "unavailable";
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "ai-failed", code: "SERVICE_UNAVAILABLE" });
    expect(state.order).toEqual(["session", "allow-list", "open", "consume"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "unavailable" }]);
  });

  it("the spend cap reached: ai-spend-cap after the limit, no call, nothing stored", async () => {
    state.cap = "capped";
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "ai-spend-cap", code: "AI_SPEND_CAP" });
    expect(state.order).toEqual(["session", "allow-list", "open", "consume", "spend-check"]);
    expect(state.consumed).toEqual(["ai-read:u:P"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    nothingStored();
    expect(draftStep()).toMatchObject([{ outcome: "spend-cap" }]);
    expect(written().at(-1)).toMatchObject({ outcome: "limited", reason: "ai-spend-cap" });
  });

  it.each(["unavailable", "throws"] as const)(
    "a spend cap that cannot be read (%s) fails closed: ai-failed, SERVICE_UNAVAILABLE, no call",
    async (cap) => {
      state.cap = cap;
      const outcome = await draftPositioning(ask);
      expect(outcome).toMatchObject({ ok: false, error: "ai-failed", code: "SERVICE_UNAVAILABLE" });
      expect(fetchSpy).not.toHaveBeenCalled();
      nothingStored();
      expect(draftStep()).toMatchObject([{ outcome: "unavailable" }]);
    },
  );

  it("a usage record that fails never costs the person the draft", async () => {
    state.recordThrows = true;
    expect(await draftPositioning(ask)).toEqual({ ok: true, value: { draftId: SAVED_DRAFT_ID } });
    expect(written().map((l) => l["step"])).toContain("ai-usage");
  });

  it("a save that fails answers the draft a second request stored (the project read again holds one)", async () => {
    state.saveDraftThrows = new BusinessError("not-saved");
    // The first read (step 4) finds no draft; the read after the failed save finds the other request's.
    state.openSeq = [openedProject(), openedProject({ draft: DRAFT })];
    const outcome = await draftPositioning(ask);
    expect(outcome).toEqual({ ok: true, value: { draftId: DRAFT.id } });
    expect(state.draftsSaved).toEqual([]);
    expect(draftStep()).toMatchObject([{ outcome: "drafted" }]);
  });

  it("a save that fails with no other draft there answers failed, with its own word and no option in a line", async () => {
    state.saveDraftThrows = new BusinessError("not-saved");
    const outcome = await draftPositioning(ask);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(draftStep()).toMatchObject([{ outcome: "save-failed" }]);
    expect(written().at(-1)).toMatchObject({ outcome: "failed", reason: "failed" });
    for (const secret of [...secrets, TYPED.options[0]?.statement ?? ""]) {
      expect(everything(outcome)).not.toContain(secret);
    }
  });
});
