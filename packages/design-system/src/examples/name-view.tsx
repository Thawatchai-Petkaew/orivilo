"use client";

import {
  checkEntry,
  type EntryProblem,
  type FoundationNode,
  WORKING_NAME_MAX,
} from "@orivilo/intent-engine";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Input } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import { fill } from "../i18n/messages/index";
import { FIELD_NOTE } from "./business-text";
import { FailureRegion, NO_PROJECT } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Name view and its editor (ORV-291 design section 9, `working-name-1`). The name is the
 * person's own text: a text node inside `bdi`, never HTML, never a link, with the line that says it
 * was not screened for trademarks. Save checks on the client first (`checkEntry`), so an empty name
 * and one past its bound make no call and keep what was typed; Cancel saves nothing and returns
 * focus to the control that opened the editor.
 */

type NameNode = Extract<FoundationNode, { id: "name" }>;
type Focus = "input" | "opener" | "heading";

export function NameView({
  node,
  controls,
}: {
  node: NameNode;
  controls?: FoundationControls | undefined;
}) {
  const m = useMessages();
  const heading = useRef<HTMLHeadingElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const editorBox = useRef<HTMLDivElement>(null);
  const [problem, setProblem] = useState<EntryProblem["kind"] | null>(null);
  const [focus, setFocus] = useState<{ on: Focus } | null>(null);
  const [seen, setSeen] = useState(controls?.problems);
  const [wasGiven, setWasGiven] = useState(node.state === "given");

  // A new refusal from the caller (the server's own check) shows under the input and takes focus.
  if (controls?.problems !== seen) {
    setSeen(controls?.problems);
    const named = controls?.problems?.find((p) => p.path === "payload.name");
    if (named !== undefined) {
      setProblem(named.kind === "too-long" ? "too-long" : "required");
      setFocus({ on: "input" });
    }
  }

  // The name landed: focus the Working name heading, where it reads on.
  if (node.state === "given" && !wasGiven) {
    setWasGiven(true);
    setFocus({ on: "heading" });
  }
  useEffect(() => {
    if (focus === null) return;
    const target = {
      input: () => editorBox.current?.querySelector<HTMLElement>("input"),
      opener: () => row.current?.querySelector<HTMLElement>('[data-choice="give"]'),
      heading: () => heading.current,
    }[focus.on];
    target()?.focus();
  }, [focus]);

  const given = node.state === "given";
  const editor = controls?.editor?.node === "name" && !given ? controls.editor : null;
  // A given name has no editor left to keep.
  const editorOpen = controls?.editor?.node === "name";
  const onEditor = controls?.onEditor;
  useEffect(() => {
    if (given && editorOpen) onEditor?.(null);
  }, [given, editorOpen, onEditor]);

  const busy = controls?.pending != null;
  const inert = busy || undefined;

  // `Button` swallows a press while it is `aria-disabled` or loading, so no handler checks `busy`.
  const openEditor = () => {
    setProblem(null);
    controls?.onEditor({ node: "name", name: "" });
    setFocus({ on: "input" });
  };
  const cancel = () => {
    setProblem(null);
    controls?.onEditor(null);
    controls?.onDismiss?.();
    setFocus({ on: "opener" });
  };
  const save = () => {
    if (editor === null || controls === undefined) return;
    const checked = checkEntry({
      projectId: NO_PROJECT,
      node: "name",
      kind: "given",
      payload: { name: editor.name },
    });
    if (!checked.ok) {
      setProblem(checked.problems[0]?.kind ?? "required");
      setFocus({ on: "input" });
      return;
    }
    controls.onEnter({ node: "name", kind: "given", payload: { name: editor.name } });
  };

  if (editor !== null && controls !== undefined) {
    const error =
      problem === null
        ? undefined
        : problem === "too-long"
          ? fill(m.business.intake.tooLong, { max: String(WORKING_NAME_MAX) })
          : m.business.name.required;
    return (
      <div ref={editorBox} className="flex min-w-0 flex-col gap-3" data-editor>
        <Field label={m.business.field.workingName} required error={error}>
          <Input
            size="md"
            value={editor.name}
            autoComplete="off"
            onChange={(event) => {
              setProblem(null);
              controls.onEditor({ ...editor, name: event.target.value });
            }}
          />
        </Field>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2" data-row>
            <Button
              variant="primary"
              data-choice="save"
              loading={busy}
              loadingLabel={m.business.positioning.saving}
              onClick={save}
            >
              {m.business.name.save}
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
        <div className="flex min-w-0 flex-col gap-1" data-field="workingName">
          <h3 ref={heading} tabIndex={-1} className="self-start text-label-md">
            {m.business.field.workingName}
          </h3>
          {node.name === null ? (
            <p className={FIELD_NOTE}>{m.business.state.empty}</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap">
                <bdi>{node.name}</bdi>
              </p>
              <p className={FIELD_NOTE}>{m.business.name.notScreened}</p>
            </>
          )}
        </div>
      </div>
      {controls === undefined || !node.controls.includes("give") ? null : (
        <div className="flex min-w-0 flex-col">
          <div ref={row} className="flex flex-wrap items-center gap-2" data-row>
            <Button variant="primary" data-choice="give" aria-disabled={inert} onClick={openEditor}>
              {m.business.name.give}
            </Button>
          </div>
          <FailureRegion line={controls.failure} />
        </div>
      )}
    </>
  );
}
