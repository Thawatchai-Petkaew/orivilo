import { type Limit, LIMITS, type Subject } from "@orivilo/auth";
import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import type { ReadPorts } from "@orivilo/intent-engine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-266 tech notes section 9, tests A1 to A6 (task B4), and rows 12, 15, 28, 29 and 35 of the
// ORV-267 spec. The ports are fakes recorded in this file: no test reaches the internet. The limiter
// counts in memory, so these tests prove the order (session, limit, work) and the outcome shape.

const enc = new TextEncoder();

type Route = { status?: number; body?: string; error?: "timeout" | "network"; remote?: string };

const state = vi.hoisted(() => ({
  session: null as {
    user: { id: string; email?: string };
    session: { activeOrganizationId: string };
  } | null,
  order: [] as string[],
  listReads: 0,
  ip: "ip-1",
  mode: "count" as "count" | "unavailable",
  counts: new Map<string, number>(),
  consumed: [] as string[],
  routes: {} as Record<string, Route>,
  resolved: [] as string[],
  requested: [] as string[],
  created: 0,
}));

const keyOf = (limit: Limit, subject: Subject) =>
  "user" in subject ? `${limit.name}:u:${subject.user}` : `${limit.name}:ip:${subject.ip}`;

vi.mock("server-only", () => ({}));
vi.mock("@orivilo/db/client", () => ({ appDb: () => ({}) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("../../server/auth", () => ({
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
      state.listReads += 1;
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
vi.mock("../../server/read-ports", () => ({
  createReadPorts: (): ReadPorts => {
    state.created += 1;
    state.order.push("ports");
    return {
      async resolve(host) {
        state.resolved.push(host);
        return ["93.184.216.34"];
      },
      async request(r) {
        state.requested.push(r.url);
        const route = state.routes[r.url];
        if (route?.error) return { ok: false, error: route.error };
        return {
          ok: true,
          status: route?.status ?? 404,
          headers: { "content-type": "text/html" },
          body: enc.encode(route?.body ?? ""),
          truncated: false,
          remoteAddress: route?.remote ?? r.address,
        };
      },
      sha256: (b) => b.length.toString(16).padStart(64, "0"), // 64 lowercase hex, as the evidence schema asks
      elapsedMs: () => 0,
    };
  },
}));
// The engine runs for real; its two entries this action calls are wrapped so a test can see their
// arguments and make one fail.
vi.mock("@orivilo/intent-engine", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/intent-engine")>();
  return { ...real, readUrlInput: vi.fn(real.readUrlInput), reportOf: vi.fn(real.reportOf) };
});

const engine = await import("@orivilo/intent-engine");
const { analysePage } = await import("./actions");

// Fixtures only: addresses under example.com and example.test (ORV-268).
const LIST = "reader@example.com,second@example.test";
const person = {
  user: { id: "P", email: "reader@example.com" },
  session: { activeOrganizationId: "ws-1" },
};
let capture: ReturnType<typeof captureLines>;
const written = () => capture.lines.map((line) => expectLineShape(line));
const portCalls = () => state.resolved.length + state.requested.length;
const PAGE =
  "<html><head><title>Calm clinic</title></head><body><h1>premium and calm</h1></body></html>";

beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
  state.order = [];
  state.listReads = 0;
  state.session = person;
  state.ip = "ip-1";
  state.mode = "count";
  state.counts.clear();
  state.consumed = [];
  state.routes = {
    "https://example.com/robots.txt": { status: 404 },
    "https://example.com/": { status: 200, body: PAGE },
    "http://example.com/robots.txt": { status: 404 },
    "http://example.com/": { status: 200, body: PAGE },
  };
  state.resolved = [];
  state.requested = [];
  state.created = 0;
  vi.mocked(engine.readUrlInput).mockClear();
  vi.mocked(engine.reportOf).mockClear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  capture.restore();
});

const own = { url: "example.com", role: "own" } as const;
const viewOf = (result: Awaited<ReturnType<typeof analysePage>>) => {
  if (!result.ok) throw new Error(`failed: ${result.error}`);
  return result.value;
};

describe("A1: signed out", () => {
  it("answers signed-out and calls no port", async () => {
    state.session = null;
    expect(await analysePage(own)).toMatchObject({
      ok: false,
      error: "signed-out",
      code: "UNAUTHENTICATED",
    });
    expect(portCalls()).toBe(0);
    expect(state.created).toBe(0);
    expect(engine.readUrlInput).not.toHaveBeenCalled();
  });

  it("counts the call against the network, not a person", async () => {
    state.session = null;
    await analysePage(own);
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
  });
});

describe("A2: the limit", () => {
  it("over the hour: rate-limited with retryAfter, code RATE_LIMITED, no port", async () => {
    state.counts.set(`${keyOf(LIMITS["page-read"], { user: "P" })}@3600`, 10);
    expect(await analysePage(own)).toMatchObject({
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      retryAfter: 3600,
      retryable: true,
    });
    expect(portCalls()).toBe(0);
    expect(engine.readUrlInput).not.toHaveBeenCalled();
  });

  it("over the day: rate-limited with the day's retryAfter", async () => {
    state.counts.set(`${keyOf(LIMITS["page-read"], { user: "P" })}@86400`, 50);
    expect(await analysePage(own)).toMatchObject({ error: "rate-limited", retryAfter: 86_400 });
    expect(portCalls()).toBe(0);
  });

  it("store down: SERVICE_UNAVAILABLE, failed, no port", async () => {
    state.mode = "unavailable";
    expect(await analysePage(own)).toMatchObject({
      ok: false,
      error: "failed",
      code: "SERVICE_UNAVAILABLE",
      retryable: true,
    });
    expect(portCalls()).toBe(0);
    expect(engine.readUrlInput).not.toHaveBeenCalled();
  });

  it("counts every call that reaches the server, whatever its result, under page-read", async () => {
    await analysePage(own);
    await analysePage({ url: "", role: "own" });
    await analysePage({ url: "x", role: "own", extra: 1 });
    expect(state.consumed).toEqual(["page-read:u:P", "page-read:u:P", "page-read:u:P"]);
  });
});

describe("A3: a competitor", () => {
  it("gives a not-read view and calls no port", async () => {
    const view = viewOf(await analysePage({ url: "rival.example", role: "competitor" }));
    expect(view).toEqual({
      status: "not-read",
      url: "https://rival.example",
      line: "read.notRead.competitor",
    });
    expect(portCalls()).toBe(0);
  });
});

describe("A4: what a read gives", () => {
  it("a read page is an analysed view", async () => {
    const view = viewOf(await analysePage(own));
    expect(view).toMatchObject({
      status: "analysed",
      url: "https://example.com/",
      role: "own",
      thin: true,
    });
    expect(state.requested).toEqual(["https://example.com/robots.txt", "https://example.com/"]);
  });

  it("a refused read is an ok view", async () => {
    expect(viewOf(await analysePage({ url: "http://127.0.0.1/", role: "own" }))).toEqual({
      status: "refused",
      url: "http://127.0.0.1/",
      urlCut: false,
      line: "read.refused.address",
    });
    expect(portCalls()).toBe(0);
  });

  it("a robots refusal is an ok view", async () => {
    state.routes["https://example.com/robots.txt"] = {
      status: 200,
      body: "User-agent: *\nDisallow: /",
    };
    expect(viewOf(await analysePage(own))).toMatchObject({
      status: "refused",
      line: "read.refused.robots",
    });
  });

  it("a failed read is an ok view", async () => {
    state.routes["https://example.com/"] = { error: "network" };
    expect(viewOf(await analysePage(own))).toMatchObject({
      status: "refused",
      line: "read.failed.network",
    });
    state.routes["https://example.com/"] = { error: "timeout" };
    expect(viewOf(await analysePage(own))).toMatchObject({
      status: "refused",
      line: "read.failed.timeout",
    });
  });

  it("a report no schema fits is failed, never a throw", async () => {
    vi.mocked(engine.reportOf).mockReturnValueOnce({ ok: false, error: "report-invalid" });
    expect(await analysePage(own)).toMatchObject({
      ok: false,
      error: "failed",
      code: "INTERNAL_ERROR",
    });
    // The ending names the reason `failed`, not an `unexpected` throw caught further down.
    const [line, ...rest] = written();
    expect(rest).toEqual([]);
    expect(line).toMatchObject({ outcome: "failed", reason: "failed" });
    expect(line).not.toHaveProperty("errorName");
  });

  it("a throw inside the work is failed, never a throw", async () => {
    vi.mocked(engine.readUrlInput).mockRejectedValueOnce(new TypeError("boom"));
    expect(await analysePage(own)).toMatchObject({ ok: false, error: "failed" });
  });

  it("an extra key, a bad role, a missing field or a non-object is invalid-input and calls no port", async () => {
    for (const input of [
      { url: "example.com", role: "own", extra: 1 },
      { url: "example.com", role: "boss" },
      { url: "example.com" },
      { role: "own" },
      { url: 5, role: "own" },
      { url: "   ", role: "own" },
      null,
      "example.com",
    ]) {
      expect(await analysePage(input)).toMatchObject({
        ok: false,
        error: "invalid-input",
        code: "INVALID_INPUT",
      });
    }
    expect(portCalls()).toBe(0);
    expect(engine.readUrlInput).not.toHaveBeenCalled();
  });
});

describe("A5: the log line", () => {
  const SECRETS = ["private-clinic.example", "secret-path", "uniqueheadingword", "uniquequote"];

  it("holds no URL, host, quote or body text, and one page-read step line is written", async () => {
    state.routes = {
      "https://private-clinic.example/robots.txt": { status: 404 },
      "https://private-clinic.example/secret-path": {
        status: 200,
        body: "<html><head><title>uniqueheadingword</title></head><body><p>uniquequote premium</p></body></html>",
      },
    };
    await analysePage({ url: " private-clinic.example/secret-path ", role: "own" });
    const lines = written();
    const text = JSON.stringify(lines);
    for (const secret of SECRETS) expect(text).not.toContain(secret);
    const steps = lines.filter((l) => l["step"] === "page-read");
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ outcome: "read", route: "read/analysePage" });
    const [boundary, ...rest] = lines.filter((l) => !("step" in l));
    expect(rest).toEqual([]);
    expect(boundary).toMatchObject({ route: "read/analysePage", outcome: "ok", level: "info" });
  });

  it("each ending reads as its outcome and holds no address", async () => {
    const outcomes: [() => void, string, string][] = [
      [() => (state.mode = "unavailable"), "unavailable", "rate-limit"],
      [
        () => state.counts.set(`${keyOf(LIMITS["page-read"], { user: "P" })}@3600`, 10),
        "limited",
        "rate-limited",
      ],
      [() => (state.session = null), "refused", "signed-out"],
    ];
    for (const [arrange, outcome, reason] of outcomes) {
      capture.lines.length = 0;
      state.mode = "count";
      state.counts.clear();
      state.session = person;
      arrange();
      await analysePage({ url: "private-clinic.example/secret-path", role: "own" });
      const lines = written();
      expect(lines.filter((l) => !("step" in l)).at(-1)).toMatchObject({ outcome, reason });
      for (const secret of SECRETS) expect(JSON.stringify(lines)).not.toContain(secret);
    }
  });

  it("a throw carrying the address logs its name only", async () => {
    vi.mocked(engine.readUrlInput).mockRejectedValueOnce(
      new TypeError("boom https://private-clinic.example/secret-path"),
    );
    await analysePage({ url: "private-clinic.example/secret-path", role: "own" });
    const lines = written();
    for (const secret of SECRETS) expect(JSON.stringify(lines)).not.toContain(secret);
    expect(lines.at(-1)).toMatchObject({ outcome: "failed", errorName: "TypeError" });
  });

  it("names the step outcome of each result", async () => {
    const stepOf = async () => {
      const outcome = written().find((l) => l["step"] === "page-read")?.["outcome"];
      capture.lines.length = 0;
      return outcome;
    };
    const seen: unknown[] = [];
    await analysePage({ url: "rival.example", role: "competitor" });
    seen.push(await stepOf());
    await analysePage({ url: "http://127.0.0.1/", role: "own" });
    seen.push(await stepOf());
    state.routes["https://example.com/"] = { error: "timeout" };
    await analysePage(own);
    seen.push(await stepOf());
    state.routes["https://example.com/robots.txt"] = {
      status: 200,
      body: "User-agent: *\nDisallow: /",
    };
    await analysePage(own);
    seen.push(await stepOf());
    expect(seen).toEqual(["not-read", "refused-address", "timeout", "refused-robots"]);
  });
});

describe("A6: url-input-1", () => {
  it("passes ` example.com ` on as https://example.com, to the read and to the report", async () => {
    const view = viewOf(await analysePage({ url: " example.com ", role: "own" }));
    expect(engine.readUrlInput).toHaveBeenCalledTimes(1);
    expect(vi.mocked(engine.readUrlInput).mock.calls[0]?.[0]).toEqual({
      url: "https://example.com",
      role: "own",
    });
    expect(vi.mocked(engine.reportOf).mock.calls[0]?.[0]).toBe("https://example.com");
    expect(view).toMatchObject({ status: "analysed", url: "https://example.com/" });
  });

  it("gives each worked example its line", async () => {
    const cases: [string, string, "analysed" | "refused"][] = [
      ["example.com", "https://example.com", "analysed"],
      ["  https://example.com/  ", "https://example.com/", "analysed"],
      ["HTTP://example.com/", "HTTP://example.com/", "analysed"],
      ["localhost:3000", "https://localhost:3000", "refused"],
      ["javascript:alert(1)", "https://javascript:alert(1)", "refused"],
      ["ftp://example.com/", "ftp://example.com/", "refused"],
    ];
    for (const [typed, given, status] of cases) {
      vi.mocked(engine.readUrlInput).mockClear();
      const view = viewOf(await analysePage({ url: typed, role: "own" }));
      expect(vi.mocked(engine.readUrlInput).mock.calls[0]?.[0].url).toBe(given);
      expect(view.status).toBe(status);
    }
    const refusedLines = [];
    for (const typed of ["localhost:3000", "javascript:alert(1)", "ftp://example.com/"]) {
      const view = viewOf(await analysePage({ url: typed, role: "own" }));
      refusedLines.push(view.status === "refused" ? view.line : view.status);
    }
    expect(refusedLines).toEqual([
      "read.refused.address",
      "read.refused.address",
      "read.refused.address",
    ]);
  });

  it("passes trimmed text of 2,048 characters and refuses 2,049 as invalid-input with no port", async () => {
    const edge = "a".repeat(2048);
    const result = await analysePage({ url: `  ${edge}  `, role: "own" });
    expect(result.ok).toBe(true);
    expect(engine.readUrlInput).toHaveBeenCalledTimes(1);

    vi.mocked(engine.readUrlInput).mockClear();
    state.resolved = [];
    state.requested = [];
    expect(await analysePage({ url: `${edge}a`, role: "own" })).toMatchObject({
      ok: false,
      error: "invalid-input",
    });
    expect(engine.readUrlInput).not.toHaveBeenCalled();
    expect(portCalls()).toBe(0);
  });
});

describe("credentials before url-input-1", () => {
  const typed = "https:/user:secret@example.com/";

  it.each(["own", "competitor"] as const)(
    "role %s: the text reaches the read and the report as written, and the view is a refused address",
    async (role) => {
      const view = viewOf(await analysePage({ url: `  ${typed}  `, role }));
      expect(vi.mocked(engine.readUrlInput).mock.calls[0]?.[0]).toEqual({ url: typed, role });
      expect(vi.mocked(engine.reportOf).mock.calls[0]?.[0]).toBe(typed);
      expect(view).toEqual({
        status: "refused",
        url: "https://example.com/",
        urlCut: false,
        line: "read.refused.address",
      });
      expect(JSON.stringify(view)).not.toContain("secret");
      expect(portCalls()).toBe(0);
    },
  );

  it("a username alone or a password alone is enough to keep the text as written", async () => {
    for (const text of ["https:/user@example.com/", "https:/:secret@example.com/"]) {
      vi.mocked(engine.readUrlInput).mockClear();
      const view = viewOf(await analysePage({ url: text, role: "own" }));
      expect(vi.mocked(engine.readUrlInput).mock.calls[0]?.[0].url).toBe(text);
      expect(view).toMatchObject({ status: "refused", line: "read.refused.address" });
      expect(JSON.stringify(view)).not.toContain("secret");
    }
  });

  it("text the parser rejects, or reads with no credentials, still gets https:// in front", async () => {
    for (const [text, given] of [
      ["example.com", "https://example.com"],
      ["localhost:3000", "https://localhost:3000"],
      ["https://example.com/@brand", "https://example.com/@brand"],
    ] as const) {
      vi.mocked(engine.readUrlInput).mockClear();
      await analysePage({ url: text, role: "own" });
      expect(vi.mocked(engine.readUrlInput).mock.calls[0]?.[0].url).toBe(given);
    }
  });
});

// ORV-268 rows 7 to 10: read-door-1 puts the allow-list second, after the session and before the
// limit, the input and the ports.
describe("read-door-1", () => {
  const stranger = {
    user: { id: "S", email: "other@example.com" },
    session: { activeOrganizationId: "ws-2" },
  };
  const nothingSpent = () => {
    expect(state.consumed).toEqual([]);
    expect(state.created).toBe(0);
    expect(state.resolved).toEqual([]);
    expect(state.requested).toEqual([]);
  };

  it("not allowed refuses first", async () => {
    state.session = stranger;
    for (const arrange of [() => {}, () => (state.mode = "unavailable")]) {
      state.mode = "count";
      arrange();
      for (const input of [own, {}]) {
        const result = await analysePage(input);
        expect(result).toEqual({
          ok: false,
          error: "forbidden",
          code: "FORBIDDEN",
          requestId: expect.any(String),
          retryable: false,
        });
        expect(result).not.toHaveProperty("message");
        nothingSpent();
      }
    }
    expect(engine.readUrlInput).not.toHaveBeenCalled();
  });

  it("allowed order: session, allow-list, consume, ports", async () => {
    // Invalid input: one consume, then invalid-input, and no ports.
    expect(await analysePage({})).toMatchObject({ ok: false, error: "invalid-input" });
    expect(state.consumed).toEqual(["page-read:u:P"]);
    expect(state.created).toBe(0);
    expect(state.order).toEqual(["session", "allow-list", "consume"]);

    // The hourly window used up: rate-limited, no ports.
    state.order = [];
    state.consumed = [];
    state.counts.set(`${keyOf(LIMITS["page-read"], { user: "P" })}@3600`, 10);
    expect(await analysePage(own)).toMatchObject({
      ok: false,
      error: "rate-limited",
      retryAfter: 3600,
    });
    expect(state.created).toBe(0);

    // A valid input to a routed fake page: a report, and one set of ports.
    state.counts.clear();
    state.order = [];
    expect(viewOf(await analysePage(own))).toMatchObject({ status: "analysed" });
    expect(state.created).toBe(1);
    expect(state.order).toEqual(["session", "allow-list", "consume", "ports"]);
  });

  it("signed out: one signed-out consume by IP and the list is not read", async () => {
    state.session = null;
    expect(await analysePage(own)).toMatchObject({ ok: false, error: "signed-out" });
    expect(state.consumed).toEqual(["signed-out:ip:ip-1"]);
    expect(state.listReads).toBe(0);
    expect(state.order).toEqual(["session", "consume"]);
  });

  it("no address in logs or answer", async () => {
    state.session = { ...stranger, user: { id: "S", email: "not.listed+tag@example.com" } };
    const result = await analysePage(own);
    const lines = written();
    const everything = JSON.stringify([result, lines, capture.lines]);
    for (const piece of ["not.listed", "example.com", "reader@", "second@"]) {
      expect(everything).not.toContain(piece);
    }
    const [boundary, ...rest] = lines;
    expect(rest).toEqual([]);
    expect(boundary).toMatchObject({
      route: "read/analysePage",
      level: "info",
      outcome: "refused",
      reason: "forbidden",
    });
  });
});
