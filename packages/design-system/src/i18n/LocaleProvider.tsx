"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale, type Localized, pick } from "./locale";
import { messagesFor, type Messages } from "./messages/index";

export interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  locale: Locale;
  children: ReactNode;
}

/**
 * The locale every component below reads (spec ORV-39). The app sets it from the user's choice
 * and Storybook from its toolbar; outside any provider the default is Thai, so a story or a
 * page without one keeps working. Nested providers override, like the profile boundary.
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo(() => ({ locale, messages: messagesFor(locale) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext)?.locale ?? DEFAULT_LOCALE;
}

/** The catalog of the current locale. */
export function useMessages(): Messages {
  return useContext(LocaleContext)?.messages ?? messagesFor(DEFAULT_LOCALE);
}

/** Picks the current locale's word from a `{ th, en }` pair (registry labels, canvas words). */
export function useWord(): <T>(words: Localized<T>) => T {
  const locale = useLocale();
  return useMemo(
    () =>
      <T,>(words: Localized<T>) =>
        pick(words, locale),
    [locale],
  );
}
