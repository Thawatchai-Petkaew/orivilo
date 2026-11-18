import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { REQUEST_ID_HEADER } from "@orivilo/auth";
import { config, proxy } from "./proxy";

const ENV_NAMES = [
  "VERCEL_ENV",
  "BETTER_AUTH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const;

// Every test starts with none of the address variables, so a build on Vercel cannot change a row.
beforeEach(() => {
  for (const name of ENV_NAMES) vi.stubEnv(name, undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

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

// ORV-286 alias-host-1. Hosts are stand-ins: orivilo.example is the configured address,
// orivilo-alias.example an alias host of the deployment.
const CONFIGURED = "https://orivilo.example";
const ALIAS = "https://orivilo-alias.example";

function production(env: Partial<Record<(typeof ENV_NAMES)[number], string>> = {}) {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("BETTER_AUTH_URL", CONFIGURED);
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
}

function get(url: string, init: { method?: string; headers?: Record<string, string> } = {}) {
  return proxy(new NextRequest(url, init));
}

function expectRedirect(response: Response, location: string) {
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(location);
  expect(response.headers.get(REQUEST_ID_HEADER)).toMatch(UUID_V4);
  // Not passed on to a page: `NextResponse.next` marks its answer with this header.
  expect(response.headers.get("x-middleware-next")).toBeNull();
}

describe("alias host", () => {
  it("goes to the configured address", () => {
    production();
    for (const method of ["GET", "POST"]) {
      expectRedirect(get(`${ALIAS}/account`, { method }), `${CONFIGURED}/account`);
    }
  });

  it("keeps path and query", () => {
    production();
    expectRedirect(
      get(`${ALIAS}/business/p1?tab=a&q=%E0%B8%81`),
      `${CONFIGURED}/business/p1?tab=a&q=%E0%B8%81`,
    );
  });

  it("target origin is only the configured address", () => {
    production();
    expectRedirect(get(`${ALIAS}//evil.example/x`), `${CONFIGURED}//evil.example/x`);
    expectRedirect(
      get(`${ALIAS}/?callbackURL=https://evil.example/`),
      `${CONFIGURED}/?callbackURL=https://evil.example/`,
    );
    expectRedirect(
      get(`${ALIAS}/`, { headers: { "x-forwarded-host": "evil.example" } }),
      `${CONFIGURED}/`,
    );
  });

  it("auth routes get no exception", () => {
    production();
    expectRedirect(
      get(`${ALIAS}/api/auth/callback/google?state=s&code=c`),
      `${CONFIGURED}/api/auth/callback/google?state=s&code=c`,
    );
  });

  it("compares the host with its port, as the URL parser writes it", () => {
    production();
    expectRedirect(get("https://orivilo.example:8443/account"), `${CONFIGURED}/account`);
    const same = get("HTTPS://ORIVILO.example/account");
    expect(same.status).toBe(200);
  });

  it("goes to the configured address from the production domain when BETTER_AUTH_URL is not set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "orivilo-production.example");
    expectRedirect(get(`${ALIAS}/a`), "https://orivilo-production.example/a");
  });

  it("configured host passes", () => {
    production();
    const response = get(`${CONFIGURED}/account`);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get(REQUEST_ID_HEADER)).toMatch(UUID_V4);
    expect(response.headers.get("content-security-policy-report-only")).toContain("default-src");
  });

  it("preview is left alone", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "orivilo-preview.example");
    vi.stubEnv("BETTER_AUTH_URL", CONFIGURED);
    for (const url of ["https://orivilo-preview.example/account", `${ALIAS}/account`]) {
      expect(get(url).status).toBe(200);
    }
  });

  it("local is left alone", () => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    for (const url of ["http://localhost:3000/account", "http://127.0.0.1:3000/account"]) {
      expect(get(url).status).toBe(200);
    }
  });

  it("is left alone when VERCEL_ENV is something else", () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("BETTER_AUTH_URL", CONFIGURED);
    expect(get(`${ALIAS}/account`).status).toBe(200);
  });

  it("no configured address", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(get(`${ALIAS}/account`).status).toBe(200);
    vi.stubEnv("BETTER_AUTH_URL", "not a url");
    expect(get(`${ALIAS}/account`).status).toBe(200);
  });
});

// ORV-286 row 21: the proxy imports neither the @orivilo/auth index, nor Better Auth, nor the
// database client. The scan reads the source text for every form of module specifier: a
// single-line import, a multi-line import, a side-effect import, a dynamic import() and an
// export ... from.
const BANNED = [
  /^@orivilo\/auth$/,
  /^@orivilo\/auth\/(?!configured-address$)/,
  /^better-auth/,
  /^@better-auth\//,
  /^@orivilo\/db/,
];

function specifiersOf(source: string): string[] {
  const forms = [
    /\b(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  return forms.flatMap((form) => [...source.matchAll(form)].map((m) => m[1]!));
}

const bannedIn = (source: string) =>
  specifiersOf(source).filter((specifier) => BANNED.some((rule) => rule.test(specifier)));

describe("proxy imports", () => {
  const forms = {
    "single-line import": `import { createAuth } from "@orivilo/auth";`,
    "multi-line import": `import {\n  createAuth,\n  settingsFromEnv,\n} from "@orivilo/auth";`,
    "side-effect import": `import "@orivilo/auth";`,
    "dynamic import()": `const auth = await import("@orivilo/auth");`,
    "export ... from": `export { createAuth } from "@orivilo/auth";`,
  };

  it.each(Object.entries(forms))("the scan blocks a %s", (_name, sample) => {
    expect(bannedIn(sample)).toEqual(["@orivilo/auth"]);
  });

  it.each([
    "better-auth",
    "better-auth/plugins",
    "@better-auth/core",
    "@orivilo/db",
    "@orivilo/db/client",
    "@orivilo/auth/log",
  ])("the scan blocks %s", (specifier) => {
    expect(bannedIn(`import x from "${specifier}";`)).toEqual([specifier]);
  });

  it("the scan allows the pure module and finds the real imports", () => {
    expect(
      bannedIn(`import { configuredAddress } from "@orivilo/auth/configured-address";`),
    ).toEqual([]);
    const source = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");
    expect(specifiersOf(source)).toContain("@orivilo/auth/configured-address");
    expect(bannedIn(source)).toEqual([]);
  });
});
