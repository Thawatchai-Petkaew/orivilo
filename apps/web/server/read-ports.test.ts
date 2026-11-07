import http from "node:http";
import https from "node:https";
import type { AddressInfo, Socket } from "node:net";
import { gzipSync } from "node:zlib";
import { readUrlInput, type ReadPorts } from "@orivilo/intent-engine";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { createReadPorts } = await import("./read-ports");

// ORV-266 tech notes section 3, tests P1 to P9. Every request goes to a server on loopback that
// this file starts; the host names below do not exist and never resolve.

// CI-sized (L-0046): the drip server would run 10 s, the port must stop it far sooner.
const SLOW = 20_000;
const TIMEOUT_BOUND_MS = 8_000;

let server: http.Server;
let port = 0;
const sockets = new Set<Socket>();
const seen: { path: string; encoding: string | undefined }[] = [];
const timers = new Set<ReturnType<typeof setInterval>>();

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://loopback.test");
    seen.push({
      path: url.pathname,
      encoding: req.headers["accept-encoding"] as string | undefined,
    });
    if (url.pathname === "/ok") {
      res.writeHead(200, {
        "content-type": "text/html",
        "X-Mixed": "Case",
        "set-cookie": ["a=1", "b=2"],
      });
      res.end("hello");
    } else if (url.pathname === "/redirect") {
      res.writeHead(302, { location: "/ok" });
      res.end();
    } else if (url.pathname === "/bytes") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("x".repeat(Number(url.searchParams.get("n"))));
    } else if (url.pathname === "/gzip") {
      res.writeHead(200, { "content-encoding": "gzip" });
      res.end(gzipSync("hello"));
    } else if (url.pathname === "/drip") {
      res.writeHead(200, { "content-type": "text/html" });
      const started = Date.now();
      const timer = setInterval(() => {
        res.write("x");
        if (Date.now() - started > 10_000) {
          clearInterval(timer);
          timers.delete(timer);
          res.end();
        }
      }, 20);
      timers.add(timer);
      res.on("close", () => {
        clearInterval(timer);
        timers.delete(timer);
      });
    } else {
      res.writeHead(404).end();
    }
  });
  server.on("connection", (s) => {
    sockets.add(s);
    s.on("close", () => sockets.delete(s));
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  for (const t of timers) clearInterval(t);
  for (const s of sockets) s.destroy();
  await new Promise<void>((done) => server.close(() => done()));
});

afterEach(() => vi.restoreAllMocks());

const base = (path: string, over: Partial<Parameters<ReadPorts["request"]>[0]> = {}) => ({
  url: `http://does-not-exist.invalid:${port}${path}`,
  address: "127.0.0.1",
  headers: { "user-agent": "test" },
  maxBytes: 1024,
  timeoutMs: 5_000,
  ...over,
});

const text = (b: Uint8Array) => new TextDecoder().decode(b);

