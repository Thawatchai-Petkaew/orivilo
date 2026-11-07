import { describe, expect, it, vi } from "vitest";
import { PERSONALITY_AXES } from "./knowledge";
import { EVIDENCE_STRINGS } from "./evidence-strings";
import { URL_MAX_CHARS } from "./evidence";
import { checkAddress, type ReadPorts, type ReadResult } from "./read-page";
import { REPORT_LINES, REPORT_SCHEMA_VERSION, reportOf, reportSchema } from "./report";
import { readUrlInput, type AnalyserContext, type UrlInput } from "./url-analyser";

const BUILD = {
  driver: "playwright",
  driverVersion: "1.56.1",
  browser: "chromium",
  browserVersion: "141.0.7390.37",
};

const analysed = (over: Record<string, unknown> = {}) => ({
  version: REPORT_SCHEMA_VERSION,
  status: "analysed",
  url: "https://clinic.example/",
  renderer: null,
  evidence: [],
  notMeasured: [{ what: "colour-area", reason: "no-renderer" }],
  personality: PERSONALITY_AXES.map((axis) => ({ axis, leans: [] })),
  lines: ["report.conflictsNotChecked"],
  ...over,
});

const notRead = (over: Record<string, unknown> = {}) => ({
  version: REPORT_SCHEMA_VERSION,
  status: "not-read",
  url: "https://rival.example/",
  line: "read.notRead.competitor",
  ...over,
});

const refused = (over: Record<string, unknown> = {}) => ({
  version: REPORT_SCHEMA_VERSION,
  status: "refused",
  url: "http://127.0.0.1/",
  urlCut: false,
  key: "read.refused.address",
  line: "read.refused.address",
  ...over,
});

const ok = (value: unknown) => reportSchema.safeParse(value).success;
const omit = (obj: Record<string, unknown>, key: string) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

