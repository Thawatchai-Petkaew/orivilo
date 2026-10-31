import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

/**
 * The sidebar brand (ORV-118 slice B, spec row 22). The image is the generated horizontal lockup
 * (`pnpm --filter @orivilo/design-system logo-assets`), served from `./static`; it carries light
 * values only, so the manager is pinned to the light base instead of following the OS scheme.
 */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "ORIVILO",
    brandImage: "./orivilo-logo.svg",
  }),
});
