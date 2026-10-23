"use client";

import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { cx } from "../cx";
import { CheckIcon, RadioDotIcon } from "../icons";
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

export interface DropdownMenuCheckboxItemProps {
  checked?: boolean | undefined;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  shortcut?: string | undefined;
  disabled?: boolean | undefined;
  /** Close the menu on toggle; off by default so several options can be set in a row. */
  closeOnSelect?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * An on/off choice inside a menu (ORV-78). Checked shows a check glyph plus the selected fill, never
 * fill alone; the glyph column is kept when unchecked so labels line up with radio items.
 */
export function DropdownMenuCheckboxItem({
  shortcut,
  closeOnSelect = false,
  className,
  children,
  ...rest
}: DropdownMenuCheckboxItemProps) {
  return (
    <Primitive.CheckboxItem
      {...rest}
      className={cx("ds-menu__item", className)}
      data-checkable=""
      onSelect={closeOnSelect ? undefined : (event) => event.preventDefault()}
    >
      <span className="ds-menu__indicator" aria-hidden>
        <Primitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </Primitive.ItemIndicator>
      </span>
      <MenuItemBody shortcut={shortcut}>{children}</MenuItemBody>
    </Primitive.CheckboxItem>
  );
}

export interface DropdownMenuRadioGroupProps {
  value?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  children: ReactNode;
}

/** One of a few choices inside a menu (ORV-78); a choice closes the menu like an action. */
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  return <Primitive.RadioGroup {...props} />;
}

export interface DropdownMenuRadioItemProps {
  value: string;
  shortcut?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function DropdownMenuRadioItem({
  shortcut,
  className,
  children,
  ...rest
}: DropdownMenuRadioItemProps) {
  return (
    <Primitive.RadioItem {...rest} className={cx("ds-menu__item", className)} data-checkable="">
      <span className="ds-menu__indicator" aria-hidden>
        <Primitive.ItemIndicator>
          <RadioDotIcon className="size-4" fill="currentColor" />
        </Primitive.ItemIndicator>
      </span>
      <MenuItemBody shortcut={shortcut}>{children}</MenuItemBody>
    </Primitive.RadioItem>
  );
}

export function DropdownMenuSeparator() {
  return <Primitive.Separator className="ds-menu__separator" />;
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Primitive.Label className="ds-menu__label">{children}</Primitive.Label>;
}

export const DropdownMenuGroup = Primitive.Group;
