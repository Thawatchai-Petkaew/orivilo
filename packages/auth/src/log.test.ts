import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  atBoundary,
  BOUNDARY_OUTCOMES,
  endingOfStatus,
  logStep,
  REASONS,
  REQUEST_ID_HEADER,
  requestIdOf,
  ROUTES,
  STEP_OUTCOMES,
  writeLine,
  type Ending,
} from "./log.ts";
import * as index from "./index.ts";
import { LIMITS } from "./rate-limit.ts";
import { captureLines, expectLineShape, type CapturedLine } from "./log-testing.ts";

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";
const OTHER_ID = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const base = { level: "info", requestId: ID, route: "directions/saveDirection", durationMs: 5 };

let capture: ReturnType<typeof captureLines>;
beforeEach(() => {
  capture = captureLines();
});
afterEach(() => {
  capture.restore();
  vi.useRealTimers();
});

function first(): CapturedLine {
  const line = capture.lines[0];
  if (!line) throw new Error("no line was written");
  return line;
}

/** Writes one line and returns it parsed, after the shape check. */
function written(fields: Record<string, unknown>): Record<string, unknown> {
  writeLine(fields);
  expect(capture.lines).toHaveLength(1);
  return expectLineShape(first());
}

describe("the closed lists", () => {
  it("pins the lists the spec names, in order", () => {
    expect(REQUEST_ID_HEADER).toBe("x-request-id");
    expect(ROUTES).toEqual([
      "directions/listDirections",
      "directions/saveDirection",
      "directions/approveDirection",
      "directions/openVersion",
      "directions/exportVersion",
      "directions/importDirection",
      "directions/readBriefWithAi",
      "account/signInWithGoogle",
      "account/signOut",
      "i18n/setLocale",
      "api/auth",
    ]);
    expect(BOUNDARY_OUTCOMES).toEqual(["ok", "refused", "limited", "unavailable", "failed"]);
    expect(STEP_OUTCOMES).toEqual({
      "rate-limit": ["allowed", "limited", "unavailable"],
      "client-ip": ["no-trusted-ip"],
      "ai-usage": ["record-failed", "cost-not-reported"],
    });
    expect(REASONS).toEqual([
      "adapter-failed",
      "invalid-output",
      "evidence-mismatch",
      "rate-limit",
      "unexpected",
      "signed-out",
      "forbidden",
      "not-configured",
      "failed",
      "ai-failed",
      "ai-not-configured",
      "rate-limited",
      "ai-rate-limited",
      "invalid-input",
      "invalid-file",
      "not-found",
      "no-draft",
      "resolver-changed",
      "profile-missing",
      "fingerprint-mismatch",
    ]);
  });
});

