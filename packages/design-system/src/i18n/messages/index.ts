/**
 * The catalogs without React, for pure modules (graph rules, key words) and for the provider.
 * `th.ts` defines the shape; `en.ts` is typed against it, so a missing key is a type error and
 * `tests/check-i18n.test.ts` proves the placeholders agree.
 */
import { DEFAULT_LOCALE, type Locale } from "../locale";
import { en } from "./en";
import { th, type Messages } from "./th";

export type { Messages } from "./th";

const CATALOGS: Record<Locale, Messages> = { th, en };

export function messagesFor(locale: Locale = DEFAULT_LOCALE): Messages {
  return CATALOGS[locale];
}

export type FillParams = Record<string, string | number>;

/** The placeholder names a template spells as `{name}`. */
export function placeholdersOf(template: string): string[] {
  return [...template.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1] as string);
}

/**
 * Replaces every `{name}` with its value. A placeholder without a value throws, so a missing
 * parameter fails a test instead of reaching a user as braces.
 */
export function fill(template: string, params: FillParams = {}): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`i18n: no value for {${name}} in "${template}"`);
    return String(value);
  });
}
