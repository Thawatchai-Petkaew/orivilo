import { member, organization } from "@orivilo/db";
import { type Db } from "@orivilo/db/client";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { Denied, withWorkspace } from "./access.ts";

/** A database that fails the test if anything touches it. */
const untouchable = new Proxy({} as Db, {
  get(_, key) {
    throw new Error(`the database was used (${String(key)}) before access was granted`);
  },
});

/**
 * A database that answers `select().from(table).where().limit()` with the rows given for that
 * table and records which tables were read in `from`. Anything else (a transaction, an insert,
 * an update, a raw statement) fails the test, like `untouchable`.
 */
function stubDb(rows: { member: unknown[]; organization: unknown[] }) {
  const from: string[] = [];
  const nameOf = (table: unknown) =>
    table === member ? "member" : table === organization ? "organization" : "other";
  const db = new Proxy({} as Db, {
    get(_, key) {
      if (key !== "select") {
        throw new Error(`the database was used (${String(key)}) before access was granted`);
      }
      return () => ({
        from: (table: unknown) => {
          const name = nameOf(table);
          from.push(name);
          const result = name === "member" || name === "organization" ? rows[name] : [];
          return { where: () => ({ limit: async () => result }) };
        },
      });
    },
  });
  return { db, from };
}

describe("withWorkspace before any query (ORV-38 AC 3)", () => {
  it("denies without a session, with 401, and runs nothing", async () => {
    const fn = vi.fn();
    const denied = withWorkspace(
      { db: untouchable, getSession: async () => null },
      new Headers(),
      "ws-a",
      "member",
      fn,
    );
    await expect(denied).rejects.toMatchObject({ status: 401, reason: "no-session" });
    await expect(denied).rejects.toBeInstanceOf(Denied);
    expect(fn).not.toHaveBeenCalled();
  });

  it.each([undefined, null, ""])("denies a missing workspace id (%s) with 403", async (id) => {
    const fn = vi.fn();
    await expect(
      withWorkspace(
        { db: untouchable, getSession: async () => ({ user: { id: "u" } }) },
        new Headers(),
        id,
        "member",
        fn,
      ),
    ).rejects.toMatchObject({ status: 403, reason: "no-workspace" });
    expect(fn).not.toHaveBeenCalled();
  });
});

// ORV-159 rows 3, 4, 6 and 7: a workspace the person is not in answers 404 whether or not it
// exists, from one select on `member` and nothing else.
describe("withWorkspace for a workspace the caller is not in (ORV-159)", () => {
  it.each([
    ["Dao's workspace", "ws-dao", [{ id: "ws-dao" }]],
    ["a missing id", "9f1c2d3e-0000-4000-8000-000000000000", []],
  ])("denies a workspace the caller is not in with 404: %s", async (_name, id, organizations) => {
    const fn = vi.fn();
    const stub = stubDb({ member: [], organization: organizations });
    const denied = withWorkspace(
      { db: stub.db, getSession: async () => ({ user: { id: "u" } }) },
      new Headers(),
      id,
      "member",
      fn,
    );
    await expect(denied).rejects.toBeInstanceOf(Denied);
    await expect(denied).rejects.toMatchObject({
      status: 404,
      reason: "not-a-member",
      message: "access denied: not-a-member",
    });
    expect(fn).not.toHaveBeenCalled();
    expect(stub.from).toEqual(["member"]);
  });

  it("types the status as exactly 401, 403 or 404", () => {
    expectTypeOf<Denied["status"]>().toEqualTypeOf<401 | 403 | 404>();
  });

  it("types the reason as exactly the four it names", () => {
    expectTypeOf<Denied["reason"]>().toEqualTypeOf<
      "no-session" | "no-workspace" | "not-a-member" | "role-too-low"
    >();
  });
});
