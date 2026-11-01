"use client";

import { useMessages } from "../../i18n/LocaleProvider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../collapsible/Collapsible";
import { EvidenceQuote } from "../evidence-span/EvidenceQuote";
import { countLabel, type EvidenceItem, spanOf } from "../evidence-span/span";

export interface EvidenceListProps {
  /** Every item of the reading; those without a usable quote are counted out and not listed. */
  items: readonly EvidenceItem[];
  /** The open state when the caller holds it. Pair it with `onOpenChange`. */
  open?: boolean | undefined;
  /** The open state at first render when the component holds it. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

/**
 * The quotes a reading drew on, behind one count (catalog `application/evidence-list`), on our
 * Collapsible: closed by default, the trigger, its icon swap and the fade are Collapsible's. With
 * no usable quote the trigger is replaced by plain text that says so.
 */
export function EvidenceList({
  items,
  open,
  defaultOpen = false,
  onOpenChange,
}: EvidenceListProps) {
  const m = useMessages();
  const quoted = items.flatMap((item) => {
    const quote = spanOf(item);
    return quote === null ? [] : [{ item, quote }];
  });
  if (quoted.length === 0) {
    return (
      <div className="ds-evidence-list">
        <p className="ds-evidence-list__missing">{m.evidence.missing}</p>
      </div>
    );
  }
  return (
    <Collapsible
      className="ds-evidence-list"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <CollapsibleTrigger>{countLabel(m, quoted.length)}</CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ds-evidence-list__items">
          {quoted.map(({ item, quote }) => (
            <li key={item.id}>
              <EvidenceQuote quote={quote} fromModel={item.fromModel} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
