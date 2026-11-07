/**
 * The recipe layer (ADR 0003 item 2, DESIGN.md §5 and §11, spec E2-4). Fails when a recipe writes
 * a raw value, reads a custom property no token declares or a primitive directly, or when any pair
 * in `pairs.ts` is under its floor under any set of `CONTRAST_SETS` (neutral, the profiles and the
 * brand profiles, orivilo among them) in either mode.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../foundations/contrast";
import { CONTRAST_SETS } from "../profiles/index";
import { MODES, type Mode, TokenSet } from "../tokens/index";
import { RECIPE_PAIRS } from "./pairs";

const here = import.meta.dirname;
const css = readFileSync(path.join(here, "recipes.css"), "utf8");
const generated = readFileSync(path.join(here, "../tokens/generated.css"), "utf8");

/** Every custom property the token build declares. */
const declared = new Set([...generated.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]));

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

describe("the confirm dialog recipe (ORV-226, A1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const start = bare.indexOf(".ds-confirm {");
  const end = bare.indexOf("@keyframes ds-fade-in");
  const block = bare.slice(start, end);
  const selectors = [...block.matchAll(/([^{}]+)\{/g)]
    .map((m) => (m[1] ?? "").trim())
    .filter((selector) => !selector.startsWith("@"));

  it("has a block, placed after the dialog rules", () => {
    expect(start).toBeGreaterThan(bare.indexOf(".ds-dialog__close {"));
    expect(selectors.length).toBeGreaterThan(0);
  });

  it("starts every selector at .ds-confirm, so no .ds-dialog caller changes", () => {
    expect(selectors.filter((selector) => !selector.startsWith(".ds-confirm"))).toEqual([]);
  });

  it("stacks below the 333 px content box, the cap of 384 less padding and border, less 1", () => {
    expect(block).toContain("@container (max-width: 333px) {");
  });

  it("makes the panel the one scroller and the footer sticky", () => {
    expect(block).toMatch(/\.ds-confirm \{[^}]*overflow: hidden auto;/);
    expect(block).toMatch(/\.ds-confirm \{[^}]*container-type: inline-size;/);
    expect(block).toMatch(/\.ds-confirm \.ds-dialog__footer \{[^}]*position: sticky;/);
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

describe("the separator recipe (ORV-230, sep-look-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => ({
      selector: (m[1] ?? "").trim().replace(/\s+/g, " "),
      body: (m[2] ?? "").trim().replace(/\s+/g, " "),
    }))
    .filter((r) => r.selector.includes(".ds-separator"));
  const body = (selector: string) => rules.find((r) => r.selector === selector)?.body;

  it("draws the horizontal line as a 1 px block-start border at the parent's width", () => {
    expect(body('.ds-separator[data-orientation="horizontal"]')).toBe(
      "inline-size: 100%; block-size: 0; border-block-start: 1px solid var(--cmp-separator-line);",
    );
  });

  it("draws the vertical line as a 1 px inline-start border, stretched and at least 1lh tall", () => {
    expect(body('.ds-separator[data-orientation="vertical"]')).toBe(
      "align-self: stretch; inline-size: 0; min-block-size: 1lh; border-inline-start: 1px solid var(--cmp-separator-line);",
    );
  });

  it("never shrinks", () => {
    expect(body(".ds-separator")).toBe("flex: none;");
  });

  it("paints no background and sets no margin, so forced colours draw one line and the space is the caller's", () => {
    expect(rules).toHaveLength(3);
    for (const rule of rules) {
      expect(rule.body, rule.selector).not.toMatch(/\bbackground|\bmargin|\boutline|box-shadow/);
    }
  });

  it("reads its ink from border.subtle through the one token separator.line", () => {
    const source = JSON.parse(
      readFileSync(path.join(here, "../tokens/source/component.json"), "utf8"),
    ) as { separator: Record<string, { $value?: string }> };
    const names = Object.keys(source.separator).filter((key) => !key.startsWith("$"));
    expect(names).toEqual(["line"]);
    expect(source.separator["line"]?.$value).toBe("{border.subtle}");
  });

  it("lists no contrast pair: the line is decoration and the role speaks", () => {
    expect(RECIPE_PAIRS.filter((p) => p.recipe === "separator")).toEqual([]);
  });
});

describe("the section header recipe (ORV-251, section-header-1, header-type-1, header-stack-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
  const rule = (selector: string) =>
    bare.match(
      new RegExp(`(?:^|[}\\s])${selector.replace(/[.[\]()]/g, "\\$&")} \\{([^{}]*)\\}`),
    )?.[1];

  it("names itself in the three selectors it shares with the page header", () => {
    expect(bare).toContain(".ds-page-header__row, .ds-section-header__row {");
    expect(bare).toContain(".ds-page-header__description, .ds-section-header__description {");
    expect(bare).toContain(".ds-page-header__actions, .ds-section-header__actions {");
  });

  it("keeps the title block at size.panel.min, and nothing else as its basis", () => {
    expect(rule(".ds-section-header__text")).toContain("flex: 1 1 var(--ds-size-panel-min);");
  });

  it("puts the 479 px query after every rule of its block, so flex: none beats the basis", () => {
    const query = bare.indexOf("@container ds-section-header (max-width: 479px)");
    expect(query).toBeGreaterThan(-1);
    const end = bare.indexOf("} }", query) + 3;
    expect(bare.slice(query, end)).toContain(
      ".ds-section-header__text { flex: none; inline-size: 100%; }",
    );
    // Nothing of the part comes after the query: a later rule would win at 479 and below.
    expect(bare.slice(end)).not.toContain("ds-section-header");
  });

  it("draws the one 1 px edge only under data-divider, 16 under the last line", () => {
    expect(rule(".ds-section-header[data-divider]")).toBe(
      " padding-block-end: var(--ds-space-stack-md); border-block-end: 1px solid var(--ds-border-subtle); ",
    );
    expect(rule(".ds-section-header")).not.toMatch(/border|padding/);
  });

  it("lists the title and the description on the canvas at the text floor", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "section-header");
    expect(pairs.map((p) => [p.slot, p.fg, p.bg, p.floor])).toEqual([
      ["title", "ds:text.primary", "ds:surface.canvas", 4.5],
      ["description", "ds:text.secondary", "ds:surface.canvas", 4.5],
    ]);
  });
});

