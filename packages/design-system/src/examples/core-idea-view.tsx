"use client";

import {
  ANSWER_MAX_CHARS,
  CORE_IDEA_MAX,
  checkEntry,
  type EntryProblem,
  type EntryRequest,
  type FoundationNode,
} from "@orivilo/intent-engine";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Textarea } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import { fill } from "../i18n/messages/index";
import { FIELD_NOTE } from "./business-text";
import { AnswerField, FailureRegion, NO_PROJECT } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Core idea view and its editor (ORV-291 design section 11, `core-idea-gate-1`), the second
 * gate. Two fields in the person's own words: the one thing to remember (optional) and the core idea
 * (required, 1 to 300 characters). The gate line is the viewer's description, not part of this view.
 * Save checks on the client first (`checkEntry`), so an empty idea and a text past its bound make no
 * call and keep both typed texts; Cancel saves nothing and returns focus to the control that opened
 * the editor. Which controls show comes from `node.controls`, never from a state this view decides.
 * The statement and the answer are text nodes inside `bdi`, never HTML and never a link.
 */

type CoreIdeaNode = Extract<FoundationNode, { id: "core-idea" }>;

const PATHS = { remember: "payload.remember", statement: "payload.statement" } as const;

type Focus = { target: "remember" | "opener" | "heading" } | { target: "failing"; paths: string[] };

export function CoreIdeaView({
  node,
  controls,
}: {
  node: CoreIdeaNode;
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
  const [wasGiven, setWasGiven] = useState(node.gate === "given");
  const [wasSkipped, setWasSkipped] = useState(node.skipped);

  // A new refusal from the caller replaces what is shown and asks for focus on the first field it names.
  if (controls?.problems !== seen) {
    setSeen(controls?.problems);
    setShown(controls?.problems ?? []);
    if (controls?.problems?.length) {
      setFocus({ target: "failing", paths: controls.problems.map((p) => p.path) });
    }
  }
  // The decision landed: an agreed idea (focus the Core idea heading) or a skip (focus the opener).
  if (node.gate === "given" && !wasGiven) {
    setWasGiven(true);
    setFocus({ target: "heading" });
  }
  if (node.skipped && !wasSkipped) {
    setWasSkipped(true);
    setFocus({ target: "opener" });
  }

  useEffect(() => {
    if (focus === null) return;
    const textareas = () => editorBox.current?.querySelectorAll("textarea");
    const target = () => {
      switch (focus.target) {
        case "remember":
          return textareas()?.[0];
        case "opener":
          return row.current?.querySelector<HTMLElement>('[data-choice="writeOwn"]');
        case "heading":
          return heading.current;
        case "failing":
          // DOM order: the answer first, then the core idea.
          return focus.paths.includes(PATHS.remember) ? textareas()?.[0] : textareas()?.[1];
      }
    };
    target()?.focus();
  }, [focus]);

  const given = node.gate === "given";
  const editor = controls?.editor?.node === "core-idea" && !given ? controls.editor : null;
  // An agreed core idea has no editor left to keep.
  const editorOpen = controls?.editor?.node === "core-idea";
  const onEditor = controls?.onEditor;
  useEffect(() => {
    if (given && editorOpen) onEditor?.(null);
  }, [given, editorOpen, onEditor]);

  const busy = controls?.pending != null;
  const inert = busy || undefined;
  const fallback = node.skipped ? m.business.state.skipped : m.business.state.empty;
  const problemAt = (path: string) => shown.find((p) => p.path === path);
  const without = (path: string) => setShown((now) => now.filter((p) => p.path !== path));

  const openEditor = () => {
    if (busy) return;
    setShown([]);
    controls?.onEditor({ node: "core-idea", remember: "", statement: "" });
    setFocus({ target: "remember" });
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
    controls.onEnter({ node: "core-idea", kind: "skipped", payload: {} });
  };
  const save = () => {
    if (editor === null || controls === undefined || busy) return;
    const checked = checkEntry({
      projectId: NO_PROJECT,
      node: "core-idea",
      kind: "written",
      payload: { statement: editor.statement, remember: editor.remember },
    });
    if (!checked.ok) {
      setShown(checked.problems);
      setFocus({ target: "failing", paths: checked.problems.map((p) => p.path) });
      return;
    }
    const request: EntryRequest = {
      node: "core-idea",
      kind: "written",
      payload: {
        statement: editor.statement,
        ...(editor.remember.trim() === "" ? {} : { remember: editor.remember }),
      },
    };
    setPressed("save");
    controls.onEnter(request);
  };

  if (editor !== null && controls !== undefined) {
    const errorOf = (path: string, required: string | undefined, max: number) => {
      const problem = problemAt(path);
      if (problem === undefined) return undefined;
      return problem.kind === "too-long"
        ? fill(m.business.intake.tooLong, { max: String(max) })
        : required;
    };
    return (
      <div ref={editorBox} className="flex min-w-0 flex-col gap-6" data-editor>
        <Field
          label={m.business.question.remember}
          error={errorOf(PATHS.remember, undefined, ANSWER_MAX_CHARS)}
        >
          <Textarea
            size="md"
            rows={3}
            maxRows={8}
            value={editor.remember}
            onChange={(event) => {
              without(PATHS.remember);
              controls.onEditor({ ...editor, remember: event.target.value });
            }}
          />
        </Field>
        <Field
          label={m.business.field.coreIdea}
          required
          error={errorOf(PATHS.statement, m.business.coreIdea.statementRequired, CORE_IDEA_MAX)}
        >
          <Textarea
            size="md"
            rows={3}
            maxRows={8}
            value={editor.statement}
            onChange={(event) => {
              without(PATHS.statement);
              controls.onEditor({ ...editor, statement: event.target.value });
            }}
          />
        </Field>
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
              {m.business.coreIdea.save}
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
          field="remember"
          title={m.business.field.remember}
          text={node.remember}
          fallback={fallback}
          m={m}
        />
        <div className="flex min-w-0 flex-col gap-1" data-field="coreIdea">
          <h3 ref={heading} tabIndex={-1} className="self-start text-label-md">
            {m.business.field.coreIdea}
          </h3>
          {node.statement === null ? (
            <p className={FIELD_NOTE}>{fallback}</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap">
                <bdi>{node.statement.text}</bdi>
              </p>
              <p className={FIELD_NOTE}>{m.business.positioning.by.own}</p>
            </>
          )}
        </div>
      </div>
      {controls === undefined || node.controls.length === 0 ? null : (
        <div className="flex min-w-0 flex-col">
          <div ref={row} className="flex flex-wrap items-center gap-2" data-row>
            {node.controls.includes("writeOwn") ? (
              <Button
                variant="primary"
                data-choice="writeOwn"
                aria-disabled={inert}
                onClick={openEditor}
              >
                {m.business.positioning.writeOwn}
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