describe("reportSchema", () => {
  it("is version 1.0 with one report line", () => {
    expect(REPORT_SCHEMA_VERSION).toBe("1.0");
    expect([...REPORT_LINES]).toEqual(["report.conflictsNotChecked"]);
  });

  it("every report line has a string", () => {
    for (const line of REPORT_LINES) expect(line in EVIDENCE_STRINGS).toBe(true);
  });

  describe("the analysed member", () => {
    it("parses a report with a renderer, with none, and with a snapshot-free not-measured list", () => {
      expect(ok(analysed())).toBe(true);
      expect(ok(analysed({ renderer: BUILD, notMeasured: [] }))).toBe(true);
    });

    it("refuses a missing, an extra and a misplaced field", () => {
      expect(ok(omit(analysed(), "evidence"))).toBe(false);
      expect(ok(analysed({ snapshot: {} }))).toBe(false);
      expect(ok(analysed({ version: "1.1" }))).toBe(false);
    });

    it("holds one personality entry per axis, in axis order", () => {
      const entries = PERSONALITY_AXES.map((axis) => ({ axis, leans: [] }));
      expect(ok(analysed({ personality: entries.slice(1) }))).toBe(false);
      expect(ok(analysed({ personality: [...entries, entries[0]] }))).toBe(false);
    });

    it("refuses an extra key on a personality entry", () => {
      const entries = PERSONALITY_AXES.map((axis, i) => ({
        axis,
        leans: [],
        ...(i === 0 ? { x: 1 } : {}),
      }));
      expect(ok(analysed({ personality: entries }))).toBe(false);
    });

    it("refuses personality entries out of axis order", () => {
      const entries = PERSONALITY_AXES.map((axis) => ({ axis, leans: [] }));
      const swapped = [entries[1], entries[0], ...entries.slice(2)];
      expect(ok(analysed({ personality: swapped }))).toBe(false);
    });

    it("caps leans and evidence at 5000 entries", () => {
      const lean = { lean: "high", evidenceId: "e1", confidence: 0.6 };
      const withLeans = (n: number) =>
        analysed({
          personality: PERSONALITY_AXES.map((axis, i) => ({
            axis,
            leans: i === 0 ? Array.from({ length: n }, () => lean) : [],
          })),
        });
      expect(ok(withLeans(5000))).toBe(true);
      expect(ok(withLeans(5001))).toBe(false);
      // Items of the wrong shape also fail, so the cap is read from its own issue.
      const over = reportSchema.safeParse(
        analysed({ evidence: Array.from({ length: 5001 }, () => ({})) }),
      );
      expect(
        over.error?.issues.some((i) => i.code === "too_big" && i.path.join() === "evidence"),
      ).toBe(true);
    });

    it("refuses a not-measured entry outside notMeasuredSchema", () => {
      expect(ok(analysed({ notMeasured: [{ what: "colour-area", reason: "other" }] }))).toBe(false);
    });

    it("holds at most four not-measured entries and at most 2048 characters of url", () => {
      const four = ["colour-area", "contrast-pair", "density", "text-visibility"].map((what) => ({
        what,
        reason: "no-renderer",
      }));
      expect(ok(analysed({ notMeasured: four }))).toBe(true);
      expect(ok(analysed({ notMeasured: [...four, four[0]] }))).toBe(false);
      expect(ok(analysed({ url: "a".repeat(URL_MAX_CHARS) }))).toBe(true);
      expect(ok(analysed({ url: "a".repeat(URL_MAX_CHARS + 1) }))).toBe(false);
    });

    it("refuses a lean outside high and low and an extra key on a lean", () => {
      const leans = (lean: unknown, extra: Record<string, unknown> = {}) =>
        analysed({
          personality: PERSONALITY_AXES.map((axis, i) => ({
            axis,
            leans: i === 0 ? [{ lean, evidenceId: "e1", confidence: 0.6, ...extra }] : [],
          })),
        });
      expect(ok(leans("high"))).toBe(true);
      expect(ok(leans("middle"))).toBe(false);
      expect(ok(leans("low", { picked: true }))).toBe(false);
    });
  });

  describe("the not-read member", () => {
    it("parses the competitor record and nothing more", () => {
      expect(ok(notRead())).toBe(true);
      expect(ok(notRead({ evidence: [] }))).toBe(false);
      expect(ok(notRead({ line: "read.refused.address" }))).toBe(false);
      expect(ok(notRead({ url: "a".repeat(URL_MAX_CHARS + 1) }))).toBe(false);
    });
  });

  // Rows D-3 and D-4: the JSON the command writes for a refused or failed read.
  describe("the refused member", () => {
    it("parses row D-3: an address refusal, uncut and cut", () => {
      expect(ok(refused())).toBe(true);
      const cut = "https://rival.example/" + "a".repeat(2026);
      expect(cut.length).toBe(URL_MAX_CHARS);
      expect(ok(refused({ url: cut, urlCut: true }))).toBe(true);
      expect(ok(refused({ url: cut + "a" }))).toBe(false);
    });

    it("parses row D-4: a failed read keyed by its reason", () => {
      expect(
        ok(
          refused({
            url: "https://nowhere.example/",
            key: "network",
            line: "read.failed.network",
          }),
        ),
      ).toBe(true);
    });

    it("parses every outcome of report-outcome-1 with its own line", () => {
      const outcomes: [string, string][] = [
        ["read.refused.address", "read.refused.address"],
        ["read.refused.robots", "read.refused.robots"],
        ["timeout", "read.failed.timeout"],
        ["network", "read.failed.network"],
        ["redirects", "read.failed.redirects"],
        ["not-html", "read.failed.notHtml"],
      ];
      for (const [key, line] of outcomes) {
        expect(ok(refused({ key, line }))).toBe(true);
        expect(line in EVIDENCE_STRINGS).toBe(true);
      }
    });

    it("refuses a line that is not the key's line, and a key or line outside the six", () => {
      expect(ok(refused({ key: "timeout", line: "read.failed.network" }))).toBe(false);
      expect(ok(refused({ key: "read.refused.robots", line: "read.refused.address" }))).toBe(false);
      expect(ok(refused({ key: "network", line: "network" }))).toBe(false);
      expect(ok(refused({ key: "other", line: "read.refused.other" }))).toBe(false);
      expect(ok(refused({ key: "read.notRead.competitor", line: "read.notRead.competitor" }))).toBe(
        false,
      );
    });

    it("holds no evidence, no notMeasured and no personality, and needs urlCut", () => {
      expect(ok(refused({ evidence: [] }))).toBe(false);
      expect(ok(refused({ notMeasured: [] }))).toBe(false);
      expect(ok(refused({ personality: [] }))).toBe(false);
      expect(ok(omit(refused(), "urlCut"))).toBe(false);
      expect(ok(refused({ urlCut: "no" }))).toBe(false);
    });
  });

  it("refuses an unknown status and a missing one", () => {
    expect(ok(refused({ status: "failed" }))).toBe(false);
    expect(ok({})).toBe(false);
  });

  // Row 38, beyond the row (F56).
  it("report lines are unique and in REPORT_LINES order", () => {
    expect(ok(analysed({ lines: ["report.conflictsNotChecked"] }))).toBe(true);
    expect(ok(analysed({ lines: [] }))).toBe(true);
    const repeat = reportSchema.safeParse(
      analysed({ lines: ["report.conflictsNotChecked", "report.conflictsNotChecked"] }),
    );
    expect(repeat.success).toBe(false);
    // The refine runs before the cap, so a repeat at 1.0 shows `custom` beside `too_big`.
    const codes = repeat.error?.issues.map((i) => i.code) ?? [];
    expect(codes).toContain("custom");
    expect(codes).toContain("too_big");
    expect(ok(analysed({ lines: ["industry.byNameOnly"] }))).toBe(false);
  });
});

