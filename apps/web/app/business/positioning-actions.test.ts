import { type Limit, LIMITS, type Subject } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-285 tech notes section 12, T11 to T15 (spec rows 2, 4 and 6): `choosePositioning`, the choice
// door of `positioning-door-1`. The service is a fake that keeps the rows it was given and refuses
// as the real one does (the real one is proven against a database in `business.integration.test.ts`),
// and the limiter counts in memory, so these tests prove the order (session, list, limit, check,
// save), what is saved, the one answer for what is not there, and what reaches a line.

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
  saved: [] as { workspaceId: string; choice: { kind: string; statement?: string } }[],
  /** The project ids the fake service finds in the session's workspace. */
  known: ["11111111-1111-4111-8111-111111111111"] as string[],
  throws: null as unknown,
}));

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999";
const DRAFT_ID = "33333333-3333-4333-8333-333333333333";

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
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  return {
    ...real,
    positioningService: () => ({
      async choose(
        _h: Headers,
        workspaceId: string,
        choice: { kind: string; projectId: string; statement?: string },
      ) {
        state.order.push("save");
        if (state.throws !== null) throw state.throws;
        if (!state.known.includes(choice.projectId)) throw new real.BusinessError("not-found");
        // As the service: an agreed choice on the intake refuses, and no draft table exists yet.
        if (state.saved.some((s) => s.choice.kind !== "skipped")) {
          throw new real.BusinessError("gate-passed");
        }
        if (choice.kind === "picked" || choice.kind === "edited") {
          throw new real.BusinessError("not-found");
        }
        state.saved.push({ workspaceId, choice });
        return { kind: choice.kind };
      },
    }),
  };
});

const { choosePositioning } = await import("./positioning-actions");
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

// T15, PR 1 only: no draft table, so no draft to name.
describe("picked before drafts", () => {
  it("answers the one not-found body for a picked and an edited choice", async () => {
    const picked = await choosePositioning({
      kind: "picked",
      projectId: PROJECT_ID,
      draftId: DRAFT_ID,
      option: 1,
    });
    const edited = await choosePositioning({
      kind: "edited",
      projectId: PROJECT_ID,
      draftId: DRAFT_ID,
      option: 2,
      statement: STATEMENT,
    });
    const unknown = await choosePositioning({ ...skip, projectId: UNKNOWN_ID });
    expect(picked).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(edited)).toEqual(body(picked));
    expect(body(picked)).toEqual(body(unknown));
    expect(state.saved).toEqual([]);
    expect(everything(edited)).not.toContain(STATEMENT);
    expect(everything(picked)).not.toContain(DRAFT_ID);
  });
});
