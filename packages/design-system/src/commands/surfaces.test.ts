/**
 * Spec E4-3 AC 16: every registry command available in this build that names a surface is in
 * that surface's item list. The lists are the ones the components read (`surfaceCommands`), the
 * node toolbar's glyph map and the controls' order, so a command added to the registry with a
 * surface and no rendering fails here before it fails in a story.
 */
import { describe, expect, it } from "vitest";
import {
  COMMANDS,
  COMMAND_SURFACES,
  CURRENT_STORY,
  type CommandSurface,
  commandAvailable,
  storyOrder,
  surfaceCommands,
} from "./index";

const available = COMMANDS.filter((c) => commandAvailable(c));

describe("storyOrder and commandAvailable", () => {
  it("orders stories by epic then number", () => {
    expect(storyOrder("E4-3")).toBeLessThan(storyOrder("E4-10"));
    expect(storyOrder("E2-9")).toBeLessThan(storyOrder("E4-1"));
    expect(storyOrder("nonsense")).toBe(Number.MAX_SAFE_INTEGER);
  });
  it("marks E4-2 and E4-3 commands available and later ones not", () => {
    expect(CURRENT_STORY).toBe("E4-3");
    expect(available.every((c) => storyOrder(c.since) <= storyOrder("E4-3"))).toBe(true);
    expect(COMMANDS.filter((c) => !commandAvailable(c)).map((c) => c.since)).not.toContain("E4-3");
    expect(COMMANDS.some((c) => !commandAvailable(c))).toBe(true);
  });
});

describe("every available command renders on each surface it names", () => {
  // COMMAND_SURFACES is a tuple; a key-based list would check "0".."5" and prove nothing.
  const surfaces: readonly CommandSurface[] = COMMAND_SURFACES;
  it("checks the real surface names", () => {
    expect(surfaces).toContain("command-menu");
    expect(surfaces.length).toBeGreaterThan(3);
    // "chat" gets its first command in E4-5; every other surface renders in this build.
    for (const surface of surfaces.filter((s) => s !== "chat")) {
      expect(surfaceCommands(surface).length, surface).toBeGreaterThan(0);
    }
  });
  for (const surface of surfaces) {
    it(`${surface}`, () => {
      const expected = available.filter((c) => (c.surfaces as readonly string[]).includes(surface));
      const listed = surfaceCommands(surface).map((c) => c.id);
      if (surface !== "chat") expect(listed.length).toBeGreaterThan(0);
      expect(listed).toEqual(expected.map((c) => c.id));
      expect(listed).not.toContain("board.save-draft");
    });
  }

  it("the context menu's scoped lists together cover every context-menu command", () => {
    const scoped = [
      ...surfaceCommands("context-menu", ["board"]),
      ...surfaceCommands("context-menu", ["node", "selection"]),
      ...surfaceCommands("context-menu", ["edge"]),
    ].map((c) => c.id);
    for (const c of surfaceCommands("context-menu")) expect(scoped).toContain(c.id);
  });

  it("the shortcut sheet lists every command, available or not", () => {
    // The sheet renders COMMANDS directly; the registry check guarantees each has a scope.
    expect(COMMANDS.length).toBeGreaterThan(available.length);
    expect(COMMANDS.every((c) => typeof c.scope === "string")).toBe(true);
  });

  it("hides a later-story command from every surface but the sheet", () => {
    const later = COMMANDS.find((c) => !commandAvailable(c) && c.surfaces.length > 0);
    expect(later).toBeDefined();
    for (const surface of surfaces) {
      expect(surfaceCommands(surface).map((c) => c.id)).not.toContain(later?.id);
    }
  });
});
