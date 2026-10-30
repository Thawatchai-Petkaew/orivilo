import { defineConfig } from "@playwright/test";

/**
 * ORV-161 orv161-servers: the axe scan of the pages that need no database. The server is
 * `next start` from one `pnpm build` (never `next dev`), on port 3200. Port 3000 is the owner's
 * dev server, 6100 is Storybook and 3100 is ORV-118's hand run, so none is used.
 *
 * Each of the app's six names is set to the empty string. Next.js fills a name from `.env.local`
 * only when it is undefined, and `requireEnv` treats an empty value as missing, so a Mac's
 * `.env.local` can never configure this server. `reuseExistingServer: false` makes a busy port
 * fail the run instead of being reused.
 */
const PORT = 3200;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  // orv161-wait: limits are at least 10 times the local time of `pnpm test:e2e` after
  // `pnpm build` (one scan about 1.5 s on the Mac), sized for the CI runner (testing.md).
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: BASE_URL },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: "",
      BETTER_AUTH_URL: "",
      BETTER_AUTH_SECRET: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      OPENROUTER_API_KEY: "",
    },
  },
});
