import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { webMessages, type WebMessages } from "../i18n/messages";
import config from "../playwright.config";

/**
 * ORV-161 (ORV-113 item 8): the axe scan of every `apps/web` page state that needs no database,
 * in each locale, colour scheme and width of orv161-matrix. It reports which rules ran on which
 * pages and what they found; it makes no claim about WCAG conformance (orv161-report).
 */

/**
 * orv161-rules: axe-core 4.14.0's default rule set with `target-size` switched on, 91 rules. The
 * 14 rules axe leaves off (and this scan too) are `aria-roledescription`, `audio-caption`,
 * `color-contrast-enhanced`, `css-orientation-lock`, `duplicate-id`, `duplicate-id-active`,
 * `focus-order-semantics`, `hidden-content`, `identical-links-same-purpose`,
 * `landmark-complementary-is-top-level`, `meta-refresh-no-exceptions`, `p-as-heading`,
 * `table-fake-caption` and `td-has-header`. A rule that axe adds or drops changes the set read from
 * its result, so an upgrade fails here until this list is read again.
 */
const RULES = `
  accesskeys area-alt aria-allowed-attr aria-allowed-role aria-braille-equivalent
  aria-command-name aria-conditional-attr aria-deprecated-role aria-dialog-name
  aria-hidden-body aria-hidden-focus aria-input-field-name aria-meter-name
  aria-progressbar-name aria-prohibited-attr aria-required-attr aria-required-children
  aria-required-parent aria-roles aria-tab-name aria-text aria-toggle-field-name
  aria-tooltip-name aria-treeitem-name aria-valid-attr aria-valid-attr-value
  autocomplete-valid avoid-inline-spacing blink button-name bypass color-contrast
  definition-list dlitem document-title duplicate-id-aria empty-heading empty-table-header
  form-field-multiple-labels frame-focusable-content frame-tested frame-title
  frame-title-unique heading-order html-has-lang html-lang-valid html-xml-lang-mismatch
  image-alt image-redundant-alt input-button-name input-image-alt label
  label-content-name-mismatch label-title-only landmark-banner-is-top-level
  landmark-contentinfo-is-top-level landmark-main-is-top-level landmark-no-duplicate-banner
  landmark-no-duplicate-contentinfo landmark-no-duplicate-main landmark-one-main
  landmark-unique link-in-text-block link-name list listitem marquee meta-refresh
  meta-viewport meta-viewport-large nested-interactive no-autoplay-audio object-alt
  page-has-heading-one presentation-role-conflict region role-img-alt scope-attr-valid
  scrollable-region-focusable select-name server-side-image-map skip-link summary-name
  svg-img-alt tabindex table-duplicate-name target-size td-headers-attr th-has-data-cells
  valid-lang video-caption
`
  .trim()
  .split(/\s+/);

/**
 * orv161-servers: the server these scans run against reaches no database. Its six names are the
 * empty string, which `requireEnv` treats as missing and which a Mac's `.env.local` cannot fill.
 * Setting only `DATABASE_URL` would leave every page not-configured (the other names stay blank),
 * so the state line cannot show it; this check does. It fails the run when it loads.
 */
const SERVER_NAMES = [
  "DATABASE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "OPENROUTER_API_KEY",
] as const;
const server = Array.isArray(config.webServer) ? config.webServer[0] : config.webServer;
for (const name of SERVER_NAMES) {
  if (server?.env?.[name] !== "") {
    throw new Error(`the port 3200 server must have ${name} set to the empty string`);
  }
}

type Exception = { route: string; state: string; rule: string; reason: string };

/**
 * orv161-exceptions: a rule is off for one page state only through an entry here, applied as axe's
 * `disableRules` for that state alone. `reason` says why the rule does not fit that page. The list
 * is empty at v1.0, and an entry is the last resort after a fix.
 */
export const EXCEPTIONS: readonly Exception[] = [];

