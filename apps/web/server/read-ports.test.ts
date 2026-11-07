import { execFileSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import net, { isIP, type AddressInfo, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import tls from "node:tls";
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
let tlsServer: https.Server;
let tlsPort = 0;
let silent: net.Server;
let silentPort = 0;
const sockets = new Set<Socket>();
const seen: {
  path: string;
  encoding: string | undefined;
  headers: http.IncomingHttpHeaders;
}[] = [];
const timers = new Set<ReturnType<typeof setInterval>>();
const servernames: (string | false | null | undefined)[] = [];
let endlessClosed = false;

// The one certificate of the TLS server, made at run time: no key is committed (pnpm scan:secrets),
// no dependency is added. It is self-signed for `other.test`, which also makes it the trust anchor
// the tests hand to the client. The tool is `openssl`, which the Mac and the CI runner both have.
const CERT_NAME = "other.test";
function makeCertificate(name: string): { key: string; cert: string } {
  const dir = mkdtempSync(join(tmpdir(), "orv-tls-"));
  try {
    execFileSync(
      "openssl",
      [
        ...["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "2"],
        ...["-keyout", join(dir, "key.pem"), "-out", join(dir, "cert.pem")],
        ...["-subj", `/CN=${name}`, "-addext", `subjectAltName=DNS:${name}`],
      ],
      { stdio: "ignore" },
    );
    return {
      key: readFileSync(join(dir, "key.pem"), "utf8"),
      cert: readFileSync(join(dir, "cert.pem"), "utf8"),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const credentials = makeCertificate(CERT_NAME);

function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", "http://loopback.test");
  seen.push({
    path: url.pathname,
    encoding: req.headers["accept-encoding"] as string | undefined,
    headers: req.headers,
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
  } else if (url.pathname === "/endless") {
    // 1 KB every 5 ms until the client lets go; `endlessClosed` is the server seeing that.
    res.writeHead(200, { "content-type": "text/html" });
    const timer = setInterval(() => res.write("x".repeat(1024)), 5);
    timers.add(timer);
    res.on("close", () => {
      clearInterval(timer);
      timers.delete(timer);
      endlessClosed = true;
    });
  } else if (url.pathname === "/cut") {
    // Says 100 bytes, sends 10, and drops the connection.
    res.writeHead(200, { "content-type": "text/html", "content-length": "100" });
    res.write("x".repeat(10), () => res.socket?.destroy());
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
}

const track = (s: Socket) => {
  sockets.add(s);
  s.on("close", () => sockets.delete(s));
};

beforeAll(async () => {
  server = http.createServer(handle);
  server.on("connection", track);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  port = (server.address() as AddressInfo).port;

  tlsServer = https.createServer(credentials, handle);
  tlsServer.on("connection", track);
  tlsServer.on("secureConnection", (s) => servernames.push(s.servername));
  await new Promise<void>((done) => tlsServer.listen(0, "127.0.0.1", done));
  tlsPort = (tlsServer.address() as AddressInfo).port;

  // Accepts and never writes: no header, no byte.
  silent = net.createServer(track);
  await new Promise<void>((done) => silent.listen(0, "127.0.0.1", done));
  silentPort = (silent.address() as AddressInfo).port;
});

afterAll(async () => {
  for (const t of timers) clearInterval(t);
  for (const s of sockets) s.destroy();
  for (const s of [server, tlsServer, silent]) {
    await new Promise<void>((done) => s.close(() => done()));
  }
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

// The clauses of tech notes section 3 that the first round left without a test (F2 to F5 of
// ORV-266-review-1). Each comment names the change that must turn its test red.
describe("createReadPorts, TLS, headers, the wall clock and the guards", () => {
  // The test client trusts the server's own certificate: the request goes through the real port with
  // one change, a `ca` in its options. The port's name check is left as it is.
  const trustTheServerCertificate = () => {
    const real = https.request;
    vi.spyOn(https, "request").mockImplementation(((
      url: string | URL,
      options: https.RequestOptions,
      cb: (res: http.IncomingMessage) => void,
    ) => real(url, { ...options, ca: credentials.cert }, cb)) as typeof https.request);
  };

  // F2. Break it: `checkServerIdentity: () => undefined` in the options, the pinned address as the
  // SNI name, or no `lookup` for https. The first makes the other-host case an answer; the other two
  // make the right-name case a failure.
  it("over TLS the pinned socket answers for the right certificate name and refuses another", async () => {
    trustTheServerCertificate();
    servernames.length = 0;
    const ports = createReadPorts();

    const right = await ports.request({
      ...base("/ok"),
      url: `https://${CERT_NAME}:${tlsPort}/ok`,
    });
    expect(right).toMatchObject({ ok: true, status: 200, remoteAddress: "127.0.0.1" });
    if (right.ok) expect(text(right.body)).toBe("hello");
    expect(servernames).toEqual([CERT_NAME]); // the host name is the SNI name, not the address

    // The same server, the same trusted certificate, a different name: only the name differs.
    const other = await ports.request({
      ...base("/ok"),
      url: `https://reader.test:${tlsPort}/ok`,
    });
    expect(other).toEqual({ ok: false, error: "network" });
    const code = await new Promise<string | undefined>((done) => {
      const socket = tls.connect(
        { host: "127.0.0.1", port: tlsPort, servername: "reader.test", ca: credentials.cert },
        () => {
          socket.destroy();
          done(undefined);
        },
      );
      socket.on("error", (e: NodeJS.ErrnoException) => done(e.code));
    });
    expect(code).toBe("ERR_TLS_CERT_ALTNAME_INVALID"); // it fails on the name, not on trust
  });

  // F3. Break it: add a `cookie` or an `authorization` header beside `accept-encoding`.
  it("sends no cookie and no authorization header", async () => {
    seen.length = 0;
    await createReadPorts().request(base("/ok"));
    const headers = seen[0]?.headers;
    expect(headers?.["user-agent"]).toBe("test"); // the record works
    expect(headers).not.toHaveProperty("cookie");
    expect(headers).not.toHaveProperty("authorization");
  });

  // F4. Break it: arm the wall clock only when the response callback runs.
  it(
    "a server that accepts and never answers ends as timeout inside a CI-sized bound",
    async () => {
      const t0 = Date.now();
      const answer = await createReadPorts().request({
        ...base("/ok"),
        url: `http://does-not-exist.invalid:${silentPort}/ok`,
        timeoutMs: 300,
      });
      expect(answer).toEqual({ ok: false, error: "timeout" });
      expect(Date.now() - t0).toBeLessThan(TIMEOUT_BOUND_MS);
    },
    SLOW,
  );

  // F5, tech notes section 3 "Size". Break it: leave out `res.destroy()` and `req.destroy()` after
  // the answer is cut at maxBytes. The server keeps sending and sees no close.
  it(
    "stops and closes the socket once the answer passes maxBytes",
    async () => {
      endlessClosed = false;
      const answer = await createReadPorts().request(base("/endless", { maxBytes: 100 }));
      expect(answer).toMatchObject({ ok: true, truncated: true });
      if (answer.ok) expect(answer.body.length).toBe(100);
      await vi.waitFor(() => expect(endlessClosed).toBe(true), { timeout: 8_000, interval: 25 });
    },
    SLOW,
  );

  // F5, tech notes section 3 "Errors". Break it: answer `timeout` from the request's error event.
  it("a refused connection is network, not timeout", async () => {
    const free = await new Promise<number>((done) => {
      const probe = net.createServer();
      probe.listen(0, "127.0.0.1", () => {
        const { port: p } = probe.address() as AddressInfo;
        probe.close(() => done(p));
      });
    });
    const answer = await createReadPorts().request({
      ...base("/ok"),
      url: `http://does-not-exist.invalid:${free}/ok`,
    });
    expect(answer).toEqual({ ok: false, error: "network" });
  });

  // F5. Break it: leave out both `res.on("error")` and `res.on("close")`. A real server that cuts the
  // body short; Node reports the cut through one of the two, so each is also driven alone below.
  it(
    "a body cut short by the server is network",
    async () => {
      const answer = await createReadPorts().request(base("/cut"));
      expect(answer).toEqual({ ok: false, error: "network" });
    },
    SLOW,
  );

  describe("an answer the real sockets do not produce, driven through a stub of http.request", () => {
    type FakeResponse = EventEmitter & {
      socket: { remoteAddress: string | undefined };
      headers: Record<string, string>;
      statusCode: number;
      destroy: () => void;
    };
    const fakeResponse = (remoteAddress: string | undefined): FakeResponse =>
      Object.assign(new EventEmitter(), {
        socket: { remoteAddress },
        headers: {},
        statusCode: 200,
        destroy: vi.fn(),
      });

    // Hands `response` to the port's callback, then runs `then` on it. What `then` throws is kept, so
    // a missing listener shows as an assertion and not as an uncaught error in the run.
    const stubAnswer = (response: FakeResponse, then: (res: FakeResponse) => void) => {
      const outcome: { thrown: unknown } = { thrown: undefined };
      vi.spyOn(http, "request").mockImplementation(((
        _url: unknown,
        _options: unknown,
        cb: (res: FakeResponse) => void,
      ) =>
        Object.assign(new EventEmitter(), {
          destroy: vi.fn(),
          end: () =>
            queueMicrotask(() => {
              cb(response);
              try {
                then(response);
              } catch (error) {
                outcome.thrown = error;
              }
            }),
        })) as unknown as typeof http.request);
      return outcome;
    };

    // The control: the harness gives an answer when the socket has an address and the body ends.
    it("a socket with an address and an end is an answer", async () => {
      stubAnswer(fakeResponse("127.0.0.1"), (res) => res.emit("end"));
      const answer = await createReadPorts().request(base("/ok"));
      expect(answer).toMatchObject({ ok: true, status: 200, remoteAddress: "127.0.0.1" });
    });

    // F5, "remoteAddress missing means network". Break it: leave out `!remoteAddress ||`.
    it("a socket with no remoteAddress is network even when the body then ends", async () => {
      const outcome = stubAnswer(fakeResponse(undefined), (res) => res.emit("end"));
      const answer = await createReadPorts().request(base("/ok"));
      expect(answer).toEqual({ ok: false, error: "network" });
      expect(outcome.thrown).toBeUndefined();
    });

    // F5. Break it: leave out `res.on("error", ...)`; Node then throws on the emit.
    it("an error event on the response is network", async () => {
      const outcome = stubAnswer(fakeResponse("127.0.0.1"), (res) =>
        res.emit("error", new Error("aborted")),
      );
      const answer = await createReadPorts().request(base("/ok"));
      expect(answer).toEqual({ ok: false, error: "network" });
      expect(outcome.thrown).toBeUndefined();
    });

    // F5. Break it: leave out `res.on("close", ...)`.
    it("a close before the end is network", async () => {
      stubAnswer(fakeResponse("127.0.0.1"), (res) => res.emit("close"));
      const answer = await createReadPorts().request(base("/ok"));
      expect(answer).toEqual({ ok: false, error: "network" });
    });
  });

  // F5, "sha256". Break it: use sha1 (40 hex characters), which the evidence schema rejects.
  it("sha256 is the SHA-256 hex digest", () => {
    const { sha256 } = createReadPorts();
    expect(sha256(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256(new Uint8Array())).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  // F5, "resolve's real lookup". Break it: leave out `all: true` (an object, not a list) or the
  // `order` (this Mac lists ::1 first for localhost; a host with only 127.0.0.1 cannot show it).
  it("the default resolve lists every address of localhost, IPv4 first", async () => {
    const found = await createReadPorts().resolve("localhost", 5_000);
    expect(Array.isArray(found)).toBe(true);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((a) => isIP(a) !== 0)).toBe(true);
    if (found.some((a) => isIP(a) === 4)) expect(isIP(found[0] ?? "")).toBe(4);
  });
});
