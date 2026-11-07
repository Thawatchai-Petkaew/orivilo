import type { WebMessages } from "../../i18n/messages";
import { failureLines } from "../../i18n/wait";
import type { ActionFailure, Listing, Outcome } from "./actions";

/** What the notice region shows: a tone for the badge and one paragraph per line. */
export interface Notice {
  tone: "info" | "warning" | "danger";
  lines: string[];
}

export interface NoticeLabels {
  errors: WebMessages["saved"]["errors"];
  wait: WebMessages["wait"];
  failure: WebMessages["failure"];
}

/** A failed outcome as a notice: tone danger, the failed line, then the reference when it has one. */
export function failureNotice(labels: NoticeLabels, failure: ActionFailure): Notice {
  return { tone: "danger", lines: failureLines(labels, failure) };
}

/**
 * One server action call from /directions: busy on, the call once, busy off in `finally`. It is
 * never retried: a server action is a POST without an idempotency key (orv144-retry). A failed
 * outcome sets `failureNotice`; a rejected call, which has no answer, sets the network line. Only
 * the call's own rejection is caught, so `done` runs and fails as it always did.
 */
export async function runCall<T>(
  call: () => Promise<Outcome<T>>,
  done: (value: T) => Promise<void> | void,
  ui: { labels: NoticeLabels; setNotice: (n: Notice) => void; setBusy: (on: boolean) => void },
): Promise<void> {
  ui.setBusy(true);
  try {
    let result: Outcome<T>;
    try {
      result = await call();
    } catch {
      ui.setNotice({ tone: "danger", lines: [ui.labels.failure.network] });
      return;
    }
    if (result.ok) await done(result.value);
    else ui.setNotice(failureNotice(ui.labels, result));
  } finally {
    ui.setBusy(false);
  }
}

/** The list again. A failure or a rejection keeps the last list and touches no notice. */
export async function refreshList(
  list: () => Promise<Outcome<Listing>>,
  setListing: (l: Listing) => void,
): Promise<void> {
  try {
    const next = await list();
    if (next.ok) setListing(next.value);
  } catch {
    // No answer: the list on screen stays, and so does the notice the person is reading.
  }
}
