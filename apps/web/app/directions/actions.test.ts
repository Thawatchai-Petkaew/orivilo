import { type Limit, LIMITS, type RateLimiter, type Subject } from "@orivilo/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-112 AC 5 to 10 and 15: the wiring of the limits into the directions actions. The store is
// proven in packages/auth; here a fake limiter counts in memory, so these tests prove the order
// (session, then limit, then work) and the outcome shape.

const state = vi.hoisted(() => ({
  session: null as { user: { id: string }; session: { activeOrganizationId: string } } | null,
  ip: "ip-1",
  counts: new Map<string, number>(),
  mode: "count" as "count" | "unavailable",
  consumed: [] as string[],
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
