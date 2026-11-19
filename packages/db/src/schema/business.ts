import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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

/**
 * What the `business-read` job gave for one intake (ORV-283, tech notes section 5.2): the readings
 * with the words they rest on, or the reason there is none. One row per intake and job, so a second
 * call can never re-read the same answers. Written and read only through `businessService` in
 * @orivilo/auth, inside `withWorkspace`; the record is parsed by the engine's `businessReadingSchema`
 * before every insert and after every read. A row is never changed: the app role may insert and
 * select, never update or delete (migration 0011). The intake row is untouched by a reading.
 */
export const businessReading = pgTable(
  "business_reading",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    intakeId: text("intake_id").notNull(),
    /** The app schema closes it to `business-read`; the database keeps a short name. */
    job: text("job").notNull(),
    method: text("method").notNull(),
    /** Why a `rule-based` record has no reading; null for a `model` record. */
    reason: text("reason"),
    modelId: text("model_id"),
    adapterId: text("adapter_id"),
    adapterVersion: text("adapter_version"),
    promptVersion: text("prompt_version"),
    /** `InputEvidence[]`, at most 200 items; free text a person wrote sits inside the quotes. */
    evidence: jsonb("evidence")
      .notNull()
      .default(sql`'[]'::jsonb`),
    // A plain id, not a foreign key: a record keeps who wrote it after they leave (as direction_version).
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    // The pair proves the reading sits in its intake's workspace.
    foreignKey({
      columns: [t.intakeId, t.workspaceId],
      foreignColumns: [businessIntake.id, businessIntake.workspaceId],
      name: "business_reading_intake_fk",
    }).onDelete("cascade"),
    index("business_reading_workspaceId_idx").on(t.workspaceId),
    unique("business_reading_one_per_job").on(t.intakeId, t.job),
    check("business_reading_job_check", sql`char_length(${t.job}) between 1 and 40`),
    check("business_reading_method_check", sql`${t.method} in ('model', 'rule-based')`),
    check(
      "business_reading_reason_check",
      sql`${t.reason} is null or ${t.reason} in ('ai-not-configured', 'ai-failed', 'ai-rate-limited', 'ai-spend-cap')`,
    ),
    check(
      "business_reading_model_id_check",
      sql`${t.modelId} is null or char_length(${t.modelId}) between 1 and 200`,
    ),
    check(
      "business_reading_adapter_id_check",
      sql`${t.adapterId} is null or char_length(${t.adapterId}) between 1 and 40`,
    ),
    check(
      "business_reading_adapter_version_check",
      sql`${t.adapterVersion} is null or char_length(${t.adapterVersion}) between 1 and 40`,
    ),
    check(
      "business_reading_prompt_version_check",
      sql`${t.promptVersion} is null or char_length(${t.promptVersion}) between 1 and 40`,
    ),
    // A model record names its model, adapter and prompt and has no reason; a rule-based record is
    // not that, and holds no evidence.
    check(
      "business_reading_shape",
      sql`(${t.method} = 'model') = (${t.reason} is null and ${t.modelId} is not null and ${t.adapterId} is not null and ${t.adapterVersion} is not null and ${t.promptVersion} is not null) and (${t.method} <> 'rule-based' or ${t.evidence} = '[]'::jsonb)`,
    ),
  ],
);

/**
 * What a person chose for the positioning statement of an intake (ORV-285, tech notes section 4.1):
 * one row per choice, insert only, keyed to the intake it was made on. The project is the intake's,
 * so there is no project column. The newest row of a project is its current choice. At most one row
 * of kind `picked`, `edited` or `written` exists per intake, whatever the action did, so an agreed
 * positioning stays agreed; `skipped` rows may repeat. Written and read only through
 * `positioningService` in @orivilo/auth, inside `withWorkspace`; the app role may insert and select,
 * never update or delete (migration 0013).
 */
export const businessPositioningChoice = pgTable(
  "business_positioning_choice",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    intakeId: text("intake_id").notNull(),
    kind: text("kind").notNull(),
    /** The statement the person agreed; null for a skip. */
    statement: text("statement"),
    /** A plain id in this table's first form; a later draft table adds its foreign key. */
    draftId: text("draft_id"),
    option: smallint("option"),
    // A plain id, not a foreign key: a record keeps who wrote it after they leave (as business_intake).
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    // The pair proves the choice sits in its intake's workspace.
    foreignKey({
      columns: [t.intakeId, t.workspaceId],
      foreignColumns: [businessIntake.id, businessIntake.workspaceId],
      name: "business_positioning_choice_intake_fk",
    }).onDelete("cascade"),
    index("business_positioning_choice_workspaceId_idx").on(t.workspaceId),
    index("business_positioning_choice_intake_created_idx").on(t.intakeId, t.createdAt),
    // A second agreement on one intake fails in the database; skips may repeat.
    uniqueIndex("business_positioning_choice_one_agreed")
      .on(t.intakeId)
      .where(sql`${t.kind} <> 'skipped'`),
    check(
      "business_positioning_choice_kind_check",
      sql`${t.kind} in ('picked', 'edited', 'written', 'skipped')`,
    ),
    check(
      "business_positioning_choice_statement_check",
      sql`${t.statement} is null or char_length(${t.statement}) between 1 and 300`,
    ),
    check(
      "business_positioning_choice_option_check",
      sql`${t.option} is null or ${t.option} between 1 and 3`,
    ),
    check(
      "business_positioning_choice_shape",
      sql`(${t.kind} in ('picked', 'edited')) = (${t.draftId} is not null and ${t.option} is not null) and (${t.kind} <> 'skipped') = (${t.statement} is not null) and (${t.draftId} is null) = (${t.option} is null)`,
    ),
  ],
);
