import { type Limit, LIMITS, type Subject } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import type { GateState, StoredEntry } from "@orivilo/intent-engine";
import { PERSONALITY_AXES } from "@orivilo/intent-engine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-291 tech notes section 13, T16 to T18 (spec rows 2, 4, 5 and 7): `enterFoundation`, the door
// of `foundation-door-1`. The service is a fake that keeps the rows it was given and decides as the
// real one does, with the engine's own `entryAllowed` (the real one is proven against a database in
// `foundation.integration.test.ts`), and the limiter counts in memory, so these tests prove the
// order (session, list, limit, check, save), what is saved, the one answer for what is not there,
// and what reaches a line.

const state = vi.hoisted(() => ({
  session: null as {
    user: { id: string; email?: string };
    session: { activeOrganizationId: string | null };
  } | null,
  order: [] as string[],
  mode: "count" as "count" | "unavailable",
  counts: new Map<string, number>(),
  consumed: [] as string[],
  /** The rows the fake service saved, newest last. */
  saved: [] as { workspaceId: string; entry: { node: string; kind: string; payload: unknown } }[],
  /** The project ids the fake service finds in the session's workspace. */
  known: ["11111111-1111-4111-8111-111111111111"] as string[],
  /** The positioning gate the fake service reads: agreed, skipped, stale or no choice. */
  positioning: "agreed" as "agreed" | "skipped" | "stale" | "none",
  throws: null as unknown,
}));

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999";

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
  const engine = await import("@orivilo/intent-engine");
  const gates: Record<typeof state.positioning, { state: GateState; skipped: boolean }> = {
    agreed: { state: "given", skipped: false },
    skipped: { state: "open", skipped: true },
    stale: { state: "open", skipped: false },
    none: { state: "open", skipped: false },
  };
  return {
    ...real,
    foundationService: () => ({
      async enter(
        _h: Headers,
        workspaceId: string,
        entry: { projectId: string; node: string; kind: string; payload: unknown },
      ) {
        state.order.push("save");
        if (state.throws !== null) throw state.throws;
        if (!state.known.includes(entry.projectId)) throw new real.BusinessError("not-found");
        // As the service: the "Allowed when" column of `foundation-entry-1`, by the engine's own
        // function, over the rows saved so far, newest first.
        const entries = state.saved
          .map((s, i) => ({
            id: `e-${i}`,
            node: s.entry.node,
            kind: s.entry.kind,
            payload: s.entry.payload,
            createdAt: new Date(2026, 10, 19, 12, 0, i).toISOString(),
          }))
          .reverse() as StoredEntry[];
        const foundation = engine.foundationState(gates[state.positioning], entries);
        if (!engine.entryAllowed(entry as never, foundation)) {
          throw new real.BusinessError("out-of-order");
        }
        state.saved.push({
          workspaceId,
          entry: { node: entry.node, kind: entry.kind, payload: entry.payload },
        });
        return { node: entry.node, kind: entry.kind };
      },
    }),
  };
});

const { enterFoundation } = await import("./foundation-actions");
const { BusinessError, Denied } = await import("@orivilo/auth");
const { MissingEnvError } = await import("@orivilo/db");

// Fixtures only: addresses under example.com and example.test (ORV-268).
const LIST = "reader@example.com,second@example.test";
const person = {
  user: { id: "P", email: "reader@example.com" },
  session: { activeOrganizationId: "ws-1" },
};
const WORDS = "อบอุ่น เป็นกันเอง ใส่ใจ";
const NEVER = "ห้ามดูเย็นชาเหมือนธนาคาร";
const axes = Object.fromEntries(PERSONALITY_AXES.map((axis) => [axis, 75]));
const give = {
  projectId: PROJECT_ID,
  node: "identity-frame",
  kind: "given",
  payload: { axes, person: `  ${WORDS}  ` },
};
const skip = { projectId: PROJECT_ID, node: "identity-frame", kind: "skipped", payload: {} };

let capture: ReturnType<typeof captureLines>;
const written = () => capture.lines.map((line) => expectLineShape(line));
const everything = (outcome: unknown) =>
  JSON.stringify([outcome, capture.lines.map((l) => l.args)]);
/** The body of a refusal without the request id, which is made for each call. */
const body = (outcome: unknown) =>
  Object.fromEntries(Object.entries(outcome as object).filter(([key]) => key !== "requestId"));
/**
 * The only places an axis value could leak: the body of the outcome and the parsed log lines, with
 * the two fields that hold digits of their own (the random request id and the duration) left out,
 * so a short number such as "75" cannot match a UUID or a duration.
 */
const whereAxisCouldLeak = (outcome: unknown) =>
  JSON.stringify([
    body(outcome),
    written().map((fields) =>
      Object.fromEntries(
        Object.entries(fields).filter(([key]) => key !== "requestId" && key !== "durationMs"),
      ),
    ),
  ]);
/** Text a person typed or a value the entry carries: none of it may reach a line or a body. */
const SECRETS = [WORDS, NEVER, PROJECT_ID, UNKNOWN_ID, "reader@example.com", "ws-1"];

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
  state.positioning = "agreed";
  state.throws = null;
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// T16, rows 2 and 4.
describe("give the personality", () => {
  it("answers ok with the node and the kind, saves the trimmed entry in the session's workspace, and logs closed words", async () => {
    const outcome = await enterFoundation({
      ...give,
      payload: { axes, person: `  ${WORDS}  `, never: `  ${NEVER}  ` },
    });
    expect(outcome).toEqual({ ok: true, value: { node: "identity-frame", kind: "given" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        entry: {
          node: "identity-frame",
          kind: "given",
          payload: { axes, person: WORDS, never: NEVER },
        },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    // No answer, axis value, id, address or workspace reaches a line or a body.
    const all = everything(outcome);
    for (const secret of SECRETS) expect(all).not.toContain(secret);
    expect(whereAxisCouldLeak(outcome)).not.toContain("75");
  });

  it("never reaches a line with the answer when the save fails", async () => {
    state.throws = new Error(`insert failed for ${WORDS}`);
    const outcome = await enterFoundation(give);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    for (const secret of SECRETS) expect(everything(outcome)).not.toContain(secret);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "failed", reason: "unexpected" },
    ]);
  });

  it("answers failed for a save the database refused, with no answer in it", async () => {
    state.throws = new BusinessError("not-saved");
    const outcome = await enterFoundation(give);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    for (const secret of SECRETS) expect(everything(outcome)).not.toContain(secret);
    expect(written()).toMatchObject([{ outcome: "failed", reason: "failed" }]);
  });

  it("answers failed for a stored row that no longer parses", async () => {
    state.throws = new BusinessError("invalid-stored");
    expect(await enterFoundation(give)).toMatchObject({ ok: false, error: "failed" });
    expect(written()).toMatchObject([{ outcome: "failed", reason: "failed" }]);
  });

  it("answers not-configured when the database settings are missing", async () => {
    state.throws = new MissingEnvError("DATABASE_URL");
    expect(await enterFoundation(give)).toMatchObject({ ok: false, error: "not-configured" });
  });
});

