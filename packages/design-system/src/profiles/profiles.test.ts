/**
 * The profile contract (DESIGN.md §5, §8; spec E2-2). Fails when a profile overrides a name that
 * does not exist, touches a locked group, collides with a base primitive, references an unknown
 * primitive, declares a decision its tokens contradict, breaks a contrast pair in either mode, or
 * when src/profiles/generated.css is stale.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../foundations/contrast";
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
      action: { primary: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } } },
    },
    ...overrides,
  };
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

      const pairs = p.tokens
        .layer("semantic")
        .filter((t) => t.contrast && t.contrast.floor !== null);
      for (const token of pairs) {
        for (const mode of MODES) {
          it(`${token.path} on ${token.contrast?.against} meets ${token.contrast?.floor} in ${mode}`, () => {
            const against = p.tokens.get("semantic", token.contrast?.against ?? "");
            if (!against || !token.contrast?.floor) throw new Error("pair missing");
            const fg = String(p.tokens.resolve(token, mode).value);
            const bg = String(p.tokens.resolve(against, mode).value);
            const ratio = contrastRatio(fg, bg);
            expect(ratio, `${fg} on ${bg}`).not.toBeNull();
            expect(ratio ?? 0).toBeGreaterThanOrEqual(token.contrast.floor);
          });
        }
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

  it("emits own primitives before the overrides that use them, in both blocks", () => {
    const p = new Profile(
      base,
      source({
        primitives: { color: { probe: { "500": { $type: "color", $value: "#123456" } } } },
        semantic: {
          action: {
            primary: { $value: { light: "{color.probe.500}", dark: "{color.probe.500}" } },
          },
        },
      }),
    );
    expect(p.validate()).toEqual([]);
    const css = p.emitCss();
    expect(css.match(/--op-color-probe-500: #123456;/g)).toHaveLength(2);
    expect(css.indexOf("--op-color-probe-500")).toBeLessThan(css.indexOf("--ds-action-primary"));
  });

  it("expands a typography override to its five parts", () => {
    const p = new Profile(
      base,
      source({
        semantic: {
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
      source({ semantic: { surface: { glow: { $value: "{color.lime.300}" } } } }),
    );
    expect(p.validate().join("\n")).toMatch(/surface\.glow is not a semantic token/);
    expect(p.overrides).toEqual([]);
  });

  it("an override inside a locked group", () => {
    for (const path of ["feedback.danger.fg", "focus.ring"]) {
      const [g, ...rest] = path.split(".");
      const node = rest.reduceRight<Record<string, unknown>>((acc, key) => ({ [key]: acc }), {
        $value: { light: "{color.lime.300}", dark: "{color.lime.300}" },
      });
      const p = new Profile(base, source({ semantic: { [g ?? ""]: node } }));
      expect(p.validate().join("\n")).toMatch(new RegExp(`${path.replace(".", "\\.")} is locked`));
      expect(p.overrides).toEqual([]);
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
      source({
        semantic: {
          action: { primary: { $value: { light: "{color.navy.700}", dark: "{color.navy.300}" } } },
        },
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
      source({ semantic: { action: { primary: { $value: "{color.blue.700}" } } } }),
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