for (const entry of EXCEPTIONS) {
  const name = `${entry.route} ${entry.state} ${entry.rule}`;
  if (entry.reason.trim() === "") throw new Error(`exception without a reason: ${name}`);
  if (!RULES.includes(entry.rule))
    throw new Error(`exception for a rule that does not run: ${name}`);
}

type Locale = "th" | "en";
type Scheme = "light" | "dark";

/** orv161-pages, slice 3: the states that need no database. */
const STATES: readonly {
  route: string;
  state: string;
  path: string;
  status: number;
  line: (m: WebMessages) => string;
}[] = [
  { route: "/", state: "page", path: "/", status: 200, line: (m) => m.home.headline },
  // The reference screen is a fixture with Thai data in both locales (workspace.tsx h1).
  {
    route: "/workspace",
    state: "page",
    path: "/workspace",
    status: 200,
    line: () => "ทีมออกแบบ Brand Canvas",
  },
  {
    route: "/_not-found",
    state: "page",
    path: "/orv-161-no-such-page",
    status: 404,
    line: (m) => m.notFound.heading,
  },
  {
    route: "/directions",
    state: "not-configured",
    path: "/directions",
    status: 200,
    line: (m) => m.saved.notConfigured,
  },
  {
    route: "/account",
    state: "not-configured",
    path: "/account",
    status: 200,
    line: (m) => m.account.notConfigured,
  },
];

/** orv161-matrix: 2 locales, 2 colour schemes, 2 widths. */
const LOCALES: readonly Locale[] = ["th", "en"];
const SCHEMES: readonly Scheme[] = ["light", "dark"];
const WIDTHS: readonly number[] = [360, 1280];
const HEIGHT = 800;

for (const s of STATES) {
  for (const locale of LOCALES) {
    for (const scheme of SCHEMES) {
      for (const width of WIDTHS) {
        test(`${s.route} ${s.state} ${locale} ${scheme} ${width}`, async ({ browser, baseURL }) => {
          if (!baseURL) throw new Error("the config sets baseURL");
          const context = await browser.newContext({
            baseURL,
            colorScheme: scheme,
            viewport: { width, height: HEIGHT },
          });
          try {
            await context.addCookies([{ name: "orv-locale", value: locale, url: baseURL }]);
            const page = await context.newPage();

            // orv161-wait: five conditions, never a fixed time.
            const response = await page.goto(s.path);
            expect(response?.status(), "response status").toBe(s.status);
            await expect(
              page.getByText(s.line(webMessages[locale]), { exact: true }),
            ).toBeVisible();
            await expect(page.locator("html")).toHaveAttribute("lang", locale);
            await expect
              .poll(() => page.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches), {
                message: "colour scheme",
              })
              .toBe(scheme === "dark");
            await expect
              .poll(() => page.evaluate(() => innerWidth), { message: "viewport width" })
              .toBe(width);

            const disabled = EXCEPTIONS.filter(
              (e) => e.route === s.route && e.state === s.state,
            ).map((e) => e.rule);
            // `AxeBuilder#disableRules` replaces the whole `rules` option, which would drop the
            // `target-size` switch, so an exception is set here as `enabled: false` beside it.
            const results = await new AxeBuilder({ page })
              .options({
                rules: {
                  "target-size": { enabled: true },
                  ...Object.fromEntries(disabled.map((rule) => [rule, { enabled: false }])),
                },
              })
              .analyze();

            // Row 5: the scan runs the rules of orv161-rules, no more and no fewer.
            const ran = [
              ...results.passes,
              ...results.violations,
              ...results.incomplete,
              ...results.inapplicable,
            ].map((r) => r.id);
            expect([...new Set(ran)].sort(), "runs the rules of orv161-rules").toEqual(
              RULES.filter((r) => !disabled.includes(r)).sort(),
            );

            expect(
              results.violations.map(
                (v) =>
                  `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
              ),
              "axe violations",
            ).toEqual([]);
          } finally {
            await context.close();
          }
        });
      }
    }
  }
}
