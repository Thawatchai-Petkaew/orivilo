"use client";

import {
  type Face,
  type FoundationNode,
  TYPOGRAPHY_SCRIPTS,
  type TypographyScripts,
} from "@orivilo/intent-engine";
import { useEffect, useRef, useState } from "react";
import { Button, Field, RadioGroup, RadioGroupItem } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import {
  decisionRule,
  faceBecause,
  FIELD_NOTE,
  foundationFieldLabel,
  licenceLine,
  scriptsWord,
  styleWord,
} from "./business-text";
import { ByRuleLabel } from "./expression-parts";
import { FailureRegion } from "./foundation-parts";
import type { FoundationControls } from "./foundation-view";

/**
 * The Typography view (ORV-298 design section 6, `typography-node-1`). One question with three
 * answers and nothing checked when it opens; the answer is stored, and the families that follow from
 * it are worked out by a fixed rule each time the view is built: for each role the Thai family
 * first, then the Latin one, each with its style, its licence and, for a Thai family, the reason of
 * its role. The family and licence names are plain text in the page's font, as written and the same
 * in both languages, never a specimen set in the family. The choice sits in the view, so it has no
 * Cancel: nothing opens that could be left. Which controls show, and what is decided, comes from
 * the node's own fields, never from a state this view decides.
 */

type TypographyNode = Extract<FoundationNode, { id: "typography" }>;

/** The rule id of the one decision this node makes, shown on its rule line. */
const RULE = "typography-node-1";

/** One role's families, Thai first, as the engine listed them. */
function Faces({ faces }: { faces: readonly Face[] }) {
  const m = useMessages();
  return (
    <div className="flex min-w-0 flex-col gap-3" data-faces>
      {faces.map((face) => {
        const because = faceBecause(m, face);
        return (
          <div key={face.id} className="flex min-w-0 flex-col gap-1" data-face>
            <p data-value>{face.family}</p>
            <p className={FIELD_NOTE}>{styleWord(m, face.style)}</p>
            <p className={FIELD_NOTE}>{licenceLine(m, face)}</p>
            {because === null ? null : <p className={FIELD_NOTE}>{because}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function TypographyView({
  node,
  controls,
}: {
  node: TypographyNode;
  controls?: FoundationControls | undefined;
}) {
  const m = useMessages();
  const fields = useRef<HTMLDivElement>(null);
  const choiceBox = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<TypographyScripts | null>(null);
  const [missing, setMissing] = useState(false);
  const [focusRadio, setFocusRadio] = useState(0);
  const [focusRegion, setFocusRegion] = useState(0);
  const [seen, setSeen] = useState(controls?.problems);
  const [wasAnswered, setWasAnswered] = useState(node.scripts !== null);

  // A refusal from the caller (the server's own check) asks for the choice again: nothing is
  // checked, so the error never contradicts a checked answer, and the first radio takes focus.
  if (controls?.problems !== seen) {
    setSeen(controls?.problems);
    if (controls?.problems?.some((p) => p.path === "payload.scripts")) {
      setChoice(null);
      setMissing(true);
      setFocusRadio((n) => n + 1);
    }
  }
  // The answer landed: focus goes to the view's scroll region, scrolled to its top, so the new
  // state line (a polite status) is read first. No heading takes focus (design 4.4).
  if (node.scripts !== null && !wasAnswered) {
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
    // Three radios and a closed list: with a choice made the entry is whole, so only no choice is refused here.
    controls.onEnter({ node: "typography", kind: "answered", payload: { scripts: choice } });
  };

  const empty = <p className={FIELD_NOTE}>{m.business.state.empty}</p>;
  const { faces } = node;
  const heading = (field: "scripts" | "readingFace" | "displayFace") => (
    <h3 className="self-start text-label-md">{foundationFieldLabel(m, field)}</h3>
  );

  return (
    <div ref={fields} className="flex flex-col gap-6" data-fields>
      {asked ? (
        <div ref={choiceBox} className="flex min-w-0 flex-col gap-3" data-field="scripts">
          <Field
            group
            label={m.business.question.scripts}
            error={missing ? m.business.architecture.choiceRequired : undefined}
          >
            <RadioGroup
              size="md"
              value={choice ?? ""}
              onValueChange={(value) => {
                setMissing(false);
                setChoice(value as TypographyScripts);
              }}
            >
              {TYPOGRAPHY_SCRIPTS.map((scripts) => (
                <RadioGroupItem key={scripts} value={scripts} label={scriptsWord(m, scripts)} />
              ))}
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
        <div className="flex min-w-0 flex-col gap-1" data-field="scripts">
          {heading("scripts")}
          {node.scripts === null ? empty : <p data-value>{scriptsWord(m, node.scripts)}</p>}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1" data-field="readingFace">
        {heading("readingFace")}
        {faces === null ? empty : <Faces faces={faces.reading} />}
      </div>
      <div className="flex min-w-0 flex-col gap-1" data-field="displayFace">
        {heading("displayFace")}
        {faces === null ? empty : <Faces faces={faces.display} />}
      </div>
      {faces === null ? null : (
        <>
          <div className="flex flex-col gap-1" data-decision-foot>
            {faces.pairing ? (
              <p className={FIELD_NOTE}>{m.business.typography.because.pairing}</p>
            ) : null}
            <p className={FIELD_NOTE} data-rule>
              {decisionRule(m, RULE)}
            </p>
          </div>
          <div className="flex flex-col gap-1" data-labels>
            <ByRuleLabel />
            <p className={FIELD_NOTE}>{m.business.typography.oneChoice}</p>
            <p className={FIELD_NOTE}>{m.business.typography.noPersonalityLink}</p>
          </div>
        </>
      )}
    </div>
  );
}
