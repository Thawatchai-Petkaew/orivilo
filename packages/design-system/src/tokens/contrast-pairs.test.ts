/**
 * The contrast contract (spec E0-5): every derived pair meets its floor under the neutral set and
 * every profile in both modes, every semantic colour is paired or exempt with a reason, the pairs
 * declared in semantic.json are a subset of the derived set, and a broken value is caught.
 */
import { describe, expect, it } from "vitest";
import { profiles } from "../profiles/index";
import {
  EXEMPT,
  PAIR_RULES,
  checkContrast,
  semanticPairs,
  staleExemptions,
  unexplainedColours,
} from "./contrast-pairs";
import { MODES, TokenSet, tokens } from "./index";
import component from "./source/component.json" with { type: "json" };
import primitives from "./source/primitives.json" with { type: "json" };
import semantic from "./source/semantic.json" with { type: "json" };

const sets = [
  { id: "neutral", set: tokens },
  ...profiles.map((p) => ({ id: p.id, set: p.tokens })),
];

describe("the pair set", () => {
  it("covers text on every surface and the control boundaries", () => {
    const pairs = semanticPairs(tokens);
    expect(pairs.length).toBeGreaterThanOrEqual(60);
    const keys = new Set(pairs.map((p) => `${p.fg}|${p.bg}`));
    for (const fg of ["text.primary", "text.secondary"]) {
      for (const bg of ["surface.card", "surface.hover", "surface.selected", "surface.sunken"]) {
        expect(keys.has(`${fg}|${bg}`), `${fg} on ${bg}`).toBe(true);
      }
    }
    expect(keys.has("text.on-action|action.primary-press")).toBe(true);
    expect(keys.has("feedback.danger.fg|feedback.danger.surface")).toBe(true);
    expect(keys.has("border.control|surface.card")).toBe(true);
    expect(PAIR_RULES.every((r) => r.floor === 4.5 || r.floor === 3)).toBe(true);
  });

  it("includes every pair semantic.json declares with a floor, at that floor or higher", () => {
    const pairs = semanticPairs(tokens);
    for (const token of tokens.layer("semantic")) {
      if (!token.contrast?.floor) continue;
      const found = pairs.find((p) => p.fg === token.path && p.bg === token.contrast?.against);
      expect(found, `${token.path} on ${token.contrast.against}`).toBeDefined();
      expect(found?.floor ?? 0).toBeGreaterThanOrEqual(token.contrast.floor);
    }
  });

  it("names every semantic colour token in a pair or in the exemption list, and nothing else", () => {
    for (const { id, set } of sets) {
      expect(unexplainedColours(set), `${id}: unexplained`).toEqual([]);
      expect(staleExemptions(set), `${id}: stale exemptions`).toEqual([]);
    }
    for (const reason of Object.values(EXEMPT)) expect(reason.length).toBeGreaterThan(10);
  });
});

describe("every pair meets its floor", () => {
  for (const r of checkContrast(sets)) {
    it(`${r.profile} ${r.mode}: ${r.fg} on ${r.bg} is at least ${r.floor} (${r.where})`, () => {
      expect(r.ratio, `${r.fgValue} on ${r.bgValue}`).not.toBeNull();
      expect(r.ratio ?? 0, `${r.fgValue} on ${r.bgValue}`).toBeGreaterThanOrEqual(r.floor);
    });
  }
});

describe("the check", () => {
  it("fails when a value is pushed under its floor", () => {
    const broken = structuredClone(semantic) as typeof semantic;
    broken.text.secondary.$value.dark = "{color.gray.700}";
    const results = checkContrast([
      { id: "broken", set: new TokenSet(primitives, broken, component) },
    ]);
    const failed = results.filter((r) => !r.pass);
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((r) => r.mode === "dark" && r.fg === "text.secondary")).toBe(true);
    expect(MODES).toEqual(["light", "dark"]);
  });

  it("fails on a value that is not a colour", () => {
    const broken = structuredClone(semantic) as typeof semantic;
    broken.text.primary.$value.light = "{color.white}";
    broken.surface.canvas.$value.light = "{opacity.disabled}";
    const set = new TokenSet(primitives, broken, component);
    const result = checkContrast([{ id: "broken", set }]).find(
      (r) => r.mode === "light" && r.fg === "text.primary" && r.bg === "surface.canvas",
    );
    expect(result?.ratio).toBeNull();
    expect(result?.pass).toBe(false);
  });
});
