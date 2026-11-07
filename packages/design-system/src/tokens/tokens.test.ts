/**
 * The token contract (DESIGN.md §3, §5). Fails when a layer references the wrong layer, when a
 * semantic colour lacks a mode, or when generated.css is stale. Contrast pairs are checked in
 * contrast-pairs.test.ts and by `pnpm contrast` (E0-5).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONTRAST_SETS } from "../profiles/index";
import { componentsReading } from "../profiles/refine";
import { MODES, tokens } from "./index";

/** The declarations of the block whose opening line is `header`, up to its closing brace. */
function bodyAfter(css: string, header: string): string {
  const start = css.indexOf(header);
  if (start < 0) throw new Error(`block not found: ${header}`);
  const open = start + header.length;
  return css.slice(open, css.indexOf("}", open));
}

function modeValue(raw: unknown): unknown {
  return typeof raw === "object" && raw !== null && "light" in raw && "dark" in raw
    ? (raw as { light: unknown }).light
    : raw;
}

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

// ORV-221 control-shape-1: a radio is round whatever a profile's control shape is.
describe("shape.round.radius", () => {
  it("is the full radius and the radio component token reads it", () => {
    const round = tokens.get("semantic", "shape.round.radius");
    expect(round?.raw).toBe("{radius.full}");
    const radio = tokens.get("component", "radio.radius");
    expect(radio?.raw).toBe("{shape.round.radius}");
  });
});

