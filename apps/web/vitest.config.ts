import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["*.test.ts", "i18n/*.test.ts", "app/**/*.test.ts"] },
});
