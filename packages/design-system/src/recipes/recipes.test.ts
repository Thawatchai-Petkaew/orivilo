/**
 * The recipe layer (ADR 0003 item 2, DESIGN.md §5 and §11, spec E2-4). Fails when a recipe writes
 * a raw value, reads a custom property no token declares or a primitive directly, or when any pair
 * in `pairs.ts` is under its floor under any profile in either mode.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../foundations/contrast";
import { profiles } from "../profiles/index";
import { MODES, type Mode, TokenSet, tokens } from "../tokens/index";
import { RECIPE_PAIRS } from "./pairs";

const here = import.meta.dirname;
const css = readFileSync(path.join(here, "recipes.css"), "utf8");
const generated = readFileSync(path.join(here, "../tokens/generated.css"), "utf8");

/** Every custom property the token build declares. */
const declared = new Set([...generated.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]));

const sets: { id: string; set: TokenSet }[] = [
  { id: "neutral", set: tokens },
  ...profiles.map((p) => ({ id: p.id, set: p.tokens })),
];

function hexOf(set: TokenSet, ref: string, mode: Mode): string {
  const [layer, p] = ref.startsWith("ds:")
    ? (["semantic", ref.slice(3)] as const)
    : (["component", ref] as const);
  const token = set.get(layer, p);
  if (!token) throw new Error(`${ref}: no ${layer} token`);
  const value = set.resolve(token, mode).value;
  if (typeof value !== "string") throw new Error(`${ref}: not a colour`);
  return value;
}

describe("recipes.css", () => {
  it("reads only custom properties the token build declares", () => {
    const used = [...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1] ?? "");
    // `--radix-*` are layout measurements Radix sets on the content element; they carry no colour.
    const unknown = [...new Set(used)]
      .filter((name) => !name.startsWith("--radix-"))
      .filter((name) => !declared.has(name));
    expect(unknown, "var() names with no token").toEqual([]);
  });

  it("never references a primitive or Radix-foreign value directly", () => {
    const primitives = [...css.matchAll(/var\((--op-[a-z0-9-]+)/g)].map((m) => m[1]);
    expect(primitives, "--op-* references (DESIGN.md §3.2)").toEqual([]);
  });

  it("carries no raw colour, radius, shadow or font value", () => {
    const lines = css.split("\n");
    const hits: string[] = [];
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
      if (/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch|oklab)\(/i.test(line))
        hits.push(`${i + 1}: colour literal`);
      if (/^\s*border-radius:(?!\s*var\()/.test(line)) hits.push(`${i + 1}: radius literal`);
      if (/^\s*box-shadow:(?!\s*var\()/.test(line)) hits.push(`${i + 1}: shadow literal`);
      if (/^\s*font-family:(?!\s*var\()/.test(line)) hits.push(`${i + 1}: font literal`);
      if (
        /^\s*(?:background|background-color|color|border-color):(?!\s*(?:var\(|transparent|currentColor))/i.test(
          line,
        )
      ) {
        hits.push(`${i + 1}: colour not from a token`);
      }
    });
    expect(hits).toEqual([]);
  });

  it("gives every glass surface a solid fallback under reduced transparency", () => {
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    const glass = rules
      .filter((m) => /backdrop-filter:\s*blur\(/.test(m[2] ?? ""))
      .map((m) => (m[1] ?? "").trim());
    const reduced = [
      ...bare.matchAll(
        /@media \(prefers-reduced-transparency: reduce\) \{((?:\s*[^{}]+\{[^{}]*\})*)\s*\}/g,
      ),
    ]
      .flatMap((m) => [...(m[1] ?? "").matchAll(/([^{}]+)\{([^{}]*)\}/g)])
      .filter((m) => /backdrop-filter:\s*none/.test(m[2] ?? ""))
      .map((m) => (m[1] ?? "").trim());
    expect(glass).toContain('.ds-node[data-kind="note"]');
    for (const selector of glass) expect(reduced, selector).toContain(selector);
  });

  it("every component token in pairs.ts is also read by a recipe", () => {
    const unread = RECIPE_PAIRS.flatMap((pair) => [pair.fg, pair.bg])
      .filter((ref) => !ref.startsWith("ds:"))
      .filter((ref, i, all) => all.indexOf(ref) === i)
      .filter((ref) => !css.includes(`var(--cmp-${ref.replace(/\./g, "-")})`));
    expect(unread, "pairs that no recipe uses").toEqual([]);
  });
});

describe("recipe contrast pairs", () => {
  for (const { id, set } of sets) {
    for (const mode of MODES) {
      for (const pair of RECIPE_PAIRS) {
        it(`${pair.recipe} ${pair.slot}: ${pair.fg} on ${pair.bg} ≥ ${pair.floor} under ${id} in ${mode}`, () => {
          const fg = hexOf(set, pair.fg, mode);
          const bg = hexOf(set, pair.bg, mode);
          const ratio = contrastRatio(fg, bg);
          expect(ratio, `${fg} on ${bg}`).not.toBeNull();
          expect(ratio ?? 0, `${fg} on ${bg} = ${ratio}`).toBeGreaterThanOrEqual(pair.floor);
        });
      }
    }
  }
});