// ORV-249 control-tokens-1 and switch-size-1: the switch tokens and the geometry of worked example W1.
describe("switch.*", () => {
  const raw = (name: string) => tokens.get("component", `switch.${name}`)?.raw;
  const px = (name: string, set = tokens) => {
    const token = set.get("component", `switch.${name}`);
    if (!token) throw new Error(`no switch.${name}`);
    return parseFloat(String(set.resolve(token, "light").value));
  };

  it("holds exactly the tokens of control-tokens-1, less the two ring sizes that A1 dropped", () => {
    const names = tokens
      .layer("component")
      .map((t) => t.path)
      .filter((path) => path.startsWith("switch."))
      .map((path) => path.slice("switch.".length))
      .sort();
    expect(names).toEqual(
      [
        "edge-error",
        "edge-on-hover",
        "height",
        "height-sm",
        "radius",
        "ring",
        "target-min",
        "thumb",
        "thumb-disabled",
        "thumb-on",
        "thumb-size",
        "thumb-size-sm",
        "track",
        "track-disabled",
        "track-hover",
        "track-on",
        "track-press",
      ].sort(),
    );
  });

  it("reads the semantic tokens of the table: on is the selection, never action.primary", () => {
    expect({
      track: raw("track"),
      "track-hover": raw("track-hover"),
      "track-on": raw("track-on"),
      "track-press": raw("track-press"),
      "track-disabled": raw("track-disabled"),
      thumb: raw("thumb"),
      "thumb-on": raw("thumb-on"),
      "thumb-disabled": raw("thumb-disabled"),
      "edge-on-hover": raw("edge-on-hover"),
      "edge-error": raw("edge-error"),
      ring: raw("ring"),
      radius: raw("radius"),
    }).toEqual({
      track: "{border.control}",
      "track-hover": "{border.control-hover}",
      "track-on": "{selection.fg}",
      "track-press": "{border.strong}",
      "track-disabled": "{surface.disabled}",
      thumb: "{surface.card}",
      "thumb-on": "{selection.bg}",
      "thumb-disabled": "{text.secondary}",
      "edge-on-hover": "{border.strong}",
      "edge-error": "{border.error}",
      ring: "{selection.fg}",
      radius: "{shape.control.radius}",
    });
  });

  it("sizes md and sm so the track, the travel and the ring equal W1 (44x24 / 36x20, travel 20 / 16, ring 16 / 12)", () => {
    const gap = px("height") - px("thumb-size");
    const inset = gap / 2;
    const ring = parseFloat(
      String(tokens.resolve(tokens.get("semantic", "space.inline.sm") as never, "light").value),
    );
    expect([px("height") + px("thumb-size"), px("height"), px("thumb-size"), inset]).toEqual([
      44, 24, 20, 2,
    ]);
    // The thumb travels its own width: track less thumb less both insets.
    expect(px("height") + px("thumb-size") - px("thumb-size") - gap).toBe(20);
    expect(px("thumb-size") - ring).toBe(16);
    const gapSm = px("height-sm") - px("thumb-size-sm");
    expect([px("height-sm") + px("thumb-size-sm"), px("height-sm"), px("thumb-size-sm")]).toEqual([
      36, 20, 16,
    ]);
    expect(gapSm / 2).toBe(2);
    expect(px("height-sm") + px("thumb-size-sm") - px("thumb-size-sm") - gapSm).toBe(16);
    expect(px("thumb-size-sm") - ring).toBe(12);
  });

  it("keeps the sm target at the 24 px floor and the inset at 2 px at both sizes", () => {
    expect(px("target-min")).toBe(24);
    expect(px("height") - px("thumb-size")).toBe(4);
    expect(px("height-sm") - px("thumb-size-sm")).toBe(4);
  });

  it("gives a thumb radius under every profile that stays concentric: track radius less the inset", () => {
    // Neutral, friendly and orivilo are fully round; Professional's 6 px leaves 4 px (W1).
    const radii = Object.fromEntries(CONTRAST_SETS.map(({ id, set }) => [id, px("radius", set)]));
    const professional = radii["professional"] ?? NaN;
    expect(professional).toBe(6);
    expect(professional - (px("height") - px("thumb-size")) / 2).toBe(4);
    for (const id of ["neutral", "friendly"]) expect(radii[id]).toBeGreaterThan(100);
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

  // ORV-192 row 4. A declaration on the boundary element beats inheritance, so a boundary resets
  // a token only if one of its own blocks declares it. Every mode's block must therefore carry the
  // whole semantic layer, not only the colours that differ by mode; otherwise a dark boundary
  // nested in another profile inherits that profile's size, shape, space and type.
  it("declares every semantic token in the light, the dark and the system-dark block", () => {
    const css = tokens.emitCss();
    const all = tokens
      .layer("semantic")
      .flatMap((t) => tokens.declarations(t, modeValue(t.raw)))
      .map((d) => d.slice(0, d.indexOf(":")));
    const blocks: Record<string, string> = {
      light: bodyAfter(css, ':root,\n[data-mode="light"],\n[data-mode="system"] {'),
      dark: bodyAfter(css, '\n[data-mode="dark"] {'),
      "system dark": bodyAfter(
        css,
        '@media (prefers-color-scheme: dark) {\n  [data-mode="system"] {',
      ),
    };
    for (const [name, body] of Object.entries(blocks)) {
      const declared = new Set([...body.matchAll(/^\s+(--[a-z0-9-]+):/gm)].map((m) => m[1]));
      const missing = all.filter((n) => !declared.has(n));
      expect(missing, `${name} block lacks ${missing.length} semantic tokens`).toEqual([]);
    }
  });

  it("gives the dark block the same mode-independent values as the light block", () => {
    const css = tokens.emitCss();
    const light = bodyAfter(css, ':root,\n[data-mode="light"],\n[data-mode="system"] {');
    const dark = bodyAfter(css, '\n[data-mode="dark"] {');
    for (const line of ["--ds-size-control-md: var(--op-size-10);"]) {
      expect(light).toContain(line);
      expect(dark).toContain(line);
    }
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
      "focus.ring",
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
  it("lists ten identity tokens, so a profile must override each", () => {
    expect(tokens.layer("semantic").filter((t) => t.scope === "identity")).toHaveLength(10);
  });

  it("has two readers, the logo component tokens and the brand badge's bead", () => {
    expect(componentsReading(["brand.dot-small"])).toEqual(["badge", "logo"]);
    const readers = tokens
      .layer("component")
      .filter((t) => JSON.stringify(t.raw).includes("{brand.dot-small}"))
      .map((t) => t.path);
    expect(readers).toEqual(["badge.dot.brand", "logo.dot-small"]);
  });
});

describe("the violet signature (ORV-118, comment 10336)", () => {
  const read = (path: string, mode: (typeof MODES)[number]) => {
    const token = tokens.get("semantic", path);
    if (!token) throw new Error(`semantic token ${path} is missing`);
    return tokens.resolve(token, mode);
  };

  it("shares one value with action.primary under neutral, in both modes", () => {
    const expected = { light: "#7A22C7", dark: "#B07FEE" } as const;
    for (const mode of MODES) {
      expect(String(read("brand.signature", mode).value).toUpperCase(), mode).toBe(expected[mode]);
      expect(String(read("action.primary", mode).value).toUpperCase(), mode).toBe(expected[mode]);
    }
  });

  it("reaches its primitive directly, never through an action token", () => {
    expect(read("brand.signature", "light").chain).toEqual(["primitive:color.violet.600"]);
    expect(read("brand.signature", "dark").chain).toEqual(["primitive:color.violet.400"]);
  });

  it("keeps brand readers and action readers apart", () => {
    const brand = componentsReading(["brand.signature"]);
    expect(brand).toEqual(["logo", "nav-item", "tile"]);
    const action = componentsReading(["action.primary"]);
    expect(brand.filter((name) => action.includes(name))).toEqual([]);
  });
});

describe("focus follows the brand (ORV-192 row 9)", () => {
  const read = (path: string, mode: (typeof MODES)[number]) => {
    const token = tokens.get("semantic", path);
    if (!token) throw new Error(`semantic token ${path} is missing`);
    return tokens.resolve(token, mode);
  };

  it("reaches the violet primitive directly, the same one action.primary reads", () => {
    expect(read("focus.ring", "light").chain).toEqual(["primitive:color.violet.600"]);
    expect(read("focus.ring", "dark").chain).toEqual(["primitive:color.violet.400"]);
  });

  it("mixes the halo at 24 percent of the ring", () => {
    expect(tokens.get("semantic", "focus.halo-opacity")).toBeDefined();
    expect(read("focus.halo-opacity", "light").value).toBe(0.24);
    expect(read("focus.halo-opacity", "dark").value).toBe(0.24);
  });

  it("has no gap colour any more", () => {
    expect(tokens.get("semantic", "focus.offset")).toBeUndefined();
  });
});

describe("contrast pairs declared in semantic.json", () => {
  it("declares pairs for the text, action, and feedback roles (checked with every derived pair in contrast-pairs.test.ts)", () => {
    const pairs = tokens.layer("semantic").filter((t) => t.contrast && t.contrast.floor !== null);
    expect(pairs.length).toBeGreaterThan(20);
  });
});
