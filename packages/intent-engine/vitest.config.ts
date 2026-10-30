import { defineConfig } from "vitest/config";

export default defineConfig({
  // ORV-160 orv160-network-block: the setup file replaces the global `fetch` with a rejection.
  test: { setupFiles: ["./vitest.setup.ts"] },
});
