"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { CloseIcon, WarningIcon } from "../icons";

export interface DialogProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Modal (default): focus is trapped, the page behind is inert, a scrim covers it. `false` keeps
   * the page interactive and lets several dialogs stay open; previews and the recipe matrix use it.
   */
  modal?: boolean | undefined;
  /** A `DialogTrigger` and a `DialogContent`. */
  children: ReactNode;
}

/**
 * A short secondary task or a confirmation that must finish before the user returns (DESIGN.md
 * §6). Radix Dialog moves focus inside on open, traps it while open, returns it to the trigger on
 * close, and closes on Escape and outside click unless the content is `pending`.
 */
export function Dialog({ modal = true, ...rest }: DialogProps) {
  return <DialogPrimitive.Root modal={modal} {...rest} />;
}

/** Wraps the element that opens the dialog; `asChild` (default) keeps that element's own recipe. */
export function DialogTrigger({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger asChild={asChild} {...rest} />;
}

/** Closes the dialog; `asChild` (default) so a Button can be the cancel control. */
export function DialogClose({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close asChild={asChild} {...rest} />;
}

export type DialogVariant = "default" | "destructive";
export type DialogSize = "sm" | "md";

export interface DialogContentProps extends Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "title" | "aria-describedby"
> {
  /** Always visible; it is the dialog's accessible name. */
  title: ReactNode;
  /** One or two sentences under the title, linked as the accessible description. */
  description?: ReactNode | undefined;
  /** `destructive` puts a danger glyph before the title; the confirming Button is `destructive` too. */
  variant?: DialogVariant | undefined;
  /** `sm` for a confirmation, `md` for a short form. Longer tasks take a Sheet or a page. */
  size?: DialogSize | undefined;
  /** The task inside is running: Escape, the scrim and the close control do nothing; `aria-busy`. */
  pending?: boolean | undefined;
  /** What went wrong and how to fix it; announced, shown above the actions. */
  error?: ReactNode | undefined;
  /** The actions; the primary is named after the outcome, never "OK". */
  footer?: ReactNode | undefined;
  /** Where the portal mounts (a preview frame, a matrix cell); the body by default. */
  container?: HTMLElement | null | undefined;
  /** Accessible name of the close control. */
  closeLabel?: string | undefined;
  /** The body scrolls (a long list): it becomes a Tab stop so the keyboard can scroll it. */
  scrollable?: boolean | undefined;
  children?: ReactNode;
}

/**
 * The panel, rendered through a portal that re-opens the trigger's profile boundary. The close
 * control sits last in the DOM so first focus lands on the task's first control or the safe action;
 * the recipe places it top-right.
 */
export function DialogContent({
  title,
  description,
  variant = "default",
  size = "sm",
  pending = false,
  error,
  footer,
  container,
  closeLabel = "ปิด",
  scrollable = false,
  className,
  children,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ...rest
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal container={container ?? undefined}>
      <PortalScope>
        <DialogPrimitive.Overlay className="ds-dialog__scrim" />
        <DialogPrimitive.Content
          {...rest}
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cx("ds-dialog", size === "md" ? "max-w-lg" : "max-w-sm", className)}
          data-variant={variant}
          data-size={size}
          aria-busy={pending || undefined}
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
            onEscapeKeyDown?.(event);
          }}
          onPointerDownOutside={(event) => {
            if (pending) event.preventDefault();
            onPointerDownOutside?.(event);
          }}
          onInteractOutside={(event) => {
            if (pending) event.preventDefault();
            onInteractOutside?.(event);
          }}
        >
          <div className="ds-dialog__header">
            {variant === "destructive" ? (
              <WarningIcon className="ds-dialog__glyph size-5 shrink-0" />
            ) : null}
            <DialogPrimitive.Title className="ds-dialog__title">{title}</DialogPrimitive.Title>
          </div>
          {description ? (
            <DialogPrimitive.Description className="ds-dialog__description">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          {children ? (
            <div className="ds-dialog__body" tabIndex={scrollable ? 0 : undefined}>
              {children}
            </div>
          ) : null}
          {error ? (
            <p className="ds-dialog__error" role="alert">
              {error}
            </p>
          ) : null}
          {footer ? <div className="ds-dialog__footer">{footer}</div> : null}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={closeLabel}
              disabled={pending}
              className="ds-dialog__close"
            >
              <CloseIcon className="size-5" />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </PortalScope>
    </DialogPrimitive.Portal>
  );
}
