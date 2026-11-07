import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, createNonce, CSP_HEADER } from "./security-headers";

// The literal equals REQUEST_ID_HEADER of @orivilo/auth (proxy.test.ts); the package index would
// pull Better Auth and the database client into the proxy bundle.
const REQUEST_ID_HEADER = "x-request-id";

export function proxy(request: NextRequest) {
  // Server-made for every request the matcher passes, prefetches included; a client's value is
  // overwritten, never kept (ORV-141 orv141-request-id).
  const requestId = crypto.randomUUID();
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  // Next reads the nonce from the request CSP header and applies it to its scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set(CSP_HEADER, csp);
  return response;
}

// Skips only static files. Prefetches pass: Next hides `next-router-prefetch` from the proxy, so it
// cannot tell them apart, and a server action is a POST to its route that must get an id too.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
