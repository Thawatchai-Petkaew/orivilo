/**
 * The profile contract (DESIGN.md §5, §8; spec E2-2). Fails when a profile overrides a name that
 * does not exist, touches a locked group, collides with a base primitive, references an unknown
 * primitive, declares a decision its tokens contradict, or when src/profiles/generated.css is
 * stale. Contrast under each profile is checked in ../tokens/contrast-pairs.test.ts (E0-5).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { DECISION_VOCABULARY, curatedProfileSchema } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import component from "../tokens/source/component.json" with { type: "json" };
import primitives from "../tokens/source/primitives.json" with { type: "json" };
import semantic from "../tokens/source/semantic.json" with { type: "json" };
import { MODES, tokens } from "../tokens/index";
import {
  DECISIONS,
  LOCKED_GROUPS,
  PROFILE_IDS,
  Profile,
  type ProfileSource,
  STUDIO_REMAP,
  emitProfilesCss,
  profiles,
} from "./index";

const base = { primitives, semantic, component };

/** A minimal valid profile to mutate in the defect tests. */
function source(overrides: Partial<ProfileSource> = {}): ProfileSource {
  return {
    $id: "probe",
    $name: { th: "ทดสอบ", en: "Probe" },
    $description: "test fixture",
    $decisions: { shape: "rounded", surfaceTreatment: "flat" },
    semantic: {
      ...IDENTITY_OVERRIDES,
      action: { primary: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } } },
    },
    ...overrides,
  };
}

/** Every identity token, mapped to blue, so a fixture is valid unless a test breaks something else. */
const IDENTITY_OVERRIDES = {
  surface: { selected: { $value: { light: "{color.blue.50}", dark: "{color.blue.950}" } } },
  text: {
    link: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
    "link-hover": { $value: { light: "{color.blue.900}", dark: "{color.blue.200}" } },
    brand: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
  },
  selection: {
    bg: { $value: { light: "{color.blue.50}", dark: "{color.blue.950}" } },
    fg: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
  },
  focus: { ring: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } } },
  brand: {
    signature: { $value: { light: "{color.blue.600}", dark: "{color.blue.400}" } },
    "dot-small": { $value: { light: "{color.blue.700}", dark: "{color.blue.400}" } },
    ink: { $value: { light: "{color.white}", dark: "{color.gray.900}" } },
  },
};

/** Merges an override tree into the fixture's semantic tree (one level of groups). */
function withSemantic(extra: Record<string, Record<string, unknown>>): ProfileSource {
  const base = source();
  const semantic: Record<string, unknown> = { ...base.semantic };
  for (const [group, nodes] of Object.entries(extra)) {
    semantic[group] = { ...((semantic[group] as Record<string, unknown>) ?? {}), ...nodes };
  }
  return { ...base, semantic };
}

describe("the shipped profiles", () => {
  it("are professional and friendly, after neutral", () => {
    expect(PROFILE_IDS).toEqual(["neutral", "professional", "friendly"]);
    expect(profiles.map((p) => p.id)).toEqual(["professional", "friendly"]);
  });

  for (const p of profiles) {
    describe(p.id, () => {
      it("is valid", () => {
        expect(p.validate()).toEqual([]);
      });

      it("overrides a real share of the contract and adds its own ramps", () => {
        expect(p.overrides.length).toBeGreaterThanOrEqual(30);
        expect(p.ownPrimitives.length).toBeGreaterThanOrEqual(12);
        expect(p.tokens.layer("semantic").length).toBe(tokens.layer("semantic").length);
      });

      it("leaves the locked groups at their base values in both modes", () => {
        for (const t of tokens.layer("semantic")) {
          if (!LOCKED_GROUPS.includes(t.path.split(".")[0] ?? "")) continue;
          const under = p.tokens.get("semantic", t.path);
          expect(under).toBeDefined();
          if (!under) continue;
          for (const mode of MODES) {
            expect(p.tokens.resolve(under, mode).value).toEqual(tokens.resolve(t, mode).value);
          }
        }
      });

      it("changes the look: action, canvas, and control radius differ from neutral or from each other", () => {
        const other = profiles.find((o) => o.id !== p.id);
        const changed = ["action.primary", "surface.canvas", "shape.control.radius"].filter(
          (path) => {
            const d = p.diff(path, "light");
            const o = other?.diff(path, "light");
            return d && (d.base !== d.profile || (o && o.profile !== d.profile));
          },
        );
        expect(changed).toEqual(["action.primary", "surface.canvas", "shape.control.radius"]);
      });
    });
  }
});

