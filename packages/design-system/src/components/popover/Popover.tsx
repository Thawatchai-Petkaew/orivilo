"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { cx } from "../cx";

export interface PopoverProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** A `PopoverTrigger` and a `PopoverContent`. */
  children: ReactNode;
}

/**
 * A small task anchored to a trigger (DESIGN.md §6). Radix moves focus inside on open, returns it
 * on close, and closes on Escape and outside click. The content re-opens the trigger's profile
 * inside the portal.
 */
export function Popover(props: PopoverProps) {
  return <PopoverPrimitive.Root {...props} />;
}

/** Wraps the element that opens the popover; `asChild` (default) keeps that element's own recipe. */
export function PopoverTrigger({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger asChild={asChild} {...rest} />;
}

/** Closes the popover; `asChild` (default) so a Button can be the close control. */
export function PopoverClose({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close asChild={asChild} {...rest} />;
}

export interface PopoverContentProps extends ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
> {
  /** Names the dialog for assistive technology when it has no visible heading. */
  "aria-label"?: string | undefined;
}

export function PopoverContent({
  className,
  sideOffset = 6,
  align = "start",
  ...rest
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PortalScope>
        <PopoverPrimitive.Content
          {...rest}
          sideOffset={sideOffset}
          align={align}
          className={cx("ds-popover", className)}
        />
      </PortalScope>
    </PopoverPrimitive.Portal>
  );
}
