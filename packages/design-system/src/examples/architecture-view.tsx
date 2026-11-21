"use client";

import type { FoundationNode } from "@orivilo/intent-engine";
import { useEffect, useRef, useState } from "react";
import { Button, Field, RadioGroup, RadioGroupItem } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import { FIELD_NOTE } from "./business-text";
import { FailureRegion } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Brand architecture view (ORV-291 design section 8, `architecture-derive-1`). One question with
 * two answers and nothing checked when it opens; the answer "no" is worked out by a fixed rule as a
 * single brand, the answer "yes" is stored and said to be outside this version. The choice sits in
 * the view, so it has no Cancel: nothing opens that could be left. Which controls show comes from
 * `node.controls`, never from a state this view decides.
 */

type ArchitectureNode = Extract<FoundationNode, { id: "architecture" }>;
type Choice = "no" | "yes";

export function ArchitectureView({
  node,
  controls,
}: {
  node: ArchitectureNode;
  controls?: FoundationControls | undefined;
}) {
  const m = useMessages();
  const heading = useRef<HTMLHeadingElement>(null);
  const choiceBox = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [missing, setMissing] = useState(false);
  const [focusRadio, setFocusRadio] = useState(0);
  const [seen, setSeen] = useState(controls?.problems);
  const [wasAnswered, setWasAnswered] = useState(node.subBrands !== null);
  const [focusHeading, setFocusHeading] = useState(0);

  // A refusal from the caller (the server's own check) asks for a choice and takes focus.
  if (controls?.problems !== seen) {
    setSeen(controls?.problems);
    if (controls?.problems?.some((p) => p.path === "payload.subBrands")) {
      setMissing(true);
      setFocusRadio((n) => n + 1);
    }
  }
  // The answer landed: focus the Architecture heading, where the new value reads on.
  if (node.subBrands !== null && !wasAnswered) {
    setWasAnswered(true);
    setFocusHeading((n) => n + 1);
  }
  useEffect(() => {
    if (focusHeading > 0) heading.current?.focus();
  }, [focusHeading]);
  useEffect(() => {
    // The first radio takes focus; focus alone never checks it.
    if (focusRadio > 0) choiceBox.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
  }, [focusRadio]);

  const busy = controls?.pending != null;
  const asked = controls !== undefined && node.controls.includes("answer");

  const save = () => {
    if (controls === undefined) return;
    if (choice === null) {
      setMissing(true);
      setFocusRadio((n) => n + 1);
      return;
    }
    // Two radios and a boolean: with a choice made, the entry is whole, so only no choice is refused here.
    controls.onEnter({
      node: "architecture",
      kind: "answered",
      payload: { subBrands: choice === "yes" },
    });
  };

  const answer =
    node.subBrands === null
      ? null
      : node.subBrands
        ? m.business.architecture.yes
        : m.business.architecture.no;
  const fallback = m.business.state.empty;

  return (
    <div className="flex flex-col gap-6" data-fields>
      {asked ? (
        <div ref={choiceBox} className="flex min-w-0 flex-col gap-3" data-field="subBrands">
          <Field
            group
            label={m.business.question.subBrands}
            error={missing ? m.business.architecture.choiceRequired : undefined}
          >
            <RadioGroup
              size="md"
              value={choice ?? ""}
              onValueChange={(value) => {
                setMissing(false);
                setChoice(value as Choice);
              }}
            >
              <RadioGroupItem value="no" label={m.business.architecture.no} />
              <RadioGroupItem value="yes" label={m.business.architecture.yes} />
            </RadioGroup>
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
                {m.business.architecture.save}
              </Button>
            </div>
            <FailureRegion line={controls.failure} />
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-1" data-field="subBrands">
          <h3 className="self-start text-label-md">{m.business.field.subBrands}</h3>
          <p className={answer === null ? FIELD_NOTE : undefined}>{answer ?? fallback}</p>
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1" data-field="architecture">
        <h3 ref={heading} tabIndex={-1} className="self-start text-label-md">
          {m.business.field.architecture}
        </h3>
        {node.value !== null ? (
          <>
            <p>{m.business.architecture.single}</p>
            <p className={FIELD_NOTE}>{m.business.architecture.because}</p>
          </>
        ) : node.subBrands === true ? (
          <p className={FIELD_NOTE}>{m.business.architecture.notInVersion}</p>
        ) : (
          <p className={FIELD_NOTE}>{fallback}</p>
        )}
      </div>
    </div>
  );
}
