import { describe, expect, it } from "vitest";
import {
  CONTACT_URL,
  ROBOTS_MAX_BYTES,
  checkAddress,
  parseRobots,
  readPage,
  robotsAllows,
  robotsNormalise,
  type ReadPorts,
} from "./read-page";

/** The framework timeout of a test that guards a time bound: above the bound, so vitest never pre-empts the guard under a parallel run. */
const HEAVY_TIMEOUT = 60_000;

type Route = {
  status?: number;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  remoteAddress?: string;
  error?: "timeout" | "network";
  ignoreMaxBytes?: boolean;
};
type Logged = {
  url: string;
  address: string;
  headers: Record<string, string>;
  maxBytes: number;
  timeoutMs: number;
};

declare class TextEncoder {
  encode(input: string): Uint8Array; // module-scoped: the engine tsconfig has no DOM lib
}
declare const performance: { now(): number }; // the engine tsconfig has no DOM lib; a timer for the time bounds
const enc = new TextEncoder();

/** A fake network recorded in the test: DNS answers, routes by URL, a log of every request, a clock. */
function fakeNet(routes: Record<string, Route>, dns: Record<string, string[]> = {}) {
  const log: Logged[] = [];
  const resolved: string[] = [];
  const budgets: number[] = [];
  const clock = { now: 0 };
  const ports: ReadPorts = {
    async resolve(host, budgetMs) {
      resolved.push(host);
      budgets.push(budgetMs);
      return dns[host] ?? ["93.184.216.34"];
    },
    async request(r) {
      log.push({ ...r, headers: { ...r.headers } });
      const route = routes[r.url];
      if (!route)
        return {
          ok: true,
          status: 404,
          headers: {},
          body: new Uint8Array(),
          truncated: false,
          remoteAddress: r.address,
        };
      if (route.error) return { ok: false, error: route.error };
      const full =
        typeof route.body === "string" ? enc.encode(route.body) : (route.body ?? new Uint8Array());
      const cut = !route.ignoreMaxBytes && full.length > r.maxBytes;
      return {
        ok: true,
        status: route.status ?? 200,
        headers: route.headers ?? { "content-type": "text/html" },
        body: cut ? full.slice(0, r.maxBytes) : full,
        truncated: cut,
        remoteAddress: route.remoteAddress ?? r.address,
      };
    },
    sha256: (b) => `hash${b.length}`,
    elapsedMs: () => clock.now,
  };
  return { ports, log, resolved, budgets, clock };
}

/** A page whose head carries one stylesheet link per href, the way the tokenizer reads them. */
const linkPage = (hrefs: string[]): Route => ({
  body: `<!doctype html><html><head>${hrefs.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}</head><body></body></html>`,
});
const PAGE = "http://example.test/";
const ROBOTS = "http://example.test/robots.txt";
/** Nothing logged carries credentials in its authority, and no port but the defaults. */
function expectDefaultPortsNoCredentials(log: Logged[]) {
  for (const l of log) {
    expect(l.url).not.toMatch(/^https?:\/\/[^/]*@/);
    expect(l.url).not.toMatch(/^https?:\/\/(\[[^\]]*\]|[^/:@]*):\d+/);
  }
}
const okRoutes = (extra: Record<string, Route> = {}): Record<string, Route> => ({
  [ROBOTS]: { status: 404 },
  [PAGE]: { body: "<html></html>" },
  ...extra,
});

