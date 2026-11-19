"use client";

import { useMessages } from "@orivilo/design-system";
import { BusinessBoardScreen, type ChoiceRequest } from "@orivilo/design-system/examples";
import { type BusinessView, checkChoice } from "@orivilo/intent-engine";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WebMessages } from "../../../i18n/messages";
import { errorLine, failureLines } from "../../../i18n/wait";
import { choosePositioning } from "../positioning-actions";

type Chosen = Awaited<ReturnType<typeof choosePositioning>>;

/**
 * What the last request gave: the server's answer, no answer at all, or the wrapper's own check
 * refusing the statement before any call. One state, so a language switch redraws the line too.
 */
type Last =
  | { kind: "answer"; outcome: Chosen }
  | { kind: "rejected" }
  | { kind: "invalid"; problem: "required" | "too-long" };

type Labels = {
  errors: WebMessages["saved"]["errors"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
};

/** A rejected call has no answer to show. It is never retried: a server action has no idempotency key. */
async function settle(call: () => Promise<Chosen>): Promise<Last> {
  try {
    return { kind: "answer", outcome: await call() };
  } catch {
    return { kind: "rejected" };
  }
}

/** The statement's own problem, which the field shows: the wrapper's check or the server's refusal. */
function problemOf(last: Last | null): "required" | "too-long" | null {
  if (last === null || last.kind === "rejected") return null;
  if (last.kind === "invalid") return last.problem;
  const { outcome } = last;
  if (outcome.ok || !("problems" in outcome)) return null;
  const found = outcome.problems.find((p) => p.path === "statement");
  return found?.kind === "too-long" ? "too-long" : found === undefined ? null : "required";
}

/**
 * The line for a request that did not save, or undefined. The state keeps the outcome and not this
 * text, so a language switch redraws the line. A refusal of the statement shows on its field and has
 * no line of its own.
 */
function failureOf(
  last: Last | null,
  labels: Labels,
  m: ReturnType<typeof useMessages>,
): string | undefined {
  if (last === null || last.kind === "invalid") return undefined;
  if (last.kind === "rejected") return labels.errors.failed;
  const { outcome } = last;
  if (outcome.ok || problemOf(last) !== null) return undefined;
  switch (outcome.error) {
    // The screen checks first, so the server refusing with no field to point at is not the person's to fix:
    // it is a project already agreed, or a stale page.
    case "invalid-input":
      return labels.errors.failed;
    case "not-configured":
      return m.business.notConfigured;
    // The address left the list after the page opened (`positioning-door-1` step 2).
    case "forbidden":
      return m.business.notAllowed;
    case "rate-limited":
      return errorLine(labels.errors, labels.wait, outcome.error, outcome.retryAfter);
    default:
      return failureLines(labels, { ...outcome, error: outcome.error }).join(" ");
  }
}

/**
 * The wiring of the Positioning gate (ORV-285 tech notes section 5.3): it renders the board, keeps
 * the last outcome in state, and calls `choosePositioning` in a transition. It checks the choice
 * before it calls out, so an empty statement and one past its bound make no server call, and a
 * second press while a request runs is ignored. On a saved choice it asks the page to build the view
 * again, inside the same transition, so the buttons stay disabled until the new view arrives. The
 * view holds keys and values, so a language switch redraws with no second load. Cancel and closing
 * the viewer call `onDismiss`, which drops the last outcome, so a failure never outlives its editor. Its `errors`, `wait`
 * and `failure` come from the page.
 */
export function ProjectBoard({
  view,
  projectId,
  errors,
  wait,
  failure,
}: Labels & { view: BusinessView; projectId: string }) {
  const m = useMessages();
  const router = useRouter();
  const [last, setLast] = useState<Last | null>(null);
  const [pending, startTransition] = useTransition();

  const onChoose = (request: ChoiceRequest) => {
    if (pending) return;
    const checked = checkChoice({ ...request, projectId });
    if (!checked.ok) {
      const tooLong = checked.problems.some((p) => p.path === "statement" && p.kind === "too-long");
      setLast({ kind: "invalid", problem: tooLong ? "too-long" : "required" });
      return;
    }
    setLast(null);
    startTransition(async () => {
      const next = await settle(() => choosePositioning(checked.choice));
      setLast(next);
      if (next.kind === "answer" && next.outcome.ok) router.refresh();
    });
  };

  return (
    <BusinessBoardScreen
      access="ready"
      view={view}
      signInHref="/account"
      listHref="/business"
      positioning={{
        pending: pending ? "saving" : null,
        problem: problemOf(last),
        failure: failureOf(last, { errors, wait, failure }, m),
        onChoose,
        onDismiss: () => setLast(null),
      }}
    />
  );
}