describe("the radio focus line (ORV-221, control-tokens-1, control-pairs-1, radio-api-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const body = (selector: string) =>
    [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .find((m) => (m[1] ?? "").trim().replace(/\s+/g, " ") === selector)?.[2]
      ?.replace(/\s+/g, " ")
      .trim();

  it("lists the inner line of a focused checked radio on the checked ground at the UI floor", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "radio" && p.slot.endsWith("on checked"));
    expect(pairs.map((p) => [p.slot, p.fg, p.bg, p.floor])).toEqual([
      ["focus line on checked", "ds:focus.ring", "radio.bg-checked", 3],
      ["error line on checked", "radio.border-error", "radio.bg-checked", 3],
    ]);
  });

  it("adds the inner line to a checked radio in focus.ring, and in the error colour when invalid", () => {
    expect(body('.ds-radio__control[data-state="checked"]:focus-visible')).toBe(
      "--_inner: inset 0 0 0 1px var(--ds-focus-ring); box-shadow: var(--_inner), var(--_focus-shadow-border);",
    );
    expect(
      body(
        '.ds-radio-group[aria-invalid="true"] .ds-radio__control[data-state="checked"]:focus-visible',
      ),
    ).toBe("--_inner: inset 0 0 0 1px var(--cmp-radio-border-error);");
  });

  it("draws no focus on the group root", () => {
    expect(body(".ds-radio-group:focus-visible")).toBe(
      "outline: none; box-shadow: var(--_focus-shadow-none);",
    );
  });
});

