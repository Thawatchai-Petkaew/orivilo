import { randomUUID } from "node:crypto";
import { RateLimitUnavailable } from "./rate-limit.ts";

const envelope = (
  status: number,
  code: string,
  message: string,
  extra: Record<string, string> = {},
) =>
  new Response(
    JSON.stringify({ error: { code, message, requestId: randomUUID(), retryable: true } }),
    { status, headers: { "content-type": "application/json", ...extra } },
  );

/**
 * Wraps Better Auth's handler (ORV-112). Its 429 from the shared limiter gets `Retry-After` and
 * the error envelope; a store failure, which Better Auth does not catch, answers 503; any other
 * error is rethrown. Only the limiter makes 429s in this setup.
 */
export function authRoute(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      const response = await handler(request);
      if (response.status !== 429) return response;
      const wait = response.headers.get("x-retry-after");
      return envelope(
        429,
        "RATE_LIMITED",
        "Too many requests. Try again later.",
        wait ? { "retry-after": wait, "x-retry-after": wait } : {},
      );
    } catch (error) {
      if (error instanceof RateLimitUnavailable) {
        return envelope(503, "SERVICE_UNAVAILABLE", "Service unavailable. Try again later.");
      }
      throw error;
    }
  };
}
