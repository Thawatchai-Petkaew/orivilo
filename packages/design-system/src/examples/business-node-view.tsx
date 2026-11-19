"use client";

import {
  BUSINESS_FIELDS,
  type BusinessFieldId,
  type BusinessFieldReading,
  type BusinessNote,
  type BusinessReadReason,
  type BusinessView,
  checkChoice,
  type ChoiceInput,
  POSITIONING_STATEMENT_MAX,
  type PositioningView,
} from "@orivilo/intent-engine";
import { useEffect, useId, useRef, useState } from "react";
import {
  Button,
  EvidenceList,
  EvidenceSpan,
  Field,
  SectionHeader,
  Textarea,
} from "../components/index";
import { formatNumber } from "../i18n/format";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import { Notice } from "./brand-report";
import {
  belowFloorLine,
  briefItem,
  FIELD_NOTE,
  fieldLabel,
  fromModelNote,
  labelOfKey,
  nodeTitle,
  questionText,
  readingQuotes,
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
 *
 * The Positioning view also holds the statement section of the gate (ORV-285, `positioning-gate-1`):
 * the agreed or stale statement as text, and the controls to write one's own or skip.
 */
export type BusinessNodeData = BusinessView["nodes"][number];

/** A choice as the screen sends it: `ChoiceInput` without the project, which the caller knows. */
export type ChoiceRequest = ChoiceInput extends infer C
  ? C extends unknown
    ? Omit<C, "projectId">
    : never
  : never;

/**
 * The editor's text and what it edits: `option` null is the write-own editor, a number is that
 * drafted option. Held by the board, so it stays while the viewer closes and opens.
 */
export type PositioningEditor = { option: 1 | 2 | 3 | null; text: string } | null;

/** What the caller gives the section so a person can decide (`positioning-choice-1`). */
export interface PositioningControls {
  /** A request is running: its button shows `loading`, every other button is inert. */
  pending: "saving" | "drafting" | null;
  /**
   * What the server found wrong with the statement, shown on the field. Pass a new value for each
   * refusal and leave it out otherwise; a new value moves focus to the field.
   */
  problem?: "required" | "too-long" | null | undefined;
  /** A line already resolved by the caller (signed out, rate limited, failed), kept under the controls. */
  failure?: string | undefined;
  /** Why the last draft request stopped; shown as a line of its own, never as a failure of the save. */
  stopped?: BusinessReadReason | undefined;
  /** Asks for drafted options. Absent, no Draft button is drawn. */
  onDraft?: (() => void) | undefined;
  /** Called with a choice the screen has checked; the caller checks again and calls the action. */
  onChoose: (choice: ChoiceRequest) => void;
  /**
   * The person left without deciding (Cancel, or the viewer closing): drop the last outcome, so no
   * failure line outlives the editor it came from.
   */
  onDismiss?: (() => void) | undefined;
  editor: PositioningEditor;
  onEditor: (next: PositioningEditor) => void;
}

export interface BusinessNodeViewProps {
  node: BusinessNodeData;
  /** Slice 1 draws the node's own level 2 heading; a surface that titles the node itself passes false. */
  heading?: boolean | undefined;
  /** What the saved record says about AI; only `rule-based` adds a line. `none` is slice 1 and 2. */
  reading?: BusinessView["reading"] | undefined;
  /** The view's positioning gate. Only the `positioning` node uses it; with none, that node has no section. */
  positioning?: PositioningView | undefined;
  /** The controls of the section. Absent, the section shows a statement and no control, and with no statement it is not drawn. */
  controls?: PositioningControls | undefined;
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
          {r.spans.length > 1 ? <EvidenceList items={readingQuotes(r)} /> : null}
        </li>
      ))}
    </ul>
  );
}

/** The check of `positioning-choice-1` needs a project id to parse; the screen does not know it. */
const NO_PROJECT = "00000000-0000-4000-8000-000000000000";

/** What is wrong with a statement the person typed, by the engine's own check; null when nothing. */
function problemOf(text: string): "required" | "too-long" | null {
  const checked = checkChoice({ kind: "written", projectId: NO_PROJECT, statement: text });
  if (checked.ok) return null;
  return checked.problems.some((p) => p.path === "statement" && p.kind === "too-long")
    ? "too-long"
    : "required";
}

type FocusTarget =
  { target: "field" } | { target: "opener"; option: 1 | 2 | 3 | null } | { target: "heading" };

/** What was pressed while a request runs: the one button that shows `loading`. */
type Pressed = "save" | "skip" | `pick:${1 | 2 | 3}`;

