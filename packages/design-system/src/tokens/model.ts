/**
 * Token model: reads the three DTCG-style source files (primitives, semantic, component), resolves
 * references, enforces the layer rule from DESIGN.md §5, and emits the CSS custom properties plus
 * the Tailwind theme block. Pure TypeScript: used by the build script, the tests, and Storybook.
 */

export type Layer = "primitive" | "semantic" | "component";
export type Mode = "light" | "dark";
export const MODES: readonly Mode[] = ["light", "dark"];
export const LAYERS: readonly Layer[] = ["primitive", "semantic", "component"];

export interface ContrastRule {
  against: string;
  floor: number | null;
}

export interface Token {
  path: string;
  layer: Layer;
  type: string;
  description: string | undefined;
  /** The raw `$value`: a literal, a `{reference}`, a `{ light, dark }` pair, or a composite object. */
  raw: unknown;
  contrast: ContrastRule | undefined;
}

export interface Resolved {
  /** Final literal value (string, number, or an object for composites such as typography). */
  value: unknown;
  /** Token paths followed to reach the value, nearest first. */
  chain: string[];
}

type Json = Record<string, unknown>;

const REF = /^\{([^}]+)\}$/;

export function refTarget(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = REF.exec(value);
  return m?.[1] ?? null;
}

function isModeValue(value: unknown): value is Record<Mode, unknown> {
  return typeof value === "object" && value !== null && "light" in value && "dark" in value;
}

/** Walks one source file and returns its tokens; keys starting with `$` are metadata. */
export function flatten(source: Json, layer: Layer, prefix = ""): Token[] {
  const out: Token[] = [];
  for (const [key, node] of Object.entries(source)) {
    if (key.startsWith("$") || typeof node !== "object" || node === null) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const n = node as Json;
    if ("$value" in n) {
      const ext = n["$extensions"] as { orivilo?: { contrast?: ContrastRule } } | undefined;
      out.push({
        path,
        layer,
        type: String(n["$type"] ?? "unknown"),
        description: typeof n["$description"] === "string" ? n["$description"] : undefined,
        raw: n["$value"],
        contrast: ext?.orivilo?.contrast,
      });
    } else {
      out.push(...flatten(n, layer, path));
    }
  }
  return out;
}

/** Each layer references only the layer below it (DESIGN.md §5). */
export const REFERENCES: Record<Layer, Layer | null> = {
  primitive: null,
  semantic: "primitive",
  component: "semantic",
};

export class TokenSet {
  readonly tokens: Token[];
  /** Keyed by `${layer}:${path}`; the same path may exist in two layers (opacity.disabled). */
  readonly byKey: Map<string, Token>;

  constructor(primitives: Json, semantic: Json, component: Json) {
    this.tokens = [
      ...flatten(primitives, "primitive"),
      ...flatten(semantic, "semantic"),
      ...flatten(component, "component"),
    ];
    this.byKey = new Map(this.tokens.map((t) => [`${t.layer}:${t.path}`, t]));
  }

  get(layer: Layer, path: string): Token | undefined {
    return this.byKey.get(`${layer}:${path}`);
  }

  layer(layer: Layer): Token[] {
    return this.tokens.filter((t) => t.layer === layer);
  }

  /** Resolves a token for a mode, following references down the layers to the literal value. */
  resolve(token: Token, mode: Mode): Resolved {
    const chain: string[] = [];
    const value = this.resolveValue(pickMode(token, mode), token.layer, mode, chain);
    return { value, chain };
  }

  private resolveValue(value: unknown, from: Layer, mode: Mode, chain: string[]): unknown {
    const target = refTarget(value);
    if (target) {
      const below = REFERENCES[from];
      const token = below ? this.get(below, target) : undefined;
      if (!token)
        throw new Error(`Unknown ${below ?? "no-layer"} token "${target}" referenced from ${from}`);
      chain.push(`${token.layer}:${token.path}`);
      return this.resolveValue(pickMode(token, mode), token.layer, mode, chain);
    }
    if (Array.isArray(value)) return value;
    if (typeof value === "object" && value !== null) {
      const out: Json = {};
      for (const [k, v] of Object.entries(value as Json))
        out[k] = this.resolveValue(v, from, mode, chain);
      return out;
    }
    return value;
  }

