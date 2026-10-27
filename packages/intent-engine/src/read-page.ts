// The safe read of ORV-128 tech notes section 6. Pure: every I/O comes through ReadPorts.
// The lists below are closed constants; a range added later is a change `security` reviews.

import { URL_MAX_CHARS } from "./evidence";
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
  readonly port: string; // "" for the scheme's default port
  readonly username: string;
  readonly password: string;
}
declare class TextDecoder {
  decode(input: Uint8Array): string;
}

export type IncompleteReason = "page-incomplete";

export type ReadPorts = {
  /**
   * IP literals, server-only; answers within `budgetMs`, the time left of the 30 s. An empty array
   * and a rejection are both no answer; `readPage` catches the rejection and keeps none of its text.
   */
  resolve(host: string, budgetMs: number): Promise<string[]>;
  /**
   * A rejection is no answer, caught the same way. `truncated` is true only when the answer had
   * more than `maxBytes` bytes, so an answer of exactly `maxBytes` is whole.
   */
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

export type RobotsRule = {
  allow: boolean;
  /** Normalised by `robotsNormalise`; its length is its octets, all ASCII. */
  pattern: string;
  /** The normalised pattern ends with a written `$`. */
  anchored: boolean;
  /** The pattern split on each written `*`; a `%2A` or `%24` stays as written, a literal for `matchAt`. */
  parts: string[];
};
export type RobotsRules = { groups: { agents: string[]; rules: RobotsRule[] }[] };
/** One analysis owns one cache, so a copy never outlives the analysis (spec: at most 24 hours). */
export type RobotsCache = Map<string, RobotsRules>;

/** robots-match-1, Caps: a pattern longer than this after normalisation is ignored. */
export const ROBOTS_MAX_PATTERN = 1000;
/** robots-match-1, Caps: more Allow and Disallow lines than this is complete disallow. */
export const ROBOTS_MAX_RULES = 5000;
/** robots-match-1, Caps: more pattern characters than this, after normalisation, is complete disallow. */
export const ROBOTS_MAX_PATTERN_CHARS = 100_000;
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
  const [a = 0, second = 0, third = 0] = b;
  if (a === 0) return false; // 0/8
  if (a === 10) return false;
  if (a === 100 && second >= 64 && second <= 127) return false; // 100.64/10
  if (a === 127) return false;
  if (a === 169 && second === 254) return false; // link-local, includes 169.254.169.254
  if (a === 172 && second >= 16 && second <= 31) return false;
  if (a === 192 && second === 168) return false;
  if (a === 192 && second === 0 && third === 0) return false; // 192.0.0/24, IETF protocol assignments
  if (a === 198 && (second === 18 || second === 19)) return false; // 198.18/15, benchmarking
  if (a >= 224 && a <= 239) return false; // multicast
  if (a >= 240) return false; // 240/4, reserved, includes the broadcast address
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
  // `::` and `::1` are also caught by ::/96 below (0.0.0.0 and 0.0.0.1 lie in 0/8); the lines stay as the spec lists them.
  if (zeros(b, 0, 16)) return "refused"; // ::
  if (zeros(b, 0, 15) && b[15] === 1) return "refused"; // ::1
  if ((b0 & 0xfe) === 0xfc) return "refused"; // fc00::/7
  if (b0 === 0xfe && (b1 & 0xc0) === 0x80) return "refused"; // fe80::/10
  if (b0 === 0xfe && (b1 & 0xc0) === 0xc0) return "refused"; // fec0::/10, deprecated site-local
  if (b0 === 0xff) return "refused"; // ff00::/8
  if (b0 === 0x00 && b1 === 0x64 && b[2] === 0xff && b[3] === 0x9b && b[4] === 0 && b[5] === 1)
    return "refused"; // 64:ff9b:1::/48
  if (b0 === 0x20 && b1 === 0x01 && b[2] === 0 && b[3] === 0) return "refused"; // Teredo 2001::/32
  // Embedded IPv4, judged by the address it embeds.
  if (zeros(b, 0, 12)) return ipv4Public(b.slice(12)) ? "public" : "refused"; // ::/96
  if (zeros(b, 0, 10) && b[10] === 0xff && b[11] === 0xff)
    return ipv4Public(b.slice(12)) ? "public" : "refused"; // ::ffff:0:0/96
  if (zeros(b, 0, 8) && b[8] === 0xff && b[9] === 0xff && b[10] === 0 && b[11] === 0)
    return ipv4Public(b.slice(12)) ? "public" : "refused"; // ::ffff:0:0:0/96
  if (b0 === 0x00 && b1 === 0x64 && b[2] === 0xff && b[3] === 0x9b && zeros(b, 4, 12))
    return ipv4Public(b.slice(12)) ? "public" : "refused"; // 64:ff9b::/96
  if (b0 === 0x20 && b1 === 0x02) return ipv4Public(b.slice(2, 6)) ? "public" : "refused"; // 6to4
  return "public";
}

