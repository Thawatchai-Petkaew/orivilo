"use server";

import {
  Denied,
  DirectionError,
  type DirectionSummary,
  directionService,
  type Role,
  withWorkspace,
} from "@orivilo/auth";
import { MissingEnvError } from "@orivilo/db";
import { CURATED_PROFILES, type DirectionStudioState } from "@orivilo/design-system";
import { type DirectionFile, replaySnapshot, type ReplayRefusal } from "@orivilo/intent-engine";
import { headers } from "next/headers";
import { accessDeps, auth } from "../../server/auth";

/**
 * Saved directions for the Studio (ORV-35 part 2). Every call goes through `directionService`, so
 * the session, the workspace and the role are checked on the server; the workspace is the
 * session's active one, never a value from the client. Failures come back as a reason the page
 * can say in words.
 */

export type ActionError =
  "signed-out" | "forbidden" | "not-configured" | "failed" | DirectionError["reason"];

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
}

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
    const service = directionService(accessDeps(), CURATED_PROFILES);
    return { ok: true, value: await fn(service, h, session.session.activeOrganizationId) };
  } catch (error) {
    if (error instanceof Denied) {
      return { ok: false, error: error.status === 401 ? "signed-out" : "forbidden" };
    }
    if (error instanceof DirectionError) return { ok: false, error: error.reason };
    if (error instanceof MissingEnvError) return { ok: false, error: "not-configured" };
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
    const { brief, profileId, locked, adjustments } = saved.snapshot;
    const replay = replaySnapshot(saved.snapshot, CURATED_PROFILES);
    return {
      directionId: saved.directionId,
      name: saved.name,
      status: saved.version.status,
      number: saved.version.number,
      state: { brief, profileId, locked, adjustments },
      replay: replay.ok ? null : replay.reason,
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
