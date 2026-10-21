import type { ReactNode } from "react";
import { PROFILE_IDS, Profile } from "../profiles/index";

/** A resolved mode. Token values exist for these two only. */
export type Mode = "light" | "dark";

/** What a boundary may be asked for: a fixed mode, or `system`, which follows the OS preference in CSS. */
export type BoundaryMode = Mode | "system";

/**
 * Profiles that exist today: `neutral` is the base token set, the others are the hand-made
 * overlays in `src/profiles/source/` (E2-2). Resolved customer profiles (E2-9) arrive through
 * the `Profile` object form below.
 */
export const PROFILES = PROFILE_IDS;
export type ProfileId = (typeof PROFILES)[number];

export interface DesignProfileBoundaryProps {
  /** `system` (default) follows `prefers-color-scheme` without a script; the shell uses it. */
  mode?: BoundaryMode | undefined;
  /**
   * A registered id, whose CSS ships in `src/profiles/generated.css`, or a `Profile` object, whose
   * CSS is rendered inline by this boundary so a profile resolved at runtime needs no build.
   */
  profile?: ProfileId | Profile | undefined;
  children: ReactNode;
}

/**
 * Scopes `data-mode` and `data-design-profile` so the token CSS (`src/tokens/orivilo.css`)
 * resolves underneath it. Both attributes are always set together: the profile CSS selects on the
 * pair, so a boundary that carried only one would resolve the wrong mode. A nested boundary resets
 * every semantic value to its own profile because a declaration on the element beats inheritance.
 * Portal scope (overlays rendered outside this subtree) is E2-5.
 */
export function DesignProfileBoundary({
  mode = "system",
  profile = "neutral",
  children,
}: DesignProfileBoundaryProps) {
  const runtime = profile instanceof Profile ? profile : undefined;
  const id = runtime ? runtime.id : profile;
  return (
    <div data-mode={mode} data-design-profile={id}>
      {runtime ? <style data-design-profile-css={runtime.id}>{runtime.emitCss()}</style> : null}
      {children}
    </div>
  );
}
