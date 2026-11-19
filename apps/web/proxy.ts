import { NextResponse, type NextRequest } from "next/server";
import { configuredAddress } from "@orivilo/auth/configured-address";
import { buildCsp, createNonce, CSP_HEADER } from "./security-headers";

// The literal equals REQUEST_ID_HEADER of @orivilo/auth (proxy.test.ts); the package index would
// pull Better Auth and the database client into the proxy bundle.
const REQUEST_ID_HEADER = "x-request-id";

// ORV-286 alias-host-1: in production, a request made to any host but the configured address goes
// to the configured address, so sign-in starts where Google returns. The target's origin is the
// configured address alone: its path and query are set on a URL made from it, never resolved
// against it, and no request value (Host, X-Forwarded-Host, a query parameter) chooses it.
// ORV-288 proxy-host-1: the compare reads the host of the request URL, never a header. That holds
// because on Vercel Next's `trustHostHeader` is on (ORV-288 comment 10713), so the request URL
// carries the host the person used. On a server where the request URL carries the bind address
// (Next builds it from the bind address when `trustHostHeader` is off), every request would be
// redirected; proxy.test.ts records both sides.
function aliasRedirect(request: NextRequest, requestId: string): NextResponse | undefined {
  if (process.env["VERCEL_ENV"] !== "production") return undefined;
  const address = configuredAddress(process.env);
  if (!address) return undefined;
  const target = new URL(address);
  const received = new URL(request.url);
  if (received.host === target.host) return undefined;
  target.pathname = received.pathname;
  target.search = received.search;
  const response = NextResponse.redirect(target, 307);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export function proxy(request: NextRequest) {
  // Server-made for every request the matcher passes, prefetches included; a client's value is
  // overwritten, never kept (ORV-141 orv141-request-id).
  const requestId = crypto.randomUUID();
  const redirect = aliasRedirect(request, requestId);
  if (redirect) return redirect;
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