/**
 * ORV-192 row 9. Focus takes the brand hue: the ring is the primitive behind the action.primary
 * of the same set, in both modes, so the focused line reads as the colour a user sees on controls.
 */
describe("focus.ring is the action.primary primitive under every set and mode (ORV-192 row 9)", () => {
  const sets = [
    { id: "neutral", tokens },
    ...profiles.map((p) => ({ id: p.id, tokens: p.tokens })),
  ];
  for (const set of sets) {
    for (const mode of MODES) {
      it(`${set.id}, ${mode}`, () => {
        const ring = set.tokens.get("semantic", "focus.ring");
        const primary = set.tokens.get("semantic", "action.primary");
        if (!ring || !primary) throw new Error("focus.ring or action.primary is missing");
        expect(set.tokens.resolve(ring, mode).value).toEqual(
          set.tokens.resolve(primary, mode).value,
        );
        expect(set.tokens.resolve(ring, mode).chain).toEqual(
          set.tokens.resolve(primary, mode).chain,
        );
      });
    }
  }
});

/**
 * ORV-192 row 7. A browser draws a weight only from the faces the loaded files carry (fonts.css):
 * a value between two faces splits a Thai and Latin line across two faces, so the line looks uneven.
 */
const WEIGHTS_BY_FAMILY: Record<string, readonly number[]> = {
  "IBM Plex Sans": [400, 500, 600],
  "IBM Plex Mono": [400, 500],
};

describe("type weights", () => {
  const sets = [
    { id: "neutral", set: tokens },
    ...profiles.map((p) => ({ id: p.id, set: p.tokens })),
  ];

  for (const { id, set } of sets) {
    it(`under ${id}, every type.* weight is one its stack carries`, () => {
      const types = set.layer("semantic").filter((t) => t.path.startsWith("type."));
      expect(types.length).toBeGreaterThanOrEqual(12);
      for (const t of types) {
        const v = set.resolve(t, "light").value as { fontFamily: string[]; fontWeight: number };
        const allowed = WEIGHTS_BY_FAMILY[v.fontFamily[0] ?? ""];
        expect(allowed, `${t.path} has a known first family`).toBeDefined();
        expect(allowed, `${t.path} weight ${v.fontWeight}`).toContain(Number(v.fontWeight));
      }
    });

    it(`under ${id}, display, heading and numeral are 500 and body and code are 400`, () => {
      const weight = (path: string) => {
        const token = set.get("semantic", path);
        if (!token) throw new Error(`no semantic token ${path}`);
        return Number((set.resolve(token, "light").value as { fontWeight: number }).fontWeight);
      };
      for (const path of [
        "type.display.lg",
        "type.display.md",
        "type.heading.md",
        "type.heading.sm",
        "type.numeral.lg",
        "type.numeral.md",
        "type.label.md",
        "type.label.sm",
      ]) {
        expect(weight(path), path).toBe(500);
      }
      for (const path of ["type.body.lg", "type.body.md", "type.body.sm", "type.code.md"]) {
        expect(weight(path), path).toBe(400);
      }
    });
  }
});

/**
 * ORV-192 row 16 (owner, comment 10401; supersedes the row 15 Friendly exception). Thai renders in
 * Sarabun in every profile and every type token. The browser takes the first family that carries
 * the glyph, so each stack names its Latin face first and Sarabun second: IBM Plex Sans for the
 * sans roles, IBM Plex Mono for code. No stack names Anuphan or IBM Plex Sans Thai.
 */
describe("Thai face (row 16)", () => {
  const LATIN_FACE = ["IBM Plex Sans", "IBM Plex Mono"];
  const sets = [
    { id: "neutral", set: tokens },
    ...profiles.map((p) => ({ id: p.id, set: p.tokens })),
  ];

  const stacks = (set: (typeof sets)[number]["set"]) =>
    set
      .layer("semantic")
      .filter((t) => t.path.startsWith("type.") || t.path.startsWith("font."))
      .map((t) => {
        const value = set.resolve(t, "light").value as string[] | { fontFamily: string[] };
        return { path: t.path, family: Array.isArray(value) ? value : value.fontFamily };
      });

  for (const { id, set } of sets) {
    it(`under ${id}, every type.* token and font.* family leads Thai to Sarabun`, () => {
      const found = stacks(set);
      expect(found.length).toBeGreaterThanOrEqual(15);
      for (const { path: p, family } of found) {
        expect(LATIN_FACE, `${p} Latin face`).toContain(family[0]);
        expect(family[1], `${p} Thai face`).toBe("Sarabun");
        expect(family, `${p} names no other Thai face`).not.toContain("Anuphan");
        expect(family, `${p} names no other Thai face`).not.toContain("IBM Plex Sans Thai");
      }
    });
  }

  it("covers the neutral standard, Professional and Friendly", () => {
    expect(sets.map((s) => s.id).sort()).toEqual(["friendly", "neutral", "professional"]);
  });
});

