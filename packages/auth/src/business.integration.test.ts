import { createHash } from "node:crypto";
import {
  businessIntake,
  businessPositioningChoice,
  businessReading,
  desc,
  eq,
  member,
  project,
  sql,
} from "@orivilo/db";
import { inWorkspace } from "@orivilo/db/client";
import { createTestDatabase, HAS_TEST_DATABASE, type TestDatabase } from "@orivilo/db/testing";
import {
  type BusinessReading,
  modelReading,
  readBusiness,
  ruleBasedReading,
  toBusinessView,
} from "@orivilo/intent-engine";
import { testUtils } from "better-auth/plugins";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BUSINESS_LIST_LIMIT, BusinessError, businessService } from "./business.ts";
import { createAuth } from "./config.ts";
import { positioningService } from "./positioning.ts";

// ORV-281 rows 9, 13 and 17 at the service, against a throwaway database as orivilo_app.
const intake = {
  projectName: "ร้านกาแฟคั่วเอง",
  idea: "ขายกาแฟคั่วสดให้คนทำงานในย่านอารีย์",
  industry: "ร้านอาหารและเครื่องดื่ม",
  customers: "พนักงานออฟฟิศ",
  problem: "กาแฟร้านทั่วไปไม่สด",
  competitors: "ร้านกาแฟเชน",
  value: "คั่วสดทุกเช้า",
  website: "example.com",
};

