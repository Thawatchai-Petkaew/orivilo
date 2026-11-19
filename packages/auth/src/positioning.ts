import { randomUUID } from "node:crypto";
import {
  and,
  businessIntake,
  businessPositioningChoice,
  desc,
  eq,
  project,
  sql,
} from "@orivilo/db";
import type { Tx } from "@orivilo/db/client";
import {
  type ChoiceInput,
  checkChoice,
  type StoredChoice,
  storedChoiceSchema,
} from "@orivilo/intent-engine";
import { type AccessDeps, withWorkspace } from "./access.ts";
import { BusinessError } from "./business.ts";

/**
 * The positioning choice of a business project (ORV-285 tech notes sections 4.1 and 7), every call
 * through the one door (ADR 0002). A choice is one inserted row keyed to the intake it was made on;
 * a row is never changed, and the project's newest row is its current choice. A row read back is
 * parsed again, so one changed outside the app fails as `invalid-stored` and never shows as an
 * unchecked statement. Nothing here reaches a log line: the callers log closed words only.
 */

/**
 * The project's newest choice, across its intakes, parsed again. The join proves the choice's
 * intake belongs to the project; the order is the time it was saved, then its id.
 */
export async function readPositioning(
  tx: Tx,
  workspaceId: string,
  projectId: string,
): Promise<StoredChoice | null> {
  const [row] = await tx
    .select({ choice: businessPositioningChoice })
    .from(businessPositioningChoice)
    .innerJoin(
      businessIntake,
      and(
        eq(businessIntake.id, businessPositioningChoice.intakeId),
        eq(businessIntake.workspaceId, businessPositioningChoice.workspaceId),
      ),
    )
    .where(
      and(
        eq(businessIntake.projectId, projectId),
        eq(businessPositioningChoice.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(businessPositioningChoice.createdAt), desc(businessPositioningChoice.id))
    .limit(1);
  if (!row) return null;
  const parsed = storedChoiceSchema.safeParse({
    id: row.choice.id,
    intakeId: row.choice.intakeId,
    kind: row.choice.kind,
    statement: row.choice.statement,
    draftId: row.choice.draftId,
    option: row.choice.option,
    createdAt: row.choice.createdAt.toISOString(),
  });
  if (!parsed.success) throw new BusinessError("invalid-stored");
  return parsed.data;
}

export function positioningService(deps: AccessDeps) {
  return {
    /**
     * Saves one choice for the newest intake of a project of the workspace, in one transaction that
     * reads and writes the same rows. `raw` goes through the engine's `checkChoice` again, so this
     * door holds the bounds whatever the caller did before it. A project or intake that is not in the
     * workspace is `not-found`, one answer with an unknown id; an agreed choice already on the newest
     * intake is `gate-passed` (D4). No draft table exists yet, so a `picked` or an `edited` choice
     * names a draft that cannot exist and is `not-found`. The database's one-agreed index refuses a
     * race the read missed, as `not-saved`.
     */
    async choose(
      headers: Headers,
      workspaceId: string,
      raw: unknown,
    ): Promise<{ kind: ChoiceInput["kind"] }> {
      const checked = checkChoice(raw);
      if (!checked.ok) throw new BusinessError("invalid-input");
      const choice = checked.choice;
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx, userId }) => {
        const [found] = await tx
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.id, choice.projectId), eq(project.workspaceId, workspaceId)));
        if (!found) throw new BusinessError("not-found");
        const [newest] = await tx
          .select({ id: businessIntake.id })
          .from(businessIntake)
          .where(
            and(
              eq(businessIntake.projectId, found.id),
              eq(businessIntake.workspaceId, workspaceId),
            ),
          )
          .orderBy(desc(businessIntake.createdAt), desc(businessIntake.id))
          .limit(1);
        if (!newest) throw new BusinessError("not-found");
        const [agreed] = await tx
          .select({ id: businessPositioningChoice.id })
          .from(businessPositioningChoice)
          .where(
            and(
              eq(businessPositioningChoice.intakeId, newest.id),
              eq(businessPositioningChoice.workspaceId, workspaceId),
              sql`${businessPositioningChoice.kind} <> 'skipped'`,
            ),
          )
          .limit(1);
        if (agreed) throw new BusinessError("gate-passed");
        if (choice.kind === "picked" || choice.kind === "edited") {
          throw new BusinessError("not-found");
        }
        try {
          await tx.insert(businessPositioningChoice).values({
            id: randomUUID(),
            workspaceId,
            intakeId: newest.id,
            kind: choice.kind,
            statement: choice.kind === "written" ? choice.statement : null,
            draftId: null,
            option: null,
            createdBy: userId,
          });
        } catch {
          throw new BusinessError("not-saved");
        }
        return { kind: choice.kind };
      });
    },
  };
}

export type PositioningService = ReturnType<typeof positioningService>;
