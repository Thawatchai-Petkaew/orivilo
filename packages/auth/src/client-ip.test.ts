import { afterEach, describe, expect, it, vi } from "vitest";

const SECRET = "test-secret-for-ip-hashing";
const prod = { VERCEL_ENV: "production" };

const load = async () => {
  vi.resetModules();
  return (await import("./client-ip.ts")).clientIp;
};
const req = (h: Record<string, string>) => new Headers(h);

afterEach(() => vi.restoreAllMocks());

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

  it("gives unknown for a missing header, a list and a non-IP, and warns once without values", async () => {
    const clientIp = await load();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(clientIp(req({}), prod, SECRET)).toBe("unknown");
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 198.51.100.1" }), prod, SECRET)).toBe(
      "unknown",
    );
    expect(clientIp(req({ "x-forwarded-for": "not-an-ip" }), prod, SECRET)).toBe("unknown");
    expect(clientIp(req({ "x-forwarded-for": "" }), prod, SECRET)).toBe("unknown");
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).not.toContain("203.0.113");
    expect(line).not.toContain("not-an-ip");
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
