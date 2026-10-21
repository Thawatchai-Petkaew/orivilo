import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /** Status colours come from feedback tokens; `brand` is presence, never a status (DESIGN.md §8). */
  variant?: BadgeVariant | undefined;
  size?: "sm" | "md" | undefined;
}

/**
 * A short status word next to a title. The word carries the meaning; colour never does alone.
 * Render it only with backing data (AGENTS.md rule 4).
 */
export function Badge({ variant = "neutral", size = "md", className, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={cx("ds-badge", className)} data-variant={variant} data-size={size} />
  );
}