describe("writeLine", () => {
  it("writes only allow-listed keys and closed values", () => {
    const line = written({
      ...base,
      level: "error",
      route: "directions/readBriefWithAi",
      durationMs: 237.5,
      outcome: "failed",
      email: "ana@example.com",
      token: "sk-or-v1-seeded",
      detail: "OpenRouter answered 401. No auth credentials found ana@example.com sk-or-v1-seeded",
      reason: "OpenRouter answered 401.",
    });
    expect(line).toEqual({
      level: "error",
      requestId: ID,
      route: "directions/readBriefWithAi",
      durationMs: 238,
      outcome: "failed",
      reason: "unknown",
    });
    const text = first().args[0] as string;
    expect(text).not.toContain("ana@example.com");
    expect(text).not.toContain("sk-or-v1-seeded");
  });

  it("writes the keys in the allow-list's order", () => {
    writeLine({
      errorName: "Error",
      status: 503,
      reason: "rate-limit",
      limit: "write",
      step: "rate-limit",
      outcome: "unavailable",
      durationMs: 1,
      route: "api/auth",
      requestId: ID,
      level: "info",
    });
    expect(Object.keys(JSON.parse(first().args[0] as string))).toEqual([
      "level",
      "requestId",
      "route",
      "durationMs",
      "outcome",
      "step",
      "limit",
      "reason",
      "status",
      "errorName",
    ]);
  });

  it.each([
    ["info", "log"],
    ["warn", "warn"],
    ["error", "error"],
  ])("sends a %s line to console.%s and no other stream", (level, stream) => {
    writeLine({ ...base, level, outcome: "ok" });
    expect(capture.lines.map((l) => l.stream)).toEqual([stream]);
    expect(expectLineShape(first())["level"]).toBe(level);
  });

  it("writes a level outside the three as error, on standard error", () => {
    const line = written({ ...base, level: "debug", outcome: "ok" });
    expect(line["level"]).toBe("error");
    expect(first().stream).toBe("error");
  });

  it("writes a missing level as error", () => {
    expect(
      written({ requestId: ID, route: "api/auth", durationMs: 1, outcome: "ok" })["level"],
    ).toBe("error");
  });

  it.each(ROUTES)("keeps the route %s", (route) => {
    expect(written({ ...base, route, outcome: "ok" })["route"]).toBe(route);
  });

  it.each(["api/auth/sign-in/social", "ana@example.com", "", 7, undefined])(
    "writes the route %j as unknown",
    (route) => {
      expect(written({ ...base, route, outcome: "ok" })["route"]).toBe("unknown");
    },
  );

  it.each(REASONS)("keeps the reason %s", (reason) => {
    expect(written({ ...base, outcome: "failed", reason })["reason"]).toBe(reason);
  });

  it.each(["OpenRouter answered 401.", "", 7, null])(
    "writes the reason %j as unknown",
    (reason) => {
      expect(written({ ...base, outcome: "failed", reason })["reason"]).toBe("unknown");
    },
  );

  it("leaves reason out when none is passed", () => {
    expect(written({ ...base, outcome: "ok" })).not.toHaveProperty("reason");
  });

  it.each(Object.entries(STEP_OUTCOMES).flatMap(([step, list]) => list.map((o) => [step, o])))(
    "keeps the step %s with its outcome %s",
    (step, outcome) => {
      const line = written({ ...base, step, outcome });
      expect(line["step"]).toBe(step);
      expect(line["outcome"]).toBe(outcome);
    },
  );

  it.each(["ana@example.com", "other", 7, null])("writes the step %j as unknown", (step) => {
    const line = written({ ...base, step, outcome: "allowed" });
    expect(line["step"]).toBe("unknown");
    expect(line["outcome"]).toBe("unknown");
  });

  it.each([
    ["rate-limit", "no-trusted-ip"],
    ["rate-limit", "ok"],
    ["client-ip", "allowed"],
    ["ai-usage", "limited"],
    ["ai-usage", "failed"],
  ])("writes the outcome %s/%s as unknown", (step, outcome) => {
    expect(written({ ...base, step, outcome })["outcome"]).toBe("unknown");
  });

  it.each(["allowed", "no-trusted-ip", "record-failed", "done", "", 7, undefined])(
    "writes the boundary outcome %j as unknown when no step names its list",
    (outcome) => {
      expect(written({ ...base, outcome })["outcome"]).toBe("unknown");
    },
  );

  it.each(BOUNDARY_OUTCOMES)("keeps the boundary outcome %s", (outcome) => {
    expect(written({ ...base, outcome })["outcome"]).toBe(outcome);
  });

  it.each([...Object.keys(LIMITS), "auth-http"])("keeps the limit %s", (limit) => {
    expect(written({ ...base, step: "rate-limit", outcome: "allowed", limit })["limit"]).toBe(
      limit,
    );
  });

  it.each(["ana@example.com", "", 7, null])("writes the limit %j as unknown", (limit) => {
    expect(written({ ...base, step: "rate-limit", outcome: "allowed", limit })["limit"]).toBe(
      "unknown",
    );
  });

  it("leaves limit and step out when none is passed", () => {
    const line = written({ ...base, outcome: "ok" });
    expect(line).not.toHaveProperty("limit");
    expect(line).not.toHaveProperty("step");
  });

  it("keeps a v4 request id and writes anything else as unknown", () => {
    expect(written({ ...base, outcome: "ok" })["requestId"]).toBe(ID);
    capture.lines.length = 0;
    for (const requestId of [
      "client-chosen-id",
      "5f0c6f7e-2b1d-1c3a-9e8f-0a1b2c3d4e5f", // version 1
      "5f0c6f7e-2b1d-4c3a-7e8f-0a1b2c3d4e5f", // variant 7
      "5F0C6F7E-2B1D-4C3A-9E8F-0A1B2C3D4E5F", // upper case
      `${ID}\n`,
      "",
      7,
      undefined,
    ]) {
      capture.lines.length = 0;
      expect(written({ ...base, requestId, outcome: "ok" })["requestId"]).toBe("unknown");
    }
  });

  it("rounds durationMs half up, floors a negative at 0 and writes a non-number as 0", () => {
    expect(written({ ...base, durationMs: 237.5, outcome: "ok" })["durationMs"]).toBe(238);
    capture.lines.length = 0;
    expect(written({ ...base, durationMs: 237.4, outcome: "ok" })["durationMs"]).toBe(237);
    for (const durationMs of [
      -3,
      -0.4,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "12",
      null,
      undefined,
    ]) {
      capture.lines.length = 0;
      expect(written({ ...base, durationMs, outcome: "ok" })["durationMs"]).toBe(0);
    }
  });

  it("keeps an integer status from 100 to 599 on api/auth lines only", () => {
    const auth = { ...base, route: "api/auth", outcome: "ok" };
    for (const status of [100, 200, 503, 599]) {
      capture.lines.length = 0;
      expect(written({ ...auth, status })["status"]).toBe(status);
    }
    for (const status of [99, 600, 200.5, "200", Number.NaN, null, undefined]) {
      capture.lines.length = 0;
      expect(written({ ...auth, status })).not.toHaveProperty("status");
    }
    capture.lines.length = 0;
    expect(written({ ...base, outcome: "ok", status: 200 })).not.toHaveProperty("status");
    capture.lines.length = 0;
    expect(written({ ...base, route: "elsewhere", outcome: "ok", status: 200 })).not.toHaveProperty(
      "status",
    );
  });

  it("keeps an error name that matches the pattern and writes the rest as unknown", () => {
    for (const [name, expected] of [
      ["Error", "Error"],
      ["DirectionError", "DirectionError"],
      ["A".repeat(40), "A".repeat(40)],
      ["A".repeat(41), "unknown"],
      ["Error: ana@example.com", "unknown"],
      ["error", "unknown"],
      ["Error2", "unknown"],
      ["Error\n", "unknown"],
      ["", "unknown"],
      [7, "unknown"],
    ] as const) {
      capture.lines.length = 0;
      expect(written({ ...base, outcome: "failed", errorName: name })["errorName"]).toBe(expected);
    }
  });

  it("leaves errorName out when none is passed", () => {
    expect(written({ ...base, outcome: "ok" })).not.toHaveProperty("errorName");
  });

  it("writes one physical line even when a value holds a newline", () => {
    writeLine({ ...base, outcome: "ok", route: "a\nb", reason: "x\ny" });
    expect(expectLineShape(first())["route"]).toBe("unknown");
  });
});

