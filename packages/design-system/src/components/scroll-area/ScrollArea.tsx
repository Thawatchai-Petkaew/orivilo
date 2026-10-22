"use client";

import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cx } from "../cx";

export interface ScrollAreaProps {
  /** Names the scrolling region; the keyboard reaches it with Tab and scrolls it with arrows. */
  label: string;
  /** Which way the content overflows. */
  orientation?: "vertical" | "horizontal" | "both" | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * A panel with its own scroll: block library, inspector, task list (catalog `base/scroll-area`).
 * The bar is drawn from tokens and shows whenever the content overflows, so it never hides from
 * someone using the keyboard. The viewport is a labelled, focusable region.
 */
export function ScrollArea({
  label,
  orientation = "vertical",
  className,
  children,
}: ScrollAreaProps) {
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";
  return (
    <ScrollAreaPrimitive.Root type="auto" className={cx("ds-scroll", className)}>
      <ScrollAreaPrimitive.Viewport
        className="ds-scroll__viewport"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {vertical ? (
        <ScrollAreaPrimitive.Scrollbar className="ds-scroll__bar" orientation="vertical">
          <ScrollAreaPrimitive.Thumb className="ds-scroll__thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {horizontal ? (
        <ScrollAreaPrimitive.Scrollbar className="ds-scroll__bar" orientation="horizontal">
          <ScrollAreaPrimitive.Thumb className="ds-scroll__thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {vertical && horizontal ? <ScrollAreaPrimitive.Corner /> : null}
    </ScrollAreaPrimitive.Root>
  );
}
