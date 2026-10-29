import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("../../i18n/locale", () => ({
  getWebMessages: async () => ({ m: webMessages.en }),
}));
vi.mock("../../server/auth", () => ({
  auth: () => ({ api: { getSession: async () => null } }),
  accessDeps: () => ({}),
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
    expect(form.labels).toEqual({ account: webMessages.en.account, wait: webMessages.en.wait });
  });
});
