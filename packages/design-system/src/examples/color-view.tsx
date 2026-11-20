"use client";

import {
  checkLineupRows,
  type FoundationNode,
  type LineupRowProblem,
} from "@orivilo/intent-engine";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Field, Input } from "../components/index";
import { PlusIcon, TrashIcon } from "../components/icons";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill } from "../i18n/messages/index";
import {
  canvasWord,
  colorReason,
  crowdedLine,
  decisionRule,
  familyWord,
  FIELD_NOTE,
  foundationFieldLabel,
  neutralWord,
  signatureOpenLine,
} from "./business-text";
import { ByRuleLabel, DecisionLine } from "./expression-parts";
import { FailureRegion, NO_PROJECT } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Colour view and its lineup editor (ORV-298 design section 5, `color-node-1`, `lineup-input-1`).
 * Three decisions worked out by fixed rules (the signature family, the greys and the background),
 * each with its reason and its rule id, then the competitors' main colours the person gave and the
 * colour families that are crowded among them. Every name and every colour is the person's own text:
 * a text node inside `bdi`, never HTML, never a link, and never a CSS value, so nothing is drawn from
 * it. The editor holds its rows in `controls.editor`, so they stay through a refusal, a rate-limited
 * answer and the viewer closing. Which controls show comes from `node.controls`, never from a state
 * this view decides.
 */

type ColorNode = Extract<FoundationNode, { id: "color" }>;
type RowField = "name" | "hex";
type Focus = { on: "opener" } | { on: "field"; row: number; field: RowField } | { on: "region" };

/** The most brands a lineup holds (`lineupSchema`); the editor offers no row past it. */
const LINEUP_ROWS_MAX = 20;

/** Which field of which row a problem names; the first problem is the only one shown. */
function placeOf(problem: LineupRowProblem): { row: number; field: RowField } {
  switch (problem.kind) {
    case "rowIncomplete":
      return { row: problem.row, field: problem.field };
    case "hexInvalid":
      return { row: problem.row, field: "hex" };
    case "nameRepeated":
    case "tooLong":
      return { row: problem.row, field: "name" };
    // No lineup, or too many rows (the editor never offers a twenty-first): the first row's name.
    case "lineupRequired":
    case "lineupMax":
      return { row: 0, field: "name" };
  }
}

