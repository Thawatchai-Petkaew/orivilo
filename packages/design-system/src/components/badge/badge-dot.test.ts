/**
 * Badge dot colours (ORV-68, AC 4): they come from component tokens that point at feedback tokens,
 * never from a literal. Fails on a hex or rgb value in the token source, in the generated CSS, or
 * in the recipe.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.join(import.meta.dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

interface TokenNode {
  [key: string]: unknown;
}
const component = JSON.parse(read("tokens/source/component.json")) as TokenNode;
const dots = (component["badge"] as TokenNode)["dot"] as Record<string, { $value?: unknown }>;
const VARIANTS = ["neutral", "success", "warning", "danger", "info", "brand"] as const;
const DOT_LINE = /--cmp-badge-dot-([a-z]+):\s*([^;]+);/g;
const FEEDBACK = ["success", "warning", "danger", "info"] as const;

describe("badge dot tokens", () => {
  it("has one token per variant", () => {
    for (const variant of VARIANTS) expect(dots[variant], variant).toBeDefined();
  });

  it("references a token, never a literal colour", () => {
    for (const variant of VARIANTS) {
      const value = dots[variant]?.$value;
      expect(value, variant).toMatch(/^\{[a-z0-9.-]+\}$/);
      expect(String(value), variant).not.toMatch(/#[0-9a-f]{3,8}|rgb|hsl|oklch/i);
    }
  });

  it("takes each status colour from its feedback token", () => {
    for (const variant of FEEDBACK) {
      expect(dots[variant]?.$value).toBe(`{feedback.${variant}.fg}`);
    }
  });

  it("is declared in the generated CSS as a var() of a semantic token", () => {
    const generated = read("tokens/generated.css");
    for (const variant of VARIANTS) {
      const line = [...generated.matchAll(DOT_LINE)].find((m) => m[1] === variant);
      expect(line?.[2], variant).toMatch(/^var\(--ds-[a-z0-9-]+\)$/);
    }
  });

  it("is read by the recipe through the token, with no colour literal on the dot", () => {
    const css = read("recipes/recipes.css");
    for (const variant of VARIANTS) expect(css).toContain(`var(--cmp-badge-dot-${variant})`);
    const dotRules = [...css.matchAll(/\.ds-badge[^{}]*__dot[^{}]*\{([^{}]*)\}/g)].map(
      (m) => m[1] ?? "",
    );
    expect(dotRules.length).toBeGreaterThan(0);
    for (const rule of dotRules)
      expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(/i);
  });
});