// ---------------------------------------------------------------- reportOf (ORV-266 rows 1 to 7)

/** The framework timeout of a test that parses a heavy document: above the bound, so a parallel full run never pre-empts it. */
const HEAVY_TIMEOUT = 60_000;

declare class TextEncoder {
  encode(input: string): Uint8Array; // module-scoped: the engine tsconfig has no DOM lib
}
const enc = new TextEncoder();
// The engine source keeps node: out (row 30), so the test loads the one function it needs untyped.
const { createHash } = (await vi.importActual("node:crypto")) as {
  createHash(algorithm: "sha256"): { update(b: Uint8Array): { digest(encoding: "hex"): string } };
};

type Route = {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
  error?: "timeout" | "network";
};

/** A fake network recorded in the test: DNS answers, routes by URL, a log of every call. No test here reaches the internet. */
function fakeNet(routes: Record<string, Route>, dns: Record<string, string[]> = {}) {
  const resolved: string[] = [];
  const requests: { url: string; address: string }[] = [];
  const ports: ReadPorts = {
    async resolve(host) {
      resolved.push(host);
      return dns[host] ?? ["93.184.216.34"];
    },
    async request(r) {
      requests.push({ url: r.url, address: r.address });
      const route = routes[r.url] ?? { status: 404 };
      if (route.error) return { ok: false, error: route.error };
      const full = enc.encode(route.body ?? "");
      const cut = full.length > r.maxBytes;
      return {
        ok: true,
        status: route.status ?? 200,
        headers: route.headers ?? { "content-type": "text/html" },
        body: cut ? full.slice(0, r.maxBytes) : full,
        truncated: cut,
        remoteAddress: r.address,
      };
    },
    sha256: (b) => createHash("sha256").update(b).digest("hex"),
    elapsedMs: () => 0,
  };
  return { ports, resolved, requests };
}

const SITE = "https://clinic.example/";
const SITE_ROBOTS = "https://clinic.example/robots.txt";
const CSS_A =
  'a{color:#FF7A00;font-family:"Inter",sans-serif}b{color:rgb(255, 122, 0)}c{color:#0000ff}';