describe("skip, then give", () => {
  it("accepts both calls and keeps two rows, the given one newest", async () => {
    expect(await enterFoundation(skip)).toEqual({
      ok: true,
      value: { node: "identity-frame", kind: "skipped" },
    });
    expect(await enterFoundation(give)).toEqual({
      ok: true,
      value: { node: "identity-frame", kind: "given" },
    });
    expect(state.saved.map((s) => s.entry.kind)).toEqual(["skipped", "given"]);
    expect(written().map((l) => l["outcome"])).toEqual(["ok", "ok"]);
    for (const secret of SECRETS) expect(everything(capture.lines)).not.toContain(secret);
  });
});

// T17, row 5.
describe("waits for positioning", () => {
  it.each(["none", "stale"] as const)(
    "with positioning %s: a given and a skipped entry called directly are invalid-input, and nothing is saved",
    async (positioning) => {
      state.positioning = positioning;
      for (const entry of [give, skip]) {
        const outcome = await enterFoundation(entry);
        expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
        expect(outcome).not.toHaveProperty("problems");
        for (const secret of SECRETS) expect(everything(outcome)).not.toContain(secret);
      }
      expect(state.saved).toEqual([]);
      expect(written().map((l) => [l["outcome"], l["reason"]])).toEqual([
        ["refused", "invalid-input"],
        ["refused", "invalid-input"],
      ]);
    },
  );

  it("with positioning skipped: both are accepted", async () => {
    state.positioning = "skipped";
    expect(await enterFoundation(skip)).toMatchObject({ ok: true });
    expect(await enterFoundation(give)).toMatchObject({ ok: true });
    expect(state.saved).toHaveLength(2);
  });
});

// T18, row 7.
describe("entry door", () => {
  it("signed-out: counts the signed-out limit by IP, then answers signed-out, and saves nothing", async () => {
    state.session = null;
    const outcome = await enterFoundation(give);
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("forbidden: answers forbidden with no address, counts nothing and saves nothing", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await enterFoundation(give);
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list"]);
    const all = everything(outcome);
    for (const secret of ["stranger", "example.com", WORDS]) expect(all).not.toContain(secret);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "refused", reason: "forbidden" },
    ]);
  });

  it("an unset list denies everyone", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", "");
    expect(await enterFoundation(give)).toMatchObject({ ok: false, error: "forbidden" });
    expect(state.consumed).toEqual([]);
  });

  it("rate-limited: answers RATE_LIMITED with how long to wait, and saves nothing", async () => {
    for (const w of LIMITS.write.windows) {
      state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
    }
    const outcome = await enterFoundation(give);
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
    const outcome = await enterFoundation(give);
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "SERVICE_UNAVAILABLE" });
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
  });

  it("a workspace the person is not in is refused as workspace-not-found, and no session or role as its own word", async () => {
    state.throws = new Denied(404, "not-a-member");
    expect(await enterFoundation(give)).toMatchObject({
      ok: false,
      error: "workspace-not-found",
      code: "NOT_FOUND",
    });
    state.throws = new Denied(401, "no-session");
    expect(await enterFoundation(give)).toMatchObject({ ok: false, error: "signed-out" });
    state.throws = new Denied(403, "role-too-low");
    expect(await enterFoundation(give)).toMatchObject({ ok: false, error: "forbidden" });
    expect(state.saved).toEqual([]);
  });

  it("an unknown project and a project of another workspace give one not-found body, and save nothing", async () => {
    const unknown = await enterFoundation({ ...give, projectId: UNKNOWN_ID });
    const other = await enterFoundation({ ...skip, projectId: UNKNOWN_ID });
    expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(other)).toEqual(body(unknown));
    expect(state.saved).toEqual([]);
    for (const secret of [UNKNOWN_ID, WORDS]) expect(everything(unknown)).not.toContain(secret);
    expect(written()).toMatchObject([
      { outcome: "refused", reason: "not-found" },
      { outcome: "refused", reason: "not-found" },
    ]);
  });

  it("an input the check refuses is invalid-input with paths and kinds only, after the limit and before the service", async () => {
    const outcome = await enterFoundation({
      ...give,
      payload: { axes: { ...axes, warm: 60 }, person: "x".repeat(2001), never: NEVER, by: "admin" },
    });
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      code: "INVALID_INPUT",
      retryable: false,
      problems: [
        { path: "payload.axes.warm", kind: "invalid" },
        { path: "payload.person", kind: "too-long" },
        { path: "payload.by", kind: "unknown-key" },
      ],
    });
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
    expect(state.saved).toEqual([]);
    for (const secret of ["admin", "xxxxx", NEVER]) {
      expect(everything(outcome)).not.toContain(secret);
    }
    // The refused axis value, searched where it could leak (not in the request id or the duration).
    expect(whereAxisCouldLeak(outcome)).not.toContain("60");
    expect(written()).toMatchObject([{ outcome: "refused", reason: "invalid-input" }]);
  });

  it("an entry for a node the contract does not hold, and an input that is no object, are refused before the service", async () => {
    for (const bad of [
      { ...give, node: "color" },
      "not an entry",
      null,
      { ...skip, kind: "given" },
    ]) {
      const outcome = await enterFoundation(bad);
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input" });
    }
    expect(state.order.filter((s) => s === "save")).toEqual([]);
  });
});

describe("given stays given", () => {
  it("after a given, a given and a skipped entry answer invalid-input and save nothing more", async () => {
    expect(await enterFoundation(give)).toMatchObject({ ok: true });
    const again = await enterFoundation({
      ...give,
      payload: { axes, person: "another answer" },
    });
    const afterGiven = await enterFoundation(skip);
    for (const outcome of [again, afterGiven]) {
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    }
    expect(state.saved.map((s) => s.entry.kind)).toEqual(["given"]);
    expect(everything(again)).not.toContain("another answer");
    expect(written().at(-1)).toMatchObject({ outcome: "refused", reason: "invalid-input" });
  });

  it("after a skip, a second skip answers invalid-input", async () => {
    expect(await enterFoundation(skip)).toMatchObject({ ok: true });
    expect(await enterFoundation(skip)).toMatchObject({ ok: false, error: "invalid-input" });
    expect(state.saved.map((s) => s.entry.kind)).toEqual(["skipped"]);
  });
});

