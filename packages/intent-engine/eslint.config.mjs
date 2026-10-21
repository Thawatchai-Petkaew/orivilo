import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.strict, {
  rules: {
    // The engine must stay deterministic and framework-free (see .claude/rules/design-system.md).
    "no-restricted-imports": ["error", { patterns: ["react", "react-dom", "next", "next/*"] }],
    "no-restricted-properties": [
      "error",
      { object: "Math", property: "random", message: "Resolver output must be reproducible." },
      { object: "Date", property: "now", message: "Pass time in as input instead." },
    ],
  },
});
