import { directionVersion, eq, member, sql } from "@orivilo/db";
import { inWorkspace } from "@orivilo/db/client";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import type { CuratedProfile } from "@orivilo/intent-engine";
import { testUtils } from "better-auth/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "./config.ts";
import { directionService } from "./directions.ts";

// ORV-35 AC 3 to 10, against a throwaway database as orivilo_app.
const profiles: CuratedProfile[] = [
  {
    id: "professional",
    decisions: {
      shape: "crisp",
      surfaceTreatment: "bordered",
      emphasis: "restrained",
      typeVoice: "single",
      motion: "quiet",
    },
  },
  {
    id: "friendly",
    decisions: {
      shape: "soft",
      surfaceTreatment: "flat",
      emphasis: "expressive",
      typeVoice: "paired",
      motion: "standard",
    },
  },
];

const studio = {
  name: "Clinic booking",
  brief: "เป็นระเบียบ หรูหรา",
  profileId: "professional",
  adjustments: [{ set: "shape", to: "rounded", reason: "chosen in Refine" }],
};

describe.runIf(HAS_TEST_DATABASE)("saved directions", () => {
  let t: TestDatabase;
  let auth: ReturnType<typeof make>;
  let service: ReturnType<typeof directionService>;
  const make = (db: TestDatabase["app"]) =>
    createAuth({
      db,
      secret: "test-secret-that-is-long-enough-0123456789",
      baseURL: "http://localhost:3000",
      google: { clientId: "test", clientSecret: "test" },
      plugins: [testUtils()],
    });
  interface TestHelpersLike {
    login(input: { userId: string }): Promise<{ headers: Headers }>;
  }
  const signIn = async (email: string, name: string) => {
    const ctx = await auth.$context;
    const user = await ctx.internalAdapter.createUser(
      { email, name, emailVerified: true },
      { method: "oauth", oauth: { providerId: "google" } },
    );
    const { headers } = await (ctx as unknown as { test: TestHelpersLike }).test.login({
      userId: user.id,
    });
    const [own] = await t.admin
      .select({ id: member.organizationId })
      .from(member)
      .where(eq(member.userId, user.id));
    return { user, headers, workspaceId: own?.id ?? "" };
  };

  beforeAll(async () => {
    t = await createTestDatabase();
    auth = make(t.app);
    service = directionService(
      { db: t.app, getSession: (headers) => auth.api.getSession({ headers }) },
      profiles,
    );
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  it("saves one direction with one draft, and a second save updates it (AC 3)", async () => {
    const a = await signIn("a@example.com", "Anna");
    const first = await service.saveDraft(a.headers, a.workspaceId, studio);
    const second = await service.saveDraft(a.headers, a.workspaceId, {
      ...studio,
      directionId: first.directionId,
      brief: "เป็นกันเอง สนุก",
    });
    expect(second.directionId).toBe(first.directionId);
    expect(second.versionId).toBe(first.versionId);
    expect(second.fingerprint).not.toBe(first.fingerprint);
    const [listed] = await service.list(a.headers, a.workspaceId);
    expect(listed?.versions.map((v) => [v.status, v.number])).toEqual([["draft", null]]);
  });

  it("approves in order, and an edit after approval is a new draft (AC 4, 6)", async () => {
    const b = await signIn("b@example.com", "Ben");
    const { directionId } = await service.saveDraft(b.headers, b.workspaceId, studio);
    const v1 = await service.approve(b.headers, b.workspaceId, directionId);
    expect(v1.number).toBe(1);
    await expect(service.approve(b.headers, b.workspaceId, directionId)).rejects.toMatchObject({
      reason: "no-draft",
    });

    const edited = await service.saveDraft(b.headers, b.workspaceId, {
      ...studio,
      directionId,
      brief: "เป็นกันเอง สนุก",
    });
    expect(edited.versionId).not.toBe(v1.versionId);
    const before = await service.read(b.headers, b.workspaceId, v1.versionId);
    expect(before.snapshot.brief).toBe(studio.brief);
    expect(before.version).toMatchObject({ status: "approved", number: 1 });
    expect(before.version.approvedAt).toBeInstanceOf(Date);

    const v2 = await service.approve(b.headers, b.workspaceId, directionId);
    expect(v2.number).toBe(2);
    const [listed] = await service.list(b.headers, b.workspaceId);
    expect(listed?.versions.map((v) => [v.status, v.number])).toEqual([
      ["approved", 1],
      ["approved", 2],
    ]);
  });

  it("lets a member save but not approve (AC 5)", async () => {
    const c = await signIn("c@example.com", "Chai");
    await t.admin.update(member).set({ role: "member" }).where(eq(member.userId, c.user.id));
    const { directionId, versionId } = await service.saveDraft(c.headers, c.workspaceId, studio);
    await expect(service.approve(c.headers, c.workspaceId, directionId)).rejects.toMatchObject({
      status: 403,
      reason: "role-too-low",
    });
    const still = await service.read(c.headers, c.workspaceId, versionId);
    expect(still.version.status).toBe("draft");
  });

  it("refuses any change to an approved version, even as the app role (AC 7)", async () => {
    const d = await signIn("d@example.com", "Dao");
    const { directionId } = await service.saveDraft(d.headers, d.workspaceId, studio);
    const { versionId } = await service.approve(d.headers, d.workspaceId, directionId);
    await expect(
      inWorkspace(t.app, d.workspaceId, (tx) =>
        tx
          .update(directionVersion)
          .set({ fingerprint: "00000000" })
          .where(eq(directionVersion.id, versionId)),
      ),
    ).rejects.toThrow();
    const kept = await service.read(d.headers, d.workspaceId, versionId);
    expect(kept.version.fingerprint).not.toBe("00000000");
  });

  it("keeps one workspace's directions from another (AC 8)", async () => {
    const e = await signIn("e@example.com", "Eak");
    const f = await signIn("f@example.com", "Fon");
    const { directionId, versionId } = await service.saveDraft(e.headers, e.workspaceId, studio);

    // Through the helper, in Fon's own workspace: Eak's rows do not exist.
    await expect(service.read(f.headers, f.workspaceId, versionId)).rejects.toMatchObject({
      reason: "not-found",
    });
    await expect(
      service.saveDraft(f.headers, f.workspaceId, { ...studio, directionId }),
    ).rejects.toMatchObject({ reason: "not-found" });
    // Asking for Eak's workspace is denied before any query.
    await expect(service.list(f.headers, e.workspaceId)).rejects.toMatchObject({ status: 403 });
    // And without the helper, row security alone returns nothing.
    const rows = await inWorkspace(t.app, f.workspaceId, (tx) =>
      tx.select().from(directionVersion).where(eq(directionVersion.id, versionId)),
    );
    expect(rows).toEqual([]);
  });

  it("stores the server's fingerprint, never the client's (AC 9)", async () => {
    const g = await signIn("g@example.com", "Gun");
    await expect(
      service.saveDraft(g.headers, g.workspaceId, { ...studio, fingerprint: "00000000" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
    await expect(
      service.saveDraft(g.headers, g.workspaceId, { ...studio, profileId: "invented" }),
    ).rejects.toMatchObject({ reason: "profile-missing" });
    const saved = await service.saveDraft(g.headers, g.workspaceId, studio);
    const [row] = await t.admin
      .select({
        stored: directionVersion.fingerprint,
        inSnapshot: sql<string>`snapshot->>'fingerprint'`,
      })
      .from(directionVersion)
      .where(eq(directionVersion.id, saved.versionId));
    expect(row).toEqual({ stored: saved.fingerprint, inSnapshot: saved.fingerprint });
  });

  it("round-trips an export and refuses an altered file (AC 10)", async () => {
    const h = await signIn("h@example.com", "Hong");
    const { directionId } = await service.saveDraft(h.headers, h.workspaceId, studio);
    const { versionId } = await service.approve(h.headers, h.workspaceId, directionId);
    const file = JSON.parse(
      JSON.stringify(await service.exportFile(h.headers, h.workspaceId, versionId)),
    );
    expect(file).toMatchObject({ name: studio.name, version: { status: "approved", number: 1 } });

    const imported = await service.importFile(h.headers, h.workspaceId, file);
    expect(imported.directionId).not.toBe(directionId);
    const back = await service.read(h.headers, h.workspaceId, imported.versionId);
    expect(back.version.status).toBe("draft");
    expect(back.snapshot).toEqual(file.snapshot);

    await expect(
      service.importFile(h.headers, h.workspaceId, {
        ...file,
        snapshot: { ...file.snapshot, brief: "เป็นกันเอง สนุก" },
      }),
    ).rejects.toMatchObject({ reason: "fingerprint-mismatch" });
    await expect(
      service.importFile(h.headers, h.workspaceId, { ...file, format: "other" }),
    ).rejects.toMatchObject({ reason: "invalid-file" });
  });
});
