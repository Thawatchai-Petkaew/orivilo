import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { MissingEnvError } from "@orivilo/db";
import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ORV-281 tech notes T23 (spec rows 5, 7 and 17): the project list page, with the real loader and a
// service that holds two workspaces, so a page that asked for another workspace shows another list.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  session: null as unknown,
  throws: null as unknown,
  asked: [] as string[],
}));
vi.mock("../../i18n/locale", async () => {
  const { webMessages: all } = await import("../../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});
vi.mock("../../server/auth", () => ({
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

const row = (id: string, name: string, at: string) => ({
  id,
  name,
  createdAt: new Date(at),
});
/** Newest first, as the service returns them; workspace B's project must never show in A's list. */
const STORE: Record<string, ReturnType<typeof row>[]> = {
  "ws-a": [
    row("11111111-1111-4111-8111-111111111111", "ร้านกาแฟคั่วเอง", "2026-11-18T03:00:00Z"),
    row("22222222-2222-4222-8222-222222222222", "Dental <b>clinic</b>", "2026-11-17T03:00:00Z"),
  ],
  "ws-b": [
    row("33333333-3333-4333-8333-333333333333", "Other workspace shop", "2026-11-18T05:00:00Z"),
  ],
};
vi.mock("@orivilo/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@orivilo/auth")>();
  return {
    ...real,
    businessService: () => ({
      async list(_h: Headers, workspaceId: string) {
        state.asked.push(workspaceId);
        // What `withWorkspace` does with no active workspace.
        if (workspaceId === "") throw new real.Denied(403, "no-workspace");
        return STORE[workspaceId] ?? [];
      },
    }),
  };
});

const page = await import("./page");

let capture: ReturnType<typeof captureLines>;
beforeEach(() => {
  capture = captureLines();
  vi.stubEnv("READ_ALLOWED_EMAILS", "reader@example.com");
  state.asked = [];
});
afterEach(() => {
  capture.restore();
  vi.unstubAllEnvs();
});

const person = (workspace: string | null) => ({
  user: { id: "u1", email: "reader@example.com" },
  session: { activeOrganizationId: workspace },
});

async function render(locale: "en" | "th", session: unknown, throws: unknown = null) {
  state.locale = locale;
  state.session = session;
  state.throws = throws;
  state.asked = [];
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>{await page.default()}</LocaleProvider>,
  );
}
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");
const hrefs = (html: string) => [...html.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1]);
const written = () => capture.lines.map((line) => expectLineShape(line));

describe("the route", () => {
  it("is dynamic", () => {
    expect(page.dynamic).toBe("force-dynamic");
  });
});

// Row 17: the workspace's projects, newest first, each a link to its board; not another workspace's.
describe.each(["en", "th"] as const)("/business with projects in %s", (locale) => {
  it("lists the two of the person's workspace, newest first, linking to their boards", async () => {
    const html = await render(locale, person("ws-a"));
    const m = messagesFor(locale).business;
    expect(state.asked).toEqual(["ws-a"]);
    expect(text(html)).toContain(m.list.heading);
    const names = ["ร้านกาแฟคั่วเอง", "Dental &lt;b&gt;clinic&lt;/b&gt;"];
    expect(names.map((n) => html.indexOf(n))).toEqual(
      [...names.map((n) => html.indexOf(n))].sort((a, b) => a - b),
    );
    for (const n of names) expect(html).toContain(n);
    expect(html).not.toContain("Other workspace shop");
    expect(hrefs(html)).toEqual(
      expect.arrayContaining([
        "/business/11111111-1111-4111-8111-111111111111",
        "/business/22222222-2222-4222-8222-222222222222",
        "/business/new",
      ]),
    );
    expect(hrefs(html)).not.toContain("/business/33333333-3333-4333-8333-333333333333");
    // The name is the person's text: markup in it stays text.
    expect(html).not.toContain("<b>clinic</b>");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });

  it("shows the other workspace's project only to a member of it", async () => {
    const html = await render(locale, person("ws-b"));
    expect(html).toContain("Other workspace shop");
    expect(html).not.toContain("ร้านกาแฟคั่วเอง");
  });

  it("a workspace with none shows the empty line and the link to the intake", async () => {
    const html = await render(locale, person("ws-empty"));
    const m = messagesFor(locale).business;
    expect(text(html)).toContain(m.list.empty);
    expect(hrefs(html)).toContain("/business/new");
    expect(text(html)).toContain(m.list.new);
    expect(hrefs(html).filter((h) => h?.startsWith("/business/") && h !== "/business/new")).toEqual(
      [],
    );
  });

  it("a person with no active workspace has no projects: the empty line, never an error", async () => {
    const html = await render(locale, person(null));
    expect(text(html)).toContain(messagesFor(locale).business.list.empty);
    expect(written()).toMatchObject([{ outcome: "refused", reason: "workspace-not-found" }]);
  });

  it("writes one line with the route and outcome and no project name", async () => {
    await render(locale, person("ws-a"));
    expect(written()).toMatchObject([{ route: "business/listProjects", outcome: "ok" }]);
    const all = JSON.stringify(capture.lines.map((l) => l.args));
    for (const secret of ["ร้านกาแฟ", "Dental", "ws-a", "reader@example.com"]) {
      expect(all).not.toContain(secret);
    }
  });
});

// Rows 5, 6 and 7 for the list.
describe.each(["en", "th"] as const)("/business without content in %s", (locale) => {
  const m = () => messagesFor(locale).business;

  it("signed out: the heading, the sign-in line and the link, no list", async () => {
    const html = await render(locale, null);
    expect(text(html)).toContain(m().list.heading);
    expect(text(html)).toContain(m().signedOut);
    expect(hrefs(html)).toEqual(["/account"]);
    expect(state.asked).toEqual([]);
  });

  it("not on the approved list: one line, no link, nothing read", async () => {
    const html = await render(locale, {
      user: { id: "u2", email: "stranger@example.com" },
      session: { activeOrganizationId: "ws-a" },
    });
    expect(text(html)).toContain(m().notAllowed);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("stranger");
    expect(state.asked).toEqual([]);
  });

  it("no database set up: the line, no list", async () => {
    const html = await render(locale, null, new MissingEnvError("DATABASE_URL"));
    expect(text(html)).toContain(m().notConfigured);
    expect(html).not.toContain("<a ");
    expect(written()).toMatchObject([{ outcome: "failed", reason: "not-configured" }]);
  });

  it("lets any other error through", async () => {
    await expect(render(locale, null, new Error("boom"))).rejects.toThrow("boom");
  });
});
