import type { Decorator, Preview } from "@storybook/react-vite";
import { type CSSProperties, useEffect } from "react";
import { FORCE_RE_RENDER } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import "../src/tokens/fonts.css";
import "../src/tokens/orivilo.css";
import "./preview.css";
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
 * A padded story gets `p-4` inside the surface (spec ORV-84, `surface-padding-1`): Storybook's own
 * 1rem body padding is white and sits outside the surface, so an item flush with the surface drew
 * its focus line and halo (4 px at most) and its Thai marks on that white margin. The surface owns
 * padding and centring, and `preview.css` takes Storybook's own box away (spec ORV-189).
 *
 * The surface also sets `--story-fill`, the height a board or a panel may fill (`fillHeight` in
 * `matrix.tsx`): the viewport less the surface padding of the layout. A centred story fills 0 px,
 * so it keeps the height it has.
 */
const FILL_BY_LAYOUT: Record<string, string> = {
  fullscreen: "100dvh",
  padded: "calc(100dvh - 2rem)",
  centered: "0px",
};

const withDesignProfile: Decorator = (Story, context) => {
  const layout = String(context.parameters["layout"]);
  const fill: CSSProperties & Record<"--story-fill", string> = {
    "--story-fill": FILL_BY_LAYOUT[layout] ?? "0px",
  };
  const layoutClass =
    layout === "padded"
      ? " p-4"
      : layout === "centered"
        ? " flex flex-col items-center justify-center p-4"
        : "";
  return (
    <DesignProfileBoundary
      mode={context.globals["mode"] as Mode}
      profile={context.globals["profile"] as ProfileId}
    >
      <div
        style={fill}
        className={`min-h-dvh bg-surface-canvas font-body text-text-primary${layoutClass}`}
      >
        <Story />
      </div>
    </DesignProfileBoundary>
  );
};

/**
 * Storybook-only force of `parameters.pseudo.hover` (storybook-addon-pseudo-states, spec ORV-84,
 * `hover-force-1`). The addon rewrites the `:hover` rules to `.pseudo-hover` only on channel events
 * and puts the class on the hover item inside a Storybook hook effect, and those effects run on
 * `STORY_RENDERED`: a portable-story run emits none of that, and the Storybook UI emits it after the
 * play, so the hover look arrived too late for the play's assertion. This decorator asks for the
 * rewrite once and puts the class on the hover item itself as soon as the item exists. An observer
 * keeps it there, since React Flow draws nodes and edges after the first render and a re-render can
 * rewrite a class. The recipes and the `:hover` rules stay as they are.
 */
const withPseudoHover: Decorator = (Story, context) => {
  const pseudo = context.parameters["pseudo"] as { hover?: readonly string[] } | undefined;
  const selectors = pseudo?.hover;
  useEffect(() => {
    if (selectors === undefined) return;
    addons.getChannel().emit(FORCE_RE_RENDER);
    const force = () => {
      for (const selector of selectors) {
        for (const el of document.querySelectorAll(selector)) {
          if (!el.classList.contains("pseudo-hover")) el.classList.add("pseudo-hover");
        }
      }
    };
    force();
    const observer = new MutationObserver(force);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [selectors]);
  return <Story />;
};

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
  decorators: [withDesignProfile, withLocale, withPseudoHover],
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
