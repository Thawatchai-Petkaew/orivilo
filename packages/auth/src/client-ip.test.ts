import { afterEach, describe, expect, it, vi } from "vitest";
import { captureLines, expectLineShape, type CapturedLine } from "./log-testing.ts";
import { atBoundary } from "./log.ts";

const SECRET = "test-secret-for-ip-hashing";
const prod = { VERCEL_ENV: "production" };

const load = async () => {
  vi.resetModules();
  return (await import("./client-ip.ts")).clientIp;
};
const req = (h: Record<string, string>) => new Headers(h);

afterEach(() => vi.restoreAllMocks());

// rate-limit.ts -> client-ip.ts -> log.ts -> rate-limit.ts is an import cycle: log.ts must read the
// limit names when it writes a line, not when it loads, or a module graph entered through
// rate-limit.ts fails to load.
describe("log.ts loads when the graph is entered through rate-limit.ts", () => {
  it("loads rate-limit.ts first and still closes a limit name when a line is written", async () => {
    vi.resetModules();
    const { LIMITS } = await import("./rate-limit.ts");
    const { writeLine } = await import("./log.ts");
    const capture = captureLines();
    try {
      writeLine({
        level: "info",
        step: "rate-limit",
        outcome: "allowed",
        limit: Object.keys(LIMITS)[0],
      });
      expect(JSON.parse(String(capture.lines[0]?.args[0]))["limit"]).toBe(Object.keys(LIMITS)[0]);
    } finally {
      capture.restore();
    }
  });
});

// ORV-112 AC 13.
describe("only the trusted header picks the bucket", () => {
  it("gives one subject to one x-forwarded-for whatever the other headers say", async () => {
    const clientIp = await load();
    const a = clientIp(
      req({
        "x-forwarded-for": "203.0.113.7",
        "x-vercel-forwarded-for": "198.51.100.1",
        "x-real-ip": "198.51.100.2",
      }),
      prod,
      SECRET,
    );
    const b = clientIp(
      req({
        "x-forwarded-for": "203.0.113.7",
        "x-vercel-forwarded-for": "198.51.100.9",
        "x-real-ip": "198.51.100.8",
      }),
      { VERCEL_ENV: "preview" },
      SECRET,
    );
    const other = clientIp(req({ "x-forwarded-for": "203.0.113.8" }), prod, SECRET);
    expect(a).toBe(b);
    expect(other).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203.0.113.7");
  });

  it("hashes under the secret", async () => {
    const clientIp = await load();
    const h = req({ "x-forwarded-for": "203.0.113.7" });
    expect(clientIp(h, prod, "one")).not.toBe(clientIp(h, prod, "two"));
  });

  it("gives unknown for a missing header, a list and a non-IP, and writes one step line without values", async () => {
    const clientIp = await load();
    const { lines, restore } = captureLines();
    try {
      expect(clientIp(req({}), prod, SECRET)).toBe("unknown");
      expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 198.51.100.1" }), prod, SECRET)).toBe(
        "unknown",
      );
      expect(clientIp(req({ "x-forwarded-for": "not-an-ip" }), prod, SECRET)).toBe("unknown");
      expect(clientIp(req({ "x-forwarded-for": "" }), prod, SECRET)).toBe("unknown");
      // Once per process: the `warned` flag holds across the four calls.
      expect(lines).toHaveLength(1);
      const line = lines[0];
      expect(line?.stream).toBe("warn");
      const fields = expectLineShape(line as CapturedLine);
      expect(fields).toMatchObject({
        level: "warn",
        step: "client-ip",
        outcome: "no-trusted-ip",
        requestId: "unknown",
        route: "unknown",
      });
      expect(String(line?.args[0])).not.toContain("203.0.113");
      expect(String(line?.args[0])).not.toContain("not-an-ip");
    } finally {
      restore();
    }
  });

  it("measures the step line's duration from the start of clientIp", async () => {
    const clientIp = await load();
    const now = vi.spyOn(performance, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1007.4);
    const { lines, restore } = captureLines();
    try {
      clientIp(req({}), prod, SECRET);
      expect(now).toHaveBeenCalledTimes(2);
      expect(expectLineShape(lines[0] as CapturedLine)["durationMs"]).toBe(7);
    } finally {
      restore();
    }
  });

  // ORV-141 `orv141-step-lines`: a step line carries the open request's id and route.
  it("writes the step line with the request's id and route from the open boundary", async () => {
    const clientIp = await load();
    const id = "3f2b8c1e-5d4a-4b7e-9c2d-1a6f0e8b7d35";
    const { lines, restore } = captureLines();
    try {
      await atBoundary({ requestId: id, route: "directions/saveDirection" }, async () => {
        clientIp(req({}), prod, SECRET);
        return {
          value: undefined,
          ending: { level: "info", outcome: "ok" },
        };
      });
      const step = expectLineShape(lines[0] as CapturedLine);
      expect(step).toMatchObject({
        step: "client-ip",
        requestId: id,
        route: "directions/saveDirection",
      });
    } finally {
      restore();
    }
  });

  it("gives one subject to addresses in one IPv6 /64, and treats IPv4-mapped as IPv4", async () => {
    const clientIp = await load();
    const v6 = (ip: string) => clientIp(req({ "x-forwarded-for": ip }), prod, SECRET);
    expect(v6("2001:db8:1:2::1")).toBe(v6("2001:db8:1:2:ffff::9"));
    expect(v6("2001:db8:1:2::1")).not.toBe(v6("2001:db8:1:3::1"));
    expect(v6("::ffff:203.0.113.7")).toBe(v6("203.0.113.7"));
  });

  it("is local off Vercel, even with the header set", async () => {
    const clientIp = await load();
    const h = req({ "x-forwarded-for": "203.0.113.7" });
    expect(clientIp(h, { VERCEL_ENV: "development" }, SECRET)).toBe("local");
    expect(clientIp(h, {}, SECRET)).toBe("local");
  });
});
