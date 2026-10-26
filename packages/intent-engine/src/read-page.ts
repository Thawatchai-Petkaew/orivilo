// The safe read of ORV-128 tech notes section 6. Pure: every I/O comes through ReadPorts.
// The lists below are closed constants; a range added later is a change `security` reviews.

import { stylesheetLinksOf } from "./page-text";

// The engine's tsconfig has no DOM or Node lib, so the three web-standard globals this file uses
// are declared here, module-scoped, with only the members it reads. They exist in every runtime the engine runs in.
declare class URL {
  constructor(input: string, base?: string | URL);
  readonly href: string;
  readonly protocol: string;
  readonly hostname: string;
  readonly origin: string;
  readonly pathname: string;
  readonly search: string;
}
declare class TextDecoder {
  decode(input: Uint8Array): string;
}

export type IncompleteReason = "page-incomplete";

export type ReadPorts = {
  resolve(host: string): Promise<string[]>; // IP literals, server-only
  request(r: {
    url: string;
    address: string;
    headers: Record<string, string>;
    maxBytes: number;
    timeoutMs: number;
  }): Promise<
    | {
        ok: true;
        status: number;
        headers: Record<string, string>;
        body: Uint8Array;
        truncated: boolean;
        remoteAddress: string;
      }
    | { ok: false; error: "timeout" | "network" }
  >;
  sha256(bytes: Uint8Array): string; // lowercase hex
  elapsedMs(): number; // monotonic, for the 30 s budget
};

export type Fetched = { url: string; bytes: Uint8Array; contentHash: string; truncated: boolean };

export type ReadResult =
  | {
      status: "read";
      url: string;
      document: Fetched;
      stylesheets: Fetched[];
      incomplete: IncompleteReason[];
    }
  | { status: "refused"; reason: "read.refused.address" | "read.refused.robots" }
  | { status: "failed"; reason: "timeout" | "network" | "redirects" | "not-html" };

export type RobotsRules = {
  groups: { agents: string[]; rules: { allow: boolean; pattern: string }[] }[];
};
/** One analysis owns one cache, so a copy never outlives the analysis (spec: at most 24 hours). */
export type RobotsCache = Map<string, RobotsRules>;

export const READER_TOKEN = "oriviloreader";
export const CONTACT_URL = "https://github.com/Thawatchai-Petkaew/orivilo";
export const USER_AGENT = `OriviloReader/1 (+${CONTACT_URL})`;
export const DOCUMENT_MAX_BYTES = 2 * 1024 * 1024;
export const STYLESHEET_MAX_BYTES = 1024 * 1024;
export const ROBOTS_MAX_BYTES = 500 * 1024;
export const MAX_STYLESHEETS = 10;
export const MAX_REDIRECTS = 3;
export const REQUEST_TIMEOUT_MS = 10_000;
export const TOTAL_BUDGET_MS = 30_000;

// ---------- Address check ----------

