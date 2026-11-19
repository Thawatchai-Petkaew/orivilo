import { randomUUID } from "node:crypto";
import { and, businessIntake, businessReading, desc, eq, project, sql } from "@orivilo/db";
import {
  BUSINESS_READ_JOB,
  type BusinessReading,
  businessReadingSchema,
  checkIntake,
  INTAKE_VERSION,
  type StoredIntake,
  storedIntakeSchema,
} from "@orivilo/intent-engine";
import { type AccessDeps, withWorkspace } from "./access.ts";

/**
 * Business projects (ORV-281), every call through the one door (ADR 0002). A project and its
 * intake are written in one transaction; an intake row is never changed, and the newest row of a
 * project is its current intake. The reading of an intake (ORV-283) is one more row, saved once
 * and replayed on every open, never made again. The stored form of an intake and of a reading is
 * parsed again on every read, so a row changed outside the app fails as `invalid-stored` and never
 * shows as unchecked text. Nothing here reaches a log line: the callers log closed words only.
 */

export class BusinessError extends Error {
  /**
   * `not-found` is one answer for a project of another workspace, an unknown id and a project
   * with no intake (`.claude/rules/security.md` rule 9). `not-saved` is a reading the database
   * refused (a second one for the intake and job, an intake of another workspace); the message is
   * a closed word, so no driver text, which holds the record's answers, reaches a caller's log.
   */
  readonly reason: "invalid-input" | "not-found" | "invalid-stored" | "not-saved";
  constructor(reason: BusinessError["reason"]) {
    super(`business refused: ${reason}`);
    this.name = "BusinessError";
    this.reason = reason;
  }
}

/** The most projects `list` returns; the bound is ours, paging waits until a workspace has more. */
export const BUSINESS_LIST_LIMIT = 100;

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: Date;
}

export interface OpenedProject {
  project: ProjectSummary;
  /** The id of the project's newest intake: the record of a reading names it. */
  intakeId: string;
  /** The project's newest intake, parsed again. */
  intake: StoredIntake;
  /** When that intake was saved (`business_intake.created_at`, with a time zone). */
  savedAt: Date;
  /** That intake's saved `business-read` record, parsed again, or null when none was saved. */
  reading: BusinessReading | null;
}

