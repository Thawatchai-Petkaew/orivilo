"use server";

import {
  Denied,
  DirectionError,
  type DirectionSummary,
  directionService,
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

/**
 * Saved directions for the Studio (ORV-35 part 2). Every call goes through `directionService`, so
 * the session, the workspace and the role are checked on the server; the workspace is the
 * session's active one, never a value from the client. Failures come back as a reason the page
 * can say in words.
 */

export type ActionError =
  "signed-out" | "forbidden" | "not-configured" | "failed" | "ai-failed" | DirectionError["reason"];

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: ActionError };

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

class AiFailed extends Error {}

async function run<T>(
  fn: (
    service: ReturnType<typeof directionService>,
    h: Headers,
    workspaceId: string | null | undefined,
  ) => Promise<T>,
): Promise<Outcome<T>> {
  try {
    const h = await headers();
    const session = await auth().api.getSession({ headers: h });
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
    if (error instanceof AiFailed) return { ok: false, error: "ai-failed" };
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
  return run((service, h, workspaceId) => service.saveDraft(h, workspaceId ?? "", input));
}

/** Approves the direction's draft into the next version. The service requires an admin. */
export async function approveDirection(directionId: unknown) {
  return run((service, h, workspaceId) => service.approve(h, workspaceId ?? "", id(directionId)));
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
  return run((service, h, workspaceId) => service.importFile(h, workspaceId ?? "", file));
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
    if (!apiKey) throw new MissingEnvError("OPENROUTER_API_KEY");
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
      console.error("ai reading failed", outcome.error);
      throw new AiFailed();
    }
    const text = typeof brief === "string" ? brief : "";
    return {
      reading: outcome.interpretation,
      seal: sealReading(requireEnv("BETTER_AUTH_SECRET"), text, outcome.interpretation),
    };
  });
}
