"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";

export interface TooltipProps {
  /** Plain text or inline content only; nothing interactive (catalog rule). */
  content: ReactNode;
  /** One focusable element that already carries its own accessible name. */
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  /** Milliseconds before it opens on hover; focus opens it at once. */
  delay?: number | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

/** Group of tooltips that share a skip delay; optional, one per app shell is enough. */
export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * A short label for an icon-only control or a truncated value. Radix opens it on focus as well
 * as hover, links it to the trigger with `aria-describedby`, and closes it on Escape. The content
 * re-opens the trigger's profile inside the portal.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delay = 300,
  open,
  defaultOpen,
  onOpenChange,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <PortalScope>
            <TooltipPrimitive.Content className="ds-tooltip max-w-xs" side={side} sideOffset={6}>
              {content}
            </TooltipPrimitive.Content>
          </PortalScope>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
