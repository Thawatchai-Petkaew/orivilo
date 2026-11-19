"use client";

import { useMessages } from "@orivilo/design-system";
import { BusinessBoardScreen, type ChoiceRequest } from "@orivilo/design-system/examples";
import { type BusinessView, checkChoice } from "@orivilo/intent-engine";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { WebMessages } from "../../../i18n/messages";
import { errorLine, failureLines } from "../../../i18n/wait";
import { choosePositioning, draftPositioning } from "../positioning-actions";

/** What either action answers; the one outcome a request leaves in state. */
type Answered =
  Awaited<ReturnType<typeof choosePositioning>> | Awaited<ReturnType<typeof draftPositioning>>;

/** The four reasons a draft request stops (`positioning-honest-1`): the screen has a line for each. */
type Stopped = "ai-not-configured" | "ai-failed" | "ai-rate-limited" | "ai-spend-cap";
const isStop = (error: string): error is Stopped =>
  error === "ai-not-configured" ||
  error === "ai-failed" ||
  error === "ai-rate-limited" ||
  error === "ai-spend-cap";

/**
 * What the last request gave: the server's answer, no answer at all, or the wrapper's own check
 * refusing the statement before any call. One state, so a language switch redraws the line too.
 */
type Last =
  | { kind: "answer"; outcome: Answered }
  | { kind: "rejected" }
  | { kind: "stopped"; reason: Stopped }
  | { kind: "invalid"; problem: "required" | "too-long" }
  | { kind: "running"; request: "saving" | "drafting" };

type Labels = {
  errors: WebMessages["saved"]["errors"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
};

/** A rejected call has no answer to show. It is never retried: a server action has no idempotency key. */
async function settle(call: () => Promise<Answered>, rejected: Last): Promise<Last> {
  try {
    const outcome = await call();
    return !outcome.ok && isStop(outcome.error)
      ? { kind: "stopped", reason: outcome.error }
      : { kind: "answer", outcome };
  } catch {
    return rejected;
  }
}

/** The statement's own problem, which the field shows: the wrapper's check or the server's refusal. */
function problemOf(last: Last | null): "required" | "too-long" | null {
  if (last === null || last.kind === "rejected" || last.kind === "stopped") return null;
  if (last.kind === "running") return null;
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
  if (last === null || last.kind === "invalid" || last.kind === "stopped") return undefined;
  if (last.kind === "running") return undefined;
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
 * The wiring of the Positioning gate (ORV-285 tech notes section 5.3, ORV-292): it renders the board,
 * keeps the last outcome in state, and calls `choosePositioning` or `draftPositioning` in a
 * transition. It checks a choice before it calls out, so an empty statement and one past its bound
 * make no server call, and a second press while a request runs is ignored. On a saved choice or a
 * stored draft it asks the page to build the view again, inside the same transition, so the buttons
 * stay disabled until the new view arrives. The view holds keys and values, so a language switch
 * redraws with no second load. Cancel and closing the viewer call `onDismiss`, which drops the last
 * outcome, so a failure never outlives its editor. An answer that arrives after the viewer closed is
 * dropped too (spec row 29), and a stopped draft is never kept past the view it came in (row 24): it
 * is a reason, not text, so the screen draws its line in the language it has. Its `errors`, `wait`
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
  // How many times the viewer was closed since the page opened: an answer that finds the count
  // changed belongs to a view that is gone. Read in handlers only, never in render.
  const closed = useRef(0);

  const start = (request: "saving" | "drafting", call: () => Promise<Answered>, rejected: Last) => {
    const closedThen = closed.current;
    setLast({ kind: "running", request });
    startTransition(async () => {
      const next = await settle(call, rejected);
      setLast(closed.current === closedThen ? next : null);
      if (next.kind === "answer" && next.outcome.ok) router.refresh();
    });
  };

  const onChoose = (request: ChoiceRequest) => {
    if (pending) return;
    const checked = checkChoice({ ...request, projectId });
    if (!checked.ok) {
      const tooLong = checked.problems.some((p) => p.path === "statement" && p.kind === "too-long");
      setLast({ kind: "invalid", problem: tooLong ? "too-long" : "required" });
      return;
    }
    start("saving", () => choosePositioning(checked.choice), { kind: "rejected" });
  };

  const onDraft = () => {
    if (pending) return;
    start("drafting", () => draftPositioning({ projectId }), {
      kind: "stopped",
      reason: "ai-failed",
    });
  };

  return (
    <BusinessBoardScreen
      access="ready"
      view={view}
      signInHref="/account"
      listHref="/business"
      positioning={{
        pending: pending ? (last?.kind === "running" ? last.request : "saving") : null,
        problem: problemOf(last),
        failure: failureOf(last, { errors, wait, failure }, m),
        stopped: last?.kind === "stopped" ? last.reason : undefined,
        onChoose,
        onDraft,
        onDismiss: () => {
          closed.current += 1;
          // A request still running keeps its state, so a reopened viewer shows it busy.
          setLast(last?.kind === "running" ? last : null);
        },
      }}
    />
  );
}
