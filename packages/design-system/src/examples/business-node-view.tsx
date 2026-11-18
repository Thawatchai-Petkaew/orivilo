"use client";

import {
  BUSINESS_FIELDS,
  type BusinessFieldId,
  type BusinessNote,
  type BusinessView,
} from "@orivilo/intent-engine";
import { SectionHeader } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import type { Messages } from "../i18n/messages/index";
import { FIELD_NOTE, fieldLabel, nodeTitle, questionText } from "./business-text";

/**
 * One business node as a reading surface (ORV-281 design section 5, row D1): its state as a line
 * of text under the heading, each field with the person's words and the label that says how they
 * got here, and the questions still to ask. Slice 1 only: no reading, no AI line, no confidence
 * note. Every value from a person is a text node inside `bdi`, `whitespace-pre-wrap` so a line break
 * stays, never HTML and never a link (spec row 16).
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

/**
 * Fields no answer can fill: only a reading can (`business-fields-1`, source `reading`). With no
 * reading in slice 1 they are never a skip by the person, so they read as nothing given yet.
 */
const READING_ONLY: readonly BusinessFieldId[] = BUSINESS_FIELDS.filter(
  (f) => f.source === "reading",
).map((f) => f.id);

export function BusinessNodeView({ node, heading = true }: BusinessNodeViewProps) {
  const m = useMessages();
  const fallback = SKIPPABLE.includes(node.id) ? m.business.state.skipped : m.business.state.empty;
  /** A reading-only field is a skip only when the whole node is skipped. */
  const emptyOf = (field: BusinessFieldId): string =>
    READING_ONLY.includes(field) && node.state !== "skipped" ? m.business.state.empty : fallback;
  return (
    <div className="@container min-w-0" data-node={node.id}>
      {/* One column; at 960 and over (the viewer at 1440) the state and fields take the first
          column and the questions still to ask the second, top aligned with the state (design 5).
          The state sits 8 under the heading and 24 above the first field (row D1). */}
      <div className="flex flex-col gap-2 @min-[960px]:grid @min-[960px]:grid-cols-[minmax(0,42rem)_minmax(0,20rem)] @min-[960px]:items-start @min-[960px]:gap-x-12">
        {heading ? (
          <div className="@min-[960px]:col-span-full">
            <SectionHeader
              level={2}
              title={nodeTitle(m, node.id)}
              description={node.gate ? m.business.state.gate : undefined}
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col gap-6">
          <p className={FIELD_NOTE} data-node-state={node.state}>
            {m.business.state[node.state]}
          </p>
          <div className="flex flex-col gap-6">
            {node.fields.map((f) => (
              <div key={f.field} className="flex min-w-0 flex-col gap-1" data-field={f.field}>
                <h3 className="text-label-md">{fieldLabel(m, f.field)}</h3>
                {f.answer === null ? (
                  <p className={FIELD_NOTE}>{emptyOf(f.field)}</p>
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
        </div>
        {node.stillToAsk.length === 0 ? null : (
          <div className="mt-4 flex min-w-0 flex-col gap-2 @min-[960px]:mt-0">
            <h3 className="text-label-md">{m.business.stillToAsk}</h3>
            <ul className="flex flex-col gap-2">
              {node.stillToAsk.map((id) => (
                <li key={id}>{questionText(m, id)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
