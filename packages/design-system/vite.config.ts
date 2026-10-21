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
        test: {
          name: "storybook",
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
