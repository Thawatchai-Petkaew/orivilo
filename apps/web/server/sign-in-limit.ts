import "server-only";
import { LIMITS } from "@orivilo/auth";
import { limiter, subjectFromHeaders } from "./rate-limit";

/** The one sign-in count both doors call: `LIMITS["sign-in"]`, per trusted IP (ORV-122 row 24). */
export const consumeSignIn = (headers: Headers) =>
  limiter().consume(LIMITS["sign-in"], { ip: subjectFromHeaders(headers) });
