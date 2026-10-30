// orv144-retry: imports nothing (no node: module, no value from @orivilo/auth). The lint rule in
// eslint.config.mjs bans both for this folder.
export const MAX_RETRIES = 3; // ORV-144 open question 5: retries after the first call
export const MAX_WAIT_SECONDS = 10; // ORV-144 open question 7

/** One try's result: an answer, or null when the call rejected with no answer. */
export type Answer = {
  status: number;
  retryAfter: string | null;
  retryable: boolean | null;
} | null;

const BASE_BACKOFF_MS = 500;

/**
 * orv144-retry as one pure decision (the spec's worked example "The retry decision"): the wait in
 * ms before the next try, or null for none. `retries` is the number already made; `r` is in [0, 1).
 */
export function retryDelay(
  call: { method: string; idempotencyKey: string | null },
  answer: Answer,
  retries: number,
  r: number,
): number | null {
  const keyed = call.idempotencyKey !== null && call.idempotencyKey.trim() !== "";
  if (call.method.toUpperCase() !== "GET" && !keyed) return null;
  if (answer?.retryable === false) return null;
  if (retries >= MAX_RETRIES) return null;

  if (answer === null) return backoff(retries, r);
  if (answer.status === 408 || answer.status === 429) {
    if (answer.retryAfter === null || !/^\d+$/.test(answer.retryAfter)) return 1000;
    const seconds = Number(answer.retryAfter);
    return seconds > MAX_WAIT_SECONDS ? null : seconds * 1000;
  }
  if (answer.status === 502 || answer.status === 503 || answer.status === 504) {
    return backoff(retries, r);
  }
  return null;
}

function backoff(retries: number, r: number): number {
  return Math.round(BASE_BACKOFF_MS * 2 ** retries * (0.5 + r));
}

export interface RetryDeps {
  fetch: (input: string | URL, init?: RequestInit) => Promise<Response>;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
}

const defaults: RetryDeps = {
  fetch: (input, init) => globalThis.fetch(input, init),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: () => Math.random(),
};

/** `error.retryable` of an error body, read from a clone; null when there is none to read. */
async function readRetryable(response: Response): Promise<boolean | null> {
  if (response.status < 400) return null;
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) return null;
  try {
    const body: unknown = await response.clone().json();
    const retryable = (body as { error?: { retryable?: unknown } } | null)?.error?.retryable;
    return typeof retryable === "boolean" ? retryable : null;
  } catch {
    return null;
  }
}

/**
 * `fetch` with orv144-retry. The input is a URL, never a `Request`, so a body can be sent again.
 * Resolves with the last answer, or rejects with the last error when the last try had no answer.
 * A call its caller aborted is not retried: its error is the result at once (tech notes D7).
 */
export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  deps?: Partial<RetryDeps>,
): Promise<Response> {
  const { fetch, sleep, random } = { ...defaults, ...deps };
  const call = {
    method: init?.method ?? "GET",
    idempotencyKey: new Headers(init?.headers).get("idempotency-key"),
  };

  for (let retries = 0; ; retries += 1) {
    let response: Response | null = null;
    let failure: unknown;
    try {
      response = await fetch(input, init);
    } catch (error) {
      if (init?.signal?.aborted) throw error;
      failure = error;
    }

    const answer: Answer = response
      ? {
          status: response.status,
          retryAfter: response.headers.get("retry-after"),
          retryable: await readRetryable(response),
        }
      : null;
    const delay = retryDelay(call, answer, retries, random());

    if (delay === null) {
      if (response) return response;
      throw failure;
    }
    await response?.body?.cancel();
    await sleep(delay);
  }
}