describe("public addresses only", () => {
  const refusedUrls: [string, Record<string, Route>?, Record<string, string[]>?][] = [
    ["ftp://a.b"],
    ["javascript:x"],
    ["http://127.0.0.1/"],
    ["http://10.0.0.5/"],
    ["http://169.254.169.254/"],
    ["http://[::1]/"],
    ["http://[::]/"],
    ["http://[64:ff9b::a00:5]/"],
    [PAGE, {}, { "example.test": ["192.168.1.2"] }],
    [PAGE, okRoutes({ [PAGE]: { status: 302, headers: { location: "http://10.0.0.5/" } } })],
    ["http://user:password@example.test/", okRoutes()],
    ["http://user@example.test/", okRoutes()],
    ["http://:secret@example.test/", okRoutes()],
    ["https://example.com:6379/"],
    ["http://example.com:443/"],
    ["https://example.com:80/"],
    ["http://240.0.0.1/"],
    ["http://198.18.0.1/"],
    ["http://192.0.0.170/"],
    ["http://[fec0::1]/"],
    ["http://[::ffff:0:a00:5]/"],
    [
      PAGE,
      okRoutes({
        [PAGE]: { status: 302, headers: { location: "http://user:password@example.test/" } },
      }),
    ],
    [
      PAGE,
      okRoutes({ [PAGE]: { status: 302, headers: { location: "https://example.com:6379/" } } }),
    ],
    [PAGE, okRoutes({ [PAGE]: linkPage(["https://user:password@example.test/a.css"]) })],
    [PAGE, okRoutes({ [PAGE]: linkPage(["https://example.test:8080/a.css"]) })],
  ];
  it.each(refusedUrls)("refuses %s", async (url, routes, dns) => {
    const net = fakeNet(routes ?? {}, dns);
    const r = await readPage(url, net.ports);
    expect(r).toEqual({ status: "refused", reason: "read.refused.address" });
    for (const l of net.log) {
      expect(checkAddress(l.address)).toBe("public");
    }
    expectDefaultPortsNoCredentials(net.log);
    expect(net.log.some((l) => l.url.includes("10.0.0.5") || l.url.includes("127.0.0.1"))).toBe(
      false,
    );
  });

  it("reads NAT64 for 8.8.8.8, robots.txt before the page", async () => {
    const page = "http://[64:ff9b::808:808]/";
    const net = fakeNet({
      [`${page}robots.txt`]: { status: 404 },
      [page]: { body: "<html></html>" },
    });
    const r = await readPage(page, net.ports);
    expect(r.status).toBe("read");
    expect(net.log.map((l) => l.url)).toEqual([`${page}robots.txt`, page]);
    expect(net.log[0]?.address).toBe("64:ff9b::808:808");
  });

  it("reads a URL that names the default port of its scheme, and keeps no credential in the result", async () => {
    const net = fakeNet({
      "https://example.com/robots.txt": { status: 404 },
      "https://example.com/": { body: "<html></html>" },
    });
    const r = await readPage("https://example.com:443/", net.ports);
    expect(r.status === "read" && r.url).toBe("https://example.com/");
    expectDefaultPortsNoCredentials(net.log);
    const http = fakeNet({ [ROBOTS]: { status: 404 }, [PAGE]: { body: "<html></html>" } });
    expect((await readPage("http://example.test:80/", http.ports)).status).toBe("read");
  });

  it("refuses a robots.txt redirect to a host with credentials or another port", async () => {
    for (const location of [
      "http://user:password@example.test/robots.txt",
      "http://example.test:8080/robots.txt",
    ]) {
      const net = fakeNet(okRoutes({ [ROBOTS]: { status: 301, headers: { location } } }));
      expect(await readPage(PAGE, net.ports)).toEqual({
        status: "refused",
        reason: "read.refused.address",
      });
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
    }
  });

  it("refuses a private remoteAddress after a public resolve", async () => {
    const net = fakeNet(okRoutes({ [PAGE]: { remoteAddress: "10.0.0.5" } }));
    expect(await readPage(PAGE, net.ports)).toEqual({
      status: "refused",
      reason: "read.refused.address",
    });
  });

  it("refuses a private remoteAddress reported for robots.txt", async () => {
    const net = fakeNet(okRoutes({ [ROBOTS]: { status: 404, remoteAddress: "127.0.0.1" } }));
    const r = await readPage(PAGE, net.ports);
    expect(r.status).toBe("refused");
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("refuses when one of several resolved addresses is private", async () => {
    const net = fakeNet(okRoutes(), { "example.test": ["93.184.216.34", "10.0.0.5"] });
    expect((await readPage(PAGE, net.ports)).status).toBe("refused");
    expect(net.log).toHaveLength(0);
  });

  it("refuses a redirect to a host that resolves to a private address", async () => {
    const net = fakeNet(
      okRoutes({ [PAGE]: { status: 301, headers: { location: "http://other.test/" } } }),
      { "other.test": ["172.16.0.1"] },
    );
    expect((await readPage(PAGE, net.ports)).status).toBe("refused");
    expect(net.log.every((l) => l.url.startsWith("http://example.test/"))).toBe(true);
  });

  it("fails with network when the host resolves to nothing", async () => {
    const net = fakeNet({}, { "example.test": [] });
    expect(await readPage(PAGE, net.ports)).toEqual({
      status: "failed",
      reason: "network",
    });
    expect(net.log).toHaveLength(0);
  });

  it("refuses a stylesheet that resolves to a private address, the whole read", async () => {
    const net = fakeNet(
      okRoutes({
        [PAGE]: linkPage(["http://cdn.test/a.css"]),
        "http://cdn.test/a.css": { body: "a{}" },
      }),
      {
        "cdn.test": ["10.1.1.1"],
      },
    );
    const r = await readPage(PAGE, net.ports);
    expect(r).toEqual({ status: "refused", reason: "read.refused.address" });
  });

  describe("checkAddress", () => {
    const refused = [
      "127.0.0.1",
      "127.255.255.254",
      "10.0.0.5",
      "10.255.255.255",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.2",
      "169.254.169.254",
      "169.254.0.1",
      "100.64.0.1",
      "100.127.255.255",
      "224.0.0.1",
      "239.255.255.255",
      "0.0.0.0",
      "0.1.2.3",
      "255.255.255.255",
      "240.0.0.1",
      "255.255.255.254",
      "198.18.0.1",
      "198.19.255.255",
      "192.0.0.0",
      "192.0.0.170",
      "01.2.3.4",
      "1.2.3",
      "256.1.1.1",
      "::",
      "::1",
      "fc00::1",
      "fdff::1",
      "fe80::1",
      "febf::1",
      "fec0::1",
      "feff::1",
      "::ffff:0:a00:5",
      "::ffff:0:7f00:1",
      "ff02::1",
      "ff00::",
      "64:ff9b:1::1",
      "2001::1",
      "2001:0:abcd::1",
      "::127.0.0.1",
      "::ffff:10.0.0.5",
      "::ffff:7f00:1",
      "2002:a00:5::1",
      "64:ff9b::a00:5",
      "::10.0.0.5",
      "fe80::1%en0",
      "not-an-ip",
      "",
      "1::2::3",
      "1:2:3:4:5:6:7:8:9",
      "g::1",
      "12345::1",
      "1:2:3:4:5:6:7::8",
      "1:2:3:4:5:6:7:8::::",
    ];
    it.each(refused)("refuses %j", (ip) => {
      expect(checkAddress(ip)).toBe("refused");
    });
    const pub = [
      "8.8.8.8",
      "93.184.216.34",
      "172.15.255.255",
      "172.32.0.1",
      "100.63.255.255",
      "100.128.0.1",
      "169.253.1.1",
      "223.255.255.255",
      "11.0.0.1",
      "198.17.255.255",
      "198.20.0.1",
      "192.0.1.1",
      "192.1.0.1",
      "::ffff:0:808:808",
      "192.167.1.1",
      "192.169.1.1",
      "64:ff9b::808:808",
      "2002:808:808::1",
      "::ffff:8.8.8.8",
      "::8.8.8.8",
      "2606:4700:4700::1111",
      "2001:4860:4860::8888",
      "2001:1::1",
      "fbff::1",
      "fe00::1",
      "64:ff9a::1",
      "2003::1",
      "64:ff9b:2::1",
      "2001:db8::1",
    ];
    it.each(pub)("allows %j", (ip) => {
      expect(checkAddress(ip)).toBe("public");
    });
  });
});

describe("robots.txt first", () => {
  const cases: [string, Route, "refused" | "read"][] = [
    ["disallow for *", { body: "User-agent: *\nDisallow: /" }, "refused"],
    [
      "disallow for oriviloreader in lower case",
      { body: "user-agent: oriviloreader\ndisallow: /" },
      "refused",
    ],
    ["a 503", { status: 503 }, "refused"],
    [
      "a token group that disallows over a * group that allows",
      { body: "User-agent: oriviloreader\nDisallow: /\n\nUser-agent: *\nAllow: /" },
      "refused",
    ],
    [
      "a token with a version, OriviloReader/1",
      { body: "User-agent: OriviloReader/1\nDisallow: /" },
      "refused",
    ],
    [
      "a token group that allows over a * group that disallows",
      { body: "User-agent: oriviloreader\nAllow: /\n\nUser-agent: *\nDisallow: /" },
      "read",
    ],
    [
      "a longer token, OriviloReader-Bot",
      { body: "User-agent: OriviloReader-Bot\nDisallow: /" },
      "read",
    ],
    ["a shorter token, Orivilo", { body: "User-agent: Orivilo\nDisallow: /" }, "read"],
    ["a 404", { status: 404 }, "read"],
    ["a 400", { status: 400 }, "read"],
    ["a 499", { status: 499 }, "read"],
    [
      "a 300 without a place to go, whatever its body",
      { status: 300, body: "User-agent: *\nAllow: /" },
      "refused",
    ],
    ["a 500", { status: 500, body: "User-agent: *\nAllow: /" }, "refused"],
  ];
  it.each(cases)("%s", async (_n, robots, outcome) => {
    const net = fakeNet(okRoutes({ [ROBOTS]: robots }));
    const r = await readPage(PAGE, net.ports);
    expect(net.log[0]?.url).toBe(ROBOTS);
    if (outcome === "refused") {
      expect(r).toEqual({ status: "refused", reason: "read.refused.robots" });
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
    } else {
      expect(r.status).toBe("read");
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE]);
    }
  });

  it("treats no answer, a redirect without a place to go and a 5xx as complete disallow", async () => {
    for (const robots of [
      { error: "network" as const },
      { error: "timeout" as const },
      { status: 301 },
      { status: 500 },
    ]) {
      const net = fakeNet(okRoutes({ [ROBOTS]: robots }));
      expect(await readPage(PAGE, net.ports)).toEqual({
        status: "refused",
        reason: "read.refused.robots",
      });
    }
  });

  it("refuses the path the token group disallows although the * group allows it, with no page request", async () => {
    const path = "http://example.test/public";
    const net = fakeNet(
      okRoutes({
        [ROBOTS]: {
          body: "User-agent: oriviloreader\nDisallow: /\n\nUser-agent: *\nAllow: /public",
        },
        [path]: { body: "x" },
      }),
    );
    expect(await readPage(path, net.ports)).toEqual({
      status: "refused",
      reason: "read.refused.robots",
    });
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("follows a robots.txt redirect to https and parses the file it lands on", async () => {
    const landing = "https://example.test/robots.txt";
    const open = fakeNet(
      okRoutes({
        [ROBOTS]: { status: 301, headers: { location: landing } },
        [landing]: { body: "User-agent: *\nAllow: /" },
      }),
    );
    expect((await readPage(PAGE, open.ports)).status).toBe("read");
    expect(open.log.map((l) => l.url)).toEqual([ROBOTS, landing, PAGE]);
    const shut = fakeNet(
      okRoutes({
        [ROBOTS]: { status: 301, headers: { location: landing } },
        [landing]: { body: "User-agent: *\nDisallow: /" },
      }),
    );
    expect(await readPage(PAGE, shut.ports)).toEqual({
      status: "refused",
      reason: "read.refused.robots",
    });
    expect(shut.log.map((l) => l.url)).toEqual([ROBOTS, landing]);
  });

  it("follows a page redirect to https after a robots.txt redirect to https", async () => {
    const landing = "https://example.test/robots.txt";
    const net = fakeNet(
      okRoutes({
        [ROBOTS]: { status: 301, headers: { location: landing } },
        [landing]: { body: "User-agent: *\nAllow: /" },
        [PAGE]: { status: 301, headers: { location: "https://example.test/" } },
        "https://example.test/": { body: "<html></html>" },
      }),
    );
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.url).toBe("https://example.test/");
  });

  it("refuses a robots.txt redirect to a private address, and requests nothing there", async () => {
    const net = fakeNet(
      okRoutes({ [ROBOTS]: { status: 301, headers: { location: "http://10.0.0.5/robots.txt" } } }),
    );
    expect(await readPage(PAGE, net.ports)).toEqual({
      status: "refused",
      reason: "read.refused.address",
    });
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("runs the Address check on a robots.txt redirect's host name, too", async () => {
    const net = fakeNet(
      okRoutes({
        [ROBOTS]: { status: 302, headers: { location: "http://other.test/robots.txt" } },
      }),
      { "other.test": ["10.0.0.5"] },
    );
    expect((await readPage(PAGE, net.ports)).status).toBe("refused");
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("follows 3 robots.txt redirects and fails with redirects at the fourth", async () => {
    const hop = (n: number) => `http://example.test/robots${n}.txt`;
    const chain = (len: number): Record<string, Route> => {
      const routes: Record<string, Route> = { [PAGE]: { body: "<html></html>" } };
      routes[ROBOTS] = { status: 301, headers: { location: hop(1) } };
      for (let i = 1; i <= len; i++) {
        routes[hop(i)] =
          i === len
            ? { body: "User-agent: *\nAllow: /" }
            : { status: 302, headers: { location: hop(i + 1) } };
      }
      return routes;
    };
    expect((await readPage(PAGE, fakeNet(chain(3)).ports)).status).toBe("read");
    const four = fakeNet(chain(4));
    expect(await readPage(PAGE, four.ports)).toEqual({ status: "failed", reason: "redirects" });
    expect(four.log.some((l) => l.url === hop(4) || l.url === PAGE)).toBe(false);
  });

  describe("patterns without a regular expression", () => {
    const hostile = `User-agent: *\nDisallow: /${"*a".repeat(12)}b$`;
    const readAt = async (path: string, body: string) => {
      const target = `http://example.test${path}`;
      const net = fakeNet(okRoutes({ [ROBOTS]: { body }, [target]: { body: "<html></html>" } }));
      const started = performance.now();
      const r = await readPage(target, net.ports);
      return { r, ms: performance.now() - started, log: net.log };
    };

    it("refuses the path of 38 a and a b within 1 s", async () => {
      const { r, ms, log } = await readAt(`/${"a".repeat(38)}b`, hostile);
      expect(r).toEqual({ status: "refused", reason: "read.refused.robots" });
      expect(ms).toBeLessThan(1000);
      expect(log.map((l) => l.url)).toEqual([ROBOTS]);
    });

    it("reads the path of 38 a within 1 s", async () => {
      const { r, ms } = await readAt(`/${"a".repeat(38)}`, hostile);
      expect(r.status).toBe("read");
      expect(ms).toBeLessThan(1000);
    });

    it("ignores a pattern of 1,001 characters and applies one of 1,000", async () => {
      const path = `/${"a".repeat(1000)}`;
      const long = await readAt(path, `User-agent: *\nDisallow: ${path}`);
      expect(long.r.status).toBe("read");
      const shorter = `/${"a".repeat(999)}`;
      const edge = await readAt(shorter, `User-agent: *\nDisallow: ${shorter}`);
      expect(edge.r).toEqual({ status: "refused", reason: "read.refused.robots" });
    });
  });

  describe("what robots-match-1 normalises, caps and ranks", () => {
    const EXAMPLE = "https://example.com";
    /** One read of `url` whose host serves `robots` (a body or a route) for /robots.txt, and a page. */
    const readWith = async (url: string, robots: Route | string | Uint8Array) => {
      const route =
        typeof robots === "string" || robots instanceof Uint8Array ? { body: robots } : robots;
      const origin = url.slice(0, url.indexOf("/", url.indexOf("//") + 2));
      const net = fakeNet({
        [`${origin}/robots.txt`]: route,
        [url]: { body: "<html></html>" },
      });
      const started = performance.now();
      const r = await readPage(url, net.ports);
      return { r, ms: performance.now() - started, log: net.log };
    };
    const REFUSED = { status: "refused", reason: "read.refused.robots" };
    /** `head`, then one comment line of filler, so the whole is exactly `size` bytes (all ASCII). */
    const padded = (head: string, size: number) => `${head}#${"x".repeat(size - head.length - 1)}`;

    it("covers a Thai path and a percent-encoded unreserved letter (Normalisation, SEC-133-R1-3)", async () => {
      const robots = "User-agent: OriviloReader\nDisallow: /สินค้า\nDisallow: /private\n";
      for (const url of [`${EXAMPLE}/สินค้า`, `${EXAMPLE}/%70rivate`, `${EXAMPLE}/private`]) {
        const { r, log } = await readWith(url, robots);
        expect(r).toEqual(REFUSED);
        expect(log.map((l) => l.url)).toEqual([`${EXAMPLE}/robots.txt`]);
      }
      expect((await readWith(`${EXAMPLE}/public`, robots)).r.status).toBe("read");
    });

    it("prints the normalised form of the spec's worked example", () => {
      expect(robotsNormalise("/สินค้า")).toBe(
        "/%E0%B8%AA%E0%B8%B4%E0%B8%99%E0%B8%84%E0%B9%89%E0%B8%B2",
      );
      expect(robotsNormalise("/%E0%B8%AA%E0%B8%B4%E0%B8%99%E0%B8%84%E0%B9%89%E0%B8%B2")).toBe(
        "/%E0%B8%AA%E0%B8%B4%E0%B8%99%E0%B8%84%E0%B9%89%E0%B8%B2",
      );
      expect(robotsNormalise("/%70rivate")).toBe("/private");
      expect(robotsNormalise("/a%2fb%7e")).toBe("/a%2Fb~");
      expect(robotsNormalise("/a%zzb%4")).toBe("/a%zzb%4"); // a % without two hex digits stays
      expect(robotsNormalise("/%a")).toBe("/%a"); // one hex digit is not enough: the digit keeps its case
      expect(robotsNormalise("/%aG")).toBe("/%aG");
      expect(robotsNormalise("\u0080")).toBe("%C2%80"); // the first character outside ASCII
      expect(robotsNormalise("\uffff")).toBe("%EF%BF%BF"); // the last of the run's range
      expect(robotsNormalise("/%41%2d%2E%5f%7E%30")).toBe("/A-._~0"); // every unreserved class decodes
      expect(robotsNormalise("/%25%20%2a")).toBe("/%25%20%2A"); // others stay, in upper case
      expect(robotsNormalise("/%2541")).toBe("/%2541"); // one pass: %25 is not decoded into a %
    });

    describe("matches as RFC 9309 section 2.2.2 and the spec's Normalisation state", () => {
      const denies = (pattern: string, path: string) =>
        !robotsAllows(parseRobots(`User-agent: *\nDisallow: ${pattern}`), path, "oriviloreader");
      it("decodes an unreserved percent-encoding in the pattern and in the path, and compares hex digits without case", () => {
        expect(denies("/p%61th", "/path")).toBe(true);
        expect(denies("/path", "/p%61th")).toBe(true);
        expect(denies("/%7Euser", "/~user")).toBe(true);
        expect(denies("/~user", "/%7euser")).toBe(true);
        expect(denies("/%E0%B8%AA", "/%e0%b8%aa")).toBe(true);
        expect(denies("/%e0%b8%aa", "/%E0%B8%AA")).toBe(true);
      });
      it("keeps a reserved character as written and a reserved percent-encoding encoded", () => {
        expect(denies("/a%2fb", "/a/b")).toBe(false);
        expect(denies("/a/b", "/a%2fb")).toBe(false);
        expect(denies("/a%2fb", "/a%2Fb")).toBe(true);
        expect(denies("/a:b", "/a:b")).toBe(true);
      });
    });

    describe("%2A and %24 are literal characters (Matching, FU-6, F22)", () => {
      const denies = (pattern: string, path: string) =>
        !robotsAllows(parseRobots(`User-agent: *\nDisallow: ${pattern}`), path, "oriviloreader");
      it.each([
        ["/path/file-with-a-%2A.html", `${EXAMPLE}/path/file-with-a-*.html`],
        ["/a-%2A.html", `${EXAMPLE}/a-%2A.html`],
      ])("refuses the page for the pattern %s", async (pattern, url) => {
        const { r, log } = await readWith(url, `User-agent: *\nDisallow: ${pattern}`);
        expect(r).toEqual(REFUSED);
        expect(log.map((l) => l.url)).toEqual([`${EXAMPLE}/robots.txt`]);
      });
      it("covers a written * and $ or their percent-encoding, never another character", () => {
        expect(denies("/path/foo-%24", "/path/foo-$")).toBe(true);
        expect(denies("/path/foo-%24", "/path/foo-%24")).toBe(true);
        expect(denies("/path/foo-%24", "/path/foo-")).toBe(false);
        expect(denies("/a-%2A.html", "/a-*.html")).toBe(true);
        expect(denies("/a-%2A.html", "/a-X.html")).toBe(false);
        expect(denies("/a-%2a.html", "/a-*.html")).toBe(true); // lower-case hex is the same literal
        expect(denies("/a%2Ab", "/aXXb")).toBe(false); // a %2A never turns into a wildcard
        expect(denies("/a24", "/a24")).toBe(true); // 2 and 4 after an ordinary character are not a literal
        expect(denies("/a2A", "/a2A")).toBe(true);
      });
      it("an anchored last part holding a literal ends the path (F22)", () => {
        expect(denies("/*%2A$", "/x%2A")).toBe(true);
        expect(denies("/*%2A$", "/x*")).toBe(true);
        expect(denies("/*%2A$", "/x*y")).toBe(false);
        expect(denies("/*%24$", "/x$")).toBe(true);
        expect(denies("/*%24$", "/x%24")).toBe(true);
        expect(denies("/*%24$", "/x$y")).toBe(false);
      });
      it("a $ in the middle of a pattern is a literal, and %24 at its end is not an end anchor", () => {
        expect(denies("/a$b", "/a$b")).toBe(true);
        expect(denies("/a%24", "/a%24x")).toBe(true);
      });
    });

    it("finds each middle part anywhere after the one before it, and the last one after that", () => {
      const denies = (pattern: string, path: string) =>
        !robotsAllows(parseRobots(`User-agent: *\nDisallow: ${pattern}`), path, "oriviloreader");
      expect(denies("/a*b*c", "/aXXbYYc")).toBe(true);
      expect(denies("/a*b*c", "/aXXbYY")).toBe(false);
      expect(denies("/a*b*c", "/aXXcYYb")).toBe(false);
      expect(denies("/a*b*c$", "/aXXbYYcZ")).toBe(false);
      expect(denies("/a*b*c$", "/aXXbYYc")).toBe(true);
    });

    it("ranks by the octets of the normalised pattern, not by its parts or its decoded characters", () => {
      const allows = (text: string, path: string) =>
        robotsAllows(parseRobots(`User-agent: *\n${text}`), path, "oriviloreader");
      // both are 3 octets; the parts of /a* are 2 characters, so ranked by parts the disallow would win
      expect(allows("Disallow: /ab\nAllow: /a*", "/ab")).toBe(true);
      // /%2F%2F is 7 octets and decodes to 3 characters; /**%2F is 6 octets and 4 characters
      expect(allows("Allow: /%2F%2F\nDisallow: /**%2F", "/%2F%2F")).toBe(true);
    });

    it("ranks matches by the normalised pattern's octets, an allow winning a tie (Matching)", async () => {
      // /pages is 6 octets, /%70age normalises to /page, 5 octets; ranked as written it would be 7 and win
      const { r } = await readWith(
        `${EXAMPLE}/pages/x`,
        "User-agent: *\nAllow: /pages\nDisallow: /%70age",
      );
      expect(r.status).toBe("read");
      const { r: tie } = await readWith(
        `${EXAMPLE}/pages/x`,
        "User-agent: *\nDisallow: /%70ages\nAllow: /pages",
      );
      expect(tie.status).toBe("read");
      const { r: longer } = await readWith(
        `${EXAMPLE}/pages/x`,
        "User-agent: *\nAllow: /%70ag\nDisallow: /pages",
      );
      expect(longer).toEqual(REFUSED);
    });

    describe("Caps (SEC-133-R1-1, FU-5)", () => {
      it("refuses a file of 5,001 rules and reads one of 5,000", async () => {
        const rules = (n: number) => `User-agent: *\n${"Disallow: /x\n".repeat(n)}`;
        expect((await readWith(`${EXAMPLE}/`, rules(5001))).r).toEqual(REFUSED);
        expect((await readWith(`${EXAMPLE}/`, rules(5000))).r.status).toBe("read");
      });
      it("counts an empty value, an ignored pattern and a rule before the first group, and the group's own rule", () => {
        const allows = (text: string) => robotsAllows(parseRobots(text), "/", "oriviloreader");
        const group = "User-agent: *\nAllow: /\n"; // one rule of its own
        const ignored = `Disallow: /${"a".repeat(1000)}\n`; // 1,001 characters: ignored, and counted
        expect(allows(`${"Disallow:\n".repeat(4999)}${group}`)).toBe(true);
        expect(allows(`${"Disallow:\n".repeat(5000)}${group}`)).toBe(false);
        expect(allows(`${"Disallow:\n".repeat(4998)}${ignored}${group}`)).toBe(true);
        expect(allows(`${"Disallow:\n".repeat(4999)}${ignored}${group}`)).toBe(false);
        expect(allows(`${"Allow: /\n".repeat(4999)}${group}`)).toBe(true);
        expect(allows(`${"Allow: /\n".repeat(5000)}${group}`)).toBe(false);
      });
      it("refuses 100,001 pattern characters and reads 100,000", () => {
        const allows = (last: number) =>
          robotsAllows(
            parseRobots(
              `User-agent: *\nAllow: /\n${`Disallow: /${"x".repeat(999)}\n`.repeat(99)}Disallow: /${"y".repeat(last)}\n`,
            ),
            "/",
            "oriviloreader",
          );
        // 1 for the Allow, 99 patterns of 1,000, and a last one of 999 (100,000 in all) or 1,000 (100,001)
        expect(allows(998)).toBe(true);
        expect(allows(999)).toBe(false);
      });
      it("refuses 101 patterns of 1,000 characters and reads 100", async () => {
        const rules = (n: number) =>
          `User-agent: *\n${`Disallow: /${"x".repeat(999)}\n`.repeat(n)}`;
        expect((await readWith(`${EXAMPLE}/`, rules(101))).r).toEqual(REFUSED);
        expect((await readWith(`${EXAMPLE}/`, rules(100))).r.status).toBe("read");
      });
      it("counts the characters of an ignored pattern too", async () => {
        // each is 1,001 characters, so ignored; 100 of them are 100,100 characters in all
        const ignored = (n: number) => `Disallow: /${"a".repeat(1000)}\n`.repeat(n);
        expect((await readWith(`${EXAMPLE}/`, `User-agent: *\n${ignored(100)}`)).r).toEqual(
          REFUSED,
        );
        expect((await readWith(`${EXAMPLE}/`, `User-agent: *\n${ignored(99)}`)).r.status).toBe(
          "read",
        );
      });
      it("counts the characters after normalisation, not as written", async () => {
        // "/" and 333 times %61 is 1,000 characters as written and 334 after: 101 of them are 33,734
        const short = `Disallow: /${"%61".repeat(333)}\n`.repeat(101);
        expect((await readWith(`${EXAMPLE}/`, `User-agent: *\n${short}`)).r.status).toBe("read");
        // "/" and 110 Thai letters is 111 characters as written and 991 after: 101 of them are 100,091
        const thai = (n: number) => `Disallow: /${"ก".repeat(110)}\n`.repeat(n);
        expect((await readWith(`${EXAMPLE}/`, `User-agent: *\n${thai(101)}`)).r).toEqual(REFUSED);
        expect((await readWith(`${EXAMPLE}/`, `User-agent: *\n${thai(100)}`)).r.status).toBe(
          "read",
        );
      });
      it("ignores a pattern of 1,001 characters after normalisation and keeps one of 1,000", () => {
        const kept = (pattern: string) =>
          parseRobots(`User-agent: *\nDisallow: ${pattern}`).groups[0]?.rules.length;
        // "/" and 110 Thai letters is 991 characters after normalisation, and each "a" adds one
        expect(kept(`/${"ก".repeat(110)}${"a".repeat(9)}`)).toBe(1);
        expect(kept(`/${"ก".repeat(110)}${"a".repeat(10)}`)).toBe(0);
        expect(kept(`/${"a".repeat(999)}`)).toBe(1);
        expect(kept(`/${"a".repeat(1000)}`)).toBe(0);
      });
      it("reads the 500 KB file of 5,000 short wildcard rules against a path of 2,000 characters within 2 s", async () => {
        const rules = `User-agent: *\n${"Disallow: /*ab\n".repeat(5000)}`;
        const body = padded(rules, 500_000);
        expect(body).toHaveLength(500_000);
        const { r, ms } = await readWith(`${EXAMPLE}/${"a".repeat(1999)}`, body);
        expect(r.status).toBe("read");
        expect(ms).toBeLessThan(2000);
      });
    });

    describe("the size of the answer (FU-4)", () => {
      const open = "User-agent: *\nAllow: /\n";
      it("reads a robots.txt of exactly 500 KiB and refuses one a byte longer, parsing nothing of it", async () => {
        const size = ROBOTS_MAX_BYTES;
        const whole = await readWith(`${EXAMPLE}/`, enc.encode(padded(open, size)));
        expect(whole.r.status).toBe("read");
        const shut = `User-agent: *\nDisallow: /\n`;
        // the first 500 KiB allow the page; a byte more, and a part parsed would have let it through
        const over = await readWith(`${EXAMPLE}/`, enc.encode(padded(open, size + 1)));
        expect(over.r).toEqual(REFUSED);
        expect(over.log.map((l) => l.url)).toEqual([`${EXAMPLE}/robots.txt`]);
        const head = await readWith(`${EXAMPLE}/`, enc.encode(padded(shut, size)));
        expect(head.r).toEqual(REFUSED);
      });
    });

    it("refuses a URL of 2,049 characters with no lookup and no request, and requests one of 2,048", async () => {
      const url = (n: number) =>
        `http://example.test/${"a".repeat(n - "http://example.test/".length)}`;
      expect(url(2049)).toHaveLength(2049);
      const long = fakeNet(okRoutes());
      expect(await readPage(url(2049), long.ports)).toEqual({
        status: "refused",
        reason: "read.refused.address",
      });
      expect(long.resolved).toEqual([]);
      expect(long.log).toEqual([]);
      const edge = fakeNet(okRoutes({ [url(2048)]: { body: "<html></html>" } }));
      expect((await readPage(url(2048), edge.ports)).status).toBe("read");
      expect(edge.log.map((l) => l.url)).toEqual([ROBOTS, url(2048)]);
    });

    it("refuses a redirect or a stylesheet link whose URL passes 2,048 characters", async () => {
      const far = `http://example.test/${"b".repeat(2030)}`;
      const redirect = fakeNet(okRoutes({ [PAGE]: { status: 302, headers: { location: far } } }));
      expect(await readPage(PAGE, redirect.ports)).toEqual({
        status: "refused",
        reason: "read.refused.address",
      });
      const sheet = fakeNet(okRoutes({ [PAGE]: linkPage([far]) }));
      expect((await readPage(PAGE, sheet.ports)).status).toBe("refused");
    });
  });

  it("reads robots.txt once per origin and keeps it in the cache", async () => {
    const net = fakeNet(
      okRoutes({ [PAGE]: linkPage(["/a.css"]), "http://example.test/a.css": { body: "a{}" } }),
    );
    const cache = new Map();
    await readPage(PAGE, net.ports, cache);
    expect(net.log.filter((l) => l.url === ROBOTS)).toHaveLength(1);
    expect(cache.has("http://example.test")).toBe(true);
    await readPage(PAGE, net.ports, cache);
    expect(net.log.filter((l) => l.url === ROBOTS)).toHaveLength(1);
  });

  it("checks robots.txt of the host a redirect lands on", async () => {
    const net = fakeNet(
      okRoutes({
        [PAGE]: { status: 302, headers: { location: "http://other.test/p" } },
        "http://other.test/robots.txt": { body: "User-agent: *\nDisallow: /p" },
        "http://other.test/p": { body: "x" },
      }),
    );
    expect(await readPage(PAGE, net.ports)).toEqual({
      status: "refused",
      reason: "read.refused.robots",
    });
    expect(net.log.some((l) => l.url === "http://other.test/p")).toBe(false);
  });

  it("skips a stylesheet that robots.txt disallows and marks the read incomplete", async () => {
    const net = fakeNet(
      okRoutes({
        [ROBOTS]: { body: "User-agent: *\nDisallow: /a.css" },
        [PAGE]: linkPage(["/a.css"]),
        "http://example.test/a.css": { body: "a{}" },
      }),
    );
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.stylesheets.length).toBe(0);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
    expect(net.log.some((l) => l.url.endsWith("a.css"))).toBe(false);
  });

  describe("parseRobots and robotsAllows", () => {
    const allows = (text: string, path: string) =>
      robotsAllows(parseRobots(text), path, "oriviloreader");
    it("matches the token case-insensitively and applies * too", () => {
      expect(allows("User-agent: OriviloReader\nDisallow: /a", "/a/b")).toBe(false);
      expect(allows("User-agent: *\nDisallow: /a", "/a/b")).toBe(false);
      expect(allows("User-agent: otherbot\nDisallow: /", "/a")).toBe(true);
    });
    it("matches a user-agent value on its product token (robots-token-1)", () => {
      for (const agent of [
        "OriviloReader/1",
        "OriviloReader",
        "oriviloreader",
        "ORIVILOREADER/2.0 (+x)",
      ]) {
        expect(allows(`User-agent: ${agent}\nDisallow: /`, "/a")).toBe(false);
      }
      for (const agent of [
        "Orivilo",
        "OriviloReader-Bot",
        "OriviloReader_2",
        "OriviloReader2",
        "OriviloReaderX",
        "x",
      ]) {
        expect(allows(`User-agent: ${agent}\nDisallow: /`, "/a")).toBe(true);
      }
      expect(allows("User-agent: *\nDisallow: /", "/a")).toBe(false);
      expect(allows("User-agent: *foo\nDisallow: /", "/a")).toBe(true);
    });
    it("applies only the groups naming the token when any does, and * otherwise (robots-group-1)", () => {
      const a = "User-agent: oriviloreader\nDisallow: /\n\nUser-agent: *\nAllow: /public";
      expect(allows(a, "/public")).toBe(false);
      const b = "User-agent: oriviloreader\nAllow: /\n\nUser-agent: *\nDisallow: /";
      expect(allows(b, "/x")).toBe(true);
      const c = "User-agent: otherbot\nDisallow: /\n\nUser-agent: *\nDisallow: /x";
      expect(allows(c, "/x")).toBe(false);
      expect(allows(c, "/y")).toBe(true);
      const d =
        "User-agent: oriviloreader\nDisallow: /a\n\nUser-agent: OriviloReader/2\nDisallow: /b\n\nUser-agent: *\nDisallow: /c";
      expect(allows(d, "/a")).toBe(false);
      expect(allows(d, "/b")).toBe(false);
      expect(allows(d, "/c")).toBe(true);
      const e = "User-agent: *\nDisallow: /a\n\nUser-agent: *\nDisallow: /b";
      expect(allows(e, "/a")).toBe(false);
      expect(allows(e, "/b")).toBe(false);
    });
    it("matches wildcards and anchors in order without a regular expression (robots-match-1)", () => {
      const deny = (pattern: string, path: string) =>
        !allows(`User-agent: *\nDisallow: ${pattern}`, path);
      expect(deny("/*b*a", "/ab")).toBe(false);
      expect(deny("/*b*a", "/ba")).toBe(true);
      expect(deny("/*ab$", "/ab")).toBe(true);
      expect(deny("/a*ab$", "/ab")).toBe(false);
      expect(deny("/a*ab$", "/aab")).toBe(true);
      expect(deny("/a*", "/a")).toBe(true);
      expect(deny("/a*$", "/axyz")).toBe(true);
      expect(deny("/$", "/")).toBe(true);
      expect(deny("/$", "/a")).toBe(false);
      expect(deny("/a*c", "/abxc/d")).toBe(true);
      expect(deny("/a*c$", "/abxc/d")).toBe(false);
      expect(deny("/x*", "/a/x")).toBe(false);
      expect(deny("/a$b", "/a$b")).toBe(true);
      expect(deny("/a*a*b", "/ab")).toBe(false); // the middle part is looked for after the first
      expect(deny("/a*a*b", "/aab")).toBe(true);
      expect(deny("/*ab*b", "/abx")).toBe(false); // the cursor moves past the middle part
      expect(deny("/*ab*b", "/abxb")).toBe(true);
    });
    it("ignores other fields, comments, a BOM and CRLF", () => {
      expect(allows("﻿User-agent: *\r\nCrawl-delay: 5\r\nDisallow: /a # note\r\n", "/a")).toBe(
        false,
      );
      expect(allows("User-agent: *\nSitemap: http://x/s.xml\nDisallow: /a", "/b")).toBe(true);
      expect(allows("garbage line\nDisallow: /a", "/a")).toBe(true); // a rule outside any group
    });
    it("an empty Disallow allows everything", () => {
      expect(allows("User-agent: *\nDisallow:", "/a")).toBe(true);
    });
    it("shares one group across consecutive user-agent lines, and starts a new one after a rule", () => {
      const text =
        "User-agent: botx\nUser-agent: oriviloreader\nDisallow: /a\nUser-agent: other\nDisallow: /b";
      expect(allows(text, "/a")).toBe(false);
      expect(allows(text, "/b")).toBe(true);
      expect(allows("User-agent: oriviloreader\nUser-agent: botx\nDisallow: /a", "/a")).toBe(false);
    });
    it("the longest match wins and Allow wins a tie", () => {
      expect(allows("User-agent: *\nDisallow: /a\nAllow: /a/ok", "/a/ok/x")).toBe(true);
      expect(allows("User-agent: *\nDisallow: /a/ok\nAllow: /a", "/a/ok/x")).toBe(false);
      expect(allows("User-agent: *\nDisallow: /a\nAllow: /a", "/a")).toBe(true);
      expect(allows("User-agent: *\nAllow: /a\nDisallow: /a", "/a")).toBe(true);
    });
    it("supports * and $ and anchors a pattern at the start of the path", () => {
      expect(allows("User-agent: *\nDisallow: /*.pdf$", "/x/y.pdf")).toBe(false);
      expect(allows("User-agent: *\nDisallow: /*.pdf$", "/x/y.pdf?a=1")).toBe(true);
      expect(allows("User-agent: *\nDisallow: /x", "/a/x")).toBe(true);
      expect(allows("User-agent: *\nDisallow: /a.b", "/aXb")).toBe(true); // the dot is literal
      expect(allows("User-agent: *\nDisallow: /a?b", "/a?b")).toBe(false);
    });
  });
});

describe("one page, logged out, bounded", () => {
  const sheets = Array.from({ length: 12 }, (_, i) => `http://example.test/s${i}.css`);
  const sheetRoutes = Object.fromEntries(
    sheets.map((s) => [s, { body: "a{}", headers: { "content-type": "text/css" } }]),
  );

  it("sends no cookie or authorization and names the reader", async () => {
    const net = fakeNet(okRoutes({ ...sheetRoutes, [PAGE]: linkPage(sheets.slice(0, 2)) }));
    await readPage(PAGE, net.ports);
    expect(net.log.length).toBe(4);
    for (const l of net.log) {
      expect(Object.keys(l.headers).sort()).toEqual(["accept", "user-agent"]);
      expect(l.headers["user-agent"]).toContain("OriviloReader/1");
      expect(l.headers["user-agent"]).toContain(CONTACT_URL);
    }
    expectDefaultPortsNoCredentials(net.log);
  });

  it("reads a document of 5,000 nested elements to the depth bound, never throws and fetches no deeper link", async () => {
    const link = (n: string) => `<link rel="stylesheet" href="/${n}.css">`;
    const body = `<body>${"<div>".repeat(99)}<div>${link("shallow")}</div>${"<div>".repeat(500)}<div>${link("deep")}</div>${"<div>".repeat(4400)}</body>`;
    const net = fakeNet(
      okRoutes({
        [PAGE]: { body },
        "http://example.test/shallow.css": { body: "a{}" },
        "http://example.test/deep.css": { body: "a{}" },
      }),
    );
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
    expect(r.status === "read" && r.stylesheets.map((s) => s.url)).toEqual([
      "http://example.test/shallow.css",
    ]);
    expect(net.log.some((l) => l.url.endsWith("deep.css"))).toBe(false);
  });

  it("fetches at most 10 stylesheets, in document order, and marks the rest incomplete", async () => {
    const net = fakeNet(okRoutes({ ...sheetRoutes, [PAGE]: linkPage(sheets) }));
    const r = await readPage(PAGE, net.ports);
    expect(r.status).toBe("read");
    if (r.status !== "read") return;
    expect(r.stylesheets.map((s) => s.url)).toEqual(sheets.slice(0, 10));
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, ...sheets.slice(0, 10)]);
    expect(r.incomplete).toEqual(["page-incomplete"]);
  });

  it("exactly 10 stylesheets is complete, and a duplicate link counts once", async () => {
    const net = fakeNet(
      okRoutes({ ...sheetRoutes, [PAGE]: linkPage([...sheets.slice(0, 10), sheets[0] ?? ""]) }),
    );
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.stylesheets.length).toBe(10);
    expect(r.status === "read" && r.incomplete).toEqual([]);
  });

  it("fetches nothing but the robots file, the page and its stylesheets", async () => {
    const page = `<html><head><link rel="stylesheet" href="${sheets[0]}"><link rel="icon" href="/favicon.ico"><link rel="preload" as="style" href="/p.css"></head><body><a href="/other">x</a><img src="/i.png"><script src="/s.js"></script><link rel="stylesheet" href="${sheets[1]}"><link rel="stylesheet" href="${sheets[2]}"></body></html>`;
    const net = fakeNet(okRoutes({ ...sheetRoutes, [PAGE]: { body: page } }));
    await readPage(PAGE, net.ports);
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, ...sheets.slice(0, 3)]);
  });

  it(
    "cuts the document at 2 MB with page-incomplete",
    async () => {
      const big = new Uint8Array(3 * 1024 * 1024).fill(97);
      const net = fakeNet(okRoutes({ [PAGE]: { body: big } }));
      const r = await readPage(PAGE, net.ports);
      expect(net.log[1]?.maxBytes).toBe(2 * 1024 * 1024);
      expect(r.status === "read" && r.document.bytes.length).toBe(2 * 1024 * 1024);
      expect(r.status === "read" && r.document.truncated).toBe(true);
      expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
    },
    HEAVY_TIMEOUT,
  );

  it(
    "cuts a document at exactly 2 MB + 1 even when the port ignores maxBytes",
    async () => {
      const body = new Uint8Array(2 * 1024 * 1024 + 1).fill(97);
      const net = fakeNet(okRoutes({ [PAGE]: { body, ignoreMaxBytes: true } }));
      const r = await readPage(PAGE, net.ports);
      expect(r.status === "read" && r.document.bytes.length).toBe(2 * 1024 * 1024);
      expect(r.status === "read" && r.document.truncated).toBe(true);
      const exact = fakeNet(
        okRoutes({ [PAGE]: { body: new Uint8Array(2 * 1024 * 1024), ignoreMaxBytes: true } }),
      );
      const e = await readPage(PAGE, exact.ports);
      expect(e.status === "read" && e.document.truncated).toBe(false);
      expect(e.status === "read" && e.incomplete).toEqual([]);
    },
    HEAVY_TIMEOUT,
  );

  it("cuts a stylesheet at 1 MB with page-incomplete", async () => {
    const css = new Uint8Array(1024 * 1024 + 5).fill(97);
    const net = fakeNet(
      okRoutes({ [PAGE]: linkPage(["/big.css"]), "http://example.test/big.css": { body: css } }),
    );
    const r = await readPage(PAGE, net.ports);
    expect(net.log[2]?.maxBytes).toBe(1024 * 1024);
    expect(r.status === "read" && r.stylesheets[0]?.bytes.length).toBe(1024 * 1024);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
  });

  it("follows 3 redirects and refuses the fourth", async () => {
    const hop = (n: number) => `http://example.test/r${n}`;
    const chain = (len: number) => {
      const routes: Record<string, Route> = { [ROBOTS]: { status: 404 } };
      routes[PAGE] = { status: 301, headers: { Location: hop(1) } };
      for (let i = 1; i <= len; i++) {
        routes[hop(i)] =
          i === len ? { body: "end" } : { status: 302, headers: { location: hop(i + 1) } };
      }
      return routes;
    };
    const three = fakeNet(chain(3));
    const ok = await readPage(PAGE, three.ports);
    expect(ok.status === "read" && ok.url).toBe(hop(3));
    const four = fakeNet(chain(4));
    expect(await readPage(PAGE, four.ports)).toEqual({
      status: "failed",
      reason: "redirects",
    });
    expect(four.log.some((l) => l.url === hop(4))).toBe(false);
  });

  it("refuses a redirect to a non-http scheme", async () => {
    const net = fakeNet(
      okRoutes({ [PAGE]: { status: 302, headers: { location: "ftp://example.test/x" } } }),
    );
    expect((await readPage(PAGE, net.ports)).status).toBe("refused");
  });

  it("gives each request 10 s and the whole read 30 s", async () => {
    const net = fakeNet(okRoutes());
    await readPage(PAGE, net.ports);
    expect(net.log.map((l) => l.timeoutMs)).toEqual([10_000, 10_000]);

    const late = fakeNet(okRoutes());
    late.clock.now = 25_000;
    await readPage(PAGE, late.ports);
    expect(late.log.map((l) => l.timeoutMs)).toEqual([5_000, 5_000]);

    const resolving = fakeNet(okRoutes());
    await readPage(PAGE, resolving.ports);
    expect(resolving.budgets).toEqual([30_000, 30_000]);
    const lateResolve = fakeNet(okRoutes());
    lateResolve.clock.now = 25_000;
    await readPage(PAGE, lateResolve.ports);
    expect(lateResolve.budgets).toEqual([5_000, 5_000]);

    const over = fakeNet(okRoutes());
    over.clock.now = 30_000;
    expect(await readPage(PAGE, over.ports)).toEqual({
      status: "failed",
      reason: "timeout",
    });
    expect(over.log).toHaveLength(0);
  });

  it("stops fetching stylesheets when the 30 s are spent and says so", async () => {
    const net = fakeNet(okRoutes({ ...sheetRoutes, [PAGE]: linkPage(sheets.slice(0, 3)) }));
    const orig = net.ports.request;
    net.ports.request = async (r) => {
      const out = await orig(r);
      if (r.url === PAGE) net.clock.now = 30_000;
      return out;
    };
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.stylesheets.length).toBe(0);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
  });

  it("fails with timeout when the budget runs out between robots.txt and the page", async () => {
    const net = fakeNet(okRoutes());
    const orig = net.ports.request;
    net.ports.request = async (r) => {
      const out = await orig(r);
      if (r.url === ROBOTS) net.clock.now = 30_000;
      return out;
    };
    expect(await readPage(PAGE, net.ports)).toEqual({
      status: "failed",
      reason: "timeout",
    });
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("reports a timeout, a network error, a non-html answer and an error status", async () => {
    const t = fakeNet(okRoutes({ [PAGE]: { error: "timeout" } }));
    expect(await readPage(PAGE, t.ports)).toEqual({
      status: "failed",
      reason: "timeout",
    });
    const n = fakeNet(okRoutes({ [PAGE]: { error: "network" } }));
    expect(await readPage(PAGE, n.ports)).toEqual({
      status: "failed",
      reason: "network",
    });
    const h = fakeNet(okRoutes({ [PAGE]: { headers: { "content-type": "image/png" } } }));
    expect(await readPage(PAGE, h.ports)).toEqual({
      status: "failed",
      reason: "not-html",
    });
    const s = fakeNet(okRoutes({ [PAGE]: { status: 500 } }));
    expect(await readPage(PAGE, s.ports)).toEqual({
      status: "failed",
      reason: "network",
    });
    const x = fakeNet(
      okRoutes({ [PAGE]: { headers: { "Content-Type": "application/xhtml+xml; charset=utf-8" } } }),
    );
    expect((await readPage(PAGE, x.ports)).status).toBe("read");
  });

  describe("the Nesting count in a read (SEC-133-R1-2, F20, F23)", () => {
    const MAX = 2 * 1024 * 1024;
    /** `head` then `unit` repeated while the whole stays within 2 MB (all ASCII). */
    const upTo = (head: string, unit: string) =>
      head + unit.repeat(Math.floor((MAX - head.length) / unit.length));
    const documents: [string, string][] = [
      ["nested div elements", upTo("<body>", "<div>")],
      ["<div></span> repeated", upTo("<body>", "<div></span>")],
      ["<div><script></div></script> repeated", upTo("<body>", "<div><script></div></script>")],
      [
        "a style that opens a comment, then nested div elements",
        upTo("<body><style><!--</style>", "<div>"),
      ],
      ["an svg style, then nested g elements", upTo("<body><svg><style>", "<g>")],
    ];

    it.each(documents)(
      "reads the 2 MB page of %s within 2 s, cut and incomplete",
      async (_n, html) => {
        const net = fakeNet(okRoutes({ [PAGE]: { body: enc.encode(html) } }));
        const started = performance.now();
        const r = await readPage(PAGE, net.ports);
        expect(performance.now() - started).toBeLessThan(2000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "reads the held-depth page within 10 s with nothing cut",
      async () => {
        // 125 divs, then </p> repeated: each pushes a fake p to depth 128 and pops it
        const html = upTo(`<body>${"<div>".repeat(125)}`, "</p>");
        const net = fakeNet(okRoutes({ [PAGE]: { body: enc.encode(html) } }));
        const started = performance.now();
        const r = await readPage(PAGE, net.ports);
        expect(performance.now() - started).toBeLessThan(10000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual([]);
      },
      HEAVY_TIMEOUT,
    );

    it("does not fetch a link the walk skips although the count never stopped (a void link at depth 129)", async () => {
      // 126 divs hold the stack at 128; the link is void, so it is attached at depth 129 without a push
      const body = `<body>${"<div>".repeat(126)}<link rel=stylesheet href=a.css></body>`;
      const net = fakeNet(
        okRoutes({ [PAGE]: { body }, "http://example.test/a.css": { body: "a{}" } }),
      );
      const r = await readPage(PAGE, net.ports);
      expect(r.status === "read" && r.stylesheets).toEqual([]);
      expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      expect(net.log.some((l) => l.url.endsWith("a.css"))).toBe(false);
    });
  });

  describe("the Work bound in a read (R2-1, SEC-133-R2-1, SEC-133-R2-2)", () => {
    const MAX = 2 * 1024 * 1024;
    /** `head`, then `unit(0)`, `unit(1)`, ... while the whole stays within 2 MB, then `tail` (all ASCII). */
    const counting = (head: string, unit: (n: number) => string, tail = "") => {
      const parts = [head];
      let length = head.length + tail.length;
      for (let n = 0; ; n++) {
        const next = unit(n);
        if (length + next.length > MAX) break;
        parts.push(next);
        length += next.length;
      }
      parts.push(tail);
      return parts.join("");
    };
    const reopenedHead = `<body><p>${Array.from({ length: 120 }, (_, i) => `<b id=${i}>`).join("")}`;
    const reopened =
      reopenedHead + "<p>x".repeat(Math.floor((MAX - reopenedHead.length) / "<p>x".length));
    const read = async (html: string) => {
      const net = fakeNet(okRoutes({ [PAGE]: { body: enc.encode(html) } }));
      const started = performance.now();
      const r = await readPage(PAGE, net.ports);
      return { r, net, ms: performance.now() - started };
    };

    it(
      "reads the re-opened-formatting document, cut by the Element count",
      async () => {
        expect(enc.encode(reopened).length).toBeLessThanOrEqual(MAX);
        const { r, ms } = await read(reopened);
        expect(ms).toBeLessThan(10000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      },
      HEAVY_TIMEOUT,
    );

    it.each([
      ["html start tags with distinct attribute names, cut by the Attribute merge", "html"],
      ["body start tags with distinct attribute names, cut by the Attribute merge", "body"],
    ])(
      "reads the 2 MB page of %s within 2 s",
      async (_n, tag) => {
        const { r, ms } = await read(counting("<body>", (n) => `<${tag} a${n}>`));
        expect(ms).toBeLessThan(2000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "reads the 2 MB page of one start tag holding distinct attributes, cut by the Attribute count",
      async () => {
        const { r, ms } = await read(counting("<body><p", (n) => ` a${n}`, ">x"));
        expect(ms).toBeLessThan(2000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "collects stylesheet URLs in one pass and stops at the eleventh",
      async () => {
        const html = counting("<head>", (n) => `<link rel=stylesheet href=/${n}>`);
        const links = (html.match(/<link /g) ?? []).length;
        expect(links).toBeGreaterThan(63000);
        const { r, net, ms } = await read(html);
        expect(ms).toBeLessThan(2000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
        const sheets = Array.from({ length: 10 }, (_, i) => `http://example.test/${i}`);
        expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, ...sheets]);
      },
      HEAVY_TIMEOUT,
    );

    it("keeps the order of first sight and counts a repeated link once", async () => {
      const page = `<head>${[3, 1, 3, 2, 1].map((n) => `<link rel=stylesheet href=/${n}>`).join("")}</head>`;
      const { r, net } = await read(page);
      expect(net.log.map((l) => l.url)).toEqual([
        ROBOTS,
        PAGE,
        "http://example.test/3",
        "http://example.test/1",
        "http://example.test/2",
      ]);
      expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]); // the 404 sheets
    });

    it("leaves out a link that is not http or https, or not a URL at all", async () => {
      const page = `<head>${[
        "ftp://example.test/a.css",
        "javascript:x",
        "data:text/css,a{}",
        "http://[bad",
        "/ok.css",
      ]
        .map((h) => `<link rel=stylesheet href="${h}">`)
        .join("")}</head>`;
      const { r, net } = await read(page);
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, "http://example.test/ok.css"]);
      expect(r.status).toBe("read"); // not refused: nothing but the http link was requested
    });

    it(
      "reads a page that repeats one link 63,886 times as one stylesheet, never reaching the eleventh",
      async () => {
        const html = counting("<head>", () => "<link rel=stylesheet href=/x>");
        const { r, net, ms } = await read(html);
        expect(ms).toBeLessThan(2000);
        expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, "http://example.test/x"]);
        expect(r.status).toBe("read");
      },
      HEAVY_TIMEOUT,
    );

    // The List steps documents (R3-1, SEC-133-R3-1; tech notes section 6, The List steps, measured), each to 2 MB.
    const formatting36 = [
      "b",
      "big",
      "code",
      "em",
      "font",
      "i",
      "s",
      "small",
      "strike",
      "strong",
      "tt",
      "u",
    ]
      .map((tag) => `<${tag}>`.repeat(3))
      .join("");
    const staleRound = `<template>${formatting36}<object></template>`;
    const repeated = (head: string, unit: string, tail = "") =>
      head + unit.repeat(Math.floor((MAX - head.length - tail.length) / unit.length)) + tail;

    it.each([
      ["the adoption move document", repeated("<body><b><div>", "<br>", "</b>")],
      [
        "the adoption move document, with text before each line",
        repeated("<body><b><div>", "x<br>", "</b>"),
      ],
      ["the stale-marker document", repeated("<body>", staleRound)],
    ])(
      "reads %s, cut by the List steps",
      async (_n, html) => {
        expect(enc.encode(html).length).toBeLessThanOrEqual(MAX);
        const { r, ms } = await read(html);
        expect(ms).toBeLessThan(10000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      },
      HEAVY_TIMEOUT,
    );

    it.each([
      ["a table with text and a br after each", repeated("<table>", "x<br>")],
      ["a table with a br after each", repeated("<body><table>", "<br>")],
      [
        "a table after many br, then text",
        `<body>${"<br>".repeat(349_520)}<table>${"a ".repeat(349_520)}<tr>`,
      ],
    ])(
      "reads a page fostered out of %s in linear time, uncut",
      async (_n, html) => {
        expect(enc.encode(html).length).toBeLessThanOrEqual(MAX);
        const { r, ms } = await read(html);
        expect(ms).toBeLessThan(10000);
        expect(r.status).toBe("read");
        expect(r.status === "read" && r.incomplete).toEqual([]);
      },
      HEAVY_TIMEOUT,
    );
  });

  describe("a port that rejects is no answer (SEC-133-R1-5, R1-3)", () => {
    const MARKER = "ENOTFOUND-secret-marker-7f3a";
    const boom = () => new Error(MARKER);
    const expectNoMarker = (r: unknown) => expect(JSON.stringify(r)).not.toContain(MARKER);

    it("fails with network, never rejecting, when resolve rejects on the page's own lookup", async () => {
      const net = fakeNet(okRoutes());
      net.ports.resolve = async () => {
        throw boom();
      };
      const r = await readPage(PAGE, net.ports);
      expect(r).toEqual({ status: "failed", reason: "network" });
      expectNoMarker(r);
      expect(net.log).toEqual([]); // no request, robots.txt included
    });

    it("fails with network when the host of a redirect target cannot be looked up, before its robots.txt is asked", async () => {
      const net = fakeNet(
        okRoutes({ [PAGE]: { status: 302, headers: { location: "http://other.test/" } } }),
      );
      const resolve = net.ports.resolve;
      net.ports.resolve = async (host, budgetMs) => {
        if (host === "other.test") throw boom();
        return resolve(host, budgetMs);
      };
      const r = await readPage(PAGE, net.ports);
      expect(r).toEqual({ status: "failed", reason: "network" });
      expectNoMarker(r);
      expect(net.log.every((l) => l.url.startsWith("http://example.test/"))).toBe(true);
    });

    it("fails with network when request rejects on the page's own request, after robots.txt answered 404", async () => {
      const net = fakeNet(okRoutes());
      const request = net.ports.request;
      net.ports.request = async (r) => {
        if (r.url === PAGE) throw boom();
        return request(r);
      };
      const result = await readPage(PAGE, net.ports);
      expect(result).toEqual({ status: "failed", reason: "network" });
      expectNoMarker(result);
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
    });

    it("treats a robots.txt lookup or request that rejects as no answer: complete disallow", async () => {
      const lookup = fakeNet(okRoutes());
      let lookups = 0;
      const resolve = lookup.ports.resolve;
      lookup.ports.resolve = async (host, budgetMs) => {
        if (++lookups === 2) throw boom(); // the first lookup is the page's, the second robots.txt's
        return resolve(host, budgetMs);
      };
      const a = await readPage(PAGE, lookup.ports);
      expect(a).toEqual({ status: "refused", reason: "read.refused.robots" });
      expectNoMarker(a);
      const asking = fakeNet(okRoutes());
      const request = asking.ports.request;
      asking.ports.request = async (r) => {
        if (r.url === ROBOTS) throw boom();
        return request(r);
      };
      const b = await readPage(PAGE, asking.ports);
      expect(b).toEqual({ status: "refused", reason: "read.refused.robots" });
      expectNoMarker(b);
    });

    it("skips a stylesheet whose request rejects, with page-incomplete", async () => {
      const net = fakeNet(okRoutes({ [PAGE]: linkPage(["/a.css"]) }));
      const request = net.ports.request;
      net.ports.request = async (r) => {
        if (r.url.endsWith("a.css")) throw boom();
        return request(r);
      };
      const r = await readPage(PAGE, net.ports);
      expect(r.status === "read" && r.stylesheets).toEqual([]);
      expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
      expectNoMarker(r);
    });

    it("reports timeout, not network, when the 30 s are spent by the time the port rejects", async () => {
      const lookup = fakeNet(okRoutes());
      lookup.ports.resolve = async () => {
        lookup.clock.now = 30_000;
        throw boom();
      };
      expect(await readPage(PAGE, lookup.ports)).toEqual({ status: "failed", reason: "timeout" });
      const asking = fakeNet(okRoutes());
      const request = asking.ports.request;
      asking.ports.request = async (r) => {
        if (r.url === PAGE) {
          asking.clock.now = 30_000;
          throw boom();
        }
        return request(r);
      };
      expect(await readPage(PAGE, asking.ports)).toEqual({ status: "failed", reason: "timeout" });
    });

    it("reports timeout when a lookup answers nothing once the 30 s are spent", async () => {
      const net = fakeNet(okRoutes());
      net.ports.resolve = async () => {
        net.clock.now = 30_000;
        return [];
      };
      expect(await readPage(PAGE, net.ports)).toEqual({ status: "failed", reason: "timeout" });
    });
  });

  it("hashes the bytes it kept and connects to the checked address", async () => {
    const net = fakeNet(okRoutes(), { "example.test": ["93.184.216.34", "93.184.216.35"] });
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.document.contentHash).toBe("hash13");
    expect(net.log.map((l) => l.address)).toEqual(["93.184.216.34", "93.184.216.34"]);
  });

  it("skips a stylesheet that fails, with page-incomplete", async () => {
    const net = fakeNet(
      okRoutes({ [PAGE]: linkPage(["/a.css"]), "http://example.test/a.css": { error: "network" } }),
    );
    const r = await readPage(PAGE, net.ports);
    expect(r.status === "read" && r.stylesheets.length).toBe(0);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
  });
});
