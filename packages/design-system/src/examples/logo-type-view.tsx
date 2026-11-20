"use client";

import type { FoundationNode } from "@orivilo/intent-engine";
import { useEffect, useRef, useState } from "react";
import { Button, Field, RadioGroup, RadioGroupItem } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import {
  appIconWord,
  decisionRule,
  FIELD_NOTE,
  foundationFieldLabel,
  logoTypeReason,
  logoTypeWord,
  nameLengthLine,
} from "./business-text";
import { ByRuleLabel, DecisionLine } from "./expression-parts";
import { FailureRegion } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Logo type view (ORV-298 design section 7, `logo-type-1`). One question with two answers and
 * nothing checked when it opens; the answer is stored, and the logo type that follows from it and
 * from the working name is worked out by a fixed rule each time the view is built: the type, each
 * reason in the order the engine gave, the name length line and the rule. The working name in that
 * line is the person's text: a text node in `bdi` on a line that keeps its white space, never parsed
 * and never HTML. The choice sits in the view, so it has no Cancel: nothing opens that could be
 * left. Which controls show, and what is decided, comes from the node's own fields, never from a
 * state this view decides.
 */

type LogoTypeNode = Extract<FoundationNode, { id: "logo-type" }>;

/** The rule id of the one decision this node makes, shown on its rule line. */
const RULE = "logo-type-1";

export function LogoTypeView({
  node,
  controls,
}: {
  node: LogoTypeNode;
  controls?: FoundationControls | undefined;
}) {
  const m = useMessages();
  const fields = useRef<HTMLDivElement>(null);
  const choiceBox = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [missing, setMissing] = useState(false);
  const [focusRadio, setFocusRadio] = useState(0);
  const [focusRegion, setFocusRegion] = useState(0);
  const [seen, setSeen] = useState(controls?.problems);
  const [wasAnswered, setWasAnswered] = useState(node.appIcon !== null);

  // A refusal from the caller (the server's own check) asks for the choice again: nothing is
  // checked, so the error never contradicts a checked answer, and the first radio takes focus.
  if (controls?.problems !== seen) {
    setSeen(controls?.problems);
    if (controls?.problems?.some((p) => p.path === "payload.appIcon")) {
      setChoice(null);
      setMissing(true);
      setFocusRadio((n) => n + 1);
    }
  }
  // The answer landed: focus goes to the view's scroll region, scrolled to its top, so the new
  // state line (a polite status) is read first. No heading takes focus (design 4.4).
  if (node.appIcon !== null && !wasAnswered) {
    setWasAnswered(true);
    setFocusRegion((n) => n + 1);
  }
  useEffect(() => {
    if (focusRegion === 0) return;
    const region = fields.current?.closest<HTMLElement>('[role="region"]');
    region?.focus();
    if (region) region.scrollTop = 0;
  }, [focusRegion]);
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
    // Two radios and a closed list: with a choice made the entry is whole, so only no choice is refused here.
    controls.onEnter({ node: "logo-type", kind: "answered", payload: { appIcon: choice } });
  };

  const { decision } = node;
  const empty = <p className={FIELD_NOTE}>{m.business.state.empty}</p>;
  // A long name needs no answer, so with none stored the question is not asked and the field is not shown (row L8).
  const notAsked = !asked && node.appIcon === null && decision?.reasons.includes("longName");
  const length = decision === null ? null : nameLengthLine(m, decision);

  return (
    <div ref={fields} className="flex flex-col gap-6" data-fields>
      {asked ? (
        <div ref={choiceBox} className="flex min-w-0 flex-col gap-3" data-field="appIcon">
          <Field
            group
            label={m.business.question.appIcon}
            error={missing ? m.business.architecture.choiceRequired : undefined}
          >
            <RadioGroup
              size="md"
              value={choice === null ? "" : choice ? "yes" : "no"}
              onValueChange={(value) => {
                setMissing(false);
                setChoice(value === "yes");
              }}
            >
              <RadioGroupItem value="yes" label={m.business.logoType.appIcon.yes} />
              <RadioGroupItem value="no" label={m.business.logoType.appIcon.no} />
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
      ) : notAsked ? null : (
        <div className="flex min-w-0 flex-col gap-1" data-field="appIcon">
          <h3 className="self-start text-label-md">{foundationFieldLabel(m, "appIcon")}</h3>
          {node.appIcon === null ? empty : <p data-value>{appIconWord(m, node.appIcon)}</p>}
        </div>
      )}
      {decision === null || length === null ? (
        <div className="flex min-w-0 flex-col gap-1" data-field="logoType">
          <h3 className="self-start text-label-md">{foundationFieldLabel(m, "logoType")}</h3>
          {empty}
        </div>
      ) : (
        <>
          <DecisionLine
            field="logoType"
            value={logoTypeWord(m, decision.type)}
            reasons={decision.reasons.map((reason) => logoTypeReason(m, reason))}
            rule={decisionRule(m, RULE)}
          >
            <p className={`${FIELD_NOTE} whitespace-pre-wrap`} data-name-length>
              {length.before}
              <bdi>{decision.name}</bdi>
              {length.after}
            </p>
          </DecisionLine>
          <div className="flex flex-col gap-1" data-labels>
            <ByRuleLabel />
            <p className={FIELD_NOTE}>{m.business.logoType.hypothesis}</p>
            <p className={FIELD_NOTE}>{m.business.logoType.crowdingNotChecked}</p>
            <p className={FIELD_NOTE}>{m.business.logoType.otherTypes}</p>
          </div>
        </>
      )}
    </div>
  );
}
