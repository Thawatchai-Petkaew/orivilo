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
