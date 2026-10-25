// One root config for `pnpm scan:code` (ORV-108, slice B). It carries only eslint-plugin-security
// rules; style and type rules stay in each package's own config. TypeScript files need the parser.
import security from "eslint-plugin-security";
import tseslint from "typescript-eslint";

export default [
  security.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: { parser: tseslint.parser },
  },
  {
    // Each package's own config owns its eslint-disable comments; this config does not know their rules.
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  {
    // Off: it fires on every `obj[key]` with a non-literal key (211 hits at landing) and the plugin
    // has no data flow, so it cannot tell a user key from a loop index. Review reads for it.
    rules: { "security/detect-object-injection": "off" },
  },
  {
    // Off for tests and repo scripts: they read paths the repo itself chose (468 hits at landing,
    // nearly all here). The rule stays on for application source under apps and packages.
    files: ["**/*.test.*", "scripts/**"],
    rules: { "security/detect-non-literal-fs-filename": "off" },
  },
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/storybook-static/**"],
  },
];