// ORV-295 (slice of ORV-291, PR 2), T30, spec rows 15, 16, 18, 20 and 21: the architecture and the
// name entries through the same unchanged door. The fake service decides with the engine's own
// `entryAllowed` as above, so these tests prove what the arms add: the checked entries reach the
// save as the contract gives them, a name is allowed while positioning is open and architecture is
// not answered, and the two nodes refuse a second entry.
const NAME_TYPED = "  ORIVILO  ";
const NAME_THAI = "ชื่อลับของเรา";
const answerNo = {
  projectId: PROJECT_ID,
  node: "architecture",
  kind: "answered",
  payload: { subBrands: false },
};
const answerYes = { ...answerNo, payload: { subBrands: true } };
const giveName = (name: string) => ({
  projectId: PROJECT_ID,
  node: "name",
  kind: "given",
  payload: { name },
});

// Row 15.
describe("answer sub-brands", () => {
  it("answers ok with the node and the kind, saves one entry with subBrands false and logs closed words", async () => {
    const outcome = await enterFoundation(answerNo);
    expect(outcome).toEqual({ ok: true, value: { node: "architecture", kind: "answered" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        entry: { node: "architecture", kind: "answered", payload: { subBrands: false } },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    for (const secret of SECRETS) expect(everything(outcome)).not.toContain(secret);
  });

  it("stores no derived value: the saved payload is the answer alone", async () => {
    await enterFoundation(answerNo);
    expect(JSON.stringify(state.saved)).not.toContain("single");
    expect(JSON.stringify(state.saved)).not.toContain("architecture-derive-1");
  });

  // Row 16, the data half: the answer yes is saved too.
  it("saves the answer yes as one entry with subBrands true", async () => {
    expect(await enterFoundation(answerYes)).toMatchObject({ ok: true });
    expect(state.saved.map((s) => s.entry.payload)).toEqual([{ subBrands: true }]);
  });

  it("accepts the answer while positioning is open, skipped or stale: it is an input, not a value", async () => {
    for (const positioning of ["none", "stale", "skipped", "agreed"] as const) {
      state.saved = [];
      state.positioning = positioning;
      expect(await enterFoundation(answerNo), positioning).toMatchObject({ ok: true });
      expect(state.saved, positioning).toHaveLength(1);
    }
  });

  it("refuses a second answer, whichever it is, and an answer after a yes, with nothing more saved", async () => {
    expect(await enterFoundation(answerYes)).toMatchObject({ ok: true });
    for (const again of [answerYes, answerNo]) {
      const outcome = await enterFoundation(again);
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
      expect(outcome).not.toHaveProperty("problems");
    }
    expect(state.saved).toHaveLength(1);
  });

  it("refuses a skip and an answer that is text before the service, with the path and kind only", async () => {
    const skipped = await enterFoundation({
      projectId: PROJECT_ID,
      node: "architecture",
      kind: "skipped",
      payload: {},
    });
    expect(skipped).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "kind", kind: "invalid" }],
    });
    const text = await enterFoundation({ ...answerNo, payload: { subBrands: "no" } });
    expect(text).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "payload.subBrands", kind: "invalid" }],
    });
    expect(state.order.filter((s) => s === "save")).toEqual([]);
    expect(state.saved).toEqual([]);
  });
});

// Row 18.
describe("give a working name", () => {
  it("saves one name entry, trimmed, and no line or body holds the name", async () => {
    const outcome = await enterFoundation(giveName(NAME_TYPED));
    expect(outcome).toEqual({ ok: true, value: { node: "name", kind: "given" } });
    expect(state.saved).toEqual([
      { workspaceId: "ws-1", entry: { node: "name", kind: "given", payload: { name: "ORIVILO" } } },
    ]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    // Searched where a name could leak: the body and the parsed lines, not the request id.
    expect(whereAxisCouldLeak(outcome)).not.toContain("ORIVILO");
    for (const secret of [...SECRETS, "ORIVILO"])
      expect(whereAxisCouldLeak(outcome)).not.toContain(secret);
  });

  it("keeps a Thai name out of every line and body, on ok, on a failed save and on a refusal", async () => {
    const ok = await enterFoundation(giveName(NAME_THAI));
    expect(state.saved).toHaveLength(1);
    state.saved = [];
    state.throws = new Error(`insert failed for ${NAME_THAI}`);
    const failed = await enterFoundation(giveName(NAME_THAI));
    expect(failed).toMatchObject({ ok: false, error: "failed" });
    state.throws = new BusinessError("not-saved");
    const notSaved = await enterFoundation(giveName(NAME_THAI));
    expect(notSaved).toMatchObject({ ok: false, error: "failed" });
    state.throws = null;
    const tooLong = await enterFoundation(giveName(`${NAME_THAI}${"x".repeat(61)}`));
    expect(tooLong).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "payload.name", kind: "too-long" }],
    });
    const unknownKey = await enterFoundation({
      ...giveName(NAME_THAI),
      payload: { name: NAME_THAI, screened: NAME_THAI },
    });
    expect(unknownKey).toMatchObject({
      ok: false,
      problems: [{ path: "payload.screened", kind: "unknown-key" }],
    });
    for (const outcome of [ok, failed, notSaved, tooLong, unknownKey]) {
      expect(whereAxisCouldLeak(outcome)).not.toContain(NAME_THAI);
    }
    expect(JSON.stringify(capture.lines.map((l) => l.args))).not.toContain("ชื่อ");
  });

  it("refuses a name of white space with the field and the kind required, and saves nothing", async () => {
    const outcome = await enterFoundation(giveName("   "));
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "payload.name", kind: "required" }],
    });
    expect(state.saved).toEqual([]);
  });

  it("refuses a second name and a name skip, with nothing more saved", async () => {
    expect(await enterFoundation(giveName("First"))).toMatchObject({ ok: true });
    const again = await enterFoundation(giveName("Second"));
    expect(again).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    expect(again).not.toHaveProperty("problems");
    expect(everything(again)).not.toContain("Second");
    const skipped = await enterFoundation({
      projectId: PROJECT_ID,
      node: "name",
      kind: "skipped",
      payload: {},
    });
    expect(skipped).toMatchObject({ ok: false, error: "invalid-input" });
    expect(state.saved.map((s) => s.entry.payload)).toEqual([{ name: "First" }]);
  });

  it("accepts a name whether or not the architecture was answered no, and after a yes", async () => {
    expect(await enterFoundation(answerNo)).toMatchObject({ ok: true });
    expect(await enterFoundation(giveName("After no"))).toMatchObject({ ok: true });
    state.saved = [];
    expect(await enterFoundation(answerYes)).toMatchObject({ ok: true });
    expect(await enterFoundation(giveName("After yes"))).toMatchObject({ ok: true });
    expect(state.saved.map((s) => s.entry.node)).toEqual(["architecture", "name"]);
  });
});

