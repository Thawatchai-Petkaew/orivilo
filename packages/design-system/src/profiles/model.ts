/**
 * Profile model (E2-2). A profile is a semantic overlay on the base token set: it changes the
 * value of existing semantic tokens and may add primitive ramps of its own. It never adds a
 * semantic name (components rely on the contract), never changes a base primitive, and never
 * touches feedback (DESIGN.md §8: meaning never moves). Pure TypeScript, shared by the
 * build script, the tests, and Storybook.
 */
import {
  type Layer,
  type Mode,
  MODES,
  type Token,
  TokenSet,
  flatten,
  refTarget,
} from "../tokens/model.ts";

type Json = Record<string, unknown>;

/** Groups a profile may not override. Their meaning belongs to the system, not to a brand. */
/**
 * Groups whose meaning never changes per profile: feedback (DESIGN.md §8), and the canvas groups,
 * which are Studio chrome and never render inside a customer boundary (ADR 0004 item 6). Focus
 * follows the profile through the identity-scoped `focus.ring` (ORV-192 row 9).
 */
export const LOCKED_GROUPS: readonly string[] = [
  "feedback",
  "canvas",
  "port",
  "edge",
  "status",
];

/**
 * Where each Studio-scoped token points inside a profile boundary (E2-3). The Intent Engine action
 * is the Studio's; a profile never carries it, so inside a customer boundary it renders as the
 * profile's own primary action rather than leaking the Studio's lime (DESIGN.md §9 item 10).
 */
export const STUDIO_REMAP: Readonly<Record<string, string>> = {
  "action.intent": "action.primary",
  "action.intent-hover": "action.primary-hover",
  "action.intent-press": "action.primary-press",
  "text.on-intent": "text.on-action",
};

/**
 * Decisions a profile declares (handoff §12.1), each with the values the system knows. `shape` and
 * `surfaceTreatment` are checked against the tokens; the rest describe the author's intent and are
 * checked for vocabulary only.
 */
export const DECISIONS: Record<string, readonly string[]> = {
  shape: ["crisp", "rounded", "soft"],
  surfaceTreatment: ["flat", "bordered"],
  emphasis: ["restrained", "expressive"],
  typeVoice: ["single", "paired"],
  motion: ["quiet", "standard"],
};

export interface ProfileSource {
  $id: string;
  $name: { th: string; en: string };
  $description: string;
  $decisions: Record<string, string>;
  /** Own primitive ramps, DTCG nodes under the same paths as primitives.json; no path may collide. */
  primitives?: Json;
  /** Semantic overrides, DTCG nodes carrying `$value` only; the path must exist in semantic.json. */
  semantic: Json;
}

export interface BaseSources {
  primitives: Json;
  semantic: Json;
  component: Json;
}

const ID = /^[a-z][a-z0-9-]*$/;

function isPlain(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep copy of a JSON tree. */
function clone<T>(v: T): T {
  return structuredClone(v);
}

/** Leaves of a DTCG tree that carry `$value`, with their dotted path. */
function leaves(tree: Json, prefix = ""): { path: string; node: Json }[] {
  const out: { path: string; node: Json }[] = [];
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$") || !isPlain(node)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ("$value" in node) out.push({ path, node });
    else out.push(...leaves(node, path));
  }
  return out;
}

function nodeAt(tree: Json, path: string): Json | undefined {
  let cur: unknown = tree;
  for (const part of path.split(".")) {
    if (!isPlain(cur)) return undefined;
    cur = cur[part];
  }
  return isPlain(cur) ? cur : undefined;
}

function setAt(tree: Json, path: string, node: Json): void {
  const parts = path.split(".");
  let cur = tree;
  for (const part of parts.slice(0, -1)) {
    const next = cur[part];
    if (!isPlain(next)) {
      const made: Json = {};
      cur[part] = made;
      cur = made;
    } else cur = next;
  }
  cur[parts[parts.length - 1] ?? ""] = node;
}

export class Profile {
  readonly id: string;
  readonly name: { th: string; en: string };
  readonly description: string;
  readonly decisions: Record<string, string>;
  /** Semantic paths this profile overrides, in source order. */
  readonly overrides: readonly string[];
  /** Primitive paths this profile adds. */
  readonly ownPrimitives: readonly string[];
  /** The complete token set under this profile: base primitives plus own, semantic with overrides, base component. */
  readonly tokens: TokenSet;
  private readonly base: TokenSet;
  private readonly errors: string[] = [];

