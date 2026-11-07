import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../i18n/messages";

vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({ locale: "en" as "en" | "th" }));
vi.mock("../i18n/locale", async () => {
  const { webMessages: all } = await import("../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});

const { default: Home } = await import("./page");

// ORV-267 row 13: the home page links to /read, in the catalog's words, in each language.
describe("the home page link to the brand report", () => {
  it.each(["en", "th"] as const)(
    "is one link to /read named by the catalog in %s",
    async (locale) => {
      state.locale = locale;
      const html = renderToStaticMarkup(await Home());
      const links = [...html.matchAll(/<a [^>]*href="\/read"[^>]*>(.*?)<\/a>/g)];
      expect(links).toHaveLength(1);
      expect(links[0]?.[1]).toBe(webMessages[locale].home.openBrandReport);
    },
  );
});
