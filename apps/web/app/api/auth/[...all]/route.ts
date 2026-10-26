import { authRoute } from "@orivilo/auth";
import { auth } from "../../../../server/auth";
import { consumeSignIn } from "../../../../server/sign-in-limit";

/** Better Auth's routes: Google sign-in, its callback, the session and sign-out. */
const route = authRoute((request) => auth().handler(request), {
  // The same count as the `signInWithGoogle` action (ORV-122).
  consumeSignIn: (request) => consumeSignIn(request.headers),
});
export const GET = route;
export const POST = route;
