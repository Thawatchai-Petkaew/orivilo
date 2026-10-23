import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

type BadgeBase = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  /** Status colours come from feedback tokens; `brand` is presence, never a status (DESIGN.md §8). */
  variant?: BadgeVariant | undefined;
  size?: "sm" | "md" | undefined;
  children?: ReactNode;
};

/** A dot or an icon before the word, never both. */
type BadgeMark =
  | {
      /** A dot in the variant's feedback ink before the word; hidden from assistive tech. */
      dot?: boolean | undefined;
      icon?: undefined;
    }
  | {
      /** An icon before the word, 14 px in sm and 16 px in md; hidden from assistive tech. */
      icon?: ReactNode | undefined;
      dot?: undefined;
    };

export type BadgeProps = BadgeBase & BadgeMark;

/**
 * A short status word next to a title. The word carries the meaning; colour never does alone, so
 * the dot and the icon are decoration (`aria-hidden`). Render it only with backing data (AGENTS.md rule 4).
 */
export function Badge({
  variant = "neutral",
  size = "md",
  dot,
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span {...rest} className={cx("ds-badge", className)} data-variant={variant} data-size={size}>
      {dot ? <span className="ds-badge__dot" aria-hidden="true" /> : null}
      {!dot && icon ? (
        <span className="ds-badge__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