// Row 20.
describe("a name ahead of positioning", () => {
  it.each(["none", "stale"] as const)(
    "with positioning %s and no architecture answer a name is saved: a name is never blocked",
    async (positioning) => {
      state.positioning = positioning;
      const outcome = await enterFoundation(giveName(NAME_TYPED));
      expect(outcome).toEqual({ ok: true, value: { node: "name", kind: "given" } });
      expect(state.saved.map((s) => s.entry.payload)).toEqual([{ name: "ORIVILO" }]);
      expect(whereAxisCouldLeak(outcome)).not.toContain("ORIVILO");
    },
  );

  it("with positioning skipped a name is saved", async () => {
    state.positioning = "skipped";
    expect(await enterFoundation(giveName("x"))).toMatchObject({ ok: true });
  });
});

// Row 21.
describe("architecture and name door", () => {
  const entries = [
    ["architecture", answerNo],
    ["name", giveName(NAME_TYPED)],
  ] as const;

  it.each(entries)(
    "%s, signed-out: counts the signed-out limit by IP, answers signed-out, saves nothing",
    async (_node, entry) => {
      state.session = null;
      const outcome = await enterFoundation(entry);
      expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
      expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
      expect(state.saved).toEqual([]);
      expect(state.order).toEqual(["session", "consume"]);
    },
  );

  it.each(entries)(
    "%s, an email off the list: forbidden, no address, nothing counted, nothing saved",
    async (_node, entry) => {
      state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
      const outcome = await enterFoundation(entry);
      expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
      expect(state.consumed).toEqual([]);
      expect(state.saved).toEqual([]);
      expect(state.order).toEqual(["session", "allow-list"]);
      for (const secret of ["stranger", "example.com", "ORIVILO"]) {
        expect(everything(outcome)).not.toContain(secret);
      }
    },
  );

  it.each(entries)(
    "%s, the write limit used up: rate-limited with retryAfter, nothing saved",
    async (_node, entry) => {
      for (const w of LIMITS.write.windows) {
        state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
      }
      const outcome = await enterFoundation(entry);
      expect(outcome).toMatchObject({
        ok: false,
        error: "rate-limited",
        code: "RATE_LIMITED",
        retryAfter: expect.any(Number),
      });
      expect(state.saved).toEqual([]);
      expect(state.order).toEqual(["session", "allow-list", "consume"]);
    },
  );

  it.each(entries)(
    "%s, another workspace's project and an unknown id: one not-found body, nothing saved",
    async (_node, entry) => {
      const unknown = await enterFoundation({ ...entry, projectId: UNKNOWN_ID });
      const other = await enterFoundation({
        ...entry,
        projectId: "22222222-2222-4222-8222-222222222222",
      });
      expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
      expect(body(other)).toEqual(body(unknown));
      expect(state.saved).toEqual([]);
      for (const secret of [UNKNOWN_ID, "ORIVILO"])
        expect(everything(unknown)).not.toContain(secret);
    },
  );

  it.each(entries)(
    "%s, a project whose node already holds an entry: invalid-input, nothing more saved",
    async (_node, entry) => {
      expect(await enterFoundation(entry)).toMatchObject({ ok: true });
      const outcome = await enterFoundation(entry);
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
      expect(state.saved).toHaveLength(1);
    },
  );

  it.each(entries)(
    "%s, the check runs after the limit and before the service",
    async (_node, entry) => {
      const outcome = await enterFoundation({ ...entry, extra: 1 });
      expect(outcome).toMatchObject({
        ok: false,
        error: "invalid-input",
        problems: [{ path: "extra", kind: "unknown-key" }],
      });
      expect(state.order).toEqual(["session", "allow-list", "consume"]);
    },
  );
});

// ORV-298 T18, rows 3 and 10: the lineup of competitor colours. Competitor names and colours are
// untrusted data: none reaches a log line or a refusal body.
const RIVAL = "SECRET-RIVAL-ก";
const RIVAL_HEX = "#5B3FD9";
const lineupEntry = (lineup: unknown = [{ name: RIVAL, hex: RIVAL_HEX }]) => ({
  projectId: PROJECT_ID,
  node: "competitive-frame",
  kind: "lineup",
  payload: { lineup },
});
/** Every competitor name and colour the tests send, whatever case it takes in a line. */
const RIVAL_TEXT = [RIVAL, RIVAL_HEX, RIVAL_HEX.toLowerCase(), "SECRET-OTHER", "#ZZZZZZ"];

describe("give the lineup", () => {
  it("answers ok with the node and the kind, saves the checked lineup in the session's workspace, and logs closed words", async () => {
    const outcome = await enterFoundation(
      lineupEntry([
        { name: `  ${RIVAL}  `, hex: RIVAL_HEX.toLowerCase() },
        { name: "SECRET-OTHER", hex: "#0a9bfe" },
      ]),
    );
    expect(outcome).toEqual({ ok: true, value: { node: "competitive-frame", kind: "lineup" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        entry: {
          node: "competitive-frame",
          kind: "lineup",
          payload: {
            lineup: [
              { name: RIVAL, hex: RIVAL_HEX },
              { name: "SECRET-OTHER", hex: "#0A9BFE" },
            ],
          },
        },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    const all = everything(outcome);
    for (const secret of [...SECRETS, ...RIVAL_TEXT]) expect(all).not.toContain(secret);
    for (const secret of [...SECRETS, ...RIVAL_TEXT]) {
      expect(whereAxisCouldLeak(outcome)).not.toContain(secret);
    }
  });

  it("never reaches a line with a competitor when the save fails", async () => {
    state.throws = new Error(`insert failed for ${RIVAL} ${RIVAL_HEX}`);
    const outcome = await enterFoundation(lineupEntry());
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    for (const secret of [...SECRETS, ...RIVAL_TEXT]) {
      expect(everything(outcome)).not.toContain(secret);
    }
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "failed", reason: "unexpected" },
    ]);
  });

  it("saves while positioning is not decided: the lineup waits for no other node", async () => {
    state.positioning = "none";
    expect(await enterFoundation(lineupEntry())).toMatchObject({ ok: true });
    expect(state.saved).toHaveLength(1);
  });
});

