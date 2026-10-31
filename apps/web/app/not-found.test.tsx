import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../i18n/messages";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const state = vi.hoisted(() => ({ locale: "en" as "en" | "th" }));
vi.mock("../i18n/locale", async () => {
  const { webMessages: all } = await import("../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});

const { default: NotFound } = await import("./not-found");

// ORV-161 row 3: the copy and markup of the 404 page; the 404 status comes from the browser scan.
describe("the not-found page", () => {
  it.each(["th", "en"] as const)(
    "shows one main with heading, line and home link in %s",
    async (locale) => {
      state.locale = locale;
      const m = webMessages[locale].notFound;
      const html = renderToStaticMarkup(await NotFound());
      expect(html.match(/<main[\s>]/g)).toHaveLength(1);
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
      expect(/<h1[^>]*>(.*?)<\/h1>/.exec(html)?.[1]).toBe(m.heading);
      expect(html).toContain(m.body);
      expect(/<a [^>]*href="\/"[^>]*>(.*?)<\/a>/.exec(html)?.[1]).toBe(m.home);
      expect(html).not.toContain("This page could not be found");
    },
  );

  it("carries the copy of row 3", () => {
    expect(webMessages.en.notFound).toStrictEqual({
      heading: "Page not found",
      body: "No page in ORIVILO has this address. Check the address, or go back to the home page.",
      home: "Go to the home page",
    });
    expect(webMessages.th.notFound).toStrictEqual({
      heading: "ไม่พบหน้านี้",
      body: "ไม่มีหน้าใดใน ORIVILO ที่ใช้ที่อยู่นี้ ตรวจที่อยู่อีกครั้ง หรือกลับไปหน้าแรก",
      home: "ไปหน้าแรก",
    });
  });
});
