"use client";

import { Slot } from "radix-ui";
import { Children, type ReactNode, useEffect, useRef, useState } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { EllipsisIcon } from "../icons";
import { collapseTrail } from "./collapse";

export interface BreadcrumbProps {
  /** The crumbs as direct children, in trail order: `BreadcrumbLink`s, then one `BreadcrumbPage`. */
  children: ReactNode;
  /**
   * How many crumbs show before the middle ones hide behind an ellipsis button; 4 by default,
   * 0 turns collapsing off. The first crumb stays and the last `maxVisible - 1` stay.
   */
  maxVisible?: number | undefined;
  /** The landmark's name, replacing the catalog's `breadcrumb.label`; unique among a page's navs. */
  "aria-label"?: string | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * A trail of places from the project down to the page the person is on (ORV-229). A native `nav`
 * holding an ordered list; the component wraps each crumb in its `li` and adds the slashes and the
 * ellipsis. Over `maxVisible` crumbs, a press on the ellipsis shows the hidden crumbs in place and
 * moves focus to the first of them; the trail stays open until it unmounts.
 */
export function Breadcrumb({
  children,
  maxVisible,
  "aria-label": ariaLabel,
  className,
}: BreadcrumbProps) {
  const m = useMessages();
  const list = useRef<HTMLOListElement>(null);
  /** The crumbs that were hidden when the ellipsis was pressed; null while the trail is collapsed. */
  const [revealed, setRevealed] = useState<number[] | null>(null);
  const crumbs = Children.toArray(children);
  const { kept, hidden } =
    revealed === null ? collapseTrail(crumbs.length, maxVisible) : collapseTrail(crumbs.length, 0);
  const rows = kept.flatMap<number | "more">((index, position) =>
    position === 0 && hidden.length > 0 ? [index, "more"] : [index],
  );

  // The button that held focus is gone, so focus goes to the link of the first crumb revealed.
  useEffect(() => {
    if (revealed === null) return;
    for (const index of revealed) {
      const link = list.current?.children[index]?.querySelector<HTMLElement>("a[href]");
      if (link) {
        link.focus();
        return;
      }
    }
  }, [revealed]);

  return (
    <nav aria-label={ariaLabel ?? m.breadcrumb.label} className={cx("ds-breadcrumb", className)}>
      <ol ref={list} className="ds-breadcrumb__list">
        {rows.map((row, position) => (
          <li key={row} className="ds-breadcrumb__item">
            {row === "more" ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={m.breadcrumb.showAll}
                onClick={() => setRevealed(hidden)}
              >
                <EllipsisIcon />
              </Button>
            ) : (
              crumbs[row]
            )}
            {position < rows.length - 1 ? (
              <span className="ds-breadcrumb__separator" aria-hidden="true">
                /
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface BreadcrumbLinkBaseProps {
  /** The crumb's name. Left out, `null` or `""`, it reads as the catalog's `breadcrumb.missing`. */
  children?: ReactNode | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * A link crumb: an `a`, or with `asChild` the child element (a router's Link) with the crumb's
 * recipe, through Radix Slot as Button does. The `href` comes from route code, never from user text.
 * With `asChild` the child owns its text.
 */
export type BreadcrumbLinkProps = BreadcrumbLinkBaseProps &
  ({ asChild?: false | undefined; href: string } | { asChild: true; href?: string | undefined });

export function BreadcrumbLink({
  href,
  asChild = false,
  children,
  className,
}: BreadcrumbLinkProps) {
  const m = useMessages();
  const Comp = asChild ? Slot.Root : "a";
  const blank = children === undefined || children === null || children === "";
  return (
    <Comp href={href} className={cx("ds-breadcrumb__link", className)}>
      {asChild ? children : blank ? m.breadcrumb.missing : children}
    </Comp>
  );
}

export interface BreadcrumbPageProps {
  /** The current page's name. Left out, `null` or `""`, it reads as the catalog's `breadcrumb.missing`. */
  children?: ReactNode | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * The page the person is on: the last crumb, not a link and not a Tab stop, marked
 * `aria-current="page"`. Place one, last.
 */
export function BreadcrumbPage({ children, className }: BreadcrumbPageProps) {
  const m = useMessages();
  const blank = children === undefined || children === null || children === "";
  return (
    <span aria-current="page" className={cx("ds-breadcrumb__page", className)}>
      {blank ? m.breadcrumb.missing : children}
    </span>
  );
}
