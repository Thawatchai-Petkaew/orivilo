import { MissingEnvError } from "@orivilo/db";
import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import { TOTAL_BUDGET_MS } from "../../../../packages/intent-engine/src/read-page";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  session: null as unknown,
  throws: null as unknown,
}));
vi.mock("../../i18n/locale", async () => {
  const { webMessages: all } = await import("../../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});
vi.mock("../../server/auth", () => ({
  auth: () => ({
    api: {
      getSession: async () => {
        if (state.throws !== null) throw state.throws;
        return state.session;
      },
    },
  }),
}));
// The form calls the real action, which reaches the database; the page only needs its labels.
const form = vi.hoisted(() => ({ props: undefined as unknown }));
vi.mock("./ReadForm", () => ({
  ReadForm: (props: unknown) => {
    form.props = props;
    return <i data-read-form="" />;
  },
}));

const page = await import("./page");

async function render(locale: "en" | "th", session: unknown, throws: unknown = null) {
  state.locale = locale;
  state.session = session;
  state.throws = throws;
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>{await page.default()}</LocaleProvider>,
  );
}
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");

// ORV-267 row 36 and ORV-266 test G1: the read stops at 30 s, so the route may run longer, and the
// page is never rendered ahead of time.
describe("the route's limits", () => {
  it("sets maxDuration to 60, above the 30 s of TOTAL_BUDGET_MS", () => {
    expect(page.maxDuration).toBe(60);
    expect(page.maxDuration * 1000).toBeGreaterThan(TOTAL_BUDGET_MS);
  });

  it("is dynamic", () => {
    expect(page.dynamic).toBe("force-dynamic");
  });
});

// ORV-267 row 10 and ORV-266 test G2: signed out, a sign-in prompt and no form.
describe.each(["en", "th"] as const)("/read signed out in %s", (locale) => {
  it("shows the heading, the sign-in line and the link to /account, with no form", async () => {
    const html = await render(locale, null);
    const m = messagesFor(locale).brandReport;
    expect(text(html)).toContain(m.heading);
    expect(text(html)).toContain(m.signedOut);
    const link = /<a [^>]*href="\/account"[^>]*>(.*?)<\/a>/.exec(html);
    expect(link?.[1]).toBe(m.signInLink);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("data-read-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });
});

it("says the sign-in line the spec quotes", () => {
  expect(messagesFor("en").brandReport.signedOut).toBe("Sign in to read a website.");
  expect(messagesFor("th").brandReport.signedOut).toBe("ลงชื่อเข้าใช้ก่อน แล้วจึงอ่านเว็บไซต์ได้");
});

// ORV-267 row 11: with no auth or database set up, the page says so and shows no form.
describe.each(["en", "th"] as const)("/read not configured in %s", (locale) => {
  it("shows the heading and the not-configured line, with no form", async () => {
    const html = await render(locale, null, new MissingEnvError("DATABASE_URL"));
    const m = messagesFor(locale).brandReport;
    expect(text(html)).toContain(m.heading);
    expect(text(html)).toContain(m.notConfigured);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("data-read-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });

  it("lets any other error through", async () => {
    await expect(render(locale, null, new Error("boom"))).rejects.toThrow("boom");
  });
});

// ORV-267 rows 12 and 29: signed in, the page shows the form and gives it the labels it needs.
describe("/read signed in", () => {
  it("renders the form inside the one main and gives it the page's own labels", async () => {
    const html = await render("th", { user: { id: "u1" } });
    expect(html).toContain("data-read-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(form.props).toStrictEqual({
      errors: webMessages.th.saved.errors,
      wait: webMessages.th.wait,
      failure: webMessages.th.failure,
    });
  });
});

describe("/read metadata", () => {
  it.each(["en", "th"] as const)(
    "takes its title and description from the catalog in %s",
    async (locale) => {
      state.locale = locale;
      expect(await page.generateMetadata()).toStrictEqual({
        title: webMessages[locale].brandReport.title,
        description: webMessages[locale].brandReport.description,
      });
    },
  );
});
