import type { FoundationFieldKey } from "@orivilo/intent-engine";
import type { ReactNode } from "react";
import { useMessages } from "../i18n/LocaleProvider";
import { FIELD_NOTE, foundationFieldLabel } from "./business-text";

/**
 * The two parts the brand expression views share (ORV-298 design section 4.1). Words only: no badge,
 * chip, swatch or icon carries a value, and the brand accent marks nothing. Every string reaches
 * these parts already resolved from the catalog; a value is a word the engine's key gave.
 */

/**
 * One decision as text: the field name, the value word in the primary ink, each reason and the rule
 * line in the secondary note. The decision reads first and the why under it. `reasons` is a list
 * because Logo type can show two (design section 7). `children` are further lines of the decision
 * between its reasons and its rule: Logo type's name length line (design 7.2).
 */
export function DecisionLine({
  field,
  value,
  reasons,
  rule,
  children,
}: {
  field: FoundationFieldKey;
  value: string;
  reasons: readonly string[];
  rule: string;
  children?: ReactNode;
}) {
  const m = useMessages();
  return (
    <div className="flex min-w-0 flex-col gap-1" data-field={field}>
      <h3 className="self-start text-label-md">{foundationFieldLabel(m, field)}</h3>
      <p data-value>{value}</p>
      {reasons.map((reason) => (
        <p key={reason} className={FIELD_NOTE}>
          {reason}
        </p>
      ))}
      {children}
      <p className={FIELD_NOTE} data-rule>
        {rule}
      </p>
    </div>
  );
}

/**
 * `business.label.byRule`: the decisions above were worked out by fixed rules, not by AI. Once per
 * view with a decision (`expression-honest-1`); the caller places it first in the labels block.
 */
export function ByRuleLabel() {
  const m = useMessages();
  return <p className={FIELD_NOTE}>{m.business.label.byRule}</p>;
}
