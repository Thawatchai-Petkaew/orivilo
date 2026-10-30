import { fill } from "@orivilo/design-system";
import type { WebMessages } from "../../i18n/messages";
import { formatWait, referenceLine } from "../../i18n/wait";
import type { SignInState } from "./actions";

export interface SignInLabels {
  account: WebMessages["account"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
}

/**
 * The sentences under the sign-in button; `retry` is kept whole on one line (design.md R2).
 * `reference` is the reference line, only for an `INTERNAL_ERROR` state (orv144-ui).
 */
export interface SignInLine {
  reason: string;
  retry?: string;
  reference?: string;
}

/**
 * The line under the sign-in button, or `null` before any refusal. A wait that is not a positive
 * number falls back to the plain failure line (`account.failed`) rather than print an empty one.
 */
export function signInLine(state: SignInState, labels: SignInLabels): SignInLine | null {
  if (!state) return null;
  if (state.error === "rate-limited" && Number.isFinite(state.retryAfter) && state.retryAfter > 0) {
    return {
      reason: labels.account.limitReason,
      retry: fill(labels.account.limitRetry, { wait: formatWait(labels.wait, state.retryAfter) }),
    };
  }
  const reference = referenceLine(labels.failure, state);
  return reference === null
    ? { reason: labels.account.failed }
    : { reason: labels.account.failed, reference };
}
