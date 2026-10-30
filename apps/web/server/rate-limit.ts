import "server-only";
import { clientIp, createRateLimiter, logStep, type RateLimiter } from "@orivilo/auth";
import { requireEnv } from "@orivilo/db";
import { appDb } from "@orivilo/db/client";

/**
 * One `rate-limit` step line per count (ORV-141 `orv141-step-lines`): the limit's name, the outcome
 * and the time, with the open request's id and route. Never a key, an id or an IP. Better Auth's
 * counts reach it too, under the limit name `auth-http`.
 */
export function logRateLimit(r: {
  limit: string;
  outcome: "allowed" | "limited" | "unavailable";
  durationMs: number;
}): void {
  logStep({ step: "rate-limit", limit: r.limit, outcome: r.outcome, durationMs: r.durationMs });
}

let shared: RateLimiter | undefined;

/** The app's one limiter, on the `appDb()` pool (ORV-112). Counters live in Postgres, never in memory. */
export function limiter(): RateLimiter {
  shared ??= createRateLimiter({
    db: appDb(),
    onResult: logRateLimit,
  });
  return shared;
}

/** The rate limit subject for a request's network, from the trusted header only (K-0015). */
export const subjectFromHeaders = (h: Headers) =>
  clientIp(h, process.env, requireEnv("BETTER_AUTH_SECRET"));
