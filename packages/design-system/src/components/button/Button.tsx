"use client";

import { Slot } from "radix-ui";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { cx } from "../cx";
import { SpinnerIcon } from "../icons";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "intent";
export type ControlSize = "sm" | "md" | "lg";

interface ButtonBaseProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * `primary` is the one action per view; `intent` is the one Intent Engine button per screen
   * (Studio only; inside a profile boundary it renders as that profile's primary action).
   */
  variant?: ButtonVariant | undefined;
  size?: ControlSize | undefined;
  /** Keeps the label, adds a spinner and a status line, and blocks the click until it ends. */
  loading?: boolean | undefined;
  /** What the status line announces while loading. */
  loadingLabel?: string | undefined;
  /** Renders the child element with the button's recipe (a Link, a Radix trigger). */
  asChild?: boolean | undefined;
}

/** Icon-only buttons carry an accessible name; the type makes `aria-label` mandatory for them. */
export type ButtonProps = ButtonBaseProps &
  (
    | { iconOnly?: false | undefined; children: ReactNode }
    | { iconOnly: true; "aria-label": string; children: ReactNode }
  );

/**
 * The action control. Hover, focus and pressed are interaction states (handoff §14); `loading`
 * and `disabled` are the public ones. Built on a native button, or on the child through Radix Slot.
 */
export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  loadingLabel = "กำลังดำเนินการ",
  asChild = false,
  iconOnly = false,
  className,
  children,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  const spinner = loading ? <SpinnerIcon className="ds-spin size-4 shrink-0" /> : null;
  const status = loading ? (
    <span role="status" className="sr-only">
      {loadingLabel}
    </span>
  ) : null;
  return (
    <Comp
      {...rest}
      type={asChild ? undefined : type}
      className={cx("ds-button", className)}
      data-variant={variant}
      data-size={size}
      data-icon-only={iconOnly ? "" : undefined}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
    >
      {spinner}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {status}
    </Comp>
  );
}