describe("lineup door", () => {
  it("signed-out: counts the signed-out limit by IP, answers signed-out, saves nothing", async () => {
    state.session = null;
    const outcome = await enterFoundation(lineupEntry());
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("an email off the list: forbidden, no address, nothing counted, nothing saved", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await enterFoundation(lineupEntry());
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    for (const secret of ["stranger", "example.com", ...RIVAL_TEXT]) {
      expect(everything(outcome)).not.toContain(secret);
    }
  });

  it("the write limit used up: rate-limited with retryAfter, nothing saved", async () => {
    for (const w of LIMITS.write.windows) {
      state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
    }
    expect(await enterFoundation(lineupEntry())).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryAfter: expect.any(Number),
    });
    expect(state.saved).toEqual([]);
  });

  it("another workspace's project and an unknown id: one not-found body, nothing saved", async () => {
    const unknown = await enterFoundation({ ...lineupEntry(), projectId: UNKNOWN_ID });
    const other = await enterFoundation({
      ...lineupEntry(),
      projectId: "22222222-2222-4222-8222-222222222222",
    });
    expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(other)).toEqual(body(unknown));
    expect(state.saved).toEqual([]);
    for (const secret of [UNKNOWN_ID, ...RIVAL_TEXT]) {
      expect(everything(unknown)).not.toContain(secret);
    }
  });

  it("a second lineup: invalid-input with no problems, the first one kept", async () => {
    expect(await enterFoundation(lineupEntry())).toMatchObject({ ok: true });
    const outcome = await enterFoundation(lineupEntry([{ name: "SECRET-OTHER", hex: "#111111" }]));
    expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    expect(outcome).not.toHaveProperty("problems");
    expect(state.saved).toHaveLength(1);
  });

  it.each([
    ["no entry", [], "payload.lineup", "invalid"],
    ["a colour that is no hex", [{ name: RIVAL, hex: "#ZZZZZZ" }], "payload.lineup.0.hex", null],
    [
      "a repeated name",
      [
        { name: RIVAL, hex: "#111111" },
        { name: RIVAL.toLowerCase(), hex: "#222222" },
      ],
      "payload.lineup.1.name",
      null,
    ],
    [
      "a name past 60 characters",
      [{ name: `${RIVAL}${"x".repeat(60)}`, hex: "#111111" }],
      "payload.lineup.0.name",
      "too-long",
    ],
  ] as const)(
    "%s: invalid-input with the path and a kind, saves nothing, and holds no competitor in the body or a line",
    async (_label, lineup, path, kind) => {
      const outcome = await enterFoundation(lineupEntry(lineup));
      expect(outcome).toMatchObject({
        ok: false,
        error: "invalid-input",
        code: "INVALID_INPUT",
        problems: [{ path, ...(kind === null ? {} : { kind }) }],
      });
      expect(state.saved).toEqual([]);
      expect(state.order).toEqual(["session", "allow-list", "consume"]);
      for (const problem of (outcome as { problems: object[] }).problems) {
        expect(Object.keys(problem).sort()).toEqual(["kind", "path"]);
      }
      for (const secret of [...SECRETS, ...RIVAL_TEXT]) {
        expect(whereAxisCouldLeak(outcome)).not.toContain(secret);
      }
    },
  );

  it("refuses a skip of the lineup, a lineup beside another node and a stray key, saving nothing", async () => {
    for (const bad of [
      { projectId: PROJECT_ID, node: "competitive-frame", kind: "skipped", payload: {} },
      { ...lineupEntry(), node: "color" },
      { ...lineupEntry(), payload: { lineup: [{ name: RIVAL, hex: RIVAL_HEX }], extra: 1 } },
      { ...lineupEntry(), payload: { lineup: [{ name: RIVAL, hex: RIVAL_HEX, extra: 1 }] } },
    ]) {
      expect(await enterFoundation(bad)).toMatchObject({ ok: false, error: "invalid-input" });
    }
    expect(state.saved).toEqual([]);
  });
});

// ORV-298 PR 2, T29, rows 18 and 23: the scripts the brand writes in, through the one route.
const scriptsEntry = (scripts: unknown = "thai-latin") => ({
  projectId: PROJECT_ID,
  node: "typography",
  kind: "answered",
  payload: { scripts },
});
/** The answers the tests send and the words an unknown one carries, whatever the case in a line. */
const SCRIPTS_TEXT = ["thai-latin", "klingon-secret"];

describe("answer the scripts", () => {
  it("answers ok with the node and the kind, saves the answer in the session's workspace, and logs closed words", async () => {
    const outcome = await enterFoundation(scriptsEntry("thai"));
    expect(outcome).toEqual({ ok: true, value: { node: "typography", kind: "answered" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        entry: { node: "typography", kind: "answered", payload: { scripts: "thai" } },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    const lines = written();
    expect(lines).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    // No line holds the answer.
    expect(JSON.stringify(lines)).not.toMatch(/thai|latin/i);
  });

  it("never reaches a line with the answer when the save fails", async () => {
    state.throws = new Error("insert failed for scripts thai-latin");
    const outcome = await enterFoundation(scriptsEntry("thai-latin"));
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(everything(outcome)).not.toContain("thai-latin");
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "failed", reason: "unexpected" },
    ]);
    expect(JSON.stringify(written())).not.toContain("thai-latin");
  });

  it("saves while positioning is not decided or stale: the answer waits for no other node", async () => {
    for (const positioning of ["none", "stale"] as const) {
      state.saved.length = 0;
      state.positioning = positioning;
      expect(await enterFoundation(scriptsEntry("latin"))).toMatchObject({ ok: true });
      expect(state.saved).toHaveLength(1);
    }
  });
});

describe("typography door", () => {
  it("signed-out: counts the signed-out limit by IP, answers signed-out, saves nothing", async () => {
    state.session = null;
    const outcome = await enterFoundation(scriptsEntry());
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("an email off the list: forbidden, no address, nothing counted, nothing saved", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await enterFoundation(scriptsEntry());
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    for (const secret of ["stranger", "example.com", ...SCRIPTS_TEXT]) {
      expect(everything(outcome)).not.toContain(secret);
    }
  });

  it("the write limit used up: rate-limited with retryAfter, nothing saved", async () => {
    for (const w of LIMITS.write.windows) {
      state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
    }
    expect(await enterFoundation(scriptsEntry())).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryAfter: expect.any(Number),
    });
    expect(state.saved).toEqual([]);
  });

  it("another workspace's project and an unknown id: one not-found body, nothing saved", async () => {
    const unknown = await enterFoundation({ ...scriptsEntry(), projectId: UNKNOWN_ID });
    const other = await enterFoundation({
      ...scriptsEntry(),
      projectId: "22222222-2222-4222-8222-222222222222",
    });
    expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(other)).toEqual(body(unknown));
    expect(state.saved).toEqual([]);
    expect(everything(unknown)).not.toContain(UNKNOWN_ID);
  });

  it("a second answer: invalid-input with no problems, the first one kept", async () => {
    expect(await enterFoundation(scriptsEntry("thai"))).toMatchObject({ ok: true });
    const outcome = await enterFoundation(scriptsEntry("latin"));
    expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    expect(outcome).not.toHaveProperty("problems");
    expect(state.saved).toHaveLength(1);
  });

  it.each([
    ["an unknown answer", "klingon-secret", "payload.scripts", "invalid"],
    ["a missing answer", undefined, "payload.scripts", "required"],
  ] as const)(
    "%s: invalid-input with the path and a kind, saves nothing, and holds no answer in the body or a line",
    async (_label, scripts, path, kind) => {
      const outcome = await enterFoundation({
        ...scriptsEntry(),
        payload: scripts === undefined ? {} : { scripts },
      });
      expect(outcome).toMatchObject({
        ok: false,
        error: "invalid-input",
        code: "INVALID_INPUT",
        problems: [{ path, kind }],
      });
      expect(state.saved).toEqual([]);
      expect(state.order).toEqual(["session", "allow-list", "consume"]);
      for (const problem of (outcome as { problems: object[] }).problems) {
        expect(Object.keys(problem).sort()).toEqual(["kind", "path"]);
      }
      expect(JSON.stringify(whereAxisCouldLeak(outcome))).not.toContain("klingon-secret");
      expect(JSON.stringify(written())).not.toContain("klingon-secret");
    },
  );

  it("refuses a skip of typography, a stray key and an answer beside another node, saving nothing", async () => {
    for (const bad of [
      { projectId: PROJECT_ID, node: "typography", kind: "skipped", payload: {} },
      { ...scriptsEntry(), kind: "given" },
      { ...scriptsEntry(), payload: { scripts: "thai", locale: "th" } },
      { ...scriptsEntry(), source: "x" },
      { ...scriptsEntry(), node: "logo-type" },
    ]) {
      expect(await enterFoundation(bad)).toMatchObject({ ok: false, error: "invalid-input" });
    }
    expect(state.saved).toEqual([]);
  });
});