describe("requestIdOf", () => {
  it("keeps a UUID v4 from the header", () => {
    expect(requestIdOf(new Headers({ [REQUEST_ID_HEADER]: ID }))).toBe(ID);
  });

  it("makes a fresh UUID v4 when the header is missing or is not one, never the client's value", () => {
    const seen = new Set<string>();
    for (const headers of [
      new Headers(),
      new Headers({ "x-request-id": "client-chosen-id" }),
      new Headers({ "x-request-id": "5f0c6f7e-2b1d-1c3a-9e8f-0a1b2c3d4e5f" }),
      new Headers({ "x-request-id": "5f0c6f7e-2b1d-4c3a-7e8f-0a1b2c3d4e5f" }),
      new Headers({ "x-request-id": "" }),
    ]) {
      const id = requestIdOf(headers);
      expect(id).toMatch(UUID_V4);
      seen.add(id);
    }
    expect(seen.size).toBe(5);
    expect(requestIdOf(new Headers({ "x-request-id": "client-chosen-id" }))).not.toBe(
      "client-chosen-id",
    );
  });
});

describe("atBoundary", () => {
  const context = { requestId: ID, route: "directions/saveDirection" } as const;
  const ok: Ending = { level: "info", outcome: "ok" };

  it("writes exactly one line and returns the work's value", async () => {
    await expect(atBoundary(context, async () => ({ value: 42, ending: ok }))).resolves.toBe(42);
    expect(capture.lines).toHaveLength(1);
    expect(expectLineShape(first())).toEqual({
      level: "info",
      requestId: ID,
      route: "directions/saveDirection",
      durationMs: 0,
      outcome: "ok",
    });
  });

  it("writes the ending's fields on the line", async () => {
    await atBoundary({ requestId: ID, route: "api/auth" }, async () => ({
      value: null,
      ending: { level: "error", outcome: "unavailable", reason: "rate-limit", status: 503 },
    }));
    expect(expectLineShape(first())).toMatchObject({
      level: "error",
      route: "api/auth",
      outcome: "unavailable",
      reason: "rate-limit",
      status: 503,
    });
    expect(first().stream).toBe("error");
  });

  it("takes the context's id and route even when the ending carries others", async () => {
    await atBoundary(context, async () => ({
      value: 1,
      ending: { ...ok, requestId: OTHER_ID, route: "api/auth" } as Ending,
    }));
    expect(expectLineShape(first())).toMatchObject({
      requestId: ID,
      route: "directions/saveDirection",
    });
  });

  it("measures durationMs from entering the boundary to writing the line", async () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    await atBoundary(context, async () => {
      vi.advanceTimersByTime(238);
      return { value: 1, ending: ok };
    });
    expect(expectLineShape(first())["durationMs"]).toBe(238);
  });

  it("writes one failed line by name only for a throw, and rethrows the same error", async () => {
    const thrown = new TypeError("ana@example.com tok_seeded");
    await expect(
      atBoundary(context, async () => {
        throw thrown;
      }),
    ).rejects.toBe(thrown);
    expect(capture.lines).toHaveLength(1);
    const line = expectLineShape(first());
    expect(line).toMatchObject({
      level: "error",
      outcome: "failed",
      reason: "unexpected",
      errorName: "TypeError",
    });
    expect(line).not.toHaveProperty("status");
    const text = first().args[0] as string;
    expect(text).not.toContain("ana@example.com");
    expect(text).not.toContain("tok_seeded");
  });

  it("writes errorName unknown for a thrown value that is not an Error", async () => {
    await expect(
      atBoundary(context, async () => {
        throw "ana@example.com";
      }),
    ).rejects.toBe("ana@example.com");
    expect(expectLineShape(first())["errorName"]).toBe("unknown");
    expect(first().args[0]).not.toContain("ana@example.com");
  });

  it("gives a step line the open boundary's id and route, also after an await", async () => {
    await atBoundary(context, async () => {
      await Promise.resolve();
      logStep({ step: "rate-limit", outcome: "allowed", durationMs: 2, limit: "write" });
      return { value: 1, ending: ok };
    });
    expect(capture.lines).toHaveLength(2);
    const [step, boundary] = capture.lines.map(expectLineShape);
    expect(step).toEqual({
      level: "info",
      requestId: ID,
      route: "directions/saveDirection",
      durationMs: 2,
      outcome: "allowed",
      step: "rate-limit",
      limit: "write",
    });
    expect(boundary).toMatchObject({ requestId: ID, outcome: "ok" });
  });

  it("keeps two overlapping requests apart", async () => {
    const run = (requestId: string, route: "api/auth" | "i18n/setLocale", wait: number) =>
      atBoundary({ requestId, route }, async () => {
        await new Promise((r) => setTimeout(r, wait));
        logStep({ step: "client-ip", outcome: "no-trusted-ip", durationMs: 0, level: "warn" });
        return { value: requestId, ending: ok };
      });
    await Promise.all([run(ID, "api/auth", 20), run(OTHER_ID, "i18n/setLocale", 1)]);
    const steps = capture.lines.map(expectLineShape).filter((l) => l["step"] === "client-ip");
    expect(steps.map((l) => [l["requestId"], l["route"]]).sort()).toEqual(
      [
        [ID, "api/auth"],
        [OTHER_ID, "i18n/setLocale"],
      ].sort(),
    );
  });

  it("shares the context between two copies of the module", async () => {
    vi.resetModules();
    const copy = await import("./log.ts");
    expect(copy.atBoundary).not.toBe(atBoundary);
    await atBoundary(context, async () => {
      copy.logStep({ step: "ai-usage", outcome: "record-failed", durationMs: 1, level: "warn" });
      return { value: 1, ending: ok };
    });
    expect(expectLineShape(first())).toMatchObject({
      requestId: ID,
      route: "directions/saveDirection",
      step: "ai-usage",
    });
  });
});

