// Writes src/blocks/generated.ts from catalog/blocks/mvp.yaml (spec ORV-44 part 2).
// Run: pnpm --filter @orivilo/design-system blocks
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { emitBlocksModule, parseBlockRegistry } from "../src/blocks/emit.ts";

const root = path.join(import.meta.dirname, "..");
const yaml = readFileSync(path.join(root, "catalog", "blocks", "mvp.yaml"), "utf8");
const registry = parseBlockRegistry(yaml);
writeFileSync(path.join(root, "src", "blocks", "generated.ts"), emitBlocksModule(registry));
console.log(`blocks/generated.ts: ${registry.blocks.length} blocks`);
