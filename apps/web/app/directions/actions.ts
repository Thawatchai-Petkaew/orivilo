"use server";

import {
  Denied,
  DirectionError,
  type DirectionSummary,
  directionService,
  LIMITS,
  type LimitName,
  type Role,
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

class AiFailed extends Error {
  constructor(readonly reason: "ai-failed" | "ai-not-configured" = "ai-failed") {
    super(reason);
  }
}

/**
 * The one door for the actions. The order is fixed: the session, then the rate limit (per person,
 * or per trusted network without a session), then the work (ORV-112). A store that cannot count
 * fails closed: the call is refused as a failure and nothing runs.
 */
async function run<T>(
  fn: (
    service: ReturnType<typeof directionService>,
    h: Headers,
    workspaceId: string | null | undefined,
  ) => Promise<T>,
  limit?: LimitName,
): Promise<Outcome<T>> {
  try {
    const h = await headers();
    const session = await auth().api.getSession({ headers: h });
    if (limit) {
      const counted = session
        ? await limiter().consume(LIMITS[limit], { user: session.user.id })
        : await limiter().consume(LIMITS["signed-out"], { ip: subjectFromHeaders(h) });
      if (!counted.ok) {
        if (counted.reason === "unavailable") {
          console.error("rate limit unavailable", limit);
          return { ok: false, error: limit === "ai-read" ? "ai-failed" : "failed" };
        }
        return {
          ok: false,
          error: session && limit === "ai-read" ? "ai-rate-limited" : "rate-limited",
          code: "RATE_LIMITED",
          retryAfter: counted.retryAfter,
          retryable: true,
        };
      }
    }
    if (!session) return { ok: false, error: "signed-out" };
    const service = directionService(accessDeps(), CURATED_PROFILES, {
      sealKey: requireEnv("BETTER_AUTH_SECRET"),
    });
    return { ok: true, value: await fn(service, h, session.session.activeOrganizationId) };
  } catch (error) {
    if (error instanceof Denied) {
      return { ok: false, error: error.status === 401 ? "signed-out" : "forbidden" };
    }
    if (error instanceof DirectionError) return { ok: false, error: error.reason };
    if (error instanceof MissingEnvError) return { ok: false, error: "not-configured" };
    if (error instanceof AiFailed) return { ok: false, error: error.reason };
    console.error("direction action failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "failed" };
  }
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
  return run(async (service, h, workspaceId) => {
    const role = await withWorkspace(accessDeps(), h, workspaceId, "member", async (a) => a.role);
    return { role, directions: await service.list(h, workspaceId ?? "") };
  });
}

/** Saves the studio as the direction's draft; without an id it starts a new direction. */
export async function saveDirection(input: unknown) {
  return run((service, h, workspaceId) => service.saveDraft(h, workspaceId ?? "", input), "write");
}

/** Approves the direction's draft into the next version. The service requires an admin. */
export async function approveDirection(directionId: unknown) {
  return run(
    (service, h, workspaceId) => service.approve(h, workspaceId ?? "", id(directionId)),
    "write",
  );
}

/** One version as the studio opens it, with whether it still replays to what was saved. */
export async function openVersion(versionId: unknown): Promise<Outcome<OpenedVersion>> {
  return run(async (service, h, workspaceId) => {
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
  return run((service, h, workspaceId) => service.exportFile(h, workspaceId ?? "", id(versionId)));
}

/** Imports a file as a new direction with one draft; refused unless it replays to its fingerprint. */
export async function importDirection(file: unknown) {
  return run((service, h, workspaceId) => service.importFile(h, workspaceId ?? "", file), "import");
}

/** How long a reading may take before the Studio keeps the rules' reading (ADR 0009 point 3). */
const AI_TIMEOUT_MS = 20_000;

/**
 * Reads a brief with the `interpret` model (ORV-62, ADR 0009). Signed-in people only, since every
 * call costs money. The output is checked like any adapter's; on any failure the caller keeps the
 * rules' reading and says so. Only the failure kind is logged, never the brief.
 */
export async function readBriefWithAi(brief: unknown): Promise<Outcome<SealedReading>> {
  return run(async () => {
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
      // The adapter's reason is ours or OpenRouter's and never quotes the brief; the others can.
      console.error(
        "ai reading failed",
        outcome.error,
        outcome.error === "adapter-failed" ? outcome.detail : "",
      );
      throw new AiFailed();
    }
    const text = typeof brief === "string" ? brief : "";
    return {
      reading: outcome.interpretation,
      seal: sealReading(requireEnv("BETTER_AUTH_SECRET"), text, outcome.interpretation),
    };
  }, "ai-read");
}
