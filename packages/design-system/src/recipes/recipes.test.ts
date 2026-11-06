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

/**
 * The calendar recipe reads only the names `cal-look-1` opens with. The guard reads the CSS text
 * and blocks four forms in a `.ds-calendar` rule: a `var()` of another component token, a `var()`
 * of a semantic token other than the two named, a `var()` of a primitive, and an `overflow`,
 * `overflow-x` or `overflow-y` declaration.
 */
const CALENDAR_OWN = /^--cmp-calendar-[a-z0-9-]+$/;
const CALENDAR_BORROWED = new Set([
  "--ds-focus-ring",
  "--ds-space-gutter",
  "--cmp-button-height-sm",
  // Locals: the shared focus halo (orivilo.css) and the calendar's own cell size.
  "--_focus-shadow-border",
  "--_cell",
]);

function calendarFindings(source: string): string[] {
  const bare = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const found: string[] = [];
  for (const m of bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (m[1] ?? "").trim().replace(/\s+/g, " ");
    if (!/\.ds-calendar(?![\w-])|\.ds-calendar__/.test(selector)) continue;
    const body = m[2] ?? "";
    for (const use of body.matchAll(/var\((--[a-z0-9_-]+)/g)) {
      const name = use[1] ?? "";
      if (!CALENDAR_OWN.test(name) && !CALENDAR_BORROWED.has(name))
        found.push(`${selector}: var(${name})`);
    }
    for (const decl of body.matchAll(/^\s*(overflow(?:-[xy])?)\s*:/gm))
      found.push(`${selector}: ${decl[1]}`);
  }
  return found;
}

describe("the calendar recipe (ORV-231, cal-look-1)", () => {
  it("reads only the calendar tokens, the named borrowed names and its locals, and sets no overflow", () => {
    expect(calendarFindings(css)).toEqual([]);
  });

  it("finds each blocked form in a failing sample", () => {
    const rule = (decl: string) => `.ds-calendar__grid {\n  ${decl}\n}`;
    // Another component token, a semantic token outside the two named, a primitive, and each overflow form.
    expect(calendarFindings(rule("color: var(--cmp-popover-fg);"))).toEqual([
      ".ds-calendar__grid: var(--cmp-popover-fg)",
    ]);
    expect(calendarFindings(rule("color: var(--ds-text-primary);"))).toEqual([
      ".ds-calendar__grid: var(--ds-text-primary)",
    ]);
    expect(calendarFindings(rule("color: var(--op-neutral-900);"))).toEqual([
      ".ds-calendar__grid: var(--op-neutral-900)",
    ]);
    expect(calendarFindings(rule("overflow: hidden;"))).toEqual([".ds-calendar__grid: overflow"]);
    expect(calendarFindings(rule("overflow-x: auto;"))).toEqual([".ds-calendar__grid: overflow-x"]);
    expect(calendarFindings(rule("overflow-y: clip;"))).toEqual([".ds-calendar__grid: overflow-y"]);
    // The root selector itself, and a rule outside the calendar, which the guard leaves alone.
    expect(calendarFindings(".ds-calendar {\n  color: var(--ds-text-primary);\n}")).toHaveLength(1);
    expect(calendarFindings(".ds-popover {\n  overflow: hidden;\n}")).toEqual([]);
  });

  it("lists the pairs of cal-look-1: four at 4.5 and nine at 3", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "calendar");
    expect(pairs.filter((p) => p.floor === 4.5).map((p) => `${p.fg} on ${p.bg}`)).toEqual([
      "calendar.fg on calendar.bg",
      "calendar.weekday-fg on calendar.bg",
      "calendar.fg on calendar.day-hover-bg",
      "calendar.day-selected-fg on calendar.day-selected-bg",
    ]);
    expect(pairs.filter((p) => p.floor === 3).map((p) => `${p.fg} on ${p.bg}`)).toEqual([
      "calendar.day-selected-edge on calendar.bg",
      "calendar.day-hover-edge on calendar.bg",
      "calendar.day-disabled-fg on calendar.bg",
      "calendar.day-selected-edge on calendar.day-selected-bg",
      "calendar.day-hover-edge on calendar.day-hover-bg",
      "calendar.day-hover-edge on calendar.day-selected-bg",
      "calendar.day-disabled-fg on calendar.day-selected-bg",
      "ds:focus.ring on calendar.bg",
      "ds:focus.ring on calendar.day-selected-bg",
    ]);
  });
});

describe("the menu listbox (ORV-204, menu-separator-1, menu-label-1, menu-disabled-pair-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const body = (selector: string) =>
    [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) => (m[1] ?? "").trim() === selector)?.[2];

  it("puts the same space-inline-lg above and below the separator", () => {
    expect(body(".ds-menu__separator")).toContain("margin-block: var(--ds-space-inline-lg);");
  });

  it("pads a group heading by space-inline-sm above and below", () => {
    expect(body(".ds-menu__label")).toContain("padding-block: var(--ds-space-inline-sm);");
  });

  it("lists the disabled option against the menu ground at the UI floor of 3", () => {
    expect(RECIPE_PAIRS.filter((p) => p.recipe === "menu" && p.slot === "disabled option")).toEqual(
      [
        {
          recipe: "menu",
          slot: "disabled option",
          fg: "menu.option.fg-disabled",
          bg: "menu.bg",
          floor: 3,
        },
      ],
    );
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
