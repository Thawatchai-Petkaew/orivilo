"use client";

import { Slot } from "radix-ui";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";
import { SpinnerIcon } from "../icons";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "intent" | "link";
export type ControlSize = "sm" | "md" | "lg";

interface ButtonBaseProps extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /**
   * `primary` is the one action per view; `intent` is the one Intent Engine button per screen
   * (Studio only; inside a profile boundary it renders as that profile's primary action).
   * `link` is text in `text.link` that goes somewhere, with no fill and no border (DESIGN.md §8).
   */
  variant?: ButtonVariant | undefined;
  size?: ControlSize | undefined;
  /** Keeps the label, adds a spinner and a status line, and blocks the click until it ends. */
  loading?: boolean | undefined;
  /** What the status line announces while loading; the catalog's `button.working` by default. */
  loadingLabel?: string | undefined;
  /** An icon before the label, at the icon size of `size`. Ignored with `iconOnly`; `loading` replaces it. */
  iconLeading?: ReactNode | undefined;
  /** An icon after the label, at the icon size of `size`. Ignored with `iconOnly`. */
  iconTrailing?: ReactNode | undefined;
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
  loadingLabel,
  asChild = false,
  iconOnly = false,
  iconLeading,
  iconTrailing,
  className,
  children,
  onClick,
  type = "button",
  ...rest
}: ButtonProps) {
  const m = useMessages();
  const Comp = asChild ? Slot.Root : "button";
  // A caller's `aria-disabled` keeps the button focusable but inert, like loading (DESIGN.md §7).
  const ariaDisabled = rest["aria-disabled"] === true || rest["aria-disabled"] === "true";
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading || ariaDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  const icon = (node: ReactNode) => (
    <span className="ds-button__icon" aria-hidden="true">
      {node}
    </span>
  );
  // The spinner takes the leading slot (or opens it); the trailing icon stays.
  const leading = loading
    ? icon(<SpinnerIcon className="ds-spin" />)
    : iconLeading && !iconOnly
      ? icon(iconLeading)
      : null;
  const trailing = iconTrailing && !iconOnly ? icon(iconTrailing) : null;
  const status = loading ? (
    <span role="status" className="sr-only">
      {loadingLabel ?? m.button.working}
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
      aria-disabled={loading || ariaDisabled || undefined}
      onClick={handleClick}
    >
      {leading}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
      {trailing}
      {status}
    </Comp>
  );
}