// ORV-296 (slice of ORV-291, PR 3), T39, spec rows 25, 26, 28, 29 and 32: the core idea entries
// through the same unchanged door. The fake service decides with the engine's own `entryAllowed`, so
// these tests prove what the arms add: the checked entry reaches the save as the contract gives it,
// the gate waits while a block cause exists, and the node refuses a second `written` entry.
const STATEMENT = "ทำให้ทุกเช้าง่ายขึ้น";
const REMEMBER = "กาแฟที่ส่งถึงบ้านทันเวลา";
const writeIdea = (statement: string, remember?: string) => ({
  projectId: PROJECT_ID,
  node: "core-idea",
  kind: "written",
  payload: remember === undefined ? { statement } : { statement, remember },
});
const skipIdea = { projectId: PROJECT_ID, node: "core-idea", kind: "skipped", payload: {} };
/** A personality given before the call, as the door would have saved it. */
const seedPersonality = (kind: "given" | "skipped" = "given") => {
  state.saved.push({
    workspaceId: "ws-1",
    entry: { node: "identity-frame", kind, payload: kind === "given" ? { axes } : {} },
  });
};
const IDEA_SECRETS = [STATEMENT, REMEMBER, PROJECT_ID, UNKNOWN_ID, "reader@example.com", "ws-1"];

// Row 26.
describe("write the core idea", () => {
  it("answers ok with the node and the kind, saves one trimmed entry in the session's workspace, and logs closed words", async () => {
    seedPersonality();
    const outcome = await enterFoundation(writeIdea(`  ${STATEMENT}  `, `  ${REMEMBER}  `));
    expect(outcome).toEqual({ ok: true, value: { node: "core-idea", kind: "written" } });
    expect(state.saved.slice(1)).toEqual([
      {
        workspaceId: "ws-1",
        entry: {
          node: "core-idea",
          kind: "written",
          payload: { statement: STATEMENT, remember: REMEMBER },
        },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    expect(written()).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    // Searched where the text could leak: the body and every parsed line and argument.
    const all = everything(outcome);
    for (const secret of IDEA_SECRETS) expect(all).not.toContain(secret);
    for (const secret of IDEA_SECRETS) expect(whereAxisCouldLeak(outcome)).not.toContain(secret);
  });

  it("saves a written idea with no remember answer as the statement alone", async () => {
    seedPersonality();
    expect(await enterFoundation(writeIdea(STATEMENT))).toMatchObject({ ok: true });
    expect(state.saved.at(-1)?.entry.payload).toEqual({ statement: STATEMENT });
  });

  it("keeps the idea out of every line and body, on a failed save, a refused save and a refusal", async () => {
    seedPersonality();
    state.throws = new Error(`insert failed for ${STATEMENT}`);
    const failed = await enterFoundation(writeIdea(STATEMENT, REMEMBER));
    expect(failed).toMatchObject({ ok: false, error: "failed" });
    state.throws = new BusinessError("not-saved");
    const notSaved = await enterFoundation(writeIdea(STATEMENT, REMEMBER));
    expect(notSaved).toMatchObject({ ok: false, error: "failed" });
    state.throws = null;
    const tooLong = await enterFoundation(writeIdea(`${STATEMENT}${"x".repeat(301)}`, REMEMBER));
    expect(tooLong).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "payload.statement", kind: "too-long" }],
    });
    const unknownKey = await enterFoundation({
      ...writeIdea(STATEMENT),
      payload: { statement: STATEMENT, draftId: STATEMENT },
    });
    expect(unknownKey).toMatchObject({
      ok: false,
      problems: [{ path: "payload.draftId", kind: "unknown-key" }],
    });
    for (const outcome of [failed, notSaved, tooLong, unknownKey]) {
      expect(whereAxisCouldLeak(outcome)).not.toContain(STATEMENT);
      expect(whereAxisCouldLeak(outcome)).not.toContain(REMEMBER);
    }
    expect(JSON.stringify(capture.lines.map((l) => l.args))).not.toContain("ทุกเช้า");
    expect(JSON.stringify(capture.lines.map((l) => l.args))).not.toContain("กาแฟ");
  });

  it("refuses an empty statement and 301 characters with the field and the kind, and saves nothing", async () => {
    seedPersonality();
    const empty = await enterFoundation(writeIdea("   ", REMEMBER));
    expect(empty).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "payload.statement", kind: "required" }],
    });
    const long = await enterFoundation(writeIdea("x".repeat(301)));
    expect(long).toMatchObject({
      ok: false,
      problems: [{ path: "payload.statement", kind: "too-long" }],
    });
    const picked = await enterFoundation({ ...writeIdea("x"), kind: "picked" });
    expect(picked).toMatchObject({ ok: false, problems: [{ path: "kind", kind: "invalid" }] });
    expect(state.saved).toHaveLength(1);
    expect(state.order.filter((s) => s === "save")).toEqual([]);
  });
});

