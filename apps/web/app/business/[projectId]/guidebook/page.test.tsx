import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { MissingEnvError } from "@orivilo/db";
import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import {
  guidebookOf,
  STAND_IN_LINEUP,
  type StoredEntry,
  storedEntrySchema,
  toBusinessView,
} from "@orivilo/intent-engine";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-302 tech notes T14 to T17 and T38 (spec rows 1, 10, 11, 13 and 23 at the page): the guidebook
// route, with the real loader and a service that holds two workspaces. The page reads what the
// board's page reads, hands the screen the guidebook's keys and values and no view, and writes
// nothing, counts no limit and calls no model.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  session: null as unknown,
  throws: null as unknown,
  /** The workspace and the id of every `open`: an id not in UUID form must never get here. */
  asked: [] as Array<[string, string]>,
  /** Every call a service was asked for; opening a guidebook asks for `open` and nothing else. */
  calls: [] as string[],
  consumed: 0,
  /** A stored row that fails its own check. */
  stored: false,
  done: false,
}));
vi.mock("../../../../server/auth", () => ({
  accessDeps: () => ({}),
  auth: () => ({
    api: {
      getSession: async () => {
        if (state.throws !== null) throw state.throws;
        return state.session;
      },
    },
  }),
}));
vi.mock("../../../../server/rate-limit", () => ({
  subjectFromHeaders: () => "ip-1",
  limiter: () => ({
    async consume() {
      state.consumed += 1;
      return { ok: true };
    },
  }),
}));
const fetchSpy = vi.fn();
vi.stubGlobal("fetch", fetchSpy);

const MINE = "11111111-1111-4111-8111-111111111111";
const THEIRS = "33333333-3333-4333-8333-333333333333";
const UNKNOWN = "99999999-9999-4999-8999-999999999999";
const NEWEST = "intake-b";
const SAVED = new Date("2026-11-18T03:15:00Z");
const STATEMENT = "คั่วสดส่งถึงบ้านทุกเช้า";

const entry = (e: Record<string, unknown>): StoredEntry => storedEntrySchema.parse(e);
const at = "2026-11-19T04:00:00.000Z";
const axes = { playful: 75, expressive: 75, structured: 75, warm: 75, premium: 75 };
/** The done project of the spec: every answer the guidebook shows, the three visual items derived. */
const DONE_ENTRIES: StoredEntry[] = [
  entry({
    id: "p",
    node: "identity-frame",
    kind: "given",
    payload: { axes, person: "สุขุม แม่นยำ อบอุ่น" },
    createdAt: at,
  }),
  entry({
    id: "a",
    node: "architecture",
    kind: "answered",
    payload: { subBrands: false },
    createdAt: at,
  }),
  entry({ id: "n", node: "name", kind: "given", payload: { name: "ORIVILO" }, createdAt: at }),
  entry({
    id: "i",
    node: "core-idea",
    kind: "written",
    payload: { statement: "ทำให้ง่ายที่สุด", remember: "ง่ายและอบอุ่น" },
    createdAt: at,
  }),
  entry({
    id: "l",
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup: STAND_IN_LINEUP },
    createdAt: at,
  }),
  entry({
    id: "t",
    node: "typography",
    kind: "answered",
    payload: { scripts: "thai-latin" },
    createdAt: at,
  }),
  entry({
    id: "g",
    node: "logo-type",
    kind: "answered",
    payload: { appIcon: false },
    createdAt: at,
  }),
];
const choice = {
  id: "c",
  intakeId: NEWEST,
  createdAt: at,
  kind: "written" as const,
  statement: STATEMENT,
  draftId: null,
  option: null,
};
const opened = (id: string, name: string, done: boolean) => ({
  project: { id, name, createdAt: SAVED },
  intakeId: NEWEST,
  reading: null,
  intake: { version: "intake-1", idea: "ขายกาแฟคั่วสด", customers: "พนักงานออฟฟิศ" },
  savedAt: SAVED,
  positioning: { intakeId: NEWEST, choice: done ? choice : null },
  foundation: done ? DONE_ENTRIES : [],
});
/** Workspace A holds MINE and workspace B holds THEIRS; a row of another workspace reads as not found. */
const STORE: Record<string, Record<string, (done: boolean) => ReturnType<typeof opened>>> = {
  "ws-a": { [MINE]: (done) => opened(MINE, "ร้านกาแฟคั่วเอง", done) },
  "ws-b": { [THEIRS]: (done) => opened(THEIRS, "Other workspace shop", done) },
};
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  return {
    ...real,
    foundationService: () => ({
      async enter() {
        state.calls.push("foundation.enter");
      },
    }),
    positioningService: () => ({
      async choose() {
        state.calls.push("positioning.choose");
      },
    }),
    businessService: () => ({
      async create() {
        state.calls.push("business.create");
      },
      async saveReading() {
        state.calls.push("business.saveReading");
      },
      async list() {
        state.calls.push("business.list");
        return [];
      },
      async open(_h: Headers, workspaceId: string, id: string) {
        state.calls.push("business.open");
        state.asked.push([workspaceId, id]);
        if (state.stored) throw new real.BusinessError("invalid-stored");
        const found = STORE[workspaceId]?.[id];
        if (!found) throw new real.BusinessError("not-found");
        return found(state.done);
      },
    }),
  };
});