// ---------- robots.txt ----------

/** robots-token-1: the leading run of letters, digits, underscore and hyphen, lower-cased; `*` names the `*` group. */
function productToken(value: string): string {
  if (value === "*") return "*";
  return (/^[A-Za-z0-9_-]*/.exec(value)?.[0] ?? "").toLowerCase();
}

/** Complete disallow, failing closed: one `*` group holding `Disallow: /`. */
const DISALLOW_ALL: RobotsRules = {
  groups: [
    { agents: ["*"], rules: [{ allow: false, pattern: "/", anchored: false, parts: ["/"] }] },
  ],
};

/**
 * robots-match-1, Normalisation (RFC 9309 section 2.2.2), for the path and for each pattern: each
 * run of characters outside ASCII becomes the upper-case percent-encoding of its UTF-8; then each
 * `%` and two hex digits becomes the character when that octet is unreserved (a letter, a digit,
 * hyphen, period, underscore or tilde), and is otherwise written with upper-case hex digits. A `%`
 * not followed by two hex digits stays. Each step is one left-to-right pass.
 */
export function robotsNormalise(s: string): string {
  return s
    .replace(/[\u0080-\uffff]+/g, (run) => encodeURIComponent(run))
    .replace(/%([0-9A-Fa-f]{2})/g, (_m, hex: string) => {
      const c = String.fromCharCode(parseInt(hex, 16));
      return /[A-Za-z0-9._~-]/.test(c) ? c : `%${hex.toUpperCase()}`;
    });
}

function compileRule(allow: boolean, pattern: string): RobotsRule {
  const anchored = pattern.endsWith("$");
  return {
    allow,
    pattern,
    anchored,
    parts: (anchored ? pattern.slice(0, -1) : pattern).split("*"),
  };
}

/**
 * Per line after the comment is cut: an `allow` or `disallow` line first adds 1 to the rule count,
 * in a group or not and empty or not, and past ROBOTS_MAX_RULES the whole file is complete disallow;
 * its value is normalised and its length added to the pattern characters, and past
 * ROBOTS_MAX_PATTERN_CHARS the whole file is complete disallow; then a pattern longer than
 * ROBOTS_MAX_PATTERN is ignored and an empty one allows everything, so neither is kept.
 */
export function parseRobots(text: string): RobotsRules {
  const groups: RobotsRules["groups"] = [];
  let current: RobotsRules["groups"][number] | null = null;
  let lastWasAgent = false;
  let ruleCount = 0;
  let patternChars = 0;
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
      current.agents.push(productToken(value));
      lastWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      lastWasAgent = false;
      ruleCount++;
      if (ruleCount > ROBOTS_MAX_RULES) return DISALLOW_ALL;
      const pattern = robotsNormalise(value);
      patternChars += pattern.length;
      if (patternChars > ROBOTS_MAX_PATTERN_CHARS) return DISALLOW_ALL;
      if (!current || pattern === "" || pattern.length > ROBOTS_MAX_PATTERN) continue;
      current.rules.push(compileRule(field === "allow", pattern));
    } else {
      lastWasAgent = false;
    }
  }
  return { groups };
}

const PERCENT = 37;

/**
 * The end of the match of `part` in `path` that starts at `at`, or -1. A `%2A` or `%24` in the part
 * takes a written `*` or `$` in the path (1 character) or the same three characters (3); any other
 * character of the part takes the same character. The path's character decides which, so the match
 * at one start is unique and costs at most the part's length. Loops over char codes, not `indexOf`.
 */
function matchAt(path: string, part: string, at: number): number {
  let j = at;
  for (let i = 0; i < part.length;) {
    const c = part.charCodeAt(i);
    if (
      c === PERCENT &&
      part.charCodeAt(i + 1) === 50 &&
      (part.charCodeAt(i + 2) === 65 || part.charCodeAt(i + 2) === 52)
    ) {
      const literal = part.charCodeAt(i + 2) === 65 ? 42 : 36; // `*` for %2A, `$` for %24
      if (path.charCodeAt(j) === literal) j += 1;
      else if (
        path.charCodeAt(j) === PERCENT &&
        path.charCodeAt(j + 1) === 50 &&
        path.charCodeAt(j + 2) === part.charCodeAt(i + 2)
      )
        j += 3;
      else return -1;
      i += 3;
    } else {
      if (path.charCodeAt(j) !== c) return -1;
      i++;
      j++;
    }
  }
  return j;
}