describe("the switch recipe (ORV-249, control-pairs-1, switch-size-1, control-tokens-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? "").trim().replace(/\s+/g, " "),
    body: (m[2] ?? "").replace(/\s+/g, " ").trim(),
  }));
  const body = (selector: string) => rules.find((r) => r.selector === selector)?.body;
  const mine = rules.filter((r) => r.selector.includes(".ds-switch"));

  it("lists the switch pairs of control-pairs-1, each at the UI floor", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "switch");
    expect(pairs.map((p) => [p.fg, p.bg])).toEqual([
      ["switch.track", "ds:surface.canvas"],
      ["switch.track", "ds:surface.card"],
      ["switch.track-on", "ds:surface.canvas"],
      ["switch.track-on", "ds:surface.card"],
      ["switch.thumb", "switch.track"],
      ["switch.thumb", "switch.track-hover"],
      ["switch.thumb", "switch.track-press"],
      ["switch.thumb-on", "switch.track-on"],
      ["switch.thumb-on", "switch.track-press"],
      ["switch.edge-error", "ds:surface.canvas"],
      ["switch.edge-error", "ds:surface.card"],
      ["switch.thumb-disabled", "switch.track-disabled"],
      ["switch.ring", "switch.thumb"],
      ["switch.ring", "switch.thumb-on"],
    ]);
    expect(pairs.every((p) => p.floor === 3)).toBe(true);
  });

  it("draws an on track's focus in the fill form and an off track's in the border form", () => {
    expect(body(".ds-switch__track:focus-visible")).toContain(
      "box-shadow: var(--_focus-shadow-border);",
    );
    expect(body('.ds-switch__track[data-state="checked"]:focus-visible')).toBe(
      "box-shadow: var(--_focus-shadow-fill);",
    );
  });

  it("keeps the error edge through focus", () => {
    expect(body('.ds-switch__track[aria-invalid="true"]:focus-visible')).toBe(
      "border-color: var(--cmp-switch-edge-error);",
    );
  });

  it("lets a press win over hover: the :active selector carries [data-state]", () => {
    expect(
      body('.ds-switch__track[data-state]:active:not([data-disabled]):not([aria-busy="true"])'),
    ).toBe("background: var(--cmp-switch-track-press);");
  });

  it("turns hover off while saving or disabled, and on an invalid or focused on track", () => {
    const hover = rules.filter(
      (r) => r.selector.includes(":hover") && r.selector.includes(".ds-switch__track"),
    );
    expect(hover).toHaveLength(2);
    for (const r of hover) {
      expect(r.selector).toContain(":not([data-disabled])");
      expect(r.selector).toContain(':not([aria-busy="true"])');
    }
    // Prettier wraps the long selector inside :not( ), so the spaces it adds are dropped first.
    expect(
      hover
        .find((r) => r.selector.includes('"checked"'))
        ?.selector.replace(/\( /g, "(")
        .replace(/ \)/g, ")"),
    ).toContain(':not([aria-invalid="true"]):not(:focus-visible)');
  });

  it("reads a concentric thumb radius: the track's radius less the inset", () => {
    expect(body(".ds-switch__thumb")).toContain(
      "--_thumb-radius: calc(var(--cmp-switch-radius) - var(--_inset)); border-radius: var(--_thumb-radius);",
    );
  });

  it("sets the sizes from the tokens: the track is the height plus the thumb, the thumb travels its width", () => {
    expect(body(".ds-switch")).toContain("--_h: var(--cmp-switch-height);");
    expect(body(".ds-switch")).toContain("--_t: var(--cmp-switch-thumb-size);");
    expect(body('.ds-switch[data-size="sm"]')).toBe(
      "--_h: var(--cmp-switch-height-sm); --_t: var(--cmp-switch-thumb-size-sm);",
    );
    expect(body(".ds-switch__track")).toContain("inline-size: calc(var(--_h) + var(--_t));");
    expect(body('.ds-switch__track[data-state="checked"] .ds-switch__thumb')).toContain(
      "transform: translateX(var(--_t));",
    );
  });

  it("sizes the saving ring as the thumb less space.inline.sm, with no ring-size token", () => {
    expect(body(".ds-switch__thumb > .ds-spinner__ring")).toBe(
      "inline-size: calc(var(--_t) - var(--ds-space-inline-sm)); block-size: calc(var(--_t) - var(--ds-space-inline-sm));",
    );
  });

  it("reads disabled from tokens, never from opacity", () => {
    expect(mine.filter((r) => /\bopacity\b/.test(r.body))).toEqual([]);
    expect(body(".ds-switch__track[data-disabled]")).toContain(
      "background: var(--cmp-switch-track-disabled);",
    );
  });

  it("draws both the track and the thumb in forced colours through a transparent outline", () => {
    expect(body(".ds-switch__track")).toContain("outline: 1px solid transparent;");
    expect(body(".ds-switch__thumb")).toContain("outline: 1px solid transparent;");
  });

  it("drops the thumb's slide under reduced motion and names no spin rule", () => {
    const block =
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.ds-switch__track,\s*\.ds-switch__thumb \{([^}]*)\}/.exec(
        bare,
      );
    expect(block?.[1]?.replace(/\s+/g, " ").trim()).toBe("transition: none;");
    expect(mine.filter((r) => /\.ds-spin/.test(r.selector) && /animation/.test(r.body))).toEqual(
      [],
    );
  });

  it("lays the horizontal Field out in two columns with the control on row 1 and the error across both", () => {
    expect(body('.ds-field[data-orientation="horizontal"]')).toContain(
      "grid-template-columns: minmax(0, 1fr) auto;",
    );
    expect(
      body(
        '.ds-field[data-orientation="horizontal"] > :not(.ds-field__label, .ds-field__description, .ds-field__error)',
      ),
    ).toBe("grid-column: 2; grid-row: 1;");
    expect(body('.ds-field[data-orientation="horizontal"] > .ds-field__error')).toBe(
      "grid-column: 1 / -1;",
    );
  });
});

