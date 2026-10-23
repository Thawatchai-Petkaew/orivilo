import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, desc, direction, directionVersion, eq, sql } from "@orivilo/db";
import type { Tx } from "@orivilo/db/client";
import {
  adjustmentSchema,
  type CuratedProfile,
  DIRECTION_FILE_FORMAT,
  type DirectionFile,
  directionFileSchema,
  type Interpretation,
  interpretationSchema,
  partialDecisionsSchema,
  type ReplayRefusal,
  replaySnapshot,
  type Snapshot,
  snapshotSchema,
  takeSnapshot,
} from "@orivilo/intent-engine";
import { z } from "zod";
import { type AccessDeps, withWorkspace } from "./access.ts";

/**
 * Saved directions (ORV-35), every call through the one door (ADR 0002). Members save drafts and
 * read; approving needs an admin or the owner. The server takes the snapshot itself, so the
 * fingerprint it stores is the resolver's, never the client's. The database refuses any change to
 * an approved version (migration 0003), so this code cannot change one by mistake either.
 */

export class DirectionError extends Error {
  readonly reason: "invalid-input" | "invalid-file" | "not-found" | "no-draft" | ReplayRefusal;
  constructor(reason: DirectionError["reason"]) {
    super(`direction refused: ${reason}`);
    this.name = "DirectionError";
    this.reason = reason;
  }
}

const nameSchema = z.string().trim().min(1).max(120);

export const saveInputSchema = z
  .object({
    directionId: z.string().min(1).optional(),
    name: nameSchema,
    brief: z.string().trim().min(1).max(4000),
    profileId: z.string().min(1),
    locked: partialDecisionsSchema.optional(),
    adjustments: z.array(adjustmentSchema).optional(),
    /** A model's reading of the brief, with the seal the server gave it when it read (ORV-62). */
    reading: interpretationSchema.optional(),
    seal: z.string().max(100).optional(),
  })
  .strict();

export type SaveInput = z.input<typeof saveInputSchema>;

export interface VersionSummary {
  id: string;
  status: "draft" | "approved";
  number: number | null;
  fingerprint: string;
  createdAt: Date;
  approvedAt: Date | null;
}

export interface DirectionSummary {
  id: string;
  name: string;
  updatedAt: Date;
  versions: VersionSummary[];
}

export interface SavedVersion {
  directionId: string;
  name: string;
  version: VersionSummary;
  snapshot: Snapshot;
}

const parse = <T>(schema: z.ZodType<T>, value: unknown, reason: DirectionError["reason"]) => {
  const result = schema.safeParse(value);
  if (!result.success) throw new DirectionError(reason);
  return result.data;
};

/** Writes the one draft of a direction: updates it when there is one, adds it otherwise. */
async function writeDraft(
  tx: Tx,
  ids: { workspaceId: string; userId: string; directionId: string },
  snapshot: Snapshot,
) {
  const [updated] = await tx
    .update(directionVersion)
    .set({ snapshot, fingerprint: snapshot.fingerprint, createdBy: ids.userId })
    .where(
      and(eq(directionVersion.directionId, ids.directionId), eq(directionVersion.status, "draft")),
    )
    .returning({ id: directionVersion.id });
  if (updated) return updated.id;
  const id = randomUUID();
  await tx.insert(directionVersion).values({
    id,
    directionId: ids.directionId,
    workspaceId: ids.workspaceId,
    status: "draft",
    snapshot,
    fingerprint: snapshot.fingerprint,
    createdBy: ids.userId,
  });
  return id;
}

async function newDirection(
  tx: Tx,
  ids: { workspaceId: string; userId: string },
  name: string,
  snapshot: Snapshot,
) {
  const directionId = randomUUID();
  await tx
    .insert(direction)
    .values({ id: directionId, workspaceId: ids.workspaceId, name, createdBy: ids.userId });
  const versionId = await writeDraft(tx, { ...ids, directionId }, snapshot);
  return { directionId, versionId, fingerprint: snapshot.fingerprint };
}

const summary = (row: typeof directionVersion.$inferSelect): VersionSummary => ({
  id: row.id,
  status: row.status,
  number: row.number,
  fingerprint: row.fingerprint,
  createdAt: row.createdAt,
  approvedAt: row.approvedAt,
});

/**
 * Seals a reading the server made for a brief. A save that carries a reading must carry its seal,
 * so a client cannot save a reading it wrote itself and have it shown as read by AI. Both sides
 * seal the schema-parsed reading, so key order is the schema's.
 */
export function sealReading(key: string, brief: string, reading: Interpretation): string {
  return createHmac("sha256", key)
    .update(JSON.stringify([brief.trim(), reading]))
    .digest("base64url");
}

