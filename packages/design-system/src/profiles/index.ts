import component from "../tokens/source/component.json" with { type: "json" };
import primitives from "../tokens/source/primitives.json" with { type: "json" };
import semantic from "../tokens/source/semantic.json" with { type: "json" };
import friendly from "./source/friendly.json" with { type: "json" };
import professional from "./source/professional.json" with { type: "json" };
import { type BaseSources, Profile, type ProfileSource } from "./model.ts";

const base: BaseSources = { primitives, semantic, component };

/**
 * The hand-made profiles (E2-2), in toolbar order. `neutral` is the base set itself (DESIGN.md §3)
 * and has no file. E2-3 gives the Studio shell its own entry; resolved customer profiles arrive
 * with E2-9 through the same model.
 */
export const profiles: readonly Profile[] = [
  new Profile(base, professional as ProfileSource),
  new Profile(base, friendly as ProfileSource),
];

export const PROFILE_IDS = ["neutral", ...profiles.map((p) => p.id)] as const;

export function profileById(id: string): Profile | undefined {
  return profiles.find((p) => p.id === id);
}

export { DECISIONS, LOCKED_GROUPS, STUDIO_REMAP, Profile, emitProfilesCss } from "./model.ts";
export type { BaseSources, ProfileSource } from "./model.ts";
export { REFINABLE, componentsReading, donorFor, isRefinable, refineProfile } from "./refine.ts";
export type { RefinableKey, Refinements } from "./refine.ts";
