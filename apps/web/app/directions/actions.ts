"use server";

import {
  atBoundary,
  Denied,
  DirectionError,
  type DirectionSummary,
  directionService,
  type Ended,
  type Ending,
  LIMITS,
  type LimitName,
  type Reason,
  requestIdOf,
  type Role,
  type Route,
  sealReading,
  withWorkspace,
} from "@orivilo/auth";
import { MissingEnvError, requireEnv } from "@orivilo/db";
import { CURATED_PROFILES, type DirectionStudioState } from "@orivilo/design-system";
import {
  AI_MODELS,
  type DirectionFile,
  type Interpretation,
  interpretBrief,
  llmInterpreter,
  openRouterComplete,
  replaySnapshot,
  type ReplayRefusal,
} from "@orivilo/intent-engine";
import { headers } from "next/headers";
import { accessDeps, auth } from "../../server/auth";
import { limiter, subjectFromHeaders } from "../../server/rate-limit";

/**
 * Saved directions for the Studio (ORV-35 part 2). Every call goes through `directionService`, so
 * the session, the workspace and the role are checked on the server; the workspace is the
 * session's active one, never a value from the client. Failures come back as a reason the page
 * can say in words.
 */

export type ActionError =
  | "signed-out"
  | "forbidden"
  | "not-configured"
  | "failed"
  | "ai-failed"
  | "ai-not-configured"
  | "rate-limited"
  | "ai-rate-limited"
  | DirectionError["reason"];

/** A refused call says how long to wait; the caller says it in the person's language (ORV-112). */
export type RateLimited = {
  ok: false;
  error: "rate-limited" | "ai-rate-limited";
  code: "RATE_LIMITED";
  retryAfter: number;
  retryable: true;
};

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: Exclude<ActionError, RateLimited["error"]> }
  | RateLimited;

export interface Listing {
  role: Role;
  directions: DirectionSummary[];
}

export interface OpenedVersion {
  directionId: string;
  name: string;
  status: "draft" | "approved";
  number: number | null;
  state: DirectionStudioState;
  /** Why the saved result no longer replays, when it does not. */
  replay: ReplayRefusal | null;
  /** The seal for the version's AI reading, so saving it again is accepted; null without one. */
  seal: string | null;
}

export interface SealedReading {
  reading: Interpretation;
  /** Proves to `saveDirection` that this server made the reading. */
  seal: string;
}

/** What went wrong in an AI reading, as the boundary line names it (`orv141-reasons`). */
type AiFailure = "adapter-failed" | "invalid-output" | "evidence-mismatch" | "ai-not-configured";

class AiFailed extends Error {
  readonly reason: "ai-failed" | "ai-not-configured";
  constructor(readonly kind: AiFailure) {
    super(kind);
    this.reason = kind === "ai-not-configured" ? "ai-not-configured" : "ai-failed";
  }
}

const LIMITED: readonly ActionError[] = ["rate-limited", "ai-rate-limited"];
const FAILED: readonly ActionError[] = [
  "failed",
  "ai-failed",
  "not-configured",
  "ai-not-configured",
];

/** How a returned outcome reads as a boundary line (the spec's action outcome map). */
function endingOf(outcome: Outcome<unknown>): Ending {
  if (outcome.ok) return { level: "info", outcome: "ok" };
  const reason: Reason = outcome.error;
  if (LIMITED.includes(outcome.error)) return { level: "warn", outcome: "limited", reason };
  if (FAILED.includes(outcome.error)) return { level: "error", outcome: "failed", reason };
  return { level: "info", outcome: "refused", reason };
}

const ended = <T>(value: Outcome<T>): Ended<Outcome<T>> => ({ value, ending: endingOf(value) });

/**
 * The one door for the actions. The order is fixed: the session, then the rate limit (per person,
 * or per trusted network without a session), then the work (ORV-112). A store that cannot count
 * fails closed: the call is refused as a failure and nothing runs. The whole call is one boundary
 * (ORV-141): it writes one line with the request's id, the route and how the call ended.
 */
async function run<T>(
  route: Route,
  fn: (
    service: ReturnType<typeof directionService>,
    h: Headers,
    workspaceId: string | null | undefined,
  ) => Promise<T>,
  limit?: LimitName,
): Promise<Outcome<T>> {
  const h = await headers();
  return atBoundary({ requestId: requestIdOf(h), route }, async (): Promise<Ended<Outcome<T>>> => {
    try {
      const session = await auth().api.getSession({ headers: h });
      if (limit) {
        const counted = session
          ? await limiter().consume(LIMITS[limit], { user: session.user.id })
          : await limiter().consume(LIMITS["signed-out"], { ip: subjectFromHeaders(h) });
        if (!counted.ok) {
          if (counted.reason === "unavailable") {
            return {
              value: { ok: false, error: limit === "ai-read" ? "ai-failed" : "failed" },
              ending: { level: "error", outcome: "unavailable", reason: "rate-limit" },
            };
          }
          return ended({
            ok: false,
            error: session && limit === "ai-read" ? "ai-rate-limited" : "rate-limited",
            code: "RATE_LIMITED",
            retryAfter: counted.retryAfter,
            retryable: true,
          });
        }
      }
      if (!session) return ended({ ok: false, error: "signed-out" });
      const service = directionService(accessDeps(), CURATED_PROFILES, {
        sealKey: requireEnv("BETTER_AUTH_SECRET"),
      });
      return ended({
        ok: true,
        value: await fn(service, h, session.session.activeOrganizationId),
      });
    } catch (error) {
      if (error instanceof Denied) {
        return ended({ ok: false, error: error.status === 401 ? "signed-out" : "forbidden" });
      }
      if (error instanceof DirectionError) return ended({ ok: false, error: error.reason });
      if (error instanceof MissingEnvError) return ended({ ok: false, error: "not-configured" });
      if (error instanceof AiFailed) {
        return {
          value: { ok: false, error: error.reason },
          ending: { level: "error", outcome: "failed", reason: error.kind },
        };
      }
      return {
        value: { ok: false, error: "failed" },
        ending: {
          level: "error",
          outcome: "failed",
          reason: "unexpected",
          errorName: error instanceof Error ? error.name : "unknown",
        },
      };
    }
  });
}

