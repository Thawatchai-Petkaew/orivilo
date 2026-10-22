import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.ts";

/**
 * Saved directions (ORV-35). A direction is a named decision in a workspace; its versions are
 * snapshots of the Studio's inputs. A version is a draft until approved, then numbered and never
 * changed: migration 0003 adds a trigger that refuses any update of an approved row.
 */
export const direction = pgTable(
  "direction",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("direction_workspaceId_idx").on(table.workspaceId),
    // Lets a version's foreign key prove it sits in its direction's workspace.
    unique("direction_id_workspace_unique").on(table.id, table.workspaceId),
  ],
);

export const directionVersion = pgTable(
  "direction_version",
  {
    id: text("id").primaryKey(),
    directionId: text("direction_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    status: text("status", { enum: ["draft", "approved"] }).notNull(),
    /** 1, 2, 3 in approval order; null while a draft. */
    number: integer("number"),
    /** A `Snapshot` from `@orivilo/intent-engine`, validated before every write. */
    snapshot: jsonb("snapshot").notNull(),
    /** The resolver's fingerprint, recomputed on the server. */
    fingerprint: text("fingerprint").notNull(),
    // Plain ids, not foreign keys: an approved record keeps who made it even after they leave.
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.directionId, table.workspaceId],
      foreignColumns: [direction.id, direction.workspaceId],
      name: "direction_version_direction_fk",
    }).onDelete("cascade"),
    index("direction_version_workspaceId_idx").on(table.workspaceId),
    uniqueIndex("direction_version_one_draft")
      .on(table.directionId)
      .where(sql`${table.status} = 'draft'`),
    unique("direction_version_number_unique").on(table.directionId, table.number),
    check(
      "direction_version_approved_shape",
      sql`(${table.status} = 'approved') = (${table.number} is not null and ${table.approvedBy} is not null and ${table.approvedAt} is not null)`,
    ),
  ],
);
