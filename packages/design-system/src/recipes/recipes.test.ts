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
      ...bare.matchAll(/@media \(prefers-reduced-transparency: reduce\) \{([\s\S]*?\})\s*\}/g),
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

describe("the logo recipe (ORV-118, logo-colour-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? "").trim().replace(/\s+/g, " "),
    body: (m[2] ?? "").trim(),
  }));
  const logo = rules.filter((r) => r.selector.includes(".ds-logo"));

  it("lists the ink and the small dot against the canvas at 3.0, and not the master dot", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "logo").map((p) => [
      p.slot,
      p.fg,
      p.bg,
      p.floor,
    ]);
    expect(pairs).toEqual([
      ["ink", "logo.ink", "ds:surface.canvas", 3],
      ["small dot", "logo.dot-small", "ds:surface.canvas", 3],
    ]);
  });

  it("paints the ring and the strokes with logo.ink, the fills with logo.ink and the dot with logo.dot", () => {
    const body = (selector: string) => logo.find((r) => r.selector === selector)?.body;
    expect(body(".ds-logo__ring, .ds-logo__strokes")).toBe("stroke: var(--cmp-logo-ink);");
    expect(body(".ds-logo__fills")).toBe("fill: var(--cmp-logo-ink);");
    expect(body(".ds-logo__dot")).toBe("fill: var(--cmp-logo-dot);");
  });

  it("switches the dot to logo.dot-small in forms 16 and 24 only", () => {
    const small = logo.find((r) => r.selector.includes('[data-form="16"]'));
    expect(small?.selector).toBe('.ds-logo:is([data-form="16"], [data-form="24"]) .ds-logo__dot');
    expect(small?.body).toBe("fill: var(--cmp-logo-dot-small);");
  });

  it("puts the one-colour rule last, so one colour wins in every form", () => {
    const last = logo[logo.length - 1];
    expect(last?.selector).toBe('.ds-logo[data-tone="one-colour"] .ds-logo__dot');
    expect(last?.body).toBe("fill: var(--cmp-logo-ink);");
  });

  it("keeps the box whole in a flex row", () => {
    expect(logo[0]).toEqual({ selector: ".ds-logo", body: "display: block;\n  flex: none;" });
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