describe("createReadPorts, the socket pinned to the checked address", () => {
  // P1. Break it: remove `lookup` from the options; the host name does not exist, so ENOTFOUND.
  it("P1 reaches the loopback server for a host that does not resolve, and reports that address", async () => {
    const answer = await createReadPorts().request(base("/ok"));
    expect(answer).toMatchObject({
      ok: true,
      status: 200,
      truncated: false,
      remoteAddress: "127.0.0.1",
    });
    if (!answer.ok) return;
    expect(text(answer.body)).toBe("hello");
    // lower-case keys, an array value joined by a comma and a space
    expect(answer.headers["x-mixed"]).toBe("Case");
    expect(answer.headers["set-cookie"]).toBe("a=1, b=2");
  });

  // P2. Break it: answer only the plain form (null, address, family).
  it("P2 lookup answers the all:true form and the plain form", async () => {
    const spy = vi.spyOn(http, "request");
    await createReadPorts().request(base("/ok"));
    const options = spy.mock.calls[0]?.[1] as http.RequestOptions;
    const lookup = options.lookup as unknown as (
      host: string,
      opts: object,
      cb: (...args: unknown[]) => void,
    ) => void;
    const all = vi.fn();
    lookup("whatever.invalid", { all: true }, all);
    expect(all).toHaveBeenCalledWith(null, [{ address: "127.0.0.1", family: 4 }]);
    const plain = vi.fn();
    lookup("whatever.invalid", {}, plain);
    expect(plain).toHaveBeenCalledWith(null, "127.0.0.1", 4);
    const six = vi.fn();
    const sixOptions = { ...base("/ok"), address: "::1" };
    spy.mockClear();
    await createReadPorts().request(sixOptions);
    const sixLookup = (spy.mock.calls[0]?.[1] as http.RequestOptions)
      .lookup as unknown as typeof lookup;
    sixLookup("whatever.invalid", { all: true }, six);
    expect(six).toHaveBeenCalledWith(null, [{ address: "::1", family: 6 }]);
  });

  // P3. Break it: follow `location` in the port.
  it("P3 hands a 302 back as an answer and the server counts one request", async () => {
    seen.length = 0;
    const answer = await createReadPorts().request(base("/redirect"));
    expect(answer).toMatchObject({ ok: true, status: 302 });
    if (answer.ok) expect(answer.headers["location"]).toBe("/ok");
    expect(seen.map((s) => s.path)).toEqual(["/redirect"]);
  });

  // P4. Break it: pass only the `timeout` option (an idle timer) and no wall clock.
  it(
    "P4 a body that drips past timeoutMs answers timeout inside a CI-sized bound",
    async () => {
      const t0 = Date.now();
      const answer = await createReadPorts().request(base("/drip", { timeoutMs: 300 }));
      expect(answer).toEqual({ ok: false, error: "timeout" });
      expect(Date.now() - t0).toBeLessThan(TIMEOUT_BOUND_MS);
    },
    SLOW,
  );

  // P5. Break it: stop at `>=` instead of `>`.
  it("P5 exactly maxBytes is whole; one byte more is truncated with maxBytes bytes", async () => {
    const ports = createReadPorts();
    const exact = await ports.request(base("/bytes?n=100", { maxBytes: 100 }));
    expect(exact).toMatchObject({ ok: true, truncated: false });
    if (exact.ok) expect(exact.body.length).toBe(100);
    const over = await ports.request(base("/bytes?n=101", { maxBytes: 100 }));
    expect(over).toMatchObject({ ok: true, truncated: true });
    if (over.ok) expect(over.body.length).toBe(100);
    const far = await ports.request(base("/bytes?n=50000", { maxBytes: 100 }));
    expect(far).toMatchObject({ ok: true, truncated: true });
    if (far.ok) expect(far.body.length).toBe(100);
  });

  // P6. Break it: pass the bytes through whatever the content-encoding.
  it("P6 asks for identity and answers network to a content-encoding of gzip", async () => {
    seen.length = 0;
    const ports = createReadPorts();
    expect(await ports.request(base("/gzip"))).toEqual({ ok: false, error: "network" });
    await ports.request(base("/ok"));
    expect(seen.every((s) => s.encoding === "identity")).toBe(true);
  });

  // P7. Break it: hoist the clock to module scope.
  it("P7 two ports made apart each start elapsedMs near 0", () => {
    const now = vi.spyOn(performance, "now");
    now.mockReturnValue(1_000);
    const first = createReadPorts();
    now.mockReturnValue(5_000);
    const second = createReadPorts();
    now.mockReturnValue(5_010);
    expect(first.elapsedMs()).toBe(4_010);
    expect(second.elapsedMs()).toBe(10);
  });

  // P8. Break it: drop the race against budgetMs.
  it("P8 resolve asks for IPv4 first and rejects at budgetMs on a lookup that never answers", async () => {
    const lookup = vi.fn(async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1::1", family: 6 },
    ]);
    const found = await createReadPorts({ lookup }).resolve("example.test", 1_000);
    expect(lookup).toHaveBeenCalledWith("example.test", { all: true, order: "ipv4first" });
    expect(found).toEqual(["93.184.216.34", "2606:2800:220:1::1"]);

    const never = createReadPorts({ lookup: () => new Promise(() => {}) });
    await expect(never.resolve("example.test", 50)).rejects.toThrow();
  });

  // P9. Break it: hard-code the remoteAddress the port returns.
  it("P9 an https request sets agent:false and never rejectUnauthorized", async () => {
    const spy = vi.spyOn(https, "request").mockImplementation(() => {
      throw new Error("stopped before any socket");
    });
    const answer = await createReadPorts().request({
      ...base("/ok"),
      url: "https://does-not-exist.invalid/ok",
    });
    expect(answer).toEqual({ ok: false, error: "network" });
    expect(spy).toHaveBeenCalledTimes(1);
    const options = spy.mock.calls[0]?.[1] as https.RequestOptions;
    expect(options.agent).toBe(false);
    expect("rejectUnauthorized" in options).toBe(false);
  });

  it(
    "P9 through readUrlInput the real remoteAddress of a moved socket is refused",
    async () => {
      // The engine checks a public address; the wrapper moves the socket to loopback. Only the
      // remoteAddress read from the socket can show that.
      const real = createReadPorts({
        lookup: async () => [{ address: "93.184.216.34", family: 4 }],
      });
      const moved: ReadPorts = {
        ...real,
        request: (r) =>
          real.request({
            ...r,
            url: `http://does-not-exist.invalid:${port}/ok`,
            address: "127.0.0.1",
          }),
      };
      const result = await readUrlInput({ url: "http://example.test/", role: "own" }, moved);
      expect(result).toEqual({ status: "refused", reason: "read.refused.address" });
    },
    SLOW,
  );
});
