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
  {
    // packages/db/src/migrate.ts:31, `realpathSync(started)`. `started` is `path.resolve(argv1)` (line 28)
    // and `argv1` is `process.argv[1]` (line 38): the script path the operator started the migration
    // with. The module runs as a CLI with MIGRATION_DATABASE_URL; no request reaches it. A rewrite
    // without the call would change how `isEntry` resolves symlinks. This block also hides a later
    // finding of this rule in this file (ORV-114, scan-override-1).
    files: ["packages/db/src/migrate.ts"],
    rules: { "security/detect-non-literal-fs-filename": "off" },
  },
  {
    // packages/intent-engine/src/interpreter.ts:319 and :320. The pattern is a lexicon term passed
    // through `escape` (line 314), so every regex metacharacter in it is literal. The terms come from
    // the `lexicon` argument of `interpretWithRules`, whose default is RULE_LEXICON; no call in the
    // repo passes another. The user's brief is the string searched, never the pattern. A rewrite
    // without `RegExp` would change the interpreter's matching code (resolver logic is a risk flag).
    // This block also hides a later finding of this rule in this file (ORV-114, scan-override-1).
    files: ["packages/intent-engine/src/interpreter.ts"],
    rules: { "security/detect-non-literal-regexp": "off" },
  },
];
