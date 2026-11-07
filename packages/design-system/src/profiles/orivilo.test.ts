/**
 * ORV-52: ORIVILO's own brand as a profile the resolver chooses (spec docs/specs/ORV-52/spec.md).
 * The resolver is rule-based and chooses among profiles; it does not generate token values, so the
 * `orivilo` values are hand-copied from the base set and row 3 proves they stay equal to it.
 */
import {
  type CuratedProfile,
  DECISION_VOCABULARY,
  STARTER_KNOWLEDGE_IDS,
  STARTER_RULES,
  resolveProfile,
  type ResolveInput,
} from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import component from "../tokens/source/component.json" with { type: "json" };
import primitives from "../tokens/source/primitives.json" with { type: "json" };
import semantic from "../tokens/source/semantic.json" with { type: "json" };
import { checkContrast } from "../tokens/contrast-pairs";
import { MODES, type Mode, tokens } from "../tokens/index";
import oriviloSource from "./source/orivilo.json" with { type: "json" };
import {
  BRAND_PROFILES,
  CURATED_PROFILES,
  PROFILE_IDS,
  Profile,
  type ProfileSource,
  STUDIO_REMAP,
  profiles,
} from "./index";

const base = { primitives, semantic, component };

/** The ten identity-scoped tokens `orv52-tokens-1` overrides, in the order the spec names them. */
const IDENTITY_TOKENS = [
  "surface.selected",
  "text.link",
  "text.link-hover",
  "text.brand",
  "selection.bg",
  "selection.fg",
  "focus.ring",
  "brand.signature",
  "brand.ink",
  "brand.dot-small",
] as const;

function need<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("expected a value");
  return value;
}

const orivilo = need(BRAND_PROFILES.find((p) => p.id === "orivilo"));

/** Resolved value of a semantic path under a set, for one mode. */
function valueOf(set: Profile["tokens"], path: string, mode: Mode): string {
  const token = need(set.get("semantic", path));
  return String(set.resolve(token, mode).value);
}

/** `orv52-vector-1`: the brand method's vector, a typed fixture. */
const FACTS: ResolveInput["facts"] = {
  personality: { playful: 65, expressive: 70, structured: 80, warm: 70, premium: 65 },
  industry: null,
  audiences: [],
  avoid: [],
};

/** `orv52-locks-1`: the three decisions the owner already made. */
const LOCKS: ResolveInput["locked"] = {
  shape: "rounded",
  surfaceTreatment: "flat",
  typeVoice: "single",
};

const asCurated = (p: Profile): CuratedProfile => ({
  id: p.id,
  decisions: p.decisions as CuratedProfile["decisions"],
});

function input(locked: ResolveInput["locked"]): ResolveInput {
  return {
    catalogVersion: "catalog-1",
    facts: FACTS,
    locked,
    adjustments: [],
    rules: [...STARTER_RULES],
    knowledgeIds: [...STARTER_KNOWLEDGE_IDS],
    profiles: [...CURATED_PROFILES, ...BRAND_PROFILES.map(asCurated)],
  };
}

describe("orivilo registration (orv52-scope-1, row 8)", () => {
  it("is a brand profile in its own list and in none of the customer lists", () => {
    expect(BRAND_PROFILES.map((p) => p.id)).toEqual(["orivilo"]);
    expect(profiles.map((p) => p.id)).not.toContain("orivilo");
    expect(CURATED_PROFILES.map((p) => p.id)).not.toContain("orivilo");
    expect(PROFILE_IDS).toEqual(["neutral", "professional", "friendly"]);
  });

  it("declares the id and the name of orv52-tokens-1", () => {
    expect(orivilo.id).toBe("orivilo");
    expect(orivilo.name).toEqual({ th: "ORIVILO", en: "ORIVILO" });
    expect(orivilo.description).toMatch(/hand-copied/);
    expect(orivilo.description).toMatch(/not generated/);
  });
});

