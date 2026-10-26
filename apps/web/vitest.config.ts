import { defineConfig } from "vitest/config";

export default defineConfig({
  // `.test.tsx` renders components to markup with react-dom/server; no DOM environment.
  oxc: { jsx: { runtime: "automatic" } },
  test: { include: ["*.test.ts", "i18n/*.test.ts", "app/**/*.test.ts", "app/**/*.test.tsx"] },
});
