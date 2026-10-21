/**
 * The profile contract (DESIGN.md §5, §8; spec E2-2). Fails when a profile overrides a name that
 * does not exist, touches a locked group, collides with a base primitive, references an unknown
 * primitive, declares a decision its tokens contradict, or when src/profiles/generated.css is
 * stale. Contrast under each profile is checked in ../tokens/contrast-pairs.test.ts (E0-5).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
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
  brand: {
    signature: { $value: { light: "{color.blue.600}", dark: "{color.blue.400}" } },
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
    for (const path of ["feedback.danger.fg", "focus.ring"]) {
      const [g, ...rest] = path.split(".");
      const node = rest.reduceRight<Record<string, unknown>>((acc, key) => ({ [key]: acc }), {
        $value: { light: "{color.lime.300}", dark: "{color.lime.300}" },
      });
      const p = new Profile(base, withSemantic({ [g ?? ""]: node }));
      expect(p.validate().join("\n")).toMatch(new RegExp(`${path.replace(".", "\\.")} is locked`));
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
      expect(errors).toMatch(new RegExp(`${path.replace(".", "\\.")} carries ORIVILO's identity`));
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
});
