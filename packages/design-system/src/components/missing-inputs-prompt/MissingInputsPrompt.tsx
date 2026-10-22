"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import {
  type Answer,
  type BlockInput,
  fillState,
  missingInputs,
  normaliseColour,
} from "../../blocks/index";
import { pick } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { Button } from "../button/Button";
import type { Graph } from "../canvas-board/graph";
import { cx } from "../cx";
import { Field } from "../field/Field";
import { FillSummarizedIcon } from "../icons";
import { Input } from "../input/Input";
import { Select } from "../select/Select";
import { Textarea } from "../textarea/Textarea";

export interface MissingInputsPromptProps {
  /** The board the node is on; what is missing follows from it (answers and edges). */
  graph: Graph;
  /** A node made from a registry block. */
  nodeId: string;
  /** Writes one answer to the node; the shell puts it in the graph at once. */
  onAnswer: (nodeId: string, inputId: string, value: Answer) => void;
  className?: string | undefined;
}

/** The answer a draft makes for the input, or the reason it cannot be saved yet. */
function parse(
  input: BlockInput,
  draft: string,
  m: ReturnType<typeof useMessages>,
): { value: Answer } | { error: string } {
  const text = draft.trim();
  if (text === "") return { error: m.prompt.required };
  if (input.answer === "colours") {
    const parts = text.split(/[\s,]+/).filter(Boolean);
    const bad = parts.filter((p) => !normaliseColour(p));
    if (bad.length > 0) return { error: fill(m.prompt.coloursInvalid, { list: bad.join(", ") }) };
    return { value: parts.map((p) => normaliseColour(p) ?? p) };
  }
  if (input.answer === "url" && !/^https:\/\/\S+$/.test(text))
    return { error: m.prompt.urlInvalid };
  return { value: text };
}

/**
 * Asks a block node for its missing required inputs one at a time (spec ORV-44 part 2, AC 7 and
 * 8): "k of n", the question as a labelled field of its answer type, skip and save. Saving writes
 * the answer through `onAnswer` at once and moves to the next question; skip moves on without
 * writing. The list is derived from the board every render, so an edge that fills an input
 * removes its question too. When nothing is missing it says the node has what it needs.
 */
export function MissingInputsPrompt({
  graph,
  nodeId,
  onAnswer,
  className,
}: MissingInputsPromptProps) {
  const m = useMessages();
  const locale = useLocale();
  const status = useId();
  const node = graph.nodes.find((n) => n.id === nodeId);
  const questions = missingInputs(graph, nodeId);
  const [cursor, setCursor] = useState<string | undefined>(questions[0]?.id);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [announce, setAnnounce] = useState("");
  const index = Math.max(
    0,
    questions.findIndex((q) => q.id === cursor),
  );
  const current = questions[index];

  // A fresh question starts blank; the draft never carries over to the next one.
  useEffect(() => {
    setDraft("");
    setError(undefined);
  }, [current?.id, nodeId]);

  if (!node) return null;
  const title = node.data.title;

  const next = (after: number, list: readonly BlockInput[]) =>
    list.length === 0 ? undefined : list[after % list.length]?.id;

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!current) return;
    const parsed = parse(current, draft, m);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    const rest = questions.filter((q) => q.id !== current.id);
    // The question after this one, in the list that remains once it is answered.
    setCursor(next(index, rest));
    setAnnounce(fill(m.prompt.saved, { label: pick(current.label, locale) }));
    onAnswer(nodeId, current.id, parsed.value);
  };

  const skip = () => {
    setCursor(next(index + 1, questions));
    setAnnounce("");
  };

  const done = questions.length === 0 && fillState(graph, nodeId) !== undefined;
  const label = current ? pick(current.question, locale) : "";
  const uploads = current?.answer === "images";

  return (
    <div
      role="group"
      className={cx("ds-prompt", className)}
      aria-label={fill(m.prompt.label, { title })}
    >
      {current ? (
        <form className="ds-prompt__form" onSubmit={save} noValidate>
          <p className="ds-prompt__progress">
            {fill(m.prompt.progress, {
              index: String(index + 1),
              count: String(questions.length),
            })}
          </p>
          {uploads ? (
            <div className="ds-prompt__upload">
              <p className="ds-prompt__question">{label}</p>
              <p className="ds-prompt__note">{m.prompt.uploadLater}</p>
            </div>
          ) : (
            <Field
              label={label}
              description={current.answer === "colours" ? m.prompt.coloursHint : undefined}
              error={error}
              required
            >
              {current.answer === "long-text" ? (
                <Textarea
                  value={draft}
                  rows={3}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) save(e);
                  }}
                />
              ) : current.answer === "choice" ? (
                <Select
                  value={draft || undefined}
                  onValueChange={setDraft}
                  options={current.options.map((o) => ({ value: o.id, label: o[locale] }))}
                />
              ) : (
                <Input
                  type={current.answer === "url" ? "url" : "text"}
                  inputMode={current.answer === "url" ? "url" : undefined}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              )}
            </Field>
          )}
          <div className="ds-prompt__actions">
            <Button type="button" variant="ghost" onClick={skip} disabled={questions.length < 2}>
              {m.prompt.skip}
            </Button>
            {uploads ? null : (
              <Button type="submit" variant="primary">
                {m.prompt.save}
              </Button>
            )}
          </div>
        </form>
      ) : done ? (
        <p className="ds-prompt__done">
          <FillSummarizedIcon />
          {fill(m.prompt.complete, { title })}
        </p>
      ) : null}
      <p id={status} className="ds-prompt__status" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