const HTML_A =
  '<!doctype html><html lang="en"><head><title>Bright Clinic</title>' +
  '<meta name="description" content="Warm care for families">' +
  '<link rel="stylesheet" href="/a.css"></head><body>' +
  "<h1>premium and calm</h1><h2>ไม่หรูหรา</h2><h2>not too premium</h2>" +
  "<p>Opening hours are every day of the week, with walk in visits and check ups for the whole family at the clinic near the market.</p>" +
  "</body></html>";
const siteRoutes = (extra: Record<string, Route> = {}): Record<string, Route> => ({
  [SITE_ROBOTS]: { status: 404 },
  [SITE]: { body: HTML_A },
  "https://clinic.example/a.css": { body: CSS_A, headers: { "content-type": "text/css" } },
  ...extra,
});

const CTX: AnalyserContext = {
  role: "own",
  retrievedAt: "2026-11-07T10:00:00.000Z",
  notRendered: "no-renderer",
};

/** The path of the action: the engine's gate, then the builder, over fake ports. */
async function build(
  url: string,
  net: ReturnType<typeof fakeNet>,
  role: UrlInput["role"] = "own",
  given = url,
) {
  const outcome = await readUrlInput({ url, role }, net.ports);
  return { outcome, built: reportOf(given, outcome, null, { ...CTX, role }) };
}
function report(built: ReturnType<typeof reportOf>) {
  if (!built.ok) throw new Error(`no report: ${built.error}`);
  return built.report;
}
const refusedOf = (built: ReturnType<typeof reportOf>) => {
  const r = report(built);
  if (r.status !== "refused") throw new Error(`status ${r.status}`);
  return r;
};

describe("reportOf, row 1: a read", () => {
  it("gives an analysed report that parses, with no renderer and four not-measured entries", async () => {
    const net = fakeNet(siteRoutes());
    const { built } = await build(SITE, net);
    const r = report(built);
    expect(reportSchema.safeParse(r).success).toBe(true);
    if (r.status !== "analysed") throw new Error(r.status);
    expect(r.url).toBe(SITE);
    expect(r.renderer).toBeNull();
    expect(r.notMeasured).toEqual(
      ["colour-area", "contrast-pair", "density", "text-visibility"].map((what) => ({
        what,
        reason: "no-renderer",
      })),
    );
    expect(r.personality.map((p) => p.axis)).toEqual([...PERSONALITY_AXES]);
    expect(r.lines).toEqual(["report.conflictsNotChecked"]);
    expect(r.evidence.length).toBeGreaterThan(5);
    expect(r.evidence.every((i) => !i.fromModel)).toBe(true);
  });

  it("names the page read after redirects, not the address as given", async () => {
    const given = "http://clinic.example/old";
    const routes = siteRoutes({
      "http://clinic.example/robots.txt": { status: 404 },
      [given]: { status: 301, headers: { location: SITE } },
    });
    const { built } = await build(given, fakeNet(routes));
    const r = report(built);
    expect(r.status === "analysed" && r.url).toBe(SITE);
  });

  it("fills an axis with the readings above the floor only, each naming its evidence item", async () => {
    const { built } = await build(SITE, fakeNet(siteRoutes()));
    const r = report(built);
    if (r.status !== "analysed") throw new Error(r.status);
    const premium = r.personality.find((p) => p.axis === "premium");
    // The headings are short blocks, so their readings sit below the floor (few-words) and are no lean.
    const readings = r.evidence.filter(
      (i) => i.reading?.target === "identity-frame.personality.premium",
    );
    expect(readings.length).toBeGreaterThan(0);
    expect(readings.every((i) => i.belowFloor)).toBe(true);
    expect(premium?.leans).toEqual([]);
  });

  it("puts a reading from a block of 20 words in the lean list, with its id and confidence", async () => {
    const words = "premium ".repeat(1) + "care for every family at our clinic ".repeat(4);
    const html = `<!doctype html><html><body><p>${words}</p></body></html>`;
    const { built } = await build(SITE, fakeNet(siteRoutes({ [SITE]: { body: html } })));
    const r = report(built);
    if (r.status !== "analysed") throw new Error(r.status);
    const item = r.evidence.find(
      (i) => i.reading?.target === "identity-frame.personality.premium" && !i.belowFloor,
    );
    expect(item).toBeDefined();
    expect(r.personality.find((p) => p.axis === "premium")?.leans).toEqual([
      { lean: "high", evidenceId: item?.id, confidence: 0.7 },
    ]);
    expect(
      r.personality.filter((p) => p.axis !== "premium").every((p) => p.leans.length === 0),
    ).toBe(true);
  });
});

