"use client";

import { Separator as RadixSeparator } from "radix-ui";
import { cx } from "../cx";

export interface SeparatorProps {
  /** `horizontal` runs across its parent; `vertical` stands as tall as its parent. */
  orientation?: "horizontal" | "vertical" | undefined;
  /**
   * True (the default): the line only divides on screen and a screen reader skips it. Pass false for
   * a real break between sections of content, which then has `role="separator"`.
   */
  decorative?: boolean | undefined;
  /** Layout only: the space beside the line is the caller's. */
  className?: string | undefined;
}

/**
 * A bare 1 px line between two blocks (catalog `base/separator`). It has no label, no button and
 * never takes focus; the role comes from Radix and is never written by hand.
 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
}: SeparatorProps) {
  return (
    <RadixSeparator.Root
      className={cx("ds-separator", className)}
      orientation={orientation}
      decorative={decorative}
    />
  );
}
