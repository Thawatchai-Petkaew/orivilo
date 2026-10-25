import { type Db } from "@orivilo/db/client";
import { sql } from "@orivilo/db";

/** One fixed window. It starts at floor((t + offsetSeconds) / seconds) * seconds - offsetSeconds. */
export interface Window {
  seconds: number;
  /** Integer, at least 1. */
  max: number;
  /** Shifts the alignment. The Bangkok day is +25_200 (UTC+7, no daylight saving). */
  offsetSeconds?: number;
}

export interface Limit {
  name: string;
  /** Longest first. Each window nests in the one before it (checked by `assertNested`). */
  windows: readonly Window[];
}

export const BANGKOK_OFFSET_SECONDS = 7 * 3600;

/** The decided numbers (spec ORV-112 v1.3, G1 decision 1). `limits.test.ts` pins them. */
export const LIMITS = {
  "sign-in": { name: "sign-in", windows: [{ seconds: 600, max: 10 }] },
  "ai-read": {
    name: "ai-read",
    windows: [
      { seconds: 86_400, max: 50, offsetSeconds: BANGKOK_OFFSET_SECONDS },
      { seconds: 3_600, max: 10 },
    ],
  },
  write: { name: "write", windows: [{ seconds: 600, max: 60 }] },
  import: { name: "import", windows: [{ seconds: 3_600, max: 10 }] },
  "signed-out": { name: "signed-out", windows: [{ seconds: 600, max: 30 }] },
} as const satisfies Record<string, Limit>;
export type LimitName = keyof typeof LIMITS;

/** A person by session user id, or a network by `clientIp`'s subject. */
export type Subject = { user: string } | { ip: string };

export type Consumed =
  | { ok: true }
  /** `retryAfter` is whole seconds, at least 1. */
  | { ok: false; reason: "limited"; retryAfter: number }
  /** The store failed or timed out: the caller fails closed. */
  | { ok: false; reason: "unavailable" };

export interface RateLimitDeps {
  /** The `orivilo_app` pool. */
  db: Db;
  /** Milliseconds since the epoch. */
  now?: () => number;
  /** At most one prune of expired rows per this many ms; tests pass 0. */
  pruneEveryMs?: number;
  /** Past this the call is `unavailable`. */
  timeoutMs?: number;
  /** One call per consume, for the log line; never receives the key. */
  onResult?: (r: {
    limit: string;
    outcome: "allowed" | "limited" | "unavailable";
    durationMs: number;
  }) => void;
}

export interface RateLimiter {
  consume(limit: Limit, subject: Subject): Promise<Consumed>;
}

/** Start and end (exclusive) of a window, in Unix seconds, for a time in ms. */
export function windowOf(w: Window, nowMs: number) {
  const off = w.offsetSeconds ?? 0;
  const t = Math.floor(nowMs / 1000);
  const start = Math.floor((t + off) / w.seconds) * w.seconds - off;
  return { start, end: start + w.seconds };
}

/** Whole seconds until `endSeconds`, rounded up, at least 1. */
export const retryAfterOf = (endSeconds: number, nowMs: number) =>
  Math.max(1, Math.ceil((endSeconds * 1000 - nowMs) / 1000));

/**
 * Each window must nest in the one before it, so a longer window always ends at or after a shorter
 * one and the first refusal, longest first, is the later end.
 */
export function assertNested(limit: Limit) {
  for (const [i, shorter] of limit.windows.entries()) {
    const longer = limit.windows[i - 1];
    if (!longer) continue;
    const apart = (longer.offsetSeconds ?? 0) - (shorter.offsetSeconds ?? 0);
    if (longer.seconds % shorter.seconds !== 0 || apart % shorter.seconds !== 0) {
      throw new Error(`rate limit ${limit.name}: windows do not nest`);
    }
  }
}

export const keyOf = (limit: Limit, subject: Subject) =>
  "user" in subject ? `${limit.name}:u:${subject.user}` : `${limit.name}:ip:${subject.ip}`;

