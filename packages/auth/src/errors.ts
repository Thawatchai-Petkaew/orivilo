import { REQUEST_ID_HEADER } from "./log.ts";

/**
 * The one writer of an error body (ORV-144 `orv144-envelope`). `message` is the fixed text of its
 * code's row, never built from an error object, a path, a query or a request value, so no stack or
 * personal data can reach a body (`orv144-message`). No other code writes an error body.
 */

/** orv144-codes: the spec's table, in its order. Each entry: status, default retryable, message. */
export const ERROR_CODES = {
  BAD_REQUEST: { status: 400, retryable: false, message: "The request is not valid." },
  UNAUTHENTICATED: { status: 401, retryable: false, message: "Sign in to continue." },
  FORBIDDEN: { status: 403, retryable: false, message: "This action is not allowed." },
  NOT_FOUND: { status: 404, retryable: false, message: "Not found." },
  TIMEOUT: { status: 408, retryable: true, message: "The request took too long. Try again." },
  CONFLICT: {
    status: 409,
    retryable: false,
    message: "The request conflicts with the current state.",
  },
  PAYLOAD_TOO_LARGE: { status: 413, retryable: false, message: "The request is too large." },
  INVALID_INPUT: { status: 422, retryable: false, message: "The input is not valid." },
  RATE_LIMITED: { status: 429, retryable: true, message: "Too many requests. Try again later." },
  AI_SPEND_CAP: {
    status: 429,
    retryable: false,
    message: "The workspace has used its AI budget for this month.",
  },
  INTERNAL_ERROR: {
    status: 500,
    retryable: false,
    message: "Something went wrong on our side.",
  },
  UPSTREAM_FAILED: {
    status: 502,
    retryable: true,
    message: "A service we depend on failed. Try again later.",
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    retryable: true,
    message: "Service unavailable. Try again later.",
  },
  UPSTREAM_TIMEOUT: {
    status: 504,
    retryable: true,
    message: "A service we depend on did not answer in time. Try again later.",
  },
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

export interface ErrorBody {
  error: { code: ErrorCode; message: string; requestId: string; retryable: boolean };
}

/**
 * orv144-codes: the code of a status of 400 or more; an unlisted 4xx is BAD_REQUEST, an unlisted 5xx
 * INTERNAL_ERROR. Where two codes share a status the first listed is the status's code, so 429 is
 * RATE_LIMITED and AI_SPEND_CAP is no status's code: only the spend cap path names it (ORV-121).
 */
export function codeOfStatus(status: number): ErrorCode {
  const listed = (Object.keys(ERROR_CODES) as ErrorCode[]).find(
    (code) => ERROR_CODES[code].status === status,
  );
  if (listed !== undefined) return listed;
  return status < 500 ? "BAD_REQUEST" : "INTERNAL_ERROR";
}

/** orv144-envelope and orv144-message: the body, keys in the order code, message, requestId, retryable. */
export function errorBody(code: ErrorCode, requestId: string): ErrorBody {
  const { message, retryable } = ERROR_CODES[code];
  return { error: { code, message, requestId, retryable } };
}

/**
 * The one writer of an error answer. Status defaults to the code's; `headers` are copied first
 * (each Set-Cookie kept), then `content-type: application/json` and `x-request-id` are set, so
 * neither can come from the copy.
 */
export function errorResponse(
  code: ErrorCode,
  requestId: string,
  init: { status?: number; headers?: ConstructorParameters<typeof Headers>[0] } = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  headers.set(REQUEST_ID_HEADER, requestId);
  return new Response(JSON.stringify(errorBody(code, requestId)), {
    status: init.status ?? ERROR_CODES[code].status,
    headers,
  });
}

/** orv144-outcome: the three fields a server action failure adds, `retryable` as the code's literal. */
export function failureFields<C extends ErrorCode>(
  code: C,
  requestId: string,
): { code: C; requestId: string; retryable: (typeof ERROR_CODES)[C]["retryable"] } {
  return { code, requestId, retryable: ERROR_CODES[code].retryable };
}