/** An id from the client is only a name to look up; access is decided by the service. */
const id = (raw: unknown) => {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 100) {
    throw new DirectionError("invalid-input");
  }
  return raw;
};

/** The workspace's directions and the person's role in it. */
export async function listDirections(): Promise<Outcome<Listing>> {
  return run("directions/listDirections", async (service, h, workspaceId) => {
    const role = await withWorkspace(accessDeps(), h, workspaceId, "member", async (a) => a.role);
    return { role, directions: await service.list(h, workspaceId ?? "") };
  });
}

/** Saves the studio as the direction's draft; without an id it starts a new direction. */
export async function saveDirection(input: unknown) {
  return run(
    "directions/saveDirection",
    (service, h, workspaceId) => service.saveDraft(h, workspaceId ?? "", input),
    "write",
  );
}

/** Approves the direction's draft into the next version. The service requires an admin. */
export async function approveDirection(directionId: unknown) {
  return run(
    "directions/approveDirection",
    (service, h, workspaceId) => service.approve(h, workspaceId ?? "", id(directionId)),
    "write",
  );
}

/** One version as the studio opens it, with whether it still replays to what was saved. */
export async function openVersion(versionId: unknown): Promise<Outcome<OpenedVersion>> {
  return run("directions/openVersion", async (service, h, workspaceId) => {
    const saved = await service.read(h, workspaceId ?? "", id(versionId));
    const { brief, profileId, locked, adjustments, reading } = saved.snapshot;
    const replay = replaySnapshot(saved.snapshot, CURATED_PROFILES);
    return {
      directionId: saved.directionId,
      name: saved.name,
      status: saved.version.status,
      number: saved.version.number,
      state: { brief, profileId, locked, adjustments, ...(reading ? { reading } : {}) },
      replay: replay.ok ? null : replay.reason,
      // The server stored this reading after checking its seal (or importing it), so it seals it again.
      seal: reading ? sealReading(requireEnv("BETTER_AUTH_SECRET"), brief, reading) : null,
    };
  });
}

/** The export file for one version. */
export async function exportVersion(versionId: unknown): Promise<Outcome<DirectionFile>> {
  return run("directions/exportVersion", (service, h, workspaceId) =>
    service.exportFile(h, workspaceId ?? "", id(versionId)),
  );
}

/** Imports a file as a new direction with one draft; refused unless it replays to its fingerprint. */
export async function importDirection(file: unknown) {
  return run(
    "directions/importDirection",
    (service, h, workspaceId) => service.importFile(h, workspaceId ?? "", file),
    "import",
  );
}

/** How long a reading may take before the Studio keeps the rules' reading (ADR 0009 point 3). */
const AI_TIMEOUT_MS = 20_000;

/**
 * Reads a brief with the `interpret` model (ORV-62, ADR 0009). Signed-in people only, since every
 * call costs money. The output is checked like any adapter's; on any failure the caller keeps the
 * rules' reading and says so. Only the failure kind is logged (the boundary line), never the brief.
 */
export async function readBriefWithAi(brief: unknown): Promise<Outcome<SealedReading>> {
  return run(
    "directions/readBriefWithAi",
    async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new AiFailed("ai-not-configured");
      const model = AI_MODELS.interpret;
      const adapter = llmInterpreter(
        model,
        openRouterComplete({
          apiKey,
          model,
          fetch: (url, init) => fetch(url, init as RequestInit),
          signal: () => AbortSignal.timeout(AI_TIMEOUT_MS),
        }),
      );
      const outcome = await interpretBrief(adapter, { text: brief });
      if (!outcome.ok) {
        if (outcome.error === "invalid-brief") throw new DirectionError("invalid-input");
        // Only the kind reaches the line: `outcome.detail` can hold OpenRouter's text or the brief.
        throw new AiFailed(outcome.error);
      }
      const text = typeof brief === "string" ? brief : "";
      return {
        reading: outcome.interpretation,
        seal: sealReading(requireEnv("BETTER_AUTH_SECRET"), text, outcome.interpretation),
      };
    },
    "ai-read",
  );
}
