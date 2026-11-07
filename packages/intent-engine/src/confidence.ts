// Every number below is copied from ORV-128 spec "Confidence" (the table, "The floor", industry-margin-1).
export const CONFIDENCE_VERSION = "confidence-1";
export const EVIDENCE_FLOOR = 0.5; // owner decision D3

export const CONFIDENCE_BASES = {
  measure: 1.0,
  "rule-reading": 0.7,
  "model-reading": 0.7,
} as const;

export const CONFIDENCE_FACTORS = {
  "few-words": 0.7,
  "image-blurred": 0.6,
  "image-small": 0.5,
  "page-incomplete": 0.7,
  "single-signal": 0.8,
  "tool-default": 0,
} as const; // keys in ascending order

export type BaseId = keyof typeof CONFIDENCE_BASES;
export type FactorId = keyof typeof CONFIDENCE_FACTORS;
/** The ids as tuples, so a zod enum can read them; the cast is safe because the keys are the tables' own. */
export const BASE_IDS = Object.keys(CONFIDENCE_BASES) as [BaseId, ...BaseId[]];
export const FACTOR_IDS = Object.keys(CONFIDENCE_FACTORS) as [FactorId, ...FactorId[]];

/** What an item stores: the number and the trace of the numbers it came from. */
export type Confidence = {
  value: number;
  base: { id: BaseId; value: number };
  factors: { id: FactorId; value: number }[];
};

/** Thousandths, as an integer: the one place a confidence or a lean threshold becomes comparable (thousandths-1). */
export const milli = (x: number): number => Math.round(x * 1000);

/** thousandths-1: sort and dedupe the factors, multiply, round, compare the floor in thousandths. */
export function scoreConfidence(
  base: BaseId,
  factors: readonly FactorId[],
): { confidence: Confidence; belowFloor: boolean } {
  const ids = [...new Set(factors)].sort();
  const baseValue = CONFIDENCE_BASES[base];
  const product = ids.reduce((p, id) => p * CONFIDENCE_FACTORS[id], baseValue as number);
  const value = milli(product) / 1000;
  return {
    confidence: {
      value,
      base: { id: base, value: baseValue },
      factors: ids.map((id) => ({ id, value: CONFIDENCE_FACTORS[id] })),
    },
    belowFloor: milli(value) < milli(EVIDENCE_FLOOR),
  };
}

/** industry-margin-1: compared in thousandths; the margin is the rule's, never an argument. */
export const INDUSTRY_MARGIN_MILLI = 100;
export const withinMargin = (a: number, b: number): boolean =>
  Math.abs(milli(a) - milli(b)) <= INDUSTRY_MARGIN_MILLI;
