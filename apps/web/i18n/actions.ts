"use server";

import { isLocale } from "@orivilo/design-system";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./locale";

/** Sets the locale cookie from the switch's form and re-renders every page (spec ORV-39 AC 12). */
export async function setLocale(formData: FormData): Promise<void> {
  const value = formData.get("locale");
  if (!isLocale(value)) return;
  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
}
