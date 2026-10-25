import type { WebMessages } from "./messages";

/**
 * How long to wait, in words (ORV-112): seconds under a minute, else whole minutes rounded up
 * under an hour, else whole hours rounded up. Computed once from the server's `retryAfter`.
 */
export function formatWait(m: WebMessages["wait"], seconds: number): string {
  const [unit, n] =
    seconds < 60
      ? (["seconds", Math.ceil(seconds)] as const)
      : seconds < 3600
        ? (["minutes", Math.ceil(seconds / 60)] as const)
        : (["hours", Math.ceil(seconds / 3600)] as const);
  return m[unit][n === 1 ? "one" : "other"].replace("{n}", String(n));
}
