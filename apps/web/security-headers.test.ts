import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "./next.config";
import { config, proxy } from "./proxy";
import { buildCsp, createNonce, CSP_HEADER } from "./security-headers";

describe("static security headers", () => {
  it("are sent on every route with the decided values", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe("/(.*)");
    expect(Object.fromEntries(rules[0]!.headers.map((h) => [h.key, h.value]))).toEqual({
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
  });
});

describe("next config", () => {
  it("does not send X-Powered-By", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});

const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self' 'nonce-abc' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com; frame-ancestors 'self'";

describe("csp", () => {
  const directives = (csp: string) => csp.split("; ");

  it("is exactly the production policy of the spec", () => {
    expect(buildCsp("abc", false)).toBe(PRODUCTION_CSP);
  });

  it("leaves out upgrade-insecure-requests, which a Report-Only policy ignores and reports (ORV-116)", () => {
    expect(directives(buildCsp("abc", false))).not.toContain("upgrade-insecure-requests");
  });

  it("adds only unsafe-eval to script-src in development", () => {
    expect(buildCsp("abc", true)).toBe(
      PRODUCTION_CSP.replace("'strict-dynamic'", "'strict-dynamic' 'unsafe-eval'"),
    );
  });

  it("allows unsafe-eval only in development", () => {
    expect(buildCsp("abc", true)).toContain("'unsafe-eval'");
    expect(buildCsp("abc", false)).not.toContain("unsafe-eval");
  });

  it("makes a fresh nonce of at least 128 random bits each time", () => {
    const nonce = createNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(atob(nonce).length).toBeGreaterThanOrEqual(16);
    expect(createNonce()).not.toBe(nonce);
  });

  it("proxy sends Report-Only, never an enforcing CSP, with a per-request nonce", () => {
    const a = proxy(new NextRequest("http://localhost/"));
    const b = proxy(new NextRequest("http://localhost/"));
    expect(CSP_HEADER).toBe("Content-Security-Policy-Report-Only");
    expect(a.headers.get("Content-Security-Policy")).toBeNull();
    const ca = a.headers.get(CSP_HEADER)!;
    const nonce = /'nonce-([A-Za-z0-9+/=]+)'/.exec(ca)![1]!;
    expect(atob(nonce).length).toBeGreaterThanOrEqual(16);
    expect(ca).toBe(buildCsp(nonce, process.env.NODE_ENV === "development"));
    expect(ca).not.toBe(b.headers.get(CSP_HEADER));
  });

  it("proxy forwards the same policy and the nonce on the request headers", () => {
    const response = proxy(new NextRequest("http://localhost/"));
    const csp = response.headers.get(CSP_HEADER)!;
    const nonce = /'nonce-([A-Za-z0-9+/=]+)'/.exec(csp)![1]!;
    // NextResponse.next({ request: { headers } }) lists the overridden request headers on the response.
    expect(response.headers.get("x-middleware-override-headers")).toContain(
      CSP_HEADER.toLowerCase(),
    );
    expect(response.headers.get(`x-middleware-request-${CSP_HEADER.toLowerCase()}`)).toBe(csp);
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
  });
});

describe("proxy matcher", () => {
  it("skips static assets, images, the favicon and prefetch requests", () => {
    expect(config.matcher).toEqual([
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        missing: [
          { type: "header", key: "next-router-prefetch" },
          { type: "header", key: "purpose", value: "prefetch" },
        ],
      },
    ]);
  });
});
