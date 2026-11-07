"use server";

import { atBoundary, type Ended, requestIdOf } from "@orivilo/auth";
import { isLocale } from "@orivilo/design-system";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE } from "./locale";

/**
 * Sets the locale cookie from the switch's form and re-renders every page (spec ORV-39 AC 12). It
 * runs inside the request boundary (ORV-142 row 11): an unknown value is a refusal, not an error.
 */
export async function setLocale(formData: FormData): Promise<void> {
  const requestHeaders = await headers();
  await atBoundary(
    { requestId: requestIdOf(requestHeaders), route: "i18n/setLocale" },
    async (): Promise<Ended<void>> => {
      const value = formData.get("locale");
      if (!isLocale(value)) {
        return {
          value: undefined,
          ending: { level: "info", outcome: "refused", reason: "invalid-input" },
        };
      }
      (await cookies()).set(LOCALE_COOKIE, value, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      revalidatePath("/", "layout");
      return { value: undefined, ending: { level: "info", outcome: "ok" } };
    },
  );
}