function parseIPv4(s: string): number[] | null {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  const out: number[] = [];
  for (const p of parts) {
    if (!/^(0|[1-9][0-9]{0,2})$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out.push(n);
  }
  return out;
}

function parseIPv6(s: string): number[] | null {
  if (s.includes("%")) return null; // zone id
  let tail: number[] = [];
  let text = s;
  const lastColon = text.lastIndexOf(":");
  if (lastColon >= 0 && text.slice(lastColon + 1).includes(".")) {
    const v4 = parseIPv4(text.slice(lastColon + 1));
    if (!v4) return null;
    tail = v4;
    text = `${text.slice(0, lastColon + 1)}0:0`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null; // the 8 group count below does not catch "1:2:3:4:5:6:7:8::::"
  const groupsOf = (h: string): number[] | null => {
    if (h === "") return [];
    const out: number[] = [];
    for (const g of h.split(":")) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
      out.push(parseInt(g, 16));
    }
    return out;
  };
  const head = groupsOf(halves[0] ?? "");
  const rest = halves.length === 2 ? groupsOf(halves[1] ?? "") : [];
  if (!head || !rest) return null;
  let words: number[];
  if (halves.length === 2) {
    const fill = 8 - head.length - rest.length;
    if (fill < 1) return null;
    words = [...head, ...new Array<number>(fill).fill(0), ...rest];
  } else {
    words = head;
  }
  if (words.length !== 8) return null;
  const bytes: number[] = [];
  for (const w of words) bytes.push(w >> 8, w & 0xff);
  if (tail.length === 4) bytes.splice(12, 4, ...tail);
  return bytes;
}

function ipv4Public(b: number[]): boolean {
  const [a = 0, c = 0, d = 0] = b;
  if (a === 0) return false; // 0/8
  if (a === 10) return false;
  if (a === 100 && c >= 64 && c <= 127) return false; // 100.64/10
  if (a === 127) return false;
  if (a === 169 && c === 254) return false; // link-local, includes 169.254.169.254
  if (a === 172 && c >= 16 && c <= 31) return false;
  if (a === 192 && c === 168) return false;
  if (a >= 224 && a <= 239) return false; // multicast
  if (b.every((x) => x === 255)) return false; // broadcast
  void d;
  return true;
}

const zeros = (b: number[], from: number, to: number) => b.slice(from, to).every((x) => x === 0);

export function checkAddress(ip: string): "public" | "refused" {
  const v4 = parseIPv4(ip);
  if (v4) return ipv4Public(v4) ? "public" : "refused";
  const b = parseIPv6(ip);
  if (!b) return "refused";
  const [b0 = 0, b1 = 0] = b;
  // Refused outright.
  if (zeros(b, 0, 16)) return "refused"; // ::
  if (zeros(b, 0, 15) && b[15] === 1) return "refused"; // ::1
  if ((b0 & 0xfe) === 0xfc) return "refused"; // fc00::/7
  if (b0 === 0xfe && (b1 & 0xc0) === 0x80) return "refused"; // fe80::/10
  if (b0 === 0xff) return "refused"; // ff00::/8
  if (b0 === 0x00 && b1 === 0x64 && b[2] === 0xff && b[3] === 0x9b && b[4] === 0 && b[5] === 1)
    return "refused"; // 64:ff9b:1::/48
  if (b0 === 0x20 && b1 === 0x01 && b[2] === 0 && b[3] === 0) return "refused"; // Teredo 2001::/32
  // Embedded IPv4, judged by the address it embeds.
  if (zeros(b, 0, 12)) return ipv4Public(b.slice(12)) ? "public" : "refused"; // ::/96
  if (zeros(b, 0, 10) && b[10] === 0xff && b[11] === 0xff)
    return ipv4Public(b.slice(12)) ? "public" : "refused"; // ::ffff:0:0/96
  if (b0 === 0x00 && b1 === 0x64 && b[2] === 0xff && b[3] === 0x9b && zeros(b, 4, 12))
    return ipv4Public(b.slice(12)) ? "public" : "refused"; // 64:ff9b::/96
  if (b0 === 0x20 && b1 === 0x02) return ipv4Public(b.slice(2, 6)) ? "public" : "refused"; // 6to4
  return "public";
}

// ---------- robots.txt ----------

export function parseRobots(text: string): RobotsRules {
  const groups: RobotsRules["groups"] = [];
  let current: RobotsRules["groups"][number] | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = (raw.includes("#") ? raw.slice(0, raw.indexOf("#")) : raw).trim();
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      lastWasAgent = false;
      if (!current || value === "") continue; // an empty Disallow allows everything
      current.rules.push({ allow: field === "allow", pattern: value });
    } else {
      lastWasAgent = false;
    }
  }
  return { groups };
}

function patternMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .split("*")
    .map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`).test(path);
}

/** Rules of the group for the token and those of `*` both apply; the longest match wins, Allow on a tie. */
export function robotsAllows(rules: RobotsRules, path: string, token: "oriviloreader"): boolean {
  let best: { allow: boolean; length: number } | null = null;
  for (const g of rules.groups) {
    if (!g.agents.includes(token) && !g.agents.includes("*")) continue;
    for (const r of g.rules) {
      if (!patternMatches(r.pattern, path)) continue;
      const length = r.pattern.length;
      if (!best || length > best.length || (length === best.length && r.allow)) {
        best = { allow: r.allow, length };
      }
    }
  }
  return best ? best.allow : true;
}

const DISALLOW_ALL = parseRobots("User-agent: *\nDisallow: /");

// ---------- The read ----------

type Sent =
  | {
      kind: "ok";
      status: number;
      headers: Record<string, string>;
      body: Uint8Array;
      truncated: boolean;
    }
  | { kind: "refused" }
  | { kind: "failed"; reason: "timeout" | "network" };

type Outcome =
  | { kind: "ok"; url: string; body: Uint8Array; truncated: boolean; contentType: string }
  | { kind: "refused"; reason: "read.refused.address" | "read.refused.robots" }
  | { kind: "failed"; reason: "timeout" | "network" | "redirects" | "not-html" | "status" };

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

function stripBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

function isIpLiteral(host: string): boolean {
  return host.startsWith("[") || /^[0-9]+(\.[0-9]+){3}$/.test(host);
}

function lowerKeys(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) out[k.toLowerCase()] = v;
  return out;
}

export async function readPage(
  url: string,
  ports: ReadPorts,
  robots: RobotsCache = new Map(),
): Promise<ReadResult> {
  const headers = { "user-agent": USER_AGENT, accept: "text/html,text/css;q=0.9" };

  async function send(target: string, address: string, maxBytes: number): Promise<Sent> {
    const remaining = TOTAL_BUDGET_MS - ports.elapsedMs();
    if (remaining <= 0) return { kind: "failed", reason: "timeout" };
    const r = await ports.request({
      url: target,
      address,
      headers: { ...headers },
      maxBytes,
      timeoutMs: Math.min(REQUEST_TIMEOUT_MS, remaining),
    });
    if (!r.ok) return { kind: "failed", reason: r.error };
    if (checkAddress(stripBrackets(r.remoteAddress)) !== "public") return { kind: "refused" };
    const cut = r.body.length > maxBytes;
    return {
      kind: "ok",
      status: r.status,
      headers: lowerKeys(r.headers),
      body: cut ? r.body.slice(0, maxBytes) : r.body,
      truncated: r.truncated || cut,
    };
  }

  /** Every address of the host must be public; returns the one the request will connect to. */
  async function addressOf(u: URL): Promise<string | "refused" | "network"> {
    const addresses = isIpLiteral(u.hostname)
      ? [stripBrackets(u.hostname)]
      : await ports.resolve(u.hostname);
    if (addresses.some((a) => checkAddress(a) !== "public")) return "refused";
    return addresses[0] ?? "network";
  }

  async function robotsOf(u: URL, address: string): Promise<RobotsRules | "refused"> {
    const cached = robots.get(u.origin);
    if (cached) return cached;
    const r = await send(`${u.origin}/robots.txt`, address, ROBOTS_MAX_BYTES);
    if (r.kind === "refused") return "refused";
    let rules = DISALLOW_ALL; // 5xx, a redirect or no answer: complete disallow
    if (r.kind === "ok") {
      if (r.status >= 200 && r.status < 300) rules = parseRobots(new TextDecoder().decode(r.body));
      else if (r.status >= 400 && r.status < 500) rules = parseRobots(""); // 4xx: no rules
    }
    robots.set(u.origin, rules);
    return rules;
  }

  async function fetchOne(start: string, maxBytes: number): Promise<Outcome> {
    let current = start;
    for (let hop = 0; ; hop++) {
      let u: URL;
      try {
        u = new URL(current);
      } catch {
        return { kind: "refused", reason: "read.refused.address" };
      }
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { kind: "refused", reason: "read.refused.address" };
      }
      if (ports.elapsedMs() >= TOTAL_BUDGET_MS) return { kind: "failed", reason: "timeout" };
      const address = await addressOf(u);
      if (address === "refused") return { kind: "refused", reason: "read.refused.address" };
      if (address === "network") return { kind: "failed", reason: "network" };
      const rules = await robotsOf(u, address);
      if (rules === "refused") return { kind: "refused", reason: "read.refused.address" };
      if (!robotsAllows(rules, u.pathname + u.search, READER_TOKEN)) {
        return { kind: "refused", reason: "read.refused.robots" };
      }
      const r = await send(u.href, address, maxBytes);
      if (r.kind === "refused") return { kind: "refused", reason: "read.refused.address" };
      if (r.kind === "failed") return r;
      const location = r.headers["location"];
      if (REDIRECT_STATUSES.includes(r.status) && location !== undefined) {
        if (hop >= MAX_REDIRECTS) return { kind: "failed", reason: "redirects" };
        try {
          current = new URL(location, u).href;
        } catch {
          return { kind: "refused", reason: "read.refused.address" };
        }
        continue;
      }
      if (r.status < 200 || r.status >= 300) return { kind: "failed", reason: "status" };
      return {
        kind: "ok",
        url: u.href,
        body: r.body,
        truncated: r.truncated,
        contentType: r.headers["content-type"] ?? "",
      };
    }
  }

  const fetched = (o: Extract<Outcome, { kind: "ok" }>): Fetched => ({
    url: o.url,
    bytes: o.body,
    contentHash: ports.sha256(o.body),
    truncated: o.truncated,
  });

  const doc = await fetchOne(url, DOCUMENT_MAX_BYTES);
  if (doc.kind === "refused") return { status: "refused", reason: doc.reason };
  if (doc.kind === "failed")
    return { status: "failed", reason: doc.reason === "status" ? "network" : doc.reason };
  const type = doc.contentType.toLowerCase();
  if (type !== "" && !type.includes("text/html") && !type.includes("application/xhtml+xml")) {
    return { status: "failed", reason: "not-html" };
  }

  let incomplete = doc.truncated;
  const hrefs: string[] = [];
  for (const href of stylesheetLinksOf(doc.body)) {
    try {
      const u = new URL(href, doc.url);
      if ((u.protocol === "http:" || u.protocol === "https:") && !hrefs.includes(u.href))
        hrefs.push(u.href);
    } catch {
      // an href that is not a URL is not a stylesheet
    }
  }
  if (hrefs.length > MAX_STYLESHEETS) incomplete = true;

  const stylesheets: Fetched[] = [];
  for (const href of hrefs.slice(0, MAX_STYLESHEETS)) {
    const s = await fetchOne(href, STYLESHEET_MAX_BYTES);
    if (s.kind === "refused" && s.reason === "read.refused.address") {
      return { status: "refused", reason: s.reason }; // one non-public address refuses the whole read
    }
    if (s.kind !== "ok") {
      incomplete = true; // robots, a failed answer or the budget: this sheet is not part of the read
      continue;
    }
    if (s.truncated) incomplete = true;
    stylesheets.push(fetched(s));
  }

  return {
    status: "read",
    url: doc.url,
    document: fetched(doc),
    stylesheets,
    incomplete: incomplete ? ["page-incomplete"] : [],
  };
}
