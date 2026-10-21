import component from "./source/component.json";
import primitives from "./source/primitives.json";
import semantic from "./source/semantic.json";
import { TokenSet } from "./model.ts";

/** The one token set, built from the three source files. */
export const tokens = new TokenSet(primitives, semantic, component);
export { TokenSet, MODES, LAYERS, REFERENCES, displayValue, cssLiteral } from "./model.ts";
export type { Token, Layer, Mode, Resolved, ContrastRule } from "./model.ts";