/** The line for each reason a draft request stopped (`positioning-honest-1`). */
function stoppedLine(m: Messages, reason: BusinessReadReason): string {
  switch (reason) {
    case "ai-not-configured":
      return m.business.positioning.errors.aiNotConfigured;
    case "ai-failed":
      return m.business.positioning.errors.aiFailed;
    case "ai-rate-limited":
      return m.business.positioning.errors.aiRateLimited;
    case "ai-spend-cap":
      return m.business.positioning.errors.aiSpendCap;
  }
}

/**
 * The statement section of the Positioning view (ORV-285 design sections 3 and 5): the heading, the
 * agreed or stale statement as text with who wrote it, the drafted options in one well, and the
 * controls of `positioning-gate-1`. "Draft options" asks for them; "Use this one" and "Edit this
 * one" decide on one; "Write my own" opens an editor that holds its text in the board; "Agree"
 * checks it and calls `onChoose`; "Skip" calls it with a skip; "Cancel" closes the editor, keeps
 * nothing and drops the last failure. Focus follows each action: the field when an editor opens or
 * the check fails, the opener after a cancel or a skip, the heading after the gate passes or the
 * options arrive. Every statement, option and quote is a text node in `bdi`, never HTML, and a
 * drafted line says AI drafted it only because the view holds a stored draft (`positioning-honest-1`).
 */
