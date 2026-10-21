import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/tokens/fonts.css";
import "../src/tokens/orivilo.css";
import {
  DesignProfileBoundary,
  type Mode,
  type ProfileId,
  PROFILES,
} from "../src/boundary/DesignProfileBoundary";
import { profileById } from "../src/profiles/index";

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

const preview: Preview = {
  decorators: [withDesignProfile],
  globalTypes: {
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
  initialGlobals: { mode: "light", profile: "neutral" },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
