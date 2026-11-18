import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
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
  (table) => [
    index("project_workspaceId_idx").on(table.workspaceId),
    // Lets a child row's foreign key prove it sits in its project's workspace (as direction).
    unique("project_id_workspace_unique").on(table.id, table.workspaceId),
    check("project_name_check", sql`char_length(${table.name}) between 1 and 120`),
  ],
);

/** Tables that hold one workspace's data; the policy test walks this list. */
export const TENANT_TABLES = [
  "project",
  "direction",
  "direction_version",
  "ai_usage",
  "business_intake",
  "business_reading",
  "business_positioning_choice",
] as const;
