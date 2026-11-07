import type { ComponentType } from "react";
import { cx } from "../cx";
import { CheckIcon, DangerIcon, InfoIcon, WarningIcon, type IconProps } from "../icons";

export type FeaturedIconVariant = "success" | "warning" | "danger" | "info" | "neutral";
export type FeaturedIconSize = "sm" | "md" | "lg";

/** A glyph from `icons.tsx`, as a component and never an element, so the tile sizes it. */
export type FeaturedIconGlyph = ComponentType<IconProps>;

type FeaturedIconKind =
  | { variant: "success" | "warning" | "danger" | "info"; icon?: never }
  | { variant: "neutral"; icon: FeaturedIconGlyph };

export type FeaturedIconProps = FeaturedIconKind & {
  /** The tile at 32, 40 or 48 px (`size.control.*`), the glyph at 16, 20 or 24 px (`size.icon.*`). */
  size?: FeaturedIconSize | undefined;
  /** Layout only. */
  className?: string | undefined;
};

/** One drawing per feedback kind, so the kind never rests on colour alone (`fi-glyph-1`). */
const GLYPHS = {
  success: CheckIcon,
  warning: WarningIcon,
  danger: DangerIcon,
  info: InfoIcon,
} as const;

/**
 * A glyph on a tile (catalog `base/featured-icon`). A feedback kind sets the tint and the glyph;
 * `neutral` is a quiet grey tile and takes the caller's `icon`. The tile is hidden from assistive
 * technology: use it only beside words that say the same thing, and use Badge for a status with
 * no words.
 */
export function FeaturedIcon(props: FeaturedIconProps) {
  const { variant, size = "sm", className } = props;
  const Glyph = props.variant === "neutral" ? props.icon : GLYPHS[props.variant];
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
