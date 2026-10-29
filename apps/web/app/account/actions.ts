"use server";

import { atBoundary, type Ended, requestIdOf } from "@orivilo/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../server/auth";
import { consumeSignIn } from "../../server/sign-in-limit";

/** What the sign-in form shows after a refusal; `null` before the first press. */
export type SignInState =
  { error: "rate-limited"; retryAfter: number } | { error: "failed" } | null;

/** What the sign-in work hands back: a form state, or the address to send the person to. */
type SignInWork = { state: SignInState } | { redirectTo: string };

/**
 * Starts Google sign-in; the form runs it through `useActionState`. The `sign-in` limit per network is counted first
 * (ORV-122): over it, or with the store down (a count that answers unavailable, throws or rejects,
 * ORV-123), OAuth is not started and no `verification` row is written. The count and OAuth are one
 * boundary (ORV-141): the line is written before `redirect` throws its Next error, so `ok` needs no
 * Next internal type.
 */
export async function signInWithGoogle(): Promise<SignInState> {
  const requestHeaders = await headers();
  const work = await atBoundary(
    { requestId: requestIdOf(requestHeaders), route: "account/signInWithGoogle" },
    async (): Promise<Ended<SignInWork>> => {
      // Wrapped so a count that throws before it returns a promise fails closed like a rejection
      // (ORV-123), as in `authRoute`. Only the count is guarded.
      const counted = await (async () => consumeSignIn(requestHeaders))().catch(
        (): { ok: false; reason: "unavailable" } => ({ ok: false, reason: "unavailable" }),
      );
      if (!counted.ok) {
        return counted.reason === "limited"
          ? {
              value: { state: { error: "rate-limited", retryAfter: counted.retryAfter } },
              ending: { level: "warn", outcome: "limited", reason: "rate-limited" },
            }
          : {
              value: { state: { error: "failed" } },
              ending: { level: "error", outcome: "unavailable", reason: "rate-limit" },
            };
      }
      const { url } = await auth().api.signInSocial({
        body: { provider: "google", callbackURL: "/account" },
      });
      if (!url) throw new Error("Google sign-in did not return a URL");
      return { value: { redirectTo: url }, ending: { level: "info", outcome: "ok" } };
    },
  );
  if ("redirectTo" in work) redirect(work.redirectTo);
  return work.state;
}

export async function signOut() {
  const requestHeaders = await headers();
  await atBoundary(
    { requestId: requestIdOf(requestHeaders), route: "account/signOut" },
    async (): Promise<Ended<void>> => {
      await auth().api.signOut({ headers: requestHeaders });
      return { value: undefined, ending: { level: "info", outcome: "ok" } };
    },
  );
  redirect("/account");
}
