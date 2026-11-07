import "server-only";
import { createHash } from "node:crypto";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import type { ReadPorts } from "@orivilo/intent-engine";

// ORV-266 tech notes section 3. The Node ports of the engine's safe read. The engine checks the
// address; this file makes the socket connect to that address and no other. No error text, URL or
// host is kept or logged: every failure is the word `network` or `timeout`.

type Lookup = (
  host: string,
  options: { all: true; order: "ipv4first" },
) => Promise<{ address: string; family: number }[]>;

type Answer = Awaited<ReturnType<ReadPorts["request"]>>;

/** `lookup` is the one test seam: the DNS call of `resolve`. */
export function createReadPorts(deps?: { lookup?: Lookup }): ReadPorts {
  // Made once per analysis, never held in module scope, so the 30 s of the read start here.
  const started = performance.now();
  const lookup: Lookup = deps?.lookup ?? ((host, options) => dns.promises.lookup(host, options));

  return {
    async resolve(host, budgetMs) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("budget")), budgetMs);
      });
      try {
        // IPv4 first: the engine connects to the first address it has checked.
        const found = await Promise.race([
          lookup(host, { all: true, order: "ipv4first" }),
          deadline,
        ]);
        return found.map((a) => a.address);
      } finally {
        clearTimeout(timer);
      }
    },

    request(r) {
      return new Promise<Answer>((resolve) => {
        let settled = false;
        let req: http.ClientRequest | undefined;
        const finish = (answer: Answer) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(answer);
        };
        const fail = (error: "timeout" | "network") => {
          finish({ ok: false, error });
          req?.destroy();
        };
        // One wall clock over connect, TLS, headers and body: the `timeout` option is only idle time.
        const timer = setTimeout(() => fail("timeout"), r.timeoutMs);

        try {
          const target = new URL(r.url);
          const family = isIP(r.address);
          const options: https.RequestOptions = {
            method: "GET",
            headers: { ...r.headers, "accept-encoding": "identity" },
            // A new socket for each request, so a socket made for another address never answers.
            agent: false,
            // Always the address the engine checked; the host name stays the name for SNI and the
            // certificate. Node calls this with `all: true`; the plain form is answered too.
            lookup: ((_host: string, opts: { all?: boolean }, cb: (...args: unknown[]) => void) => {
              if (opts.all) cb(null, [{ address: r.address, family }]);
              else cb(null, r.address, family);
            }) as https.RequestOptions["lookup"],
          };
          const send = target.protocol === "https:" ? https.request : http.request;
          req = send(target, options, (res) => {
            const remoteAddress = res.socket.remoteAddress;
            const encoding = res.headers["content-encoding"];
            if (!remoteAddress || (encoding !== undefined && encoding !== "identity")) {
              fail("network"); // the engine cannot read compressed bytes, and nothing inflates them
              return;
            }
            const headers: Record<string, string> = {};
            for (const [key, value] of Object.entries(res.headers)) {
              if (value !== undefined)
                headers[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
            }
            const chunks: Buffer[] = [];
            let total = 0;
            res.on("data", (chunk: Buffer) => {
              if (settled) return;
              if (total + chunk.length > r.maxBytes) {
                chunks.push(chunk.subarray(0, r.maxBytes - total));
                finish({
                  ok: true,
                  status: res.statusCode ?? 0,
                  headers,
                  body: new Uint8Array(Buffer.concat(chunks)),
                  truncated: true,
                  remoteAddress,
                });
                res.destroy();
                req?.destroy();
                return;
              }
              chunks.push(chunk);
              total += chunk.length;
            });
            res.on("end", () => {
              finish({
                ok: true,
                status: res.statusCode ?? 0,
                headers,
                body: new Uint8Array(Buffer.concat(chunks)),
                truncated: false,
                remoteAddress,
              });
            });
            // A body cut short, or a socket closed before `end`, is no answer.
            res.on("error", () => fail("network"));
            res.on("close", () => fail("network"));
          });
          req.on("error", () => fail("network"));
          req.end();
        } catch {
          fail("network");
        }
      });
    },

    sha256(bytes) {
      return createHash("sha256").update(bytes).digest("hex");
    },

    elapsedMs() {
      return performance.now() - started;
    },
  };
}
