"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";

export interface TooltipProps {
  /** Plain text or inline content only; nothing interactive (catalog rule). */
  content: ReactNode;
  /** An optional second line that explains the effect; plain text only, like `content`. */
  description?: ReactNode | undefined;
  /** One focusable element that already carries its own accessible name. */
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  /** Which edge of the trigger the tooltip lines up with; `start` or `end` keeps it inside a panel edge. */
  align?: "start" | "center" | "end" | undefined;
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
  description,
  children,
  side = "top",
  align = "center",
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
            <TooltipPrimitive.Content
              className="ds-tooltip max-w-xs"
              side={side}
              align={align}
              sideOffset={6}
            >
              {content}
              {description === undefined ? null : (
                <>
                  {/* The space keeps the two lines apart in the description the trigger reads. */}{" "}
                  <span className="ds-tooltip__description">{description}</span>
                </>
              )}
            </TooltipPrimitive.Content>
          </PortalScope>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