/**
 * The end of the first match of `part` that starts at or after `from`, or -1. The first match also
 * ends soonest, which is the one to keep: every later part may start anywhere at or after it.
 */
function findFrom(path: string, part: string, from: number): number {
  for (let start = from; start <= path.length; start++) {
    const end = matchAt(path, part, start);
    if (end >= 0) return end;
  }
  return -1;
}

/** Whether `part` has a match from `from` on that ends the path: only the starts that could end it are tried. */
function endsPath(path: string, part: string, from: number): boolean {
  let literals = 0;
  for (let i = 0; i < part.length; i++) {
    const t = part.slice(i, i + 3);
    if (t === "%2A" || t === "%24") {
      literals++;
      i += 2;
    }
  }
  // the match spans between part.length - 2 * literals and part.length characters of the path
  const last = path.length - (part.length - 2 * literals);
  for (let start = Math.max(from, path.length - part.length); start <= last; start++) {
    if (matchAt(path, part, start) === path.length) return true;
  }
  return false;
}

/**
 * robots-match-1, Matching: no regular expression, in at most path length times pattern length
 * steps. The first part must match at the path's start; each later part is found at or after the
 * end of the one before; an anchored pattern's last part must end the path.
 */
function patternMatches(rule: RobotsRule, path: string): boolean {
  const { parts, anchored } = rule;
  let at = matchAt(path, parts[0] ?? "", 0);
  if (at < 0) return false;
  if (parts.length === 1) return !anchored || at === path.length;
  for (const part of parts.slice(1, -1)) {
    at = findFrom(path, part, at);
    if (at < 0) return false;
  }
  const last = parts[parts.length - 1] ?? "";
  return anchored ? endsPath(path, last, at) : findFrom(path, last, at) >= 0;
}

/**
 * robots-group-1: when any group names the token, the groups naming it apply, combined, and `*` does
 * not; `*` applies only when none does. robots-match-1: the path is normalised once; of the rules
 * that match it, the most specific is the one whose normalised pattern has the most octets (all
 * ASCII, so its length), and an allow wins a tie. No match allows.
 */
export function robotsAllows(rules: RobotsRules, path: string, token: "oriviloreader"): boolean {
  const normalised = robotsNormalise(path);
  const named = rules.groups.filter((g) => g.agents.includes(token));
  const applying = named.length > 0 ? named : rules.groups.filter((g) => g.agents.includes("*"));
  let best: { allow: boolean; length: number } | null = null;
  for (const g of applying) {
    for (const r of g.rules) {
      if (!patternMatches(r, normalised)) continue;
      const length = r.pattern.length;
      if (!best || length > best.length || (length === best.length && r.allow)) {
        best = { allow: r.allow, length };
      }
    }
  }
  return best ? best.allow : true;
}

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

type Refusal = { kind: "refused"; reason: "read.refused.address" | "read.refused.robots" };
type Failure = {
  kind: "failed";
  reason: "timeout" | "network" | "redirects" | "not-html" | "status";
};
type Outcome =
  | { kind: "ok"; url: string; body: Uint8Array; truncated: boolean; contentType: string }
  | Refusal
  | Failure;
/** The answer a redirect chain ended on, status and all. */
type Walked =
  | {
      kind: "ok";
      url: string;
      status: number;
      headers: Record<string, string>;
      body: Uint8Array;
      truncated: boolean;
    }
  | Refusal
  | Failure;

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];
const ADDRESS_REFUSED: Refusal = { kind: "refused", reason: "read.refused.address" };

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

/**
 * The URL the Address check lets through, checked in this order and all before any lookup: http or
 * https, the scheme's default port, no credentials, and a whole `href` (as the WHATWG URL writes it)
 * of at most URL_MAX_CHARS characters, the bound of `source.ref`.
 */
function allowedUrl(target: string): URL | null {
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.port !== "") return null; // a default port is written as ""; any other is refused
  if (u.username !== "" || u.password !== "") return null;
  if (u.href.length > URL_MAX_CHARS) return null;
  return u;
}

