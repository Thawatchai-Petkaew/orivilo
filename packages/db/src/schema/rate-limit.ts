import { sql } from "drizzle-orm";
import { bigint, check, index, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

/**
 * Shared rate limit counters (ORV-112, ADR 0015 decision 4). One row per key and window.
 * Not workspace data: no workspace_id. Written only through `createRateLimiter` in @orivilo/auth.
 */
export const rateLimitCounter = pgTable(
  "rate_limit_counter",
  {
    key: text("key").notNull(),
    windowStart: bigint("window_start", { mode: "number" }).notNull(), // Unix seconds
    windowEnd: bigint("window_end", { mode: "number" }).notNull(), // Unix seconds, exclusive
    count: integer("count").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.windowStart, t.windowEnd] }),
    index("rate_limit_counter_window_end_idx").on(t.windowEnd),
    check("rate_limit_counter_count_check", sql`${t.count} >= 1`),
    check("rate_limit_counter_window_check", sql`${t.windowEnd} > ${t.windowStart}`),
    check("rate_limit_counter_key_check", sql`char_length(${t.key}) <= 200`),
  ],
);
