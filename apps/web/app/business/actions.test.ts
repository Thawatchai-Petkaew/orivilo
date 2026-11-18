import { type Limit, LIMITS, type Subject } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-281 tech notes section 13, T15 to T19 (spec rows 6, 8, 9, 11 and 12): `createProject`, steps 1
// to 5 of `business-door-1`. The service is a spy and the limiter counts in memory, so these tests
// prove the order (session, list, limit, check, save), what is saved, and what reaches a line.

const state = vi.hoisted(() => ({
  session: null as {
    user: { id: string; email?: string };
    session: { activeOrganizationId: string | null };
  } | null,
  order: [] as string[],
  ip: "ip-1",
  mode: "count" as "count" | "unavailable",
  counts: new Map<string, number>(),
  consumed: [] as string[],
  saved: [] as { workspaceId: string | null; intake: unknown }[],
  /** What the service does on its next call: succeed, or throw this. */
  createThrows: null as unknown,
}));

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
    businessService: () => ({
      async create(_h: Headers, workspaceId: string | null, intake: unknown) {
        state.order.push("save");
        state.saved.push({ workspaceId, intake });
        if (state.createThrows !== null) throw state.createThrows;
        return { projectId: "project-1" };
      },
    }),
  };
});

const { createProject } = await import("./actions");
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
  state.counts.clear();
  state.consumed = [];
  state.saved = [];
  state.createThrows = null;
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
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
    expect(outcome).toEqual({ ok: true, value: { projectId: "project-1" } });
    // Step 5 gets the person's active workspace and the checked intake, the website as kept.
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        intake: { ...INTAKE, website: "https://cafe.example/menu" },
      },
    ]);
    expect(state.consumed).toEqual([`write:u:P`]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    const lines = written();
    expect(lines).toMatchObject([
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
