"use client";

import { type ReactNode, useId, useState } from "react";
import { fill } from "../../i18n/messages/index";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { MenuIcon } from "../icons";
import { markCurrent } from "../nav-item/current";
import { NavItem, type NavLinkComponent, type NavLinkItem } from "../nav-item/NavItem";
import { Sheet, SheetContent, SheetTrigger } from "../sheet/Sheet";

interface TopNavigationBaseProps {
  /** The first navigation's name, from the locale catalog: its landmark and its drawer's title. */
  name: string;
  /** The logo link, before the items and inside the `nav`. */
  brand?: ReactNode | undefined;
  /** The section links. With none, the row shows the brand and the actions and no opener. */
  items?: readonly NavLinkItem[] | undefined;
  /** Controls at the end of the row, after the `nav` and outside it. */
  actions?: ReactNode | undefined;
  /** The current path; with none, nothing is marked. */
  currentPath?: string | undefined;
  /** A router's link, taking `href`; `a` by default. */
  linkComponent?: NavLinkComponent | undefined;
  /** The width and padding of each row, so the shell sets them per route while the root stays full width. */
  contentClassName?: string | undefined;
  /** With `skipLabel`, a link that is the header's first child, out of view until it has focus. */
  skipHref?: string | undefined;
  skipLabel?: string | undefined;
}

/** A second row of links, with its own landmark name; it renders only when it has an item. */
type TopNavigationRows =
  | { subItems?: undefined; subName?: undefined }
  | { subItems: readonly NavLinkItem[]; subName: string };

export type TopNavigationProps = TopNavigationBaseProps & TopNavigationRows;

/**
 * The header of a screen: a skip link, a row with the brand, the section links and the actions,
 * and an optional second row (catalog `application/top-navigation`). Below 768 px of its own width
 * the links hide and an icon button opens a drawer with the same links in the same order, the
 * current one marked. The links, the current mark and the drawer are real; the routes in the
 * stories are mock.
 */
export function TopNavigation({
  name,
  brand,
  items = [],
  subItems = [],
  subName,
  actions,
  currentPath,
  linkComponent,
  contentClassName,
  skipHref,
  skipLabel,
}: TopNavigationProps) {
  const m = useMessages();
  const [open, setOpen] = useState(false);
  const subLabel = useId();
  const marks = markCurrent(items, currentPath);
  const subMarks = markCurrent(subItems, currentPath);
  const hasSub = subItems.length > 0;
  const row = (links: readonly NavLinkItem[], marked: typeof marks) => (
    <ul className="ds-top-nav__list">
      {links.map((item, i) => (
        <li key={item.href}>
          <NavItem item={item} mark={marked[i] ?? null} size="sm" linkComponent={linkComponent} />
        </li>
      ))}
    </ul>
  );
  const drawerList = (links: readonly NavLinkItem[], marked: typeof marks, label?: string) => (
    <ul className="ds-nav-drawer__list" aria-labelledby={label}>
      {links.map((item, i) => (
        <li key={item.href}>
          <NavItem
            item={item}
            mark={marked[i] ?? null}
            size="md"
            linkComponent={linkComponent}
            onNavigate={() => setOpen(false)}
          />
        </li>
      ))}
    </ul>
  );
  return (
    <header className="ds-top-nav">
      {skipHref && skipLabel ? (
        <a className="ds-top-nav__skip" href={skipHref}>
          {skipLabel}
        </a>
      ) : null}
      <div className={cx("ds-top-nav__row", contentClassName)}>
        <nav className="ds-top-nav__nav" aria-label={name}>
          {brand}
          {items.length > 0 ? row(items, marks) : null}
          {items.length > 0 ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={fill(m.nav.open, { name })}
                  className="ds-top-nav__opener"
                >
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="start" title={name} className="ds-nav-drawer">
                {drawerList(items, marks)}
                {hasSub ? (
                  <>
                    <p id={subLabel} className="ds-nav-drawer__label">
                      {subName}
                    </p>
                    {drawerList(subItems, subMarks, subLabel)}
                  </>
                ) : null}
              </SheetContent>
            </Sheet>
          ) : null}
        </nav>
        {actions ? <div className="ds-top-nav__actions">{actions}</div> : null}
      </div>
      {hasSub ? (
        <div className={cx("ds-top-nav__row", contentClassName)} data-row="sub">
          <nav className="ds-top-nav__nav" aria-label={subName}>
            {row(subItems, subMarks)}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
