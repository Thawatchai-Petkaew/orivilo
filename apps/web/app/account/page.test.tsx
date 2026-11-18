import type { ComponentProps } from "react";
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
// The real form renders inside the marker, so the notice a failed sign-in shows is in the markup.
vi.mock("./SignInForm", async (importOriginal) => {
  const { SignInForm: Real } = await importOriginal<typeof import("./SignInForm")>();
  return {
    SignInForm: (props: ComponentProps<typeof Real>) => {
      form.labels = props.labels;
      return (
        <>
          <span data-testid="sign-in-form" />
          <Real {...props} />
        </>
      );
    },
  };
});

const { default: AccountPage } = await import("./page");
const page = (query: Record<string, string | string[] | undefined> = {}) =>
  AccountPage({ searchParams: Promise.resolve(query) });

// ORV-112 design D2a: the column anchors to the top, so the notice grows downward only.
describe("/account signed out", () => {
  it("anchors main to the top and does not center it", async () => {
    const html = renderToStaticMarkup(await page());
    const main = /<main class="([^"]*)"/.exec(html)?.[1] ?? "";
    const classes = main.split(" ");
    expect(classes).toContain("justify-start");
    expect(classes).toContain("pt-24");
    expect(classes).not.toContain("min-h-dvh");
    expect(classes).not.toContain("justify-center");
  });

  // ORV-123 row 5 (design R1): the failure line comes from `account.failed`, not `saved.errors.failed`.
  it("gives the sign-in form its own failure line", async () => {
    renderToStaticMarkup(await page());
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
    const html = renderToStaticMarkup(await page());
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
    return renderToStaticMarkup(await page());
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

// ORV-286 rows 4 to 9 and 11 (signin-failure-1, signin-message-1).
const SIGN_IN_CODES = [
  "state_not_found",
  "invalid_callback_request",
  "state_mismatch",
  "state_invalid",
  "internal_server_error",
  "no_code",
  "oauth_provider_not_found",
  "issuer_missing",
  "issuer_mismatch",
  "invalid_code",
  "nonce_binding_missing",
  "unable_to_get_user_info",
  "no_callback_url",
  "email_not_found",
  "email_not_verified",
  "unable_to_link_account",
  "email_does_not_match",
  "account_already_linked_to_different_user",
  "provider_mismatch",
  "payload_expired",
  "user_creation_failed",
  "access_denied",
  "UNKNOWN",
  "foo_bar",
];
const signedOut = (locale: "en" | "th") => {
  state.locale = locale;
  state.session = null;
  state.denied = null;
};
const textOf = (html: string) => html.replace(/<[^>]*>/g, "").replaceAll("&quot;", '"');
const occurs = (haystack: string, needle: string) => haystack.split(needle).length - 1;
const statusRegion = (html: string) =>
  /<div role="status"[^>]*>(.*?)<\/div>/s.exec(html)?.[1] ?? "";

describe("failed sign-in message", () => {
  it.each(SIGN_IN_CODES)("shows the badge and the message once for ?error=%s", async (code) => {
    signedOut("en");
    const html = renderToStaticMarkup(await page({ error: code }));
    const region = textOf(statusRegion(html));
    expect(occurs(region, "Not done")).toBe(1);
    expect(occurs(region, webMessages.en.account.callbackFailed)).toBe(1);
    expect(occurs(textOf(html), webMessages.en.account.callbackFailed)).toBe(1);
  });

  it("is the same line for every code in the table", async () => {
    signedOut("en");
    const lines = new Set<string>();
    for (const code of SIGN_IN_CODES) {
      lines.add(textOf(statusRegion(renderToStaticMarkup(await page({ error: code })))));
    }
    expect(lines.size).toBe(1);
  });
});

describe("failed sign-in message, Thai", () => {
  it.each(["state_mismatch", "access_denied"])(
    "shows the Thai badge and line for ?error=%s",
    async (code) => {
      signedOut("th");
      const region = textOf(statusRegion(renderToStaticMarkup(await page({ error: code }))));
      expect(occurs(region, "ทำไม่สำเร็จ")).toBe(1);
      expect(occurs(region, webMessages.th.account.callbackFailed)).toBe(1);
    },
  );
});

describe("never echoes the address", () => {
  it.each<[string, Record<string, string | string[] | undefined>]>([
    ["markup in the value", { error: "<img src=x>" }],
    [
      "a description beside UNKNOWN",
      { error: "UNKNOWN", error_description: "Access blocked by provider" },
    ],
    ["two error values", { error: ["state_mismatch", "access_denied"] }],
  ])("gives the same message for %s and none of its text", async (_name, query) => {
    signedOut("en");
    const html = renderToStaticMarkup(await page(query));
    expect(occurs(textOf(statusRegion(html)), webMessages.en.account.callbackFailed)).toBe(1);
    for (const echoed of ["<img", "img src", "UNKNOWN", "Access blocked", ...SIGN_IN_CODES]) {
      expect(html, echoed).not.toContain(echoed);
    }
  });
});

describe("no error, no message", () => {
  it.each<[string, Record<string, string | string[] | undefined>]>([
    ["no query", {}],
    ["an empty value", { error: "" }],
    ["an empty list", { error: [] }],
    ["other parameters", { code: "1", state: "s" }],
  ])("shows the sign-in form without a notice for %s", async (_name, query) => {
    signedOut("en");
    const html = renderToStaticMarkup(await page(query));
    expect(html).toContain('data-testid="sign-in-form"');
    expect(html).not.toContain(webMessages.en.account.callbackFailed.slice(0, 20));
    expect(/<div role="status"[^>]*><\/div>/.test(html)).toBe(true);
  });
});

describe("signed in shows no failure", () => {
  it.each([{}, { error: "state_mismatch" }])("shows the signed-in view for %j", async (query) => {
    state.locale = "en";
    state.denied = null;
    state.session = {
      user: { email: "ana@example.com" },
      session: { activeOrganizationId: "ws-1" },
    };
    state.workspace = "Ana Studio";
    const html = renderToStaticMarkup(await page(query));
    expect(textOf(html)).toContain("Signed in as ana@example.com");
    expect(html).toContain("Ana Studio");
    expect(html).toContain(webMessages.en.account.signOut);
    expect(html).not.toContain('data-testid="sign-in-form"');
    expect(textOf(html)).not.toContain("did not finish");
    expect(html).not.toContain("Not done");
  });
});

describe("not configured ignores error", () => {
  it("shows only the not-configured line for ?error=state_mismatch", async () => {
    state.locale = "en";
    state.denied = new MissingEnvError("DATABASE_URL");
    state.session = {
      user: { email: "ana@example.com" },
      session: { activeOrganizationId: "ws-1" },
    };
    const html = renderToStaticMarkup(await page({ error: "state_mismatch" }));
    expect(html).toContain(webMessages.en.account.notConfigured);
    expect(textOf(html)).not.toContain("did not finish");
    expect(html).not.toContain("Not done");
    expect(html).not.toContain('data-testid="sign-in-form"');
  });
});

describe("no log", () => {
  it("writes no console line while the failed sign-in page renders", async () => {
    signedOut("en");
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
    try {
      renderToStaticMarkup(
        await page({ error: "state_mismatch", error_description: "Access blocked by provider" }),
      );
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
