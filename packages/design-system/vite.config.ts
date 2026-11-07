import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const storybookDir = path.join(import.meta.dirname, ".storybook");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        // Repository checks: catalog and story parity, copy rules. Node only, no browser.
        test: {
          name: "checks",
          environment: "node",
          include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
        },
      },
      {
        // Every story is a test: it must render, and the a11y addon must find zero violations.
        plugins: [storybookTest({ configDir: storybookDir })],
        // The play tests assert the Thai catalog; the preview reads this to start a test run in Thai.
        define: { "import.meta.env.STORYBOOK_TEST_LOCALE": JSON.stringify("th") },
        test: {
          name: "storybook",
          // A play that takes a screenshot queues on one lock behind every other story file, and the
          // first shot of a file pays the browser's cost. On the Mac full gate (pnpm test --force)
          // Logo Kinds took 14.0 s, Edge Ink Light 14.8 s, Send 11.4 s and Paint At 11.2 s, and 3 of 8
          // runs hit the 15 s default (ORV-118 review 2, worst 15.4 s). CI took at most 3.1 s for
          // the same plays (runs 41113921292 and 41163292801). 60 s is about 4 times the worst Mac
          // time, so only a hung play fails it.
          testTimeout: 60_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
