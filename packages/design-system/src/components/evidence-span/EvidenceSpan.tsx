"use client";

import { type ReactNode, useId } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/Popover";
import { EvidenceQuote } from "./EvidenceQuote";
import { CARD_GUTTER, type EvidenceItem, spanOf } from "./span";

export interface EvidenceSpanProps {
  /** The fact the evidence belongs to, in the caller's words. */
  children: ReactNode;
  /** The evidence of the fact; undefined, or without a usable quote, shows "no evidence". */
  item: EvidenceItem | undefined;
  /** The open state when the caller holds it. Pair it with `onOpenChange`. */
  open?: boolean | undefined;
  /** The open state at first render when the component holds it. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

/**
 * A fact followed by a pill that opens a card with the words of the brief it came from and whether
 * a rule or an AI model read them (catalog `application/evidence-span`). It opens on a press
 * only; the dialog wiring, Escape and focus return are our Popover's. A fact with no usable quote
 * is followed by plain text that says so. The pill is named with its label, then the fact, so a
 * list of buttons tells the facts apart (SC 2.5.3).
 */
export function EvidenceSpan({
  children,
  item,
  open,
  defaultOpen = false,
  onOpenChange,
}: EvidenceSpanProps) {
  const m = useMessages();
  const labelId = useId();
  const factId = useId();
  const quote = spanOf(item);
  if (item === undefined || quote === null) {
    return (
      <span className="ds-evidence-span">
        {children}
        <span className="ds-evidence-span__missing">{m.evidence.missing}</span>
      </span>
    );
  }
  return (
    <span className="ds-evidence-span">
      <span id={factId}>{children}</span>
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <span className="ds-tag ds-evidence-span__trigger" data-size="sm">
          <PopoverTrigger>
            <button type="button" className="ds-tag__main" aria-labelledby={`${labelId} ${factId}`}>
              <span className="ds-tag__label" id={labelId}>
                {m.evidence.trigger}
              </span>
            </button>
          </PopoverTrigger>
        </span>
        <PopoverContent
          className="ds-evidence-card"
          aria-label={m.evidence.cardLabel}
          collisionPadding={CARD_GUTTER}
        >
          <EvidenceQuote quote={quote} fromModel={item.fromModel} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