function PositioningSection({
  gate,
  controls,
}: {
  gate: PositioningView;
  controls: PositioningControls | undefined;
}) {
  const m = useMessages();
  const ids = useId();
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [pressed, setPressed] = useState<Pressed | null>(null);
  const [shown, setShown] = useState<"required" | "too-long" | null>(null);
  const [seen, setSeen] = useState(controls?.problem);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const passed = gate.gate === "given" || gate.gate === "confirmed";
  const [wasPassed, setWasPassed] = useState(passed);
  const [wasSkipped, setWasSkipped] = useState(gate.skipped);
  const options = gate.options;
  const [hadOptions, setHadOptions] = useState(options !== null);

  // A new refusal from the caller replaces what is shown and asks for focus on the field.
  if (controls?.problem !== seen) {
    setSeen(controls?.problem);
    setShown(controls?.problem ?? null);
    if (controls?.problem) setFocus({ target: "field" });
  }
  // The decision landed: the gate passed (focus the heading) or the person skipped (focus the opener).
  if (passed !== wasPassed) {
    setWasPassed(passed);
    if (passed) setFocus({ target: "heading" });
  }
  if (gate.skipped !== wasSkipped) {
    setWasSkipped(gate.skipped);
    if (gate.skipped) setFocus({ target: "opener", option: null });
  }
  // The options arrived after a draft request: focus the heading, as the Draft button is gone.
  if ((options !== null) !== hadOptions) {
    setHadOptions(options !== null);
    if (options !== null) setFocus({ target: "heading" });
  }

  useEffect(() => {
    if (focus === null) return;
    const section = root.current;
    if (focus.target === "heading") {
      heading.current?.focus();
    } else if (focus.target === "field") {
      const field = section?.querySelector<HTMLTextAreaElement>("textarea");
      field?.focus();
      // An option editor opens with the caret after its text, where the person goes on typing.
      field?.setSelectionRange(field.value.length, field.value.length);
    } else {
      const opener =
        focus.option === null
          ? '[data-choice="writeOwn"]'
          : `[data-choice="edit"][data-option="${focus.option}"]`;
      section?.querySelector<HTMLElement>(opener)?.focus();
    }
  }, [focus]);

  // An agreed positioning has no editor left to keep.
  const editorOpen = controls?.editor != null;
  const onEditor = controls?.onEditor;
  useEffect(() => {
    if (passed && editorOpen) onEditor?.(null);
  }, [passed, editorOpen, onEditor]);

  const statement = gate.statement;
  const busy = controls?.pending != null;
  const drafting = controls?.pending === "drafting";
  const items = options?.items ?? [];
  // An editor on an option the view no longer holds is no editor.
  const editor =
    controls?.editor != null &&
    (controls.editor.option === null || items.some((i) => i.n === controls.editor?.option))
      ? controls.editor
      : null;
  const editing = editor?.option ?? null;
  const fieldError =
    shown === "required"
      ? m.business.positioning.statementRequired
      : shown === "too-long"
        ? fill(m.business.intake.tooLong, { max: String(POSITIONING_STATEMENT_MAX) })
        : undefined;

  const choose = (choice: ChoiceRequest) => {
    if (controls === undefined || busy) return;
    controls.onChoose(choice);
  };
  const agree = () => {
    if (editor === null || busy) return;
    const problem = problemOf(editor.text);
    setShown(problem);
    if (problem !== null) {
      setFocus({ target: "field" });
      return;
    }
    setPressed("save");
    choose(
      editor.option === null || options === null
        ? { kind: "written", statement: editor.text }
        : {
            kind: "edited",
            draftId: options.draftId,
            option: editor.option,
            statement: editor.text,
          },
    );
  };
  const openEditor = (option: 1 | 2 | 3 | null) => {
    if (busy) return;
    setShown(null);
    controls?.onEditor({ option, text: items.find((i) => i.n === option)?.statement ?? "" });
    setFocus({ target: "field" });
  };
  const cancel = () => {
    if (busy) return;
    setShown(null);
    controls?.onEditor(null);
    controls?.onDismiss?.();
    setFocus({ target: "opener", option: editing });
  };
  const skip = () => {
    if (busy) return;
    setPressed("skip");
    choose({ kind: "skipped" });
  };
  const pick = (option: 1 | 2 | 3) => {
    if (busy || options === null) return;
    setPressed(`pick:${option}`);
    choose({ kind: "picked", draftId: options.draftId, option });
  };
  const draft = () => {
    if (busy) return;
    controls?.onDraft?.();
  };
  const inert = busy || undefined;

  const offers = (control: PositioningView["controls"][number]) => gate.controls.includes(control);
  // `primary` only where no engine action and no option is offered (design section 5, "One primary").
  const ownVariant = offers("draft") || options !== null ? "secondary" : "primary";
  const by =
    statement === null || statement.label === "business.positioning.stale"
      ? null
      : statement.label === "business.positioning.by.own"
        ? m.business.positioning.by.own
        : statement.modelId === null
          ? null
          : fill(
              statement.label === "business.positioning.by.picked"
                ? m.business.positioning.by.picked
                : m.business.positioning.by.edited,
              { model: statement.modelId },
            );

  const writeOwnButton = (
    <Button
      variant={ownVariant}
      data-choice="writeOwn"
      aria-disabled={inert}
      onClick={() => openEditor(null)}
    >
      {m.business.positioning.writeOwn}
    </Button>
  );
  const skipButton = (
    <Button
      variant="ghost"
      data-choice="skip"
      aria-disabled={inert}
      loading={busy && pressed === "skip"}
      loadingLabel={m.business.positioning.saving}
      onClick={skip}
    >
      {m.strategy.skip}
    </Button>
  );
  const agreeAndCancel = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="primary"
        data-choice="save"
        aria-disabled={inert}
        loading={busy && pressed === "save"}
        loadingLabel={m.business.positioning.saving}
        onClick={agree}
      >
        {m.business.positioning.save}
      </Button>
      <Button variant="secondary" data-choice="cancel" aria-disabled={inert} onClick={cancel}>
        {m.business.positioning.cancel}
      </Button>
    </div>
  );

  return (
    <div ref={root} className="flex min-w-0 flex-col gap-3" data-field="positioning.statement">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 ref={heading} tabIndex={-1} className="self-start text-label-md">
          {m.business.field.statement}
        </h3>
        {statement?.label === "business.positioning.stale" ? (
          <p className="text-body-sm">{m.business.positioning.stale}</p>
        ) : null}
        {statement === null ? null : (
          <p className="whitespace-pre-wrap">
            <bdi>{statement.text}</bdi>
          </p>
        )}
        {by === null ? null : <p className={FIELD_NOTE}>{by}</p>}
        {gate.needsValue ? <p className={FIELD_NOTE}>{m.business.positioning.needsValue}</p> : null}
      </div>
      {options === null ? null : (
        <div
          role="group"
          aria-labelledby={`${ids}-intro`}
          className="flex min-w-0 flex-col gap-4 rounded-container bg-surface-sunken p-4"
          data-drafted-options=""
        >
          <p id={`${ids}-intro`} className={FIELD_NOTE}>
            {m.strategy.draftedOptions}
          </p>
          <ul className="flex flex-col gap-4">
            {items.map((item, at) => {
              const name = fill(m.business.positioning.option, { n: String(item.n) });
              const open = editing === item.n;
              return (
                <li
                  key={item.n}
                  className={
                    at === 0
                      ? "flex min-w-0 flex-col gap-1"
                      : "flex min-w-0 flex-col gap-1 border-t border-border-subtle pt-4"
                  }
                  data-option={item.n}
                >
                  {open && editor !== null ? (
                    <Field label={name} error={fieldError}>
                      <Textarea
                        size="md"
                        rows={3}
                        maxRows={8}
                        value={editor.text}
                        onChange={(event) => {
                          setShown(null);
                          controls?.onEditor({ option: item.n, text: event.target.value });
                        }}
                      />
                    </Field>
                  ) : (
                    <>
                      <h4 id={`${ids}-name-${item.n}`} className="text-label-md">
                        {name}
                      </h4>
                      <p className="whitespace-pre-wrap" data-option-statement="">
                        <bdi>{item.statement}</bdi>
                      </p>
                    </>
                  )}
                  <p className={FIELD_NOTE}>
                    {fill(m.business.positioning.draftedBy, { model: options.modelId })}
                  </p>
                  <div className="mt-2 flex min-w-0 flex-col gap-1">
                    <p className={FIELD_NOTE}>{m.business.positioning.restsOn}</p>
                    <ul className="flex flex-col gap-2">
                      {item.quotes.map((quote, q) => (
                        <li key={q} className="flex min-w-0 flex-col">
                          <p className="whitespace-pre-wrap text-body-sm" data-quote="">
                            <q>
                              <bdi>{quote.text}</bdi>
                            </q>
                          </p>
                          <p className={FIELD_NOTE}>{labelOfKey(m, quote.labelKey)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {open ? (
                    <div className="mt-3">{agreeAndCancel}</div>
                  ) : controls !== undefined && editing === null && offers("pick") ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        id={`${ids}-pick-${item.n}`}
                        variant="secondary"
                        data-choice="pick"
                        data-option={item.n}
                        aria-labelledby={`${ids}-pick-${item.n} ${ids}-name-${item.n}`}
                        aria-disabled={inert}
                        loading={busy && pressed === `pick:${item.n}`}
                        loadingLabel={m.business.positioning.saving}
                        onClick={() => pick(item.n)}
                      >
                        {m.business.positioning.pick}
                      </Button>
                      {offers("edit") ? (
                        <Button
                          id={`${ids}-edit-${item.n}`}
                          variant="ghost"
                          data-choice="edit"
                          data-option={item.n}
                          aria-labelledby={`${ids}-edit-${item.n} ${ids}-name-${item.n}`}
                          aria-disabled={inert}
                          onClick={() => openEditor(item.n)}
                        >
                          {m.business.positioning.edit}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {controls === undefined || passed ? null : (
        <div className="flex min-w-0 flex-col">
          {editing !== null ? null : editor === null ? (
            offers("draft") ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="intent"
                    data-choice="draft"
                    aria-disabled={inert}
                    loading={drafting}
                    loadingLabel={m.business.positioning.drafting}
                    onClick={draft}
                  >
                    {m.business.positioning.draft}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {offers("writeOwn") ? writeOwnButton : null}
                  {offers("skip") ? skipButton : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {offers("writeOwn") ? writeOwnButton : null}
                {offers("skip") ? skipButton : null}
              </div>
            )
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              <Field label={m.business.positioning.writeOwn} error={fieldError}>
                <Textarea
                  size="md"
                  rows={3}
                  maxRows={8}
                  value={editor.text}
                  onChange={(event) => {
                    setShown(null);
                    controls.onEditor({ option: null, text: event.target.value });
                  }}
                />
              </Field>
              {agreeAndCancel}
            </div>
          )}
          <div role="status">
            {controls.stopped === undefined ? null : (
              <div className="mt-3">
                <Notice variant="info" text={stoppedLine(m, controls.stopped)} live="off" />
              </div>
            )}
          </div>
          <div role="alert">
            {controls.failure === undefined ? null : (
              <div className="mt-3">
                <Notice variant="danger" text={controls.failure} live="off" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BusinessNodeView({
  node,
  heading = true,
  reading,
  positioning,
  controls,
}: BusinessNodeViewProps) {
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
              description={
                node.gatePassed
                  ? m.business.positioning.gatePassed
                  : node.gate
                    ? m.business.state.gate
                    : undefined
              }
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p
              className={FIELD_NOTE}
              data-node-state={node.state}
              role={node.id === "positioning" ? "status" : undefined}
            >
              {m.business.state[node.state]}
            </p>
            {reading?.status === "rule-based" ? (
              <p className={FIELD_NOTE} data-ai-line={reading.reason}>
                {m.business.label.aiUnavailable}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-6">
            {node.fields.map((f) => {
              const notes = node.notes.filter((note) => NOTE_AT[note] === f.field);
              return (
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
                  {/* A note belongs to the field, so it comes before the readings (row D7). */}
                  {notes.map((note) => (
                    <p key={note} className={FIELD_NOTE}>
                      {noteText(m, note)}
                    </p>
                  ))}
                  {f.readings.length === 0 ? null : (
                    <div className={f.answer === null && notes.length === 0 ? undefined : "mt-2"}>
                      <Readings readings={f.readings} />
                    </div>
                  )}
                </div>
              );
            })}
            {node.id === "positioning" &&
            positioning !== undefined &&
            (positioning.statement !== null || controls !== undefined) ? (
              <PositioningSection gate={positioning} controls={controls} />
            ) : null}
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
