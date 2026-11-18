import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { MissingEnvError } from "@orivilo/db";
import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-281 tech notes T22 (spec rows 5, 7, 13 and 14 at the page): one project's board page, with the
// real loader and a service that holds two workspaces. Another workspace's id, an unknown id and an
// id not in UUID form must give one 404, the same in every byte the page can show.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  session: null as unknown,
  throws: null as unknown,
  /** Every id the service was asked for: an id not in UUID form must never get here. */
  asked: [] as string[],
  stored: null as unknown,
}));
vi.mock("../../../i18n/locale", async () => {
  const { webMessages: all } = await import("../../../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});
vi.mock("../../../server/auth", () => ({
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

const MINE = "11111111-1111-4111-8111-111111111111";
const THEIRS = "33333333-3333-4333-8333-333333333333";
const UNKNOWN = "99999999-9999-4999-8999-999999999999";
const SAVED = new Date("2026-11-18T03:15:00Z");
const opened = (id: string, name: string, idea: string) => ({
  project: { id, name, createdAt: SAVED },
  intake: { version: "intake-1", idea, customers: "พนักงานออฟฟิศ" },
  savedAt: SAVED,
});
/** Workspace A holds MINE and workspace B holds THEIRS; a row of another workspace reads as not found. */
const STORE: Record<string, Record<string, ReturnType<typeof opened>>> = {
  "ws-a": { [MINE]: opened(MINE, "ร้านกาแฟคั่วเอง", "ขายกาแฟคั่วสด") },
  "ws-b": { [THEIRS]: opened(THEIRS, "Other workspace shop", "Sells shoes") },
};
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  return {
    ...real,
    businessService: () => ({
      async open(_h: Headers, workspaceId: string, id: string) {
        state.asked.push(id);
        if (state.stored !== null) throw new real.BusinessError("invalid-stored");
        const found = STORE[workspaceId]?.[id];
        if (!found) throw new real.BusinessError("not-found");
        return found;
      },
    }),
  };
});

const page = await import("./page");

let capture: ReturnType<typeof captureLines>;
beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", "reader@example.com");
  state.stored = null;
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
});

const person = (workspace: string | null) => ({
  user: { id: "u1", email: "reader@example.com" },
  session: { activeOrganizationId: workspace },
});

async function render(
  locale: "en" | "th",
  id: string,
  session: unknown = person("ws-a"),
  throws: unknown = null,
) {
  state.locale = locale;
  state.session = session;
  state.throws = throws;
  state.asked = [];
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>
      {await page.default({ params: Promise.resolve({ projectId: id }) })}
    </LocaleProvider>,
  );
}
/** What the page throws for a 404: the one signal Next turns into the one not-found page. */
async function notFoundOf(id: string, session: unknown = person("ws-a")) {
  try {
    await render("en", id, session);
  } catch (error) {
    return error as { message: string; digest?: string };
  }
  throw new Error("the page rendered");
}
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");
const written = () => capture.lines.map((line) => expectLineShape(line));

describe("the route", () => {
  it("is dynamic", () => {
    expect(page.dynamic).toBe("force-dynamic");
  });
});

// Row 14 at the page (slice 1): the name as the one h1, the lede, the date, five node views.
describe.each(["en", "th"] as const)("/business/[projectId] in %s", (locale) => {
  it("shows the saved project: the name, the lede, the date and the five node views", async () => {
    const html = await render(locale, MINE);
    const m = messagesFor(locale).business;
    expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
    expect(html).toContain("ร้านกาแฟคั่วเอง");
    expect(text(html)).toContain(m.board.lede);
    expect(text(html)).toMatch(locale === "th" ? /บันทึกเมื่อ .*2569/ : /Saved .*Nov 18, 2026/);
    expect([...html.matchAll(/data-node="([^"]+)"/g)].map((x) => x[1])).toEqual([
      "situation",
      "business-core",
      "audience",
      "competitive-frame",
      "positioning",
    ]);
    expect(html).toContain("ขายกาแฟคั่วสด");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(state.asked).toEqual([MINE]);
  });

  it("writes one line with the route and outcome and no name or answer", async () => {
    await render(locale, MINE);
    expect(written()).toMatchObject([{ route: "business/openProject", outcome: "ok" }]);
    const all = JSON.stringify(capture.lines.map((l) => l.args));
    for (const secret of ["ร้านกาแฟ", "ขายกาแฟ", "ws-a", MINE, "reader@example.com"]) {
      expect(all).not.toContain(secret);
    }
  });
});

