import { MissingEnvError } from "@orivilo/db";
import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { webMessages } from "../../../i18n/messages";

// ORV-281 tech notes T21 (spec rows 5, 6, 7): the intake page. The form calls the real action,
// which reaches the database; the page only needs its labels.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  session: null as unknown,
  throws: null as unknown,
}));
vi.mock("../../../i18n/locale", async () => {
  const { webMessages: all } = await import("../../../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});
vi.mock("../../../server/auth", () => ({
  auth: () => ({
    api: {
      getSession: async () => {
        if (state.throws !== null) throw state.throws;
        return state.session;
      },
    },
  }),
}));
const form = vi.hoisted(() => ({ props: undefined as unknown }));
vi.mock("./IntakeForm", () => ({
  IntakeForm: (props: unknown) => {
    form.props = props;
    return <i data-intake-form="" />;
  },
}));

const page = await import("./page");

afterEach(() => {
  vi.unstubAllEnvs();
});

// Fixtures only: addresses under example.com and example.test (ORV-268).
const LIST = "reader@example.com,second@example.test";
const listed = { user: { id: "u1", email: "reader@example.com" } };
const stranger = { user: { id: "u2", email: "not.listed+tag@example.com" } };

async function render(locale: "en" | "th", session: unknown, throws: unknown = null) {
  state.locale = locale;
  state.session = session;
  state.throws = throws;
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>{await page.default()}</LocaleProvider>,
  );
}
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");

// The save may run past the default: slice 3 adds a model call. A server action takes the setting
// from the page that calls it.
describe("the route's limits", () => {
  it("sets maxDuration to 60", () => {
    expect(page.maxDuration).toBe(60);
  });

  it("is dynamic", () => {
    expect(page.dynamic).toBe("force-dynamic");
  });
});

describe.each(["en", "th"] as const)("/business/new signed out in %s", (locale) => {
  it("shows the heading, the sign-in line and the link to /account, with no form", async () => {
    const html = await render(locale, null);
    const m = messagesFor(locale).business;
    expect(text(html)).toContain(m.intake.heading);
    expect(text(html)).toContain(m.signedOut);
    const link = /<a [^>]*href="\/account"[^>]*>(.*?)<\/a>/.exec(html);
    expect(link?.[1]).toBe(m.signInLink);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("data-intake-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });
});

describe.each(["en", "th"] as const)("/business/new not configured in %s", (locale) => {
  it("shows the heading and the not-configured line, with no form", async () => {
    const html = await render(locale, null, new MissingEnvError("DATABASE_URL"));
    const m = messagesFor(locale).business;
    expect(text(html)).toContain(m.intake.heading);
    expect(text(html)).toContain(m.notConfigured);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("data-intake-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });

  it("lets any other error through", async () => {
    await expect(render(locale, null, new Error("boom"))).rejects.toThrow("boom");
  });
});

// Row 6: off the list, or with the list unset, one line, no form, no address.
describe.each(["en", "th"] as const)("/business/new signed in but not allowed in %s", (locale) => {
  const m = () => messagesFor(locale).business;
  const expectLine = (html: string) => {
    expect(text(html)).toContain(m().intake.heading);
    expect(text(html)).toContain(m().notAllowed);
    expect(text(html)).not.toContain(m().notConfigured);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("data-intake-form");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("example.com");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  };

  it("not allowed: the line, no form, no address", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
    expectLine(await render(locale, stranger));
  });

  it("an unset list: the same line", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", "");
    expectLine(await render(locale, listed));
  });
});

describe("/business/new signed in and approved", () => {
  it("renders the form inside the one main and gives it the page's own labels", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
    const html = await render("th", listed);
    expect(html).toContain("data-intake-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(form.props).toStrictEqual({
      errors: webMessages.th.saved.errors,
      wait: webMessages.th.wait,
      failure: webMessages.th.failure,
    });
  });
});
