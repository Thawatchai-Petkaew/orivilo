import { DEFAULT_LOCALE, isLocale, type Locale } from "@orivilo/design-system";
import { cookies } from "next/headers";
import { webMessages, type WebMessages } from "./messages";

/** The cookie the switch writes; a two-letter value, validated before use. */
export const LOCALE_COOKIE = "orv-locale";

/** The user's locale from the cookie, Thai when there is none (spec ORV-39 AC 11). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getWebMessages(): Promise<{ locale: Locale; m: WebMessages }> {
  const locale = await getLocale();
  return { locale, m: webMessages[locale] };
}
