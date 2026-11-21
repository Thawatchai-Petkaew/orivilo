import { randomUUID } from "node:crypto";
import { and, businessFoundationEntry, businessIntake, desc, eq, project } from "@orivilo/db";
import type { Tx } from "@orivilo/db/client";
import {
  checkEntry,
  entryAllowed,
  foundationState,
  positioningGate,
  type StoredEntry,
  storedEntrySchema,
} from "@orivilo/intent-engine";
import { type AccessDeps, withWorkspace } from "./access.ts";
import { BusinessError } from "./business.ts";
import { readPositioning } from "./positioning.ts";

/**
 * The brand foundation entries of a business project (ORV-291 tech notes sections 4 and 8), every
 * call through the one door (ADR 0002). An entry is one inserted row keyed to the project; a row is
 * never changed, and the newest row of a node is its current entry. A row read back is parsed again,
 * so one changed outside the app fails as `invalid-stored` and never shows as an unchecked answer.
 * Nothing here reaches a log line or an error message: the callers log closed words only, and no
 * answer, name, statement or axis value is in any `BusinessError`.
 */

/**
 * The most rows `readFoundation` returns. The unique index bounds a project to seven, so this is a
 * guard against a table changed outside the app, not a page size.
 */
const READ_LIMIT = 24;

/**
 * The project's entries, newest first (`created_at` desc, then `id` desc), each parsed again.
 * Must run inside `withWorkspace`; the workspace condition is the helper's row security's second
 * wall (security rule 2).
 */
export async function readFoundation(
  tx: Tx,
  workspaceId: string,
  projectId: string,
): Promise<StoredEntry[]> {
  const rows = await tx
    .select()
    .from(businessFoundationEntry)
    .where(
      and(
        eq(businessFoundationEntry.projectId, projectId),
        eq(businessFoundationEntry.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(businessFoundationEntry.createdAt), desc(businessFoundationEntry.id))
    .limit(READ_LIMIT);
  return rows.map((row) => {
    const parsed = storedEntrySchema.safeParse({
      id: row.id,
      node: row.node,
      kind: row.kind,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
    });
    if (!parsed.success) throw new BusinessError("invalid-stored");
    return parsed.data;
  });
}

export function foundationService(deps: AccessDeps) {
  return {
    /**
     * Saves one entry for a project of the workspace, in one transaction that locks the project row
     * (so two requests for one project run one after the other and the later one sees the earlier
     * row), then reads the newest intake, the positioning choice and the entries, and writes only
     * what the "Allowed when" column of `foundation-entry-1` allows now. `raw` goes through the
     * engine's `checkEntry` again, so this door holds the bounds whatever the caller did before it.
     * A project that is not in the workspace, an unknown id and a project with no intake are one
     * `not-found`; an entry its node's state does not allow is `out-of-order`; an insert the
     * database refused is `not-saved`, with a closed message that holds no driver text.
     */
    async enter(
      headers: Headers,
      workspaceId: string,
      raw: unknown,
    ): Promise<{ node: StoredEntry["node"]; kind: StoredEntry["kind"] }> {
      const checked = checkEntry(raw);
      if (!checked.ok) throw new BusinessError("invalid-input");
      const entry = checked.entry;
      return withWorkspace(deps, headers, workspaceId, "member", async ({ tx, userId }) => {
        // The lock: the row's time is taken at the insert after it, so the later request carries
        // the later time (`clock_timestamp()`), and a skip and a given entry racing on an empty
        // node cannot both pass the check below.
        const [found] = await tx
          .select({ id: project.id })
          .from(project)
          .where(and(eq(project.id, entry.projectId), eq(project.workspaceId, workspaceId)))
          .for("update");
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
        const choice = await readPositioning(tx, workspaceId, found.id);
        const entries = await readFoundation(tx, workspaceId, found.id);
        // The foundation reads no draft: `awaiting-choice` and `open` count the same.
        const gate = positioningGate({ newestIntakeId: newest.id, choice, draftOfNewest: false });
        if (!entryAllowed(entry, foundationState(gate, entries))) {
          throw new BusinessError("out-of-order");
        }
        const row = {
          id: randomUUID(),
          workspaceId,
          projectId: found.id,
          node: entry.node,
          kind: entry.kind,
          payload: entry.payload,
          createdBy: userId,
        };
        try {
          await tx.insert(businessFoundationEntry).values(row);
        } catch {
          throw new BusinessError("not-saved");
        }
        return { node: entry.node, kind: entry.kind };
      });
    },
  };
}

export type FoundationService = ReturnType<typeof foundationService>;