  constructor(base: BaseSources, source: ProfileSource) {
    this.id = source.$id;
    this.name = source.$name;
    this.description = source.$description;
    this.decisions = source.$decisions ?? {};
    this.base = new TokenSet(base.primitives, base.semantic, base.component);

    const primitives = clone(base.primitives);
    const own: string[] = [];
    for (const { path, node } of leaves(source.primitives ?? {})) {
      if (nodeAt(base.primitives, path)) {
        this.errors.push(
          `${source.$id}: primitive ${path} already exists in primitives.json; a profile adds primitives, never changes them`,
        );
      } else {
        setAt(primitives, path, clone(node));
        own.push(path);
      }
    }
    this.ownPrimitives = own;

    const semantic = clone(base.semantic);
    const overrides: string[] = [];
    for (const { path, node } of leaves(source.semantic)) {
      const target = nodeAt(semantic, path);
      const group = path.split(".")[0] ?? "";
      if (!target || !("$value" in target)) {
        this.errors.push(
          `${source.$id}: ${path} is not a semantic token; a profile overrides the contract, it does not extend it`,
        );
        continue;
      }
      if (target["$extensions"] && scopeOf(target) === "studio") {
        this.errors.push(
          `${source.$id}: ${path} is Studio-only; a profile never carries it (inside a boundary it renders as ${STUDIO_REMAP[path] ?? "its remap"})`,
        );
        continue;
      }
      if (LOCKED_GROUPS.includes(group)) {
        this.errors.push(
          `${source.$id}: ${path} is locked; ${group} semantics never change per profile (DESIGN.md §8)`,
        );
        continue;
      }
      if ("$type" in node && node["$type"] !== target["$type"]) {
        this.errors.push(
          `${source.$id}: ${path} is ${String(target["$type"])}, the override says ${String(node["$type"])}`,
        );
        continue;
      }
      target["$value"] = clone(node["$value"]);
      overrides.push(path);
    }
    this.overrides = overrides;
    this.tokens = new TokenSet(primitives, semantic, base.component);
  }

  /** The base token of an overridden path, for diffs. */
  baseToken(path: string): Token | undefined {
    return this.base.get("semantic", path);
  }

  /** Resolved value of a semantic path under this profile and under the base, for one mode. */
  diff(path: string, mode: Mode): { base: unknown; profile: unknown } | undefined {
    const b = this.base.get("semantic", path);
    const p = this.tokens.get("semantic", path);
    if (!b || !p) return undefined;
    return { base: this.base.resolve(b, mode).value, profile: this.tokens.resolve(p, mode).value };
  }

  /** Profile rules, then the layer rules of the merged set. Empty array means valid. */
  validate(): string[] {
    const errors = [...this.errors];
    if (!ID.test(this.id)) errors.push(`profile id "${this.id}" must match ${ID}`);
    if (this.id === "neutral") errors.push("neutral is the base, not a profile file");
    if (!this.name?.th || !this.name?.en) errors.push(`${this.id}: $name needs th and en`);
    for (const [key, value] of Object.entries(this.decisions)) {
      const allowed = DECISIONS[key];
      if (!allowed)
        errors.push(
          `${this.id}: unknown decision "${key}"; known: ${Object.keys(DECISIONS).join(", ")}`,
        );
      else if (!allowed.includes(value))
        errors.push(`${this.id}: ${key} "${value}" is not one of ${allowed.join(", ")}`);
    }
    for (const key of ["shape", "surfaceTreatment"]) {
      if (!(key in this.decisions)) errors.push(`${this.id}: decision ${key} is required`);
    }
    if (this.overrides.length === 0) errors.push(`${this.id}: overrides nothing`);
    for (const t of this.base.layer("semantic")) {
      if (t.scope === "identity" && !this.overrides.includes(t.path))
        errors.push(
          `${this.id}: ${t.path} carries ORIVILO's identity and must be overridden by every profile (DESIGN.md §9 item 10)`,
        );
      if (t.scope === "studio" && !STUDIO_REMAP[t.path])
        errors.push(`${t.path} is Studio-scoped but has no entry in STUDIO_REMAP`);
    }
    for (const path of this.overrides) {
      const token = this.tokens.get("semantic", path);
      if (!token) continue;
      for (const ref of this.tokens.refsOf(token)) {
        if (!this.tokens.get("primitive", ref))
          errors.push(`${this.id}: ${path} references unknown primitive ${ref}`);
      }
    }
    errors.push(...this.tokens.validate().map((e) => `${this.id}: ${e}`));
    errors.push(...this.checkDecisions());
    return errors;
  }

