import { describe, expect, it } from "vitest";
import {
  CONTACT_URL,
  checkAddress,
  parseRobots,
  readPage,
  robotsAllows,
  type ReadPorts,
  type StylesheetLinks,
} from "./read-page";

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
const enc = new TextEncoder();

/** A fake network recorded in the test: DNS answers, routes by URL, a log of every request, a clock. */
function fakeNet(routes: Record<string, Route>, dns: Record<string, string[]> = {}) {
  const log: Logged[] = [];
  const resolved: string[] = [];
  const clock = { now: 0 };
  const ports: ReadPorts = {
    async resolve(host) {
      resolved.push(host);
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
  return { ports, log, resolved, clock };
}

const noLinks: StylesheetLinks = () => [];
const PAGE = "http://example.test/";
const ROBOTS = "http://example.test/robots.txt";
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
  ];
  it.each(refusedUrls)("refuses %s", async (url, routes, dns) => {
    const net = fakeNet(routes ?? {}, dns);
    const r = await readPage(url, net.ports, undefined, noLinks);
    expect(r).toEqual({ status: "refused", reason: "read.refused.address" });
    for (const l of net.log) {
      expect(checkAddress(l.address)).toBe("public");
    }
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
    const r = await readPage(page, net.ports, undefined, noLinks);
    expect(r.status).toBe("read");
    expect(net.log.map((l) => l.url)).toEqual([`${page}robots.txt`, page]);
    expect(net.log[0]?.address).toBe("64:ff9b::808:808");
  });

  it("refuses a private remoteAddress after a public resolve", async () => {
    const net = fakeNet(okRoutes({ [PAGE]: { remoteAddress: "10.0.0.5" } }));
    expect(await readPage(PAGE, net.ports, undefined, noLinks)).toEqual({
      status: "refused",
      reason: "read.refused.address",
    });
  });

  it("refuses a private remoteAddress reported for robots.txt", async () => {
    const net = fakeNet(okRoutes({ [ROBOTS]: { status: 404, remoteAddress: "127.0.0.1" } }));
    const r = await readPage(PAGE, net.ports, undefined, noLinks);
    expect(r.status).toBe("refused");
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("refuses when one of several resolved addresses is private", async () => {
    const net = fakeNet(okRoutes(), { "example.test": ["93.184.216.34", "10.0.0.5"] });
    expect((await readPage(PAGE, net.ports, undefined, noLinks)).status).toBe("refused");
    expect(net.log).toHaveLength(0);
  });

  it("refuses a redirect to a host that resolves to a private address", async () => {
    const net = fakeNet(
      okRoutes({ [PAGE]: { status: 301, headers: { location: "http://other.test/" } } }),
      { "other.test": ["172.16.0.1"] },
    );
    expect((await readPage(PAGE, net.ports, undefined, noLinks)).status).toBe("refused");
    expect(net.log.every((l) => l.url.startsWith("http://example.test/"))).toBe(true);
  });

  it("fails with network when the host resolves to nothing", async () => {
    const net = fakeNet({}, { "example.test": [] });
    expect(await readPage(PAGE, net.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "network",
    });
    expect(net.log).toHaveLength(0);
  });

  it("refuses a stylesheet that resolves to a private address, the whole read", async () => {
    const net = fakeNet(okRoutes({ "http://cdn.test/a.css": { body: "a{}" } }), {
      "cdn.test": ["10.1.1.1"],
    });
    const r = await readPage(PAGE, net.ports, undefined, () => ["http://cdn.test/a.css"]);
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
      "01.2.3.4",
      "1.2.3",
      "256.1.1.1",
      "::",
      "::1",
      "fc00::1",
      "fdff::1",
      "fe80::1",
      "febf::1",
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
      "fec0::1",
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
    ["a 404", { status: 404 }, "read"],
  ];
  it.each(cases)("%s", async (_n, robots, outcome) => {
    const net = fakeNet(okRoutes({ [ROBOTS]: robots }));
    const r = await readPage(PAGE, net.ports, undefined, noLinks);
    expect(net.log[0]?.url).toBe(ROBOTS);
    if (outcome === "refused") {
      expect(r).toEqual({ status: "refused", reason: "read.refused.robots" });
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
    } else {
      expect(r.status).toBe("read");
      expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE]);
    }
  });

  it("treats no answer, a redirect and a 5xx as complete disallow", async () => {
    for (const robots of [
      { error: "network" as const },
      { error: "timeout" as const },
      { status: 301, headers: { location: "/x" } },
      { status: 500 },
    ]) {
      const net = fakeNet(okRoutes({ [ROBOTS]: robots }));
      expect(await readPage(PAGE, net.ports, undefined, noLinks)).toEqual({
        status: "refused",
        reason: "read.refused.robots",
      });
    }
  });

  it("reads robots.txt once per origin and keeps it in the cache", async () => {
    const net = fakeNet(okRoutes({ "http://example.test/a.css": { body: "a{}" } }));
    const cache = new Map();
    await readPage(PAGE, net.ports, cache, () => ["/a.css"]);
    expect(net.log.filter((l) => l.url === ROBOTS)).toHaveLength(1);
    expect(cache.has("http://example.test")).toBe(true);
    await readPage(PAGE, net.ports, cache, noLinks);
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
    expect(await readPage(PAGE, net.ports, undefined, noLinks)).toEqual({
      status: "refused",
      reason: "read.refused.robots",
    });
    expect(net.log.some((l) => l.url === "http://other.test/p")).toBe(false);
  });

  it("skips a stylesheet that robots.txt disallows and marks the read incomplete", async () => {
    const net = fakeNet(
      okRoutes({
        [ROBOTS]: { body: "User-agent: *\nDisallow: /a.css" },
        "http://example.test/a.css": { body: "a{}" },
      }),
    );
    const r = await readPage(PAGE, net.ports, undefined, () => ["/a.css"]);
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
    const net = fakeNet(okRoutes(sheetRoutes));
    await readPage(PAGE, net.ports, undefined, () => sheets.slice(0, 2));
    expect(net.log.length).toBe(4);
    for (const l of net.log) {
      expect(Object.keys(l.headers).sort()).toEqual(["accept", "user-agent"]);
      expect(l.headers["user-agent"]).toContain("OriviloReader/1");
      expect(l.headers["user-agent"]).toContain(CONTACT_URL);
    }
  });

  it("fetches at most 10 stylesheets, in document order, and marks the rest incomplete", async () => {
    const net = fakeNet(okRoutes(sheetRoutes));
    const r = await readPage(PAGE, net.ports, undefined, () => sheets);
    expect(r.status).toBe("read");
    if (r.status !== "read") return;
    expect(r.stylesheets.map((s) => s.url)).toEqual(sheets.slice(0, 10));
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, ...sheets.slice(0, 10)]);
    expect(r.incomplete).toEqual(["page-incomplete"]);
  });

  it("exactly 10 stylesheets is complete, and a duplicate link counts once", async () => {
    const net = fakeNet(okRoutes(sheetRoutes));
    const r = await readPage(PAGE, net.ports, undefined, () => [
      ...sheets.slice(0, 10),
      sheets[0] ?? "",
    ]);
    expect(r.status === "read" && r.stylesheets.length).toBe(10);
    expect(r.status === "read" && r.incomplete).toEqual([]);
  });

  it("fetches nothing but the robots file, the page and its stylesheets", async () => {
    const net = fakeNet(okRoutes(sheetRoutes));
    // the extractor gives stylesheet links only; the pinned tokenizer (later task) is what keeps other links out
    await readPage(PAGE, net.ports, undefined, () => sheets.slice(0, 3));
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS, PAGE, ...sheets.slice(0, 3)]);
  });

  it("cuts the document at 2 MB with page-incomplete", async () => {
    const big = new Uint8Array(3 * 1024 * 1024).fill(97);
    const net = fakeNet(okRoutes({ [PAGE]: { body: big } }));
    const r = await readPage(PAGE, net.ports, undefined, noLinks);
    expect(net.log[1]?.maxBytes).toBe(2 * 1024 * 1024);
    expect(r.status === "read" && r.document.bytes.length).toBe(2 * 1024 * 1024);
    expect(r.status === "read" && r.document.truncated).toBe(true);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
  });

  it("cuts a document at exactly 2 MB + 1 even when the port ignores maxBytes", async () => {
    const body = new Uint8Array(2 * 1024 * 1024 + 1).fill(97);
    const net = fakeNet(okRoutes({ [PAGE]: { body, ignoreMaxBytes: true } }));
    const r = await readPage(PAGE, net.ports, undefined, noLinks);
    expect(r.status === "read" && r.document.bytes.length).toBe(2 * 1024 * 1024);
    expect(r.status === "read" && r.document.truncated).toBe(true);
    const exact = fakeNet(
      okRoutes({ [PAGE]: { body: new Uint8Array(2 * 1024 * 1024), ignoreMaxBytes: true } }),
    );
    const e = await readPage(PAGE, exact.ports, undefined, noLinks);
    expect(e.status === "read" && e.document.truncated).toBe(false);
    expect(e.status === "read" && e.incomplete).toEqual([]);
  });

  it("cuts a stylesheet at 1 MB with page-incomplete", async () => {
    const css = new Uint8Array(1024 * 1024 + 5).fill(97);
    const net = fakeNet(okRoutes({ "http://example.test/big.css": { body: css } }));
    const r = await readPage(PAGE, net.ports, undefined, () => ["/big.css"]);
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
    const ok = await readPage(PAGE, three.ports, undefined, noLinks);
    expect(ok.status === "read" && ok.url).toBe(hop(3));
    const four = fakeNet(chain(4));
    expect(await readPage(PAGE, four.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "redirects",
    });
    expect(four.log.some((l) => l.url === hop(4))).toBe(false);
  });

  it("refuses a redirect to a non-http scheme", async () => {
    const net = fakeNet(
      okRoutes({ [PAGE]: { status: 302, headers: { location: "ftp://example.test/x" } } }),
    );
    expect((await readPage(PAGE, net.ports, undefined, noLinks)).status).toBe("refused");
  });

  it("gives each request 10 s and the whole read 30 s", async () => {
    const net = fakeNet(okRoutes());
    await readPage(PAGE, net.ports, undefined, noLinks);
    expect(net.log.map((l) => l.timeoutMs)).toEqual([10_000, 10_000]);

    const late = fakeNet(okRoutes());
    late.clock.now = 25_000;
    await readPage(PAGE, late.ports, undefined, noLinks);
    expect(late.log.map((l) => l.timeoutMs)).toEqual([5_000, 5_000]);

    const over = fakeNet(okRoutes());
    over.clock.now = 30_000;
    expect(await readPage(PAGE, over.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "timeout",
    });
    expect(over.log).toHaveLength(0);
  });

  it("stops fetching stylesheets when the 30 s are spent and says so", async () => {
    const net = fakeNet(okRoutes(sheetRoutes));
    const orig = net.ports.request;
    net.ports.request = async (r) => {
      const out = await orig(r);
      if (r.url === PAGE) net.clock.now = 30_000;
      return out;
    };
    const r = await readPage(PAGE, net.ports, undefined, () => sheets.slice(0, 3));
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
    expect(await readPage(PAGE, net.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "timeout",
    });
    expect(net.log.map((l) => l.url)).toEqual([ROBOTS]);
  });

  it("reports a timeout, a network error, a non-html answer and an error status", async () => {
    const t = fakeNet(okRoutes({ [PAGE]: { error: "timeout" } }));
    expect(await readPage(PAGE, t.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "timeout",
    });
    const n = fakeNet(okRoutes({ [PAGE]: { error: "network" } }));
    expect(await readPage(PAGE, n.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "network",
    });
    const h = fakeNet(okRoutes({ [PAGE]: { headers: { "content-type": "image/png" } } }));
    expect(await readPage(PAGE, h.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "not-html",
    });
    const s = fakeNet(okRoutes({ [PAGE]: { status: 500 } }));
    expect(await readPage(PAGE, s.ports, undefined, noLinks)).toEqual({
      status: "failed",
      reason: "network",
    });
    const x = fakeNet(
      okRoutes({ [PAGE]: { headers: { "Content-Type": "application/xhtml+xml; charset=utf-8" } } }),
    );
    expect((await readPage(PAGE, x.ports, undefined, noLinks)).status).toBe("read");
  });

  it("hashes the bytes it kept and connects to the checked address", async () => {
    const net = fakeNet(okRoutes(), { "example.test": ["93.184.216.34", "93.184.216.35"] });
    const r = await readPage(PAGE, net.ports, undefined, noLinks);
    expect(r.status === "read" && r.document.contentHash).toBe("hash13");
    expect(net.log.map((l) => l.address)).toEqual(["93.184.216.34", "93.184.216.34"]);
  });

  it("skips a stylesheet that fails, with page-incomplete", async () => {
    const net = fakeNet(okRoutes({ "http://example.test/a.css": { error: "network" } }));
    const r = await readPage(PAGE, net.ports, undefined, () => ["/a.css"]);
    expect(r.status === "read" && r.stylesheets.length).toBe(0);
    expect(r.status === "read" && r.incomplete).toEqual(["page-incomplete"]);
  });
});
