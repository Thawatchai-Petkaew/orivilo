"use client";

import { useMessages } from "../../i18n/LocaleProvider";

/**
 * A quote of the brief and the line that says who read it (ORV-211 `ev-card-1`): the card of an
 * EvidenceSpan and each row of an EvidenceList. Not exported from the package. The quote is a
 * text child, so markup in it shows as characters (`ev-text-1`).
 */
export function EvidenceQuote({ quote, fromModel }: { quote: string; fromModel: boolean }) {
  const m = useMessages();
  return (
    <>
      <blockquote className="ds-evidence-quote__text">{quote}</blockquote>
      <p className="ds-evidence-quote__meta">
        {fromModel ? m.evidence.sourceByModel : m.evidence.sourceByRule}
      </p>
    </>
  );
}