class Refused extends Error {
  readonly endSeconds: number;
  constructor(endSeconds: number) {
    super("refused");
    this.endSeconds = endSeconds;
  }
}

/**
 * The shared rate limiter (ORV-112, ADR 0015 decision 4). Counters live in `rate_limit_counter`,
 * so every server instance sees the same count. One window is one atomic upsert; several windows
 * run in one transaction, longest first, and a refusal rolls back every window already raised.
 * `consume` never throws: a store error or a timeout is `unavailable`, never a pass.
 */
export function createRateLimiter(deps: RateLimitDeps): RateLimiter {
  const { db } = deps;
  const now = deps.now ?? Date.now;
  const pruneEveryMs = deps.pruneEveryMs ?? 60_000;
  const timeoutMs = deps.timeoutMs ?? 2_000;
  let lastPrune = -Infinity;

  const upsert = (
    exec: Pick<Db, "execute">,
    key: string,
    start: number,
    end: number,
    max: number,
  ) =>
    exec.execute(sql`
      INSERT INTO rate_limit_counter AS c (key, window_start, window_end, count)
      VALUES (${key}, ${start}::bigint, ${end}::bigint, 1)
      ON CONFLICT (key, window_start, window_end)
      DO UPDATE SET count = c.count + 1
      WHERE c.count < ${max}::integer
      RETURNING c.count`);

  async function count(limit: Limit, key: string, nowMs: number) {
    const spans = limit.windows.map((w) => ({ ...windowOf(w, nowMs), max: w.max }));
    const attempt = async (exec: Pick<Db, "execute">, s: (typeof spans)[number]) => {
      const rows = await upsert(exec, key, s.start, s.end, s.max);
      if (rows.length === 0) throw new Refused(s.end);
    };
    const run = async (): Promise<Consumed> => {
      try {
        // One transaction, so SET LOCAL below lets the database stop the work at the same bound
        // as the timer: a timed-out call does not keep a pool connection or wait on a lock.
        await db.transaction(async (tx) => {
          await tx.execute(
            sql`SELECT set_config('statement_timeout', ${String(timeoutMs)}, true), set_config('lock_timeout', ${String(timeoutMs)}, true)`,
          );
          for (const s of spans) await attempt(tx, s);
        });
        return { ok: true };
      } catch (error) {
        if (error instanceof Refused) {
          return {
            ok: false,
            reason: "limited",
            retryAfter: retryAfterOf(error.endSeconds, nowMs),
          };
        }
        throw error;
      }
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<Consumed>((resolve) => {
      timer = setTimeout(() => resolve({ ok: false, reason: "unavailable" }), timeoutMs);
    });
    try {
      return await Promise.race([
        run().catch((): Consumed => ({ ok: false, reason: "unavailable" })),
        timeout,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Fire and forget: the result never waits on it, and a failure or a hang is not the caller's. */
  function prune(nowMs: number) {
    if (nowMs - lastPrune < pruneEveryMs) return;
    lastPrune = nowMs;
    void Promise.resolve()
      .then(() =>
        db.transaction(async (tx) => {
          await tx.execute(
            sql`SELECT set_config('statement_timeout', ${String(timeoutMs)}, true), set_config('lock_timeout', ${String(timeoutMs)}, true)`,
          );
          await tx.execute(
            sql`DELETE FROM rate_limit_counter WHERE window_end < ${Math.floor(nowMs / 1000)}::bigint - 86400`,
          );
        }),
      )
      .catch(() => {});
  }

  return {
    async consume(limit, subject) {
      const started = performance.now();
      const nowMs = now();
      const result = await count(limit, keyOf(limit, subject), nowMs);
      deps.onResult?.({
        limit: limit.name,
        outcome: result.ok ? "allowed" : result.reason,
        durationMs: performance.now() - started,
      });
      prune(nowMs);
      return result;
    },
  };
}

for (const limit of Object.values(LIMITS)) assertNested(limit);
