"use client";

import {
  ANSWER_MAX_CHARS,
  type AxisPoint,
  type AxisValue,
  axisValueOf,
  checkEntry,
  type EntryProblem,
  type EntryRequest,
  type FoundationNode,
  PERSONALITY_AXES,
  type PersonalityAxis,
} from "@orivilo/intent-engine";
import { useEffect, useRef, useState } from "react";
import { Button, Field, RadioGroup, RadioGroupItem, Textarea } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import { FIELD_NOTE } from "./business-text";
import { AnswerField, FailureRegion, NO_PROJECT } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Brand personality view and its editor (ORV-291 design section 6, `identity-frame-1`). Two
 * optional answers in the person's own words, then five scales of five points, each named by its two
 * ends. No point is chosen when the editor opens: a point is a value only when the person chose it.
 * The given view shows each point as its words ("4 of 5"), never a drawn scale, which would read as a
 * rating. Save checks on the client first (`checkEntry`), so an unchosen scale and an answer past its
 * bound make no call; Cancel saves nothing and returns focus to the control that opened the editor.
 */

type IdentityNode = Extract<FoundationNode, { id: "identity-frame" }>;

const POINTS = [1, 2, 3, 4, 5] as const;
const TEXT_PATHS = { person: "payload.person", never: "payload.never" } as const;
const axisPath = (axis: PersonalityAxis) => `payload.axes.${axis}`;

type Focus = { target: "person" | "opener" | "heading" } | { target: "failing"; paths: string[] };

/** The control a refusal names first, in the order the editor lists them: the answers, then the scales. */
function firstFailing(editor: HTMLElement | null, paths: readonly string[]) {
  if (paths.includes(TEXT_PATHS.person)) return editor?.querySelectorAll("textarea")[0];
  if (paths.includes(TEXT_PATHS.never)) return editor?.querySelectorAll("textarea")[1];
  const axis = PERSONALITY_AXES.find((a) => paths.includes(axisPath(a)));
  // A scale's first radio takes focus; focus alone never checks it.
  return axis === undefined
    ? undefined
    : editor?.querySelector<HTMLElement>(`[data-scale="${axis}"] [role="radio"]`);
}

const legendOf = (m: Messages, axis: PersonalityAxis) =>
  fill(m.business.identity.axisLegend, {
    low: m.business.axis[axis].low,
    high: m.business.axis[axis].high,
  });

