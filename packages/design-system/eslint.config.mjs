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
      "no-restricted-imports": [
        "error",
        {
          patterns: ["next", "next/*", "lucide-react/*"],
          paths: [
            {
              name: "lucide-react",
              message: "Import icons from src/components/icons.tsx (DESIGN.md §6, ORV-55).",
            },
          ],
        },
      ],
    },
  },
  {
    // The one door to the icon library: named imports only, so the bundle carries the glyphs used.
    files: ["src/components/icons.tsx"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["next", "next/*", "lucide-react/*"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value='lucide-react'] > ImportNamespaceSpecifier",
          message: "Name each Lucide icon; a namespace import ships the whole set.",
        },
      ],
    },
  },
);