// Row 28.
describe("skip, then write", () => {
  it("accepts both calls and keeps two rows of the node, the written one newest", async () => {
    seedPersonality();
    expect(await enterFoundation(skipIdea)).toEqual({
      ok: true,
      value: { node: "core-idea", kind: "skipped" },
    });
    expect(await enterFoundation(writeIdea(STATEMENT, REMEMBER))).toEqual({
      ok: true,
      value: { node: "core-idea", kind: "written" },
    });
    expect(state.saved.map((s) => `${s.entry.node}:${s.entry.kind}`)).toEqual([
      "identity-frame:given",
      "core-idea:skipped",
      "core-idea:written",
    ]);
    expect(written().map((l) => l["outcome"])).toEqual(["ok", "ok"]);
    for (const secret of IDEA_SECRETS) expect(everything(capture.lines)).not.toContain(secret);
  });

  it("a skipped personality still lets the core idea be skipped or written", async () => {
    seedPersonality("skipped");
    expect(await enterFoundation(skipIdea)).toMatchObject({ ok: true });
    expect(await enterFoundation(writeIdea(STATEMENT))).toMatchObject({ ok: true });
  });

  it("with positioning skipped and a given personality both are accepted", async () => {
    state.positioning = "skipped";
    seedPersonality();
    expect(await enterFoundation(skipIdea)).toMatchObject({ ok: true });
    expect(await enterFoundation(writeIdea(STATEMENT))).toMatchObject({ ok: true });
  });
});

// Row 29.
describe("core idea waits", () => {
  const FIXTURES: Array<[string, () => void]> = [
    [
      "positioning agreed and no personality entry",
      () => {
        state.positioning = "agreed";
      },
    ],
    [
      "positioning with no choice and no personality entry",
      () => {
        state.positioning = "none";
      },
    ],
    [
      "positioning stale and a given personality",
      () => {
        state.positioning = "stale";
        seedPersonality();
      },
    ],
  ];

  it.each(FIXTURES)(
    "%s: a written and a skipped entry called directly are invalid-input, and nothing is saved",
    async (_name, arrange) => {
      arrange();
      const before = state.saved.length;
      for (const entry of [writeIdea(STATEMENT, REMEMBER), skipIdea]) {
        const outcome = await enterFoundation(entry);
        expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
        expect(outcome).not.toHaveProperty("problems");
        for (const secret of IDEA_SECRETS) expect(everything(outcome)).not.toContain(secret);
      }
      expect(state.saved).toHaveLength(before);
      expect(written().map((l) => [l["outcome"], l["reason"]])).toEqual([
        ["refused", "invalid-input"],
        ["refused", "invalid-input"],
      ]);
    },
  );
});

// Row 32.
describe("core idea door", () => {
  it("signed-out: counts the signed-out limit by IP, answers signed-out, saves nothing", async () => {
    state.session = null;
    const outcome = await enterFoundation(writeIdea(STATEMENT));
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("an email off the list: forbidden, no address, nothing counted, nothing saved", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await enterFoundation(writeIdea(STATEMENT));
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list"]);
    for (const secret of ["stranger", "example.com", STATEMENT]) {
      expect(everything(outcome)).not.toContain(secret);
    }
  });

  it("the write limit used up: rate-limited with retryAfter, nothing saved", async () => {
    for (const w of LIMITS.write.windows) {
      state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
    }
    const outcome = await enterFoundation(writeIdea(STATEMENT));
    expect(outcome).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryAfter: expect.any(Number),
    });
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
  });

  it("another workspace's project and an unknown id: one not-found body, nothing saved", async () => {
    seedPersonality();
    const unknown = await enterFoundation({ ...writeIdea(STATEMENT), projectId: UNKNOWN_ID });
    const other = await enterFoundation({
      ...skipIdea,
      projectId: "22222222-2222-4222-8222-222222222222",
    });
    expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(other)).toEqual(body(unknown));
    expect(state.saved).toHaveLength(1);
    for (const secret of [UNKNOWN_ID, STATEMENT]) expect(everything(unknown)).not.toContain(secret);
  });

  it("the check runs after the limit and before the service", async () => {
    const outcome = await enterFoundation({ ...writeIdea(STATEMENT), extra: 1 });
    expect(outcome).toMatchObject({
      ok: false,
      error: "invalid-input",
      problems: [{ path: "extra", kind: "unknown-key" }],
    });
    expect(state.order).toEqual(["session", "allow-list", "consume"]);
  });
});

describe("agreed stays agreed", () => {
  it("after a written idea, a written and a skipped entry answer invalid-input and the newest stays the first", async () => {
    seedPersonality();
    expect(await enterFoundation(writeIdea(STATEMENT, REMEMBER))).toMatchObject({ ok: true });
    const again = await enterFoundation(writeIdea("another idea"));
    const afterWritten = await enterFoundation(skipIdea);
    for (const outcome of [again, afterWritten]) {
      expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
      expect(outcome).not.toHaveProperty("problems");
    }
    const ideas = state.saved.filter((s) => s.entry.node === "core-idea");
    expect(ideas.map((s) => s.entry.kind)).toEqual(["written"]);
    expect(ideas[0]?.entry.payload).toEqual({ statement: STATEMENT, remember: REMEMBER });
    expect(everything(again)).not.toContain("another idea");
    expect(written().at(-1)).toMatchObject({ outcome: "refused", reason: "invalid-input" });
  });

  it("after a skip, a second skip answers invalid-input", async () => {
    seedPersonality();
    expect(await enterFoundation(skipIdea)).toMatchObject({ ok: true });
    expect(await enterFoundation(skipIdea)).toMatchObject({ ok: false, error: "invalid-input" });
    expect(state.saved.filter((s) => s.entry.node === "core-idea")).toHaveLength(1);
  });
});

// ORV-298 PR 3, T37, rows 29, 31 and 34: whether the brand needs a small square mark, through the
// one route. The service is the fake above, which decides with the engine's own `entryAllowed`.
const iconEntry = (appIcon: unknown = false) => ({
  projectId: PROJECT_ID,
  node: "logo-type",
  kind: "answered",
  payload: { appIcon },
});
const nameOf = (name: string) => ({
  projectId: PROJECT_ID,
  node: "name",
  kind: "given",
  payload: { name },
});
/** Words a working name or an unknown answer carries: none may reach a line or an error body. */
const LONG_NAME = "Chase Manhattan Bank";