/**
 * Sarabun's stacks reach 1.25 em above the baseline and its lower vowels 0.33 em below, so a line
 * height under 1.7 lets a stack such as ที่ touch the ุ of the line above (measured, ORV-192 row 18).
 */
describe("running text clears Thai marks (row 18)", () => {
  const sets = [
    { id: "neutral", set: tokens },
    ...profiles.map((p) => ({ id: p.id, set: p.tokens })),
  ];
  for (const { id, set } of sets) {
    it(`under ${id}, every type.body.* line height is at least 1.7`, () => {
      const body = set.layer("semantic").filter((t) => t.path.startsWith("type.body."));
      expect(body.map((t) => t.path).sort()).toEqual([
        "type.body.lg",
        "type.body.md",
        "type.body.sm",
        "type.body.xs",
      ]);
      for (const t of body) {
        const { lineHeight } = set.resolve(t, "light").value as { lineHeight: number };
        expect(lineHeight, t.path).toBeGreaterThanOrEqual(1.7);
      }
    });
  }
});

describe("profile CSS", () => {
  it("matches the source files (run `pnpm --filter @orivilo/design-system tokens`)", () => {
    const committed = readFileSync(path.join(import.meta.dirname, "generated.css"), "utf8");
    expect(committed).toBe(emitProfilesCss(profiles));
  });

  it("declares each profile on the mode pair of its boundary, with its overrides only", () => {
    const p = new Profile(base, source());
    const css = p.emitCss();
    expect(css).toContain('[data-design-profile="probe"]:not([data-mode="dark"]) {');
    expect(css).toContain('[data-design-profile="probe"][data-mode="dark"] {');
    expect(css).toContain("--ds-action-primary: var(--op-color-blue-700);");
    expect(css).toContain("--ds-action-primary: var(--op-color-blue-300);");
    expect(css).not.toContain("--ds-surface-canvas");
    expect(css).not.toContain("--cmp-");
  });

  it("follows the OS for a system boundary with the same dark values", () => {
    const css = new Profile(base, source()).emitCss();
    const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
    expect(media).toContain('[data-design-profile="probe"][data-mode="system"] {');
    expect(media).toContain("--ds-action-primary: var(--op-color-blue-300);");
    expect(media).not.toContain("--op-color-blue-700");
  });

  it("remaps every Studio-only token to the profile's own action in every block", () => {
    const css = new Profile(base, source()).emitCss();
    for (const [from, to] of Object.entries(STUDIO_REMAP)) {
      const line = `--ds-${from.replaceAll(".", "-")}: var(--ds-${to.replaceAll(".", "-")});`;
      expect(css.split(line)).toHaveLength(4);
    }
    const studio = tokens.layer("semantic").filter((t) => t.scope === "studio");
    expect(studio.map((t) => t.path).sort()).toEqual(Object.keys(STUDIO_REMAP).sort());
  });

  it("emits own primitives before the overrides that use them, in both blocks", () => {
    const p = new Profile(base, {
      ...withSemantic({
        action: {
          primary: { $value: { light: "{color.probe.500}", dark: "{color.probe.500}" } },
        },
      }),
      primitives: { color: { probe: { "500": { $type: "color", $value: "#123456" } } } },
    });
    expect(p.validate()).toEqual([]);
    const css = p.emitCss();
    expect(css.match(/--op-color-probe-500: #123456;/g)).toHaveLength(3);
    expect(css.indexOf("--op-color-probe-500")).toBeLessThan(css.indexOf("--ds-action-primary"));
  });

  it("expands a typography override to its five parts", () => {
    const p = new Profile(
      base,
      withSemantic({
        type: {
          display: {
            lg: {
              $value: {
                fontFamily: "{font.family.plex-sans}",
                fontSize: "{font.size.56}",
                lineHeight: "{font.line-height.1-2}",
                fontWeight: "{font.weight.700}",
                letterSpacing: "{font.letter-spacing.tight}",
              },
            },
          },
        },
      }),
    );
    expect(p.validate()).toEqual([]);
    const css = p.emitCss();
    for (const part of [
      "font-family",
      "font-size",
      "line-height",
      "font-weight",
      "letter-spacing",
    ]) {
      expect(css).toContain(`--ds-type-display-lg-${part}: var(--op-font-`);
    }
  });
});

describe("Profile.validate catches", () => {
  it("an override of a name that is not in the contract", () => {
    const p = new Profile(
      base,
      withSemantic({ surface: { glow: { $value: "{color.lime.300}" } } }),
    );
    expect(p.validate().join("\n")).toMatch(/surface\.glow is not a semantic token/);
    expect(p.overrides).not.toContain("surface.glow");
  });

  it("an override inside a locked group", () => {
    for (const path of ["feedback.danger.fg", "canvas.grid"]) {
      const [g, ...rest] = path.split(".");
      const node = rest.reduceRight<Record<string, unknown>>((acc, key) => ({ [key]: acc }), {
        $value: { light: "{color.lime.300}", dark: "{color.lime.300}" },
      });
      const p = new Profile(base, withSemantic({ [g ?? ""]: node }));
      expect(p.validate().join("\n")).toContain(`${path} is locked`);
      expect(p.overrides).not.toContain(path);
    }
  });

  it("a primitive that collides with the base", () => {
    const p = new Profile(
      base,
      source({ primitives: { color: { gray: { "900": { $type: "color", $value: "#000000" } } } } }),
    );
    expect(p.validate().join("\n")).toMatch(/color\.gray\.900 already exists/);
    expect(p.ownPrimitives).toEqual([]);
    const t = p.tokens.get("primitive", "color.gray.900");
    expect(t?.raw).toBe("#16151D");
  });

  it("a reference to a primitive that does not exist", () => {
    const p = new Profile(
      base,
      withSemantic({
        action: { primary: { $value: { light: "{color.navy.700}", dark: "{color.navy.300}" } } },
      }),
    );
    expect(p.validate().join("\n")).toMatch(/unknown primitive color\.navy\.700/);
  });

  it("a type that does not match the base token", () => {
    const p = new Profile(
      base,
      source({
        semantic: { shape: { control: { radius: { $type: "color", $value: "{radius.4}" } } } },
      }),
    );
    expect(p.validate().join("\n")).toMatch(
      /shape\.control\.radius is dimension, the override says color/,
    );
  });

  it("a colour override without both modes", () => {
    const p = new Profile(
      base,
      withSemantic({ action: { primary: { $value: "{color.blue.700}" } } }),
    );
    expect(p.validate().join("\n")).toMatch(/action\.primary needs a light and a dark value/);
  });

  it("a decision outside the vocabulary or missing", () => {
    expect(
      new Profile(base, source({ $decisions: { shape: "rounded", surfaceTreatment: "glass" } }))
        .validate()
        .join("\n"),
    ).toMatch(/surfaceTreatment "glass" is not one of flat, bordered/);
    expect(
      new Profile(base, source({ $decisions: { shape: "rounded", mood: "calm" } }))
        .validate()
        .join("\n"),
    ).toMatch(/unknown decision "mood"/);
    expect(
      new Profile(base, source({ $decisions: { shape: "rounded" } })).validate().join("\n"),
    ).toMatch(/decision surfaceTreatment is required/);
  });

  it("a decision the tokens contradict", () => {
    const crisp = new Profile(
      base,
      source({ $decisions: { shape: "crisp", surfaceTreatment: "flat" } }),
    );
    expect(crisp.validate().join("\n")).toMatch(/shape crisp needs control radius <= 8/);
    const bordered = new Profile(
      base,
      source({ $decisions: { shape: "rounded", surfaceTreatment: "bordered" } }),
    );
    expect(bordered.validate().join("\n")).toMatch(
      /surfaceTreatment bordered needs a visible border\.card/,
    );
  });

  it("an override of a Studio-only token", () => {
    const p = new Profile(
      base,
      withSemantic({
        action: { intent: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } } },
      }),
    );
    expect(p.validate().join("\n")).toMatch(/action\.intent is Studio-only/);
    expect(p.overrides).not.toContain("action.intent");
  });

  it("a profile that leaves an identity token at the shell's value", () => {
    const p = new Profile(
      base,
      source({
        semantic: {
          action: { primary: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } } },
        },
      }),
    );
    const errors = p.validate().join("\n");
    for (const path of Object.keys(IDENTITY_OVERRIDES).flatMap((g) =>
      Object.keys(IDENTITY_OVERRIDES[g as keyof typeof IDENTITY_OVERRIDES]).map((k) => `${g}.${k}`),
    )) {
      expect(errors).toContain(`${path} carries ORIVILO's identity`);
    }
  });

  it("an id that is not a slug, or neutral", () => {
    expect(new Profile(base, source({ $id: "Pro File" })).validate().join("\n")).toMatch(
      /must match/,
    );
    expect(new Profile(base, source({ $id: "neutral" })).validate().join("\n")).toMatch(
      /neutral is the base/,
    );
  });

  it("nothing on a well-formed overlay", () => {
    expect(new Profile(base, source()).validate()).toEqual([]);
  });
});

