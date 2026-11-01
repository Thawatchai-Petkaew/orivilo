import type { InputEvidence } from "@orivilo/intent-engine";
import { fill, type Messages } from "../../i18n/messages/index";

/**
 * One fact's evidence, as the engine states it (ORV-211 `ev-item-1`): the quote is
 * `observation.quote`, the locator `source.locator`, the basis `fromModel`, the key `id`.
 * `inputKind` is narrowed to the brief, so a website or photo item cannot be passed. No other
 * field is read.
 */
export type EvidenceItem = Pick<InputEvidence, "id" | "source" | "observation" | "fromModel"> & {
  inputKind: "brief-text";
};

/**
 * The side gutter the card keeps from the screen edge, as Radix's `collisionPadding`. This is
 * `space.gutter` (`semantic.json`, 16 px) as a number; `span.test.ts` fails when they differ.
 */
export const CARD_GUTTER = 16;

/**
 * The quote to show, or `null` for a missing span: no item, no quote, a locator that is not text,
 * or a quote of white space only. A quote it returns is not trimmed (`ev-span-1`).
 */
export function spanOf(item: EvidenceItem | undefined): string | null {
  if (!item) return null;
  const quote = item.observation.quote;
  if (quote === undefined || item.source.locator.kind !== "text" || quote.trim() === "") {
    return null;
  }
  return quote;
}

/** The count of quotes, with the singular form for one (`ev-count-1`). */
export function countLabel(m: Messages, count: number): string {
  return count === 1 ? m.evidence.countOne : fill(m.evidence.count, { count });
}
