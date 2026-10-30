import { getTableColumns, is } from "drizzle-orm";
import { PgTable, pgTable, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { CLASSIFICATION, TAGS, type Tag } from "../index.ts";
import * as schema from "./index.ts";

/** Export name to column property names, for the exports that are tables. */
type Columns = Readonly<Record<string, readonly string[]>>;
/** Table to column to value; values are plain strings so a W5 input needs no cast. */
type Entries = Readonly<Record<string, Readonly<Record<string, string>>>>;

function tablesOf(module: Readonly<Record<string, unknown>>): Columns {
  return Object.fromEntries(
    Object.entries(module)
      .filter((entry): entry is [string, PgTable] => is(entry[1], PgTable))
      .map(([name, table]) => [name, Object.keys(getTableColumns(table))]),
  );
}

/** `orv158-walk`: one problem per defect, `W<n> <table>` or `W<n> <table>.<column>`. */
function classificationProblems(tables: Columns, map: Entries, tags: readonly string[]) {
  const problems: string[] = [];
  for (const table of Object.keys(tables)) if (!(table in map)) problems.push(`W1 ${table}`);
  for (const table of Object.keys(map)) if (!(table in tables)) problems.push(`W2 ${table}`);
  for (const [table, columns] of Object.entries(tables)) {
    const entries = map[table];
    if (entries === undefined) continue;
    for (const column of columns) if (!(column in entries)) problems.push(`W3 ${table}.${column}`);
    for (const [column, tag] of Object.entries(entries)) {
      if (!columns.includes(column)) problems.push(`W4 ${table}.${column}`);
      else if (!tags.includes(tag)) problems.push(`W5 ${table}.${column}`);
    }
  }
  return problems;
}

/** The `table.column` keys of the map with one tag, sorted. */
function keysTagged(tag: Tag): string[] {
  return Object.entries(CLASSIFICATION as Entries)
    .flatMap(([table, columns]) =>
      Object.entries(columns)
        .filter(([, value]) => value === tag)
        .map(([column]) => `${table}.${column}`),
    )
    .sort();
}

describe("the field classification map (ORV-158, orv158-walk)", () => {
  it("every exported table and column has one tag", () => {
    expect(classificationProblems(tablesOf(schema), CLASSIFICATION, TAGS)).toEqual([]);
  });

  describe("the walk names each defect once", () => {
    const real = tablesOf({ rateLimitCounter: schema.rateLimitCounter });
    const entries: Record<string, string> = { ...CLASSIFICATION.rateLimitCounter };
    const withoutCount = Object.fromEntries(
      Object.entries(entries).filter(([column]) => column !== "count"),
    );
    const ghostTable = pgTable("ghost_table", { id: text("id") });

    it.each([
      {
        clause: "W1",
        tables: tablesOf({ rateLimitCounter: schema.rateLimitCounter, ghostTable }),
        map: { rateLimitCounter: entries },
        expected: ["W1 ghostTable"],
      },
      {
        clause: "W2",
        tables: real,
        map: { rateLimitCounter: entries, ghostEntry: { id: "internal" } },
        expected: ["W2 ghostEntry"],
      },
      {
        clause: "W3",
        tables: real,
        map: { rateLimitCounter: withoutCount },
        expected: ["W3 rateLimitCounter.count"],
      },
      {
        clause: "W4",
        tables: real,
        map: { rateLimitCounter: { ...entries, hits: "internal" } },
        expected: ["W4 rateLimitCounter.hits"],
      },
      {
        clause: "W5",
        tables: real,
        map: { rateLimitCounter: { ...entries, count: "confidential" } },
        expected: ["W5 rateLimitCounter.count"],
      },
    ])("$clause gives exactly one problem", ({ tables, map, expected }) => {
      expect(classificationProblems(tables, map, TAGS)).toEqual(expected);
    });

    it("gives no problem for the real rateLimitCounter alone", () => {
      expect(classificationProblems(real, { rateLimitCounter: entries }, TAGS)).toEqual([]);
    });
  });

  it("the tag list is the closed list", () => {
    expect(TAGS).toEqual(["public", "internal", "personal", "secret"]);
  });

  it("pins the secret and personal columns", () => {
    const secret: Tag = "secret";
    expect(keysTagged(secret)).toEqual(
      [
        "account.accessToken",
        "account.idToken",
        "account.password",
        "account.refreshToken",
        "session.token",
        "verification.value",
      ].sort(),
    );
    expect(keysTagged("personal")).toEqual(
      [
        "account.accountId",
        "account.userId",
        "aiUsage.userId",
        "direction.createdBy",
        "directionVersion.approvedBy",
        "directionVersion.createdBy",
        "directionVersion.snapshot",
        "invitation.email",
        "invitation.inviterId",
        "member.userId",
        "organization.metadata",
        "organization.name",
        "project.createdBy",
        "rateLimitCounter.key",
        "session.ipAddress",
        "session.userAgent",
        "session.userId",
        "user.email",
        "user.id",
        "user.image",
        "user.name",
        "verification.identifier",
      ].sort(),
    );
    expect(keysTagged("public")).toEqual([]);
  });

  describe("keeps decision 9's examples", () => {
    it.each([
      ["user", "email", "personal"],
      ["user", "name", "personal"],
      ["session", "ipAddress", "personal"],
      ["session", "token", "secret"],
      ["account", "accessToken", "secret"],
      ["account", "refreshToken", "secret"],
      ["account", "idToken", "secret"],
    ] as const)("%s.%s is %s", (table, column, tag) => {
      const entries: Record<string, string> = CLASSIFICATION[table];
      expect(entries[column]).toBe(tag);
    });
  });

  it("the schema barrel does not carry the map", () => {
    const names = Object.keys(schema);
    expect(names).not.toContain("CLASSIFICATION");
    expect(names).not.toContain("TAGS");
  });
});
