"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../server/auth";
import { consumeSignIn } from "../../server/sign-in-limit";

/** What the sign-in form shows after a refusal; `null` before the first press. */
export type SignInState =
  { error: "rate-limited"; retryAfter: number } | { error: "failed" } | null;

/** One JSON line by name only: no IP, key, header value, error message, error name or stack. */
function unavailable(): { ok: false; reason: "unavailable" } {
  console.error(
    JSON.stringify({ level: "error", route: "account/sign-in", outcome: "unavailable" }),
  );
  return { ok: false, reason: "unavailable" };
}

/**
 * Starts Google sign-in; the form runs it through `useActionState`. The `sign-in` limit per network is counted first
 * (ORV-122): over it, or with the store down (a count that answers unavailable, throws or rejects,
 * ORV-123), OAuth is not started and no `verification` row is written.
 */
export async function signInWithGoogle(): Promise<SignInState> {
  const requestHeaders = await headers();
  // Wrapped so a count that throws before it returns a promise fails closed like a rejection
  // (ORV-123), as in `authRoute`. Only the count is guarded.
  const counted = await (async () => consumeSignIn(requestHeaders))().catch(unavailable);
  if (!counted.ok) {
    return counted.reason === "limited"
      ? { error: "rate-limited", retryAfter: counted.retryAfter }
      : { error: "failed" };
  }
  const { url } = await auth().api.signInSocial({
    body: { provider: "google", callbackURL: "/account" },
  });
  if (!url) throw new Error("Google sign-in did not return a URL");
  redirect(url);
}

export async function signOut() {
  await auth().api.signOut({ headers: await headers() });
  redirect("/account");
}
