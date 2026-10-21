import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { noRawStyleClasses } from "./eslint/no-raw-style-classes.mjs";

export default tseslint.config(
  { ignores: ["storybook-static/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["src/**", ".storybook/**"],
    ...noRawStyleClasses,
    rules: {
      ...noRawStyleClasses.rules,
      // Components must run inside any React host and inside customer preview frames (ADR 0003).
      "no-restricted-imports": ["error", { patterns: ["next", "next/*"] }],
    },
  },
);