describe("row 1: orivilo.json is valid (orv52-tokens-1, orv52-decisions-1)", () => {
  it("validates against the base set with no errors", () => {
    expect(new Profile(base, oriviloSource as ProfileSource).validate()).toEqual([]);
  });

  it("declares the five decisions of orv52-decisions-1", () => {
    expect(orivilo.decisions).toEqual({
      shape: "rounded",
      surfaceTreatment: "flat",
      emphasis: "expressive",
      typeVoice: "single",
      motion: "standard",
    });
    for (const [key, value] of Object.entries(orivilo.decisions)) {
      expect(DECISION_VOCABULARY[key as keyof typeof DECISION_VOCABULARY]).toContain(value);
    }
  });

  it("overrides exactly the ten identity tokens and adds no primitive", () => {
    expect([...orivilo.overrides].sort()).toEqual([...IDENTITY_TOKENS].sort());
    expect(orivilo.ownPrimitives).toEqual([]);
  });

  it("names a decision its tokens contradict (the shape check is live)", () => {
    const source = {
      ...(oriviloSource as ProfileSource),
      $decisions: { ...oriviloSource.$decisions, shape: "crisp" },
    };
    expect(new Profile(base, source).validate().join("\n")).toMatch(/shape crisp/);
  });
});

describe("row 2: every contrast pair meets its floor under orivilo", () => {
  const results = checkContrast([{ id: "orivilo", set: orivilo.tokens }]);

  it("checks both modes", () => {
    expect(new Set(results.map((r) => r.mode))).toEqual(new Set(MODES));
    expect(results.length).toBeGreaterThanOrEqual(120);
  });

  for (const r of results) {
    it(`${r.mode}: ${r.fg} on ${r.bg} is at least ${r.floor}`, () => {
      expect(r.ratio, `${r.fgValue} on ${r.bgValue}`).not.toBeNull();
      expect(r.ratio ?? 0, `${r.fgValue} on ${r.bgValue}`).toBeGreaterThanOrEqual(r.floor);
    });
  }
});

describe("row 3: orivilo renders the base look on its ten tokens", () => {
  for (const mode of MODES) {
    for (const path of IDENTITY_TOKENS) {
      it(`${path}, ${mode}`, () => {
        expect(valueOf(orivilo.tokens, path, mode)).toBe(valueOf(tokens, path, mode));
      });
    }
  }
});

describe("rows 4 to 6: the resolver chooses orivilo from ORIVILO's vector", () => {
  it("row 4: without locks the shape rules tie and friendly wins", () => {
    const result = resolveProfile(input({}));
    expect(result.status).toBe("conflicted");
    expect(result.conflicts).toEqual([
      {
        kind: "rule-tie",
        key: "shape",
        candidates: [
          { value: "crisp", rules: ["shape.structured-crisp"] },
          { value: "soft", rules: ["shape.playful-soft"] },
        ],
      },
    ]);
    expect(Object.keys(result.decisions)).toEqual(["emphasis", "typeVoice"]);
    expect(result.decisions.emphasis?.value).toBe("expressive");
    expect(result.decisions.typeVoice?.value).toBe("paired");
    expect(result.open).toEqual(["shape", "surfaceTreatment", "motion"]);
    expect(result.profileId).toBe("friendly");
  });

  it("row 5: with the three brand locks the resolver picks orivilo and reports every disagreement", () => {
    const result = resolveProfile(input(LOCKS));
    expect(result.profileId).toBe("orivilo");
    expect(result.profileTies).toEqual([]);
    expect(result.unsupported).toEqual([]);
    expect(result.conflicts.map((c) => c.kind)).toEqual(["locked", "locked", "locked"]);
    expect(
      result.conflicts.map((c) =>
        c.kind === "locked" ? `${c.key}:${c.locked}:${c.proposed}` : "tie",
      ),
    ).toEqual(["shape:rounded:crisp", "shape:rounded:soft", "typeVoice:single:paired"]);
    expect(result.open).toEqual(["motion"]);
  });

  it("row 6: the same input gives the same fingerprint", () => {
    expect(resolveProfile(input(LOCKS)).fingerprint).toBe(resolveProfile(input(LOCKS)).fingerprint);
  });
});

/**
 * Row 7, `orv52-match-1`. Brand spec §5 (light) and its dark set line, mapped to semantic tokens.
 * A spec value matches when the hex the profile renders for the token and mode equals it, upper
 * case, no rounding. A Studio-scoped token renders its STUDIO_REMAP target.
 */
interface SpecValue {
  token: string;
  mode: Mode;
  hex: string;
}

const light = (token: string, hex: string): SpecValue => ({ token, mode: "light", hex });
const dark = (token: string, hex: string): SpecValue => ({ token, mode: "dark", hex });

