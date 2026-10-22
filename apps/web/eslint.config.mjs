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
];

export default config;
