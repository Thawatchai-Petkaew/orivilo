import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { noRawStyleClasses } from "@orivilo/design-system/eslint";
import { DB_CLIENT_ONLY_IN, restrictDbClient } from "@orivilo/db/eslint-boundary";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "next-env.d.ts"] },
  // DESIGN.md §5: no raw colour, radius, shadow, or font classes in pages or components.
  { files: ["**/*.tsx"], ...noRawStyleClasses },
  // ADR 0002: only server/ opens the database; everything else goes through withWorkspace.
  { files: ["**/*.{ts,tsx}"], ignores: DB_CLIENT_ONLY_IN, ...restrictDbClient },
  // ORV-141 orv141-no-console: request-time lines go through the logger in @orivilo/auth, never console.
  {
    files: ["app/**/*.{ts,tsx}", "server/**/*.{ts,tsx}", "i18n/**/*.{ts,tsx}", "proxy.ts"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "no-console": "error" },
  },
  // ORV-144 orv144-retry: the client retry module imports nothing from node: and no value from
  // @orivilo/auth. no-restricted-imports reports a single-line import, a multi-line import, a
  // side-effect import and an `export ... from`; the ImportExpression selector reports `import()`.
  {
    files: ["client/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["node:*"], message: "orv144-retry: client code imports nothing from node:." },
            {
              group: ["@orivilo/auth", "@orivilo/auth/*"],
              message: "orv144-retry: client code imports nothing from @orivilo/auth.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          // esquery regexes cannot hold a slash, so "." stands for the one in "@orivilo/auth".
          selector: "ImportExpression[source.value=/^(node:|@orivilo.auth)/]",
          message: "orv144-retry: client code imports nothing from node: or @orivilo/auth.",
        },
      ],
    },
  },
];

export default config;
