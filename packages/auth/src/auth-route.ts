import { codeOfStatus, errorResponse } from "./errors.ts";
import {
  atBoundary,
  type Ended,
  endingOfStatus,
  type Reason,
  REQUEST_ID_HEADER,
  requestIdOf,
} from "./log.ts";
import { type Consumed, RateLimitUnavailable } from "./rate-limit.ts";

const rateLimited = (requestId: string, wait: string | null) =>
  errorResponse("RATE_LIMITED", requestId, {
    headers: wait ? { "retry-after": wait, "x-retry-after": wait } : {},
  });

const unavailable = (requestId: string) => errorResponse("SERVICE_UNAVAILABLE", requestId);

/**
 * A copy of `response` carrying the request's id. A copy, not a mutation: `Response.redirect`
 * has immutable headers. `new Headers(...)` keeps each `Set-Cookie` value separate.
 */
const withRequestId = (response: Response, requestId: string) => {
  const headers = new Headers(response.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

/**
 * Better Auth's own answer of status 400 or more, given the error body (orv144-route-answers): the
 * handler's status and headers stay (each `Set-Cookie` included) except `content-type` and
 * `content-length`; the body is dropped, so nothing of Better Auth's text reaches the answer.
 */
const asErrorAnswer = (response: Response, requestId: string) => {
  const headers = new Headers(response.headers);
  headers.delete("content-type");
  headers.delete("content-length");
  void response.body?.cancel();
  return errorResponse(codeOfStatus(response.status), requestId, {
    status: response.status,
    headers,
  });
};

const ended = (response: Response, reason?: Reason): Ended<Response> => ({
  value: response,
  ending: { ...endingOfStatus(response.status), ...(reason ? { reason } : {}) },
});

/**
 * A request that could start a sign-in: `POST /api/auth/sign-in/*` with a JSON media type, read the
 * way Better Auth does (lower-cased, the part before `;`, trimmed). Origin plays no part: Better
 * Auth checks it only with a cookie. Any other media type is refused by Better Auth and not counted,
 * so a cross-site form post cannot fill a network's bucket (ORV-122 row 25).
 */
const startsSignIn = (request: Request) =>
  request.method === "POST" &&
  new URL(request.url).pathname.startsWith("/api/auth/sign-in/") &&
  (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .split(";", 1)[0]
    ?.trim()
    .includes("application/json") === true;

export interface AuthRouteOptions {
  /** Counts one sign-in against the `sign-in` limit for this request's trusted IP (ORV-122). */
  consumeSignIn: (request: Request) => Promise<Consumed>;
}

/**
 * Wraps Better Auth's handler (ORV-112, ORV-122, ORV-141). `POST /api/auth/sign-in/*` with a JSON
 * body is counted against the `sign-in` limit first, in the bucket `signInWithGoogle` uses, and a refused request never
 * reaches the handler. The handler's own 429 from the shared limiter gets `Retry-After` and the
 * error body; a store failure answers 503; any other error answers 500 `INTERNAL_ERROR`. Every
 * answer carries the request's `x-request-id` (the proxy's, or a fresh one), and the boundary
 * writes one line per request. The handler's answers of 400 or more get the error body of ORV-144
 * (status and other headers kept); its answers below 400 pass through unchanged.
 */
export function authRoute(
  handler: (request: Request) => Promise<Response>,
  options: AuthRouteOptions,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const requestId = requestIdOf(request.headers);
    return atBoundary({ requestId, route: "api/auth" }, async () => {
      try {
        if (startsSignIn(request)) {
          // Wrapped so a count that throws before it returns a promise fails closed like a rejection.
          const counted = await (async () => options.consumeSignIn(request))().catch(
            (): Consumed => ({ ok: false, reason: "unavailable" }),
          );
          if (!counted.ok) {
            return counted.reason === "limited"
              ? ended(rateLimited(requestId, String(counted.retryAfter)))
              : ended(unavailable(requestId), "rate-limit");
          }
        }
        const response = await handler(request);
        if (response.status === 429) {
          return ended(rateLimited(requestId, response.headers.get("x-retry-after")));
        }
        if (response.status >= 400) return ended(asErrorAnswer(response, requestId));
        return ended(withRequestId(response, requestId));
      } catch (error) {
        if (error instanceof RateLimitUnavailable) {
          return ended(unavailable(requestId), "rate-limit");
        }
        return {
          value: errorResponse("INTERNAL_ERROR", requestId),
          ending: {
            ...endingOfStatus(500),
            reason: "unexpected",
            errorName: error instanceof Error ? error.name : "unknown",
          },
        };
      }
    });
  };
}
