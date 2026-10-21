// Writes src/tokens/generated.css from the three source files and src/profiles/generated.css from
// the profiles registered in src/profiles/index.ts. Run: pnpm --filter @orivilo/design-system tokens
import { writeFileSync } from "node:fs";
import path from "node:path";
import { emitProfilesCss, profiles } from "../src/profiles/index.ts";
import { tokens } from "../src/tokens/index.ts";

const src = path.join(import.meta.dirname, "..", "src");
const errors = [...tokens.validate(), ...profiles.flatMap((p) => p.validate())];
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
writeFileSync(path.join(src, "tokens", "generated.css"), tokens.emitCss());
writeFileSync(path.join(src, "profiles", "generated.css"), emitProfilesCss(profiles));
console.log(
  `tokens/generated.css: ${tokens.tokens.length} tokens (${tokens.layer("primitive").length} primitive, ${tokens.layer("semantic").length} semantic, ${tokens.layer("component").length} component)`,
);
for (const p of profiles) {
  console.log(
    `profiles/generated.css: ${p.id}, ${p.overrides.length} overrides, ${p.ownPrimitives.length} own primitives`,
  );
}