  /** Decisions the tokens must agree with. */
  private checkDecisions(): string[] {
    const out: string[] = [];
    const px = (path: string): number => {
      const t = this.tokens.get("semantic", path);
      const v = t ? String(this.tokens.resolve(t, "light").value) : "";
      return Number.parseFloat(v);
    };
    const control = px("shape.control.radius");
    const container = px("shape.container.radius");
    switch (this.decisions["shape"]) {
      case "crisp":
        if (!(control <= 8 && container <= 12))
          out.push(
            `${this.id}: shape crisp needs control radius <= 8 and container <= 12, got ${control} and ${container}`,
          );
        break;
      case "rounded":
        if (!(control >= 999 && container >= 12 && container <= 16))
          out.push(
            `${this.id}: shape rounded needs pill controls and container 12 to 16, got ${control} and ${container}`,
          );
        break;
      case "soft":
        if (!(control >= 999 && container >= 20))
          out.push(
            `${this.id}: shape soft needs pill controls and container >= 20, got ${control} and ${container}`,
          );
        break;
    }
    const card = this.tokens.get("semantic", "border.card");
    const cardLight = card ? String(this.tokens.resolve(card, "light").value) : "";
    if (this.decisions["surfaceTreatment"] === "flat" && cardLight !== "transparent")
      out.push(
        `${this.id}: surfaceTreatment flat needs border.card transparent in light, got ${cardLight}`,
      );
    if (this.decisions["surfaceTreatment"] === "bordered" && cardLight === "transparent")
      out.push(`${this.id}: surfaceTreatment bordered needs a visible border.card in light`);
    return out;
  }

  /**
   * CSS for the profile: own primitives and overridden semantic tokens, declared on the boundary
   * element for each mode. Both selectors have specificity 0,2,0, above the base blocks (0,1,0),
   * so a profile wins inside its boundary whatever the source order. A boundary always carries both
   * `data-design-profile` and `data-mode` (DesignProfileBoundary sets them together).
   */
  /** Studio-scoped tokens and the profile token each one renders as, for diffs and docs. */
  get studioRemaps(): [string, string][] {
    return this.base
      .layer("semantic")
      .filter((t) => t.scope === "studio")
      .map((t) => [t.path, STUDIO_REMAP[t.path] ?? ""]);
  }

  emitCss(): string {
    const blocks: string[] = [];
    const remap = this.studioRemaps.map(([from, to]) => {
      const f = this.tokens.get("semantic", from);
      const t = this.tokens.get("semantic", to);
      if (!f || !t) throw new Error(`studio remap ${from} to ${to}: token missing`);
      return `${TokenSet.cssVar(f)}: var(${TokenSet.cssVar(t)});`;
    });
    for (const mode of MODES) {
      const lines: string[] = [];
      for (const path of this.ownPrimitives) {
        const t = this.tokens.get("primitive", path);
        if (t) lines.push(...this.tokens.declarations(t, t.raw));
      }
      for (const path of this.overrides) {
        const t = this.tokens.get("semantic", path);
        if (!t) continue;
        const raw = t.raw;
        const value = isModeValue(raw) ? raw[mode] : raw;
        lines.push(...this.tokens.declarations(t, value));
      }
      lines.push(...remap);
      const body = lines.map((l) => `  ${l}`).join("\n");
      if (mode === "light") {
        blocks.push(`[data-design-profile="${this.id}"]:not([data-mode="dark"]) {\n${body}\n}`);
      } else {
        blocks.push(`[data-design-profile="${this.id}"][data-mode="dark"] {\n${body}\n}`);
        blocks.push(
          `@media (prefers-color-scheme: dark) {\n  [data-design-profile="${this.id}"][data-mode="system"] {\n${lines.map((l) => `    ${l}`).join("\n")}\n  }\n}`,
        );
      }
    }
    return [
      `/* Profile ${this.id}: ${this.name.en} (${this.name.th}). ${this.overrides.length} overrides, ${this.ownPrimitives.length} own primitives. */`,
      ...blocks,
    ].join("\n");
  }
}

function scopeOf(node: Json): string | undefined {
  const ext = node["$extensions"] as { orivilo?: { scope?: string } } | undefined;
  return ext?.orivilo?.scope;
}

function isModeValue(value: unknown): value is Record<Mode, unknown> {
  return isPlain(value) && "light" in value && "dark" in value;
}

/** Header plus every profile, in the order given. */
export function emitProfilesCss(profiles: readonly Profile[]): string {
  return [
    "/* Generated from src/profiles/source/*.json by scripts/build-tokens.ts. Do not edit. */",
    "/* Each profile overrides semantic values inside its boundary; component tokens are re-declared",
    " * on [data-design-profile] by generated.css, so they resolve against these values. */",
    "",
    ...profiles.map((p) => p.emitCss()),
    "",
  ].join("\n");
}

export type { Layer, Mode, Token };
export { flatten, refTarget };