describe("logStep", () => {
  it("writes unknown for the id and route outside a request", () => {
    logStep({ step: "client-ip", outcome: "no-trusted-ip", durationMs: 3, level: "warn" });
    expect(expectLineShape(first())).toEqual({
      level: "warn",
      requestId: "unknown",
      route: "unknown",
      durationMs: 3,
      outcome: "no-trusted-ip",
      step: "client-ip",
    });
    expect(first().stream).toBe("warn");
  });

  it("does not borrow the id of a request that has ended", async () => {
    await atBoundary({ requestId: ID, route: "api/auth" }, async () => ({
      value: 1,
      ending: { level: "info", outcome: "ok" },
    }));
    capture.lines.length = 0;
    logStep({ step: "rate-limit", outcome: "allowed", durationMs: 1 });
    expect(expectLineShape(first())["requestId"]).toBe("unknown");
  });

  it("defaults to info", () => {
    logStep({ step: "rate-limit", outcome: "limited", durationMs: 1 });
    expect(first().stream).toBe("log");
    expect(expectLineShape(first())["level"]).toBe("info");
  });

  it("never writes an error line, whatever level it is passed", () => {
    logStep({
      step: "rate-limit",
      outcome: "unavailable",
      durationMs: 1,
      level: "error" as unknown as "warn",
    });
    expect(capture.lines.map((l) => l.stream)).toEqual(["log"]);
  });

  it("keeps a step's context over fields passed in", () => {
    logStep({
      step: "rate-limit",
      outcome: "allowed",
      durationMs: 1,
      requestId: OTHER_ID,
      route: "api/auth",
    } as Parameters<typeof logStep>[0]);
    expect(expectLineShape(first())).toMatchObject({
      requestId: "unknown",
      route: "unknown",
    });
  });
});

