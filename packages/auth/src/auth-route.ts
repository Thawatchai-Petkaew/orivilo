import { randomUUID } from "node:crypto";
import { type Consumed, RateLimitUnavailable } from "./rate-limit.ts";

const envelope = (
  status: number,
  code: string,
  message: string,
  extra: Record<string, string> = {},
) => {
  const requestId = randomUUID();
  return new Response(JSON.stringify({ error: { code, message, requestId, retryable: true } }), {
    status,
    headers: { "content-type": "application/json", "x-request-id": requestId, ...extra },
  });
};

const rateLimited = (wait: string | null) =>
  envelope(
    429,
    "RATE_LIMITED",
    "Too many requests. Try again later.",
    wait ? { "retry-after": wait, "x-retry-after": wait } : {},
  );

/** One JSON line by name only: no key, IP, header value, error message or stack. */
const unavailable = () => {
  const response = envelope(503, "SERVICE_UNAVAILABLE", "Service unavailable. Try again later.");
  console.error(
    JSON.stringify({
      level: "error",
      requestId: response.headers.get("x-request-id"),
      route: "auth",
      outcome: "unavailable",
    }),
  );
  return response;
};

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
 * Wraps Better Auth's handler (ORV-112, ORV-122). `POST /api/auth/sign-in/*` with a JSON body is counted against
 * the `sign-in` limit first, in the bucket `signInWithGoogle` uses, and a refused request never
 * reaches the handler. The handler's own 429 from the shared limiter gets `Retry-After` and the
 * error envelope; a store failure answers 503 and is logged once; any other error is rethrown.
 * Every answer written here carries `x-request-id`, equal to the body's `requestId`.
 */
export function authRoute(
  handler: (request: Request) => Promise<Response>,
  options: AuthRouteOptions,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      if (startsSignIn(request)) {
        // Wrapped so a count that throws before it returns a promise fails closed like a rejection.
        const counted = await (async () => options.consumeSignIn(request))().catch(
          (): Consumed => ({ ok: false, reason: "unavailable" }),
        );
        if (!counted.ok) {
          return counted.reason === "limited"
            ? rateLimited(String(counted.retryAfter))
            : unavailable();
        }
      }
      const response = await handler(request);
      if (response.status !== 429) return response;
      return rateLimited(response.headers.get("x-retry-after"));
    } catch (error) {
      if (error instanceof RateLimitUnavailable) return unavailable();
      throw error;
    }
  };
}