describe("answer the app icon", () => {
  it("answers ok with the node and the kind, saves the answer in the session's workspace, and logs closed words", async () => {
    expect(await enterFoundation(nameOf("ORIVILO"))).toMatchObject({ ok: true });
    state.saved.length = 0;
    state.order = [];
    state.consumed = [];
    capture.lines.length = 0;
    const outcome = await enterFoundation(iconEntry(false));
    expect(outcome).toEqual({ ok: true, value: { node: "logo-type", kind: "answered" } });
    expect(state.saved).toEqual([
      {
        workspaceId: "ws-1",
        entry: { node: "logo-type", kind: "answered", payload: { appIcon: false } },
      },
    ]);
    expect(state.consumed).toEqual(["write:u:P"]);
    expect(state.order).toEqual(["session", "allow-list", "consume", "save"]);
    const lines = written();
    expect(lines).toMatchObject([
      { route: "business/enterFoundation", outcome: "ok", level: "info" },
    ]);
    // No line holds the answer or the working name.
    expect(JSON.stringify(lines)).not.toMatch(/ORIVILO|appIcon|false/);
  });

  it("saves the answer yes, and saves while positioning is not decided or stale", async () => {
    for (const positioning of ["agreed", "none", "stale"] as const) {
      state.saved.length = 0;
      state.positioning = positioning;
      expect(await enterFoundation(iconEntry(true))).toMatchObject({ ok: true });
      expect(state.saved).toHaveLength(1);
    }
  });

  it("never reaches a line with the working name when the save fails", async () => {
    state.saved.push({
      workspaceId: "ws-1",
      entry: { node: "name", kind: "given", payload: { name: "ORIVILO" } },
    });
    state.throws = new Error("insert failed for the name ORIVILO");
    const outcome = await enterFoundation(iconEntry(true));
    expect(outcome).toMatchObject({ ok: false, error: "failed", code: "INTERNAL_ERROR" });
    expect(everything(outcome)).not.toContain("ORIVILO");
  });
});

describe("a long name needs no app icon answer", () => {
  it("refuses the answer as invalid-input with no problems, saves nothing more, quotes no name", async () => {
    expect(await enterFoundation(nameOf(LONG_NAME))).toMatchObject({ ok: true });
    capture.lines.length = 0;
    const outcome = await enterFoundation(iconEntry(true));
    expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    expect(outcome).not.toHaveProperty("problems");
    expect(state.saved.map((s) => s.entry.node)).toEqual(["name"]);
    expect(everything(outcome)).not.toContain("Chase");
    expect(JSON.stringify(written())).not.toContain("Chase");
  });

  it("counts grapheme clusters with the white space left out: twelve is asked, thirteen is not", async () => {
    expect(await enterFoundation(nameOf("ก ".repeat(12)))).toMatchObject({ ok: true });
    expect(await enterFoundation(iconEntry(false))).toMatchObject({ ok: true });
    state.saved.length = 0;
    expect(await enterFoundation(nameOf("ก ".repeat(13)))).toMatchObject({ ok: true });
    expect(await enterFoundation(iconEntry(false))).toMatchObject({
      ok: false,
      error: "invalid-input",
    });
    expect(state.saved.map((s) => s.entry.node)).toEqual(["name"]);
  });

  it("a name that is not long leaves the answer allowed, and the answer then blocks a second", async () => {
    expect(await enterFoundation(nameOf("Smithsonian"))).toMatchObject({ ok: true });
    expect(await enterFoundation(iconEntry(true))).toMatchObject({ ok: true });
    expect(await enterFoundation(iconEntry(false))).toMatchObject({
      ok: false,
      error: "invalid-input",
    });
  });
});

describe("logo type door", () => {
  it("signed-out: counts the signed-out limit by IP, answers signed-out, saves nothing", async () => {
    state.session = null;
    const outcome = await enterFoundation(iconEntry());
    expect(outcome).toMatchObject({ ok: false, error: "signed-out", code: "UNAUTHENTICATED" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.saved).toEqual([]);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("an email off the list: forbidden, no address, nothing counted, nothing saved", async () => {
    state.session = { ...person, user: { id: "P2", email: "stranger@example.com" } };
    const outcome = await enterFoundation(iconEntry());
    expect(outcome).toMatchObject({ ok: false, error: "forbidden", code: "FORBIDDEN" });
    expect(state.consumed).toEqual([]);
    expect(state.saved).toEqual([]);
    for (const secret of ["stranger", "example.com"]) {
      expect(everything(outcome)).not.toContain(secret);
    }
  });

  it("the write limit used up: rate-limited with retryAfter, nothing saved", async () => {
    for (const w of LIMITS.write.windows) {
      state.counts.set(`${keyOf(LIMITS.write, { user: "P" })}@${w.seconds}`, w.max);
    }
    expect(await enterFoundation(iconEntry())).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryAfter: expect.any(Number),
    });
    expect(state.saved).toEqual([]);
  });

  it("another workspace's project and an unknown id: one not-found body, nothing saved", async () => {
    const unknown = await enterFoundation({ ...iconEntry(), projectId: UNKNOWN_ID });
    const other = await enterFoundation({
      ...iconEntry(),
      projectId: "22222222-2222-4222-8222-222222222222",
    });
    expect(unknown).toMatchObject({ ok: false, error: "not-found", code: "NOT_FOUND" });
    expect(body(other)).toEqual(body(unknown));
    expect(state.saved).toEqual([]);
    expect(everything(unknown)).not.toContain(UNKNOWN_ID);
  });

  it("a project that already holds an answer: invalid-input with no problems, the first one kept", async () => {
    expect(await enterFoundation(iconEntry(true))).toMatchObject({ ok: true });
    const outcome = await enterFoundation(iconEntry(false));
    expect(outcome).toMatchObject({ ok: false, error: "invalid-input", code: "INVALID_INPUT" });
    expect(outcome).not.toHaveProperty("problems");
    expect(state.saved).toHaveLength(1);
  });

  it.each([
    ["a text answer", "klingon-secret", "payload.appIcon", "invalid"],
    ["the text yes", "yes", "payload.appIcon", "invalid"],
    ["a missing answer", undefined, "payload.appIcon", "required"],
  ] as const)(
    "%s: invalid-input with the path and a kind, saves nothing, and holds no answer in the body or a line",
    async (_label, appIcon, path, kind) => {
      const outcome = await enterFoundation({
        ...iconEntry(),
        payload: appIcon === undefined ? {} : { appIcon },
      });
      expect(outcome).toMatchObject({
        ok: false,
        error: "invalid-input",
        code: "INVALID_INPUT",
        problems: [{ path, kind }],
      });
      expect(state.saved).toEqual([]);
      expect(state.order).toEqual(["session", "allow-list", "consume"]);
      for (const problem of (outcome as { problems: object[] }).problems) {
        expect(Object.keys(problem).sort()).toEqual(["kind", "path"]);
      }
      expect(JSON.stringify(whereAxisCouldLeak(outcome))).not.toContain("klingon-secret");
      expect(JSON.stringify(written())).not.toContain("klingon-secret");
    },
  );

  it("refuses a skip of logo type, a given kind, a stray key and an unknown key, saving nothing", async () => {
    for (const bad of [
      { projectId: PROJECT_ID, node: "logo-type", kind: "skipped", payload: {} },
      { ...iconEntry(), kind: "given" },
      { ...iconEntry(), payload: { appIcon: true, crowding: false } },
      { ...iconEntry(), source: "x" },
    ]) {
      expect(await enterFoundation(bad)).toMatchObject({ ok: false, error: "invalid-input" });
    }
    expect(state.saved).toEqual([]);
  });
});
