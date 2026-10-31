import { renderToStaticMarkup } from "react-dom/server";
import { Denied } from "@orivilo/auth";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  session: null as unknown,
  denied: null as unknown,
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
    throw state.denied;
  },
}));
vi.mock("./actions", () => ({ signInWithGoogle: async () => null, signOut: async () => {} }));
const form = vi.hoisted(() => ({ labels: undefined as unknown }));
vi.mock("./SignInForm", () => ({
  SignInForm: (props: { labels: unknown }) => {
    form.labels = props.labels;
    return null;
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
