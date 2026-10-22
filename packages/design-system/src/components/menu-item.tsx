import type { ReactNode } from "react";
import { Kbd } from "./kbd/Kbd";

/** The inside of a menu item: label, then the shortcut as key caps (DropdownMenu, ContextMenu). */
export function MenuItemBody({
  shortcut,
  children,
}: {
  shortcut?: string | undefined;
  children: ReactNode;
}) {
  return (
    <>
      <span>{children}</span>
      {shortcut ? <Kbd shortcut={shortcut} className="ds-menu__shortcut" /> : null}
    </>
  );
}
