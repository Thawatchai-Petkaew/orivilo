import { type Db } from "@orivilo/db/client";
import { describe, expect, it, vi } from "vitest";
import { Denied, withWorkspace } from "./access.ts";

/** A database that fails the test if anything touches it. */
const untouchable = new Proxy({} as Db, {
  get(_, key) {
    throw new Error(`the database was used (${String(key)}) before access was granted`);
  },
});

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
