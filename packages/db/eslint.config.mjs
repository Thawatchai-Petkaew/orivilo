import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.strict, {
  rules: {
    // Server-only package: no UI framework, and the client stays behind the helper (ADR 0002).
    "no-restricted-imports": ["error", { patterns: ["react", "react-dom", "next", "next/*"] }],
  },
});
