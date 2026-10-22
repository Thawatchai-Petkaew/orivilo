/**
 * Turns catalog/blocks/mvp.yaml into the TypeScript module the components read
 * (`src/blocks/generated.ts`), so the registry stays the only place a block or a question is
 * spelled (spec ORV-44 part 2). Node only: the script and the staleness test import it; components
 * import the output.
 */
import { load } from "js-yaml";

export interface Words {
  th: string;
  en: string;
}

export interface RegistryOption extends Words {
  id: string;
}

export interface RegistryInput {
  id: string;
  required: boolean;
  answer: string;
  label: Words;
  question: Words;
  from?: string[];
  options?: RegistryOption[];
}

export interface RegistryBlock {
  id: string;
  kind: string;
  module: string;
  name: Words;
  output: string;
  inputs: RegistryInput[];
  feeds: string[];
}

export interface BlockRegistry {
  version: number;
  modules: Record<string, Words>;
  blocks: RegistryBlock[];
}

export function parseBlockRegistry(yaml: string): BlockRegistry {
  const doc = load(yaml) as Partial<BlockRegistry>;
  if (!doc.blocks || !doc.modules) throw new Error("mvp.yaml: needs modules and blocks");
  return doc as BlockRegistry;
}

const q = (s: string) => JSON.stringify(s);
const words = (w: Words) => `{ th: ${q(w.th)}, en: ${q(w.en)} }`;

/** The module text; `as const` so ids, kinds and answer types are literal types. */
export function emitBlocksModule(registry: BlockRegistry): string {
  const lines: string[] = [];
  lines.push("// Generated from catalog/blocks/mvp.yaml by scripts/build-blocks.ts.");
  lines.push("// Do not edit: run `pnpm --filter @orivilo/design-system blocks`.");
  lines.push("");
  lines.push(`export const BLOCK_REGISTRY_VERSION = ${registry.version};`);
  lines.push("");
  lines.push("export const BLOCK_MODULES = {");
  for (const [id, name] of Object.entries(registry.modules))
    lines.push(`  ${q(id)}: ${words(name)},`);
  lines.push("} as const;");
  lines.push("");
  lines.push("export const BLOCKS = [");
  for (const b of registry.blocks) {
    lines.push("  {");
    lines.push(`    id: ${q(b.id)},`);
    lines.push(`    kind: ${q(b.kind)},`);
    lines.push(`    module: ${q(b.module)},`);
    lines.push(`    name: ${words(b.name)},`);
    lines.push(`    output: ${q(b.output)},`);
    lines.push("    inputs: [");
    for (const i of b.inputs) {
      lines.push("      {");
      lines.push(`        id: ${q(i.id)},`);
      lines.push(`        required: ${i.required},`);
      lines.push(`        answer: ${q(i.answer)},`);
      lines.push(`        label: ${words(i.label)},`);
      lines.push(`        question: ${words(i.question)},`);
      lines.push(`        from: [${(i.from ?? []).map(q).join(", ")}],`);
      lines.push("        options: [");
      for (const o of i.options ?? []) {
        lines.push(`          { id: ${q(o.id)}, th: ${q(o.th)}, en: ${q(o.en)} },`);
      }
      lines.push("        ],");
      lines.push("      },");
    }
    lines.push("    ],");
    lines.push(`    feeds: [${b.feeds.map(q).join(", ")}],`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");
  return lines.join("\n");
}
