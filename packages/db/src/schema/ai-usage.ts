import { sql } from "drizzle-orm";
import { bigint, check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth.ts";

/**
 * One row per request the server sent to OpenRouter (ORV-121). Workspace data: written and read
 * only through the spend cap helper in @orivilo/auth, inside `inWorkspace`. The app role may insert
 * and select, never update or delete (migration 0007). Holds no brief, prompt, answer, email or IP.
 */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // A plain id, not a foreign key: a record keeps who spent after they leave (as direction_version).
    userId: text("user_id").notNull(),
    job: text("job").notNull(),
    model: text("model").notNull(),
    /** Millionths of a US dollar (ADR 0015 decision 12, addition of 2026-10-29); null = not reported. */
    costMicroUsd: bigint("cost_micro_usd", { mode: "number" }),
    currency: text("currency").notNull().default("USD"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("ai_usage_workspace_created_idx").on(t.workspaceId, t.createdAt),
    check("ai_usage_job_check", sql`char_length(${t.job}) between 1 and 40`),
    check("ai_usage_model_check", sql`char_length(${t.model}) between 1 and 200`),
    check("ai_usage_cost_check", sql`${t.costMicroUsd} >= 0`),
    check("ai_usage_currency_check", sql`${t.currency} = 'USD'`),
  ],
);
