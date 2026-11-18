"use client";

import { useMessages } from "@orivilo/design-system";
import { BusinessIntakeScreen } from "@orivilo/design-system/examples";
import type { Intake } from "@orivilo/intent-engine";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WebMessages } from "../../../i18n/messages";
import { errorLine, failureLines } from "../../../i18n/wait";
import { createProject, type IntakeRefused } from "../actions";

type Saved = Awaited<ReturnType<typeof createProject>>;

/** What the last call gave: the server's answer, or no answer at all. */
type Last = { kind: "answer"; outcome: Saved } | { kind: "rejected" };

type Labels = {
  errors: WebMessages["saved"]["errors"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
};

/** A rejected call has no answer to show. It is never retried: a server action has no idempotency key. */
async function settle(call: () => Promise<Saved>): Promise<Last> {
  try {
    return { kind: "answer", outcome: await call() };
  } catch {
    return { kind: "rejected" };
  }
}

const isRefusal = (outcome: Saved): outcome is IntakeRefused =>
  !outcome.ok && outcome.error === "invalid-input" && "problems" in outcome;

/**
 * The line for a call that did not save, or undefined. The state keeps the outcome and not this
 * text, so a language switch redraws the line too. A refusal of the intake shows on its fields and
 * has no line of its own.
 */
function failureOf(
  last: Last | null,
  labels: Labels,
  m: ReturnType<typeof useMessages>,
): string | undefined {
  if (last === null) return undefined;
  if (last.kind === "rejected") return labels.errors.failed;
  const { outcome } = last;
  if (outcome.ok || isRefusal(outcome)) return undefined;
  switch (outcome.error) {
    // The form checks first, so the server refusing with no field to point at is not the person's to fix.
    case "invalid-input":
      return labels.errors.failed;
    case "not-configured":
      return m.business.notConfigured;
    // The address left the list after the form opened (business-door-1 step 2).
    case "forbidden":
      return m.business.notAllowed;
    case "rate-limited":
      return errorLine(labels.errors, labels.wait, outcome.error, outcome.retryAfter);
    default:
      return failureLines(labels, { ...outcome, error: outcome.error }).join(" ");
  }
}

/**
 * The form wiring of the intake (ORV-281 tech notes section 6.1): it renders the screen, keeps the
 * last outcome in state, and calls `createProject` in a transition. The screen checks the intake
 * before it calls out, so a missing name, a missing idea and an answer over its bound make no
 * server call, and it owns the field text, so it stays after any outcome. On a saved project it
 * goes to the board and stays disabled until the page changes, so a second press never saves a
 * second project. Its `errors`, `wait` and `failure` come from the page.
 */
export function IntakeForm({ errors, wait, failure }: Labels) {
  const m = useMessages();
  const router = useRouter();
  const [last, setLast] = useState<Last | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (intake: Intake) =>
    startTransition(async () => {
      const next = await settle(() => createProject(intake));
      setLast(next);
      if (next.kind === "answer" && next.outcome.ok) {
        router.push(`/business/${next.outcome.value.projectId}`);
      }
    });

  const saved = last?.kind === "answer" && last.outcome.ok;
  const refusal = last?.kind === "answer" && isRefusal(last.outcome) ? last.outcome : undefined;
  return (
    <BusinessIntakeScreen
      access="ready"
      signInHref="/account"
      listHref="/business"
      pending={pending || saved}
      problems={refusal?.problems}
      failure={failureOf(last, { errors, wait, failure }, m)}
      onSubmit={save}
    />
  );
}
