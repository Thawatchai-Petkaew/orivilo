import type { Interpretation } from "@orivilo/intent-engine";
import type { WebMessages } from "../../i18n/messages";
import { errorLine, failureLines } from "../../i18n/wait";
import type { Outcome } from "./actions";

/** What the page does with one AI reading call (ORV-62, ORV-112). */
export type ReadingResult =
  /** Checked reading, with the seal to keep for it. */
  | { reading: Interpretation; seal: string }
  /** A refusal by a rate limit or a spent AI budget: said in the studio, under the button, and not in the card. */
  | { notice: string }
  /**
   * AI could not read. `cardLines` is a setup problem's own words (and its reference when it has
   * one), or null for a plain failure.
   */
  | { reading: null; cardLines: string[] | null };

export function readingResult(
  result: Outcome<{ reading: Interpretation; seal: string }>,
  errors: WebMessages["saved"]["errors"],
  wait: WebMessages["wait"],
  failure: WebMessages["failure"],
): ReadingResult {
  if (result.ok) return { reading: result.value.reading, seal: result.value.seal };
  if (result.error === "ai-rate-limited" || result.error === "rate-limited") {
    return { notice: errorLine(errors, wait, result.error, result.retryAfter) };
  }
  if (result.error === "ai-spend-cap") return { notice: errors["ai-spend-cap"] };
  return {
    reading: null,
    cardLines:
      result.error === "ai-failed" ? null : failureLines({ errors, wait, failure }, result),
  };
}
