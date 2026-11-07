"use client";

import { useMessages } from "../../i18n/LocaleProvider";
import { logoSvg, type LogoTone } from "./drawing";
import type { LogoKind } from "./geometry";

export type { LogoKind, LogoTone };

export interface LogoProps {
  /** Default "horizontal". */
  kind?: LogoKind | undefined;
  /** Rendered height in CSS px of the kind's whole viewBox (`logo-size-1`). Default 24. */
  height?: number | undefined;
  /** Default "full". */
  tone?: LogoTone | undefined;
  /** Default false: an image named from the locale catalog. True: hidden from assistive tech. */
  decorative?: boolean | undefined;
  /** Layout only (margin, self-alignment). */
  className?: string | undefined;
}

/**
 * The ORIVILO mark, wordmark and lockups (catalog `base/logo`). Colour comes from the `logo.*`
 * tokens through the recipe, so a profile and a mode repaint it; no colour, stroke, ground or width
 * can be passed. Below 20 px the mark switches to a heavier ring (`logo-size-1`), and no kind
 * renders below its minimum. Named by default; pass `decorative` when text beside it says the name.
 */
export function Logo({
  kind = "horizontal",
  height = 24,
  tone = "full",
  decorative = false,
  className,
}: LogoProps) {
  const m = useMessages();
  return logoSvg({
    kind,
    height,
    tone,
    name: decorative ? undefined : m.logo.name,
    className,
  });
}
