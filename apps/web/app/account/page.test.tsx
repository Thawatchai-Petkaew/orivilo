import { renderToStaticMarkup } from "react-dom/server";
import { Denied } from "@orivilo/auth";
import { MissingEnvError } from "@orivilo/db";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  session: null as unknown,
  denied: null as unknown,
  workspace: "",
}));
vi.mock("../../i18n/locale", async () => {
  const { webMessages: all } = await import("../../i18n/messages");
  return { getWebMessages: async () => ({ m: all[state.locale] }) };
});
vi.mock("../../server/auth", () => ({
  auth: () => ({ api: { getSession: async () => state.session } }),
  accessDeps: () => ({}),
}));
vi.mock("@orivilo/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@orivilo/auth")>()),
  withWorkspace: async () => {
    if (state.denied !== null) throw state.denied;
    return state.workspace;
  },
}));
vi.mock("./actions", () => ({ signInWithGoogle: async () => null, signOut: async () => {} }));
const form = vi.hoisted(() => ({ labels: undefined as unknown }));
vi.mock("./SignInForm", () => ({
  SignInForm: (props: { labels: unknown }) => {
    form.labels = props.labels;
    return <span data-testid="sign-in-form" />;
  },
}));

const { default: AccountPage } = await import("./page");

// ORV-112 design D2a: the column anchors to the top, so the notice grows downward only.
describe("/account signed out", () => {
  it("anchors main to the top and does not center it", async () => {
    const html = renderToStaticMarkup(await AccountPage());
    const main = /<main class="([^"]*)"/.exec(html)?.[1] ?? "";
    const classes = main.split(" ");
    expect(classes).toContain("justify-start");
    expect(classes).toContain("pt-24");
    expect(classes).not.toContain("min-h-dvh");
    expect(classes).not.toContain("justify-center");
  });

  // ORV-123 row 5 (design R1): the failure line comes from `account.failed`, not `saved.errors.failed`.
  it("gives the sign-in form its own failure line", async () => {
    renderToStaticMarkup(await AccountPage());
    expect(form.labels).toEqual({
      account: webMessages.en.account,
      wait: webMessages.en.wait,
      failure: webMessages.en.failure,
    });
  });
});

// ORV-159 row 14 (orv159-account): any Denied from the workspace helper shows the sign-in view.
describe("/account with a Denied workspace", () => {
  it.each(
    (["en", "th"] as const).flatMap((locale) =>
      [new Denied(404, "not-a-member"), new Denied(403, "no-workspace")].map(
        (denied) => [locale, denied] as const,
      ),
    ),
  )("a denied workspace shows the sign-in view in %s (%j)", async (locale, denied) => {
    state.locale = locale;
    state.session = {
      user: { email: "ana@example.com" },
      session: { activeOrganizationId: "ws-other" },
    };
    state.denied = denied;
    form.labels = undefined;
    const m = webMessages[locale];
    const html = renderToStaticMarkup(await AccountPage());
    expect(/<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1]).toBe(m.account.heading);
    expect(form.labels).toEqual({ account: m.account, wait: m.wait, failure: m.failure });
    expect(html).not.toContain("ana@example.com");
  });
});

// ORV-195 rows 15 and 16 (markup): the stacked lockup at height 80 comes first in main, above the
// heading, as an image named "ORIVILO"; it is the same in the signed-out, signed-in and
// not-configured views. The look and the dark mode come from the browser scan.
describe.each([
  { view: "signed-out", row: 15, locale: "th" as const },
  { view: "signed-in", row: 16, locale: "en" as const },
  { view: "not-configured", row: 16, locale: "en" as const },
])("the /account lockup, row $row, $view, $locale", ({ view, locale }) => {
  async function markup(): Promise<string> {
    state.locale = locale;
    state.session = null;
    state.denied = null;
    if (view === "signed-in") {
      state.session = {
        user: { email: "ana@example.com" },
        session: { activeOrganizationId: "ws-1" },
      };
      state.workspace = "Ana Studio";
    }
    if (view === "not-configured") {
      state.denied = new MissingEnvError("DATABASE_URL");
      state.session = {
        user: { email: "ana@example.com" },
        session: { activeOrganizationId: "ws-1" },
      };
    }
    return renderToStaticMarkup(await AccountPage());
  }

  it("puts the stacked Logo at height 80 first in main, an image named ORIVILO", async () => {
    const html = await markup();
    const m = webMessages[locale].account;
    if (view === "signed-in") expect(html).toContain("Ana Studio");
    if (view === "not-configured") expect(html).toContain(m.notConfigured);
    const main = /<main[^>]*>(.*)<\/main>/s.exec(html)?.[1] ?? "";
    expect(main.startsWith("<svg")).toBe(true);
    const svg = /<svg[^>]*>/.exec(main)?.[0] ?? "";
    expect(svg).toContain('data-kind="stacked"');
    expect(svg).toContain('height="80"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="ORIVILO"');
    expect(svg).not.toContain("aria-hidden");
  });

  it("places the lockup above the heading", async () => {
    const html = await markup();
    expect(html.indexOf("<svg")).toBeGreaterThan(-1);
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("<h1"));
    expect(/<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1]).toBe(webMessages[locale].account.heading);
  });

  // ORV-195 row 15: the sign-in form follows the heading, so the order is svg, h1, form; the other
  // two views render no sign-in form.
  it(
    view === "signed-out"
      ? "places the sign-in form after the heading, below the lockup"
      : "renders no sign-in form",
    async () => {
      const html = await markup();
      const at = html.indexOf('data-testid="sign-in-form"');
      if (view !== "signed-out") {
        expect(at).toBe(-1);
        return;
      }
      expect(at).toBeGreaterThan(-1);
      expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("<h1"));
      expect(html.indexOf("<h1")).toBeLessThan(at);
    },
  );
});
