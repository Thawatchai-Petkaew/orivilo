// Writes src/commands/generated.ts from catalog/commands/canvas.yaml (ADR 0004 item 5).
// Run: pnpm --filter @orivilo/design-system commands
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { emitCommandsModule, parseRegistry } from "../src/commands/emit.ts";

const root = path.join(import.meta.dirname, "..");
const yaml = readFileSync(path.join(root, "catalog", "commands", "canvas.yaml"), "utf8");
const registry = parseRegistry(yaml);
writeFileSync(path.join(root, "src", "commands", "generated.ts"), emitCommandsModule(registry));
console.log(`commands/generated.ts: ${registry.commands.length} commands`);
