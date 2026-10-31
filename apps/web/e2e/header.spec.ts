import { expect, test } from "@playwright/test";
import { webMessages } from "../i18n/messages";

/**
 * ORV-194 rows 12 and 13: the app header keeps one start edge at 360 (the locale switch sits flush
 * with the content edges, wrapped or not) and the logo link's focus box clears the logo by 4 px.
 */

type Locale = "th" | "en";
const LOCALES: readonly Locale[] = ["th", "en"];
const SCHEMES = ["light", "dark"] as const;
const WIDTHS: readonly number[] = [360, 1280];
const EDGE_TOLERANCE = 0.5;
const FOCUS_CLEARANCE = 4;

for (const locale of LOCALES) {
  for (const scheme of SCHEMES) {
    for (const width of WIDTHS) {
      test(`header ${locale} ${scheme} ${width}`, async ({ browser, baseURL }) => {
        if (!baseURL) throw new Error("the config sets baseURL");
        const context = await browser.newContext({
          baseURL,
          colorScheme: scheme,
          viewport: { width, height: 800 },
        });
        try {
          await context.addCookies([{ name: "orv-locale", value: locale, url: baseURL }]);
          const page = await context.newPage();
          await page.goto("/");
          await expect(page.locator("html")).toHaveAttribute("lang", locale);

          // Row 12.2: no horizontal overflow, and the switch sits on a content edge.
          const m = await page.evaluate(() => {
            const header = document.querySelector("header");
            const nav = header?.querySelector("nav");
            const form = header?.querySelector("form");
            const svg = nav?.querySelector("svg");
            const buttons = form ? Array.from(form.querySelectorAll("button")) : [];
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (!header || !nav || !form || !svg || !first || !last)
              throw new Error("header parts");
            const textLeft = (el: Element) => {
              const r = document.createRange();
              r.selectNodeContents(el);
              return r.getBoundingClientRect().left;
            };
            const textRight = (el: Element) => {
              const r = document.createRange();
              r.selectNodeContents(el);
              return r.getBoundingClientRect().right;
            };
            const hr = header.getBoundingClientRect();
            const hs = getComputedStyle(header);
            return {
              scrollWidth: document.documentElement.scrollWidth,
              innerWidth,
              headerHeight: hr.height,
              formTop: form.getBoundingClientRect().top,
              navBottom: nav.getBoundingClientRect().bottom,
              navTop: nav.getBoundingClientRect().top,
              formBottom: form.getBoundingClientRect().bottom,
              firstTextLeft: textLeft(first),
              lastTextRight: textRight(last),
              svgLeft: svg.getBoundingClientRect().left,
              contentRight: hr.right - parseFloat(hs.paddingRight),
            };
          });
          expect(m.scrollWidth, "scrollWidth").toBe(m.innerWidth);
          const wrapped = m.formTop >= m.navBottom;
          if (wrapped) {
            expect(Math.abs(m.firstTextLeft - m.svgLeft), "wrapped start edge").toBeLessThanOrEqual(
              EDGE_TOLERANCE,
            );
          } else {
            expect(
              Math.abs(m.lastTextRight - m.contentRight),
              "one-row end edge",
            ).toBeLessThanOrEqual(EDGE_TOLERANCE);
          }
          if (width === 360 && locale === "th") {
            expect(wrapped, "Thai at 360 is one row").toBe(false);
            expect(m.headerHeight, "Thai at 360 header height").toBe(48);
          }

          // Row 13.2: Tab once lands on the home link, whose box clears the svg by 4 px.
          await page.keyboard.press("Tab");
          const home = page.getByRole("link", { name: webMessages[locale].app.home });
          await expect(home).toBeFocused();
          const box = await home.evaluate((el) => {
            const svg = el.querySelector("svg");
            if (!svg) throw new Error("logo svg");
            const l = el.getBoundingClientRect();
            const s = svg.getBoundingClientRect();
            return {
              left: l.left - s.left,
              top: l.top - s.top,
              right: s.right - l.right,
              bottom: s.bottom - l.bottom,
              svgLeft: s.left,
              svgTop: s.top,
            };
          });
          expect(box.left, "link left").toBeLessThanOrEqual(-FOCUS_CLEARANCE);
          expect(box.top, "link top").toBeLessThanOrEqual(-FOCUS_CLEARANCE);
          expect(box.right, "link right").toBeLessThanOrEqual(-FOCUS_CLEARANCE);
          expect(box.bottom, "link bottom").toBeLessThanOrEqual(-FOCUS_CLEARANCE);
          expect(box.svgLeft, "svg left").toBeCloseTo(width === 360 ? 16 : 320, 1);
          expect(box.svgTop, "svg top").toBeCloseTo(wrapped ? 16 : 20, 1);
        } finally {
          await context.close();
        }
      });
    }
  }
}
