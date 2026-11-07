import type { ChromaticFamily } from "./color-audit";
import { milli } from "./confidence";
import type { RULE_VALUES } from "./interpreter";

export type RuleValue = (typeof RULE_VALUES)[keyof typeof RULE_VALUES];

/** value-to-lean-1: the one value whose reading is a rule hypothesis ("not too", hypothesis-flag-1). */
const NOT_TOO_VALUE = 40;
const NOT_TOO_NOTE =
  "lean rule value-to-lean-1: 'not too' asks for a little, not none, and is read as low";

/** value-to-lean-1: a value above 50 is high, below 50 is low; no RULE_VALUES entry is 50. */
export function leanOfValue(value: RuleValue): {
  lean: "high" | "low";
  hypothesis: boolean;
  note: string | null;
} {
  const hypothesis = value === NOT_TOO_VALUE;
  return { lean: value > 50 ? "high" : "low", hypothesis, note: hypothesis ? NOT_TOO_NOTE : null };
}

/** measure-to-lean-1: the ORV-20 hue bands that count as warm. */
export const WARM_BANDS: readonly ChromaticFamily[] = ["red", "orange", "yellow"];
/** measure-to-lean-1: warm share of 0.5 or more gives warm high, in thousandths. */
export const WARM_HIGH_MILLI = 500;
/** measure-to-lean-1: mean OKLCH chroma of 0.10 or more gives expressive high, in thousandths. */
export const EXPRESSIVE_HIGH_MILLI = 100;
/** measure-to-lean-1: mean OKLCH chroma of 0.02 or less gives expressive low, in thousandths. */
export const EXPRESSIVE_LOW_MILLI = 20;

export type MeasuredLean = {
  axis: "warm" | "expressive";
  lean: "high" | "low";
  metric: "warm-share" | "chroma";
  hypothesis: true;
  note: string;
};

/** measure-to-lean-1: thresholds compared with milli() under thousandths-1; every result a hypothesis. */
export function leansOfMeasures(m: { warmShare: number; meanChroma: number }): MeasuredLean[] {
  const out: MeasuredLean[] = [];
  if (milli(m.warmShare) >= WARM_HIGH_MILLI) {
    out.push({
      axis: "warm",
      lean: "high",
      metric: "warm-share",
      hypothesis: true,
      note: "lean rule measure-to-lean-1: warm share of 0.5 or more in red, orange and yellow is read as warm high",
    });
  }
  const chroma = milli(m.meanChroma);
  if (chroma >= EXPRESSIVE_HIGH_MILLI || chroma <= EXPRESSIVE_LOW_MILLI) {
    const high = chroma >= EXPRESSIVE_HIGH_MILLI;
    out.push({
      axis: "expressive",
      lean: high ? "high" : "low",
      metric: "chroma",
      hypothesis: true,
      note: high
        ? "lean rule measure-to-lean-1: mean chroma of 0.10 or more is read as expressive high"
        : "lean rule measure-to-lean-1: mean chroma of 0.02 or less is read as expressive low",
    });
  }
  return out;
}
