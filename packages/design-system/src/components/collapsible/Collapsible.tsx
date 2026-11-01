"use client";

import { Collapsible as RadixCollapsible } from "radix-ui";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { CollapseIcon, ExpandIcon } from "../icons";

const OpenContext = createContext(false);

export interface CollapsibleProps {
  /** The open state when the caller holds it. Pair it with `onOpenChange`. */
  open?: boolean | undefined;
  /** The open state at first render when the component holds it. */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The trigger does nothing and shows Button's disabled look. */
  disabled?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  children: ReactNode;
}

export interface CollapsibleTriggerProps {
  /** The label. It stays the same open and closed; the chevron and `aria-expanded` carry the state. */
  children: ReactNode;
  /** Layout only. */
  className?: string | undefined;
}

export interface CollapsibleContentProps {
  children: ReactNode;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * A show and hide control (catalog `base/collapsible`) on the Radix primitive: the trigger's
 * ARIA, Enter and Space and the unmounting of closed children are Radix's. Closed, Radix keeps an
 * empty `hidden` content element and renders no children, so state inside the content is lost
 * when it closes.
 */
export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled,
  className,
  children,
}: CollapsibleProps) {
  const [held, setHeld] = useState(defaultOpen);
  const current = open ?? held;
  return (
    <RadixCollapsible.Root
      open={current}
      onOpenChange={(next) => {
        setHeld(next);
        onOpenChange?.(next);
      }}
      disabled={disabled}
      className={cx("ds-collapsible", className)}
    >
      <OpenContext.Provider value={current}>{children}</OpenContext.Provider>
    </RadixCollapsible.Root>
  );
}

/** A ghost Button whose chevron points down while closed and up while open. */
export function CollapsibleTrigger({ children, className }: CollapsibleTriggerProps) {
  const open = useContext(OpenContext);
  return (
    <RadixCollapsible.Trigger asChild>
      <Button
        variant="ghost"
        size="md"
        className={cx("ds-collapsible__trigger", className)}
        iconTrailing={open ? <CollapseIcon /> : <ExpandIcon />}
      >
        {children}
      </Button>
    </RadixCollapsible.Trigger>
  );
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  return (
    <RadixCollapsible.Content className={cx("ds-collapsible__content", className)}>
      {children}
    </RadixCollapsible.Content>
  );
}
