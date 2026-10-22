/**
 * The generated command module matches the registry (stale file fails, like generated.css), and
 * the matcher reads shortcuts the way the registry spells them (ADR 0004 item 5, spec E4-2 AC 10).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { emitCommandsModule, parseRegistry } from "./emit";
import { COMMANDS, commandForKey, eventMatches, shortcutsOf, type KeyLike } from "./index";

const here = import.meta.dirname;
const yaml = readFileSync(path.join(here, "../../catalog/commands/canvas.yaml"), "utf8");

const key = (k: string, mods: Partial<KeyLike> = {}): KeyLike => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe("commands/generated.ts", () => {
  it("is what the registry emits", () => {
    const committed = readFileSync(path.join(here, "generated.ts"), "utf8");
    expect(committed).toBe(emitCommandsModule(parseRegistry(yaml)));
  });

  it("carries every registry command", () => {
    const registry = parseRegistry(yaml);
    expect(COMMANDS.map((c) => c.id)).toEqual(registry.commands.map((c) => c.id));
  });
});

describe("eventMatches", () => {
  it("reads a letter without Shift in either case", () => {
    expect(eventMatches(key("c"), "C", false)).toBe(true);
    expect(eventMatches(key("C", { shiftKey: true }), "C", false)).toBe(false);
    expect(eventMatches(key("c", { ctrlKey: true }), "C", false)).toBe(false);
  });

  it("reads Mod as Control off Apple and Command on Apple, never both", () => {
    expect(eventMatches(key("a", { ctrlKey: true }), "Mod+A", false)).toBe(true);
    expect(eventMatches(key("a", { metaKey: true }), "Mod+A", false)).toBe(false);
    expect(eventMatches(key("a", { metaKey: true }), "Mod+A", true)).toBe(true);
    expect(eventMatches(key("a", { metaKey: true, ctrlKey: true }), "Mod+A", true)).toBe(false);
  });

  it("reads Shift and Alt only when spelled", () => {
    expect(eventMatches(key("ArrowUp", { shiftKey: true }), "Shift+ArrowUp", false)).toBe(true);
    expect(eventMatches(key("ArrowUp"), "Shift+ArrowUp", false)).toBe(false);
    expect(eventMatches(key("ArrowUp", { shiftKey: true }), "ArrowUp", false)).toBe(false);
    expect(eventMatches(key("ArrowLeft", { altKey: true }), "Alt+ArrowLeft", false)).toBe(true);
    expect(eventMatches(key("ArrowLeft"), "Alt+ArrowLeft", false)).toBe(false);
  });

  it("reads digits, symbols and named keys exactly", () => {
    expect(eventMatches(key("1"), "1", false)).toBe(true);
    expect(eventMatches(key("!", { shiftKey: true }), "1", false)).toBe(false);
    expect(eventMatches(key("/"), "/", false)).toBe(true);
    expect(eventMatches(key("=", { ctrlKey: true }), "Mod+=", false)).toBe(true);
    expect(eventMatches(key("Delete"), "Delete", false)).toBe(true);
    expect(eventMatches(key("F2"), "F2", false)).toBe(true);
  });
});

describe("eventMatches by physical key (E4-3)", () => {
  it("reads a letter under a Thai layout through event.code", () => {
    expect(eventMatches(key("อ", { code: "KeyV" }), "V", false)).toBe(true);
    expect(eventMatches(key("อ", { code: "KeyV" }), "H", false)).toBe(false);
    expect(eventMatches(key("อ", { code: "KeyV", shiftKey: true }), "V", false)).toBe(false);
  });
  it("reads Shift+1 and Shift+/ when the browser reports the shifted glyph", () => {
    expect(eventMatches(key("!", { code: "Digit1", shiftKey: true }), "Shift+1", false)).toBe(true);
    expect(eventMatches(key("?", { code: "Slash", shiftKey: true }), "Shift+/", false)).toBe(true);
    expect(eventMatches(key("?", { code: "Slash" }), "Shift+/", false)).toBe(false);
    expect(eventMatches(key("1", { code: "Digit1", shiftKey: true }), "1", false)).toBe(false);
  });
  it("still reads the key alone when no code is given", () => {
    expect(eventMatches(key("/", { shiftKey: true }), "Shift+/", false)).toBe(true);
    expect(eventMatches(key("=", { ctrlKey: true }), "Mod+=", false)).toBe(true);
  });
});

describe("commandForKey", () => {
  it("resolves the active scope first", () => {
    // Delete is both selection.delete and edge.delete; the scopes given decide.
    expect(commandForKey(key("Delete"), ["edge", "selection"], false)?.id).toBe("edge.delete");
    expect(commandForKey(key("Delete"), ["selection", "edge"], false)?.id).toBe("selection.delete");
  });

  it("finds the E4-2 node and board commands", () => {
    expect(commandForKey(key("c"), ["node"], false)?.id).toBe("node.connect");
    expect(commandForKey(key("x", { ctrlKey: true, shiftKey: true }), ["node"], false)?.id).toBe(
      "node.disconnect",
    );
    expect(commandForKey(key("n"), ["board"], false)?.id).toBe("board.add-node");
    expect(commandForKey(key("a", { ctrlKey: true }), ["board"], false)?.id).toBe(
      "board.select-all",
    );
    expect(commandForKey(key("z", { ctrlKey: true }), ["app"], false)?.id).toBe("board.undo");
    expect(commandForKey(key("ArrowRight", { altKey: true }), ["node"], false)?.id).toBe(
      "node.jump-downstream",
    );
    expect(commandForKey(key("2"), ["edge"], false)?.id).toBe("edge.kind-reference");
  });

  it("returns undefined for a key no command in the scopes owns", () => {
    expect(commandForKey(key("q"), ["node", "selection", "board", "app"], false)).toBeUndefined();
    expect(commandForKey(key("c"), ["board"], false)).toBeUndefined();
  });

  it("reads shortcuts from the registry, never from the components", () => {
    expect(shortcutsOf("selection.delete")).toEqual(["Delete", "Backspace"]);
    expect(shortcutsOf("selection.nudge")).toEqual([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ]);
  });
});
