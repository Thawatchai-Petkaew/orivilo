import { fill } from "@orivilo/design-system";
import type { WebMessages } from "../../i18n/messages";
import { formatWait } from "../../i18n/wait";
import type { SignInState } from "./actions";

export interface SignInLabels {
  account: WebMessages["account"];
  wait: WebMessages["wait"];
  /** The plain failure line, `saved.errors.failed`. */
  failed: string;
}

/**
 * The sentence under the sign-in button, or `null` before any refusal. A wait that is not a
 * positive number falls back to the plain failure line rather than print an empty one.
 */
export function signInLine(state: SignInState, labels: SignInLabels): string | null {
  if (!state) return null;
  if (state.error === "rate-limited" && Number.isFinite(state.retryAfter) && state.retryAfter > 0) {
    return fill(labels.account.rateLimited, { wait: formatWait(labels.wait, state.retryAfter) });
  }
  return labels.failed;
}
