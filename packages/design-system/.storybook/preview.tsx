import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "../src/tokens/fonts.css";
import "../src/tokens/orivilo.css";
import {
  DesignProfileBoundary,
  type Mode,
  type ProfileId,
  PROFILES,
} from "../src/boundary/DesignProfileBoundary";
import { profileById } from "../src/profiles/index";
import { DEFAULT_LOCALE, isLocale, LOCALE_NAMES, LOCALES, type Locale } from "../src/i18n/locale";
import { LocaleProvider } from "../src/i18n/LocaleProvider";

/**
 * Mode and profile come from the toolbar and reach the story only through the same boundary
 * component the app will use. A story never sets a colour itself (DESIGN.md §3, rules §Storybook).
 */
const withDesignProfile: Decorator = (Story, context) => (
  <DesignProfileBoundary
    mode={context.globals["mode"] as Mode}
    profile={context.globals["profile"] as ProfileId}
  >
    <div className="min-h-dvh bg-surface-canvas font-body text-text-primary">
      <Story />
    </div>
  </DesignProfileBoundary>
);

/**
 * The locale comes from the toolbar and reaches the story through the same provider the app uses
 * (spec ORV-39); the document's `lang` follows so screen readers switch voices.
 */
const withLocale: Decorator = (Story, context) => {
  const raw = context.globals["locale"];
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <LocaleProvider locale={locale}>
      <Story />
    </LocaleProvider>
  );
};

/**
 * Storybook opens in English by the owner's choice (2026-10-22); Thai stays one click away in the
 * toolbar. The play tests assert the Thai catalog, which is the source every other locale is typed
 * against, so a Vitest run starts in Thai.
 */
const TEST_LOCALE: unknown = (import.meta as { env?: Record<string, unknown> }).env?.[
  "STORYBOOK_TEST_LOCALE"
];
const INITIAL_LOCALE: Locale = isLocale(TEST_LOCALE) ? TEST_LOCALE : "en";

const preview: Preview = {
  decorators: [withDesignProfile, withLocale],
  globalTypes: {
    locale: {
      description: "UI language: every string comes from the locale catalog (spec ORV-39)",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: LOCALES.map((id) => ({ value: id, title: LOCALE_NAMES[id] })),
        dynamicTitle: true,
      },
    },
    mode: {
      description: "Colour mode, DESIGN.md §3.1 and §3.2",
      toolbar: {
        title: "Mode",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    profile: {
      description: "Design profile: neutral is the base set; the others are the E2-2 overlays",
      toolbar: {
        title: "Profile",
        icon: "paintbrush",
        items: PROFILES.map((id) => {
          const p = profileById(id);
          return { value: id, title: p ? `${p.name.en} (${p.name.th})` : "Neutral (base)" };
        }),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { mode: "light", profile: "neutral", locale: INITIAL_LOCALE },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
