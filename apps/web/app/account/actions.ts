"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../server/auth";
import { consumeSignIn } from "../../server/sign-in-limit";

/** What the sign-in form shows after a refusal; `null` before the first press. */
export type SignInState =
  { error: "rate-limited"; retryAfter: number } | { error: "failed" } | null;

/**
 * Starts Google sign-in; the form runs it through `useActionState`. The `sign-in` limit per network is counted first
 * (ORV-122): over it, or with the store down, OAuth is not started and no `verification` row is
 * written.
 */
export async function signInWithGoogle(): Promise<SignInState> {
  const counted = await consumeSignIn(await headers());
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
