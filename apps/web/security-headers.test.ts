import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "./next.config";
import { proxy } from "./proxy";
import { buildCsp, createNonce, CSP_HEADER } from "./security-headers";

describe("static security headers", () => {
  it("are sent on every route with the decided values", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe("/:path*");
    expect(Object.fromEntries(rules[0]!.headers.map((h) => [h.key, h.value]))).toEqual({
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
  });
});

describe("csp", () => {
  const directives = (csp: string) => csp.split("; ");

  it("carries the nonce, strict-dynamic and the locked-down directives", () => {
    const d = directives(buildCsp("abc", false));
    expect(d).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(d).toContain("object-src 'none'");
    expect(d).toContain("frame-ancestors 'none'");
    expect(d).toContain("base-uri 'self'");
    expect(d).toContain("form-action 'self'");
  });

  it("allows unsafe-eval only in development", () => {
    expect(buildCsp("abc", true)).toContain("'unsafe-eval'");
    expect(buildCsp("abc", false)).not.toContain("unsafe-eval");
  });

  it("makes a fresh nonce each time", () => {
    expect(createNonce()).not.toBe(createNonce());
  });

  it("proxy sends Report-Only, never an enforcing CSP, with a per-request nonce", () => {
    const a = proxy(new NextRequest("http://localhost/"));
    const b = proxy(new NextRequest("http://localhost/"));
    expect(CSP_HEADER).toBe("Content-Security-Policy-Report-Only");
    expect(a.headers.get("Content-Security-Policy")).toBeNull();
    const ca = a.headers.get(CSP_HEADER)!;
    expect(ca).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(ca).not.toBe(b.headers.get(CSP_HEADER));
  });
});
