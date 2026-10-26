import { authRoute } from "@orivilo/auth";
import { auth } from "../../../../server/auth";

/** Better Auth's routes: Google sign-in, its callback, the session and sign-out. */
export const GET = authRoute((request) => auth().handler(request));
export const POST = authRoute((request) => auth().handler(request));
