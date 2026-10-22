"use client";

import { ContextMenu as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { cx } from "../cx";
import type { MenuItemProps } from "../dropdown-menu/DropdownMenu";
import { MenuItemBody } from "../menu-item";

export interface ContextMenuProps {
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** A `ContextMenuTrigger` around the surface and a `ContextMenuContent`. */
  children: ReactNode;
}

/**
 * Right-click or long-press on a surface (DESIGN.md §6). Opens at the pointer; on the keyboard,
 * Shift+F10 is the registry's `app.open-context-menu`, which the caller turns into a `contextmenu`
 * event on the focused element (`openContextMenuAt`). Never the only way to reach an action.
 */
export function ContextMenu(props: ContextMenuProps) {
  return <Primitive.Root {...props} />;
}

export function ContextMenuTrigger({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof Primitive.Trigger>) {
  return <Primitive.Trigger asChild={asChild} {...rest} />;
}

export interface ContextMenuContentProps extends ComponentPropsWithoutRef<
  typeof Primitive.Content
> {
  "aria-label"?: string | undefined;
}

export function ContextMenuContent({ className, ...rest }: ContextMenuContentProps) {
  return (
    <Primitive.Portal>
      <PortalScope>
        <Primitive.Content {...rest} className={cx("ds-menu", className)} data-menu="context" />
      </PortalScope>
    </Primitive.Portal>
  );
}

export function ContextMenuItem({
  shortcut,
  destructive,
  className,
  children,
  ...rest
}: MenuItemProps) {
  return (
    <Primitive.Item
      {...rest}
      className={cx("ds-menu__item", className)}
      data-destructive={destructive ? "" : undefined}
    >
      <MenuItemBody shortcut={shortcut}>{children}</MenuItemBody>
    </Primitive.Item>
  );
}

export function ContextMenuSeparator() {
  return <Primitive.Separator className="ds-menu__separator" />;
}

export function ContextMenuLabel({ children }: { children: ReactNode }) {
  return <Primitive.Label className="ds-menu__label">{children}</Primitive.Label>;
}

export const ContextMenuGroup = Primitive.Group;

/**
 * Opens the context menu at an element from the keyboard (Shift+F10): dispatches the same
 * `contextmenu` event a right-click would, at the element's centre.
 */
export function openContextMenuAt(element: Element): void {
  const r = element.getBoundingClientRect();
  element.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2,
    }),
  );
}
