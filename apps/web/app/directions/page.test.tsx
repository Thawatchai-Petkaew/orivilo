import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";

const page = vi.hoisted(() => ({ locale: "en" as "en" | "th" }));

vi.mock("server-only", () => ({}));
vi.mock("../../i18n/locale", async () => {
  const { webMessages: all } = await import("../../i18n/messages");
  return {
    getWebMessages: async () => ({ locale: page.locale, m: all[page.locale] }),
  };
});
vi.mock("./actions", () => ({
  listDirections: vi.fn(async () => ({
    ok: false,
    error: "workspace-not-found",
    code: "NOT_FOUND",
    requestId: "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f",
    retryable: false,
  })),
  approveDirection: vi.fn(),
  exportVersion: vi.fn(),
  importDirection: vi.fn(),
  openVersion: vi.fn(),
  readBriefWithAi: vi.fn(),
  saveDirection: vi.fn(),
}));
vi.mock("@orivilo/design-system/examples", () => ({
  WorkspaceScreen: ({ headingLevel }: { headingLevel?: number }) => (
    <i data-screen-heading-level={headingLevel} />
  ),
}));

const { default: DirectionsPage } = await import("./page");

const statusOf = (html: string) => /<div role="status"[^>]*>(.*?)<\/div>/.exec(html)?.[1] ?? "";
const paragraphs = (markup: string) =>
  [...markup.matchAll(/<p [^>]*>(.*?)<\/p>/g)].map((p) => p[1] ?? "");
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");

// ORV-159 row 11: the page turns a missing workspace into the Studio with its own notice.
describe("/directions with a workspace the person is not in", () => {
  it.each([
    ["en", "Not done"],
    ["th", "ทำไม่สำเร็จ"],
  ] as const)(
    "the first notice from the page names a missing workspace in %s",
    async (locale, word) => {
      page.locale = locale;
      const html = renderToStaticMarkup(await DirectionsPage());
      const status = statusOf(html);
      expect(text(status)).toContain(word);
      expect(paragraphs(status).map(text)).toStrictEqual([
        webMessages[locale].saved.errors["workspace-not-found"],
      ]);
    },
  );
});

// ORV-225 row 10 (heading-level-1, W6): the page owns the one h1, the studio an h2 and the
// preview an h3, so the embedded screen opens its title one level deeper, at h4.
describe("/directions heading order", () => {
  it("embeds the reference screen with its title at level 4", async () => {
    page.locale = "en";
    const html = renderToStaticMarkup(await DirectionsPage());
    expect(html).toContain('data-screen-heading-level="4"');
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
  });
});
