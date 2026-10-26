import { getIPFromHeader } from "@better-auth/core/utils/ip";
import { createHmac } from "node:crypto";

/** The label that derives the IP hashing key from the auth secret (ORV-112 tech notes, finding F3). */
const IP_KEY_LABEL = "orivilo/rate-limit/ip/v1";

let warned = false;

const hmac = (key: string | Buffer, message: string) => createHmac("sha256", key).update(message);

/** The hex HMAC subject of an already normalised IP, under the key derived from the secret. */
export const hashIp = (ip: string, secret: string) =>
  hmac(hmac(secret, IP_KEY_LABEL).digest(), ip).digest("hex");

/**
 * The rate limit subject for a request's network (ORV-112, K-0015). On Vercel
 * (`VERCEL_ENV` production or preview) it is the hex HMAC of `x-forwarded-for`, which the edge
 * overwrites with the caller's public IP, read only when it holds one valid IP and normalised the
 * way Better Auth does (IPv4-mapped IPv6 to IPv4, IPv6 to its /64). A missing, listed or invalid
 * value is `unknown`. Off Vercel it is `local`. No other header is ever read, and no raw IP leaves
 * this function.
 */
export function clientIp(
  headers: Headers,
  env: Record<string, string | undefined>,
  secret: string,
): string {
  if (env["VERCEL_ENV"] !== "production" && env["VERCEL_ENV"] !== "preview") return "local";
  const ip = getIPFromHeader(headers.get("x-forwarded-for") ?? "");
  if (!ip) {
    if (!warned) {
      warned = true;
      console.warn(
        JSON.stringify({ level: "warn", route: "rate-limit", outcome: "no-trusted-ip" }),
      );
    }
    return "unknown";
  }
  return hashIp(ip, secret);
}
