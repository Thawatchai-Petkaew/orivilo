import { Button, LOCALES, LOCALE_NAMES, type Locale } from "@orivilo/design-system";
import { setLocale } from "./actions";

/**
 * One button per locale, posting a server action that sets the cookie: works without client
 * JavaScript and never flashes the other language. The current locale is pressed and disabled.
 */
export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={setLocale} aria-label={label} className="flex items-center gap-1">
      {LOCALES.map((id) => (
        <Button
          key={id}
          type="submit"
          name="locale"
          value={id}
          variant="ghost"
          size="sm"
          lang={id}
          aria-pressed={id === locale}
          disabled={id === locale}
        >
          {LOCALE_NAMES[id]}
        </Button>
      ))}
    </form>
  );
}
