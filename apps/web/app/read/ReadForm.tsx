"use client";

import { useMessages } from "@orivilo/design-system";
import { BrandReportScreen } from "@orivilo/design-system/examples";
import type { InputRole, ReportView } from "@orivilo/intent-engine";
import { useState, useTransition } from "react";
import type { WebMessages } from "../../i18n/messages";
import { errorLine, failureLines } from "../../i18n/wait";
import type { Outcome } from "../directions/actions";
import { analysePage } from "./actions";

/** What the last call gave: the server's answer, or no answer at all. */
type Last = { kind: "answer"; outcome: Outcome<ReportView> } | { kind: "rejected" };

type Labels = {
  errors: WebMessages["saved"]["errors"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
};

/** A rejected call has no answer to show. It is never retried: a server action has no idempotency key. */
async function settle(call: () => Promise<Outcome<ReportView>>): Promise<Last> {
  try {
    return { kind: "answer", outcome: await call() };
  } catch {
    return { kind: "rejected" };
  }
}

/**
 * The line for a call that gave no report, or undefined when it gave one. The state keeps the
 * outcome and not this text, so a language switch redraws the line too (ORV-266 tech notes section 7).
 */
function failureOf(
  last: Last | null,
  labels: Labels,
  m: ReturnType<typeof useMessages>,
): string | undefined {
  if (last === null) return undefined;
  if (last.kind === "rejected") return labels.errors.failed;
  const { outcome } = last;
  if (outcome.ok) return undefined;
  switch (outcome.error) {
    // The form sends a chosen role and no extra key, so only text over the limit gets here.
    case "invalid-input":
      return m.brandReport.engine["read.refused.address"];
    case "not-configured":
      return m.brandReport.notConfigured;
    // The address left the list after the form opened (read-door-1 step 2).
    case "forbidden":
      return m.brandReport.notAllowed;
    case "rate-limited":
      return errorLine(labels.errors, labels.wait, outcome.error, outcome.retryAfter);
    default:
      if (outcome.code === "SERVICE_UNAVAILABLE") return m.brandReport.unavailable;
      return failureLines(labels, { ...outcome, error: outcome.error }).join(" ");
  }
}

/**
 * The form wiring of the brand report: it renders the screen, keeps the last outcome in state, and
 * calls `analysePage` in a transition. The screen owns the field text, so it stays after any outcome.
 * Its `errors`, `wait` and `failure` come from the page, as `SavedStudio` gets them.
 */
export function ReadForm({ errors, wait, failure }: Labels) {
  const m = useMessages();
  const [last, setLast] = useState<Last | null>(null);
  const [pending, startTransition] = useTransition();

  const read = (input: { url: string; role: InputRole }) =>
    startTransition(async () => {
      setLast(await settle(() => analysePage(input)));
    });

  const view = last?.kind === "answer" && last.outcome.ok ? last.outcome.value : null;
  return (
    <BrandReportScreen
      access="form"
      view={view}
      pending={pending}
      failure={failureOf(last, { errors, wait, failure }, m)}
      onRead={read}
    />
  );
}
