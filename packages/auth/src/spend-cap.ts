import { randomUUID } from "node:crypto";
import { aiUsage, and, eq, gte, lt, sql } from "@orivilo/db";
import { inWorkspace } from "@orivilo/db/client";
import type { AiJob } from "@orivilo/intent-engine";
import { Denied, withWorkspace, type AccessDeps } from "./access.ts";
import { BANGKOK_OFFSET_SECONDS } from "./rate-limit.ts";

/** One cap for every workspace, over every AI job together (ORV-121 open questions 1 and 6). */
export const AI_SPEND_CAP_MICRO_USD = 5_000_000; // 5 US dollars

export interface SpendCapDeps {
  access: AccessDeps;
  /** Milliseconds since the epoch. Default `Date.now`. */
  now?: () => number;
  /** Past this a check is `unavailable` and a record rejects (spend-cap-6, the ORV-112 bound). */
  timeoutMs?: number;
  /** Default `AI_SPEND_CAP_MICRO_USD`; set only by tests. */
  capMicroUsd?: number;
}

/** Module-private: no other module can name it, so no other module can write a `Charge`. */
declare const issued: unique symbol;

/**
 * Who a call is charged to, as `check`'s `withWorkspace` resolved it. Only `check` makes one: the
 * brand keeps an object literal out at compile time, and `record` refuses at run time a charge that
 * `check` did not issue or that was already used.
 */
export interface Charge {
  readonly workspaceId: string;
  readonly userId: string;
  readonly [issued]: true;
}

export type SpendCheck =
  | { ok: true; charge: Charge }
  | { ok: false; reason: "capped" }
  /** The sum could not be read in time: the caller fails closed. */
  | { ok: false; reason: "unavailable" };

export interface UsageEntry {
  job: AiJob;
  model: string;
  /** Millionths of a US dollar; null = not reported. */
  costMicroUsd: number | null;
}

export interface SpendCap {
  /** Throws `Denied` without an active workspace or for a non-member; never throws otherwise. */
  check(headers: Headers, workspaceId: string | null | undefined): Promise<SpendCheck>;
  /**
   * One row per entry, in one transaction scoped to `charge.workspaceId`; reads no session. Uses up
   * the charge; nothing to write for no entries. Throws for a charge `check` did not issue or one
   * already used, and on any other failure.
   */
  record(charge: Charge, entries: readonly UsageEntry[]): Promise<void>;
}

/** The Bangkok calendar month holding `nowMs`: start inclusive, end exclusive (spend-cap-2). */
export function monthOf(nowMs: number): { start: Date; end: Date } {
  const offset = BANGKOK_OFFSET_SECONDS * 1000;
  const bangkok = new Date(nowMs + offset);
  const year = bangkok.getUTCFullYear();
  const month = bangkok.getUTCMonth();
  return {
    start: new Date(Date.UTC(year, month, 1) - offset),
    end: new Date(Date.UTC(year, month + 1, 1) - offset),
  };
}

/**
 * The spend cap per workspace (ORV-121, ADR 0015 decision 4). `check` reads `ai_usage` through
 * `withWorkspace`, so the membership check and row security by workspace apply. `record` writes
 * inside `inWorkspace` with a charge only `check` makes, and reads no session, so a person who
 * signs out or leaves during the call cannot keep a paid request out of the sum (SEC-1).
 * `check` fails closed: any error or a read past `timeoutMs` is `unavailable`, never a pass.
 */
export function createSpendCap(deps: SpendCapDeps): SpendCap {
  const now = deps.now ?? Date.now;
  const timeoutMs = deps.timeoutMs ?? 2_000;
  const capMicroUsd = deps.capMicroUsd ?? AI_SPEND_CAP_MICRO_USD;
  /** The charges `check` issued and `record` has not used; nothing else adds to it. */
  const issuedCharges = new WeakSet<Charge>();

  /**
   * Runs `work` against a timer. `work` gets `abortIfTimedOut`, which it calls between statements
   * so a call the timer already settled rolls back instead of committing. The same bound is set on
   * the transaction, so the database stops a statement or a lock wait at the timer's moment.
   */
  async function bounded<T>(
    work: (abortIfTimedOut: () => void) => Promise<T>,
    onTimeout: () => T,
  ): Promise<T> {
    let timedOut = false;
    const abortIfTimedOut = () => {
      if (timedOut) throw new Error("spend cap call timed out");
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        try {
          resolve(onTimeout());
        } catch (error) {
          reject(error);
        }
      }, timeoutMs);
    });
    try {
      return await Promise.race([work(abortIfTimedOut), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  const setTimeouts = (tx: { execute: (q: ReturnType<typeof sql>) => Promise<unknown> }) =>
    tx.execute(
      sql`SELECT set_config('statement_timeout', ${String(timeoutMs)}, true), set_config('lock_timeout', ${String(timeoutMs)}, true)`,
    );

  return {
    async check(headers, workspaceId) {
      const unavailable: SpendCheck = { ok: false, reason: "unavailable" };
      return bounded<SpendCheck>(
        async (abortIfTimedOut) => {
          try {
            return await withWorkspace(deps.access, headers, workspaceId, "member", async (a) => {
              abortIfTimedOut();
              await setTimeouts(a.tx);
              abortIfTimedOut();
              const { start, end } = monthOf(now());
              const [row] = await a.tx
                .select({ total: sql<string>`coalesce(sum(${aiUsage.costMicroUsd}), 0)` })
                .from(aiUsage)
                .where(
                  and(
                    eq(aiUsage.workspaceId, a.workspaceId),
                    gte(aiUsage.createdAt, start),
                    lt(aiUsage.createdAt, end),
                  ),
                );
              abortIfTimedOut();
              const total = Number(row?.total);
              if (!Number.isSafeInteger(total)) return unavailable;
              if (total >= capMicroUsd) return { ok: false, reason: "capped" } as const;
              // The one cast in the package: the brand has no run-time value, the set is the proof.
              const charge = Object.freeze({
                workspaceId: a.workspaceId,
                userId: a.userId,
              }) as Charge;
              issuedCharges.add(charge);
              return { ok: true, charge };
            });
          } catch (error) {
            if (error instanceof Denied) throw error;
            return unavailable;
          }
        },
        () => unavailable,
      );
    },

    async record(charge, entries) {
      // The charge first: one not issued by this helper, or already used, is refused before any query.
      if (!issuedCharges.delete(charge)) throw new Error("charge was not issued by check");
      if (entries.length === 0) return;
      for (const { costMicroUsd } of entries) {
        if (costMicroUsd !== null && !(Number.isSafeInteger(costMicroUsd) && costMicroUsd >= 0)) {
          throw new Error("usage cost must be null or a non-negative safe integer");
        }
      }
      await bounded(
        (abortIfTimedOut) =>
          inWorkspace(deps.access.db, charge.workspaceId, async (tx) => {
            abortIfTimedOut();
            await setTimeouts(tx);
            abortIfTimedOut();
            const createdAt = new Date(now());
            await tx.insert(aiUsage).values(
              entries.map((e) => ({
                id: randomUUID(),
                workspaceId: charge.workspaceId,
                userId: charge.userId,
                job: e.job,
                model: e.model,
                costMicroUsd: e.costMicroUsd,
                currency: "USD",
                createdAt,
              })),
            );
            abortIfTimedOut();
          }),
        () => {
          throw new Error("spend cap record timed out");
        },
      );
    },
  };
}
