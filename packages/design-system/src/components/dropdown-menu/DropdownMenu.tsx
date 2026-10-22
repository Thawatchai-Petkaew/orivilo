"use client";

import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { cx } from "../cx";
import { MenuItemBody } from "../menu-item";

export interface DropdownMenuProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Modal (default) blocks the page behind; `false` lets several menus stay open (the recipe matrix). */
  modal?: boolean | undefined;
  /** A `DropdownMenuTrigger` and a `DropdownMenuContent`. */
  children: ReactNode;
}

/**
 * A list of actions behind one trigger (DESIGN.md §6). Radix gives arrow keys, typeahead, Escape
 * and focus return; items share the `ds-menu` recipe with Select, so a menu reads the same
 * everywhere. Destructive items use `feedback.danger` and sit last (catalog rule).
 */
export function DropdownMenu({ modal = true, ...rest }: DropdownMenuProps) {
  return <Primitive.Root modal={modal} {...rest} />;
}

export function DropdownMenuTrigger({
  asChild = true,
  ...rest
}: ComponentPropsWithoutRef<typeof Primitive.Trigger>) {
  return <Primitive.Trigger asChild={asChild} {...rest} />;
}

export interface DropdownMenuContentProps extends ComponentPropsWithoutRef<
  typeof Primitive.Content
> {
  /** Names the menu when its trigger's text is not the name. */
  "aria-label"?: string | undefined;
}

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "start",
  ...rest
}: DropdownMenuContentProps) {
  return (
    <Primitive.Portal>
      <PortalScope>
        <Primitive.Content
          {...rest}
          sideOffset={sideOffset}
          align={align}
          className={cx("ds-menu", className)}
          data-menu="dropdown"
        />
      </PortalScope>
    </Primitive.Portal>
  );
}

export interface MenuItemProps {
  /** Shown as key caps after the label; from the command registry. */
  shortcut?: string | undefined;
  /** Uses `feedback.danger`; place it last. */
  destructive?: boolean | undefined;
  disabled?: boolean | undefined;
  onSelect?: ((event: Event) => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function DropdownMenuItem({
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

export function DropdownMenuSeparator() {
  return <Primitive.Separator className="ds-menu__separator" />;
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Primitive.Label className="ds-menu__label">{children}</Primitive.Label>;
}

export const DropdownMenuGroup = Primitive.Group;
