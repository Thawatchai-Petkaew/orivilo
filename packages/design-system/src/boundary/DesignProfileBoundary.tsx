import type { ReactNode } from "react";
import { PROFILE_IDS } from "../profiles/index";

export type Mode = "light" | "dark";

/**
 * Profiles that exist today: `neutral` is the base token set, the others are the hand-made
 * overlays in `src/profiles/source/` (E2-2). E2-3 adds the Studio's own entry; resolved customer
 * profiles (E2-9) arrive through the same list.
 */
export const PROFILES = PROFILE_IDS;
export type ProfileId = (typeof PROFILES)[number];

export interface DesignProfileBoundaryProps {
  mode?: Mode | undefined;
  profile?: ProfileId | undefined;
  children: ReactNode;
}

/**
 * Scopes `data-mode` and `data-design-profile` so the token CSS (`src/tokens/orivilo.css`)
 * resolves underneath it. Both attributes are always set together: the profile CSS selects on the
 * pair, so a boundary that carried only one would resolve the wrong mode. E2-3 adds the resolved
 * profile internals and E2-5 the portal scope; these props stay.
 */
export function DesignProfileBoundary({
  mode = "light",
  profile = "neutral",
  children,
}: DesignProfileBoundaryProps) {
  return (
    <div data-mode={mode} data-design-profile={profile}>
      {children}
    </div>
  );
}
