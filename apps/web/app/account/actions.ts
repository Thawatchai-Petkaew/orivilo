"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../server/auth";

export async function signInWithGoogle() {
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
