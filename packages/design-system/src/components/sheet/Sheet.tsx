"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { CloseIcon } from "../icons";

export interface SheetProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Modal (default) traps focus and covers the board with a scrim; `false` for previews. */
  modal?: boolean | undefined;
  /** A `SheetTrigger` and a `SheetContent`. */
  children: ReactNode;
}

/**
 * A side panel for a longer task that keeps the board in view: the inspector on small screens
 * (catalog `application/sheet`). Same behaviour as Dialog (Radix Dialog): focus moves in, stays in
 * while open, returns to the trigger, and Escape closes unless the content is `pending`.
 */
export function Sheet({ modal = true, ...rest }: SheetProps) {
  return <DialogPrimitive.Root modal={modal} {...rest} />;
}

/** Wraps the element that opens the sheet; `asChild` (default) keeps that element's recipe. */
export function SheetTrigger({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger asChild={asChild} {...rest} />;
}

/** Closes the sheet; `asChild` (default) so a Button can be the control. */
export function SheetClose({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close asChild={asChild} {...rest} />;
}

export type SheetSize = "md" | "lg";
export type SheetSide = "start" | "end";

export interface SheetContentProps extends Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "title" | "aria-describedby"
> {
  /** Always visible; it is the sheet's accessible name. */
  title: ReactNode;
  description?: ReactNode | undefined;
  /** The edge it slides from; `end` (default) is where the inspector lives. */
  side?: SheetSide | undefined;
  /** `md` 480 px, `lg` 640 px; never wider than the viewport less the gutter. */
  size?: SheetSize | undefined;
  /** Work in progress: Escape, the scrim and the close control do nothing; `aria-busy`. */
  pending?: boolean | undefined;
  error?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  /** Where the portal mounts (a preview frame); the body by default. */
  container?: HTMLElement | null | undefined;
  closeLabel?: string | undefined;
  children?: ReactNode;
}

/**
 * The panel, rendered through a portal that re-opens the trigger's profile boundary. The body
 * scrolls on its own and is a Tab stop, so the keyboard can scroll a long inspector.
 */
export function SheetContent({
  title,
  description,
  side = "end",
  size = "md",
  pending = false,
  error,
  footer,
  container,
  closeLabel,
  className,
  children,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ...rest
}: SheetContentProps) {
  const m = useMessages();
  return (
    <DialogPrimitive.Portal container={container ?? undefined}>
      <PortalScope>
        <DialogPrimitive.Overlay className="ds-side-sheet__scrim" />
        <DialogPrimitive.Content
          {...rest}
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cx("ds-side-sheet", className)}
          data-side={side}
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
          <div className="ds-side-sheet__header">
            <DialogPrimitive.Title className="ds-side-sheet__title">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="ds-side-sheet__description">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {children ? (
            <div className="ds-side-sheet__body" tabIndex={0}>
              {children}
            </div>
          ) : null}
          {error ? (
            <p className="ds-side-sheet__error" role="alert">
              {error}
            </p>
          ) : null}
          {footer ? <div className="ds-side-sheet__footer">{footer}</div> : null}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={closeLabel ?? m.dialog.close}
              disabled={pending}
              className="ds-side-sheet__close"
            >
              <CloseIcon className="size-5" />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </PortalScope>
    </DialogPrimitive.Portal>
  );
}
