import component from "../tokens/source/component.json" with { type: "json" };
import primitives from "../tokens/source/primitives.json" with { type: "json" };
import semantic from "../tokens/source/semantic.json" with { type: "json" };
import friendly from "./source/friendly.json" with { type: "json" };
import professional from "./source/professional.json" with { type: "json" };
import { type BaseSources, Profile, type ProfileSource } from "./model.ts";

type Json = Record<string, unknown>;

const base: BaseSources = { primitives, semantic, component };
const SOURCES = [professional, friendly] as unknown as readonly ProfileSource[];

/**
 * Decisions a person can refine in the Studio (spec ORV-34 part 3), each with the semantic group
 * that carries it. None of these groups holds a colour, so a refined profile keeps every contrast
 * pair its hand-made profile proved. `surfaceTreatment` and `emphasis` change colours and wait for a
 * runtime contrast check.
 */
export const REFINABLE = { shape: "shape", typeVoice: "type", motion: "motion" } as const;
export type RefinableKey = keyof typeof REFINABLE;
export type Refinements = Partial<Record<RefinableKey, string>>;

export function isRefinable(key: string): key is RefinableKey {
  return key in REFINABLE;
}

/** The hand-made profile that already expresses a value, which a refinement borrows from. */
export function donorFor(key: RefinableKey, value: string): string | undefined {
  return SOURCES.find((s) => s.$decisions[key] === value)?.$id;
}

const clone = <T>(value: T): T => structuredClone(value);

/**
 * A hand-made profile with some refinable decisions set to another value. Each set decision takes
 * the whole semantic group of the profile that expresses that value (or the base set, where that
 * profile leaves the group alone), plus the donor's own primitives the group may reference. Values
 * no hand-made profile expresses are skipped and returned, so nothing is invented. The result has a
 * new id, so its CSS renders inline under its own boundary.
 */
export function refineProfile(
  id: string,
  refinements: Refinements,
): { profile: Profile; applied: Refinements; skipped: Refinements } | undefined {
  const target = SOURCES.find((s) => s.$id === id);
  if (!target) return undefined;
  const source = clone(target) as ProfileSource & { primitives?: Json };
  const own = (source.primitives ?? {}) as Json;
  const applied: Refinements = {};
  const skipped: Refinements = {};
  for (const [key, value] of Object.entries(refinements) as [RefinableKey, string][]) {
    if (target.$decisions[key] === value) continue;
    const donorId = donorFor(key, value);
    const donor = SOURCES.find((s) => s.$id === donorId);
    if (!donor) {
      skipped[key] = value;
      continue;
    }
    const group = REFINABLE[key];
    const sem = Object.fromEntries(
      Object.entries(source.semantic as Json).filter(([k]) => k !== group),
    );
    const borrowed = (donor.semantic as Json)[group];
    if (borrowed !== undefined) sem[group] = clone(borrowed);
    for (const [k, v] of Object.entries((donor.primitives ?? {}) as Json)) {
      if (!(k in own)) own[k] = clone(v);
      else if (typeof v === "object" && v !== null && typeof own[k] === "object") {
        own[k] = { ...clone(v as Json), ...(own[k] as Json) };
      }
    }
    source.semantic = sem as ProfileSource["semantic"];
    source.$decisions = { ...source.$decisions, [key]: value };
    applied[key] = value;
  }
  if (Object.keys(applied).length === 0) return undefined;
  source.primitives = own;
  source.$id = `${target.$id}-refined`;
  return { profile: new Profile(base, source), applied, skipped };
}

/** Which component groups read each semantic path, from the component layer's references. */
const READERS: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, Set<string>>();
  const visit = (node: unknown, group: string) => {
    if (typeof node === "string") {
      for (const m of node.matchAll(/\{([a-z0-9.-]+)\}/g)) {
        const path = m[1];
        if (path === undefined) continue;
        const readers = map.get(path) ?? new Set<string>();
        readers.add(group);
        map.set(path, readers);
      }
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) if (k !== "$description") visit(v, group);
    }
  };
  for (const [group, node] of Object.entries(component as Json)) {
    if (!group.startsWith("$")) visit(node, group);
  }
  return new Map([...map].map(([k, v]) => [k, [...v].sort()]));
})();

/** The component groups that read any of these semantic paths, sorted. */
export function componentsReading(paths: readonly string[]): string[] {
  return [...new Set(paths.flatMap((p) => READERS.get(p) ?? []))].sort();
}