describe("endingOfStatus", () => {
  it.each([
    [200, "info", "ok"],
    [302, "info", "ok"],
    [399, "info", "ok"],
    [400, "info", "refused"],
    [401, "info", "refused"],
    [428, "info", "refused"],
    [429, "warn", "limited"],
    [430, "info", "refused"],
    [499, "info", "refused"],
    [500, "error", "failed"],
    [502, "error", "failed"],
    [503, "error", "unavailable"],
    [504, "error", "failed"],
  ])("maps %i to %s %s with the status set", (status, level, outcome) => {
    expect(endingOfStatus(status)).toEqual({ level, outcome, status });
  });
});

describe("the package surface", () => {
  it("exports the logger's entry points from the index and keeps writeLine and endingOfStatus off it", () => {
    expect(index.atBoundary).toBe(atBoundary);
    expect(index.logStep).toBe(logStep);
    expect(index.requestIdOf).toBe(requestIdOf);
    expect(index.REQUEST_ID_HEADER).toBe("x-request-id");
    expect(index).not.toHaveProperty("writeLine");
    expect(index).not.toHaveProperty("endingOfStatus");
  });

  it("exposes the test helper as @orivilo/auth/log-testing", async () => {
    const { readFile } = await import("node:fs/promises");
    const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    expect(pkg.exports["./log-testing"]).toBe("./src/log-testing.ts");
  });
});

