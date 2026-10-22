import { z } from "zod";
import {
  type CuratedProfile,
  type DirectionsResult,
  recommendDirections,
  type RecommendOptions,
} from "./directions";
import { slugSchema } from "./knowledge";
import { adjustmentSchema, partialDecisionsSchema, RESOLVER_VERSION } from "./resolver";

/**
 * A saved direction (ORV-35). The snapshot keeps the inputs, not the output: the resolver is
 * deterministic (ADR 0007), so replaying the brief, locks and adjustments rebuilds the same
 * directions, and the fingerprint proves it did. A snapshot that no longer replays to the same
 * fingerprint is refused, never repaired.
 */

export const DEFAULT_CATALOG_VERSION = "catalog-1";

export const snapshotSchema = z
  .object({
    brief: z.string().trim().min(1).max(4000),
    locked: partialDecisionsSchema,
    adjustments: z.array(adjustmentSchema),
    /** The direction the person was viewing when they saved. */
    profileId: slugSchema,
    resolverVersion: z.string().min(1),
    catalogVersion: z.string().min(1),
    fingerprint: z.string().regex(/^[0-9a-f]{8}$/),
  })
  .strict();

export type Snapshot = z.infer<typeof snapshotSchema>;

export const DIRECTION_FILE_FORMAT = "orivilo.direction";

/** The export file: one version of a named direction. Importing it always makes a new draft. */
export const directionFileSchema = z
  .object({
    format: z.literal(DIRECTION_FILE_FORMAT),
    schemaVersion: z.literal("1.0"),
    name: z.string().trim().min(1).max(120),
    version: z
      .object({
        status: z.enum(["draft", "approved"]),
        number: z.number().int().positive().nullable(),
      })
      .strict(),
    snapshot: snapshotSchema,
  })
  .strict();

export type DirectionFile = z.infer<typeof directionFileSchema>;

export interface SnapshotInput {
  brief: string;
  profileId: string;
  locked?: RecommendOptions["locked"];
  adjustments?: RecommendOptions["adjustments"];
}

const optionsFor = (
  profiles: readonly CuratedProfile[],
  s: Pick<Snapshot, "locked" | "adjustments" | "catalogVersion">,
): RecommendOptions => ({
  profiles,
  locked: s.locked,
  adjustments: s.adjustments,
  catalogVersion: s.catalogVersion,
});

/** Takes a snapshot of what the Studio shows, with the fingerprint the resolver gives it now. */
export function takeSnapshot(input: SnapshotInput, profiles: readonly CuratedProfile[]): Snapshot {
  const base = {
    brief: input.brief.trim(),
    locked: input.locked ?? {},
    adjustments: input.adjustments ?? [],
    catalogVersion: DEFAULT_CATALOG_VERSION,
  };
  const result = recommendDirections(base.brief, optionsFor(profiles, base));
  return snapshotSchema.parse({
    ...base,
    profileId: input.profileId,
    resolverVersion: result.resolution.resolverVersion,
    fingerprint: result.resolution.fingerprint,
  });
}

export type ReplayRefusal = "resolver-changed" | "profile-missing" | "fingerprint-mismatch";

export type Replay =
  { ok: true; result: DirectionsResult; profileId: string } | { ok: false; reason: ReplayRefusal };

/** Rebuilds a snapshot's directions, or says why it cannot be trusted to give the same look. */
export function replaySnapshot(snapshot: Snapshot, profiles: readonly CuratedProfile[]): Replay {
  if (snapshot.resolverVersion !== RESOLVER_VERSION) {
    return { ok: false, reason: "resolver-changed" };
  }
  const result = recommendDirections(snapshot.brief, optionsFor(profiles, snapshot));
  if (!result.directions.some((d) => d.profileId === snapshot.profileId)) {
    return { ok: false, reason: "profile-missing" };
  }
  if (result.resolution.fingerprint !== snapshot.fingerprint) {
    return { ok: false, reason: "fingerprint-mismatch" };
  }
  return { ok: true, result, profileId: snapshot.profileId };
}
