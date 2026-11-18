"use client";

import type { BusinessFieldId, BusinessNote, BusinessView } from "@orivilo/intent-engine";
import { Badge, SectionHeader } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import type { Messages } from "../i18n/messages/index";
import { FIELD_NOTE, fieldLabel, nodeTitle, questionText } from "./business-text";

/**
 * One business node as a reading surface (ORV-281 design section 5): its state as a neutral word,
 * each field with the person's words and the label that says how they got here, and the questions
 * still to ask. Slice 1 only: no reading, no AI line, no confidence note. Every value from a person
 * is a text node inside `bdi`, `whitespace-pre-wrap` so a line break stays, never HTML and never a
 * link (spec row 16).
 */
export type BusinessNodeData = BusinessView["nodes"][number];

export interface BusinessNodeViewProps {
  node: BusinessNodeData;
  /** Slice 1 draws the node's own level 2 heading; a surface that titles the node itself passes false. */
  heading?: boolean | undefined;
}

/** `audience`, `competitive-frame` and `positioning` show a field with no answer as skipped, the rest as empty. */
const SKIPPABLE: readonly BusinessNodeData["id"][] = [
  "audience",
  "competitive-frame",
  "positioning",
];

/** The field each note of `honest-business-1` sits under. */
const NOTE_AT: Record<BusinessNote, BusinessFieldId> = {
  "business.industry.awaitingTaxonomy": "situation.industry",
  "business.website.notRead": "situation.website",
  "business.competitors.coloursNotRead": "competitive-frame.alternatives",
};

function noteText(m: Messages, note: BusinessNote): string {
  switch (note) {
    case "business.industry.awaitingTaxonomy":
      return m.business.industry.awaitingTaxonomy;
    case "business.website.notRead":
      return m.business.website.notRead;
    case "business.competitors.coloursNotRead":
      return m.business.competitors.coloursNotRead;
  }
}

export function BusinessNodeView({ node, heading = true }: BusinessNodeViewProps) {
  const m = useMessages();
  const empty = SKIPPABLE.includes(node.id) ? m.business.state.skipped : m.business.state.empty;
  return (
    <div className="@container flex min-w-0 flex-col gap-6" data-node={node.id}>
      {heading ? (
        <SectionHeader
          level={2}
          title={nodeTitle(m, node.id)}
          description={node.gate ? m.business.state.gate : undefined}
        />
      ) : null}
      <div>
        <Badge variant="neutral" size="sm">
          {m.business.state[node.state]}
        </Badge>
      </div>
      <div className="flex flex-col gap-6">
        {node.fields.map((f) => (
          <div key={f.field} className="flex min-w-0 flex-col gap-1" data-field={f.field}>
            <h3 className="text-label-md">{fieldLabel(m, f.field)}</h3>
            {f.answer === null ? (
              <p className={FIELD_NOTE}>{empty}</p>
            ) : (
              <>
                <p className="whitespace-pre-wrap">
                  <bdi>{f.answer.text}</bdi>
                </p>
                <p className={FIELD_NOTE}>{m.business.label.yourWords}</p>
              </>
            )}
            {node.notes
              .filter((note) => NOTE_AT[note] === f.field)
              .map((note) => (
                <p key={note} className={FIELD_NOTE}>
                  {noteText(m, note)}
                </p>
              ))}
          </div>
        ))}
      </div>
      {node.stillToAsk.length === 0 ? null : (
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-label-md">{m.business.stillToAsk}</h3>
          <ul className="flex flex-col gap-2">
            {node.stillToAsk.map((id) => (
              <li key={id}>{questionText(m, id)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