const page = await import("./page");
const { GuidebookScreen } = await import("@orivilo/design-system/examples");

let capture: ReturnType<typeof captureLines>;
beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", "reader@example.com");
  state.session = person("ws-a");
  state.throws = null;
  state.asked = [];
  state.calls = [];
  state.consumed = 0;
  state.stored = false;
  state.done = false;
  fetchSpy.mockClear();
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const person = (workspace: string | null) => ({
  user: { id: "u1", email: "reader@example.com" },
  session: { activeOrganizationId: workspace },
});

type Main = { props: { children: { type: unknown; props: Record<string, unknown> } } };
/** The screen element the page hands back, with the props it was given. */
async function screenOf(id: string) {
  const main = (await page.default({ params: Promise.resolve({ projectId: id }) })) as Main;
  return main.props.children;
}
/** What the page throws for a 404: the one signal Next turns into the one not-found page. */
async function notFoundOf(id: string) {
  try {
    await screenOf(id);
  } catch (error) {
    return error as { message: string; digest?: string };
  }
  throw new Error("the page rendered");
}
const written = () => capture.lines.map((line) => expectLineShape(line));
/** The saved project the service gives, as the board's loader turns it into a view. */
const expected = (done: boolean) => {
  const o = opened(MINE, "ร้านกาแฟคั่วเอง", done);
  return guidebookOf(
    toBusinessView({
      project: { id: o.project.id, name: o.project.name, createdAt: o.savedAt.toISOString() },
      intake: o.intake,
      reading: o.reading,
      positioning: o.positioning,
      foundation: o.foundation,
    } as Parameters<typeof toBusinessView>[0]),
  );
};

describe("the route", () => {
  it("is dynamic", () => {
    expect(page.dynamic).toBe("force-dynamic");
  });
});

// T14, spec rows 1 and 13: the screen gets the guidebook and the board's address, and no view.
describe.each(["en", "th"] as const)("/business/[projectId]/guidebook in %s", (locale) => {
  it("renders the guidebook of the project", async () => {
    const screen = await screenOf(MINE);
    expect(screen.type).toBe(GuidebookScreen);
    expect(Object.keys(screen.props).sort()).toEqual(
      ["access", "boardHref", "guidebook", "signInHref"].sort(),
    );
    expect(screen.props["access"]).toBe("ready");
    expect(screen.props["boardHref"]).toBe(`/business/${MINE}`);
    expect(screen.props["guidebook"]).toEqual(expected(false));
    expect(screen.props).not.toHaveProperty("view");
    expect(state.asked).toEqual([["ws-a", MINE]]);

    const m = messagesFor(locale).business;
    const html = renderToStaticMarkup(
      <LocaleProvider locale={locale}>
        {await page.default({ params: Promise.resolve({ projectId: MINE }) })}
      </LocaleProvider>,
    );
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).toContain(m.guidebook.title);
    expect(html).toContain(`href="/business/${MINE}"`);
  });

  it("writes one line with the route and outcome and no name or answer", async () => {
    await screenOf(MINE);
    expect(written()).toMatchObject([{ route: "business/openProject", outcome: "ok" }]);
    expect(written()).toHaveLength(1);
    const all = JSON.stringify(capture.lines.map((l) => l.args));
    for (const secret of ["ร้านกาแฟ", "ขายกาแฟ", "ws-a", MINE, "reader@example.com"]) {
      expect(all).not.toContain(secret);
    }
  });
});

// T15, spec row 11: signed out, not on the list and no database give the screen that access state.
describe("access states", () => {
  const cases: Array<[string, "signed-out" | "not-allowed" | "not-configured", () => void]> = [
    ["signed out", "signed-out", () => (state.session = null)],
    [
      "not on the approved list",
      "not-allowed",
      () =>
        (state.session = {
          user: { id: "u2", email: "stranger@example.com" },
          session: { activeOrganizationId: "ws-a" },
        }),
    ],
    [
      "no database set up",
      "not-configured",
      () => {
        state.session = null;
        state.throws = new MissingEnvError("DATABASE_URL");
      },
    ],
  ];

  it.each(cases)(
    "%s: the screen with that access, no guidebook, nothing read",
    async (_name, access, setup) => {
      setup();
      const screen = await screenOf(MINE);
      expect(screen.type).toBe(GuidebookScreen);
      expect(screen.props).toEqual({ access, signInHref: "/account" });
      expect(state.asked).toEqual([]);
      expect(state.calls).toEqual([]);
    },
  );

  it("lets any other error through", async () => {
    state.throws = new Error("boom");
    await expect(screenOf(MINE)).rejects.toThrow("boom");
  });
});

