/**
 * The canvas command registry (catalog/commands/canvas.yaml) is the single source for CommandMenu,
 * ContextMenu, NodeToolbar, CanvasControls and the shortcut sheet. This check keeps it consistent:
 * ids are unique and prefixed by their family, every label has Thai and English, every scope and
 * surface is declared, a shortcut is unique within its scope, and keys use the shared spelling.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

interface Command {
  id: string;
  label: { th: string; en: string };
  scope: string;
  shortcuts: string[];
  surfaces: string[];
  since: string;
  note?: string;
}

interface Registry {
  version: number;
  modifier: string;
  scopes: Record<string, string>;
  surfaces: string[];
  commands: Command[];
}

const file = path.join(import.meta.dirname, "..", "catalog", "commands", "canvas.yaml");
const registry = load(readFileSync(file, "utf8")) as Registry;
const FAMILIES = ["board", "panel", "selection", "node", "edge", "app"];
const MODIFIERS = ["Mod", "Shift", "Alt"];
const NAMED_KEYS = new Set([
  "Enter",
  "Escape",
  "Tab",
  "Delete",
  "Backspace",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "F2",
  "F10",
]);

function keyIsSpelled(shortcut: string): boolean {
  const parts = shortcut.split("+");
  // A trailing "+" key would split into an empty part; "Mod+=" is the spelling for plus.
  const key = parts.at(-1) ?? "";
  const mods = parts.slice(0, -1);
  if (!mods.every((m) => MODIFIERS.includes(m))) return false;
  if (new Set(mods).size !== mods.length) return false;
  return NAMED_KEYS.has(key) || /^[A-Z0-9]$/.test(key) || /^[^A-Za-z0-9\s]$/.test(key);
}

describe("canvas command registry", () => {
  it("declares its version, modifier, scopes and surfaces", () => {
    expect(registry.version).toBe(1);
    expect(registry.modifier).toBe("Mod");
    expect(Object.keys(registry.scopes).sort()).toEqual([...FAMILIES].sort());
    expect(registry.surfaces.length).toBeGreaterThan(0);
    expect(registry.commands.length).toBeGreaterThan(40);
  });

  it("has unique ids prefixed by a known family", () => {
    const ids = registry.commands.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const wrong = ids.filter((id) => !FAMILIES.includes(id.split(".")[0] ?? ""));
    expect(wrong).toEqual([]);
    expect(ids.filter((id) => !/^[a-z]+\.[a-z0-9-]+$/.test(id))).toEqual([]);
  });

  it("labels every command in Thai and English, sentence case, without middot or em dash", () => {
    for (const c of registry.commands) {
      expect(c.label.th, c.id).toMatch(/\S/);
      expect(c.label.en, c.id).toMatch(/^[A-Z0-9]/);
      expect(c.label.en, c.id).not.toMatch(/\b[A-Z]{2,}\b/);
      for (const text of [c.label.th, c.label.en, c.note ?? ""]) {
        expect(text, c.id).not.toMatch(/[·—]/);
      }
    }
  });

  it("uses declared scopes, surfaces and backlog keys", () => {
    for (const c of registry.commands) {
      expect(registry.scopes, `${c.id} scope ${c.scope}`).toHaveProperty(c.scope);
      expect(c.surfaces.length, `${c.id} needs a surface`).toBeGreaterThan(0);
      for (const s of c.surfaces) expect(registry.surfaces, `${c.id} surface ${s}`).toContain(s);
      expect(c.since, c.id).toMatch(/^E\d+-\d+$/);
    }
  });

  it("spells every shortcut with Mod, Shift, Alt and one key", () => {
    const bad = registry.commands.flatMap((c) =>
      c.shortcuts.filter((s) => !keyIsSpelled(s)).map((s) => `${c.id}: ${s}`),
    );
    expect(bad).toEqual([]);
  });

  it("never assigns one shortcut twice within a scope", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const c of registry.commands) {
      for (const s of c.shortcuts) {
        const key = `${c.scope}:${s}`;
        const other = seen.get(key);
        if (other) clashes.push(`${s} in ${c.scope}: ${other} and ${c.id}`);
        seen.set(key, c.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("never lets an app-wide shortcut clash with any other scope", () => {
    const appKeys = new Map(
      registry.commands
        .filter((c) => c.scope === "app")
        .flatMap((c) => c.shortcuts.map((s) => [s, c.id])),
    );
    const clashes = registry.commands
      .filter((c) => c.scope !== "app")
      .flatMap((c) =>
        c.shortcuts
          .filter((s) => appKeys.has(s) && s !== "Escape")
          .map((s) => `${s}: ${appKeys.get(s)} (app) and ${c.id} (${c.scope})`),
      );
    expect(clashes).toEqual([]);
  });

  it("makes every command reachable from the command menu or a named surface", () => {
    const menuOrSheet = registry.commands.filter(
      (c) => c.surfaces.includes("command-menu") || c.surfaces.includes("shortcut-sheet"),
    );
    const rest = registry.commands.filter((c) => !menuOrSheet.includes(c));
    // The rest are contextual (toolbar, controls, context menu, chat) and must carry one of those.
    for (const c of rest) {
      expect(
        c.surfaces.some((s) =>
          ["context-menu", "node-toolbar", "canvas-controls", "chat"].includes(s),
        ),
        c.id,
      ).toBe(true);
    }
  });
});
