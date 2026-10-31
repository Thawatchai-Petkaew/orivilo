import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { LIMITS } from "./rate-limit.ts";

/**
 * The one writer of request-time log lines (ORV-141). A line is one JSON object on one physical
 * line with only the allow-listed keys, each closed to its list; a value outside its list is
 * written as `"unknown"` or dropped, so no email, token, brief or error text can reach a line.
 * Nothing else in the request path calls `console`.
 */

export const REQUEST_ID_HEADER = "x-request-id";

/** orv141-routes: the third column of the spec's table, in its order. */
export const ROUTES = [
  "directions/listDirections",
  "directions/saveDirection",
  "directions/approveDirection",
  "directions/openVersion",
  "directions/exportVersion",
  "directions/importDirection",
  "directions/readBriefWithAi",
  "account/signInWithGoogle",
  "account/signOut",
  "i18n/setLocale",
  "api/auth",
] as const;
export type Route = (typeof ROUTES)[number];

/** orv141-outcomes, for a boundary line. */
export const BOUNDARY_OUTCOMES = ["ok", "refused", "limited", "unavailable", "failed"] as const;
export type BoundaryOutcome = (typeof BOUNDARY_OUTCOMES)[number];

/** orv141-outcomes, for a step line. */
export const STEP_OUTCOMES = {
  "rate-limit": ["allowed", "limited", "unavailable"],
  "client-ip": ["no-trusted-ip"],
  "ai-usage": ["record-failed", "cost-not-reported"],
} as const;
export type Step = keyof typeof STEP_OUTCOMES;

/** orv141-reasons: the AI failure kinds, the three boundary reasons, then every `ActionError` member. */
export const REASONS = [
  "adapter-failed",
  "invalid-output",
  "evidence-mismatch",
  "rate-limit",
  "spend-cap",
  "unexpected",
  "signed-out",
  "forbidden",
  "workspace-not-found",
  "not-configured",
  "failed",
  "ai-failed",
  "ai-not-configured",
  "rate-limited",
  "ai-rate-limited",
  "ai-spend-cap",
  "invalid-input",
  "invalid-file",
  "not-found",
  "no-draft",
  "resolver-changed",
  "profile-missing",
  "fingerprint-mismatch",
] as const;
export type Reason = (typeof REASONS)[number];

export type Level = "info" | "warn" | "error";
const LEVELS: readonly Level[] = ["info", "warn", "error"];

export interface Ending {
  level: Level;
  outcome: BoundaryOutcome;
  reason?: Reason;
  errorName?: string;
  status?: number;
}
/** What an entry's work returns: the value its caller gets, and how the line reads. */
export interface Ended<T> {
  value: T;
  ending: Ending;
}
export interface RequestContext {
  requestId: string;
  route: Route;
}

const UNKNOWN = "unknown";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ERROR_NAME = /^[A-Z][A-Za-z]{0,39}$/;
/**
 * `auth-http` is the limit name Better Auth's counts carry (`betterAuthStorage`). Read when a line
 * is written, never at module load: `rate-limit.ts` imports `client-ip.ts`, which imports this
 * file, so `LIMITS` is not defined yet when this module loads through `rate-limit.ts`.
 */
const limitNames = (): readonly string[] => [...Object.keys(LIMITS), "auth-http"];

function closed(value: unknown, list: readonly string[]): string {
  return typeof value === "string" && list.includes(value) ? value : UNKNOWN;
}

/**
 * Writes one line from `fields`, the only `console` call for a request. Keys are taken in the
 * allow-list's order and any other key is dropped (orv141-allow-list).
 */
