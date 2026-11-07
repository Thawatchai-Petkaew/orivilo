import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      // Server-only package: no UI framework, and the client stays behind the helper (ADR 0002).
      "no-restricted-imports": ["error", { patterns: ["react", "react-dom", "next", "next/*"] }],
    },
  },
  // ORV-141 orv141-no-console: request-time lines go through src/log.ts, the one module that writes to console.
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts", "src/log.ts"],
    rules: { "no-console": "error" },
  },
);
