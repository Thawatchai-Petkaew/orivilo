import { defineConfig } from "vitest/config";

export default defineConfig({
  // `.test.tsx` renders components to markup with react-dom/server; no DOM environment.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    // ORV-160 orv160-network-block: the setup file replaces the global `fetch` with a rejection.
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "*.test.ts",
      "i18n/*.test.ts",
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
      "server/**/*.test.ts",
      "client/**/*.test.ts",
    ],
  },
});