const SPEC_VALUES: readonly SpecValue[] = [
  light("surface.canvas", "#F4F4F0"),
  light("surface.card", "#FFFFFF"),
  light("surface.selected", "#F4EEFD"),
  light("surface.inverse", "#16151D"),
  light("text.primary", "#16151D"),
  light("text.secondary", "#5B5A66"),
  light("text.body-soft", "#3A394A"),
  light("action.primary", "#7A22C7"),
  light("action.primary-hover", "#6B22B0"),
  light("action.primary-press", "#3F1366"),
  light("selection.fg", "#6B22B0"),
  light("focus.ring", "#16151D"),
  light("border.control", "#85838F"),
  light("border.subtle", "#E3E2DC"),
  light("brand.signature", "#7A22C7"),
  light("feedback.success.fg", "#0B6E4F"),
  light("feedback.warning.fg", "#B54708"),
  light("feedback.danger.fg", "#B42318"),
  light("feedback.info.fg", "#1D6FD6"),
  dark("surface.canvas", "#16151D"),
  dark("surface.card", "#1E1D26"),
  dark("text.primary", "#F2F1EC"),
  dark("text.secondary", "#A9A7B3"),
  dark("action.primary", "#B07FEE"),
  dark("brand.signature", "#B07FEE"),
  dark("action.intent", "#D9F66F"),
];

/** The diff table's colour rows, keyed by the spec value they explain. */
const COLOUR_DIFFS: Readonly<Record<string, string>> = {
  "focus.ring/light": "d-1",
  "text.body-soft/light": "d-2",
  "feedback.info.fg/light": "d-3",
  "action.intent/dark": "d-4",
};

/** The hex a set renders for a spec value, as the token source writes it; null for no such token. */
function renders(set: Profile["tokens"], value: SpecValue): string | null {
  const token = set.get("semantic", STUDIO_REMAP[value.token] ?? value.token);
  return token ? String(set.resolve(token, value.mode).value) : null;
}

/** `orv52-match-1`: equal hex, compared upper-case, no rounding. */
function sameHex(rendered: string | null, spec: string): boolean {
  return rendered !== null && rendered.toUpperCase() === spec.toUpperCase();
}

describe("row 7: where orivilo departs from brand spec v1.1 (orv52-match-1)", () => {
  it("maps 26 spec values: 19 light rows and 7 dark values", () => {
    expect(SPEC_VALUES.filter((v) => v.mode === "light")).toHaveLength(19);
    expect(SPEC_VALUES.filter((v) => v.mode === "dark")).toHaveLength(7);
  });

  it("does not match exactly the colour rows of the diff table, d-1 to d-4", () => {
    const mismatched = SPEC_VALUES.filter((v) => !sameHex(renders(orivilo.tokens, v), v.hex)).map(
      (v) => `${v.token}/${v.mode}`,
    );
    expect(mismatched.sort()).toEqual(Object.keys(COLOUR_DIFFS).sort());
    expect(mismatched.map((id) => COLOUR_DIFFS[id]).sort()).toEqual(["d-1", "d-2", "d-3", "d-4"]);
  });

  it("matches by exact hex, upper-case, with no rounding (worked example 3)", () => {
    expect(sameHex("#7a22c7", "#7A22C7")).toBe(true);
    expect(sameHex("#7A22C7", "#7a22c7")).toBe(true);
    expect(sameHex("#7A22C7", "#7A22C8")).toBe(false);
    expect(sameHex(null, "#7A22C7")).toBe(false);
    const rendered = (token: string) => renders(orivilo.tokens, light(token, ""));
    expect([
      sameHex(rendered("focus.ring"), "#16151D"),
      sameHex(rendered("action.primary"), "#7A22C7"),
      sameHex(rendered("feedback.info.fg"), "#1D6FD6"),
    ]).toEqual([false, true, false]);
    expect(rendered("feedback.info.fg")?.toUpperCase()).toBe("#0C55AB");
  });

  it("has no text.body-soft token, so d-2 is a missing token and not a near miss", () => {
    expect(orivilo.tokens.get("semantic", "text.body-soft")).toBeUndefined();
  });

  it("compares the remap target for a Studio token (lime renders as action.primary)", () => {
    expect(renders(orivilo.tokens, dark("action.intent", ""))).toBe(
      renders(orivilo.tokens, dark("action.primary", "")),
    );
    expect(valueOf(orivilo.tokens, "action.intent", "dark").toUpperCase()).toBe("#D9F66F");
  });
});