function sealMatches(key: string | undefined, input: z.output<typeof saveInputSchema>) {
  if (!input.reading) return input.seal === undefined;
  if (!key || !input.seal) return false;
  const expected = Buffer.from(sealReading(key, input.brief, input.reading));
  const given = Buffer.from(input.seal);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export interface DirectionServiceOptions {
  /** The key that seals model readings; without one, a save with a reading is refused. */
  sealKey?: string;
}

export function directionService(
  deps: AccessDeps,
  profiles: readonly CuratedProfile[],
  options: DirectionServiceOptions = {},
) {
  /** The snapshot the server stands behind, or the reason it cannot. */
  const snapshotOf = (input: z.output<typeof saveInputSchema>) => {
    if (!sealMatches(options.sealKey, input)) throw new DirectionError("invalid-input");
    const snapshot = takeSnapshot(input, profiles);
    const replay = replaySnapshot(snapshot, profiles);
    if (!replay.ok) throw new DirectionError(replay.reason);
    return snapshot;
  };

  /** One version with its snapshot, validated before it is handed back. */
  const read = async (
    headers: Headers,
    workspaceId: string,
    versionId: string,
  ): Promise<SavedVersion> =>
    withWorkspace(deps, headers, workspaceId, "member", async ({ tx }) => {
      const [row] = await tx
        .select({ version: directionVersion, name: direction.name })
        .from(directionVersion)
        .innerJoin(direction, eq(direction.id, directionVersion.directionId))
        .where(eq(directionVersion.id, versionId));
      if (!row) throw new DirectionError("not-found");
      const snapshot = parse(snapshotSchema, row.version.snapshot, "invalid-file");
      return {
        directionId: row.version.directionId,
        name: row.name,
        version: summary(row.version),
        snapshot,
      };
    });

  return {
    read,

    /** Saves the Studio as the direction's draft; without an id it starts a new direction. */
    async saveDraft(headers: Headers, workspaceId: string, raw: unknown) {
      const input = parse(saveInputSchema, raw, "invalid-input");
      const snapshot = snapshotOf(input);
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx, userId }) => {
        if (!input.directionId)
          return newDirection(tx, { workspaceId, userId }, input.name, snapshot);
        const [found] = await tx
          .update(direction)
          .set({ name: input.name, updatedAt: new Date() })
          .where(eq(direction.id, input.directionId))
          .returning({ id: direction.id });
        if (!found) throw new DirectionError("not-found");
        const ids = { workspaceId, userId, directionId: found.id };
        const versionId = await writeDraft(tx, ids, snapshot);
        return { directionId: found.id, versionId, fingerprint: snapshot.fingerprint };
      });
    },

    /** Turns the draft into the next numbered version. Admins and the owner only. */
    async approve(headers: Headers, workspaceId: string, directionId: string) {
      return withWorkspace(deps, headers, workspaceId, "admin", async ({ tx, userId }) => {
        // Locks the direction so two approvals cannot take the same number.
        const [found] = await tx
          .select({ id: direction.id })
          .from(direction)
          .where(eq(direction.id, directionId))
          .for("update");
        if (!found) throw new DirectionError("not-found");
        const [{ last }] = (await tx
          .select({ last: sql<number>`coalesce(max(${directionVersion.number}), 0)::int` })
          .from(directionVersion)
          .where(eq(directionVersion.directionId, directionId))) as [{ last: number }];
        const now = new Date();
        const [approved] = await tx
          .update(directionVersion)
          .set({ status: "approved", number: last + 1, approvedBy: userId, approvedAt: now })
          .where(
            and(
              eq(directionVersion.directionId, directionId),
              eq(directionVersion.status, "draft"),
            ),
          )
          .returning({ id: directionVersion.id, number: directionVersion.number });
        if (!approved) throw new DirectionError("no-draft");
        await tx.update(direction).set({ updatedAt: now }).where(eq(direction.id, directionId));
        return { versionId: approved.id, number: last + 1 };
      });
    },

    /** The workspace's directions, newest first, each with its versions in order. */
    async list(headers: Headers, workspaceId: string): Promise<DirectionSummary[]> {
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx }) => {
        const directions = await tx.select().from(direction).orderBy(desc(direction.updatedAt));
        const versions = await tx
          .select()
          .from(directionVersion)
          .orderBy(asc(directionVersion.number), asc(directionVersion.createdAt));
        return directions.map((d) => ({
          id: d.id,
          name: d.name,
          updatedAt: d.updatedAt,
          versions: versions.filter((v) => v.directionId === d.id).map(summary),
        }));
      });
    },

    /** The export file for one version. */
    async exportFile(headers: Headers, workspaceId: string, versionId: string) {
      const saved = await read(headers, workspaceId, versionId);
      const file: DirectionFile = {
        format: DIRECTION_FILE_FORMAT,
        schemaVersion: "1.0",
        name: saved.name,
        version: { status: saved.version.status, number: saved.version.number },
        snapshot: saved.snapshot,
      };
      return file;
    },

    /** Imports a file as a new direction with one draft, only when it replays to its fingerprint. */
    async importFile(headers: Headers, workspaceId: string, raw: unknown) {
      const file = parse(directionFileSchema, raw, "invalid-file");
      const replay = replaySnapshot(file.snapshot, profiles);
      if (!replay.ok) throw new DirectionError(replay.reason);
      return withWorkspace(deps, headers, workspaceId, "member", ({ tx, userId }) =>
        newDirection(tx, { workspaceId, userId }, file.name, file.snapshot),
      );
    },
  };
}

export type DirectionService = ReturnType<typeof directionService>;