export function ColorView({
  node,
  controls,
}: {
  node: ColorNode;
  controls?: FoundationControls | undefined;
}) {
  const m = useMessages();
  const locale = useLocale();
  const ids = useId();
  const fields = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const editorBox = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState<LineupRowProblem | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [hadLineup, setHadLineup] = useState(node.lineup !== null);

  // The lineup landed: focus goes to the view's scroll region, scrolled to its top, so the new
  // state line (a polite status) is read first. No heading takes focus (design 4.4).
  if (node.lineup !== null && !hadLineup) {
    setHadLineup(true);
    setFocus({ on: "region" });
  }

  const asked = controls !== undefined && node.controls.includes("give");
  const editorOpen = controls?.editor?.node === "color";
  const editor = controls?.editor?.node === "color" && asked ? controls.editor : null;
  const onEditor = controls?.onEditor;
  // A saved lineup has no editor left to keep.
  useEffect(() => {
    if (!node.controls.includes("give") && editorOpen) onEditor?.(null);
  }, [node.controls, editorOpen, onEditor]);

  useEffect(() => {
    if (focus === null) return;
    if (focus.on === "region") {
      const region = fields.current?.closest<HTMLElement>('[role="region"]');
      region?.focus();
      if (region) region.scrollTop = 0;
      return;
    }
    if (focus.on === "opener") {
      row.current?.querySelector<HTMLElement>('[data-choice="give"]')?.focus();
      return;
    }
    const item = editorBox.current
      ?.querySelectorAll<HTMLElement>("[data-rows] > li")
      .item(focus.row);
    item
      ?.querySelectorAll<HTMLElement>("input")
      .item(focus.field === "name" ? 0 : 1)
      ?.focus();
  }, [focus]);

  const busy = controls?.pending != null;
  const inert = busy || undefined;

  const openEditor = () => {
    setProblem(null);
    controls?.onEditor({ node: "color", rows: [{ key: 0, name: "", hex: "" }] });
    setFocus({ on: "field", row: 0, field: "name" });
  };
  const cancel = () => {
    setProblem(null);
    controls?.onEditor(null);
    controls?.onDismiss?.();
    setFocus({ on: "opener" });
  };

  if (editor !== null && controls !== undefined) {
    const { rows } = editor;
    const rowLabel = (index: number) => fill(m.business.color.row, { n: index + 1 });
    const setRows = (next: typeof rows) => controls.onEditor({ node: "color", rows: next });
    const add = () => {
      setRows([...rows, { key: Math.max(...rows.map((r) => r.key)) + 1, name: "", hex: "" }]);
      setFocus({ on: "field", row: rows.length, field: "name" });
    };
    const drop = (index: number) => {
      setProblem(null);
      setRows(rows.filter((_, at) => at !== index));
      // The next row takes its place; the last row's removal goes to the one before.
      setFocus({ on: "field", row: Math.min(index, rows.length - 2), field: "name" });
    };
    const edit = (index: number, field: RowField, value: string) => {
      if (problem !== null) {
        const at = placeOf(problem);
        if (at.row === index && at.field === field) setProblem(null);
      }
      setRows(rows.map((row, at) => (at === index ? { ...row, [field]: value } : row)));
    };
    const save = () => {
      const checked = checkLineupRows(
        rows.map(({ name, hex }) => ({ name, hex })),
        NO_PROJECT,
      );
      if (!checked.ok) {
        // Only the first problem shows, in the order the design lists them, and takes focus.
        const first = checked.problems[0];
        if (first !== undefined) {
          setProblem(first);
          setFocus({ on: "field", ...placeOf(first) });
        }
        return;
      }
      controls.onEnter(checked.request);
    };
    const lineFor = (index: number, field: RowField): string | undefined => {
      if (problem === null) return undefined;
      const at = placeOf(problem);
      if (at.row !== index || at.field !== field) return undefined;
      switch (problem.kind) {
        case "lineupRequired":
          return m.business.color.lineupRequired;
        case "rowIncomplete":
          return m.business.color.rowIncomplete;
        case "hexInvalid":
          return m.business.color.hexInvalid;
        case "nameRepeated":
          return m.business.color.nameRepeated;
        case "tooLong":
          return fill(m.business.intake.tooLong, { max: String(problem.max) });
        case "lineupMax":
          return m.business.color.lineupMax;
      }
    };
    const question = `${ids}-question`;
    const rule = `${ids}-rule`;
    return (
      <div
        ref={editorBox}
        className="@container flex min-w-0 flex-col gap-6"
        data-editor="lineup"
        role="group"
        aria-labelledby={question}
        aria-describedby={rule}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <p id={question} className="text-label-md">
            {m.business.question.lineup}
          </p>
          <p id={rule} className={FIELD_NOTE}>
            {m.business.color.crowdRule}
          </p>
        </div>
        <ol className="flex min-w-0 flex-col gap-6" data-rows>
          {rows.map((row, index) => {
            const label = `${ids}-row-${row.key}`;
            return (
              <li key={row.key}>
                <div className="flex min-w-0 flex-col gap-2" role="group" aria-labelledby={label}>
                  <div
                    className="flex min-h-10 min-w-0 items-center justify-between gap-2"
                    data-row-head
                  >
                    <p id={label} className="text-label-md">
                      {rowLabel(index)}
                    </p>
                    {rows.length < 2 ? null : (
                      <Button
                        variant="ghost"
                        size="md"
                        iconOnly
                        aria-label={fill(m.business.color.remove, {
                          name: row.name.trim() === "" ? rowLabel(index) : row.name,
                        })}
                        aria-disabled={inert}
                        onClick={() => drop(index)}
                      >
                        <TrashIcon />
                      </Button>
                    )}
                  </div>
                  <div className="grid min-w-0 grid-cols-1 items-start gap-3 @[32rem]:grid-cols-2">
                    <Field label={m.business.color.brandName} error={lineFor(index, "name")}>
                      <Input
                        size="md"
                        value={row.name}
                        autoComplete="off"
                        onChange={(event) => edit(index, "name", event.target.value)}
                      />
                    </Field>
                    <Field label={m.business.color.hex} error={lineFor(index, "hex")}>
                      <Input
                        size="md"
                        value={row.hex}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(event) => edit(index, "hex", event.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex min-w-0 flex-col" data-add>
          {rows.length < LINEUP_ROWS_MAX ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                iconLeading={<PlusIcon />}
                aria-disabled={inert}
                onClick={add}
              >
                {m.business.color.add}
              </Button>
            </div>
          ) : (
            <p className={FIELD_NOTE} role="status">
              {m.business.color.lineupMax}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2" data-row>
            <Button
              variant="primary"
              data-choice="save"
              loading={busy}
              loadingLabel={m.business.positioning.saving}
              onClick={save}
            >
              {m.business.color.save}
            </Button>
            <Button variant="secondary" data-choice="cancel" aria-disabled={inert} onClick={cancel}>
              {m.business.positioning.cancel}
            </Button>
          </div>
          <FailureRegion line={controls.failure} />
        </div>
      </div>
    );
  }

  const { decisions, points } = node;
  const empty = <p className={FIELD_NOTE}>{m.business.state.empty}</p>;
  const heading = (field: "signature" | "neutral" | "canvas" | "lineup" | "crowded") => (
    <h3 className="self-start text-label-md">{foundationFieldLabel(m, field)}</h3>
  );
  // A reason quotes the scale points, so a decision with no points is not shown (never a guess).
  const signature = points === null ? null : (decisions?.signature ?? null);
  const neutral = points === null ? null : (decisions?.neutral ?? null);
  const canvas = points === null ? null : (decisions?.canvas ?? null);
  const openLine = signatureOpenLine(m, node.signatureOpen);

  return (
    <>
      <div ref={fields} className="flex flex-col gap-6" data-fields>
        {signature !== null ? (
          <DecisionLine
            field="signature"
            value={familyWord(m, signature.value)}
            reasons={[colorReason(m, node, signature.because)]}
            rule={decisionRule(m, signature.rule)}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-1" data-field="signature">
            {heading("signature")}
            {openLine === null ? empty : <p className={FIELD_NOTE}>{openLine}</p>}
          </div>
        )}
        {neutral !== null ? (
          <DecisionLine
            field="neutral"
            value={neutralWord(m, neutral.value)}
            reasons={[colorReason(m, node, "neutral")]}
            rule={decisionRule(m, neutral.rule)}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-1" data-field="neutral">
            {heading("neutral")}
            {empty}
          </div>
        )}
        {canvas !== null ? (
          <DecisionLine
            field="canvas"
            value={canvasWord(m, canvas.value)}
            reasons={[colorReason(m, node, "canvas")]}
            rule={decisionRule(m, canvas.rule)}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-1" data-field="canvas">
            {heading("canvas")}
            {empty}
          </div>
        )}
        {signature === null && neutral === null && canvas === null ? null : (
          <div className="flex flex-col gap-1" data-labels>
            <ByRuleLabel />
            <p className={FIELD_NOTE}>{m.business.color.hypothesis}</p>
            <p className={FIELD_NOTE}>{m.business.color.familyOnly}</p>
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1" data-field="lineup">
          {heading("lineup")}
          {node.lineup === null ? (
            empty
          ) : (
            <>
              <dl
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1"
                data-lineup
              >
                {node.lineup.map((entry, index) => (
                  // A name is unique in a lineup, but the index is the stored order the list shows.
                  <div key={index} className="contents">
                    <dt className="min-w-0 whitespace-pre-wrap">
                      <bdi>{entry.name}</bdi>
                    </dt>
                    <dd className={FIELD_NOTE}>
                      <bdi>{entry.hex}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className={FIELD_NOTE}>{m.business.color.givenByYou}</p>
            </>
          )}
        </div>
        {node.crowded === null ? null : (
          <div className="flex min-w-0 flex-col gap-1" data-field="crowded">
            {heading("crowded")}
            <p>{crowdedLine(m, locale, node.crowded)}</p>
            <p className={FIELD_NOTE}>{m.business.color.crowdRule}</p>
          </div>
        )}
      </div>
      {asked ? (
        <div className="flex min-w-0 flex-col">
          <div ref={row} className="flex flex-wrap items-center gap-2" data-row>
            <Button variant="primary" data-choice="give" aria-disabled={inert} onClick={openEditor}>
              {m.business.color.give}
            </Button>
          </div>
          <FailureRegion line={controls.failure} />
        </div>
      ) : null}
    </>
  );
}
