import { randomUUID } from "node:crypto";
import {
  and,
  businessDraft,
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
  checkDraftAgainst,
  POSITIONING_DRAFT_JOB,
  type PositioningDraft,
  positioningDraftSchema,
  settleEdit,
  type StoredChoice,
  type StoredDraft,
  type StoredIntake,
  storedChoiceSchema,
} from "@orivilo/intent-engine";
import { type AccessDeps, withWorkspace } from "./access.ts";
import { BusinessError, storedIntakeOfRow } from "./business.ts";

/**
 * The positioning of a business project (ORV-285 tech notes sections 4.1, 4.2 and 7), every call
 * through the one door (ADR 0002). A choice is one inserted row keyed to the intake it was made on;
 * a row is never changed, and the project's newest row is its current choice. A draft (ORV-292) is
 * one inserted row per intake and job, a proposal that is never a value: only a choice row holds a
 * statement the gate counts. A row read back is parsed again, so one changed outside the app fails
 * as `invalid-stored` and never shows as an unchecked statement or unchecked quotes. Nothing here
 * reaches a log line: the callers log closed words only.
 */

/** A draft row as its stored form with its row id, parsed again and checked against the saved answers. */
function storedDraftOf(row: typeof businessDraft.$inferSelect, answers: StoredIntake): StoredDraft {
  const parsed = positioningDraftSchema.safeParse({
    job: row.job,
    intakeId: row.intakeId,
    modelId: row.modelId,
    adapter: { id: row.adapterId, version: row.adapterVersion },
    promptVersion: row.promptVersion,
    options: row.options,
  });
  if (!parsed.success || !checkDraftAgainst(parsed.data, answers)) {
    throw new BusinessError("invalid-stored");
  }
  return { ...parsed.data, id: row.id };
}

/**
 * The positioning of a project: its newest choice across its intakes and the draft of its newest
 * intake, each parsed again. The join proves the choice's intake belongs to the project; the order
 * is the time it was saved, then its id. A draft of an older intake is not read.
 */
export async function readPositioning(
  tx: Tx,
  workspaceId: string,
  projectId: string,
  newest: { id: string; answers: StoredIntake },
): Promise<{ intakeId: string; choice: StoredChoice | null; draft: StoredDraft | null }> {
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
  let choice: StoredChoice | null = null;
  if (row) {
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
    choice = parsed.data;
  }
  const [drafted] = await tx
    .select()
    .from(businessDraft)
    .where(
      and(
        eq(businessDraft.intakeId, newest.id),
        eq(businessDraft.workspaceId, workspaceId),
        eq(businessDraft.job, POSITIONING_DRAFT_JOB),
      ),
    )
    .limit(1);
  return {
    intakeId: newest.id,
    choice,
    draft: drafted ? storedDraftOf(drafted, newest.answers) : null,
  };
}

export function positioningService(deps: AccessDeps) {
  return {
    /**
     * Saves one choice for the newest intake of a project of the workspace, in one transaction that
     * locks the project row first and then reads and writes the rows (row 30): two choices sent at the
     * same moment queue on the lock, so each meets the rows the one before it left, and the row's time
     * is the insert's own (`clock_timestamp()`, not the transaction's start), so the later choice is
     * the later row. `raw` goes through the engine's `checkChoice` again, so this door holds the
     * bounds whatever the caller did before it. A project or intake that is not in the workspace is
     * `not-found`, one answer with an unknown id; an agreed choice already on the newest intake is
     * `gate-passed` (D4). A `picked` or an `edited` choice names a draft of the newest intake, in the
     * workspace, with that option, else `not-found`; the statement is copied from the stored draft
     * here and never taken from the caller. The database's one-agreed index still refuses a second
     * agreement, as `not-saved`.
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
        // The lock is taken before anything is read: a call that waits for it reads the rows the
        // holder committed, under read committed.
        const [found] = await tx
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.id, choice.projectId), eq(project.workspaceId, workspaceId)))
          .for("update");
        if (!found) throw new BusinessError("not-found");
        const [newest] = await tx
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

        let kind: ChoiceInput["kind"] = choice.kind;
        let statement: string | null = null;
        let draftId: string | null = null;
        let option: number | null = null;
        if (choice.kind === "written") {
          statement = choice.statement;
        } else if (choice.kind === "picked" || choice.kind === "edited") {
          const [row] = await tx
            .select()
            .from(businessDraft)
            .where(
              and(
                eq(businessDraft.id, choice.draftId),
                eq(businessDraft.intakeId, newest.id),
                eq(businessDraft.workspaceId, workspaceId),
                eq(businessDraft.job, POSITIONING_DRAFT_JOB),
              ),
            )
            .limit(1);
          if (!row) throw new BusinessError("not-found");
          const draft = storedDraftOf(row, storedIntakeOfRow(newest));
          const chosen = draft.options[choice.option - 1];
          if (!chosen) throw new BusinessError("not-found");
          draftId = draft.id;
          option = choice.option;
          if (choice.kind === "edited") {
            kind = settleEdit(chosen.statement, choice.statement);
            statement = kind === "picked" ? chosen.statement : choice.statement;
          } else {
            statement = chosen.statement;
          }
        }
        try {
          await tx.insert(businessPositioningChoice).values({
            id: randomUUID(),
            workspaceId,
            intakeId: newest.id,
            kind,
            statement,
            draftId,
            option,
            createdBy: userId,
            createdAt: sql`clock_timestamp()`,
          });
        } catch {
          throw new BusinessError("not-saved");
        }
        return { kind };
      });
    },

    /**
     * Saves the record of a `positioning-draft` for an intake of the workspace: one row per intake and
     * job, never changed. The record is parsed by the engine's `positioningDraftSchema` and its quotes
     * are checked against the saved answers first, so this door holds the record's shape whatever the
     * caller did before it. An intake that is not in the workspace is `not-found`. Any insert failure
     * is `not-saved`, a closed word, so no driver text, which holds the options, reaches a caller's log.
     */
    async saveDraft(
      headers: Headers,
      workspaceId: string,
      record: PositioningDraft,
    ): Promise<{ draftId: string }> {
      const checked = positioningDraftSchema.safeParse(record);
      if (!checked.success) throw new BusinessError("invalid-input");
      const draft = checked.data;
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx, userId }) => {
        const [row] = await tx
          .select()
          .from(businessIntake)
          .where(
            and(eq(businessIntake.id, draft.intakeId), eq(businessIntake.workspaceId, workspaceId)),
          );
        if (!row) throw new BusinessError("not-found");
        if (!checkDraftAgainst(draft, storedIntakeOfRow(row))) {
          throw new BusinessError("invalid-input");
        }
        const draftId = randomUUID();
        try {
          await tx.insert(businessDraft).values({
            id: draftId,
            workspaceId,
            intakeId: draft.intakeId,
            job: draft.job,
            modelId: draft.modelId,
            adapterId: draft.adapter.id,
            adapterVersion: draft.adapter.version,
            promptVersion: draft.promptVersion,
            options: draft.options,
            createdBy: userId,
          });
        } catch {
          throw new BusinessError("not-saved");
        }
        return { draftId };
      });
    },
  };
}

export type PositioningService = ReturnType<typeof positioningService>;