describe("the file upload recipe (ORV-227)", () => {
  const mine = RECIPE_PAIRS.filter((p) => p.recipe === "file-upload").map((p) => [
    p.fg,
    p.bg,
    p.floor,
  ]);

  it("lists the zone edge and the invalid edge on the canvas and a card at 3, the words at 4.5", () => {
    expect(mine).toEqual([
      ["file-upload.zone-border", "ds:surface.canvas", 3],
      ["file-upload.zone-border", "ds:surface.card", 3],
      ["file-upload.zone-border-invalid", "ds:surface.canvas", 3],
      ["file-upload.zone-border-invalid", "ds:surface.card", 3],
      ["progress.done", "ds:surface.canvas", 4.5],
      ["progress.failed", "ds:surface.canvas", 4.5],
      ["field.description", "ds:surface.card", 4.5],
    ]);
  });

  it("leaves the disabled edge and the row hairline out of the list, as pairs.ts says", () => {
    const listed = RECIPE_PAIRS.flatMap((p) => [p.fg, p.bg]);
    expect(listed).not.toContain("file-upload.zone-border-disabled");
    expect(listed).not.toContain("file-upload.item-border");
  });

  it("reads each of its component tokens in the recipe", () => {
    const names = [...generated.matchAll(/^\s*(--cmp-file-upload-[a-z-]+):/gm)].map((m) => m[1]);
    expect(names.sort()).toEqual(
      [
        "--cmp-file-upload-gap",
        "--cmp-file-upload-item-border",
        "--cmp-file-upload-padding",
        "--cmp-file-upload-radius",
        "--cmp-file-upload-zone-border",
        "--cmp-file-upload-zone-border-disabled",
        "--cmp-file-upload-zone-border-invalid",
      ].sort(),
    );
    for (const name of names) expect(css, name).toContain(`var(${name})`);
  });
});

