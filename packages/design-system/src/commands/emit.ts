/**
 * Turns catalog/commands/canvas.yaml into the TypeScript module the components read
 * (`src/commands/generated.ts`), so the registry stays the only place a key is spelled (ADR 0004
 * item 5). Node only: the script and the staleness test import it; components import the output.
 */
import { load } from "js-yaml";

export interface RegistryCommand {
  id: string;
  label: { th: string; en: string };
  scope: string;
  shortcuts: string[];
  surfaces: string[];
  since: string;
  note?: string;
}

export interface Registry {
  version: number;
  modifier: string;
  scopes: Record<string, string>;
  surfaces: string[];
  commands: RegistryCommand[];
}

export function parseRegistry(yaml: string): Registry {
  const doc = load(yaml) as Partial<Registry>;
  if (!doc.commands || !doc.scopes || !doc.surfaces) {
    throw new Error("canvas.yaml: needs scopes, surfaces and commands");
  }
  return doc as Registry;
}

const q = (s: string) => JSON.stringify(s);

/** The module text; `as const` so ids, scopes and shortcuts are literal types. */
export function emitCommandsModule(registry: Registry): string {
  const lines: string[] = [];
  lines.push("// Generated from catalog/commands/canvas.yaml by scripts/build-commands.ts.");
  lines.push("// Do not edit: run `pnpm --filter @orivilo/design-system commands`.");
  lines.push("");
  lines.push(`export const COMMAND_REGISTRY_VERSION = ${registry.version};`);
  lines.push("");
  lines.push("export const COMMAND_SCOPES = {");
  for (const [scope, text] of Object.entries(registry.scopes)) {
    lines.push(`  ${q(scope)}: ${q(text)},`);
  }
  lines.push("} as const;");
  lines.push("");
  lines.push(`export const COMMAND_SURFACES = [${registry.surfaces.map(q).join(", ")}] as const;`);
  lines.push("");
  lines.push("export const COMMANDS = [");
  for (const c of registry.commands) {
    lines.push("  {");
    lines.push(`    id: ${q(c.id)},`);
    lines.push(`    label: { th: ${q(c.label.th)}, en: ${q(c.label.en)} },`);
    lines.push(`    scope: ${q(c.scope)},`);
    lines.push(`    shortcuts: [${c.shortcuts.map(q).join(", ")}],`);
    lines.push(`    surfaces: [${c.surfaces.map(q).join(", ")}],`);
    lines.push(`    since: ${q(c.since)},`);
    if (c.note) lines.push(`    note: ${q(c.note)},`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");
  return lines.join("\n");
}
