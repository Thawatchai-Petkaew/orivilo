import type { WebMessages } from "./messages";

type SavedErrors = WebMessages["saved"]["errors"];

/**
 * How long to wait, in words (ORV-112): seconds under a minute, else whole minutes rounded up
 * under an hour, else whole hours rounded up. A wait that rounds up to 60 minutes reads as 1 hour. Computed once from the server's `retryAfter`.
 */
export function formatWait(m: WebMessages["wait"], seconds: number): string {
  const [unit, n] =
    seconds < 60
      ? (["seconds", Math.ceil(seconds)] as const)
      : seconds <= 3540
        ? (["minutes", Math.ceil(seconds / 60)] as const)
        : (["hours", Math.ceil(seconds / 3600)] as const);
  return m[unit][n === 1 ? "one" : "other"].replace("{n}", String(n));
}

/**
 * The line for a failed call. A refusal by a rate limit carries the wait and says it in words;
 * without a usable wait it falls back to the plain failure text rather than print an empty one.
 */
export function errorLine(
  errors: SavedErrors,
  wait: WebMessages["wait"],
  error: keyof SavedErrors,
  retryAfter?: number,
): string {
  if (error !== "rate-limited" && error !== "ai-rate-limited") return errors[error];
  if (typeof retryAfter !== "number" || !Number.isFinite(retryAfter) || retryAfter <= 0) {
    return errors.failed;
  }
  return errors[error].replace("{wait}", formatWait(wait, retryAfter));
}