export function IdentityFrameView({
  node,
  controls,
}: {
  node: IdentityNode;
  controls?: FoundationControls | undefined;
}) {
  const m = useMessages();
  const heading = useRef<HTMLHeadingElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const editorBox = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<"save" | "skip" | null>(null);
  const [shown, setShown] = useState<EntryProblem[]>([]);
  const [seen, setSeen] = useState(controls?.problems);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [wasGiven, setWasGiven] = useState(node.state === "given");
  const [wasSkipped, setWasSkipped] = useState(node.state === "skipped");

  // A new refusal from the caller replaces what is shown and asks for focus on the first field it names.
  if (controls?.problems !== seen) {
    setSeen(controls?.problems);
    setShown(controls?.problems ?? []);
    if (controls?.problems?.length) {
      setFocus({ target: "failing", paths: controls.problems.map((p) => p.path) });
    }
  }
  // The decision landed: a given personality (focus the Personality heading) or a skip (focus the opener).
  if (node.state === "given" && !wasGiven) {
    setWasGiven(true);
    setFocus({ target: "heading" });
  }
  if (node.state === "skipped" && !wasSkipped) {
    setWasSkipped(true);
    setFocus({ target: "opener" });
  }

  useEffect(() => {
    if (focus === null) return;
    const target = () => {
      switch (focus.target) {
        case "person":
          return editorBox.current?.querySelector<HTMLElement>("textarea");
        case "opener":
          return row.current?.querySelector<HTMLElement>('[data-choice="describe"]');
        case "heading":
          return heading.current;
        case "failing":
          return firstFailing(editorBox.current, focus.paths);
      }
    };
    target()?.focus();
  }, [focus]);

  const given = node.state === "given";
  const editor = controls?.editor?.node === "identity-frame" && !given ? controls.editor : null;
  // A given personality has no editor left to keep.
  const editorOpen = controls?.editor?.node === "identity-frame";
  const onEditor = controls?.onEditor;
  useEffect(() => {
    if (given && editorOpen) onEditor?.(null);
  }, [given, editorOpen, onEditor]);

  const busy = controls?.pending != null;
  const inert = busy || undefined;
  const fallback = node.state === "skipped" ? m.business.state.skipped : m.business.state.empty;
  const tooLong = fill(m.business.intake.tooLong, { max: String(ANSWER_MAX_CHARS) });
  const problemAt = (path: string) => shown.some((p) => p.path === path);
  const without = (path: string) => setShown((now) => now.filter((p) => p.path !== path));

  const openEditor = () => {
    if (busy) return;
    setShown([]);
    controls?.onEditor({ node: "identity-frame", person: "", never: "", axes: {} });
    setFocus({ target: "person" });
  };
  const cancel = () => {
    if (busy) return;
    setShown([]);
    controls?.onEditor(null);
    controls?.onDismiss?.();
    setFocus({ target: "opener" });
  };
  const skip = () => {
    if (busy || controls === undefined) return;
    setPressed("skip");
    controls.onEnter({ node: "identity-frame", kind: "skipped", payload: {} });
  };
  const save = () => {
    if (editor === null || controls === undefined || busy) return;
    // One check for both halves: a scale with no point, and an answer past its bound.
    const checked = checkEntry({
      projectId: NO_PROJECT,
      node: "identity-frame",
      kind: "given",
      payload: {
        axes: Object.fromEntries(
          PERSONALITY_AXES.flatMap((axis) => {
            const point = editor.axes[axis];
            return point === undefined ? [] : [[axis, axisValueOf(point)]];
          }),
        ),
        person: editor.person,
        never: editor.never,
      },
    });
    if (!checked.ok) {
      setShown(checked.problems);
      setFocus({ target: "failing", paths: checked.problems.map((p) => p.path) });
      return;
    }
    // The check passed, so every scale has a point.
    const axes = Object.fromEntries(
      PERSONALITY_AXES.map((axis) => [axis, axisValueOf(editor.axes[axis] as AxisPoint)]),
    ) as Record<PersonalityAxis, AxisValue>;
    const request: EntryRequest = {
      node: "identity-frame",
      kind: "given",
      payload: {
        axes,
        ...(editor.person.trim() === "" ? {} : { person: editor.person }),
        ...(editor.never.trim() === "" ? {} : { never: editor.never }),
      },
    };
    setPressed("save");
    controls.onEnter(request);
  };

  if (editor !== null && controls !== undefined) {
    const textField = (key: "person" | "never") => (
      <Field
        label={key === "person" ? m.business.question.person : m.business.question.never}
        error={problemAt(TEXT_PATHS[key]) ? tooLong : undefined}
      >
        <Textarea
          size="md"
          rows={3}
          maxRows={8}
          value={editor[key]}
          onChange={(event) => {
            without(TEXT_PATHS[key]);
            controls.onEditor({ ...editor, [key]: event.target.value });
          }}
        />
      </Field>
    );
    return (
      <div ref={editorBox} className="flex min-w-0 flex-col gap-6" data-editor>
        {textField("person")}
        {textField("never")}
        <div className="flex min-w-0 flex-col gap-6" data-scales>
          <p className={FIELD_NOTE} data-hypothesis>
            {m.business.identity.hypothesis}
          </p>
          {PERSONALITY_AXES.map((axis) => {
            const point = editor.axes[axis];
            return (
              <div key={axis} className="min-w-0" data-scale={axis}>
                <Field
                  group
                  required
                  label={legendOf(m, axis)}
                  error={problemAt(axisPath(axis)) ? m.business.identity.axesRequired : undefined}
                >
                  {/* Controlled from the first render, with no point: never `defaultValue`, never a preset. */}
                  <RadioGroup
                    size="md"
                    value={point === undefined ? "" : String(point)}
                    onValueChange={(value) => {
                      without(axisPath(axis));
                      controls.onEditor({
                        ...editor,
                        axes: { ...editor.axes, [axis]: Number(value) as AxisPoint },
                      });
                    }}
                  >
                    {POINTS.map((n) => (
                      <RadioGroupItem
                        key={n}
                        value={String(n)}
                        label={fill(m.business.identity.point, { n })}
                        description={
                          n === 1
                            ? m.business.axis[axis].low
                            : n === 5
                              ? m.business.axis[axis].high
                              : undefined
                        }
                      />
                    ))}
                  </RadioGroup>
                </Field>
              </div>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2" data-row>
            <Button
              variant="primary"
              data-choice="save"
              aria-disabled={inert}
              loading={busy && pressed === "save"}
              loadingLabel={m.business.positioning.saving}
              onClick={save}
            >
              {m.business.identity.save}
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

  return (
    <>
      <div className="flex flex-col gap-6" data-fields>
        <AnswerField
          field="person"
          title={m.business.field.person}
          text={node.person}
          fallback={fallback}
          m={m}
        />
        <AnswerField
          field="never"
          title={m.business.field.never}
          text={node.never}
          fallback={fallback}
          m={m}
        />
        <div className="flex min-w-0 flex-col gap-1" data-field="personality">
          <h3 ref={heading} tabIndex={-1} className="self-start text-label-md">
            {m.business.field.personality}
          </h3>
          {node.axes === null ? (
            <p className={FIELD_NOTE}>{fallback}</p>
          ) : (
            <>
              <p className={FIELD_NOTE} data-hypothesis>
                {m.business.identity.hypothesis}
              </p>
              <dl className="mt-2 flex flex-col gap-3">
                {node.axes.map(({ axis, point }) => (
                  <div key={axis} className="flex min-w-0 flex-col gap-0.5">
                    <dt className={FIELD_NOTE}>{legendOf(m, axis)}</dt>
                    <dd>{fill(m.business.identity.point, { n: point })}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </div>
      {controls === undefined || node.controls.length === 0 ? null : (
        <div className="flex min-w-0 flex-col">
          <div ref={row} className="flex flex-wrap items-center gap-2" data-row>
            {node.controls.includes("describe") ? (
              <Button
                variant="primary"
                data-choice="describe"
                aria-disabled={inert}
                onClick={openEditor}
              >
                {m.business.identity.describe}
              </Button>
            ) : null}
            {node.controls.includes("skip") ? (
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
            ) : null}
          </div>
          <FailureRegion line={controls.failure} />
        </div>
      )}
    </>
  );
}
