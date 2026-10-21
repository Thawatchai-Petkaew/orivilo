// Writes src/tokens/generated.css from the three source files. Run: pnpm --filter @orivilo/design-system tokens
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TokenSet } from "../src/tokens/model.ts";

const dir = path.join(import.meta.dirname, "..", "src", "tokens");
const read = (name: string) =>
  JSON.parse(readFileSync(path.join(dir, "source", `${name}.json`), "utf8"));
const set = new TokenSet(read("primitives"), read("semantic"), read("component"));
const errors = set.validate();
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
writeFileSync(path.join(dir, "generated.css"), set.emitCss());
console.log(
  `generated.css: ${set.tokens.length} tokens (${set.layer("primitive").length} primitive, ${set.layer("semantic").length} semantic, ${set.layer("component").length} component)`,
);