describe("the decision vocabulary", () => {
  it("is small and each entry has at least two values", () => {
    expect(Object.keys(DECISIONS).length).toBeLessThanOrEqual(8);
    for (const values of Object.values(DECISIONS)) expect(values.length).toBeGreaterThanOrEqual(2);
  });

  it("matches the Intent Engine's list, so a rule can only set what a profile declares", () => {
    expect(DECISIONS).toEqual(DECISION_VOCABULARY);
  });

  it("gives the resolver a complete, valid decision set for every shipped profile", () => {
    for (const p of profiles) {
      expect(curatedProfileSchema.safeParse({ id: p.id, decisions: p.decisions }).success).toBe(
        true,
      );
    }
  });
});

/**
 * A small cascade over the generated CSS (ORV-192 row 4). It reads every rule of tokens and
 * profiles generated.css, keeps the ones that match one boundary element (a mode, a profile and
 * the OS preference), and returns the custom properties that element declares itself, by
 * specificity then source order. A property the element declares itself is reset; one it does not
 * declare is inherited from the parent boundary.
 */
function declaredOn(mode: "light" | "dark" | "system", profile: string, osDark: boolean) {
  const files = ["../tokens/generated.css", "../profiles/generated.css"];
  const own = new Map<string, { value: string; weight: number; order: number }>();
  let order = 0;
  for (const file of files) {
    const css = readFileSync(path.join(import.meta.dirname, file), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@theme inline \{[\s\S]*?\n\}/, "");
    const rule = /(@media \(prefers-color-scheme: dark\) \{\s*)?([^{}@]+)\{([^{}]*)\}/g;
    for (const m of css.matchAll(rule)) {
      const [, media, selectors = "", body = ""] = m;
      if (media && !osDark) continue;
      for (const sel of selectors.split(",").map((s) => s.trim())) {
        if (sel === ":root") continue; // the document, never a boundary element
        const parts = [...sel.matchAll(/(:not\()?\[([a-z-]+)(?:="([^"]*)")?\]\)?/g)];
        const attrs: Record<string, string> = { "data-mode": mode, "data-design-profile": profile };
        const hits = parts.every((p) => {
          const name = p[2] ?? "";
          const equal = attrs[name] === p[3] || (p[3] === undefined && name in attrs);
          return p[1] ? !equal : equal;
        });
        if (!hits) continue;
        order += 1;
        const weight = parts.length;
        for (const d of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
          const prev = own.get(d[1] ?? "");
          if (!prev || weight >= prev.weight)
            own.set(d[1] ?? "", { value: (d[2] ?? "").trim(), weight, order });
        }
      }
    }
  }
  return own;
}

describe("a nested boundary resets every semantic value (ORV-192 row 4)", () => {
  const semanticNames = tokens
    .layer("semantic")
    .flatMap((t) => tokens.declarations(t, t.raw))
    .map((d) => d.slice(0, d.indexOf(":")));

  for (const mode of ["light", "dark", "system"] as const) {
    for (const osDark of mode === "system" ? [false, true] : [false]) {
      for (const id of PROFILE_IDS) {
        it(`${id} in ${mode}${osDark ? " with the OS in dark" : ""} declares every semantic token itself`, () => {
          const own = declaredOn(mode, id, osDark);
          const missing = semanticNames.filter((n) => !own.has(n));
          expect(missing).toEqual([]);
        });
      }
    }
  }

  it("neutral in dark inside friendly reads neutral's size, not friendly's 44px", () => {
    const neutral = declaredOn("dark", "neutral", false);
    const friendly = declaredOn("dark", "friendly", false);
    expect(friendly.get("--ds-size-control-md")?.value).toBe("var(--op-size-11)");
    expect(neutral.get("--ds-size-control-md")?.value).toBe("var(--op-size-10)");
  });
});