describe("reportOf, row 2: a refused address", () => {
  const cases: [string, string, Record<string, string[]>?, Record<string, Route>?][] = [
    ["a loopback address", "http://127.0.0.1/"],
    ["the metadata address", "http://169.254.169.254/latest/meta-data/"],
    ["a private address", "http://10.0.0.5/"],
    ["an IPv6 loopback", "http://[::1]/"],
    ["a port", "https://example.com:8443/"],
    ["a username and password", "https://user:secret@example.com/"],
    ["a scheme", "ftp://example.com/"],
    [
      "a host that resolves to a private address",
      "https://clinic.example/",
      { "clinic.example": ["10.0.0.5"] },
    ],
    [
      "a public page that redirects to a private address",
      SITE,
      {},
      siteRoutes({ [SITE]: { status: 302, headers: { location: "http://10.0.0.5/" } } }),
    ],
  ];
  it.each(cases)(
    "%s gives a refused report with read.refused.address",
    async (_n, url, dns, routes) => {
      const net = fakeNet(routes ?? siteRoutes(), dns);
      const { built } = await build(url, net);
      const r = refusedOf(built);
      expect(r.key).toBe("read.refused.address");
      expect(r.line).toBe("read.refused.address");
      expect(JSON.stringify(r)).not.toContain("secret");
      // no request reached an address the check refuses
      expect(net.requests.every((q) => checkAddress(q.address) === "public")).toBe(true);
      expect(
        net.requests.some((q) => q.url.includes("10.0.0.5") || q.url.includes("127.0.0.1")),
      ).toBe(false);
    },
  );
});

describe("reportOf, row 3: refused by robots.txt", () => {
  it.each([
    ["a disallow of /", { body: "User-agent: OriviloReader\nDisallow: /" }],
    ["a 503", { status: 503 }],
  ] as [string, Route][])(
    "%s gives read.refused.robots and only robots.txt is asked",
    async (_n, robots) => {
      const net = fakeNet(siteRoutes({ [SITE_ROBOTS]: robots }));
      const { built } = await build(SITE, net);
      const r = refusedOf(built);
      expect(r.key).toBe("read.refused.robots");
      expect(r.line).toBe("read.refused.robots");
      expect(net.requests.map((q) => q.url)).toEqual([SITE_ROBOTS]);
    },
  );
});

