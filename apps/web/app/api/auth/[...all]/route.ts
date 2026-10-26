import { authRoute, LIMITS } from "@orivilo/auth";
import { auth } from "../../../../server/auth";
import { limiter, subjectFromHeaders } from "../../../../server/rate-limit";

/** Better Auth's routes: Google sign-in, its callback, the session and sign-out. */
const route = authRoute((request) => auth().handler(request), {
  // The same bucket and subject as the `signInWithGoogle` action (ORV-122).
  consumeSignIn: (request) =>
    limiter().consume(LIMITS["sign-in"], { ip: subjectFromHeaders(request.headers) }),
});
export const GET = route;
export const POST = route;
