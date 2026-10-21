import type { ReactNode } from "react";

export type Mode = "light" | "dark";

/** Profiles that exist today. E2-3 replaces this with resolved customer profiles. */
export const PROFILES = ["neutral"] as const;
export type ProfileId = (typeof PROFILES)[number];

export interface DesignProfileBoundaryProps {
  mode?: Mode | undefined;
  profile?: ProfileId | undefined;
  children: ReactNode;
}

/**
 * Minimal boundary for E2-0: it only scopes `data-mode` and `data-design-profile` so the token
 * CSS (`src/tokens/orivilo.css`) resolves underneath it. E2-3 replaces the internals (resolved
 * profile variables, portal scope); these props stay.
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
