import { auth } from "../../../../server/auth";

/** Better Auth's routes: Google sign-in, its callback, the session and sign-out. */
export const GET = (request: Request) => auth().handler(request);
export const POST = (request: Request) => auth().handler(request);
