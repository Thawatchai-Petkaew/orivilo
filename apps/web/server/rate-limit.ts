import "server-only";
import { clientIp, createRateLimiter, type RateLimiter } from "@orivilo/auth";
import { requireEnv } from "@orivilo/db";
import { appDb } from "@orivilo/db/client";

let shared: RateLimiter | undefined;

/** The app's one limiter, on the `appDb()` pool (ORV-112). Counters live in Postgres, never in memory. */
export function limiter(): RateLimiter {
  shared ??= createRateLimiter({
    db: appDb(),
    // One line per call: the limit's name, the outcome and the time. Never a key, an id or an IP.
    onResult: (r) =>
      console.log(
        JSON.stringify({
          level: "info",
          route: "rate-limit",
          limit: r.limit,
          outcome: r.outcome,
          durationMs: Math.round(r.durationMs),
        }),
      ),
  });
  return shared;
}

/** The rate limit subject for a request's network, from the trusted header only (K-0015). */
export const subjectFromHeaders = (h: Headers) =>
  clientIp(h, process.env, requireEnv("BETTER_AUTH_SECRET"));
