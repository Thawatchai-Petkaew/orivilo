import component from "./source/component.json" with { type: "json" };
import primitives from "./source/primitives.json" with { type: "json" };
import semantic from "./source/semantic.json" with { type: "json" };
import { TokenSet } from "./model.ts";

/** The one token set, built from the three source files. */
export const tokens = new TokenSet(primitives, semantic, component);
export { TokenSet, MODES, LAYERS, REFERENCES, displayValue, cssLiteral } from "./model.ts";
export type { Token, TokenScope, Layer, Mode, Resolved, ContrastRule } from "./model.ts";
