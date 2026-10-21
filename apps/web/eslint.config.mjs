import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { noRawStyleClasses } from "@orivilo/design-system/eslint";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "next-env.d.ts"] },
  // DESIGN.md §5: no raw colour, radius, shadow, or font classes in pages or components.
  { files: ["**/*.tsx"], ...noRawStyleClasses },
];

export default config;
