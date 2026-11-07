import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { is } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "./schema/index.ts";

// ADR 0015 decision 12: an amount of money is an integer in minor units and travels with its
// currency. A table that holds a `*_micro_usd` column holds a `currency` column beside it.
const tables = Object.values(schema as Record<string, unknown>)
  .filter((value) => is(value, PgTable))
  .map((table) => getTableConfig(table as PgTable));

describe("money columns", () => {
  it("finds the AI usage table among the tables it walks", () => {
    expect(tables.map((t) => t.name)).toContain("ai_usage");
  });

  it("gives every *_micro_usd column a currency column in its table", () => {
    const withAmount = tables.filter((t) => t.columns.some((c) => c.name.endsWith("_micro_usd")));
    expect(withAmount.length).toBeGreaterThan(0);
    const missing = withAmount
      .filter((t) => !t.columns.some((c) => c.name === "currency"))
      .map((t) => t.name);
    expect(missing).toEqual([]);
  });

  it("stores every *_micro_usd column as a bigint, never a float", () => {
    const wrong = tables.flatMap((t) =>
      t.columns
        .filter((c) => c.name.endsWith("_micro_usd") && c.getSQLType() !== "bigint")
        .map((c) => `${t.name}.${c.name}`),
    );
    expect(wrong).toEqual([]);
  });
});