// T16, spec row 11: one 404 for an id in a bad form, an unknown id, another workspace's project and a
// row that fails its own check; the service is asked only for UUID-form ids with the session's workspace.
describe("one 404 for a bad, unknown or other-workspace id and an unreadable row", () => {
  const cases: Array<[string, string]> = [
    ["a project of another workspace", THEIRS],
    ["an unknown id", UNKNOWN],
    ["an id not in UUID form", "not-an-id"],
    ["an id with markup", "<script>alert(1)</script>"],
  ];

  it.each(cases)("%s gives the not-found signal, and no page", async (_name, id) => {
    const error = await notFoundOf(id);
    expect(error.digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("gives the same error in every field for the three kinds of id", async () => {
    const shape = (e: { message: string; digest?: string }) =>
      JSON.stringify([e.message, e.digest]);
    const [other, unknown, form] = [
      await notFoundOf(THEIRS),
      await notFoundOf(UNKNOWN),
      await notFoundOf("not-an-id"),
    ];
    expect(shape(unknown)).toBe(shape(other));
    expect(shape(form)).toBe(shape(other));
  });

  it("asks the service only for UUID-form ids, with the session's workspace, and writes a refusal line with no id", async () => {
    await notFoundOf("not-an-id");
    expect(state.asked).toEqual([]);
    await notFoundOf(THEIRS);
    expect(state.asked).toEqual([["ws-a", THEIRS]]);
    expect(written().map((l) => [l["route"], l["outcome"], l["reason"]])).toEqual([
      ["business/openProject", "refused", "not-found"],
      ["business/openProject", "refused", "not-found"],
    ]);
    const all = JSON.stringify(capture.lines.map((l) => l.args));
    expect(all).not.toContain(THEIRS);
    expect(all).not.toContain("not-an-id");
  });

  it("a person with no workspace gets the 404", async () => {
    state.session = person(null);
    expect((await notFoundOf(MINE)).digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("a row that fails its own check is the same 404, and an error line", async () => {
    state.stored = true;
    const error = await notFoundOf(MINE);
    expect(error.digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(written()).toMatchObject([{ outcome: "failed", level: "error", reason: "failed" }]);
  });
});

/** Loads the guidebook twice, a day apart on a fake clock. */
async function loadedTwice() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-19T00:00:00Z"));
  const first = (await screenOf(MINE)).props["guidebook"];
  vi.setSystemTime(new Date("2026-11-20T00:00:00Z"));
  const second = (await screenOf(MINE)).props["guidebook"];
  return [first, second] as const;
}

// T17, spec row 10: opening twice gives the same guidebook, writes nothing, counts no limit, calls no model.
describe("loaded twice gives the same guidebook and writes nothing, counts no limit, calls no model", () => {
  it("is the same on both loads, with only `open` called on the service", async () => {
    const [first, second] = await loadedTwice();
    expect(second).toEqual(first);
    expect(first).toEqual(expected(false));
    expect(state.calls).toEqual(["business.open", "business.open"]);
    expect(state.consumed).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// T38, spec row 23: the same over the done project, whose three visual items are derived.
describe("replay, with the visual items", () => {
  it("gives the same guidebook, its logo type, colour and typography derived, a day apart", async () => {
    state.done = true;
    const [first, second] = await loadedTwice();
    expect(second).toEqual(first);
    expect(first).toEqual(expected(true));
    const g = first as ReturnType<typeof expected>;
    expect(g.visual.map((i) => [i.id, i.state])).toEqual([
      ["logo-type", "derived"],
      ["logo-mark", "notInVersion"],
      ["color", "derived"],
      ["typography", "derived"],
    ]);
    expect(g.visual.filter((i) => i.status === "done").map((i) => i.method)).toEqual([
      "rule",
      "rule",
      "rule",
    ]);
    // Neither the lineup nor a colour value reaches the data the client gets.
    expect(JSON.stringify(g)).not.toMatch(/#[0-9a-fA-F]{3,8}|lineup|crowded/);
    expect(state.calls).toEqual(["business.open", "business.open"]);
    expect(state.consumed).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