describe.runIf(HAS_TEST_DATABASE)("business projects", () => {
  let t: TestDatabase;
  let auth: ReturnType<typeof make>;
  let service: ReturnType<typeof businessService>;
  let positioning: ReturnType<typeof positioningService>;
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
    const deps = { db: t.app, getSession: (headers: Headers) => auth.api.getSession({ headers }) };
    service = businessService(deps);
    positioning = positioningService(deps);
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  it("create writes one project and one intake in the active workspace (T11)", async () => {
    const a = await signIn("a@example.com", "Anna");
    const { projectId } = await service.create(a.headers, a.workspaceId, intake);
    const projects = await t.admin.select().from(project).where(eq(project.id, projectId));
    expect(projects.map((p) => [p.workspaceId, p.name, p.createdBy])).toEqual([
      [a.workspaceId, intake.projectName, a.user.id],
    ]);
    const rows = await t.admin
      .select()
      .from(businessIntake)
      .where(eq(businessIntake.projectId, projectId));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      workspaceId: a.workspaceId,
      createdBy: a.user.id,
      version: "intake-1",
      idea: intake.idea,
      industry: intake.industry,
      customers: intake.customers,
      problem: intake.problem,
      competitors: intake.competitors,
      value: intake.value,
      // The check keeps what `websiteOf` makes of what was typed.
      website: "https://example.com/",
    });
  });

  it("create leaves no project behind when the intake insert fails (T11)", async () => {
    const a = await signIn("atomic@example.com", "Atom");
    // The engine's check drops a NUL character, so no input it accepts fails in Postgres. A probe
    // constraint on this throwaway database refuses one idea at the intake insert, which follows
    // the project insert in the same transaction.
    await t.admin.execute(
      sql`alter table business_intake add constraint atomic_probe check (idea <> 'atomic probe')`,
    );
    await expect(
      service.create(a.headers, a.workspaceId, { projectName: "Atomic", idea: "atomic probe" }),
    ).rejects.toThrow();
    await t.admin.execute(sql`alter table business_intake drop constraint atomic_probe`);
    const left = await t.admin.select().from(project).where(eq(project.workspaceId, a.workspaceId));
    expect(left).toEqual([]);
  });

  it("create refuses input the engine's check refuses, and writes nothing (T11)", async () => {
    const a = await signIn("refused@example.com", "Rin");
    for (const bad of [
      { projectName: "", idea: "x" },
      { projectName: "n", idea: "" },
      { projectName: "n", idea: "x".repeat(2001) },
      { projectName: "ก".repeat(121), idea: "x" },
      { projectName: "n", idea: "x", website: "https://user:secret@example.com" },
      { projectName: "n", idea: "x", workspaceId: "other" },
    ]) {
      await expect(service.create(a.headers, a.workspaceId, bad)).rejects.toMatchObject({
        name: "BusinessError",
        reason: "invalid-input",
      });
    }
    expect(
      await t.admin.select().from(project).where(eq(project.workspaceId, a.workspaceId)),
    ).toEqual([]);
  });

  it("create is denied without a session and for a workspace the caller is not in (T11)", async () => {
    const a = await signIn("denied-a@example.com", "Dee");
    const b = await signIn("denied-b@example.com", "Dan");
    await expect(service.create(new Headers(), a.workspaceId, intake)).rejects.toMatchObject({
      status: 401,
    });
    await expect(service.create(b.headers, a.workspaceId, intake)).rejects.toMatchObject({
      status: 404,
      reason: "not-a-member",
    });
    expect(
      await t.admin.select().from(project).where(eq(project.workspaceId, a.workspaceId)),
    ).toEqual([]);
  });

  it("opens a project with its checked answers and its save time (T11)", async () => {
    const a = await signIn("open@example.com", "Ola");
    const { projectId } = await service.create(a.headers, a.workspaceId, {
      projectName: "Open",
      idea: "Roasted coffee",
    });
    const opened = await service.open(a.headers, a.workspaceId, projectId);
    expect(opened.project).toMatchObject({ id: projectId, name: "Open" });
    expect(opened.intake).toEqual({ version: "intake-1", idea: "Roasted coffee" });
    const [row] = await t.admin
      .select({ at: businessIntake.createdAt })
      .from(businessIntake)
      .where(eq(businessIntake.projectId, projectId));
    expect(opened.savedAt).toEqual(row?.at);
  });

  it("opens the newest intake of a project, and shows a row changed outside the app as invalid (T11)", async () => {
    const a = await signIn("newest@example.com", "Nok");
    const { projectId } = await service.create(a.headers, a.workspaceId, {
      projectName: "Newest",
      idea: "first",
    });
    await t.admin.insert(businessIntake).values({
      id: "bi-newest-later",
      workspaceId: a.workspaceId,
      projectId,
      version: "intake-1",
      idea: "second",
      createdBy: a.user.id,
      createdAt: new Date(Date.now() + 60_000),
    });
    expect((await service.open(a.headers, a.workspaceId, projectId)).intake.idea).toBe("second");

    // Valid for the database's checks, refused by the stored form: a website that is not what
    // `websiteOf` keeps.
    await t.admin
      .update(businessIntake)
      .set({ website: "ftp://example.com" })
      .where(eq(businessIntake.id, "bi-newest-later"));
    await expect(service.open(a.headers, a.workspaceId, projectId)).rejects.toMatchObject({
      reason: "invalid-stored",
    });
  });

  it("answers not-found the same way for another workspace's project and an unknown id (T12)", async () => {
    const a = await signIn("owner-a@example.com", "Aon");
    const b = await signIn("owner-b@example.com", "Bua");
    const { projectId } = await service.create(a.headers, a.workspaceId, {
      projectName: "A only",
      idea: "x",
    });
    const refusal = async (id: string) => {
      const error = await service.open(b.headers, b.workspaceId, id).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(BusinessError);
      return error as BusinessError;
    };
    const other = await refusal(projectId);
    const unknown = await refusal("00000000-0000-4000-8000-000000000000");
    const notAnId = await refusal("not-an-id");
    expect([other.reason, unknown.reason, notAnId.reason]).toEqual([
      "not-found",
      "not-found",
      "not-found",
    ]);
    expect([unknown.message, notAnId.message]).toEqual([other.message, other.message]);
    // Asking in A's workspace is denied before any query, as a workspace the caller is not in.
    await expect(service.open(b.headers, a.workspaceId, projectId)).rejects.toMatchObject({
      status: 404,
      reason: "not-a-member",
    });
    // And without the helper, row security alone returns nothing.
    const rows = await inWorkspace(t.app, b.workspaceId, (tx) =>
      tx.select().from(project).where(eq(project.id, projectId)),
    );
    expect(rows).toEqual([]);
  });

  it("lists the workspace's projects newest first, and none as empty (T13)", async () => {
    const a = await signIn("list-a@example.com", "Lek");
    const b = await signIn("list-b@example.com", "Bow");
    const c = await signIn("list-c@example.com", "Cho");
    expect(await service.list(c.headers, c.workspaceId)).toEqual([]);
    // Names are in reverse order of saving, so ordering by name would show the opposite.
    const first = await service.create(a.headers, a.workspaceId, {
      projectName: "Z first",
      idea: "x",
    });
    const second = await service.create(a.headers, a.workspaceId, {
      projectName: "M second",
      idea: "x",
    });
    const third = await service.create(a.headers, a.workspaceId, {
      projectName: "A third",
      idea: "x",
    });
    await service.create(b.headers, b.workspaceId, { projectName: "Not mine", idea: "x" });
    // A project with no intake is not listed.
    await t.admin
      .insert(project)
      .values({ id: "p-no-intake", workspaceId: a.workspaceId, name: "No intake" });
    const listed = await service.list(a.headers, a.workspaceId);
    expect(listed.map((p) => [p.id, p.name])).toEqual([
      [third.projectId, "A third"],
      [second.projectId, "M second"],
      [first.projectId, "Z first"],
    ]);
    expect(listed[0]?.createdAt).toBeInstanceOf(Date);
    await expect(service.list(b.headers, a.workspaceId)).rejects.toMatchObject({ status: 404 });
  });

  it("lists at most the bound, newest first (T13)", async () => {
    const a = await signIn("many@example.com", "Mai");
    const total = BUSINESS_LIST_LIMIT + 1;
    const base = Date.now() - 10 * 60_000;
    const ids = Array.from({ length: total }, (_, i) => `many-${String(i).padStart(3, "0")}`);
    await t.admin.insert(project).values(
      ids.map((id, i) => ({
        id,
        workspaceId: a.workspaceId,
        name: id,
        createdAt: new Date(base + i * 1000),
      })),
    );
    await t.admin.insert(businessIntake).values(
      ids.map((id) => ({
        id: `bi-${id}`,
        workspaceId: a.workspaceId,
        projectId: id,
        version: "intake-1",
        idea: "x",
        createdBy: a.user.id,
      })),
    );
    const listed = await service.list(a.headers, a.workspaceId);
    expect(listed).toHaveLength(BUSINESS_LIST_LIMIT);
    expect(listed[0]?.id).toBe(ids[total - 1]);
    expect(listed.at(-1)?.id).toBe(ids[1]);
  });

  // ORV-283 rows 27 to 35 at the service: the saved reading of an intake (tech notes 5.2, 6.2).
  describe("the saved reading", () => {
    const MODEL = "test/model";
    const sha256Text = (text: string): string =>
      createHash("sha256").update(text, "utf8").digest("hex");
    const answers = {
      projectName: "Reading",
      idea: "Roasted coffee for office workers who want good coffee at home",
    };

    /** A valid model record for the intake, built the way the job builds it, from a typed answer. */
    const modelRecord = async (intakeId: string): Promise<BusinessReading> => {
      const complete = () =>
        Promise.resolve(
          JSON.stringify({
            readings: [
              {
                field: "audience.customers",
                value: "Office workers",
                quotes: [{ answer: "idea", text: "office workers" }],
              },
            ],
          }),
        );
      const { items } = await readBusiness(
        { intake: answers, intakeId, savedAt: "2026-11-18T03:04:05.000Z" },
        { complete, sha256Text, model: MODEL },
      );
      return modelReading(intakeId, MODEL, items);
    };

    const create = async (email: string, name: string) => {
      const a = await signIn(email, name);
      const { projectId } = await service.create(a.headers, a.workspaceId, answers);
      const [row] = await t.admin
        .select({ id: businessIntake.id })
        .from(businessIntake)
        .where(eq(businessIntake.projectId, projectId));
      return { ...a, projectId, intakeId: row?.id ?? "" };
    };

    it("opens with no reading before one is saved (T40)", async () => {
      const a = await create("noreading@example.com", "Non");
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.reading).toBeNull();
      expect(opened.intakeId).toBe(a.intakeId);
    });

    it("saves a model reading once and replays it on every open (T40)", async () => {
      const a = await create("replay@example.com", "Rep");
      const record = await modelRecord(a.intakeId);
      expect(record.method === "model" && record.items.length).toBeGreaterThan(1);
      await service.saveReading(a.headers, a.workspaceId, record);
      const [row] = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.intakeId, a.intakeId));
      expect(row).toMatchObject({
        workspaceId: a.workspaceId,
        createdBy: a.user.id,
        job: "business-read",
        method: "model",
        reason: null,
        modelId: MODEL,
        adapterId: "business-read",
        adapterVersion: "1",
        promptVersion: "business-prompt-1",
      });
      const first = await service.open(a.headers, a.workspaceId, a.projectId);
      const second = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(first.reading).toEqual(record);
      expect(second.reading).toEqual(first.reading);
    });

    it("saves a rule-based reading with its reason and no evidence (T40)", async () => {
      const a = await create("rulebased@example.com", "Rul");
      await service.saveReading(
        a.headers,
        a.workspaceId,
        ruleBasedReading(a.intakeId, "ai-spend-cap"),
      );
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.reading).toEqual(ruleBasedReading(a.intakeId, "ai-spend-cap"));
      const [row] = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.intakeId, a.intakeId));
      expect([row?.reason, row?.modelId, row?.evidence]).toEqual(["ai-spend-cap", null, []]);
    });

    it("keeps one row per intake and job: a second save fails and changes nothing (T40)", async () => {
      const a = await create("twice@example.com", "Two");
      await service.saveReading(a.headers, a.workspaceId, await modelRecord(a.intakeId));
      const error = await service
        .saveReading(a.headers, a.workspaceId, ruleBasedReading(a.intakeId, "ai-failed"))
        .then(
          () => null,
          (e: unknown) => e,
        );
      expect(error).toBeInstanceOf(BusinessError);
      expect((error as BusinessError).reason).toBe("not-saved");
      // The message is a closed word: no answer, id or driver text.
      expect((error as BusinessError).message).toBe("business refused: not-saved");
      const rows = await t.admin
        .select()
        .from(businessReading)
        .where(eq(businessReading.intakeId, a.intakeId));
      expect(rows.map((r) => r.method)).toEqual(["model"]);
    });

    it("refuses a record that does not parse, and writes nothing (T40)", async () => {
      const a = await create("badrecord@example.com", "Bad");
      const record = await modelRecord(a.intakeId);
      const bad: unknown[] = [
        { ...record, extra: "key" },
        { ...ruleBasedReading(a.intakeId, "ai-failed"), reason: "ai-tired" },
        { ...record, job: "other-job" },
        record.method === "model"
          ? {
              ...record,
              items: record.items.map((i) => ({
                ...i,
                source: { ...i.source, ref: "intake:other" },
              })),
            }
          : null,
        "not a record",
      ];
      for (const one of bad) {
        await expect(
          service.saveReading(a.headers, a.workspaceId, one as BusinessReading),
        ).rejects.toMatchObject({ name: "BusinessError", reason: "invalid-input" });
      }
      expect(
        await t.admin
          .select()
          .from(businessReading)
          .where(eq(businessReading.intakeId, a.intakeId)),
      ).toEqual([]);
    });

    it("saves only into the caller's own workspace's intake (T40)", async () => {
      const a = await create("own-a@example.com", "Own");
      const b = await signIn("own-b@example.com", "Oth");
      const record = ruleBasedReading(a.intakeId, "ai-failed");
      // Not a member of A's workspace: denied before any query.
      await expect(service.saveReading(b.headers, a.workspaceId, record)).rejects.toMatchObject({
        status: 404,
      });
      await expect(service.saveReading(new Headers(), a.workspaceId, record)).rejects.toMatchObject(
        {
          status: 401,
        },
      );
      // In B's own workspace, A's intake does not exist for B: the foreign key and row security refuse.
      await expect(service.saveReading(b.headers, b.workspaceId, record)).rejects.toMatchObject({
        name: "BusinessError",
        reason: "not-saved",
      });
      expect(
        await t.admin
          .select()
          .from(businessReading)
          .where(eq(businessReading.intakeId, a.intakeId)),
      ).toEqual([]);
    });

    it("opens the reading of the newest intake only, for the business-read job only (T40)", async () => {
      const a = await create("newest-reading@example.com", "New");
      await service.saveReading(a.headers, a.workspaceId, await modelRecord(a.intakeId));
      const later = "bi-reading-later";
      await t.admin.insert(businessIntake).values({
        id: later,
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        version: "intake-1",
        idea: "second",
        createdBy: a.user.id,
        createdAt: new Date(Date.now() + 60_000),
      });
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.intakeId).toBe(later);
      expect(opened.reading).toBeNull();
      // Another job's row on the newest intake is not this job's reading.
      await t.admin.insert(businessReading).values({
        id: "br-other-job",
        workspaceId: a.workspaceId,
        intakeId: later,
        job: "other-job",
        method: "rule-based",
        reason: "ai-failed",
        createdBy: a.user.id,
      });
      expect((await service.open(a.headers, a.workspaceId, a.projectId)).reading).toBeNull();
      const newest = await t.admin
        .select({ id: businessIntake.id })
        .from(businessIntake)
        .where(eq(businessIntake.projectId, a.projectId))
        .orderBy(desc(businessIntake.createdAt))
        .limit(1);
      expect(newest[0]?.id).toBe(later);
    });

    it("shows a reading row changed outside the app as invalid, never as a reading (T40)", async () => {
      const a = await create("tampered@example.com", "Tam");
      await service.saveReading(a.headers, a.workspaceId, await modelRecord(a.intakeId));
      const where = eq(businessReading.intakeId, a.intakeId);
      // Valid for the database's checks, refused by the record's schema: evidence that is no item.
      await t.admin
        .update(businessReading)
        .set({ evidence: [{ not: "an item" }] })
        .where(where);
      await expect(service.open(a.headers, a.workspaceId, a.projectId)).rejects.toMatchObject({
        name: "BusinessError",
        reason: "invalid-stored",
      });
    });

    it("shows a row whose columns disagree with its evidence as invalid (T40)", async () => {
      const a = await create("disagree@example.com", "Dis");
      await service.saveReading(a.headers, a.workspaceId, await modelRecord(a.intakeId));
      await t.admin
        .update(businessReading)
        .set({ modelId: "other/model" })
        .where(eq(businessReading.intakeId, a.intakeId));
      await expect(service.open(a.headers, a.workspaceId, a.projectId)).rejects.toMatchObject({
        reason: "invalid-stored",
      });
    });

    it("a reading changes no saved value (T45)", async () => {
      const a = await create("nochange@example.com", "Noc");
      const intakeRow = async () =>
        (await t.admin.select().from(businessIntake).where(eq(businessIntake.id, a.intakeId)))[0];
      const before = await intakeRow();
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      const asView = (reading: BusinessReading | null) =>
        toBusinessView({
          project: {
            id: a.projectId,
            name: opened.project.name,
            createdAt: "2026-11-18T00:00:00.000Z",
          },
          intake: opened.intake,
          reading,
        });
      const without = asView(null);

      // The reading lands on `audience.customers`, whose own answer is empty in this fixture.
      await service.saveReading(a.headers, a.workspaceId, await modelRecord(a.intakeId));

      expect(await intakeRow()).toEqual(before);
      const reopened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(reopened.intake).toEqual(opened.intake);
      const withReading = asView(reopened.reading);
      const bare = (v: typeof without) =>
        v.nodes.map((n) => ({
          id: n.id,
          state: n.state,
          gate: n.gate,
          notes: n.notes,
          stillToAsk: n.stillToAsk,
          answers: n.fields.map((f) => [f.field, f.answer]),
        }));
      expect(bare(withReading)).toEqual(bare(without));
      // The reading is there, beside the answers and not in place of them.
      expect(withReading.nodes.flatMap((n) => n.fields).flatMap((f) => f.readings)).not.toEqual([]);
    });
  });

  // ORV-285 rows 2, 4 and 6 at the service: the positioning choice (tech notes sections 4.1, 6.1, 7).
  describe("the positioning choice", () => {
    const statement = "กาแฟคั่วสดสำหรับคนทำงานที่ส่งถึงออฟฟิศทุกเช้า";
    const create = async (email: string, name: string) => {
      const a = await signIn(email, name);
      const { projectId } = await service.create(a.headers, a.workspaceId, {
        projectName: "Positioning",
        idea: "Roasted coffee for office workers",
      });
      const [row] = await t.admin
        .select({ id: businessIntake.id })
        .from(businessIntake)
        .where(eq(businessIntake.projectId, projectId));
      return { ...a, projectId, intakeId: row?.id ?? "" };
    };
    const rowsOf = (projectId: string) =>
      t.admin
        .select({ c: businessPositioningChoice })
        .from(businessPositioningChoice)
        .innerJoin(businessIntake, eq(businessIntake.id, businessPositioningChoice.intakeId))
        .where(eq(businessIntake.projectId, projectId))
        .then((r) => r.map((x) => x.c));

    it("opens with no choice before one is made (T7)", async () => {
      const a = await create("pos-none@example.com", "Pon");
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.positioning).toEqual({ intakeId: a.intakeId, choice: null });
    });

    it("choice saved in the workspace: one row, written, trimmed, on the newest intake (T7)", async () => {
      const a = await create("pos-save@example.com", "Pos");
      const later = "bi-pos-later";
      await t.admin.insert(businessIntake).values({
        id: later,
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        version: "intake-1",
        idea: "second",
        createdBy: a.user.id,
        createdAt: new Date(Date.now() + 60_000),
      });
      const done = await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: a.projectId,
        statement: `  ${statement}  `,
      });
      expect(done).toEqual({ kind: "written" });
      const rows = await rowsOf(a.projectId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        workspaceId: a.workspaceId,
        intakeId: later,
        kind: "written",
        statement,
        draftId: null,
        option: null,
        createdBy: a.user.id,
      });
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.positioning.intakeId).toBe(later);
      expect(opened.positioning.choice).toMatchObject({
        kind: "written",
        statement,
        intakeId: later,
      });
    });

    it("choice of another workspace reads as not found: the same answer as an unknown id (T8)", async () => {
      const a = await create("pos-a@example.com", "Pab");
      const b = await signIn("pos-b@example.com", "Pbb");
      const attempt = async (id: string) => {
        const error = await positioning
          .choose(b.headers, b.workspaceId, {
            kind: "written",
            projectId: id,
            statement,
          })
          .then(
            () => null,
            (e: unknown) => e,
          );
        expect(error).toBeInstanceOf(BusinessError);
        return error as BusinessError;
      };
      const other = await attempt(a.projectId);
      const unknown = await attempt("00000000-0000-4000-8000-000000000000");
      expect([other.reason, unknown.reason]).toEqual(["not-found", "not-found"]);
      expect(unknown.message).toBe(other.message);
      expect(await rowsOf(a.projectId)).toEqual([]);
      // Naming A's workspace is denied before any query.
      await expect(
        positioning.choose(b.headers, a.workspaceId, {
          kind: "written",
          projectId: a.projectId,
          statement,
        }),
      ).rejects.toMatchObject({ status: 404, reason: "not-a-member" });
      await expect(
        positioning.choose(new Headers(), a.workspaceId, {
          kind: "skipped",
          projectId: a.projectId,
        }),
      ).rejects.toMatchObject({ status: 401 });
    });

    it("refuses a choice the engine's check refuses, and writes nothing (T7)", async () => {
      const a = await create("pos-bad@example.com", "Pbd");
      for (const bad of [
        { kind: "written", projectId: a.projectId, statement: "   " },
        { kind: "written", projectId: a.projectId, statement: "x".repeat(301) },
        { kind: "skipped", projectId: a.projectId, statement: "x" },
        { kind: "written", projectId: a.projectId, statement, by: "admin" },
        "not a choice",
      ]) {
        await expect(positioning.choose(a.headers, a.workspaceId, bad)).rejects.toMatchObject({
          name: "BusinessError",
          reason: "invalid-input",
        });
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("answers not-found for a picked or edited choice: no draft exists yet (T7)", async () => {
      const a = await create("pos-pick@example.com", "Ppk");
      const draftId = "33333333-3333-4333-8333-333333333333";
      for (const bad of [
        { kind: "picked", projectId: a.projectId, draftId, option: 1 },
        { kind: "edited", projectId: a.projectId, draftId, option: 1, statement },
      ]) {
        await expect(positioning.choose(a.headers, a.workspaceId, bad)).rejects.toMatchObject({
          reason: "not-found",
        });
      }
      expect(await rowsOf(a.projectId)).toEqual([]);
    });

    it("newest choice wins: a skip then a written choice opens as the second, both rows stay (T9)", async () => {
      const a = await create("pos-newest@example.com", "Pnw");
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "skipped",
        projectId: a.projectId,
      });
      expect(
        (await service.open(a.headers, a.workspaceId, a.projectId)).positioning.choice?.kind,
      ).toBe("skipped");
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: a.projectId,
        statement,
      });
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.positioning.choice).toMatchObject({ kind: "written", statement });
      expect((await rowsOf(a.projectId)).map((r) => r.kind).sort()).toEqual(["skipped", "written"]);
    });

    it("newest choice wins by the time it was saved, then by id, never by id alone (T9)", async () => {
      const a = await create("pos-order@example.com", "Por");
      const at = Date.now();
      // The older row has the larger id and the newer one the smaller, so an order by id alone
      // would open the older one.
      await t.admin.insert(businessPositioningChoice).values([
        {
          id: "zzzz-older",
          workspaceId: a.workspaceId,
          intakeId: a.intakeId,
          kind: "skipped",
          createdBy: a.user.id,
          createdAt: new Date(at - 60_000),
        },
        {
          id: "aaaa-newer",
          workspaceId: a.workspaceId,
          intakeId: a.intakeId,
          kind: "written",
          statement,
          createdBy: a.user.id,
          createdAt: new Date(at),
        },
      ]);
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.positioning.choice?.id).toBe("aaaa-newer");
    });

    it("a choice made on an older intake is the project's newest choice and is not on the newest intake (T9)", async () => {
      const a = await create("pos-older@example.com", "Pol");
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: a.projectId,
        statement,
      });
      await t.admin.insert(businessIntake).values({
        id: "bi-pos-newer",
        workspaceId: a.workspaceId,
        projectId: a.projectId,
        version: "intake-1",
        idea: "changed answers",
        createdBy: a.user.id,
        createdAt: new Date(Date.now() + 60_000),
      });
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.positioning.intakeId).toBe("bi-pos-newer");
      expect(opened.positioning.choice).toMatchObject({ intakeId: a.intakeId, kind: "written" });
      // The newest intake has no agreement, so a new choice is allowed on it.
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: a.projectId,
        statement: "second",
      });
      expect((await rowsOf(a.projectId)).map((r) => r.intakeId).sort()).toEqual(
        [a.intakeId, "bi-pos-newer"].sort(),
      );
    });

    it("a choice on another project of the same workspace is not this project's choice (T9)", async () => {
      const a = await create("pos-two@example.com", "Ptw");
      const { projectId: second } = await service.create(a.headers, a.workspaceId, {
        projectName: "Second",
        idea: "Another business",
      });
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: second,
        statement,
      });
      const opened = await service.open(a.headers, a.workspaceId, a.projectId);
      expect(opened.positioning).toEqual({ intakeId: a.intakeId, choice: null });
      // And a choice on this project is not blocked by the other project's agreement.
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "skipped",
        projectId: a.projectId,
      });
      expect(await rowsOf(a.projectId)).toHaveLength(1);
    });

    it("an agreed intake stays agreed: a later choice is gate-passed and writes nothing (T14 at the service)", async () => {
      const a = await create("pos-agreed@example.com", "Pag");
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: a.projectId,
        statement,
      });
      for (const again of [
        { kind: "skipped", projectId: a.projectId },
        { kind: "written", projectId: a.projectId, statement: "other" },
      ]) {
        await expect(positioning.choose(a.headers, a.workspaceId, again)).rejects.toMatchObject({
          reason: "gate-passed",
        });
      }
      expect(await rowsOf(a.projectId)).toHaveLength(1);
    });

    it("shows a choice row changed outside the app as invalid, never as a statement (T9)", async () => {
      const a = await create("pos-tamper@example.com", "Ptm");
      await positioning.choose(a.headers, a.workspaceId, {
        kind: "written",
        projectId: a.projectId,
        statement,
      });
      // The database's shape check wants a draft id and an option on a picked row and is content
      // with an empty id; the stored form is not.
      await t.admin
        .update(businessPositioningChoice)
        .set({ kind: "picked", draftId: "", option: 1 })
        .where(eq(businessPositioningChoice.intakeId, a.intakeId));
      await expect(service.open(a.headers, a.workspaceId, a.projectId)).rejects.toMatchObject({
        name: "BusinessError",
        reason: "invalid-stored",
      });
    });
  });
});