describe("the alert recipe (ORV-222, alert-look-1)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? "").trim().replace(/\s+/g, " "),
    body: (m[2] ?? "").trim(),
  }));
  const alert = rules.filter((r) => r.selector.startsWith(".ds-alert"));
  const body = (selector: string) => alert.find((r) => r.selector === selector)?.body ?? "";

  it("lists the title and description at the text floor and the danger edge at the UI floor, on alert.bg", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "alert").map((p) => [
      p.slot,
      p.fg,
      p.bg,
      p.floor,
    ]);
    expect(pairs).toEqual([
      ["title", "alert.title", "alert.bg", 4.5],
      ["description", "alert.description", "alert.bg", 4.5],
      ["danger edge", "alert.danger-edge", "alert.bg", 3],
    ]);
  });

  it("does not list the success, warning and info edges: they are decoration", () => {
    const listed = RECIPE_PAIRS.filter((p) => p.recipe === "alert").map((p) => p.fg);
    for (const kind of ["success", "warning", "info"]) {
      expect(listed, `alert.${kind}-edge`).not.toContain(`alert.${kind}-edge`);
    }
  });

  it("draws one 1 px edge per kind from its own token", () => {
    expect(body(".ds-alert")).toContain("border: 1px solid transparent;");
    for (const kind of ["success", "warning", "danger", "info"]) {
      expect(body(`.ds-alert[data-variant="${kind}"]`)).toBe(
        `border-color: var(--cmp-alert-${kind}-edge);`,
      );
    }
  });

  it("is a block at its parent's width, with no shadow, animation or transition", () => {
    expect(body(".ds-alert")).toContain("inline-size: 100%;");
    for (const rule of alert) {
      expect(rule.body, rule.selector).not.toMatch(/animation|transition|box-shadow/);
    }
  });

  it("wraps the title and description by overflow-wrap anywhere and never clips them", () => {
    expect(body(".ds-alert__title, .ds-alert__description")).toContain("overflow-wrap: anywhere;");
    for (const rule of alert) {
      expect(rule.body, rule.selector).not.toMatch(
        /line-clamp|text-overflow|overflow:|overflow-[xy]:/,
      );
    }
  });
});

describe("the board's plate under the wait (ORV-250, D17 to D19)", () => {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? "").trim().replace(/\s+/g, " "),
    body: (m[2] ?? "").trim().replace(/\s+/g, " "),
  }));
  const plate = rules.filter((r) => r.selector === ".ds-board__overlay > .ds-loading-state");

  it("gives the form the status pill's solid ground, line, radius and shadow (D17, D18)", () => {
    expect(plate).toHaveLength(1);
    expect(plate[0]?.body).toBe(
      "padding-block: var(--ds-space-inset-md); padding-inline: var(--ds-space-inset-lg); border: 1px solid var(--cmp-toolbar-border); border-radius: var(--cmp-toolbar-radius); background: var(--cmp-toolbar-bg); box-shadow: var(--cmp-toolbar-shadow);",
    );
  });

  it("is on whenever the board's overlay holds the form, with no condition on nodes (D19)", () => {
    const selectors = rules.map((r) => r.selector).filter((s) => s.includes(".ds-loading-state"));
    expect(selectors.filter((s) => s.includes(".ds-board__overlay"))).toEqual([
      ".ds-board__overlay > .ds-loading-state",
    ]);
    expect(css).not.toMatch(/:has\([^)]*react-flow__node/);
  });

  it("lists the ring and the words on the plate's ground at the text floor", () => {
    expect(
      RECIPE_PAIRS.filter(
        (p) => p.recipe === "spinner" && p.slot === "ring and label on the board's plate",
      ),
    ).toEqual([
      {
        recipe: "spinner",
        slot: "ring and label on the board's plate",
        fg: "spinner.fg",
        bg: "toolbar.bg",
        floor: 4.5,
      },
    ]);
  });

  it("keeps the pair of the board's own ground, which load-live-1 names", () => {
    expect(
      RECIPE_PAIRS.some(
        (p) =>
          p.recipe === "spinner" && p.slot === "ring and label on board" && p.bg === "board.bg",
      ),
    ).toBe(true);
  });
});

describe("recipe contrast pairs", () => {
  for (const { id, set } of CONTRAST_SETS) {
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