  /** Direct references of a token (one level), for the layer rule. */
  refsOf(token: Token): string[] {
    const refs: string[] = [];
    const walk = (v: unknown) => {
      const t = refTarget(v);
      if (t) refs.push(t);
      else if (typeof v === "object" && v !== null && !Array.isArray(v))
        Object.values(v as Json).forEach(walk);
    };
    walk(token.raw);
    return refs;
  }

  /** Layer rule and completeness checks. Empty array means the set is valid. */
  validate(): string[] {
    const errors: string[] = [];
    for (const token of this.tokens) {
      const below = REFERENCES[token.layer];
      for (const ref of this.refsOf(token)) {
        if (!below) {
          errors.push(`${token.path} is a primitive and may not reference ${ref}; DESIGN.md §5`);
        } else if (!this.get(below, ref)) {
          const elsewhere = LAYERS.find((l) => this.get(l, ref));
          errors.push(
            elsewhere
              ? `${token.path} (${token.layer}) may not reference ${ref} (${elsewhere}); ${token.layer} references ${below} only, DESIGN.md §5`
              : `${token.path} references unknown ${below} token ${ref}`,
          );
        }
      }
      if (token.layer === "semantic" && token.type === "color" && !isModeValue(token.raw)) {
        errors.push(`${token.path} needs a light and a dark value`);
      }
      if (token.layer !== "semantic" && isModeValue(token.raw)) {
        errors.push(`${token.path}: only semantic tokens carry modes`);
      }
      if (token.contrast && !this.get("semantic", token.contrast.against)) {
        errors.push(`${token.path} contrast pair ${token.contrast.against} does not exist`);
      }
    }
    return errors;
  }

  // ---- CSS ----

  static cssVar(token: Pick<Token, "path" | "layer">): string {
    const prefix = { primitive: "--op", semantic: "--ds", component: "--cmp" }[token.layer];
    return `${prefix}-${token.path.replaceAll(".", "-")}`;
  }

  /** CSS text for a literal or a reference (`var(--…)`). Composite tokens expand to several lines. */
  private cssDeclarations(token: Token, value: unknown): string[] {
    const name = TokenSet.cssVar(token);
    const below = REFERENCES[token.layer];
    const target = refTarget(value);
    if (target) {
      const t = below ? this.get(below, target) : undefined;
      if (!t) throw new Error(`Unknown token ${target}`);
      if (t.type === "typography") {
        return TYPO_PARTS.map(([part]) => `${name}-${part}: var(${TokenSet.cssVar(t)}-${part});`);
      }
      return [`${name}: var(${TokenSet.cssVar(t)});`];
    }
    if (token.type === "typography" && typeof value === "object" && value !== null) {
      const v = value as Json;
      return TYPO_PARTS.map(([part, key]) => {
        const sub = v[key];
        const subTarget = refTarget(sub);
        const subToken = subTarget && below ? this.get(below, subTarget) : undefined;
        return `${name}-${part}: ${subToken ? `var(${TokenSet.cssVar(subToken)})` : cssLiteral(sub, token.type)};`;
      });
    }
    return [`${name}: ${cssLiteral(value, token.type)};`];
  }

