// Type fixtures for `orv158-type` (ORV-158): each value has one defect, and its directive fails
// `pnpm typecheck` as unused (TS2578) if the type stops catching that defect. Never imported.
import { CLASSIFICATION as C, type Classification } from "./classification.ts";

/** A copy without one key, typed as such. */
const omit = <T extends object, K extends keyof T>(value: T, key: K) =>
  Object.fromEntries(Object.entries(value).filter(([name]) => name !== key)) as Omit<T, K>;

export const t1 = {
  ...C,
  // @ts-expect-error T1: a column of a table has no entry
  rateLimitCounter: omit(C.rateLimitCounter, "count"),
} satisfies Classification;

export const t2 = {
  ...C,
  rateLimitCounter: {
    ...C.rateLimitCounter,
    // @ts-expect-error T2: an entry names a column the table does not have
    hits: "internal",
  },
} satisfies Classification;

export const t3 = {
  ...C,
  rateLimitCounter: {
    ...C.rateLimitCounter,
    // @ts-expect-error T3: an entry's value is not in the closed tag list
    count: "confidential",
  },
} satisfies Classification;

// @ts-expect-error T4: a table exported by the barrel has no entry
export const t4 = omit(C, "rateLimitCounter") satisfies Classification;

export const t5 = {
  ...C,
  // @ts-expect-error T5: an entry names a table the barrel does not export
  ghost: { id: "internal" },
} satisfies Classification;
