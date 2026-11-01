"use client";

import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";
import { SpinnerIcon } from "../icons";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** The ring at 16, 20 or 24 px (`size.icon.sm`, `.md`, `.lg`). `lg` puts the label under the ring. */
  size?: SpinnerSize | undefined;
  /** The status text; the catalog's `spinner.loading` by default. */
  label?: string | undefined;
  /** Keeps the label in the status region but hides it from the eye. */
  labelHidden?: boolean | undefined;
  /**
   * The ring alone, hidden from assistive technology, with no status region and no label. For a
   * control that owns its status (Button while loading). It takes the ink and size of its slot.
   */
  decorative?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * The waiting ring (catalog `base/spinner`). One `role="status"` holds the hidden ring and the
 * label, so a screen reader hears the state in the person's language. The ring keeps turning
 * under reduced motion: it is essential motion and the label carries the state.
 */
export function Spinner({
  size = "md",
  label,
  labelHidden = false,
  decorative = false,
  className,
}: SpinnerProps) {
  const m = useMessages();
  const ring = (
    <SpinnerIcon
      className={cx("ds-spinner__ring", "ds-spin", decorative && className)}
      data-size={size}
      aria-hidden="true"
    />
  );
  if (decorative) return ring;
  return (
    <span
      role="status"
      className={cx("ds-spinner", className)}
      data-size={size}
      data-label-hidden={labelHidden ? "" : undefined}
    >
      {ring}
      <span className={cx("ds-spinner__label", labelHidden && "sr-only")}>
        {label ?? m.spinner.loading}
      </span>
    </span>
  );
}
