import { cx } from "../cx";
import { CheckIcon, DangerIcon, InfoIcon, WarningIcon } from "../icons";

export type FeaturedIconVariant = "success" | "warning" | "danger" | "info";
export type FeaturedIconSize = "sm" | "md" | "lg";

export interface FeaturedIconProps {
  /** The feedback kind. It sets the tint and the glyph; there is no default. */
  variant: FeaturedIconVariant;
  /** The tile at 32, 40 or 48 px (`size.control.*`), the glyph at 16, 20 or 24 px (`size.icon.*`). */
  size?: FeaturedIconSize | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/** One drawing per kind, so the kind never rests on colour alone (`fi-glyph-1`). */
const GLYPHS = {
  success: CheckIcon,
  warning: WarningIcon,
  danger: DangerIcon,
  info: InfoIcon,
} as const;

/**
 * A glyph on a tinted tile for one feedback kind (catalog `base/featured-icon`). The tile is
 * hidden from assistive technology: use it only beside words that say the same thing, and use
 * Badge for a status with no words.
 */
export function FeaturedIcon({ variant, size = "sm", className }: FeaturedIconProps) {
  const Glyph = GLYPHS[variant];
  return (
    <span
      className={cx("ds-featured-icon", className)}
      data-variant={variant}
      data-size={size}
      aria-hidden="true"
    >
      <Glyph />
    </span>
  );
}