  emitCss(): string {
    const light: string[] = [];
    const dark: string[] = [];
    const component: string[] = [];
    for (const token of this.tokens) {
      if (token.layer === "component") {
        component.push(...this.cssDeclarations(token, token.raw));
      } else if (isModeValue(token.raw)) {
        light.push(...this.cssDeclarations(token, token.raw.light));
        dark.push(...this.cssDeclarations(token, token.raw.dark));
      } else {
        light.push(...this.cssDeclarations(token, token.raw));
      }
    }
    const theme: string[] = [];
    for (const token of this.layer("semantic")) {
      const v = `var(${TokenSet.cssVar(token)})`;
      const slug = token.path.replaceAll(".", "-");
      if (token.type === "color") theme.push(`--color-${slug}: ${v};`);
      if (token.path.startsWith("shape.") && token.path.endsWith(".radius")) {
        theme.push(`--radius-${token.path.split(".")[1]}: ${v};`);
      }
      if (token.path.startsWith("font.")) theme.push(`--font-${token.path.split(".")[1]}: ${v};`);
      if (token.type === "typography") {
        const base = `var(${TokenSet.cssVar(token)}`;
        theme.push(
          `--text-${slug.replace(/^type-/, "")}: ${base}-font-size);`,
          `--text-${slug.replace(/^type-/, "")}--line-height: ${base}-line-height);`,
          `--text-${slug.replace(/^type-/, "")}--font-weight: ${base}-font-weight);`,
          `--text-${slug.replace(/^type-/, "")}--letter-spacing: ${base}-letter-spacing);`,
        );
      }
      if (token.path === "elevation.overlay") theme.push(`--shadow-overlay: ${v};`);
      if (token.path === "elevation.glass.blur") theme.push(`--blur-glass: ${v};`);
      if (token.path === "motion.easing") theme.push(`--ease-ds: ${v};`);
    }
    const indent = (lines: string[]) => lines.map((l) => `  ${l}`).join("\n");
    return [
      "/* Generated from src/tokens/source/*.json by scripts/build-tokens.ts. Do not edit. */",
      "",
      "/* Primitives (--op-*) and semantic light (--ds-*) */",
      ':root,\n[data-mode="light"] {',
      "  color-scheme: light;",
      indent(light),
      "}",
      "",
      "/* Semantic dark: a remap by role, not an inversion (DESIGN.md §3.2) */",
      '[data-mode="dark"] {',
      "  color-scheme: dark;",
      indent(dark),
      "}",
      "",
      "/* Component tokens (--cmp-*) reference semantic names. A custom property is computed where it is",
      " * declared, so they are declared again on every boundary that remaps the semantic layer (mode",
      " * or profile); otherwise a dark boundary would inherit light component values from :root. */",
      ":root,\n[data-mode],\n[data-design-profile] {",
      indent(component),
      "}",
      "",
      "/* Tailwind utilities resolve to semantic tokens only (DESIGN.md §5). The defaults are removed first",
      " * so a raw palette or default radius class produces no CSS. */",
      "@theme inline {",
      "  --color-*: initial;",
      "  --radius-*: initial;",
      "  --shadow-*: initial;",
      "  --font-*: initial;",
      "  --text-*: initial;",
      indent(theme),
      "}",
      "",
    ].join("\n");
  }
}

function pickMode(token: Token, mode: Mode): unknown {
  return isModeValue(token.raw) ? token.raw[mode] : token.raw;
}

const TYPO_PARTS: readonly [string, string][] = [
  ["font-family", "fontFamily"],
  ["font-size", "fontSize"],
  ["line-height", "lineHeight"],
  ["font-weight", "fontWeight"],
  ["letter-spacing", "letterSpacing"],
];

export function cssLiteral(value: unknown, type: string): string {
  if (Array.isArray(value)) {
    if (type === "cubicBezier") return `cubic-bezier(${value.join(", ")})`;
    return value.map((f) => (/\s/.test(String(f)) ? `"${f}"` : String(f))).join(", ");
  }
  if (typeof value === "number") return String(value);
  return String(value);
}

/** Human form of a resolved value for the Foundations pages. */
export function displayValue(value: unknown, type: string): string {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const v = value as Json;
    if (type === "typography") {
      const fam = Array.isArray(v["fontFamily"])
        ? String(v["fontFamily"][0])
        : String(v["fontFamily"]);
      return `${fam} ${String(v["fontSize"])} / ${String(v["lineHeight"])}, ${String(v["fontWeight"])}${v["letterSpacing"] && v["letterSpacing"] !== "0em" ? `, ${String(v["letterSpacing"])}` : ""}`;
    }
    return JSON.stringify(v);
  }
  return cssLiteral(value, type);
}
