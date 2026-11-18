import { sql } from "drizzle-orm";
import { check, foreignKey, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization } from "./auth.ts";
import { project } from "./workspace.ts";

/**
 * What a person told ORIVILO about their business (ORV-281): one row per submission, one column
 * per answer. Workspace data, written and read only through `businessService` in @orivilo/auth,
 * inside `withWorkspace`. A row is never changed: the app role may insert and select, never
 * update or delete (migration 0009), and the newest row of a project is its current intake. The
 * intake points at no reading, so a later job adds its own rows and leaves this table as it is.
 */
export const businessIntake = pgTable(
  "business_intake",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull(),
    /** `INTAKE_VERSION` of the engine's stored form; the stored form is parsed again on every read. */
    version: text("version").notNull(),
    idea: text("idea").notNull(),
    industry: text("industry"),
    customers: text("customers"),
    problem: text("problem"),
    competitors: text("competitors"),
    value: text("value"),
    /** Checked and kept as an address, never read (`website-input-1`). */
    website: text("website"),
    // A plain id, not a foreign key: a record keeps who wrote it after they leave (as direction_version).
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    // The pair proves the intake sits in its project's workspace.
    foreignKey({
      columns: [t.projectId, t.workspaceId],
      foreignColumns: [project.id, project.workspaceId],
      name: "business_intake_project_fk",
    }).onDelete("cascade"),
    index("business_intake_workspaceId_idx").on(t.workspaceId),
    index("business_intake_project_created_idx").on(t.projectId, t.createdAt),
    // Lets a later reading's foreign key prove it sits in its intake's workspace.
    unique("business_intake_id_workspace_unique").on(t.id, t.workspaceId),
    check("business_intake_version_check", sql`${t.version} = 'intake-1'`),
    check("business_intake_idea_check", sql`char_length(${t.idea}) between 1 and 2000`),
    check(
      "business_intake_industry_check",
      sql`${t.industry} is null or char_length(${t.industry}) between 1 and 2000`,
    ),
    check(
      "business_intake_customers_check",
      sql`${t.customers} is null or char_length(${t.customers}) between 1 and 2000`,
    ),
    check(
      "business_intake_problem_check",
      sql`${t.problem} is null or char_length(${t.problem}) between 1 and 2000`,
    ),
    check(
      "business_intake_competitors_check",
      sql`${t.competitors} is null or char_length(${t.competitors}) between 1 and 2000`,
    ),
    check(
      "business_intake_value_check",
      sql`${t.value} is null or char_length(${t.value}) between 1 and 2000`,
    ),
    check(
      "business_intake_website_check",
      sql`${t.website} is null or char_length(${t.website}) between 1 and 2048`,
    ),
  ],
);
