import {
  Denied,
  type Limit,
  LIMITS,
  monthOf,
  type RateLimiter,
  type SpendCheck,
  type Subject,
  type UsageEntry,
} from "@orivilo/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-112 AC 5 to 10 and 15: the wiring of the limits into the directions actions. The store is
// proven in packages/auth; here a fake limiter counts in memory, so these tests prove the order
// (session, then limit, then work) and the outcome shape.
//
// ORV-121 rows 1 to 12: the spend cap is proven in packages/auth; here an in-memory fake keeps the
// records, uses the real `monthOf`, takes the clock from the test and caps at 50,000 millionths of
// a dollar. The model answers below are written by hand in the shape OpenRouter returns (recorded
// shape, not a live price): the cost 0.014 is a test value.

const state = vi.hoisted(() => ({
  session: null as { user: { id: string }; session: { activeOrganizationId: string } } | null,
  ip: "ip-1",
  counts: new Map<string, number>(),
  mode: "count" as "count" | "unavailable",
  consumed: [] as string[],
  now: Date.parse("2026-10-15T05:00:00Z"),
  members: new Set<string>(),
  ledger: [] as {
    workspaceId: string;
    userId: string;
    job: string;
    model: string;
    costMicroUsd: number | null;
    createdAt: Date;
  }[],
  sum: "read" as "read" | "unavailable",
  recordFails: null as Error | null,
  checked: 0,
  service: {
    saveDraft: vi.fn(),
    approve: vi.fn(),
    importFile: vi.fn(),
    list: vi.fn(),
  },
}));

const keyOf = (limit: Limit, subject: Subject) =>
  "user" in subject ? `${limit.name}:u:${subject.user}` : `${limit.name}:ip:${subject.ip}`;
const counted = (limit: Limit, subject: Subject, seconds: number) =>
  state.counts.get(`${keyOf(limit, subject)}@${seconds}`) ?? 0;