export function businessService(deps: AccessDeps) {
  return {
    /**
     * Saves a project and its first intake in the workspace. `raw` goes through the engine's
     * `checkIntake` again, so this door holds the bounds whatever the caller did before it.
     */
    async create(
      headers: Headers,
      workspaceId: string,
      raw: unknown,
    ): Promise<{ projectId: string }> {
      const checked = checkIntake(raw);
      if (!checked.ok) throw new BusinessError("invalid-input");
      const { projectName, ...answers } = checked.intake;
      const stored = storedIntakeSchema.safeParse({ version: INTAKE_VERSION, ...answers });
      if (!stored.success) throw new BusinessError("invalid-input");
      const intake = stored.data;
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx, userId }) => {
        const projectId = randomUUID();
        await tx
          .insert(project)
          .values({ id: projectId, workspaceId, name: projectName, createdBy: userId });
        await tx.insert(businessIntake).values({
          id: randomUUID(),
          workspaceId,
          projectId,
          version: intake.version,
          idea: intake.idea,
          industry: intake.industry,
          customers: intake.customers,
          problem: intake.problem,
          competitors: intake.competitors,
          value: intake.value,
          website: intake.website,
          createdBy: userId,
        });
        return { projectId };
      });
    },

    /** The workspace's projects that have an intake, newest first, at most `BUSINESS_LIST_LIMIT`. */
    async list(headers: Headers, workspaceId: string): Promise<ProjectSummary[]> {
      return withWorkspace(deps, headers, workspaceId, "member", ({ tx }) =>
        tx
          .select({ id: project.id, name: project.name, createdAt: project.createdAt })
          .from(project)
          .where(
            and(
              eq(project.workspaceId, workspaceId),
              sql`exists (select 1 from ${businessIntake} where ${businessIntake.projectId} = ${project.id})`,
            ),
          )
          .orderBy(desc(project.createdAt), desc(project.id))
          .limit(BUSINESS_LIST_LIMIT),
      );
    },

    /**
     * Saves the record of a `business-read` for an intake of the workspace: one row per intake and
     * job, never changed. The record is checked by the engine's `businessReadingSchema` first, so
     * this door holds its shape whatever the caller did before it. The intake row is not touched.
     */
    async saveReading(headers: Headers, workspaceId: string, record: BusinessReading) {
      const checked = businessReadingSchema.safeParse(record);
      if (!checked.success) throw new BusinessError("invalid-input");
      const saved = checked.data;
      await withWorkspace(deps, headers, workspaceId, "member", async ({ tx, userId }) => {
        try {
          await tx.insert(businessReading).values({
            id: randomUUID(),
            workspaceId,
            intakeId: saved.intakeId,
            job: saved.job,
            method: saved.method,
            reason: saved.method === "rule-based" ? saved.reason : null,
            modelId: saved.method === "model" ? saved.modelId : null,
            adapterId: saved.method === "model" ? saved.adapter.id : null,
            adapterVersion: saved.method === "model" ? saved.adapter.version : null,
            promptVersion: saved.method === "model" ? saved.promptVersion : null,
            evidence: saved.method === "model" ? saved.items : [],
            createdBy: userId,
          });
        } catch {
          throw new BusinessError("not-saved");
        }
      });
    },

    /**
     * One project with its newest intake and that intake's saved reading. Never calls a model: a
     * project with no saved reading opens with `reading: null`.
     */
    async open(headers: Headers, workspaceId: string, projectId: string): Promise<OpenedProject> {
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx }) => {
        const [found] = await tx
          .select({ id: project.id, name: project.name, createdAt: project.createdAt })
          .from(project)
          .where(and(eq(project.id, projectId), eq(project.workspaceId, workspaceId)));
        if (!found) throw new BusinessError("not-found");
        const [row] = await tx
          .select()
          .from(businessIntake)
          .where(
            and(
              eq(businessIntake.projectId, found.id),
              eq(businessIntake.workspaceId, workspaceId),
            ),
          )
          .orderBy(desc(businessIntake.createdAt), desc(businessIntake.id))
          .limit(1);
        if (!row) throw new BusinessError("not-found");
        const intake = storedIntakeSchema.safeParse({
          version: row.version,
          idea: row.idea,
          industry: row.industry ?? undefined,
          customers: row.customers ?? undefined,
          problem: row.problem ?? undefined,
          competitors: row.competitors ?? undefined,
          value: row.value ?? undefined,
          website: row.website ?? undefined,
        });
        if (!intake.success) throw new BusinessError("invalid-stored");
        const [saved] = await tx
          .select()
          .from(businessReading)
          .where(
            and(
              eq(businessReading.intakeId, row.id),
              eq(businessReading.workspaceId, workspaceId),
              eq(businessReading.job, BUSINESS_READ_JOB),
            ),
          )
          .limit(1);
        let reading: BusinessReading | null = null;
        if (saved) {
          // The record is rebuilt from its columns and its evidence, so a column that disagrees
          // with the evidence it sits beside fails the schema's own checks.
          const parsed = businessReadingSchema.safeParse(
            saved.method === "model"
              ? {
                  method: saved.method,
                  job: saved.job,
                  intakeId: saved.intakeId,
                  modelId: saved.modelId,
                  adapter: { id: saved.adapterId, version: saved.adapterVersion },
                  promptVersion: saved.promptVersion,
                  items: saved.evidence,
                }
              : {
                  method: saved.method,
                  job: saved.job,
                  intakeId: saved.intakeId,
                  reason: saved.reason,
                },
          );
          if (!parsed.success) throw new BusinessError("invalid-stored");
          reading = parsed.data;
        }
        return {
          project: found,
          intakeId: row.id,
          intake: intake.data,
          savedAt: row.createdAt,
          reading,
        };
      });
    },
  };
}

export type BusinessService = ReturnType<typeof businessService>;
