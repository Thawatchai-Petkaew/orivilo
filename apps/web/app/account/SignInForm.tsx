"use client";

import { Badge, Button } from "@orivilo/design-system";
import { useActionState } from "react";
import type { SignInState } from "./actions";
import { signInLine, type SignInLabels } from "./sign-in-line";

/** The notice under the button: the `account.problem` word, then the line (design.md D2). */
function SignInNotice({ state, labels }: { state: SignInState; labels: SignInLabels }) {
  const line = signInLine(state, labels);
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      {line ? (
        <>
          <span>
            <Badge variant="danger" size="sm">
              {labels.account.problem}
            </Badge>
          </span>
          <p className="text-body-md text-pretty">{line}</p>
        </>
      ) : null}
    </div>
  );
}

export function SignInForm({
  action,
  labels,
}: {
  action: (previous: SignInState, form: FormData) => Promise<SignInState>;
  labels: SignInLabels;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-body-md text-text-secondary">{labels.account.signedOut}</p>
      <div>
        <Button type="submit" variant="primary" loading={pending}>
          {labels.account.signInWithGoogle}
        </Button>
      </div>
      <SignInNotice state={state} labels={labels} />
    </form>
  );
}