const preload = (limit: Limit, subject: Subject, seconds: number, n: number) =>
  state.counts.set(`${keyOf(limit, subject)}@${seconds}`, n);

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("../../server/auth", () => ({
  auth: () => ({ api: { getSession: async () => state.session } }),
  accessDeps: () => ({}),
}));
vi.mock("../../server/rate-limit", () => ({
  subjectFromHeaders: () => state.ip,
  limiter: (): RateLimiter => ({
    async consume(limit, subject) {
      state.consumed.push(keyOf(limit, subject));
      if (state.mode === "unavailable") return { ok: false, reason: "unavailable" };
      for (const w of limit.windows) {
        if (counted(limit, subject, w.seconds) >= w.max) {
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
const CAP = 50_000;
const monthSum = (workspaceId: string) => {
  const { start, end } = monthOf(state.now);
  return state.ledger
    .filter((r) => r.workspaceId === workspaceId && r.createdAt >= start && r.createdAt < end)
    .reduce((total, r) => total + (r.costMicroUsd ?? 0), 0);
};
vi.mock("../../server/spend-cap", () => ({
  spendCap: () => ({
    async check(_h: Headers, workspaceId: string | null | undefined): Promise<SpendCheck> {
      state.checked += 1;
      if (!workspaceId) throw new Denied(403, "no-workspace");
      if (!state.members.has(workspaceId)) throw new Denied(403, "not-a-member");
      if (state.sum === "unavailable") return { ok: false, reason: "unavailable" };
      if (monthSum(workspaceId) >= CAP) return { ok: false, reason: "capped" };
      return { ok: true, charge: { workspaceId, userId: state.session?.user.id ?? "" } };
    },
    async record(
      _h: Headers,
      charge: { workspaceId: string; userId: string },
      entries: readonly UsageEntry[],
    ) {
      if (state.recordFails) throw state.recordFails;
      for (const e of entries) {
        state.ledger.push({ ...charge, ...e, createdAt: new Date(state.now) });
      }
    },
  }),
}));
vi.mock("@orivilo/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@orivilo/auth")>()),
  directionService: () => state.service,
}));

const { approveDirection, importDirection, listDirections, readBriefWithAi, saveDirection } =
  await import("./actions");

const person = (id: string) => ({ user: { id }, session: { activeOrganizationId: "ws-1" } });
const fetchSpy = vi.fn();

beforeEach(() => {
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubGlobal("fetch", fetchSpy);
  fetchSpy.mockResolvedValue(new Response("nope", { status: 500 }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  state.session = person("P");
  state.ip = "ip-1";
  state.counts.clear();
  state.mode = "count";
  state.consumed = [];
  state.now = Date.parse("2026-10-15T05:00:00Z");
  state.members = new Set(["ws-1"]);
  state.ledger = [];
  state.sum = "read";
  state.recordFails = null;
  state.checked = 0;
  for (const fn of Object.values(state.service)) fn.mockReset().mockResolvedValue({});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchSpy.mockReset();
});

const refused = (error: string, retryAfter: number) => ({
  ok: false,
  error,
  code: "RATE_LIMITED",
  retryAfter,
  retryable: true,
});

describe("AI reading limits", () => {
  it("AI reading over the hour limit makes no model call", async () => {
    preload(LIMITS["ai-read"], { user: "P" }, 3600, 10);
    expect(await readBriefWithAi("a calm clinic")).toEqual(refused("ai-rate-limited", 3600));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("AI reading over the day limit", async () => {
    preload(LIMITS["ai-read"], { user: "P" }, 86_400, 50);
    expect(await readBriefWithAi("a calm clinic")).toEqual(refused("ai-rate-limited", 86_400));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("the AI limit is per person", async () => {
    preload(LIMITS["ai-read"], { user: "P" }, 3600, 10);
    state.session = person("Q");
    const result = await readBriefWithAi("a calm clinic");
    // Q was let through to the model (the fake model answers 500, so the reading fails).
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, error: "ai-failed" });
    expect(counted(LIMITS["ai-read"], { user: "Q" }, 3600)).toBe(1);
    expect(counted(LIMITS["ai-read"], { user: "P" }, 3600)).toBe(10);
    expect(state.consumed).toEqual(["ai-read:u:Q"]);
  });

  it("a signed-out reading is limited per network and says rate-limited", async () => {
    state.session = null;
    preload(LIMITS["signed-out"], { ip: "ip-1" }, 600, 30);
    expect(await readBriefWithAi("a calm clinic")).toEqual(refused("rate-limited", 600));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("write and import limits", () => {
  it("a write over the limit changes nothing", async () => {
    preload(LIMITS.write, { user: "P" }, 600, 60);
    expect(await saveDirection({ name: "x" })).toEqual(refused("rate-limited", 600));
    expect(await approveDirection("d1")).toEqual(refused("rate-limited", 600));
    expect(state.service.saveDraft).not.toHaveBeenCalled();
    expect(state.service.approve).not.toHaveBeenCalled();
  });

  it("save and approve share one bucket", async () => {
    await saveDirection({ name: "x" });
    await approveDirection("d1");
    expect(counted(LIMITS.write, { user: "P" }, 600)).toBe(2);
  });

  it("an import over the limit creates nothing", async () => {
    preload(LIMITS.import, { user: "P" }, 3600, 10);
    expect(await importDirection({ any: "file" })).toEqual(refused("rate-limited", 3600));
    expect(state.service.importFile).not.toHaveBeenCalled();
  });

  it("a call under the limit runs the work once, after the limit", async () => {
    state.service.saveDraft.mockResolvedValue({ directionId: "d1" });
    expect(await saveDirection({ name: "x" })).toEqual({ ok: true, value: { directionId: "d1" } });
    expect(state.service.saveDraft).toHaveBeenCalledTimes(1);
    expect(state.consumed).toEqual(["write:u:P"]);
  });

  it("reads are not limited", async () => {
    state.service.list.mockResolvedValue([]);
    await listDirections().catch(() => undefined);
    expect(state.consumed).toEqual([]);
  });
});

describe("signed-out calls", () => {
  it("signed-out calls are limited per trusted IP", async () => {
    state.session = null;
    preload(LIMITS["signed-out"], { ip: "ip-1" }, 600, 30);
    expect(await saveDirection({ name: "x" })).toEqual(refused("rate-limited", 600));
    state.ip = "ip-2";
    expect(await saveDirection({ name: "x" })).toEqual({ ok: false, error: "signed-out" });
    expect(state.service.saveDraft).not.toHaveBeenCalled();
  });
});

describe("the limiter fails closed", () => {
  beforeEach(() => {
    state.mode = "unavailable";
  });

  it("keeps the rules' reading and makes no model call", async () => {
    expect(await readBriefWithAi("a calm clinic")).toEqual({ ok: false, error: "ai-failed" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a save, an approval and an import as failed", async () => {
    expect(await saveDirection({ name: "x" })).toEqual({ ok: false, error: "failed" });
    expect(await approveDirection("d1")).toEqual({ ok: false, error: "failed" });
    expect(await importDirection({})).toEqual({ ok: false, error: "failed" });
    expect(state.service.saveDraft).not.toHaveBeenCalled();
    expect(state.service.approve).not.toHaveBeenCalled();
    expect(state.service.importFile).not.toHaveBeenCalled();
  });
});

// ORV-121: the interpret path. Briefs hold words the recorded answers quote.
const MODEL = "anthropic/claude-sonnet-5.5";
const GOOD = {
  findings: [{ field: "personality", axis: "warm", level: "desired", quote: "warm" }],
  notUnderstood: [],
};
const BRIEF = "A warm clinic";
const MARKER = "ORV121-MARKER";

const completion = (content: string, extra: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      model: MODEL,
      choices: [{ message: { content } }],
      usage: { cost: 0.014 },
      ...extra,
    }),
    { status: 200 },
  );
const answers = (content: string, extra: Record<string, unknown> = {}) =>
  fetchSpy.mockImplementation(async () => completion(content, extra));
const entry = (costMicroUsd: number | null, workspaceId = "ws-1") => ({
  workspaceId,
  userId: "P",
  job: "interpret",
  model: MODEL,
  costMicroUsd,
});
const seed = (workspaceId: string, costMicroUsd: number, at = state.now) =>
  state.ledger.push({ ...entry(costMicroUsd, workspaceId), createdAt: new Date(at) });
const records = () =>
  state.ledger.map(({ workspaceId, userId, job, model, costMicroUsd }) => ({
    workspaceId,
    userId,
    job,
    model,
    costMicroUsd,
  }));

describe("the spend cap on an AI reading", () => {
  it("a reading records its reported cost", async () => {
    answers(JSON.stringify(GOOD));
    const result = await readBriefWithAi(BRIEF);
    expect(result).toMatchObject({ ok: true, value: { reading: { method: "llm" } } });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(records()).toEqual([entry(14_000)]);
    expect(monthSum("ws-1")).toBe(14_000);
  });

  it("a capped workspace gets the rules' reading without a model call", async () => {
    seed("ws-1", CAP);
    expect(await readBriefWithAi(BRIEF)).toEqual({
      ok: false,
      error: "ai-spend-cap",
      code: "AI_SPEND_CAP",
      retryable: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.ledger).toHaveLength(1);
  });

  it("the call that crosses the cap completes, the next is refused", async () => {
    seed("ws-1", 49_000);
    answers(JSON.stringify(GOOD));
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: true });
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: false, error: "ai-spend-cap" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(monthSum("ws-1")).toBe(63_000);
  });

  it("the cap is per workspace", async () => {
    seed("ws-1", CAP);
    state.members = new Set(["ws-1", "X"]);
    state.session = { user: { id: "P" }, session: { activeOrganizationId: "X" } };
    answers(JSON.stringify(GOOD));
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: true });
    expect(records().at(-1)).toEqual(entry(14_000, "X"));
    expect(monthSum("ws-1")).toBe(CAP);
    expect(monthSum("X")).toBe(14_000);
  });

  it("a new Bangkok month starts at zero", async () => {
    const october = Date.parse("2026-10-31T16:59:59Z");
    seed("ws-1", CAP, october);
    answers(JSON.stringify(GOOD));
    state.now = october;
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: false, error: "ai-spend-cap" });
    expect(fetchSpy).not.toHaveBeenCalled();
    state.now = Date.parse("2026-10-31T17:00:00Z");
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: true });
    expect(state.ledger).toHaveLength(2);
    expect(state.ledger[0]).toMatchObject({ costMicroUsd: CAP, createdAt: new Date(october) });
    expect(state.ledger[1]?.createdAt).toEqual(new Date(state.now));
    expect(monthSum("ws-1")).toBe(14_000);
  });

  it.each([
    ["not JSON", "this is not json", BRIEF],
    ["outside the answer schema", JSON.stringify({ nope: 1 }), BRIEF],
    ["a quote not in the brief", JSON.stringify(GOOD), "A calm clinic"],
  ])("a refused answer still counts its cost: %s", async (_name, content, brief) => {
    answers(content);
    expect(await readBriefWithAi(brief)).toEqual({ ok: false, error: "ai-failed" });
    expect(records()).toEqual([entry(14_000)]);
  });

  it.each([
    ["status 500", () => fetchSpy.mockResolvedValue(new Response("down", { status: 500 }))],
    [
      "an answer without the cost field",
      () => fetchSpy.mockImplementation(async () => completion("not json", { usage: {} })),
    ],
    [
      "an aborted request",
      () => fetchSpy.mockRejectedValue(new DOMException("aborted", "AbortError")),
    ],
  ])("a call with no reported cost is recorded as not reported: %s", async (_name, arrange) => {
    arrange();
    expect(await readBriefWithAi(BRIEF)).toEqual({ ok: false, error: "ai-failed" });
    expect(records()).toEqual([entry(null)]);
    expect(monthSum("ws-1")).toBe(0);
  });

  it("an answer without the cost field that reads well is recorded as not reported", async () => {
    answers(JSON.stringify(GOOD), { usage: {} });
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: true });
    expect(records()).toEqual([entry(null)]);
  });

  it("the cap check fails closed", async () => {
    state.sum = "unavailable";
    expect(await readBriefWithAi(BRIEF)).toEqual({ ok: false, error: "ai-failed" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.ledger).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("ai spend cap unavailable");
  });

  it("a failed record keeps the paid reading", async () => {
    answers(JSON.stringify(GOOD));
    state.recordFails = new RangeError(`${MARKER} 14000 test-key`);
    expect(await readBriefWithAi(BRIEF)).toMatchObject({ ok: true, value: { reading: {} } });
    expect(state.ledger).toEqual([]);
    expect(vi.mocked(console.error).mock.calls).toEqual([["ai usage record failed", "RangeError"]]);
  });

  it.each([
    ["no active workspace", null],
    ["a workspace the person is not a member of", "other"],
  ])(
    "AI reading needs a workspace the person belongs to: %s",
    async (_name, activeOrganizationId) => {
      state.session = { user: { id: "P" }, session: { activeOrganizationId } as never };
      answers(JSON.stringify(GOOD));
      expect(await readBriefWithAi(BRIEF)).toEqual({ ok: false, error: "forbidden" });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(state.ledger).toEqual([]);
    },
  );

  it("the rate limit answers before the cap", async () => {
    seed("ws-1", CAP);
    preload(LIMITS["ai-read"], { user: "P" }, 3600, 10);
    expect(await readBriefWithAi(BRIEF)).toEqual(refused("ai-rate-limited", 3600));
    expect(state.checked).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.ledger).toHaveLength(1);
  });

  it("no brief text in a record or a log line", async () => {
    const logs = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "info").mockImplementation(() => {}),
    ];
    const brief = `${MARKER} warm clinic`;
    answers(JSON.stringify(GOOD));
    await readBriefWithAi(brief);
    answers("this is not json");
    await readBriefWithAi(brief);
    fetchSpy.mockResolvedValue(new Response("down", { status: 500 }));
    await readBriefWithAi(brief);
    state.recordFails = new Error(brief);
    answers(JSON.stringify(GOOD));
    await readBriefWithAi(brief);
    expect(state.ledger).toHaveLength(3);
    const calls = [console.error, ...logs].flatMap((spy) => vi.mocked(spy).mock.calls);
    expect(JSON.stringify(calls)).not.toContain(MARKER);
    expect(JSON.stringify(state.ledger)).not.toContain(MARKER);
  });

  it("a brief refused before the model runs, or no key, records nothing", async () => {
    expect(await readBriefWithAi(42)).toEqual({ ok: false, error: "invalid-input" });
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(await readBriefWithAi(BRIEF)).toEqual({ ok: false, error: "ai-not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(state.ledger).toEqual([]);
  });
});
