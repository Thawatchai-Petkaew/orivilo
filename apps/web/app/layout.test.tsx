import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../i18n/messages";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("./globals.css", () => ({}));
vi.mock("../i18n/LocaleSwitch", () => ({ LocaleSwitch: () => null }));
const state = vi.hoisted(() => ({ locale: "en" as "en" | "th" }));
vi.mock("../i18n/locale", async () => {
  const { webMessages: all } = await import("../i18n/messages");
  return { getWebMessages: async () => ({ locale: state.locale, m: all[state.locale] }) };
});

const { default: RootLayout } = await import("./layout");

async function headerMarkup(locale: "th" | "en"): Promise<string> {
  state.locale = locale;
  const html = renderToStaticMarkup(await RootLayout({ children: null }));
  return /<header[^>]*>.*<\/header>/s.exec(html)?.[0] ?? "";
}

// ORV-195 rows 12 and 13 (markup): the header's home link holds the horizontal lockup, decorative,
// and is named by the locale catalog. The look and the dark mode come from the browser scan.
describe.each([
  { locale: "th" as const, row: 12 },
  { locale: "en" as const, row: 13 },
])("the header lockup, row $row, $locale", ({ locale }) => {
  const m = webMessages[locale].app;

  it("puts the decorative horizontal Logo at height 24 inside the home link, named by the catalog", async () => {
    const header = await headerMarkup(locale);
    const link = /<a [^>]*href="\/"[^>]*>.*?<\/a>/s.exec(header)?.[0] ?? "";
    expect(link).toContain(`aria-label="${m.home}"`);
    const svg = /<svg[^>]*>/.exec(link)?.[0] ?? "";
    expect(svg).toContain('data-kind="horizontal"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toContain("role=");
    expect(svg).not.toContain("aria-label");
    expect(svg).toContain('height="24"');
  });

  it("drops the 8 px dot and the text ORIVILO from the home link", async () => {
    const header = await headerMarkup(locale);
    const link = /<a [^>]*href="\/"[^>]*>.*?<\/a>/s.exec(header)?.[0] ?? "";
    expect(link).not.toContain("bg-brand-signature");
    expect(link.replace(/<svg.*<\/svg>/s, "").replace(/<[^>]+>/g, "")).toBe("");
    expect(link).not.toMatch(/class="[^"]*(gap-2|text-text-primary|hover:text-text-link-hover)/);
  });

  it("places the lockup before the Studio and Account links", async () => {
    const header = await headerMarkup(locale);
    const at = (s: string) => header.indexOf(s);
    expect(at("<svg")).toBeGreaterThan(-1);
    expect(at("<svg")).toBeLessThan(at(m.studio));
    expect(at(m.studio)).toBeLessThan(at(m.account));
  });
});