describe("expectLineShape (the shared helper)", () => {
  const good = JSON.stringify({ ...base, outcome: "ok" });
  const line = (args: unknown[], stream: CapturedLine["stream"] = "log"): CapturedLine => ({
    stream,
    args,
  });

  it("accepts a good line and returns it parsed", () => {
    expect(expectLineShape(line([good]))).toEqual({ ...base, outcome: "ok" });
  });

  it.each([
    ["two arguments", line([good, "x"])],
    ["no argument", line([])],
    ["an object instead of a string", line([{ level: "info" }])],
    ["a newline inside", line([good.replace("{", "{\n")])],
    ["a carriage return inside", line([good.replace("{", "{\r")])],
    ["text that is not JSON", line(["level info"])],
    ["a JSON array", line(["[1]"])],
    ["JSON null", line(["null"])],
    ["a missing level", line([JSON.stringify({ ...base, level: undefined, outcome: "ok" })])],
    [
      "a level outside the three",
      line([JSON.stringify({ ...base, level: "debug", outcome: "ok" })]),
    ],
    [
      "a missing requestId",
      line([JSON.stringify({ ...base, requestId: undefined, outcome: "ok" })]),
    ],
    ["a numeric requestId", line([JSON.stringify({ ...base, requestId: 1, outcome: "ok" })])],
    ["a missing route", line([JSON.stringify({ ...base, route: undefined, outcome: "ok" })])],
    ["a numeric route", line([JSON.stringify({ ...base, route: 1, outcome: "ok" })])],
    [
      "a missing durationMs",
      line([JSON.stringify({ ...base, durationMs: undefined, outcome: "ok" })]),
    ],
    [
      "a fractional durationMs",
      line([JSON.stringify({ ...base, durationMs: 1.5, outcome: "ok" })]),
    ],
    ["a negative durationMs", line([JSON.stringify({ ...base, durationMs: -1, outcome: "ok" })])],
    ["a string durationMs", line([JSON.stringify({ ...base, durationMs: "1", outcome: "ok" })])],
    ["a missing outcome", line([JSON.stringify(base)])],
    ["a numeric outcome", line([JSON.stringify({ ...base, outcome: 1 })])],
    [
      "a key outside the allow-list",
      line([JSON.stringify({ ...base, outcome: "ok", email: "a" })]),
    ],
    [
      "a warn level on the log stream",
      line([JSON.stringify({ ...base, level: "warn", outcome: "ok" })]),
    ],
    ["an info level on the warn stream", line([good], "warn")],
    ["an info level on the error stream", line([good], "error")],
    [
      "an error level on the log stream",
      line([JSON.stringify({ ...base, level: "error", outcome: "ok" })]),
    ],
  ])("rejects %s", (_name, captured) => {
    expect(() => expectLineShape(captured)).toThrow();
  });

  it("accepts every allow-listed optional key", () => {
    const full = JSON.stringify({
      ...base,
      outcome: "unavailable",
      step: "rate-limit",
      limit: "write",
      reason: "rate-limit",
      status: 503,
      errorName: "Error",
    });
    expect(() => expectLineShape(line([full]))).not.toThrow();
  });
});

describe("captureLines", () => {
  it("records the three streams in call order and puts the real console back on restore", () => {
    console.log("a");
    console.warn("b");
    console.error("c", "d");
    expect(capture.lines).toEqual([
      { stream: "log", args: ["a"] },
      { stream: "warn", args: ["b"] },
      { stream: "error", args: ["c", "d"] },
    ]);
    capture.restore();
    for (const stream of ["log", "warn", "error"] as const)
      expect(vi.isMockFunction(console[stream])).toBe(false);
  });
});
