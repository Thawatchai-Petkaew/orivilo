import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth.ts";

/**
 * The first tenant table: a workspace's projects. Every tenant table carries `workspace_id`, and
 * row security limits `orivilo_app` to the workspace the authorization helper set for the
 * transaction (migration 0001).
 */
export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("project_workspaceId_idx").on(table.workspaceId)],
);

/** Tables that hold one workspace's data; the policy test walks this list. */
export const TENANT_TABLES = ["project", "direction", "direction_version"] as const;
