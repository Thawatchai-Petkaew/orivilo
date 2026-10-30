/**
 * The token contract (DESIGN.md §3, §5). Fails when a layer references the wrong layer, when a
 * semantic colour lacks a mode, or when generated.css is stale. Contrast pairs are checked in
 * contrast-pairs.test.ts and by `pnpm contrast` (E0-5).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { componentsReading } from "../profiles/refine";
import { tokens } from "./index";

describe("token layers", () => {
  it("reference only the layer below and carry both modes", () => {
    expect(tokens.validate()).toEqual([]);
  });

  it("has every layer populated", () => {
    expect(tokens.layer("primitive").length).toBeGreaterThan(100);
    expect(tokens.layer("semantic").length).toBeGreaterThan(80);
    expect(tokens.layer("component").length).toBeGreaterThan(60);
  });

  it("resolves a component token down to a primitive in both modes", () => {
    const bg = tokens.get("component", "button.primary.bg");
    expect(bg).toBeDefined();
    if (!bg) return;
    expect(tokens.resolve(bg, "light")).toEqual({
      value: "#7A22C7",
      chain: ["semantic:action.primary", "primitive:color.violet.600"],
    });
    expect(tokens.resolve(bg, "dark").value).toBe("#B07FEE");
  });
});

describe("generated.css", () => {
  it("matches the source files (run `pnpm --filter @orivilo/design-system tokens`)", () => {
    const committed = readFileSync(path.join(import.meta.dirname, "generated.css"), "utf8");
    expect(committed).toBe(tokens.emitCss());
  });

  it("gives a system boundary the light set, then the dark set under the OS media query", () => {
    const css = tokens.emitCss();
    expect(css).toContain(':root,\n[data-mode="light"],\n[data-mode="system"] {');
    const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
    expect(media).toContain('[data-mode="system"] {');
    expect(media).toContain("color-scheme: dark;");
    const dark = tokens.get("semantic", "surface.canvas");
    if (!dark) throw new Error("surface.canvas missing");
    expect(media).toContain(`--ds-surface-canvas: var(--op-color-gray-900);`);
  });
});

describe("token scope", () => {
  it("marks the Intent Engine action as the Studio's and the violet and lime carriers as identity", () => {
    const by = (scope: string) =>
      tokens
        .layer("semantic")
        .filter((t) => t.scope === scope)
        .map((t) => t.path)
        .sort();
    expect(by("studio")).toEqual([
      "action.intent",
      "action.intent-hover",
      "action.intent-press",
      "text.on-intent",
    ]);
    expect(by("identity")).toEqual([
      "brand.dot-small",
      "brand.ink",
      "brand.signature",
      "selection.bg",
      "selection.fg",
      "surface.selected",
      "text.brand",
      "text.link",
      "text.link-hover",
    ]);
  });
});

describe("the small-dot token (ORV-118)", () => {
  it("lists nine identity tokens, so a profile must override each", () => {
    expect(tokens.layer("semantic").filter((t) => t.scope === "identity")).toHaveLength(9);
  });

  it("has one reader, the logo component tokens", () => {
    expect(componentsReading(["brand.dot-small"])).toEqual(["logo"]);
    const readers = tokens
      .layer("component")
      .filter((t) => JSON.stringify(t.raw).includes("{brand.dot-small}"))
      .map((t) => t.path);
    expect(readers).toEqual(["logo.dot-small"]);
  });
});

describe("contrast pairs declared in semantic.json", () => {
  it("declares pairs for the text, action, and feedback roles (checked with every derived pair in contrast-pairs.test.ts)", () => {
    const pairs = tokens.layer("semantic").filter((t) => t.contrast && t.contrast.floor !== null);
    expect(pairs.length).toBeGreaterThan(20);
  });
});
