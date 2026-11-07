import { MissingEnvError } from "@orivilo/db";
import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import { TOTAL_BUDGET_MS } from "../../../../packages/intent-engine/src/read-page";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { captureLines } from "@orivilo/auth/log-testing";
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
    vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
    const html = await render("th", listed);
    expect(html).toContain("data-read-form");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    expect(form.props).toStrictEqual({
      errors: webMessages.th.saved.errors,
      wait: webMessages.th.wait,
      failure: webMessages.th.failure,
    });
  });
});

// ORV-268 rows 11 to 13: a signed-in person off the list, or with the list unset or empty, sees one
// line and no form; a person on the list sees the form.
describe.each(["en", "th"] as const)("/read signed in but not allowed in %s", (locale) => {
  const m = () => messagesFor(locale).brandReport;
  const expectLine = (html: string) => {
    expect(text(html)).toContain(m().heading);
    expect(text(html)).toContain(m().notAllowed);
    expect(text(html)).not.toContain(m().notConfigured);
    expect(html).not.toContain("<form");
    expect(html).not.toContain("data-read-form");
    expect(html).not.toContain("<a ");
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  };

  it("not allowed: the line, no form, no address", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
    const html = await render(locale, stranger);
    expectLine(html);
    expect(html).not.toContain("not.listed");
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
  ])("unset list shows not allowed (%s)", async (_name, value) => {
    if (value === undefined) delete process.env["READ_ALLOWED_EMAILS"];
    else vi.stubEnv("READ_ALLOWED_EMAILS", value);
    expectLine(await render(locale, listed));
  });

  it("allowed shows the form", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
    const html = await render(locale, listed);
    expect(html).toContain("data-read-form");
    expect(text(html)).not.toContain(m().notAllowed);
  });

  it("not allowed logs nothing", async () => {
    vi.stubEnv("READ_ALLOWED_EMAILS", LIST);
    const capture = captureLines();
    try {
      await render(locale, stranger);
      expect(capture.lines).toEqual([]);
    } finally {
      capture.restore();
    }
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
