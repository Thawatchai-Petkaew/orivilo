"use client";

import {
  BUSINESS_FIELDS,
  type BusinessFieldId,
  type BusinessFieldReading,
  type BusinessNote,
  type BusinessView,
} from "@orivilo/intent-engine";
import { EvidenceList, EvidenceSpan, SectionHeader } from "../components/index";
import { formatNumber } from "../i18n/format";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import {
  belowFloorLine,
  briefItem,
  briefItems,
  FIELD_NOTE,
  fieldLabel,
  fromModelNote,
  nodeTitle,
  questionText,
} from "./business-text";

/**
 * One business node as a reading surface (ORV-281 design section 5, row D1): its state as a line
 * of text under the heading, each field with the person's words and the label that says how they
 * got here, what AI read under them, and the questions still to ask. A reading (slice 3) is a
 * proposal: it says it came from a model with the saved model id, that it is not confirmed, and
 * its confidence, and a reading below the floor says so before its value. With a result that has no
 * reading the view says AI did not read, and shows the person's words alone. Every value from a
 * person or a model is a text node inside `bdi`, `whitespace-pre-wrap` so a line break stays, never
 * HTML and never a link (spec rows 16 and 33). No badge: a state and a reading are lines of text.
 */
export type BusinessNodeData = BusinessView["nodes"][number];

export interface BusinessNodeViewProps {
  node: BusinessNodeData;
  /** Slice 1 draws the node's own level 2 heading; a surface that titles the node itself passes false. */
  heading?: boolean | undefined;
  /** What the saved record says about AI; only `rule-based` adds a line. `none` is slice 1 and 2. */
  reading?: BusinessView["reading"] | undefined;
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

function Readings({ readings }: { readings: BusinessFieldReading[] }) {
  const m = useMessages();
  const locale = useLocale();
  return (
    <ul className="flex flex-col gap-4">
      {readings.map((r) => (
        <li key={r.item.id} className="flex min-w-0 flex-col gap-1" data-reading={r.item.id}>
          {r.belowFloor ? <p className="text-body-sm">{belowFloorLine(m, r)}</p> : null}
          <EvidenceSpan item={briefItem(r.item)}>
            <bdi>{r.value}</bdi>
          </EvidenceSpan>
          <p className={FIELD_NOTE}>{fromModelNote(locale, r.modelId)}</p>
          <p className={FIELD_NOTE}>{m.business.state.proposed}</p>
          <p className={FIELD_NOTE}>
            {fill(m.business.reading.confidence, { value: formatNumber(r.confidence, locale) })}
          </p>
          {r.spans.length > 1 ? <EvidenceList items={briefItems(r.spans)} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function BusinessNodeView({ node, heading = true, reading }: BusinessNodeViewProps) {
  const m = useMessages();
  const read = node.fields.some((f) => f.readings.length > 0);
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
          <div className="flex flex-col gap-2">
            <p className={FIELD_NOTE} data-node-state={node.state}>
              {m.business.state[node.state]}
            </p>
            {reading?.status === "rule-based" ? (
              <p className={FIELD_NOTE} data-ai-line={reading.reason}>
                {m.business.label.aiUnavailable}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-6">
            {node.fields.map((f) => (
              <div key={f.field} className="flex min-w-0 flex-col gap-1" data-field={f.field}>
                <h3 className="text-label-md">{fieldLabel(m, f.field)}</h3>
                {f.answer === null ? (
                  f.readings.length === 0 ? (
                    <p className={FIELD_NOTE}>{emptyOf(f.field)}</p>
                  ) : null
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">
                      <bdi>{f.answer.text}</bdi>
                    </p>
                    <p className={FIELD_NOTE}>{m.business.label.yourWords}</p>
                  </>
                )}
                {f.readings.length === 0 ? null : (
                  <div className={f.answer === null ? undefined : "mt-2"}>
                    <Readings readings={f.readings} />
                  </div>
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
          {read ? <p className={FIELD_NOTE}>{m.business.label.confidence}</p> : null}
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