export function writeLine(fields: Record<string, unknown>): void {
  const level: Level = LEVELS.includes(fields["level"] as Level)
    ? (fields["level"] as Level)
    : "error";
  const requestId =
    typeof fields["requestId"] === "string" && UUID_V4.test(fields["requestId"])
      ? fields["requestId"]
      : UNKNOWN;
  const route = closed(fields["route"], ROUTES);
  const duration = fields["durationMs"];
  const durationMs =
    typeof duration === "number" && Number.isFinite(duration)
      ? Math.max(0, Math.round(duration))
      : 0;
  const hasStep = fields["step"] !== undefined;
  const step = hasStep ? closed(fields["step"], Object.keys(STEP_OUTCOMES)) : undefined;
  const outcomes: readonly string[] =
    step === undefined
      ? BOUNDARY_OUTCOMES
      : ((STEP_OUTCOMES as Record<string, readonly string[]>)[step] ?? []);
  const outcome = closed(fields["outcome"], outcomes);

  const line: Record<string, unknown> = { level, requestId, route, durationMs, outcome };
  if (step !== undefined) line["step"] = step;
  if (fields["limit"] !== undefined) line["limit"] = closed(fields["limit"], limitNames());
  if (fields["reason"] !== undefined) line["reason"] = closed(fields["reason"], REASONS);
  const status = fields["status"];
  if (
    route === "api/auth" &&
    Number.isInteger(status) &&
    (status as number) >= 100 &&
    (status as number) <= 599
  )
    line["status"] = status;
  if (fields["errorName"] !== undefined)
    line["errorName"] =
      typeof fields["errorName"] === "string" && ERROR_NAME.test(fields["errorName"])
        ? fields["errorName"]
        : UNKNOWN;

  const text = JSON.stringify(line);
  if (level === "info") console.log(text);
  else if (level === "warn") console.warn(text);
  else console.error(text);
}

/** The request's id from the header the proxy set; a fresh UUID v4 when it is missing or not one. */
export function requestIdOf(headers: Headers): string {
  const value = headers.get(REQUEST_ID_HEADER);
  return value !== null && UUID_V4.test(value) ? value : randomUUID();
}

/**
 * One store on `globalThis`, so a module Next bundles twice (one copy per server layer) shares it.
 */
const STORE_KEY = Symbol.for("orivilo.request-context");
type Held = { [STORE_KEY]?: AsyncLocalStorage<RequestContext> };
function store(): AsyncLocalStorage<RequestContext> {
  const held = globalThis as Held;
  return (held[STORE_KEY] ??= new AsyncLocalStorage<RequestContext>());
}

/**
 * The boundary of one entry: opens the request's context, runs the work, writes exactly one line
 * and returns the work's value. A throw is the `failed` line (by name only) and is rethrown.
 */
export async function atBoundary<T>(
  context: RequestContext,
  work: () => Promise<Ended<T>>,
): Promise<T> {
  const started = performance.now();
  const line = (ending: Ending) =>
    writeLine({ ...ending, ...context, durationMs: performance.now() - started });
  let ended: Ended<T>;
  try {
    ended = await store().run(context, work);
  } catch (error) {
    line({
      level: "error",
      outcome: "failed",
      reason: "unexpected",
      errorName: error instanceof Error ? error.name : UNKNOWN,
    });
    throw error;
  }
  line(ended.ending);
  return ended.value;
}

/** A step line, with the request's id and route from the open context (orv141-step-lines). */
export function logStep<S extends Step>(fields: {
  step: S;
  outcome: (typeof STEP_OUTCOMES)[S][number];
  durationMs: number;
  /** Never `error`: the boundary line is the only `error` line for a request. */
  level?: "info" | "warn";
  limit?: string;
}): void {
  const context = store().getStore();
  writeLine({
    ...fields,
    level: fields.level === "warn" ? "warn" : "info",
    // Outside a request both are undefined, which `writeLine` closes to "unknown".
    requestId: context?.requestId,
    route: context?.route,
  });
}

/** The `api/auth` status map: how a response status reads as a boundary ending. */
export function endingOfStatus(status: number): Ending {
  if (status === 429) return { level: "warn", outcome: "limited", status };
  if (status === 503) return { level: "error", outcome: "unavailable", status };
  if (status >= 500) return { level: "error", outcome: "failed", status };
  if (status >= 400) return { level: "info", outcome: "refused", status };
  return { level: "info", outcome: "ok", status };
}