// Row 13: another workspace's project, an unknown id and an id not in UUID form are one 404.
describe("another workspace", () => {
  const cases: Array<[string, string]> = [
    ["a project of another workspace", THEIRS],
    ["an unknown id", UNKNOWN],
    ["an id not in UUID form", "not-an-id"],
    ["an id with markup", "<script>alert(1)</script>"],
    ["an empty-looking id", "00000000-0000-0000-0000"],
  ];

  it.each(cases)("%s gives the not-found signal, and no page", async (_name, id) => {
    const error = await notFoundOf(id);
    expect(error.digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("gives the same error in every field for the three kinds of id", async () => {
    const [other, unknown, form] = [
      await notFoundOf(THEIRS),
      await notFoundOf(UNKNOWN),
      await notFoundOf("not-an-id"),
    ];
    const shape = (e: { message: string; digest?: string }) =>
      JSON.stringify([e.message, e.digest]);
    expect(shape(unknown)).toBe(shape(other));
    expect(shape(form)).toBe(shape(other));
  });

  it("asks the service only for ids in UUID form, and writes a refusal line with no id", async () => {
    await notFoundOf("not-an-id");
    expect(state.asked).toEqual([]);
    await notFoundOf(THEIRS);
    expect(state.asked).toEqual([THEIRS]);
    expect(written().map((l) => [l["route"], l["outcome"], l["reason"]])).toEqual([
      ["business/openProject", "refused", "not-found"],
      ["business/openProject", "refused", "not-found"],
    ]);
    const all = JSON.stringify(capture.lines.map((l) => l.args));
    expect(all).not.toContain(THEIRS);
    expect(all).not.toContain("not-an-id");
  });

  it("a member of the other workspace sees it, and a person with no workspace gets the 404", async () => {
    const html = await render("en", THEIRS, person("ws-b"));
    expect(html).toContain("Other workspace shop");
    expect((await notFoundOf(THEIRS, person(null))).digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("a stored row that fails its own check is the same 404, and an error line", async () => {
    state.stored = { bad: true };
    const error = await notFoundOf(MINE);
    expect(error.digest).toBe("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(written()).toMatchObject([{ outcome: "failed", level: "error", reason: "failed" }]);
  });
});

// Rows 5 and 7 for the board.
describe.each(["en", "th"] as const)("/business/[projectId] without content in %s", (locale) => {
  const m = () => messagesFor(locale).business;

  it("signed out: the sign-in line and link, no board, nothing read", async () => {
    const html = await render(locale, MINE, null);
    expect(text(html)).toContain(m().signedOut);
    expect(html).not.toContain("data-node");
    expect(state.asked).toEqual([]);
  });

  it("not on the approved list: one line, no board", async () => {
    const html = await render(locale, MINE, {
      user: { id: "u2", email: "stranger@example.com" },
      session: { activeOrganizationId: "ws-a" },
    });
    expect(text(html)).toContain(m().notAllowed);
    expect(html).not.toContain("data-node");
    expect(html).not.toContain("stranger");
    expect(state.asked).toEqual([]);
  });

  it("no database set up: the line, no board", async () => {
    const html = await render(locale, MINE, null, new MissingEnvError("DATABASE_URL"));
    expect(text(html)).toContain(m().notConfigured);
    expect(html).not.toContain("data-node");
  });

  it("lets any other error through", async () => {
    await expect(render(locale, MINE, null, new Error("boom"))).rejects.toThrow("boom");
  });
});