describe("reportOf, row 4: a failed read", () => {
  const hop = (n: number) => `https://clinic.example/r${n}`;
  const chain: Record<string, Route> = siteRoutes({
    [SITE]: { status: 302, headers: { location: hop(1) } },
    [hop(1)]: { status: 302, headers: { location: hop(2) } },
    [hop(2)]: { status: 302, headers: { location: hop(3) } },
    [hop(3)]: { status: 302, headers: { location: hop(4) } },
    [hop(4)]: { body: HTML_A },
  });
  const cases: [string, Record<string, Route>, Record<string, string[]>, string, string][] = [
    [
      "the document times out",
      siteRoutes({ [SITE]: { error: "timeout" } }),
      {},
      "timeout",
      "read.failed.timeout",
    ],
    [
      "a host has no address",
      siteRoutes(),
      { "clinic.example": [] },
      "network",
      "read.failed.network",
    ],
    [
      "the document answers 404",
      siteRoutes({ [SITE]: { status: 404 } }),
      {},
      "network",
      "read.failed.network",
    ],
    ["four redirects follow", chain, {}, "redirects", "read.failed.redirects"],
    [
      "the answer is a pdf",
      siteRoutes({ [SITE]: { body: "%PDF", headers: { "content-type": "application/pdf" } } }),
      {},
      "not-html",
      "read.failed.notHtml",
    ],
  ];
  it.each(cases)("%s", async (_n, routes, dns, key, line) => {
    const { built } = await build(SITE, fakeNet(routes, dns));
    const r = refusedOf(built);
    expect(r.key).toBe(key);
    expect(r.line).toBe(line);
    expect(line in EVIDENCE_STRINGS).toBe(true);
  });
});

describe("reportOf, row 5: a page cut at the size bound", () => {
  it(
    "is analysed with page-incomplete on every item, and a premium reading below the floor",
    async () => {
      const lead = `<!doctype html><html><body><p>${"premium ".repeat(1)}${"care for every family at our clinic ".repeat(4)}</p>`;
      const html = lead + `<!-- ${"a".repeat(2 * 1024 * 1024)} -->`;
      expect(html.length).toBeGreaterThan(2 * 1024 * 1024);
      const { outcome, built } = await build(SITE, fakeNet(siteRoutes({ [SITE]: { body: html } })));
      expect(outcome.status === "read" && outcome.document.truncated).toBe(true);
      const r = report(built);
      if (r.status !== "analysed") throw new Error(r.status);
      expect(r.evidence.length).toBeGreaterThan(0);
      for (const item of r.evidence) {
        expect(item.flags.map((f) => f.key)).toContain("quality.pageIncomplete");
        expect(item.confidence.factors.map((f) => f.id)).toContain("page-incomplete");
      }
      const measure = r.evidence.find((i) => i.measure?.metric === "word-count");
      expect(measure?.confidence.value).toBe(0.7);
      const reading = r.evidence.find(
        (i) => i.reading?.target === "identity-frame.personality.premium",
      );
      expect(reading?.confidence.value).toBe(0.49);
      expect(reading?.belowFloor).toBe(true);
      expect(r.personality.find((p) => p.axis === "premium")?.leans).toEqual([]);
    },
    HEAVY_TIMEOUT,
  );
});

describe("reportOf, row 6: no report", () => {
  it(
    "gives report-invalid, not a throw, past 5,000 evidence items",
    async () => {
      const html = `<!doctype html><html><head><title>t</title></head><body>${"<p>a</p>".repeat(5000)}</body></html>`;
      const { built } = await build(SITE, fakeNet(siteRoutes({ [SITE]: { body: html } })));
      expect(built).toEqual({ ok: false, error: "report-invalid" });
    },
    HEAVY_TIMEOUT,
  );

  it("passes the analyser's refusal on, not a report", async () => {
    const { outcome } = await build(SITE, fakeNet(siteRoutes()));
    expect(reportOf(SITE, outcome, null, { ...CTX, role: "competitor" })).toEqual({
      ok: false,
      error: "competitor-not-read",
    });
  });
});

describe("reportOf, row 7: a competitor", () => {
  it("gives a not-read report with the address as given and calls no port", async () => {
    const net = fakeNet(siteRoutes());
    const { built } = await build("https://rival.example/path", net, "competitor");
    expect(report(built)).toEqual({
      version: REPORT_SCHEMA_VERSION,
      status: "not-read",
      url: "https://rival.example/path",
      line: "read.notRead.competitor",
    });
    expect(net.resolved).toEqual([]);
    expect(net.requests).toEqual([]);
  });
});

