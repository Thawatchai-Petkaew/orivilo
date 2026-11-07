import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { REQUEST_ID_HEADER } from "@orivilo/auth";
import { config, proxy } from "./proxy";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CLIENT_ID = "client-chosen-id";

const PREFETCH_HEADERS: Record<string, string>[] = [
  { "next-router-prefetch": "1" },
  { purpose: "prefetch" },
];
const ENTRIES = [
  { path: "/directions", headers: { "next-action": "abc123" } },
  { path: "/api/auth/get-session", headers: {} },
];

function request(path: string, headers: Record<string, string>) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { ...headers, [REQUEST_ID_HEADER]: CLIENT_ID },
  });
}

describe("proxy request id", () => {
  it("makes the request id and never keeps the client's", () => {
    const response = proxy(request("/directions", { "next-action": "abc123" }));
    const id = response.headers.get(REQUEST_ID_HEADER)!;
    expect(id).toMatch(UUID_V4);
    expect(id).not.toBe(CLIENT_ID);
    expect(response.headers.get("x-middleware-request-x-request-id")).toBe(id);
    expect(response.headers.get("x-middleware-override-headers")!.split(",")).toContain(
      "x-request-id",
    );
    const other = proxy(request("/directions", { "next-action": "abc123" }));
    expect(other.headers.get(REQUEST_ID_HEADER)).toMatch(UUID_V4);
    expect(other.headers.get(REQUEST_ID_HEADER)).not.toBe(id);
  });

  it("uses the header name the boundary reads", () => {
    expect(REQUEST_ID_HEADER).toBe("x-request-id");
  });

  it.each(PREFETCH_HEADERS.flatMap((p) => ENTRIES.map((e) => ({ p, e }))))(
    "a prefetch gets a server-made id ($e.path, $p)",
    ({ p, e }) => {
      const response = proxy(request(e.path, { ...e.headers, ...p }));
      const id = response.headers.get(REQUEST_ID_HEADER)!;
      expect(id).toMatch(UUID_V4);
      expect(id).not.toBe(CLIENT_ID);
      expect(response.headers.get("x-middleware-request-x-request-id")).toBe(id);
    },
  );
});

describe("proxy matcher", () => {
  const matches = (url: string, headers: Record<string, string> = {}) =>
    unstable_doesMiddlewareMatch({ config, url, headers });

  it.each(PREFETCH_HEADERS.flatMap((p) => ENTRIES.map((e) => ({ p, e }))))(
    "runs for prefetches ($e.path, $p)",
    ({ p, e }) => {
      expect(matches(e.path, { ...e.headers, ...p })).toBe(true);
    },
  );

  it("runs for a plain request to each entry", () => {
    for (const e of ENTRIES) expect(matches(e.path, e.headers)).toBe(true);
  });

  it.each(["/_next/static/x.js", "/_next/image", "/favicon.ico"])("skips %s", (path) => {
    expect(matches(path)).toBe(false);
    expect(matches(path, { "next-router-prefetch": "1" })).toBe(false);
  });

  it("is the one source with no missing conditions", () => {
    expect(config.matcher).toEqual(["/((?!_next/static|_next/image|favicon.ico).*)"]);
  });
});
