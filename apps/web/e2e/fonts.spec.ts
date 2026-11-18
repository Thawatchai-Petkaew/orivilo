import { expect, test } from "@playwright/test";

/**
 * ORV-275 rows 5 and 11: the home page loads its fonts from its own origin, Inter among them, and
 * its heading and text follow the type contract. The `h1` (`text-display-md`) and an `h2`
 * (`text-heading-sm`) are heading styles, Inter before Anuphan; a paragraph is body text, Inter
 * before Sarabun. Nothing in `apps/web` sets a family: the design system's tokens do.
 */

const SCHEMES = ["light", "dark"] as const;

for (const scheme of SCHEMES) {
  test(`fonts and type stacks, ${scheme}`, async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("the config sets baseURL");
    const context = await browser.newContext({ baseURL, colorScheme: scheme });
    try {
      const page = await context.newPage();
      const fontRequests: string[] = [];
      page.on("request", (request) => {
        if (request.resourceType() === "font") fontRequests.push(request.url());
      });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      // Row 5: every font request has the page's origin, and Inter is loaded.
      expect(fontRequests.length, "the page requests at least one font").toBeGreaterThan(0);
      for (const url of fontRequests) {
        expect(new URL(url).origin, url).toBe(new URL(baseURL).origin);
      }
      const loaded = await page.evaluate(() =>
        Array.from(document.fonts)
          .filter((face) => face.status === "loaded")
          .map((face) => face.family.replaceAll('"', "")),
      );
      expect(loaded).toContain("Inter");
      expect(
        fontRequests.some((url) => /inter/i.test(new URL(url).pathname)),
        "an Inter file is requested",
      ).toBe(true);

      // Row 11: the computed stacks of a heading style and of body text.
      const stack = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((el) => getComputedStyle(el).fontFamily);
      expect(await stack("h1")).toMatch(/^Inter, Anuphan,/);
      expect(await stack("h2")).toMatch(/^Inter, Anuphan,/);
      expect(await stack("p")).toMatch(/^Inter, Sarabun,/);
    } finally {
      await context.close();
    }
  });
}