describe("reportOf, the url of a refused report", () => {
  const refuse = (given: string) => {
    const outcome: ReadResult = { status: "refused", reason: "read.refused.address" };
    return refusedOf(reportOf(given, outcome, null, CTX));
  };

  it.each([
    ["http://user:secret@example.test/", "http://example.test/"],
    ["http://user@example.test/a@b", "http://example.test/a@b"],
    ["http://:secret@example.test/", "http://example.test/"],
    ["https://a:b@c:d@example.test/", "https://example.test/"],
    ["ftp://user:secret@example.com/", "ftp://example.com/"],
    ["user:secret@example.test/", "example.test/"],
    ["https://user:secret@", "https://"],
    ["https://a:secret\\@example.test/", "https://example.test/"],
    ["https://javascript:alert(1)", "https://javascript:alert(1)"],
  ])("drops the userinfo of %s", (given, shown) => {
    const r = refuse(given);
    expect(r.url).toBe(shown);
    expect(r.urlCut).toBe(false);
    expect(r.url).not.toContain("secret");
  });

  // Forms the URL parser reads as userinfo where the textual authority pattern finds none (F1 of
  // ORV-266-review-1): the parser's own username and password decide.
  it.each([
    ["extra slashes (three)", "https:///user:secret@example.com/", "https://example.com/"],
    ["extra slashes (four)", "https:////user:secret@example.com/x", "https://example.com/x"],
    ["one slash", "https:/user:secret@example.com/", "https://example.com/"],
    ["a backslash after the slash", "https:/\\user:secret@example.com/", "https://example.com/"],
    ["two backslashes", "https:\\\\user:secret@example.com/", "https://example.com/"],
    ["a newline inside the scheme", "ht\ntps://user:secret@example.com/", "https://example.com/"],
    ["a tab inside the scheme", "ht\ttps://user:secret@example.com/", "https://example.com/"],
    ["an upper-case scheme", "HTTPS:///user:secret@example.com/", "https://example.com/"],
    ["a mixed-case scheme and host", "HtTp://USER:secret@Example.com", "http://example.com/"],
    ["ftp, extra slashes", "ftp:///user:secret@example.com/", "ftp://example.com/"],
    ["a username without a password", "https:///user@example.com/", "https://example.com/"],
    ["a password without a username", "https:///:secret@example.com/", "https://example.com/"],
    [
      "text before the scheme that the textual cut drops",
      "a@https://u:secret@h.test/",
      "https://h.test/",
    ],
  ])("drops the userinfo the parser finds: %s", (_name, given, shown) => {
    const r = refuse(given);
    expect(r.url).toBe(shown);
    expect(r.urlCut).toBe(false);
    expect(JSON.stringify(r)).not.toContain("secret");
    expect(JSON.stringify(r)).not.toContain("user");
    const parsed = new URL(r.url);
    expect([parsed.username, parsed.password]).toEqual(["", ""]);
  });

  it("cuts at 2048 characters after the userinfo is gone, and says so", () => {
    const tail = "a".repeat(3000);
    const r = refuse(`https://user:secret@example.test/${tail}`);
    expect(r.url).toBe(
      `https://example.test/${"a".repeat(URL_MAX_CHARS - "https://example.test/".length)}`,
    );
    expect(r.url.length).toBe(URL_MAX_CHARS);
    expect(r.urlCut).toBe(true);
    // a userinfo that would not fit is dropped before the length is measured
    const exact = refuse(`https://user:secret@example.test/${"a".repeat(URL_MAX_CHARS - 21)}`);
    expect(exact.urlCut).toBe(false);
    expect(exact.url.length).toBe(URL_MAX_CHARS);
  });

  it("does not end on half a surrogate pair", () => {
    const r = refuse(`https://example.test/${"a".repeat(URL_MAX_CHARS - 22)}😀😀`);
    expect(r.urlCut).toBe(true);
    expect(r.url.length).toBe(URL_MAX_CHARS - 1);
    expect(r.url.endsWith("a")).toBe(true);
  });
});