export async function readPage(
  url: string,
  ports: ReadPorts,
  robots: RobotsCache = new Map(),
): Promise<ReadResult> {
  const headers = { "user-agent": USER_AGENT, accept: "text/html,text/css;q=0.9" };

  /** A port that gave no answer: `timeout` once the 30 s are spent, else `network`. */
  const noAnswer = (): "timeout" | "network" =>
    ports.elapsedMs() >= TOTAL_BUDGET_MS ? "timeout" : "network";

  async function send(target: string, address: string, maxBytes: number): Promise<Sent> {
    const remaining = TOTAL_BUDGET_MS - ports.elapsedMs();
    if (remaining <= 0) return { kind: "failed", reason: "timeout" };
    let r: Awaited<ReturnType<ReadPorts["request"]>>;
    try {
      r = await ports.request({
        url: target,
        address,
        headers: { ...headers },
        maxBytes,
        timeoutMs: Math.min(REQUEST_TIMEOUT_MS, remaining),
      });
    } catch {
      // A rejection is no answer; the error is not bound, so none of its text can reach the result.
      return { kind: "failed", reason: noAnswer() };
    }
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
  async function addressOf(u: URL): Promise<string | "refused" | "network" | "timeout"> {
    let addresses: string[];
    if (isIpLiteral(u.hostname)) {
      addresses = [stripBrackets(u.hostname)];
    } else {
      const remaining = TOTAL_BUDGET_MS - ports.elapsedMs();
      if (remaining <= 0) return "timeout";
      try {
        addresses = await ports.resolve(u.hostname, remaining);
      } catch {
        return noAnswer(); // as in `send`: a rejection is no answer and none of its text is kept
      }
    }
    if (addresses.some((a) => checkAddress(a) !== "public")) return "refused";
    return addresses[0] ?? noAnswer();
  }

  /**
   * Follows a chain of at most MAX_REDIRECTS redirects. Every hop runs the Address check: the URL,
   * the host's addresses and the address connected to. `gate` runs on each hop after the Address
   * check and before the request (the robots.txt check of a page or a stylesheet).
   */
  async function walk(
    start: string,
    maxBytes: number,
    gate?: (u: URL) => Promise<Refusal | Failure | null>,
  ): Promise<Walked> {
    let current = start;
    for (let hop = 0; ; hop++) {
      const u = allowedUrl(current);
      if (!u) return ADDRESS_REFUSED;
      if (ports.elapsedMs() >= TOTAL_BUDGET_MS) return { kind: "failed", reason: "timeout" };
      const address = await addressOf(u);
      if (address === "refused") return ADDRESS_REFUSED;
      if (address === "network" || address === "timeout") {
        return { kind: "failed", reason: address };
      }
      const stopped = gate ? await gate(u) : null;
      if (stopped) return stopped;
      const r = await send(u.href, address, maxBytes);
      if (r.kind === "refused") return ADDRESS_REFUSED;
      if (r.kind === "failed") return r;
      const location = r.headers["location"];
      if (REDIRECT_STATUSES.includes(r.status) && location !== undefined) {
        if (hop >= MAX_REDIRECTS) return { kind: "failed", reason: "redirects" };
        try {
          current = new URL(location, u).href;
        } catch {
          return ADDRESS_REFUSED;
        }
        continue;
      }
      return { ...r, url: u.href };
    }
  }

  /**
   * The rules of an origin, for the submitted URL's origin whatever host the redirects land on (R3).
   * A refusal or `redirects` is returned as is; any other failure is complete disallow; a 2xx
   * longer than ROBOTS_MAX_BYTES is complete disallow, unparsed; any other 2xx is parsed; a 4xx is no
   * rules; anything else, a 3xx with no `Location` and a 5xx among them, is complete disallow.
   */
  async function robotsOf(u: URL): Promise<RobotsRules | Refusal | Failure> {
    const cached = robots.get(u.origin);
    if (cached) return cached;
    const r = await walk(`${u.origin}/robots.txt`, ROBOTS_MAX_BYTES);
    if (r.kind === "refused" || (r.kind === "failed" && r.reason === "redirects")) return r;
    let rules = DISALLOW_ALL;
    if (r.kind === "ok") {
      if (r.status >= 200 && r.status < 300) {
        if (!r.truncated) rules = parseRobots(new TextDecoder().decode(r.body));
      } else if (r.status >= 400 && r.status < 500) {
        rules = { groups: [] }; // 4xx: no rules
      }
    }
    robots.set(u.origin, rules);
    return rules;
  }

  async function fetchOne(start: string, maxBytes: number): Promise<Outcome> {
    const r = await walk(start, maxBytes, async (u) => {
      const rules = await robotsOf(u);
      if ("kind" in rules) return rules;
      return robotsAllows(rules, u.pathname + u.search, READER_TOKEN)
        ? null
        : { kind: "refused", reason: "read.refused.robots" };
    });
    if (r.kind !== "ok") return r;
    if (r.status < 200 || r.status >= 300) return { kind: "failed", reason: "status" };
    return {
      kind: "ok",
      url: r.url,
      body: r.body,
      truncated: r.truncated,
      contentType: r.headers["content-type"] ?? "",
    };
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
  const links = stylesheetLinksOf(doc.body);
  if (links.incomplete) incomplete = true; // an element below the depth bound was not looked at
  const hrefs: string[] = [];
  for (const href of links.hrefs) {
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
